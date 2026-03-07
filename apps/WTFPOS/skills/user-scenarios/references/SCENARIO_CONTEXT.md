# SCENARIO_CONTEXT — WTFPOS User Scenarios Quick Reference

Quick-reference file read during **Step 2** of the user-scenarios skill workflow.
Keep this file up to date when routes, roles, or locations change.

---

## Locations

| ID | Display Name | Type | Notes |
|---|---|---|---|
| `tag` | Alta Citta (Tagbilaran) | retail | Alta Citta Mall, Tagbilaran City, 6300 Bohol |
| `pgl` | Alona Beach (Panglao) | retail | Panglao Circumferential Rd, Tawala, Panglao, 6300 Bohol |
| `wh-tag` | Tagbilaran Central Warehouse | warehouse | Inventory only — no POS, no KDS, no floor |
| `all` | All Locations | retail (UI-only) | Aggregate view — never stored in documents |

**Warehouse rule:** `isWarehouseSession()` returns true for `wh-tag`. POS, Kitchen, and Floor Editor are hidden.

---

## Roles & Route Access

| Role | Location Switch | Can switch to `all`? | Accessible Routes |
|---|---|---|---|
| `staff` | Locked | No | `/pos` |
| `kitchen` | Locked | No | `/kitchen/*`, `/stock/*` |
| `manager` | Free | Yes | `/pos`, `/kitchen/*`, `/stock/*`, `/reports/*` |
| `owner` | Free | Yes | `/pos`, `/kitchen/*`, `/stock/*`, `/reports/*`, `/admin/*` |
| `admin` | Free | Yes | `/pos`, `/kitchen/*`, `/stock/*`, `/reports/*`, `/admin/*` |

**Elevated roles** (can switch locations): `manager`, `owner`, `admin`
**Admin roles** (can access `/admin`): `owner`, `admin`
**Manager PIN:** `1234` — single hardcoded PIN for all manager-level approvals

---

## All Available Routes (as of 2026-03-07)

| Route | Section | Primary Role | Notes |
|---|---|---|---|
| `/` | Login | All | Role card selection + PIN modal for manager |
| `/pos` | POS | staff, manager, owner | Floor plan + order sidebar + checkout |
| `/kitchen` | Kitchen | kitchen | Redirects to `/kitchen/orders` |
| `/kitchen/orders` | Kitchen | kitchen | KDS queue — active tickets |
| `/kitchen/all-orders` | Kitchen | kitchen, manager | All orders view |
| `/kitchen/weigh-station` | Kitchen | kitchen | Bluetooth scale integration |
| `/stock` | Stock | kitchen, manager | Redirects to `/stock/inventory` |
| `/stock/inventory` | Stock | kitchen, manager | Inventory list + edit |
| `/stock/deliveries` | Stock | kitchen, manager | Receive deliveries |
| `/stock/transfers` | Stock | manager | Inter-branch transfers |
| `/stock/counts` | Stock | kitchen, manager | Stocktake / physical counts |
| `/stock/waste` | Stock | kitchen, manager | Waste logging (Manager PIN required) |
| `/reports` | Reports | manager, owner | Redirects to first report tab |
| `/reports/eod` | Reports | manager, owner | End-of-Day (Z-Read) |
| `/reports/x-read` | Reports | manager, owner | X-Read mid-shift audit |
| `/reports/sales-summary` | Reports | manager, owner | Sales totals by date range |
| `/reports/best-sellers` | Reports | manager, owner | Top items by quantity/revenue |
| `/reports/profit-gross` | Reports | manager, owner | Gross profit |
| `/reports/profit-net` | Reports | manager, owner | Net profit |
| `/reports/peak-hours` | Reports | manager, owner | Busiest time slots |
| `/reports/voids-discounts` | Reports | manager, owner | Void and discount log |
| `/reports/expenses-daily` | Reports | manager, owner | Daily expense tracking |
| `/reports/expenses-monthly` | Reports | manager, owner | Monthly expense roll-up |
| `/reports/table-sales` | Reports | manager, owner | Revenue per table |
| `/reports/branch-comparison` | Reports | owner | Side-by-side tag vs pgl |
| `/reports/staff-performance` | Reports | owner, admin | Per-staff order/void metrics |
| `/reports/meat-report` | Reports | manager, owner | Meat yield and waste analytics |
| `/expenses` | Expenses | manager, owner | Expense recording (Phase 3 placeholder) |
| `/admin` | Admin | owner, admin | Redirects to `/admin/users` |
| `/admin/users` | Admin | owner, admin | User management |
| `/admin/menu` | Admin | owner, admin | Menu item CRUD |
| `/admin/logs` | Admin | owner, admin | Audit log viewer |
| `/admin/floor-editor` | Admin | owner, admin | SVG floor plan editor |
| `/admin/devices` | Admin | owner, admin | Bluetooth/hardware device management |
| `/dashboard` | Dashboard | owner | Phase 3 stub |
| `/register/[tableId]` | POS | staff | Redirects to `/pos` |

---

## Manager PIN Gates (Operations Requiring PIN 1234)

| Operation | Route | Who requests | Who approves |
|---|---|---|---|
| Void an order item | `/pos` | staff | manager |
| Apply discount (service recovery, comp, PWD, SC) | `/pos` checkout | staff | manager |
| Pax (headcount) change after seating | `/pos` | staff | manager |
| Waste log finalization | `/stock/waste` | kitchen | manager |
| Cancel a running AYCE timer | `/pos` | staff | manager |
| Refund / reversal | `/pos` | staff | manager |

---

## Location-Aware Behavior Rules

1. **Every list/query** must filter by `session.locationId`
2. **Every new record** must include `locationId: session.locationId`
3. **`locationId = 'all'`** shows aggregate or cross-branch view — never silently filters to one branch
4. **Staff/kitchen** always land at their locked branch after login — cannot see other branch data
5. **Manager/owner/admin** at `all`: sees data from both `tag` and `pgl` combined

---

## Key Data Models (relevant to scenario generation)

| Model | Key fields | Where used |
|---|---|---|
| `Table` | `id`, `locationId`, `status`, `pax`, `openedAt`, `timer` | `/pos` floor plan |
| `Order` | `id`, `locationId`, `tableId`, `items[]`, `status`, `discountType`, `paymentMethod` | POS, KDS |
| `OrderItem` | `menuItemId`, `qty`, `status`, `kdsStatus`, `notes` | KDS tickets |
| `MenuItem` | `id`, `name`, `price`, `category`, `isAvailable`, `locationId` | Menu, POS, KDS |
| `KdsTicket` | `orderId`, `tableId`, `locationId`, `items[]`, `createdAt`, `bumpedAt` | `/kitchen/orders` |
| `InventoryItem` | `id`, `locationId`, `name`, `unit`, `qty`, `category` | `/stock/inventory` |
| `WasteLog` | `id`, `locationId`, `itemId`, `qty`, `reason`, `approvedBy`, `updatedAt` | `/stock/waste` |
| `Delivery` | `id`, `locationId`, `items[]`, `receivedAt`, `receivedBy` | `/stock/deliveries` |
| `StockCount` | `id`, `locationId`, `counts[]`, `conductedAt`, `conductedBy` | `/stock/counts` |
| `Transfer` | `id`, `fromLocationId`, `toLocationId`, `items[]`, `status`, `createdAt` | `/stock/transfers` |
| `AuditLog` | `id`, `locationId`, `action`, `actor`, `payload`, `createdAt` | `/admin/logs` |

---

## Known Implementation Gaps (Baseline from ASSESSMENT_USER_SCENARIOS.md, March 2026)

| Feature | Status | Notes |
|---|---|---|
| X-Read mid-shift audit | Route exists (`/reports/x-read`) | Data wiring unconfirmed |
| Expense recording | MISSING — Phase 3 placeholder | `/expenses` shows stub only |
| Allergen/ingredient search | MISSING | Menu items don't store ingredient breakdowns |
| Server/waiter assignment | MISSING | No server tracking on orders |
| Per-user PINs | PARTIAL | Single hardcoded PIN 1234, not per-user |
| KDS Recall/History | MISSING | No "undo bump" functionality found |
| Fire rate / AYCE abuse flag | MISSING | No per-table consumption rate metric |
| Staff performance metrics | PARTIAL | Audit log exists; no performance dashboard |
| Comp/void manager PIN gate | PARTIAL | CheckoutModal has comp type; PIN gate absent |
| Branch comparison report | IMPLEMENTED | `/reports/branch-comparison` exists |
| Floor editor (admin) | PARTIAL | Can place/move; no VIP grouping |
| Bluetooth scale (weigh station) | PARTIAL | Connection + reading exists; flow incomplete |
| KDS 86 / mark sold-out | PARTIAL | MenuItem `isAvailable` exists; KDS button unclear |
| Transfer between branches | Route exists (`/stock/transfers`) | Status unknown |
| EOD / Z-Read | IMPLEMENTED | `/reports/eod` wired |
| Meat report | IMPLEMENTED | `/reports/meat-report` exists |

---

## Samgyupsal-Specific Context

| Concept | Description |
|---|---|
| AYCE | All-You-Can-Eat — timed session (typically 90 min), customers order unlimited refills |
| Refill | Kitchen sends additional meat plates to the table during AYCE session |
| Pax | Number of people at the table — affects billing for AYCE packages |
| 86 | Marking an item as sold out / unavailable |
| Butcher yield | Raw meat weight → usable portion weight (% yield tracked per delivery) |
| Waste log | Records spoilage, dropped trays, preparation waste — requires Manager PIN |
| X-Read | Mid-shift cash drawer audit — does NOT close the shift, does NOT reset counters |
| Z-Read / EOD | End-of-day report — permanently closes the shift, resets daily counters to zero |
| BIR | Bureau of Internal Revenue — Philippine tax authority; Z-Read must be BIR-compliant |
| Comp | 100% discount authorized by manager (owner's family, service failure, etc.) |
| PWD discount | 20% discount for Persons with Disability — required by Philippine law |
| Senior citizen discount | 20% discount for 60+ years old — required by Philippine law |
| GCash / Maya | Philippine e-wallets (digital payment methods alongside cash) |
| VAT | 12% Philippine value-added tax |

---

## Z-Read vs X-Read — Full Explanation

### X-Read (Mid-Shift Audit)
- **What it does:** Snapshot of all sales since the last Z-Read, without closing the shift
- **Who runs it:** Manager, anytime during the day
- **Effect on data:** None — counters unchanged, shift remains open
- **Frequency:** As many times as needed per day
- **BIR status:** Not a BIR document; internal management tool only
- **Use case:** "Count the drawer now and verify it matches the system before the evening rush"
- **Critical:** If X-Read shows ₱18,750 and the drawer has ₱17,920 — ₱830 is missing right now

### Z-Read (End-of-Day / EOD)
- **What it does:** Closes the current shift permanently and resets the daily sales counter to zero
- **Who runs it:** Manager (or owner); once per day, end of service
- **Effect on data:** Permanent — creates an immutable record, new shift begins
- **Frequency:** Exactly once per day (running twice creates two Z-Read records — BIR violation risk)
- **BIR status:** Official legal document in the Philippines. Must be kept on file for 10 years.
- **What the Z-Read must show (BIR requirements):**
  - Business name, TIN (Tax Identification Number), address
  - OR (Official Receipt) number range for the day
  - Gross sales, VAT-able sales, VAT amount, VAT-exempt sales
  - Total discounts (Senior Citizen, PWD, etc.)
  - Net taxable sales
  - Payment method breakdown (Cash, GCash, Maya)
  - Beginning and ending OR counters
- **If not run:** The next day's sales accumulate on top — the system shows inflated single-day revenue; BIR records are wrong
- **If run at wrong time:** Sales after the Z-Read go onto the next day's record — legitimate, but confusing during reconciliation

---

## BIR Inspector Scenario Context

A BIR (Bureau of Internal Revenue) inspector can arrive **unannounced** at any operating business
in the Philippines. Typically happens 1–3x per year per establishment. During a BIR visit:

**What they ask for:**
1. BIR Certificate of Accreditation for the POS machine (if applicable)
2. The Z-Read (Daily Sales Report) for the **past 30 days** — printed or printable
3. VAT registration certificate (COR — Certificate of Registration)
4. Official Receipts for the current day
5. Sales Journal / Summary of Sales report

**What they check:**
- Do Z-Read totals match the OR number sequences? (gap in OR numbers = suspicious)
- Are VAT amounts correctly computed (12% of net sales)?
- Are Senior Citizen / PWD discounts properly documented and deducted from VAT base?
- Is the business remitting the correct amount to BIR monthly?

**What WTFPOS must support for BIR compliance:**
- Historical Z-Read retrieval by date
- VAT breakdown on receipts and Z-Read
- SC/PWD discount tracking separate from regular discounts
- OR number sequencing (official receipt counter)
- Ability to print or export the Z-Read on demand

**If WTFPOS cannot produce any of the above:** The owner faces fines, penalties, or forced
closure until compliant. This is why `/reports/eod` and the Z-Read flow are not optional features.

---

## Staff Incident Context

### Rage Quit / Walkout
- A staff member abruptly stops working and leaves the premises
- Common trigger: argument with manager, overwork during rush, personal crisis
- System impact: active tables may have open orders without a cashier to close them;
  if the device belongs to the staff member (BYOD), session may lock on their device
- Manager must: identify affected tables from `/pos`, take over or reassign, close any dangling orders
- No "force logout" feature currently exists — manager cannot remotely end another user's session

### Early Exit Without Closing Tables
- Shift ends, cashier logs out or leaves, but tables remain open (mid-AYCE, waiting for bill)
- System impact: next shift cashier sees active tables but has no context on what was ordered,
  how long the timer has been running, or whether the customer has asked for the bill
- Manager must: review each open table's order history in `/pos`, brief incoming cashier verbally
- Risk: if AYCE timer has been running since before shift change, time may have expired unnoticed

### No-Show / Understaffed
- Only 1 cashier shows up for a multi-cashier shift (common on weekends)
- Manager must cover POS duties themselves
- Problem: manager is the PIN approver AND the PIN requester — no segregation of duties
- System has no awareness of this conflict; manager can approve their own voids (theft risk)
- Owner should be notified, but no in-system alerting mechanism exists

### Wrong Role Login
- Kitchen staff logs in as `staff` (cashier) by mistake — roles look similar on login screen
- They land on `/pos` instead of `/kitchen/orders`
- KDS receives no acknowledgments from kitchen side (the cook is operating the POS instead)
- Tables are being seated and ordered, but kitchen has no one watching the KDS
- Manager notices: no food coming out, tickets piling up, customers getting angry
- Fix: manager must have the cook log out and log in again with the correct role card

### Shift Handover Without Briefing
- Outgoing cashier finishes shift without informing incoming cashier of:
  - Which tables have already paid vs. are waiting for bill
  - Which items have been 86'd
  - Any pending manager approvals (voids/discounts mid-authorization)
  - Current cash float amount in the drawer
- The incoming cashier goes in blind — the system is their only source of truth
- This is why active table state, 86 status, and open orders must be immediately visible on `/pos`

---

## Hardware Failure Context

| Failure | Immediate Impact | Recovery |
|---|---|---|
| Main POS tablet crashes | Active orders inaccessible if on that device only (Phase 1, IndexedDB local) | Reboot device; RxDB restores from IndexedDB |
| Bluetooth scale offline | Weigh station cannot record meat weight; kitchen guesses portions | Log weight manually; reconnect scale from `/admin/devices` |
| Receipt printer offline | Cannot print customer receipts or Z-Read | Customers get no receipt (legal issue); manager must note for reprinting |
| Power blip (< 5 seconds) | Browser may reload; if RxDB write was mid-operation, may corrupt | RxDB is transactional — partial writes rolled back; reload restores state |
| Extended power outage | Full system down; no orders can be processed | Paper fallback; reconstruct in system once power restored |
| Internet down | Phase 1 is fully offline-first — no impact (RxDB/IndexedDB only) | Zero impact; system continues normally |
