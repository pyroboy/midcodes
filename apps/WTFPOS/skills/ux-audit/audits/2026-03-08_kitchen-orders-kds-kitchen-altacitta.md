# UX Audit — Kitchen Queue (KDS) · Kitchen Role · Alta Citta
**Date:** 2026-03-08
**Auditor:** Claude Code (Kitchen agent simulation — Friday night dinner rush)
**Role:** Pedro Cruz — Kitchen — Alta Citta (tag)
**Viewport:** 1024×768 (tablet, landscape)
**Scope:** `/kitchen/orders` — full shift simulation (Phases 1–8 from the brief)
**Intensity:** Extreme (solo agent simulating kitchen + POS handoff cycles)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 10 issues resolved (P0: 0/2 · P1: 0/5 · P2: 0/3)

---

## Context & Methodology

This audit simulates a Friday night dinner rush from the **kitchen operator's perspective**. The agent logged in as Kitchen (Pedro Cruz / Alta Citta), created orders from POS (as Maria Santos / Staff), then switched back to Kitchen to observe ticket arrival, urgency progression, bump, undo, and refill flows. Session-switching was done via the dev quick-login panel between each POS → Kitchen handoff.

**Known constraint:** Single-tab simulation required login switches between roles. Real dual-device behavior would allow simultaneous observation. Findings marked with `[SINGLE-TAB]` reflect this limitation but the UX findings themselves are based on actual observed DOM and screenshots.

---

## A. Layout Map

### Empty State (0 tickets)
```
+--sidebar(50px)--+--------------------main(974px)--------------------+
| [W!]            | [All Orders] [Order Queue ●] [Weigh Station]       |
| [🍳 Kitchen]    |---------------------------------------------------|
| [📦 Stock]      | Kitchen Queue  ● Live      [↩UNDO LAST] [History 59]|
|                 | +-stat-+ +-stat-+ +-stat-+                         |
|                 | | 0    | | 0    | | 0    |                         |
|                 | |Orders| |Tables| | Items|                         |
|                 | +------+ +------+ +------+                         |
|                 |                                                    |
|                 |         ✅ (large emoji)                           |
|                 |    No pending orders                               |
|                 |    New orders will appear here automatically       |
|                 |                                                    |
|                 | +------+ +------+ +------+                         |
|                 | | 59   | | 20m  | |114:46|                         |
|                 | |Served| |  Avg | | Last |                         |
|                 | |Today | |  Svc | | Done |                         |
|                 | +------+ +------+ +------+                         |
|                 |                                                    |
| [P] (avatar)    |                                          ~~fold~~  |
| [→ Logout]      |                                                    |
+-----------------+----------------------------------------------------+
```

### Single Ticket (12 items — requires 2.3 viewport scrolls to fully view)
```
+--sidebar--+----- ticket (full-width, ~530px wide) ------+--empty-right--+
| [W!]      | T1 #T1-UXLA          0/12      [00:26]       |               |
| [Kitchen] |---------------------------------------------|               |
| [Stock]   | 🥩 MEATS                              0g      |               |
|           |   Samgyupsal    [WEIGHING]      [✓ 48×48]    |               |
|           |   Pork Sliced   [WEIGHING]      [✓ 48×48]    |               |
|           |---------------------------------------------|               |
|           | 🍜 DISHES & DRINKS                           |               |
|           |   Kimchi                        [✓ 48×48]    |               |
|           |   Rice                          [✓ 48×48]    |               |
|           |   Cheese                        [✓ 48×48]    |               |
|           |   Lettuce                       [✓ 48×48]    |               |
|           |                          ~~fold (768px)~~     |               |
|           |   Egg                           [✓ 48×48]    |   (scroll ↓)  |
|           |   Cucumber                      [✓ 48×48]    |               |
|           |   Chinese Cabbage               [✓ 48×48]    |               |
|           |   Pork Bulgogi                  [✓ 48×48]    |               |
|           |   Fish Cake                     [✓ 48×48]    |               |
|           |---------------------------------------------|               |
|           | 🎰 SIDE REQUESTS                             |               |
|           |   Pork Unlimited                [✓ 48×48]    |               |
|           |---------------------------------------------|               |
|           | [         ALL DONE ✓              56px tall] |               |  ← ~1700px below top
+-----------+-----------------------------------------------------+--------+
```

### Ticket With Refill Inline
```
MEATS section:
  Samgyupsal  [WEIGHING●]   [✓]   ← original, blue pulsing
  Pork Sliced [WEIGHING●]   [✓]   ← original, blue pulsing
  Samgyupsal  [REFILL●]     [✓]   ← refill, amber pulsing — same section, sequential
```

### Urgency Progression
```
Timer:  00:00 → 05:00   Border: gray (normal)     Timer badge: gray
Timer:  05:01 → 10:00   Border: yellow, pulsing   Timer badge: yellow bg-status-yellow
Timer:  10:01+          Border: red, pulsing       Timer badge: red  bg-status-red
```

### Expanded Item (Refuse Actions)
```
[  Beef Brisket  ] [WEIGHING]              [✓ 48×48]
[ RETURN (red)  ] [ SOLD OUT (gray) ]                 ← appears below on tap
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | PASS | Each ticket shows 2–3 top-level action zones (sections + serve buttons). No decision paralysis — one action per row. The item expand reveals only 2 options (RETURN / SOLD OUT). | None |
| 2 | **Miller's Law** (chunking) | CONCERN | 12-item tickets group by MEATS / DISHES & DRINKS / SIDE REQUESTS — chunking is good. But 9 side items rendered as 9 individual rows exceeds 7±2 items per chunk without any sub-grouping. A bulk "sides all done" button would help. | Add "✓ All Sides" shortcut button on the DISHES & DRINKS section header |
| 3 | **Fitts's Law** (target size/distance) | CONCERN | Individual serve buttons are 48×48px — excellent. But the primary "ALL DONE" button is ~1,700px below the ticket header on a 12-item order. On a 1024×768 tablet, the kitchen cook must scroll ~2 full viewports to reach it. Under rush conditions this is a serious reach problem. | Sticky "ALL DONE" footer OR duplicate it at the ticket top |
| 4 | **Jakob's Law** (conventions) | PASS | Ticket card layout follows standard KDS convention: table label top-left, timer top-right, items in rows, bump button at bottom. RETURN = refuse (industry standard). | None |
| 5 | **Doherty Threshold** (response time) | PASS | Ticket arrival was near-instant after POS action (observed <1s). ALL DONE bump returned empty state immediately. UNDO LAST restored ticket instantly. RxDB local-first delivers sub-400ms feedback. | None |
| 6 | **Visibility of System Status** | CONCERN | Stats bar (Orders/Tables/Items) updates reactively — good. Timer counts up live — good. But the right half of the viewport (50% of 974px) is **empty whitespace** when only 1 ticket is active. No at-a-glance summary of which table has been waiting longest beyond reading the timer on each card. | Add urgency ranking indicator ("oldest first" label or a countdown ring visible at ticket top) |
| 7 | **Gestalt: Proximity** | PASS | Serve button (✓) is right-adjacent to each item row. Section labels (MEATS, DISHES & DRINKS) are clearly separated. Item expand actions (RETURN / SOLD OUT) appear directly below the item row — correct proximity. | None |
| 8 | **Gestalt: Common Region** | CONCERN | Multiple T1 tickets appear when two KDS records exist for the same table (seen with #T1--001 and #T1-EAHZ simultaneously). From 1 meter away, kitchen staff see two "T1" cards and cannot immediately distinguish which is the package ticket vs. ad-hoc items ticket. No visual grouping joins same-table tickets. | Group same-table tickets visually (shared background strip, or merge into one card) |
| 9 | **Visual Hierarchy** (scale) | CONCERN | Table label "T1" is `text-2xl font-black` — very readable from distance. But below it, ticket ID `#T1-UXLA` is `text-xs text-gray-400` — barely visible at arm's length. Section category labels (MEATS, DISHES & DRINKS) use `text-xs font-bold uppercase` — readable but small when viewed from the grill. | Increase section labels to `text-sm`. Consider bumping table number to `text-3xl` on tablets. |
| 10 | **Visual Hierarchy** (contrast) | PASS | Gray-200 background for normal, yellow-light for warning, red-light for critical — clear differentiation. Green checkmark (status-green #10B981) on white — passes for large icons. REFILL badge (amber-600 on amber-100) is distinctive. | None |
| 11 | **WCAG: Color Contrast** | CONCERN | `WEIGHING` badge: blue-600 on blue-100 is borderline (~3.5:1). `REFILL` badge: amber-600 on amber-100 = ~2.8:1, fails AA for text <18px. The timer badge text (white on yellow) at warning threshold: white on #F59E0B = 2.1:1 — **fails AA**. The information is critical (urgency) but color alone carries it — no icon on the timer badge. | Add a clock icon ⏱ to warning/critical timer badges. Use `text-gray-900` (not white) on yellow timer badge |
| 12 | **WCAG: Touch Targets** | PASS | All serve buttons: 48×48px, min-height explicitly set. RETURN/SOLD OUT: min-height 44px confirmed in source. ALL DONE: 56px height. UNDO LAST/History: 48px. | None |
| 13 | **Consistency** (internal) | CONCERN | MEATS items require tap-to-expand before refuse actions appear. DISHES & DRINKS items also require expand. But SIDE REQUESTS items have serve button directly with no expand/refuse option — inconsistent affordance pattern across the three categories. | Add expand capability to SIDE REQUESTS items for consistency |
| 14 | **Consistency** (design system) | PASS | All buttons use `.btn-*` classes or explicit `min-height`. Colors match design tokens. The `REFILL` badge uses `animate-pulse` consistently with `WEIGHING` and `COOKING` badges. | None |

**Verdict summary:** 7 PASS · 6 CONCERN · 0 FAIL

---

## C. "Best Day Ever" Vision

Pedro Cruz arrives at the grill station at 5:30 PM, 30 minutes before the Friday rush. He logs in as Kitchen with one tap of his thumb on the Pedro Cruz quick-card, and the KDS opens on the empty Order Queue. He sees 59 tickets served today — the morning shift did well. The screen is calm: large emoji, 3 stats, a clean surface.

At 6:00 PM, the first T1 ticket fires in. Pedro hears a tone (if audio is configured) and glances up from the grill. He sees a large "T1" in bold black, a fresh 00:26 timer in gray, and the MEATS section at the top: Samgyupsal and Pork Sliced, both with blue WEIGHING pills. He knows these two cuts need to come from the weigh station before he can serve them. The sides list comes in below — Kimchi, Rice, Cheese, Lettuce, plus five more. He taps the green checkmark on Kimchi first (arms-reach, 48px target) and it dims with a check icon. One by one, the sides flow in. The header counter ticks: 1/12, 2/12, 3/12...

The T2 ticket arrives while he's halfway through T1. In the ideal experience, T2 card appears to the right of T1, the stat bar bumps to "2 Orders, 2 Tables." He can glance left (T1) and right (T2) to mentally prioritize. T1 is older — its timer has turned yellow at 5:02 — so he finishes T1's sides, then moves to T2.

A refill arrives mid-rush: Samgyupsal refill for T1. The REFILL amber pill pulses in the T1 ticket's MEATS section, right below the existing items. Pedro spots it immediately — amber stands out against blue — and knows it's not a new table, it's a return visit. He plates the refill, taps the checkmark, moves on.

At the end of the night, he bumps the last ticket and the KDS returns to the serene empty state. "60 served today." He taps History to see the log, confirms all bumps are there, and clocks out.

**Where the current implementation falls short of this vision:** The ALL DONE button is unreachable without a 2-viewport scroll on large package orders (12+ items). The refill is inline but mixes with original items — on a 13-item ticket, it requires reading item names carefully to spot. Two T1 tickets appearing simultaneously breaks the mental model ("which T1 is which?"). The right half of the screen is empty whitespace even during rush — a missed opportunity for a ticket-age queue strip or priority indicator.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | **ALL DONE button unreachable without scroll** — on 12-item tickets the button is ~1,700px below the header. Greasy hands + urgent rush = dangerous scroll requirement. | Make "ALL DONE" sticky at bottom of viewport, OR duplicate a small "✓ Bump" button in the ticket header row. | M | High | 🔴 OPEN |
| **P0** | **Same-table duplicate tickets** — two T1 cards appear when a package (with included items) and an additional item order both create separate KDS records. Kitchen cannot tell them apart at a glance. Observed: #T1--001 + #T1-EAHZ simultaneously. | Merge all KDS items for the same `orderId` into a single ticket record. Prevent duplicate tickets per order. | L | High | 🔴 OPEN |
| **P1** | **Refill badge contrast fails WCAG AA** — amber-600 on amber-100 = ~2.8:1. Under harsh kitchen lighting, this fails. The badge carries critical information (refill vs. new item). | Use `text-amber-800` on `bg-amber-100` (~4.8:1) or add a ↺ icon alongside the REFILL text | S | High | 🔴 OPEN |
| **P1** | **Timer badge (yellow/warning) fails WCAG AA** — white text on `#F59E0B` = 2.1:1. The most time-critical information on the screen (urgency) has the worst contrast. | Use `text-gray-900` on yellow badge, or add ⏱ icon. Consider darker amber (`bg-amber-500`) for the badge at warning level. | S | High | 🔴 OPEN |
| **P1** | **Large tickets require scroll to see all items** — 12-item order spans 2.3 viewports. Kitchen staff lose context of which table/counter the ticket belongs to while scrolling. | Sticky ticket header (table number + timer) while scrolling within a tall card. | M | Med | 🔴 OPEN |
| **P1** | **SIDE REQUESTS items lack expand/refuse capability** — inconsistent with MEATS and DISHES items. If a requested side is unavailable, kitchen has no way to refuse it from the KDS. | Add same expand-to-refuse pattern to SIDE REQUESTS rows | S | Med | 🔴 OPEN |
| **P1** | **Right half of screen unused** — on 1024px viewport with a single ticket, 460px of space is empty. During a 3-ticket rush, the grid uses `auto-fill minmax(320px, 1fr)` which collapses to single-column at sizes that produce only 1 column fit, causing overflow requiring scroll to see ticket 3. | Decrease card min-width from `320px` to `260px`, or set a max-height on ticket cards with internal scroll to allow multiple tickets to show simultaneously | M | High | 🔴 OPEN |
| **P2** | **Session persistence conflict** — switching from Kitchen to Staff login (or navigating to /pos while logged as Kitchen) overwrites the Kitchen session in localStorage. If a kitchen device is accidentally loaded to /pos, the session is hijacked. | Lock Kitchen devices to `/kitchen` routes server-side, or use a PIN confirm before any session switch. | M | Med | 🔴 OPEN |
| **P2** | **"WEIGHING" status is cryptic to new staff** — the blue pulsing WEIGHING badge requires kitchen staff to understand the weigh-station flow. No tooltip or inline explanation. | Add a one-line helper when all items are WEIGHING: "Go to Weigh Station → dispatch meat weight to activate" | S | Low | 🔴 OPEN |
| **P2** | **Category section headers are small** (`text-xs uppercase`) — from 1 meter away with bright kitchen lighting, MEATS / DISHES & DRINKS / SIDE REQUESTS section labels are hard to read quickly. | Increase to `text-sm font-bold` + add a slight background tint to section header rows | S | Low | 🔴 OPEN |

---

## Kitchen Mini-Report

### Login & Setup
- Login worked cleanly. Clicking "Pedro Cruz Kitchen Alta Citta" quick-card on the login page navigated directly to `/kitchen/orders` in <1s.
- Empty KDS state was immediately readable: large emoji + "No pending orders" + 3 stats (served today, avg service, last completed). Clear and calming.
- **Issue found**: Kitchen session is overwritten when any POS-role navigation occurs in the same browser tab. On a shared device, a staff accidental visit to `/pos` can hijack the kitchen session. `[SINGLE-TAB artifact, but real risk on shared tablets]`

### Per-Handoff Observations

**H1 — First T1 Ticket Appears:**
- Latency: Near-instant (<1s after POS session switch to Kitchen)
- 1 Order, 1 Table, 12 Items counter updated immediately
- Timer showed 00:26 (fresh, gray badge)
- Ticket layout: table "T1" prominent (text-2xl font-black), ticket ID subtle (text-xs gray), progress counter 0/12, timer top-right
- MEATS section visible at top fold, DISHES & DRINKS visible mid-screen
- CLEAR AND READABLE: table identity, category grouping, item names, serve buttons

**H2 — Second Ticket (T2) Stacks:**
- When 2 tickets exist for 2 different tables: side-by-side columns on 1024px viewport ✓ (when ticket count allows 2-column layout)
- When 2 tickets for the SAME table (T1 package + T1 items): BOTH labeled "T1" — no visual distinction, no grouping ring, no explanation
- **Confusion level: HIGH** — kitchen staff cannot immediately know whether to work on T1-001 or T1-EAHZ

**H4 — Refill Ticket:**
- Refill appeared inline in T1 ticket's MEATS section as a 3rd item: `Samgyupsal [REFILL●]`
- Amber REFILL badge with animate-pulse clearly distinguishes from WEIGHING items
- Inline approach means no extra ticket to find — good
- But on long tickets (13 items), the REFILL item appears mid-list, requiring vertical scanning to spot
- REFILL vs. NEW ORDER distinction: CONCERN (requires scanning entire ticket, not glanceable)

**H3 — Bump (ALL DONE):**
- Ticket disappears cleanly after ALL DONE tap
- Empty state returns immediately
- History counter increments by 1
- Last Completed timer resets to 00:04
- **CLEAN FEEDBACK: PASS**

**H6 — Refuse Item (RETURN):**
- Tap item row to expand: reveals RETURN (red) + SOLD OUT (gray) buttons
- 2 taps to reach RETURN modal
- RefuseReasonModal has 5 clear options: Out of Stock, Equipment Issue, Quality Issue, Wrong Order, Other...
- Confirm Return disabled until reason selected — good error prevention
- 4 total taps to complete refuse: expand → RETURN → reason → Confirm Return
- Under rush conditions, 4 taps is acceptable for a non-common action

**H8 — UNDO LAST:**
- UNDO LAST available in top-right at all times
- Works instantly — recalled bumped ticket back to queue
- History count decrements correctly

---

### Ticket Readability Assessment

| Dimension | Verdict | Detail |
|---|---|---|
| Single ticket: readable from distance? | PASS | T1 in text-2xl bold, timer prominent, section labels color-coded. Readable at arm's length. |
| Stacked queue (multiple tickets): scannable? | CONCERN | 2 tickets side-by-side: acceptable. 3 tickets on 1024px: requires vertical scroll to see third. Single-column below ~640px means ticket 2 is off-screen. |
| Refill vs. main order distinction: clear? | CONCERN | Amber REFILL badge is distinct from blue WEIGHING. But refill item is inline — NOT a separate ticket — making it easy to miss on long 13-item orders. |
| Takeout vs. dine-in distinction: clear? | PASS | `[TAKEOUT]` purple badge appears in ticket header where table number would be. Takeout customer name shown. Visually very distinct. |
| Large order (12-item package): still readable? | CONCERN | Content readable but requires 2+ viewport scrolls. ALL DONE button at bottom is effectively inaccessible without deliberate scroll. |

---

### Interaction Efficiency

| Action | Taps | Assessment |
|---|---|---|
| Bump entire ticket (ALL DONE) | 1 tap + scroll to find button | CONCERN — scroll distance is the issue, not tap count |
| Mark single item served | 1 tap (checkmark button) | PASS |
| Refuse item (RETURN) | 4 taps (expand → RETURN → reason → confirm) | ACCEPTABLE for non-routine action |
| Toggle sold out | 2 taps (expand → SOLD OUT) | PASS |
| Undo last bump | 1 tap | PASS |
| View history | 1 tap | PASS |

**Touch target sizes:** PASS — 48×48px serve buttons, 56px ALL DONE, 48px UNDO/History. No adjacent target conflicts observed.

---

### ASCII Layout Map (Multi-Ticket State)

```
1024×768 viewport, Kitchen role logged in, 3 tickets (T1, T1, T2):

[All Orders] [Order Queue●] [Weigh Station]
Kitchen Queue ● Live                    [↩UNDO LAST] [History 75]
[3 Orders] [2 Tables] [27 Items]

+------ T1 (#T1--001) [04:16]🟡 ------+------ T1 (#T1-EAHZ) [03:40]🟡 ------+
| 🥩 MEATS                       0g    | 🥩 MEATS                        0g   |
|   Pork Belly   [WEIGHING●]    [✓]   |   Samgyupsal  [WEIGHING●]      [✓]  |
|   Pork Belly   [WEIGHING●]    [✓]   |   Pork Sliced [WEIGHING●]      [✓]  |
|   Beef Brisket [WEIGHING●]    [✓]   |                                       |
|                                       | 🍜 DISHES & DRINKS                   |
|                                       |   Kimchi                      [✓]   |
|                                       |   Rice                        [✓]   |
|  [  ALL DONE ✓  ] ← visible!        |   Cheese                      [✓]   |
+--------------------------------------+   Lettuce                     [✓]   |
                                       |   Egg            ~~fold~~            |
+------ T2 (#T2-XXXX) [00:30] --------+   ...7 more items...                 |
|  (below viewport, requires scroll)   |   [  ALL DONE ✓  ] ← below fold!   |
+--------------------------------------+--------------------------------------+
NOTE: Both T1 cards shown — kitchen cannot tell them apart without reading ticket ID
```

---

### Top 5 Friction Points (Ranked by Severity)

1. **[CRITICAL] ALL DONE button not visible without scroll on large orders** — A 12-item Pork Unlimited ticket requires scrolling ~1,700px to reach the primary action button. This is the single biggest kitchen efficiency problem. Kitchen staff either: (a) must scroll far, (b) mark items one by one until all are served (which auto-bumps), or (c) skip bumping. All paths add friction.

2. **[CRITICAL] Duplicate same-table tickets with identical labels** — Two cards both showing "T1" appeared simultaneously (one for manual items, one for package items). Kitchen staff have no way to know which to prioritize or whether they represent one order or two. This is a data model issue causing direct operational confusion.

3. **[HIGH] Refill blends into initial order on large tickets** — The amber REFILL badge is visually distinct, but inline placement on a 13-item ticket means kitchen staff must scan the full MEATS section to find refills. A dedicated "REFILL REQUESTS" section or a separate "incoming refills" strip would make this scannable from 1 meter.

4. **[HIGH] Timer badge contrast fails during most urgent state** — White text on `#F59E0B` (yellow, warning state) = 2.1:1 contrast ratio. The exact moment urgency is highest, the readability is worst. Under overhead kitchen lighting, this badge can wash out entirely.

5. **[MEDIUM] Third+ tickets require vertical scroll** — With 3 active tickets on 1024px width, the grid collapses to single-column due to ticket width. The third ticket is off-screen. During a 3-table rush, kitchen staff cannot see the full queue at a glance — the stat bar ("3 Orders") shows there's more, but the cards themselves are hidden.

---

### Overall Kitchen UX Verdict

**CONCERN** — The KDS core flow (ticket appearance, category grouping, serve buttons, bump, undo, refill badges, refuse modal) is solid and fast, but two structural issues — the inaccessible ALL DONE button on large orders and the unresolved duplicate-ticket problem for the same table — create real operational friction that would slow down service during a busy dinner rush.
