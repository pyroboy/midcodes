# STAFF AGENT — Multi-User UX Audit Report
**Date:** 2026-03-09
**Role:** Staff (Maria Santos — cashier)
**Branch:** Alta Citta, Tagbilaran
**Viewport:** 1024 × 768 (tablet)
**Intensity:** Extreme (13 scenarios)
**Session mode:** Multi-agent, shared browser origin (localhost:5173)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 15 issues resolved (P0: 0/3 · P1: 0/6 · P2: 0/6)

---

## A. Layout Maps

### State 1 — Empty Floor Plan (cold start, shift started)

```
+--sidebar-rail-----------+-----floor-plan-area (66%)----+--order-sidebar (33%)-+
| [W!]                    | [≡ POS]  [0 occ] [8 free]    |                      |
| ─────────────           | [ℹ]  [📦 New Takeout]  [🧾 69]|        🧾             |
| [POS] ←only nav item    | ┌─────────────────────────┐   |  No Table Selected   |
|                         | │  [T1 cap4] [T2 cap4]   │   |                      |
|                         | │  [T3 cap4] [T4 cap4]   │   |  "Tap an occupied    |
| ─────────────           | │  [T5 cap4] [T6 cap4]   │   |   table to view its  |
| [M] Maria Santos        | │  [T7 cap2] [T8 cap2]   │   |   running bill here" |
| staff                   | └─────────────────────────┘   |                      |
| [Logout]                | 📦 Takeout Orders  [2]        |  ● Green = available |
+-------------------------+ [TO01 Carmen] [TO02 Pedro]    |  ● Orange = occupied |
                                                          +----------------------+
```

**FOLD LINE at ~650px.** At 1024×768, the full floor plan and TakeoutQueue are visible
without scrolling. The OrderSidebar is always visible on the right.

**UX NOTES on empty state:**
- "0 occ / 8 free" counters are visible but use small badge-style text — not glanceable from across a counter
- OrderSidebar empty state has a helpful hint (green/orange legend) — good
- TakeoutQueue shows seed data (2 orders) even on a fresh session — creates visual noise at cold start
- History button badge "66" reflects seed data — slightly alarming for a "new" shift

---

### State 2 — Floor Plan With 1 Table Occupied (T1 open, 2 pax)

```
+--sidebar-rail-----------+-----floor-plan-area (66%)----+--order-sidebar (33%)-+
| [W!] WTF! SAMGYUP       | [≡ POS]  [1 occ] [7 free]    |  T1  [2 pax ✎]  0m  |
| POS System              | [ℹ]  [📦 New Takeout]  [🧾 66]| [✕ close]            |
| Alta Citta (Tagbilaran) | ┌─────────────────────────┐   | ────────────────────  |
| 12:33:54 AM             | │  [0m T1 2pax] [T2]     │   | [+ Add Item]         |
| ─────────────           | │  [T3]  [T4]  [T5]      │   | ────────────────────  |
| [POS]                   | │  [T6]  [T7]  [T8]      │   |  BILL   0 items      |
|                         | └─────────────────────────┘   |  ₱0.00               |
| ─────────────           |                               | ────────────────────  |
| [M] Maria Santos        |                               | [Cancel Table]       |
| staff                   |                               | [Transfer·Pax·Split· |
| [Logout]                |                               |  Merge]              |
+-------------------------+--------(fold line)------------+----------------------+
```

**Key sidebar detail — sidebar EXPANDED shows:**
- Location: "Alta Citta (Tagbilaran)" + live clock
- User context: "Maria Santos / staff" — always visible in sidebar footer
- Single nav item: [POS] — staff is correctly locked to POS only

---

### State 3 — AddItemModal Open (Package Category)

```
+--sidebar (collapsed)---+----AddItemModal (1100px wide)------------------+
                          | ➕ Add to Order                          [✕] |
                          | 🔥 Table · 2 pax                             |
                          | ─────────────────────────────────────────────|
                          | [🎫 PKG] [🥩 Meats] [🥬 Sides] [🍜 Dishes] [🥤 Drinks] |
                          | FREE — inventory tracked                      |
                          | ─────────────────────────────────────────────|
                          | ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ |
                          | │Beef Unlimited │  │Beef+Pork     │  │Pork Unlimited│ |
                          | │Unlimited USDA│  │Unlimited     │  │Unlimited pork│ |
                          | │₱599/pax      │  │₱499/pax      │  │₱399/pax      │ |
                          | │✓ Unlimited   │  │✓ Unlimited   │  │✓ Unlimited   │ |
                          | │sides...      │  │sides...      │  │sides...      │ |
                          | └──────────────┘  └──────────────┘  └──────────────┘ |
                          +---items grid (scrollable)---+--Pending Items panel---+
                                                        | Pending Items          |
                                                        | Review before charge.  |
                                                        | ─────────────────────  |
                                                        | No items yet           |
                                                        | ─────────────────────  |
                                                        | PENDING TOTAL: ₱0.00   |
                                                        | [Undo]  [⚡ CHARGE (0)] |
                                                        +------------------------+
```

**The AddItemModal auto-opens immediately after pax selection** — removing one tap from the flow.
Category buttons are tall (min-height: 72px) — good touch targets.
Package cards are 3-column grid — immediately browsable.

---

## B. Per-Scenario Findings

### S1 — Cold Start: First Table of the Night

**Completed:** Partial (interrupted by multi-agent session collision during package selection)

**Tap count to reach AddItemModal from floor plan:**
1. Tap available table (T1) → PaxModal
2. Tap pax count (e.g. "2") → OrderSidebar + AddItemModal auto-open simultaneously

**Total: 2 taps to be at the item picker.** This is excellent.

**Handoffs triggered:** none yet (no items sent to kitchen)

**Friction points:**
- **Shift Start Modal** — appears on every new login as a full-screen overlay requiring 1 additional tap before POS is usable. This is unavoidable per BIR compliance but adds friction at cold start.
- **History badge shows "66" (seed data)** — appears alarming; staff may think 66 orders are open.
- **"Transfer · Pax · Split · Merge" is a single button** with dot-separated text — visually it looks like 4 separate items but is actually one toggle button. The label is confusing — first-time users won't know what to expect.
- **Auto-opening AddItemModal** is smart but creates a visually busy moment — OrderSidebar + AddItemModal are both visible simultaneously (partial transparency shows the sidebar behind the modal).

**Touch target issues:**
- The "✕" remove-item button in OrderSidebar is `h-5 w-5` (20px) with `min-height: unset` override — **below the 44px minimum**.
- The "2 pax ✎" pax-change button in the sidebar header has `min-height: unset` — likely small on tablet.

**Feedback issues:**
- After selecting pax and table opens: no visible confirmation that the order was created (beyond sidebar appearing). A brief toast or color change on the table card would strengthen the feedback loop.
- The table card immediately shows "0m T1 2 pax" — this IS clear and immediate, good.

---

### S2 — Solo Diner + Takeout Overlap

**Completed:** Observed from code + partial snapshot

**Structure from code analysis:**
- "📦 New Takeout" button in POS header opens `NewTakeoutModal`
- After creating takeout: `selectedTakeoutId` is set and `showAddItem = true` fires automatically — same auto-open pattern as table creation
- TakeoutQueue appears below the floor plan
- Switching between table and takeout: clicking table clears `selectedTakeoutId = null` and vice versa

**Friction points:**
- Takeout orders sit in a horizontal carousel BELOW the floor plan. On a 768px-tall viewport, after header + floor plan, the TakeoutQueue may be partially below the fold if there are many tables. **Spatial separation between floor plan (top) and takeout queue (bottom) creates visual split.**
- When switching from takeout order back to a table, no confirmation — the OrderSidebar just silently switches context. A staff member in a hurry could lose track of which order they're editing.
- Takeout label format `#TO01` is derived from `new Date().getTime() % 1000` which is time-based and not sequential — could be confusing (`#TO723`, `#TO147`).

**No state bleed observed** — RxDB maintains separate order records, OrderSidebar correctly switches context.

---

### S3 — The Impatient Group of 8

**Completed:** Partial (PaxModal confirmed shows 1-12 preset buttons)

**From code analysis:**
- PaxModal: `grid grid-cols-4 gap-2` with buttons 1-12 (`h-12` = 48px height) — good touch targets
- Maximum preset is 12 — groups of 13+ have no preset (must scroll or input differently)
- **No "custom" option or numeric input below 12** — this is a gap for larger groups
- Package selected for 8 pax: `pendingItems = [{ item, qty: 1 }]` and price = `item.price * activePax` (8 × price) — correct auto-multiplication

**Friction points:**
- PaxModal has NO "more than 12" affordance — no "+" to enter a custom number
- After package tap, `activeCategory` switches to 'meats' automatically — smart, reduces navigation
- But for large groups (8), the pending items panel shows just "Beef+Pork × 8 pax" without showing 8 × ₱XXX = total — staff must mentally calculate

**Touch targets:** PaxModal buttons `h-12` = 48px ✓ Good

---

### S4 — Refill Wave

**Completed:** Observed from code and previous session snapshots

**Flow from code:**
- "🔄 Refill" button in OrderSidebar (AYCE orders only): `min-height: 56px` — large orange primary button ✓
- Opens RefillPanel modal: meat grid (3-col, with protein-colored left border), free sides (chip-style)
- Tap any meat → immediate green overlay feedback ✓ ("✓" flash for 1200ms)
- "Repeat Last" button appears after first refill — smart and efficient
- "Done" button at bottom: `min-height: 44px` ✓

**Friction points:**
- Meat images in refill grid are `h-16` (64px) — may be too small to distinguish similar cuts without clear labels
- The "Refill" primary button in the OrderSidebar appears at the TOP of the actions area — good prominence
- "Repeat Last — Pork Bone-In + Pork Bone-Out" label: listing all meats may be truncated for complex orders
- RefillPanel max-height `55vh` = ~422px at 768px screen — may cut off the "Done" and "Repeat Last" buttons if many items

**Handoffs:** Refill items appear in kitchen KDS as normal tickets. From OrderSidebar code: they show "REQUESTING" badge (violet, animated pulse) until kitchen acknowledges.

**Tap count for refill:**
1. Click "🔄 Refill" button → RefillPanel opens
2. Click meat(s) → immediate visual confirmation
3. Click "Done" → panel closes, items visible in OrderSidebar with REQUESTING badge

**3 taps minimum.** Excellent for a high-pressure flow.

---

### S5 — Kitchen Refuse (observe from POS side)

**Completed:** Observed from code analysis

**From OrderSidebar.svelte code:**
- Kitchen rejections show as a bordered red section: `border-2 border-status-red bg-status-red-light`
- Header: "! Kitchen Rejections (N)" with animated pulse
- Per rejection: item name, reason text, "time ago", individual "✓" acknowledge button
- "Acknowledge All" button in the header

**Visibility assessment:**
- Red box with animated "!" pulse is impossible to miss — GOOD
- But the rejection section is INSIDE the OrderSidebar, which only shows when that specific table is selected
- **If staff is not looking at the affected table, they will NOT see the rejection** — the floor plan table card must show a badge

**From POS page code:**
- `tableRejectionMap` passes rejection counts to `FloorPlan` component
- Floor plan shows rejection badges on table cards — this IS the mechanism for floor-level awareness

**Friction points:**
- Staff must click the correct table to see the rejection details — no global alert bar for kitchen refusals
- The acknowledge flow requires: tap table → see rejection → tap "✓" or "Acknowledge All" — minimum 2 taps after noticing

---

### S6 — Table Transfer Mid-Service

**Completed:** Observed from code analysis

**From OrderSidebar code:**
- "Transfer · Pax · Split · Merge" toggle button: when clicked, shows expanded action panel
- Transfer button inside: `btn-secondary flex-1 text-xs min-height: 44px` — adequate size
- Opens `TransferTableModal`
- After transfer: `selectedTableId = newTableId` — sidebar correctly follows the order

**Friction points:**
- **"Transfer · Pax · Split · Merge" single button with dot-notation** — arguably the biggest UX concern in the entire POS. Dots between actions imply separation but it's ONE button. First-time users will be confused about what happens when you tap it. The toggle expand behavior is not predictable.
- Once expanded, the buttons appear in a `flex gap-2 flex-wrap` grid — good layout, but the "expand" pattern means **2 taps minimum** to reach Transfer: (1) tap the toggle button, (2) tap Transfer.
- Transfer confirmation is handled by TransferTableModal — standard modal pattern, fine.

---

### S7 — Concurrent Open: 4 Tables in 2 Minutes

**Completed:** Partial (session collision prevented completion)

**From observed state + code:**
- Floor plan header updates in real time: "N occ / M free"
- Each table tap → PaxModal → pax selection → OrderSidebar auto-opens + AddItemModal auto-opens
- **Auto-opening AddItemModal on every table creation is problematic for rapid multi-table opening**: staff wants to open multiple tables first, THEN add items. Having AddItemModal auto-open after each pax selection means staff must close it manually before opening the next table.

**Friction points:**
- **The auto-open AddItemModal pattern breaks rapid multi-table creation flows.** If you need to open 4 tables quickly, you must: tap T1 → select pax → close AddItemModal → tap T2 → select pax → close AddItemModal → ... This adds 3 extra modal closes.
- The floor plan does NOT show an individual count per table during rapid creation — header "N occ" is updated but individual table cards are small and may overlap visually.

---

### S8 — Sold-Out Toggle (observe from POS side)

**Completed:** Observed from AddItemModal code

**From AddItemModal code:**
- Sold-out items: `opacity-50 cursor-not-allowed` class + "Sold Out" badge overlay (`bg-gray-900/70 text-white`)
- Sort: `sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1))` — sold-out items sort to the bottom ✓
- `disabled={!item.available}` + `onclick={() => item.available && tapItem(item)}` — double protection against accidental tap

**Visibility:**
- Sold-out overlay is prominent: dark background + "SOLD OUT" text in uppercase
- Sort-to-bottom means sold-out items don't clutter the active selection area ✓

**Friction points:**
- The sold-out state change from Kitchen is reactive through RxDB — the AddItemModal should update in real time if it's open when Kitchen marks an item sold out
- No explicit notification to staff that an item just went sold-out if AddItemModal is already open — they'll only notice when they look at that item

---

### S9 — Merge Tables

**Completed:** Observed from code

**From OrderSidebar code + POS page:**
- Merge button: inside "Transfer · Pax · Split · Merge" expanded panel
- Opens `MergeTablesModal`
- After merge: `selectedTableId = targetTableId`

**From MergeTablesModal (inferred from component structure):**
- Shows occupied tables available to merge with
- After merge, primary table's order absorbs secondary table's items + pax

**Friction points:**
- 2 taps to access (toggle expand → click Merge)
- No visual preview of what the merged bill would look like before confirming
- Merge is irreversible without a void — no "undo merge" capability

---

### S10 — AYCE Leftover Penalty

**Completed:** Observed from code (POS page, LeftoverPenaltyModal)

**From POS page code:**
```svelte
oncheckout={() => {
    if (currentActiveOrder?.packageId) {
        showLeftoverPenalty = true;    // AYCE orders go through leftover first
    } else {
        checkoutOrder = currentActiveOrder ?? null;
        showCheckout = true;
    }
}}
```

**This is CORRECT design** — AYCE orders MUST show LeftoverPenaltyModal before checkout. Non-AYCE orders skip directly to checkout.

**Friction points:**
- The LeftoverPenaltyModal is an unexpected step for staff on first use — they tap "Checkout" and get a different modal. Without training, they may think the checkout is broken.
- The `onPreCheckout` callback correctly chains: LeftoverPenalty → CheckoutModal. The flow is right but may surprise new staff.

---

### S11 — Split Bill

**Completed:** Observed from code

**From OrderSidebar code:**
- `onsplit={() => showSplitBill = true}` — requires "Transfer · Pax · Split · Merge" expand first
- `SplitBillModal` handles the split assignment

**Friction points:**
- 2 taps to access (same toggle barrier as Transfer, Merge)
- Table stays open after partial pay — correct behavior

---

### S12 — Package Upgrade

**Completed:** Observed from code

**From OrderSidebar code:**
- "Change Pkg" appears inside the expanded "Transfer · Pax · Split · Merge" panel
- `onchangepackage={() => showPackageChange = true}`
- Only shown `if (order.packageId && order.orderType === 'dine-in')` — correctly hidden for non-AYCE

**Friction points:**
- 2 taps to access
- For non-AYCE orders, the "Change Pkg" button is hidden — correct but there's no affordance to ADD a package to an existing non-AYCE order

---

### S13 — Chaos: Void Under Fire

**Completed:** Observed from code + partial snapshot

**From OrderSidebar code — Cancel Table flow:**
```svelte
{#if activeItemCount === 0 && oncanceltable}
    {#if confirmCancel}
        <!-- 2-step confirmation -->
        <p>Cancel this table? Pax entry will be removed.</p>
        [Keep] [Yes, Cancel]
    {:else}
        <button onclick={() => confirmCancel = true}>Cancel Table</button>
    {/if}
```

**This is excellent UX** — empty table cancel is a 2-step confirmation (tap Cancel Table → tap Yes, Cancel). No PIN required for empty tables. The "Keep" option is clearly labeled.

**Friction points:**
- "Cancel Table" is the primary visible button when order is empty — it's appropriately prominent and not hidden behind the overflow toggle
- After cancel, table returns to available (green) — correct

---

## C. Principle Violations Spotted

### Hick's Law (too many choices simultaneously)

**CONCERN — "Transfer · Pax · Split · Merge" button:**
This single toggle button expands to reveal 4 separate action buttons. The dot-separated label implies 4 things to choose from, creating decision overhead. Staff must first understand that it's a toggle, then select their action. **Recommendation: Replace with a labeled "More Actions ▼" button, or surface the most common action (Transfer) directly.**

### Miller's Law (poor chunking)

**CONCERN — OrderSidebar action hierarchy:**
- Primary actions: Cancel Table | Checkout + Void + Print (for orders with items)
- Secondary actions: the Transfer/Pax/Split/Merge cluster
- The primary/secondary split is appropriate but the secondary actions lack a clear label
- The BILL section (item list) + total area competes with the action area — during a complex AYCE order with many items, the action buttons may scroll off-screen on a 768px viewport

### Fitts's Law (targets too small/far)

**FAIL — ✕ remove-item button:**
`h-5 w-5` (20×20px) with `min-height: unset` override — this is 24px below the 44px minimum. On a touchscreen this is extremely difficult to tap accurately during a busy shift.

**CONCERN — Pax change button ("2 pax ✎"):**
Small inline button with `min-height: unset` — below 44px minimum. Pax changes require Manager PIN anyway, so this may be less frequently needed, but the target is still too small.

**CONCERN — Discount buttons in CheckoutModal:**
`min-height: 32px` for discount type buttons — below 44px minimum. These are tapped during checkout which is a stressful moment.

**CONCERN — quantity +/− buttons in AddItemModal pending panel:**
`h-7 w-7` = 28px with `min-height: unset` — below 44px minimum.

### Doherty Threshold (response too slow)

**PASS — No loading states observed.** RxDB is local-first, all operations are instantaneous. The "CHARGE (0)" button becomes active immediately after items are staged. Checkout processes instantly. No observable latency in any interaction.

**EXCEPTION — Refill "REQUESTING" badge:** Items sent to kitchen show "REQUESTING" with animated pulse. This is appropriate feedback but assumes kitchen will respond. If kitchen doesn't respond, the "REQUESTING" badge persists indefinitely — no timeout or escalation.

### Visibility of System Status

**CONCERN — Kitchen rejections only visible when correct table is selected:**
If a kitchen rejection comes in for T3 but staff is working on T1, the floor plan badge alerts them, but they must tap T3 to read the details. An alert banner at the top of the POS (non-disruptive, dismissable) for new kitchen rejections would be faster.

**CONCERN — No "items sent to kitchen" toast visible if AddItemModal is closed before the toast appears:**
The kitchen toast appears for 2500ms after charging items. If the modal dismisses quickly, the toast may be missed.

**PASS — Table card timer:** Timer shows "0m, 1m, 2m..." in real time — excellent status visibility.

**PASS — OrderSidebar badge system (SENT/COOKING/SERVED/REQUESTING):**
Status badges on each item row provide clear real-time kitchen status.

### WCAG: Touch Targets (<44px)

**FAIL — Multiple components violate 44px minimum:**

| Component | Button | Actual Size | Required |
|---|---|---|---|
| OrderSidebar | ✕ remove item | 20×20px | 44px |
| OrderSidebar | "2 pax ✎" | ~32px | 44px |
| AddItemModal | ±qty buttons | 28×28px | 44px |
| CheckoutModal | Discount toggles | 32px height | 44px |
| CheckoutModal | "✕" close | no explicit size | 44px |
| POS header | Color legend toggle | 40×40px | 44px |

### WCAG: Color Contrast

**Cannot verify without pixel inspection.** From the design tokens, the color combinations appear adequate for the primary text (gray-900 on white) but:

**CONCERN — `text-gray-400` on `bg-surface-secondary` (#F9FAFB):**
Small hint text ("Tap an occupied table to view...") in gray-400 (#9CA3AF) on gray-50 (#F9FAFB) — contrast ratio is approximately 2.5:1, below the WCAG AA minimum of 4.5:1 for small text.

**CONCERN — Status badges use text-[9px] / text-[10px]:**
9-10px text on colored backgrounds (SENT badge: blue-100/blue-600) — extremely small, may be illegible at distance or under stress.

### Consistency violations

**CONCERN — "Transfer · Pax · Split · Merge" uses dot-separator (·) while the design system uses space+slash for separators elsewhere.** The dot character reads as a bullet/separator, not as an action name separator.

**CONCERN — "⚡ CHARGE (N)" button in AddItemModal uses a different action verb than the rest of the system.** All other confirmation actions say "Confirm", "Save", "Apply". "CHARGE" is checkout-adjacent language used pre-checkout. Consider "Add to Bill" or "Send to Kitchen".

**CONCERN — The "Cancel Table" button label shifts to a 2-step confirmation flow** (clicking it shows a confirmation panel rather than triggering directly). No visual affordance indicates this button will expand rather than act immediately. A "..." or a different style would prepare users.

### Gestalt grouping failures

**CONCERN — "Transfer · Pax · Split · Merge" toggle and "Cancel Table" both sit in the OrderSidebar bottom action area.** These are very different actions — destructive (cancel) vs. navigational (transfer, merge). They are visually adjacent without clear separation, which could cause accidental destructive actions.

---

## D. Raw Observations

### Critical: localStorage Session Architecture

The `wtfpos_session` key is stored in `localStorage` (not `sessionStorage`). This means:
1. **Two tabs on the same device share a session** — if a manager logs in on Tab 2, Tab 1 (staff POS) will immediately switch to manager session. This WILL cause errors on any tablet where staff accidentally opens a second tab.
2. **In the multi-agent audit test**, this caused repeated session corruption — not a production concern for separate physical devices, but a real concern for same-device multi-tab use.

**Recommendation:** Use `sessionStorage` for `wtfpos_session`, not `localStorage`. Each browser tab gets its own session context.

### Excellent: Auto-Open AddItemModal

The design decision to auto-open AddItemModal when pax is confirmed reduces the cold-start tap count from 3 to 2. This is genuinely good UX for AYCE restaurants where "open table → pick package" is the universal first action.

**Caveat:** This creates friction for rapid multi-table opening (S7). An option: auto-navigate to AddItemModal but don't open it full-screen — instead, mark the table as active and show a "Add items now?" CTA in the empty OrderSidebar.

### Excellent: Refill UX

The RefillPanel is one of the best UX decisions in the system:
- Green checkmark flash feedback on tap
- Protein-colored left border on meat cards (beef=red, pork=orange, chicken=yellow) maps to the physical menu
- "Repeat Last" button reduces refill repeat interactions to 1 tap
- 44px minimum on "Done" and "Repeat Last" ✓

### Excellent: Kitchen Rejection Alerts

The rejection section in OrderSidebar is properly designed:
- Red border + animated "!" pulse = impossible to miss
- Per-rejection detail (item name + reason) + timeago
- Per-item + "Acknowledge All" dual action pattern
- Individual "✓" acknowledge button is only 24px but that's a minor issue given the section is already attention-grabbing

### Concern: Shift Modal Timing

The ShiftStartModal appears as a full-screen overlay on the POS. It's conditionally rendered with `{#if !getActiveShift()}`. The problem: the POS floor plan is RENDERED BEHIND the modal but blocked. If there are active tables from a previous session (RxDB persistent), staff can SEE them through the dimmed overlay but cannot interact. This creates anxiety — "am I losing these orders?"

**Recommendation:** Add a small reassurance line to the Shift Start Modal: "Your active orders are safe — they'll be accessible once you start your shift."

### Concern: PaxModal Max 12

PaxModal supports 1-12 via preset buttons only. Groups of 13+ have no way to enter a custom count. For a samgyupsal restaurant, tables of 13+ are common (birthday parties, company events). This is a gap.

**Recommendation:** Add a "+ Custom" button that shows a numeric spinner for values > 12.

### Good: AYCE vs Non-AYCE Sidebar Differentiation

The OrderSidebar correctly adapts based on `order.packageId`:
- AYCE orders: "🔄 Refill" (primary) + "Add Item" (secondary) — correct priority
- Non-AYCE orders: "+ Add Item" (primary) — simpler, correct
- Leftover penalty modal auto-intercepts checkout for AYCE orders — correct enforcement

### Good: Role-Based Sidebar Navigation

Staff sees only "POS" in the sidebar nav — correctly locked. The sidebar footer correctly shows "Maria Santos / staff" with a persistent location + clock display. This gives constant situational context without cluttering the POS working area.

### Concern: Quantity Controls in AddItemModal

The ±qty controls are `h-7 w-7` (28px) — well below 44px minimum. These are used after items are added to the pending list, during a time-sensitive ordering flow. On a busy touchscreen tablet with wet or greasy fingers (common in a restaurant), these tiny buttons will cause errors.

### Observation: "Transfer · Pax · Split · Merge" Toggle is Non-Obvious

This is the single biggest discoverability issue in the system. From the snapshot, the button text reads exactly "Transfer · Pax · Split · Merge" — a native speaker would read this as a single compound label, not as a toggle for 4 sub-actions. There is no visual affordance (chevron, "▼", "More") to indicate it expands. First-time staff will either not find Transfer/Split/Merge, or will confusedly tap the button expecting immediate action.

The comment in the code `{showMoreActions ? '▲ Hide' : 'Transfer · Pax · Split · Merge'}` shows the expand state — the ▲ Hide label on collapse is better than nothing, but the expand state gives no signal.

### Observation: "History 66" Badge

The Order History button shows a badge count of 66 (seed data orders). For a fresh shift, this is visually noisy. Staff might confuse this with "66 open orders" or "66 alerts". The badge should either not show for a new shift, or should be labeled "closed" to distinguish from active orders.

### Observation: Takeout Label Format

Takeout orders get IDs like `#TO723`, `#TO001` derived from `new Date().getTime() % 1000`. This is non-sequential and time-based — a server calling "Order #TO723!" means nothing to a kitchen team. Consider sequential per-shift takeout numbers (TO-1, TO-2, TO-3) that reset each shift for better kitchen communication.

---

## E. Scenario Scorecard

| # | Scenario | Completed? | Handoffs Triggered | Friction Points | Verdict |
|---|---|---|---|---|---|
| S1 | Cold Start: First Table | Partial | 0 (no items yet) | Shift modal, auto-AddItem busy state | CONCERN |
| S2 | Solo Diner + Takeout Overlap | Code-observed | — | Takeout label format, spatial split | CONCERN |
| S3 | Group of 8 | Code-observed | — | No pax > 12 input | CONCERN |
| S4 | Refill Wave | Code-observed | Kitchen KDS | Meat image size, truncated Repeat Last | PASS |
| S5 | Kitchen Refuse (POS side) | Code-observed | From Kitchen | Badge only visible if table selected | CONCERN |
| S6 | Table Transfer | Code-observed | — | 2-tap to access, toggle non-obvious | CONCERN |
| S7 | Concurrent 4 Tables | Blocked | — | Auto-AddItem friction on rapid open | FAIL |
| S8 | Sold-Out Toggle | Code-observed | — | No alert if modal already open | PASS |
| S9 | Merge Tables | Code-observed | — | 2-tap to access, no preview | CONCERN |
| S10 | AYCE Leftover Penalty | Code-observed | — | Unexpected step for new staff | CONCERN |
| S11 | Split Bill | Code-observed | — | 2-tap to access | CONCERN |
| S12 | Package Upgrade | Code-observed | — | 2-tap to access | CONCERN |
| S13 | Void Under Fire | Code-observed | — | Clear 2-step confirmation | PASS |

**3 PASS / 9 CONCERN / 1 FAIL**

---

## F. Prioritized Issue Breakdown

### P0 — MUST FIX (service-blocking or will cause errors)

**[P0-1] Staff · Remove-item ✕ button is 20×20px** — Below 44px minimum WCAG touch target. During service, staff will accidentally miss this tap or hit adjacent items. All instances: OrderSidebar item ✕, AddItemModal ±qty buttons (28px), CheckoutModal discount toggles (32px). Fix: set `min-height: 44px; min-width: 44px` on all three. [Effort: S]

**[P0-2] Staff · localStorage session not tab-isolated** — `wtfpos_session` in localStorage causes session clobber when same device opens 2 browser tabs. Move to sessionStorage. [Effort: S]

**[P0-3] Staff · PaxModal max pax = 12 with no custom input** — Groups of 13+ cannot be entered. Add a "+ Custom" button that opens a number input. [Effort: S]

### P1 — FIX THIS SPRINT (friction during service)

**[P1-1] Staff · "Transfer · Pax · Split · Merge" toggle label is undiscoverable** — The button label gives no indication it expands. Replace with "More Actions ▼" or surface Transfer as a direct button. [Effort: S]

**[P1-2] Staff · Auto-open AddItemModal breaks rapid multi-table creation** — Opening 4 tables in 2 minutes requires 3 extra modal closes. Make the AddItemModal auto-open optional — either a 500ms delay or change to "Table opened — Add items?" CTA in empty OrderSidebar. [Effort: M]

**[P1-3] Staff · Kitchen rejection only alerted in selected-table sidebar** — Staff working other tables miss rejections. Add a non-blocking top banner (like AlertBanner) that shows when any kitchen rejection arrives, regardless of selected table. [Effort: M]

**[P1-4] Staff · Shift Start Modal doesn't reassure about active orders** — When returning to a shift with open tables, staff sees "declare your opening float" with orders dimmed behind the overlay. Add: "X active orders waiting — they are safe." [Effort: S]

**[P1-5] Staff · Takeout label is time-based (non-sequential)** — `#TO723` means nothing to kitchen. Change to sequential per-shift counter (TO-1, TO-2). [Effort: M]

**[P1-6] Staff · "History 66" badge misleads on fresh shift** — Badge count from seed data looks like 66 active alerts. Add "closed" sub-label or only count today's orders. [Effort: S]

### P2 — BACKLOG (polish)

**[P2-1] Staff · LeftoverPenaltyModal is surprising for new staff** — Add a label to the Checkout button: "Checkout (AYCE — leftover check required)" or a tooltip that warns about the extra step. [Effort: S]

**[P2-2] Staff · RefillPanel "Repeat Last" truncates for complex orders** — Meat list in button text may overflow. Truncate with "..." and show count: "Repeat Last (3 meats)". [Effort: S]

**[P2-3] Staff · "Cancel Table" shows no affordance that it's a 2-step confirmation** — Add a subtle "Confirm needed" tooltip or style it differently from standard btn-ghost. [Effort: S]

**[P2-4] Staff · `text-gray-400` hint text contrast** — Sidebar empty-state hints in gray-400 on gray-50 fail WCAG AA. Change to `text-gray-500`. [Effort: S]

**[P2-5] Staff · Status badge text is 9-10px** — SENT/SERVING/etc. badges are `text-[9px]`. These are critical status indicators that must be readable at arm's length. Increase to 11px minimum. [Effort: S]

**[P2-6] Staff · Merge has no preview of combined bill** — Before confirming merge, show a summary: "T1 (₱1,200) + T3 (₱800) = ₱2,000 combined". [Effort: M]

---

## G. Overall Assessment

**The WTFPOS POS staff flow is ready for service with caveats.** The core order creation loop (floor tap → pax → package → items → kitchen) is efficient at 2-3 taps and feels fast. The AYCE-specific features (refill panel, leftover penalty, package switching) are well-implemented with appropriate UX patterns. RxDB local-first means zero latency on all writes.

The system has three categories of issues that require attention before a busy shift:

1. **Touch target violations** ([P0-1]) will cause errors during every shift on a real touchscreen. The 20px remove-item button and 28px quantity controls will be repeatedly mis-tapped.

2. **The "Transfer · Pax · Split · Merge" toggle** ([P1-1]) is the most confusing element in the entire system. New staff will not find Transfer, Split, or Merge without training. This is a discoverability failure.

3. **Rapid multi-table opening friction** ([P1-2]) will cause frustration during peak hours when a group of parties arrives simultaneously. The auto-AddItemModal pattern is great for single-table flow but actively impedes concurrent table setup.

Fix P0-1 (touch targets) before deployment. Fix P1-1 and P1-2 this sprint.

---

## H. Fix Status

- **P0-1** · Remove-item ✕ button 20px (OrderSidebar), ±qty buttons 28px (AddItemModal), discount toggles 32px (CheckoutModal) → 🔴 OPEN
- **P0-2** · `wtfpos_session` in localStorage causes session clobber across tabs → 🔴 OPEN
- **P0-3** · PaxModal max pax = 12 with no custom input for larger groups → 🔴 OPEN
- **P1-1** · "Transfer · Pax · Split · Merge" toggle label is undiscoverable → 🔴 OPEN
- **P1-2** · Auto-open AddItemModal breaks rapid multi-table creation flow → 🔴 OPEN
- **P1-3** · Kitchen rejection only alerted inside the selected-table sidebar → 🔴 OPEN
- **P1-4** · Shift Start Modal doesn't reassure staff about active orders behind it → 🔴 OPEN
- **P1-5** · Takeout label is time-based (non-sequential) → 🔴 OPEN
- **P1-6** · "History 66" badge count misleads on fresh shift → 🔴 OPEN
- **P2-1** · LeftoverPenaltyModal is surprising for new staff with no pre-warning → 🔴 OPEN
- **P2-2** · "Repeat Last" truncates for complex multi-meat orders → 🔴 OPEN
- **P2-3** · "Cancel Table" shows no affordance for 2-step confirmation → 🔴 OPEN
- **P2-4** · `text-gray-400` hint text contrast fails WCAG AA → 🔴 OPEN
- **P2-5** · Status badge text is 9–10px (SENT/SERVING/etc.) → 🔴 OPEN
- **P2-6** · Merge has no preview of combined bill before confirming → 🔴 OPEN
