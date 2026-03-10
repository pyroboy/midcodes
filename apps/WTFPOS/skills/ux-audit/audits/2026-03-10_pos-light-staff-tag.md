# UX Audit — POS Light Pass (Staff, Alta Citta)

**Date:** 2026-03-10
**Role:** Staff (Maria Santos, `tag`)
**Mode:** Light — core happy path
**Flow:** Login → Start Shift → Floor Plan → Open Table (T1) → Pax Entry → Add Package (Pork Unlimited) → Add Meat (Samgyupsal 200g) → CHARGE → Order Sidebar → Checkout → Leftover Check → Payment → Receipt
**Viewport:** 1024×768 tablet landscape
**Skill version:** v4.3.0
**Prior audit:** `audits-legacy/2026-03-10_pos-light-staff-tag.md` — 5 issues found. Issue [01] (no change display) confirmed FIXED; [02]–[05] still open and renumbered below.

---

## A. Text Layout Map

### State 1 — POS Floor Plan (all 8 tables free)

```
┌──┬──────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                               │ ← LocationBanner
├──┤──────────────────────────────────────────────────────────────────────────│
│🛒│  POS  [0 occ] [8 free]  [ⓘ]  [📦 New Takeout]  [🧾 History 13]        │ ← floor topbar
│  │                                                                            │
│  │  ┌───────────────────────────────────────┐   ┌──────────────────────────┐ │
│  │  │  [T1] [T2] [T3] [T4]               │   │         🧾               │ │
│  │  │  [T5] [T6] [T7] [T8]               │   │   No Table Selected       │ │ ← fold ~400px
│  │  │                                      │   │   Tap an occupied table... │ │
│  │  │     ← SVG floor plan                 │   │   Green = available       │ │
│  │  │                                      │   │   Orange = occupied       │ │
│  │  └───────────────────────────────────────┘   └──────────────────────────┘ │
│M │                                                                            │
│→ │ [Logout]                                                                   │
└──┴────────────────────────────────────────────────────────────────────────────┘
```

### State 2 — Order Sidebar (T1 active, Pork Unlimited charged)

```
┌──────────────────────────────┐
│ T1  [2 pax ✎]  1m    [✕]    │ ← header row
│ Pork Unlimited               │ ← package label
│ [🔄 Refill]  [Add Item]      │ ← actions
│──────────────────────────────│
│ Pork Unlimited  SENT ₱798 PKG [✕]       │
│   Meats:                     │
│     Samgyupsal × 2   WEIGHING REQUESTING│
│     Pork Sliced      WEIGHING           │
│   Sides:                     │
│     [10 requesting ▼ show]   │ ← collapsed (good)
│──────────────────────────────│
│ Meat dispatched  0.20kg (200g)          │
│──────────────────────────────│
│ BILL  14 items       ₱798.00 │
│──────────────────────────────│
│ [Void]  [Checkout]  [Print]  │ ← Void leftmost ← issue [03]
│ [More ▼ Transfer·Merge·Split·Pax] │
└──────────────────────────────┘
         ↑ "✓ 14 items sent to kitchen" toast (bottom, appears after CHARGE)
```

### State 3 — Leftover Check Modal (appears first when Checkout is tapped)

```
┌─────────────────────────────────┐
│  Leftover Check            [✕]  │ ← no warning this exists before tapping Checkout
│  ℹ Show leftover policy         │
│  Weigh uneaten meat. Over 100g → ₱50/100g. Enter 0 if clean. │
│  0 g · No penalty               │
│  ┌───┬───┬───┐                  │
│  │ 1 │ 2 │ 3 │                  │
│  │ 4 │ 5 │ 6 │                  │
│  │ 7 │ 8 │ 9 │                  │
│  │CLR│ 0 │ ⌫ │                  │
│  └───┴───┴───┘                  │
│  [✓ No Leftovers — Proceed to Checkout] │
└─────────────────────────────────┘
```

### State 4 — Checkout Modal

```
┌─────────────────────────────────────┐
│ Checkout  T1                   [✕]  │
│─────────────────────────────────────│
│ Subtotal (2 pax)           ₱798.00  │
│ VAT (inclusive)             ₱86.00  │ ← issue [02]
│ TOTAL                      ₱798.00  │
│─────────────────────────────────────│
│ Discount:                           │
│ [👴 Senior Citizen (20%)]  [♿ PWD (20%)] │
│ [🎟️ Promo]  [💯 Comp]  [❤️ Service Rec] │
│─────────────────────────────────────│
│ Payment Method  Tap to add/remove   │
│ [💵 Cash]  [📱 GCash]  [📱 Maya]   │
│                                     │
│ 💵 Cash                  [Exact]   │
│ [spinbutton: 0]                     │
│ [₱20][₱50][₱100][₱200]            │
│ [₱500][₱1,000][₱1,500][₱2,000]    │ ← max ₱2,000 — issue [01]
│                                     │
│ Total Paid               ₱1,000.00  │
│ Cash Change                ₱202.00  │ ← FIXED ✅ (was missing in legacy)
│─────────────────────────────────────│
│ [Cancel]    [✓ Confirm Payment]     │
└─────────────────────────────────────┘
```

### State 5 — Receipt Confirmation

```
┌─────────────────────────────────────┐
│ ✓ Payment Successful                │
│ Table 1                             │
│─────────────────────────────────────│
│ 2× Pork Unlimited          ₱798.00  │
│ Subtotal                   ₱798.00  │
│ VAT (inclusive)             ₱86.00  │ ← issue [02] persists here too
│ TOTAL                      ₱798.00  │
│─────────────────────────────────────│
│ Paid via Cash                       │
│ Tendered                ₱1,000.00   │
│ Change                    ₱202.00   │
│─────────────────────────────────────│
│ Mar 10, 2026, 8:52 AM               │
│ WTF! Samgyupsal — Thank you!        │
│─────────────────────────────────────│
│ [Done]                              │ ← no [Print] or [Reprint] — issue [05]
└─────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | PASS | 5 category tabs; Package auto-switches to Meats after selection; sides collapsed by default |
| 2 | Miller's Law (chunk info) | CONCERN | Sidebar lists 14 items; no Round grouping — all items appear at one hierarchy level |
| 3 | Fitts's Law (target size) | CONCERN | `[Void][Checkout][Print]` — three equal-size buttons; ✕ close buttons on modals likely below 44px (KP-01) |
| 4 | Jakob's Law (POS conventions) | FAIL | "VAT (inclusive)" label persists in checkout AND receipt — reads as additive charge, not breakdown |
| 5 | Doherty Threshold (<400ms) | PASS | RxDB local-first; "14 items sent to kitchen" toast appears immediately after CHARGE |
| 6 | Visibility of System Status | CONCERN | CHARGE toast confirms kitchen send; but Leftover Check gate is invisible before tapping Checkout; receipt "Done" gives no print confirmation |
| 7 | Gestalt: Proximity | PASS | Meats/Sides grouped clearly in sidebar; Pending Items panel well-bounded in AddItemModal |
| 8 | Gestalt: Similarity | CONCERN | Void and Checkout buttons same size and style — fat-finger risk during peak rush |
| 9 | Visual Hierarchy (primary CTA) | PASS | "✓ Confirm Payment" is distinct once payment entered; "✓ No Leftovers — Proceed to Checkout" is a clear, descriptive CTA |
| 10 | Visual Hierarchy (info density) | PASS | Checkout modal cleanly structured in distinct sections |
| 11 | WCAG Contrast | PASS | Orange on white passes ≥3:1 for large text; date/Philippine format is consistent |
| 12 | WCAG Target Size | CONCERN | Denomination chips (₱20–₱2,000 in a single row) may compress below 44px on some screen sizes (KP-01) |
| 13 | Consistency (internal) | CONCERN | ₱5,000 denomination absent from quick-select; "VAT (inclusive)" appears identically in checkout modal and receipt |
| 14 | Consistency (mental model) | CONCERN | "Meat dispatched" sidebar metric — "dispatched" could mean "sent from kitchen to table" or "sent from POS to kitchen"; ambiguous for new staff |

**Summary:** 5 PASS · 8 CONCERN · 1 FAIL

---

## C. Best Day Ever — Maria Santos, Saturday Night Rush

It's 7:50 PM and every table is open. Maria just seated a group of 2 at T1 — nice couple, first-timers. She taps T1, the Pax modal comes up: Adults 2, quick tap on "2", Confirm. The AddItemModal opens straight to Package — she picks Pork Unlimited. Then she goes to Meats, taps Samgyupsal, picks 200g. She hits CHARGE. The floor card flips orange and she sees "14 items sent to kitchen" — smooth.

Twenty minutes later the couple wants to pay. She taps Checkout. A weight check modal appears — she was expecting the payment screen. She blinks, reads "Weigh uneaten meat — Enter 0 if clean." She peeks at the table: plate's clean. She taps "✓ No Leftovers" and the checkout screen finally appears.

She enters ₱1,000 from the man's wallet and immediately sees "Cash Change: ₱202.00" — no math needed, clean. She taps Confirm. The receipt screen shows "✓ Payment Successful" and "Change: ₱202.00." She tells the couple their change.

The woman asks: "Can I have a printed receipt?" Maria looks at the screen. There's a [Done] button. Just Done. She taps it. T1 clears. Now the receipt is gone. She navigates to History, finds the order (it's #14 in the list), and reprints from there. The couple waits an extra 20 seconds while she searches. *"Pasensya na po, sandali lang."*

---

## D. Recommendations

[01] **₱5,000 bill denomination missing from cash quick-select**

**What:** The cash quick-select denomination row ends at ₱2,000: [₱20][₱50][₱100][₱200][₱500][₱1,000][₱1,500][₱2,000]. The Philippine ₱5,000 bill ("Ninoy" — brown note) is extremely common for group dinners. For a ₱1,596 bill (4 pax Pork Unlimited), paying with ₱5,000 requires manual keyboard entry instead of a single tap.

**How to reproduce:** Open checkout for any table with ₱800+ bill. Look at the cash denomination quick-select. Confirm the highest chip is ₱2,000 with no ₱5,000.

**Why this breaks:** Ate Maria, working two tables simultaneously during the 8 PM rush, needs to tap the ₱5,000 chip quickly and move on. Instead she has to reach the spinbutton and type "5000" — four keystrokes on a touch keyboard — while the next table is waving at her. A single mis-key (₱500 instead of ₱5,000) means wrong change and a frustrated customer.

**Ideal flow:** Add ₱5,000 as the 9th denomination chip. Consider also a ₱10,000 chip (rare but exists). The row would read: [₱20][₱50][₱100][₱200] / [₱500][₱1,000][₱2,000][₱5,000]. Move ₱1,500 out (it's rarely used) to keep the row at 8 chips.

**The staff story:** *"Nagbayad ng barkada ng 5k. Wala sa quick select. Nag-type pa ko sa keyboard habang naghihintay sila. Hiya naman."*

---

[02] **"VAT (inclusive)" label reads as additive charge — persists in checkout AND receipt**

**What:** Both the checkout modal and the receipt confirmation show "VAT (inclusive): ₱86.00" between the Subtotal and TOTAL lines. "Inclusive" is accounting vocabulary. Restaurant staff and customers read it as "₱86 of VAT is being added (inclusive of this charge)," not "₱86 is already embedded inside the ₱798 total." The TOTAL line showing ₱798 (not ₱884) confirms VAT is embedded — but the label doesn't communicate this.

**How to reproduce:** Open checkout for any table. Read the bill summary: "Subtotal (2 pax) ₱798.00 → VAT (inclusive) ₱86.00 → TOTAL ₱798.00." Confirm payment and see the same label on the receipt confirmation screen.

**Why this breaks:** Sir Dan's staff regularly get asked by customers "May VAT pa ba?" (Do we still pay VAT on top?). Every clarification is a micro-interruption during service. When a new cashier incorrectly explains it — "Yes, VAT is ₱86" — and the customer thinks they owe ₱884, trust breaks. This is Jakob's Law: the label must match what users already know from ATM receipts, grocery receipts, and other Philippine POS systems, which say "VAT Incl." or "Incl. VAT (12%)."

**Ideal flow:** Change "VAT (inclusive)" to "Incl. VAT (12%)" in both the checkout modal and receipt. The ₱86 value stays the same — only the label changes. This is a one-line CSS-class-and-label change in `CheckoutModal.svelte` and `ReceiptModal.svelte`.

**The staff story:** *"Tinanong ko pa yung manager kung talaga bang kasama na yung VAT sa total. Hindi ko alam kung papayagan namin mag-explain sa customer na 'kasama na yan.' Lagi akong nahihiya sa ganyan."*

---

[03] **Void button is the leftmost (first) action in the primary CTA row — fat-finger risk on touch**

**What:** The order sidebar bottom row shows `[Void] [Checkout] [Print]` as three equal-weight horizontal buttons. "Void" — a destructive, manager-PIN-gated action — is positioned leftmost, occupying the thumb's natural landing zone when a staff member reaches for the Checkout button while looking at the table, not the screen.

**How to reproduce:** Open any occupied table. Look at the bottom of the order sidebar. "Void" is the first button on the left at the same size and visual weight as "Checkout."

**Why this breaks:** During the dinner rush, Ate Rose reaches for the Checkout button while simultaneously telling T6 to wait. Her thumb lands slightly left of where she aimed — she taps Void instead. Even though Void requires manager PIN (the gate is there), the unexpected PIN modal interrupts the payment flow. The couple at T1 waits 10 seconds while she fumbles to dismiss it. Small friction, visible embarrassment, real slowdown.

**Ideal flow:** Reorder to `[Print] [Void] [Checkout]` — placing the primary CTA (Checkout) at the rightmost position where the thumb naturally lands last. Better yet: promote Checkout to a full-width `btn-success` button spanning the bottom row, and collapse Void + Print into a secondary "•••" overflow menu. This is the industry-standard pattern for POS systems.

**The staff story:** *"Taas ng kamay ko papunta sa Checkout, natamaan ko yung Void. Lumabas yung PIN modal. Nahiya ako sa customer na nakatingin sa akin habang mag-cancel cancel pa."*

---

[04] **Leftover Check is an undisclosed gate — Checkout button gives no warning**

**What:** Tapping "Checkout" opens a Leftover Check modal first (weigh uneaten meat, enter grams, tap "✓ No Leftovers — Proceed to Checkout"). The Checkout button itself has no visual indicator that this intermediate step exists. Staff who don't know the flow will be surprised every time — and new staff during training will be confused about why tapping Checkout doesn't go to payment.

**How to reproduce:** Open any active AYCE table (Pork Unlimited, Beef Unlimited, etc.). Tap "Checkout" in the order sidebar. Observe: Leftover Check modal appears instead of payment screen. The button label is still "Checkout" with no badge, tooltip, or step indicator.

**Why this breaks:** Ate Rose is closing T7 before a new seating. She taps Checkout expecting payment. A weight-check numpad appears. She doesn't know the leftover weight — she'd have to walk back to the table, check, and come back. Even if she knows the flow, the lack of signal means she has to remember mentally which tables have AYCE packages and will require a leftover check. During a busy shift, this mental load costs real seconds.

**Ideal flow:** Add a step indicator or badge to the Checkout button: show "⚖ Check → 💳 Pay" beneath the Checkout label, or display a small badge "2 steps" when the table has an active AYCE package. Alternatively, show a 2-step progress bar at the top of the Leftover Check modal: `[① Leftover ●] [② Payment ○]` so staff can see exactly where they are in the checkout flow.

**The staff story:** *"Pinindot ko yung Checkout — akala ko magbabayad na. Lumabas yung timbang-timbang screen. Hindi ko alam kung may tira pa sila kasi hindi na ako bumalik doon. Tinitignan na lang nila ako."*

---

[05] **Receipt confirmation modal has no print button — "Done" is the only CTA**

**What:** After confirming payment, a receipt confirmation screen appears with the full bill breakdown ("✓ Payment Successful", items, VAT, total, change). The only action button is `[Done]`. There is no `[Print Receipt]` button. Once "Done" is tapped, the table clears and the receipt is no longer visible. To get a printed receipt, staff must navigate to Order History, find the closed order by number, and print from there.

**How to reproduce:** Complete a full checkout cycle (open table → add package → CHARGE → Checkout → Leftover Check → Confirm Payment). Observe the receipt confirmation screen. Note that the only interactive element is the "Done" button. Tap Done. The floor plan returns. The receipt is now accessible only through History.

**Why this breaks:** In the Philippines, customers at full-service restaurants frequently request a printed receipt for reimbursement (company meals, business expenses) or simply to verify the charge. The natural moment to offer printing is the receipt confirmation screen — the staff is already looking at the bill summary. Forcing navigation to History to reprint is a 5-step detour (tap History → find order #14 → open → scroll → reprint) during a busy shift when the next table is already opening.

**Ideal flow:** Add a `[🖨 Print]` button alongside `[Done]` on the receipt confirmation screen. Both buttons dismiss the modal. Print triggers the Bluetooth/network receipt printer workflow (or downloads a PDF if no printer is connected). This is a single-line addition to `ReceiptModal.svelte` or wherever the post-payment confirmation is rendered.

**The staff story:** *"Hinanap ng customer yung resibo para sa reimbursement niya. Pinindot ko na yung Done eh. Kailangan ko pang pumunta sa History para hanapin. Naghintay sila halos isang minuto. 'Sorry po, sandali lang.'"*

---

## Fix Checklist

- [x] [01] Add ₱5,000 quick-select denomination chip in `CheckoutModal.svelte` cash row (remove ₱1,500 to keep 8 chips)
  > **Fix:** Replaced `1500` with `5000` in the cash preset array. Row is now [₱20][₱50][₱100][₱200][₱500][₱1,000][₱2,000][₱5,000].
  > **Validate:** Fitts's Law ✅ · Jakob's Law ✅ · Consistency ✅
- [x] [02] Relabel "VAT (inclusive)" → "Incl. VAT (12%)" in `CheckoutModal.svelte` and `ReceiptModal.svelte`
  > **Fix:** Changed the conditional label in both files so the non-exempt path renders "Incl. VAT (12%)"; exempt path still shows "VAT (exempt)".
  > **Validate:** Jakob's Law ✅ · Consistency (mental model) ✅
- [x] [03] Reorder order sidebar action row from `[Void][Checkout][Print]` to `[Print][Void][Checkout]`
  > **Fix:** Reordered DOM elements in `OrderSidebar.svelte` — Checkout is now rightmost, Void in the middle. No logic or styles changed.
  > **Validate:** Fitts's Law ✅ · Error Prevention ✅ · Gestalt (Similarity) ✅
- [x] [04] Add a 2-step progress indicator to the Leftover Check modal
  > **Fix:** Added a purely visual step indicator below the close button — active Step 1 "Leftover Check" (accent-orange filled circle) → Step 2 "Payment" (gray empty circle). No interactivity.
  > **Validate:** Visibility of System Status ✅ · Error Prevention ✅ · Recognition over Recall ✅
- [x] [05] Add `[🖨 Print]` button alongside `[Done]` on the payment receipt confirmation screen
  > **Fix:** Imported `printReceipt` from `$lib/stores/hardware.svelte` (same function used by CheckoutModal) and added a `btn-secondary` Print button (≥44px) to the left of Done in `ReceiptModal.svelte`.
  > **Validate:** Visibility of System Status ✅ · Doherty Threshold ✅ · Motor Efficiency ✅

---

## Overall Verdict

The core happy path is **operationally sound** with one notable regression fix (change-due display — FIXED ✅). The five remaining issues are real friction points that compound during peak rush. Issues [01], [02], and [05] are small code changes with high daily impact. Issues [03] and [04] require slightly more UI restructuring but are the most safety-critical (Void mis-tap, Checkout gate surprise).

**Recommended order of fixes:** [03] → [01] → [05] → [02] → [04]
