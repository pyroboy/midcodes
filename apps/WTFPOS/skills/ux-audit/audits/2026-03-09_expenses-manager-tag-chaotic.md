# UX Audit — Expenses Creation Flow (Manager / Chaotic Scenarios)

**Date:** 2026-03-09
**Role:** Manager (Juan Reyes)
**Branch:** Alta Citta, Tagbilaran (`tag`)
**Viewport:** 1024 × 768 (tablet landscape)
**Auditor:** Claude Code (claude-sonnet-4-6)
**Audit Mode:** Single-User · Path A
**Scope:** `/expenses` — ALL expense types, extreme / chaotic edge cases

---

## A. ASCII Layout Map

### Full Page — Empty State (1024×768)

```
+-------[sidebar-rail: ~64px]--------+---[main content: ~960px]-----------+
| [W!] Toggle sidebar                | [📍] ALTA CITTA (TAGBILARAN)       |
|                                    |                         [Change Loc]|
| [Quick actions rail - 7 shortcuts] |------------------------------------|
|  Receive Delivery                  |                                     |
|  Log Expense   ← (links to        | [h1] Expenses      Total: ₱0.00    |
|  Log Waste        reports not      |                [All Time → red mono]|
|  Stock Count      /expenses!)      |------------------------------------|
|  X-Reading                         |                                     |
|  Transfer Stock                    | +--[Form: 320px]--+ +--[Log: flex]+ |
|  End of Day                        | | Record Expense  | | Expense Log | |
|                                    | |                 | |             | |
| [nav items]                        | | [Category v]    | | [Time] [Cat]| |
|  POS                               | | [Amount ₱]      | | [Desc] [Src]| |
|  Kitchen                           | | [Description]   | | [Photo] [₱] | |
|  Stock                             | | [Paid By v]     | | [✕]         | |
|  Reports                           | | [Receipt Photo] | |             | |
|                                    | |                 | |   📝 No     | |
| [J] Logout                         | | [➕ Record Exp] | |   expenses  | |
|                                    | |                 | |   yet.      | |
| [Toggle Sidebar]                   | +-----------------+ +-------------+ |
+------------------------------------+-------------------------------------+

~~FOLD LINE at ~768px~~ (bottom of screen)
Form is ABOVE FOLD ✓  |  Log panel is ABOVE FOLD ✓
```

### Full Page — Loaded State (8+ expenses)

```
+-------[sidebar-rail]---------------+---[main content]--------------------+
| [same sidebar as above]            | [LocationBanner: ALTA CITTA]        |
|------------------------------------|-------------------------------------|
|                                    | [h1] Expenses   Total: ₱38,437.00  |
|                                    |                                     |
|                                    | +--[Form: 320px]--+ +--[Log: flex]+ |
|                                    | | Record Expense  | | Expense Log | |
|                                    | | [Category  v]   | |─────────────| |
|                                    | | [Amount    ₱]   | | Time  Cat   | |
|                                    | | [Description]   | | Desc  Src   | |
|                                    | | [Paid By   v]   | | Photo  ₱  ✕ | |
|                                    | | [Receipt Photo] | |─────────────| |
|                                    | |                 | | 07:00 PM    | |
|                                    | | [➕ Record Exp] | | Meat Proc.  | |
|                                    | |                 | | Pork...     | |
|                                    | +-----------------+ | ₱8,500  ✕  | |
|                                    |   (h-fit, doesn't   | ...more...  | |
|                                    |   scroll with log)  | ↕ SCROLLS  | |
+------------------------------------+-----[calc(100vh-160px)-----------+

FORM is h-fit (doesn't scroll) ✓
LOG panel is h-[calc(100vh-160px)] with overflow-y-auto ✓
No date filter  ✗ (shows ALL-TIME data only)
```

### Modal State — No dedicated modal exists

```
The expenses flow has NO modal — it is a full inline form.
"Log Expense" quick action in sidebar links to /reports/expenses-daily?action=open
NOT to /expenses — this is a broken affordance.
```

---

## B. 14-Principle Assessment Table

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Category dropdown has 12 options exposed all at once in a flat `<select>`. At 1024×768, scrolling through `Labor Budget → Petty Cash → Meat Procurement → Produce & Sides → Utilities → Electricity → Gas/LPG → Water → Internet → Wages → Rent → Miscellaneous` requires reading the full list. No grouping (Overhead vs. Procurement vs. Utilities). | Group categories into 3–4 super-groups (Overhead / Procurement / Utilities / Other) with optgroup or a custom picker. |
| 2 | **Miller's Law** (chunking) | CONCERN | The Expense Log table shows 8 ungrouped rows on first view, all with the same visual weight. No date grouping (today vs. yesterday). The table header ("Time Category Description Source Photo Amount") tries to use 7 columns — exactly at Miller's limit. With "Amount" right-aligned and "Photo" center-aligned, scanning is not natural. | Group rows by date (Today / Yesterday / Older). Reduce columns on mobile/tablet — merge Photo into Description row. |
| 3 | **Fitts's Law** (target size/distance) | FAIL | The delete button (✕) on each expense row is a small `p-1 rounded` button — visually appears to be ~28–32px, well below the 44px minimum. Text is "✕" with no padding wrapper. On a touch screen at 1024×768, deleting an expense is error-prone because (a) the target is tiny and (b) it sits directly adjacent to the Amount cell. | Replace with a proper `min-h-[44px] min-w-[44px]` delete button or a slide-to-reveal gesture. |
| 4 | **Jakob's Law** (conventions) | CONCERN | The sidebar "Log Expense" quick action goes to `/reports/expenses-daily?action=open` — not to `/expenses`. Users who expect to log an expense via the quick action are taken somewhere different. The `/expenses` page is only reachable by navigating manually. This breaks the mental model of "I see Log Expense, I tap it, I log an expense." | Fix the "Log Expense" quick action to link to `/expenses` or ensure the modal at the target route matches what users expect. |
| 5 | **Doherty Threshold** (response time) | PASS | RxDB is local-first — writes happen in IndexedDB synchronously. After form submit, the expense appears in the log immediately (optimistic, local). The `isSubmitting` state is handled with a spinner emoji. No perceptible delay. However, the emoji spinner (⏳ animate-spin) is a character-rotation hack — it does not spin smoothly on all browsers. | Use a proper SVG spinner (e.g., lucide `Loader2`) instead of ⏳ character spin. |
| 6 | **Visibility of System Status** | FAIL | (A) The error message area only appears after validation fails — there is no inline validation hint before submit. (B) The Total shown is labeled "Total Recorded (All Time)" — this is DANGEROUSLY misleading during a manager's shift review. If a manager sees ₱38,437, they think that's today's total. It's not — it's lifetime. (C) After successful submit, there is no success toast, no confirmation message — the form just clears silently. | (A) Add live inline validation on blur. (B) Change total to "Today's Total" filtered by current business date. (C) Add a brief success confirmation (toast, or green flash on the new row). |
| 7 | **Gestalt: Proximity** | CONCERN | The form fields are grouped correctly with `gap-4` between each field. However, the "Receipt Photo" field (file picker) is visually detached from the submit button with just `gap-4` — same spacing as between all other fields. The submit button should feel like it belongs to the form group, but `mt-2` is the only distinction. | Add a visual separator (thin divider) between the photo field and the submit button, or increase `mt` on the button to `mt-4` to signal closure. |
| 8 | **Gestalt: Common Region** | PASS | The form lives in a `.rounded-xl.border.bg-white.p-5` card. The expense log lives in a separate `.rounded-xl.border.bg-white.shadow-sm` card. Two distinct regions, correctly separated. The "Expense Log" header bar has a `bg-gray-50` background differentiating it from the scrollable body. |  |
| 9 | **Visual Hierarchy (scale)** | CONCERN | The `[➕ Record Expense]` button is the primary action, but it is `.btn-primary` (correct) placed at the bottom of the form. The problem: at 1024×768 with all 5 fields visible, the button is ~5 form-fields down the page. The eye's first stop is the "Expenses" heading (h1), then "Record Expense" (h2), then the fields, then the button. The CTA is visually subordinate because the form structure dominates. | Keep the form structure, but make the submit button more prominent — wider, taller, or with an accent background panel behind it. Consider "floating footer" pin when form is tall. |
| 10 | **Visual Hierarchy (contrast)** | CONCERN | The Amount field uses `text-status-red` for the value color. While consistent with financial convention (red = expense), it means both the form input AND the log column use red for money. The form label "Amount (₱)" in `text-gray-500 uppercase text-xs` is visually smaller than expected for a key financial field. The total "₱38,437.00" in `text-status-red text-xl font-bold` is the visually dominant element on the page — competing with the form heading. | Reserve red color treatment for the log table amounts only. In the form, use standard `text-gray-900` for the amount while editing, with currency prefix in a calmer shade. |
| 11 | **WCAG: Color Contrast** | CONCERN | The delete button (`✕`) uses `text-gray-400` (default) which is `#9CA3AF` on white `#FFFFFF` — ratio ≈ 2.5:1. **FAIL AA** for normal text. On hover it becomes `hover:text-status-red` which is `#EF4444` on white = 4.0:1, borderline. The `text-gray-500` label text ("Total Recorded (All Time)") uses ≈4.6:1 which passes AA for small text — marginally. | Replace delete button default color from `text-gray-400` to `text-gray-500` (≈4.6:1) or use a proper icon-button with ARIA label. Add `aria-label="Delete expense"` to each ✕ button. |
| 12 | **WCAG: Touch Targets** | FAIL | Two critical violations: (1) The delete button `✕` is `p-1 rounded` = ~28px — below the 44px minimum. (2) The file input (`type=file`) with `capture="environment"` renders as a native OS file picker button — its size is browser-controlled and often renders as a thin button, not guaranteed to meet 44px. On a restaurant tablet in a kitchen-adjacent environment, this is a reliability hazard. | Wrap delete button in `min-h-[44px] min-w-[44px]` container. Replace file input with a custom `<button>` that triggers the input, with proper sizing. |
| 13 | **Consistency (internal)** | FAIL | Three inconsistencies: (1) The sidebar quick action "Log Expense" links to `/reports/expenses-daily?action=open` while the actual expense logging page is at `/expenses` — two separate "expense" surfaces that look identical from the nav. (2) Payment sources in "Paid By" (Petty Cash / Cash from Register / Company Card / Owner's Pocket) have no equivalent in the expense categories — "Petty Cash" appears as both a category AND a payment source, which is semantically confusing. (3) The success state (form clear) has no visual confirmation, while the error state has a red banner — asymmetric feedback. | Fix sidebar link. Rename "Petty Cash" category to "Petty Cash Replenishment" to distinguish from "Paid By: Petty Cash". Add success toast. |
| 14 | **Consistency (design system)** | PASS | The form uses `.pos-input` consistently on all fields. The submit button uses `.btn-primary`. The card container uses `.rounded-xl.border.border-border.bg-white`. Error message uses `bg-status-red-light text-status-red`. All design tokens are correctly applied. The page-level spacing uses standard `p-6 gap-6`. No rogue inline styles. |  |

**Summary: 2 FAIL · 7 CONCERN · 5 PASS**

---

## C. "Best Day Ever" Narrative

It's 1:47 PM at Alta Citta. The lunch rush is winding down and Maria at the counter hollers across to Juan — "Boss, yung delivery ng cooking oil kanina, sino magbabayad?" Juan just cashed out three tables, has an X-reading to do in 13 minutes, and a kitchen staff asking about the afternoon stock count. He pulls out the tablet.

He taps "Expenses" in the sidebar. The page loads fast — local-first, no spinner. He sees the form on the left, the log on the right. On a perfect day, he'd:
1. Glance at today's running total to know petty cash status
2. Select "Produce & Sides" from a clear category list
3. Type ₱450 — it pops in the big red mono font, feels decisive
4. Write "Cooking oil 5L delivery — Ganda Store" in the description
5. Hit "Record Expense" — the row appears instantly at the top of the log
6. Look confident when he shows Christopher the report tonight

**Where reality diverges from the ideal:**

The "Total Recorded (All Time)" label is the first thing that punches him in the face — ₱38,437. Is that today? This week? Ever? He doesn't know. During a busy shift, that ambiguity is anxiety-inducing. Is the kitchen burning through budget? Is there still petty cash? The number means nothing without a time frame.

The category dropdown: he's looking for "cooking oil" — it's not a category. He scrolls: Labor Budget, Petty Cash, Meat Procurement, Produce & Sides — ah, there. But "Petty Cash" as a category name above "Paid By: Petty Cash" in the next field... wait, which petty cash is which?

He fills the description, hits Record Expense. Success? The form clears. That's it. No "Saved ✓", no flash, no sound. Did it work? He looks at the log. Yes, there's his new row. But the anxiety of the silent confirmation cost him 2 seconds of doubt — in a noisy restaurant, that's real.

When the delivery rider asks for a ₱50 tip (spontaneous, not in the original plan), Juan has to do it again: Category → pick "Miscellaneous" (because that's the closest)... description... paid by... submit. Five taps. For a ₱50 tip. The quick-fire entry requires the full form cycle every time — no "quick add" or "duplicate last entry" shortcut.

The delete button: he accidentally created a duplicate. Finds the row, squints for the ✕. It's tiny. He taps it. It works, but his thumb grazed the amount cell first. On a better day, with better touch targets, that mistake wouldn't happen.

---

## D. Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | "Total Recorded (All Time)" is misleading — shows lifetime total not daily | Change total to show today's total (filter by business date = today), add a secondary label for all-time. Alternatively label clearly as "(All Time: ₱38,437 / Today: ₱1,450)" | S | High |
| **P0** | "Log Expense" sidebar quick action links to wrong page — `/reports/expenses-daily?action=open` instead of `/expenses` | Change the href in AppSidebar quick actions to `/expenses` | S | High |
| **P0** | Delete button (✕) violates 44px touch target minimum — estimated 28px rendered size | Wrap ✕ in `min-h-[44px] min-w-[44px] flex items-center justify-center` or restructure the delete cell | S | High |
| **P0** | No success feedback after expense is recorded — form clears silently | Add a brief success toast (2s, green, "Expense recorded") using the existing `alert.svelte.ts` store, or a local flash state | S | High |
| **P1** | Category dropdown has 12 flat options with no grouping — violates Hick's Law under stress | Group with `<optgroup>`: Overhead (Labor Budget, Wages, Rent) / Procurement (Meat Procurement, Produce & Sides) / Utilities (Utilities, Electricity, Gas/LPG, Water, Internet) / Other (Petty Cash, Miscellaneous) | S | Med |
| **P1** | "Petty Cash" appears as both a category AND a "Paid By" option — semantically ambiguous | Rename category to "Petty Cash Replenishment" or remove it as a category (petty cash is a payment source, not an expense type). Clarify the distinction in UI labels. | S | Med |
| **P1** | Expense log shows all-time data with no date filter — 8+ rows of mixed-date data overwhelming a shift review | Add a date filter (Today / This Week / All Time) above the log table. Default to Today. | M | High |
| **P1** | No inline validation — errors only shown after submit attempt | Add `onblur` validation on Amount (must be > 0) and Description (required). Show inline helper text below each field as user exits. | M | Med |
| **P1** | Emoji spinner (⏳ animate-spin) is a hack — the ⏳ character does not spin smoothly | Replace with `<Loader2 class="h-4 w-4 animate-spin" />` from lucide-svelte | S | Low |
| **P1** | No "duplicate last expense" or "quick repeat" feature — forces 5-field form cycle for every entry | Add a "Repeat" button on recent expense rows that pre-fills the form with the same category/paid-by | M | Med |
| **P2** | Amount field uses red text while editing — red is typically an error indicator | Consider gray text while editing, switching to red only in the log display | S | Low |
| **P2** | Receipt photo field uses native `<input type="file" capture="environment">` — renders as unstyled thin file picker | Replace with a styled `<button>` + `PhotoCapture.svelte` (which already exists in `src/lib/components/`) | M | Med |
| **P2** | No row count or summary in Expense Log header — "Expense Log" heading gives no count | Add "Expense Log (8 entries today)" to the header | S | Low |
| **P2** | The form is `h-fit` (not sticky) — if more fields are added in future, it may scroll out of view | Wrap form in a sticky container or make it a slide-up drawer for better mobile adaptability | L | Low |

---

## E. Chaos Report

### Scenario-by-Scenario Results

| # | Scenario | Status | What Happened | Verdict |
|---|---|---|---|---|
| 1 | **Empty state** | Tested | "No expenses recorded yet" with 📝 emoji + centered text. Visually appropriate. Total shows ₱0.00. Form renders correctly. The "Total Recorded (All Time)" label is visible even at ₱0.00, but at zero it's clearly empty so ambiguity is minimal. | SURVIVED |
| 2 | **Quick-fire entry (5 back-to-back)** | Code-analyzed | Each submission resets: `amount = ''`, `description = ''`, `receiptPhoto = null`. Category, Paid By, and Photo do NOT reset — they persist from last entry. This is partially good (no need to re-select common category) but can cause wrong category carry-over if the manager quickly switches expense types. No optimistic lock — rapid submits could cause duplicates if the button is tapped twice before `isSubmitting` activates. | DEGRADED |
| 3 | **All expense categories** | Tested (snapshot) | All 12 categories visible in dropdown — Labor Budget, Petty Cash, Meat Procurement, Produce & Sides, Utilities, Electricity, Gas/LPG, Water, Internet, Wages, Rent, Miscellaneous. All selectable. The category persists after submission — correct behavior for repeat-same-category entry. No issue with any specific category name rendering (all fit in single dropdown line). "Gas/LPG" truncates in narrow dropdowns. | SURVIVED |
| 4 | **Maximum amount (₱999,999.99)** | Code-analyzed | `validateExpense` allows up to `999999999` (nine 9s = ₱999,999,999). The HTML input uses `type="number" step="0.01" min="0"` with no `max` attribute. So the browser allows any number. The store validation will catch amounts above ₱999,999,999 but nothing between ₱999,999.99 and ₱999,999,998. Practically safe, but the max is unrealistically high for a petty cash system. | SURVIVED |
| 5 | **Zero amount (₱0)** | Code-analyzed | `validateExpense` checks `amount <= 0` → returns error "Amount must be a positive number". The page handler runs `parseFloat(amount)` and checks `!numAmount \|\| numAmount <= 0` — both guard against zero. Blank amount field: `parseFloat('')` = `NaN`, which is falsy, so it correctly triggers the error. Error message shown inline in the red banner above the submit button. | SURVIVED |
| 6 | **Decimal precision (₱123.456)** | Code-analyzed | `type="number" step="0.01"` — the browser rounds 123.456 to 123.46 on form submission in most browsers. But `bind:value={amount}` stores the raw string. `parseFloat('123.456')` = 123.456, which gets stored as-is in RxDB. `formatPeso()` likely uses `toLocaleString('en-PH')` which truncates to 2 decimals in display. The stored value in DB has 3 decimal places. Minor but could cause rounding discrepancy in reports. | DEGRADED (minor) |
| 7 | **Long description (200+ chars)** | Code-analyzed | `validateExpense` allows up to 500 characters. The HTML input is `type="text"` with no `maxlength` attribute — relies on store-level validation only. User can type 200+ chars, no visual counter shown. At 200+ chars in the table cell, `text-gray-600` text wraps or overflows. The Description column has no `truncate` or `max-w` class — it expands the row height. With 500-char descriptions, the table layout breaks visually. | DEGRADED |
| 8 | **Empty required fields** | Code-analyzed | Amount: `parseFloat('') = NaN` → caught by `!numAmount` check → error "Please enter a valid amount greater than 0". Description: has `required` attribute on the HTML input, but `handleSubmit` catches it via the amount check first (amount is checked before description). If amount is valid but description is empty, the store's `validateExpense` returns "Description is required". However, the UI never disables the submit button for empty required fields — it always shows as active orange, inviting incorrect taps. | DEGRADED |
| 9 | **Special characters in notes** | Code-analyzed | `<script>alert('xss')</script>` — Svelte automatically escapes HTML in `{exp.description}` template expressions, so XSS is not a risk. `₱₱₱` — stored and rendered as-is. `"'--` — no SQL injection risk (RxDB/IndexedDB). The description is trimmed via `description.trim()` but no sanitization beyond that. 500-char limit on description only. Special chars display correctly in the table. | SURVIVED |
| 10 | **Payment method switching (Cash/GCash/Maya)** | Code-analyzed | "Paid By" select has: Petty Cash, Cash from Register, Company Card, Owner's Pocket. There is NO GCash or Maya option — these are payment methods for sales, not expense sources. The Paid By field reflects how the expense was funded (petty cash vs. card), which is correct for expense tracking. However, if a manager pays a vendor via GCash directly, there's no option to record it. The persisted value after submit means rapid switching between "Company Card" and "Petty Cash" could cause wrong attribution. | DEGRADED (missing payment methods) |
| 11 | **Date edge cases** | Code-analyzed | There is NO date field on the expense form. All expenses are recorded with `createdAt: new Date().toISOString()` — always the current timestamp. There is no way to backdate an expense (e.g., if a receipt comes in the next day). This is a functional gap but not a UX crash. | DEGRADED (feature gap) |
| 12 | **Cancel mid-entry / Reopen** | Code-analyzed | There is no cancel button on the form. The form is always visible — it cannot be dismissed. "Cancel" means the user simply navigates away or clears fields manually. If a manager starts filling an expense and then gets called to the floor, returns 5 minutes later, the form still has their partial input (because it's `$state` — survives SvelteKit's page visits as long as the component stays mounted). Good context preservation on same-page. But navigation away resets state. | SURVIVED |
| 13 | **Loaded state (10+ expenses, scroll)** | Tested | With 8+ expenses from seed data, the table renders in a `h-[calc(100vh-160px)]` container with `overflow-y-auto`. Sticky table header correctly pins the column headers. Rows alternate `hover:bg-gray-50 transition-colors` for scanability. The ₱ amounts are right-aligned in mono font — easy to scan vertically. However, there is no sort control (default is `createdAt: 'desc'` from the store query — newest first). No pagination. With 100+ expenses, all render at once (potential performance issue). | SURVIVED (with performance caveat) |
| 14 | **Delete/void an expense** | Tested | Delete button (`✕`) exists on each row. Calls `deleteExpense(exp.id)` which does `doc.remove()` in RxDB. No confirmation dialog — single tap deletes immediately. No undo. For a manager who accidentally deletes a ₱8,500 meat procurement entry, this is a HIGH cost action with no recovery path. `deleteExpense` is not guarded by manager PIN (unlike voids in POS). The delete fires silently — no toast, no confirmation, no audit log entry (only `addExpense` logs to audit, not `deleteExpense`). | BROKEN |

---

### Chaos Report Summary Table

| Scenario | Status |
|---|---|
| Empty state | SURVIVED |
| Quick-fire entry | DEGRADED |
| All expense categories | SURVIVED |
| Maximum amount | SURVIVED |
| Zero amount | SURVIVED |
| Decimal precision | DEGRADED |
| Long description | DEGRADED |
| Empty required fields | DEGRADED |
| Special characters | SURVIVED |
| Payment method switching | DEGRADED |
| Date edge cases | DEGRADED |
| Cancel mid-entry | SURVIVED |
| Loaded state | SURVIVED |
| Delete/void expense | BROKEN |

**Tallied: 6 SURVIVED / 7 DEGRADED / 1 BROKEN**

---

## F. Additional Observations

### Browser Automation Stability Finding (Meta-Observation)
During live testing, the expenses page frequently redirected to `/pos` due to a competing session state in concurrent browser tabs. This behavior — where `sessionStorage` was set for the manager but the page rendered from a different session context — indicates that the **session restoration logic reads from a previous tab's `sessionStorage`** when multiple sessions are open. This is a real concern in a restaurant environment where a tablet might be shared between staff sessions via the same browser instance. This was not part of the original audit scope but is a meaningful finding.

### "Log Expense" Mismatch (Critical Navigation Issue)
The sidebar quick action labeled "Log Expense" links to `/reports/expenses-daily?action=open` — not to `/expenses`. This means:
- A manager who uses the quick-action panel goes to a different surface than the one being audited
- Two "expense" entry points exist with unclear differentiation
- This may be intentional (reports-integrated expense logging) but creates a confusing information architecture

### Missing GCash/Maya in Paid By
In a Philippine restaurant context where GCash and Maya are common payment methods used by managers for vendor payments, their absence in the "Paid By" field is a functional gap. This matters for BIR compliance (tracking digital payments vs. cash).

### Audit Log Gap in Delete
`addExpense` correctly calls `log.expenseLogged(category, amount, description)`. But `deleteExpense` has no audit log call. This means expense deletions are untracked — a compliance and accountability risk.

---

## G. Final Verdict

**Verdict counts:** 2 FAIL · 7 CONCERN · 5 PASS
**P0 count:** 4
**Chaos results:** 6 SURVIVED · 7 DEGRADED · 1 BROKEN
**Overall score: 5.5 / 10**

This flow is **not ready for unsupervised service** — the "Total Recorded (All Time)" label will consistently mislead managers during shift reviews (P0), the broken "Log Expense" quick action sends users to the wrong page (P0), delete has no confirmation or audit trail (P0-equivalent, filed as P0 in recommendations), and touch targets for delete are below the 44px minimum (P0). None of these are individually catastrophic, but together they create a pattern of silent failures and misleading data that will cause real operational errors during busy shifts.

---

*Audit conducted via playwright-cli snapshot analysis, source code inspection (`+page.svelte`, `expenses.svelte.ts`, `expenses.utils.ts`, `session.svelte.ts`, `+layout.svelte`), and accessibility tree evaluation at 1024×768 viewport.*
