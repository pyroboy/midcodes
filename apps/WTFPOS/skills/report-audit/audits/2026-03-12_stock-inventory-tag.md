# Report Audit: Stock / Inventory

**Date:** 2026-03-12
**Page:** `/stock/inventory`
**Role:** Owner (Boss Chris)
**Branch:** Alta Citta (tag) + All Locations
**Viewport:** 1024x768

---

## A. Data Analytics Scorecard

| # | Dimension | Verdict | Key Finding |
|---|-----------|---------|-------------|
| 1 | Information Hierarchy | CONCERN | Health strip → table is correct Shneiderman ordering, but 93 items in flat list with no pagination breaks the "zoom + filter" step |
| 2 | KPI Card Design | CONCERN | 4 KPI cards (good count), but all four are lonely numbers with zero comparison context — no trend, no delta, no "vs. yesterday" |
| 3 | Chart Selection | CONCERN | Donut charts in protein group headers — Cleveland & McGill rank angle/area encoding as one of the least accurate perceptual channels |
| 4 | Data-Ink Ratio | FAIL | Triple encoding of stock health: level bar + status badge + current/min numbers. Category column shows "Meats" for every row under a "Beef" header |
| 5 | Color Encoding | PASS | Consistent status colors (green/yellow/red), protein group colors (red=beef, orange=pork, yellow=chicken) match design system |
| 6 | Comparison Context | FAIL | Every number is a lonely number. No vs-yesterday, no vs-last-delivery, no trend arrows. Health strip shows "93 OK" but not whether that improved or degraded |
| 7 | Cognitive Load | FAIL | 93 items in a single scrollable table with no virtualization or pagination. Every meat item repeats "Meats" in category column. "1 minute ago" on every row (seed artifact) adds noise |
| 8 | Data Integrity | CONCERN | getSpoilageAlerts() exists in store but is never called on this page. Stock values are mathematically correct via getCurrentStock() chain |
| 9 | Empty States | PASS | Search empty state shows icon + "No items match your search" + suggestion. Low/Critical buttons dim to opacity-40 at zero (acceptable) |
| 10 | Accessibility | PASS | StockLevelBar has aria-label + sr-only text. Touch targets meet 44px minimum. Table uses semantic thead/tbody |
| 11 | Anti-Patterns | CONCERN | All 93 items showing "Well-Stocked" creates a false sense of security — no mechanism to surface items approaching low threshold. Uniform green walls are a form of dashboard blindness |
| 12 | Data Schema Cohesion | CONCERN | Core metrics trace cleanly to schema fields. But PRD-required spoilage alerts and variance tracking have no display. unitCost param accepted in receiveDelivery() but not in the RxDB schema |

**Overall:** 3/12 PASS, 6 CONCERN, 3 FAIL

---

## B. Data Flow Map + Schema Provenance

```
[Schema Field]              → [Collection]    → [Store Function]        → [Derived Metric]       → [Visual Component]         → [PRD Req]

stock_items.id + locationId → stock_items     → stockItems.value        → totalItems (count)     → StockHealthStrip "Total"   → M2 ✅
stock_items.openingStock    → stock_items     → getCurrentStock()       → currentStock (number)  → InventoryItemRow "Current" → M2 ✅
  + deliveries.qty          → deliveries      → ↑                       → ↑                     → StockLevelBar              → M2 ✅
  + stock_events.qty        → stock_events    → ↑                       → ↑                     → ↑                         →
  + deductions.qty          → deductions      → ↑                       → ↑                     → ↑                         →
stock_items.minLevel        → stock_items     → getStockStatus()        → status (ok|low|crit)   → Status badge               → M2 ✅
stock_items.proteinType     → stock_items     → proteinConfig[]         → protein group totals   → ProteinGroupHeader         → M2 ✅
stock_items.proteinType     → stock_items     → gridGroups.meatGroups   → donut chart data       → ProteinDonutChart          → M2 ✅ (nice-to-have)
deliveries.expiryDate       → deliveries      → getSpoilageAlerts()     → spoilage alerts        → — NOT WIRED —             → M2 ❌ MISSING
— (no field)                → —               → —                       → stock trend history    → — NOT BUILT —             → M2 ❌ MISSING
deliveries.unitCost         → — NOT IN SCHEMA → receiveDelivery(param)  → delivery cost          → — NOT DISPLAYED —         → M3 ⚠️ PARTIAL
stock_counts.counted        → stock_counts    → getDrift()              → variance/drift         → — NOT ON THIS PAGE —      → M2 ❌ MISSING (on /stock/counts)
```

### Data Provenance Table

| Displayed Metric | Collection(s) | Field(s) | Derivation | Status |
|---|---|---|---|---|
| Total Items | stock_items | id, locationId | COUNT(*) WHERE locationId | ✅ Exists |
| OK / Low / Critical | stock_items + deliveries + events + deductions | openingStock, qty, minLevel | getCurrentStock() vs thresholds | ✅ Derivable |
| Current Stock | stock_items, deliveries, stock_events, deductions | openingStock, qty | opening + delivered - deducted - waste + adds | ✅ Derivable |
| Min Level | stock_items | minLevel | Direct read | ✅ Exists |
| Stock Level Bar % | stock_items | currentStock, minLevel | current / (minLevel * 2) * 100 | ✅ Derivable |
| Protein Group Totals | stock_items | proteinType, currentStock | SUM by proteinType | ✅ Derivable |
| Spoilage Alerts | deliveries | expiryDate, depleted | daysLeft ≤ 3 filter | ✅ Derivable but ❌ NOT DISPLAYED |
| Stock Trend | — | — | — | ❌ No historical snapshots |
| Delivery Cost | deliveries | unitCost | — | ⚠️ Param accepted, not in schema |

---

## C. "Best Report" Vision (PRD-Grounded)

**The persona moment.** It's 3:45 PM at Alta Citta. Boss Chris opens the Stock Management tab on his tablet to check inventory before the dinner rush. He's specifically looking for three things: which meats are running low and need an emergency transfer from the warehouse, whether yesterday's delivery has been consumed as expected, and if any items are approaching expiry and should be prioritized for tonight's service.

**Business questions the PRD says this page must answer:**
1. What is the current stock level of every tracked item at this branch? (M2 — answered ✅)
2. Which items are at or below minimum levels and need immediate restocking? (M2 — answered ✅ via health strip filter)
3. Are any items approaching expiry? (M2 — getSpoilageAlerts() exists but is NOT wired to this page ❌)
4. How does today's stock compare to yesterday's? Is consumption on track? (M2 — no trend data ❌)
5. Aggregated multi-branch stock levels when "All Branches" is selected (M3 — answered ✅ via AllLocationsInventory)

**The ideal inventory page** would open with the health strip showing not just counts but directional arrows: "3 items went from OK → Low since yesterday." Below, only items needing attention would be expanded — the 2 items approaching low threshold, the 1 expiring batch. The remaining 90 well-stocked items would be collapsed into a summary line: "90 items well-stocked — tap to expand." Each meat protein group would show a small sparkline of consumption rate over the past 3 days instead of a donut chart showing current proportions.

**Comparison context that makes numbers actionable:** Each item's current stock shown as "14,185g (↓ 2,100g since 10 AM)" tells the manager whether dinner prep is on track. The health strip showing "Low Stock: 2 (was 0 yesterday)" creates urgency. Without these comparisons, 93 rows of "Well-Stocked" produce a green wall that managers learn to ignore.

**The decision moment.** After scanning the page, Boss Chris should know: (a) whether to call Noel at the warehouse for an emergency transfer, (b) which batches to prioritize using before they expire, and (c) whether the branch is consuming more meat than projected. If the page cannot trigger at least one of these decisions, it's an inventory spreadsheet, not a management tool.

---

## D. Findings

---

##### [01] Health Strip KPIs are lonely numbers with no comparison context

**What:** The four KPI cards (Total Items: 93, OK: 93, Low Stock: 0, Critical: 0) display counts with no trend indicator, no "vs. yesterday" comparison, no directional arrow, and no sparkline. Each number exists in isolation.

**Bible Violation:** Section 7.1 — "No Lonely Numbers" (Rosling). Section 7.4 — "Every metric needs at least one comparison." Section 3.2 — "North Star and Health metrics require paired indicators (Andy Grove's indicator pairs)."

**Why This Misleads:** Boss Chris sees "93 OK" and assumes everything is fine. But if yesterday had 95 OK and 2 items have silently drifted toward low threshold, the static count hides the trend. He misses the window to call the warehouse for a top-up transfer before the dinner rush.

**Ideal State:** Each KPI card shows: count + delta arrow + "vs. yesterday" or "vs. shift start." Example: "OK: 93 (→ same)" or "Low Stock: 2 (↑1 since 10 AM)." The Critical card pulses or uses a different visual weight when count > 0. Use `stockVarianceComparison()` (which already exists in the store but isn't called here).

**The Owner Story:** "I check inventory three times a day. If the numbers look the same every time, I stop checking. Tell me when something changed — that's the only number I care about."

---

##### [02] Triple encoding of stock health wastes data-ink and adds cognitive load

**What:** Every inventory row communicates stock health through three redundant channels: (1) the colored StockLevelBar gauge, (2) the "Well-Stocked" / "Adequate" / "Low Stock" status badge, and (3) the "Current / Min" numeric column. All three say the same thing in different formats.

**Bible Violation:** Section 4.1 — Tufte's Data-Ink Ratio principle: "Every drop of ink must serve the data. If it can be removed without loss of information, remove it." Section 2.3 — Cognitive Load Theory (Sweller): extraneous load from redundant encoding.

**Why This Misleads:** With 93 rows, Sir Dan scanning the table experiences information overload from 279 (93×3) redundant health signals. His eye cannot distinguish the 2-3 items approaching low threshold from the 90 that are fine because every row screams "healthy" in three different visual languages.

**Ideal State:** Keep the StockLevelBar (strongest at-a-glance encoding) and the Current/Min numbers (precise reference). Remove the text badge entirely — the bar color already communicates status. Use the reclaimed column space for a consumption-rate sparkline or "last delivery" timestamp.

**The Owner Story:** "I don't need the page to tell me the same thing three different ways. Show me the number, show me the bar. If it's red, I'll notice."

---

##### [03] Category column repeats "Meats" under protein group headers — pure chartjunk

**What:** Every item row under the "Beef (5 items)" group header displays "Meats" in the Category column. The header already communicates the category and protein type. The column adds zero new information for grouped meat items.

**Bible Violation:** Section 4.1 — Tufte's Data-Ink Ratio: "Erase redundant data-ink." Section 10.8 — Chartjunk anti-pattern.

**Why This Misleads:** It doesn't directly mislead, but it wastes horizontal space on a 1024px tablet viewport that could show more useful information (e.g., last delivery date, consumption rate, batch expiry).

**Ideal State:** For items rendered under a protein group header, suppress the Category column or replace it with the protein sub-type (e.g., "Bone-In", "Boneless") for additional detail. For non-meat categories (Drinks, Sides, Pantry), retain the category label.

**The Owner Story:** "I already know it's beef — I clicked on the Beef section. Don't waste my screen telling me what I can see from the header."

---

##### [04] 93 items in a flat scrollable list with no prioritization or pagination

**What:** The inventory table renders all 93 items for the branch in a single scrollable table. There is no pagination, no virtualization, and no "attention required" prioritization. All protein groups default to expanded. The page loads to "all green" with no focal point.

**Bible Violation:** Section 3.1 — Shneiderman's Mantra: "Overview first, then zoom and filter, then details-on-demand." The page skips the overview and dumps all details immediately. Section 2.2 — Miller's Law: 7±2 chunks. 93 items far exceeds working memory capacity.

**Why This Misleads:** Boss Chris opens the page and sees a wall of green "Well-Stocked" badges. After a few scrolls with no red or yellow, he closes the page assuming all is fine. If items #74 and #81 are approaching low threshold, they are invisible without active scrolling. Dashboard blindness sets in — the page trains the user to stop looking.

**Ideal State:** Default view collapses all groups. Show a summary line per group: "Beef: 5 items, all OK" with expand-on-click. If any items are Low or Critical, those groups auto-expand and those items sort to the top. Add a "Needs Attention" section at the top that surfaces: items within 20% of minLevel, items with expiring batches, items with no delivery in 48 hours.

**The Owner Story:** "93 items all green means I'm wasting my time scrolling. If nothing needs attention, tell me in one line. If something does, put it at the top — don't make me hunt for it."

---

##### [05] Donut charts in protein group headers use perceptually weak encoding

**What:** Each protein group header (Beef, Pork, Chicken) contains a donut chart showing proportional stock distribution across variants (e.g., Beef Bone-In 30%, Beef Bone-Out 21%). The user must compare arc lengths to understand relative proportions.

**Bible Violation:** Section 4.4 — Cleveland & McGill perception ranking places "angle" and "area" at ranks 5-6 (out of 7). Section 4.5 — "The Case Against Pie Charts." Donut charts are hollow pie charts with the same perceptual weaknesses.

**Why This Misleads:** Sir Dan cannot accurately compare "Beef Bone-In 30%" vs. "Beef Trimmings 19%" from arc lengths — the difference appears smaller than it is. With 5 segments, the donut becomes a decorative element rather than an analytical tool. The legend showing top 3 variants with numbers is actually more useful than the chart itself.

**Ideal State:** Replace the donut with a compact horizontal stacked bar showing variant proportions. Or, since the legend already shows the top 3 values as plain numbers, remove the chart entirely and show a compact table: variant name + current stock + mini bar. The freed space could show total group consumption for the day.

**The Owner Story:** "I don't need a pie chart to know how much beef I have. Just show me the numbers — which cut am I running low on?"

---

##### [06] Spoilage/expiry alerts are computed but never displayed on this page

**What:** The store function `getSpoilageAlerts()` in `stock.svelte.ts` (line 479) correctly filters deliveries where `daysLeft ≤ 3` and returns items with expiry risk. However, the `InventoryTable.svelte` component never calls this function. Items with batches expiring tomorrow are visually identical to items with no expiry date.

**Bible Violation:** Section 6 — Data Integrity: "Data that exists but is not displayed creates a false sense of completeness." Section 3.1 — Shneiderman: the overview must surface exceptions. This is also a PRD gap — Module 2 requires "generation of variance and accuracy reports detailing received vs. sold, loss sources."

**Why This Misleads:** Boss Chris sees 93 green items and concludes nothing needs action. Meanwhile, the Kimchi delivery (batch B-243) expires in 2 days and should be prioritized for service tonight. The data exists in the database but the UI hides it. If the Kimchi spoils, the loss is directly attributable to the page not surfacing the alert.

**Ideal State:** Add a "Spoilage Alert" banner at the top of the inventory page when any batches expire within 3 days. Show: item name, batch number, days until expiry, remaining qty. Make it visually distinct (amber/red background) and position it above the health strip so it's the first thing seen. Wire `getSpoilageAlerts()` into the component.

**The Owner Story:** "If my Kimchi is about to expire, I need to know NOW — not discover it tomorrow morning when it's already in the trash. The system has the expiry dates. Why isn't it telling me?"

---

##### [07] "1 minute ago" timestamp on every item creates false data freshness impression

**What:** Every inventory row shows "1 minute ago" in the `updatedAt` sub-text because all items share the same seed timestamp. In production, this would mean all 93 items were last modified at the exact same moment — which is implausible. The timestamp occupies space on every row without providing meaningful information.

**Bible Violation:** Section 6.4 — Timestamp Consistency: "Timestamps must represent meaningful business events, not system artifacts." Section 5.3 — Data freshness indicators should reflect the last meaningful change, not the last system write.

**Why This Misleads:** Sir Dan sees "1 minute ago" and assumes the stock level was just verified. In reality, the stock level is a computed value (openingStock + deliveries - deductions - waste), which updates reactively. The timestamp reflects when the stock_item record was last touched, not when the last physical count or delivery occurred. This creates a false sense of real-time accuracy.

**Ideal State:** Replace "1 minute ago" with the last meaningful event: "Last delivery: 6h ago" or "Last count: 10:00 AM" or "Last deduction: 2 orders ago." If no event has occurred, show nothing — silence is more honest than a misleading timestamp.

**The Owner Story:** "Every item says 'just updated' but nobody actually counted. I want to know when someone ACTUALLY touched the stock — when was the last delivery, the last count, the last deduction?"

---

##### [08] All-Locations view repeats full inventory tables with no cross-branch comparison

**What:** When the owner selects "All Locations," the page shows branch summary cards (good: item count, critical/low badges, meat kg total) followed by three full inventory tables — one per location — stacked vertically. Each table repeats the same 90+ rows with the same columns.

**Bible Violation:** Section 7.1 — "Four Types of Comparison": the most valuable comparison for multi-branch is side-by-side (branch A vs. branch B for the same item). Stacking three full tables forces the owner to scroll between locations and mentally compare numbers. Section 2.3 — Split-attention effect (Sweller): the user must hold Branch A's pork stock in working memory while scrolling to Branch B.

**Why This Misleads:** Boss Chris wants to know: "Does Panglao have enough pork for tonight, or should I transfer from Alta Citta?" With stacked tables, he must scroll to Alta Citta's pork section, memorize 48,436g, then scroll all the way to Panglao's pork section and compare. By the time he arrives, the number is fuzzy in memory.

**Ideal State:** The All-Locations view should show a comparison table: one row per stock item, with columns for each location's current stock. Example: "Pork Bone-In | Alta Citta: 48,436g | Panglao: 42,312g | Warehouse: 50,000g | Δ: tag has 14% more." Items with large inter-branch imbalances sort to the top. The branch summary cards at the top are excellent — keep them.

**The Owner Story:** "I switch to All Locations to compare branches, not to see the same table three times. Put them side by side so I can spot where to send the transfer truck."

---

##### [09] Weight units not auto-promoted — "38,191 g" harder to scan than "38.2 kg"

**What:** All meat items display weights in grams regardless of magnitude. Items show values like "38,191 g", "48,436 g", "36,696 g" — all above 1,000g. The donut chart center label does auto-promote (showing "125.7k"), proving the pattern is known, but item rows do not follow it.

**Bible Violation:** Section 9.6 — Locale and Number Formatting: "Use appropriate units for the magnitude. Auto-promote units when crossing thresholds (g→kg at 1000)." Section 4.1 — Data-Ink Ratio: using 6 digits ("38,191") when 4 characters ("38.2 kg") communicate the same information at appropriate precision.

**Why This Misleads:** When scanning a column of 5-digit gram values, Boss Chris cannot quickly compare items: is 38,191 much more than 35,622? The cognitive effort of parsing five-digit numbers slows decision-making. Kilogram values (38.2 vs. 35.6) are immediately comparable because they reduce to 3 significant figures.

**Ideal State:** Auto-promote to kg for values ≥ 1,000g. Show "38.2 kg" in the main display and "(38,191 g)" in a tooltip or detail view for precision. Keep gram display for values under 1,000g. The donut chart's "125.7k" pattern should extend to item rows: use formatWeight() helper that auto-promotes.

**The Owner Story:** "When the warehouse sends me a delivery slip it says '8 kg' not '8,000 grams.' My brain works in kilos for bulk meat. Show me kilos."

---

##### [10] No "Needs Attention" summary — page lacks an actionable focal point

**What:** The page opens with the health strip (overview) then immediately dumps into the full item table. There is no intermediate "Needs Attention" section that surfaces the 2-3 items that actually require a decision. The health strip filter buttons for "Low Stock" and "Critical" are dimmed (opacity-40) because counts are zero, making them look disabled.

**Bible Violation:** Section 3.1 — Shneiderman's Mantra: "Overview first, zoom and filter." The page goes from overview (health strip) straight to maximum detail (93 rows) with no intermediate zoom level. Section 7.7 — Exception-Based Reporting: "Surface anomalies first, then allow drill-down to detail."

**Why This Misleads:** The page communicates "nothing to see here" when in fact there may be items within 20% of their minLevel that should trigger preemptive restocking. The binary ok/low/critical threshold means an item at 26% of minLevel (status: "ok") looks identical to an item at 500% of minLevel. There's no "approaching low" state.

**Ideal State:** Add a collapsible "Needs Attention" section between the health strip and the item table. Contents: (1) Items within 20% of minLevel threshold, (2) Batches expiring within 3 days (spoilage alerts), (3) Items with no delivery in 48+ hours. If empty, show a single line: "All items within healthy ranges. Last checked: [timestamp]." This becomes the actionable focal point — the reason to open the page.

**The Owner Story:** "Don't make me scroll through 93 items to find the one problem. Put the problems at the top. If there are no problems, say so in one line and let me get back to the floor."

---

## E. Fix Checklist

- [ ] `[01]` — Wire `stockVarianceComparison()` into StockHealthStrip; add trend arrow + "vs. yesterday" delta to each KPI card
- [ ] `[02]` — Remove text status badge column from list view; stock level bar + numbers are sufficient
- [ ] `[03]` — Suppress "Meats" category label for rows under protein group headers; show protein sub-type instead
- [ ] `[04]` — Default all protein groups to collapsed; auto-expand only groups with Low/Critical items; add "Needs Attention" section
- [ ] `[05]` — Replace donut charts with horizontal stacked bars or compact number tables in ProteinGroupHeader
- [ ] `[06]` — Wire `getSpoilageAlerts()` into InventoryTable; add amber/red spoilage banner above health strip
- [ ] `[07]` — Replace "updatedAt" timestamp with last meaningful event (last delivery, last count, or last deduction)
- [ ] `[08]` — Redesign All-Locations view as a cross-branch comparison table (one row per item, columns per location)
- [ ] `[09]` — Add `formatWeight()` utility that auto-promotes g→kg at ≥1000g; apply to all stock displays
- [ ] `[10]` — Add "Needs Attention" section between health strip and item table; surface items within 20% of minLevel + expiring batches
