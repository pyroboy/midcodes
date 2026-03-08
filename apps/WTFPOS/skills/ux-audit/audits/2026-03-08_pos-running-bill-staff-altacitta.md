# UX Audit — Running Bill (OrderSidebar) · Staff · Alta Citta
**Date:** 2026-03-08
**Route:** `/pos` → OrderSidebar panel
**Role:** Staff (Maria Santos) · Alta Citta (Tagbilaran)
**Viewport:** 1024 × 768 (tablet landscape)
**Focus:** Running bill information density + refill meat grouping in an unli AYCE package flow
**States captured:** empty sidebar → initial order (package + 12 items) → refill requested (14 items, Round 2 meats appended)

---

## A. Text Layout Map

### State 1 — Initial AYCE order, all items REQUESTING/WEIGHING

```
+---sidebar (380px)----------------------------------------------+
| T1    4 pax    0m                                        [✕]   |
| Beef Unlimited                                                   |
| ┌─────────────────────────────────┐  ┌──────────────────────┐  |
| │         [  REFILL  ]            │  │    [  Add Item  ]    │  |
| └─────────────────────────────────┘  └──────────────────────┘  |
|------------------------------------------------------------------|
| Beef Unlimited    [REQUESTING]              ₱2,396.00  [PKG]    |
|                                                                  |
| Premium USDA Beef [WEIGHING]                           FREE      |
| Sliced Beef       [WEIGHING]                           FREE      |
| Kimchi            [REQUESTING]                         FREE      |
| Rice              [REQUESTING]                         FREE      |
| Cheese            [REQUESTING]                         FREE      |
| Lettuce           [REQUESTING]                         FREE      |
| Egg               [REQUESTING]                         FREE      |
| Cucumber          [REQUESTING]                         FREE      |
| Chinese Cabbage   [REQUESTING]                         FREE      |
| Pork Bulgogi      [REQUESTING]                         FREE      |
| Fish Cake         [REQUESTING]                         FREE      |
|                           ~~~ FOLD LINE (768px) ~~~              |
| [Meat dispatched: 0.00kg]   ← hidden below fold                 |
| BILL                                  ₱2,396.00  ← below fold   |
| 12 items                                          ← below fold   |
| [Void]         [Checkout]           [Print]       ← below fold   |
+------------------------------------------------------------------+
```

### State 2 — After refill: Round 2 meats appended at bottom

```
+---sidebar (380px)----------------------------------------------+
| T1    4 pax    1m                                        [✕]   |
| Beef Unlimited                                                   |
| [  REFILL  ]    [  Add Item  ]                                   |
|------------------------------------------------------------------|
| Beef Unlimited    [REQUESTING]              ₱2,396.00  [PKG]    |
|                                                                  |
| Premium USDA Beef [WEIGHING]   ← Round 1                FREE     |
| Sliced Beef       [WEIGHING]   ← Round 1                FREE     |
| Kimchi            [REQUESTING]                          FREE     |
| Rice              [REQUESTING]                          FREE     |
| Cheese            [REQUESTING]                          FREE     |
| Lettuce           [REQUESTING]                          FREE     |
| Egg               [REQUESTING]                          FREE     |
| Cucumber          [REQUESTING]                          FREE     |
| Chinese Cabbage   [REQUESTING]                          FREE     |
| Pork Bulgogi      [REQUESTING]                          FREE     |
| Fish Cake         [REQUESTING]                          FREE     |
|                           ~~~ FOLD LINE ~~~                      |
| Premium USDA Beef [WEIGHING]   ← Round 2 (invisible!)  FREE     |
| Sliced Beef       [WEIGHING]   ← Round 2 (invisible!)  FREE     |
|                                                                  |
| [Meat dispatched: 0.00kg]                                        |
| BILL                                  ₱2,396.00                  |
| 14 items                                                         |
| [Void]         [Checkout]           [Print]                      |
+------------------------------------------------------------------+
```

**Critical:** Round 2 meats are completely below the fold. Staff cannot see them without scrolling. They are visually identical to Round 1 meats — no round label, no separator, no grouping.

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | The running bill shows 12–14 items simultaneously at the same visual weight. No grouping reduces cognitive scanning choices. During a busy shift, finding "is my refill in?" requires parsing all 14 rows. | Group items into 2–3 collapsible zones: Active (meats in flight) / Pending sides / Served |
| 2 | **Miller's Law** (chunking) | FAIL | 9 FREE side items all showing identical [REQUESTING] badges form an unchunked block of 9. Working memory limit is 7±2 — the sides block alone saturates it. Refill meats are then appended below this block, exceeding capacity. | Collapse "Sent sides" into a single summary row: "9 sides sent ✓". Surfaces only need individual attention if kitchen refuses one. |
| 3 | **Fitts's Law** (target size/distance) | PASS | Refill and Add Item buttons are large (56px height), adjacent, and at the top of the sidebar — excellent reachability. Checkout is full-width in the sticky footer. | No change needed for primary actions. |
| 4 | **Jakob's Law** (conventions) | CONCERN | POS systems (Square, Toast) typically show the active/live items prominently, with completed/settled items collapsed or dimmed. The flat chronological list is unusual — staff coming from paper tickets or other POS apps expect a "current round" concept. | Adopt the restaurant industry pattern: group by "round" or "currently live" |
| 5 | **Doherty Threshold** (response time) | PASS | RxDB writes are local-first, refill appears instantly. Button press scale-95 provides tactile feedback. No perceptible delay observed. | No change needed. |
| 6 | **Visibility of System Status** | FAIL | After a refill, the 2 new meats are below the fold. Staff cannot see at a glance: "Has the refill been sent?" The only confirmation is scrolling to the bottom of a 14-row list. The header shows "T1 / 4 pax / 1m" and "Beef Unlimited" — there is no "Round 2 in progress" signal anywhere above the fold. | Add a "Round N in progress" pill in the header area, or surface the active refill meats at the TOP of the list, not the bottom. |
| 7 | **Gestalt: Proximity** | FAIL | Round 1 meats (rows 2–3) and Round 2 meats (rows 13–14) are separated by 9 side items. Proximity suggests they're unrelated. In reality they're the same category (meats in flight) and should be adjacent or grouped. | Group all "live meats" — regardless of round — into one proximity zone at the top of the items list. |
| 8 | **Gestalt: Common Region** | CONCERN | There is no visual container separating "active items" from "settled background items". Everything is in one undivided `divide-y` list. The only regional clue is the `[REQUESTING]` badge — a text label, not a spatial region. | Use a subtle background band or section header to create regions: "In Kitchen" / "Settled" |
| 9 | **Visual Hierarchy** (scale) | CONCERN | `[REQUESTING]` badge on "Kimchi" is the same visual weight as `[WEIGHING]` on "Premium USDA Beef". All statuses compete equally. In reality, WEIGHING (meat not yet weighed = order blocked) > REQUESTING (side in queue) in urgency. | Status urgency should map to visual weight: WEIGHING > COOKING > REQUESTING > (served items suppressed or dimmed) |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | FREE badge (green) on every side item competes with status badges. A staff member scanning for "which meats are cooking" has to visually filter out ~9 green FREE tags. | Consider hiding FREE tags on items that are already sent — the "FREE" label serves its purpose on the billing summary, not per-item during service. |
| 11 | **WCAG: Color Contrast** | CONCERN | `[REQUESTING]` is violet-100/violet-600 (bg `#EDE9FE` / text `#7C3AED`). Ratio ≈ 5.1:1 — passes AA for small text. `[WEIGHING]` amber-100/amber-700 (bg `#FEF3C7` / text `#B45309`) ≈ 4.6:1 — passes AA barely. Both acceptable but tight under restaurant lighting/glare. | Consider bumping WEIGHING to amber-800 for stronger contrast under high-glare restaurant conditions. |
| 12 | **WCAG: Touch Targets** | PASS | Refill (56px) and Add Item (56px) exceed minimums. Checkout, Void, Print all ≥ 44px. The ✕ close button uses `style="min-height: unset"` — this is a concern for a button tapped frequently, but it's in a low-frequency position (close). | The ✕ at top-right should have a minimum 44×44px touch area even if the visual is smaller. |
| 13 | **Consistency** (internal) | CONCERN | The Refill panel groups meats separately from free sides — visually clean. But the running bill doesn't reflect this grouping. The mental model breaks: "I see separate sections in Refill but a flat list in the bill". | Mirror the Refill panel's grouping logic (Meats / Free Sides) in the running bill's item list. |
| 14 | **Consistency** (design system) | PASS | Colors, typography, badge classes, button classes all consistent with design system. No token violations observed. | No change needed. |

**Verdict summary:** 2 FAIL · 6 CONCERN · 6 PASS

---

## C. "Best Day Ever" Vision — Staff Perspective

It's a packed Saturday dinner at Alta Citta. Maria is on table T1 — a family of 4 on the Beef Unlimited package, already 30 minutes in. The grill is going. The kids want more beef. Dad is asking when the Sliced Beef is coming back.

In the **ideal experience**, Maria glances at the running bill sidebar and immediately sees two zones without scrolling: a compact header confirming the round state ("Round 2 — 2 meats in kitchen"), and below it the stable background (sides, the package line). She taps **Refill**, picks the meats, and is done in 4 seconds. Back to the floor.

In the **current experience**, Maria opens the sidebar and sees 14 rows of items. She knows she just requested a refill but can't see the confirmation above the fold. The 9 REQUESTING badge rows for sides (Kimchi, Rice, Cheese...) form a wall of purple text that she has to scan through to find the meats she just sent. The Round 2 meats are below the fold — she has to scroll. Meanwhile, Table T3 is waving at her.

The emotional gap: she should feel **in control** ("bill is under control, meats are in the kitchen"). Instead she feels **uncertain** ("did that refill go through?"). This uncertainty generates extra taps — she re-opens Refill to check — slowing the whole shift.

The fix is not about design polish. It's about answering the one question a staff member asks 30 times per AYCE shift: **"What's live right now?"**

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | Refill meats land below the fold — staff can't confirm the refill sent without scrolling | Move all "live meats" (WEIGHING + COOKING status, any round) to a pinned section at the TOP of the items list, above the sides block | M | High |
| **P0** | 9 FREE sides all showing [REQUESTING] with equal visual weight — status noise saturates working memory | Collapse the FREE sides block into a single summary row: "9 sides sent" (expand on tap if needed). Only surface individual side status if a kitchen rejection comes in | M | High |
| **P1** | No "round" concept — Round 1 and Round 2 meats are visually identical, appended chronologically | Add a subtle round separator ("— Round 2 —") above newly-added refill meats, or show a "Round 2 in progress" pill in the header | S | High |
| **P1** | No above-the-fold signal that a refill is active | Show a compact "🔥 Refill in kitchen" banner in the header area when any meat has WEIGHING/COOKING status and it's a refill tag | S | Med |
| **P1** | Served/cooked items from prior rounds clutter the list as the session goes on | Dim or collapse items with `served` status — they're billing history, not active kitchen state. Show a "X served" summary instead of individual served rows | M | High |
| **P2** | "Meat dispatched: Xkg" stat bar is below the fold and always hidden | Move meat total to the header row ("T1 · 4 pax · 1m · 0.8kg meat") — contextually useful without taking vertical space | S | Med |
| **P2** | FREE tag on every side item competes visually with action-relevant status badges | Hide the GREEN FREE badge on items already sent to kitchen — it's redundant post-send. Reserve it for the billing summary line only | S | Med |
| **P2** | ✕ close button has `min-height: unset`, breaking the 44px touch target rule | Add `min-w-[44px] min-h-[44px]` wrapper on the close button | S | Low |

---

## Proposed Redesigned Running Bill Structure (for AYCE unli)

```
HEADER (always visible):
  T1 · 4 pax · 1m · [Round 2 in kitchen 🔥]
  Beef Unlimited

ACTIONS:
  [  REFILL  ]    [  Add Item  ]

──── LIVE MEATS (Round 2) ────────────────────
  Premium USDA Beef   [WEIGHING]            FREE
  Sliced Beef         [WEIGHING]            FREE
──── LIVE MEATS (Round 1) ────────────────────  ← dim or collapse if served
  Premium USDA Beef   [SERVED ✓]            FREE   (dimmed)
  Sliced Beef         [SERVED ✓]            FREE   (dimmed)
──── SIDES SENT ──────────────────────────────
  9 sides sent ✓                           (tap to expand)
──── PACKAGE ─────────────────────────────────
  Beef Unlimited                     ₱2,396.00 PKG

BILL  ₱2,396.00  ·  14 items
[Void]        [Checkout]        [Print]
```

**WARNING:** These recommendations affect `/pos` OrderSidebar — a panel used during every shift. Staff have built muscle memory for the current flat list layout. Consider: (a) deploying between shifts, (b) keeping the Refill and Add Item button positions unchanged (they are well-placed), (c) briefing staff that served items are now collapsed but can be expanded.
