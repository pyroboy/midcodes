# Assessment — Manager Scenarios @ All Retail Locations (2026-03-07)

## Coverage Summary

| Status | Count | % |
|---|---|---|
| Implemented | 9 | 26% |
| Partial | 17 | 49% |
| Missing | 9 | 26% |
| **Total** | **35** | **100%** |

---

## Per-Scenario Status

| SC# | Title | Status | Primary Route | Notes |
|---|---|---|---|---|
| SC-1 | Morning Login & Location Selection | IMPLEMENTED | `/` + LocationBanner | Login flow, manager PIN modal, location persistence confirmed |
| SC-2 | Morning EOD Review — Verifying Z-Read | IMPLEMENTED | `/reports/eod` | EOD route exists and is data-wired; historical date selection unconfirmed |
| SC-3 | Z-Read Not Run — Previous Shift Left Open | MISSING | `/reports/eod` | No system warning when a shift has been open > 24 hours; no stale-shift detection |
| SC-4 | X-Read Mid-Shift Cash Audit | PARTIAL | `/reports/x-read` | Route exists; live running total wiring and shift-safe behavior unconfirmed |
| SC-5 | Pre-Service Stock Check | IMPLEMENTED | `/stock/inventory` | Inventory list exists, location-filtered; low-stock visual threshold unconfirmed |
| SC-6 | Receiving a Supplier Delivery | IMPLEMENTED | `/stock/deliveries` | Delivery receiving flow confirmed in recent commit work |
| SC-7 | BIR Inspector Walks In Mid-Service | MISSING | `/reports/eod` | No historical Z-Read lookup by date confirmed; VAT breakdown on Z-Read unconfirmed; no export/print for historical records |
| SC-8 | Staff Rage Quit Mid-Rush | PARTIAL | `/pos` | Active tables persist (RxDB); no force-logout of another user's session; no session visibility across devices |
| SC-9 | Cashier Exits Without Closing Tables | PARTIAL | `/pos` | Tables persist after session ends (RxDB); manager can access any table at same location — confirmed by architecture |
| SC-10 | Staff No-Show — Manager Covers Floor | PARTIAL | `/pos` | System works single-operator; no conflict-of-interest flag when manager approves own voids; no staffing alerts |
| SC-11 | Wrong Role Login — Kitchen Staff on POS | PARTIAL | `/` + `/kitchen/orders` | Role cards exist; visual differentiation between Staff and Kitchen cards unconfirmed; no session role visible post-login |
| SC-12 | Approving a Cashier's Void (PIN Gate) | PARTIAL | `/pos` | VoidModal with PIN 1234 confirmed; audit log written; per-user identity on audit log unconfirmed |
| SC-13 | Service Recovery Discount — PIN Gate | PARTIAL | `/pos` checkout | `service_recovery` type in CheckoutModal; PIN gate **absent** per ASSESSMENT_USER_SCENARIOS baseline |
| SC-14 | PWD / Senior Citizen Discount Compliance | PARTIAL | `/pos` checkout | Discount types likely in CheckoutModal; pro-rata per-person calculation unconfirmed; VAT adjustment for SC/PWD unconfirmed |
| SC-15 | Waste Log Approval Mid-Rush (PIN Gate) | PARTIAL | `/stock/waste` | Waste route exists (recent commits); two-step create→approve flow and PIN gate unconfirmed |
| SC-16 | Switching to Panglao to Investigate | IMPLEMENTED | LocationBanner | Location switch via LocationSelectorModal confirmed reactive |
| SC-17 | Monitoring Both Branches (All View) | PARTIAL | `/pos` | AllBranchesDashboard component exists; limited to POS view; reports do not aggregate for `all` |
| SC-18 | Customer Refuses to Pay | PARTIAL | `/pos` | Table detail with open time and pax visible; evidence view for the customer unconfirmed; dispute logging not implemented |
| SC-19 | Wrong Payment Method Recorded | MISSING | `/pos` | No payment method correction flow on closed orders found anywhere in codebase |
| SC-20 | Power Blip — Mid-Transaction Recovery | PARTIAL | `/pos` (RxDB) | RxDB is transactional; IndexedDB restores on reboot; no explicit "Resume Session" UI prompt |
| SC-21 | AYCE Timer Abuse — Table Gaming System | MISSING | `/kitchen/all-orders` | No per-table order frequency view; no fire-rate metric; timer cancellation with PIN unconfirmed |
| SC-22 | Marking Item as Sold Out (86'ing) | PARTIAL | `/stock/inventory` | `isAvailable` field on MenuItem confirmed; manager access to toggle (without admin) unconfirmed; POS reactivity to `isAvailable` change unconfirmed |
| SC-23 | Physical Stock Count — Weekly Audit | IMPLEMENTED | `/stock/counts` | Stock count route confirmed working |
| SC-24 | Inter-Branch Stock Transfer | PARTIAL | `/stock/transfers` | Route exists (recent commit); full status lifecycle and inventory sync on both sides unconfirmed |
| SC-25 | Expense Recording — Petty Cash Out | MISSING | `/expenses` | Route is a confirmed Phase 3 placeholder stub; no expense creation possible |
| SC-26 | Analyzing Meat Yield After Delivery | IMPLEMENTED | `/reports/meat-report` | Meat report route confirmed; yield % calculation and variance flagging unconfirmed |
| SC-27 | Running EOD Z-Read and Cash Reconciliation | IMPLEMENTED | `/reports/eod` | EOD confirmed; open-table warning before Z-Read unconfirmed; BIR fields (TIN, OR range, VAT) on Z-Read unconfirmed |
| SC-28 | Health Inspector — Meat Traceability | PARTIAL | `/stock/deliveries` | Delivery records confirmed; supplier name field storage unconfirmed; historical search/filter unconfirmed |
| SC-29 | Cashier Closes Wrong Table | MISSING | `/pos` | No reopen-closed-table flow found; no payment reversal on closed orders; closed orders likely immutable |
| SC-30 | Reviewing Void/Discount Logs for Theft | PARTIAL | `/reports/voids-discounts` | Route exists; per-void detail with actor, item, table confirmed in audit log; cashier identity relies on named accounts (currently single PIN) |
| SC-31 | Weigh Station — Meat Portion Logging | PARTIAL | `/kitchen/weigh-station` | Route exists; Bluetooth scale connection partial; manual weight fallback unconfirmed |
| SC-32 | Peak Hours Analysis — Roster Planning | IMPLEMENTED | `/reports/peak-hours` | Peak hours route confirmed; hourly heatmap vs. aggregate totals unconfirmed |
| SC-33 | Shift Handover — Manager to Manager | PARTIAL | `/pos` + `/stock/waste` | Active tables visible; 86 status visible on POS; pending waste entries may not be surfaced on login |
| SC-34 | New Staff — Wrong Location Assigned | MISSING | `/admin/users` | Staff location assignment is admin-only; manager cannot correct; no first-day location check on login |
| SC-35 | Customer Requests Official Receipt (BIR OR) | MISSING | Receipt output | BIR receipt fields (TIN, OR number, VAT breakdown) on printed/digital receipt unconfirmed; OR number sequencing unconfirmed |

---

## Priority Gap Table

| Priority | Gap | Blocking real use? | Effort |
|---|---|---|---|
| P0 | **SC-7: BIR inspector cannot get historical Z-Reads** — if the system cannot retrieve Z-Read history by date, the restaurant faces fines and possible closure on first BIR inspection | Yes | L |
| P0 | **SC-35: Receipts are not BIR-compliant** — missing TIN, OR number, VAT breakdown on printed receipts is a daily BIR violation for every single transaction | Yes | L |
| P0 | **SC-3: No stale-shift warning** — if a cashier forgets to run the Z-Read, the system silently lets the next day stack on top; manager has no alert and may not discover this for days | Yes | M |
| P0 | **SC-13: Service Recovery / all discounts have no PIN gate** — any cashier can apply manager-level discounts without authorization; direct theft/fraud vector on day one of live operation | Yes | S |
| P0 | **SC-25: Expense recording is missing** — petty cash-outs (water delivery, supplies, minor repairs) are a daily operational reality; without logging them, the cash drawer is permanently "short" at EOD | Yes | L |
| P0 | **SC-19: No payment method correction on closed orders** — a daily error (Cash vs. GCash mis-tap) has no recovery path; EOD reconciliation corrupted with every occurrence | Yes | M |
| P1 | **SC-4: X-Read data wiring unconfirmed** — mid-shift cash audit may return zero or stale data; renders the primary anti-theft tool unreliable | No | M |
| P1 | **SC-21: No AYCE fire-rate visibility or timer cancellation PIN** — AYCE abuse is a real Friday night scenario; no system tools to manage it | No | L |
| P1 | **SC-29: Closed table cannot be reopened** — accidental early checkout is a realistic cashier error; no recovery path means the bill is lost and the table's customers go uncharged | No | M |
| P1 | **SC-14: SC/PWD discount VAT adjustment unconfirmed** — mandatory under Philippine law; incorrect VAT on SC/PWD discounts is a BIR violation | No | M |
| P1 | **SC-22: 86 toggle manager access unconfirmed** — if only admins can toggle `isAvailable`, the manager must call the owner during a rush to 86 a sold-out item | No | S |
| P1 | **SC-15: Waste PIN gate unconfirmed** — if kitchen can finalize waste without manager approval, unrecorded spoilage and theft via waste inflation are both possible | No | M |
| P2 | **SC-8: No force-logout for another user's session** — rage-quit cashier's session stays open on their device; manager cannot remotely close it | No | M |
| P2 | **SC-11: Role card visual differentiation unclear** — kitchen vs. staff login confusion is a real first-day risk that costs 20 minutes of service during peak hours | No | S |
| P2 | **SC-27: Open-table warning before Z-Read unconfirmed** — manager could accidentally close the shift with active tables if no warning exists | No | S |
| P2 | **SC-34: Wrong location for new staff (locked)** — manager cannot fix it; requires owner + admin access; real first-day blocker | No | S |
| P2 | **SC-28: Supplier name on deliveries unconfirmed** — health inspector needs traceability; if supplier field is missing, paper invoices are the only fallback | No | S |
| P2 | **SC-33: Pending waste not surfaced on handover** — incoming manager may not see pending waste approvals until a cashier or cook asks about them | No | S |

**Effort:** S = < 1 hour, M = 1–4 hours, L = 4+ hours

---

## Overall Readiness Score

**9 / 35 scenarios fully implemented = 26% production-ready for Manager role at All Retail Locations**

---

## Recommended Next Implementation

The top 5 gaps that, if fixed, would make the system viable for live deployment:

1. **SC-35 + SC-7: BIR receipt compliance + historical Z-Read retrieval** — These are legal requirements. Every transaction produces a non-compliant receipt right now. Every BIR inspection will fail without historical Z-Read access. These must be fixed before the restaurant goes live, not after.

2. **SC-13 + SC-14: Add PIN gate to ALL discount types** — A single change in `CheckoutModal.svelte` (add a PIN prompt before committing any discount) closes the most critical fraud vector in the system. This covers service recovery, comp, PWD, and senior citizen discounts simultaneously.

3. **SC-25: Implement expense recording** — The petty cash-out scenario happens multiple times per week. Without it, the manager's EOD cash count will always be "short" by the total of unlogged expenses. This makes the primary cash reconciliation tool useless. A basic expense form (amount, category, paymentMethod, date, locationId) is the minimum viable implementation.

4. **SC-3: Add stale-shift detection** — A 24-hour-open-shift warning on the EOD page or on manager login costs minimal effort and prevents a class of BIR violations that currently happen silently.

5. **SC-19: Payment method correction on closed orders** — A PIN-gated "correct payment method" button on any closed order prevents daily EOD discrepancies. Without this, every cashier error permanently corrupts the sales breakdown reports.
