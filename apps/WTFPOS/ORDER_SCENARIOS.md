# WTFPOS - Order Scenarios

This document outlines various order-making scenarios for the WTFPOS system, specifically tailored for a Samgyupsal (Unlimited K-BBQ) restaurant. It covers party sizes from 1 to 10 persons, factoring in different demographics (Adults, Kids, Senior Citizens) and order types (Dine-in, Take-out, and Failed Orders).

## Core Variables
- **Party Size:** 1 to 10 persons.
- **Demographics:**
  - **Adults:** Standard unlimited rate.
  - **Kids:** Discounted rate (often based on height or age limits or standard variables).
  - **Senior Citizens / PWD:** Legally mandated discount rate (e.g., 20%), exempt from certain taxes (VAT).
- **Order Types:**
  - **Dine-In:** Requires table assignment, kitchen display system (KDS) routing, and active grilling time tracking.
  - **Take-Out:** No table assignment, packaged directly from the kitchen, immediate or scheduled pickup.
- **Fail States:** Cancelled orders, walk-outs, failed payments, kitchen rejections.

---

## 🍽️ Dine-In Scenarios (1 to 10 Persons)

### Scenario 1: The Solo Diner (1 Person)
- **Composition:** 1 Adult.
- **Type:** Dine-In.
- **Flow:** Host seats the customer at a smaller table or bar area. Waiter takes the order for 1 unlimited set. 
- **System Constraints:** Some K-BBQ places have a minimum of 2 persons or a "solo diner surcharge". The POS must prompt the waiter if a solo protocol or special pricing applies.

### Scenario 2: The Date / Standard Couple (2 Persons)
- **Composition:** 2 Adults.
- **Type:** Dine-In.
- **Flow:** Standard flow. Selected table is marked as occupied. 2 standard unlimited sets are punched in. Normal session timer begins.

### Scenario 3: Small Family with a Child (3 Persons)
- **Composition:** 2 Adults, 1 Kid.
- **Type:** Dine-In.
- **Flow:** Waiter enters 2 Adult sets and 1 Kid set. The POS must allow the waiter to input the kid's variable (e.g., "Below 3ft - Free" or "3ft-4ft - Half Price"). Inventory consumption expects slightly lower yields for the kid.

### Scenario 4: Multi-Generational Family (4 Persons)
- **Composition:** 2 Adults, 1 Kid, 1 Senior Citizen.
- **Type:** Dine-In.
- **Flow:** 
  - 2 Adult rates.
  - 1 Kid rate (prompts for height/age bracket).
  - 1 Senior Citizen. The POS requires the input of the Senior Citizen ID number for the 20% discount and VAT exemption, applied *only* to their portion of the total bill.

### Scenario 5: Group of Friends (5 Persons)
- **Composition:** 5 Adults.
- **Type:** Dine-In.
- **Flow:** Standard unlimited sets. Given the size, the kitchen gets a slightly larger initial meat drop order on the KDS to accommodate the group without immediate continuous re-ordering.

### Scenario 6: Extended Family Dinner (6 Persons)
- **Composition:** 4 Adults, 2 Senior Citizens.
- **Type:** Dine-In.
- **Flow:** Similar to Scenario 4, the POS must handle multiple Senior Citizen discounts simultaneously, requiring two separate ID inputs and applying the math correctly to 2/6ths of the applicable bill.

### Scenario 7: Kids' Birthday Celebration (7 Persons)
- **Composition:** 2 Adults, 5 Kids.
- **Type:** Dine-In.
- **Flow:** Waiter must enter 5 distinct Kid entries, potentially with different pricing tiers depending on their individual heights. The POS should easily aggregate these under the single table.

### Scenario 8: Office Team Building (8 Persons)
- **Composition:** 8 Adults.
- **Type:** Dine-In.
- **Flow:** Large table required (or two adjoined tables). The POS tracks the order under a "Merged Table" or "Large Table" status. This might trigger multiple grills, meaning side dishes and initial meat drops are doubled by the KDS automatically.

### Scenario 9: The Big Family Gathering (9 Persons)
- **Composition:** 4 Adults, 3 Kids, 2 Senior Citizens.
- **Type:** Dine-In.
- **Flow:** The ultimate test of the POS pricing logic. Mix of standard prices, varying kid discounts, and multiple tax-exempt senior discounts, all sharing the same table and potentially splitting the bill with multiple payment methods later.

### Scenario 10: Full Party / Max Capacity Table (10 Persons)
- **Composition:** 10 Adults.
- **Type:** Dine-In.
- **Flow:** Maximum standard table size. Often requires a mandatory gratuity or service charge threshold trigger in the POS (e.g., "Auto-apply 10% service charge for parties of 8 or more"). Generates heavy load on KDS.

---

## 🥡 Take-Out Scenarios

### Scenario 11: Standard Solo Take-Out
- **Composition:** 1 Adult equivalent portion.
- **Type:** Take-Out.
- **Flow:** Customer walks to the counter. Cashier inputs a "Take-Out" order type. No table is assigned. Customer name and pickup time are required. The order is sent straight to the Kitchen KDS for packing. Order stays in an "active takeout" lane until handed over and paid.

### Scenario 12: Family Bundle Take-Out
- **Composition:** Equivalents for 2 Adults, 1 Senior Citizen, 1 Kid.
- **Type:** Take-Out.
- **Flow:** Customer orders a pre-packaged raw or cooked family meat bundle. The cashier must still be able to apply a Senior Citizen discount to the applicable partitioned amount of the bundle, requiring Manager override or specific POS logic for bundled items.

---

## ⚠️ Failed Orders & Exceptions

### Scenario 13: The "Change of Heart" (Walk-Out Before Ordering)
- **Type:** Failed Dine-In.
- **Flow:** Host seats a party of 4. They review the menu, decide it's too expensive, and leave before the waiter takes the order.
- **Resolution:** Waiter or Host must "Clear" the table without settling a bill. The POS logs this as a "Zero-Value Cancellation" rather than a voided sale to keep table turnover metrics accurate.

### Scenario 14: Failed Payment on Take-Out / No Show
- **Type:** Failed Take-Out.
- **Flow:** Customer calls in a Take-Out order. The kitchen prepares and packages the food. The customer never arrives, or their card declines at the counter and they cannot pay.
- **Resolution:** Manager must Void the transaction. The POS logs the food as "Waste" or "Spoilage" in the inventory since it cannot be returned to the main stock.

### Scenario 15: The "Dine & Dash" or Medical Emergency
- **Type:** Failed Dine-In (Mid-Meal).
- **Flow:** A table of 3 has been eating for 30 minutes. An emergency happens and they leave abruptly without paying.
- **Resolution:** The waiter alerts the manager. The manager must close the table using a special "Comp/Emergency/Walk-out" payment method. The accumulated inventory consumed is accurately deducted, but the revenue shows a loss, requiring an incident report log attached to the ticket.

### Scenario 16: Kitchen Rejection (Out of Stock Post-Order)
- **Type:** Failed Order (System Driven/Inventory).
- **Flow:** Waiter punches in an order for a premium beef cut. The POS allows it, but the Kitchen KDS operator rejects it, citing "Out of Stock" (the inventory hadn't synced fast enough).
- **Resolution:** The POS notifies the waiter's tablet immediately. Waiter must return to the table, apologize, and modify the order ticket to replace or void the item.

### Scenario 17: User Error (Wrong Table Punched)
- **Type:** Failed Order (Admin Fix).
- **Flow:** Waiter accidentally punches a 4-person setting and first round of meats into Table 5 instead of Table 6.
- **Resolution:** Waiter needs to "Transfer" the order to Table 6, or if Table 5 already has an active session, a Manager pin is needed to detach the erroneously added items and move them to a new ticket on Table 6.

---

## 🔄 Mid-Service Modifications & Edge Cases

### Scenario 18: Mid-Service Takeout Request
- **Type:** Dine-In to Partial Take-Out.
- **Flow:** A table of 4 is halfway through their unlimited meal. They decide they want to order a separate a la carte item (e.g., a specific premium meat or a cooked meal) to take home.
- **Resolution:** The waiter adds a "Take-Out" item to their existing Dine-In ticket. This item must be flagged specifically for the kitchen so they package it in a to-go box rather than serving it on a plate, but the bill remains consolidated for the table.

### Scenario 19: The Latecomer (Adding Pax Mid-Session)
- **Type:** Dine-In (Headcount Update).
- **Flow:** A party of 3 has been eating for 45 minutes. A 4th friend arrives and joins them.
- **Resolution:** The waiter must "Add Pax" to the active table. The POS adds another Adult unlimited charge to the bill. Crucially, the POS must handle the timer logic: either the latecomer's time is tied to the original table's deadline, or the table is granted a specific extension.

### Scenario 20: Free Add-Ons (Zero Dollar Items)
- **Type:** Dine-In (Inventory Tracking).
- **Flow:** The table requests 3 bowls of rice. Rice is included for free with the unlimited package.
- **Resolution:** Waiter pushes a "Rice" button 3 times. The POS rings it up at $0.00. This is necessary because the kitchen needs the KDS ticket to prepare the bowls, and the system needs to deduct the rice from the real-time inventory, even though it doesn't inflate the customer's bill.

### Scenario 21: Mid-Meal Package Upgrade
- **Type:** Dine-In (Tier Upgrade).
- **Flow:** A table initially orders the "Basic Pork" package. After their first round, they decide they want the "Premium Beef & Seafood" package.
- **Resolution:** The waiter taps "Upgrade Package" on the POS. The system must retroactively adjust the base price for all pax on the table to the Premium price (as policy usually requires the whole table to upgrade). It then unlocks the premium items on the waiter's ordering terminal for that table.

### Scenario 22: Leftover Charge (The "No Waste" Policy)
- **Type:** Dine-In (Penalty/Surcharge).
- **Flow:** The 2-hour session is up. The table has cooked a massive amount of meat they cannot finish. The restaurant has a strict "Leftover Charge" policy (e.g., $10 per 100g of wasted meat).
- **Resolution:** The manager assesses the table and calculates the leftover weight. A "Leftover Penalty" item is manually added to the bill by the manager. The POS should ideally log this as a distinct revenue stream (Penalties) rather than standard food revenue.

### Scenario 23: Merging Tables Mid-Service
- **Type:** Dine-In (Table Management).
- **Flow:** A party of 4 is sitting at Table 10. Another party of 3 friends arrives and sits at adjacent Table 11. They discover they know each other and want to merge the bills into one.
- **Resolution:** The system allows the waiter to target Table 11 and execute a "Merge to Table 10" command. All items, timers (using the earliest expiration date or an average), and sub-totals are consolidated onto Table 10's ticket. Table 11 is cleared and marked available or attached to Table 10 physically.

---

## 💸 Complex Payment & Promotion Scenarios

### Scenario 24: Complex Split Billing
- **Type:** Payment Edge Case.
- **Flow:** A table of 8 finishes their meal. They want to split the bill, but not evenly. Person A wants to pay for all the alcohol. Persons B, C, and D want to split the remaining amount equally on 3 different credit cards. Person E pays their share in Cash.
- **Resolution:** The POS must support fractional splitting (dividing a total by X) as well as itemized splitting (assigning specific items to a specific sub-invoice) within the same table session.

### Scenario 25: Promo Code vs. Mandated Discount Stacking
- **Type:** Billing / Policy Clash.
- **Flow:** A group of 4 arrives on a "4+1 Birthday Promo" (Birthday celebrant eats free if accompanied by 4 paying adults). However, 2 of the paying adults are Senior Citizens.
- **Resolution:** By law and restaurant policy, discounts usually cannot stack. The POS must flag the conflict and either automatically apply the discount that yields the highest savings for the customer, or require a Manager override to enforce policy (e.g., removing the Senior discount if the Promo is applied).

### Scenario 26: Post-Payment Partial Refund
- **Type:** Worst Case / Financial Adjustment.
- **Flow:** A table pays their bill in full via Credit Card, which included a Take-Out order they placed at the end. After payment, the kitchen informs them the take-out item is out of stock.
- **Resolution:** The POS needs a "Post-Settlement Void" flow. It must reopen the closed ticket, remove the unfulfilled item, reflect the new total, and log a specific "Refund Owed" amount to be returned to the customer (via manual card terminal refund or cash bin), while keeping the rest of the revenue intact.

---

## 🛑 Real-World Operational Interruptions (Worst Cases)

### Scenario 27: The Table Transfer (Physical Move)
- **Type:** Operational Edge Case.
- **Flow:** A party is seated at Table 5. Halfway through their meal, the AC above them starts leaking (or the grill breaks beyond repair). They must be moved to Table 15.
- **Resolution:** The POS must execute a "Full Table Transfer." This moves all punched items, the active table timer, and future KDS routing to Table 15 without restarting their session or losing inventory data.

### Scenario 28: Pausing the Session Timer
- **Type:** Operational Exception.
- **Flow:** A table's built-in grill malfunctions 30 minutes into their 2-hour session. It takes the staff 15 minutes to bring a portable butane stove and get them cooking again.
- **Resolution:** The POS needs a "Table Pause" function requiring a Manager Pin. This pauses the countdown timer and logs the duration of the interruption so the customers receive their full paid time without penalizing the KDS metrics.

### Scenario 29: Staff Meal / Owner Comp
- **Type:** Non-Revenue Consumption.
- **Flow:** The owner brings 3 friends to eat, or the staff is having their shift meal. They order unlimited packages and various meats.
- **Resolution:** The items must be entered normally so the KDS prepares them and inventory is accurately depleted. At checkout, the bill is settled using a 100% "Owner Comp" or "Staff Meal" payment type. This records the financial value as "Cost of Goods/Marketing Expense" rather than missing cash.


⏳ Queue & Flow Management Scenarios
Scenario 30: The Prepaid Third-Party Voucher
Composition: 5 Adults (4 Pre-paid, 1 Walk-in).

Type: Dine-In (Mixed Tender).

Flow: A group arrives with a prepaid voucher (e.g., from an app like Klook or Metrodeal) that covers an unlimited set for 4 people. However, they brought a 5th friend.

Resolution: The host seats them as a party of 5. The POS must allow the cashier to scan or input the voucher code, which automatically credits 4 Adult sets as "Paid/Redeemed," leaving a balance of exactly 1 Adult set (plus any extra add-ons like drinks) to be settled at the end of the meal.

Scenario 31: The Overstayer (Post-Timer Squatting)
Type: Dine-In (Table Turnover Bottleneck).

Flow: A table’s 2-hour session timer expires. The POS successfully locks them out from ordering more meat. However, the customers sit there for another 45 minutes chatting, preventing the host from seating a waiting party.

Resolution: The POS timer must have distinct states: Active (Ordering), Expired (Eating/Chatting), and Cleared. When the timer expires, the POS should alert the Host stand/Manager tablet with an "Overstay" visual flag (e.g., flashing red). Some aggressive POS configurations allow the manager to trigger a manual "Overtime Table Fee" if restaurant policy dictates it.

Scenario 32: Waitlist-to-Table Pre-Ordering
Type: Queue Management to Dine-In.

Flow: A party of 4 is on the digital waitlist for 30 minutes. To speed up turnover, the host takes their initial soup, drink, and first-round meat orders while they are still in the waiting area.

Resolution: The POS must support a "Floating Ticket" or "Waitlist Order." Once Table 8 is cleared, the host taps "Seat & Fire." The system assigns the floating ticket to Table 8, starts the 2-hour timer, and immediately fires the pre-order to the KDS so the food arrives right as the customers sit down.

🥩 Kitchen Nuances & Inventory Scenarios
Scenario 33: The Dropped Plate (Accidental Waste)
Type: Dine-In (Inventory Adjustment).

Flow: The waiter is carrying a massive platter of premium wagyu to Table 12. Someone bumps into them, and the meat falls on the floor before it hits the table.

Resolution: The customer shouldn't be penalized, but the kitchen needs to make a new plate, and inventory must account for the lost meat. The waiter punches a "Re-Fire" order for Table 12, but tags the original plate with a manager-approved "Waste - Spilled" modifier. The POS deducts two plates from inventory, but the customer's bill remains unaffected.

Scenario 34: Bulk Buffet / Self-Serve Station Refill
Type: Internal Kitchen Order (Zero Value).

Flow: The restaurant has a self-serve side dish bar. The Kimchi and Lettuce trays are empty. This consumption isn't tied to a specific table's tablet.

Resolution: A floor manager inputs a "Bulk Refill: Kimchi (2kg)" order into the POS. This rings up as $0.00, sends a ticket to the Prep Kitchen KDS to bring out a new tub, and accurately deducts the bulk weight from the back-of-house inventory without attaching the data to a dining customer.

Scenario 35: The Custom Modifier / Allergy Alert
Type: Dine-In (Special Request).

Flow: A customer orders a marinated pork belly but has a severe sesame allergy and requests it be prepared without sesame oil or seeds.

Resolution: The POS must allow the waiter to attach a "Custom Modifier" or a high-priority "ALLERGY" tag to a specific item within the unlimited flow. The KDS must display this modifier in bold, contrasting colors (usually red) to ensure the prep line doesn't auto-garnish the plate out of muscle memory.

Scenario 36: Grill Change & Charcoal Refill Routing
Type: Operational Ping (Non-Food).

Flow: Table 4’s grill plate is burnt black, or their charcoal is dying. They don't need food; they need hardware maintenance.

Resolution: Instead of hunting down a busser, the waiter taps a quick-action "Grill Change" or "Add Coals" button for Table 4 on their tablet. The POS routes this ping not to the main food KDS, but to a specific receipt printer or display at the Busser/Utility station.

💳 Special Billing & Operational Mishaps
Scenario 37: Outside Food / Corkage Fee Application
Type: Billing / Revenue Addition.

Flow: A group brings in a large customized birthday cake or a premium bottle of whiskey. The restaurant allows this but charges a flat corkage/cleaning fee.

Resolution: The POS must have an open-priced or fixed-price "Corkage Fee" button under a non-food revenue category. This adds to the table's subtotal but is exempt from inventory deduction, though it must be properly calculated for sales tax.

Scenario 38: The VIP / Loyalty Profile Override
Type: Promotion / Customer Retention.

Flow: A local celebrity or a top-tier loyalty member comes in. The owner wants to give them a flat 15% off the entire bill or a free premium meat add-on that usually costs extra.

Resolution: The POS needs a "Customer Search" function. By typing in a phone number, the system attaches a VIP profile to the table. This automatically adjusts the pricing matrix for that specific table or unlocks a hidden "VIP Only" menu on the waiter's ordering pad.

Scenario 39: Offline Mode Recovery (The Friday Night Outage)
Type: Critical System Failure.

Flow: It’s 7:30 PM on a Friday. The restaurant is packed, and the local internet service provider goes down completely.

Resolution: WTFPOS must instantly switch to "Local Area Network (LAN) Mode." Waiter tablets continue talking to the local server/main terminal via the internal Wi-Fi router. Orders bypass the cloud-based KDS and print directly to physical backup receipt printers in the kitchen. Once the internet returns, the POS seamlessly bulk-syncs all offline transactions, time-stamps, and inventory deductions to the cloud database.