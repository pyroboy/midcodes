# UX Audit — Multi-Table Cashier: 3 Tables + Senior/PWD Checkout · Staff · Alta Citta (tag) · Light

**Date:** 2026-03-11
**Auditor:** Claude Code (ux-audit v5.1.0)
**Role:** Staff (Ate Rose)
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024×768 (tablet landscape)
**Theme:** Light
**Flow audited:**
Full kitchen scenario — one cashier managing 3 simultaneous dine-in tables (T1: Beef Unlimited 4 pax, T2: Beef+Pork 2 pax, T3: Beef Unlimited 4 pax) + post-service checkout with mixed Senior Citizen and PWD discounts applied to the same bill.

**Regression check (previous audit `2026-03-11_full-order-flow-checkout-staff-light.md`):**
- [x] [SP-01] Two-zone CheckoutModal sticky footer — **CONFIRMED FIXED** (Confirm Payment visible without scroll)
- [x] [05] Search field in Dishes tab — **CONFIRMED FIXED** (`textbox "Search dishes..."` present)
- [x] [06] "10 requesting" → "10 pending" — **CONFIRMED FIXED**
- [x] [08] VAT reformatted as footnote — **CONFIRMED FIXED** (TOTAL shown first, "Incl. VAT:" below)
- [x] [10] Pax chips capped at table capacity — **CONFIRMED FIXED** (T1 cap-4 shows chips 1–4 only)

---

## A. Text Layout Map

### 1. POS Floor Plan — 3 Tables Occupied

```
+--sidebar(240px)--+---------main-content(784px)---------------------------+
| [W!] WTF SAMGYUP | [📍] ALTA CITTA (TAGBILARAN)                         |
| Alta Citta        |------------------------------------------------------|
| -----------       | [≡] POS  3 occ  5 free  [ℹ] [📦 New Takeout] [🧾]   |
| 🛒 POS [active]   |-----------------------------------------------------|
|                   | +--------floor-canvas (63%)--------+ +--sidebar----+  |
|                   | | [BEEF 4m T1 4pax ₱2396 12 items]  | | T1         |  |
|                   | | [Beef+Pork 2m T2 2pax ₱998 13]    | | 4 pax   5m |  |
|                   | | [BEEF 0m T3 4pax ₱2396 12 items]  | | Beef Unltd |  |
|                   | | [T4 cap4][T5 cap4][T6 cap4]        | | [Refill]   |  |
|                   | | [T7 cap2][T8 cap2]                 | | [Add Item] |  |
|                   | +-----------------------------------+ | BILL 12items|  |
|                   | 📦 TAKEOUT ORDERS 3                  | ₱2,396.00    |  |
|                   | [#TO01 Juan ₱838] [#TO02 Jose ₱685] | [Print][Void]|  |
|                   | [#TO03 T2 Takeout ₱0]               | [Checkout]   |  |
|                   |                                     | [More ▼]     |  |
| -----------       |                                     +--------------+  |
| A Ate Rose STAFF  |                                                       |
| [→ Logout]        |                                                       |
+------------------+------------------------------------------------------+
~~fold at 768px — everything above fold~~
```

**Key observation:** Table cards now show full state at a glance: `[BEEF | timer | TableID | pax | ₱total | item count]`. Dense but effective — 5 data points per occupied table card. However, there is **no persistent visual indicator showing which table is currently selected in the sidebar**. T1 is shown in the sidebar but no highlight/border distinguishes T1 from T2/T3 on the floor plan.

---

### 2. CheckoutModal — Payment Step (with Senior Citizen discount applied)

```
+--blurred bg--+------modal (460px wide)---------------------------+
|              | Checkout T1                                    [✕] |
|              | --------------------------------------------------|
|              | Subtotal (4 pax)                         ₱2,396.00 |
|              | Senior Citizen 20% (1 of 4 pax)          -₱107.00  |
|              | TOTAL                                    ₱2,289.00 |
|              | VAT Exempt                               ₱193.00   |
|              | --------------------------------------------------|
|              | Discount:                                          |
|              | [👴 Senior Citizen (20%)]  [♿ PWD (20%)]           |
|              | [🎟️ Promo]  [💯 Comp]  [❤️ Service Rec]             |
|              | --------------------------------------------------|
|              | +-- Qualifying Persons (Senior Citizen) ---------+ |
|              | | 1 of 4 pax qualify for 20% [−][1][+]           | |
|              | | SC ID #1 [__________________]  [📷 Add]         | |
|              | | Discount (1/4 pax × 20%)            -₱107.00   | |
|              | +-----------------------------------------------+ |
|              | --------------------------------------------------|
|              | Payment Method                        Tap to add   |
|              | [💵 Cash]  [📱 GCash]  [📱 Maya]                   |
|              | ┌── Cash ─────────── [Exact] ──────────────────┐  |
|              | │  [₱20][₱50][₱100][₱200][₱500][₱1k][₱2k][₱5k]│  |
|              | └───────────────────────────────────────────────┘  |
|              +----- sticky footer --------------------------------|
|              | Total Paid                               ₱0.00     |
|              | [Cancel]              [✓ Confirm Payment] ← FIXED  |
+--blurred bg--+--------------------------------------------------+
~~fold at 768px — sticky footer always visible~~
```

**Fix confirmed**: [SP-01] sticky footer is implemented — Confirm Payment always visible at bottom.

---

### 3. Manager PIN Modal (stacked on top of CheckoutModal)

```
+--CheckoutModal bg (dimmed)--+------PIN modal--------------------+
|                             | Authorize Discount                 |
|  [Checkout T1 visible but   | All discounts require Manager PIN  |
|   inaccessible behind dim]  | authorization. Enter PIN to apply. |
|                             |                                    |
|                             | [1][2][3]                          |
|                             | [4][5][6]                          |
|                             | [7][8][9]                          |
|                             | [Clear][0][⌫]                      |
|                             |                                    |
|                             | [Cancel]  [Authorize] ← disabled   |
+-----------------------------+------------------------------------+
~~4 visual layers: floor plan → sidebar → CheckoutModal → PIN modal~~
```

---

### 4. CheckoutModal — After Both SC + PWD Discounts "Applied"

```
+--blurred bg--+------modal (460px wide)---------------------------+
|              | Checkout T1                                    [✕] |
|              | --------------------------------------------------|
|              | Subtotal (4 pax)                         ₱2,396.00 |
|              | PWD 20% (1 of 4 pax)                     -₱107.00  |  ← SC gone!
|              | TOTAL                                    ₱2,289.00 |  ← unchanged
|              | VAT Exempt                               ₱193.00   |
|              | --------------------------------------------------|
|              | Discount: [👴 Senior] [♿ PWD] ← neither shows active|
|              | +-- Qualifying Persons (PWD) --------------------+ |
|              | | 1 of 4 pax qualify for 20% [−][1][+]           | |
|              | | PWD ID #1 [__________________]  [📷 Add]        | |  ← SC ID gone!
|              | +-----------------------------------------------+ |
|              +----- sticky footer --------------------------------|
|              | Total Paid ₱0.00  [Cancel]  [✓ Confirm Payment]   |
+--blurred bg--+--------------------------------------------------+
Expected total with 1 SC + 1 PWD = ₱2,396 - ₱107 - ₱107 = ₱2,182
Actual total = ₱2,289 (only 1 discount active at a time)
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | CONCERN | Discount row: 5 buttons (SC, PWD, Promo, Comp, Service Rec). In the multi-table panic moment, selecting the right combination under time pressure is error-prone. No visual "already applied" state on SC/PWD buttons after authorization — cashier must infer state from discount panel alone. | Add applied/active visual state to discount buttons. Consider two distinct rows: "Statutory (SC/PWD)" vs "Business (Promo/Comp/Service Rec)". |
| 2 | **Miller's Law** (chunking) | FAIL | After both SC and PWD discounts are clicked, the CheckoutModal contains: header + 4-row summary + 5 discount buttons + 1 discount detail panel (4 rows) + 3 payment method tabs + 8 cash presets. That's 6 distinct chunks in one scrollable zone — exceeds 7±2 when the discount panel expands. With 3 tables open in the background, the cashier's working memory is already loaded with table context. | Collapse applied discount to a compact "SC × 1, PWD × 1 applied ✓" chip — expand for ID entry only when needed. |
| 3 | **Fitts's Law** (target size/distance) | PASS | [SP-01] sticky footer confirmed: Confirm Payment always visible. Discount buttons are large (≥44px). Manager PIN numpad buttons are large and well-spaced for fingertip input. Cash preset chips are generously sized. | — |
| 4 | **Jakob's Law** (conventions) | CONCERN | After applying SC discount, the user expects both SC and PWD to stack (industry standard for mixed-discount tables). The system silently replaces SC with PWD without any "replacing" or "exclusive" message. This violates the convention that independent buttons function additively. | Explicitly communicate exclusivity or implement additive stacking. |
| 5 | **Doherty Threshold** (response time) | PASS | All interactions feel instant (RxDB local-first). PIN input, discount application, floor plan updates — no perceptible delay. | — |
| 6 | **Visibility of System Status** | FAIL | Three sub-issues: (1) No floor plan indicator showing which table is currently selected in the sidebar — in a 3-table scenario, cashier must mentally track which table they last tapped. (2) After SC + PWD are both "authorized" with Manager PIN, neither button shows an active/applied state — cashier cannot tell which discount is actually live. (3) When PWD replaces SC, the SC ID input fields and SC detail panel disappear silently — cashier doesn't know their SC data was lost. | Add selected-table highlight (orange ring or filled background) to the active floor plan table. Add persistent applied badge on discount buttons. Show a "Replaced SC with PWD" warning before replacement. |
| 7 | **Gestalt: Proximity** | CONCERN | The Manager PIN modal is visually identical whether authorizing SC or PWD — same heading "Authorize Discount", same body text. When the PIN modal appears a second time (for PWD), the cashier has no context about what they're authorizing. "Are they re-authorizing SC? Applying PWD? Did the first PIN fail?" | PIN modal heading should name the specific discount: "Authorize Senior Citizen (20%)" or "Authorize PWD (20%)" — not the generic "Authorize Discount". |
| 8 | **Gestalt: Common Region** | CONCERN | The discount detail panel (qualifying persons stepper + ID input + photo attach + discount amount summary) is visually grouped but its relationship to the discount buttons above is unclear. After SC is applied and then PWD clicked, only the PWD panel shows — the SC panel disappears with no separation or indication. A cashier who entered SC data then applied PWD has lost their SC ID data invisibly. | Keep both SC and PWD panels visible simultaneously when both are authorized. Stack them with a clear separator. Graying out removed data is not sufficient — prevent silent data loss. |
| 9 | **Visual Hierarchy** (scale) | CONCERN | After both discounts are "applied", the summary shows: Subtotal ₱2,396 → PWD -₱107 → TOTAL ₱2,289. The missing SC line creates a false impression of a correct bill. A customer who asked for SC+PWD discount for two different guests sees ₱2,289 where they expected ₱2,182. The hierarchy shows the right structure but wrong (incomplete) data. | Fix the additive discount model first; then hierarchy will correctly reflect the sum. |
| 10 | **Visual Hierarchy** (contrast) | PASS | VAT Exempt row is now in subdued text below TOTAL — correct footnote treatment. SC/PWD ID input rows have clear hierarchy with small labels and prominent input fields. | — |
| 11 | **WCAG: Color Contrast** | UNVERIFIED | Could not inspect computed styles via playwright-cli. Based on previous audit findings (PASS after fixes), presumed passing for discount buttons and summary rows. | Run a dedicated contrast audit if new discount UI components were added in this release. |
| 12 | **WCAG: Touch Targets** | CONCERN | The Manager PIN stepper buttons (−, +) for "Qualifying Persons" show `[disabled]` on the − side with minimum pax=1. The + button appears accessible. The Authorize button in the PIN modal shows `[disabled]` until 4 digits are entered — this is correct gating. The "✕" close button on CheckoutModal remains a bare character (e648) — likely still <44px (KP-01 recurring). | Verify ✕ button meets 44px minimum. Consider replacing bare ✕ with `w-11 h-11 flex items-center justify-center` wrapper. |
| 13 | **Consistency** (internal) | FAIL | Two identical "Authorize Discount" PIN modals appear back-to-back for SC and PWD. Same heading, same body text, same numpad. The cashier cannot distinguish "this is for SC" from "this is for PWD". The Authorize button text is generic. Compare: PaxModal says "Confirm", AddItemModal says "CHARGE", CheckoutModal step says "✓ Confirm Payment" — the PIN modal breaks this naming specificity pattern. | Name the specific discount in the PIN modal title and description field. |
| 14 | **Consistency** (design system) | PASS | Payment method tabs, presets, and the discount panel all use the established `.btn` and `.pos-card` patterns. The qualifying-persons stepper follows the same −/N/+ convention as the PaxModal. ID input uses `.pos-input` style. Consistent with established design system. | — |

---

## C. "Best Day Ever" Vision

Friday night, 7 PM. Ate Rose is working solo at the counter while the kitchen team runs at full capacity. She has three tables open simultaneously: T1 (4 guests, 5 minutes in), T2 (2 guests, 2 minutes in), T3 (4 guests, just seated). The floor plan shows all three tables in orange with their running bills glowing. She can see at a glance — T1 has been dining the longest.

She helps a new customer find a seat (T6). While setting up T6, T1's family of four signals for the bill. She taps T1 on the floor plan. The sidebar instantly loads T1's order: Beef Unlimited, ₱2,396, 12 items. She hits Checkout. Leftover check — no leftovers, tap proceed. Payment screen opens with the TOTAL front and center, the Confirm Payment button always visible at the bottom.

The grandfather at T1 shows his Senior Citizen ID. Ate Rose taps the SC button. The Manager PIN modal asks for authorization — Sir Dan is nearby, enters 1234, confirms. The SC panel appears: she enters the grandfather's ID number, and the total drops to ₱2,289. The grandmother also has a PWD card. Ate Rose taps PWD. Sir Dan enters PIN again. The PWD panel appears, Ate Rose notes the grandmother's ID — but now she sees only ₱2,289 total, same as before. She pauses. Was the SC applied? Was the PWD applied instead? The family is watching. She's not sure. She calls Sir Dan again. A line is forming at T4.

In the ideal version, this moment is clear: both SC and PWD are applied to separate guests, two discount lines show in the bill, the total is ₱2,182, both ID fields are visible and filled. Ate Rose taps ₱2,200 cash, change is ₱18, she confirms. Done in under 45 seconds. T2 and T3 are still running, timer clearly showing their durations — she knows she has time. The floor plan's T1 now shows "PAID / clearing" and turns green. She moves to T4.

**Where the current implementation falls short:** The dual discount scenario breaks down into anxiety. Two separate PIN entries create a manager dependency bottleneck. When PWD replaces SC silently, Ate Rose cannot tell which discount is live, so she may attempt to re-apply SC, trigger a third PIN request, and the floor plan's live timers for T2 and T3 are ticking with no one attending them. Meanwhile, there is no indicator on the floor plan showing T1 is currently selected in the sidebar — if the Checkout modal is dismissed accidentally, she must guess which table to re-tap.

---

## D. Recommendations

---

##### [01] Senior Citizen and PWD discounts silently replace each other instead of stacking

**What:** When a cashier applies a Senior Citizen (20%) discount to a checkout and then applies a PWD (20%) discount on the same transaction, the SC discount panel disappears and is replaced by the PWD panel. The bill summary changes from "Senior Citizen 20% (1 of 4 pax) -₱107" to "PWD 20% (1 of 4 pax) -₱107" — same total, SC data erased. Neither button shows an "applied/active" state after authorization, so the cashier cannot confirm which discount is live.

**How to reproduce:**
1. Log in as Staff. Open T1 with Beef Unlimited (4 pax).
2. Tap Checkout → No Leftovers → Payment step.
3. Tap Senior Citizen (20%) → enter Manager PIN 1234 → Authorize.
4. Observe: SC panel appears with SC ID #1 input. Total becomes ₱2,289.
5. Tap PWD (20%) → enter Manager PIN 1234 → Authorize.
6. Observe: SC panel disappears, SC ID input is gone, PWD panel appears. Total remains ₱2,289 — only ONE discount is active despite two authorizations.

**Why this breaks:** A table of 4 where one guest is a Senior Citizen and another is a PWD should receive two separate 20% discounts on their respective pax prices: 1 SC = -₱107, 1 PWD = -₱107, total = ₱2,182. The current system only applies the last discount clicked. Ate Rose enters the Manager PIN twice, fills in one ID, but the customer is charged ₱107 more than their legal entitlement. Beyond the compliance risk, the cashier spent extra time and manager attention for no result — the second discount was silently discarded. In an audit, the missing SC discount authorization on the receipt creates a BIR compliance gap.

**Ideal flow:** SC and PWD discounts must be independently trackable. When both are applied:
- Bill summary shows both lines: "Senior Citizen (1 of 4 pax) -₱107" + "PWD (1 of 4 pax) -₱107"
- Total: ₱2,396 - ₱107 - ₱107 = ₱2,182
- Both SC ID panel and PWD ID panel visible simultaneously (scrollable)
- Both discount buttons show a persistent "applied" visual state (filled, not just :active)
- If the same pax cannot hold both (e.g., 1 SC + 1 PWD sharing the same seat), the system can show an info tooltip, but still allows applying to two different guests

**The staff story:** "I applied both the lolo's Senior ID and the lola's PWD card. I entered the PIN twice, entered names. But the total didn't go down the second time. I wasn't sure if both were applied. The family trusted me and I wasn't sure I gave them the right discount."

**Affected role(s):** Staff, Manager (PIN authority)

---

##### [02] Manager PIN required separately for each discount type — no authorization grace period

**What:** Every individual discount type triggers its own Manager PIN modal. Applying Senior Citizen and PWD discounts on the same bill requires two separate PIN entries. There is no grace period (e.g., "manager just authorized 30 seconds ago — no re-entry needed for next discount in same transaction"). Each PIN modal uses identical text: "Authorize Discount — All discounts require Manager PIN authorization."

**How to reproduce:**
1. Log in as Staff. Checkout any table.
2. On Payment step, tap Senior Citizen → Manager PIN modal appears.
3. Enter 1234 → Authorize. SC discount applied.
4. Immediately tap PWD → identical Manager PIN modal appears again.
5. Must enter 1234 again → Authorize PWD.

**Why this breaks:** In a busy multi-table scenario (3 tables open simultaneously), the manager is not always within arm's reach. Each PIN entry requires: (1) Ate Rose calls for Sir Dan, (2) Sir Dan leaves what he's doing, (3) walks to the counter, (4) enters PIN, (5) returns to his task. For a single checkout with both SC and PWD, this interrupt happens twice in the same transaction. At peak service (6–9 PM) with 3 tables open, both T2 and T3 guests may also need discounts — that's up to 6 manager PIN entries in quick succession, all while T1's waiting change is in Ate Rose's hand. The identical PIN modal text ("Authorize Discount") gives no contextual signal whether this is SC or PWD, so the manager cannot instantly confirm they're authorizing the right thing.

**Ideal flow:** Implement an authorization grace period: once a Manager PIN is successfully entered within the same CheckoutModal session (same table, same checkout), a 60-second window allows the next discount to be applied without re-authorization. Show a subtle "Manager authorized (Xsec remaining)" indicator. After the window expires, re-entry is required. The PIN modal should explicitly name the discount being authorized: "Authorize Senior Citizen (20%) for T1" and "Authorize PWD (20%) for T1" — not the generic "Authorize Discount". This maintains audit compliance (manager signs off on each discount type) while reducing the interruption count from N × (per discount) to 1 per transaction session.

**The staff story:** "Every time I click a discount, I have to call Sir Dan. For one table I called him twice because the customer had both a SC and PWD card. He's a good sport about it but I can see him rushing from the other side of the restaurant."

**Affected role(s):** Staff, Manager

---

##### [03] No selected-table indicator on floor plan — context ambiguity during multi-table management

**What:** When managing three simultaneously occupied tables, tapping an occupied table on the floor plan loads its order in the right-sidebar. However, the tapped table card shows no persistent "currently selected" visual state after the click. All three occupied table cards display identically (orange fill, same text layout). There is no border, ring, underline, or accent treatment distinguishing which table's order is currently showing in the sidebar.

**How to reproduce:**
1. Open three tables (T1, T2, T3) with packages.
2. Tap T1 → sidebar loads T1's order.
3. Look at the floor plan: T1, T2, T3 all appear visually identical.
4. Tap T2 → sidebar instantly switches to T2's order.
5. Without looking at the sidebar header, you cannot determine which table is active from the floor plan alone.

**Why this breaks:** In a 3-table scenario, Ate Rose is visually tracking all tables simultaneously. Her mental model links "the table I tapped" to "the order showing in the sidebar." The moment she gets interrupted (new customer walks in, phone rings, kitchen calls), that mental link breaks. When she returns to the screen, she sees three orange table cards and one bill in the sidebar. She must read the sidebar header ("T1", "T2", or "T3") to re-establish context — a micro-interrupt that takes 1–2 seconds per reorientation. Over an 8-hour shift with 60 table interactions per hour, those micro-interrupts compound. During the 30 seconds of a checkout flow (Leftover Check → Payment → Confirm), the floor plan is still visible — and no table shows as "in checkout" versus "available to click."

**Ideal flow:** The currently selected/active occupied table should have a visible selection ring or accent border — `ring-2 ring-accent` (orange) around the card, or a deepened background shade. This persists until the cashier taps a different table. During an open CheckoutModal, the table being checked out should show a distinct state (e.g., `ring-2 ring-status-green` or a pulsing green accent) to communicate "this table is mid-checkout — clicking another table won't affect this transaction."

**The staff story:** "When I have three tables going, sometimes I look at the screen and I'm not sure whose bill I'm looking at. I always have to check the little label at the top of the sidebar to see which table it is."

**Affected role(s):** Staff

---

##### [04] CheckoutModal open while other tables' timers run — no "on hold" signal for other tables

**What:** When a cashier opens the CheckoutModal for T1, the modal appears as a full-screen overlay (with blurred background). The floor plan and takeout queue remain visible in the background. T2 and T3 continue running their elapsed-time counters. There is no signal to other staff or customers that T1 is "in checkout" — the floor plan still shows T1 as a normal occupied table, no "billing" or "checkout in progress" state. More critically, the cashier cannot quickly dismiss the CheckoutModal to attend to T2 (e.g., a refill request) without abandoning the checkout flow entirely.

**How to reproduce:**
1. Open T1, T2, T3 with packages.
2. Tap T1 → Checkout → complete Leftover Check → arrive at Payment step.
3. Observe: T2 and T3 table cards continue ticking in the background. T1 shows no "BILLING" state.
4. If a kitchen alert fires for T2 during checkout, there is no way to acknowledge it without pressing Cancel on T1's checkout.

**Why this breaks:** During a rushed dinner service with 3 tables, Ate Rose is in the middle of T1's payment entry when T2's kitchen alert fires (refused item) or when T3's guests wave for refills. She cannot pause T1's checkout to acknowledge T2's alert — she must either ignore it (KP-03 pattern: cross-role handoff failure) or cancel the entire checkout flow and restart. A partial checkout (state where payment amount was entered but not confirmed) also clears on cancel — she loses the cash amount she entered. The T1 table shows no visual "checkout in progress" indicator on the floor plan, so a manager or second cashier walking by has no situational awareness of what's happening.

**Ideal flow:** When CheckoutModal is open, T1's floor plan card should show a distinct "BILLING" state (e.g., a green pulsing ring or a `CHECKOUT` label in the card). The CheckoutModal should support a minimal "hold" state: if the cashier taps outside the modal (or presses a "Hold" button), the current payment amount and discount selections are preserved, the modal minimizes to a banner at the bottom of the sidebar, and the cashier can attend to T2/T3. Tapping the banner restores the full CheckoutModal. This requires no data persistence beyond in-memory state — the RxDB order record doesn't need to change.

**The staff story:** "Once I was in the middle of typing the cash amount for T1 and the kitchen buzzed about T3. I had to cancel the whole payment screen and re-enter everything when I came back. The customers at T1 waited while I sorted it out."

**Affected role(s):** Staff

---

##### [05] Manager PIN modal text is generic — no discount-specific context for the manager

**What:** The "Authorize Discount" modal appears with identical heading, body text, and numpad for every discount type — Senior Citizen, PWD, Promo, Comp, Service Recognition. The body text reads: "All discounts require Manager PIN authorization. Enter PIN to apply." The manager cannot tell from the modal alone whether they are authorizing a statutory discount (SC/PWD — subject to BIR logging requirements) or a business discount (Promo/Comp — subject to different reporting rules).

**How to reproduce:**
1. Log in as Staff. Checkout T1 to Payment step.
2. Tap Senior Citizen → PIN modal appears: "Authorize Discount."
3. Enter and cancel, then tap PWD → identical PIN modal: "Authorize Discount."
4. Enter and cancel, then tap Promo → identical PIN modal: "Authorize Discount."

**Why this breaks:** The manager entering the PIN should know immediately: "Is this a Senior Citizen discount that I'm legally authorizing under RA 9994? Or is this a promotional discount that the manager pre-approved last week?" The identical modal text requires the manager to ask the cashier "what discount is this?" — creating unnecessary verbal confirmation overhead during a busy service. In a BIR audit, the authorization trail should clearly link each PIN entry to the specific discount type for a specific pax count on a specific order. Generic "Authorize Discount" text weakens that audit trail's legibility. The manager may also accidentally authorize a comp or service recognition discount they weren't aware of, since the modal gives no context.

**Ideal flow:** The PIN modal should always specify: the discount name, the pax count being discounted, and the estimated amount. Example: "Authorize Senior Citizen (20%) for 1 of 4 guests at T1 — reduces total by ₱107.00." This gives the manager the full picture before committing. Adds zero extra steps; it's purely a copy and data-binding change.

**The staff story:** "Sir Dan always asks me 'which discount is this?' when the PIN screen comes up. I have to tell him every time. It would be easier if the screen just said 'Senior Citizen' so he doesn't have to ask."

**Affected role(s):** Staff, Manager

---

##### [06] When PWD replaces SC, the SC ID input data is silently lost — no data preservation warning

**What:** After a cashier applies a Senior Citizen discount and begins entering the SC ID number in the input field, if they then tap the PWD button (triggering its own PIN authorization), the SC ID field and SC qualifying-persons panel disappear entirely. Any SC ID data entered is silently lost. The checkout can then proceed with PWD data only — no record of the SC authorization attempt.

**How to reproduce:**
1. Checkout T1 → Payment step → tap Senior Citizen → enter PIN → SC panel appears.
2. Begin typing an SC ID number in "SC ID #1" (e.g., "123456").
3. Tap PWD (20%) → PIN modal appears.
4. Enter PIN → Authorize → PWD panel replaces SC panel. "SC ID #1: 123456" is gone.

**Why this breaks:** The cashier spent time (1) calling for the manager's PIN for SC, (2) asking the guest for their SC ID number, (3) typing it. That work is erased without warning when PWD is applied. In a rushed checkout, the cashier may not notice the SC ID panel is gone. The receipt is issued without the SC ID record, creating a BIR compliance gap (RA 9994 requires that SC IDs be recorded on the transaction). The guest, already an elder, may have already returned their card to their wallet. Recovering the number requires re-asking — an awkward and time-consuming interaction for both parties.

**Ideal flow:** If a second discount type is applied while data is present in the first discount's panel, the system should: (1) Ask "You have SC applied with ID data. Do you want to keep SC and add PWD as a separate guest discount? Or replace SC with PWD?" — with clear "Keep Both" and "Replace" options. (2) If replacing: show a confirmation warning "The SC ID data for this transaction will be cleared." (3) If keeping both: display both SC and PWD panels simultaneously. Never silently discard data the cashier deliberately entered.

**The staff story:** "I typed in the SC card number and then clicked PWD for the lola. When I looked again, the SC number I entered was gone. I had to ask lolo to show me his card again. He had already put it away. It was embarrassing."

**Affected role(s):** Staff

---

## Fix Checklist (for `/fix-audit`)

- [x] [01] — Implement additive SC+PWD discount stacking (separate pax, separate panels, combined total)
  **Fixed:** Fixed in CheckoutModal.svelte — discounts now stack as independent entries; PIN modal shows discount-specific title/amount; 60s grace window after first discount PIN
- [x] [02] — Add 60-second Manager PIN grace period within a single checkout session; name the specific discount in the PIN modal
  **Fixed:** Fixed in CheckoutModal.svelte — discounts now stack as independent entries; PIN modal shows discount-specific title/amount; 60s grace window after first discount PIN
- [ ] [03] — Add selected-table ring/accent to the active floor plan table card; add "BILLING" state during open CheckoutModal
- [ ] [04] — Add "hold" state for CheckoutModal (preserves payment input, minimizes to sidebar banner)
- [x] [05] — PIN modal: replace generic "Authorize Discount" with discount-specific heading + amount preview
  **Fixed:** Fixed in CheckoutModal.svelte — discounts now stack as independent entries; PIN modal shows discount-specific title/amount; 60s grace window after first discount PIN
- [x] [06] — Warn before clearing SC/PWD ID data when switching discount types; offer "Keep Both" option
  **Fixed:** Fixed in CheckoutModal.svelte — discounts now stack as independent entries; PIN modal shows discount-specific title/amount; 60s grace window after first discount PIN

---

## E. Structural Proposals

---

##### [SP-01] Discount Section: Single Authorize → Multi-Discount Panel

**Problem pattern:** Issues [01], [02], [05], and [06] share a root cause: the discount system models authorization as "one active discount" per checkout, implemented likely as a single `activeDiscount` state variable. This was designed for single-discount transactions but breaks for the common multi-pax scenario (different guests with different discount types).

**Current structure:**
```
discounts: {
  activeType: 'senior' | 'pwd' | 'promo' | null  // single active type
  qualifyingCount: number
  ids: string[]
}
```

**Proposed structure:**
```
discounts: Map<DiscountType, {
  qualifyingCount: number
  ids: string[]
  authorizedAt: Date
  authorizedBy: string  // manager name from session
}>
```

**Why this fixes the cascade:** With a Map keyed by discount type, SC and PWD are independent entries. Applying PWD doesn't touch the SC entry. The UI renders a panel for each key present in the Map. The authorization grace period becomes a per-type `authorizedAt` timestamp check. The bill summary renders a row for each entry. The total deduction is the sum of all entries. No entry is silently overwritten — adding PWD inserts a new key, it doesn't replace the SC key.

**BIR compliance gain:** Each discount entry in the Map logs `authorizedBy` and `authorizedAt` — the receipt can print each line with the manager's name and authorization time. This is the format BIR auditors expect for multi-discount transactions.

**Implementation scope:** `src/lib/stores/pos/payments.svelte.ts` (discount state) + `src/lib/stores/pos/payment.utils.ts` (discount math) + `CheckoutModal.svelte` (UI — render all Map entries as stacked panels). No RxDB schema change needed — the existing `orders` schema can store the discount map as a JSON string on the order record.

**Affected roles:** Staff (primary), Manager (authorization authority), Owner/Admin (BIR audit trail)

---

## Structural Proposals Checklist

- [ ] [SP-01] — Refactor discount state from single activeType to Map&lt;DiscountType, DiscountEntry&gt; for proper multi-discount support

---

## Regression Summary (from previous audit)

| Previous Issue | Status |
|---|---|
| [SP-01] Sticky footer (Confirm Payment always visible) | ✅ FIXED |
| [01] Confirm Payment hidden below fold | ✅ FIXED (by SP-01) |
| [05] No search in Dishes tab | ✅ FIXED |
| [06] "10 requesting" → ambiguous label | ✅ FIXED (now "10 pending") |
| [08] VAT layout false-addition impression | ✅ FIXED (VAT shown as footnote) |
| [10] Adults chips exceed table capacity | ✅ FIXED (chips capped at capacity) |
| [02] Dine-In toggle disguised as badge | ⬜ NOT VERIFIED this session |
| [03] 9px badge text in OrderSidebar | ⬜ NOT VERIFIED this session |
| [04] WEIGHING badge bleeds to cashier | ⬜ NOT VERIFIED this session |
| [07] min-height:unset on close/Exact buttons | ⬜ NOT VERIFIED this session (close ✕ still bare character) |
| [09] "FREE — inventory tracked" badge | ⬜ NOT VERIFIED this session |
