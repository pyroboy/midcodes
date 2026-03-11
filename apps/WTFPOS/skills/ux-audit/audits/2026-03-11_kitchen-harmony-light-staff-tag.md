# UX Audit — Kitchen Harmony (Light Theme)
**Date:** 2026-03-11
**Mode:** Multi-user (single browser, sequential stints)
**Roles:** Staff (Ate Rose) → Kitchen Dispatch (Corazon) → Kitchen Stove (Lito) → back
**Location:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet landscape)
**Scenario:** 1 staff opening Table T1 (4 pax, Pork Unlimited), adding Samgyupsal + Ramyun + Soju, firing to kitchen; all kitchen stations processing simultaneously

---

## A. Text Layout Map

### Stint 1 — Staff POS Floor (Ate Rose)

```
+--sidebar--+----------main floor (60%)----------+---order sidebar (40%)---+
| [W!]      | LocationBanner: ALTA CITTA          |                         |
| [POS icon]| ─────────────────────────────────── |                         |
| [A logout]| TopBar: POS | 1occ | 8free | ℹ | [📦 New Takeout]* | History |
|           | ┌──────────────────────────────────┐ |  🧾                     |
|           | │  [T1][T2][T3][T4]               │ │  No Table Selected      |
|           | │  [T5][T6][T7][T8]               │ │  Green = tap to open    |
|           | │  (2 rows, 8 tables)              │ │  Orange = view bill     |
|           | │                                  │ |                         |
|           | └──────────────────────────────────┘ |                         |
|           | ── TAKEOUT ORDERS 1 ──               |                         |
|           | [#TO01 Juan ₱652 PREP]               |                         |
+--sidebar--+------------------------------------+--------------------------+
* New Takeout has pulsing orange dashed border animation
```

**On table open (AddItemModal full-screen):**
```
+--- AddItemModal (full-screen overlay) ───────────────+--- Pending Panel ---+
| ➕ Add to Order  🔥 Table · 4 pax               [✕] | Pending Items       |
| ─────────────────────────────────────────────────── | Pork Unlimited PKG  |
| [🎫 Package][🥩 Meats][🥬 Sides][🍜 Dishes][🥤 Drinks]| × 4 pax             |
| ─────────────────────────────────────────────────── | Includes 3 meats,   |
| [Beef Unlimited ₱599/pax]                          | 10 sides ▼ show     |
| [Beef+Pork ₱499/pax]                               | ─────────────────── |
| [Pork Unlimited ₱399/pax]                          | Ramyun 🍽Dine-In -1+ |
|                                                    | [special request...] |
|                                                    | Soju 🍽Dine-In -1+   |
|                                                    | [special request...] |
|                             ~~FOLD LINE~~          | ─────────────────── |
|                                                    | PENDING TOTAL ₱1,840|
|                                                    | [Undo] [⚡CHARGE(16)]|
+----------------------------------------------------+---------------------+
```

**After CHARGE — Order Sidebar (running bill):**
```
+--- Order Sidebar -------------------------------------------+
| T1  4 pax ✎  7m                                        [✕] |
| Pork Unlimited                                             |
| ────────────────────────────────────────────────────────── |
| [🔄 Refill (orange/primary)]   [Add Item (secondary)]      |
| ────────────────────────────────────────────────────────── |
| Pork Unlimited [SENT]                         ₱1,596 PKG  |
|   MEATS:                                                   |
|   Samgyupsal × 2  300g  [WEIGHING][REQUESTING]    ✕       |
|   Pork Sliced            [WEIGHING]               ✕       |
|   SIDES:   10 served                         ▼ show       |
| Ramyun  [✓ SERVED]                            ₱149.00 ✕   |
| Soju (Original) [✓ SERVED]                     ₱95.00 ✕   |
| Meat dispatched                              0.30kg(300g)  |
| ──────────────────────────────────────────────────────── |
| BILL  16 items                               ₱1,840.00    |
| [Print] [Void (red)] [──── Checkout (green, wide) ────]  |
| More ▼  Transfer · Merge · Split · Pax                   |
+------------------------------------------------------------+
```

### Stint 2 — Kitchen Dispatch (Corazon)

```
+--sidebar--+------ kitchen/dispatch --------------------------------+
| [W!]      | LocationBanner: ALTA CITTA           [● Live]         |
| [Kitchen] | ──────────────────────────────────────────────────── |
| [Stock]   | [🧾All Orders][📋Dispatch*][⚖Weigh Station][🍳Stove]  [BT Scale]
| [C logout]| ──────────────────────────────────────────────────── |
|           | [🆕 NEW  New table alerts will appear here when...]    |
|           | ──────────────────────────────────────────────────── |
|           | 📋 DISPATCH BOARD 1                                  |
|           | ┌─────────────────────────────────────────────────┐  |
|           | │ T1  4 pax                                  03:49│  |
|           | │ 🥩 Meat    1/3  ⏳                               │  |
|           | │ 🍳 Dishes  2/2  ✅ (green, done)                 │  |
|           | │ 🥬 Sides   10/10 ✅ (green, done — collapsed)     │  |
|           | └─────────────────────────────────────────────────┘  |
|           |                                                       |
|           | (with sides expanded: 10 rows of DONE buttons,        |
|           |  ALL SIDES DONE at bottom — BELOW FOLD at 768px)      |
+--sidebar--+-------------------------------------------------------+
```

### Stint 3 — Kitchen Stove (Lito)

```
+--sidebar--+-------------- kitchen/stove --------------------------+
| [W!]      | LocationBanner: ALTA CITTA          [● Live]          |
| [Kitchen] | ──────────────────────────────────────────────────── |
| [Stock]   | [🧾All Orders][📋Dispatch][⚖Weigh Station][🍳Stove*] [BT Scale]
| [C logout]|                                                       |
|           | Stove Queue                                   [2]     |
|           | 2 pending dishes                                      |
|           | ┌──────────────────────────────────────────┐         |
|           | │ T1    0/2    02:17                        │         |
|           | │ ── progress bar ──────────────────────── │         |
|           | │ Ramyun                              [✓]  │         |
|           | │ Soju (Original)                     [✓]  │         |
|           | │ [────────── ALL DONE ✓ ────────────────] │         |
|           | └──────────────────────────────────────────┘         |
+--sidebar--+-------------------------------------------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | Dishes tab: 11 items at same visual hierarchy, no grouping or search. AddItemModal has 5 tabs + items + pending panel simultaneously. | Group dishes by type (rice dishes / noodle dishes / fried dishes); add search for 8+ items |
| 2 | **Miller's Law** | CONCERN | Dispatch card with 10 expanded side rows creates a single list of 13+ items — exceeds 7±2. Order sidebar: two status badges (WEIGHING + REQUESTING) on one meat row. | Collapse sides by default at 5+ items with "show all" affordance; merge dual meat badges into single state badge |
| 3 | **Fitts's Law** | FAIL | ALL SIDES DONE button on dispatch is below fold with 10 sides expanded (most critical action unreachable without scrolling). The ✓ item buttons on stove are ~48px — below 56px kitchen minimum. 🍽 Dine-In button in pending panel is very small. | Pin ALL SIDES DONE to viewport bottom (sticky); increase stove ✓ buttons to 56px+; remove or enlarge Dine-In toggle in pending panel |
| 4 | **Jakob's Law** | CONCERN | Stove nav tab shows a magnifying glass icon, not a stove/flame icon. "Meat dispatched" row in order sidebar is an unlabeled metadata line with no clear affordance. | Use a stove/flame icon for Stove tab; label meat dispatch row more clearly (e.g., "Sent to grill: 0.30kg") |
| 5 | **Doherty Threshold** | PASS | All RxDB writes reflected instantly across role switches. Stove ✓ → dispatch 2/2 was near-instant. No perceptible delay in any state transition. | — |
| 6 | **Visibility of System Status** | CONCERN | New table alert strip shows static placeholder "New table alerts will appear here when a table opens" — never shows the live T1 alert. Ate Rose cannot see from POS whether kitchen has started on her meats (WEIGHING/REQUESTING badge in sidebar is ambiguous). | Fix ephemeral alert to persist until acknowledged; add a clearer "Grill: in progress" indicator for meats on POS sidebar |
| 7 | **Gestalt: Proximity** | CONCERN | In the order sidebar after CHARGE, "Meat dispatched 0.30kg (300g)" appears as a floating row between Soju and the BILL divider — visually detached from the meat items above. | Move Meat dispatched summary inside the MEATS section header; or attach it as a sub-row of the samgyupsal line item |
| 8 | **Gestalt: Common Region** | PASS | MEATS / SIDES / DISHES section headers in order sidebar create clear regions. Dispatch card groups station rows within a card boundary cleanly. | — |
| 9 | **Visual Hierarchy** (scale) | CONCERN | On the POS floor after charging, "New Takeout" button has a pulsing animated dashed-orange border — competing visually with the floor plan. For a table-service cashier, takeout is secondary to floor scanning. | Remove or reduce pulsing animation from New Takeout; reserve animation for alert states only |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | Dual yellow WEIGHING + REQUESTING badges on one meat row are similarly-weighted — no hierarchy between the two states. SIDES section header is green text on white but may fall below 5.5:1 at kitchen viewing distance. | Consolidate dual meat status badges into one; use text contrast ≥5.5:1 for all section headers |
| 11 | **WCAG: Color Contrast** | CONCERN | SIDES green section header `text-status-green` (#10B981) on white = 3.5:1 — FAIL AA. MEATS orange header (`text-accent` #EA580C) on white = 4.6:1 — bare AA pass, fails kitchen 5.5:1 threshold from ENVIRONMENT.md. | Use `text-emerald-700` (#047857) for Sides header and `text-orange-700` (#C2410C) for Meats header |
| 12 | **WCAG: Touch Targets** | FAIL | Stove ✓ item buttons are ~48px — meets 44px floor but below 56px kitchen minimum (ENVIRONMENT.md). ALL SIDES DONE below fold is unreachable at 768px viewport with 10 sides expanded. Close (✕) button on order sidebar header appears small. | All kitchen-facing buttons minimum 56px; sticky ALL SIDES DONE; audit ✕ button sizes |
| 13 | **Consistency** (internal) | CONCERN | "Samgyupsal × 2" in order sidebar — the "× 2" is ambiguous (is it 2 servings, 2nd round, or 2 pax-portions from package?). "Includes 2 meats, 10 sides" counter in AddItemModal updates live but uses different language ("meats" in header vs "Samgyupsal" in item list). | Clarify × N display: show weight (300g) and source (added / pkg) separately |
| 14 | **Consistency** (design system) | PASS | SENT/SERVED/WEIGHING/REQUESTING badge system is internally consistent across POS sidebar. Dispatch station rows use the same icon set (🥩🍳🥬) as AddItemModal tabs. | — |

---

## C. "Best Shift Ever" Vision

It's 7:30pm — peak rush. Ate Rose glances at the floor from her counter. The plan: scan the floor, open the table, fire the first round, keep moving.

She taps T1. The PAX modal appears with the capacity pre-filled at 4 (they booked). She confirms. Instantly — without another tap — the AddItemModal is open and **Package** is already highlighted. She scans the packages in two seconds: the family chose Pork Unlimited when they called. One tap. The 4 × ₱399 = ₱1,596 auto-calculates. She tabs to Meats, finds Samgyupsal at the top (most common pork package order — pre-sorted by frequency), taps it, enters 300g on the scale display, and is back in the item list within 4 seconds. She tabs to Dishes: Ramyun at the top (most ordered). One tap. Drinks: Soju. One tap. The pending panel shows ₱1,840 with all three items visible at once. She hits **CHARGE**. The floor card flips to orange with "PORK" and the timer starts.

Back at dispatch, Corazon heard the familiar alert — a brief chime on her tablet and a banner: **"T1 opened — 4 pax — stage utensils."** She's already pulling the banchan tray. The dispatch board card for T1 appears and she starts ticking off DONE on sides as she plates — *Kimchi, Rice, Lettuce, Cheese, Egg* — her finger moving down the list in rhythm, each DONE button exactly where her thumb expects. At the bottom: **ALL SIDES DONE** — pinned at the bottom of the card so it's always reachable without scrolling regardless of how many sides are on the order.

At the stove, Lito sees Ramyun and Soju appear on his clean queue. Two big ✓ buttons, each 60px tall so his greasy thumb never misses. He marks Ramyun done, then Soju. **ALL DONE** — one wide tap. His queue goes clear. The satisfaction emoji fills the screen for half a second.

On the dispatch board, Dishes turns green: *2/2 ✅*. Meat shows 1/3 — the grill is still going. Corazon knows: plates are out, food runner will deliver soon.

Back at the register, Ate Rose glances at the T1 sidebar. She sees "Ramyun ✓ SERVED · Soju ✓ SERVED · Sides 10 served." The meats still say "Grill: in progress." She doesn't have to ask the kitchen. She smiles at the next table, knowing food is on its way.

**Where the current implementation gaps:**
The new table alert for T1 never arrived on Corazon's screen because the timing was off — she was on a different tab. When Corazon came back to Dispatch, T1 was already in the board but no staging cue had ever appeared. She had to rely on hearing Ate Rose's order verbally — the exact scenario the system was built to eliminate.

The "ALL SIDES DONE" button required Corazon to scroll past 10 side items to reach it. At 768px with 10 sides, it's completely off-screen. During peak when she's managing 8 tables, the rhythm of *plate, DONE, plate, DONE...* gets interrupted by a scroll gesture every time she finishes a table's sides. This is the single most friction-heavy moment in her shift.

---

## D. Recommendations

---

##### [01] New table alert is ephemeral — Corazon misses staging cue if not on Dispatch at table-open moment

**What:** The "New table alerts" strip on `/kitchen/dispatch` shows a static placeholder ("New table alerts will appear here when a table opens") throughout the session, even after T1 was opened by Ate Rose. The alert did not appear or had already disappeared before Corazon's session started. The strip exists only as a visual container — it provides no persistent history of recent table openings.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Navigate to `/pos`.
2. Skip cash float. Click T1 → set 4 pax → Confirm.
3. Switch session to Corazon (kitchen, tag). Navigate to `/kitchen/dispatch`.
4. Result: the "New table alerts" strip shows placeholder text, not a "T1 opened — 4 pax" alert.

**Why this breaks:** Corazon's first job when a table opens is to stage utensils — chopsticks, spoons, napkins, water. She can't do this unless she knows the table just opened. During a busy Friday shift, Corazon is not staring at the dispatch board — she's at the prep counter, plating banchan, with her back to the tablet. If she wasn't watching when T1 opened, the staging cue is gone. The 4 guests at T1 sit for 3 minutes waiting for utensils and water — the first impression of WTF! Samgyupsal is a half-set table.

**Ideal flow:** Every table opening should persist as an alert card in the strip for at least 2 minutes (or until explicitly dismissed). The card should show: table number, pax count, time opened, and a "Staged ✓" dismiss button. After the first alert is dismissed, the history should remain visible in a collapsible "recent tables" log for 10 minutes. When Corazon returns to the dispatch page after being away, she should see any alerts she missed during that gap.

**The staff story:** "Minsan naa ko sa likod nag-plate, then mo-balik ko sa tablet, wala na ang alert. Magsugod nako mag-plating sa new table pero wala ko kabalo kung pila ka pax, naa bay bata, unsay package — kinahanglan pa ko mangutana kang Ate Rose. Mag-stopper jud ang service."

**Affected role(s):** Kitchen (Dispatch/Expo — Corazon, Nena)

---

##### [02] ALL SIDES DONE is below fold with 10 sides expanded — Corazon's most-used action requires a scroll

**What:** On the dispatch board at 1024×768, when a table has 10 side items, the `ALL SIDES DONE` button is positioned after all 10 individual DONE rows, placing it approximately 400px below the fold. Corazon cannot reach her most-used action without scrolling past every side item on the card.

**How to reproduce:**
1. Login as Corazon (kitchen, tag). Navigate to `/kitchen/dispatch`.
2. Open a table with Pork Unlimited (10 sides). The T1 dispatch card will expand the sides list.
3. Observe: Kimchi, Rice, Cheese, Lettuce, Egg, Cucumber, Chinese Cabbage, Pork Bulgogi, Fish Cake, Iced Tea Pitcher all render as individual rows above the ALL SIDES DONE button.
4. At 1024×768, ALL SIDES DONE is not visible without scrolling.

**Why this breaks:** Corazon marks sides done at 30–60 times per shift (ROLE_WORKFLOWS.md). Her fastest path is: all sides plated → ALL SIDES DONE. But this button is unreachable at a glance. During peak with 8 cards on the board, each scroll interrupts her physical plating rhythm. She ends up tapping individual DONE buttons one-by-one just to avoid the scroll — which is 10× slower. This is KP-11 (Scroll-Hidden Primary Actions).

**Ideal flow:** `ALL SIDES DONE` should be `sticky bottom-0` within the dispatch card, visible at all times regardless of how many side items are listed. Individual DONE buttons remain for granular per-item marking. The ALL SIDES DONE button should render at the bottom of the card's sticky footer, not inline after the last item. Alternatively: collapse the sides list to a compact "chip" view by default (show count, not each item individually) with a "▶ expand" toggle — and the batch DONE action is always visible.

**The staff story:** "Murag mag-scroll jud ko every table. 10 sides, ALL SIDES DONE naa sa ubos pa. Layo kaayo. Murag dali raman unta — plate tanan, click ALL DONE. Pero kinahanglan pa jud ko mag-scroll pababa. Busy nights, makalimot ko ug scroll, murag incomplete ang order."

**Affected role(s):** Kitchen (Dispatch/Expo — Corazon, Nena)

---

##### [03] Stove ✓ item buttons are below 56px kitchen minimum touch target

**What:** The individual `✓` checkmark buttons for each dish on `/kitchen/stove` appear to be approximately 48px × 48px based on the 1024×768 viewport screenshot. This meets the general 44px floor but falls below the 56px minimum specified in `references/ENVIRONMENT.md` for kitchen pages where hands are wet and greasy.

**How to reproduce:**
1. Login as Lito (kitchen, tag). Navigate to `/kitchen/stove`.
2. View a T1 card with Ramyun and Soju (Original).
3. Measure the rendered height of the ✓ button against the card height. At 1024×768 the ✓ buttons appear approximately 48px tall.

**Why this breaks:** Lito is cooking ramyun, tteokbokki, and drinks. His hands are wet and greasy. When he reaches for the ✓ button on Ramyun, he may be using a knuckle or the side of a gloved finger. A 48px target with grease film on the screen is borderline unusable — he'll miss-tap onto the table label or the next item's button. During peak rush with 6 tables on the stove queue, mis-taps slow down ticket clearing and create false "done" signals on wrong items.

**Ideal flow:** All stove action buttons — individual ✓ and ALL DONE — should be minimum 56px tall with 8px gap between adjacent targets. The ✓ buttons should expand to fill the full height of the dish row, making the entire row tappable (not just the button icon). This matches PRD guidance: "massive hit-areas, knuckle-sized buttons."

**The staff story:** "Kapoy jud mag-click ng ✓. Basa akong kamot, murang minsan mo-click ko nang Ramyun pero mo-register na Soju ang na-done. Mag-confuse ang order history. Daghan na sana ug butang ang ✓ para dali maclick."

**Affected role(s):** Kitchen (Stove — Lito, Romy)

---

##### [04] Stove tab nav icon is a magnifying glass — not a stove

**What:** The navigation tab for `/kitchen/stove` uses what appears to be a magnifying glass / search icon, not a stove, flame, or cooking-related icon. At glance distance (60–90cm, kitchen environment), the icon does not communicate "stove station."

**How to reproduce:**
1. Login as any kitchen role. Navigate to any kitchen page.
2. Observe the sub-nav tabs: All Orders, Dispatch, Weigh Station, **Stove**.
3. The Stove tab icon appears as a circle with a cross/magnifying glass shape.

**Why this breaks:** Kuya Marc or Lito, looking at the kitchen tablet from 80cm while stirring a pot, glances at the nav to tap back to their station. The magnifying glass icon does not cue "stove" — it reads as "search." They may hesitate or tap the wrong tab. This is especially risky during peak rush when navigation decisions are split-second.

**Ideal flow:** Replace the Stove tab icon with a stove/flame icon from lucide-svelte (e.g., `Flame` or `Soup` or a custom stove icon). The icon should be immediately recognizable as cooking-related at arm's length.

**The staff story:** "Nag-tap ko ng mali, akala ko search yung icon. Dako kaayo ug luto sa stove, nagbalik-balik pa sa mali na page."

**Affected role(s):** Kitchen (Stove — Lito, Romy; all kitchen roles)

---

##### [05] "New Takeout" button has a persistent pulsing animation that competes with floor scanning

**What:** The "📦 New Takeout" button in the POS top bar has a continuously pulsing dashed-orange animated border. This animation runs at all times on the `/pos` page, regardless of context — even when the cashier is in the middle of scanning for available tables during rush.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Skip cash float.
2. Observe the POS top bar. "New Takeout" has a dashed orange pulsing border animation (visible in the floor screenshot: the button has a bright orange dashed border cycling).
3. Observe: all tables are free, no exceptional context — but the animation runs anyway.

**Why this breaks:** Ate Rose's most critical task is scanning the floor for available tables — a visual scan that requires her eye to move from card to card in a grid. The pulsing animation on "New Takeout" creates a visual magnet in the top bar, pulling her attention away from the floor during peak rush when she's doing 80–120 item adds per shift. Takeout orders are a secondary workflow (3–8 per shift), yet the animation signals it as the highest-priority action on the screen. This is a Serial Position + Visual Hierarchy violation.

**Ideal flow:** Remove the persistent animation from "New Takeout." If a pulsing state is needed, trigger it only when: (a) an incoming takeout call is being entered by a manager, or (b) the takeout queue is empty and a prompt is appropriate. The default state should be a static button. Consider a small orange badge on the button only when there are pending takeout items.

**The staff story:** "Yung blinking na New Takeout distracting talaga. Naghahanap ako ng available table, tapos mata ko palagi napupunta dun sa blinking button. Di naman ako takeout cashier ngayon, nag-aasikaso ako ng floor."

**Affected role(s):** Staff (Ate Rose, all POS cashiers)

---

##### [06] AddItemModal Dishes tab lists 11 items with no grouping or search

**What:** The Dishes tab in AddItemModal presents 11 menu items (Beef Fried Rice, Bibimbap, Chibop, Choi-Bhat, Gyeran Mari, Japchae, Kimbap, Mandu, Ramyun, Shrimp Fried Rice, Tteokbokki) as a flat list with no category grouping, no search field, and no frequency sorting. This is a Miller's Law violation: 11 ungrouped items at the same hierarchy level exceed the 7±2 working memory limit.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Open any table, select a package.
2. Tap the "🍜 Dishes" tab in AddItemModal.
3. Result: 11 items listed in a flat grid with no grouping, no search, no frequency ordering.

**Why this breaks:** Ate Rose adds dishes 80–120 times per shift. Ramyun is ordered for nearly every table with a package. But Ramyun is the 9th item in the current list (R comes after most Korean dish names alphabetically). She either scrolls past 8 items to find it every time, or she has memorized its position — fragile knowledge that breaks for new staff on day 1. During peak rush, adding a dish takes 3–4 seconds instead of 1. Across 60 dish adds per shift, that's 3 minutes of wasted time per shift from this one list.

**Ideal flow:** Group dishes into visual categories: "Noodles" (Ramyun, Japchae), "Rice" (Beef Fried Rice, Bibimbap, Chibop, Shrimp Fried Rice), "Snacks/Sides" (Gyeran Mari, Kimbap, Mandu, Tteokbokki, Choi-Bhat). Alternatively, surface a "Most Ordered" row of 3–4 items above the full list (pre-sorted by sales frequency). Add a search/type-ahead for >8 items. This is KP-07 (Information Density Exceeding Miller's Law).

**The staff story:** "Hanapan ko lagi yung Ramyun, yung pinakamadaling order. Kailangan ko mag-scroll pababa kasi nasa baba pa siya ng listahan. Kapag maraming mesa, hindi ko na maalala kung saan siya. Sana nasa taas na lang yung madalas na i-order."

**Affected role(s):** Staff (Ate Rose, all POS cashiers)

---

##### [07] Dual-badge WEIGHING + REQUESTING on single meat row creates visual noise in order sidebar

**What:** After firing an order, the running bill sidebar shows `Samgyupsal × 2  300g  [WEIGHING][REQUESTING]` — two yellow status badges on a single line item row. The two badges are similarly-weighted visually (same yellow color, same pill shape) and appear side by side without hierarchy, making it unclear which state is current, which is pending, and which requires staff action.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Open T1, add Pork Unlimited package + Samgyupsal 300g. Fire (CHARGE).
2. Observe the order sidebar meat section: Samgyupsal row shows two badges.
3. The "REQUESTING" badge and "WEIGHING" badge are both present and equally visually dominant.

**Why this breaks:** Ate Rose glances at the sidebar ~100 times per shift (ROLE_WORKFLOWS.md). When she sees the meat row, she needs to know one thing: is the grill working on this? The dual badge requires her to read both labels and interpret their combined meaning — during rush, she may misread "REQUESTING" as "kitchen is requesting something from me" (a problem to resolve) when it actually means "the meat is being requested for weighing" (normal in-progress). This ambiguity causes unnecessary interruptions to the kitchen ("Is the samgyupsal being prepped?") that Kuya Marc and Benny have to answer while cooking.

**Ideal flow:** Consolidate meat status into a single progressive badge: `SENT → WEIGHING → SERVING → SERVED`. Show only the current state, not both states. Use a single neutral/informational color for in-progress states (e.g., gray or blue) and reserve yellow for states requiring staff attention. "REQUESTING" and "WEIGHING" should merge into "IN PROGRESS (grill)" until the meat is served.

**The staff story:** "Dalawa pa yung badge sa Samgyupsal, WEIGHING at REQUESTING. Hindi ko alam kung kailangan ko pang gawin yung isang bagay o normal lang yun. Minsan nagtatanong pa ako sa kusina — maarte ba ito o walang gagawin? Sana isa lang ang badge."

**Affected role(s):** Staff (Ate Rose), Kitchen (Kuya Marc — receives unnecessary clarification questions)

---

##### [08] Order sidebar "Refill" button appears as the primary CTA on an active table — outranking "Add Item"

**What:** After opening a table and firing the first round, the order sidebar shows two buttons: `[🔄 Refill]` (orange/primary, full-width) and `[Add Item]` (secondary, outlined). The Refill button has full orange fill — the strongest visual weight on the screen — while "Add Item" uses a secondary outlined style.

**How to reproduce:**
1. Login as Ate Rose. Open T1, fire an order. Close the AddItemModal.
2. Observe the order sidebar. The **Refill** button is the most visually prominent action (orange fill, wide).
3. "Add Item" is secondary (outlined, same row).

**Why this breaks:** After the first round is sent, Ate Rose's most frequent next action is NOT a refill — it's watching and managing the existing order (and often, a customer will add another drink or side before asking for refills). The "Add Item" path covers both adding new items AND refills, making the dedicated "Refill" button redundant for many cashiers who already know to use Add Item. More critically: new staff who see "Refill" prominently displayed may default to it for ALL new items — including the package's first-round extras — creating duplicate/incorrect round tracking in the KDS. A refill is a Round 2+ action; it should not visually outrank "Add Item" during the order's first active minutes.

**Ideal flow:** After order is sent and before any refill is requested, `Add Item` should be the primary orange button and `Refill` should be secondary (outlined). After a customer explicitly requests a refill, elevate Refill to primary. Alternatively, merge the two into a single "Add Item" button that presents a round-selector (`🆕 New Item | 🔄 Refill`) inside the AddItemModal — context preserved within the flow.

**The staff story:** "Ang laki ng Refill button. Minsan pinindot ko nang refill yung customer na gusto lang magdagdag ng drinks — hindi pa naman sila nagre-refill, first round pa lang. Nagkalat ang order sa kitchen. Mas maganda kung Add Item yung mas malaki."

**Affected role(s):** Staff (Ate Rose, all POS cashiers)

---

##### [09] "Samgyupsal × 2" notation in order sidebar is ambiguous — unclear if ×N means quantity, round, or pax-portion

**What:** After adding Samgyupsal 300g to the order, the order sidebar running bill shows `Samgyupsal × 2  300g  [WEIGHING][REQUESTING]`. The "× 2" is not explained. It is unclear whether this means: (a) 2 servings of samgyupsal, (b) Round 2, (c) 2 pax-worth of the package meat inclusion, or (d) something else. No tooltip, no label, no context.

**How to reproduce:**
1. Login as Ate Rose. Open T1 (4 pax), select Pork Unlimited, add Samgyupsal 300g.
2. Fire the order (CHARGE).
3. In the order sidebar, observe: `Samgyupsal × 2  300g`.

**Why this breaks:** Sir Dan, the manager, walks past the register and glances at the T1 bill. He sees "Samgyupsal × 2" and thinks there are two separate 300g servings — ₱390 worth of samgyupsal. He tries to reconcile this with what he's seen brought to T1 and gets confused. When he asks Ate Rose, she's not sure either — she only added one. This creates downstream confusion at checkout when the bill doesn't match the customer's expectation. Even for experienced staff, the × N notation carries no semantic guarantee across roles.

**Ideal flow:** Replace `× N` with explicit, unambiguous notation. If N refers to quantity/servings: show `Samgyupsal (300g) × 1` with a small tooltip on hover: "1 portion, 300g." If the × 2 indicates a package round, label it "Round 1" or "Pkg" explicitly. Weight should always be shown separately from quantity count.

**The staff story:** "Yung × 2 sa Samgyupsal, anong ibig sabihin? Dalawang servings? Kasi minsan nag-utos ang customer ng isa lang, pero × 2 ang nakalagay. Nagtatanong pa ang manager. Hindi malinaw."

**Affected role(s):** Staff (Ate Rose), Manager (Sir Dan — reconciliation confusion)

---

##### [10] Order sidebar instructions mismatch context when no tables are occupied

**What:** The order sidebar shows the instruction "Tap an occupied table on the floor plan to view its running bill here." This text appears even when all 8 tables are FREE and none are occupied. The instruction references "occupied" tables that do not exist in the current state.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Skip cash float.
2. Observe the POS floor plan with all 8 tables free.
3. The order sidebar shows: "Tap an occupied table on the floor plan to view its running bill here."

**Why this breaks:** A new staff member (Ate Santos, day 1) reads the instruction and looks for an "occupied" table. There are none. She concludes there's nothing to do and waits — when in reality, she should tap a free table to open it. The instruction teaches the wrong mental model for the start-of-shift state when all tables are free.

**Ideal flow:** The instruction should be context-aware: when all tables are free → "Tap a table to open it and start an order." When some tables are occupied → "Tap an occupied table (orange) to view its bill, or a free table (green) to open it." The instruction should always describe the *correct next action* for the current state.

**The staff story:** "Bagong trainee ako, lahat ng mesa libre pa. Sinabi ng app 'tap an occupied table.' Wala namang occupied. Nagtatanong na ko sa manager kung saan ako mag-click. Dapat sinabi na lang nito kung paano mag-open ng mesa."

**Affected role(s):** Staff (new staff, all POS cashiers)

---

##### [11] Cash float modal forces a decision on every shift start before floor is accessible

**What:** Every time Ate Rose logs in and navigates to `/pos`, a full-screen overlay modal appears: "Start Your Shift — Declare your opening cash float." The floor plan, tables, and order sidebar are visible but inaccessible behind the modal. A "Skip — I'll add float later" option exists, but is styled as a small ghost text link at the bottom — not a primary affordance.

**How to reproduce:**
1. Login as Ate Rose (staff, tag). Navigate to `/pos`.
2. Result: full-screen "Start Your Shift" modal blocks all POS access.
3. "Skip — I'll add float later" is available but visually de-emphasized compared to the "Start Shift →" primary button.

**Why this breaks:** During rush re-login (e.g., after a crash, tablet reboot, or session timeout), Ate Rose needs to get back to the floor instantly. A mandatory decision gate — "How much cash float do I have?" — at the worst possible moment (mid-service) is a Doherty + Goal-Gradient violation. The "Skip" option exists but its visual de-emphasis implies it's wrong to skip, adding cognitive friction. If the float amount was already entered at shift start, the modal re-prompting on every login is especially disruptive.

**Ideal flow:** Cash float declaration should be a one-time event per shift (not per login). Once declared, re-logins during the same business date should bypass the modal entirely. If no float has been declared for today: show the modal once, with "Skip" equally prominent to "Start Shift →" (both as `.btn-secondary` or clearly peer CTAs). Never block the POS floor for returning staff during active service hours.

**The staff story:** "Nag-restart ang tablet, nagmadali na akong mag-login para sa mesa. Tapos bigla may 'declare your cash float' ulit! Wala na akong oras nun — baka 8 tables na naghihintay. Dapat once lang ito sa isang araw."

**Affected role(s):** Staff (Ate Rose, all POS cashiers)

---

## Cross-Role Recommendations

---

##### [CR-01] Stove station completion is invisible to POS staff until sidebar is manually opened

**What:** When Lito marks Ramyun and Soju as DONE on `/kitchen/stove`, the POS order sidebar for T1 updates the item status to "✓ SERVED." However, this update is only visible if Ate Rose has already tapped T1 to open the sidebar. There is no proactive notification, badge, or table card indicator that dishes from a specific table are now served by the stove. Ate Rose must know to check, and must have the sidebar open, to benefit from this handoff signal.

**How to reproduce:**
1. Staff opens T1, fires order with Ramyun + Soju.
2. Kitchen marks both done on Stove.
3. Staff returns to POS floor plan view (sidebar closed or different table selected).
4. Result: floor plan T1 card shows no "dishes ready" signal — just the timer and total. Ate Rose has no passive awareness that T1's dishes are ready.

**Why this breaks:** During peak rush Ate Rose is managing 5–8 tables. She cannot keep each table's sidebar open. When T1's Ramyun is done, the food runner needs to know to pick it up and take it to the table. The food runner checks with Ate Rose. Ate Rose doesn't know. Ate Rose checks the sidebar. This is a 20–30 second loop for every single stove completion — on a busy night that's 60+ seconds of floor-coordination overhead per table that dishes are served.

**Ideal flow:** When any dish from T1 transitions to SERVED, the T1 floor plan card should show a small indicator — a green stove icon, a "dishes ✓" badge, or a color-state change on one of the card's status lines. This allows Ate Rose to glance at the floor and immediately know: "T1 dishes out." The indicator should auto-clear when Ate Rose taps the table and views the sidebar (marking it acknowledged).

**The staff story:** "Hindi ko agad nalalaman kung handa na yung Ramyun ng T1. Kailangan ko pang i-open ang sidebar. Sa daming mesa, hindi ako palaging naka-check. Sana may signal sa floor plan mismo — para sa table na tapos na yung dishes."

**Affected role(s):** Staff (Ate Rose) ↔ Kitchen (Lito — Stove)

---

##### [CR-02] New table alert does not persist — Corazon misses staging window if not on Dispatch tab

**What:** The new table alert on `/kitchen/dispatch` does not create a persistent notification. If Corazon is on a different tab (e.g., All Orders) or away from the tablet when Ate Rose opens T1, the staging alert for T1 never appears for Corazon. This was confirmed in the audit session — the alert strip showed static placeholder text "New table alerts will appear here when a table opens" for the entire session, despite T1 being opened by Ate Rose minutes earlier.

**How to reproduce:**
1. Login as Corazon (kitchen, tag). Navigate away from `/kitchen/dispatch` to `/kitchen/all-orders`.
2. Switch to Ate Rose (staff). Open T1, set pax, confirm. The table opens.
3. Switch back to Corazon. Navigate to `/kitchen/dispatch`.
4. Result: T1 dispatch card appears (H1 PASS) but the "New table alerts" strip shows no alert for T1 — only the placeholder.

**Why this breaks:** The PRD specifies that the dispatch/expo role must prepare utensils and stage banchan the moment a table opens. If Corazon misses the alert, she doesn't know T1 needs staging until she sees T1 appear in the dispatch board — by which time, the guests are already seated and the 2-minute staging window has passed. At a 30-seat restaurant running full service, 2–3 missed staging alerts per shift translates to 6–9 tables where guests wait for water and utensils. This is a brand-level service failure.

**Ideal flow:** New table alerts should be stored in RxDB (`kitchen_alerts` collection) at the moment the table opens, with `type: 'new_table'`, `tableId`, `pax`, `locationId`, and `createdAt`. The dispatch page reads from this collection and shows all unacknowledged alerts, even if the page was not open when the alert was created. Alerts persist until the expo taps "Staged ✓" to dismiss. This is consistent with the existing `kitchen_alerts` collection in the schema (see `schemas.ts`).

**The staff story:** "Minsan nakatalikod ako nung nabuksan yung table. Pagbalik ko sa tablet, wala na yung alert. Wala ko namalayan na may bagong table pala. Naghintay ang customer ng matagal para sa tubig at kutsara. Dapat nakatago yung alert hanggang hindi ko pa na-dismiss."

**Affected role(s):** Staff (Ate Rose) ↔ Kitchen (Dispatch/Expo — Corazon, Nena)

---

## E. Structural Proposals

---

##### [SP-01] Collapse dispatch card sides list by default with pinned batch action

**Problem pattern:** Issues [02] and [CR-02] share the same root cause: the dispatch card presents all 10 side items as an expanded list inline in the card, pushing the most-used batch action (ALL SIDES DONE) below the viewport and making the card too tall to see completely at 768px. Adding more tables multiplies this problem — 8 tables × 10 sides each = 80 rows of DONE buttons, each table requiring individual scroll.

**Current structure:**
```
┌─ T1 dispatch card ─────────────────────────────────────┐
│ T1  4 pax                                    03:49     │
│ 🥩 Meat   1/3  ⏳                                       │
│ 🍳 Dishes 2/2  ✅                                       │
│ 🥬 Sides  0/10 ⏳                                       │
│   Kimchi          [DONE]                               │
│   Rice            [DONE]                               │
│   Cheese          [DONE]  ← visible at 768px           │
│   Lettuce         [DONE]  ← visible                    │
│   Egg             [DONE]  ← visible                    │
│   Cucumber        [DONE]  ← borderline                 │
│   Chinese Cabbage [DONE]  ← below fold ─────────       │
│   Pork Bulgogi    [DONE]  ← below fold                 │
│   Fish Cake       [DONE]  ← below fold                 │
│   Iced Tea Pitcher[DONE]  ← below fold                 │
│   [ALL SIDES DONE]        ← far below fold             │
└────────────────────────────────────────────────────────┘
```

**Proposed structure:**
```
┌─ T1 dispatch card ─────────────────────────────────────┐
│ T1  4 pax                                    03:49     │
│ 🥩 Meat   1/3  ⏳                                       │
│ 🍳 Dishes 2/2  ✅                                       │
│ 🥬 Sides  0/10 ⏳  [▶ show items]                       │
│                                                        │
│ ┌─ sides quick-chips (collapsed default) ────────────┐ │
│ │ ●Kimchi  ●Rice  ●Cheese  +7 more  [ALL DONE ✓]     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [expanded on tap: individual DONE rows] [ALL DONE ✓] ← sticky
└────────────────────────────────────────────────────────┘
```

**Why individual fixes won't work:** The current layout is a flat list. Adding `sticky bottom-0` to ALL SIDES DONE within the card helps but still requires scrolling to see which individual sides are done. The fundamental issue is that 10 explicit side rows are shown by default — this is the wrong default for a dispatch station where batch-marking is the dominant pattern. Individual marking (tapping each DONE button) is the exception (one table needs sides staged at different times). The collapsed-by-default approach aligns with how Corazon actually works: she plates all sides in one motion and batch-marks them ALL DONE.

**Affected role(s):** Kitchen (Dispatch/Expo — Corazon, Nena). Manager (Sir Dan — can still expand to verify counts).

**The staff story:** "Para kanako, mas maganda kung mag-ALL SIDES DONE na lang ako in one tap. Hindi ko kailangan i-expand yung 10 items tapos mag-scroll sa baba. Batch ang trabaho ko — lahat sabay. One button, tapos. Mag-expand na lang kapag kailangan ko i-check kung alin specific ang kulang."

**Implementation sketch:** In `kitchen/dispatch/+page.svelte`: (1) Add `$state(Map<string, boolean>)` for expanded-sides-per-card state. (2) Default to collapsed. (3) Render collapsed view as a chip row (item name as small badge, tap to toggle done). (4) `sticky bottom-0` for ALL SIDES DONE button within the card's CSS container (`position: sticky; bottom: 0; background: white`). (5) "▶ show items" expands to full list for individual marking. No schema changes required.

---

## Fix Checklist (for `/fix-audit`)

- [ ] [01] — New table alert is ephemeral — Corazon misses staging cue if not on Dispatch at table-open moment
- [ ] [02] — ALL SIDES DONE is below fold with 10 sides expanded
- [ ] [03] — Stove ✓ item buttons are below 56px kitchen minimum touch target
- [ ] [04] — Stove tab nav icon is a magnifying glass — not a stove
- [ ] [05] — "New Takeout" button has a persistent pulsing animation
- [ ] [06] — AddItemModal Dishes tab lists 11 items with no grouping or search
- [ ] [07] — Dual-badge WEIGHING + REQUESTING on single meat row
- [ ] [08] — "Refill" button appears as primary CTA over "Add Item"
- [ ] [09] — "Samgyupsal × 2" notation is ambiguous
- [ ] [10] — Order sidebar instructions mismatch context when no tables are occupied
- [ ] [11] — Cash float modal forces decision on every login
- [ ] [CR-01] — Stove completion invisible to POS staff without sidebar open
- [ ] [CR-02] — New table alert does not persist — Corazon misses staging window

## Structural Proposals (for discussion)

- [ ] [SP-01] — Collapse dispatch card sides list by default with pinned batch action (addresses [02], [CR-02])

---

## G. Scenario Scorecard

| # | Scenario | Completed? | Handoffs OK? | Friction Points | Verdict |
|---|---|---|---|---|---|
| S1 | Table Opens, Order Fires | Yes | H1 PASS, H2 PASS | Float modal, Takeout animation, Dishes list density | CONCERN |
| S2 | Refill Round | Not tested (skipped) | — | — | — |
| S3 | Stove Completes | Yes | H3 PASS | — | PASS |
| S4 | ALL SIDES DONE | Yes (partial — meat still pending) | H3 PASS | ALL SIDES DONE below fold | CONCERN |
| S5 | Staff Sees Kitchen Feedback | Yes | H4 PASS (sidebar only) | No passive floor indicator for dishes ready | CONCERN |

### Cross-Role Interaction Assessment

| # | Transition | Source | Target | Data Expected | Data Found | Visibility | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Order fired → Dispatch | Staff (POS) | Corazon (Dispatch) | T1 ticket with all items | ✅ T1 card appeared instantly | Clear — card prominent | PASS |
| 2 | Order fired → Stove | Staff (POS) | Lito (Stove) | Dishes/drinks only | ✅ Ramyun + Soju, no meats | Clear — clean queue | PASS |
| 3 | Stove ALL DONE → Dispatch | Lito (Stove) | Corazon (Dispatch) | Dishes 2/2 complete | ✅ Dishes row turned green | Clear — green ✅ instant | PASS |
| 4 | Sides/Dishes done → POS | Corazon/Lito | Ate Rose (POS) | SERVED badges on items | ✅ Sidebar shows ✓ SERVED | **Subtle — sidebar only, no floor signal** | CONCERN |
| 5 | Table open → New table alert | Ate Rose (POS) | Corazon (Dispatch) | "T1 opened 4 pax" alert | ❌ Only placeholder shown | Missing — alert not persisted | FAIL |

---

*Overall recommendation:* **The core kitchen-to-floor data pipeline is solid — all 4 handoffs pass and the RxDB reactivity is instant. The system's weak point is the last mile: Corazon misses staging cues, Ate Rose can't see kitchen progress passively, and Corazon's most-used batch action is buried below the fold. Fix [01], [02], and [CR-02] first — these are the only issues that cause customer-visible service failures during peak rush.*
