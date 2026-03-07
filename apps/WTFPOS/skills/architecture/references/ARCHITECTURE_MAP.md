# WTFPOS — Architecture Map

## Full System Diagram (Target State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WTFPOS PRODUCTION TOPOLOGY                       │
│                                                                          │
│  ┌─────────────────────────┐       ┌──────────────────────────────┐     │
│  │   Tagbilaran Branch (Alta Citta) │  │  Panglao Branch (Alona Beach)    │     │
│  │                         │       │                              │     │
│  │  ┌─────────────┐        │       │  ┌─────────────┐            │     │
│  │  │ POS Tablet  │        │       │  │ POS Tablet  │            │     │
│  │  │ RxDB local  │        │       │  │ RxDB local  │            │     │
│  │  └──────┬──────┘        │       │  └──────┬──────┘            │     │
│  │         │ LAN           │       │         │ LAN               │     │
│  │  ┌──────▼──────┐        │       │  ┌──────▼──────┐            │     │
│  │  │ KDS Tablet  │        │       │  │ KDS Tablet  │            │     │
│  │  │ RxDB local  │        │       │  │ RxDB local  │            │     │
│  │  └─────────────┘        │       │  └─────────────┘            │     │
│  │         │ LAN           │       │         │ LAN               │     │
│  │  ┌──────▼──────────┐    │       │  ┌──────▼──────────┐        │     │
│  │  │ Main Server     │    │       │  │ Main Server     │        │     │
│  │  │ SvelteKit Node  │    │       │  │ SvelteKit Node  │        │     │
│  │  │ RxDB + SSE/WS   │    │       │  │ RxDB + SSE/WS   │        │     │
│  │  │ Bluetooth Scale │    │       │  │ Bluetooth Scale │        │     │
│  │  └──────┬──────────┘    │       │  └──────┬──────────┘        │     │
│  │         │               │       │         │                   │     │
│  └─────────┼───────────────┘       └─────────┼───────────────────┘     │
│            │                                 │                          │
│            │ HTTPS (internet)                │ HTTPS (internet)         │
│            │                                 │                          │
│            ▼                                 ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                          CLOUD LAYER                             │   │
│  │                                                                  │   │
│  │  ┌──────────────┐    pub/sub    ┌──────────────────────────┐    │   │
│  │  │ Neon         │◄────────────►│ Ably                     │    │   │
│  │  │ PostgreSQL   │              │ (Real-time event bus)    │    │   │
│  │  │ (analytics + │              │ Channels:                │    │   │
│  │  │  replication │              │  wtfpos:tag:kitchen        │    │   │
│  │  │  target)     │              │  wtfpos:pgl:kitchen      │    │   │
│  │  └──────────────┘              │  wtfpos:all:alerts        │    │   │
│  │         ▲                      │  wtfpos:tag:stock          │    │   │
│  │         │                      └──────────────┬───────────┘    │   │
│  │  RxDB → │                                     │               │   │
│  │  Neon   │                              subscribe │             │   │
│  │  replication                                    ▼             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                  │                      │
│                                   ┌──────────────▼──────────────┐       │
│                                   │   Owner / Manager Device    │       │
│                                   │   (remote, any location)    │       │
│                                   │                             │       │
│                                   │   Kitchen aggregate view    │       │
│                                   │   Reports (from Neon SQL)   │       │
│                                   │   Alerts (Ably presence)    │       │
│                                   └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow by Feature

### Order Created (POS Tablet)

```
1. Staff taps "Seat Table" on POS tablet
2. → RxDB.orders.insert({ ...order, locationId: 'tag', updatedAt: now })
   — Immediately visible on this device (local IndexedDB)
3. → RxDB LAN replication (background)
   → KDS tablet pulls updated orders from main server
4. → Ably publish to 'wtfpos:tag:kitchen' channel (Phase 3)
   → KDS sees new ticket in real-time (no polling)
5. → RxDB → Neon replication (background, cloud backup)
```

### Kitchen Aggregate View (Owner, Remote)

```
Phase 1 (current — SSE):
  Owner device → GET /api/sse/aggregate
  → Server-side connects to:
      Tagbilaran server: GET http://TAG_IP/api/sse/kitchen-orders
      Panglao server: GET http://PGL_IP/api/sse/kitchen-orders
  → Branch browsers push snapshots every 3s via POST /api/events/kitchen-push

Phase 3 (Ably):
  Owner device → Ably.subscribe('wtfpos:tag:kitchen')
  Owner device → Ably.subscribe('wtfpos:pgl:kitchen')
  → Real-time, no SSE, no polling, offline history on reconnect
  → SSE endpoints deleted
```

### Stock Count (Kitchen Staff, Offline)

```
1. Kitchen staff enters stock count on their tablet
2. → RxDB.stock_counts.insert() — works offline (local IndexedDB)
3. When LAN connectivity resumes:
   → RxDB LAN replication pushes to main server
4. When internet connectivity resumes:
   → Neon replication syncs to cloud
5. Manager sees count in reports (Neon SQL query)
```

### Bluetooth Scale → Order

```
1. Staff places meat on Bluetooth scale
2. → Web Bluetooth GATT notification fires
3. → bluetooth-scale.svelte.ts parses weight (grams)
4. → Weigh Station UI displays weight
5. → Staff confirms weight → Order item created with weight field
6. → RxDB.orders.incrementalModify() adds item with weight
7. → Flows through normal order pipeline above
```

---

## Location Data Flow

Every document has `locationId`. This enables:

1. **Local filtering** — components filter `orders.value.filter(o => o.locationId === session.locationId)`
2. **Replication scoping** — each branch's main server only replicates its own locationId documents to Neon
3. **Neon queries** — `WHERE location_id = 'tag'` for branch reports
4. **Ably channels** — `wtfpos:tag:*` vs `wtfpos:pgl:*` channel namespaces

```
'tag' documents  → Tagbilaran server → Tagbilaran Neon rows → Ably wtfpos:tag:*
'pgl' documents → Panglao server → Panglao Neon rows → Ably wtfpos:pgl:*
```

The `all` locationId is a **UI-only concept** — it never appears in a document's locationId field.

---

## Offline Capability Matrix

| Scenario | POS | KDS | Stock | Reports | Owner view |
|---|---|---|---|---|---|
| Full online | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| No internet (LAN only) | ✅ Full | ✅ Full | ✅ Full | ⚠️ Local only | ⚠️ No cross-branch |
| No LAN, no internet | ✅ Full (local only) | ⚠️ Stale data | ✅ Full (local) | ⚠️ Local only | ❌ Unavailable |
| LAN restored | — | ✅ Auto-sync | — | — | — |
| Internet restored | — | — | — | ✅ Neon data | ✅ Neon data |

**Design rule:** Every critical POS operation (order creation, payment, KDS bump) must work in the "No LAN, no internet" row. Neon and Ably are enhancement layers, not requirements.

---

## Technology Boundaries (Non-Negotiable)

| Technology | Does | Does NOT |
|---|---|---|
| **RxDB** | Store and replicate all operational data | Replace Neon for analytics |
| **Neon** | Long-term storage, complex SQL analytics, owner reports | Replace RxDB as operational DB |
| **Ably** | Real-time push events between devices | Store data or provide history beyond 365 days |
| **SSE** | Bridge cross-branch view (Phase 1 only) | Scale — replace with Ably in Phase 3 |
| **Bluetooth** | Connect hardware sensors (scale, future printer) | Sync data between tablets |
| **LAN replication** | Sync same-branch tablets | Sync across branches |

---

## Operational Safety Matrix

Admin configuration changes carry different risk levels depending on whether active orders exist.
This matrix is the canonical reference for every admin settings page and config UI.

**The gate signal is `getActiveServiceInfo(locationId).isActive` — not the clock.**

| Action | Risk | Hard Block | PIN Gate | Audit Log |
|---|---|---|---|---|
| Move/resize table (position only) | None | — | — | — |
| Rename table label | None | — | — | — |
| Publish floor layout | High | — | Manager PIN | ✅ |
| Add new table | None | — | — | ✅ |
| Delete table (no active order) | High | — | Manager PIN | ✅ |
| Delete table (`currentOrderId !== null`) | Critical | ✅ Always blocked | N/A | — |
| Disable menu item | High | — | Manager PIN | ✅ |
| Delete menu item | Critical | — | Manager PIN | ✅ |
| Edit package composition | High | — | Manager PIN | ✅ |
| Change item price | High | — | Manager PIN | ✅ |
| Change VAT settings | Critical | — | Manager PIN | ✅ |
| Change branch/location settings | Critical | — | Manager PIN | ✅ |

**Implementation pattern (reference: floor editor `+page.svelte`):**

```svelte
<!-- In script -->
import AdminChangeGuardModal from '$lib/components/AdminChangeGuardModal.svelte';
import { getActiveServiceInfo, type CriticalActionId } from '$lib/stores/admin-guard.svelte';

let guardAction = $state<CriticalActionId | null>(null);
let guardPendingFn = $state<(() => void) | null>(null);

function withGuard(action: CriticalActionId, fn: () => void) {
  const service = getActiveServiceInfo(session.locationId);
  if (!service.isActive) { fn(); return; }
  guardAction = action;
  guardPendingFn = fn;
}

<!-- In template -->
{#if guardAction}
  <AdminChangeGuardModal
    action={guardAction}
    locationId={session.locationId}
    locationName="Alta Citta"
    onConfirm={() => { guardPendingFn?.(); guardAction = null; guardPendingFn = null; }}
    onCancel={() => { guardAction = null; guardPendingFn = null; }}
  />
{/if}
```

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — Phase 1 current, Phase 2-4 planned |
| 2026-03-07 | Added Operational Safety Matrix — admin-guard pattern, CRITICAL_ACTIONS registry |
