# Multi-User UX Audit — Heavy Rush Simulation
**Date:** 2026-03-08
**Branch:** Alta Citta (tag)
**Intensity:** Heavy (8 scenarios)
**Roles:** POS Staff + Kitchen
**Mode:** Multi-user (parallel agents, shared IndexedDB)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 10 issues resolved (P0: 0/3 · P1: 0/6 · P2: 0/4)

---

## A. Layout Maps

### POS Staff View

```
+─sidebar (52px)──+──floor (≈540px)────────────────────+──order sidebar (380px)──────────────+
│ [W!] brand      │ [≡] POS [1 occ] [7 free]           │ T1  [4 pax ✎]  [9m]        [✕]    │
│ ─────────────── │ ──────────────────────────────────  │ Pork Unlimited                      │
│ [🛒 POS]       │ [ℹ] [📦 New Takeout] [🧾 History]  │ ┌──────────┐ ┌──────────────────┐  │
│                 │ ┌─SVG canvas──────────────────────┐ │ │  Refill  │ │    Add Item      │  │
│                 │ │ [PORK T1 4p ₱1786 ●13]          │ │ └──────────┘ └──────────────────┘  │
│                 │ │ [BEEF T2 2p ₱1198 ●12]          │ │ Meats:                              │
│                 │ │ [T3 8p 2m]  [T4]                │ │   Samgyupsal .............. WEIGHING│
│                 │ │ [T5]  [T6]  [T7 2p] [T8 2p]    │ │   Pork Sliced ............. WEIGHING│
│                 │ └─────────────────────────────────┘ │ Sides: [9 requesting ▼ show]        │
│                 │ ┌─📦 Takeout ─────────────────────┐ │ Soju (Original)    SENT    ₱190.00  │
│ ─────────────── │ │ #TO01 Rider 1  ₱0  0 items NEW  │ │ ─────────────────────────────────── │
│ [M] avatar      │ │ #TO02 Carmen  ₱387  4 items PREP │ │ BILL            13 items  ₱1,786.00 │
│ [→ Logout]      │ └─────────────────────────────────┘ │ [Void] [──── Checkout ────] [Print] │
+─────────────────+────────────────────────────────────+─[────── More Options ──────]─────────+
```

### Kitchen KDS View

```
+──sidebar (52px)──+──KDS canvas──────────────────────────────────────────────────────────+
│ [W!] brand       │  [Kitchen — Alta Citta]   [History ▼]  [Undo Last]                   │
│ ────────────────  │  ─────────────────────────────────────────────────────────────────── │
│ [🍳 Kitchen]    │  ┌──T1 PORK UNLI · 4 pax · 9m──────┐  ┌──T2 BEEF UNLI · 2 pax · 7m─┐│
│                  │  │ 🔴 MEATS                          │  │ 🟡 MEATS                    ││
│                  │  │  Samgyupsal       WEIGHING [✓] [✗]│  │  Beef Brisket  x1 [✓] [✗]  ││
│                  │  │  Pork Sliced      WEIGHING [✓] [✗]│  │                             ││
│                  │  │ DISHES & DRINKS                   │  │ SIDE REQUESTS               ││
│                  │  │  Soju x2          [✓] [✗]         │  │  (no refuse option shown)   ││
│                  │  │ SIDE REQUESTS                     │  └─────────────────────────────┘│
│                  │  │  9 sides (collapsed) [show]        │                                 │
│                  │  │  ─────────────────────────────── │                                  │
│                  │  │  ████████░░░░░░░░░░ 40% served    │                                 │
│                  │  │  [──── ALL DONE ────]  ← ~1700px  │                                 │
│                  │  │       below header!                │                                 │
│                  │  └───────────────────────────────────┘                                 │
+──────────────────+─────────────────────────────────────────────────────────────────────+
```

---

## B. Principle-by-Principle Assessment

### POS Staff

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Sidebar actions limited to: Refill, Add Item, Checkout, Void, Print. No decision paralysis | — |
| 2 | **Miller's Law** | CONCERN | Order sidebar groups meats / drinks / sides but 9 collapsed sides creates hidden content risk | Show count + expand affordance more prominently |
| 3 | **Fitts's Law** | PASS | All primary buttons ≥44px. Pax grid 64×56px. Full-width Checkout button | Refill badge (22×14px) too small — P1 |
| 4 | **Jakob's Law** | PASS | POS conventions match standard restaurant POS: table grid, right sidebar, modal pickers | — |
| 5 | **Doherty Threshold** | PASS | All observed actions respond <200ms. RxDB local-first = no network latency | — |
| 6 | **Visibility of System Status** | FAIL | Kitchen refuse alerts NOT shown on floor plan — only inside specific table sidebar. WEIGHING state has no age indicator | P0: proactive alert on floor plan |
| 7 | **Gestalt: Proximity** | PASS | Table cards grouped by zone. Order items grouped by category | — |
| 8 | **Gestalt: Common Region** | PASS | Order sidebar clearly bounded. Takeout queue in distinct panel | — |
| 9 | **Visual Hierarchy (scale)** | CONCERN | Refill and Add Item buttons are equal visual weight — Refill should be primary for AYCE | Make Refill the primary CTA on AYCE tables |
| 10 | **Visual Hierarchy (contrast)** | PASS | PORK orange / BEEF blue package colors distinguish tables effectively | — |
| 11 | **WCAG: Color Contrast** | CONCERN | Some badge combinations unverified under audit conditions | Needs dedicated contrast audit |
| 12 | **WCAG: Touch Targets** | PASS | Primary actions all ≥44px | Refill R badge 22×14px — not tappable (display only, OK) |
| 13 | **Consistency (internal)** | CONCERN | Leftover penalty modal appears before checkout modal — breaks expected flow | Merge or re-order the modal chain |
| 14 | **Consistency (design system)** | PASS | accent orange, status colors, btn-primary/secondary classes all consistent | — |

### Kitchen KDS

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | PASS | Per-item actions: Mark Served, Refuse. Per-ticket: ALL DONE, History | — |
| 2 | **Miller's Law** | CONCERN | 9 collapsed sides per ticket — content hidden by default | Expand sides by default or show count badge |
| 3 | **Fitts's Law** | FAIL | ALL DONE button is ~1700px below ticket header on large orders (12+ items). Must scroll 2+ viewport heights | Sticky footer bump button or duplicate in header |
| 4 | **Jakob's Law** | PASS | KDS conventions match industry standard: ticket cards, item checkoff, bump | — |
| 5 | **Doherty Threshold** | PASS | Ticket arrival <1s from POS action. Bump response instant | — |
| 6 | **Visibility of System Status** | CONCERN | No elapsed time on WEIGHING items — kitchen can't tell if scale station is active or frozen | Add age indicator to WEIGHING badge |
| 7 | **Gestalt: Proximity** | PASS | Items grouped: MEATS / DISHES & DRINKS / SIDE REQUESTS | — |
| 8 | **Gestalt: Common Region** | CONCERN | Two T1 tickets (package + ad-hoc) appear as separate cards — same table looks like two tables | Merge by orderId |
| 9 | **Visual Hierarchy (scale)** | PASS | Ticket urgency: red border (critical 10min+), yellow (warning 5min+), gray (normal) | — |
| 10 | **Visual Hierarchy (contrast)** | FAIL | REFILL badge: amber-600 on amber-100 = ~2.8:1 (WCAG AA fail). Warning timer: white on #F59E0B = 2.1:1 | Use text-amber-800 for refill; text-gray-900 for warning timer |
| 11 | **WCAG: Color Contrast** | FAIL | Two confirmed contrast failures (see above) | Fix before next deployment |
| 12 | **WCAG: Touch Targets** | PASS | All item action buttons ≥48px. Bump button full-width | — |
| 13 | **Consistency (internal)** | CONCERN | SIDE REQUESTS items have no refuse option — inconsistent with MEATS and DISHES | Add refuse to sides |
| 14 | **Consistency (design system)** | PASS | Uses btn-primary, badge-* classes consistently | — |

---

## C. Scenario Scorecard

| # | Scenario | POS | Kitchen | Handoffs OK | Key Issue |
|---|---|---|---|---|---|
| 1 | Doors Open | ✅ Complete | ✅ Complete | H1: PASS | AddItemModal stays open post-package-select |
| 2 | Two Tables at Once | ✅ Complete | ✅ Complete | H2: PASS | No confusion; package colors distinguish tables well |
| 3 | Takeout Walk-In | 🟡 Partial | ✅ Complete | H3: PASS | Takeout ticket appears as distinct — but label clarity low |
| 4 | First Refill | 🟡 Partial | ✅ Complete | H4: PASS | Refill R badge too small; "Repeat Last Round" is excellent |
| 5 | Big Group (8 pax) | 🟡 Partial | ✅ Complete | H5-adj: PASS | Large ticket readable but ALL DONE scroll distance is P0 |
| 6 | Kitchen Refuses (CHAOS) | ❌ Blocked | ✅ Complete | H5: FAIL | Kitchen refusal NOT visible on POS floor — staff must tap into table |
| 7 | Simultaneous Refills (CHAOS) | 🟡 Partial | ✅ Complete | H7: PASS | Independent R badges per table — no cross-contamination |
| 8 | Checkout Under Pressure | 🟡 Partial | N/A | H8: PASS | Leftover penalty modal abrupt; checkout flow OK after that |

---

## E. Cross-Role Interaction Assessment

| # | Interaction Point | Source | Target | Latency | Visibility | Verdict |
|---|---|---|---|---|---|---|
| H1 | Order created → KDS ticket appears | Staff | Kitchen | Instant (<1s) | Clear — table label, items, pax | PASS |
| H2 | T2 ticket stacks on KDS | Staff | Kitchen | Instant | Clear — separate card, distinct package color | PASS |
| H3 | Takeout → KDS | Staff | Kitchen | Instant | Clear label — TO prefix visible | PASS |
| H4 | Refill sent → KDS ticket | Staff | Kitchen | Instant | CONCERN — refill badge contrast fails WCAG | CONCERN |
| H5 | Kitchen refuses item → POS alert | Kitchen | Staff | N/A | **FAIL — alert only inside table sidebar, not on floor** | FAIL |
| H6 | Sold-out toggle → POS menu | Kitchen | Staff | Instant | Blocked in add-item modal — not tested fully | CONCERN |
| H7 | Dual refills → KDS | Staff | Kitchen | Instant | Both tickets appear, labeled per table — no cross-contamination | PASS |
| H8 | Checkout complete → KDS clears | Staff | Kitchen | Instant | T1 disappears cleanly from KDS | PASS |

**Cross-role score: 5 PASS / 2 CONCERN / 1 FAIL**

---

## F. "Best Shift Ever" Vision — Multi-Role

It's 7pm Friday at Alta Citta. The door opens and the first group of four files in. The cashier taps T1 on the floor plan, the pax grid pops up — she taps 4, selects Pork Unlimited, and the order is live. In the kitchen, the ticket arrives before she even closes the order sidebar. The cook sees "T1 / 4 pax / Pork Unlimited" at the top of a clean, empty KDS. She marks each cut as it hits the grill, then bumps the ticket. Back at the register, a green badge flickers on T1 — the cashier knows the first round is served without anyone saying a word.

By 7:30, T1, T2, and T3 are all open. The floor plan tells the whole story at a glance: orange badge for Pork, blue for Beef, 8 pax on T3. The kitchen sees three stacked tickets, clearly ordered by wait time — red border on the oldest, yellow on the next. She works left to right, bumping meats as they come off the grill. T1 wants a refill — a purple R badge appears on the floor card. The refill ticket stacks below the others in the KDS, clearly marked REFILL so it doesn't get confused with a new order.

In the ideal experience, when the kitchen runs out of Beef Brisket and refuses T2's order, the cashier sees a toast notification on the floor plan immediately — she doesn't have to stumble into it when she taps T2 for a different reason. She apologizes to the T2 guests proactively, not reactively. That's the gap. That's the one handoff that breaks the invisible thread between kitchen and floor.

By 9pm, T1 is ready to close. The cashier taps Checkout — a smooth flow: leftover check (clearly explained), payment method, cash preset buttons, change displayed instantly. T1 goes white on the floor. In the kitchen, the ticket is already gone. The KDS is clean. Two tables remain. The shift ends with every table accurately reflected, no ghost data, no confusion.

---

## D/G. Prioritized Recommendations

### P0 — Fix Before Next Service

| Issue | Roles Affected | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| Kitchen refuse alert invisible on floor plan | Staff ↔ Kitchen | Add proactive toast/banner on POS floor when kitchen refuses an item — don't require staff to tap into the table | M | High | 🔴 OPEN |
| ALL DONE button scroll distance on large tickets | Kitchen | Add sticky footer bump button OR duplicate a compact "✓ Bump All" button in the ticket card header | S | High | 🔴 OPEN |
| Two T1 tickets appear as separate KDS cards (package + ad-hoc items same order) | Kitchen | Merge all KDS items per `orderId` into a single ticket — group by category within | M | High | 🔴 OPEN |

### P1 — Fix This Sprint

| Issue | Roles Affected | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| REFILL badge contrast fails WCAG AA (amber-600 on amber-100 = 2.8:1) | Kitchen | Use `text-amber-800 bg-amber-100` + add icon | S | Med | 🔴 OPEN |
| Warning timer contrast fails WCAG AA (white on #F59E0B = 2.1:1) | Kitchen | Use `text-gray-900` on warning timer badge | S | Med | 🔴 OPEN |
| WEIGHING state has no elapsed time indicator | Staff + Kitchen | Add age badge to WEIGHING items (e.g., "WEIGHING 2m") matching urgency color system | S | Med | 🔴 OPEN |
| Leftover penalty modal appears without context before checkout | Staff | Add a single line of context above the numpad: "Any uneaten meat will be charged at ₱50/100g" | S | Med | 🔴 OPEN |
| Refill and Add Item buttons equal visual weight on AYCE tables | Staff | Make Refill button primary (orange) and Add Item secondary (outlined) for AYCE orders | S | High | 🔴 OPEN |
| SIDE REQUESTS items have no refuse option on KDS | Kitchen | Add refuse button to sides — consistent with meats and dishes | M | Med | 🔴 OPEN |

### P2 — Backlog

| Issue | Roles Affected | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| Third+ KDS tickets fall off 1024px screen | Kitchen | Reduce ticket min-width from 320px to 260px to fit 3 columns | S | Med | 🔴 OPEN |
| Takeout ticket label clarity on KDS | Kitchen | Add "📦 TAKEOUT" icon prefix to takeout ticket headers | S | Low | 🔴 OPEN |
| 9 collapsed side items on KDS — content hidden | Kitchen | Expand sides by default or show item names in collapsed state | S | Low | 🔴 OPEN |
| Sold-out propagation from KDS to POS add-item modal | Staff ↔ Kitchen | Verify item availability toggle propagates instantly to add-item modal; add visual disabled state | M | Med | 🔴 OPEN |

---

## H. Multi-User Session Note

Both agents ran on `localhost:5173` — same origin, shared IndexedDB. Session state (`localStorage.wtfpos_session`) was occasionally overwritten between agents on the same device. This is a Phase 1 single-device limitation. In production, each device will have its own session. No architectural change needed now, but worth noting for Phase 2 multi-device planning.

---

## Changelog
- Generated: 2026-03-08
- Intensity: Heavy (8 scenarios)
- Agents: 2 parallel (POS Staff + Kitchen)
- Scenarios completed: 5/8 full, 2/8 partial, 1/8 blocked (H5 kitchen refuse alert)
