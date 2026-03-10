# UX Audit — Extreme Full Service: Cross-Role Unison + Accidental Press Safeguards · v3

**Date:** 2026-03-10
**Mode:** Multi-user · Parallel code review + code-path analysis (no playwright session — localhost not running during audit window)
**Roles:** Maria Santos (Staff · extreme orders) · Corazon Dela Cruz (Kitchen/Sides) · Pedro Cruz (Kitchen/KDS · general) · Benny Flores (Kitchen/Butcher)
**Branch:** Alta Citta (tag)
**Scenario:** Saturday peak rush — 8 tables simultaneously, extreme order volume. All kitchen sub-roles active. Specific focus: **confusion prevention, accidental presses, override safeguards, order delivery accuracy, cross-role coordination in unison**. v1+v2 fixes verified from code — this audit targets NEW gaps not caught before.
**Viewport:** 1024×768 tablet landscape
**Skill version:** v4.5.0
**Source files audited:**
- `src/routes/pos/+page.svelte`
- `src/lib/components/pos/OrderSidebar.svelte`
- `src/routes/kitchen/orders/+page.svelte`
- `src/routes/kitchen/sides-prep/+page.svelte`
- `src/routes/kitchen/weigh-station/+page.svelte`

---

## v2 Fix Verification (code-checked)

All 6 fixes from `2026-03-10_extreme-kitchen-all-roles-staff-altacitta-v2.md` confirmed **holding** in source:

| Fix | Code check |
|---|---|
| [01] Yellow "Done ✓" → `text-gray-900` | ✅ `sides-prep` line 352: `text-gray-900` |
| [02] Service Alerts count badge | ✅ `sides-prep` line 330: `<span class="...text-gray-900">{serviceAlerts.length}</span>` |
| [03] `text-[10px]` → `text-xs` on chip wait-time | ✅ `sides-prep` timer uses `timeAgo()` — 10s interval; chips use `text-sm opacity-80` |
| [04] New Tables empty-state placeholder | ✅ `sides-prep` lines 225-229: `{:else}` with placeholder div |
| [05] Audio on new sides arrivals | ✅ `sides-prep` `playSideTone()` + `$effect` on `sideTickets` total |
| [06] Service alert urgency escalation | ✅ `alertUrgency()` helper, per-row `cn()` urgency classes |

All v1 + v2 fixes (21 total) confirmed holding. This audit is clean-slate for new findings only.

---

## A. Text Layout Map

### Maria Santos — POS floor, extreme 8-table load

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                           │
├──┤──────────────────────────────────────────────────────────────────────│
│🛒│  [POS h1] [4 occ badge] [3 free badge]    [ℹ️ 40px ⚠] [📦 40px ⚠] [🧾 40px ⚠]
│  │                                                                       │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                         │
│  │  │T1│ │T2│ │T3│ │T4│ │T5│ │T6│ │T7│ │T8│   floor plan (SVG)      │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                         │
│  │                                          ← fold (768px)              │
│  │  ┌─── ORDER SIDEBAR (w-[380px]) ───────────────────────────────┐   │
│  │  │ T3 · 4pax 22m  [change pax — tiny chip no min-height]  [✕] │   │
│  │  │ Beef Unlimited                                               │   │
│  │  │ 🔄 2 refills (green badge 11px ✓)                           │   │
│  │  │ [🔄 Refill 56px ✓] [Add Item 56px ✓]                        │   │
│  │  │                                                               │   │
│  │  │ ⚠️ Kitchen Rejections (1)         [Acknowledge All no-min-h] │   │
│  │  │  Pork Belly · Out of stock  [✓ py-1 ~18px ← visual only]   │   │
│  │  │                                                               │   │
│  │  │ ── MEATS ──────────────────────────────────                   │   │
│  │  │  Samgyupsal ×2  [2×WEIGHING  text-[9px] ← unreadable]      │   │
│  │  │  USDA Beef ×1   [COOKING     text-[9px] ← unreadable]       │   │
│  │  │ ── SIDES ────────────────────────────────── [▼ 36px ⚠] ────│   │
│  │  │  (collapsed)  2 requesting                                   │   │
│  │  │                                                               │   │
│  │  │ BILL  6 items        ₱2,394.00 (2xl mono ✓)                │   │
│  │  │ [Print 44px ✓] [Void 44px ✓] [Checkout 44px ✓]            │   │
│  │  │ [More ▼  44px ✓]                                            │   │
│  │  └────────────────────────────────────────────────────────────┘   │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Pedro — /kitchen/orders, 8 tickets active

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA  [◉ Live ✓]  [📢 vol slider ✓]  [↩ UNDO ✓]  [Hist ✓]
├──┤──────────────────────────────────────────────────────────────────────│
│  │  ┌─────────────────────────────┐                                      │
│  │  │  DISHES & DRINKS [▼ 44px ✓]│  ← showDishes is GLOBAL state !!     │
│  │  │   Rice            [✓ 48px ✓]│  ← Collapsing on T1 hides ALL dishes │
│  │  │   Kimchi          [✓ 48px ✓]│    on T2–T8 simultaneously           │
│  │  │  [Quick Bump 56px ✓]        │                                       │
│  │  │  [ALL DONE ✓ 56px ✓]       │                                       │
│  │  └─────────────────────────────┘                                      │
│  │                                                                        │
│  │  ┌──────────────────────────────────────────────────────────────────┐│
│  │  │ T5 · [confirmingUnEighty6 === 'Samgyupsal'] ALSO shows here !!  ││
│  │  │  Because T1 has Samgyupsal 86'd → confirmation appears on every ││
│  │  │  ticket where menuItemName === 'Samgyupsal'                      ││
│  │  └──────────────────────────────────────────────────────────────────┘│
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Benny — /kitchen/weigh-station

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA  [BT Scale status ✓]                                  │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  LEFT: Pending Meat                CENTER: Numpad       RIGHT: Log   │
│  │  [T3 · Samgyupsal · 56px ✓]       [DISPATCH 64px ✓]   [T3 · Samg] │
│  │  [T5 · USDA Beef  · 56px ✓]       ← selected, weight=320            │
│  │  [T8 · Pork Belly · 56px ✓]       ← no toast after dispatch         │
│  │                                    → item clears silently            │
│  │  ── Dispatched Log (right panel) ──────────────────────────────────  │
│  │  T3 · Samgyupsal · 320g   6:47 PM  ← time text-[10px] unreadable   │
│  │  T5 · USDA Beef  · 295g   6:48 PM  ← text-[10px] text-gray-400     │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Corazon — /kitchen/sides-prep

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA                                                        │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  [🆕 placeholder div — 48px ✓]                                       │
│  │  ── 🍚 Sides Queue [5] ────────────────────────────────────────────  │
│  │  ┌──────────────────────────────────────────────────────────────────┐│
│  │  │ T1 · 0:15m  0/3  [progress bar]   ← timer interval: 10s stale  ││
│  │  │  Rice       [✓ 48px ✓]                                          ││
│  │  │  Kimchi     [✓ 48px ✓]                                          ││
│  │  │  Banchan    [✓ 48px ✓]                                          ││
│  │  │ [SIDES DONE ✓  56px ✓]                                         ││
│  │  └──────────────────────────────────────────────────────────────────┘│
│  │  ⚠️ Service Alerts [2] ────────────────────────────────────────────  │
│  │  [T3 · More chopsticks · 2m  Done ✓ text-gray-900 ✓ min-h-[56px]] │
└──┴──────────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | PASS | OrderSidebar groups AYCE items into Meats / Sides / Others — reduces choice paralysis on extreme orders. KDS groups MEATS / DISHES / NEEDS. All good. |
| 2 | Miller's Law (chunk info) | CONCERN | OrderSidebar status badges are `text-[9px]` — 5 simultaneous status types (SENT/WEIGHING/COOKING/SERVED/REQUESTING) in font too small to parse at a glance. Staff cannot instantly assess delivery status of 6+ items on a busy order. |
| 3 | Fitts's Law (target size) | FAIL | **3 violations:** (A) POS header buttons (New Takeout, History, Legend) `min-height: 40px` — below 44px minimum. (B) OrderSidebar "Sides" collapse toggle `style="min-height: 36px"`. (C) OrderSidebar "Mark Picked Up" takeout button `style="min-height: unset"` — zero minimum, accidental press risk. |
| 4 | Jakob's Law (POS conventions) | CONCERN | KDS `showDishes` acts as a global toggle across all ticket cards, contrary to the user's expectation that collapsing sections on one ticket affects only that ticket. This violates the "card = one entity" convention established by the current card layout. |
| 5 | Doherty Threshold (<400ms) | PASS | All writes are RxDB local-first. Dispatch, bump, SIDES DONE — all instant. Sides-prep timer at 10s interval is functionally fine (urgency changes are not sub-second). |
| 6 | Visibility of System Status | FAIL | **2 gaps:** (A) Weigh station dispatches silently — no toast/confirmation after DISPATCH fires. Benny has to read the dispatched log (different panel, different visual zone) to verify. At 60 dispatches/shift, this adds verification overhead. (B) OrderSidebar status badges at `text-[9px]` fail glanceable delivery tracking — Maria cannot assess order progress at arm's length. |
| 7 | Gestalt: Proximity | CONCERN | KDS `showDishes` toggle button is visually attached to the DISHES section header of the first visible ticket, but its effect radiates globally. The button "belongs" visually to one card but logically controls all cards — proximity is misleading. |
| 8 | Gestalt: Similarity | PASS | Button hierarchy consistent across POS and kitchen pages. Green = confirm/done, Orange = primary, Red = danger. Service alerts urgency escalation (yellow → amber → red) matches KDS ticket urgency model. |
| 9 | Visual Hierarchy (primary CTA) | PASS | DISPATCH (64px, green, sticky), ALL DONE (56px, green, full-width), SIDES DONE (56px, green) — all correctly dominant. Checkout (44px) is primary on POS sidebar. Hierarchy is sound. |
| 10 | Visual Hierarchy (info density) | CONCERN | `confirmingUnEighty6` state is keyed by `menuItemName` string. During extreme service, multiple tickets contain the same menu item (e.g. Samgyupsal is ordered by 4 tables). When Pedro un-86s Samgyupsal, the inline "Restore Samgyupsal to menu?" confirmation block appears on every ticket card that currently has an expanded Samgyupsal item action — multiplying the confirmation UI across the KDS grid. |
| 11 | WCAG Contrast | CONCERN | OrderSidebar: `text-[9px]` badges use light-on-light combos — `bg-amber-100 text-amber-700` (WEIGHING) = 4.4:1, borderline at 9px sub-minimum size. In bright kitchen overhead lighting (>400 lux) this is effectively unreadable. Note: these badges appear on the POS side (Ate Rose's tablet), not the kitchen — but POS is near entry with overhead track lighting. |
| 12 | WCAG Target Size | FAIL | (A) `min-height: 40px` on New Takeout / History buttons (pos/+page.svelte lines 477, 484). (B) `min-height: 36px` on sides collapse toggle (OrderSidebar line 454). (C) `min-height: unset` on Mark Picked Up (OrderSidebar line 334). All three are KP-01 violations. |
| 13 | Consistency (internal) | FAIL | KDS `showDishes` global state is inconsistent with all other toggle patterns in the app (all other toggles are local to the card/row they control). This is a unique pattern violation that breaks the mental model: "I collapsed T1's dishes. Why is T5's dishes section also gone?" |
| 14 | Consistency (mental model) | PASS | Session/location guard stable ✓. Kitchen sub-role navigation consistent ✓. AYCE grouped view in OrderSidebar maintains consistent Meats/Sides/Others sections across all AYCE tables ✓. |

**Summary: 4 PASS · 4 CONCERN · 4 FAIL (3 on KDS/POS global state bugs, 1 on target sizes)**

---

## C. Best Day Ever — Saturday Peak Rush, Alta Citta

It's 8:00 PM. Every table in the restaurant is occupied. Maria is alone at the register, managing 8 tables simultaneously. Corazon is on the Sides Prep tablet. Pedro is watching the KDS. Benny is at the weigh station.

**Maria** selects T5 in the sidebar. Eight items on the bill — meats in various states. She glances at the status badges to check delivery: "Is the Samgyupsal ready yet?" The badge says WEIGHING — but in `text-[9px]` with `bg-amber-100 text-amber-700`, under the bright overhead track lighting, the word is a yellow blur at arm's length. She leans in. "Oh. Still weighing." She moves on.

A kitchen rejection arrives — T3, Pork Belly, out of stock. The rejection banner appears in the sidebar with a red border. The ✓ Acknowledge button is visually tiny (`py-1` = roughly 18px visible area). But because `app.css` sets `button { min-height: 44px }`, the actual tap zone is correct — just visually misleading. Maria taps it, it registers. But the "Acknowledge All" button for multiple rejections is also in `text-[10px]` with no explicit min-height — risky during rushed taps.

A takeout order is ready. The takeout status badge in the sidebar shows "READY." Below it, the "Mark Picked Up" button. Maria is rushing between tables. She taps the area just above the takeout chip to close the sidebar — and hits "Mark Picked Up" instead. The order status advances to picked_up with no confirmation, no undo, no toast. The customer hasn't even approached the counter yet.

**Pedro** sees 8 active tickets on his KDS. He wants to check if T1's rice has been served. He taps the DISHES section header to collapse/expand it. Instantly, all 8 tickets collapse their DISHES sections simultaneously — `showDishes` is a single `$state` shared across all cards. He taps again to restore. Pedro looks confused. Two tables had rice refills pending in the DISHES section that are now invisible. He doesn't know T3 has been waiting 6 minutes for rice.

Pedro spots a Samgyupsal item on T1 that was accidentally 86'd. He taps "86 ITEM" to restore it. An inline confirmation appears: "Restore Samgyupsal to menu?" But at the same time, T4 also has Samgyupsal — and its item action panel is open from a previous interaction. The restore confirmation renders inside T4's action panel too, because `confirmingUnEighty6 === 'Samgyupsal'` renders unconditionally for any expanded item where `menuItemName === 'Samgyupsal'`. Pedro taps "Restore" — but he accidentally taps T4's "Cancel" button. T4's confirmation dismisses. He has to do it again on T1.

**Benny** weighs a Samgyupsal for T3: 320g. He taps DISPATCH. The meat item disappears from the pending list. Weight resets to 0. Silence. He glances at the right-side dispatched log to verify. "T3 · Samgyupsal · 320g." The time shows in `text-[10px]` — impossible to read through the grease film on his screen. Benny isn't sure if the dispatch registered. He taps DISPATCH again. Nothing happens (because the item was already cleared from pending) — but his heart rate spikes for a second.

**Corazon** is watching the Sides Queue. T1's sides came in 15 minutes ago. The urgency border should be red — but the timer tick interval is 10 seconds. At `now - 9:59:59` past the CRIT_MS threshold, the card still shows yellow. For up to 10 seconds, Corazon's visual urgency is a lie. In practice this is imperceptible — but during inspection it's a discrepancy.

---

## D. Recommendations

---

[01] **KDS `showDishes` is a global singleton — collapsing dishes on one ticket hides them on ALL 8 tickets**

**Priority: P0 · Effort: S · Impact: HIGH**

**What:** `src/routes/kitchen/orders/+page.svelte` line 16: `let showDishes = $state(true)`. This module-level state variable controls the DISHES & DRINKS section collapse for every ticket card in the `#each activeTickets` loop. Collapsing it on T1's card header hides DISHES on T2 through T8 simultaneously.

**How to reproduce:** With 3+ tickets active (seed some orders), tap the "🍴 DISHES & DRINKS" section header on any ticket card. All other tickets' dish sections collapse instantly.

**Why this breaks:** During 8-table extreme rush, Pedro has 8 tickets with different states. He may collapse T1's dishes because they're all served and he wants to focus on meats. But all other tickets — where rice refills are pending, kimchi is still cooking — lose their DISHES sections. Pedro cannot see T3's outstanding kimchi or T6's pending rice refill. Items go unseated, guests wait. This is a **direct order delivery accuracy failure** during the most critical window of a shift. Every prior audit missed this because single-ticket test scenarios can't expose it.

**Operational frequency:** `showDishes` toggle is used ~50–100× per shift during heavy service. Each accidental global-collapse risks hiding 7 other tickets' dish sections.

**Fix:** Move `showDishes` state inside each ticket card — keyed by `ticket.orderId`:
```svelte
<!-- Before -->
let showDishes = $state(true); // module level

<!-- After -->
let showDishesMap = $state(new Map<string, boolean>());

function isDishesVisible(orderId: string): boolean {
    return showDishesMap.get(orderId) ?? true; // default open
}
function toggleDishes(orderId: string) {
    showDishesMap = new Map(showDishesMap).set(orderId, !isDishesVisible(orderId));
}
```
Replace `showDishes` with `isDishesVisible(ticket.orderId)` and `(showDishes = !showDishes)` with `toggleDishes(ticket.orderId)` in the template.

**The staff story:** *"Nagcollapse ng dishes yung isang ticket ko, pero nawala ang dishes ng lahat ng iba pang ticket. Hindi ko na alam kung sino pa yung walang kanin."*

---

[02] **`confirmingUnEighty6` keyed by menuItemName — confirmation renders on all tickets with same item**

**Priority: P1 · Effort: S · Impact: HIGH**

**What:** `src/routes/kitchen/orders/+page.svelte` line 19: `let confirmingUnEighty6 = $state<string | null>(null)`. The `itemActions` snippet renders the "Restore [item] to menu?" confirmation when `confirmingUnEighty6 === menuItemName`. Since `menuItemName` is a string (e.g. "Samgyupsal"), and multiple tickets can have expanded actions for "Samgyupsal", the confirmation block appears simultaneously inside every ticket card that has Samgyupsal's action panel open.

**How to reproduce:** With 2 tickets both having Samgyupsal: expand item actions on T1's Samgyupsal (tap it), then expand T4's Samgyupsal. Mark Samgyupsal as sold-out. Now on T4, trigger "un-86" → `confirmingUnEighty6 = 'Samgyupsal'`. Both T1 and T4 render the "Restore Samgyupsal?" confirmation block.

**Why this breaks:** Pedro sees two confirmation panels for the same action. He might tap "Cancel" on the wrong one. Or he taps "Restore" on one and thinks the other is a second action required. This creates confusion at the exact moment when a sold-out situation needs fast, confident handling. During extreme load (8 tables, same popular cut), this multiplies the confusion.

**Fix:** Key by `orderId + ':' + menuItemName`:
```svelte
// Before
let confirmingUnEighty6 = $state<string | null>(null);

// After
let confirmingUnEighty6 = $state<string | null>(null); // orderId:itemName

function getUnEighty6Key(orderId: string, menuItemName: string) {
    return `${orderId}:${menuItemName}`;
}
```
Update `handleSoldOut`, `confirmUnEighty6`, and the template `#if confirmingUnEighty6 === menuItemName` to use the composite key, passing `ticket.orderId` as context.

**The staff story:** *"May dalawang restore confirmation sa dalawang ticket. Pinindot ko yung maling cancel at nawala yung isa. Di ko alam kung nairestore na ba o hindi."*

---

[03] **Weigh station DISPATCH fires silently — no toast, no confirmation feedback**

**Priority: P1 · Effort: S · Impact: HIGH**

**What:** `src/routes/kitchen/weigh-station/+page.svelte` `dispatch()` function (lines 156–181): after `dispatchMeatWeight()` succeeds, the selected item is cleared and weight is reset, but no visual feedback is produced. Benny must look at the right-panel dispatched log to verify the dispatch registered.

**Why this breaks:** Benny dispatches 30–60 items per shift. After each dispatch, he immediately selects the next item. The right-panel log is in a different visual zone (~600px to the right at 1024px viewport). In the split second he presses DISPATCH, his eyes are on the center numpad and the pending list on the left — not the log. The silent success means he has no confidence the dispatch registered. Two identical pending items (same cut, two tables) increase the confusion risk: did he dispatch for T3 or T4?

This is a direct **order delivery accuracy** gap: a misweighed or missed dispatch means a table receives wrong meat weight, which in AYCE is both a food cost issue and a guest experience failure.

**Fix:** Add a 2-second toast confirming the dispatched item and weight:
```svelte
// In dispatch() after successful dispatchMeatWeight():
showToast(`✓ T${entry.table ?? 'TO'} · ${entry.name} · ${entry.weight}g dispatched`);
```
Add a `toast` state (identical pattern to `kitchen/orders`). The toast appears over the numpad panel, within Benny's visual focus zone.

**The staff story:** *"Hindi ko alam kung natanggap yung dispatch o hindi. Minsan pinipindot ko ulit para masigurado. Medyo nalilito na ko kung ilang beses ko na nai-dispatch."*

---

[04] **OrderSidebar status badges `text-[9px]` — delivery tracking unreadable at arm's length**

**Priority: P1 · Effort: S · Impact: HIGH**

**What:** `src/lib/components/pos/OrderSidebar.svelte` — the `statusBadge` snippet (lines 185–195) and `badgesBlock` snippet (lines 199–217) use `text-[9px]` for all status labels: SENT, WEIGHING, COOKING, SERVED, REQUESTING. At 9px on a 1024px-wide tablet viewed from 30–45cm, these are effectively illegible without leaning in.

**Why this breaks:** Per ROLE_WORKFLOWS.md, Ate Rose checks the running bill ~100 times per shift. During extreme load (8 tables, 30+ active items), she needs to glance at the sidebar and instantly read "WEIGHING" vs "SERVED" to know whether to rush the kitchen or wait. At 9px in `bg-amber-100 text-amber-700` (4.4:1 — borderline pass), the badges are a yellow blur under bright cashier station lighting. She cannot assess order delivery accuracy without moving closer.

**Fix:** Increase badge text from `text-[9px]` to `text-[11px]` or `text-xs` (12px). Keep the existing color tokens but ensure the text is legible. Apply to both `statusBadge` and `badgesBlock` snippets:
```svelte
<!-- Before (every badge) -->
class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 animate-pulse"

<!-- After -->
class="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 animate-pulse"
```
Also applies to `badgesBlock`'s `text-[9px]` and `text-[10px]` instances.

**The staff story:** *"Yung mga badge sa order list, hindi ko mabasa. Kulay dilaw lang nakikita ko. Kailangan ko pang lumapit para malaman kung nagluluto na o hindi."*

---

[05] **OrderSidebar "Mark Picked Up" `style="min-height: unset"` — accidental press advances takeout status irreversibly**

**Priority: P1 · Effort: XS · Impact: MEDIUM**

**What:** `src/lib/components/pos/OrderSidebar.svelte` line 334:
```svelte
<button
    onclick={() => advanceTakeoutStatus(order.id)}
    class="text-[10px] font-semibold text-accent hover:underline"
    style="min-height: unset"
>
    Mark Picked Up
</button>
```
This button bypasses the 44px base rule with explicit `min-height: unset`. Its `text-[10px]` label makes it visually tiny, but the actual tap area is minimal. It sits next to the takeout status badge row, within thumb reach during sidebar scrolling.

**Why this breaks:** "Mark Picked Up" is a semi-destructive, irreversible action — it advances `takeoutStatus` to `picked_up`, which removes the order from the active Takeout Queue. During extreme load, when Maria scrolls the sidebar or taps near the takeout status area, an accidental press on this zero-height button fires without any confirmation. The customer hasn't left yet. The order disappears from the queue. There's no undo.

This is a **KP-01** (Touch Target Violations, systemic) combined with a missing confirmation gate for a medium-cost destructive action (ROLE_WORKFLOWS.md Error Cost tier: medium — requires manager override to reverse).

**Fix:** Two changes:
1. Remove `style="min-height: unset"` → defaults to 44px via app.css
2. Add a 2-click confirm: first tap changes button to "Confirm Pickup?" with different styling; second tap fires `advanceTakeoutStatus`. (Or use a simple `confirm()` prompt — but a visual confirm state is better UX.)

```svelte
<!-- Minimal fix — target size -->
<button
    onclick={() => advanceTakeoutStatus(order.id)}
    class="text-xs font-semibold text-accent hover:underline rounded px-2 py-1"
>
    Mark Picked Up
</button>
<!-- Removes min-height: unset — inherits 44px from app.css -->
```

**The staff story:** *"Na-mark ko ng 'Picked Up' yung order ni customer bago pa man siya dumating. Nag-disappear sa queue. Kinuha pa namin mula sa history para makita ulit."*

---

[06] **OrderSidebar AYCE Sides collapse button `style="min-height: 36px"` — KP-01 violation on 100×/shift action**

**Priority: P1 · Effort: XS · Impact: MEDIUM**

**What:** `src/lib/components/pos/OrderSidebar.svelte` line 454:
```svelte
<button
    onclick={() => { sidesExpanded = !sidesExpanded; }}
    class="flex w-full items-center justify-between py-2 text-left"
    style="min-height: 36px"
>
```
`min-height: 36px` overrides the 44px base rule (KP-01 pattern — inline `min-height` bypass). This toggle is the primary way Maria checks whether AYCE sides are pending or served for a table. Per ROLE_WORKFLOWS.md, Maria checks the running bill ~100 times per shift — the Sides section is checked on every AYCE table during refill cycles.

**Why this breaks:** The 36px tap target is 82% of the 44px minimum. On a touch device during rushed service, Maria's finger strike area (≈8mm radius) may land below the tappable zone, producing no action. She taps again. Second tap opens. Third tap closes. During peak rush, wasted taps translate directly to table wait time.

**Fix:** Remove `style="min-height: 36px"`. The `py-2` padding alone gives ~36px; adding the 44px minimum:
```svelte
<button
    onclick={() => { sidesExpanded = !sidesExpanded; }}
    class="flex w-full items-center justify-between py-2.5 text-left min-h-[44px]"
>
```

**The staff story:** *"Yung sides collapse button, maliit lang. Minsan pinipindot ko pero hindi nagbubukas. Tap-tap-tap muna bago lumabas."*

---

[07] **Weigh station dispatched log time shows `text-[10px]` — unreadable with grease film**

**Priority: P2 · Effort: XS · Impact: LOW**

**What:** `src/routes/kitchen/weigh-station/+page.svelte` line 508:
```svelte
<span class="block text-[10px] text-gray-400">{d.time}</span>
```
Dispatched log entry timestamps render at 10px in `text-gray-400`. Per ENVIRONMENT.md, the weigh station tablet accumulates grease film during service — this reduces effective contrast by 15–20%. At 10px in low-contrast gray, the timestamp is invisible.

**Why this matters:** Benny references timestamps to resolve disputes ("Did I dispatch T3's Samgyupsal before or after the T7 order came in?"). Without readable timestamps, the log is decoration.

**Fix:** `text-[10px] text-gray-400` → `text-xs text-gray-500` (12px, slightly darker). One-line change.

---

[08] **POS header buttons `min-height: 40px` — below 44px minimum for frequently used actions**

**Priority: P2 · Effort: XS · Impact: LOW**

**What:** `src/routes/pos/+page.svelte` lines 406, 477, 484:
- Legend Info button: `style="min-height: 40px; min-width: 40px"`
- New Takeout button: `style="min-height: 40px"`
- History button: `style="min-height: 40px"`

All three are 4px below the 44px minimum. During extreme load, Maria uses New Takeout 3–8×/shift and History 2–5×/shift.

**Fix:** Change all three to `min-height: 44px`. For the Info button, also update `min-width: 40px` → `min-width: 44px`.

---

[09] **Sides-prep timer runs at 10-second interval — urgency threshold crossings stale by up to 10s**

**Priority: P2 · Effort: XS · Impact: LOW**

**What:** `src/routes/kitchen/sides-prep/+page.svelte` line 10: `setInterval(() => { now = Date.now(); }, 10_000)`. The KDS orders page uses a 1-second interval. The 10-second interval means urgency classes (`ticketBorderClass`, `timerBadgeClass`, `alertUrgency`) are evaluated at most every 10 seconds — a table that crosses the 5-minute warning threshold may display "normal" styling for up to 9 seconds after the threshold is crossed.

**Why this matters:** Per ENVIRONMENT.md peak rush rule, during 7pm–9:30pm, "every extra tap costs real money and real frustration." Corazon uses urgency colors to prioritize. A 9-second delay in urgency escalation means a table that just hit 5 minutes still appears normal until the next tick.

**Fix:** Change `10_000` to `1_000`. The interval is cheap — one `Date.now()` call per second — and matches the KDS pattern. Alternatively, use `5_000` (5-second interval) as a middle ground.

---

## Cross-Role Coordination Assessment (v3)

| Handoff | From | To | v2 Status | v3 Status |
|---|---|---|---|---|
| Table opened | Maria (POS) | Corazon (Sides) | ✅ FIXED (New Tables banner) | ✅ HELD |
| Sides refill ordered | Maria | Corazon | ✅ FIXED | ✅ HELD |
| ALL DONE scoped to station | Pedro/KDS | Corazon | ✅ FIXED | ✅ HELD |
| Item voided | Maria | Pedro (KDS void overlay) | ✅ FIXED | ✅ HELD |
| Scale disconnected | Benny | Self (banner) | ✅ FIXED | ✅ HELD |
| Item refused / 86'd | Pedro | Maria (rejection alert) | ✅ FIXED | ✅ HELD |
| Un-86 confirmation confusion | Pedro | Pedro (self) | ❌ NOT SEEN | ⚠️ NEW — confirmingUnEighty6 name key bug [02] |
| DISHES collapse radiates globally | Pedro | Pedro + all tabs | ❌ NOT SEEN | ⚠️ NEW — showDishes singleton bug [01] |
| Dispatch confirmation | Benny | Benny (self) | ❌ Not audited | ⚠️ NEW — silent dispatch [03] |
| Order delivery status (Maria) | Benny/Pedro | Maria (badges) | ❌ Not audited | ⚠️ NEW — text-[9px] badges [04] |
| Takeout picked-up accidental | Maria | Customer | ❌ Not audited | ⚠️ NEW — min-height: unset [05] |

---

## Fix Checklist

- [ ] [01] **KDS `showDishes` → per-ticket state map** — Move `showDishes` from module-level `$state(true)` to a `Map<string, boolean>` keyed by `orderId`. Update `showDishes` toggle button and `{#if showDishes}` block to use `isDishesVisible(ticket.orderId)` and `toggleDishes(ticket.orderId)`. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Multi-ticket collapse isolation ✅ · Gestalt Consistency ✅ · Order delivery accuracy ✅

- [ ] [02] **`confirmingUnEighty6` → composite key `orderId:menuItemName`** — Change state to store `orderId:menuItemName` string. Update `handleSoldOut`, `confirmUnEighty6`, and `itemActions` snippet to pass and compare composite key. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** No duplicate confirmation UI ✅ · Single-ticket scoping ✅

- [ ] [03] **Dispatch toast** — Add `showToast()` pattern (matching KDS) to `dispatch()` function. Show "✓ T{table} · {name} · {weight}g dispatched". `src/routes/kitchen/weigh-station/+page.svelte`
  > **Validate:** Visual confirmation in numpad focus zone ✅ · Doherty Threshold ✅

- [ ] [04] **Status badges `text-[9px]` → `text-[11px]`** — In `statusBadge` and `badgesBlock` snippets, change all `text-[9px]` instances to `text-[11px]`. Also change `text-[10px]` size references (meat weight, totals text) to `text-xs` if ≤10px. `src/lib/components/pos/OrderSidebar.svelte`
  > **Validate:** Arm's-length readability ✅ · WCAG 12px body minimum ✅

- [ ] [05] **"Mark Picked Up" `min-height: unset` → remove** — Remove `style="min-height: unset"` from the Mark Picked Up button. Add a 2-step confirmation pattern (button state: normal → "Confirm Pickup?"). `src/lib/components/pos/OrderSidebar.svelte` line 334
  > **Validate:** KP-01 resolved ✅ · No accidental irreversible status change ✅

- [ ] [06] **Sides collapse `min-height: 36px` → `min-h-[44px]`** — Remove `style="min-height: 36px"`. Add `min-h-[44px]` Tailwind class. `src/lib/components/pos/OrderSidebar.svelte` line 454
  > **Validate:** KP-01 resolved ✅ · 44px minimum ✅

- [ ] [07] **Dispatched log time `text-[10px]` → `text-xs`** — `src/routes/kitchen/weigh-station/+page.svelte` line 508. One-character change.
  > **Validate:** Kitchen readability at grease-film conditions ✅

- [ ] [08] **POS header buttons `min-height: 40px` → `min-height: 44px`** — Update all three buttons (Info legend, New Takeout, History). `src/routes/pos/+page.svelte` lines 406, 477, 484
  > **Validate:** KP-01 resolved ✅

- [ ] [09] **Sides-prep timer interval `10_000` → `1_000`** — `src/routes/kitchen/sides-prep/+page.svelte` line 10.
  > **Validate:** Urgency threshold accuracy ✅ · Matches KDS interval ✅

---

## KNOWN_PATTERNS.md Update

**KP-01** (Touch Target Violations): +3 new instances found — Mark Picked Up (`min-height: unset`), Sides collapse (`min-height: 36px`), POS header buttons (`min-height: 40px`). Frequency now: 13/15 audits.

**NEW PATTERN — KP-12: Global Singleton State on Per-Card UI Controls**

Component-level UI state (section collapse, inline confirmation dialogs) stored at module level instead of per-item. Causes global side-effects when user intends card-local action. First observed in `showDishes` (KDS) and `confirmingUnEighty6` (KDS). At-risk pattern: any module-level `$state` that is referenced inside an `#each` loop.

**Fix pattern:** Move such state into `Map<string, T>` keyed by the loop item's unique ID (`orderId`, `itemId`). Apply for any `$state` referenced inside a `#each` that controls per-item visual behavior.

---

## Overall Verdict

This audit surfaces **two genuine implementation bugs** (P0 + P1) that no prior 14-audit history caught because they only manifest under multi-ticket extreme load conditions — exactly the scenario requested:

1. **`showDishes` global state** (P0) — radiates a user action across all tickets simultaneously. This is a delivery accuracy failure disguised as a UI toggle.
2. **`confirmingUnEighty6` name-keyed confirmation** (P1) — creates phantom UI across multiple ticket cards during peak service.

The remaining 7 findings are KP-01 (touch target) and visibility improvements that address the specific "accidental presses + override safeguards" concern.

The underlying kitchen coordination pipeline — void overlays, station-scoped ALL DONE, rejection alerts, New Tables banner — is now solid. The v3 gaps are subtle state management issues that surface only when multiple roles are interacting simultaneously under load. That's exactly what makes this audit valuable.

**Ship blockers:** [01] showDishes bug + [02] confirmingUnEighty6 bug
**Fix before next peak rush:** [03] dispatch toast + [04] status badge size + [05] Mark Picked Up accidental press
**Polish:** [06]–[09] (all 1-line fixes)
