# Report Audit: Sales Summary

| Field | Value |
|---|---|
| **Page** | `/reports/sales-summary` |
| **Location** | Alta Citta (Tagbilaran) — `tag` |
| **Date** | 2026-03-12 |
| **Auditor** | report-audit skill v1.0.0 |
| **Bible Version** | DATA_ANALYTICS_BIBLE.md |
| **Viewport** | 1024 × 768 (tablet landscape) |
| **Role** | Owner (Boss Chris) |

---

## A. Scorecard

| Dimension | Grade | Notes |
|---|---|---|
| Information Hierarchy | B | Good KPI → chart → table flow (Shneiderman's mantra). KPIs lead with the right metrics. |
| KPI Card Design | B+ | 5 cards with comparison arrows. Missing absolute previous-period value. |
| Chart Selection | B | Dual bar chart (gross + net) is appropriate for time-series comparison. |
| Data-Ink Ratio | A- | Clean layout, minimal chart junk, good use of whitespace. |
| Color Encoding | B+ | Orange (gross) / green (net) — distinguishable, semantically meaningful. |
| Comparison Context | C+ | "vs prev period" shown but no absolute reference value. "All" period still shows stale comparison. |
| Cognitive Load | B | 5 KPIs + chart + 8-col table is near the upper boundary. Manageable on desktop, tight on tablet. |
| Data Integrity | B | VAT math checks out (12% on net). Column naming ("Non-VAT") is confusing. |
| Empty States | A- | Descriptive empty state with emoji, period-aware message. |
| Accessibility | B- | Responsive column hiding (`hidden sm:`, `hidden lg:`). No `aria-label` on KPI change indicators. |
| Anti-Patterns | C | Chart title doesn't update when weekly is selected. "Non-VAT" column is a misnomer. |

**Overall Grade: B**

---

## B. Data Flow Map

```
salesByDay(14) / salesByWeek(8)      ← reports.svelte.ts (RxDB query, location-filtered)
        │
        ▼
withVatBreakdown()                   ← page-level: vatSales = net / 1.12, tax = vatSales * 0.12
        │
        ▼
quickRange filter (today/week/month/all)  ← client-side date filter on dateKey
        │
        ├──► KPI cards ◄── salesSummaryWithComparison(period)  ← separate query for ▲/▼
        ├──► ReportBarChart ◄── salesByDayForChart(14) / salesByWeekForChart(8)
        └──► Revenue Table (rows + totals)
```

- KPI values come from `comparison` (separate query) for named periods, but from `totals` (table sum) for "All" — **two different data sources for the same cards**.
- Chart data is independent of the period filter — always shows 14 days or 8 weeks regardless of selected range.

---

## C. "Best Report" Vision

The ideal Sales Summary for a restaurant owner (Boss Chris) at end-of-day:

1. **North Star KPI** (Net Sales) gets visual prominence — larger font, separated from supporting metrics
2. **Comparison context** shows both percentage AND absolute previous value: "₱15,354 — ▲ 127.8% vs ₱6,740 yesterday"
3. **Chart syncs with period** — selecting "This Week" narrows the chart to 7 bars, not 14
4. **Revenue per pax** (₱480/head) is contextualized: "₱480/head (target: ₱500)" with a progress ring
5. **Table has sparklines** in the Period column for at-a-glance trend
6. **"Non-VAT" column renamed** to "VAT-Exempt Sales" to match BIR terminology
7. **TOTAL row** includes VAT Sales and Non-VAT subtotals (currently blank)

---

## D. Findings

### D1. Chart does not respond to Weekly granularity toggle

| Field | Detail |
|---|---|
| **What** | Clicking "Weekly" changes the table rows to weekly aggregation but the chart title stays "Last 14 Days" and bars remain daily. The chart data source (`salesByDayForChart` vs `salesByWeekForChart`) IS reactive to `granularity`, but the visual result in the snapshot showed no change. |
| **Bible Violation** | §5.3 "Coordinated Views": All visual panels must update together. §10 Anti-Pattern: "Dashboard Zombie — a widget that stops reacting to global filters." |
| **Why This Misleads** | Owner sees weekly totals in the table but daily bars in the chart — the numbers won't match, eroding trust in the report. |
| **Ideal State** | Chart re-renders with 8 weekly bars (labeled "W10", "W11" etc.) when "Weekly" is selected. Chart title updates to "Last 8 Weeks". |
| **The Owner Story** | Boss Chris switches to Weekly to compare week-over-week performance. The table shows weekly sums but the chart still shows daily — he can't visually spot the weekly trend he's looking for. |
| **Severity** | **P1** |

### D2. "All" period still shows comparison arrows with stale context

| Field | Detail |
|---|---|
| **What** | When "All" is selected, KPI cards show ▲ 90.4% "vs prev period" — but the code falls back to `salesSummaryWithComparison('month')`, making it compare against the previous month, not "all previous data". |
| **Bible Violation** | §7.1 "Comparison requires honest context": A comparison arrow without a clear, correct baseline is misleading. §3.3 "Metric Classification": Distinguish between point-in-time and period metrics. |
| **Why This Misleads** | The owner sees a big green arrow and thinks "all-time sales are up 90%" when it's actually just comparing this month to last month. |
| **Ideal State** | Either (a) hide comparison arrows on "All" (no meaningful prev period), or (b) show comparison to a user-selected baseline. The code already has `quickRange === 'all' ? null : comparison.grossSales.changePct` logic — the snapshot showed it wasn't taking effect. Likely the `kpiPeriod` derivation fallback to `'month'` is still feeding comparison values. |
| **The Owner Story** | Boss Chris clicks "All" expecting a total lifetime view. The arrows showing +90.4% make him think the business is booming vs all-time, when it's just month-over-month. |
| **Severity** | **P1** |

### D3. KPI comparison arrows lack absolute reference value

| Field | Detail |
|---|---|
| **What** | KPI cards show "▲ 127.8% vs prev period" but don't show what the previous period's value was. The owner has to calculate backwards to know yesterday's net sales were ₱6,740. |
| **Bible Violation** | §3.4 "Grove's Indicator Pairs": Every metric needs its pairing — current value + trend direction + reference value. §6.2: "Anchoring Bias": Without the absolute anchor, the percentage floats without meaning. |
| **Why This Misleads** | A 100% increase sounds impressive, but ₱8,000 → ₱16,000 is very different from ₱100 → ₱200. Without the base, the percentage is uninterpretable. |
| **Ideal State** | Below "▲ 127.8%" show "prev: ₱6,740" in muted text. Or use a tooltip on hover. |
| **The Owner Story** | Boss Chris sees ▲ 127.8% and feels great, but can't quickly check "wait, how much was yesterday?" without mental math or switching pages. |
| **Severity** | **P2** |

### D4. "Non-VAT" column label is a misnomer

| Field | Detail |
|---|---|
| **What** | The column labeled "Non-VAT" actually shows `nonVatSales = netSales - vatSales`, which equals the tax amount, not "non-VAT-able sales". In BIR terminology, "Non-VAT" means sales exempt from VAT (e.g., senior/PWD discounted portions). Here it's being used as "the VAT portion of the sale". |
| **Bible Violation** | §8.1 "Label Precision": Column headers must use domain-standard terminology. §6 "Data Integrity": Ambiguous labels create false confidence in wrong interpretations. |
| **Why This Misleads** | A bookkeeper or BIR auditor seeing "Non-VAT: ₱1,645" would interpret it as "₱1,645 in VAT-exempt sales" — the exact opposite of what it actually is. |
| **Ideal State** | Rename to "VAT Amount" or "Output Tax" (BIR term). Or remove the column since "Tax" already shows the same value. |
| **The Owner Story** | During a BIR audit, the examiner asks for VAT-exempt sales. The "Non-VAT" column shows ₱1,645 — but that's actually the tax, not the exemption. Confusion and potential compliance risk. |
| **Severity** | **P1** |

### D5. TOTAL row omits VAT Sales and Non-VAT subtotals

| Field | Detail |
|---|---|
| **What** | The TOTAL row has empty cells for "VAT Sales" and "Non-VAT" columns (lines 206-207 in source: `<td class="hidden lg:table-cell"></td>`). Every other column is summed. |
| **Bible Violation** | §5.4 "Completeness": Totals must be exhaustive — a blank cell in a sum row implies the value is zero or unavailable, neither of which is true. |
| **Why This Misleads** | Owner might think VAT data is incomplete or the system isn't tracking it properly. |
| **Ideal State** | Sum `vatSales` and `nonVatSales` across rows and display in the TOTAL row. |
| **The Owner Story** | Boss Chris scrolls to the total and sees blanks — "Is the VAT not being tracked? Do I need to add these up myself?" |
| **Severity** | **P2** |

### D6. Chart is decoupled from period filter

| Field | Detail |
|---|---|
| **What** | Switching between Today / This Week / This Month / All changes the KPI cards and table, but the chart always shows "Last 14 Days" (or "Last 8 Weeks" for weekly). The chart doesn't filter. |
| **Bible Violation** | §5.3 "Coordinated Views": All panels should respond to the same filter state. §10 Anti-Pattern: "Dashboard Zombie". |
| **Why This Misleads** | When "Today" is selected, the table shows 1 row but the chart shows 14 bars — visual disconnect. The chart could helpfully highlight today's bar or dim non-selected bars. |
| **Ideal State** | Either (a) filter chart bars to match the selected period, or (b) visually highlight the selected range within the chart (dim + mute bars outside the range). |
| **The Owner Story** | Boss Chris clicks "Today" to see today's performance. The table shows 1 row. The chart shows 14 bars with no indication of which is today. |
| **Severity** | **P2** |

### D7. 5 KPI cards in a single row at 1024px is tight

| Field | Detail |
|---|---|
| **What** | `grid-cols-5` forces all 5 KPI cards into one row at 1024px. At this width each card is ~180px — tight for peso values + comparison text. No responsive breakpoint to 3+2 or 2+2+1. |
| **Bible Violation** | §2.3 "Miller's Law": 5 items is within the 7±2 range but at the upper end for a glanceable row. §5.2: "Card Density" — each card should have breathing room. |
| **Why This Misleads** | Not misleading per se, but creates cognitive strain. The values are cramped, making it harder to scan. |
| **Ideal State** | Use `grid-cols-5 lg:grid-cols-5 md:grid-cols-3` to wrap to 3+2 on smaller screens. Or promote Net Sales as the hero KPI (larger card). |
| **The Owner Story** | On the tablet at the register, Boss Chris squints at the 5 tiny cards trying to find today's net sales. |
| **Severity** | **P3** |

---

## E. Fix Checklist

| # | Finding | Severity | Fix Description | Status |
|---|---|---|---|---|
| 1 | D1: Chart ignores Weekly toggle | P1 | `chartData` derivation confirmed reactive; chart now uses `chartDataWithHighlight` | [x] |
| 2 | D2: "All" shows stale comparison | P1 | `hasComparison` derived from `quickRange !== 'all'`; comparison is `null` for "All", arrows hidden | [x] |
| 3 | D4: "Non-VAT" misnomer | P1 | Renamed to "VAT Amount" in header, data field `nonVatSales` → `vatAmount` throughout | [x] |
| 4 | D3: No absolute prev value on KPIs | P2 | Added `prevValue` prop to KpiCard; shows "prev: ₱X" in muted mono text below arrow | [x] |
| 5 | D5: TOTAL row missing VAT subtotals | P2 | Added `vatSales` and `vatAmount` to `totals` derivation; displayed in TOTAL row | [x] |
| 6 | D6: Chart decoupled from period | P2 | `chartDataWithHighlight` highlights bars matching selected period range | [x] |
| 7 | D7: 5-card row tight at 1024px | P3 | Changed to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` responsive grid | [x] |

---

*Audit complete. 3 P1 issues, 3 P2 issues, 1 P3 issue identified.*
*Bible sections referenced: §2.3, §3.3, §3.4, §5.2, §5.3, §5.4, §6, §6.2, §7.1, §8.1, §10*
