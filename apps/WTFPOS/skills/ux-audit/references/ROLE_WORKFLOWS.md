# Role Workflow Maps

Per-role shift workflows showing what each WTFPOS user does during a typical service day,
with frequency counts and UX criticality ratings. Use during audits to weight findings by
real-world impact — a friction point on a 200×/shift action matters far more than one on
a 2×/shift action.

---

## Staff (Cashier) — Ate Rose

**Primary pages:** `/pos` (floor plan + order sidebar)
**Shift:** 3pm–11pm (prep + full service)
**Device:** 10" tablet on counter stand, occasionally handheld

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login (PIN or role card) | 1× | `/` login | LOW — once per shift |
| 2 | Scan floor plan for available tables | ~50× | `/pos` FloorPlan | **CRITICAL** — constant scanning |
| 3 | Open table (tap → pax entry → package select) | 15–25× | PaxModal → PackageChangeModal | HIGH — first customer touchpoint |
| 4 | Add items to order (meat, sides, drinks) | 80–120× | AddItemModal | **CRITICAL** — most repeated action |
| 5 | Handle refill requests | 30–50× | RefillPanel / AddItemModal | HIGH — constant during AYCE |
| 6 | Check running bill (glance at order sidebar) | ~100× | OrderSidebar | **CRITICAL** — passive monitoring |
| 7 | Process checkout (payment entry) | 15–25× | CheckoutModal | **CRITICAL** — money handling |
| 8 | Handle split bills | 2–5× | SplitBillModal | MEDIUM — occasional |
| 9 | Apply SC/PWD discounts | 3–8× | CheckoutModal discount section | MEDIUM — compliance-sensitive |
| 10 | Void items (grace period or PIN) | 2–5× | VoidModal | MEDIUM — error recovery |
| 11 | Transfer table | 1–3× | TransferTableModal | LOW — rare |
| 12 | Merge tables | 1–2× | MergeTablesModal | LOW — rare |
| 13 | Handle takeout orders | 3–8× | NewTakeoutModal → TakeoutQueue | MEDIUM |
| 14 | View order history | 2–5× | OrderHistoryModal | LOW — reference only |
| 15 | Leftover penalty entry | 1–3× | LeftoverPenaltyModal | LOW — AYCE policy |

**Peak rush profile (7pm–9:30pm):** Actions 2–7 happen simultaneously and repeatedly.
Staff is juggling 5–8 open tables. Every extra tap or modal delay costs real service time.
The critical path is: scan floor → open table → add items → refill → checkout. Any friction
on this path is a **CRITICAL** finding.

**UX weight rule:** Findings on actions 2, 4, 6, 7 should be weighted 3× higher than
findings on actions 11–15.

---

## Dispatch / Expo — Corazon (Alta Citta) / Nena (Panglao) (Kitchen sub-role)

**Primary pages:** `/kitchen/dispatch` (expo dashboard with cross-station progress)
**Shift:** 3pm–11pm (prep + full service)
**Device:** 10" tablet at front of kitchen, near the pass, beside cashier station

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login (role card, kitchen role) → lands directly on `/kitchen/dispatch` | 1× | `/` login | LOW |
| 2 | Monitor all-station progress per table (meat/dishes/sides status) | Continuous | `/kitchen/dispatch` Dispatch Board | **CRITICAL** — primary job |
| 3 | Read per-table station progress at a glance | ~200× | DispatchTableCard station rows | **CRITICAL** — must be glanceable at 60cm |
| 4 | Plate and mark sides as DONE (dispatch's own work) | 30–60× | DONE buttons on sides items | **CRITICAL** — most repeated UI action |
| 5 | Batch-complete all sides for a table | 10–20× | ALL SIDES DONE button | HIGH |
| 6 | Acknowledge new table alert (stage utensils) | 15–25× | New Tables strip | HIGH |
| 7 | Watch for READY TO RUN indicator (all stations complete) | 15–25× | Green "READY TO RUN" banner on card | **CRITICAL** — signals food runner |
| 7b | Clear completed order (ALL DONE) | 15–25× | "ALL DONE — CLEAR ORDER" button on ready card | **CRITICAL** — clears order from dispatch board |
| 8 | Dismiss service alerts (extra napkins, tongs) | 5–15× | Service Alerts section | MEDIUM |
| 9 | Check stock levels for prep ingredients | 3–5× | `/stock/inventory` (pantry filter) | LOW |

**Peak rush profile:** The dispatch person (expo) is the coordination hub. They plate banchan,
stage utensils, and monitor all stations. When a table's card turns green (READY TO RUN),
they signal the food runner. During peak, they're managing 8–12 cards simultaneously.
Hands alternate between wet (produce, soup) and dry (utensils).

**UX weight rule:** Findings on actions 2, 3, 4, 7 should be weighted 3× — these are the core
dispatch loop. The READY TO RUN indicator must be visible from 90cm. Any touch target <56px
is CRITICAL. Text below 18px fails the glance test.

---

## Stove — Lito (Alta Citta) / Romy (Panglao) (Kitchen sub-role)

**Primary pages:** `/kitchen/stove` (dishes & drinks only)
**Shift:** 3pm–11pm (prep + full service)
**Device:** 10" tablet wall-mounted or on counter near stove/cooking area

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login (role card, kitchen role) → lands directly on `/kitchen/stove` | 1× | `/` login | LOW |
| 2 | Monitor stove queue for new dish/drink orders | Continuous | `/kitchen/stove` card grid | **CRITICAL** — primary job |
| 3 | Read dish name + quantity at a glance | ~100× | Stove ticket cards | **CRITICAL** — must be glanceable at 60cm |
| 4 | Mark individual dish as DONE | ~80× | DONE button per item | **CRITICAL** — most repeated action |
| 5 | Mark all dishes for a table as DONE | 15–25× | ALL DONE button | HIGH |
| 6 | Distinguish dine-in from takeout orders | ~30× | Table number vs. TAKEOUT badge | HIGH |

**Peak rush profile:** The stove operator is cooking ramyun, tteokbokki, bibimbap, and drinks.
Hands may be wet or greasy. They glance at the queue between cooking tasks. The interface
must be simple — just dishes and drinks, nothing else.

**UX weight rule:** Stove page is intentionally minimal. Findings on items 2, 3, 4 are CRITICAL.
Touch targets ≥56px. Text ≥18px. High contrast required due to steam and grease.

---

## Kitchen (Legacy KDS) — Kuya Marc

**Primary pages:** `/kitchen/orders` (legacy full KDS queue — superseded by station-specific pages)
**Note:** This page remains accessible by URL but is removed from the kitchen nav tabs.
Managers and owners can still use it for an all-in-one view of kitchen activity.

**Shift:** 3pm–11pm (prep + full service)
**Device:** 10" tablet wall-mounted at eye level, viewed from 60–90cm

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login (role card, no PIN) | 1× | `/` login | LOW |
| 2 | Monitor KDS queue for new tickets | Continuous | `/kitchen/orders` KDS grid | **CRITICAL** — primary job |
| 3 | Read ticket items + quantities | ~200× | KDS ticket cards | **CRITICAL** — must be glanceable |
| 4 | Bump individual item (mark served) | ~150× | Bump button on ticket | **CRITICAL** — most repeated action |
| 5 | Bump entire ticket (all done) | 15–25× | "All DONE" button | HIGH |
| 6 | Refuse item (out of stock) | 1–5× | RefuseReasonModal | MEDIUM — rare but important |
| 7 | Weigh meat on BT scale | 30–60× | `/kitchen/weigh-station` | HIGH — accuracy-critical |
| 8 | Verify weight reading | 30–60× | BluetoothWeightInput | HIGH |
| 9 | Check refill requests | 20–40× | KDS queue (refill items) | HIGH |
| 10 | View bumped history | 2–5× | KdsHistoryModal | LOW — reference |
| 11 | Use yield calculator | 1–3× | YieldCalculatorModal | LOW — prep time only |

**Peak rush profile:** Kitchen is managing 8–12 active tickets simultaneously. Hands are
wet/greasy. Interaction is bump-bump-bump in rapid succession. The KDS must be readable
at arm's length through steam.

**UX weight rule:** All kitchen findings should be evaluated against ENVIRONMENT.md conditions
(wet hands, 60–90cm distance, high noise). Touch targets below 56px on kitchen pages are
**CRITICAL** findings, not just CONCERN.

---

## Manager — Sir Dan

**Primary pages:** `/pos`, `/stock/*`, `/reports/*`
**Shift:** 3pm–11pm (oversees full service, handles escalations)
**Device:** 10" tablet, handheld while moving between floor and kitchen

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login + select branch | 1× | `/` login + LocationBanner | LOW |
| 2 | Monitor floor status (quick glance at POS) | ~20× | `/pos` FloorPlan | HIGH — oversight |
| 3 | Authorize PIN overrides (pax change, void, refund) | 5–10× | ManagerPinModal | HIGH — interruption-driven |
| 4 | Receive delivery | 1–3× | `/stock/deliveries` ReceiveDelivery | MEDIUM |
| 5 | Submit stock counts (10am, 4pm, 10pm) | 3× | `/stock/counts` StockCounts | HIGH — time-critical compliance |
| 6 | Log waste | 2–5× | `/stock/waste` WasteLog | MEDIUM |
| 7 | Log expenses | 3–8× | `/expenses` or ExpensesModal | MEDIUM |
| 8 | Check mid-day sales (X-Read) | 1–2× | `/reports/x-read` | MEDIUM |
| 9 | Review sales summary | 2–5× | `/reports/sales-summary` | HIGH — decision-driving |
| 10 | Check best sellers | 1–3× | `/reports/best-sellers` | MEDIUM |
| 11 | Initiate stock transfer | 0–2× | `/stock/transfers` | LOW — rare |
| 12 | Generate EOD / Z-Read | 1× | `/reports/eod` | HIGH — end-of-day compliance |
| 13 | Review voids and discounts | 1× | `/reports/voids-discounts` | MEDIUM — audit trail |

**Peak rush profile:** Manager is on their feet, moving between floor and back-of-house.
Interactions are brief (30–90 seconds per check) and interrupt-driven (staff calls for PIN
override). Navigation between modules must be fast — 2 taps max to reach any report.

**UX weight rule:** Manager findings should be weighted by cross-module navigation efficiency.
If getting from POS to stock counts requires >3 taps, that's a HIGH finding.

---

## Owner — Boss Chris

**Primary pages:** `/reports/*`, `/admin/*`, all pages for oversight
**Shift:** Remote or periodic visits (not constant)
**Device:** Personal tablet or phone, sometimes laptop

### Workflow

| # | Action | Frequency/day | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login as owner, select "All Locations" | 1× | `/` login | LOW |
| 2 | Review sales summary (both branches) | 2–3× | `/reports/sales-summary` | **CRITICAL** — primary use |
| 3 | Branch comparison | 1–2× | `/reports/branch-comparison` | HIGH |
| 4 | Review gross/net profit | 1× | `/reports/profit-gross`, `/reports/profit-net` | HIGH |
| 5 | Check expense trends | 1× | `/reports/expenses-monthly` | MEDIUM |
| 6 | Review peak hours | 1× | `/reports/peak-hours` | MEDIUM |
| 7 | Review meat report (usage vs. sales) | 1× | `/reports/meat-report` | MEDIUM |
| 8 | Check staff performance | 1× | `/reports/staff-performance` | MEDIUM |
| 9 | Review voids and discounts | 1× | `/reports/voids-discounts` | MEDIUM — trust verification |
| 10 | Manage users (add/remove/change roles) | 0–1× | `/admin/users` | LOW — infrequent |
| 11 | Review audit logs | 0–1× | `/admin/logs` | LOW — investigative |
| 12 | Switch between branches to compare | 5–10× | LocationBanner switcher | HIGH — repeated navigation |

**Usage profile:** Owner reviews data in focused 10–20 minute sessions, often from home
or during a branch visit. They scan for anomalies: unexpected drops in sales, high void
rates, expense spikes. The dashboard must surface anomalies without requiring the owner
to dig through every report.

**UX weight rule:** Owner findings should focus on data accuracy, cross-branch comparison
clarity, and anomaly visibility. A misleading number (like Best Sellers showing ₱0.00 when
sales exist) is a **CRITICAL** finding for the owner — it erodes trust in the entire system.

---

## Butcher — Kuya Benny (Kitchen sub-role)

**Primary pages:** `/kitchen/weigh-station`, `/stock/deliveries`, `/stock/waste`
**Shift:** 10am–10pm (prep + service)
**Device:** 10" tablet on counter next to BT scale, screen often splashed

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Receive meat delivery (weigh + log) | 1–3× | `/stock/deliveries` ReceiveDelivery | HIGH — accuracy-critical |
| 2 | Log deboning yield (bone-in → deboned weight) | 3–8× | Stock adjustment or delivery conversion | HIGH |
| 3 | Slice and portion meat | 20–40× | Manual (no UI step currently) | N/A |
| 4 | Weigh individual servings on BT scale | 30–60× | `/kitchen/weigh-station` | **CRITICAL** — most repeated |
| 4b | Print meat label (auto on dispatch) | 30–60× | Auto-triggered by dispatch, reprint via 🖨 button | HIGH — physical handoff |
| 5 | Confirm weight + assign to table/order | 30–60× | WeighStation UI | **CRITICAL** |
| 6 | Log preparation waste (trimmings) | 3–8× | `/stock/waste` WasteLog | MEDIUM |
| 7 | Check remaining stock levels | 5–10× | `/stock/inventory` | MEDIUM |
| 8 | Submit 10am stock count | 1× | `/stock/counts` | HIGH — compliance |

**Environment profile:** Butcher's hands are always wet or greasy. Nitrile gloves common.
Tapping precision is extremely low — knuckle taps, not fingertip. Screen accumulates grease
film over a shift. PRD explicitly requires "knuckle-sized buttons" (≥64px) and
"wet-environment" interface design.

**UX weight rule:** ANY touch target below 56px on butcher pages is a **CRITICAL** finding.
Contrast requirements are also higher due to grease film on screen.

---

## Sides Preparer (Legacy) — Corazon (Alta Citta) / Nena (Panglao) (Kitchen sub-role)

**Note:** The sides prep role has been folded into the **Dispatch / Expo** role.
Corazon and Nena now use `/kitchen/dispatch` which combines sides plating with
cross-station monitoring. The legacy `/kitchen/sides-prep` page still exists but is
removed from the nav tabs.

**Primary pages:** `/kitchen/sides-prep` (legacy — superseded by `/kitchen/dispatch`)
**Shift:** 3pm–11pm (prep + full service)
**Device:** 10" tablet on prep counter near banchan station, often splashed with water/sauce

### Workflow

| # | Action | Frequency/shift | Page/Component | UX criticality |
|---|---|---|---|---|
| 1 | Login (role card, kitchen role) → lands directly on `/kitchen/sides-prep` | 1× | `/` login | LOW |
| 2 | Monitor Sides & Drinks Queue for new items across all tables | Continuous | `/kitchen/sides-prep` full queue | **CRITICAL** — primary job |
| 3 | Read item name + count badge at a glance (batch-prep mental model) | ~150× | Queue card headers | **CRITICAL** — must be glanceable at 60cm |
| 4 | Filter by category to focus (e.g., "Sides only" during lettuce rush) | 5–15× | Category filter pills | HIGH |
| 5 | Filter by type to separate new orders from refills | 2–10× | Type filter pills | MEDIUM |
| 6 | Tap BATCH DONE on an item card (all tables done at once) | 30–60× | BATCH DONE button on queue card | **CRITICAL** — most repeated UI action |
| 7 | Tap individual table chip to mark one table done early | 10–30× | Table chip on queue card | HIGH |
| 8 | Acknowledge new table alert (stage utensils) | 15–25× | New Tables strip | HIGH |
| 9 | Dismiss service alert (extra napkins, extra plates) | 5–15× | Service Alerts section | MEDIUM |
| 10 | Check Table Status for a specific table's pending items | 3–10× | Table Status panel (collapsed by default) | LOW — reference |
| 11 | Check stock levels for prep items | 5–10× | `/stock/inventory` (pantry filter) | MEDIUM |

**Peak rush profile:** Corazon and Nena are the unsung heroes of service — every table needs a full
set of banchan, rice, soup, and utensils within 2 minutes of opening. During peak, they're
juggling 8–12 tables simultaneously. Hands alternate between wet (washing lettuce, portioning soup)
and dry (handling utensil wraps). They read the queue from ~60cm while moving between prep stations.

**Key UX pain points:**
- ~~Cannot easily distinguish side dish items from meat items on KDS tickets~~ — **Resolved**: dedicated page shows only sides/drinks/dishes, no meat items
- ~~Refill requests look identical to original orders~~ — **Resolved**: table chips distinguish 🔄 Refill vs. 🆕 New with color-coded border
- ~~No dedicated "sides prep" KDS view~~ — **Resolved**: `/kitchen/sides-prep` is now the primary landing page for Corazon and Nena
- ~~Utensil prep has zero system support~~ — **Partially resolved**: New Tables strip signals when a table opens
- **Remaining**: No stock-level warning when prep ingredients run low (rice, lettuce, kimchi) — still verbal

**Environment profile:** Hands frequently wet from washing produce and handling soup pots.
Prep station counter is cluttered with containers. Tablet shares space with cutting boards
and sauce bottles. Screen gets splashed with water, soy sauce, and soup. Similar physical
constraints to the butcher — 56px minimum touch targets, high-contrast text.

**UX weight rule:** Findings on actions 2, 3, 6, 8 should be weighted 3× — these are the core
batch-prep loop. The filter bar (actions 4–5) is HIGH importance but lower frequency. Any touch
target <56px on queue cards or table chips is a CRITICAL finding. Text below 18px on item names
or count badges fails the 60cm glance test.

---

## How to Use During Audit

1. **Before auditing:** Identify the target role. Read their workflow table above. Note which
   actions are CRITICAL (highest frequency) vs. LOW (rare).

2. **During audit:** When you find a UX issue, cross-reference with the workflow table.
   A touch-target issue on the "Add items" action (80–120×/shift) is far more impactful than
   the same issue on "Transfer table" (1–3×/shift).

3. **Writing "Why this breaks":** Use the frequency data to make the impact vivid:
   > "Ate Rose taps this button 120 times per shift. At 0.5 seconds extra per misclick,
   > that's 60 seconds of wasted time per shift — 7 hours per month across both branches."

4. **Prioritizing findings:** When all issues are flat-numbered (no P0/P1/P2), the workflow
   frequency and criticality help fix-audit decide what to fix first. Include the frequency
   in the "Why this breaks" field of every dossier.

---

## Cross-References

- **Station Responsibility Matrix:** `STATION_RESPONSIBILITIES.md` — digital read/write boundaries, physical handoff protocols, audio signals
- **Environment constraints:** `ENVIRONMENT.md` — wet hands, viewing distance, screen conditions
