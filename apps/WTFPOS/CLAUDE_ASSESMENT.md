# WTFPOS — Scenario Viability Assessment

**Assessed against:** `CLAUDE.md` (current app capabilities, as of March 2026)
**Source scenarios:** `USER_SCENARIOS.md` (85 scenarios across 16 role categories)
**Data state:** All data is mock/in-memory via Svelte 5 `$state` runes — no backend or database connected.

---

## Assessment Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | **FULLY SUPPORTED** — App can handle this scenario completely |
| ⚠️ | **PARTIALLY SUPPORTED** — App has some functionality but gaps exist |
| ❌ | **NOT SUPPORTED** — App cannot handle this scenario |

---

## Summary Stats

| Support Level | Count |
|--------------|-------|
| ✅ FULLY SUPPORTED | 18 |
| ⚠️ PARTIALLY SUPPORTED | 20 |
| ❌ NOT SUPPORTED | 47 |

---

## 1. The Manager / Owner

**Role goal:** Oversee operations, prevent theft, analyze profitability, and ensure everything runs smoothly.

---

### Scenario 1: Morning Review & Analytics
**Viability: ⚠️ PARTIALLY SUPPORTED**

The app has a full Reporting Suite at `routes/reports/` with 11 report tabs including an EOD report (`reports/eod/`), and `reports.svelte.ts` provides mock report data. Payment method breakdowns (Cash, GCash, Maya) are tracked in `pos.svelte.ts`. However, a dedicated **Void & Discount Log** is not among the 11 report tabs (which are: sales-summary, best-sellers, peak-hours, eod, meat-variance, table-sales, expenses-daily, expenses-monthly, profit-gross, profit-net, branch-comparison). The audit log at `admin/logs/` exists but is a general action log, not a filtered void/discount report. Remote access from home/laptop is not supported — there is no cloud backend, so data only exists in-memory on the local session.

---

### Scenario 2: Menu & Pricing Updates
**Viability: ❌ NOT SUPPORTED**

No Menu Editor route or component exists in the project structure. Menu items are defined as static mock data in `pos.svelte.ts`. There is no UI to create, edit, or delete menu items or their prices. Real-time sync across terminals is also impossible with the current in-memory architecture (no backend, no database).

---

### Scenario 3: Floor Layout Changes (Admin Floor Editor)
**Viability: ❌ NOT SUPPORTED**

The floor plan at `routes/floor/+page.svelte` is a display-only view — there is no drag-and-drop Admin Floor Editor. Tables are defined as static mock data in `pos.svelte.ts` (the `Table` type in `types.ts`). There is no table grouping, renaming, or layout persistence feature. No admin route for floor editing exists.

---

### Scenario 4: Multi-Branch Monitoring
**Viability: ⚠️ PARTIALLY SUPPORTED**

The branch selector in `TopBar.svelte` supports an `all` branch option for the owner role, and `session.svelte.ts` enforces branch switching for elevated roles (owner, admin, manager). However, because all data is in-memory with no real-time backend sync, switching to "All Branches" mode does not actually show live simultaneous data from both branches — it only filters local mock data. A true bird's-eye view of both branches at once with live revenue and table states requires a backend, which doesn't yet exist.

---

### Scenario 5: Recording Operational Expenses
**Viability: ⚠️ PARTIALLY SUPPORTED**

An Expense tracker page exists at `routes/expenses/+page.svelte`. Expense data is in `reports.svelte.ts` (expenses-daily, expenses-monthly reports). However, the specific petty cash drawer integration — logging a "Cash Out" that automatically adjusts the End-Of-Day register float — is not documented as an implemented feature. It's unclear whether the expenses page supports cash float adjustments or is simply a ledger entry form.

---

### Scenario 6: Staff Accountability & Payroll Logging
**Viability: ⚠️ PARTIALLY SUPPORTED**

The audit log at `admin/logs/` records actions with timestamps via `audit.svelte.ts`. However, there is no dedicated staff performance report among the 11 report tabs. Tracking which cashier PIN processed which order, identifying high void rates per employee, or displaying server upsell metrics are not documented features. The audit log is a general action log, not a staff performance analytics tool.

---

### Scenario 7: VIP & Comping Meals (100% Owner Comp Discount)
**Viability: ❌ NOT SUPPORTED**

The only discount types explicitly documented in `CLAUDE.md` are **Senior Citizen (20%)** and **PWD (20%)**. There is no "Owner Comp" discount type or any mechanism for a 100% bill waiver. The Manager PIN (`1234`) guards sensitive operations, but no comp/comping workflow is described. The audit log would also need to specifically log which manager authorized a comp, which is not described as a feature.

---

## 2. The Store Manager (Floor Operations)

**Role goal:** Keep daily shifts running flawlessly, resolve customer disputes, audit the cash floor, and manage staff on duty.

---

### Scenario 8: Spot-Checking the Cash Drawer Mid-Shift (X-Read)
**Viability: ⚠️ PARTIALLY SUPPORTED**

BIR compliance features including X-Readings are mentioned in `CLAUDE.md` under "Philippine-Specific Context." The concept exists at the compliance layer. However, there is no documented UI workflow for triggering an X-Read (mid-shift audit), displaying the expected cash total, or facilitating a physical drawer count comparison. The feature is acknowledged as a requirement but no route or component is described for it.

---

### Scenario 9: Resolving a Customer Allergy Panic (Global Search + Allergen Info)
**Viability: ❌ NOT SUPPORTED**

No Global Search feature exists in the application. Menu item types in `types.ts` include `MenuItem` but no allergen or ingredient breakdown fields are documented. There is no UI for displaying ingredient compositions. The `CLAUDE.md` structure describes no allergen management system anywhere in the routes or components.

---

### Scenario 10: Server Reassignment / Shift Handover
**Viability: ❌ NOT SUPPORTED**

No server/waiter assignment to tables is tracked in the current data model. The `Table` type in `types.ts` does not include an assigned server field as a documented feature. There is no "Reassign Server" action on the floor plan. Staff accountability is tracked through the audit log, not through per-table server ownership.

---

### Scenario 11: Approving a Legitimate Void (PIN Modal)
**Viability: ⚠️ PARTIALLY SUPPORTED**

The Manager PIN (`1234`) is explicitly documented for "sensitive operations (cancellations, pax changes, refunds)" in `CLAUDE.md`. This confirms the PIN-gated void approval concept exists. However, the specific UX — a Cashier calling the Manager over to a popup modal that targets individual line items for quantity reduction — is not explicitly documented. The exact flow (which roles can trigger voids, which items can be targeted) is ambiguous beyond the PIN requirement.

---

### Scenario 12: Hardware Failure / Cloud-Native Recovery
**Viability: ❌ NOT SUPPORTED**

The app explicitly uses in-memory `$state` runes with **no backend or database**. All data is session-local and would be entirely lost if the device crashes, restarts, or loses power. Cloud-state locking, cross-device session recovery, and instant data repopulation on a backup device are architecturally impossible with the current stack.

---

### Scenario 13: Issuing a Service Recovery Discount
**Viability: ❌ NOT SUPPORTED**

Only Senior Citizen and PWD discount types are documented. There is no discount code system, no "Service Recovery" discount category, and no mechanism for the POS to tag a discount with a specific reason code (e.g., kitchen delay vs. comping vs. promotional). Without reason codes, the owner cannot distinguish why profits took a hit on any given night from the discount data alone.

---

## 3. The Butcher / Kitchen Prep

**Role goal:** Accurately record the breakdown of raw meats into serveable portions while minimizing unrecorded waste.

> **Note:** The USER_SCENARIOS.md document contains a numbering error — Butcher scenarios are labeled Scenario 8–14, overlapping with Store Manager's Scenario 8–13. These are distinct scenarios assessed below.

---

### Scenario 8 (Butcher): Receiving and Yielding a Beef Slab
**Viability: ⚠️ PARTIALLY SUPPORTED**

The `ReceiveDelivery.svelte` component exists for logging received stock, and `WasteLog.svelte` exists for recording waste/trimmings. However, the specific yield calculation workflow — logging 10kg received, then breaking down into 7kg usable + 2kg bones + 1kg waste with automatic yield % calculation — is not documented as a feature. The system can record receiving and waste separately, but the multi-category breakdown and yield percentage computation are not described.

---

### Scenario 9 (Butcher): Waste Logging
**Viability: ✅ FULLY SUPPORTED**

`WasteLog.svelte` is an explicit component in `src/lib/components/stock/WasteLog.svelte`, accessible via `routes/stock/waste/+page.svelte`. The Manager PIN requirement for finalizing waste deductions aligns with the documented "sensitive operations require PIN `1234`" pattern in `CLAUDE.md`. This scenario is a core use case of the Stock module.

---

### Scenario 10 (Butcher): Fulfilling KDS Orders
**Viability: ✅ FULLY SUPPORTED**

`routes/kds/+page.svelte` is a dedicated KDS page. KDS tickets are explicitly grouped into three categories: **meats / dishes & drinks / side requests** — directly matching the Butcher's workflow of seeing "Table 5: Premium Beef x4." Bumping (marking items done) is standard KDS functionality. The `KdsTicket` type in `types.ts` supports this model.

---

### Scenario 11 (Butcher): Special Dietary Instructions / Ticket Remarks
**Viability: ⚠️ PARTIALLY SUPPORTED**

The KDS at `routes/kds/+page.svelte` displays ticket cards. However, the `KdsTicket` type fields and whether cashier-entered remarks/allergy notes appear on KDS tickets are not documented in `CLAUDE.md`. The KDS exists and groups tickets, but a dedicated remark/allergen annotation system on KDS tickets is not confirmed as implemented.

---

### Scenario 12 (Butcher): 86'ing (Marking Sold Out) Items
**Viability: ❌ NOT SUPPORTED**

No 86'ing feature is described anywhere in `CLAUDE.md`. There is no mechanism for Kitchen staff to mark a menu item as sold out from the KDS, nor for that status to automatically gray out the item on Cashier POS terminals. Stock inventory tracking exists (`stock.svelte.ts`), but automatic cascading availability changes based on physical depletion are not implemented.

---

### Scenario 13 (Butcher): Recovering an Accidentally Bumped Ticket (KDS Recall)
**Viability: ❌ NOT SUPPORTED**

No KDS Recall/History tab is mentioned in `CLAUDE.md`. The KDS at `routes/kds/+page.svelte` is described but no undo/recall functionality for bumped tickets is documented. Once a ticket is bumped, there is no described way to restore it to the active queue.

---

### Scenario 14 (Butcher): Network Offline Mode
**Viability: ❌ NOT SUPPORTED**

The app has no offline mode architecture. With no backend at all (purely in-memory), the concept of "offline mode" and seamless reconnection with order backfilling does not apply. There is no service worker, local storage sync, or queue-and-flush mechanism described.

---

## 4. The Stock / Inventory Assigned (Stock Controller)

**Role goal:** Ensure the restaurant never runs out of crucial ingredients and supplies.

---

### Scenario 15: Receiving Daily Deliveries
**Viability: ✅ FULLY SUPPORTED**

`ReceiveDelivery.svelte` is an explicit component at `src/lib/components/stock/ReceiveDelivery.svelte`, accessible via `routes/stock/receive/+page.svelte`. This is a core feature of the Stock module specifically designed for this workflow. Stock state is managed in `stock.svelte.ts`.

---

### Scenario 16: Low Stock Alerts During Service
**Viability: ⚠️ PARTIALLY SUPPORTED**

Inventory is tracked in `stock.svelte.ts` with the `InventoryTable.svelte` component. Stock levels can be viewed. However, no automatic low-stock alert or notification system is documented — no thresholds, no warning banners, no push notifications when stock drops below a minimum level. A Stock Controller must actively navigate to the inventory page to check; the system does not proactively surface low stock warnings.

---

### Scenario 17: Inter-Branch Stock Transfers
**Viability: ❌ NOT SUPPORTED**

No inter-branch stock transfer feature exists. The stock module handles inventory for a single branch context. There is no "Outgoing Transfer" or "Receive Transfer" workflow described, and with in-memory data there is no cross-branch data sharing possible anyway.

---

### Scenario 18: Month-End Physical Inventory Audit
**Viability: ⚠️ PARTIALLY SUPPORTED**

`StockCounts.svelte` exists for timed stock counts at `routes/stock/counts/+page.svelte`, supporting the 10am/4pm/10pm count schedule. This demonstrates a count-entry workflow. However, a month-end override count (where a physical count overrides the system's running total) and an automated variance report (showing system expected vs. physical actual with discrepancies highlighted) are not explicitly documented as features.

---

## 5. The Cashier / Front of House

**Role goal:** Process customers quickly, manage table statuses, and handle payments without calculation errors.

---

### Scenario 19: Seating a Walk-in Group
**Viability: ✅ FULLY SUPPORTED**

`routes/floor/+page.svelte` with `TableCard.svelte` provides the floor plan. Table status management (available → occupied), pax entry, and package selection are core features of `pos.svelte.ts`. The KDS integration for sending setup tickets is also part of the core system. This is the primary use case the floor module was built for.

---

### Scenario 20: Processing Takeout & Delivery
**Viability: ❌ NOT SUPPORTED**

No Takeout Lane or delivery order type is described in `CLAUDE.md`. The register page (`routes/register/+page.svelte`) redirects to `/floor` per project memory notes. There is no "New Takeout" button, no blue-bordered takeout lane, and no takeout order lifecycle (new → in-progress → ready for pickup) documented anywhere in the routes or components.

---

### Scenario 21: Split Check Processing (Partial Payments)
**Viability: ⚠️ PARTIALLY SUPPORTED**

The app supports three payment methods: Cash, GCash, and Maya (from `CLAUDE.md` Philippine-Specific Context). Multiple payment methods exist. However, a specific **split payment workflow** — processing a partial payment toward one method and continuing the remainder to another — is not documented. The payment logic in `pos.svelte.ts` exists but whether it supports staged/partial tender entry is not described.

---

### Scenario 22: Adding A-la-carte Mid-Meal
**Viability: ✅ FULLY SUPPORTED**

This is a core POS workflow. Tapping an active table and adding items to its running bill is the fundamental register operation. The `pos.svelte.ts` store manages table orders and menu items. The KDS integration fires new tickets when items are added. This is explicitly what the floor/register system is built to do.

---

### Scenario 23: Handling Unhappy Customer Adjustments (Void + Free Substitute)
**Viability: ⚠️ PARTIALLY SUPPORTED**

The Manager PIN (`1234`) is documented for "cancellations" as a sensitive operation. A manager can void items gated behind the PIN. However, the specific workflow of voiding a specific item off a bill and then adding a substitute at 100% discount (free) is not fully described — the void part is partially supported, but a 100% item-level discount type is not documented (only SC/PWD discounts are).

---

### Scenario 24: Table Transfer
**Viability: ❌ NOT SUPPORTED**

No Table Transfer feature is described in `CLAUDE.md`. There is no "Transfer Table" button, no workflow for porting active timers, items, and bill state from one table to another. The `Table` type in `types.ts` does not include transfer logic in the documented architecture.

---

### Scenario 25: Mid-Meal Package Upgrade
**Viability: ❌ NOT SUPPORTED**

No package upgrade or downgrade logic is documented. There is no "Override Package" action on active tables, no price difference calculation per pax, and no timer restart/keep prompt. Package selection appears to be a one-time action at seating with no modification workflow.

---

### Scenario 26: Leftover Surcharge (Anti-Waste Penalty)
**Viability: ❌ NOT SUPPORTED**

No leftover penalty or food waste fee system is described in `CLAUDE.md`. There is no "Leftover Penalty" charge type, no weight-based fee calculator, and no mechanism for appending a surcharge to a bill for waste rule violations.

---

### Scenario 27: Adding a Late Joiner (Pax Adjustment Mid-Meal)
**Viability: ❌ NOT SUPPORTED**

While the Manager PIN covers "pax changes" as a sensitive operation, the specific workflow — tapping a pax count to increment it, appending the new diner's package price, and preserving the existing group's countdown timer — is not documented as an implemented feature. The PIN requirement is noted but the actual pax-adjustment workflow isn't described.

---

### Scenario 28: Customer Walkout / Unpaid Tab (Write-Off)
**Viability: ❌ NOT SUPPORTED**

No "Write Off - Runner/Walkout" feature is described. There is no mechanism for a Manager to force-close a table stuck in billing status due to a walkout while correctly categorizing the revenue loss as shrinkage rather than a void.

---

### Scenario 29: Delayed GCash/Maya Payment Hold State
**Viability: ❌ NOT SUPPORTED**

No "Pending Payment" hold state for tables is documented. Payment processing in `pos.svelte.ts` appears to be a completed transaction model. A partial hold that flags the table as orange/billing-pending while awaiting SMS confirmation is not described.

---

## 6. The Host / Receptionist

**Role goal:** Manage waitlists, seat guests evenly, and calculate turnover times to maximize daily seating count.

---

### Scenario 30: Managing the Waitlist Queue
**Viability: ⚠️ PARTIALLY SUPPORTED**

The floor plan displays countdown timers via `formatCountdown()` in `utils.ts` and `TableCard.svelte`, allowing a Host to visually gauge which tables are finishing soon. Sorting by "Time Remaining" is conceptually derivable from this data. However, there is no dedicated **Waitlist** feature — no way to add a waiting group (name, pax count, estimated wait time) to a queue, no queue management screen, and no Host-specific interface.

---

### Scenario 31: Coordinating with Bussers for Immediate Seating
**Viability: ✅ FULLY SUPPORTED**

The table status lifecycle (Occupied → Billing → Available) is a core feature of the floor plan system. Tables transition to Available (white) upon checkout. This is foundational to the floor workflow.

---

### Scenario 32: Broken Grill / Out-of-Order Table
**Viability: ❌ NOT SUPPORTED**

No "Out of Order" table status is documented. The table statuses described in the app are the standard lifecycle states (available, occupied, billing, dirty). A maintenance/out-of-order state with a wrench icon is not part of the current `Table` type or floor plan component.

---

## 7. The Waiter / Server

**Role goal:** Refill side dishes, assist customers with grilling, and rapidly input mid-meal requests.

---

### Scenario 33: Mid-Meal Drink Up-sells (Mobile Ordering Pad)
**Viability: ❌ NOT SUPPORTED**

No server-facing mobile ordering interface is described in `CLAUDE.md`. All order entry goes through the Cashier at the floor plan/register. There is no "ordering pad" view or role-specific interface for servers/waiters to directly fire orders to the KDS or bar station without going through the Cashier terminal.

---

### Scenario 34: Responding to System "Time-Up" Cues
**Viability: ✅ FULLY SUPPORTED**

This is a core feature. `formatCountdown()` in `utils.ts`, `TableCard.svelte`, and the floor plan all implement the countdown timer system. Table icons change color based on time remaining (Yellow at ~15 minutes, Red when expired). This is explicitly designed to cue staff for last-call reminders.

---

### Scenario 35: Changing Charcoal / Grills
**Viability: ✅ FULLY SUPPORTED**

This is a purely physical operational process with no POS interaction required. The system does not need to support this; it is handled by staff manually. No software changes or features are needed.

---

### Scenario 36: Waiter Processing Customer Breakage Fee
**Viability: ❌ NOT SUPPORTED**

No "Breakage Fee" or fast-add custom charge feature is described. There is no mechanism for quickly appending a fee line item (e.g., "Breakage Fee - Drinkware") to a table's running bill. Custom or ad-hoc charges cannot be added outside of the menu item catalog.

---

## 8. The Expediter (Food Checker)

**Role goal:** Connect the kitchen to servers, ensuring precisely correct plates go to the exact table.

---

### Scenario 37: Ensuring Meat Quality Before Serving (KDS Bump)
**Viability: ✅ FULLY SUPPORTED**

The KDS at `routes/kds/+page.svelte` provides the expediter's interface. Tickets are grouped by category (meats / dishes & drinks / side requests), allowing the expediter to see which tables need which items. Bumping to clear tickets is standard KDS functionality explicitly built into the system.

---

### Scenario 38: Handling VIP Expedites (Priority Flagging)
**Viability: ❌ NOT SUPPORTED**

No VIP or Priority flag on KDS tickets is described. The KDS displays tickets but has no urgency/priority tier system, no "VIP" star, and no mechanism for manually elevating a specific ticket above others in the queue.

---

### Scenario 39: Kitchen Refusals / 86-Item Broadcast
**Viability: ❌ NOT SUPPORTED**

No 86-item broadcast from the KDS is documented. There is no mechanism for the Expediter or Kitchen to push a "sold-out" alert that simultaneously grays out an item across all POS terminals. This requires both a broadcast system and dynamic menu item availability toggling — neither is implemented.

---

## 9. The Busser / Dishwasher

**Role goal:** Clear plates rapidly to increase table turnover rate and manage the large flow of raw meat platters safely.

---

### Scenario 40: Clearing "Dirty" Status Tables
**Viability: ✅ FULLY SUPPORTED**

The table dirty/clean lifecycle is core to the floor plan system. When a table finishes checkout, it transitions to a Table Clean Timer. The "Mark as Clean" action returns it to Available (white). This is a fundamental part of the `pos.svelte.ts` table state management and `TableCard.svelte` display.

---

### Scenario 41: Clearing Excess Plates Mid-Meal
**Viability: ✅ FULLY SUPPORTED**

This is a purely physical process — a busser clearing plates from an active table — with no POS interaction required. The software does not need to support this action. No feature gaps exist for this scenario.

---

## 10. The Barista / Drinks Station

**Role goal:** Serve iced drinks, alcoholic beverages, and blended shakes without bottlenecking the meat kitchen.

---

### Scenario 42: Fulfilling Drink/Bar Tickets
**Viability: ⚠️ PARTIALLY SUPPORTED**

The KDS at `routes/kds/+page.svelte` routes orders into three groups: **meats / dishes & drinks / side requests**. Drink orders would appear in the "dishes & drinks" category on the KDS. However, no dedicated **Barista/Bar Station screen** is described — there is only a single KDS view. A barista would see all categories, not a filtered bar-only queue.

---

### Scenario 43: Automatic Stock Deduction from Recipes (Mixer Components)
**Viability: ❌ NOT SUPPORTED**

No recipe/bill-of-materials system is implemented. The app does not track what raw ingredients compose a menu item. Stock in `stock.svelte.ts` tracks inventory at the item level, but there is no "Melon Soju Yakult = 1 Yakult + 1 Soju + 50ml Melon Syrup" mapping. Manual stock deduction per order does not cascade to component ingredients.

---

### Scenario 44: Power Outage / Battery-Backed Printer
**Viability: ❌ NOT SUPPORTED**

No hardware integration (printers, cash drawers, receipt buffers) is described in `CLAUDE.md`. There is no offline printing buffer, no battery-backed hardware support, and no printer API integration of any kind in the current tech stack.

---

## 11. The Customer

**Role goal:** Enjoy the food, experience fast service, and have clear expectations about wait times and limits.

---

### Scenario 45: Arrival and Waiting (Accurate Wait Time Estimate)
**Viability: ✅ FULLY SUPPORTED**

The floor plan shows all table states (occupied, billing, dirty) and countdown timers allow accurate wait time estimates. A Host can visually identify tables approaching billing and give precise estimates. This is a direct benefit of the core timer system.

---

### Scenario 46: The Unli Time Limit Experience
**Viability: ✅ FULLY SUPPORTED**

The countdown timer system with color-coded warnings is a foundational feature: `formatCountdown()` in `utils.ts`, `TableCard.svelte` with yellow and red status thresholds, and the floor plan at `routes/floor/+page.svelte`. The table's visual state change at 15 minutes (yellow) and at expiry (red) directly enables this server cue workflow.

---

### Scenario 47: Pre-ordering Takeaway Over the Phone
**Viability: ❌ NOT SUPPORTED**

No takeaway order system exists. There is no phone order intake, no takeout lane with staged completion tracking, and no kitchen-delay timer for pre-orders. This requires a complete takeout order module that is absent from the current architecture.

---

### Scenario 48: Table State Transparency
**Viability: ✅ FULLY SUPPORTED**

Table states are clearly tracked and displayed on the floor plan. The Host's tablet (same POS floor view) clearly communicates which tables are occupied vs. available, preventing confusion for waiting customers.

---

### Scenario 49: Senior Citizen / PWD Split Group Discount Calculations
**Viability: ✅ FULLY SUPPORTED**

Senior Citizen (20%) and PWD (20%) discounts are explicitly documented in `CLAUDE.md` under "Philippine-Specific Context," including **pro-rata application for AYCE** (all-you-can-eat packages). VAT exemption handling is also mentioned. Applying these discounts to a subset of a group's pax count is a described feature of the payment logic in `pos.svelte.ts`.

---

### Scenario 50: Customer Refuses Breakage/Leftover Surcharge (Manager Waiver)
**Viability: ❌ NOT SUPPORTED**

The underlying surcharges (breakage fees, leftover penalties) do not exist as features (as assessed in Scenarios 26 and 36). Since the surcharges cannot be added, the manager waiver workflow for removing them is also unsupported.

---

### Scenario 51: Requesting Change of Meat Variety Post-Order (Exchange/Return)
**Viability: ❌ NOT SUPPORTED**

No "Exchange" function for already-bumped KDS items is described. There is no workflow for logging a quality return/waste on a served item and firing a priority replacement ticket to the KDS. This requires both a reverse-inventory action and a KDS priority insertion — neither is implemented.

---

## 12. Complex Edge Cases & System Stressors

**Goal:** Define how the system handles the absolute worst-case operational complexities unique to K-BBQ environments.

---

### Scenario 52: The "Mixed Table" (Unli + Kids Free + Ala-Carte Same Table)
**Viability: ❌ NOT SUPPORTED**

The current table model in `pos.svelte.ts` operates at the table level, not the per-seat level. There is no per-seat package assignment, no "Kids Free (Under 4ft)" package type, no ala-carte-only seat flag, and no mixed-mode KDS portion restriction logic. This scenario requires a fundamentally different table/seat data model.

---

### Scenario 53: Central Warehouse to Branch Meat Transfer (With Transit State)
**Viability: ❌ NOT SUPPORTED**

No central commissary or warehouse concept exists in the app. The Stock module (`stock.svelte.ts`) is branch-scoped. There is no "In Transit" limbo state, no bulk transfer workflow, no transit shrinkage tracking, and with in-memory data there is no cross-branch data communication possible.

---

### Scenario 54: Device Crash Mid-Payment (Cloud State Recovery)
**Viability: ❌ NOT SUPPORTED**

The app has no backend, no persistent storage, and no cloud state. If the device crashes mid-payment, all session data is lost. There is no "Processing Payment - Awaiting Print" recovery state, no cross-device session handoff, and no "Recover & Reprint" workflow. This is architecturally impossible with the current in-memory design.

---

### Scenario 55: LPG / Gas Exhaustion — Bulk 86'ing a Kitchen Station
**Viability: ❌ NOT SUPPORTED**

No kitchen station grouping or bulk-disable feature exists. There is no "Disable Kitchen Station - Hot Prep (Gas)" control in the KDS settings. Items cannot be dynamically grouped by station type, nor can an entire category be toggled unavailable from a single action.

---

### Scenario 56: The "Sneaky Saver" — Mid-Meal Package Downgrade Block
**Viability: ❌ NOT SUPPORTED**

Package modification is not supported at all (as noted in Scenario 25). There is no package downgrade attempt flow, no "items already served" check, and no system lock that prevents downgrading after premium items have been marked as served on the KDS.

---

### Scenario 57: Employee Walkout — Emergency Suspend Shift
**Viability: ❌ NOT SUPPORTED**

No emergency shift suspension feature exists in the Admin panel (`admin/users/+page.svelte`). There is no "Suspend Shift" action, no automatic table ownership transfer, and no impromptu Z-Read triggered by a specific employee's suspension. This is an advanced HR/audit workflow far beyond current capabilities.

---

## 13. Hyper-Specific Operational Scenarios

**Goal:** Address nuanced, day-to-day granular interactions for real-world operational flexibility.

---

### Scenario 58: "Pay By Item" Split Checkout (Drag-and-Drop)
**Viability: ❌ NOT SUPPORTED**

No "Split Bill → By Item" feature with a drag-and-drop UI is described. Payment processing in `pos.svelte.ts` appears to operate on the full bill total. There is no mechanism for assigning specific line items to individual sub-receipts or splitting the remainder evenly across guests.

---

### Scenario 59: Waiter Dropped Food — Shrinkage + Refire
**Viability: ❌ NOT SUPPORTED**

No "Mark as Dropped/Spoiled" action on KDS history items exists. There is no way to retroactively flag a bumped item as undelivered, re-add it to the active KDS queue with a `*REFIRE*` tag, and simultaneously log it in the waste report. This requires KDS history access and refire logic — neither is described.

---

### Scenario 60: Take-Home Raw Inventory (Retail Item Sale)
**Viability: ❌ NOT SUPPORTED**

No "Retail Item" sale type exists. There is no way to add a retail product to a dine-in table's bill with different tax treatment (no service charge, VAT-standard) and KDS bypass. The current menu system does not differentiate between dine-in items and retail items.

---

### Scenario 61: The "Dine & Dash" Partial Recovery
**Viability: ❌ NOT SUPPORTED**

No partial write-off feature exists. There is no "Write-Off → Partial Walkout" action that accepts a partial payment, closes the table state, and separately logs the remaining balance as shrinkage. An unpaid table would be stuck in billing status with no described resolution path.

---

### Scenario 62: Correcting a Tender Mistake (Edit Cash Tendered Amount)
**Viability: ❌ NOT SUPPORTED**

No post-transaction tender amount correction is described. Once a payment is finalized in `pos.svelte.ts`, there is no "Receipt History → Edit Tender Amount" workflow for a Manager to correct a mis-typed cash tender and automatically adjust the EOD cash expectations.

---

### Scenario 63: Processing a Historical Refund (Next Day Complaint)
**Viability: ❌ NOT SUPPORTED**

No historical refund workflow exists. The audit log at `admin/logs/` contains action records but there is no "Audit / Global Search" with receipt lookup by ticket ID or barcode. Issuing a "Cash Out" against a prior day's closed shift and printing a negative receipt are not described features. Cross-session data access is also architecturally impossible with in-memory storage.

---

### Scenario 64: Staff Meals (Internal Consumption Tracking)
**Viability: ❌ NOT SUPPORTED**

No "Charge to Staff/Internal" order type exists. There is no reserved "STAFF MEAL" table concept, no ₱0 revenue transaction type that still deducts from inventory, and no internal consumption category that separates staff meals from customer sales in reporting.

---

### Scenario 65: Auto-Gratuity for Large Groups
**Viability: ❌ NOT SUPPORTED**

No automatic gratuity detection based on pax count threshold is described. The payment system does not apply an automatic service charge line item for groups over 10 pax, nor does it distribute gratuity proportionally across split bills.

---

### Scenario 66: The "Bring Your Own Bottle" (Corkage Fee)
**Viability: ❌ NOT SUPPORTED**

No fast-add corkage fee item type exists. There is no "Add Fast Item → Corkage Fee" action on the table ticket. Custom or ad-hoc fee items cannot be added outside the standard menu item catalog. Server accountability logging per table (for corkage enforcement) is also not described.

---

## 14. System Resilience, Loyalty, and Accounting Anomalies

**Goal:** Prove the platform handles complex taxation, customer loyalty, and aggressive hardware faults dynamically.

---

### Scenario 67: Zero-Rated VAT (Diplomat / PEZA Exemption)
**Viability: ❌ NOT SUPPORTED**

Only standard 12% VAT and the Senior Citizen/PWD 20% discount (with VAT exemption) are documented. There is no "Zero-Rated VAT" tax exemption type for diplomats or PEZA-registered entities. Dynamic VATable vs. Zero-Rated sale classification and proper BIR accounting separation for these are not implemented.

---

### Scenario 68: Printer Out of Paper — Queue Recovery
**Viability: ❌ NOT SUPPORTED**

No hardware printer integration is described in the tech stack or architecture. There is no receipt buffer, no print queue, no "Printer Error - Paper Out" detection dialog, and no "Retry Print" workflow. Hardware peripheral integration is entirely absent from the current implementation.

---

### Scenario 69: Customer Loyalty Points Redemption vs. Split Bills
**Viability: ❌ NOT SUPPORTED**

No customer loyalty system exists. There is no points tracking, no phone number lookup, no "Loyalty" tab on tickets, and no "Tender Type: Points" payment method. The three payment methods (Cash, GCash, Maya) do not include loyalty points.

---

### Scenario 70: Kitchen Printer Jam / Silent Failure Detection
**Viability: ❌ NOT SUPPORTED**

No hardware printer integration exists. There is no print confirmation system, no timeout-based failure detection, and no "TICKET FAILED" warning banner. Kitchen orders sent via KDS are not tracked against physical printer confirmations.

---

### Scenario 71: Suspicious Drawer Pops / No Sale Abuse Audit
**Viability: ⚠️ PARTIALLY SUPPORTED**

The audit log at `admin/logs/` via `audit.svelte.ts` tracks actions with timestamps. This conceptually supports reviewing unusual events. However, hardware cash drawer events (physical "No Sale" button presses) are not tracked — there is no hardware peripheral integration. Only software-level actions logged through the app's `audit.svelte.ts` helper writers would appear. A Manager could not see hardware-only drawer events in the audit log.

---

### Scenario 72: Offsetting Over-Payments via Store Credit
**Viability: ❌ NOT SUPPORTED**

No store credit or voucher system exists. There is no barcode-printable credit value, no credit balance stored against a customer record, and no "Issue Change as Store Credit" tender type. The payment system only supports exact cash tender calculations with cash change output.

---

### Scenario 73: The "Ghost" Takeaway Order (Abandoned Pickup)
**Viability: ❌ NOT SUPPORTED**

No takeaway lane exists at all (as noted in Scenario 20). Therefore, staleness tracking, abandoned order flagging, and the "Void - Abandoned Pickup" metric under a "Customer No-Show" category are also unsupported.

---

### Scenario 74: VIP Priority Bumping (Overriding FIFO Queue)
**Viability: ❌ NOT SUPPORTED**

The KDS at `routes/kds/+page.svelte` displays tickets but has no queue ordering control, no "VIP RUSH" toggle, and no mechanism to manually insert a ticket at position #1 in the butcher's queue. The KDS is a display system, not a reorderable priority queue.

---

### Scenario 75: End of Day "Blind Close" to Prevent Skimming
**Viability: ⚠️ PARTIALLY SUPPORTED**

BIR Z-Readings are mentioned in `CLAUDE.md` as a compliance feature, confirming that an End-of-Day closing workflow concept exists. However, the specific "Blind Close" mechanic — where the EOD screen hides the expected cash amount and demands the Cashier input denominations independently — is not documented as an implemented behavior. Standard EOD may show the expected total, defeating the anti-skimming purpose.

---

## 15. Ingredient Lifecycle & Complete Spoilage Tracking

**Goal:** Track the granular journey of food from receiving to serving, spoiling, or returning.

---

### Scenario 76: Granular Ingredient Depletion / Cascading 86
**Viability: ❌ NOT SUPPORTED**

No recipe-level ingredient tracking exists. The stock system in `stock.svelte.ts` tracks items (e.g., "Minced Garlic" as a stock item) but does not link menu items to their component ingredients. There is no automatic cascade where depleting Garlic to 0g grays out every menu item that requires Garlic on POS and KDS terminals. This requires a recipe/BOM (Bill of Materials) system that is entirely absent.

---

### Scenario 77: Near-Spoilage Predictive Alerts (FIFO / Batch Tracking)
**Viability: ❌ NOT SUPPORTED**

No batch tracking by delivery date exists. The `ReceiveDelivery.svelte` component logs deliveries but does not record a shelf-life or expiry date per batch. There is no FIFO rotation system, no "Warning: X kg expiring in 24 hours" dashboard alert, and no batch-level inventory record (e.g., Batch #882 with its own expiry).

---

### Scenario 78: Supplier Quality Rejects (Partial Accept + RTV)
**Viability: ❌ NOT SUPPORTED**

The `ReceiveDelivery.svelte` component handles delivery receiving but does not have a "Partial Accept" mode. There is no "Returned: 10kg (Supplier Quality Reject)" flag, no RTV (Return To Vendor) debit memo generation, and no accounts-payable integration. A receiver must accept a full delivery or nothing.

---

### Scenario 79: Post-Prep Spoilage / EOD Dump with Reason Codes
**Viability: ⚠️ PARTIALLY SUPPORTED**

`WasteLog.svelte` at `routes/stock/waste/+page.svelte` exists for recording waste. This covers the core action of logging "2kg Kimchi - wasted." However, specific **reason codes** (e.g., `EOD Toss-Out` vs. `Spoiled` vs. `Dropped`) and the pattern analysis that identifies recurring waste patterns over time are not documented. The waste log is a recording tool, not an analytical one.

---

## 16. The Owner & The Data Management Sandbox

**Goal:** Prove the platform empowers upper management and silent partners to manipulate, isolate, and forecast restaurant data securely.

---

### Scenario 80: The "Silent Partner" Read-Only Dashboard
**Viability: ❌ NOT SUPPORTED**

The defined roles in `session.svelte.ts` are: `owner`, `admin`, `manager`, `staff`, `kitchen`. There is no **Investor** or **Silent Partner** read-only role. The `dashboard/+page.svelte` exists for owners, but not a cloud-accessible, permission-restricted investor view with live metrics and no edit access. External cloud login is also impossible with the in-memory architecture.

---

### Scenario 81: Price Experimentation (A/B Testing the Menu)
**Viability: ❌ NOT SUPPORTED**

No menu editor exists (as noted in Scenario 2), so price changes of any kind are not supported. Branch-specific price scheduling, menu profile cloning, week-long trials, and comparative sales analysis for price impact are entirely absent features.

---

### Scenario 82: Cost of Goods Sold (COGS) Margin Analysis
**Viability: ⚠️ PARTIALLY SUPPORTED**

The reports suite includes `profit-gross` and `profit-net` report tabs, which relate to COGS concepts. However, the specific COGS analysis described — linking **butcher yield data** (actual grams of beef used) to **sales volume** (packages sold) to compute a food cost percentage per item — requires recipe-level ingredient tracking and yield logging that do not exist. The profit reports use pre-built mock data, not real-time food cost computations.

---

### Scenario 83: Exporting to Accounting Software via API (Monthly Close)
**Viability: ❌ NOT SUPPORTED**

There is no API, no data export functionality, and no integration with QuickBooks, Xero, or any accounting platform. The app has no backend, making API development impossible in its current state. Data export (even CSV) is not described as a feature.

---

### Scenario 84: Identifying "Dead Weight" Menu Items (Product Mix Report)
**Viability: ⚠️ PARTIALLY SUPPORTED**

The `best-sellers` report tab exists, showing high-performing items. This is the positive side of product mix analysis. However, a "Least Ordered" sort or a velocity report showing items with minimal order counts over 30 days is not described. Additionally, deleting or archiving a menu item from the admin interface is not documented (no Menu Editor exists).

---

### Scenario 85: Tracing Fraud — Manager Void Abuse Pattern
**Viability: ⚠️ PARTIALLY SUPPORTED**

The audit log at `admin/logs/` records timestamped actions via `audit.svelte.ts`. This is the correct foundational tool for this scenario. However, advanced fraud detection features — a scatter plot of void events by time and manager PIN, pattern anomaly highlighting, or a filtered "Voids by Manager" view — are not described. The audit log is a flat list, not an analytical fraud detection dashboard. A manager would have to manually scroll through logs to spot patterns.

---

## Summary by Role Category

| # | Role | Total Scenarios | ✅ Full | ⚠️ Partial | ❌ None |
|---|------|----------------|--------|------------|--------|
| 1 | Manager / Owner | 7 | 0 | 4 | 3 |
| 2 | Store Manager (Floor Ops) | 6 | 0 | 2 | 4 |
| 3 | Butcher / Kitchen Prep | 7 | 2 | 2 | 3 |
| 4 | Stock Controller | 4 | 1 | 2 | 1 |
| 5 | Cashier / Front of House | 11 | 3 | 2 | 6 |
| 6 | Host / Receptionist | 3 | 1 | 1 | 1 |
| 7 | Waiter / Server | 4 | 2 | 0 | 2 |
| 8 | Expediter | 3 | 1 | 0 | 2 |
| 9 | Busser / Dishwasher | 2 | 2 | 0 | 0 |
| 10 | Barista / Drinks Station | 3 | 0 | 1 | 2 |
| 11 | The Customer | 7 | 5 | 0 | 2 |
| 12 | Complex Edge Cases | 6 | 0 | 0 | 6 |
| 13 | Hyper-Specific Operational | 9 | 0 | 0 | 9 |
| 14 | System Resilience & Accounting | 9 | 0 | 2 | 7 |
| 15 | Ingredient Lifecycle | 4 | 0 | 1 | 3 |
| 16 | Owner & Data Sandbox | 6 | 0 | 3 | 3 |
| **Total** | | **85** | **17** | **20** | **53** |

---

## Critical Gap Areas (Highest Priority for Next Development Phase)

### 🔴 Tier 1 — Core Operational Blockers (App unusable without these)
1. **Menu Editor** — No way to create/modify/price menu items (impacts Scenarios 2, 25, 52, 81, 84)
2. **Takeout / Delivery Lane** — No takeout order type at all (impacts Scenarios 20, 47, 73)
3. **Table Transfer** — Tables cannot be moved with active bills (Scenario 24)
4. **Package Upgrade/Downgrade** — No mid-meal package changes (Scenarios 25, 56)
5. **Split Bill workflows** — No partial payment or item-level splitting (Scenarios 21, 58, 69)

### 🟡 Tier 2 — Staff Accountability & Anti-Theft (Core business requirement)
6. **Discount Type System** — Only SC/PWD exist; no comp, service recovery, or reason codes (Scenarios 7, 13, 23)
7. **Write-Off / Walkout** — No mechanism to close unpaid tables (Scenarios 28, 61)
8. **Void & Discount Report** — Not among the 11 report tabs (Scenario 1)
9. **Blind Close EOD** — Expected cash not hidden during shift close (Scenario 75)

### 🟠 Tier 3 — Stock Intelligence (Required for AYCE cost control)
10. **Recipe-Level Ingredient Tracking** — No COGS or cascading 86 possible without it (Scenarios 43, 76)
11. **Batch/Expiry Tracking** — No FIFO rotation or spoilage alerts (Scenario 77)
12. **Inter-Branch Stock Transfers** — Critical for multi-branch operations (Scenario 17)
13. **86'ing Items** — No sold-out flagging from KDS to POS (Scenarios 12, 39, 55)

### 🔵 Tier 4 — Architecture Prerequisites (Blocks multiple features above)
14. **Backend / Database** — Without persistence, crash recovery, multi-device sync, historical refunds, and cloud access are impossible (Scenarios 12, 54, 63, 80, 83)
15. **Hardware Integration** — No printer, cash drawer, or barcode scanner support (Scenarios 68, 70, 71, 72)

---

*Assessment generated: 2026-03-04*
*Based on: `CLAUDE.md` (project documentation) and `USER_SCENARIOS.md` (85 scenarios)*
