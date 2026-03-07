# UX Audit Report: `/pos` as Staff at Alta Citta

**Auditor:** Claude (ux-audit skill v1.0.0)
**Date:** 2026-03-07
**Page:** `/pos`
**Role:** Staff (Maria Santos)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024 x 768 (tablet landscape)
**States captured:** Initial (no selection), Pax modal, Active order + AddItemModal

---

## A. Text Layout Map

### State 1: Initial (no table selected)

```
+--sidebar(~60px)--+-------------------main-content-------------------+
| [W! brand]       | LocationBanner: [You are viewing] [Retail]       |
| ----------       |   ALTA CITTA (TAGBILARAN)                       |
| [> POS]          |   Role: staff | Access: View Only                |
|                  |--------------------------------------------------|
|                  | POS  [0 occ] [8 free]                            |
| ----------       | legend: Avail | Dining | Ready | Pork | Beef |PB |
| Maria Santos     | [New Takeout]  [History 61]                      |
| staff            |                                                  |
| [Logout]         | +--floor-SVG (~60%)--+ +-order-sidebar(~40%)----+ |
|                  | | [T1][T2][T3][T4]   | | receipt icon            | |
|                  | | [T5][T6][T7][T8]   | | No Table Selected      | |
|                  | |                    | | "Tap an occupied table" | |
|                  | +--------------------+ |                        | |
|                  | Takeout Orders (4)     | Green = available      | |
|                  | [TO01 Maria P209] PREP | Orange = occupied      | |
|                  | [TO02 Ana P703]   PREP +------------------------+ |
|                  | [TO03 Carmen P1016]    |                         |
|                  | ~~~~~~~~fold~~~~~~~~   |                         |
|                  | [TO04 Pedro P0]        |                         |
+--sidebar---------+-------------------------------------------------+
```

### State 2: Active order (T1 selected, AddItemModal open)

```
+--sidebar--+---floor(behind modal)---+--order-sidebar--+
|           | +===AddItemModal (overlay, ~65% width)===+ |
|           | | + Add to Order    fire Table 4 pax   X | |
|           | | [Pkg][Meat][Side][Dish][Drk]            | |
|           | | FREE -- inventory tracked               | |
|           | | +--------------------------------------+| |
|           | | | [img] Beef Unlimited                 || |
|           | | |       P599/pax                       || |
|           | | | [img] Beef+Pork Unlimited            || |
|           | | |       P499/pax                       || |
|           | | | [img] Pork Unlimited                 || |
|           | | |       P399/pax                       || |
|           | | +--------------------------------------+| |
|           | +===RIGHT PANEL: Pending Items============+ |
|           | | "Review items before pushing to bill"    | |
|           | | [No items yet]                          | |
|           | | PENDING TOTAL P0.00                     | |
|           | | [Undo]  [CHARGE (0)] (disabled)         | |
|           | +========================================+ |
+--sidebar--+------------------------------------------+
                        Behind modal:
              Order sidebar: T1 | 4 pax | 0m
              [+ Add Item]  BILL 0 items P0.00
              [Void] [Checkout] [Print] [More Options]
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | **PASS** | Pax modal: 12 choices (1-12) -- acceptable for a number picker. AddItemModal: 5 category tabs chunking the full menu. Package tab shows only 3 items. Well-structured progressive disclosure. | -- |
| 2 | **Miller's Law** (chunking) | **CONCERN** | Floor plan: 8 tables + 4 takeout orders + legend (6 items) + 2 action buttons = ~20 elements visible simultaneously. The legend alone has 6 color keys on a single row. Takeout orders are not visually chunked from the floor plan -- they share the same vertical column. | Visually separate takeout section from floor SVG with a stronger divider or card boundary. Consider collapsing the legend to an icon-button that reveals on tap. |
| 3 | **Fitts's Law** (target size/distance) | **CONCERN** | Table buttons in SVG render as small rectangles -- at 1024px width with 8 tables, each is likely ~80-100px wide (acceptable). However, the `[+ Add Item]` button in the order sidebar is positioned mid-panel while `[Checkout]` is at the bottom -- the two most common sequential actions are far apart. Legend color swatches appear to be inline text, not tappable, which is fine, but they're small and dense. | Move `[+ Add Item]` closer to the bottom action bar, or make it full-width at the top of the sidebar with high visual weight. |
| 4 | **Jakob's Law** (conventions) | **PASS** | Layout follows standard POS tablet pattern: left nav rail, center floor plan, right order panel. Pax picker uses a number grid (familiar). Category tabs in AddItemModal are horizontal with emoji icons -- standard mobile/tablet pattern. | -- |
| 5 | **Doherty Threshold** (response time) | **PASS** | All interactions are RxDB local-first -- instant writes. Pax selection immediately opens order + AddItemModal. Table status updates reactively (T1 immediately shows `00:01` timer and `4 pax`). `active:scale-95` on `.btn` gives tactile feedback. | -- |
| 6 | **Visibility of System Status** | **CONCERN** | Good: `0 occ / 8 free` counter, table timer (`00:01`), pax display, "PREP" status on takeout orders, LocationBanner shows branch. Concern: **"Access: View Only"** displayed for staff is confusing -- staff clearly CAN interact (open tables, add items). This message contradicts the actual permissions. Also, no visual indicator of which table is currently selected on the floor plan after the AddItemModal opens. | Fix the "Access: View Only" text for staff role -- it's misleading. Add a selected state highlight (border/glow) on the active table in the floor SVG. |
| 7 | **Gestalt: Proximity** | **CONCERN** | In the order sidebar, `[Void] [Checkout] [Print]` are grouped together as a button row -- good. But `[More Options]` is on a separate row below, creating an orphaned element. In AddItemModal, the `[Undo]` and `[CHARGE]` buttons are well-grouped. The legend items are extremely tightly packed -- proximity suggests they're one unit, but they're 6 separate status types. | Group `[More Options]` with the action buttons, or make it a dropdown menu from the button row. Add more spacing between legend items. |
| 8 | **Gestalt: Common Region** | **PASS** | AddItemModal has a clear boundary (overlay). Order sidebar is a distinct panel. Takeout orders are grouped under a heading with count badge. Package items have card-like structure with image + text. | -- |
| 9 | **Visual Hierarchy** (scale) | **CONCERN** | "POS" heading (h1) and "ALTA CITTA" heading (h2) compete for attention at the top of the page. The LocationBanner takes significant vertical space (~60-70px) with "You are viewing", "Retail" badge, full heading, and role/access line. On a 768px viewport, this banner eats ~9% of vertical space before any content. | Reduce LocationBanner height -- compress to a single line: `[icon] Alta Citta . Staff . Retail`. Save 40-50px of vertical space for the floor plan. |
| 10 | **Visual Hierarchy** (contrast) | **PASS** | The AddItemModal categories use emoji icons + text labels -- good differentiation. Package items have images, name, price, and description -- clear hierarchy with price in separate line. Active table shows timer, name, pax -- differentiated from inactive tables showing just name + capacity. | -- |
| 11 | **WCAG: Color Contrast** | **CONCERN** | Per Design Bible contrast table: status-green on white = 3.5:1 (FAIL AA for small text). The legend uses color swatches with labels like "Available", "Dining (Green)" -- the text labels save it, but if the floor plan tables rely on green fill alone to indicate status, users with color vision deficiency may struggle. "PREP" status on takeout orders -- need to verify if this is colored text or has additional context. | Ensure table status on the SVG floor plan uses text labels or icons alongside color (not color alone). Verify "PREP" badge meets contrast requirements. |
| 12 | **WCAG: Touch Targets** | **PASS** | `.btn` enforces 48px. Pax picker buttons appear to be grid items (likely 48px+). Table SVG buttons are clickable with button role. `[Close modal] X` button exists. All action buttons have proper button role and cursor pointer. | Verify the X close button on AddItemModal is at least 44x44px (it's a single character -- may be undersized). |
| 13 | **Consistency** (internal) | **CONCERN** | Takeout orders show `[-> Mark Ready]` as an action on each card -- this is an operational action mixed into the floor plan view. Staff cashiering shouldn't need to manage prep status (that's kitchen's job). The order sidebar shows `[Void] [Checkout] [Print] [More Options]` -- but the order is EMPTY (0 items, P0.00). All three financial actions are available on an empty order. | Disable or hide `[Void]`, `[Checkout]`, `[Print]` when order has 0 items. Consider whether `[-> Mark Ready]` on takeouts belongs on the POS floor view for staff role. |
| 14 | **Consistency** (design system) | **PASS** | Uses `pos-card` patterns, `.btn-*` classes, emoji icons, badge-style counters. LocationBanner is in root layout (not duplicated). Sidebar uses shadcn-svelte sidebar component with icon rail. Font appears to be Inter. | -- |

---

## C. "Best Day Ever" Vision

It's Friday night at Alta Citta, 7:15 PM. Maria has been on shift since 5 PM and the restaurant is filling up. She's got her rhythm going.

**The ideal:** Maria glances at the tablet and instantly sees the floor -- 5 of 8 tables glowing green (available), 3 showing orange with timers ticking. She doesn't read numbers or decode legends; the colors and timers tell the whole story in a split-second glance. A group of 4 walks in. She taps T3 (green, closest to the door in the SVG), taps "4" on the pax picker, and the menu appears. She already knows they want Beef + Pork Unlimited -- two taps: the package card, then CHARGE. The whole interaction took 4 seconds. She slides the tablet toward the next customer approaching the counter.

**Where it falls short today:** Maria opens T1, picks 4 guests, and the AddItemModal appears -- this flow is great. But when she looks back at the floor plan (behind the modal), she can't tell which table she just opened because there's no selected-state highlight. The LocationBanner at the top tells her "Access: View Only" which makes her nervous for a moment -- *can* she actually ring up an order? She can, but the message is wrong. The sidebar shows Void, Checkout, and Print buttons on an empty order -- three buttons that do nothing useful right now, creating visual noise during the critical "build the order" phase. Meanwhile, the 4 takeout orders with "Mark Ready" buttons catch her eye -- but managing prep status isn't her job, and the orange action buttons pull her attention away from the floor plan she needs to scan.

**The gap:** The bones are excellent -- the flow from table tap to pax to menu is fast, the progressive disclosure in categories works, and RxDB makes everything instant. The friction comes from *visual noise*: too much information competing for attention in the initial view (6-item legend, 4 takeout cards with action buttons, "View Only" badge, empty-state action buttons). During a rush, every unnecessary element Maria's eyes have to skip past costs a fraction of a second -- and those fractions add up across a 200-order night.

**Emotional arc:** Maria should feel *confident* (the system shows her exactly what she needs), *fast* (every interaction is one or two taps), and *in control* (she never worries she's on the wrong screen or tapped the wrong thing). Today, the confidence is slightly undermined by the "View Only" mixed signal, and the speed is slightly undermined by the visual density of the initial view.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | "Access: View Only" displayed for staff who clearly HAVE write access -- creates confusion and hesitation | Fix the access label in LocationBanner to accurately reflect staff permissions (e.g., "Access: Cashier" or remove entirely for staff role) | S | High |
| **P0** | `[Void]`, `[Checkout]`, `[Print]` buttons enabled on empty order (0 items, P0.00) -- invites accidental taps during rush | Disable these buttons when order has 0 items. Only enable when there's at least 1 item on the bill. | S | High |
| **P1** | No selected-table indicator on floor SVG when order sidebar / modal is open -- staff loses spatial context | Add a visible highlight (ring, glow, or pulsing border) on the active table in the SVG when it's selected | S | High |
| **P1** | LocationBanner consumes ~70px vertical space (4 lines) on a 768px viewport -- 9% of screen for context that could be 1 line | Compress to single line: `[MapPin icon] Alta Citta . Staff` with optional expand. Save 40-50px of vertical space for the floor plan. | M | Med |
| **P1** | 6-item color legend always visible -- adds visual density without proportional value (staff learns colors on day 1) | Collapse legend into an `[i]` icon button that reveals on tap. Or move to a dismissable tooltip on first visit. | S | Med |
| **P1** | `[-> Mark Ready]` action buttons on takeout orders visible to staff on POS floor -- this is a kitchen concern, not cashier | Hide `[-> Mark Ready]` from staff role on the POS page. Show status ("PREP") read-only instead. Or: move takeout management to a separate sub-view. | M | Med |
| **P2** | `[More Options]` button orphaned on separate row from `[Void] [Checkout] [Print]` -- breaks button group proximity | Merge into the action row as a `[...]` overflow button, or make it a dropdown attached to the button group | S | Low |
| **P2** | Pax picker shows 1-12 as a flat grid -- no visual hint of common pax counts | Highlight common pax counts (2, 4, 6) with slightly different styling or "common" label. Most tables are groups of 2 or 4. | S | Low |
| **P2** | No visible scroll indicator on takeout orders list -- 4 items may extend below fold at 768px height | Add a fade gradient at bottom edge or "scroll for more" indicator if list overflows viewport | S | Low |

---

## Summary

| Verdicts | Count |
|---|---|
| PASS | 7 / 14 |
| CONCERN | 7 / 14 |
| FAIL | 0 / 14 |

**Overall assessment:** The `/pos` page has excellent interaction flow (table > pax > menu > charge) and benefits hugely from RxDB's instant local writes. No principle outright FAIL. The 7 CONCERNs are all about **visual noise and misleading signals** rather than broken functionality. The two P0 items ("View Only" label and enabled-but-useless action buttons) are quick wins that would immediately improve staff confidence during service.
