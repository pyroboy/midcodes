# UX Audit — Extreme Chaos Multi-User · Alta Citta (Tagbilaran)

**Date:** 2026-03-09
**Mode:** Multi-user (4 parallel agents)
**Intensity:** Extreme — 13 scenarios, chaos-specialized
**Branch:** Alta Citta (Tagbilaran) `tag`
**Viewport:** 1024×768 tablet (all agents)
**Scenario theme:** Mid-service rush with simultaneous food delivery, water gallon expense, lettuce running out, manager checking reports with branch clarity

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 29 issues resolved (P0: 0/4 · P1: 0/15 · P2: 0/10)

## Roles

| Agent | Role | Primary pages audited |
|---|---|---|
| A1 | `staff` | `/pos` — floor plan, order sidebar, refill panel, void, checkout |
| A2 | `kitchen` | `/kitchen/orders` — KDS queue, ticket cards, bump, refuse, stock access |
| A3 | `manager` | `/stock/deliveries`, `/reports/expenses-daily`, `/stock/inventory`, `/stock/waste`, `/reports/x-read` |
| A4 | `owner` | `/reports/*` — all report sub-pages, branch attribution audit |

---

## A. Layout Maps (Per Role)

### A1 — Staff: POS Floor Plan

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (collapsed icon-rail)   LOCATION BANNER: ALTA CITTA (TAG)  │
│ [W!] [POS] [Logout]             ──────────────────────────────────  │
│                                 ┌── POS TOPBAR ──────────────────┐  │
│                                 │ [≡] POS  [1 occ] [7 free]     │  │
│                                 └────────────────────────────────┘  │
│                                 ┌── FLOOR PLAN (70%) ──────────┐ ┌─┐│
│                                 │ [T1◉] [T2] [T3] [T4]         │ │N││
│                                 │ PORK/4p/₱1596               │ │o││
│                                 │ [T5]  [T6] [T7] [T8]         │ │ ││
│                                 │ ↑ all available/green         │ │T││
│                                 │ ══ FOLD LINE ══              │ │a││
│                                 │ (Takeout zone below fold)     │ │b││
│                                 └──────────────────────────────┘ └─┘│
│                                                                     │
│  ORDER SIDEBAR (on table select):                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ T1 · 4 pax ✎ · 1m                               [✕]       │     │
│  │ [🔄 Refill]  [Add Item]                                    │     │
│  │ ─────────────────────────────────────────────────────────  │     │
│  │ Pork Unlimited      ₱1,596.00  PKG  [SENT]                │     │
│  │ Samgyupsal          [WEIGHING]                             │     │
│  │ Pork Sliced         [WEIGHING]                             │     │
│  │ Sides: 9 requesting  ▼ show                               │     │
│  │ ─────────────────────────────────────────────────────────  │     │
│  │ BILL: 12 items                        ₱1,596.00           │     │
│  │ [Void] [Checkout] [Print] [More ▼]                        │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### A2 — Kitchen: KDS Queue

```
┌──────────────────────────────────────────────────────────────┐
│ LOCATION BANNER: ALTA CITTA (TAGBILARAN)                     │
│ Kitchen Orders  [History]   [All Orders]                     │
├───────────────────────────────────────────────────────────────┤
│ (no ticket count header)                                     │
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ T1 · 4 pax   │ │ T3 · 2 pax   │ │ T5 · 6 pax   │          │
│ │ PORK ·  2m   │ │ BEEF · 1m    │ │ MIX  · 3m    │          │
│ │──────────────│ │──────────────│ │──────────────│          │
│ │ MEATS        │ │ MEATS        │ │ MEATS        │          │
│ │ Samgyupsal   │ │ Chadol...    │ │ US Beef ×6   │          │
│ │ ────────     │ │ ────────     │ │ ────────     │          │
│ │ DISHES/DRINK │ │              │ │ SIDES        │          │
│ │ Soju ×2      │ │              │ │ (no sep.)    │          │
│ │ ────────     │ │              │ │              │          │
│ │ [RETURN] [!] │ │ [RETURN] [!] │ │ [RETURN] [!] │          │
│ │ [✓ DONE]     │ │ [✓ DONE]     │ │ [✓ DONE]     │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                              │
│ FOLD LINE (~3 cards visible at 1024×768)                     │
│ Cards 4–N below fold — no scroll indicator                  │
│                                                              │
│ [🔔 ALL DONE] (bottom, scroll-dependent)                    │
└──────────────────────────────────────────────────────────────┘
```

### A3 — Manager: Multi-Module Navigation

```
LOGIN → [Manager card] → PIN modal → /pos (ShiftStart BLOCKER)
                                           ↓ (Start Shift)
SIDEBAR QUICK ACTIONS (1 tap each from anywhere):
  Receive Delivery → /stock/deliveries    [form auto-opens]
  Log Expense      → /reports/expenses-daily?action=open
  Log Waste        → /stock/waste?action=open
  Stock Count      → /stock/counts
  X-Reading        → /reports/x-read
  Transfer Stock   → /stock/transfers
  End of Day       → /reports/eod

NAVIGATION TAP COST:
  /pos → /stock/deliveries : 1 tap
  /stock/deliveries → /expenses : 2 taps (DELIVERY FORM DATA LOST)
  /stock → /reports/x-read : 1 tap
  /reports → /pos : 1 tap
```

### A4 — Owner: Reports Header

```
/reports (Alta Citta context)
┌─────────────────────────────────────────────────────────┐
│ LocationBanner: [ ALTA CITTA (TAGBILARAN) ] [Change ▼] │
├─────────────────────────────────────────────────────────┤
│ "Branch Reports"  [📍 Alta Citta (Tagbilaran)]          │ ← NEW (just fixed)
│─────────────────────────────────────────────────────────│
│ [Operations v][Expenses v][Revenue v][Profit v][Branch] │
│  Meat Report  Daily  Sales Summary  Gross  Compare      │
│  X-Read       Monthly Best Sellers  Net                 │
│  EOD…                 Peak Hours                        │
└─────────────────────────────────────────────────────────┘

/reports (All Locations context)
├─────────────────────────────────────────────────────────┤
│ "Consolidated Reports"  [🌐 All Branches]               │
├─────────────────────────────────────────────────────────┤
│ [Generate X-Read] button still ENABLED ← COMPLIANCE BUG│
└─────────────────────────────────────────────────────────┘
```

---

## B. 14-Principle Assessment (Per Role)

### B1 — Staff

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | OrderSidebar footer: 4 buttons — Void / Checkout / Print / More ▼. Void and Checkout adjacent. | Separate Void spatially from Checkout; put Void in More ▼ or add gap+color |
| 2 | **Miller's Law** | CONCERN | PaxModal: 12 buttons (1–12). 7±2 limit violated; buttons 5–12 exceed most table capacities. | Grey out above table capacity; show 1–6 by default |
| 3 | **Fitts's Law** | FAIL | CheckoutModal ✕: `min-height: unset`. Discount buttons: 32px. VoidModal reason: 40px. All below 44px minimum. | Audit and fix all explicit `min-height: unset` overrides |
| 4 | **Jakob's Law** | PASS | Package selection flow, PIN modal, floor plan layout all match POS conventions. | — |
| 5 | **Doherty Threshold** | CONCERN | No "sent to kitchen" feedback after CHARGE. RxDB writes are instant but staff get no confirmation. | Toast: "Order sent to kitchen" after CHARGE |
| 6 | **Visibility of Status** | FAIL | No refill badge on floor tiles. No "kitchen backlog" counter. Post-void: no kitchen-notified signal. "WEIGHING" label unexplained. | Add tile badges; post-action toasts |
| 7 | **Gestalt: Proximity** | CONCERN | "Void" and "Checkout" are in the same button row with equal visual weight. | Red-zone vs green-zone spatial/color separation |
| 8 | **Gestalt: Common Region** | PASS | OrderSidebar groups: header, items, totals, actions — clearly delineated. | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | TOTAL amount in CheckoutModal is large and prominent. But inside OrderSidebar, all item rows are the same size regardless of package vs add-on. | Larger font for package line; smaller for included sides |
| 10 | **Visual Hierarchy (contrast)** | CONCERN | "WEIGHING" status badge has same visual weight as "SENT" — but they mean different things (process state vs delivery state). | Differentiate with color: grey=WEIGHING, blue=SENT |
| 11 | **WCAG: Contrast** | PASS | Accent orange on white, status-green on white all meet 3:1+ minimum. | — |
| 12 | **WCAG: Touch Targets** | FAIL | 3 confirmed violations: CheckoutModal ✕, discount buttons, VoidModal reason buttons. | Fix all `min-height` overrides in modal contexts |
| 13 | **Consistency (internal)** | CONCERN | "Void" button can mean: (a) void entire order (sidebar footer), (b) void individual item (item ✕ button). Two different actions share one label. | Rename: "Cancel Order" for footer, keep ✕ for items |
| 14 | **Consistency (design system)** | CONCERN | `min-height: unset` overrides in modals break the touch target guarantee set in app.css. | Establish a modal-specific `.btn-modal` class that preserves 44px |

**Staff Verdict: 2 FAIL · 6 CONCERN · 6 PASS**

### B2 — Kitchen

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Each ticket card has 2 primary actions (RETURN / DONE). Simple binary choice. | — |
| 2 | **Miller's Law** | CONCERN | At peak: 6–8 tickets visible. With MEATS + DISHES + refill items per card, each card has 5–10 line items. | Collapse low-priority items by default (expand on tap) |
| 3 | **Fitts's Law** | FAIL | Quick Bump button: 32px explicit override. Refuse modal ✕: `min-height: unset`. Expand row items: ~30px. All below 44px. | Fix all touch target violations — kitchen has greasy hands |
| 4 | **Jakob's Law** | PASS | KDS card layout (table / timer / items / action) is standard restaurant KDS convention. | — |
| 5 | **Doherty Threshold** | PASS | RxDB reactive — tickets appear instantly when orders are placed. No perceived lag. | — |
| 6 | **Visibility of Status** | FAIL | No void notification on KDS — item silently disappears. No refill count in header. No ticket-count summary. Kitchen cannot tell system state at a glance. | Void pulse animation + "VOIDED" badge before item removal; ticket counter in header |
| 7 | **Gestalt: Proximity** | CONCERN | Refill requests (SIDE REQUESTS) fall into DISHES & DRINKS group — not spatially separated from cook-orders. | Always render SIDE REQUESTS as a distinct group with orange background |
| 8 | **Gestalt: Common Region** | PASS | Cards are clearly bounded. MEATS / DISHES / SIDES sections within card are separated by lines. | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | Table number is in the card header — readable. But elapsed time is same size as item names. Timer should be largest element after table number. | Increase elapsed time font to `text-2xl font-mono` |
| 10 | **Visual Hierarchy (contrast)** | PASS | "NEW" pulse on recent tickets. Status colors (yellow=active, green=done) are used consistently. | — |
| 11 | **WCAG: Contrast** | PASS | Sufficient contrast on all text vs background combinations observed. | — |
| 12 | **WCAG: Touch Targets** | FAIL | Quick Bump (32px), Refuse modal ✕ (unset), expand rows (~30px). 3 violations in the primary interaction flow. | Fix before kitchen use — grease + stress = misses |
| 13 | **Consistency (internal)** | CONCERN | "SOLD OUT" path exits through a refuse-reason modal designed for "RETURN" scenarios. The copy in the refuse modal doesn't reflect "marking as sold out". | Add a dedicated "86 item" path separate from refuse/return |
| 14 | **Consistency (design system)** | CONCERN | Kitchen stock page (`/stock/inventory`) renders as read-only for kitchen role — no visual explanation of why. Kitchen is blocked from marking items unavailable without explanation. | Show "Read only — contact manager to update" or add a limited 86-button for kitchen |

**Kitchen Verdict: 3 FAIL · 5 CONCERN · 6 PASS**

### B3 — Manager

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Quick Actions sidebar gives 7 named tasks — clear and limited. | — |
| 2 | **Miller's Law** | CONCERN | Delivery item select: 80+ items in a native `<select>`. Waste form: same. Chunking completely absent. | Add typeahead/search to all item dropdowns |
| 3 | **Fitts's Law** | PASS | Quick Action links are full-width, touch-safe (>44px). Form inputs are `pos-input` class with proper sizing. | — |
| 4 | **Jakob's Law** | PASS | Delivery form, expense form, waste form all use expected input patterns. | — |
| 5 | **Doherty Threshold** | CONCERN | No success feedback after saving delivery or waste log. Manager must scan the history table to confirm. | Add a success toast: "Delivery saved — 20kg Pork Bone-In from Metro Meat" |
| 6 | **Visibility of Status** | FAIL | Sidebar shows no urgency signals: no low-stock count on Stock nav, no open tables count on POS link, no kitchen alert badge. Manager must navigate to each section to detect problems. | Add urgency badge counts to sidebar nav items |
| 7 | **Gestalt: Proximity** | PASS | Form fields in delivery/waste/expense forms are logically grouped and vertically separated. | — |
| 8 | **Gestalt: Common Region** | PASS | Quick Actions, nav items, and user info are clearly separated in sidebar with visual groupings. | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | The X-Read KPI area (Gross Sales, Net Sales) is the standout page. Other pages (delivery form, inventory list) lack a clear hero number — the "single most important stat" is not highlighted. | On inventory page, add a hero "X items below threshold" count at top |
| 10 | **Visual Hierarchy (contrast)** | PASS | Branch badges, status cards (health stats in inventory), alert states all use appropriate color weights. | — |
| 11 | **WCAG: Contrast** | PASS | All text/background combinations meet minimum contrast. | — |
| 12 | **WCAG: Touch Targets** | PASS | Form inputs and buttons are all touch-safe in manager pages. | — |
| 13 | **Consistency (internal)** | FAIL | "Log Expense" quick action goes to `/reports/expenses-daily?action=open`. The lean expense entry page is at `/expenses`. Two paths exist with different layouts for the same task. | Standardize on one expense entry path; delete or redirect the other |
| 14 | **Consistency (design system)** | CONCERN | Shift modal appears before Quick Actions are accessible — correct behavior, but the modal has no "skip for now" emergency bypass for delivery-at-open scenarios. | Consider allowing delivery receive before shift start (or unlock Quick Actions with a float = 0 bypass) |

**Manager Verdict: 1 FAIL · 5 CONCERN · 8 PASS**

### B4 — Owner

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Reports tab navigation: 11+ tabs in 5 groups. No "start here" hierarchy for tonight's oversight question. | Pin "X-Read" as a hero shortcut; dim historical-analysis tabs during live service hours |
| 2 | **Miller's Law** | PASS | 5 tab groups with ≤4 tabs each — within chunking limits. | — |
| 3 | **Fitts's Law** | PASS | Tab targets are full-width rows, well above 44px. | — |
| 4 | **Jakob's Law** | PASS | Reports layout with grouped tabs is a standard analytics pattern. | — |
| 5 | **Doherty Threshold** | PASS | RxDB reactive — live data badge present, data updates without page reload. | — |
| 6 | **Visibility of Status** | CONCERN | No real-time "pulsing dot" live indicator in most report pages. Sales Summary has a "Live" text label that is easy to overlook. | Add an animated indicator (same as x-read's green pulse) to all pages showing live data |
| 7 | **Gestalt: Proximity** | CONCERN | In "All Locations" context, X-Read page shows aggregate numbers with no breakdown by branch. Two very different data scopes (single-branch vs aggregate) look identical visually. | Show a branch breakdown mini-table even in aggregate X-Read view |
| 8 | **Gestalt: Common Region** | PASS | Report sub-pages use consistent card layout with clear groupings. | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | X-Read is excellent — gross sales dominates. Sales Summary: the grid of 5 KPI cards gives equal weight to all metrics. Tonight, the owner cares about Gross Sales first. | Make Gross Sales card 2× wider in Sales Summary |
| 10 | **Visual Hierarchy (contrast)** | PASS | Branch badge in accent orange is visually distinct and prominent in reports header. | — |
| 11 | **WCAG: Contrast** | PASS | All text passes minimum contrast ratios. | — |
| 12 | **WCAG: Touch Targets** | PASS | Tab targets and buttons all meet minimum. | — |
| 13 | **Consistency (internal)** | FAIL | "Generate X-Read" button is active in `locationId === 'all'` context. This creates an aggregate BIR record that is invalid and potentially harmful to compliance. | Disable the Generate button when locationId is 'all'; show tooltip: "Select a branch first" |
| 14 | **Consistency (design system)** | PASS | All report pages use the same header pattern, consistent badge colors, consistent tab styling. The recent "Branch Reports" / "Consolidated Reports" fix is correctly applied across all sub-pages. | — |

**Owner Verdict: 1 FAIL · 5 CONCERN · 8 PASS**

---

## C. Cross-Role Interaction Assessment (Section E)

| # | Interaction | Source | Target | Latency | Visibility | Verdict |
|---|---|---|---|---|---|---|
| H1 | Order submitted → KDS ticket appears | Staff (POS) | Kitchen (KDS) | Instant (RxDB reactive) | Clear — card appears with table/items/timer | **PASS** |
| H2 | Multiple rapid orders → tickets stack | Staff (POS) | Kitchen (KDS) | Instant | Partial — no queue depth counter in header; kitchen must count cards | **CONCERN** |
| H3 | Waste logged by kitchen → inventory updates | Kitchen (Stock) | Manager (Inventory) | Instant (RxDB reactive) | Concern — no "recently updated" timestamp per inventory row | **CONCERN** |
| H4 | Refill requests × 3 → KDS visibility | Staff (RefillPanel) | Kitchen (KDS) | Instant | **FAIL** — refills fall into DISHES & DRINKS section with no visual separator; easy to miss during a cook-order surge | **FAIL** |
| H5 | Void approved → KDS notification | Staff (VoidModal) | Kitchen (KDS) | — | **FAIL** — item silently disappears from KDS ticket with no notification; kitchen may continue preparing | **FAIL** |
| H6 | Manager generates X-Read → Owner sees same data | Manager (Reports) | Owner (Reports) | Instant (same RxDB) | Clear — when both are scoped to Alta Citta, both see identical data | **PASS** |
| H7 | Staff checkout → Owner live sales update | Staff (Checkout) | Owner (Reports/Sales Summary) | Instant | Partial — "Live" text label present but no animated indicator; update itself is reactive | **CONCERN** |

**Cross-role handoff score: 2 PASS / 3 CONCERN / 2 FAIL**

The two FAIL handoffs (H4 refills, H5 voids) are the highest-risk gaps in a chaos scenario. Both involve kitchen not knowing about a critical state change, leading to wasted food prep and incorrect orders.

---

## D. "Best Shift Ever" Vision — 4-Role Chaos Narrative

It's 6 PM and the WTF! Alta Citta dining room is filling up fast.

**Maria (Staff)** taps T1 — the PaxModal appears immediately, her muscle memory goes straight to "4" without thinking. She selects Pork Unlimited and the order is charged in 4 taps flat. The floor plan tile updates instantly: *PORK · 4p · 1m · ₱1,596*. She gets a quick green toast at the bottom of the screen — *"T1 order sent to kitchen"* — and she's already moving to T3. There's no anxiety about whether the kitchen got it.

**Carlo (Kitchen)** sees the T1 ticket flash into existence on the KDS — a brief green pulse signals it's new. The meats are listed clearly, the timer is already counting. Two minutes later, T3 and T5 tickets stack in. Carlo can see at a glance: "3 active tickets, 6 items total" in the header count. The refill panel requests from T1 and T3 sit in their own orange-tinted REFILL REQUESTS section at the top of each card — visually separated from the cook queue so they don't get lost.

**Juan (Manager)** is at the back door when the delivery van pulls up. He taps Quick Action → Receive Delivery from his tablet — the form auto-opens to the delivery entry screen. He types "18" in the kg field (one tap to correct from 20 — the field is prominent), selects Pork Bone-In from a typeahead search, and confirms. A success toast reads *"18.0kg Pork Bone-In from Metro Meat — saved."* He remembers the water gallons, taps Quick Action → Log Expense, enters ₱500 in 3 taps, and is back to monitoring the floor in under 90 seconds. His inventory shows a "1 item below threshold" badge on the sidebar Stock link — he checks lettuce: 1,200g left, below the 2,000g minimum. He taps "Log Waste" to record the spoilage, and notices the kitchen can flag the item as "86" directly from their KDS. The POS already shows the sides request button greyed out for lettuce — staff won't accidentally take orders they can't fill.

**Christopher (Owner)** opens his phone. He last visited Alta Citta, so the app resumes that context directly. The Reports header says *"Branch Reports · 📍 Alta Citta (Tagbilaran)"* — no guessing which branch he's looking at. He taps X-Read and sees: *Gross Sales ₱101,402 · Net Sales ₱99,412 · 179 Pax* — three critical numbers, above the fold, no scrolling. He taps branch-comparison to see how Panglao is doing tonight for comparison. The print button is right there for end-of-night BIR reporting — the printout will include the branch name, date, and all BIR-required figures.

*This is the service as it should feel: each role's device is a purpose-built tool for exactly their job, information flows between roles without friction, and no one is left wondering what's happening in the other person's world.*

**Where it falls short today:** Maria doesn't get that "sent to kitchen" toast. Carlo doesn't see voided items animate out — they just disappear, and he's already grilling pork that's been cancelled. Juan loses his delivery form data the moment he checks expenses. Christopher accidentally generates an X-Read for "All Locations" which is not a valid BIR document.

---

## E. Scenario Scorecard

| # | Scenario | Completed? | Handoffs OK? | Friction Pts | Verdict |
|---|---|---|---|---|---|
| S01 | "Doors Open" | ✅ Yes | 1/1 (partial — no toast) | 3 | CONCERN |
| S02 | "Rush: 3 Tables in 30s" | ✅ Yes | 2/2 (partial — no count) | 4 | CONCERN |
| S03 | "Delivery Van Arrives" | ⚠️ Blocked by shift modal on first login | N/A | 2 | CONCERN |
| S04 | "Water Gallon Expense" | ✅ Yes | N/A | 2 | PASS |
| S05 | "Lettuce Low Alert" | ⚠️ Partial — stock visible, no 86 path | 0/1 | 3 | CONCERN |
| S06 | "Refill Surge" | ✅ Yes | 1/1 (FAIL — refills not separated) | 4 | FAIL |
| S07 | "Owner Checks Branch" | ✅ Yes | N/A | 2 | PASS |
| S08 | "Delivery Count Mismatch" | ✅ Yes | N/A | 1 | PASS |
| S09 | "Lettuce Hits Zero" | ❌ Blocked — no kitchen 86 path | 0/1 | 3 | FAIL |
| S10 | "Void Under Pressure" | ✅ Yes | 0/1 (FAIL — no KDS notify) | 5 | FAIL |
| S11 | "X-Read at 8PM" | ✅ Yes | 1/1 | 2 | PASS |
| S12 | "Peak Hour Pileup" | ⚠️ Partial — printer-block risk | 2/3 | 5 | CONCERN |
| S13 | "Full Chaos" | ⚠️ Partial | 2/5 | 7 | CONCERN |

**Pass: 4 · Concern: 6 · Fail: 3 · Blocked: 0 (mitigated)**

---

## F. Per-Role Verdict Summary

| Role | PASS | CONCERN | FAIL | Ready? |
|---|---|---|---|---|
| Staff (A1) | 6 | 6 | 2 | ⚠️ Friction — fix touch targets + status signals |
| Kitchen (A2) | 6 | 5 | 3 | ❌ Not ready — void + refill handoffs broken |
| Manager (A3) | 8 | 5 | 1 | ⚠️ Friction — expense path inconsistency, no sidebar alerts |
| Owner (A4) | 8 | 5 | 1 | ⚠️ Near-ready — BIR compliance bug must fix |

---

## G. Full Issue Breakdown

### P0 — MUST FIX (service-blocking or compliance-breaking)

**[P0-1] Owner · "Generate X-Read for All Locations" creates invalid BIR record**
The Generate button is active when `locationId === 'all'`. Pressing it produces a permanent aggregate X-Read that is not a valid BIR document. Must block this with an error + "select a branch first" message.
[Effort: S · Impact: High]

**[P0-2] Cross-role (Kitchen ↔ Staff) · Kitchen cannot 86/flag sold-out items**
`InventoryTable.svelte` renders read-only for `kitchen` role — no 86 button accessible. Kitchen is the first to know an item is gone; they cannot signal it to POS without leaving their station and finding a manager. Causes incorrect orders every service.
[Effort: M · Impact: High]

**[P0-3] Cross-role (Staff ↔ Kitchen) · Void is silent to KDS — item disappears without notification**
When `voidOrderItem()` runs on POS, the KDS ticket item is cancelled silently. No toast, pulse, or badge on the KDS card. Kitchen continues preparing a dish that has been voided. Causes wasted food and incorrect orders on every shift.
[Effort: M · Impact: High]

**[P0-4] Staff · Checkout flow blocked when thermal printer fails**
`printReceipt()` runs before `finalizeCheckout()`. A failing/offline printer stalls the entire checkout flow — cashier cannot settle the bill. This is the highest-impact single-point-of-failure in the entire app.
[Effort: M · Impact: High]

---

### P1 — FIX THIS SPRINT (friction under chaos conditions)

**[P1-1] Staff · No "sent to kitchen" feedback after order is charged**
After CHARGE in AddItemModal, no toast or notification confirms the kitchen received the order. Staff must re-open the OrderSidebar and check item badges individually.
[Effort: S · Impact: High]

**[P1-2] Staff · "Void" in sidebar footer voids entire order — label is ambiguous**
The footer "Void" button cancels the full order. The item-level ✕ is a separate action. Under pressure, staff may trigger a full order void when trying to remove one item. Rename to "Cancel Order" with a red-zone visual cue.
[Effort: S · Impact: High]

**[P1-3] Kitchen · Refill requests not visually separated from cook-order tickets**
Refill entries fall into the DISHES & DRINKS group on KDS with no visual differentiation. During a 3-table refill surge, requests are buried in cook orders. Add a distinct REFILL REQUESTS section with orange tint to every KDS ticket card.
[Effort: M · Impact: High]

**[P1-4] Staff · CheckoutModal ✕ button has `min-height: unset` — below 44px**
The close button on the most-used modal in the app explicitly removes the touch target guarantee. Fix immediately.
[Effort: S · Impact: Med]

**[P1-5] Staff · CheckoutModal discount buttons are 32px — below 44px**
During checkout, discount buttons (SC, PWD, Promo, Comp) are 32px height. Under pressure these will be missed, causing incorrect discounts.
[Effort: S · Impact: Med]

**[P1-6] Kitchen · Quick Bump button is 32px — below 44px (greasy hands)**
The most-tapped button in the kitchen flow has an explicit `min-height: 32px` override. Fix to 44px minimum.
[Effort: S · Impact: High]

**[P1-7] Kitchen · Refuse modal ✕ has `min-height: unset`**
The close button on the refuse modal violates touch target standards.
[Effort: S · Impact: Med]

**[P1-8] Manager · No form draft persistence — delivery/waste form lost on navigation**
Switching pages during delivery or waste entry destroys all form state silently. A manager interrupted mid-delivery by a floor issue loses their entire entry.
[Effort: M · Impact: High]

**[P1-9] Manager · "Log Expense" Quick Action goes to wrong page**
Quick Action → "Log Expense" links to `/reports/expenses-daily?action=open`, not the lean `/expenses` form. Two paths to the same task with different layouts. Consolidate.
[Effort: S · Impact: Med]

**[P1-10] Manager · Sidebar shows no urgency signals**
The Quick Actions sidebar has no badge counts: no "3 items below threshold" on Stock, no "2 open tables" on POS, no kitchen alert count. Manager must navigate into each section to discover problems.
[Effort: M · Impact: High]

**[P1-11] Kitchen · No ticket count summary in KDS header**
When the queue has 6+ tickets, kitchen must visually count cards to understand workload. A "6 active tickets · 23 items" header count would help at a glance.
[Effort: S · Impact: Med]

**[P1-12] Manager · Item dropdowns in delivery and waste forms have 80+ items with no typeahead**
Both forms use native `<select>` elements with the full stock item list. Finding "Lettuce" requires scrolling through 80+ items. Adding search-within-select reduces form time by ~50%.
[Effort: S · Impact: High]

**[P1-13] Owner · X-Read history entries show no branch label**
Each X-Read in the history list shows only number, time, and user. When the owner is in "All Locations" context (or looking at a printed history), entries from different branches are indistinguishable.
[Effort: S · Impact: Med]

**[P1-14] Owner · Branch Comparison defaults to "Today" (shows ₱0.00 before EOD)**
The branch comparison page defaults to "Today" filter which returns ₱0 until orders are settled. Owner opens the one page designed for branch comparison and sees a blank table. Default to "This Week".
[Effort: S · Impact: Med]

**[P1-15] Staff · No refill badge on floor plan tiles during refill surge**
When a table sends a refill request, the floor plan tile shows no indicator. Staff must remember which tables have pending refills without any visual cue.
[Effort: S · Impact: Med]

---

### P2 — BACKLOG (polish, not urgent)

**[P2-1] Owner · No branch name embedded in report data content (print gap)**
Branch name appears in the LocationBanner and section header badge, but NOT inside any data row, table header, or report body. Printing just the data area produces a document with no branch identification. Needed for BIR compliance.
[Effort: M · Impact: High]

**[P2-2] Kitchen · New ticket pulse expires after 3 seconds**
The `animate-pulse` on new KDS tickets expires too quickly. A 60-second "NEW" badge would reduce missed tickets in a noisy kitchen environment.
[Effort: S · Impact: Med]

**[P2-3] Owner · Owner defaults to "All Locations" on every login — no last-branch memory**
The owner must click "Change Location" at the start of every session to see single-branch data. Session should resume the last-used location, or prompt "Resume Alta Citta?" on login.
[Effort: M · Impact: Med]

**[P2-4] Staff · PaxModal shows all 12 pax buttons even when table capacity is 4**
Buttons 5–12 are fully clickable for a 4-person table. Add light greying for over-capacity options (still tappable for edge cases, but visually deprioritized).
[Effort: S · Impact: Low]

**[P2-5] Kitchen · No volume control for new-order audio**
`new-order.wav` plays at fixed 0.7 volume. Loud kitchen environments may need louder. Quieter service hours may need softer. A settings slider would help.
[Effort: M · Impact: Med]

**[P2-6] Staff · History badge count not shift-scoped**
"🧾 History 14" increments across sessions — not reset per shift. As a shift metric it's misleading; as an all-time metric it's not labeled as such.
[Effort: S · Impact: Low]

**[P2-7] Manager · Delivery form has no confirmation step and no success toast**
High-risk form (affects BIR stock records) has no "Are you sure?" confirm and no visible success state after submission. Low risk for day-to-day but high risk during chaos when mistyped values go unnoticed.
[Effort: S · Impact: Med]

**[P2-8] Manager · Batch/expiry fields not nudged in delivery form**
Optional fields for batch number and expiry date are below the fold with no nudge. These are critical for FIFO tracking and food safety but are easily skipped under pressure.
[Effort: S · Impact: Med]

**[P2-9] Staff · "More ▼" in OrderSidebar is not discoverable**
Contains: Pax Change, Transfer Table, Merge Tables. These are important flows that staff won't find under pressure. Consider surfacing them as small icon buttons or making the label more explicit.
[Effort: S · Impact: Low]

**[P2-10] Kitchen · "SOLD OUT" toast doesn't confirm staff impact**
After kitchen marks an item sold out, the toast should read: "Lettuce marked sold out — Staff cannot order this item" to give kitchen confidence.
[Effort: S · Impact: Low]

---

## H. Multi-User Specific Recommendations (Cross-Role)

| Priority | Cross-Role Issue | Roles Affected | Fix | Effort | Impact |
|---|---|---|---|---|---|
| **P0** | KDS receives no notification on POS void | Staff ↔ Kitchen | When `voidOrderItem()` runs, update KDS ticket item status to `voided` + trigger a brief red pulse on the ticket card | M | High |
| **P0** | Kitchen has no path to flag sold-out items | Kitchen → Staff | Add limited `stockItem.isAvailable` toggle accessible to kitchen role from KDS page or sidebar quick-action | M | High |
| **P1** | Refill requests buried in cook-order tickets | Staff → Kitchen | Add `isRefill: true` to KDS ticket items; render as separate "REFILL REQUESTS" section with orange tint in every ticket card | M | High |
| **P1** | POS gives no confirmation kitchen received orders | Staff ← Kitchen (implicit) | Add a brief "Sent to kitchen" toast after CHARGE in AddItemModal | S | High |
| **P1** | Manager sidebar has no cross-role alert counts | Manager ← all | Add reactive badge counts: `lowStockCount` on Stock nav, `openTableCount` on POS nav, `kitchenAlertCount` on Kitchen nav | M | High |
| **P2** | Owner/Manager: X-Read printouts lack branch name inline | Owner + Manager | Add a `<PrintHeader>` component (hidden on screen, visible in print CSS) with branch name + date + BIR registration number | M | High |

---

## Overall Recommendation

This multi-user flow is **not ready for an unsupervised peak-hour service shift** — P0-3 (void is silent to KDS) and P0-2 (kitchen cannot 86 items) will cause incorrect orders and wasted food prep on every busy evening; P0-1 (All Locations X-Read) is a BIR compliance timebomb that must be closed before the next EOD. The core architecture is sound — RxDB reactive data flow is fast and reliable, the floor plan UX is genuinely efficient, and the reports section is well-organized. Fix the 4 P0s and the 3 high-impact P1 cross-role issues (refill separation, sent-to-kitchen toast, manager sidebar alerts) and this system is defensible for a real Friday night service.

---

## I. Fix Status

### P0

| Code | Issue | Status |
|---|---|---|
| P0-1 | Owner · Generate X-Read for All Locations creates invalid BIR record | 🔴 OPEN |
| P0-2 | Cross-role · Kitchen cannot 86/flag sold-out items | 🔴 OPEN |
| P0-3 | Cross-role · Void is silent to KDS — item disappears without notification | 🔴 OPEN |
| P0-4 | Staff · Checkout flow blocked when thermal printer fails | 🔴 OPEN |

### P1

| Code | Issue | Status |
|---|---|---|
| P1-1 | Staff · No "sent to kitchen" feedback after order is charged | 🔴 OPEN |
| P1-2 | Staff · "Void" in sidebar footer voids entire order — label ambiguous | 🔴 OPEN |
| P1-3 | Kitchen · Refill requests not visually separated from cook-order tickets | 🔴 OPEN |
| P1-4 | Staff · CheckoutModal ✕ button has `min-height: unset` — below 44px | 🔴 OPEN |
| P1-5 | Staff · CheckoutModal discount buttons are 32px — below 44px | 🔴 OPEN |
| P1-6 | Kitchen · Quick Bump button is 32px — below 44px | 🔴 OPEN |
| P1-7 | Kitchen · Refuse modal ✕ has `min-height: unset` | 🔴 OPEN |
| P1-8 | Manager · No form draft persistence — delivery/waste form lost on navigation | 🔴 OPEN |
| P1-9 | Manager · "Log Expense" Quick Action goes to wrong page | 🔴 OPEN |
| P1-10 | Manager · Sidebar shows no urgency signals | 🔴 OPEN |
| P1-11 | Kitchen · No ticket count summary in KDS header | 🔴 OPEN |
| P1-12 | Manager · Item dropdowns in delivery and waste forms have 80+ items with no typeahead | 🔴 OPEN |
| P1-13 | Owner · X-Read history entries show no branch label | 🔴 OPEN |
| P1-14 | Owner · Branch Comparison defaults to "Today" (shows ₱0.00 before EOD) | 🔴 OPEN |
| P1-15 | Staff · No refill badge on floor plan tiles during refill surge | 🔴 OPEN |

### P2

| Code | Issue | Status |
|---|---|---|
| P2-1 | Owner · No branch name embedded in report data content (print gap) | 🔴 OPEN |
| P2-2 | Kitchen · New ticket pulse expires after 3 seconds | 🔴 OPEN |
| P2-3 | Owner · Owner defaults to "All Locations" on every login | 🔴 OPEN |
| P2-4 | Staff · PaxModal shows all 12 pax buttons even when table capacity is 4 | 🔴 OPEN |
| P2-5 | Kitchen · No volume control for new-order audio | 🔴 OPEN |
| P2-6 | Staff · History badge count not shift-scoped | 🔴 OPEN |
| P2-7 | Manager · Delivery form has no confirmation step and no success toast | 🔴 OPEN |
| P2-8 | Manager · Batch/expiry fields not nudged in delivery form | 🔴 OPEN |
| P2-9 | Staff · "More ▼" in OrderSidebar is not discoverable | 🔴 OPEN |
| P2-10 | Kitchen · "SOLD OUT" toast doesn't confirm staff impact | 🔴 OPEN |
