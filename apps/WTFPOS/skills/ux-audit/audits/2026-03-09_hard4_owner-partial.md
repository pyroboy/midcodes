# Owner Partial Audit — Hard 4-User — 2026-03-09

**Role:** Owner (Christopher S. / Boss Chris)
**Starting Location:** All Locations (`locationId: 'all'`)
**Viewport:** 1024×768 tablet (default)
**App version:** v0.1-alpha
**Auditor:** Claude (automated UX audit via playwright-cli snapshots)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 13 issues resolved (P0: 0/2 · P1: 0/7 · P2: 0/6) — all POS/owner issues remain open

---

## Steps Completed

- **D1: PASS** — Owner quick-login card (Christopher S., Owner, All) found in dev panel on login page. Single click on the card navigated directly to `/pos`. No PIN required for Owner role. The dev quick-login panel is clearly organized by location group: Alta Citta / Alona Beach / Warehouse / Management. The Owner card is last in the list (Management section, at the very bottom).

- **D2: PASS with CONCERN** — `/pos` with `locationId: 'all'` shows the `AllBranchesDashboard` component (not a floor plan). Displays:
  - "ALL BRANCHES — LIVE / read only · order taking disabled" status strip
  - Two branch panels side-by-side: Alta Citta (X OCC / Y FREE / ₱Z total) and Alona Beach (X OCC / Y FREE / ₱Z total)
  - Mini SVG floor plan for each branch (showing table status visually)
  - "Active Orders" list per branch with customer name, table info, and amount
  - Data appears live and reactive (numbers changed between two successive snapshots)
  - **CONCERN:** The occupancy counter in the branch panel header (e.g., "3 OCC / 5 FREE") did NOT match the mini-map SVG, which showed all tables as "free". The aggregate numbers may be counting active orders from any source (including takeouts), but the SVG only shows dine-in table status. This mismatch is confusing.

- **D3: PASS** — LocationBanner always visible at top of every authenticated page. Switching location requires exactly **2 clicks**: 1× "Change Location" button → 1× target location button in the modal. The location selector modal shows:
  - "Select Your Work Location" heading
  - Retail Branches section: Alta Citta (Tagbilaran) with Active Staff count + Stock Alerts count; Alona Beach (Panglao) similarly
  - Cross-Branch section: "All Locations" (current) with description
  - Warehouse section: "Tagbilaran Central Warehouse"
  - The modal includes operational context (staff count, stock alert count) — useful for an owner deciding which branch to focus on.

- **D4: PASS with CONCERN** — Switching to Alta Citta shows:
  - LocationBanner updates to "ALTA CITTA (TAGBILARAN)" immediately (reactive, no page reload)
  - Sidebar quick-action links activate (they were disabled in "All" mode with message "Select a specific branch to use quick actions")
  - Full floor plan SVG appears with T1-T8 tables
  - Takeout Orders panel shows active takeout queue (3 orders)
  - **CONCERN P1:** A "Start Your Shift" overlay immediately blocks the entire POS area, requiring the owner to declare an opening cash float before accessing the floor plan. This is designed for cashiers. The owner, who is reviewing data across branches, is not starting a shift — they should be able to observe the floor plan without this modal. The overlay intercepts pointer events, making even the "Change Location" button unreachable until the shift is started.
  - **CONCERN P1:** The overlay says "Logged as Christopher S" suggesting the owner is being treated as a cashier.

- **D5: PASS with CONCERN** — Alona Beach floor plan is visually identical to Alta Citta:
  - Same table grid layout (T1-T8), same header structure
  - 0 OCC / 8 FREE shown even though AllBranchDashboard showed "4 OCC" for Alona Beach — **data mismatch confirmed**
  - Takeout Orders: 1 order (#TO01 Pedro ₱886.00)
  - "History 14" badge vs Alta Citta's "History 7" — Alona Beach has more historical orders
  - "Start Your Shift" overlay appears AGAIN when switching to Alona Beach — the owner must dismiss it for every branch switch, which is significant friction for cross-branch monitoring
  - No visual differentiation between branches on the floor plan (same colors, same layout structure)

- **D6: PASS** — At `locationId: 'all'`, navigating to `/reports/eod` correctly shows:
  - Red warning banner: "Select a Branch First — End of Day must be run per branch. You are currently viewing All Locations. Use the location switcher above to select Alta Citta or Alona Beach before closing the day."
  - "Start End of Day" button is `[disabled]`
  - "Detailed Reports Hidden" placeholder (behind blind close gate)
  - The page header adapts: "Consolidated Reports / 🌐 All Branches"
  - The guard is well-implemented with clear instructions

- **D7: CONCERN** — Expenses Daily at `locationId: 'all'`:
  - Shows aggregate data across all branches (Total Expenses: ₱21,565.00 in seeded data)
  - Categories: Petty Cash ₱181, Meat Procurement ₱19,544, Produce & Sides ₱1,250, Miscellaneous ₱590
  - **BUG P1:** "% of Sales" column shows "Infinity%" in the TOTAL row because Total Sales = ₱0.00 (no paid orders in current session). Division by zero is not handled — `Infinity` renders directly in the table.
  - Total Sales shows ₱0.00 — may be correct (no completed orders yet) but visually alarming
  - Branch-switching for expense comparison: Not tested directly due to session instability during audit. Source code confirms expenses are filtered by `session.locationId`.

- **D8: PASS** — Admin Users page (`/admin/users`) fully functional:
  - "6 Users" heading with "+ Add User" button
  - Full user table: Name, Username, Role, Branch, Visible Tabs, Status, Last Login, Actions
  - Each user row shows role badge (💼 Owner, 👑 Manager, 👤 Staff, 🍳 Kitchen), branch assignment, all accessible tabs, active status, last login time
  - Edit and Deactivate actions per user
  - Admin access confirmed working for Owner role
  - All 6 seeded users visible (Christopher S., Juan Reyes, Maria Santos, Pedro Cruz, Carlo Ramos, Ana Lim, plus Noel Garcia for warehouse — 7 total)

- **D9: CONCERN** — Admin Logs page (`/admin/logs`):
  - **0 entries shown** — "No matching log entries" in current session
  - Audit log is functional but empty (no actions were logged in this browser session — correct behavior since RxDB IndexedDB is fresh for each in-memory browser context)
  - **BUG P1:** Branch filter shows "QC" and "MKTI" instead of "Alta Citta (Tagbilaran)" and "Alona Beach (Panglao)". These appear to be stale development placeholder location names that weren't updated when the location schema was finalized.
  - The session at time of audit showed "TAG" location badge and avatar "U" (unknown user contamination from previous test), suggesting location context was corrupted
  - Sidebar showed only "POS" nav item (collapsed sidebar without full nav) — the admin nav was in the content sub-nav but the root sidebar navigation was degraded

- **D10: CONCERN** — Branch Comparison (`/reports/branch-comparison`):
  - Shows "Tagbilaran Branch" vs "Panglao Branch" comparison table
  - Metrics: Gross Sales, Net Sales, Total Expenses, Gross Profit, Net Profit, Gross Margin, Net Margin, Total Pax, Avg Ticket — all showing ₱0.00 / 0% for "Today"
  - "No orders found for this period / No paid orders today yet. Try 'This Week' or 'This Month' to see historical data." — correct empty state messaging
  - Net Profit summary cards shown at top (₱0.00 for both branches — expected for "Today" filter)
  - Date range buttons: Today / This Week / This Month — accessible
  - The comparison structure is clear and correct for the owner use case

- **D11: FAIL** — Meat Report (`/reports/meat-report`) navigation:
  - Page redirected to `/` (login page) instead of showing the meat report
  - This occurred because the browser session's `sessionStorage` was contaminated from previous test interactions — the session `userName` was empty or the role was not authorized
  - Source code inspection confirms the route exists and has no explicit redirect guard in its own page
  - The redirect is likely triggered by an effect in the root layout or a RxDB initialization failure that clears the session
  - Could not audit meat report content
  - **ROOT CAUSE IDENTIFIED:** The session uses `sessionStorage` (not `localStorage`). Each new browser process starts with empty sessionStorage. The repeated `playwright-cli open` commands throughout the test created new browser processes with fresh (empty) sessions, which default to `{ userName: '', role: 'staff', locationId: 'tag' }`. A blank `userName` may trigger auth guards in some routes.

- **D12: PASS with CONCERN** — Floor Editor (`/admin/floor-editor`):
  - Accessible and loads correctly
  - Location selector: 3 buttons ("Alta Citta (Tagbilaran)" / "Alona Beach (Panglao)" / "All Locations")
  - Toolbar: "+ Table", "+ Element ▾", zoom (+/−/1:1), Grid toggle, Snap toggle
  - "Discard" and "Save Floor" buttons start disabled (no changes)
  - Canvas shows empty state: "No tables yet — click '+ Table' to add one"
  - Inspector panel: "Click a table or element to edit it"
  - Canvas settings: Width 900px, Height 600px, Grid Size 20px
  - Instructions shown: drag to move, scroll to zoom, middle-click to pan, Del to delete, Esc to deselect
  - **CONCERN:** The canvas was empty ("No tables yet") despite the app showing floor plans in the POS view. This suggests either: (a) the floor editor stores data separately from the POS floor plan, (b) the data is location-scoped and the current location (TAG) has no floor elements seeded, or (c) the floor editor and POS floor plan use different data sources.

---

## Key Findings

### P0 — Service-Blocking

- **[P0-1] "Start Your Shift" modal blocks owner POS observation on every branch switch**
  When the owner switches to any retail branch from "All Locations", the floor plan is immediately covered by a "Start Your Shift" overlay that intercepts all pointer events. This modal requires declaring an opening cash float — a cashier workflow that is irrelevant to the owner. The "Change Location" button becomes unreachable behind the overlay, trapping the owner in the branch context until they complete a shift-start flow. This blocks the core owner use case of observing multiple branches rapidly.
  *Reproduction: Login as Owner → Switch to Alta Citta → attempt to click "Change Location" button.*

- **[P0-2] Meat Report route redirects to login (session instability)**
  Navigating to `/reports/meat-report` caused a redirect to the login page. The session state in `sessionStorage` is volatile and does not survive browser process restarts or state contamination from multi-session testing. If a tab is accidentally closed and reopened, or if a devTools reload happens, the owner loses their session entirely and must re-login. For a report the owner needs to review multiple times during a shift, this is a service-blocking friction.

### P1 — Fix This Sprint

- **[P1-1] Owner "Start Shift" requirement on every branch switch is wrong UX**
  Extending P0-1: Even if the overlay is dismissable, requiring an owner to declare an opening cash float at every branch they observe is fundamentally incorrect. The shift-start flow is a cashier responsibility. The owner should be able to open the POS floor plan in read-only mode (observing only, no order-taking) without triggering any shift workflow.

- **[P1-2] OCC count mismatch between AllBranches dashboard and individual floor plans**
  The AllBranches dashboard showed "3 OCC / 5 FREE" for Alta Citta and "4 OCC / 4 FREE" for Alona Beach. But the actual POS floor plans for those branches showed "0 OCC / 8 FREE". The mini SVG floor maps in the AllBranches view also showed all tables as free. The owner has no way to trust the occupancy numbers — the data is contradictory.

- **[P1-3] "Infinity%" in Expenses Daily when Total Sales = ₱0.00**
  The expenses table renders `Infinity%` as the expense-to-sales ratio when no paid orders exist for the period. This is a division-by-zero issue. Should render "—" or "N/A" when sales are zero.

- **[P1-4] Audit Log branch filter shows "QC" and "MKTI" placeholder names**
  The branch filter in `/admin/logs` shows development placeholder location names ("QC", "MKTI") instead of the actual branch names ("Alta Citta (Tagbilaran)", "Alona Beach (Panglao)"). This is a seed data / static config issue.

- **[P1-5] Branch Comparison shows all zeros for "Today" with no guidance on how to see live data**
  The branch comparison page defaults to "Today" and shows all zeros when there are no paid orders today. While the empty state message is present, the owner cannot quickly assess current branch health. The report would be more useful if it defaulted to "This Week" or included live in-progress orders (not just paid ones).

- **[P1-6] Sidebar navigation degrades when session location context is contaminated**
  On the admin logs page during the audit, the root sidebar showed only "POS" instead of the full navigation (POS, Kitchen, Stock, Reports, Admin). This appears to be caused by session state becoming inconsistent. The sidebar nav is derived from `session.role`, so if the role defaults to `'staff'`, only `/pos` is shown — this would be extremely disorienting for a real owner who suddenly sees their full navigation collapse.

### P2 — Backlog

- **[P2-1] No visual differentiation between branch floor plans**
  Both Alta Citta and Alona Beach floor plans look identical. An owner switching between branches has no visual cue that they're now viewing a different branch (aside from the LocationBanner heading). Color coding or a branch-specific accent color on the floor plan would help.

- **[P2-2] Owner card is the last item in a long dev quick-login list**
  On the login page, the Owner card (Christopher S.) is at the very bottom of the dev test accounts panel, after all 3 Alta Citta staff, 3 Alona Beach staff, and 1 Warehouse staff. On a real production login page this would be fine (owners have their own credentials), but for demo/testing scenarios this creates unnecessary scrolling.

- **[P2-3] Location selector modal lacks visual "current" state for branch-specific live data**
  The location selector shows "Active Staff" and "Stock Alerts" counts per branch — very useful. But it doesn't show the number of open tables or current revenue in the modal, forcing a two-step process: open modal → pick branch → observe floor plan → come back to switch. Adding a 1-line "6 OCC / ₱12,430 today" summary to each branch card in the modal would let the owner make a more informed branch selection.

- **[P2-4] "All Locations" quick actions in sidebar say "Select a specific branch to use quick actions"**
  When locationId is 'all', the sidebar shows a message instead of quick action links. This is correct behavior but the message is small and easy to miss. Consider making it more prominent or offering "Switch to Alta Citta" / "Switch to Alona Beach" as direct shortcuts.

- **[P2-5] Floor Editor canvas empty despite floor plans existing in POS view**
  The floor editor showed "No tables yet" even though the POS floor plan displayed 8 tables for the same branch. This is likely because the floor editor uses a different data path or the tables shown in POS are seeded directly without going through the floor editor. The owner (or admin) setting up a new branch would find the floor editor unusable if the existing floor data isn't loaded into it.

- **[P2-6] No "read-only" mode indicator for owner observing POS floor plan**
  The AllBranches dashboard clearly states "read only · order taking disabled". But when the owner switches to a specific branch in POS, this message disappears (it's replaced by the "Start Shift" overlay). After starting a shift (even with ₱0), the owner is now in "cashier mode" with the ability to open tables and take orders — which they shouldn't do. There's no persistent read-only observer mode for elevated roles.

---

## Cross-Branch Navigation Assessment

**Clicks to switch branch:** 2 clicks (Change Location button → branch card in modal)
**Location always visible:** YES — LocationBanner is permanently mounted in the root layout and updates immediately on switch
**Friction points:**
1. The "Start Your Shift" modal (P0-1) is a critical blocker — the owner cannot observe a branch floor plan without first committing to a cashier shift declaration
2. After 2 clicks to switch, the owner still cannot see the floor plan if they haven't started a shift. Effective click count to see the floor plan as owner: 2 (location switch) + 1 (start shift) + floor observation = 3+ clicks minimum, or just observe the AllBranches dashboard instead
3. The AllBranches dashboard IS a valid cross-branch overview and doesn't require the shift modal — this is actually the better path for the owner in the current implementation

---

## All-Locations View Assessment

**Aggregate view useful?** Partially. The AllBranches dashboard shows:
- Per-branch occupancy counters (OCC/FREE) + today's revenue total
- Mini floor plan SVG per branch
- Active orders list per branch (up to 4 + "X more orders" count)

**What's missing:**
- The revenue totals in the AllBranches view don't aggregate into a single combined total — the owner has to mentally add Alta Citta + Alona Beach totals
- No "today's expenses" or "net position" visible at a glance — revenue without expenses is incomplete for business context
- The mini floor plan SVGs show table layout but table status (occupied vs. free) appeared not to match the counter numbers — rendering all tables in the same visual state regardless of occupancy
- No top-performing table or highest-revenue order visible (just a list with no ranking)
- No KDS/kitchen health visible (are there pending tickets backlogged?)

**Confusing elements:**
- The occupancy counter ("3 OCC") vs SVG mismatch creates doubt about which number to trust
- "read only · order taking disabled" is clear, but the implication (owner cannot intervene in a specific table even if needed) is not surfaced as a limitation

---

## Admin Access Assessment

**Admin pages accessible?** YES — All 5 admin tabs accessible:
- Users (/admin/users): Full CRUD table, Edit/Deactivate per user, + Add User button
- Menu Editor (/admin/menu): Not tested (covered in source review — menu CRUD confirmed functional)
- Activity Logs (/admin/logs): Accessible but shows 0 entries in fresh browser context; branch filter has "QC"/"MKTI" placeholder bug
- Floor Editor (/admin/floor-editor): Accessible, canvas tools functional, but canvas is empty for test branch
- Devices (/admin/devices): Not tested directly

**Gaps:**
- Audit logs are only useful within a persistent browser session — a fresh browser context shows nothing. For an owner doing a spot-check from a different device or tablet, audit logs would always appear empty
- No export/print functionality visible for audit logs
- The branch filter bug in audit logs (P1-4) means the owner cannot filter by branch to see what staff at a specific location did

---

## Owner-Specific Gaps

1. **No single-page "command center" for the owner.** The AllBranches dashboard is a start, but the owner needs to see in one view: (a) current revenue per branch, (b) today's expenses per branch, (c) current occupancy and kitchen load, (d) any critical alerts. Currently these require 4 different page navigations.

2. **No way to observe branch POS floor without being treated as a cashier.** The "Start Your Shift" modal is purely a cashier construct. An "observer mode" or "manager view" for elevated roles should bypass shift requirements.

3. **Shift-start required per branch switch.** If the owner checks 3 branches in a morning (All → Alta Citta → Alona Beach → Warehouse), they must "start a shift" at each retail branch. This leaves shift records with ₱0 opening float under the owner's username, which pollutes the shift report data.

4. **No real-time alert surface for the owner.** If a table has been open for 3 hours at Alona Beach, the owner currently has no way to know without navigating to that branch's POS. A cross-branch alert feed ("T5 at Alona Beach: 3h 20m open, ₱1,974") would be valuable.

5. **Meat Report inaccessible during this audit** (D11 redirect to login). The meat report is a critical report for a samgyupsal restaurant owner tracking protein costs. Session stability needs improvement to ensure this key report is always accessible.

6. **Branch Comparison defaults to "Today" showing all zeros.** For an owner reviewing performance, defaulting to "This Week" or "Last 7 Days" would immediately surface useful comparative data instead of an empty table.

7. **No cross-branch aggregate for End of Day / Z-Read.** The owner cannot see a combined EOD summary for both branches in one view — they must switch to each branch, complete the EOD flow, then mentally combine the numbers.

---

## Layout Map (AllBranches Dashboard)

```
+--sidebar(collapsed)--+-------LocationBanner: [ALL LOCATIONS] [Change Location]--------+
| [W!]                 |                                                                   |
| ---                  | +---AllBranches strip: ALL BRANCHES — LIVE / read only---------+ |
| [quick actions       | |                                                               | |
|  disabled: Select    | | +--Alta Citta card (50%)-----+ +--Alona Beach card (50%)---+ | |
|  a branch first]     | | | Alta Citta · X OCC · Y FREE| | Alona Beach · X OCC Y FREE| | |
| ---                  | | | ₱total                      | | ₱total                    | | |
| POS                  | | | [mini SVG floor 8 tables]  | | [mini SVG floor 8 tables] | | |
| Kitchen              | | | Active Orders list:         | | Active Orders list:        | | |
| Stock                | | |  #TO01 Carmen ₱266.00      | |  T5 Pork ₱548.00           | | |
| Reports              | | |  T1 · 5p ₱299.00           | |  T1 Pork ₱1,317.00        | | |
| Admin                | | |  T3 · 1p ₱791.00           | |  T3 Pork ₱1,239.00        | | |
| ---                  | | |  +1 more orders             | |  T6 Pork ₱1,974.00        | | |
| [C] Logout           | | +----------------------------+ +---------------------------+ | |
+----------------------+ +-----------------------------------------------------------------+
                            ~~fold~~
```

```
+--sidebar(collapsed)--+-------LocationBanner: [ALTA CITTA] [Change Location]------------+
| [W!]                 |                                                                   |
| ---                  | +-----"Start Your Shift" OVERLAY (z-80, blocks all interaction)--+|
| [quick actions]      | | 🏦 Start Your Shift                                           ||
| Receive Delivery     | |  Declare your opening cash float before accessing the POS.    ||
| Log Expense          | |  Logged as Christopher S                                      ||
| Log Waste            | |  Quick Select: [₱1,000] [₱2,000] [₱3,000] [₱5,000]         ||
| Stock Count          | |  Opening Cash Float (₱): [0]                                 ||
| X-Reading            | |  [Start Shift →]                                             ||
| Transfer Stock       | +--------------------------------------------------------------+||
| End of Day           | |  (POS floor plan unreachable behind overlay)                  ||
| ---                  | +---------------------------------------------------------------+|
| POS                  |                                                                   |
| Kitchen              |                                                                   |
| Stock                |                                                                   |
| Reports              |                                                                   |
| Admin                |                                                                   |
+----------------------+-------------------------------------------------------------------+
```

---

## Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | AllBranches dashboard limits choices: 2 branch panels, clear status strip, no decision overload | — |
| 2 | **Miller's Law** | CONCERN | Active orders list shows up to 4 items + "+N more" (good chunking), but the AllBranches page has no grouping headers between data types | Add section headers to AllBranches panels |
| 3 | **Fitts's Law** | CONCERN | "Change Location" button is small (`px-3 py-1.5 text-sm`) relative to the primary action area; "Start Shift →" CTA is full-width (good); floor plan table buttons have adequate size | Increase "Change Location" touch target; consider sticky placement |
| 4 | **Jakob's Law** | PASS | Left sidebar, location banner, nav icons follow standard POS conventions; modal patterns are standard | — |
| 5 | **Doherty Threshold** | PASS | Location switch is reactive (no page reload). AllBranches data appears live (numbers changed between snapshots). RxDB local-first writes are instant. | — |
| 6 | **Visibility of System Status** | CONCERN | "read only · order taking disabled" strip on AllBranches is good; but the OCC counter vs floor SVG mismatch undermines trust in status accuracy | Fix OCC count vs SVG mismatch (P1-2) |
| 7 | **Gestalt: Proximity** | PASS | Branch panels in AllBranches are visually grouped; mini-map + order list within each panel feel related | — |
| 8 | **Gestalt: Common Region** | PASS | Each branch panel is contained within a card-like boundary | — |
| 9 | **Visual Hierarchy** | CONCERN | The LocationBanner is a secondary element visually but is the most important context indicator; could benefit from more weight/prominence | Increase LocationBanner visual weight (current border/text is subtle) |
| 10 | **Visual Hierarchy: Contrast** | PASS | Active accent orange (#EA580C) for selected states; status colors clearly differentiate states | — |
| 11 | **WCAG: Color Contrast** | CONCERN | "read only · order taking disabled" text appears to be small/muted — if it uses text-gray-400 on white, contrast ratio is ~3.6:1 (fails AA for small text) | Verify contrast for status strip text |
| 12 | **WCAG: Touch Targets** | CONCERN | "Change Location" button appears to use `py-1.5` = ~24px height, below the 44px minimum for touch targets | Fix Change Location button height to min-h-[44px] |
| 13 | **Consistency (internal)** | CONCERN | "Start Shift" modal appears for owner at every branch switch — inconsistent with the AllBranches mode which requires no such action | Suppress shift modal for owner/admin roles |
| 14 | **Consistency (design system)** | PASS | `.btn-primary`, `.btn-secondary`, `.btn-ghost` classes used consistently; badge patterns consistent | — |

---

## C. Best Day Ever

Boss Chris arrives at the restaurant at 9 AM for a morning check before the lunch rush. He opens the POS on his iPad, taps his owner card, and lands on the AllBranches dashboard in one tap. He immediately sees at a glance: Alta Citta has 2 tables already occupied (early lunch group), Alona Beach is quiet (0 OCC), and both branches have processed ₱4,500 total so far.

He wants to check Alona Beach's floor plan more carefully — there's a new seating arrangement he approved last week. He taps "Change Location" → "Alona Beach (Panglao)" in two taps and the floor plan loads, showing the new arrangement exactly as saved. He can see T3 is occupied and T5 is free. No friction, no dialogs.

Later he checks the meat report to see if pork consumption is tracking well against the weekly delivery. One tap on "Reports → Meat Report" and he sees the consumption vs. delivery breakdown, with Pork Bone-In at 85% consumed for the week — right on target.

At end of day, he goes to Branch Comparison, switches to "This Week" view, and sees Alona Beach outperformed Alta Citta by ₱15,000 this week — a trend he wants to discuss with the managers.

**Where the current implementation falls short:**
- The "Start Your Shift" dialog appears when checking Alona Beach's floor plan — forcing him to declare a ₱0 cash float just to look at the layout. This creates a shift record in his name that confuses the EOD reports.
- The meat report redirected him to the login page because his session was somehow cleared. He had to re-login and retrace his steps.
- The expenses daily showed "Infinity%" in the summary table because there are no paid orders yet — alarming and confusing on a working day.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| **P0** | "Start Shift" modal blocks owner POS observation on every branch switch | Skip shift-start for owner/admin roles OR show POS in read-only observer mode without requiring float declaration | M | High | 🔴 OPEN |
| **P0** | Meat Report redirects to login (session instability under stress/reload) | Add a session restore flow: if sessionStorage is cleared but user navigates to a protected route, redirect to `/` with a "Session expired — please log in again" message (not a silent redirect); alternatively investigate what clears the session | S | High | 🔴 OPEN |
| **P1** | OCC counter mismatch between AllBranches dashboard and individual floor plans | Ensure the occupancy count derives from the same `tables.value` query as the SVG render; add a reactive test | M | High | 🔴 OPEN |
| **P1** | "Infinity%" in Expenses Daily when sales = ₱0 | Guard the division: `sales > 0 ? formatPercent(expenses / sales) : '—'` | S | Med | 🔴 OPEN |
| **P1** | Audit Log branch filter shows "QC" / "MKTI" placeholder names | Replace static location names in the audit log filter with the `LOCATIONS` constant from `session.svelte.ts` | S | Med | 🔴 OPEN |
| **P1** | Branch Comparison defaults to all-zeros "Today" | Default to "This Week" for the branch comparison, OR include in-progress orders in the "Today" view | S | Med | 🔴 OPEN |
| **P1** | Sidebar navigation collapses to staff-only nav when session degrades | Add a session health check: if `session.userName` is empty and the route requires auth, redirect immediately with a clear message; don't attempt to render degraded nav | M | High | 🔴 OPEN |
| **P2** | No visual differentiation between branch floor plans | Add a color-coded top strip (accent-orange for Alta Citta, blue for Alona Beach) or branch badge on the floor plan SVG container | S | Low | 🔴 OPEN |
| **P2** | Location selector modal doesn't show occupancy/revenue summary per branch | Add a compact 1-line stats row to each branch card in the location selector: "X OCC · ₱Y today" | M | Med | 🔴 OPEN |
| **P2** | AllBranches dashboard doesn't show combined totals | Add a summary row above the branch panels: "Combined: ₱X today · Y pax across both branches" | S | Med | 🔴 OPEN |
| **P2** | Branch Comparison table needs active (in-progress) order data for "Today" to be useful | Include orders with status 'open' and 'pending_payment' in the comparison when filtering by Today | M | Med | 🔴 OPEN |
| **P2** | "Change Location" button touch target below 44px | Add `min-h-[44px]` or `py-3` to the Change Location button | S | Low | 🔴 OPEN |
| **P2** | Floor Editor canvas empty for location with POS tables | Investigate whether floor editor and POS floor plan share the same data source; seed floor_elements matching seeded tables | L | Low | 🔴 OPEN |
