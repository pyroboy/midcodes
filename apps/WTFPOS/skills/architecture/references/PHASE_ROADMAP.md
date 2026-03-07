# WTFPOS — Phase Roadmap

## Phase Overview

| Phase | Name | Core Technology Added | Status |
|---|---|---|---|
| **Phase 1** | Local-First Foundation | RxDB + SSE bridge | ✅ Active |
| **Phase 2** | LAN Multi-Device Sync | RxDB HTTP/WS replication | 🔲 Planned |
| **Phase 3** | Cloud + Real-Time | Neon + Ably | 🔲 Planned |
| **Phase 4** | Hardware Integration | Bluetooth scale + printer | ⚠️ Partial |
| **Phase 5** | Full Offline-First | All phases combined + conflict resolution | 🔲 Future |

---

## Phase 1 — Local-First Foundation ✅ Active

### What's implemented
- RxDB + IndexedDB on every device (fully offline capable)
- All 16 collections with `locationId` + `updatedAt` on every document
- `createRxStore()` reactive Svelte 5 bridge
- Session management with role-based location locking
- SSE kitchen aggregate view (cross-branch, read-only, owner)
- Bluetooth scale integration (Web Bluetooth API)
- Full POS, KDS, Stock, Reports UI

### What Phase 1 does NOT have
- Data sync between devices at the same branch
- Cloud backup
- Real-time cross-device events
- Cross-branch data on the same device (owner sees only one branch's local data)

### SSE Kitchen Aggregate (Phase 1 bridge)
```
Owner device's browser → GET /api/sse/aggregate (same-origin)
  → Owner's SvelteKit server → fetch Tagbilaran server /api/sse/kitchen-orders
  → Owner's SvelteKit server → fetch Panglao server /api/sse/kitchen-orders
  → Merges streams → streams to owner browser

Branch browsers → watch RxDB orders (open + pending_payment)
  → debounce 3s → POST /api/events/kitchen-push (local server)
  → local server broadcasts to SSE clients
```
This SSE approach is correct for Phase 1. It will be replaced by Ably in Phase 3.

---

## Phase 2 — LAN Multi-Device Sync 🔲 Planned

### Goal
Multiple tablets at the same branch share the same data in real-time without internet.
- POS tablet creates order → KDS tablet sees it immediately
- Manager tablet makes menu change → all POS tablets reflect it
- If main server is offline, tablets queue changes and sync when it returns

### Technology: RxDB HTTP Replication

Each branch has one "main tablet" (SvelteKit adapter-node) that serves as the LAN replication hub.

```
Client tablets → replicateRxCollection({ pull/push to main server })
Main tablet    → serves /api/replication/pull and /api/replication/push
```

### Files to create (from RXDB_REPLICATION_GUIDE.md)
- `src/lib/db/replication.ts` — startReplication() client setup
- `src/lib/db/conflict-handlers.ts` — orderConflictHandler, kdsTicketConflictHandler
- `src/lib/stores/replication-config.svelte.ts` — server URL, isMainServer
- `src/routes/api/replication/pull/+server.ts`
- `src/routes/api/replication/push/+server.ts`
- `src/routes/api/replication/health/+server.ts`

### Conflict resolution required for
| Collection | Strategy |
|---|---|
| `orders` | Merge `items[]` and `payments[]` by ID; take latest scalar |
| `tables` | Latest `updatedAt` wins |
| `kds_tickets` | Merge item statuses; prefer "done" > "cooking" > "pending" |
| All others | Default (master wins) — append-only logs |

### Admin UI needed
- Server URL input field (admin settings page)
- "This device is the main server" toggle
- Connection status badge (LAN server: connected/offline)
- Pending sync count indicator

---

## Phase 3 — Cloud + Real-Time 🔲 Planned

### Goal
- Owner can see both branches from anywhere without being on the LAN
- Complex analytics queries run against Neon (not local RxDB)
- Ably replaces SSE for real-time cross-device events
- Cross-branch KDS view works without custom SSE infrastructure

### 3a: Neon PostgreSQL (cloud analytics + backup)

**Role:** Cloud database for analytics and backup. NOT a replacement for RxDB.

```
RxDB (operational truth)
    ↓ background replication
Neon (analytical truth + backup)
    ↑ queried by
Reports pages, owner dashboard
```

**Data flow:**
- Main tablet RxDB → `startCloudSync()` → POST to Neon API routes
- Neon tables mirror RxDB schemas (camelCase → snake_case)
- Reports that need cross-branch data or complex SQL query Neon directly
- Simple operational data (current orders, tables) still comes from RxDB

**Read skill:** `skills/neon/SKILL.md`

### 3b: Ably (real-time events)

**Role:** Replaces SSE for all cross-device real-time communication.

**Channels:**
```
wtfpos:{locationId}:kitchen     — KDS ticket updates
wtfpos:{locationId}:orders      — Order status changes
wtfpos:{locationId}:stock       — Stock level alerts
wtfpos:all:alerts               — Manager cross-branch alerts
```

**What Ably replaces:**
- `src/lib/server/kitchen-sse.ts` → delete
- `src/routes/api/sse/kitchen-orders/+server.ts` → delete
- `src/routes/api/events/kitchen-push/+server.ts` → delete
- `src/routes/api/sse/aggregate/+server.ts` → delete
- `src/lib/stores/kitchen-push.ts` → delete
- `EventSource('/api/sse/aggregate')` in all-orders page → Ably.subscribe()

**Read skill:** `skills/ably/SKILL.md`

---

## Phase 4 — Hardware Integration ⚠️ Partial

### Bluetooth Scale (partially implemented)
- `src/lib/stores/hardware.svelte.ts` — connection state
- `src/lib/stores/bluetooth-scale.svelte.ts` — weight readings
- `src/routes/kitchen/weigh-station/+page.svelte` — UI
- Weight data flows into order items as `weight` field (grams)

### Missing hardware features
- Automatic reconnect when scale disconnects mid-service
- Weight history / tare support
- Receipt printer (Web Bluetooth or Web USB)

**Read skill:** `skills/bluetooth/SKILL.md`

---

## Phase 5 — Full Offline-First 🔲 Future

### Goal
The system behaves identically whether online or offline. When connectivity returns, everything syncs automatically with no data loss and no user action required.

### Requirements
1. All Phase 1-4 features working together
2. Tested conflict scenarios: concurrent order edits, offline payments, duplicate sends
3. Connection status UI communicating clearly (not just a dot — explain what's queued)
4. Manager PIN-protected merge decisions for unresolvable conflicts
5. Neon as source of truth for historical data (> 90 days old, archived from RxDB)

### Key risks to resolve
| Risk | Mitigation |
|---|---|
| Two cashiers pay the same order offline | Payment idempotency key on `payments[]` array |
| Schema migration on a disconnected tablet | Server-first deploy, version guard on replication endpoints |
| Ably disconnect during busy service | Ably history on reconnect (last 2 minutes) |
| Neon sync falls behind by days | Neon storage cap alert + archival job |

---

## Cross-Phase Decision Rules

### "Should this feature use RxDB or Neon?"
- **Operational data** (active orders, current tables, today's stock) → RxDB
- **Historical analytics** (weekly sales, branch comparison, profit trends) → Neon
- **If unsure:** Start with RxDB. Neon is additive.

### "Should this use Ably or SSE?"
- **Phase 1 (now):** SSE (already built)
- **Phase 3+:** Ably — migrate everything
- **Never add new SSE endpoints** — Ably will replace them

### "Should this use LAN replication or cloud sync?"
- **Same-branch, same LAN:** LAN replication (Phase 2)
- **Cross-branch or cloud backup:** Neon cloud sync (Phase 3)
- **Never use Neon for same-LAN sync** — it's too slow and costs money per query

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation with Phase 1 marked active |
