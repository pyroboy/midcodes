# RxDB Audit Report

**App:** dorm
**Date:** 2026-03-18
**Auditor:** Claude (rxdb-audit skill)

## Summary

| Category | Pass | Warn | Fail | N/A |
|----------|------|------|------|-----|
| 1. Authority Topology | 2 | 0 | 0 | 2 |
| 2. Adoption Justification | 1 | 1 | 1 | 0 |
| 3. Fundamental Patterns | 5 | 2 | 2 | 3 |
| 4. Sync Strategy | 4 | 1 | 0 | 1 |
| 5. Schema Design | 3 | 1 | 1 | 0 |
| 6. Initial Sync | 3 | 1 | 0 | 0 |
| 7. Storage Management | 0 | 1 | 3 | 0 |
| 8. Security | 1 | 1 | 2 | 1 |
| 9. Error Handling | 3 | 1 | 1 | 0 |
| **Total** | **22** | **9** | **10** | **7** |

**Overall Score:** 22 / 41 applicable items passed (54%)

---

## Critical Findings (FAIL)

### 3.1 — Physical DELETEs on replicated tables
- **Files:** Multiple server action files:
  - `src/routes/leases/+page.server.ts:71` — `db.delete(leases)`
  - `src/routes/leases/+page.server.ts:147` — `db.delete(leaseTenants)`
  - `src/routes/leases/+page.server.ts:356` — `db.delete(billings)`
  - `src/routes/leases/+page.server.ts:466` — `db.delete(billings)`
  - `src/routes/floors/+page.server.ts:122` — `db.delete(floors)`
  - `src/routes/properties/+page.server.ts:83` — `db.delete(properties)`
  - `src/routes/rental-unit/+page.server.ts:122` — `db.delete(rentalUnit)`
  - `src/routes/meters/+page.server.ts:364` — `db.delete(meters)`
  - `src/routes/locations/properties/+page.server.ts:63` — `db.delete(properties)`
  - `src/routes/locations/floors/+page.server.ts:98` — `db.delete(floors)`
  - `src/routes/locations/meters/+page.server.ts:327` — `db.delete(meters)`
  - `src/routes/locations/units/+page.server.ts:101` — `db.delete(rentalUnit)`
  - `src/routes/api/leases/update/+server.ts:119` — `db.delete(leaseTenants)`
- **Issue:** Hard DELETEs are used on replicated tables (leases, leaseTenants, billings, floors, properties, rentalUnit, meters). When a row is physically deleted, the checkpoint-based pull has no way to propagate that deletion to the client. The row simply disappears from the server, but the client keeps its cached copy forever.
- **Impact:** **Data integrity** — Deleted records persist as ghost data on the client. Users see records that no longer exist on the server. The only fix is a full client wipe (`indexedDB.deleteDatabase`).
- **Fix:** Replace all `db.delete(table)` on replicated tables with soft-delete: `db.update(table).set({ deletedAt: new Date(), updatedAt: new Date() })`. Note: only `tenants` and `leases` have `deletedAt` columns in the Drizzle schema (`src/lib/server/schema.ts:333,357`). All other replicated tables (floors, properties, rentalUnit, meters, billings, leaseTenants, readings, payments, paymentAllocations, expenses, budgets, penaltyConfigs) need a `deletedAt` column added via migration.

### 3.2 — Most collections lack a deletion marker
- **File:** `src/lib/server/schema.ts`
- **Issue:** Only `tenants` (line 333) and `leases` (line 357) have a `deletedAt` column. The remaining 12 replicated collections have no deletion marker: `lease_tenants`, `rental_units`, `properties`, `floors`, `meters`, `readings`, `billings`, `payments`, `payment_allocations`, `expenses`, `budgets`, `penalty_configs`.
- **Impact:** Soft deletes are impossible for 12 of 14 collections. Combined with the physical DELETEs above, this is the most critical data integrity gap.
- **Fix:** Add `deletedAt: timestamp('deleted_at', { withTimezone: true })` to all 12 tables. Add corresponding `deleted_at` field to RxDB schemas in `src/lib/db/schemas.ts`. Add `deleted_at: { $eq: null }` selector to all RxDB queries consuming these collections.

### 3.3 — No tombstone cleanup mechanism
- **File:** N/A (not implemented)
- **Issue:** There is no cron job, scheduled task, or retention policy to purge old tombstones. The `deletedAt` values on tenants and leases will accumulate indefinitely.
- **Impact:** Unbounded storage growth on both server and client. Every initial sync will pull all soft-deleted records from the beginning of time.
- **Fix:** Add a cron endpoint (e.g., `/api/cron/cleanup-tombstones`) that physically deletes rows where `deleted_at < NOW() - INTERVAL '90 days'`. Run it weekly or monthly. This is safe because all clients will have already pulled the tombstone within 90 days.

### 2.1 — Collections are not scoped to client needs
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:129-189`
- **Issue:** The pull endpoint has auth (`locals.user` check at line 131) but no authorization scoping. Every authenticated user pulls the **entire** dataset for all 14 collections. There is no filter by `property_id`, `org_id`, or user role. A front-desk user at Property A can pull all tenants, leases, and billing data for Property B.
- **Impact:** **Security** — data exposure across organizational boundaries. **Cost** — clients download far more data than they need, wasting Neon compute and bandwidth.
- **Fix:** Add property/org scoping to the pull query. For collections with property_id, filter by the user's assigned property. For tenant-scoped data, filter by the user's tenant_id.

### 7.1 — Persistent storage not requested
- **File:** `src/lib/db/index.ts`
- **Issue:** `navigator.storage.persist()` is never called. Safari and other browsers can evict IndexedDB data under storage pressure without warning.
- **Impact:** Users could lose their entire local cache, triggering a full re-sync (expensive) and temporarily losing offline capability.
- **Fix:** Call `navigator.storage.persist()` after database creation in `src/lib/db/index.ts` (around line 119).

### 7.2 — No collection-level expiry
- **File:** N/A (not implemented)
- **Issue:** All 14 collections replicate their full history with no time-window bounds. Collections like `readings`, `billings`, and `payments` can grow unboundedly.
- **Impact:** Client-side IndexedDB will grow without limit. Over months/years, initial sync becomes progressively more expensive and slow.
- **Fix:** For historical collections (readings, billings, payments, expenses), add a server-side time filter to the pull endpoint, e.g., only serve records from the last 12 months. Older data can be accessed via server-side queries when needed.

### 7.3 — Storage usage not monitored
- **File:** N/A (not implemented)
- **Issue:** No code calls `navigator.storage.estimate()` or tracks IndexedDB usage.
- **Impact:** Users will hit storage limits with no warning. The app will suddenly fail with cryptic IndexedDB errors.
- **Fix:** Add a periodic check (e.g., on app load) via `navigator.storage.estimate()` and surface a warning in the `SyncIndicator` when usage exceeds 80% of quota.

### 8.1 — Authorization not enforced (scope filtering)
- **File:** `src/routes/api/rxdb/pull/[collection]/+server.ts:131`
- **Issue:** The pull endpoint checks `locals.user` (authentication) but does not check `locals.permissions` or filter by property/org. Any authenticated user can pull all data from all collections.
- **Impact:** A tenant-role user can pull all billing, payment, and lease data for all tenants across all properties. This is a data privacy violation.
- **Fix:** Add permission checks per collection (e.g., `locals.permissions?.includes('tenants.read')`) and scope queries by `locals.org_id` or the user's assigned property.

### 8.2 — Sensitive data replicated without encryption
- **File:** `src/lib/db/schemas.ts` (tenantSchema, line 12)
- **Issue:** Tenant PII (email, contact_number, address, emergency_contact, birthday, facebook_name) is replicated to IndexedDB in plaintext. No RxDB encryption plugin is used.
- **Impact:** Anyone with access to the browser's DevTools can read all tenant personal information from IndexedDB. On shared/public devices this is a privacy risk.
- **Fix:** Consider using the RxDB encryption plugin for the `tenants` collection, or at minimum, exclude sensitive fields from replication and fetch them on-demand from the server.

### 5.1 — Key compression not enabled
- **File:** `src/lib/db/index.ts`, `src/lib/db/schemas.ts`
- **Issue:** No `keyCompression: true` on any schema. No key compression plugin loaded.
- **Impact:** Every document stored in IndexedDB and transferred over the network uses full-length field names. With 14 collections and snake_case naming, this adds meaningful storage and bandwidth overhead.
- **Fix:** Add `keyCompression: true` to each schema in `schemas.ts` and add the `RxDBKeyCompressionPlugin` in `index.ts`. This is a breaking schema change requiring a version bump + migration.

---

## Warnings (WARN)

### 3.4 — `updated_at` not indexed on server
- **File:** `src/lib/server/schema.ts` (all table definitions)
- **Issue:** No Drizzle index definitions exist on any `updated_at` column. The pull endpoint's `WHERE COALESCE(updated_at, ...) > $checkpoint ORDER BY ... LIMIT 200` query performs a sequential scan on every pull for every collection.
- **Impact:** As tables grow, pull queries become progressively slower and consume more Neon compute units. With 14 collections pulling on every app load, this compounds quickly.
- **Fix:** Add a composite index `(updated_at, id)` to every replicated table via Drizzle schema and a database migration.

### 3.5 — `updated_at` has no `$onUpdate` trigger
- **File:** `src/lib/server/schema.ts` (all table definitions)
- **Issue:** `updatedAt` uses `.defaultNow()` (sets value on INSERT) but has no `.$onUpdateFn(() => new Date())` (Drizzle's auto-update-on-write). The code manually sets `updatedAt: new Date()` in each server action, which is error-prone. If any update path forgets to set it, the checkpoint-based pull will miss that change.
- **Impact:** Any missed `updatedAt` update means the change is invisible to replication. The client will never pull that update unless a manual full resync occurs.
- **Fix:** Add `.$onUpdateFn(() => new Date())` to every `updatedAt` column definition as a safety net, in addition to the manual sets.

### 2.2 — Some collections may not warrant RxDB
- **File:** `src/lib/db/schemas.ts`
- **Issue:** `penalty_configs` is a low-frequency configuration table (likely < 10 rows, rarely changes). It could be served via SSR or a simple server fetch with caching instead of a full RxDB collection with replication overhead.
- **Impact:** Minor — one extra replication stream for minimal benefit. The pull will return 0 documents most of the time, which is cheap.
- **Fix:** Consider removing `penalty_configs` from RxDB and fetching it server-side via `+page.server.ts` load function. Low priority.

### 4.1 — Resync after every mutation triggers a server pull
- **File:** `src/lib/db/optimistic.ts:13-25` (bgResync function)
- **Issue:** Every optimistic write calls `bgResync(collection)` which triggers `repl.reSync()`. If a user rapidly creates 5 tenants, this fires 5 sequential server pulls. There is no debounce or batching of resyncs.
- **Impact:** Moderate cost increase during high-activity periods. Each resync is a Neon query.
- **Fix:** Debounce `bgResync` with a 2-5 second window per collection so rapid mutations consolidate into a single pull.

### 6.1 — No priority ordering for initial sync
- **File:** `src/lib/db/replication.ts:57-152`
- **Issue:** All 14 collections start replication simultaneously in a `for` loop. There is no priority ordering — the user might need `properties`, `floors`, and `rental_units` rendered first, but `readings` and `payment_allocations` (larger collections) could saturate bandwidth first.
- **Impact:** Initial load may feel sluggish as the UI waits for critical collections while non-critical ones consume bandwidth. The skeleton states help, but priority ordering would improve perceived performance.
- **Fix:** Split `COLLECTIONS_TO_SYNC` into priority tiers and `await` the critical tier before starting the rest.

### 5.2 — Foreign keys typed as `number` in some RxDB schemas
- **File:** `src/lib/db/schemas.ts`
- **Issue:** Several foreign key fields are typed as `type: 'number'` in RxDB schemas (e.g., `leaseSchema.rental_unit_id` at line 46, `leaseTenantSchema.lease_id` at line 72, `floorSchema.property_id` at line 129). While primary keys are correctly strings, these FK references use numbers. This is inconsistent — the referenced `id` is a string in RxDB, but the FK pointing to it is a number.
- **Impact:** Client-side joins using Map lookups require type coercion (`String(fk)` to match `id`). This works but is fragile and error-prone.
- **Fix:** Change FK fields to `type: 'string'` and update the transform functions to coerce FKs to strings using `sid()`.

### 7.4 — Old tombstones not cleaned from client
- **File:** N/A (not implemented)
- **Issue:** Even when tombstone cleanup is added server-side, the client has no mechanism to purge locally-cached soft-deleted records that are beyond the retention window.
- **Impact:** Client IndexedDB slowly accumulates dead records.
- **Fix:** Add a client-side cleanup that runs on app startup: query for records where `deleted_at < (now - 90 days)` and remove them from RxDB.

### 9.1 — Schema migration not supported
- **File:** `src/lib/db/schemas.ts` — all schemas at `version: 0`
- **Issue:** All 14 schemas are at version 0 with no `migrationStrategies` defined. When any schema needs to change (e.g., adding `deleted_at` to 12 collections), existing client databases will fail to open because RxDB requires migration strategies for version bumps.
- **Impact:** Any schema change will require users to clear their browser data manually, or the app must catch the error and destroy/recreate the database (losing all cached data).
- **Fix:** Proactively implement a migration strategy handler. At minimum, add error recovery in `getDb()` that detects schema mismatch errors (DB6/SC36) and destroys+recreates the database.

---

## Passing Items

### 1. Authority Topology
- **PASS: Authority is explicitly defined.** All 14 collections are server-authoritative with pull-only replication (`src/lib/db/replication.ts:126` — no `push` handler, `live: false`). The server (Neon) is the single source of truth.
- **PASS: Pull-only collections have no push logic.** No push handler exists anywhere. Writes go through SvelteKit form actions, and optimistic writes are local-only with background resync.
- **N/A: Client-authoritative conflict handlers.** Not applicable — all collections are server-authoritative.
- **N/A: Conflict resolution.** Not applicable — pull-only topology has no conflicts.

### 3. Fundamental Patterns
- **PASS: Checkpoint pagination is correct.** `src/routes/api/rxdb/pull/[collection]/+server.ts:161-171` — Uses `WHERE (updated_at > $cp) OR (updated_at = $cp AND id > $cp_id) ORDER BY updated_at, id LIMIT $batch_size`. Textbook implementation.
- **PASS: Timestamp precision is handled.** `src/routes/api/rxdb/pull/[collection]/+server.ts:159` — Uses `to_char(..., 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` to preserve PostgreSQL microsecond precision. This prevents the infamous infinite re-pull loop caused by JS Date millisecond truncation.
- **PASS: Empty pulls are cheap.** When the checkpoint matches the latest data, the query returns 0 rows, and the response is `{ documents: [], checkpoint: <same> }`. No wasted compute.
- **PASS: Queries filter out deleted records.** RxDB queries consistently use `{ deleted_at: { $eq: null } }` selector (confirmed in `src/routes/tenants/+page.svelte:33`, `src/routes/leases/+page.svelte:23`, `src/routes/+page.svelte:16,19`).
- **PASS: `updated_at` exists on every replicated table.** All 14 Drizzle tables have `updatedAt` with `.defaultNow()` (`src/lib/server/schema.ts`).

### 4. Sync Strategy
- **PASS: `live: false` used correctly.** `src/lib/db/replication.ts:126` — No persistent connections. Perfect for Neon serverless.
- **PASS: Pulls are event-driven.** Pulls happen on app startup (one-shot) and after mutations (via `resyncCollection`). No interval polling.
- **PASS: Database connections close immediately.** Neon HTTP driver (`@neondatabase/serverless` with `neon()`) is stateless — each query is an independent HTTP request. No connection pooling keeps Neon awake (`src/lib/server/db.ts`).
- **PASS: Preflight health check prevents wasted pulls.** `src/lib/db/replication.ts:20-34` — Health check runs before starting 14 parallel replications. If Neon is down or quota-exceeded, all replication is skipped.
- **N/A: Cross-device notifications.** No real-time cross-device sync is implemented (and is not needed for this pull-only, single-user-at-a-time app).

### 5. Schema Design
- **PASS: Primary keys are strings.** All RxDB schemas use `id: { type: 'string', maxLength: 20 }`. Drizzle serial IDs are coerced via `sid()` in transforms (`src/lib/server/transforms.ts:15-17`).
- **PASS: Decimal/monetary fields use strings.** `rent_amount`, `security_deposit`, `amount`, `balance`, `penalty_amount`, `base_rate`, etc. are all `type: 'string'` in RxDB schemas. Matches Drizzle `decimal()` output.
- **PASS: Every schema has `id`, `updated_at`.** All 14 schemas include both fields.

### 6. Initial Sync
- **PASS: Bootstrap is paginated.** Initial checkpoint is `null` / `'1970-01-01T00:00:00Z'`, and the handler paginates via `LIMIT 200` batches (`src/lib/db/replication.ts:124`).
- **PASS: Skeleton loading states exist.** Multiple pages use `{#if !store.initialized}` guards with skeleton components (confirmed in 10+ route files and dedicated skeleton components like `UtilityBillingSkeleton.svelte`, `PenaltySkeleton.svelte`).
- **PASS: Bootstrap cost is bounded.** With 14 collections, batch size 200, and typical dorm-sized datasets (< 1000 records per collection), initial sync is well within the 10MB interactive target.

### 8. Security
- **PASS: Sync endpoints are authenticated.** `src/routes/api/rxdb/pull/[collection]/+server.ts:131` checks `locals.user`. The `authGuard` hook (`src/hooks.server.ts:203-210`) rejects unauthenticated API requests with 401.

### 9. Error Handling
- **PASS: Network failures don't lose data.** Writes persist locally in RxDB first (optimistic pattern). If the server rejects, `resyncCollection()` reverts the optimistic write by pulling the server's truth (`src/lib/db/optimistic.ts:8-9`).
- **PASS: Sync failures have backoff.** `retryTime: 120000` (2 minutes) provides backoff on transient errors (`src/lib/db/replication.ts:127`).
- **PASS: Circuit breaker exists.** Neon quota detection (`402` / `exceeded the data transfer quota`) triggers `cancelAllReplications()` and sets `neonDown = true`, preventing further attempts (`src/lib/db/replication.ts:96-103`). The server-side `db.ts` also has a circuit breaker (`src/lib/server/db.ts:5,51`).

---

## Server Cost Assessment

- **Current efficiency:** Moderate
- **Biggest cost driver:** The lack of `updated_at` indexes means every pull query does a sequential scan on Neon. With 14 collections pulling on every app load, this is 14 sequential scans minimum per user session. As data grows, this will become the dominant cost.
- **Second biggest cost driver:** No resync debouncing — rapid mutations trigger 1:1 server pulls.
- **Estimated savings from fixes:**
  - Adding `(updated_at, id)` indexes: **50-80% reduction** in per-query Neon compute as tables grow past ~1000 rows.
  - Debouncing resyncs: **30-60% reduction** in pull requests during active data entry sessions.
  - Scoping pulls by property: **Proportional to number of properties** — if there are 3 properties, each client pulls ~1/3 the data.

---

## Recommendations (Priority Order)

1. **Add `deleted_at` column to all 12 replicated tables missing it, and replace all physical DELETEs with soft-deletes.** This is the most critical fix — without it, deleted records become ghost data on clients. This requires a Drizzle migration, RxDB schema version bumps, and migration strategies.

2. **Add composite `(updated_at, id)` indexes to all 14 replicated tables.** Pure server-side change (Drizzle migration), zero client impact, immediate cost savings on every pull query.

3. **Add authorization scoping to the pull endpoint.** Filter by `property_id` or `org_id` based on the user's profile. This is both a security fix and a cost optimization.

4. **Debounce `bgResync()` in `optimistic.ts`** with a 3-5 second window per collection to consolidate rapid mutations into single pulls.

5. **Add `.$onUpdateFn(() => new Date())` to all `updatedAt` columns** in the Drizzle schema as a safety net against missed manual updates.

6. **Call `navigator.storage.persist()`** after database creation to prevent Safari from evicting the IndexedDB cache.

7. **Implement schema migration handling** — either migration strategies in RxDB schemas, or catch-and-recreate logic in `getDb()` for schema mismatch errors.

8. **Add tombstone cleanup** — server-side cron to purge records with `deleted_at > 90 days`, and client-side cleanup on app startup.

9. **Enable key compression** on all RxDB schemas to reduce storage and transfer size.

10. **Add storage monitoring** via `navigator.storage.estimate()` with user-facing warnings at 80% usage.
