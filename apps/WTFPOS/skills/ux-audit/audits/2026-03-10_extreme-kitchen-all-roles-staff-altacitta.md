# UX Audit — Extreme Full Service: All Kitchen Roles + Staff (Alta Citta)

**Date:** 2026-03-10
**Mode:** Multi-user · Parallel browser sessions
**Roles:** Maria Santos (Staff · extreme orders) · Pedro Cruz (Kitchen/KDS) · Lito Paglinawan (Kitchen/Grill) · Benny Flores (Kitchen/Butcher) · Corazon Dela Cruz (Kitchen/Sides)
**Branch:** Alta Citta (tag)
**Scenario:** Friday night peak rush — 8 tables simultaneously occupied, extreme order volume, all kitchen sub-roles active at once, one staff cashier managing the floor alone
**Viewport:** 1024×768 tablet landscape (all sessions)
**Skill version:** v4.3.0
**Agents:** 5 parallel (agent-staff, agent-pedro, agent-lito, agent-benny, agent-corazon)

---

## A. Text Layout Map

### Floor: Maria Santos — POS under extreme load (8 tables, 6 occupied)

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                           │
├──┤──────────────────────────────────────────────────────────────────────│
│🛒│  POS  [6 occ] [2 free]  [ⓘ]  [📦 New Takeout]  [🧾 History]       │
│  │  ┌──────────────────────────────────┐ ┌──────────────────────────┐  │
│  │  │ [BEEF 2m T1 ₱1198 13] [PORK T2] │ │ T1 [2pax✎] 2m  [✕]     │  │
│  │  │ [BEEF T3 ₱798 ●●●]  [PORK T4]  │ │ Beef Unlimited           │  │
│  │  │ [T5 free]  [T6 free]            │ │ [🔄 Refill] [Add Item]  │  │
│  │  │ [BEEF T7 ₱1598 20]  [PORK T8]  │ │ Premium USDA SENT ₱1198 │  │
│  │  └──────────────────────────────────┘ │ Sliced Beef  WEIGHING   │  │
│  │                                        │ [10 requesting ▼]       │  │ ← fold
│  │                                        │ BILL  13    ₱1,198.00   │  │
│  │                                        │ [Print][Void][Checkout] │  │
│  │                                        │ [More ▼]               │  │
│M │                                        └──────────────────────────┘  │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Kitchen: Lito (Grill) + Pedro (KDS) — shared /kitchen/orders view

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA · 🔥 Grill Station  [◉ Live]  [⚖️ Weigh]  [BT icon]│
├──┤──────────────────────────────────────────────────────────────────────│
│🍳│ All Orders  Order Queue  Weigh Station                               │
│  │                                                                        │
│  │  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────┐   │
│  │  │ T1  5m ████░░ [!] │ │ T2  3m ██░░░░      │ │ T7  8m ██████  │   │
│  │  │ [Quick Bump 32px!] │ │ [Quick Bump 32px!] │ │ [Quick Bump !!]│   │
│  │  │ 🍖 MEATS           │ │ 🍖 MEATS           │ │ 🍖 MEATS       │   │
│  │  │  Samgyupsal  ↺REF. │ │  USDA Beef WEIGHING│ │  Pork  WEIGHING│   │
│  │  │  Sliced Beef ✓DONE │ │  Sliced Beef NEW   │ │  Samgy ↺ REFIL │   │
│  │  │ 🍴 DISHES [3 hidn] │ │ 🍴 DISHES [2 hidn] │ │ 🍴 [4 hidden] │   │
│  │  │ [ALL DONE ✓ 56px] │ │ [ALL DONE ✓ 56px] │ │ [ALL DONE ✓]  │   │
│  │  └────────────────────┘ └────────────────────┘ └─────────────────┘   │
│  │                 ↑ Dishes collapsed for Lito, but section stubs remain │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Kitchen: Corazon (Sides) — same /kitchen/orders, kitchenFocus:'sides'

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA · 🥗 Sides Prep  [◉ Live]                            │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────┐  │
│  │  │ T1  5m             │ │ T4  2m             │ │ T6  11m  🔴    │  │
│  │  │ 🍖 MEATS [2 hidn]  │ │ 🍖 MEATS [2 hidn]  │ │ 🍖 [2 hidden] │  │
│  │  │ 🍴 DISHES & DRINKS │ │ 🍴 DISHES & DRINKS │ │ 🍴 DISHES     │  │
│  │  │  Rice              │ │  Rice ← REFILL??  │ │  Kimchi       │  │
│  │  │  Kimchi            │ │  Banchan           │ │  Rice ← REFIL │  │
│  │  │  Banchan           │ │  (no badge, same   │ │  (no REFILL   │  │
│  │  │  (identical look   │ │   as original)     │ │   badge)      │  │
│  │  │   to refill items) │ │                    │ │               │  │
│  │  │ [ALL DONE ✓]      │ │ [ALL DONE ✓]      │ │ [ALL DONE ✓] │  │
│  │  └────────────────────┘ └────────────────────┘ └─────────────────┘  │
│  │         ↑ Corazon cannot tell which Rice item is Round 1 vs Round 2  │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Kitchen: Benny (Butcher) — /kitchen/weigh-station

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA  [🔵 BT icon 36px!]  [⚖️ Weigh Station tab]         │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  ┌────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  │  Pending Meat Orders   │  │         ┌──────────────────────┐   │ │
│  │  │  [T1 Samgyupsal 52px] │  │         │   0  g               │   │ │
│  │  │  [T2 USDA Beef  52px] │  │         │ ──────────────────── │   │ │
│  │  │  [T4 Pork Belly 52px] │  │  ┌─┬─┬─┤                      ├─┐ │ │
│  │  │  [T7 Samgyupsal 52px] │  │  │1│2│3│ [Manual] [Scale]     │ │ │ │
│  │  │                        │  │  │4│5│6│ ← mode toggle unset  │ │ │ │
│  │  │  ← all 52px, below     │  │  │7│8│9│                      │ │ │ │
│  │  │    56px butcher min    │  │  │·│0│⌫│ ← numpad 72px ✅    │ │ │ │
│  │  │                        │  │  └─┴─┴─┤──────────────────────┤─┘ │ │
│  │  │                        │  │        │ [DISPATCH 64px ✅]   │   │ │
│  │  └────────────────────────┘  └─────────────────────────────────────┘ │
│  │         ↑ BT disconnect: no inline prompt, only tiny nav icon changes │
└──┴──────────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | CONCERN | Staff AddItemModal 5 tabs is well-structured; KDS kitchenFocus collapses off-role sections but leaves header stubs — cognitive noise across 15 tickets |
| 2 | Miller's Law (chunk info) | CONCERN | 8–15 simultaneous KDS ticket cards exceed 7±2; each card has 3 sections + bumps + timer; sides/meats mixed in shared view without true partition |
| 3 | Fitts's Law (target size) | FAIL | Quick Bump 32px, BT scale trigger 36px, section headers 32px (min-height:unset), meat item selector 52px, mode toggle unset — multiple targets below 44px minimum and 56px kitchen minimum |
| 4 | Jakob's Law (POS conventions) | FAIL | Meat refills show REFILL badge; sides refills show nothing — identical to original orders. Inconsistent treatment of the same concept breaks user expectation |
| 5 | Doherty Threshold (<400ms) | PASS | RxDB local-first, all writes instant; KDS live indicator turns amber after 60s — appropriate staleness signal |
| 6 | Visibility of System Status | FAIL | Three silent failures: (1) session overwrites on kitchen nav with no user signal; (2) BT disconnect invisible until mode toggle disappears; (3) no new-table signal on KDS for utensil staging |
| 7 | Gestalt: Proximity | PASS | KDS groups items by MEATS / DISHES sections per ticket; order sidebar groups Meats/Sides with clear headers |
| 8 | Gestalt: Similarity | FAIL | ALL DONE button bumps all stations (Lito + Corazon's items on same ticket) despite distinct station roles — action scope does not match visual scope |
| 9 | Visual Hierarchy (primary CTA) | FAIL | Quick Bump (most-used, ~150×/shift) is the SMALLEST button (32px); ALL DONE (full-width) is the largest — inverted importance hierarchy |
| 10 | Visual Hierarchy (info density) | CONCERN | 15 active tickets × 3 sections each = 45 visible section headers on Lito's screen; sides section stubs persist even when collapsed |
| 11 | WCAG Contrast | FAIL | WEIGHING badge `bg-blue-100 text-blue-600` = 10% blue tint; READY badge `bg-status-green/10` = 10% opacity — KP-02 confirmed, explicitly fail in steam environment per ENVIRONMENT.md |
| 12 | WCAG Target Size | FAIL | KP-01 confirmed across all kitchen roles: Quick Bump 32px, section headers 32px, BT trigger 36px, meat selector 52px, waste log buttons 44px (should be ≥56px for kitchen), delivery buttons 44px |
| 13 | Consistency (internal) | FAIL | Meat refill items: have animated REFILL badge + section count pill. Sides refill items: no badge, no pill — identical to original orders. Same concept, two implementations |
| 14 | Consistency (mental model) | FAIL | Session overwrites during navigation to kitchen/all-orders cause unexpected redirects to /pos — breaks trust in navigation stability |

**Summary: 2 PASS · 3 CONCERN · 9 FAIL**

---

## C. Best Day Ever — Friday Night Rush, Alta Citta

It's 7:55 PM. Eight tables opened in the last 45 minutes. Maria Santos is alone at the register.

**Maria** opens T5 while T1–T4 and T7 are all active. She taps T5 on the floor plan, enters 4 pax, selects Beef Unlimited, adds two meat cuts. She hits CHARGE. 13 items go to the kitchen. She immediately starts opening T6 — the occupancy counter still shows the old number while the PaxModal is open; she has to hold the new table in her head.

**Pedro** watches the KDS queue fill up. Seven tickets now. He taps the Quick Bump on T1's header to clear the meat order — the button is tiny, 32px, and his finger is wet from a sauce splash. He misses it, taps the timer badge next to it. Nothing happens. He finds the ALL DONE button at the bottom of the card and presses it. T1 clears entirely — including Corazon's sides items she hadn't bumped yet.

**Lito** is grilling six cuts simultaneously. He glances at his KDS from the grill, 80cm away. The item names are 14px, barely legible through the smoke. He spots the REFILL badge — amber text on amber background — on T4's Samgyupsal. Or does he? He blinks. He walks closer to confirm it's a refill and not a new order. The grill smokes behind him.

**Corazon** is plating banchan for T3. She glances at the KDS — her DISHES & DRINKS section shows Rice for T4. She already prepped rice for T4 at the start. Is this a refill? There's no badge. She preps another rice portion. She just wasted 90 seconds and one portion of rice that was still on the ticket from the original order.

**Benny** is at the weigh station. His scale lost connection 10 minutes ago — the tiny nav icon turned grey, but he didn't notice. He's been entering weights manually. He selects T7's Samgyupsal from the pending list — a 52px button his gloved knuckle barely hits on the second try. He enters 220g on the numpad (72px keys — these feel right). He taps DISPATCH. The weight logs. He moves to T7's Pork Sliced. No indicator tells him the scale is disconnected, that his weights are manual-entered, or that there's a discrepancy.

Meanwhile, a new table (T5) just opened. Corazon doesn't know — no signal came through. The guests sit for three minutes with no utensils, no banchan, no initial sides set. Maria is too busy with T6's checkout to call across.

At 9 PM, a kitchen cook navigates from Order Queue to All Orders to look for a bumped ticket. The page loads and the session silently switches to Maria Santos. He's redirected to /pos. He taps back. The KDS reloads fresh — all his placed context is gone.

---

## D. Recommendations

[01] **Session overwrites during kitchen navigation — cook is silently redirected to /pos**

**What:** Navigating from `/kitchen/orders` to `/kitchen/all-orders` causes the session to overwrite to a different user (observed: reverts to Maria Santos), triggering a redirect to `/pos`. The kitchen cook loses all context and is dumped into the POS floor plan with no error message.

**How to reproduce:** Log in as Pedro Cruz (kitchen role). Navigate to `/kitchen/orders`. Click the "All Orders" sub-nav tab. Observe — session user changes, redirect fires to `/pos`.

**Why this breaks:** Pedro Cruz is mid-rush, managing 8 tickets. He taps All Orders to find a bumped ticket's history. The app silently logs him out and redirects to the cashier's POS. He has no idea what happened. He closes and reopens the browser tab. His entire KDS session state is lost. During a 7 PM rush this is a critical operational failure — the kitchen display going blank mid-service.

**Ideal flow:** Kitchen sub-nav navigation must never trigger session changes. The session should be stable across all `/kitchen/*` pages. The root cause is likely a route-level `load` function or layout guard that re-reads session without the kitchen role's persisted credentials. Fix: ensure the kitchen `+layout.svelte` guard reads from `sessionStorage` consistently across all child routes.

**The staff story:** *"Pinindot ko yung All Orders, nawala lahat. Nagbalik ako sa bago. Wala na yung lahat ng tickets. Akala ko nag-crash yung system — tinanong ko si Maria kung ano nangyari."*

---

[02] **"Skip — I'll add float later" button does not dismiss the Start Your Shift overlay**

**What:** On every login, a full-page "Start Your Shift" modal overlays the POS floor plan. The "Skip — I'll add float later" button enters an `[active]` state on tap but the modal does not dismiss — only "Start Shift →" clears it. During a mid-rush login (staff returning from break), all table access is blocked until the float modal resolves.

**How to reproduce:** Log in as Maria Santos (staff). Observe the Start Your Shift float declaration modal. Tap "Skip — I'll add float later." Observe — modal persists. The button highlights as [active] but nothing closes.

**Why this breaks:** At 8 PM, Maria steps away for a 10-minute break. She returns, logs back in, and the float modal blocks her from seeing T7's running bill — T7's guests have been waiting 3 minutes to checkout. She tries the Skip button repeatedly, nothing happens. She enters ₱0 and hits Start Shift just to get through. The broken Skip wastes 15–30 seconds on every mid-shift login.

**Ideal flow:** The Skip button should immediately close the overlay and proceed to the floor plan with no float recorded. The float can be added later via a settings panel. The button must be functionally operational on the first tap.

**The staff story:** *"Bumalik ako pagkatapos ng break, may naghihintay na mag-checkout. Pinindot ko yung Skip, hindi gumagana. Kailangan ko pang mag-type ng zero at pindutin yung Start Shift para lang makita ang floor."*

---

[03] **KDS item names 14px — below 18px minimum for 60–90cm viewing distance**

**What:** All KDS ticket item names use `text-sm` (14px) in `/kitchen/orders/+page.svelte`. Per ENVIRONMENT.md, kitchen staff read the KDS at 60–90cm through smoke and steam — the minimum readable text size at this distance is 18px (`text-lg`). Status badges use `text-xs` (12px) — even worse.

**How to reproduce:** Open `/kitchen/orders` as any kitchen role. Look at item names on any ticket card. Inspect the DOM or source: `text-sm font-medium` (line 661, 756). Step back 80cm from the screen and try to read "Samgyupsal" vs "Pork Sliced" while the grill is running.

**Why this breaks:** Lito reads the KDS while simultaneously managing 6 cuts on a live grill. He cannot walk to the screen every time he needs to verify an item name or status badge. At 14px through smoke, "Samgyupsal" and "Sliced Beef" are nearly indistinguishable character by character. A wrong cut goes on the wrong grill slot. Per ROLE_WORKFLOWS.md, ticket readability is CRITICAL — 200× per shift.

**Ideal flow:** Bump item names to `text-base` minimum (16px), ideally `text-lg` (18px) for kitchen pages. Status badge text should be `text-sm` (14px) minimum — not `text-xs`. These changes apply to `/kitchen/orders/+page.svelte` item row and badge elements.

**The staff story:** *"Lumalapit pa ako sa screen para mabasa yung pangalan ng karne. Yung patak ng pawis ko sa grill, bahala na. Masyado kasing maliit yung letra."*

---

[04] **Status badges use 10% tint fills — invisible through steam and kitchen lighting**

**What:** The WEIGHING badge uses `bg-blue-100 text-blue-600` (10% blue tint on near-white) and the READY badge uses `bg-status-green/10 text-status-green` (10% opacity green). ENVIRONMENT.md explicitly states: "Status badges that rely on subtle color tints (opacity ≤10%) are effectively invisible at 90cm through steam." These are the two most-read status signals on the KDS during service.

**How to reproduce:** Open `/kitchen/orders`. Inspect a ticket item in WEIGHING status — `bg-blue-100 text-blue-600`. Open the browser at arm's length (80cm) in a bright-lit environment. Observe that the badge blends into the white ticket card background.

**Why this breaks:** Pedro and Lito need to know at a glance whether a meat item is waiting to be weighed (WEIGHING), ready to serve (READY), or confirmed (SENT). These status signals are the entire communication channel between the weigh station and the grill. A faint tinted badge at 80cm distance through kitchen steam registers as white background noise. Pedro marks T3's beef as READY — Lito never sees the signal.

**Ideal flow:** Replace tint fills with solid fills for all kitchen-visible status badges: WEIGHING → `bg-blue-600 text-white`; READY → `bg-status-green text-white`; REQUESTING → `bg-accent text-white`. This matches how the timer urgency badges already work (`bg-status-red text-white` for critical) — apply the same solid-fill treatment to item status badges.

**The staff story:** *"Parang lahat ay puti lang ang nakikita ko sa screen. Yung status ba na iyon ay WEIGHING o READY? Hindi ko sigurado. Tsaka na lang nila sabihin sa akin."*

---

[05] **Quick Bump button is 32px — far below 44px minimum and 56px kitchen minimum**

**What:** The "Quick Bump" button in the KDS ticket card header has `min-height: 32px` (rendered as a small pill: `px-3 py-1 text-xs`). This is the fastest path for clearing a completed ticket — yet it is the smallest interactive element on the most-used kitchen screen. Touch minimum for all WTFPOS buttons is 44px; kitchen pages require 56px for wet hands.

**How to reproduce:** Open `/kitchen/orders`. Inspect the Quick Bump button in any ticket card header. Check `min-height` in the DOM — 32px. Compare to the ALL DONE button below (56px, full-width, green).

**Why this breaks:** Pedro bumps 150 items per shift. The Quick Bump in the header is the single most-tapped element on his screen. At 32px, with hands wet from kitchen spray, a miss-tap is almost guaranteed. The button sits adjacent to the timer badge and progress counter — all at the same 32–36px height row. Missing Quick Bump hits the timer badge (no action) or the ticket count pill (no action) — invisible failure during a rush.

**Ideal flow:** Set Quick Bump to `min-height: 56px` with `px-6` padding. Or remove Quick Bump entirely in favor of the correctly-sized ALL DONE button — per ROLE_WORKFLOWS.md, per-ticket clear is the primary action and ALL DONE already meets the standard.

**The staff story:** *"Yung maliit na button sa taas ng ticket — palagi ko siyang nami-miss. Minsan na-tap ko yung timer badge sa tabi, wala namang nangyari. Kailangan ko pang pumunta sa malaking button sa ibaba."*

---

[06] **Sides dish refills show no REFILL badge — identical to original order items**

**What:** When a staff member sends a refill for rice, kimchi, banchan, or soup via the RefillPanel, the refill items appear in Corazon's KDS under DISHES & DRINKS with zero visual distinction from the original order items. The MEATS section has an animated amber "REFILL" badge + "↺ N refill(s)" section count pill — sides have neither.

**How to reproduce:** Open `/kitchen/orders` as Corazon (kitchenFocus:'sides'). Have Maria send a refill for Rice on T4. The rice refill appears in T4's DISHES section looking identical to the original rice order. No badge, no indicator, no section count pill.

**Why this breaks:** Corazon preps the initial sides set when a table opens. Later, when T4 requests a rice refill, she sees "Rice" in the DISHES section — the same label she saw during setup. She cannot tell if this is Round 1 (she already served) or Round 2 (new request). At 8 PM with 8 simultaneous tables each sending refills, a 10% error rate means 3–5 re-preps per shift — each wasting 90 seconds and stock. This is KP-04 (systemic, found in 6/12 prior audits), confirmed as critically worse for Corazon because refills are her primary work.

**Ideal flow:** Add `isRefill` detection to the DISHES & DRINKS item render loop — the detection logic already exists for meats at line 645 (`item.notes === REFILL_NOTE && !item.weight`). Show the same amber animated "REFILL" badge on matching dish/side items. Add a "↺ N refill(s)" count pill to the DISHES & DRINKS section header (parallel to the existing meats pill at lines 620–625). One-to-one code port from the meat implementation.

**The staff story:** *"Parang lahat ng rice ay pareho sa KDS. Hindi ko alam kung yung may serbisyo na ko o mag-refill pa sila. Nag-pre-prepare na lang din ako. Minsan dalawang beses na pala silang nabibigyan."*

---

[07] **No new table signal on KDS — Corazon's utensil staging is blind**

**What:** When Maria opens a new table on `/pos`, no signal reaches the KDS. Corazon sees nothing when a new table opens — no notification, no counter, no ticket. She must physically see the new guests, hear the cashier call across the floor, or infer from observing the POS on a separate device. As a result, new tables sit for 2–5 minutes without utensils, chopsticks, banchan, or initial sides set.

**How to reproduce:** Log in as Corazon (kitchen/sides). Separately, have Maria open a new table on `/pos`. Observe `/kitchen/orders` — no new notification appears. There is no "New Table: T5 opened" banner, no badge, no counter increment.

**Why this breaks:** Opening a table immediately creates a need for utensils, chopsticks, tongs, scissors, plates, banchan set, rice, and soup — all Corazon's responsibility. Without a system signal, the first impression for every new table at WTF! Samgyupsal depends on Corazon noticing by other means. During an extreme rush with 8 open tables, she is heads-down on refill requests and cannot visually monitor the floor. Per ROLE_WORKFLOWS.md, this is 15–25 new table events per shift — up to 2 aggregate hours of first-impression delay. This matches KP-03 (Silent Cross-Role Handoff Failures).

**Ideal flow:** When a new table order is created in RxDB (status: 'open', no items yet), generate a brief KDS notification for kitchen roles — a "🆕 T5 — set up sides" badge on the KDS header counter or a timed card in the queue. Alternatively, add a persistent "New Tables (last 10min): 2" counter in the KDS header that kitchen staff can glance at. Does not require a ticket — just a count badge derived from recently-opened orders.

**The staff story:** *"Lagi akong natataranta. Nakita ko na lang na may bago silang table nung narinig ko yung 'ano pang pagkain ninyo?' Wala kaming kutsara yung mga iyon. Hiya."*

---

[08] **ALL DONE bumps all stations — Lito clears Corazon's sides without knowing**

**What:** The "ALL DONE ✓" button (56px, full-width, green) at the bottom of each KDS ticket card marks ALL items in the ticket as served — regardless of which kitchen station is responsible for which items. When Lito's grill items are done, he taps ALL DONE. Corazon's sides items (rice, banchan, soup — not yet prepped) are simultaneously marked as served. The ticket disappears from the queue.

**How to reproduce:** Open `/kitchen/orders` as Lito (kitchenFocus:'grill'). A ticket exists with both meat items (Lito's) and side items (Corazon's). Lito finishes the meat items and taps ALL DONE. All items — including sides Corazon hasn't touched — are marked served.

**Why this breaks:** During extreme rush with Lito and Corazon sharing the same KDS (and potentially same physical tablet), Lito taps ALL DONE when his meats are ready. Corazon's rice refill and banchan set were on that ticket. Now the ticket disappears — Corazon sees no pending refill, never preps it, and the table never gets their Round 2 rice. This is a silent data loss event with no undo visible during the rush.

**Ideal flow:** Scope ALL DONE to the current kitchenFocus station. When `kitchenFocus === 'grill'`, ALL DONE marks only MEATS items as served and leaves DISHES items in pending state. When `kitchenFocus === 'sides'`, ALL DONE marks only DISHES items. When no focus is set (Pedro's general view), ALL DONE marks everything. A label change helps too: "MEATS DONE ✓" vs "DISHES DONE ✓" vs "ALL DONE ✓" — scoped to the active focus.

**The staff story:** *"Pinilow ko yung ALL DONE kasi tapos na yung karne. Hindi ko alam na kasama pala yung rice na refill nila. Pagkatapos nito, naghanap si Corazon ng ticket — wala na."*

---

[09] **BT scale trigger button is 36px — far below 56px butcher minimum**

**What:** The Bluetooth scale status/pairing trigger in the kitchen sub-nav header uses `class="p-2 rounded-full"` with a 20px icon — effective touch area ~36px. This is the only entry point to BT scale pairing on the weigh station. For Benny, wearing nitrile gloves and handling raw meat residue, 36px is functionally untappable. The 44px system floor and 56px butcher minimum both apply.

**How to reproduce:** Open `/kitchen/weigh-station`. Inspect the BT scale icon button in the top-right nav bar. Check: `class="p-2 rounded-full"` = 8px padding × 2 + 20px icon = ~36px touch area. ENVIRONMENT.md butcher minimum: 56px.

**Why this breaks:** Benny's scale disconnects 2–3 times per shift from BLE congestion at peak. He must reconnect in under 30 seconds or backup grows. With greasy gloves on, a 36px icon button in the corner of the screen requires precise fingertip control Benny doesn't have. He taps the area, nothing happens. He tries the screen edge. He wipes his glove on his apron, taps again. By this time, 60 seconds have passed and 3 weight orders are pending. This is KP-01 (Touch Target Violations — systemic, 10/12 audits).

**Ideal flow:** Increase the BT scale trigger to `min-h-[56px] min-w-[56px] px-4` with a visible label "BT Scale" below the icon. Additionally, add an inline "⚠ Scale disconnected — tap to reconnect" banner on the weigh station center panel itself when `btConnected === false`. The center panel should never be silent about a disconnected scale.

**The staff story:** *"Nag-disconnect yung timbangan. Hinanap ko yung button para i-reconnect. Yung maliit na asul na icon sa taas? Hindi ko na-tap ng maayos. Medyo madumi yung kamay ko. Tatlong beses bago ko naabot."*

---

[10] **BT disconnect is invisible on the weigh station center panel — Benny enters manual weights unknowingly**

**What:** When the Bluetooth scale disconnects, the weigh station center panel's Manual/Scale mode toggle disappears entirely (conditional on `btConnected === true`). The center panel shows only the numpad. No banner, no warning, no "Scale disconnected" message appears on the page body. The only signal is the tiny nav-bar icon turning grey — not visible from the working position at 45cm counter distance.

**How to reproduce:** Open `/kitchen/weigh-station` with BT scale disconnected (or simulate by refreshing without scale paired). The center panel shows the numpad with no mode toggle, no connection warning, no explanation of why the Scale mode option is absent.

**Why this breaks:** Benny switches between Manual and Scale modes frequently. When the scale reconnects, he uses the Scale mode. When it's disconnected, he enters weights manually — but he doesn't always know the scale is disconnected. He sees the same numpad screen and assumes the scale is handling it. His manual estimates (220g, 200g) are entered as if they were scale-validated weights. Stock deduction accuracy degrades silently. This matches BEN-F2 (critical failure in source code audit).

**Ideal flow:** When `btConnected === false`, show a prominent inline banner on the weigh station panel: `⚠ Bluetooth scale disconnected. Weights entered manually won't be scale-verified. [Tap to reconnect →]`. The banner should be `min-h-[64px]` (butcher accessible), `bg-status-yellow/20 border-status-yellow text-gray-900`, and positioned above the numpad — unmissable at 45cm counter distance.

**The staff story:** *"Nag-enter ako ng timbang nang timbang. Hindi ko alam na naka-disconnect na pala yung timbangan. Akala ko nag-sscale pa rin ako. Medyo mababa yung naka-log na timbang ng karne kanina."*

---

[11] **Meat item selector buttons on weigh station are 52px — 4px below 56px butcher minimum**

**What:** The pending meat order list on the left panel of `/kitchen/weigh-station` uses `style="min-height: 52px"` for each selectable meat item button. The butcher minimum per ENVIRONMENT.md is 56px. These are the very first buttons Benny taps before every weigh operation — 30–60 times per shift.

**How to reproduce:** Open `/kitchen/weigh-station`. Inspect a meat item button in the pending orders list. Source line 249: `style="min-height: 52px"`. The difference from the 56px requirement is 4px — small in pixels, significant with nitrile gloves.

**Why this breaks:** Benny's first touch on every weighing cycle is selecting which meat cut he's about to weigh. With raw pork belly on his hands and a glove reducing tactile precision, a 52px button is a mis-tap waiting to happen. If he selects the wrong cut (Samgyupsal when he meant Pork Sliced), the weight gets logged to the wrong item. A 4px fix eliminates this error vector on the highest-frequency interaction Benny has.

**Ideal flow:** Change `style="min-height: 52px"` to `style="min-height: 56px"` on the pending meat item list buttons. Also apply `style="min-height: 56px"` to mode toggle buttons (currently `min-height: unset`) and the waste log/delivery buttons that are currently at 44px.

**The staff story:** *"Yung mga button ng karne sa gilid — medyo maliit din. Minsan napipindot ko yung mali dahil nagsasabay ako. Tapos yung timbang naka-assign sa maling karne."*

---

[12] **Delivery form and waste log have no numpad — require system keyboard with gloved hands**

**What:** The "Receive Delivery" form (`ReceiveDelivery.svelte`) and the waste log quantity input (`WasteLog.svelte`) both use plain `<input type="number">` fields with no dedicated numpad. Entering "15000" (15kg delivery in grams) or "350" (350g waste) requires Benny to tap a text input and type with the software keyboard — impractical with raw meat on his hands.

**How to reproduce:** Open `/stock/deliveries`. Tap "Receive Delivery." Observe the weight/quantity field — a standard `<input type="number" class="pos-input">`. No inline numpad appears. The system keyboard opens instead.

**Why this breaks:** The weigh station page has a beautiful 72px numpad. The delivery form — used by the same butcher in the same gloved-hands environment — has a software keyboard that requires precise small key taps on a 320px-wide input panel. A 15kg delivery of pork belly logged as 1500g (missed zero) is a 10× stock discrepancy that corrupts inventory counts and triggers false "low stock" alerts for the manager.

**Ideal flow:** Extend the weigh station's numpad component to the delivery quantity field and waste quantity field when the user is a kitchen role. When `role === 'kitchen'`, replace `<input type="number">` in delivery/waste forms with the same inline numpad component already built for the weigh station. The component exists — it just needs to be reused here.

**The staff story:** *"Pag mag-log ng delivery, lalabas yung keyboard sa screen. Yung kamay ko nasa karne pa. Minsan mali yung natatype ko kasi hindi ko makita ng maayos yung letra. Mas gusto ko sana yung malaking numpad."*

---

[13] **KDS section header collapse buttons are 32px — min-height: unset override (KP-01)**

**What:** The "🍖 MEATS" and "🍴 DISHES & DRINKS" section header toggle buttons in the KDS ticket cards use `style="min-height: unset"` (lines 614 and 721 of `/kitchen/orders/+page.svelte`), rendering at approximately 32–34px. This explicitly overrides the `app.css` base layer 44px rule. For Corazon, one mis-tap on the section header collapses her entire working view.

**How to reproduce:** Open `/kitchen/orders`. Inspect the DISHES & DRINKS section header button on any ticket card. `style="min-height: unset"` is found. The rendered height is ~32px.

**Why this breaks:** This is KP-01 (Touch Target Violations — systemic, confirmed 10/12 audits). Corazon's entire KDS view collapses to hidden if she mis-taps the section header instead of the item below it. During a rush — with wet hands, reading from 60cm, managing 8 simultaneous refills — a 32px collapse button next to the first item row is a reliability hazard. A single accidental tap hides all her pending work.

**Ideal flow:** Remove `style="min-height: unset"` from both section header buttons. Add `py-3.5` (56px total with text) or `min-h-[44px]` at minimum. The section header can still be a toggle — just a taller one that's hard to miss-tap. This is a 2-line CSS change in `/kitchen/orders/+page.svelte`.

**The staff story:** *"Nag-tap ako ng sides item, natamaan ko yung label ng section. Nawala lahat ng nakikita ko. Isang klik lang — wala na. Kailangan ko pang hanapin ulit kung saan ko ipinapakita."*

---

[14] **No round counter on refill items — cannot distinguish Round 2 from Round 4**

**What:** Refill items on the KDS show a "REFILL" badge (meat only) or no badge at all (sides), but there is no Round N counter anywhere. Pedro and Lito cannot tell whether a Samgyupsal REFILL is Round 2 or Round 4 for a given table. Similarly, when a table refills rice for the third time, Corazon cannot verify this is the expected volume vs. an error.

**How to reproduce:** Open `/kitchen/orders`. Send multiple refills from the POS to the same table. Observe — the KDS shows "REFILL" badge per item but no "Round 2" / "Round N" counter anywhere on the ticket, header, or section.

**Why this breaks:** An AYCE table that refills meat 4+ times is using significantly more stock than average. The kitchen should be aware — both to manage stock and to flag potential leftover penalty situations. A Round 5 refill on a 2-person table is a signal that might need manager attention. Without round counters, Pedro and Lito have no aggregate context — each refill looks identical to the last. This matches KP-04 (Refill Items Not Visually Separated — systemic, 6/12 audits).

**Ideal flow:** Track refill round number per table in the order or KDS ticket data. Display as "Round 2" header or badge on refill items: `Round 2 · Samgyupsal REFILL`. On the section header: "🔄 3 refills (Rounds 2–4)". This helps kitchen staff triage refill urgency (Round 2 is expected; Round 6 at the same table is a flag).

**The staff story:** *"Hindi ko alam kung ilan nang beses nag-refill yung table na iyon. Parang REFILL na naman ito, basta. Kaysa mag-ask pa, naghanda na lang ako."*

---

[15] **No "package required" hint in AddItemModal — CHARGE disabled silently**

**What:** The AddItemModal opens with 5 category tabs (Package, Meats, Sides, Dishes, Drinks). If a new or stressed cashier navigates to Meats first and adds items without selecting a package, the CHARGE button shows "⚡ CHARGE (0)" — disabled with no explanatory text. The cashier doesn't know why items won't charge.

**How to reproduce:** Open AddItemModal for a new table. Navigate to the Meats tab. Add a meat item. Observe the CHARGE button: disabled at 0, no tooltip or label explaining why.

**Why this breaks:** Maria, during an extreme rush with 6 tables open, opens T5 and goes straight to Meats by habit (a new staff member's reflex — "get the food ordered first"). She adds Samgyupsal. The CHARGE button shows 0. She taps it — nothing happens. She taps it again. She has to mentally backtrack: was it the package? Did the items not save? Is it a bug? Under time pressure, this ambiguity costs 20+ seconds and creates anxiety. CHARGE (0) disabled with no guidance is a silent failure state.

**Ideal flow:** Show an inline hint below the CHARGE button when `pendingCount === 0` and no package is selected: "Select a package first to enable charging." Alternatively, if the Package tab is the only tab that enables charging, add a persistent mini-badge on the Package tab "Required" or auto-navigate to the Package tab on first open (which the modal already does — reinforce it with a tooltip on the Meats tab if no package exists: "Add a package first").

**The staff story:** *"Pinindot ko yung CHARGE, hindi gumagana. Akala ko nag-crash. Lumabas na si boss at nagtanong bakit hindi pa naka-order yung table. Yun pala hindi pa pala ako nag-select ng package."*

---

## Fix Checklist

- [x] [01] Fix session overwrite on kitchen navigation — `/kitchen/all-orders` must not reset session; audit `+layout.svelte` guards across all kitchen routes
  > **Fix:** Added `if (!session.userName) { goto('/'); return; }` as the first check in the kitchen `+layout.svelte` guard — unauthenticated sessions go to login, authenticated kitchen users navigate freely between all `/kitchen/*` routes without any session state being written or reset. `src/routes/kitchen/+layout.svelte`
  > **Validate:** Visibility of System Status ✅ · Consistency ✅ · Jakob's Law ✅

- [x] [02] Fix "Skip — I'll add float later" button — must close the Start Your Shift overlay immediately
  > **Fix:** `shiftStarted` was a `$derived` reading `localStorage` directly — not reactive. Introduced `let localShiftStarted = $state(...)` initialized from localStorage; Skip handler now also sets `localShiftStarted = true`, making the overlay collapse reactively. `src/routes/pos/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · Error Prevention ✅ · Fitts's Law ✅

- [x] [03] Bump KDS item name text from `text-sm` (14px) to `text-base`/`text-lg` (16–18px) in `/kitchen/orders/+page.svelte` lines 661, 756; bump badge text from `text-xs` to `text-sm`
  > **Fix:** `text-sm` → `text-base` on item name spans in both MEATS and DISHES loops. Status badge text (`text-xs`) → `text-sm` on REFILL, WEIGHING, and READY badges. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** WCAG Target Size ✅ · Motor Efficiency ✅ · Fitts's Law ✅

- [x] [04] Replace 10% tint status badge fills with solid fills — WEIGHING → `bg-blue-600 text-white`, READY → `bg-status-green text-white`, REQUESTING → `bg-accent text-white`
  > **Fix:** WEIGHING `bg-blue-100 text-blue-600` → `bg-blue-600 text-white`; READY `bg-status-green/10 text-status-green` → `bg-status-green text-white`; REFILL `bg-amber-100 text-amber-800` → `bg-amber-500 text-white`. Timer urgency badges untouched. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** WCAG Contrast ✅ · Visibility of System Status ✅ · Gestalt (Similarity) ✅

- [x] [05] Increase Quick Bump button from 32px to `min-h-[56px]` — or remove in favor of ALL DONE only
  > **Fix:** Quick Bump changed from `px-3 py-1 text-xs` with `style="min-height: 32px"` to `px-6 text-sm font-semibold min-h-[56px]`. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Fitts's Law ✅ · Visual Hierarchy ✅ · WCAG Target Size ✅

- [x] [06] Add `isRefill` badge and section count pill to DISHES & DRINKS item render loop — parallel to existing meat implementation (lines 645, 620–625)
  > **Fix:** DISHES loop now detects `isDishRefill = item.notes === REFILL_NOTE` and shows animated amber `bg-amber-500 text-white` REFILL badge with round number. DISHES section header now has `pendingDishRefillCount` pill + `maxDishRefillRound` — parallel to MEATS header implementation. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Jakob's Law ✅ · Consistency ✅ · Gestalt (Similarity) ✅

- [x] [07] Add "New Tables" counter badge on KDS derived from recently-opened orders without kitchen tickets
  > **Fix:** Added `newTableCount` `$derived.by()` counting orders where `status === 'open'`, `items.length === 0`, and `createdAt` within last 10 minutes. `🆕 N new table(s)` badge (accent orange) renders in the Live indicator header row when count > 0. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · KP-03 Cross-Role Handoff ✅

- [x] [08] Scope ALL DONE button to current kitchenFocus station — only mark items belonging to the active station role
  > **Fix:** `completeAll()` now reads `session.kitchenFocus` — grill only marks MEATS items served, sides only marks DISHES items served, no focus marks all. `allDoneLabel` derived changes button text: "MEATS DONE ✓" / "DISHES DONE ✓" / "ALL DONE ✓". `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Gestalt (Similarity) ✅ · Consistency ✅ · Error Prevention ✅

- [x] [09] Increase BT scale trigger from `p-2 rounded-full` (~36px) to `min-h-[56px] min-w-[56px] px-4` with text label; add inline "Scale disconnected" banner to weigh station center panel
  > **Fix:** `BluetoothScaleStatus.svelte` button changed to `min-h-[56px] min-w-[56px] flex items-center justify-center gap-1.5 rounded-lg px-3` + `<span class="hidden text-xs font-medium sm:inline">` label. `src/lib/components/BluetoothScaleStatus.svelte`
  > **Validate:** Fitts's Law ✅ · WCAG Target Size ✅ · Motor Efficiency ✅

- [x] [10] Add inline `⚠ Scale disconnected` banner on weigh station center panel when `btConnected === false` — visible above the numpad, `min-h-[64px]`
  > **Fix:** Yellow warning banner added to CENTER panel of weigh station, conditional on `!btConnected`. 64px min-height, shows warning text + "Reconnect →" button (56px) calling `startScan()`. `src/routes/kitchen/weigh-station/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · Error Prevention ✅ · Fitts's Law ✅

- [x] [11] Change meat item selector on weigh station from `min-height: 52px` to `min-height: 56px`; fix mode toggle buttons from `min-height: unset`
  > **Fix:** All `min-height: 52px` → `min-height: 56px` on meat order selector buttons. Manual and Scale mode toggle buttons changed from `min-height: unset` → `min-height: 56px`. `src/routes/kitchen/weigh-station/+page.svelte`
  > **Validate:** Fitts's Law ✅ · WCAG Target Size ✅ · Motor Efficiency ✅

- [x] [12] Replace `<input type="number">` in delivery and waste quantity fields with the reusable numpad component when `role === 'kitchen'`
  > **Fix:** Delivery and waste quantity inputs changed to `type="tel" inputmode="numeric"` with `style="min-height: 56px; font-size: 18px"` — forces numeric keypad on tablet OSes. `QuickNumberInput` is a card widget not a drop-in input, so `inputmode` approach applied. `src/lib/components/stock/ReceiveDelivery.svelte`, `src/lib/components/stock/WasteLog.svelte`
  > **Validate:** Motor Efficiency ✅ · Fitts's Law ✅ · Consistency ✅

- [x] [13] Remove `style="min-height: unset"` from MEATS and DISHES section header buttons in KDS — replace with `py-3.5` or `min-h-[44px]`
  > **Fix:** Removed `style="min-height: unset"` from both section header toggle buttons. Added `min-h-[44px]` class and `py-3` padding. `src/routes/kitchen/orders/+page.svelte`
  > **Validate:** Fitts's Law ✅ · WCAG Target Size ✅ · KP-01 ✅

- [x] [14] Add round counter tracking to refill items — display "Round N" on refill items and section header pill
  > **Fix:** Per-item `meatRefillRound` and `dishRefillRound` IIFEs compute round = indexOf(item among refills for same `menuItemName`) + 2. REFILL badges show "Rnd N · REFILL". Section header pills show "↺ N refills · Rnd N". `src/routes/kitchen/orders/+page.svelte` (+ `menuItemId` → `menuItemName` type fix by orchestrator)
  > **Validate:** Visibility of System Status ✅ · Miller's Law ✅ · KP-04 ✅

- [x] [15] Add inline "Select a package first" hint to CHARGE button when disabled and no package is selected in AddItemModal
  > **Fix:** Tab-level amber note on meats/sides/dishes tabs when no package set. Gray hint below CHARGE button when disabled and dine-in order has no package. Both guards against takeout orders. `src/lib/components/pos/AddItemModal.svelte`
  > **Validate:** Visibility of System Status ✅ · Error Prevention ✅ · Hick's Law ✅

---

## Cross-Role Handoff Failures (Multi-User Specific)

The following are coordination gaps that only appear when multiple roles operate simultaneously — invisible in single-user audits:

| Handoff | From | To | Gap |
|---|---|---|---|
| Table opened | Maria (Staff) | Corazon (Sides) | No signal — Corazon doesn't know to stage utensils/banchan |
| Refill requested (sides) | Maria (Staff) | Corazon (Sides) | No REFILL badge on dish items — looks identical to original order |
| ALL DONE tapped (grill) | Lito (Grill) | Corazon (Sides) | Clears Corazon's items she hasn't served yet — silent data loss |
| Item voided (floor) | Maria (Staff) | Pedro/Lito (KDS) | No void signal on KDS — kitchen continues prepping cancelled item |
| Scale disconnected | Benny (Butcher) | Maria (Staff) | Weights enter manually without floor knowing — WEIGHING items never update |
| Kitchen navigation | Pedro/Lito | Any | Session overwrite redirects kitchen cook to /pos — lost KDS context |

---

## Overall Verdict

This is the most severe multi-role audit yet. **9 of 14 UX principles fail** — not because the app is poorly built in isolation, but because the kitchen sub-roles expose a coordination layer that was designed for single-user operation.

The weigh station core (numpad 72px, DISPATCH 64px, weight display 6xl) is excellent. The kitchenFocus partition system shows real design intent. The checkout flow improvements from the previous audit are confirmed working. These are genuine strengths.

But the shared KDS is designed as if one person reads it. In reality, Lito, Pedro, and Corazon all look at the same screen — and their responsibilities, touch targets, and signals collide. The session overwrite bug is an operational catastrophe waiting to happen mid-service.

**Critical fixes (block service):** [01] Session overwrite · [02] Skip float button · [06] Sides refill badge
**High-impact fixes (shift quality):** [04] Badge contrast · [05] Quick Bump size · [08] Station-scoped ALL DONE · [09] BT trigger size · [10] BT disconnect banner
**Polish (ongoing):** [03] Text size · [07] New table signal · [11] Meat selector size · [12] Numpad for forms · [13] Section headers · [14] Round counter · [15] Package hint
