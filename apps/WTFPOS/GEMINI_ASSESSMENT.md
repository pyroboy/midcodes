# WTFPOS User Scenario Viability Mapping

This document scores the 85 specific user scenarios outlined in `USER_SCENARIOS.md` against the **current technical capabilities** of the WTFPOS application as it exists today.

### Scoring Criteria:
- 🟢 **Fully Supported (5/5):** The codebase natively has components, state logic, and UI to handle this exact scenario without error.
- 🟡 **Partially Supported (3/5):** The app has the foundation (stores, data models) but requires UI tweaks, permissions logic, or manual workarounds to complete.
- 🔴 **Not Supported (1/5):** The application completely lacks the backend architecture, data model, or frontend component to handle this interaction currently.

---

## 1. The Manager / Owner & 2. The Store Manager
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **1-Morning Analytics** | 🟡 3/5 | Basic reporting suite exists, but granular void/discount logging per PIN is not fully dashboarded yet. |
| **2-Menu Pricing** | 🟢 5/5 | Admin Menu Editor stores and syncs changes directly through Svelte stores. |
| **3-Floor Layout** | 🟡 4/5 | Floor page maps out coordinates, but dragging and grouping tables dynamically merging their states isn't fully implemented in the UI dragging logic. |
| **4-Multi-Branch** | 🟡 3/5 | We simulated multi-branch data filters in `pos.svelte.ts`, but a dedicated global dashboard view is still a mock. |
| **5-Operational Expenses** | 🔴 1/5 | Petty cash and non-sales expense tracking ledgers do not exist natively yet. |
| **6-Staff Accountability** | 🔴 1/5 | We don't have a rigid employee tracking system generating reports on upsells vs. voids per user. |
| **7-VIP Comping** | 🟡 3/5 | Discounts exist, but 100% Owner Comp overriding standard ledger items requires explicit manual math. |
| **8-Spot-Check Drawer** | 🔴 2/5 | Cash state exists implicitly in completed orders, but an isolated "X-Read" function to print current expected cash hasn't been coded. |
| **9-Allergy Panic** | 🔴 1/5 | Deep ingredient-level cards with allergy meta-data aren't attached to standard menu items yet. |
| **10-Shift Handover** | 🟡 3/5 | Tables aren't strictly bound to server PINs yet; anyone can click any table. |
| **11-Approving Voids** | 🟡 2/5 | Voids are possible, but strict PIN/Fingerprint lockouts mapping to manager overrides are missing. |
| **12-Broken Hardware** | 🟢 5/5 | Cloud-state locking handles this automatically. If an iPad dies, another one loads the SvelteKit app perfectly. |
| **13-Service Recovery** | 🟡 3/5 | Discounts can be applied, but custom tagging them to localized codes (like "Service Recovery") for reporting isn't wired up. |

## 3. The Butcher / Kitchen Prep
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **8-Yielding Beef** | 🟡 3/5 | Inventory UI exists with manual `+/-` adjustments, but automatic % yield conversion from raw slab to 3 sub-items is manual math right now. |
| **9-Waste Logging** | 🟡 3/5 | Waste can be adjusted out of inventory negatively, but dedicated Waste Reporting needing Manager PIN isn't enforced. |
| **10-Fulfilling KDS** | 🟢 5/5 | The `/kitchen` KDS route successfully ingests orders and allows bumping them as "done". |
| **11-Dietary Notes** | 🟡 3/5 | Adding free-text notes to specific items from the floor to flash on the KDS isn't fully robust. |
| **12-86'ing Items** | 🟡 2/5 | Stock can hit zero, but auto-graying out all menus instantly from the KDS UI is not wired. |
| **13-Recovering Bumped**| 🔴 1/5 | The KDS doesn't have a "History/Recall" tab to un-bump mistaken tickets yet. |
| **14-Network Offline** | 🔴 1/5 | SvelteKit relies on active DB connections. True PWA offline-first syncing to queue tickets isn't built. |

## 4. The Stock / Inventory Assigned
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **15-Daily Deliveries** | 🟢 5/5 | Built-in using the new InventoryTable inline adjustment modal we just created. |
| **16-Low Stock Alerts** | 🟡 3/5 | Stock levels track, but aggressive push notifications/flashing UI for low stock mid-shift isn't active. |
| **17-Inter-Branch Transfer**| 🔴 1/5 | Transit/Limbo states for inventory moving between branch IDs do not exist in the data model. |
| **18-Physical Audit** | 🟡 3/5 | Can manually overwrite stock counts, but generating a neat "Expected vs Physical Variance Report" doesn't happen automatically. |

## 5. The Cashier / Front of House
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **19-Seating Walk-in** | 🟢 5/5 | Flawless. Changing state from Available to Occupied and firing to KDS works. |
| **20-Takeout Processing** | 🟢 5/5 | Flawless. We just built the Takeout lane with Blue/Orange color logic. |
| **21-Split Check** | 🟡 4/5 | The system can handle partial payments reducing the total, but splitting the actual receipt printout into two clean sub-receipts is clunky. |
| **22-Mid-Meal Add-ons** | 🟢 5/5 | Flawless. Pending bills update grand totals and fire to KDS. |
| **23-Unhappy Adjust** | 🟡 3/5 | Voids + Adds work functionally, but lacks the Manager permission wall. |
| **24-Table Transfer** | 🔴 2/5 | The UI to seamlessly merge or swap active states from Table 8 to Table 2 is not built yet. |
| **25-Package Upgrade** | 🔴 1/5 | Changing the core package of a running table and calculating proportional upcharges is incredibly complex and unhandled. |
| **26-Leftover Surcharge** | 🟢 5/5 | Cashier can easily add a custom fast-item penalty to the bill before checkout. |
| **27-Late Joiner** | 🟡 2/5 | Adjusting Pax halfway through a timer without resetting the original 4 pax timer requires very tricky state management we haven't built. |
| **28-Unpaid Dash** | 🟡 3/5 | Manager can "Void" the table to reset it, but a "Write Off as Stolen" accounting path doesn't exist. |
| **29-Pending Payment** | 🟡 3/5 | Leaving a table in Orange Billing state works, but there isn't an explicit "Pending GCash Confirmation" status badge. |

## 6 & 7 & 8. Host, Waiter, Expediter & Busser
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **30-Waitlist Queue** | 🔴 1/5 | No native waitlist queue management component exists alongside the floor plan. |
| **32-Out of Order Table**| 🔴 2/5 | No status for "Broken/Wrench" exists. We only have Available, Occupied, Dirty, Billing. |
| **33-Mobile Ordering** | 🟢 5/5 | System is responsive. Waiters can load the Web App on their phones. |
| **34-Time-Up Cues** | 🟡 3/5 | Borders show status, but explicit blinking warnings at exactly 15 minutes remaining aren't hooked up to a unified timer service yet. |
| **36-Breakage Fee** | 🟢 5/5 | Easily supported via custom fast-item addition. |
| **37-Expediter Inspection**| 🟡 4/5 | The KDS bumps items off, but doesn't have a secondary "Expediter Route" to double-confirm plating before runners take it. |
| **40-Clearing Dirty** | 🟢 5/5 | Status reset from Dirty -> Available works perfectly. |

## 9 & 10. Barista & Customers
| Scenario | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **42-Fulfilling Bar** | 🟡 3/5 | The KDS handles all items. Separate routing specifically for "Drinks" vs "Food" to different screens/printers isn't built yet. |
| **43-Auto Stock Mixers** | 🔴 2/5 | True recipe-based parent-child stock depletion (1 Soju Cocktail = -1 Soju, -1 Yakult) is lacking. Only 1:1 depletion works. |
| **46-Unli Time Limit** | 🟡 3/5 | Timers exist, but strict enforcement locking out orders when deep red isn't active. |
| **47-Pre-ordering** | 🔴 1/5 | Delayed firing (scheduling an order to fire to KDS at 5:00 PM automatically) is not supported. |
| **49-PWD Discounts** | 🟡 3/5 | Discounts work, but the exact VAT stripping math for fractional pax (2 out of 5 people being Senior) is a nightmare scenario not yet coded. |

## 11. Complex Edge Cases & Hyper-Specific Scenarios
| Scenario Focus | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **Mixed Tables (Kids/Ala Carte)** | 🔴 1/5 | No support for per-seat package mapping within a single table entity. |
| **Sneaky Downgrades** | 🔴 2/5 | POS doesn't natively check ticket history to block downgrades based on consumed premium items. |
| **Employee Rage Quit** | 🔴 1/5 | Emergency suspend shift mapping table states to a new owner isn't a feature. |
| **Pay By Item Drag-Drop** | 🔴 1/5 | Drag and drop split check UI isn't built. |
| **Historical Refund** | 🔴 2/5 | Looking up past days' receipts is possible via DB, but un-closing a Z-read shift to issue negative cash drops is unhandled. |
| **Automatic Gratuity** | 🟡 3/5 | Can apply service charges, but auto-triggering them instantly when Pax > 10 isn't coded. |

## 12. Accounting Anomalies & Ingredient Lifecycles
| Scenario Focus | Score | Notes on WTFPOS Viability |
| :--- | :---: | :--- |
| **Zero-Rated VAT** | 🔴 1/5 | Deep taxation engine stripping 12% off VATable base individually isn't built. |
| **Printer Error Catching**| 🔴 1/5 | SvelteKit backend cannot physically listen to local network dot-matrix printer paper jams. |
| **Store Credit Barcodes** | 🔴 1/5 | Emitting store credit vouchers as scannable JSON tokens isn't supported. |
| **No-More Garlic Cascade**| 🔴 2/5 | Stock reaches 0, but cascading relational menu item disabling isn't active. |
| **Supplier Qty Variances**| 🔴 1/5 | RTV (Return to Vendor) ledger states don't exist. |

---

### Executive Summary

**What WTFPOS Does Exceptionally Well TODAY:**
The core restaurant loop is extremely solid. The app receives customers, assigns tables, takes complex orders, fires those directly to the Kitchen Display System (KDS), allows for basic inventory deductions, checkout sequences, and table turnarounds (Dirty -> Clean). The new Takeout/Delivery functionality mirrors this successfully.

**The Major Missing Pillars (The "Hard Work"):**
1.  **Pin-Level Permissions System:** Currently, any UI interaction on the tablet is permitted. The app needs a strict role-based capability system where voids, discounts, and negative stock adjustments force a "Manager Authorization PIN" modal.
2.  **Complex Transaction Math & Split Check UI:** Stripping Zero-Rated VAT, splitting checks per item (not just total amounts), and applying fractional senior citizen discounts across mixed tables.
3.  **Relational Recipe Inventory (BOM - Bill of Materials):** Moving from a flat "1 Coke ordered = 1 Coke deducted" system to a recipe-based system ("1 Cocktail ordered = 100ml Vodka deducted, 1 Lime deducted").
4.  **Hardware Edge-Case Resilience:** Catching local printer timeout failures and strictly offline queuing.
