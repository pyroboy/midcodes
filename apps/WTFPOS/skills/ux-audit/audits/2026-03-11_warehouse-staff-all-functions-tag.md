# UX Audit — Warehouse Staff: All Functions

**Date:** 2026-03-11
**Scope:** All stock/inventory/delivery/count/waste/transfer functions for warehouse staff
**Role:** Staff (Noel Garcia) — wh-tag (Tagbilaran Central Warehouse)
**Viewport:** 1024×768 (tablet)
**Auditor:** Claude Sonnet 4.6 via playwright-cli interactive session
**Previous audit reference:** 2026-03-11_warehouse-transfers-deliveries-owner-tag.md

---

## A. Text Layout Map

### Login → Initial Landing (stock/inventory)

```
┌─────────────────────────────────────────────────────────────────┐
│  Login Page                                                      │
│  ┌─────────────────────────────────┐                             │
│  │ 🏭 Tagbilaran Warehouse          │                             │
│  │   N  Noel Garcia [Staff][Warehouse] ›  ←── click to log in   │
│  └─────────────────────────────────┘                             │
│                                                                   │
│  ↓ Redirects to /stock/inventory (NOT /pos — correct)           │
└─────────────────────────────────────────────────────────────────┘

Sidebar (collapsed default state):           Content area:
┌────────┐  ┌──────────────────────────────────────────────────────┐
│  W!    │  │  📍 TAGBILARAN CENTRAL WAREHOUSE                     │
│        │  │─────────────────────────────────────────────────────│
│  📦    │  │  Stock Management                                    │
│ Stock  │  │  [Inventory ✓] [Deliveries 🔴1] [Transfers]         │
│        │  │  [Counts 🔴1] [Waste Log]                           │
│        │  │─────────────────────────────────────────────────────│
│        │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│        │  │  │ TOTAL    │ │  OK      │ │ LOW STOCK│ │CRITICAL│ │
│        │  │  │  91      │ │  91      │ │    0     │ │   0    │ │
│        │  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  N     │  │                                                      │
│ →Out   │  │  [Search items or category...]  [Expand All]        │
└────────┘  │  [Collapse All] [List ▪] [Grid □]                   │
            │  ─────────────────────────────────────────────────  │
            │  ITEM ↑  │ CATEGORY │ STOCK LEVEL │ CURRENT/MIN     │
            │  Beef (5 items)  → group row with donut chart       │
            │   ├ Beef Bone-In (Bulk)  Meats ████ 41,000g [86][✏] │
            │   ├ Beef Bone-Out (Bulk) Meats ████ 43,500g [86][✏] │
            │   ├ Beef Bones (Bulk)    Meats ████ 50,000g [86][✏] │
            │   └ Beef Trimmings...    ...                        │
            └──────────────────────────────────────────────────────┘

Sidebar (expanded via toggle):
┌───────────────────────┐
│  W!   WTF! SAMGYUP   │
│       POS System     │
│  Tagbilaran Central   │
│  Warehouse           │
│  04:15:19 PM         │
│──────────────────────│
│  📦 Stock  ← only    │
│     nav item         │
│──────────────────────│
│  N  Noel Garcia      │
│     [STAFF]          │
│  → Logout            │
└───────────────────────┘
← NO quick actions, NO location switcher, NO other nav items
```

### Deliveries Page (Log Delivery modal open)

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠ Expiring Soon (1): Kimchi B-243 [2d left]                    │
│                                                                   │
│  Delivery History & Batches                 [+ Receive Delivery] │
│  [Search...] [All Dates ▼] [All Items ▼] [☐ Show Depleted]     │
│  TIME   │ ITEM / SUPPLIER     │ QTY    │ BATCH & EXPIRY │ FIFO  │
│  11:04  │ Pork Bone-In        │ +7000g │ TRF-B1MK       │ 4200  │
│  ...                                                             │
│ ─ ─ ─ ─ FOLD LINE (768px) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
└──────────────────────────────────────────────────────────────────┘

Log Delivery Modal (overlaid — taller than 768px viewport):
┌─────────────────────────────────────────────────────────────────┐
│  Log Delivery                                               [✕]  │
│  Record incoming stock from suppliers                           │
│  ─────────────────────────────────────────────────────────────  │
│  ITEM *                                                         │
│  [Search items...]                                              │
│  [Select an item...                                          ▼] │
│                                                                  │
│  QUANTITY *           │  UNIT                                   │
│  [  0               ] │  [  —  ]                                │
│                                                                  │
│  UNIT COST ₱ (optional)  │  TOTAL COST                         │
│  [  0.00             ]   │  [  —  ]                             │
│                                                                  │
│  SUPPLIER *                                                      │
│  [e.g. Metro Meat Co.                     ]                     │
│  [Transfer from wh-tag] [Metro Meat Co.]                        │
│  [SM Trading] [Korean Foods PH]                                 │
│                                                                  │
│  BATCH NO (OPTIONAL)     │  EXPIRY (OPTIONAL)                   │
│  [e.g. B-2024-05      ]  │  [mm/dd/yyyy         ]               │
│                                                                  │
│  DELIVERY PHOTOS (OPTIONAL)                                     │
│ ─ ─ ─ ─ FOLD LINE (768px) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  [+ Add Photo]           ← BELOW FOLD                          │
│                                                                  │
│  NOTES (OPTIONAL)        ← BELOW FOLD                          │
│  [e.g. Checked for freshness]                                   │
│                                                                  │
│  [+ Log Delivery (disabled)] [Cancel] ← BELOW FOLD             │
└─────────────────────────────────────────────────────────────────┘
```

### Stock Counts Page

```
┌──────────────────────────────────────────────────────────────────┐
│ ▣ Evening count — submit by 10:15 PM        [Submit Count]      │
│   0 / 91 items entered          ← sticky top bar, above fold    │
│──────────────────────────────────────────────────────────────────│
│  [⏰ Morning 10:00 AM ✓] [⏰ Afternoon 4:00 PM ✓]               │
│  [⏰ Evening 10:00 PM PENDING] ← active period selected         │
│──────────────────────────────────────────────────────────────────│
│  ⚠ Count not yet started. Enter actual counts below,            │
│    then tap Submit Count to lock in this session.               │
│──────────────────────────────────────────────────────────────────│
│  ITEM            │ EXPECTED   │    COUNTED    │ SHORTAGE/SURPLUS │
│  MEATS   12 ▲   │            │               │                  │
│  Pork Bone-In    │  35,000g   │ [−][    ][+]  │      —           │
│  Pork Bone-Out   │  38,500g   │ [−][    ][+]  │      —           │
│  Sliced Pork     │  40,500g   │ [−][    ][+]  │      —           │
│  Pork Bones      │  50,000g   │ [−][    ][+]  │      —           │
│ ─ ─ ─ ─ ─ FOLD LINE (768px) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  ...more items...                                                │
└──────────────────────────────────────────────────────────────────┘
```

### Transfers Wizard (Step 1 — Item Selection)

```
┌──────────────────────────────────────────────────────────────────┐
│  Inter-Branch Stock Transfers                                     │
│  Move inventory from Central Warehouse to another branch        │
│                                                                   │
│  ① Select Item ────────── ② Destination ────── ③ Confirm       │
│  ─────────────────────────────────────────────────────────────── │
│  📍 Source: Central Warehouse                                    │
│                                                                   │
│  ITEM                                                            │
│  [Pork Bone-In (Bulk) (Meats)                               ▼]  │
│  Available: 35,000 g                                            │
│                                                                   │
│  TRANSFER QUANTITY           │  UNIT                            │
│  [  5000                   ] │  [  g  ]                          │
│                                                                   │
│  SOURCE INVENTORY                                                │
│  ITEM                    │ STOCK      │ STATUS                   │
│  Pork Bone-In (Bulk)     │ 35,000 g   │ [OK]                    │
│  Pork Bone-Out (Bulk)    │ 38,500 g   │ [OK]                    │
│  Sliced Pork (Bulk)      │ 40,500 g   │ [OK]                    │
│ ─ ─ ─ ─ FOLD LINE (768px) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  ...more source inventory...     [← Back] [Next →] (disabled)   │
└──────────────────────────────────────────────────────────────────┘
```

### Waste Log + Modal (fits within viewport)

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────────┐ ┌──────────────────────┐  │
│  │ TOTAL WASTE │ │  TOP WASTED     │ │ MOST COMMON REASON   │  │
│  │    0        │ │     —           │ │        —             │  │
│  └─────────────┘ └─────────────────┘ └──────────────────────┘  │
│                                                                   │
│  Today's Waste Log                          [+ Log Waste]       │
│  Preparation waste only — not unconsumed                        │
│  customer leftovers                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🗑  No waste logged today                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

Log Waste Modal (fits within 768px viewport — GOOD):
┌────────────────────────────────────────────────────┐
│  Log Waste                                    [✕]  │
│  ──────────────────────────────────────────────    │
│  ITEM *                                            │
│  [Select item...                               ▼]  │
│                                                    │
│  QUANTITY *         │  UNIT                        │
│  [  0             ] │  [  —  ]                     │
│                                                    │
│  REASON *                                          │
│  [🔥 Dropped / Spilled] [🔴 Expired]               │
│  [🚫 Unusable (damaged)] [🔥 Overcooked]           │
│  [✂ Trimming (bone/fat)] [❓ Other]                │
│                                                    │
│  [Cancel]  [Log Waste (disabled)]                 │
└────────────────────────────────────────────────────┘
```

---

## B. 14-Principle Assessment

| Principle | Verdict | Evidence |
|---|---|---|
| **Hick's Law** (minimize decision load) | PASS | Single nav item (Stock). Sub-nav has 5 tabs. Transfers uses a 3-step wizard to chunk a complex task. No decision overload at any point. |
| **Miller's Law** (7±2 chunks in working memory) | CONCERN | Stock Counts shows 91 items in a continuous scrolling list grouped only by category. With 12 items per category (Meats), a morning rush count requires tracking 12 separate entries without any progress indicator per category — only a global 0/91 counter. |
| **Fitts's Law** (large, close targets for frequent actions) | CONCERN | The "86" button and "Edit Info" pencil icon on each inventory row use `px-2 py-0.5` and `text-[10px]` — these are approximately 28×24px, well below the 44px minimum. The supplier preset chips in the delivery modal use `px-2.5 py-1 text-xs` — approximately 32px tall. The stock count stepper "−" and "+" buttons must be measured against the 44px rule (source shows `QuickNumberInput` — needs verification). |
| **Jakob's Law** (match user expectations) | PASS | The 3-step wizard pattern for transfers is a familiar mental model. The delivery modal follows standard form conventions. Inventory table column order (Item → Category → Stock Level → Current/Min → Status) is logical. |
| **Doherty Threshold** (<400ms feedback) | CONCERN | Clicking the 86 button produces only a visual highlight on the button itself (orange border) with no toast, no banner, no feedback text. The action completes silently. The Log Waste modal's "Log Waste" button resets the form on save (standalone mode shows an inline "Delivery recorded!" banner — but only when `onSaved` is undefined, which depends on how the parent mounts the component). |
| **Visibility of System Status** | FAIL | Three violations: (1) The 86 button toggles silently — staff cannot tell if the action was saved or just visually toggled. (2) Unauthorized route access to `/reports/*` succeeds without any warning — warehouse staff can access full sales reports by typing a URL directly, and the page renders with all zeros but no "access not permitted" message. (3) Transfer wizard's "Next" button stays disabled when an item is selected but a quantity hasn't been entered — no inline hint explains what is missing. |
| **Gestalt: Proximity** | CONCERN | On the Inventory page, the "86" button and "Edit Info" pencil icon are placed in the same cell with no visual grouping or divider. A first-time warehouse worker cannot quickly distinguish a destructive action (86 = affects live menu availability) from an administrative edit (pencil = item metadata). |
| **Gestalt: Common Region** | PASS | Category grouping on inventory (Beef, Pork, Chicken…) with expandable rows provides clear visual regions. The stock counts page groups items by category with a collapsible category header. The transfers wizard's 3-step progress bar clearly delineates phases. |
| **Visual Hierarchy (contrast/scale)** | CONCERN | The `STAFF` role badge in the sidebar footer uses `border-gray-200 bg-gray-50 text-gray-500` — very low contrast against the white sidebar background. The badge fails WCAG AA at approximately 3.1:1. Staff identity is a critical piece of context for accountability (who logged the delivery?). |
| **Visual Hierarchy (layout/prominence)** | CONCERN | The "Overcooked" waste reason chip is displayed prominently in the Log Waste modal. In a warehouse context, this reason is semantically wrong — a warehouse does not cook food. The chip occupies the same visual weight as legitimate warehouse reasons (Expired, Damaged, Trimming), creating a false affordance. |
| **WCAG: Color Contrast** | CONCERN | The `STAFF` badge (KP-02 pattern): `text-gray-500` on `bg-gray-50` = approximately 3.1:1 — fails AA. The "OK" status badges in the transfers source inventory table use `text-green-600` on `bg-green-50` — approximately 3.5:1 — fails AA. White text on the Overcooked reason chip's amber background — estimated 2.8:1 — critical fail. |
| **WCAG: Touch Targets** | FAIL | The 86 button has `px-2 py-0.5 text-[10px]` inline — approximately 28×20px, failing the 44px minimum (KP-01 pattern). The Edit Info pencil icon button has no explicit min-height override. The supplier preset chips in the delivery form use `py-1 text-xs` — approximately 28px tall. These are used during active warehouse intake operations where gloves or hurried hands are common. |
| **Consistency: Internal** | CONCERN | The delivery history shows timestamps as "Today, 11:04 AM" format. Inventory item "last updated" shows "less than a minute ago" (relative). The stock counts deadline shows "submit by 10:15 PM" (absolute). Three different time/date formats visible within the same Stock module session — this is KP-09. |
| **Consistency: External** | PASS | The 3-step wizard follows conventions from common form wizards. The stock level color coding (green/yellow/red) matches traffic light conventions. The FIFO usage circles in delivery history match material/batch tracking conventions. The Location Banner position (top of every page) is consistent throughout. |

---

## C. Best Day Ever

It is 10:50 AM on a delivery day at the Tagbilaran Central Warehouse. Noel Garcia taps the Noel Garcia button on the login screen and lands directly on the inventory page — no wrong turns, no redirects to a dead POS screen like last time. The "Tagbilaran Central Warehouse" banner at the top is instantly reassuring. He sees 91 items, all Well-Stocked, and the Deliveries tab has a red badge: one incoming.

He taps Deliveries and sees the Expiring Soon alert — Kimchi batch B-243, only 2 days left. Good to know. He taps "+ Receive Delivery" and the Log Delivery form slides open. He searches for "Pork Bone-In" in the search field and finds it quickly in the Warehouse group. He types 8000 in the Quantity field, then taps the "Metro Meat Co." chip and the supplier fills in. He adds batch number "B-2024-11" and the expiry date from the delivery slip.

Then he reaches for the "Log Delivery" button — and it isn't there. He scrolls the modal down, scrolls past a Photo section and a Notes field, and finally finds the button at the bottom. He taps it. The form resets. Was it saved? He checks the delivery history table — yes, the new entry appears at the top. He exhales. It worked, but he wasn't sure for a moment.

By 11:30 AM, he moves to Transfers. He selects Pork Bone-In, enters 7000g, taps Next, selects "Tagbilaran Branch" as the destination, and confirms. The transfer completes. He taps the "Evening" period tab in Counts to see which items still need counting tonight. All 91 show as not yet entered, but the "Submit Count" button is visible right at the top — he won't miss it when it's time.

At 3:00 PM, during butchering prep, someone drops a tray of trimmed beef fat. Noel taps Waste Log → Log Waste. The form opens and fits the screen. He picks "Trimming (bone/fat)", enters the quantity, and taps Log Waste. The form clears. He checks the Today's Waste Log — the entry appears. No second-guessing.

A quiet day, mostly. But one thing nags at Noel: he accidentally tapped "86" on Beef Bone-In while trying to tap the Edit pencil. Nothing happened on his screen — no confirmation, no error. He doesn't know if he just marked the branch's beef as sold out. He can't tell. He hopes it just bounced off.

---

## Fix Status

| Issue | Status | Files Changed |
|---|---|---|
| [01] Log Delivery submit below fold | ✅ Fixed | `ReceiveDelivery.svelte`, `stock/deliveries/+page.svelte` |
| [02] 86 button exposed to warehouse staff | ✅ Fixed | `InventoryTable.svelte` |
| [03] `/reports/*` routes unguarded | ✅ Fixed | `reports/+layout.svelte` |
| [04] Transfer "Next" no inline hint | ✅ Fixed | `stock/transfers/+page.svelte` |
| [05] "Overcooked" shown in warehouse | ✅ Fixed | `WasteLog.svelte` |
| [06] Edit modal missing minLevel field | ✅ Fixed | `InventoryEditModal.svelte` |

**Fix date:** 2026-03-11 | **pnpm check:** 1 pre-existing error (vite.config.ts monorepo mismatch — ignorable per CLAUDE.md), 0 new errors

### Fix Summaries

**[01]** `ReceiveDelivery.svelte` restructured into header/body/footer zones. Body (`overflow-y-auto flex-1`) scrolls freely; sticky footer (`sticky bottom-0`) keeps "Log Delivery" button always visible. `max-height: 85vh` on root div. Cancel button moved inside footer via new `onCancel` prop.

**[02]** `InventoryTable.svelte`: added `can86` derived (`canEditDetails && !(isWarehouseSession() && session.role === 'staff')`) — hides 86 button for warehouse staff. Added `handle86Toggle()` with 3-second toast: "ItemName marked sold out (86'd)" or "ItemName restored to menu".

**[03]** `reports/+layout.svelte`: added `$effect()` guard (matching kitchen layout pattern) — redirects `staff` and `kitchen` roles to `/stock/inventory` immediately on mount.

**[04]** `transfers/+page.svelte`: amber inline hint "Enter a quantity to continue" shown when item selected but `parsedQty === 0`. Back/Next nav bar made `sticky bottom-0 bg-white border-t` on all 3 wizard steps.

**[05]** `WasteLog.svelte`: `allReasonConfig` holds full list; `$derived` `reasonConfig` filters out `'Overcooked'` when `isWarehouseSession()` is true.

**[06]** `InventoryEditModal.svelte`: added `editMinLevel` state bound to `item.minLevel`. New numeric input field "Minimum Stock" added after Description. Save handler includes `minLevel: Math.max(0, Number(editMinLevel) || 0)`. Schema field confirmed as `minLevel` (not `minStock`) — no schema bump needed.

---

## D. Issues

[01] Log Delivery submit button is consistently below fold — requires scroll to complete

**What:** The "Log Delivery" modal on `/stock/deliveries` renders a form taller than the 768px viewport. The critical submit button ("+ Log Delivery") is positioned after: Item, Quantity, Unit Cost, Supplier, Supplier chips, Batch No, Expiry, Delivery Photos, and Notes fields. On 1024×768, the submit button is approximately 200–250px below the visible fold.

**How to reproduce:** Log in as Noel Garcia (warehouse staff). Navigate to `/stock/deliveries`. Click "+ Receive Delivery". Observe that the form truncates at "DELIVERY PHOTOS (OPTIONAL)" with no submit button visible. The button requires scrolling within the modal.

**Why this breaks:** Warehouse deliveries happen under time pressure — truck is at the gate, items need logging before the driver leaves. Discovering the submit button only after scrolling is friction at the wrong moment. First-time users may fill all fields and then be unable to complete the form without realizing they need to scroll. This is an instance of KP-11 (Scroll-Hidden Primary Actions) — listed as recurring in 7/16 audits.

**Ideal flow:** The modal should use a sticky footer pattern: all optional fields (Photos, Notes) collapse or move to a secondary "Advanced" section, and "Log Delivery" sticks to the bottom of the modal regardless of scroll position. Alternatively, the modal can be made taller with `overflow-y: auto` on just the fields area, keeping the action buttons fixed.

**The staff story:** Noel fills the item, quantity, and supplier — the three required fields. He looks for Log Delivery. It's not there. He keeps scrolling past an unused Photos section and a Notes field he doesn't need. He finally finds the button. He's done it three times now. Each time he has to scroll. He's started filling out Notes just to remind himself it exists.

---

[02] 86 button exposed to warehouse staff — silent action with no operational meaning

**What:** Each inventory item row shows an "86" button that toggles the menu item's availability status (marks it as sold out to the kitchen). Warehouse staff (role = `staff`) have full access to this button because `canEditDetails = session.role !== 'kitchen'`. Pressing the button produces no toast, no confirmation, no feedback — only the button's own visual state changes (orange border). The action silently modifies a menu-wide setting that affects all branches.

**How to reproduce:** Log in as Noel Garcia. Navigate to `/stock/inventory`. Click the "86" button on "Beef Bone-In (Bulk)". The button gains an orange border. No toast appears. No confirmation is requested. The menu item is now marked sold out globally. Click again to restore.

**Why this breaks:** (1) The 86 action is a kitchen/service operation — it signals to the floor and kitchen that an item is unavailable. Warehouse staff have no operational reason to trigger this; the warehouse does not serve customers or the kitchen. (2) The action is silent — staff who accidentally click 86 (while reaching for the adjacent Edit pencil) cannot tell whether anything changed. No undo. No indication the action was saved. This is an instance of KP-05 (No Success Confirmation) compounded by a role-inappropriate affordance. (3) Because the 86 and Edit buttons are in the same table cell with no separator, accidental clicks are likely on touch screens.

**Ideal flow:** Remove the 86 toggle from the warehouse inventory view entirely (warehouse staff have no need to manage menu availability). If retained for any reason, gate it behind a role check that excludes `staff` at `wh-tag`. At minimum, add a toast on toggle: "Beef Bone-In marked sold out" and "Beef Bone-In restored" to give Noel confirmation of what happened.

**The staff story:** Noel's tablet screen has a scratch near the right edge of every row. He taps Edit (pencil icon) to update an item's description. He taps slightly to the left and hits "86" instead. The button highlights. He doesn't know if he just told the kitchen that Beef Bone-In is gone. He taps it again hoping to undo it. Now it's un-highlighted. He still doesn't know if there was anything to undo.

---

[03] Unauthorized route access — warehouse staff can open `/reports/*` directly

**What:** The `/reports` section has no client-side route guard protecting it from unauthorized roles. Navigating to `http://localhost:5173/reports/sales-summary` while logged in as Noel Garcia (role = `staff`) loads the full reports page, rendered in "Tagbilaran Central Warehouse" context. The page shows all-zero data (₱0.00 across all metrics) because no sales occur at the warehouse — but the page itself is fully accessible, including BIR-compliance reports (X-Read, End of Day) and expense reports.

**How to reproduce:** Log in as Noel Garcia. Manually navigate to `http://localhost:5173/reports/sales-summary` in the browser address bar (or follow a shared link). The Branch Reports page loads with the full sub-navigation: Meat Report, Stock Variance, Voids & Discounts, X-Read, End of Day, etc.

**Why this breaks:** (1) Role access control is implemented as navigation filtering (AppSidebar hides the Reports tab for `staff`) but not as route-level enforcement. Any employee who knows the URL can bypass the nav. (2) The End of Day and X-Read pages — critical BIR-compliance reports — are accessible without authorization. A warehouse staff member can view, trigger, or interfere with X-Reading workflows. (3) The page shows all-zero data with no explanation — Noel sees "No sales data for this period" which could be interpreted as a legitimate read rather than an access-denied state. This relates to KP-08 (context creating dead or ambiguous UI) but is more serious: it is a missing access gate, not just a visual issue.

**Ideal flow:** Add a role-based redirect in the `/reports/+layout.svelte`: if `session.role === 'staff'` or `session.role === 'kitchen'`, `goto('/stock/inventory')` immediately. The redirect should be equivalent to the pattern used by `/pos` and `/kitchen` routes that check `isWarehouseSession()`. A banner ("You don't have access to this section") would be acceptable during a transition, but silent redirect is appropriate for staff roles.

**The staff story:** A co-worker told Noel there was a cool graph of sales by hour. He typed the URL into his tablet. It loaded. He saw "₱0.00" everywhere and shrugged — must be a warehouse thing. He didn't know he was looking at a page that was supposed to be locked.

---

[04] Transfer wizard "Next" button gives no hint why it is disabled

**What:** On the Transfers page (Step 1), the "Next" button remains disabled until both a valid item AND a positive quantity are provided. However, when a user selects an item but hasn't entered a quantity yet — the "Next" button is disabled with no inline explanation. The button renders as `[Next →] (disabled)` below the fold with no tooltip, no form validation message, and no field highlighting to indicate what is missing.

**How to reproduce:** Log in as Noel Garcia. Navigate to `/stock/transfers`. Select "Pork Bone-In (Bulk) (Meats)" from the item dropdown. The "Available: 35,000 g" confirmation appears. Do not fill in Transfer Quantity. Observe that "Next" remains disabled. Scroll down to find the Next button — no explanation is provided for why it is still disabled.

**Why this breaks:** Transfer is a multi-step wizard. Users expect that completing Step 1's visible fields enables "Next". When "Next" stays disabled with no feedback after selecting an item, users have to guess whether (a) they missed a required field, (b) the item is invalid, (c) the system is still loading, or (d) the wizard is broken. This is a Visibility of System Status failure. Additionally, the "Next" button is below the fold at 1024×768 alongside the Source Inventory table — a user who filled the item and quantity but didn't scroll down may not even know a Next button exists.

**Ideal flow:** Add an inline validation hint adjacent to the Quantity field: "Enter a quantity to continue" shown in amber text when an item is selected but quantity is still 0. This eliminates ambiguity without adding modals or interruptions. Additionally, pin the "Back / Next" navigation bar to the bottom of the step container (`sticky bottom-0`) so it is always visible regardless of content height.

**The staff story:** Noel selects Pork Bone-In. Types 7000. Clicks somewhere else. Scrolls down to find Next. It's grey. He taps it. Nothing. He re-reads the form. Item is selected. Quantity is filled. He doesn't see what's wrong. He tries changing the quantity. Still grey. He refreshes the page and starts over, this time entering the quantity directly after selecting the item. It works. The difference: he had typed "7000" but the input had lost focus before registering — the `parsedQty` wasn't updating because the `fill` event hadn't fired.

---

[05] "Overcooked" waste reason exposed in warehouse context

**What:** The Log Waste modal displays six preset reason chips: Dropped/Spilled, Expired, Unusable (damaged), Overcooked, Trimming (bone/fat), and Other. "Overcooked" is a kitchen-specific reason (food that was prepared and burned). The warehouse does not cook food — it handles bulk raw meat and dry goods. This chip occupies a prominent position in the 2×3 grid (top-right cell).

**How to reproduce:** Log in as Noel Garcia. Navigate to `/stock/waste`. Click "+ Log Waste". Observe that "Overcooked" appears as a selectable reason alongside warehouse-appropriate options like "Expired" and "Trimming (bone/fat)".

**Why this breaks:** This is a Gestalt Consistency violation: all six reason chips appear equally valid to a warehouse worker. "Overcooked" creates false affordance — a warehouse staff member who doesn't know what the chip is for may select it by mistake, logging an inaccurate waste reason. Waste records feed into cost analysis and variance reports; incorrect reason codes pollute historical data. This is a low-footprint but persistent data quality issue.

**Ideal flow:** Scope the waste reason list by location type. For `isWarehouseSession()`: show only Expired, Unusable (damaged), Trimming (bone/fat), Dropped/Spilled, and Other. Remove "Overcooked" from the warehouse context. For retail sessions: show all six. This is a one-line conditional in the component.

**The staff story:** Noel has logged waste three times. Each time he sees "Overcooked" in the grid. He's never selected it — it doesn't make sense in a warehouse. But he's wondered if he's using the wrong form or the wrong page. He checked with his supervisor once. "Just pick the nearest one," she said.

---

[06] Minimum stock, category, and unit fields absent from warehouse staff's Edit Item modal

**What:** Clicking the "Edit Info" pencil on an inventory item opens an "Edit Item Info" modal with only three fields: Item Name, Description, and Item Picture. The critical fields for warehouse operations — Minimum Stock threshold, Category, and Unit — are not editable from this modal in the warehouse context. These fields determine reorder alerts (the Critical/Low Stock status cards), category grouping, and transfer quantity units.

**How to reproduce:** Log in as Noel Garcia. Navigate to `/stock/inventory`. Click the "Edit Info" pencil on any item. The modal shows only Name, Description (optional), Item Picture, and a file picker. No minimum stock field, no category selector, no unit selector.

**Why this breaks:** A warehouse worker responsible for inventory management cannot adjust the minimum stock threshold that triggers the "Critical" or "Low Stock" status cards. If Noel needs to raise the minimum from 10,000g to 15,000g for Pork Bones (Bulk) because of increased order volumes, he cannot do this. He must escalate to a manager or owner who has to log in and navigate to admin settings. The minimum stock field is the primary operational signal for reorder decisions at the warehouse level. This is a visibility/access gap that adds unnecessary cross-role friction to a core warehouse workflow.

**Ideal flow:** For warehouse sessions, extend the Edit Item Info modal to include the Minimum Stock field (with numeric input and unit label). Category and Unit can remain admin-only if desired, but minimum stock is an operational setting that warehouse staff should be able to manage within their location's scope.

**The staff story:** Noel noticed Chicken Wing stock kept showing "OK" even though they were running thin. The minimum was set to 5,000g from when the warehouse was new, before volumes increased. He found the Edit pencil and opened the modal — no min stock field. He messaged his manager. Three days later, after the manager was able to log in, the threshold was updated. Meanwhile two deliveries had already arrived without the low-stock alert triggering.

---

*Known pattern references:*
- [01] matches KP-11 (Scroll-Hidden Primary Actions)
- [02] matches KP-05 (No Success Confirmation After Critical Actions)
- [03] is a new pattern — route-level access control not matching nav-level access control (no existing KP)
- [04] matches KP-05 (No Success Confirmation) + KP-11 (Scroll-Hidden Primary Actions)
- [05] is a contextual scoping gap — closely related to KP-08 (location context dead UI) applied to form content
- [06] is a new pattern — role-scoped action surface doesn't extend to matching informational access (no existing KP)

*Touch target note:* The 86 button (`px-2 py-0.5 text-[10px]`), Edit Info pencil button, and supplier preset chips (`px-2.5 py-1 text-xs`) all fall below 44px minimum. This is an instance of KP-01 (Touch Target Violations) — systemic.

*WCAG contrast note:* The `STAFF` badge (`text-gray-500` on `bg-gray-50`) at approximately 3.1:1 and `OK` status badges in transfers table at approximately 3.5:1 both fail WCAG AA. This is an instance of KP-02 (Low-Contrast Status Badges) — systemic.
