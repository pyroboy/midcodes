# UX Audit: Kitchen KDS — `/kitchen/orders`
**Role:** Kitchen (Pedro Cruz) · **Branch:** Alta Citta (Tagbilaran) · **Viewport:** 1024×768 tablet · **Date:** 2026-03-09

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 13 issues resolved (P0: 0/2 · P1: 0/7 · P2: 0/4)

---

## A. Kitchen KDS Layout Map (ASCII)

### Login Page (Kitchen Role Entry)
```
+------------------------------------------+--Dev Panel (right half)--+
| 🔥 WTF! SAMGYUP                           | 🧪 Dev — Test Accounts   |
| Restaurant POS                            |                          |
|                                           | 🏠 Alta Citta · Tagbilaran
| [Username input]                          | [M] Maria Santos  Staff ›|
| [Password input] [👁]                     | [J] Juan Reyes  Mgr PIN ›|
| [LOGIN → disabled]                        | [P] Pedro Cruz  Kitchen ›| ← target
|                                           |                          |
|                                           | 🏠 Alona Beach · Panglao |
|                                           | [A] Ana Lim  Staff ›     |
|                                           | [C] Carlo  Mgr PIN ›     |
|                                           | [J] Jose  Kitchen ›      |
+------------------------------------------+--------------------------+
```
**Kitchen button is 3rd in its section, no keyboard shortcut, no icon differentiation**

### KDS Page — Empty State (above fold at 1024×768)
```
+--sidebar--+-------- main content (SidebarInset) --------+
| [W!]      | [flag] ALTA CITTA (TAGBILARAN)  [Live ●]     |
| ─────     |                                              |
| [🍳]      | 🧾 All Orders │ 📋 Order Queue │ ⚖️ Weigh    |
| Kitchen   |─────────────────────────────────────────────|
| [📦]      | Kitchen Queue                    [↩ UNDO] [History 58] |
| Stock     |─────────────────────────────────────────────|
|           |                                              |
| ─────     |              ✅                             |
| [P]       |        No pending orders                    |
| Logout    |   New orders will appear here automatically  |
+--sidebar--+                                              |
            |  ┌──────────┐ ┌──────────┐ ┌──────────┐   |
            |  │ 58       │ │ 20m      │ │ just now  │   |
            |  │ Served   │ │ Avg Svc  │ │ Last Done │   |
            |  └──────────┘ └──────────┘ └──────────┘   |
            +─────────────────────────────────────────────+
```
**Fold line at ~768px — stats row is visible, whole empty state fits above fold.**

### KDS Page — Active Ticket Card Structure (from source code)
```
┌─────────────────────────────────────────────────────────┐
│ T{N}  [#short-id]  [⚠ Retry?]       [Quick Bump] {p/t} [TIMER] │
│ ──────────────────────────────────── progress bar ──────│
│                                                          │
│ 🥩 MEATS                              (total weight)g   │
│  Item name  [REFILL/WEIGHING/READY badge]    [▽] [  ✓  ]│
│  ──── (expanded: [RETURN] [SOLD OUT] buttons below) ────│
│                                                          │
│ 🍜 DISHES & DRINKS                                      │
│  Item name  [qty badge]  [COOKING badge]    [▽] [  ✓  ] │
│  ──── (expanded: [RETURN] [SOLD OUT] buttons below) ────│
│                                                          │
│ 🎸 SIDE REQUESTS                                        │
│  Item name  [qty badge]              [▽] [  ✓  ]        │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │              ALL DONE ✓  (56px height)              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
  min-width: 280px — grid fills available space
```

### Stock Inventory Page (as Kitchen)
```
+--sidebar--+─── Stock Management ───────────────────────+
|[Kitchen]  | ALTA CITTA (TAGBILARAN)                     |
|[Stock]    |─────────────────────────────────────────────|
|           | Inventory | Deliveries 1 | Transfers        |
|           | Counts 1  | Waste Log                       |
|─────────  |─────────────────────────────────────────────|
|[P]Logout  | [Total 93] [OK 93] [Low 0] [Critical 0]     |
|           | [🔍 Search…]  [Expand All] [Collapse All]   |
|           | [List] [Grid]                               |
|           |─────────────────────────────────────────────|
|           | Item↑  | Category | Stock Level | Qty | Status | (actions)|
|           | Beef  (5 items)  27.8k Total    ← collapsed group row    |
|           |  Beef Bone-In  Meats  ████████ 100%  9,500g  Well-Stocked |
|           |  ...                                         |
+--sidebar--+─────────────────────────────────────────────+
NOTE: Actions column is EMPTY for kitchen role (read-only)
```

### Waste Log Page (as Kitchen)
```
+--sidebar--+─── Stock Management > Waste Log ──────────+
|           | ALTA CITTA (TAGBILARAN)                    |
|           |────────────────────────────────────────────|
|           | Stats: [153 Total Today] [Pork Bones Top]  |
|           |        [Most Common: Unusable (damaged)]   |
|           |────────────────────────────────────────────|
|           | Today's Waste Log                [Log Waste] ← ACCESSIBLE |
|           |────────────────────────────────────────────|
|           | Item | Qty | Reason | By | Time             |
|           | Pork Bones | 150g | Trimming | Maria S. | 12:17AM |
|           | Steamed Rice | 2 | Overcooked | Pedro C. | 02:17AM |
+--sidebar--+────────────────────────────────────────────+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | PASS | Empty state: 2 actions (UNDO + History). Active state per item: 2 choices (serve ✓ or expand → RETURN/SOLD OUT). Low cognitive load per decision point. | No change needed. |
| 2 | **Miller's Law** (chunking) | PASS | Ticket items are grouped into 3 clear sections: 🥩 MEATS / 🍜 DISHES & DRINKS / 🎸 SIDE REQUESTS. Category labels use uppercase + color + emoji to separate groups visually. | CONCERN: In source code, `grouped.extras` (SIDE REQUESTS) is always empty array — refills appear under MEATS section without a separate section. Grouping incomplete. |
| 3 | **Fitts's Law** (target size/distance) | CONCERN | ✓ serve button: 48px height (w-12 h-12), adequate. Quick Bump: `min-height: 32px` — falls below 44px minimum. ALL DONE button: 56px, excellent. Item expand zone (tap to expand): no explicit min-height — may be under 44px on long item names. | Raise Quick Bump to min-height: 44px. Ensure item row has min-height: 44px. |
| 4 | **Jakob's Law** (conventions) | PASS | Card-based KDS matches conventional kitchen display systems. Oldest ticket first order matches how cooks think. Bump button on right edge (standard KDS position). | No change needed. |
| 5 | **Doherty Threshold** (response time) | PASS | RxDB writes are local-first (instant). `active:scale-95` on buttons gives tactile feedback. Live timer updates every 1s. Audio notification on new ticket. | CONCERN: No visual flash/alert when new ticket arrives — `animate-pulse` on the card for 3s only. In a noisy kitchen, this may be insufficient. |
| 6 | **Visibility of System Status** | CONCERN | "Live ●" badge shows KDS is connected. Timer shows age. Urgency color changes at 5m (yellow) and 10m (red). Progress bar shows served/total. HOWEVER: no "active ticket count" shown in the header when queue has items. Must look at all cards to count. | Add a "N tickets · M items" summary line when queue is non-empty. |
| 7 | **Gestalt: Proximity** | PASS | Item name + status badges + ✓ button are tightly grouped within each row. Section headers (MEATS, DISHES) clearly belong to their item lists. | No change needed. |
| 8 | **Gestalt: Common Region** | PASS | Each ticket is a card with clear border. Category sections within each ticket use dividers. Served items fade to 50% opacity but stay visible. | CONCERN: No visual separator between "last item" of MEATS and "first item" of DISHES & DRINKS beyond the section header — rely on label alone. |
| 9 | **Visual Hierarchy** (scale) | PASS | Table number is `text-2xl font-black` — the most prominent element on each card. ALL DONE is `text-base font-black` in a wide full-width container. Timer badge is right-aligned. | CONCERN: "Quick Bump" text is `text-xs` — too small for greasy hands at a distance. |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | Urgency badge colors: normal = bg-gray-100/text-gray-600 (adequate), warning = bg-status-yellow/text-gray-900 (see WCAG note), critical = bg-status-red/text-white (passes). The REFILL badge is amber-100/amber-800 — passes. The WEIGHING badge is blue-100/blue-600 — may fail AA for small text. | Test WEIGHING badge contrast. Yellow timer bg (warning state) needs text-gray-900 not text-white. |
| 11 | **WCAG: Color Contrast** | CONCERN | status-yellow (F59E0B) on any bg fails AA for small text per Design Bible. Timer badge at warning state uses `bg-status-yellow text-gray-900` — technically passes large text but timer is `text-sm`. Red urgency: `bg-status-red text-white` at 4.0:1 — passes large text. | Timer text at warning state should be at minimum `text-sm font-bold` (currently correct) or bumped to `text-base`. |
| 12 | **WCAG: Touch Targets** | CONCERN | ✓ serve button: 48×48px ✅. ALL DONE: 56px height ✅. Quick Bump: **32px** ❌ — fails 44px minimum. Item expand zone: no explicit min-height — likely ~40px based on `py-2` padding — marginal. Header close button on refuse modal: `style="min-height: unset"` — explicitly removes the minimum. | Fix Quick Bump to 44px min-height. Remove `min-height: unset` on refuse modal close button. Add `min-height: 44px` to item rows. |
| 13 | **Consistency** (internal) | CONCERN | Serve ✓ button position: always right-aligned ✅. ALL DONE button: full-width at bottom ✅. But "Quick Bump" serves same function as "ALL DONE" with no visual hierarchy difference except size — confusing to have two buttons for "complete ticket". Toast "✕ dismiss" and "Undo" use `min-height: 32px` — inconsistent with rest of app's 44px standard. | Clarify Quick Bump vs ALL DONE: make one primary and the other secondary/ghost. |
| 14 | **Consistency** (design system) | CONCERN | Most buttons use `.btn-*` classes correctly. The ✓ serve button is custom-styled (not using `.btn-success` class) — visually consistent but architecturally not design-system-aligned. RETURN uses `btn-danger` (correct). SOLD OUT uses custom class (not btn-*). | Low priority — visual consistency is fine, just not using CSS classes. |

---

## C. "Best Day Ever" Vision

Pedro Cruz arrives at 5 PM for the Saturday dinner rush. The tablet is propped on its stand at the grill station. He taps "Pedro Cruz / Kitchen" on the login screen and is instantly on the KDS. The "Live ●" indicator glows green — it's on.

At 5:30, three tables open in rapid succession. Three ticket cards slide onto the screen, each card's border glowing green with a faint pulse. A quick sound plays once. Pedro can see at a glance: T2 came in 6 minutes ago (orange border — warning), T4 came in 2 minutes ago (white), T6 just now (white). He starts with T2. The table number is huge — `T2` in bold black. He sees "MEATS" with `🥩` and "Sliced Beef / Pork Unlimited" underneath. He fires the grill, taps ✓ next to Sliced Beef when it's plated. The item fades to half-opacity — done. He taps ALL DONE when the whole ticket is ready. The card disappears. A toast says "✓ T2 — All items served" with an Undo button. Smooth.

A refill request from T4 pops in. In the meats section, an item with a pulsing amber "REFILL" badge appears next to a cut name. Pedro knows — grab the raw meat from the cooler, bring it to the grill. He marks it served. The "REFILL" badge was clearly different from regular order items (amber vs. normal). He didn't miss it.

**But here's where the dream diverges from reality.** When Pedro glances at the inventory from his phone during a break and tries to mark Lettuce as 86'd because the crate ran out, he can't — the 86 button is completely hidden from him. He has to walk to the POS counter, interrupt Maria, and ask her to do it. Meanwhile, T8 just placed an order with Lettuce wraps. The gap costs a customer a dish.

The current KDS experience is genuinely good during a focused shift — the card layout, urgency colors, and one-tap serve buttons work well. The critical gap is the stock-to-kitchen handoff: kitchen sees real-time stock but has zero tools to signal changes back to the menu system.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | **Kitchen cannot flag items as sold out / 86'd** — `isReadonly = session.role === 'kitchen'` blocks the 86 button in InventoryTable. Kitchen is the first role to know a product is gone, but they can't signal it to POS. They must interrupt staff mid-service to update availability. This is a service-blocker that causes incorrect orders during every shift. | In `InventoryTable.svelte`, change `isReadonly` to allow `onToggle86` for kitchen role while keeping edit (pencil) readonly. Separate the "86 item" write from the "edit item details" write. | M | High |
| **P0** | **No void/cancellation alert on KDS** — When staff voids an item via `voidOrderItem`, the KDS ticket item is silently set to `cancelled` and disappears from the card. Kitchen has no notification that they should stop preparing a dish in progress. The KDS only "knows" when it re-renders and the item is gone — there's no toast, sound, or visual alert. | Add a brief toast or card flash (2s red pulse) when a ticket item transitions to `cancelled` mid-service. The existing toast system can handle this. | M | High |
| **P1** | **Quick Bump button fails 44px touch target minimum** — `min-height: 32px` is explicitly set. During a greasy-hands shift, the small button will cause misses. | Change `style="min-height: 32px"` to `style="min-height: 44px"` on the Quick Bump button in the ticket header. | S | High |
| **P1** | **Refuse modal close button has `min-height: unset`** — The ✕ close button in RefuseReasonModal.svelte explicitly removes the touch target minimum with `style="min-height: unset"`. This is easy to miss in a greasy-fingered emergency. | Remove `style="min-height: unset"` and let the base CSS apply the 44px minimum. | S | High |
| **P1** | **Refill requests not separated from regular items** — In the source, `REFILL` items appear in the MEATS group with a pulsing amber badge. However, "SIDE REQUESTS" (`grouped.extras`) is always an empty array in the groupItems function — refill sides (non-meat) would go into DISHES section with no REFILL badge because the badge is only applied to meats (`isRefill = item.notes === REFILL_NOTE && !item.weight`). This means non-meat refills (e.g. side dishes as refills) are invisible among regular dishes. | Verify and fix `groupItems` to correctly separate refill items regardless of category. Consider a dedicated REFILL section above meats when refill items exist. | M | High |
| **P1** | **No active ticket count in KDS header** — When the queue has active tickets, there's no summary showing "3 tickets · 14 items" in the header area. Kitchen must visually scan all cards to understand workload. During peak density (6+ tickets), this creates cognitive overhead. | Add a small summary badge in the header: "3 tickets · 14 items" derived from `queueOrders` and `totalItems` (already computed in the store). | S | Med |
| **P1** | **Item expand zone has no explicit min-height** — Each item row uses `px-4 py-2` padding. At `text-sm` (14px), with 8px top+bottom padding: total height is ~30px. Below the 44px minimum. In a busy kitchen with oily hands, tapping to expand an item for the RETURN/SOLD OUT actions will have a high miss rate. | Add `style="min-height: 44px"` to each item row `<div>` in the ticket card. | S | High |
| **P1** | **Stock inventory page is fully read-only for kitchen** — Beyond the 86 button issue (P0), kitchen cannot adjust quantities, log adjustments, or access any write action on the inventory page. The only write action available is the Waste Log. This is partially intentional but means kitchen can't even see which items are approaching critical without management access. Recommend at minimum showing the Critical/Low filter as an easy alert. | Consider adding a "Kitchen Alert" quick-filter on inventory for kitchen role — read-only but shows only Critical + Low items. | S | Med |
| **P2** | **No "new ticket arrived" persistent visual indicator** — New tickets pulse for 3 seconds via `animate-pulse`. After 3 seconds, the new ticket looks identical to existing tickets. If kitchen was looking away (common at a grill station), they may not notice a new ticket for minutes. | Keep the pulse but add a persistent "NEW" badge on tickets younger than 60s. The badge can use amber background. | S | Med |
| **P2** | **Sound plays once but no volume control** — `new-order.wav` plays at 0.7 volume. In a loud kitchen this may be inaudible. No in-app volume control exists. | Add a simple volume slider in the KDS header, persisted to localStorage. | M | Med |
| **P2** | **Quick Bump and ALL DONE serve identical functions** — Two "complete this ticket" buttons exist: "Quick Bump" (small, header) and "ALL DONE ✓" (full-width, footer). This is redundant and confusing. The naming doesn't explain the difference. Both call `completeAll()`. The toast after either says "All items served". | Rename to clarify: "Quick Bump" → remove or rename to "Bump All" and style as secondary/ghost. Keep "ALL DONE" as primary. Or keep Quick Bump only in the header for fast scans and remove the duplicate. | S | Low |
| **P2** | **History modal is not scrollable on small viewports** — The history panel showed 59 entries dating back 6 days. On 768px height, many entries will be cut off. No explicit max-height or scroll container was observed in the snapshot structure. | Ensure KdsHistoryModal has `overflow-y-auto` and a `max-height: calc(100vh - 120px)`. | S | Low |
| **P2** | **Sold out / 86 on KDS has no "notify staff" feedback** — When kitchen taps SOLD OUT on a ticket item, the `handleSoldOut()` function toggles `menuItem.available`. A toast says "X marked sold out — Undo". But there's no indicator that the POS/staff was notified or that the menu item is now blocked from ordering. Kitchen has no confidence the action propagated. | Toast should explicitly say: "X marked sold out · Staff cannot order this item". The toast already exists — just update the message. | S | Med |
| **P2** | **WEIGHING badge pulsing on all active meat items** — Non-weighed meats in AYCE show "WEIGHING {timerText}" with a pulsing blue badge. During a rush with 5 tickets each showing 2-3 meats, the screen has multiple constantly-pulsing elements. This creates visual fatigue over an 8-hour shift. | Limit pulse animation to the oldest non-weighed item per ticket, or only items older than 3 minutes. | S | Low |

---

## E. Handoff Observation Report

### HANDOFF 1 — "Does kitchen see orders from POS?"
**Observed:** KDS queue was empty at time of audit (all 58-61 historical tickets had been bumped). The empty state displays correctly with stats. The code confirms tickets appear reactively via RxDB subscription (`kdsTickets.value`). When a new ticket arrives, `playNewOrderSound()` fires and `animate-pulse` runs for 3s. **Verdict: Functional, but the 3s pulse window may be missed.**

### HANDOFF 2 — "Multiple orders in rapid succession — can kitchen tell which came first?"
**Observed from code:** `activeTickets` is sorted `oldest-first` by `createdAt`. The urgency color system (white → yellow at 5m → red at 10m) further differentiates age. The timer badge in the header of each card shows the live elapsed time. **Verdict: PASS — oldest first ordering is correct and visually reinforced by urgency colors.**

### HANDOFF 3 — "Can kitchen log low stock or flag items?"
**Observed:** Kitchen CAN access `/stock/inventory` and `/stock/waste`. The waste log "Log Waste" button is accessible. However, the inventory **86 button is hidden** for kitchen (`isReadonly = true`). Kitchen cannot mark items as sold out from inventory. From the KDS, kitchen CAN use the SOLD OUT button on individual ticket items — but this requires an active ticket with that item. If lettuce runs out before any ticket contains lettuce, kitchen has no way to flag it without involving staff. **Verdict: PARTIAL — waste logging works, 86 from inventory FAILS for kitchen role.**

### HANDOFF 4 — "Are refill requests visually separated from cook orders?"
**Observed from code:** Refill items appear in the MEATS group with a pulsing amber "REFILL" badge (when `item.notes === REFILL_NOTE && !item.weight`). This is visually distinct from regular orders. However, the SIDE REQUESTS group (`grouped.extras`) is always an empty array — non-meat refills will appear in DISHES & DRINKS without a REFILL badge, mixed in with cookable dishes. **Verdict: PARTIAL PASS for meat refills (clearly badged), CONCERN for non-meat refills (invisible in DISHES group).**

### HANDOFF 5 — "When staff voids an item, does KDS update?"
**Observed from code:** `voidOrderItem()` in `orders.svelte.ts` calls `incrementalModify` on the KDS ticket, setting the item's status to `cancelled`. The KDS's `groupItems()` filters out `cancelled` items. The item silently disappears from the card. **No toast or visual alert fires on the KDS when this happens.** Kitchen has no way of knowing a void occurred unless they see the item vanish from a ticket they're actively watching. **Verdict: PARTIAL — data is correct, but UX notification is missing. Kitchen may continue preparing a voided dish.**

---

## F. Kitchen UX Raw Findings (bullet list)

**KDS Queue — Structure and Glanceability**
- Table number (`T{N}`) renders at `text-2xl font-black` — excellent readability from 2 feet away
- No ticket count in the header when queue is active — kitchen must visually count cards
- Empty state stats (Served Today, Avg Service, Last Completed) are useful shift context
- `"Live ●"` indicator is small (fixed top-right, `text-xs`) — may not be noticed from distance
- KDS page uses `repeat(auto-fill, minmax(280px, 1fr))` grid — at 1024px width, fits 3 columns comfortably
- Each ticket has a progress bar (thin 4px bar below header) — visible but very thin for a noisy environment
- Urgency thresholds: 5 min = yellow, 10 min = red — appropriate for samgyupsal service pace (typical cook time 3-5 min per batch)

**Touch Targets and One-Hand Operation**
- ✓ Serve button: 48×48px (`w-12 h-12`) — correct, tappable one-handed
- ALL DONE button: 56px height, full width — excellent as primary CTA
- Quick Bump button: **32px height** — fails 44px minimum, will cause misses with greasy hands
- Item expand zone: no explicit min-height, estimated ~30px at default padding — likely below 44px
- Refuse modal ✕ close: `style="min-height: unset"` — touch target removed explicitly
- Refuse modal preset reason buttons: `min-height: 56px` — excellent

**Urgency and Priority Signals**
- Timer badge color changes at 5m and 10m — visual only, no additional audio
- `animate-pulse` on cards for 3 seconds after creation — **easy to miss if kitchen looks away**
- No persistent "new" indicator after 3s pulse expires
- Border pulse animation (`animate-border-pulse-red`) at critical state — visible but relies on border animation which may not be salient in bright light
- No "oldest ticket first" label — order is correct (oldest first) but not labeled

**Refill Visibility (S06)**
- Refill meats: amber "REFILL" badge with `animate-pulse` — clearly differentiated
- No separate SIDE REQUESTS section despite code having `grouped.extras` — always empty array
- Non-meat refill items would appear in DISHES without any REFILL badge

**Stock Access Friction (S05/S09)**
- Kitchen can navigate to `/stock/inventory` via sidebar — 1 tap from KDS
- Kitchen can read full inventory table — no restriction on viewing
- Kitchen CANNOT use 86 button — `isReadonly = session.role === 'kitchen'` in InventoryTable
- Kitchen CANNOT edit any stock item — same `isReadonly` restriction
- Kitchen CAN log waste — WasteLog has no kitchen role restriction
- Kitchen CAN use SOLD OUT button on KDS items — but only when an active ticket contains that item
- Gap: lettuce runs out before any ticket has lettuce → kitchen has no flagging mechanism

**Void Handling (S10)**
- Voided items are correctly set to `cancelled` status in KDS tickets
- Cancelled items are correctly filtered from KDS card display
- **No toast, sound, or visual alert fires on KDS when an item is voided from POS**
- Kitchen may continue preparing a voided dish until they notice the item is gone

**Refuse/Return Flow (S13)**
- RETURN button accessible via expand → tap item row → item actions appear
- Tap count to refuse: 2 taps (expand row, then RETURN button) — acceptable
- Refuse modal has 4 preset reasons + "Other..." — fast selection
- Modal preset buttons are 56px height — excellent touch targets
- After refusing: toast says "✓ Return flagged — Alert sent to T{N}" — kitchen gets confirmation
- Modal close button explicitly removes min-height — touch failure risk

**Noise Tolerance**
- Audio notification: `new-order.wav` at 0.7 volume — no in-app volume control
- No visual flash on new ticket (only animate-pulse for 3s) — insufficient for loud grill station
- All status information is visual only — correct, no audio-only feedback

**Shift Endurance**
- Multiple `animate-pulse` elements running simultaneously on busy queue — potential eye strain
- White page background (`bg-surface #FFFFFF`) as main content area — harsher than `surface-secondary` for long shifts
- Font sizes: item names are `text-sm` — adequate but minimum acceptable from 50cm

**Navigation (Kitchen role)**
- Sidebar: Kitchen + Stock only — correctly scoped to role
- No Reports, POS, or Admin in sidebar — correct
- Sub-nav: All Orders | Order Queue | Weigh Station — 3 options, scannable
- No quick action shortcuts visible in kitchen session's sidebar (manager's expanded sidebar shows "Log Waste", "Stock Count" etc. — these are not shown to kitchen role)

---

## G. Snapshots Taken

| State | Snapshot File | Session |
|---|---|---|
| Login page | `page-2026-03-08T20-10-18-455Z.yml` | kitchen |
| KDS Queue — empty state (Pedro Cruz logged in) | `page-2026-03-08T20-13-52-152Z.yml` | run1 |
| KDS Queue — empty state (full sidebar visible) | `page-2026-03-08T20-15-27-226Z.yml` | eod2 |
| KDS Queue — empty state (alternate session) | `page-2026-03-08T20-14-57-943Z.yml` | eod2 |
| History modal — bumped ticket structure | `page-2026-03-08T20-05-38-155Z.yml` | default |
| Stock Inventory — kitchen role | `page-2026-03-08T20-15-39-782Z.yml` | eod2 |
| Waste Log — kitchen role | `page-2026-03-08T20-17-32-129Z.yml` | eod2 |

---

## Appendix: Key Source Files Reviewed

- `/src/routes/kitchen/orders/+page.svelte` — Full KDS page implementation (urgency, grouping, actions, refill detection, void handling)
- `/src/lib/components/kitchen/RefuseReasonModal.svelte` — Refuse/return flow
- `/src/lib/components/stock/InventoryTable.svelte` — `isReadonly = session.role === 'kitchen'` confirmed
- `/src/lib/components/stock/InventoryItemRow.svelte` — 86 button exists but kitchen-blocked
- `/src/lib/stores/pos/orders.svelte.ts` — void → KDS cancelled update (silent, no KDS notification)
