# UX Audit — Chaos Full Service Cycle · All Roles · Alta Citta
**Date:** 2026-03-09
**Mode:** Extreme Multi-User
**Branch:** Alta Citta (tag)
**Viewport:** 1024×768 tablet
**Agents:** 6 parallel (Staff-A, Staff-B, Kitchen-A, Kitchen-B, Manager, Owner)
**Scenarios:** 22 (Wave 1 full house → mid-service chaos → Wave 2 → EOD close)

**Source files:**
- `2026-03-09_chaos-full-service-staff-a.md`
- `2026-03-09_chaos-full-service-staff-b.md`
- `2026-03-09_chaos-full-service-kitchen-a.md`
- `2026-03-09_chaos-full-service-kitchen-b.md`
- `2026-03-09_chaos-full-service-manager.md`
- `2026-03-09_chaos-full-service-owner.md`

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 44 issues resolved (P0: 0/5 · P1: 0/20 · P2: 0/19)

---

## A. Layout Maps Per Role

### Staff — POS Floor Plan
```
+--sidebar--+--------floor plan (65%)--------+--order sidebar (35%)--+
| POS   [●] | [ALTA CITTA]  [Change Location] |  Table T1 · 2 pax     |
| Kitchen   |----------------------------------------              |  Pork Package         |
| Stock [!] | [T1:●] [T2:●] [T3:●] [T4:●]   |  ─────────────────    |
| Reports   | [T5:●] [T6:●] [T7:●] [T8:●]   |  2x Samgyup Pork      |
|           |                                 |  1x Extra Rice        |
|           |        ~~fold~~                 |  1x Coke              |
|           |                                 |  ─────────────────    |
|           |                                 |  [Add Item]           |
|           |                                 |  [Checkout]   ← CTA   |
|           |                                 |  [⋯ More Options ▼]  |
|           |                                 |  [Cancel Order]  RED  |
+-----------+---------------------------------+-----------------------+
⚠ SVG click targets overlap at table boundaries — wrong table opens under stress
```

### Kitchen — KDS Order Queue
```
+--sidebar--+------- KDS (full width) --------+
| Kitchen   | [ALTA CITTA]                     |
| ─ Orders  | 8 active · 34 items  [🔊──●──]  |
| ─ All     |----------------------------------|
| ─ Weigh   | T1 · Pork Package   [12:34] NEW  |
| Stock     | ┌─ MEATS ──────────────────────┐ |
|           | │ Samgyup Pork x2    [BUMP ▶]  │ |  ← 44px ✓
|           | │ Liempo x1          [BUMP ▶]  │ |
|           | └──────────────────────────────┘ |
|           | ┌─ DISHES & DRINKS ─────────────┐|
|           | │ Extra Rice x1      [BUMP ▶]  │ |
|           | └──────────────────────────────┘ |
|           | ┌─ 🔁 REFILL REQUESTS ──────────┐|  ← orange bg ✓
|           | │ T3 · Samgyup sides  [BUMP ▶] │ |
|           | └──────────────────────────────┘ |
|           |  ~~fold~~                        |
+-----------+----------------------------------+
⚠ "8 active · 34 items" header is text-xs — unreadable at grill distance
⚠ BluetoothScaleStatus NOT mounted — scale unreachable from weigh station
```

### Manager — Multi-Page Overview
```
+--sidebar--+------ current page content -----+
| POS       | [ALTA CITTA]                     |
| Kitchen[3]| ← urgency badge ✓               |
| Stock [2] | ← low stock badge ✓             |
| Reports   |                                  |
| ─────── ─ |  [Delivery form]                 |
| Quick:    |  Item: [search... ▼ Lettuce]  ✓ |
|  Log Exp  |  Qty:  [_______]                 |
|  Receive  |  Batch:[_______]                 |
|  X-Read   |  ⚠ Don't forget batch/expiry ↓  |  ← nudge ✓
|           |  [Confirm] → [Success toast ✓]  |
+-----------+----------------------------------+
⚠ P2-17 NOT implemented — no last-updated timestamp on inventory rows
⚠ Location switch updates localStorage but NOT sessionStorage
```

### Owner — Reports
```
+--sidebar--+------ reports content -----------+
| ALL LOCS  | [ALL LOCATIONS — change]         |
| ─ Quick   |                                  |
|   actions | ┌─ AllBranchesDashboard ────────┐|
|  (greyed) | │ Alta Citta  │  Alona Beach    ││
|  when all | │ ₱0 today    │  ₱0 today       ││
|           | └──────────────────────────────┘ |
|           |  [Switch to a branch to act]      |
|           |   ↑ missing — no in-canvas CTA   |
|           |  ~~fold~~                         |
|           | Branch Comparison: This Week ✓    |
+-----------+----------------------------------+
⚠ Location switch persists to localStorage but NOT sessionStorage — EOD button re-disables on nav
```

---

## B. Principle-by-Principle Assessment (Unified)

| # | Principle | Verdict | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | AddItemModal has no search — 50+ items in 5 categories, no typeahead |
| 2 | **Miller's Law** | PASS | KDS chunks correctly: MEATS / DISHES / REFILLS. Order sidebar chunked by category |
| 3 | **Fitts's Law** | FAIL | SVG table click targets overlap; cash preset buttons 32px; pax chip min-height:unset; 86 button gray-on-gray invisible; VoidModal reasons 40px |
| 4 | **Jakob's Law** | PASS | Standard POS layout: left nav, floor grid, right sidebar, bottom CTA |
| 5 | **Doherty Threshold** | PASS | RxDB writes local-first — all state changes instant. CHARGE → SENT badge is immediate |
| 6 | **Visibility of Status** | CONCERN | No per-table floor badge after kitchen refuse; void overlay passive (no ack button); BluetoothScaleStatus not mounted |
| 7 | **Gestalt: Proximity** | PASS | Related controls grouped correctly throughout. MEATS/DISHES/REFILLS separation is good |
| 8 | **Gestalt: Common Region** | CONCERN | Refill requests now correctly isolated with orange region ✓. But RETURN expand-reveal has no visible region affordance |
| 9 | **Visual Hierarchy (scale)** | CONCERN | KDS ticket count "8 active · 34 items" is text-xs — not readable at arm's length. 86 button gray-on-gray |
| 10 | **Visual Hierarchy (contrast)** | FAIL | Item ✕ button is text-gray-300 on white — invisible. 86 button invisible in default state |
| 11 | **WCAG: Color Contrast** | CONCERN | Void reason buttons legible. Refill orange section: text-orange-800 on bg-orange-50 = ~4.5:1 (borderline AA) |
| 12 | **WCAG: Touch Targets** | FAIL | Cash presets 32px, pax chip min-height:unset, VoidModal reasons 40px, yield calc close 24px, volume slider 20px, TransferModal close unset |
| 13 | **Consistency (internal)** | CONCERN | Two delivery form implementations can diverge. Pax cap enforced on buttons but not custom input |
| 14 | **Consistency (design system)** | PASS | .btn-primary/.btn-danger used correctly. Badge colors consistent. LocationBanner present on all pages |

---

## C. "Best Shift Ever" Vision (Multi-Role)

It's 6pm Friday at Alta Citta. Ate Rose taps Table 1 on the floor plan — the tile responds instantly, the PaxModal opens with the 8 large numbered buttons. She enters 2, selects Pork Package from the photo cards, and the table turns orange before she lifts her finger. In the kitchen, Kuya Marc sees the T1 ticket pulse for 60 full seconds — impossible to miss even from the grill. He bumps the Samgyup Pork, and back at the register, a small green badge confirms "served."

By 6:30 the floor is full. Six refill requests arrive at once. On the kitchen screen, the orange REFILL REQUESTS section stacks up cleanly, completely separate from the cook orders above it. Kuya Marc bumps them in order. The floor tiles at T1, T3, T5 each show their orange 🔁 badge — Ate Rose sees at a glance which tables are waiting without checking her phone.

T4's college students accidentally got Cheese Ramen. Ate Rose taps the item ✕ — bright enough to see on the touchscreen — and the ManagerPinModal slides in. Sir Dan enters 1234 from across the room. In the kitchen, the "VOIDED — Kitchen acknowledge" overlay appears in red on the T4 ticket. Kuya Marc taps it immediately, before wasting prep time.

Sir Dan gets a red dot on the Stock sidebar item. He opens inventory, sees Lettuce at 180g, opens the delivery form. He gets interrupted by a walk-in. He navigates away — no problem, the delivery draft waits for him when he returns. He submits, sees the green "Delivery recorded ✓" toast, and returns to the floor.

At 1am Boss Chris opens the reports. The EOD button is enabled because the system remembered he switched to Alta Citta earlier. He generates the Z-Read, sees the branch name in the header, and flips to branch comparison. This Week shows real data for both branches. He closes the laptop satisfied.

That's the vision. Here's the gap.

---

## D. Prioritized Recommendations (All Roles Merged)

### P0 — MUST FIX (service-blocking)

| ID | Role | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P0-01 | Staff | **SVG floor tile click targets overlap** — wrong table opens under stress; `<g role="button">` elements share coordinate space | Add pointer-events areas with explicit hit regions per table, or increase gap between SVG table elements | M | High | 🔴 OPEN |
| P0-02 | Staff | **Custom pax input bypasses capacity validation** — `handleCustomConfirm()` has no cap check; staff can enter 12 pax for a 2-seat table, corrupting stock deductions and BIR pax totals | Add `if (value > table.capacity) return` guard in handleCustomConfirm | S | High | 🔴 OPEN |
| P0-03 | Staff | **Cash preset buttons are 32px** — every cash transaction will generate misclicks on touchscreen | Change min-height to 44px on cash preset buttons in CheckoutModal | S | High | 🔴 OPEN |
| P0-04 | Kitchen-B | **BluetoothScaleStatus not mounted in layout** — kitchen has zero UI path to pair or connect the Bluetooth scale; the scale integration is functionally dead on the weigh station page | Mount BluetoothScaleStatus in kitchen +layout.svelte (not root layout) | S | High | 🔴 OPEN |
| P0-05 | Kitchen-B | **Scale simulator also unreachable** — only accessible through BluetoothScaleStatus; blocks QA and dev testing of scale workflow | Resolved by P0-04 |S | High | 🔴 OPEN |

### P1 — FIX THIS SPRINT (friction)

| ID | Role | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P1-01 | Owner | **Location switch not persisted to sessionStorage** — owner switches to Alta Citta, navigates to EOD, button re-disables; root cause: persistLocationChoice() saves localStorage but not sessionStorage | Add `sessionStorage.setItem(SESSION_KEY, ...)` inside persistLocationChoice() | S | High | 🔴 OPEN |
| P1-02 | Owner | **Quick Action links clickable when locationId='all'** — confirmed still navigable despite tooltip | Hard-disable with `pointer-events-none opacity-50` when session.locationId === 'all' | S | Med | 🔴 OPEN |
| P1-03 | Staff | **Start Shift modal on every new browser session** — no "resume shift" capability; blocks floor access | Add shift state persistence to localStorage or RxDB | M | High | 🔴 OPEN |
| P1-04 | Staff | **Item ✕ remove button is text-gray-300** — nearly invisible on white; the delete affordance is hidden | Change to text-gray-500 minimum; add hover:text-red-500 | S | High | 🔴 OPEN |
| P1-05 | Staff | **SC/PWD ID "optional" label contradicts checkout gate** — canConfirmCheckout blocks when IDs empty; confuses cashiers | Remove "optional" label or make the ID field truly optional | M | Med | 🔴 OPEN |
| P1-06 | Staff | **Pax change chip uses min-height:unset** — removes 44px guarantee from the pax change entry point | Remove min-height:unset, allow base CSS to apply | S | Med | 🔴 OPEN |
| P1-07 | Staff | **VoidModal reason buttons are 40px** — 4px below minimum; under pressure staff may misselect reason | Add min-h-[44px] to each reason button | S | Med | 🔴 OPEN |
| P1-08 | Staff | **Discount row has 5 buttons in overflow-x-auto with text-xs labels** — SC/PWD missed under pressure | Prioritize SC/PWD as top two, increase text size | S | Med | 🔴 OPEN |
| P1-09 | Kitchen-A | **RETURN expand-to-reveal action not discoverable** — no visual cue that tapping an item row expands it; will be missed entirely during service | Add chevron indicator or persistent "Hold to expand" label | M | High | 🔴 OPEN |
| P1-10 | Kitchen-A | **Ticket count header is text-xs** — "8 active · 34 items" unreadable from grill distance | Change to text-sm minimum (14px) | S | High | 🔴 OPEN |
| P1-11 | Kitchen-A | **No audible void alert** — voided items appear silently; 10s auto-dismiss can go unnoticed | Play a distinct short beep (different from new-order sound) on void arrival | M | High | 🔴 OPEN |
| P1-12 | Kitchen-A | **No void acknowledge tap** — auto-disappears with no active kitchen confirmation | Add [Got it] / [✓ Acknowledged] button to dismiss void overlay immediately | S | Med | 🔴 OPEN |
| P1-13 | Kitchen-A | **86 button invisible in default state** — gray-on-gray text on available rows | Change to text-gray-500 with hover:text-red-600; show red/warning when stock is critical | S | High | 🔴 OPEN |
| P1-14 | Kitchen-A | **Un-86 fires immediately with no confirmation** — accidental touches restore sold-out items silently | Add "Restore [item] to menu?" confirm step | S | High | 🔴 OPEN |
| P1-15 | Kitchen-A | **No per-table floor badge after kitchen refuse** — kitchen alert goes to dismissable AlertBanner only | Add persistent per-table badge on floor plan tiles when kitchen has refused an item for that table | M | High | 🔴 OPEN |
| P1-16 | Kitchen-B | **Yield logging requires Manager PIN** — routine measurement gate behind PIN during mid-service delivery | Allow kitchen role to log yield weights without PIN; audit log records the action anyway | M | Med | 🔴 OPEN |
| P1-17 | Kitchen-B | **No current stock shown when weighing** — kitchen can't sanity-check entry against current level | Show current stock for selected item below the item select on weigh station | S | Med | 🔴 OPEN |
| P1-18 | Kitchen-B | **No numpad in YieldCalculatorModal** — inconsistent with main weigh station; forces software keyboard | Add numpad component to YieldCalculatorModal | M | Med | 🔴 OPEN |
| P1-19 | Manager | **P2-17 not implemented** — no "last updated Xh ago" timestamp on inventory rows | Implement formatDistanceToNow on inventory rows (was listed as done but not present) | S | Med | 🔴 OPEN |
| P1-20 | Staff | **Ghost-occupied table state** — T5 shows occupied in RxDB with 0 items on bill | Add guard: if table status is occupied but order has 0 items, show recovery prompt | M | Med | 🔴 OPEN |

### P2 — BACKLOG (polish)

| ID | Role | Issue | Effort | Impact | Status |
|---|---|---|---|---|---|
| P2-01 | Staff | Refill badge (purple "Rn") has no pulse animation — may be missed on a busy floor | S | Low | 🔴 OPEN |
| P2-02 | Staff | ShiftStart modal coexists with live floor plan — staff can accidentally tap a table while entering float | S | Low | 🔴 OPEN |
| P2-03 | Staff | PaxModal over-capacity tooltip is hover-only — touch devices never see it | S | Low | 🔴 OPEN |
| P2-04 | Staff | TransferModal ✕ close button has min-height:unset | S | Low | 🔴 OPEN |
| P2-05 | Staff | "More Options ▼" gives no hint that Transfer and Merge live there | S | Low | 🔴 OPEN |
| P2-06 | Kitchen-A | Volume slider is ~20px tall — needs 44px wrapper | S | Low | 🔴 OPEN |
| P2-07 | Kitchen-A | No pending refill aggregate pill — in a 6-refill surge, kitchen must scan all cards | M | Med | 🔴 OPEN |
| P2-08 | Kitchen-A | "Live" green dot gives no staleness signal — always green regardless of last update | S | Low | 🔴 OPEN |
| P2-09 | Kitchen-B | Yield calculator close button ~24px — below 44px | S | Low | 🔴 OPEN |
| P2-10 | Kitchen-B | Meat cut select in yield calculator not searchable (80+ items) | S | Med | 🔴 OPEN |
| P2-11 | Kitchen-B | Dispatched log lost on page refresh (in-memory only) | M | Med | 🔴 OPEN |
| P2-12 | Manager | ShiftStart "skip" button labeled "inventory/delivery staff only" — misleading for managers | S | Low | 🔴 OPEN |
| P2-13 | Manager | Two delivery form implementations (ReceiveDelivery.svelte + inline page form) can diverge | M | Med | 🔴 OPEN |
| P2-14 | Manager | Waste flow requires manager to enter their own PIN — consider auto-skip for manager role | M | Low | 🔴 OPEN |
| P2-15 | Owner | No in-canvas "Select Branch" CTA inside AllBranchesDashboard | S | Low | 🔴 OPEN |
| P2-16 | Owner | Branch comparison has no custom date range — only Today/This Week/This Month presets | M | Med | 🔴 OPEN |
| P2-17 | Owner | Voids & Discounts shows aggregate totals only — no per-void table with cashier and item detail | M | Med | 🔴 OPEN |
| P2-18 | Owner | MeatOntologyGraph SVG lacks ARIA labels | S | Low | 🔴 OPEN |
| P2-19 | All | playwright-cli parallel agents must use named sessions (-s=<role>) to avoid sessionStorage contamination — SKILL.md updated to v3.1.0 | S | — | ⚪ OUTDATED |

---

## E. Cross-Role Interaction Assessment

| # | Interaction | Source | Target | Latency | Visibility | Verdict |
|---|---|---|---|---|---|---|
| H1 | Order charged → KDS ticket | Staff POS | Kitchen KDS | Instant | NEW pulse 60s ✓ | PASS |
| H2 | Kitchen bumps meat → served badge | Kitchen KDS | Staff sidebar | Instant | Green badge ✓ | PASS |
| H3 | Staff fires refills → REFILL section | Staff POS | Kitchen KDS | Instant | Orange section separated ✓ | PASS |
| H4 | Staff voids item → VOIDED overlay | Staff VoidModal | Kitchen KDS | Instant | Red overlay 10s ✓ | PASS |
| H5 | Kitchen 86s item → unavailable in POS | Kitchen Inventory | Staff AddItemModal | <2s | Item greyed ✓ | PASS |
| H6 | Package change → manager PIN | Staff POS | Manager device | Instant | ManagerPinModal ✓ | PASS |
| H7 | Kitchen refuses item → floor alert | Kitchen KDS | Staff POS | Instant | AlertBanner only — dismissable | CONCERN |
| H8 | Table transfer → KDS label update | Staff POS | Kitchen KDS | Instant | Label updates ✓ | PASS |
| H9 | Wave 1 tables close → KDS clear | Staff Checkout | Kitchen KDS | Instant | Tickets clear ✓ | PASS |
| H10 | Manager X-Read → Owner reports | Manager Reports | Owner Reports | <5s (same device) | Branch-labeled ✓ | PASS |
| H11 | Z-Read generated → EOD state | Manager EOD | Owner Reports | <5s | Correct ✓ | PASS |

**Cross-role score: 10/11 PASS, 1/11 CONCERN**

---

## F. "Best Shift Ever" Infrastructure Gap

The Phase 1 RxDB same-device model means all handoffs above work instantly and correctly — because every browser tab shares the same IndexedDB origin. The real multi-device test (Phase 2 LAN replication) will stress H1, H2, H3, H4, H7 under network latency. The current foundation is solid.

The one structural gap: **H7 (kitchen refuse → floor alert)** relies on a dismissable AlertBanner with no persistent floor tile indicator. A rushed cashier dismisses the banner and forgets. This needs a per-table badge on the floor plan.

---

## G. Scenario Scorecard

| # | Scenario | Completed | Handoffs OK | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | Pre-service state | Yes | — | ShiftStart modal gate | CONCERN |
| 2 | T1 Anniversary Couple | Yes | H1 ✓ | None | PASS |
| 3 | T2 Barkada of 8 | Yes | H6 ✓ | Package change PIN flow | PASS |
| 4 | T3 Family + Senior | Partial | — | SC discount flow untested at checkout | CONCERN |
| 5 | T4 College Students void | Yes | H4 ✓ | Item ✕ invisible, VoidModal 40px | CONCERN |
| 6 | T5 Business + Takeout | Partial | H1 ✓ | Takeout dual-order not fully tested | CONCERN |
| 7 | T6 Influencer + PWD | Yes | — | PWD optional label contradicts gate | CONCERN |
| 8 | T7 Walk-In chaos | Yes | H6 ✓ | Kitchen refuse → AlertBanner only | CONCERN |
| 9 | T8 Transfer to VIP | Yes | H8 ✓ | Transfer hidden in More Options | PASS |
| 10 | Refill Tsunami | Yes | H3 ✓ | No aggregate pill count | PASS |
| 11 | Kitchen 86 Pork Belly | Yes | H5 ✓ | 86 button gray-on-gray, un-86 no confirm | CONCERN |
| 12 | Meat Weighing | Yes | — | Scale not mountable from kitchen (P0-04) | FAIL |
| 13 | Manager Stock Panic | Yes | — | P2-17 not implemented | CONCERN |
| 14 | Full Order Void | Yes | H4 ✓ | Cancel Order visible and red ✓ | PASS |
| 15 | Printer Offline Checkout | Yes | — | Checkout completes, non-blocking toast ✓ | PASS |
| 16 | Wave 1 Close Mixed Payments | Yes | H9 ✓ | Cash presets 32px | CONCERN |
| 17 | Wave 2 Rapid Open | Yes | — | SVG click drift, rapid open unreliable | FAIL |
| 18 | T1 Over-Capacity | Yes | — | Custom pax input bypasses cap (P0-02) | FAIL |
| 19 | SC + PWD conflict | Partial | — | Mutual exclusivity not verified | CONCERN |
| 20 | Last Table + Leftover Penalty | Partial | — | LeftoverPenaltyModal not reached | CONCERN |
| 21 | Manager X-Read | Yes | H10 ✓ | Branch label correct, button disabled for 'all' ✓ | PASS |
| 22 | Owner EOD + Reports | Yes | H11 ✓ | sessionStorage not updated on location switch (P1-01) | CONCERN |

**Scorecard: 7 PASS · 11 CONCERN · 3 FAIL · 1 PARTIAL**

---

## H. Summary Counts

| Priority | New findings | Notes |
|---|---|---|
| **P0** | **5** | 2 staff (SVG clicks, custom pax cap), 1 checkout (cash buttons), 2 kitchen-B (scale unreachable) |
| **P1** | **20** | 8 staff/checkout, 7 kitchen, 3 manager/owner, 2 cross-role |
| **P2** | **19** | Polish, accessibility, discoverability |
| **Total** | **44** | |

| Role | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Staff | 2 | 8 | 5 | **15** |
| Kitchen KDS | 0 | 7 | 3 | **10** |
| Kitchen Weigh | 2 | 3 | 5 | **10** |
| Manager | 0 | 1 | 3 | **4** |
| Owner | 0 | 2 | 4 | **6** |
| Cross-role | 1 | 0 | 1 | **2** |
| (overlap) | — | — | — | **-3** |

---

## Overall Recommendation

This multi-user flow is **not ready for a live service shift** — three scenarios outright FAIL (scale unreachable, SVG click drift, custom pax bypassing capacity) and eleven more show significant friction. Fix the 5 P0s first (estimated 3–4 hours combined), which resolves the hardest blockers, then address the P1 touch-target violations and sessionStorage location bug before deployment.
