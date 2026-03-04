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
