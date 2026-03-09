# UX Audit — Manager Role, Alta Citta (Tagbilaran)
**Audit Date:** 2026-03-09
**Auditor Role:** Manager (Juan Reyes) — Alta Citta branch
**Agent:** A3 — UX Audit Agent (Manager Perspective)
**Scenarios:** S03, S04, S05, S08, S09, S11, S12, S13
**Viewport:** 1024×768

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** Expense issues largely resolved; Delivery form draft guard and item typeahead remain open. Key fixes: expense category grouping, log filter, inline validation, date field, spinner, photo capture, paid-by persistence. Key open: delivery Cancel guard, 80-item dropdown no typeahead, waste form current-stock hint.

---

## A. Manager Navigation Map (ASCII)

```
LOGIN PAGE ──(1 tap: Manager card)──► PIN MODAL ──(4 digits + verify)──► /pos [Shift Modal]
                                                                              │
                                                                    (Start Shift →, 1 tap)
                                                                              │
                                                                         /pos FLOOR
                                                                    ┌────────┴──────────────────────────────┐
                                                                    │ Sidebar Quick Actions (always visible) │
                                                                    │  Receive Delivery  → /stock/deliveries │ 1 tap
                                                                    │  Log Expense       → /expenses          │ 1 tap
                                                                    │  Log Waste         → /stock/waste       │ 1 tap
                                                                    │  Stock Count       → /stock/counts      │ 1 tap
                                                                    │  X-Reading         → /reports/x-read    │ 1 tap
                                                                    │  Transfer Stock    → /stock/transfers   │ 1 tap
                                                                    │  End of Day        → /reports/eod       │ 1 tap
                                                                    └─────────────────────────────────────────┘
                                                                              │
                /stock/deliveries ◄─(1 tap)─┤    ├─(1 tap)─► /expenses
                       │                    │    │                   │
                (+ form auto-opens)          │    │            (form inline)
                       │                    │    │
                /stock/inventory ◄──────────┘    └────────────────────────► /reports/x-read
                /stock/waste                                                    │
                                                                          /reports/sales-summary
                                                                                │
                                                                 Back to /pos ──┘  (1 tap via sidebar POS link)

Navigation tap counts (from /pos):
  POS → Deliveries:         1 tap (sidebar quick action)
  POS → Expenses:           1 tap (sidebar quick action OR /expenses direct)
  POS → Inventory:          2 taps (Stock nav → Inventory tab)
  POS → Waste Log:          1 tap (sidebar quick action)
  POS → X-Read:             1 tap (sidebar quick action)
  Reports → POS:            1 tap (sidebar POS nav link)
  Any page → Any page:      1-2 taps (sidebar always accessible)
```

---

## B. Per-Scenario Friction Log

### S03 — "Delivery Van Parks Out Front"

**What worked:**
- Quick Action "Receive Delivery" in sidebar navigates to `/stock/deliveries` in 1 tap from POS ✓
- The `?action=open` URL param auto-opens the receive form — no second tap needed ✓
- Form defaults to "Pork Bone-In" (most common meat) — reasonable default ✓
- Supplier quick-tap chips (Metro Meat Co., SM Trading, Korean Foods PH, Transfer from wh-tag) remove typing ✓
- "Expiring Soon (1)" alert panel above the form surfaced immediately (Kimchi B-243, 2d left) ✓
- Existing delivery history table with FIFO usage bars is informative ✓
- "Deliveries 1" badge on sub-nav tab shows pending count ✓
- Branch "ALTA CITTA (TAGBILARAN)" clearly visible in LocationBanner ✓

**What blocked / slowed:**
- **BLOCKER: "Start Your Shift" modal** (z-index 80) blocks ALL sidebar interaction including the Quick Action "Receive Delivery" link. First login of the day requires shift declaration before ANY quick action is usable. A manager receiving a delivery immediately after login must first start the shift. The shift modal uses `z-index: 80` which intercepts all pointer events on the entire layout. Quick actions are visually present but completely unclickable.
- The quantity field uses `input[type=number]` with no label attribute, no id, no name — difficult to target programmatically and potentially ambiguous on the page (the filter selects also use comboboxes). Label reads "Quantity *" but is a `<span>`, not a real `<label>` — AT/accessibility concern.
- The item selector is a long `<select>` with 80+ items in alphabetical order within categories — no search/typeahead for the item field. Under pressure, finding "Pork Bone-In" requires scrolling.
- **Form fields: no required-field validation feedback until submit is clicked** (Receive Stock remains disabled). Manager cannot know which fields are still missing.

**Tap count from POS to delivery form (logged in, shift started):** 1 tap (Quick Action) → form auto-opens = 1 effective action.
**Tap count from POS before shift started:** ∞ — Shift modal blocks all navigation.

---

### S04 — "Water Gallon Expense" (Quick Expense Under Pressure)

**What worked:**
- `/expenses` page renders an inline expense form immediately — no modal needed ✓
- Category dropdown includes relevant options: Petty Cash, Meat Procurement, Produce & Sides, Utilities, Labor Budget ✓
- Paid By options: Petty Cash, Cash from Register, Company Card, Owner's Pocket ✓
- Expense submitted successfully and Total updated from ₱38,437 to ₱38,901 ✓
- Form auto-resets after submission — ready for next entry ✓
- Branch "ALTA CITTA (TAGBILARAN)" visible ✓
- Running total "Total Recorded (All Time)" visible at top ✓

**What blocked / slowed:**
- **Context loss: navigating from Deliveries to Expenses DESTROYS all delivery form state.** There is no draft/save mechanism. The delivery form at `/stock/deliveries?action=open` does not persist if manager navigates away. After logging the water gallon expense, manager must re-open the delivery form and re-fill all fields.
- There are TWO expense routes: `/expenses` (standalone inline form) and `/reports/expenses-daily?action=open` (the Quick Action link). The Quick Action "Log Expense" points to `/reports/expenses-daily?action=open` but `/expenses` is the more direct page. Manager arriving via Quick Action may be confused by seeing the full reports page with an expense panel.
- No way to do both delivery entry and expense on the same device without losing one. No "minimize to draft" or "save draft" feature.
- No timestamp/receipt photo quick-capture on mobile — receipt photo is optional but requires a separate button tap.

---

### S05 — "Lettuce Low Alert"

**What worked:**
- Inventory page at `/stock/inventory` loads with clear health summary at top: **Total Items: 93, OK: 93, Low Stock: 0, Critical: 0** (clickable filter buttons) ✓
- Search input ("Search items or category…") successfully narrows to 3 items on "lettuce" ✓
- **Lettuce shows: 3,000g, 75% level, "Adequate" — ok status, Min threshold 2,000g** ✓
- "Deliveries 1" and "Counts 1" badges in sub-nav give pending work counts ✓
- List view / Grid view toggle available ✓
- Sort by Item, Current/Min, Status available ✓
- Stock Level column shows visual progress bar ✓

**What blocked / slowed:**
- **"Low Stock: 0" filter is clickable but it's a stat card, not obviously a filter button.** Its affordance as a filter vs. information display is unclear.
- **No "show only below threshold" quick sort** — manager must know to click the "Low Stock 0" card or manually sort by Status. Under chaos, this may not be obvious.
- The LocationBanner `h2` is inside the main content area not the inventory component itself — the inventory page does NOT have an independent branch header in its own section. Manager may not confirm they're looking at Alta Citta stock vs. Alona Beach.
- **[HANDOFF 3 check]**: Lettuce at 75% / 3,000g — if Agent A2 (Kitchen) logged waste for lettuce, this number would reduce. The current state shows it as "Adequate" with 3,000g, suggesting no kitchen waste was logged for it yet, OR the reduction hasn't propagated.
- No "last updated" timestamp on individual inventory rows — manager cannot tell if stock count data is from earlier today or yesterday.

---

### S08 — "Delivery Count Mismatch"

**What worked:**
- Delivery form re-opens cleanly via `?action=open` ✓
- Existing delivery history in table is auditable (time, item, supplier, qty, batch, FIFO usage bar) ✓
- Quantity field is `input[type=number]` — easy to correct with `clear()` and retype ✓
- Supplier chips persist their selection visually ✓

**What blocked / slowed:**
- **Qty field bounding box testing indicates the input may scroll off screen** when the side panel is open at 1024×768 — the form panel competes with the delivery history table on the same horizontal layout.
- **No confirmation step before Receive Stock submit** — a mis-typed 20 vs 18 could be committed immediately. No "review before save" dialog.
- After submission, the delivery appears in the history table but **the form panel stays open** with cleared fields — no success toast or confirmation that the record was saved. Manager must visually check the table to confirm.
- Batch number and expiry are "Optional" but for food safety and FIFO, these are critical. Nothing nudges the manager to fill them in under time pressure.

---

### S09 — "Lettuce Hits Zero — Manager Response"

**What worked:**
- Waste Log page auto-opens form via `?action=open` ✓
- Item selector includes ALL stock items including Lettuce ✓
- The today's waste summary at top (Total Waste Today, Top Wasted Item, Most Common Reason) gives context ✓
- "Preparation waste only — not unconsumed customer leftovers" label sets scope correctly ✓
- "Log Waste" button becomes enabled after item + qty selection ✓

**What blocked / slowed:**
- **When the page is accessed as "ALL LOCATIONS" session (Owner), waste shows aggregate cross-branch data** — manager Juan Reyes navigating waste would see Alta Citta data only if their session is locked to Alta Citta. When Owner accidentally views waste at ALL LOCATIONS, it shows branch-mixed data without clear per-branch attribution in the waste log table rows (no "Branch" column in waste log).
- **Only 1 select visible initially** — the Reason/Spoilage field was not found programmatically. Either: (a) the Reason field requires scrolling within the form panel, (b) it's below the fold, or (c) it's a separate select that's not immediately visible. This is a UX problem — Reason is an important audit field and is not prominently placed.
- No "remaining qty" hint in the form — after selecting Lettuce, manager doesn't see "Current stock: 3,000g" to know how much to waste.
- The waste item dropdown has 80+ items with no search/typeahead — finding "Lettuce" requires scrolling.

---

### S11 — "X-Read at 8PM"

**What worked (strong):**
- Branch: "ALTA CITTA (TAGBILARAN)" in LocationBanner ✓, "📍 Alta Citta (Tagbilaran)" in page subtitle ✓
- Date: "Mar 9, 2026" heading with "Live — shift still open" status ✓
- **Key metrics immediately visible (no scroll required):**
  - Gross Sales: ₱101,402.00 ✓
  - Net Sales: ₱99,412.00 ✓
  - Total Pax: 179, Avg Ticket: ₱555.00 ✓
- Payment Breakdown: Cash ₱51,117 / GCash ₱34,968 / Maya ₱0 / Credit ₱13,327 ✓
- VAT breakdown (12% inclusive) visible ✓
- Order Status: 5 Open, 62 Paid, 9 Voided ✓
- "Print" button visible ✓
- "Generate X-Read" button visible ✓
- X-Read History with previous reads (Gross/Net/Cash/GCash/Pax/Voids) ✓
- Generate X-Read executed successfully ✓

**What blocked / slowed:**
- The Reports sub-navigation is an extended grouped list (Operations / Expenses / Revenue & Sales / Profitability / Branch) — visually dense. Manager may not immediately find X-Read under "Operations".
- The quick sidebar action "X-Reading" correctly points to `/reports/x-read?action=open` but the page doesn't appear to do anything different with the `?action=open` param (no modal opens automatically).

**Sales Summary branch attribution:**
- `/reports/sales-summary` headings: "ALTA CITTA (TAGBILARAN)" in LocationBanner, "Branch Reports" as H1 — ✓ branch-attributed. Not "Consolidated Reports".

---

### S12 — "Peak Hour: Multi-Task Navigation"

**What worked:**
- From any reports page → POS: **1 tap** (sidebar POS nav link, always visible) ✓
- From POS → any section: **1 tap** (sidebar Quick Actions or nav links) ✓
- Sidebar is always accessible on all pages (SidebarInset layout) ✓
- LocationBanner "ALTA CITTA (TAGBILARAN)" consistently visible across POS, Stock, Reports ✓
- Navigation: Reports → POS takes < 500ms (single link click, no modal) ✓

**What blocked / slowed:**
- The reports sub-nav is only visible on Reports section pages — manager on POS cannot see which report they last had open (no breadcrumb/backtrack).
- No "back" shortcut from Reports to POS specifically — must use sidebar nav.

---

### S13 — "Chaos: Everything Open"

**Sidebar as command center assessment:**

The sidebar (collapsed icon-rail at 1024×768) provides:
- 7 Quick Action links (Receive Delivery, Log Expense, Log Waste, Stock Count, X-Reading, Transfer Stock, End of Day)
- 4 nav section links (POS, Kitchen, Stock, Reports)
- User initial + Logout

**What the sidebar DOES provide:**
- Fast 1-tap access to every critical manager task ✓
- Consistent across all pages ✓
- LocationBanner always shows branch context ✓

**What the sidebar DOES NOT provide:**
- No urgency indicators — no "2 low stock items" badge on Stock nav link
- No pending delivery count in sidebar (the "Deliveries 1" badge is only in the Stock sub-nav, not the main sidebar)
- No open table count in sidebar for POS link
- No "shift time elapsed" or "tables nearing AYCE limit" in sidebar
- No "unread kitchen alerts" count in sidebar
- The sidebar icon-rail is compact — labels are text inside the icon link but not always readable at collapsed state

**Critical finding for chaos mode:**
When `locationId = 'all'` (Owner at all locations), the Quick Actions sidebar shows all 7 links but with a tooltip: **"Select a specific branch to use quick actions"** — the links appear to remain navigable (they link to specific routes) but the `?action=open` forms may not work correctly without a specific location. This is a UX gap — the links should either be visually disabled/grayed with clear explanation, or they should first prompt for location selection before opening the form.

---

## C. Context-Switch Cost Analysis

| Switch | Taps | Data Lost | Notes |
|--------|------|-----------|-------|
| POS floor → Deliveries | 1 tap (shift started) / ∞ (pre-shift) | None (POS has no in-progress form) | Shift modal is the only blocker |
| Deliveries → Expenses | 2 taps (navigate away + navigate to /expenses) | **ALL delivery form data** | No draft save; complete loss |
| Expenses → Stock (Inventory) | 2 taps (Stock nav + Inventory tab) | Expense form resets (but only if not submitted) | OK if expense submitted first |
| Stock → Reports (X-Read) | 1 tap (X-Reading quick action or Reports nav) | None | Seamless |
| Reports → POS floor | 1 tap (POS sidebar link) | None | Seamless |

**Worst context switch:** Deliveries → Expenses. The delivery form has no persistence. Manager must either: (a) complete delivery entry before logging expense, (b) ask another staff member to handle one task, or (c) re-enter delivery data after returning from expense.

---

## D. Branch Attribution Check

| Page / Report | Branch Visible | Where | Notes |
|--------------|----------------|-------|-------|
| Login page | Branch labeled on card | Dev quick-login: "Alta Citta · Tagbilaran" on Juan Reyes card | Clear |
| PIN Modal | No branch shown | N/A | Acceptable — branch is from card selection |
| /pos (after login) | ✓ ALTA CITTA (TAGBILARAN) | LocationBanner h2 | Clear, prominent |
| /stock/deliveries | ✓ ALTA CITTA (TAGBILARAN) | LocationBanner h2 | Clear |
| /stock/inventory | ✓ In LocationBanner | LocationBanner h2 (not in inventory component itself) | Subtle — relies on banner |
| /stock/waste | ✓ / Shows ALL when Owner session active | LocationBanner h2 | Owner at 'all' sees cross-branch data |
| /expenses | ✓ ALTA CITTA (TAGBILARAN) | LocationBanner h2 | Clear |
| /reports/x-read | ✓ ALTA CITTA (TAGBILARAN) | LocationBanner + "📍 Alta Citta (Tagbilaran)" in subtitle | Excellent — double attribution |
| /reports/sales-summary | ✓ ALTA CITTA (TAGBILARAN) | LocationBanner + "Branch Reports" H1 | Good |
| All pages (collapsed sidebar) | ✓ | LocationBanner always in layout | Consistent |

**Overall branch attribution: STRONG.** The LocationBanner is mounted in root layout and is present on every authenticated page. The `h2` "ALTA CITTA (TAGBILARAN)" + "Change Location" button provides unambiguous context. Reports add a second layer with "📍 Alta Citta (Tagbilaran)" in the subtitle.

**One gap:** When `session.locationId = 'all'` (Owner), the banner shows "ALL LOCATIONS" but individual data in waste/stock tables shows mixed-branch records without per-row branch attribution. Manager Juan Reyes would never hit this state (locked to Alta Citta), but the Owner could accidentally use waste/stock as if at a specific branch.

---

## E. Manager UX Raw Findings (Bullet List)

### Login & Session Setup
- The "Start Your Shift" modal on first POS access blocks ALL sidebar interactions via z-index 80 — quick actions are visually present but unclickable until shift is declared. A manager receiving a delivery at the start of service CANNOT skip shift declaration.
- The shift modal requires declaring an opening cash float (₱0 is allowed, but must be acknowledged). There's no "skip for non-cashier operations" path.
- PIN entry on login uses a visual numpad — keyboard typing does not activate the PIN digits. This is fine for touchscreen use but adds 4 extra touch targets vs. keyboard.

### Delivery Form (S03, S08)
- The `?action=open` URL param successfully auto-opens the receive form — excellent shortcut behavior.
- The delivery form does NOT have an `aria-label` or `id` on the quantity `input[type=number]` — accessibility deficit.
- The item selector for delivery is a native `<select>` with 80+ options, no search — finding a specific item requires scrolling. Adding typeahead/search (like the search input added to the history filter) would halve the time.
- "Current stock: 7500 g" is displayed below the item select — good context, but displayed as a `<p>` paragraph, easy to miss.
- Supplier chips (Metro Meat Co., SM Trading, Korean Foods PH, Transfer from wh-tag) are fast and well-placed — strong UX pattern.
- No confirmation before submit — mistyped quantities can be committed without warning.
- No success toast/confirmation message after delivery saves — manager must visually scan the history table.
- "Receive Stock" button stays disabled until required fields are filled — clear validation, but no field-level error messages explaining WHICH field is missing.
- The "Expiring Soon (1)" alert panel is well-placed above the form — manager sees it without searching.

### Expense Form (S04)
- `/expenses` standalone page is clean and task-focused — no distractions.
- "Petty Cash" as default paid-by category is the right default for samgyupsal operations.
- Receipt Photo button is present but requires camera access — quick for mobile, less useful on desktop.
- Context switch from delivery to expense = 100% form data loss. No draft. No warning.
- The Quick Action "Log Expense" points to `/reports/expenses-daily?action=open` which loads the full reports layout, not the leaner `/expenses` page. Inconsistency in what "quick" means.

### Inventory (S05)
- The inventory health stats (Total/OK/Low Stock/Critical) are click-to-filter — this pattern works.
- "Low Stock: 0" is a great affordance but its filter behavior isn't obvious at first glance.
- No "last counted" timestamp per item — manager can't tell if the 3,000g for Lettuce is from today's count or yesterday's.
- The stock level column shows a percentage bar but no visual warning color for items approaching threshold.
- "Deliveries 1" badge on the sub-nav delivers urgency context — good.

### Waste Form (S09)
- Only 1 select visible in the waste form at 1024×768 — the Reason dropdown appears to be off-screen or not rendered until qty is entered. This is a usability issue.
- No "Current stock" hint shown when item is selected in waste form (unlike the delivery form which shows it).
- Waste form dropdown has 80+ items — same no-typeahead issue as delivery form.

### X-Read & Reports (S11)
- X-Read page shows all critical numbers above the fold at 1024×768 — no scroll required.
- "Live — shift still open" status is well-placed.
- Print button is present and works.
- The reports sub-navigation (Operations / Expenses / Revenue & Sales / Profitability / Branch) is visually grouped and useful, but somewhat dense.
- X-Read History panel shows last 7+ previous reads with Gross/Net/Cash/GCash/Pax/Voids — excellent audit trail.

### Navigation & Sidebar (S12, S13)
- 1 tap from any page to any other section via sidebar — excellent.
- Sidebar Quick Actions are always accessible (except pre-shift on POS page).
- No urgency indicators in sidebar itself — no badge on "Stock" link for low stock, no badge on "POS" for tables nearing time limit.
- When `locationId = 'all'`, Quick Actions show tooltip "Select a specific branch to use quick actions" but the links remain active — potential source of confusion.
- The sidebar is in collapsed (icon-rail) mode at 1024×768 — labels only appear on hover. Manager using a touchscreen tablet may not hover, so icons alone must be self-explanatory.
- No "currently on this page" active state clearly visible for quick action links (only nav links show active).

### Cross-Cutting Concerns
- No multi-task UI: manager cannot have two forms open simultaneously (e.g., see delivery history while filling expense).
- The `?action=open` shortcut URL pattern is excellent but not documented anywhere in the UI — it's implicit.
- No notification/alert system visible in the sidebar for kitchen alerts (refuse, out of stock) or pending stock counts.

---

## F. Snapshots Taken

| Snapshot | State |
|----------|-------|
| page-2026-03-08T20-08-01-794Z.yml | Login page — initial state |
| page-2026-03-08T20-13-58-769Z.yml | PIN modal — Manager Juan Reyes selected, 4-digit numpad visible |
| page-2026-03-08T20-15-06-562Z.yml | POS landing with Shift Start modal blocking |
| page-2026-03-08T20-15-28-918Z.yml | POS floor — shift started, Quick Actions visible in sidebar |
| page-2026-03-08T20-15-39-221Z.yml | /stock/deliveries — form auto-opened, history list visible |
| page-2026-03-08T20-18-38-671Z.yml | POS floor (manager session) — sidebar with 7 Quick Actions |
| page-2026-03-08T20-25-23-146Z.yml | /expenses — after expense submission, total updated |
| page-2026-03-08T20-26-13-109Z.yml | /stock/inventory — lettuce search results (3 items) |
| page-2026-03-08T20-29-55-188Z.yml | Owner at ALL LOCATIONS — Quick Actions disabled tooltip visible |
| page-2026-03-08T20-31-34-490Z.yml | /stock/waste — waste form open with Log Waste button, item list |
| page-2026-03-08T20-33-13-274Z.yml | /reports/x-read — full X-Read with all KPIs visible |
| page-2026-03-08T20-35-08-474Z.yml | /pos — back from reports, branch ALTA CITTA confirmed |

---

## Summary Scores (Manager Perspective)

| Dimension | Score | Key Issue |
|-----------|-------|-----------|
| Navigation speed | ★★★★☆ | 1-tap access is excellent; Shift modal blocks pre-service tasks |
| Context retention | ★★☆☆☆ | Delivery form data lost on any navigation away |
| Branch clarity | ★★★★★ | LocationBanner on every page, double-attributed in Reports |
| Data density (X-Read) | ★★★★★ | All critical KPIs above fold, no scroll needed |
| Urgency indicators | ★★☆☆☆ | Low Stock 0 badge in inventory, but nothing in sidebar navigation |
| Quick actions | ★★★★☆ | 7 quick actions work; blocked by shift modal; ?action=open is powerful |
| Form UX (delivery/waste) | ★★★☆☆ | No typeahead on item select; no current-stock hint in waste form |

