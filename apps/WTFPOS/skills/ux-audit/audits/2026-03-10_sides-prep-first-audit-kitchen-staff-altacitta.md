# UX Audit — /kitchen/sides-prep First Audit + Kitchen/Orders + Weigh-Station Verification

**Date:** 2026-03-10
**Mode:** Multi-user · Sequential sessions (Session A: Kitchen/Sides, Session B: Staff/POS)
**Roles:** Corazon Dela Cruz (Kitchen · 🥗 Sides focus · Alta Citta) · Maria Santos (Staff · Alta Citta)
**Branch:** Alta Citta (tag)
**Scenario:** Extreme Friday night full-service — first-time audit of `/kitchen/sides-prep` (new page), verification that previous fixes held on `/kitchen/orders` and `/kitchen/weigh-station`, cross-role POS check under extreme load
**Viewport:** 1024×768 tablet landscape
**Skill version:** v4.4.0
**Browser sessions:** 2 sequential (playwright-cli, headless)

---

## Page States Captured

| Page | State | Verdict |
|---|---|---|
| Login | Dev accounts panel | PASS |
| `/kitchen/sides-prep` | Empty (no refills, no alerts) | PASS |
| `/kitchen/sides-prep` | Table status panel expanded (no orders) | PASS |
| `/kitchen/orders` | Empty (0 pending, 65 served, 20m avg) | PASS |
| `/kitchen/weigh-station` | Empty + BT disconnected | PASS |
| `/kitchen/all-orders` | 1 open order visible | PASS |
| `/pos` | Floor plan + float modal | PASS |
| `/pos` | Floor plan + pax modal (T1 tapped) | PASS |

---

## A. Text Layout Maps

### Session A — /kitchen/sides-prep (Corazon, Sides Focus, Empty State)

```
┌──┬────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                              │
├──┤────────────────────────────────────────────────────────────────────────│
│🍳│  [🧾 All Orders] [📋 Order Queue] [⚖️ Weigh Station] [🥗 Sides Prep]   │
│🧾│                              [🥗 Sides Prep badge]  [BT Scale btn 56px]│
│  │  ─────────────────────────────────────────────────────────────────────│
│  │  🔄 Refill Queue                                                        │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  │                     ✅                                             │ │
│  │  │                No pending refills                                  │ │
│  │  │                  All caught up!                                    │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  │ 📊 View all table sides status                    [ChevronDown ▼] │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │
│  │                                    ← fold at ~768px                    │
└──┴────────────────────────────────────────────────────────────────────────┘
```

### Session A — /kitchen/sides-prep (Table Status Panel Expanded)

```
│  │  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  │ 📊 View all table sides status                   [ChevronUp ▲]  │  │
│  │  ├──────────────────────────────────────────────────────────────────┤  │
│  │  │                                                                   │  │
│  │  │           (No active orders)                                      │  │
│  │  │                                                                   │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │
```

### Session A — /kitchen/orders (Empty State — Sides Focus Role)

```
┌──┬────────────────────────────────────────────────────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                                              │
├──┤────────────────────────────────────────────────────────────────────────│
│🍳│ [🧾 All Orders] [📋 Order Queue] [⚖️ Weigh Station] [🥗 Sides Prep]   │
│  │                             [🥗 Sides Prep badge]  [BT Scale 56px]     │
│  │  ─────────────────────────────────────────────────────────────────────│
│  │  [● Live]                                   [fixed top-right, z-50]    │
│  │                                                                         │
│  │  Kitchen Queue              [🔊 volume slider]  [↩ UNDO LAST] [History 65]
│  │  0 active · 0 items                                                     │
│  │                                                                         │
│  │                   ✅                                                    │
│  │             No pending orders                                           │
│  │       New orders will appear here automatically                         │
│  │                                                                         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐               │
│  │  │  65          │  │   20m        │  │   just now        │              │
│  │  │ Served Today │  │ Avg Service  │  │ Last Completed    │              │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘               │
└──┴────────────────────────────────────────────────────────────────────────┘
```

### Session A — /kitchen/weigh-station (Empty + BT Disconnected)

```
┌──┬──────────────────────────────┬────────────────────────┬────────────────┐
│  │ Pending Meat [0 items]        │ [BT ⚠ Disconnected    │ Dispatched     │
│  │ w-96 (384px) fixed column     │  Reconnect →] 64px h   │ w-72 (288px)  │
│  │                               │                        │  [Yield %]     │
│  │  ✅                           │ ⚖️                     │               │
│  │  All clear                    │ Select a meat order    │ No items yet   │
│  │                               │ Choose from left       │               │
└──┴──────────────────────────────┴────────────────────────┴────────────────┘
```

### Session A — /kitchen/all-orders (1 Open Order)

```
│  All Orders                                     1 orders
│  [All 9] [Open 1] [Pending 0] [Paid 7] [Cancelled 1]
│  [Today] [Last Hour] [Last 3 Hours] [All Time]
│  ┌─────────────────────────────────────────────────┐
│  │ #TO-IWXR   [OPEN]  Maria  Opened just now        │
│  │            6 items  1 pax  ₱576.00  6/6 served  │
│  └─────────────────────────────────────────────────┘
```

### Session B — /pos Staff (Floor Plan)

```
┌──┬──────────────────────────────────────────────┬────────────────────────┐
│W!│ 📍 ALTA CITTA (TAGBILARAN)                    │                        │
├──┤──────────────────────────────────────────────┤                        │
│🛒│ [☰] POS  [0 occ] [8 free]   [ⓘ] [📦 New Takeout] [🧾 History 8]     │
│  │  ┌──────────────────────────────────────────┐ │  🧾                   │
│  │  │ [T1 cap4] [T2 cap4] [T3 cap4] [T4 cap4] │ │                        │
│  │  │ [T5 cap4] [T6 cap4] [T7 cap2] [T8 cap2] │ │  No Table Selected     │
│  │  └──────────────────────────────────────────┘ │  Tap an occupied table │
│  │  📦 Takeout Orders [1]                        │  to view running bill  │
│  │  [#TO01  Maria  ₱576.00  6 items]  [PREP]     │                        │
│  │                                               │  Green = available     │
│  │                                               │  Orange = occupied     │
└──┴───────────────────────────────────────────────┴────────────────────────┘
```

### Session B — /pos Pax Modal (T1 tapped, all tables free)

```
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │           How many guests for T1?    Capacity: 4                      │  │
│  │                                                                       │  │
│  │  Adults full price                                                    │  │
│  │    [−]  2  [+]                                                        │  │
│  │    [1] [2] [3] [4] [5] [6] [7] [8]   ← quick-select row             │  │
│  │                                                                       │  │
│  │  Children ages 6–9 · reduced price                                    │  │
│  │    [−disabled]  0  [+]                                                │  │
│  │    [0] [1] [2] [3] [4]                                               │  │
│  │                                                                       │  │
│  │  Free under 5 · no charge                                             │  │
│  │    [−disabled]  0  [+]                                                │  │
│  │    [0] [1] [2] [3] [4]                                               │  │
│  │                                                                       │  │
│  │  Total guests: 2                                                      │  │
│  │              [Cancel]   [Confirm]                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
```

---

## B. Principle-by-Principle Assessment

### /kitchen/sides-prep (Primary focus — first-time audit)

| # | Principle | Verdict | Evidence |
|---|---|---|---|
| 1 | **Hick's Law** — decisions per screen state | PASS | Empty state: 2 interactive elements (Refill Queue header, Table Status toggle). Excellent choice count. Under load: Refill groups + batch buttons — each group is self-contained. |
| 2 | **Miller's Law** — chunks of info | PASS | 4 clear sections (New Tables, Refill Queue, Service Alerts, Table Status). Each is a distinct visual container. Refill queue groups by item name — correct chunking pattern. |
| 3 | **Fitts's Law** — touch target sizes | PASS with CONCERN | "Staged" acknowledge button: `min-h-[56px]` ✓. "BATCH DONE ✓": `min-h-[64px]` ✓ (largest target in page — correct). Per-table chips: `min-h-[56px] min-w-[56px]` ✓. Service alert "Done": `min-h-[56px]` ✓. Table Status toggle: `min-h-[56px]` ✓. **CONCERN:** The `text-[10px]` wait time label inside table chips is 10px — below 12px readable threshold for arm's-length reading. |
| 4 | **Jakob's Law** — familiar patterns | PASS | "BATCH DONE ✓" large green CTA follows KDS-style convention. Table chips as per-table quick-mark follow known POS chip patterns. Collapsible panel with chevron is standard. |
| 5 | **Tesler's Law** — complexity offloaded | PASS | System auto-aggregates refills by item name and sorts by quantity (most refills first). Staff only needs to tap BATCH DONE or individual chips — the grouping logic is entirely system-side. |
| 6 | **Doherty Threshold** — response time | PASS | `markItemServed` is RxDB local-first (instant write). `active:scale-95` on all buttons gives immediate tactile feedback. No loading states expected. |
| 7 | **Visibility of status** | PASS with CONCERN | Refill count badge on section header ✓. Each group shows ×N count ✓. **CONCERN:** No "Section 1: New Tables" panel visible in empty state — the section is conditional `{#if unacknowledgedNewTables.length > 0}` which is correct behavior, but a kitchen runner first using the page might not know the "New Tables" alert feature exists until they see it fire. No onboarding hint. |
| 8 | **Gestalt Proximity** | PASS | New Tables: table chip + acknowledge button grouped with `gap-2` inside `bg-white/20` card ✓. Refill Queue: batch done button adjacent to item count in same card header ✓. Per-table chips separate from batch button via clear visual boundary ✓. |
| 9 | **Gestalt Similarity** | PASS | All "done" actions use consistent green (`bg-status-green`). Service alerts use consistent yellow border. New tables section uses consistent accent orange background. |
| 10 | **Visual Hierarchy** | PASS with CONCERN | BATCH DONE at `min-h-[64px]` dominates correctly as primary action. Section headers `text-base font-bold uppercase` ✓. Item names `text-xl font-bold` in refill card headers ✓. **CONCERN:** Service Alerts section has no action-count badge on the section header (unlike Refill Queue which has a count badge). If there are 8 service alerts, the header "⚠️ Service Alerts" gives no quick count without reading all rows. |
| 11 | **WCAG — Contrast** | CONCERN | "Done ✓" button on Service Alerts: `bg-status-yellow text-white`. Yellow (#F59E0B) with white (#FFFFFF) = 2.1:1 — FAILS WCAG AA. White text on yellow is unreadable at small sizes. Should be `text-gray-900` or switch to `bg-status-yellow/80` with dark text. |
| 12 | **WCAG — Touch Targets** | PASS | All interactive elements meet or exceed 44px. Batch Done at 64px is exemplary. |
| 13 | **Consistency** — within page | PASS | Uniform `rounded-xl` corners throughout. Consistent `px-4 py-3` card padding. All buttons use `active:scale-95 transition-all`. |
| 14 | **Consistency** — across pages | PASS | Sub-nav bar, LocationBanner, sidebar structure consistent with kitchen/orders. Focus badge appears correctly. BT Scale button in same position (56px). |

### /kitchen/orders (Verification of previous fixes)

| # | Principle | Verdict | Notes |
|---|---|---|---|
| Focus-aware sections | PASS | `kitchenFocus === 'sides'` correctly sets `showMeats = false`, `showDishes = true`. `allDoneLabel` resolves to "DISHES DONE ✓" for Corazon's role. |
| New tables badge | PASS | `newTableCount` derived and shown in Live indicator area as `🆕 N new table(s)` badge |
| ALL DONE button | PASS | `min-height: 56px` via inline style; `w-full rounded-xl bg-status-green` |
| UNDO LAST button | PASS | `min-height: 48px` via inline style; `btn-primary` |
| History button | PASS | `min-height: 48px` via inline style; `btn-secondary` |
| Volume slider wrapper | PASS | `min-h-[44px]` touch wrapper |
| Void overlay | PASS | Full-width red banner with "Got it" button `min-height: 44px` |
| Un-86 confirmation | PASS | Inline amber confirm row with Cancel + Restore both `min-height: 44px` |
| Quick Bump button | PASS | `min-h-[56px]` per-ticket header button |
| Live indicator | PASS | Fixed top-right z-50, green pulse dot + "Live" label |

### /kitchen/weigh-station (Verification)

| # | Principle | Verdict | Notes |
|---|---|---|---|
| BT disconnected banner | PASS | `min-height: 64px` warning bar; Reconnect button `min-height: 56px min-width: 44px` |
| Left column width | PASS | `w-96` (384px) on 1024px viewport — 37.5% of screen — ample for table groups |
| Right dispatch log | PASS | `w-72` (288px) — 28% — sufficient for simple log rows |
| Numpad keys | PASS | `min-height: 72px` per key — largest numpad targets in the system |
| DISPATCH button | PASS | `min-height: 64px w-full max-w-sm` — extremely generous; disabled state with opacity-30 |
| Yield % button | PASS | `min-height: 44px` |
| Pending Meat items | PASS | `min-height: 56px` per item row |
| BT Scale status button | PASS | `min-h-[56px] min-w-[56px]` in kitchen layout |

### /pos Staff (Verification)

| # | Principle | Verdict | Notes |
|---|---|---|---|
| Float modal | PASS | Appears on first visit; Skip button available; existing orders preserved (note in modal) |
| Floor stats | PASS | "0 occ · 8 free" visible in header bar |
| Table buttons | PASS | 8 tables rendered as SVG `g[role=button]` elements — accessible |
| Pax modal | PASS | Adults/Children/Free sections with quick-number rows; disabled minus at 0 ✓; cancel + confirm at bottom |
| Takeout queue | PASS | #TO01 Maria ₱576.00 6 items visible with PREP status badge |
| Order sidebar empty | PASS | "No Table Selected" with instruction text; color legend hints at bottom |
| Sidebar nav | PASS | Staff sees only POS link — correct role restriction |

---

## C. Best Day Ever — Corazon's Friday Night Shift

It's 8:15 PM at Alta Citta. Corazon picks up the sides tablet — it's already logged in as her account (🥗 Sides). She's at the drinks/sides station, both hands often busy with refill portions.

She glances at the screen. The big green ✅ "No pending refills — All caught up!" is visible from across the counter. She exhales — the wave hasn't hit yet.

At 8:23, four tables order simultaneously. The Refill Queue section erupts: "Kimchi ×4", "Egg ×3", "Japchae ×2". The count badge on the section header reads `9` instantly. She knows exactly what's needed without reading every line.

She grabs the Kimchi tray and taps **BATCH DONE ✓** on the Kimchi card. All four table chips disappear at once. Fast. One tap, four tables done.

The T3 chip appears under Egg still showing "2m ago". She quickly taps just T3's chip — marking only that one done since T3 was served separately. The chip turns white and vanishes cleanly.

A ⚠️ Service Alerts section flashes in — T6 needs extra tongs. She taps **Done ✓** on the yellow row. It disappears.

Halfway through the shift she wonders "how's T5 doing on sides overall?" She taps the **📊 View all table sides status** bar at the bottom. A grid pops open: T5 shows 2 pending (yellow), all others green. She folds it back with another tap.

The one moment that trips her: a "Done ✓" button on the yellow service alert row shows white text on a yellow button. In the bright kitchen lights, it's hard to see. She taps it blind.

At 10 PM the queue clears. The big ✅ returns. She smiles.

---

## D. Recommendations

### P0 — Critical: Fix Now

| # | Issue | Evidence | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P0-1 | **Service Alert "Done ✓" button: white text on yellow background** — contrast ratio 2.1:1, fails WCAG AA for text < 18px | `bg-status-yellow px-4 font-bold text-white min-h-[56px]` in Section 3 | Change `text-white` → `text-gray-900` (ratio becomes ~13.5:1). Or use `bg-status-yellow/90 text-gray-900`. | S | High — accessibility + kitchen lighting readability |

### P1 — High Priority: Fix This Sprint

| # | Issue | Evidence | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P1-1 | **Service Alerts section header has no count badge** — unlike Refill Queue which shows `[9]` count. Under load, "⚠️ Service Alerts" header gives no at-a-glance count | Section header: `<h2 class="text-base font-bold text-gray-700 uppercase">⚠️ Service Alerts</h2>` — no badge | Add `{#if serviceAlerts.length > 0}<span class="rounded-full bg-status-yellow px-2.5 py-0.5 text-sm font-black text-gray-900">{serviceAlerts.length}</span>{/if}` alongside the heading | S | Medium — glanceable status for kitchen |
| P1-2 | **10px wait-time label inside table chips is below readable threshold** — `text-[10px]` for the wait time text (e.g. "2m ago") inside `min-h-[56px]` table chips | `<span class="text-[10px] font-normal opacity-70">{timeAgo(item.waitingSince)}</span>` | Bump to `text-xs` (12px). For kitchen arm's-length reading, 12px is the minimum. 10px fails the 12px noise-tolerance rule. | S | Medium — readability at station distance |
| P1-3 | **"New Tables" section has no idle-state hint** — first-time kitchen runner has no way to discover the New Tables alert feature until their first order fires. Nothing tells them this section exists | Section is pure `{#if unacknowledgedNewTables.length > 0}` with no empty-state placeholder | Add a collapsible or ghost empty-state row above Refill Queue: "🆕 New table alerts appear here when tables open" (can be collapsed after first shift) | M | Low — discoverability only, not flow-critical |

### P2 — Nice to Have: Backlog

| # | Issue | Evidence | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P2-1 | **Table Status grid cells are not tappable** — in the expanded Table Status panel, each table mini-card is informational only (no quick action). Under load, Corazon might want to quickly mark all of T5's sides done from this view without scrolling back up | Table Status items are `div` not `button` | Consider making each table cell a quick-link to filter the Refill Queue to that table only | L | Low — refill queue already handles this |
| P2-2 | **BT Scale button label "BT Scale" (disconnected) vs "Scale" (connected)** — label changes between states, which breaks muscle memory for finding the button | `span: isConnected ? 'Scale' : 'BT Scale'` | Use consistent label "BT Scale" in both states. Status is communicated by the green dot, not the label. | S | Low |
| P2-3 | **Service Alerts section has no sound/visual urgency escalation** — a service alert sitting for 5+ minutes looks identical to a new one. No timer or visual escalation | `timeAgo()` shows elapsed time as text-xs gray, but no color change | Add urgency color on the `timeAgo` text: `text-status-red` if >5min, `text-status-yellow` if 2-5min, `text-gray-500` if <2min | M | Medium — rush hour coordination |
| P2-4 | **No haptic/audio feedback on sides-prep page** — unlike KDS which plays new-order chime and void beep, sides-prep is silent when new refills arrive | Sides-prep has no `$effect` watching refill queue growth for audio | Optionally add a soft chime or vibration when `refillQueue` count increases. Especially useful when Corazon is not watching the screen. | M | Medium — kitchen noise environment |
| P2-5 | **Table Status grid: pending/served labels use `text-xs` at 12px** — the "2 pending" label inside `w-full` grid cells at 3-6 columns is readable but tight | `text-xs font-semibold text-status-yellow` for pending label | Bump to `text-sm` for the pending count inside table status cells | S | Low |

---

## E. Previous Fix Verification Summary

| Fix Previously Applied | Pages Checked | Held? |
|---|---|---|
| `allDoneLabel` reactive to `kitchenFocus` ("MEATS DONE ✓" / "DISHES DONE ✓" / "ALL DONE ✓") | `/kitchen/orders` | YES — Corazon's session would show "DISHES DONE ✓" |
| `newTableCount` badge in Live indicator | `/kitchen/orders` | YES — badge logic confirmed in source |
| Quick Bump button at `min-h-[56px]` | `/kitchen/orders` | YES |
| UNDO LAST + History buttons at 48px | `/kitchen/orders` | YES |
| Focus-aware section show/hide (`showMeats`/`showDishes`) | `/kitchen/orders` | YES — $effect reacts to kitchenFocus |
| Void overlay full-width red banner | `/kitchen/orders` | YES — source confirmed |
| Un-86 inline confirmation | `/kitchen/orders` | YES — `confirmingUnEighty6` state |
| DISPATCH button 64px, disabled when no input | `/kitchen/weigh-station` | YES |
| Numpad keys 72px | `/kitchen/weigh-station` | YES |
| BT disconnected banner 64px with Reconnect | `/kitchen/weigh-station` | YES |
| Float modal with Skip option | `/pos` | YES — skip fires correctly |
| Pax modal with Adults/Children/Free quick rows | `/pos` | YES — all 3 sections visible |

---

## F. Sides-Prep Page: New Design Patterns Identified

These are new patterns specific to `/kitchen/sides-prep` that should be added to the Known Patterns reference.

### Pattern: Refill Queue — Grouped by Item with Batch Action

The refill queue aggregates across all KDS tickets by `menuItemName`. This is the correct pattern for sides prep because:
- The runner fills refill portions in batches (one trip per item)
- Sorting by `group.total` (descending) puts the highest-demand item first — matches real kitchen priority
- BATCH DONE clears all tables for that item in one tap; individual chip marks one table
- The "×N" badge makes the demand immediately visible

**Risk identified:** If `kdsTickets` has stale data (LocalRxDB not synced), the queue will show phantom refills. No staleness indicator on this page (unlike KDS which has the Live/Stale indicator). Consider adding the same staleness check.

### Pattern: Section Conditionally Rendered (New Tables)

The New Tables alert section is entirely hidden when empty — not collapsed, not showing an empty state. This is intentional and correct: sides-prep is a high-density working screen and showing empty sections wastes vertical space. Acknowledged via `acknowledgedTableIds` state (in-memory, resets on page reload — this is acceptable since shifts are bounded).

### Pattern: Table Status as Reference Panel (Collapsible)

The Table Status grid is positioned below all actionable content as a reference panel. This follows the "task above reference" pattern: primary work (refill/service) at top; context (overall table view) at bottom. The `tableStatusOpen = false` default is correct — it won't distract during high-load operation.

---

## G. Summary Verdict

| Verdict | Count |
|---|---|
| PASS | 10 |
| PASS with CONCERN | 3 |
| CONCERN | 0 |
| FAIL | 1 |

**Overall Assessment:** The `/kitchen/sides-prep` page is well-designed for its intended use case. The refill queue grouping, batch-done pattern, and section ordering are all strong UX choices. There is one critical WCAG failure (P0-1: white text on yellow button in Service Alerts), one count-badge omission on the service alerts header (P1-1), and a 10px text-size violation in the table chips (P1-2). Previous fixes on `/kitchen/orders` and `/kitchen/weigh-station` have all held. POS staff flow verified clean.

**The "DISHES DONE ✓" label** (focus-aware) works correctly for the sides cook role. The session correctly routes Corazon to `/kitchen/sides-prep` on login (default for 🥗 Sides focus role). The BT Scale button at 56px is accessible in the kitchen layout header across all kitchen pages.

**One architectural note:** The Live/Stale indicator from `/kitchen/orders` is absent from `/kitchen/sides-prep`. Since sides-prep reads from the same RxDB reactive stores (`kdsTickets`, `orders`), staleness can occur. Low risk in Phase 1 (all local), but worth adding as a P2 once Phase 2 (LAN replication) lands.

---

*Report generated by ux-audit skill v4.4.0 · playwright-cli sessions (headless, 1024×768) · 2026-03-10*
