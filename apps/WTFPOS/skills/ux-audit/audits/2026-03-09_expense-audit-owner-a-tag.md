# UX Audit — Branch Comparison Page (Owner-A, Tag)
**Date:** 2026-03-09
**Auditor:** Boss Chris (owner, locationId: all → switched to tag)
**Page:** /reports/branch-comparison
**Viewport:** Default headless (tablet equivalent)
**Audit type:** Single-user, 6-step micro-audit
**Snapshots used:** 6 / 10

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 11 issues resolved (P0: 0/2 · P1: 0/8 · P2: 0/3)

---

## A. Text Layout Map

```
+--sidebar-rail--+------------------main (SidebarInset)--------------------+
| [W!]           | LocationBanner: [ALTA CITTA (TAG)] [Change Location]    |
| [POS]          |---------------------------------------------------------|
| [Kitchen]      | page heading: "Branch Reports / 📍 Alta Citta ..."      |
| [Stock]        |                                                         |
| [Reports]      | sub-nav: Operations|Expenses|Revenue|Profit|Branch      |
| [Admin]        |                   Compare (active link)                 |
|                |---------------------------------------------------------|
| sidebar footer | [Today] [This Week*] [This Month]   ← period pills      |
| [B] Logout     |                                                         |
+----------------+ +--Tagbilaran (blue)---+ +--Panglao (purple)---------+ |
                  | Tagbilaran Branch     | | Panglao Branch             | |
                  | ₱487.00              | | ₱2,910.00                  | |
                  | Net Profit            | | Net Profit                 | |
                  | (same blue card)      | | (same purple card)         | |
                  +----------------------+ +----------------------------+ |
                  |                                                       |
                  | +--comparison table (full width)------------------+  |
                  | | Metric          | Tagbilaran    | Panglao        |  |
                  | | Gross Sales     | ₱16,765 ✓     | ₱10,938        |  |
                  | | Net Sales       | ₱15,876 ✓     | ₱10,452        |  |
                  | | Total Expenses  | ₱15,389       | ₱7,542 ✓       |  |
                  | | Gross Profit ** | ₱487          | ₱2,910 ✓       |  |
                  | | Net Profit **   | ₱487          | ₱2,910 ✓       |  |
                  | | Gross Margin    | 2.9%          | 26.6% ✓        |  |
                  | | Net Margin      | 2.9%          | 26.6% ✓        |  |
                  | | Total Pax       | 31 ✓          | 17             |  |
                  | | Avg Ticket      | ₱512          | ₱615 ✓         |  |
                  | +-------------------------------------------------+  |
                  +---------------------------------------------------------+

(** = highlighted rows)
(* = active period pill)
(~fold~) — entire page fits above fold at standard tablet height
```

---

## Step-by-Step Findings

### Step 1 — Branch Comparison Initial State (locationId: 'all', period: week)
**Verdict: CONCERN**

**Snapshot:** `.playwright-cli/page-2026-03-08T21-31-53-073Z.yml`

**Observations:**
- Both branches visible: Tagbilaran Branch (blue) + Panglao Branch (purple) ✓
- Period selector present with 3 pills: Today / This Week / This Month ✓
- Default period is "week" — populated with meaningful data ✓
- Branch header cards both show hero metric labeled "Net Profit":
  - Tagbilaran: ₱487.00 Net Profit (blue card)
  - Panglao: ₱2,910.00 Net Profit (purple card)
- Comparison table rows: Gross Sales, Net Sales, Total Expenses, Gross Profit, Net Profit, Gross Margin, Net Margin, Total Pax, Avg Ticket — 9 metrics total
- **ANOMALY:** Tagbilaran Gross Profit = Net Profit = ₱487.00. When all expenses are COGS-category, gross profit = net profit. This silently hides whether there are non-food operating expenses — the display gives no indication of this equality being suspicious or data-related.
- **Gross margin disparity: 2.9% vs 26.6%** — no threshold warning. For a samgyupsal restaurant, 2.9% gross margin (this week) indicates expenses are consuming ~97% of revenue. No red color, no alert.
- Winner ✓ checkmarks indicate better-performing branch per metric — clear concept ✓
- Branch color differentiation (blue vs purple) is consistent and at-a-glance recognizable ✓
- **Default active state not conveyed via `[active]` attribute** on the "This Week" button in initial load. Clicking "Today" correctly sets `[active]`; the initial week state does not — inconsistent ARIA state.

**P1 Issues from Step 1:**
- Gross margin 2.9% has no threshold warning (should be ≥ yellow at <30%, red at <0%)
- Default "This Week" button missing `aria-pressed` / `[active]` attribute on page load

**P2 Issues from Step 1:**
- Header card hero metric labeled "Net Profit" — for samgyupsal analytics, Gross Profit is the primary health metric since it reflects food COGS directly. Net Profit as the hero metric can mislead when gross and net profit are equal (as they are when all expenses are COGS).

---

### Step 2 — Switch period to 'Today'
**Verdict: FAIL**

**Snapshot:** `.playwright-cli/page-2026-03-08T21-32-38-760Z.yml`

**Observations:**
- "Today" button correctly shows `[active]` after click ✓
- Tagbilaran Branch header shows **"-₱3,362.00" Net Profit** in plain text on the same blue card
- Gross Margin for Tagbilaran: **-62.1%** — a critically negative margin
- All negative values render identically to positive values (same font, same color, same weight)
- **No red color, no warning icon, no alert banner** for negative gross profit or negative margin
- Empty state banner does NOT appear (correct — there IS data today)
- Panglao shows healthy ₱11,989 gross profit and 89.8% gross margin — stark contrast with Tagbilaran but zero visual alarm draws the eye to the Tagbilaran crisis
- The ✓ checkmark on Panglao cells makes the winning column visually heavier (green bold), while the crisis Tagbilaran column renders lighter — the visual hierarchy inverts the urgency
- Gross Profit = Net Profit for Tagbilaran today (both -₱3,362.00) — confirms today's expenses are all COGS-category; Total Expenses = ₱8,500 vs Net Revenue = ₱5,138

**P0 Issues from Step 2:**
- **Negative gross profit has NO visual alarm.** "-₱3,362.00" in the header card and "-62.1%" in the margin row are rendered identically to positive values. During service, the owner will not catch a financial emergency without reading every number.

**P1 Issues from Step 2:**
- Branch header card background color is branch-identity only (always blue or always purple) — a negative profit card should react visually (red tint, warning border, or warning icon overlay)
- The ✓ winner badge increases visual weight on the healthy column, perversely making the crisis column look less important

---

### Step 3 — Switch to tag location via LocationBanner
**Verdict: CONCERN**

**Snapshot:** `.playwright-cli/page-2026-03-08T21-33-22-966Z.yml`

**Observations:**
- Location Selector modal opened cleanly ✓
- Modal shows: Alta Citta (Tagbilaran) — Active Staff: 3, Stock Alerts: 1 (with warning icon); Alona Beach (Panglao) — Active Staff: 2, Stock Alerts: 0 ✓
- "All Locations" marked as "Current" ✓ — clear active indicator
- Switch to Alta Citta worked: LocationBanner updated to "ALTA CITTA (TAGBILARAN)" immediately ✓
- Page heading changed from "Consolidated Reports / 🌐 All Branches" to "Branch Reports / 📍 Alta Citta (Tagbilaran)" — context update clear ✓
- Sidebar quick-action shortcuts updated from "Select a specific branch" to active action links ✓
- **CONCERN: Branch comparison table still shows BOTH branches** after location switch to tag. The page is designed as a comparison tool (always shows both), but the "Branch Reports / 📍 Alta Citta" heading creates a mental model mismatch — the owner reads "I am now in Tagbilaran mode" but the data scope has not changed.
- No explanatory text: "This page always shows both branches for comparison"
- Period selector loses `[active]` indicator after location switch (Today had been clicked in Step 2 but no button shows `[active]` here — the state appears to visually reset while data is still on the last selected period)

**P1 Issues from Step 3:**
- No contextual note on the branch-comparison page explaining that it always shows both branches regardless of active location — creates location-scope confusion
- "Branch Reports" heading with a single location emoji misleads about data scope
- Period selector active state visually resets on location switch (state is inconsistent with actual data being shown)

---

### Step 4 — Wait 8s for Manager-A's expenses (data propagation check)
**Verdict: CONCERN**

**Snapshot:** `.playwright-cli/page-2026-03-08T21-34-00-797Z.yml`

**Observations:**
- After 8-second wait, data unchanged: Total Expenses ₱8,500.00, Gross Profit -₱3,362.00
- Manager-A's ₱55,000 Meat Procurement expense has not appeared — expected in Phase 1 (each browser session has its own in-memory IndexedDB; cross-session propagation requires Phase 2 LAN replication). On the actual restaurant device (single browser), changes would be immediate.
- **No "last updated" timestamp** anywhere on the page — the owner cannot determine data freshness
- **No reactive update indicator** — when data does change on the same device, numbers silently update in place with no visual cue (no flash, no pulse, no "data refreshed" toast)
- No manual refresh button — if the owner suspects stale data, there is no UI affordance to force a re-query

**P1 Issues from Step 4:**
- No "as of [time]" or "last updated" label on report — data freshness is invisible
- No reactive update visual cue when RxDB reactive data changes

**P2 Issues from Step 4:**
- No manual refresh button for the report

---

### Step 5 — Alarm Bell: Spot the Meat Procurement Anomaly
**Verdict: FAIL**

**Based on Step 2/4 snapshot data — expenses totaling ₱8,500 against ₱5,138 revenue (today), causing -62.1% gross margin**

**Observations:**
- A -62.1% gross margin (₱8,500 expenses vs ₱5,138 revenue today for Tagbilaran) is a financial emergency signal
- **How visible is this anomaly?**
  - In the header card: "-₱3,362.00" is the only indicator — plain text, blue card background, identical typography to a positive value
  - In the table: "-62.1%" appears in `text-gray-700` — same as all other non-winner cells
  - The winning column gets `font-bold text-status-green` treatment; the loser (crisis) column gets lighter `text-gray-700` — the visual hierarchy inverts the urgency
  - No threshold-based coloring exists anywhere in the code (`computeBranches()` produces numbers; the table renders them with binary winner/loser logic only)
- **Is a -62% vs +89% margin visually distinct?**
  - Only through reading the number. No pre-attentive cue (color, icon, size) differentiates a crisis margin from a healthy one.
  - In a busy restaurant context, the owner is checking this report between service rushes — they need the anomaly to be impossible to miss at a glance
- **Code root cause:** `src/routes/reports/branch-comparison/+page.svelte` line 161–163: cell coloring uses `w === i ? 'font-bold text-status-green' : 'text-gray-700'` — no negative value branch, no threshold logic

**P0 Issues from Step 5:**
- No threshold-based coloring for gross margin or gross profit — negative values (financial emergency) render identically to near-zero positive values
- The winning branch ✓ highlight draws attention away from the crisis branch

**P1 Issues from Step 5:**
- No contextual note defining what "Gross Profit" means here (netRevenue - COGS only, not all expenses) — an owner unfamiliar with the distinction may misread the metric

---

### Step 6 — UX Assessment (final evaluation, period: This Week)
**Verdict: CONCERN**

**Snapshot:** `.playwright-cli/page-2026-03-08T21-34-53-900Z.yml`

**Observations — This Week data: tag ₱487 net profit / 2.9% margin vs pgl ₱2,910 / 26.6%**

**Gross Profit vs Net Profit label clarity:**
- Both "Gross Profit" and "Net Profit" rows exist in the table — labeled correctly ✓
- HOWEVER: when Gross Profit = Net Profit (because all expenses are COGS), a manager could reasonably conclude either that (a) there are no non-food expenses, or (b) the two metrics are duplicated. No tooltip or definition explains the difference.
- The code comment `// P1-23: Default to 'week'` in the source confirms the developer is aware of the today-shows-zero issue but there is no user-facing explanation.

**COGS definition visibility:**
- `FOOD_COGS = new Set(['Meat Procurement', 'Produce & Sides'])` — only these two expense categories are deducted from gross profit
- No explanation on the page that "Gross Profit = Net Revenue − Meat Procurement − Produce & Sides only"
- An owner who records a large "Utilities" expense will see it in Total Expenses and Net Profit but NOT in Gross Profit — without knowing this, they may think the Gross Profit figure is wrong
- **This is a semantic clarity P1:** the definition of gross profit is non-standard (food COGS only) and invisible to the user

**Period selector behavior:**
- Today vs This Week shows dramatic data swings (Tagbilaran: ₱487 this week vs -₱3,362 today) — the period transition is instant but the magnitude of change is not visually anchored by any "you're now seeing today-only data" confirmation
- All 3 period pills have identical visual weight when inactive — the active pill (orange/accent fill) is sufficiently distinct when clicked ✓
- But the initial load state (This Week active by default) does not show the orange pill on page load due to the missing `[active]` attribute bug noted in Step 1

**Branch layout balance:**
- Two-column grid is balanced ✓
- Blue (Tagbilaran) left, purple (Panglao) right — consistent with branch identity colors
- The hero number in the header card (net profit) is the most visually prominent element (text-3xl font-bold) ✓
- However: the header card is labeled "Net Profit" but the primary financial health metric for a samgyupsal operator should be Gross Profit (COGS-adjusted). Net Profit includes all operating expenses and can go negative from rent alone — Gross Profit tells the kitchen story.

**Contextual help:**
- No explanatory text anywhere on the page for: why gross profit might be low, what the gross margin threshold should be, or how to interpret the period comparison
- The 📭 empty state message (when no data) IS contextual and well-written ✓ — but this only appears when grossRevenue === 0 for all branches

**P1 Issues from Step 6:**
- No COGS definition tooltip or footnote explaining what "Gross Profit" deducts (food expenses only, not all expenses)
- Header card hero metric "Net Profit" should be "Gross Profit" for samgyupsal operators — or at minimum show both with clear labeling
- Period selector default state (This Week) missing visual active state on initial render

**P2 Issues from Step 6:**
- No contextual guidance for interpreting margin thresholds (what is "good" for this business?)
- No "compare this period to last period" toggle

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | PASS | 3 period options, 9 metric rows — manageable cognitive load | No change needed |
| 2 | **Miller's Law** (chunking) | PASS | Metrics grouped in table with clear row separation; branch headers provide overview chunk | No change needed |
| 3 | **Fitts's Law** (target size/distance) | CONCERN | Period pills have `min-height: unset` (overrides 44px touch target) — `py-1.5` is ~28px height | Remove `style="min-height: unset"` from period pills |
| 4 | **Jakob's Law** (conventions) | PASS | Table layout with column headers, winner highlight, period selector pills — all conventional | No change needed |
| 5 | **Doherty Threshold** (response time) | PASS | Period switch is instant (reactive $derived) — no perceptible delay | No change needed |
| 6 | **Visibility of System Status** | FAIL | No "last updated" timestamp, no reactive change indicator, no data freshness signal | Add "as of [time]" label, add update indicator |
| 7 | **Gestalt: Proximity** | PASS | Header cards grouped together, table metrics in rows, period pills clustered | No change needed |
| 8 | **Gestalt: Common Region** | PASS | Table uses border-separated regions; header cards use colored card containers | No change needed |
| 9 | **Visual Hierarchy** (scale) | CONCERN | Net profit hero number (text-3xl) is largest — correct. But margin % (tiny, same weight as other cells) should be more prominent as it's a key health indicator | Consider text-lg for margin % cells |
| 10 | **Visual Hierarchy** (contrast) | FAIL | Negative values (crisis state) have same visual weight as positive values. Crisis metrics need `text-status-red` treatment | Add threshold coloring for negative values and below-floor margins |
| 11 | **WCAG: Color Contrast** | PASS | Blue-700/blue-50 and purple-700/purple-50 combinations are sufficient contrast ratios | No change needed |
| 12 | **WCAG: Touch Targets** | FAIL | Period pills have `min-height: unset` — overrides the 44px minimum. On a touchscreen tablet, these are ~28px tall. During service, mis-taps will occur. | Remove `style="min-height: unset"` |
| 13 | **Consistency** (internal) | CONCERN | Active period button uses `[active]` correctly when clicked, but default "This Week" does not show `[active]` on initial render — inconsistent initial state | Initialize button with `aria-pressed="true"` or equivalent on load |
| 14 | **Consistency** (design system) | PASS | Colors match design tokens (blue-50, purple-50, text-status-green). Uses `cn()`, `formatPeso()`, `font-mono` for numbers | No change needed |

---

## C. "Best Day Ever" Vision

Boss Chris arrives at the restaurant at 10:00 AM on a Saturday to check how the previous week and today's early morning are performing. He opens the branch comparison report on the iPad mounted near the register.

**The ideal experience:** The page loads instantly on This Week view. The two branch cards immediately show Tagbilaran in blue and Panglao in purple — each with their gross profit figure prominently displayed. If today's data is already concerning (because of a large morning meat delivery logged as an expense), the Tagbilaran card would pulse with a subtle red tint and a warning icon — not alarming, but unmissable. The gross margin row would display "2.9%" in red text with a small warning indicator, drawing Boss Chris's eye immediately. He taps "Today" to zoom in. The card background shifts to a warning red tint, the margin cell turns bold red, and a small tooltip explains: "This margin includes today's Meat Procurement expense of ₱8,500 — check the Expenses report for details." He knows in 5 seconds that Tagbilaran needs attention.

**Where the current implementation gaps are:**
1. There is no visual alarm for negative or low gross margin — Boss Chris has to read every number to detect a crisis
2. The header card stays the same blue regardless of profit sign — a losing day looks identical to a winning day at a glance
3. The "Gross Profit" definition is invisible — Boss Chris doesn't know that a ₱55,000 utilities bill won't affect gross profit but WILL affect net profit
4. The period pill default active state doesn't render properly on load — a small but persistent inconsistency that erodes trust in the interface

**Emotional state:** Currently, the owner must be in "analyst mode" (reading every cell carefully) rather than "glance mode" (scanning for red flags). For a busy restaurant owner checking in between service rushes, analyst mode is not achievable — they need glance mode.

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | Negative gross profit/margin has no visual alarm | Add threshold coloring: `grossProfit < 0` → `text-status-red font-bold`; `grossMarginPct < 0` → `text-status-red`; header card: add red tint when netProfit < 0 | S | High | 🔴 OPEN |
| **P0** | Period pills touch target too small (28px) | Remove `style="min-height: unset"` from period pill buttons | S | High | 🔴 OPEN |
| **P1** | Default "This Week" active state not shown on initial render | Set `aria-pressed` or ensure `[active]` attribute is applied to the initially-selected period button | S | Med | 🔴 OPEN |
| **P1** | Gross Profit = Net Profit silently when all expenses are COGS | Add footnote: "Gross Profit = Net Revenue − Meat Procurement − Produce & Sides. For all expenses, see Net Profit." | S | High | 🔴 OPEN |
| **P1** | Header card hero metric is "Net Profit" — should be "Gross Profit" for samgyupsal operators | Change header card to show Gross Profit (with label "Gross Profit") as the primary hero number; show Net Profit as a secondary line | S | High | 🔴 OPEN |
| **P1** | No "last updated" / data freshness signal | Add "as of [HH:MM]" label below the period pills, derived from the latest order/expense timestamp in the filtered set | S | Med | 🔴 OPEN |
| **P1** | Branch-comparison page heading misleads when location is single-branch | Add subtitle: "This report always compares both branches" | S | Med | 🔴 OPEN |
| **P1** | Low gross margin (e.g., 2.9%) has no visual warning even when positive | Add yellow threshold at <20% gross margin, red at <0% | S | High | 🔴 OPEN |
| **P2** | Gross Margin and Net Margin cells have same visual weight as Gross Sales | Increase font size or weight on margin % cells — these are the most diagnostic metrics | S | Med | 🔴 OPEN |
| **P2** | No manual refresh button | Add a small refresh icon button near the period selector | S | Low | 🔴 OPEN |
| **P2** | No period-over-period comparison | Add "vs previous [period]" delta indicators for key metrics | L | Med | 🔴 OPEN |

---

## Key Findings Summary

### Critical (P0)
1. **No alarm for negative gross profit/margin** — A -62.1% gross margin or -₱3,362 gross profit renders identically to a healthy positive value. Zero color, zero icon, zero weight change. This is the most critical UX failure on the page.
2. **Period pill touch targets are ~28px** — The `style="min-height: unset"` override breaks the 44px touch target rule. On a touchscreen POS tablet, this will cause mis-taps.

### High Friction (P1)
3. **Gross vs Net Profit confusion** — When Gross Profit = Net Profit (because all expenses are COGS), the table appears to have duplicate rows. No definition or tooltip exists.
4. **Header card hero metric mislabeled** — "Net Profit" as the hero metric in a samgyupsal context is secondary to "Gross Profit" (which reflects food COGS performance directly).
5. **Low-but-positive margin has no warning** — 2.9% gross margin (this week) should trigger at least a yellow threshold warning.
6. **Period selector default active state missing** — This Week is the default but has no `[active]` attribute on load; only works correctly after user interaction.
7. **Page heading misleads scope post-location-switch** — "Branch Reports / 📍 Alta Citta" implies single-branch data but both branches are always shown.
8. **No data freshness signal** — No "as of [time]" label to confirm the data is current.

### Polish (P2)
9. **Margin cells not visually prominent** — The most diagnostic metrics (gross margin %, net margin %) have the same visual weight as revenue rows.
10. **No manual refresh affordance.**
11. **No period-over-period delta.**

---

## Overall Recommendation

This page is **not ready for service as a financial monitoring tool** — the absence of visual alarms for negative gross profit (P0-1) means Boss Chris will miss financial emergencies during quick check-ins between service rushes, and the undersized touch targets (P0-2) will cause input errors on a touchscreen tablet.
