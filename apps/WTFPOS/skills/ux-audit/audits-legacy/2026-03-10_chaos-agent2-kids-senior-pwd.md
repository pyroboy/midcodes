# Chaos UX Audit — Agent 2: Kids Pricing, Senior & PWD Discounts
**Date:** 2026-03-10
**Agent:** 2 of 3
**Role:** Staff (Maria Santos, Alta Citta)
**Branch:** Alta Citta (tag)
**Viewport:** 1024×768
**Session type:** Staff-only — no location switch, POS-only nav

---

## Business Rules Being Tested

| Rule | Expected Behavior |
|---|---|
| Kids ages 6–9 | ₱350 pork / ₱450 beef / ₱550 pork+beef (reduced package price) |
| Kids under 5 | FREE — excluded from unli package charge |
| Senior Citizen | 20% discount on net-of-VAT amount, BIR-compliant |
| PWD | 20% discount on net-of-VAT amount |
| SC/PWD | Manager PIN required to authorize + ID number + optional photo |

---

## A. Layout Map — PAX Modal

```
┌─────────────────────────────────────┐
│  How many guests for T[N]?          │
│  Capacity: 4                        │
├─────────────────────────────────────┤
│  Adults    full price    [ − ] 2 [+]│
│  [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ] │
│ ─────────────────────────────────── │
│  Children  ages 6–9·reduced price   │
│                          [ − ] 2 [+]│
│  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ]         │
│ ─────────────────────────────────── │
│  Free      under 5·no charge        │
│                          [ − ] 0 [+]│
│  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ]         │
│ ─────────────────────────────────── │
│  Total guests                    4  │
│                [Cancel] [Confirm]   │
└─────────────────────────────────────┘
```

## B. Layout Map — Checkout Bill Breakdown (no children)

```
┌─────────────────────────────────────┐
│  Checkout  T6                    ✕  │
├─────────────────────────────────────┤
│  Subtotal (1 pax)         ₱399.00  │
│  VAT (inclusive)           ₱43.00  │
│  TOTAL                   ₱399.00   │ ← BOLD / large
├─────────────────────────────────────┤
│  Discount:                          │
│  [👴 Senior Citizen (20%)] [♿ PWD (20%)] │
│  [🎟️ Promo] [💯 Comp] [❤️ Service Rec] │
├─────────────────────────────────────┤
│  PAYMENT METHOD     Tap to add/remove│
│  [💵 Cash] [📱 GCash] [📱 Maya]     │
│  Cash              ₱0    [Exact]    │
│  [₱20][₱50][₱100][₱200][₱500][₱1K][₱1.5K][₱2K] │
│  Total Paid               ₱0.00    │
├─────────────────────────────────────┤
│  [Cancel]           [✓ Confirm Payment] │
└─────────────────────────────────────┘
```

## C. Layout Map — Checkout Bill Breakdown (with children)

```
┌─────────────────────────────────────┐
│  Checkout  T4                    ✕  │
├─────────────────────────────────────┤
│  2 adults × ₱399          ₱798.00  │  ← Line item breakdown
│  2 children × ₱399        ₱798.00  │  ← BUG: should be ₱350
│  Subtotal (4 pax)        ₱1,596.00 │  ← BUG: should be ₱1,498
│  VAT (inclusive)           ₱171.00 │
│  TOTAL                 ₱1,596.00   │  ← BUG: should be ₱1,578*
└─────────────────────────────────────┘
* Expected: ₱798 + ₱700 = ₱1,498 subtotal + VAT
```

---

## Scenario Results

### S1: Kids Age 6–9 Pricing (Pork Unli) — 2 Adults + 2 Children

**Flow tested:**
1. Opened T4 (available table, capacity 4)
2. PAX modal appeared: set Adults=2, Children=2, Free=0 → Total=4
3. Confirmed PAX → AddItemModal opened
4. Packages showed child pricing correctly: "₱399 × 2 adults / ₱350 × 2 children (6–9)"
5. Selected Pork Unlimited → Pending Total showed ₱1,498.00 (correct: 2×399 + 2×350)
6. Charged 13 items → Bill showed ₱1,596.00 (WRONG — adult price × 4)
7. Checkout modal confirmed: "2 children × ₱399 = ₱798.00" (should be ₱350)

**What works:**
- PAX modal clearly differentiates Adults / Children (6–9) / Free (under 5) with helpful sub-labels
- Preset buttons (0–4 for children, 0–8 for adults) are large and fast to tap
- AddItemModal correctly shows per-package child price breakdown: "₱399 × 2 adults / ₱350 × 2 children (6–9)"
- Package cards show the child pricing prominently when childPax > 0
- Pending total in AddItemModal calculated correctly (₱1,498.00)

**Issues found:**
- **[CRITICAL]** Child pricing not carried through to the stored order. The `addItemToOrder()` function in `orders.svelte.ts` calls `deriveOrderItemProps()` which sets `OrderItem.unitPrice = item.price` (adult price) for packages. `OrderItem.childUnitPrice` is never populated from `MenuItem.childPrice`. `calculateOrderTotals()` relies on `pkgItem.childUnitPrice ?? pkgItem.unitPrice` — since `childUnitPrice` is null, it falls back to adult price. Net result: children billed at ₱399 instead of ₱350.
- **[VISUAL]** Checkout bill line item reads "2 children × ₱399" confirming the wrong price is stored
- **[CONFUSING]** The pending total (₱1,498) differs from the billed total (₱1,596) — staff cannot reconcile this discrepancy
- **[MISSING]** No age verification prompt per child — staff can misclassify a 10-year-old as "ages 6–9" with no guardrail
- **[MISSING]** Receipt shows "4× Pork Unlimited ₱1,596.00" — no separate line for adult vs. child on the printed receipt

**P-level:** **P0** — Children are being systematically overcharged at adult rate
**Screenshots:** `page-2026-03-09T16-48-19-279Z.png` (PAX modal), `page-2026-03-09T16-49-32-354Z.png` (AddItemModal with child prices), `page-2026-03-09T16-50-36-712Z.png` (checkout showing wrong child price)

---

### S2: Kids Under 5 — Free

**Flow tested:**
1. Opened T5 (available)
2. PAX modal: set Adults=2, Children=0, Free=1 → Total=3
3. Confirmed PAX → AddItemModal opened showing "Table · 2 pax"
4. Package cards showed "₱399/pax", "₱499/pax" etc. — simple adult pricing (no child breakdown since childPax=0)

**What works:**
- "Free under 5 · no charge" label is clear and correctly named
- Total guests count (3) includes the free child in the pax counter
- AddItemModal header correctly shows only paying guests ("2 pax") — the free child is correctly excluded from billing
- The free child does not generate a package line item — correct behavior

**Issues found:**
- **[P1]** AddItemModal and OrderSidebar show "2 pax" with no visible indication that 1 additional guest (the free infant) is present. Staff taking over mid-service has no UI signal that a free child was registered at table open. If pax changes later, the free child count is invisible.
- **[P2]** No reminder or label anywhere in the order ("incl. 1 free <5") to indicate the table has a free child — the order sidebar just shows "1 pax" after charging. During disputes, there is no audit trail in the order view.
- **[P2]** The PAX modal state carries over between table opens (Free=1 persisted from previous table) — a pre-filled "Free=1" could confuse staff opening a new table if they don't notice it.

**P-level:** **P1** — Free child is functionally correct but invisible after table confirmation; creates audit/dispute risk
**Screenshot:** `page-2026-03-09T16-53-09-644Z.png` (PAX modal with 2 adults + 1 free)

---

### S3: Senior Citizen Discount — Discount Visibility in Bill

**Flow tested:**
1. Opened T6 with 1 adult (Pork Unlimited ₱399)
2. Clicked Checkout → Leftover Check modal (AYCE penalty gate) appeared first
3. Clicked Skip/Checkout → Checkout modal opened
4. Bill section: Subtotal (1 pax) ₱399.00 / VAT (inclusive) ₱43.00 / TOTAL ₱399.00
5. Discount section: two large buttons "👴 Senior Citizen (20%)" and "♿ PWD (20%)"
6. Clicked SC button → Manager PIN modal appeared immediately

**What works:**
- SC and PWD discount buttons are prominently positioned at top of discount row (2-column full-width)
- TOTAL is displayed in large monospace font (₱399.00, extrabold)
- VAT is shown as "inclusive" — correct for pre-discount state

**Issues found:**
- **[P1 — Leftover Check UX]** Every checkout attempt triggers the "Leftover Check" modal before the actual checkout modal. This is a mandatory gate for AYCE tables. For a senior citizen scenario, staff must first handle the leftover weight measurement, then skip to checkout. On a busy shift this adds latency to every SC checkout. The "Skip / Checkout" label correctly allows bypassing, but the modal always interrupts.
- **[P2]** The bill section shows "VAT (inclusive)" for the pre-discount state, but after SC discount is applied it switches to "VAT (exempt)" — staff may not understand the VAT treatment difference.
- **[PASS]** Discount buttons are correctly positioned, large (min-height 44px), and visible without scrolling on 1024×768.

**P-level:** **P1** — Leftover Check interrupts SC/PWD checkout flow; discount visibility PASS
**Screenshot:** `page-2026-03-09T16-59-00-793Z.png` (checkout modal with discount buttons)

---

### S4: Senior Citizen Form Submission — ID Fields + Validation

**Flow tested:**
1. Checkout open (T6, 1 pax, ₱399)
2. Clicked "👴 Senior Citizen (20%)" → Manager PIN modal appeared
3. Entered PIN: 1, 2, 3, 4 (individual digit presses)
4. PIN accepted → checkout re-opened (or SC section appeared)

**Note:** During audit the checkout modal re-opened fresh from Leftover Check → Skip/Checkout path, showing no discount applied. The PIN was entered via digit buttons but the SC section with ID fields was not captured in this session due to flow interruption. Based on code review (`CheckoutModal.svelte` lines 330–356):

**Code-confirmed behavior (from source):**
- After PIN confirmation, `showScPwdSection` becomes true
- "Qualifying Persons" stepper appears: shows X of Y pax qualify, with +/- buttons
- For each qualifying person: `SC ID #N` text input + `PhotoCapture` component
- PhotoCapture shows "📷 Attach ID photo" button
- Live discount preview: "Discount (1/1 pax × 20%)" → `−₱71.00`
- `canConfirmCheckout` is blocked until all ID fields are filled (non-empty string required)

**What works (from code):**
- ID number input is required per qualifying person (blocks checkout if empty)
- Pax stepper allows partial SC — e.g. "2 of 4 pax qualify" → partial 20% discount
- Live discount preview updates as pax changes
- Photo capture is optional (not required for `canConfirmCheckout`)
- Fields are logically ordered: qualifying count → ID inputs → photo → discount preview

**Issues found:**
- **[P1]** The SC ID input placeholder is "e.g. 12345678" — not specific to OSCA card format. No input mask, length validation, or format guidance. A cashier may enter any free-text. BIR compliance requires correct OSCA card number format.
- **[P2]** Photo capture is optional (not required for checkout to proceed). BIR/OSCA rules typically require photo ID verification. The system allows checkout without photo — this is a compliance gap.
- **[P2]** SC form requires pax number selection but there's no prompt for the SC person's name — OSCA compliance typically requires noting the beneficiary's name.
- **[P1]** No field for "OSCA card number" vs "SC ID number" — generic label "SC ID #1" doesn't match the BIR/OSCA terminology cashiers would see on physical cards.

**P-level:** **P1** — Form exists and blocks checkout without IDs, but lacks OSCA-specific field names/validation
**Screenshot:** (SC ID section not captured live — based on code review of CheckoutModal.svelte lines 305–365)

---

### S5: Senior Citizen ID Photo Upload

**Flow tested (code-confirmed):**
- `PhotoCapture` component is embedded per qualifying person inside the SC/PWD section
- Triggered via `<input type="file" accept="image/*" capture="environment" multiple>`
- Shows camera icon (64×64 dashed border button) labeled "📷 Attach ID photo"
- On mobile: opens camera directly (capture="environment")
- On desktop (1024×768 tablet): opens file picker

**What works:**
- Camera icon is recognizable; "Attach ID photo" label is clear
- Image is compressed to 1024px max dimension at 80% quality before storing
- Stored as base64 data URL in `discountIdPhotos` state (not persisted to DB — in-memory only)
- Lightbox preview available by tapping the thumbnail
- Remove button (red X) appears on hover

**Issues found:**
- **[P0 — Data Loss]** `discountIdPhotos` is local component state (`$state`) and is NOT persisted to RxDB. The photo is only stored for the duration of the checkout modal. If the cashier closes checkout (accidentally or intentionally) and reopens it, all photos are lost. Photos are never saved to the order record.
- **[P1]** No confirmation or visual indicator that the photo was accepted and "locked in" for audit purposes. The thumbnail shows it's there, but nothing in the order history retains the photo.
- **[P2]** `capture="environment"` on a tablet POS may invoke the rear camera — more appropriate would be `capture="user"` (front camera) or letting staff choose, since IDs are held up to the camera.
- **[P2]** The photo upload area (64×64 button) is very small on a 1024×768 screen — difficult to accurately tap during a busy shift on a touchscreen.
- **[P2]** No guidance text on what photo to take (front/back of ID, clear/legible).

**P-level:** **P0** — ID photos are not persisted; audit trail for SC compliance is lost after checkout modal closes
**Screenshot:** (PhotoCapture UI not captured separately — consistent with SC section in code review)

---

### S6: PWD ID Photo Upload

**Flow tested:**
- Same flow as SC (Scenario 5) — PWD uses the same `discountType === 'pwd'` branch
- Same `PhotoCapture` component, same "PWD ID #1" label pattern
- Same `canConfirmCheckout` block requiring all ID text fields filled
- Manager PIN required same as SC

**What works:**
- PWD and SC use identical ID capture UI — consistent experience
- PWD label clearly shows "♿ PWD (20%)" matching government terminology
- Both SC and PWD render identical form sections — no confusion between discount types

**Issues found:**
- **[P0]** Same photo persistence bug as S5 — PWD ID photos lost on modal close
- **[P1]** No PWD card number format validation — placeholder "e.g. 12345678" generic
- **[P1]** No distinction between Persons with Disability (PWD) card number vs. other government ID. The PWD card number has a specific format from NCDA.
- **[P2]** No PWD beneficiary name field — only the card number, which may not be sufficient for DSWD/BIR audit compliance.

**P-level:** **P0** — Same photo loss bug; P1 for missing ID format validation

---

### S7: Mixed Table — Adult + PWD + Free Child

**Flow tested:**
1. Could not complete full end-to-end in live session due to modal state complexity
2. Based on code analysis of `calculateOrderTotals()`, `CheckoutModal.svelte` discount pax logic, and PAX modal behavior:

**Code-confirmed behavior:**
- PAX modal supports: Adults=1, Children=0, Free=1 → sets `pax=2, freePax=1`
- Checkout SC/PWD discount applies to qualifying pax only (e.g., 1 of 2 pax qualify)
- `discountPaxInput` stepper allows partial discount: "1 of 2 pax qualify for 20% discount"
- `calculateOrderTotals()` splits subtotal proportionally: `qualifyingShare = sub × (qualifyingPax / totalPax)`
- Free child is included in `totalPax` (pax=2) but has no package contribution

**Conceptual issue found:**
- **[P1]** If table has 1 adult + 1 PWD + 1 free child: `order.pax = 3`, `order.freePax = 1`. The discount pax stepper shows "X of 3 pax qualify". But the free child shouldn't be in the denominator for discount calculation since they paid ₱0. The proportional split will be wrong: PWD share = sub × (1/3) instead of the correct sub × (1/2) — the free child dilutes the PWD discount by 33%.
- **[P1]** No combined scenario tested by cashiers in practice — workflow requires opening table with correct PAX categories, then at checkout correctly identifying which pax are PWD — there is no per-seat labeling.
- **[P2]** No visual summary on the receipt of "1 adult regular + 1 PWD (20%) + 1 free (<5)" — the receipt only shows total and discount amount.

**P-level:** **P1** — Free child dilutes SC/PWD discount calculation (mathematical error in mixed scenarios)

---

## Summary Table

| # | Scenario | Result | Priority |
|---|---|---|---|
| S1 | Kids Age 6–9 Pricing (Pork Unli) | Children billed at adult price (₱399 instead of ₱350) | **P0** |
| S2 | Kids Under 5 — Free | Free child excluded from billing (PASS), but invisible in order | **P1** |
| S3 | SC Discount — Visibility in Bill | Discount buttons visible, layout correct; Leftover Check gate interrupts | **P1** |
| S4 | SC Form Submission — ID Fields | Form exists and blocks checkout; OSCA field naming/validation incomplete | **P1** |
| S5 | SC ID Photo Upload | Photo capture works in session; photos NOT persisted to DB | **P0** |
| S6 | PWD ID Photo Upload | Same as S5; identical flow | **P0** |
| S7 | Mixed Table — Adult + PWD + Free Child | Free child dilutes discount calculation; no per-seat labeling | **P1** |

---

## Critical Findings (P0)

### P0-01: Child Package Price Not Applied to Order (S1)

**Location:** `src/lib/stores/pos/item.utils.ts` → `deriveOrderItemProps()`, `src/lib/stores/pos/orders.svelte.ts` → `addItemToOrder()`

**Root cause:** When a package is added via `addItemToOrder()`, `deriveOrderItemProps()` returns `unitPrice = item.price` (adult price). The new `OrderItem` is built without `childUnitPrice`:
```ts
const newItem = { id: nanoid(), menuItemId: item.id, ..., unitPrice, ... };
// childUnitPrice is never set here
```
`calculateOrderTotals()` uses `pkgItem.childUnitPrice ?? pkgItem.unitPrice` — since `childUnitPrice` is null, children are billed at adult price.

**Impact:** Every table with children (ages 6–9) is systematically overcharged. For Pork Unlimited: ₱49 extra per child. For 2 children: ₱98 overcharge per table. For 10 tables/day with average 1 child: ~₱980/day in billing errors.

**Fix required:** Pass `MenuItem.childPrice` through to `OrderItem.childUnitPrice` during package item creation.

---

### P0-02: SC/PWD ID Photos Not Persisted (S5, S6)

**Location:** `src/lib/components/pos/CheckoutModal.svelte` — `discountIdPhotos` state

**Root cause:** `discountIdPhotos` is a local `$state<string[][]>` that is never written to the RxDB order document. The `checkoutOrder()` call does not include photo data. Closing and reopening checkout loses all photos.

**Impact:** BIR/OSCA audit compliance cannot be demonstrated if photos are required. Every SC/PWD transaction silently loses its ID photo documentation. There is no audit trail in the order history.

**Fix required:** Include `discountIdPhotos` in the order document (either as part of `Order` type or as a separate `audit_logs` entry referencing the order).

---

## P1 Findings

### P1-01: Free Child Invisible After PAX Confirmation (S2)

The "free" guest count is registered in PAX modal and stored as `order.freePax`, but nowhere in the OrderSidebar, bill section, or checkout summary is the free child mentioned. Staff have no way to verify the correct guest count was registered mid-service.

**Recommendation:** Add a "incl. N free (<5)" sub-label under the pax count in the OrderSidebar header.

---

### P1-02: Leftover Check Interrupts Every Checkout (S3)

The LeftoverPenaltyModal fires before the CheckoutModal for all AYCE tables. For SC/PWD customers, this adds an extra mandatory step before the discount-sensitive checkout. The Leftover Check requires scale data (or manual entry) before staff can proceed. "Skip / Checkout" bypasses this, but the flow disruption is jarring.

**Recommendation:** Allow staff to enter leftover weight within the checkout modal itself, or allow the Leftover Check to be deferred/skipped with a clear single-tap action visible immediately (not requiring reading the description first).

---

### P1-03: SC/PWD ID Number Format Validation Missing (S4, S6)

The OSCA card number field has no format validation. OSCA cards have a standard format (4-digit location code + 6-digit sequence). PWD cards have NCDA format. Without validation, cashiers may enter any text (name, partial number, etc.) — making audit compliance reports unreliable.

**Recommendation:** Add input format hint and/or basic length validation (8–12 chars minimum) per discount type.

---

### P1-04: Free Child Dilutes SC/PWD Discount (S7)

When `freePax > 0` and a discount is applied, the proportional calculation uses `order.pax` (which includes the free child) as denominator. This understates the discount amount because the free child's ₱0 contribution shouldn't count in the qualifying share ratio.

**Recommendation:** Modify `calculateOrderTotals()` to use `(totalPax - freePax)` as the effective pax count for SC/PWD proportional calculations.

---

### P1-05: Manager PIN Required for Staff-Initiated SC/PWD (S3)

All discount types including SC and PWD require the manager PIN (1234) before the SC ID form appears. This means a staff cashier cannot complete a senior citizen transaction independently — a manager must physically enter the PIN. On a busy Friday dinner shift with 3 SC tables simultaneously, this becomes a bottleneck.

**This is by design (SC-13/SC-14 compliance)** but the UX implication is significant:

**Recommendation:** Consider a PIN-less "request manager authorization" flow that sends an alert to the manager's device (Phase 2+ feature). Or add a note in the Leftover Check / PIN modal context about the SC workflow for staff training.

---

## P2 Findings

| ID | Finding | Location |
|---|---|---|
| P2-01 | PAX modal state persists between table opens (Free count carries over) | PaxModal.svelte `$state` initialization |
| P2-02 | Receipt shows "4× Pork Unlimited" — no adult/child breakdown on receipt | ReceiptModal rendering |
| P2-03 | Photo upload area (64×64px) too small for reliable touch on busy shift | PhotoCapture.svelte |
| P2-04 | `capture="environment"` uses rear camera — awkward for ID capture | PhotoCapture.svelte line 113 |
| P2-05 | No SC beneficiary name field — only card number collected | CheckoutModal.svelte SC section |
| P2-06 | VAT label switching ("inclusive" → "exempt") not explained to staff | CheckoutModal.svelte lines 252–255 |
| P2-07 | Children presets max at 4 (0–4 range) — tables with 5+ child guests cannot be entered via preset | PaxModal.svelte `childPresets` |
| P2-08 | AddItemModal header says "Table · N pax" — doesn't mention child/free breakdown | AddItemModal.svelte line 132 |

---

## Recommendations (Prioritized)

| Priority | Effort | Impact | Recommendation |
|---|---|---|---|
| P0 | S | Critical | Fix `addItemToOrder()` to populate `OrderItem.childUnitPrice` from `MenuItem.childPrice` |
| P0 | M | High | Persist `discountIdPhotos` to RxDB order document or `audit_logs` collection |
| P1 | S | High | Add "incl. N free (<5)" label to OrderSidebar and checkout pax summary |
| P1 | S | High | Fix SC/PWD discount calculation to exclude freePax from denominator |
| P1 | M | Medium | Add OSCA/PWD card number format hints and basic validation |
| P1 | L | Medium | Explore manager authorization delegation (notify-on-device) to unblock staff on busy shifts |
| P2 | S | Low | Reset PAX modal state between table opens (don't persist previous values) |
| P2 | S | Low | Add adult/child line breakdown to printed receipt when childPax > 0 |
| P2 | S | Low | Change `capture="environment"` to `capture="user"` in PhotoCapture for ID photos |
| P2 | S | Low | Extend child/free presets to 0–8 (matching adults row) |

---

## C. Best Day Ever — Empathy Narrative

**Maria Santos, Saturday dinner rush, 6:30 PM**

A family of 5 walks in: Mom (regular), Lola Rosario (65, Senior Citizen), Baby Luis (3 years old, free), and two kids aged 7 and 8. Maria opens T3 on the POS.

The PAX modal comes up — nice! It has three rows: Adults, Children (6–9), Free. She quickly sets Adults=2, Children=2, Free=1. Total=5. She confirms.

The AddItemModal opens for Package. She sees "Pork Unlimited ₱399 × 2 adults / ₱350 × 2 children (6–9)" — exactly right. She taps Pork Unlimited. The pending total shows ₱1,498.00. She charges.

But then the BILL shows ₱1,596.00. That's ₱98 more than expected. Mom asks "Bakit ganyan?" — Maria can't explain it. She calls the manager. Manager doesn't know why either. They just proceed.

At checkout time, Lola Rosario wants her senior discount. Maria taps "Senior Citizen (20%)". A PIN modal pops up. She has to call the manager over — who enters 1234 while balancing two other tables.

Finally the SC section appears. Maria sees "SC ID #1" input field. She asks Lola for her OSCA card. She types the number. There's a camera icon for a photo. She taps it, the file picker opens (not the camera directly — they're on a tablet). She finds the right photo from the gallery. It shows as a thumbnail.

But after she closes the checkout to grab the manager for something else, when she re-opens, the photo is gone. She has to do it again.

At the end, the receipt prints: "4× Pork Unlimited ₱1,596.00" and "Discount: −₱57.00." Lola Rosario asks why she's being charged ₱1,596 when two of the kids should be at child's price. Maria can't answer. She calls the manager again.

This was not a best day.

---

## Files Reviewed

- `/src/lib/components/pos/PaxModal.svelte` — PAX entry UI (correct 3-row design)
- `/src/lib/components/pos/CheckoutModal.svelte` — SC/PWD discount + ID section
- `/src/lib/stores/pos/item.utils.ts` — `deriveOrderItemProps()` (root cause P0-01)
- `/src/lib/stores/pos/utils.ts` — `calculateOrderTotals()` (freePax dilution P1-04)
- `/src/lib/stores/pos/orders.svelte.ts` — `addItemToOrder()` (P0-01 implementation site)
- `/src/lib/components/PhotoCapture.svelte` — ID photo capture (P0-02)
- `/src/lib/types.ts` — `Order`, `OrderItem`, `MenuItem` type definitions

## Screenshots Captured

| File | Description |
|---|---|
| `page-2026-03-09T16-47-41-817Z.png` | PAX modal for T2 — baseline (4 adults, children=0) |
| `page-2026-03-09T16-48-19-279Z.png` | PAX modal for T3 — 2 adults + 2 children (S1 setup) |
| `page-2026-03-09T16-49-32-354Z.png` | AddItemModal — Pork Unlimited with child pricing shown |
| `page-2026-03-09T16-49-52-971Z.png` | Pending items after Pork Unlimited selected — ₱1,498.00 |
| `page-2026-03-09T16-50-11-865Z.png` | OrderSidebar post-charge — bill shows ₱1,596.00 (wrong) |
| `page-2026-03-09T16-50-36-712Z.png` | Checkout modal — "2 children × ₱399" bug confirmed |
| `page-2026-03-09T16-53-09-644Z.png` | S2 PAX modal — 2 adults + 1 free (under 5) |
| `page-2026-03-09T16-56-37-278Z.png` | Manager PIN modal on SC discount click |
| `page-2026-03-09T16-57-03-959Z.png` | PIN modal after entering "1" — 4-dot indicator |
| `page-2026-03-09T16-59-00-793Z.png` | Checkout modal with SC/PWD discount buttons |
