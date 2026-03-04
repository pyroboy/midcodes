# WTFPOS - Back of House (Kitchen, Butcher, Inventory) Scenarios

This document outlines the operational scenarios for the Back of House (BOH) staff using the WTFPOS system. It focuses on the Kitchen prep line, the Butcher station, and the Inventory Controller, covering common workflows, medium-difficulty edge cases, and worst-case disasters.

---

## 👨‍🍳 Kitchen / Prep Station Scenarios

### Scenario 1: The Standard Ticket Flow (Common)
- **Type:** Routine Prep.
- **Flow:** A ticket arrives on the KDS (Kitchen Display System) for "Table 5 - 2x Beef Belly, 1x Ramyeon."
- **Resolution:** The kitchen staff taps the screen to mark the items as "Preparing," drops the noodles, plates the meat, and then taps the items again to mark them as "Ready." The expediter takes the tray, and the ticket clears from the active KDS screen.

### Scenario 2: The "Fire All" Rush (Medium Case)
- **Type:** Saturated Queue Management.
- **Flow:** A massive party of 12 sits down and the waiter orders 24 plates of meat and 10 side dishes simultaneously. The KDS screen instantly fills up, potentially pushing older, smaller tickets off-screen.
- **Resolution:** The KDS must have a smart "Consolidation View" (grouping all similar items like "Total Beef Belly: 15") to allow bulk plating, while still tracking which items belong to which table. The operator plates 15 beef bellies, taps the grouped item, and the system intelligently fulfills the requirements across all active tickets prioritizing by time ordered.

### Scenario 3: The 86 / Out of Stock Refusal (Worst Case)
- **Type:** Misalignment / Rejection.
- **Flow:** An order comes in for "Premium Wagyu," but the prep cook opens the low-boy fridge and realizes the last tray was already taken, but the system still allowed the order.
- **Resolution:** The KDS operator hits a dedicated "REJECT / 86 ITEM" button on the ticket, selecting the Wagyu. The KDS instantly sends an alert to the Waiter's tablet ("Table 7 Wagyu Rejected - Out of Stock"). The POS automatically nullifies the charge or item from the guest's bill and updates the theoretical inventory to zero to prevent further orders.

### Scenario 4: The Dropped Tray / Re-fire (Medium Case)
- **Type:** Physical Spoilage.
- **Flow:** A server drops a tray holding 3 plates of spicy pork on the way to the dining room. They rush back and verbally ask for a re-fire.
- **Resolution:** The kitchen makes the food, but the lost food *must* be accounted for. The expediter uses a manager PIN on the KDS or POS to punch in a "Waste/Spill" ticket for 3 plates of spicy pork. The system deducts the raw weight from inventory but does not bill any customer, logging the loss under "Accidental Spoilage."

### Scenario 2b: The Allergen Flag (Medium Case)
- **Type:** Special Instruction Handling.
- **Flow:** A ticket for Table 3 arrives flagged "PEANUT ALLERGY - SEVERE." The waiter typed this in the notes field. Simultaneously, the grill operator is already plating the standard yangnyeom (marinated) pork, which has sesame paste that contacts a shared tong with the peanut-glazed spareribs.
- **Resolution:** The KDS renders allergy-flagged tickets with a red banner and an audible alert distinct from the standard order chime. The expo calls the ticket, isolates the tongs, and uses a dedicated color-coded utensil set. Before the tray leaves, the expo taps "Allergen Check Confirmed" on the KDS, logging the staff member's name and timestamp for liability purposes. The system cannot enforce physical separation — only the flag and log.

### Scenario 2c: The KDS Screen Goes Dark (Worst Case)
- **Type:** Hardware Failure During Peak Service.
- **Flow:** It's 7:45 PM on a Saturday. The KDS monitor loses signal — likely a loose HDMI cable knocked by a prep cook. There are 14 active tickets across 9 tables. The kitchen has no visibility into outstanding orders.
- **Resolution:** The POS system, detecting that no KDS acknowledgment pings have been sent for 90+ seconds, pushes a "KDS Offline" alert to the manager's tablet. The manager enters the kitchen with a printed fallback: the POS has a "Print Ticket Queue" button that dumps all unacknowledged tickets to the receipt printer. Kitchen runs on paper until the screen is restored, at which point the system reconciles: items already verbally called as "Ready" must be manually confirmed on the POS to prevent double-firing.

### Scenario 2d: The AYCE Timer Abuse (Medium Case)
- **Type:** Customer Overconsumption Management.
- **Flow:** Table 12 — a group of college students — has been ordering 6 plates of pork belly every 4 minutes. The kitchen is backing up solely because of this one table. After 90 minutes, they are clearly gaming the AYCE window before it closes.
- **Resolution:** The KDS shows a per-table fire rate metric. When a single table's order rate exceeds a configurable threshold (e.g., more than 3 plates of premium meat within 5 minutes), the system flags it yellow: "High Fire Rate — Table 12." The manager can choose to batch-delay the order or place it in a "Review Queue" before sending it to the grill. A note is logged in the table's session history for the owner to review average consumption per cover.

---

## 🔪 Butcher / Meat Prep Scenarios

### Scenario 5: Standard Block Yield Processing (Common)
- **Type:** Routine Meat Processing.
- **Flow:** The butcher takes a 10kg primal block of Pork Belly from the walk-in freezer to convert into 100g sliced portions for service.
- **Resolution:** The butcher logs into the POS backend/tablet, selects "Process Meat," inputs "10kg Raw Pork Belly Block," and enters the output: "90x 100g portions." The system automatically calculates 1kg of trim/loss (fat, blood, unusable ends) and logs it as standard expected yield loss.

### Scenario 6: Poor Yield / Fat Trimming Dispute (Medium Case)
- **Type:** Variable Yield Flagging.
- **Flow:** The butcher opens a new box of imported beef and finds it requires way more trimming than usual. A 5kg block only yields 3kg of usable slices (a massive 40% loss).
- **Resolution:** When the butcher logs the output (30 portions from 5kg), the POS flags this as "Yield Below Threshold (Expected 80%, Actual 60%)." It forces the butcher to snap a photo with the tablet or leave a text note ("Excess fat from supplier ABCD") for the owner to review and potentially request a vendor credit.

### Scenario 7: The Cross-Contamination Disaster (Worst Case)
- **Type:** Mass Discard / Write-Off.
- **Flow:** A bucket of raw chicken marinade spills directly into a freshly sliced cambro of 20kg of premium beef. Food safety mandates the beef must be thrown away.
- **Resolution:** The butcher must log a "Mass Spoilage Event." Using the Inventory app, they select the sliced beef, enter "20kg," and select reason code "Contamination." A manager PIN is required given the high monetary value of the write-off. The restaurant's theoretical inventory plummets instantly, perhaps triggering an emergency auto-order to the supplier.

### Scenario 5b: The Shift Handover Discrepancy (Medium Case)
- **Type:** Inter-Shift Accountability.
- **Flow:** The morning butcher prepped 80 portions of pork collar and logged them in the system. The afternoon butcher opens the low-boy and counts 71. Neither shift claims to have taken 9 portions for reasons other than service. The prep log shows no waste or cooking entries for the difference.
- **Resolution:** The POS flags a "Prep-to-Floor Variance" when portions logged as prepped exceed portions pulled for service + portions recorded as waste. The system generates a shift-handover discrepancy report, requiring both shifts' leads to sign off on the count at the start and end of each shift. The 9-portion gap is logged as "Unexplained Shrinkage - Prep" and escalates to the manager dashboard in yellow.

### Scenario 5c: Frozen Meat Not Thawed in Time (Common)
- **Type:** Prep Timeline Failure.
- **Flow:** The PM shift butcher arrives and opens the walk-in to find the pork belly for tonight's service is still frozen solid — the outgoing AM shift forgot to move it from the freezer to the thaw rack before leaving at 2 PM.
- **Resolution:** The POS has a "Thaw Schedule" module where items are flagged for transfer from freezer to chiller at a set time based on service window. If a scheduled thaw transfer is not confirmed by the assigned staff at the expected time, the system pushes a reminder alert to the duty manager's device. In this case, the PM butcher logs a "Thaw Delay — 4 hours behind schedule," and the manager must decide: run with reduced pork belly inventory tonight, or emergency-source from Branch B's surplus.

### Scenario 7b: Mislabeled Cambro / Date Labeling Error (Medium Case)
- **Type:** Food Safety Compliance Risk.
- **Flow:** A prep cook opens a labeled cambro that reads "Sliced Pork Belly — Prepped 02/28" but today is 03/06 — seven days later. Standard hold time for raw sliced pork is 3 days refrigerated. The cambro was buried under newer preps and missed the daily FIFO check.
- **Resolution:** The system cannot catch physical mis-labeling, but the daily stock count process provides a catch mechanism. When the AM stock count is taken and the system's "theoretical age" of a prep batch (calculated from prep log timestamps) exceeds the configured hold threshold, the item is flagged in red on the inventory screen: "Pork Belly Batch P-032 — POTENTIALLY EXPIRED (Day 7 of 3-day hold)." The manager must confirm a write-off and log the cause as "FIFO Failure — Storage Rotation."

---

## 📦 Inventory / Stock Controller Scenarios

### Scenario 8: The Standard Morning Delivery (Common)
- **Type:** Routine Receiving.
- **Flow:** The delivery truck drops off 5 boxes of lettuce, 10 crates of pork collar, and 3 kegs of beer.
- **Resolution:** The receiver uses a tablet to open the expected Purchase Order (PO) in WTFPOS. They confirm the quantities match the invoice, hit "Receive All," and the system instantly updates the global on-hand stock counts.

### Scenario 9: The Short-Shipment / Price Hike (Medium Case)
- **Type:** Vendor Discrepancy.
- **Flow:** A vendor was supposed to deliver 50kg of brisket at $10/kg. They deliver only 40kg, and the printed invoice says $12/kg.
- **Resolution:** The receiver cannot just hit "Receive All." They must modify the incoming PO line item to 40kg, and adjust the unit cost to $12. The POS logs a "Vendor Discrepancy" alert for accounting. Crucially, the system permanently adjusts the recipe cost algorithms based on the new $12/kg price, potentially alerting the owner that margins on the beef package just shrank.

### Scenario 10: Theoretical vs. Actual Discrepancy (Worst Case / Theft)
- **Type:** End of Month Audit.
- **Flow:** It's the end of the month. The POS says there should be exactly 15 bottles of premium soju left based on sales and receiving. The inventory guy physically counts the fridge and finds only 8 bottles.
- **Resolution:** The inventory controller enters an "Audit Adjustment" of -7 bottles. Because the variance is high (almost 50% missing), the POS flags it in red on the executive dashboard as "Suspected Shrinkage/Theft." The system forces an adjustment to bring theoretical stock down to reality (8 bottles), ensuring re-order alerts are accurate for tomorrow.

### Scenario 11: The Overnight Freezer Failure (Worst Case)
- **Type:** Catastrophic Loss.
- **Flow:** The condenser on the walk-in freezer dies Saturday night. On Sunday morning, the prep staff arrives to find $5,000 worth of ruined, thawed meat.
- **Resolution:** The restaurant cannot operate fully. The inventory controller opens the POS, uses a "Batch Write-Off" tool, selects all items located in "Walk-in Freezer 1," marks them as "Spoilage - Equipment Failure," and zeroes out the stock. The POS immediately 86's (greys out) all corresponding menu items on the waiter tablets and KDS, preventing any impossible orders from being taken, and generates an insurance claim value report.

### Scenario 12: Inter-Branch Stock Transfer (Medium Case)
- **Type:** Logistical Adjustment.
- **Flow:** WTFPOS is running a multi-branch setup. Branch A has completely run out of pork belly, but Branch B (2 miles away) has an overstock. Branch B sends 20kg to Branch A via a manager's car.
- **Resolution:** Branch B's controller initiates an "Outbound Transfer: 20kg Pork Belly to Branch A." Branch B's stock drops by 20kg. The stock sits in transit limbo until Branch A's controller receives it on their POS, hitting "Acknowledge Inbound Transfer," bumping their stock up by 20kg. No money changes hands, but the cost of goods sold (COGS) balances perfectly for accounting.

### Scenario 13: Supplier No-Show — Emergency Palengke Run (Worst Case)
- **Type:** Supply Chain Failure.
- **Flow:** It's 10 AM. Opening time is 11 AM. The regular meat supplier calls to say their delivery truck broke down on EDSA and they cannot deliver until 6 PM at the earliest. Current on-hand pork belly stock is enough for maybe 20 covers. It's a Friday — fully booked.
- **Resolution:** The manager triggers "Emergency Sourcing" in the POS. The system generates an emergency purchase list (quantities needed to cover projected covers based on booking data). The manager sends a staff member to the nearest wet market (palengke) with petty cash. When the stock arrives, the receiver logs it as an "Emergency Purchase" with a different supplier code (e.g., "LOCAL-PALENGKE"), entering the actual per-kilo cost paid (likely higher). The system flags the cost variance on the daily report so the owner can see the margin impact. The regular supplier's record gets a "Delivery Failure" strike logged.

### Scenario 14: LPG / Charcoal Running Low Mid-Service (Medium Case)
- **Type:** Consumable Stock Emergency.
- **Flow:** At 7 PM on a Saturday, the floor staff notices several tables' grills are losing heat. The LPG tank feeding that section is almost empty — the AM shift used it heavily for lunch but the PM controller didn't check the gauge before service.
- **Resolution:** LPG tanks and charcoal sacks are tracked as consumable inventory items in WTFPOS, not just raw ingredients. Each is assigned a par level. The 10 AM stock count requires the controller to log "LPG Tank 2 — ~25% remaining" on a gauge-read basis. When logged below par, the system auto-generates a restock reminder. In this case, since the check was missed, the on-duty manager must manually pull a spare tank from the storage room, log a "Tank Swap — Section B" event, and the empty tank is logged as depleted. Failure to hit par by 5 PM triggers a push notification to the manager's phone.

### Scenario 15: Wrong Item Delivered — Supplier Substitution (Medium Case)
- **Type:** Receiving Discrepancy.
- **Flow:** The PO called for 20kg of pork collar (kasim). The delivery arrives with 20kg of pork shoulder (balikat) — a different cut with different fat content and yield, priced the same per kilo by the supplier without asking.
- **Resolution:** The receiver cannot simply "Receive All" against the original PO. They open the PO line item, change the item from "Pork Collar" to "Pork Shoulder (Supplier Substitution)," and tag it with reason code "Unauthorized Substitution." The stock for pork collar does not increase — instead, a new inventory entry for pork shoulder is created. The system logs a "Vendor Alert" for accounting and flags the substitution to the head chef, who must decide if pork shoulder can be used in tonight's service or needs to be returned. A return-to-vendor workflow is initiated if rejected.

### Scenario 16: End-of-Night Leftover / Carryover Tracking (Common)
- **Type:** Daily Close Inventory Reconciliation.
- **Flow:** Service ends at 10 PM. The kitchen has leftover prepped items: 12 portions of sliced pork belly, 8 portions of beef short ribs (already thawed), and a full cambro of marinated chicken. These need to be accounted for the next day's opening stock count.
- **Resolution:** During end-of-night closing in the POS, the kitchen lead performs an "EOD Carryover Log" — entering the physical count of all prepped-but-unsold items. The system's theoretical count already knows what was prepped and what was sold. Any gap (theoretical prepped minus sold minus carryover) is flagged as unaccounted consumption. Carryover items are tagged in the system with their prep date and age, and the next morning's 10 AM count must confirm they are still present or account for their disposal. Items past their hold date that appear in carryover are auto-flagged for write-off review.

### Scenario 17: Complimentary / Comped Item Not Deducted from Inventory (Worst Case / Process Gap)
- **Type:** Inventory Leakage from Comps.
- **Flow:** A regular VIP customer complains that their meat was undercooked. The floor manager, wanting to smooth things over, tells the kitchen to fire 2 extra plates of wagyu "on the house." No one enters this into the POS — the manager just tells the kitchen verbally.
- **Resolution:** This is the silent inventory killer in AYCE restaurants. The system's theoretical inventory will show 2 plates of wagyu sold against zero revenue, creating a permanent untracked gap. To prevent this, all comps must be logged in the POS with a "Complimentary" transaction type, requiring manager PIN and reason code (e.g., "Service Recovery"). The item is then deducted from inventory correctly, and the cost is tracked in a separate "Comps & Voids" report line on the owner's daily dashboard. Monthly comp analysis reveals if managers are over-comping.

---

## 🔥 Additional Kitchen / Service Floor Scenarios

### Scenario 18: Food Delivered to the Wrong Table (Common)
- **Type:** Mis-Delivery / Order Confusion.
- **Flow:** The expo calls "Table 4 — 3 beef belly, 1 samgyupsal" and a new server grabs the tray and drops it at Table 14. Table 14 didn't order this. Table 4 is still waiting. By the time the error is caught, Table 14 has already started eating the food.
- **Resolution:** The KDS requires a table confirmation step before the expo releases a tray: the server must tap "Confirm Delivery — Table 4" on the KDS screen or a floor tablet before physically leaving the kitchen. If delivery is not confirmed within 3 minutes of "Ready" being called, the system re-alerts the expo. The mis-delivery at Table 14 must still be logged — the food consumed there is a write-off (already plated, cannot be returned), logged as "Mis-delivery Waste," and Table 4's order is re-fired. No charge to Table 14 for the eaten food.

### Scenario 19: The 90-Minute AYCE Timer Expires Mid-Order (Medium Case)
- **Type:** Policy Enforcement — Session Limit.
- **Flow:** Table 9 ordered 4 plates of pork belly at 8:58 PM. Their 90-minute AYCE session expired at 9:00 PM. The order is technically in-flight — the POS accepted it at 8:58, but the kitchen hadn't started firing it when the timer hit zero.
- **Resolution:** The POS locks the table's ordering once the session clock expires — no new orders accepted regardless of waiter input. For in-flight orders submitted before the cutoff, the system must still honor them: any order with a timestamp ≤ session end time is valid and must be fired. The kitchen sees these tagged as "LAST ORDER" in orange on the KDS. Any order attempted after the cutoff is auto-blocked at the waiter tablet with a notification sent to the manager, who holds override authority to accept or decline.

### Scenario 20: Flare-Up / Grill Fire at Table (Worst Case)
- **Type:** Safety Incident During Service.
- **Flow:** A guest pours their beer directly onto the charcoal grill "to cool it down," causing a flash flare-up that singes the overhead ducting. Service at that section halts. One guest has a minor arm burn. The table's food is ruined.
- **Resolution:** The incident triggers a physical response first — staff follows fire safety protocol. In the POS, the manager immediately places the affected table into "Incident Hold" status, freezing the timer and locking further orders. A safety incident report is created in the system: table number, time, staff witnesses, description, and action taken. The table's remaining bill is voided entirely. If the guest requires medical attention, the report is flagged for insurance documentation. The table is marked "Out of Service" until the grill and ducting are inspected, removing it from the active floor map.

### Scenario 21: Staff Meal / Family Meal Accounting (Common)
- **Type:** Controlled Internal Consumption.
- **Flow:** Before the dinner rush, the kitchen staff eat their pre-shift meal — 6 portions of pork collar, rice, and banchan. In most restaurants this is informal. In WTFPOS, this is inventory walking out the door untracked.
- **Resolution:** Staff meal is logged as a daily "Staff Consumption" transaction in the POS. The manager or head cook opens a "Staff Meal" session (similar to a comp transaction), enters the items consumed, and closes it. This deducts from inventory accurately and posts to a "Staff Meal Cost" line on the daily P&L. The owner can monitor this as a percentage of COGS — a useful benchmark (industry standard is ~1-3% of food sales). If staff meals balloon past threshold, an alert flags it on the dashboard.

### Scenario 22: Banchan / Side Dish Runs Out Mid-Service (Medium Case)
- **Type:** Non-Billed Consumable Depletion.
- **Flow:** It's 7:30 PM. The kimchi, bean sprouts, and pickled radish have all been refilled three times. The prep cook realizes the prepped banchan batch is fully depleted and there's no time to quick-pickle a new batch. Several tables are actively requesting refills.
- **Resolution:** Banchan are tracked as "unlimited complimentary consumables" in the inventory system with a daily prep batch quantity logged at the start of service. When the closing batch count is zero and active tables are still open, the floor manager can either flag specific banchan as "86'd — Depleted" (which appears on the waiter tablet as unavailable for refill requests), or trigger an emergency prep alert to the kitchen. The depletion rate per cover is logged, allowing the owner to adjust next day's prep quantities based on cover count and historical banchan throughput.

### Scenario 23: Menu Price Change Mid-Month — Active Tickets Affected (Medium Case)
- **Type:** Pricing Integrity.
- **Flow:** The owner decides to increase the AYCE package price from ₱599 to ₱649 effective immediately, pushed via the admin panel during a Tuesday dinner service. Tables that sat down and were rung in at 6 PM at the old ₱599 price are still open. New tables seating after 7 PM should get ₱649.
- **Resolution:** Price changes in the POS apply only to new transactions opened after the change is saved — they never retroactively affect open tickets. Open table orders are "locked" to the price in effect at the moment the first item was ordered. The system timestamps the price change event in the audit log. If a manager tries to manually reprice an open ticket to the new rate, they must provide a PIN and reason code, and the action is flagged in the audit trail. This prevents both accidental overcharges and intentional rollback abuse.

---

## 🔪 Additional Butcher / Meat Prep Scenarios

### Scenario 24: Over-Portioning Error — Grammage Drift (Common)
- **Type:** Portion Control Failure.
- **Flow:** The butcher has been slicing pork belly all morning without recalibrating the scale or checking portion thickness. By the 50th portion, the slices have drifted from 100g to ~125g each. The log shows "80 portions from 10kg" but physically there are only 72 portions.
- **Resolution:** Over-portioning silently erodes margins. The system catches this during the prep log entry: when the portion count entered is less than the theoretical yield (e.g., 72 instead of 80 from 10kg at 100g/portion), it flags "Portion Shortfall — 8 portions missing (720g unaccounted)." The butcher must either justify the loss (trim logged separately) or accept a "Grammage Drift" notation. Repeated grammage drift from the same staff member is tracked and surfaced on the manager's personnel report as a training flag.

### Scenario 25: Slicer Breaks Down Mid-Prep (Worst Case)
- **Type:** Equipment Failure During Prep.
- **Flow:** The industrial meat slicer dies mid-block at 9 AM — the blade motor seized. There are 15kg of raw pork belly blocks waiting to be portioned for the 11 AM opening. Manual knife portioning is possible but slow, and consistency suffers.
- **Resolution:** The butcher logs a "Equipment Downtime — Slicer" event in the system, with start time and affected prep items. The system recalculates the day's max producible portions given manual throughput rate. The manager is notified to assess: call a repair tech, borrow a slicer from Branch B, or proactively reduce today's covers/reservations. The downtime event is captured for the equipment maintenance log, which the owner reviews to track repair frequency and decide on replacement ROI.

### Scenario 26: Received Meat Labeled "Fresh" Arrives Partially Frozen (Medium Case)
- **Type:** Supplier Quality Dispute.
- **Flow:** The PO specified "fresh, never-frozen pork collar." The delivery arrives cold but upon opening, the center of several blocks has an ice crystal texture — indicating the meat was previously frozen and re-thawed during transport, then re-chilled. This affects texture and quality.
- **Resolution:** The receiver flags the delivery as "Quality Dispute — Suspected Freeze-Thaw" in the POS receiving screen rather than hitting "Receive All." Photos are taken via the tablet and attached to the receiving record. The PO is placed in "Pending Acceptance" status — stock is not added to inventory until the dispute is resolved. The supplier is notified via the vendor alert system. If the restaurant absorbs the stock anyway (service pressure), it's received at a negotiated discount, with the cost variance logged as a "Quality Penalty Credit" for accounting.

---

## 📦 Additional Inventory / Stock Controller Scenarios

### Scenario 27: Ice Machine Failure — Beverage Service Collapses (Medium Case)
- **Type:** Utility Equipment Failure.
- **Flow:** The under-counter ice machine stopped making ice overnight. By lunch service, the ice bin is nearly empty. Soda, iced teas, and beer-on-ice service all depend on it. It's a 35°C day.
- **Resolution:** Ice is tracked as a consumable resource in the system with a "current bin level" estimate updated at each shift count. The AM stock count should have flagged "Ice — Low, machine non-operational." When flagged, the system auto-suggests: purchase bagged ice from the nearest 7-Eleven or Puregold. The emergency purchase is logged as a consumable buy with cost recorded under "Utilities & Consumables." The ice machine downtime is logged as a maintenance event. Until resolved, beverages requiring ice are optionally grayed out or a service note "Ice Limited — Request May Be Delayed" is shown on the waiter's menu screen.

### Scenario 28: BIR Audit — Need to Reproduce Historical Receipts (Worst Case)
- **Type:** Regulatory Compliance.
- **Flow:** A BIR (Bureau of Internal Revenue) tax examiner arrives unannounced and requests all official receipts and Z-readings for the past 6 months, including void and refund records. The POS must be able to produce these on-demand.
- **Resolution:** The POS maintains a tamper-resistant transaction archive — every sale, void, refund, discount, and payment method is timestamped and stored. The manager opens the "BIR Compliance" section, selects a date range, and the system generates: daily Z-reading summaries, per-transaction official receipt records (OR numbers), a void/refund log with manager PIN timestamps, and SC/PWD discount registers with ID numbers captured at time of transaction. These are exportable as a PDF report. No transaction can be permanently deleted from this archive — only marked as voided.

### Scenario 29: Petty Cash Reconciliation Discrepancy (Common)
- **Type:** Cash Handling.
- **Flow:** The manager issues ₱5,000 petty cash at the start of the week for sundry purchases (market runs, cleaning supplies, ice). At week's end, receipts total ₱4,200 but only ₱650 remains in the petty cash box. ₱150 is unaccounted for.
- **Resolution:** All petty cash disbursements must be logged in the POS expense tracker with: amount, category, staff who spent it, and a receipt photo. When the week's petty cash is reconciled, the system compares starting cash minus logged disbursements against physical remaining cash. A ₱150 gap is flagged as "Petty Cash Variance." The manager must either locate the missing receipt or log it as an "Unreceipted Expense" with a reason. Persistent unreceipted expenses from the same staff member are escalated to the owner's dashboard.

### Scenario 30: SC/PWD Discount Claimed Without ID Verification — Discovered at EOD (Medium Case)
- **Type:** Discount Compliance Audit.
- **Flow:** The cashier processed a 20% SC discount for a table of 4 at lunch. At end-of-day, the manager reviews the SC/PWD log and notices the receipt shows a Senior Citizen discount was applied but no ID number was recorded in the system — the cashier just clicked through the discount screen without entering the OSCA ID number.
- **Resolution:** Philippine law requires the SC/PWD ID number to be recorded on the official receipt for the discount to be valid for VAT exemption claims. The POS enforces this: the SC/PWD discount screen cannot be confirmed without a non-empty ID number field. If the cashier bypassed this (edge case: system bug or override), the EOD SC/PWD log will show a record with a blank ID field, which is automatically flagged in red for the manager. The transaction must be corrected: if the ID was genuinely verified but not entered, the manager can retroactively log it with a PIN. If the ID was never checked, the discount is marked "Non-Compliant" and the variance is tracked for BIR risk assessment.

### Scenario 31: Multi-Table Group Split Bill — Inventory Double-Count Risk (Medium Case)
- **Type:** Billing / Inventory Reconciliation.
- **Flow:** A birthday group of 30 spans 5 tables (T1–T5). They were seated and ordered as a single group, with food fired communally, but at payment time they want 5 separate bills split by table. The manager manually merges then re-splits the order. During the split, a bug risk: items might be counted against inventory twice if the split isn't atomic.
- **Resolution:** Table merging and splitting in the POS operates on the order line-item level — each item has a single unique ID and belongs to exactly one ticket at any given time. A split operation re-assigns items to new ticket IDs without duplicating them. The system validates pre- and post-split item counts must be equal. Any bill split requires manager PIN and logs the "Split Event" in the audit trail, listing original table, resulting tables, and each line item's destination. Inventory deductions are triggered once at payment completion per ticket, never at order time, preventing double-deduction.

### Scenario 32: Health Inspection Visit — Real-Time Inventory Snapshot Required (Worst Case / Compliance)
- **Type:** Regulatory Inspection.
- **Flow:** A city health inspector arrives during lunch service and requests to see: current on-hand raw ingredient quantities, storage temperature logs, and the date/source of every meat product currently in the walk-in.
- **Resolution:** The "Compliance Snapshot" function in the stock module generates a real-time on-hand inventory report showing every item, its quantity, its receiving date, its supplier, and its theoretical age in days. Temperature logs (if integrated with IoT sensors on the walk-in units) are pulled alongside. For each meat batch, the system can display the receiving PO number and supplier code, creating a paper trail from supplier invoice to current on-hand status. This report is printable or exportable as PDF directly from the tablet during the inspection. If temperature logging is manual (staff-entered), the system shows the last logged temperature per storage unit from the stock count records.
