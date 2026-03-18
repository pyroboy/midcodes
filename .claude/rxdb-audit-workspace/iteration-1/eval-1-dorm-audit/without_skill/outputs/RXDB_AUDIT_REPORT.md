# RxDB Implementation Audit Report -- Dorm App

**Date:** 2026-03-18
**Scope:** Full audit of the RxDB offline-first implementation in `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/`

---

## 1. Architecture Overview

The dorm app uses a **pull-only replication** pattern:

- **Client DB:** RxDB 16 with Dexie/IndexedDB storage (`src/lib/db/index.ts`)
- **Server DB:** Neon PostgreSQL via Drizzle ORM (`src/lib/server/db.ts`)
- **Replication:** Checkpoint-based pull from `/api/rxdb/pull/[collection]` (`src/lib/db/replication.ts`)
- **Optimistic writes:** Upsert/patch RxDB immediately after server confirms, then background resync (`src/lib/db/optimistic*.ts`)
- **Reactive stores:** `createRxStore` subscribes to RxDB observables for live UI updates (`src/lib/stores/rx.svelte.ts`)

**14 collections synced:** tenants, leases, lease_tenants, rental_units, properties, floors, meters, readings, billings, payments, payment_allocations, expenses, budgets, penalty_configs.

---

## 2. Findings -- Critical Issues

### 2.1 CRITICAL: `doc.remove()` Creates Tombstones That Break Pull-Only Replication

**Files affected:**
- `src/lib/db/optimistic-properties.ts` (line 73)
- `src/lib/db/optimistic-floors.ts` (line 57)
- `src/lib/db/optimistic-rental-units.ts` (line 67)
- `src/lib/db/optimistic-meters.ts` (line 83)
- `src/lib/db/optimistic-expenses.ts` (line 79)
- `src/lib/db/optimistic-budgets.ts` (line 74)

**Problem:** These optimistic delete functions call `doc.remove()`, which sets the internal `_deleted: true` flag on the RxDB document. In RxDB, a deleted document is a **tombstone** -- it still exists in storage but is excluded from queries. When the background `resyncCollection()` runs afterward, the pull handler fetches the document from Neon (where it still exists, since the server did a hard DELETE from the SQL table, not a soft-delete). However, RxDB's replication protocol cannot "un-delete" a tombstoned document by default. The resynced document arrives but is ignored because the local tombstone takes precedence.

**Impact:** Hard-deleted entities (properties, floors, rental units, meters, expenses, budgets) will **reappear as ghosts** on the next full resync or page reload if the server delete failed, OR they will **never reappear** even if the server rejected the delete -- the optimistic rollback via `resyncCollection()` cannot recover.

**Recommended fix:** Instead of `doc.remove()`, use the same soft-delete pattern as tenants/leases: set a `deleted_at` timestamp via `incrementalPatch()` and filter queries with `{ deleted_at: { $eq: null } }`. Alternatively, since these collections do not have a `deleted_at` column in the server schema, add `_deleted` handling to the pull endpoint transforms, or use `bulkRemove` + `reSync()` with `deletedField` configuration in the replication setup.

### 2.2 CRITICAL: Foreign Key Type Mismatch Between RxDB Schemas and Server Transforms

**Files affected:**
- `src/lib/db/schemas.ts` -- lease_tenants schema (lines 72-73): `lease_id: { type: 'number' }`, `tenant_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- leases schema (line 46): `rental_unit_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- billings schema (line 193): `lease_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- readings schema (line 171): `meter_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- floors schema (line 129): `property_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- rental_units schema (lines 94, 95): `property_id: { type: 'number' }`, `floor_id: { type: 'number' }`
- `src/lib/db/schemas.ts` -- budgets schema (line 295): `property_id: { type: 'number' }`

**Corresponding transforms in** `src/lib/server/transforms.ts`:
- `transformLeaseTenant` (line 65): `lease_id: row.leaseId` (raw Drizzle integer -- a JS `number`)
- `transformLease` (line 43): `rental_unit_id: row.rentalUnitId` (raw Drizzle integer)
- All FK fields pass through as raw integers.

**Problem:** The `id` (primary key) is correctly coerced to a string via `sid()` in every transform. But all foreign key fields (`lease_id`, `tenant_id`, `rental_unit_id`, `property_id`, `floor_id`, `meter_id`) are passed as raw Drizzle integers. The RxDB schemas declare them as `type: 'number'`, which is correct for the data flowing in. However, this creates a **type inconsistency**: primary keys are strings, but foreign keys referencing those primary keys are numbers. Client-side joins like `leaseMap.get(String(l.id))` work, but any join using `leaseMap.get(item.lease_id)` will fail because `item.lease_id` is a number and the map key is a string.

**Impact:** Client-side enrichment/joins that use foreign keys to look up related documents will silently return `undefined` if the developer forgets to coerce types. This is a latent bug waiting to happen in any new join code.

**Recommended fix:** Either (a) coerce all FK fields to strings in the transforms (consistent with PKs), and update schemas to `type: 'string'`, or (b) document the convention clearly and ensure all client-side join code uses `String()` coercion.

### 2.3 CRITICAL: No Mechanism to Propagate Server-Side Hard Deletes to RxDB

**File:** `src/routes/api/rxdb/pull/[collection]/+server.ts` -- pulls all rows without awareness of deletions.
**File:** `src/lib/server/schema.ts` -- `properties` (lines 249-257), `floors` (line 259), `rental_units` (line 271), `meters` (line 290), `expenses` (line 434), `budgets` (line 460), `readings` (line 306), `payment_allocations` (line 414), `penalty_configs` (line 423) have no `deletedAt` column.

**Problem:** The pull endpoint fetches rows with `updated_at > checkpoint`. When a row is hard-deleted on the server, it simply vanishes from future pull responses. The RxDB client has no way to discover that a document should be removed -- the local copy persists indefinitely.

**Impact:** For collections without soft-delete (properties, floors, rental_units, meters, expenses, budgets, readings, payment_allocations, penalty_configs), if a record is deleted directly in the database (e.g., by another admin, by a migration, or by a cascade), the RxDB client will keep showing stale data until the user clears IndexedDB.

**Recommended fix:** Either:
1. Add soft-delete (`deleted_at`) to all tables that support deletion, and have the client filter on `deleted_at: { $eq: null }`.
2. Implement a periodic "full resync" that compares server IDs with local IDs and removes orphans.
3. Use RxDB's `deletedField` option in the replication config, and have the server return `{ _deleted: true }` for soft-deleted rows.

---

## 3. Findings -- Moderate Issues

### 3.1 MODERATE: Plugin Registration Guard Is Ineffective

**File:** `src/lib/db/index.ts` (lines 25-30)

```typescript
let pluginsRegistered = false;
if (!pluginsRegistered) {
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    pluginsRegistered = true;
}
```

**Problem:** `pluginsRegistered` is initialized to `false` in the same scope, so the `if (!pluginsRegistered)` check is always `true` on first module evaluation. If the module is evaluated multiple times (e.g., Vite HMR, code-splitting), the plugins get registered again. RxDB itself deduplicates plugin registration, so this is not harmful, but the guard gives a false sense of safety. The dev-mode plugin loaded asynchronously has no guard against double-registration if `devModeReady` runs twice.

**Recommended fix:** Move the guard to `globalThis`:
```typescript
if (!(globalThis as any).__dorm_plugins_registered) {
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    (globalThis as any).__dorm_plugins_registered = true;
}
```

### 3.2 MODERATE: `createRxStore` Never Unsubscribes from RxDB Observable

**File:** `src/lib/stores/rx.svelte.ts` (lines 23-37)

```typescript
if (browser) {
    getDb()
        .then((db) => {
            const query = queryFn(db);
            query.$.subscribe((documents: any[]) => {
                state = documents.map((doc: any) => doc.toJSON());
                initialized = true;
            });
        })
```

**Problem:** The RxDB observable subscription is created but the `Subscription` object is never stored or cleaned up. Since `createRxStore` is called at the module top level in page components, and SvelteKit navigations unmount/remount pages, every navigation to a page creates a new subscription without tearing down the old one. Over a long session with many page navigations, this accumulates subscriptions that continue to fire, invoking `.toJSON()` on every document change for every past subscription.

**Impact:** Memory leak and unnecessary CPU work. Each orphaned subscription keeps the old `state` setter alive (closure), preventing garbage collection of the previous component's reactive state.

**Recommended fix:** Return a cleanup function from `createRxStore` and call it in the component's `onDestroy`, or use `$effect` with automatic cleanup:
```typescript
let sub: Subscription | undefined;
// ...
sub = query.$.subscribe(...);
// In teardown:
return { /* ... */, destroy() { sub?.unsubscribe(); } };
```

### 3.3 MODERATE: Health Endpoint Has No Authentication

**File:** `src/routes/api/rxdb/health/+server.ts` (lines 6-24)

The health endpoint does not check `locals.user` before executing `SELECT 1` against Neon. While the query itself is harmless, it exposes database reachability information to unauthenticated users and can be used to probe whether the backend is connected to its database.

**Recommended fix:** Add `if (!locals.user) throw error(401, 'Unauthorized');` like the pull endpoint.

### 3.4 MODERATE: `bgResync()` Is Duplicated Across 11 Files

**Files affected:** All `optimistic-*.ts` files (optimistic.ts, optimistic-leases.ts, optimistic-properties.ts, optimistic-floors.ts, optimistic-rental-units.ts, optimistic-meters.ts, optimistic-expenses.ts, optimistic-budgets.ts, optimistic-payments.ts, optimistic-utility-billings.ts, optimistic-transactions.ts)

Each file contains an identical `bgResync()` function (8-10 lines). This is pure code duplication.

**Recommended fix:** Extract `bgResync()` into a shared module (e.g., `src/lib/db/optimistic-utils.ts`) and import it.

### 3.5 MODERATE: `resyncCollection` Calls `reSync()` + `awaitInSync()` on a Non-Live Replication

**File:** `src/lib/db/replication.ts` (lines 166-173)

The replication is configured with `live: false` (line 126). After the initial one-shot pull completes, calling `repl.reSync()` on a non-live replication re-triggers the pull handler. However, `awaitInSync()` on a non-live replication resolves immediately after the pull batch completes, even if there are more batches pending (for large datasets exceeding `batchSize: 200`).

**Impact:** For collections with more than 200 changed documents since the last checkpoint, `resyncCollection()` may resolve before all documents have been pulled. The UI would show partial data until the remaining batches arrive asynchronously.

**Recommended fix:** For non-live replications, after `reSync()`, check if `documents.length === batchSize` in the pull handler response and loop until a partial batch is returned, or switch to `live: true` with a very long `retryTime`.

---

## 4. Findings -- Minor Issues

### 4.1 MINOR: Dev-Mode AJV Validation Storage Wrapping Runs Inside Singleton

**File:** `src/lib/db/index.ts` (lines 84-88)

In dev mode, `wrappedValidateAjvStorage` is imported and applied inside the singleton creation IIFE. Because of the singleton pattern, this only runs once, so it is not actually a problem. Noted for completeness.

### 4.2 MINOR: `payments.billingIds` Nullability Mismatch Between Server and Client

**File:** `src/lib/db/schemas.ts` (line 228): `billing_ids: { type: ['array', 'null'], items: { type: 'number' } }`
**File:** `src/lib/server/schema.ts` (line 407): `billingIds: integer('billing_ids').array().notNull()`

The server schema declares `billingIds` as `NOT NULL`, but the RxDB schema allows null. The `transformPayment` function passes it through as `row.billingIds ?? null`. If the server enforces NOT NULL, the null branch is dead code. If the server has existing null values (from before the NOT NULL constraint), the RxDB schema correctly handles it. This is a minor inconsistency.

### 4.3 MINOR: Double `.defaultNow()` on Several Drizzle Columns

**File:** `src/lib/server/schema.ts`:
- `readings.updatedAt` (line 314)
- `leaseTenants.updatedAt` (line 371)
- `paymentAllocations.updatedAt` (line 420)
- `budgets.updatedAt` (line 477)

Each calls `.defaultNow().defaultNow()`. While Drizzle likely ignores the duplicate, it suggests a copy-paste error.

### 4.4 MINOR: `sid()` Transform Returns Empty String for Null/Undefined IDs

**File:** `src/lib/server/transforms.ts` (lines 15-17):
```typescript
function sid(v: number | string | null | undefined): string {
    return String(v ?? '');
}
```

If `v` is `null` or `undefined`, this returns `''` (empty string). An empty string primary key in RxDB is technically valid but could cause silent data corruption if a row somehow has a null ID. Returning `'0'` or throwing would be safer.

### 4.5 MINOR: No Index Definitions in RxDB Schemas

None of the 14 RxDB collection schemas define `indexes`. Queries that filter on `deleted_at`, `status`, `lease_id`, `property_id`, etc. will perform full collection scans. For small datasets this is fine, but as the dorm scales (hundreds of billings, readings, payments), query performance will degrade.

**Recommended fix:** Add `indexes` to frequently queried fields:
```typescript
indexes: ['deleted_at', 'status', 'lease_id']
```

### 4.6 MINOR: `rxdbInitialized` Flag Is Not Reactive

**File:** `src/routes/+layout.svelte` (line 54):
```typescript
let rxdbInitialized = false;
```

This is a plain `let`, not `$state()`. It is used inside a `$effect()` (line 69) as a guard. Because `$effect` tracks reactive reads and `rxdbInitialized` is not reactive, the effect will not re-run if this flag is somehow reset. In practice this is fine because the flag is only set once and the effect only needs to run once, but it is inconsistent with the Svelte 5 runes convention used elsewhere.

---

## 5. Findings -- Positive Observations

### 5.1 Microsecond-Precision Checkpoint Handling

**File:** `src/routes/api/rxdb/pull/[collection]/+server.ts` (lines 150-184)

The pull endpoint correctly preserves PostgreSQL's microsecond timestamp precision using `to_char(..., 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` and casts checkpoints as `::timestamptz` instead of going through JS `Date`. This prevents the infinite re-pull loop that commonly afflicts RxDB replication when using JavaScript's millisecond-precision Date objects.

### 5.2 Neon Quota Protection

**File:** `src/lib/db/replication.ts` (lines 13-14, 96-103)

The `neonDown` flag and 402/quota detection circuit breaker is well-implemented. When Neon's data transfer quota is exceeded, all 14 replications are cancelled immediately, preventing cascading errors and wasted requests.

### 5.3 Schema Mismatch Auto-Recovery

**File:** `src/routes/+layout.svelte` (lines 90-107)

The DB6 (schema mismatch) error handler automatically clears all IndexedDB databases and reloads the page. This is a pragmatic solution for the common issue of RxDB schema changes requiring a fresh database.

### 5.4 Optimistic Write Pattern Is Sound

The pattern of "server confirms, then optimistic write to RxDB, then background resync" is correct for a pull-only architecture. It ensures the UI updates instantly while maintaining eventual consistency with the server.

### 5.5 Centralized Transform Layer

**File:** `src/lib/server/transforms.ts`

Having a single file that maps Drizzle's camelCase output to RxDB's snake_case schemas is clean and maintainable. The `ts()` and `sid()` helpers ensure consistent type coercion.

---

## 6. Summary Table

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 2.1 | CRITICAL | `doc.remove()` creates tombstones that break pull-only replication | optimistic-properties/floors/rental-units/meters/expenses/budgets.ts |
| 2.2 | CRITICAL | FK type mismatch (number FKs vs string PKs) | schemas.ts, transforms.ts |
| 2.3 | CRITICAL | No mechanism to propagate server-side hard deletes to RxDB | pull/[collection]/+server.ts, schemas.ts |
| 3.1 | MODERATE | Plugin registration guard is ineffective | db/index.ts:25-30 |
| 3.2 | MODERATE | `createRxStore` never unsubscribes (memory leak) | stores/rx.svelte.ts:27 |
| 3.3 | MODERATE | Health endpoint has no authentication | api/rxdb/health/+server.ts |
| 3.4 | MODERATE | `bgResync()` duplicated across 11 files | all optimistic-*.ts files |
| 3.5 | MODERATE | `resyncCollection` may resolve before full dataset pulled | db/replication.ts:166-173 |
| 4.1 | MINOR | Dev-mode AJV import noted (benign due to singleton) | db/index.ts:84-88 |
| 4.2 | MINOR | `billingIds` nullability mismatch between server and client | schemas.ts:228, schema.ts:407 |
| 4.3 | MINOR | Double `.defaultNow()` on several Drizzle columns | schema.ts:314,371,420,477 |
| 4.4 | MINOR | `sid()` returns empty string for null IDs | transforms.ts:15-17 |
| 4.5 | MINOR | No RxDB indexes defined on any collection | schemas.ts (all schemas) |
| 4.6 | MINOR | `rxdbInitialized` flag is not reactive | +layout.svelte:54 |

---

## 7. Recommended Priority Order

1. **Fix `doc.remove()` tombstone issue (2.1)** -- Switch to soft-delete or use a different removal strategy. This is the most impactful bug because it silently corrupts local state.
2. **Add server-side hard-delete propagation (2.3)** -- Implement a mechanism (full-resync sweep, or `_deleted` flag in pull response) so the client can detect when records are removed from the server.
3. **Fix `createRxStore` memory leak (3.2)** -- Add subscription cleanup. This affects every page in the app.
4. **Normalize FK types (2.2)** -- Decide on string or number for FKs and enforce consistently. This prevents subtle join bugs.
5. **Extract shared `bgResync()` (3.4)** -- Quick DRY win across 11 files.
6. **Add RxDB indexes (4.5)** -- Performance improvement that scales with data growth.
7. **Authenticate health endpoint (3.3)** -- Security hardening.
