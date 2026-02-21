# 🔥 SAMGYUP POS — Product Requirements Document

> **Version:** 1.0  
> **Last Updated:** February 21, 2026  
> **Status:** Prototype (Client-side only)  
> **Stack:** React (Vite) · Vanilla CSS · In-memory state

---

## 1. Product Overview

**SAMGYUP POS** is a specialized Point-of-Sale system designed for Korean BBQ (samgyupsal) restaurants. It combines real-time table management, weight-based meat tracking, package-based unlimited dining, component-level inventory auditing, and role-based access into a single dark-themed, mobile-friendly interface.

### Core Philosophy

- **Batch/Component Tracking** — Track major ingredients (meat, rice, tofu, eggs) not micro-ingredients (5g garlic, 10ml soy sauce). At end of shift, reconcile POS usage vs. actual freezer loss to find profit leaks.
- **Weight-Based Meat Accountability** — Every gram of meat served is logged per table, per cut, per staff member.
- **Role-Based Simplicity** — Staff sees only what they need. Managers see everything. Kitchen sees only the queue.

---

## 2. User Roles & Access

| Role | PIN | Views | Capabilities |
|------|-----|-------|-------------|
| **Staff** | 1234 | Floor, Reports | Open/manage tables, add orders, checkout, view basic reports |
| **Manager** | 1058 | Floor, Stock, Recipes, Menu, Reports | All staff actions + inventory management, void overrides, full reports, recipe costing |
| **Kitchen** | — | Kitchen Queue | Read-only view of active orders across all tables |

### Authentication Flow

1. **Splash Screen** → Enter name, select role, click "Start Shift"
2. **PIN Verification** → 4-digit PIN pad (managers require separate PIN `1058`)
3. **Manager Override** → Staff can trigger manager-PIN modal for restricted actions (e.g., voiding)

---

## 3. Floor Management

### 3.1 Floor Map

A visual grid layout of **17 tables** with distinct types:

| Type | Tables | Seats | Visual |
|------|--------|-------|--------|
| Small | T1, T2 | 2 | Compact |
| Normal | T3–T7, T11–T13 | 4 | Standard |
| Large | T8–T10 | 6 | Wide |
| VIP | VIP1, VIP2 | 8 | Premium, oversized |
| Bar | BAR1, BAR2 | 2 | Compact, separate area |

**Table States:**
- 🟢 **Available** — Tap to open (enter pax count)
- 🔴 **Occupied** — Tap to view/manage running bill. Tap again for context menu

**Context Menu Actions (occupied tables):**
- View order
- Change pax count
- Merge tables (combine two occupied tables)
- Transfer table (move session to empty table)
- Void table (manager PIN required)

### 3.2 Table Session Lifecycle

```
Available → Open (set pax) → Select Package → Add Orders → Checkout → Available
```

1. **Open Table** — Staff selects pax count (1–12)
2. **Select Package** — Choose unlimited dining package (auto-adds sides)
3. **Order Phase** — Add meats (by weight), sides, dishes, drinks
4. **Checkout** — Generate receipt, apply discounts, select payment method
5. **Close** — Table returns to "Available", transaction logged

---

## 4. Packages & Ordering

### 4.1 Unlimited Dining Packages

| Package | Price/pax | Meats Included | Auto Sides |
|---------|-----------|----------------|------------|
| 🐷 Unli Pork | ₱349 | Samgyupsal, Liempo, Kasim | Rice, Lettuce, Sauce, Garlic, Kimchi |
| 🐄 Unli Beef | ₱449 | Beef Short Rib, Chadolbaegi | Rice, Lettuce, Sauce, Garlic, Kimchi, Mushroom |
| 🔥 Unli Pork & Beef | ₱499 | All 5 cuts | Rice, Lettuce, Sauce, Garlic, Kimchi, Mushroom, Egg |

**Behavior:**
- Selecting a package auto-charges `price × pax`
- Auto-sides are added to the order (qty = pax count) and deducted from inventory
- Package can be swapped mid-session (previous auto-sides removed, new ones added)

### 4.2 Order Types

| Type | Pricing | Inventory Impact | Example |
|------|---------|------------------|---------|
| **Meat** | FREE (included in package) | Deducts by exact weight (g) from service pool | 200g Samgyupsal |
| **Side** | FREE | Deducts 1 unit per serve | Kimchi refill |
| **Dish** | PAID (₱99–₱219) | Deducts major components via recipe | Kimchi Jjigae → 80g pork scraps, 100g kimchi, 0.5 tofu |
| **Drink** | PAID (₱35–₱130) | No inventory deduction | San Miguel beer |

### 4.3 Menu Items

**Dishes** (4 categories):
- **Snacks** — Tteokbokki, Kimbap, Mandu, Haemul Pajeon
- **Rice** — Bibimbap, Dolsot Bibimbap, Fried Rice
- **Noodles** — Japchae, Ramyun
- **Soup** — Sundubu Jjigae, Kimchi Jjigae

**Drinks** (7 items): Water, Softdrinks, San Miguel, Soju, Fruit Juice, Milk Tea, Somaek

---

## 5. Inventory & Stock Management

### 5.1 Stock Manager (Admin → Stock)

Three sub-tabs with a shared **Audit Log sidebar**:

#### Meats Tab
Displays each meat cut from the **MEAT_CATALOG** with per-variant tracking:

| Meat | Variants (Pools) |
|------|-------------------|
| Beef Short Rib | Whole Block (raw), Sliced/Grill (service), Bones (kitchen), Scraps (kitchen), Waste |
| Beef Brisket | Whole Block (raw), Sliced/Grill (service), Fat Cap (kitchen), Scraps (kitchen) |
| Pork Belly | Whole Slab (raw), Sliced/Grill (service), Scraps (kitchen), Fat/Skin (kitchen) |
| Pork Liempo | Whole Slab (raw), Sliced/Grill (service), Scraps (kitchen) |
| Pork Kasim | Whole Block (raw), Sliced/Grill (service), Scraps (kitchen) |

Each variant shows: current stock (g), progress bar vs. initial stock, and a click-to-adjust modal (MeatInputModal).

#### Sides Tab
Tracks 9 side items (Rice, Lettuce, Sauce, Garlic, Kimchi, Mushroom, Egg, Tofu, Corn) with current stock, par level, and adjustment modal (SideInputModal).

#### Pantry Tab
Tracks 25+ pantry items across categories:
- **Staples** — Rice, Noodles, Flour, Tteok, etc.
- **Sauces** — Gochujang, Gochugaru, Soy Sauce, Sesame Oil, etc.
- **Produce** — Garlic, Onion, Tofu, Eggs, Seaweed, etc.
- **Supplies** — Charcoal, Gas, Foil, Tissue, Gloves

Each pantry item has a **PantryInputModal** with:
- Add / Deduct / Set modes
- Preset amount buttons
- Manual amount input
- Reason/note field
- Image attachment (camera/file upload for delivery receipts)

### 5.2 Audit Log

A sidebar panel within the Stock view that records every stock change:

**Entry Fields:** Item name, category, delta (±), unit, timestamp, user name, user role, note, groupId, image

**Grouped Entries:** Related changes (e.g., all ingredient deductions from one Kimchi Jjigae order) share a `groupId` and render as a collapsible card with:
- Group header (recipe/order name, user, timestamp)
- Individual component deductions listed inside

**Image Attachments:** Manual adjustments can include a photo (displayed as "📷 View Attachment" toggle).

### 5.3 Recipe-Based Component Deductions

When a dish is ordered, the system automatically deducts **major components only**:

| Dish | Auto-Deducted Components |
|------|--------------------------|
| Kimchi Jjigae | 80g Pork Scraps, 100g Kimchi, 0.5 Tofu |
| Sundubu Jjigae | 60g Pork Scraps, 1 Tofu, 1 Egg |
| Bibimbap | 200g Rice, 60g Beef Scraps, 1 Egg |
| Fried Rice | 250g Rice, 60g Pork Scraps, 1 Egg |
| Tteokbokki | 200g Tteok |
| Kimbap | 200g Rice, 2 Seaweed sheets, 1 Egg |
| Mandu | 100g Pork Scraps, 80g Flour |
| Haemul Pajeon | 100g Flour, 2 Eggs |
| Japchae | 100g Glass Noodles, 50g Beef Scraps |
| Ramyun | 1 Ramyun pack, 1 Egg |

> **Design Decision:** Small condiments/seasonings (garlic, sesame oil, soy sauce, etc.) are NOT auto-deducted. They are managed via periodic pantry counts by the manager. This keeps the audit log clean and focused on accountable shrinkage.

---

## 6. Kitchen Queue (Kitchen Role)

A real-time, read-only dashboard for kitchen staff displaying:

- **Active table cards** — One card per occupied table
- **Per-table breakdown:**
  - 🥩 Meats ordered (with gram weights)
  - 🍜 Dishes & drinks
  - 🥬 Extra side requests
- **Header stats:** Active tables count, meat order count, dish order count
- **Elapsed time** per table (live-updating)

---

## 7. Checkout & Receipts

### Receipt Modal

When checking out a table, the **ReceiptModal** displays:
- Table label, pax count, package name, checkout time
- Full itemized order list (meats by weight, dishes by price, sides as free)
- Subtotal, applicable discounts, total
- **BIR-Compliant Tax Breakdown:**
  - Auto-generated sequential OR number (`OR-YYYYMMDD-XXXX`)
  - 12% VAT computation for regular sales
  - VAT-Exempt Sales computation for SC/PWD (20% off VATable amount, VAT removed)
- Payment method selection (Cash / GCash / Card)
- Change calculator for Cash payments

### Discount Types
- **Senior/PWD** — 20% discount (manager approval)
- **Custom %** — Flexible discount with reason

### Transaction Logging
Completed transactions stored with: table, pax, package, items, subtotal, discount, total, payment method, cashier name, timestamp.

---

## 8. Reports (Admin → Reports)

Available to both staff (limited) and managers (full):

- **Sales Analytics** — CSS-rendered dashboards showing:
  - Daily Revenue (bar chart)
  - Peak Hours (10AM–9PM activity heatmap)
  - Best Sellers (Package pax counts & top 10 à la carte items)
  - Payment Method Breakdown
  - Meat Consumption by Cut (kg and order count)
- **Sales Summary** — Total revenue, transaction count, average ticket
- **Transaction Log** — Itemized list of all completed checkouts
- **Void Log** — Record of all voided items/tables with reason and authorizer
- **Left-Without-Paying Log** — Tables closed without payment (manager-only)
- **SC/PWD Discount Log** — All discounts applied with authorization trail

---

## 9. Recipes View (Admin → Recipes)

A read-only catalog of all 10 dish recipes showing:
- Dish name, emoji, category, servings, prep time
- Full ingredient list with quantities and units
- Estimated cost vs. selling price
- Profit margin indicator

---

## 10. Menu Manager (Admin → Menu)

Displays the full menu catalog (Packages, Meats, Sides, Dishes, Drinks) in a browsable card layout for reference and future editing capabilities.

---

## 11. Technical Architecture

### State Management
- All state managed via React `useState` hooks in `App.jsx`
- No external state library (Redux, Zustand, etc.)
- State resets on page refresh (no persistence layer yet)

### File Structure

```
src/
├── constants.js          # Packages, meats, sides, dishes, drinks, tables, initial inventory
├── adminConstants.js     # Meat catalog (variants), sides catalog, pantry catalog, recipes, stock initializers
├── helpers.js            # Utility functions (uid, currency format, time format, bill/cost calculators)
├── styles.js             # CSS-in-JS injection for global styles
├── components/
│   ├── App.jsx           # Root component — all state, business logic, routing
│   ├── Splash.jsx        # Login/authentication screen
│   ├── PINModal.jsx      # Manager PIN verification overlay
│   ├── FloorMap.jsx      # Visual table grid with context menus
│   ├── RunningBill.jsx   # Side panel showing active table's order
│   ├── AddItemModal.jsx  # Package/meat/side/dish/drink ordering modal
│   ├── KitchenView.jsx   # Kitchen queue dashboard
│   ├── ReceiptModal.jsx  # Checkout/receipt generation
│   ├── Reports.jsx       # Sales & audit reports
│   ├── forms/            # OpenForm, PaxForm
│   ├── ui/               # Chip, UserBadge, MWrap, Misc, TCM
│   └── admin/
│       ├── StockManager.jsx    # Meats/Sides/Pantry stock + Audit Log sidebar
│       ├── MeatInputModal.jsx  # Meat variant adjustment modal
│       ├── SideInputModal.jsx  # Side adjustment modal
│       ├── PantryInputModal.jsx # Pantry adjustment modal (with image upload)

│       ├── RecipeView.jsx      # Recipe catalog viewer
│       └── MenuManager.jsx     # Menu catalog browser
```

### Design System
- **Theme:** Dark mode with CSS custom properties (`--panel`, `--card`, `--ember`, `--border`, etc.)
- **Typography:** Syne (headings), DM Mono (numbers), system sans-serif (body)
- **Colors:** Orange accent (`--ember`), green (positive), red (negative), purple (manager), blue (staff)

---

## 12. Simplicity Recommendations

The current prototype has features that add cognitive load without proportional value for a small samgyupsal operation. The following recommendations prioritize **speed of service** and **ease of training** over feature completeness.

### What to Keep Simple

| Area | Current State | Recommendation |
|------|---------------|----------------|
| **Meat Variants** | 4–5 pools per cut (raw, sliced, scraps, bones, waste) | **Reduce to 2:** Raw Stock → Service Stock. Kitchen scraps/bones/waste are not worth tracking at this scale. A manager can do a manual "waste count" at end of day instead. |
| **Pantry Catalog** | 25+ items with individual tracking | **Track only high-cost pantry items** (rice, tteok, noodles, eggs, tofu, flour). Condiments/seasonings should be restocked by visual check, not POS deduction. |
| **Recipe Deductions** | Auto-deducts components per dish | **Keep, but limit to 1–3 major components per dish.** If a dish only uses cheap condiments (like Tteokbokki), consider skipping auto-deduction entirely and just logging the sale. |
| **Audit Log Images** | Photo attachment per stock change | **Keep for deliveries/receiving only.** Photo-logging every pantry adjustment creates friction. |
| **Role System** | Staff, Manager, Kitchen | **Good as-is.** Three roles is the sweet spot. |
| **Floor Map** | 17 tables with merge/transfer | **Keep merge/transfer but make them manager-only.** Staff should not be moving sessions around. |

### Simplification Principles

1. **If it takes more than 2 taps, staff won't use it.** Every ordering flow should be: tap item → confirm → done.
2. **Don't track what you can't act on.** If a 10g garlic discrepancy doesn't change any decision, don't track it.
3. **End-of-shift is the accountability moment.** All reconciliation happens once (closing), not continuously.
4. **Train for the happy path.** The app should work perfectly for the 95% case. Edge cases (voids, merges, custom discounts) require manager PIN — that's by design.

---

## 13. Critical Development Gaps

The following are **must-have** features before this system can be used as a real POS in production. Without these, the app is a demo, not a tool.



### 🟡 Operational Gaps (Needed for Production)

| # | Gap | Why It Matters | Effort |
|---|-----|----------------|--------|
| 7 | **True Cloud Sync** | `BroadcastChannel` only works on one machine. Need WebSocket backend (e.g., Supabase, Firebase) for multi-tablet setups. | High |
| 8 | **End-of-Day Closing (Z-Read Lock)** | Need a way to permanently "close the register," lock the day's transactions, and reset counters for tomorrow. | Medium |
| 9 | **Cash Drawer Tracking** | No opening float, no cash-in/cash-out logging. Manager cannot reconcile physical cash vs. POS expected cash at end of shift. | Low |
| 10 | **Hardware Printer Integration** | Currently uses browser print dialog for KOT. Needs direct ESC/POS integration to auto-print to kitchen without cashier clicking "Print" on a prompt. | Medium |
| 11 | **Proper Authentication** | PINs are hardcoded. Need per-user PINs stored securely in database, with the ability to add/edit/disable staff accounts. | Low |

### 🟢 Nice to Have (Reports & Analytics)

| # | Report/Feature | Description | Value |
|---|----------------|-------------|-------|
| 12 | **Wait-Time Analytics** | Report on average time from table open to first order, and first order to checkout. Helps optimize floor turnaround. | Spots slow service |
| 13 | **Staff Performance Matrix** | Tables served per staff, total sales generated, average table duration, and void counts per server. | Identifies top/bottom performers |
| 14 | **Wastage / Variance Report** | Automated comparison of actual entered meat stock vs theoretically consumed meat stock to highlight shrinkage/theft. | Stops inventory leaks |
| 15 | **Customer Loyalty / CRM** | Phone number tracking for visit counts. "10th visit free" or birthday promos integrated into checkout. | Drives repeat business |
| 16 | **Automated Reordering List** | End-of-week report listing exactly what pantry/meat items need to be purchased to hit par levels. | Saves manager time |

---

## 14. Operational Recommendations

### Daily Workflow (Recommended)

```
MORNING (Before Open)
├── Manager logs in, does "Opening Count"
│   ├── Count cash in drawer → log opening float
│   ├── Check meat freezer → update raw stock
│   ├── Check pantry → update high-value items
│   └── Verify all tables are "Available"
│
SERVICE HOURS
├── Staff handles floor (open tables, add orders, checkout)
├── Kitchen watches the queue screen
├── Manager handles overrides (voids, discounts, stock adjustments)
│
CLOSING (After Last Table)
├── Manager runs End-of-Day
│   ├── Close all tables
│   ├── Print Z-Reading
│   ├── Count actual meat remaining → compare vs POS
│   ├── Count cash → compare vs POS
│   ├── Log any discrepancies
│   └── Lock the day
```

### Key Metrics to Watch

| Metric | Target | Red Flag |
|--------|--------|----------|
| **Meat Usage per Pax** | 300–400g | >500g = over-serving or theft |
| **Avg Ticket per Pax** | ₱400–550 | <₱350 = too many discounts |
| **Void Rate** | <2% of orders | >5% = process problem or abuse |
| **Shrinkage (Meat)** | <5% gap (POS vs actual) | >10% = serious leak |
| **Table Turnover** | 90 min average | >120 min = need time limits |

---

## 15. Future Roadmap

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Backend / Cloud DB** | Move data off `localStorage` into a real DB (e.g. Supabase) for multi-device sync and backup |
| 🔴 High | **End-of-Day Lock** | Shift-closing routines with cash drawer float tracking and inventory variance calculation |
| 🟡 Medium | **Hardware Printing** | Background ESC/POS printing (receipts & KOT) to bypass browser print dialogs |
| 🟡 Medium | **User Management** | Real auth system with managed PINs instead of hardcoded strings |
| 🟢 Low | **CRM / Loyalty** | Track customer visits via phone numbers for points/rewards |
| 🟢 Low | **Advanced Reporting** | Wait-time analytics, staff performance matrices, automated reordering lists |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **Pax** | Number of persons at a table |
| **Package** | Unlimited dining plan (priced per pax) |
| **Auto-sides** | Sides automatically included with a package |
| **Service pool** | Sliced/ready-to-serve meat inventory |

| **Component tracking** | Deducting only major, countable ingredients (not micro-seasonings) |
| **Batch tracking** | Managing inventory at the product level, not at the recipe-ingredient level |
| **Shrinkage** | The gap between what POS says was used vs. what's actually missing from stock |
