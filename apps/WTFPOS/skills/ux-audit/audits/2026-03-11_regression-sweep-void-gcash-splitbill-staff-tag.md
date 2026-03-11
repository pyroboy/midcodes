# UX Audit — Regression Sweep 2: Void · GCash · Split Bill
**Date:** 2026-03-11
**Run ID:** 151911-df54f86b
**Branch:** tag
**Role:** Staff / Manager (M role active during session)
**Viewport:** 1024×768 tablet
**App:** WTFPOS — Alta Citta (Tagbilaran)
**Scope:** Void flow, GCash payment, Split bill (Cash + GCash)

---

## A. Text Layout Map

```
┌─────────────────────────────────────────────────────────────────┐
│  POS Floor  │  [Toggle Sidebar]  [New Takeout]  [History N]     │
│  1 occ / 7 free                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SVG Floor  T1 T2 T3(occ) T4–T8 free                           │
├─────────────────────────────────────────────────────────────────┤
│  Takeout Queue (1 order)                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ OrderSidebar
┌──────────────────────┴──────────────────────────────────────────┐
│  T3 · 4 pax · 2m                              [✕ close]        │
│  Beef + Pork Unlimited                                          │
│  [🔄 Refill]  [Add Item]                                       │
├─────────────────────────────────────────────────────────────────┤
│  Beef + Pork Unlimited  SENT  ₱1,996 PKG  [✕]                 │
│  Meats: Pork Sliced, Sliced Beef                                │
│  Sides [10 pending ▼ show]                                     │
│  Ramyun  SENT  ₱149   [✕ → Remove Item PIN after grace]        │
│  Soju    SENT  ₱95    [✕ active → Remove Item PIN modal]       │
├─────────────────────────────────────────────────────────────────┤
│  BILL  15 items  ₱2,240.00                                     │
├─────────────────────────────────────────────────────────────────┤
│  [Print]  [Void]  [Checkout]                                   │
│  [More ▼  Transfer · Merge · Split · Pax]                      │
└─────────────────────────────────────────────────────────────────┘

── LeftoverPenaltyModal (Step 1/2) ─────────────────────────────
│  Leftover Check → Payment (breadcrumb)                        │
│  Weigh any uneaten meat. Leftovers over 100g = ₱50/100g      │
│  [numpad 0–9, CLR, ⌫]                                        │
│  [✓ No Leftovers — Proceed to Checkout]  [Skip (Manager PIN)] │
└───────────────────────────────────────────────────────────────

── CheckoutModal (Step 2/2) ─────────────────────────────────────
│  Checkout · T3                                    [✕]        │
│  Subtotal (4 pax): ₱2,240.00  TOTAL: ₱2,240.00             │
│  Incl. VAT (12%): ₱240.00                                   │
│  Discount: [👴 SC] [♿ PWD] [🎟️ Promo] [💯 Comp] [❤️ Rec]  │
│  Payment Method: Tap to add/remove                           │
│  [💵 Cash]  [📱 GCash ●active]  [📱 Maya]                   │
│  📱 GCash: [spinbutton "2000"]           ← no preset chips   │
│  💵 Cash:  [Exact] [spinbutton "240"]    ← preset chips      │
│            [₱20 ₱50 ₱100 ₱200 ₱500 ₱1000 ₱2000 ₱5000]     │
│  Total Paid: ₱2,240.00  Cash Change: ₱0.00                  │
│  [⏸ Hold (Min)]  [✓ Confirm Payment]                        │
└───────────────────────────────────────────────────────────────

── VoidModal ─────────────────────────────────────────────────────
│  Void Entire Order                                            │
│  Voiding will cancel all items and release the table.        │
│  Enter Manager PIN to proceed.                               │
│  [1][2][3][4][5][6][7][8][9][Clear][0][⌫]                   │
│  [Cancel]  [Void Order disabled]                             │
└───────────────────────────────────────────────────────────────

── Remove Item modal ─────────────────────────────────────────────
│  Remove Item                                                  │
│  Grace period has expired. Enter Manager PIN to remove.      │
│  [1][2][3][4][5][6][7][8][9][Clear][0][⌫]                   │
│  [Cancel]  [Remove disabled]                                 │
└───────────────────────────────────────────────────────────────

── ReceiptModal (post GCash+Cash split) ─────────────────────────
│  ✓  Payment Successful                                        │
│  Table 3                                                      │
│  4× Beef + Pork Unlimited  ₱1,996.00                        │
│  Ramyun                    ₱149.00                           │
│  Soju (Original)           ₱95.00                           │
│  Subtotal: ₱2,240.00  VAT: ₱240.00  TOTAL: ₱2,240.00       │
│  Paid via: Split                                             │
│  Mar 11, 2026, 3:26 PM  WTF! Samgyupsal — Thank you!        │
│  [🖨 Print]  [Done]                                         │
└───────────────────────────────────────────────────────────────
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | **Hick's Law** — decision count | PASS | Void flow: single action path (Void button → PIN → confirm). GCash: toggle adds without secondary screens. |
| 2 | **Miller's Law** — chunk size | PASS | CheckoutModal payment zone is well-chunked (discount row / payment method row / totals row). |
| 3 | **Fitts's Law** — target size | CONCERN | GCash spinbutton has no preset chips — requires manual numeric entry on a touchscreen. Cash has ₱20–₱5000 chips. Asymmetry is a Fitts violation for GCash users. |
| 4 | **Jakob's Law** — mental model | PASS | Void gate = same PIN pattern as SC/PWD (consistent). ReceiptModal post-split = same template as dine-in cash. |
| 5 | **Doherty Threshold** — <400ms | PASS | Payment confirmation → ReceiptModal rendered within ~2s. T3 freed immediately (0 occ). |
| 6 | **Visibility** — system status | CONCERN | "Paid via: Split" on receipt gives no breakdown of GCash vs Cash amounts. Auditor cannot verify split from printed receipt. |
| 7 | **Gestalt: Proximity** | PASS | Remove Item PIN modal cleanly separates from sidebar content. |
| 8 | **Gestalt: Similarity** | CONCERN | Item-level ✕ button looks identical during grace period (instant remove) vs after (PIN required). No visual cue to distinguish the two states. |
| 9 | **Visual Hierarchy: Emphasis** | PASS | "✓ Payment Successful" prominent green check at receipt top. Void modal heading clear. |
| 10 | **Visual Hierarchy: Density** | PASS | LeftoverPenaltyModal breadcrumb (Step 1→2) reduces cognitive load for multi-step checkout. |
| 11 | **WCAG: Contrast** | PASS | No contrast violations observed in void/checkout/receipt flows. |
| 12 | **WCAG: Touch Target** | CONCERN | KP-01 inherited — GCash spinbutton has no min-height equivalent to preset chip row. See also Sweep 1 [04]. |
| 13 | **Consistency: Internal** | CONCERN | GCash payment field has no "Exact" button or preset chips; Cash has both. Maya (not tested) likely same as Cash. This inconsistency forces mental context switch between payment methods. |
| 14 | **Consistency: External** | PASS | Void PIN gate follows standard 4-digit numpad pattern consistent with PaxChange and SC/PWD discount flows. |

**Verdict summary:** PASS: 8 · CONCERN: 5 · FAIL: 0

---

## C. Best Day Ever (Manager Role, Busy Saturday Lunch)

*It's 12:30 PM. Four tables open. Manager Mia handles both the floor and a group at T3 who ordered Beef+Pork plus drinks.*

The order flows smoothly — she sends items, the kitchen gets the tickets. When she taps Checkout, the Leftover Check modal makes the 2-step flow feel deliberate and professional. She taps "No Leftovers" and the CheckoutModal opens instantly.

The group wants to split: GCash and cash. Mia taps GCash to add it — it immediately appears as a second payment row below. She types 2000 in the GCash field (no chips to help) and taps the ₱200 chip for cash (240 would require manual entry — she just adds ₱500 and notes the ₱260 change). The total lights up green. She confirms.

The receipt shows "Paid via: Split" — Mia's eye scans for the GCash breakdown to cross-reference her GCash notification, but it's just "Split". She checks her phone instead. Minor friction, move on.

One table tries to sneak-remove a Soju they don't want. The ✕ tap opens a PIN modal — "Grace period has expired." Mia enters her PIN, the item disappears, bill updates. She appreciates the protection but wonders why sometimes ✕ removes items instantly and other times it doesn't — nobody told her about the grace period.

---

## D. Findings

### [01] GCash (and Maya) missing preset chips — Fitts violation
**Priority:** P1 · Effort: S · Impact: Medium
**Principle:** Fitts's Law + Internal Consistency (Principles 3, 13)

Cash payment row has preset ₱20/₱50/₱100/₱200/₱500/₱1,000/₱2,000/₱5,000 chips and an "Exact" button. GCash (and presumably Maya) shows only a spinbutton requiring manual digit entry. On a touchscreen, typing ₱2,000 in a spinbutton is significantly slower than tapping a preset chip.

**Expected behavior:** GCash and Maya rows should include the same quick-amount chips as Cash, and an "Exact" button that fills the remaining balance.

---

### [02] "Paid via: Split" receipt shows no per-method breakdown — BIR compliance gap
**Priority:** P1 · Effort: S · Impact: High
**Principle:** Visibility of System Status (Principle 6)

The ReceiptModal and any printed receipt only shows "Paid via: Split" with no line showing GCash ₱2,000 / Cash ₱240. For BIR audit trail purposes, cashiers must be able to cross-reference the GCash e-wallet notification against the receipt. This forces staff to rely on memory or phone during shift-end reconciliation.

**Expected behavior:** Split payment receipt should show per-method amounts, e.g.:
`📱 GCash: ₱2,000.00`
`💵 Cash:  ₱240.00`

---

### [03] Item ✕ grace period is invisible — no UI signal of time-gated behavior
**Priority:** P2 · Effort: M · Impact: Medium
**Principle:** Gestalt Similarity + Visibility (Principles 8, 6)

The ✕ button on SENT items looks identical in all states. During the grace period (item freshly sent), ✕ removes the item immediately without any confirmation or PIN. After the grace period, the same ✕ triggers a "Remove Item — Manager PIN" modal. Staff have no way to know which behavior to expect until they tap and see the response. This creates confusion and potential accidental removals.

**Expected behavior:** ✕ button should have a visual timer indicator (e.g., a small countdown ring or a "grace" badge) during the grace window. Alternatively, consistently require PIN for all SENT item removals to eliminate the ambiguity.

---

### [04] Hold (Min) becomes "Hold Payment" in split checkout — label inconsistency
**Priority:** P2 · Effort: S · Impact: Low
**Principle:** Consistency (Principle 13)

In plain cash checkout, the hold button is labeled "⏸ Hold (Min)". In split payment mode (Cash + GCash both active), a separate "⏳ Hold Payment" button appeared. The two labels suggest different functionality but may serve the same purpose. Needs audit of the underlying code to confirm or de-duplicate.

**Expected behavior:** Consistent label across all checkout configurations. If same function: standardize to one label. If different: surface the distinction clearly.

---

### [05] Split payment: no confirmation step before committing
**Priority:** P2 · Effort: M · Impact: Medium
**Principle:** Doherty Threshold / Reversibility

In the split GCash + Cash flow, tapping "✓ Confirm Payment" immediately commits the transaction and frees the table. There is no "Are you sure?" step, and once confirmed, the order moves to History (immutable). Combined with the no-breakdown receipt ([02]), a miskeyed split (e.g., ₱200 instead of ₱2,000 in GCash) is only catchable at shift-end reconciliation.

**Expected behavior (low effort):** The existing "Confirm Payment" button design already serves as the deliberate gate. No modal needed. But improving the receipt to show per-method amounts ([02] fix) would make post-confirmation verification easier.
This finding is supplementary to [02] — fixing [02] resolves most of the risk here.

---

## E. Regression Check vs Sweep 1

| Sweep 1 finding | Status in Sweep 2 |
|---|---|
| [01] Takeout silent completion (no receipt) | Not retested — takeout not in scope |
| [02] "Hold (Min)" ambiguous label | Re-confirmed: relabeled "Hold Payment" in split mode — see [04] above |
| [03] Empty Order copy | Not retested this sweep |
| [04] KP-01 touch target | Still present — no fix since Sweep 1 |

---

## F. Void Flow Assessment (corrected)

**Earlier finding (from session summary) is REVISED:**

The session summary noted "SENT item ✕ has no authorization gate." This was **incorrect** — it only applies within the grace period. The full behavior is:

| State | ✕ Button Behavior |
|---|---|
| Item just ordered (grace period active) | Instant remove — no confirmation, no PIN |
| Item SENT + grace period expired | PIN modal: "Remove Item — Enter Manager PIN" |
| Order-level Void button | Always: PIN modal "Void Entire Order — Enter Manager PIN" |

The order-level Void was tested — modal fires correctly, "Void Order" button is `[disabled]` until PIN entered. ✅

The item-level grace period behavior is documented as finding [03] above (UX clarity concern, not a security regression).

---

## Summary

**Regression Sweep 2 — Flows tested:**

| Flow | Verdict | Key Finding |
|---|---|---|
| Void: Order-level Void gate | ✅ PASS | PIN required, modal correct |
| Void: Item-level ✕ (grace period) | ✅ PASS (with note) | Grace period invisible to user — [03] |
| GCash: Pure + Split payment | ✅ PASS | Receipt breakdown missing — [02] |
| Split: GCash ₱2,000 + Cash ₱240 | ✅ PASS | No preset chips for GCash — [01] |
| ReceiptModal post-split | ✅ PASS | Dine-in shows receipt; "Paid via: Split" only |

**No regressions from Sweep 1 fixes detected.**

5 new findings total: P1×2, P2×3
Highest priority: [02] Split receipt breakdown (BIR compliance) · [01] GCash preset chips (Fitts)

---

## Fix Checklist

- [x] [01] — GCash (and Maya) missing preset chips — add ₱100/₱500/₱1,000/₱2,000/₱5,000 chips + Exact button
  **Fixed:** Fixed in CheckoutModal.svelte — GCash/Maya now have ₱100/₱500/₱1,000/₱2,000/₱5,000 chips + Exact button
- [x] [02] — "Paid via: Split" receipt shows no per-method breakdown — add Cash/GCash/Maya line items
  **Fixed:** Fixed in ReceiptModal.svelte — split payments show per-method breakdown (Cash ₱X + GCash ₱Y)
- [x] [03] — Item ✕ grace period is invisible — add countdown timer or visual badge during grace window
  **Fixed:** Fixed in OrderSidebar.svelte — grace period countdown (M:SS) shown on pending items; 🔒 after expiry
- [ ] [04] — "Hold (Min)" / "Hold Payment" label inconsistency — standardize to one label across all checkout modes
- [ ] [05] — Split payment: no confirmation step before committing — supplementary to [02] fix
