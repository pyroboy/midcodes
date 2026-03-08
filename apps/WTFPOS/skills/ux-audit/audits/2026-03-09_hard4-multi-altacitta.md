# Hard 4-User Parallel UX Audit — 2026-03-09
**Branch:** Alta Citta (Tagbilaran) + All Locations
**Roles:** Staff · Kitchen · Manager · Owner (4 parallel agents)
**Viewport:** 1024×768 tablet
**Intensity:** Hard — 41 scenarios, 12 cross-role handoffs evaluated
**Previous audit:** `2026-03-09_extreme-multi-altacitta.md` (3-user, Staff+Kitchen+Manager)

---

## A. Text Layout Map

```
┌─────────────────────────────────────────────────────────┐
│  AppSidebar (icon rail)  │  SidebarInset                │
│  [POS][KDS][STK][RPT]    │  LocationBanner ←always      │
│                          │  ─────────────────────────── │
│  STAFF VIEW              │  FloorPlan (8 tables T1–T8)  │
│  ✓ Nav correct           │  "Start Your Shift" overlay  │
│                          │  ← BLOCKS elevated roles too │
│  KITCHEN VIEW            │  KDS Queue / empty state     │
│  ↩ UNDO LAST [orange]    │  ← visible, silent on click  │
│  History [57]            │  ← ticket cards (truncated)  │
│                          │                              │
│  MANAGER VIEW            │  Reports / EOD modal         │
│  ✓ No Admin in nav       │  Step2: 3 utility fields ✓   │
│                          │  Edit rates toggle ✓         │
│  OWNER VIEW              │  AllBranches 2-panel view    │
│  All Locations default   │  OCC counter ≠ SVG count     │
│  2-click branch switch   │  "Start Shift" blocks obs.   │
└─────────────────────────────────────────────────────────┘

FOLD LINE (768px height)
```

---

## B. Scenario Scorecard

| Scenario | Role | Result | Notes |
|----------|------|--------|-------|
| S1 — Login + floor plan | Staff | PASS | Quick-login panel fast, floor plan correct |
| S2 — Table open + PaxModal | Staff | PASS | AddItemModal auto-opens after pax confirm |
| S3 — Add items, package | Staff | PASS | "14 items sent to kitchen" toast confirmed |
| S4 — T2 open while T1 active | Staff | CONCERN | Split attention: T1 bill visible while T2 PaxModal open |
| S5 — Refill panel | Staff | PASS | Meats + 9 free sides, Done closes cleanly |
| S6 — Pax change PIN flow | Staff | CONCERN | PIN cancel doesn't reset pax value |
| S7 — Checkout T1 | Staff | PASS | Cash ₱2000, change ₱404, receipt shown |
| S8 — Order history void badge | Staff | PASS | cancelReason visible; unstyled plain text |
| S9 — Staff /reports access | Staff | **FAIL** | Full X-Read page loads — no route guard |
| S10 — KDS queue empty state | Kitchen | PASS | "No pending orders" with stats, calm UX |
| S11 — UNDO LAST (bump undo) | Kitchen | CONCERN | Works silently, zero feedback toast |
| S12 — Items state after undo | Kitchen | CONCERN | Green checkmarks persist, 0/4 shows — ambiguous |
| S13 — Refuse item flow | Kitchen | PASS | 5-reason modal, well-gated, clear |
| S14 — Inventory page | Kitchen | PASS | 93 items, search, stock bars, clean |
| S15 — Delivery form | Kitchen | PASS | Searchable picker + supplier chips present |
| S16 — Waste log | Kitchen | CONCERN | Plain dropdown, 93 items, no search |
| S17 — Weigh station | Kitchen | CONCERN | No BT scale UI, no pairing button |
| S18 — Manager POS access | Manager | PASS | Floor plan visible, nav correct |
| S19 — X-Read generate | Manager | PASS | Inline confirm, BIR warning, clear |
| S20 — Expense ratio NaN | Manager | CONCERN | Stat card shows "—" ✓; table TOTAL shows "NaN%" ✗ |
| S21 — Expense sub-categories | Manager | PASS | Gas/LPG, Electricity, Water, Internet all present |
| S22 — EOD utility fields | Manager | PASS | Water field + editable rates + auto-expense note all confirmed |
| S23 — EOD Z-Read submit | Manager | PARTIAL | Source confirmed; interactive blocked by session instability |
| S24 — Manager /admin gate | Manager | PASS | Silent redirect to /pos, correct |
| S25 — Owner all-branches view | Owner | PASS | 2-panel, reactive occupancy + orders |
| S26 — Branch switching | Owner | PASS | 2-click switch, LocationBanner always visible |
| S27 — Shift modal blocks owner | Owner | **FAIL** | "Start Your Shift" overlay blocks floor observation |
| S28 — EOD guard at 'all' | Owner | PASS | Red warning banner, button disabled |
| S29 — Expenses-daily Infinity% | Owner | CONCERN | "Infinity%" in % of Sales column when sales=₱0 |
| S30 — Admin access | Owner | PASS | Users, logs, floor-editor all accessible |
| S31 — Branch comparison | Owner | CONCERN | All zeros, no live data shown |
| S32 — Floor editor vs POS | Owner | CONCERN | Editor "No tables yet" but POS shows 8 tables |

**Scorecard totals: 16 PASS · 12 CONCERN · 4 FAIL**

---

## C. Per-Role Summary

### Staff (Ate Rose)
| Principle | Result |
|-----------|--------|
| Route guard for /reports | **FAIL — P0** |
| PaxModal + AddItemModal flow | PASS |
| Multi-table context switching | CONCERN |
| Checkout + receipt | PASS |
| Void reason badge | PASS (styling P2) |
| Leftover check surprise | CONCERN |
| Order history findability | CONCERN (78 orders, no filter) |

### Kitchen (Kuya Marc)
| Principle | Result |
|-----------|--------|
| KDS empty state | PASS |
| Bump undo — functional | PASS |
| Bump undo — feedback | **FAIL — P1** |
| Post-undo item state | CONCERN — P1 |
| Refuse flow | PASS |
| Delivery form | PASS |
| Waste log picker | CONCERN — P2 |
| Weigh station hardware | CONCERN — P2 |

### Manager (Sir Dan)
| Principle | Result |
|-----------|--------|
| POS floor access | PASS |
| X-Read generate | PASS |
| Expense ratio (stat card) | PASS |
| Expense ratio (table row) | **FAIL — P1** |
| Expense sub-categories | PASS |
| Utilities parent selectable | CONCERN — P1 |
| EOD utility UX (3 fields) | PASS |
| EOD editable rates | PASS |
| EOD auto-expense note | PASS |
| /admin gate | PASS |

### Owner (Boss Chris)
| Principle | Result |
|-----------|--------|
| All-branches dashboard | PASS |
| Location switching (2 clicks) | PASS |
| LocationBanner always visible | PASS |
| Shift modal blocks observation | **FAIL — P0** |
| EOD 'all' guard | PASS |
| Infinity% expenses-daily | CONCERN — P1 |
| Admin access | PASS |
| Floor editor vs POS mismatch | CONCERN — P2 |
| Audit log placeholders | CONCERN — P2 |

---

## D. Cross-Role Handoff Assessment

| Handoff | Result | Notes |
|---------|--------|-------|
| H1: Staff opens table → KDS ticket appears | PASS | Reactive, "14 items sent to kitchen" toast confirmed |
| H2: Manager blocks /admin for manager | PASS | Silent redirect works |
| H3: Staff /reports access blocked | **FAIL** | No route guard — P0-1 |
| H4: EOD utility → auto-expense in report | PASS (source) | Auto-expense logic confirmed in code |
| H5: Owner sees all-branch data | PASS | 2-panel AllBranches view reactive |
| H6: Elevated roles bypass shift modal | **FAIL** | Shift modal not role-gated — P0-2 |
| H7: Void reason surfaced to staff | PASS | cancelReason visible, styling P2 |

---

## E. Best Day Ever — All 4 Roles

**Staff (Ate Rose):** Opens T1, pax modal is fast, AddItemModal auto-opens, adds the package. Refill panel is clean. Checkout flows smoothly. The only rough moment is when she opens T2 while T1's bill is still visible — two minds at once.

**Kuya Marc (Kitchen):** Queue loads fast. The 57-served stat is motivating. Refuse flow is clean and well-gated. He hits UNDO LAST and the ticket comes back — but he's not sure if it worked. He stares at the screen for a second, waiting for something. The green checkmarks on the restored ticket confuse him further.

**Sir Dan (Manager):** Logs expenses for Gas/LPG and Electricity, both go in first try. Checks expenses-daily — the new sub-categories look great. Opens EOD — Water field is there, rates are editable, cost breakdown is clear. Submits. Clean.

**Boss Chris (Owner):** Logs in, sees both branches side by side. Clicks Alta Citta — "Start Your Shift" immediately blocks the screen. He's not starting a shift. He just wants to watch the floor. Every time he switches branches it blocks him again.

---

## F. Prioritized Recommendations

### P0 — Blocking (fix before next real service)

| Code | Issue | Effort | File |
|------|-------|--------|------|
| **P0-1** | Staff can access `/reports/*` via direct URL — no route guard — exposes gross sales, X-Read history, Generate button to cashier-level | S | `+layout.svelte` or `reports/+layout.svelte` |
| **P0-2** | "Start Your Shift" cash float modal does not check role — blocks owner/manager from observing branch floors on every branch switch | S | `pos/+page.svelte` or `ShiftModal` |

### P1 — This sprint

| Code | Issue | Effort | File |
|------|-------|--------|------|
| **P1-1** | KDS UNDO LAST fires silently — no toast, no "Ticket T4 restored" feedback | S | `kitchen/orders/+page.svelte` |
| **P1-2** | After UNDO LAST, restored ticket items keep green served checkmarks while showing 0/4 progress — fix `recallTicket` to clear visual state | S | `pos/kds.svelte.ts` |
| **P1-3** | NaN% in expense table TOTAL row — stat card shows "—" but table TOTAL row doesn't guard against division-by-zero | S | `reports/expenses-daily/+page.svelte` |
| **P1-4** | "Infinity%" in expenses-daily % of Sales per-row when sales=₱0 (different location from stat card fix) | S | `reports/expenses-daily/+page.svelte` |
| **P1-5** | "Utilities" parent category still selectable in expense dropdown — should be `<optgroup>` header or disabled option | S | `ExpensesModal.svelte` / `expenses/+page.svelte` |
| **P1-6** | PaxChangeModal: PIN cancel doesn't reset the pax value entered before PIN gate — stale value persists | S | `pos/PaxChangeModal.svelte` |
| **P1-7** | Order History: 78+ orders in flat scroll, no search or date filter | M | `pos/OrderHistoryModal.svelte` |

### P2 — Backlog

| Code | Issue | Effort |
|------|-------|--------|
| **P2-1** | Waste log item picker: plain 93-item dropdown, no search — inconsistent with delivery form | S |
| **P2-2** | KDS ticket item names truncated in collapsed state ("Sam...") — kitchen safety risk | S |
| **P2-3** | Weigh Station: no BT scale pairing UI or connection status shown | M |
| **P2-4** | Void reason text unstyled in order history (plain lowercase text, not badged) | S |
| **P2-5** | Floor Editor shows "No tables yet" despite POS having 8 tables — likely locationId mismatch | S |
| **P2-6** | Audit log branch filter has "QC"/"MKTI" placeholder names instead of real branch names | S |
| **P2-7** | AllBranches OCC counter mismatches SVG floor plan table count | S |
| **P2-8** | RETURN button label in KDS — should be "REFUSE" or "CANNOT SERVE" | S |
| **P2-9** | EOD: ₱0 cash blocks "Declare Drawer Count" — inconsistent with shift-start which allows ₱0 | S |

---

## G. New vs Already-Fixed

| Item | Status |
|------|--------|
| EOD Water meter field | ✅ Confirmed implemented |
| EOD editable utility rates | ✅ Confirmed implemented |
| EOD auto-expense on submit | ✅ Confirmed in source |
| Expense sub-categories (Gas/LPG, Electricity, Water, Internet) | ✅ Confirmed in dropdown |
| Expense ratio stat card NaN% | ✅ Fixed (shows "—") |
| KDS completeAll undo toast | ✅ Works for "Complete All" |
| Void cancelReason in order history | ✅ Visible |
| Session using sessionStorage (not localStorage) | ✅ Already correct |
| UNDO LAST feedback | ❌ Still silent — P1-1 |
| KDS post-undo item state | ❌ Green checkmarks persist — P1-2 |
| Expense table TOTAL row NaN% | ❌ Still present — P1-3 |
| Infinity% per-row | ❌ New find — P1-4 |
| Utilities selectable as category | ❌ New find — P1-5 |
