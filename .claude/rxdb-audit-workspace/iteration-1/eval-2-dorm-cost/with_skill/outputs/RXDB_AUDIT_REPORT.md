# RxDB Audit Report

**App:** dorm
**Date:** 2026-03-18
**Auditor:** Claude (rxdb-audit skill)

## Summary

| Category | Pass | Warn | Fail | N/A |
|----------|------|------|------|-----|
| 1. Authority Topology | 3 | 0 | 0 | 1 |
| 2. Adoption Justification | 2 | 1 | 0 | 0 |
| 3. Fundamental Patterns | 6 | 2 | 2 | 1 |
| 4. Sync Strategy | 4 | 1 | 1 | 0 |
| 5. Schema Design | 3 | 1 | 1 | 0 |
| 6. Initial Sync | 3 | 1 | 0 | 0 |
| 7. Storage Management | 0 | 1 | 3 | 0 |
| 8. Security | 2 | 1 | 1 | 1 |
| 9. Error Handling | 3 | 1 | 1 | 0 |
| **Total** | **26** | **9** | **9** | **3** |

**Overall Score:** 26 / 44 applicable items passed (59%)

## Critical Findings (FAIL)

### 3a. Physical DELETEs on replicated tables
- **File:** `src/routes/floors/+page.server.ts:122`, `src/routes/rental-unit/+page.server.ts:122`, `src/routes/properties/+page.server.ts:83`, `src/routes/leases/+page.server.ts:71`, `src/routes/leases/+page.server.ts:147`, `src/routes/leases/+page.server.ts:356`, `src/routes/leases/+page.server.ts:462`, `src/routes/expenses/+page.server.ts:93`, `src/routes/payments/+page.server.ts:175`
- **Issue:** Multiple server actions use `db.delete()` (physical DELETE) on replicated tables: floors, rental_units, properties, leases, lease_tenants, billings, payment_allocations, expenses, and payments. Only tenants and leases have a `deleted_at` column in the Drizzle schema. The rest have no soft-delete column at all.
- **Impact:** When a record is physically deleted from Postgres, RxDB has no way to learn about it through checkpoint-based delta pulls. The deleted record simply never appears again, but RxDB still holds the stale document locally. Over time, the client accumulates phantom records that no longer exist on the server. The only fix is a full collection wipe, which defeats the purpose of caching.
- **Fix:** Add a `deleted_at` timestamp column to every replicated table (at minimum: floors, rental_units, properties, billings, payments, payment_allocations, expenses, budgets, penalty_configs, meters, readings, lease_tenants). Convert all `db.delete()` calls to `db.update().set({ deletedAt: new Date() })`. Add `deleted_at: { $eq: null }` selectors on the client side for these collections.

### 3b. Most collections lack a deletion marker
- **File:** `src/lib/server/schema.ts` (only lines 333 and 357 have `deletedAt`)
- **Issue:** Only 2 of 14 replicated tables (tenants, leases) have a `deleted_at` column. The remaining 12 collections (lease_tenants, rental_units, properties, floors, meters, readings, billings, payments, payment_allocations, expenses, budgets, penalty_configs) have no soft-delete mechanism.
- **Impact:** Identical to above -- physical deletes on these tables create ghost documents in RxDB.
- **Fix:** Add `deletedAt: timestamp('deleted_at', { withTimezone: true })` to all 12 remaining tables. Add `deleted_at` to their RxDB schemas in `src/lib/db/schemas.ts`. Add `deleted_at: { $eq: null }` selectors in all client queries.

### 4a. Utility billing resync fires 3 parallel Neon queries
- **File:** `src/lib/db/optimistic-utility-billings.ts:19-25`
- **Issue:** `resyncUtilityData()` fires `bgResync('readings')`, `bgResync('billings')`, and `bgResync('meters')` simultaneously. Each bgResync triggers a full checkpoint-based pull to Neon. For a single utility billing action, this means 3 separate Neon HTTP round-trips in parallel.
- **Impact:** Tripled Neon compute for a single user action. If multiple users perform utility billing actions concurrently, this multiplies further. Similarly, `optimisticRevertPayment` and `optimisticDeleteTransaction` both fire 2 parallel resyncs (payments + billings).
- **Fix:** Consider a batched resync that coalesces multiple collection resyncs into a single debounced window (e.g., 500ms), so rapid successive mutations don't each trigger their own pulls. Alternatively, since the optimistic write already updates the UI, the resync could be deferred until the next natural sync point.

### 7a. No `navigator.storage.persist()` call
- **File:** (missing from codebase -- searched `src/` for `navigator.storage` and `persist()`)
- **Issue:** The app never requests persistent storage from the browser. On Safari especially, the browser can evict IndexedDB data at any time when under storage pressure.
- **Impact:** Users could lose their entire local cache without warning, requiring a full re-pull of all 14 collections from Neon. This is both a UX and cost issue.
- **Fix:** Call `navigator.storage.persist()` during database initialization in `src/lib/db/index.ts`, right after `createRxDatabase`.

### 7b. No collection-level data expiry
- **File:** (missing)
- **Issue:** Collections like readings, billings, payments, and expenses grow unboundedly on the client. Every historical record ever synced stays in IndexedDB forever.
- **Impact:** Over months/years, IndexedDB size will grow, increasing the risk of quota issues and slowing down RxDB queries.
- **Fix:** Add a retention policy (e.g., only keep the last 90 days of readings and payments locally). Implement a periodic cleanup in `$effect` that removes old documents from RxDB.

### 7c. No storage usage monitoring
- **File:** (missing)
- **Issue:** The app never checks `navigator.storage.estimate()` to monitor how much IndexedDB space is being used.
- **Impact:** Users approaching browser storage limits get no warning. When IndexedDB fills up, writes silently fail.
- **Fix:** Add a storage estimate check to the sync status store and display a warning when usage exceeds 80% of quota.

### 8a. Health endpoint has no authentication
- **File:** `src/routes/api/rxdb/health/+server.ts:6`
- **Issue:** The `/api/rxdb/health` endpoint has no `locals.user` check. Any unauthenticated request can trigger a `SELECT 1` query against Neon.
- **Impact:** This endpoint could be used to keep Neon awake (preventing auto-suspend) or to probe the database status. Each request wakes Neon from cold start, costing compute time.
- **Fix:** Add `if (!locals.user) throw error(401, 'Unauthorized');` at the top of the handler, matching the pull endpoint pattern.

### 9a. No IndexedDB quota error handling
- **File:** `src/lib/db/index.ts`, `src/lib/db/optimistic.ts` (and all optimistic-*.ts files)
- **Issue:** None of the RxDB write paths check for `QuotaExceededError`. The `try/catch` blocks in optimistic writes catch errors but don't differentiate between quota errors and other failures.
- **Impact:** If IndexedDB is full, optimistic writes silently fail and fall back to resync (which also fails). The user sees no indication of the storage problem.
- **Fix:** In the catch blocks, check for `err.name === 'QuotaExceededError'` or `err.code === 22` and surface a specific "storage full" notification to the user.

## Warnings (WARN)

### 2a. Collections not scoped to organizational unit
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:129-171`
- **Issue:** Pull queries fetch all rows from each table with no property-level or organization-level filtering. Every authenticated user pulls every tenant, every billing, every payment across all properties.
- **Impact:** For a multi-property deployment, this means the client downloads data it may never display. Wastes bandwidth and Neon compute. For a single-property deployment, this is acceptable but won't scale.
- **Fix:** Add a `property_id` filter (or `org_id`) to pull queries based on the user's assigned scope from `locals.user`. This requires passing scope context through the auth system.

### 3c. Tombstone cleanup does not exist
- **File:** (missing -- no cron or scheduled cleanup for soft-deleted records)
- **Issue:** Soft-deleted tenants and leases (the only two tables with `deleted_at`) accumulate forever in both Postgres and RxDB.
- **Impact:** Minor for now (low volume), but over years the tombstone count grows. The pull endpoint will always include these deleted records in the initial sync.
- **Fix:** Add a periodic cleanup job (e.g., in `/api/cron`) that physically deletes records where `deleted_at < NOW() - INTERVAL '90 days'`. On the client side, purge matching documents during a maintenance window.

### 3d. Timestamp precision handling is correct but fragile
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:159`
- **Issue:** The `to_char(..., 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` approach correctly preserves microsecond precision to avoid infinite re-pull loops. However, the comment at line 153 notes this was a bug fix, suggesting it was previously broken. The `ts()` helper in `transforms.ts:11` converts Date objects to ISO strings (millisecond precision), but this only affects the `updated_at` field within document payloads -- the checkpoint uses the raw string, so it's safe.
- **Impact:** Currently working correctly. Marked as WARN because the precision fix is in a single location and not enforced by types -- a future refactor could accidentally regress it.
- **Fix:** Consider adding a regression test that verifies checkpoint precision survives a round-trip.

### 4b. Health check adds an extra Neon query on every app load
- **File:** `src/lib/db/replication.ts:20-34`
- **Issue:** `checkNeonReachable()` runs `SELECT 1` against Neon before starting replication. This is a separate query from the 14 collection pulls that follow. If Neon is in cold start, this `SELECT 1` wakes it up and then the 14 pulls follow immediately -- so the health check is redundant (the first pull would naturally fail if Neon is down).
- **Impact:** One extra Neon round-trip per app load. Minor, but on a free/starter tier where every query counts, it adds up.
- **Fix:** Consider removing the health check and letting the first pull attempt naturally detect Neon unavailability. The `neonDown` flag and quota detection logic in the pull handler already handles this.

### 5a. Key compression not enabled
- **File:** `src/lib/db/index.ts:92-99`
- **Issue:** `createRxDatabase` does not enable key compression. All JSON keys in IndexedDB are stored at full length.
- **Impact:** Minor increase in IndexedDB storage usage and marginally larger memory footprint. Not critical for the current dataset size.
- **Fix:** Add the `rxdb/plugins/key-compression` plugin and set `keyCompression: true` on schemas.

### 6a. No prioritization of critical collections during bootstrap
- **File:** `src/lib/db/replication.ts:57`
- **Issue:** All 14 collections start replicating in a fixed order (the `COLLECTIONS_TO_SYNC` array order). There's no prioritization of collections needed for the initial page render (e.g., properties, tenants, leases should sync before penalty_configs or budgets).
- **Impact:** The user may see skeleton loaders for critical data while less-important collections sync first. Also, all 14 collections fire their initial pull nearly simultaneously, creating a burst of 14 parallel Neon queries.
- **Fix:** Split collections into tiers: critical (properties, floors, rental_units, tenants, leases, lease_tenants) sync first, then secondary (billings, payments, meters, readings), then tertiary (expenses, budgets, penalty_configs, payment_allocations). Alternatively, stagger the starts with a small delay between batches to avoid a Neon query burst.

### 8b. Pull endpoint has no authorization scoping
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:131`
- **Issue:** The endpoint checks `locals.user` (authentication) but does not check `locals.permissions` or role-based access. Any authenticated user can pull any collection, including potentially sensitive financial data (payments, expenses, budgets).
- **Impact:** A tenant-role user could pull all payment records, expense details, and budget information for all properties.
- **Fix:** Add permission checks: `if (!locals.permissions?.includes(`${collectionName}.read`))` before executing the query.

### 9b. Schema migration not supported
- **File:** `src/lib/db/schemas.ts` (all schemas at `version: 0`)
- **Issue:** All 14 collection schemas are at version 0 with no migration strategies defined. When a schema changes, the only option is to delete the database entirely.
- **Impact:** Any schema change in production forces all users to lose their local cache and re-pull everything from Neon. This is a mass re-sync event.
- **Fix:** Before the next schema change, implement RxDB's `migrationStrategies` on affected collections. For now, document the "clear IndexedDB" workaround in the sync status UI.

## Passing Items

These aspects of the implementation are well-designed:

1. **Authority is explicitly server-authoritative (pull-only).** `replication.ts:126` sets `live: false` with no push handler. All mutations go through SvelteKit form actions to the server, then optimistic writes update RxDB locally. This is the correct topology for a Neon serverless backend.

2. **No `live: true` with serverless.** The single most expensive misconfiguration is avoided. `live: false` at line 126 ensures no persistent polling connections.

3. **No polling or interval-based sync.** Confirmed by grep -- no `setInterval`, no `setTimeout` for periodic resyncs, no visibility-change resyncs. Pulls happen only on startup and after explicit mutations.

4. **Checkpoint-based delta pulls are correct.** The pull endpoint (`+server.ts:161-171`) implements the standard `WHERE updated_at > $cp OR (updated_at = $cp AND id > $cp_id) ORDER BY updated_at, id LIMIT $batch_size` pattern with proper COALESCE for NULL timestamps.

5. **Microsecond timestamp precision preserved.** The `_rawUpdatedAt` SQL expression at line 159 uses `to_char(...US...)` to preserve PostgreSQL microsecond precision, preventing the infinite re-pull loop caused by JS Date millisecond truncation.

6. **Empty pulls are cheap.** When nothing has changed since the last checkpoint, the query returns 0 rows and the response is `{ documents: [], checkpoint: {same} }` -- minimal Neon compute.

7. **Batch size is reasonable.** 200 documents per batch (`replication.ts:124`) with a server-side cap of 500 (`+server.ts:144`).

8. **Neon quota protection.** The `neonDown` flag (`replication.ts:14`) and quota detection (`replication.ts:96-103`) gracefully halt all replication when Neon returns 402, preventing further charges.

9. **Optimistic writes are correct.** The pattern of writing to RxDB immediately then resyncing in the background provides instant UI feedback while maintaining eventual consistency.

10. **Soft deletes work correctly for tenants and leases.** Both use `deleted_at` timestamp, client queries filter with `{ $eq: null }`, and the pull endpoint includes deleted records so RxDB learns about them.

11. **Primary keys are strings.** All RxDB schemas use `type: 'string'` for `id` with `maxLength: 20`. The `sid()` transform coerces Drizzle serial IDs.

12. **Decimal fields use strings.** All monetary amounts (rent_amount, balance, amount, etc.) are typed as `string` in RxDB schemas, matching Drizzle's decimal-to-string behavior.

13. **Singleton database pattern.** `index.ts` uses `globalThis` caching with an in-flight promise guard to prevent duplicate database creation.

14. **Neon uses HTTP driver (stateless).** `db.ts` uses `@neondatabase/serverless` with the HTTP transport (`neon()` + `drizzle`), which is stateless -- no persistent connections kept open.

15. **Retry with circuit breaker exists on db.ts.** The `withRetryAndTimeout` and `dbCircuitBreaker` in `src/lib/server/db.ts` protect against cascading failures.

16. **Pull endpoint is authenticated.** `+server.ts:131` checks `locals.user` before executing any query.

17. **Pull endpoint has collection allowlist.** `+server.ts:39-127` restricts pullable collections to the 14 known ones. Unknown collection names return 400.

18. **Skeleton loading states exist.** The `createRxStore` pattern (`rx.svelte.ts:21`) provides `initialized` state for skeleton rendering.

19. **Retry time is conservative.** `retryTime: 120000` (2 minutes) at `replication.ts:127` prevents rapid retry storms.

20. **EventReduce is enabled.** `index.ts:95` sets `eventReduce: true`, which optimizes RxDB's internal change detection.

## Server Cost Assessment

- **Current efficiency:** Moderate
- **Biggest cost driver:** The initial app load fires 1 health check + 14 parallel collection pulls = **15 Neon HTTP queries per page load**. For a returning user with a warm cache, most of these return 0 documents, so they're cheap but not free -- each still wakes Neon from suspend and executes a query. The per-mutation bgResync pattern is well-designed (only fires after actual writes), but some mutations trigger 2-3 parallel resyncs.
- **Estimated savings from fixes:**
  - Removing the health check preflight: saves 1 query per app load (~6% reduction in startup queries)
  - Staggering/prioritizing collection syncs: same total queries but smoother Neon load profile, reduces cold-start burst
  - Adding property-level scoping to pull queries: reduces row scanning and data transfer, especially as the dataset grows
  - Debouncing multi-collection resyncs: could reduce post-mutation queries by 30-50% for operations like utility billing and payment revert
  - Overall: **20-40% reduction in Neon compute** is achievable with the recommended fixes

## Recommendations (Priority Order)

1. **Add soft-delete columns to all 12 remaining replicated tables.** This is a data integrity issue, not just efficiency. Without tombstones, RxDB accumulates ghost records that never disappear. Convert all `db.delete()` calls to soft-delete updates. This is the highest-priority fix.

2. **Add authentication to the health endpoint.** A one-line fix (`if (!locals.user) throw error(401)`) that prevents unauthenticated Neon wake-ups. Zero effort, immediate security and cost benefit.

3. **Add authorization scoping to pull queries.** Filter by `property_id` or `org_id` based on the user's role. This reduces data transfer and prevents information leakage between properties/roles.

4. **Request persistent storage.** Add `navigator.storage.persist()` in `index.ts` after database creation. A one-line fix that prevents Safari from evicting the cache.

5. **Remove the health check preflight.** Let the first collection pull naturally detect Neon unavailability. The quota detection in the pull handler already handles this. Saves 1 Neon query per app load.

6. **Debounce multi-collection resyncs.** Create a shared `debouncedResync(collections: string[])` utility that coalesces bgResync calls within a 500ms window. This prevents operations like `resyncUtilityData()` from firing 3 simultaneous Neon queries.

7. **Prioritize collection sync order.** Sync critical collections (properties, floors, rental_units, tenants, leases) first, then secondary data. Stagger with small delays to avoid a 14-query burst on Neon cold start.

8. **Add IndexedDB quota error handling.** Detect `QuotaExceededError` in optimistic write catch blocks and surface a user-visible notification.

9. **Add collection-level data expiry.** Implement a retention policy for high-volume collections (readings, billings, payments) to keep only the last 90 days locally.

10. **Plan for schema migration.** Before the next schema change, implement `migrationStrategies` on at least the high-traffic collections to avoid forcing full re-syncs.
