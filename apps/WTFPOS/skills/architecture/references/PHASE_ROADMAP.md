# WTFPOS — Phase Roadmap

## Phase Overview

| Phase | Name | Core Technology Added | Status |
|---|---|---|---|
| **Phase 1** | Local-First + Thin Client | RxDB + SSE + adapter-node | ✅ Active |
| **Phase 2** | Cloud + Real-Time | Neon + Ably | 🔲 Planned |
| **Phase 3** | Hardware Integration | Bluetooth scale + printer | ⚠️ Partial |
| **Phase 4** | Resilience & Archival | Conflict resolution + Neon archival | 🔲 Future |

---

## Phase 1 — Local-First + Thin Client ✅ Active

### Core model

One main tablet per branch runs the SvelteKit Node server. All other devices (kitchen screen, extra POS) are just browsers pointed at the main tablet over local WiFi. No sync, no replication, no internet required for operations.

```
Location: Alta Citta (Tag)

Main Tablet (SvelteKit Node + RxDB)
  ├── pnpm build → node build (port 3000)
  ├── owns all branch data in IndexedDB (RxDB)
  └── serves the app to all devices on local WiFi

Kitchen Tablet
  └── browser → http://192.168.1.x:3000/kitchen/dispatch
      reads from same server, same RxDB, instant updates via SSE

Extra POS Tablet (if needed)
  └── browser → http://192.168.1.x:3000/pos
```

Every device hits the **same RxDB on the same server** — there is nothing to sync. Kitchen updates are real-time because they're reading the same data source, not a copy.

### What's implemented
- RxDB + IndexedDB on the main tablet (fully offline capable)
- All 17 collections with `locationId` + `updatedAt` on every document
- `createRxStore()` reactive Svelte 5 bridge
- Session management with role-based location locking
- SSE kitchen real-time updates (same-branch, same server)
- SSE kitchen aggregate view (cross-branch, read-only, owner — requires internet)
- Bluetooth scale integration (Web Bluetooth API, partial)
- Full POS, KDS, Stock, Reports UI

### What Phase 1 does NOT have
- Cloud backup
- Owner cross-branch analytics (beyond SSE read-only view)
- Cross-branch real-time events
- Receipt printer

### SSE Kitchen (Phase 1 — same branch, no internet needed)
```
Cashier writes order → RxDB on main tablet
  → debounce 3s → POST /api/events/kitchen-push
  → server SSE broadcast
  → kitchen browser receives event → updates KDS instantly
```

### SSE Aggregate (Phase 1 — owner cross-branch, needs internet)
```
Owner browser → GET /api/sse/aggregate
  → owner's SvelteKit server fetches Tag server /api/sse/kitchen-orders
  → owner's SvelteKit server fetches Pgl server /api/sse/kitchen-orders
  → merges streams → owner browser sees both branches
```
This SSE aggregate will be replaced by Ably in Phase 2.

---

## Phase 2 — Cloud + Real-Time 🔲 Planned

### Goal
- Owner sees both branches from anywhere (not just on their local server)
- Complex analytics queries run against Neon (not local RxDB)
- Ably replaces SSE for cross-branch real-time events
- Neon provides cloud backup and historical data

### Why internet is acceptable here
Same-branch operations (POS ↔ Kitchen) already work in Phase 1 over local WiFi with zero internet. Internet is only needed for the **owner's cross-branch view and analytics** — which the owner always accesses from a connected device anyway.

### 2a: Neon PostgreSQL (cloud analytics + backup)

**Role:** Cloud database for analytics and backup. NOT a replacement for RxDB.

```
RxDB (operational truth, local)
    ↓ background sync when internet available
Neon (analytical truth + cloud backup)
    ↑ queried by
Reports pages, owner dashboard
```

**Data flow:**
- Main tablet RxDB → `startCloudSync()` → POST to Neon API routes
- Neon tables mirror RxDB schemas (camelCase → snake_case)
- Reports needing cross-branch data or complex SQL query Neon directly
- Simple operational data (current orders, tables) still comes from local RxDB

**Read skill:** `skills/neon/SKILL.md`

### 2b: Ably (real-time cross-branch events)

**Role:** Replaces SSE aggregate for cross-branch owner view. Same-branch real-time stays as SSE (Phase 1, already works).

**Channels:**
```
wtfpos:{locationId}:kitchen     — KDS ticket updates (cross-branch owner view)
wtfpos:{locationId}:orders      — Order status changes
wtfpos:{locationId}:stock       — Stock level alerts
wtfpos:all:alerts               — Manager cross-branch alerts
```

**What Ably replaces (SSE aggregate only):**
- `src/lib/server/kitchen-sse.ts` → delete
- `src/routes/api/sse/kitchen-orders/+server.ts` → delete
- `src/routes/api/events/kitchen-push/+server.ts` → delete
- `src/routes/api/sse/aggregate/+server.ts` → delete
- `src/lib/stores/kitchen-push.ts` → delete
- `EventSource('/api/sse/aggregate')` in all-orders page → Ably.subscribe()

**Read skill:** `skills/ably/SKILL.md`

---

## Phase 3 — Hardware Integration ⚠️ Partial

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

## Phase 4 — Resilience & Archival 🔲 Future

### Goal
Harden the system for long-term production use. No new features — this is about reliability and data lifecycle management.

### Requirements
1. Neon archival job — orders older than 90 days moved out of RxDB into Neon cold storage
2. Ably reconnect handling — replay missed messages on reconnect (cross-branch owner view)
3. Connection status UI — communicate clearly what's queued, not just a dot
4. Schema migration safety — version guard on server deploy for disconnected tablets

---

## Cross-Phase Decision Rules

### "Should this feature use RxDB or Neon?"
- **Operational data** (active orders, current tables, today's stock) → RxDB
- **Historical analytics** (weekly sales, branch comparison, profit trends) → Neon
- **If unsure:** Start with RxDB. Neon is additive.

### "Should this use Ably or SSE?"
- **Same-branch real-time (POS → Kitchen):** SSE — already works in Phase 1, keep it
- **Cross-branch or owner dashboard:** Ably (Phase 2)
- **Never add new SSE endpoints** — Ably will replace the cross-branch aggregate

### "Do we need LAN replication?"
- **No.** The thin client model in Phase 1 makes LAN replication unnecessary.
- All devices at a branch hit the same main tablet server — there is nothing to replicate.
- Cross-branch owner view uses Ably + Neon (internet required, acceptable).

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation with Phase 1 marked active |
| 2026-03-11 | Removed Phase 2 LAN replication — thin client model makes it unnecessary. Renumbered phases. Phase 1 now explicitly documents the main tablet + thin client architecture. |
