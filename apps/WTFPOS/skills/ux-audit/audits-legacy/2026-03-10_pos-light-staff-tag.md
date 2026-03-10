# UX Audit — POS Light Pass (Staff, Alta Citta)

**Date:** 2026-03-10
**Role:** Staff (Maria Santos, `tag`)
**Mode:** Light — core happy path
**Flow:** Start Shift → Floor Plan → Open Table → Pax → Add Package → Order Sidebar → Checkout
**Viewport:** 1024×768 tablet landscape
**Skill version:** v4.1.0

---

## A. Text Layout Map

### State 1 — POS Floor Plan (shift started)

```
┌──┬──────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                               │ ← LocationBanner (always visible)
├──┤─────────────────────────────────────────────────────────────────────────  │
│🛒│  POS  [1 occ] [7 free]  [ⓘ]  [📦 New Takeout]  [🧾 History 8]          │ ← floor topbar
│  │                                                                            │
│  │  ┌───────────────────────────────────┐   ┌──────────────────────────────┐ │
│  │  │  [T1] [T2] [T3] [T4]             │   │        🧾                    │ │
│  │  │  [T5] [T6] [T7* PORK 0m ₱798 13]│   │   No Table Selected          │ │ ← fold ~400px
│  │  │  [T8]                            │   │   Tap an occupied table...   │ │
│  │  │                                  │   │                              │ │
│  │  │  ← SVG floor plan 546×597px      │   │  Green = available           │ │
│  │  │                                  │   │  Orange = occupied           │ │
│  │  └───────────────────────────────────┘   └──────────────────────────────┘ │
│M │                                                                            │
│→ │ [Logout]                                                                   │
└──┴────────────────────────────────────────────────────────────────────────────┘
```

### State 2 — Order Sidebar (active table T7)

```
  ┌─────────────────────────────┐
  │ T7  [2 pax ✎]  0m    [✕]   │ ← header row
  │ Pork Unlimited              │ ← package label
  │ [🔄 Refill]  [Add Item]     │ ← actions (equal weight)
  │─────────────────────────────│
  │ Pork Unlimited  SENT  ₱798 PKG [✕]  │
  │   Meats:                    │
  │     Samgyupsal    WEIGHING  │
  │     Pork Sliced   WEIGHING  │
  │   Sides:                    │
  │     [10 requesting ▼ show]  │
  │─────────────────────────────│
  │ BILL  13 items      ₱798.00 │
  │─────────────────────────────│
  │ [Void]  [Checkout]  [Print] │ ← 3 equal-weight buttons
  │ [More ▼ Transfer·Merge·Split·Pax] │
  └─────────────────────────────┘
```

### State 3 — Checkout Modal

```
  ┌───────────────────────────────────┐
  │ Checkout  T7                 [✕]  │
  │───────────────────────────────────│
  │ Subtotal (2 pax)        ₱798.00  │
  │ VAT (inclusive)          ₱86.00  │ ← ambiguous label
  │ TOTAL                   ₱798.00  │
  │───────────────────────────────────│
  │ Discount:                         │
  │ [👴 Senior (20%)]  [♿ PWD (20%)] │
  │ [🎟️ Promo]  [💯 Comp]  [❤️ Svc]  │
  │───────────────────────────────────│
  │ Payment Method  (tap to add)      │
  │ [💵 Cash]  [📱 GCash]  [📱 Maya] │
  │                                   │
  │ 💵 Cash            [Exact]        │
  │ [          0          ] ← spinbutton│
  │ [₱20][₱50][₱100][₱200]           │
  │ [₱500][₱1,000][₱1,500][₱2,000]   │ ← max ₱2,000 — no ₱5,000
  │                                   │
  │ Total Paid              ₱0.00     │
  │ ← no Change line visible          │ ← missing
  │───────────────────────────────────│
  │ [Cancel]  [✓ Confirm Payment]     │ ← Confirm may be below fold
  └───────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | PASS | Category tabs narrow item space well |
| 2 | Miller's Law (chunk info) | CONCERN | Order sidebar shows 6+ data points per table card |
| 3 | Fitts's Law (target size) | CONCERN | Void/Checkout/Print row: equal-size destructive + confirmatory actions |
| 4 | Jakob's Law (POS conventions) | FAIL | No change-due display — every POS system shows change |
| 5 | Doherty Threshold (<400ms) | PASS | RxDB local-first, all writes feel instant |
| 6 | Visibility of System Status | CONCERN | Leftover Check gate not signaled on Checkout button |
| 7 | Gestalt: Proximity | PASS | Bill summary groups are clearly separated |
| 8 | Gestalt: Similarity | CONCERN | Void and Checkout buttons same weight/size |
| 9 | Visual Hierarchy (primary CTA) | CONCERN | Confirm Payment may be below fold at 1024×768 |
| 10 | Visual Hierarchy (info density) | PASS | Checkout modal is cleanly structured |
| 11 | WCAG Contrast | PASS | Orange on white passes 3:1 for large text |
| 12 | WCAG Target Size | PASS | All buttons appear ≥44px |
| 13 | Consistency (internal) | CONCERN | Max cash denomination ₱2,000 inconsistent with ₱5,000 bills in PH |
| 14 | Consistency (mental model) | FAIL | "VAT (inclusive)" — staff may read as "VAT is extra" |

---

## C. Best Day Ever — Maria Santos, Tuesday Night Rush

It's 7:40 PM and the restaurant is packed. Maria has T1–T6 all open, T7 just seated. She taps T7 on the floor plan, enters pax (2), and the Add Item modal opens automatically — smooth. She selects Pork Unlimited, it auto-jumps to Meats. She taps CHARGE and the kitchen gets the ticket instantly.

An hour later, she taps Checkout on T7. A weight-check modal appears — she wasn't expecting it but it's quick. She enters 0 (clean plate) and taps the big green button. The checkout modal appears. The couple hands her a ₱1,000 bill. She enters 1000 in the cash input. She looks for the change amount. There's no "Change: ₱202" line. She has to calculate mentally while the next table is calling her name. She almost gives back ₱200 instead of ₱202. Small mistake, small embarrassment, big trust dent.

---

## D. Recommendations

[01] **No change-due calculation shown in checkout**

**What:** After entering a cash amount that exceeds the total, there is no "Change: ₱XXX" line shown anywhere in the checkout modal. Only "Total Paid: ₱1,000" is displayed, with no derived change amount.

**How to reproduce:** Open T7 (₱798.00 bill). Go to checkout. In Cash input, enter 1000. Observe — no change line appears.

**Why this breaks:** Ate Maria is managing three tables simultaneously during dinner rush. Having to calculate ₱798 change from ₱1,000 mentally while a new group is walking in is a real error vector. Every POS system in the Philippines (and the world) shows change. This is Jakob's Law: users expect what they already know.

**Ideal flow:** As soon as the paid amount exceeds the total, a `Change: ₱202.00` line appears in a large, high-contrast font directly below "Total Paid". It disappears if the paid amount drops below the total.

**The staff story:** *"I took her ₱1,000, typed it in, and just… had to math it in my head. My brain was already on Table 3. I almost shorted her ₱2."*

---

[02] **₱5,000 bill denomination missing from cash quick-select**

**What:** The cash quick-select buttons max at ₱2,000. Philippine ₱5,000 bills (the brown "Ninoy" note) are extremely common for groups paying after dinner. For a ₱1,600 bill paid with ₱5,000, the cashier must manually type "5000" in the spinbutton.

**How to reproduce:** Open checkout for any table with ₱1,500+ bill. Observe cash quick-select: [₱20][₱50][₱100][₱200][₱500][₱1,000][₱1,500][₱2,000]. No ₱5,000.

**Why this breaks:** A group dinner for 4 at ₱399/pax = ₱1,596. A ₱5,000 note is the logical tender. Kuya Marc, manning the register while also watching the grill, now has to type a 4-digit number on a spinbutton. Under time pressure, a single mis-key (₱500 instead of ₱5000) means wrong change.

**Ideal flow:** Add a ₱5,000 quick-select button as the 9th denomination. Consider also ₱500 being moved to the first row for small bills.

**The staff story:** *"Yung barkada nagbayad ng 5k. Kinausap ko pa yung spinbutton, 'type ko na lang'. Nahiya pa ako dun sa customers habang nagtatype."*

---

[03] **"VAT (inclusive)" label reads as "VAT is extra" to non-accounting staff**

**What:** In the checkout bill summary, the line reads "VAT (inclusive): ₱86.00". The word "inclusive" is accounting jargon. Restaurant staff who are not trained in BIR compliance often read this as "₱86 is being added (inclusive of the VAT charge)", not "the ₱86 is already built into the ₱798 total."

**How to reproduce:** Open any checkout modal. Read the bill summary — "VAT (inclusive): ₱86.00" appears between Subtotal and TOTAL. The TOTAL remains ₱798 (not ₱884), confirming VAT is already embedded. But the label doesn't make that clear.

**Why this breaks:** Sir Dan's staff have asked him repeatedly: "Bayad pa ba ng VAT?" (Do they pay VAT on top?). Every clarification is a micro-interruption during service. If a new staff member incorrectly explains the VAT line to a customer who asks, it creates a trust issue.

**Ideal flow:** Change to "VAT included (12%): ₱86.00" — or "Incl. VAT: ₱86.00". Removes the parenthetical confusion and matches how Philippine receipts are actually printed on BIR-accredited machines.

**The staff story:** *"Tinanong ako ng customer bakit may VAT pa sila na babayaran. Sabi ko hindi, kasama na. Nagtinginan kami kasi yung receipt parang may bayad pa."*

---

[04] **Void button is leftmost CTA in the primary action row — fat-finger risk on touch**

**What:** The order sidebar bottom row shows [Void] [Checkout] [Print] as three equal-weight horizontal buttons. "Void" — a destructive, manager-PIN-gated action — is the leftmost (first) button, positioned closest to the natural resting thumb position on a tablet held in landscape.

**How to reproduce:** Open any occupied table. Look at the bottom of the order sidebar. "Void" appears first in the action row, at the same visual weight as "Checkout".

**Why this breaks:** On a busy night, a staff member reaching for Checkout might tap Void. Even though Void requires manager PIN (gate exists), the accidental trigger opens a confirmation modal and interrupts the payment flow. A table that's been mid-checkout for 30 seconds while staff fumbles through a Void dismissal is embarrassing.

**Ideal flow:** Reorder the row as [Print] [Void] [Checkout] — moving the destructive action to the center and the primary CTA to the right (standard convention). Better: make Checkout a full-width btn-success button, and collapse Void + Print into a secondary "More" dropdown.

**The staff story:** *"Taas ng kamay ko sa Checkout, tinamaan ko yung Void. Biglang lumabas yung PIN modal. Hiya naman yung customer."*

---

[05] **Leftover Check is an undisclosed gate — staff tap Checkout expecting payment**

**What:** Tapping "Checkout" triggers a Leftover Check modal first (weigh uneaten meat, enter grams). Staff are not warned that a weight-check step exists before the payment screen. The Checkout button has no indicator of this intermediate step.

**How to reproduce:** Open an active AYCE table. Tap "Checkout". Observe — a "Leftover Check" modal appears asking for leftover weight in grams, not the payment modal.

**Why this breaks:** Ate Rose, rushing to close T7 before the next seating, taps Checkout expecting to enter payment. Instead, she's confronted with a numpad and grams entry she didn't plan for. She now has to either know the answer (did she check the leftover plate?) or run back to the table to check. The cognitive surprise breaks flow.

**Ideal flow:** Add a small visual cue to the Checkout button: "Checkout (leftover check first)" — or better, show a 3-step progress indicator when any gate-based modal opens: ① Leftover Check → ② Payment → ③ Done. This primes staff for the multi-step nature before they tap.

**The staff story:** *"Na-ano ako. Akala ko mag-aask na ng bayad pero sinabi pa sa akin mag-weigh muna ng tira. Hindi ko alam kung may tira pa sila, kailangan ko pang bumalik dun."*

---

## Fix Checklist

- [ ] [01] Add `Change: ₱XXX` line to `CheckoutModal.svelte` when paid > total
- [ ] [02] Add ₱5,000 quick-select denomination to cash payment row in `CheckoutModal.svelte`
- [ ] [03] Relabel "VAT (inclusive)" to "Incl. VAT (12%)" in checkout bill summary
- [ ] [04] Reorder order sidebar action row: [Print] [Void] [Checkout] or promote Checkout to full-width
- [ ] [05] Add multi-step indicator or tooltip to Checkout button signaling leftover check gate

---

## Overall Recommendation

This flow is **ready for service with two caveats** — issues [01] (no change display) and [04] (Void placement) should be resolved before the next busy weekend; the rest are polish items that won't block operations.
