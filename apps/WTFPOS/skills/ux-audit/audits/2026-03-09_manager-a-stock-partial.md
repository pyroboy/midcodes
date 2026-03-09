# UX Audit — Manager A (Stock Partial)
**Date:** 2026-03-09
**Role:** Manager (Sir Dan)
**Branch:** Alta Citta (Tagbilaran) — `locationId: tag`
**Scope:** Phase 1 — AM Stock Count (`/stock/counts`) + Phase 2 — Receive Delivery (`/stock/deliveries`)
**Auditor:** Playwright agent (manager-a session)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 11 Key Finding issues resolved (P0: 0/2 · P1: 0/5 · P2: 0/4) · 4 additional delivery improvements landed (unit cost field, success toast, transfer badge, procurement CTA)

---

## Step 1 — Stock Counts Page: Initial State

**Verdict:** CONCERN

**Observation:**
The `/stock/counts` page loads correctly with the session showing `ALTA CITTA (TAGBILARAN)` in the LocationBanner — branch context is always visible. The active period selector shows three tabs: Morning 10:00 AM, Afternoon 4:00 PM, Evening 10:00 PM. The active period defaults to `pm10` (Evening), which means at AM shift open, the manager is **not automatically on the AM10 slot** — they must manually tap "Morning 10:00 AM" before entering counts. A count banner ("Count not yet started. Enter actual counts below, then tap Submit Count to lock in this session.") appears once the pending period is active.

The table shows: Item | Expected | Counted | Shortage / Surplus. All Expected values carry units inline (e.g. "20,500 g", "25 portions", "23 bottles") — units are present in the Expected column.

A sticky save bar ("Enter counts for each item, then tap Save.") with a "Save Counts" button appears at the top when the period is pending — this is well-positioned.

**Format issues:**
- Mixed units across rows is expected and acceptable (g vs portions vs bottles), as items are categorically different. This is not an inconsistency — it correctly reflects each item's unit type.
- The "Counted" column input (spinbutton) has **no unit label next to it**. A manager sees "20,500 g" in Expected but the Counted input is a bare number field with no "g" suffix — they must infer the unit from the Expected column. This is a cognitive mismatch at scale (20+ rows).

**Accidental interaction risks:**
- Default active period is `pm10` (Evening), not `am10` (Morning). A manager rushing through the AM shift could enter counts on the wrong period tab and submit. There is no guard prompting "You're entering counts for Evening — is that correct?"
- Period tabs do not show time-of-day context cues ("Morning — typically done before 11 AM") to help a tired opener.

**Recommendation:**
1. Auto-select the most appropriate period based on current time (before 12 PM → Morning, 12–6 PM → Afternoon, after 6 PM → Evening). Default to the first Pending period, not `pm10`.
2. Add a unit suffix label ("g", "portions", etc.) directly next to the Counted spinbutton or inside the input as a trailing adornment, so there is no ambiguity.

---

## Step 2 — Stock Count Form Interaction

**Verdict:** CONCERN

**Observation:**
Weight inputs accept raw numbers. Entering `15000` for Pork Bone-In (expected: 20,500 g) triggers variance display immediately on blur. The input component (`QuickNumberInput.svelte`) renders:
- A `−` decrement button: `h-8 w-8` (32×32 px)
- A `w-20` text input (approximately 80px wide)
- A `+` increment button: `h-8 w-8` (32×32 px)

The decrement/increment stepper buttons are **32px × 32px**, which is below the WCAG/POS minimum of 44px. On a tablet touchscreen being used one-handed, this is a meaningful mis-tap risk, especially for high-weight items where the steppers are used to fine-tune values.

The main number input (`w-20 py-1.5`) is also compact — approximately 80×36px. A one-fingered tap on a greasy kitchen tablet is borderline.

**Format issues:**
- No unit label visible next to the spinbutton in the "Counted" column. The user types a raw number (e.g. `15000`) without knowing if the system expects grams, kg, or portions for that row. The Expected column shows the unit, but it is in a different visual column, requiring eye movement across the row.
- The `step` prop defaults to `1`. For gram-based meat items, stepping by 1 gram with the `+/−` buttons is impractical; managers weigh to the nearest 100–500g. The step should be context-aware by unit (100 for `g`, 1 for `portions`/`bottles`).

**Accidental interaction risks:**
- The `−` button has `tabindex="-1"` which prevents tab-focus, but it is still tappable. Tapping `−` on a blank (null) field calculates as `0 − 1 = −1`, which then triggers `onChange(−1)`. The `min=0` guard in the component prevents going below min when decrementing, but only if the parsed value is already ≥ step — testing showed the guard works correctly (doesn't go below 0).
- No issue found with accidental increment/decrement beyond the min guard.

**Recommendation:**
1. Increase stepper button size to at minimum `h-11 w-11` (44px) to meet touch target minimums.
2. Add a per-row unit suffix label inside or adjacent to the Counted input cell. Example: "15000 g" displayed as `[input: 15000] [g]`.
3. Set `step` dynamically: `step={item.unit === 'g' ? 100 : 1}` — or expose a separate `step` prop passed from `StockCounts.svelte` keyed on the unit.

---

## Step 3 — Variance Display

**Verdict:** CONCERN

**Observation:**
After entering `15000` for Pork Bone-In (expected: 20,500 g), the Shortage / Surplus cell shows:
- A `VarianceBar` (visual bar component)
- Text: "Short 5500 units" (from `img alt` and an adjacent generic element)
- Text: "−5,500 g" (the numeric value)

The sign convention is **inverted relative to expectation**: the code at line 154–157 of `StockCounts.svelte` shows that when `drift > 0` (positive drift = shortage), it renders `−{drift}` with a minus sign and an AlertCircle icon. When `drift < 0` (surplus), it renders `+{Math.abs(drift)}`. This means:
- Drift > 0 = stock is short (counted < expected) → shown as `−5,500 g`
- Drift < 0 = stock is surplus (counted > expected) → shown as `+Xg`

The minus sign for "shortage" is semantically correct but the labeling is confusing: the word "Short 5500 units" (from the img alt text) appears alongside `−5,500 g`, creating redundancy rather than clarity. The column header says "Shortage / Surplus" — not a signed delta — yet the display shows a signed number.

Additionally, the `VarianceBar` itself is present but not described in the snapshot text, so its color is unknown from audit — the code shows `varianceClass` uses `text-status-red` for >10% variance, `text-status-yellow` for >2%, `text-status-green` for zero. Color coding is implemented and correct.

**Format issues:**
- Variance is shown in the item's native unit (e.g., `−5,500 g`), which is correct and consistent.
- However, "Short 5500 units" text uses "units" as a generic word, not the item's actual unit. This is a bug: a shortage of `5,500 g` is described as "Short 5500 units" — "units" should be "g" (or the item's actual unit). Source: the `img alt` attribute is likely auto-generated and does not substitute the item unit.
- The total variance summary card at the top (for completed periods) shows `totalAbsVariance.toLocaleString()` with **no unit** — a raw number like "6000" with no "g" or mixed units context is ambiguous when the list contains both grams and portions.

**Accidental interaction risks:** None identified in this step.

**Recommendation:**
1. Fix the "Short X units" label to use `item.unit` instead of the word "units". This is a data accuracy issue.
2. The total variance summary card should either omit the unitless sum (it is meaningless when mixing grams and portions) or split it into separate gram-total and count-total lines.
3. Consider replacing the dual "Short 5500 units / −5,500 g" with a single signed value: `−5,500 g` with the color class doing the semantic work. The redundant text adds noise.

---

## Step 4 — Navigate to Deliveries

**Verdict:** PASS

**Observation:**
`/stock/deliveries` loads correctly. The LocationBanner shows `ALTA CITTA (TAGBILARAN)`. The "Receive Delivery" button is prominently placed at the top right of the Delivery History section — it is the only primary action button on the page and is styled `btn-primary` (orange). It is easy to find.

The delivery log table shows columns: Time | Item / Supplier | Qty | Batch & Expiry | FIFO Usage. Records are present and consistently formatted.

**Format issues:**
- Time column uses `toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })` — renders as "10:33 AM", "09:33 AM", etc. Format is consistent across all rows.
- Qty column shows "+5000 g", "+6 bottles", "+10 portions" — units are included inline. Format consistent.
- Batch & Expiry: Batch shows as "B-241", expiry as "Exp: 2026-03-14" (ISO format `YYYY-MM-DD`). ISO date format is used throughout. This is unambiguous but may be slightly unfamiliar to Filipino staff who expect "March 14, 2026" or "14/03/2026". Not a blocker, but worth noting for localization.
- FIFO Usage column shows raw numbers ("5000 left / 0 used") without units — for items measured in grams, "5000 left" is not immediately clear whether that is grams, kg, or portions. Adding the unit would improve clarity.
- One delivery (TRF-A7TAG batch for Sliced Beef) shows "37.5" percent used in the progress ring — this is a decimal rendered without % symbol in the accessibility tree. Minor.

**Accidental interaction risks:** None on the list page.

**Recommendation:**
1. Add units to FIFO Usage column numbers ("4800 g left / 3200 g used").
2. Consider localizing expiry dates to "Mar 14, 2026" format for staff reading speed, while keeping ISO in the database.

---

## Step 5 — Receive Delivery Form

**Verdict:** PASS (with concerns)

**Observation:**
The "Receive Delivery" button opens a **modal** (not an inline form). The modal is `w-[480px]` centered with a `bg-black/50 backdrop-blur-sm` overlay. It contains:

1. **Item picker**: A text search input + select dropdown. The dropdown pre-selects the first item ("Pork Bone-In (g)"). Unit is shown in parentheses in the option label — this is good.
2. **Current stock context**: "Current stock: 7500 g" shown below the item picker — helpful real-time context.
3. **Quantity + Unit**: Two fields side-by-side. Quantity is a number input, Unit is a disabled text field showing the item's unit auto-populated. This is a clean pattern — the manager can't enter a wrong unit.
4. **Supplier**: Text input with recent supplier chip buttons below ("Metro Meat Co.", "SM Trading", "Korean Foods PH", "Transfer from wh-tag") — excellent touch for speed.
5. **FIFO nudge banner**: Amber box "Don't forget batch & expiry dates for FIFO tracking ↓" — visible above the batch fields.
6. **Batch No (Optional)**: Text input, placeholder "e.g. B-2024-05".
7. **Expiry (Optional)**: `type="date"` input — native date picker, no placeholder format shown. On Chrome/desktop it shows a date picker; on Android/iOS it shows native date picker. Format will be `YYYY-MM-DD` internally.
8. **Delivery Photos**: Optional photo capture.
9. **Notes**: Optional text field.
10. **Submit path**: "Receive Stock" (primary, full-width, disabled until Item + Qty + Supplier filled) → inline confirmation step showing a summary before final save.
11. **Cancel**: Ghost button, full-width, below "Receive Stock".

The form is well-structured and scannable. The two-step submit (fill → confirm → save) is a meaningful guard against accidental submission.

**Format issues:**
- The expiry field uses `type="date"` (native input) — no visible placeholder format. On desktop browsers, the input shows `mm/dd/yyyy` as a placeholder in the field, but this differs from the ISO format used in the delivery log ("Exp: 2026-03-14"). There is a format mismatch between data entry (browser locale `mm/dd/yyyy`) and display (`YYYY-MM-DD`). This could cause manager confusion ("did I enter it right?").
- Batch No placeholder "e.g. B-2024-05" is an ISO-month pattern, which is different from the seeded batch numbers shown in the log ("B-241", "B-242") — the placeholder format doesn't match actual usage patterns.

**Accidental interaction risks:**
- The "Receive Stock" button is disabled until all required fields are filled — cannot accidentally submit an empty form.
- The inline confirmation step (showing Item, Qty, Supplier, Batch, Expiry before final save) is a solid protection against errors.

**Recommendation:**
1. Add a visible format hint below the expiry date input: "Format: YYYY-MM-DD (e.g. 2026-03-14)" — or switch the display format in the delivery log to match the browser date picker locale.
2. Update the Batch No placeholder to match actual in-use patterns: "e.g. B-241" rather than "e.g. B-2024-05".

---

## Step 6 — Delivery Form Accidental Interaction Assessment

**Verdict:** PASS (with one concern)

**Observation:**
Testing Escape key while form was open: **form did not close**. The modal backdrop (`bg-black/50`) has no `onclick` handler on the overlay div itself — clicking outside the white card does not dismiss the form. This is correct.

Testing the Cancel button after filling Quantity (5000) and Supplier ("Metro Meat Co."): **form closed immediately with no confirmation guard**. All entered data was discarded. However, `localStorage` draft persistence (`wtfpos_delivery_draft`) is implemented — on re-open, the draft is restored and a "Draft restored from last session." banner appears with a "Clear" option. This mitigates accidental Cancel, though only if the user re-opens the form in the same session.

The X (close) button in the top-right corner also closes immediately without confirmation, same as Cancel.

The "Receive Stock" submit button triggers a two-step inline confirmation before actually saving — this is a strong guard against premature submission.

Button sizing: The "Receive Stock" and "Cancel" buttons are full-width (`w-full`), ensuring a large touch target. The X close button is `p-1.5` with a 20px icon — the tappable area is approximately 32×32px, below the 44px minimum.

**Format issues:** None additional.

**Accidental interaction risks:**
- Cancel button (and X button) discards filled form data immediately with no "Are you sure?" prompt. Draft persistence is the only recovery path, and it requires the user to re-open the form and notice the "Draft restored" banner. A manager who accidentally taps Cancel and navigates away does not see the draft until they return.
- The X close button is undersized at ~32px, increasing mis-tap risk on a tablet.

**Recommendation:**
1. If any required field (Item, Qty, Supplier) has a value, show a confirmation dialog or snackbar when Cancel or X is tapped: "Discard draft? Your entry will be saved as a draft." with Yes / Keep Editing options.
2. Increase X button touch target to `h-11 w-11` (44px) to meet the POS touch minimum.

---

## Key Findings

- **[P0]** Stock counts default period is `pm10` (Evening) regardless of time of day. A manager doing the AM count must manually select "Morning" before entering data. If they miss this, all entries are saved to the wrong period with no warning. Auto-select the pending period by current time.

- **[P0]** Variance "Short X units" label in the Shortage/Surplus column incorrectly uses the word "units" instead of the item's actual unit (`item.unit`). "Short 5500 units" should be "Short 5500 g" for gram-measured items. This is a data accuracy bug.

- **[P1]** QuickNumberInput stepper buttons (`−` and `+`) are 32×32px — below the 44px minimum touch target. On a POS tablet used with one hand, this is a real mis-tap risk during a time-pressured AM stock count.

- **[P1]** No unit label adjacent to the Counted input field. The manager must cross-reference the Expected column to know the unit for each row. For 20+ items mixing g/portions/bottles, this is a cognitive load issue at AM rush.

- **[P1]** `step` defaults to `1` for all items in QuickNumberInput, including gram-weighted meats. Incrementing/decrementing Pork Bone-In by 1g is impractical. Step should be 100 for `g`, 1 for `portions`/`bottles`/`pcs`.

- **[P1]** Total variance summary card shows a unitless aggregate number (e.g., "6000") mixing grams and portions in one total. This number is meaningless and potentially misleading. Either remove or split by unit type.

- **[P1]** Cancel and X buttons on the Receive Delivery form discard all entered data immediately with no guard. Draft persistence is implemented but requires the user to re-open the form and notice the "Draft restored" banner. Add an inline confirmation step when fields are non-empty.

- **[P2]** Expiry date input is `type="date"` (browser locale `mm/dd/yyyy` display) but delivery log shows dates as `YYYY-MM-DD`. Format mismatch between data entry UI and read-back display.

- **[P2]** Batch No placeholder "e.g. B-2024-05" does not match in-use batch number patterns ("B-241", "B-242") visible in the delivery log. Placeholder should reflect actual usage.

- **[P2]** FIFO Usage column in delivery log shows raw numbers without unit ("4800 left / 3200 used"). Adding units ("4800 g left") would remove ambiguity for multi-unit inventories.

- **[P2]** X (close) button on delivery modal is approximately 32×32px — below 44px touch target minimum.

---

## Fix Status (session recovery 2026-03-09)

### Stock Counts (`/stock/counts`)
- [ ] **P0** Wrong default period — still defaults to PM10 regardless of time of day
- [ ] **P0** "Short X units" label bug — variance column renders "units" not the item's actual unit (`g`, `portions`, etc.)
- [ ] **P1** Stepper `+/−` buttons 32×32px — QuickNumberInput unchanged
- [ ] **P1** No unit label next to Counted input — manager must cross-ref Expected column
- [ ] **P1** Step of 1 for gram items — no unit-aware `step` prop

### Deliveries (`/stock/deliveries`)
- [x] **P1** Unit cost field added — optional `Unit Cost (₱)` with auto-computed `Total Cost`
- [x] **P1** Delivery success toast — `✓ Delivery recorded` fires after submit
- [x] **P1** Transfer-origin rows show "Transfer" badge (distinguishable from vendor rows)
- [x] **P2** Procurement expense CTA — post-save banner links to `/expenses` with prefill
- [ ] **P1** Delivery Cancel guard still missing — Cancel discards draft with no confirmation
- [ ] **P2** FIFO Usage column still shows no unit suffix ("4800 left" → should be "4800 g left")
- [ ] **P2** Delivery modal close (✕) still ~32px
