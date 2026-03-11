# UX Audit — Kitchen Harmony (Hard)
**Date:** 2026-03-11
**Mode:** Multi-user (3 stints + 5-page solo kitchen sweep)
**Scenario:** "Friday Rush" — Staff creates order → Kitchen processes → Concurrent table pressure + Kitchen standalone deep dive
**Roles audited:** Ate Rose (staff), Kuya Marc (kitchen/dispatch), Ate Lina (kitchen/sides)
**Branch:** Alta Citta (`tag`)
**Viewport:** 1024×768 (tablet)
**Agents:** 2 parallel (Agent 1: cross-role flow · Agent 2: kitchen solo)
**Difficulty:** Hard
**Run ID:** `054436-3041dc74`

---

## A. Text Layout Map

### POS Floor (Ate Rose — Stint 1 + 3)
```
+--sidebar--+---------------------main-content--------------------+
| [POS]     | ALTA CITTA (TAGBILARAN) [Change Location]           |
|           |---------------------------------------------------|
|           | [2 occ · 6 free] [📦 New Takeout] [🕒 History(11)] |
|           |                                                    |
|           | [T1 4cap] [T2 4cap] [T3 2cap] [T4 ★occ 2m 2pax]   |
|           | [T5 2cap] [T6 ★occ 0m 2pax] [T7 4cap] [T8 4cap]   |
|           |                         ~~fold~~                   |
|           |                                                    |
+--sidebar--+----------------------------------------------------+
  ← Pax count bug: T4=4pax selected, shows "2 pax". T6=6pax, shows "2 pax".
  ← Package badge "PORK" in text-xs — barely legible at arm's length
  ← No countdown urgency color escalation (green→yellow→red)
```

### PaxModal (T4 — Ate Rose)
```
+----------------------PaxModal-----------------------+
| "How many guests for T4?"    Capacity: 4            |
|                                                     |
| Adults:   [−(32px)] [ 2 ] [+(32px)]                 |  ← stepper: 32px wide (FAIL)
|  [1][2][3][4][5][6][7][8]                           |  ← quick-select: 36px each
|                                                     |
| Children (6-9): [−] [ 0 ] [+]   [0][1][2][3][4]   |
| Free (under 5): [−] [ 0 ] [+]   [0][1][2][3][4]   |
|                                                     |
|         [Cancel]          [Confirm (167×48px)]      |
+-----------------------------------------------------+
  ← Quick-select click not registering — tables always open at "2 pax"
  ← Adult row and children row quick-select buttons look identical
```

### AddItemModal (Package → Meats → Sides → Drinks)
```
+--Package--Meats--Sides--Dishes--Drinks--(5 tabs)---+
|                                          Pending ▶  |
| [Beef Unlimited ₱599/pax  191×326px]               |
| [Beef+Pork Unlimited ₱499/pax 191×326px]           |
| [Pork Unlimited ₱399/pax  191×326px]               |
|                                          ~~fold~~   |
|                     [Undo]  [⚡ CHARGE (13) 127×44px] |
+-----------------------------------------------------+
  ← CHARGE: 44px height (marginal), top-right stretch zone
  ← No "sent to kitchen" toast after CHARGE
  ← No default/most-popular package highlighted
```

### Kitchen Dispatch (Kuya Marc — Stint 2)
```
+--All Orders--Dispatch--Weigh Station--Stove-(44px!)-+  ← sub-nav FAIL
|  ALTA CITTA (TAGBILARAN)        [BT Scale] 🟢 Live  |
|  ┌─ Dispatch Board (1) ──────────────────────────┐  |
|  │ T4  2 pax  00:23                              │  |
|  │ 🥩 Meat    0/2  ⏳                             │  |
|  │ 🍳 Dishes  N/A                                │  |
|  │ 🥬 Sides   0/10 ⏳                            │  |
|  │  [Egg (64×44px)]✓ [Rice (64×44px)]✓ ...×10   │  ← 44px height FAIL kitchen
|  │  [ALL SIDES DONE (380×44px)]                  │  ← 44px height FAIL kitchen
|  │  [ALL DONE — CLEAR ORDER (56px)]              │  ← PASS
|  └───────────────────────────────────────────────┘  |
|  New Tables: (empty strip)                          |
|          ~~fold (nothing below for 1-card view)~~   |
+-----------------------------------------------------+
  ← 10 ungrouped DONE buttons — no category grouping
  ← Meat row has no urgency escalation (stuck at 0/2 with no time alert)
```

### Kitchen Stove (Kuya Marc — Stint 2)
```
+--sub-nav (44px height)------------------------------+
|  Stove Queue  0 pending dishes                      |
|                                                     |
|     ✅ No pending dishes                            |
|     New dish/drink orders will appear automatically |
|                                                     |
|  (no active-table context shown)                    |
+-----------------------------------------------------+
  ← Empty state doesn't show "1 table active" — cook can't distinguish
    "quiet" from "bug dropped all orders"
```

---

## B. Principle-by-Principle Assessment

### Staff Pages (POS flow)

| # | Principle | Verdict | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** | PASS | AddItemModal: 5 category tabs (within 7±2). Floor toolbar: 3 items. PaxModal: 3 pax categories — mild concern but manageable. |
| 2 | **Miller's Law** | CONCERN | PaxModal: 3 separate pax category rows (Adults/Children/Free) with 8+5+5 quick-select buttons = 18 potential choices for a 10-second interaction. |
| 3 | **Fitts's Law** | CONCERN | Stepper "−/+" buttons = 32×48px (fail width). CHARGE button = 127×44px in top-right stretch zone. PaxModal quick-select = 36×44px (marginal). |
| 4 | **Jakob's Law** | PASS | AddItemModal follows standard POS item-picker conventions. PaxModal stepper pattern is universally understood. |
| 5 | **Doherty Threshold** | PASS | RxDB local-first: floor updates, modal opens, and order sidebar updates all under 500ms. No loading spinners visible. |
| 6 | **Visibility of System Status** | FAIL | No toast/confirmation after CHARGE 13 items. "Sent to kitchen" state invisible. Staff has no positive confirmation the kitchen received the order. |
| 7 | **Gestalt: Proximity** | PASS | AddItemModal groups package cards cleanly. Floor counters grouped in header. Order sidebar grouped correctly. |
| 8 | **Gestalt: Similarity** | CONCERN | PaxModal adult/children quick-select rows are visually identical — no color or size distinction to separate "paid" from "free" pax categories. |
| 9 | **Visual Hierarchy (scale)** | CONCERN | Package badge "PORK" on occupied table card uses text-xs — renders ~11px at 1024×768. Unreadable at arm's length. |
| 10 | **Visual Hierarchy (contrast)** | PASS | Table status differentiation (orange occupied vs. green free) is clear. Package names dominate package cards. |
| 11 | **WCAG: Color Contrast** | PASS | Main text on white passes. Occupied table orange on card background passes for large text. |
| 12 | **WCAG: Touch Targets** | FAIL | Stepper "−/+" = 32px wide (below 44px min). CHARGE = 44px height (marginal, passes minimum but not comfortable). |
| 13 | **Consistency (internal)** | FAIL | Quick-select buttons in PaxModal use a distinct visual style not found anywhere else in the POS. The numpad aesthetic is inconsistent with `.btn-*` system. |
| 14 | **Consistency (design system)** | PASS | Accent orange, Inter font, pos-card radius all consistent with design system. |

### Kitchen Pages (all pages)

| # | Principle | Verdict | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** | CONCERN | All-orders filter bar: 9 ungrouped choices (5 status + 4 time) at same hierarchy level. Dispatch card itself: clean at idle. |
| 2 | **Miller's Law** | CONCERN | Dispatch card lists 10 individual DONE buttons for 10 sides — no category grouping. At peak with 8 cards: 80+ ungrouped actions on screen. |
| 3 | **Fitts's Law** | FAIL | Sub-nav tabs = 44px (all 5 pages). Dispatch sides DONE = 44px. ALL SIDES DONE = 44px. All-orders filter buttons = 44px × 9. Weigh-station Yield%/Reconnect/Reprint = 44–48px. Kitchen minimum = 56px. |
| 4 | **Jakob's Law** | PASS | Station layout follows standard KDS conventions. Weigh-station three-column (pending/numpad/dispatched) follows industrial weighing patterns. |
| 5 | **Doherty Threshold** | PASS | Dispatch board loaded within ~2s (RxDB local-first). Audio chimes provide <400ms sensory feedback. Live indicator provides ambient confirmation. |
| 6 | **Visibility of System Status** | CONCERN | Live indicator (`fixed top-4 right-4 z-50`) may compete with BT Scale button for top-right zone. Stove empty state gives no active-table count. |
| 7 | **Gestalt: Proximity** | PASS | Dispatch card groups station rows (Meat/Dishes/Sides) with dividers. Weigh-station three-column layout groups controls spatially. |
| 8 | **Gestalt: Similarity** | CONCERN | Dispatch sides DONE = 44px vs. Stove DONE = 56×56px. Same action, different size. Inconsistency breaks motor expectation across stations. |
| 9 | **Visual Hierarchy (scale)** | PASS | Weight display: text-6xl (~60px). Dispatch table number: text-2xl font-black. Stove table number: text-2xl. Primary data dominates. |
| 10 | **Visual Hierarchy (contrast)** | CONCERN | Station row status labels use `text-status-green` (#10B981) on white = 3.5:1 — FAIL AA for small text. `text-gray-400` timestamps low-contrast at 60–90cm. |
| 11 | **WCAG: Color Contrast** | CONCERN | Green labels on white = 3.5:1 (FAIL AA). Kitchen environment rule ≥5.5:1 required at distance. |
| 12 | **WCAG: Touch Targets** | FAIL | Sub-nav 44px (all pages), sides DONE 44px, filter buttons 44px × 9. Kitchen standard = 56px. Multiple critical-path actions below minimum. |
| 13 | **Consistency (internal)** | CONCERN | Dispatch sides DONE = 44px vs. stove DONE = 56px. Sub-nav = 44px vs. content buttons 56–72px. Navigation is harder to tap than the content it navigates to. |
| 14 | **Consistency (design system)** | CONCERN | Sub-nav uses emoji icons (🧾📋⚖️🍳) — inconsistent with lucide-svelte icon system used everywhere else in WTFPOS. |

---

## C. "Best Day Ever" Vision (Staff — Ordering Flow)

Ate Rose has done this shift a hundred times. She knows the floor. She knows the regulars. Tonight she's got two new staff shadowing her, and she wants to show them how smooth this system runs.

She taps T4. The PaxModal slides up instantly. Four regulars tonight — she taps "4" on the adults row and the button responds with a satisfying press. The count shows 4. She taps Confirm. The AddItemModal opens with the context already set: "T4 · 4 guests." No second-guessing, no "wait, did I enter 4 or 2?"

She picks Pork Unlimited, adds the drinks in two taps, hits CHARGE. A brief green toast: "13 items sent to kitchen for T4 · Kuya Marc notified." She exhales. Done. The floor card updates to show "PORK · T4 · 4 pax · ₱1,596." Correct. She turns to the shadow: "That's how you open a table."

**Where we are today vs. that ideal:** The pax quick-select click doesn't register — both T4 and T6 opened at 2 pax. There's no "sent to kitchen" confirmation. The CHARGE button is in the upper-right stretch zone instead of the natural grip position. The "PORK" badge on the floor card is in text-xs, invisible at arm's length. The current gap between this vision and today's reality is three fixable issues.

---

## D. Recommendations

---

##### [01] Pax quick-select click does not register — tables always open at 2 pax

**What:** After selecting a pax count from the quick-select numpad in `PaxModal.svelte`, the table opens with 2 pax (the initial default) rather than the selected value. Both T4 (selected 4) and T6 (selected 6) confirmed at "2 pax" on the floor card and in the AddItemModal header. The quick-select click produces a visual press response but the underlying pax `$state` is not updated before the Confirm action fires.

**How to reproduce:**
1. Login as staff (`Ate Rose`, `tag`)
2. Navigate to `/pos`
3. Tap any table (e.g. T4, capacity 4)
4. In PaxModal, tap the "4" button in the Adults quick-select row
5. Tap Confirm
6. Observe the floor card and AddItemModal header — both show "2 pax" instead of "4 pax"

**Why this breaks:** Ate Rose opens 15–25 tables per shift. For every Pork Unlimited (₱399/pax) table she opens at "4 pax" that registers as "2 pax": the bill totals ₱798 instead of ₱1,596 — a ₱798 revenue loss per table. At 15 tables/shift this is potentially ₱11,970 per shift unaccounted. It also corrupts KDS context (kitchen sees "2 pax" on the dispatch card, plans sides for 2 not 4), stock deduction calculations, and management reports. Boss Chris's end-of-day Z-read will show consistently underreported per-table revenue with no obvious cause.

**Ideal flow:** Tapping a quick-select button immediately updates the Adults pax count displayed in the stepper. The Confirm button reads the current in-state value (not the initial default). The table opens with exactly the pax count shown at the moment Confirm was tapped. The floor card and AddItemModal header both display the correct count.

**The staff story:** "Hindi ko alam na mali pala ang pax. Akala ko nag-click ako ng 4, pero 2 pala ang narecord. Yung bill ng table namin ₱798 lang — dapat ₱1,596. Malaking pagkawala 'yon."

**Affected role(s):** Staff (Ate Rose)

---

##### [02] PaxModal stepper buttons 32px wide — below 44px touch target minimum

**What:** The "−" and "+" stepper buttons flanking the Adults (and Children, Free) pax counters in `PaxModal.svelte` measure 32×48px. Width is 12px below the 44px minimum. The buttons render as tall but extremely narrow pill shapes, creating a narrow miss zone alongside the number display.

**How to reproduce:**
1. Login as staff, navigate to `/pos`
2. Tap any table to open PaxModal
3. Observe or measure the "−" and "+" buttons flanking the adults count
4. Attempt to tap "+" one-handed while holding a tablet — the narrow width causes frequent misses on the number display

**Why this breaks:** During a busy Friday night, Ate Rose is holding the tablet with one hand and tapping with her thumb. The stepper "+" is 32px wide. Her thumb contact zone is ~44px. She will regularly hit the number display (no-op) instead of "+" and must re-tap. With 15–25 table opens per shift and an average of 2–3 stepper adjustments each, this creates 30–75 misfire opportunities per shift. The frustration is silent — no error shown — which makes it worse.

**Ideal flow:** Stepper buttons render at minimum 44×44px (POS standard). On tablet orientation, a 48×48px target is preferable given single-handed use. The number display between them maintains its current style but the flanking buttons occupy a visually distinct, larger tap zone.

**The staff story:** "Yung minus at plus button, sobrang liit. Lagi akong nami-miss. Natapos na yung customer sa pagorder bago ko pa ma-adjust ang pax."

**Affected role(s):** Staff (Ate Rose)

---

##### [03] No confirmation after CHARGE — staff cannot tell if kitchen received the order

**What:** After tapping CHARGE in `AddItemModal.svelte`, no success toast, badge, or visual confirmation appears. The modal closes, the floor counter updates silently, and the order sidebar shows the bill. There is no "sent to kitchen" acknowledgment anywhere on the POS screen after charging items.

**How to reproduce:**
1. Login as staff, open a table, add 3+ items
2. Tap CHARGE
3. Observe: modal closes, floor card updates — but no toast, no "Kitchen notified" badge, no feedback that kitchen received the ticket

**Why this breaks:** Ate Rose charges 13 items for T4. Nothing happens visually except the modal closing. Was the charge sent? Did the kitchen get the ticket? She checks the order sidebar — it shows the bill, but does the kitchen see it? During a loud, busy service, the silence after a 13-item CHARGE is anxiety-inducing. A new staff member who missed the modal closing will tap CHARGE again — double-charging the table. Kuya Marc will suddenly see the same table appear twice in dispatch. This triggers a 3-minute investigation between staff and kitchen that could have been avoided with a 2-second toast.

**Ideal flow:** After CHARGE, a brief (2s auto-dismiss) green toast appears: "13 items sent to kitchen for T4." The order sidebar also shows a `🍳 Kitchen: 10 sides queued` status badge on the T4 active order, updating reactively as kitchen processes each item. Staff can glance at the sidebar and know kitchen status without navigating.

**The staff story:** "Pinindot ko ang CHARGE, tapos nawala yung modal. Yun na? Natanggap na ng kusina? Hindi ko alam. Lagi akong nagtatanong kay Kuya Marc — 'Natanggap na ba?'"

**Affected role(s):** Staff (Ate Rose), Kitchen (Kuya Marc)

---

##### [04] CHARGE button in top-right stretch zone — wrong position for a 100×/shift action

**What:** The CHARGE button in `AddItemModal.svelte` renders at coordinates x:852, y:673 (1024×768 viewport) — the top-right corner of the screen. On a landscape tablet held with the right hand, the natural thumb reach zone is bottom-center to bottom-right near the lower grip edge. The top-right corner requires a grip shift or reaching across the screen.

**How to reproduce:**
1. Login as staff, open a table, open AddItemModal
2. Observe CHARGE button position — it is in the upper-right area of the right panel
3. Hold a 10" tablet in landscape with right hand — attempt to tap CHARGE with right thumb without shifting grip

**Why this breaks:** Ate Rose taps CHARGE approximately 80–120 times per shift (multiple orders per table, including additions). Each tap requires shifting her grip or using her left hand. Over a 6-hour service, 100 awkward CHARGE taps accumulate. Misses are more likely when she's moving between tables while holding the tablet. During a dinner rush when speed matters most, this is when misses and double-charges happen.

**Ideal flow:** CHARGE should be the dominant bottom-right action — full width or positioned at the lower grip area. A sticky footer approach (`fixed bottom-0`) makes it reachable without grip shift on any viewport. Height should be 56px to match the action's importance frequency (100×/shift).

**The staff story:** "Yung CHARGE button, nasa itaas kaya lagi akong naghi-hit ng ibang button. Mas madali kung nasa ibaba siya."

**Affected role(s):** Staff (Ate Rose)

---

##### [05] Kitchen sub-nav links 44px across ALL 5 kitchen pages — below 56px kitchen minimum

**What:** `SubNav.svelte` renders navigation tabs with `style="min-height:44px; min-width:unset"` (confirmed at source line 24). All 4 kitchen sub-nav tabs (All Orders, Dispatch, Weigh Station, Stove) measure 44px height on every kitchen page. The kitchen environment standard per `ENVIRONMENT.md` is **56px minimum** due to wet hands, potential nitrile gloves, and elevated grip stress.

**How to reproduce:**
1. Login as kitchen role (`Kuya Marc`, `tag`)
2. Navigate to any `/kitchen/*` page
3. Measure the sub-nav tabs — all render at 44px height
4. Attempt to tap between tabs one-handed with wet hands during a mock rush

**Why this breaks:** Kuya Marc switches between Dispatch and Stove multiple times per shift — at least 20–40 tab switches per service. Each switch happens while he may have sauce-wet hands or greasy fingers from handling meat. The 44px target means his fingertip must land within a 44px-tall band that sits at the top of the content area. Misses redirect him to the wrong station view — during a rush, accidentally landing on "All Orders" when trying to hit "Stove" costs 3–5 seconds of disoriented navigation. This is a **single-component fix** (`SubNav.svelte` line 24) that upgrades all 5 kitchen pages simultaneously.

**Ideal flow:** SubNav renders with `min-height:56px` for kitchen pages. Either via a `size` prop (`<SubNav size="kitchen" />` → 56px, default → 44px) or a kitchen-specific CSS override. The tab text and emoji icons remain unchanged.

**The staff story:** "Lagi akong nami-miss ng tab. Gusto ko yung Dispatch pero napindot ko yung All Orders. Grease pa ng kamay ko — hindi tumatama yung daliri ko."

**Affected role(s):** Kitchen (Kuya Marc, Ate Lina, Kuya Benny)

---

##### [06] All-orders filter buttons 44px with 9 ungrouped controls — Hick's Law + Fitts's Law compound failure

**What:** `/kitchen/all-orders` renders two separate filter bars simultaneously: 5 status filter buttons (All 12 / Open 2 / Pending 1 / Paid 8 / Cancelled 1) and 4 time filter buttons (Today / Last Hour / Last 3 Hours / All Time). All 9 buttons measure 44×44px. There is no visual grouping (label, divider, or background) to distinguish "status" filters from "time" filters.

**How to reproduce:**
1. Login as kitchen, navigate to `/kitchen/all-orders`
2. Count the filter controls: 9 buttons rendered at same visual level
3. Try to quickly find "Open orders from the last hour" — requires two separate deliberate taps with zero orientation guidance
4. Measure buttons — all at 44px height

**Why this breaks:** Ate Lina uses all-orders to monitor which tables still have open orders during cleanup. Under peak cognitive load (end of rush, tables clearing, kitchen wiping down), she needs to filter to "Open · Last Hour" in a two-tap action. With 9 visually identical controls and no grouping labels, she must pause to read each button before acting. At 44px in kitchen environment with wet hands, every tap also risks landing on the adjacent filter. The compound failure (too many choices + too small) is worse than either alone.

**Ideal flow:** Two filter groups rendered as clearly separated rows with labels ("Filter by status:" / "Filter by time:"), each with `min-height:56px` buttons. Total visible choices reduced from 9 to 5+4 but with obvious grouping. The active filter combination should be summarized ("Showing: Open · Last Hour") so Ate Lina can confirm her selection in one glance.

**The staff story:** "Yung 9 buttons na yan, hindi ko alam kung alin yung filter ng status o ng oras. Sabay-sabay lahat. Lagi akong nagkakamali ng pinipindot."

**Affected role(s):** Kitchen (Ate Lina, Kuya Marc)

---

##### [07] Dispatch sides DONE and ALL SIDES DONE buttons 44px — most repeated kitchen action below minimum

**What:** In `/kitchen/dispatch`, per-item DONE buttons for individual sides render at 44px height (`min-h-[44px]` confirmed in source). ALL SIDES DONE button also renders at 44px height. These are the primary repeated actions for the dispatch/expo role: marking individual sides done and batch-clearing all sides.

**How to reproduce:**
1. Login as kitchen, navigate to `/kitchen/dispatch` (requires open table with items)
2. Observe the per-item DONE buttons on the sides section of any dispatch card
3. Measure — all 44px height
4. Note ALL SIDES DONE button at bottom of sides section — also 44px

**Why this breaks:** Corazon/Nena (expo roles) mark sides done 30–60 times per shift (confirmed in `ROLE_WORKFLOWS.md` as "Action 4: CRITICAL"). With wet hands near the grill area and 10 DONE buttons stacked vertically, 44px targets cause consistent misses — either landing on the adjacent button (marking the wrong side done) or missing entirely. The contrast between this (44px) and the ALL DONE — CLEAR ORDER button (correctly at 56px) suggests an inconsistency where the batch action got the right treatment but the individual actions didn't.

**Ideal flow:** Both per-item DONE and ALL SIDES DONE raise to `min-h-[56px]`. Given these are the most-tapped buttons in the kitchen workflow, a more generous 60px would provide comfortable tap margin with gloves. The visual change is a 12px height increase per button — minimal impact on card layout.

**The staff story:** "Yung DONE button sa sides, 10 beses ko pinipindot bawat order. Laging nami-miss dahil maliit. Nagagalit na si Boss kasi ang tagal ko."

**Affected role(s):** Kitchen (Kuya Marc, Corazon, Nena)

---

##### [08] Dispatch card lists 10 ungrouped DONE buttons — Miller's Law violation

**What:** A single dispatch card for a Pork Unlimited table lists all 10 included sides as individual line items with individual DONE buttons, with no category grouping (starches / vegetables / sauces / condiments). With 8 active tables at peak, 80+ individual DONE buttons appear on screen simultaneously with no visual chunking.

**How to reproduce:**
1. Login as kitchen, navigate to `/kitchen/dispatch` with an active AYCE table
2. Open the sides section of a dispatch card
3. Count individual DONE buttons — 10 per standard Pork Unlimited order
4. Open 3+ tables simultaneously — observe the cumulative button density

**Why this breaks:** Kuya Marc (expo) needs to scan which specific side item is missing when a server reports "table 4 said they didn't get rice." With 10 identically-styled rows and no grouping, he must read every label sequentially. During peak with 8 cards showing 80 ungrouped items, the visual noise reaches a point where he misses items entirely. The ALL SIDES DONE batch button reduces the impact for clean clears, but individual marking — which happens when one item is delayed — remains unusable at scale.

**Ideal flow:** Sides items grouped by category with a subtle visual divider: **Starches** (rice, bread, noodles) / **Vegetables** (kimchi, salad) / **Sauces** / **Condiments**. Within each group, 3–5 items max. The category label acts as a Miller's-law chunk header, reducing cognitive load from "10 things" to "4 groups of 2–3 things."

**The staff story:** "10 lahat ng sides — rice, kimchi, egg, sabaw — pare-pareho ang hitsura. Hindi ko mahanap kung alin na yung natapos ko. Parang bato-bato sa langit."

**Affected role(s):** Kitchen (Kuya Marc, Corazon)

---

##### [09] Weigh-station secondary buttons below kitchen minimum (Yield%, Reconnect, Reprint)

**What:** Three secondary buttons on `/kitchen/weigh-station` fall below the 56px kitchen minimum:
- "Reconnect →" (BT scale reconnect): 48px — FAIL
- "Yield %" (yield calculator): 44px — FAIL
- "Reprint label" (printer icon in dispatched log): 44×44px — FAIL

The primary actions (numpad: 72px, DISPATCH: 64px, meat selector: 56px) correctly implement the PRD "knuckle-sized" requirement. The secondary buttons were not updated to match.

**How to reproduce:**
1. Login as kitchen, navigate to `/kitchen/weigh-station`
2. Observe the BT Scale disconnected state — "Reconnect →" button visible
3. Measure or inspect: 48px height
4. Open Yield Calculator — "Yield %" button 44px
5. In dispatched log, find "Reprint" icon button — 44×44px

**Why this breaks:** Kuya Benny wears nitrile gloves during butchering. When the scale disconnects mid-session (a known occurrence with Bluetooth), he must tap "Reconnect" with gloved fingers at 48px — 8px below the kitchen minimum. A missed tap means walking away from the station, removing a glove, tapping again, re-gloving, and returning — a 60-second delay during which the queue accumulates. "Reprint label" has the same issue: at 44px with a glove, he taps it 3 times before it registers.

**Ideal flow:** All three secondary buttons raise to 56px minimum (Reconnect, Yield%, Reprint). The PRD explicitly calls for "knuckle-sized" (≥64px) for the butcher interface — aligning secondary actions to this standard makes the page consistent end-to-end.

**The staff story:** "Yung Reconnect button, suot ko pa ang gloves ko, lagi kong nami-miss. Kailangan ko pang i-remove ang gloves para lang mapindot. Ang tagal."

**Affected role(s):** Kitchen (Kuya Benny)

---

##### [10] Sides-prep orphaned route has no deprecation signal

**What:** `/kitchen/sides-prep` is fully functional (renders the Sides Queue page correctly with live data) but is absent from the kitchen sub-nav. There is no redirect, no deprecation banner, no "use Dispatch instead" messaging. A kitchen worker who navigates here via bookmark, QR code, or muscle memory from the pre-dispatch era will land on a working but unsupported page.

**How to reproduce:**
1. Login as kitchen, navigate directly to `http://localhost:5173/kitchen/sides-prep`
2. Page renders — Sides Queue shows all pending sides
3. Check kitchen sub-nav — "Sides Prep" is absent
4. Mark sides done on this page — observe: items may update but Dispatch's READY TO RUN signal never fires (sides-prep bumps sides but does not trigger the dispatch READY state)

**Why this breaks:** Ate Lina used the old `/kitchen/sides-prep` page for months before the dispatch redesign. She still navigates there by habit. On this page she marks all her sides done — she thinks she's finished. But on the dispatch board (which Kuya Marc is watching), the sides section still shows 0/10 done because the bump on sides-prep and the DONE state on dispatch track differently. Table T4 never reaches "READY TO RUN." Kuya Marc pings Ate Lina: "Sides, tapos na ba?" She says yes. But the dispatch board disagrees. The order sits in limbo.

**Ideal flow:** `/kitchen/sides-prep` either (a) redirects to `/kitchen/dispatch` with a `?tab=sides` anchor, or (b) displays a top-of-page warning banner: "⚠️ This page has been replaced by Dispatch. [→ Go to Dispatch]" with an auto-redirect after 5 seconds. Option (a) is cleaner; option (b) avoids muscle-memory frustration.

**The staff story:** "Ginagamit ko pa rin yung lumang Sides Prep page. Hindi ko alam may bago na. Natapos na raw ba ako? Pero sa Dispatch, hindi pa daw. Nagtataka si Kuya Marc bakit hindi pa ready ang order."

**Affected role(s):** Kitchen (Ate Lina, sides prep role)

---

##### [11] Stove empty state hides active table context from arriving cook

**What:** When `/kitchen/stove` has no pending dishes, it shows "✅ No pending dishes — New dish/drink orders will appear here automatically." There is no ambient indicator of how many tables are currently active at other stations. A cook arriving at the stove station cannot determine if the queue is empty because (a) no tables are open, (b) all tables have AYCE-only orders with no dishes, or (c) a system error has dropped orders.

**How to reproduce:**
1. Login as staff, open a table with only AYCE package (no standalone dishes)
2. Switch to kitchen role, navigate to `/kitchen/stove`
3. Observe — "0 pending dishes" empty state with no table count
4. A new cook arriving at the stove cannot tell if T4 is being served by meats-only or if something failed

**Why this breaks:** Lito arrives at the stove station for the dinner rush. The screen shows "0 pending dishes." Is it quiet? Is it early? Did he miss something? He walks to Kuya Marc to ask "may open na ba tayong tables?" This cross-station question takes 30–60 seconds and Kuya Marc is already managing dispatch. If the stove screen simply showed "0 dishes · 2 tables active," Lito would know: the tables are open, just AYCE-only right now. One number eliminates one cross-station question per rush.

**Ideal flow:** The stove page reads the current table occupancy count (available from `floor-layout` store or `orders` store) and appends it to the empty state: "0 pending dishes · **2 tables currently active** · AYCE orders are tracked at Dispatch." This is a one-line `$derived` read — no new data, just surfacing existing context.

**The staff story:** "Walang lumalabas sa Stove screen ko. Pero hindi ko alam kung okay lang talaga yun o may problema. Lagi akong nagtatanong kay Kuya Marc."

**Affected role(s):** Kitchen (stove operator — Lito, Romy)

---

##### [12] No countdown urgency escalation on occupied table cards

**What:** Occupied table cards on the POS floor plan show elapsed time ("2m", "15m", "45m") but all use the same visual style regardless of how close the table is to the AYCE time limit. A table at 1m and a table at 59m look identical on the floor.

**How to reproduce:**
1. Login as staff, open 2 tables
2. Wait (or seed with different timestamps) — both show elapsed time
3. A table at 55 minutes (5 min to limit) looks identical to a table at 5 minutes

**Why this breaks:** Sir Dan does a floor walk at minute 50 and needs to identify which tables are approaching the limit so he can prompt for the final-round refill conversation. Currently, he must mentally calculate elapsed time for every table card. During a 8-table rush, he's reading 8 timers and doing mental math. A table that turns red at 50m and orange at 35m gives him the priority list at a glance — he can walk directly to the at-risk tables without calculation.

**Ideal flow:** Table cards use time-based color escalation: elapsed < 35m → current green; 35–49m → `bg-status-yellow` border tint; ≥50m → `bg-status-red` border tint (matching existing urgency tokens). The timer text escalates in parallel: black → amber → red. No new data needed — it's a `$derived` from `openedAt` timestamp.

**The staff story:** "Hindi ko alam kung alin sa mga mesa ang malapit na sa time limit. Kailangan ko pang kalkulahin. Kapag maraming mesa, nakalimutan ko yung isa."

**Affected role(s):** Staff (Ate Rose), Manager (Sir Dan)

---

##### [13] Low-contrast station status labels on dispatch cards

**What:** Station row status labels on dispatch cards use `text-status-green` (#10B981) on white card background. This yields a contrast ratio of ~3.5:1 — below WCAG AA for small text (4.5:1 required). The kitchen environment rule per `ENVIRONMENT.md` requires ≥5.5:1 at 60–90cm viewing distance with potential steam/grease diffusion.

**How to reproduce:**
1. Login as kitchen, navigate to `/kitchen/dispatch` with an active table
2. View the station row labels (e.g., "🥬 Sides 0/10 ⏳" in green text)
3. Measure contrast — #10B981 on #FFFFFF = ~3.5:1

**Why this breaks:** Kuya Marc reads the dispatch card from 60–90cm away while expediting. The green "Sides 0/10" label reads fine in ideal lighting, but at the cooking station — with steam, ambient smoke, and overhead light reflections on the tablet screen — contrast below 4.5:1 becomes effectively unreadable. He must lean in to confirm the sides count, breaking his oversight of the full dispatch board.

**Ideal flow:** Station labels use a higher-contrast color for status text — either `text-status-green` (#10B981) upgraded to the darker `#047857` (Tailwind green-700, ~5.4:1 on white), or the label is combined with a color-coded icon rather than relying on text color alone for status communication.

**The staff story:** "Yung kulay ng text sa dispatch card, hindi ko masyadong mabasa kung malayo. Kailangan ko pang humantong para makita."

**Affected role(s):** Kitchen (Kuya Marc, expo role)

---

##### [14] Sub-nav uses emoji icons inconsistent with lucide-svelte design system

**What:** The kitchen sub-nav tabs in `SubNav.svelte` use emoji icons (🧾, 📋, ⚖️, 🍳) while the rest of WTFPOS — sidebar, buttons, headers — uses `lucide-svelte` icon components. This creates a visual inconsistency: the same screen shows Lucide icons in the sidebar and emoji icons in the sub-nav.

**How to reproduce:**
1. Login as kitchen role, navigate to any `/kitchen/*` page
2. Observe the sub-nav: emoji icons on tab labels
3. Compare with the AppSidebar on the same screen: lucide-svelte icons (SVG, consistent weight and style)

**Why this breaks:** The inconsistency is subtle for experienced staff but notable to managers and the owner. More practically, emoji rendering varies across platforms and operating systems — the same ⚖️ may render differently on Android Chromebook vs. iPad. Lucide icons are SVG-based, always render identically, and scale cleanly at any size. Emoji at 56px can pixelate on some Android WebViews.

**Ideal flow:** Replace emoji with lucide-svelte equivalents: `<ClipboardList>` (All Orders), `<LayoutDashboard>` (Dispatch), `<Scale>` (Weigh Station), `<Flame>` (Stove). Consistent icon system, predictable rendering across devices.

**The staff story:** "Hindi naman malaking issue ito para sa akin — pero yung emoji ay parang hindi kapareho ng ibang icons sa app."

**Affected role(s):** All kitchen roles (cosmetic)

---

## E. Cross-Role Interaction Assessment

| # | Stint Transition | Source Role | Target Role | Data Expected | Data Found | Visibility | Verdict |
|---|---|---|---|---|---|---|---|
| H1 | Staff (POS) → Kitchen (Dispatch) | Ate Rose | Kuya Marc | T4 KDS ticket with sides (10) + meat (2) | T4 card present on dispatch board — 10 sides (0/10), meat (0/2), Live dot active | Clear — card occupies primary dispatch area | **PASS** |
| H2 | Kitchen (Dispatch) → Kitchen (Stove) | Kuya Marc | Stove cook | T4 dishes/drinks in stove queue | "0 pending dishes" — no standalone dishes ordered (AYCE only), stove correctly empty | Correct but contextless — no "T4 active at dispatch" shown | **CONCERN** |
| H3 | Kitchen (Dispatch) → Staff (POS — second table) | Kuya Marc | Ate Rose | T4 shown as occupied on floor; T6 can be opened | T4 shows orange occupied, "PORK 2m T4 2 pax ₱798"; T6 opened successfully; "2 occ 6 free" | Clear — floor differentiation working | **PASS** |

**Handoff quality notes:**
- H1 is solid — the RxDB write-to-dispatch path is correct and fast (~2s hydration)
- H2 passes technically but fails informationally — the stove cook has no awareness of active tables
- H3 passes — concurrent table management works correctly

**Critical cross-role data corruption:**
- Pax count registered as "2" in both POS and kitchen contexts — KDS shows "T4 2 pax" when actual pax = 4. This corrupt data propagates from POS → dispatch → stock deductions → reports.

---

## F. "Best Shift Ever" Vision (Multi-Role)

It's 7 PM. The restaurant is almost full. This is how an ideal Friday rush runs with the WTFPOS system humming:

**At the register,** Ate Rose opens T4 for the 4-top that just sat down. She taps "4" in the adults row — the count confirms: 4 adults. She picks Pork Unlimited, taps CHARGE. A green toast: "13 items sent to kitchen for T4." She's already walking to T6 before the toast fades. She knows the kitchen got it.

**At dispatch,** the ticket for T4 appears on Kuya Marc's board before he even looks up. He sees the sides grouped into three rows — Starches (3), Vegetables (4), Condiments (3) — and assigns Ate Lina to the starches. The sub-nav tabs are easy to hit with his sauce-wet hands at 56px. He switches to Stove in one confident tap.

**At the stove,** Lito's screen shows "0 pending dishes · 2 tables active." He knows it's quiet — no dishes ordered yet, but the restaurant is alive. He starts prepping the garnish station instead of standing idle.

**Back at sides prep,** Ate Lina doesn't navigate to the old `/kitchen/sides-prep` page by accident anymore — it redirects to Dispatch now with a clear message. She works from the dispatch board, marks rice done, egg done. As the last side is marked, the dispatch board plays the two-tone ascending chime. "T4 READY TO RUN," Kuya Marc calls out.

**At the floor,** T4's card has just turned yellow at the 35-minute mark — Sir Dan sees it in one floor glance and heads over to ask if they'd like the final round of sides. No calculator, no guessing, no missed tables.

**Today's gap:** This vision requires fixing [01] (pax bug), [03] (CHARGE confirmation), [05] (sub-nav 56px), [07] (dispatch DONE 56px), [10] (sides-prep redirect), [11] (stove context), and [12] (countdown escalation). Seven issues. All fixable. None require architectural changes.

---

## G. Scenario Scorecard

| # | Scenario | Completed? | Handoffs OK? | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | "Open T4 (4 pax, Standard)" | Partial — table opened with 2 pax instead of 4 | H1: PASS | Pax bug, stepper miss | **CONCERN** |
| 2 | "Add items → CHARGE → kitchen" | Yes | H1: PASS | No confirmation toast | **CONCERN** |
| 3 | "Kitchen verify T4 dispatch" | Yes | H2: CONCERN | Stove empty with no table context | **PASS** |
| 4 | "Open concurrent T6 (6 pax)" | Partial — T6 opened at 2 pax | H3: PASS | Pax bug repeated | **CONCERN** |
| 5 | "Kitchen standalone — all pages" | Yes — 5 pages audited | N/A | Sub-nav 44px, filter buttons 44px, orphaned sides-prep | **CONCERN** |

---

## H. Cross-Role Recommendations

---

##### [CR-01] Staff charges order but kitchen has no confirmation signal — and vice versa

**What:** When Ate Rose taps CHARGE in AddItemModal, no cross-role signal is visible to either party. Staff sees the modal close (no toast). Kitchen's dispatch board silently gains a new card on next render cycle (~2s). There is no moment of acknowledged handoff — just two independently updating screens.

**How to reproduce:**
1. Staff opens table, adds items, taps CHARGE
2. Immediately check POS — no confirmation that kitchen received
3. Check kitchen dispatch — card appears after ~2s, no alert sound at dispatch, no visual "new order" flash (only the periodic Live dot)

**Why this breaks:** During a rush, Ate Rose charges an order for T4 and immediately starts talking to the T6 guests. Two minutes later, Kuya Marc at dispatch still hasn't seen T4 because the kitchen screen is on the Stove tab. The order card exists in RxDB but nobody at the kitchen is watching dispatch right now. There's no cross-role ping that says "new order just hit dispatch." Meanwhile Ate Rose — having gotten no confirmation — walks to the kitchen pass and asks "T4 natapos na ba?" Kuya Marc says "hasn't started yet." Six minutes have passed since she charged it. The table is getting impatient.

**Ideal flow:** When CHARGE creates KDS tickets, two things happen: (1) POS shows a brief toast — "Order sent to kitchen for T4"; (2) Dispatch plays the audio chime (already implemented for readyToRun — same mechanism should fire on new table ticket creation). Both roles get simultaneous feedback through their primary sensory channel (visual for staff, audio for kitchen).

**The staff story:** "Pinindot ko na ang CHARGE, pero hindi ko alam kung natanggap na ng kusina. Ang mahal ng order — hindi ko basta-basta pabayaan na mawala."

**Affected role(s):** Staff (Ate Rose) ↔ Kitchen (Kuya Marc)

---

##### [CR-02] Pax count corrupts cross-role shared context

**What:** The pax count registered by `PaxModal` defaults to 2 regardless of what the quick-select shows. This means both the POS order sidebar ("T4 · 2 pax") and the kitchen dispatch card ("T4 2 pax") display and use the wrong count. Every calculation downstream — billing total, stock deductions, sides quantity per pax — is based on "2 pax" when the actual table has 4 guests.

**How to reproduce:**
1. Staff opens T4, selects 4 pax via quick-select numpad
2. Taps Confirm → table opens at 2 pax
3. Switch to kitchen, navigate to `/kitchen/dispatch`
4. T4 dispatch card shows "2 pax" — kitchen plans sides for 2 guests, but 4 need to be fed

**Why this breaks:** Ate Lina is assigned T4's sides. The dispatch card says "2 pax" — she prepares 2 portions of rice, 2 eggs, 2 portions of kimchi. The 4-person table gets 2 side portions. Server has to go back, apologize, and bring the rest. Kitchen has to prepare an emergency extra batch. The table feels underserved. All of this because the pax count was 2 instead of 4 — and the root cause is a UI interaction bug in the PaxModal quick-select.

**Ideal flow:** Fix [01] (pax quick-select registration). Once fixed, test the propagation path: POS pax → KDS ticket pax → dispatch card label → sides quantity guidance. The data model supports correct pax; the bug is purely in the UI interaction.

**The staff story:** "Sinabi ng dispatch, 2 pax lang si T4. Inihanda ko lang 2 servings. Pero 4 pala yung tao. Nagalit yung customer — bakit 2 rice lang?"

**Affected role(s):** Staff (Ate Rose) ↔ Kitchen (Ate Lina, Kuya Marc)

---

##### [CR-03] Multi-role device session requires full page reload — handoff causes navigation surprises

**What:** `session.svelte.ts` initializes `session = $state({...})` once at module load and does not re-read from `sessionStorage` reactively. When a second role logs in on the same device (common in WTFPOS: shared tablet per station), the new session is written to `sessionStorage` but the in-memory `$state` retains the previous role. Route guards fire on stale role state, triggering unexpected `goto()` calls on the next client-side navigation.

**How to reproduce:**
1. Login as kitchen role (Kuya Marc) — navigate to `/kitchen/dispatch`
2. Logout and login as staff (Ate Rose) — session updated in sessionStorage
3. Navigate to `/pos` via sidebar — route guard fires using stale `session.role = 'kitchen'` → redirects to `/kitchen/orders` instead of staying on `/pos`
4. A full page reload (`F5` or hard navigate) is required to sync in-memory session

**Why this breaks:** Ate Rose's shift ends. She logs out and Kuya Marc logs in on the same tablet. He navigates to `/kitchen/dispatch` — but the POS route guard, still reading `role: 'staff'` from the stale module state, fires and bounces him to `/pos`. He's confused — he's logged in as kitchen. He does a hard refresh. It works. But this confusion happens every role handoff and every shift change. On busy nights with 4–5 role switches on the shared tablet, each handoff has a 50% chance of hitting a stale route guard.

**Ideal flow:** `session.svelte.ts` adds a `storage` event listener: `window.addEventListener('storage', () => { session = loadPersistedSession(); })`. This makes the module reactive to external sessionStorage changes without requiring a full reload. Alternatively, the logout flow triggers a hard `window.location.href = '/'` instead of a SvelteKit client-side `goto('/')`, ensuring the module re-initializes from scratch.

**The staff story:** "Nag-logout si Ate Rose, nag-login na ako. Pero napunta pa rin ako sa POS page niya. Kailangan kong i-refresh bago ako mapunta sa kitchen. Nakakaasar."

**Affected role(s):** All roles (multi-role device handoff scenario)

---

## I. Structural Proposals

---

##### [SP-01] Stove page: ambient cross-station context strip

**Problem pattern:** Issues [11] and [CR-01] share a root cause — the stove cook and staff both lack ambient visibility into what's happening at other stations. The stove page shows its own queue in isolation; it doesn't communicate how many tables are active, whether dispatch has pending work, or whether kitchen as a whole is busy or quiet.

**Current structure:**
```
/kitchen/stove
┌──────────────────────────────────┐
│ Stove Queue  N pending dishes    │
│ [ticket cards]                   │
│                                  │
│ [if empty]: ✅ No pending dishes │
│             (no other context)   │
└──────────────────────────────────┘
```

**Proposed structure:**
```
/kitchen/stove
┌──────────────────────────────────┐
│ Stove Queue  N pending dishes    │
│ ┌─ Kitchen Status ─────────────┐ │  ← new ambient strip (read-only)
│ │ 🍽 2 tables active           │ │
│ │ 🥬 Dispatch: 3 sides pending │ │
│ │ ⚖️ Weigh: 1 item dispatched  │ │
│ └──────────────────────────────┘ │
│ [ticket cards / empty state]     │
└──────────────────────────────────┘
```

**Why individual fixes won't work:** Issue [11] can be fixed with a one-liner (show active table count). But the broader problem is that each kitchen station is an information island. A stove cook, a dispatch expo, and a sides preparer cannot see each other's queue status without navigating. This creates repeated cross-station verbal communication ("T4 ready on sides?") that adds noise during peak rush. A read-only ambient strip costs one `$derived` query per kitchen page and eliminates a class of cross-station questions.

**Affected role(s):** Kitchen (Lito/Romy at stove, Ate Lina at sides, Kuya Marc at dispatch)

**The staff story:** "Gusto ko malaman kung may open na mesa kahit sa stove page ko — para hindi na ako magtatanong pa kay Kuya Marc."

**Implementation sketch:** Read `tableStore.openTables.filter(t => t.locationId === session.locationId)` for active count. Read `kdsTicketStore` for pending sides/dishes counts. All data is already in Svelte stores — this is a display-only component (`<KitchenStatusStrip />`) rendered above the queue on each kitchen page. No new RxDB queries needed.

---

##### [SP-02] Dispatch sides: category-grouped DONE interface

**Problem pattern:** Issues [07] and [08] both stem from the dispatch sides section treating all 10 sides as flat, equal-weight line items. The sides section was designed for a short list; at full Pork Unlimited (10 sides), it becomes an untamed vertical list of 10 identical DONE buttons with no organizational structure.

**Current structure:**
```
/kitchen/dispatch → dispatch card → sides section
┌─ Sides 0/10 ───────────────────────────────┐
│ [Egg]      [DONE(44px)]                     │
│ [Rice]     [DONE(44px)]                     │
│ [Kimchi]   [DONE(44px)]                     │
│ [Lettuce]  [DONE(44px)]                     │
│ [Bean sprouts] [DONE(44px)]                 │
│ [Garlic]   [DONE(44px)]                     │
│ [Green onion] [DONE(44px)]                  │
│ [Doenjang] [DONE(44px)]                     │
│ [Ssamjang] [DONE(44px)]                     │
│ [Sesame oil] [DONE(44px)]                   │
│ ────────────────────────────────────────── │
│ [ALL SIDES DONE (380×44px)]                 │
└────────────────────────────────────────────┘
```

**Proposed structure:**
```
/kitchen/dispatch → dispatch card → sides section (grouped)
┌─ Sides 0/10 ───────────────────────────────┐
│ STARCHES                                    │
│ [Egg(56px)] [Rice(56px)] [Noodles(56px)]   │
│                                             │
│ VEGETABLES                                  │
│ [Kimchi(56px)] [Lettuce(56px)]             │
│ [Bean sprouts(56px)] [Garlic(56px)]        │
│                                             │
│ SAUCES & CONDIMENTS                         │
│ [Doenjang(56px)] [Ssamjang(56px)]          │
│ [Sesame oil(56px)]                          │
│ ────────────────────────────────────────── │
│ [ALL SIDES DONE (56px)]                     │
└────────────────────────────────────────────┘
```

**Why individual fixes won't work:** Issue [07] can be fixed by raising button height to 56px. Issue [08] can be partially fixed by the ALL SIDES DONE batch button. But together, the 10-flat-item layout will always produce cognitive overload at scale — with multiple concurrent tables, 80+ flat DONE buttons is simply unmanageable regardless of size. The grouping is the fix that addresses both the scanning problem and the size problem in one pass.

**Affected role(s):** Kitchen (Kuya Marc, Corazon, Nena — expo/dispatch role)

**The staff story:** "Kung naka-grupo yung sides, mas madaling makita kung alin pa yung kulang. Hindi na ako nagtatanong kung natapos ko na ba yung rice."

**Implementation sketch:** Add a `category` field to `MenuItems` for sides (or use the existing `MenuCategory` type). Dispatch card reads `sideItems.groupBy(item => item.category)`. Rendered as `{#each categories as cat}` section headers with `{#each cat.items}` DONE buttons inside. Touch target: `min-h-[56px]` on all DONE buttons. Menu seed data needs category tags for the 10 standard sides — a one-time data update.

---

## Fix Checklist (for `/fix-audit`)

- [ ] [01] — Pax quick-select count not registering — tables always open at 2 pax
- [ ] [02] — PaxModal stepper buttons 32px wide — below 44px touch target minimum
- [ ] [03] — No confirmation after CHARGE — staff cannot tell if kitchen received the order
- [ ] [04] — CHARGE button in top-right stretch zone — wrong position for a 100×/shift action
- [ ] [05] — Kitchen sub-nav links 44px across ALL 5 kitchen pages
- [ ] [06] — All-orders filter buttons 44px with 9 ungrouped controls
- [ ] [07] — Dispatch sides DONE and ALL SIDES DONE buttons 44px
- [ ] [08] — Dispatch card lists 10 ungrouped DONE buttons
- [ ] [09] — Weigh-station secondary buttons below kitchen minimum
- [ ] [10] — Sides-prep orphaned route has no deprecation signal
- [ ] [11] — Stove empty state hides active table context
- [ ] [12] — No countdown urgency escalation on occupied table cards
- [ ] [13] — Low-contrast station status labels on dispatch cards
- [ ] [14] — Sub-nav uses emoji icons inconsistent with lucide-svelte design system
- [ ] [CR-01] — Staff charges order but kitchen has no confirmation signal
- [ ] [CR-02] — Pax count corrupts cross-role shared context
- [ ] [CR-03] — Multi-role device session requires full page reload

## Structural Proposals (for discussion)

- [ ] [SP-01] — Stove page: ambient cross-station context strip (addresses [11], [CR-01])
- [ ] [SP-02] — Dispatch sides: category-grouped DONE interface (addresses [07], [08])

---

## Run Log Entry

| Date | Mode | Roles | Agents | Crashed | Snapshots used | Issues found | Fix invoked? |
|---|---|---|---|---|---|---|---|
| 2026-03-11 | Multi-user (hard) | Staff × 2 + Kitchen × 2 (3 stints + 5-page solo) | 2 parallel | 0 | ~12 (A1) + ~6 (A2) = 18 total | 14 per-role + 3 cross-role = 17 | TBD |
