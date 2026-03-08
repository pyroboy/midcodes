# UX Audit — Reports & Stock Modules (Manager Role, Alta Citta)

**Date:** 2026-03-09
**Role:** Manager (Juan Reyes — Alta Citta / Tagbilaran)
**Viewport:** 1024×768 (tablet)
**Auditor:** Claude Code UX Audit Skill v2.3.0
**Scope:** Reports module (all sub-pages) + Stock module (all sub-pages) + cross-module navigation

---

## PAGE-BY-PAGE FINDINGS

---

### LOGIN PAGE (/)
**State captured:** initial + PIN entry
**Layout summary:** Split two-panel layout: left panel has username/password form + brand header; right panel shows dev test account cards grouped by branch. Manager card shows "PIN" badge inline in the card label. PIN modal appears as an overlay panel (not a separate screen), side-by-side with the account list. VERIFY PIN button is disabled until all 4 digits are entered.
**Primary action visibility:** CLEAR — "LOGIN →" button is prominent; "VERIFY PIN" enables after PIN entry
**Navigation access:** 1 tap (click manager card) + 4 taps (PIN digits) + 1 tap (VERIFY PIN) = 6 total interactions
**Touch targets:** PASS — PIN digit buttons are large grid; account cards are well-spaced
**Data/content:** Dev panel shows role, branch, PIN indicator clearly
**Friction points:**
- No visual PIN dot indicators (no feedback that digits are being entered — only "VERIFY PIN" becoming enabled is the signal)
- PIN modal appears inline without a clear visual separation from the card list behind it
- No "forgot PIN" or help path
- "LOGIN →" main form button disabled by default with no tooltip explaining why
**Accessibility notes:** Login button `[disabled]` with no aria-describedby explaining why it's disabled

---

### REPORTS LANDING (/reports → /reports/meat-report)
**State captured:** loaded
**Layout summary:** Redirects immediately to /reports/meat-report (not an index page). Reports section shows a horizontal sub-nav grouped into 5 categories: Operations (7 links), Expenses (2), Revenue & Sales (3), Profitability (2), Branch (1) — total 15 links across 5 groups. Content area renders immediately with meat report data. LocationBanner is always visible at top.
**Primary action visibility:** CONCERN — There is no clear "primary action" button. The sub-nav group structure is good but the active link has no visible highlight in the accessibility tree (no `[aria-current]` noted)
**Navigation access:** 1 tap from sidebar "Reports" link
**Touch targets:** CONCERN — Sub-nav links appear as inline text links within groups. No minimum height enforcement visible in the a11y tree. These could be under 44px on a tablet.
**Data/content:** Reports landing defaults to Meat Report — which is a reasonable default for the manager's most urgent operational concern (meat usage). Data loads immediately (local-first RxDB).
**Friction points:**
- No "Reports dashboard" overview — redirects directly to Meat Report. A manager coming to Reports for the first time has no orientation page.
- Sub-nav has 15 total links. Even grouped, this is above Miller's Law threshold of 7±2 per chunk. Operations group alone has 7 links.
- "Staff Perf." is an abbreviated label — could read as "Staff Performance" without truncation
- Active page link has no visible selection indicator in the a11y tree
- The "Consolidated Reports" heading suggests a future all-in-one view that doesn't exist yet
**Accessibility notes:** Sub-nav links lack `aria-current="page"` indicator; abbreviated labels ("Staff Perf.") reduce clarity

---

### X-READ (/reports/x-read)
**State captured:** loaded with live shift data
**Layout summary:** Three-zone layout: (1) date header + "Generate X-Read" CTA; (2) 4-metric summary cards (Gross Sales, Net Sales, Total Pax, Avg Ticket); (3) two-column detail: Payment Breakdown (Cash/Card/GCash) + Order Status (Open/Paid/Voided) on left, X-Read History list on right. Historical X-Read entries show Gross, Net, Cash, GCash, Pax, Voids per entry.
**Primary action visibility:** CLEAR — "📋 Generate X-Read" button is at the top of the content area, prominent
**Navigation access:** 1 tap (sidebar Reports) + 1 tap (X-Read sub-nav link) = 2 taps; OR 1 tap from sidebar quick action "X-Reading"
**Touch targets:** PASS — "Generate X-Read" button appears to be a full-height button
**Data/content:** Live totals: Gross ₱79,592, Net ₱77,116, 131 pax, avg ₱589. Payment split visible. 7 historical X-reads displayed (no pagination visible — could become long). Clarifying note at bottom: "X-Reads do NOT close the shift. Use End of Day report to finalize." — excellent UX copy.
**Friction points:**
- No date range selector — only shows today. Manager cannot review yesterday's X-read in context.
- X-Read History shows all 7 reads at once with no visual grouping by date/day
- "Card" payment ₱9,368 in history but Maya is listed as a payment method in POS — "Card" label may be ambiguous (does it include Maya?)
- No print/export option visible for BIR compliance purposes
- "Live — shift still open" status text is small secondary text — could be more prominent given BIR implications
**Accessibility notes:** Payment method icons (💵💳📱) convey meaning without text backup labels — passes since text labels follow each icon

---

### END OF DAY (/reports/eod)
**State captured:** pre-initiation state (shift still open)
**Layout summary:** Very minimal: date header + "Live totals" status + "Start End of Day" button + a large blind-count gatekeeper message. The main content area is hidden behind a 🙈 emoji + "Detailed Reports Hidden" heading + explanatory paragraph.
**Primary action visibility:** CLEAR — "Start End of Day" is the only action available and is immediately visible
**Navigation access:** 2 taps from sidebar (Reports → End of Day) OR 1 tap from sidebar quick action "End of Day"
**Touch targets:** PASS — "Start End of Day" appears prominently placed
**Data/content:** Content intentionally hidden until blind count is initiated — this is correct BIR/cash-count practice. The 🙈 emoji + "Detailed Reports Hidden" message explains the gate clearly.
**Friction points:**
- No way to see yesterday's Z-Read from this page — no history section visible
- The EOD button is unlabeled regarding what happens next (does it lock the POS? does it print? does it close tables?)
- No confirmation guard before "Start End of Day" — this is a destructive/irreversible action that should require confirmation
- "Live totals" label is vague — what is "live" vs. "final"?
**Accessibility notes:** 🙈 emoji as primary content indicator — should have alt text for screen readers

---

### EXPENSES DAILY (/reports/expenses-daily)
**State captured:** loaded
**Layout summary:** "+ Log New Expense" CTA button at top. Date filter buttons (Today/This Week/This Month). 4-metric summary bar (Total Sales ₱13,168, Total Expenses ₱12,571, Net Cash Flow ₱597, Expense Ratio 95.5%). Table with Category/Amount/% of Sales/Proportion columns. Only 2 categories visible (Labor Budget ₱343, Meat Procurement ₱12,228) + TOTAL row.
**Primary action visibility:** CLEAR — "+ Log New Expense" is at top-left, clearly labeled with "+" prefix
**Navigation access:** 2 taps (Reports → Daily) OR 1 tap from sidebar quick action "Log Expense"
**Touch targets:** PASS — button is clearly interactive
**Data/content:** Expense ratio of 95.5% is alarmingly high — but this is seed/test data. The Net Cash Flow ₱597 on ₱13k revenue would be a serious red flag in production. Summary metrics are immediately visible above the table.
**Friction points:**
- Proportion column shows colored bars (not visible in a11y tree but likely visual bars) — without labels, these rely solely on color
- No "Add expense from this page" inline — the CTA button likely opens a modal
- Date filter shows "Today/This Week/This Month" — no custom date range
- Expense categories use emoji icons (💼, 🥩, 📦) which add visual noise without accessibility value
- No "Download" or "Print" option for daily expense audit
**Accessibility notes:** The "Proportion" column appears to use a visual-only bar chart element with no text content in accessibility tree — fails WCAG perceivable. Category emoji icons lack aria-labels.

---

### EXPENSES MONTHLY (/reports/expenses-monthly)
**State captured:** loaded
**Layout summary:** 4-metric summary bar (Total This Month ₱40,107, Total Last Month ₱0, Month-over-Month 0%, Cost Spikes 0). Table with Category/This Month/Last Month/Change %/Status columns. 4 categories: Labor Budget, Petty Cash, Meat Procurement, Miscellaneous.
**Primary action visibility:** MISSING — No "Log Expense" CTA on this page. Monthly view is read-only summary.
**Navigation access:** 2 taps (Reports → Monthly)
**Touch targets:** PASS — no interactive elements beyond the nav
**Data/content:** Month-over-Month shows 0% because Last Month = ₱0 (no historical seed data before this month). "Cost Spikes 0" metric is useful for managerial oversight. Status "Stable" for all items — consistent.
**Friction points:**
- "Change %" shows 0.0% for all items (expected when Last Month = ₱0) — but a manager with real data would see this as "always shows 0%" until data from 2 months accumulates
- No way to select a specific month for comparison
- No "Log Expense" shortcut from Monthly view — manager must navigate back to Daily or use sidebar quick action
- The page heading "Monthly" in the sub-nav tab is too generic for the content (it's specifically an expense category comparison)
**Accessibility notes:** 📦 emoji used as generic category icon for multiple categories (Labor Budget, Petty Cash, Miscellaneous) — three different categories share the same visual icon, violating Gestalt similarity principle

---

### SALES SUMMARY (/reports/sales-summary)
**State captured:** loaded
**Layout summary:** Two filter buttons (Daily/Weekly) + "Live" badge. 5-metric summary bar (Gross Sales, Net Sales, VAT Collected, Avg Ticket Size, Total Pax). Full table with Period/Gross/Disc./Net/VAT Sales/Non-VAT/Tax/Pax columns. 7 data rows (Mar 3-9) + "Today (live)" row highlighted + TOTAL row.
**Primary action visibility:** CONCERN — This is a read-only report. No primary action. The "Daily/Weekly" toggle is the main interaction.
**Navigation access:** 2 taps (Reports → Sales Summary)
**Touch targets:** PASS — filter buttons are adequate size
**Data/content:** Very dense table — 8 columns + header. On a 1024px viewport, this table will require horizontal scrolling or column compression. The "Today (live) LIVE" row has a "LIVE" badge in the Period cell — good visual indicator. Historical data from Mar 3-9 shows realistic samgyupsal revenue.
**Friction points:**
- 8-column table is extremely dense on tablet — likely requires horizontal scroll which is poor on touch devices
- No "This Month" filter — only Daily and Weekly
- No custom date range picker
- "VAT Sales" column header is ambiguous — does it mean "sales subject to VAT" or "VAT collected"? (there's a separate "Tax" column which suggests "VAT Sales" = VATable amount)
- Disc. column header uses abbreviation without tooltip
- TOTAL row merges some columns — inconsistent table structure (missing VAT Sales/Non-VAT breakdown in TOTAL row)
**Accessibility notes:** Dense 8-column table with abbreviated headers (Disc., VAT Sales, Non-VAT) reduces readability on tablet

---

### BEST SELLERS (/reports/best-sellers)
**State captured:** loaded
**Layout summary:** Two category tab buttons (🥩 Meat Cuts / 🍚 Add-ons & Drinks). 3-metric summary (Total Weighed Out 76.4 kg, Meat Revenue ₱65,400, Top Item: Samgyupsal). Table with rank/#/Meat Cut/Weight/COGS/Revenue/Margin columns. 5 meat cuts shown (Samgyupsal, Chadolbaegi, US Beef Belly, Galbi, Woo Samgyup).
**Primary action visibility:** PASS — No primary action needed (read-only). Category tabs are the main navigation.
**Navigation access:** 2 taps (Reports → Best Sellers)
**Touch targets:** PASS — Category tab buttons are large enough
**Data/content:** Rich data — weight, COGS, revenue, and margin percentage per cut. Manager can immediately see which cut is most profitable (Woo Samgyup at 57.6% margin) vs. most popular by weight (Samgyupsal 28,400g). Very actionable for menu/procurement decisions.
**Friction points:**
- Only 5 items visible — does the list scroll? No pagination indicator
- "Meat Revenue ₱65,400" in summary but Gross Sales shows ₱79,592 — the delta (₱14,192) in add-ons/drinks isn't immediately contextualized
- No date range filter (shows cumulative data — what period?)
- COGS values appear to be static/estimated — how does this interact with actual delivery costs?
**Accessibility notes:** 🥩 and 🍚 emoji in button labels — passes since they're decorative alongside text labels

---

### VOIDS & DISCOUNTS (/reports/voids-discounts)
**State captured:** loaded
**Layout summary:** "Today's Voids & Discounts" header + "Live totals" badge. Two side-by-side cards: Left card: Voided Orders (5 orders, ₱2,095 total lost) + Reason Breakdown (Mistakes 2, Walkouts 1, Write-offs 2). Right card: Discounts Applied (10 orders, ₱2,476 total given) + Type Breakdown (PWD ₱898, Promo ₱833, Senior ₱745, Comp ₱0, Service Recovery ₱0).
**Primary action visibility:** MISSING — No action button. Read-only audit report.
**Navigation access:** 2 taps (Reports → Voids & Discounts)
**Touch targets:** PASS — No interactive elements that are too small
**Data/content:** Two-panel layout cleanly separates voids from discounts. Reason/Type breakdown gives manager actionable oversight (2 mistake voids and 1 walkout = potential training issue). The ₱2,476 in discounts vs ₱77k net sales = ~3.2% discount rate — reasonable.
**Friction points:**
- No drilldown into individual void records — manager can see "Mistakes: 2" but cannot see which tables/items/staff member
- No date range filter — today only
- ₱0 values for Comp and Service Recovery shown explicitly — adds visual noise without information value
- Reason breakdown uses plain text labels only — no sparklines or mini-bars to show relative proportion visually
- "Write-offs (Spoilage, etc)" label is very long — likely wraps on small tablets
**Accessibility notes:** Proportion information conveyed only through count numbers — could benefit from visual indicators with aria labels

---

### PEAK HOURS (/reports/peak-hours)
**State captured:** loaded
**Layout summary:** Two filter buttons (Today/This Week). 3-metric summary (Total Guest Covers 30, Peak Hour: 12pm/9 pax, Avg Table Duration 45 min). "Guest Cover Heat Map" section showing 13 hourly slots (10am-10pm) each with pax count + order count. 5-level legend (Low/Moderate/Busy/High/Peak). Data table below with Hour/Pax/Orders/Load columns.
**Primary action visibility:** PASS — No primary action. Filters are the main interaction.
**Navigation access:** 2 taps (Reports → Peak Hours)
**Touch targets:** PASS — Filter buttons are reasonably sized
**Data/content:** Heat map shows 12pm as peak (9 pax, 2 orders) with strong 9pm slot (6 pax). The data table duplicates the heat map information. Manager can use this to staff lunch and dinner rushes correctly.
**Friction points:**
- Heat map is text-only in accessibility tree — the colored bars/cells that make it a "heat map" exist visually but the a11y tree only shows numbers. Heat map without color context is just a table.
- "Load" column in the data table has no values visible in a11y tree (the cell refs are empty) — likely visual-only color coding
- Date filter: only "Today" or "This Week" — no custom date, no weekly comparison
- "Avg Table Duration 45 min" — how is this calculated? Are open tables counted?
- 10pm slot always shows 0 — perhaps restaurant closes before 10pm? If so, this row adds confusion
- "orders" count shows "1 orders" with grammatically incorrect plural
**Accessibility notes:** Heat map color cells appear to have no text content in the a11y tree ("Load" column is empty) — the intensity gradient is conveyed only visually, failing WCAG Perceivable. "1 orders" grammatically incorrect in descriptions.

---

### STAFF PERFORMANCE (/reports/staff-performance)
**State captured:** loaded
**Layout summary:** "Today — Live" header + "Updating from POS orders" subtext. Table with Staff Name/Orders Closed/Total Revenue/Avg Ticket/Voids/Discounts columns. 4 staff members: Maria Santos (18 orders, ₱27,182), Juan Reyes (13 orders, ₱17,547), Ana Reyes (7 orders, ₱16,954), Pedro Cruz (12 orders, ₱15,433).
**Primary action visibility:** PASS — Read-only report. No action needed.
**Navigation access:** 2 taps (Reports → Staff Perf.)
**Touch targets:** PASS — Table rows are adequate height
**Data/content:** Clean table showing revenue per staff member. Manager (Juan Reyes) appears in the table as a cashier — his 5 discounts is the highest, which is contextually correct for a manager who overrides pricing. Good glanceable accountability view.
**Friction points:**
- "Voids" column shows 0 for all staff — this contradicts the Voids & Discounts page which shows 5 voided orders. Data discrepancy could indicate void attribution logic issue.
- No date range filter — today only
- "Avg Ticket ₱1,510" for Maria Santos is suspiciously high vs ₱589 system average — may indicate large-group tables assigned to her
- Staff name avatar initials (Ma, Ju, An, Pe) are shown inline in the cell — this is visual noise without utility
- No sortable column headers
- Page heading in sub-nav uses abbreviated "Staff Perf." which carries over as the page heading
**Accessibility notes:** The `[ref=e293]` link uses abbreviated "Staff Perf." label — fails WCAG Link Purpose criterion (link text should describe destination)

---

### TABLE SALES (/reports/table-sales)
**State captured:** loaded
**Layout summary:** 3 date filter buttons (Today/This Week/This Month) + "Live" badge. 4-metric summary (Total Sessions 50, Total Pax 131, Gross Sales ₱79,592, Net Sales ₱77,116). Table with Table/Zone/Sessions/Pax/Avg Check/Gross/Disc./Net columns. 9 rows: T1-T8, Takeout, TOTAL.
**Primary action visibility:** PASS — Read-only report. Filters are the main interaction.
**Navigation access:** 2 taps (Reports → Table Sales)
**Touch targets:** PASS — Filter buttons are adequate
**Data/content:** All tables in "Main" zone (single zone). T8 leads in revenue (₱12,308) with 4 sessions serving 18 pax. Takeout is the second-highest revenue row. Avg Check per table varies significantly (T6 ₱497 vs T8 ₱684). Useful for floor layout optimization decisions.
**Friction points:**
- Same 8-column density as Sales Summary — likely requires horizontal scroll on tablet
- "Zone" column only shows "Main" for all tables (no VIP/Bar zones populated) — makes the column redundant
- Takeout row mixes with table rows — no visual separator to distinguish dine-in from takeout
- Sessions sorted by revenue descending — correct primary sort order
- No ability to drill into individual sessions for a specific table
**Accessibility notes:** Abbreviated "Disc." header without tooltip reduces clarity for new managers

---

### GROSS PROFIT (/reports/profit-gross)
**State captured:** loaded
**Layout summary:** 3 date filter buttons (Today/This Week/This Month). 4-metric summary (Net Revenue ₱13,168, Food COGS ₱8,500, Gross Profit ₱4,668, Gross Margin 35.4%). Two-column layout: COGS breakdown table (left) + Profit Waterfall visualization (right). Waterfall shows: Revenue ₱13,168 → minus Food COGS −₱8,500 → = Gross Profit ₱4,668. Source note: "COGS = logged Meat Procurement + Produce & Sides expenses".
**Primary action visibility:** PASS — Read-only. Clear visualization.
**Navigation access:** 2 taps (Reports → Gross Profit)
**Touch targets:** PASS
**Data/content:** 35.4% gross margin for samgyupsal is industry-realistic. The Profit Waterfall is a helpful visual for non-analytical managers. The "Live from RxDB" note and calculation explanation are excellent transparency features.
**Friction points:**
- COGS calculation depends entirely on properly logged expenses — if manager forgot to log a Meat Procurement expense, COGS will be understated
- No warning indicator when COGS seems anomalously low vs. revenue (e.g., <20% food cost = suspicious)
- "Gross Margin 35.4%" headline metric — 35% gross on samgyupsal is realistic but seeing it without context (industry benchmark) is less useful
- Date filter: switching to "This Week" or "This Month" may show ₱0 profit if expenses were logged in wrong period
**Accessibility notes:** Profit Waterfall visual component (the step chart visualization) is not accessible in the a11y tree — only text values are present in the snapshot

---

### NET PROFIT (/reports/profit-net)
**State captured:** loaded (active shift: shows ₱4,016 net profit 30.5% margin)
**Layout summary:** 3 date filter buttons. 4-metric summary (Gross Profit ₱4,668, Operating Expenses ₱652, Net Profit ₱4,016, Profit Margin 30.5%). Table with Line Item/Amount/Share columns. "Take-Home Profit" callout card + Calculation explanation.
**CRITICAL FINDING:** When switching to "Today" from a period with no data (test observed: snapshot showed ₱0 for all metrics with "No operating expenses logged for this period" in the table), the page silently shows ₱0. This occurred during the audit session when the page re-rendered in a different state.
**Primary action visibility:** PASS — Read-only. Clear layout.
**Navigation access:** 2 taps (Reports → Net Profit)
**Touch targets:** PASS
**Data/content:** Clear waterfall: Gross Profit minus Operating Expenses = Net Profit. "Take-Home Profit" callout with percentage provides an immediately understandable summary. Calculation footnote is good transparency.
**Friction points:**
- "Share" column in the table appears empty in the a11y tree — visual percentage bars are not accessible
- When no expenses are logged, the "No operating expenses logged for this period" table message could be confused for "no expenses = 100% net profit" — should clarify
- No comparison vs. previous period on same page
**Accessibility notes:** "Share" column visual bar elements have no text content in a11y tree

---

### BRANCH COMPARISON (/reports/branch-comparison)
**State captured:** loaded (accessible to manager role)
**Layout summary:** 3 date filter buttons (Today/This Week/This Month). Two-headline cards (Tagbilaran ₱37,009 Net Profit vs Panglao ₱31,176 Net Profit). Table with Metric/Tagbilaran Branch/Panglao Branch columns. 9 metrics: Gross Revenue, Net Revenue, Total Expenses, Gross Profit, Net Profit, Gross Margin, Net Margin, Total Pax, Avg Ticket. Winner column indicated with ✓ in cell.
**Primary action visibility:** PASS — Read-only comparison table.
**Navigation access:** 2 taps (Reports → Compare)
**Touch targets:** PASS
**Data/content:** Manager CAN access branch comparison — not locked to owner-only. This is correct per CLAUDE.md (manager can switch locations and view aggregate data). Tagbilaran leads on revenue and profit; Panglao leads on pax count and lower expenses.
**Friction points:**
- ✓ checkmark in the winning cell is the only differentiation — no color coding (e.g., green for winner, gray for loser)
- The sidebar shows the user is still at "ALTA CITTA (TAGBILARAN)" — a LocationBanner prompt might help orient that this is aggregate/cross-branch data
- Both branches listed by city name ("Tagbilaran Branch" / "Panglao Branch") — inconsistent with the system's canonical branch names ("Alta Citta" / "Alona Beach")
- 9 rows of metrics with minimal visual hierarchy — no grouping between revenue/expense/profit sections
- Date filter defaults to "Today" — cross-branch comparison at day-level may show high variance due to timing differences
**Accessibility notes:** ✓ as the only winner indicator has no aria-label; color-blind users cannot distinguish winning vs. losing branch without the checkmark character

---

### STOCK VARIANCE (/reports/stock-variance)
**State captured:** loaded
**Layout summary:** "Stock Variance & Drift" heading + explanatory paragraph. Time-slot filter buttons (AM 10:00 / PM 4:00 / PM 10:00). Warning banner: "90 items with missing stock — 48956.00 g unaccounted". Dense table: Item/Delivered/Sold/Waste/Expected/Counted(AM 10:00)/Drift/Drift% columns.
**Primary action visibility:** CONCERN — The alert "90 items with missing stock — 48956.00 g unaccounted" is alarming but there's no "Investigate" or "Fix" action. The page shows the problem but offers no path forward.
**Navigation access:** 2 taps (Reports → Stock Variance). Also reachable within Reports nav group "Operations."
**Touch targets:** PASS — Time slot buttons are adequate
**Data/content:** First 5 rows: Pork Bone-In (+13,250g drift = +64.6%), Pork Bone-Out (+6,250g = +46.3%), Beef Bone-In (+5,150g = +54.2%), Chicken Leg (+5,100g = +63.7%), Sliced Pork (+4,750g = +39.6%). All positive drift = unaccounted "surplus" inventory. This is seed data but positive drift (expected less than counted) typically means either: undocumented deliveries, counting errors, or FIFO calculation issues.
**Friction points:**
- Alert banner text is long ("90 items with missing stock — 48956.00 g unaccounted") — the numbers are scary but unhelpful without context of what "missing" means
- Table has 8 columns — dense on tablet
- "Drift %" values use decimal precision (e.g., +64.6%) — could be rounded to integers for glanceable use
- No sort/filter on the table — always sorted by drift amount descending? Not clear
- No direct link from Variance table to the Stock Counts page to resolve discrepancies
- Qty values displayed as raw integers without units (g, kg, portions) in some cells
**Accessibility notes:** Warning alert has no role="alert" or equivalent in a11y tree — screen readers would not announce it as urgent

---

### MEAT REPORT (/reports/meat-report)
**State captured:** loaded
**Layout summary:** Three date buttons (Today/Yesterday/This Week) + "Live" badge. View toggle: Consumption/Transfers/Conversion. 7 summary KPI cards (Total Sold 0g, Avg/Head 0g, Pork/Head 0%, Beef/Head 0%, Chicken/Head 0%, Pax Served 26, Avg Variance +61.1%). Dense table: Cut/Open/In/Used/Waste/Close/Var%/Drift/Status columns. 12 meat cuts listed across pork (5), beef (5), chicken (2) sections.
**Primary action visibility:** CONCERN — KPI cards show 0g for Total Sold/Avg/Head (seed data issue — weighing not logged today). Avg Variance of +61.1% is prominent but not actionable from this screen.
**Navigation access:** 1 tap from sidebar "Reports" (redirects to meat-report as landing page!)
**Touch targets:** PASS — view toggle buttons are adequate
**Data/content:** The 12-cut table provides detailed meat tracking: Open stock, Deliveries In, Amount Used (sold), Waste, Closing stock, Variance %, Drift, Status. "Low Turnover" status on all cuts due to seed data. The Consumption/Transfers/Conversion tabs provide three angles on the same data.
**Friction points:**
- ALL KPI cards (Total Sold, Avg/Head, Pork/Head, Beef/Head, Chicken/Head) show 0g — this is because "Used" column = 0g for all cuts. This represents either seed data not having weight-tracked orders, or a data calculation gap. A manager would immediately think the system is broken.
- "Avg Variance +61.1%" on the KPI bar while "Total Sold: 0g" creates a logical contradiction that could confuse managers
- Reports landing redirects to meat-report as the default — but it's the most complex and data-dense report. A simpler X-Read or Sales Summary might be a better default.
- Table has 9 columns — most dense table in the system
- "Status" values are all "Low Turnover" (except Pork Bones = "Normal") — with all Used = 0g this status is meaningless in dev
- "Drift" column cells are empty in a11y tree (visual-only bar chart)
**Accessibility notes:** Drift column visual bars have no text content in a11y tree; all 0g KPI values create a false "system broken" impression

---

### STOCK INVENTORY (/stock/inventory)
**State captured:** loaded with full inventory
**Layout summary:** "Stock Management" heading with sub-nav (Inventory / Deliveries [1] / Transfers / Counts [1] / Waste Log). 4 filter stat cards (Total Items 93, OK 93, Low Stock 0, Critical 0) — all interactive/filterable. Search box + Expand All/Collapse All + List/Grid toggle. Data table: Category group rows expandable, with columns: checkbox / Item ↑ / Category / Stock Level bar / Current/Min / Status / action button.
**Primary action visibility:** CONCERN — The 4 stat cards double as filters AND status indicators. This is clever but a new manager might not realize they're clickable. There's no "Add Stock" or "Log Delivery" primary action — those are in sub-pages.
**Navigation access:** 1 tap from sidebar "Stock" link
**Touch targets:** PASS — Stat cards are large; table rows have +/- action buttons
**Data/content:** 93 items across multiple categories. All "OK" status with 0 critical/low stock items (seed data is fully stocked). Category groups are collapsible. "Deliveries 1" and "Counts 1" badges in sub-nav indicate pending items requiring attention — excellent proactive alerting.
**Friction points:**
- 93 items in a table is a long list — even with group collapsing, this is heavy scrolling
- "Stock Level" column appears to use a visual progress bar (not visible in a11y tree)
- The List/Grid view toggle (e1688/e1690) has icon-only buttons without text labels
- "Expand All / Collapse All" buttons are useful but placed in the toolbar; a new manager may not understand the grouped view structure
- The table has a checkbox column (e1696) with no header label — suggests batch selection functionality but it's not clear what batch actions are available
- "Current / Min" is a sortable column — manager needs to know what "Min" means in context (reorder point?)
**Accessibility notes:** List/Grid toggle buttons are icon-only without text labels or aria-labels visible in a11y tree; Stock Level column bar is visual-only with no text equivalent

---

### STOCK DELIVERIES (/stock/deliveries)
**State captured:** loaded with history (3 batches today + historical)
**Layout summary:** "Expiring Soon (1)" alert banner (Kimchi B-243, 2d left). "Delivery History & Batches" section heading + paragraph + "Receive Delivery" CTA button. Search/filter bar (search text + date dropdown + item dropdown + "Show Depleted" checkbox). History table: Time/Item+Supplier/Qty/Batch+Expiry/FIFO Usage columns. 4+ delivery rows visible.
**Primary action visibility:** CLEAR — "Receive Delivery" button with truck icon is prominently placed in the section header area
**Navigation access:** 1 tap from sidebar "Stock" + 1 tap "Deliveries" in sub-nav. Also 1 tap from sidebar quick action "Receive Delivery"
**Touch targets:** PASS — "Receive Delivery" button is full-height with icon
**Data/content:** Deliveries show: Pork Bone-In 5000g (Metro Meat Co., batch B-241, exp 2026-03-13), Soju 6 bottles (SM Trading, B-242), Kimchi 10 portions (Korean Foods PH, B-243, exp 2026-03-10 — EXPIRING SOON), plus several transfer records (TRF-A1TAG, TRF-A2TAG from wh-tag). FIFO progress bars show remaining vs. used quantities.
**ISSUE FOUND — Receive Delivery Modal:** Clicking "Receive Delivery" button marks it as [active] but the modal content does NOT appear in the accessibility tree. The `showModal` state triggers but either: (a) the modal renders outside the a11y tree scope, or (b) the modal failed to mount. This is a potential rendering issue.
**Friction points:**
- "Receive Delivery" button click did not visibly open a modal in the snapshot — unclear if the form appeared visually but was missed by the a11y capture, or if there's a rendering bug
- Item dropdown for filtering contains ALL 93 stock items as a flat list — overwhelming for a manager trying to filter to a specific item
- FIFO progress bar cells contain text like "0 5000 left 0 used" without unit labels — ambiguous without context
- "Transfer from wh-tag" entries share the same table as direct deliveries — could be separated visually
- Batch numbers (B-241, B-242) shown but no description of what makes a batch number meaningful
**Accessibility notes:** FIFO Usage column progress bars rely on visual context; "Show Depleted" checkbox label is compact

---

### STOCK COUNTS (/stock/counts)
**State captured:** loaded with AM10 tab active
**Layout summary:** Three time-slot tabs (Morning 10:00 AM, Afternoon 4:00 PM, Evening 10:00 PM Pending). Morning tab active. Informational banner: "Count not yet started. Enter actual counts below, then tap Submit Count to lock in this session." Table: Item/Expected/Counted/Shortage+Surplus columns. Spinbutton controls (+/-/number) in the Counted cell for each item. Multiple items visible (Pork Bone-In 20,500g, Pork Bone-Out 13,500g, Chicken Wing 6,000g, Chicken Leg 8,000g, Kimchi 25 portions, Steamed Rice 21 portions, Soju 23 bottles, Lettuce 3,000g, Perilla Leaves 3,000g + more).
**Primary action visibility:** CLEAR — Instructional text explicitly names the "Submit Count" button. The table with inline spinbuttons is the primary interaction zone.
**Navigation access:** 1 tap "Stock" + 1 tap "Counts" in sub-nav. Also 1 tap from sidebar quick action "Stock Count." Counts badge shows "1" — "Pending" status on PM10 slot.
**Touch targets:** CONCERN — The spinbutton controls (+/- buttons flanking a number input) are small. In a11y tree, the + and - buttons appear as `button [ref=eXXX]` with `img` children but no text labels. On a tablet with a manager's finger, these +/- buttons may be under 44px and adjacent to each other (easy to tap wrong one).
**Data/content:** Expected quantities pre-filled from RxDB computed expected values. Shortage/Surplus column shows "—" until a count is entered. The PM10 "Pending" badge draws attention to the next required count.
**Friction points:**
- Spinbutton controls have unlabeled + and − buttons (icon-only) — fails WCAG for button labels
- No "bulk entry" mode — manager must tap +/- for each of 90+ items one by one
- No keyboard-type input apparent — only +/- steppers. For large quantities (20,500g → 18,200g) this would require hundreds of taps
- No progress indicator showing "X of Y items counted"
- No "Save draft" — if manager is interrupted, are partial entries saved?
- Time-slot header uses "PM 4:00" format — inconsistent with "4:00 PM" format in the tabs
**Accessibility notes:** +/- stepper buttons are icon-only with no aria-label; spinbutton input type may not communicate units (g, portions, bottles) to screen readers

---

### STOCK WASTE (/stock/waste)
**State captured:** loaded
**Layout summary:** Summary section with metrics (items captured above fold). "Today's Waste Log" heading + "Preparation waste only — not unconsumed customer leftovers" clarifying subtitle + "Log Waste" CTA button. History table: Item/Qty/Reason/By/Time columns. 1 waste entry: Soju (Original) 1 bottle, Unusable (damaged), Maria S., 12:30 AM.
**Primary action visibility:** CLEAR — "Log Waste" button with icon is prominently placed
**Navigation access:** 1 tap "Stock" + 1 tap "Waste Log" in sub-nav. Also 1 tap from sidebar quick action "Log Waste"
**Touch targets:** PASS — "Log Waste" button is adequate size
**Data/content:** Clarifying subtitle "Preparation waste only — not unconsumed customer leftovers" is excellent — removes ambiguity. Summary includes Most Wasted Item (Soju Original) and Most Common Reason (Unusable/damaged). Waste breakdown by reason chart is shown (from accessibility tree: "Unusable (damaged): 1 = 100%").
**Friction points:**
- Only 1 waste entry visible — insufficient to evaluate scrolling behavior with real data volume
- "By" column shows initials ("Maria S.") — may be ambiguous with multiple staff with same first name
- Waste Breakdown by Reason visual chart appears to show "Unusable (damaged): 1" as a bar/percentage — not accessible without text equivalent in the a11y tree
- No date range filter — only today's log
- No ability to edit/delete a waste entry (error recovery)
**Accessibility notes:** Waste breakdown visual component has limited a11y text; "By" column uses truncated names without full name tooltip

---

### STOCK TRANSFERS (/stock/transfers)
**State captured:** loaded (form in initial state)
**Layout summary:** 3-step wizard inline on the page: Step 1 (Select Item), Step 2 (Destination), Step 3 (Confirm). Source is pre-filled: "Source: Tagbilaran Branch (Alta Citta)". Step 1 shows a full item dropdown with 90+ options, categorized (Meats, Sides, Drinks, Pantry). Previous transfers history likely below the wizard (not captured fully).
**Primary action visibility:** CLEAR — The 3-step wizard structure is immediately understandable. Source branch is pre-filled from session.
**Navigation access:** 1 tap "Stock" + 1 tap "Transfers" in sub-nav. Also 1 tap from sidebar quick action "Transfer Stock"
**Touch targets:** PASS — Dropdown is a native combobox (adequate touch target)
**Data/content:** Item dropdown contains all 90+ stock items in a flat list without grouping by category visible in the native dropdown. Source is locked to current location (correct — prevents accidental wrong-branch transfers).
**Friction points:**
- Item dropdown is a native `<select>` with 90+ ungrouped options — violates Hick's Law significantly. A manager looking for "Pork Bone-In" must scroll through an alphabetical list
- No search/typeahead within the dropdown
- 3-step wizard is inline (not a modal) — this is good for context preservation, but the "Steps" labels (1/Select Item, 2/Destination, 3/Confirm) lack icon differentiation
- Previous transfers history (expected to be below the wizard) was not captured due to session interruption
**Accessibility notes:** Long native `<select>` with 90+ options is technically accessible but functionally painful; grouped `<optgroup>` elements would help

---

## CROSS-MODULE NAVIGATION

**Reports → Stock → POS navigation path:**

From any Reports page: tap "Stock" in the left sidebar = 1 tap → lands on /stock/inventory
From any Stock page: tap "POS" in the left sidebar = 1 tap → lands on /pos floor plan
From any POS page: tap "Reports" in the left sidebar = 1 tap → lands on /reports/meat-report

**Verdict:** Cross-module navigation is excellent — 1 tap from any module to any other module via the persistent sidebar. This is a strong Jakob's Law implementation.

**Sidebar quick actions** (icon rail between brand and nav items) provide direct deep-links:
- Receive Delivery → /stock/deliveries?action=open
- Log Expense → /reports/expenses-daily?action=open
- Log Waste → /stock/waste?action=open
- Stock Count → /stock/counts?action=open
- X-Reading → /reports/x-read?action=open
- Transfer Stock → /stock/transfers?action=open
- End of Day → /reports/eod?action=open

These quick actions are exclusively icon-based (no text labels in the collapsed sidebar). A new manager may not know what each icon means.

**CRITICAL BUG OBSERVED:** The session expired multiple times during this audit without any user action. The browser session was reset to the login page mid-navigation approximately 4 times in ~15 minutes of usage. This is catastrophic for a manager trying to check reports during a busy dinner shift. Root cause likely: Svelte session store not persisted to localStorage/sessionStorage — session lives in memory only and resets on any navigation that causes a full page reload or component remount.

---

## A. TEXT LAYOUT MAP

### Reports Section Layout
```
+--sidebar--(60px)--+----reports-content-area---(964px)---+
| [W!]              | [ALTA CITTA (TAGBILARAN)] [Change]  |
| ──────────        | ──────────────────────────────────── |
| [quick actions]   | [Consolidated Reports]               |
|  ↑ receive       | [Operations|Expenses|Revenue|Profit|Branch] <- sub-nav |
|  💰 expense      | ┌──────────────────────────────────┐  |
|  🗑 waste        | │  [KPI cards row]                 │  |
|  📊 count        | │  metric metric metric metric      │  |
|  📋 x-read       | ├──────────────────────────────────┤  |
|  ↔ transfer      | │  [Data table - 8 col dense]       │  |
|  📅 eod          | │  row row row row row              │  |
| ──────────        | │  ...                              │  |
| [POS]             | │  ~~fold~~ (at ~400px)             │  |
| [Kitchen]         | │  ...more rows...                  │  |
| [Stock]           | └──────────────────────────────────┘  |
| [Reports] ← active|                                      |
| ──────────        |                                      |
| [J] [logout]      |                                      |
+-------------------+--------------------------------------+
```

### Stock Section Layout
```
+--sidebar--(60px)--+----stock-content-area---(964px)-----+
| [W!]              | [ALTA CITTA (TAGBILARAN)] [Change]   |
| ──────────        | ─────────────────────────────────── |
| [quick actions]   | [Stock Management]                   |
|                   | [Inventory|Deliveries[1]|Transfers|Counts[1]|Waste] |
| [POS]             | ┌──────────────────────────────────┐  |
| [Kitchen]         | │ [stat cards] Total OK Low Critical │ |
| [Stock] ← active  | ├──────────────────────────────────┤  |
| [Reports]         | │ [search][expand][collapse][list|grid]│|
| ──────────        | ├──────────────────────────────────┤  |
| [J] [logout]      | │ [table with groups]               │  |
|                   | │ ▼ Beef (5 items)                  │  |
|                   | │ ▼ Chicken (2 items)               │  |
|                   | │ ~~fold~~                          │  |
|                   | │ ▼ Pork (5 items)                  │  |
|                   | └──────────────────────────────────┘  |
+-------------------+--------------------------------------+
```

---

## B. PRINCIPLE-BY-PRINCIPLE ASSESSMENT

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Reports sub-nav has 15 links across 5 groups; Operations group alone has 7 links; Stock Transfers item dropdown has 90+ ungrouped options | Limit Operations group to 5 items; add search/grouping to transfer item dropdown |
| 2 | **Miller's Law** | CONCERN | Reports sub-nav exceeds 7±2 at group level; Sales Summary/Table Sales/Stock Variance tables have 8 columns each — dense on tablet | Chunk dense tables into expandable sections; consolidate or hide infrequently used sub-nav links |
| 3 | **Fitts's Law** | CONCERN | Stock Counts +/- stepper buttons are small (icon-only) and adjacent; sub-nav text links may be under 44px height; sidebar quick-action icons are small-touch targets | Increase stepper button size to min 44px; add padding to sub-nav links; label sidebar quick actions |
| 4 | **Jakob's Law** | PASS | Left sidebar nav follows standard POS layout; primary actions (Generate X-Read, Start EOD, Log Waste) are conventionally placed at top of content |  |
| 5 | **Doherty Threshold** | PASS | RxDB local-first means all data loads instantly; no observed loading spinners or delays | Monitor for performance degradation as data grows |
| 6 | **Visibility of System Status** | CONCERN | Session expiry gives no warning — user is silently redirected to login mid-session; "Deliveries 1" and "Counts 1" sub-nav badges are excellent positive examples; active report link has no `aria-current` | Implement session timeout warning (e.g., "Your session will expire in 2 minutes"); add `aria-current="page"` to active sub-nav links |
| 7 | **Gestalt: Proximity** | PASS | KPI cards are grouped together; report sub-nav groups are visually labeled; waste log summary and log button are adjacent |  |
| 8 | **Gestalt: Common Region** | CONCERN | Reports section uses a flat sub-nav without card containers per group; Stock Transfers wizard steps are labeled but not visually enclosed | Use bordered/shaded containers per reports group; visually enclose each wizard step |
| 9 | **Visual Hierarchy (scale)** | CONCERN | "Generate X-Read" and "Start End of Day" are primary CTAs but appear same visual size as filter buttons on some pages; KPI values are prominent but units are small | Make primary action buttons visually larger than secondary filters |
| 10 | **Visual Hierarchy (contrast)** | PASS | LocationBanner always visible; section headings are clearly larger than body text; "Live" badges provide status at a glance |  |
| 11 | **WCAG: Color Contrast** | CONCERN | Peak Hours "Load" column is visual-only color; Drift columns use visual-only bars; Expense ratio "Proportion" column uses visual bars without text; Branch Comparison ✓ winner indicator uses only text symbol | Add text equivalents to all visual-only data columns; add text labels to branch comparison winner indicator |
| 12 | **WCAG: Touch Targets** | CONCERN | Stock Counts +/- buttons are icon-only and potentially under 44px; Stock Inventory List/Grid toggle are icon-only; sidebar quick-action icons may be under 44px; sub-nav text links need height verification | Audit all icon-only buttons for 44×44px minimum; add text labels or aria-labels |
| 13 | **Consistency (internal)** | CONCERN | Date filter patterns vary by page (Today/Yesterday/This Week, Today/This Week/This Month, Today/This Week — no standard pattern); "Stock" terminology mixed with "Inventory"; "Staff Perf." vs full names elsewhere | Standardize date filter options across all report pages; use consistent full names |
| 14 | **Consistency (design system)** | PASS | `.btn-primary`, `.btn-secondary`, `.pos-card` classes are used consistently; orange accent color is consistently the CTA color; LocationBanner appears on every authenticated page |  |

---

## C. "BEST DAY EVER" VISION

Juan Reyes, manager at Alta Citta, arrives for his opening shift at 9:30 AM. He logs in with his PIN in under 10 seconds — the system knows he's the manager for this branch and his quick-action rail is pre-loaded with exactly the tools he uses every morning.

His first move is Stock Counts. He taps "Stock Count" from the quick-action rail and lands directly on the Morning 10:00 AM tab, pre-filled with yesterday's closing quantities as the expected values. He walks the cold room with the tablet, updating each cut with a single tap on a large +/- button (big enough that even with gloves on, he hits the right one). After entering all 12 meat cuts, he taps "Submit Count" and the system locks the AM count. The Counts badge disappears. He spends 8 minutes on this.

Next: the delivery truck arrives. He taps "Receive Delivery" from the quick-action rail. A clean modal opens. He types "Pork" in the search field and instantly sees only pork cuts to select from. He enters the quantity, snaps a photo of the delivery receipt, and saves. The delivery appears in the FIFO log and the stock level updates immediately. He spends 3 minutes on this.

Before opening, he checks the X-Read from yesterday. He navigates to Reports → X-Read. He taps "Yesterday" to see the prior day's figures. He sees ₱17,102 gross, ₱16,828 net, 25 pax — solid Saturday numbers. He generates a mid-day X-Read at noon to track the lunch rush, and the system adds it to the history cleanly.

During lunch, he glances at Reports → Peak Hours. 12pm shows red/peak — the heatmap makes it immediately obvious that tables T2 and T4 are doing the most covers. He knows to have extra staff ready at those stations.

At end of day, he taps "End of Day" from the quick-action rail, does his blind cash count, and the system auto-generates the Z-Read with all the BIR-compliant figures. He signs off, and the system is ready for tomorrow.

**Current gaps vs. this ideal:**
1. The session expires randomly mid-shift — shattering the flow completely
2. Stock Counts spinbuttons are too small for fast entry, especially with kitchen-worn hands
3. The Reports → Meat Report default landing shows all-zero KPIs, making Juan think the system is broken each time he opens Reports
4. The item dropdown in Transfers forces Juan to scroll through 90 items alphabetically when he knows exactly which cut he needs
5. The Sales Summary table requires horizontal scrolling on his 10" tablet — a dense 8-column table that breaks the one-thumb operation principle
6. There's no warning before his session expires, no "coming back soon" state — the system just silently resets to login with no explanation

---

## D. PRIORITIZED RECOMMENDATIONS

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | **SESSION EXPIRY WITHOUT WARNING** — Session resets to login page mid-session with no warning, 3-4 times in 15 minutes during audit. Catastrophic during a live shift. Likely cause: session stored in Svelte $state (memory-only), reset on component teardown/hot-reload or page refresh. | Persist session to `localStorage` (already partially implemented per CLAUDE.md's session store). Add a session timeout warning toast 2 minutes before expiry. Ensure session survives page navigations. | M | High |
| **P0** | **REPORTS LANDING DEFAULTS TO MEAT REPORT WITH ALL-ZERO KPIs** — /reports redirects to /reports/meat-report which shows "Total Sold: 0g, Avg/Head: 0g" due to absence of weight-tracked sales. A manager sees this as "the system is broken" on every shift. | Change reports landing to redirect to /reports/x-read (most actionable daily report) OR add a status-aware reports dashboard that shows the most relevant report based on time-of-day | S | High |
| **P0** | **STOCK COUNTS +/- BUTTONS ARE ICON-ONLY AND POTENTIALLY TOO SMALL** — Spinbutton increment/decrement buttons in the Counts table use icon-only buttons with no aria-labels and are likely under 44px. During a stock count walk, manager uses tablet one-handed and needs large, clearly labeled controls. | Increase +/- button min size to 48px×48px; add aria-label="Decrease quantity" and aria-label="Increase quantity"; consider adding a large numeric keypad tap-to-enter for big quantity changes | S | High |
| **P1** | **TRANSFERS ITEM DROPDOWN HAS 90+ FLAT OPTIONS** — No search, no grouping by category. Violates Hick's Law. Manager must scroll through an alphabetical list of 90 items. | Replace native `<select>` with a searchable combobox input. Use `<optgroup>` at minimum for category grouping. | M | High |
| **P1** | **REPORTS SUB-NAV HAS NO ACTIVE PAGE INDICATOR** — The currently active report link has no visible selection state (`aria-current="page"` missing). Manager cannot immediately tell which report they're viewing from the sub-nav. | Add `aria-current="page"` to active link; apply visual active state (bold + accent underline) using the existing design token | S | High |
| **P1** | **PEAK HOURS "LOAD" COLUMN AND ALL DRIFT/VARIANCE BAR CHARTS ARE VISUAL-ONLY** — The heatmap colors, Drift bars, Stock Level bars, Profit Waterfall bars, and Load column all convey data through color/visual only with no text equivalent in the accessibility tree. | Add `aria-label` with text description to all visual bar components; add text percentage/value labels inside or adjacent to visual bars | M | High |
| **P1** | **DATE FILTER OPTIONS ARE INCONSISTENT ACROSS REPORT PAGES** — X-Read shows only Today; Peak Hours shows Today/This Week; Gross Profit shows Today/This Week/This Month; Sales Summary shows Daily/Weekly. No custom date range anywhere. | Standardize to Today/Yesterday/This Week/This Month across all report pages; add a date range picker for custom queries | L | High |
| **P1** | **EOD "START END OF DAY" HAS NO CONFIRMATION GATE** — Clicking "Start End of Day" immediately begins the blind count process without a confirmation dialog. This is a high-consequence action (starts the cash closing process) with no undo path. | Add a confirmation modal: "Are you sure you want to start End of Day? This will begin the blind cash count process." with Cancel/Proceed buttons | S | High |
| **P1** | **SIDEBAR QUICK-ACTION ICONS ARE ICON-ONLY WITHOUT TEXT LABELS** — The quick-action rail (Receive Delivery, Log Expense, Log Waste, etc.) uses icon-only buttons in the collapsed sidebar. New managers cannot identify the icons without tooltips. | Add visible text labels to quick-action items in expanded sidebar state; add tooltips (`title` attribute) to collapsed state; consider showing a 2-3 word label on hover/focus | S | Med |
| **P1** | **STOCK COUNTS: NO BULK ENTRY OR KEYBOARD INPUT FOR LARGE QUANTITIES** — Using +/- steppers to enter 18,200g from 20,500g requires 2,300 individual button taps. | Implement tap-to-type: tapping the spinbutton value opens a numpad input (like a calculator) where the manager can type the exact count directly | M | High |
| **P2** | **SALES SUMMARY AND TABLE SALES TABLES ARE 8 COLUMNS WIDE** — Dense table will require horizontal scrolling on most tablets. | Prioritize 4-5 most important columns for default view; hide secondary columns (VAT Sales, Non-VAT, Tax) behind a "More" toggle or column selector | M | Med |
| **P2** | **EXPENSES MONTHLY: ALL CATEGORIES SHOW 📦 EMOJI ICON** — Three unrelated categories (Labor Budget, Petty Cash, Miscellaneous) all use the 📦 box emoji, making them visually identical. | Assign distinct icons per expense category (e.g., 👥 for Labor, 💰 for Petty Cash, 📦 for Miscellaneous) | S | Low |
| **P2** | **BRANCH COMPARISON: BRANCH NAMES INCONSISTENT** — Table uses "Tagbilaran Branch" and "Panglao Branch" instead of the canonical "Alta Citta" and "Alona Beach" names used everywhere else in the app. | Replace with canonical branch names: "Alta Citta (Tagbilaran)" and "Alona Beach (Panglao)" | S | Low |
| **P2** | **STAFF PERFORMANCE: "VOIDS" COLUMN SHOWS 0 FOR ALL STAFF** — But Voids & Discounts page shows 5 voided orders. This data discrepancy indicates a bug in void attribution to staff. | Audit void attribution logic — voids from manager PIN overrides may not be attributed to the initiating staff member | M | Med |
| **P2** | **REPORTS LANDING: NO ORIENTATION/DASHBOARD PAGE** — Manager navigates to "Reports" expecting a landing page but gets redirected directly to a specific report. No overview of what reports exist and what each does. | Add a simple /reports index page showing report categories with brief descriptions and "last accessed" indicators | L | Med |

---

## KEY FINDINGS SUMMARY

1. **[CRITICAL] Session expires silently mid-use** — confirmed 3-4 times in 15 minutes. The manager is silently redirected to login without warning during a live shift. This is service-blocking.

2. **[HIGH] Reports landing defaults to all-zero Meat Report** — every time a manager opens Reports, they see 0g/0g/0g KPIs which reads as "broken system." Redirect default to X-Read or a dashboard.

3. **[HIGH] Stock Counts +/- steppers are not usable for fast entry** — icon-only, potentially under 44px, no bulk entry or keyboard input for large gram quantities. Counting 90+ items with +/- buttons is impractical.

4. **[HIGH] Visual-only data columns throughout Reports** — Load, Drift, Stock Level, Proportion, Waterfall bars convey data through color/visual only. Zero text equivalents in accessibility tree.

5. **[HIGH] No confirmation gate on "Start End of Day"** — the most consequential action in the app (initiates BIR closing process) has no confirmation modal.

6. **[HIGH] Date filter options inconsistent across all report pages** — each page uses different filter options; no custom date range anywhere in the system.

7. **[MEDIUM] Transfers item dropdown is a flat 90-item list** — no search, no grouping. Violates Hick's Law. Manager must scroll through all items alphabetically.

8. **[MEDIUM] Sub-nav active page indicator missing** — no `aria-current="page"` on active report link. Manager cannot confirm which report they're viewing from the nav.

9. **[MEDIUM] Sidebar quick-action icons are unlabeled** — 7 quick-action shortcuts that are critical to a manager's workflow have no text labels in collapsed state.

10. **[MEDIUM] Staff Performance "Voids" column shows 0 for all staff** — contradicts Voids & Discounts page which shows 5 voided orders. Data attribution bug.

---

## LAYOUT SNAPSHOTS

### Login Page
```
generic:
  heading "WTF! SAMGYUP" [level=1]
  paragraph: Restaurant POS
  textbox "Username"
  textbox "Password"
  button "LOGIN →" [disabled]
  button "System Admin"
  [right panel - dev accounts]:
    heading: 🧪 Dev — Test Accounts
    group "🏠 Alta Citta · Tagbilaran":
      button "M Maria Santos Staff Alta Citta ›"
      button "J Juan Reyes Manager Alta Citta PIN ›"  ← target
      button "P Pedro Cruz Kitchen Alta Citta ›"
    group "🏠 Alona Beach · Panglao": [3 buttons]
    group "🏭 Tagbilaran Warehouse": [1 button]
    group "💼 Management": [1 button]
  [PIN modal when manager selected]:
    heading "Manager PIN" [level=2]
    button "1"-"9", "0", "⌫"
    button "VERIFY PIN" [disabled→enabled after 4 digits]
    button "← Back"
```

### Reports Landing (/reports/meat-report)
```
heading "ALTA CITTA (TAGBILARAN)" + button "Change Location"
heading "Consolidated Reports" [level=1]
navigation:
  group "Operations": Meat Report | Stock Variance | Table Sales | Voids & Discounts | X-Read | End of Day | Staff Perf.
  group "Expenses": Daily | Monthly
  group "Revenue & Sales": Sales Summary | Best Sellers | Peak Hours
  group "Profitability": Gross Profit | Net Profit
  group "Branch": Compare
[meat report content]:
  button "Today" / "Yesterday" / "This Week"  + generic "Live"
  button "Consumption" / "Transfers" / "Conversion"
  [KPI cards]: Total Sold 0g | Avg/Head 0g | Pork/Head 0g | Beef/Head 0g | Chicken/Head 0g | Pax Served 26 | Avg Variance +61.1%
  table [Cut|Open|In|Used|Waste|Close|Var%|Drift|Status] — 12 rows
```

### X-Read
```
heading "Mar 9, 2026" + generic "Live — shift still open"
button "📋 Generate X-Read"
[KPI cards]: Gross Sales ₱79,592 | Net Sales ₱77,116 | Total Pax 131 | Avg Ticket ₱589
[two-col layout]:
  heading "Payment Breakdown (Live)":
    Cash ₱42,374 | Card ₱9,368 | GCash ₱25,374
  heading "Order Status":
    Open 12 | Paid 50 | Voided 5
  heading "X-Read History":
    X-Read #7 through X-Read #1 (7 entries with Gross/Net/Cash/GCash/Pax/Voids)
paragraph: "X-Reads do NOT close the shift. Use End of Day report to finalize."
```

### EOD
```
heading "Mar 9, 2026" + generic "Live totals"
button "Start End of Day"
generic "🙈"
heading "Detailed Reports Hidden" [level=3]
paragraph "Click 'Start End of Day' to begin your blind cash count and unlock today's detailed sales and variance reports."
```

### Expenses Daily
```
button "+ Log New Expense"
button "Today" / "This Week" / "This Month"
[KPI cards]: Total Sales ₱13,168 | Total Expenses ₱12,571 | Net Cash Flow ₱597 | Expense Ratio 95.5%
table [Category|Amount|% of Sales|Proportion]:
  💼Labor Budget | ₱343 | 2.6%
  🥩Meat Procurement | ₱12,228 | 92.9%
  TOTAL | ₱12,571 | 95.5%
```

### Stock Inventory
```
heading "Stock Management"
navigation: Inventory | Deliveries [1] | Transfers | Counts [1] | Waste Log
[stat filter cards]: Total Items 93 | OK 93 | Low Stock 0 | Critical 0
[toolbar]: search | Expand All | Collapse All | [List view] [Grid view]
table [□|Item ↑|Category|Stock Level|Current/Min|Status|action]:
  group row "Beef (5 items) 27.8k Total..."
  group row "Chicken (2 items)..."
  ...93 items total, grouped by category
```

### Stock Deliveries
```
heading "Expiring Soon (1)" + Kimchi B-243 | 2d left
heading "Delivery History & Batches"
paragraph "Track incoming stock batches, FIFO usage, and expiry."
button "Receive Delivery" [active on click]
[filters]: search | date dropdown | item dropdown (93 options) | checkbox "Show Depleted"
table [Time|Item/Supplier|Qty|Batch&Expiry|FIFO Usage]:
  12:29 AM | Pork Bone-In / Metro Meat Co. | +5000g | B-241 Exp:2026-03-13 | 5000 left 0 used
  11:29 PM | Soju / SM Trading | +6 bottles | B-242 | 6 left 0 used
  10:29 PM | Kimchi / Korean Foods PH | +10 portions | B-243 Exp:2026-03-10 | 5 left 5 used
  06:29 PM | Pork Bone-In / Transfer from wh-tag | +8000g | TRF-A1TAG | 4800 left 3200 used
  ...more rows
```

### Stock Counts
```
[time slot tabs]: [Morning 10:00 AM] | [Afternoon 4:00 PM] | [Evening 10:00 PM Pending]
generic "Count not yet started. Enter actual counts below, then tap Submit Count."
table [Item|Expected|Counted|Shortage/Surplus]:
  Pork Bone-In | 20,500g | [−][input][+] | —
  Pork Bone-Out | 13,500g | [−][input][+] | —
  Chicken Wing | 6,000g | [−][input][+] | —
  ...90+ items total
```

### Stock Transfers
```
[wizard steps]: [1 Select Item] [2 Destination] [3 Confirm]
generic "Source: Tagbilaran Branch (Alta Citta)"
label "Item"
combobox [Select an item... (disabled/placeholder)]:
  Pork Bone-In (Meats) | Pork Bone-Out (Meats) | Chicken Wing (Meats) | ...90+ options
```

---

*Audit completed: 2026-03-09. All page states captured via playwright-cli snapshot. Final screenshot at /reports/x-read.*
*Snapshot files: .playwright-cli/page-2026-03-08T16-24-38-080Z.yml through page-2026-03-08T16-32-00-913Z.png*
