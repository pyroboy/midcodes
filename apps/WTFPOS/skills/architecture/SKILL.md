---
name: architecture
description: >
  Master architecture oversight for WTFPOS. Use this skill when making decisions that span multiple
  technology layers — RxDB, Neon, Ably, Bluetooth, offline sync, cross-device replication, or
  cross-branch data. Also use when the user asks "how should we...", "what's the best approach...",
  "how does X connect to Y", "which phase does this belong to", or when a new feature might affect
  the data sync strategy, real-time pipeline, or offline capabilities. This skill is the map;
  the other skills (rxdb, neon, ably, bluetooth) are the territory. Read this first whenever you
  are unsure which technology or approach belongs to a given feature.
version: 1.0.0
---

# WTFPOS — Architecture Oversight

This skill is the connective tissue between all other technology skills. It answers:
- **What is the overall architecture goal?**
- **Which phase does a given feature belong to?**
- **How do RxDB, Neon, Ably, and Bluetooth connect?**
- **What's already implemented vs what's preparation?**

Read the `references/` for deep diagrams and phase details:
- `references/ARCHITECTURE_MAP.md` — Full technology stack diagram with data flows
- `references/PHASE_ROADMAP.md` — Phase-by-phase implementation plan with readiness status

---

## The Architecture in One Sentence

**WTFPOS is a local-first, offline-capable, multi-branch restaurant POS where RxDB is the operational truth, Neon is the analytical truth, and Ably is the real-time event bus that connects them across devices and branches.**

---

## Current State (Phase 1 — Active)

| Layer | Technology | Status |
|---|---|---|
| Data persistence | RxDB + IndexedDB (Dexie) | ✅ Implemented |
| Local reactivity | Svelte 5 `createRxStore()` | ✅ Implemented |
| Branch isolation | `locationId` on every document | ✅ Implemented |
| Replication readiness | `updatedAt` on every document | ✅ Implemented |
| Hardware | Bluetooth scale (Web Bluetooth) | ✅ Partially implemented |
| Cross-branch view | SSE kitchen aggregate | ✅ Implemented (bridge solution) |
| LAN sync | RxDB HTTP/WebSocket replication | 🔲 Not started |
| Cloud sync | RxDB → Neon replication | 🔲 Not started |
| Real-time events | Ably channels | 🔲 Not started |
| Analytics queries | Neon direct SQL | 🔲 Not started |

---

## Technology Decision Map

When a feature request arrives, use this map to determine which technologies are involved:

```
Feature involves...                      → Technology
─────────────────────────────────────────────────────
Store/read/mutate data                  → RxDB (always the local truth)
Show data from another branch           → SSE now / Ably in Phase 3
Analytics report across branches        → Neon (SQL queries on cloud DB)
Real-time push event (KDS, alert)       → Ably (Phase 3) / SSE (bridge)
Offline capability                      → RxDB local-first (already works)
Same-branch multi-device sync           → RxDB LAN replication (Phase 2)
Hardware sensor (scale, printer)        → Web Bluetooth / Web USB
Cloud backup                            → Neon (via RxDB replication)
```

---

## The SSE Bridge → Ably Transition

The SSE kitchen aggregation built in Phase 1 (`/api/sse/kitchen-orders`, `/api/sse/aggregate`)
is a **deliberate stepping stone**, not the final architecture.

| Feature | SSE (Now) | Ably (Phase 3) |
|---|---|---|
| Kitchen cross-branch view | ✅ Working | Replaces SSE entirely |
| KDS real-time ticket updates | ❌ Not covered | ✅ Ably channel |
| Manager cross-branch alerts | ❌ Not covered | ✅ Ably presence + events |
| Cross-device order sync | ❌ Not covered | ✅ + RxDB replication |
| Offline fallback | ❌ Drops if server unreachable | ✅ Ably history on reconnect |

**When Ably is implemented:** Delete the SSE endpoints and `kitchen-push.ts` store.
Replace the `EventSource('/api/sse/aggregate')` in `all-orders/+page.svelte` with an Ably channel subscription.

---

## Offline-First Contract

Every feature MUST be designed so that the restaurant can operate with no internet.

**Rules:**
1. **All writes go to local RxDB first** — never block the UI on a network call
2. **Reads come from local RxDB** — the UI is always fast, even offline
3. **Neon and Ably are optional layers** — if unreachable, RxDB keeps working
4. **Sync is background** — replication and Ably subscriptions run in the background, not on the critical path

```
User action → RxDB write (immediate, local)
                 ↓ (background, best-effort)
           RxDB replication → LAN server → Neon
                 ↓ (background, best-effort)
           Ably publish → other devices
```

---

## Human in the Loop — Critical Gates

**STOP and ask the user before making any of these architectural decisions.**
These are not implementation details — they are direction changes that affect every future
session, every device in the restaurant, and potentially billing or live service continuity.

### 1. Advancing to a new phase

**Trigger:** Any request that implies starting Phase 2, 3, 4, or 5 (e.g., "let's add Neon",
"set up Ably", "enable LAN replication").

**Ask:**
- "Which specific problem is driving this phase change — what's broken or missing today?"
- "Are the Phase 1 foundations stable enough? (RxDB working, no outstanding schema issues, E2E tests passing)"
- "Is this for production devices or local development first?"
- "Who else is affected if this goes wrong? (staff using the system during service?)"

**Why:** Phase changes add irreversible infrastructure (cloud accounts, billing, new dependencies).
Starting early without a clear trigger leads to premature complexity.

---

### 2. Deleting the SSE bridge (Phase 1 → Phase 3 Ably migration)

**Trigger:** Any request to remove `/api/sse/*` endpoints or `kitchen-push.ts`.

**Ask:**
- "Is Ably fully tested and confirmed working on the owner's device for the kitchen aggregate view?"
- "Are all branch devices (Tagbilaran and Panglao) publishing to Ably channels successfully?"
- "Is there a fallback plan if Ably goes down mid-service? (The SSE bridge had no cloud dependency.)"

**Why:** Deleting SSE before Ably is verified leaves the owner with no cross-branch kitchen view.
This is a live service impact.

---

### 3. Adding a new technology to the stack

**Trigger:** Any request to install a new package or service that isn't already in the architecture
(e.g., a third-party sync service, a different real-time platform, a new ORM).

**Ask:**
- "Which existing technology in the stack does this overlap with?"
- "Is there a reason the existing planned stack (Neon/Ably/RxDB) can't solve this?"
- "Does this add a new cloud dependency or billing account?"

**Why:** Technology sprawl is the biggest risk for a small team. Every new technology must earn its place.

---

### 4. Cross-branch or cross-device decisions during live service hours

**Trigger:** Any change to replication, Ably channels, or SSE endpoints while staff are
actively using the system.

**Ask:**
- "What time is it at the restaurant right now? (Service hours: roughly 11am–11pm PH time)"
- "Can this wait until after close (11pm+)? If not, what's the urgency?"

**Why:** Replication or real-time changes mid-service can cause orders to disappear from KDS,
tables to show wrong state, or stock counts to reset — all during peak customer flow.

---

### 5. Destructive admin changes during active service (Operational Safety)

**Trigger:** Any request to implement a settings page, admin panel, or configuration UI that
can modify data structures used by the live POS — floor layout, menu items, packages, pricing,
VAT, or branch settings.

**Rule: The gate is active orders, not the clock.**

Do NOT use time-based business hours as the guard. Use `getActiveServiceInfo(locationId)` from
`src/lib/stores/admin-guard.svelte.ts`. This returns the real count of open and pending-payment
orders from RxDB — the ground truth regardless of time.

**Severity tiers:**

| Tier | Action | Behaviour |
|---|---|---|
| Hard block | Delete table with `currentOrderId !== null` | Refuse with explanation — no PIN override possible |
| Critical (PIN) | Delete menu item, VAT change, branch settings | Show `AdminChangeGuardModal` with risk=critical, require Manager PIN |
| High (PIN) | Publish floor layout, disable menu item, price change, package edit | Show `AdminChangeGuardModal` with risk=high, require Manager PIN |
| Safe | Move/reposition table, rename table label, change table capacity | No guard needed |

**Pattern to follow:**

1. Call `withGuard(action, fn)` — wraps any destructive operation
2. `withGuard` calls `getActiveServiceInfo()` — if inactive, executes `fn` immediately
3. If active, shows `AdminChangeGuardModal` — requires Manager PIN to proceed
4. On PIN confirm, `fn` executes and audit log records the override

**Key files:**
- `src/lib/stores/admin-guard.svelte.ts` — `CRITICAL_ACTIONS` registry, `getActiveServiceInfo()`, `verifyManagerPin()`
- `src/lib/components/AdminChangeGuardModal.svelte` — reusable PIN override modal
- Floor editor at `src/routes/admin/floor-editor/+page.svelte` — reference implementation

**Every new admin settings page must consult `CRITICAL_ACTIONS` and apply `withGuard()` for any
action in the registry before writing to RxDB.**

---

## Self-Improvement Protocol

This skill evolves with the project. When any of the following occur:
- The user corrects an architectural assumption
- A new phase begins or a phase scope changes
- A new technology is added to the stack
- Context7 or web research reveals outdated information in a referenced guide
- A PR merges that changes the data flow or technology boundaries

**Action required before continuing:**
1. Edit this `SKILL.md` to reflect the correction immediately
2. Update the relevant `references/` file
3. If a library API changed, use Context7 to re-fetch docs before updating references

---

## Using Context7 for Fresh Documentation

When working on any technology referenced in this skill:

```
// Resolve the library ID first
mcp__context7__resolve-library-id({ libraryName: "rxdb" })
mcp__context7__resolve-library-id({ libraryName: "ably" })
mcp__context7__resolve-library-id({ libraryName: "@neondatabase/serverless" })

// Then fetch the relevant section
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "<id from above>",
  topic: "replication offline sync",
  tokens: 5000
})
```

If Context7 doesn't have the library, use `WebSearch` for current docs.

---

## Key Files Reference

| File | Layer | Notes |
|---|---|---|
| `src/lib/db/index.ts` | RxDB | DB singleton, collections, migrations |
| `src/lib/db/schemas.ts` | RxDB | All collection schemas |
| `src/lib/stores/sync.svelte.ts` | RxDB | `createRxStore()` reactive bridge |
| `src/lib/stores/session.svelte.ts` | Auth | locationId, role, LOCATIONS |
| `src/lib/server/kitchen-sse.ts` | SSE bridge | Phase 1 cross-branch (future: Ably) |
| `src/routes/api/sse/aggregate/+server.ts` | SSE bridge | Phase 1 only — replace with Ably |
| `src/lib/stores/kitchen-push.ts` | SSE bridge | Phase 1 only — replace with Ably |
| `src/lib/stores/hardware.svelte.ts` | Bluetooth | Scale connection state |
| `src/lib/stores/bluetooth-scale.svelte.ts` | Bluetooth | Scale data and readings |
