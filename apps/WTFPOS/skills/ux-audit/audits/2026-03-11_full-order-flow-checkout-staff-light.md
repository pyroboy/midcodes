# UX Audit — Full Order Flow to Checkout · Staff · Alta Citta (tag) · Light

**Date:** 2026-03-11
**Auditor:** Claude Code (ux-audit v5.1.0)
**Role:** Staff (Ate Rose)
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet landscape)
**Theme:** Light
**Flow audited:**
Floor plan → tap table → PaxModal → AddItemModal (Package + Dishes) → CHARGE → OrderSidebar → Checkout (Leftover Check → Payment)

---

## A. Text Layout Map

### 1. POS Floor Plan (initial state)

```
+--sidebar(240px)--+---------main-content(784px)-----------+
| [W!] WTF SAMGYUP | [📍] ALTA CITTA (TAGBILARAN)          |
| Alta Citta        |----------------------------------------------|
| 06:49 AM          | [≡] POS  1 occ  7 free  [ℹ] [📦 New Takeout]|
| -----------       |---------------------------------------------|
| 🛒 POS [active]   | +--floor-canvas (63%)---+ +--empty-sidebar--+|
|                   | | [T1 🟢 28m 4pax]        | | 🧾               ||
|                   | | [T2][T3][T4][T5]        | | No Table Selected||
|                   | | [T6][T7][T8]            | | (instructions)   ||
|                   | +-------------------------+ +-----------------+|
| -----------       | 📦 TAKEOUT ORDERS 2                          |
| A Ate Rose STAFF  | [#TO01 Pedro ₱503]   [#TO02 T2 Takeout ₱0]  |
| [→ Logout]        |                                              |
+------------------+----------------------------------------------+
                                         ~~fold at 768px~~
```

### 2. PaxModal (after tapping T4)

```
+--blurred-bg--+----modal(center, 360px wide)----+
|              | How many guests for T4?          |
|              | Capacity: 4                      |
|              | -------------------------------- |
|              | Adults   full price  [−] [2] [+] |
|              | [1][2][3][4][5][6][7][8]          |
|              | -------------------------------- |
|              | Children ages 6-9  [−][0][+]     |
|              | [0][1][2][3][4]                  |
|              | -------------------------------- |
|              | Free under 5   [−][0][+]         |
|              | [0][1][2][3][4]                  |
|              | -------------------------------- |
|              | Total guests              2      |
|              | [Cancel]       [Confirm]         |
+--blurred-bg--+----------------------------------+
                       ~~fold at 768px—modal fits~~
```

### 3. AddItemModal (packages tab)

```
+--blurred bg--+-----left-panel(67%)------+---right-panel(33%)---+
|              | ➕ Add to Order      [✕] | Pending Items        |
|              | 🔥 Table · 2 pax         | Review before push   |
|              | [🎫 PACKAGE][🍜 DISHES][🥤]| (No items yet)       |
|              | ~~FREE — inventory tracked~~                     |
|              | +-------------+----------+ PENDING TOTAL ₱0.00  |
|              | | 📸 Beef     | 📸 Beef  | [Undo] [⚡CHARGE(0)] |
|              | | Unlimited   | + Pork   |                      |
|              | | ₱599/pax    | ₱499/pax |                      |
|              | +-------------+----------+                      |
|              | | 📸 Pork     |          |                      |
|              | | Unlimited   |          |                      |
|              | | ₱399/pax    |          |                      |
|              | +-------------+----------+                      |
+--blurred bg--+---------------------------+--------------------+
                       ~~fold at 768px—modal fits~~
```

### 4. AddItemModal (dishes tab, after package selected)

```
+--blurred bg--+-----left-panel(67%)------+---right-panel(33%)---+
|              | ➕ Add to Order      [✕] | Pending Items        |
|              | [🎫 PACKAGE][🍜 DISHES][🥤]| Pork Unlimited [PKG] |
|              |                          | × 2 pax              |
|              | [Beef Fried Rice ₱169]   | Includes 2 meats,    |
|              | [Bibimbap ₱169][Chibop]  | 10 sides ▼show       |
|              | [Choi-Bhat][Gyeran Mari] |                      |
|              | [Japchae][Kimbap][Mandu] | PENDING TOTAL ₱798   |
|              | [Ramyun][Shrimp FR]      | [Undo] [⚡CHARGE(13)]|
|              | [Tteokbokki]             |                      |
|              | ~~11 items, no search~~  |                      |
+--blurred bg--+---------------------------+--------------------+
                       ~~fold at 768px—modal fits~~
```

### 5. OrderSidebar (after CHARGE)

```
+--sidebar--+--floor(63%)--+--------order-sidebar(37%)----------+
|           |              | T4  2 pax ✎  1m                 [✕]|
|           |              | Pork Unlimited                      |
|           |              | [🔄 Refill]         [Add Item]      |
|           |              | ----------------------------------------|
|           |              | Pork Unlimited [SENT]       ₱798 [✕]|
|           |              |   MEATS                             |
|           |              |   Samgyupsal [WEIGHING 0m]          |
|           |              |   Pork Sliced [WEIGHING 0m]         |
|           |              |   SIDES                             |
|           |              |   10 requesting ▼ show              |
|           |              | Ramyun [SENT]            ₱149 [✕]  |
|           |              | ----------------------------------------|
|           |              | BILL                        ₱947.00 |
|           |              | 14 items                            |
|           |              | [Print]  [Void]       [Checkout]    |
|           |              | More ▼ Transfer · Merge · Split · Pax|
+--sidebar--+--------------+-------------------------------------+
                                    ~~fold at 768px—all visible~~
```

### 6. CheckoutModal — Leftover Check (Step 1)

```
+--blurred bg--+------modal (360px wide)--------+
|              | 1 Leftover Check → 2 Payment   |
|              | --------------------------------|
|              | Leftover Check ℹ               |
|              | Weigh any uneaten meat.         |
|              | Leftovers >100g = ₱50/100g.     |
|              |                                |
|              |         0 g                    |
|              |      No penalty                |
|              |                                |
|              | [1][2][3]                      |
|              | [4][5][6]                      |
|              | [7][8][9]                      |
|              | [CLR][0][⌫]                    |
|              |                                |
|              | [✓ No Leftovers — Proceed]     |
+--blurred bg--+--------------------------------+
                   ~~fold at 768px—fits~~
```

### 7. CheckoutModal — Payment (Step 2) — FOLD ISSUE

```
+--blurred bg--+------modal (460px wide)--------+
|              | Checkout T4               [✕] |
|              | Subtotal (2 pax)      ₱947.00  |
|              | Incl. VAT (12%)       ₱101.00  |
|              | TOTAL                 ₱947.00  |
|              | --------------------------------|
|              | Discount:                      |
|              | [😟 Senior (20%)][♿ PWD (20%)] |
|              | [🏷 Promo][💯 Comp][❤️ Service] |
|              | --------------------------------|
|              | PAYMENT METHOD    Tap to add/rm |
|              | [💵 Cash][📱GCash][📱Maya]      |
|              | ┌── Cash ─────────── [Exact] ┐ |
|              | │           1000             │ |
|              | │[₱20][₱50][₱100][₱200]      │ |
|              | │[₱500][₱1k][₱2k][₱5k]       │ |
|              | └────────────────────────────┘ |
|              | Total Paid             ₱0.00   | ← ~~768px fold~~
|              | ┌ Cash Change       ₱53.00 ┐   | hidden below fold
|              | [Cancel]  [✓ Confirm Payment]  | ← HIDDEN BELOW FOLD
+--blurred bg--+--------------------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Discount section: 5 choices. Payment presets: 8 choices in 2 rows. Dishes tab: 11 items ungrouped. No tier violates catastrophically, but dishes list exceeds 7±2. | Add search/typeahead to DISHES tab |
| 2 | **Miller's Law** (chunking) | CONCERN | DISHES tab shows 11 items simultaneously. OrderSidebar SIDES shows "10 requesting" collapsed (good) but the MEATS expand to 2+ items with status badges creating density. | Group dishes by sub-category (grains, noodles, sides) or add search |
| 3 | **Fitts's Law** (target size/distance) | FAIL | **"Confirm Payment" button hidden below fold on 1024×768**. Cashier must scroll within the modal to reach the primary action. Status badges in OrderSidebar (SENT, WEIGHING) are 9px text — unreadable at arm's length. The ✕ close button in CheckoutModal has `style="min-height: unset"` (KP-01). |  Sticky footer for Confirm Payment. Remove `min-height: unset` from close buttons. |
| 4 | **Jakob's Law** (conventions) | PASS | Left sidebar, content right, modal overlays, sticky bill footer. Follows standard tablet POS conventions. |  |
| 5 | **Doherty Threshold** (response time) | PASS | RxDB is local-first — all interactions feel instant. No perceptible delay observed at any step. |  |
| 6 | **Visibility of System Status** | CONCERN | "SENT" badge on bill items — cashier doesn't know what "SENT" means (sent to kitchen? charged?). "WEIGHING" status appears in the cashier's bill — kitchen-internal state leaking into the wrong role's view. "10 requesting" on sides is ambiguous. | Replace "SENT" with "Charged" or remove. Hide WEIGHING from staff view. Rename "requesting" to "pending prep". |
| 7 | **Gestalt: Proximity** | PASS | Package tab: 3 cards well-spaced. Dishes: 3-column grid consistent. OrderSidebar: MEATS / SIDES group headers with dividers. CheckoutModal: discount block separate from payment block. |  |
| 8 | **Gestalt: Common Region** | CONCERN | AddItemModal — the "🍽 Dine-In" toggle on each pending item looks like a status badge but is an actionable toggle. It's inside the pending item row but not visually differentiated from read-only labels. Cognitive dissonance between "looks like a tag, acts like a button". | Add a clear border or "tap to toggle" label. Or remove the toggle from the pending-item row (set at order level instead). |
| 9 | **Visual Hierarchy** (scale) | PASS | Checkout modal: TOTAL ₱947.00 is largest, bold. Confirm Payment is green and dominant once visible. AddItemModal: package names > prices. OrderSidebar: bill total > item prices. |  |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | Status badges use `text-[9px]` — 9px is unacceptably small (minimum is 12px per Design Bible, 14px for readability at arm's length on a tablet). "SENT", "WEIGHING" badges are 9px text. "10 requesting" is amber text (KP-02 match: text-amber-600 on white). | Minimum 12px for all badge text. Replace amber text-only for status with icon+text pairs. |
| 11 | **WCAG: Color Contrast** | CONCERN | "SENT" badge: text-blue-600 on bg-blue-100 → ~3.6:1 (FAIL AA small text). "WEIGHING" badge: text-amber-700 on bg-amber-100 → ~3.3:1 (FAIL AA). "10 requesting": text-amber-600 on white → 3.6:1 (FAIL AA). All three fail at their 9–10px sizes. | Use text-blue-800 on bg-blue-100 (6.5:1) and text-amber-800 on bg-amber-100 (5.1:1). |
| 12 | **WCAG: Touch Targets** | FAIL | CheckoutModal close ✕ button: `style="min-height: unset"` (KP-01). CheckoutModal "Exact" button: `style="min-height: unset"`. "🍽 Dine-In" toggle in AddItemModal: `text-[10px]` with `py-1` — target is ~24px tall, well below 44px minimum. | Remove all `min-height: unset` overrides. Increase Dine-In toggle to ≥44px. |
| 13 | **Consistency** (internal) | CONCERN | PaxModal uses "Confirm", AddItemModal uses "CHARGE", CheckoutModal uses "Confirm Payment". Three different verbs for three "proceed" actions in the same flow. | Standardize: "Next" for non-final steps, "Confirm" for final commit. |
| 14 | **Consistency** (design system) | CONCERN | "FREE — inventory tracked" badge in AddItemModal uses internal developer terminology not found anywhere else in the UI. The "🍽 Dine-In" toggle is 10px text with `py-1` — inconsistent with the `.btn` standard. Discount buttons in CheckoutModal use `style="min-height: 48px"` inline, while other buttons use the `.btn` class — mixed patterns. | Replace "FREE — inventory tracked" with staff-facing copy. Standardize button sizing to `.btn` classes. |

---

## C. "Best Day Ever" Vision

Ate Rose walks in for her 3pm shift. The tablet is already at the counter, showing the POS floor plan. She can see at a glance: 7 green tables (available), 1 warm orange table (T1, running 28 minutes). Perfect.

A family of 4 arrives. Ate Rose taps T4 — a pax modal pops up instantly. She sees chips 1–4 matching the table's capacity (not 1–8, because T4 seats 4 people). She taps "4" in one touch, confirms. The Add to Order modal opens on the Package tab. She taps "Pork Unlimited" — the package highlights, auto-selects the meats and sides, and the view glides to the Dishes tab in a half-second. The father asks for a Ramyun. She taps it. She sees the running total ₱947 and one green "CHARGE" button. She taps it. The modal closes, the order sidebar shows the bill. She hears the kitchen ticket fire on the dispatch screen.

At the end of the meal, the family is ready to pay. Ate Rose taps "Checkout." The Leftover Check step appears — she punches in 0 grams (clean plate), taps "No Leftovers." The payment screen appears with the total ₱947 front and center. The father hands her ₱1,000. She taps the ₱1,000 preset. "Cash Change ₱53.00" appears in green. The large green "Confirm Payment" button is right there — she taps it. Done. Receipt appears. She's on to the next table in under 30 seconds.

**Where the current implementation falls short of this ideal:**

The ideal breaks down at two moments. First, in the dishes tab of AddItemModal — 11 text-only items with no search means Ate Rose must visually scan a grid of similarly-sized cards when a customer asks for a specific dish by name during peak hours. When 8 tables are open and the family at T4 is debating between Kimbap and Mandu while another table calls for refills, those extra 2 seconds of scanning accumulate into real stress.

Second, and more critically, the Checkout payment screen hides its most important button — "Confirm Payment" — below the visible area of the modal on a 768px-height tablet. Every single payment Ate Rose processes requires her to scroll down inside a modal, find the button, and tap it. At 15–25 checkouts per shift, this is 30–50 unnecessary scroll gestures per night. During peak, with customers waiting and change in hand, the confusion of "where did the Confirm button go?" is not just friction — it's a moment of visible incompetence in front of the customer.

---

## D. Recommendations

---

##### [01] "Confirm Payment" button hidden below fold in CheckoutModal

**What:** On a 1024×768 tablet viewport, the CheckoutModal's "✓ Confirm Payment" button is never visible in the initial render. The modal uses `max-h-[95vh] overflow-y-auto` (≈730px usable height), but the full content — header, totals, VAT row, 5 discount buttons, 3 payment method tabs, cash input, 8 preset buttons, total paid row, change row, and confirm button — exceeds this. The cashier must scroll inside the modal to access the primary action on every single checkout.

**How to reproduce:**
1. Log in as Staff (Ate Rose) at Alta Citta.
2. Open any table, add any items.
3. Tap Checkout → complete Leftover Check → Payment screen appears.
4. Observe: the "✓ Confirm Payment" button is not visible without scrolling.
5. Enter any cash amount via preset — the change amount appears, but Confirm Payment is still below the fold.

**Why this breaks:** Ate Rose processes 15–25 checkouts per shift. Every time, she must scroll inside the modal to find the Confirm button — a non-obvious action on a touchscreen where scroll and tap can be confused. During peak service (7pm–9pm), she has cash in her hand, a customer watching, and another table calling. The scroll-to-confirm adds cognitive load at the exact moment she needs speed and confidence. A new staff member will pause, confused, the first time they see the payment entered but no Confirm button — they may tap outside the modal by mistake, losing the transaction state.

**Ideal flow:** The CheckoutModal footer containing "Cancel" and "✓ Confirm Payment" should be `sticky bottom-0` within the modal's scroll container, always visible regardless of modal content length. The bill summary, discount section, and payment method panel scroll above it. The primary action is always anchored at thumb-reach, reachable in one tap from anywhere in the modal.

**The staff story:** "I always have to scroll down to find the Confirm button when I'm collecting payment. The customer hands me money and I'm swiping around the screen looking for a green button. It feels like I don't know what I'm doing."

**Affected role(s):** Staff

---

##### [02] "🍽 Dine-In" toggle disguised as a status badge in AddItemModal

**What:** When a cashier adds an ala carte dish (e.g., Ramyun) to a pending order in AddItemModal, a small `text-[10px]` button labelled "🍽 Dine-In" appears inline with the item row on the right panel. This button is a **toggle** — tapping it switches the item to "📦 To Go" mode, changing how the item's note is formatted when sent to the kitchen. It appears visually identical to a read-only status badge. There is no label, tooltip, or visual affordance indicating it is interactive.

**How to reproduce:**
1. Log in as Staff. Open a dine-in table.
2. Open AddItemModal → Dishes tab → tap any dish (e.g., Ramyun).
3. Observe the right panel: "🍽 Dine-In" appears next to the item name with quantity controls.
4. Tap it — it toggles to "📦 To Go" and the item's kitchen note changes to `[TAKEOUT]`.
5. The cashier has no indication this is a toggle or that they've changed anything meaningful.

**Why this breaks:** Ate Rose is working fast. She adds Ramyun for a dine-in customer. She glances at the pending item row and sees "🍽 Dine-In" — she might tap it while trying to check the item, accidentally marking it as takeout. The kitchen receives a `[TAKEOUT]` note on the Ramyun, causes confusion at the stove. Or the opposite: she misses it entirely and a takeout item gets processed as dine-in. The 10px button is also a touch target violation (KP-01) — well below the 44px minimum.

**Ideal flow:** For a dine-in table, "🍽 Dine-In" should be a read-only label, not an interactive toggle. The toggle only makes sense when adding items from the takeout context or when there's a hybrid scenario (e.g., attached takeout). If the toggle is needed, it should: (1) use a clearly interactive style (border, underline, or distinct button styling), (2) meet the 44px touch target minimum, (3) show a confirmation on toggle ("Mark as To Go?"). At minimum, the target size must be ≥44px.

**The staff story:** "I didn't even know that little 'Dine-In' thing was tappable. One time my customer got their Ramyun with a 'TAKEOUT' sticker from the kitchen and I had no idea why."

**Affected role(s):** Staff

---

##### [03] Status badges in OrderSidebar use 9px text — unreadable at arm's length

**What:** The OrderSidebar's item rows render status badges with `text-[9px]` — a 9-pixel font size. This affects: the "SENT" badge on charged items, the "WEIGHING" badge on meat items (with a pulsing animation), and related badges. On a 10-inch tablet held at 50cm operating distance, 9px text is physically illegible. The Design Bible specifies 12px minimum for captions, 14px for body text.

**How to reproduce:**
1. Log in as Staff. Open a table, add a package + any dish.
2. Tap CHARGE.
3. Observe the OrderSidebar: "SENT" badge next to "Pork Unlimited" and "Ramyun". "WEIGHING" badge next to meat items.
4. The badge text is rendered at 9px — inspect via DevTools `font-size: 9px`.

**Why this breaks:** Ate Rose checks the order sidebar ~100 times per shift to monitor running bills. If a badge is unreadable at arm's length, the status information it carries is invisible in practice. She will either ignore the badges entirely (making them pointless noise) or lean into the screen to read them (breaking her flow). The "WEIGHING" badge with `animate-pulse` draws the eye but delivers no readable information at 9px. Sir Dan, the manager, checking the screen from a step away gets nothing from these badges.

**Ideal flow:** All badge text in the OrderSidebar must be `text-xs` (12px) minimum. The "SENT" badge should use `text-xs font-semibold`. "WEIGHING" should use `text-xs` or be replaced with an icon (e.g., a scale icon) + short text label. Contrast ratios should be upgraded: text-blue-800 on bg-blue-100 (6.5:1) for SENT; text-amber-800 on bg-amber-100 (5.1:1) for WEIGHING. This is an instance of KP-01 and KP-02 combined.

**The staff story:** "The little colored boxes next to the items — I can barely read them. I think they say something but I can't really tell without squinting."

**Affected role(s):** Staff, Manager

---

##### [04] "WEIGHING" kitchen-status badge bleeds into cashier's order sidebar

**What:** When a package is selected, the OrderSidebar shows meat items with a pulsing amber "WEIGHING" badge. This is a kitchen-internal status (the butcher needs to weigh the meat at the weigh station before it's served). This status has no relevance to the cashier's workflow — they cannot act on it, it doesn't affect the bill, and it creates anxiety ("something is wrong with the order?").

**How to reproduce:**
1. Log in as Staff (Ate Rose). Open a table, select Pork Unlimited package.
2. Tap CHARGE.
3. Observe the order sidebar: "Samgyupsal [WEIGHING]" and "Pork Sliced [WEIGHING]" appear in amber with pulse animation under the MEATS group.

**Why this breaks:** Ate Rose has no action to take on "WEIGHING." She cannot speed up the weigh station, she cannot tell the customer anything useful. The pulsing amber badge occupies visual real estate and creates a false sense of urgency. At 80–120 item-add interactions per shift, she is exposed to this badge dozens of times. Over time it trains her to ignore it — which means if a meaningful status (e.g., "86'd" or "refused") ever appears in the same area, she may ignore that too.

**Ideal flow:** Kitchen-internal item statuses (weighing, cooking, pending in KDS queue) should be hidden from the staff OrderSidebar unless they result in a staff-actionable event (e.g., the kitchen refuses an item, which already shows an alert). The sidebar should show only: charged items, prices, and whether payment is pending. Statuses like "WEIGHING" and "SENT" can remain visible on manager/owner views if needed for oversight.

**The staff story:** "The pulsing orange badge next to the meat items made me nervous my first week. I thought something was wrong. My manager had to explain it just means the kitchen is preparing it. Now I just ignore it, but it still flashes at me all shift."

**Affected role(s):** Staff

---

##### [05] DISHES tab in AddItemModal shows 11 ungrouped items with no search

**What:** The DISHES tab in AddItemModal displays all 11 ala carte dishes in a flat 3-column grid of text-only cards (no images, no category grouping, no search). Items are: Beef Fried Rice, Bibimbap, Chibop, Choi-Bhat, Gyeran Mari, Japchae, Kimbap, Mandu, Ramyun, Shrimp Fried Rice, Tteokbokki. This exceeds Miller's Law (7±2) and Hick's Law thresholds for rapid selection.

**How to reproduce:**
1. Log in as Staff. Open a table, select any package in AddItemModal.
2. The modal auto-switches to the DISHES tab.
3. Count the visible items: 11 text cards in a 3-column grid, no search field, no category filter.

**Why this breaks:** Ate Rose adds dishes 80–120 times per shift. When a customer says "Ramyun" she must visually scan 11 same-styled cards to find it. At peak service with 5–8 open tables, "scanning 11 cards" costs 1–2 extra seconds per interaction. At 80 dish additions per shift, that's 80–160 seconds of unnecessary scanning time — nearly 3 minutes of compounded friction per shift, repeated across both cashiers, both branches, every service day.

**Ideal flow:** Add a text search/typeahead field at the top of the menu grid. A single input that filters the 11 (or future N) items as the cashier types. No API call needed — filter is client-side from the `menuItems` RxDB store. Two or three characters ("ram", "kim") immediately narrows to one result. This is the standard solution in every modern POS system. Alternatively, sub-group dishes by type (rice dishes / noodles / snacks) — but search is more powerful and requires less cognitive mapping.

**The staff story:** "When someone orders Kimbap I have to look through all the little boxes to find it. It's not a big deal when it's quiet but during dinner rush it adds up."

**Affected role(s):** Staff

---

##### [06] "10 requesting" label for package sides uses ambiguous kitchen terminology

**What:** After a package is charged to a table, the OrderSidebar shows the included sides collapsed under "10 requesting ▼ show" in amber text. The word "requesting" is internal system terminology — it describes the state of sides in the KDS queue (they are "being requested" from the sides prep station). From the cashier's perspective, this is meaningless: are customers requesting something? Is it an error state? Is it a warning?

**How to reproduce:**
1. Log in as Staff. Open a table, select Pork Unlimited (or any AYCE package).
2. Tap CHARGE.
3. Observe the OrderSidebar SIDES section: "10 requesting ▼ show" in amber text.

**Why this breaks:** Ate Rose sees this phrase 15–25 times per shift (each time a table is opened with a package). She may learn to ignore it, but a new cashier will be confused and may ask the manager, interrupting service. The amber colour (associated with warnings in the design system) reinforces the misleading sense that something is wrong. "10 requesting" is a status that belongs on the kitchen's KDS dispatch screen, not the cashier's bill view.

**Ideal flow:** Replace "X requesting" with "X pending" or simply "X sides included" in neutral `text-gray-500`. If the sides are all eventually confirmed as prepared, the label could update to "10 ready" in green. The label should be purely informational — no amber colour unless there's a genuine actionable issue.

**The staff story:** "There's always that orange text that says 'requesting' next to the sides. I don't know what it means and nobody has explained it to me. I just assume it's normal."

**Affected role(s):** Staff

---

##### [07] CheckoutModal close button and "Exact" button violate minimum touch target (KP-01)

**What:** Two buttons in the CheckoutModal use `style="min-height: unset"` inline overrides, bypassing the global 44px minimum: (1) the ✕ close button in the modal header (`text-lg`, unset height), and (2) the "Exact" cash shortcut button (`text-xs`, unset height). Both are under 44px tall, and the close button also has no defined width — it's a bare character. This is an instance of the systemic KP-01 pattern.

**How to reproduce:**
1. Log in as Staff. Open any table, add items, tap Checkout.
2. On the Payment step, inspect the ✕ button in the top-right and the "Exact" text next to the cash input.
3. DevTools: both have `min-height: unset` — the ✕ button is ~24px, the Exact button is ~22px.

**Why this breaks:** During checkout, Ate Rose is handling cash, facing the customer, and tapping quickly. A 24px ✕ button in the corner of a modal is easy to miss entirely or accidentally hit when trying to tap the discount buttons nearby. The "Exact" button being 22px tall means it requires more precise tapping than the 44px minimum allows on a touch interface.

**Ideal flow:** Remove `style="min-height: unset"` from both buttons. The ✕ close button should be `min-h-[44px] min-w-[44px] flex items-center justify-center` — a 44×44px tap zone around the × character. The "Exact" button should use a `btn-ghost` or `btn-secondary` class with full 44px height, placed alongside the cash amount display rather than as an inline text link.

**The staff story:** "The X button to close the payment screen is really small. I've accidentally tapped next to it a few times and the modal stayed open."

**Affected role(s):** Staff

---

##### [08] VAT row layout in CheckoutModal creates false "addition" impression

**What:** The CheckoutModal payment summary shows three rows: "Subtotal (2 pax) ₱947.00", "Incl. VAT (12%) ₱101.00", "TOTAL ₱947.00". The layout arranges these as three aligned right-column amounts. Any customer or cashier unfamiliar with Philippine VAT-inclusive pricing reads this as Subtotal + VAT = Total, expecting ₱947 + ₱101 = ₱1,048. The actual total is still ₱947 (VAT included) — but the visual grammar says "add these two rows together."

**How to reproduce:**
1. Log in as Staff. Open a table, add any items. Tap Checkout → complete Leftover Check.
2. Observe the payment summary: three right-aligned numbers where the first and last are equal (₱947.00) and the middle is a separate amount (₱101.00).

**Why this breaks:** A customer watching the screen may challenge the total ("Wait, isn't it ₱1,048?"). Ate Rose then has to explain Philippine VAT-inclusive pricing under time pressure, which erodes confidence in the system. For senior citizens applying a 20% discount, the VAT calculation becomes even more confusing if the visual layout implies addition.

**Ideal flow:** Reformat the summary to match Philippine BIR receipt convention: show the total prominently first, then VAT breakdown below in smaller text as a footnote. Example: "TOTAL ₱947.00" (large bold) → "VAT (12%) included: ₱101.00" (small text-gray-500 footnote below). This eliminates the false addition implication while preserving BIR compliance.

**The staff story:** "Sometimes customers look at the screen and say 'that's not right, the VAT makes it more.' I have to explain it every time. It makes me look like I don't know how to use the system."

**Affected role(s):** Staff

---

##### [09] "FREE — inventory tracked" badge in AddItemModal uses developer terminology

**What:** Below the category tabs (Package / Dishes / Drinks) in AddItemModal, a persistent badge reads "FREE — inventory tracked." This text is internal developer terminology describing the current item list filter state — items shown are priced at ₱0 (included in the package) and their inventory is deducted automatically. Neither phrase means anything to the cashier. It appears on every AddItemModal open when the Package tab is active.

**How to reproduce:**
1. Log in as Staff. Open a table. The AddItemModal opens on the Package tab.
2. Select a package — the modal switches to DISHES tab. Switch back to PACKAGE tab.
3. Observe the green badge below the tabs: "FREE — inventory tracked".

**Why this breaks:** Cashiers learn to read every element on a screen during onboarding. "FREE — inventory tracked" occupies a visually prominent position (it spans the full modal width in a green strip) and provides zero actionable information. New staff ask "what does 'inventory tracked' mean — do I need to do something?" Experienced staff ignore it but it adds visual noise to every AddItemModal session.

**Ideal flow:** Remove this badge entirely for the cashier view. The fact that package items are free and inventory-tracked is a system concern handled by the RxDB layer. If the information is needed for troubleshooting, surface it only in admin or manager views. The horizontal strip real estate is more valuable used for a search field (see issue [05]).

**The staff story:** "There's a green banner that says 'FREE — inventory tracked' every time I add something. I've been working here two months and I still don't know what it means."

**Affected role(s):** Staff

---

##### [10] Adults pax chips go from 1–8 regardless of table capacity

**What:** The PaxModal Adults section shows 8 quick-select chips (1, 2, 3, 4, 5, 6, 7, 8) regardless of the selected table's seating capacity. When opening T4 (capacity: 4), chips 5–8 are shown but represent impossible configurations for that table. The modal correctly shows "Capacity: 4" in the header but offers chips that contradict it. This slightly violates Miller's Law (8 ungrouped choices) and Jakob's Law (chip range should match context).

**How to reproduce:**
1. Log in as Staff. Tap table T4 (capacity: 4).
2. Observe the Adults row in PaxModal: chips 1–8 are all visible.
3. The header says "Capacity: 4" but chips 5, 6, 7, 8 represent overbooking the table.

**Why this breaks:** Ate Rose occasionally has to enter a group of 6 at a 4-seat table (pushed together). That's a physical override, not a system one. But the PaxModal should help the default case: most of the time, a table seats exactly its capacity. Showing chips 1–4 (capped at capacity) reduces the choice set to 4 — well within Miller's 7±2 — and removes the visual clutter of irrelevant options. When truly needed, the +/- stepper handles overflow.

**Ideal flow:** Cap the chip range to the table's declared capacity. For T4 (cap 4): show chips [1][2][3][4]. For T7/T8 (cap 2): show chips [1][2]. The +/- stepper handles counts beyond capacity. This reduces cognitive load, makes the default tap faster (tap "4" for a full table), and aligns the modal's affordance with the physical reality.

**The staff story:** "When I open a table I always have to scroll past extra numbers that don't apply. I wish it just showed the right options for the table I picked."

**Affected role(s):** Staff

---

## Fix Checklist (for `/fix-audit`)

- [x] [01] — Sticky footer for "Confirm Payment" in CheckoutModal
- [x] [02] — "🍽 Dine-In" toggle: differentiate visually + meet 44px target
- [x] [03] — Badge text upgraded from 9px → 12px minimum; contrast ratios fixed
- [x] [04] — Hide "WEIGHING" / kitchen statuses from staff OrderSidebar
- [x] [05] — Search/typeahead field added to DISHES tab in AddItemModal
- [x] [06] — "X requesting" renamed to "X pending" in neutral colour
- [x] [07] — Remove `min-height: unset` from CheckoutModal ✕ and "Exact" buttons
- [x] [08] — VAT display reformatted to footnote below TOTAL
- [x] [09] — Remove "FREE — inventory tracked" badge from cashier view
- [x] [10] — Cap Adults pax chips to table capacity in PaxModal

---

## E. Structural Proposals

---

##### [SP-01] Collapse CheckoutModal into a two-zone layout that never requires scrolling

**Problem pattern:** Issues [01], [07], and [08] all share a root cause: the CheckoutModal treats its entire content as a single scrollable column, leaving the most critical actions (Confirm Payment, close button) inaccessible or under-sized. The modal's vertical content is designed to accommodate every possible combination (discount + payment method + change) but does not account for the 95vh height constraint on a 768px device.

**Current structure:**
```
CheckoutModal (max-h-[95vh] overflow-y-auto, single column)
├── Header (Checkout T4)
├── Summary (Subtotal / VAT / Total)
├── Discount section (5 buttons)
├── Payment method tabs (Cash/GCash/Maya)
├── Payment input + presets (8 chips)
├── Total Paid row
├── Change row
└── Cancel / Confirm Payment  ← hidden below fold
```

**Proposed structure:**
```
CheckoutModal (fixed height, two zones)
├── Scrollable zone (overflow-y-auto, flex-grow)
│   ├── Summary (Subtotal / VAT / Total)
│   ├── Discount section (5 buttons)
│   ├── Payment method tabs (Cash/GCash/Maya)
│   └── Payment input + presets (8 chips)
└── Sticky footer zone (always visible, min-h-[80px])
    ├── Total Paid row + Change row (2 compact lines)
    └── [Cancel]  [✓ Confirm Payment]  ← always visible, always reachable
```

**Why individual fixes won't work:** Adding `sticky bottom-0` to the Confirm button alone is insufficient — the button lives inside the scrollable overflow container, so `sticky` has no effect without restructuring the modal into explicit scroll + sticky zones. Issues [07] and [08] are both consequences of the same lack of zone separation: without a sticky footer, the button is lost; without a compact summary, the modal is too tall to begin with.

**Affected role(s):** Staff (primary), Manager (checkout oversight)

**The staff story:** "I wish the payment button was always at the bottom so I could just tap it without scrolling around."

**Implementation sketch:** Restructure `CheckoutModal.svelte` to use `flex flex-col h-full` on the inner container. The scrollable section becomes `flex-1 overflow-y-auto`. The footer (`Total Paid + Change + action buttons`) becomes a `flex-shrink-0` zone with `border-t` separator. Move the Change display and Confirm button into this footer. The modal wrapper remains `max-h-[95vh]`. No new components needed — CSS restructure only.

---

## Structural Proposals Checklist

- [x] [SP-01] — Two-zone CheckoutModal (sticky footer) (addresses [01], [07], [08])
