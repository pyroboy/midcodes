# Report Layout Specification — ReportShell 3-Zone System

All report pages use `<ReportShell>` (`src/lib/components/reports/ReportShell.svelte`) to enforce a consistent, shift-free layout across all 14+ report views.

---

## Zone Map

```
┌─────────────────────────────────────────────────┐
│  ┌─ alerts (absolute overlay, floats above) ──┐ │
│  │  warnings, badges, banners — layers on top  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  TOPMOST   h-[200px] strict                       │
│  ┌─ clickables  (single row, strict height)     │ │
│  │  [period] [tabs] [toggles]  ··· [actions]    │ │
│  └──────────────────────────────────────────────┘ │
│  ┌─ kpis    (flex-1 — stretches to fill)        │ │
│  └──────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────┤
│  CHART     min-h-[280px] expandable               │
│  └─ chart card (flex-1 flex flex-col)             │
├───────────────────────────────────────────────────┤
│  CONTENT   no height constraint, scrollable       │
│  └─ tables, details, secondary charts             │
└───────────────────────────────────────────────────┘
```

---

## Clickables — Single Row Rule

**All interactive controls in the topmost zone must share one horizontal row.** This is a strict-height row that never wraps or stacks. Everything clickable goes here — nothing clickable lives outside this row (except modals, which render outside `<ReportShell>` entirely).

### What counts as a clickable

| Type | Description | Examples |
|------|-------------|---------|
| **Period filter** | Time range selector buttons | Today, This Week, This Month, All, 3m, 6m, 12m |
| **Tab toggle** | Switch between data views | Meat / Addons, Consumption / Transfers / Conversion, Daily / Weekly |
| **Action button** | Opens a modal or triggers an action | "+ Log New Expense", "+ Log Utility Reading", "Generate X-Read", "Print", "Start End of Day" |
| **View toggle** | Switches chart/display mode | Cost / Consumption |
| **Date input** | Date range pickers | Custom from/to date inputs |

### What is NOT a clickable (stays in alerts overlay)

| Type | Description | Examples |
|------|-------------|---------|
| **Status badge** | Read-only indicator | Live dot, BIR badge, "Submitted" badge |
| **Warning banner** | Contextual alert | Stale-shift warning, open-table warning, ALL-location guard |
| **Info display** | Location/date context | Branch name label, date label |

### Row layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [Period ▪ ▪ ▪]  [Tab ▪ ▪]  [Toggle ▪ ▪]  ·········  [Actions] │
│  ← left-aligned, grouped by type →        ← ml-auto, right →   │
└──────────────────────────────────────────────────────────────────┘
```

- **Left side:** Period filters first, then tab toggles, then view toggles — in reading order
- **Right side:** Action buttons pushed right via `ml-auto` (modals openers, print, generate)
- **Gap:** `gap-2` between items within a group, `gap-3` between groups
- **Height:** Single row, no wrapping — `flex items-center flex-nowrap`
- Date inputs (branch-comparison) sit between toggles and action buttons

### Clickable inventory per page

| Page | Period Filter | Tab Toggle | View Toggle | Action Buttons | Date Input |
|------|--------------|------------|-------------|----------------|------------|
| sales-summary | Today / Week / Month / All | Daily / Weekly | — | — | — |
| best-sellers | Today / Week / Month | Meat / Addons | — | — | — |
| table-sales | Today / Week / Month | — | — | — | — |
| voids-discounts | Today / Week / All Time | — | — | — | — |
| peak-hours | Today / Week | — | — | — | — |
| profit-gross | Today / Week / Month | — | — | — | — |
| profit-net | Today / Week / Month | — | — | — | — |
| branch-comparison | Today / Week / Month | — | — | — | From / To |
| expenses-daily | Today / Week / Month / All | — | — | + Log New Expense | — |
| utilities | 3m / 6m / 12m / All | — | Cost / Consumption | + Log Utility Reading | — |
| meat-report | Today / Yesterday / Week | Consumption / Transfers / Conversion | — | — | — |
| x-read | *(none)* | — | — | Print, Generate X-Read | — |
| eod | *(none)* | — | — | Start End of Day | — |
| stock-variance | AM 10 / PM 4 / PM 10 | — | — | — | — |

---

## Alerts — Overlay Exception

Alerts are **not part of the normal flow**. They float above the topmost zone as an overlay layer.

| Property | Value |
|----------|-------|
| Position | `absolute` — overlaps clickables and KPIs |
| Z-index | Above topmost content |
| Behavior | Appears/disappears without shifting layout below |
| Content | Warning banners, status badges, guard messages |

Alerts **never** push down the clickables row or KPIs. They layer on top. This means:
- The topmost zone height stays exactly `h-[200px]` regardless of alerts
- Clickables row stays at the same Y position whether alerts are visible or not
- KPIs stay at the same Y position whether alerts are visible or not

### Alert examples

| Page | Alert Content | Type |
|------|--------------|------|
| x-read | BIR X-Reading badge, Live indicator | Status badge |
| eod | Stale-shift warning, open-table warning, ALL-location guard, submitted badge | Warning + status |
| best-sellers | Branch name + date subheader | Info display |

---

## Zone 1: TOPMOST

| Property | Value |
|----------|-------|
| Height | `h-[200px]` — **strict, never changes** |
| Position | `relative` — establishes stacking context for alert overlay |
| Overflow | `overflow-y-auto` — scrolls if content exceeds 200px |
| Flex | `flex flex-col` — vertical stack |
| Shrink | `shrink-0` — never compressed by parent flex |
| Print | `print:h-auto print:overflow-visible` — collapses for print |

### Child behavior

| Child | Class | Behavior |
|-------|-------|----------|
| `alerts` | `absolute` overlay | Floats above, does not consume flow height |
| `clickables` (filter) | `shrink-0` | Single strict-height row, never compressed |
| `kpis` wrapper | `flex-1 flex flex-col` | **Stretches to fill all remaining height** |

### KPI grid rules

- Every `{#snippet kpis()}` must wrap its grid in a div with **`flex-1`** so the grid stretches vertically within the topmost zone.
- Example: `<div class="grid grid-cols-4 gap-4 flex-1">`.
- `KpiCard` components naturally stretch to fill grid row height — no extra CSS needed on cards.

### Responsive behavior within TOPMOST

The 200px is the **total budget** for clickables + KPIs only (alerts overlay, not counted):
- If there are no clickables → KPIs get the full 200px.
- If clickables row exists → it takes its natural single-row height (~40px), KPIs get the rest (~160px).
- Alerts appear/disappear without affecting any of this.

**Never change `h-[200px]`** to accommodate individual reports. The strict height is what prevents layout shift when switching between reports.

---

## Zone 2: CHART

| Property | Value |
|----------|-------|
| Min height | `min-h-[280px]` — **expandable, not strict** |
| Margin | `mt-4 mb-5` |
| Flex | `flex flex-col` |
| Print | `print:min-h-0` — collapses for print |

### Chart card rules

Every chart card inside `{#snippet chart()}` must follow this pattern:

```svelte
{#snippet chart()}
  <div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
    <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Chart Title</p>
    <!-- chart component here -->
  </div>
{/snippet}
```

| Element | Class | Why |
|---------|-------|-----|
| Outer card div | `flex-1 flex flex-col` | Stretches to fill the chart zone container |
| Card padding | `p-4` | **Uniform across all reports** (not `p-5`) |
| Title margin | `mb-3` | **Uniform across all reports** (not `mb-4`) |
| Card styling | `rounded-xl border border-border bg-white` | Standard card appearance |

### Chart height

- All `ReportBarChart` and `ReportLineChart` components: **`height={200}`**.
- The chart zone itself expands beyond 280px if the chart content needs it.
- Empty states must also include `flex-1` so they stretch to fill the card.

---

## Zone 3: CONTENT

| Property | Value |
|----------|-------|
| Height | None — takes remaining viewport space |
| Scrolling | Natural document scroll |

No constraints. Tables, detail sections, secondary charts, and any other content render here with normal flow.

---

## Spacing Summary

| Gap | Value | Where |
|-----|-------|-------|
| Clickables → KPIs | `mb-4` | Clickables row wrapper in TOPMOST |
| TOPMOST → CHART | `mt-4` | Chart zone top margin |
| CHART → CONTENT | `mb-5` | Chart zone bottom margin |
| Chart card padding | `p-4` | All chart card wrappers |
| Chart title → chart | `mb-3` | Title `<p>` inside chart card |
| KPI card gap | `gap-4` | KPI grid |
| Clickable item gap | `gap-2` | Within clickable groups |
| Clickable group gap | `gap-3` | Between clickable groups |

---

## Print Overrides

| Zone | Print class | Effect |
|------|-------------|--------|
| TOPMOST | `print:h-auto print:overflow-visible` | Removes fixed height, shows all content |
| CHART | `print:min-h-0` | Removes minimum height |

Reports with print-specific layouts (x-read, eod) also use `print:hidden` and `hidden print:block` on individual elements to show/hide content for thermal receipt printing.

---

## No Redundant Context in TOPMOST

The topmost zone is precious vertical real estate. **Do not add information that is already visible elsewhere on screen.** The root layout already provides:

- **Branch/location name** — `LocationBanner` is permanently mounted in the root layout on every authenticated page
- **Current date** — visible in the system clock and often in KPI card labels
- **User role** — shown in `AppSidebar`

If a piece of text in the topmost zone is purely informational (not clickable) and duplicates something already on screen, remove it. Every pixel of the 200px budget should go to clickables and KPIs.

---

## Modals

All modals (expense entry, utility reading, PIN confirmation, EOD multi-step, etc.) render **outside** `<ReportShell>` entirely. They are never part of any zone or snippet.

---

## Checklist for New Report Pages

1. Import and wrap in `<ReportShell>`
2. Define snippets: `filter` (clickables row), `kpis`, `chart`, `content` (+ optional `alerts`)
3. **Clickables row:** All interactive controls in a single `flex items-center flex-nowrap` row
   - Period filters left, tab toggles next, action buttons `ml-auto` right
4. **Alerts:** Only non-interactive status badges and warnings — they overlay, not flow
5. KPI grid div: add `flex-1` class
6. Chart card div: add `flex-1 flex flex-col` class
7. Chart card padding: `p-4` (not `p-5`)
8. Chart title margin: `mb-3` (not `mb-4`)
9. Chart component height: `height={200}`
10. Modals: render **outside** `<ReportShell>`, not inside any snippet
11. Run `pnpm check` — 0 new errors
