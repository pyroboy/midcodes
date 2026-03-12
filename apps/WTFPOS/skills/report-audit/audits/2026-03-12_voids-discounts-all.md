# Report Audit — Voids & Discounts

**Route:** `/reports/voids-discounts`
**Audited:** 2026-03-12
**Location:** All Locations (owner view)
**Auditor:** Claude (report-audit skill v1.0)
**Data period tested:** Today (1 void, 3 discounts) + All Time (12 voids, 9 discounts)

---

## Data Provenance Map

| Displayed Metric | Schema Collection | Field(s) | Store Function | PRD Ref |
|---|---|---|---|---|
| Voided Orders count | `orders` | `status === 'cancelled'` | `voidsAndDiscountsSummary()` | M1 §Cancellations |
| Void Value (₱) | `orders` | `subtotal` on cancelled | `voidsAndDiscountsSummary()` | M3 §Reports |
| Reason Breakdown | `orders` | `cancelReason` (mistake/walkout/write_off) | `voidsAndDiscountsSummary()` | M4 §Audit trail |
| Discounted Orders count | `orders` | `discountType` + `discountEntries` | `voidsAndDiscountsSummary()` | M1 §Discounts |
| Discount Value (₱) | `orders` | `discountAmount` | `voidsAndDiscountsSummary()` | M1 §SC/PWD |
| Type Breakdown | `orders` | `discountEntries` keys / `discountType` | `voidsAndDiscountsSummary()` | M1 §Pro-rata |
| 14-Day Trend Chart | `orders` | `createdAt`, `status`, `discountType/Entries` | Component `$derived` | Bible §Trend |
| Void Detail table | `orders` | `tableId`, `items`, `closedBy`, `subtotal`, `cancelReason` | `.voids.items` | M4 §Audit |
| Discount Detail table | `orders` | `tableId`, `discountEntries`, `discountPax`, `discountIds`, `closedBy` | `.discounts.items` | M1 §ID logging |

---

## 12-Dimension Scorecard

| # | Dimension | Score | Notes |
|---|---|---|---|
| 1 | Information Hierarchy (Shneiderman) | 7/10 | KPIs → chart → detail is good; but the two-column split below the fold puts the most actionable data (void detail) where Boss Chris has to scroll to find it |
| 2 | KPI Card Design | 5/10 | Four cards but KPI 3 ("Void Value") duplicates KPI 1's sub-label; KPI 4 duplicates KPI 2's sub-label. No % of revenue context. No comparison to previous period |
| 3 | Chart Selection (Cleveland & McGill) | 6/10 | Grouped bar chart is appropriate for void vs discount trend. But the chart always shows 14 days regardless of period filter, creating a disconnected experience |
| 4 | Data-Ink Ratio (Tufte) | 7/10 | Clean and minimal. The reason breakdown cards are efficient. Slight waste from the "Live totals" badge repeated twice (filter bar + section heading) |
| 5 | Color Encoding (Brewer) | 4/10 | Red (#EF4444) for voids and orange (#EA580C) for discounts are too close in hue — nearly indistinguishable at small bar sizes and for color-deficient users |
| 6 | Comparison Context | 3/10 | No comparison to any baseline — no "vs yesterday", "vs last week", "% of gross sales". The KpiCard component supports `change` and `prevValue` props but they are unused |
| 7 | Cognitive Load (Sweller) | 6/10 | Manageable layout; however, the split between count KPI + value KPI for the same domain (voids) doubles the cards without adding new information |
| 8 | Data Integrity | 5/10 | Multi-discount orders (senior+PWD) may double-count `discountAmount` across type buckets. Void value uses `subtotal` (correct) but void detail table also uses `subtotal` while KPI uses `subtotal` — consistent. However, the 14-day trend counts ALL cancelled orders regardless of period, mixing "today" KPIs with "all-time" chart |
| 9 | Empty States | 8/10 | The ReportBarChart shows "No data for this period" when empty. The detail tables hide when `items.length === 0`. Solid empty handling |
| 10 | Accessibility | 5/10 | Bar chart has aria-labels. But: legend swatches are tiny (h-2 w-4, 8×16px), red/orange bars lack pattern differentiation, detail tables lack `scope` attributes on `<th>` |
| 11 | Anti-Patterns | 5/10 | Truncated "orders" unit in tooltip ("5 orders") is good; but "Live totals" pulsing green dot suggests real-time push when this is actually poll-on-render. Vanity metric: showing ₱0.00 for unused discount types (Comp, Service Recovery) adds noise |
| 12 | Data Schema Cohesion | 7/10 | All metrics trace to real `orders` schema fields. `cancelReason`, `discountType`, `discountEntries`, `discountAmount` all exist in schema v12. Minor gap: no `voidedBy` field — the void detail shows `closedBy` which may be null for cancelled orders |

**Overall: 5.7 / 10**

---

## "Best Report" Vision (PRD-grounded)

Boss Chris opens Voids & Discounts at 10 PM after a busy Saturday. The first thing he sees:

1. **Two hero KPIs** — "Void Rate: 2.4% of orders (₱8,783 lost)" and "Discount Rate: 18% of orders (₱1,721 given)" — immediately framing today's exceptions as a % of total revenue, with ▲▼ badges showing change vs last Saturday.
2. **A stacked area chart** showing the 14-day trend of void value + discount value as a % of daily gross, so Boss Chris can spot whether today's spike is a one-off or a worsening pattern.
3. **Reason breakdown** with horizontal bars (not just numbers) — the bar length makes it instantly obvious if walkouts are growing.
4. **The detail tables** — voided orders sorted by value (biggest losses first), each row showing which manager approved the void (audit trail per PRD M4).
5. **Discount compliance section** — for BIR: every SC/PWD discount row shows the captured ID number and a thumbnail of the ID photo (the schema supports `discountIdPhotos`), proving the discount was legitimate.

---

## Findings

### [01] KPI Cards 3 & 4 Are Redundant Mirrors of Cards 1 & 2

**What:** "Void Value ₱2,995.00" (KPI 3) repeats the exact same number shown as the sub-label of "Voided Orders: 1 — ₱2,995.00 lost" (KPI 1). Same for Discounts. Four cards, two unique data points.

**Bible Violation:** §5.2 Dashboard Structure — "Every element must earn its space. Remove any widget whose removal would not reduce the viewer's understanding."

**Why This Misleads:** Boss Chris's eye travels across four cards expecting four insights. He gets two insights and two echoes, wasting scarce above-the-fold real estate that should show void rate or discount rate as a % of sales.

**Ideal State:** Replace cards 3 & 4 with "Void Rate (% of orders)" and "Discount Rate (% of gross sales)" — both using the `change` prop to show vs-previous-period delta.

**The Owner Story:** Boss Chris glances at the KPIs: "1 void, 3 discounts — but is that normal or alarming?" He can't tell because there's no rate or comparison anchor.

---

### [02] No Comparison Context on Any KPI — "Compared to What?"

**What:** All four KPI cards show raw numbers with no `change` badge, no `prevValue`, no % delta. The KpiCard component fully supports these props but they are passed as defaults (null).

**Bible Violation:** §7.1 Comparison & Context — "A number without context is a number without meaning. Always answer: compared to what?"

**Why This Misleads:** "12 voided orders all time" — is that good or bad? Without knowing yesterday was 0 or last Saturday was 5, the number floats without anchor.

**Ideal State:** Pass `change` (% delta vs previous period) and `prevValue` to every KpiCard. Example: "Voided Orders: 1 ▼50% vs yesterday (prev: 2)".

**The Owner Story:** Sir Dan (manager) sees 12 voids in "All Time" and thinks things are fine. He doesn't realize 5 of those happened in a single day (Mar 8) — a spike that would have triggered investigation if the KPI showed a daily comparison.

---

### [03] Chart Ignores Period Filter — Always Shows 14 Days

**What:** The `trendChart` derived value always generates exactly 14 days of data regardless of whether the user selected "Today", "This Week", or "All Time". When "Today" is selected, the KPIs show 1 void, but the chart shows data for 14 days.

**Bible Violation:** §3.3 Information Hierarchy — "Linked views must agree. When a filter changes, every widget on the page must respond or the user loses trust."

**Why This Misleads:** Boss Chris selects "Today" to focus on today's issues. The chart still shows Mar 5 through Mar 12, mixing today's data with last week's. The visual message contradicts the KPI message.

**Ideal State:** "Today" → 24-hour hourly bars. "This Week" → 7-day bars. "All Time" → weekly or monthly aggregation depending on data volume.

**The Owner Story:** Boss Chris clicks "Today" after a walkout incident. The chart shows a big spike on Mar 8 (5 voids) which is irrelevant — he wants to see the timing pattern of today's voids.

---

### [04] Void and Discount Bar Colors Are Nearly Indistinguishable

**What:** Voids use `#EF4444` (red) and Discounts use `#EA580C` (orange). These are adjacent warm hues with similar luminance. In the chart, they're rendered at 75% and 65% opacity respectively, further washing out the distinction. At small bar heights (1-2 orders), they're visually identical.

**Bible Violation:** §9.2 Accessibility & Color — "Color must not be the sole differentiator. Use shape, pattern, or position as a redundant channel (WCAG 1.4.1)."

**Why This Misleads:** The legend says red = Voids, orange = Discounts, but in the chart the bars look the same color. Boss Chris might read a discount spike as a void spike and panic.

**Ideal State:** Use distinctly separated hues: keep red for voids (alarm), switch discounts to blue or teal (`#06B6D4`, the `status-cyan` token already in the design system). Add hatching or different bar shapes as a redundant channel.

**The Owner Story:** Boss Chris squints at the chart on his tablet: "Why do all the bars look the same color?" He gives up and scrolls to the detail tables, defeating the purpose of the chart.

---

### [05] Discount Type Breakdown Shows ₱0.00 Rows for Unused Types

**What:** The breakdown always renders all 5 discount types (Senior, PWD, Promo, Comp, Service Recovery) even when Comp and Service Recovery have ₱0.00. In "Today" view, 2 out of 5 rows are zeros.

**Bible Violation:** §10.3 Anti-Patterns — "Showing zero-value items in a breakdown dilutes the signal. Filter or collapse them."

**Why This Misleads:** Boss Chris scans the breakdown looking for the biggest category. His eye has to skip past Comp ₱0.00 and Service Recovery ₱0.00 to find the actual data. This is low-grade cognitive waste that compounds when reviewing multiple branches.

**Ideal State:** Hide rows with ₱0.00 amounts, or collapse them into a "Others (₱0.00)" row. Only show discount types that were actually used in the selected period.

**The Owner Story:** Ate Rose (staff) is asked to summarize today's discounts for Sir Dan. She reads all 5 rows aloud including the zeros, wasting everyone's time.

---

### [06] Void Detail Table Shows Raw Table ID Instead of Human-Readable Label

**What:** The void detail table column "Date / Table" shows `TAG-T4` — a location-prefixed machine ID. While it contains the branch prefix, it's not what a human would say. The table label ("Table 4" or "VIP-2") is more meaningful.

**Bible Violation:** §6.2 Data Integrity — "Display human-readable labels, not system identifiers. The user should never have to mentally decode a machine string."

**Why This Misleads:** Boss Chris sees "TAG-T4" and has to mentally decode: TAG = Tagbilaran, T4 = table number 4. For takeout orders, it shows the raw `tableId` which would be null → "Takeout", which is correct — but the inconsistency between machine-id for dine-in and human label for takeout is jarring.

**Ideal State:** Resolve `tableId` to `table.label` (e.g., "Table 4") and prefix with a branch badge ("Alta Citta") when in All Locations view.

**The Owner Story:** Boss Chris sees "PGL-T6" in the discount detail and asks "which table is that?" — he knows his Panglao branch layout by name, not by ID.

---

### [07] Multi-Type Discount Orders May Double-Count in Type Breakdown

**What:** In `voidsAndDiscountsSummary()`, the senior bucket is calculated as: `paidWithDiscounts.filter(o => o.discountType === 'senior' || !!o.discountEntries?.['senior']).reduce((s, o) => s + o.discountAmount, 0)`. For an order with BOTH senior AND pwd entries in `discountEntries`, `o.discountAmount` (the total discount for the entire order) gets summed into BOTH the senior and pwd buckets.

**Bible Violation:** §6.1 Data Integrity — "The sum of parts must equal the whole. If individual category values don't add up to the total, the report is lying."

**Why This Misleads:** If an order has ₱337 total discount split across senior (₱200) and pwd (₱137), the current code adds ₱337 to the senior bucket AND ₱337 to the pwd bucket. The breakdown shows ₱674 in parts but the total says ₱337.

**Ideal State:** For multi-type discount orders, allocate the discount pro-rata per entry rather than summing the full `discountAmount` for each type. Or compute per-type amounts from `discountEntries[type].pax` ratios.

**The Owner Story:** Boss Chris compares the type breakdown total to the KPI "Discount Value" and they don't match. He loses trust in the report and pulls out a calculator.

---

### [08] "Live Totals" Badge Is Misleading — Data Is Snapshot-on-Render, Not Push

**What:** The section heading shows a pulsing green dot with "Live totals" text. But the data is computed from `allOrders.value` (a reactive RxDB store) — it updates on local IndexedDB changes, not via server push. In the Phase 1 thin-client model, this is accurate within one device but not across devices.

**Bible Violation:** §6.3 Data Integrity — "Never claim freshness you cannot guarantee. If the data is 'eventual' rather than 'real-time', label it accordingly."

**Why This Misleads:** Boss Chris sees "Live" and believes any void happening on the Panglao branch tablet right now would appear instantly. It won't — there's no cross-device sync in Phase 1.

**Ideal State:** Replace "Live totals" with "Local data" or "This device" in Phase 1. Reserve the pulsing green "Live" indicator for Phase 3 when Ably provides real push.

**The Owner Story:** Boss Chris sees "Live totals" on his tablet at home and assumes he's watching both branches in real time. He's actually seeing stale seeded data.

---

### [09] Void Detail Table Missing "Approved By" Column — PRD Audit Gap

**What:** The PRD states "Manager PIN required for all cancellations and refunds, with all actions permanently logged." The void detail table shows "Cashier" (from `closedBy`) but not the manager who approved the void. The `audit_logs` collection captures this, but the report doesn't surface it.

**Bible Violation:** §8.1 Operational Reporting — "Exception reports must answer: who did it, who approved it, and when."

**Why This Misleads:** Sir Dan sees a ₱2,995 write-off voided by an unknown cashier (closedBy is null in this case) with no approval trail. The audit trail exists in the `audit_logs` collection but isn't surfaced on this report where it matters most.

**Ideal State:** Add an "Approved By" column to the void detail table, sourced from the corresponding `audit_log` entry with `action: 'void_order'`. For write-offs, also show the approving manager.

**The Owner Story:** Boss Chris sees a ₱2,995 write-off and asks "Who approved this?" He has to navigate to Admin → Logs and manually search — the answer should be right here on the exception report.

---

### [10] Detail Tables Not Sorted by Value — Biggest Losses Buried

**What:** Both void and discount detail tables render in the order returned by `voidsAndDiscountsSummary()`, which is the order items appear in the RxDB query (insertion order). The ₱2,995 void is shown first only because it's the only one today — in "All Time" view, large voids are mixed randomly with small ones.

**Bible Violation:** §3.2 Information Hierarchy — "Sort by impact, not by time, in exception reports. The most expensive exceptions should surface first."

**Why This Misleads:** In the All Time view with 12 voids, Boss Chris has to scan every row to find the biggest losses. A ₱500 mistake and a ₱5,000 walkout have equal visual weight.

**Ideal State:** Sort void detail by `subtotal` descending (biggest loss first). Sort discount detail by `discountAmount` descending. Add a secondary sort toggle for time-based viewing.

**The Owner Story:** Boss Chris opens the All Time view to find the "worst" voids for his monthly review. He scrolls through 12 unsorted rows instead of immediately seeing the top 3 losses.

---

### [11] Discount Detail Shows "0 of 2 pax" for Promo — Confusing Pax Display

**What:** The Promo discount row shows "0 of 2 pax" in the Qualifying Pax column. Promo discounts don't use qualifying pax (they're flat discounts, not per-person), so showing "0 of 2" is misleading rather than informative.

**Bible Violation:** §6.2 Data Integrity — "Show data that is meaningful for the context. Showing a field that doesn't apply to this discount type creates noise."

**Why This Misleads:** Boss Chris reads "0 of 2 pax" and thinks: "The promo didn't apply to anyone? Then why was ₱135 discounted?" The pax field is irrelevant for promos and comps.

**Ideal State:** Show qualifying pax only for SC/PWD discounts where pax-based pro-rata applies. For promo/comp/service_recovery, show "—" or the promo code/reason instead.

**The Owner Story:** Ate Rose sees "0 of 2 pax" and thinks she made an error entering the promo. She didn't — the field just doesn't apply.

---

### [12] No Branch Column in All-Locations View

**What:** When viewing as owner with "All Locations", the void and discount detail tables show table IDs like "TAG-T4" and "PGL-T6" but there's no explicit "Branch" column. The branch is encoded in the table ID prefix, but this is implicit.

**Bible Violation:** §7.2 Comparison Context — "In aggregate views, always show the grouping dimension explicitly. Don't rely on encoded prefixes."

**Why This Misleads:** For takeout orders (no tableId), the branch origin is completely invisible. Boss Chris can't filter or group by branch in the detail view.

**Ideal State:** Add a "Branch" column (or badge) showing "Alta Citta" / "Alona Beach" in the All Locations view. The column can be hidden when viewing a single branch.

**The Owner Story:** Boss Chris wants to know which branch has more walkouts. He has to mentally decode every "TAG-" and "PGL-" prefix, and for takeout orders he has no idea which branch they came from.

---

## Summary for Boss Chris

The Voids & Discounts report has a **solid foundation** — good layout structure, proper RxDB-backed data, correct empty states, and accessible chart labels. But it falls short as the **exception/audit report** it needs to be:

- **No comparison context** (compared to what? compared to when?)
- **Redundant KPIs** waste above-the-fold space
- **Chart doesn't respect the period filter**
- **Multi-discount math may overstate** type breakdown totals
- **Missing audit trail** (who approved the void?)
- **Color accessibility** issues in the chart

The report shows _what happened_ but doesn't help Boss Chris answer _"is this normal?"_ or _"who authorized this?"_ — the two questions an exception report must answer.
