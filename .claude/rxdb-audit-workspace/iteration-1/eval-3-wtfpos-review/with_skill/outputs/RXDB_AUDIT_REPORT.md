# RxDB Audit Report

**App:** WTFPOS
**Date:** 2026-03-18
**Auditor:** Claude (rxdb-audit skill)

## Summary

| Category | Pass | Warn | Fail | N/A |
|----------|------|------|------|-----|
| 1. Authority Topology | 2 | 1 | 0 | 1 |
| 2. Adoption Justification | 2 | 1 | 0 | 0 |
| 3. Fundamental Patterns | 5 | 2 | 1 | 1 |
| 4. Sync Strategy | 3 | 2 | 1 | 0 |
| 5. Schema Design | 3 | 1 | 1 | 0 |
| 6. Initial Sync | 3 | 1 | 0 | 0 |
| 7. Storage Management | 0 | 1 | 2 | 1 |
| 8. Security | 0 | 1 | 2 | 2 |
| 9. Error Handling | 4 | 1 | 0 | 0 |
| **Total** | **22** | **11** | **7** | **5** |

**Overall Score:** 22 / 40 applicable items passed (55%)

## Context: WTFPOS Topology

WTFPOS operates on a LAN-only architecture with no cloud database. A single Mac Mini runs the SvelteKit server with an **in-memory** replication store (volatile, lost on restart). The server's local browser holds the canonical IndexedDB. LAN clients (iPads) use either IndexedDB or in-memory storage, syncing bidirectionally via SSE + HTTP push/pull against the server's in-memory store.

This is fundamentally different from the dorm app's Neon serverless model. There is no external database -- the SvelteKit process IS the database. This drastically changes what "call the server less" means: the "server" is localhost on the same machine or a device on the same LAN, so round-trips are cheap (<5ms). The economic lens here is about **reliability and data integrity**, not cloud compute costs.

---

## Critical Findings (FAIL)

### 1. No `navigator.storage.persist()` call anywhere
- **File:** Not present in any file under `apps/WTFPOS/src/`
- **Issue:** The server browser's IndexedDB is the single canonical data store for the entire POS system. If the browser evicts this data (Safari is aggressive about this), all historical orders, stock records, and financial data are permanently lost.
- **Impact:** Catastrophic data loss risk. Safari can evict IndexedDB at any time for unpersisted origins, especially under storage pressure.
- **Fix:** Call `navigator.storage.persist()` early in the server browser's initialization path (e.g., in `getDb()` before creating the database). At minimum:
  ```typescript
  if (navigator.storage?.persist && !isRemoteClient) {
    const persisted = await navigator.storage.persist();
    if (!persisted) _dbLog('warn', 'Storage persistence NOT granted - data at risk of eviction');
  }
  ```

### 2. No authentication on replication endpoints
- **File:** `src/routes/api/replication/[collection]/pull/+server.ts`, `src/routes/api/replication/[collection]/push/+server.ts`, `src/routes/api/replication/stream/+server.ts`
- **Issue:** All replication endpoints (pull, push, SSE stream) accept requests from any client on the network with zero authentication. Any device that can reach the server IP can read all POS data (orders, financial readings, expenses) and push arbitrary data into the replication store.
- **Impact:** On a restaurant LAN, any customer or unauthorized device could exfiltrate sales data or inject malicious records (fake orders, altered stock counts). The push endpoint has business logic guards for duplicates but no identity verification.
- **Fix:** Add at minimum a shared secret or PIN-based token validation. Since this is LAN-only without HTTPS, a pre-shared API key in a cookie or header would provide reasonable protection:
  ```typescript
  const token = request.headers.get('x-wtfpos-token');
  if (token !== env.REPLICATION_SECRET) throw error(401, 'Unauthorized');
  ```

### 3. No authorization / scope enforcement on pull endpoints
- **File:** `src/routes/api/replication/[collection]/pull/+server.ts:7-39`
- **Issue:** Any client can pull any collection. A kitchen iPad can pull expense records, financial readings, and audit logs. There is no scoping by role or device type.
- **Impact:** Data exposure beyond what each device role needs. While all devices are trusted on the LAN, the principle of least privilege is violated.
- **Fix:** Use the device's data mode or role (from the client-tracker) to restrict which collections it can pull. The `SELECTIVE_COLLECTIONS` concept already exists on the client side but is not enforced server-side.

### 4. No collection-level expiry or tombstone cleanup
- **File:** `src/lib/server/replication-store.ts` (no cleanup logic), `src/lib/db/` (no expiry logic)
- **Issue:** The in-memory replication store and the server's IndexedDB grow unboundedly. Old orders from months ago, historical stock events, and old KDS tickets remain in both the replication store and local storage forever. The replication store does not filter by time window, so thin clients pull ALL historical data on every full sync.
- **Impact:** Increasing memory pressure on the server process (the replication store holds ALL documents in RAM). On a busy restaurant doing 50+ orders/day, after 6 months that is 9,000+ order documents with nested items arrays, all held in memory. IndexedDB on the server also grows without bound.
- **Fix:**
  - Add a time-window filter to the pull endpoint (e.g., only pull orders from the last 90 days for clients).
  - Add a periodic cleanup in the replication store to evict old tombstoned/closed records.
  - Consider archiving old orders to a file or cloud backup.

### 5. No storage usage monitoring
- **File:** Not present in any file under `apps/WTFPOS/src/`
- **Issue:** There is no mechanism to track IndexedDB usage or warn when the server browser approaches storage limits. Given that this single IndexedDB is the canonical data store, running out of space silently would be catastrophic.
- **Impact:** The server could silently fail to write new orders if IndexedDB fills up.
- **Fix:** Periodically check `navigator.storage.estimate()` and surface warnings in the admin UI when usage exceeds 80% of quota.

### 6. `_deleted` not explicitly in RxDB schemas
- **File:** `src/lib/db/schemas.ts` (all schemas)
- **Issue:** None of the 15 RxDB collection schemas declare a `_deleted` field. RxDB handles `_deleted` internally via its own metadata, but the server-side replication store (`replication-store.ts:158`) explicitly checks `doc._deleted` for its `count()` method, and the push endpoint guards check `!doc._deleted`. This works because RxDB adds `_deleted` to the document during replication, but it is not part of the declared schema contract.
- **Impact:** Minor -- RxDB manages `_deleted` automatically for its built-in replication protocol. The server store's reliance on `_deleted` without it being in the schema means the deletion contract is implicit rather than explicit.
- **Fix:** This is acceptable for RxDB's built-in protocol. Document that `_deleted` is managed by the replication plugin, not the application schema.

### 7. `live: true` with aggressive polling fallback
- **File:** `src/lib/db/replication.ts:563` (live: true), `replication.ts:475-483` (server 10s poll), `replication.ts:495-500` (client 30s poll)
- **Issue:** Replication uses `live: true` combined with SSE and polling fallbacks. While `live: true` is flagged as dangerous with serverless databases, WTFPOS uses a local Node.js server -- no cloud compute cost. However, the server browser polls 9 secondary collections every 10 seconds and clients poll 6 priority collections every 30 seconds, triggering pull requests even when nothing has changed.
- **Impact:** Server: 54 pull requests/minute of empty responses. Each client: 12 pull requests/minute. With 4 client devices, ~102 pull requests/minute total. On LAN this is nearly free but adds unnecessary noise.
- **Fix:** Increase polling intervals: server secondary from 10s to 60s, client priority from 30s to 120s. SSE already provides instant delivery; polling is only a safety net.

---

## Warnings (WARN)

### 1. Authority topology is implicit, not declared per-collection
- **File:** `src/lib/db/replication.ts` (general), `src/lib/db/write-proxy.ts`
- **Issue:** The authority model is implicitly defined by code but not documented per collection. The server browser is the canonical write authority for most collections (via `isFullRxDbMode()` check in `write-proxy.ts:210`), while thin clients write via HTTP to the server.
- **Impact:** Without explicit documentation, it is unclear which collections can be written from which devices and what happens during conflicts.
- **Fix:** Add a collection authority map documenting each collection's write authority and conflict strategy.

### 2. No explicit conflict handler declared on RxDB replication
- **File:** `src/lib/db/replication.ts:560-623`
- **Issue:** The `replicateRxCollection()` call does not declare a `conflictHandler`. RxDB defaults to LWW. The server-side replication store implements field-level merge for 5 collections (`replication-store.ts:49`), but the client is unaware of this merge strategy.
- **Impact:** When the server returns a conflict, RxDB's default LWW handler may disagree with the server's field-level merge, potentially causing resolution loops.
- **Fix:** Implement a custom RxDB `conflictHandler` that matches the server's merge semantics, or document why default LWW is acceptable.

### 3. Monetary fields use `number` type
- **File:** `src/lib/db/schemas.ts` -- `orderSchema:143-144` (`subtotal`, `total`), `expenseSchema:395` (`amount`), `readingSchema:457-465` (`grossSales`, etc.)
- **Issue:** All monetary fields are `{ type: 'number' }`. IEEE 754 floating-point can cause cent-level rounding errors in VAT calculations or discount splits.
- **Impact:** Minor for whole-peso restaurant prices. Could cause discrepancies in BIR tax reporting.
- **Fix:** Acceptable for current price structure. Monitor for fractional centavo issues if prices change.

### 4. Large order documents with nested arrays
- **File:** `src/lib/db/schemas.ts:73-197` (orderSchema)
- **Issue:** Orders embed items, payments, discountEntries, and subBills as nested arrays. A single order document could reach 5-10KB. Every field update replicates the entire document.
- **Impact:** With SSE broadcasting, all connected devices receive the full order on every change.
- **Fix:** Acceptable trade-off for POS orders with 5-15 items. Monitor if sizes grow.

### 5. Bootstrap cost potentially large for historical data
- **File:** `src/lib/server/replication-store.ts` (no time-window filter on pull)
- **Issue:** New clients or post-reset clients pull ALL documents from ALL collections with no time-window filter. After months of operation, this means pulling thousands of old records.
- **Impact:** Slow initial sync on thin clients. Memory pressure on in-memory storage clients.
- **Fix:** Add a `since` parameter to pull endpoints for historical collections.

### 6. Server safety-net poll too frequent
- **File:** `src/lib/db/replication.ts:474-483`
- **Issue:** Server polls 9 secondary collections every 10 seconds. Since the server writes to its own RxDB and pushes directly to the store, these polls rarely catch new data.
- **Impact:** 54 unnecessary pull requests/minute from server to itself.
- **Fix:** Increase to 30-60s.

### 7. RxDB `retryTime: 1_000` too aggressive
- **File:** `src/lib/db/replication.ts:564`
- **Issue:** Fixed 1-second retry for all collections. The `calculateBackoff` utility exists but is only used for logging, not for controlling retries. When the server is down, 15 collections retry every 1 second = 900 requests/minute before circuit breaker opens (after ~1.5s).
- **Impact:** Brief retry storm on server failure, mitigated by circuit breaker.
- **Fix:** Increase `retryTime` to 5_000. SSE provides instant notifications for normal operation.

### 8. Thin client memory storage has no size guardrail
- **File:** `src/lib/db/index.ts:138-139`
- **Issue:** Thin clients use `getRxStorageMemory()` with no limit on accumulated documents.
- **Impact:** On iPads with limited memory, after hours of operation, memory usage could grow until the tab crashes.
- **Fix:** Add document count monitoring and prune old data when thresholds are exceeded.

### 9. Push batch size (200) lower than pull batch size (500)
- **File:** `src/lib/db/replication.ts:621` (push: 200) vs `replication.ts:595` (pull: 500)
- **Issue:** During full re-push after server restart, ~1700 docs are pushed in batches of 200 = 9 requests per collection, 135 total.
- **Impact:** Slightly slower full re-push. Negligible on LAN.
- **Fix:** Consider matching push batch to 500.

### 10. No encryption at rest for financial data
- **File:** `src/lib/db/schemas.ts` (no encryption plugin)
- **Issue:** Financial readings, payment data, and discount ID photos stored unencrypted in IndexedDB.
- **Impact:** Low risk on private LAN. May matter for BIR compliance.
- **Fix:** Enable RxDB encryption for `readings` and `orders` if compliance requires it.

### 11. Backoff utility exists but is not wired into RxDB retry logic
- **File:** `src/lib/utils/backoff.ts`, `src/lib/db/replication.ts:634`
- **Issue:** `calculateBackoff()` is imported and called in the error handler, but only for logging the "next retry" estimate. RxDB's actual retry timing is controlled by the fixed `retryTime: 1_000` parameter.
- **Impact:** Misleading logs -- the logged backoff time does not match actual retry timing.
- **Fix:** Either wire backoff into a custom retry mechanism or remove the misleading log.

---

## Passing Items

### Authority Topology
- **Client-authoritative write path is well-defined** (`write-proxy.ts:209-214`): Server browser writes to local RxDB; thin clients write via HTTP proxy to server. Clean separation.
- **Pull-only collections effectively exist**: `menu_items` and `devices` are server-seeded. Thin clients only pull, not push.

### Adoption Justification
- **Collections pass the 6-dimension evaluation**: High read multiplicity (multiple iPads), high write frequency, unreliable network (Wi-Fi drops). RxDB is justified.
- **Collections scoped to client needs**: `SELECTIVE_COLLECTIONS` limits thin clients to 6 of 15 collections.

### Fundamental Patterns
- **Checkpoint pattern correctly implemented**: Pull uses `updatedAt` + `id` composite checkpoint with binary search (`replication-store.ts:178-191`).
- **`updatedAt` indexed on every schema**: All 15 schemas include `'updatedAt'` in indexes.
- **Timestamp precision handled**: Consistent JavaScript ISO strings (no PostgreSQL mismatch).
- **Empty pulls are cheap**: Binary search to end of index, empty slice, negligible cost.
- **Server-side conflict resolution is sophisticated**: Field-level merge for 5 collections, CRDT monotonic fields, 6 business logic guards in push endpoint.

### Sync Strategy
- **SSE-based cross-device notifications**: Single multiplexed SSE stream avoids 6-connection limit.
- **Writes effectively batched**: RxDB push batches up to 200 changes; write-proxy debounces at 50ms.
- **Event-driven pulls**: Primary mechanism is SSE-driven Subject streams.

### Schema Design
- **Every collection has `id` and `updatedAt`**: All 15 schemas confirmed.
- **Primary keys are strings**: All use `primaryKey: 'id'` with `type: 'string'`.
- **Key compression N/A**: LAN bandwidth makes compression unnecessary.

### Initial Sync
- **Bootstrap is paginated**: Checkpoint-based with configurable batch size (500 default, 1000 max).
- **Critical collections sync first**: Priority/secondary split with progress tracking.
- **Loading states exist**: `SyncActivity` interface with `subscribeSyncActivity()` API.

### Error Handling
- **Network failures don't lose data**: Server IndexedDB persists locally; thin client writes fail visibly.
- **Schema migration well-supported**: Up to 14 migration versions per collection with `addUpdatedAt()` helper.
- **Circuit breaker exists**: `CircuitBreaker` class with closed/open/half-open states, threshold=20, reset=15s.
- **Comprehensive auto-recovery**: DB init timeout + nuke, emergency reset for schema errors, stale client auto-recovery, generation-based re-push detection.

---

## Server Cost Assessment

- **Current efficiency:** N/A (LAN-only architecture, no cloud database)
- **Biggest cost driver:** This app has no external database costs. The primary resource concerns are **memory usage** on the server process (in-memory replication store holding all documents in RAM) and **IndexedDB durability** (single canonical copy on one Mac Mini).
- **Estimated savings from fixes:** The polling frequency reduction would cut localhost HTTP noise by ~80% but has negligible real-world impact. The critical fixes (storage persistence, auth, data expiry) address **data integrity and security** rather than cost.

---

## Recommendations (Priority Order)

1. **Add `navigator.storage.persist()`** on the server browser immediately. One-line fix preventing catastrophic data loss from Safari storage eviction. The server's IndexedDB is the single source of truth.

2. **Add authentication to replication endpoints.** Even a simple pre-shared API key prevents unauthorized LAN devices from reading/writing POS data.

3. **Add time-window filtering to pull endpoints** for historical collections (orders, stock_events, deductions, expenses, readings, audit_logs). Thin clients should only sync the last 7-30 days. Reduces memory pressure on iPads and speeds up initial sync.

4. **Add storage monitoring** (`navigator.storage.estimate()`) with admin UI warnings. Alert the operator before IndexedDB fills up.

5. **Increase polling intervals**: Server secondary from 10s to 60s, client priority from 30s to 120s. SSE is the primary delivery mechanism; polling should be infrequent.

6. **Document the authority model** per collection. Add a table mapping each collection to its authority type and conflict resolution strategy.

7. **Add a custom RxDB conflictHandler** matching the server's field-level merge logic, or verify default LWW produces acceptable results alongside server-side merges.
