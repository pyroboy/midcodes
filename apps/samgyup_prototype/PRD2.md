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
* Visual table floor map displaying live statuses: available, occupied, or nearing time limit.


* 90-minute per-table countdown timer with color-coded urgency alerts.


* Per-table order entry with a categorized menu, item variations, and quantities.


* Mid-session add-ons (meat, rice, drinks) allowed without interrupting the open transaction.




* **Discounts & Payments:**
* Auto-application of 20% Senior Citizen and PWD discounts, plus VAT exemption, requiring ID logging.


* Support for multiple payment methods (Cash, GCash, Maya) that can be processed singly or combined within one transaction.


* Manager PIN required for all cancellations and refunds, with all actions permanently logged.




* **Kitchen & Hardware Integration:**
* Orders routed to a Kitchen Display System (KDS) screen in real time upon placement.


* Thermal receipt printing formatted for BIR compliance.


* Manual weight entry for meat at launch (staff types the reading, system computes cost).




* **Compliance:**
* Generation of BIR-compliant shift reports (X-Readings) and end-of-day reports (Z-Readings).





Module 2: Meat & Pantry Inventory System 

* **End-to-End Tracking:**
* Tracks all ingredients from delivery to service and detects inventory loss/drift.


* Fully traceable tracking per batch: raw bone-in delivery → deboning → sliced cuts → waste.


* Automatic inventory deduction when POS orders are placed, eliminating separate manual entry.




* **Roles & Auditing:**
* Role-based access for the Butcher (receiving, deboning, slicing, waste logging) and Server (served items, stock counts).


* Three daily stock counts required at 10:00 AM, 4:00 PM, and 10:00 PM, with variances flagged for manager review.


* Generation of variance and accuracy reports detailing received vs. sold, loss sources, and portioning accuracy.





Module 3: Expenses Recording 

* **Expense Management:**
* Structured daily record-keeping of all branch operating expenses organized by categories: electricity, gas, labor, supplies, and others.


* Owner PIN required for all expense entries to prevent unauthorized or accidental submissions.


* Automatic logging of configured recurring fixed costs (e.g., rent, subscriptions).


* Daily and monthly expense-vs-sales summaries for profitability review.





Module 4: Multi-Branch Analytics Dashboard 

* **Data Architecture:**
* Centralized owner-level view of performance across up to two branches.


* Complete branch-level data isolation; transactions at one branch have zero effect on the other.


* Branch managers see only their own operational data, while the analytics dashboard remains owner-only.




* 
Reporting Suite:


* 
**Daily Expense Breakdown:** Itemized view of daily expenses grouped by category.


* 
**Monthly Expense Trend:** Month-over-month tracking by category.


* 
**Sales Summary & Revenue Trend:** Daily and weekly revenue totals with trend lines.


* 
**Best-Selling Items & Meat Consumption:** Ranks items/cuts by volume sold and revenue contributed.


* 
**Peak Service Hours:** Heat map of covers and orders by hour across the day.


* 
**Gross Profit Summary:** Revenue minus Cost of Goods Sold.


* 
**Net Profit Summary:** Gross profit minus all operating expenses.


* 
**Branch Comparison:** Side-by-side view of revenue, expenses, margins, and attendance rates.





## 4. UI/UX & Interface Requirements

* 
**General UI:** All interfaces must have touch-optimized hit areas designed for cashier desktops and touchscreen tablets.


* 
**State Indicators:** Persistent UI indicators must display the current offline/online network status and cloud sync status.


* **Core POS Interfaces:**
* 
**Authentication:** A numeric keypad overlay for quick PIN entry (Manager overrides, Owner expense access).


* 
**Floor Plan View:** A visual representation of the restaurant displaying table availability and the prominent 90-minute countdown timer.


* 
**Register View:** Split panes for categorized menu navigation and active ticket display, allowing for mid-session add-ons and robust payment processing (Cash, GCash, Maya, discounts).


* 
**KDS View:** High-contrast grid view for kitchen staff to manage incoming routed orders instantly.




* **Back-of-House Interfaces:**
* 
**Meat & Pantry:** Dedicated forms for Butcher tasks (receiving, waste) and strictly timed Stock Counts (10am, 4pm, 10pm).


* 
**Expense Entry:** Secure, PIN-protected dropdown forms for categorizing daily expenses.




* 
**Analytics Dashboard:** Web-responsive interface featuring a branch toggle and clear data visualizations (heat maps, trend lines).



## 5. Exclusions & Future Expansions

* 
**Exclusions:** All hardware (computers, tablets, printers, scales, routers), internet service costs, and BIR filing/registration fees are the sole responsibility of the Client.


* 
**Future Integration:** Full Bluetooth weighing scale auto-read will be integrated at no extra cost once the hardware is procured by the client.



## 6. Project Timeline

* 
**Duration:** Maximum of six (6) weeks from signing.


* 
**Phases:** 1. Foundation & Design 
2. Prototype (Core POS, table map, KDS, basic payments) 
3. POS Completion + Inventory & Expenses (Modules 1, 2, 3) 
4. Analytics Dashboard (Module 4) 
5. Integration & Hardening (Stress testing sync and networking) 
6. Final Testing & Handover (Staff training, simulation) 


