# Agent: Kitchen/Sides (Corazon Dela Cruz) — Extreme Refill Load

**Role:** Corazon Dela Cruz — Kitchen / Sides Prep (kitchenFocus: 'sides')
**Location:** Alta Citta (tag)
**Primary page:** /kitchen/orders
**Session conditions:** kitchenFocus injected as 'sides', isLocked: true
**Audit date:** 2026-03-10
**Snapshot count used:** 5

---

## F1 — Shared KDS — sides vs. meat distinction

**Verdict: PARTIAL PASS (with critical caveats)**

**Finding:** The KDS has a `kitchenFocus` system that collapses the MEATS section for Corazon's 'sides' focus, showing only DISHES & DRINKS — but this is session-dependent and breaks entirely without proper login.

**Detail:**
When logged in via the proper account system (username: 'corazon', kitchenFocus: 'sides'), the KDS page applies a reactive `$effect` (lines 21–29 of `/kitchen/orders/+page.svelte`) that sets `showMeats = false` and `showDishes = true`. This hides the MEATS section from default view. The sub-navigation header correctly shows a green "🥗 Sides Prep" focus badge (`/kitchen/+layout.svelte` lines 50–55) in the top bar, giving Corazon a visual identity cue.

However, the system fails in three key ways:
1. **The MEATS section is NOT removed from the DOM — only hidden.** Corazon can tap the "🍖 MEATS" section header to expand it at any time, meaning there's no hard partition — she can accidentally reveal all the grill cook's items. During an extreme rush with wet hands, accidental expansion is a real risk.
2. **The 'sides' focus only applies when Corazon logs in via the proper account system.** The injected session in this audit (`kitchenFocus` set via sessionStorage without going through the login accounts array) does set the focus correctly, but it depends on the session store reading the `kitchenFocus` field — which it does from the persisted JSON. This is correct in implementation.
3. **No explicit "You are viewing: Sides Only" banner on the KDS page itself** — the focus badge is in the sub-nav header (small, 14px font, top of screen), too far from the ticket grid for Corazon reading at 60cm distance.

**3-second glanceable test:** PARTIAL PASS. If the MEATS section is collapsed, Corazon's items are the only ones visible. But she cannot tell WHY meats are collapsed (accidental or intentional) without reading the small badge.

---

## F2 — Refill items — original vs. refill distinction

**Verdict: PASS for meats, FAIL for sides/dishes**

**Finding:** Refill detection exists for meat items in the KDS (orange "REFILL" badge with pulse animation) but no equivalent exists for side-dish refill items (rice, banchan, soup).

**Detail (meat refill — exists):**
In the MEATS section, a refill item is detected via `isRefill = item.notes === REFILL_NOTE && !item.weight` (line 645). If true, an animated amber badge "REFILL" (`bg-amber-100 text-amber-800 animate-pulse`) is shown inline with the item name. Additionally, a count pill appears on the MEATS section header: "🔄 N refill(s)" in accent orange. This is a solid implementation for meat refills.

**Detail (sides refill — absent):**
The DISHES & DRINKS section (lines 717–801) has NO equivalent refill detection. When Ate Rose sends a refill request for Rice, Kimchi, or Banchan from the RefillPanel, the item is added to the order with `notes: REFILL_NOTE` via `addItemToOrder()` (with the `isRefill` flag). However, the KDS `groupItems()` function puts these into `grouped.dishes` (line 318: category 'sides' goes to dishes array), and the dish item rendering loop (lines 739–801) never checks `item.notes === REFILL_NOTE`.

The result: a refill request for rice looks **identical** to the initial rice order on Corazon's KDS. This is an instance of **KP-04** (Refill Items Not Visually Separated) — a systemic pattern found in 6/12 prior audits, but **more severe here** because:
- Corazon already preps the initial sides set during table open
- When she sees "Rice" in DISHES & DRINKS, she cannot tell if this is Round 1 (she already served) or Round 2 (new refill request)
- During an extreme rush with 8–12 tables simultaneously, re-prepping a full set when only rice was requested wastes prep time and banchan stock

**Frequency impact:** Corazon handles 30–50 refill requests per shift. At even 10% error rate (wrong item prepped), that's 3–5 wasted prep cycles per shift — each costing ~2 minutes of her attention.

---

## F3 — Refill request volume — aggregated view

**Verdict: FAIL**

**Finding:** There is no way for Corazon to see ALL pending side-dish refill requests across all tables in a single view. She must mentally aggregate the DISHES & DRINKS items across every ticket card.

**Detail:**
The meat section has a partial solution: the "🔄 N refill(s)" count pill appears on the MEATS section header on each ticket. This tells Lito (grill cook) how many meat refills are pending on that ticket. However, this count pill is **per-ticket only** — there is no global "Total refill queue" counter anywhere on the KDS page.

For Corazon specifically, the DISHES section has no equivalent refill count pill at all (the pill is only implemented for meats at line 620–625). During a rush where 8 tables are all requesting rice refills simultaneously, Corazon must scroll through each ticket card individually to find the DISHES section and spot the item.

There is no "Refill Only" filter mode on the KDS. The History button (e68) shows completed tickets, not pending refills. The "All Orders" sub-nav link shows a full order list but does not filter to refills-only.

**KP-07 (Information Density exceeding Miller's Law):** A ticket with 12 items (4 meats + 4 sides + 4 refills) requires significant scroll and mental parsing to find the refills. The 280px minimum card width helps, but with 8 simultaneous tickets on a 1024px viewport, Corazon sees approximately 3 cards at a time.

---

## F4 — New table signal — utensil prep trigger

**Verdict: FAIL**

**Finding:** No system-level signal exists on the KDS when a new table opens on the POS floor. Corazon has zero visibility of new table opens and must ask the cashier or count visually.

**Detail:**
When Ate Rose opens a new table (via PaxModal on /pos), the system creates a new Order record in RxDB. The KDS only shows KDS tickets — which are created when items are **charged/sent to kitchen** (via `markItemServed`/order charging flow). There is no ticket created for "table opened, prep utensils" — this conceptual handoff is entirely absent from the system.

Per `ROLE_WORKFLOWS.md` (Sides Preparer workflow, action #5): "Prep utensils/condiment sets per table (chopsticks, tongs, scissors, plates, 15–25×/shift, triggered by new table open on KDS — MEDIUM criticality, needs visibility of new table opens."

This is a **gap by design** — the system simply never addressed the utensil prep trigger. The KDS only reflects order-driven events. A new table can sit for 2–5 minutes before Corazon notices it (from the POS floor plan on a separate device, verbal call from cashier, or physical observation), during which the guests have no utensils or banchan.

**Cross-role handoff failure:** This matches **KP-03** (Silent Cross-Role Handoff Failures). The table-open event creates an Order, but no kitchen alert or KDS signal is generated.

**Frequency impact:** 15–25 new tables per shift at 2–5 minute delay each = up to 2 hours of aggregate first-impression failures per shift. At a BBQ restaurant where the first touch is utensils and banchan, this is service-quality critical.

---

## F5 — Sides bump interaction — per-item granularity and touch targets

**Verdict: CONCERN (touch target + section toggle violations)**

**Finding:** Per-item bumping for side dishes requires two taps (expand row → tap bump button), and the section header toggle button violates KP-01 with `style="min-height: unset"`.

**Detail:**

**Per-item bump flow:** In the DISHES & DRINKS section, each item row functions as a button-within-button: tapping the row expands it (reveals RETURN + 86 item actions), and a separate green ✓ bump button (`w-12 h-12`, `min-height: 48px`) sits right-aligned in the row. This 48px bump button meets the kitchen touch target minimum. However, the row itself uses `py-2` which renders at approximately 38–40px total height — below the 56px target for wet-hands kitchen environments. Corazon's main action (bumping a side item done) requires precisely tapping a 48×48px target inside a ~40px tall row.

**Section header toggle — KP-01 violation:**
The "🍖 MEATS" and "🍴 DISHES & DRINKS" section headers are toggle buttons with `style="min-height: unset"` (lines 614 and 721 in `/kitchen/orders/+page.svelte`). This explicitly overrides the `app.css` base layer `min-height: 44px` rule. These section toggles render at approximately 32–34px, below the 44px minimum and far below the 56px kitchen standard.

**Accidental section collapse risk:** During rush, Corazon may accidentally tap the "DISHES & DRINKS" header (32px target) instead of an item below it, collapsing her only visible section. The app shows a "N hidden" badge when collapsed, but there's no confirmation tap required to collapse — one mis-tap hides all her items.

**Separation problem:** There's no way to bump sides items WITHOUT seeing all the grill actions (RETURN, 86 ITEM) that appear when expanding a row. These actions are relevant to Lito, not Corazon. The expand-to-act pattern adds cognitive overhead on every item touch.

---

## F6 — Stock inventory — sides check during service

**Verdict: CONCERN**

**Finding:** Corazon can reach pantry/sides inventory in 2 taps (Sidebar → Stock → Inventory), and the search bar filters to "pantry" or "kimchi" effectively within 1 second — but the default view opens with meats first, requiring a scroll of 5+ groups before reaching "Sides" category.

**Detail:**
The inventory page loads with all 93 items grouped by category, starting with Beef (5 items) then Pork — both meat groups appear before Sides and Pantry. During a rush, Corazon must either:
1. Type in the search box (2 taps + keyboard, effective but requires time) — reaches "Kimchi" (Sides category) immediately when searching "kimchi"
2. Scroll past all meat groups to the Sides section (unknown scroll distance, likely 3–5 viewport heights)

A category-quick-filter chip or a "Sides/Pantry" button on the inventory header would let Corazon reach her items in 1 tap. The current search is functional but requires text input — difficult with wet hands during a rush.

The "Total Items 93 / OK 93 / Low Stock 0 / Critical 0" stat strip at the top does NOT filter by category — clicking "OK" shows all 93 OK items, not just pantry/sides items.

**Stock unit clarity:** Sides inventory shows "30 portions" (Baechu Kimchi) and "25 portions" (Kimchi) — the "portions" unit is vague. During a rush, Corazon needs to know "is 30 portions enough for 8 tables?" without mental conversion. The system doesn't show a per-table consumption estimate.

---

## Summary of Key Issues (for orchestrator)

| ID | Severity | Finding | Pattern |
|----|----------|---------|---------|
| C-01 | **FAIL** | Refill requests for side dishes (rice, banchan, soup) display identically to original orders on KDS — no "REFILL" badge in DISHES & DRINKS section | KP-04 (systemic, 6/12 audits) |
| C-02 | **FAIL** | No system signal for new table opens on KDS — Corazon has zero visibility of utensil/banchan prep trigger | KP-03 (systemic cross-role handoff) |
| C-03 | **FAIL** | No aggregated refill queue view — Corazon must scan each of 8–12 active tickets individually to find pending refill items | KP-07 (information density) |
| C-04 | **CONCERN** | DISHES & DRINKS section header toggle button uses `style="min-height: unset"` (~32px) — accidental collapse risk in kitchen environment | KP-01 (systemic, 10/12 audits) |
| C-05 | **CONCERN** | Section partition for sides vs. meats is collapsible (not locked) — Corazon can accidentally expand MEATS, re-merging the shared view | New finding — no prior pattern |
| C-06 | **CONCERN** | "🥗 Sides Prep" focus badge is only in sub-nav header (top of screen, ~14px, small) — not visible at KDS glance distance of 60cm while focusing on ticket cards | New finding |
| C-07 | **CONCERN** | Inventory requires text search or multiple scrolls to reach Sides/Pantry category — no one-tap category filter chip for sides preparer | KP-11 (scroll-hidden content) |
| C-08 | **PASS** | kitchenFocus:'sides' correctly hides MEATS section by default and shows "🥗 Sides Prep" badge | — |
| C-09 | **PASS** | Meat refill items have amber animated "REFILL" badge + section count pill — well implemented | — |
| C-10 | **PASS** | Per-item bump button meets 48×48px minimum in DISHES & DRINKS section | — |

---

## Critical fix recommendations (for fix-audit)

**Fix C-01 (highest priority):** Add `isRefill` detection to the DISHES & DRINKS render loop (parallel to the existing meat implementation). Show an amber "REFILL" badge on side items with `item.notes === REFILL_NOTE`. Also add a refill count pill to the DISHES & DRINKS section header (parallel to line 620–625 for meats).

**Fix C-02 (high priority):** When a new table is opened (Order created with status 'open'), generate a kitchen alert or auto-KDS ticket for "New table — prep sides set" visible on kitchen/orders. Or add a persistent "New Tables" counter badge on the KDS page showing tables opened in the last N minutes with no sides ticket.

**Fix C-04 (quick win):** Remove `style="min-height: unset"` from the MEATS and DISHES & DRINKS section header toggle buttons (lines 614 and 721). Replace with `py-3.5` to achieve ≥44px height.

---

## Snapshot count: 5/10
