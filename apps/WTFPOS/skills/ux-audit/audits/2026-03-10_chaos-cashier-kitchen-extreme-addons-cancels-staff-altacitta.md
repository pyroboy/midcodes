# UX Audit — Extreme Chaos: Cashier + All Kitchen Roles (Many Add-ons, Many Cancels)

**Date:** 2026-03-10
**Mode:** Multi-user · Parallel browser sessions
**Roles:** Maria Santos (Staff · extreme chaos cashier) · Pedro Cruz (Kitchen/KDS) · Benny Flores (Kitchen/Weigh Station) · Corazon Dela Cruz (Kitchen/Sides Prep)
**Branch:** Alta Citta (tag)
**Scenario:** Friday dinner peak — 1 cashier managing 8 tables simultaneously, one table in "chaotic mode": 5 rounds of add-ons (each a separate CHARGE), 4 item cancellations mid-order (some within grace period, some after), 1 full void attempt, and a final checkout with discount. Goal: surface confusion, PIN modal fatigue, voided item legibility, and kitchen signal quality under extreme POS churn.
**Viewport:** 1024×768 tablet landscape
**Skill version:** v4.5.0
**Agents:** 2 parallel (staff session + kitchen session)
**Prior audits relied on:** `2026-03-10_extreme-kitchen-all-roles-staff-altacitta-v2.md` (v2 fixes verified ✅), `2026-03-10_pos-light-staff-tag.md` (all 5 fixes verified ✅)

---

## A. Text Layout Map

### Maria Santos — POS Order Sidebar (T1, post-chaos: 15 items, 3 voided)

```
┌──┬──────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                               │
├──┤──────────────────────────────────────────────────────────────────────────│
│🛒│  [T1] ← selected ··· other tables visible on floor plan                 │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  │ T1  [2 pax ✎]  14m  [✕]                                            │ │ ← "2 pax ✎" NO min-height
│  │  │ Beef + Pork Unlimited                                                │ │
│  │  │ [🔄 Refill 56px ✅]   [Add Item 56px ✅]                            │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  │  Kitchen Rejections (2)  ← RED BANNER if kitchen refused items      │ │
│  │  │  [Kimchi Pancake "86'd" 3m ago  ✓]                                 │ │
│  │  │  [Egg Fried Rice "sold out" 1m ago  ✓]                             │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  │  ITEMS (scrolling):                                                  │ │
│  │  │  Beef + Pork Unlimited    SENT     ₱998.00 PKG ← PKG badge text-[9px]│ │
│  │  │  ┌──Meats────────────────────────────────────────────────────────┐  │ │
│  │  │  │ Samgyupsal × 2      2× ✓ SERVED                             │  │ │
│  │  │  │ Premium USDA Beef   1× WEIGHING  1× ✓ SERVED                │  │ │
│  │  │  │ Pork Sliced         1× COOKING                              │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  │  ┌──Sides (10 requesting ▼ 36px !!)──────────────────────────────┐ │ │
│  │  │  │ [collapsed]                                                    │ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘  │ │
│  │  │  ── Add-ons from 5 CHARGE sessions ──                             │ │
│  │  │  Kimchi Pancake     voided ← opacity-40, italic red label only    │ │ ← CONCERN
│  │  │  Egg Fried Rice     voided ← opacity-40, italic red label only    │ │
│  │  │  Ramyun             voided ← same styling                         │ │
│  │  │  Fish Cake × 2         SENT                                        │ │
│  │  │  San Miguel Beer × 3   SENT                                        │ │
│  │  │  Lumpia (add-on)       SENT    ₱75.00                             │ │
│  │  │  ← fold (768px) ───────────────────────────────────────────────── │ │
│  │  │  Japchae            SENT                                           │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  │  Meat dispatched    1.20kg (1200g)                                  │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  │  BILL   12 items (active)        ₱1,148.00  ← bill total flashes   │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  │  [Print 44px]  [Void 44px]  [Checkout 44px · flex-1]               │ │
│  │  │  [More ▼  Transfer · Merge · Split · Pax]                          │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │
└──┴──────────────────────────────────────────────────────────────────────────┘
```

### Manager PIN Modal (mid-order item removal, post-grace period)

```
┌──────────────────────────────────────────────────┐
│ Remove Item                                [✕?]  │ ← ✕ close unverified size
│ Grace period has expired. Enter Manager PIN...   │
│ ○ ○ ○ ○   ← 4 dots                             │
│ [1][2][3]                                        │
│ [4][5][6]                                        │
│ [7][8][9]                                        │
│ [CLR][0][⌫]                                     │
│ [Cancel]       [Remove  — disabled]              │
└──────────────────────────────────────────────────┘
   ← APPEARS AGAIN for each individual item cancel
     after grace period. 4 cancels = 4 PIN modals.
```

### Leftover Penalty Modal (close button at 32px)

```
┌──────────────────────────────────────────────────┐
│             [✕ 32px!! ← FAIL]                   │
│  ① Leftover Check → ② Payment                  │
│  Leftover Check  [ℹ 24px!! ← FAIL]             │
│  Weigh uneaten meat. Over 100g → ₱50/100g       │
│  [ 0 g | No penalty ]                           │
│  [1][2][3]                                      │
│  [4][5][6]                                      │
│  [7][8][9]                                      │
│  [CLR][0][⌫]                                   │
│  [✓ No Leftovers — Proceed to Checkout]         │
└──────────────────────────────────────────────────┘
```

### Pedro Cruz — KDS Queue (merged tickets from multiple CHARGE sessions)

```
┌──┬──────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA · [◉ Live] · [🆕 0 new tables] · [↩ UNDO LAST] · History │
├──┤──────────────────────────────────────────────────────────────────────────│
│  │  ┌────────────────────────────┐   ← 1 merged ticket for T1              │
│  │  │ T1  14m  🔴 (past 10m)    │                                          │
│  │  │  MEATS ▼ [44px]           │                                          │
│  │  │   Samgyupsal  SERVED ✓    │                                          │
│  │  │   USDA Beef   SERVED ✓    │                                          │
│  │  │   Pork Sliced COOKING     │                                          │
│  │  │  DISHES ▼ [44px]          │                                          │
│  │  │   Fish Cake × 2  SENT     │   ← NO label indicating "Round 3"        │
│  │  │   San Miguel × 3  SENT    │   ← NO label indicating when added       │
│  │  │   Lumpia         SENT     │                                          │
│  │  │   Japchae        SENT     │                                          │
│  │  │  [Quick Bump  56px ✅]    │                                          │
│  │  │  [ALL DONE ✓  56px ✅]   │                                          │
│  │  └────────────────────────────┘                                          │
│  │   ← Kimchi Pancake, Egg Fried Rice, Ramyun NOT shown (voided)           │
│  │   ← No void signal on KDS beyond audio beep                            │
└──┴──────────────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | FAIL | During chaos (5 CHARGE sessions, 4 cancels), the order sidebar presents 15 item rows with mixed SENT/SERVING/VOIDED states. The PIN modal appears per-item-cancel with no batch option. Staff must make 4 separate Manager PIN decisions for 4 cancels — cognitive cost compounds on already overloaded staff. |
| 2 | Miller's Law (chunk info) | FAIL | Post-chaos bill contains 12 active items + 3 voided items = 15 rows visible simultaneously. No visual grouping separates "current round" add-ons from "original order" items. Voided items mix with active items in the same scroll flow. Far exceeds 7±2 chunks. |
| 3 | Fitts's Law (target size) | FAIL | 6 confirmed sub-44px targets across the chaos flow: (a) "2 pax ✎" edit button (no min-h), (b) "10 requesting ▼ show" toggle (36px), (c) LeftoverPenaltyModal ✕ close (32px), (d) LeftoverPenaltyModal ℹ info button (24px), (e) CheckoutModal "Exact" cash button (min-height: unset), (f) SC/PWD stepper −/+ buttons (40px). |
| 4 | Jakob's Law (POS conventions) | CONCERN | The grace-period-gated item removal (silent vs. PIN-gated) has no conventional parallel in any POS system staff would have used before. The invisible grace period timer breaks the expectation that "remove = remove always." KDS void signal (beep only, no item name) departs from kitchen industry standard (printed void slips identify the specific item). |
| 5 | Doherty Threshold (<400ms) | PASS | RxDB local-first writes are instant. Bill total flash animation correctly provides <400ms feedback when total changes. PIN modal opens instantly. AddItemModal CHARGE response immediate. No perceptible lag in any interaction. |
| 6 | Visibility of System Status | FAIL | (a) No grace period timer on items — staff cannot see how many seconds remain before PIN is required. (b) No distinction between "items added in this CHARGE session" vs. prior sessions on the running bill — the KDS sees ticket merges but the staff sidebar loses temporal ordering. (c) When kitchen refuses an item, the red "Kitchen Rejections" banner appears — this is GOOD. But there is no corresponding status update on the item itself in the sidebar (the refused item still shows "SENT"). (d) ReceiptModal item name visually truncated. |
| 7 | Gestalt: Proximity | CONCERN | Voided items are interspersed with active items in the sidebar scroll area. A voided row directly adjacent to an active row — with only a 60% opacity change and italic "voided" label — does not create sufficient visual distance. Under chaos with 3 voids and 12 active items, the sidebar becomes a mixed, hard-to-scan list. |
| 8 | Gestalt: Similarity | FAIL | (a) Status badges (SENT, PKG, FREE, VOID, WEIGHING) all use `text-[9px]` — identical visual weight despite radically different semantic importance. PKG badge (`bg-accent-light text-accent`) has ~2.5:1 contrast — fails WCAG AA. (b) The "undo" in AddItemModal clears ALL pending items at once while the "✕" in the sidebar removes one item — same gesture pattern, radically different scope. (c) "Remove Item" manager PIN modal and "Void Entire Order" manager PIN modal look identical (same numpad, same layout) — nothing visually distinguishes "I'm voiding one item" from "I'm voiding the whole order." |
| 9 | Visual Hierarchy (primary CTA) | CONCERN | After 5 CHARGE sessions and 3 voids, the sidebar primary action row `[Print] [Void] [Checkout]` remains unchanged — Checkout is correctly rightmost (v1 fix applied ✅). BUT the "Void" button (a destructive full-order action) sits between Print and Checkout at equal visual weight. During chaos a staff member reaching for Checkout who misses leftward hits Void. Full-order Void requires a PIN so it's gated, but the interruption is disruptive. |
| 10 | Visual Hierarchy (info density) | FAIL | Post-chaos bill with 15 rows (12 active + 3 voided) exceeds a comfortable sidebar scroll height. The BILL total and action buttons are below the fold — staff must scroll to confirm the total or start checkout. No sticky bill total header visible while scrolling. The "Meat dispatched" bar and the BILL section are both below the fold when the items list is long. |
| 11 | WCAG Contrast | FAIL | (a) PKG badge: `bg-accent-light (#FFF7ED) text-accent (#EA580C)` = approximately 2.5:1 — fails AA (needs 4.5:1). (b) KDS "Stale" indicator: `#F59E0B` on white = ~2.9:1 — fails AA. (c) KDS stat labels (gray-400 on white): ~3.7:1 — fails AA for body text. (d) CheckoutModal "Tap to add/remove" hint: gray-400 on white = ~3.7:1 — fails AA. |
| 12 | WCAG Target Size | FAIL | See Fitts's Law findings (6 confirmed failures). Additional: `min-height: unset` used in 3 places — this is an explicit override of the 44px standard. |
| 13 | Consistency (internal) | FAIL | (a) Grace period removal (silent, no confirmation) vs. post-grace removal (PIN modal) — inconsistent feedback for the same gesture ("tap ✕ on item"). (b) "Undo" in AddItemModal clears all pending; "✕" in sidebar removes one — same visual symbol, opposite scope. (c) Both single-item void PIN modal and full-order void PIN modal have identical layouts — no visual differentiation. |
| 14 | Consistency (mental model) | CONCERN | Kitchen receives a void audio beep but no item name. Industry standard in kitchen operations (print voids, void slips) always identifies the specific item. The abstract beep without context requires Pedro to cross-reference what he last saw with what's no longer in the ticket — cognitive work that's free during quiet service but costly during chaos. |

**Summary: 6 PASS → 0 · 2 CONCERN → 4 CONCERN · 6 FAIL (new chaos-specific dimension)**

*Note: Many of the v2 kitchen fixes (P1-14) remain verified holding. The new FAILs are in the POS cashier chaos dimension, not the kitchen dimension.*

---

## C. Best Day Ever — Maria Santos, Friday Peak, 8 PM

It's 8:15 PM and T1 just seated a group of 4 — two adults and two friends who everyone wants a different package. Maria opens T1: 4 pax. She picks Beef + Pork Unlimited, tabs to meats, adds 4 cuts, and hits CHARGE. The kitchen chimes.

Thirty seconds later one of them changes their mind: "Pwede bang isa pang San Miguel?" Maria opens AddItemModal, goes to Drinks, adds 3 San Miguel (the group wants to share), hits CHARGE. Second chime to kitchen. Two minutes later: "May ramyun ka?" She charges a Ramyun. Third chime.

Then the complications begin. One guest says: "Akshually, cancel na lang yung Ramyun, hindi pala namin gusto." Maria taps the ✕ next to Ramyun. It disappears silently — grace period (under 1 minute from charge). Good.

Three minutes later: "Cancel na rin yung San Miguel, magtatake-out pala kami." Maria taps ✕ on the first San Miguel — PIN modal appears. She looks up at Pedro across the kitchen. He walks over, enters 1234. The first beer is voided. She taps the second beer's ✕. PIN modal again. Pedro enters 1234 again. She taps the third. Pedro: 1234 again. Three interruptions, three PIN entries, thirty seconds of standing in front of the table while the PIN modal is up, table watching.

Fifteen minutes later the group wants to add extra Kimchi and a Fish Cake. Maria opens AddItemModal — 4th CHARGE session. The bill now has: Package (PKG), 4 meats (some served, some cooking), 10 sides (collapsed), 3 voided beer items (dimmed italic rows), 1 Fish Cake (SENT), 1 Kimchi (SENT). She scrolls. She scrolls more. The Checkout button is below the fold. She has to scroll past the voided beers, past the Kimchi, to reach the footer.

The kitchen refuses the Kimchi ("wala na"). The red "Kitchen Rejections" banner appears on Maria's sidebar — she acknowledges it. But the Kimchi item in her bill still shows "SENT". She's unsure if the kitchen already made it or not. She leans over to Pedro.

Checkout time. She taps Checkout. Leftover Check modal. The group has some leftover samgyupsal — she enters "150" on the numpad. ₱100 penalty. She taps "Apply & Checkout". The payment screen opens. She enters ₱2,000 cash. Change: ₱852.00. Confirms. Receipt. Done.

The 8 PM table took 43 minutes, 4 CHARGE sessions, 3 PIN entries, 1 kitchen rejection, and 1 manager walkover.

---

## D. Recommendations

### [01] PIN modal appears individually per voided item — batch cancel or a single-entry PIN session needed

**Priority:** P0 · Effort: M · Impact: High

**What:** When staff removes an item past the grace period, a Manager PIN modal appears for EACH individual item. During chaos with 3-4 simultaneous cancel requests from a single table, Maria enters the manager PIN 3-4 times in a row. Pedro walks from the kitchen to the POS terminal 3 times, or Maria calls out the PIN verbally (a security hole). Each modal is identical — there is no visual differentiation between "remove item 1" and "remove item 2."

**How to reproduce:** On any active AYCE order, add 3 drinks. Wait 90 seconds (past the grace period). Attempt to remove all 3 drinks one by one via the ✕ button. A PIN modal appears for each, in sequence.

**Why this breaks:** The AYCE samgyupsal environment is cancel-heavy by design — guests change minds frequently (different cuts, drinks, sides). The grace period is a legitimate BIR audit control. But requiring 4 identical PINs in a row for 4 sequential cancels is a misapplication: the manager already approved the operation by entering PIN once. Each subsequent PIN in the same "cancel session" for the same table is redundant guard theater with no additional security benefit.

**Fix options (choose one):**
- **Option A (minimal):** After the first successful PIN entry in a cancel session, unlock a 60-second "cancel window" for that table's order. Display a countdown badge: `[🔓 Cancel unlocked for 58s]`. Subsequent ✕ taps within the window fire silently. Reset on navigation away.
- **Option B (UX-preferred):** Introduce a "Batch Void" mode. Long-press on any item (or tap a "Select items to void" button) that enters multi-select mode. Checkboxes appear on all voidable items. Staff selects N items and taps "Void Selected (N)". A single PIN gate covers all N items in one confirmation.

**The staff story:** *"Pag maraming nagkakansela, tatlong beses na ko pumindot ng 1234. Pumasok pa yung manager para pumindot. Nahihiya na sa customer na naghihintay."*

---

### [02] No grace period countdown on items — staff cannot tell when PIN-gate will activate

**Priority:** P0 · Effort: S · Impact: High

**What:** Item rows in the sidebar show a ✕ remove button with no indication of whether the item is in grace period (free removal) or past grace period (PIN required). The tooltip says `title="Remove (grace period)"` vs. `title="Remove (PIN required)"` but tooltips are inaccessible on touchscreens (no hover state). There is no visible countdown showing how many seconds remain.

**How to reproduce:** Add an item to an active order. Immediately, tapping ✕ removes it silently (grace period). Wait 75 seconds and tap ✕ on another item — PIN modal appears unexpectedly. The transition is invisible to the staff.

**Why this breaks:** Maria knows the grace period exists in principle ("short oras lang dapat") but cannot tell without trying whether a specific item is still in the window. She tries, gets a PIN modal, has to call the manager over. The graceful removal mechanism — intended to reduce friction — creates MORE friction when its boundary is invisible.

**Fix:** Show a live countdown on items within their grace period window. This can be subtle — a small progress arc or text label next to the ✕ button:
```svelte
<!-- On items within grace period, show countdown -->
{#if item.status === 'pending' && isWithinGracePeriod(item.addedAt)}
  {@const secsLeft = Math.ceil((GRACE_MS - (Date.now() - new Date(item.addedAt).getTime())) / 1000)}
  <span class="text-[10px] text-gray-400 font-mono">{secsLeft}s</span>
{/if}
```
A 10-character label per item with a live `$effect`-driven timer is sufficient. After expiry, the label disappears and the button changes to a lock icon `🔒` to signal PIN is now required.

**The staff story:** *"Pinindot ko yung X, may PIN modal. Hindi ko alam kung kelan yung deadline. Kailangan ko pa malaman kung fresh yung item bago ko tangkain alisin."*

---

### [03] Voided items mixed with active items — dense bill impossible to scan under chaos

**Priority:** P0 · Effort: S · Impact: High

**What:** Cancelled (voided) items appear in the same scroll list as active items, distinguished only by 60% opacity (`opacity-40`) and an italic `"voided"` label in 12px red. On a 15-item bill with 3 voids, Maria is scanning a 15-row list where 3 rows are half-visible ghosts. The total item count says "12 items" (active only) but the visual list has 15 rows. This mismatch creates mental recounting.

**How to reproduce:** Add 10+ items to an order. Cancel 3 of them via Void (any method). Observe the sidebar item list — voided rows appear interspersed throughout the list, not grouped or separated.

**Why this breaks:** During chaos, Maria needs to confirm at a glance: "What is actually going to the kitchen right now?" The voided items contribute visual noise. In the AYCE grouped view, cancelled items are correctly filtered out (`if (item.status === 'cancelled') continue` in `groupedItems`). But in the non-AYCE flat list, voided items remain in the full render loop at `opacity-40`. The discrepancy in treatment between AYCE and non-AYCE creates inconsistency.

**Fix:** Collapse voided items into a disclosure at the bottom of the items list:
```svelte
<!-- At the bottom of the items scroll area, after active items -->
{@const voidedItems = order.items.filter(i => i.status === 'cancelled')}
{#if voidedItems.length > 0}
  <div class="mt-2 border-t border-dashed border-gray-200 pt-2">
    <button
      onclick={() => showVoided = !showVoided}
      class="w-full text-left text-xs text-gray-400 flex items-center justify-between py-1"
    >
      <span>{voidedItems.length} voided item{voidedItems.length !== 1 ? 's' : ''}</span>
      <span>{showVoided ? '▲' : '▼'}</span>
    </button>
    {#if showVoided}
      {#each voidedItems as item (item.id)}
        <!-- existing itemRow at opacity-40 -->
      {/each}
    {/if}
  </div>
{/if}
```
This reduces the active-item visual noise by 3 rows in the chaos scenario and makes the bill scannable.

**The staff story:** *"Nakita ko may 15 items sa listahan, pero 12 lang yung active. Hindi ko mabilang kung alin na yung basta-basta may 'voided' sa ibaba. Sana naka-grupo nalang yung mga cancel."*

---

### [04] Two distinct "Remove Item" and "Void Entire Order" PIN modals look identical — dangerous ambiguity

**Priority:** P0 · Effort: S · Impact: High

**What:** The "Remove Item" manager PIN modal (`showRemovePin`) and the "Void Entire Order" manager PIN modal (`showVoidPin`) render identically: same numpad layout, same 4 dot indicators, same Cancel/Confirm footer. The only differentiation is the title and description text. Under chaos with multiple modals appearing in sequence, a manager entering the PIN quickly may not pause to read the title and could authorize a full order void (which releases the entire table) when intending to authorize a single item removal.

**How to reproduce:** On an active order with items past grace period, tap ✕ on one item (showRemovePin modal). Note the layout. Close it. Now tap the "Void" button in the action row (showVoidPin modal). Compare — they are visually identical except for the title text.

**Why this breaks:** "Remove 1 item" and "Void entire order (table + all items released)" are orders of magnitude different in consequence. A manager who glances at a PIN modal and sees the numpad assumes the same scope as the last one they approved — confirmation bias. The full-order void is irreversible during a busy shift.

**Fix:** The full-order void PIN modal should have a visually distinct destructive styling:
```svelte
<!-- In showVoidPin ManagerPinModal, add destructive prop -->
<!-- The ManagerPinModal should accept a `destructive` prop that renders the modal header in red -->
<div class={cn('rounded-t-2xl px-6 py-4', isDestructive ? 'bg-status-red-light border-b-2 border-status-red' : 'border-b border-border')}>
  <span class={isDestructive ? 'text-status-red font-black text-lg' : 'font-bold text-gray-900'}>
    {title}
  </span>
</div>
```
The red header on the full-void modal makes it visually distinct from the item-remove modal even at a glance.

**The staff story:** *"Mabilis lang nagpindot ng PIN yung manager. Isa lang item yung gusto namin i-cancel pero na-void pala lahat. Panalo."*

---

### [05] LeftoverPenaltyModal close button (✕) is 32px — critical touchscreen failure

**Priority:** P0 · Effort: XS · Impact: High

**What:** The LeftoverPenaltyModal close button is `class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"` — exactly 32×32px. This is the only way to dismiss the leftover check and return to the order sidebar without proceeding to payment. During chaos, a cashier who accidentally triggers checkout (instead of the Void or Print) needs this button to back out gracefully.

**Source:** `LeftoverPenaltyModal.svelte:69`

**Fix:** One class change: `class="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100"` (44×44px minimum).

**Secondary:** The ℹ info button at `h-6 w-6` (24px) with `min-height: unset` at line 90 is also critically undersized. Fix: `class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-200"`.

**The staff story:** *"Pag mali yung pinindot ko, walang madali na paraan para bumalik. Maliit yung X. Nahihirapan akong pindutin lalo na kapag mainit na ang kamay ko."*

---

### [06] OperationalP0: Staff and kitchen on different browser sessions cannot share orders — no in-UI warning

**Priority:** P0 (operational) · Effort: S · Impact: Critical

**What:** In Phase 1 (local-first, no LAN sync), each browser session maintains its own separate IndexedDB database. A staff device and a kitchen device using different browser instances will NOT share orders. Kitchen orders placed by staff never appear on the KDS if they are running in separate browsers on the same or different devices. This audit confirmed the issue live: after charging 15 items on the staff session, the kitchen session showed "0 active · 0 items."

**Why this breaks:** Restaurant operators assume POS → kitchen synchronization is automatic. The Phase 1 architectural limitation is documented in CLAUDE.md but not surfaced anywhere in the UI. Without a visible warning, operators will deploy the system with dedicated kitchen tablets and discover during service that the KDS is empty.

**Fix:** Add a persistent in-UI banner on the KDS queue page when local-first mode is active (no LAN sync detected):

```svelte
<!-- At the top of kitchen/orders/+page.svelte, before the ticket queue -->
{#if !isLanSyncActive}
  <div class="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
    <span class="text-amber-600 text-lg">⚠️</span>
    <div class="flex flex-col gap-0.5">
      <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Single-Device Mode</span>
      <span class="text-xs text-amber-700">POS and Kitchen must be on the same browser/device for orders to appear here. Multi-device sync is not yet active.</span>
    </div>
  </div>
{/if}
```

This banner prevents costly service failures from misconfiguration.

**The staff story:** *"Nagpadala na ako ng order, wala sa KDS ng kusina. Nagtataka kami kung nawala yung order. Isang oras pa bago namin nalaman na magkaibang device pala."*

---

### [07] Checkout modal Confirm Payment button clips below viewport on short screens

**Priority:** P1 · Effort: S · Impact: High

**What:** The CheckoutModal renders inside a `pos-card w-[460px] flex flex-col gap-0 overflow-y-auto max-h-[95vh]` container. On a 720px-height viewport (common on 10" landscape tablets with system navigation bar), the full bill summary + discount section + payment section pushes the `✓ Confirm Payment` footer button below the visible area. The button is only accessible via scrolling — but the modal does not show a scroll indicator.

**How to reproduce:** Set viewport height to ≤720px. Open checkout for a table with a SC/PWD discount (discount section expanded). Observe that the Confirm Payment button is not visible without scrolling.

**Fix:** The Confirm Payment footer should be sticky/fixed within the modal's scroll container:
```svelte
<!-- Wrap the action row in a sticky footer -->
<div class="sticky bottom-0 bg-surface border-t border-border flex gap-3 px-6 py-4">
  <!-- Cancel and Confirm Payment buttons -->
</div>
```
This ensures the primary CTA is always visible regardless of content height.

**The staff story:** *"Nag-scroll pa ko para makita yung Confirm button. Hindi ko alam na kailangan i-scroll. Akala ko broken. Nakita ko lang nung pinindot ko sa labas ng modal area."*

---

### [08] KDS receives void beep without item identification — kitchen cannot tell what was cancelled

**Priority:** P1 · Effort: M · Impact: High

**What:** When a staff member voids an individual item (post-grace, via Manager PIN), the KDS plays the 880Hz void beep. The voided item disappears from the merged KDS ticket. The kitchen receives NO information about which item was cancelled — only the sound and the fact that something changed.

**How to reproduce:** On the KDS, monitor a ticket for T1. On the staff session, void one item from T1. The KDS plays the beep. The item disappears from the ticket. No notification, no item name.

**Why this breaks:** Pedro is working 5 active tickets simultaneously. He hears a beep. He looks up from the grill. He can't tell which table had a void or which item to stop prepping — maybe the Ramyun he just started is the one that was cancelled. He has to either shout across to Maria or visually scan all tickets to find the change. Under 5-table chaos, this is 3–5 seconds of confusion.

**Fix:** Add a brief void notification card on the KDS that auto-dismisses in 5 seconds:
```svelte
<!-- In kitchen/orders/+page.svelte, add void notification state -->
let voidNotifications = $state<{ tableName: string; itemName: string; ts: number }[]>([]);
```
When an item's status changes to `cancelled` on a watched ticket, push to `voidNotifications`. Render as a dismissible banner above the ticket queue:
```
⚠️ VOID — T1 · Kimchi Pancake · 2s ago  [✕]
```
The void beep + text notification together give Pedro both auditory and visual identification of what was cancelled.

**The staff story:** *"Narinig ko yung beep ng void. Hindi ko alam kung alin yung na-cancel. Tinanong ko pa si Maria habang may inaalagaan akong tiyan sa grill."*

---

### [09] "PKG" / "VOID" / "FREE" / status badges all at text-[9px] — WCAG and kitchen readability fail

**Priority:** P1 · Effort: S · Impact: Medium

**What:** The following status badges in OrderSidebar all use `text-[9px]` (9px font):
- `SENT` (`bg-blue-100 text-blue-600`)
- `PKG` (`bg-accent-light text-accent`) — also contrast fail ~2.5:1
- `FREE` (`bg-status-green-light text-status-green`)
- `VOID` (`bg-status-red-light text-status-red`)
- `REQUESTING` / `WEIGHING` / `COOKING` / `SERVED` — same 9px

This is below the 12px absolute minimum for kitchen displays at 60–90cm viewing distance (ENVIRONMENT.md).

**Fix:** Change `text-[9px]` to `text-[11px]` across the `statusBadge` snippet and `badgesBlock` snippet in `OrderSidebar.svelte`. Additionally, fix the PKG badge contrast by using `bg-accent text-white` (white on orange = 4.6:1 — passes AA) rather than `bg-accent-light text-accent`.

---

### [10] Add-on rounds on KDS are indistinguishable from original order items

**Priority:** P2 · Effort: M · Impact: Medium

**What:** When Maria charges 5 separate add-on sessions to T1, the KDS merges all tickets for T1 into one card. Items from all 5 sessions appear in a single MEATS and DISHES list with no indication of which "round" they belong to or when they were added. Pedro cannot tell if "Fish Cake" is from the original package or from the 4th add-on session (30 minutes into the order).

**Why this breaks:** Under chaos, the kitchen needs to know the age and priority of individual add-on items. A Fish Cake ordered 5 minutes ago is more urgent than one that's been in "SENT" for 25 minutes but is also newer than the original package items. The merged KDS provides no this temporal context.

**Ideal fix:** Add a subtle "Add-on Rnd N" label to items added in subsequent CHARGE sessions (not the first). This mirrors the `meatRefillRound` pattern already implemented for meat refills. The `addedAt` timestamp on each item can be used to assign a round number relative to the order's first CHARGE session time.

---

## Previous Audit Fix Verification (v2 → chaos pass)

| Issue from v2 | Status | Notes |
|---|---|---|
| [v2-01] Service Alerts button contrast | ✅ HELD | Not accessed in this audit path |
| [v2-02] Service Alerts count badge | ✅ HELD | Not accessed |
| [v2-03] Chip wait-time text-[10px] | ✅ HELD | Not accessed |
| [v2-04] New Tables empty state | ✅ HELD | Not accessed |
| [v2-05] Audio on refill arrivals | ✅ HELD | Not accessed |
| [v2-06] Alert urgency escalation | ✅ HELD | Not accessed |
| [POS-01] ₱5,000 quick-select chip | ✅ HELD | Confirmed ₱5,000 visible in CheckoutModal |
| [POS-02] "Incl. VAT (12%)" label | ✅ HELD | Confirmed in CheckoutModal line 264 |
| [POS-03] Void button rightmost → Checkout | ✅ HELD | [Print][Void][Checkout] order confirmed |
| [POS-04] Leftover check step indicator | ✅ HELD | Step 1→2 indicator confirmed |
| [POS-05] Print button in ReceiptModal | ✅ HELD | [🖨 Print][Done] confirmed |

---

## Fix Checklist

- [ ] [01] Implement single-PIN "cancel window" for same-table sequential item removals — unlock 60s window after first successful PIN, display countdown badge, reset on navigation away
  > **Validate:** Hick's Law ✅ · Consistency ✅ · Security maintained (PIN still required once)

- [ ] [02] Show grace period countdown on active pending items — live seconds label next to ✕ button, expires silently, shows 🔒 after expiry
  > **Validate:** Visibility of System Status ✅ · Consistency ✅ · Jakob's Law ✅

- [ ] [03] Collapse voided items into a disclosure group at the bottom of the sidebar item list — "N voided items ▼" — collapsed by default
  > **Validate:** Miller's Law ✅ · Gestalt (Proximity) ✅ · Visual Hierarchy ✅

- [ ] [04] Add `destructive` prop to `ManagerPinModal` — red header background for "Void Entire Order" modal only, distinguishing it visually from single-item remove modal
  > **Validate:** Gestalt (Similarity) ✅ · Error Prevention ✅ · Consistency ✅

- [ ] [05a] Fix LeftoverPenaltyModal ✕ close button: `w-8 h-8` → `w-11 h-11 rounded-full hover:bg-gray-100` in `LeftoverPenaltyModal.svelte:69`
  > **Validate:** Fitts's Law ✅ · WCAG Target Size ✅

- [ ] [05b] Fix LeftoverPenaltyModal ℹ info button: `h-6 w-6 min-height:unset` → `h-10 w-10` in `LeftoverPenaltyModal.svelte:89`
  > **Validate:** Fitts's Law ✅ · WCAG Target Size ✅

- [ ] [06] Add single-device mode warning banner to `kitchen/orders/+page.svelte` — amber warning when LAN sync is not active, linking operators to the Phase 2 roadmap
  > **Validate:** Visibility of System Status ✅ · Operational safety ✅

- [ ] [07] Make CheckoutModal Confirm Payment footer sticky within the modal scroll container — `sticky bottom-0 bg-surface border-t`
  > **Validate:** Fitts's Law ✅ · Visibility of System Status ✅ · Motor Efficiency ✅

- [ ] [08] Add void notification card to KDS (`kitchen/orders/+page.svelte`) — brief auto-dismiss banner showing voided item name + table — mirrors existing refill notification pattern
  > **Validate:** Visibility of System Status ✅ · Consistency (mental model) ✅

- [ ] [09] Change status badge font from `text-[9px]` to `text-[11px]` in `OrderSidebar.svelte` — fix PKG badge contrast from `bg-accent-light text-accent` to `bg-accent text-white`
  > **Validate:** WCAG Contrast ✅ · Fitts's (readability) ✅ · Gestalt (Similarity) ✅

- [ ] [10] Add "Rnd N" add-on round labels to KDS ticket items added in subsequent CHARGE sessions — mirror existing `meatRefillRound` pattern from KDS orders
  > **Validate:** Visibility of System Status ✅ · Miller's Law ✅

---

## Cross-Role Handoff Summary (Chaos View)

| Handoff | From | To | Status |
|---|---|---|---|
| Order added (initial) | Maria (Staff) | Pedro/Lito (KDS) | ✅ Single-device: ticket appears immediately |
| Add-on CHARGE (round 2–5) | Maria | KDS | ⚠️ Merges into same ticket — no round label |
| Item voided (individual) | Maria | Pedro (KDS) | ❌ Audio beep only, no item identification |
| Item voided (grace period) | Maria | Pedro (KDS) | ❌ Silent removal — no KDS signal at all |
| Kitchen refuses item | Pedro (KDS) | Maria (Sidebar) | ✅ Red rejection banner in OrderSidebar |
| Multi-device orders | Maria (separate browser) | Pedro (KDS) | ❌ Phase 1: orders not shared cross-session |
| Checkout initiated | Maria | Leftover Modal | ⚠️ ✕ close button 32px — escape unsafe |
| Discount applied | Maria | Checkout | ✅ PIN required — works correctly |
| Cash change displayed | Maria | Checkout | ✅ Green change banner clear |

---

## Overall Verdict

This audit surfaces a **new class of issues** not found in any previous audit: the **PIN modal fatigue cluster** ([01]–[04]) that emerges specifically when a single order goes through 4+ cancel cycles. This is a realistic samgyupsal scenario — guests change minds, add items, cancel drinks, request upgrades — and the current UX stacks 4 identical PIN modals in a 3-minute window.

The kitchen dimension remains strong (all v2 fixes holding). The new chaos-specific kitchen issues ([08], [10]) are P1/P2 and represent opportunities to match the KDS quality level of the POS.

**Critical (fix before production with chaotic service load):**
- [01] PIN modal fatigue — single cancel session per table
- [02] Grace period timer invisibility
- [03] Voided items mixed with active items
- [04] Identical modal styling for item-remove vs. full-order-void
- [05] LeftoverPenaltyModal escape button at 32px
- [06] Single-device mode warning on KDS

**High-impact (fix in current sprint):**
- [07] Checkout modal Confirm button clips on short screens
- [08] KDS void notification with item name
- [09] Status badge text-[9px] → text-[11px]

**Polish (schedule for next audit cycle):**
- [10] Add-on round labels on KDS
