# Merged UX Issues — Top 3 Audits (2026-03-09)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 9 of 56 issues resolved (P0: 1/9 · P1: 6/28 · P2: 2/19)

**Source audits (by file save time):**

| # | File | Saved | Scope |
|---|---|---|---|
| 1 | `2026-03-09_extreme-chaos-4role-altacitta.md` | 04:43 | Multi-role: Staff / Kitchen / Manager / Owner — 13 chaos scenarios |
| 2 | `2026-03-09_manager-multimodule-audit-altacitta.md` | 04:38 | Manager — Deliveries, Expenses, Inventory, Waste, X-Read |
| 3 | `2026-03-09_expenses-manager-tag-chaotic.md` | 04:26 | Manager — Expenses creation, ALL types, 14 chaos edge cases |

**Deduplication note:** Issues appearing in multiple audits are merged into one entry with sources listed. Issue ID uses format `[P#-##]`.

---

## P0 — MUST FIX (service-blocking or compliance-breaking)

| ID | Status | Issue | Source | Effort | Impact |
|---|---|---|---|---|---|
| P0-01 | ❌ OPEN | **"Log Expense" sidebar Quick Action links to wrong page** — goes to `/reports/expenses-daily?action=open` instead of `/expenses`. Two different expense-entry surfaces exist; the labelled shortcut delivers the wrong one every time. | Audit 1 (Manager B3), Audit 2 (S04), Audit 3 (P0-2) | S | High |
| P0-02 | ✅ FIXED | **"Total Recorded (All Time)" label is dangerously misleading** — header now shows filtered total; `filteredTotal` derived from active `logFilter` state. All-time shown as secondary stat. | Audit 3 (P0-1) | S | High |
| P0-03 | ✅ FIXED | **Delete expense has no undo** — 5-second delayed RxDB delete; `pendingUndoItem` undo toast; delete now requires Manager PIN. | Audit 3 (P0-3, Chaos: BROKEN) | S | High |
| P0-04 | ✅ FIXED | **No success feedback after recording an expense** — `successVisible` state drives a success flash on submit. | Audit 3 (P0-4) | S | High |
| P0-05 | ✅ FIXED | **deleteExpense() had no PIN guard** — `pinModalOpen` + `ManagerPinModal` now gates every delete. Audit log write confirmed in `expenses.svelte.ts`. | Audit 3 (Section F) | S | High |
| P0-06 | ✅ FIXED | **"Generate X-Read" active when `locationId === 'all'`** — button `disabled` when `session.locationId === 'all'`; tooltip: "Select a specific branch first". | Audit 1 (Owner B4, P0-1) | S | High |
| P0-07 | ❌ OPEN | **Kitchen cannot 86 / flag sold-out items** — `InventoryTable.svelte` still read-only for `kitchen` role. | Audit 1 (P0-2) | M | High |
| P0-08 | ❌ OPEN | **Void is silent to KDS** — `voidOrderItem()` still removes item with no visual signal to kitchen. | Audit 1 (P0-3, H5: FAIL) | M | High |
| P0-09 | ❌ OPEN | **Checkout blocked when thermal printer fails** — `printReceipt()` still runs before `finalizeCheckout()`. | Audit 1 (P0-4) | M | High |

---

## P1 — FIX THIS SPRINT (friction under chaos conditions)

| ID | Issue | Source | Effort | Impact | Status |
|---|---|---|---|---|---|
| P1-01 | **12-option flat expense category dropdown — no grouping (Hick's Law)** — all options listed in one flat `<select>`. Under stress, manager reads the full list each time. Fix: group into 4 `<optgroup>`s: Overhead (Labor Budget, Wages, Rent) / Procurement (Meat Procurement, Produce & Sides) / Utilities (Electricity, Gas/LPG, Water, Internet) / Other (Petty Cash, Miscellaneous). | Audit 3 (P1-1) | S | Med | 🟢 FIXED |
| P1-02 | **"Petty Cash" appears as both an expense category AND a "Paid By" option — semantically ambiguous** — manager unsure which petty cash is which. Rename the category to "Petty Cash Replenishment" or remove it as a category entirely (it's a payment source, not a spend type). | Audit 3 (P1-2), Audit 1 (B3-13) | S | Med | 🔴 OPEN |
| P1-03 | **Expense log shows all-time data with no date filter** — 8+ mixed-date rows appear by default. Shift review becomes noise. Fix: add Today / This Week / All Time filter, default to Today. | Audit 3 (P1-3) | M | High | 🟢 FIXED |
| P1-04 | **No inline validation on expense form — errors only shown after submit** — submit button is always active orange regardless of empty fields. No onblur feedback. Manager taps Record Expense, gets a red error, must re-read the form. Fix: validate on blur + disable submit until minimum required fields are filled. | Audit 3 (P1-4, Chaos: DEGRADED) | M | Med | 🟢 FIXED |
| P1-05 | **No GCash / Maya option in "Paid By" field** — real gap for Philippine operations where managers pay vendors via e-wallets. Also BIR compliance: digital payments must be distinguishable from cash. | Audit 3 (Chaos: DEGRADED) | S | Med | 🔴 OPEN |
| P1-06 | **No date field on expense form — all expenses timestamped "now"** — receipts frequently arrive the next day (food market trips, petty cash reimbursements). No backdate capability means records are always off by one day. | Audit 3 (Chaos: DEGRADED) | M | Med | 🟢 FIXED |
| P1-07 | **Long description (200+ chars) breaks expense log table layout** — `<input type="text">` has no `maxlength`. Store allows up to 500 chars. Table cell has no `truncate` or `max-w` class — row height expands unbounded. | Audit 3 (Chaos: DEGRADED) | S | Low | 🔴 OPEN |
| P1-08 | **Quick-fire entry: category and "Paid By" persist after submit but amount/description reset** — creates carry-over risk when entering mixed-category expenses quickly. No double-tap guard before `isSubmitting` state activates — rapid taps can duplicate records. | Audit 3 (Chaos: DEGRADED) | S | Med | 🔴 OPEN |
| P1-09 | **⏳ emoji spinner doesn't spin smoothly** — `animate-spin` on a Unicode character produces jitter in some browsers. Replace with `<Loader2 class="h-4 w-4 animate-spin" />` from lucide-svelte. | Audit 3 (P1-5) | S | Low | 🟢 FIXED |
| P1-10 | **No "quick repeat" / duplicate-last-expense feature** — full 5-field form cycle for every entry. A ₱50 rider tip and a ₱450 cooking oil delivery require the same process. Add "Repeat" button on recent rows to pre-fill the form. | Audit 3 (P1-6) | M | Med | 🔴 OPEN |
| P1-11 | **No "sent to kitchen" feedback after order is charged (Staff)** — after CHARGE in AddItemModal, no toast or notification confirms the kitchen received the order. Staff must re-open the OrderSidebar and check item badges individually. | Audit 1 (P1-1) | S | High | 🔴 OPEN |
| P1-12 | **"Void" in OrderSidebar footer is ambiguous — it voids the entire order** — the same label ("Void") is also used for the item-level ✕ button. Under pressure, staff may trigger a full order cancel when trying to remove one item. Rename to "Cancel Order" with red-zone visual cue. | Audit 1 (P1-2) | S | High | 🔴 OPEN |
| P1-13 | **Refill requests not visually separated from cook-order tickets on KDS** — refill entries fall into the DISHES & DRINKS group with no differentiation. During a 3-table refill surge, they're buried. Fix: add `isRefill: true` flag and render as a distinct "REFILL REQUESTS" section with orange tint on every KDS card. | Audit 1 (P1-3, H4: FAIL) | M | High | 🔴 OPEN |
| P1-14 | **CheckoutModal ✕ button has `min-height: unset` — below 44px** — the close button on the most-used modal in the app explicitly removes the touch target guarantee set in `app.css`. | Audit 1 (P1-4) | S | Med | 🔴 OPEN |
| P1-15 | **CheckoutModal discount buttons are 32px — below 44px** — SC, PWD, Promo, Comp buttons during checkout are 32px height. Missed taps cause incorrect discounts. | Audit 1 (P1-5) | S | Med | 🔴 OPEN |
| P1-16 | **Kitchen Quick Bump button is 32px — below 44px (greasy hands context)** — the most-tapped button in the kitchen flow has an explicit `min-height: 32px` override. | Audit 1 (P1-6) | S | High | 🔴 OPEN |
| P1-17 | **Refuse modal ✕ has `min-height: unset`** — close button on the kitchen refuse modal violates touch target standards. | Audit 1 (P1-7) | S | Med | 🔴 OPEN |
| P1-18 | **Delivery and waste forms have no draft persistence — all data lost on navigation** — switching pages during delivery or waste entry destroys form state silently. A manager interrupted mid-delivery by a floor issue loses their entire entry. | Audit 1 (P1-8), Audit 2 (S04, Context-Switch) | M | High | 🔴 OPEN |
| P1-19 | **No urgency indicators in the manager sidebar** — no "3 low stock" badge on Stock nav, no "2 tables near limit" on POS, no kitchen alert count. Manager must navigate into each section to discover problems. | Audit 1 (P1-10), Audit 2 (S13) | M | High | 🔴 OPEN |
| P1-20 | **No ticket count summary in KDS header** — when the queue has 6+ tickets, kitchen must visually count cards. A "6 active · 23 items" header count would help at a glance. | Audit 1 (P1-11) | S | Med | 🔴 OPEN |
| P1-21 | **Item dropdowns in delivery and waste forms have 80+ options with no typeahead/search** — native `<select>` with the full stock list. Finding "Lettuce" or "Pork Bone-In" requires scrolling ~80 items. Reduces form time by ~50% with search-within. | Audit 1 (P1-12), Audit 2 (S03, S09) | S | High | 🔴 OPEN |
| P1-22 | **X-Read history entries show no branch label** — each entry shows only number, time, and user. When owner is in All Locations context or reviewing print, entries from different branches are indistinguishable. | Audit 1 (P1-13) | S | Med | 🟢 FIXED |
| P1-23 | **Branch Comparison report defaults to "Today" — shows ₱0.00 before EOD** — the one page built for branch comparison opens empty. Default to "This Week". | Audit 1 (P1-14) | S | Med | 🔴 OPEN |
| P1-24 | **No refill badge on floor plan tiles during refill surge (Staff)** — when a table sends a refill request, the floor tile shows no indicator. Staff must track pending refills mentally. | Audit 1 (P1-15) | S | Med | 🔴 OPEN |
| P1-25 | **"Start Your Shift" modal blocks ALL sidebar Quick Actions via z-index 80** — a manager receiving a delivery immediately after login cannot access the Quick Actions panel until the shift float is declared. No "skip for inventory-only operations" bypass. | Audit 2 (S03) | M | High | 🔴 OPEN |
| P1-26 | **No confirmation step before delivery / waste form submit — no success toast after** — high-risk form (affects BIR stock records). Mistyped quantities commit immediately. After save, no toast; manager must scan history table to confirm. | Audit 2 (S08), Audit 1 (P2-7) | S | Med | 🟢 FIXED |
| P1-27 | **Waste form doesn't show "current stock" when item is selected** — unlike the delivery form (which does show current stock under the item select), the waste form gives no quantity context. Manager cannot judge if 500g waste entry makes sense without navigating away. | Audit 2 (S09) | S | Med | 🔴 OPEN |
| P1-28 | **Waste form Reason/Spoilage field is below the fold or not visible at first render (1024×768)** — only 1 select is visible without scrolling. Reason is an important audit field and should be visible above the fold on the form. | Audit 2 (S09) | S | Med | 🔴 OPEN |

---

## P2 — BACKLOG (polish, not urgent)

| ID | Issue | Source | Effort | Impact | Status |
|---|---|---|---|---|---|
| P2-01 | **No branch name embedded in report data body or print output** — branch appears only in LocationBanner and section header badge. Printing the data area produces a document with no branch identification. Needed for BIR compliance. | Audit 1 (P2-1) | M | High | 🔴 OPEN |
| P2-02 | **New KDS ticket pulse animation expires after ~3 seconds** — a 60-second "NEW" badge would reduce missed tickets in a noisy kitchen. | Audit 1 (P2-2) | S | Med | 🔴 OPEN |
| P2-03 | **Owner defaults to "All Locations" on every login — no last-branch memory** — must click "Change Location" at session start to see single-branch data. Session should resume last-used branch. | Audit 1 (P2-3) | M | Med | 🔴 OPEN |
| P2-04 | **PaxModal shows all 12 pax buttons even for a 4-person table** — buttons 5–12 are fully clickable for a 4p table. Lightly grey out over-capacity options. | Audit 1 (P2-4) | S | Low | 🔴 OPEN |
| P2-05 | **No volume control for KDS new-order audio** — `new-order.wav` plays at fixed 0.7. Kitchen environments vary in ambient noise level. | Audit 1 (P2-5) | M | Med | 🔴 OPEN |
| P2-06 | **OrderHistory badge count not shift-scoped** — "🧾 History 14" increments across sessions; misleading as a shift metric, not labeled as all-time. | Audit 1 (P2-6) | S | Low | 🔴 OPEN |
| P2-07 | **Batch/expiry fields in delivery form are below the fold with no nudge** — optional but critical for FIFO tracking and food safety. Easily skipped under pressure. | Audit 1 (P2-8), Audit 2 (S08) | S | Med | 🔴 OPEN |
| P2-08 | **"More ▼" in OrderSidebar footer is not discoverable** — contains Pax Change, Transfer Table, Merge Tables. Staff under pressure won't find these flows. | Audit 1 (P2-9) | S | Low | 🔴 OPEN |
| P2-09 | **"SOLD OUT" toast doesn't confirm staff impact** — after kitchen marks an item sold out, toast should read "Lettuce marked sold out — staff cannot order this" to give kitchen confidence the signal was received. | Audit 1 (P2-10) | S | Low | 🔴 OPEN |
| P2-10 | **Amount field uses red text while editing in expense form** — red is typically reserved for errors. Use `text-gray-900` while editing; reserve red for the log display column. | Audit 3 (P2-1) | S | Low | 🔴 OPEN |
| P2-11 | **Receipt photo uses native `<input type="file">` — unstyled, OS-rendered, unpredictable touch size** — replace with styled `<button>` + existing `PhotoCapture.svelte` component. | Audit 3 (P2-2) | M | Med | 🟢 FIXED |
| P2-12 | **Expense log header shows no entry count** — add "(8 entries today)" to the "Expense Log" header to give immediate density context. | Audit 3 (P2-3) | S | Low | 🔴 OPEN |
| P2-13 | **Session state can collide on shared tablet with multiple browser tabs** — `sessionStorage` reads from whichever tab was last active. Manager and staff sharing a tablet browser could restore each other's sessions. | Audit 3 (Section F) | M | High | 🔴 OPEN |
| P2-14 | **Sidebar Quick Actions have no active/current-page indicator** — only main nav links show active state. When a manager is on `/stock/deliveries`, the "Receive Delivery" quick action shows no active highlight. | Audit 2 (S13) | S | Low | 🔴 OPEN |
| P2-15 | **When `locationId = 'all'`, Quick Actions show tooltip but links remain navigable** — the `?action=open` forms may not function correctly without a specific location. Links should be visually disabled or prompt for branch selection first. | Audit 2 (S13), Audit 1 (B3) | S | Med | 🔴 OPEN |
| P2-16 | **Delivery form quantity input has no `label` element, no `id`, no `name`** — the field uses a `<span>` as label, not a real `<label>`. Screen reader / AT accessibility deficit. | Audit 2 (S03) | S | Low | 🔴 OPEN |
| P2-17 | **No "last updated" / "last counted" timestamp on individual inventory rows** — manager cannot tell if the 3,000g Lettuce figure is from today's count or yesterday's. | Audit 2 (S05) | S | Med | 🔴 OPEN |
| P2-18 | **Inventory "Low Stock: 0" filter button affordance is unclear** — the health stat cards are clickable as filters but look like informational badges. Their interactive nature is not discoverable without tapping. | Audit 2 (S05) | S | Low | 🔴 OPEN |
| P2-19 | **X-Read `?action=open` URL param has no effect** — the sidebar quick action points to `/reports/x-read?action=open` but the page ignores the param (no modal or action fires). Dead convention. | Audit 2 (S11) | S | Low | 🔴 OPEN |

---

## Summary

| Priority | Count | Critical themes |
|---|---|---|
| **P0** | **9** | BIR compliance (X-Read), unconfirmed deletes, silent voids to KDS, checkout printer block, kitchen 86 path missing |
| **P1** | **28** | Touch targets (5 violations), missing feedback (delivery, expense, kitchen), form draft loss, sidebar urgency signals, refill separation |
| **P2** | **19** | Polish, accessibility, discoverability, session safety |
| **Total** | **56** | |

### Issue count by module

| Module | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Expenses | 5 | 8 | 5 | **18** |
| POS / Staff | 1 | 6 | 2 | **9** |
| Kitchen / KDS | 2 | 5 | 3 | **10** |
| Manager (cross-module) | 1 | 7 | 6 | **14** |
| Owner / Reports | 1 | 2 | 3 | **6** |
| Cross-role | 0 | 1 | 1 | **2** |
| (overlap/shared) | — | — | — | **-3** |

### Deduplication notes

- "Log Expense links to wrong page" (P0-01) appeared in all 3 audits — merged into one entry
- "No success feedback" (P0-04) and "No delivery success toast" (P1-26) are different: expenses vs. delivery form
- "80+ item dropdown no typeahead" (P1-21) appeared in Audits 1 and 2 — merged
- "No form draft persistence" (P1-18) appeared in Audits 1 and 2 — merged
- "Sidebar urgency signals" (P1-19) appeared in Audits 1 and 2 — merged

---

## Fix Status (session recovery 2026-03-09)

> Cross-referenced against working tree changes: `expenses/+page.svelte`, `reports/best-sellers`, `reports/peak-hours`, `reports/staff-performance`, `reports/x-read`, `stock/deliveries`, `db/index.ts`, `db/schemas.ts`.

### P0
- [ ] P0-01 "Log Expense" sidebar still links to `/reports/expenses-daily` — NOT FIXED
- [x] P0-02 Summary header syncs with filter — `filteredTotal` derived from `filteredExpenses` (default: Today)
- [x] P0-03 Undo delete — 5s delayed write + undo toast + Manager PIN gate on every delete
- [x] P0-04 Success feedback after expense save — `successVisible` state drives flash
- [x] P0-05 deleteExpense() now PIN-gated + audit log written
- [x] P0-06 X-Read `Generate` disabled when `locationId === 'all'` with tooltip
- [ ] P0-07 Kitchen 86 / sold-out — InventoryTable still read-only for kitchen role
- [ ] P0-08 Void silent to KDS — no visual signal to kitchen on item void
- [ ] P0-09 Checkout printer blocking — printReceipt() still before finalizeCheckout()

### P1 (expenses)
- [x] P1-01 Category grouping — `<optgroup>` sections via `expenseCategoryGroups`
- [ ] P1-02 "Petty Cash" ambiguity — not renamed
- [x] P1-03 Log date filter — Today / This Week / Month / All Time (default: Today)
- [x] P1-04 Inline validation — `amountBlurred` + `formError` on blur
- [ ] P1-05 GCash/Maya in "Paid By" — needs verification in new UI
- [x] P1-06 Date field — `expenseDate` with today default, backdate supported
- [ ] P1-07 Long description truncation — not confirmed in new log table
- [ ] P1-08 Double-tap guard / carry-over — not resolved
- [x] P1-09 Loader2 spinner replaces emoji spinner
- [x] P1-10 Repeat button — already present on log rows

### P1 (POS / kitchen)
- [ ] P1-11 No "sent to kitchen" feedback after charge
- [ ] P1-12 "Void" label ambiguous in OrderSidebar
- [ ] P1-13 Refill requests not separated on KDS
- [ ] P1-14 CheckoutModal ✕ min-height: unset
- [ ] P1-15 Checkout discount buttons 32px
- [ ] P1-16 Kitchen Quick Bump 32px
- [ ] P1-17 Refuse modal ✕ min-height: unset

### P1 (stock / reports)
- [ ] P1-18 Delivery/waste form draft persistence
- [ ] P1-19 Sidebar urgency badge counts
- [ ] P1-20 KDS ticket count header
- [ ] P1-21 Item dropdown typeahead (delivery + waste)
- [x] P1-22 X-Read history branch label — `getLocationName()` added
- [ ] P1-23 Branch Comparison defaults to Today → ₱0.00
- [ ] P1-24 No refill badge on floor tiles
- [ ] P1-25 Shift start modal blocks sidebar
- [x] P1-26 Delivery success toast added
- [ ] P1-27 Waste form shows no current stock on item select
- [ ] P1-28 Waste form Reason below fold

### P2 (selected)
- [x] P2-01 Branch name in X-Read print output (hidden print:block div)
- [x] P2-11 Receipt photo uses PhotoCapture.svelte (styled, replaces raw input)
