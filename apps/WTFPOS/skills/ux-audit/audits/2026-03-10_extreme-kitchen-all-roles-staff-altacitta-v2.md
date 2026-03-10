# UX Audit — Extreme Full Service: All Kitchen Roles + Staff · v2 (Post-Fix Verification + Sides Prep First Audit)

**Date:** 2026-03-10
**Mode:** Multi-user · Parallel browser sessions
**Roles:** Maria Santos (Staff · extreme orders) · Corazon Dela Cruz (Kitchen/Sides · primary) · Pedro Cruz (Kitchen/KDS · general) · Benny Flores (Kitchen/Butcher)
**Branch:** Alta Citta (tag)
**Scenario:** Friday night peak rush — 8 tables simultaneously occupied, extreme order volume, all kitchen sub-roles active simultaneously, one staff cashier managing the floor alone. NEW: auditing the newly-shipped `/kitchen/sides-prep` page for the first time, plus verifying all 15 fixes from v1 audit held.
**Viewport:** 1024×768 tablet landscape (all sessions)
**Skill version:** v4.4.0
**Agents:** 4 parallel (agent-maria, agent-corazon, agent-pedro, agent-benny)

---

## A. Text Layout Map

### Maria Santos — POS floor under extreme load (skip modal → floor → table opening)

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                           │
├──┤──────────────────────────────────────────────────────────────────────│
│🛒│  ┌──────────── "Start Your Shift" overlay (FIXED ✅) ─────────────┐  │
│  │  │ Cash Float Declaration                  [✕ or Skip works now] │  │
│  │  └────────────────────────────────────────────────────────────────┘  │
│  │  ── After skip: POS floor plan ─────────────────────────────────────│
│  │  [BEEF T1 ▓▓] [PORK T2 ▓▓] [T3 FREE] [T4 ▓▓] [T5 FREE]           │
│  │  [BEEF T6 ▓▓] [BEEF T7 ▓▓▓] [PORK T8 ▓▓] [T9 FREE]               │
│  │  ┌───────────────────────────────────┐                              │
│  │  │  T1  ── order sidebar ──          │                              │
│  │  │  2pax · Beef Unlimited 2m ⏱      │                              │
│  │  │  [🔄 Refill] [Add Item]          │                              │
│  │  │  Samgyupsal        SENT   ₱399   │                              │
│  │  │  USDA Beef         WEIGHING      │ ← fold                       │
│  │  │  Pork Sliced [4 requesting ▼]   │                              │
│  │  │  BILL  4    ₱1,596.00           │                              │
│  │  │  [Print] [Void] [Checkout]       │                              │
│  │  └───────────────────────────────────┘                              │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Corazon — /kitchen/sides-prep (NEW PAGE — first audit)

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA · 🥗 Sides Prep  [◉ Live]  [BT icon 56px ✅]        │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  ┌─────────────────────────────────────── New Tables (orange) ────┐ │
│  │  │ 🆕 New Tables — Stage Utensils                                  │ │
│  │  │  [T5 · 4 pax · 2m ago  ✓ Staged 56px ✅]                       │ │
│  │  │  [T8 · 2 pax · 1m ago  ✓ Staged 56px ✅]                       │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │
│  │                                                                       │
│  │  🔄 Refill Queue  [9]                                                │
│  │  ┌──────────────────────────────────────────────────────────────────┐│
│  │  │ Rice                         ×4  [BATCH DONE ✓  64px ✅]       ││
│  │  │ [T1 2m] [T3 5m] [T5 1m] [T7 3m]  ← chips 56px ✅              ││
│  │  ├──────────────────────────────────────────────────────────────────┤│
│  │  │ Kimchi                       ×3  [BATCH DONE ✓  64px ✅]       ││
│  │  │ [T2 4m] [T4 6m] [T8 2m]                                        ││
│  │  ├──────────────────────────────────────────────────────────────────┤│
│  │  │ Banchan Set                  ×2  [BATCH DONE ✓  64px ✅]       ││
│  │  └──────────────────────────────────────────────────────────────────┘│
│  │                                  ← fold (768px)                      │
│  │  ⚠️ Service Alerts                   ← NO count badge [P1]          │
│  │  ┌──────────────────────────────────────────────────────────────────┐│
│  │  │ T3  · More chopsticks  · 7m ago  [Done ✓  56px ✅]  ← BUT:    ││
│  │  │                                    bg-status-yellow text-white  ││
│  │  │                                    contrast 2.1:1 → FAIL [P0]  ││
│  │  │ T6  · Request napkins  · 3m ago  [Done ✓  56px ✅]             ││
│  │  └──────────────────────────────────────────────────────────────────┘│
│  │                                                                       │
│  │  [📊 View all table sides status  56px ✅]  ← collapsible reference │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Pedro — /kitchen/orders (v1 fix verification)

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA · [◉ Live] [🆕 2 new tables ✅]  [UNDO LAST 48px ✅]│
├──┤──────────────────────────────────────────────────────────────────────│
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  │ T1  8m 🔴   │  │ T2  3m      │  │ T4  6m 🟡   │                  │
│  │  │ MEATS ▼ [44px ✅]            │  │ MEATS  [44px]│                  │
│  │  │  Samgyupsal [bg-blue-600    ]│  │  USDA Beef  │                  │
│  │  │  text-white → WEIGHING ✅    │  │  WEIGHING ✅ │                  │
│  │  │  Rnd2·REFILL [amber-500 ✅] │  │             │                  │
│  │  │ DISHES ▼ [44px ✅]           │  │ DISHES [44px]│                  │
│  │  │  [item text-base 16px ✅]   │  │  Rice       │                  │
│  │  │ [Quick Bump  56px ✅]       │  │             │                  │
│  │  │ [ALL DONE ✓  56px ✅]      │  │ [ALL DONE ✓]│                  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │
│  │   allDoneLabel = "ALL DONE ✓" (no kitchenFocus set — Pedro ✅)      │
└──┴──────────────────────────────────────────────────────────────────────┘
```

### Benny — /kitchen/weigh-station (v1 fix verification)

```
┌──┬──────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA  [BT Scale 56px label ✅]                             │
├──┤──────────────────────────────────────────────────────────────────────│
│  │  Pending meat list    Center panel                                    │
│  │  [T1 Samgyupsal  56px ✅]  ┌─ ⚠ Scale disconnected ──────────────┐  │
│  │  [T2 USDA Beef   56px ✅]  │  Reconnect → [button 56px ✅] 64px  │  │
│  │  [T4 Pork Belly  56px ✅]  └──────────────────────────────────────┘  │
│  │                            [Manual] [Scale] → mode toggle 56px ✅    │
│  │                            [numpad 72px ✅]                          │
│  │                            [DISPATCH 64px ✅]                        │
└──┴──────────────────────────────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|---|---|---|
| 1 | Hick's Law (reduce choices) | PASS | Sides Prep has clear 4-section hierarchy: New Tables → Refill Queue → Service Alerts → Status. Refill Queue collapses into cards by item name (aggregation reduces 9 individual decisions to 3 category decisions) |
| 2 | Miller's Law (chunk info) | PASS | Refill Queue groups by item name (×4 Rice, ×3 Kimchi) — reduces 9 refill items to 3 meaningful chunks. New Tables are individual chips (at most 3-4 during rush — within 7±2). KDS Queue (Pedro) unchanged — still within limits after ticket-merge fix |
| 3 | Fitts's Law (target size) | PASS with CONCERN | All primary buttons 56-64px ✅. Table chips 56px ✅. Volume slider touch area 44px ✅. **CONCERN:** `text-[10px]` chip wait-time label at 10px — not a tap target, but reduces readability of adjacent button metadata |
| 4 | Jakob's Law (POS conventions) | PASS | Sides Prep section hierarchy follows standard ticket-board conventions. BATCH DONE mirrors existing bump pattern. KDS allDoneLabel now changes per focus ("MEATS DONE ✓" / "DISHES DONE ✓" / "ALL DONE ✓") — contextually logical |
| 5 | Doherty Threshold (<400ms) | PASS | RxDB local-first, all writes instant. Sides Prep `batchMarkRefillDone` fires `markItemServed` per item — no batching at DB layer, but UI responds immediately. Under 9 items this is imperceptible |
| 6 | Visibility of System Status | CONCERN | Sides Prep: Refill Queue shows live count badge `[9]` ✅. Service Alerts shows NO count badge — a manager glancing at the page cannot gauge severity at a glance. **CONCERN** rather than FAIL because the alert items themselves are still visible |
| 7 | Gestalt: Proximity | PASS | Sides Prep refill groups: item name + quantity badge + BATCH DONE form a clear proximity group. Table chips cluster within the group card. Status reference panel is separated by whitespace. KDS: MEATS / DISHES sections remain well-separated |
| 8 | Gestalt: Similarity | FAIL | Service Alerts "Done ✓" button uses `bg-status-yellow text-white` (contrast 2.1:1 — FAIL). All other action buttons use `bg-status-green text-white` (3.5:1, acceptable for large text) or `bg-accent text-white` (4.6:1). The yellow "Done ✓" breaks the visual similarity of button treatment AND fails AA |
| 9 | Visual Hierarchy (primary CTA) | PASS | Sides Prep: BATCH DONE (64px, green) is the largest and most prominent action — correct, as batch operations outrank single operations during a rush. "✓ Staged" (56px) secondary to BATCH DONE |
| 10 | Visual Hierarchy (info density) | PASS | Sides Prep shows maximum 4 section headers simultaneously, all clearly sized and spaced. Under rush load (9 refills), the Refill Queue card list is 3 cards (grouped by item) — information density is excellent |
| 11 | WCAG Contrast | FAIL | **P0:** Service Alerts "Done ✓" button: `bg-status-yellow (#F59E0B) text-white (#FFFFFF)` = 2.1:1. Critically fails WCAG AA (requires 4.5:1 for small text). KDS badge fixes from v1 audit confirmed holding (WEIGHING → bg-blue-600 text-white ✅, READY → bg-status-green text-white ✅) |
| 12 | WCAG Target Size | PASS with CONCERN | All tappable buttons ≥56px ✅. **CONCERN:** `text-[10px]` wait-time label inside table chips is not a tap target but is meta-information Corazon reads while tapping — sub-12px text fails kitchen readability standard |
| 13 | Consistency (internal) | PASS | Refill Queue BATCH DONE pattern = Green (matches bump conventions). New Tables "✓ Staged" on orange background = consistent with the accent-primary pattern. KDS refill DISHES badge (amber-500) matches MEATS badge from v1 fix ✅ |
| 14 | Consistency (mental model) | PASS | Kitchen layout guard fix from v1 confirmed — no session overwrites when navigating between `/kitchen/orders`, `/kitchen/sides-prep`, `/kitchen/weigh-station`, `/kitchen/all-orders`. All sub-nav navigations stable |

**Summary: 8 PASS · 3 PASS with CONCERN · 2 FAIL (both on sides-prep)**
**v1 improvement: 2 PASS → 8 PASS · 9 FAIL → 2 FAIL**

---

## C. Best Day Ever — Friday Night Rush, Alta Citta

It's 7:45 PM. The earlier chaos is partly tamed — all 15 v1 fixes are live. But tonight, Corazon is on a dedicated Sides Prep tablet for the first time.

**Maria** is alone at the register. She opens T5, enters 4 pax, and hits the CHARGE button — which sends the order to the kitchen. She notices she still needs to enter the package, but the inline hint ("Select a package first") catches her before she taps CHARGE fruitlessly. T5's ticket appears on Pedro's KDS within seconds. She moves immediately to T6.

**Pedro** monitors the KDS queue. 7 active tickets. He spots the "🆕 2 new tables" badge in the top-right corner and calls across to Corazon. She's already looking at her dedicated Sides Prep tablet and sees the orange banner — "🆕 New Tables — Stage Utensils — T5 · 4 pax · 2m ago." She taps "✓ Staged" on T5. The banner clears for T5 and she moves to T8's utensil set.

**Corazon's Refill Queue** shows 9 total across 3 items: Rice ×4, Kimchi ×3, Banchan ×2. She grabs four portions of rice, plates them, and taps BATCH DONE ✓ on the Rice card. All 4 refill items clear simultaneously. She moves to Kimchi without scrolling through individual items. The grouped view saves her ~15 seconds per refill cycle vs. reading individual tickets on the shared KDS.

Then a guest at T3 calls out. Corazon glances at the Service Alerts section — two items listed. She preps chopsticks and napkins. She reaches for the "Done ✓" button on T3's alert. It's yellow — a standard convention in her mind for "service items" — but the white text on yellow is nearly invisible in the bright kitchen task lighting. She squints, confirms it says "Done" and taps it. It works, but the visual effort was unnecessary. The label would be perfectly readable in dark gray.

**Benny** at the weigh station gets the yellow "⚠ Scale disconnected" banner immediately when his Bluetooth cuts. He taps "Reconnect →" (64px, unmissable with gloved hands) and the scale pairs within 8 seconds. He's back to weighing. No silent manual entry this time.

**Lito** on the grill taps "MEATS DONE ✓" when his cuts are ready — and only the meat items clear. Corazon's Rice refill on that ticket stays pending. She serves it 2 minutes later. Zero duplicate rice prep tonight. A small victory that adds up to hours of saved prep time over a week.

At 9:15 PM, Pedro navigates to All Orders to look up a ticket. The page loads. He's still Pedro Cruz. He navigates back to Order Queue. Still Pedro Cruz. The session holds.

---

## D. Recommendations

[01] **Service Alerts "Done ✓" button: `bg-status-yellow text-white` — contrast 2.1:1, WCAG critical FAIL**

**What:** The Service Alerts section in `/kitchen/sides-prep/+page.svelte` (line 247) uses `bg-status-yellow px-4 font-bold text-white` for the "Done ✓" action button. `#F59E0B` (status-yellow) on `#FFFFFF` (white) = 2.1:1 contrast ratio — far below the 4.5:1 WCAG AA minimum for small text. This was explicitly flagged in the Design Bible: *"Status yellow is NEVER accessible as standalone text — always pair with icon or dark text label."*

**How to reproduce:** Open `/kitchen/sides-prep` and view the Service Alerts section. Inspect the "Done ✓" button: `class="... bg-status-yellow ... text-white"`. In a bright-lit kitchen environment (400–600 lux per ENVIRONMENT.md), the white text disappears entirely into the yellow background.

**Why this breaks:** This is the action button Corazon taps to resolve service requests (extra chopsticks, napkins, condiments). It's used 10–20× per shift, by hands that may be wet or gloved. If the button text is unreadable, Corazon must either guess or lean in close to read it — both costly at peak rush. This is KP-02 (Low-Contrast Status Badges — systemic, 9/12 prior audits), reintroduced in new code.

**Fix:** Change `text-white` to `text-gray-900`. `#111827` on `#F59E0B` = 8.9:1 — passes AAA. Alternatively use `bg-amber-500 text-white` (amber-500 = `#D97706`): `#FFFFFF` on `#D97706` = 3.0:1 — still fails. Use `text-gray-900` on yellow — that is the only accessible combination.

```svelte
<!-- Before -->
'flex-shrink-0 rounded-xl bg-status-yellow px-4 font-bold text-white hover:opacity-90 active:scale-95 transition-all',

<!-- After -->
'flex-shrink-0 rounded-xl bg-status-yellow px-4 font-bold text-gray-900 hover:opacity-80 active:scale-95 transition-all',
```

**The staff story:** *"Yung dilaw na button, parang wala akong nakikitang text. May alam lang akong gagawin doon dahil alam ko kung nasaan siya. Kung bago pa lang ako, hindi ko mahahanap."*

---

[02] **Service Alerts section has no count badge — severity invisible at a glance**

**What:** The Refill Queue section header shows `🔄 Refill Queue [9]` — an orange count badge indicating 9 pending refills. The Service Alerts section header shows only `⚠️ Service Alerts` with no count. Under peak rush with 4+ simultaneous service requests (chopsticks, napkins, condiment refills), Corazon cannot gauge severity without reading individual rows.

**How to reproduce:** Open `/kitchen/sides-prep` with multiple active service alerts. Compare the Refill Queue header (has count badge) vs. Service Alerts header (no badge). Source: line 237 has only `<h2>⚠️ Service Alerts</h2>` — no count binding.

**Why this breaks:** Per the 3-second glance test (ENVIRONMENT.md peak rush rule): Corazon is moving between prep stations. She glances at the tablet for 1–2 seconds to prioritize her next action. Refill Queue shows `[9]` — immediately urgent. Service Alerts shows nothing countable — she has to stop and read. Inconsistency in section severity signaling adds cognitive load exactly when it's most expensive. Per KP-07 (Information Density Exceeding Miller's Law) — when severity is not scannable, users mentally re-read every item to re-assess priority.

**Fix:** Add `serviceAlerts.length` badge matching the Refill Queue pattern:
```svelte
<!-- Line 237 -->
<h2 class="text-base font-bold text-gray-700 uppercase tracking-wide">
  ⚠️ Service Alerts
  {#if serviceAlerts.length > 0}
    <span class="rounded-full bg-status-yellow px-2.5 py-0.5 text-sm font-black text-gray-900">
      {serviceAlerts.length}
    </span>
  {/if}
</h2>
```

**The staff story:** *"Nag-check ako ng Service Alerts, hindi ko alam kung isa lang o sampung hinihingi. Kailangan pa akong basahin lahat bago ako makapag-desisyon kung gaano ka-urgent."*

---

[03] **Table chip wait-time uses `text-[10px]` — below 12px kitchen readability minimum**

**What:** Each table chip inside Refill Queue groups shows a wait-time label using `class="text-[10px] font-normal opacity-70"` (line 225). This renders at 10px — below the 12px absolute minimum for caption text, and far below the 14px body text minimum for kitchen viewing distance of 60–90cm (ENVIRONMENT.md).

**How to reproduce:** Open `/kitchen/sides-prep`. Look at any table chip inside a Refill Queue card (e.g., "[T1 · 2m ago]"). Inspect the `timeAgo(item.waitingSince)` span: `class="text-[10px] font-normal opacity-70"`. Step back 60cm from the screen — the wait-time text becomes illegible.

**Why this breaks:** The wait-time inside chips tells Corazon how urgent each table's refill is. A Rice refill that has been waiting 6 minutes is an embarrassment — the table has been sitting without rice. A Rice refill waiting 30 seconds can be queued. At 10px through kitchen lighting and at 60cm viewing distance, Corazon cannot distinguish "2m" from "6m" without moving closer. The opacity-70 modifier further reduces effective contrast. This is a direct ENVIRONMENT.md violation.

**Fix:** Change `text-[10px]` to `text-xs` (12px). Remove the opacity modifier or increase to `opacity-80`. This is a 1-character change:
```svelte
<!-- Before -->
<span class="text-[10px] font-normal opacity-70">{timeAgo(item.waitingSince)}</span>

<!-- After -->
<span class="text-xs font-medium opacity-80">{timeAgo(item.waitingSince)}</span>
```

**The staff story:** *"Yung oras sa loob ng chip — wala ko matanaw kung ilan minuto na. Masyado kasing maliit. Binasa ko nalang kung saan mas maliwanag."*

---

[04] **New Tables section has no empty-state — invisible to first-time users until a table fires**

**What:** The New Tables section at the top of `/kitchen/sides-prep` only renders when `unacknowledgedNewTables.length > 0`. When empty, the entire section disappears — no placeholder, no label, no explanation. New kitchen runners using Sides Prep for the first time see a page that starts directly with the Refill Queue section and have no idea a "New Tables" notification system exists.

**How to reproduce:** Open `/kitchen/sides-prep` during a quiet period (no recently-opened tables). The New Tables section is invisible — there is no element where it would be, no "No new tables" state, no structural hint. Source: line 150 wraps the entire section in `{#if unacknowledgedNewTables.length > 0}`.

**Why this breaks:** This page is new to the kitchen workflow. Corazon — or any new Sides Prep operator — won't know to look for the orange banner unless a table happens to open in the first 15 minutes of their shift. If she sets up her workflow without knowing the banner exists, she'll miss the first 2–3 new table signals of the shift. This is the core purpose of the Sides Prep page (staging utensils for new tables) — its primary feature being invisible on first load is a discoverability FAIL. Matches KP-10 (Empty States Without Context — 7/12 prior audits).

**Fix:** Show a minimal always-visible label when the section is empty. Keep it compact — it must not compete with the Refill Queue when there are no new tables:
```svelte
{#if unacknowledgedNewTables.length > 0}
  <!-- existing orange banner -->
{:else}
  <div class="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 min-h-[48px] text-sm text-gray-400">
    🆕 <span>New table alerts will appear here when a table opens</span>
  </div>
{/if}
```

**The staff story:** *"Unang araw ko sa Sides Prep tablet. Hindi ko alam na may New Tables section pala. Nag-notify lang si Maria sa akin verbally na may bagong table. Hindi ko na-set up ang T6 agad."*

---

[05] **No audio notification for new refills on sides-prep — Corazon misses incoming requests while moving**

**What:** `/kitchen/orders` plays `new-order.wav` whenever a new ticket arrives (lines 119–128). `/kitchen/sides-prep` has no audio notification when new refill items appear in the Refill Queue. When Corazon is moving between prep stations — washing vegetables, portioning rice, plating banchan — she cannot see the tablet screen. New refill requests silently pile up with no auditory signal.

**Why this breaks:** Per ROLE_WORKFLOWS.md, Corazon handles 30–50 refill requests per shift. Her workflow alternates between eyes-on-tablet (reading the queue) and eyes-off-tablet (physical prep). The KDS has always had audio for this reason — the sound tells Pedro to look up from the grill. Corazon has the same use pattern but no equivalent signal. A Rice refill that waits 4–5 minutes because Corazon didn't hear it come in is a table experience failure. This is a P2 because the page is new and the audio infrastructure already exists in the KDS — it's an extension, not new work.

**Ideal fix:** Add a lightweight `$effect` in `sides-prep/+page.svelte` that plays a distinct sound (different pitch from new-order.wav) when `refillQueue` total count increases. Reuse the same `new-order.wav` at lower volume or implement a simple Web Audio API tone (as already done for void beep in `kitchen/orders`). The void beep implementation is a 15-line copy-paste.

**The staff story:** *"Nandoon na ko sa prep station, hindi ko nakita na nag-refill na yung tatlong table. Nang tiningnan ko, 5 minutes na pala. Sorry na lang ako."*

---

[06] **Service alerts have no urgency escalation — a 10-minute-old request looks the same as a 30-second one**

**What:** Service alert rows in the list are always styled the same — `bg-status-yellow/10` card background, `text-gray-800` item text, `text-gray-500` timestamp. A request for extra chopsticks waiting 10 minutes looks visually identical to one that arrived 30 seconds ago. There is no urgency color shift (yellow → amber → red) as wait time increases.

**Why this breaks:** KDS tickets have urgency escalation built-in (`WARN_MS = 5min → warning border, CRIT_MS = 10min → critical red border`). Service alerts affect table satisfaction equally — a guest waiting 10 minutes for extra chopsticks is as impactful as a meal waiting 10 minutes. The `timeAgo(item.waitingSince)` timestamp is present but purely textual at 10px — it doesn't trigger any visual urgency signal. Corazon serves alerts in list order (oldest first per `.sort()`), but she can't tell at a glance which ones are critically overdue.

**Ideal fix:** Add urgency theming to service alert rows:
- < 3 min: current styling (neutral yellow)
- 3–5 min: `bg-amber-100 border-amber-300` with `text-amber-800`
- > 5 min: `bg-red-50 border-red-200` with bold timestamp in `text-status-red`

Mirrors the KDS urgency model — consistent mental model across kitchen pages.

**The staff story:** *"Yung mga request sa ibaba, hindi ko alam kung gaano na sila katagal naghihintay. Nakita ko na 10 minutes na yung isa nung pinindot ko. Nalaman ko dahil sa oras na nakalagay, hindi sa kulay."*

---

## Previous Audit Fix Verification (v1 → v2)

All 15 issues from `2026-03-10_extreme-kitchen-all-roles-staff-altacitta.md` confirmed **holding** in current codebase:

| Issue | Fix status | Verified by |
|---|---|---|
| [01] Session overwrite on kitchen nav | ✅ HELD | Kitchen layout guard confirmed — no session reset on sub-nav transitions |
| [02] Skip float button non-functional | ✅ HELD | `localShiftStarted = $state()` pattern confirmed; Skip closes overlay immediately |
| [03] KDS item text 14px → 16px | ✅ HELD | `text-base` confirmed on item name spans |
| [04] Tint status badges → solid fills | ✅ HELD | `bg-blue-600 text-white` (WEIGHING), `bg-status-green text-white` (READY), `bg-amber-500 text-white` (REFILL) |
| [05] Quick Bump 32px → 56px | ✅ HELD | `min-h-[56px]` confirmed on Quick Bump |
| [06] Sides refill REFILL badge | ✅ HELD | DISHES loop has `isDishRefill` detection + amber-500 badge |
| [07] New table counter on KDS | ✅ HELD | `newTableCount` `$derived.by()` + badge in Live indicator row |
| [08] ALL DONE scoped to kitchenFocus | ✅ HELD | `completeAll()` reads `session.kitchenFocus`; allDoneLabel switches |
| [09] BT trigger 36px → 56px with label | ✅ HELD | `BluetoothScaleStatus.svelte` — `min-h-[56px] min-w-[56px]` + text label |
| [10] BT disconnect banner on weigh panel | ✅ HELD | Yellow 64px warning banner conditional on `!btConnected` |
| [11] Meat selector 52px → 56px | ✅ HELD | `min-height: 56px` on all meat order selector buttons |
| [12] Input → inputmode="numeric" on delivery/waste | ✅ HELD | `type="tel" inputmode="numeric"` in ReceiveDelivery + WasteLog |
| [13] Section headers min-height: unset removed | ✅ HELD | `min-h-[44px] py-3` on both MEATS and DISHES section headers |
| [14] Round counter on refill items | ✅ HELD | `meatRefillRound` / `dishRefillRound` IIFEs, "Rnd N · REFILL" badge |
| [15] Package hint on CHARGE button | ✅ HELD | Tab-level amber hint + gray caption below CHARGE when no package |

---

## Fix Checklist

- [x] [01] Fix Service Alerts "Done ✓" button — change `text-white` to `text-gray-900` on `bg-status-yellow` button in `/kitchen/sides-prep/+page.svelte` line 247
  > **Fix:** `text-white` → `text-gray-900`, `hover:opacity-90` → `hover:opacity-80`. Contrast: `#111827` on `#F59E0B` = 8.9:1 (AAA). `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** WCAG Contrast ✅ · Gestalt Similarity ✅ · KP-02 ✅

- [x] [02] Add count badge to Service Alerts section header — parallel to Refill Queue `[N]` badge
  > **Fix:** `<h2>` restructured to `flex items-center gap-2`; conditional `<span class="rounded-full bg-status-yellow px-2.5 py-0.5 text-sm font-black text-gray-900">{serviceAlerts.length}</span>` added. Uses `text-gray-900` (not `text-white`) for AA contrast on yellow. `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · Miller's Law ✅ · Gestalt Similarity ✅

- [x] [03] Change `text-[10px]` → `text-xs` and `opacity-70` → `opacity-80` on chip wait-time labels
  > **Fix:** `class="text-[10px] font-normal opacity-70"` → `class="text-xs font-medium opacity-80"` on `timeAgo` span inside table chips. `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** WCAG readability ✅ · ENVIRONMENT.md kitchen minimum (≥12px) ✅

- [x] [04] Add empty-state placeholder for New Tables section when `unacknowledgedNewTables.length === 0`
  > **Fix:** Added `{:else}` block with `min-h-[48px]` grey placeholder card: "🆕 New table alerts will appear here when a table opens". Section is now always structurally visible. `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · KP-10 (Empty States) ✅ · Jakob's Law ✅

- [x] [05] Add audio notification on new refill arrivals in sides-prep (reuse void beep Web Audio API pattern)
  > **Fix:** Added `playRefillTone()` (660Hz, 0.15s, gain 0.35 — distinct from 440Hz new-order chime and 880Hz void beep). `lastRefillTotal` `$state`, `isFirstRefillRun` guard, and `$effect` that plays tone only when `refillQueue` total increases. `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** Noise Tolerance ✅ · ENVIRONMENT.md ✅ · Visibility of System Status ✅

- [x] [06] Add urgency color escalation to service alert rows at 3min (amber) and 5min (red)
  > **Fix:** Added `alertUrgency(waitingSince)` helper returning `'normal' | 'warning' | 'critical'`. Each alert row is now an individual card with urgency-driven `cn()` classes: neutral (`border-status-yellow bg-status-yellow/10`) / warning (`bg-amber-100 border-amber-300`) / critical (`bg-red-50 border-red-200`). Timestamp span uses `text-status-red font-bold` at critical. `src/routes/kitchen/sides-prep/+page.svelte`
  > **Validate:** Visibility of System Status ✅ · Consistency (with KDS urgency model) ✅ · Serial Position Effect ✅

---

## Cross-Role Handoff Summary (v2 Multi-User View)

| Handoff | From | To | v1 Status | v2 Status |
|---|---|---|---|---|
| Table opened | Maria (Staff) | Corazon (Sides) | ❌ No signal | ✅ **FIXED** — New Tables banner + KDS counter |
| Sides refill sent | Maria (Staff) | Corazon (Sides) | ❌ No badge | ✅ **FIXED** — REFILL badge on dishes + sides-prep queue |
| ALL DONE tapped (grill) | Lito (Grill) | Corazon (Sides) | ❌ Clears Corazon's items | ✅ **FIXED** — station-scoped completeAll |
| Item voided (floor) | Maria (Staff) | Pedro/Lito (KDS) | ❌ No signal | ✅ **FIXED** — void overlay + beep |
| Scale disconnected | Benny (Butcher) | Self | ❌ Silent | ✅ **FIXED** — inline banner |
| Kitchen navigation | Pedro/Lito | Any | ❌ Session overwrites | ✅ **FIXED** — layout guard stable |
| Service request arrived | Guest → Maria | Corazon (Sides) | N/A (page new) | ⚠️ Silent — no audio signal (P2) |

---

## Overall Verdict

**This is a strong improvement from v1.** The shift from 9 FAIL / 3 CONCERN / 2 PASS to **2 FAIL / 3 CONCERN / 8 PASS** across the 14 principles represents a genuine shift in kitchen UX quality. All 15 prior fixes held without regression.

The new `/kitchen/sides-prep` page is **architecturally excellent**: the aggregated Refill Queue by item name is a meaningful UX invention that directly addresses Corazon's workflow (batch rice refills rather than individual ticket bumps). The New Tables banner solves the utensil-staging blind spot that was a CRITICAL finding in v1.

However, two issues on the new page need immediate attention before kitchen staff are fully onboarded:
- **P0:** Yellow button with white text — unreadable in kitchen lighting — 2-word fix
- **P1:** Missing count badge on Service Alerts — 8-line fix

**Critical (block full sides-prep rollout):** [01] Yellow button contrast · [03] Chip text size
**High-impact:** [02] Service Alerts count badge · [04] New Tables empty state
**Polish:** [05] Audio notifications · [06] Urgency escalation
