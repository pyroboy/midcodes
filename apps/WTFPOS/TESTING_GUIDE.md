# WTFPOS — Manual Testing Guide

**App:** WTF! Samgyupsal Point-of-Sale System
**Version:** 0.1-alpha (mock data, no backend)
**Dev server:** `pnpm dev` → `http://localhost:5173`
**Automated tests:** `pnpm test` (requires dev server running)

---

## Quick Start

### 1. Start the app

```bash
cd apps/WTFPOS
pnpm dev
```

Open `http://localhost:5173` in your browser.

### 2. Test Accounts

Log in using these credentials. All passwords match the username.

| Username | Password | Role    | Branch            | Destination |
|----------|----------|---------|-------------------|-------------|
| `maria`  | `maria`  | Staff   | Alta Citta (Tagbilaran)    | `/pos`      |
| `juan`   | `juan`   | Manager | Alta Citta (Tagbilaran)    | `/pos` + PIN |
| `pedro`  | `pedro`  | Kitchen | Alta Citta (Tagbilaran)    | `/kitchen`  |
| `ana`    | `ana`    | Staff   | Alona Beach (Panglao)    | `/pos`      |
| `carlo`  | `carlo`  | Manager | Alona Beach (Panglao)    | `/pos` + PIN |
| `jose`   | `jose`   | Kitchen | Alona Beach (Panglao)    | `/kitchen`  |
| `noel`   | `noel`   | Staff   | Tagbilaran Warehouse      | `/stock`    |
| `chris`  | `chris`  | Owner   | All Branches      | `/pos`      |

**Manager PIN (for sensitive actions):** `1234`

### 3. Menu Reference

| Category | Item | Price |
|----------|------|-------|
| **Packages** | 🐷 Unli Pork | ₱499/pax |
| | 🐄 Unli Beef | ₱699/pax |
| | 🔥 Unli Pork & Beef | ₱899/pax |
| **Meats** | Samgyupsal (pork) | ₱0.65/g (weight-based) |
| | Chadolbaegi (pork) | ₱0.75/g |
| | Pork Sliced | ₱0.70/g |
| | Galbi (beef) | ₱0.90/g |
| | US Beef Belly | ₱1.20/g |
| | Beef Sliced | ₱1.10/g |
| **Sides** | Kimchi | FREE |
| | Japchae | ₱120 |
| | Steamed Rice | ₱35 |
| **Dishes** | Doenjang Jjigae | ₱120 |
| | Bibimbap | ₱150 |
| **Drinks** | Soju (Original) | ₱95 |
| | San Miguel Beer | ₱75 |
| | Iced Tea | ₱65 |
| | Bottled Water | ₱40 |

---

## Role Access Matrix

| Module | Staff | Kitchen | Manager | Owner |
|--------|-------|---------|---------|-------|
| `/pos` — Floor & POS | ✅ | ❌ | ✅ | ✅ |
| `/kitchen` — KDS & Weigh | ❌ | ✅ | ✅ | ✅ |
| `/stock` — Inventory | ❌ | ❌ | ✅ | ✅ |
| `/expenses` — Expenses | ❌ | ❌ | ✅ | ✅ |
| `/reports` — Reports | ❌ | ❌ | ✅ | ✅ |
| `/admin` — Admin panel | ❌ | ❌ | ❌ | ✅ |
| Switch branches | ❌ | ❌ | ✅ | ✅ |

---

## Module 1 — POS Floor (`/pos`)

**Login as:** `maria` (Tagbilaran Staff) or `ana` (Panglao Staff)

### 1.1 Open a Table

1. On the floor map, find a **white** table card — these are available.
2. Click it → **Pax Modal** appears.
3. Click a number (e.g., **4**) to set guest count.
4. The table turns **green** and the **Add to Order** modal opens automatically.

> The floor also shows occupied/free/maintenance counters at the top.

---

### 1.2 Add Items to an Order

After a table is opened, the Add to Order modal appears. Use category tabs at the top:

**Adding a Package:**
1. Click the **Package** tab.
2. Click **🐷 Unli Pork** (or any package).
3. The tab auto-switches to **Meats** — initial meats and sides are pre-staged as FREE.

**Adding Meats (weight-based):**
1. Click the **Meats** tab.
2. Click **Samgyupsal** → a weight entry screen appears.
3. Tap a preset (e.g., `150g`) or enter custom weight, then confirm.
4. The meat appears in the pending list on the right.

**Adding Sides / Dishes / Drinks:**
1. Click the **Sides**, **Dishes**, or **Drinks** tab.
2. Click any item to add it (quantity defaults to 1).
3. Click the same item again to increase quantity.
4. Use `−` / `+` buttons in the pending list to adjust.

**Charge the order:**
1. Click **⚡ CHARGE** at the bottom right of the modal.
2. All pending items are pushed to the order ticket.
3. The modal closes; the order sidebar shows all items.

---

### 1.3 Sidebar Controls (while order is active)

Select an occupied table to open the order sidebar on the right:

| Button | What it does |
|--------|-------------|
| **+ Add to Order** | Reopen the item selection modal |
| **👥 Pax** | Change guest count (recalculates per-pax packages) |
| **💳 Checkout** | Start payment flow |
| **Transfer** | Move this order to another table |
| **Merge** | Combine with another table's order |
| **Change Package** | Upgrade or remove the active AYCE package |
| **Split Bill** | Divide bill into sub-bills per guest |
| **Void** | Cancel entire order (requires Manager PIN `1234`) |
| **History** | View all closed orders for the day |

---

### 1.4 Change Pax Mid-Session

1. With an active order, click **👥 Pax** in the sidebar.
2. Enter new count → confirm.
3. If a package is active, the package total recalculates automatically (new pax × package price).

---

### 1.5 Apply a Discount

In the checkout modal (after clicking **💳 Checkout**):

**Senior Citizen / PWD (20%):**
1. Click **👴 Senior** or **♿ PWD** button.
2. The qualifying pax stepper defaults to 1 — adjust with `−` / `+`.
3. Enter the **SC/PWD ID number** for each qualifying person.
4. The discount amount shows live as you fill in details.

**Other discounts:**
- **🎟️ Promo** — flat promotional discount (no PIN required).
- **💯 Comp** — writes off the entire bill; requires Manager PIN `1234`.
- **❤️ Service Rec** — service recovery comp; requires Manager PIN `1234`.

> Only one discount type can be active at a time.

---

### 1.6 Leftover Penalty (AYCE packages only)

When an order has a package and you click **💳 Checkout**, the **Leftover Penalty** modal appears first:

1. If no unconsumed meat → click **Skip / Checkout**.
2. If there is leftover meat → use the numpad to enter the weight in grams.
3. Click **Apply & Checkout** → penalty added to total at ₱50/100g.
4. To waive the penalty → click **Waive (Manager)** → enter PIN `1234`.

---

### 1.7 Checkout & Payment

After passing the leftover step (or skipping it):

1. **Checkout modal** shows: Subtotal, Discount, VAT (12%), **Total**.
2. **Payment Method:**
   - **💵 Cash** → tap a preset amount or click **Exact** → change is shown.
   - **📱 GCash / Maya** → hold payment (marked pending, confirm later).
3. **Confirm Payment** button activates once payment is valid.
4. Click **✓ Confirm Payment** (1.2s simulated print) → table closes and becomes white again.

> Checkout is blocked until all SC/PWD ID fields are filled (if discount applied).

---

### 1.8 Split Bill

1. With a multi-item order, click **Split Bill** in the sidebar.
2. The modal lists all order items.
3. Assign items to Guest 1, Guest 2, etc. (drag or select).
4. Close and pay each guest's sub-bill independently via the sidebar.

---

### 1.9 Transfer a Table

1. Click **Transfer** in the sidebar.
2. A modal lists all available tables in the same branch.
3. Click the destination table → order moves there.
4. Original table becomes available.

---

### 1.10 Merge Tables

1. Click **Merge** in the sidebar.
2. Select another occupied table to merge into.
3. All items from both orders combine into the destination table's order.
4. Current table becomes available.

---

### 1.11 Void an Order

1. Click **Void** in the sidebar.
2. **Manager PIN** modal appears → enter `1234`.
3. Select a reason: **Mistake**, **Walkout**, or **Write-off**.
4. Confirm → order is cancelled, table becomes available.
5. Void is logged in the audit trail.

---

### 1.12 Takeout Orders

1. Click **📦 New Takeout** (top right of floor map).
2. Enter customer name (optional, defaults to "Walk-in").
3. Takeout order appears in the queue below the floor.
4. Click the takeout card to select it, then add items using the same modal.
5. Progress status: **New → Preparing → Ready → Picked Up**.
6. Advance status manually or via kitchen (items bumped on KDS).
7. Checkout same as dine-in.

---

### 1.13 Order History & Receipt Reprint

1. Click **🧾 History** (top right).
2. Closed orders for the day are listed.
3. Click any order to view the receipt.
4. Use the print button to reprint.

---

### 1.14 Table Status Guide

| Color | Status | Meaning |
|-------|--------|---------|
| White | Available | Empty, ready for new guests |
| Green | Occupied | Dining in progress, timer running |
| Yellow | Warning | ~75 min elapsed, approaching limit |
| Red (pulsing) | Critical | ~85 min elapsed, needs attention |
| Orange | Billing | Bill printed, awaiting payment |
| Cyan | Pending e-wallet | GCash/Maya held, awaiting confirmation |
| Gray dashed | Maintenance | Table out of service |

---

### 1.15 Maintenance Mode

1. Right-click (or long-press) a table card → **Toggle Maintenance**.
2. Table turns gray and cannot be seated.
3. Toggle again to return to available.

> Only manager/owner can toggle maintenance (enforced by Manager PIN for some actions).

---

## Module 2 — Kitchen Display System (`/kitchen`)

**Login as:** `pedro` (Tagbilaran Kitchen) or `jose` (Panglao Kitchen)

### 2.1 Active Orders Queue (`/kitchen/orders`)

The KDS shows all pending items grouped by table as ticket cards.

**Each ticket shows:**
- Table label or customer name
- Items grouped: **MEATS** / **DISHES & DRINKS** / **SIDE REQUESTS**
- Age timer (green → yellow → red as time passes)
- Print status indicator (✅ success / ❌ failed)

---

### 2.2 Mark an Item as Served

1. Find the item on a ticket card.
2. Click the **✓** button on the right of that item.
3. Item grays out and is removed from the active queue.
4. When all items on a ticket are done, the ticket disappears.

---

### 2.3 Bump All (Complete Entire Ticket)

1. At the bottom of a ticket, click **BUMP ALL ✓**.
2. All items on that ticket are marked served simultaneously.
3. Ticket disappears from queue.

---

### 2.4 Recall Last Bumped Ticket

1. Click **↩ Recall Last** (top right, only active when history exists).
2. The most recently bumped ticket reappears.
3. All its items revert to pending status.

---

### 2.5 Refuse an Item

1. Hover over an item → **Refuse** button appears.
2. Click **Refuse** → a reason prompt appears.
3. Enter a reason (e.g., "Out of stock", "Customer changed mind").
4. Item is marked cancelled.
5. An alert notification appears in the POS sidebar on the staff's screen.
6. The staff must **Acknowledge** the alert.

---

### 2.6 Mark Item as Sold Out (86'd)

1. Hover over a meat item → **Mark Sold Out** appears.
2. Click to toggle: item becomes unavailable in the POS menu.
3. Toggle again to restore availability.

---

### 2.7 Retry a Failed Print

1. If a ticket shows a red ❌ print indicator, click **Retry**.
2. System attempts to resend to the kitchen printer.
3. Indicator updates to ✅ on success.

---

### 2.8 Weigh Station (`/kitchen/weigh-station`)

A dedicated dark-mode screen for the meat prep station.

**Layout:** Left panel (pending orders) | Center (numpad + weight) | Right panel (dispatch log)

**Flow:**
1. Click a pending meat order in the left panel — it highlights orange.
2. The center shows: "Weighing for T4 — Samgyupsal".
3. Enter weight using the numpad (max 5 digits).
4. Click **DISPATCH ✓**.
5. Entry appears in the right log: table, meat name, weight, timestamp.
6. Total dispatched weight (grams → kg) updates at the bottom of the log.

**Numpad controls:** `0–9` to enter, `C` to clear, `⌫` to backspace.

---

## Module 3 — Stock Management (`/stock`)

**Login as:** `juan` (Tagbilaran Manager), `carlo` (Panglao Manager), `noel` (Warehouse), or `chris` (Owner)

### 3.1 Inventory (`/stock/inventory`)

View current stock levels for all tracked items.

**Table columns:** Item, Category, Unit, Current Stock, Min Level, Status

| Badge | Meaning |
|-------|---------|
| 🟢 OK | Stock above minimum level |
| 🟡 LOW | Below minimum, order soon |
| 🔴 CRITICAL | At or below critical threshold |

**Inline adjustment:**
1. Click the **Edit** icon on any row.
2. Enter the corrected quantity and select a reason (e.g., "Physical Count").
3. Click **Confirm** → adjustment logged to audit trail.

---

### 3.2 Receive Delivery (`/stock/receive`)

Record incoming stock from a supplier.

1. Select **Supplier** from dropdown.
2. Select **Item** to receive.
3. Enter **Quantity** and **Unit** (kg, pieces, etc.).
4. Optionally add **Batch/Lot Number** and **Expiry Date**.
5. Click **Receive** → preview shows old stock → new stock.
6. Click **Confirm Receipt** → stock updated, audit logged.

---

### 3.3 Waste Log (`/stock/waste`)

Record spoiled or trimmed inventory.

1. Select **Item**.
2. Enter **Quantity**.
3. Select **Reason**: Trimming, Spoilage, Expiry, Breakage, Other.
4. Add optional notes.
5. Click **Log Waste** → stock decreases, entry logged.

---

### 3.4 Stock Counts (`/stock/counts`)

Scheduled physical counts at 10 AM, 4 PM, 10 PM.

1. Click **Start [10 AM / 4 PM / 10 PM] Count**.
2. For each item, enter the physically counted quantity.
3. System shows **Variance** (expected vs. actual).
4. Discrepancies are highlighted.
5. Click **Submit Count** → count locked for that period, variance logged.

---

### 3.5 Stock Transfers (`/stock/transfers`)

Move stock between Tagbilaran Branch, Panglao Branch, and Tagbilaran Warehouse.

**3-step wizard:**

**Step 1 — Select item & quantity:**
- Choose source location and item.
- Enter transfer quantity (must be ≤ available stock).
- Preview shows remaining stock after transfer; warns if below minimum.

**Step 2 — Choose destination:**
- Select target location (source location is disabled).
- Shows destination's current + projected stock.

**Step 3 — Confirm:**
- Summary: Source before/after | → | Destination before/after.
- Optional notes (e.g., "Weekly replenishment").
- Click **Confirm Transfer** → stock updated both sides, logged.

**Recent transfers** are listed below the wizard (last 20 entries).

---

## Module 4 — Expenses (`/expenses`)

**Login as:** `juan`, `carlo`, or `chris`

### 4.1 Record an Expense

1. Select **Category**: Supplies, Utilities, Repairs, Staff Meals, Cleaning, Misc, etc.
2. Enter **Amount (₱)**.
3. Enter **Description** (e.g., "Replenish LP gas").
4. Select **Paid By**: Petty Cash, Register, Company Card, Owner's Pocket.
5. Click **➕ Record Expense** → appears in the log immediately.

### 4.2 Delete an Expense

1. Find the entry in the log.
2. Click **✕** to remove it (same-day entries only).

---

## Module 5 — Reports (`/reports`)

**Login as:** `juan`, `carlo`, or `chris`

All reports are filterable by **date** and **branch** (owner sees all branches).

### Operations

| Report | What it shows |
|--------|--------------|
| **Meat Variance** | Expected vs. actual meat usage; highlights waste/theft |
| **Table Sales** | Revenue per table, avg check, pax, session time |
| **Voids & Discounts** | All voided orders + reasons; SC/PWD discount breakdown |
| **X-Read** | Live shift snapshot (does not close the shift); click **Generate X-Read** to save a snapshot |
| **EOD** | End-of-day blind close; enter cash drawer count → shows Cash Over/Short |
| **Staff Performance** | Orders, avg ticket, and efficiency per staff member |

### Expenses

| Report | What it shows |
|--------|--------------|
| **Daily Expenses** | All expenses today by category + pie chart |
| **Monthly Expenses** | Month-over-month trend and budget vs. actual |

### Revenue & Sales

| Report | What it shows |
|--------|--------------|
| **Sales Summary** | Total sales, transaction count, avg ticket, dine-in vs. takeout split |
| **Best Sellers** | Items ranked by quantity sold and revenue contribution |
| **Peak Hours** | Hourly heatmap of orders and revenue |

### Profitability

| Report | What it shows |
|--------|--------------|
| **Gross Profit** | Revenue minus COGS; highlights high-margin items |
| **Net Profit** | Gross Profit minus operating expenses; full P&L |

### Branch

| Report | What it shows |
|--------|--------------|
| **Branch Comparison** | Tagbilaran vs. Panglao side-by-side: sales, pax, avg ticket, waste %, labor |

### X-Read Flow

1. Go to **Reports → X-Read**.
2. Click **Generate X-Read** → current totals are snapshot and saved to history.
3. Snapshot does **not** close the shift (non-destructive).
4. Use this mid-shift to check running totals.

### EOD Flow

1. Go to **Reports → EOD** at end of shift.
2. Count physical cash in drawer and enter the amount.
3. System calculates:
   - Expected cash = Opening Float + Cash sales − Cash expenses
   - **Cash Over** (green) or **Cash Short** (red) shown
4. Review the summary, then click **Submit EOD Report** to finalize the shift.

---

## Module 6 — Administration (`/admin`)

**Login as:** `chris` (Owner only)

### 6.1 User Management (`/admin/users`)

**Add a user:**
1. Click **+ Add User**.
2. Fill: Display Name, Username, Role, Branch, Temporary Password.
3. Click **Create User**.

**Edit a user:**
1. Click **Edit** on any row.
2. Update role, branch, or display name.
3. Click **Save**.

**Deactivate / Activate:**
1. Click **Deactivate** → user cannot log in.
2. Click **Activate** to restore access.

---

### 6.2 Audit Logs (`/admin/logs`)

View every system action logged across all branches.

**Filter by:**
- **Action type:** All, Order, Payment, Stock, Auth, Admin, Expense
- **Branch:** All, Tagbilaran, Panglao

**Log columns:** Time | Type | Description | User | Branch

Sample entries:
- `🍽 Order — T5 opened with 4 pax, Unli Pork`
- `💰 Payment — T5 paid ₱1,996 via Cash, change ₱4`
- `📦 Stock — Samgyupsal received: 5000g from Supplier ABC`
- `⚙️ Admin — User 'Maria Santos' created as Staff (Tagbilaran)`

---

### 6.3 Floor Editor (`/admin/floor-editor`)

Visual editor for table layout per branch.

1. Select **Tagbilaran Branch** or **Panglao Branch** tab.
2. **Drag** table cards to reposition them on the canvas.
3. Click a table → right sidebar lets you edit:
   - **Label** (e.g., "T1", "VIP-1")
   - **Capacity** (number of seats)
4. Click **+ Add Table** to create a new table.
5. Select a table and click **Remove Table** to delete it.
6. Click **Save Layout** to persist changes, or **Discard** to cancel.

---

### 6.4 Menu Management (`/admin/menu`)

Configure all menu items available in POS.

**Category tabs:** All | Packages | Meats | Sides | Dishes | Drinks

**Add an item:**
1. Click **+ Add Item**.
2. Fill: Name, Category, Price, Description.
3. Toggle options: Weight-based? Free item? Track inventory?
4. If weight-based → enter price per gram.
5. If package → select included meats and auto-sides.
6. Click **Create Item**.

**Toggle availability (86 an item):**
1. Click the **Available** toggle on any row.
2. Item becomes unavailable in POS immediately.
3. Toggle again to restore.

**Delete an item:**
1. Click **Delete** → confirmation modal.
2. Click **Confirm Delete** → item removed from all future orders.

---

## Full Test Flows

### Flow A — Standard Dine-In (Happy Path)

**Role:** Staff (maria/ana) | **Branch:** Any

1. Log in → navigate to `/pos`.
2. Click an available table (white) → select **4 pax**.
3. In Add to Order modal:
   - Select **Package → 🐷 Unli Pork** (auto-adds meats + sides).
   - Switch to **Drinks** → add **Iced Tea**.
   - Click **⚡ CHARGE**.
4. In the sidebar, verify the total is correct (₱499 × 4 pax = ₱1,996 base + drinks).
5. Click **💳 Checkout**.
6. **Leftover modal** → click **Skip / Checkout** (no leftover).
7. **Checkout modal:**
   - Click **👴 Senior** → enter `SC-9999` in the ID field.
   - Click **Exact** (for cash).
   - Click **✓ Confirm Payment**.
8. Table should return to white (available). Receipt prints (1.2s simulated).
9. Verify the closed order appears in **🧾 History**.

---

### Flow B — Kitchen & POS Cross-Communication

**Roles:** Staff (POS) + Kitchen (KDS) — use two browser tabs or windows

**Part 1 — Staff opens order:**
1. Log in as `maria` → open T3 with 3 pax + **Unli Beef** package.
2. Add **Galbi (beef)** meat (300g) from the Meats tab.
3. Click **⚡ CHARGE**.

**Part 2 — Kitchen refuses item:**
1. In the second tab, log in as `pedro`.
2. Navigate to `/kitchen/orders`.
3. Find T3's ticket → hover over **Galbi** → click **Refuse**.
4. Enter reason: `Out of stock`.

**Part 3 — Staff acknowledges:**
1. Back in the first tab (maria), a red alert banner appears in the sidebar.
2. Click **Acknowledge**.
3. Alert dismisses. Staff informs customer and offers alternative.

---

### Flow C — Pax Change with Package Recalculation

**Role:** Manager (juan) | **Branch:** Tagbilaran

1. Log in as `juan` (PIN `1234`) → open T2 with **2 pax** and **🔥 Unli Pork & Beef** (₱899 × 2 = ₱1,798).
2. In the sidebar, note the current total.
3. Click **👥 Pax** → change to **5 pax**.
4. Total should recalculate: ₱899 × 5 = ₱4,495.
5. Add a couple of drinks, charge them, then checkout.

---

### Flow D — Takeout Order Full Flow

**Role:** Staff (maria) | **Branch:** Tagbilaran

1. Click **📦 New Takeout** → enter customer name `Gino`.
2. Select `Gino`'s order in the takeout queue.
3. Add items: **Bibimbap** + **Soju**.
4. Click **⚡ CHARGE**.
5. Click **💳 Checkout** → pay ₱245 via Cash → confirm.
6. Takeout status should advance to **Picked Up**.

---

### Flow E — Stock Count (10 AM Cycle)

**Role:** Manager or Warehouse Staff (noel) | **Branch:** Tagbilaran / Warehouse

1. Log in → navigate to `/stock/counts`.
2. Click **Start 10 AM Count**.
3. For each listed item, enter the actual counted quantity.
4. Note items with highlighted variance (expected vs. actual differ).
5. Click **Submit Count** → count locked.
6. Navigate to **Reports → Meat Variance** to see the logged variance.

---

### Flow F — Stock Transfer (Warehouse to Branch)

**Role:** Manager (juan) or Owner (chris)

1. Navigate to `/stock/transfers`.
2. **Step 1:** Select source = `Tagbilaran Warehouse`, item = `Samgyupsal`, qty = `2000g`.
3. **Step 2:** Select destination = `Alta Citta (Tagbilaran Branch)`.
4. **Step 3:** Review summary → add note `Weekly replenishment` → click **Confirm Transfer**.
5. Check `/stock/inventory` → Tagbilaran Branch Samgyupsal stock should increase by 2000g.

---

### Flow G — EOD Blind Close

**Role:** Manager or Owner

1. Ensure at least a few orders have been processed in the session.
2. Navigate to `/reports/eod`.
3. Enter the cash drawer count (simulate by entering any number, e.g., `5000`).
4. View the **Cash Over/Short** result.
5. Click **Submit EOD Report**.
6. Navigate to **Reports → Sales Summary** to confirm shift data is locked.

---

### Flow H — Branch Comparison (Owner Only)

**Role:** Owner (chris)

1. Log in as `chris` → navigate to `/reports/branch-comparison`.
2. Verify that both **Alta Citta (Tagbilaran)** and **Alona Beach (Panglao)** data is shown.
3. Compare: Sales, Pax count, Average ticket, Waste %.
4. Use the branch selector in the TopBar to switch the active branch view.

---

### Flow I — Admin User Creation & Log Verification

**Role:** Owner (chris)

1. Navigate to `/admin/users` → click **+ Add User**.
2. Create: Name = `Test Staff`, Username = `testuser`, Role = `staff`, Branch = `pgl`, Password = `test`.
3. Log out → log in as `testuser` / `test` → verify they land on `/pos` for Panglao.
4. Log back in as `chris` → go to `/admin/logs`.
5. Filter by **Auth** → verify login events for `testuser` appear in the log.

---

### Flow J — Void Order (Walkout)

**Role:** Manager (juan)

1. Open T6 with 2 pax, add items, charge them.
2. In the sidebar, click **Void** → enter Manager PIN `1234`.
3. Select reason: **Walkout**.
4. Confirm → T6 returns to white (available).
5. Navigate to **Reports → Voids & Discounts** → confirm the void is listed.

---

## Checklist

### Login & Access

- [ ] Login as each of the 8 test accounts and verify the correct destination page
- [ ] Manager accounts show PIN modal on login (PIN: `1234`)
- [ ] Staff sees only `/pos`; kitchen sees only `/kitchen`
- [ ] Owner can switch between Tagbilaran, Panglao, and All branches in the TopBar
- [ ] Staff/kitchen cannot switch branches (branch selector hidden)

### POS Floor

- [ ] Available table (white) → pax modal appears on click
- [ ] Occupied table (green) → sidebar opens on click (no pax modal)
- [ ] Maintenance table (gray) → click does nothing
- [ ] Table timer increments every second while occupied
- [ ] Warning (yellow) and Critical (red pulsing) states appear at time thresholds
- [ ] Add items: packages, meats (weight input), sides, dishes, drinks
- [ ] Auto-sides and auto-meats are pre-added as FREE when a package is selected
- [ ] CHARGE button pushes pending items to the order
- [ ] Pax change recalculates per-pax package price
- [ ] SC discount requires ID input before checkout is enabled
- [ ] Leftover penalty modal appears for package orders before checkout
- [ ] Payment: Cash shows change; GCash/Maya shows pending hold state
- [ ] Checkout receipt prints (1.2s delay), table becomes white
- [ ] Split bill creates sub-bills per guest
- [ ] Transfer moves order to another table, original table clears
- [ ] Merge combines two tables' orders
- [ ] Void requires Manager PIN and reason; table clears after
- [ ] Takeout order flow: create → add items → checkout → picked up
- [ ] History shows closed orders; receipt reprint works

### Kitchen

- [ ] KDS shows pending items grouped by table
- [ ] Age timer changes color over time (green → yellow → red)
- [ ] Mark individual item served → grays out on ticket
- [ ] Bump All → entire ticket clears
- [ ] Recall Last → bumped ticket reappears in queue
- [ ] Refuse item → reason prompt → alert appears in POS sidebar
- [ ] Acknowledge alert in POS → alert dismisses
- [ ] Mark item sold out → unavailable in POS menu; toggle restores it
- [ ] Failed print shows ❌ → Retry button re-sends

### Weigh Station

- [ ] Pending meat orders appear in left panel
- [ ] Select order → center shows item name + table
- [ ] Numpad entry (0-9, C, ⌫) updates weight display
- [ ] Dispatch → entry appears in right log with timestamp
- [ ] Total dispatched weight updates (grams → kg)

### Stock

- [ ] Inventory table shows all items with status badges (OK/LOW/CRITICAL)
- [ ] Inline stock adjustment updates quantity and logs to audit
- [ ] Receive delivery increases stock
- [ ] Log waste decreases stock
- [ ] Stock count: enter actual counts, variance is shown
- [ ] Stock transfer 3-step wizard reduces source and increases destination

### Expenses

- [ ] Record expense with all fields → appears in log
- [ ] Delete same-day expense → removed from log
- [ ] Branch filter shows only current branch expenses

### Reports

- [ ] X-Read generates a snapshot without closing the shift
- [ ] EOD blind close shows Cash Over/Short based on entry
- [ ] Meat Variance shows usage delta
- [ ] Branch Comparison only available to Owner (chris)
- [ ] All report tabs load without error

### Admin (Owner only)

- [ ] Add, edit, deactivate/activate users
- [ ] Audit logs filter by type and branch
- [ ] Floor editor: drag, rename, add, delete tables; save layout
- [ ] Menu manager: add, edit, toggle availability, delete items

---

## Known Limitations (Alpha Build)

These are by design for the current in-memory prototype:

1. **No persistence** — All data resets on page refresh. Each browser session starts fresh.
2. **Simulated hardware** — Receipt printer and kitchen printer are mocked (1.2s delay). No real devices connected.
3. **No payment gateway** — GCash/Maya holds are cosmetic only.
4. **No inventory hard-block** — Orders can be placed even if stock is at zero (kitchen must refuse manually).
5. **No multi-user sync** — Two browser tabs do not share live state.
6. **No real BIR integration** — X-Read and EOD reports are simulated; no actual fiscal data.
7. **Dashboard** (`/dashboard`) — Placeholder, coming in Phase 4.

---

## Running Automated Tests

Playwright tests live in `e2e/`. Requires the dev server to be running first.

```bash
# Terminal 1 — start the app
pnpm dev

# Terminal 2 — run all e2e tests
pnpm test

# Run with Playwright UI (visual step-by-step)
pnpm test:ui

# Run a single test file
pnpm exec playwright test e2e/order.spec.ts
```

The existing test (`e2e/order.spec.ts`) covers: login → open table → add package + drink → checkout with SC discount → confirm payment.

---

*For questions about features or to report bugs, contact the developer (Arturo Magno).*
