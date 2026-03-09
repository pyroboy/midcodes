# UX Audit — Special Flows: Pax/Child Pricing, Checkout SC/PWD, Merge Takeout, Split Receipts
**Date:** 2026-03-09
**Role:** Manager (Juan Reyes) + Staff lens
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024×768 tablet (landscape)
**Scope:** 6 targeted scenarios per user request

---

## A. Text Layout Map

```
POS FLOOR
┌─────────────────────────────────────┬──────────────────────────┐
│ POS  0occ  8free  [New Takeout] [History 4] │    No Table Selected     │
│                                     │  Green = available       │
│  [T1][T2][T3][T4]                   │  Orange = occupied       │
│  [T5][T6][T7][T8]                   │                          │
│                                     │                          │
│ ── TAKEOUT ORDERS (1) ──────────    │                          │
│  [#TO01 Carmen ₱995 PREP] [→ Mark Ready]                       │
└─────────────────────────────────────┴──────────────────────────┘

PAX MODAL (on table tap)
┌────────────────────────────────┐
│  How many guests for T1?       │
│  Capacity: 4                   │
│  [1][2][3][4]  ← active range  │
│  [5][6][7][8]  ← dimmed        │
│  [9][10][11][12] ← dimmed      │
│  Other (type number) [___][OK] │
│  [Cancel]                      │
└────────────────────────────────┘
  ⚠ NO age/child breakdown fields

CHECKOUT MODAL (T1)
┌────────────────────────────────────────┐
│  Checkout  T1                     [✕]  │
│  Subtotal (3 pax)          ₱1,197.00   │
│  VAT (inclusive)             ₱128.00   │
│  TOTAL                     ₱1,197.00   │  ← does not update after discount
│  ─────────────────────────────────     │
│  Discount:                             │
│  [👴 Senior Citizen (20%)] [♿ PWD (20%)]  ← no active highlight after PIN
│  [🎟️ Promo] [💯 Comp] [❤️ Service Rec]  │
│  ─────────────────────────────────     │
│  QUALIFYING PERSONS (PWD)          ← WRONG label (should say "Senior Citizen")
│  1 of 3 pax qualify for 20% discount  │
│  ID NUMBERS (REQUIRED TO CONFIRM CHECKOUT) ← header present
│  [no inputs rendered]              ← ID fields missing after PIN flow
│  Discount (1/3 pax × 20%)   -₱0.00    │
│  ─────────────────────────────────     │
│  PAYMENT METHOD          Tap to add/remove
│  [💵 Cash] [📱 GCash] [📱 Maya]        │
│  💵 Cash                    [Exact]    │
│  [     0     ]                         │
│  [₱20][₱50][₱100][₱200]               │
│  [₱500][₱1000][₱1500][₱2000]          │
│  Total Paid                  ₱0.00     │
│  [Cancel]       [✓ Confirm Payment]    │
└────────────────────────────────────────┘

MERGE TABLES MODAL
┌──────────────────────────────────────┐
│  ➕ Merge Tables                 [✕] │
│  Select another occupied table to    │
│  merge with T1. The items from both  │
│  tables will be combined into one    │
│  bill.                               │
│  😕 No tables available to merge    │
│  All other tables in this location   │
│  are available or don't have active  │
│  orders.                             │
│  [Cancel]                            │
└──────────────────────────────────────┘
  ⚠ Takeout order "Carmen" NOT listed — takeout-to-table merge absent

SPLIT BILL MODAL — Step 1 (Choose)
┌──────────────────────────────────────┐
│  ✂️ Split Bill              [✕]      │
│  Bill Total              ₱1,126.00  │
│  SPLIT METHOD                        │
│  [⚖️ Equal Split | 📋 By Item]      │
│  HOW MANY WAYS?                      │
│  [2] [3] [4] [5] [6] [8]           │
│  "Each guest pays ₱563.00"          │
│  [Cancel]       [Continue →]         │
└──────────────────────────────────────┘

SPLIT PAYMENT MODAL — Step 3
┌──────────────────────────────────────┐
│  💳 Split Payment         0/2 paid  │
│  [Guest 1·₱563] [Guest 2·₱563]     │
│  Guest 1              ₱563.00       │
│  [💵 Cash] [📱 GCash] [💳 Card]   │  ← Card not Maya — inconsistency
│  [₱50][₱100][₱200][₱500]...        │
│  [₱1000][₱1500][₱2000][Exact]      │
│  [     563     ]                    │
│  Change                  ₱0.00      │
│  [Cancel Split]   [✓ Pay Guest 1]  │
└──────────────────────────────────────┘

AFTER PAYING GUEST 1 (premature):
┌──────────────────────────────────────┐
│  💳 Split Payment         1/2 paid  │  ← shows 1/2 paid
│  [✓ Guest 1·₱563] [Guest 2·₱563]  │
│           ✅ All sub-bills paid!    │  ← BUG: only 1/2 paid
│  [Done]                             │  ← exits with order still open
└──────────────────────────────────────┘
```

---

## B. 14-Principle Assessment

| # | Principle | Finding | Verdict |
|---|---|---|---|
| 1 | **Hick's Law** | PaxModal: 12 choices at once, child age tiers not surfaced as a separate decision. Checkout discount section has 5 options — reasonable. Split flow has 2 methods + 6 counts — manageable. | PASS |
| 2 | **Miller's Law** | Checkout modal has ~7 distinct zones but they stack vertically in one scroll panel, risk if senior section + payment both visible. No chunking between zones beyond thin borders. | CONCERN |
| 3 | **Fitts's Law** | Primary CTAs (Checkout green, Pay Guest, Continue) are large, full-width, at bottom — correct. SC/PWD ± stepper buttons are only 32×32px — below 44px minimum. | CONCERN |
| 4 | **Jakob's Law** | POS, split, checkout follow standard tablet POS patterns. "Merge" expected to include takeout orders — it does not, violating user mental model. | CONCERN |
| 5 | **Tesler's Law** | Child pricing complexity shoved onto staff with zero system support — staff must mentally calculate and negotiate, a high-friction case of the system exporting complexity to the human. | FAIL |
| 6 | **Doherty Threshold** | After PIN for SC discount: UI renders blank ID section. No loading state — looks broken. Split payment "All paid!" flashes before data is consistent — feels laggy/wrong. | FAIL |
| 7 | **Goal-Gradient Effect** | Split bill has a good 3-step flow with visible progress (0/2 paid counter). Checkout has no step indicator — user doesn't know if SC form is required before payment. | CONCERN |
| 8 | **Serial Position** | In checkout discount row, Senior Citizen (most used) is first — good. In More menu, Split Bill is buried in row 2 — should be row 1 alongside Void/Checkout. | CONCERN |
| 9 | **Visibility of Status** | SC discount active state: button NOT highlighted green, section label wrong ("PWD" instead of "Senior"). Discount value shows -₱0.00. System status is invisible. | FAIL |
| 10 | **Match System/World** | "Merge Tables" description says "another occupied table" — real world: a takeout order is just another bill. Staff expect to be able to attach Carmen's takeout to T1 here. Language creates wrong expectation. | FAIL |
| 11 | **Error Prevention** | Split bill allows "Done" when only 1/2 guests paid. Checkout allows "Confirm" while SC form is incomplete but shows grayed button — good. But the incomplete SC section isn't surfaced until scroll. | CONCERN |
| 12 | **WCAG — Contrast** | Discount buttons in inactive state: gray text on white border — acceptable. `status-green` on white for "SENT" badge: 3.5:1, below AA for small text. | CONCERN |
| 13 | **Consistency** | Main checkout uses Maya. Split payment uses Card. These are different payment ecosystems — one is wrong. Written labels for actions are clear throughout (Refill, Add Item, Checkout, Void). | CONCERN |
| 14 | **Context Preservation** | After split "Done", order sidebar closes to "No Table Selected" — user loses context. Receipt not shown. Table still occupied. Must re-tap table to verify state. | FAIL |

**Verdicts:** 5 FAIL · 6 CONCERN · 3 PASS

---

## C. Best Day Ever — Staff Perspective (Maria, busy Friday night)

> Maria opens T3 for a family of 4: mom, dad, lola (senior), and 8-year-old kid. She picks Pork Unlimited. The modal asks "How many guests?" — she types 4. Done. No way to mark that lola is SC or that the kid should be ₱350, not ₱399. She just guesses and charges the full adult rate. Lola asks for her senior discount at checkout. Maria applies it — the system asks for a PIN, she gets the manager, manager enters 1234. But nothing happens visually. She taps the button again (maybe it didn't register?). The section title says "PWD" instead of "Senior" which confuses her. There's no ID field showing. She's stuck. She calls the manager again. The manager notices the field is broken. They end up waiving it manually on a calculator and adjusting cash. Meanwhile the queue at the POS is backing up.
>
> Later, two friends at T1 want to split their bill. Maria hits "Split Bill" — smooth. She pays Guest 1. It shows "All sub-bills paid!" — but Guest 2 hasn't paid yet! She taps Done, confused. The table is still open. She re-taps T1 to check, the sidebar shows the order is still live. The split was incomplete. Now she doesn't know how to re-open the split or who paid what.

---

## D. Recommendations

### P0 — Fix Immediately (Blocking Real Transactions)

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P0-01 | **SC/PWD ID inputs not rendered after PIN flow** | `CheckoutModal.svelte:handlePinConfirmed()` | Add `discountIdsInput = Array.from({ length: discountPaxInput }, () => '')` inside `handlePinConfirmed()` before calling `recalcOrder` | S | High |
| P0-02 | **Split bill shows "All sub-bills paid!" after only Guest 1 pays** | `SplitBillModal.svelte:confirmPayment()` | After `paySubBill()`, wait for the order reactive update before checking `every(sb => sb.payment)`. Use `await` or move the post-payment navigation into a `$effect` that watches `order.subBills`. | M | High |
| P0-03 | **Merge Takeout to Table — feature not implemented** | `MergeTablesModal.svelte` + `pos/orders.svelte.ts` | Add a separate "Attach Takeout" flow (not the same modal) that lets staff select an active takeout order and move its items to the current dine-in table. Requires a new `mergeToTable(takeoutOrderId, tableOrderId)` store function. | L | High |
| P0-04 | **Child pricing (age 6-9 = ₱350/450/550, under 5 = free) — not implemented** | `PaxModal.svelte` + package pricing | Add age-breakdown fields to PaxModal: "Adults", "Children (6-9)", "Free (under 5)". Pass child/free counts to `checkoutOrder` to compute a mixed-rate AYCE price. | L | High |

### P1 — Fix This Week

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P1-01 | **Wrong label: "QUALIFYING PERSONS (PWD)" when Senior is active** | `CheckoutModal.svelte:275` | Change label to use `localDiscountType` not `order.discountType`: `{localDiscountType === 'senior' ? 'Senior Citizen' : 'PWD'}` | S | High |
| P1-02 | **Checkout TOTAL doesn't reflect discount immediately** | `CheckoutModal.svelte` bill header | The header reads `order.total` (reactive). If RxDB hasn't propagated, add an optimistic local total = `order.subtotal - localDiscountAmount`. Show local value while DB catches up. | M | High |
| P1-03 | **No separate receipts per sub-bill in split payment** | `SplitBillModal.svelte` + `ReceiptModal.svelte` | After each sub-bill payment, show a sub-receipt modal: guest label, their items/amount, payment method, change. Guest takes their receipt, staff proceeds to next guest. | M | High |
| P1-04 | **No SC/PWD photo ID capture** | `CheckoutModal.svelte` | Add optional photo capture button next to each ID input using `PhotoCapture.svelte` (already exists). Store as base64 in `discountIds` array or a separate `discountIdPhotos` field. | M | Med |
| P1-05 | **SC discount button shows no active/selected state after PIN** | `CheckoutModal.svelte` discount buttons | The `cn()` condition uses `order.discountType === discount.id` — change to `localDiscountType === discount.id` to reflect local state immediately. | S | High |

### P2 — Nice to Have

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P2-01 | **Split payment uses "Card" not "Maya"** | `SplitBillModal.svelte:343` | Replace `{ id: 'card', label: '💳 Card' }` with `{ id: 'maya', label: '📱 Maya' }` to match main checkout. | S | Med |
| P2-02 | **SC/PWD ± stepper buttons are 32×32px** | `CheckoutModal.svelte:291-297` | Change `h-8 w-8` to `h-10 w-10` (40px) minimum for touch compliance. | S | Low |
| P2-03 | **"No tables available to merge" doesn't mention takeout** | `MergeTablesModal.svelte:129` | Update empty state copy: "No occupied tables available. To add a takeout order to this table, use 'Attach Takeout' instead." (even as placeholder for future feature) | S | Med |
| P2-04 | **Split "Guest 1 / Guest 2" labels — no name entry** | `SplitBillModal.svelte` | Allow optional name edit per sub-bill in the choose step ("Guest 1" → editable "Kuya Mike"). | M | Low |
| P2-05 | **Context lost after split "Done"** | POS page `oncomplete` handler | After all sub-bills paid, keep the order sidebar open briefly with a "✅ Split complete" confirmation before closing. Show a combined receipt or ask if individual receipts needed. | M | Med |

---

## E. Code Locations for Each P0/P1 Fix

### P0-01 — Missing ID inputs after PIN
**File:** `src/lib/components/pos/CheckoutModal.svelte` line ~122
```svelte
function handlePinConfirmed() {
    showPinForDiscount = false;
    localDiscountType = pendingDiscountType;
    // ADD THIS: initialize discountIdsInput for the new type
    discountIdsInput = Array.from({ length: discountPaxInput }, (_, i) => discountIdsInput[i] ?? '');
    recalcOrder(order, { discountType: pendingDiscountType, discountPax: discountPaxInput, discountIds: [...discountIdsInput] });
    ...
}
```

### P0-02 — Split bill premature "All paid" state
**File:** `src/lib/components/pos/SplitBillModal.svelte` line ~67
The `confirmPayment()` reads `order.subBills` before the RxDB write propagates.
Fix: use `$effect` to watch sub-bill payment count and advance `activeSubBillId` reactively:
```svelte
$effect(() => {
    const paidCount = order.subBills?.filter(sb => sb.payment !== null).length ?? 0;
    if (step === 'pay' && paidCount > 0) {
        const next = order.subBills?.find(sb => sb.payment === null);
        if (next) {
            activeSubBillId = next.id;
            payMethod = 'cash';
            cashTendered = 0;
        }
    }
});
```

### P1-01 — Wrong discount label
**File:** `src/lib/components/pos/CheckoutModal.svelte` line ~281
```svelte
// Change from:
{order.discountType === 'senior' ? 'Senior Citizen' : 'PWD'}
// To:
{localDiscountType === 'senior' ? 'Senior Citizen' : 'PWD'}
```

### P1-05 — Discount button active state
**File:** `src/lib/components/pos/CheckoutModal.svelte` line ~241
```svelte
// Change from:
order.discountType === discount.id
// To:
localDiscountType === discount.id
```

---

## F. Feature Gap Summary

| Feature | Status | Severity |
|---|---|---|
| Merge Takeout order into Dine-in table bill | ❌ Not implemented | P0 |
| Child pricing (age 6-9 reduced AYCE rate) | ❌ Not implemented | P0 |
| Free AYCE for under-5 | ❌ Not implemented | P0 |
| SC/PWD deducted amount visible in checkout | ✅ Present (when ID fields work) | — |
| SC discount form submits with ID validation | ⚠️ Broken (ID inputs missing after PIN) | P0 |
| SC/PWD photo ID capture | ❌ Not implemented | P1 |
| Separate receipts per split-bill guest | ❌ Not implemented | P1 |
| Split bill completes all guests before "Done" | ⚠️ Broken (premature completion) | P0 |
| Written labels clarity for chaotic multi-staff | ✅ Generally clear | — |
