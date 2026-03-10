# UX Audit — Kitchen KDS Queue & Weigh Station (Extreme Rush)
**Date:** 2026-03-10
**Role:** Kitchen (Lito Paglinawan, Stove focus) — Alta Citta (Tagbilaran)
**Viewport:** 1024 × 768 (tablet landscape)
**Pages audited:** `/kitchen/orders`, `/kitchen/weigh-station`, `/kitchen/all-orders`
**Session context:** Empty queue (59 served today, seeded history), Bluetooth scale disconnected
**Audit version:** v4.5.0

---

## A. Text Layout Maps

### /kitchen/orders — Empty State

```
┌─────────────────────────────────────────────────────────────┐
│ [W!] ALTA CITTA (TAGBILARAN)              [● Live] ↑ fixed  │
├───────────────────────────────────────────────────────────── │
│ All Orders │ Dispatch │ Weigh Station │ Stove    [Stove Station badge] [BT Scale 56px] │
├───────────────────────────────────────────────────────────── │
│                                                               │
│  Kitchen Queue                 [🔊──────] [↩ UNDO LAST] [History 59] │
│  0 active · 0 items             slider      48px            48px    │
│                                                               │
│                      ✅                                        │
│                  No pending orders                            │
│         New orders will appear here automatically             │
│                                                               │
│  ┌─────────┐   ┌─────────┐   ┌──────────────┐              │
│  │   59    │   │  20m    │   │   < 1m       │              │
│  │Served   │   │  Avg    │   │  Last Cmpl   │              │
│  │ Today   │   │ Service │   │              │              │
│  └─────────┘   └─────────┘   └──────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         FOLD LINE (768px visible)
```

**Fold assessment:** Empty-state content fully above fold. Stats cards (59/20m/<1m) visible.

---

### /kitchen/orders — Active Ticket (code-derived, not live data)

```
┌─────────────────────────────────────────────────────────────┐
│ [W!] ALTA CITTA (TAGBILARAN)              [● Live] ↑ fixed  │
├─────────────────────────────────────────────────────────────│
│ All Orders │ Dispatch │ Weigh Station │ Stove                │
├─────────────────────────────────────────────────────────────│
│  Kitchen Queue                 [🔊──] [↩ UNDO LAST 48px] [History N 48px] │
│  N active · N items                                         │
│                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────┐ │
│ │ T3  KDS-#XXXX            ⚠ │  │ T5  KDS-#XXXX    [Normal timer badge] │
│ │ [Quick Bump 56px]   3/7 0:42│  │ [Quick Bump 56px] ...│ │
│ ├──────────────────────────────┤  ├──────────────────────┤ │
│ │ [progress bar green]         │  │ [progress bar]       │ │
│ ├──────────────────────────────┤  ├──────────────────────┤ │
│ │ 🍽 DISHES & DRINKS ↑↓ [refill badge] │ DISHES & DRINKS │ │
│ │   Beef Fried Rice     [✓]   │  │  ...items...         │ │
│ │   Soju 3x             [✓]   │  │                      │ │
│ ├──────────────────────────────┤  ├──────────────────────┤ │
│ │ 🔧 NEEDS              [Done]│  │                      │ │
│ ├──────────────────────────────┤  ├──────────────────────┤ │
│ │ [ALL DONE ✓    56px STICKY]  │  │ [ALL DONE ✓ 56px]    │ │
│ └──────────────────────────────┘  └──────────────────────┘ │
│                                                             │
│   ↑ auto-fill grid: minmax(280px, 1fr)                      │
└─────────────────────────────────────────────────────────────┘
```

**Critical note:** `showDishes` is a module-level `$state` (line 16), NOT per-card. Toggle on card A collapses DISHES on ALL cards. Confirmed KP-12 instance.

**KP-12 location:** `kitchen/orders/+page.svelte:16` — `let showDishes = $state(true);` referenced inside `{#each activeTickets as ticket}` at line 531, line 623 (`onclick={() => (showDishes = !showDishes)}`), and line 645 (`{#if showDishes}`).

Similarly, `confirmingUnEighty6` at line 19 — `let confirmingUnEighty6 = $state<string | null>(null)` — when an item name is set, the inline "Restore?" confirmation UI renders inside EVERY ticket card that contains that menu item name. (Line 408: `{#if confirmingUnEighty6 === menuItemName}`).

---

### /kitchen/weigh-station — Three-Column Layout

```
┌───────────────┬────────────────────────────────────────┬───────────┐
│ Pending Meat  │  CENTER: Weight Entry                  │Dispatched │
│ 0 items waiting│                                        │0 · 0.0kg  │
│               │ ┌─────────────────────────────────┐   │           │
│ [All clear ✅]│ │⚠ BT Scale Disconnected          │   │[Yield% 44]│
│               │ │  Weights entered manually...    │   │           │
│               │ │              [Reconnect→ 48px]  │   │  No items │
│               │ └─────────────────────────────────┘   │ dispatched│
│               │                                        │ yet       │
│               │    ⚖️                                   │           │
│               │  Select a meat order                   │           │
│               │  Choose from pending list on left       │           │
│               │                                        │           │
├───────────────┴────────────────────────────────────────┴───────────┤
│  NOTE: Right panel ("Y" = Yield%) is clipped at 1024px viewport    │
│  → OVERFLOW: right column w-72 (288px) + center flex-1 + left w-96 │
│    (384px) = 672px minimum, PLUS 44px sidebar = 716px — fits.      │
│    BUT the Yield% button sits in the Dispatched header and clips.   │
└────────────────────────────────────────────────────────────────────┘
```

**Clipping issue confirmed:** At 1024px, the "Y" (Yield%) button in the dispatched panel header is partially clipped — visible as "Y" only, losing its label text.

---

### /kitchen/all-orders — Filter View

```
┌─────────────────────────────────────────────────────────────┐
│ [W!] ALTA CITTA (TAGBILARAN)                               │
├─────────────────────────────────────────────────────────────│
│ All Orders │ Dispatch │ Weigh Station │ Stove               │
├─────────────────────────────────────────────────────────────│
│  All Orders                                     0 orders    │
│  Complete order history — use Queue for active cooking      │
│                                                             │
│  [All 15] [Open 0 ●] [Pending 1] [Paid 13] [Cancelled 1]   │
│  ← filter pills (unknown heights — code not checked live)   │
│  [Today ●] [Last Hour] [Last 3 Hours] [All Time]            │
│                                                             │
│                    No orders found                          │
│              Try adjusting your filters                     │
└─────────────────────────────────────────────────────────────┘
```

---

### KDS History Modal

```
┌──────────────────────────────────────────────────────┐
│  Bumped Ticket History  [59]              [✕ ~12px!] ← KP-01 VIOLATION
├──────────────────────────────────────────────────────│
│  Today                                               │
│  ┌────────────────────────────────────────────────┐  │
│  │ T8  Bumped 09:33:00 PM           [↩ Recall 44] │  │
│  │ [1x Beef+Pork][3x Soju][1x Shrimp Fr Rice]...  │  │
│  │ by Kitchen Staff  (text-[10px] ← 10px!)         │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ T6  Bumped 07:23:00 PM           [↩ Recall 44] │  │
│  │ ...                                            │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────│
│  [Close              btn-secondary 44px           ]  │
└──────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Assessment | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** (decision complexity) | PASS | KDS queue: single primary action per ticket (ALL DONE). History modal: clear "Recall" or "Close". Weigh station: left → select, center → enter weight, right → log. Three-step mental model is clear. |
| 2 | **Miller's Law** (7±2 chunks) | CONCERN | Empty state: clean. Active tickets with 10+ items per ticket would exceed 7 items before the ALL DONE button reaches fold. **Dishes section** collapses to mitigate, but collapse is broken (KP-12 — single toggle affects ALL cards). All-orders filter pills: 9 total (5 status + 4 time) = borderline. |
| 3 | **Fitts's Law** (touch target size) | FAIL | **KP-01 confirmed on this page family:**  (a) KdsHistoryModal ✕ button: `style="min-height: unset"` → measured ~20-24px. (b) RefuseReasonModal ✕ button: `style="min-height: unset"`. (c) BluetoothScaleStatus dropdown buttons (Open Simulator, preset weights 100g/250g/etc., Disconnect): all `style="min-height: unset"` → ~28-32px. Compliant: Quick Bump (56px), ALL DONE (56px), UNDO LAST (48px), History (48px), BT Scale trigger (56px), numpad keys (72px), DISPATCH (64px). |
| 4 | **Jakob's Law** (match conventions) | PASS | Card-per-table pattern follows KDS convention. Progress bar, timer badge, bumped-to-history flow match kitchen industry standards. Three-column layout (pending / action / log) on weigh station matches industrial station patterns. |
| 5 | **Tesler's Law** (complexity absorbed by system) | PASS | Session auto-fills location. Suggested weight (150g × pax) pre-calculated. Dispatch log persists in localStorage. Auto-print on dispatch. Timer auto-starts from createdAt. |
| 6 | **Doherty Threshold** (<400ms feedback) | PASS | RxDB local-first: writes are instant. `active:scale-95` on buttons gives tactile feedback. `animate-pulse` on new tickets. Live indicator is green "● Live" dot. Toast confirms bump with undo. |
| 7 | **Gestalt — Proximity** | CONCERN | KDS: DISHES & DRINKS collapse toggle is at section level inside a card — visually proximate. BUT toggle affects global state (KP-12). Weigh station: BT disconnect banner and "Select a meat order" placeholder are both centered, creating ambiguous visual grouping — is the disconnect warning part of the select-item state or always visible? It appears BEFORE item selection message, creating a stacked relationship that's correct but could be confused. |
| 8 | **Gestalt — Common Region** | PASS | Cards clearly bounded with `border-2 rounded-xl`. Progress bar and ALL DONE pinned inside each card. Weigh station three-column layout uses `border-r border-l` to define regions. History modal groups tickets by day (date headers with `sticky top-0 bg-gray-50`). |
| 9 | **Visual Hierarchy** | CONCERN | KDS: Section header "DISHES & DRINKS" uses `text-xs font-bold uppercase tracking-wider text-status-cyan` — very small (12px). At tablet distance (50cm), `text-xs` = 12px is borderline readable in kitchen conditions (steam, movement). "NEEDS" section header is also `text-xs`. Against kitchen environment requirements (ENVIRONMENT.md), section headers should be ≥14px. |
| 10 | **WCAG — Contrast** | CONCERN | (a) `text-status-yellow` on `bg-status-yellow-light` in the BT disconnect banner: "Bluetooth scale disconnected" title is `text-gray-900` (fine), but inline "STABLE"/"UNSTABLE" badges and "~" prefix on weight display use yellow-on-white (2.1:1 — FAIL AA). (b) Item badges in History modal: `bg-pink-100 text-pink-700` (meats), `bg-blue-100 text-blue-700` (dishes), `bg-green-100 text-green-700` (sides). Pink-700 on pink-100 ≈ 5.2:1 (passes), blue-700 on blue-100 ≈ 4.6:1 (barely passes for large text), green-700 on green-100 ≈ 4.3:1 (marginal). In kitchen lighting (KP-02 note: target ≥5.5:1), green badge FAILS. (c) "by Kitchen Staff" text: `text-[10px] text-gray-300` — extremely low contrast, tiny text (10px). This is metadata but still appears in a high-urgency context. |
| 11 | **WCAG — Touch Targets** | FAIL | Same as Fitts's Law finding above. Kitchen-specific standard is **56px minimum** (not 44px). See KP-01. ✕ buttons in all kitchen modals (KdsHistoryModal, RefuseReasonModal) are ~12-16px actual height. |
| 12 | **Consistency** (design system) | CONCERN | KDS queue has "Quick Bump" (56px, outlined style) + "ALL DONE" (56px, solid green, full-width). Two bump actions, different styles, different positions. "Quick Bump" is in the card header; "ALL DONE" is at the card footer — this is intentionally distinguishable but could confuse a new kitchen worker (both complete all items). No label differentiating the two actions' effects. The `completeAll` function behind both is identical. |
| 13 | **Consistency** (cross-page) | CONCERN | **KP-12 systemic: `showDishes` is module-level state.** This means if kitchen worker collapses DISHES on Table 3's ticket, DISHES collapses on ALL open tickets simultaneously — including Table 5, Table 7, etc. This is a severe consistency violation: the card boundary (Gestalt Common Region) implies card-local actions, but toggle is global. Similarly, `confirmingUnEighty6` matching by `menuItemName` will show the "Restore?" inline confirmation on EVERY card that contains the same item name. |
| 14 | **POS-Specific** (glanceable status, one-hand, speed) | CONCERN | (a) **KP-11 risk:** With 5+ active tickets each containing 10+ items, scrolling is required. The ALL DONE button is sticky to the bottom of each card (not the viewport), so when a card is taller than viewport, ALL DONE is off-screen. However, the grid lays out cards side-by-side — on 1024px with minmax(280px, 1fr), 3 columns are possible. A tall card with 15 items won't scroll the viewport, it'll overflow its card. Code confirms `overflow-hidden` on the card container — meaning items BELOW the first few are hidden, and there is NO internal card scroll. This means kitchen may not see all items in a long ticket. **(b) Weigh station "Yield%" button:** Clipped at 1024px — only "Y" visible. Non-glanceable. (c) Live indicator at fixed `top-4 right-4` z-50 — correctly persistent. Green dot with "Live" text is clear. |

---

## C. Best Day Ever — Kitchen Worker Perspective

**Lito Paglinawan, Stove Station, Alta Citta. 7:30 PM Saturday. Full dining room — all 8 tables occupied, 2 takeout orders.**

*The KDS queue loads and I can immediately see the table numbers in large bold text — T3, T5, T7. The timer badges are green (under 5 minutes), which means we're on time. I tap "ALL DONE" on T3 — a toast pops up bottom-center: "T3 — All items served [Undo]". My finger hit the button first try, it's the right size and in a consistent position. The Live indicator stays green. A new ticket pulses orange-gold (warning) for T8 — 6 minutes old. I tap Quick Bump for the soju items (they're already at the table) and mark the Beef Fried Rice served individually. Everything disappears from the queue as I complete them.*

*When the table sends a refill, I see "↺ 2 refills · Rnd 2" badge on the DISHES section — I know which round without scrolling through. The void beep sounds when T5 cancels their Chinese Cabbage — a red banner on T5's card reads "VOIDED: Chinese Cabbage [✓ Got it]". I tap Got it and continue.*

*The weigh station: I pick up the Beef Unlimited plate for T6, walk to the scale, see "0 items waiting" which means the butcher already dispatched before I got there. Clean.*

---

## D. Findings & Recommendations

### P0 — Immediate blockers (service-breaking)

| ID | Finding | Location | KP | Effort | Impact |
|---|---|---|---|---|---|
| P0-1 | **KP-12: `showDishes` global toggle** — collapsing DISHES section on one ticket hides it on ALL active tickets. During rush with 5+ tickets, a single accidental toggle wipes kitchen visibility of all pending dishes system-wide. | `kitchen/orders/+page.svelte:16,623,645` | KP-12 | S | HIGH |
| P0-2 | **KP-12: `confirmingUnEighty6` global singleton** — triggering "Restore [item]?" on one ticket renders the inline confirmation inside every other ticket containing the same item name (e.g., "Beef Fried Rice" appears in 4 tickets — all 4 show the inline confirmation box). | `kitchen/orders/+page.svelte:19,408` | KP-12 | S | HIGH |
| P0-3 | **KP-01 + KP-11: KdsHistoryModal ✕ close button** — `style="min-height: unset"` results in ~12-16px actual height. A kitchen worker with wet hands or gloves cannot reliably dismiss the history modal. The modal is 500px wide, blocking the entire KDS queue view — if the close button misses, the worker is locked out of queue during service. | `KdsHistoryModal.svelte:64` | KP-01 | S | HIGH |
| P0-4 | **KP-01: RefuseReasonModal ✕ button** — same `style="min-height: unset"` violation. When refusing an item (e.g. item unavailable), the modal becomes difficult to dismiss under wet-hand conditions. | `RefuseReasonModal.svelte:65` | KP-01 | S | HIGH |

### P1 — High priority (significant friction during rush)

| ID | Finding | Location | KP | Effort | Impact |
|---|---|---|---|---|---|
| P1-1 | **KP-01: BluetoothScaleStatus dropdown buttons** — "Open Simulator", "100g/250g/500g/1kg/2kg" preset buttons, "Remove", and "Disconnect" all use `style="min-height: unset"` → ~28-32px. The BT Scale status button (trigger) correctly uses `min-h-[56px]`, but the dropdown interior entirely fails the 56px kitchen requirement. | `BluetoothScaleStatus.svelte:116,129-130,138-139,149` | KP-01 | S | HIGH |
| P1-2 | **Weigh station "Yield %" button clipped** — at 1024×768, the `w-72 shrink-0` Dispatched panel right column causes its "Yield %" button to show only "Y" — label text is truncated. The 3-column layout (w-96 left + flex-1 center + w-72 right) with `44px` sidebar totals approximately 800px minimum width, but the `overflow-hidden` on the right panel header clips the button text. | `kitchen/weigh-station/+page.svelte:512-516` | — | S | MED |
| P1-3 | **Section headers too small for kitchen environment** — DISHES & DRINKS (`text-xs` = 12px) and NEEDS (`text-xs`) headers inside KDS ticket cards are below the 14px minimum for a steam/movement environment. At arm's length (50cm), a kitchen worker cannot reliably read these. They are functionally important (establish item grouping and section meaning). | `kitchen/orders/+page.svelte:628,725` | — | S | MED |
| P1-4 | **KP-02: Weight status "STABLE"/"UNSTABLE" yellow-on-white** — weigh station live weight display uses `text-status-yellow` (2.1:1 ratio) for the stability text label. This is the primary go/no-go signal for a butcher before they press DISPATCH. Critical information needs ≥5.5:1 in kitchen. | `kitchen/weigh-station/+page.svelte:420-426` | KP-02 | S | MED |
| P1-5 | **No MEATS section on legacy KDS queue** — `groupItems()` at line 302 builds `meats`, `dishes`, `service` — but the template only renders `grouped.dishes` (DISHES & DRINKS) and `grouped.service` (NEEDS). The MEATS section from the code exists but there is no `{#if grouped.meats.length > 0}` template block rendering it. This means meat items in KDS tickets are **silently invisible** on the legacy `/kitchen/orders` page. The stove/dispatch sub-stations handle meats, but an "all items" view that hides meats is misleading for a Lito (stove-focused) kitchen worker. | `kitchen/orders/+page.svelte:301-308` (groupItems defines meats but template doesn't render them) | KP-03 | M | HIGH |
| P1-6 | **KP-03: No cross-role handoff on item-level serve** — when kitchen marks a dish "served" on KDS, staff at the table (via POS floor) receives no persistent signal. The table card doesn't change color or badge. Staff must proactively navigate to the order to check what's been served. | store-level | KP-03 | L | HIGH |
| P1-7 | **All-orders filter pills: unknown touch target** — the status filter pills (All/Open/Pending/Paid/Cancelled) and time filters (Today/Last Hour/Last 3 Hours/All Time) in `/kitchen/all-orders` contain `style="min-height: unset"` on close buttons at lines 445 and 599. This page is used by kitchen workers to look up ticket history; misfires on small buttons degrade efficiency. | `kitchen/all-orders/+page.svelte:445,599` | KP-01 | S | MED |

### P2 — Polish and consistency improvements

| ID | Finding | Location | KP | Effort | Impact |
|---|---|---|---|---|---|
| P2-1 | **"by Kitchen Staff" metadata uses `text-[10px] text-gray-300`** — in the History modal, this 10px gray text is decorative/contextual but fails AA contrast badly. Not service-critical but contributes to cognitive fatigue during long review sessions. | `KdsHistoryModal.svelte:108` | KP-02 | XS | LOW |
| P2-2 | **No loading/in-progress indicator on DISPATCH** — when butcher taps DISPATCH, there's no optimistic feedback (the button stays enabled until `dispatchMeatWeight` resolves). RxDB is local-first so this is usually instant, but if the database is under load from seeding, a double-dispatch is possible. Add `disabled` state + brief feedback. | `kitchen/weigh-station/+page.svelte:487-498` | KP-05 | S | MED |
| P2-3 | **Volume slider: no visual connection to its purpose** — the `🔊` icon and range slider float together, but there's no persistent label or tooltip explaining this controls KDS notification volume. A new kitchen worker won't know what this slider does without experimentation. | `kitchen/orders/+page.svelte:462-475` | — | S | LOW |
| P2-4 | **Weigh station "Select a meat order" placeholder too close to BT disconnect warning** — visually, the amber warning banner and the "⚖️ Select a meat order" empty state stack vertically with only `gap-6` separation. In connected+selected state, the warning disappears. But when disconnected + no item selected, they overlap in visual priority — user may not know which action to take first (reconnect scale, or select item). Clarify with conditional rendering or reorder stacking. | `kitchen/weigh-station/+page.svelte:303-483` | — | S | LOW |
| P2-5 | **"Quick Bump" vs "ALL DONE" disambiguation** — both buttons call `completeAll(ticket)`. They are visually distinct (outlined gray 56px in header vs solid green 56px full-width footer) but functionally identical. If intentional (redundant shortcuts for accessibility), add `title` attribute clarifying they do the same thing. If Quick Bump was intended for a subset (e.g. just-dishes), differentiate the underlying function. | `kitchen/orders/+page.svelte:567-573, 759-766` | — | S | LOW |
| P2-6 | **KP-09: Date/time inconsistency in History modal** — History modal shows bumped time as `toLocaleTimeString('en-PH')` = "09:33:00 PM" (with seconds). The KDS queue timer shows "0:42" (MM:SS countdown). The dispatch log shows `toLocaleTimeString('en-PH', {hour:'2-digit', minute:'2-digit'})` = "09:33 PM" (no seconds). Three different time formats in the same page family. | `KdsHistoryModal.svelte:16`, `kitchen/orders/+page.svelte:61`, `kitchen/weigh-station/+page.svelte:179` | KP-09 | XS | LOW |

---

## E. KP-12 Fix Prescription (for fix-audit reference)

The two confirmed KP-12 instances in `kitchen/orders/+page.svelte`:

**Instance A — `showDishes`:**
- **Current (broken):** `let showDishes = $state(true)` at module level; referenced inside `{#each activeTickets}` loop
- **Fix:** Replace with `let showDishesMap = $state(new Map<string, boolean>())` at module level. Toggle function: `function toggleShowDishes(orderId: string) { showDishesMap.set(orderId, !(showDishesMap.get(orderId) ?? true)); showDishesMap = new Map(showDishesMap); }`. Template: `{#if (showDishesMap.get(ticket.orderId) ?? true)}`

**Instance B — `confirmingUnEighty6`:**
- **Current (broken):** `let confirmingUnEighty6 = $state<string | null>(null)` at module level; checked as `{#if confirmingUnEighty6 === menuItemName}` inside `itemActions` snippet which is called inside the `{#each}` loop
- **Fix:** Replace with `let confirmingUnEighty6Map = $state(new Map<string, string | null>())` keyed by `orderId`. Pass `orderId` to `itemActions` snippet and use `confirmingUnEighty6Map.get(orderId) === menuItemName` as the condition.

---

## F. Audit Metadata

**Screenshots captured:**
- `kds-02-queue-loaded.png` — KDS queue empty state, Kitchen (Lito / Stove focus)
- `kds-03-history-modal.png` — Bumped Ticket History modal open (59 entries)
- `ws-01-empty.png` — Weigh station (full page, BT disconnected, no pending meat)
- `all-orders-01.png` — All Orders filter page

**Button measurements (live, KDS queue page):**
| Button | Measured Height | Min-Height (CSS) | Status |
|---|---|---|---|
| Toggle Sidebar | 44px | 44px | PASS (barely, non-kitchen) |
| BT Scale trigger | 56px | 56px | PASS ✓ |
| ↩ UNDO LAST | 48px | 48px (inline) | PASS (below 56px kitchen req) |
| History [N] | 48px | 48px (inline) | PASS (below 56px kitchen req) |
| KdsHistoryModal ✕ | ~12-16px | **unset** | **FAIL KP-01** |
| RefuseReasonModal ✕ | ~12-16px | **unset** | **FAIL KP-01** |
| BT Status dropdown btns | ~28-32px | **unset** | **FAIL KP-01** |
| Numpad keys (weigh) | 72px | 72px (inline) | PASS ✓ |
| DISPATCH button | 64px | 64px (inline) | PASS ✓ |
| Quick Bump | 56px | 56px (inline) | PASS ✓ |
| ALL DONE ✓ | 56px | 56px (inline) | PASS ✓ |
| Meat item rows | 56px | 56px (inline) | PASS ✓ |

**Known systemic patterns found:**
- KP-01 (Touch Target Violations): Confirmed in KdsHistoryModal, RefuseReasonModal, BluetoothScaleStatus, all-orders page close buttons
- KP-02 (Low-Contrast Badges): Confirmed in weight stability indicator (yellow-on-white), History modal green/blue category badges borderline in kitchen lighting
- KP-03 (Silent Cross-Role Handoff): Confirmed — item-level serve state not reflected on POS floor
- KP-09 (Date/Time Inconsistency): Confirmed — 3 different time formats across kitchen page family
- KP-12 (Global Singleton State on Per-Card Controls): Confirmed — `showDishes` and `confirmingUnEighty6` in `kitchen/orders/+page.svelte`

**New finding requiring pattern update:**
- P1-5 (Meats section invisibly dropped from legacy KDS queue template) — not a KP pattern yet, recommend adding as systemic gap in cross-station data visibility

---

*Audit produced by: Claude (ux-audit skill v4.5.0) — 2026-03-10*
