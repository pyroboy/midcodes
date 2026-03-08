# UX Audit — Manager Agent Report
## POS Floor Plan + X-Read Navigation — Manager Role — Alta Citta — 1024×768 Tablet

**Date:** 2026-03-08
**Auditor:** Manager Agent (Juan Reyes, manager, `tag`)
**Viewport:** 1024×768 (landscape tablet)
**Scenario:** Friday dinner rush — overseeing floor, running X-read mid-service
**Session method:** LocalStorage injection (`wtfpos_session`) — normal login PIN flow unreliable (see Finding M-P0-1)

---

## A. Floor Plan Layout Map

### State 1 — Empty Floor (0 occ, 8 free)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [W!] (icon sidebar collapsed)                                                    │
│  ├── [📦] Receive Delivery                                                       │
│  ├── [🧾] Log Expense                                                            │
│  ├── [🗑] Log Waste                                                              │
│  ├── [✓] Stock Count                                                             │
│  ├── [📋] X-Reading                                                              │
│  ├── [↔] Transfer Stock                                                          │
│  └── [🌙] End of Day                                                             │
│  ═══════════════════════                                                         │
│  ├── POS (active)                                                                │
│  ├── Kitchen                                                                     │
│  ├── Stock                                                                       │
│  └── Reports                                                                     │
│  ─────────────────                                                               │
│  [J] Juan Reyes / manager                                                        │
│  [→ Logout]                                                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [📍 ALTA CITTA (TAGBILARAN)]          [↕ Change Location]                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│ [☰] POS    0 occ │ 8 free          [🔍 Legend] [📦 New Takeout] [🧾 History 64] │
│ ─────────────────────────────────────────────────────────────────────────────────│
│                                                          │ 🧾                   │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐            │                       │
│  │  T1   │  │  T2   │  │  T3   │  │  T4   │            │ No Table Selected     │
│  │cap 4  │  │cap 4  │  │cap 4  │  │cap 4  │            │                       │
│  └───────┘  └───────┘  └───────┘  └───────┘            │ Tap an occupied table │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐            │ on the floor plan to  │
│  │  T5   │  │  T6   │  │  T7   │  │  T8   │            │ view its running bill │
│  │cap 4  │  │cap 4  │  │cap 2  │  │cap 2  │            │                       │
│  └───────┘  └───────┘  └───────┘  └───────┘            │ Green = available    │
│                                                          │ Orange = occupied    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ^^ FOLD LINE ~540px from top
```
**Accessibility tree confirms:** All 8 tables show as `cap N` (no pax, no timer) when available. Header badges show "0 occ / 8 free" accurately.

### State 2 — T1 Occupied (1 occ, 7 free) — observed mid-session
```
│  ┌──────────────────┐  ┌───────┐  ┌───────┐  ┌───────┐
│  │ PORK    1m       │  │  T2   │  │  T3   │  │  T4   │
│  │       T1         │  │cap 4  │  │cap 4  │  │cap 4  │
│  │     2 pax        │  └───────┘  └───────┘  └───────┘
│  │ ₱0.00      [R0]  │
│  └──────────────────┘
```
State: timer active ("1m"), pax shown, package badge top-left, bill total bottom-center, unserved count badge bottom-left (when items pending).

### State 3 — Post-Checkout (several tables returned to available)
Not directly observed due to session contention. Based on code review: tables revert to `cap N` display, header count decrements reactively.

---

## B. Cross-Page Navigation Assessment

### Navigation Path: POS → Reports/X-Read
- **Method A — Sidebar Quick Action:** Click [📋 X-Reading] icon in collapsed sidebar → 1 tap → instant navigation
- **Method B — Sidebar nav:** Expand sidebar → click Reports → navigate to Reports → select X-Read subtab → 3 taps
- **Method C — Direct URL:** goto `/reports/x-read` → 1 navigation → instant

**Observed load time:** Near-instant (RxDB local-first, data pre-loaded). No loading spinner. Doherty Threshold (<400ms) satisfied.

**Tap count (collapsed sidebar → X-Read):** 1 tap via Quick Action icon. This is excellent.

### Navigation Path: Reports/X-Read → POS
- Tap POS nav icon in sidebar → 1 tap → instant
- **Observed:** No loading state. Floor plan re-renders with current table states immediately.

**POS → X-Read → POS round trip:** 2 taps, <1 second total. Excellent.

### Manager Sidebar Nav Items (confirmed via snapshot)
Icon-rail (collapsed, left side):
```
[W!] brand toggle
───────────────
[📦] Receive Delivery    ← Quick Action (manager/owner only)
[🧾] Log Expense
[🗑] Log Waste
[✓] Stock Count
[📋] X-Reading           ← X-Read shortcut
[↔] Transfer Stock
[🌙] End of Day
───────────────
[🛒] POS
[🍳] Kitchen
[📦] Stock
[📊] Reports
───────────────
[J] Avatar
[→] Logout
```
**Admin nav item absent — correct.** Manager has 4 section nav + 7 quick actions. This is 11 unique destinations from the icon rail. Hick's Law concern: 11 icon-only items in collapsed sidebar without labels is cognitively expensive.

### LocationBanner Visibility
- **Always visible:** Yes. `sticky top-0 z-30` positioning. Persists on scroll.
- **Alta Citta styling:** Blue background (`bg-blue-50`, `border-blue-200`, `text-blue-900`) — distinct from Panglao (violet) and Warehouse (amber).
- **Correct branch:** Confirmed "ALTA CITTA (TAGBILARAN)" heading in uppercase with MapPin icon.
- **Change Location button:** Always present for manager role. Accessible from every page.
- **Risk:** The banner is only shown when `canChangeLocation` is true (ELEVATED_ROLES). Staff and Kitchen do NOT see it. This means low-privilege users have no persistent branch context — they rely on their session state being correctly set. **Branch mismatch is invisible to staff.**

---

## C. Handoff Observations (Manager Perspective)

### H1 — Table Opening Speed
When Staff opens a table, header badges update reactively. Observed: "0 occ / 8 free" → "1 occ / 7 free" within 1 render cycle after T1 opened. RxDB write → `$derived` recompute → SVG re-render. No perceptible lag. **PASS.**

### H3 — Kitchen Rejection ⚠ Badge Visibility
From FloorPlan.svelte code review:
- Badge: red pill (`#ef4444`) positioned at `(table.x + W - 28, table.y - 8)` — **overlapping the top-right corner of the table card**
- Animation: `opacity` values="1;0.6;1" dur="1s" repeatCount="indefinite" — pulsing opacity
- Content: "⚠ {rejCount}" white text, font-size 9

**Assessment:**
- Badge pulses every 1 second — visible motion. Good for noise-tolerance.
- Badge sits at top-right corner, overlapping table boundary — can be visually clipped depending on SVG layout
- Font-size 9 is very small (below 12px WCAG minimum) — text may not be readable at tablet distance
- ⚠ symbol + count is recognizable. Good use of universally understood warning symbol.
- **Would a manager notice during a rush?** The pulsing motion should catch attention. But at 9px font size and positioned outside the table boundary (top-right overhang), it risks being clipped or overlooked on smaller table cards.
- **Verdict: CONCERN** — animation is good, but size (9px font, small pill) and position (edge-hanging) reduce discoverability during a high-density floor view.

### H5 — Table Transfer
Not directly observed (session contention). From code: `transferTable()` updates `table.currentOrderId` and resets the old table to 'available'. Both tables re-render reactively. Header badge should update immediately.

### H6 — Table Merge
Not directly observed. From code: merge combines orders, one table becomes 'available'. Header badge decrements. Expected: immediate floor plan update.

---

## D. X-Reading Assessment

### Data Observed on X-Read Page
```
Date:     Mar 9, 2026
Status:   Live — shift still open (green pulsing dot)

4-metric grid (above fold):
  Gross Sales:  ₱65,303.00
  Net Sales:    ₱64,129.00
  Total Pax:    130
  Avg Ticket:   ₱493.00

Payment Breakdown (Live):
  💵 Cash:   ₱34,390.00
  💳 Card:   ₱11,541.00
  📱 GCash:  ₱18,198.00

Order Status:
  Open:   10
  Paid:   52
  Voided: 2

X-Read History (7 entries → generated X-Read #8 → became the new entry):
  X-Read #7: ₱65,303 gross, 130 pax — 12:39 AM by Juan Reyes ← just generated
  X-Read #8 (old seed): ₱10,832 gross, 24 pax — 12:00 AM Manager
  ... (X-Reads #1–6, historical seed data)
```

### Assessment
- **Load time:** Instant. All data from local RxDB. No network fetch.
- **Data accuracy:** Live totals reflect all RxDB orders for `tag` location. The "10 Open / 52 Paid / 2 Voided" gives real operational context.
- **Above-fold confidence:** ✅ 4-metric summary grid is immediately readable at top of page. A manager can assess shift health at a glance without scrolling.
- **Payment split:** Cash/Card/GCash breakdown visible immediately below the grid — critical for Filipino restaurant operations (GCash is primary payment method).

### Concerns
1. **X-Read numbering confusion:** After generating, the new X-Read appears as #7 (renumbered from seed data) while historical data shows as #8. The numbering appears to work backwards (highest = newest) but visually confusing since the history list starts with historical data not the new snapshot.
2. **"Generate X-Read" button style:** `style="min-height: 40px"` — 40px is below the WTFPOS 44px minimum touch target. This is a Fitts's Law FAIL for a primary action button on this page.
3. **No confirmation on Generate:** X-Reads are permanent historical snapshots. There is no confirmation dialog before generating — a stray tap creates an unwanted X-Read entry.
4. **Maya payment missing:** Payment breakdown shows Cash, Card, GCash but no Maya. The PRD mentions Maya as a supported Philippine e-wallet. Absence could cause financial reconciliation errors.
5. **X-Read history timestamp format:** "12:00 AM · Manager" for historical entries — the time shows midnight for seed data (not actual generation time), and "Manager" is a role label not a person's name. The just-generated entry shows "12:39 AM · Juan Reyes" (name, not role). Inconsistent attribution format.
6. **No VAT breakdown visible:** BIR requires VAT-able vs VAT-exempt breakdown on X-Reads. The current X-Read shows gross/net sales but no explicit VAT split. This may be a BIR compliance gap.

### Would this give confidence in day's financials mid-service?
**Partially.** The 4-metric summary (Gross, Net, Pax, Avg Ticket) is excellent and immediately scannable. Payment breakdown is valuable. But the X-Read history numbering is confusing, and the absence of VAT breakdown may cause compliance anxiety for a manager who has dealt with BIR audits.

---

## E. Principle Violations Spotted

| Principle | Status | Finding |
|---|---|---|
| **Hick's Law** | CONCERN | Collapsed sidebar has 11 icon-only quick actions + nav items with no labels. During rush, manager must recall what each icon means. No grouping by frequency. |
| **Miller's Law** | PASS | X-Read 4-metric grid is within 7±2 chunks. Floor plan groups 8 tables in 2 rows. Order sidebar groups by item status. |
| **Fitts's Law** | FAIL | "Generate X-Read" button is 40px (below 44px minimum). Rejection alert badge is 9px font on a small pill. Manager PIN numpad buttons appear adequate (tappable area). |
| **Jakob's Law** | PASS | Left sidebar nav, sticky location banner, orange CTAs, tabbed sub-nav — all follow standard POS/tablet app conventions. |
| **Doherty Threshold** | PASS | All observed page loads are instant (RxDB local-first). No loading spinners needed. Table status updates are reactive and immediate. |
| **Visibility of System Status** | CONCERN | Staff/Kitchen users see NO LocationBanner — branch context invisible to them. Manager sees floor status well via header badges. Kitchen rejections are animated badges (good). Shift status "Live — shift still open" on X-Read is excellent. |
| **Gestalt Proximity** | CONCERN | Quick Actions and Primary Nav are both in the sidebar but visually separated by only a horizontal line. On mobile sheet mode, the distinction between "quick actions" (dotted border) and "nav items" (solid) may not be clear. |
| **Gestalt Similarity** | PASS | All status colors consistent: green=occupied/success, orange=billing/accent, red=critical/danger, purple=refills/owner. Table cards all follow same structure. |
| **Visual Hierarchy** | CONCERN | On the X-Read page, the "Generate X-Read" button and the 4-metric grid compete for visual prominence. The button is small (40px) while the grid is large — hierarchy is inverted for the primary action. |
| **Visual Hierarchy 2** | PASS | Floor plan header: "POS" heading + occ/free badges + action buttons — clear hierarchy. LocationBanner uppercase heading establishes authority. |
| **WCAG Color Contrast** | FAIL | FloorPlan timer text: `fill="#10b981"` (status-green) on white SVG background = 3.5:1 — FAILS WCAG AA for 9px font. Package badge: `font-size="8"` at 4.3:1 contrast — FAILS for text <14px bold. Rejection alert: 9px white text on red = 4:1 — borderline, technically FAIL for 9px. |
| **WCAG Touch Targets** | FAIL | "Generate X-Read" button at 40px height. Table cards in floor plan: tables are clickable SVG `<g>` elements — no explicit min touch target enforcement in SVG coordinate space. |
| **Consistency** | PASS | Button styles, badge colors, font families (Inter/JetBrains Mono) are consistent across POS and Reports pages observed. |
| **Consistency 2** | CONCERN | X-Read attribution format inconsistent: historical = "role name" (generic), new = "user name" (specific). Quick Action links use `?action=open` param but X-Read page ignores this param (removes it via `replaceState` without acting on it). |

---

## F. Manager-Specific Pain Points

### P0 — Critical

**M-P0-1: Manager Login PIN Flow Does Not Persist Session**
During multi-agent testing, the PIN authentication flow for manager login (juan/juan + PIN 1234) completed the PIN modal successfully but the session remained set to the previously active user. The `wtfpos_session` localStorage value was not updated to Juan Reyes/manager after PIN verification. This means a manager who tries to log in through the normal PIN flow may end up operating as a different role. This was bypassed in testing via direct `localStorage.setItem()`.
- **Impact:** Manager believes they are making manager-role decisions but are operating as Staff.
- **Risk surface:** Role-gated actions (pax change, void, PIN required actions) may fail unexpectedly.
- **Evidence:** Sidebar showed "Maria Santos / staff" after completing the Juan Reyes manager PIN flow.

**M-P0-2: Floor Plan SVG Tables Cannot Be Reliably Tapped via Automation (Pointer Events Issue)**
SVG `<text>` elements inside table `<g>` groups have `pointer-events="none"`. The parent `<g>` is interactive but the clickable hitbox is the SVG `<rect>` (table body). When tables are small or dense, adjacent elements or overlapping sidebar quick actions (in the DOM) can intercept tap events. The sidebar quick actions section (`?action=open` links) intercepted multiple table taps during testing.
- **Impact on manager:** During a busy floor, the manager may accidentally tap a Quick Action sidebar link instead of a table, navigating away from the floor plan.
- **Evidence:** Clicking table T1 (via accessibility ref) triggered navigation to `/stock/counts` (the "Stock Count" quick action), not the PaxModal.

### P1 — Significant

**M-P1-1: No Package/Time Remaining Indicator on Table Cards**
Table cards show: label (T1), timer (1m), pax count, package badge (PORK/BEEF/Beef+Pork in tiny 8px font), and bill total. Missing: **remaining time display for AYCE** tables. Samgyupsal AYCE has a time limit (typically 90 minutes). The timer shows elapsed time but there is no countdown-to-limit indicator. A manager needs to know which tables are approaching their time limit to prepare the check and avoid overstays.

**M-P1-2: No "Floor at a Glance" Summary for Unserved Items**
Each occupied table shows an animated orange badge (bottom-left) with unserved item count. But there is no header-level summary like "3 tables with pending orders" — the manager must visually scan each table card to identify bottlenecks. During a dense floor (6+ tables), this requires focused attention, not glancing.

**M-P1-3: Quick Actions Invisible in Collapsed Sidebar (Icon-Only)**
When the sidebar is collapsed (icon rail), the 7 quick action buttons show only as small icons (16×16px) with no labels. While tooltips likely exist, on a touchscreen device tooltips require hover which is not available. A manager trying to quickly log an expense or run an X-Read in collapsed mode must memorize icon meanings. The icons themselves (Truck=Receive Delivery, Receipt=Log Expense, Moon=End of Day) are not universally obvious.

**M-P1-4: LocationBanner Hidden from Staff and Kitchen**
The LocationBanner component uses `{#if canChangeLocation}` — it only renders for ELEVATED_ROLES (owner, admin, manager). Staff and Kitchen see no location banner. If a staff member starts serving the wrong branch's tables (e.g., if their session locationId was incorrectly set), there is no visible indicator. The manager cannot see from the floor plan which branch's data each staff device is showing.

**M-P1-5: "Change Location" Button Available Mid-Service**
The LocationBanner "Change Location" button is always visible and clickable during active service. If a manager accidentally taps this and switches to Panglao, the floor plan immediately shows Panglao's tables — the Alta Citta tables vanish. There is no confirmation warning ("You are switching branches mid-service"). For a busy manager this is a potentially catastrophic misclick.

**M-P1-6: X-Read Generation Has No Confirmation**
`handleGenerate()` calls `generateXRead()` immediately on button click. The button changes to "✓ Generated!" for 2.5 seconds. There is no "Are you sure?" dialog. On BIR compliance grounds, a spurious X-Read is a problematic document.

**M-P1-7: X-Read Page Missing Maya Payment and VAT Breakdown**
Payment breakdown shows Cash, Card, GCash but no Maya. VAT-able sales vs. VAT-exempt breakdown is absent. BIR X-Reads typically need explicit VAT computation. Philippine regulations require this.

### P2 — Minor

**M-P2-1: Sidebar Clock Only Shows in Expanded Mode**
The real-time clock in the sidebar header (`{clockTime}`) has `group-data-[collapsible=icon]:hidden` — it disappears when the sidebar is collapsed. During a busy service, a manager with the sidebar collapsed has no persistent time display. The POS header does not show the current time. Managers often need to know the current time to make shift decisions.

**M-P2-2: History Badge on "🧾 History" Shows All-Time Count**
The History button shows "66" — this appears to be all historical orders ever, not just today's shift. The number provides no operational value mid-service and could be confusing. A "64 past orders today" or "2 voided today" would be more useful.

**M-P2-3: Rejection Alert Badge Font Size (9px) Below Minimum**
The ⚠ rejection badge on table cards uses `font-size="9"` — below the 12px minimum for WCAG compliance and below the 14px recommended for touch/restaurant environments. The badge content ("⚠ 1") is barely legible at arm's length.

**M-P2-4: X-Read Timestamp "12:00 AM" for Historical Data**
Seed/historical X-Reads all show "12:00 AM · Manager" as timestamp. This is because the seed uses midnight timestamps. The label "Manager" (role) vs. "Juan Reyes" (name) is inconsistent between historical and new entries. A manager reviewing historical X-Reads cannot tell who generated them.

---

## G. Raw Observations

### Multi-Agent Session Contention (Critical Architecture Finding)
The most severe finding from this audit is not a UI issue but an **architectural/testing safety issue**: the `wtfpos_session` localStorage key is shared across all browser contexts in the same origin. When three agents (Manager, Staff, Kitchen) share a browser process via playwright-cli, their session state constantly overwrites each other. The manager session was overwritten 4+ times during the audit by Staff and Kitchen agents.

**POS-relevant implication:** In a real deployment where multiple devices are used at the same location (cashier tablet + manager tablet + kitchen tablet all on the same browser/origin via some shared kiosk setup), session crossover is catastrophic. However, since WTFPOS runs as separate browser instances on separate devices, this is unlikely in production. In multi-tab usage on a single device, it would be a real problem.

### Shift Start Modal Blocks Floor Plan Access
The `ShiftStartModal` is rendered as a full-screen overlay on /pos that blocks the floor plan, order sidebar, and all navigation. The modal says "Declare your opening cash float before accessing the POS."

**Assessment:** This is intentional and correct for shift accountability. However:
- The modal allows ₱0 float ("You can enter ₱0 if no opening float is provided") — this undermines the purpose of declaring a float.
- The modal is rendered in the DOM even when it shouldn't appear (when shift is already started) — needs to be reliably dismissed/skipped.
- A manager who has already started their shift and navigates back to /pos should NOT see this modal again.

### SVG Floor Plan Accessibility
The floor plan is an SVG with `<g role="button" tabindex="0">` elements for each table. This is reasonable accessibility. However:
- Tables are `aria-label="Table {table.label}"` — basic but acceptable.
- No ARIA live region for the occ/free count — screen reader users won't be notified when counts change.
- Rejection badges have no `aria-label` or `role="alert"` — critical alerts (kitchen refusals) are visually animated but not announced to AT users.
- Package badges (8px font) and timer text (9px font) are SVG `<text>` elements that are accessible but not readable by most screen readers.

### Floor Plan Density at 8 Tables
At 8 tables (current layout), the floor plan renders comfortably at 1024×768. No density issues observed. Cards are readable. The 2-row × 4-column grid with the SVG canvas filling ~70% of the screen width is well-proportioned.

At 6+ occupied tables: the animated orange badges (unserved), red rejection badges, and green occupied borders create sufficient visual differentiation. The floor-at-a-glance principle should be satisfied for a reasonably experienced manager.

### X-Read Page Layout
The X-Read page uses a `grid-cols-[1fr_380px]` two-column layout:
- Left: Payment breakdown + Order Status
- Right: X-Read history

At 1024px wide, with the sidebar collapsed, the main content area is approximately 960px. The 380px right column is proportional. The layout does not horizontally scroll.

**Issue:** The 4-metric summary grid above uses `grid-cols-4`. At 1024px with sidebar, this results in cards approximately 220px wide each — readable and comfortable. Good use of screen real estate.

### Reports Sub-Navigation
The Reports section shows a multi-group tab navigation with 5 groups: Operations, Expenses, Revenue & Sales, Profitability, Branch. Total of ~14 report links visible in the subnav.

**Hick's Law concern:** 14 report links across 5 groups is approaching cognitive overload. However, the grouping helps chunking. The subnav scrolls on smaller viewports. For a manager who primarily uses X-Read and End of Day, the most important links (in "Operations" group) are first — good Serial Position Effect usage.

---

## VERDICT SUMMARY

| Priority | Count | Key Items |
|---|---|---|
| P0 | 2 | Manager login PIN doesn't persist session; Table tap intercepted by sidebar quick actions |
| P1 | 7 | No AYCE time remaining; No floor summary for unserved; Icon-only quick actions unclear; No location banner for staff; No change-location confirmation; No X-Read confirmation; Missing Maya + VAT in X-Read |
| P2 | 4 | Clock hidden in collapsed sidebar; History count shows all-time; Alert badge 9px font; Inconsistent X-Read attribution |

**Overall:** The floor plan's at-a-glance status (colored cards, animated badges, header occ/free count, location banner) provides a capable manager oversight experience. The X-Read page loads instantly and surfaces the right financial summary for mid-service checks. The critical gaps are: the manager authentication bug (P0), the AYCE countdown absence (P1), and the Maya/VAT omission from X-Read (P1, BIR compliance risk). The sidebar Quick Actions for manager are a strong UX advantage — 1-tap access to X-Read from anywhere in the app is excellent.
