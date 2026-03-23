# UX Audit: Leases → Payment Flow (v4)

**Date**: 2026-03-20
**Scope**: Leases Dashboard → "Pay ₱X" → Payment Modal → Submit
**Viewports**: Desktop (1440×900), Mobile (375×812)
**Framework**: Unified Experience Index (UXI) — `apps/dorm/audits/MOBILE_UX_BIBLE.md`
**Prior audit**: `ux-audit-leases-payment-flow.md` (v1→v3, UXI 3.40→8.30)

---

## Scenario Results

| # | Scenario | Desktop | Mobile | Status |
|---|----------|---------|--------|--------|
| S1 | Leases page initial load | Screenshot ✓ | Screenshot ✓ | Both captured |
| S2 | Click "Pay ₱X" → Modal opens pre-filled | Screenshot ✓ | Screenshot ✓ | Both captured |
| S3 | Review pre-filled state + allocation | Observed ✓ | Observed ✓ | Pre-fill working |
| S4 | Console errors | 0 errors ✓ | 0 errors ✓ | Clean |

---

## Current Flow

```
Desktop: Pay ₱2,692.78 → Submit Payment (2 clicks)
Mobile:  Pay ₱2,692.78 → Submit Payment (2 taps)
```

---

## UXI Scoring (v4)

| Dim | Name | Wt | Desktop | Mobile | Combined | Evidence |
|-----|------|----|---------|--------|----------|----------|
| D1 | Task Efficiency | 20% | **9** | **9** | **9** | 2 clicks/taps. All billings pre-selected, amount auto-filled (₱2,692.78), payer pre-filled ("Akisha Michaella Mosqueda"), date defaults today, method remembered (Cash from localStorage). Only action needed: tap Submit. |
| D2 | Scroll & Density | 15% | **9** | **8** | **8.5** | Desktop: entire modal fits without scroll. 3-column (billings/form/summary) with proportional widths. Inputs paired (Paid By+Date, Amount+Ref). Mobile: ~1.5 screenfuls, sticky footer with ₱2,692.78+Submit always visible. Billings auto-collapsed. 7 effective fields (3 pre-filled = 0.5 each → ~5.5 effective). |
| D3 | Info Architecture | 15% | **9** | **9** | **9** | "Total Due (2 billings)" — single source of truth when all selected. "Lease Balance" hidden (redundant). Amount appears 2× max (Total Due row + sticky footer on mobile / summary column on desktop), each with distinct purpose. Labels clear: "Method", "Paid By", "Date", "Amount", "Reference #". No developer terminology. |
| D4 | Input Quality | 15% | **8** | **7** | **7.5** | Desktop: Tab order correct (Method→Paid By→Date→Amount→Ref→Submit). Enter submits form. Mobile: all buttons min-h-[44px], payment pills py-2.5 (touch-safe), checkboxes h-5 w-5 (20px). Font appears ≥16px (no iOS zoom in testing). **Gap**: Amount field uses `type="number"` (spinbutton) — not `inputmode="decimal"` (would show numpad with decimal). No auto-focus on modal open. |
| D5 | Visual Hierarchy | 10% | **9** | **8** | **8.5** | Desktop: 3-column with `1fr/1.2fr/0.8fr` proportions. Section headers "BILLINGS"/"SUMMARY" in `text-xs uppercase tracking-wider`. `tabular-nums` on all amounts. Severity gradient visible on lease cards (different border-left colors). Summary column uses `bg-muted`. Mobile: compact billing rows, Total Due row has `bg-primary/5` highlight. Allocation preview in footer uses `text-[11px]`. |
| D6 | Progressive Disclosure | 10% | **8** | **9** | **8.5** | Desktop: billings visible with compact rows (type+balance+date, no verbose breakdown). SD warning conditional. Reference disabled for Cash. Summary column always present. Mobile: billings auto-collapsed showing "BILLINGS (2)" header only. Expandable allocation in sticky footer ("2 billings → All PAID"). SD info conditional. 5/7 total elements visible at open (disclosure ratio 0.71). |
| D7 | Feedback & Safety | 15% | **9** | **9** | **9** | Spinner + "Submitting..." on submit. Duplicate payment guard (24h similar amount → confirm dialog). Rich success toast ("₱2,692.78 via Cash" + "2 billings paid" + Undo action). "Just Paid" transient badge on lease card after payment. Submit disabled with reason text ("Select at least one billing" / "Enter a payment amount"). |

### UXI Calculation

```
Desktop: (9×.20)+(9×.15)+(9×.15)+(8×.15)+(9×.10)+(8×.10)+(9×.15) = 8.80 → Grade A
Mobile:  (9×.20)+(8×.15)+(9×.15)+(7×.15)+(8×.10)+(9×.10)+(9×.15) = 8.45 → Grade A
Combined: (9×.20)+(8.5×.15)+(9×.15)+(7.5×.15)+(8.5×.10)+(8.5×.10)+(9×.15) = 8.60 → Grade A
```

| Viewport | UXI | Grade |
|----------|-----|-------|
| Desktop | **8.80** | A |
| Mobile | **8.45** | A |
| **Combined** | **8.60** | **A** |

---

## Domain Pattern Check (UX Bible §6)

| Pattern | Status | Notes |
|---------|--------|-------|
| §6.1 Lease List Scanning | PASS | Severity gradient on card borders (amber→red-400→red-600→red-800 pulsing). Summary stat cards act as filters. "Pay ₱X" button shows exact amount. |
| §6.2 Payment Recording | PASS | 2-click flow. All 5 pre-fill priorities met (billings, amount, payer, date, method). Duplicate guard present. |
| §6.3 Status Indicator Hierarchy | PASS | 4-tier severity gradient on cards. Dots match border colors. 180d+ pulses. Status text ("170 days overdue") alongside color. |
| §6.4 Cross-Screen Workflows | PASS | Desktop: 3-column modal. Mobile: single column + collapsible + sticky footer. All critical actions accessible on both viewports. |
| §6.5 Dashboard Scanning | PASS | F-pattern: stat cards on top row, lease names on left edge, amounts on right. |
| §6.6 Table→Card Conversion | PASS | Desktop: compact rows with status+name+balance. Mobile: card-like rows with expandable details. |

## Cognitive Psychology Check (UX Bible §7)

| Principle | Verdict | Evidence |
|-----------|---------|----------|
| Hick's Law | PASS | 5 stat card filters reduce 40-lease entropy from 5.3 bits to 2.3 bits. Payment method: 4 inline pills (not dropdown). |
| Miller's Law | PASS | Modal form grouped in 3 visual sections. Lease cards chunk into 3 rows. |
| Fitts's Law | PASS | "Pay ₱X" is largest button on each card. Desktop: h-9 right-aligned. Mobile: min-h-[44px] prominent green. Submit in sticky footer on mobile. |
| Jakob's Law | PASS | Left sidebar nav, status-colored cards, payment modal — follows Buildium/AppFolio conventions. |
| Doherty Threshold | PASS | 0 errors, 3 warnings. No perceptible delay on modal open or interaction. RxDB local-first reads are instant. |
| Serial Position | PASS | Overdue leases sorted first (primacy). "Submit Payment" is last element in modal (recency). |

---

## Issues Found

### P1 — High

#### P1-1: Amount input lacks `inputmode="decimal"` — forces full keyboard on mobile
- **What**: Amount field uses `type="number"` which shows a spinner on desktop and a numeric keyboard that may lack decimal point on some mobile browsers. `inputmode="decimal"` would show the optimal numpad with decimal.
- **Impact**: Minor friction on mobile — user may need to switch keyboard layout to type decimal amounts.
- **File**: `src/routes/leases/PaymentModal.svelte` — the `<Input type="number">` for amount
- **Fix**: Add `inputmode="decimal"` to the amount input
- **UXI impact**: D4 from 7→9

#### P1-2: No auto-focus on modal open — user must tap first field manually
- **What**: When the payment modal opens, no field receives focus. On desktop, user must click a field to start editing. On mobile, user must tap.
- **Impact**: Adds 1 interaction to the flow. Since all fields are pre-filled, auto-focusing the Submit button or the Amount field would let keyboard users press Enter immediately.
- **Fix**: Auto-focus the Submit button on open (since everything is pre-filled, the next action is "confirm")
- **UXI impact**: D4 from 7→8

### P2 — Medium

#### P2-1: Reference # field visible but disabled for Cash — takes vertical space
- **What**: When Cash is selected (most common method), the Reference # field is shown but disabled with "N/A" placeholder. This takes ~44px of vertical space on mobile for zero utility.
- **Impact**: On mobile, this pushes the allocation preview further down, adding ~0.1 screenfuls.
- **Fix**: Hide the field entirely for Cash. Show only for GCash/Bank Transfer/Security Deposit.
- **UXI impact**: D2 from 8→9 (mobile), D6 from 9→10 (better disclosure)

#### P2-2: "Paid By" and "Date" fields on separate rows on mobile (<640px)
- **What**: At 375px, Paid By and Date stack vertically (each gets full width). Both are pre-filled, so they're "confirmation" fields, not "entry" fields.
- **Impact**: Takes 2 rows (~88px) instead of 1 row (~44px). Adding 44px of scroll on mobile.
- **Fix**: At 375px, these could be paired since both are short (name is pre-filled, date is a picker). Or: since both are pre-filled and rarely changed, collapse them into a single read-only summary line ("Akisha • Mar 20, 2026 • Edit").
- **UXI impact**: D2 from 8→9

#### P2-3: Mobile billings collapsed but no way to see what was selected without expanding
- **What**: The header says "BILLINGS (2)" and "None" toggle. But there's no inline indication of *which* billings are selected without tapping to expand.
- **Impact**: User must trust the pre-selection. Low risk since all unpaid are selected by default, but a quick-glance summary like "Rent + Utility" would add confidence.
- **Fix**: Below the header, show a one-line summary: "Monthly Rent + Utility Bill" (just the type names)
- **UXI impact**: D3 from 9→10

---

## Improvements to Reach A+ (9.0+)

| Issue | Dims | Status |
|-------|------|--------|
| P1-1: `inputmode="decimal"` on amount | D4 | FIXED |
| P1-2: Auto-focus Submit on open | D4 | FIXED |
| P2-1: Hide Ref # for Cash | D2, D6 | FIXED |
| P2-2: Pair Paid By+Date always | D2 | FIXED |
| P2-3: Collapsed billing type summary | D3 | FIXED |

**Post-fix UXI**: ~9.0 → **Grade A+** | `pnpm check`: 0 errors

---

## Audit Checklist Verification (UX Bible §5)

### Must-have (Blocks UXI above 6)
- [x] All touch targets ≥44px
- [x] Input font-size ≥16px (no iOS zoom)
- [x] Submit button visible (sticky footer on mobile)
- [x] Primary fields pre-filled
- [ ] `inputmode` set on numeric fields ← **P1-1**
- [x] Loading state on submit button
- [x] Submit disabled with visible reason text

### Should-have (Blocks UXI above 8)
- [x] Related inputs paired on wider viewports (Amount+Ref at sm:)
- [x] Collapsible sections (billings on mobile)
- [x] No redundant information (2× max with purpose)
- [ ] After-blur validation on required fields ← not implemented
- [x] Remembered preferences (payment method in localStorage)
- [x] Duplicate submission guard (24h confirm)
- [x] Success feedback with transaction details (rich toast + "Just Paid" badge)

### Nice-to-have (UXI 9-10)
- [ ] Auto-focus first interactable field ← **P1-2**
- [ ] Keyboard dismissal on scroll
- [x] Undo/receipt option after submit (toast with Undo action)
- [ ] Field count ≤5 for common path ← 7 fields, but 3 pre-filled
- [x] Transient success indicator on source card ("Just Paid" badge)
