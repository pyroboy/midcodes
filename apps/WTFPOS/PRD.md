Here is the complete, merged Product Requirements Document (PRD) combining all the functional, technical, and UI/UX requirements based on the contract provided and your chosen technology stack.

---

# Product Requirements Document (PRD)

**Project Name:** WTF! SAMGYUP POS SOFTWARE **Target Business:** "WTF! Samgyupsal" **Developer:** Arturo Jose T. Magno 
**Client:** WTF! Corporation (Christopher Samonte, CEO) 

## 1. Product Overview

The WTF! SAMGYUP POS SOFTWARE is a custom system built exclusively for samgyupsal restaurant operations. The system is engineered to withstand internet outages through local LAN networking while maintaining seamless background cloud synchronization. It encompasses four core modules: Cashiering/POS, Meat & Pantry Inventory, Expense Recording, and a Multi-Branch Analytics Dashboard.

## 2. Technology Stack & Architecture

* 
**Frontend UI (Web-based):** SvelteKit will be used to build a touch-optimized, responsive application purpose-built for cashier desktops and touchscreen tablets.


* 
**Mobile/Tablet Wrapper (Native Android):** Utilizing Capacitor to port the web application to Android rather than developing native mobile code from scratch, providing direct access to Bluetooth hardware and local storage.


* 
**Order Routing:** A Real-Time LAN Server architecture ensures orders route to the KDS and cashier instantly over the local network, requiring no external internet for the order flow.


* 
**Data Storage:** A Dual-Layer (Local + Cloud) approach ensures all data is stored locally first, with local data taking priority in the event of a conflict during background cloud sync.


* 
**Cloud Hosting:** Cloudflare will serve as the Enterprise Cloud Provider for secure, fast, and reliable infrastructure.



## 3. Functional Requirements

Module 1: Core Samgyup POS & System Foundation 

* **Cashiering & Table Management:**
* Visual table floor map displaying live statuses: available, occupied, cleaning, or nearing time limit.
* 90-minute per-table countdown timer with color-coded urgency alerts.
* **Table Reset Tracking:** Automatically tracks the "Table Reset Time" (time between payment and when the table is marked 'Available' again) for future business analytics.
* **Pax-First Seating:** To open a table, the server must input the number of pax (guests) first, followed by the package selection. This initializes the running bill.
* **Pax Modifications:** Any mid-session changes to the number of pax or the selected package requires a Manager PIN override to prevent unauthorized voids/discounts.
* Per-table order entry with a categorized menu, item variations, and quantities.
* Mid-session add-ons (meat, rice, drinks) allowed without interrupting the open transaction.
* **Package Upgrades:** Mid-session "Upgrades" (e.g., changing from a 'Pork Only' package to 'Beef & Pork' halfway through) instantly prorates the package cost upward and unlocks the new menu items.
* **Grace Period Voids:** A 30-second cancellation grace period allows servers to immediately delete mistaken punched items before routing to the kitchen, without requiring a Manager PIN override.




* **Discounts & Payments:**
* Auto-application of 20% Senior Citizen and PWD discounts, plus VAT exemption, requiring ID logging.
* **Pro-Rata Discounts:** In AYCE settings, the 20% discount is applied on a pro-rata basis (e.g., if 1 out of 4 guests is a Senior, the discount applies to exactly 1/4th of the total bill).
* Support for multiple payment methods (Cash, GCash, Maya) that can be processed singly or combined within one transaction.
* Manager PIN required for all cancellations and refunds, with all actions permanently logged.
* **Cash Drawers & Floats:** The system must enforce uniquely assigned cash drawers/floats per cashier, requiring a formal declaration of starting/ending cash before another shift takeover.




* **Kitchen Routing (Master KDS & Weigh Station):** 
* The system utilizes a Master KDS screen where kitchen staff see consolidated incoming orders.
* **Dedicated Bluetooth Weighing Screen:** A specialized, high-contrast, "wet-environment" interface designed with massive hit-areas for the butcher. This screen is directly paired with a Bluetooth scale.
* **Live Weigh-Out (Exact Deductions):** EVERY in and out transaction of meat must be weighed. When a table orders a package or a meat top-up, the butcher places the serving plate on the Bluetooth scale, and the exact weight (e.g., 148g instead of an estimated 150g) is captured and recorded against that table's order.
* **KDS Bump Flow:** Kitchen staff use the touchscreen (or bump-bar) to mark tickets as "Complete," instantly removing them tightly from the screen and signaling the Server the food is ready for pickup.


* Thermal receipt printing formatted for BIR compliance.


* Manual weight entry for meat at launch (staff types the reading, system computes cost).




* **Compliance:**
* Generation of BIR-compliant shift reports (X-Readings) and end-of-day reports (Z-Readings).





Module 2: Stock Management

* **End-to-End Tracking (100% Weighed):**
* Tracks all ingredients from delivery to service and detects inventory loss/drift.
* Fully traceable tracking: raw bone-in delivery → deboning → sliced cuts → exact live weigh-out to customer → waste.
* Automatic, *exact-gram* inventory deduction when meat is weighed and bumped from the Dedicated Weighing Screen to the customer table.




* **Roles & Auditing:**
* Role-based access for the Butcher (receiving, deboning, slicing, waste logging) and Server (served items, stock counts).
* **Preparation Waste Only:** Waste logging strictly tracks Kitchen/Butcher preparation trimming losses, not unconsumed customer leftovers.
* Three daily stock counts required at 10:00 AM, 4:00 PM, and 10:00 PM, with variances flagged for manager review.
* **Dynamic Stock Counting:** Stock counts perform a dynamic reconciliation, calculating the expected inventory based on the exact minute the count is submitted against live ongoing orders.


* Generation of variance and accuracy reports detailing received vs. sold, loss sources, and portioning accuracy.





## Module 3: Multi-Branch Analytics & Reporting Dashboard

* **Data Architecture:**
* Centralized owner-level view of performance across up to two branches.
* Complete branch-level data isolation; transactions at one branch have zero effect on the other.
* Branch managers see only their own operational data, while the analytics dashboard remains owner-only.

* **Global Main Navigation (Floor | Stock | Reports | Admin):**
* The application revolves around a top-level persistent navigation menu.
* **Floor:** Shows the table layout and active orders for the currently selected branch. Disabled or prompts branch selection if "All Branches" is active.
* **Stock:** Manages all inventory operations (receiving, counts, waste) for the currently selected branch. Displays aggregated multi-branch stock levels if "All Branches" is selected.
* **Reports:** Consolidates analytics, sales, and reconciliation for the current branch or "All Branches".
* **Admin:** A dedicated portal exclusively for Admin users to manage app users and view system logs.
* **Menu Master Controls:** Menu changes (pricing, items) are strictly limited to the Admin/Owner portal and only deploy outside of active business hours to prevent sync conflicts.

* 
Reporting Suite:

* 
**Consolidated EOD & Daily Reports:** A unified reporting view containing tabs/tables for "Meat Inventory Variance", "Sale Per Table Data (tabular)", and "End of Day (EOD) Cash Reconciliation".

*
**Missing Inventory (Drift) Tracking:** The variance report actively calculates and boldly flags "Drift" (meat that is missing and not accounted for by sales or logged waste) based on the periodic daily counts (e.g. 10am, Mid-day, 10pm) to immediately alert managers of potential theft or dropped items.

*
**Expense Management Entry:** A secure form nested directly within the reporting module to input branch operating expenses (electricity, labor, supplies). Automatic logging of configured recurring fixed costs.

* 
**Daily Expense Breakdown:** Itemized view of daily expenses grouped by category (e.g., Meat Procurement, Produce/Sides, Utilities, Wages, Miscellaneous) compared against daily sales. Key data points reported include: *Total Daily Sales, Total Daily Expenses, Net Daily Cash Flow, and percentage of sales allocated to each expense category.*


* 
**Monthly Expense Trend:** Month-over-month tracking by category. Key data points reported include: *Total Monthly Expenses, variance (percentage increase/decrease) from the previous month per category, and automated flagging of specific cost spikes (e.g., sudden increases in utility or meat supply costs).*


* 
**Sales Summary & Revenue Trend:** Daily and weekly revenue totals with historical trend lines. Key data points reported include: *Gross Sales, Net Sales (after Senior/PWD pro-rata discounts), Total Collected Tax (VAT vs Non-VAT sales), Average Receipt/Ticket Size, and Total Guest Count (Pax).*


* 
**Best-Selling Items & Meat Consumption:** Ranks all menu items and specific meat cuts by volume sold and revenue contributed. Key data points reported include: *Total Weight Weighed-Out per meat type (in grams/kg), Cost of Goods per item, Gross Margin per item, and top-performing Add-on sides/drinks.*


* 
**Peak Service Hours & Turnovers:** Heat map of guest covers (pax) and total orders plotted by hour across the operating day. Key data points reported include: *Busiest hours (peak vs off-peak), Average Table Occupancy Duration (minutes), and average "Table Reset Times" (Backlog feature: time gap between payment and table availability).*


* 
**Gross Profit Summary:** High-level financial metric displaying Total Revenue minus Cost of Goods Sold (COGS). *COGS is dynamically calculated based on the exact weighed meat deductions from the KDS and the actual declared purchasing costs.*


* 
**Net Profit Summary:** The definitive bottom-line performance metric. Calculated as Gross Profit minus all logged operating expenses (labor, rent, utilities, supplies) within the given period. *Displays exact take-home profit margin per branch.*


* 
**Branch Comparison:** Side-by-side view of revenue, expenses, margins, and attendance rates.

Module 4: Administration & System Logs

* **Global Branch Selection:**
* Branch selection dropdown/toggle integrated into the main navigation across all views and screens.
* Strictly available only to users with "Owner" or "Admin" roles.

* **Admin Portal ("ADMIN" Link):**
* A dedicated "ADMIN" link in the navigation for Admin users to access system-wide settings.
* **User Management:** Allows admins to update, create, and manage app users and their roles.
* **Global App Logs:** A centralized view to monitor system logs, activities, and events across the whole application.

## 4. UI/UX & Interface Requirements

* 
**General UI:** All interfaces must have touch-optimized hit areas designed for cashier desktops and touchscreen tablets.


* 
**State Indicators & Fallbacks:** Persistent UI indicators display current internet sync status. If the local network connection to the Kitchen KDS completely fails, the POS must explicitly trigger a critical full-screen alert indicating "KITCHEN OFFLINE: REVERT TO PAPER TICKETS/MANUAL PROCESS" to prevent silent order dropping.


* **Core POS Interfaces:**
* 
**Authentication:** A numeric keypad overlay for quick PIN entry (Manager overrides, Owner expense access).


* 
**Floor Plan View:** A visual representation of the restaurant displaying table availability and the prominent 90-minute countdown timer.


* 
**Register View:** Split panes for categorized menu navigation and active ticket display, allowing for mid-session add-ons and robust payment processing (Cash, GCash, Maya, discounts).


* 
**KDS & Weighing View:** High-contrast grid view for kitchen staff to manage incoming routed orders. Includes the specialized Bluetooth auto-read interface for the butcher to quickly weigh and dispatch meat plates using knuckle-sized buttons optimized for wet/greasy environments.




* **Back-of-House Interfaces:**
* 
**Meat & Pantry:** Dedicated forms for Butcher tasks (receiving, waste) and strictly timed Stock Counts (10am, 4pm, 10pm).


* 
**Expense Entry:** Secure, PIN-protected dropdown forms for categorizing daily expenses.




* 
**Analytics Dashboard:** Web-responsive interface featuring a branch toggle and clear data visualizations (heat maps, trend lines).



## 5. Production Update & Deployment Protocol

### 5.1 Version Tracking

Every build carries a version number (`APP_VERSION` in `src/lib/version.ts`) and a build timestamp injected at compile time. The version is displayed in the TopBar for quick identification across all devices.

### 5.2 Update Safety Matrix

| Change Type | Safe Window | Risk |
|---|---|---|
| UI tweaks, labels, colors, typo fixes | Anytime | None — no data impact |
| Bug fixes (no schema change) | Anytime | Low — test first |
| New features reading existing data | Slow hours (2–4 PM) | Low |
| New store logic changing write paths | Between shifts | Medium — verify data integrity |
| New RxDB collection | Between shifts | Medium — restart needed |
| Schema version bump (field add/rename) | After close (10 PM+) | High — migration runs on every document |
| Breaking schema (remove field, change PK) | After close + backup | Critical — test on copy of production data |
| Force-clear IndexedDB remotely | NEVER | Data loss |

### 5.3 Rollout Order

All updates follow this sequence:

1. Deploy new build to server/hosting
2. Update **one tablet** at one branch (canary) — verify 15 minutes
3. Update remaining tablets at that branch (Main POS first, then Kitchen KDS)
4. Move to next branch, repeat
5. Owner phones last

### 5.4 Update Delivery (Option B — Manual Prompt)

Updates must **never** auto-refresh mid-transaction. The service worker (PWA) detects new versions and shows a non-intrusive banner. Staff taps "Update Now" when between customers. The app reloads with new code; local data (IndexedDB) remains intact.

### 5.5 Offline Branch Updates

If a branch has been offline when an update is deployed, the migration runs automatically when the tablet reconnects and loads the new app code. RxDB migrations are per-device, automatic, and sequential — no coordination between devices is required.

### 5.6 Schema Migration Checklist

Before deploying any schema change:

- [ ] Bumped schema version in `schemas.ts`
- [ ] Added `migrationStrategies` in `db/index.ts`
- [ ] Tested upgrade path (old data → new code)
- [ ] Tested fresh install (cleared IndexedDB, re-seeded)
- [ ] Bumped `APP_VERSION` in `version.ts`
- [ ] Deployed after service hours (10 PM+)
- [ ] Canary tablet verified first

---

## 6. Exclusions & Future Expansions

* 
**Exclusions:** All hardware (computers, tablets, printers, scales, routers), internet service costs, and BIR filing/registration fees are the sole responsibility of the Client.


* 
**Future Integration:** Full Bluetooth weighing scale auto-read will be integrated at no extra cost once the hardware is procured by the client.



