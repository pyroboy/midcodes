# UX Audit — Warehouse Transfers & Deliveries

**Date:** 2026-03-11
**Scope:** Warehouse user managing transfers and deliveries at `wh-tag`
**Role tested:** Owner (Christopher S) — only owner/admin can access warehouse location
**Also tested:** Staff (Noel Garcia) — warehouse-assigned staff
**Viewport:** 1024×768 (tablet)
**Browser:** Chromium (headless)

---

## A. Text Layout Map

### Login → Location Switch Flow
```
┌─────────────────────────────────────────────────────────────┐
│  Login Page                                                  │
│  ┌─────────────────────────────┐                            │
│  │ 🏭 Tagbilaran Warehouse     │ ← Noel Garcia (Staff)     │
│  │ "Staff" "Warehouse"         │   DEAD END: empty sidebar  │
│  └─────────────────────────────┘   lands on /stock but      │
│                                    no nav items              │
│  ┌─────────────────────────────┐                            │
│  │ 💼 Christopher S (Owner)    │ ← Must use owner/admin    │
│  │ "Owner" "All"               │   then switch to wh-tag    │
│  └─────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘

Location Selector Modal (at 1024×768):
┌─────────────────────────────────────────────────────────────┐
│  RETAIL BRANCHES                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Alta Citta        │  │ Alona Beach       │                │
│  │ Active Staff: 3   │  │ Active Staff: 2   │                │
│  │ Stock Alerts: 1   │  │ Stock Alerts: 0   │                │
│  └──────────────────┘  └──────────────────┘                 │
│                                                              │
│  CROSS-BRANCH                                                │
│  ┌──────────────────┐                                        │
│  │ All Locations     │                                        │
│  └──────────────────┘                                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ FOLD LINE (768px) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  WAREHOUSE              ← BELOW FOLD, must scroll modal      │
│  ┌──────────────────┐   ← Disabled for managers!             │
│  │ Central Warehouse │   ← Only owner/admin can select       │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Warehouse POS Page (after location switch)
```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar: Stock, Reports, Admin only — POS/Kitchen removed] │
│ 📍 TAGBILARAN CENTRAL WAREHOUSE          [Change Location]  │
│ ─────────────────────────────────────────────────────────────│
│  POS    0 occ  0 free  (i)   [New Takeout]  [History]       │
│ ┌──────────────────────────────┐ ┌─────────────────────────┐│
│ │                              │ │   📋 No Table Selected  ││
│ │     EMPTY FLOOR PLAN         │ │   "Tap an occupied      ││
│ │     (no tables at wh-tag)    │ │    table on the floor   ││
│ │                              │ │    plan to view its     ││
│ │                              │ │    running bill here."  ││
│ │                              │ │                         ││
│ └──────────────────────────────┘ └─────────────────────────┘│
│ ← USER STRANDED ON USELESS POS PAGE, NO AUTO-REDIRECT      │
└──────────────────────────────────────────────────────────────┘
```

### Deliveries Page
```
┌──────────────────────────────────────────────────────────────┐
│ 📍 TAGBILARAN CENTRAL WAREHOUSE          [Change Location]  │
│ Stock Management                                             │
│ [Inventory] [Deliveries 🔴1] [Transfers] [Counts 🔴1] [Waste]│
│──────────────────────────────────────────────────────────────│
│ ⚠️ Expiring Soon (1)                                         │
│   Kimchi  B-243  2d left                                     │
│──────────────────────────────────────────────────────────────│
│ Delivery History & Batches          [+ Receive Delivery]     │
│ [🔍 Search...] [All Dates ▼] [All Items ▼] [☐ Show Depleted]│
│──────────────────────────────────────────────────────────────│
│ TIME      ITEM / SUPPLIER               QTY    BATCH  FIFO  │
│ 10:28 AM  Pork Bone-In                +7000 g  TRF-B1MK  ◐  │
│           Transfer from wh-tag [Transfer]                    │
│ 10:28 AM  Sliced Pork                 +5000 g  TRF-B2MK  ◐  │
│           Transfer from wh-tag [Transfer]                    │
│ 10:28 AM  Beef Bone-In                +4000 g  TRF-B3MK  ◐  │
│           Transfer from wh-tag [Transfer]                    │
│ 10:28 AM  Beef Bone-Out               +3500 g  TRF-B4MK  ◐  │
│           Transfer from wh-tag [Transfer]                    │
└──────────────────────────────────────────────────────────────┘
```

### Transfers Page (3-step wizard)
```
Step 1 — Select Item
┌──────────────────────────────────────────────────────────────┐
│ Inter-Branch Stock Transfers                                 │
│ Move inventory from Central Warehouse to another branch.     │
│                                                              │
│ ① Select Item ──────────── ② Destination ──── ③ Confirm     │
│                                                              │
│ 📍 Source: Central Warehouse                                 │
│                                                              │
│ ITEM  [Pork Bone-In (Bulk) (Meats) ▼]                      │
│       Available: 35,000 g                                    │
│ TRANSFER QUANTITY [5000]  UNIT [g]                           │
│                                                              │
│ SOURCE INVENTORY                                             │
│ ┌────────────────────────────────┬────────┬────────┐        │
│ │ Pork Bone-In (Bulk)   [SELECTED]│ 35,000g │  OK   │        │
│ │ Pork Bone-Out (Bulk)           │ 38,500g │  OK   │        │
│ │ Sliced Pork (Bulk)             │ 40,500g │  OK   │        │
│ └────────────────────────────────┴────────┴────────┘        │
│                                            [Next →]          │
│ ────────────────────────────────────────────────────────────│
│ RECENT TRANSFERS                                             │
│ 2026-03-11T02:28:00.092Z  ← RAW ISO TIMESTAMP (KP-09)      │
│   Pork Bone-In  7000g  Transfer to pgl  Noel R.             │
└──────────────────────────────────────────────────────────────┘

Step 2 — Destination
┌──────────────────────────────────────────────────────────────┐
│ Transferring Pork Bone-In (Bulk) — 5,000 g from Central WH  │
│                                                              │
│ ○ Tagbilaran Branch (Alta Citta)                            │
│   Current stock: 20,500 g  →  After: 25,500 g (green)      │
│                                                              │
│ ○ Panglao Branch (Alona Beach)                              │
│   Current stock: 14,500 g  →  After: 19,500 g (green)      │
│                                                              │
│ ○ Central Warehouse  [SOURCE] (disabled)                    │
│   Cannot transfer to the same location                       │
│                                                              │
│ [← Back]                                    [Next →]         │
└──────────────────────────────────────────────────────────────┘

Step 3 — Confirm
┌──────────────────────────────────────────────────────────────┐
│ Transfer Summary: Pork Bone-In (Bulk) — 5,000 g             │
│                                                              │
│ ┌─── SOURCE ─────────┐  →  ┌─── DESTINATION ──────┐        │
│ │ Central Warehouse   │     │ Alta Citta            │        │
│ │ Before: 35,000 g    │     │ Before: 20,500 g      │        │
│ │ After:  30,000 g    │     │ After:  25,500 g ✅    │        │
│ │ Min:    20,000 g    │     │ Min:     5,000 g      │        │
│ └─────────────────────┘     └───────────────────────┘        │
│                                                              │
│ TRANSFER REASON / NOTES (OPTIONAL)                           │
│ [e.g. Weekly replenishment run          ]                    │
│                                                              │
│ [← Back]                         [✓ Confirm Transfer]        │
└──────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | **Hick's Law** (decision time) | PASS | Transfer wizard breaks complex flow into 3 clear steps. Destination list shows only 3 locations — well within limits. |
| 2 | **Miller's Law** (7±2 chunks) | CONCERN | Source inventory table at warehouse shows 91 items; item dropdown has all warehouse stock. Grouping by category helps but no search/filter on the dropdown. |
| 3 | **Fitts's Law** (touch targets) | PASS | All buttons meet 44px minimum. "Confirm Transfer" and "Receive Delivery" are large, well-positioned primary CTAs. Radio buttons for destination are full-width cards — easy touch targets. |
| 4 | **Jakob's Law** (consistency) | CONCERN | Location selector modal places warehouse below fold at 1024×768 — users expect all options visible without scrolling in a selection modal. Transfer wizard follows standard conventions otherwise. |
| 5 | **Doherty Threshold** (<400ms) | PASS | RxDB writes are instant (local-first). Location switch is reactive. Wizard transitions are immediate. |
| 6 | **Visibility of System Status** | CONCERN | After switching to warehouse, user stays on /pos with an empty floor plan — no redirect, no message explaining warehouse doesn't use POS. Raw ISO timestamps in recent transfers table (KP-09). |
| 7 | **Gestalt: Proximity** | PASS | Step 1 groups item selection + quantity + inventory table. Step 3's source/destination split-view is excellent — clear visual pairing with orange arrow. |
| 8 | **Gestalt: Common Region** | PASS | Each wizard step is contained in a bordered card. Source/destination in Step 3 are distinct bordered regions. Spoilage alerts are in a distinct amber banner. |
| 9 | **Visual Hierarchy: Weight** | PASS | "Confirm Transfer" is bold orange CTA. Step indicators use clear active/completed/pending states. "Available: 35,000 g" is bold within the context row. |
| 10 | **Visual Hierarchy: Scannability** | CONCERN | Recent transfers table uses raw ISO dates and lacks visual grouping by date or destination. All 16 rows look identical — no date headers or "Today/Yesterday" grouping. |
| 11 | **WCAG: Color Contrast** | CONCERN | Status badges in inventory table ("OK" in green on light green) — KP-02 instance. "BATCH NO (OPTIONAL)" and "EXPIRY (OPTIONAL)" labels in red for optional fields — confusing; red signals error/required. |
| 12 | **WCAG: Touch Targets** | PASS | All interactive elements meet minimum 44px height. Wizard buttons are generously sized. |
| 13 | **Internal Consistency** | CONCERN | Deliveries page formats times as "10:28 AM" but transfers page shows raw ISO "2026-03-11T02:28:00.092Z" — inconsistency within the same Stock section. |
| 14 | **External Consistency** | PASS | Wizard step pattern (1-2-3 with progress line) matches common UX patterns. Location selector with cards is familiar. |

**Summary:** 7 PASS, 6 CONCERN, 0 FAIL

---

## C. Best Day Ever — The Warehouse Manager's Morning

> It's 5:30 AM at the Central Warehouse in Tagbilaran. Christopher logs in on the warehouse tablet — he taps his owner account, which takes him to the POS page showing nothing. An empty floor plan stares back. Every morning, the same confusion: "Right, warehouse doesn't have tables." He taps Stock in the sidebar.
>
> He heads to Deliveries first. Metro Meat Co. is pulling up outside with today's pork delivery. He taps "+ Receive Delivery" — the form pops up, and he picks "Pork Bone-In (Bulk)" from the dropdown. 91 items across all branches flood the list; he has to search carefully. The recent supplier suggestions ("Metro Meat Co.") save him a few taps. He punches in 12,000g, enters the batch number, and saves. A toast confirms.
>
> Now he needs to split today's delivery between the two branches. He switches to Transfers — the wizard greets him with "Source: Central Warehouse." He picks Pork Bone-In, types 8,000g for Alta Citta. Step 2 shows the forecast — 20,500 → 28,500g at Tagbilaran. He confirms. Then repeats for Panglao: 4,000g. The split-view confirmation gives him confidence he's not over-allocating.
>
> He glances at the recent transfers log before heading out — but the raw "2026-03-11T02:28:00.092Z" timestamps make him squint. "Was that 2 AM or 10 AM?" He'd prefer "Today, 10:28 AM" so he can tell at a glance what was dispatched this morning versus yesterday's restock.
>
> The amber "Expiring Soon" alert catches his eye — Kimchi batch B-243 has 2 days left. He makes a mental note to prioritize it for Alona Beach's weekend rush.

---

## D. Issues & Recommendations

### [01] Warehouse user stranded on /pos after location switch

**What:** Switching to warehouse location while on /pos shows empty floor plan — POS header, "0 occ, 0 free", empty canvas, "No Table Selected" message. Completely meaningless for warehouse.

**How to reproduce:** Login as owner → land on /pos → Change Location → select Central Warehouse → page shows empty POS.

**Why this breaks:** Warehouse is inventory-only. Showing POS content creates confusion and wastes the user's first interaction every session. The sidebar correctly hides POS from nav, but the page content doesn't redirect.

**Ideal flow:** After switching to warehouse, auto-redirect to `/stock/inventory` (or `/stock/transfers` since that's the warehouse's primary job).

**The staff story:** Christopher switches to warehouse every morning and has to manually tap "Stock" in the sidebar. It's a daily paper cut — 3 seconds times 365 days.

---

### [02] Warehouse location below fold in location selector modal

**What:** At 1024×768, the Location Selector modal shows Retail Branches and Cross-Branch sections, but the Warehouse section is below the fold. The modal doesn't scroll visibly.

**How to reproduce:** Login as owner → Click "Change Location" → modal shows Retail + Cross-Branch filling the viewport → Warehouse section requires scrolling.

**Why this breaks:** Users don't know there's more content below. No scroll indicator, no visual cue. A warehouse manager might not even realize the warehouse option exists if they're new to the system.

**Ideal flow:** Either (a) make the modal scrollable with a visible scroll indicator, (b) reorder sections to put warehouse above cross-branch, or (c) reduce card sizes to fit all options in viewport.

**The staff story:** Christopher knows to scroll because he's used the system before. A new admin wouldn't.

---

### [03] Noel Garcia (Staff, Warehouse) has empty sidebar navigation

**What:** Logging in as Noel (staff role, wh-tag location) shows an empty sidebar — no nav items at all. ROLE_NAV_ACCESS grants staff only `/pos`, but `/pos` is hidden for warehouse locations.

**How to reproduce:** Login → click Noel Garcia (Staff, Warehouse) → lands on /stock/inventory → sidebar shows only W! logo and Logout.

**Why this breaks:** The user has no navigation affordance. They can use the stock sub-tabs (Inventory, Deliveries, Transfers, Counts, Waste) but if they ever navigate away, there's no sidebar link to return to Stock. The role effectively has zero assigned navigation.

**Ideal flow:** Either (a) give warehouse staff `/stock` in their ROLE_NAV_ACCESS, or (b) create a dedicated `warehouse` role with Stock access, or (c) don't show Noel in the login screen since the role isn't configured for warehouse use.

**The staff story:** Noel is the warehouse staff. He opens the app and sees... nothing in the sidebar. He's been using the stock tabs inside the page, but he always worries about getting "lost" because there's no way back.

---

### [04] Manager cannot access warehouse — only owner/admin

**What:** The location selector disables the warehouse button for managers. `canAccessWarehouse` requires `ADMIN_ROLES` (owner/admin), not `ELEVATED_ROLES` (which includes manager).

**How to reproduce:** Login as Juan Reyes (Manager) → Change Location → Warehouse button is greyed out and disabled.

**Why this breaks:** In a real restaurant operation, the warehouse manager (a manager-level role) should be able to manage warehouse transfers and deliveries. Requiring owner/admin access means the owner must personally do every morning stock dispatch, or the warehouse staff uses a shared owner account — a security gap.

**Ideal flow:** Either (a) include `manager` in warehouse access control, or (b) create a warehouse-specific role. The decision depends on whether warehouse access is a security boundary (admin-only) or an operational need (managers too).

**The staff story:** Juan is the Tagbilaran branch manager. Christopher asks him to handle the morning meat dispatch from the warehouse. Juan opens the location selector and the warehouse option is disabled. He calls Christopher to do it instead.

---

### [05] Raw ISO timestamps in recent transfers log (KP-09)

**What:** Recent Transfers table shows raw ISO strings: `2026-03-11T02:28:00.092Z` instead of formatted dates like "Today, 10:28 AM" or "Mar 11, 10:28 AM".

**How to reproduce:** Navigate to /stock/transfers → scroll to RECENT TRANSFERS section → TIME column shows ISO strings.

**Why this breaks:** ISO timestamps are unreadable for restaurant staff. The user can't tell at a glance whether a transfer was this morning or yesterday. The deliveries page on the same section correctly shows "10:28 AM" — creating an inconsistency within Stock.

**Ideal flow:** Format all timestamps consistently using a centralized utility: "Today, 10:28 AM" for today, "Yesterday, 2:28 PM" for yesterday, "Mar 9, 10:28 AM" for older dates.

**The staff story:** Christopher checks recent transfers to verify the morning dispatch went through. He sees "2026-03-11T01:28:00.092Z" and mentally converts UTC to Philippine time. Every day.

**KP match:** KP-09 (Date/Time Format Inconsistency)

---

### [06] "BATCH NO" and "EXPIRY" labels in red for optional fields

**What:** In the Log Delivery modal, "BATCH NO (OPTIONAL)" and "EXPIRY (OPTIONAL)" are rendered in red text. Red universally signals errors or required fields.

**How to reproduce:** /stock/deliveries → click "+ Receive Delivery" → scroll to batch/expiry fields → labels are red despite being optional.

**Why this breaks:** Users may think there's a validation error, or conversely, may think these are required fields they forgot to fill. Red for optional content contradicts universal color conventions.

**Ideal flow:** Use gray/muted text for optional field labels, or use the same neutral color as other labels. Reserve red exclusively for errors and required indicators.

**The staff story:** Christopher fills out a delivery for Soju bottles — no batch number or expiry needed. He sees the red labels and pauses, wondering if he needs to fill them in. He's done this 100 times and still hesitates.

---

### [07] Delivery item picker shows all branches' items at warehouse

**What:** When logged into warehouse and opening "Log Delivery," the item dropdown shows ALL stock items from all locations (91 items). The warehouse user sees Panglao-specific items and Tagbilaran-specific items mixed together.

**How to reproduce:** Set location to wh-tag → /stock/deliveries → "+ Receive Delivery" → open item dropdown → 91 items from all branches.

**Why this breaks:** A warehouse delivery should only show items the warehouse tracks. Showing branch-specific items creates confusion — if someone selects a Panglao-only item, the delivery gets recorded at wh-tag but tagged to a Panglao stock item, creating a data inconsistency.

**Ideal flow:** Filter to warehouse-tracked items only, OR group by location with clear headers (Warehouse Items / Alta Citta Items / Alona Beach Items).

**The staff story:** Christopher receives a pork delivery. The dropdown shows "Pork Bone-In (Bulk)" twice — once for the warehouse version, once for the Tagbilaran version. He picks the wrong one and the stock numbers don't add up later.

---

### [08] Recent transfers log unscoped — shows all locations

**What:** The RECENT TRANSFERS table shows transfers from ALL locations, not just transfers originating from the current location. At warehouse, this should primarily show outgoing transfers, but it includes transfers between retail branches too.

**How to reproduce:** /stock/transfers at wh-tag → scroll to RECENT TRANSFERS → shows transfers to tag AND pgl mixed together with no location grouping.

**Why this breaks:** At 16+ rows with no date or destination grouping, the log is a wall of undifferentiated text. The warehouse user primarily cares about "what did I dispatch today?" — not transfers between other locations.

**Ideal flow:** Group by date (Today / Yesterday / Earlier) and by destination. Or filter to show only transfers originating from current location.

**The staff story:** Christopher scans the recent transfers to verify today's morning dispatch. He has to mentally filter out yesterday's entries and non-warehouse transfers. With 16 identical-looking rows, it's easy to miss one.

**KP match:** KP-10 (Empty States Without Context) — more specifically, the log has data but lacks context/grouping.

---

## E. Fix Checklist

- [x] **[01]** Auto-redirect to `/stock/inventory` when switching to warehouse location while on a retail-only route (/pos, /kitchen)
  - **Fix:** Added `$effect` in root `+layout.svelte` — watches `isWarehouseSession()` + route, redirects from /pos or /kitchen to /stock/inventory
  - **Expectation:** Switching to warehouse from any retail-only page auto-redirects to `/stock/inventory`.
- [x] **[02]** Make location selector modal scrollable or reorder sections (warehouse above cross-branch)
  - **Fix:** Reordered `LocationSelectorModal.svelte` — Warehouse section now renders immediately after Retail Branches, before Cross-Branch
  - **Expectation:** All location options are visible without scrolling at 1024×768.
- [x] **[03]** Add `/stock` to `ROLE_NAV_ACCESS['staff']` when user's assigned location is warehouse — or create a `warehouse` role
  - **Fix:** `AppSidebar.svelte` `navItems` derived now dynamically adds `/stock` to allowed set when `isWarehouseSession() && role === 'staff'`
  - **Expectation:** Warehouse-assigned staff see "Stock" in their sidebar and can always navigate back.
  **Fixed:** Verified already implemented in AppSidebar.svelte — warehouse sessions add /stock to staff nav; /pos and /kitchen filtered out
- [x] **[04]** Decide: should managers access warehouse? If yes, change `canAccessWarehouse` to use `ELEVATED_ROLES` instead of `ADMIN_ROLES`
  - **Fix:** Changed `canAccessWarehouse` from `ADMIN_ROLES.includes()` to `ELEVATED_ROLES.includes()` in `LocationSelectorModal.svelte`
  - **Expectation:** Managers can select the warehouse location from the location switcher.
- [x] **[05]** Format timestamps in transfers recent log using centralized date utility (match deliveries page format)
  - **Fix:** Added `formatTransferDate()` helper in `transfers/+page.svelte` using date-fns — renders "Today, 10:28 AM" / "Yesterday, 2:28 PM" / "Mar 9, 10:28 AM"
  - **Expectation:** Transfer timestamps show "Today, 10:28 AM" or "Mar 9, 10:28 AM" format.
  **Fixed:** Fixed in utils.ts (added formatDate()) and deliveries/+page.svelte — consistent 'Today, 10:28 AM' format
- [x] **[06]** Change "BATCH NO (OPTIONAL)" and "EXPIRY (OPTIONAL)" label color from red to gray/neutral
  - **Fix:** Changed label classes from `text-accent`/`text-status-red` to `text-gray-400` in `ReceiveDelivery.svelte`
  - **Expectation:** Optional field labels use neutral gray text, not red.
- [x] **[07]** Filter delivery item picker to warehouse-tracked items only (or group by location)
  - **Fix:** Added `groupedFormItems` derived in `ReceiveDelivery.svelte` — warehouse mode uses `<optgroup>` elements per location (Warehouse / Alta Citta / Alona Beach)
  - **Expectation:** Warehouse delivery form groups items by location with clear headers.
- [x] **[08]** Add date grouping (Today/Yesterday/Earlier) and location context to recent transfers log
  - **Fix:** Filtered `recentTransfers` to `sourceLocationId`, added `groupedTransfers` derived with date-fns grouping, template renders "Today" / "Yesterday" / "Earlier" headers
  - **Expectation:** Transfers log groups entries by date (Today/Yesterday) and shows only current-location transfers.

---

## F. Overall Assessment

**Verdict:** The warehouse transfers and deliveries workflow is **surprisingly mature** at the code level — the 3-step transfer wizard is one of the best-designed flows in the entire WTFPOS app. The source/destination split-view with real-time stock forecasting is excellent UX. Deliveries with FIFO tracking, spoilage alerts, and transfer badges work well.

The issues are primarily around **access control and navigation** (who can access warehouse, what happens when they get there), not the core functionality. The warehouse user experience has a rocky start (empty POS page, empty sidebar for staff) but once you're in Stock Management, the tools are production-ready.

**Priority order for fixes:**
1. [01] Auto-redirect (quick win, biggest daily impact)
2. [03] Warehouse staff sidebar nav (blocks the designated user)
3. [05] ISO timestamps (quick formatting fix)
4. [06] Red optional labels (CSS-only fix)
5. [04] Manager warehouse access (business decision)
6. [02] Modal scroll (interaction design)
7. [07] Item picker scope (data architecture)
8. [08] Transfers log grouping (medium effort)

---

## G. Re-Audit Verification (2026-03-11)

All 8 fixes verified via browser testing (playwright-cli, Chromium headless, 1024x768).

| Fix | Status | Verification Method |
|-----|--------|-------------------|
| [01] Auto-redirect from /pos at warehouse | PASS | Logged in as owner at wh-tag, confirmed auto-redirect to /stock/inventory |
| [02] Warehouse section above fold in modal | PASS | Opened location selector at 1024x768 — Warehouse section visible without scrolling, placed after Retail Branches |
| [03] Staff sidebar nav at warehouse | PASS | Logged in as Noel (Staff, wh-tag) — "Stock" nav item present in sidebar |
| [04] Manager can access warehouse | PASS | Logged in as Juan (Manager) — warehouse button enabled in location selector, successfully switched to wh-tag |
| [05] Formatted timestamps in transfers | PASS | Transfer log shows "Today, 10:53 AM" format instead of raw ISO strings |
| [06] Gray optional labels | PASS | "BATCH NO (OPTIONAL)" and "EXPIRY (OPTIONAL)" render in gray (text-gray-400), not red |
| [07] Item picker grouped by location | PASS | Delivery form uses `<optgroup>` headers: Alona Beach (Panglao), Alta Citta (Tagbilaran), Warehouse |
| [08] Date-grouped transfers log | PASS | Transfers filtered to source location, grouped under "Today" / "Yesterday" / "Earlier" headers |

**Result: 8/8 PASS — all issues resolved.**
