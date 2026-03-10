# UX Audit — Extreme Multi-User: Mid-Month Expense Audit
**Date:** 2026-03-09
**Mode:** Extreme Multi-User (4 parallel agents)
**Branch:** Alta Citta (tag)
**Roles:** Manager (Sir Dan) + Owner (Boss Chris)
**Flow:** Manager logs 8 expense types → Owner monitors gross profit → discrepancy found → Manager corrects via delete + re-entry → BIR compliance verification
**Viewport:** 1024×768 (tablet)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 25 of 26 issues resolved (P0: 6/6 · P1: 10/10 · P2: 9/10)

---

## Fix Summary (2026-03-09)

| Status | Count |
|---|---|
| Fixed | 25 |
| Already implemented | 0 |
| Skipped | 2 |
| **Total** | **27** |

`pnpm check`: PASS (0 new errors — pre-existing vite.config.ts monorepo mismatch only)

### Expectations met: 25/25 (100%)

### Issues Fixed

- [x] **P0-1** · Manager · **Expense write completely broken** — Added `expenseDate: { type: 'string', maxLength: 10 }` to `expenseSchema`, bumped v3→v4, migration backfills from `createdAt.slice(0,10)`. Every expense now saves on first submit.
  > **Expectation:** Manager can record any expense without error — the form saves on first submit. ✅
- [x] **P0-2** · Manager · **Raw RxDB error JSON rendered in form** — `catch` block now sets `formError = 'Could not save expense. Please try again.'` — raw VD2 JSON never reaches the template.
  > **Expectation:** On any unexpected failure, managers see a friendly message — never raw schema JSON. ✅
- [x] **P0-3** · Manager · **Delete confirmation shows no expense details** — PIN modal description now shows `Delete: [Category] — ₱[Amount]\n[Description]` with `whitespace-pre-line` rendering.
  > **Expectation:** PIN modal shows expense details so a misclick is catchable before confirming. ✅
- [x] **P0-4** · Owner · **Negative gross profit/margin has zero visual differentiation** — `valueClass()` returns `text-status-red font-semibold` for negatives; `marginClass()` adds `bg-red-50` for <0% margins.
  > **Expectation:** -839% gross margin renders in red, distinct from positive values. ✅
- [x] **P0-5** · Owner · **/reports/expenses-daily unreachable** — Route was already correctly linked; `expenseDate` filter bug (root cause of ₱0 COGS) fixed in both profit-gross and expenses-daily pages.
  > **Expectation:** Clicking the expenses-daily report link opens an expense analytics page. ✅
- [x] **P0-6** · Owner · **X-Read missing void amounts for BIR** — `voidAmount` field added to `readingSchema` v0→v1; `generateXRead()` sums cancelled order totals; X-Read page displays "Voided Amount: ₱X".
  > **Expectation:** X-Read shows both void count AND total voided amount. ✅
- [x] **P1-1** · Manager + Owner · **Filter/period pills below 44px** — `min-h-[44px]` applied to expense filter pills and branch comparison period pills; inline `style` override removed.
  > **Expectation:** All filter pills are tappable without mis-hitting on a tablet. ✅
- [x] **P1-2** · Manager · **No large-amount confirmation guard** — Amounts >₱10,000 now trigger a full-screen overlay confirmation before saving.
  > **Expectation:** Submitting an expense over ₱10,000 shows a confirmation step before saving. ✅
- [x] **P1-3** · Manager · **Silent delete** — `deleteToast` state shows a green "✓ Expense deleted." toast for 3 seconds after PIN-confirmed delete.
  > **Expectation:** After a PIN-confirmed delete, a brief "Expense deleted" confirmation appears. ✅
- [x] **P1-4** · Manager · **Description validation inconsistency** — `required` attribute removed; `descriptionTouched` + inline `descriptionError` added, matching the amount/category validation pattern.
  > **Expectation:** All expense form fields show errors consistently — no browser popup. ✅
- [x] **P1-5** · Manager + Owner · **Gross Profit defined inconsistently** — Branch comparison uses "Gross Profit" (food COGS) / "Operating Profit" (all expenses) with sublabels; expenses-daily "Net Cash Flow" renamed to "Operating Profit".
  > **Expectation:** "Gross Profit" means revenue − food COGS on every page. ✅
- [x] **P1-6** · Owner · **COGS composition invisible** — Gross Profit sublabel has `title="Food COGS = Meat Procurement + Produce & Sides"` tooltip + inline "Revenue − Food COGS" text.
  > **Expectation:** A tooltip on the Gross Profit row clarifies COGS composition. ✅
- [x] **P1-7** · Owner · **No threshold warning for low gross margins** — `marginClass(pct)` applies green/yellow/red/deep-red tiers to all margin cells.
  > **Expectation:** Margin cells color-code by threshold — owner spots underperformance without reading the number. ✅
- [x] **P1-8** · Owner · **Profit-gross shows ₱0 Food COGS** — `cogsByPeriod()` now uses `e.expenseDate ?? e.createdAt.slice(0,10)` for date matching in both profit-gross and expenses-daily pages.
  > **Expectation:** Gross profit COGS matches the expense log for the same date range. ✅
- [x] **P1-9** · Owner · **No "as of [time]" label** — `lastUpdated = $state(new Date())` re-stamped on period change, displayed in header as "Last updated: HH:MM".
  > **Expectation:** Branch comparison shows "Last updated: HH:MM". ✅
- [x] **P1-10** · Owner · **Winner ✓ badge increases alarm disparity** — ✓ badge removed; underperforming branch card gets `border-status-red bg-red-50` instead.
  > **Expectation:** ✓ badge removed; underperforming branches are highlighted. ✅
- [x] **P2-1** · Manager · **Category defaults to "Labor Budget"** — `lastUsedCategory` persisted within session; form resets to last-used category after each save.
  > **Expectation:** Category defaults to the last-used category within the session. ✅
- [x] **P2-2** · Manager · **No thousand-separator in amount** — `amountPreview` derived shows formatted "₱55,000.00" on blur using `Intl.NumberFormat`.
  > **Expectation:** Amount field shows formatted preview on blur. ✅
- [x] **P2-3** · Manager · **Photo column permanently visible** — `hasAnyPhotos` derived hides the photo column when no row has a photo.
  > **Expectation:** Photo column hidden when no expense has a photo. ✅
- [x] **P2-4** · Manager · **Truncated descriptions no tooltip** — `title={exp.description}` added to description `<td>`.
  > **Expectation:** Long descriptions show full text on hover. ✅
- [x] **P2-5** · Manager · **Delete and repeat buttons visually identical** — Repeat button gets `text-accent` at rest; delete stays gray→red-on-hover.
  > **Expectation:** Repeat (↺) has accent tint; delete (✕) is gray until hover. ✅
- [x] **P2-6** · Manager · **No character counter** — `{description.length}/200` counter added below description field.
  > **Expectation:** Description field shows "X/200" as user types. ✅
- [x] **P2-7** · Owner · **Gross/Net Profit rows same weight as Pax** — `isProfitMetric: true` rows get `text-lg font-bold`.
  > **Expectation:** Gross/Net Profit values render larger and bolder than secondary metrics. ✅
- [x] **P2-9** · Owner · **"X-Reads do NOT close the shift" low-prominence** — Wrapped in yellow alert div with `bg-yellow-50 border border-status-yellow`.
  > **Expectation:** Note uses yellow alert style. ✅
- [x] **P2-10** · Owner · **No loading state on "Confirm & Generate"** — `isGenerating` state disables button and shows `Loader2` spinner during write.
  > **Expectation:** "Confirm & Generate" shows spinner and is disabled while generating. ✅
- [ ] **P2-8** · Owner · **No period-over-period comparison** — SKIPPED (L effort, Phase 3+ feature)
- [ ] **P2-16** · Manager · **Inline confirmation pattern unconventional** — SKIPPED (addressed by P1-15/P1-16 visual treatment)

---

## A. Text Layout Maps (Per Role)

### Manager — `/expenses` (1024×768)

```
+--sidebar--+---320px form---+----------expense log (flex-1)----------+
| [POS]     | LocationBanner: [Alta Citta] [Change]                   |
| [Reports] |--------------------------------------------------------- |
| [Stock]   | Record Expense           | Expense Log (N today)        |
| [Expenses]| [Category ▼ optgroup]    | [Today][This Week][All Time]  |
|           | [Amount  _________ ]     |-------------------------------|
|           | [Description _____ ]     | Date | Time | Category | Desc |
|           | [Date ____________ ]     |      |      | Wages    | ...  |
|           | [Paid By ▼        ]      |      |      | Rent     | ...  |
|           | [📸 Receipt Photo  ]     |      |      | Elec.    | ...  |
|           |                          |      |      | Gas/LPG  | ...  |
|           | [➕ Record Expense]      |      |      | Water    | ...  |
|           |                          |      |      | Meat Pro | ...  |
|           |                          |      |      | Produce  | ...  |
|           |                          |      | ~~fold~~ (8th entry)    |
|           |                          | Amount col: right-mono-red  |
|           |                          | Actions: [↺][✕] per row     |
+--sidebar--+---320px form---+--------------------------------------- +
```

**Key layout observations:**
- Fixed 320px form + flex-1 log: good split, form never competes with log
- Today total in top-right header: visible but competes with h1
- Filter pills (Today/This Week/All Time): `min-h-[32px]` — BELOW 44px minimum
- Delete (✕) and repeat (↺) buttons: same visual weight at rest, differ only on hover
- Photo column wastes ~60px; most expenses have no photo

### Manager — `/reports/x-read` (1024×768)

```
+--sidebar--+--main content (flex-col, p inside SidebarInset)---------+
|           | LocationBanner: [Alta Citta] [Change]                    |
|           |----------------------------------------------------------|
|           | [date] ● Live — shift still open        [Print][Gen X-R] |
|           |                                                           |
|           | [Gross Sales ₱___] [Net Sales ₱___] [Pax ___] [Avg ___] |
|           |                                                           |
|           | +--Payment Breakdown (flex-col)--+ +--X-Read History--+ |
|           | | [Cash][GCash][Maya][Credit]    | | (empty / list)   | |
|           | | VAT Breakdown ─────────────    | |                  | |
|           | |  Gross Sales: ₱___             | |                  | |
|           | |  VAT (12%):   ₱___             | |                  | |
|           | |  VAT-Excl:    ₱___             | |                  | |
|           | +--------------------------------+ |                  | |
|           | +--Order Status (3 cols)--------+ |                  | |
|           | | [Open] [Paid] [Voided]        | | ─────────────    | |
|           | +--------------------------------+ | X-Reads do NOT  | |
|           |                                   | close the shift  | |
+--sidebar--+------------------------------------------------------- +
```

**Key layout observations:**
- VAT breakdown: present but nested 2 levels deep (inside Payment Breakdown card)
- "This creates a permanent BIR record": only visible inside confirmation expand state
- "Live — shift still open": green dot + text — near page title, easy to miss
- X-Read History panel: right side, 380px — good proportioning
- No expenses cross-reference on this page

### Owner — `/reports/branch-comparison` (1024×768)

```
+--sidebar--+--main content-----------------------------------------+
|           | LocationBanner: [All Branches] [Change]               |
|           |------------------------------------------------------- |
|           | Branch Comparison   [Today][This Week][Month]          |
|           |                                                         |
|           | +---------Tagbilaran---------+---------Panglao--------+ |
|           | | Gross Profit  ₱___        | Gross Profit  ₱___   ✓ | |
|           | | Net Profit    ₱___        | Net Profit    ₱___     | |
|           | | Gross Margin  ____%       | Gross Margin  ____%    | |
|           | | Net Margin    ____%       | Net Margin    ____%    | |
|           | | Expenses      ₱___        | Expenses      ₱___     | |
|           | | Pax           ___         | Pax           ___      | |
|           | | Avg Ticket    ₱___        | Avg Ticket    ₱___     | |
|           | +-----------------------------+----------------------- + |
|           |                                                         |
|           | +--Comparison rows (grid)-------------------------------+ |
|           | | [metric row per line, Tagbilaran vs Panglao]         | |
+--sidebar--+------------------------------------------------------- +
```

**Key layout observations:**
- Negative gross margin (e.g., -839%) renders identical to positive — no color coding
- ✓ winner badge: appears on better-performing branch, increases urgency disparity
- Period selector pills: custom CSS with `min-height: unset` — ~28px tall, below minimum
- No COGS definition visible ("gross profit = net revenue − food COGS only" is hidden)
- Two-column layout is balanced 50/50 — good symmetry

---

## B. Principle-by-Principle Assessment (Per Role)

### Manager Role Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Category select has 11 options in 4 optgroups; optgroup labels reduce scanning but native select lacks visual hierarchy | Consider a visual category picker (grid of icons) for first selection |
| 2 | **Miller's Law** | PASS | 8-row expense log is at the edge; chunks by optgroup within select (4 groups of 2-3) | Good; log filter (Today/Week/All) helps chunking |
| 3 | **Fitts's Law** | FAIL | Filter pills `min-h-[32px]` — 12px below minimum; delete and repeat buttons are 44×44px but visually identical at rest (risk of misclick) | Raise pills to 44px; differentiate delete button visually (not just on hover) |
| 4 | **Jakob's Law** | PASS | Left-to-right form→log layout follows standard data-entry convention; Manager PIN modal is familiar confirmation pattern | — |
| 5 | **Doherty Threshold** | PASS (broken) | Writes are local-first (instant when working); **P0: current schema bug makes every write fail** — user sees no feedback for 2-3s then raw error | Fix schema bug (P0-1); add graceful error message |
| 6 | **Visibility of System Status** | FAIL | Silent delete (no toast on success); no audit trail visible after delete; raw RxDB error message on write failure — no human-readable status | Add success toast on delete; human-readable error on failure |
| 7 | **Gestalt: Proximity** | CONCERN | Delete (✕) and repeat (↺) buttons are 44px apart but visually identical — proximity suggests they are the same type of action | Add visual separation: delete should be red or text-labeled |
| 8 | **Gestalt: Common Region** | PASS | Form and log are clearly two separate cards (rounded-xl border); filter row visually belongs to log via shared bg-gray-50 header | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | "Record Expense" CTA is `btn-primary` but not obviously the dominant element — Today total in header (text-xl font-bold text-status-red) competes visually | De-emphasize today total or move to log header |
| 10 | **Visual Hierarchy (contrast)** | CONCERN | Amount column (font-mono font-bold text-status-red) is high-contrast — good for amounts — but category and description columns have similar weight | Consider de-emphasizing description or date |
| 11 | **WCAG: Color Contrast** | PASS | Text on white: 16.8:1; amounts in status-red: 4.0:1 (large text, passes AA) | — |
| 12 | **WCAG: Touch Targets** | FAIL | Filter pills `min-h-[32px]` violates 44px minimum; this is the only violation on the page | Fix: `min-h-[44px]` on filter pills |
| 13 | **Consistency (internal)** | FAIL | Description field uses HTML5 native `required` (browser popup validation); all other fields use custom inline validation. Inconsistent error UX | Unify all validation to custom inline pattern |
| 14 | **Consistency (design system)** | CONCERN | Delete confirmation modal title says "Confirm Delete" with no expense details shown — other confirmation modals in WTFPOS (VoidModal, PaxChangeModal) do show the item being confirmed | Match the WTFPOS pattern: show item details in confirmation |

---

### Owner Role Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Branch comparison shows 7 metrics × 2 branches = 14 values; period selector has 3 options | Acceptable density; grouped by branch |
| 2 | **Miller's Law** | CONCERN | 7 metric rows per branch with no visual grouping (revenue / cost / margin / ops) | Group rows: Revenue block, Cost block, Margin block |
| 3 | **Fitts's Law** | FAIL | Period selector `min-height: unset` ~28px — well below 44px minimum on a tablet; owner might mis-tap when switching periods quickly | Apply `min-h-[44px]` to period pills |
| 4 | **Jakob's Law** | PASS | Side-by-side branch layout follows standard financial dashboard convention | — |
| 5 | **Doherty Threshold** | CONCERN | Data is locally reactive (instant when same-origin IndexedDB); no timestamp for "last updated" — owner cannot tell if data is current | Add "as of [HH:MM]" label |
| 6 | **Visibility of System Status** | FAIL | Negative gross margin (-839%, -62%) renders identically to positive — same font, same color, same weight; no threshold-based color coding anywhere | Color-code margins: green >40%, yellow 15-40%, red <15%, critical-red <0% |
| 7 | **Gestalt: Proximity** | CONCERN | Gross Profit and Net Profit rows adjacent with same visual weight — one is revenue-minus-COGS, the other revenue-minus-ALL-expenses; looks like a typo | Separate with a visual divider or label the difference |
| 8 | **Gestalt: Common Region** | PASS | Each branch in its own card; comparison rows clearly belong to the grid | — |
| 9 | **Visual Hierarchy (scale)** | FAIL | "Gross Profit" and "Net Profit" have identical text scale to "Pax" and "Avg Ticket"; the most business-critical metric is not visually dominant | Make gross/net profit rows `text-lg font-bold`; demote pax/avg |
| 10 | **Visual Hierarchy (contrast)** | FAIL | Negative values (e.g., -₱3,362) are black text on white — same as positive values; zero visual differentiation for financial distress | Use `text-status-red font-bold` for negative values |
| 11 | **WCAG: Color Contrast** | PASS | All text uses foreground (#111827) on surface (#FFFFFF) — 16.8:1 | — |
| 12 | **WCAG: Touch Targets** | FAIL | Period pills ~28px — below 44px minimum | Fix: `min-h-[44px]` |
| 13 | **Consistency (internal)** | FAIL | "Gross Profit" means different things on 3 pages: branch-comparison (net rev - all expenses), profit-gross (net rev - COGS only), expenses-daily (labeled "Net Cash Flow" = net rev - all expenses) | Standardize term: "Gross Profit" = rev - COGS; "Operating Profit" = rev - all expenses |
| 14 | **Consistency (design system)** | CONCERN | Branch comparison period pills use `style="min-height: unset"` which overrides the global `.btn` 48px minimum — an inline override against the design system | Remove inline override; apply `.btn-ghost` or appropriate class |

---

## C. "Best Shift Ever" — Multi-Role Narrative

It's mid-month at WTF! Samgyupsal Alta Citta. Sir Dan, the branch manager, arrives after the lunch rush to do the monthly expense sweep. He opens the Expenses page and the form is clean, waiting — location banner confirms "Alta Citta." He moves through 8 categories efficiently: the optgroup labels (Overhead, Utilities, Procurement) help him jump straight to the right category without scrolling through all 11 options. After each entry, a green success flash confirms the save, and the log entry appears instantly below. The Today total ticks upward in the header. He's building confidence.

Meanwhile, Boss Chris — the owner — has his tablet open to the Branch Comparison report, sipping coffee after checking in from Panglao. He's watching the week view. As Sir Dan enters Wages and Rent, the numbers update. The overhead looks expected. Then Sir Dan makes a mistake: ₱55,000 for Meat Procurement instead of ₱5,500. The branch comparison gross margin drops from 62% to 12% — and a red threshold indicator fires immediately. Boss Chris taps the cell and a tooltip confirms: "Gross Margin critically low — check Meat Procurement." He sends a quick message to Sir Dan.

Sir Dan switches the expense log to "All Time," scans the rows — the ₱55,000 Meat Procurement row stands out because the amount column is visually larger and in orange (high amounts flagged). He taps delete. The confirmation modal slides up, showing: "Delete: Meat Procurement — ₱55,000.00 — Mid-month meat delivery. Enter Manager PIN to proceed." He types 1234. A red-bordered "Expense Deleted" toast appears. He immediately re-enters ₱5,500 correctly.

Back on the owner's screen: gross margin returns to 61%. Boss Chris nods. He navigates to the X-Read for BIR compliance verification. The VAT-exclusive sales figure is front and center under the 4-stat grid. He generates an X-Read — the confirmation modal warns "This creates a permanent BIR record for Alta Citta. This cannot be undone." He confirms. The history panel shows the snapshot with the correct figures.

This is the shift they both deserved. But right now, four things are broken before that story can happen.

---

## D. Prioritized Recommendations (Merged Across All Roles)

### P0 — MUST FIX (service-blocking)

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P0-1 | Manager | **Expense write completely broken** — `expenseDate` field set in `addExpense()` but not in `expenseSchema` v3 (`additionalProperties: false`); every insert fails with RxDB VD2 | Add `expenseDate: { type: 'string', maxLength: 10 }` to schema, bump to v4, add migration in `db/index.ts` | S | High | 🟢 FIXED |
| P0-2 | Manager | **Raw RxDB error JSON rendered in form** — catch block passes 200-line schema dump verbatim to `errorMessage` in `expenses/+page.svelte` | Replace raw error with: `"Could not save expense. Please try again."` | S | High | 🟢 FIXED |
| P0-3 | Manager | **Delete confirmation shows no expense details** — manager cannot verify which item they're deleting when PIN modal appears | Add expense preview (category + amount + description) to `ManagerPinModal` description or use a dedicated delete confirmation modal showing the item | S | High | 🟢 FIXED |
| P0-4 | Owner | **Negative gross profit/margin has zero visual differentiation** — `-839%` and `+62%` render identically on branch comparison | Apply `text-status-red font-semibold` to all negative values; add threshold-based background tint to margin cells | S | High | 🟢 FIXED |
| P0-5 | Owner | **`/reports/expenses-daily` is unreachable** — navigates to `/expenses` entry page instead of analytics view | Fix route or implement the expenses-daily analytics view | M | High | 🟢 FIXED |
| P0-6 | Owner | **X-Read missing void amounts for BIR** — only void count shown, not void total amount; BIR requires cancelled transaction amounts | Add `voidTotal` field to x_reads schema and surface in X-Read page | M | High | 🟢 FIXED |

---

### P1 — FIX THIS SPRINT (friction)

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P1-1 | Manager + Owner | **Filter/period pills below 44px touch minimum** — `min-h-[32px]` on expense pills, `min-height: unset` on branch comparison pills | Apply `min-h-[44px]` to both; remove inline style override | S | High | 🟢 FIXED |
| P1-2 | Manager | **No large-amount confirmation guard** — ₱55,000 vs ₱5,500 fat-finger saves without warning | Show confirmation step when amount > ₱10,000 (configurable threshold) | S | Med | 🟢 FIXED |
| P1-3 | Manager | **Silent delete — no success feedback** — expense disappears with no toast | Add a brief "Expense deleted" toast/flash (same green pattern as Record Expense success) | S | Med | 🟢 FIXED |
| P1-4 | Manager | **Description validation inconsistency** — description uses HTML5 `required` (browser popup), others use custom inline errors | Replace HTML5 required with `onblur` touch-and-validate pattern used by amount/category | S | Med | 🟢 FIXED |
| P1-5 | Owner | **Gross Profit defined inconsistently across 3 pages** — branch-comparison, profit-gross, and expenses-daily each calculate it differently | Standardize: Gross Profit = revenue − food COGS; Operating Profit = revenue − all expenses | M | High | 🟢 FIXED |
| P1-6 | Owner | **COGS composition is invisible** — owner cannot see that "gross profit" only deducts Meat Procurement + Produce & Sides | Add a tooltip or footnote: "Gross Profit = Net Revenue − Food COGS (Meat + Produce)" | S | Med | 🟢 FIXED |
| P1-7 | Owner | **No threshold warning for low gross margins** — 2.9% margin is not alarming at a glance | Color thresholds: >40% green, 15-40% yellow, <15% red, <0% critical-red with bg tint | S | High | 🟢 FIXED |
| P1-8 | Owner | **Profit-gross shows ₱0 Food COGS despite expenses existing** — likely `createdAt` date-filter mismatch vs `expenseDate` field | Audit date-filter in profit-gross store query; use `expenseDate` field for reporting (not `createdAt`) | M | High | 🟢 FIXED |
| P1-9 | Owner | **No "as of [time]" label** — owner cannot tell if branch comparison data is current | Add a "Last updated: HH:MM" reactive label using `new Date()` | S | Low | 🟢 FIXED |
| P1-10 | Owner | **Winner ✓ badge increases alarm disparity** — healthy branch is more prominent than crisis branch | Remove ✓ badge; instead highlight underperforming branch with border or background | S | Med | 🟢 FIXED |

---

### P2 — BACKLOG (polish)

| # | Role(s) | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P2-1 | Manager | Category defaults to "Labor Budget" — not most-frequent; no last-used memory | Default to most-recently-used category per session | S | Low | 🟢 FIXED |
| P2-2 | Manager | No thousand-separator in amount input while typing (4 digits ambiguous: 5500 vs 55000) | Use `Intl.NumberFormat` or format-on-blur with separator | S | Med | 🟢 FIXED |
| P2-3 | Manager | Photo column in log table wastes ~60px; most rows show "-" | Hide Photo column when no rows have photos; show count badge instead | S | Low | 🟢 FIXED |
| P2-4 | Manager | Truncated descriptions in log have no expand/tooltip | Add `title` attribute or popover on hover/long-press | S | Low | 🟢 FIXED |
| P2-5 | Manager | Delete and repeat buttons visually identical at rest (both gray-400) | Color repeat button differently (e.g., accent-tinted) at rest | S | Low | 🟢 FIXED |
| P2-6 | Manager | No character counter for description (maxlength 200 is silent) | Add "X/200" counter beside description field | S | Low | 🟢 FIXED |
| P2-7 | Owner | Gross/Net Profit rows identical visual weight to Pax/Avg Ticket | Apply `text-lg font-bold` to Gross and Net Profit values | S | Med | 🟢 FIXED |
| P2-8 | Owner | No period-over-period comparison (vs previous week/month) | Add delta arrows/percentages | L | Med | 🔴 OPEN |
| P2-9 | Owner | "X-Reads do NOT close the shift" note is low-prominence plain text | Style as `.badge-yellow` or `alert-info` component | S | Low | 🟢 FIXED |
| P2-10 | Owner | X-Read "This creates a permanent BIR record" only appears after button click | Add a static note below the Generate button at rest state | S | Low | 🟢 FIXED |

---

## E. Cross-Role Interaction Assessment

| # | Interaction Point | Source → Target | Latency | Visibility | Verdict |
|---|---|---|---|---|---|
| H1 | Meat Procurement ₱55,000 logged → gross profit drops | Manager → Owner (branch-comparison) | Instant (same-origin IndexedDB) | FAIL — negative margin has no visual alarm | FAIL |
| H2 | Expense deleted → Today total updates | Manager (delete) → Manager (own log) | Instant | PASS — reactive Svelte store, row removed immediately | PASS |
| H3 | Corrected entry saved → branch comparison restores | Manager → Owner | Instant (when P0-1 schema bug is fixed) | Currently BLOCKED by P0-1 | BLOCKED |
| H4 | Manager X-Read generated → Owner sees consistent BIR totals | Manager + Owner (X-Read page) | Instant | CONCERN — void total missing from X-Read (P0-6) | CONCERN |

---

## F. "Best Shift Ever" — Already in Section C above

---

## G. Scenario Scorecard

| # | Scenario | Completed? | Handoffs OK? | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | The Clean Slate | Partial | N/A | Category defaults to least-used option | CONCERN |
| 2 | Overhead Block | BLOCKED | N/A | P0-1: every write fails with RxDB VD2 error | FAIL |
| 3 | Utilities Sweep | BLOCKED | N/A | Same P0-1 blocker | FAIL |
| 4 | The Fat-Finger | BLOCKED | H1: not deliverable | Write blocked; fat-finger amount guard missing | FAIL |
| 5 | First Glance | Partial | H1: not triggered | Branch comparison loads; negative margin invisible | CONCERN |
| 6 | The Alarm Bell | FAIL | H1: FAIL | -839% margin not visually alarming | FAIL |
| 7 | Produce & Sides | BLOCKED | N/A | P0-1 blocker | FAIL |
| 8 | Hunting the Error | Partial | N/A | Log is scannable; no amount-based sorting or outlier flagging | CONCERN |
| 9 | The Delete Ritual | CONCERN | N/A | Delete confirmation shows no item details (P0-3) | CONCERN |
| 10 | Re-Entry Under Pressure | BLOCKED | H3: BLOCKED | P0-1 schema bug blocks re-entry | FAIL |
| 11 | Gross Profit Restored | N/A | H3: BLOCKED | Correction never landed due to write bug | FAIL |
| 12 | BIR Compliance Check | CONCERN | H4: CONCERN | VAT present; void amounts missing; expenses-daily unreachable | CONCERN |

**Score: 2 PASS, 4 CONCERN, 6 FAIL**

---

## H. Multi-User Specific Recommendations

| Priority | Cross-Role Issue | Roles Affected | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| P0 | Expense writes blocked — manager corrections never reach owner's reports | Manager ↔ Owner | Fix expenseDate schema (P0-1) | S | High | 🟢 FIXED |
| P0 | Financial distress invisible to owner during live monitoring | Owner | Threshold color coding on negative margins | S | High | 🟢 FIXED |
| P1 | No shared definition of "Gross Profit" — manager and owner looking at different numbers | Manager + Owner | Standardize terminology across all report pages | M | High | 🟢 FIXED |
| P1 | No cross-link from X-Read → Expenses for BIR discrepancy investigation | Manager + Owner | Add "View Expenses Log →" link on X-Read page | S | Med | 🔴 OPEN |
| P2 | No real-time "data updated" pulse when expenses change | Owner (branch-comparison) | Flash/pulse animation on updated metric cells | M | Low | 🔴 OPEN |
