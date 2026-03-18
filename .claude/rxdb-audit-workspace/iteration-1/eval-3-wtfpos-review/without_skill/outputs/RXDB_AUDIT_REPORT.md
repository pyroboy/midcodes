# WTFPOS Offline-First Architecture Review

**App:** `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS/`
**Date:** 2026-03-18
**Reviewer:** Claude Opus 4.6

---

## 1. Architecture Summary

WTFPOS uses a **LAN-first** (not internet-offline-first) architecture where a single Mac server running SvelteKit holds the canonical IndexedDB (via RxDB + Dexie) and an in-memory replication store. Thin clients (iPads on the LAN) replicate data via HTTP push/pull and a multiplexed SSE stream.

### Key Components

| Layer | File | Role |
|-------|------|------|
| DB Init | `src/lib/db/index.ts` | Singleton RxDB database, Dexie (server) or Memory (thin clients) |
| Schemas | `src/lib/db/schemas.ts` | 15 collection schemas, 14 with migration strategies |
| Replication (client) | `src/lib/db/replication.ts` | RxDB `replicateRxCollection` with SSE + poll fallback |
| Write Proxy | `src/lib/db/write-proxy.ts` | Abstracts writes: RxDB (server) vs HTTP (thin clients) |
| Replication Store (server) | `src/lib/server/replication-store.ts` | In-memory Map + sorted index, per-collection |
| Pull API | `src/routes/api/replication/[collection]/pull/+server.ts` | Checkpoint-based pull pagination |
| Push API | `src/routes/api/replication/[collection]/push/+server.ts` | Push with 6 business-logic guards |
| SSE Stream | `src/routes/api/replication/stream/+server.ts` | Single multiplexed SSE for all collections |
| Data Mode | `src/lib/stores/data-mode.svelte.ts` | Determines full-rxdb vs selective-rxdb per device/role |

### Data Flow

```
Server Mac (IndexedDB/Dexie) <--push/pull--> In-Memory Store <--SSE/pull--> Thin Clients (Memory storage)
```

---

## 2. Strengths

### 2.1 Multiplexed SSE Stream (Single Connection)
**File:** `src/routes/api/replication/stream/+server.ts` (lines 1-146)

The SSE stream multiplexes all 15 collections over a single `EventSource` connection. This avoids the browser's 6-connection-per-host HTTP/1.1 limit that would otherwise require 15+ connections. The implementation includes heartbeat (30s), abort cleanup, and test-doc filtering.

### 2.2 Tiered Collection Loading
**File:** `src/lib/db/index.ts` (lines 185-416)

Thin clients only load 6 priority collections (tables, orders, menu_items, kds_tickets, devices, floor_elements), cutting IndexedDB work by ~66%. The server loads all 15. This is a smart optimization for iPad devices that only need POS-relevant data.

### 2.3 Memory Storage for Thin Clients
**File:** `src/lib/db/index.ts` (lines 131-140)

Remote clients use `getRxStorageMemory()` instead of Dexie/IndexedDB. This eliminates Mobile Safari IndexedDB bugs and provides instant initialization. Since thin clients always re-sync from the server on load, persistence is unnecessary.

### 2.4 Server-Side Business Logic Guards
**File:** `src/routes/api/replication/[collection]/push/+server.ts` (lines 48-508)

Six guards run before data is accepted into the server store:
1. **Duplicate table orders** (lines 175-265) -- with orphan auto-healing
2. **Invalid table state transitions** (lines 60-105) -- enforces valid FSM transitions
3. **Duplicate KDS tickets** (lines 272-344) -- merges items instead of rejecting
4. **Invalid order state transitions** (lines 117-162) -- prevents paid/cancelled mutations
5. **Duplicate active shifts** (lines 349-396) -- one open shift per location
6. **Duplicate Z-reads** (lines 401-451) -- BIR compliance: one per date per location
7. **Auto-bump side effect** (lines 457-508) -- bumps KDS tickets when order closes

This is excellent domain-specific conflict resolution that goes beyond generic LWW.

### 2.5 Field-Level Merge (CRDT-like)
**File:** `src/lib/server/replication-store.ts` (lines 42-115)

Instead of pure last-write-wins, the server performs field-level merge for eligible collections (orders, tables, kds_tickets, stock_items, deliveries). The `tryFieldMerge` function compares the assumed state to detect which fields each side changed, and applies non-overlapping changes from both. Monotonic fields (e.g., `deliveries.usedQty`) use `Math.max()` to prevent lost increments -- a lightweight CRDT pattern.

### 2.6 Generation-Based Replication Identity
**File:** `src/lib/db/replication.ts` (lines 199-273)

The generation counter (`wtfpos-sync-gen` in localStorage) + server epoch detection avoids fragile internal checkpoint manipulation. When the server restarts (empty store or epoch mismatch), the client bumps its generation, which forces RxDB to start from `checkpoint=null` for a full re-sync.

### 2.7 Write Proxy with Per-Document Queue
**File:** `src/lib/db/write-proxy.ts` (lines 50-67)

The `enqueue()` function serializes concurrent writes to the same document ID. Without this, concurrent `incrementalModify` calls (e.g., adding 15 items rapidly) would all read the same stale base and overwrite each other. The queue key is scoped to `collection:docId` for minimal contention.

### 2.8 Comprehensive Reset Protocol
**Files:** `src/lib/db/replication.ts` (lines 1067-1245), `src/routes/api/replication/reset/+server.ts`

The reset flow is well-choreographed:
- Server: RESET_ALL broadcast -> clear stores -> block writes -> server reloads -> seeds -> pushes -> SERVER_READY broadcast -> unblock writes
- Client: receives RESET_ALL -> stops replication -> shows overlay -> waits for SERVER_READY via temporary SSE -> clears local DB -> reloads

Multi-tab coordination uses `BroadcastChannel` (line 74-85 of replication.ts).

### 2.9 Diagnostic Infrastructure
**File:** `src/lib/db/replication.ts` (lines 708-785)

A 3-phase diagnostic runs 5 seconds after replication starts:
1. HTTP pull test (can we reach the server?)
2. Local RxDB count (did replication actually write data?)
3. Push test (can we push to the server?)

Results are posted via `remoteLog()` to the server console, visible for iPad debugging.

---

## 3. Issues and Risks

### 3.1 [CRITICAL] In-Memory Server Store = Single Point of Failure
**File:** `src/lib/server/replication-store.ts` (lines 1-15)

The server's replication store is a volatile in-memory `Map`. A server process crash, OOM kill, or unhandled exception wipes all data. The only recovery path is the server browser's IndexedDB re-pushing everything -- but if the browser tab is also closed, data is lost until the browser reopens and seeds from local storage.

**Risk:** In a restaurant environment, a power outage or accidental process kill during peak hours could cause data loss if the server browser tab is not immediately reopened.

**Recommendation:** Consider periodic snapshotting of the in-memory store to a file (e.g., JSON dump to disk every 30s). This would allow recovery without depending on the browser tab.

### 3.2 [HIGH] No Durability Guarantee for Thin Client Writes
**File:** `src/lib/db/write-proxy.ts` (lines 73-148)

Thin clients (selective-rxdb mode) write directly to the server via HTTP (`createServerProxy`). If the server is down or the network drops mid-write, the write is lost -- there is no local queue or retry mechanism. The `fetch` call throws, and the error propagates to the caller.

**Risk:** A waiter adding items to an order on an iPad could lose the write if the LAN hiccups at that moment.

**Recommendation:** Add a local write-ahead log (even in memory) that retries failed server writes. Alternatively, leverage RxDB's built-in push replication for thin clients instead of bypassing it.

### 3.3 [HIGH] Unbounded In-Memory Growth
**File:** `src/lib/server/replication-store.ts` (lines 126-281)

The `CollectionStore` never evicts documents. Over weeks of operation, collections like `orders`, `audit_logs`, and `deductions` will grow unboundedly in the server's Node.js heap. The comment on line 14 says "tested safe up to ~500K docs" but provides no eviction strategy.

**Risk:** A busy restaurant generating 100+ orders/day will accumulate thousands of documents over time. Combined with the sorted index (2x memory per doc), this could cause OOM in a long-running process.

**Recommendation:** Implement a TTL or date-based eviction for historical collections (e.g., only keep last 7 days of orders in memory, archive older ones to disk/cloud).

### 3.4 [HIGH] O(n) Linear Scans in Push Guards
**File:** `src/routes/api/replication/[collection]/push/+server.ts` (lines 186, 281, 358, 411)

Multiple push guards call `store.pull(null, Infinity).documents` to get ALL documents in a collection, then use `.find()` for linear scans:

```typescript
// Line 186
const allDocs = ordersStore.pull(null, Infinity).documents;
// Line 201
const existing = allDocs.find(...)
```

This is O(n) per guard per push. For a collection with thousands of orders, this becomes expensive. The `filterDuplicateTableOrders` guard also pulls the entire `tables` store (line 213).

**Recommendation:** Maintain secondary indexes (e.g., a `Map<tableId, orderId>` for open orders) that can be updated incrementally on push, reducing guard checks to O(1).

### 3.5 [MEDIUM] Race Condition in Server State Check
**File:** `src/lib/db/replication.ts` (lines 349-368)

The "server store incomplete" detection at line 360 compares `storeTotal < localTotal * 0.5`. Between `checkServerState()` and `startReplication()`, another client could push data, changing the store total. The threshold of 50% is also arbitrary -- a 49% data loss would not trigger re-push.

Additionally, there is a potential infinite recursion guard: the `if (!options?.generation)` check (line 349) prevents recursion, but the logic at line 360 also calls `startReplication(db, { generation: newGen })` which could still trigger the 50% check on the recursive call if `storeTotal` changes between calls.

**Recommendation:** The recursion is actually safe because the recursive call has `options.generation` set (line 366 skips the check). But the 50% threshold should be documented and possibly made configurable.

### 3.6 [MEDIUM] No Conflict Resolution UI
**File:** `src/lib/server/replication-store.ts` (lines 227-281)

When field-level merge fails (both sides changed the same field to different values), the server returns a conflict to RxDB. RxDB's default conflict handler silently drops the client's change in favor of the server's version. There is no user-facing notification that their edit was overwritten.

**Recommendation:** Add a custom conflict handler (`conflictHandler` option in `replicateRxCollection`) that at minimum logs the conflict, or better yet surfaces it in a toast notification.

### 3.7 [MEDIUM] Schema Validation Only in Dev Mode
**File:** `src/lib/db/index.ts` (lines 142-144)

The AJV schema validator (`wrappedValidateAjvStorage`) is only applied in development:

```typescript
if (dev) {
    storage = wrappedValidateAjvStorage({ storage });
}
```

In production, invalid documents can be inserted into RxDB without schema validation, potentially causing downstream errors in queries or replication.

**Recommendation:** This is a deliberate performance trade-off, but consider enabling validation for writes only (not reads) in production, or at minimum validating data at the server push endpoint.

### 3.8 [MEDIUM] SSE Reconnection Gap
**File:** `src/lib/db/replication.ts` (lines 411-470)

When the SSE stream drops and `EventSource` auto-reconnects, any events emitted during the gap are lost. The mitigation is:
- Server: gentle sequential resync of priority collections on `onopen` (lines 443-452)
- Client: resync all collections on `onerror` (lines 462-466)
- Safety-net polling: server every 10s, clients every 30s

However, the client's `onerror` handler fires RESYNC for all collections simultaneously, which could saturate the connection pool during recovery. The server's `onopen` handler correctly staggers by 100ms.

**Recommendation:** Stagger client-side RESYNC on SSE error to match server behavior.

### 3.9 [LOW] `expenseTemplateSchema` Defined but Not Registered
**File:** `src/lib/db/schemas.ts` (lines 532-552)

The `expenseTemplateSchema` is exported from schemas.ts but is not imported or used in `src/lib/db/index.ts`. It is also not listed in the `VALID_COLLECTIONS` set in `replication-store.ts` or the `ALL_COLLECTIONS` array in `stream/+server.ts`.

**Impact:** Dead code. If expense templates are intended to be replicated, they are silently missing from the system.

### 3.10 [LOW] Sorted Index Rebuild Strategy
**File:** `src/lib/server/replication-store.ts` (lines 168-176)

The `ensureIndex()` method rebuilds the entire sorted index from scratch when dirty:

```typescript
this.sortedIndex = Array.from(this.docs.entries()).map(...)
this.sortedIndex.sort((a, b) => a.key.localeCompare(b.key));
```

For a collection with 10K+ documents, this is O(n log n) on every pull after a push. The index is marked dirty on every push (line 271), so every pull triggers a full rebuild.

**Recommendation:** Use an incremental insertion strategy (binary search + splice) during push instead of lazy full rebuild. The existing `findAfter` binary search could be reused for O(log n) insertion.

### 3.11 [LOW] Hardcoded Collection Lists in Multiple Files
The list of valid collections appears in at least 4 places:
- `src/lib/server/replication-store.ts` line 330: `VALID_COLLECTIONS`
- `src/routes/api/replication/stream/+server.ts` line 12: `ALL_COLLECTIONS`
- `src/routes/api/replication/status/+server.ts` line 8: `ALL_COLLECTIONS`
- `src/lib/db/replication.ts` lines 48-57: `PRIORITY_COLLECTIONS` + `SECONDARY_COLLECTIONS`

Adding a new collection requires updating all 4 files. A mismatch would cause silent replication failures.

**Recommendation:** Extract to a shared `COLLECTION_NAMES` constant in a single module imported everywhere.

### 3.12 [LOW] Circuit Breaker Threshold May Be Too High
**File:** `src/lib/db/replication.ts` (line 92)

```typescript
serverBreaker: new CircuitBreaker({ failureThreshold: 20, resetTimeoutMs: 15_000 }),
```

A failure threshold of 20 means 20 consecutive failures before the breaker opens. On a LAN with 15 collections, each retrying independently, this means the system will hammer a dead server with ~20 * 15 = 300 failed requests before backing off.

**Recommendation:** Lower the threshold to 3-5 failures, which is more standard for circuit breakers. The 1s retry time (`retryTime: 1_000`) compounds this -- 15 collections * 20 failures * 1s = 300 requests in ~20 seconds.

---

## 4. Schema Review

### 4.1 Schema Versions and Migrations
| Collection | Version | Migration Strategies |
|------------|---------|---------------------|
| tables | 3 | 3 strategies |
| orders | 14 | 14 strategies |
| menu_items | 3 | 3 strategies |
| stock_items | 3 | 3 strategies |
| deliveries | 5 | 5 strategies |
| stock_events | 1 | 1 strategy |
| deductions | 3 | 3 strategies |
| expenses | 6 | 6 strategies |
| stock_counts | 5 | 5 strategies |
| devices | 6 | 6 strategies |
| kds_tickets | 6 | 6 strategies |
| readings | 1 | 1 strategy |
| audit_logs | 1 | 1 strategy |
| floor_elements | 2 | 2 strategies |
| shifts | 0 | None |

The `orders` collection at version 14 has accumulated significant migration complexity. Each version bump adds ~5-10 lines of migration code. This is manageable but should be monitored -- RxDB runs all migrations sequentially for documents at old versions.

### 4.2 Index Design
Most schemas index `updatedAt` (required for checkpoint-based replication) and `locationId` (multi-branch filtering). Composite indexes like `['locationId', 'status']` on tables and `['locationId', 'createdAt']` on orders support common query patterns.

The `orders` schema has 6 indexes, which is the most of any collection. This is acceptable given orders is the most heavily queried collection.

### 4.3 Missing `updatedAt` Default
All schemas require `updatedAt` but none set a default value. The `addUpdatedAt` migration helper (index.ts line 61) backfills during migration, but newly created documents must always include `updatedAt` explicitly. The write proxy's `incrementalPatch` (write-proxy.ts line 176) correctly sets `updatedAt: new Date().toISOString()`.

---

## 5. Replication Protocol Analysis

### 5.1 Checkpoint Format
Checkpoint is `{ id: string, updatedAt: string }`. The pull endpoint (pull/+server.ts line 20-21) reconstructs this from query params. The sorted index key is `updatedAt\0id` (replication-store.ts line 39), providing deterministic ordering even for documents with the same `updatedAt`.

### 5.2 Conflict Detection
Conflicts are detected by comparing `current.updatedAt !== row.assumedMasterState.updatedAt` (replication-store.ts line 243). This is a timestamp-based optimistic concurrency check. It works correctly for this LAN use case where clock skew is negligible (all devices use the same server's clock via network time).

### 5.3 Push Batch Size
Client push: 200 docs per batch (replication.ts line 621). Server pull: up to 500 docs per request, capped at 1000 (pull/+server.ts line 18). These are reasonable for LAN bandwidth.

### 5.4 Soft Delete Handling
The `count()` method in CollectionStore (replication-store.ts line 155-160) correctly excludes `_deleted` documents. The pull endpoint does not filter deleted docs (they need to propagate), which is correct -- RxDB needs to know about deletions.

---

## 6. Data Mode Architecture

The `data-mode.svelte.ts` file defines 4 modes, but only 2 are currently used:
- **full-rxdb**: Server tablet + owner/admin/manager clients. All 15 collections.
- **selective-rxdb**: Staff/kitchen clients. 6 priority collections only.

The `sse-only` and `api-fetch` modes are defined but unused (lines 137-144 are helper functions with no callers in production code paths). This is clean forward-planning for Phase 3.

The write proxy (write-proxy.ts line 209-213) correctly routes:
- `full-rxdb` -> writes to local RxDB (pushed via replication)
- `selective-rxdb` -> writes to server HTTP (bypasses local RxDB)

This avoids relying on RxDB's background push for thin clients, which is a pragmatic choice given memory storage quirks.

---

## 7. Resilience Features

| Feature | Implementation | Rating |
|---------|---------------|--------|
| Server restart detection | Epoch-based (replication.ts line 258) | Good |
| IndexedDB corruption recovery | Auto-delete + reload (index.ts line 554) | Good |
| Migration timeout | Per-device timeouts, retry with IDB nuke (index.ts line 434) | Good |
| SSE gap recovery | Poll fallback (server 10s, client 30s) | Good |
| Tab visibility recovery | visibilitychange resync (replication.ts line 507-534) | Good |
| Multi-tab reset coordination | BroadcastChannel (replication.ts line 74-85) | Good |
| Circuit breaker | Shared across collections (replication.ts line 92) | Adequate (see 3.12) |
| Remote logging | Client-to-server log posting (replication.ts line 36-45) | Excellent |
| Emergency reset URL | `?reset-db=1` query param (index.ts line 89) | Excellent |
| Reset overlay UX | Full-screen overlays for server/client (replication.ts line 1120-1140) | Good |
| Auto-recovery for stuck clients | 15s timeout -> clear DB -> reload (replication.ts line 834-866) | Good |

---

## 8. Summary of Recommendations (Priority Order)

1. **[CRITICAL]** Add periodic disk snapshots of the in-memory store to survive process crashes
2. **[HIGH]** Add a write-ahead log or retry queue for thin client HTTP writes
3. **[HIGH]** Implement TTL/eviction for historical collections to prevent unbounded memory growth
4. **[HIGH]** Replace O(n) linear scans in push guards with secondary indexes
5. **[MEDIUM]** Add custom conflict handler with user notification
6. **[MEDIUM]** Stagger client-side RESYNC on SSE error to match server behavior
7. **[LOW]** Extract collection name lists to a single shared constant
8. **[LOW]** Use incremental index insertion instead of full rebuild on push
9. **[LOW]** Lower circuit breaker failure threshold from 20 to 3-5
10. **[LOW]** Clean up unused `expenseTemplateSchema`

---

## 9. Files Reviewed

| File | Path |
|------|------|
| DB Init | `src/lib/db/index.ts` |
| Schemas | `src/lib/db/schemas.ts` |
| Replication (client) | `src/lib/db/replication.ts` |
| Write Proxy | `src/lib/db/write-proxy.ts` |
| Replication Store (server) | `src/lib/server/replication-store.ts` |
| Pull Endpoint | `src/routes/api/replication/[collection]/pull/+server.ts` |
| Push Endpoint | `src/routes/api/replication/[collection]/push/+server.ts` |
| SSE Stream | `src/routes/api/replication/stream/+server.ts` |
| Status Endpoint | `src/routes/api/replication/status/+server.ts` |
| Reset Endpoint | `src/routes/api/replication/reset/+server.ts` |
| Server Ready | `src/routes/api/replication/server-ready/+server.ts` |
| Sync Check | `src/routes/api/replication/sync-check/+server.ts` |
| Data Mode | `src/lib/stores/data-mode.svelte.ts` |
