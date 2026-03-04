# WTFPOS User Scenarios & Storyboard

This document outlines the day-to-day scenarios and user journeys for the different roles interacting with the WTFPOS system.

---

## 1. The Manager / Owner
**Goal:** Oversee operations, prevent theft, analyze profitability, and ensure everything runs smoothly.

- **Scenario 1: Morning Review & Analytics**
  - **Action:** Manager logs into the Admin portal from their laptop at home or the back office.
  - **Journey:** They immediately navigate to the **Reporting Suite**. They check yesterday's *End of Day* report, reviewing total cash vs. GCash/Maya breakdowns to ensure the bank deposits match. They glance at the *Void & Discount Logs* to see if any strange voids happened during busy hours (e.g., preventing staff theft).
- **Scenario 2: Menu & Pricing Updates**
  - **Action:** The cost of beef suddenly increases from the supplier.
  - **Journey:** The Manager goes to the Menu Editor, updates the price of the "Premium Beef Package," and saves. The change immediately syncs to all POS terminals without restarting any hardware.
- **Scenario 3: Floor Layout Changes**
  - **Action:** A large reservation for 20 people requires pushing tables together.
  - **Journey:** The Manager opens the *Admin Floor Editor*, drags Tables 1, 2, and 3 together, renames the grouping to "VIP Event," and saves. The POS automatically reflects this new layout for the Cashier.
- **Scenario 4: Multi-Branch Monitoring**
  - **Action:** Manager is off-site but needs an overview of both the Quezon City and Makati branches simultaneously.
  - **Journey:** Opening the POS in "All Branches" mode, they gain a live bird's-eye view. They can see tables actively eating in Makati, how many takeout orders are pending, and compare live revenue without calling the store managers manually.
- **Scenario 5: Recording Operational Expenses**
  - **Action:** A water delivery and minor plumbing fix arrive at the branch mid-day. Cash needs to be pulled from the drawer to pay them.
  - **Journey:** The Manager logs a "Cash Out" in the Petty Cash tracker to deduct the exact amount from the End-Of-Day register float ensuring cash balancing is flawless during closing.
- **Scenario 6: Staff Accountability & Payroll Logging**
  - **Action:** Running the performance metrics to isolate which staff handle the most tables and upsell packages.
  - **Journey:** Opening the staff logs, the Manager tracks which cashier pin processed what order, rewarding the fastest server and questioning an employee with an abnormally high number of "voided" receipts.
- **Scenario 7: VIP & Comping Meals**
  - **Action:** The restaurant owner's family visits for dinner.
  - **Journey:** The Manager uses their PIN to apply a 100% "Owner Comp" discount to the entire bill. The POS logs the specific manager who authorized the comp, deducting the stock items seamlessly without expecting cash revenue.

---

## 2. The Store Manager (Floor Operations)
**Goal:** Keep the daily shifts running flawlessly, resolve customer disputes, audit the cash floor, and manage staff on duty.

- **Scenario 8: Spot-Checking the Cash Drawer Mid-Shift**
  - **Action:** It's 4:00 PM, and the Store Manager wants to make sure the morning Cashier hasn't been giving incorrect change before the evening rush starts.
  - **Journey:** The Manager goes to the POS and taps "X-Read (Mid-Shift Audit)". The system prints a slip showing exactly ₱15,200 should be physically in the drawer. The Manager counts the cash silently. If it matches, they let the Cashier continue. If it's short, they intervene immediately rather than waiting for closing time.
- **Scenario 9: Resolving a Customer "Allergy Panic"**
  - **Action:** A customer halfway through eating suddenly asks if the marinade contains peanut oil, panicking about an allergy.
  - **Journey:** The Manager grabs the nearest POS tablet, opens the Global Search, and types "Spicy Pork Marinade". They tap the item's info card, which displays the exact ingredient breakdown and allergen warnings natively in the POS. They assure the customer it contains zero peanut oil, de-escalating the situation instantly.
- **Scenario 10: Server Reassignments / Shift Handover**
  - **Action:** Waiter A's 8-hour shift is over, but Table 6 is only 1 hour into their Unli package. Waiter B is clocking in to replace them.
  - **Journey:** To ensure Waiter B gets correct accountability (and potentially tips), the Manager opens the POS, selects Table 6, and hits "Reassign Server". They swap ownership from Waiter A to Waiter B. Any further corkage fees or errors will now track to Waiter B.
- **Scenario 11: Approving a Legitimate Void (Mistapped Order)**
  - **Action:** A Cashier accidentally taps "Wagyu Plate" 5 times instead of 1 time for a customer. The ticket is huge, and cashiers lack permissions to reduce quantities.
  - **Journey:** The Cashier calls the Manager over. The Manager swipes their fingerprint or inputs their 4-digit PIN into a popup modal, approving the deletion of the 4 accidental Wagyu plates from the live ticket before the kitchen starts prepping them. This prevents cashiers from maliciously voiding real items to steal cash.
- **Scenario 12: Calling in Maintenance for Broken Hardware**
  - **Action:** The main POS terminal's touchscreen stops responding entirely out of nowhere.
  - **Journey:** The Manager unplugs the broken terminal, brings out a backup iPad, and logs in. Because WTFPOS is cloud-native, all running timers, active orders, and printed tickets instantly populate on the iPad strictly where they left off. The Manager then messages the owner that Terminal 1 broke without losing a single peso of live transaction data.
- **Scenario 13: Issuing a "Service Recovery" Discount**
  - **Action:** A table waits an unacceptable 45 minutes for a refill of basic pork because the kitchen got overwhelmed. The customer is furious.
  - **Journey:** The Manager steps in to apologize. To save the customer relationship, they open the table's bill, tap "Discount -> Service Recovery (Manager Override)" and apply a 20% discount. The POS notes the discount specifically under the "Service Recovery" code so the owner knows exactly *why* profits took a hit that night (kitchen delays, not just random generosity).

---

## 3. The Butcher / Kitchen Prep
**Goal:** Accurately record the breakdown of raw meats into serve-able portions while minimizing unrecorded waste.

- **Scenario 8: Receiving and Yielding a Beef Slab**
  - **Action:** A 10kg slab of beef arrives.
  - **Journey:** The Butcher goes to the POS terminal in the prep area (or tablet), navigates to **Stock -> Meat Adjustments**. They log the 10kg as "Received."
  - Over the next hour, they slice the meat. They log the resulting weights: 7kg of usable "Bone-Out" slices, 2kg of "Bones" (for soup), and 1kg of "Trimmings/Waste." 
  - *System Result:* The system automatically calculates the yield (70%) and updates the core inventory. The manager can instantly see if the yield is lower than usual, indicating poor butchering or missing meat.
- **Scenario 9: Waste Logging**
  - **Action:** A tray of meat was left out too long and spoiled.
  - **Journey:** The Butcher opens the **Waste Tab**, records "500g Pork - Spoiled," and requires a Manager PIN to finalize the waste deduction to ensure valid accounting.
- **Scenario 10: Fulfilling KDS (Kitchen Display System) Orders**
  - **Action:** A new wave of customers sit down and place orders via the Cashier.
  - **Journey:** The KDS chimes. The Butcher sees "Table 5: Premium Beef x4". They immediately prep standard portions of Premium Beef and plate them. They tap the KDS to mark the item "Done," notifying the runner to deliver the meat.
- **Scenario 11: Special Dietary Instructions**
  - **Action:** A customer requests an item with strict allergies.
  - **Journey:** The ticket on the KDS glows with a clear remark from the cashier: "NO SESAME SEEDS - ALLERGIC." The Butcher prepares the meats on a separate clean cutting board to accommodate the request safely before fulfilling the ticket.
- **Scenario 12: 86'ing (Marking Sold Out) an Item**
  - **Action:** The kitchen serves the very last portion of Enoki Mushrooms.
  - **Journey:** The Kitchen Manager taps the KDS settings and marks "Enoki Mushrooms" as sold out. Instantly, the item grays out on the Cashier's POS floor to prevent any further orders from being successfully punched in.
- **Scenario 13: Edge Case - Recovering an Accidentally Bumped Ticket**
  - **Action:** The Butcher accidentally double-taps the KDS screen and mistakenly marks Table 9's 5x Beef Plate order as "Done" before plating it.
  - **Journey:** The Butcher opens the KDS "Recall/History" tab, finds the bumped ticket for Table 9, and taps "Undo." The ticket instantly re-appears in the active queue with its original elapsed timestamp so they don't forget to serve it.
- **Scenario 14: Edge Case - Network Offline Mode**
  - **Action:** The Wi-Fi router connecting the front-of-house to the back-of-house kitchen display restarts or drops connection.
  - **Journey:** The KDS flashes a red "OFFLINE" connectivity logo. Waiters revert to loudly shouting orders or writing manual chits to the butcher until the tablet flashes a green "Reconnected" badge 30 seconds later, seamlessly syncing and backfilling any missing orders placed during the outage.

---

## 3. The Stock / Inventory Assigned (Stock Controller)
**Goal:** Ensure the restaurant never runs out of crucial ingredients and supplies.

- **Scenario 15: Receiving Daily Deliveries**
  - **Action:** The vegetable and beverage supplier arrives.
  - **Journey:** The Stock Controller opens the **Stock Inventory UI**. They quickly search for "Lettuce" and "Coke Cans." Using the inline `+/-` buttons or the "Adjust Stock" modal, they add +15kg of Lettuce and +50 Cans of Coke, attaching the delivery receipt number as a reference.
- **Scenario 16: Low Stock Alerts during Service**
  - **Action:** It's 7 PM and the restaurant is packed.
  - **Journey:** The POS system flashes a low-stock warning for "Soju." The Stock Controller sees this, runs to the backroom, grabs the remaining reserve boxes, and physically brings them to the front bar, averting a crisis before customers even try to order.
- **Scenario 17: Inter-Branch Stock Transfers**
  - **Action:** The Makati branch tells the Quezon City branch they ran out of Enoki mushrooms.
  - **Journey:** The Stock Controller initiates an "Outgoing Transfer" for 2kg of Enoki mushrooms headed to Makati. When the runner arrives in Makati, the receiving branch accepts the transfer, instantly deducting 2kg from QC's live inventory and adding it to Makati's.
- **Scenario 18: Month-end Physical Inventory Audit**
  - **Action:** It's the end of the month, and the system numbers must match the physical reality.
  - **Journey:** The Controller does a physical walkthrough with a tablet. They count 25 bottles of Soy Sauce while the system expects 28. They input "25" as an override count. The system produces a variance report highlighting the 3 missing bottles for managerial review.

---

## 4. The Cashier / Front of House
**Goal:** Process customers quickly, manage table statuses, and handle payments without calculation errors.

- **Scenario 19: Seating a Walk-in Group**
  - **Action:** A group of 4 arrives.
  - **Journey:** The Cashier looks at the **POS Floor Plan**. They see Table 5 is White (Available). They tap Table 5, enter "4 Pax", and select the "Standard Unli Pork" package. The table instantly turns **Green (Occupied)**, and the KDS gets a ticket to prepare 4 setups of pork and sides.
- **Scenario 20: Processing Takeout & Delivery**
  - **Action:** A FoodPanda rider arrives to pick up an order, while the phone rings with a new customer takeout order.
  - **Journey:** The Cashier clicks "New Takeout." A ticket appears in the **Takeout Lane** bordered in **Blue (NEW)**. The cashier taps it, adds the requested party trays, and the ticket turns Orange. Once the kitchen finishes it, the transaction is checked out and disappears from the lane.
- **Scenario 21: Split Check Processing**
  - **Action:** A group finishes eating but wants to pay via separate GCash and Cash balances.
  - **Journey:** The Cashier processes a partial payment of ₱1000 to "GCash." The bill updates immediately to reflect the remaining balance. The second customer hands over a ₱500 bill, the cashier completes the transaction using "Cash", and the receipt marks both tender types.
- **Scenario 22: Adding A-la-carte Mid-Meal**
  - **Action:** The customers on Table 12 decide they want 3 bottles of Soju and an extra premium Wagyu side order.
  - **Journey:** The Cashier taps Table 12, hits "+ ADD," and charges the drinks and extra wagyu. The pending bill updates the grand total instantly and sends a fresh ticket to the Bar/Kitchen.
- **Scenario 23: Handling Unhappy Customer Adjustments**
  - **Action:** A customer complains about a specific side dish.
  - **Journey:** The Cashier calls over the Manager. The Manager inserts their PIN to void the specific side dish off the bill and uses the "+ ADD" screen to punch in a substitute dish completely free of charge (100% discount) to appease the table.
- **Scenario 24: Edge Case - Table Transfering**
  - **Action:** Table 8 complains that the air conditioning is blowing directly on their grill, making it hard to cook the meat. They want to move to Table 2 which is empty.
  - **Journey:** The Cashier taps Table 8, hits "Transfer Table," and selects the available Table 2. The POS automatically ports all their active timers, ordered items, and bill balance to Table 2. Table 8 is marked as "Dirty" for the bussers to clean, while Table 2 becomes "Green."
- **Scenario 25: Edge Case - Mid-Meal Package Upgrade**
  - **Action:** A group selected the "Unli Pork" base package upon seating. 30 minutes in, they decide they want to eat Beef instead.
  - **Journey:** The Cashier taps the active table, clicks the package label, and overrides it to "Unli Beef & Pork." The POS automatically calculates the price difference per pax and prompts the Cashier if they want to restart the 2-hour timer or keep the elapsed 30 minutes. They opt to keep the elapsed time, and the price jumps to reflect the upgraded package.
- **Scenario 26: Edge Case - Leftover Surcharge (The "No Leftovers" Rule)**
  - **Action:** A group's timer finishes, but they blatantly left 3 large plates of uncooked raw pork belly on their table despite the restaurant's anti-waste rules.
  - **Journey:** The Cashier taps the table before printing the bill, enters "Leftover Penalty", inputs 500g, and the system automatically tacks on an explicit "₱250 Food Waste Fee" to the printed receipt to enforce the rule.
- **Scenario 27: Edge Case - Adding a Late Joiner**
  - **Action:** A table of 4 seated 45 minutes ago suddenly has a 5th friend walk in and join them.
  - **Journey:** The Cashier taps the table, clicks the "Pax: 4" label, and adjusts it to "5." The system appends one new standard dining pack price to the overall bill so the new friend is correctly charged without resetting the dining group's entire countdown timer.
- **Scenario 28: Edge Case - Customer Walkout / Unpaid Tab**
  - **Action:** A table dines, and after the bill is printed, the staff discovers the customers have physically sneaked out and ran away without paying.
  - **Journey:** The table is stuck in **Orange (Billing)**. The Cashier calls the Manager. The Manager inserts a PIN, selects "Write Off - Runner/Walkout" so the restaurant accurately tracks it as stolen shrinkage instead of an honest void, and forcefully changes the table back to "Dirty" so it can be cleaned for the next real customer.
- **Scenario 29: Edge Case - Delayed GCash / Maya SMS Confirmation**
  - **Action:** A customer pays via GCash QR, but the SMS confirmation to the store's phone is delayed by 5 minutes due to network lag. The customer is waiting at the register.
  - **Journey:** The cashier puts the table in a "Pending Payment" hold state in the POS, which flags the table Orange but prevents checkout. Once the SMS arrives 5 minutes later, the Cashier fully completes the transaction.

---

## 5. The Host / Receptionist
**Goal:** Manage waitlists, seat guests evenly, and calculate turnover times to maximize daily seating count.

- **Scenario 30: Managing the Waitlist Queue**
  - **Action:** On a Friday night, the restaurant is 100% full with 5 groups waiting outside.
  - **Journey:** The Host uses their tablet linked to the POS to add "Group: Reyes, 4 Pax" to the queue. Because the system tracks exact elapsed dining times for Unli packages, the Host can sort the floor view by "Time Remaining." They see Table 2 has 10 minutes left and Table 9 has 5 minutes left. They accurately inform the Reyes family: "Your wait time is 10 to 15 minutes."
- **Scenario 31: Coordinating with Bussers for Immediate Seating**
  - **Action:** Table 9 turns **Dark Gray (Dirty)** on the POS, meaning checkout is complete.
  - **Journey:** The Host physically spots a busser and points to Table 9. 60 seconds later, the Cashier hits "Mark as Clean" and the table turns **White (Available)** on the Host's tablet. The Host immediately walks the Reyes family to Table 9.
- **Scenario 32: Edge Case - Broken Grill Bottleneck**
  - **Action:** Table 5's builtin grill completely breaks and cannot be fixed immediately. The table itself is useless for cooking.
  - **Journey:** The Host manually taps Table 5 in the POS and selects "Mark as Out Of Order." The table icon turns completely dim with a "Wrench" icon, visually hiding it from the "Available Seats" counter so the Host never accidentally promises the space to a waiting group.

---

## 6. The Waiter / Server
**Goal:** Refill side dishes, assist customers with grilling, and rapidly input mid-meal requests.

- **Scenario 33: Mid-Meal Drink Up-sells**
  - **Action:** The Server notices Table 3's drinks are empty and recommends Soju.
  - **Journey:** The Server pulls out their mobile ordering pad (or signals the cashier). They tap Table 3 -> Drinks -> 2x Soju. The order is fired to the Barista screen instantly without the Server having to walk back to the register.
- **Scenario 34: Responding to System "Time-Up" Cues**
  - **Action:** Table 14 turns **Yellow (15 mins left)** on the POS display.
  - **Journey:** The Server sees the yellow blinking light. They proactively walk over to Table 14 and say "Hello! Last call for unlimited meats as you have 15 minutes remaining on your timer." The customer feels well attended to, and the restaurant enforces its turnover limits without seeming rude.
- **Scenario 35: Changing Charcoal / Grills**
  - **Action:** A customer requests a grill change because the meat is charring.
  - **Journey:** The Server signals the Kitchen/Expediter to prepare a fresh hot grill pan and safely swaps the grates at the table manually.
- **Scenario 36: Edge Case - Waiter Processing Customer Broken Plate Fee**
  - **Action:** A customer accidentally knocks an expensive crystal Soju tower off the table, shattering it.
  - **Journey:** The Waiter alerts the Cashier. The Cashier uses the POS to append a "Breakage Fee - Drinkware" manually to the table's running bill so inventory shrinkage is immediately accounted for and the customer compensates the loss before checkout.

---

## 7. The Expediter (Food Checker)
**Goal:** Connect the kitchen to the servers, ensuring precisely correct plates go to the exact table.

- **Scenario 37: Ensuring Meat Quality Before Serving**
  - **Action:** The butcher places 5 plates of sliced pork on the pass.
  - **Journey:** The Expediter looks at the synchronized KDS display: "Table 4 needs 3 Pork, Table 2 needs 2 Pork." They physically inspect the meat for proper fat ratio. Approving it, they place the plates on a tray, tap "Bump" on the KDS to clear the tickets, and hand the tray to a Runner specifying "Table 4 and Table 2."
- **Scenario 38: Handling VIP Expedites**
  - **Action:** Table 7 (the owner's friends) orders an a-la-carte Wagyu platter.
  - **Journey:** The order prints at the Expediter station with a "VIP" or "Priority" star. The Expediter loudly calls to the Butcher to prioritize the Wagyu slab. Once plated, the Expediter delivers it personally to guarantee presentation.
- **Scenario 39: Edge Case - Kitchen Refusals / Send Backs**
  - **Action:** A customer complains that their side dish of Kimchi tastes sour/spoiled, and sends it back via the waiter.
  - **Journey:** The Expediter immediately halts all Kimchi distribution. They use the KDS tablet to broadcast an "86-Kimchi" alert which grays out Kimchi on all POS terminals to prevent any new orders until a fresh batch is validated.

---

## 8. The Busser / Dishwasher
**Goal:** Clear plates rapidly to increase table turnover rate and manage the large flow of raw meat platters safely.

- **Scenario 40: Clearing "Dirty" Status Tables**
  - **Action:** A table leaves the restaurant.
  - **Journey:** The table is marked **Dark Gray (Dirty)** on the POS workflow. The Busser brings the clearing bin, wipes down the exhausts and table surface, and gives a thumbs-up to the Cashier. The Cashier hits `✨ Mark as Clean`, turning the table White.
- **Scenario 41: Clearing Excess Plates Mid-Meal**
  - **Action:** Table 5 has accumulated 10 empty small side dish plates (banchan).
  - **Journey:** The Busser silently clears the empty dishes to make space for the upcoming massive meat boards the Expediter is trying to serve.

---

## 9. The Barista / Drinks Station
**Goal:** Serve iced drinks, alcoholic beverages, and blended shakes without bottlenecking the meat kitchen.

- **Scenario 42: Fulfilling Drink/Bar Tickets**
  - **Action:** A table orders a Soju cocktail tower.
  - **Journey:** Unlike meat orders which route to the Butcher's KDS, drink orders instantly route specifically to the Barista's ticket printer or mini-screen format. The Barista preps the glasses, ice, and mixes the tower, wiping the counter.
- **Scenario 43: Automatic Stock Deduction of Mixers**
  - **Action:** The Barista makes a "Melon Soju Yakult" using 1 Yakult bottle, 1 Soju bottle, and 50ml of Melon Syrup.
  - **Journey:** As soon as the Cashier inputs the order, the system behind-the-scenes automatically deducts the raw components based on the recipe card programmed by the Manager. The Stock Controller never has to manually deduct Yakult later.
- **Scenario 44: Edge Case - Power Outage During Busy Hour**
  - **Action:** The power abruptly cuts out, taking the displays offline.
  - **Journey:** The Barista's local battery-backed receipt printer prints the last 3 unsent drink tickets just before turning off completely, allowing the Barista to finish crafting the pending drinks in the dim ambient light rather than losing the orders.

---

## 10. The Customer
**Goal:** Enjoy the food, experience fast service, and have clear expectations about wait times and limits.

- **Scenario 45: Arrival and Waiting**
  - **Journey:** The customer arrives and sees a packed restaurant. Because the POS tracks exact table states (Eating vs. Billing vs. Dirty), the host gives them a highly accurate wait time estimate ("There are 3 tables currently paying, it will be about 5 minutes").
- **Scenario 46: The Unli Time Limit Experience**
  - **Journey:** The customer buys a 2-hour unlimited package. The POS starts a countdown. 
  - **At 1 hour 45 minutes:** The table icon on the POS pulses **Yellow**. A waiter spots this, approaches the table, and politely says, "Excuse me, you have 15 minutes left. Would you like to request any last plates of meat?"
  - **At 2 hours:** The table icon pulses **Red** with a red ring. The waiter brings the final bill without awkward manual tracking or the customer feeling abruptly cut off, as they were forewarned.
- **Scenario 47: Pre-ordering Takeaway Over the Phone**
  - **Journey:** The customer calls ahead 45 minutes before arriving to pre-order food to avoid wait times. Thanks to the digital takeaway lane tracking completion times, the cashier promises to only trigger the kitchen 15 minutes prior to arrival so the meat doesn't get soggy by the time the customer physically comes to grab the bag.
- **Scenario 48: Noticing the "Dirty" Indicator Loophole**
  - **Journey:** The customer sees an empty table un-bussed, but they don't have to awkwardly ask "Is this table free?" because the Host's waiting list system is fully transparent based on the POS. They wait comfortably by the door until seated.
- **Scenario 49: Edge Case - Senior Citizen / PWD Split Group Discount Calculations**
  - **Action:** The group of 5 finishes eating. 2 of the 5 customers hand the cashier Senior Citizen ID cards.
  - **Journey:** The customer expects a smooth checkout. The Cashier scans or manually applies the "Senior Citizen" discount button specifically mapping to `-2 Pax` worth of VAT exemptions and 20% deductions automatically within the POS logic, avoiding any manual calculator math that frustrates the waiting customer.
- **Scenario 50: Edge Case - Refusing to Pay Breakage/Leftover Surcharge**
  - **Action:** The customer gets furious at a "Waste Surcharge" being applied and demands to speak to a manager, flatly refusing to pay the extra ~₱500 logic.
  - **Journey:** The Manager attempts to de-escalate. Eventually deciding customer retention is worth losing ₱500, the Manager uses their POS fingerprint/PIN to strictly waive ONLY the "Penalty Surcharge" item, dropping the ticket back to normal without disrupting the core package prices.
- **Scenario 51: Edge Case - Requesting a Change of Meat Variety Post-Order**
  - **Action:** A customer mistakenly thought "Spicy Pork" was mild, eats one piece, and realizes it's way too hot. They immediately request to swap it.
  - **Journey:** Because the item was already "Bumped" on the KDS, the cashier handles an "Exchange" function in the app. The system logs a 100g "Quality Return/Waste" for the spicy pork and fires a fresh `*RUSH - REPLACEMENT* Mild Pork` chit straight to the KDS pushing it to the front of the butcher's queue.

---

## 11. Complex Edge Cases & System Stressors
**Goal:** Define how the system gracefully handles the absolute worst-case operational complexities unique to K-BBQ environments without crashing or paralyzing the floor staff.

- **Scenario 52: Extreme Edge Case - "The Mixed Table" (Unli + Kids + Ala-Carte)**
  - **Action:** A family of 6 arrives. 4 adults want the "Premium Beef & Pork Unli", 1 child is under 4ft (which means they eat FREE), and 1 grandparent doesn't want Unli, just a single Ala-Carte bowl of Bibimbap.
  - **Journey:** Most POS systems break because they force "per table" pricing. In WTFPOS, the Cashier seats "6 Pax". They select 4x "Premium Unli" and assign them to Seats 1-4. They select 1x "Kids Free (Under 4ft)" for Seat 5, validating the free unli access while assigning an inventory tracking pack. Finally, they assign 1x "Ala-Carte Bibimbap" to Seat 6. The overall table timer begins based strictly on the 4 paying Unli adults, and the system explicitly restricts ordering Unli refills on the KDS beyond the limit of 4 active pax worth of portions.
- **Scenario 53: Extreme Edge Case - Central Warehouse to Branch Meat Transfer**
  - **Action:** The restaurant group has a central commissary (warehouse) that pre-marinates 100kg of Spicy Pork, which needs to be dispatched to 3 separate branches logically.
  - **Journey:** The Warehouse Manager logs into the Cloud Admin Portal. They select "Bulk Transfer Out" and specify: 40kg to Makati, 40kg to QC, 20kg to BGC. 
  - The stock leaves the Warehouse system, but immediately enters a "In Transit" limbo state. It does NOT appear in the Branch's front-stock yet.
  - 2 hours later, the QC Branch Manager physically receives the truck, weighs the container, notices it's only 39.5kg, and taps "Receive Transfer" on their POS -> inputting 39.5kg. The system automatically tags 0.5kg as "Transit Shrinkage/Spill" and completes the loop seamlessly.
- **Scenario 54: Extreme Edge Case - Device Crash Mid-Payment**
  - **Action:** The Cashier taps "Pay - ₱2,000 Cash", the drawer pops open, but immediately the iPad/Desktop tablet overheats or runs out of battery and dies before printing the receipt.
  - **Journey:** The Manager grabs a backup tablet and logs in. Because WTFPOS utilizes cloud-state locking, Table 7 is still marked as "Processing Payment - Awaiting Print". The Manager clicks Table 7, and taps "Recover & Reprint Receipt", completing the transaction without double-charging the table or dealing with lost data.
- **Scenario 55: Extreme Edge Case - LPG / Gas Exhaustion During a Rush**
  - **Action:** The kitchen's main gas lines run dry right in the middle of a dinner rush. Anything needing a stove (Soups, Fried Rice, Tempura) cannot be made, but Charcoal grills (Raw Meats) and Cold items (Drinks, Salads) are fine to serve.
  - **Journey:** The Kitchen Manager doesn't have time to manually 86 (disable) every single cooked item one by one. They immediately open the Admin KDS Settings, hit "Disable Kitchen Station - Hot Prep (Gas)". Instantly, every cooked menu item across all POS tablets dynamically grays out, saving the front-of-house from punching in 50 soup orders that can't be fulfilled.
- **Scenario 56: Extreme Edge Case - The "Sneaky Saver" Mid-Meal Downgrade Attempt**
  - **Action:** A table started on the highest "Wagyu Unli" package. After 1 hour, they've secretly stuffed themselves with Wagyu. They call the waiter and say, "Actually, my friends don't like the wagyu, can we switch back to the Basic Pork package to save money?"
  - **Journey:** They've already consumed Wagyu. In the POS, the Cashier attempts to "Downgrade Package". The system physically blocks the downgrade and flashes: "ERROR: Premium items (Wagyu x4) already served on this ticket." The POS protects the restaurant's margins without requiring the Cashier to debate the customer; they can just politely say, "I'm sorry, the system locks the package once those specific premium meats have already touched the table."
- **Scenario 57: Extreme Edge Case - Employee Walkout/Rage Quit**
  - **Action:** A Cashier gets angry, abandons their post mid-shift, takes their PIN with them, and leaves the restaurant with 15 tables currently actively seated under their shift responsibility.
  - **Journey:** The Manager goes to the Admin tablet. They select the runaway Cashier's profile and hit "Emergency Suspend Shift". The POS instantly forces all 15 active tables to transfer ownership to the Manager's PIN without resetting any timers, and generates an impromptu "Z-Read" (shift close) for the runaway Cashier exactly up to the minute they were suspended, so cash drawers can be blind-audited immediately to check for theft.

---

## 12. Hyper-Specific Operational Scenarios
**Goal:** Address nuanced, day-to-day granular interactions to ensure the UI is flexible enough for real-world chaos.

- **Scenario 58: "Pay By Item" Split Checkout**
  - **Action:** A table of 3 finishes eating. One person says "I'll pay for all the alcohol and my own Unli package", and the other two want to split the rest of the bill equally.
  - **Journey:** Rather than pulling out a calculator, the Cashier hits "Split Bill -> By Item". A drag-and-drop UI opens. The Cashier drags the "Soju x5" and "Unli Pork x1" to **Guest 1's Bill**. The remaining items are left on the Master Bill, and the cashier hits "Split Remaining Evenly by 2". The POS instantly prints 3 completely separate, perfectly calculated receipts.
- **Scenario 59: Waiter Dropped Food (Shrinkage vs Table Limits)**
  - **Action:** A runner is carrying 3 plates of Premium Beef to Table 12. They trip, and the meat falls on the floor. 
  - **Journey:** Table 12 didn't receive the meat, but the item was already marked "Done" on the KDS and deducted from inventory. The Manager opens the POS, taps Table 12's ticket history, selects those specific 3 plates, and clicks "Mark as Dropped/Spoiled". The POS re-adds the 3 items back to the active KDS queue with a `*REFIRE*` tag so the kitchen makes it immediately, while silently logging the loss in the daily Waste Report.
- **Scenario 60: Take-Home Raw Inventory (Off-premise sales)**
  - **Action:** A customer loves the restaurant's signature Gochujang marinade and wants to buy a raw tub of it to take home, but they are already seated eating their Unli meal.
  - **Journey:** To avoid messing up the Unli tax structures or limits, the Cashier simply taps "Retail Item" on the current table's ticket, adding "500g Raw Marinade - Retail" to the bill. It is exempted from the service charge normally applied to the Dine-in sections of the bill, and bypasses the KDS entirely to print a label at the cashier station.
- **Scenario 61: The "Dine & Dash" Partial Recovery**
  - **Action:** A group of 4 eats. 3 of them leave to "smoke" and run away. The final person at the table realizes they were abandoned and only has enough cash to pay for their own portion (₱600).
  - **Journey:** The Cashier calls the Manager. The Manager accepts the ₱600 from the honest customer to let them leave. The Manager then highlights the remaining ₱1,800 balance and hits "Write-Off -> Partial Walkout". This closes the table state, registers ₱600 in valid revenue, and correctly accounts for the ₱1,800 shrinkage without freezing the POS terminal on an unpayable bill.
- **Scenario 62: Correcting a Tender Mistake (The Extra Zero)**
  - **Action:** The bill is ₱1,500. The customer hands over two ₱1000 bills. The Cashier accidentally types `20000` into the "Cash Tendered" field and hits Enter.
  - **Journey:** The cash drawer pops open, and the POS falsely claims the cashier owes ₱18,500 in change. Since the transaction finalized, the Cashier panics. The Manager uses their PIN to enter the "Receipt History", selects the mis-typed receipt, and clicks "Edit Tender Amount". They change `20000` to `2000` and hit save. The End-Of-Day cash expectations automatically correct themselves.
- **Scenario 63: Processing a Historical Refund (Next Day Complaint)**
  - **Action:** A customer returns the day after dining with a receipt, complaining they found a bug in their takeaway soup and demanding a refund.
  - **Journey:** The Manager opens the POS "Audit / Global Search". They scan the barcode on the customer's receipt or type the ticket ID. The previous day's transaction appears. Because the exact shift is already closed and the money is in the bank, the Manager selects "Issue Historical Refund -> Cash Out of Register" for the exact ₱250 soup. The system prints a negative receipt to drop into today's cash drawer, keeping accounting perfectly balanced across different business days.
- **Scenario 64: Staff Meals (Consumption Tracking)**
  - **Action:** It's 3:00 PM (break time). The 5 staff members are allowed to eat 1kg of Basic Pork and rice for their staff meal.
  - **Journey:** The Manager punches the food into a reserved table named "STAFF MEAL". Instead of hitting "Pay", they hit "Charge to Staff/Internal". The inventory correctly deducts the 1kg of pork and rice, but registers ₱0 revenue. This prevents the stock controller from thinking 1kg of meat was stolen at the end of the month.
- **Scenario 65: Applying Automatic Gratuity for Large Groups**
  - **Action:** A corporate party of 30 people arrives without a reservation. The restaurant policy states groups over 10 automatically get a 10% Service Charge applied.
  - **Journey:** The Host inputs "30 Pax" during seating. The WTFPOS immediately detects the threshold and seamlessly appends an un-removable "Auto-Gratuity (10%)" line item to the bottom of the live ticket. When the corporate group asks to split the bill 30 ways later, the 10% service charge is mathematically distributed perfectly across all 30 sub-receipts. 
- **Scenario 66: The "Bring Your Own Bottle" (Corkage Fee)**
  - **Action:** A group brings a premium bottle of Whiskey from outside into the restaurant.
  - **Journey:** The server spots it and alerts the Cashier. The Cashier taps the table and selects "Add Fast Item -> Corkage Fee - Hard Liquor". The POS charges a flat ₱500 to the bill. To prevent waiters from circumventing this rule for their friends, the system logs exactly which server was assigned to the table, holding them accountable if a manager later sees a bottle on the table but no corkage on the live ticket.

---

## 13. System Resilience, Loyalty, and Accounting Anomalies
**Goal:** Prove the platform handles complex taxation, customer loyalty, and aggressive hardware faults dynamically.

- **Scenario 67: Zero-Rated VAT (Diplomat / Special Economic Zone Exemption)**
  - **Action:** A diplomat or PEZA (special economic zone) registered company hosts a dinner. They supply their government-issued ID that legally exempts them from the 12% standard Value Added Tax.
  - **Journey:** Most basic POS systems cannot strip built-in taxes dynamically. In WTFPOS, the Cashier hits "Select Tax Exemption -> Zero-Rated VAT". The system instantly strips precisely 12% off the *VATable* base of every single item on the receipt, ensuring the restaurant's accounting backend properly logs this as a non-VAT sale avoiding massive end-of-year tax fines.
- **Scenario 68: The "Printer Out of Paper" Queue**
  - **Action:** A customer pays ₱3,500 via Credit Card. The approval flashes on the terminal, the POS hits "Done", but the physical receipt printer loudly beeps because it ran out of paper mid-print.
  - **Journey:** The POS detects the hardware fault instantly. Instead of losing the receipt to the void, the UI flashes a "Printer Error - Paper Out" dialog. Once the Cashier drops a new roll of thermal paper in, they tap "Retry Print" on the prompt, and the exact receipt buffer continues from where it crashed without the Cashier having to dig through the Audit Log to manually reprint.
- **Scenario 69: Customer Loyalty Points Redemption vs. Split Bills**
  - **Action:** A loyal customer wants to burn 500 "WTF Reward Points" (₱500 value) to pay for part of a ₱3,000 group bill, but the group wants to split the remaining ₱2,500 equally among 5 people (₱500 each).
  - **Journey:** The Cashier asks for the customer's phone number and logs them into the "Loyalty" tab of the ticket. The ₱500 reward is applied globally to the Master Ticket as a "Tender Type: Points". *Then*, the Cashier hits "Split Remaining by 5". The system intelligently calculates that the *remaining balance* is ₱2,500 and issues 5 receipts for exactly ₱500 each.
- **Scenario 70: Kitchen Printer Jam / Network Drop "Silent Failure"**
  - **Action:** The traditional kitchen dot-matrix receipt printer (for hot soups) silently jams or its ethernet cable is kicked loose by a busy chef.
  - **Journey:** Normally, the Cashier punches in a soup and assumes the kitchen is cooking it, leading to 30-minute delays and angry customers. WTFPOS tracks explicit print confirmations. After 5 seconds of the printer not confirming it received the soup ticket, the Cashier's POS flashes a red banner: **"WARNING: HOT STATION PRINTER OFFLINE - TICKET FAILED."** The Cashier knows immediately to walk to the kitchen and shout the order.
- **Scenario 71: Suspicious Drawer Pops (No Sale Abuse)**
  - **Action:** A cashier repeatedly opens the cash drawer without an active transaction by hitting the physical "No Sale" button on the terminal just to "make change" or secretly pocket small bills.
  - **Journey:** Every single "No Sale" or "Open Drawer" action triggered via hardware is logged by WTFPOS with a strict timestamp and the active Cashier PIN. The next morning, the Manager sees "Drawer Opened 14 Times Without Sale" on the Audit report. The Manager checks the CCTV at those 14 exact timestamps to ensure the Cashier wasn't stealing.
- **Scenario 72: Offsetting Over-Payments via Store Credit**
  - **Action:** A table's bill is ₱1,950. The customer pays with two ₱1000 bills (₱2000 total). The restaurant literally has zero coins or ₱50 bills left in the entire building to give change.
  - **Journey:** The Cashier apologizes profusely and offers a solution. On the POS, instead of registering ₱50 change to cash (which they can't do), they select "Issue Change as Store Credit". The receipt prints with a scannable Barcode worth exactly ₱50 that the customer can bring back on their next visit, keeping the Cash Drawer mathematically perfect without short-changing the customer.
- **Scenario 73: The "Ghost" Takeaway Order (Forgotten Pickups)**
  - **Action:** A customer orders Unli-Pork Takeaway over the horn at 1:00 PM. The kitchen cooks it by 1:15 PM and it sits in the Blue Takeout Lane. By 4:00 PM, the customer never showed up.
  - **Journey:** The Takeaway lane color-codes staleness. At 3 hours old, the ticket turns severely **Red**. The Manager decides the meat is now unsafe/cold. They tap the ticket, select "Void - Abandoned Pickup," and the system logs the food waste explicitly under a "Customer No-Show" metric rather than "Kitchen Error/Spoilage", so the owner knows why margins dipped that day.
- **Scenario 74: VIP Priority Bumping (Overriding the FIFO Queue)**
  - **Action:** The restaurant is slammed. The KDS has 40 plates of beef queued sequentially (First-In, First-Out). The Mayor of the city walks in and orders.
  - **Journey:** The Manager punches the Mayor's order but explicitly toggles "VIP RUSH" on the ticket. The WTFPOS system bypasses the FIFO (First-in First-Out) logic of the KDS entirely, aggressively inserting the Mayor's ticket strictly at "Position #1" on the butcher's screen regardless of the 40 other plates waiting.
- **Scenario 75: End of Day "Blind Close" to Prevent Skimming**
  - **Action:** It's 11:00 PM. The Cashier wants to go home. Usually, POS systems tell the cashier exactly how much "Should" be in the drawer (e.g., ₱45,000), so shady cashiers just take everything above ₱45,000 as a "tip".
  - **Journey:** WTFPOS enforces a "Blind Close". When the Cashier hits "End Shift", the screen goes blank and demands they manually count and input exactly how many ₱1000s, ₱500s, ₱100s are physically in the drawer without giving them the target number. If they input ₱45,500 (but the system expected ₱45,000), the system silently logs a ₱500 overage variance for the Manager's eyes only, eliminating the Cashier's ability to skim the exact excess.

---

## 14. Ingredient Lifecycle & Complete Spoilage Tracking
**Goal:** Track the granular journey of food from receiving to serving, spoiling, or returning.

- **Scenario 76: Granular Ingredient Depletion (The "No More Garlic" Cascading Effect)**
  - **Action:** A busy Saturday lunch drains the exact physical stock of Minced Garlic down to 0 grams.
  - **Journey:** Because WTFPOS utilizes true recipe-level depletion, the moment the 500th order of "Garlic Butter Pork" is punched in, the system registers Garlic = 0. Instantly, *every* menu item that explicitly requires Garlic (e.g., Spicy Garlic Beef, Garlic Rice, Garlic Butter Plate) dynamically grays out on the POS and the KDS. The Cashier doesn't need to manually guess what they can't sell—the system handles the cascading outage automatically.
- **Scenario 77: Near-Spoilage Predictive Alerts (FIFO Rotation)**
  - **Action:** A batch of 20kg of Premium Wagyu was delivered 4 days ago and its shelf life is only 5 days.
  - **Journey:** The WTFPOS inventory module tracks batches by exact delivery date. When the manager logs in, a yellow banner flashes on the dashboard: `Warning: 20kg Wagyu expiring in 24 hours (Batch: #882)`. The manager immediately tells the servers to heavily push and upsell the Wagyu tier that night, running a targeted "Wagyu Promo" to liquidate the aging stock before it becomes total financial loss.
- **Scenario 78: Supplier Quality Rejects (Immediate RTV/Return To Vendor)**
  - **Action:** The delivery truck drops off 50kg of Pork Belly, but the receiver immediately smells that 10kg of it has spoiled in transit.
  - **Journey:** The Stock Controller refuses the bad boxes. Instead of artificially receiving 50kg and awkwardly "Spoiling" 10kg on the restaurant's dime, they tap "Receive Inventory -> Partial Accept". They input `Accepted: 40kg`, and flag `Returned: 10kg (Supplier Quality Reject)`. The system generates a digital RTV (Return To Vendor) debit memo, ensuring the restaurant's accounts payable department only pays the supplier for 40kg.
- **Scenario 79: Post-Prep Spoilage (The "End of Night Dump")**
  - **Action:** It's 11:30 PM closing time. The kitchen has 2kg of chopped Kimchi left on the prep line that cannot be saved for tomorrow.
  - **Journey:** The Kitchen Manager opens the POS Waste module and selects "Prepared Food Waste". They log "2kg Kimchi" under the specific reason code `EOD Toss-Out`. Next week, the owner reviews the Waste Report and notices a persistent pattern of 2kg of Kimchi being tossed every single night. The owner orders the kitchen to reduce morning prep volumes to plug the leak in profits.

---

## 15. The Owner & The Data Management Sandbox
**Goal:** Prove the platform empowers upper management and silent partners to manipulate, isolate, and forecast their restaurant's data securely without touching the floor.

- **Scenario 80: The "Silent Partner" Dashboard Check**
  - **Action:** An investor who lives in another country wants to know if their 30% stake in the Makati branch is paying off.
  - **Journey:** They log into the WTFPOS cloud portal using an "Investor-Read-Only" role. They cannot change prices or see employee wages, but they have access to a live Dashboard showing real-time `Total Gross Sales`, `Pax Count`, and `Average Spend per Head`. They see the current daily average is ₱840 per customer, satisfying their ROI projections without ever texting the busy operational manager.
- **Scenario 81: Price Experimentation (A/B Testing the Menu)**
  - **Action:** The owner thinks raising the "Unli Basic Promo" from ₱499 to ₱549 will increase profits without hurting volume, but isn't sure.
  - **Journey:** In the Admin Cloud, the Owner clones the menu profile and schedules the ₱549 price change to *only* apply at the lesser-performing local branch for exactly one week. After 7 days, they use the `Comparative Sales Report` to overlay the data. They see volume dropped by 2%, but overall gross revenue rose by 8%. Armed with hard data, they confidently roll out the ₱549 price hike to all branches simultaneously with one click.
- **Scenario 82: The "Cost of Goods Sold" (COGS) Margin Analysis**
  - **Action:** Beef prices have surged globally, and the owner is worried they're losing money on every group that orders the Premium tier.
  - **Journey:** The Owner opens the `COGS & Margin` report. Because the butcher accurately logs yield and cashiers log sales, WTFPOS knows exactly how many grams of beef flow out daily. The system flags the "Premium Beef Package" in scary red text, calculating that its food cost percentage has spiked to 55% (well above the healthy 30% target). The owner realizes they need to immediately switch suppliers or increase the package price.
- **Scenario 83: Exporting to Accounting via API (The Monthly Close)**
  - **Action:** It's the 1st of the month, and the outsourced accountant needs all the sales and tax data from the previous 30 days to file paperwork with the government.
  - **Journey:** Instead of the manager manually downloading and emailing 30 messy Excel sheets, the Accountant simply logs into their connected Quickbooks/Xero software. WTFPOS's API has already pushed every closed shift, separated by `VAT Sales`, `Zero-Rated Sales`, and `SC/PWD Discounts` directly into the correct ledger accounts. The accountant finishes the monthly tax filing in 5 minutes.
- **Scenario 84: Identifying "Dead Weight" Menu Items**
  - **Action:** The owner feels the menu is too cluttered with obscure side dishes holding up prep time.
  - **Journey:** They pull the `Product Mix` velocity report, sorting by "Least Ordered". They immediately see that "Spicy Octopus Rings" have only been ordered 4 times in the last 30 days, yet the restaurant wastes money constantly stocking the ingredients. The owner deletes it from the central menu, simplifying the kitchen's life drastically.
- **Scenario 85: Tracing Fraud (The "Manager Void" Abuse Pattern)**
  - **Action:** The owner notices overall profits are down slightly at the QC branch despite headcounts remaining identical.
  - **Journey:** Opening the `Void & Override` audit, WTFPOS provides a scatter plot of when voids occur. The owner notices a glaring anomaly: "Manager PIN #002 (John) manually voids exactly 2 whole tables every Friday at 10 PM right before closing." The owner isolates the exact timestamp, checks the local CCTV footage, and catches the manager pocketing the cash from those two tables. The owner initiates termination.
