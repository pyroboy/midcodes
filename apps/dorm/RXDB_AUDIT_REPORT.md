# RxDB Audit Report (v5 — Post-Fix Re-Audit)

**App:** dorm (Dormitory Management)
**Date:** 2026-03-18
**Auditor:** Claude (rxdb-audit skill)
**Topology:** Pull-only replication, Neon PostgreSQL (serverless) → RxDB (Dexie/IndexedDB)
**History:** v1 = 60% → v2 = 77% → v3 = 88% → v4 = 63% (expanded checklist) → **v5 = 93%**

> v5 re-audits after implementing fixes for all 8 FAILs, 4 WARNs, and 4 Deep Dives from v4.
> 3 remaining WARNs are intentionally deferred (property scoping, sync ordering).

## Summary

| Category | Pass | Warn | Fail | N/A |
|----------|------|------|------|-----|
| 1. Authority Topology | 2 | 0 | 0 | 1 |
| 2. Adoption Justification | 1 | 1 | 0 | 0 |
| 3. Fundamental Patterns | 7 | 0 | 0 | 2 |
| 4. Sync Strategy | 4 | 0 | 0 | 1 |
| 5. Schema Design | 4 | 0 | 0 | 0 |
| 6. Initial Sync | 2 | 1 | 0 | 0 |
| 7. Storage Management | 3 | 0 | 0 | 0 |
| 8. Security | 2 | 1 | 0 | 1 |
| 9. Error Handling | 5 | 0 | 0 | 0 |
| 10. Offline Write Buffering | 0 | 0 | 0 | 6 |
| 11. Conflict Resolution | 0 | 0 | 0 | 6 |
| 12. Storage Persistence & Recovery | 7 | 0 | 0 | 0 |
| 13. Schema Migrations | 3 | 0 | 0 | 0 |
| **Total** | **40** | **3** | **0** | **17** |

**Overall Score:** 40 / 43 applicable (**93%**)

---

## Score Progression

| Version | Pass | Warn | Fail | Score | Notes |
|---------|------|------|------|-------|-------|
| v1 (initial) | 21 | 5 | 9 | 60% | Original audit |
| v2 (soft-delete + infra) | 27 | 5 | 3 | 77% | Fixed physical DELETEs |
| v3 (lifecycle mgmt) | 30 | 4 | 0 | 88% | 9-category checklist |
| v4 (expanded audit) | 27 | 8 | 8 | 63% | 13-category checklist, found new issues |
| **v5 (post-fix)** | **40** | **3** | **0** | **93%** | All 8 FAILs resolved, 5 WARNs resolved |

> v4→v5: +30 percentage points. All 8 FAILs fixed. 5 of 8 WARNs fixed. 3 remaining WARNs are intentional deferrals.

---

## Server Query Cost Map

| Action | Current Queries | Optimal | Waste |
|--------|----------------|---------|-------|
| App startup | 1 health + 14 pulls = **15** | 15 | 0 |
| Tenant create | 1 action + 1 bgResync (debounced) = **2** | 1 | 1 |
| Any soft-delete | 1 action + 1 bgResync (debounced) = **2** | 1 | 1 |
| Payment create | 1 action + 1 bgResync (debounced) = **2** | 1 | 1 |
| Payment revert | 1 action + 2 bgResyncs (debounced, may coalesce) = **2-3** | 1 | 1-2 |
| Utility billing | 1 action + 3 bgResyncs (debounced, may coalesce) = **2-4** | 1 | 1-3 |
| Lease update (tenants) | 1 action (soft-delete diff-and-patch) | 1 | 0 |
| Page navigation | 0 (local RxDB) | 0 | 0 |
| Manual refresh | 14 pulls | 14 | 0 |

**Improvement from v4:** Duplicate health check eliminated (-1 query on startup). bgResync debounced at 500ms — rapid successive mutations coalesce into fewer resyncs. Lease tenant update no longer creates zombie data.

---

## Resolved Items (v4 → v5)

### F1 → PASS: Soft-delete `lease_tenants`
- **File:** `src/routes/api/leases/update/+server.ts`
- Physical DELETE replaced with 5-step diff-and-patch: query existing, compute diff, soft-delete removed, re-activate previously deleted, insert genuinely new.

### F2 → PASS: Auth on health endpoint
- **File:** `src/routes/api/rxdb/health/+server.ts`
- Returns `json({ error: 'Unauthorized' }, { status: 401 })` for unauthenticated requests.

### F3 + D1 → PASS: Singleton RxDB stores
- **File:** `src/lib/stores/collections.svelte.ts` (NEW)
- 14 singleton stores replace per-page `createRxStore` calls across 17 files + layout.
- Sorts moved to `$derived` computations — one RxDB subscription per collection globally.

### F4 → PASS: DB init timeout
- **File:** `src/routes/+layout.svelte:106-110`
- `Promise.race([getDb(), 30s timeout])` prevents infinite hangs on corrupted IndexedDB.

### F5 → PASS: Multi-tab reset coordination
- **File:** `src/routes/+layout.svelte:78-83`
- `BroadcastChannel('dorm-db-reset')` notifies other tabs when IndexedDB is cleared.

### F6 → PASS: Reload-loop guard
- **File:** `src/routes/+layout.svelte:146-152`
- `sessionStorage.__dorm_db_reset` counter stops auto-clear after 2 consecutive failures. Shows `?reset-db=1` recovery hint.

### F7 + W1 → PASS: Schema v1 with indexes
- **File:** `src/lib/db/schemas.ts`
- All 14 schemas bumped to v1. Indexes on `deleted_at`, FK columns, and date fields.
- Identity migration strategies in `src/lib/db/index.ts`. `RxDBCleanupPlugin` registered.

### F8 → PASS: URL escape hatch
- **File:** `src/routes/+layout.svelte:68-75`
- `?reset-db=1` deletes all IndexedDB databases, strips param, reloads.

### D2 → PASS: bgResync debounced
- **File:** `src/lib/db/optimistic-utils.ts`
- 500ms per-collection debounce. Rapid mutations coalesce into single resync.

### D4 → PASS: No duplicate health check
- **Files:** `src/lib/db/replication.ts`, `src/lib/stores/sync-status.svelte.ts`
- `setNeonHealthDirect()` called from replication preflight. Layout no longer fires separate `checkNeonHealth()`.

### D5 → PASS: Tombstone cleanup after bulkRemove
- **File:** `src/lib/db/pruning.ts`
- `collection.cleanup(0)` called after every `bulkRemove()` to purge RxDB internal tombstones.

### D6 → PASS: Neon reconnect on tab focus
- **File:** `src/lib/db/replication.ts:46-56`
- `visibilitychange` listener re-checks Neon when `neonDown === true`. Resumes replication if reachable.

### W6 → PASS: Auto-prune on critical storage
- **File:** `src/lib/db/storage-monitor.ts`
- `checkAndAutoPrune()` calls `pruneOldRecords()` when storage >95%.

### W7 → PASS: Prune soft-deleted records >90 days
- **File:** `src/lib/db/pruning.ts`
- Second pass sweeps `deleted_at` non-null records older than 90 days across all 14 collections.

---

## Remaining Warnings (3 — Intentionally Deferred)

### W1: Collections not scoped by property/role
- **Category:** 2 (Adoption Justification) + 8 (Security)
- **Issue:** All 14 collections pull full table contents. No `WHERE property_id = ?` filter.
- **Impact:** Bandwidth waste for multi-property deployments. Users see all properties' data.
- **Why deferred:** Requires auth/role redesign — property scoping touches every pull query, every store, and the permission model. Current deployment is single-property.

### W2: Critical collections don't sync first
- **Category:** 6 (Initial Sync)
- **Issue:** All 14 collections sync in parallel. Properties/floors/units could sync first to unblock the UI faster.
- **Impact:** Marginal — startup is already fast with checkpoint-based delta pulls.
- **Why deferred:** Minimal benefit at current data volumes. Would add complexity to `startSync`.

---

## Deep Dive Findings (Remaining)

### DD1: Pull endpoint `parseInt` doesn't validate NaN
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:143-144`
- **Issue:** `parseInt('abc', 10)` returns `NaN`. `Math.min(NaN, 500)` returns `NaN`. SQL `LIMIT NaN` will error.
- **Impact:** Malformed query params cause 500 error instead of 400.
- **Fix:** Validate parsed integers:
  ```typescript
  const limitNum = parseInt(limitRaw, 10);
  if (isNaN(limitNum) || limitNum < 1) throw error(400, 'Invalid limit');
  ```

### DD2: Health endpoint has no explicit timeout
- **File:** `src/routes/api/rxdb/health/+server.ts`
- **Issue:** `db.execute(sql\`SELECT 1\`)` could hang if connection pool is exhausted. Cloudflare Workers has a 30s CPU limit but the socket may not close.
- **Impact:** Health check blocks indefinitely in edge case.
- **Fix:** Wrap with `Promise.race` and 5s timeout.

### DD3: Replication doesn't detect 401 (session expiry)
- **File:** `src/lib/db/replication.ts:104-133`
- **Issue:** If session expires mid-replication, the pull fetch returns 401. The handler logs the error and retries via `retryTime` without detecting auth failure specifically.
- **Impact:** Replication retries forever (every 120s) against a 401. Wastes quota.
- **Fix:** Check `res.status === 401` and cancel all replications:
  ```typescript
  if (res.status === 401) {
    cancelAllReplications();
    syncStatus.addLog('Session expired — please sign in again', 'error');
    return { documents: [], checkpoint };
  }
  ```

### DD4: No distinction between 402 (quota) and 429 (rate limit)
- **File:** `src/lib/db/replication.ts:118-126`
- **Issue:** Both quota exhaustion and rate limiting set `neonDown = true` permanently. A 429 should retry after cooldown, not halt replication.
- **Impact:** Transient rate limits treated as permanent quota exhaustion.
- **Fix:** Check `res.status === 429` separately and honor `Retry-After` header.

### DD5: bgResync doesn't check `navigator.onLine`
- **File:** `src/lib/db/optimistic-utils.ts:17-30`
- **Issue:** When offline, `resyncCollection()` fires a fetch that immediately fails. The error is logged but the optimistic write is never synced.
- **Impact:** Silent data divergence — user thinks mutation succeeded but server never received it (the form action would have failed first, so this is only a resync concern, not data loss).
- **Fix:** Guard with `navigator.onLine` and queue for retry on `online` event.

### DD6: No stale-data age indicator
- **File:** `src/lib/stores/sync-status.svelte.ts`
- **Issue:** When replication is down, the UI shows "error" but doesn't indicate how old the cached data is. Users may make decisions on stale data.
- **Impact:** UX — users don't know they're looking at data from 2 days ago.
- **Fix:** Track `lastSuccessfulSyncAt` per collection and display age in `SyncIndicator.svelte`.

### DD7: Store subscriptions never unsubscribe
- **File:** `src/lib/stores/rx.svelte.ts:27`
- **Issue:** The RxDB `query.$.subscribe()` return value is discarded. Subscriptions leak until page unload.
- **Impact:** Minimal with singleton pattern (14 subscriptions total, never recreated). Would matter if stores were per-component.
- **Recommendation:** Low priority. Document that singletons are intentionally long-lived.

---

## Passing Items (Highlights)

- **Checkpoint pagination** with microsecond-precision `to_char()` — prevents infinite re-pull loops
- **Circuit breaker** (`neonDown` flag) — stops all replication on quota exhaustion
- **In-flight resync deduplication** — `inFlightResyncs` Map prevents duplicate server queries
- **Singleton RxDB stores** — one subscription per collection globally, sorts in `$derived`
- **Soft-delete everywhere** — `lease_tenants` now uses diff-and-patch, no physical DELETEs
- **Schema v1 with indexes** — `deleted_at`, FK columns, date fields indexed for query performance
- **Multi-tab coordination** — BroadcastChannel syncs DB resets, reload-loop guard prevents cascading failures
- **30s init timeout** — prevents infinite hangs on corrupted IndexedDB
- **Auto-prune** — 90-day soft-delete sweep + critical storage auto-prune with `cleanup(0)` tombstone flush
- **Debounced bgResync** — 500ms coalescing prevents resync storms on rapid mutations

---

## Server Cost Assessment

- **Current efficiency:** HIGH (up from MODERATE in v4)
- **Biggest cost driver:** Per-mutation bgResync — each create/update/delete triggers 1 debounced resync (2 queries total). Acceptable for current usage.
- **Savings from v4 fixes:**
  - -1 query per startup (duplicate health check removed)
  - Debounced resync reduces storms (e.g., utility billing: was 4, now 2-4 depending on coalescing)
  - Lease tenant update: was zombie-creating DELETE, now clean soft-delete — no extra resyncs needed for cleanup

## Recommendations (Priority Order)

1. **DD3: Detect 401 in replication** — prevents infinite retry loop on expired sessions (MEDIUM effort, HIGH impact)
2. **DD1: Validate parseInt on pull params** — 5-line fix, prevents 500 errors on malformed requests (LOW effort)
3. **DD4: Distinguish 429 from 402** — prevents permanent halt on transient rate limits (MEDIUM effort)
4. **DD2: Health check timeout** — 3-line fix for edge case hang (LOW effort)
5. **DD5: Offline-aware bgResync** — queue resyncs for when connectivity returns (MEDIUM effort)
6. **DD6: Stale-data indicator** — UX improvement, shows data age when sync is down (MEDIUM effort)
7. **W1: Property scoping** — defer until multi-property deployment is needed (HIGH effort)
