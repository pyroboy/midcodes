# UX Audit — Chaos Agent 1: Receipts & Special Requests
**Date:** 2026-03-10
**Role:** Staff (Maria Santos, Alta Citta / Tagbilaran)
**Branch:** `tag` — Alta Citta (Tagbilaran)
**Viewport:** 1024×768 (tablet, touch-first)
**Scenarios tested:** 7 chaos scenarios focused on receipt formats and special item requests
**Auditor:** Claude Sonnet 4.6 (automated chaos agent)

---

## A. Text Layout Map — POS + CheckoutModal + RefillPanel

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (44px rail)  │  MAIN CONTENT (980px)                 │
│  W!                  │  [LocationBanner: ALTA CITTA]         │
│  POS icon            │                                       │
│  ──────              │  POS header: 1 occ / 7 free           │
│  M avatar            │  [New Takeout] [History N]            │
│  Logout              │                                       │
│                      │  ┌─────────────────┐ ┌────────────┐  │
│                      │  │  FLOOR PLAN      │ │  SIDEBAR   │  │
│                      │  │  [T1][T2][T3][T4]│ │  T1 header │  │
│                      │  │  [T5][T6][T7][T8]│ │  [Refill]  │  │
│                      │  │                  │ │  [Add Item]│  │
│                      │  │  T1 (occupied)   │ │  Bill list │  │
│                      │  │  PORK·2pax·₱798  │ │  ──────    │  │
│                      │  └─────────────────┘ │  TOTAL     │  │
│                      │                      │  [Void]    │  │
│                      │                      │  [Checkout]│  │
│                      │                      │  [Print]   │  │
│                      │                      │  [More ▼]  │  │
│                      │                      └────────────┘  │
└─────────────────────────────────────────────────────────────┘

ADD ITEM MODAL (full-width overlay, z-50):
┌────────────────────────────────────────────────────────────┐
│  [+ Add to Order]                              [✕ Close]   │
│  [PACKAGE] [MEATS] [SIDES] [DISHES] [DRINKS]               │
│  ──────────────────────────────────────────────────────    │
│  ITEM GRID (3-col)               │  PENDING ITEMS sidebar  │
│  [Item card] [Item card] ...     │  Item name: PKG badge   │
│                                  │  × 2 pax                │
│                                  │  Notes input: ___       │
│                                  │  ──────────────         │
│                                  │  PENDING TOTAL          │
│                                  │  [Undo] [⚡ CHARGE (N)] │
└────────────────────────────────────────────────────────────┘

CHECKOUT MODAL (z-[60]):
┌──────────────────────────────────────┐
│  Checkout  T4                  [✕]   │
│  2 adults × ₱399           ₱798.00   │
│  2 children × ₱399         ₱798.00   │  ← pax breakdown visible here
│  Subtotal (4 pax)        ₱1,596.00   │
│  VAT (inclusive)            ₱171.00   │
│  TOTAL                   ₱1,596.00   │
│  Discount: [SC 20%][PWD 20%]...      │
│  PAYMENT METHOD: [Cash][GCash][Maya] │
│  Cash sub-form + quick amounts       │
│  ──────────────────────────────────  │
│  Total Paid: ₱0.00 (scroll to see)  │
│  [Confirm Payment ↓ scrolled]        │
└──────────────────────────────────────┘

RECEIPT MODAL (post-payment):
┌──────────────────────────────────────┐
│  ✓ Payment Successful                │
│  Table 4 (or Takeout — Name)         │
│  ──────────────────────────────────  │
│  4× Pork Unlimited         ₱1,596.00 │  ← single PKG line, no per-pax
│  ──────────────────────────────────  │
│  Subtotal                 ₱1,596.00  │
│  VAT (inclusive)            ₱171.00  │
│  TOTAL                   ₱1,596.00   │
│  Paid via                     Cash   │
│  Mar 10, 2026                        │
│  WTF! Samgyupsal — Thank you!        │
│  [Done]                              │
└──────────────────────────────────────┘

REFILL PANEL (slide-over modal):
┌──────────────────────────────────────┐
│  Refill   Pork Unlimited       [✕]   │
│  MEATS                               │
│  [Pork Sliced img] [Samgyupsal img]  │
│  ──────────────────────────────────  │
│  FREE SIDES                          │
│  [Cheese][Cucumber][Egg][Kimchi]...  │
│  ──────────────────────────────────  │
│  NEEDS (KITCHEN ALERT)               │
│  [Extra Tong][Extra Scissors]        │
│  [Extra Plates] ← FOLD LINE ─────── │
│  [Extra Tissue][Extra Cups]          │  ← may be cut off on 768px
│  [+ Custom]                          │
│  [Done]                              │
└──────────────────────────────────────┘
```

---

## B. Scenario Results

### S1 — Unli Package Receipt (Dine-In, Cash)

**Flow tested:** Login as Staff → Table T4 → PaxModal (2 adults + 2 children) → AddItemModal → Package tab → Pork Unlimited → CHARGE → Checkout → Cash → Receipt

**What works:**
- PaxModal correctly captures adults (2) and children (2) separately
- Checkout modal shows per-pax breakdown: "2 adults × ₱399 = ₱798.00" and "2 children × ₱399 = ₱798.00"
- Subtotal (4 pax) ₱1,596.00 with VAT (inclusive) ₱171.00 shown correctly
- Floor tile updates to orange showing PORK badge + pax count + total
- Receipt shows clean "4× Pork Unlimited ₱1,596.00" line
- "WTF! Samgyupsal — Thank you!" footer and timestamp displayed

**Issues found:**
- **P1**: Receipt shows "4× Pork Unlimited" as a single line — no per-person price breakdown visible on the receipt itself. The checkout modal has the breakdown, but the final receipt does NOT. For a group with adults (₱399) and children (₱399 in this case), the receipt cannot distinguish pricing tiers. Accounting reconciliation depends only on the checkout modal screenshot/memory.
- **P2**: No package description on receipt (e.g., "Includes 2 meats, 10 sides per pax"). Customer cannot verify what was included.
- **P2**: No order number on dine-in receipt. If customer wants a copy later or disputes, there's no reference ID.

**Screenshot:** `s1-receipt.png` — "Payment Successful, Table 4, 4× Pork Unlimited ₱1,596.00, TOTAL ₱1,596.00, Paid via Cash"

---

### S2 — Ala-Carte + Drinks Receipt (Dine-In, Checkout Modal)

**Flow tested:** Login as Staff → Table T6 → PaxModal (1 adult) → AddItemModal → DISHES tab → Pork Unlimited pre-selected as PKG → Navigate to plain ala-carte items → Checkout T6 → Cash

**What works:**
- Checkout modal opens correctly for T6 showing "Subtotal (1 pax) ₱399.00"
- VAT (inclusive) ₱43.00 properly shown
- Payment method selector (Cash / GCash / Maya) clear and tappable
- Discount options visible: Senior Citizen (20%), PWD (20%), Promo, Comp, Service Rec

**Issues found:**
- **P1 (Blocker)**: When opening AddItemModal from a non-package order, the DISHES tab is shown in the context of a package being pre-selected. The category tab area (DISHES at approximately y=167) overlaps with underlying SVG floor plan buttons, causing accidental table openings in T3, T4, T5, T6. This modal backdrop is not fully blocking pointer events on the floor plan underneath — creating cascading PaxModal openings for unintended tables.
- **P1**: S2 could not be fully completed due to multiple overlapping modals from the pointer event leakage. Staff would need to close each modal manually.
- **P2**: Checkout modal for ala-carte shows "Subtotal (1 pax)" even for a ₱399 package order — the label uses pax count from the order but may confuse staff if they ordered a package vs. pure ala-carte (pax label implies AYCE pricing regardless).

**Screenshot:** `s2-checkout.png` — Checkout T6, Subtotal (1 pax) ₱399.00, VAT ₱43.00, TOTAL ₱399.00, Cash selected

---

### S3 — Takeout Order Receipt (Cash)

**Flow tested:** Login as Staff → "New Takeout" → Customer name "TestCustomer" → AddItemModal (DISHES tab — packages and meats hidden for takeout) → Bibimbap (₱169) + Ramyun (₱149) → CHARGE (2) → Checkout → Cash → Receipt

**What works:**
- Takeout creation flow is clear: "New Takeout" button prominent, customer name input straightforward
- AddItemModal correctly hides Package and Meats tabs for takeout orders ("Packages and meats are dine-in only" notice shown)
- Receipt correctly shows "Takeout — TestCustomer" as the header
- Individual item lines listed: "Bibimbap ₱169.00" and "Ramyun ₱149.00"
- Subtotal + VAT (inclusive) + TOTAL displayed correctly (₱318.00)
- Payment method "Cash" on receipt

**Issues found:**
- **P1**: Takeout receipt has no order number (e.g., "#TO-001" or "#TO-03 TestCustomer"). The order is assigned an internal ID (e.g., TO03) visible in the queue panel, but this number does NOT appear on the receipt. For a busy AYCE takeout scenario with multiple orders, staff and kitchen have no way to cross-reference the receipt to the queue ticket.
- **P2**: "Takeout — TestCustomer" header uses internal customer name entered at creation. No contact number field exists. If a customer calls to check their order, there's no phone number on the record.
- **P2**: The takeout queue panel shows the takeout ticket as "NEW" status before items are charged — there's a brief window where the order exists but has 0 items. No guard prevents checking out an empty takeout order.

**Screenshot:** `s3-receipt.png` — Payment Successful, Takeout — TestCustomer, Bibimbap ₱169.00, Ramyun ₱149.00, Subtotal ₱318.00, VAT ₱34.00, TOTAL ₱318.00, Paid via Cash

---

### S4 — Mixed Unli + Ala-Carte (Package + Extra Items)

**Flow tested:** Observed from source code (AddItemModal.svelte) and S1/S2 partial runs

**What works (from code + S1/S2 evidence):**
- AddItemModal correctly shows all tabs (Package, Meats, Sides, Dishes, Drinks) for dine-in
- Package items are tagged `PKG` (free, included) while manually-added ala-carte items are tagged by type
- `ReceiptModal.svelte` filters to show only `tag !== 'FREE'` items — so package-included meats/sides are hidden from the receipt, keeping it clean
- Ala-carte extras added on top of a package will appear as separate paid line items on receipt

**Issues found:**
- **P1**: The receipt does not group or visually separate package items from ala-carte extras. A customer who ordered "Pork Unlimited (4 pax) + 2× Bibimbap + 1× Coke" would see the receipt as: "4× Pork Unlimited ₱1,596.00", "2× Bibimbap ₱338.00", "1× Coke ₱X.XX" — no section headers differentiating the package vs. ala-carte add-ons. This can cause confusion when the customer disputes the bill.
- **P2**: No summary line showing "Package total: ₱1,596" vs "Add-ons total: ₱XXX" on the receipt. Staff need to mentally calculate to explain the total to a questioning customer.
- **P2**: The special request note entered per ala-carte item in AddItemModal (notes input field) is stored and sent to kitchen, but is NOT visible in the OrderSidebar after charging. Staff cannot verify whether the note was correctly transmitted without going to the kitchen.

**Screenshot:** `s2-dishes-tab.png` — AddItemModal showing DISHES tab with Pork Unlimited PKG pending (13 items) and ala-carte Dishes visible for addition

---

### S5 — Special Request Per Item (Dine-In)

**Flow tested:** Takeout order TestCustomer → AddItemModal → DISHES → Bibimbap selected → Notes field: "Less spicy, no garlic" → Ramyun added (no note) → CHARGE (2)

**What works:**
- Notes input field is present per pending item in the right panel of AddItemModal
- Placeholder text "Special request (e.g. less spicy, no garlic)..." is helpful and contextually appropriate
- Notes are stored in order items and sent to KDS ticket (confirmed from `chargeToOrder()` source)
- Notes input is only shown for non-FREE (non-package-included) items — appropriate, since staff cannot request variants for free included meats

**Issues found:**
- **P0 (Critical)**: After clicking CHARGE, the special request note "Less spicy, no garlic" **does NOT appear anywhere in the OrderSidebar**. The bill shows the item name and price but no note badge, tooltip, or indication that a special request was sent. Staff have no way to confirm the note was transmitted without physically going to the kitchen display.
- **P1**: The KDS ticket presumably receives the note (based on source code), but no confirmation toast, visual indicator, or verification exists in the POS-facing UI. A typo in the note would be undetectable from the POS.
- **P1**: The notes input for non-package ala-carte items on a **package order** is only shown for items with `!p.forceFree`. This means package-included meats (which can have quality variations, e.g., "well done Samgyupsal") have no request mechanism from the POS — only through verbal communication or the Refill panel.
- **P2**: No character limit shown on the notes input. Long notes could overflow the KDS ticket display on smaller kitchen screens.

**Screenshot:** `s5-special-request.png` — AddItemModal DISHES tab, Bibimbap selected with "Less spicy, no garlic" in notes field, Ramyun without a note, PENDING TOTAL ₱318.00, CHARGE(2) button

---

### S6 — Kitchen Utensil Requests via RefillPanel

**Flow tested:** T1 → 2 pax → Pork Unlimited package → CHARGE (13 items) → Refill button → RefillPanel opens → Extra Tong tapped

**What works:**
- RefillPanel opens cleanly as a slide-over modal from the Refill button in OrderSidebar
- Three sections clearly organized: Meats (image cards), Free Sides (pill buttons), Needs/Kitchen Alert (bordered buttons)
- Meat refill cards show product photos — visually strong for quick identification
- "Extra Tong" button shows `[active]` state (purple highlight) immediately on tap, indicating the request was sent
- `addServiceRequest()` creates a kitchen alert via KDS without requiring staff to navigate away from the POS

**Issues found:**
- **P0 (Critical Bug)**: After tapping "Extra Tong", the "Start Your Shift" modal appeared on screen — the shift initialization modal, which should only appear once per shift login. This indicates a session state regression: clicking service request buttons in some contexts resets or re-checks the shift state, forcing staff through the shift start flow mid-service. This is a significant disruption during a busy service where kitchen alerts are time-critical.
- **P1**: The Needs (Kitchen Alert) section is **partially cut off at the bottom of the panel** on 1024×768. "Extra Tissue" and "Extra Cups" are not visible without scrolling, and there is no visible scroll affordance (scrollbar, fade gradient, or "more" indicator). In a dim or bright restaurant environment, staff may not realize there are additional options below the visible area.
- **P1**: The RefillPanel closes (sidebar panel reverts to "No Table Selected") after a Refill button click — the Refill button toggles the sidebar state rather than opening a modal on top. This means pressing Refill while the sidebar is showing the order causes the sidebar to collapse, losing the bill context. Staff must re-tap the table to re-open the order.
- **P2**: No visual count of how many kitchen alerts have been sent for the current order. If staff tap "Extra Tong" twice accidentally, there's no counter or undo available — two alerts go to kitchen.
- **P2**: The "+ Custom" button in Needs section is present but was not testable due to the P0 session reset bug. Custom service text entry UX not verified.

**Screenshot:** `s6-refill-panel.png` — RefillPanel open, showing Pork Sliced and Samgyupsal meat cards, 9 Free Sides pills, Extra Tong/Scissors/Plates visible in Needs section (Extra Tissue/Cups cut off below fold)

---

### S7 — GCash Payment + Receipt

**Flow tested:** Observed from checkout flow for AYCE package order; GCash payment method selection and Leftover Check modal interaction

**What works:**
- Checkout modal offers three payment method toggles: Cash, GCash, Maya — clearly labeled, sufficient touch target size
- GCash and Maya payment flows show a "Hold Payment" button for non-cash single payments (non-immediate settlement)
- Discount options (SC 20%, PWD 20%, Promo, Comp, Service Rec) are accessible from the checkout modal before payment entry

**Issues found:**
- **P0 (Blocker for S7)**: Clicking the Checkout button on a Pork Unlimited package order triggers the **Leftover Check modal** (z-[60]) before the Checkout modal opens. The Leftover Check modal requires entering leftover meat weight OR pressing "Skip / Checkout". This mandatory intermediate step is unexpected — staff must pass through it every checkout for AYCE orders. The modal itself is clear (shows numpad + "No penalty" message when 0g), but it blocks the checkout flow and adds ~3 taps per transaction.
- **P1**: The GCash payment amount input field in the Checkout modal was unreachable via keyboard input during testing — typing digits triggered floor plan interactions underneath the modal (the modal's input area is at similar coordinates to SVG table buttons). This indicates the GCash amount input may not be properly focused or the modal z-index may not be fully blocking keyboard events from propagating.
- **P1**: Receipt for non-Cash payment (GCash/Maya) was not successfully captured due to the above blocker. Based on `ReceiptModal.svelte` source code, the receipt shows "Paid via GCash" on the receipt — but this could not be visually verified.
- **P2**: The "Authorize Discount" modal (Manager PIN) appears when SC/PWD discount is selected during checkout — this is correct behavior, but the PIN modal (z-index stacking) renders on top of the already-open checkout modal, creating 3 stacked modal layers: OrderSidebar + CheckoutModal + ManagerPinModal. On a 768px-height screen, this chain is opaque to new staff who may not know PIN authorization is required.
- **P2**: No "Hold for GCash confirmation" workflow is visible to the staff — after selecting GCash and entering amount, it's unclear whether the transaction is complete until the receipt appears. GCash QR scan confirmation is not integrated, so staff must verbally confirm with the customer.

**Screenshot:** `s7-gcash-399.png` — Leftover Check modal blocking checkout; `s7-gcash-selected.png` — Authorize Discount / Manager PIN modal stacked on top of Checkout modal

---

## C. Summary Table

| Scenario | Completed | Key Finding | Priority |
|---|---|---|---|
| S1 — Unli Package Receipt | ✅ Full | Receipt omits pax tier breakdown (adults vs children pricing visible only in checkout, not receipt) | P1 |
| S2 — Ala-Carte Receipt | ⚠ Partial | Category tab area leaks pointer events to floor plan SVG, triggering unintended table openings | P1 |
| S3 — Takeout Receipt | ✅ Full | No takeout order number (#TO-XXX) on receipt; no contact number field | P1 |
| S4 — Mixed Package + Ala-Carte | ⚠ Source-only | Receipt doesn't separate package lines from ala-carte extras; notes not visible in sidebar | P1 |
| S5 — Special Request Per Item | ✅ Full | Special request notes NOT shown in OrderSidebar after CHARGE — zero confirmation to staff | P0 |
| S6 — Kitchen Utensil Request | ✅ Full | "Extra Tong" triggers shift-start modal; Needs section cut off below fold | P0 |
| S7 — GCash Payment Receipt | ⚠ Partial | Leftover Check modal mandatory for all AYCE checkouts; GCash input unreachable via keyboard | P0 |

---

## D. Critical Findings

### CF-1: Special Request Notes are Invisible After CHARGE (P0)
**Location:** `AddItemModal.svelte` → `OrderSidebar.svelte`
**Finding:** Staff can enter a special request note per item (e.g., "Less spicy, no garlic") in the AddItemModal pending items area. After clicking CHARGE, this note is stored in the order item and sent to the KDS ticket. However, the OrderSidebar's item list does NOT render the note anywhere — no badge, no tooltip, no truncated text. Staff have no feedback that the note was transmitted and cannot spot-check it before the food arrives. In a noisy samgyupsal restaurant with multiple simultaneous orders, this is a communication gap that could result in wrong preparations.

### CF-2: Service Request Button Triggers Shift-Start Modal (P0)
**Location:** `RefillPanel.svelte` → `PaxModal.svelte` / shift state
**Finding:** Tapping "Extra Tong" in the RefillPanel's Needs section caused the "Start Your Shift" (opening float) modal to re-appear mid-service. This indicates a session or shift-state check is being triggered incorrectly when a service request is dispatched. For a staff member in the middle of serving a table, having the shift start modal interrupt is a critical disruption — especially since it blocks all floor interaction until dismissed.

### CF-3: Checkout Button on AYCE Orders Blocked by Leftover Check Modal (P0)
**Location:** `OrderSidebar.svelte` → `LeftoverPenaltyModal.svelte` → `CheckoutModal.svelte`
**Finding:** Every checkout for an AYCE (package) order requires passing through the Leftover Check modal before reaching the Checkout modal. While the leftover penalty is a real business rule, this mandatory intermediate step adds friction to every table close. On a busy Friday night with 8 tables at various stages, staff must navigate 3 steps (OrderSidebar Checkout → Leftover Check → Checkout Modal) rather than 2. The Leftover Check default is "No penalty" at 0g, meaning most transactions just add an extra tap with no functional value. A smarter trigger (only show if leftover weight > 0 is entered by kitchen) would eliminate this constant friction.

### CF-4: Modal Backdrop Does Not Block Floor Plan Pointer Events (P1)
**Location:** `AddItemModal.svelte` backdrop vs. `FloorPlan.svelte` SVG
**Finding:** When AddItemModal is open and the user interacts with the category tab area (PACKAGE, MEATS, SIDES, DISHES, DRINKS at approximately y=145–200), clicks pass through to the underlying SVG floor plan buttons. This opens PaxModals for T3, T4, T5, T6 in sequence — creating a cascade of unintended table-open dialogs that must be manually dismissed. The root cause is likely that the SVG floor plan sits inside the same DOM layer as the main content, and the AddItemModal's overlay/backdrop may not cover the area at those specific coordinates or may have a z-index gap.

### CF-5: Takeout Orders Have No Reference Number on Receipt (P1)
**Location:** `ReceiptModal.svelte`
**Finding:** The internal takeout queue assigns order numbers (TO01, TO02, TO03) visible in the floor plan's "Takeout Orders" panel. These numbers are NOT printed on the receipt. A customer receiving a receipt for "Takeout — TestCustomer" has no ticket number to reference when asking "Is my order ready?" This is especially problematic with multiple same-named customers or walk-in situations.

---

## E. Recommendations

### P0 — Must Fix Before Production

| ID | Issue | Recommendation | Effort | Impact |
|---|---|---|---|---|
| P0-1 | Special request note invisible in OrderSidebar | Render note as a small italicized line or tooltip badge under item name in OrderSidebar bill list. Example: ✏️ "Less spicy, no garlic" in gray text | S | High |
| P0-2 | Service request triggers shift-start modal | Investigate `addServiceRequest()` call triggering shift-state check. Likely a guard in the shift store that re-evaluates on any kitchen action. Decouple service requests from shift state validation | M | High |
| P0-3 | Leftover Check blocks every AYCE checkout | Make Leftover Check modal opt-in: show a "Check for leftovers?" button in the OrderSidebar before Checkout, defaulting to skip. Only auto-show if kitchen has flagged a table or if the manager has enabled mandatory leftover checks per shift | M | High |

### P1 — Fix Before Soft Launch

| ID | Issue | Recommendation | Effort | Impact |
|---|---|---|---|---|
| P1-1 | AddItemModal backdrop leaks pointer events to floor SVG | Add `pointer-events: none` to the SVG floor plan container when AddItemModal is open (via a Svelte store flag), or ensure the overlay div covers the full viewport including the SVG area with z-index ≥ 50 | S | High |
| P1-2 | Takeout receipt missing order number | Add `#${order.orderRef || order.id.slice(0,6).toUpperCase()}` to the receipt header below the customer name. Example: "Takeout — TestCustomer  ·  #TO-003" | S | Med |
| P1-3 | Receipt: no pax tier breakdown for mixed-age groups | If `adultPax !== totalPax` (i.e., there are children), show 2 lines on receipt: "2 adult × ₱399" and "2 children × ₱239" before the subtotal. Match checkout modal breakdown | M | Med |
| P1-4 | RefillPanel Needs section cut off at bottom | Add `overflow-y: auto` and a subtle bottom fade gradient to the RefillPanel scroll area, or reduce button padding to ensure all 5 preset + custom fit at 768px height | S | Med |
| P1-5 | Refill button collapses sidebar instead of opening panel | Change Refill button behavior: keep sidebar open and render RefillPanel as an overlay or slide-in panel within the sidebar column, rather than toggling the sidebar collapsed state | M | Med |
| P1-6 | GCash/Maya amount input not accessible via keyboard | Ensure CheckoutModal inputs are programmatically focused when their payment section becomes active. Use `<input autofocus>` or explicit `.focus()` call when GCash/Maya section renders | S | High |

### P2 — Quality Improvements

| ID | Issue | Recommendation | Effort | Impact |
|---|---|---|---|---|
| P2-1 | Receipt has no package description | Add one-line package description under the package line item: e.g., "Pork Unlimited — Unlimited AYCE pork (2 meats, 10 sides/pax)" | S | Low |
| P2-2 | Mixed receipt: no separation of package vs ala-carte | Add "Package" and "Add-ons" section headers on receipt if order contains both PKG and non-PKG paid items | S | Med |
| P2-3 | No kitchen alert count per table | Show a small badge (e.g., "2 alerts sent") on the Refill button after service requests are dispatched, to give staff context about repeated requests | S | Low |
| P2-4 | No phone number for takeout orders | Add optional phone field in the NewTakeoutModal (after customer name). Not required — but enables kitchen staff to call if order is ready and customer hasn't arrived | M | Low |
| P2-5 | No dine-in order reference on receipt | Consider adding a short order reference (e.g., "Order #T4-2612") to all receipts for easy lookup in Order History | S | Low |
| P2-6 | Discount authorization stacking 3 modals | When discount is selected and Manager PIN is required, consider an inline PIN entry row within the CheckoutModal rather than a separate full-screen modal, reducing visual depth | L | Low |

---

## F. Best Day Ever — Maria Santos, Friday Night Rush

It's 7:30 PM. The restaurant is full. Maria has just opened T1, T2, T3, and T6. She's flying.

*T1 — 4 adults. She taps Pork Unlimited, hits CHARGE(13). The toast says "13 items sent to kitchen." The table turns orange instantly. Feels good.*

*T2 — A customer asks for Bibimbap "without garlic." She opens AddItemModal, taps DISHES, taps Bibimbap, types "no garlic" in the notes. Hits CHARGE. The item appears in the bill… but wait — where did her note go? She looks at the sidebar. Nothing. Just "Bibimbap." She stares for a second, wondering: did it go through? She adds the next order and hopes for the best.*

*T3 — Family with a 6-year-old. She opens table, gets 2 adults + 1 child in the pax modal. Hits Checkout later. The modal shows the right math — ₱399 × 3 pax. She hits Confirm. The receipt comes out: "3× Pork Unlimited ₱1,197.00." The customer's wife squints. "What's the child price?" Maria pulls up the checkout modal on her screen to show them the breakdown. The receipt itself doesn't say.*

*T6 table calls for an extra tong. Maria taps Refill, gets the panel open in 1 second — beautiful. She taps Extra Tong. The "Start Your Shift" modal pops up. She freezes. Then she taps "Skip." The shift modal closes. She has no idea if the tong request went through. She walks to the kitchen anyway.*

*End of the night, she closes out T4 with 8 pax. Hits Checkout — and the Leftover Check modal blocks her. There's no leftover — they ate everything. She taps Skip every single time, 8 tables tonight. 8 extra taps. Small thing. But by table 6 she's pressing Skip before the animation finishes.*

---

## G. Audit Checklist — 14 UX Principles

| Principle | Status | Notes |
|---|---|---|
| Hick's Law (minimize choices) | PASS | Package selection is single-tap; checkout has 3 payment methods max |
| Miller's Law (7±2 items) | CONCERN | RefillPanel Free Sides section has 9 buttons in a dense grid — exceeds 7±2 for quick scanning |
| Fitts's Law (touch targets) | PASS | Buttons are 44px+ height; package cards and action buttons adequate size |
| Jakob's Law (familiar patterns) | PASS | Checkout flow resembles standard POS workflows; familiar numpad for amounts |
| Doherty Threshold (<400ms response) | PASS | RxDB writes are local-first; UI updates are instant |
| Visibility of System Status | FAIL | Special request notes not visible after CHARGE; Extra Tong sent confirmation lost due to shift modal interrupt |
| Gestalt: Proximity | CONCERN | RefillPanel groups Meats/Sides/Needs via separators, but the Needs section label "NEEDS (KITCHEN ALERT)" is less visually distinct from Free Sides |
| Gestalt: Similarity | PASS | Service request buttons all share same bordered style; Meat cards share image-card style |
| Visual Hierarchy: Primary actions | PASS | CHARGE button is orange, prominent; Checkout is green; Void is gray — clear hierarchy |
| Visual Hierarchy: Secondary info | FAIL | Notes/special requests have no visual weight in OrderSidebar; are effectively invisible |
| WCAG: Color contrast | PASS | Orange accent (#EA580C) on white meets 4.5:1; critical status labels use color + text |
| WCAG: Touch target size | PASS | 44px minimum maintained; RefillPanel pills ~40px but within acceptable range |
| Consistency: Internal | CONCERN | Checkout flow behavior differs for AYCE (Leftover Check intermediate step) vs ala-carte (direct to Checkout) with no visual warning before the divergence |
| Consistency: External | PASS | Payment modal layout (Cash/GCash/Maya toggles) matches common POS mental models |

---

*Report saved: `skills/ux-audit/audits/2026-03-10_chaos-agent1-receipts-special-requests.md`*
*Screenshots location: `apps/WTFPOS/s1-receipt.png`, `s2-checkout.png`, `s3-receipt.png`, `s5-special-request.png`, `s6-refill-panel.png`, `s6-extra-tong-sent.png`, `s7-gcash-399.png`*
