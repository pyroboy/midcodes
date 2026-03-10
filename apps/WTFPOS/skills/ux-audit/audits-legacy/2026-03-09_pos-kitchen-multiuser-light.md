---
date: 2026-03-09
type: light-audit
scope: POS + Kitchen multi-user coordination
roles: staff (Alta Citta), kitchen (Alta Citta)
branch: tag (Alta Citta)
viewport: 1024x768
intensity: light
method: code-read + browser snapshot (playwright-cli)
---

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 8 issues resolved (P0: 0/2 · P1: 0/3 · P2: 0/3)

# Light UX Audit — POS ↔ Kitchen Multi-User Flow
## WTFPOS · Alta Citta · 2026-03-09

---

## A. Multi-User Flow Assessment

### Current POS → Kitchen Flow (from code)

The data path is:

```
Staff clicks item in AddItemModal
  → addItemToOrder() called in orders.svelte.ts (line 130)
  → KDS ticket created / updated in db.kds_tickets (line 160–183)
  → Stock deducted immediately via deductFromStock() (line 159)
  → Kitchen's /kitchen/orders page reactively updates via RxDB subscription
```

**Critical gate: the CHARGE button**

The `addItemToOrder()` flow (and thus KDS ticket creation + stock deduction) only fires when
staff presses **"⚡ CHARGE (N)"** in the AddItemModal Pending Items panel. Items sitting in
the "Pending Items" area of the modal have NOT yet been sent to the kitchen — they exist only
in local UI state until CHARGE is pressed.

This is the correct behavior for a samgyupsal POS (staff can add multiple items then commit
once), but it creates a critical coordination gap:

- If staff opens a table, selects a package + meats in AddItemModal, then **navigates away**
  without pressing CHARGE, the kitchen receives nothing.
- There is no "unsaved items" warning when closing the modal or switching tables.
- The POS floor plan header shows "1 occ" immediately on table open, before any items are
  charged — giving the appearance that the table is being served when the kitchen has nothing.

### Are there visible indicators that kitchen received the order?

**From the POS side:** After CHARGE is pressed, items move from the sidebar's "pending"
state. The order sidebar shows the bill total updating. However, there is no explicit
"Sent to Kitchen" confirmation toast or badge after CHARGE — staff must infer this
happened because the pending count drops.

**From the kitchen side:** New tickets appear reactively. The kitchen queue shows "Live"
indicator (e42 in snapshot) and a green "No pending orders" state when empty. When tickets
arrive, they appear as ticket cards. There is no push alert or sound — the kitchen must
be watching the screen.

### Can staff see if kitchen refuses/can't fulfill an item?

The `rejectOrderItem()` function in orders.svelte.ts marks the item as 'cancelled' in the
order and adjusts the bill total. A `kitchen_alerts` RxDB collection exists for cross-role
alerts. However, from the browser snapshot of the POS page, **no visible alert area or
"kitchen refused" indicator was found** in the order sidebar — the cancelled item disappears
from the bill but there is no prominent notification to staff that this happened.

### Race conditions and missing feedback

1. **Pending items lost silently**: AddItemModal pending area is local state. Navigating
   away or refreshing discards uncommitted items with no warning.

2. **Kitchen sees no priority signal**: The kitchen queue shows tickets in creation order
   with no urgency indicator. If a table has been waiting 45 minutes, the ticket looks
   identical to a fresh one (no color escalation by wait time at the ticket level — only
   at the table level in the POS floor plan).

3. **Role isolation not enforced on navigation**: Staff logged in as Maria Santos
   (role: staff) was able to navigate directly to `/kitchen/orders` without re-authentication.
   The kitchen queue loaded successfully under the staff session. This means a staff member
   could accidentally bump kitchen tickets.

---

## B. Stock Deduction Verification

### When does stock deduct?

**Stock deducts when `addItemToOrder()` is called — i.e., when staff presses CHARGE.**

Exact trigger path in `src/lib/stores/pos/orders.svelte.ts` (line 159):

```ts
deductQty > 0 ? deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false) : Promise.resolve(),
```

This runs inside `Promise.all([...])` alongside the KDS ticket update — so stock deduction
and KDS creation are atomic from the perspective of the POS flow.

**Special case — refill meats (addRefillRequest):**
Refill requests do NOT deduct stock at request time. The comment in the code is explicit:
> "Does NOT deduct stock — stock deduction happens at dispatch time."
Stock is deducted in `dispatchMeatWeight()` when the kitchen weighs and dispatches the meat
at the weigh station.

**Rollback behavior:**
- If an item is removed within the 30-second grace period (`removeOrderItem()`), stock is
  restored via `restoreStock()`.
- If the kitchen rejects an item (`rejectOrderItem()`), stock is restored.
- If the entire order is voided (`voidOrder()`), all item stock is restored.

### Is this the right behavior for a samgyupsal restaurant?

**Yes, with one important gap.**

Deducting at CHARGE time (item send) rather than at payment time is the correct behavior
for AYCE: the kitchen needs to know how much meat to prepare and the inventory should
reflect consumption as it happens, not when the table pays. Restoring stock on kitchen
rejection is also correct — if kitchen can't fulfill it, the item shouldn't be deducted.

**The gap:** For weight-based items (meats), staff can't enter the weight at CHARGE time
unless they know it in advance. In the AddItemModal snapshot, meat items show "tap to enter
weight" — if staff enters an estimated weight rather than the actual grilled weight, the
deduction will be inaccurate. The weigh-station workflow (`dispatchMeatWeight()`) solves
this for refills (deducts actual weight), but for the initial meat order it appears weight
must be entered by staff at AddItemModal time, before the meat has been weighed.

**Risk:** Staff may enter round numbers (e.g., 300g) for AYCE meat at order time. Actual
weight could differ. This creates a systematic stock drift that compounds over a busy shift.

---

## C. Quick Principle Assessment

### Visibility of System Status

| Observation | Verdict |
|---|---|
| Floor plan header shows "1 occ / 7 free" immediately after table open — accurate | PASS |
| Table T1 shows "0m, 4 pax" on the floor tile after opening — good at-a-glance data | PASS |
| Kitchen queue shows "Live" indicator | PASS |
| No "Sent to Kitchen" confirmation after CHARGE press | CONCERN |
| No "Kitchen refused item" alert visible in POS order sidebar | CONCERN |
| "Start Your Shift" cash float modal blocks POS entirely until dismissed — no bypass for already-started shifts | CONCERN |

### Feedback / Doherty Threshold

| Observation | Verdict |
|---|---|
| Adding a package item in AddItemModal updates Pending Total immediately | PASS |
| CHARGE button is disabled when 0 pending items (error prevention) | PASS |
| Pending items are staged locally before committing — good two-phase commit UX | PASS |
| No tactile/visual confirmation after CHARGE fires (e.g., toast "Order sent to kitchen") | CONCERN |

### Consistency

| Observation | Verdict |
|---|---|
| `⚡ CHARGE (N)` button shows item count in parens — helpful | PASS |
| Cancel table button is labeled "Cancel Table" (destructive, no confirmation shown in snapshot) | CONCERN |
| "More Options" button exists but content not visible — unclear what it contains for staff | CONCERN |

### Touch Targets

| Observation | Verdict |
|---|---|
| Package selection cards in AddItemModal are large enough for touch | PASS |
| Pax selection buttons (1–12) are appropriately large | PASS |
| Sidebar toggle "✕" button for closing an order is small (single character) | CONCERN |
| "4 pax ✎" inline edit button in sidebar header is small inline text with icon | CONCERN |

---

## D. Text Layout Map

### POS Floor Plan (Staff, table T1 open, AddItemModal visible)

```
+--sidebar(collapsed)--+------ main content (full width) ------+
| [W!]                 | [Toggle] POS 1occ 7free  [Legend][Takeout][History 58] |
| ---                  |--------------------------------------------------|
| [POS]                | [SVG floor plan]             |  [T1 4pax 0m] [+Add Item] |
|                      | [T1●] [T2] [T3] [T4]         |  BILL — 0 items           |
|                      | [T5]  [T6] [T7] [T8]         |  ₱0.00                    |
|                      |                              |  [Cancel Table][More Opts]|
| ---                  |--------------------------------------------------|
| [M]                  | [AddItemModal — full screen overlay]
| [Logout]             |   Tabs: [Package][Meats][Sides][Dishes][Drinks]
|                      |   Item grid (3-col)
|                      |   |---- Pending Items panel ----|
|                      |   | Pork Unlimited × 4 pax PKG  |
|                      |   | PENDING TOTAL: ₱1,596.00    |
|                      |   | [Undo] [⚡ CHARGE (12)]     |
|                      |   |-----------------------------|
+----------------------+------------------------------------------+
```

**No LocationBanner visible in any snapshot.** The banner is expected per CLAUDE.md but
was not detected in the accessibility tree. This may be a rendering issue or the banner is
hidden behind the modal overlay — warrants investigation.

### Kitchen Orders Page (staff session, no tickets)

```
+--sidebar(collapsed)--+------ kitchen content ------+
| [W!]                 | [All Orders][Order Queue][Weigh Station] |
| ---                  |------------------------------------------|
| [POS]                | Live                                     |
|                      | Kitchen Queue                            |
|                      | Active tickets awaiting kitchen action   |
|                      | [↩ UNDO LAST (disabled)]  [History]     |
|                      |------------------------------------------|
|                      | ✅ No pending orders                    |
|                      | New orders will appear here automatically|
|                      |------------------------------------------|
|                      | [0 Served Today] [— Avg Service] [— Last]|
+----------------------+------------------------------------------+
```

---

## E. Recommendations (Prioritized)

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | Staff with `role: staff` can navigate to `/kitchen/orders` and interact with KDS without re-authentication | Add route guard: `/kitchen/*` requires `role === 'kitchen'` or elevated role. Staff should be redirected to `/pos`. | S | High — security/correctness | 🔴 OPEN |
| **P0** | No "unsaved items" warning when closing AddItemModal with pending items. Closing modal or navigating away silently discards uncommitted items, and no KDS ticket or stock deduction fires. | Show confirmation dialog before closing modal when `pendingItems.length > 0`: "You have N items pending. Close without charging?" | S | High — data loss during rush | 🔴 OPEN |
| **P1** | No "Sent to Kitchen" feedback after CHARGE is pressed. Staff has no confirmation the KDS ticket was created. | Show brief toast/snackbar: "✓ Sent to kitchen — X items" for 2 seconds after CHARGE. | S | High — reduces staff anxiety during service | 🔴 OPEN |
| **P1** | No "Kitchen refused item" alert visible in POS order sidebar. When kitchen rejects an item, the cancelled item disappears silently from the bill. | Show a badge/notification in the order sidebar when an item is cancelled by kitchen: "⚠ Pork Sliced — refused by kitchen" | M | High — staff won't know to re-order or inform guests | 🔴 OPEN |
| **P1** | Initial meat weight entered by staff at CHARGE time is an estimate, not actual. Creates stock drift. | Document or enforce: weight-based items should go through the weigh station refill flow for accuracy. Or add a "pending weight" status for initial meat orders. | M | Medium — inventory accuracy | 🔴 OPEN |
| **P2** | "Cancel Table" button in order sidebar has no visible confirmation gate in accessibility tree | Add are-you-sure step (consistent with existing manager PIN gate pattern) | S | Medium — prevents accidental cancellations | 🔴 OPEN |
| **P2** | Kitchen queue has no priority/urgency escalation at the ticket level for long-waiting tables | Add elapsed time indicator on KDS ticket cards, color-escalating at >15m (yellow) and >30m (red) | M | Medium — kitchen prioritization | 🔴 OPEN |
| **P2** | "More Options" button label is ambiguous for staff — unclear what actions it contains | Rename to describe primary action (e.g., "Transfer / Merge / Split") or show icon hints | S | Low — discoverability | 🔴 OPEN |

---

## F. "Best Shift Ever" Vision

On a perfect Friday night service, Maria (staff) opens T1 for four guests with zero friction
— the pax modal appears immediately, she taps 4, selects Pork Unlimited, adds two extra
meats, and presses CHARGE. A brief green toast confirms "✓ 12 items sent to kitchen." At
the grill station, Pedro (kitchen) sees the T1 ticket appear instantly on his KDS screen with
the items grouped by category. He bumps the meats as they go on the grill, and back at the
register Maria sees a subtle "Served" badge appear next to each item on the sidebar.

When Pedro's kitchen runs low on pork sliced midway through service, he refuses that item via
the KDS. Maria immediately sees a small orange alert in the T1 order sidebar: "Pork Sliced —
refused by kitchen." She informs the guests and offers an alternative. No one has to yell
across the restaurant.

The current implementation is close to this vision for the POS-to-kitchen send path. The
gaps are in the feedback loop back from kitchen to staff, and in the accidental cross-role
access that could cause confusion during a busy shift.

---

## G. Scenario Scorecard

| # | Scenario | Completed | Handoffs OK | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | Staff opens T1, selects Pork Unlimited package (4 pax) | Yes | N/A (pre-charge) | Cash float modal gate on shift start | PASS |
| 2 | Package added → AddItemModal auto-switches to Meats tab | Yes | N/A | Good UX — auto-progression | PASS |
| 3 | Staff navigates to /kitchen/orders without re-login | Yes | N/A | Security gap: staff shouldn't access KDS | FAIL |
| 4 | Kitchen queue shows empty state with stats | Yes | N/A | No priority indicators on tickets | PASS |
| 5 | KDS receives ticket only after CHARGE is pressed | Confirmed via code read | 1/1 — correct gate | No "sent to kitchen" confirmation for staff | CONCERN |

---

*Audit method: playwright-cli browser snapshots (Staff login, table open, AddItemModal, kitchen page) + codebase code-read (orders.svelte.ts, stock.svelte.ts). No E2E test runner used.*

*Saved: /Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS/skills/ux-audit/audits/2026-03-09_pos-kitchen-multiuser-light.md*
