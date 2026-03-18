# RxDB Sync Efficiency Audit -- Key Findings

## Short answer: The sync is reasonably designed but you ARE calling Neon too much due to double-resyncs.

## Query Counts Per Action

| User Action | Server Queries | Client Resyncs | Total Neon Queries |
|------------|:--------------:|:--------------:|:------------------:|
| App startup | 1 (health) | 14 (all collections) | **15** |
| Create tenant | 3 | 1 (optimistic bgResync) | **4** |
| Create lease | 2 | 5 (refreshData carpet-bomb) | **7** |
| Submit payment (lease page) | 1 | 5 (refreshData) | **6** |
| Submit payment (transactions) | 1 | 2 (payments + billings) | **3** |
| Utility reading save | 1+ | 3 (readings + billings + meters) | **4+** |
| Manual refresh (sync modal) | 0 | 14 (resyncAll) | **14** |

## Top 3 Problems

### 1. Double Resync (HIGH -- systematic across all entities)
Every optimistic module (`src/lib/db/optimistic-*.ts`) calls `bgResync()` unconditionally after writing to RxDB. But the page-level code (`+page.svelte`) ALSO calls `resyncCollection()` for the same mutation. This doubles Neon pulls for many actions.

- `optimistic.ts` line 75: always calls `bgResync('tenants')` after upsert
- `optimistic-payments.ts` lines 43-44: always calls `bgResync('payments')` + `bgResync('billings')`
- Pages call `resyncCollection()` again in their own success/error handlers

### 2. Lease `refreshData` Carpet-Bomb (HIGH)
`src/routes/leases/+page.svelte` lines 295-307 fires 5 parallel resyncs after ANY lease action:
```
['leases', 'lease_tenants', 'billings', 'payments', 'payment_allocations']
```
A payment only changes `payments` + `billings` + `payment_allocations`, but leases and lease_tenants get resynced too.

### 3. No Resync Deduplication (MEDIUM)
`src/lib/db/replication.ts` lines 166-173 -- `resyncCollection()` has no deduplication. Calling it twice for the same collection fires two separate Neon pulls. Combined with the double-resync problem, billings can be pulled 2-3 times within the same second.

## What's Working Well
- **Pull-only, no polling** (`live: false` in replication.ts line 126) -- correct for Neon free tier
- **Checkpoint pagination** with microsecond-precision timestamps (pull endpoint line 159) -- prevents infinite loops
- **Health check preflight** before firing 14 pulls -- avoids wasting queries when Neon is down
- **Quota detection** (402/exceeded quota handling in replication.ts lines 96-103) -- graceful degradation

## Recommendations (by priority)
1. **Add resync deduplication** -- if a resync for collection X is already in-flight, skip the duplicate
2. **Remove `bgResync()` from optimistic modules** -- let pages own resyncs
3. **Replace `refreshData` with targeted resyncs** per action type
4. **Consider a batch pull endpoint** to collapse the 14-query startup burst into 1-2 queries

Fixing #1-3 would reduce Neon queries by approximately 30-50% with no functional impact.
