# WTFPOS Scenario Viability Assessment

**Assessment Date:** 2026-03-04  
**App Status:** In-Memory Mock Data (No Backend)  
**Tech Stack:** SvelteKit + Svelte 5 Runes  

---

## 1. The Manager / Owner

### Scenario 1: Morning Review & Analytics
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- The app has a comprehensive reporting suite with 11 report types including End of Day (EOD) reports at [`/routes/reports/eod/+page.svelte`](src/routes/reports/eod/+page.svelte:1)
- Payment breakdowns for Cash vs GCash/Maya are tracked in the EOD summary via [`eodSummary()`](src/lib/stores/reports.svelte.ts:117) function
- Void and Discount Logs are partially available through the audit log system in [`audit.svelte.ts`](src/lib/stores/audit.svelte.ts:1)
- **Gap:** No dedicated "Void & Discount Logs" report view - audit logs are generic and not filtered by voids/discounts specifically
- **Gap:** No automated anomaly detection for "strange voids during busy hours"

### Scenario 2: Menu & Pricing Updates
**Score:** ❌ NOT SUPPORTED

**Notes:**
- Menu items are hardcoded in [`MENU_ITEMS`](src/lib/stores/pos.svelte.ts:38) array in the POS store
- There is no Menu Editor UI - prices cannot be changed without modifying source code
- Changes would require restarting the dev server and redeploying
- **Gap:** No dynamic menu management system exists

### Scenario 3: Floor Layout Changes
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Full floor editor exists at [`/admin/floor-editor/+page.svelte`](src/routes/admin/floor-editor/+page.svelte:1)
- Drag-and-drop table positioning with grid snap implemented
- Table creation, deletion, and property editing (label, capacity) all functional
- Changes are reactive and apply immediately to the POS floor view
- [`updateTableLayout()`](src/lib/stores/pos.svelte.ts:152) function handles layout persistence in memory

### Scenario 4: Multi-Branch Monitoring
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Owner can switch between QC and Makati branches via the branch dropdown in [`TopBar.svelte`](src/lib/components/TopBar.svelte:1)
- "All Branches" mode exists and shows combined data across branches
- Live table statuses are visible per branch
- **Gap:** No true real-time synchronization (mock data only, no WebSocket/real-time backend)
- **Gap:** No bird's-eye dashboard showing both branches simultaneously in one view

### Scenario 5: Recording Operational Expenses
**Score:** ❌ NOT SUPPORTED

**Notes:**
- Expenses module is stubbed at [`/routes/expenses/+page.svelte`](src/routes/expenses/+page.svelte:1) with a placeholder
- **Gap:** No expense recording functionality implemented
- **Gap:** No Petty Cash tracker exists
- **Gap:** No Cash Out functionality from the register

### Scenario 6: Staff Accountability & Payroll Logging
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Audit log tracks which user performed actions via [`writeLog()`](src/lib/stores/audit.svelte.ts:43)
- User roles and PIN-based authentication exist in [`session.svelte.ts`](src/lib/stores/session.svelte.ts:1)
- Actions like discounts and voids are logged with user attribution
- **Gap:** No staff performance metrics or "most tables handled" analytics
- **Gap:** No payroll integration or hours tracking
- **Gap:** Void abuse detection is manual only

### Scenario 7: VIP & Comping Meals
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Manager PIN override exists (hardcoded `1234` in [`pos/+page.svelte`](src/routes/pos/+page.svelte:170))
- Void functionality requires manager PIN
- 100% discount could be applied by setting items as `forceFree` via [`addItemToOrder()`](src/lib/stores/pos.svelte.ts:185)
- **Gap:** No explicit "Owner Comp" discount type
- **Gap:** Stock is automatically deducted but not specifically tagged as comp

---

## 2. The Store Manager (Floor Operations)

### Scenario 8: Spot-Checking the Cash Drawer Mid-Shift
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No X-Read (Mid-Shift Audit) functionality exists
- **Gap:** No drawer tracking or blind count mechanism
- **Gap:** No slip printing capability

### Scenario 9: Resolving a Customer "Allergy Panic"
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No Global Search feature for menu items
- **Gap:** No ingredient breakdown or allergen warnings stored in [`MenuItem`](src/lib/types.ts:38) type
- **Gap:** No item info cards showing allergen data

### Scenario 10: Server Reassignments / Shift Handover
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No server/waiter assignment tracking on tables
- **Gap:** No "Reassign Server" functionality
- Orders track only by table, not by server

### Scenario 11: Approving a Legitimate Void (Mistapped Order)
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Manager PIN modal for voids fully implemented at [`pos/+page.svelte`](src/routes/pos/+page.svelte:166)
- [`MANAGER_PIN = '1234'`](src/routes/pos/+page.svelte:170) hardcoded for approval
- [`voidOrder()`](src/lib/stores/pos.svelte.ts:230) function cancels items and logs to audit
- Items marked as 'cancelled' status in the order

### Scenario 12: Calling in Maintenance for Broken Hardware
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- App is cloud-native with state in Svelte 5 runes (memory-based)
- Logging in on a different device would show the same state (within the same memory instance)
- **Gap:** No actual cloud persistence or multi-device sync (single-browser memory only)
- **Gap:** No messaging/communication feature to notify owner

### Scenario 13: Issuing a "Service Recovery" Discount
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Discount types exist: 'none', 'senior', 'pwd', 'promo' in [`DiscountType`](src/lib/types.ts:70)
- [`applyDiscount()`](src/routes/pos/+page.svelte:85) function applies discounts with logging
- **Gap:** No specific "Service Recovery" discount type with reason code
- **Gap:** Discounts are generic and not categorized by reason

---

## 3. The Butcher / Kitchen Prep

### Scenario 8: Receiving and Yielding a Beef Slab
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Stock adjustments can be made via [`adjustStock()`](src/lib/stores/stock.svelte.ts:219) with meat-specific fields
- Meat adjustments support `MeatAnimal` and `MeatCutType` types
- **Gap:** No specific "Yield Calculation" UI showing 70% yield metrics
- **Gap:** No dedicated butcher interface for logging cuts (bones vs usable vs trimmings)
- **Gap:** Variance tracking is manual, not automatic

### Scenario 9: Waste Logging
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Waste logging fully implemented at [`/stock/waste/+page.svelte`](src/routes/stock/waste/+page.svelte:1)
- [`logWaste()`](src/lib/stores/stock.svelte.ts:205) function with reason codes
- Manager PIN **not** currently required for waste logging
- Waste appears in reports and audit logs

### Scenario 10: Fulfilling KDS (Kitchen Display System) Orders
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- KDS fully functional at [`/kitchen/orders/+page.svelte`](src/routes/kitchen/orders/+page.svelte:1)
- Tickets show table numbers, items, quantities, and timestamps
- [`markItemServed()`](src/lib/stores/pos.svelte.ts:254) updates item status to 'served'
- Kitchen can view all active orders

### Scenario 11: Special Dietary Instructions
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Order items have a [`notes`](src/lib/types.ts:67) field for special instructions
- Notes are displayed on KDS tickets
- **Gap:** No visual highlighting (glowing, different colors) for allergy warnings
- **Gap:** No dedicated allergy tracking system

### Scenario 12: 86'ing (Marking Sold Out) an Item
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Menu items have [`available: boolean`](src/lib/types.ts:45) flag
- Setting `available: false` grays out items in POS
- **Gap:** No real-time KDS-to-POS sync for 86 (both read from same memory)
- **Gap:** No quick "86 Item" button in KDS interface
- Changes require modifying the MENU_ITEMS array directly

### Scenario 13: Edge Case - Recovering an Accidentally Bumped Ticket
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No KDS "Recall/History" tab
- **Gap:** No undo functionality for accidentally marked-served items
- Once [`markItemServed()`](src/lib/stores/pos.svelte.ts:254) is called, status is permanently 'served'

### Scenario 14: Edge Case - Network Offline Mode
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No offline capability - app requires constant connection (in-memory state)
- **Gap:** No local storage fallback or service worker
- **Gap:** No "OFFLINE" indicator or reconnection logic

---

## 4. The Stock / Inventory Assigned (Stock Controller)

### Scenario 15: Receiving Daily Deliveries
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Delivery receiving fully implemented at [`/stock/receive/+page.svelte`](src/routes/stock/receive/+page.svelte:1)
- [`ReceiveDelivery.svelte`](src/lib/components/stock/ReceiveDelivery.svelte:1) component for inline receiving
- Supplier tracking, receipt numbers, and notes all supported
- [`receiveDelivery()`](src/lib/stores/stock.svelte.ts:191) updates stock immediately

### Scenario 16: Low Stock Alerts during Service
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- [`getStockStatus()`](src/lib/stores/stock.svelte.ts:165) calculates 'ok' | 'low' | 'critical' levels
- **Gap:** No real-time flashing alerts on POS during service
- **Gap:** Alerts only visible if user navigates to stock page
- Stock status computed reactively but not proactively notified

### Scenario 17: Inter-Branch Stock Transfers
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No transfer functionality between branches
- **Gap:** No "In Transit" stock state
- **Gap:** No outgoing/incoming transfer UI
- Each branch's stock is completely isolated

### Scenario 18: Month-end Physical Inventory Audit
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Stock counts fully implemented at [`/stock/counts/+page.svelte`](src/routes/stock/counts/+page.svelte:1)
- [`StockCounts.svelte`](src/lib/components/stock/StockCounts.svelte:1) with 3 periods (10am, 4pm, 10pm)
- [`getDrift()`](src/lib/stores/stock.svelte.ts:180) calculates expected vs counted variance
- Variance report available in reporting suite

---

## 5. The Cashier / Front of House

### Scenario 19: Seating a Walk-in Group
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Full floor plan at [`/pos/+page.svelte`](src/routes/pos/+page.svelte:1)
- Table status colors: White (Available), Green (Occupied), Yellow (Warning), Red (Critical)
- [`openTable()`](src/lib/stores/pos.svelte.ts:64) with pax count and package selection
- Table turns green when occupied, KDS ticket auto-created

### Scenario 20: Processing Takeout & Delivery
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Takeout orders fully implemented via [`createTakeoutOrder()`](src/lib/stores/pos.svelte.ts:80)
- Takeout lane with status colors (Blue=New, Orange=Preparing)
- Separate from dine-in workflow
- Customer name capture supported

### Scenario 21: Split Check Processing
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No split payment by item functionality
- **Gap:** No "Pay By Item" or "Split Remaining" features
- Current payment only supports single method per transaction in [`confirmCheckout()`](src/routes/pos/+page.svelte:119)

### Scenario 22: Adding A-la-carte Mid-Meal
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- "+ ADD" functionality implemented in [`pos/+page.svelte`](src/routes/pos/+page.svelte:217)
- Categories: Packages, Meats, Sides, Dishes, Drinks
- Items added to existing order via [`addItemToOrder()`](src/lib/stores/pos.svelte.ts:185)
- Bill updates immediately, KDS gets new ticket

### Scenario 23: Handling Unhappy Customer Adjustments
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Manager PIN required for voids
- Items can be cancelled with manager approval
- **Gap:** No "substitute dish" workflow - requires manual void + add
- **Gap:** No specific "comp" or "service recovery" item type

### Scenario 24: Edge Case - Table Transferring
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Transfer Table" functionality
- Orders are locked to their original tableId
- Would require closing and reopening order on new table

### Scenario 25: Edge Case - Mid-Meal Package Upgrade
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No package upgrade/downgrade functionality
- Package is set once at [`openTable()`](src/lib/stores/pos.svelte.ts:64) and cannot be changed
- **Gap:** No price difference calculation
- **Gap:** No timer restart option

### Scenario 26: Edge Case - Leftover Surcharge (The "No Leftovers" Rule)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Leftover Penalty" or food waste fee functionality
- **Gap:** No weight-based surcharge system
- Would need to manually add a custom item

### Scenario 27: Edge Case - Adding a Late Joiner
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** Cannot adjust pax count on active table without resetting
- **Gap:** No "Add Pax" functionality mid-session
- Pax is set at table open and fixed

### Scenario 28: Edge Case - Customer Walkout / Unpaid Tab
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Orders can be voided with manager PIN
- **Gap:** No specific "Write Off - Runner/Walkout" category
- **Gap:** No forced table state change to 'dirty' without payment
- Void would set table to 'dirty' but marks order as 'cancelled'

### Scenario 29: Edge Case - Delayed GCash / Maya SMS Confirmation
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- **Gap:** No "Pending Payment" hold state
- **Gap:** Orders immediately go to 'paid' status on checkout
- Would need to leave order as 'open' and manually track externally

---

## 6. The Host / Receptionist

### Scenario 30: Managing the Waitlist Queue
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No waitlist functionality
- **Gap:** No guest queue system
- **Gap:** No estimated wait time calculation based on "Time Remaining"

### Scenario 31: Coordinating with Bussers for Immediate Seating
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Table status flow: Occupied → Billing → Dirty → Available
- [`cleanTable()`](src/lib/stores/pos.svelte.ts:118) marks table as available
- **Gap:** No host-specific tablet interface
- **Gap:** No notification system between busser and host

### Scenario 32: Edge Case - Broken Grill Bottleneck
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Out of Order" table status
- **Gap:** No wrench icon or visual indicator for maintenance
- Would need to manually remember which tables are broken

---

## 7. The Waiter / Server

### Scenario 33: Mid-Meal Drink Up-sells
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Can add items to existing order via "+ ADD" in POS
- Drinks category available
- **Gap:** No mobile ordering pad for servers
- **Gap:** Server must use main POS terminal

### Scenario 34: Responding to System "Time-Up" Cues
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Table countdown timers implemented via [`tickTimers()`](src/lib/stores/pos.svelte.ts:136)
- Visual warnings: Yellow at 15 mins, Red at 5 mins
- Table status changes: occupied → warning → critical
- Server can see table status on floor plan

### Scenario 35: Changing Charcoal / Grills
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No grill/charcoal tracking
- **Gap:** No "grill change" request to kitchen
- Manual process only

### Scenario 36: Edge Case - Waiter Processing Customer Broken Plate Fee
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Breakage Fee" item type
- **Gap:** No quick-add for fees/penalties
- Would need to add as custom item manually

---

## 8. The Expediter (Food Checker)

### Scenario 37: Ensuring Meat Quality Before Serving
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- KDS shows orders with table numbers and quantities
- Items can be marked as served
- **Gap:** No specific expediter station or quality check workflow
- **Gap:** No "Bump" button that also tracks runner assignment

### Scenario 38: Handling VIP Expedites
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No VIP or Priority flag on orders
- **Gap:** No queue jumping capability in KDS
- All orders treated FIFO

### Scenario 39: Edge Case - Kitchen Refusals / Send Backs
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "86" broadcast from KDS to POS
- **Gap:** No way to halt distribution or warn other stations
- Would require manually finding and disabling each item

---

## 9. The Busser / Dishwasher

### Scenario 40: Clearing "Dirty" Status Tables
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- Table status flow includes 'dirty' state
- [`closeTable()`](src/lib/stores/pos.svelte.ts:106) sets status to 'dirty' after checkout
- [`cleanTable()`](src/lib/stores/pos.svelte.ts:118) changes status to 'available'
- Cashier marks as clean, table immediately available for seating

### Scenario 41: Clearing Excess Plates Mid-Meal
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No plate count or busser notification system
- **Gap:** Physical clearing only, no system tracking

---

## 10. The Barista / Drinks Station

### Scenario 42: Fulfilling Drink/Bar Tickets
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Drinks appear on KDS alongside food orders
- **Gap:** No dedicated barista station view
- **Gap:** No drink-specific printer or screen routing

### Scenario 43: Automatic Stock Deduction of Mixers
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- [`deductFromStock()`](src/lib/stores/stock.svelte.ts:264) is called when items are ordered
- **Gap:** No recipe-level BOM (Bill of Materials) for drinks
- **Gap:** Mixers not tracked separately - only final drink SKU

### Scenario 44: Edge Case - Power Outage During Busy Hour
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No battery backup integration
- **Gap:** No local storage persistence
- **Gap:** App runs entirely in memory - all data lost on power failure

---

## 11. The Customer

### Scenario 45: Arrival and Waiting
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Table statuses visible (Eating, Billing, Dirty)
- **Gap:** No customer-facing display showing wait times
- **Gap:** Host waitlist system not implemented

### Scenario 46: The Unli Time Limit Experience
**Score:** ✅ FULLY SUPPORTED

**Notes:**
- 90-minute timer (SESSION_SECONDS = 90 * 60) in [`pos.svelte.ts`](src/lib/stores/pos.svelte.ts:11)
- Visual warnings at 15 minutes (Yellow) and 5 minutes (Red)
- Table status changes trigger visual cues
- Automatic countdown displayed on table cards

### Scenario 47: Pre-ordering Takeaway Over the Phone
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No pre-order scheduling system
- **Gap:** No "trigger kitchen 15 minutes prior" logic
- Takeout orders start immediately when created

### Scenario 48: Noticing the "Dirty" Indicator Loophole
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No customer-facing waitlist or transparency system
- **Gap:** Host manually manages waiting customers

### Scenario 49: Edge Case - Senior Citizen / PWD Split Group Discount Calculations
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Senior and PWD discount types exist in [`DiscountType`](src/lib/types.ts:70)
- [`recalcOrder()`](src/lib/stores/pos.svelte.ts:217) applies 20% discount
- **Gap:** VAT exemption logic is per-order, not per-person
- **Gap:** No split group discount (applies to entire order, not individual pax)
- Philippine RA 9994/7277 VAT handling implemented but simplified

### Scenario 50: Edge Case - Refusing to Pay Breakage/Leftover Surcharge
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Manager PIN can void specific items
- **Gap:** No specific "waive penalty" function
- Would need to void the surcharge item specifically

### Scenario 51: Edge Case - Requesting a Change of Meat Variety Post-Order
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Exchange" function
- **Gap:** No quality return/waste logging for swaps
- **Gap:** No RUSH tagging for replacement orders

---

## 12. Complex Edge Cases & System Stressors

### Scenario 52: Extreme Edge Case - "The Mixed Table" (Unli + Kids + Ala-Carte)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** Single package per table only
- **Gap:** No per-seat ordering or pricing
- **Gap:** Kids Free and mixed pricing not supported
- Order uses single `packageId` field

### Scenario 53: Extreme Edge Case - Central Warehouse to Branch Meat Transfer
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No inter-location transfer system
- **Gap:** No "In Transit" stock state
- **Gap:** No transit shrinkage tracking
- Warehouse exists as location but transfers not implemented

### Scenario 54: Extreme Edge Case - Device Crash Mid-Payment
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No cloud-state locking or transaction persistence
- **Gap:** No "Recover & Reprint" functionality
- **Gap:** Data is in-memory only - lost on crash

### Scenario 55: Extreme Edge Case - LPG / Gas Exhaustion During a Rush
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Disable Kitchen Station" feature
- **Gap:** No bulk 86 functionality
- **Gap:** No station-specific item disabling

### Scenario 56: Extreme Edge Case - The "Sneaky Saver" Mid-Meal Downgrade Attempt
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No package downgrade or upgrade functionality
- **Gap:** No consumption-based locking
- Package is fixed after table open

### Scenario 57: Extreme Edge Case - Employee Walkout/Rage Quit
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Emergency Suspend Shift" function
- **Gap:** No automatic table ownership transfer
- **Gap:** No impromptu Z-Read generation

---

## 13. Hyper-Specific Operational Scenarios

### Scenario 58: "Pay By Item" Split Checkout
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No drag-and-drop bill splitting UI
- **Gap:** No per-item payment allocation
- **Gap:** No multiple receipt generation for splits

### Scenario 59: Waiter Dropped Food (Shrinkage vs Table Limits)
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Waste can be logged via [`logWaste()`](src/lib/stores/stock.svelte.ts:205)
- **Gap:** No "REFIRE" tag for immediate kitchen remake
- **Gap:** No direct link between dropped items and KDS re-queue

### Scenario 60: Take-Home Raw Inventory (Off-premise sales)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Retail Item" category
- **Gap:** No service charge exemption logic
- **Gap:** No cashier station label printing

### Scenario 61: The "Dine & Dash" Partial Recovery
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Partial payment recording not supported
- Can void/write-off entire order
- **Gap:** No "Partial Walkoff" category
- **Gap:** Cannot split payment and walk-off amounts

### Scenario 62: Correcting a Tender Mistake (The Extra Zero)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No "Edit Tender Amount" functionality
- **Gap:** Receipt history is read-only
- **Gap:** No post-transaction correction capability

### Scenario 63: Processing a Historical Refund (Next Day Complaint)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No historical refund system
- **Gap:** No negative receipt generation
- **Gap:** No Audit/Global Search by receipt ID

### Scenario 64: Staff Meals (Consumption Tracking)
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Could use a dedicated "STAFF MEAL" table
- **Gap:** No "Charge to Staff/Internal" button
- **Gap:** No staff meal tracking separate from orders

### Scenario 65: Applying Automatic Gratuity for Large Groups
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No automatic gratuity calculation
- **Gap:** No pax threshold detection
- **Gap:** No service charge distribution across split bills

### Scenario 66: The "Bring Your Own Bottle" (Corkage Fee)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No corkage fee item or quick-add
- **Gap:** No BYOB tracking
- Would require manual custom item entry

---

## 14. System Resilience, Loyalty, and Accounting Anomalies

### Scenario 67: Zero-Rated VAT (Diplomat / Special Economic Zone Exemption)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No tax exemption types beyond SC/PWD
- **Gap:** No zero-rated VAT stripping
- **Gap:** No diplomat/PEZA special handling

### Scenario 68: The "Printer Out of Paper" Queue
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No printer integration at all
- **Gap:** No hardware fault detection
- **Gap:** No retry print functionality
- All receipts are on-screen only

### Scenario 69: Customer Loyalty Points Redemption vs. Split Bills
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No loyalty system
- **Gap:** No points tracking or redemption
- **Gap:** No customer phone number lookup

### Scenario 70: Kitchen Printer Jam / Network Drop "Silent Failure"
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No kitchen printer integration
- **Gap:** No print confirmation tracking
- **Gap:** No offline alert banner

### Scenario 71: Suspicious Drawer Pops (No Sale Abuse)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No cash drawer integration
- **Gap:** No "No Sale" button tracking
- **Gap:** No drawer open audit logging

### Scenario 72: Offsetting Over-Payments via Store Credit
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No store credit system
- **Gap:** No scannable barcode for credit
- **Gap:** No customer credit balance tracking

### Scenario 73: The "Ghost" Takeaway Order (Forgotten Pickups)
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Takeout orders have timestamps
- **Gap:** No color-coding by staleness (Blue → Orange → Red)
- **Gap:** No "Void - Abandoned Pickup" category
- **Gap:** No automatic 3-hour flagging

### Scenario 74: VIP Priority Bumping (Overriding the FIFO Queue)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No VIP/RUSH flag on orders
- **Gap:** No queue position override
- **Gap:** FIFO only - no priority insertion

### Scenario 75: End of Day "Blind Close" to Prevent Skimming
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No blind close functionality
- **Gap:** No manual cash count input
- **Gap:** No variance logging without expected amount

---

## 15. Ingredient Lifecycle & Complete Spoilage Tracking

### Scenario 76: Granular Ingredient Depletion (The "No More Garlic" Cascading Effect)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No recipe-level BOM tracking
- **Gap:** No ingredient cascade (garlic → garlic butter pork)
- **Gap:** Stock is tracked at SKU level only, not ingredient level

### Scenario 77: Near-Spoilage Predictive Alerts (FIFO Rotation)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No batch tracking by delivery date
- **Gap:** No expiration date monitoring
- **Gap:** No predictive spoilage alerts

### Scenario 78: Supplier Quality Rejects (Immediate RTV/Return To Vendor)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No partial accept/reject on delivery
- **Gap:** No RTV (Return To Vendor) memo generation
- **Gap:** No supplier debit memo system

### Scenario 79: Post-Prep Spoilage (The "End of Night Dump")
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Waste logging exists with reason codes
- **Gap:** No "Prepared Food Waste" specific category
- **Gap:** No "EOD Toss-Out" reason code
- Can use generic waste logging

---

## 16. The Owner & The Data Management Sandbox

### Scenario 80: The "Silent Partner" Dashboard Check
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Owner role exists and can view all branches
- Reports show Gross Sales, Pax Count available
- **Gap:** No dedicated "Investor-Read-Only" role
- **Gap:** No real-time cloud dashboard (single-instance memory)
- **Gap:** No hiding of employee wages (all data visible to owner)

### Scenario 81: Price Experimentation (A/B Testing the Menu)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No menu cloning capability
- **Gap:** No scheduled price changes
- **Gap:** No branch-specific menu overrides
- **Gap:** No comparative sales report with overlays

### Scenario 82: The "Cost of Goods Sold" (COGS) Margin Analysis
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Meat variance report exists at [`/routes/reports/meat-variance/+page.svelte`](src/routes/reports/meat-variance/+page.svelte:1)
- Stock deductions are tracked
- **Gap:** No COGS percentage calculation
- **Gap:** No food cost percentage alerts
- **Gap:** No margin flagging in red/green

### Scenario 83: Exporting to Accounting via API (The Monthly Close)
**Score:** ❌ NOT SUPPORTED

**Notes:**
- **Gap:** No API for external accounting software
- **Gap:** No Quickbooks/Xero integration
- **Gap:** No automated ledger pushing

### Scenario 84: Identifying "Dead Weight" Menu Items
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Best sellers report exists at [`/routes/reports/best-sellers/+page.svelte`](src/routes/reports/best-sellers/+page.svelte:1)
- Can see least ordered items by inverting the view
- **Gap:** No automatic "Dead Weight" flagging
- **Gap:** No velocity report with thresholds

### Scenario 85: Tracing Fraud (The "Manager Void" Abuse Pattern)
**Score:** ⚠️ PARTIALLY SUPPORTED

**Notes:**
- Audit log records all voids with timestamps
- User attribution exists for every action
- **Gap:** No scatter plot visualization of void patterns
- **Gap:** No automated anomaly detection (e.g., "2 voids every Friday at 10 PM")
- **Gap:** No manager-specific void filtering in UI

---

## Summary Statistics

| Category | Total Scenarios | ✅ Fully Supported | ⚠️ Partially Supported | ❌ Not Supported |
|----------|-----------------|-------------------|------------------------|------------------|
| 1. Manager/Owner | 7 | 1 | 4 | 2 |
| 2. Store Manager | 6 | 1 | 3 | 2 |
| 3. Butcher/Kitchen | 7 | 2 | 3 | 2 |
| 4. Stock/Inventory | 4 | 2 | 1 | 1 |
| 5. Cashier | 11 | 4 | 2 | 5 |
| 6. Host | 3 | 0 | 1 | 2 |
| 7. Waiter | 4 | 1 | 1 | 2 |
| 8. Expediter | 3 | 0 | 1 | 2 |
| 9. Busser | 2 | 1 | 0 | 1 |
| 10. Barista | 3 | 0 | 2 | 1 |
| 11. Customer | 7 | 1 | 3 | 3 |
| 12. Complex Edge Cases | 6 | 0 | 0 | 6 |
| 13. Hyper-Specific Scenarios | 9 | 0 | 3 | 6 |
| 14. System Resilience | 9 | 0 | 1 | 8 |
| 15. Ingredient Lifecycle | 4 | 0 | 1 | 3 |
| 16. Owner Data Sandbox | 6 | 0 | 3 | 3 |
| **TOTAL** | **85** | **13** | **29** | **43** |

### Key Implementation Gaps

1. **Payment & Checkout:** No split bills, partial payments, or complex tender handling
2. **Inventory:** No ingredient-level BOM, no transfers, no batch/expiration tracking
3. **Staff Management:** No server assignments, shift handovers, or performance metrics
4. **Hardware Integration:** No printers, cash drawers, or offline support
5. **Advanced POS:** No package upgrades, table transfers, or complex discounts
6. **Analytics:** No predictive alerts, A/B testing, or automated fraud detection
7. **Data Persistence:** All data is in-memory - no cloud sync or backup

### Strongest Areas

1. **Table Management:** Full floor plan editor with drag-and-drop
2. **KDS:** Functional kitchen display with order tracking
3. **Basic Stock:** Receiving, waste logging, and counts all working
4. **Reporting Suite:** 11 different report types available
5. **Authentication:** Role-based access with PIN protection for sensitive operations
