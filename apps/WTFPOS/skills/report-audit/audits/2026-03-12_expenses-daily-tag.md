# Report Audit: Expenses Daily

| Field | Value |
|---|---|
| **Page** | `/reports/expenses-daily` |
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
| 1 | Information Hierarchy | PASS | Clean ReportShell flow: filter → KPIs → trend chart → category breakdown (horiz bar + table) → MoM section. Progressive disclosure: MoM only for "This Month" |
| 2 | KPI Card Design | CONCERN | 4 KPIs is correct density. Total Expenses has `change` badge (+31.5% vs prev). But Total Sales, Net Cash Flow, and Expense Ratio are lonely numbers — no comparison context |
| 3 | Chart Selection | PASS | Bar chart for daily/monthly trend is correct. Horizontal bar for category breakdown is correct. Both use red color encoding for expenses |
| 4 | Data-Ink Ratio | PASS | Clean design, proportion bars in table add visual weight without clutter. Category icons add scanability. TOTAL row present |
| 5 | Color Encoding | PASS | Red for expenses throughout (KPI border, chart bars, proportion bars). Green for positive net cash flow, red for negative. Consistent |
| 6 | Comparison Context | CONCERN | Total Expenses has comparison badge. Other 3 KPIs have none. MoM section provides comparison for "This Month" only — no comparison for "Today" or "This Week" breakdown |
| 7 | Cognitive Load | PASS | Well-structured — categories are pre-grouped, table is compact (11 categories max). MoM section only appears when relevant |
| 8 | Data Integrity | FAIL | Expense Ratio shows "125.8%" for Today — meaning expenses exceed sales. This is plausible if procurement expenses are frontloaded, but no explanation is given. MoM shows ₱0 for "Last Month" when no data exists, making all change% = 0.0% and status = "Stable" — misleading |
| 9 | Empty States | CONCERN | Category table has "No expenses recorded for this period" empty state. But the MoM section doesn't distinguish "₱0 because no data" from "₱0 because no expenses" — Last Month showing ₱0.00 with "Stable" badge when there's simply no prior-month data |
| 10 | Accessibility | CONCERN | Category icons are emoji-only with no alt text. No `aria-label` on proportion bars. Form category pills lack `aria-pressed` state |
| 11 | Anti-Patterns | CONCERN | Proportion bar `width` uses `pctOfSales * 2` as a scaling factor — when pctOfSales > 50%, the bar reaches 100%. Meat & Protein at 118.5% of sales produces a 100% bar, same as Rent at 13.1% × 2 = 26.2%. The visual proportion is distorted |
| 12 | Data Schema Cohesion | PASS | All displayed metrics trace cleanly to `expenses` schema (category, amount, paidBy, locationId, createdAt). `expenseSummaryWithComparison()` correctly uses `comparePeriods()` + `getPreviousBounds()`. Categories match `expenseCategoryGroups` |

**Overall: 6/12 PASS, 4 CONCERN, 1 FAIL, 1 N/A**

---

## B. Data Flow Map

```
                    ┌─── Expenses Daily Page ────────────────────────────────────────┐
                    │                                                                 │
allExpenses      ──► filteredExpenses (locationId + period filter)                    │
  (RxDB query)      │                                                                │
                    ├─► totalExpenses = sum(amount)                                   │
                    │                                                                │
expenseSummary   ──► kpiData { total: PeriodComparison, sales, netCashFlow,          │
WithComparison()    │          expenseRatio }                                        │
                    │                                                                │
                    ├─► 4 KPI Cards (Total Expenses*, Total Sales, Net Cash Flow,    │
                    │                 Expense Ratio)                                  │
                    │                                                                │
expensesByDay    ──► chartData → ReportBarChart (daily or monthly bars)              │
ForChart()          │                                                                │
                    ├─► filteredItems (by category) → ReportHorizBar + Table          │
                    │                                                                │
                    └─── MoM Section (period === 'month' only) ─────────────────────┐
                                                                                     │
currentMonth     ──► momRows[] (per category: current, previous, variance, flagged)  │
Expenses            │                                                                │
prevMonth        ──► momTotalCurrent, momTotalPrevious, momTotalVariance             │
Expenses            └─► MoM KPIs + MoM Table (5 cols, flagged spikes)               │

Schema: expenses { id, category, amount, description, paidBy, locationId, createdBy, createdAt, expenseDate?, receiptPhoto?, updatedAt }
```

---

## C. "Best Report" Vision

At 6 PM, Boss Chris opens the Expenses page to review today's spending before closing. The hero KPI shows **"₱25,708 spent today — ▲ 31% vs yesterday"** with the comparison immediately telling him today was heavier. Next to it, **"Net Cash Flow: -₱5,273"** is flagged red with context: **"Expenses exceed sales by ₱5,273 — procurement day?"** — the system recognizes that meat procurement typically frontloads early-week expenses.

The category breakdown shows **Meat & Protein** dominating at ₱17,680 (69% of expenses), with a properly scaled bar proportional to total expenses (not sales). Boss Chris taps the Meat & Protein row and sees a drill-down: 3 entries today — "Metro Meat Co. delivery ₱12,000", "Market liempo ₱3,280", "Sari-sari supplements ₱2,400".

When he switches to "This Month", the MoM section intelligently detects that last month has no data: **"Last Month: No data — first full month of tracking."** Instead of showing ₱0.00 and fake "Stable" badges, it shows a progress indicator: "11 days tracked this month, ₱106K logged."

The **Expense Ratio** KPI shows "152.4%" with clear context: **"above 100% = spending more than earning. Target: ≤40%"** — so Boss Chris knows exactly what the benchmark is.

---

## D. Findings

---

##### [01] MoM section shows ₱0 "Last Month" with "Stable" badge when no prior data exists

**What:** The Month-over-Month table shows "Last Month: ₱0.00" for every category, with "0.0%" change and green "Stable" badge across all 11 rows. This happens because there are no expense records from February (seed data starts in March). The variance formula `previous > 0 ? ((current - previous) / previous) * 100 : 0` returns 0% when previous is 0, then the status logic `variance === 0 → "Stable"` marks everything as stable.

**Bible Violation:** Section 6.2 — "Null vs. Zero vs. Missing": ₱0.00 last month means "no data recorded" not "zero expenses." Section 7.4 — "No Lonely Numbers": A comparison against ₱0 is meaningless. Section 8.2 — "Exception-Based Reporting": The status badges should flag the absence of data, not declare stability.

**Why This Misleads:** Boss Chris sees "Stable" on every category and thinks month-over-month spending is consistent. In reality, there's no prior month to compare against. The MoM section creates a false sense of normalcy when it should say "insufficient historical data."

**Ideal State:** When `momTotalPrevious === 0` and no records exist for the previous month, show a banner: "No expense data for last month — MoM comparison unavailable." Or: "First month of tracking — MoM comparison will be available next month." Hide the table or grey it out.

**The Owner Story:** "Everything says 'Stable' — great! Wait... last month is ₱0 for everything? That's not stable, that's empty. We didn't track anything last month."

---

##### [02] Expense Ratio of 125.8%/152.4% shown without benchmark or explanation

**What:** The Expense Ratio KPI shows "125.8%" (Today) or "152.4%" (This Month) with sub-label "of net sales." An expense ratio above 100% means the business is spending more than it earns — a critical signal — but there's no benchmark, no target, and no explanation of what this ratio should be.

**Bible Violation:** Section 7.4 — "No Lonely Numbers": The ratio needs a reference point. Section 3.3 — "Grove's Indicator Pairs": Pair the metric with a target. Section 3.5 — "Actionable vs. Vanity Metrics": Without a target, the expense ratio is a vanity metric.

**Why This Misleads:** Boss Chris sees "125.8%" and doesn't know if that's normal for a procurement day, or alarming. In the restaurant industry, expense ratio targets are typically 30-40% for food cost and 60-70% total. Showing 125% without context creates either panic or complacency.

**Ideal State:** Add a benchmark line: "Target: ≤65%" or "Industry avg: 60-70%". Color-code: green ≤60%, yellow 60-80%, red >80%. For days with heavy procurement (Meat & Protein > 50% of expenses), show a contextual note: "Procurement-heavy day — ratio will normalize over the week."

**The Owner Story:** "152.4% expense ratio — should I be worried? What's normal? I know we bought a lot of meat today but I don't know if that's okay."

---

##### [03] Total Sales, Net Cash Flow, and Expense Ratio KPIs lack comparison context

**What:** Only the "Total Expenses" KPI card uses the `change` prop (+31.5% vs prev period). The other three KPIs — Total Sales, Net Cash Flow, and Expense Ratio — show raw values with no comparison badge, no `prevValue`, and no trend indicator. The `expenseSummaryWithComparison()` function returns `total` (with comparison) and `sales` (raw number), but doesn't compute comparison for sales, cash flow, or ratio.

**Bible Violation:** Section 7.4 — "No Lonely Numbers": Every metric needs comparison. Section 3.3 — "Grove's Indicator Pairs": Current + trend for all operational KPIs.

**Why This Misleads:** Boss Chris sees "₱20,435 Total Sales" today but doesn't know if that's up or down. "Net Cash Flow: -₱5,273" — was it worse yesterday? Better? The expense KPI tells him expenses are up 31.5%, but he can't see if sales compensated.

**Ideal State:** Extend `expenseSummaryWithComparison()` to return comparison data for `sales`, `netCashFlow`, and `expenseRatio`. Wire all 4 KPIs with `change` and `prevValue` props.

**The Owner Story:** "Expenses are up 31% — but are sales up too? I need to see both sides to know if the net position is improving or worsening."

---

##### [04] Proportion bar scaling uses `pctOfSales * 2` — distorts visual representation

**What:** The proportion column in the category table uses `style="width: {Math.min(item.pctOfSales * 2, 100)}%"`. This means the bar width is capped at 100% when `pctOfSales ≥ 50%`. Meat & Protein at 86.5% of sales gets a 100% bar (86.5 × 2 = 173 → capped at 100). Rent at 13.1% gets a 26.2% bar. The visual ratio between Meat & Protein and Rent is ~4:1, but the actual ratio is ~6.6:1.

**Bible Violation:** Section 4.7 — "Honest Charts": Bar widths must be proportional to values. Section 4.1 — Tufte's "Lie Factor": Visual distortion = (visual ratio / data ratio). Here: 4/6.6 = 0.61 — a significant under-representation of the dominant category.

**Why This Misleads:** The proportion bars visually flatten the dominance of Meat & Protein. Boss Chris glances at the bars and sees Meat & Protein looking "full" (100%) and Rent looking "about a quarter" — he underestimates how much more Meat & Protein dominates because the cap compresses the scale.

**Ideal State:** Scale bars proportional to the **maximum category amount** (not % of sales × 2). Use: `width: {(item.amount / maxCategoryAmount) * 100}%`. This makes the largest category = 100% and all others proportionally correct.

**The Owner Story:** "The bars make it look like Rent is about a quarter of Meat spending, but the numbers say ₱2,667 vs ₱17,680 — that's more like one-seventh."

---

##### [05] No individual expense log / line items visible on the report

**What:** The page shows category totals but never shows individual expense entries. Boss Chris can see "Meat & Protein: ₱17,680" but cannot see the 3 or 4 entries that make up that total. There's no drill-down, no expandable rows, and no separate "Expense Log" section showing the chronological list of entries.

**Bible Violation:** Section 3.1 — Shneiderman's Mantra: "Overview first, zoom and filter, then details-on-demand." The page provides overview and filter but no details-on-demand. Section 8.4 — "Drill-Down Paths": Category totals should link to underlying entries.

**Why This Misleads:** Not misleading per se, but a major operational gap. Boss Chris wants to know: "Who logged the ₱17,680 in Meat today? Was it one big purchase or many small ones? What's the description?" He has to mentally reconstruct from memory or check elsewhere.

**Ideal State:** Add a collapsible "Recent Entries" section below the category table showing the most recent 10-20 expense line items (timestamp, category, amount, description, logged by). Or: make category rows clickable to expand and show the underlying entries.

**The Owner Story:** "Meat & Protein ₱17,680 — but who logged this? Was it the morning delivery or did someone sneak in a personal purchase? I can't tell without seeing the individual entries."

---

##### [06] Entry form has 4 payment methods but report has no payment method breakdown

**What:** The Log New Expense form offers 4 payment methods: "Cash from Register", "GCash", "Maya", "Personal Cash". The `paidBy` field is stored in every expense record. However, the report page never shows any breakdown by payment method — no chart, no table column, no filter. This data is collected but invisible.

**Bible Violation:** Section 3.5 — "Actionable vs. Vanity Metrics": Collecting data without displaying it creates a disconnect. The `paidBy` field implies the owner wants to track payment source, but the report ignores it.

**Why This Misleads:** Boss Chris carefully selects "Cash from Register" vs "GCash" vs "Personal Cash" when logging expenses, thinking this matters for reconciliation. But the report never shows this breakdown. He can't answer: "How much came out of the register today?" or "How much do I need to reimburse from Personal Cash?"

**Ideal State:** Add a "Payment Method" secondary breakdown — either as a column in the category table, a small horizontal bar chart, or a KPI showing "₱X from Register / ₱Y from GCash / ₱Z Personal." This would complete the cash reconciliation picture.

**The Owner Story:** "I log every expense as 'Cash from Register' or 'Personal Cash' so I know what to reimburse at end of day — but where do I see that total? The report doesn't tell me."

---

##### [07] "All" period chart shows 11 months of zero data with one spike

**What:** When period is "All", the chart shows "Monthly Expenses" for the last 12 months (Apr 2025 → Mar 2026). Eleven months show ₱0 (no data), and only March 2026 has a bar (~₱108K). This creates a misleading visual — the chart looks like a sudden spike from zero rather than simply "we started tracking this month."

**Bible Violation:** Section 5.4 — "Empty States": Charts with predominantly zero data should communicate "no data" not "zero spending." Section 10.4 — "Misleading Axes": The Y-axis scales to ₱200k, making the single bar look like an anomaly.

**Why This Misleads:** Boss Chris opens "All" and sees what looks like a sudden expense explosion in March — 11 months of nothing, then ₱108K. The chart implies the business went from zero expenses to ₱108K, when in reality expenses have always existed but weren't tracked digitally.

**Ideal State:** For the "All" period, only show months that have data (start the chart from March 2026, or whenever the first expense was logged). Or show a note: "Tracking since March 2026 — prior months have no data." Consider trimming the chart to the data range.

**The Owner Story:** "Why does it look like we had zero expenses for a year and then suddenly spent ₱108K? We've always had expenses — we just started logging them digitally this month."

---

## E. Fix Checklist

- [x] `[01]` — Fixed: `hasPrevMonthData` derived detects empty previous month; MoM section shows "No expense data for the previous month" banner with entry count instead of ₱0 / "Stable" badges
- [x] `[02]` — Fixed: `EXPENSE_RATIO_TARGET = 0.65`, `ratioVariant()` color-codes green/yellow/red, sub-label shows "target ≤65%"
- [x] `[03]` — Fixed: `expenseSummaryWithComparison()` returns `salesComparison`, `cashFlowComparison`, `ratioComparison`; all 4 KPIs wired with `change`/`prevValue`
- [x] `[04]` — Fixed: Proportion bars scale to `maxCategoryAmount` instead of `pctOfSales * 2`
- [x] `[05]` — Fixed: Collapsible "Recent Entries" section showing last 15 entries with time, category, description, amount, paidBy, loggedBy
- [x] `[06]` — Fixed: Payment Method Breakdown grid cards showing method name, amount, and % of total
- [x] `[07]` — Fixed: `expensesByMonthForChart()` accepts `trimLeadingZeros` param; "All" period passes `true` to strip leading zero months

---

*Audit complete. 7 issues: 1 FAIL dimension, 4 CONCERN dimensions, 6 PASS dimensions.*
*Bible sections referenced: 3.1, 3.3, 3.5, 4.1, 4.7, 5.4, 6.2, 7.4, 8.2, 8.4, 10.4*
