# UX Audit — Butcher Receiving, Handoff & Conversion Flow
**Scope:** `/stock/deliveries`, `/stock/counts`, `/stock/waste`, `/stock/transfers`
**Auditor:** Claude (claude-sonnet-4-6)
**Date:** 2026-03-10
**Persona:** Benny Flores — Kitchen, ⚖️ Butcher, Alta Citta (Tagbilaran)
**Viewport:** 1024×768 (tablet landscape)
**Session:** Logged in as `benny` (role: kitchen, locationId: tag)
**Also inspected:** `/kitchen/weigh-station` (YieldCalculatorModal), `ReceiveDelivery.svelte`, `WasteLog.svelte`, `StockCounts.svelte`, `stock/transfers/+page.svelte`

---

## A. Text Layout Map — Vertical Zone Breakdown

### `/stock/deliveries` — Delivery History & Batches

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [W!] Sidebar Icon Rail (collapsed, ~56px wide)                              │
│  Kitchen / Stock / B / Logout                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⊙ ALTA CITTA (TAGBILARAN)                        [LocationBanner, ~40px]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Stock Management                                                            │
│ [ Inventory ] [ Deliveries ❶ ] [ Transfers ] [ Counts ❶ ] [ Waste Log ]   │
│                                         [SubNav tabs, ~52px]               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐        │
│ │ ⚠ Expiring Soon (1)                                             │        │
│ │  Kimchi B-243 · 2d left                                         │        │
│ └─────────────────────────────────────────────────────────────────┘        │
│                                        [Alert card, ~64px above fold]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Delivery History & Batches              [+ Receive Delivery] ← PRIMARY CTA │
│ Track incoming stock batches, FIFO...                                       │
│                                        [~56px row]                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search item, supplier, or batch...]  [📅 All Dates▼]  [📦 All Items▼] │
│ [☐ Show Depleted]                                                           │
│                                        [Filter bar, ~48px]                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ TABLE: Time | Item/Supplier | Qty | Batch & Expiry | FIFO Usage            │
│ ─────────────────────────────────────────────────────                      │
│  01:15 AM  Pork Bone-In / Metro Meat Co.  +5000g  B-241 Exp:2026-03-14   │
│            [Progress ring]  5000 left / 0 used                             │
│  12:15 AM  Soju (Original) / SM Trading   +6 bottles  B-242               │
│  11:15 PM  Kimchi / Korean Foods PH  +10 portions  B-243 Exp:2026-03-11  │
│  07:15 PM  [Transfer rows... 8 more rows visible]                          │
│                                         [Below fold ~600px total]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ═══════════════ FOLD LINE at 768px ═══════════════════════════════════      │
│ [More delivery rows — user must scroll]                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**CTA Position:** "Receive Delivery" is top-right of the content area, ~250px from top of page. Visible without scroll. Small orange button (~38px height observed, slightly below 44px minimum).

---

### `/stock/deliveries` — Receive Delivery Modal (500px wide, centered)

```
┌───────────────────────────────────┐
│ Log Delivery                   [✕]│  ← Modal header
│ Record incoming stock from        │
│ suppliers                         │
├───────────────────────────────────┤
│ ITEM *                            │
│ [Search items...          ]       │  ← Text search input
│ [Select an item…          ▼]      │  ← Dropdown (70+ items)
│ Current Stock: 12500 g            │  ← Stock hint (small, 10px)
├───────────────────────────────────┤
│ QUANTITY *         UNIT           │
│ [        0       ] [grams  ]      │  ← Side-by-side
│ (BT scale input if connected)     │
├───────────────────────────────────┤
│ UNIT COST ₱ (optional) TOTAL COST │
│ [      0.00      ] [     —     ]  │
├───────────────────────────────────┤
│ SUPPLIER *                        │
│ [Metro Meat Co.           ]       │
│ ⚠ Supplier is required (red)      │
│ [Metro Meat Co.] [SM Trading]     │  ← Recent supplier chips
├───────────────────────────────────┤
│ ─── BATCH NO (Optional) ────────  │
│ EXPIRY (Optional)                 │
│ [  B-2024-05   ] [ date input ]   │
├───────────────────────────────────┤
│ Delivery Photos (optional)        │
│ [📷 Add Photo]                    │
├───────────────────────────────────┤
│ NOTES (optional)                  │
│ [e.g. Checked for freshness ]     │
├───────────────────────────────────┤
│ [         + Log Delivery        ] │  ← PRIMARY (disabled if incomplete)
│ [            Cancel            ]  │
└───────────────────────────────────┘
```

---

### `/stock/waste` — Waste Log Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LocationBanner] [SubNav tabs]                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Total Waste Today] [Top Wasted Item] [Most Common Reason]                 │
│  0 units             —                  —                                  │
│                                        [3-col summary cards, ~80px]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Today's Waste Log                                   [+ Log Waste]          │
│ Preparation waste only — not unconsumed...                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Empty state — Trash icon + "No waste logged today"]                       │
│                                        [Visible above fold]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### `/stock/waste` — Log Waste Modal (440px wide)

```
┌───────────────────────────────────┐
│ Log Waste                      [✕]│
├───────────────────────────────────┤
│ ITEM *                            │
│ [Select item…              ▼]     │  ← Flat dropdown (no search)
├───────────────────────────────────┤
│ QUANTITY *          UNIT          │
│ [       0        ] [ grams ]      │
├───────────────────────────────────┤
│ REASON *                          │
│ [💧 Dropped/Spilled] [⏰ Expired ]│  ← 2×3 quick-tap button grid
│ [🚫 Unusable(dam)] [🔥 Overcooked]│
│ [✂ Trimming(bone/fat)] [❓ Other ]│
├───────────────────────────────────┤
│ [      Cancel      ] [Log Waste]  │
└───────────────────────────────────┘
```

**Note:** Manager PIN required for kitchen role to log waste. Modal opens THEN PIN is shown after "Log Waste" is tapped — two steps.

---

### `/stock/counts` — Stock Counts Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LocationBanner] [SubNav]                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐           │
│ │ Sticky: Enter counts for each item, then tap Save.    [Save] │  ← TOP    │
│ └──────────────────────────────────────────────────────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [AM10 Count PENDING] [PM4 Count PENDING] [PM10 Count PENDING]              │
│  10:00 AM               4:00 PM             10:00 PM                       │
│                                        [Period tabs, ~52px]                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠ Count not yet started. Enter actual counts below, then tap Submit Count. │
├─────────────────────────────────────────────────────────────────────────────┤
│ TABLE: Item | Expected | Counted | Shortage/Surplus                        │
│ ─────────────────────────────────────────────────                          │
│  Pork Bone-In      12500 g    [-][  0  ][+]    VarianceBar                │
│  Pork Bone-Out      9600 g    [-][  0  ][+]    —                           │
│  ... (70+ items, ALL shown — no category grouping)                         │
│                                        [BELOW FOLD: most items]            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ═══════════════ FOLD LINE at 768px ═══════════════════════════════════      │
│ [More rows below...]                                                        │
│ [Submit Count]  ← Duplicated at bottom                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### `/stock/transfers` — Inter-Branch Stock Transfers (3-step wizard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LocationBanner] [SubNav]                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Inter-Branch Stock Transfers                                                │
│ Move inventory from Tagbilaran Branch (Alta Citta) to another branch.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ① Select Item ─────── ② Destination ─────── ③ Confirm                    │
│  [ORANGE]                [GRAY]               [GRAY]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 1:                                                                     │
│ 📍 Source: Tagbilaran Branch (Alta Citta)                                  │
│ ITEM: [Select an item...         ▼]                                        │
│ TRANSFER QUANTITY: [  0.0   ] UNIT: [  g   ]                               │
│                                                                             │
│ SOURCE INVENTORY (mini-table, max-h 200px scrollable):                     │
│  Pork Bone-In   12500g  [OK]                                               │
│  Pork Bone-Out   9600g  [OK]                                               │
│  Beef Bone-In    8200g  [OK]                                               │
│  Sliced Beef     6500g  [OK]                                               │
│  ... (all 70+ items)                                                        │
│                                        [Next →]                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### `/kitchen/weigh-station` — Yield Calculator Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Yield Calculator                                              [✕]│
│ Dark theme (gray-900 bg)                                         │
├──────────────────────────────────┬──────────────────────────────┤
│ LEFT PANEL                       │ RIGHT PANEL (Numpad)         │
│ MEAT CUT (search + select-list)  │ [RAW WEIGHT / TRIMMED]       │
│ [Search meat cut...]             │  7  8  9                     │
│ [Pork Bone-In     ]  ← size:5    │  4  5  6                     │
│ [Pork Bone-Out    ]  list        │  1  2  3                     │
│ [Chicken Wing     ]              │  C  0  ⌫                    │
│ [Sliced Beef      ]              │  [  .  ]                     │
│                                  │                              │
│ [RAW WEIGHT  field] ← tap        │ Active field indicator       │
│ [TRIMMED WEIGHT   ] ← tap        │  (green highlight)           │
│                                  │                              │
│ YIELD PERCENTAGE                 │                              │
│    0.0%  (5xl font, color-coded) │                              │
│ [      Log Yield      ]          │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment Table

| Principle | Verdict | Finding |
|---|---|---|
| **Hick's Law** | FAIL | The Receive Delivery item picker presents **70+ items in a flat dropdown** with no category grouping. After using the text search input to filter, the user must still navigate the `<select>` element — two different interaction patterns for the same step. The Waste Log modal has a flat unfiltered dropdown of all 70+ items. The Counts page shows all items in a single unsegmented table (no protein category grouping). Every screen asks the butcher to choose from a list far exceeding the 7-item maximum. |
| **Miller's Law** | CONCERN | The Counts page displays all branch items (~70+) as a single list with no chunking by category (Meats, Pantry, Beverages, etc.). Benny must visually scan the full table to find meat items. The Weigh Station YieldCalculator groups items appropriately (filtered to Meats only) — good. Delivery history table can scroll to 10+ rows with no pagination. |
| **Fitts's Law** | CONCERN | "Receive Delivery" button is small (~38px height, below the 44px minimum, observed via source: `btn-primary` without explicit height override). QuickNumberInput +/- stepper buttons are 32px (h-8 = 32px), below the 44px minimum — a critical issue for greasy-handed operation. The Waste Log modal "Log Waste" primary action is full-width — good. YieldCalculator numpad buttons are min-height 56px — excellent. Transfers wizard "Next" button is positioned at bottom-right — correct for thumb reach. |
| **Jakob's Law** | PASS | Standard POS patterns are followed: left-rail sidebar, top location banner, modal-on-button pattern, table-based history view. Delivery history table with FIFO progress bars follows warehouse management conventions. 3-step wizard for transfers follows industry patterns (Shopify transfers, Toast inventory transfers). |
| **Doherty Threshold** | PASS | RxDB is local-first — writes are instant. No network latency. Form inputs respond immediately. Active state on buttons provides visual feedback. The `active:scale-95` class on primary buttons gives tactile feedback. No loading spinners observed during data entry. |
| **Visibility of Status** | CONCERN | The Counts page has a sticky "Save Counts" bar at top — good visibility. However: (1) there is no visible badge or indicator showing whether this session's AM/PM count has been submitted today, visible from the SubNav tab itself; only "Pending" AMBER badge on the period button; (2) the waste log PIN requirement is not disclosed before opening the modal — Benny doesn't know a PIN is needed until he's filled in the form and tapped "Log Waste"; (3) Bluetooth scale connection status is visible in the delivery form (conditional rendering) but is absent from the main Weigh Station layout view unless you know to look for the "Bluetooth Scale" button. |
| **Gestalt: Proximity** | CONCERN | In the Receive Delivery form, the text search input and the dropdown are presented as two adjacent inputs with no visual grouping (no enclosing box or label that says "Step 1: Find the item"). A user could interact with the search and think it's a standalone field. The Batch/Expiry section uses a border-top separator — better grouping, but the color-coded labels ("Batch" in orange/accent, "Expiry" in red) create false urgency for optional fields. Unit Cost and Total Cost are side-by-side with no visual relationship between them beyond spatial proximity. |
| **Gestalt: Similarity** | FAIL | Item picker uses two visually different controls for the same conceptual purpose: a text `<input>` for search and a `<select>` for selection. These look nothing alike, don't share a visual container, and have different interaction models. Users familiar with combobox patterns (single unified control) will be confused. Additionally, the "Batch No" label uses accent orange color and "Expiry" uses status-red — even though both are optional. Using status colors for optional field labels violates similarity (red = error/danger in the rest of the design system). |
| **Visual Hierarchy** | CONCERN | On the Counts page, the sticky "Save Counts" banner and the bottom "Submit Count" button both exist — creating ambiguous hierarchy (which is the true primary action?). In the Delivery modal, the "Cancel" button is styled as `btn-ghost` and placed at the very bottom below the primary — correct. However, the "Log Delivery" button label is prefixed with "+ " which is an inline icon-via-text pattern; it's inconsistent with other buttons that use Lucide icons (the outer modal's Receive Delivery button uses an `<img>` Lucide icon + text). On the Transfers page, the wizard step indicator (small numbered circles) is visually clear but the inactive steps are too small at 8×8px circles for quick glanceability. |
| **WCAG: Contrast** | CONCERN | The Counts page variance display uses `text-status-yellow` (#F59E0B on white #FFFFFF) for items with small drift — this combination has a 2.1:1 contrast ratio, which FAILS WCAG AA for all text sizes. The waste breakdown chart uses background color fills (`.bg-orange-500`, `.bg-red-400`, etc.) without text labels on the bars — color is the only encoding for small segments. The YieldCalculatorModal uses `text-gray-400` (#9CA3AF) on gray-900 (#111827) for labels — approximate ratio ~7:1, PASS. The delivery table uses `text-[10px]` for FIFO "left/used" counts — this is below the 12px minimum for caption text and will strain eyes during an 8-hour shift. |
| **WCAG: Touch Targets** | FAIL | Critical issues: (1) QuickNumberInput +/- buttons are `h-8` = 32px, 12px below minimum 44px. Benny uses these during the stock count — he must tap accurately on 32px targets with potentially damp hands. (2) The sidebar icon rail item heights — each nav link is approximately 44px (padding appears adequate). (3) Recent supplier chip buttons in the Receive Delivery form are `px-2.5 py-1` on a text-xs element — approximately 28px height. (4) The `[+ Receive Delivery]` button uses `btn-primary` class which enforces `min-height: 48px` per the design system — so the button itself is fine, but visual inspection of the outer button wrapper shows it may be smaller. (5) Waste reason buttons correctly use `min-h-[44px]`. (6) YieldCalculator numpad buttons use `min-height: 56px` — excellent. |
| **Consistency** | CONCERN | The ReceiveDelivery form uses a dual-input pattern (text search + select dropdown) for item picking. The WasteLog modal uses a single flat `<select>` with no search. The Transfers wizard uses a single `<select>` with no search. These three adjacent features in the same "Stock" section solve the same "pick an item" problem three different ways. The delivery form also includes a `PhotoCapture` component (camera/file upload) that the waste and transfers forms don't have — this inconsistency is justified for deliveries but should be noted. Success feedback is also inconsistent: deliveries show a toast at bottom-right; waste shows inline "Waste logged!" text before auto-closing. |
| **Error Prevention** | CONCERN | The Receive Delivery form correctly disables "Log Delivery" until Item + Quantity + Supplier are filled (`canSave` derived). Quantity validation prevents negative numbers (min="0"). The transfers wizard prevents overshooting stock with a red border + warning text — excellent error prevention. However: (1) the waste form allows entering a quantity of 0 grams and only the `canSave` check catches this; there is no inline validation feedback while typing; (2) the counts QuickNumberInput fires `onChange` on blur, not on change — a user could type a value, get distracted, not blur the field, and lose the entry when they tap "Save Counts". (3) The delivery modal doesn't warn if the entered quantity exceeds current available stock — Benny could accidentally double-enter a batch. |
| **Shift Endurance** | FAIL | The Counts page shows all 70+ stock items in a single scrolling table with NO category segmentation. Benny's shift involves meat items; he has no way to show only "Meats" during the count — he must scroll past pantry items, condiments, beverages, and sides to find his meat cuts. On a 10-inch tablet at 768px, with ~48px per row, meat items may be 8-12 scrolls down. This table becomes mentally exhausting over multiple shifts. Additionally, the `text-[10px]` and `text-xs` labels throughout the delivery table will cause eye strain during 8+ hour butcher sessions. The YieldCalculator's dark theme (gray-900) is excellent for extended use and provides good contrast from the bright white stock pages. |

---

## C. Best Day Ever — Benny's 9 AM Scenario

It's 9:15 AM on a Tuesday. The warehouse van arrived 20 minutes ago and unloaded six boxes of pork bone-in, two crates of chicken legs, and a smaller box of beef bone-out. Benny has wiped his hands on his apron — they're still a little damp from rinsing the cutting board. He opens the tablet mounted on the wall, logs in with one tap on his "Benny Flores" dev card, and goes straight to Stock > Deliveries.

The delivery page loads cleanly. He can see the expiry alert at the top — Kimchi B-243 is 2 days out, which he already knew about. He taps "Receive Delivery." The modal opens. He types "pork" into the search box and the dropdown below narrows from 70+ items to just pork-related items — good. But now he has to tap the dropdown too, to actually select "Pork Bone-In (grams)." Two taps instead of one. He selects it, and the unit auto-fills as "grams." He needs to enter 12,000 grams. The quantity field is a plain number input — he uses the keyboard to type it. The system auto-fills "Metro Meat Co." in the supplier field because that was their last delivery supplier — one pleasant surprise. He adds the batch number B-251 manually. He skips the expiry date because the carcass is fresh-today. He taps "+ Log Delivery." Done. One batch recorded.

He does this five more times for the remaining items. By the fourth delivery log, he's in a rhythm — search, select, type weight, confirm supplier, save. The process takes about 45 seconds per item once he knows the pattern. That's about 4-5 minutes total for six deliveries — acceptable.

Then he moves to the Stock Counts tab for his AM10 count. The page loads and he immediately sees the sticky orange "Enter counts for each item, then tap Save" banner. Good — he knows what to do. But then he looks at the table: all 70-something items for the entire branch, sorted with no obvious structure. Kimchi, Salt, Doenjang, Gochujang... he has to scroll past all of these to find his meat cuts. He counts the rows — Pork Bone-In is item 3, but Sliced Beef is row 12, and Chicken Wing is row 18. He taps the +/- steppers to adjust each count — but the buttons are small, about 32px. His damp fingers hit the wrong button twice. He corrects himself. After entering 8 meat cuts, he scrolls back up and taps "Save Counts." Done — but it took him 7 minutes instead of the 3 minutes it should have taken if the table were sorted by category.

Now he needs to log the trimmings from his morning prep work — about 250g of pork bone fragments and fat. He goes to Waste Log and taps "Log Waste." The modal opens. He selects "Pork Bone-In" from the flat dropdown (no search this time — he has to scroll through the alphabetically sorted list). He enters 250, then taps "Trimming (bone/fat)" from the quick-tap grid — this is the best interaction in the entire flow. Big, clear buttons, immediately tappable with a wet finger. He taps "Log Waste"... and then a Manager PIN modal appears. He wasn't told this was coming. He doesn't know Juan the manager's PIN. He closes the modal and goes to find Juan, disrupting Juan's morning prep to get authorization for a routine butchery record. This is a friction point that will happen every single morning.

The yield calculator, tucked away in the Weigh Station section under Kitchen navigation, exists and works beautifully — the dark-mode numpad interface is the best-designed screen in the entire flow. But Benny has to remember it lives under Kitchen, not under Stock, and he can only get there after processing orders. The yield data (raw weight vs. trimmed weight) doesn't feed back into the delivery record or the waste log — it's an isolated audit log entry. There's no handoff to the kitchen — no screen shows the chef that "Benny has trimmed 8kg of pork bone-in and it's ready."

---

## D. Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| P0 | **Manager PIN required for waste logging** by kitchen role. Benny must interrupt a manager every single morning shift to log routine trimming waste. This is a daily friction point that will cause waste to go unlogged. | Remove PIN gate for kitchen-role waste entries **with reason "Trimming (bone/fat)"**. Retain PIN gate only for "Other" or high-quantity entries (>500g). Alternatively, allow kitchen role to self-authorize for waste logging the same way YieldCalculatorModal does (kitchen = trusted role, no PIN needed). The `handleLog()` function in WasteLog.svelte already has `isElevatedRole` logic — extend it to include `kitchen` role OR add a `wasteCategories.trusted` concept. | S | High |
| P0 | **QuickNumberInput +/- buttons are 32px** (`h-8` in Tailwind), 12px below the 44px minimum. Used by Benny during the AM/PM stock count with potentially wet or greasy hands. | Change `h-8 w-8` to `h-11 w-11` (44px). The input itself is fine at 80px wide. | S | High |
| P0 | **Stock Counts table shows all 70+ items unsorted.** Benny's meat items are scattered throughout. He must visually scan and scroll to find his 8-12 relevant items amid pantry, condiments, and beverages. | Add category filter tabs above the counts table: [All] [🥩 Meats] [🥬 Sides] [🧪 Condiments] [🍶 Beverages] [🛢 Pantry]. Default to "Meats" when session role is `kitchen`. This is one `$state` variable + a filter on `branchItems`. | S | High |
| P0 | **Receive Delivery item picker is a dual-input anti-pattern** (text search input + separate `<select>` dropdown). Users interact with two different controls to complete one action. On mobile/touch, the `<select>` dropdown is especially awkward to use. | Replace the text+select pair with a single filtered list rendered as clickable cards or a combobox. Group items by category (`stockItem.category`) with collapsible sections. Pre-select the last-used item per session. | M | High |
| P1 | **Waste Log modal has no search on item picker.** 70+ items in a flat `<select>` with no filtering. Benny must scroll through all pantry/condiment items to reach meat items. | Add a text filter input above the waste `<select>` (same pattern used in ReceiveDelivery, or better: category filter first, then item). At minimum, sort items so Meats category appears first. | S | High |
| P1 | **WasteLog PIN gate not disclosed upfront.** Benny fills in item, quantity, and reason before discovering a manager PIN is required. This is a "work loss" error cost. | Show a visible notice at the TOP of the waste modal before any input fields: "⚠ Manager PIN required to submit." Or, as per P0 recommendation, remove the PIN for kitchen users entirely. | S | Medium |
| P1 | **No category grouping in item dropdowns across all stock forms.** Receive Delivery, Waste Log, and Transfers all use flat 70+ item selects with no grouping. | Use `<optgroup>` elements in all three selects to group by `stockItem.category`. This requires no design change — only a sort and grouping in the template. For delivery: Meats first, then Pantry, Beverages, etc. | S | High |
| P1 | **No "conversion" record in delivery flow.** When Benny receives 12kg pork bone-in, there is no field to record the expected or actual yield target. The system treats raw delivery weight as if it's the same as portion weight. | Add an optional "Yield Target %" field to the Receive Delivery form (defaults to the `DEFAULT_MEAT_EDGES` value for the item's category). Persist this to the delivery record. Show it in the delivery history table as "Expected Yield: 72%." | M | Medium |
| P1 | **Yield Calculator is siloed in Kitchen nav, not linked from Stock.** The butcher's yield data (raw→trim) lives in the Kitchen section and doesn't surface in the Stock section. | Add a "Log Yield" shortcut button in the Deliveries page header (next to "Receive Delivery"). It opens the same YieldCalculatorModal. Also add yield data as a column in the delivery history table (showing last recorded yield % for that cut). | M | Medium |
| P1 | **Yield Calculator result is audit-log only — no stock deduction.** When Benny logs a yield (10kg raw → 7.5kg trimmed), the system records it in the audit log but does NOT automatically deduct the 2.5kg of waste/trimmings from stock. Benny still has to go to Waste Log separately and record it. This creates double-entry and inconsistency. | When a yield is saved in YieldCalculatorModal: (1) auto-deduct `(rawWeight - trimmedWeight)` as a waste entry with reason "Trimming (bone/fat)", (2) show a confirmation step before saving that previews both the yield record and the auto-waste entry. | M | High |
| P1 | **No "handoff" mechanism from butcher to kitchen.** After Benny trims and portions the meat, there is nothing in the system that tells the grill station "8kg of pork bone-out is ready." The Weigh Station "Dispatched" panel exists but is tied to KDS orders, not general prep. | Add a "Mark as Prepped" state to the Weigh Station dispatched panel. When Benny finishes portioning a cut, he marks it as "prepped" with a weight. This creates a KDS alert / stock status update that the grill station can see. This is a Phase 2+ feature but the UX groundwork should be laid. | L | High |
| P2 | **`text-[10px]` on FIFO usage counts in delivery table** violates minimum font size (12px). During an 8-hour shift, these tiny numbers compound eye strain. | Change `text-[10px]` to `text-xs` (12px) throughout the delivery table FIFO usage column. | XS | Medium |
| P2 | **Batch/Expiry labels use accent orange and status-red colors** even though both fields are optional. This creates false urgency — red typically means "error" or "required" in the design system. | Change label colors to the standard `text-gray-500` used for all other optional labels. Only use red/orange for required fields or actual error states. | XS | Medium |
| P2 | **Duplicate "Save Counts" / "Submit Count" buttons** at top (sticky) and bottom of the Counts page cause confusion about which one to use. | Keep only the sticky top bar with "Save Counts." Remove the bottom "Submit Count" button to eliminate the ambiguity. | XS | Low |
| P2 | **Transfers page source inventory mini-table** shows all 70+ items in a scrollable 200px container, but the Meats category items the butcher cares about are mixed with everything else. | Sort the source inventory mini-table with Meats first, then add a visual category separator. Or filter it to only show items relevant to the selected item's category. | S | Low |
| P2 | **Counts page `text-status-yellow` for minor drift** fails WCAG AA (2.1:1 on white). | For small-drift variance indicators, use `text-amber-700` (#B45309 on white = ~5.4:1, PASS AA) instead of `text-status-yellow` (#F59E0B = 2.1:1, FAIL). Update `varianceClass()` in `StockCounts.svelte`. | S | Medium |
| P3 | **Counts page has no "last submitted at" timestamp** visible without looking at the period status. If Benny submitted the AM count at 9:30 AM and wants to verify it was saved, he can't see when — the period just shows "done" with a checkmark. | Add a small timestamp beneath each period button when its status is "done": "Submitted 9:32 AM · By Benny F." This uses data already available from `markPeriodDone()`. | S | Low |
| P3 | **Recent transfers log uses ISO timestamp format** (`loggedAt` column shows raw ISO string like "2026-03-09T07:15:00.000Z"). This is a data display bug. | Format `a.loggedAt` with `new Date(a.loggedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })` matching the delivery table format. | XS | Low |

---

## Yield & Conversion — Dedicated Analysis

### What Exists

The system has a **partial yield tracking architecture** split across three disconnected places:

1. **`DEFAULT_MEAT_EDGES` in `stock.constants.ts`** — a static ontology of meat conversion ratios (e.g., Pork Bone-In → Pork Bone-Out at 72%, Pork Bone-In → Pork Bones at 18%, Pork Bone-In → Pork Trimmings at 10%). These ratios are editable via the Meat Report page by managers.

2. **`YieldCalculatorModal` in `/kitchen/weigh-station`** — a well-designed numpad interface where Benny enters raw weight and trimmed weight, gets a live yield percentage, and saves it to the audit log. It supports Bluetooth scale input. The dark-mode design is appropriate for kitchen use.

3. **`log.yieldRecorded()`** — records to the audit log only. No stock impact. No feedback loop to the delivery record.

### What Is Missing

| Gap | Impact |
|---|---|
| **Delivery record has no yield target or actual yield field** | Raw weight tracked but no expected yield. System can't calculate expected portion weight from deliveries. |
| **Yield calculator result doesn't deduct waste from stock** | Butcher must separately log the trimming as a waste entry. Double-entry burden, likely to be skipped. |
| **No "portion inventory" concept** | After butchering, there's no way to record "from 12kg pork bone-in I got 8.6kg pork bone-out." The two stock items exist separately but no transaction links them. |
| **Yield calculator is in Kitchen section, not Stock** | Conceptually misplaced. Yield/conversion is a stock operation (it changes inventory levels). |
| **No "ready for service" handoff signal** | After portioning, kitchen prep station has no visibility into what the butcher has prepared and is ready. |
| **Yield history not visible on delivery records** | The delivery table shows batch number, quantity, FIFO usage — but no yield%. A manager can't look at a delivery and know "how efficient was Benny's butchery this morning?" |

### Recommended Yield Lifecycle

The ideal flow for a samgyupsal butcher:

```
[Receive Delivery]
Pork Bone-In: 12,000g received
Expected Yield: 72% (auto-suggested from ontology)
─────────────────────────────────────────────────────
[Butcher preps the meat]
─────────────────────────────────────────────────────
[Log Yield at Weigh Station]
Raw: 12,000g → Trimmed: 8,640g
Yield: 72.0% ✓ (matches expected)
Auto-creates: Waste entry (3,360g Pork Bones + Trimming reason)
Auto-updates: "Pork Bone-Out" stock +8,640g
─────────────────────────────────────────────────────
[Mark as Ready] ← missing
Signal to grill station: 8.6kg Pork Bone-Out ready for service
```

This lifecycle currently spans: Receive Delivery (Stock) → unmapped gap → Yield Calculator (Kitchen) → audit-only → no handoff.

---

## Summary Verdict Counts

| Verdict | Count |
|---|---|
| PASS | 3 |
| CONCERN | 8 |
| FAIL | 3 |

**FAIL items:**
- Hick's Law — 70+ item flat dropdown on every stock form
- WCAG: Touch Targets — 32px stepper buttons in Counts
- Shift Endurance — unsegmented 70-item counts table, 10px text

**P0 issues (3 total):**
1. Manager PIN for kitchen waste logging — daily friction, will cause waste to go unlogged
2. QuickNumberInput +/- buttons are 32px — fail touch target for wet/greasy hands
3. Counts table shows all 70+ items unsorted — Benny must scroll past pantry/condiments to find his meat cuts

---

*Audit conducted via source code inspection of `ReceiveDelivery.svelte`, `WasteLog.svelte`, `StockCounts.svelte`, `stock/transfers/+page.svelte`, `YieldCalculatorModal.svelte`, `QuickNumberInput.svelte`, and `stock.svelte.ts`. Browser sessions run as Benny Flores (kitchen/butcher, tag location) at 1024×768 viewport. Screenshots captured at each stage.*
