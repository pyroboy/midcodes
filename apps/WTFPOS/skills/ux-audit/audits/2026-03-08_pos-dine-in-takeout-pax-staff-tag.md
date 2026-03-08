# UX Audit Report: Dine-In, Takeout & Mid-Service Pax Update Flows

**Auditor:** Claude (ux-audit skill v1.0.0)
**Date:** 2026-03-08
**Flows audited:**
  1. Opening a dine-in table and adding an AYCE order
  2. Creating a new takeout order
  3. Mid-service pax update — someone joins an occupied AYCE table
**Role:** Staff (Maria Santos)
**Branch:** Alta Citta (Tagbilaran, `tag`)
**Viewport:** 1024 × 768 (tablet landscape)
**States captured:** Login, POS floor (empty), PaxModal, AddItemModal (package + meats), Active AYCE order sidebar, More Options revealed, PaxChangeModal, Manager PIN modal, New Takeout modal, Takeout AddItemModal

---

## A. Text Layout Map

### State 1: POS Floor (no selection)

```
+--sidebar(~245px)--+----main-content(~395px)----+--order-sidebar(~380px)--+
| W! WTF!SAMGYUP   | [≡] POS  [1occ] [7free] [ℹ]  [📦 New Takeout] [🧾 73]|
| POS System       |-----------------------------------------------------------
| Alta Citta(Tag)  | +-----SVG floor plan------+                             |
| 06:37 PM         | |  [T1] [T2] [T3] [T4]   |  🧾                        |
|------------------|  |  [T5] [T6] [T7] [T8]   |  No Table Selected          |
| 🛒 POS (active)  | +------------------------+  Tap occupied table...      |
|                  |                            • Green = available          |
|------------------|                            • Orange = occupied          |
| M  Maria Santos  |                                                         |
|    STAFF         |                                                         |
| [→ Logout]       |                                                         |
+------------------+-----------------------------+---------------------------+
```

### State 2: PaxModal (table T1 tapped)

```
+--backdrop dimmed--+
        +--[320px modal]--+
        | How many guests for T1? |
        | [1][2][3][4]            |
        | [5][6][7][8]            |
        | [9][10][11][12]         |
        |    [Cancel]             |
        +------------------------+
Note: All 12 buttons visually identical — no affordance for common counts
```

### State 3: AddItemModal — Package Tab (auto-opens after pax selection)

```
+--AddItemModal (~65% width)--+--Pending Items panel--+
| ➕ Add to Order              | Pending Items         |
| 🔥 Table · 4 pax    [close] | Review items...       |
|------------------------------|                       |
| [📦 PKG] [🥩 Meats] [🥬 Sides] [🍜 Dishes] [🥤 Drinks] | No items yet |
|------------------------------|                       |
| FREE — inventory tracked     | PENDING TOTAL ₱0.00  |
|------------------------------|                       |
| [Beef Unlimited  ₱599/pax]  | [Undo] [⚡CHARGE(0)] |
| [Beef+Pork Unl.  ₱499/pax]  | (disabled)           |
| [Pork Unlimited  ₱399/pax]  |                       |
+-----------------------------+-----------------------+
After selecting Beef+Pork Unlimited → auto-switches to Meats tab:
- Shows meat cards (Samgyupsal, Pork Sliced, Premium USDA Beef, Sliced Beef)
- Pending panel fills with 14 default items, total ₱1,996.00
- [⚡CHARGE (14)] now enabled
```

### State 4: Active AYCE Order Sidebar (after CHARGE)

```
+--order-sidebar (380px)---------------------------+
| T1  4 pax  0m                              [✕]  |
| Beef + Pork Unlimited                           |
|--[       Refill       ] [     Add Item     ]---|  ← both prominent
| Beef + Pork Unlimited  REQUESTING  ₱1,996  PKG |
| Samgyupsal             WEIGHING         FREE   |
| Pork Sliced            WEIGHING         FREE   |
| Premium USDA Beef      WEIGHING         FREE   |
| Sliced Beef            WEIGHING         FREE   |
| Kimchi                 REQUESTING       FREE   |
| Rice                   REQUESTING       FREE   |
| Cheese                 REQUESTING       FREE   |
| Lettuce                REQUESTING       FREE   |
| Egg                    REQUESTING       FREE   |
| Cucumber               REQUESTING       FREE   |
| Chinese Cabbage        REQUESTING       FREE   |
| Pork Bulgogi           REQUESTING       FREE   |
| Fish Cake              REQUESTING       FREE   |
|----------- ~~~~~~~~ fold line ~~~~~~~~~~~~~~--|
| BILL                            ₱1,996.00      |
| 14 items                                       |
| [Void] [    Checkout    ] [Print]             |
| [           More Options            ] ←hidden!|
|  Transfer | Pax | Change Pkg                  |  ← behind "More Options"
|  Split Bill     | Merge                       |
+------------------------------------------------+
Note: "Pax" requires scroll + More Options + tap to reach = 3 interaction layers
```

### State 5: PaxChangeModal

```
+--[modal]--+
| Change Pax      |
| Current: 4 pax  |
|                 |
| [−] [ 4 ] [+]  |
|                 |
| [Cancel] [Apply Change] (disabled until changed) |
+-------------------+
After incrementing to 5:
[Apply Change] enabled → triggers Manager PIN modal

No financial impact shown anywhere in this modal.
₱499 will be added silently after PIN verification.
```

### State 6: NewTakeoutModal

```
+--[340px modal]--+
| 📦 New Takeout Order     |
| Enter customer name (optional) |
| [input: e.g. Maria, Table 5...] |
| [Cancel] [✓ Create Order] |
+------------------------+
```

### State 7: Takeout AddItemModal

```
+--AddItemModal----------------------------+--Pending Items--+
| 🥡 TAKEOUT | Add to Takeout              | Pending Items   |
| Kuya Jun                    [close]     |                 |
| [🥬 Sides] [🍜 Dishes] [🥤 Drinks]       | No items yet    |  ← No Package/Meats tabs
|------------------------------------------+                 |
| FREE — inventory tracked                 | ₱0.00           |
| [Cheese FREE] [Ch.Cabbage FREE]          | [Undo] [⚡CHARGE]|
| [Cucumber FREE] [Egg FREE]               | (disabled)      |
| [Fish Cake FREE] [Kimchi FREE]           |                 |
+------------------------------------------+-----------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** | **PASS** | PaxModal: 12 choices arranged in 3×4 grid — acceptable for pure number pickers. AddItemModal: 5 tabs (3 on takeout), Packages: only 3 choices. Excellent progressive disclosure. More Options: 5 secondary actions — within Miller's 7±2 range. | — |
| 2 | **Miller's Law** | **CONCERN** | Active AYCE order sidebar shows 14 line items simultaneously with no grouping between meats (WEIGHING) and sides/starters (REQUESTING). The visual weight of 14 identical-height rows creates a dense list that violates 7±2. | Group sidebar items by category (meats vs. sides vs. dishes) with a thin divider or section header. Or collapse FREE items into a count: "🥬 Sides × 9 (FREE)" |
| 3 | **Fitts's Law** | **CONCERN** | `Refill` and `Add Item` at the top of the AYCE sidebar: excellent reach. But `Pax` is reachable only after scrolling to the bottom AND expanding `More Options`. The pax badge (`4 pax`) in the header looks read-only — there is no tap affordance. On 768px viewport, BILL total + action buttons are partially below fold. | Move pax count to be tappable directly in the header (a small [edit] icon next to "4 pax" would surface the PaxChangeModal in 1 tap instead of 5). |
| 4 | **Jakob's Law** | **PASS** | PaxModal number grid is a familiar pattern. AddItemModal category tabs match standard e-commerce/food-ordering patterns. The "More Options" overflow is a well-established pattern. Manager PIN numpad follows standard ATM/POS PIN entry conventions. | — |
| 5 | **Doherty Threshold** | **PASS** | All interactions are RxDB local-first — sub-50ms writes. Package auto-populates 14 items instantly. Pax change recalculates and writes atomically. `active:scale-95` on buttons gives tactile feedback. No loading spinners observed. | — |
| 6 | **Visibility of System Status** | **CONCERN** | Good: `1 occ / 7 free` counter, table timer (00:02), pax display, REQUESTING/WEIGHING item badges, TAKEOUT badge in order header. Concern: After pax changes from 4→5, there is **no visual feedback** that the bill changed. The sidebar just silently updates from ₱1,996 to ₱2,495. No toast, no highlight, no "bill recalculated" indicator. Also: takeout order sidebar shows "NEW" status badge but no timer — when was this order created? | Add a brief flash/animation on the BILL total when it changes. Show creation time on takeout orders. |
| 7 | **Gestalt: Proximity** | **CONCERN** | The 14-item AYCE order list places all items (PKG, meats, sides) in one undivided column. The `More Options` panel (Transfer, Pax, Change Pkg, Split, Merge) is a 2-row flex grid — the wrapping creates inconsistent visual grouping where Pax and Transfer appear grouped but are functionally different (Pax affects billing, Transfer doesn't). | Use dividers or icons to separate action types in More Options. Group Pax + Change Pkg together (billing-affecting) away from Transfer + Merge (table-affecting). |
| 8 | **Gestalt: Common Region** | **PASS** | Modal overlays are cleanly contained with backdrop. Sidebar has clear left border. "Pending Items" panel in AddItemModal is a distinct right column. AYCE vs non-AYCE renders different header (Refill+AddItem vs. single +AddItem). | — |
| 9 | **Visual Hierarchy** | **CONCERN** | PaxChangeModal: Title "Change Pax" is well-sized. But **no financial impact line** is shown — the modal says nothing about ₱499 × pax. For an AYCE table with a package, this is critical information a manager authorizing the change needs to see. The `Apply Change` button being disabled until pax changes is good, but there's no hint of what "Apply" means financially. | Add a derived line below the stepper: "Beef+Pork Unlimited × 5 pax = ₱2,495 (+₱499)" using text-status-green color. |
| 10 | **Visual Hierarchy (contrast)** | **PASS** | `Refill` button (full orange `.btn-primary`) vs `Add Item` (outlined orange) — good visual weight differentiation. BILL total uses `font-mono text-2xl font-extrabold` — stands out. More Options buttons use `btn-secondary text-xs` — correctly lower weight than primary actions. | — |
| 11 | **WCAG: Color Contrast** | **CONCERN** | REQUESTING badge: `bg-violet-100 text-violet-600` — violet-600 on violet-100 is approximately 3.0:1. Fails AA for small text. WEIGHING badge: `bg-amber-100 text-amber-700` — approximately 4.1:1, borderline. Both badges are `text-[9px]` — extremely small, below 12px accessibility minimum. "FREE" label: `bg-status-green-light text-status-green` — green on light-green fails AA (3.2:1). | Increase badge font to 10-11px minimum. Increase REQUESTING contrast by darkening text to violet-700 or violet-800. Consider if color alone can convey these statuses for color-blind users. |
| 12 | **WCAG: Touch Targets** | **CONCERN** | `More Options` expanded: `Transfer \| Pax \| Change Pkg` rendered as `btn-secondary flex-1 text-xs` with `min-height: 36px` — this is **below the 44px minimum**. These are secondary action buttons but they're still interactive targets on a touchscreen. PaxChangeModal `−` and `+` buttons: 64×64px — well-sized. PaxModal 12 numbers: `h-12` (48px) — passes. | Increase `More Options` sub-buttons to `min-height: 44px` minimum. |
| 13 | **Consistency (internal)** | **FAIL** | The `More Options` expanded buttons use `min-height: 36px` while all other buttons in the app use `44-48px`. This single exception breaks the consistent touch target contract established throughout the app. Also: Takeout `AddItemModal` shows "FREE — inventory tracked" banner even though there's no package on the order — FREE items on a takeout are confusing, as staff may not understand why items show FREE when there's no AYCE package. | Fix `More Options` buttons to `min-height: 44px`. On takeout `AddItemModal`, replace "FREE — inventory tracked" banner with "No charge — included with order" or remove the FREE label entirely if items are genuinely complimentary on takeout. |
| 14 | **Consistency (design system)** | **PASS** | Modals consistently use `pos-card`, `rounded-2xl`, backdrop blur. Buttons consistently use `.btn-*` hierarchy. Emoji icons used consistently across category tabs (🎫📦🥩🥬🍜🥤). TAKEOUT badge uses consistent orange accent on all takeout contexts. | — |

---

## C. "Best Day Ever" Vision

It's Saturday at 7:30 PM at Alta Citta. Maria Santos has been running the floor for 2 hours — she knows every table's status at a glance. T1 through T5 are orange, timers ticking. She's in the flow.

**Opening a new table**: A group of 5 walks up. Maria taps T3 (green). The pax modal pops up immediately — she taps 5. The AddItemModal fills the screen, already on the Package tab. She taps "Beef + Pork Unlimited". The system switches to Meats, 14 items appear in the Pending column. She hits CHARGE. Done in 4 taps. The sidebar shows the full ₱2,495 bill, Refill and Add Item at arm's reach. *This flow is genuinely excellent.*

**Creating a takeout**: Two minutes later, someone calls for takeout. Maria taps "📦 New Takeout" — dashed orange box is unmistakable. Types "Kuya Jun", hits Create Order. The takeout AddItemModal opens, she picks sides and a dish, charges it. Clean. The takeout card appears in the queue. *Also excellent — fast, simple, zero ambiguity.*

**The problem scenario — someone joins a table**: T1 has been running for 30 minutes with 4 pax on Beef+Pork Unlimited when a 5th person walks in and joins the group. The table calls over: "Miss, can you add one more person?"

Maria looks at the sidebar. She sees "4 pax" — but it looks like a label, not a button. She looks for an "Add Guest" button. There isn't one. She scrolls down the long item list. She sees [Void] [Checkout] [Print] and below them, the ambiguously labeled "More Options". She taps it. A row of small buttons appears: Transfer, Pax, Change Pkg, Split Bill, Merge. She recognizes "Pax" as what she needs.

She taps it. "Change Pax / Current: 4 pax" — she taps +. Shows 5. She taps "Apply Change". Then: "Manager PIN Required."

*She has to find Juan Reyes.*

The manager is at T6 dealing with a complaint. Maria walks over, explains, waits for Juan to walk to T1, enter 1234. The whole process took 3 minutes and broke Maria's rhythm. The 5th guest was billed ₱499 extra (correctly — the system handled it), but nobody saw that happen — the bill just silently changed from ₱1,996 to ₱2,495. The table didn't notice. Maria didn't notice. Only Juan noticed because he authorized it.

**The emotional gap**: Maria should feel empowered to do the most common mid-service adjustments with a manager *nearby to authorize*, not a manager *physically present at the tablet*. The current flow conflates "needs authorization" with "requires manager to physically operate the tablet." For a pax change — which changes billing — authorization is appropriate. But the discovery path (buried under More Options) and the physical presence requirement create unnecessary friction.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | `Pax` button buried 3 layers deep (scroll → More Options → Pax) for a scenario that happens constantly (mid-service party joins table) | Make the `{order.pax} pax` badge in the sidebar header tappable — tap it to open PaxChangeModal directly. No drilling required. | S | High |
| **P0** | `More Options` sub-buttons have `min-height: 36px` — below 44px touch target minimum — fails the app's own design contract | Change to `min-height: 44px` on all More Options buttons | S | High |
| **P1** | PaxChangeModal shows no financial impact for AYCE orders — manager authorizing a pax change can't see what they're approving | Add a derived line in PaxChangeModal below the stepper: "Beef+Pork Unlimited × {newPax} pax = {formatted total} ({delta})" — using bill-affecting color only if a package exists | M | High |
| **P1** | No visual feedback after pax change recalculates the bill — bill total changes silently with no indicator | Briefly highlight the BILL total line in accent color (CSS transition) when `order.total` changes in the sidebar | S | Med |
| **P1** | AYCE order sidebar lists 14 items with no visual grouping — violates Miller's 7±2 | Add a thin divider between meat items (WEIGHING) and side/starter items (REQUESTING), or collapse FREE sides into "🥬 Sides × N (FREE)" summary row | M | Med |
| **P1** | "FREE — inventory tracked" banner in takeout AddItemModal is misleading — there is no package, so "FREE" has no meaning in this context | On takeout orders (no `packageId`), replace banner with "Complimentary sides" or simply remove it. The FREE badges on individual items should also be hidden on takeout. | S | Med |
| **P2** | PaxModal (12 buttons, all identical) — common pax counts (2, 4, 6) have no visual differentiation | Slightly emphasize common AYCE pax counts (2, 4, 6) with a subtle ring or slightly larger button. Most groups at samgyupsal are 2, 4, or 6. | S | Low |
| **P2** | Takeout AddItemModal: no explanation for why Package and Meats tabs are absent | Add a subtle one-line note: "Packages not available for takeout" OR simply label the absence clearly — currently no context given for the missing tabs | S | Low |
| **P2** | No creation timestamp visible on takeout orders in the sidebar — "When was this order created?" is relevant during a busy queue | Add a small `{timeAgo(order.createdAt)}` next to the status badge in the takeout sidebar header | S | Low |

---

## Summary

| Verdicts | Count |
|---|---|
| PASS | 6 / 14 |
| CONCERN | 7 / 14 |
| FAIL | 1 / 14 |

**Overall assessment:** The dine-in opening flow (table → pax → package → charge) is genuinely excellent — it is one of the smoothest POS table-opening flows I have seen, with well-executed progressive disclosure and an auto-advance from package selection to meats. The takeout creation is equally clean. The one **FAIL** and primary pain point is the mid-service pax update: a common operation at a multi-person AYCE restaurant is buried 5 interactions deep, then requires physical manager presence. The fix is minimal effort (P0: make the pax badge tappable) and would transform a 5-interaction, 3-minute flow into a 1-tap, 20-second one. The Manager PIN security gate itself is appropriate — it's the *discovery* and *manager handoff* friction that needs fixing.

**Code note:** `changePax()` at `src/lib/stores/pos/orders.svelte.ts:316` correctly recalculates billing (updates PKG quantity, runs `calculateOrderTotals()`). The business logic is sound. The UX is the gap.
