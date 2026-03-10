# UX Audit — Kitchen Dispatch / Expo + Stove + Sides Prep
**Date:** 2026-03-10
**Auditor:** Claude (automated playwright-cli audit)
**Role:** Kitchen (Corazon Dela Cruz — Dispatch/Expo focus), Kitchen (Lito Paglinawan — Stove focus)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024×768 (tablet landscape)
**Scenario:** Extreme full-service rush
**Pages audited:** `/kitchen/dispatch`, `/kitchen/stove`, `/kitchen/sides-prep` (legacy)

---

## Screenshots Captured

- `dispatch-page.png` — Dispatch board, empty state
- `stove-page.png` — Stove Queue, empty state
- `sides-prep-page.png` — Sides Prep (legacy), empty state
- `kitchen-01-kds-queue.png` — Orders page (legacy KDS queue), empty
- `kitchen-05-kds-live-queue.png` — Older KDS with "Stale" indicator
- `kitchen-03-kds-with-ticket.png` — History modal with bump records

---

## A. Text Layout Map

### /kitchen/dispatch (empty state, 1024×768)

```
┌──────────────────────────────────────────────────────────────────────┐ ← 40px location banner
│ 📍 ALTA CITTA (TAGBILARAN)                              ● Live [pill]│
├──────────────────────────────────────────────────────────────────────┤ ← 44px sub-nav
│ 🧾All Orders │ 📋Dispatch* │ ⚖️Weigh │ 🍳Stove   [Dispatch/Expo badge] [BT Scale]│
├──────────────────────────────────────────────────────────────────────┤
│ ┌─ NEW TABLE ALERT STRIP (placeholder, 48px) ─────────────────────┐ │ ← 48px min-h
│ │ 🆕  New table alerts will appear here when a table opens        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ 📋 DISPATCH BOARD                                                    │ ← h2, 16px, bold, uppercase
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                                                                 │ │
│ │                        ✅ (64px emoji)                          │ │
│ │                   No active orders                              │ ← 16px normal weight
│ │       Orders will appear as tables open and items are sent      │ ← 14px gray
│ │                                                                 │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [empty below fold — no scroll]                                      │
└──────────────────────────────────────────────────────────────────────┘
     ↑ W!                                      (sidebar collapsed, 32px wide)
     ↑ C (user avatar, 32px)
```

### /kitchen/dispatch (populated state — derived from source code)

```
┌──────────────────────────────────────────────────────────────────────┐ ← 40px location banner
│ 📍 ALTA CITTA (TAGBILARAN)                              ● Live [pill]│
├──────────────────────────────────────────────────────────────────────┤ ← 44px sub-nav
│ 🧾All Orders │ 📋Dispatch* │ ⚖️Weigh │ 🍳Stove   [Dispatch/Expo] [BT Scale]│
├──────────────────────────────────────────────────────────────────────┤
│ ┌─ 🆕 New Tables — Stage Utensils (orange accent strip) ──────────┐ │
│ │  T3 · 4 pax · 2m ago    [✓ Staged] (56px btn, bg-white/30)     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ 📋 DISPATCH BOARD  [●3]                                              │
│                                                                      │
│  CARD GRID (minmax 320px, auto-fill)                                 │
│ ┌───────────────────────────────────┐ ┌──────────────────────────┐  │
│ │ T3  2 pax            [⏰ 08:24]  │ │ T5  6 pax   [🔴 12:05]   │  │
│ │ ─────────────────────────────── │ │ ────────────────────────   │  │
│ │ 🥩 Meat    1/2      [⏳]        │ │ 🥩 Meat    2/2     ✅     │  │
│ │ 🍽 Dishes  0/1      [⏳]        │ │ 🍽 Dishes  0/0     N/A    │  │
│ │ 🌿 Sides   0/2      [⏳]        │ │ 🌿 Sides   0/3     [⏳]   │  │
│ │   Lettuce      [DONE]           │ │   Lettuce     [DONE]       │  │
│ │   Rice         [DONE]           │ │   Kimchi      [DONE]       │  │
│ │   [ALL SIDES DONE] 44px btn     │ │   Rice        [DONE]       │  │
│ │                                 │ │   [ALL SIDES DONE]         │  │
│ └───────────────────────────────────┘ └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ✅ ALL DONE — CLEAR ORDER  (56px full-width green btn)       │   │ ← only on readyToRun card
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ⚠️ Service Alerts  [●2]                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ T3  │ Extra Pandan Tea    │ 1m ago │ [Done ✓] (56px btn)      │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### /kitchen/stove (populated state — derived from source code)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 📍 ALTA CITTA (TAGBILARAN)                              ● Live       │
├──────────────────────────────────────────────────────────────────────┤
│ 🧾All Orders │ 📋Dispatch │ ⚖️Weigh │ 🍳Stove*   [Dispatch/Expo] [BT Scale]│
├──────────────────────────────────────────────────────────────────────┤
│ Stove Queue                [count badge]                             │ ← text-xl font-bold (20px)
│ N pending dishes                                                     │ ← text-sm (14px)
│                                                                      │
│  DINE-IN TICKETS (minmax 280px, auto-fill)                           │
│ ┌─────────────────────┐ ┌────────────────────┐                      │
│ │ T3        [⏰ 3:45] │ │ T7      [🔴12:30]  │                      │
│ │ ─ progress bar ─── │ │ ─ progress bar ─── │                      │
│ │ Bibimbap         [✓]│ │ Chibop         [✓] │ ← 56×56px green btn  │
│ │ Pandan Tea       [✓]│ │ Pandan Tea   [✓]   │                      │
│ │ [ALL DONE ✓] 56px  │ │ [ALL DONE ✓] 56px  │                      │
│ └─────────────────────┘ └────────────────────┘                      │
│                                                                      │
│ 📦 Takeout Orders  [●1]                                              │
│ ┌────────────────────────────────────────────────────────────┐      │
│ │ 📦 TAKEOUT  Ana           [⏰ 2:20]                        │      │
│ │ ─ progress bar ────────────────────────────────────────── │      │
│ │ Bibimbap              [✓ 56×56px btn]                     │      │
│ │ [ALL DONE ✓] 56px  [🖨️ 56×56px btn] ← print chit         │      │
│ └────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

### /kitchen/sides-prep (legacy, same structure as dispatch sides section)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Same header/nav as dispatch (no active tab highlighted — not in nav) │
├──────────────────────────────────────────────────────────────────────┤
│ ┌─ 🆕 New Tables strip (same as dispatch) ─────────────────────┐   │
│                                                                      │
│ 🍚 SIDES QUEUE  [●N]                                                 │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ T3  · 0/2  [⏰ 5:20]                                           │  │
│ │ ─ progress bar ────────────────────────────────────────────── │  │
│ │ Lettuce              [✓ 48×48px btn] ← SMALLER than dispatch  │  │
│ │ Rice                 [✓ 48×48px btn]                           │  │
│ │ [SIDES DONE ✓] 56px full-width                                 │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ⚠️ Service Alerts (same component as dispatch)                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Page | Observation | Verdict |
|---|---|---|---|---|
| 1 | **Hick's Law** | Dispatch | Navigation has 4 tabs + Dispatch/Expo badge + BT Scale button = 6 items in nav bar. Card actions: Meat (read-only), Dishes (read-only), Sides (DONE per item, ALL SIDES DONE). Manageable. Empty state = 0 choices. | PASS |
| 1 | **Hick's Law** | Stove | Per ticket: one `✓` button per item + `ALL DONE` = simple. No category confusion — dishes/drinks only, no meats. | PASS |
| 1 | **Hick's Law** | Sides-Prep | Focused queue: only sides. One `✓` per item + `SIDES DONE`. Cleaner than dispatch. | PASS |
| 2 | **Miller's Law** | Dispatch | Dispatch card shows 3 station rows (Meat/Dishes/Sides) + per-item DONE buttons + ALL DONE CTA. If a table has 5 sides items, that's 5 DONE buttons + 1 ALL SIDES DONE = 6 actions per card. At rush with 8 tables, 8 cards visible in grid = information overload risk. | CONCERN |
| 2 | **Miller's Law** | Stove | Per-ticket items are chunked per card. Grid layout keeps cards visually separated. No cross-station info. Clean. | PASS |
| 3 | **Fitts's Law** | Dispatch — Staged btn | `✓ Staged` button in New Tables strip: `min-h-[56px]`, adequate height. Width = `px-3` = narrow (~60px). OK for a one-time action. | PASS |
| 3 | **Fitts's Law** | Dispatch — DONE btn | Sides DONE button: `min-h-[44px] px-3`. Width determined by container (~60-80px typical). **44px is the system minimum but the Design Bible requires 48px for secondary, and this is in a wet-hands, noisy kitchen environment where 56px is strongly preferred.** FAIL for wet kitchen. | CONCERN |
| 3 | **Fitts's Law** | Dispatch — ALL SIDES DONE | `min-h-[44px] px-3` — same concern. Narrow button in inline position within card body, not full-width. Harder to hit than full-width siblings. | CONCERN |
| 3 | **Fitts's Law** | Dispatch — ALL DONE (clear order) | `min-height: 56px`, full-width (`w-full`). Correct. Large, reachable, prominent. | PASS |
| 3 | **Fitts's Law** | Stove — DONE btn | `min-h-[56px] w-14 h-14 = 56×56px`. Correct for wet kitchen. Square target, easy to hit. | PASS |
| 3 | **Fitts's Law** | Stove — ALL DONE btn | `min-height: 56px`, full-width. Correct. | PASS |
| 3 | **Fitts's Law** | Sides-Prep — DONE btn | `min-h-[48px] w-12 h-12 = 48×48px`. Adequate but 8px smaller than stove's 56px. Inconsistent across pages. | CONCERN |
| 3 | **Fitts's Law** | Sides-Prep — SIDES DONE btn | `min-height: 56px`, full-width. Correct. | PASS |
| 3 | **Fitts's Law** | Service Alert — Done btn | `min-h-[56px]`. Correct. | PASS |
| 4 | **Jakob's Law** | All kitchen | Grid-based ticket cards follow standard KDS patterns (MCafe KDS, Square KDS). Timer in top-right, table label top-left, items in card body, primary CTA footer. Matches industry convention. | PASS |
| 5 | **Doherty Threshold** | All kitchen | RxDB local-first = instant writes. `active:scale-95` on all buttons = tactile feedback. Audio chimes on new orders (C5→E5 ascending for dispatch, A4 for stove, 660Hz for sides). Stale indicator appears after 60s without updates. | PASS |
| 6 | **Visibility of System Status** | Dispatch | Live indicator (top-right fixed pill, `● Live` green) visible on all kitchen pages. Stale state turns yellow with `~ Stale` text. Location banner shows branch. Dispatch/Expo focus badge confirms role. Urgency: gray/yellow/red border on cards (5min/10min). | PASS |
| 6 | **Visibility of System Status** | Dispatch — readyToRun | `readyToRun` cards float to TOP of grid + get `border-status-green bg-emerald-50` border + audio chime. **However: no explicit large "READY" label on the card header itself.** The green card border is the only visual signal before scrolling to the `ALL DONE — CLEAR ORDER` button at the bottom of the card. During rush with 6+ cards, the card footer button may be below the fold without the green border standing out enough.| CONCERN |
| 7 | **Match between system and real world** | Dispatch | "DISPATCH BOARD", "Stage Utensils", "✓ Staged", "CLEAR ORDER" — restaurant operations language. Station labels (Meat/Dishes/Sides) match station reality. | PASS |
| 7 | **Match between system and real world** | Stove | "Stove Queue", "pending dishes" — correct. Items shown are only dishes/drinks — no category confusion. | PASS |
| 8 | **Aesthetic and minimalist** | Dispatch | Empty state: only two info items (New Tables strip + Dispatch Board panel). No visual clutter. Populated state: station progress rows add density, but necessary information. | PASS |
| 8 | **Aesthetic and minimalist** | Stove | Clean. Each card: header + 1px progress bar + items + footer. Minimal decoration. | PASS |
| 9 | **WCAG — Contrast** | Dispatch — timer badge | Normal state: `bg-gray-100 text-gray-600` = ~5.9:1. OK. Warning: `bg-status-yellow text-gray-900` = yellow bg, dark text, functional. Critical: `bg-status-red text-white` = 4.0:1 passes for large text. Mono font timer at `text-sm` (14px) on red background = borderline, needs verification. | CONCERN |
| 9 | **WCAG — Contrast** | Dispatch — `ALL SIDES DONE` btn | `bg-status-green/20 text-status-green` = green text on light-green background. Status-green (#10B981) on white = 3.5:1 (FAIL for small text). The `text-sm font-bold` at 14px is sub-threshold. On a backlit tablet in a bright kitchen this is legible but fails WCAG AA. | FAIL |
| 9 | **WCAG — Contrast** | Service Alerts section header | `bg-status-yellow px-2.5 py-0.5 text-sm font-black text-gray-900` — count badge. Yellow bg with dark text is fine. Alert text `text-gray-800` on `bg-amber-100` = adequate. | PASS |
| 10 | **WCAG — Touch targets** | Sub-nav links | `h: 44px, w: 83-138px`. Exactly 44px, adequate per system standard but not 56px preferred for wet kitchen. The sub-nav is navigation (not a primary action during service), so 44px is acceptable. | PASS |
| 10 | **WCAG — Touch targets** | Sidebar icons | `h: 44px, w: 32px` — **width only 32px, narrower than 44px minimum for icon-only buttons.** Sidebar items (Kitchen nav, Stock nav, Logout) are all 32px wide. This is a systemic sidebar issue. | FAIL |
| 11 | **Consistency** | DONE button sizes | Dispatch inline DONE = `min-h-44px px-3`. Stove DONE = `56×56px square`. Sides-prep DONE = `48×48px square`. Three different sizes for the same conceptual action across pages. A kitchen worker switching between tabs expects the same hit target. | FAIL |
| 11 | **Consistency** | "Complete all" buttons | Dispatch footer: "✅ ALL DONE — CLEAR ORDER" (56px). Stove footer: "ALL DONE ✓" (56px). Sides-prep footer: "SIDES DONE ✓" (56px). These three footer buttons are consistent in height. | PASS |
| 11 | **Consistency** | Dispatch "ALL SIDES DONE" vs Sides-prep "SIDES DONE" | Naming inconsistency for the same concept: "ALL SIDES DONE" in dispatch body vs "SIDES DONE ✓" in sides-prep footer. Different labels, similar action. | CONCERN |
| 12 | **Gestalt: Proximity** | Dispatch card | Station rows (Meat/Dishes/Sides) are in `divide-y` groups. Sides items are indented under the Sides row (`ml-10`). `ALL SIDES DONE` button sits under the items list. Grouping is clear. | PASS |
| 12 | **Gestalt: Proximity** | Dispatch card — readyToRun CTA | `ALL DONE — CLEAR ORDER` is in a separate `border-t-2 border-status-green px-4 py-3` footer region. Visually distinct from the station rows. Good proximity separation. | PASS |
| 13 | **Visual Hierarchy** | Dispatch — first eye hit | At empty state: "DISPATCH BOARD" h2 (16px uppercase) → large ✅ emoji → "No active orders" text. Eye lands on the emoji first, reads board title second. Satisfactory for empty state. At populated state: readyToRun cards float to top with green border — should attract eye first. Timer badge in top-right of each card. **The "READY TO RUN" concept has NO explicit label — only the green border+bg differentiate a ready card. On a first-day worker, this color signal may not be self-evident.** | CONCERN |
| 13 | **Visual Hierarchy** | Stove — first eye hit | "Stove Queue" H1 (20px bold) is the largest text on page. Count badge (orange) draws eye when items present. Cards appear below. Hierarchy is clear: page title → count → ticket cards → per-item DONE → ALL DONE. | PASS |
| 14 | **POS-Specific: Glanceable Status** | Dispatch | From 1 meter: Location banner (branch name) is visible. Tab bar shows active page. Live indicator visible. Card grid: table number (text-2xl font-black = ~24px rendered) is large enough to read at arm's length. Timer badge (text-sm = 14px) may be too small for a glance-only read from 60cm. | CONCERN |
| 14 | **POS-Specific: Glanceable Status** | Stove | Table numbers in cards: `text-2xl font-black` = 24px. Good glanceable. Count ("0 pending dishes") at 14px small gray text — hard to read at distance. | CONCERN |

---

## C. Best Day Ever — Kitchen Perspective

### Dispatch / Expo (Corazon, 26, 3 years experience)

It's Friday dinner rush at Alta Citta — 7 tables open simultaneously. Corazon has the tablet mounted on the pass window with a clear view from her position. She glances up and sees two green-bordered cards floating to the top: T3 and T6 are ready to run. Without touching anything, she shouts "T3 running!" and grabs the tray.

She hears the ascending two-tone chime — a new table just got items. She glances at the board: T8 card appeared, border still gray, Sides showing "0/3 ⏳". She knows the sides-prep crew needs to move. She taps the "ALL SIDES DONE" button for T3 while balancing the tray with her other hand — finds it without looking because she knows the green button is always at the bottom-left of the sides sub-list. The card collapses.

The nightmare scenario: five new tickets arrive in 90 seconds. The grid fills with cards. She can't see the ALL DONE buttons for the earlier cards without scrolling. The green borders get lost among 6 cards all jammed in a 320px grid. Her tablet is slightly greasy. The 44px DONE buttons in the sides list feel small.

### Stove (Lito, 34, 5 years kitchen experience)

Lito works the stove alone during dinner rush. His tablet is propped at eye level beside the range, 40cm away. He's cooking bibimbap and pandan tea — only what the tablet shows. He loves the stove page: it only shows his station's work. No meat info confusing him.

He hears the A4 tone — new order. He glances: T5 card appeared with 2 items. He finishes plating T3's bibimbap, taps the 56×56px green checkbox button without looking twice — large enough to hit even with slightly wet hands. Card progress bar advances. He taps ALL DONE — the T3 card disappears. Clean.

His issue: when 6 dine-in tickets and 2 takeout tickets stack up, the grid wraps and he has to scroll. The "Takeout Orders" section header is rendered in small text at the same visual weight as station labels. During rush, he might miss that a takeout ticket is urgent.

---

## D. Recommendations

### P0 — Critical, fix before production

| ID | Page | Issue | Fix | Effort | Impact |
|---|---|---|---|---|---|
| D-P0-01 | Dispatch | **Inline DONE buttons (44px) are below wet-hands minimum.** Sides DONE buttons within dispatch card body are `min-h-[44px] px-3`. In a wet kitchen environment, the recommended minimum is 56px. A mis-tap on a busy rush marks the wrong side done. | Change `min-h-[44px]` to `min-h-[56px]` on all `DONE` buttons in dispatch card sides list. Also change `w-12 h-12 (48px)` to `w-14 h-14 (56px)` in sides-prep per-item buttons to match stove standard. | S | High |
| D-P0-02 | Dispatch | **"ALL SIDES DONE" button contrast fails WCAG.** `bg-status-green/20 text-status-green` = green (#10B981) text on white/light green background = 3.5:1 ratio. Fails WCAG AA for 14px `text-sm`. In bright kitchen lighting with tablet glare, this button becomes invisible. | Change to solid `bg-status-green text-white font-bold` (like other DONE buttons) or at minimum `bg-emerald-100 text-emerald-800` which passes contrast. | XS | High |
| D-P0-03 | All | **Sidebar icon-only buttons are 32px wide (below 44px minimum).** Kitchen nav sidebar items (Kitchen, Stock, Logout icons) measure `h:44px w:32px`. The narrow width creates a 12px gap from the WCAG minimum. | Increase sidebar icon button `min-width` to 44px. | S | High |

### P1 — High Priority, fix before branch launch

| ID | Page | Issue | Fix | Effort | Impact |
|---|---|---|---|---|---|
| D-P1-01 | Dispatch | **No explicit "READY" label on readyToRun cards.** A first-day worker won't know the green card means "run this order." The visual signal is color alone (green border + bg-emerald-50), which violates the "never use color as the only indicator" accessibility principle. | Add a prominent `READY TO RUN` badge in the card header for `readyToRun: true` cards. Example: orange pill badge next to the table number. Audio chime already exists — a visual label completes the signal. | S | High |
| D-P1-02 | Dispatch | **Timer text at 14px (text-sm) on timer badge is below 18px threshold for 60cm reading.** Station tablets are at arm's length. In a rushed service, a cook reading "08:24" in 14px needs to squint. | Increase timer badge font size to `text-base` (16px) minimum, ideally `text-lg` (18px) for critical/warning states. | XS | Medium |
| D-P1-03 | Stove | **"0 pending dishes" subtitle is 14px gray.** The primary at-a-glance status indicator should be the large count (`totalPending`). The text subtitle is fine but "Stove Queue" title at 20px is adequate; however the count badge only appears `{#if totalPending > 0}`, so at 0 there's no count visible in the header area. Empty state is clear but there's no quick visual summary of how many items are in-progress. | The existing H1+count badge pattern is acceptable. Consider showing `(0)` count when zero to confirm all-clear visually. | XS | Low |
| D-P1-04 | Dispatch | **Dispatch card with many sides items (5+) can have 6 interactive buttons in a single card.** This approaches Miller's Law overload in a high-density rush. When 3+ sides tickets are packed into a single card, a kitchen worker may lose track of which DONE tap they just made. | Consider grouping confirmed items with a line-through animation and auto-removing after 2 seconds (currently stays visible with opacity-50 line-through). This reduces visual noise as items are completed. | M | Medium |
| D-P1-05 | Sides-Prep | **Page is not in main navigation (no tab highlights it).** The sub-nav shows: All Orders, Dispatch, Weigh Station, Stove. Sides-prep is absent from the nav but the route is still accessible. A worker navigating to `/kitchen/sides-prep` via URL or old bookmark will see the page with no active tab highlighted, creating disorientation. | Either: (a) add Sides Prep back to the nav with a deprecation notice, or (b) redirect `/kitchen/sides-prep` to `/kitchen/dispatch` with a toast explaining the merge. | XS | Medium |
| D-P1-06 | All kitchen | **The Dispatch/Expo focus badge (top-right, `border-cyan-200 bg-cyan-50 text-cyan-700`) has a 3.1:1 contrast ratio (cyan text on white).** Fails WCAG AA for the `text-sm font-semibold` label. | Change focus badge text to a darker shade: `text-cyan-900` or `text-teal-700` for adequate contrast. | XS | Medium |

### P2 — Minor, backlog

| ID | Page | Issue | Fix | Effort | Impact |
|---|---|---|---|---|---|
| D-P2-01 | Dispatch | **"ALL SIDES DONE" (in card) vs "SIDES DONE ✓" (in sides-prep) — different names, same concept.** | Standardize to one label. Suggest: "ALL SIDES DONE ✓" everywhere. | XS | Low |
| D-P2-02 | Stove | **Takeout section header uses same visual weight as page body text.** `text-base font-bold text-gray-700 uppercase` — same as Dispatch Board header. On a busy stove page, the Takeout section may not be scannable at a glance as separate urgency queue. | Add a colored left-border or `bg-status-purple/10` background to the Takeout section header to visually separate from dine-in. | XS | Low |
| D-P2-03 | Dispatch | **Stale indicator (top-right fixed) overlaps with readyToRun chime at 60s intervals.** When data is stale and also a table is ready, two competing signals appear. | No structural change needed — just a note for QA to test this edge case. | None | Low |
| D-P2-04 | Dispatch | **The New Tables strip placeholder height is 48px with tiny text ("New table alerts will appear here when a table opens").** During full service this strip is almost never empty, but when a lull occurs, the 14px gray placeholder text is barely readable on a backlit tablet at 60cm. | Increase placeholder text to `text-sm` (fine, already is) and consider `text-gray-500` minimum (currently `text-gray-400`). | XS | Low |
| D-P2-05 | All kitchen | **The live indicator pill ("● Live") is `text-xs font-semibold` = 12px.** This is a system-health indicator that a manager should be able to read on a walk-by. At 12px, it requires close inspection. | Increase to `text-sm` (14px). Still compact in the pill but readable at 60cm. | XS | Low |
| D-P2-06 | Dispatch | **"✓ Staged" acknowledgment button text is `font-semibold` not `font-bold`.** All other primary action buttons (DONE, ALL DONE) use `font-bold` or `font-black`. Inconsistent font weight for a touch-critical action. | Change to `font-bold`. | XS | Low |
| D-P2-07 | Stove | **Print chit button (icon-only, `min-w-[56px]`) has no visible label.** Only a `<Printer>` Lucide icon. Title attribute ("Print chit") is accessible on hover but not on tablet touch. A kitchen worker who has never printed before won't know this button exists for takeout only. | Add `text-xs` label "Chit" below the printer icon, or a tooltip on long-press. | XS | Low |

---

## E. Verdict Summary

| Page | P0 | P1 | P2 | Overall |
|---|---|---|---|---|
| `/kitchen/dispatch` | 2 (DONE buttons undersized, ALL SIDES DONE contrast) | 4 | 5 | **CONCERN — usable but needs button sizing fix before wet-hands production use** |
| `/kitchen/stove` | 1 (sidebar width) | 1 | 2 | **GOOD — best-designed kitchen page, primary action button (56×56px) is exemplary** |
| `/kitchen/sides-prep` | 2 (DONE buttons 48px, sidebar) | 1 | 1 | **CONCERN — legacy page with smaller buttons, not in main nav** |

### Standout Strengths

1. **Stove page DONE buttons (56×56px)** — the square icon-style DONE button on the stove page is a best-in-class touch target for kitchen use. Every kitchen page should match this.
2. **readyToRun float-to-top + audio chime** — the combination of spatial priority and audio feedback for order completion is excellent UX for a dispatch workflow.
3. **Station-specific audio tones** — A4 for stove, C5→E5 chime for ready orders, 660Hz for sides. Differentiated sounds prevent habituation. This is a mature pattern.
4. **Timer urgency system** — gray → yellow (5min) → red/pulsing (10min) with consistent logic across all kitchen pages. The Design Bible's "color alone" rule is partially met by the numeric timer as supporting text.
5. **Location banner always visible** — branch identity is never ambiguous for kitchen staff.

### Critical Path Before Extreme Rush Deployment

1. Fix `DONE` button sizes in dispatch inline sides list: 44px → 56px (30 minutes work)
2. Fix `ALL SIDES DONE` contrast: green/20 on white → solid green (15 minutes work)
3. Add `READY TO RUN` text label to dispatch card header for readyToRun state (30 minutes work)
4. Unify all per-item DONE buttons to 56×56px across dispatch and sides-prep (1 hour)
5. Fix sidebar icon button width: 32px → 44px (15 minutes, CSS change in AppSidebar)

---

*Audit method: playwright-cli browser automation (screenshots + DOM measurements) + source code analysis (dispatch/+page.svelte, stove/+page.svelte, sides-prep/+page.svelte, kitchen/+layout.svelte). Empty state screenshots captured; populated state assessed from source code and design tokens. Viewport: 1024×768 tablet landscape. Session: kitchen role (Alta Citta dispatch focus, Corazon Dela Cruz).*
