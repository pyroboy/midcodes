# Report Audit: Table Sales

**Date:** 2026-03-12
**Route:** `/reports/table-sales`
**Role:** Owner (Boss Chris) at Alta Citta (Tagbilaran) + All Locations
**Viewport:** 1024x768 (tablet)
**Data state:** Seed history — 7 days of orders across both branches

---

## A. Data Analytics Scorecard

| # | Dimension | Verdict | Key Finding |
|---|-----------|---------|-------------|
| 1 | Information Hierarchy | PASS | Shneiderman respected: KPIs → chart (overview) → table (detail). Sorted by net sales descending. |
| 2 | KPI Card Design | CONCERN | 4 cards, good count. But all are lonely numbers — zero comparison context (no vs. prior period, no trend arrows). |
| 3 | Chart Selection | PASS | Horizontal bar is correct for ranked categorical comparison (Cleveland & McGill rank 2). Sub-labels add sessions/pax context. |
| 4 | Data-Ink Ratio | PASS | Clean bars, no chartjunk, no 3D effects. Direct labels on each bar. Rank numbers present. |
| 5 | Color Encoding | CONCERN | All bars are identical orange regardless of zone or branch. "All Locations" view mixes both branches with no visual separation — T3 appears twice with no way to tell which branch. |
| 6 | Comparison Context | FAIL | No lonely-number protection anywhere. KPIs show raw totals without vs. last period. No target or benchmark. Chart has no period-over-period comparison. |
| 7 | Cognitive Load | PASS | Low cognitive load. Three clear zones: filter → KPI → chart → table. Minimal extraneous load. |
| 8 | Data Integrity | CONCERN | Avg Check is computed as `netSales / pax` (per-pax), but header says "Avg Check" — ambiguous whether per-session or per-pax. Also, "All Locations" merges table IDs that happen to share labels (T3 from TAG vs T3 from PGL shown as separate rows with no branch indicator). |
| 9 | Empty States | PASS | Code has proper empty state with icon + message: "No table sales recorded for this period". |
| 10 | Accessibility | CONCERN | Zone badges use color alone (blue for Main, gray for Takeout). No non-color indicator. Tabular numerals used (font-mono). |
| 11 | Anti-Patterns | CONCERN | Chart and table show identical data (net sales per table) — the chart is a visual duplicate of the table's Net column. This is the Sec 2.3 redundancy overload pattern. |
| 12 | Data Schema Cohesion | PASS | All metrics trace cleanly to real schema fields. No phantom metrics. PRD requirement for "Sale Per Table Data (tabular)" is met. |

**Overall:** 5/12 PASS, 6 CONCERN, 1 FAIL

---

## B. Data Flow Map + Schema Provenance

```
[Schema Field]              → [Collection] → [Store Function]         → [Derived Metric]     → [Visual Component]        → [PRD Req]

orders.subtotal (number)    → orders       → tableSalesByPeriod()     → grossSales (₱)       → KpiCard "Gross Sales"     → M3-R1 ✅
orders.total (number)       → orders       → tableSalesByPeriod()     → netSales (₱)         → KpiCard "Net Sales"       → M3-R1 ✅
orders.pax (number)         → orders       → tableSalesByPeriod()     → totalPax (count)      → KpiCard "Total Pax"       → M3-R1 ✅
orders.tableId (string|null)→ orders       → tableSalesByPeriod()     → sessions (count)      → KpiCard "Total Sessions"  → M3-R1 ✅
orders.total / orders.pax   → orders       → page $derived            → avgCheck (₱)          → Table "Avg Check" column  → ✅ Derivable
orders.discountAmount       → orders       → tableSalesByPeriod()     → discounts (₱)         → Table "Disc." column      → ✅ Exists
tables.zone (string)        → tables       → tableSalesByPeriod()     → zone (category)       → Table "Zone" badge        → ✅ Exists
tables.label (string)       → tables       → tableSalesByPeriod()     → label (string)        → Table "Table" column      → ✅ Exists
orders.total                → orders       → tableSalesByPeriod()     → chartRows[].value     → ReportHorizBar            → ✅ Exists
— (no field)                → —            → —                        → revPerSqFt            → —                         → ❌ MISSING (nice-to-have)
— (no field)                → —            → —                        → avgSessionDuration     → —                         → ❌ MISSING (Table Reset Time in PRD)
```

**PRD "Table Reset Time"** is specced (Module 1) but not surfaced in this report. Marked ⚠️ Partial in PRD_QUICK_REF.

---

## C. "Best Report" Vision (PRD-Grounded)

**The persona moment.** Boss Chris opens Table Sales every Monday morning at the Tagbilaran branch. He's checking which tables earned the most last week and whether any tables are chronically underperforming. His question isn't just "how much?" — it's "which tables should I relocate, resize, or promote?"

**Business questions answered.** The PRD calls for "Sale Per Table Data (tabular)" — the current report delivers this. But the deeper questions a table sales report should answer are: (1) Which table earns the most per pax? (2) How does this week compare to last week? (3) Are takeout orders growing relative to dine-in? (4) Which zone (main/VIP/bar) generates the most revenue per seat? These secondary questions require comparison context that's currently absent.

**Data that must exist.** All core fields are present. The missing element is **comparison data** — the store has `salesSummaryWithComparison()` patterns that could be extended to table-level comparison, and `tableSalesToday()` (the non-period version) exists as a legacy function. Table Reset Time (time between payment and table becoming available) is tracked per PRD but not surfaced.

**Comparison context.** The ideal Table Sales report shows: this period's revenue per table, compared with the same period last week (or last month). Each KPI card would have a trend arrow (▲ +12% vs last week). The chart would optionally show a ghost bar (last period) behind the current bar. When in "All Locations" mode, bars would be color-coded by branch so Boss Chris can see T3-Tagbilaran vs T3-Panglao at a glance.

**The decision moment.** After reading this report, Boss Chris should be able to say: "T3 is consistently our weakest table — let's put the tent card promo there" or "Takeout is 25% of revenue now, we need a dedicated pickup counter." Without comparison context, the numbers are just numbers — he can't tell if ₱4,712 for T6 today is good, bad, or normal.

---

## D. Findings

---

##### [01] KPI cards are lonely numbers — no comparison context

**What:** All four KPI cards (Total Sessions, Total Pax, Gross Sales, Net Sales) show raw values with no trend arrow, no vs-previous-period comparison, and no target/benchmark. The `KpiCard` component already supports `change`, `prevValue`, and `changeLabel` props — they're simply not wired up.

**Bible Violation:** Section 7.1 — "A number without comparison is meaningless." Section 7.4 — "No lonely numbers." Every KPI must include at least one comparison dimension (temporal, spatial, or target-based).

**Why This Misleads:** Boss Chris sees "Total Sessions: 7" on Today and has no idea if that's good. Yesterday might have been 12 sessions. Without the comparison, the KPI is decoration — it tells him what happened but not whether he should care.

**Ideal State:** Each KPI card shows the current value plus a vs-previous-period badge. Example: "Total Sessions: 7 ▼ 42% vs yesterday (prev: 12)". The `salesSummaryWithComparison()` pattern already exists in the store — extend it for table-level aggregates or compute comparison inline on the page (filter previous-period orders the same way, aggregate, pass to `KpiCard.change`).

**The Owner Story:** "I see 7 sessions today. Is that good? Bad? Normal? I can't tell. Show me if we're up or down compared to yesterday — that's the only way I know if I should worry."

---

##### [02] "All Locations" view shows duplicate table labels with no branch indicator

**What:** When `locationId === 'all'`, tables from both branches are merged. Both branches have tables labeled T1-T8. The chart shows two separate "T3" bars (₱2,431 and ₱2,285) with no indication of which branch they belong to. The table view also shows two "T3 Main" rows that are visually identical.

**Bible Violation:** Section 6.2 — "Data Integrity: every data point must be unambiguously identifiable." Section 4.6 — "Color Encoding: use color to encode data dimensions, not decoration."

**Why This Misleads:** Boss Chris switches to "All Locations" to compare branches. He sees two "T3" entries and can't tell which is Tagbilaran and which is Panglao. He might think the same table had two different revenue amounts, or he might conflate the two and miss that one branch's T3 is underperforming.

**Ideal State:** In "All Locations" mode: (1) Prefix table labels with branch abbreviation: "TAG-T3" and "PGL-T3". (2) Add a branch color indicator (orange for TAG, teal for PGL — matching `LOCATION_COLORS` in AppSidebar). (3) Optionally group rows by branch with subtotals. The `tableSalesByPeriod()` store function would need to include `locationId` in the grouped key when `session.locationId === 'all'`.

**The Owner Story:** "I'm looking at 'All Branches' and I see two T3s. Which one is mine in Tagbilaran? Which is Panglao? I can't tell. Just put the branch name next to it."

---

##### [03] Chart and table show identical data — redundancy overload

**What:** The horizontal bar chart shows net sales per table ranked by value. The table below shows the exact same data in tabular form with identical ranking. The chart adds no analytical dimension that the table doesn't already provide — it's a visual duplicate of the "Net" column.

**Bible Violation:** Section 2.3 — Cognitive Load Theory: "Redundancy overload: Chart AND full data table AND text summary all visible simultaneously." Section 4.4 — Chart should answer a question the table cannot.

**Why This Misleads:** This doesn't actively mislead, but it wastes vertical real estate that could show a more useful visualization — for example, a stacked bar showing gross vs. discount vs. net per table, or a revenue-per-pax chart that surfaces efficiency rather than raw volume.

**Ideal State:** Replace the current horizontal bar with a **diverging or stacked bar** showing multiple dimensions: (1) Gross revenue (full bar) with discount portion highlighted in red, so Boss Chris can see which tables have the most discounts applied. Or (2) A revenue-per-pax bar chart — this surfaces table *efficiency*, not just volume. T3 with 24 pax and ₱285/pax is very different from T8 with 18 pax and ₱663/pax. The table below keeps the detailed breakdown.

**The Owner Story:** "The chart just shows me what the table already shows. I'd rather see which tables are the most efficient — revenue per guest, not just total revenue. T8 makes the most money but is it because of high pax or because guests spend more?"

---

##### [04] Zone column provides no analytical value — every table is "Main"

**What:** The Zone column shows a blue "Main" badge for every dine-in table and a gray "Takeout" badge for takeout. With only one zone defined in the seed data and floor layout, this column occupies horizontal space without differentiating anything. The `zoneColor` map in the component only defines `main`.

**Bible Violation:** Section 4.1 — Data-Ink Ratio (Tufte): "Every drop of ink must represent data. Non-data-ink should be eliminated." A column where every value is identical is zero-information ink.

**Why This Misleads:** It doesn't mislead, but it creates false expectation. Boss Chris might think zones are meaningful analytics categories. If zones (Main/VIP/Bar/Outdoor) are planned but not yet implemented in the floor plan, the column is premature. If they are implemented, the color map is incomplete.

**Ideal State:** Two options: (1) If zones are fully implemented with multiple zones per branch, keep the column and expand `zoneColor` to cover all zones (vip: purple, bar: amber, outdoor: green). Add a zone subtotal/grouping. (2) If only "Main" exists, hide the column and reclaim the horizontal space for a more useful metric like "Avg Duration" or "Revenue/Pax".

**The Owner Story:** "Every table says 'Main'. I know they're all in the main dining area. This doesn't tell me anything new. If we ever have a VIP section, sure, but right now it's just noise."

---

##### [05] "Avg Check" column header is ambiguous — per-pax or per-session?

**What:** The table column is labeled "Avg Check" and is computed as `netSales / pax` (per-pax average). However, "Average Check" in restaurant industry convention typically means the average bill per transaction/session, not per person. The computation is `Math.round(row.netSales / row.pax)` — this is actually "average spend per guest" (RevPAG), not "average check."

**Bible Violation:** Section 6.1 — "Labels must be unambiguous. A metric name that means different things to different audiences will be interpreted incorrectly by at least one of them."

**Why This Misleads:** Sir Dan (manager) sees "Avg Check: ₱785" for T6 and thinks "each table session averaged ₱785" — but that's wrong. It's ₱785 per person, and the single session had 6 pax totaling ₱4,712. The actual average check (per session) is ₱4,712. This 6x discrepancy could lead to incorrect benchmarking.

**Ideal State:** Rename column to "Avg / Pax" or "₱/Guest" to make it unambiguous. Alternatively, show both: "Avg Check" (net/sessions) and "₱/Guest" (net/pax). The TOTAL row should also clarify: the current total shows ₱610 which is total net / total pax — correct for per-guest but misleading if read as per-check.

**The Owner Story:** "When I see 'Average Check' I think per table, not per person. Call it what it is — average spend per guest. Or better yet, show me both so I know how much each table earns AND how much each guest spends."

---

##### [06] No revenue-per-pax KPI — the most actionable metric for AYCE is hidden

**What:** For an all-you-can-eat (AYCE) restaurant, revenue-per-pax is the single most important operational metric — it tells you if guests are ordering premium packages or basic ones. This metric exists in the table (as the ambiguous "Avg Check" column) but is not surfaced as a KPI card.

**Bible Violation:** Section 3.1 — Shneiderman's Visual Information Seeking Mantra: "Overview first." The most actionable metric should be the most prominent element. Section 1.3 — "So What?" test: the KPI cards should answer "what should I do differently?"

**Why This Misleads:** Boss Chris sees 4 KPI cards but none answers his core question: "Are guests spending more or less per head than usual?" Total sessions and total pax are input metrics (volume), not outcome metrics (efficiency). The ₱/guest metric is buried in the table where it requires row-by-row scanning.

**Ideal State:** Replace one of the four KPI cards (likely "Gross Sales" which is redundant with "Net Sales") with "Avg ₱/Guest" showing the overall revenue-per-pax. For an AYCE restaurant, this directly reflects package mix and add-on upselling effectiveness.

**The Owner Story:** "I don't need both Gross and Net up top — the discount is usually small. What I really want to see at a glance is: how much is each guest spending? If that number is dropping, it means people are choosing cheaper packages and I need to push the premium menu."

---

##### [07] No sort control — table is locked to net sales descending

**What:** The data table sorts by net sales descending (highest earning table first). There is no way for the user to re-sort by sessions, pax, avg check, or zone. The column headers are not clickable.

**Bible Violation:** Section 8.2 — Operational Reporting: "Provide interaction affordances for data exploration." Section 5.3 — "Progressive disclosure: summary → interaction → detail."

**Why This Misleads:** This doesn't actively mislead, but it limits analytical utility. Boss Chris might want to sort by sessions to find the most-used tables, or by avg check to find the most profitable per-pax tables. Currently he must visually scan the column.

**Ideal State:** Make column headers clickable to toggle sort direction. Visual indicator (▲/▼ arrow) on the active sort column. Default remains net sales descending. This is a progressive disclosure interaction — the overview (chart) shows the ranked view, the table allows exploration.

**The Owner Story:** "I want to see which table gets used the most, not just which earns the most. Sometimes T3 gets 6 sessions but earns less because they're all small groups. Let me sort by sessions or by average spend."

---

## E. Fix Checklist

- [ ] `[01]` — Wire comparison context to all 4 KPI cards using `salesSummaryWithComparison` pattern (change, prevValue, changeLabel props)
- [ ] `[02]` — In "All Locations" mode, prefix table labels with branch abbreviation (TAG-T3, PGL-T3) and add branch color badge
- [ ] `[03]` — Replace horizontal bar with revenue-per-pax chart or stacked gross/discount bar to add analytical value beyond what the table shows
- [ ] `[04]` — Hide Zone column if only "Main" exists, or expand `zoneColor` map for all zones if multiple zones are active
- [ ] `[05]` — Rename "Avg Check" to "₱/Guest" or "Avg/Pax" to match the actual computation (netSales / pax)
- [ ] `[06]` — Replace "Gross Sales" KPI card with "Avg ₱/Guest" to surface the most actionable AYCE metric
- [ ] `[07]` — Add clickable column headers for table sort (sessions, pax, avg check, net) with ▲/▼ direction indicator
