# UX Audit — Checkout + Receipt SC Calculations (Cashier & Kitchen Staff, Alta Citta)

**Date:** 2026-03-12
**Roles audited:** Staff (Maria Santos, cashier) · Kitchen Dispatch (Corazon Dela Cruz)
**Branch:** `tag` — Alta Citta (Tagbilaran)
**Flow:** Login → Open T1 (3 pax, 1 SC declared at pax modal) → Add Pork Unlimited pkg + Ramyun → Charge to KDS → Checkout → Leftover Check → Apply SC discount (Manager PIN) → Enter SC ID → Confirm Payment → Receipt modal
**Viewport:** 1024×768 tablet landscape
**Skill version:** v5.1.0

**Primary question answered:** Does the final receipt modal show the SC discount calculations?
**Answer: NO — the SC discount section is completely absent from the receipt.** Math is correct (total is ₱80 lower) but no label, no amount, no SC ID appears.

---

## A. Text Layout Map

### State 1 — Pax Modal (T1 opening, 3 adults, 1 SC declared)

```
┌────────────────────────────────────┐
│ How many guests for T1?            │
│ Capacity: 4           [ 3 total ]  │
│──────────────────────────────────  │
│ Adults      full price     [−][3][+]│
│ Children    ages 6–9       [−][0][+]│
│ Infants     under 5·free   [−][0][+]│
│── DISCOUNTS ────────────────────── │
│ Senior Citizen SC  up to 3  [−][1][+]│  ← SC pre-declared at table open
│ PWD            up to 2      [−][0][+]│
│──────────────────────────────────  │
│ [Cancel]         [Confirm]         │
└────────────────────────────────────┘
```

### State 2 — Checkout Modal (after Leftover Check passed)

```
┌───────────────────────────────────────────┐
│ Checkout  T1                          [✕] │
│─────────────────────────────────────────  │
│ Subtotal (3 pax)                ₱1,346    │  ← correct
│ Senior Citizen 20% (1 of 3 pax) [green]  │  ← label shown but no -₱80 amount here
│ Total Discount (1 applied)      −₱80.00  │  ← combined total only
│ TOTAL                          ₱1,266.00  │
│ Incl. VAT (12%):                  ₱96.00  │  ← WRONG: should say "VAT Exempt"
│─────────────────────────────────────────  │
│ [👴 Senior Citizen (20%)] [♿ PWD (20%)]  │  ← SC active (green)
│ [🎟️ Promo] [💯 Comp] [❤️ Service Rec]   │
│ ⏱ PIN grace: 56s remaining               │
│─────────────────────────────────────────  │
│ QUALIFYING PERSONS (SENIOR CITIZEN)       │
│ 1 of 3 pax qualify for 20% discount       │
│  [−][1][+]                                │
│ SC ID #1:  [ 1234567890          ]        │
│─────────────────────────────────────────  │
│ PAYMENT METHOD      Tap to add/remove     │
│ [💵 Cash ←active] [📱 GCash] [📱 Maya]   │
│ Cash: 1266   [Exact]                      │
│ [₱20][₱50][₱100][₱200][₱500][₱1K]…      │
│─────────────────────────────────────────  │
│ Total Paid              ₱1,266.00 [green] │
│─────────────────────────────────────────  │
│ [⏸ Hold for Manager]  [✓ Confirm Payment]│
└───────────────────────────────────────────┘
```

### State 3 — Receipt Modal (THE CRITICAL STATE — what cashier hands to SC customer)

```
┌───────────────────────────────────────┐
│    WTF! Samgyupsal — Alta Citta       │
│                  ✓                    │
│          Payment Successful           │
│              Table 1                  │
│   Ref: BXJVafzQYO_0A0-o5crtI         │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  monospace section
│ Pork Unlimited          ₱1,197.00    │
│ Ramyun                    ₱149.00    │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Subtotal                ₱1,346.00    │
│                                       │  ← SC DISCOUNT LINE MISSING HERE
│                                       │  ← SC ID MISSING HERE
│ Incl. VAT (12%)            ₱96.00    │  ← WRONG LABEL: should be "VAT (exempt)"
│ TOTAL                   ₱1,266.00    │  ← correct amount (math is right)
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Paid via                      Cash   │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│     Mar 12, 2026, 2:28 AM            │
│     WTF! Samgyupsal — Thank you!     │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ [🖨 Print]          [Done]           │
└───────────────────────────────────────┘
```

### State 4 — Kitchen Dispatch Board (Corazon Dela Cruz view)

```
┌─────────────────────────────────────────────────────────────┐
│ 📍 ALTA CITTA (TAGBILARAN)                      ● Live      │
│ [All Orders] [Dispatch ←active] [Weigh Station] [Stove]     │
│             [📋 Dispatch / Expo ←toggle]   [🔵 BT Scale]   │
│─────────────────────────────────────────────────────────────│
│ Setup                                                        │
│ T3 — Stage Utensils · 14m ago  [✓ Staged]                   │
│─────────────────────────────────────────────────────────────│
│ 📋 DISPATCH BOARD  1                                         │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ T1  3 pax  [1 SC]             [06:01 timer orange]  │     │  ← SC badge visible
│ │ Pork Unlimited                                       │     │
│ │  🥩 Meat    → Weigh Station            0/1 ⏳       │     │
│ │  🔍 Dishes  → Stove                    0/1 ⏳       │     │
│ │  🥬 Sides                              0/10 ⏳      │     │
│ │   Kimchi      [DONE]   Rice    [DONE]               │     │
│ │   Cheese      [DONE]   Lettuce [DONE]               │     │
│ │   Egg         [DONE]   Cucumber[DONE]               │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## B. 14-Principle Assessment

| # | Principle | Verdict | Observation |
|---|-----------|---------|-------------|
| 1 | **Hick's Law** (choice overload) | PASS | Pax modal, checkout, and KDS each present clear, bounded choices. No overload. |
| 2 | **Miller's Law** (7±2 chunks) | PASS | Receipt groups: items / totals / payment — well-chunked. |
| 3 | **Fitts's Law** (touch targets) | PASS | All buttons ≥44px. Checkout preset buttons (₱20–₱5K) are full-height. SC pax stepper uses 40×40 squares — borderline acceptable. |
| 4 | **Jakob's Law** (familiar patterns) | PASS | Receipt layout matches standard thermal receipt format. Discount-above-total is industry standard. |
| 5 | **Doherty Threshold** (feedback <400ms) | PASS | Manager PIN authorisation, SC pax stepper, "Exact" button all respond instantly. |
| 6 | **Visibility of System State** | FAIL | Receipt modal shows correct total but provides zero evidence of *why* the total is lower. A SC customer cannot verify their 20% entitlement. |
| 7 | **Gestalt: Proximity** | CONCERN | On receipt, the VAT line immediately follows Subtotal with no discount line between them — the gap where the discount should appear creates a confusing skip from ₱1,346 → ₱96 VAT → ₱1,266. |
| 8 | **Gestalt: Common Region** | PASS | Checkout SC pax+ID fields are grouped in a bordered region correctly separated from payment method. |
| 9 | **Visual Hierarchy: F-pattern** | CONCERN | Receipt: customer's eye scans Subtotal → [gap] → VAT → TOTAL. The biggest number change (−₱80 SC discount) is invisible. The BIR-required SC discount line should be the most prominent green line on the receipt. |
| 10 | **Visual Hierarchy: Emphasis** | FAIL | The checkout modal shows the SC breakdown clearly in green; the receipt strips it entirely. The two states contradict each other — cashier sees discount, customer does not. |
| 11 | **WCAG 2.1 AA: Contrast** | PASS | Text contrast meets requirements throughout. |
| 12 | **WCAG 2.1 AA: Target size** | PASS | Touch targets pass 44px minimum. |
| 13 | **Consistency: Internal** | FAIL | Checkout modal shows "VAT Exempt" label (when discountType is set) while the same checkout modal in the current `discountEntries` path shows "Incl. VAT (12%)". Receipt also says "Incl. VAT (12%)" regardless. Three screens, three inconsistent states. |
| 14 | **Consistency: External** | FAIL | BIR regulations require SC/PWD discounts, ID numbers, and VAT-exempt status to appear on official receipts. The current receipt fails external compliance requirements. |

---

## C. Best Day Ever — Staff Perspective

Maria Santos opens Table 1 for an elderly couple and their adult child. She notes the grandmother is a Senior Citizen and dutifully records 1 SC at pax entry. Later when cashing out, she asks the manager to authorize the SC discount, carefully enters the grandmother's SC ID number, and clicks Confirm Payment. The receipt prints. The grandmother squints at it. "Nasaan ang 20% ko?" — "Where's my 20%?" Maria stares at the receipt. The total is right, ₱1,266. But there's no discount line. She can't explain it. She calls the manager over. A queue forms behind them.

Meanwhile in the kitchen, Corazon sees the "1 SC" badge on the T1 ticket — she knows to be extra patient with table service for this table. That part works well. The problem lives entirely at the end of the transaction, on the one piece of paper the customer takes home.

---

## D. Recommendations

```
[01] Receipt modal missing SC/PWD discount line
```
**What:** When an SC discount is applied via the `discountEntries` path (all checkouts since this feature shipped), `ReceiptModal.svelte` renders no discount line, no pax breakdown, and no SC ID numbers. The customer receipt looks identical to a non-discounted receipt except the total is lower.

**How to reproduce:** Open any table → add pax with ≥1 SC declared → add any package → checkout → apply Senior Citizen (20%) → enter SC ID → Confirm Payment → observe receipt modal.

**Why this breaks:** `ReceiptModal` guards the entire discount section with `{#if order.discountType !== 'none'}` (line 149) and `discountLabel` with `if (!order || order.discountType === 'none') return ''` (line 64). But `recalcOrder` in `orders.svelte.ts` (line 219) only sets `doc.discountType` from `overrides.discountType` — and `CheckoutModal` calls `recalcWithEntries()` which passes only `discountEntries`, never `discountType`. So `discountType` stays `'none'` on the persisted document throughout.

**Ideal flow:** Receipt shows green line "Senior Citizen (20%) — 1 of 3 pax → −₱80.00", SC ID number below it in monospace, and VAT line reads "VAT (exempt)" for the qualifying portion.

**The staff story:** Maria correctly processed the SC discount. The receipt she hands the customer is legally and visually wrong. In a BIR audit, this receipt would not satisfy SC discount documentation requirements.

---

```
[02] VAT label says "Incl. VAT (12%)" on SC receipt (wrong label, correct math)
```
**What:** When an SC discount is applied via `discountEntries`, both the Checkout modal summary (line 380) and the Receipt modal (line 164) show "Incl. VAT (12%)" instead of "VAT (exempt)". The VAT *amount* is calculated correctly (only on the non-SC share), but the label is misleading.

**How to reproduce:** Same as [01]. In Checkout, look at the small gray line below TOTAL. In Receipt, look at the line between Subtotal and TOTAL.

**Why this breaks:** Both views check `order.discountType === 'senior' || order.discountType === 'pwd'` (legacy path only). Since `discountType` stays `'none'` (same root cause as [01]), the ternary always falls to the wrong branch.

**Ideal flow:** Label reads "VAT (exempt for SC)" or "VAT (non-SC portion only)" — some label that communicates the partial exemption clearly.

**The staff story:** Corazon's colleague at the register knows the VAT should be exempt for SC guests. When she sees "Incl. VAT (12%)" in the checkout total summary, she second-guesses whether the SC discount was actually applied. She taps it again by accident, triggering a second PIN flow.

---

```
[03] SC ID numbers absent from receipt (BIR audit trail broken)
```
**What:** The SC ID numbers entered by the cashier during checkout are not printed on the receipt modal at all. The `discountIds` derivation in `ReceiptModal` (line 75–87) reads `order.discountEntries` entries, but is never reached because the parent `{#if order.discountType !== 'none'}` (line 149) blocks the entire block from rendering.

**How to reproduce:** Same as [01] — enter any value in SC ID #1 field → Confirm → observe receipt has no ID reference.

**Why this breaks:** Even if the guard on line 149 were fixed, `discountIds` (line 75) would correctly read from `order.discountEntries[type].ids`. But the `order` snapshot passed to ReceiptModal is built at `finalizeCheckout` time from local state — and `order.discountEntries` correctly contains the SC entry at that moment. The guard is the only blocker.

**Ideal flow:** Receipt shows: `SC ID 1: 1234567890` in monospace font below the discount line.

**The staff story:** A BIR auditor requests documentation for the SC discount applied to Table 1. The receipt has no SC ID. The cashier has to go back into the order history and hope the `discountEntries` field is still retrievable. This is a compliance failure that exposes the business to penalties.

---

```
[04] Checkout discount entry lines show label but no per-type amount
```
**What:** When `discountEntries` path is active in the Checkout modal, each discount type shows its label (e.g. "Senior Citizen 20% (1 of 3 pax)") without an individual amount. Only the combined "Total Discount (1 applied): −₱80.00" line shows the peso figure.

**How to reproduce:** Apply SC discount in checkout. Look at the section between Subtotal and TOTAL.

**Why this breaks:** `CheckoutModal.svelte` lines 354–363: each `{#each Object.entries(order.discountEntries)}` renders only the label div — no peso amount. The total is shown below at line 365, but if two discounts were active (SC + PWD), you'd see two label-only lines and one combined total — unclear how much each discount contributed.

**Ideal flow:** Each discount entry line shows the label and its individual contribution: `Senior Citizen 20% (1 of 3 pax)  −₱80.00`.

**The staff story:** A table has 2 SCs and 1 PWD. The checkout shows "Senior Citizen 20% (2 of 4 pax)" and "PWD 20% (1 of 4 pax)" but no individual amounts — only "Total Discount: −₱269.00". The cashier can't verify or explain the breakdown if asked.

---

```
[05] Kitchen SC badge visible on dispatch — this works well (no action needed)
```
**What:** The KDS dispatch card for T1 correctly shows "1 SC" as an orange badge next to the pax count. Kitchen staff can see at a glance that the table has Senior Citizen guests and adjust their service tempo.

**How to reproduce:** Kitchen Dispatch page → any table with SC declared → ticket header shows "X SC" badge.

**Why this works:** The KDS ticket stores `scCount` separately at ticket creation time (from the order's `scCount` field set at pax modal). This path is independent of `discountType`/`discountEntries`, so it works correctly.

**The staff story:** Corazon sees "1 SC" on the T1 card instantly. She tells the sides prep team to prioritize getting the softer dishes ready first. This is exactly the right behavior.

---

## Fix Checklist

- [ ] [01] `ReceiptModal.svelte` — change guard from `order.discountType !== 'none'` to also check `Object.keys(order.discountEntries ?? {}).length > 0`
- [ ] [01] `discountLabel` derived — add `discountEntries` branch to generate label text when `discountType === 'none'` but entries exist
- [ ] [02] `ReceiptModal.svelte` line 164 — update VAT label ternary to also check `discountEntries`
- [ ] [02] `CheckoutModal.svelte` line 380 — same fix for VAT label in checkout summary
- [ ] [03] Automatically resolved once [01] guard is fixed — `discountIds` derivation already reads from `discountEntries.ids`
- [ ] [04] `CheckoutModal.svelte` lines 354–363 — add per-entry amount to each discount label row

**Root cause (single fix unlocks [01], [02], [03]):** `recalcOrder` in `orders.svelte.ts` should derive and persist `discountType` from the `discountEntries` keys when `discountEntries` is set — or `ReceiptModal`/`CheckoutModal` guard logic must accept both paths.
