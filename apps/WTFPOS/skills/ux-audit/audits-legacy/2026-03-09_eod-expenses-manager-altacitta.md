# UX Audit — End of Day + Expense Architecture
**Date:** 2026-03-09
**Role:** Manager (`Juan Reyes` — Alta Citta)
**Pages:** `/reports/eod`, `/reports/expenses-daily`, `/expenses`
**Branch:** Alta Citta (`tag`)
**Intensity:** Single-user, light
**Viewport:** 1024×768 (tablet)
**Focus question:** Where should electricity, gas, and other operational expenses live in the EOD workflow?

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 3 of 14 issues resolved (P0: 2/3 · P1: 1/8 · P2: 0/3)

---

## A. Text Layout Maps

### State 1 — EOD Page (pre-modal)

```
+─sidebar─+──sub-nav (Reports tabs)────────────────────────────────────────────+
│ POS     │  X-Read │ [End of Day] │ Expenses Daily │ ...                       │
│ Kitchen │  ────────────────────────────────────────────────────────────────── │
│ Stock   │                                                                      │
│ Reports │  Mar 9, 2026  ● Live totals            [Start End of Day ▶]         │
│         │  ─────────────────────────────────────────────────────────────────  │
│         │  ┌────────────────────────────────────────────────────────────┐    │
│         │  │  🙈  Detailed Reports Hidden                                │    │
│         │  │  Click "Start End of Day" to begin your blind cash count    │    │
│         │  │  and unlock today's detailed sales and variance reports.    │    │
│         │  └────────────────────────────────────────────────────────────┘    │
│         │                                                                      │
│         │  (Z-Read History table — empty or seed data rows)                   │
+─────────+──────────────────────────────────────────────────────────────────────+
```

### State 2 — EOD Modal (Step 1: Blind Cash Count)

```
+──────────────────────────────────────────────────────────+
│  End of Day                                         [✕]  │
│  ─────────────────────────────────────────────────────── │
│  ┌─ STEP 1: Actual Cash Count ──────────────────────┐   │
│  │  ⚠ BLIND CLOSE ACTIVE                           │   │
│  │  Count and declare your drawer cash before       │   │
│  │  seeing expected totals.                         │   │
│  │                                                  │   │
│  │  Cash in Drawer (₱)  [_______________  spinbox]  │   │
│  │                                                  │   │
│  │  [Declare Drawer Count]  ← disabled at 0         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─ STEP 2: Utility Readings ─────────────────────┐     │
│  │  Record today's meter readings to estimate      │     │
│  │  daily utility usage.                           │     │
│  │                                                  │     │
│  │  Electricity (kWh) [_____]  Prev: 101           │     │
│  │  Gas (kg)          [_____]  Prev: 17            │     │
│  └──────────────────────────────────────────────────┘   │
│  (Step 2 is VISIBLE but partially unlocked before Step 1)│
│                                                           │
│                                      [Close]             │
+──────────────────────────────────────────────────────────+
```

### State 3 — EOD Modal (Step 2 unlocked, cash declared)

```
│  ┌─ STEP 1 (locked) ──────────────────────────────┐   │
│  │  Cash declared. Variance shown below.           │   │
│  │  Cash in Drawer (₱): ₱5,000 [read-only]        │   │
│  │  ┌─ CASH SHORT: −₱37,083.00 ──────────────────┐│   │
│  │  │  (red badge, large mono font)               ││   │
│  │  └─────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─ STEP 2: Utility Readings (enabled) ───────────┐     │
│  │  Electricity (kWh) [_____]  Prev: 101           │     │
│  │  Gas (kg)          [_____]  Prev: 17            │     │
│  │  ← No water, no internet, no other utilities    │     │
│  │  ← Estimated cost appears only if prev reading  │     │
│  │    exists and current is filled in              │     │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  "Submitting saves a permanent Z-Read record for BIR."   │
│  [Submit EOD Z-Read]  ← primary, full-width              │
│  [Close]              ← ghost link                       │
```

### State 4 — Expenses Daily Page

```
+─sidebar─+──Expenses Daily──────────────────────────────────────────────────+
│         │  [+ Log New Expense]                                              │
│         │  [Today] [This Week] [This Month]                                 │
│         │                                                                   │
│         │  ┌─────────┬─────────┬─────────┬─────────┐                      │
│         │  │ Total   │ Total   │ Net     │ Expense │                      │
│         │  │ Sales   │ Expenses│ Cash Flow│ Ratio  │                      │
│         │  │ ₱0.00   │ ₱0.00   │ ₱0.00   │ NaN%  │  ← Bug: NaN          │
│         │  └─────────┴─────────┴─────────┴─────────┘                      │
│         │                                                                   │
│         │  TABLE: Category | Amount | % Sales | Bar                        │
│         │  (empty state — no expenses today)                                │
+─────────+───────────────────────────────────────────────────────────────────+
```

### State 5 — Expense Entry Modal (Category Grid)

```
┌──── Log New Expense ────────────────────────────────────────────┐
│                                                           [✕]   │
│  CATEGORY                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ 💼       │ 💰       │ 🥩       │ 🥬       │                 │
│  │ Labor    │ Petty    │ Meat     │ Produce  │                 │
│  │ Budget   │ Cash     │ Procur.  │ & Sides  │                 │
│  ├──────────┼──────────┼──────────┼──────────┤                 │
│  │ 💡       │ 👷       │ 🏠       │ 📦       │                 │
│  │ Utilities│ Wages    │ Rent     │ Misc.    │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│  ← All utilities (electricity, gas, water, internet) go here    │
│                                                                  │
│  Amount (₱)  [________________]                                  │
│  Paid By     [Cash from Reg.] [GCash] [Maya] [Personal Cash]    │
│  Description [___________________________________]               │
│  Receipt Photo (optional) [Add 📷]                               │
│  [Cancel]                            [Save Expense]             │
└──────────────────────────────────────────────────────────────────┘
```

---

## B. Product Design Analysis — Where Do Electricity, Gas, and Other Expenses Go?

This section answers the core design question before the UX assessment.

### Current Architecture (what exists today)

The system handles operational costs through **two separate, disconnected mechanisms**:

```
MECHANISM 1 — EOD Meter Readings (daily tracking)
  Location: /reports/eod → Step 2 of EOD modal
  What it captures: Meter readings only — kWh counter value, gas kg counter value
  What it calculates: Daily usage (current − previous) × rate → estimated peso cost
  Where it saves: audit_log (writeLog) — NOT in the expenses collection
  Who sees it: Only in the EOD modal. Never appears in expense reports.
  Rate settings: Hardcoded $state (₱12/kWh, ₱85/kg) — no UI to configure

MECHANISM 2 — Expense Log (cash-out tracking)
  Location: /reports/expenses-daily, /expenses, AppSidebar ExpensesModal
  What it captures: Peso amounts by category, payment method, description
  Categories: Labor Budget, Petty Cash, Meat Procurement, Produce & Sides,
              Utilities, Wages, Rent, Miscellaneous
  Where it saves: expenses RxDB collection — appears in all expense reports
  Who sees it: Manager, Owner in expense reports and EOD cash reconciliation
```

### The Gap

The estimated utility cost from EOD meter readings **never flows into the expenses system**. A manager who enters `current kWh = 156` (previous: 101, so 55 kWh used × ₱12 = ₱660) sees "Total Est. Cost: ₱660" in the modal — then it disappears. The expenses dashboard shows ₱0 for Utilities unless the manager separately logs it.

### Recommended Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │            OPERATIONAL COSTS                 │
                    └───────────────┬─────────────────────────────┘
                                    │
              ┌─────────────────────┼────────────────────┐
              │                     │                    │
   DAILY METERED             MONTHLY BILLED        AD-HOC / CASH-OUT
   (auto-logged at EOD)      (manual entry)        (manual entry)
              │                     │                    │
   Electricity (kWh)        Meralco Bill ₱XXXX     Market runs
   Gas (LPG kg)             LPG delivery ₱XXXX     Repair costs
   Water (L or Cu.m)        PLDT/WiFi ₱XXXX        Petty cash
              │                     │                    │
              └─────────────────────┴────────────────────┘
                                    │
                    All flow into: expenses collection
                    Visible in: /reports/expenses-daily
```

### Specific Placement Decisions

| Cost Type | Where to Enter | Category | Notes |
|---|---|---|---|
| **Electricity meter reading** | EOD modal Step 2 (already exists) | Auto-creates "Electricity" expense | Currently only saved to audit_log — should also write to expenses |
| **Gas/LPG meter reading** | EOD modal Step 2 (already exists) | Auto-creates "Gas/LPG" expense | Same issue — not in expenses collection |
| **Water meter reading** | EOD modal Step 2 (add field) | Auto-creates "Water" expense | Missing entirely |
| **Monthly Meralco bill** | /reports/expenses-daily → "Utilities" | Utilities sub-type: Electricity | Peso amount entry, not meter reading |
| **LPG delivery (full tank)** | /reports/expenses-daily → "Utilities" | Utilities sub-type: Gas | Peso amount entry |
| **Internet/phone** | /reports/expenses-daily → "Utilities" | Utilities sub-type: Internet | Monthly, peso amount |
| **Wages (daily)** | /reports/expenses-daily → "Wages" | Wages | Already exists |
| **Rent** | /reports/expenses-daily → "Rent" | Rent | Already exists |
| **Market supplies** | /reports/expenses-daily → "Produce & Sides" | Produce & Sides | Already exists |

### Key Fixes Required

1. **EOD → auto-create expense entries**: After `saveUtilityReading()`, also call `addExpense()` for each utility with the calculated peso cost. This bridges the two systems.
2. **Add Water field to EOD Step 2**: Electricity and gas are there but water is missing.
3. **Add rate configuration UI**: ₱12/kWh and ₱85/kg are hardcoded. A manager should be able to update these when Meralco rates change.
4. **Split "Utilities" category** (or add sub-category field): Currently all utilities in the expense form go under one "Utilities" bucket. For owner reporting, knowing whether ₱12,000 is electricity vs internet vs water matters.

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | EOD modal presents 2 steps + submit all visible at once — no staged progression. Expense category grid: 8 tiles, acceptable count | Add a numbered step indicator (1/3, 2/3, 3/3) to reduce cognitive load during modal traversal |
| 2 | **Miller's Law** | PASS | EOD modal sections are well-chunked: Cash → Utilities → Submit. Expense category grid 4×2 = 8 tiles, within 7±2 | — |
| 3 | **Fitts's Law** | CONCERN | "Start End of Day" button is correctly sized. "Declare Drawer Count" is full-width `btn-primary` — good. Utility reading spinboxes have no minimum input height specified (rely on browser default, typically 24-32px on touch). Period filter pills on expenses-daily use `min-height: unset` — likely undersized | Set explicit min-height: 44px on all inputs and period filter pills |
| 4 | **Jakob's Law** | PASS | Step-based modal pattern is familiar. Blind cash count before revealing totals is a recognized cash management convention (standard in retail POS) | — |
| 5 | **Doherty Threshold** | PASS | All saves are instant (RxDB local-first). "Declare Drawer Count" reveals report data immediately. No loading states needed | — |
| 6 | **Visibility of System Status** | FAIL | **Three failures:** (1) Estimated utility cost is calculated and shown but never saved as an expense — user gets no feedback that the cost "went somewhere." (2) If the manager closes the modal after declaring cash but before submitting Z-Read, the utility readings entered are lost silently. (3) "NaN%" in Expense Ratio is raw JS leak — system status corrupted | Auto-save utility readings on input blur. Show "Saved to expenses: ₱660" confirmation. Fix NaN → "—" |
| 7 | **Gestalt: Proximity** | CONCERN | In the EOD modal, Step 2 (Utility Readings) is visually adjacent to Step 1 (Cash) with only a heading separator — the `opacity-40 pointer-events-none` lock state makes Step 2 readable but not interactable. After unlock, there is no visual change in the section's appearance (no color shift, no "unlocked" badge) to confirm the state change | Add a subtle green lock-open icon or section border color change on Step 2 when it unlocks |
| 8 | **Gestalt: Common Region** | PASS | EOD modal sections use `rounded-xl border bg-surface-secondary p-4` cards — clearly bounded regions. Expense category grid uses consistent button borders | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | In the EOD modal, the variance badge ("Cash Short −₱37,083.00") in `text-2xl font-bold text-status-red` is dramatically prominent inside the modal — it could alarm a manager before they've seen the breakdown that explains why the variance exists | Consider showing variance with a "see breakdown below" link that scrolls to the cash reconciliation section |
| 10 | **Visual Hierarchy (contrast)** | PASS | Red for negative variances, green for balanced, yellow for cash-over — all correctly applied. Expense proportion bars use accent orange | — |
| 11 | **WCAG Color Contrast** | CONCERN | "BLIND CLOSE ACTIVE" text is `text-status-red text-xs font-bold uppercase` — `#EF4444` on `bg-surface-secondary` (#F9FAFB) = ~3.7:1, fails WCAG AA for 12px text. Stale-shift warning uses `text-yellow-700 text-xs` on yellow-light background — yellow-700 (#A16207) on amber-100 (#FEF3C7) = ~4.8:1, passes | Change "Blind Close Active" label to `text-red-800` or use larger text |
| 12 | **WCAG Touch Targets** | FAIL | Period filter pills (`[Today] [This Week] [This Month]`) use `min-height: unset` — relying on content padding that renders ~32px. Spinbox inputs in EOD Step 2 rely on browser default height | Add `style="min-height: 44px"` to period filter pills. Wrap utility inputs in explicit-height containers |
| 13 | **Consistency (internal)** | FAIL | **Three inconsistencies:** (1) `/expenses` uses `<select>` dropdowns; `/reports/expenses-daily` uses an icon grid with toggle buttons — same action, two completely different UX patterns. (2) "Paid By" options differ: `/expenses` has "Owner's Pocket", `/reports/expenses-daily` has "Personal Cash" — same concept, different labels. (3) Utility costs calculated in EOD are tracked separately from all other costs in the expense system | Consolidate expense entry into one shared component. Standardize "Paid By" options. Connect EOD utilities to expenses |
| 14 | **Consistency (design system)** | PASS | `pos-card`, `btn-primary`, `btn-ghost`, `pos-input`, alert color patterns all used correctly throughout both pages | — |

**Totals: 4 PASS · 6 CONCERN · 4 FAIL**

---

## C. "Best Day Ever" Vision

It's 10:45pm. The last table has paid, the grills are cooling down. Juan the manager pulls up the tablet for End of Day.

In the ideal experience, he taps "Start End of Day." The modal walks him through three clear numbered steps: **Step 1 of 3 — Cash Count. Step 2 of 3 — Meters. Step 3 of 3 — Submit.** He counts the drawer: ₱6,200. He types it in and taps "Declare." Immediately the modal transitions to Step 2, the "Unlocked" badge appears with a subtle green border, and he sees: "Electricity meter (kWh): last reading was 101." He checks the physical meter, it reads 156. He types 156. Below his input: "55 kWh used — estimated ₱660." He reads the gas LPG scale: 14.5 kg. He types it. "Used 2.5 kg — estimated ₱212." Below that, a total: "Est. utility cost today: ₱872 — this will be logged to your Expenses." He taps "Submit EOD Z-Read."

A confirmation appears: "Z-Read saved. Utilities logged: Electricity ₱660 · Gas ₱212." He navigates to Expenses Daily and sees today's entries: Meat Procurement ₱14,500, Wages ₱4,200, Utilities — Electricity ₱660, Utilities — Gas ₱212. Net Cash Flow: ₱73,600. He screenshots it and sends it to the owner on Messenger. Done. Shift closed.

**The current gap:** The meter readings show the estimated cost in the modal and then vanish. Nothing appears in the Expenses report. The manager has to separately log a manual "Utilities" expense with the same amount he just computed. Two entries for one fact. And if he forgets, the day's utility costs are invisible in the financial reports.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | EOD utility readings don't create expense records — estimated costs vanish after Z-Read | After `saveUtilityReading()`, call `addExpense('Electricity', elecCost, ...)` and `addExpense('Gas/LPG', gasCost, ...)` automatically | S | High | 🔴 OPEN |
| **P0** | `NaN%` displayed raw in Expense Ratio card when sales = 0 | `(totalExpenses / current.sales * 100).toFixed(1)` → guard with `current.sales > 0 ? ... : '—'` | S | High | 🟢 FIXED |
| **P0** | `/expenses` and `/reports/expenses-daily` are duplicate entry paths with inconsistent "Paid By" options (`Personal Cash` vs `Owner's Pocket`) | Consolidate into one shared `ExpenseEntryModal` component. Standardize Paid By to: `Cash from Register | GCash | Maya | Personal Cash` | M | High | 🟢 FIXED |
| **P1** | Water meter reading missing from EOD Step 2 — water is a real daily cost | Add `Water (L or cu.m)` field to EOD Step 2 alongside Electricity and Gas. Add `waterPerUnit` to `utilitySettings` | S | High | 🟢 FIXED |
| **P1** | Utility rate settings are hardcoded (`₱12/kWh`, `₱85/kg`) — no UI to change them when Meralco raises rates | Add a "Utility Rates" section in `/admin` or `/reports/eod` settings. Persist to RxDB or localStorage | M | High | 🔴 OPEN |
| **P1** | EOD Step 2 unlocks with no visual confirmation — section looks identical before and after unlock | Add green border + "✓ Unlocked" badge on Step 2 section when `isBlindCloseSubmitted` becomes true | S | Med | 🔴 OPEN |
| **P1** | Utility readings lost silently if manager closes modal before Submit | Warn on modal close if readings are entered but Z-Read not submitted: "You have unsaved meter readings." | S | Med | 🔴 OPEN |
| **P1** | EOD modal has no step progress indicator — 2 unlabeled sequential steps with no order cues | Add a `Step 1 of 3 · Step 2 of 3 · Step 3 of 3` indicator at modal top | S | Med | 🔴 OPEN |
| **P1** | "Utilities" expense category is too broad — mixes electricity, gas, water, internet, phone in one bucket | Add sub-category to expense entries: `Utilities > Electricity`, `Utilities > Gas`, `Utilities > Water`, `Utilities > Internet/Phone`. Show sub-category in expense report table | M | Med | 🟢 FIXED |
| **P1** | Period filter pills use `min-height: unset` — renders ~32px on tablet | Add `style="min-height: 44px"` | S | Med | 🔴 OPEN |
| **P2** | "BLIND CLOSE ACTIVE" text uses `text-status-red text-xs` = 3.7:1 on light bg (fails WCAG AA small text) | Use `text-red-800` | S | Low | 🔴 OPEN |
| **P2** | Variance badge (`text-2xl` Cash Short) alarms before context is visible | Show variance with a collapsible "See breakdown" toggle | S | Low | 🔴 OPEN |
| **P2** | "Live totals" label beside the date is unexplained for new managers | Add a tooltip: "Totals update in real-time as orders are paid." | S | Low | 🔴 OPEN |
| **P2** | `/expenses` legacy standalone page creates confusion | Either redirect `/expenses` → `/reports/expenses-daily` or remove the legacy page entirely | S | Low | 🔴 OPEN |
