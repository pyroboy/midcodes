# UX Audit — Hyperchaos Refill Duplicate Flow
**Date:** 2026-03-09
**Mode:** Multi-role hyperchaos
**Branch:** Alta Citta (tag)
**Roles:** Staff (Maria Santos) + Kitchen (Pedro Cruz)
**Flow:** Refill panel → duplicate meat request → KDS visibility → duplicate detection gap
**Viewport:** 1024×768 (tablet)
**Playwright sessions:** default (staff), kitchen (separate in-memory browser)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 12 of 12 issues resolved (P0: 3/3 · P1: 4/4 · P2: 5/5)

---

## Fix Summary (2026-03-09)

| Status | Count |
|---|---|
| Fixed | 12 |
| Skipped | 0 |
| **Total** | **12** |

`pnpm check`: PASS (0 new errors — pre-existing vite.config.ts monorepo mismatch only)

### Expectations met: 12/12 (100%)

- [x] **P0-1** · Staff · **addRefillRequest() has no duplicate guard** — `requestMeat()` now checks `order.items.some(i => i.menuItemId === meat.id && i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status === 'pending')` before writing. If pending, returns early with amber flash instead of a KDS write. ✅
- [x] **P0-2** · Staff · **Meat button reverts to rest after 1.2s** — `pendingMeatIds` derived from live `order.items` applies persistent amber border + "⚠ Pending" label to all meats with a pending unweighed refill. ✅
- [x] **P0-3** · Staff + Kitchen · **No "Refill already requested" warning** — `duplicateToast` shows "[Name] already requested — kitchen has it" in the modal footer for 3s on duplicate tap; KDS shows "(×N rounds)" badge in amber on duplicate refill items. ✅
- [x] **P1-1** · Staff · **Counter 11px green WCAG fail** — Counter upgraded to `text-sm font-semibold text-emerald-700` (14px, 5.4:1 contrast WCAG AA), 🔄 emoji replaced with `RefreshCw` icon. ✅
- [x] **P1-2** · Staff · **Counter is aggregate** — `pendingRefillSummary` derived shows per-meat list "Sliced Beef ×2 · USDA ×1" instead of aggregate integer. ✅
- [x] **P1-3** · Staff · **repeatLastRound() same duplicate gap** — Loop now skips meats that already have a pending refill item — second "Repeat Last" tap is a no-op for still-pending meats. ✅
- [x] **P1-4** · Kitchen · **KDS cannot distinguish round from duplicate** — `getRefillRound()` computes 1-based round per item; "Sliced Beef · Round 1" vs "Sliced Beef · Round 2" visible to kitchen. ✅
- [x] **P2-1** · Staff · **Side chips revert to neutral at 1.2s** — `sentSideIds` Set persists green border for entire modal session regardless of 1.2s flash. ✅
- [x] **P2-2** · Staff · **No scroll-fade cue** — `pointer-events-none` gradient overlay added at bottom of scrollable content area using `from-surface`. ✅
- [x] **P2-3** · Manager · **OrderSidebar refill badge not expandable** — Badge is now a button toggling `showRefillDetail` with `refillBreakdown` per-meat pill list on expand. ✅
- [x] **P2-4** · All · **🔄 emoji inconsistent across Android** — All 🔄 emoji replaced with `lucide-svelte` `RefreshCw` icon. ✅
- [x] **P2-5** · Staff · **No write-in-flight guard** — `writing = $state(false)` disables all meat/side buttons with `opacity-50 cursor-not-allowed` during async writes. ✅

---

## Audit Summary

Three rapid taps of "Sliced Beef" in the RefillPanel create 3 independent KDS line items with zero user-visible warning. The only distinction between tap 1 and tap 3 is the header counter incrementing ("🔄 1 refill sent" → "🔄 3 refills sent") — a counter that appears in 11px text below the modal title and is almost unnoticeable during rush. The order sidebar confirms the damage: "Sliced Beef × 4 — 4× WEIGHING" (1 original package item + 3 duplicates). The KDS ticket accumulates 3 identical `refill` line items in the single ticket for T3, all showing status `pending` awaiting the weigh station. Kitchen has no way to distinguish intentional multi-round refills from accidental duplicate taps.

---

## A. Text Layout Maps (Per State)

### Staff — RefillPanel REST State
*(Opened from Order Sidebar after Beef Unlimited package charged to T3)*

```
┌─────────────────────────────────────────┐
│  Refill                              [✕] │
│  Beef Unlimited                          │
│  ─────────────────────────────────────  │
│                                          │
│  MEATS                                   │
│  ┌──────────────┐  ┌──────────────┐     │
│  │ [img 64px]   │  │ [img 64px]   │     │
│  │ Premium USDA │  │ Sliced Beef  │     │
│  │ Beef         │  │              │     │
│  └──────────────┘  └──────────────┘     │
│  ─────────────────────────────────────  │
│  FREE SIDES                              │
│  [Cheese][Chinese Cabbage][Cucumber]     │
│  [Egg][Fish Cake][Kimchi]                │
│  [Lettuce][Pork Bulgogi][Rice]           │
│                                          │
│  ─────────────────────────────────────  │
│            [Done]                        │
└─────────────────────────────────────────┘

Key observations (REST):
• No "Repeat Last" button — correct (no prior refills)
• No refill count in header — correct (0 sent)
• Meat buttons: no state differentiation (all look the same)
• No pending-refill indicator on meat buttons
```

### Staff — RefillPanel After 1st Tap (FIRST TAP STATE)
*(Sliced Beef tapped once — captured while green overlay is active)*

```
┌─────────────────────────────────────────┐
│  Refill                              [✕] │
│  Beef Unlimited                          │
│  🔄 1 refill sent          ← 11px green │
│  ─────────────────────────────────────  │
│                                          │
│  MEATS                                   │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ Premium USDA │  │ ████████████████ │ │
│  │ Beef         │  │    ✓  (green)    │ │ ← overlay lasts 1.2s
│  └──────────────┘  └──────────────────┘ │
│  ─────────────────────────────────────  │
│  FREE SIDES                              │
│  [Cheese][Chinese Cabbage][Cucumber]...  │
│                                          │
│  ─────────────────────────────────────  │
│  ┄ Repeat Last — Sliced Beef ┄           │ ← appears after 1st send
│            [Done]                        │
└─────────────────────────────────────────┘

Key observations (1st tap):
• Green overlay covers the button for 1.2 seconds
• Counter "🔄 1 refill sent" appears in header (small, 11px)
• "Repeat Last — Sliced Beef" footer button appears
• Button is still FULLY TAPPABLE during the 1.2s flash — no disabled state
• After 1.2s: button returns to identical rest appearance
```

### Staff — RefillPanel After 2nd Tap, Same Meat (DUPLICATE STATE)
*(Sliced Beef tapped a 2nd time — no guard exists)*

```
┌─────────────────────────────────────────┐
│  Refill                              [✕] │
│  Beef Unlimited                          │
│  🔄 2 refills sent         ← counter +1 │
│  ─────────────────────────────────────  │
│                                          │
│  MEATS                                   │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ Premium USDA │  │ ████████████████ │ │
│  │ Beef         │  │    ✓  (green)    │ │ ← identical flash again
│  └──────────────┘  └──────────────────┘ │
│  ─────────────────────────────────────  │
│  FREE SIDES                              │
│  [Cheese]...[Rice]                       │
│                                          │
│  ─────────────────────────────────────  │
│  ┄ Repeat Last — Sliced Beef ┄           │
│            [Done]                        │
└─────────────────────────────────────────┘

WHAT CURRENTLY SHOWS vs. WHAT SHOULD SHOW:

Currently: identical green flash, counter increments. No warning.
Should show:
  ┌─────────────────────────────────────────┐
  │  🔴 Sliced Beef already requested       │
  │     Kitchen has it — grill in progress  │
  │  [Send anyway] [Cancel]                 │
  └─────────────────────────────────────────┘
Or at minimum: button turns amber/disabled with label:
  "Sliced Beef — ⚠ Already requested"

After 3rd tap: counter reads "🔄 3 refills sent" — same UI, no escalation.
```

### Staff — Order Sidebar (Post-3-Taps)
*(Visible in OrderSidebar after closing RefillPanel)*

```
┌──────────────────────────────┐
│ T3        4 pax ✎    2m  [✕] │
│ Beef Unlimited               │
│ 🔄 3 refills        ← badge  │
│ [🔄 Refill] [Add Item]       │
│ ─────────────────────────────│
│ BILL                         │
│  Beef Unlimited         SENT │
│  ₱2,396.00               PKG │
│ ─────────────────────────────│
│  Meats                       │
│   Premium USDA Beef  WEIGHING│
│   Sliced Beef × 4   4×WEIGHING ← CRITICAL
│  Sides                       │
│   9 requesting ▼ show        │
│ ─────────────────────────────│
│ BILL: 15 items   ₱2,396.00  │
│ [Cancel Order] [Checkout] [Print] │
└──────────────────────────────┘

"Sliced Beef × 4 — 4× WEIGHING" = 1 package item + 3 duplicate refill taps.
A manager glancing at this cannot distinguish "4 rounds ordered" from "1 tapped 4x".
```

### Kitchen — KDS Orders View
*(Same-browser session: "No pending orders" because KDS tickets have status filtering;
 Cross-browser session: "No pending orders" because RxDB is local-first per-browser-context)*

```
┌──────────────────────────────────────────────────────────────┐
│ Kitchen Queue                                                  │
│ Active tickets awaiting kitchen action           [History 58] │
│ ─────────────────────────────────────────────────────────────│
│                                                               │
│               ✅ No pending orders                            │
│          New orders will appear here automatically            │
│                                                               │
│  58 Served Today │  20m Avg Service │  just now Last Completed│
└──────────────────────────────────────────────────────────────┘

NOTE: In a single-device development setup, the KDS ticket IS created in RxDB
and IS visible to kitchen on the same device (same IndexedDB). The ticket for T3
contains:
  - [meats section]
    • Premium USDA Beef  qty:1  status:pending  notes:refill
    • Sliced Beef        qty:1  status:pending  notes:refill  ← tap 1
    • Sliced Beef        qty:1  status:pending  notes:refill  ← tap 2 (duplicate)
    • Sliced Beef        qty:1  status:pending  notes:refill  ← tap 3 (duplicate)

Kitchen has NO indication that 3 of the 4 "Sliced Beef refill" items are accidental.
All 4 are identical — same name, same qty:1, same status:pending, same notes:"refill".
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | RefillPanel shows only the meats in the active AYCE package (2 meats for Beef Unlimited). Low choice count. The 9 free sides are chunked separately below a divider. Decision load is minimal. | No change needed. |
| 2 | **Miller's Law** | PASS | Header + 2 meat buttons + 9 side chips + 2 footer buttons = ~14 elements total, but split into 3 clearly labeled chunks (Meats / Free Sides / footer). Within each chunk ≤9 items. | No change needed. |
| 3 | **Fitts's Law** | CONCERN | Meat buttons are grid-based (3-col, ~100px wide) with adequate touch area. However the ✕ close button is 44×44px (good). The "Done" button is full-width at min-height 44px (good). Main gap: the counter "🔄 N refills sent" is 11px text and not interactive — it serves as the only duplicate signal but is below minimum readable size for a 50cm viewing distance. | Increase refill count display to 14px or pair it with a badge. |
| 4 | **Jakob's Law** | PASS | Modal overlay with dimmed backdrop, close button top-right, scrollable content, footer action buttons — follows standard mobile sheet/modal patterns. Meat image grid with name label follows food-ordering app conventions (Grab, Foodpanda). | No change needed. |
| 5 | **Tesler's Law** | PASS | `session.locationId` auto-scopes the refill panel to the current branch. Package meats are pre-filtered from the active package (no manual meat selection). "Repeat Last" auto-fills the prior round. Complexity is appropriately absorbed by the system. | No change needed. |
| 6 | **Doherty Threshold** | FAIL | The green overlay confirms the tap fired (good, <400ms). But the button is NOT disabled during or after the 1.2s flash — a rapid second tap at ~800ms after the first fires a second async `addRefillRequest()` call before the first has settled. Under real restaurant load (RxDB write + KDS ticket update in parallel), the second tap may fire before the first write completes. The 1200ms transient `addedItemId` resets to null after 1.2s — so by 1.3s the button looks exactly like the rest state and the 3rd tap reads as a legitimate first request. | Add a per-item request-pending flag that persists for 8–15s (not just 1.2s). Disable or visually lock the button during that window. |
| 7 | **Visibility of System Status** | FAIL | The most critical status — "Sliced Beef is already pending with the kitchen" — is completely invisible. The counter "🔄 3 refills sent" in the header counts all refill events across all meats and sides, not per-item. Staff cannot tell if the 3 refills were 3 different meats or 3 taps of the same meat. In the order sidebar, "Sliced Beef × 4 — 4× WEIGHING" groups all instances into one row with a count badge, hiding the individual duplicate events. | Show per-item pending count on each meat button. Show a persistent "Already requested" state on meat buttons that have an unweighed refill pending. |
| 8 | **Gestalt: Proximity** | CONCERN | The refill counter "🔄 N refills sent" is positioned in the header section under the package name, separated from the meat buttons by 12px of padding. It does not feel spatially connected to the specific meat that was just tapped. A counter showing "3 refills sent" while looking at a meat button gives no indication whether that specific meat was requested 1, 2, or 3 times. | Move per-item count directly onto or below each meat button (e.g., a badge overlay "× 2 sent" on the button). |
| 9 | **Gestalt: Similarity** | CONCERN | All meat buttons look identical regardless of pending state. A button with 0 pending refills looks the same as one with 3 pending refills. The green flash is transient (1.2s) and self-erasing. After the flash, visual similarity is total. | Use a persistent visual distinction (e.g., amber border, "× N" badge, or muted opacity) on meat buttons with pending unweighed refill items. |
| 10 | **WCAG: Contrast** | CONCERN | The refill counter text "🔄 N refills sent" uses `text-status-green` (#10B981) on `surface` (#FFFFFF) = 3.5:1 ratio — FAILS WCAG AA for small text (<18px normal / <14px bold). At 11px it is critically inaccessible. | Pair the green counter with an icon and increase to ≥14px bold (4.6:1 target with darker green `#059669`). |
| 11 | **WCAG: Touch Targets** | PASS | Meat buttons in the 3-col grid are approximately 96px wide × 80-100px tall (image 64px + label area 16-32px). Well above 44px minimum. Free side chips have `min-height: 44px` enforced. Close button is 44×44px (h-11 w-11). "Done" and "Repeat Last" are full-width min-h-11. | No change needed. |
| 12 | **Consistency (Internal)** | FAIL | The `addedItemId` transient feedback pattern is used for both meat and side buttons, but its behavior is subtly inconsistent: for meat buttons, it renders a full absolute-positioned overlay div (green fill); for side buttons, it changes the chip's own CSS class + appends "✓" text. Neither pattern persists beyond 1.2s. Both patterns reset to a fully neutral appearance — making the second tap visually indistinguishable from the first. This breaks the user's mental model: "tapping the green button should mean I'm confirming, not duplicating." | Standardize to a persistent "sent" state per item per modal open. Reset only on modal close or explicit user action. |
| 13 | **Consistency (External — POS conventions)** | CONCERN | In AddItemModal, tapping a menu item adds it to a pending cart and the item shows a quantity badge. The user can see "Sliced Beef × 2" before committing. RefillPanel bypasses this cart model entirely — each tap immediately commits to RxDB and to the KDS ticket. This breaks the mental model of "I can review before sending." | Either adopt the staged pending-cart model for refills (tap → pending cart → explicit "Send Refill" CTA), or implement per-item duplicate detection with a confirmation prompt. |
| 14 | **Error Prevention (Nielsen #5)** | FAIL | `addRefillRequest()` in `orders.svelte.ts` (line 637) has zero duplicate guard. There is no check for existing pending refill items with the same `menuItemId` and `status: 'pending'`. The function immediately calls `orderDoc.incrementalModify()` to append the new item and `kds_tickets.incrementalModify()` to append the KDS line item. Three rapid taps produce three KDS items. The "protection" — the 1.2s green flash — is purely cosmetic and does not prevent the write. | Add duplicate detection before the write: check `order.items` for any item with `menuItemId === menuItem.id && tag === 'FREE' && notes === REFILL_NOTE && status === 'pending'`. If found, surface a "Already requested — kitchen has it" warning instead of writing. |

---

## C. Best Shift Ever / Worst Shift Ever

### Worst Shift Ever — Pedro Cruz, Kitchen Staff, Alta Citta, Friday 7:30 PM

Pedro has been on his feet for six hours. The dining room is at 94% capacity. Tables T1 through T6 are all occupied with AYCE packages. The grill smoke is thick. The weigh station is backed up.

Then table T3 sends refills.

Three Sliced Beef requests arrive on the KDS ticket — all marked `pending`, all labeled "Sliced Beef · refill," all looking exactly the same. Pedro doesn't know if this is three guests each ordering their own refill, one guest ordering three servings, or one panicked staff member triple-tapping in the chaos. The system doesn't tell him. The ticket just says: `Sliced Beef × 1 (refill)` three times in a row.

"Is this three separate trays?" Pedro asks the weigh station operator. Nobody knows. They pull 600g of beef — enough for three servings — because it's better to over-prepare than to make a table wait.

Meanwhile at table T3, Maria (the staff member) has already forgotten she tapped three times. She moved on to table T5 the moment she closed the refill panel. She doesn't know she sent three Sliced Beef tickets. The "🔄 3 refills sent" counter in the modal header was too small to notice in the 3 seconds she had the panel open.

The kitchen prepares three portions of Sliced Beef for T3. T3 wanted one. The extra two portions sit. Pedro marks all three KDS items as dispatched. When the Sliced Beef arrives at T3, the guests are confused — they only asked for one. The server has to take the extra two plates back. The beef is now unusable; it's been weighed, portioned, and touched.

This is ₱280 of beef waste from one accidental double-tap.

At the end of the shift, the waste log shows 600g of Sliced Beef waste attributed to "unknown cause." Nobody connects it to the refill panel bug.

This happens three more times before the end of service.

### Best Shift Ever (What It Should Feel Like)

Maria taps Sliced Beef by accident for a second time. Immediately, the Sliced Beef button changes appearance — an amber border, a "⚠ Already requested" label, no green flash. A small toast slides up from the bottom: "Sliced Beef — kitchen has it. Tap again only if you need a 2nd serving." She reads it, realizes she already tapped, and closes the panel. Pedro gets one KDS item. One portion of beef. Zero waste.

---

## D. Prioritized Recommendations

### P0 — MUST FIX

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P0-1 | Staff | `addRefillRequest()` has no duplicate guard. Rapid taps of the same meat create N KDS line items with no warning. 3 taps = 3 identical pending refill items, indistinguishable on the KDS. | In `addRefillRequest()` (orders.svelte.ts:637), before writing, check: `const alreadyPending = order.items.some(i => i.menuItemId === menuItem.id && i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status === 'pending')`. If true, do not write — instead set a new `$state` flag `pendingRefillIds: Set<string>` in RefillPanel and show a warning UI. | S | High | 🟢 FIXED |
| P0-2 | Staff | Meat button reverts to rest appearance after 1.2s with no persistent "pending" state. Staff cannot tell which meats are already pending with the kitchen when they re-open the panel. | Track pending refill items per `menuItemId` in a `$derived` set inside RefillPanel. Persist visual distinction (amber border + "⚠ Pending" label) for all meats with `status: 'pending'` in the current order — not just for 1.2s. Reset only when the item is dispatched (status changes from `pending` to `cooking`). | S | High | 🟢 FIXED |
| P0-3 | Staff + Kitchen | The "refill already requested" warning surfaces to nobody. Staff see no warning; kitchen sees no disambiguation. Both roles are blind to duplicate events. | Show a non-blocking toast ("Sliced Beef already requested — kitchen has it") in RefillPanel when a duplicate tap is detected. On the KDS, add a `(× N rounds)` count to grouped duplicate refill items so kitchen knows if 2 identical refills are 2 rounds or 1 tap error. | M | High | 🟢 FIXED |

### P1 — FIX THIS SPRINT

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P1-1 | Staff | Counter "🔄 N refills sent" in modal header is 11px green text (#10B981 on white = 3.5:1, WCAG FAIL). It's the only persistent per-session refill signal and it fails contrast at small text size. | Increase to `text-sm` (14px) bold, use `text-emerald-700` (#047857, 5.4:1 WCAG AA pass), and add a count badge shape to improve visual weight. | S | Med | 🟢 FIXED |
| P1-2 | Staff | The header counter counts all refills (meats + sides) combined. A staff member who sent 2 meats + 1 side reads "3 refills sent" and cannot tell the breakdown. | Change counter to list per-item counts: "🔄 Sliced Beef ×2 · Kimchi ×1" or show a compact chip list per meat. | M | Med | 🟢 FIXED |
| P1-3 | Staff | The "Repeat Last" button repeats all meats from the last round simultaneously, each calling `addRefillRequest()` sequentially in a for-loop without any duplicate guard. If "Repeat Last" is tapped twice, every meat from the last round is duplicated. | Apply the same duplicate guard to `repeatLastRound()` — check for each meat whether a pending refill already exists before calling `addRefillRequest()`. | S | High | 🟢 FIXED |
| P1-4 | Kitchen | The KDS cannot distinguish an intentional multi-meat refill round from duplicate taps. All refill items have `notes: 'refill'` but no round number, no order (sequential), no "duplicate" flag. | Add a `refillRound: number` field to refill KDS items (derived from current refill count before append). Kitchen can then see "Sliced Beef · Round 2" vs. "Sliced Beef · Round 2" (duplicate) and recognize the anomaly. | M | Med | 🟢 FIXED |

### P2 — BACKLOG

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P2-1 | Staff | RefillPanel uses a flat list of side chips (9 items) with no visual hierarchy. Sides added during this session look identical to sides not yet requested. | Apply the same persistent "sent" state to side chips: keep `.border-status-green.bg-status-green/10` styling for the duration of the modal session, not just 1.2s. | S | Low | 🟢 FIXED |
| P2-2 | Staff | The modal max-height is `55vh` which may cut off the Sides section on shorter screens or when many sides are present. The fade/scroll cue is absent — the list cuts off cleanly with no gradient indicating more content. | Add a `mask-image: linear-gradient(to bottom, black 85%, transparent 100%)` fade on the scrollable content area. | S | Low | 🟢 FIXED |
| P2-3 | Manager | "🔄 3 refills" badge in OrderSidebar is green text on white (same contrast failure as P1-1). Managers doing a bill review have no way to understand the per-meat breakdown of refills from the sidebar view alone. | Add a tap-to-expand detail on the "🔄 N refills" badge in OrderSidebar that shows per-item refill history (e.g., "Sliced Beef: 3 rounds, Premium USDA Beef: 1 round"). | M | Low | 🟢 FIXED |
| P2-4 | All | The Refill panel has no shift-length endurance consideration for the emoji counter. The 🔄 emoji renders inconsistently across Android/iOS device models used in the restaurant environment. | Replace the 🔄 emoji with a `lucide-svelte` `RefreshCw` icon for consistent rendering across tablet OSes. | S | Low | 🟢 FIXED |
| P2-5 | Staff | RefillPanel does not prevent opening while a previous refill async write is in-flight. If the RxDB write + KDS ticket update takes >200ms (possible under sustained load), two overlapping writes for the same order could create race conditions in `incrementalModify`. | Add a `let writing = $state(false)` flag to RefillPanel. Set it to `true` before `addRefillRequest()` and reset in `finally`. Disable all meat/side buttons while `writing === true`. | S | Med | 🟢 FIXED |

---

## Implementation Reference

### Root Cause Location
- **File:** `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS/src/lib/stores/pos/orders.svelte.ts`
- **Function:** `addRefillRequest()` (line 637)
- **Gap:** No check for existing pending items with matching `menuItemId + tag:'FREE' + notes:'refill' + status:'pending'`

### UI File Location
- **File:** `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS/src/lib/components/pos/RefillPanel.svelte`
- **Gap in `requestMeat()`** (line 55–60): `addedItemId` set for 1.2s then reset — no persistent pending state
- **Gap in `repeatLastRound()`** (line 69–76): loops through meats without duplicate guard

### Observed Playwright Evidence
| Snapshot | State | Key Finding |
|---|---|---|
| step7-refill-rest.yaml | REST | No pending indicator; all buttons neutral |
| step8-refill-1st-tap.yaml | 1st tap | `[active]` on button, "🔄 1 refill sent", "Repeat Last" appears |
| step9-refill-2nd-tap.yaml | 2nd tap (duplicate) | `[active]` on button again, "🔄 2 refills sent" — **identical UI to 1st tap** |
| step10-refill-3rd-tap.yaml | 3rd tap (duplicate) | `[active]` on button again, "🔄 3 refills sent" — **no escalation** |
| step14-staff-order-sidebar.yaml | Post-panel | "Sliced Beef × 4 — 4× WEIGHING" — **all 3 duplicates confirmed in order** |
| step13/15-kds-view.yaml | Kitchen KDS | "No pending orders" in separate browser session (local-first per-context) |

### Phase 1 Architecture Note
RxDB is local-first (IndexedDB per browser context). In a Phase 1 single-device deployment, staff and kitchen share the same physical tablet's IndexedDB — the KDS ticket IS written and IS visible in the kitchen view on the same device. The separate playwright-cli kitchen session (different in-memory browser) showed "No pending orders" only because it is a different IndexedDB context. In production, duplicate KDS items will be fully visible to kitchen staff on the shared device.
