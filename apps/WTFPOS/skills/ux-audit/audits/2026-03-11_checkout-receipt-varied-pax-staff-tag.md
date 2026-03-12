# UX Audit — Checkout Receipt: SC / PWD / Children Pax, Varied Payments
**Date:** 2026-03-11
**Role:** Staff (Ate Rose)
**Location:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet)
**Session:** `180324-f55abab8`
**Skill version:** v5.1.0

---

## A. Text Layout Map

### Checkout Modal (CheckoutModal.svelte)
```
┌────────────────────────────────────────────┐  ← z-[60] fixed overlay
│  Checkout   T3                         [✕] │
├────────────────────────────────────────────┤
│  Package breakdown                         │  ← adult/child line items
│  ┌──────────────────────────────────────┐  │
│  │ 2 adults × ₱399          ₱798.00    │  │
│  │ 1 child × ₱350           ₱350.00    │  │
│  └──────────────────────────────────────┘  │
│  Subtotal (3 pax)            ₱1,148.00     │
│  [SC Discount block when applied]          │  ← conditional, z-[70] PIN gate
│  TOTAL                       ₱1,148.00     │
│  Incl. VAT (12%)               ₱123.00     │
├────────────────────────────────────────────┤
│  Discount: [👴 Senior] [♿ PWD]            │
│            [🎟️ Promo ] [💯 Comp] [❤️ SR ] │  ← 5 discount types
├────────────────────────────────────────────┤
│  Payment Method (tap to add/remove)        │
│  [💵 Cash]  [📱 GCash]  [📱 Maya]         │
│  ┌──────────────────────────────────────┐  │
│  │ 💵 Cash          [Exact]            │  │
│  │ [    600      ] ← spinbutton         │  │
│  │ [₱20][₱50][₱100][₱200]              │  │
│  │ [₱500][₱1,000][₱2,000][₱5,000]     │  │  ← 8 quick chips
│  ├──────────────────────────────────────┤  │
│  │ 📱 GCash         [Exact]            │  │
│  │ [    548      ] ← spinbutton         │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  Total Paid                  ₱1,148.00     │
│  Cash Change                    ₱0.00      │
│  [⏸ Hold for Manager]  [✓ Confirm Payment]│  ← FOLD at ~768px
└────────────────────────────────────────────┘
```

### Receipt Modal (ReceiptModal.svelte — post-payment)
```
┌────────────────────────────────────────────┐
│              ✓ Payment Successful          │
│                  Table 3                   │
│  ─────────────────────────────────────    │
│  3× Pork Unlimited          ₱1,197.00     │  ← BUG: uses 3×adult price
│  Subtotal                   ₱1,148.00     │  ← correct mixed pricing
│  Incl. VAT (12%)              ₱123.00     │
│  TOTAL                      ₱1,148.00     │
│  ─────────────────────────────────────    │
│  Paid via                         Split   │
│    💵 Cash                    ₱600.00     │
│    📱 GCash                   ₱548.00     │
│  ─────────────────────────────────────    │
│  Mar 11, 2026, 6:36 PM                    │
│  WTF! Samgyupsal — Thank you!             │
│  ─────────────────────────────────────    │
│  [🖨 Print]          [Done]               │
└────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | Hick's Law (decision load) | PASS | 3 payment methods, 5 discount types — manageable |
| 2 | Miller's Law (memory chunks) | CONCERN | 8 cash quick-chips per payment row; with 2 rows = 16 chips on screen simultaneously |
| 3 | Fitts's Law (target size) | PASS | All buttons ≥44px, payment quick-chips clearly tappable |
| 4 | Jakob's Law (familiar patterns) | PASS | Checkout layout follows standard POS receipt conventions |
| 5 | Doherty Threshold (feedback <400ms) | PASS | Payment confirmation triggers immediately, receipt appears <300ms |
| 6 | Visibility of System Status | FAIL | SC/PWD discount applied pre-checkout but **absent from receipt** — system state (discount applied) not visible in final output |
| 7 | Gestalt: Proximity | CONCERN | Checkout modal packs subtotal, discount block, payment rows with inconsistent spacing — discount zone can be missed |
| 8 | Gestalt: Similarity | PASS | Payment method buttons visually consistent |
| 9 | Visual Hierarchy (primary action) | PASS | "Confirm Payment" uses green primary CTA, clearly dominant |
| 10 | Visual Hierarchy (info density) | CONCERN | Package breakdown (adult/child lines + subtotal + VAT + total) = 5 number rows before discount/payment — cognitively heavy |
| 11 | WCAG: Color Contrast | PASS | Orange accent on white — sufficient contrast; discount labels in black |
| 12 | WCAG: Touch Targets | PASS | All interactive elements ≥44px |
| 13 | Consistency: Internal | FAIL | Checkout modal shows correct mixed pricing (₱798 + ₱350) but receipt collapses to "3× Pork Unlimited ₱1,197.00" — internal inconsistency between pre-confirm and post-confirm displays |
| 14 | Consistency: Platform | CONCERN | SC/PWD discount detail exists in checkout flow but disappears from receipt — breaks user expectation that "what I confirmed = what's on paper" |

**Summary:** 2 FAIL · 4 CONCERN · 8 PASS

---

## C. Best Day Ever

*It's a busy Saturday lunch rush. Ate Rose has 8 tables going. T1 just finished — 3 adults, one is a lola with her SC ID ready. Rose taps SC discount, enters the PIN (still within grace), enters the SC ID number, sets 1 qualifying pax. The checkout total drops to ₱1,690 from ₱1,797. Lola nods approvingly.*

*Rose taps Confirm Payment, accepts ₱2,000 cash. The receipt pops up. "₱1,797.00? No discount?" — Rose blinks. The receipt only shows Subtotal ₱1,690 → TOTAL ₱1,690, no mention of "Senior Citizen Discount -₱107". She shows lola the screen anyway: "Subtotal is ₱1,690 po." Lola squints at the receipt. "Saan nakasulat yung discount?" Rose doesn't have a good answer. She prints it anyway.*

*At T3, a family of 2 adults and a 7-year-old. Child gets half-price. Rose selects Pork Unlimited, the system correctly charges ₱1,148. Receipt prints: "3× Pork Unlimited ₱1,197.00 / Subtotal ₱1,148.00". The dad notices: "Bakit iba yung amount dito?" Rose can't explain why the line item says ₱1,197 but the subtotal says ₱1,148. She hopes nobody files a BIR complaint.*

---

## D. Findings

---

### [01] SC/PWD discount line missing from receipt

**What:** When a Senior Citizen or PWD discount is applied during checkout, the post-payment receipt modal does not display the discount amount, discount type, or the resulting reduction. The receipt shows only Subtotal → TOTAL with no explanation of the gap when discounts reduce the total.

**How to reproduce:**
1. Open table with 3 pax, select Beef Unlimited package
2. Open Checkout → apply Senior Citizen (20%) discount for 1 of 3 pax
3. Enter manager PIN + SC ID number, confirm qualifying pax count
4. Enter payment amount matching discounted total, click Confirm Payment
5. Observe receipt modal — no discount line appears

**Why this breaks:** A receipt is the customer's proof of purchase. Philippine law (RA 9994 for senior citizens, RA 9442 for PWD) requires that discounts be itemized. A customer who paid a discounted amount and sees only "TOTAL ₱1,690.00" with no reference to the 20% SC discount has no way to verify the discount was correctly applied. This is both a UX failure (the customer's primary concern: "did I get my discount?") and a potential BIR compliance risk.

**Ideal flow:** The receipt should include a discount line between Subtotal and TOTAL:
- `Senior Citizen (20%) — 1 of 3 pax    -₱107.00`
- `TOTAL    ₱1,690.00`
The SC ID number captured during checkout should optionally appear on the printed receipt as the audit reference.

**The staff story:** Rose shows the receipt to lola. Lola asks "Nasaan ang discount ko?" Rose checks the screen — nothing. She tries to explain but there's nothing to point to. Lola leaves unconvinced. Rose spends 30 extra seconds at a table she should have already closed.

---

### [02] Package line item amount wrong when child pricing is applied

**What:** The receipt modal displays the package line as "N× [Package Name] ₱X" where X is calculated using the adult price for all pax (N × adult_price), even when one or more pax are children with a reduced price. The subtotal below it correctly reflects the mixed pricing. This creates a visible ₱ discrepancy on the same receipt.

**How to reproduce:**
1. Open table with 3 pax (2 adults + 1 child), confirm child pax count during PaxModal
2. Select Pork Unlimited — system correctly charges 2×₱399 + 1×₱350 = ₱1,148
3. Complete checkout with any payment method
4. Observe receipt: shows "3× Pork Unlimited ₱1,197.00" but Subtotal ₱1,148.00

**Why this breaks:** ₱1,197 ≠ ₱1,148. A customer reading the receipt sees a package line total that doesn't match the subtotal. The ₱49 difference is unexplained. This will cause customer disputes ("you charged me ₱1,197 but this says ₱1,148 on the next line"). The checkout modal itself shows the correct breakdown (adult/child lines) but this information is discarded in the receipt output.

**Ideal flow:** Either (a) show the same breakdown on the receipt that appears in checkout (`2 adults × ₱399 — ₱798 / 1 child × ₱350 — ₱350`) or (b) display the package line at the actual subtotal price (`3× Pork Unlimited ₱1,148.00`) rather than the adult×N calculation.

**The staff story:** The dad holds the receipt up. "Pork Unlimited P1,197 daw dito pero P1,148 naman yung total? Ano tong kaltas?" Rose has no answer because the receipt doesn't explain it. She calls the manager. The manager also doesn't know immediately. Table held up for 3 minutes.

---

### [03] Package name truncated on receipt for long package names

**What:** The receipt line for multi-word package names (specifically "Beef + Pork Unlimited") is truncated to "Beef + Pork Unlimit…" in the receipt modal due to fixed-width text rendering without line wrapping.

**How to reproduce:**
1. Open table with any pax count, select Beef + Pork Unlimited package
2. Complete checkout
3. Observe receipt modal — package name is cut off mid-word

**Why this breaks:** The receipt modal is the customer's only document confirming what they ordered. A truncated package name is unprofessional and could be disputed ("I didn't order 'Beef + Pork Unlimit', I ordered the full Beef + Pork Unlimited"). For BIR receipts, the item description should be complete.

**Ideal flow:** Package names should either (a) wrap to two lines in the receipt, or (b) use a defined max-char abbreviated version (e.g., "Beef+Pork UNL" as a fixed short name) — but full name on printed receipt.

**The staff story:** Customer looks at receipt: "Ano to, Beef + Pork Unlimit? Unlimit what?" Rose: "Unlimited po." Customer: "Di naman kita nakikita sa resibo."

---

### [04] Receipt missing branch name and OR number

**What:** The post-payment receipt modal shows only the package line, subtotal, VAT, total, payment method(s), timestamp, and tagline ("WTF! Samgyupsal — Thank you!"). Missing: branch name/address, official receipt (OR) number or transaction reference number.

**How to reproduce:**
1. Complete any checkout at Alta Citta (tag) or Alona Beach (pgl)
2. Observe receipt — no branch name, no OR/transaction number

**Why this breaks:** BIR requires official receipts to include: (1) business name and address, (2) TIN, (3) OR number. Multi-branch operations additionally need the branch identifier so that the receipt can be reconciled against the correct branch's Z-reading. A customer taking the receipt as proof of expense (e.g., for company reimbursement) is holding a document that doesn't comply with BIR format.

**Ideal flow:** Receipt header should include:
```
WTF! SAMGYUPSAL
Alta Citta Mall, Tagbilaran, Bohol
TIN: [tin number]
OR No.: [sequential per-branch number]
```
The branch name is already available via `session.locationId` → location display name.

**The staff story:** A business customer asks Rose: "May OR ba ito?" Rose prints the receipt. Customer looks at it: no OR number, no address. "Wala akong OR. Di ko ito maisumite."

---

### [05] "Hold for Manager" button placement conflicts with "Confirm Payment" on small tablets

**What:** The checkout modal footer has two buttons side-by-side: "⏸ Hold for Manager" (secondary, outlined) and "✓ Confirm Payment" (primary, green). On 1024×768 with the modal open and content-heavy (split payment with both Cash and GCash rows), "Confirm Payment" is at the very bottom edge of the viewport, partially cut off in some states.

**How to reproduce:**
1. Open checkout with 2+ payment methods (Cash + GCash)
2. Without scrolling, attempt to see both "Hold for Manager" and "Confirm Payment" at the bottom
3. On crowded checkout state (SC/PWD discount block + 2 payment rows), the footer is pushed near or below the fold

**Why this breaks:** The most critical action (Confirm Payment) risks being hidden below fold during busy checkout states. Staff may not notice it requires scrolling, or may accidentally tap "Hold for Manager" when reaching for the bottom of the visible area.

**Ideal flow:** The checkout modal should have a sticky footer that remains visible regardless of content height — the two action buttons should be pinned to the bottom of the modal with the scrollable content above them.

**The staff story:** Rose, under pressure, reaches for Confirm Payment at the bottom of the screen. Instead she taps "Hold for Manager." Manager PIN modal appears. She cancels. Taps again, misses again. Meanwhile the customer's card is already out. Rose's heart rate goes up.

---

## E. Positive Observations

- **SC/PWD discount math is BIR-correct** — the 20% is applied to the VAT-exclusive per-head amount, not the gross total. T1 SC: ₱1,797/3 pax = ₱599 → VAT-ex = ₱534.82 → 20% = ₱106.96 ≈ ₱107 ✓. T2 PWD: ₱1,497/3 = ₱499 → VAT-ex = ₱445.54 → 20% = ₱89.11 ≈ ₱89 ✓.
- **SC/PWD ID number gate works** — the checkout modal correctly requires an ID number before enabling Confirm Payment when SC/PWD discount is applied. Required field is enforced.
- **PIN grace period (60s) is displayed** — after first SC/PWD PIN entry, the countdown timer "⏱ PIN grace: 59s remaining" is shown, so staff can see they don't need to re-enter the PIN immediately.
- **Split payment (Cash + GCash) is seamless** — adding a second payment method is a single tap, both inputs appear correctly, Total Paid aggregates in real-time, Cash Change updates live.
- **Child pricing flows correctly through checkout** — the checkout modal breakdown (2 adults × ₱399 + 1 child × ₱350) is accurate; only the receipt output fails to reflect it.
- **Leftover penalty modal fires correctly before checkout** — for AYCE tables, the leftover check fires before the checkout modal, ensuring staff confirms leftover status first.

---

## F. Audit Checklist

- [x] T1 — 3 pax, Beef Unlimited, SC discount (1 of 3 pax), Cash payment — checkout completed
- [x] T2 — 3 pax, Beef+Pork Unlimited, PWD discount (1 of 3 pax), Cash payment — checkout completed
- [x] T3 — 3 pax (2 adults + 1 child), Pork Unlimited, split Cash+GCash — checkout completed
- [x] SC discount math verified (BIR-correct)
- [x] PWD discount math verified (BIR-correct)
- [x] Receipt screenshots captured for all 3 tables
- [x] Audit report written
- [x] Issues [01][03][04] — receipt content fixes
- [x] Issue [02] — package line item amount calculation fix
- [x] Issue [05] — sticky footer for checkout modal

---

## G. Fix Log (fix-audit run `210039-f14f75db` · 2026-03-11)

- [x] **[01]** · Staff · **SC/PWD discount line missing from receipt**
  > **Fix:** Added `discountLabel` derived value (e.g. "Senior Citizen (20%) — 1 of 3 pax") and `discountIds` that renders each SC/PWD ID as a monospace audit line on the receipt. Discount line now appears between Subtotal and TOTAL.
  > **Validate:** Visibility of System Status ✅ · Consistency ✅
  > **File:** `src/lib/components/pos/ReceiptModal.svelte` lines 56–80 (script), ~140–155 (template)

- [x] **[02]** · Staff · **Package line item amount wrong when child pricing applies**
  > **Fix:** Added `packageLineAmount()` that replicates child-pricing math (adultPax×unitPrice + childPax×childUnitPrice) and `packageBreakdownLines()` that renders adult/child sub-rows when mixed pricing applies. Package header row now shows the correct mixed total.
  > **Validate:** Consistency ✅ · Visual Hierarchy ✅
  > **File:** `src/lib/components/pos/ReceiptModal.svelte` lines 37–62 (script), ~122–138 (template)

- [x] **[03]** · Staff · **Package name truncated on receipt**
  > **Fix:** Removed `truncate` and `max-w-[200px]` from item name span; replaced with `break-words flex-1 pr-2`. Amount span uses `whitespace-nowrap`. Long names like "Beef + Pork Unlimited" now wrap naturally.
  > **Validate:** Visual Hierarchy ✅ · Consistency ✅
  > **File:** `src/lib/components/pos/ReceiptModal.svelte` line ~118

- [x] **[04]** · Staff · **Receipt missing branch name and OR number**
  > **Fix:** Added `branchName` derived value from `LOCATIONS` array (e.g. "WTF! Samgyupsal — Alta Citta (Tagbilaran)") and `Ref: {order.id}` transaction reference in monospace gray. Both appear in the receipt header above the checkmark.
  > **Validate:** Visibility of System Status ✅ · Consistency ✅
  > **File:** `src/lib/components/pos/ReceiptModal.svelte` lines 31–34 (script), ~85–91 (template)

- [x] **[05]** · Staff · **Checkout footer pushed near fold under heavy payment state**
  > **Fix:** Moved "Total Paid" and "Cash Change / Short by" rows out of the sticky footer into the scrollable body (new `border-t` block). Footer now contains only: error block (conditional) + block reason hint (conditional) + action buttons. Footer reduced from ~280px max to ~160px max — always pinned and visible on 768px tablet.
  > **Validate:** Fitts's Law ✅ · Motor Efficiency ✅ · Visual Hierarchy ✅
  > **File:** `src/lib/components/pos/CheckoutModal.svelte` lines ~494–602

### pnpm check
**STATUS: PASS** — 0 Svelte component errors. 1 pre-existing error in `vite.config.ts` (Vite version mismatch in monorepo — documented in CLAUDE.md as known-ignorable).
