# Report Audit: Meat Report

| Field | Value |
|---|---|
| **Page** | `/reports/meat-report` |
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
| 1 | Information Hierarchy | CONCERN | Good tab structure (Consumption/Transfers/Conversion), but 7 KPI cards in Consumption violates density ceiling |
| 2 | KPI Card Design | CONCERN | 7 cards in `grid-cols-7` at 1024px — each card ~130px wide, text truncates. No comparison context on any KPI |
| 3 | Chart Selection | PASS | Dual bar (consumed vs waste) and horizontal bar (top cuts by volume) are correct chart types |
| 4 | Data-Ink Ratio | PASS | Clean design, minimal chartjunk, protein group headers add visual structure to the table |
| 5 | Color Encoding | PASS | Pork=orange, Beef=red, Chicken=yellow — consistent and distinguishable. Status dots use green/yellow/red correctly |
| 6 | Comparison Context | FAIL | Zero comparison context anywhere — no "vs yesterday", no targets, no benchmarks. All KPIs are lonely numbers |
| 7 | Cognitive Load | CONCERN | Consumption tab has 7 KPIs + bar chart + horizontal bar + 9-column table with protein groups — high extraneous load |
| 8 | Data Integrity | FAIL | Variance formula produces +86% to +639% for normal-looking data. Transfer chart labels show "(Bulk)" instead of item names |
| 9 | Empty States | CONCERN | Transfer log has good empty state. Consumption/Conversion tabs show charts/tables with zero values instead of empty states |
| 10 | Accessibility | CONCERN | Column headers use `text-[10px]` (10px) — below minimum readable size on tablet. No `aria-label` on status badges |
| 11 | Anti-Patterns | FAIL | Transfer chart has 5 bars labeled "(Bulk)" — useless labels. Variance column shows impossibly high percentages that erode trust |

**Overall: 3/11 PASS, 5 CONCERN, 3 FAIL**

---

## B. Data Flow Map

```
                        ┌─── Consumption Tab ────────────────────────────────────┐
                        │                                                         │
stockItems (Meats)  ──► meatReport(period) ──► rows[] ──┬─► MeatSalesCard (7 KPIs)
deductions          ──►  │ opening, consumed,            ├─► consumptionChartData → ReportBarChart (consumed vs waste)
wasteEntries        ──►  │ waste, closing,               ├─► consumptionRows → ReportHorizBar (top 8 by consumed)
deliveries          ──►  │ variancePct, trend             └─► groupedRows → detail table (9 cols, protein groups)
orders (pax)        ──►  │ byProtein{}, avgPerHead
                         │
                        ├─── Transfers Tab ──────────────────────────────────────┐
                        │                                                         │
deliveries (Transfer)──► transferLog[] ──┬─► Transfer KPIs (IN/OUT/Net/Count)
adjustments (Transfer)──►                ├─► transferChartData → ReportBarChart (IN vs OUT)
                                         ├─► MeatFlowBar (inflow/outflow ledger)
                                         └─► Transfer Log table (7 cols)
                        │
                        └─── Conversion Tab ─────────────────────────────────────┐
                                                                                  │
report.rows ──► revenueChartData → ReportBarChart (revenue by cut)               │
MEAT_ONTOLOGY_NODES ──► MeatOntologyGraph (DAG: primal → processed → portioned) │
                        yield % edges (editable with manager PIN)                 │
```

---

## C. "Best Report" Vision

At 4 PM on a busy Saturday, Boss Chris opens the Meat Report to check if they'll have enough pork for the dinner rush. He sees the **Consumption tab** with a hero KPI: "**21.5 kg served** — 87% of yesterday's full-day consumption with 4 hours still to go." The comparison immediately tells him today is tracking hot.

Below, the protein breakdown shows pork at 14.2 kg consumed (66%) with a "**28% remaining**" progress bar. The bar chart shows consumed vs waste per protein type — pork waste is 1.2 kg (8.5% waste rate), which is within the acceptable 10% threshold. The table below groups by protein with clear Open → In → Used → Waste → Close flow, and variance percentages stay within the ±15% normal range.

On the **Transfers tab**, the Meat Ledger shows exactly where today's meat came from: "Metro Meat Co. delivered 15 kg at 6:30 AM" and "Warehouse transferred 8 kg of Pork Bone-In at 2 PM." The transfer chart shows each **named cut** (not "(Bulk)") with IN bars in green and OUT bars in red.

The **Conversion tab** gives Boss Chris the yield picture: Pork Bone-In → Sliced Pork at 72% yield is on target, but Beef Bone-Out → Sliced Beef at 68% is 5% below the benchmark 73%, flagged with a yellow highlight. He clicks the edge, enters the manager PIN, and adjusts the target to 70% based on the new supplier's quality.

---

## D. Findings

---

##### [01] Transfer chart labels show "(Bulk)" instead of item names

**What:** The transfer chart (`transferChartData`) uses `label: cut.split(' ').at(-1) ?? cut` to create bar labels. For items like "Pork Bone-In (Bulk)", "Beef Bone-Out (Bulk)", etc., this extracts "(Bulk)" as the label. The chart shows 5 bars all labeled "(Bulk)" — completely useless for identifying which meat cut is being transferred.

**Bible Violation:** Section 4.3 — "Direct Labels": Every data point must be unambiguously identifiable. Section 10.5 — "Spaghetti Labels": When multiple chart elements share the same label, the chart communicates nothing.

**Why This Misleads:** Boss Chris opens the Transfers tab to see which cuts are moving between warehouse and branch. He sees 5 identical "(Bulk)" bars of different heights and cannot tell which is pork bone-in vs beef bone-out. He'd need to hover each bar individually to check the tooltip — which may also say "(Bulk)".

**Ideal State:** Use the full cut name (or a short abbreviation like "PK Bone-In", "BF Bone-Out") as the label. If names are long, use a horizontal bar chart instead of vertical bars so labels have room.

**The Owner Story:** "I see five bars all saying '(Bulk)' — which one is my pork? I can't tell. I need to know if we transferred enough beef bone-out to Panglao before the weekend."

---

##### [02] Variance formula produces impossibly high percentages (+86% to +639%)

**What:** The variance formula at `reports.svelte.ts:224` is `(totalConsumed - expectedConsumed) / available * 100`. For cuts with zero consumption but large deliveries, `expectedConsumed = available - closing` can be negative (closing > opening + deliveries due to prior seed data), producing extreme variance values like +589%. Every row shows "Low Turnover" because variance > 10%.

**Bible Violation:** Section 6.1 — "Data Integrity Fundamentals": Metrics must produce values within expected ranges. A variance percentage > ±50% should trigger a data quality alert, not be displayed as-is. Section 6.3 — "Null vs Zero": When there's no consumption, variance is undefined, not +589%.

**Why This Misleads:** Boss Chris sees "+639.2% Avg Variance" in the KPI card and every row showing "Low Turnover" in red. This looks like a catastrophic inventory failure — but it's actually just the formula misbehaving when consumption is near-zero and stock levels are inflated by seed data. The entire table loses credibility.

**Ideal State:** (1) When consumed = 0, display variance as "N/A" or "—", not a percentage. (2) Cap displayed variance at ±100% with a ">" prefix for outliers. (3) Use the standard formula: `(expected - actual) / expected * 100` where expected = opening + deliveries - closing, actual = consumed + waste. (4) Add a data quality indicator when stock counts look anomalous.

**The Owner Story:** "Every single cut says 'Low Turnover' with percentages I've never seen — +589%? That can't be right. I don't trust this report anymore."

---

##### [03] 7 KPI cards in a single row at 1024px (Consumption tab)

**What:** `MeatSalesCard` renders 7 metrics in `grid-cols-7` — Total Sold, Avg/Head, Pork/Head, Beef/Head, Chicken/Head, Pax Served, Avg Variance. At 1024px, each card is ~130px wide. The labels use `text-[10px]` and values use `text-lg` — the cards are extremely cramped.

**Bible Violation:** Section 2.3 — "Miller's Law": 7 items is the absolute ceiling of working memory, and these are dense cards with label + value + sub-label, effectively 21 data points to scan. Section 5.2 — "Card Density": KPI cards need breathing room; dense cards should max at 4-5 per row.

**Why This Misleads:** Not misleading per se, but creates cognitive overload. The user's eye bounces across 7 tiny cards trying to find the one metric they care about. The avg-per-head metrics (Pork, Beef, Chicken) could be collapsed into a single "Protein Mix" card.

**Ideal State:** Reduce to 4-5 KPIs: (1) Total Sold (hero, larger), (2) Avg/Head, (3) Protein Mix (mini bar or stacked indicator), (4) Pax Served, (5) Avg Variance. Use `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` for responsive wrapping.

**The Owner Story:** "I just want to know how much meat we used today and whether that's normal. I don't need to see pork, beef, and chicken per-head all at once — give me the total and let me drill down if I want."

---

##### [04] Zero comparison context on any KPI across all three tabs

**What:** None of the 14 KPIs across the three tabs (7 Consumption, 4 Transfer, 3 Conversion) include any comparison to a prior period, target, or benchmark. "Total Sold: 444g" — is that good or bad? "47.5 kg transferred" — is that normal for a Wednesday?

**Bible Violation:** Section 7.1 — "No Lonely Numbers": Every metric needs context. Section 3.4 — "Grove's Indicator Pairs": Current value must be paired with trend direction and reference value. Section 7.4 — "The Four Types of Comparison": temporal (vs yesterday), spatial (vs other branch), normative (vs target), nominal (vs category average).

**Why This Misleads:** Boss Chris sees "Total Sold: 444g" and has no idea if that's ahead or behind. He'd need to mentally switch to yesterday's numbers, remember them, and compare. This defeats the purpose of having a digital report.

**Ideal State:** Add `salesSummaryWithComparison()`-style comparison to the meat report store. At minimum: "Total Sold: 444g ▼ 62% vs yesterday" for Consumption KPIs. For Transfer KPIs: "vs same day last week". The `KpiCard` component already supports `change` and `prevValue` props (just added in the sales-summary fix).

**The Owner Story:** "444 grams of meat sold today — is that a lot? A little? I have no idea unless I pull up yesterday's report side by side."

---

##### [05] Consumption table has no TOTAL row

**What:** The consumption detail table (9 columns: Cut, Open, In, Used, Waste, Close, Var%, Drift, Status) groups rows by protein type with group headers ("pork — 5 cuts", "beef — 5 cuts") but has no subtotal per group and no grand total row.

**Bible Violation:** Section 5.4 — "Completeness": Tables with numeric columns must include aggregation. Section 8.2 — "Operational Tables": Include subtotals at group boundaries and a grand total at the bottom for quick scanning.

**Why This Misleads:** Boss Chris wants to know "total opening stock across all cuts" or "total waste today" — he'd have to manually add the numbers. The protein group headers create visual groups but don't summarize them.

**Ideal State:** Add a subtotal row after each protein group (Total Pork: Open 27,000g, In +50,099g, Used 0g, Waste 150g, Close 180,371g). Add a grand total row at the bottom with the same columns summed.

**The Owner Story:** "How much total meat did we waste today? I see individual lines but no total. I need the bottom line number to report to the accountant."

---

##### [06] Weight unit auto-promotion inconsistent

**What:** KPI cards show "444g" (grams) while the detail table shows "7,500g", "20,389g", "51,847g". Values above 1,000g should auto-promote to kg (e.g., "51.8 kg"). The horizontal bar chart does this correctly ("0.44 kg"), the Conversion tab nodes do it correctly ("51.8kg"), but the detail table and KPI cards don't.

**Bible Violation:** Section 6.4 — "Units Consistency": All representations of the same metric must use the same unit scale. Mixed "g" and "kg" in the same view forces the user to mentally convert.

**Why This Misleads:** "51,847g" and "51.8 kg" are the same number but look completely different. The comma-separated gram values (51,847g) can be misread as "51.847 kg" or "51,847 kg" depending on locale expectations.

**Ideal State:** Auto-promote to kg when value >= 1000g everywhere: KPI cards, table cells, chart labels. Use `formatKg()` consistently — it already exists in `utils.ts` and does the right thing.

**The Owner Story:** "The table says 51,847g but the conversion graph says 51.8kg — are those the same thing? I had to count commas to be sure."

---

##### [07] Consumption tab shows zero-consumption rows without empty state

**What:** When Pork/Head shows "0g" and all pork rows show "Used: 0g", the table still renders full rows with Open, In, Used=0, Waste, Close, and extreme variance. There's no visual distinction between "no pork was consumed (normal for lunch — dinner hasn't started)" and "something is wrong with pork inventory."

**Bible Violation:** Section 5.4 — "Empty States": Distinguish between zero (measured, value is 0) and null (not yet measured, unknown). Section 6.3 — "Null vs Zero": Display should communicate whether zero is an expected/normal state or an anomaly.

**Why This Misleads:** Boss Chris sees pork consumption at 0g at 2 PM. Is this a problem or is it normal because the dinner rush hasn't started? The report doesn't contextualize. Combined with the +86% variance, it looks alarming when it might be completely fine.

**Ideal State:** For zero-consumption items during live "Today" view: show a muted row with "Not yet served" instead of "0g" in the Used column. Reserve the red status indicators for when expected consumption > 0 but actual = 0 at end of day.

**The Owner Story:** "All the pork shows zero consumed with scary red numbers — is something broken or did we just not start serving pork yet? It's only 2 PM."

---

##### [08] Revenue chart on Conversion tab shows only 1 bar when only one cut has revenue

**What:** The Revenue by Cut chart shows a single bar ("Beef: ₱488.40") because only Sliced Beef has revenue. A single bar chart is a visual anti-pattern — it provides no comparison within the visualization.

**Bible Violation:** Section 10.3 — "Chart of One": A bar chart with a single bar should be replaced with a KPI card or number callout. Charts exist to show relationships between data points; one bar has no relationship.

**Why This Misleads:** Not severely misleading, but wastes vertical space (200px height for one bar) and provides no visual insight beyond what the "Top Cut: Sliced Beef" KPI card already shows.

**Ideal State:** When fewer than 3 items have revenue, collapse the chart and show a compact list or expand the KPI cards to include the revenue breakdown. Only render the bar chart when >= 3 cuts have revenue data.

**The Owner Story:** "I see one lonely bar. What is this chart even showing me that the KPI card above doesn't already say?"

---

## E. Fix Checklist

- [x] `[01]` — Fixed: `shortCutName()` strips " (Bulk)" suffix and abbreviates long names instead of `split(' ').at(-1)`
- [x] `[02]` — Fixed: variance formula uses `(expected - actual) / expected`, capped at ±100%, shows "—" when no activity
- [x] `[03]` — Fixed: MeatSalesCard reduced to 5 KPIs (Total Sold, Avg/Head, Protein Mix, Pax Served, Avg Variance) with `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- [x] `[04]` — Fixed: added `meatReportComparison()` store function; KpiCard now shows `change` + `prevValue` for Today and Week periods
- [x] `[05]` — Fixed: added subtotal row per protein group and bold TOTAL row at bottom with Open/In/Used/Waste/Close sums
- [x] `[06]` — Fixed: all weight displays use `formatKg()` — table cells, KPI cards, chart formatters, transfer log qty
- [x] `[07]` — Fixed: zero-consumption items during live Today show "Not yet" in Used column, "—" in Var%, "Pending" badge in Status
- [x] `[08]` — Fixed: revenue chart shows compact list when < 3 cuts have revenue, full bar chart when >= 3

---

*Audit complete. 8 issues: 3 FAIL dimensions, 5 CONCERN dimensions, 3 PASS dimensions.*
*Bible sections referenced: 2.3, 3.4, 4.3, 5.2, 5.4, 6.1, 6.3, 6.4, 7.1, 7.4, 8.2, 10.3, 10.5*
