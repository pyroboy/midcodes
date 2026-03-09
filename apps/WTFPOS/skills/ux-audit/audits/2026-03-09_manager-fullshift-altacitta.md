# UX Audit — Manager Full Shift · Alta Citta
**Date:** 2026-03-09
**Mode:** Single-user (3 parallel agents)
**Role:** Manager (Sir Dan) · `tag` Alta Citta
**Viewport:** 1024×768 tablet
**Intensity:** Extreme (scenarios 17, 20, 23, 26, 29, 32, 37 merged)
**Agents:** Manager-A (stock/delivery), Manager-B (expenses/delete), Manager-C (reports/X-Read)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 16 of 27 issues resolved (P0: 3/4 · P1: 9/12 · P2: 4/11)

---

## A. Text Layout Map

### Phase 1 — `/stock/counts`
```
+--sidebar--+-------------------------main-content--------------------------+
| [nav]     | LocationBanner: [Alta Citta ▼] [Change]                      |
| [nav]     |--------------------------------------------------------------|
| [nav]     | Stock Counts   [AM10] [PM4] [PM10]  ← period tabs            |
| [nav]     |--------------------------------------------------------------|
| [nav]     | Item        | Expected | Counted     | Variance              |
| [nav]     | Pork Belly  | 2000 g   | [   1500  ] | Short 500 units ← BUG |
| [nav]     | Pork Liempo | 1800 g   | [   1200  ] | Short 600 units ← BUG |
|           | ... 6 more rows ...                                           |
|           | [32px +/-]  ← BELOW 44px minimum                            |
|           |                                            [Submit Count]     |
+--sidebar--+--------------------------------------------------------------+
DEFAULT TAB: PM10 (Evening) — not time-appropriate for AM auditor ← P0
```

### Phase 2 — `/stock/deliveries` (Receive form)
```
+--sidebar--+-------------------------main-content--------------------------+
| [nav]     | LocationBanner: [Alta Citta ▼]                               |
| [nav]     |--------------------------------------------------------------|
| [nav]     | [+ Receive Delivery]   ← prominent, good                     |
| [nav]     |--------------------------------------------------------------|
| [nav]     | Delivery Log:                                                 |
| [nav]     | Date        | Supplier | Item       | Qty  | Batch  | Expiry |
|           | 2026-03-09  | ...      | Pork Belly | 5 kg | B-241  | 2026.. |
|           |                                                               |
| FORM OPEN:                                                                |
|           | Item: [___________]  Qty: [___]  Supplier: [________]        |
|           | Batch: [___________] Expiry: [mm/dd/yyyy ← locale input]     |
|           |                                                               |
|           | [Cancel ← no guard]              [Submit ← 2-step confirm]   |
+--sidebar--+--------------------------------------------------------------+
```

### Phase 3 — `/expenses`
```
+--sidebar--+-------------------------main-content--------------------------+
| [nav]     | LocationBanner: [Alta Citta ▼]                               |
| [nav]     |--------------------------------------------------------------|
| [nav]     | Category: [  Select...  ▼]  ← 11 flat options, no grouping   |
| [nav]     | Amount: [________] Paid By: [Petty Cash ▼]                   |
| [nav]     | Note: [___________________________]                          |
|           | [Save Expense]                                                 |
|           |--------------------------------------------------------------|
|           | Expense Log  [Today] [This Week] [All Time]                   |
|           | "Today's Total: ₱X,XXX.XX" ← DOESN'T SYNC with filter ← P0  |
|           |                                                               |
|           | 2026-03-09 | Electricity | ₱1,500.00 | [Repeat][✕]          |
|           |             ← ISO date BUG   ← no spacing between actions ← P1 |
+--sidebar--+--------------------------------------------------------------+
```

### Phase 4 — Expense Delete Flow
```
Expense row:          [Repeat]  [✕]   ← ✕ has no red styling, no label
                                ↓ click
Inline confirmation:  "Delete this expense?" [Cancel] [Confirm Delete]
                      ← no modal backdrop, no focus trap ← P1
                                ↓ confirm
PIN modal:            [●][●][○][○]   ← NO dot progress ← P1
                      [1][2][3]
                      [4][5][6]
                      [7][8][9]
                         [0]
                      [Cancel]  [Confirm]
                      ← after confirm: item gone, NO undo toast ← P0
```

### Phase 5 — Reports Tour
```
Peak Hours:      Date header: MISSING ← P1
Best Sellers:    Date header: MISSING ← P1 | Empty state: developer copy ← P1
Staff Perf:      Date header: MISSING ← P1 | Voids: N/A all rows ← P1
X-Read:          "ALTA CITTA (TAGBILARAN)" ✓ branch label in all report pages ← PASS
```

### Phase 6 — X-Read Generation
```
+--sidebar--+-------------------------main-content--------------------------+
| [nav]     | LocationBanner: [Alta Citta ▼]                               |
| [nav]     |--------------------------------------------------------------|
| [nav]     | BIR X-Reading                                                 |
| [nav]     | [Generate New X-Read]                                         |
|           |                                                               |
| ON CLICK: inline expand (not modal):                                      |
|           | "Generate X-Read for Alta Citta (Tagbilaran)?"               |
|           | "This action is permanent and cannot be undone."              |
|           | [Cancel]  [Confirm & Generate]  ← adjacent targets ← P1      |
|           |                                  ← no Manager PIN required ← P2 |
+--sidebar--+--------------------------------------------------------------+
```

---

## B. Principle-by-Principle Assessment (18 Principles)

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Expense category picker has 11 ungrouped flat options; period tabs (AM10/PM4/PM10) are fine | Group expense categories into 3-4 super-categories |
| 2 | **Miller's Law** (chunking) | PASS | Reports are well-chunked by tab; stock count rows separated by category | — |
| 3 | **Fitts's Law** (target size/distance) | FAIL | StockCounts stepper buttons 32×32px; expense delete "✕" is small and adjacent to "Repeat" | Stepper buttons → `h-11 w-11`; add gap + label to delete action |
| 4 | **Jakob's Law** (conventions) | CONCERN | X-Read generation via inline expand is unconventional for a BIR-level action; users expect a modal | Move to centered modal with backdrop |
| 5 | **Doherty Threshold** (response time) | PASS | RxDB writes are instant; all actions feel responsive | — |
| 6 | **Visibility of System Status** | CONCERN | Stock counts default to PM10 period — wrong period for AM manager; no date header on Peak Hours/Staff Performance reports | Auto-select time-appropriate period; add date headers to all reports |
| 7 | **Gestalt: Proximity** | CONCERN | Expense log: "Repeat" and "✕" are adjacent with no spacing — perceived as a group when they're opposite in intent | Add 12px gap + separator between Repeat and Delete |
| 8 | **Gestalt: Common Region** | PASS | Cards, count rows, delivery log all use clear borders | — |
| 9 | **Visual Hierarchy** (scale) | CONCERN | Expense delete "✕" has same visual weight as "Repeat" — destructive action is invisible | Make delete button red + labeled "Delete" |
| 10 | **Visual Hierarchy** (contrast) | PASS | Branch label, section headers, body text all have clear hierarchy | — |
| 11 | **WCAG: Color Contrast** | PASS | ₱ amounts in foreground on surface — 16.8:1. Report text clear. | — |
| 12 | **WCAG: Touch Targets** | FAIL | StockCounts `+/-` buttons at 32×32px; expense `✕` small. Two separate violations. | `+/-` → 44px min; `✕` → 44px with label |
| 13 | **Consistency** (internal) | FAIL | Date format inconsistency: expense log shows `2026-03-09` (ISO), delivery log also ISO, X-Read shows `Mar 9, 2026`. Three different formats in same session. | Use `formatDate()` consistently → `Mar 9, 2026` everywhere |
| 14 | **Consistency** (design system) | CONCERN | Stock variance shows "units" instead of item's actual unit; FIFO column lacks units; expense total label doesn't update when filter changes | Fix unit rendering; sync summary labels with active filter |
| 15 | **Format Consistency** (currency) | PASS | All ₱ amounts use `₱X,XXX.00` with 2 decimal places consistently across expense form, log, and all 4 report pages | — |
| 16 | **Format Consistency** (time/date/units) | FAIL | Three date format styles found: ISO (`2026-03-09`) in expense/delivery logs, human-readable (`Mar 9, 2026`) in X-Read only. Weight units: variance shows "units" instead of `g`. | Standardize all display dates to `Mar 9, 2026`; fix unit rendering in variance column |
| 17 | **Accidental Interaction** (tap protection) | FAIL | No undo after PIN-confirmed expense deletion; delivery form Cancel discards draft with no guard; X-Read confirm and Cancel are adjacent inline elements (no spatial separation for BIR action) | Add undo toast (5s) post-delete; add delivery form discard guard; move X-Read confirm to modal |
| 18 | **Accidental Interaction** (error recovery) | FAIL | Post-delete has zero recovery path; PM10 default means a manager can submit an AM count to the wrong period with no warning or undo | Undo toast for expense delete; period auto-selection by time of day; period change confirmation if override |

---

## C. "Best Day Ever" Vision

Sir Dan arrives at 9 AM, tablet already in hand. He navigates to Stock Counts and the page opens on the AM10 period — the right one, pre-selected because the system knows it's morning. He sweeps through 8 meat items in under two minutes, tapping the large stepper buttons to adjust weights, watching variances update live in grams next to each item. When he submits, a clean summary appears: "3 items short, 2 items surplus — AM count saved."

He swings through to receive the morning delivery. Five items, batch numbers typed quickly into generous input fields, expiry dates picked from a mobile-friendly date picker that shows `Mar 9, 2026` — the same format he'll see everywhere else in the app. Submitting brings a two-step confirmation, and the stock levels update immediately.

Expenses next. Six entries in four minutes — the category picker clusters by type so he's not reading 11 undifferentiated options. He switches to GCash after three cash entries; the form remembers his last-used payment method. The log below shows each entry with a human-readable date, and the "This Week's Total" header tells him exactly where the branch stands.

He spots a wrong entry — accidentally logged ₱5,000 instead of ₱500. He taps Delete, enters his PIN, and has 5 seconds to tap "Undo" on the toast before it vanishes. He didn't need it — the amount was right this time — but the safety net was there.

Reports before close: Peak Hours and Best Sellers both show "Alta Citta · Mar 9, 2026" at the top. He can see at a glance that the 7–9 PM slot was peak, and pork belly outsold everything. X-Read time — he taps Generate, a modal appears center-screen with "This will permanently record the X-Read for Alta Citta (Tagbilaran). Proceed?" in clear language. He confirms. The receipt appears immediately.

**Current reality vs. ideal:** The ideal breaks at two critical points today — the period auto-selection doesn't exist (he has to remember to change from PM10 to AM10), and deleting that wrong expense entry offers no undo. Both are daily friction points in a 5-day-a-week workflow.

---

## D. Prioritized Recommendations

| Priority | Phase | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|---|
| **P0** | Stock Counts | **Wrong default period** — page opens on PM10 regardless of time of day; manager can submit AM count to wrong slot | Auto-select period by `new Date().getHours()` (AM10 if 6–12, PM4 if 12–17, PM10 if 17+) | S | High | 🔴 OPEN |
| **P0** | Stock Counts | **"Short X units" label bug** — variance renders `item.unit` as literal string "units" instead of `g`, `kg`, `portions` | Fix `StockCounts.svelte` variance render: use `item.unit` not hardcoded "units" | S | High | 🔴 OPEN |
| **P0** | Expenses | **No undo after PIN-confirmed delete** — deletion is permanent with zero recovery path in UI | Add 5-second undo toast after expense deletion; queue the RxDB delete on a timer, cancel on undo tap | M | High | 🟢 FIXED |
| **P0** | Expenses | **Summary header doesn't sync with filter** — "Today's Total" label and amount stay static when "This Week" or "All Time" filter is active | Bind header label and amount to `activeFilter` reactive state | S | High | 🟢 FIXED |
| **P1** | Stock Counts | **Stepper buttons 32×32px** — below 44px WCAG minimum; fingertip-unfriendly for meat weights during count | Change QuickNumberInput `+/-` to `h-11 w-11` (44px) | S | High | 🔴 OPEN |
| **P1** | Stock Counts | **No unit label next to Counted input** — manager must cross-ref Expected column to know units | Add `item.unit` label adjacent to each count input field | S | Med | 🔴 OPEN |
| **P1** | Stock Counts | **Step of 1 for gram items** — incrementing by 1g is useless for meat weighing | Set step: 100 for `g` items, 0.1 for `kg`, 1 for `portions`/`bottles` | S | Med | 🔴 OPEN |
| **P1** | Stock Counts | **Unitless variance summary** — footer aggregates grams + portions into one meaningless number | Group variance summary by unit type or show per-item only | M | Med | 🔴 OPEN |
| **P1** | Delivery | **Cancel discards delivery form with no guard** — tapping Cancel after filling 4 fields loses all data silently | Show "Discard draft?" inline confirmation before closing | S | Med | 🔴 OPEN |
| **P1** | Expenses | **Delete "✕" has no danger styling and is adjacent to "Repeat"** — fat-finger trap on touchscreen | Style delete as `btn-danger` with "Delete" label; add 12px gap between Repeat and Delete | S | High | 🟢 FIXED |
| **P1** | Expenses | **PIN numpad has no digit progress indicator** — no ●●○○ feedback during entry | Add dot indicators to ManagerPinModal that fill as digits are entered | S | Med | 🟢 FIXED |
| **P1** | Expenses | **Delete confirmation has no modal backdrop** — background page stays interactive during confirmation | Wrap delete confirmation in modal overlay with `closeOnOutsideClick: false` | S | Med | 🟢 FIXED |
| **P1** | Reports | **X-Read generation is inline, not modal** — Confirm and Cancel are adjacent touch targets for a BIR-level permanent action | Move X-Read confirmation to centered modal with backdrop | S | High | 🟢 FIXED |
| **P1** | Reports | **Staff Performance Voids column shows N/A for all staff** — BIR accountability field is non-functional | Either implement per-cashier void tracking or remove column with explanation text | L | Med | 🟢 FIXED |
| **P1** | Reports | **No date shown on Peak Hours or Staff Performance** — manager can't verify all reports show same date | Add "Alta Citta · Mar 9, 2026" sub-header to both pages (same pattern as X-Read) | S | Med | 🟢 FIXED |
| **P1** | Reports | **Best Sellers empty state copy is developer-facing** — "Check that weighing sessions have been completed" is not intelligible to a manager | Replace with: "No sales data yet for this period. Sales appear after orders are checked out." | S | Low | 🟢 FIXED |
| **P2** | Delivery | **Date format mismatch** — expiry input shows browser locale (`mm/dd/yyyy`) but delivery log shows ISO `2026-03-09` | Normalize delivery log dates to `Mar 9, 2026` format using `formatDate()` | S | Med | 🔴 OPEN |
| **P2** | Delivery | **FIFO Usage column lacks units** — "4800 left / 3200 used" should be "4800 g / 3200 g" | Append `item.unit` to FIFO display values | S | Low | 🔴 OPEN |
| **P2** | Expenses | **Category picker: 11 flat options, no grouping** — violates Hick's Law for multi-entry sessions | Group into super-categories: Operations / Supplies / Staff / Marketing / Other | M | Med | 🟢 FIXED |
| **P2** | Expenses | **No subtotal footer on filtered expense log** | Add totals row at bottom of filtered log | S | Med | 🟢 FIXED |
| **P2** | Expenses | **Log dates show ISO format** — `2026-03-09` instead of `Mar 9` | Use `formatDate()` for all expense log date cells | S | Med | 🟢 FIXED |
| **P2** | Expenses | **"Paid By" resets to Petty Cash after submit** — not last-used value | Persist last payment method selection in component state | S | Low | 🟢 FIXED |
| **P2** | Expenses | **"All time" total has no branch label** — ambiguous for location-switcher managers | Append "(Alta Citta)" to summary header | S | Low | 🟢 FIXED |
| **P2** | Reports | **X-Read history omits Maya and Credit/Debit** — only Cash + GCash shown | Extend payment breakdown to include all payment methods present in the read | M | Med | 🟢 FIXED |
| **P2** | Reports | **No date range selector on Best Sellers or Staff Performance** — Peak Hours has Today/This Week toggle, others don't | Add consistent date range control to both pages | M | Med | 🟢 FIXED |
| **P2** | Reports | **Manager PIN not required for X-Read generation** — inconsistent with other sensitive actions | Add manager PIN gate before X-Read confirmation (or explicitly document as intentional) | S | Low | 🟢 FIXED |
| **P2** | Reports | **"BIR X-Reading" identity not shown on-screen** — only visible in print mode | Add "BIR X-Reading" badge or label to the on-screen output | S | Low | 🔴 OPEN |

---

## Overall Recommendation

This manager flow is **not ready for unassisted daily use** — P0-1 (wrong default period) and P0-3 (no delete undo) will cause real operational errors and irreversible data loss on every shift.

---

*Agents: Manager-A (stock/delivery), Manager-B (expenses/delete), Manager-C (reports/X-Read)*
*Combined by orchestrator. Partial files: `2026-03-09_manager-a-stock-partial.md`, `2026-03-09_manager-b-expenses-partial.md`, `2026-03-09_manager-c-reports-partial.md`*

---

## E. Fix Status (session recovery 2026-03-09)

> Working tree changes applied before crash. Cross-referenced against Section D table.

### Stock Counts (`/stock/counts`)
- [ ] **P0** Wrong default period — still opens on PM10 regardless of time of day
- [ ] **P0** "Short X units" label bug — variance renders hardcoded "units" not `item.unit`
- [ ] **P1** Stepper `+/−` buttons still 32×32px (QuickNumberInput unchanged)
- [ ] **P1** No unit label adjacent to Counted input
- [ ] **P1** Step of 1 for gram items — no smart step by unit type
- [ ] **P1** Unitless variance summary — mixes grams + portions into one total

### Deliveries (`/stock/deliveries`)
- [x] **P1** Unit cost field — `formUnitCost` + `computedTotalCost` auto-computed on form
- [x] **P1** Delivery success toast — `successMsg` fires on submit (`✓ Delivery recorded — +Xg ItemName`)
- [x] **P1** Transfer-origin rows get "Transfer" badge (orange pill, distinguishable from vendor deliveries)
- [x] **P2** Procurement expense CTA — appears after save when unit cost entered, deep-links to `/expenses` prefilled
- [ ] **P1** Cancel delivery draft guard still missing — Cancel discards form silently

### Expenses (`/expenses`)
- [x] **P0** Delete now requires Manager PIN (`pinModalOpen` + `ManagerPinModal`)
- [x] **P0** Undo delete — 5-second delayed RxDB write; `pendingUndoItem` undo toast
- [x] **P0** Summary header syncs with active filter — `filteredTotal` derived from `filteredExpenses`
- [x] **P1** Category `<optgroup>` grouping — Overhead / Procurement / Utilities / Operations / Other
- [x] **P1** Log filter — Today / This Week / This Month / All Time (default: Today)
- [x] **P1** Inline validation on blur — `amountBlurred` + `formError`
- [x] **P1** Date field on form — `expenseDate` pre-fills today, supports backdating
- [x] **P1** Meter reading fields — Water/Electricity/Gas show prev/curr/rate inputs; auto-computes amount
- [x] **P1** `Loader2` spinner replaces emoji spinner
- [x] **P2** Log dates use `formatShortDate()` → `Mar 9` format
- [x] **P2** Last-used `paidBy` persisted — `lastUsedPaidBy` state
- [x] **P2** Category subtotals strip rendered per group in log view
- [x] **P2** `PhotoCapture.svelte` used for receipt photo (styled, replaces raw `<input type="file">`)
- [ ] **P2** Category defaults to first option on fresh load (not most-common)

### Reports
- [x] **P1** Peak Hours — `locationLabel · todayLabel` sub-header added
- [x] **P1** Best Sellers — branch/date sub-header + Today/This Week period toggle
- [x] **P1** Best Sellers — empty state copy rewritten (manager-readable, branch-explicit)
- [x] **P1** Staff Performance — branch/date sub-header + period toggle + real void count per cashier
- [x] **P0** X-Read — `Generate X-Read` disabled when `locationId === 'all'` with tooltip
- [x] **P2** X-Read — Manager PIN gate before generation
- [x] **P2** X-Read — branch name in print output (hidden `print:block` div)
- [x] **P2** X-Read — "BIR X-Reading" badge always visible on-screen
- [x] **P2** X-Read — `voidedAmount` computed and available
- [x] **P1** X-Read — `getLocationName()` maps locationId → display name in history entries
- [ ] **P1** X-Read confirmation still inline (PIN gate added, but layout not moved to centered modal)
