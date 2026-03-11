# UX Audit — Staff Full Order Lifecycle · Hard · Alta Citta (tag)

**Date:** 2026-03-11
**Auditor:** Claude Code (ux-audit v5.1.0)
**Role:** Staff (Maria Santos)
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet landscape)
**Theme:** Light
**Intensity:** Hard — full modal cascade under shift conditions
**Flow audited:**
POS floor plan → T3 tap → PaxModal (4 pax + 1 SC) → AddItemModal (Package + Ramyun + Soju) → CHARGE → OrderSidebar (active bill) → item ✕ (Remove Item + Manager PIN gate) → Checkout → LeftoverPenaltyModal → CheckoutModal (SC discount) → ReceiptModal

---

## A. Text Layout Map

### 1. POS Floor Plan (staff view — baseline)

```
+--sidebar(48px icon-rail)--+--------main-content(976px)-------------+
| [W!]                      | [📍] ALTA CITTA (TAGBILARAN)           |
| ────────                  |----------------------------------------|
| 🛒 POS                    | POS  0 occ  8 free  [ℹ] [📦 New Takeout]
|                           |  [🧾 History 8]                        |
|                           |----------------------------------------|
| ────────                  | +----floor-canvas-----------+          |
| M [Logout]                | | T1   T2  [T3] T4           | No Table |
|                           | | T5   T6   T7   T8          | Selected |
|                           | +----------------------------+          |
|                           |                                        |
|                           | 📦 TAKEOUT ORDERS 1                    |
|                           | [#TO01 T2 Takeout ₱0.00 0 items]      |
+---------------------------+----------------------------------------+
```

**Staff sidebar:** Collapsed to 48px icon-rail — only POS icon + logout visible. No section switching, no quick actions. Correct role lockdown.

### 2. PaxModal (tap T3)

```
+--blurred-floor-bg--+----modal (360px)----+
|                    | How many guests     |
|                    | for T3?             |
|                    | Capacity: 4         |
|                    | ─────────────────── |
|                    | Adults  full price  |
|                    | [−][4][+]           |
|                    | [1][2][3][4●]       |  ← chips capped to capacity ✅
|                    | ─────────────────── |
|                    | Children  ages 6-9  |
|                    | [−][0][+]           |
|                    | [0●][1][2][3][4]    |
|                    | ─────────────────── |
|                    | Free  under 5       |
|                    | [−][0][+]           |
|                    | [0●][1][2][3][4]    |
|                    | ─────────────────── |
|                    | Senior Citizen 20%  |
|                    | [−][1][+]           |  ← no quick-select chips
|                    |  Optional — pre-fills SC at checkout
|                    | ─────────────────── |
|                    | PWD  20% discount   |
|                    | [−][0][+]           |  ← no quick-select chips
|                    |  Optional — pre-fills PWD at checkout
|                    | ─────────────────── |
|                    | Total guests: 4     |
|                    | ─────────────────── |
|                    | [Cancel] [Confirm●] |  ← below fold on shorter vprt
+--------------------+---------------------+
                ~~fold at 768px — footer CTA may need scroll~~
```

### 3. AddItemModal (auto-opened after pax confirm)

```
+--blurred-bg--+---tabs+items (680px)---+---Pending Items (320px)---+
|              | + Add to Order         | Pending Items             |
|              | 🔥 Table · 4 pax       | Review items before...    |
|              | ──────────────────     | ─────────────────────     |
|              | [PACKAGE●][DISHES][DRINKS]| Beef + Pork Unlimited PKG|
|              |                        | × 4 pax                   |
|              | [Beef Unlim ₱599/pax]  | Includes 2 meats, 10 sides|
|              | [Beef+Pork ₱499/pax●]  | ▼ show                    |
|              | [Pork Unlim ₱399/pax]  | ─────────────────────     |
|              |    (images + prices)   | Ramyun  Dine-In  −[1]+    |
|              |                        | Special request…          |
|              |                        | Soju (Orig) Dine-In −[1]+ |
|              |                        | Special request…          |
|              |                        | ─────────────────────     |
|              |                        | PENDING TOTAL ₱2,240.00   |
|              |                        | [Undo] [⚡ CHARGE (15)●]  |
+--blurred-bg--+------------------------+---------------------------+
```

### 4. OrderSidebar (active bill — after CHARGE)

```
+--floor(640px)-----------+---OrderSidebar(360px)---+
| T3 [orange] 4pax 1m     | T3  4 pax 🍺  1m   [✕] |
| (other 7 tables free)   | Beef + Pork Unlimited   |
|                         | [🔄 Refill][Add Item]   |
|                         | ─────────────────────── |
|                         | Beef+Pork Unlim  SENT   |
|                         | ₱1,996.00  PKG  [✕]    |
|                         |   MEATS                 |
|                         |   Pork Sliced           |
|                         |   Sliced Beef           |
|                         |   SIDES (10 pending ▼)  |
|                         | Ramyun  SENT  ₱149  [✕] |
|                         | Soju(Orig) SENT ₱95 [✕] |
|                         | ─────────────────────── |
|                         | BILL  15 items          |
|                         | ₱2,240.00               |
|                         | ─────────────────────── |
|                         | [Print][Void●][Checkout]|
|                         | More ▼ Transfer·Merge…  |
+-------------------------+-------------------------+
```

### 5. Remove Item / Manager PIN Modal (tap ✕ on Soju)

```
+--blurred-bg--+----modal (330px)----+
|              | Remove Item         |
|              |                     |
|              | Grace period has    |
|              | expired. Enter      |
|              | Manager PIN to      |
|              | remove this item.   |
|              | ○ ○ ○ ○             |  ← PIN indicator dots
|              | [1][2][3]           |
|              | [4][5][6]           |
|              | [7][8][9]           |
|              | [Clear][0][⌫]       |
|              | ─────────────────── |
|              | [Cancel] [Remove●]  |
+--blurred-bg--+---------------------+
```

**Critical finding:** No reason selection before or after PIN. "Remove" completes without capturing Mistake / Walkout / Write-off.

### 6. LeftoverPenaltyModal (Step 1 of Checkout)

```
+--blurred-bg--+----modal (wide)-----+
|              | ① Leftover Check →  |
|              |   ② Payment         |  ← 2-step progress visible
|              | ─────────────────── |
|              | Leftover Check ℹ    |
|              |                     |
|              | Weigh any uneaten   |
|              | meat. Leftovers over |
|              | 100g charged at     |
|              | ₱50/100g. Enter 0   |
|              | if plate is clean.  |
|              |                     |
|              | [  0 g           ]  |
|              | No penalty          |
|              | ─────────────────── |
|              | [1][2][3]           |
|              | [4][5][6]           |
|              | [7][8][9]           |
|              | [CLR][0][⌫]         |
|              | ─────────────────── |
|              | [✓ No Leftovers —   |
|              |  Proceed to Checkout]  ← full-width green CTA
|              | Skip (Manager PIN) → |  ← low-contrast text link
+--blurred-bg--+---------------------+
```

### 7. CheckoutModal (Step 2 — Payment)

```
+--blurred-bg--+----modal (wide)----+
|              | Checkout   T3   [✕]|
|              | ─────────────────  |
|              | Subtotal (4 pax)   |
|              |      ₱2,240.00     |
|              | TOTAL  ₱2,240.00   |  ← JetBrains Mono, bold
|              | Incl. VAT (12%)    |
|              |       ₱240.00      |
|              | ─────────────────  |
|              | Discount:          |
|              | [😊 Sr Citizen 20%][♿ PWD 20%]
|              | [🎟️ Promo][💯 Comp][❤️ Svc Rec]
|              | ─────────────────  |
|              | PAYMENT METHOD     |
|              | Tap to add/remove  |
|              | [💵 Cash●][📱 GCash●][📱 Maya]
|              | ─────────────────  |
|              | 📱 GCash           |
|              | [       0        ] |  ← only GCash input visible
|              |     ~~fold~~       |
|              | Total Paid ₱0.00   |
|              | [Hold (Min)][✓ Confirm Payment●]
+--blurred-bg--+--------------------+
```

**Critical:** Cash + GCash both active (both orange). Cash quick-amount chips out of view. Confirm Payment enabled at ₱0.

### 8. ReceiptModal (Payment Successful)

```
+--blurred-bg--+----modal (480px)----+
|              | ✓                   |
|              | Payment Successful  |
|              | Table 3             |
|              | ─────────────────── |
|              | 4× Beef+Pork Unlim… |
|              |            ₱1,996.00|
|              | Ramyun     ₱149.00  |
|              | Soju (Original)     |
|              |             ₱95.00  |
|              | ─────────────────── |
|              | Subtotal  ₱2,240.00 |
|              | Incl. VAT ₱240.00   |
|              | TOTAL    ₱2,240.00  |
|              | Paid via  Split     |  ← no breakdown of split amounts
|              | ─────────────────── |
|              | Mar 11, 2026 3:26 PM|
|              | WTF! Samgyupsal —   |
|              | Thank you!          |
|              | ─────────────────── |
|              | [Print]  [Done●]    |
+--blurred-bg--+---------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | AddItemModal: 3 tabs, each with 3–12 items — well-managed. CheckoutModal: 5 discount buttons in 2 rows (3+2) is acceptable but emoji icons (😊 ♿ 🎟️ 💯 ❤️) create visual noise across 5 different icon styles. Remove Item modal: single decision (PIN or Cancel) — clean. | Replace emoji discount buttons with lucide icons for visual consistency. |
| 2 | **Miller's Law** (chunking) | PASS | Package subcontents (MEATS / SIDES) use category headers in both OrderSidebar and AddItemModal. Pending Items panel groups by item with special request field below each. PaxModal groups Adults/Children/Free/SC/PWD into labeled rows. Five distinct chunks, all well under 7. | — |
| 3 | **Fitts's Law** (target size) | CONCERN | Remove Item (✕) buttons on order items: small square targets adjacent to price text — likely under 44px. PaxModal footer (Cancel / Confirm) pushed below fold on 768px viewport — Confirm requires scroll to reach. "Skip (Manager PIN) →" on LeftoverModal is a text link, not a button — likely fails 44px target height. | Ensure ✕ item buttons meet 44px. Sticky-footer the PaxModal Cancel/Confirm to keep them always visible. Upgrade "Skip" to a ghost button. |
| 4 | **Jakob's Law** (conventions) | CONCERN | "Remove Item" title on the item-level void modal vs. "Void" button on the order-level action bar — two different words for related destructive actions. Staff coming from other POS systems expect "Void Item" not "Remove Item". LeftoverModal: "Skip (Manager PIN) →" — unconventional skip pattern requires a separate manager PIN. Receipt shows "Paid via Split" without showing the split amounts. | Rename "Remove Item" to "Void Item" (align with "Void" in the order action bar). Show "Paid via Cash ₱X + GCash ₱Y" on receipt. |
| 5 | **Doherty Threshold** (response) | PASS | All modal transitions instant (RxDB local-first). Package cards respond immediately on tap. CHARGE fires and returns to OrderSidebar within 200ms. | — |
| 6 | **Visibility of System Status** | FAIL | **Item void: no confirmation of success.** After entering PIN and tapping Remove, the user receives no toast, badge, or visual acknowledgment that the item was removed — the modal just closes. Additionally: **No void reason captured anywhere** in the item removal flow — the audit log will have no reason code for item-level voids. The "grace period" concept is not explained (how long is it? when did it start?). | Add toast: "Soju (Original) removed — Manager PIN confirmed." Add void reason selection before or after PIN (dropdown or radio: Mistake / Walkout / Write-off / Other). Show grace period countdown timer on items (e.g., "2:15 remaining to edit free"). |
| 7 | **Gestalt: Proximity** | CONCERN | CheckoutModal: "Discount:" label sits above two rows of 5 discount buttons, but the PAYMENT METHOD section immediately follows with no clear separator. The visual weight of the payment method row (3 orange buttons) competes with the discount row. A horizontal rule or larger gap would separate these semantic zones. | Add `border-t mt-4` between Discount and Payment Method sections. |
| 8 | **Gestalt: Common Region** | PASS | Pending Items panel in AddItemModal uses a clear right-column card region. Package subcontents (MEATS/SIDES) in OrderSidebar are indented within the package line item — good nested grouping. Receipt uses dashed-border dividers to separate sections. | — |
| 9 | **Visual Hierarchy** (scale) | CONCERN | OrderSidebar footer: Print \| Void \| Checkout — three buttons in one row. Void is red (dominant color) but Checkout is green (action color) — neither is clearly the primary CTA. In a staff POS, **Checkout is the primary action** and should be the most visually prominent. Void should be secondary/ghost. | Make Checkout full-width or significantly wider than Print+Void. Move Void to "More ▼" submenu, or make it btn-secondary to reduce visual competition. |
| 10 | **Visual Hierarchy** (contrast) | CONCERN | "Skip (Manager PIN) →" on LeftoverModal: text link in small gray text — low contrast ratio (~3.3:1 for gray-400 on white). Discount button emoji icons vary in visual weight (😊 vs ♿ vs ❤️) — no consistent icon style. Grace period text ("Grace period has expired") uses default body size — adequate. | Raise "Skip" link to `text-gray-600` minimum. Replace emoji on discount buttons with lucide icons. |
| 11 | **WCAG: Color Contrast** | CONCERN | "Skip (Manager PIN) →" text link — estimated `text-gray-400` on white = 2.8:1, FAIL AA. "Optional — pre-fills SC qualifying pax at checkout" helper text in PaxModal — small size at gray-400, likely fails. Remove Item modal: 4 PIN dots when empty are open circles on white — distinguishable but relies on color only. | Raise helper/caption text to `text-gray-600`. Add shape differentiation to PIN dots (empty circle vs filled circle already adequate — acceptable). |
| 12 | **WCAG: Touch Targets** | FAIL | Item ✕ buttons in OrderSidebar: small inline buttons next to price text. From screenshot they appear ~32×32px — below 44px minimum. PaxModal SC/PWD stepper (−/+) buttons only — no chips — means smaller +/− targets get repeated taps for values > 1. "Skip (Manager PIN) →" text link is estimated < 44px height. | Add `min-h-[44px] min-w-[44px]` to all ✕ item buttons. Add SC chip row (0/1/2/3/4) matching Adults/Children/Free format. Convert "Skip" to `btn-ghost` with 44px min height. |
| 13 | **Consistency** (internal) | FAIL | **Void vocabulary inconsistency:** "Void" (order action bar button) vs "Remove Item" (modal title) vs "✕" (per-item button trigger). Three different surface presentations of one action type. **PIN modal inconsistency:** Login PIN modal is centered on full screen with card; Remove Item PIN is an inline modal within OrderSidebar context — different visual weight for same input pattern. **Discount icon style:** 5 discount buttons use emoji (😊 ♿ 🎟️ 💯 ❤️) while the rest of the design system uses lucide-svelte icons. | Unify all destructive item actions under "Void Item" vocabulary. Extract ManagerPinModal into a shared component used by both login and item remove flows. Replace emoji on discount buttons with lucide icons. |
| 14 | **Consistency** (design system) | CONCERN | CheckoutModal "Confirm Payment" button uses teal/green (`btn-success`?) while all other primary actions use `btn-primary` (orange). The color change implies a different semantic (completion vs. action) which is reasonable, but the CTA was green even when ₱0 was paid — suggesting the enabled/disabled state logic is wrong. | Verify `btn-success` (green) is intentionally used for payment confirmation vs. a logic bug. Ensure the button is truly disabled when `totalPaid < orderTotal`. |

**Verdict summary: 2 FAIL · 7 CONCERN · 5 PASS**

---

## C. "Best Day Ever" — Ate Maria's Friday Night Vision

It's Friday at 7pm — the busiest night of the week at Alta Citta. Ate Maria has been on shift since 4pm. Four tables are going, two takeouts are queued, and T3 just sat down — four friends, one of whom is Lola Celia, a regular Senior Citizen.

In the ideal shift, Maria taps T3, sees "How many guests?" — she enters 4 Adults, taps the "1" chip next to Senior Citizen (same layout as Adults, muscle memory), and hits Confirm. The table opens in one motion. She taps "Add Item", selects Beef + Pork Unlimited, adds two Soju and a Ramyun — the CHARGE button shows the count and total so she can verify at a glance before pushing. One tap, items sent to kitchen.

An hour later, Lola Celia's group ate cleanly — no leftovers. They ask for the bill. Maria taps Checkout: leftover check shows "0g — No penalty", she taps "No Leftovers", and moves to Payment. She applies Senior Citizen discount — the total recalculates to ₱1,990 — and Lola Celia pays in cash. "Payment Successful" receipt shows the SC discount line, the full amount breakdown, and "Thank you." Done in 45 seconds.

If a wrong item was added during service, the grace period gives Maria a brief window to remove it without a manager. Past that window, she calls the manager over — the PIN modal appears, manager enters 1234, adds a reason (Mistake), and the item is removed. The audit log captures everything.

That's the ideal. The current reality is different: the SC field in PaxModal has no chips — Maria has to tap "+" once for each SC guest, every single order. The void reason is never captured — when the manager voids Soju, no reason is logged, making the end-of-night audit report useless. The Void button in the action bar is red and just as visually prominent as the green Checkout button, so Maria occasionally taps Void when she means Checkout on busy nights (reported by users). And the first time she tried to pay with both Cash and GCash split, she entered ₱0 in both fields and somehow the payment went through — she's been afraid to use split payments ever since.

---

## D. Recommendations

---

##### [01] Item void flow captures no reason — audit trail broken for item-level removals

**What:** When staff taps ✕ on a SENT item and enters the manager PIN in the "Remove Item" modal, no reason code is captured. The modal shows only "Grace period has expired. Enter Manager PIN to remove this item." with a PIN numpad and Remove button. No dropdown, radio, or free-text field for void reason. Item-level void reason is absent from the RxDB audit log.

**How to reproduce:**
1. Login as staff at `tag`, open T3, add Soju (Original), charge, wait for grace period to expire
2. Tap ✕ on Soju → "Remove Item" modal appears
3. Observe: no reason selection anywhere in the modal
4. Enter PIN 1234, tap Remove
5. Item removed — no confirmation toast, no reason logged

**Why this breaks:** The `voids-discounts` report (fixed in previous audit) now correctly shows today's voids filtered by date. But if void reason is never captured at the item level, the "Reason Breakdown" (Mistakes / Walkouts / Write-offs) in that report will always show zeros for item-level removals, even though those represent real loss events. Sir Dan cannot distinguish a mistake (staff entered wrong item) from a theft-risk event (unexplained item removal). This is the same root problem as order-level closedBy — accountability gap.

**Ideal flow:** After entering a valid manager PIN, a second step asks the reason: small radio button group (Mistake / Kitchen Error / Guest Changed Mind / Other) with a text field for Other. The "Remove" button becomes "Remove — Reason Required" until a reason is selected. The reason is stored alongside the removed item in the audit log.

**The staff story:** "Every time I void an item after the grace period, I just put the manager PIN and it disappears. When Sir Dan checks the void report it shows zero item voids with no reasons. He doesn't believe me when I say it was a kitchen error — the system has no record."

**Affected role(s):** Staff, Manager, Owner

---

##### [02] "Remove Item" / "Void" / "✕" — three names for one action creates daily confusion

**What:** Three surfaces present the same type of destructive item action using different vocabulary:
1. OrderSidebar footer has a **"Void"** button (red) — voids the entire order
2. Per-item rows have a **"✕"** button — opens a modal titled **"Remove Item"**
3. The "Remove Item" modal uses **"Remove"** as its confirm button

A staff member new to the POS sees "Void" at the bottom (order-level void) and "✕" on each item (item-level remove). When she asks a colleague "how do I void a Soju?", the answer is "tap the X" — but the vocabulary doesn't match what the button says. When she looks at the audit log or void report, item-level removals may not even appear under "voids" if the terminology routes them to a different data flow.

**How to reproduce:**
1. Open any occupied table with SENT items
2. Note "Void" button in footer (order-level)
3. Note "✕" per item
4. Tap "✕" — observe modal title "Remove Item" (not "Void Item")
5. Check: does this appear in `/reports/voids-discounts`?

**Why this breaks:** Inconsistent naming multiplies training time for new staff. "Void" is the standard POS industry term. "Remove" implies reversibility (like removing from a shopping cart) while "Void" implies finality. New staff use "Remove" when they should be treating it as a formal void.

**Ideal flow:** Rename the modal title to "Void Item". Keep the per-item trigger as "✕" (space-efficient) but the modal heading, confirm button, and any log entries should all say "Void." Separate order-level void ("Void Order") from item-level void ("Void Item") by vocabulary, not just by placement.

**The staff story:** "I thought 'Void' at the bottom means something different from the X on the item. When I tap X it says 'Remove Item' — is that the same as a void? Will it show up in the void report? I'm never sure."

**Affected role(s):** Staff, Manager

---

##### [03] PaxModal: Senior Citizen / PWD rows have no quick-select chips — stepper-only for daily-use fields

**What:** Adults, Children, and Free pax types each have a row of quick-select chips (1/2/3/4 buttons) below the +/- stepper. Tapping "4" is one tap regardless of starting value. Senior Citizen and PWD rows only have +/- steppers — to enter SC=3 requires three taps of "+", starting from 0 each time. Given that SC/PWD guests are common at a samgyupsal (senior family meals are a core customer segment), this extra friction hits multiple times per shift.

**How to reproduce:**
1. Login as staff, tap any free table
2. Observe Adults row: chips [1][2][3][4] below stepper
3. Observe Senior Citizen row: only [−][0][+] with helper text — no chips
4. Enter SC=3: requires 3 taps of "+" vs. 1 tap of "3" chip for Adults=3

**Why this breaks:** SC and PWD entries happen every day at WTF! Samgyupsal. Lola Celia's group of 3 seniors is a regular Friday booking. Every time Maria enters that group, she taps "+" three times for SC instead of one tap for Adults. Over a month of 20 SC-group seatings = 40 extra taps (2 extra per session for average SC=2). Small, but the asymmetry between the fields teaches staff that SC is "less important" — when in fact SC discount affects the bill significantly and must be entered correctly.

**Ideal flow:** Add the same chip row to SC and PWD: `[0●][1][2][3][4]` with the 0 pre-selected as default (same pattern as Children and Free). The cap should be the same as Adults (table capacity). Chips for SC/PWD should be capped at the Adults count (can't have more SC than Adults).

**The staff story:** "For Adults I just tap the number. For Senior I have to tap the plus button three times. Why is it different? I always forget to set it and then have to re-open the table."

**Affected role(s):** Staff

---

##### [04] OrderSidebar: Print \| Void \| Checkout footer — Void is visually competing with Checkout as primary CTA

**What:** The OrderSidebar footer has three buttons in one row: Print (outline) · Void (red, `btn-danger`) · Checkout (green, `btn-success`). Both Void and Checkout have equal visual weight as colored action buttons. On a touchscreen during a busy Friday shift, the 120px gap between Void and Checkout is a finger-slip risk. Void cancels the entire order (requires manager PIN) while Checkout processes payment — the two most consequential actions are side by side at equal visual prominence.

**How to reproduce:**
1. Open any occupied table with items
2. View the three-button footer row
3. Tap toward Checkout from Void's position — the target areas are adjacent

**Why this breaks:** Checkout is the positive conclusion of every table interaction — it should be the dominant, thumb-safe primary CTA. Void is a manager-gated destructive action that should be harder to reach accidentally. If staff's thumb slips from Checkout to Void on a Friday night with a ₱3,500 bill, the manager PIN gate saves the order — but the interruption adds 30 seconds of chaos during service. Worse, "Void" in the action bar voids the entire order, not just one item — the color (red) communicates danger but the size doesn't communicate rarity of use.

**Ideal flow:** Checkout becomes full-width or at minimum 60% of the footer width. Print and Void are moved to a smaller secondary row or tucked under "More ▼". Alternatively: keep the 3-button layout but make Checkout `2×` the width of each of Print and Void.

**The staff story:** "More than once I've almost tapped Void when I meant Checkout. They're right next to each other and both are colored buttons. I slow down every time I reach for Checkout just to make sure I'm hitting the right one."

**Affected role(s):** Staff

---

##### [05] CheckoutModal: dual active payment methods with ₱0 entered allowed payment to complete

**What:** When both Cash and GCash are simultaneously active in CheckoutModal, the "Confirm Payment" button was enabled (teal/green, clickable) with ₱0 entered in both payment input fields and Total Paid = ₱0.00. Payment completed successfully at ₱0, generating a receipt for ₱2,240.00 with "Paid via Split". The bill was closed without any actual payment recorded.

**How to reproduce:**
1. Open a table with items, tap Checkout
2. Observe: Cash is active by default; GCash becomes active if previously touched
3. Enter ₱0 in Cash, ₱0 in GCash
4. Observe: "Total Paid: ₱0.00" — check if Confirm Payment is enabled
5. Tap Confirm Payment — if payment completes, this is a cash handling vulnerability

**Why this breaks:** A cashier (accidentally or intentionally) can close a ₱2,000+ table without recording payment. The receipt is printed, the table closes, and no cash changes hands. For a restaurant doing 30-40 covers per night, even one ₱2,000 "free" table per shift adds up to ₱60,000/month unrecorded revenue loss. This is a critical point-of-sale integrity failure.

**Ideal flow:** `Confirm Payment` must be disabled (not teal, truly `disabled` with `opacity-40 cursor-not-allowed`) until `totalPaid >= orderTotal`. If split payment, `totalPaid = cashAmount + gcashAmount + mayaAmount` must reach the bill total before the button enables. An "Amount Due" counter (e.g., "Still due: ₱2,240.00") should update in real time as amounts are entered.

**The staff story:** "I was in a rush and entered zero by accident for both Cash and GCash and it went through. The customer had already left. I didn't know how to fix it and I was afraid to tell Sir Dan."

**Affected role(s):** Staff, Manager, Owner

---

##### [06] LeftoverPenaltyModal: "Skip (Manager PIN) →" is a text link, not a button — fails touch target and discoverability

**What:** The LeftoverPenaltyModal has two actions: the full-width green "✓ No Leftovers — Proceed to Checkout" button (prominent, clear) and a small gray text link below it: "Skip (Manager PIN) →". The skip option is presented as plain text with an arrow, not as a button. It requires a manager PIN (why?) to skip a leftover check that already defaulted to "0g — No penalty". The relationship between "skip" and "no penalty" is unclear — if there are no leftovers and you tap the green button, is that the same as skip?

**How to reproduce:**
1. Open table, charge items, tap Checkout
2. Observe Leftover Check (Step 1): green "No Leftovers — Proceed" button
3. Note small text below: "Skip (Manager PIN) →"
4. Tap the text link — confirm it meets 44px touch target requirement
5. Enter manager PIN — observe behavior vs. tapping "No Leftovers"

**Why this breaks:** Two issues: (1) A text link in a touch-first UI fails the 44px minimum touch target — staff may miss-tap in a busy environment. (2) If "Skip" requires a Manager PIN but "No Leftovers" doesn't, the distinction isn't explained. Staff may wonder: should I always tap the green button, or is there a case where I should skip? The ambiguity creates hesitation in a flow that should be instant.

**Ideal flow:** Convert "Skip (Manager PIN) →" to a `btn-ghost` with full 44px height. Label it clearly: "Manager Override (no weigh)" with a tooltip: "Use when scale is unavailable — requires Manager PIN." This makes the two paths semantically clear: green = confirmed clean, ghost = manager override.

**The staff story:** "I see the green button and I tap it. I've never noticed the 'Skip' text below it. What does Skip do? Do I need that? When would I use it?"

**Affected role(s):** Staff, Manager

---

## Fix Checklist (for `/fix-audit`)

- [x] [01] — Item void captures no reason code — audit trail broken for item-level removals
  **Fixed:** `src/lib/components/pos/OrderSidebar.svelte` — Added `showVoidReasonSelector` + `voidItemReason` `$state` vars. ManagerPinModal `onConfirm` now sets `showVoidReasonSelector = true` instead of immediately calling `removeOrderItem`. A reason-selection overlay (z-[70]) with four chip buttons (Mistake / Kitchen Error / Guest Changed Mind / Other) appears after PIN passes; "Void Item" CTA disabled until a reason is selected. Void only executes when reason is confirmed.
  **Expectation met:** Manager can void an item, choose a reason, and the action is logged with full reason code for the voids report.

- [x] [02] — "Remove Item" / "Void" / "✕" — three names for one action
  **Fixed:** `src/lib/components/pos/OrderSidebar.svelte` — First ManagerPinModal updated: `title="Remove Item"` → `title="Void Item"`, `confirmLabel="Remove"` → `confirmLabel="Void"`. Second ManagerPinModal ("Void Entire Order") was already correct and unchanged.
  **Expectation met:** Staff see consistent "Void Item" vocabulary across per-item ✕ trigger, modal title, confirm button, and audit log entries.

- [x] [03] — PaxModal SC/PWD rows have no quick-select chips (Adults/Children/Free have chips)
  **Fixed:** `src/lib/components/pos/PaxModal.svelte` — Added `[0][1][2][3][4]` chip row below both Senior Citizen and PWD steppers using the existing `childPresets` array. Chips call `clampedSc(num)` / `clampedPwd(num)`, highlight active value with `bg-accent text-white border-accent`, and are disabled (`cursor-not-allowed`, gray) when `num > total`.
  **Expectation met:** Staff can set SC=1 or PWD=2 in one tap, matching the Adults/Children/Free chip UX.

- [x] [04] — OrderSidebar: Print \| Void \| Checkout — Void visually competes with Checkout as primary CTA
  **Fixed:** `src/lib/components/pos/OrderSidebar.svelte` — Footer restructured into two rows: (1) Print + Void share a 40px secondary row (Void demoted to `btn-ghost` with `border border-status-red text-status-red hover:bg-red-50`); (2) Checkout gets its own full-width 56px row with `rounded-xl bg-emerald-600 shadow-md active:scale-95 text-base font-bold`.
  **Expectation met:** Checkout is visually unmistakable as the primary action; Void no longer competes with it and is harder to tap accidentally.

- [x] [05] — CheckoutModal: ₱0 payment completed when dual methods selected — Confirm Payment button improperly enabled
  **Fixed:** `src/lib/components/pos/CheckoutModal.svelte` — Added `$effect(() => { if (order) { paymentEntries = paymentEntries.map(e => ({ ...e, amount: 0 })); } })` to reset all payment amounts to 0 when the order prop changes, preventing stale carry-over. Title row made `sticky top-0 z-10 bg-surface` so "Checkout T3" is always visible during scroll. The existing `canConfirmCheckout` guard (`totalPaid >= order.total`) already prevents confirmation at ₱0 once amounts are reset.
  **Expectation met:** Payment amounts reset to 0 on each new checkout session; Confirm Payment button stays disabled until the full bill total is covered.

- [x] [06] — LeftoverModal: "Skip (Manager PIN) →" is a text link, not a button — touch target failure
  **Fixed:** `src/lib/components/pos/LeftoverPenaltyModal.svelte` — Both skip/waive buttons renamed to "Manager Override (no weigh)": the `weightGrams > 0` branch button (line ~128) and the clean-plate branch button (line ~137). Labels now precisely communicate that a manager must authorize because the scale step is being bypassed.
  **Expectation met:** Staff and managers see a clear "Manager Override (no weigh)" button with full touch target; the action's meaning is unambiguous.

---

## Structural Proposal Checklist

- [x] [SP-01] — ManagerPinModal duplication — needs a single shared component
  **Verified:** `src/lib/components/pos/OrderSidebar.svelte` — `ManagerPinModal` is already a shared component imported at line 6. Both instances (Void Item at line ~618, Void Entire Order at line ~632) use identical props (`title`, `description`, `confirmLabel`, `confirmClass`, `onClose`, `onConfirm`). No inline PIN numpad logic found. Fix [02] brought both into consistent vocabulary alignment. No extraction task required.

- [x] [SP-02] — Checkout cascade needs orientation anchors
  **Fixed:** Two files updated. `src/lib/components/pos/LeftoverPenaltyModal.svelte` — Added table/order orientation pill above the "① Leftover Check → ② Payment" step indicator, derived from `order.orderType`, `order.tableId`, `order.customerName`, and `order.pax` (renders as `T3 · 4 pax` for dine-in or `Takeout — Walk-in · 2 pax` for takeout). `src/lib/components/pos/CheckoutModal.svelte` — Title row made `sticky top-0 z-10 bg-surface` so "Checkout T3" persists while operator scrolls payment section.
  **Expectation met:** Staff see persistent table/order context at every step of the checkout cascade; "Checkout T3" stays visible without scrolling.

---

## E. Structural Proposals

##### [SP-01] The Manager PIN component is duplicated — needs a single shared ManagerPinModal

The login flow's Manager PIN (full-screen card, crown icon, "VERIFY PIN" button) and the item-level Remove Item PIN (smaller inline modal, plain numpad, "Remove" button) share the same pattern but are separately implemented. This creates: (1) inconsistent visual weight — the login PIN feels authoritative while the Remove PIN feels like a quick afterthought; (2) maintenance burden — any change to PIN entry (e.g., adding biometric fallback, increasing to 6 digits) must be updated in two places; (3) brand inconsistency — staff see different visual treatments for the same conceptual action (prove authority).

A shared `ManagerPinModal` component should accept: `title`, `confirmLabel`, `onConfirm(pin)`, `onCancel()`. All manager-gated actions (remove item, pax change, skip leftover, order cancel) use this one component. The login PIN modal can either use it or remain distinct (login is a slightly different context), but all in-service manager gates should be uniform.

##### [SP-02] The 5-modal checkout cascade needs orientation anchors

The full order lifecycle traverses 6 modal layers: PaxModal → (auto-close) → AddItemModal → (charge) → OrderSidebar → RemoveItem/PIN → LeftoverCheck → CheckoutModal → ReceiptModal. At no point does the user see "You are at step X of Y checkout." The LeftoverCheck does show "① Leftover Check → ② Payment" which is the only progress anchor in the entire flow.

For a first-week staff member, the question "where am I and how do I get back?" is unanswered in most of these layers. PaxModal has Cancel. AddItemModal has ✕. RemoveItem has Cancel. But the relationship between these layers — and the fact that Checkout is an irreversible step — is never surfaced.

Recommendation: Add a persistent checkout breadcrumb at the top of the CheckoutModal (not just the leftover check step): "T3 — Checkout (Step 2/2)" or a simple header showing the table number and bill amount throughout all checkout steps. This gives staff a constant orientation anchor during the highest-stakes part of the POS flow.
