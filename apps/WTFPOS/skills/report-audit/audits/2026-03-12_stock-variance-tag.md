# Report Audit: Stock Variance

| Field | Value |
|---|---|
| **Page** | `/reports/stock-variance` |
| **Location** | Alta Citta (Tagbilaran) — `tag` |
| **Date** | 2026-03-12 |
| **Auditor** | report-audit skill v1.0.0 |
| **Bible Version** | DATA_ANALYTICS_BIBLE.md |
| **Viewport** | 1024 x 768 (tablet landscape) |
| **Role** | Owner (Boss Chris) |

---

## A. Data Analytics Scorecard

| # | Dimension | Verdict | Key Finding |
|---|-----------|---------|-------------|
| 1 | Information Hierarchy | PASS | Good visual hierarchy: KPIs → diverging bar chart → alert pill → detail table → footer legend. ReportShell enforces consistent zones |
| 2 | KPI Card Design | CONCERN | 4 KPIs is correct density, but zero comparison context. "Shortage Items: 93" and "Worst Drift: 81.3%" are lonely numbers |
| 3 | Chart Selection | PASS | Diverging horizontal bar chart is the ideal chart type for variance data. SHORTAGE/SURPLUS axis labels are clear. Category color dots in legend |
| 4 | Data-Ink Ratio | PASS | Clean design, minimal chartjunk. Table uses monospace font for numbers, category sub-label in gray. Good use of red highlight row for shortage items |
| 5 | Color Encoding | PASS | Red for shortage (positive drift), green for surplus (negative drift). Category dots (Meats=red, Sides=yellow, Drinks=blue, Dishes=purple) consistent with design system |
| 6 | Comparison Context | FAIL | Zero comparison on any KPI — no "vs yesterday", no target threshold, no benchmark. "Worst Drift: 81.3%" is meaningless without knowing the acceptable range |
| 7 | Cognitive Load | FAIL | 93 items in a flat, unsorted-by-category table with no grouping, no filtering, no pagination. User must scroll through 93 rows to find their items |
| 8 | Data Integrity | CONCERN | Chart labels show raw grams with commas ("−16,660 g") while table shows auto-promoted kg ("16.66 kg"). Summary pill mixes units in aggregate "113.20 kg unaccounted" across g/ml/portions/bottles |
| 9 | Empty States | PASS | VarianceChart has a good empty state ("No variance detected"). Green pill shows "All counted items within expected range" when no shortage. Table shows "No stock items found" when empty |
| 10 | Accessibility | CONCERN | Chart drift labels are `aria-label`'d. But table has no `aria-sort`, no `role="status"` on the alert pill, and no keyboard shortcut to jump to a specific category |
| 11 | Anti-Patterns | CONCERN | Chart truncates long item names ("Tteok (Rice Cak…", "Perilla Leaves …") — truncated labels communicate nothing. Summary pill aggregates mixed units into "kg" which is misleading for ml/portions/bottles items |

**Overall: 4/11 PASS, 4 CONCERN, 2 FAIL, 1 N/A**

---

## B. Data Flow Map

```
                    ┌─── Stock Variance Page ──────────────────────────────────────┐
                    │                                                               │
stockItems      ──► rows[] (filtered by locationId) ──┬─► 4 KPI cards (summary)
stockCounts     ──►  │ getPeriodVariance(itemId, period)│─► VarianceChart (diverging bar, top N)
deductions      ──►  │  → delivered, sold, waste,      ├─► Alert pill (shortage count + total)
waste entries   ──►  │    expected, counted,            └─► Detail table (8 columns, all rows)
deliveries      ──►  │    drift, driftPct
                     │
                    getPeriodVariance():
                     │  delivered = sum(deliveries in period)
                     │  sold = sum(deductions in period)
                     │  waste = sum(waste entries in period)
                     │  expected = opening + delivered - sold - waste
                     │  counted = stockCounts[pm4 ?? am10]
                     │  drift = expected - counted
                     │  driftPct = (drift / expected) * 100
```

---

## C. "Best Report" Vision

At 4 PM, Boss Chris opens Stock Variance to check if today's physical count matches expectations. The hero KPI shows "**6 shortage items** — down from 11 yesterday" with a green down arrow, telling him the team is improving. The "Worst Drift" card says "**12.3%** (Pork Bone-In)" with the item name inline, so he knows exactly what to investigate.

The diverging bar chart shows only the 8 items with meaningful variance (>5%), with full item names. Items within the normal ±5% threshold are hidden by default, with a toggle to "Show all items." The shortage bars are red, surplus bars are green, and the center line is labeled "EXPECTED."

Below the chart, the detail table is **grouped by category** (Meats, Sides, Pantry, Drinks) with collapsible sections. Each group has a subtotal row. A filter bar lets Boss Chris quickly narrow to "Meats only" or "High drift only (>10%)." The table footer shows a **grand total row** with total expected vs. total counted.

The summary pill contextualizes: "6 items with shortage — **3.2 kg** unaccounted (meats only) + **450 ml** (liquids)." Separate totals by unit type, never mixed.

---

## D. Findings

---

##### [01] Zero comparison context on all 4 KPI cards

**What:** "Items Tracked: 93", "Items Counted: 93", "Shortage Items: 93", "Worst Drift: 81.3%" — all standalone numbers. No comparison to yesterday, last week, or any target. The `KpiCard` component supports `change` and `prevValue` props (already wired in other reports like Sales Summary and Meat Report), but they are not used here.

**Bible Violation:** Section 7.4 — "No Lonely Numbers": Every metric needs a reference point. Section 3.3 — "Grove's Indicator Pairs": Current value must be paired with trend direction.

**Why This Misleads:** Boss Chris sees "93 shortage items" and "81.3% worst drift" but has no idea if this is normal, improving, or getting worse. Is 81.3% drift always this high? Was it 90% yesterday (improving) or 20% yesterday (catastrophic)?

**Ideal State:** Add comparison to previous period: "Shortage Items: 93 ▲ 5 vs yesterday". "Worst Drift: 81.3% ▼ from 90.1%". Use the existing `getPeriodVariance()` with previous-period bounds, similar to `salesSummaryWithComparison()`.

**The Owner Story:** "93 shortage items — is that normal for us? I need to know if we're getting better or worse at inventory accuracy."

---

##### [02] 93-row flat table with no category grouping or filtering

**What:** The detail table renders all 93 stock items in a single flat list sorted only by drift magnitude. Meats, Sides, Pantry, Drinks, and Dishes are interleaved. There is no category filter, no grouping headers, no subtotals, and no way to collapse sections. The user must scroll through 93 rows to find specific items.

**Bible Violation:** Section 2.2 — "Miller's Law": 93 items far exceeds the 7±2 cognitive capacity. Section 8.4 — "Drill-Down Paths": Long tables should support progressive disclosure. Section 5.3 — "Progressive Disclosure": Start with summary, let users drill into detail.

**Why This Misleads:** Not misleading per se, but creates severe cognitive overload. Boss Chris wants to check "how are my meats doing?" — he has to visually scan past all 93 rows, mentally filtering by the category sub-label. The table becomes a wall of numbers.

**Ideal State:** Group rows by category with collapsible group headers (like the Meat Report's protein groups). Add a filter bar with category buttons: "All | Meats | Sides | Pantry | Drinks | Dishes." Add subtotal rows per category. Consider showing only high-drift items (>10%) by default with a "Show all" toggle.

**The Owner Story:** "I just want to see the meats — but I have to scroll past 20 sides items and 15 pantry items to find them. Give me a filter."

---

##### [03] Chart labels show raw grams while table shows auto-promoted kg

**What:** The VarianceChart displays drift values as raw grams with commas: "−16,660 g", "−9,420 g". The detail table correctly auto-promotes via `fmtQty()`: "16.66 kg", "9.42 kg". The page's own `fmtQty()` function auto-promotes at 1000g, but the chart's drift labels use the raw `drift` number with the item's base unit.

**Bible Violation:** Section 6.4 (mapped from "Units Consistency"): All representations of the same metric must use the same unit scale. Section 9.4 — "Number Legibility": "16,660 g" with comma-as-thousands separator can be misread as "16.660 g" in locales using comma as decimal.

**Why This Misleads:** Boss Chris sees "−16,660 g" on the chart and "16.66 kg" in the table. Are those the same number? The comma-separated gram values in the chart look dramatically different from the kg values in the table, creating unnecessary cognitive translation.

**Ideal State:** Use the same `fmtQty()` function (or equivalent) for chart labels so they display "−16.66 kg" instead of "−16,660 g". Consistent units everywhere.

**The Owner Story:** "The chart says minus 16,660 grams but the table says plus 16.66 kilograms — I had to do math in my head to realize those are the same thing."

---

##### [04] Summary pill aggregates mixed units into "kg"

**What:** The summary alert pill shows: "93 items with missing stock — 113.20 kg unaccounted." This 113.20 kg is computed by summing drift across ALL items — including items measured in ml, portions, bottles, and blocks. The code at line 145 grabs the unit from `rows.find(r => (r.drift ?? 0) > 0)?.item.unit ?? 'g'` — it uses the unit of the first shortage item, which happens to be grams, and formats the total as kg. But the total includes 3,420 ml of Cooking Oil, 1,576 ml of soy sauce, 14 portions of Cheesy Tteokbokki, etc.

**Bible Violation:** Section 6.1 — "Data Quality Dimensions": Accuracy requires that aggregations are dimensionally valid. You cannot sum grams and milliliters and call the result "kg." Section 10.3 — "False Precision": The total appears precise (113.20 kg) but is dimensionally meaningless.

**Why This Misleads:** Boss Chris reads "113.20 kg unaccounted" and thinks that's 113 kg of missing meat/food. In reality, it's a meaningless sum of grams + milliliters + portions + bottles + blocks all dumped into one number. This severely overstates the weight-based shortage.

**Ideal State:** Either (a) show separate totals by unit type: "62.3 kg (solids) + 12.4 L (liquids) + 38 portions unaccounted", or (b) show only the count: "93 items with missing stock", or (c) show cost-based total: "₱12,340 unaccounted" using item costs.

**The Owner Story:** "113 kilograms unaccounted? That's like two whole deliveries! Wait... that includes liters of soy sauce and portions of tteokbokki counted as kilograms? That number is wrong."

---

##### [05] Chart truncates long item names

**What:** The VarianceChart truncates item names that exceed the available label width: "Tteok (Rice Cak…", "Perilla Leaves …". At 1024px viewport with the sidebar, the chart area is approximately 700px wide, and item name labels are allocated about 150px.

**Bible Violation:** Section 4.3 — Cleveland & McGill: Labels must be unambiguously identifiable. Truncated labels with "…" provide incomplete information that requires the user to hover/guess.

**Why This Misleads:** Boss Chris sees "Perilla Leaves …" and can guess it's Perilla Leaves (Kkaennip), but "Tteok (Rice Cak…" could be Tteok (Rice Cakes) or something else. In a fast-paced environment, truncated labels slow decision-making.

**Ideal State:** Use abbreviations instead of truncation: "Tteok (Rice Cakes)" → "Rice Cakes", "Perilla (Kkaennip)" → "Perilla". Or increase label width and reduce bar chart width. Or use a tooltip on hover for the full name.

**The Owner Story:** "What's 'Tteok (Rice Cak…'? I know it's probably rice cakes but why can't it just say the full name?"

---

##### [06] No TOTAL row at the bottom of the table

**What:** The 93-row detail table has column headers (Item, Delivered, Sold, Waste, Expected, Counted, Drift, Drift %) but no totals row. The user cannot see aggregate delivered, sold, waste, or drift at a glance. This was already fixed in the Meat Report (audit [05]) but not applied here.

**Bible Violation:** Section 5.1 — "Anatomy of a Report Page": Tables with numeric columns must include aggregation. Section 8.5 — "Inventory Flow Accounting": Open → In → Out → Close must balance, and the totals row proves (or disproves) the balance.

**Why This Misleads:** Boss Chris wants "total delivered today" or "total waste today" across all items — he'd have to mentally sum 93 rows. Even worse, mixed units (g, ml, portions) make a simple total meaningless, which is itself a sign that the table needs category grouping with per-category totals.

**Ideal State:** Add category subtotal rows (Total Meats, Total Sides, etc.) and a grand total row. For mixed-unit categories, show separate unit subtotals. At minimum, show a count-based summary: "Total shortage items: 93 / 93."

**The Owner Story:** "How much total stock did we receive today? I'd have to add up 93 numbers. Just give me the total."

---

##### [07] "Live" indicator always shows on "Today" but no auto-refresh mechanism visible

**What:** The ReportFilterBar shows a green "Live" dot next to the "Today" button, suggesting real-time data. However, the page data is computed via `$derived()` which only reacts to store changes — there's no periodic polling or SSE subscription to push new stock count data. The "Live" indicator sets an expectation of real-time updates that may not be fulfilled if stock counts are entered on another device.

**Bible Violation:** Section 5.5 — "Real-Time vs. Periodic Reports": If a report claims to be "Live", the data refresh mechanism must match the claim. A stale "Live" indicator erodes trust.

**Why This Misleads:** Boss Chris sees "Live" and assumes the variance data updates instantly when someone enters a stock count on another tablet. In Phase 1 (single-device RxDB), this is true only if counts are entered on the same device. The "Live" label overpromises for multi-device scenarios.

**Ideal State:** The "Live" indicator is appropriate for Phase 1 single-device operation. However, add a "Last updated: 2:34 PM" timestamp next to it so the user knows when data was last computed. In Phase 2+, wire it to SSE/Ably for actual push updates.

**The Owner Story:** "It says Live but the numbers haven't changed since this morning. Did anyone enter the PM count yet?"

---

## E. Fix Checklist

- [x] `[01]` — Fixed: `stockVarianceComparison()` in stock.svelte.ts feeds `change`/`prevValue` to Shortage Items and Worst Drift KPI cards
- [x] `[02]` — Fixed: category filter bar (All/Meats/Sides/Pantry/Drinks/Dishes) + collapsible group headers with shortage counts
- [x] `[03]` — Fixed: VarianceChart uses `fmtDrift()` that auto-promotes g→kg at 1000 and ml→L at 1000, matching table's `fmtQty()`
- [x] `[04]` — Fixed: summary pill shows separate totals per unit type ("62.30 kg + 12.42 L + 38 portions unaccounted")
- [x] `[05]` — Fixed: `shortLabel()` strips parenthetical suffixes and abbreviates ("Tteok (Rice Cakes)" → "Tteok", "Perilla Leaves (Kkaennip)" → "Perilla Leaves")
- [x] `[06]` — Fixed: category subtotal rows for same-unit groups with Delivered/Sold/Waste/Expected/Counted/Drift sums
- [x] `[07]` — Fixed: "Updated HH:MM" timestamp in ReportFilterBar actions slot next to Live indicator

---

*Audit complete. 7 issues: 2 FAIL dimensions, 4 CONCERN dimensions, 4 PASS dimensions.*
*Bible sections referenced: 2.2, 3.3, 4.3, 5.1, 5.3, 5.5, 6.1, 6.4, 7.4, 8.4, 8.5, 9.4, 10.3*
