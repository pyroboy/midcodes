# User Scenarios — Manager @ All Retail Locations (2026-03-07)

## Role Context

- **Accessible routes:** `/pos`, `/kitchen/orders`, `/kitchen/all-orders`, `/kitchen/weigh-station`, `/stock/inventory`, `/stock/deliveries`, `/stock/transfers`, `/stock/counts`, `/stock/waste`, `/reports/eod`, `/reports/x-read`, `/reports/sales-summary`, `/reports/best-sellers`, `/reports/profit-gross`, `/reports/profit-net`, `/reports/peak-hours`, `/reports/voids-discounts`, `/reports/expenses-daily`, `/reports/expenses-monthly`, `/reports/table-sales`, `/reports/meat-report`
- **Location scope:** Free switch between `tag` (Alta Citta), `pgl` (Alona Beach), and `all` (aggregate view)
- **Location switching:** Free — can switch at any time via LocationBanner
- **Manager PIN required for:** Void approval, all discounts (service recovery, comp, PWD, senior citizen), pax change after seating, waste log finalization, AYCE timer cancellation, refunds/reversals
- **Cannot do:** Access `/admin/*` (Users, Menu Editor, Audit Logs, Floor Editor, Devices) — owner/admin only
- **Manager PIN:** `1234` (single hardcoded PIN — not per-user)

---

## Scenarios

---

### SC-1: Morning Login & Location Selection

**Situation:** It's 9:45 AM. The manager arrives at Alta Citta before the lunch rush. They need to check yesterday's numbers before the floor opens.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Opens WTFPOS on the office tablet, sees the login screen at `/`
2. Taps the "Manager" role card
3. Enters PIN `1234` in the PIN modal
4. Redirected to `/pos` — LocationBanner shows "Alta Citta (Tagbilaran)"
5. Confirms location is correct; navigates to `/reports/eod` to begin morning review

**Expected system behavior:** Session persists with `role: manager`, `locationId: tag`, `isLocked: false`. LocationBanner reflects the selected branch immediately.
**Edge cases:** Manager accidentally selects wrong branch → taps "Change" in LocationBanner → LocationSelectorModal → corrects it
**Success criteria:** LocationBanner shows correct branch; all 4 route groups accessible (POS, Kitchen, Stock, Reports)
**Failure criteria:** No PIN modal for manager role; session defaults to staff; location cannot be changed after login

---

### SC-2: Morning EOD Review — Verifying Last Night's Z-Read

**Situation:** The manager needs to verify that last night's cashier correctly ran the Z-Read before going home, and that the reported totals match the bank deposit envelope left in the safe.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/reports/eod`
2. Selects yesterday's date
3. The Z-Read shows: Cash ₱38,200 | GCash ₱14,100 | Maya ₱6,800 | Total ₱59,100
4. Checks the physical bank deposit envelope left in the safe: ₱38,200 cash matches ✓
5. Scans the Voids & Discounts section: 2 comps and 1 service recovery on a Thursday — flags this for follow-up
6. If Z-Read for yesterday is missing entirely: the previous cashier forgot to close the shift — today's sales will stack on top unless corrected

**What a Z-Read is:** The Z-Read (End-of-Day report) permanently closes the shift and resets the sales counter to zero. It is a legal BIR document in the Philippines. A missing Z-Read means yesterday's sales are now mixed with today's — a BIR violation.
**Expected system behavior:** EOD report shows the most recent Z-Read by default, filtered by `locationId: tag`. If no Z-Read ran yesterday, system shows a warning or blank state with the date gap visible.
**Edge cases:** Z-Read was run at 2 AM after midnight (last table paid late) — the date shown is technically today, not yesterday. Manager must interpret correctly.
**Success criteria:** Z-Read shows accurate payment breakdown for the correct location and date; manager can identify any discrepancy vs. physical cash
**Failure criteria:** Report shows wrong location; yesterday's Z-Read is not accessible; no indication if Z-Read was skipped

---

### SC-3: Z-Read Not Run — Previous Shift Left Open

**Situation:** Manager checks the EOD report and discovers there is no Z-Read for yesterday. The previous cashier finished at 11 PM and forgot to close the shift before logging out.
**Actor:** Manager @ Alta Citta (tag) — morning, before first transaction today
**Journey:**
1. Checks `/reports/eod` — yesterday's date shows no Z-Read record
2. This means: last night's sales are still in the current open shift; today's sales will be mixed in
3. Manager must run a late Z-Read immediately, before the first transaction of the day
4. Navigates to `/reports/eod` → initiates Z-Read → the report closes the previous day's sales
5. The record now shows yesterday's date (or the time of running — depends on system logic)
6. Manager takes a photo of the Z-Read report for BIR records (if no printer is available)
7. Calls the cashier who forgot, documents the incident

**What could go wrong without this:** If the manager doesn't catch it and the first customer pays at 10 AM, that payment is now part of "yesterday's" unclosed shift — the EOD when finally run will show both days' revenue as one record. BIR audit will flag this.
**Expected system behavior:** System should warn when a shift has been open for more than 24 hours without a Z-Read. Ideally shows a dashboard warning on login or on the EOD page.
**Edge cases:** Manager runs the late Z-Read but already has 2 transactions from today in the open shift → those 2 transactions are now also in the "yesterday" Z-Read. Manager must document this manually.
**Success criteria:** Late Z-Read runs and closes the previous shift correctly; new transactions start accumulating in the new shift
**Failure criteria:** No system warning that Z-Read was not run; manager discovers this only when BIR asks; system allows running Z-Read mid-day with no warning

---

### SC-4: X-Read Mid-Shift Cash Audit

**Situation:** It's 4:00 PM. The manager suspects the cash drawer may be short after noticing a cashier being unusually generous with change. They want to audit without stopping service.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/reports/x-read`
2. X-Read shows running cash total since last Z-Read: ₱18,750
3. Manager quietly counts the physical drawer: ₱17,920 — short by ₱830
4. Does NOT close the shift — service continues without interruption
5. Manager documents the discrepancy, confronts the cashier privately before the evening rush
6. Runs another X-Read at 9 PM to check if the gap widened (further theft) or corrected (initial counting error)

**What an X-Read is:** A mid-shift snapshot of all sales so far — does NOT close the shift, does NOT reset counters. Can be run any number of times. Not a BIR document but the primary anti-theft tool for a manager.
**Expected system behavior:** X-Read shows live-running cash total for the current shift, filtered by `locationId: tag`. Running the report has zero effect on ongoing transactions.
**Edge cases:** Transaction is mid-processing when manager pulls the X-Read → report should show only committed transactions; the in-flight one should not appear
**Success criteria:** X-Read amount is accurate to the last completed transaction; drawing can be counted against it; shift remains open
**Failure criteria:** X-Read shows ₱0 or yesterday's data; running X-Read accidentally closes the shift; data is not filtered by current location

---

### SC-5: Pre-Service Stock Check

**Situation:** 10:30 AM, 30 minutes before lunch opening. Manager does a quick stock check to confirm enough meat is available for an expected 80-cover lunch.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/stock/inventory`
2. LocationBanner confirms `tag` — only Alta Citta's inventory shown
3. Reviews quantities: Pork Belly 4.2 kg, Premium Beef 1.8 kg, Chicken 3.0 kg
4. Premium Beef at 1.8 kg is critical for 80 covers — flags it
5. Calls the warehouse, then creates a transfer request in `/stock/transfers` for 3 kg Wagyu from `wh-tag` to `tag`
6. Opens floor for service, monitoring the beef level throughout lunch

**Expected system behavior:** Inventory filtered by `locationId: tag`. Low-stock visual indicators if quantities fall below configured thresholds.
**Edge cases:** Manager accidentally on `pgl` view — sees Panglao inventory, not Alta Citta. LocationBanner is the only safeguard.
**Success criteria:** Correct branch inventory shown instantly; manager can act before the rush starts
**Failure criteria:** Inventory shows wrong branch; no visual low-stock indicator; transfer request cannot be created from inventory view

---

### SC-6: Receiving a Supplier Delivery

**Situation:** 8:30 AM. A 20 kg pork belly delivery arrives from the supplier. The driver needs confirmation and the stock must be logged before kitchen prep begins.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/stock/deliveries` → "New Delivery"
2. Selects supplier, enters: Pork Belly 20 kg, delivery date: today
3. Confirms — delivery logged with `locationId: tag`, `receivedBy: manager`, `receivedAt: timestamp`
4. Inventory auto-increments: Pork Belly + 20 kg at `tag`
5. Navigates to `/stock/inventory` to confirm the updated total
6. Notes in the delivery record: "2 kg was frozen solid, may affect yield"

**Expected system behavior:** Delivery record written to RxDB with correct `locationId`. Inventory updated atomically after save. Audit log entry created.
**Edge cases:** Partial delivery — driver brings 15 kg of 20 kg ordered. Manager logs 15 kg and notes the shortage. Supplier must be followed up separately.
**Success criteria:** Inventory shows updated quantity; delivery visible in history; `updatedAt` is current
**Failure criteria:** Delivery saved but inventory unchanged; delivery logged under wrong location; no remarks field for notes

---

### SC-7: BIR Inspector Walks In Mid-Service

**Situation:** It's 7:30 PM Friday — the busiest dinner rush of the week. A BIR (Bureau of Internal Revenue) inspector walks in, shows their ID, and requests: (1) Z-Read records for the past 30 days, (2) today's official receipts, (3) VAT breakdown.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Manager is paged by the cashier: "There's a BIR inspector at the entrance"
2. Manager approaches calmly, confirms the inspector's credentials
3. On the office tablet, navigates to `/reports/eod`
4. Attempts to pull up Z-Read history for the past 30 days — selects different dates one by one
5. Inspector asks for a printed or exported copy of the daily sales summary
6. Manager checks if the system can export or print a Z-Read for any past date
7. Inspector also asks for the VAT amount on the current day's sales (the shift is still open)
8. Manager navigates to X-Read to pull the running total and calculates VAT (12% of net sales)
9. Inspector is satisfied with the documentation — leaves after 20 minutes
10. Manager returns to the floor; service barely interrupted

**What could go wrong:** If any past Z-Read was not run (missing date), the inspector will immediately flag this as a BIR violation. If the system cannot retrieve historical Z-Reads by date, the manager cannot comply. If VAT is not broken out on the X-Read, the manager must calculate manually on the spot — an error under pressure.
**Expected system behavior:** `/reports/eod` allows selecting any past date and displaying that day's Z-Read. VAT breakdown (gross, VAT-able, VAT amount, net) shown on both X-Read and Z-Read. Historical Z-Read records are never deleted.
**Edge cases:** A day is missing from Z-Read history because the cashier forgot — manager must acknowledge the gap to the inspector and commit to correcting the process. The inspector may issue a notice of non-compliance.
**Success criteria:** Manager can retrieve any of the past 30 Z-Reads in under 2 minutes; VAT is pre-calculated and displayed; inspector is satisfied
**Failure criteria:** System can only show today's EOD; no historical Z-Read lookup; VAT must be manually calculated; inspector finds missing dates

---

### SC-8: Staff Rage Quit Mid-Rush

**Situation:** It's 7:00 PM Saturday — peak service. The cashier has a heated argument with the manager over break scheduling. The cashier walks out, leaving the POS unattended. 16 active tables. 4 tables waiting for their bill.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Cashier abruptly logs out of their session (or walks away leaving it open)
2. Manager takes over the POS tablet immediately
3. Surveys the floor: 16 tables active; 4 tables have requested the bill (customers waiting)
4. If cashier left session open: manager must log out the cashier's session and log in as manager — or continue on the cashier's session if the role is equivalent
5. Prioritizes the 4 bill-requesting tables — processes checkout for each
6. Continues managing floor while also handling new seating and orders
7. Calls in a replacement cashier (outside the system)
8. After rush: reviews audit log to see what the cashier had done on their session
9. Checks for any incomplete voids, unapproved discounts, or open tables the cashier may have misconfigured before leaving

**System impact:** There is no "force logout another user" feature. If the cashier left the session open on a shared device, another person can act under their identity. If the device is personal, the session is inaccessible until the device is retrieved.
**Expected system behavior:** All active tables remain visible and operable by any logged-in manager. No order data is lost when a user logs out. Audit log records which user performed each action.
**Edge cases:** The rage-quit cashier also has the only working printer plugged into their tablet → receipts cannot be printed until the device is retrieved; customers must accept digital confirmation only
**Success criteria:** Manager can immediately take over all 16 active tables with no data loss; bill processing continues uninterrupted
**Failure criteria:** Active orders are tied to the cashier's session and inaccessible; manager must re-enter order details manually; tables show as "closed" after cashier logout

---

### SC-9: Cashier Exits Without Closing Tables

**Situation:** The 6 PM–11 PM cashier finishes their shift at 11:05 PM and logs out. They forgot that Table 7 is still active — the customers are still eating and haven't asked for the bill.
**Actor:** Manager @ Alta Citta (tag), discovering this during final rounds before closing
**Journey:**
1. Manager does a final walkthrough at 11:15 PM and finds Table 7 still occupied
2. Opens `/pos` — Table 7 shows as active, order is visible, AYCE timer has 12 minutes remaining
3. The previous cashier's session is gone — but the order is still in the system (RxDB persistence)
4. Manager processes the table: waits for the timer to expire, then opens checkout
5. Table 7 pays and exits at 11:32 PM
6. Manager can now run the Z-Read and close the shift
7. Notes the incident: outgoing cashier should not log out while tables are active

**Expected system behavior:** Open tables and their orders persist regardless of which user logged them in. Any authenticated manager can access and close any active table at the same location.
**Edge cases:** AYCE timer expired while the cashier was logging out — system should have already locked the table's order; manager just needs to process checkout
**Success criteria:** Manager sees the active table immediately; full order history visible; checkout processes normally
**Failure criteria:** Table 7 appears closed or blank after cashier logout; order history lost; manager must reconstruct the order from memory

---

### SC-10: Staff No-Show — Understaffed Friday Rush

**Situation:** Friday 5:45 PM. Two of three scheduled cashiers call in sick. One cashier is present. Manager must cover the floor themselves during the busiest night of the week.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Manager logs in as manager; takes over half the floor themselves
2. Manager and 1 cashier split 20 tables between them
3. A void is needed on Table 12 — manager is the requester and the only manager on-site
4. Manager enters their own PIN to approve their own void (conflict of interest — no system check)
5. Service continues; manager fields questions from 3 tables simultaneously
6. At 8 PM, manager calls the owner to inform them of the staffing situation
7. Owner remotely monitors via the all-locations view
8. At 11 PM, manager runs the EOD alone — no second person to verify the cash count

**System gap:** The system has no mechanism to detect or flag that a manager approved their own sensitive operation (void, discount). In an understaffed night, this is a real accountability gap.
**Expected system behavior:** System operates normally; single manager can handle all table operations. All approvals still go through PIN gate regardless of whether the manager is both parties.
**Edge cases:** Cash drawer is short at EOD — with no second person to verify, there's no accountability chain. Manager documents it manually.
**Success criteria:** System continues to work for a single operator; no multi-user dependencies for core operations
**Failure criteria:** System requires a second authenticated user for PIN approvals; or manager cannot access their own void approval

---

### SC-11: Wrong Role Login — Kitchen Staff on POS

**Situation:** Kitchen prep cook logs in at the start of their shift but accidentally taps "Staff" instead of "Kitchen" on the login screen. They land on `/pos` instead of `/kitchen/orders`.
**Actor:** Kitchen staff (logged in as `staff` by mistake) + Manager discovering it
**Journey:**
1. Cook is confused by the floor plan view on `/pos` and starts tapping tables trying to find the KDS
2. KDS is receiving tickets but no one is watching or bumping them — kitchen is effectively blind
3. 15 minutes into service, food stops coming out — cashier notices and radios the manager
4. Manager checks `/kitchen/orders` — tickets piling up, none bumped
5. Manager walks to the kitchen — finds the cook operating the POS instead of the KDS
6. Cook logs out of `staff` session, goes back to `/`, logs in with "Kitchen" role card
7. Cook is now on `/kitchen/orders` — begins bumping the backed-up tickets

**System gap:** The login screen's role cards must be clearly differentiated. A cook who just woke up and started a shift should not be able to accidentally end up on the wrong interface.
**Expected system behavior:** Role cards clearly labeled with icons and descriptions. Kitchen role redirects to `/kitchen/orders`, not `/pos`. Session role is persistent and visible somewhere on-screen.
**Edge cases:** The cook placed a test order on `/pos` before being discovered — a real table now has a ghost order from the kitchen role; manager must void it
**Success criteria:** Clear role differentiation at login; re-login takes under 60 seconds; no data is corrupted by the incorrect session
**Failure criteria:** Role cards look identical; cook can create POS orders under a kitchen session; KDS blackout lasts 20+ minutes undetected

---

### SC-12: Approving a Cashier's Void (PIN Gate)

**Situation:** Lunch rush. Cashier accidentally added 4 extra Wagyu Plates to Table 9 (fat-fingered the quantity). Kitchen hasn't started prep yet. Cashier cannot remove items without manager approval.
**Actor:** Manager @ Alta Citta (tag) — called over by cashier
**Journey:**
1. Cashier selects Table 9 → opens the void/edit modal
2. Modal shows: "Void requires Manager PIN"
3. Manager walks over, enters `1234`
4. 4 Wagyu Plates removed from order
5. Audit log records: `void`, `actor: manager`, `tableId: T9`, `qty: 4`, `timestamp`
6. KDS reflects the removal — kitchen does not prep the 4 extra plates

**Expected system behavior:** PIN gate fires before any void is committed. Audit log entry written with manager identity. KDS updated immediately.
**Edge cases:** Kitchen already bumped the ticket and started prepping → manager must also call kitchen verbally; void in system doesn't recall food already being prepared
**Success criteria:** Order corrected; void logged with manager name; kitchen queue updated; no ₱0 Wagyu plates on the receipt
**Failure criteria:** Void possible without PIN; audit log not written; KDS not updated after void

---

### SC-13: Service Recovery Discount — PIN Gate

**Situation:** Table 14 waited 50 minutes for their first refill. Customers are visibly upset. Manager decides to apply a 20% Service Recovery discount to retain the relationship.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Opens Table 14 checkout on `/pos`
2. Taps "Add Discount" → selects "Service Recovery"
3. System prompts for Manager PIN before applying
4. Manager enters `1234` → 20% applied to the total bill
5. Discount logged as `service_recovery` so the owner can distinguish it from fraud in the voids report
6. Customer is apologized to; bill reduced from ₱2,400 to ₱1,920

**Expected system behavior:** PIN gate fires before any discount is committed. Discount type stored on order. Voids/discounts report shows `service_recovery` code with manager identity.
**Edge cases:** Manager applies the discount but the table continues eating — the discount applies to the bill at the moment of application; additional items ordered afterward are at full price
**Success criteria:** Bill reduced by exactly 20%; discount labeled correctly in reports; manager identity captured
**Failure criteria:** Discount applied without PIN; discount type stored as generic "discount"; manager identity not recorded

---

### SC-14: PWD / Senior Citizen Discount Compliance

**Situation:** A table of 4 includes one Senior Citizen (60+). Philippine law mandates a 20% discount for Senior Citizens and exemption from VAT. The cashier asks the manager to apply it.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Customer presents their Senior Citizen ID at checkout
2. Cashier opens checkout modal → selects "Senior Citizen Discount"
3. System prompts for Manager PIN
4. Manager enters `1234` → 20% discount applied to the senior citizen's portion of the bill
5. The 20% is applied pro-rata to the senior citizen's share (not the full table)
6. VAT is also adjusted — SC discounts are VAT-exempt on the discounted amount
7. Receipt must show: original amount, SC discount, VAT adjustment, final amount payable
8. The SC discount record is available in the voids/discounts report for BIR compliance

**What happens if manager skips this:** BIR can fine the establishment for not honoring mandated discounts. The senior citizen can report the restaurant. This is not optional.
**Expected system behavior:** SC discount type available in checkout. PIN required. Pro-rata calculation if discount applies to one person out of a group. VAT recalculated. Receipt shows all deductions.
**Edge cases:** The entire table is Senior Citizens → 20% off the full bill, full VAT exemption. System must handle the group case.
**Success criteria:** Discount calculated correctly per person; VAT adjusted; receipt shows BIR-compliant breakdown
**Failure criteria:** No SC/PWD discount option; PIN not required; VAT not adjusted; receipt shows no SC discount line

---

### SC-15: Waste Log Approval Mid-Rush (PIN Gate)

**Situation:** 7:15 PM. A prep cook drops a tray of 6 beef portions (600g) on the kitchen floor. They need to log and discard it immediately. Kitchen staff creates the waste entry but manager must approve.
**Actor:** Kitchen staff creates → Manager approves @ Alta Citta (tag)
**Journey:**
1. Kitchen staff navigates to `/stock/waste` → creates entry: "Premium Beef — 600g — Accidental Spill"
2. Entry in "Pending Approval" state — inventory not yet decremented
3. Kitchen staff gets manager's attention (walkie, shout, text)
4. Manager enters PIN `1234` on the waste entry — 2 taps: view pending, enter PIN
5. Waste finalized; 600g deducted from `tag` inventory; audit log records both actors

**Critical time constraint:** This approval must happen in under 90 seconds during a rush. If the flow requires 3+ navigation steps, the manager will wave it off and the waste goes unlogged — inventory accuracy degrades.
**Expected system behavior:** Pending waste entries visible immediately in `/stock/waste`. Manager approval is a single PIN entry. Inventory decremented at the correct branch.
**Edge cases:** Manager is currently on `pgl` view when approving → waste must still decrement `tag` inventory (the item's `locationId` is authoritative, not the manager's current session locationId)
**Success criteria:** Waste approved and logged in under 90 seconds; inventory updated at correct branch; two-actor audit trail
**Failure criteria:** Kitchen staff can finalize waste without manager; manager must navigate 3+ screens; wrong branch inventory decremented

---

### SC-16: Switching to Panglao to Investigate a Discrepancy

**Situation:** The Panglao branch manager calls — their GCash totals seem off and they want a second pair of eyes. The manager at Alta Citta switches to the Panglao view to check remotely.
**Actor:** Manager (currently `tag`, switching to `pgl`)
**Journey:**
1. Taps "Change" in LocationBanner → LocationSelectorModal
2. Selects "Alona Beach (Panglao)" → all views immediately re-filter to `pgl`
3. Navigates to `/reports/sales-summary` — now shows Panglao's data
4. Checks the GCash totals: ₱22,400 — checks the Panglao cashier's report: they claimed ₱19,800
5. Discrepancy of ₱2,600 — possible that a GCash transaction was missed in the cashier's manual count
6. Manager advises the Panglao team to recount and verify GCash app totals directly
7. Switches back to `tag` view to continue oversight of Alta Citta

**Expected system behavior:** Location switch is instantaneous. All reports, stock, and POS data re-filter to the new location. Switching does not navigate away from the current page (ideally — stays on `/reports/sales-summary` but now showing `pgl` data).
**Edge cases:** Manager forgets they're on `pgl` view and creates a stock entry — that entry gets `locationId: pgl` when intended for `tag`. LocationBanner must be visually prominent enough that the manager cannot miss which branch they're on.
**Success criteria:** Location switch takes under 2 seconds; data immediately reflects correct branch; LocationBanner clearly shows "Alona Beach"
**Failure criteria:** Page reload required to switch; data mixes both branches; LocationBanner ambiguous

---

### SC-17: Monitoring Both Branches During Friday Dinner Rush

**Situation:** The owner texts the manager: "How are both branches doing right now?" Manager switches to All Locations view to get a real-time overview.
**Actor:** Manager (locationId: all)
**Journey:**
1. Switches to "All Locations" via LocationBanner
2. Navigates to `/pos` — expects to see all active tables from both `tag` and `pgl`
3. Can see: Alta Citta 12 active tables, Panglao 8 active tables
4. Panglao has 2 tables where the AYCE timer has already expired but no payment has started
5. Manager calls Panglao branch to follow up on the 2 expired tables

**Expected system behavior:** `locationId = 'all'` shows aggregate table view. Table cards labeled by branch. Timer accuracy maintained across branches.
**Edge cases:** Manager in `all` view tries to open an order — system must require selecting a specific branch before allowing any write operation
**Success criteria:** Both branches' tables visible; branch labels clear; no accidental cross-branch order creation possible
**Failure criteria:** `all` view silently shows only one branch; manager creates an order that gets `locationId: all` (invalid)

---

### SC-18: Customer Refuses to Pay

**Situation:** Table 3 finishes their AYCE session. When the bill arrives (₱3,200 for 4 pax), one of the customers claims they were never told about the timer and refuses to pay. The argument escalates.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Cashier calls the manager over
2. Manager calmly explains the AYCE house rules and shows the table the entry time and timer on the system
3. Manager opens Table 3 on `/pos` — shows the customer: opened at 6:12 PM, current time 7:48 PM (96 minutes), 4 pax
4. Customer demands a discount. Manager assesses: legitimate complaint (the timer was not clearly communicated by staff) vs. bad faith
5. If legitimate: manager applies a 20% service recovery discount (PIN: `1234`)
6. If bad faith: manager holds firm, offers to call the owner (escalation)
7. Either way: the interaction is logged in the audit trail

**Expected system behavior:** Table detail shows open time, pax count, and timer clearly. Manager can show this to a customer as evidence. Service recovery discount available with PIN.
**Edge cases:** Customer physically refuses to leave → this is now a police matter, outside the system's scope. Manager documents the table as "dispute - unpaid" somehow.
**Success criteria:** Manager can demonstrate table history clearly on-screen in under 30 seconds; service recovery path available if warranted
**Failure criteria:** Table detail view not accessible after service ends; no open-time visible; manager has no system evidence to show the customer

---

### SC-19: Wrong Payment Method Recorded

**Situation:** A cashier processes a ₱2,400 bill as "Cash" but the customer actually paid via GCash. Caught immediately — before the customer leaves.
**Actor:** Manager @ Alta Citta (tag) — escalation
**Journey:**
1. Cashier panics and calls the manager
2. Manager looks for a "Correct Payment Method" option on the closed order
3. If the correction flow exists: manager enters PIN, selects GCash, order updated → EOD will be accurate
4. If no correction flow exists: manager manually notes the discrepancy on paper
5. EOD will show Cash ₱2,400 higher and GCash ₱2,400 lower than actual
6. During cash drawer count, the drawer will be ₱2,400 short of what the system says
7. Manager adds a manual adjustment note for the owner to reconcile

**System gap:** No payment correction flow currently exists. Every incorrect payment method creates a permanent EOD discrepancy that cascades into weekly/monthly reports.
**Expected system behavior:** PIN-gated payment method correction on a closed order, with audit trail. The correction updates the relevant payment totals without changing the revenue amount.
**Edge cases:** Customer has already left — cannot confirm GCash receipt. Manager must decide whether to correct based on the cashier's testimony alone.
**Success criteria:** Payment method corrected; EOD totals accurate; audit log shows who corrected it and when
**Failure criteria:** No correction possible; manager must manually adjust the reconciliation outside the system; EOD totals are permanently wrong

---

### SC-20: Power Blip — Mid-Transaction Recovery

**Situation:** A brief power interruption (3 seconds) causes the POS tablet to restart while a cashier was mid-checkout on Table 8 (payment modal was open, GCash payment was being processed).
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Power comes back; tablets reboot in ~45 seconds
2. Manager opens WTFPOS on the main POS tablet
3. RxDB restores from IndexedDB — all 11 active tables are visible
4. Table 8 shows as still "active" (payment was not completed before the crash)
5. Manager checks with the cashier: was GCash actually charged on the customer's phone?
6. If GCash was charged: manager processes checkout manually confirming the GCash payment
7. If GCash was not charged: manager sends the customer a new GCash QR and re-processes
8. Table 8 is closed; the order is complete

**Expected system behavior:** RxDB is transactional — a mid-checkout crash before the order was marked "paid" leaves the order in "active" state. On restore, Table 8 is still active and fully recoverable.
**Edge cases:** Two tablets were open on Table 8 — both recover from their local IndexedDB. If one had a partial write, the two devices may disagree on the order state (Phase 1 single-device limitation).
**Success criteria:** After reboot, all 11 tables restore within 60 seconds; Table 8 shows correct order state; checkout can be re-initiated
**Failure criteria:** All orders lost on power loss; Table 8 shows as closed when payment was never received; manager must reconstruct 11 orders manually

---

### SC-21: AYCE Timer Abuse — Table Gaming the System

**Situation:** Table 6 (8 college students) has ordered 28 plates of Pork Belly in 60 minutes. Their 90-minute window closes in 30 minutes. They're firing a new order every 4 minutes trying to stockpile.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Kitchen calls manager: "Table 6 is destroying us, they're ordering every 3 minutes"
2. Manager checks `/kitchen/all-orders` — Table 6 has 6 pending tickets in the queue simultaneously
3. Manager walks to Table 6, explains the house policy: food is for consuming during the session, not stockpiling
4. If the table cooperates: manager allows service to continue normally until timer expires
5. If the table continues: manager can cancel the remaining AYCE time (requires PIN)
6. Timer cancellation logs: table billed for what was consumed, session ends immediately
7. Table is flagged in the order history for future reference

**Expected system behavior:** All-orders view shows per-table order frequency. Manager can cancel AYCE timer with PIN. Cancellation closes the ordering window; table proceeds to checkout for what was already served.
**Edge cases:** Kitchen has already prepared 3 of the 6 pending plates before the timer is cancelled — those must still be served (food is already made). Only future orders are blocked.
**Success criteria:** Manager can identify the abusive table in under 30 seconds; timer cancellation works with PIN; kitchen queue stops receiving new Table 6 orders
**Failure criteria:** No per-table order view in all-orders; timer cannot be cancelled; manager has no system tools to manage the situation

---

### SC-22: Marking an Item as Sold Out (86'ing) Mid-Rush

**Situation:** 6:45 PM. Kitchen realizes the last Wagyu portion just went out. The walk-in is empty for Wagyu. New orders must be blocked immediately — customers keep ordering it because it's still available on the POS.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Kitchen calls/radios manager: "Wagyu is 86'd"
2. Manager navigates to find the availability toggle — either in `/stock/inventory` (item → edit → toggle `isAvailable: false`) or a dedicated 86 button
3. Wagyu is toggled off for `locationId: tag` only (Panglao's Wagyu is unaffected)
4. POS order builder immediately grays out Wagyu — cashier can no longer add it to new orders
5. Existing orders with Wagyu (already confirmed before 86) remain in the KDS queue — kitchen serves them
6. When restocked tomorrow morning, manager (or kitchen) toggles `isAvailable: true`

**Expected system behavior:** `MenuItem.isAvailable` toggle is accessible to manager without requiring admin access. Change is immediate and location-scoped. POS reacts reactively (no page reload required).
**Edge cases:** Cashier is mid-order when the 86 happens — if Wagyu was already added to the cart, what happens? System should allow completing the current order (already committed) but block new additions.
**Success criteria:** Wagyu grayed out on POS within seconds; Panglao unaffected; kitchen queue unchanged for existing Wagyu tickets
**Failure criteria:** Manager cannot access the availability toggle (admin-only); change affects both branches; POS doesn't react without a reload

---

### SC-23: Physical Stock Count — Weekly Audit

**Situation:** Sunday 2:00 PM before dinner rush. Manager and one kitchen staff do a weekly physical count to verify theoretical inventory matches reality.
**Actor:** Manager @ Alta Citta (tag) with kitchen staff
**Journey:**
1. Navigates to `/stock/counts` → initiates a new count for `tag`
2. Goes through the walk-in freezer with a tablet: enters actual quantities for each item
3. Pork Belly: 6.5 kg actual (system shows 6.9 kg theoretical) → 400g variance
4. Premium Beef: 2.1 kg actual (system shows 2.1 kg theoretical) → 0 variance
5. Submits the count — variance report generated
6. 400g Pork Belly variance flagged: possible unlogged waste, portioning discrepancy, or theft
7. Manager investigates waste logs for the past week — finds 2 unlogged waste events
8. Corrects the waste log retroactively; notes the kitchen team needs to improve waste logging discipline

**Expected system behavior:** Stock count creates a snapshot with `conductedBy` and `conductedAt`. Variance calculated vs. last theoretical value. Count results accessible historically.
**Edge cases:** Count conducted mid-service (items being consumed while counting) — manager timestamps the count and notes it was conducted during active service; variance may be slightly off due to concurrent consumption
**Success criteria:** Variance shown clearly per item; historical counts accessible; manager can trace variance to specific operational gaps
**Failure criteria:** Count doesn't show variance; no historical count records; system resets theoretical to actual (destroying the variance data)

---

### SC-24: Inter-Branch Stock Transfer

**Situation:** Panglao is critically low on Pork Belly before Friday dinner (1.5 kg remaining). Alta Citta has excess (10 kg). Manager arranges an emergency transfer.
**Actor:** Manager @ tag, creating transfer to `pgl`
**Journey:**
1. Navigates to `/stock/transfers` → "New Transfer"
2. From: Alta Citta (`tag`), To: Alona Beach (`pgl`), Item: Pork Belly, Qty: 4 kg
3. Submits → transfer status: "Pending / In Transit"
4. Alta Citta's Pork Belly immediately shows as reserved or decremented (pending transfer)
5. A driver takes the meat to Panglao
6. Panglao kitchen staff (or manager) confirms receipt on their device → transfer status: "Received"
7. Panglao inventory increments by 4 kg; Alta Citta inventory is finalized as decremented

**Expected system behavior:** Transfer has a status lifecycle: created → in-transit → received. Both sides update correctly on confirmation. Neither side shows inflated inventory during transit.
**Edge cases:** Transfer is never confirmed (driver keeps the meat, delivery fails) → manager must cancel the transfer to restore Alta Citta's inventory
**Success criteria:** Correct inventory on both sides after confirmation; transfer history visible; cancellation restores source inventory
**Failure criteria:** Transfer created but no inventory change on either side; no status lifecycle; no way to cancel a pending transfer

---

### SC-25: Expense Recording — Cash Petty Cash Out

**Situation:** A water delivery arrives at Alta Citta. The delivery fee is ₱350 cash — pulled from the POS drawer. This must be recorded so the EOD cash reconciliation is accurate.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Pays the delivery: ₱350 cash from the drawer
2. Navigates to `/expenses` (or `/reports/expenses-daily`) to log the expense
3. Creates entry: "Water delivery — ₱350 — Cash — today's date"
4. This expense is deducted from the expected cash total for the EOD
5. When running the Z-Read: Cash drawer expected = Sales Cash − Expenses Cash
6. Without logging this: the EOD will show the drawer is short by ₱350 → appears as a discrepancy

**What the system does with this data:** Expense recording feeds into `/reports/profit-net` (net profit = gross profit − operating expenses). Without expense recording, net profit figures are inflated.
**Expected system behavior:** Expense form available to manager. Expense records have `locationId`, `amount`, `category`, `paymentMethod`, `date`. EOD reconciliation acknowledges logged expenses.
**Edge cases:** Manager records the expense in the wrong branch view — the ₱350 deduction goes to `pgl` instead of `tag`, making both branches' reconciliations wrong
**Success criteria:** Expense logged at correct branch; EOD accounts for it; net profit report reflects the cost
**Failure criteria:** Expense route is a Phase 3 stub (currently the case); manager cannot log cash-outs; EOD drawer reconciliation will always show a "short" when petty cash is used

---

### SC-26: Analyzing Meat Yield After Delivery

**Situation:** Monday morning. 15 kg of Pork Belly was received Friday. After butchering, only 11.2 kg of usable portions remained (74.7% yield). Manager wants to confirm if this is normal or if the new supplier is sending low-quality cuts.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/reports/meat-report`
2. Selects date range: the past week
3. Report shows: Pork Belly received 15 kg, usable yield 11.2 kg (74.7%), waste 3.8 kg
4. Compares to previous week: yield was 82% with the old supplier
5. Significant drop → manager contacts the supplier to flag quality concerns
6. Also checks waste log to ensure the 3.8 kg waste was all logged (no missing waste entries)

**Expected system behavior:** Meat report calculates yield from delivery records vs. inventory consumed. Shows per-item yield percentages for any date range, filtered by `locationId`.
**Edge cases:** Some waste was not logged (unknown reason) — the meat report will show 15 kg received but inventory shows 9 kg remaining → unaccounted 2.2 kg. System should flag unexplained variance.
**Success criteria:** Yield percentage calculated accurately; manager can identify supplier quality trends; waste gap visible
**Failure criteria:** Meat report shows only raw totals with no yield calculation; no variance flagging; no date range filter

---

### SC-27: Running End-of-Day Z-Read and Cash Reconciliation

**Situation:** 11:30 PM. The last table (Table 2) just paid. All tables are closed. Manager runs the Z-Read, counts the drawer, and closes the branch for the night.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Confirms all tables on `/pos` are closed — floor plan shows zero active tables
2. Navigates to `/reports/eod` → initiates Z-Read
3. System calculates and closes the shift: Cash ₱38,200 | GCash ₱14,100 | Maya ₱6,800 | Expenses ₱1,200 | Total net: ₱57,900
4. Manager physically counts the cash drawer: ₱37,000 — short by ₱1,200
5. Recalls: ₱1,200 in petty cash expenses were paid today — but were they logged? Checks `/reports/expenses-daily`
6. Expenses logged: ₱1,200 total → actual drawer: ₱37,000 + ₱1,200 expenses paid out = ₱38,200 ✓ matches
7. Z-Read record saved; drawer balanced; manager secures the cash and leaves

**What a Z-Read must show for BIR:** OR number range, gross sales, VAT breakdown, SC/PWD discounts, payment method split, net taxable sales.
**Expected system behavior:** Z-Read runs only when all tables are closed (or warns if open tables exist). Expenses deducted from expected cash total. Z-Read record is immutable after running.
**Edge cases:** Manager tries to run Z-Read while Table 5 is still "active" (customer bathroom break, not paying yet) → system should warn: "1 table still open"
**Success criteria:** Z-Read accurate to last transaction; expenses reflected in cash expected; record immutable; BIR fields present
**Failure criteria:** Z-Read runs with open tables; no expense deduction from cash expected; Z-Read record editable after the fact

---

### SC-28: Health Inspector Visits — Traceability of Meat

**Situation:** A Department of Health (DOH) or food safety inspector visits and asks: "Where did this pork belly come from, when was it received, and how was it stored?" They want traceability documentation.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Inspector shows credentials and requests meat traceability records
2. Manager navigates to `/stock/deliveries`
3. Pulls up the most recent Pork Belly delivery: 20 kg received Monday, supplier: "XYZ Farms", date: 2026-03-02
4. Shows the inspector: supplier name, delivery date, received quantity, received by (manager name)
5. Inspector also asks about storage temperatures — this is a physical log (thermometer readings) not in the system
6. Inspector is satisfied with the delivery traceability; the physical temperature log passes separately

**Expected system behavior:** Delivery records are accessible by date and item. Each record shows: supplier (if stored), item, quantity, `receivedAt`, `receivedBy`, `locationId`. Historical records are never deleted.
**Edge cases:** Supplier name was not entered during the delivery log (the field was optional and skipped) → manager has no supplier data to show the inspector; must reference paper invoices
**Success criteria:** Delivery record pulled up in under 2 minutes; shows all relevant traceability fields; inspector can verify the chain
**Failure criteria:** Delivery records only show quantity and date; no supplier field; historical records not searchable; manager must find paper invoices instead

---

### SC-29: Cashier Accidentally Closes a Table Early

**Situation:** A cashier processes checkout for Table 11 but the customer was actually at Table 12. Table 11 is now marked as paid and closed, but Table 11 customers are still eating — they haven't paid.
**Actor:** Manager @ Alta Citta (tag) — escalation
**Journey:**
1. Table 11 customers call the cashier over: "We haven't paid yet but you've already cleared our table on the screen"
2. Cashier escalates to manager
3. Manager needs to: (a) find the payment that was wrongly applied, (b) reopen Table 11, (c) re-associate the order
4. Checks the closed orders for the last 15 minutes — finds a payment for "Table 11" at ₱2,800
5. The correct table (Table 12) was paid correctly; the wrong table (Table 11) was also "paid" but no money exchanged
6. Manager needs to void or reverse the erroneous payment on Table 11 and reopen it
7. Table 11 customers order dessert, then pay correctly when done

**Expected system behavior:** Manager can view recently closed orders. Can void/reopen a closed table order with PIN. The incorrect "payment" can be reversed.
**Edge cases:** If the cashier processed the wrong payment AND received cash from Table 12 instead of Table 11, the money is in the drawer but attributed to the wrong table — this is an accounting discrepancy.
**Success criteria:** Manager can reopen a wrongly-closed table; incorrect payment reversed; no revenue lost; audit trail shows the correction
**Failure criteria:** Closed tables cannot be reopened; manager cannot reverse a completed payment; the closed order is permanently gone

---

### SC-30: Reviewing Void and Discount Logs for Theft Patterns

**Situation:** Monday morning. The owner texts the manager: "I saw a lot of voids last Saturday — can you tell me if anything looks suspicious?" Manager reviews the void/discount log.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/reports/voids-discounts`
2. Filters to last Saturday
3. Sees: 7 voids, 3 service recovery discounts, 2 comps
4. Reviews each void: which cashier, which item, which table, what time, what reason
5. Notices: 3 voids all by the same cashier, all between 8 PM–9 PM, all for the same item (Premium Beef)
6. Pattern: the cashier may have been voiding items that customers already paid for (cash pocket theft)
7. Manager escalates to the owner and pulls the audit log entries for those 3 voids

**Expected system behavior:** Voids/discounts report shows: cashier name (or actor), item, table, time, reason, discount type. Filterable by date and cashier. Individual void entries link to the full order.
**Edge cases:** The cashier used a generic "Staff" login (not named) — the audit trail shows only "staff" as the actor, not identifying which individual performed the void
**Success criteria:** Manager can identify suspicious patterns in under 10 minutes; each void attributed to a specific actor; full order context accessible per void
**Failure criteria:** Report shows void totals only, no per-void detail; actor is anonymous; no way to cross-reference with specific table transactions

---

### SC-31: Kitchen Weigh Station — Meat Portion Logging

**Situation:** Tuesday morning butcher prep. The kitchen staff uses the Bluetooth scale to weigh and log portioned pork belly before service.
**Actor:** Kitchen staff @ Alta Citta (tag) at `/kitchen/weigh-station`
**Journey:**
1. Navigates to `/kitchen/weigh-station`
2. Scale connects via Bluetooth (if available; otherwise manual weight entry)
3. Places 200g pork belly portion on scale → reading: 198g
4. Logs the portion: "Pork Belly — 198g — Portioned for service"
5. Repeats for 40 portions throughout the morning prep
6. Logged portions feed into the theoretical inventory consumption tracking

**Expected system behavior:** Weigh station reads Bluetooth scale weight. Scale reading shown in real-time. Portion log entry created per weigh. Entries are `locationId`-scoped.
**Edge cases:** Bluetooth scale disconnects mid-session → weigh station should allow manual weight entry as fallback. Scale reconnects → should resume Bluetooth reading automatically.
**Success criteria:** Scale reading shown within 2 seconds of placing item; portion logged accurately; fallback to manual entry if scale unavailable
**Failure criteria:** Scale connection fails and no manual fallback; portions cannot be logged; weigh station page crashes on Bluetooth error

---

### SC-32: Peak Hours Analysis — Planning Next Week's Roster

**Situation:** Manager needs to plan next week's staff schedule. They want to know which days and times are busiest at Alta Citta so they can roster more cashiers during peak demand.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Navigates to `/reports/peak-hours`
2. Selects the past 2 weeks as the date range
3. Report shows: Friday 6 PM–9 PM is the busiest period (avg. 18 tables simultaneously). Saturday 7 PM–9 PM is second busiest.
4. Lunch hours (11 AM–1 PM) are moderate — about 10 tables average.
5. Manager schedules 3 cashiers for Friday and Saturday dinner, 2 for weekday lunch
6. Shares the report screenshot with the owner for approval

**Expected system behavior:** Peak hours report shows hourly/daily table count or transaction volume heatmap, filtered by `locationId`. Date range selectable. Data is based on completed orders only.
**Edge cases:** A special event inflated one Friday's numbers (private booking of 30 pax) → the peak hours may show that Friday as an outlier. Manager should be able to identify outliers or exclude them.
**Success criteria:** Clear hourly breakdown showing which times are busiest; manager can make staffing decisions directly from the data
**Failure criteria:** Report shows only aggregate totals with no hourly breakdown; data not filterable by location; no way to distinguish weekday vs. weekend patterns

---

### SC-33: Shift Handover — Outgoing Manager Briefs Incoming Manager

**Situation:** The morning manager's shift ends at 5 PM. The evening manager arrives at 4:45 PM for a briefing before the dinner rush begins.
**Actor:** Outgoing Manager → Incoming Manager @ Alta Citta (tag)
**Journey:**
1. Outgoing manager opens WTFPOS and walks the incoming manager through the current state:
   - Active tables: 4 (Tables 1, 5, 9, 14 — all in the 60–75 minute range)
   - 86'd items: Wagyu (marked unavailable this morning, not restocked yet)
   - Pending waste approval: 1 entry (300g chicken, logged by kitchen at 3 PM, not yet approved)
   - Cash drawer: ₱12,400 (X-Read confirmed at 4:30 PM)
   - Notes: The supplier called — tomorrow's Pork Belly delivery will be delayed by 2 hours
2. Incoming manager reviews each point on the system
3. Outgoing manager logs out — incoming manager logs in
4. Service continues seamlessly

**System acts as the single source of truth:** Everything the outgoing manager said should be verifiable in the system. The incoming manager must not have to take the outgoing manager's word for any operational fact.
**Expected system behavior:** `/pos` shows 4 active tables with accurate timers. 86'd status visible on menu items. Pending waste entry visible in `/stock/waste`. X-Read shows ₱12,400.
**Edge cases:** Outgoing manager forgets to mention a pending void approval that's been waiting for 45 minutes — incoming manager discovers it only when a cashier asks why their void is stuck
**Success criteria:** All shift state verifiable in-system within 5 minutes; no verbal-only knowledge required for handover
**Failure criteria:** Active tables not visible to newly logged-in manager; 86 status not visible on POS; pending waste entries not surfaced on login

---

### SC-34: New Staff First Day — Wrong Location Assigned

**Situation:** A new cashier starts their first day at Alta Citta. The owner created their account remotely but accidentally set their default location to `pgl` (Panglao). The new cashier logs in and sees Panglao's floor plan with Panglao's tables.
**Actor:** New cashier (staff role, locked location) + Manager discovering the issue
**Journey:**
1. New cashier logs in at Alta Citta, sees the floor plan — it looks wrong (different table layout from what they were shown during training)
2. Cashier tells the manager: "The tables don't look right"
3. Manager checks the LocationBanner on the cashier's tablet: shows "Alona Beach (Panglao)"
4. The staff role has `isLocked: true` — the cashier cannot switch locations themselves
5. Manager cannot fix this from the current session (would need to go to `/admin/users` — admin only)
6. Manager calls the owner to correct the account's default location
7. Meanwhile: the new cashier uses a generic "Staff" login that's correctly set to `tag`

**System gap:** A staff member with the wrong `locationId` locked in sees data from the wrong branch and cannot self-correct. Only an admin can change their account's default location. This is a real first-day setup risk.
**Expected system behavior:** Staff role's `locationId` is set during account creation in `/admin/users`. Once locked, only an admin can change it. The system should make the assigned location clear on the staff's login screen.
**Edge cases:** The new cashier unknowingly processes orders for Panglao tables while physically at Alta Citta — those orders go to the Panglao KDS (if cross-branch KDS were possible), confusing the Panglao kitchen
**Success criteria:** LocationBanner immediately shows the wrong location; manager identifies the issue quickly; a workaround (generic login) is available
**Failure criteria:** Staff role doesn't show their locked location clearly; manager has no way to identify the wrong assignment without admin access; no workaround while the owner fixes the account

---

### SC-35: Receipts — Customer Requests Official Receipt

**Situation:** A corporate customer (company purchasing a team dinner) asks for an Official Receipt (OR) for reimbursement, complete with the business's TIN and VAT breakdown.
**Actor:** Manager @ Alta Citta (tag)
**Journey:**
1. Table checkout is complete — ₱8,400 total
2. Customer asks: "Can I get an OR with your TIN for my company reimbursement?"
3. Manager checks if the receipt printed automatically includes: Business name, address, TIN, OR number, VAT breakdown (VAT-able amount, 12% VAT, net amount)
4. If the receipt is BIR-compliant: hands it over — done
5. If the receipt is a simplified receipt (no TIN/VAT breakdown): manager cannot produce an OR from the system without the proper configuration

**BIR context:** In the Philippines, all businesses must issue Official Receipts (ORs) for every transaction. The OR must contain: seller's name, TIN, address, OR serial number, date, description of goods/services, amount, and VAT breakdown. A non-compliant receipt is a BIR violation.
**Expected system behavior:** Printed receipts include all required BIR fields. OR number increments sequentially and never repeats. VAT breakdown (gross, VAT, net) shown on every receipt.
**Edge cases:** Printer is offline — customer wants the receipt emailed or shown on screen. System should display the OR digitally even if the printer is unavailable.
**Success criteria:** Receipt contains all required BIR fields; OR number sequential; customer satisfied with the OR for reimbursement
**Failure criteria:** Receipt is a simplified slip with no TIN, OR number, or VAT breakdown; manager cannot produce a BIR-compliant OR; corporate customer cannot get reimbursement
