# Agent: Kitchen/Grill (Lito Paglinawan) — Extreme Grill Load

**Auditor persona:** Lito Paglinawan, grill cook, Alta Citta (tag), kitchenFocus: 'grill'
**Page audited:** /kitchen/orders (KDS Order Queue)
**Session:** role=kitchen, locationId=tag, isLocked=true, kitchenFocus=grill
**Viewport:** 1024×768 (wall-mounted tablet)
**Environment context:** Bright task lighting 400–600 lux, smoke/steam diffusion, wet/greasy hands, viewing from 60–90cm

---

## E1 — KDS layout for grill cook

**Verdict: PASS (with CONCERN)**

**Finding:** Meat items are grouped in a clearly labelled "🍖 MEATS" section, separated from "🍜 DISHES & DRINKS", providing visual structure — but the grill-focus mode only auto-collapses Dishes, it does NOT remove them from the card.

**Detail:**
- The `groupItems()` function in `/kitchen/orders/+page.svelte` (line 315) correctly separates `category === 'meats'` from dishes/drinks/sides/service into distinct labelled sections per ticket card.
- When `session.kitchenFocus === 'grill'`, the page sets `showMeats = true; showDishes = false` — dishes are collapsed but NOT hidden entirely. The "🍜 DISHES & DRINKS" section header + hidden-count pill still appears on every card.
- The MEATS section header uses `text-xs font-bold uppercase tracking-wider text-red-800` — that is approximately 12px rendered text for the section label. At 90cm viewing distance this is **below the 18px threshold** required by ENVIRONMENT.md. The item name itself is `text-sm` (14px Tailwind default) — also below 18px for 90cm glance distance.
- Table number renders as `text-2xl font-black` (~24px) — this IS glanceable at 90cm. T-numbers pass.
- No persistent meat-only filter UI exists — Lito cannot permanently remove the Dishes section headers from his view. Even collapsed, each card has visual noise he must ignore.

---

## E2 — Ticket item size and contrast (grill environment)

**Verdict: FAIL**

**Finding:** Item name text is `text-sm` (14px) — 4px below the 18px minimum required for 90cm glance distance in a smoke/steam kitchen environment.

**Detail:**
- All item names in both MEATS and DISHES sections use `text-sm font-medium` (line 661, 756) — Tailwind `text-sm` = 14px/20px line-height. At 90cm reading distance through steam/grease film, ENVIRONMENT.md explicitly requires ≥18px.
- Status badges (REFILL, WEIGHING, READY, COOKING) use `text-xs` (12px) — even more problematic. REFILL uses `bg-amber-100 text-amber-800` — amber-on-light-amber at 12px through steam is nearly invisible. This is a FAIL for glance-readability.
- WEIGHING badge: `bg-blue-100 text-blue-600` with `animate-pulse` — light blue tint on white background. Per ENVIRONMENT.md rule: "Status badges that rely on subtle color tints (opacity ≤10%) are effectively invisible at 90cm through steam." The `bg-blue-100` is a 10% blue tint — fails the steam test.
- READY badge: `bg-status-green/10 text-status-green` (line 676) — explicit 10% opacity background. This is exactly the "opacity ≤10%" failure case described in ENVIRONMENT.md. Effectively invisible at distance.
- The timer badge does use full fills: `bg-status-red text-white` for critical, `bg-status-yellow text-gray-900` for warning — these pass. Normal state uses `bg-gray-100 text-gray-600` — borderline acceptable.
- Void overlay uses `bg-status-red text-white` with `text-sm font-bold` — this passes contrast and visibility requirements.

---

## E3 — Meat bump interaction (wet hands, ~150 bumps/shift)

**Verdict: CONCERN**

**Finding:** The individual item "serve" button is 48×48px (w-12 h-12) — meets kitchen threshold — but the activation path requires a two-tap expand/serve sequence for items in non-expanded state, which is a wet-hand friction point.

**Detail:**
- The green checkmark serve button is `w-12 h-12 rounded-lg` = 48×48px with `style="min-height: 48px"` (line 700). This meets the 48px kitchen threshold, but ENVIRONMENT.md recommends 56px for kitchen wet hands.
- However, the button is only directly visible and tappable when the item row is NOT expanded. On a fresh ticket, items start collapsed — `expandedItemId = null`. The serve button is rendered but inside the item row container. The entire row is `onclick={() => !isServed && toggleExpand(item.id)}` which expands first. The serve button has `e.stopPropagation()` to prevent the expand from firing. So direct tapping the serve button works WITHOUT expand — BUT the chevron down icon is between the item name and the serve button, creating a ~32px dead zone. A wet-finger imprecise tap risks hitting the chevron/expand area instead of the serve button.
- The "ALL DONE ✓" footer button is `w-full min-height: 56px bg-status-green` — this is the best-sized button on the page. However, it bumps ALL items (including dishes/drinks Lito doesn't prep). Lito cannot "Quick Bump" only his meat items without bumping Corazon's sides — a collaboration friction issue during a shared-KDS workflow.
- The "Quick Bump" header button has `min-height: 32px` — this is BELOW the 44px minimum for any role and the 56px kitchen recommendation. This is a FAIL for that specific button.
- RETURN and 86 buttons in itemActions use `min-height: 44px` (line 394, 407) — below the 56px kitchen recommendation, but meets the general minimum.

---

## E4 — Refill meat requests vs original orders

**Verdict: PASS (with CONCERN)**

**Finding:** Refill items show an animated "REFILL" badge and the MEATS section header shows a refill count pill — making them distinguishable from original orders. However, the REFILL badge is amber-on-amber at 12px, which fails the steam visibility test.

**Detail:**
- When `item.notes === REFILL_NOTE && !item.weight`, the item shows `bg-amber-100 text-amber-800 animate-pulse` badge with "REFILL" text (line 665). The pulse animation helps attract attention.
- The MEATS section header also shows a count pill: `bg-accent text-white text-xs font-black` with "↺ N refill(s)" — this is orange-filled which is visible at distance. This is a good glanceable affordance at the section level.
- CONCERN: The distinction relies on the word "REFILL" at `text-xs` (12px) in `bg-amber-100`. In a steamy kitchen at 90cm, Lito would need to read the badge rather than recognise it by color/icon alone — fails the "no reading required" rule for peak rush.
- There is no icon-only differentiation (e.g., a circular arrow ↺ icon on the item row itself). The refill is only identified by the text badge and the section count pill.
- Refill items appear in the SAME position in the MEATS list as original items. There is no visual reordering to prioritize refills over pending new items.

---

## E5 — All-kitchen KDS vs grill-only view

**Verdict: CONCERN**

**Finding:** The kitchenFocus='grill' mode auto-collapses Dishes but does NOT provide a true grill-only view. Every ticket card still shows the Dishes section header and hidden-count pill, creating cognitive load across 8–15 simultaneous cards during peak rush.

**Detail:**
- The `$effect` on line 21 sets `showDishes = false` when `kitchenFocus === 'grill'`. But the Dishes section header still renders inside each ticket card (lines 717–801) — it shows the "🍜 DISHES & DRINKS" label and a "N hidden" pill.
- At peak rush with 8–15 active tickets across a 280px-min-width grid, Lito's KDS screen shows: 8–15 MEATS sections + 8–15 DISHES section stubs. He must mentally filter the stub out of each card.
- There is no way to FULLY remove the Dishes section from a grill-focus view — the section renders if `grouped.dishes.length > 0`, regardless of `showDishes`.
- The focus badge "🔥 Grill Station" appears only in the sub-nav area (layout header) — it is small (`text-sm font-semibold` in a `px-3 py-1` pill) and at the very top of the screen. At 90cm viewing distance, this is not perceivable while standing at the grill.
- No mechanism exists for Lito to disable the NEEDS/service section, which also appears on his cards.
- SYSTEMIC CONCERN: The shared KDS assumes both Lito and Corazon watch the same screen. In practice, they would see each other's domain items — Lito sees Corazon's collapsed dishes stubs; Corazon sees Lito's meat items when she expands. The serve button on meat items is accessible to Corazon, creating accidental-bump risk on a shared tablet.

---

## E6 — "86/Out of Stock" (Refuse) flow

**Verdict: PASS (with CONCERN)**

**Finding:** The 86 flow is accessible but requires 2+ taps through item expand → see 86 button → tap, with an undo toast. The refuse/return flow requires a reason modal with 4 preset options — functional but 3 taps minimum.

**Detail:**
- To 86 an item: Lito must (1) tap the item row to expand, (2) tap "86 ITEM" button. That is 2 taps. When an item is already sold out, the button shows "86 ✕ SOLD OUT" in `bg-status-red text-white` — clearly visible.
- When restoring a 86'd item (un-86), an inline confirmation renders in `bg-amber-50` with "Restore [ItemName] to menu?" + Cancel/Restore buttons. This prevents accidental un-86, which is good.
- The 86 action sends a menu item availability toggle globally — not just for this ticket. The floor plan should reflect this immediately via reactivity.
- CONCERN: The 86 button is HIDDEN until the item row is expanded. During peak rush, Lito must perform 2 deliberate taps. There is no quick 86 action visible at a glance on the ticket surface. A prominent 86 affordance (e.g., long-press or swipe) is absent.
- The RETURN button (`btn-danger` with `min-height: 44px`) triggers the RefuseReasonModal — preset reasons include "Out of Stock" (useful for 86 scenario where the item was already served but Lito ran out mid-service). The presets are `min-height: 56px` buttons in a 2-column grid — these pass kitchen touch target requirements.
- CONCERN: "Out of Stock" as a RETURN reason vs the "86 ITEM" button serves overlapping but distinct purposes — RETURN notifies the floor/cashier station; 86 ITEM marks the menu item globally unavailable. This distinction is not explained in the UI. A grill cook under stress may confuse the two.

---

## Key Issues (for orchestrator)

### FAIL
1. **Item text below 18px minimum** (E2): All item names are `text-sm` (14px), badges are `text-xs` (12px). At 90cm grill distance with steam, this is below the ENVIRONMENT.md minimum. Applies to the single most-read element on the KDS — every item on every ticket.

2. **Status badges use tint backgrounds, not fills** (E2): WEIGHING badge = `bg-blue-100 text-blue-600`, READY badge = `bg-status-green/10 text-status-green`. These 10%-opacity backgrounds are effectively invisible at 90cm through steam. ENVIRONMENT.md explicitly flags this pattern as a fail case.

3. **"Quick Bump" header button is 32px** (E3): `min-height: 32px` is below the 44px global minimum and the 56px kitchen minimum. This is the fast path for clearing a table's order — the most-used action during peak — yet has the smallest target.

### CONCERN
4. **No true grill-only KDS view** (E5): kitchenFocus='grill' collapses but does not remove Dishes section stubs. At peak with 15 tickets, Lito has ~30 section headers to visually filter. No way to reduce cards to meat-only view.

5. **REFILL badge is text-only at 12px** (E4): Amber-on-amber `bg-amber-100 text-amber-800 text-xs` REFILL badge is not glanceable at 90cm through steam. Needs a solid-fill badge or icon marker.

6. **Bump path requires 2 taps for individual meat items** (E3): No single-tap surface-level serve. The ALL DONE button bumps all items including dishes Lito doesn't control.

7. **86 is hidden behind expand** (E6): No surface-level quick-86 affordance. During peak rush when Lito runs out of Samgyupsal mid-service, he must tap-expand-tap while managing the grill.

8. **Grill Station badge not visible at 90cm** (E5): The "🔥 Grill Station" focus indicator is a `text-sm` pill in the layout header. This is decorative at grill viewing distance — it does not confirm Lito's focus mode in a glanceable way from 90cm.

9. **Shared serve buttons on mixed-station KDS** (E5): ALL DONE and individual serve buttons are accessible regardless of kitchenFocus. No guard prevents Corazon from bumping Lito's meat items or Lito from accidentally bumping Corazon's dishes via the ALL DONE button.

---

## Snapshot count: 4/10
(Snapshots: E1 empty queue, E1 with grill session, E2 history modal, E5 closed modal)
