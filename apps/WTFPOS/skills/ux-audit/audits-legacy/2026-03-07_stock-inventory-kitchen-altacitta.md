# UX Audit Report: `/stock/inventory` as Kitchen at Alta Citta

**Auditor:** Claude (ux-audit skill v1.0.0)
**Date:** 2026-03-07
**Page:** `/stock/inventory`
**Role:** Kitchen (Pedro Cruz)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024 x 768 (tablet landscape)
**States captured:** Initial loaded state (93 items, all Well-Stocked)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 10 issues resolved (P0: 0/2 · P1: 0/5 · P2: 0/3)

---

## A. Text Layout Map

```
+--sidebar(~60px)--+-------------------main-content--------------------+
| [W! brand]       | Stock Management                                  |
| Alta Citta       | [Inventory] [Deliveries 5] [Transfers] [Counts 1] |
| 03:29 PM         |   [Waste Log]                                     |
| ----------       |---------------------------------------------------|
| [Kitchen]        | +--summary-cards (4)------------------------------+|
| [> Stock]        | | [Total:93] [OK:93] [Low:0] [Critical:0]        ||
| ----------       | +------------------------------------------------+|
| Pedro Cruz       | [Search items or category...]                      |
| kitchen          | [Expand All] [Collapse All]  [List|Grid]           |
| [Logout]         |---------------------------------------------------|
|                  | TABLE HEADER:                                      |
|                  | [img] Item^ | Category | StockLevel | Cur/Min | St |
|                  |---------------------------------------------------|
|                  | === Beef (5 items) === 25.5k Total [pie chart]     |
|                  |   top 3: Bone-In 9219 | Bone-Out 7277 | Sliced 6907|
|                  |   +2 more  [Variants 5]  [v expand]               |
|                  |---------------------------------------------------|
|                  | [img] Beef Bone-In   | Meats | [bar] | 9,219g  |OK|
|                  | [img] Beef Bone-Out  | Meats | [bar] | 7,277g  |OK|
|                  | [img] Beef Bones     | Meats | [bar] | 1,500g  |OK|
|                  | [img] Beef Trimmings | Meats | [bar] | 582g    |OK|
|                  | [img] Sliced Beef    | Meats | [bar] | 6,907g  |OK|
|                  |~~~~~~~~~~~~~~~~fold (768px)~~~~~~~~~~~~~~~~~~~~~~~|
|                  | === Pork (5 items) === 84.9k Total [pie chart]     |
|                  |   top 3: Bone-In 33410 | Bones 20600 | Sliced 16585|
|                  |   ...                                              |
|                  | === Chicken (2 items) === 25.2k Total              |
|                  | === Drinks === (14+ items, all 36 bottles)         |
|                  | === Pantry === (continues...)                      |
|                  | === Sauces & Condiments ===                        |
|                  | === Sides ===                                      |
|                  | === Supplies ===                                   |
+--sidebar---------+--------------------------------------------------+
```

**Key observations from layout:**
- The 4 summary cards + search bar + toolbar + table header consume ~200px of vertical space before any inventory data appears
- Category group rows (Beef, Pork, etc.) include embedded pie charts and top-3 breakdowns — information-dense
- Each item row has: image thumbnail, name, category, stock level bar (empty column?), current/min, status, Edit button
- 93 items means significant scrolling — only ~5-8 item rows visible above fold
- The "Stock Level" column header exists but individual item cells appear empty (ref=e186, e202, etc. have no content) — possible rendering issue

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | **CONCERN** | 93 items visible in one flat table (grouped by category, but all expanded by default). 5 sub-nav tabs + 4 summary filter cards + search + Expand/Collapse + List/Grid toggle = 13 controls in the toolbar area alone. The kitchen user's primary question is "do I have enough meat?" — they don't need to see 14 drink variants. | Default to collapsed categories. Auto-expand only "Meats" categories for kitchen role. Or: add a "Meats Only" quick filter since that's 90% of what kitchen cares about. |
| 2 | **Miller's Law** (chunking) | **PASS** | Categories provide good chunking: Beef (5), Pork (5), Chicken (2), Drinks (14+), etc. Each group header summarizes with total + pie chart + top 3. Within each group, items are consistent rows. The 4 summary cards at top chunk the status overview well. | -- |
| 3 | **Fitts's Law** (target size/distance) | **CONCERN** | "Edit Info" buttons on every row are small icon-only buttons (img ref only, no visible text in DOM). With 93 rows, that's 93 small tap targets in a column. The search box is well-positioned (top of table). Summary cards are large and tappable. But the sub-nav has 5 tabs and on 1024px width they may be tight — "Waste Log" wraps to a second concept line. | Make "Edit Info" button larger or add text label. Consider whether kitchen role even needs "Edit Info" — they check stock, not edit item metadata. |
| 4 | **Jakob's Law** (conventions) | **PASS** | Standard inventory table layout: search at top, filters, sortable columns, grouped rows. Matches warehouse/inventory management patterns (Shopify, Square). Pie charts in group headers are a nice touch — common in dashboard inventory views. | -- |
| 5 | **Doherty Threshold** (response time) | **PASS** | RxDB local-first — 93 items render instantly from IndexedDB. Search filtering is client-side (instant). Sort by column headers is immediate. No server round-trips for inventory reads. | -- |
| 6 | **Visibility of System Status** | **CONCERN** | Good: 4 summary cards (Total/OK/Low/Critical) give instant status overview. "Well-Stocked" text on every row. Category totals (25.5k, 84.9k). Concern: ALL 93 items show "Well-Stocked" — when everything is OK, the status column becomes noise (100% identical values). There's no timestamp showing "as of when" this data was current. Also: the "Stock Level" column appears to have empty cells for individual items — what should be there? | When all items are Well-Stocked, show a banner "All items well-stocked as of [time]" and collapse the status column. Add a "Last updated" timestamp. Investigate the empty Stock Level column cells. |
| 7 | **Gestalt: Proximity** | **PASS** | Category groups are clearly separated. Item rows within a group are tightly spaced. The 4 summary cards are in a horizontal group. Search bar and toolbar controls are adjacent. Good spatial grouping throughout. | -- |
| 8 | **Gestalt: Common Region** | **PASS** | Category group headers (Beef, Pork, etc.) span the full table width and visually contain their child rows. Summary cards each have their own bordered region with icon + label + count. The pie chart is embedded within the group header card. | -- |
| 9 | **Visual Hierarchy** (scale) | **CONCERN** | "Stock Management" heading and sub-nav compete for attention at the top. The 4 summary cards are visually heavy (icons + numbers + labels) and draw the eye before the actual inventory data. In the current state (93 OK, 0 Low, 0 Critical), the Low and Critical cards are zero-value but take equal visual weight as the meaningful Total and OK cards. Category group headers with pie charts are visually dominant — they're larger and more complex than the item rows, which is appropriate for scanning but makes the page feel dense. | Dim or shrink zero-value summary cards (Low: 0, Critical: 0) when they're zero. They should only become prominent when there's a problem. This reduces visual noise in the happy path. |
| 10 | **Visual Hierarchy** (contrast) | **PASS** | Item names are prominent text. Category names are bold group headers. Numeric values (9,219 g) use adequate sizing. "Well-Stocked" status uses colored text/badge. The pie chart adds color differentiation within categories. Unit labels (g, bottles) provide context alongside numbers. | -- |
| 11 | **WCAG: Color Contrast** | **CONCERN** | "Well-Stocked" likely uses status-green text. Per Design Bible: status-green (#10B981) on white = 3.5:1 (FAIL AA for small text). If this is the only indicator that an item is OK, it fails accessibility. The pie chart segments use category-specific colors — unclear if they meet contrast requirements against the white card background. | Ensure "Well-Stocked" text is at least 14px bold or 18px regular to pass AA at 3.5:1. Or use a darker green variant. Add an icon alongside the text status (checkmark for OK, warning triangle for Low, X for Critical). |
| 12 | **WCAG: Touch Targets** | **CONCERN** | Table rows are marked `[cursor=pointer]` — the entire row is clickable (good). But the "Edit Info" buttons within rows appear to be small icon-only buttons. If the row click and the button click do different things, the small button target within the larger row target creates an accidental-tap risk. Summary cards are large tappable areas (good). Sub-nav links have icon + text (good). | Clarify the row-click vs Edit-button-click behavior. If they do the same thing, remove the button and let the row handle it. If different, increase Edit button size and add spacing. |
| 13 | **Consistency** (internal) | **CONCERN** | The "Stock Level" column in the table header exists but individual item cells appear empty (no bar, no content). This is either a rendering bug or a conditional element. The category group row uses a completely different layout (full-width with pie chart) vs item rows (standard table columns) — this is intentional but the transition is jarring. Drinks section has a simple "Drinks" category header with no pie chart or summary — inconsistent with the Beef/Pork/Chicken group headers. | Investigate empty Stock Level cells. Ensure all category groups get the same header treatment (pie + summary) or none do. |
| 14 | **Consistency** (design system) | **PASS** | Uses standard table layout, summary card pattern, search input, icon + text nav links. Sidebar shows Kitchen and Stock nav items appropriate for kitchen role. Location displayed in sidebar header. Time displayed (03:29 PM). Follows the app shell pattern. | -- |

---

## C. "Best Day Ever" Vision

It's 4 PM at Alta Citta — the calm before the storm. Pedro is prepping for the dinner rush. He wipes his hands on his apron and picks up the kitchen tablet to check if the morning delivery was logged.

**The ideal:** Pedro taps Stock in the sidebar, and instantly sees what matters: "Beef Bone-In: 9.2kg (good for ~50 servings)", "Sliced Pork: 16.5kg (comfortable)". The numbers jump out. He doesn't need to scroll — the meats he cares about are front and center, already expanded, while the 14 drink variants are tucked away (that's the cashier's problem). He spots that Beef Trimmings is at 582g, close to the 500g minimum — not critical yet, but he makes a mental note. A quick glance at the top tells him "0 Critical, 0 Low Stock" — he relaxes. The whole check took 5 seconds.

**Where it falls short today:** Pedro opens the inventory and sees 93 items, all expanded. The Beef section is great — pie chart, totals, individual rows. But to check Pork, he has to scroll past all 5 Beef items. To check Chicken, past 5 more Pork items. By the time he reaches the bottom, he's scrolled past 14 drink variants (Barley Tea, Cass, Chilsung Cider, Coca-Cola...) that he never checks. The 4 summary cards tell him "93 OK" — which is reassuring but doesn't answer his real question: *"Are my grill meats ready for tonight?"*

The "Well-Stocked" status on every single row becomes invisible after the third one — it's the same green text repeated 93 times. Pedro's eyes glaze over it. The one row that actually matters (Beef Trimmings at 582g, only 82g above minimum) looks identical to Pork Bone-In at 33,410g. Both say "Well-Stocked." Both look the same. There's no visual gradient between "barely above minimum" and "10x above minimum."

**The gap:** The page is built for a manager doing a thorough audit (see everything, expand everything). Pedro needs a kitchen-optimized view: meats first, auto-collapsed non-meat categories, and a visual heat indicator that makes "close to minimum" look different from "well above minimum." The data is all there — it just needs to be prioritized for the role viewing it.

**Emotional arc:** Pedro should feel *informed* (2-second glance answers "are we good?"), *calm* (nothing is red, I can focus on prep), and *proactive* (that Trimmings number is getting close — I'll mention it to the manager). Today, he feels *overwhelmed* (so much data), *uncertain* (scrolled past too many rows, did I miss something?), and *disengaged* (everything looks the same, nothing stands out).

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | Empty "Stock Level" column cells on item rows — likely a rendering bug or missing bar visualization | Investigate and fix. If a progress bar was intended, render it. If not, remove the column. | S | High | 🔴 OPEN |
| **P0** | No visual differentiation between "barely above minimum" (582g / 500g min) and "well above minimum" (33,410g / 5,000g min) — both show "Well-Stocked" identically | Add a stock health gradient: green-bold for >2x minimum, green-light for 1-2x, yellow for 1-1.5x, red for <1x. Or add a percentage-based visual bar. | M | High | 🔴 OPEN |
| **P1** | All 93 items expanded by default — kitchen user must scroll past drinks and supplies to check meat | Default to collapsed categories. For kitchen role, auto-expand meat categories only. Add a "Meats" quick filter button. | M | High | 🔴 OPEN |
| **P1** | Zero-value summary cards (Low: 0, Critical: 0) take equal visual weight as meaningful cards | Dim/shrink zero-value cards. Only elevate them visually when count > 0. Consider: when Critical > 0, make it pulse or use red background. | S | Med | 🔴 OPEN |
| **P1** | "Well-Stocked" text repeated 93 times becomes invisible noise — status column provides no signal when everything is OK | When all items are OK, collapse status column or show it only on items approaching threshold. Add "All items well-stocked" summary banner instead. | M | Med | 🔴 OPEN |
| **P1** | No "last updated" or "as of" timestamp — Pedro doesn't know if this is live or from this morning's count | Add a timestamp: "Stock as of [last count/delivery time]" near the summary cards | S | Med | 🔴 OPEN |
| **P1** | Inconsistent category group headers — Drinks has a simple text header while Beef/Pork/Chicken have rich headers with pie charts and top-3 breakdowns | Apply the same group header pattern to all categories, or define rules for when the rich header appears (e.g., only for categories with >2 items tracked by weight) | M | Low | 🔴 OPEN |
| **P2** | "Edit Info" button on every row — kitchen role likely shouldn't edit item metadata (that's admin/manager) | Hide "Edit Info" for kitchen role. Show read-only row with detail expand instead. | S | Med | 🔴 OPEN |
| **P2** | Sub-nav has 5 tabs + badges — at 1024px they may crowd the horizontal space | Verify tab wrapping at tablet width. If crowded, use scrollable tabs or collapse to icons with tooltips. | S | Low | 🔴 OPEN |
| **P2** | No quick way to see "what changed since yesterday" — Pedro wants to verify the morning delivery was logged | Add a "Recent changes" indicator (badge or timestamp) on recently-updated items, or a "Last delivery" mini-card at the top. | M | Low | 🔴 OPEN |

---

## Summary

| Verdicts | Count |
|---|---|
| PASS | 7 / 14 |
| CONCERN | 7 / 14 |
| FAIL | 0 / 14 |

**Overall assessment:** The inventory page is a well-structured data table with strong fundamentals — instant RxDB loading, proper categorization with pie charts, sortable columns, search, and summary cards. The two P0s are: a likely rendering bug (empty Stock Level cells) and the lack of visual gradient between "barely safe" and "abundantly stocked." The core theme across all 7 concerns is **role mismatch** — the page is built for a manager doing a full audit, not a kitchen cook doing a 5-second meat check. Role-aware defaults (collapsed non-meat categories, hidden Edit buttons, meat-first view) would transform this from "overwhelming dashboard" to "glanceable kitchen tool."
