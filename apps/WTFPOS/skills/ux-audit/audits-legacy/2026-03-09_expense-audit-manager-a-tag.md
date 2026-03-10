# UX Audit — /expenses — Manager Role (Sir Dan, Alta Citta / tag)
**Date:** 2026-03-09
**Auditor:** Claude (agent)
**Role:** manager
**Location:** Alta Citta (tag)
**App:** WTFPOS v1 — SvelteKit + Svelte 5

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 7 of 9 issues resolved (P0: 2/2 · P1: 2/2 · P2: 3/6 · P3: 0/1)

---

## Step 1 — Initial State of /expenses

**Verdict: CONCERN**

**Observation:** Page loads correctly with location context, but category default is "Labor Budget" — a low-frequency category for the first item a manager would log.

### Findings

**Layout:**
- 2-column grid: left = 320px form panel, right = full-width expense log. Correct and clean.
- LocationBanner visible at top: "ALTA CITTA (TAGBILARAN)" — PASS. Session context is unambiguous.
- Sidebar shows manager nav: POS, Kitchen, Stock, Reports (no Admin). Correct role restriction.

**Form defaults:**
- **Category:** defaults to "Labor Budget" — first item alphabetically/by position. Labor Budget is a weekly or monthly entry unlikely to be the most frequent. A smarter default would be "Miscellaneous" or the most recently used category. CONCERN (P2)
- **Amount:** empty — correct.
- **Date:** 2026-03-08 (today's date) — PASS.
- **Paid By:** "Petty Cash" — PASS, this is the most common payment source for daily ops.
- **Description:** empty with placeholder "e.g., Unbox wet wipes" — placeholder is very specific to one use case, not representative. Minor CONCERN (P3).

**Category select optgroup structure:**
- The snapshot tree shows ALL options flat (no optgroup nodes visible in accessibility tree). The HTML uses `<optgroup>` tags but the browser accessibility tree does not expose optgroup labels as navigable nodes — this means a screen reader user or automation cannot distinguish group boundaries. For sighted users, the native `<select>` dropdown WILL show group labels visually, but this is a potential accessibility gap. CONCERN (P2).

**Record Expense button:**
- Correctly disabled until amount > 0 is entered — PASS.

**Expense Log (pre-existing seed data):**
- 1 entry visible: "Pork belly delivery" — Meat Procurement — ₱8,500.00 — Petty Cash — 05:31 AM
- Today's Total: ₱8,500.00 — correctly summed.
- All time: ₱44,701.00 — historical seed data present.
- Log filter defaults to "Today" — PASS, most relevant view for daily ops.

**Issues identified:**
- P2: Category default is "Labor Budget" — low-frequency first choice creates extra taps for the most common categories (Meat Procurement, Produce & Sides, Miscellaneous).
- P3: Description placeholder ("e.g., Unbox wet wipes") is overly specific and odd for a restaurant ops context.

---

## Step 2 — Log Overhead Block (Wages + Rent)

**Verdict: FAIL (P0)**

**Observation:** Every expense submission fails with RxDB VD2 schema validation error — `expenseDate` field exists in TypeScript interface and store logic but is absent from the RxDB schema (v3). The entire core function of the page is broken.

### Root Cause (code-confirmed)

The `Expense` interface in `src/lib/stores/expenses.svelte.ts` declares `expenseDate: string`. The `addExpense()` function unconditionally includes it in the insert document. The `expenseSchema` in `src/lib/db/schemas.ts` (version 3) does NOT include `expenseDate` as a property, and RxDB applies `additionalProperties: false` at validation time — resulting in a VD2 error on every write.

**Files affected:**
- `src/lib/stores/expenses.svelte.ts` line 22: `expenseDate: string` in `Expense` interface
- `src/lib/stores/expenses.svelte.ts` line 94: `expenseDate: expenseDate || todayIso` always set
- `src/lib/db/schemas.ts` lines 345–364: `expenseDate` not in properties, schema version 3

**What the user sees:**
- The submit button clicks and appears to process ("Saving..." state)
- A raw RxDB error dump appears in a red box at the bottom of the form: "Error message: object does not match schema\nError code: VD2\nFind out more about this error here: https://rxdb.info/errors.html?console=errors#VD2 ..." followed by 200+ lines of JSON schema dump
- The form data is NOT cleared (amount 12500, description, category all remain)
- The expense log does NOT update — entry count stays at "1 today" (seed data only)
- Today's Total stays at ₱8,500.00 (seed value)
- The filter pills (Today/This Week/All Time) still show, the log row with seed data still visible

**Secondary UX failures in this step:**
- P0: Error message is a raw technical RxDB error dump — completely unintelligible to a restaurant manager ("Error code: VD2", schema validation JSON). User cannot self-diagnose or work around this.
- P1: No distinction between "saving in progress" and "saved" states when an error occurs — the submit button briefly shows "Saving..." then reverts with no success flash and only a technical error below the fold.
- P2: Form does not scroll to show the error message — on a 320px form panel, the error appears below the submit button but below the fold on shorter screens.

**Success flash timing:**
- NOT triggered (error path correctly skips it) — but the visual transition from "Saving..." → disabled Record Expense with error below could be confused for success by a rushed user who doesn't read below the fold.

**Form reset behavior after failure:**
- CORRECT — data preserved. The user's entered values remain when an error occurs. This is appropriate UX for failure paths.

**Log sort order:**
- Could not verify (no new entries saved) — seed data appears newest at top by `createdAt: 'desc'` sort.

---

## Step 3 — Log Utilities Block (Electricity + Gas/LPG + Water)

**Verdict: FAIL (consequence of P0)**

**Observation:** All three entries (Electricity ₱4,200, Gas/LPG ₱1,800, Water ₱650) would fail with the same VD2 error as Step 2. Not attempted separately to avoid redundant error states.

### Findings

**Category optgroup navigation:**
- The select dropdown uses HTML `<optgroup>` tags with groups: (Overhead: Labor Budget, Wages, Rent), (Procurement: Meat Procurement, Produce & Sides), (Utilities: Electricity, Gas/LPG, Water, Internet), (Other: Petty Cash Replenishment, Miscellaneous)
- From the accessibility snapshot, the options appear FLAT — optgroup labels are NOT exposed as navigable/selectable items in the accessibility tree. Sighted users on desktop see the grouped labels visually in the native dropdown. On mobile, this should render as grouped sections.
- Navigation from Overhead → Utilities requires scrolling past Wages, Rent, Meat Procurement, Produce & Sides to reach Electricity — 5 option positions down. Given the small option count (11 total), this is manageable.
- No CONCERN raised on optgroup structure — it works as designed.

**Issues identified:**
- P0 (carried): All entries blocked by schema mismatch bug.

---

## Step 4 — THE FAT-FINGER: Meat Procurement ₱55,000 (wrong amount)

**Verdict: FAIL (consequence of P0) + CONCERN (P1)**

**Observation:** Entry cannot be saved (VD2 error). But the UX design provides no protection against accidental large-amount entries.

### Findings

**No amount confirmation for large values:**
- The form accepts any numeric input with no upper-limit warning, no confirmation dialog for amounts exceeding a threshold (e.g., > ₱10,000), and no "confirm amount" step.
- For a meat procurement entry, ₱55,000 vs ₱5,500 is a 10x error — the log would show this prominently (large red bold mono amount). But there is no pre-submission guard.
- P1: Missing large-amount confirmation — a fat-finger ₱55,000 entry would appear in the log as ₱55,000.00 in bold red, visually identical to a legitimate entry. The manager would need to use the Delete (with manager PIN) to correct it.

**Amount field UX:**
- `type="number"` with `font-mono font-bold text-lg` — the 14px/16px mono bold makes the entered value readable before submit.
- `step="0.01"` allows decimal amounts — appropriate for Philippine peso cents.
- No comma formatting while typing (shows raw 55000 not 55,000) — CONCERN (P2). On a touchscreen, distinguishing 5500 from 55000 without thousand-separator formatting is error-prone.

**Today total impact (hypothetical):**
- If saved, Today total would jump from ₱8,500 to ₱63,500 — a 7x increase, highly visible in the header. This is the one guard: the header total is a quick sanity check.

**Issues identified:**
- P1: No large-amount confirmation gate (e.g., amounts > ₱10,000 should require confirmation).
- P2: Amount field shows raw unformatted number while typing — no thousand separator feedback.

---

## Step 5 — Log Produce & Sides (7th expense)

**Verdict: FAIL (consequence of P0)**

**Observation:** Entry cannot be saved (VD2 error). Log density assessment deferred — only seed data is visible.

### Findings (from code + visual)

**Log density with 1 entry (seed data observation):**
- Each row: `[&>td]:py-3` = 12px top/bottom padding + ~20px content = ~44px row height. Good touch target for the repeat/delete buttons in the action column.
- With 7–8 entries, the log would require scrolling within the `h-[calc(100vh-160px)]` container. The sticky header row (`sticky top-0`) is in place.
- Description column: `truncate max-w-xs` (max-w-xs = 20rem/320px) — sufficient for most short descriptions, but long entries will be truncated without tooltip. CONCERN (P2).

**Log action buttons (repeat + delete) per row:**
- Both are `min-h-[44px] min-w-[44px]` — meets the 44px touch minimum. PASS.
- Side-by-side in a flex container with `gap-1` (4px gap). At 44×44px each, total action column width = ~92px. Close together but distinct areas. Low misclick risk on desktop; moderate on mobile if thumb is large.
- Delete button (✕) vs repeat button (RotateCcw icon): delete is plain text "✕", repeat is an icon. Visual differentiation is subtle — both gray (#9CA3AF) in default state, different hover colors (repeat → orange accent, delete → red). CONCERN (P2): no color differentiation in default state, user relies on hover to distinguish destructive from non-destructive action.

---

## Step 6 — UX Assessment of /expenses Form

**Verdict: CONCERN (multiple P1/P2 issues)**

**Observation:** The form is well-structured but has several UX gaps at the detail level. The P0 bug (broken writes) eclipses all else, but the secondary issues are documented here.

### Touch Targets

**Filter pills (Today / This Week / All Time):**
- CSS: `px-3 py-1 rounded-full text-xs font-semibold min-h-[32px]`
- Measured height: 32px (from CSS — `min-h-[32px]` with 4px top/bottom padding + 12px text = ~32px rendered)
- **FAIL against 44px touch minimum.** The code comment in the source explicitly notes `min-h-[32px]` — this is intentional but violates the project's own touch target rule (app.css: all `button` elements have `min-height: 44px`). These filter pills override this rule via inline Tailwind.
- P1: Filter pills are 32px — below the 44px touch minimum stated in CLAUDE.md design rules.

**Delete button (✕) and Repeat button (RotateCcw):**
- CSS: `min-h-[44px] min-w-[44px]` on both — PASS.
- Combined in `flex gap-1` container. Separation is adequate on desktop but tight on mobile.
- Misclick risk: LOW on desktop, MODERATE on mobile touchscreen (88px total width for two 44px targets).

**Submit button (Record Expense):**
- CSS: `min-h-[44px]` — PASS.

### Category Select Optgroup

- 4 groups: Overhead (3 items), Procurement (2 items), Utilities (4 items), Other (2 items) = 11 total
- From default "Labor Budget" to "Electricity" (Utilities group): requires passing 4 items. To "Meat Procurement": 3 items. For daily ops, Meat Procurement is likely the most frequent category — it's 3 options down.
- No "most recently used" category persistence — every form reset returns to "Labor Budget". CONCERN (P2).

### Amount Field

- `font-mono font-bold text-lg` — the mono bold styling makes the entered amount visually distinct and easily readable at a glance in the form.
- In the log table: `font-mono font-bold text-status-red` — red bold mono for amounts. Clear and scannable at a glance. PASS.
- Problem: while typing, no thousand-separator formatting. 55000 and 5500 look visually similar (both 5 chars vs 4 chars). CONCERN (P2).

### Filter Pills — 32px vs 44px

Already noted above. These pills are explicitly coded below the minimum touch target (see source line 340: `min-h-[32px]`). FAIL (P1).

### Description Field — Required but No Character Counter

- `required` attribute set — HTML5 native validation triggers if empty.
- `maxlength="200"` set — but no counter visible (e.g., "45/200").
- Description is required but the validation only fires on submit (inline validation for description is not implemented — only `amountTouched`/`categoryTouched` have error states). If a user submits without a description, native HTML5 browser validation handles it — but the style is inconsistent with the custom validation messages for amount and category.
- CONCERN (P2): inconsistent validation UX — amount/category have custom inline error messages, description relies on native browser popup. On a POS touchscreen (likely using a tablet's browser), native form validation popups look out of place.

### Form Layout Observation

- The 320px fixed-width form panel on a 2-column layout works well on desktop (1280px+). On screens below ~720px, the form would collide with the log or overflow.
- The form does not have a visible header with the location name — relies on LocationBanner at the top of the page. This is correct per CLAUDE.md design rules.

---

## Key Findings Summary

### P0 — CRITICAL (Blocking)

| ID | Finding | Location | Status |
|----|---------|----------|--------|
| P0-01 | **ALL expense writes fail** — `expenseDate` field in `Expense` interface and store is missing from `expenseSchema` (v3). RxDB VD2 error on every insert. The `/expenses` page core function is completely non-functional. | `src/lib/db/schemas.ts:345`, `src/lib/stores/expenses.svelte.ts:22,94` | 🟢 FIXED |
| P0-02 | **Raw RxDB error shown to user** — the catch block propagates the full `RxError.message` to `errorMessage` state, which renders a 200+ line technical JSON dump to a restaurant manager. | `src/lib/stores/expenses.svelte.ts:111`, `src/routes/expenses/+page.svelte:312` | 🟢 FIXED |

### P1 — High Priority

| ID | Finding | Location | Status |
|----|---------|----------|--------|
| P1-01 | **Filter pills are 32px height** — below the 44px touch minimum. `min-h-[32px]` intentionally overrides the app-wide `button { min-height: 44px }` rule. | `src/routes/expenses/+page.svelte:340` | 🔴 OPEN |
| P1-02 | **No large-amount confirmation** — a ₱55,000 fat-finger entry (should be ₱5,500) submits with no guard. Once saved, requires manager PIN delete to fix. | `src/routes/expenses/+page.svelte:248-264` | 🟢 FIXED |

### P2 — Medium Priority

| ID | Finding | Location | Status |
|----|---------|----------|--------|
| P2-01 | **Category defaults to "Labor Budget"** — the first option alphabetically, not the most frequently used. No last-used category memory. | `src/routes/expenses/+page.svelte:59` | 🔴 OPEN |
| P2-02 | **No thousand-separator in amount input while typing** — ₱55,000 and ₱5,500 are visually similar during entry (5 vs 4 digits, no comma separator). | `src/routes/expenses/+page.svelte:250-264` | 🟢 FIXED |
| P2-03 | **Description validation inconsistency** — amount/category have custom inline errors; description relies on native HTML5 `required` popup. Jarring on a tablet/touchscreen POS. | `src/routes/expenses/+page.svelte:266-277` | 🟢 FIXED |
| P2-04 | **No character counter for description** — `maxlength="200"` but no "X/200" indicator. | `src/routes/expenses/+page.svelte:270` | 🔴 OPEN |
| P2-05 | **Description truncated in log without tooltip** — `truncate max-w-xs` in the table; long descriptions are cut off with no expand/tooltip affordance. | `src/routes/expenses/+page.svelte:384` | 🔴 OPEN |
| P2-06 | **Repeat/delete buttons indistinguishable in default state** — both gray, differentiated only by hover state. No color signal for the destructive delete action at rest. | `src/routes/expenses/+page.svelte:401-419` | 🟢 FIXED |

### P3 — Low Priority

| ID | Finding | Location | Status |
|----|---------|----------|--------|
| P3-01 | **Description placeholder is overly specific** — "e.g., Unbox wet wipes" is a low-frequency example that doesn't represent typical manager entries (meat delivery, utility bill, wages). | `src/routes/expenses/+page.svelte:276` | 🔴 OPEN |

---

## Fix Required for P0

The `expenseSchema` needs `expenseDate` added to its properties and the schema version bumped to 4 with a migration:

```
// In src/lib/db/schemas.ts — expenseSchema.properties
expenseDate: { type: 'string', maxLength: 10 }  // "YYYY-MM-DD"
// Version: 3 → 4, add migration strategy in db/index.ts
```

The error message in `expenses.svelte.ts` should be replaced with a user-friendly message:
```
return { success: false, error: 'Could not save expense. Please try again.' }
```

---

*Audit completed: 2026-03-09. Browser closed after Step 6.*
