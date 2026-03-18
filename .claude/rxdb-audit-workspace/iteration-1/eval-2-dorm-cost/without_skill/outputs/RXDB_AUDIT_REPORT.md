# Dorm RxDB Sync Efficiency Audit

**Date:** 2026-03-18
**Scope:** Pull-only replication between RxDB (IndexedDB) and Neon PostgreSQL
**Verdict:** The sync architecture is well-designed for quota efficiency, but there are several concrete issues causing unnecessary Neon calls.

---

## Architecture Summary

| Aspect | Implementation | File |
|--------|---------------|------|
| Replication mode | Pull-only, checkpoint-based | `src/lib/db/replication.ts` |
| Collections synced | 14 | `replication.ts:5-9` |
| Batch size | 200 docs per pull | `replication.ts:124` |
| Polling | **None** (`live: false`) | `replication.ts:126` |
| Retry interval | 120s (transient errors only) | `replication.ts:127` |
| Startup | 1 health check + 14 one-shot pulls | `replication.ts:45-153` |
| Post-mutation | Targeted `resyncCollection()` per entity | `replication.ts:166-173` |
| Quota protection | Preflight health check + `neonDown` flag + 402 detection | `replication.ts:13-34, 96-103` |

**Good decisions already in place:**
- No live polling -- pulls only happen on startup and after mutations
- Checkpoint pagination with microsecond-precision timestamps prevents infinite re-pull loops (`+server.ts:150-159`)
- `neonDown` global flag halts all replication when quota is exceeded
- Preflight health check prevents 14 parallel pulls when Neon is unreachable
- `live: false` means RxDB does not set up any interval-based polling

---

## Issue 1: Startup Fires 15 Neon Queries (1 Health + 14 Pulls)

**File:** `src/routes/+layout.svelte:72-84`, `src/lib/db/replication.ts:45-153`

On every page load (after login), the app:
1. Hits `/api/rxdb/health` which runs `SELECT 1` against Neon (`src/routes/api/rxdb/health/+server.ts:9`)
2. Fires 14 parallel pull requests, one per collection

If the user's data hasn't changed since the last visit, each pull still executes a full SQL query against Neon:

```sql
SELECT *, to_char(COALESCE(updated_at, ...) ...) FROM <table>
WHERE COALESCE(updated_at, ...) > <checkpoint>::timestamptz
   OR (COALESCE(updated_at, ...) = <checkpoint>::timestamptz AND id > <checkpoint_id>)
ORDER BY ... LIMIT 200
```

Even when 0 rows are returned, that is **15 Neon HTTP round-trips on every page load**.

**Impact:** For a dorm app with ~5-10 users, this means 75-150 Neon queries per page-load cycle across all users. On the Neon free tier (0.25 compute-hours/month), each query wakes the compute endpoint if it has scaled to zero.

**Recommendation:**
- Add a single `/api/rxdb/pull/changeset-count` endpoint that returns the total count of changed rows across all 14 tables since the last checkpoint, in one query. If 0, skip all 14 pulls.
- Alternatively, batch all 14 collection pulls into a single server endpoint that returns a combined payload, reducing 14 HTTP round-trips to 1.

---

## Issue 2: Double Resync After Optimistic Writes (Most Common Waste)

**Affected files:** All `optimistic-*.ts` modules and their consuming pages.

The optimistic write pattern is: upsert into RxDB immediately, then call `bgResync('collection')` which pulls from Neon. This is correct. **However**, many pages ALSO call `resyncCollection()` separately after the same server action succeeds.

### Example: Tenants

1. `optimisticDeleteTenant()` is called at `tenants/+page.svelte:211`
2. Inside `optimistic.ts:104`, `bgResync('tenants')` fires (Neon query #1)
3. On error path, the page calls `resyncCollection('tenants')` again at lines 231-232 and 237-238

The error-path resync is fine (it's a fallback). But the optimistic module **always** calls `bgResync` at `optimistic.ts:75` and `optimistic.ts:104`, even on the success path. This means: the server action writes to Neon, `bgResync` pulls back the same data that was just written. The optimistic local write already has the correct data.

### Example: Transactions (Worst Case)

`optimistic-transactions.ts:50-51` fires `bgResync('payments')` AND `bgResync('billings')` after every revert. Then `transactions/+page.svelte:140-141` calls `resyncCollection('payments')` and `resyncCollection('billings')` again in `onResult`. That is **4 Neon queries for 1 mutation** (2 from optimistic + 2 from page).

### Example: Utility Billings

`optimistic-utility-billings.ts:22-24` fires bgResync for **3 collections** (readings, billings, meters) after every utility data change.

### Example: Leases

`leases/+page.svelte:296-300` resyncs **5 collections** (leases, lease_tenants, billings, payments, payment_allocations) after every lease action. If the optimistic module also calls bgResync, that could be up to 10 Neon queries per mutation.

### Example: Budgets

`budgets/+page.svelte:346` resyncs both `budgets` AND `properties` after any budget action. The properties collection almost certainly hasn't changed.

**Impact:** Every single mutation in the app triggers 1-5 unnecessary Neon queries. For a dorm with daily billing/payment activity, this could be 50-100 wasted queries per day.

**Recommendation:**
- Remove `bgResync()` from optimistic modules. The optimistic write already has the correct data. Only resync on error (when the server rejects the mutation).
- OR remove the manual `resyncCollection()` calls from pages that already use optimistic modules.
- Never resync unrelated collections (e.g., don't resync `properties` after a budget change unless the action actually modifies properties).

---

## Issue 3: `SELECT *` on Every Pull (Data Transfer Waste)

**File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:161-162`

```typescript
const rows = await db
    .select({ _all: table, _rawUpdatedAt: rawTsExpr })
    .from(table)
```

This selects ALL columns from every table on every pull. For collections like `tenants` (15 fields including `emergency_contact` JSON and `profile_picture_url`), this transfers more data than needed.

On Neon's free tier, data transfer is metered. Each pull transfers the full row payload even when only `updated_at` changed.

**Impact:** Moderate. For a small dorm (< 200 tenants), this is fine. For scale, it wastes bandwidth.

**Recommendation:** Low priority. The current approach is simple and correct. Only optimize if data transfer becomes a quota concern.

---

## Issue 4: Health Endpoint in SyncDetailModal (User-Triggered)

**File:** `src/lib/stores/sync-status.svelte.ts:259-283`, `src/lib/components/sync/SyncDetailModal.svelte:142`

The `SyncDetailModal` exposes a "Resync All" button that calls `resyncAll()` (14 Neon queries) and `checkNeonHealth()` (1 more). The health check is also called on startup (`+layout.svelte:74`).

The health check runs `SELECT 1` which is cheap, but it's a separate HTTP round-trip that wakes the Neon compute.

**Impact:** Low -- only triggers on user action or startup.

**Recommendation:** Fold the health check into the first pull request. If the first pull succeeds, Neon is healthy. No need for a separate `SELECT 1`.

---

## Issue 5: No Deduplication of Concurrent Resyncs

**File:** `src/lib/db/replication.ts:166-173`

```typescript
export async function resyncCollection(name: string): Promise<void> {
    if (neonDown) return;
    const repl = replications.get(name);
    if (!repl) return;
    syncStatus.markSyncing(name);
    await repl.reSync();
    await repl.awaitInSync();
}
```

If two mutations fire in quick succession (e.g., bulk delete), `resyncCollection('tenants')` could be called twice concurrently. RxDB's `reSync()` may or may not deduplicate internally, but the code has no guard against it.

**Impact:** Low for typical usage. Could cause duplicate Neon queries during rapid-fire operations.

**Recommendation:** Add a simple in-flight guard:
```typescript
const inFlight = new Set<string>();
export async function resyncCollection(name: string): Promise<void> {
    if (neonDown || inFlight.has(name)) return;
    inFlight.add(name);
    try { /* ... */ } finally { inFlight.delete(name); }
}
```

---

## Issue 6: No Caching Headers on Pull Responses

**File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:189`

The pull endpoint returns `json({ documents, checkpoint })` with no `Cache-Control` header. Since the checkpoint makes each request unique, browser caching wouldn't help much -- but setting `Cache-Control: no-store` explicitly would prevent accidental CDN caching on Cloudflare Pages that could serve stale data.

**Impact:** Negligible.

---

## Issue 7: `db-retry.ts` Retry Logic Can Triple Neon Calls

**File:** `src/lib/server/db-retry.ts:76-113`

The `withRetry` wrapper retries up to 3 times with exponential backoff for connection/timeout errors. While the pull endpoint (`+server.ts`) does NOT use `dbQuery()` (it uses the raw `db` proxy), other server actions that write to Neon DO use retry logic.

If the retry triggers for a mutation, and the mutation eventually succeeds, the optimistic module's `bgResync` will fire. If the mutation originally timed out but actually committed, the resync will pull back duplicate data harmlessly -- but the retry may have executed the mutation twice (no idempotency guard).

**Impact:** Edge case, but worth noting. The pull endpoint itself is safe since it's read-only.

---

## Neon Query Count Per User Action

| Action | Current Neon Queries | Optimal | Waste |
|--------|---------------------|---------|-------|
| Page load (startup) | 15 (1 health + 14 pulls) | 1 (batched) | 14 |
| Create tenant | 2 (optimistic bgResync + page resync) | 0-1 | 1 |
| Delete tenant | 2 (optimistic bgResync + error-path resync) | 0 | 1-2 |
| Record payment | 4 (2 bgResync + 2 page resync) | 0-1 | 3 |
| Utility billing | 3 (bgResync: readings + billings + meters) | 1 | 2 |
| Lease action | 5 (refreshData resyncs 5 collections) | 1-2 | 3 |
| Budget action | 2 (budgets + properties) | 1 | 1 |
| Manual "Resync All" | 15 (14 pulls + 1 health) | 1 (batched) | 14 |

---

## Priority Recommendations

### High Priority (Biggest Impact)
1. **Eliminate double resyncs** -- Remove `bgResync()` from optimistic modules OR remove manual `resyncCollection()` from pages. Pick one pattern. Estimated savings: 30-50% of post-mutation Neon queries.

2. **Batch startup pulls** -- Create a single `/api/rxdb/pull/batch` endpoint that accepts all 14 collection checkpoints and returns all changed docs in one response. Reduces startup from 15 Neon round-trips to 1-2.

### Medium Priority
3. **Add resync deduplication** -- Prevent concurrent resyncs for the same collection.

4. **Eliminate health check endpoint** -- Fold into the first pull. If pulls work, Neon is healthy.

5. **Don't resync unrelated collections** -- `budgets/+page.svelte` should not resync `properties`. `leases/+page.svelte` should not resync `payment_allocations` unless the action modifies them.

### Low Priority
6. **Add a changeset-count pre-check** -- Before pulling 14 collections, check if anything changed. If not, skip entirely.

7. **Column-specific pulls** -- Only select the columns RxDB needs instead of `SELECT *`.

---

## Overall Assessment

The sync architecture is **fundamentally sound** -- no live polling, checkpoint-based pagination, quota protection, and offline-first design. The main waste comes from **redundant resyncs** (the same collection being pulled multiple times for a single mutation) and the **14-parallel-pulls startup pattern**. Fixing the double-resync issue alone would cut Neon usage by roughly a third during active use. Batching the startup pulls would eliminate the biggest single source of queries.

For a small dorm app on Neon's free tier, the current implementation is workable but not optimal. If usage grows or you want to stay comfortably within quota, the high-priority fixes above would make a significant difference.
