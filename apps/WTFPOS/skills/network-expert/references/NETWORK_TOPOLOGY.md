# WTFPOS — Network Topology & Synchronization Reference

> **Last updated:** 2026-03-13
> **Phase:** 1 (Local-First + Thin Client) — ACTIVE

---

## 1. Physical Deployment Topology

### Per-Branch Architecture (Star Topology)

Each branch runs a **single main tablet** as the Node.js server. All other devices are browser clients on the same WiFi LAN.

```
Branch (e.g., Alta Citta — Tagbilaran)
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MAIN TABLET (SvelteKit Node Server)                  │
│   ────────────────────────────────────                  │
│   • Runs: node build (adapter-node, port 3000)         │
│   • Storage: RxDB + IndexedDB (Dexie) — canonical      │
│   • Serves: API routes + static SvelteKit app           │
│   • Hosts: In-memory replication store (volatile)       │
│   • Hosts: SSE kitchen broadcaster (module-level)       │
│                                                         │
│           WiFi LAN (192.168.x.x:3000)                  │
│   ┌───────────┬───────────┬───────────┐                │
│   │           │           │           │                │
│   ▼           ▼           ▼           ▼                │
│ POS Tab 1  POS Tab 2  KDS Tablet  Stock Tablet         │
│ (browser)  (browser)  (browser)   (browser)            │
│ IndexedDB  IndexedDB  IndexedDB   IndexedDB            │
│   └───────────┴───────────┴───────────┘                │
│     All read/write same server's RxDB                   │
│     + local IndexedDB as offline cache                  │
└─────────────────────────────────────────────────────────┘
```

**Key insight:** This is NOT a distributed database. All tablets hit the **same server process**. The "thin client" model means the main tablet is the single source of truth. Other tablets cache data in their own IndexedDB for offline resilience, then sync back via the replication endpoints.

### Multi-Branch Topology (Phase 1)

```
┌──────────────────┐          INTERNET          ┌──────────────────┐
│   TAGBILARAN     │◄──────── SSE Aggregate ───►│    PANGLAO       │
│   Main Tablet    │          (owner only)       │   Main Tablet    │
│   :3000          │                             │   :3000          │
│                  │                             │                  │
│ POS  KDS  Stock  │                             │ POS  KDS  Stock  │
└──────────────────┘                             └──────────────────┘
         ▲                                                ▲
         │              ┌──────────────┐                  │
         └──────────────│ OWNER DEVICE │──────────────────┘
                        │ (any browser)│
                        │ SSE /aggregate
                        └──────────────┘
```

**Cross-branch communication requires internet.** There is no LAN bridge between branches (they are in different cities: Tagbilaran vs Panglao, both in Bohol).

---

## 2. Protocol Stack

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ RxDB        │  │ Kitchen SSE  │  │ Replication   │  │
│  │ Local Store  │  │ Push/Sub     │  │ Pull/Push/SSE │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
├─────────┼────────────────┼──────────────────┼───────────┤
│  TRANSPORT LAYER         │                  │           │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────┴────────┐  │
│  │ IndexedDB   │  │ HTTP POST    │  │ HTTP GET/POST │  │
│  │ (Dexie)     │  │ + SSE stream │  │ + SSE stream  │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
├─────────────────────────────────────────────────────────┤
│  NETWORK LAYER                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Local only   │  │ WiFi LAN     │  │ WiFi LAN      │  │
│  │ (no network) │  │ (same branch)│  │ + Internet    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Protocols in Use

| Protocol | Transport | Purpose | Scope |
|----------|-----------|---------|-------|
| **IndexedDB** (Dexie) | Local storage | RxDB persistence layer | Per-device |
| **HTTP REST** | TCP/WiFi LAN | Replication pull/push (batched) | Same-branch |
| **SSE** (Server-Sent Events) | HTTP/1.1 long-lived | Kitchen snapshots + replication stream | Same-branch |
| **SSE Aggregate** | HTTP/1.1 via internet | Cross-branch kitchen view (owner) | Multi-branch |
| **Web Bluetooth** | GATT/BLE | Scale weight readings | Single device |

---

## 3. Data Mode Architecture (Thin-Client Tiers)

WTFPOS does NOT treat all devices equally. Each device operates in one of **4 data modes** that determine its read/write protocol path, offline capability, and resource footprint.

### Mode Definitions

| Mode | String Value | Who Uses It | Collections | Read Source | Write Destination | Offline |
|------|-------------|-------------|-------------|-------------|-------------------|---------|
| **Full RxDB** | `full-rxdb` | Server tablet (owner/admin on main device) | All 17 RxDB collections | RxDB local (IndexedDB) | RxDB local → replication push | Full offline R/W |
| **Selective RxDB** | `selective-rxdb` | Staff, manager, kitchen thin clients | 6 selective collections | RxDB local (IndexedDB) | HTTP POST `/api/collections/[col]/write` | Read-only offline (6 collections cached) |
| **SSE Only** | `sse-only` | Kitchen displays (reserved, future) | None | SSE stream only | N/A (read-only) | No offline |
| **API Fetch** | `api-fetch` | Owner/admin on non-server browsers | None locally | HTTP GET `/api/collections/[col]/read` + SSE invalidation | HTTP POST `/api/collections/[col]/write` | No offline |

### Selective Collections (6 for thin clients)

```
tables, orders, menu_items, floor_elements, kds_tickets, devices
```

These are the collections POS staff and kitchen staff need for their core workflow. Stock, expenses, reports, and audit logs are NOT synced to thin clients.

### Mode Selection Logic

```
ON MODULE LOAD (before any stores initialize):
  1. Read sessionStorage('wtfpos_data_mode') → use as initial $state value
     (prevents defaulting to 'full-rxdb' on thin clients after page refresh)

ON MOUNT (root layout, every page load for authenticated users):
  2. Call GET /api/device/identify → { isServer: boolean }
  3. If isServer === true → 'full-rxdb'
  4. Else, determine by session.role:
     - staff, manager, kitchen → 'selective-rxdb'
     - owner, admin → 'api-fetch'
  5. Write result to sessionStorage for next reload
```

> **Critical:** Step 1 (sessionStorage restore at module load) is essential. Without it, page refresh on thin clients defaults to `full-rxdb`, causing writes to route to local RxDB instead of the server proxy. This was a real bug — see SKILL.md Resolved Issues §1.

### Per-Mode Protocol Diagram

```
FULL-RXDB (Server Tablet)
─────────────────────────
Read:  App → RxDB → IndexedDB (0ms, local)
Write: App → RxDB → IndexedDB → replication push → SSE broadcast to clients
Offline: Full R/W — this IS the canonical data source

SELECTIVE-RXDB (Thin Client)
────────────────────────────
Read:  App → RxDB → IndexedDB (0ms, local, 6 collections only)
Write: App → HTTP POST /api/collections/[col]/write → server RxDB
       Server confirms synchronously → SSE broadcasts to all clients
Offline: Read cached data ✓ | Write ✗ (requires server)

API-FETCH (Owner/Admin Browser)
──────────────────────────────
Read:  App → HTTP GET /api/collections/[col]/read (initial snapshot)
       + SSE /api/replication/stream (real-time updates, multiplexed)
Write: App → HTTP POST /api/collections/[col]/write → server RxDB
Offline: No ✗

SSE-ONLY (Kitchen Display — Future)
────────────────────────────────────
Read:  App → SSE /api/replication/stream (real-time only)
Write: N/A (read-only display)
Offline: No ✗
```

### Store Factory (`create-store.svelte.ts`)

A universal store factory hides the dual backend. Callers write identical code regardless of mode:

```ts
createStore<T>(collectionName, rxdbQueryFn, sseOpts?)
// If isRxDbMode() → creates RxDB-backed store (createRxStore)
// If api-fetch/sse-only → creates server-backed store (createServerStore)
// Returns: { value: T[], initialized: boolean }
```

**Server-backed stores** (`server-store.svelte.ts`):
- Lazy singleton SSE manager — one EventSource per session (multiplexed `/api/replication/stream`)
- Initial data via HTTP GET bulk-read, then SSE for real-time updates
- On reconnect: full re-fetch to catch missed events
- Internal `Map<primaryKey, T>` for O(1) upserts

### Write Proxy (`write-proxy.ts`)

Routes writes based on data mode:

```ts
getWritableCollection(collectionName) → CollectionProxy
// If full-rxdb → RxDB local write (createRxDbProxy)
// Otherwise → HTTP POST to /api/collections/[col]/write (createServerProxy)
```

**CollectionProxy interface:** `insert()`, `findOne()`, `incrementalPatch()`, `incrementalModify()`, `remove()`

**Key trade-off:** Thin clients get immediate server confirmation (synchronous HTTP) but cannot write offline. Server tablet can write offline (RxDB local) but changes propagate asynchronously.

### Helper Functions (`data-mode.svelte.ts`)

| Function | Returns | Purpose |
|----------|---------|---------|
| `isRxDbMode()` | boolean | True for `full-rxdb` OR `selective-rxdb` — RxDB must be initialized |
| `isFullRxDbMode()` | boolean | True only for `full-rxdb` (server tablet) |
| `isApiFetchMode()` | boolean | True for `api-fetch` (remote owner/admin) |
| `isSseMode()` | boolean | True for `sse-only` (future kitchen displays) |
| `needsRxDb()` | boolean | Alias for `isRxDbMode()` |
| `getDataMode()` | DataMode | Getter for current reactive mode |

---

## 4. Collections API (Thin Client Data Path)

These endpoints serve `selective-rxdb`, `api-fetch`, and `sse-only` mode devices. They are separate from the replication endpoints (which serve RxDB pull/push).

### Read Endpoint

```
GET /api/collections/{collection}/read?locationId={id}
```

| Parameter | Type | Required | Purpose |
|-----------|------|----------|---------|
| `locationId` | query string | No | Filter by branch |

**Response (200):**
```json
{
  "documents": [ { "id": "...", "locationId": "tag", ... } ],
  "checkpoint": { "id": "...", "updatedAt": "..." }
}
```

Implementation: Reads from server's in-memory replication store via `store.pull(null, Infinity)`, optionally filters by `locationId`.

### Write Endpoint

```
POST /api/collections/{collection}/write
Content-Type: application/json
```

**Request body:**
```json
{
  "operation": "insert" | "patch" | "remove",
  "id": "doc-id",          // required for patch/remove
  "data": { ... }          // required for insert/patch
}
```

**Operations:**
- **insert**: Adds `updatedAt` if missing, pushes via `store.push()` with `assumedMasterState: null`
- **patch**: Fetches existing doc, merges with data, sets new `updatedAt`, pushes with `assumedMasterState: existing`
- **remove**: Sets `_deleted: true` + new `updatedAt`, pushes as patch

**Response (200):** `{ "document": {...}, "conflicts": [] }`
**Errors:** `400` (invalid collection/missing data), `404` (doc not found for patch/remove)

### Primary Key Resolution

Default primary key is `id`. Exception: `stock_counts` uses `stockItemId`.

---

## 5. LAN Replication System (Phase 1 — Implemented)

### Architecture

The replication system syncs 17 RxDB collections between the main tablet and all client tablets over WiFi LAN.

**Server side** (`src/lib/server/replication-store.ts`):
- In-memory `Map<primaryKey, document>` per collection
- Sorted index by `[updatedAt, id]` for O(log n) checkpoint lookups (binary search)
- Conflict detection: compares `assumedMasterState.updatedAt` vs current doc
- **Volatile** — data lost on server restart (by design; clients re-push)

**Client side** (`src/lib/db/replication.ts`):
- Single multiplexed SSE stream for all 17 collections (`/api/replication/stream`)
- Per-collection pull via HTTP GET (`/api/replication/{collection}/pull`)
- Per-collection push via HTTP POST (`/api/replication/{collection}/push`)
- **Push batch size: 200 docs** per push, **pull batch size: 500 docs** (max 1000)
- **Retry time:** 1 second (RxDB parameter — LAN is fast)
- Generation tracking: bumps on server restart detection → triggers full re-push

### Priority Sync Tiers

Collections are synced in two priority tiers to get the POS floor operational as fast as possible:

| Tier | Collections | Purpose |
|------|------------|---------|
| **Tier 1 (Priority)** | `tables`, `orders`, `menu_items`, `floor_elements`, `kds_tickets`, `devices` | POS floor plan + active orders — needed immediately |
| **Tier 2 (Secondary)** | `stock_items`, `deliveries`, `waste`, `deductions`, `adjustments`, `expenses`, `stock_counts`, `x_reads`, `z_reads`, `audit_logs`, `kitchen_alerts` | History, stock, reports — can load in background |

Priority sync completion is tracked via `SyncActivity.prioritySyncDone` and drives the `SyncStatusBanner`.

### Auto-Recovery (Stalled Sync)

If priority sync stalls after **15 seconds** and the server has data (`total >= 10`) but the client's local DB is empty (no tables or menu items), the client:
1. Clears sync localStorage keys (`wtfpos-sync-gen`, `wtfpos-sync-epoch`, `wtfpos_server_epoch`)
2. Removes the local RxDB database
3. Reloads the page for a fresh start

**Exemption:** Server device (loopback IP) is never auto-recovered — its IndexedDB is canonical.

### Server Replication Mode (SSE + Safety-Net Poll)

The **server device** (main tablet) uses the **same SSE stream** as all other devices for instant change delivery. When a thin client writes to `/api/collections/[col]/write`, the server's in-memory `CollectionStore.push()` emits the change via SSE, and the server's own browser receives it immediately.

**Gentle error handling:** Unlike thin clients (which fire RESYNC on all collections on SSE error), the server's SSE error handler simply logs a warning and waits for auto-reconnect. On reconnect, it does a **staggered resync of priority collections only** (100ms apart) to avoid overwhelming the circuit breaker.

**Safety-net poll:** Secondary collections (Tier 2) poll every **10 seconds** as a fallback. Priority collections rely solely on SSE.

> **History:** Previously, the server used 2-second polling (no SSE) to avoid Vite HMR-induced RESYNC storms during development. This caused a critical bug where client writes were not instantly visible on the server's own UI. Fixed 2026-03-13 — see SKILL.md §1.

### Circuit Breaker (Shared)

A **single shared circuit breaker** protects all 17 collection replications:

| Parameter | Value |
|-----------|-------|
| Failure threshold | 5 consecutive failures |
| Reset timeout | 30 seconds |
| States | closed → open → half-open → closed |

**Log throttling:** First breaker-open event logs at info level. Subsequent breaches log a summary every 30 seconds to prevent log spam.

### Exponential Backoff

Per-collection retry with **AWS-style full jitter**:

```
delay = random(0, min(base * 2^attempt, cap))
base = 1,000 ms
cap  = 30,000 ms
```

Attempt counter resets to 0 on successful pull/push.

### Sync Activity Tracking

Real-time `SyncActivity` events drive the `SyncStatusBanner`:

```ts
interface SyncActivity {
  active: boolean;           // Any collection actively syncing
  activeCount: number;       // Count of collections syncing
  activeCollections: string[]; // Names of syncing collections
  initialSyncDone: boolean;  // ALL collections completed first pull
  prioritySyncDone: boolean; // Tier 1 collections completed
}
```

### Data Flow

```
WRITE PATH (Tablet A → Server → ALL other devices including server browser)
──────────────────────────────────────────────────────────────────────────
Tablet A: RxDB.orders.insert({...order, updatedAt: now})
  ↓ [RxDB replication handler fires]
  POST /api/replication/orders/push
    body: { changeRows: [ { newDocumentState, assumedMasterState } ] }
  ↓
  Server: CollectionStore.push()
    → compares assumedMasterState vs current → detects conflicts
    → if no conflict: updates Map + marks sorted index dirty
    → emits change event to ALL SSE subscribers
  ↓ (broadcast to every connected EventSource)
  ├─ Tablet B (thin client): SSE → RESYNC → pull → RxDB → UI
  └─ Server browser: SSE → RESYNC → pull → RxDB → UI  ← same path!
  ↓
  Pull: GET /api/replication/orders/pull?updatedAt=...&id=...&limit=500
  ↓
  Server: binary search finds checkpoint → returns next 500 docs
  ↓
  Device: integrates into local RxDB/IndexedDB → Svelte $state → UI update

THIN-CLIENT WRITE PATH (client → server HTTP → SSE broadcast)
──────────────────────────────────────────────────────────────
Client: App → write-proxy → HTTP POST /api/collections/orders/write
  ↓
  Server: validates → CollectionStore.push() → emit()
  ↓ (SSE broadcast)
  ├─ Server browser: instant update via SSE
  ├─ Other thin clients: SSE → RESYNC → pull
  └─ Client that wrote: server confirms synchronously (200 OK)
```

### Replicated Collections (17)

```
tables, orders, menu_items, stock_items, deliveries, waste,
deductions, adjustments, expenses, stock_counts, devices,
kds_tickets, x_reads, z_reads, audit_logs, kitchen_alerts,
floor_elements
```

> `z_reads` is replicated but schema v0 (minimal).

### Conflict Resolution

- **Strategy:** Field-level merge for eligible collections, LWW fallback
- **Eligible collections:** `orders`, `tables`, `kds_tickets`, `stock_items` — collections where concurrent edits to different fields are common
- **Detection:** Server compares `assumedMasterState.updatedAt` vs current doc
- **Merge logic:** When conflict detected on an eligible collection:
  1. Compare each field between server state, client's assumed state, and client's new state
  2. Non-overlapping changes merge automatically (e.g., Cashier A edits discount, Cashier B adds item)
  3. Same-field conflicts resolved by per-field LWW (newer `updatedAt` wins)
  4. Metadata fields (`id`, `updatedAt`, `locationId`, `_rev`) skip merge — always take latest
- **Non-eligible collections:** Pure LWW (entire document wins or loses)
- **CRDT monotonic fields:** `deliveries.usedQty` uses `Math.max(server, client)` — prevents lost deductions when two tablets charge the same delivery simultaneously
- **Mergeable collections:** `orders`, `tables`, `kds_tickets`, `stock_items`, `deliveries`

### Connection Limits

- **HTTP/1.1 browser limit:** ~6 connections per host
- **Solution:** Single multiplexed SSE stream (1 connection for all 17 collections)
- **Remaining connections:** Available for pull/push HTTP requests

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/replication/stream` | GET (SSE) | Multiplexed change stream for all collections |
| `/api/replication/{collection}/pull` | GET | Paginated pull from checkpoint |
| `/api/replication/{collection}/push` | POST | Batch push with conflict detection |
| `/api/replication/status` | GET | Doc counts per collection (health check) |

---

## 6. Kitchen Real-Time System (SSE)

### Same-Branch Flow (No Internet Required)

```
POS Tablet                    Main Server                    KDS Tablet
──────────                    ───────────                    ──────────
write order to RxDB
  ↓ (critical: immediate / non-critical: debounce 3s)
POST /api/events/kitchen-push ──►
                              broadcastSnapshot()
                              (in-memory Set<controller>)
                              assigns event ID + stores in ring buffer (50 events)
                                                    ◄── SSE: kitchen-orders
                                                         id: 42
                                                         event: snapshot
                                                         data: { orders, tickets }
                                                    KDS UI updates
On KDS reconnect:
                                                    ──► Last-Event-ID: 42
                              replays events 43..N from ring buffer
                                                    ◄── missed snapshots
```

**Characteristics:**
- **Latency:** ~0ms for critical changes (new order, status change, KDS bump/refuse); ~3s for non-critical (item edits, notes)
- **Smart debounce:** `kitchen-push.ts` fingerprints `{count, statuses, kdsSignature}` — pushes immediately when fingerprint changes critically
- **Event IDs:** Monotonic counter on each broadcast; ring buffer stores last 50 events
- **Replay:** Reconnecting clients send `Last-Event-ID` header → server replays missed events from ring buffer
- **Fallback:** If no `Last-Event-ID`, latest snapshot replayed immediately on connect
- **Heartbeat:** 30-second keepalive prevents proxy timeouts

### Cross-Branch Flow (Owner Only — Internet Required)

```
Owner Device
  → GET /api/sse/aggregate (to owner's SvelteKit server)
     ↓
  Owner's server opens 2 outbound connections:
     → GET http://{TAG_SSE_URL}/api/sse/kitchen-orders
     → GET http://{PGL_SSE_URL}/api/sse/kitchen-orders
     ↓ (merges streams, tags with branch ID)
  → Streams unified events to owner's browser
     Events: snapshot, branch-connected, branch-error
```

**Environment variables required:**
- `TAG_SSE_URL` — Tagbilaran main tablet IP/hostname
- `PGL_SSE_URL` — Panglao main tablet IP/hostname

---

## 7. Connection & Device Monitoring

### Connection State (`connection.svelte.ts`)

| State | Source | What It Tracks |
|-------|--------|---------------|
| `isOnline` | Computed from probes | Overall connectivity |
| `connectivityTier` | `'full'` / `'lan'` / `'offline'` | Three-tier quality detection |
| `lastOnlineAt` | ISO timestamp | When last went online |
| `kdsReachable` | Manual set | Whether KDS endpoint responds |

**Probing:**
- LAN probe: `GET /api/replication/status` (5s timeout, circuit-broken at 3 failures / 30s reset)
- Internet probe: `GET https://www.gstatic.com/generate_204` (no-cors, 5s timeout, circuit-broken at 3 failures / 60s reset)
- Probes run on `window.online` event + every 60 seconds
- Results drive `ConnectionStatus.svelte` pill color (green/amber/red) and banner messages

### Device Registry (`device.svelte.ts`)

Each device writes a heartbeat to the `devices` RxDB collection every **30 seconds**:

```ts
{
  id: string,           // nanoid, persisted in localStorage
  name: string,         // user-editable device name
  isServer: boolean,    // true = main tablet
  lastSeenAt: string,   // ISO timestamp (heartbeat)
  isOnline: boolean,    // navigator.onLine
  syncStatus: string,   // 'local-only' | 'syncing' | 'synced' | 'error'
  dbLastUpdated: string, // latest updatedAt across all collections
  dbDocCount: number    // total doc count (refreshed every 5 mins)
}
```

### Three-Phase Device Registration

Device registration is designed for **instant visibility** in the admin Device Monitor:

| Phase | Timing | What Happens |
|-------|--------|-------------|
| **Phase 1: Quick Register** | <100ms on mount | Basic device record (name, role, location, dataMode). No IP yet. Device appears in admin immediately. |
| **Phase 2: Background Enrichment** | Parallel, non-blocking | `fetchDeviceIdentity()` + `tryReidentify()` run concurrently. Full upsert with IP, isServer, DB fingerprint. |
| **Phase 3: Heartbeat Cadence** | 5s × 6 beats → 30s steady | Fast 5-second heartbeat for first 30 seconds (6 beats), then slows to 30-second cadence. Leader-gated in RxDB mode. |

**Additional periodic tasks:**
- IP re-fetch every 5 minutes (handles DHCP changes)
- Stale device pruning every 5 minutes (removes devices offline >24 hours)
- Catch-up heartbeat on tab visibility change

### Device Re-Identification Protocol

When a device loses its ID (localStorage cleared, new browser), it attempts recovery:

**Stage 1 — Local RxDB Search:**
- Searches all local device records for a stale device (offline >24h) matching: exact `userAgent`, exact `deviceType`, `screenWidth` within ±50px
- If match found: adopts the old device ID

**Stage 2 — Server-Side Search:**
- POST `/api/device/identify` with `{ userAgent, deviceType, screenWidth }`
- Server searches its in-memory replication store for matching stale devices
- If match found: returns `matchedDeviceId` for client to adopt

**Device ID Persistence (3-layer):**
1. `localStorage` (`wtfpos_device_id`) — primary
2. Cookie (`wtfpos_did`, max-age 1 year) — survives localStorage clear
3. Generate new `dev-<nanoid(16)>` — last resort

### Route Reporting

Clients report their current page route via `navigator.sendBeacon('/api/device/route', { route })` on every SvelteKit navigation. This feeds the server-side device route map.

### Sync Verification (`SyncStatusBanner.svelte`)

Polls `/api/replication/status` every 60 seconds and compares local vs server doc counts:

| State | Meaning | Action |
|-------|---------|--------|
| `checking` | Initial load | Spinner |
| `live` | Counts match (1% tolerance) | Green pill |
| `behind` | Device missing docs | "Sync Now" button → `forceFullSync()` |
| `ahead` | Device has extra docs | "Reset this device" → clear IndexedDB |
| `stale` | Can't reach server | Offline warning |
| `offline` | No network | Offline pill |

---

## 8. Server-Side Observability

### Client Tracker (`client-tracker.ts`)

An **in-memory registry** of all devices that have contacted the server, keyed by display IP.

**Tracked fields per client:**

| Field | Source | Update Cadence |
|-------|--------|---------------|
| `ip`, `displayIp` | `event.getClientAddress()` | Per-request |
| `isServer` | Loopback IP check | First request |
| `deviceHint` | User-Agent parsing (iPad/iPhone/Android/Mac/Windows) | First request |
| `deviceName`, `userName`, `role`, `locationId`, `dataMode` | RxDB devices collection lookup | Every 20 requests (non-server) |
| `currentRoute` | `/api/device/route` POST | Per navigation |
| `connectionTypes` | Request context classification | Accumulates (page/sse/push/pull/api) |
| `hitCount` | Counter | Per-request |
| `firstSeenAt`, `lastSeenAt` | Timestamps | Per-request |

**New client banner:** On first connection from an unseen IP, logs a prominent banner with device info. After 5 seconds, re-checks for late device registration.

**Activity threshold:** Client is "active" if last request was <90 seconds ago.

### Hooks Middleware (`hooks.server.ts`)

Every **page navigation** (text/html requests, excluding `/api/`, `/_app/`, `/@`, etc.) triggers:
1. `trackClient(ip, ua, path, path)` — updates in-memory registry
2. `logDeviceRoutes()` — logs current device→route map with data stats

API requests, static assets, and internal SvelteKit routes are silently passed through.

### Client Error Log Endpoint

```
POST /api/replication/client-log
Body: { "level": "info|warn|error", "message": "...", "data": { ... } }
```

Client-side errors appear on the server console with smart routing:
- Breaker noise (`'breaker is open'`, `'suppressed'`) → demoted to debug
- Trace patterns (`'getDb()'`, `'first activity'`) → trace level
- Info patterns (`'Replication started'`, `'Initial sync complete'`) → info level
- Explicit error/warn → preserved at stated level

### Connected Clients Endpoint

```
GET /api/device/clients
```

Returns snapshot of all tracked clients with `isActive` (last request <90s), role, location, device type.

### Server Self-Test (`selftest.ts`)

Runs **once** after the server accumulates >=50 documents (deferred 2 seconds to let pushes settle):

**Tests per collection** (9 key collections):
1. Fresh pull from `checkpoint=null` returns documents
2. Checkpoint has valid `id` + `updatedAt`
3. Pagination works (if >100 docs, second pull returns data)

Logs prominent banner: `SERVER SELF-TEST PASSED` or `SERVER SELF-TEST FAILED` with per-collection results.

### Vite LAN Socket Detection (Dev Only)

The `wtfpos-connection-logger` Vite plugin listens for raw TCP socket connections on the dev server. First connection from each unique non-loopback IP logs:

```
[LAN] New device socket: 192.168.1.50
```

This fires before any HTTP request parsing — earliest possible device detection during development.

---

## 9. Offline Capability Matrix

### Tier 1: Full Offline (No Network at All)

The device operates entirely from local IndexedDB. All writes queue until reconnect.

| Feature | Works Offline | Notes |
|---------|:---:|-------|
| Create/edit orders | Yes | Writes to local RxDB |
| Process payments | Yes | Stored locally, synced later |
| KDS bump/refuse | Yes | Local only until sync |
| Stock counts | Yes | Entered locally |
| Menu browsing | Yes | Cached in IndexedDB |
| Floor plan display | Yes | Cached tables/elements |

### Tier 2: LAN Only (No Internet)

All same-branch features work. Cross-branch features fail.

| Feature | Works on LAN | Notes |
|---------|:---:|-------|
| Same-branch KDS real-time | Yes | SSE over LAN |
| Multi-device sync | Yes | Replication over LAN |
| Owner cross-branch view | No | Requires internet |
| Cloud reports (Neon) | No | Phase 2 |

### Tier 3: Full Online

Everything works, including cross-branch owner views and (future) cloud analytics.

### The Offline Contract

> **Every POS operation — order creation, item addition, payment processing, KDS bump — MUST work in Tier 1 (no network at all).** Neon and Ably are enhancement layers, never dependencies for core operations.

---

## 10. Data Synchronization Lifecycle

### Timing Layers

```
Layer 0: IMMEDIATE (synchronous, local)
  User action → RxDB write → IndexedDB
  Latency: 0ms (local I/O)
  Requires: Nothing (fully offline)

Layer 1: NEAR-REAL-TIME (background, sub-second)
  RxDB change → replication push → server in-memory store
  Server → SSE stream → other tablets pull
  Latency: 100-500ms on LAN
  Requires: WiFi LAN to main tablet

Layer 2: REAL-TIME BROADCAST (background, ~3s)
  Order change → debounce 3s → POST kitchen-push → SSE broadcast
  Latency: 3s (intentional debounce)
  Requires: WiFi LAN to main tablet

Layer 3: CROSS-BRANCH (background, ~5s) — Phase 1 only
  Branch server → SSE aggregate → owner device
  Latency: 3-5s (depends on internet)
  Requires: Internet + both branch servers accessible
  NOTE: Replaced by Layer 4 in Phase 2 (Neon batch sync)

Layer 4: CLOUD MERGE (Phase 2, background) — replaces Layer 3
  Each branch → blind batch sync → Neon PostgreSQL
  Owner queries Neon for cross-branch reports
  Latency: 5-15 minutes (batch interval)
  Requires: Internet (per branch, independently)
  NOTE: Branches are blind to each other. Neon is where data merges.

Layer 5: REAL-TIME ALERTS (Phase 2b, optional luxury)
  Ably pub/sub — one-way publish from each branch
  Owner subscribes to both branches' channels
  Latency: 100-300ms
  Requires: Internet + Ably service
  NOTE: Only adds instant alerts. Does NOT sync data or replace Neon.
```

---

## 11. Planned Architecture (Phase 2+)

### Core Principle: Branches Are Blind to Each Other

**Tagbilaran and Panglao never exchange data directly.** They don't know each other exist. Each branch operates as a fully independent POS system that happens to upload its data to a shared cloud database (Neon) when internet is available.

Cross-branch visibility is **only** achieved by querying the cloud — never by branch-to-branch communication.

```
WHY BLIND BRANCHES?
────────────────────
1. Simpler — no inter-branch sync protocol, no conflict resolution across locations
2. Resilient — if Panglao's internet dies, Tagbilaran is unaffected (zero coupling)
3. Secure — branches can't corrupt each other's data
4. Matches reality — staff at one branch never need the other branch's live data
```

### Phase 2a: Neon Only (Core — Implement First)

This is the **minimum viable cross-branch architecture**. Each branch blindly uploads to Neon. The owner queries Neon for cross-branch reports.

```
TAGBILARAN                                          PANGLAO
─────────────                                       ──────────
RxDB (local)                                        RxDB (local)
POS  KDS  Stock                                     POS  KDS  Stock
│                                                   │
│  Knows NOTHING                    Knows NOTHING   │
│  about Panglao                    about Tagbilaran│
│                                                   │
▼ batch sync (when internet)                        ▼ batch sync (when internet)
└──────────────────► NEON (Cloud) ◄─────────────────┘
                     PostgreSQL
                     ───────────
                     Both branches' data
                     merged by location_id
                          │
                          ▼
                    OWNER DEVICE
                    Queries Neon for:
                    • Branch comparison reports
                    • Cross-branch sales totals
                    • Inventory across locations
                    (5-15 min delay, batch sync)
```

**What the owner sees:** Reports with data that's 5-15 minutes old (batch sync interval). This is acceptable for analytics — the owner doesn't need to see a single order the instant it happens.

**What each branch sees:** Only its own data. No change from Phase 1.

### Phase 2b: Ably (Optional Luxury — Add Only If Needed)

Ably is a **one-way notification layer**, not a data sync tool. Each branch publishes events into the void. If nobody's listening, nothing breaks. No branch ever subscribes to the other branch's channels.

```
TAGBILARAN                                          PANGLAO
─────────────                                       ──────────
Publishes to:                                       Publishes to:
  wtfpos:tag:kitchen ──►                        ◄── wtfpos:pgl:kitchen
  wtfpos:tag:stock   ──►    ABLY (cloud)        ◄── wtfpos:pgl:stock
                            │
                     OWNER DEVICE (optional listener)
                     Subscribes to BOTH channels
                     Gets instant alerts:
                     "Panglao ran out of samgyup"
                     "Tagbilaran voided a ₱5K order"
```

**When to add Ably:** Only if the owner explicitly says "I need to know the moment something happens at the other branch." Until then, Neon batch reports are sufficient.

**What Ably does NOT do:**
- Does NOT sync data between branches
- Does NOT replace RxDB or Neon
- Does NOT affect same-branch operations (KDS still uses LAN SSE)
- Does NOT need to work for the POS to function

### Ably Channel Design (If/When Implemented)

| Channel | Publisher | Subscribers | Events |
|---------|-----------|-------------|--------|
| `wtfpos:tag:kitchen` | Tagbilaran POS | Owner only | `order_snapshot`, `ticket_bumped` |
| `wtfpos:pgl:kitchen` | Panglao POS | Owner only | `order_snapshot`, `ticket_bumped` |
| `wtfpos:tag:stock` | Tagbilaran | Owner + manager | `stock_alert` |
| `wtfpos:pgl:stock` | Panglao | Owner + manager | `stock_alert` |

> **Note:** Same-branch KDS does NOT use Ably. It continues using LAN SSE, which works without internet.

### What SSE Aggregate Gets Replaced (Only When Ably Is Ready)

| Current (SSE) | Replaced By | File to Delete |
|----------------|-------------|----------------|
| SSE aggregate proxy (owner cross-branch) | Ably multi-channel subscribe | `src/routes/api/sse/aggregate/+server.ts` |

**What SSE keeps (permanently):**
- Kitchen SSE broadcaster → stays (same-branch, LAN-only, no internet needed)
- Kitchen push endpoint → stays
- Replication SSE stream → stays (LAN device sync)

### Neon Schema Mapping

| RxDB (camelCase) | Neon (snake_case) | Notes |
|------------------|-------------------|-------|
| `orders.createdAt` | `orders.created_at` | TIMESTAMPTZ |
| `orders.items[]` | `orders.items` | JSONB array |
| `orders.locationId` | `orders.location_id` | TEXT, indexed |
| All collections | `updated_at` | Required for sync checkpoint |
| All collections | `deleted` | BOOLEAN, soft-delete |

### Implementation Order (Non-Negotiable)

```
Step 1: Neon cloud DB + batch sync from each branch     ← DO THIS FIRST
Step 2: Owner reports querying Neon (cross-branch)       ← Depends on Step 1
Step 3: Ably real-time alerts (ONLY if owner requests)   ← Optional luxury
```

**Never skip to Step 3.** Ably without Neon means the owner gets real-time alerts but can't see historical reports — that's backwards.

---

## 12. Security & Trust Model

### Current (Phase 1)

| Aspect | Status | Notes |
|--------|--------|-------|
| LAN encryption | None (HTTP) | Trusted WiFi assumption |
| Auth | Session-only (no JWT) | Role stored in Svelte state |
| Manager PIN | `1234` hardcoded | Gates sensitive operations |
| Replication auth | None | Any LAN device can push/pull |
| SSE auth | None | Any LAN device can subscribe |

### Risks

1. **No TLS on LAN** — anyone on the WiFi can see/modify traffic
2. **No replication auth** — rogue device can push bad data
3. **Hardcoded PIN** — not per-user, not rotatable
4. **Session in memory only** — page refresh = logged out

### Mitigations (Planned)

- Phase 2: Ably token auth for cross-branch channels
- Phase 2: Neon connection uses TLS (mandatory)
- Future: Device registration approval before replication access

---

## 13. Performance Characteristics

### Bandwidth

| Operation | Payload Size | Frequency |
|-----------|-------------|-----------|
| Replication push (200 docs) | ~200-400 KB | On write (batched) |
| Replication pull (500 docs) | ~500 KB-1 MB | On change notification |
| Kitchen SSE snapshot | ~5-20 KB | Every 3 seconds (debounced) |
| SSE heartbeat | ~20 bytes | Every 30 seconds |
| Device heartbeat | ~200 bytes | Every 30 seconds |

### Scalability Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| In-memory replication store | ~500K docs/collection | Node.js heap (~1.5 GB default) |
| SSE connections per host | 6 (HTTP/1.1) | Mitigated by multiplexed stream |
| Concurrent tablets per branch | ~10-15 | Browser connection pool limits |
| RxDB IndexedDB size | ~500 MB per browser | Browser-imposed quota |

### Latency Budget

```
Same-branch POS → KDS (critical): 0ms (immediate) + 100ms (SSE) = ~100ms
Same-branch POS → KDS (non-critical): 3s (debounce) + 100ms (SSE) = ~3.1s
Same-branch replication:    100-500ms (background, exponential backoff on failure)
Cross-branch owner view:    0-3s (debounce) + 200-500ms (internet) = ~0.3-3.5s
Future Ably cross-branch:   100-300ms (no debounce)
```

---

## 14. Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| Main tablet crashes | All LAN devices lose server | Restart Node → clients detect empty server → full re-push |
| Client tablet offline | Local-only operation | Reconnect → SyncStatusBanner detects "behind" → sync |
| Internet down | No cross-branch view | LAN operations continue normally |
| WiFi down | Each tablet isolated | Local IndexedDB operations only |
| IndexedDB corrupted | Device unusable | SyncStatusBanner → "Reset this device" → clear + reload |
| Server restart (planned) | In-memory store empty | Clients detect via `/status` → bump generation → re-push |
| Admin triggers reset | All stores cleared, all clients resync | POST `/api/replication/reset` → broadcasts `RESET_ALL` signal via SSE |
| Server epoch changes | Clients detect stale sync state | Client compares localStorage epoch vs server → bumps generation → full re-push |

### Recovery Sequence (Server Restart)

```
1. Server comes up → replication-store empty (0 docs)
2. Client calls GET /api/replication/status → { total: 0 }
3. Client detects mismatch → bumps internal generation counter
4. Generation bump → all 17 replication instances restart
5. Each instance pushes all local docs (200/batch) to server
6. Server rebuilds in-memory store from client pushes
7. SyncStatusBanner transitions: stale → checking → live
```

### RESET_ALL Broadcast Signal

The `/api/replication/reset` endpoint triggers a global reset:

1. Server calls `emitBroadcast('RESET_ALL')`
2. All in-memory collection stores are cleared (`store.clear()`)
3. Server epoch is bumped (`bumpServerEpoch()` — `Date.now()`)
4. SSE stream sends `event: broadcast\ndata: {"signal":"RESET_ALL"}`
5. All connected clients (both RxDB and api-fetch modes):
   - RxDB clients: detect epoch change on next status check → bump generation → full re-push
   - api-fetch clients: server-store manager triggers `loadSnapshot()` on all stores

### Server Epoch Lifecycle

```ts
SERVER_EPOCH = Date.now()  // Set once at server module load (process startup)
```

- **Created:** Millisecond timestamp at server process start
- **Bumped:** Only on `RESET_ALL` broadcast
- **Compared:** Clients store last known epoch in localStorage (`wtfpos_server_epoch`). On mismatch → bump sync generation → full re-push
- **Purpose:** Detect server restarts without polling — epoch change = "server lost all data, re-push everything"

---

## 15. File Manifest

### Replication Core

| File | Purpose |
|------|---------|
| `src/lib/db/replication.ts` | Client-side replication: SSE stream, pull/push handlers, conflict tracking |
| `src/lib/server/replication-store.ts` | Server in-memory store: Map + sorted index, conflict detection |
| `src/routes/api/replication/stream/+server.ts` | Multiplexed SSE stream (all 17 collections) |
| `src/routes/api/replication/[collection]/pull/+server.ts` | Paginated pull endpoint |
| `src/routes/api/replication/[collection]/push/+server.ts` | Batch push with conflict detection |
| `src/routes/api/replication/status/+server.ts` | Health check: doc counts per collection |
| `src/routes/api/replication/reset/+server.ts` | Trigger RESET_ALL broadcast + clear all stores |
| `src/routes/api/replication/ping/+server.ts` | Diagnostic: echo, store count, optional write test |
| `src/routes/api/replication/client-log/+server.ts` | Client error log relay with smart throttle |

### Kitchen SSE (Phase 1 Bridge)

| File | Purpose |
|------|---------|
| `src/lib/stores/kitchen-push.ts` | Smart debounce: critical changes immediate, non-critical 3s |
| `src/lib/server/kitchen-sse.ts` | In-memory broadcaster + 50-event ring buffer + event IDs |
| `src/routes/api/events/kitchen-push/+server.ts` | Receives POST, calls broadcastSnapshot() |
| `src/routes/api/sse/kitchen-orders/+server.ts` | SSE endpoint with Last-Event-ID replay |
| `src/routes/api/sse/aggregate/+server.ts` | Proxy aggregator for owner cross-branch view |

### Connection, Device & Robustness

| File | Purpose |
|------|---------|
| `src/lib/stores/connection.svelte.ts` | Three-tier connectivity detection (full/lan/offline) |
| `src/lib/stores/device.svelte.ts` | Device registry + 30s heartbeat + cookie backup + re-identification |
| `src/lib/components/ConnectionStatus.svelte` | Live status pill + full diagnostic panel |
| `src/lib/components/SyncStatusBanner.svelte` | Sync verification UI + forced sync/reset |
| `src/lib/utils/circuit-breaker.ts` | Generic circuit breaker (closed→open→half-open→closed) |
| `src/lib/utils/backoff.ts` | Exponential backoff with full jitter |

### Data Mode & Thin Client

| File | Purpose |
|------|---------|
| `src/lib/stores/data-mode.svelte.ts` | 4 data modes, selection logic, mode helpers |
| `src/lib/stores/create-store.svelte.ts` | Universal store factory: RxDB vs server-store routing |
| `src/lib/stores/server-store.svelte.ts` | SSE manager + bulk-read for api-fetch mode |
| `src/lib/db/write-proxy.ts` | Write routing: RxDB local vs HTTP POST per mode |
| `src/routes/api/collections/[collection]/read/+server.ts` | Bulk-read endpoint (thin client reads) |
| `src/routes/api/collections/[collection]/write/+server.ts` | Write endpoint (thin client writes) |

### Server Observability

| File | Purpose |
|------|---------|
| `src/lib/server/client-tracker.ts` | In-memory client registry: IP, device type, role, routes |
| `src/hooks.server.ts` | Per-request tracking + route logging middleware |
| `src/lib/server/epoch.ts` | Server epoch (Date.now() at startup), bump on RESET_ALL |
| `src/lib/server/selftest.ts` | Server self-test: pull/pagination verification on 9 collections |
| `src/routes/api/device/identify/+server.ts` | GET: IP + isServer + epoch. POST: server-side re-identification |
| `src/routes/api/device/route/+server.ts` | POST: route reporting via sendBeacon |
| `src/routes/api/device/clients/+server.ts` | GET: active client snapshot |
| `src/routes/api/replication/client-log/+server.ts` | POST: client error log relay with throttle |
| `src/routes/api/replication/reset/+server.ts` | POST: trigger RESET_ALL broadcast + epoch bump |
| `src/routes/api/replication/ping/+server.ts` | POST: echo + store count + optional write test |

---

## 16. Decision Rules for Network Questions

Use these rules when evaluating network-related feature requests:

```
IF feature needs same-branch real-time
  → Use existing SSE (LAN only, works offline)
  → NEVER add polling as a workaround
  → Ably does NOT replace same-branch SSE

IF feature needs cross-branch data
  → Phase 1: SSE aggregate (internet required, owner only) — temporary
  → Phase 2: Query Neon (both branches upload blindly, owner reads merged data)
  → NEVER create direct branch-to-branch connections
  → NEVER make one branch aware of the other branch's existence

IF feature needs cross-branch REAL-TIME alerts
  → Phase 2a (Neon) must be working first
  → Phase 2b: Ably one-way publish (optional, only if owner needs instant alerts)
  → Without Ably, owner still sees data in Neon — just 5-15 min delayed

IF feature needs offline support
  → Store in RxDB first, sync later
  → NEVER make internet a prerequisite for core POS operations

IF feature needs historical data across branches
  → Phase 2: Neon SQL queries (both branches' data merged by location_id)
  → Phase 1: Not possible (each branch is isolated)

IF adding a new real-time event
  → Same-branch: Add to SSE kitchen broadcaster (stays permanently)
  → Cross-branch: Add Ably channel ONLY if Phase 2b is active
  → Follow naming: wtfpos:{location}:{domain}

IF changing replication behavior
  → Read RXDB_REPLICATION_GUIDE.md first
  → NEVER remove updatedAt from any schema
  → NEVER change replication from pull/push to push-only (clients must be able to recover)

IF someone suggests branch-to-branch sync
  → STOP. Branches are blind to each other by design.
  → Cross-branch = cloud merge (Neon) only.
  → This is simpler, more resilient, and matches how the business actually works.
```
