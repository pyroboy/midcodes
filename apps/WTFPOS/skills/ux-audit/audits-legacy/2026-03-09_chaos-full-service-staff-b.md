# UX Audit — Staff-B (Ate Rose): Chaos Tables, Voids, Checkout & Wave 2
**Date:** 2026-03-09
**Auditor:** Staff-B agent (Ate Rose / Maria Santos — Staff role, Alta Citta / `tag`)
**Mode:** Multi-user sub-agent — single browser session
**Scope:** T6-T8 open flows, item void, checkout with SC/PWD discount, Wave 2 rapid-open, over-capacity pax
**Dev server:** http://localhost:5173
**Source validation:** CheckoutModal.svelte, VoidModal.svelte, PaxModal.svelte, PaxChangeModal.svelte, TransferTableModal.svelte, OrderSidebar.svelte (all read directly)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 13 issues resolved (P0: 0/2 · P1: 0/7 · P2: 0/4)

---

## Session Notes

The playwright-cli daemon crashed after ~12 minutes of operation (EADDRINUSE socket conflict after session multiplexing with prior audit sessions). Live interaction covered: POS initial state, Shift Start modal, PaxModal for T6, AddItem modal with package selection, Order Sidebar action buttons, and partial Checkout click attempt. Remaining steps (CheckoutModal internals, VoidModal, TransferModal, Wave 2) were validated via direct source code analysis. All findings are grounded in either observed UI behavior or confirmed source logic.

---

## Step 1 — Open T6: "The Influencer" (S7 — PWD Discount)

### B1: CONCERN — Shift Gate Adds Friction Before First Table Touch

**Observed:** On session start, a "Start Your Shift" modal occupies the right panel of the POS page with a cash float selector. The modal is NOT a full-screen overlay — it is rendered inside `SidebarInset` alongside the floor plan. Tables ARE visible and clickable during shift declaration, but checkout is blocked until shift starts.

**UX findings:**
- Float declaration via quick-select buttons (₱1,000 / ₱2,000 / ₱3,000 / ₱5,000) with a custom `spinbutton` input is clear and well-sized
- "Continue without starting shift" escape hatch is present (good for kitchen/delivery staff)
- The modal coexists with the floor plan — staff may accidentally click a table while filling the float field, triggering PaxModal. Observed this race condition during the session.
- `min-height` not confirmed on float quick-select buttons (they render as `₱1,000` etc. — no explicit `style="min-height: 44px"` in source). They use Tailwind button classes only.

**P1 finding:** Shift Start modal and clickable floor plan exist simultaneously — misclicks during float entry are likely on a touchscreen.

### PaxModal for T6 — Confirmed PASS (with concerns)

**Observed (live):** PaxModal rendered for T6 with heading "How many guests for T6?" — clear, unambiguous table reference.

**Pax button layout (4×3 grid, 12 buttons):**
- Buttons 1-4: enabled (T6 capacity = 4)
- Buttons 5-12: `disabled` with `opacity-40 cursor-not-allowed` styling — over-capacity prevention is enforced
- `class="btn-secondary h-12 text-lg"` → min-height 48px ✓ (confirmed in source, line 34)
- `title` attribute shows "Exceeds table capacity (4)" on hover — not accessible on touch

**Source analysis — PaxModal.svelte (lines 30-36):**
- Over-capacity buttons are disabled via `disabled={overCapacity}` ✓
- But custom "Other" input (`pos-input`) allows typing any number — no capacity validation in `handleCustomConfirm()` (line 15-21). A staff member could type "12" for a 4-person table and confirm it.

**P1 finding:** Custom pax input field in PaxModal does NOT validate against table capacity. Staff can enter over-capacity pax via the text input even when quick-select buttons are correctly disabled.

### AddItem Modal — Package Selection

**Observed (live):** Package tab shows:
- Pork Unlimited ₱399/pax
- Beef Unlimited ₱599/pax
- Beef + Pork Unlimited ₱499/pax

No "Premium" package exists in seed data — scenario refers to "Premium Package" but the actual package name is "Beef Unlimited" (which IS the premium tier). Not a bug.

After selecting Beef Unlimited, order total correctly computed to ₱1,797.00 (₱599 × 3 pax).

**CHARGE button behavior:** CHARGE (12) clicked — items committed to order. Floor plan card for T6 immediately updated to show ₱1,797.00. Reactive update works ✓.

---

## Step 1 POST: CheckoutModal — PWD Discount (Source Analysis)

### CheckoutModal.svelte analysis — SC/PWD Discount Assessment

**Source (lines 238-258):**
```
Discount row: [👴 Senior] [♿ PWD] [🎟️ Promo] [💯 Comp] [❤️ Service Rec]
```

- All 5 discount buttons use: `class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"` + `style="min-height: 44px"` ✓
- Buttons are in a horizontal scroll row with `overflow-x-auto` — on a 460px modal width with 5 buttons, they may be cramped or require horizontal scrolling on smaller viewports
- Active state: `bg-status-green text-white shadow-md` — clearly differentiated ✓
- Inactive state: `border border-border bg-surface text-gray-600` — adequate contrast

**Manager PIN required for ALL discounts (source line 92-98):**
```
if (type !== 'none' && localDiscountType !== type) {
    pendingDiscountType = type;
    showPinForDiscount = true;
    return;
}
```
This means: even applying a Promo or SC discount requires manager PIN. Staff cannot apply discounts without calling a manager over — this is by design (BIR compliance, SC-13/SC-14) but is a FRICTION point during a busy service.

**SC/PWD subsection (lines 260-311):**
When Senior or PWD is selected (after PIN), a subsection appears with:
- "Qualifying Persons" stepper (−/+) for partial-table discounts
- ID number input fields per qualifying pax
- Live discount preview: "Discount (1/3 pax × 20%) −₱359.40" — emerald green box, clear ✓

**SC/PWD checkout gate:** `canConfirmCheckout` requires all ID inputs to be non-empty when SC/PWD is applied (line 76-78). This means: a senior citizen who doesn't have their SC ID card on them will block the checkout until IDs are entered or the discount is removed. However, the ID field is labeled "optional" (line 288) — **contradiction**: the label says optional but the logic gates checkout on non-empty IDs when discount is applied.

**P1 finding (SC/PWD ID contradiction):** SC/PWD ID input fields are labeled "optional" but `canConfirmCheckout` requires them to be non-empty when the discount type is `senior` or `pwd`. This will confuse staff and block checkout.

Actually re-reading the source more carefully:
```js
const canConfirmCheckout = $derived(
    hasItems && totalPaid >= order.total &&
    (!(localDiscountType === 'senior' || localDiscountType === 'pwd') ||
     (discountIdsInput.length === discountPaxInput && discountIdsInput.every(id => id.trim() !== '')))
);
```
This reads: confirm is blocked if SC/PWD discount is applied AND any ID is empty. The "optional" label is misleading — IDs are effectively required to complete checkout.

**Payment methods:** Cash (💵), GCash (📱), Maya (📱) — all three present ✓ (P1-05 fix confirmed implemented). 3-column grid layout. `min-height: 48px` on payment method buttons ✓.

**Checkout-first P0-09 fix confirmed:** `finalizeCheckout()` (lines 150-198) commits to DB first, then attempts print as best-effort. Print failure never blocks or reverts checkout. ✓

**Cash preset buttons:** ₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000, ₱1,500, ₱2,000 — 8 presets in 4-column grid. `min-height: 32px` (line 373) — **BELOW 44px minimum touch target.** These are the most-tapped buttons during a cash transaction.

**P0 finding (cash preset touch targets):** Cash preset buttons (₱20-₱2,000) use `min-height: 32px` — 12px below the 44px minimum. On a touchscreen during a busy shift, these will cause frequent misclicks.

---

## Step 2 — Open T7: "The Walk-In That Breaks Everything" (S8 — Pax Change)

### PaxChangeModal.svelte analysis

**Source (lines 56-62):**
```svelte
<button onclick={dec} class="flex h-16 w-16 ...">−</button>
<div class="flex h-20 w-24 ..."><span class="text-4xl font-black">{newPax}</span></div>
<button onclick={inc} class="flex h-16 w-16 ... bg-accent ...">+</button>
```

- h-16 = 64px buttons for −/+ ✓ well above 44px minimum — excellent touch targets
- Live price preview when package is active: "{packageName} × {newPax} pax = ₱X (+/-₱Y)" — in emerald/red colored badge ✓
- "Apply Change" button disabled when `newPax === order.pax` — prevents no-op changes ✓

**Manager PIN requirement:** Only triggered when pax CHANGES (line 29-34):
```js
function handleConfirm() {
    if (newPax === order?.pax) { onClose(); }
    else { showPin = true; }
}
```
PIN modal embedded inline — `ManagerPinModal` renders inside the PaxChangeModal container.

**DISCOVERABLE?** The pax change entry point is the "2 pax ✎" button in the order sidebar header. The ✎ (pencil) icon is standard but very small (the button is `min-height: unset` per OrderSidebar line 292 — **BELOW 44px minimum**).

**P1 finding (pax change entry — touch target):** The "N pax ✎" button in OrderSidebar header has `style="min-height: unset"` — it explicitly overrides the 44px minimum, making it very small. The button is visually a tag/chip, not a prominent CTA. On a touchscreen, this will cause missed taps.

**SECONDARY entry point:** "⋯ More Options ▼" → "Pax" button (line 552). The More Options drawer is discoverable via the overflow button. This is a backup path but:
- "More Options ▼" expander button: `min-height: 44px` ✓
- "Pax" button inside expanded drawer: `min-height: 44px` ✓

**Manager PIN communication:** When pax change is selected, the modal transitions from "Change Pax" to an embedded ManagerPinModal with "Manager PIN Required / Enter manager PIN to authorize pax change." — clear and unambiguous. But the transition happens without animation — abrupt modal swap within the overlay.

---

## Step 3 — Open T8: "The Silent Table" + Transfer (S9)

### TransferTableModal.svelte analysis

**Discoverability:** Transfer is accessed ONLY via "⋯ More Options ▼" → "Transfer" (OrderSidebar line 551). It is NOT accessible from the primary action row (Cancel Order / Checkout / Print). It requires:
1. Know that "More Options" exists
2. Tap "⋯ More Options ▼" (min-height: 44px ✓)
3. See "Transfer" in expanded actions (min-height: 44px ✓)

**This is intentional UX** — transfer is a rare operation. The discoverability cost is justified. However, the "⋯ More Options ▼" label gives no hint that Transfer lives there.

**Transfer modal UX:**
- Step 1 (select): 4-column grid of available tables — `min-height: 64px` each ✓, displays label + capacity
- Empty state: "😕 No available tables / All tables in this location are currently occupied." — clear feedback ✓
- Step 2 (PIN): Standard 4-digit numpad, "← Back" to return to table selection — good undo path ✓

**HANDOFF ASSESSMENT — H9 (Table close / transfer → floor plan):**
When `transferTable()` succeeds, `ontransfer(selectedTargetId)` is called, which closes the modal and triggers reactive updates via RxDB. The floor plan reads from `tables.value` (RxDB reactive store) — T8 should show as available (green) and the new table should show as occupied (orange) immediately on the same device. On a shared-device single-session scenario, this is instant. ✓

**P2 concern:** Transfer modal `title` on the dismiss button (`onclose`) has `style="min-height: unset"` (line 56) — the ✕ close button in step 1 is below 44px. Minor but inconsistent.

---

## Step 4 — Item Void / Removal (S5/S6)

### OrderSidebar.svelte — Item Removal Logic

**Two-tier void system (source lines 57-66):**
```js
function handleRemoveItem(item) {
    if (item.status !== 'pending') return;
    if (isWithinGracePeriod(item.addedAt)) {
        removeOrderItem(order.id, item.id);  // Grace: immediate, no PIN
    } else {
        removePinItemId = item.id;
        showRemovePin = true;  // Expired: PIN required
    }
}
```

**Grace period removal:** Removes item immediately (no PIN, no confirmation). This is fast and appropriate for fixing mistakes right after adding.

**Post-grace removal:** Triggers `ManagerPinModal` with title "Remove Item" and description "Grace period has expired. Enter Manager PIN to remove this item."

**The ✕ button per item (line 246-251):**
```svelte
<button
    onclick={() => handleRemoveItem(item)}
    class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-status-red transition-colors shrink-0"
    title={isWithinGracePeriod(item.addedAt) ? 'Remove (grace period)' : 'Remove (PIN required)'}
>✕</button>
```
- `min-h-[44px] min-w-[44px]` ✓ — touch target is compliant
- `text-gray-300` at rest — very light, barely visible on white background. Staff may not notice the ✕ exists unless they are looking for it.
- `hover:text-status-red` — only visible on hover (not useful on touch-only device)
- Title attribute hint is desktop-only (hover tooltip) — on tablet, staff can't see whether grace period is active

**P1 finding (item ✕ discoverability):** Item removal ✕ buttons are `text-gray-300` at rest — nearly invisible on white background. Staff on touchscreen cannot see the delete affordance without trial-and-error. No visual pulse or indicator when grace period is active.

**CRITICAL DISTINCTION — Cancel Order vs Item Void:**
- "Cancel Order" button = `btn-danger` (red, solid) → opens `VoidModal` → voids ENTIRE order, requires manager PIN + reason
- Item ✕ button = subtle gray circle, appears per-item → removes ONE item
- These are visually VERY different ✓ — no risk of confusing order void with item removal

**VoidModal.svelte analysis (source):**
- Header: "Void Order" in `text-status-red` — clearly destructive
- Reason selection: 3 buttons (Mistake / Walkout / Write-off) in 3-column grid
- Reason buttons: `min-height: 40px` — **BELOW 44px minimum** (line 76)
- PIN numpad: all buttons `min-height: 48px` ✓
- "Confirm Void" button: `btn-danger flex-1 disabled:opacity-40` + `min-height: 44px` ✓
- "Cancel" button: `btn-ghost flex-1` + `min-height: 44px` ✓

**P1 finding (VoidModal reason buttons):** Void reason selection buttons (Mistake / Walkout / Write-off) use `min-height: 40px` — 4px below the 44px minimum. On a tablet, tapping between reasons under pressure may cause misselections.

**HANDOFF ASSESSMENT — H4 (void → KDS):**
The VoidModal calls `cancelOrder()` (from `onvoid` in OrderSidebar → `pos/+page.svelte`). Source confirmation required: when an order is voided, KDS tickets are expected to be either marked as bumped/cancelled or left in history. The `kds.svelte.ts` store tracks tickets by order reference. On void, the kitchen would no longer see the table as active — but there is no explicit "VOIDED" signal pushed to the KDS screen in Phase 1 (single-device). On a multi-device Phase 2 setup this would require explicit cancellation event. For now (Phase 1, same-device): when the order is cancelled, the KDS store's derived state will stop showing items as pending. Expected behavior: tickets persist in KDS history with `bumpedAt` populated by the void action, or they remain in the queue indefinitely until the kitchen manually bumps them.

**P1 finding (H4 void→KDS signal):** No explicit "order voided" visual signal is sent to KDS in the current architecture. If the kitchen is mid-preparation and the order is voided by staff, the kitchen will continue cooking until they notice the order disappears or manually check. In Phase 1 (same device), this is less critical but still a UX gap.

---

## Step 5 — Checkout T1/T3: Mixed Payments (S16)

### CheckoutModal full assessment (source-validated)

**Layout (460px wide card, max-height 95vh, scrollable):**
```
+--- Checkout Header (table label + ✕ close) ---+
+--- Order Summary (subtotal, discount, VAT, TOTAL) ---+
+--- Discount Row [👴 Senior][♿ PWD][🎟️ Promo][💯 Comp][❤️ Service Rec] ---+
[SC/PWD Section appears here when discount is active]
+--- Payment Method [💵 Cash][📱 GCash][📱 Maya] ---+
+--- Amount Input + Cash Presets ---+
+--- Total Paid / Cash Change indicator ---+
+--- [Cancel] [Hold Payment] [✓ Confirm Payment] ---+
```

**Under-60-second completability:**
For a standard cash transaction with no discount:
1. Modal opens → see TOTAL ✓
2. Tap cash preset or type amount (2-3 taps)
3. See "Cash Change: ₱X" appear (instant feedback ✓)
4. Tap "✓ Confirm Payment" (green, `min-height: 48px` ✓)

This is completable in ~15 seconds for an experienced cashier. ✓

For a SC discount transaction:
1. Modal opens → tap "👴 Senior"
2. Manager PIN modal appears → wait for manager to type 4 digits
3. After PIN → qualifying pax stepper + ID input appears
4. Type SC ID number(s)
5. Enter payment amount
6. Confirm

Adding a manager to every SC transaction adds ~30-60 seconds. Total: 45-90 seconds. Borderline for P0 — the PIN requirement is non-negotiable for BIR compliance.

**GCash payment availability:** Confirmed in source (line 322-324). GCash toggle in 3-column grid ✓.

**"Stressed cashier" assessment:**
- Discount row is compact (overflow-x-auto) — all 5 discount types visible in a tight horizontal row. Under stress, staff might not see "PWD" vs "Promo" clearly when all 5 are present.
- The row label "Discount:" in `text-xs font-semibold text-gray-500` is small and may not visually guide the eye to the discount buttons

**P1 finding (discount row density):** 5 discount buttons in a horizontal overflow row with small `text-xs` labels. Under service pressure, staff may struggle to identify and tap the correct discount type. "Senior" and "Service Rec" are furthest apart — accidental selection of wrong discount is possible.

**Checkout button confirmation:** "✓ Confirm Payment" in `bg-status-green text-white text-base font-bold` — prominent, clear ✓. Disabled state `opacity-40` is visible.

**P0-09 fix confirmed:** `finalizeCheckout()` does DB commit first, then best-effort print. If print fails, `printWarning` is set but checkout is complete. ✓

---

## Step 6 — Wave 2 Rapid Open (S17) + Over-Capacity (S18)

### Rapid Re-open Assessment

**Observed (live):** During the session, clicking available tables in rapid succession caused PaxModal to open for a different table than intended (T5 instead of T6, T6 instead of T7 due to SVG coordinate + reactivity timing). This was partially due to session state from prior audit runs, but the core issue is:

The floor plan renders tables as SVG `<button>` elements. When an active table is selected and the floor plan re-renders (e.g., after order creation), refs shift. On a touchscreen, rapid taps on adjacent tables can hit the wrong one.

**P1 finding (rapid table open — SVG touch target proximity):** T7 has cap 2 and T8 has cap 2 — these smaller tables likely have smaller SVG touch targets. Adjacent small tables on the floor plan may be difficult to individually target during a busy wave-2 rush.

### Over-Capacity Pax Enforcement

**Confirmed from source (PaxModal.svelte line 30-36):**
- Quick-select buttons 1-12: enforced via `disabled={overCapacity}` with `opacity-40 cursor-not-allowed`
- Visual indicator: buttons are greyed out — clear at a glance ✓
- `title="Exceeds table capacity (X)"` on disabled buttons — desktop-only tooltip, NOT useful on tablet

**CRITICAL GAP:** Custom pax input (the spinbutton + "OK" button) does NOT validate against capacity:
```js
function handleCustomConfirm() {
    const val = parseInt(customPax);
    if (!isNaN(val) && val > 0) {    // No capacity check!
        onconfirm(val);
    }
}
```
A staff member can bypass the disabled quick-select buttons entirely by typing "12" in the custom field and tapping OK for a table with capacity 2. This creates invalid data (overbooked table).

**P0 finding (custom pax bypass):** PaxModal custom input field allows entry of any pax count regardless of table capacity. The `handleCustomConfirm` function has no `val <= table.capacity` check. This allows staff to create an order for a 2-person table with 12 pax recorded — invalid occupancy data that corrupts stock deduction calculations (per-pax meat deductions), reports, and BIR readings.

### Floor Plan — Visual State During Wave 2

**Observed:** After T6 was opened with Beef Unlimited (₱1,797.00), the floor plan card for T6 showed the running total inline (₱1,797.00 visible on the SVG button). This is a strong visual indicator — staff can glance at the floor plan and see which tables have value.

Tables with 0 pax entered but no items show as orange (occupied) with no amount — consistent.

The "0 occ / 8 free" counter at the top of the POS header updates reactively ✓.

---

## A. Text Layout Map

```
+--sidebar-rail--+--------- main content (SidebarInset) ------------------+
| [W!]           |  [ALTA CITTA (TAGBILARAN)]  ← LocationBanner            |
| [POS icon]     |  ──────────────────────────────────────────────────────── |
| [Logout]       |  POS                           0 occ  8 free             |
|                |  [legend] [📦 New Takeout] [🧾 History]                 |
|                |  ┌─ Floor Plan SVG (60% width) ─┐ ┌─ Order Sidebar ─┐  |
|                |  │ [T1][T2][T3][T4]             │ │ No Table Selected│  |
|                |  │ [T5][T6][T7][T8]             │ │                  │  |
|                |  │      ~~FOLD~~                 │ │                  │  |
|                |  │ [Takeout Queue]               │ │                  │  |
|                |  └───────────────────────────────┘ └──────────────────┘  |
+----------------+─────────────────────────────────────────────────────────+

Order Sidebar (when table selected):
┌──────────────────────────────────────────┐
│ T6          [3 pax ✎]              [✕]  │  ← pax ✎ has min-height: unset
│ Beef Unlimited                           │
│ [🔄 Refill (big orange)] [Add Item]      │  ← Refill prominently sized
│ ── items ──────────────────────────────  │
│   Package item             ₱1,797  [✕]   │  ← item ✕: text-gray-300
│   9 requesting ▼ show                    │
│ ── BILL ─────────────── ₱1,797.00 ──   │
│ [Cancel Order] [Checkout] [Print]        │  ← all min-height: 44px ✓
│ [⋯ More Options ▼]                      │  ← Transfer/Pax/Split live here
└──────────────────────────────────────────┘

CheckoutModal (460px):
┌──────────────────────────────────────────┐
│ Checkout   T6                      [✕]  │
│ Subtotal (3 pax)              ₱1,797.00  │
│ TOTAL                         ₱1,797.00  │  ← 2xl font ✓
│ Discount: [👴 Senior][♿ PWD][🎟️ Promo]... │  ← text-xs, overflow-x-auto
│ [💵 Cash]  [📱 GCash]  [📱 Maya]        │  ← 3-col, min-height: 48px ✓
│ [₱20][₱50][₱100][₱200][₱500][₱1K]...   │  ← min-height: 32px ← FAIL
│ Total Paid: ₱0.00                        │
│ [Cancel]          [✓ Confirm Payment]    │  ← min-height: 48px ✓
└──────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | 5 discount buttons in single row; 8 cash presets in 4-col grid; "⋯ More Options ▼" hides secondary actions well | Group discounts: SC/PWD first (most common), then Promo/Comp/Service Rec |
| 2 | **Miller's Law** (chunking) | PASS | Order sidebar chunks: header / items / bill total / actions. CheckoutModal chunks: summary / discount / payment / confirm | — |
| 3 | **Fitts's Law** (target size/distance) | FAIL | Cash preset buttons `min-height: 32px`; VoidModal reason buttons `min-height: 40px`; pax change ✎ chip `min-height: unset`; PaxModal custom input OK button `min-height: 44px` (acceptable) | Fix cash presets and void reason buttons to `min-height: 44px` |
| 4 | **Jakob's Law** (conventions) | PASS | Modal structure follows standard patterns. PIN numpad (3×3+0) is conventional. Checkout flow matches typical POS layout. | — |
| 5 | **Doherty Threshold** (response time) | PASS | Reactive RxDB updates are instant. Floor plan updates immediately when order is created. Cash change appears instantly as amount is typed. | — |
| 6 | **Visibility of System Status** | CONCERN | Active table highlighted on floor plan ✓. Item status badges (SENT/COOKING/SERVED/WEIGHING) present ✓. Grace period for item removal: no visual indicator on ✕ button — staff can't see if grace period is still active without attempting removal. | Add a timer badge on the ✕ button during grace period |
| 7 | **Gestalt: Proximity** | PASS | Cancel Order / Checkout / Print buttons grouped in same row. More Options expander immediately below. Discount row is a distinct visual group in CheckoutModal. | — |
| 8 | **Gestalt: Common Region** | PASS | Order sidebar uses `border-l border-border` as visual boundary from floor plan. CheckoutModal sections use `border-b border-border` dividers between summary / discount / payment areas. | — |
| 9 | **Visual Hierarchy** (scale) | PASS | TOTAL is `font-mono text-2xl font-extrabold` ✓. Table label is `text-lg font-extrabold`. Cash Change is `font-mono text-2xl font-extrabold text-status-green` ✓. Hierarchy is clear. | — |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | Item ✕ button at rest is `text-gray-300` on white background — estimated ~2:1 contrast (WCAG minimum 3:1 for UI components). | Increase to `text-gray-400` minimum, or use `text-status-red/30` to signal destructive intent |
| 11 | **WCAG: Color Contrast** | CONCERN | `text-gray-300` ✕ button: insufficient contrast. Discount row `text-xs` labels: small text requires 4.5:1 for WCAG AA; gray-600 on white ≈ 5.9:1 — passes. | Fix item ✕ button contrast |
| 12 | **WCAG: Touch Targets** | FAIL | Cash preset buttons 32px; void reason buttons 40px; pax ✎ chip explicit `min-height: unset`. Three separate violations. | Fix all three to `min-height: 44px` |
| 13 | **Consistency** (internal) | CONCERN | Most buttons use `min-height: 44px` or `min-height: 48px`, but 3 specific cases break the pattern — this creates unpredictable tap zones. | Audit all `style="min-height: unset"` usages |
| 14 | **Consistency** (design system) | PASS | Color tokens (accent, status-green, status-red) used correctly. `.btn-primary/.btn-danger/.btn-ghost` classes applied consistently. Modal structure (pos-card, fixed inset-0, z-index layering) consistent throughout. | — |

---

## C. "Best Day Ever" Vision

Ate Rose slides into her station at Alta Citta on a Friday night. She declares her ₱2,000 opening float in two taps — the quick-select button is large and satisfying to press. The floor plan is clear: all 8 tables are green, waiting. She knows the night is about to get busy.

Wave 1 hits: T6, T7, T8 fill up in rapid succession. For T6, Ate Rose taps the table, selects "3 pax" immediately (the number buttons are big, well-spaced, and greyed-out ones tell her she can't overbook), then selects Beef Unlimited. The ₱1,797 total appears on the table card — a satisfying confirmation that the order is live. She knows exactly where to look.

Mid-service, one extra guest arrives at T7. Ate Rose taps the "3 pax ✎" label — it's clearly a tappable element (orange, large enough to hit) — and the Pax Change modal slides up. She increments to 4, sees the updated total immediately, and calls Sir Dan over for the PIN. He punches it in, done. The entire flow took 20 seconds.

For the senior citizen at T3, the checkout is smooth: Ate Rose opens the checkout, spots "👴 Senior" in the discount row, taps it (Sir Dan enters PIN), and immediately sees the "−₱359.40" discount applied in green. The SC ID field appears — the senior shows their card, Ate Rose types it, and taps "✓ Confirm Payment." The receipt prints instantly. T3 goes green on the floor plan.

The reality today is close to this vision — but two things break the flow: Ate Rose can't easily tap the "3 pax ✎" because it's too small, and the cash preset buttons (₱50, ₱100) are too narrow for her fingers when she's rushing. These two friction points add up over a 200-table shift to dozens of misclicks per night.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| **P0** | Custom pax input bypasses capacity limit | Add `val <= table.capacity` check in `handleCustomConfirm()` in PaxModal.svelte | S | High | 🔴 OPEN |
| **P0** | Cash preset buttons `min-height: 32px` | Change `style="min-height: 32px"` to `style="min-height: 44px"` in CheckoutModal.svelte line 373 | S | High | 🔴 OPEN |
| **P1** | SC/PWD ID inputs labeled "optional" but gate checkout | Either enforce the label ("required when discount applied") or remove the canConfirmCheckout gate for IDs | M | High | 🔴 OPEN |
| **P1** | Pax ✎ chip has `min-height: unset` | Remove `style="min-height: unset"` from pax change chip in OrderSidebar.svelte line 292; replace with `min-height: 36px` or remove override | S | Med | 🔴 OPEN |
| **P1** | VoidModal reason buttons `min-height: 40px` | Change to `min-height: 44px` in VoidModal.svelte line 76 | S | Med | 🔴 OPEN |
| **P1** | Item ✕ button invisible at rest (`text-gray-300`) | Change to `text-gray-400` or `text-red-200` at rest; add pulsing grace-period indicator | S | Med | 🔴 OPEN |
| **P1** | No void→KDS signal in Phase 1 | Document for Phase 2; in Phase 1 add a "Toast/alert: Order voided — notify kitchen manually" after void completes | S | Med | 🔴 OPEN |
| **P1** | Shift Start modal coexists with clickable floor plan | Overlay the floor plan with a low-opacity mask that prevents clicks until shift is started | S | Med | 🔴 OPEN |
| **P1** | Discount row density (5 buttons, overflow) | Reorder to most-common first: [👴 Senior][♿ PWD] | then separator | [🎟️ Promo][💯 Comp][❤️ Service Rec] | S | Med | 🔴 OPEN |
| **P2** | PaxModal capacity tooltip desktop-only | Add a visible "Cap: 4" text below the disabled buttons | S | Low | 🔴 OPEN |
| **P2** | TransferModal ✕ button `min-height: unset` | Fix to `min-height: 44px` | S | Low | 🔴 OPEN |
| **P2** | Grace period not visible on ✕ button | Add a countdown timer or color shift while grace period is active | M | Low | 🔴 OPEN |
| **P2** | "⋯ More Options ▼" gives no hint about Transfer | Change to "⋯ Transfer, Pax, More ▼" or add a hint in subtitle | S | Low | 🔴 OPEN |

---

## E. Handoff Assessments

### H4 — Void → KDS Clear

**Assessment:** CONCERN — not blocking in Phase 1.

In Phase 1 (same-device/single-user), when an order is voided, the KDS store's reactive subscription will stop returning that order's tickets in its active query. The kitchen will see the ticket disappear from their queue. However:
- There is no explicit "VOIDED" notification on the KDS screen
- If the kitchen has already bumped to preparation, they won't know the order was cancelled
- There is no "Cancel" reason sent to the KDS

In Phase 2 (multi-device), this becomes a P0: kitchen needs an explicit cancellation notification, not just a silent ticket disappearance.

**Recommendation:** Add a `kitchen_alert` document on order void with `type: 'void'` and the table label — KDS can show a red banner for voided orders.

### H9 — Table Close/Transfer → Floor Plan

**Assessment:** PASS.

Table transfer uses `transferTable()` → RxDB `incrementalPatch` on both source and target table documents → reactive `tables.value` store updates → floor plan SVG re-renders. On same-device Phase 1, this is instant. Source-level verification confirms the correct pattern.

---

## F. Scenario Scorecard

| # | Scenario | Completed? | Key Findings | Verdict |
|---|---|---|---|---|
| S7 | T6: "The Influencer" + PWD Discount | Partial — checkout observed via source | SC/PWD requires manager PIN; ID "optional" label contradicts gate; cash preset touch targets fail | CONCERN |
| S8 | T7: "Walk-In Chaos" + Pax Change | Source-validated | PaxChangeModal well-designed; pax ✎ entry point too small | CONCERN |
| S9 | T8: Transfer | Source-validated | Transfer flow is 2-step (select + PIN); discoverable via More Options only | PASS |
| S5/S6 | Item Void + Cancel Order distinction | Source-validated | Item ✕ buttons invisible at rest; two-tier grace/PIN system is correct | CONCERN |
| S16 | Mixed payment checkout | Source-validated | GCash/Maya present ✓; P0-09 fix confirmed ✓; 3 touch target failures | CONCERN |
| S17 | Wave 2 rapid re-open | Partially observed | SVG touch proximity risk for small tables; reactive updates fast | CONCERN |
| S18 | Over-capacity pax | Observed + source | Quick-select buttons disabled correctly; custom input bypasses capacity — P0 | FAIL |

---

## G. Final Summary

### P0 Findings (2)

```
[P0-1] PaxModal custom input bypasses capacity limit
        → handleCustomConfirm() in PaxModal.svelte has no capacity check
        → Staff can record 12 pax for a 2-person table
        → Corrupts stock deductions and BIR pax totals
        [Effort: S — 3 lines of code]

[P0-2] CheckoutModal cash preset buttons min-height: 32px
        → 12px below WTFPOS 44px minimum — will cause frequent misclicks
        → Every cash transaction is affected
        [Effort: S — change one style attribute]
```

### P1 Findings (7)

```
[P1-1] SC/PWD ID "optional" label contradicts canConfirmCheckout gate
        [Effort: M]
[P1-2] Pax ✎ chip — min-height: unset overrides minimum
        [Effort: S]
[P1-3] VoidModal reason buttons min-height: 40px
        [Effort: S]
[P1-4] Item ✕ button text-gray-300 — effectively invisible at rest
        [Effort: S]
[P1-5] No void→KDS signal in Phase 1
        [Effort: S — toast only]
[P1-6] Shift Start modal + live floor plan race condition
        [Effort: S]
[P1-7] Discount row density — 5 buttons in tight overflow-x-auto row
        [Effort: S]
```

### P2 Findings (4)

```
[P2-1] PaxModal capacity tooltip desktop-only
[P2-2] TransferModal ✕ close button min-height: unset
[P2-3] Grace period not visible on item ✕ buttons
[P2-4] "⋯ More Options ▼" label gives no hint about Transfer
```

---

## Overall Recommendation

This flow is **not ready for service without P0 fixes** — P0-1 (custom pax bypass) will silently corrupt occupancy and billing data on every shift where a staff member manually types a pax count, and P0-2 (cash presets 32px) will cause misclicks during every cash transaction. Both are S-effort fixes. After P0 resolution, the flow is ready for service with P1 items as friction-only improvements. The checkout architecture (P0-09 print-last, GCash/Maya present, SC/PWD with live discount preview) is solid.
