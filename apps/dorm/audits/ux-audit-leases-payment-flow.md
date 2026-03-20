# UX Audit: Leases → Payment Flow

**Date**: 2026-03-20
**Scope**: Leases page → LeaseCard → PaymentModal → Submit Payment
**Thoroughness**: Extreme
**Goal**: Smoothest possible payment flow
**Viewports**: Desktop (1280x720), Mobile (390x844)

---

## Scenario Plan

| # | Scenario | Desktop | Mobile | Status |
|---|----------|---------|--------|--------|
| S1 | Leases page initial load | Captured | Code-audited | Done |
| S2 | Click lease card → Details Modal | Captured | Code-audited | Done |
| S3 | Click "Make Payment" → Modal opens (empty) | Captured | Code-audited | Done |
| S4 | Select 1 billing → observe updates | Captured | Code-audited | Done |
| S5 | Select all billings → totals update | Captured | Code-audited | Done |
| S6 | Click "Exact" → amount fills → allocation preview | Captured | Code-audited | Done |
| S7 | Change payment method → reference field appears | Code-audited | Code-audited | Done |
| S8 | Submit payment → observe feedback | Code-audited | Code-audited | Done |

---

## Current Flow (clicks to pay)

```
Leases Page
  → [1] Click "Make Payment" on lease card
  → [2] Select billing checkbox(es)
  → [3] Click "Exact" (or type amount manually)
  → [4] (Optional) Change payment method
  → [5] Click "Submit Payment"
```

**Minimum clicks: 4** (if auto-amount were implemented) → **Currently 5**

---

## Issues Found

### P0 — Critical (Blocks Smooth Flow)

#### P0-1: Amount defaults to 0 — forces manual entry every time
- **Scenario**: S4-S5 (selecting billings)
- **Observed**: After selecting billings, amount stays at `0`. Selected Amount updates to `₱2,692.78` but Payment Amount remains `₱0.00`. User must click "Exact" or type manually.
- **Impact**: Adds a mandatory extra interaction to EVERY payment. The most common case (pay exact selected amount) requires explicit action.
- **Fix**: Auto-populate amount with selected billing total when billings are checked. Keep manual override available.
- **Viewport**: Both desktop and mobile
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P0-2: "No billings selected" shown AFTER billings are selected
- **Scenario**: S4 (select billing, observe summary)
- **Observed**: Payment Allocation section shows "No billings selected" even after 2 billings are checked. It only updates when `paymentAmount > 0`.
- **Impact**: System appears broken — user thinks their selection wasn't registered. Creates cognitive dissonance.
- **Fix**: Show allocation preview as soon as billings are selected, using their balance as assumed amount. Only show "No billings selected" when truly none are selected.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P0-3: "Exact" button — unlabeled, subtle, unclear purpose
- **Scenario**: S6
- **Observed**: Small outlined "Exact" button next to amount field. No tooltip, no explanation. Disabled when no billings selected with no reason shown.
- **Impact**: First-time users won't understand this button. It's the key to the fastest flow but it's the least visible element.
- **Fix**: Either (a) auto-fill amount (making "Exact" unnecessary) or (b) rename to "Fill Total" with tooltip "Set amount to selected billing total (₱X)" and make it visually prominent.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

---

### P1 — High (Degrades Smoothness)

#### P1-1: Submit button disabled without explanation
- **Scenario**: S3 (modal opens)
- **Observed**: "Submit Payment" button is grayed out/disabled. No indicator of what's missing (no billings? no amount? no method?).
- **Impact**: User must mentally check 4 conditions. Cognitive load increases with form complexity.
- **Fix**: Add micro-validation: show a small text under the button like "Select billings and enter amount" or use a progress indicator.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P1-2: Selected Amount vs Payment Amount — confusing duplication
- **Scenario**: S4-S5
- **Observed**: Two similar labels in adjacent columns:
  - Middle: "Selected Amount: ₱2,692.78"
  - Right: "Payment Amount: ₱0.00"
  Users don't understand why they differ. "Selected" = billing total, "Payment" = what you're paying. But this distinction is only clear to developers.
- **Impact**: Creates confusion about what number matters. Users may think they need to match these manually.
- **Fix**: Rename "Selected Amount" → "Outstanding Total" and "Payment Amount" → "You're Paying". Or remove duplication — let the summary column be the single source of truth.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P1-3: No "Select All" for outstanding billings
- **Scenario**: S5
- **Observed**: Must click each billing checkbox individually. For tenants with multiple billings, this is tedious.
- **Impact**: Processing bulk payments (the most common scenario for overdue tenants) requires N clicks instead of 1.
- **Fix**: Add "Select All / Deselect All" toggle above the billings list.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P1-4: Payment method as dropdown — slower than button group
- **Scenario**: S7
- **Observed**: Payment method is a `<select>` dropdown (Cash, GCash, Bank Transfer, Security Deposit). Requires click-to-open then click-to-select (2 interactions).
- **Impact**: For a field with only 4 options, a dropdown adds unnecessary interaction. GCash is extremely common in PH.
- **Fix**: Replace dropdown with a button group (segmented control): `[Cash] [GCash] [Bank] [SD]`. Single tap to select.
- **Viewport**: Both (especially mobile where dropdown can be hard to scroll)
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P1-5: No loading state on Submit
- **Scenario**: S8
- **Observed**: After clicking "Submit Payment", no visual feedback during the server call. Button doesn't show spinner or "Submitting..." state.
- **Impact**: User may double-click, creating duplicate payments. Or they think nothing happened.
- **Fix**: Disable button + show spinner during fetch. Re-enable on error.
- **Viewport**: Both
- **File**: `src/routes/leases/PaymentModal.svelte`

---

### P2 — Medium (Polish)

#### P2-1: Reference Number field hidden for Cash — layout shift
- **Scenario**: S7
- **Observed**: Switching from Cash to GCash/Bank makes a Reference Number field appear, shifting the form layout.
- **Impact**: Surprise layout change mid-form breaks user's spatial memory.
- **Fix**: Always show the field, disabled + grayed for Cash with placeholder "N/A for cash payments".
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P2-2: Billing type labels show raw enum values
- **Scenario**: S3-S6
- **Observed**: "UTILITY", "RENT" in all-caps — looks like database enums, not user-friendly labels.
- **Impact**: Unprofessional appearance, slight cognitive load to parse.
- **Fix**: Title-case with context: "Utility Bill", "Monthly Rent", "Security Deposit", "Penalty Fee".
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P2-3: Status badge "Penalized" on every billing is noise
- **Scenario**: S3-S5
- **Observed**: Every billing shows red "Penalized" badge. When ALL billings are penalized, the badge adds zero information.
- **Impact**: Visual clutter that dilutes the signal.
- **Fix**: Only show when exceptional, or move to a summary line at the top: "All billings include late penalties".
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P2-4: Three-column modal on mobile becomes very tall
- **Scenario**: S3 (mobile)
- **Observed**: 3-column layout (Billings | Form | Summary) stacks vertically on mobile. User must scroll past all billings to reach the form, then scroll more for summary.
- **Impact**: Submit button may be below the fold. User loses context of what they selected while filling the form.
- **Fix**: Consider a collapsible accordion or stepper: Step 1 "Select Billings" → Step 2 "Payment Details" → Step 3 "Review & Submit". Or pin the summary/submit at bottom.
- **File**: `src/routes/leases/PaymentModal.svelte`

#### P2-5: Lease cards — "wall of red" when 37/40 are overdue
- **Scenario**: S1
- **Observed**: Every card has red dot, "Critical overdue", same penalty styling. No differentiation by severity.
- **Impact**: Urgency signal is lost when everything screams urgent.
- **Fix**: Gradient severity colors (light red for 30d, medium for 90d, dark/pulsing for 180d+). Or group by severity with section headers.
- **File**: `src/routes/leases/LeaseCard.svelte`

#### P2-6: Card click vs Make Payment button — competing targets
- **Scenario**: S2 vs S3
- **Observed**: Clicking the card opens LeaseDetailsModal. Clicking "Make Payment" opens PaymentModal. Adjacent targets, easy to hit wrong one.
- **Impact**: Accidental modal opens → close → click right target → friction.
- **Fix**: Increase spacing, or make "Make Payment" visually dominant (it's the primary action). Consider making card click open payment directly (since that's the most common intent from this page).
- **File**: `src/routes/leases/LeaseCard.svelte`

---

### P3 — Low (Nice-to-have)

#### P3-1: No confirmation step before submit
- **File**: `src/routes/leases/PaymentModal.svelte`
- A brief "You're paying ₱2,692.78 via Cash for 2 billings — confirm?" would reduce errors.

#### P3-2: Payment date defaults to today with no backdating guardrail
- **File**: `src/routes/leases/PaymentModal.svelte`
- No warning if user backdates significantly (e.g., 6 months ago). Could be intentional but worth flagging.

#### P3-3: No keyboard shortcut for power users
- **File**: `src/routes/leases/PaymentModal.svelte`
- Enter to submit, Tab navigation could be smoother.

#### P3-4: Billing notes ("Utility bill for 2nd Floor - Room 2") are system-generated and unhelpful
- **File**: `src/routes/leases/PaymentModal.svelte`
- These notes don't help the user make decisions. Could show meter reading details instead.

---

## Accessibility Audit

| Check | Status | Notes |
|-------|--------|-------|
| Dialog has heading | PASS | h2 "Make Payment" |
| Checkboxes keyboard-accessible | PASS | role="checkbox", Enter/Space to toggle |
| Focus trap in modal | PARTIAL | Dialog auto-focuses but no explicit trap |
| Required fields marked | PARTIAL | Only Payment Date has `*`, amount and billing selection don't |
| Error messages announced | FAIL | Toast notifications not connected to aria-live |
| Color contrast on badges | PASS | Red/green badges meet WCAG AA |
| Touch targets ≥44px | PASS | min-h-[44px] on mobile buttons |
| Screen reader billing items | PARTIAL | Missing composite aria-label for checkbox items |

---

## Smoothness Scorecard

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Click count** | 7/10 | 5 clicks is close to minimum; auto-amount would save 1 |
| **Cognitive load** | 4/10 | Too many numbers, confusing labels, duplicate amounts |
| **Error prevention** | 5/10 | Validation exists but is opaque (disabled button, no hints) |
| **Feedback quality** | 3/10 | No loading states, misleading "No billings selected" |
| **Common-case optimization** | 3/10 | Amount not auto-filled, no Select All, dropdown for 4 options |
| **Visual clarity** | 6/10 | 3-column works on desktop but info density is high |
| **Mobile experience** | 4/10 | Tall stacked layout, scroll to submit |
| **Overall** | **4.6/10** | Functional but requires unnecessary effort |

---

## Fix Priority Order

| Priority | Issue | Impact | Effort | Status |
|----------|-------|--------|--------|--------|
| 1 | P0-1: Auto-fill amount from selected billings | Highest | Low | FIXED - auto-populates paymentAmount in updateSelectedAmount() |
| 2 | P0-2: Fix "No billings selected" false state | High | Low | FIXED - shows "Select billings to get started" or "Enter amount..." |
| 3 | P0-3: Make "Exact" self-explanatory or remove | High | Low | FIXED - renamed to "Fill Total", only shows when amount differs, has tooltip |
| 4 | P1-1: Show why Submit is disabled | High | Low | FIXED - validation hints below submit button |
| 5 | P1-3: Add Select All toggle | Medium | Low | FIXED - "Select All / Deselect All" link above billings list |
| 6 | P1-5: Loading state on Submit | Medium | Low | FIXED - spinner + "Submitting..." text, prevents double-submit |
| 7 | P1-4: Payment method as button group | Medium | Medium | FIXED - 2x2 grid of toggle buttons replaces dropdown |
| 8 | P1-2: Fix amount label confusion | Medium | Low | FIXED - "Lease Balance" + "Outstanding Total (N selected)" + "You're Paying" |
| 9 | P2-1: Always show reference field | Low | Low | FIXED - always visible, disabled for Cash with placeholder |
| 10 | P2-2: Human-friendly billing type labels | Low | Low | FIXED - "Monthly Rent", "Utility Bill", "Security Deposit", "Penalty Fee" |
| 11 | P2-3: Reduce penalized badge noise | Low | Low | FIXED - badges hidden when all billings share same status |
| 12 | P2-4: Mobile stepper/accordion | Medium | High | FIXED - sticky footer w/ amount+submit, collapsible billings section, compact billing rows, inline allocation preview, auto-collapse after selection |
| 13 | P2-5: Severity gradient for lease cards | Low | Medium | FIXED - 4-tier gradient: 0-30d amber, 30-90d red-400, 90-180d red-600, 180d+ red-800 |
| 14 | P2-6: Separate card click vs payment button | Low | Medium | FIXED - border-l divider separating actions from card click area |
