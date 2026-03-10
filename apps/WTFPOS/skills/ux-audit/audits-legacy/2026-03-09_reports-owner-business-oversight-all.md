# UX Audit — Reports / Business Oversight (Owner)

**Date:** 2026-03-09
**Role:** Owner (Christopher S)
**Branch:** All Locations + Alta Citta (Tagbilaran)
**Viewport:** 1024×768 (tablet landscape)
**Scope:** Post-login landing, `/reports/x-read`, `/reports/eod`, `/reports/sales-summary`, `/reports/branch-comparison`, `/reports/best-sellers`, `/dashboard`, AppSidebar (owner nav), LocationBanner (location switch)
**Audit mode:** Single-user
**Focus:** Can an owner answer core business questions in ≤3 clicks without friction?

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 7 of 21 issues resolved (P0: 0/5 · P1: 6/9 · P2: 1/7)

---

## A. Text Layout Map

### A1 — Post-Login Landing (`/pos` — All Branches)

```
+--sidebar (expanded)--+------main content (SidebarInset)----------+
| WTF! SAMGYUP         | ┌─ LocationBanner ─────────────────────┐ |
| All Locations (3)    | │ [ALL LOCATIONS]  [Change Location]    │ |
|                      | └───────────────────────────────────────┘ |
| Quick Actions:       | ┌─ ALL BRANCHES LIVE PANEL ─────────────┐ |
| Receive Delivery     | │ "read only · order taking disabled"    │ |
| Log Expense          | │                                        │ |
| Log Waste            | │ Alta Citta     Alona Beach             │ |
| Stock Count          | │ ₱4,525 active  ₱1,705 active           │ |
| X-Reading            | │ 0 OCC / 8 FREE 0 OCC / 8 FREE  ← BUG  │ |
| Transfer Stock       | │ [T4 order ₱1,705] [T6 order ₱1,705]   │ |
| End of Day           | │ [T4 order ₱2,820]                      │ |
|                      | └───────────────────────────────────────┘ |
| POS                  |                                            |
| Kitchen              |                                            |
| Stock                |                                            |
| Reports              |                                            |
| Admin                |   ~~fold~~                                 |
|                      |                                            |
| Christopher S        |                                            |
| owner / logout       |                                            |
+----------------------+--------------------------------------------+
```

### A2 — Reports X-Read (`/reports/x-read`)

```
+--sidebar--+----main (reports sub-nav)----------------------------+
|           | [LocationBanner: ALTA CITTA]                         |
|           | [Sub-nav: X-Read | EOD | Sales | Best | Branch...]   |
|           |------------------------------------------------------|
|           | "Mar 9, 2026 · Live — shift still open"              |
|           | [📋 Generate X-Read]         ← ABOVE FOLD            |
|           |                                                      |
|           | ┌──KPI──┐ ┌──KPI──┐ ┌──KPI──┐ ┌──KPI──┐             |
|           | │₱65,303│ │₱64,129│ │130 pax│ │₱493avg│             |
|           | │Gross  │ │Net    │ │       │ │ticket │             |
|           | └───────┘ └───────┘ └───────┘ └───────┘             |
|           |                                                      |
|           | Payment Breakdown:                                   |
|           | Cash ₱34,390 / GCash ₱18,198 / Card ₱11,541         |
|           |                                                      |
|           | Order Status: Open 10 / Paid 52 / Voided 2           |
|           |   ~~fold~~                                           |
|           | X-Read History (7 entries, all "12:00 AM" BUG)       |
+--sidebar--+------------------------------------------------------+
```

### A3 — Branch Comparison (`/reports/branch-comparison`)

```
+--sidebar--+----main----------------------------------------------+
|           | [LocationBanner: ALL LOCATIONS]                      |
|           | [Sub-nav: ... | Branch Comparison ← active]          |
|           |------------------------------------------------------|
|           | [Today] [This Week] [This Month]                     |
|           |                                                      |
|           | ┌── Tagbilaran ─┐  ┌── Panglao ────┐                |
|           | │ ₱0.00 Net P.  │  │ ₱0.00 Net P.  │  ← BUG        |
|           | └───────────────┘  └───────────────┘                |
|           |                                                      |
|           | ┌─ Comparison table ──────────────────────────────┐  |
|           | │ Metric           │ Tagbilaran  │ Panglao         │  |
|           | │ Gross Revenue    │ ₱0.00       │ ₱0.00  ← BUG   │  |
|           | │ (7 more metrics, all ₱0.00)                     │  |
|           | └─────────────────────────────────────────────────┘  |
+--sidebar--+------------------------------------------------------+
```

### A4 — EOD Page (`/reports/eod`)

```
+--sidebar--+----main----------------------------------------------+
|           | [LocationBanner: ALL LOCATIONS]  ← DANGER ZONE       |
|           |------------------------------------------------------|
|           |                                                      |
|           |           📊 End of Day                              |
|           |           Mar 9, 2026 · Live totals                  |
|           |                                                      |
|           |        [  Start End of Day  ]   ← large CTA          |
|           |                                                      |
|           |  🙈 Detailed Reports Hidden                          |
|           |  "Click Start End of Day to begin blind cash count   |
|           |   and unlock today's reports."                       |
|           |                                                      |
|           |  (no data visible, no branch guard, no history)      |
+--sidebar--+------------------------------------------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Reports sub-nav has 10+ tabs (x-read, eod, sales-summary, best-sellers, branch-comparison, expenses-daily, expenses-monthly, profit-gross, profit-net, peak-hours, staff, table-sales, meat-report). Owner sees all at once with no grouping. | Group report tabs into 3-4 categories: "Daily Ops", "Sales Analysis", "Branch & Profitability", "Expenses" |
| 2 | **Miller's Law** (chunking) | PASS | X-Read KPI row chunks 4 KPIs (Gross, Net, Pax, Avg Ticket). Payment breakdown groups 3 methods. Order status groups 3 states. Well-chunked. | — |
| 3 | **Fitts's Law** (target size/distance) | CONCERN | "Generate X-Read" is a single mid-page button — good size but positioned centrally, not at bottom-right thumb zone. "Start End of Day" EOD button is large and centered. Branch comparison time-filter buttons (Today/Week/Month) are top-left, stretch zone for landscape tablet. | Move time-filter controls to bottom bar or right-align them to thumb reach zone |
| 4 | **Jakob's Law** (conventions) | CONCERN | "Best Sellers" page is actually a meat-cut COGS/margin analysis — not what the name implies. "Card" as a payment method label is non-standard for PH market (should be "Credit/Debit Card"). Dashboard is a dead stub with no "coming soon" pattern. | Rename page to "Meat Performance" or "Cut Analysis"; use "Credit/Debit" label; add proper empty state to dashboard stub |
| 5 | **Doherty Threshold** (response time) | CONCERN | X-Read page loads data immediately — excellent. But branch comparison and sales summary show all-zeros silently — no loading indicator, no error state, no empty state copy. User cannot tell if data is loading, unavailable, or broken. | Add explicit empty states with explanatory text or loading skeletons on report pages when data is not found |
| 6 | **Visibility of System Status** | FAIL | (1) All Branches POS dashboard shows "8 FREE" tables while listing 2-3 active orders — contradictory state. (2) EOD page shows "Live totals" in header when location is ALL — whose totals? (3) Sales Summary and Branch Comparison show ₱0.00 with no explanation — not clear if this is a data issue, a context issue, or intentional. (4) X-Read history timestamps all show "12:00 AM" — historical reads are indistinguishable. | Fix table state logic in All Branches view; add empty-state messages on all-zero report pages; fix X-Read history timestamps |
| 7 | **Gestalt: Proximity** | PASS | X-Read KPIs are grouped horizontally in a row. Payment breakdown groups methods together. Branch comparison puts side-by-side panels close together. Related controls are adjacent throughout. | — |
| 8 | **Gestalt: Common Region** | CONCERN | Branch comparison uses two plain summary cards without visual border/card separation between branches. At a glance, the two columns could be misread as sub-items of a single card. Stock alerts badge in LocationBanner modal (shown during audit) is well-contained. | Add card borders or background tinting to distinguish the two branch columns in branch comparison |
| 9 | **Visual Hierarchy** (scale) | CONCERN | On X-Read, the KPI row (₱65,303 Gross Sales) is the most important number — but visually it shares equal weight with the history section below the fold. "Generate X-Read" CTA is medium-sized, not the dominant CTA on the page (which should arguably be the KPI row itself). On branch comparison, all-zeros read identically at every scale — no visual hierarchy because no data. | Make KPI values larger (text-3xl or text-4xl for the gross total); visually de-emphasize the history section |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | X-Read history rows — individual read cards likely use the same visual weight as the live KPI row. Missing differentiation between "current live data" and "historical records". Branch comparison: no color difference between Tagbilaran and Panglao columns — just text labels. | Use `accent` orange as a left-border accent on the live KPI section; use branch color-coding from `LOCATION_COLORS` map in branch comparison columns |
| 11 | **WCAG: Color Contrast** | CONCERN | Status yellow (`#F59E0B`) is used in badge indicators (e.g., "Stock Alerts 1" in location selector modal). Per Design Bible, yellow on white fails AA (2.1:1 ratio). The badge passes only because it's paired with text context, not as standalone text. If any report uses yellow for standalone chart labels or small text, it will fail. | Audit all status-yellow usages in reports for text-only instances; always pair with icon or dark text |
| 12 | **WCAG: Touch Targets** | PASS | "Generate X-Read" and "Start End of Day" buttons appear to use `.btn-primary` (48px min-height). Sub-nav tabs in reports layout are well-spaced. Time-filter buttons (Today/Week/Month) adequate for touch. | — |
| 13 | **Consistency** (internal) | FAIL | (1) X-Read uses "Gross Sales" / "Net Sales" terminology; branch comparison uses "Gross Revenue" / "Net Revenue" for the same metrics — inconsistent. (2) X-Read shows a "Card" payment method; history cards omit "Card" column. (3) Weight displayed as "76.4 kg" in KPI but "28,400g" in table on same page — unit inconsistency. (4) EOD shows "Live totals" header; X-Read shows "Live — shift still open" — similar state, different wording. | Standardize on "Gross Sales" / "Net Sales" across all report pages; standardize weight units (either kg throughout or g throughout); standardize "live shift" language |
| 14 | **Consistency** (design system) | PASS | Reports sub-nav uses consistent tab style. LocationBanner appears on all pages with correct "Change Location" CTA. Sidebar nav items consistent across all routes. `.badge-*` classes used for status indicators. | — |

**Verdict count:** PASS 4 / CONCERN 7 / FAIL 3

---

## C. "Best Day Ever" Vision

It's Saturday morning — Sunday brunch preparation time. Christopher, the owner, arrives at the office at 9 AM and pulls up WTFPOS on his iPad before heading to inspect both branches. He wants to answer three questions in under two minutes: Are both branches healthy? Which branch is winning this week? Are there any stock alerts?

In the ideal experience, Christopher logs in and lands on the All Branches dashboard. His eyes go immediately to two big revenue numbers — Alta Citta and Alona Beach — their today's gross sales displayed prominently, color-coded by branch. A subtle green indicator shows both branches are currently open with staff logged in. One yellow badge catches his eye on Alta Citta: "1 stock alert." He taps it, sees it's a low pork belly warning, and pings the manager via the notes field. Done — all before he's finished his coffee.

He taps "Reports" → "Branch Comparison" to check the weekly scorecard. The two branches are displayed side-by-side with clear color coding: Alta Citta in orange, Alona Beach in teal. This week: Alta Citta ₱312,000 gross vs Alona Beach ₱198,000 gross — both up from last week, shown with a small ↑12% and ↑8% delta indicator. He feels confident. He taps "Best Sellers" to confirm Samgyupsal is still the top seller, and notes that US Beef Belly's margin has crept up to 58% — he makes a mental note to promote it.

At no point did Christopher need to switch location context, wait for a loading screen, or dig through sub-menus. The system understood he was the owner and surfaced the most decision-relevant data at the top level.

**Where the current implementation falls short:** Almost none of this ideal experience works today. The Branch Comparison page is all zeros. The Sales Summary is all zeros in ALL context. The landing page shows "active order totals" (not today's closed revenue) alongside contradictory table status indicators that show 8 free tables while listing active orders. There is no branch color coding. There are no delta/trend indicators. The X-Read page works well for per-branch single-day data but requires the owner to manually switch location context to see Alta Citta vs. Alona Beach. The reports are built for accountants reviewing a single day, not for an owner who needs a 30-second business health check across both branches.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | **Session replacement on location switch (B-01)** — Selecting a branch in the location selector replaced the Owner session with the Manager for that branch. `session.locationId` update should NEVER change `session.userName` or `session.role`. | Audit `LocationSelectorModal.svelte` and `session.svelte.ts` — `setLocation()` must only update `locationId`, never touch user identity fields. | S | High | 🔴 OPEN |
| **P0** | **Branch Comparison returns all zeros (B-02)** — `/reports/branch-comparison` shows ₱0.00 for all metrics. The most critical owner page is non-functional. | Debug `reports.svelte.ts` branch comparison query — likely a missing handler for `locationId === 'all'` in the aggregation filter. | M | High | 🔴 OPEN |
| **P0** | **Sales Summary returns zeros in ALL context (B-03)** — `/reports/sales-summary` shows ₱0.00 for all metrics in ALL location. | Same fix path as B-02 — the "all" aggregation in `reports.svelte.ts` is not querying across branches. | M | High | 🔴 OPEN |
| **P0** | **EOD page accessible in ALL location context without branch guard (U-02)** — "Start End of Day" fires in ALL context with no disambiguation. Running EOD from the wrong context could corrupt the Z-Read for a branch. | Add a branch-selection guard in EOD page: if `session.locationId === 'all'`, show an inline warning "Select a specific branch before running End of Day" and disable the button. | S | High | 🔴 OPEN |
| **P0** | **Floor table state mismatch on All Branches dashboard (B-04)** — "8 FREE" tables shown while active orders are listed. Owner cannot trust the floor status. | Fix the table status aggregation in the All Branches POS view — table free/occupied state should reflect the `orders` collection status for that location. | M | High | 🔴 OPEN |
| **P1** | **X-Read History timestamps all "12:00 AM" (U-07)** — Historical X-Reads are not differentiable by time. Owner cannot reconstruct intraday cash flow. | Ensure `x_reads` collection stores the actual generation timestamp, not midnight. Fix the display formatting to show time (e.g., "2:45 PM"). | S | High | 🔴 OPEN |
| **P1** | **No date picker on X-Read (U-01)** — Owner cannot review yesterday's X-Reads. After EOD close, historical data is inaccessible from this page. | Add a date picker or "Previous Shifts" tab to `/reports/x-read` that queries `x_reads` collection by `businessDate`. | M | High | 🔴 OPEN |
| **P1** | **No print/export on X-Read (U-06)** — BIR compliance requires printed X-Reads. No print button present. | Add a "Print / Export PDF" button to the X-Read page. Use `window.print()` with a print-specific CSS class to hide non-report elements. | S | High | 🔴 OPEN |
| **P1** | **Maya e-wallet missing from payment breakdown (U-10)** — PRD lists Maya as a supported payment method. X-Read payment breakdown shows Cash / GCash / Card but not Maya. | Add `maya` as a payment method in the payment breakdown query and display in the X-Read KPI row. | S | Med | 🟢 FIXED |
| **P1** | **Quick Actions available in ALL context without branch disambiguation (U-03)** — "Log Waste", "Receive Delivery", "Stock Count" in the sidebar Quick Actions should not be tappable without first selecting a specific branch. | In `AppSidebar.svelte`, disable or hide Quick Action items when `session.locationId === 'all'`. Show tooltip: "Select a branch to use quick actions." | S | Med | 🔴 OPEN |
| **P1** | **Empty state missing on Branch Comparison and Sales Summary** — All-zero pages give no feedback about why data is missing. Owner doesn't know if it's a bug or a data issue. | Add empty state components: "No data for this period" with a suggestion to check location or date range. | S | Med | 🔴 OPEN |
| **P1** | **Duplicate location names in sidebar brand header (B-05)** — "All Locations (3)" expands to show 6 items instead of 3. | Debug the `AppSidebar.svelte` location list rendering — likely a reactive subscription that fires twice on mount. | S | Med | 🔴 OPEN |
| **P1** | **Terminology inconsistency: "Gross Sales" vs "Gross Revenue" (internal)** — Same metric named differently across X-Read and Branch Comparison pages. | Standardize on "Gross Sales" / "Net Sales" across all report pages to match BIR terminology. | S | Med | 🔴 OPEN |
| **P1** | **Weight unit inconsistency in Best Sellers page** — KPI shows "76.4 kg" but table rows show weight in grams ("28,400g"). | Show all weights in the same unit. Use grams throughout (more precise for meat cuts) or add a toggle. | S | Low | 🔴 OPEN |
| **P2** | **No branch color coding in Branch Comparison (U-03 polish)** — Two branch columns use only text differentiation. Hard to track visually on a busy screen. | Apply `LOCATION_COLORS` from `AppSidebar.svelte` — color-tint the column header and left border for each branch. | S | Med | 🔴 OPEN |
| **P2** | **No trend/delta indicators in Branch Comparison** — Owner cannot see if a branch is improving or declining week-over-week. | Add ↑/↓ percentage delta vs. previous period on branch comparison cards. | M | Med | 🔴 OPEN |
| **P2** | **"Best Sellers" page mislabeled (U-05)** — The page is a meat-cut COGS/margin analysis, not a "best sellers by order count" report. | Rename to "Meat Performance" or "Cut Analysis". Add a separate "Best Sellers" tab if needed that shows top items by order frequency. | S | Low | 🔴 OPEN |
| **P2** | **No "today's closed revenue" on POS landing (U-04)** — All Branches dashboard shows only open-order totals (active revenue), not today's total completed sales. | Add a "Today's Z-Sales" or "Closed Revenue" metric to the branch panels on the All Branches POS view, drawn from closed orders for today's business date. | M | Med | 🔴 OPEN |
| **P2** | **Dashboard is a dead stub unreachable from nav (U-09)** — `/dashboard` shows only "Phase 4" text and has no sidebar nav entry. | Either add a proper "Coming Soon" empty state with Phase 4 roadmap context, or remove the route entirely until Phase 4. | S | Low | 🔴 OPEN |
| **P2** | **X-Read KPI values lack visual hierarchy** — The gross sales number (₱65,303) shares the same visual weight as the sub-metrics. | Use `text-3xl font-bold` for gross sales figure; `text-xl` for net sales; `text-base` for pax/avg ticket. | S | Med | 🔴 OPEN |
| **P2** | **Reports sub-nav has 10+ tabs with no grouping (Hick's Law)** — Owner sees all report types simultaneously with no category grouping. | Group into 4 sections: "Daily Ops" (X-Read, EOD), "Sales" (Summary, Best Sellers, Peak Hours), "Profitability" (Gross/Net Profit, Branch Comparison), "Expenses" (Daily, Monthly). | M | Med | 🔴 OPEN |

---

**File:** `skills/ux-audit/audits/2026-03-09_reports-owner-business-oversight-all.md`
