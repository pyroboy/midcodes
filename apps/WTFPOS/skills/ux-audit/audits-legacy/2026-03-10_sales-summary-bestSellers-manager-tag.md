# UX Audit — Sales Summary & Best Sellers (Manager)

**Date:** 2026-03-10
**Role:** Manager (Sir Dan)
**Branch:** Alta Citta (Tagbilaran) — `locationId: tag`
**Viewport:** 1024×768 (tablet landscape)
**Scope:** `/reports/sales-summary`, `/reports/best-sellers`, Reports sub-nav
**Audit mode:** Single-user, light
**Focus:** Can a manager quickly read today's sales health and top-performing cuts mid-shift?

---

## A. Text Layout Map

### A1 — Sales Summary (`/reports/sales-summary`)

```
+-- sidebar (~220px) --+----------- SidebarInset (~804px) ----------------+
| W! [toggle]          | [LocationBanner: ALTA CITTA (TAGBILARAN)] [Chg] |
| Quick Actions:       +--------------------------------------------------+
|  Receive Delivery    | Branch Reports  📍 Alta Citta (Tagbilaran)        |
|  Log Expense         |                                                   |
|  Log Waste           | [Ops: Meat | StockVar | TableSales | Voids |     |
|  Stock Count         |   X-Read | EOD | Staff] | [Exp: Daily | Monthly]  |
|  X-Reading           | | [Rev: Sales ▸ | BestSell | PeakHr] |           |
|  Transfer Stock      | | [Profit: Gross | Net] | [Branch: Compare]      |
|  End of Day          +--------------------------------------------------+
|                      | [Daily] [Weekly]  | [All] [Today] [WkThis] [Mth] |
| POS                  |                                            ● Live |
| Kitchen              |                                                   |
| Stock                | ┌─ Gross ─┐ ┌─ NET ──┐ ┌─ VAT ─┐ ┌─ Avg ─┐ ┌ Pax ┐ |
| Reports              | │₱80,202 │ │₱79,027 │ │₱8,466 │ │₱449  │ │ 176 │ |
|                      | └─────────┘ └────────┘ └───────┘ └──────┘ └─────┘ |
| S (manager)          | ───────────────────────────────────────────────── |
| Logout               | Period | Gross  | Disc. | Net    | Tax | Pax      |
+----------------------+ Mar 10 | ₱10,864| —     |₱10,864 |₱1,164| 28      |
                        | Today  | ₱7,992 | —     |₱7,992  |₱856  | 19  LIVE|
                        | Mar 8  | ₱13,263| —     |₱13,263 |₱1,421| 23      |
                        | ...                                               |
                        | TOTAL  | ₱80,202|−₱1,175|₱79,027 |₱8,466| 176    |
                        +---------------------------------------------------+
                        ~~fold at ~768px — table is above fold~~
```

### A2 — Best Sellers (`/reports/best-sellers`)

```
+-- sidebar (~220px) --+----------- SidebarInset (~804px) ----------------+
|                      | [LocationBanner: ALTA CITTA] [Change Location]   |
|                      +--------------------------------------------------+
|                      | Branch Reports  📍 Alta Citta (Tagbilaran)        |
|                      | [sub-nav — same 15-item horizontal scroll nav]    |
|                      +--------------------------------------------------+
|                      | Alta Citta (Tagbilaran)  ·  Mar 10, 2026          |
|                      |                                                   |
|                      | [Today] [This Week]          ← period row         |
|                      | [🥩 Meat Cuts] [🍚 Add-ons & Drinks]  ← tab row  |
|                      |                                                   |
|                      | ┌─ Total Wt ──┐ ┌─ Meat Rev ─┐ ┌─ Top Cut ─┐   |
|                      | │   0.0 kg    │ │   ₱0.00    │ │    —       │   |
|                      | └─────────────┘ └────────────┘ └────────────┘   |
|                      |                                                   |
|                      | 📭 No meat sales data yet                        |
|                      |    No meat has been sold yet today at this branch |
|                      |    ...                                            |
+----------------------+---------------------------------------------------+
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Finding | Verdict |
|---|---|---|---|
| 1 | **Hick's Law** | 6 buttons in the top toolbar (Daily/Weekly + All/Today/Week/Month) at same hierarchy level without a clear group separator. The divider exists but is visually subtle (1px thin). Two types of filter (period type vs. date range) are visually indistinguishable — same button style, same row. Manager must parse both dimensions simultaneously. | CONCERN |
| 2 | **Miller's Law** | Sales Summary summary cards: 5 cards at once — within 7±2. Table shows up to 14 rows plus a total row = 15 chunks. Manageable but approaches limit. Best Sellers: 3 summary cards — excellent. Sub-nav: 15 items across 5 groups — groups save it from failing outright. | CONCERN |
| 3 | **Fitts's Law** | **FAIL — CONFIRMED.** Both pages use `style="min-height: unset"` on period/tab toggle buttons, explicitly overriding the `app.css` base layer rule of `min-height: 44px`. Measured estimate: buttons are ~34px tall (py-1.5 = 6px×2 + ~14px text + 2px border = ~28-34px). Sub-nav tab links: `py-2 px-3` = 36px total height — also below 44px. Multiple primary interactive elements fail touch target floor. | FAIL |
| 4 | **Jakob's Law** | Tab-style sub-nav with groups is a recognizable pattern (similar to Google Analytics, spreadsheet tabs). Date filter chip pattern (Today / This Week / Month) matches common analytics apps. Good convention match. | PASS |
| 5 | **Tesler's Law** | Location auto-filled from session — good. Date defaults to "All" range — reasonable starting view. Best Sellers defaults to "Today" period but actually shows all-time data (because the filter is non-functional). Mismatch between UI affordance and system reality adds accidental complexity. | CONCERN |
| 6 | **Doherty Threshold** | RxDB is local-first — data loads instantly. The "● Live" pulse indicator gives real-time feedback on the current row. No perceived latency observed. | PASS |
| 7 | **Visibility of System Status** | "Today (live)" row with a green LIVE badge is excellent — manager can see at-a-glance that data is current. Location banner persistently shows branch. Sub-nav active state (orange underline + orange text) is present but subtle at tablet viewing distance. | PASS |
| 8 | **Gestalt: Proximity** | Period toggle and date range filter are in the same flex row but represent different filter dimensions. No visual grouping separates "toggle view type" from "filter date range". The `mx-2 h-4 w-px` separator exists but is very thin. On touch, adjacent buttons within 8px is under the 8px minimum spacing for preventing accidental taps. | CONCERN |
| 9 | **Gestalt: Similarity** | All toggle buttons (Daily, Weekly, All, Today, This Week, This Month on Sales Summary; Today, This Week, Meat Cuts, Add-ons on Best Sellers) use visually identical inactive styles — same border, same gray text, same padding. The active state differs (orange vs dark gray for active period vs. active range). This inconsistency is confusing: why does "Daily" go orange when active but "All" goes dark gray? | CONCERN |
| 10 | **Visual Hierarchy: Scale** | 5-column summary card grid on ~800px content width = ~145px per card including gaps. At `text-2xl font-bold`, `₱80,202.00` (10 chars) renders ~148px wide in JetBrains Mono — it fits but barely, with zero breathing room. On a 768px content area it would clip. | CONCERN |
| 11 | **Visual Hierarchy: Information** | Net Sales card gets a green background/border (highest emphasis) — correct, it's the most important number. "TOTAL" row in table uses `border-t-2` double line separation — good. However, the "Today (live)" row uses `bg-accent/5` (very subtle orange tint, ~5% opacity) — barely distinguishable from `bg-gray-50` on hover. | CONCERN |
| 12 | **WCAG: Color Contrast** | `text-status-green` on `bg-status-green-light` (#10B981 on #ECFDF5) = 3.2:1 — **FAILS AA** for the "Net Sales" label text (`text-xs` 10px uppercase). The "LIVE" badge uses this same combo for the text label. The "Top Cut" card header similarly fails for small text. | FAIL |
| 13 | **WCAG: Touch Targets** | Same as Fitts's Law finding. Toggle buttons ~34px, sub-nav tabs ~36px — both below 44px minimum. This is a repeat structural issue across the reports module. | FAIL |
| 14 | **Consistency** | **Ghost UI on Best Sellers.** The "Today / This Week" period toggle renders and is interactive (tap changes state) but produces zero data change — the code explicitly defers filtering to a future update. A manager tapping "This Week" will see no change and lose trust. On Sales Summary, the same-styled period toggle does work. Two visually identical controls have different functional contracts. | FAIL |

**Verdict summary:** 4 PASS · 5 CONCERN · 5 FAIL

---

## C. Best Day Ever — Manager's Perspective

It's Saturday night, 8:45 PM. The dining room is packed — both branches running. Sir Dan steps off the floor for 90 seconds to check today's numbers before the dinner rush peak.

He taps Reports → Sales Summary. The page loads instantly. His eyes find ₱7,992 for "Today (live)" immediately — green LIVE badge confirms it's current. "We're trending toward ₱12,000 by close, good pace." He notices the summary cards at the top but has to squint at the card labels — they're 10px uppercase gray and he's reading from arm's length in dim restaurant lighting. He taps the "Today" filter chip and the table updates — just the one row now. Clean. Useful.

He swipes to Best Sellers. He wants to know if the *samgyupsal special cut* is moving. The page loads — two rows of toggle buttons, then a "No meat sales data yet" empty state. Wait, they've served 8 tables today. He taps "This Week" expecting to see weekly data. Nothing changes. The numbers stay at 0. Something's wrong? Is the data broken? He taps "Meat Cuts" — already selected. He tries "This Week" again. Still zero. He closes the app and walks back to the floor, unsure if there's a bug or if the feature just doesn't work. **He never got the answer he needed.**

---

## D. Recommendations

### P0 — Critical (fix before next service)

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P0-1 | **Ghost UI period toggle on Best Sellers** — "Today / This Week" buttons render and are tappable but produce zero effect on displayed data. Managers tap, see nothing change, assume the feature is broken. Either implement the filter or remove the buttons and replace with a label showing "Showing: All-Time" until filtering is implemented. | `routes/reports/best-sellers/+page.svelte` | If filter can't be implemented now: replace buttons with a `<span class="text-xs text-gray-400">Showing all-time data</span>` placeholder. Remove the two buttons entirely. | S | High |
| P0-2 | **Touch target failure across all sales report buttons** — `style="min-height: unset"` on period toggles and tab toggles bypasses `app.css` base rule. Estimated tap height ~34px vs. 44px minimum. Remove the inline style override. Use `py-2` (8px×2 = 16px padding + text = ~36px) or `py-2.5` (10px×2 = ~40px) + border (2px) = 44px total. | `routes/reports/sales-summary/+page.svelte`, `routes/reports/best-sellers/+page.svelte` | Remove `style="min-height: unset"` from all toggle buttons in both files. Change `py-1.5` to `py-2.5` to achieve ≥44px. | S | High |

### P1 — High (fix this week)

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P1-1 | **Sub-nav tab touch targets below 44px** — `py-2 px-3` on report sub-nav `<a>` links gives ~36px tap height. | `routes/reports/+layout.svelte:83` | Change to `py-2.5` and add `min-h-[44px] flex items-center` to guarantee 44px. | S | High |
| P1-2 | **WCAG contrast fail on green card labels** — `text-xs text-status-green` (#10B981) on `bg-status-green-light` (#ECFDF5) = 3.2:1. Fails AA for small text. Affects "Net Sales" card label and "Top Cut" card label in Best Sellers. | `routes/reports/sales-summary/+page.svelte:111`, `routes/reports/best-sellers/+page.svelte:84,96` | Change label text to `text-emerald-700` (#047857, ~6.8:1 on #ECFDF5 — passes AAA) or darken the text to meet AA. | S | Med |
| P1-3 | **Period vs. Date Range filters are visually indistinguishable** — Sales Summary has 2 controls in 1 row (period type + date range) with identical button styling. Different active colors (orange vs dark gray) creates inconsistency but no clear UI signal about what each group controls. | `routes/reports/sales-summary/+page.svelte:62-99` | Add a `text-[10px] uppercase tracking-widest text-gray-400` label above each group ("View" and "Range"), or use a visible border/background to separate them. Move to two separate rows with clear labels. | S | Med |
| P1-4 | **"Tax" column label is ambiguous for BIR use** — Column header "Tax" in the sales table could refer to tax-inclusive price or tax collected. For BIR compliance, managers need clarity. | `routes/reports/sales-summary/+page.svelte:152` | Rename `Tax` → `VAT Collected` in the column header. The column is already hidden on tablet (`hidden sm:table-cell`) so label length is less of a concern. | XS | Med |
| P1-5 | **Best Sellers shows 0 data when sales exist** — Today shows ₱7,992 on Sales Summary but 0.0kg / ₱0.00 on Best Sellers. Empty state message says "after tables are served and orders are closed" but the actual trigger is meat deduction entries, not order close events. Misleading message erodes trust. | `routes/reports/best-sellers/+page.svelte:108-112` | Update empty state copy: "No meat deduction records for today. Meat sales populate from the stock waste/deduction log." Consider cross-referencing the Sales Summary's order-based data to provide something. | S | Med |

### P2 — Low (nice-to-have)

| ID | Issue | Location | Fix | Effort | Impact |
|---|---|---|---|---|---|
| P2-1 | **Sub-nav: "Staff Perf." truncated label** — Not intuitive for a new manager. | `routes/reports/+layout.svelte:21` | Expand to "Staff" or "Staff Sales" — saves no space but improves clarity. | XS | Low |
| P2-2 | **"Today (live)" row highlight barely visible** — `bg-accent/5` (5% orange on white) at tablet distance is effectively invisible. The LIVE badge is prominent but the row background doesn't reinforce it. | `routes/reports/sales-summary/+page.svelte:158` | Increase to `bg-accent/10` or `bg-orange-50` for a more perceptible row highlight. | XS | Low |
| P2-3 | **5-column summary card grid is cramped on tablet** — At ~804px content width with 5 cards and `gap-4`, each card is ~145px. The `text-2xl` number `₱80,202.00` is 10 chars and just fits. Any 5-digit peso value with peso sign exceeds this width in JetBrains Mono. | `routes/reports/sales-summary/+page.svelte:103` | Reduce to `grid-cols-3` on tablet with a second row for the remaining cards, or use `grid-cols-5 xl:grid-cols-5` with responsive fallback. Alternatively truncate to `₱80.2k` at smaller widths. | M | Low |
| P2-4 | **Best Sellers: two-dimensional toggle UI adds cognitive overhead** — 4 controls across 2 rows (period + tab type) before content. The location+date sub-header adds a 3rd information row. Content doesn't start until ~180px down. | `routes/reports/best-sellers/+page.svelte:39-69` | Merge period and tab into one toolbar: `[Meat Cuts ▾] [Today ▾]` as a pair of selects or segmented controls. Eliminates one full UI row. | M | Low |

---

## Fix Checklist (for `/fix-audit`)

- [ ] P0-1 — Remove ghost period toggle from Best Sellers or implement filter
- [ ] P0-2 — Remove `style="min-height: unset"` from all report toggle buttons
- [ ] P1-1 — Sub-nav tab `<a>` min-height 44px
- [ ] P1-2 — Green card label contrast fix (Net Sales + Top Cut labels)
- [ ] P1-3 — Separate "View" and "Range" filter groups visually in Sales Summary
- [ ] P1-4 — Rename "Tax" → "VAT Collected" in table header
- [ ] P1-5 — Update Best Sellers empty state copy to explain deduction-based data
- [ ] P2-1 — Expand "Staff Perf." label
- [ ] P2-2 — Increase today row highlight to `bg-accent/10`
- [ ] P2-3 — Responsive summary card grid (5-col → 3-col on tablet)
- [ ] P2-4 — Merge Best Sellers period + tab toggles into single toolbar row
