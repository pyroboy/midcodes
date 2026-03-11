# UX Audit — Package Color Coding: POS · Weigh Station · Dispatch
**Date:** 2026-03-11
**Run ID:** 075050-pkg-color
**Branch:** tag
**Roles:** Staff (POS), Kitchen Butcher/Weigher (Weigh Station), Kitchen Dispatch (Dispatch Board)
**Viewport:** 1024×768 tablet
**App:** WTFPOS — Alta Citta (Tagbilaran)
**Scope:** Visual differentiation of Unli Pork / Unli Beef / Unli Beef+Pork across three surfaces

---

## Pre-Audit Code Analysis (Gate 0.5)

Before opening the browser, source code was read to establish ground truth for current color values.

### Current package color system — `FloorPlan.svelte`

```js
// tableFill() — table background by package
pkg-pork  → fill #fdf2f8  (rose-50,    very pale pink)
pkg-beef  → fill #faf5ff  (violet-50,  very pale purple)
pkg-combo → fill #fffbeb  (amber-50,   very pale yellow)

// pkgColor() — label text color
pkg-pork  → #be185d  (rose-700,   pink)
pkg-beef  → #7c3aed  (violet-600, purple)  ← ⚠️
pkg-combo → #7c3aed  (violet-600, purple)  ← ⚠️ SAME AS BEEF

// tableStroke() — no package-specific stroke
all occupied → #10b981  (green, regardless of package)
```

**Critical bug confirmed in code:** `pkg-beef` and `pkg-combo` share the identical label color `#7c3aed`. On the floor map, a Beef Unlimited table and a Beef+Pork Unlimited table are visually indistinguishable by color.

### Current weigh station — `kitchen/weigh-station/+page.svelte`

```
All table group headers → bg-amber-50 border-amber-100 text-amber-700
                          (same amber for ALL packages — no differentiation)

Selected item display → text-3xl font-extrabold (meat cut name, e.g. "Pork Sliced")
                        No protein-type label ("BEEF" / "PORK") anywhere
                        No package color context in the weighing zone
```

### Current dispatch cards — `kitchen/dispatch/+page.svelte`

```
Package row → bg-amber-50 border-amber-100 text-amber-700
              (same amber for ALL packages — no differentiation)
```

---

## A. Text Layout Map

### POS Floor — Occupied Table Card (current)
```
┌──────────────────────────────┐
│  [PORK] ← 12px rose text     │  ← pkg-pork: legible (pink)
│  [BEEF] ← 12px violet text   │  ← pkg-beef: legible (violet)
│  [Beef+Pork] ← 12px violet   │  ← pkg-combo: SAME color as BEEF ⚠️
│                               │
│  fill: #fdf2f8 / #faf5ff /    │  ← extremely pale, barely visible
│        #fffbeb (all ~95% white)│
│  stroke: #10b981 (all green) │  ← no package differentiation in border
│                               │
│  T1  [timer]  ₱XXX           │
│  Npax   N items              │
└──────────────────────────────┘
```

### Weigh Station — Active State (current)
```
┌─────────────────┬────────────────────────────────┬──────────────┐
│  Pending Meat   │  Weighing for                  │  Dispatched  │
│  ─────────────  │                                │  ──────────  │
│  T1 order-xxx   │  ← "Weighing for" label        │  log list    │
│  ┌─────────┐    │     text-sm text-gray-500      │              │
│  │ bg-amber│    │                                │              │
│  │ amber   │    │  T1 — Pork Sliced              │              │
│  │ for ALL │    │  ← text-3xl font-extrabold     │              │
│  └─────────┘    │     gray-900 (no protein color)│              │
│                 │                                │              │
│  meat items     │  2 pax | ~300g suggested       │              │
│  as buttons     │                                │              │
│                 │  [Manual] [Scale]              │              │
│                 │  [numpad]                      │              │
│                 │                                │              │
│                 │  [Dispatch ✓]                  │              │
└─────────────────┴────────────────────────────────┴──────────────┘
     No protein type context visible anywhere in this panel
     Table groups look IDENTICAL for Beef vs Pork vs Combo orders
```

### Dispatch Card (current)
```
┌─────────────────────────────────────────────────────┐
│  T3          [2m]                           4 pax   │
│ ─────────────────────────────────────────────────── │
│  Beef + Pork Unlimited           ~1,200g/meat       │  ← bg-amber-50 for ALL
│ ─────────────────────────────────────────────────── │
│  🥩 Meats   [●●●○○] 3/5         🍳 Dishes [●●] 2/2 │
│  🥗 Sides   [○○○]   0/3         [✓ All Done]        │
└─────────────────────────────────────────────────────┘
  No color differentiation — Pork, Beef, Combo all amber
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | **Hick's Law** | PASS | Floor plan decisions are simple — tap occupied table. No excess choices. |
| 2 | **Miller's Law** | PASS | Table cards are compact — 5 data points max per card. |
| 3 | **Fitts's Law** | PASS | Table tap targets are large (SVG tile, whole rect). Weigh station buttons are `min-height: 56px`. |
| 4 | **Jakob's Law** | FAIL | Color coding for product types is universal in restaurant ops (e.g., color-coded docket systems). Beef = blue, Pork = pink is a known kitchen convention. Current system violates this expectation by assigning beef and combo the same color. |
| 5 | **Doherty Threshold** | PASS | No performance issues observed. |
| 6 | **Visibility — System Status** | FAIL | At the weigh station, Benny has NO way to see the protein type of the order at a glance. He sees "T1 — Pork Sliced" in `text-3xl` but this is the specific cut name — not a bold protein-type banner. In a high-intensity service, when 5 orders are pending and steam is rising, reading a 3xl text for cut names is still insufficient. A "BEEF" / "PORK" banner at 8xl+ would make the protein type scannable from 2m away. |
| 7 | **Gestalt: Similarity** | FAIL | `pkg-beef` and `pkg-combo` use identical color `#7c3aed`. Staff associate color with package type — when two different packages share a color, the visual language collapses. |
| 8 | **Gestalt: Common Region** | CONCERN | Weigh station left panel groups orders by table but uses identical amber styling — no region differentiation by protein type. |
| 9 | **Visual Hierarchy: Emphasis** | FAIL | At the weigh station, the most safety-critical information (which protein type am I cutting?) is not the most visually prominent element. The table number ("T1") is `text-lg font-black` but the protein type has no dedicated prominent display. |
| 10 | **Visual Hierarchy: Density** | CONCERN | Dispatch card package row uses `text-xs` for package name — at `bg-amber-50`, text-xs, amber-700, this is the least visually prominent row on the card. Package type should be one of the most prominent pieces of information on a dispatch card. |
| 11 | **WCAG: Contrast** | CONCERN | Package label at 12px font on near-white fill: `#be185d` on `#fdf2f8` = ~5.1:1 (marginal). `#7c3aed` on `#faf5ff` = ~4.8:1 (marginal for 12px bold). Target ≥5.5:1 for kitchen environment (see KP-02). |
| 12 | **WCAG: Touch Targets** | PASS | Table tile targets are well-sized in SVG. KP-01 not triggered in these surfaces. |
| 13 | **Consistency: Internal** | FAIL | The `pkgColor()` function assigns different colors to `pkg-pork` vs `pkg-beef`, establishing color = package. But `pkg-combo` breaks this contract by reusing `pkg-beef`'s color. Internally inconsistent. |
| 14 | **Consistency: External** | CONCERN | Weigh station uses `bg-amber-50` for all packages; dispatch uses `bg-amber-50` for all packages; POS uses pale fills. Three surfaces — three different color approaches — none of them consistent with each other. |

**Verdict summary:** PASS: 4 · CONCERN: 4 · FAIL: 6

---

## C. Best Day Ever

*It's Saturday lunch. 4 tables open simultaneously. Benny is at the butcher station weighing meat for 3 different orders.*

**Current reality (not best day ever):**
Benny squints at the 3×4 left panel. T1, T3, T5 all showing pending meat. Each group header is amber. He taps T1 — the center shows "T1 — Pork Sliced" in big gray text. He lifts the pork tray. Waiter rushes past — "Kuya, that one is BEEF, mali!" He re-reads. He was right. But he doubted himself for a second — steam in his eyes, "Pork Sliced" vs "Sliced Beef" both look like the same gray text at arm's length.

**The best day ever (after fix):**
Benny sees the left panel: T1 card has a deep rose-pink left border and "PORK" in pink text. T3 card has a deep blue left border and "BEEF" in blue text. T5 has both — orange border, "BEEF+PORK". Zero ambiguity from 1.5 meters away.

He taps T1 — the entire center panel background shifts to a soft rose-pink wash. At the top, in massive `text-8xl font-black` rose text: **PORK**. Below it: "T1 — Pork Sliced — ~300g suggested". He grabs the pork tray without a second thought.

Maria at the POS looks at the floor plan — T1 rose, T3 blue, T5 orange. At 8am rush she can tell in 0.3 seconds which tables have which package without reading any text.

---

## D. Findings

[01] `pkg-beef` and `pkg-combo` share the same label color — they are visually indistinguishable
> **What:** `pkgColor()` in `FloorPlan.svelte` returns `#7c3aed` (violet-600) for both `pkg-beef` and `pkg-combo`. On the POS floor map, a table with "Beef Unlimited" and a table with "Beef+Pork Unlimited" display the same purple label badge. Staff cannot tell them apart by color.
> **How to reproduce:** Open two tables simultaneously — one with Beef Unlimited, one with Beef+Pork. Both table badges render in identical `#7c3aed` violet.
> **Why this breaks:** Maria is at the cashier desk managing 6 tables. She glances at the floor to check which tables have combo packages (higher bill). She can't identify them by color — she has to read the text label ("Beef+Pork") on each table. During a rush, this forces unnecessary cognitive load and slows her down.
> **Ideal flow:** Each package gets a fully distinct color identity:
> - `pkg-pork` → Rose/pink: `#be185d` (rose-700) — KEEP existing
> - `pkg-beef` → Blue: `#1d4ed8` (blue-700) — change from violet to clear blue
> - `pkg-combo` → Orange: `#ea580c` (accent-orange, brand color) — makes sense as premium/both
> **The staff story:** "The floor used to have purple for beef and purple for combo. I kept mixing them up. Now they're blue and orange and I can see at a glance." — Ate Maria

---

[02] POS table card fill colors are too pale — package identity is near-invisible
> **What:** Package-specific fills are at ~5% opacity (`#fdf2f8`, `#faf5ff`, `#fffbeb`) — essentially white with a barely-there tint. On a bright tablet screen, the table fill gives almost no color signal. The only color is the 12px text badge.
> **How to reproduce:** View POS floor with multiple occupied tables of different packages. The fills look nearly identical (all near-white). Only the small text label differentiates them.
> **Why this breaks:** The table fill is the largest visual surface on the floor card — roughly 112×112px of SVG rectangle. Making it near-white wastes the entire fill as a color signaling surface. Staff must read the text badge to know the package, rather than scanning color instantly (pre-attentive processing).
> **Ideal flow:** Use saturated package fills — soft but clearly distinguishable:
> - `pkg-pork` → `#fce7f3` (rose-100) — still soft, but clearly pink vs white
> - `pkg-beef` → `#dbeafe` (blue-100) — clearly blue
> - `pkg-combo` → `#fed7aa` (orange-100) — clearly orange
> Also add a matching package-specific stroke color:
> - `pkg-pork` → stroke `#be185d` (rose-700)
> - `pkg-beef` → stroke `#1d4ed8` (blue-700)
> - `pkg-combo` → stroke `#ea580c` (orange/accent)
> **The staff story:** "Before, all the tables were basically white. I had to lean in and read the badge. Now I can see pink, blue, orange from across the room." — Ate Maria

---

[03] Weigh station has no protein-type banner — Benny must read cut names to identify protein
> **What:** The weigh station center panel (the weighing zone) shows the selected item as `text-3xl font-extrabold text-gray-900`: e.g., "T1 — Pork Sliced". There is no dedicated protein-type label at a larger size. The left panel table groups all use `bg-amber-50 text-amber-700` regardless of package.
> **How to reproduce:** Open kitchen/weigh-station with pending meat orders. Select any item — the center shows the meat cut name but no protein category label.
> **Why this breaks:** Kuya Benny is the butcher. His entire job at this station is to cut and weigh the correct protein. In a loud, steamy service environment with 5+ orders queued, the most critical information — AM I CUTTING BEEF OR PORK? — must be visible from arm's length, in the middle of noise and steam. A `text-3xl` gray cut name does not provide this. "Pork Sliced" and "Sliced Beef" are nearly the same visual weight at 3xl.
> **Ideal flow:** When a meat item is selected, the center panel background shifts to the package color, and a dominant protein label renders at `text-8xl font-black`:
> ```
> ┌────────────────────────────────────────────────┐
> │  bg-blue-50 (or rose-50 / amber-50)            │
> │                                                │
> │           BEEF                                 │  ← text-8xl font-black
> │        (blue-700)                              │     protein type, not cut name
> │                                                │
> │        T1 · Sliced Beef                        │  ← text-xl secondary label
> │        4 pax · ~600g suggested                 │
> └────────────────────────────────────────────────┘
> ```
> The protein type ("BEEF") is the banner. The cut name ("Sliced Beef") is the sub-label. This inverts the current hierarchy where cut name is the title.
> Derive protein from: `order.packageId` → `pkg-beef` / `pkg-pork` / `pkg-combo` OR from `item.name.toLowerCase().includes('beef')` as fallback.
> **The staff story:** "In the middle of service, steam everywhere, I need one word: BEEF or PORK. Not 'Sliced Beef' in small gray text." — Kuya Benny

---

[04] Weigh station left panel — all table group cards are identical amber regardless of package
> **What:** Every table group card in the left "Pending Meat" panel uses `bg-amber-50 border-b border-amber-100 text-amber-700` for the package+weight row, regardless of whether the order is Beef Unlimited, Pork Unlimited, or Combo.
> **How to reproduce:** Have multiple tables with different packages all with pending meat. Left panel shows all groups with identical amber headers.
> **Why this breaks:** If Benny has T1 (Pork), T3 (Beef), T5 (Combo) all queued, the left panel looks identical for all three. He must read the text to understand which is which. The package color system should extend to the left panel so that group headers are visually distinct.
> **Ideal flow:** Apply package color to the group card's left border (accent bar) and the package row background:
> - Pork order → left border `border-l-4 border-rose-500`, package row `bg-rose-50 text-rose-700`
> - Beef order → left border `border-l-4 border-blue-500`, package row `bg-blue-50 text-blue-700`
> - Combo order → left border `border-l-4 border-orange-500`, package row `bg-orange-50 text-orange-700`
> **The staff story:** "I can see the colors on the left — pink for pork, blue for beef. I already know what to grab before I even tap." — Kuya Benny

---

[05] Dispatch cards — package type row uses identical amber styling for all packages
> **What:** In `kitchen/dispatch/+page.svelte`, the package+suggested weight row on every dispatch card uses `bg-amber-50 border-amber-100 text-amber-700` regardless of package type. All three packages (Pork Unlimited, Beef Unlimited, Beef+Pork) look identical on the dispatch board.
> **How to reproduce:** Open dispatch with multiple tables of different packages. All package rows appear in the same amber styling.
> **Why this breaks:** Corazon at the dispatch/expo station is coordinating meat flow, sides, and dishes across all open tables. When she glances at the dispatch board to see which tables are BEEF orders vs PORK orders (meat flow is different — beef comes from one tray, pork from another), she must read the package name text on each card. Color-at-a-glance identification is not possible.
> **Ideal flow:** Apply the same 3-color system to dispatch card package rows:
> - `bg-rose-50 text-rose-700 border-rose-100` for Pork
> - `bg-blue-50 text-blue-700 border-blue-100` for Beef
> - `bg-orange-50 text-orange-700 border-orange-100` for Beef+Pork
> Consider also adding a colored left-border accent to the entire dispatch card header.
> **The staff story:** "At dispatch, I need to see blue = beef, pink = pork so I know which queue to pull from before the meat arrives." — Ate Corazon

---

## E. Structural Proposals

[SP-01] Establish a shared `PKG_COLORS` token map — single source of truth for all three surfaces

**Rationale:** Three interfaces (POS FloorPlan, Weigh Station, Dispatch) all need the same 3-package color system. If each implements its own color mapping independently, they will drift. A shared constant in `src/lib/stores/pos/utils.ts` or `src/lib/utils.ts` eliminates duplication:

```ts
// Proposed: src/lib/stores/pos/utils.ts (or a new label.utils.ts)
export const PKG_COLORS = {
  'pkg-pork': {
    label:    '#be185d',   // rose-700
    fill:     '#fce7f3',   // rose-100
    stroke:   '#be185d',   // rose-700
    bg:       'bg-rose-50',
    text:     'text-rose-700',
    border:   'border-rose-200',
    accent:   'border-l-4 border-rose-500',
    name:     'PORK',
  },
  'pkg-beef': {
    label:    '#1d4ed8',   // blue-700
    fill:     '#dbeafe',   // blue-100
    stroke:   '#1d4ed8',   // blue-700
    bg:       'bg-blue-50',
    text:     'text-blue-700',
    border:   'border-blue-200',
    accent:   'border-l-4 border-blue-500',
    name:     'BEEF',
  },
  'pkg-combo': {
    label:    '#ea580c',   // orange-600 (brand accent)
    fill:     '#fed7aa',   // orange-100
    stroke:   '#ea580c',   // orange-600
    bg:       'bg-orange-50',
    text:     'text-orange-700',
    border:   'border-orange-200',
    accent:   'border-l-4 border-orange-500',
    name:     'BEEF+PORK',
  },
} as const;

export function getPkgColors(packageId: string | null | undefined) {
  return PKG_COLORS[packageId as keyof typeof PKG_COLORS] ?? null;
}

export function getPkgProtein(packageId: string | null | undefined): string | null {
  return getPkgColors(packageId)?.name ?? null;
}
```

All three components import from this single source. When a new package is added, it's added once.

---

[SP-02] Weigh station: dominant protein banner with full-bleed color panel

**Rationale:** The user explicitly requested "very huge label — BEEF / PORK" in the weigh station. The fix is an inversion of the current information hierarchy in the center panel when an item is selected.

**Proposed layout for the center panel (selected item state):**
```
┌─────────────────────────────────────────────────────┐
│  bg based on protein: bg-rose-50 / bg-blue-50       │
│  (full-height color wash on center panel)           │
│                                                     │
│                                                     │
│            🐷  PORK                                 │  ← text-8xl+ font-black
│                                                     │     protein-color text
│                                                     │
│         T1 · Pork Sliced                            │  ← text-xl font-bold
│         4 pax  ·  ~600g suggested                   │  ← text-sm text-muted
│         Stock: 2.4kg                                │
│                                                     │
│      [Manual] [Scale]                               │
│      [numpad]                                       │
│                                                     │
│      [✓ Dispatch 600g]                              │
└─────────────────────────────────────────────────────┘
```

Emoji per protein type:
- Pork → 🐷 (pig face)
- Beef → 🐄 (cow face)
- Combo → 🔥 (fire, representing the grill mix)

Implementation note: derive protein from `order.packageId` via `getPkgProtein()`. No new data fields needed.

---

[SP-03] POS table card: package-specific stroke replaces static green

**Rationale:** The table stroke (border) is the most visually prominent element of a table card — it's a 2px ring around the entire 112×112 tile. Currently all occupied tables show the same green `#10b981` stroke regardless of package. Switching to package-specific strokes provides immediate, scannable color differentiation even at a distance:

Change in `tableStroke()` in `FloorPlan.svelte`:
```js
// Existing billing/maintenance/critical/warning cases stay unchanged
// Change the default occupied case:
if (order?.packageId === 'pkg-pork')  return '#be185d';  // rose-700
if (order?.packageId === 'pkg-beef')  return '#1d4ed8';  // blue-700
if (order?.packageId === 'pkg-combo') return '#ea580c';  // orange-600
return '#10b981';  // fallback green for no-package orders
```

This single function change makes every occupied table tile immediately scannable by package type — no text reading required.

---

## Fix Checklist

- [x] [01] — Fix `pkgColor()` in `FloorPlan.svelte`: `pkg-combo` → `#ea580c`, `pkg-beef` → `#1d4ed8` — **VERIFIED LIVE** ✅
- [x] [02] — Update `tableFill()` and `tableStroke()`: use rose-100/blue-100/orange-100 fills + package-specific strokes — **VERIFIED LIVE** ✅
- [x] [03] — Weigh station center panel: add dominant protein banner (text-8xl, full-bleed color bg) — **VERIFIED LIVE** ✅ (banner renders, partially above fold at 1024×768 — see note below)
- [x] [04] — Weigh station left panel: apply `border-l-4` + package-color row bg to table group cards — **VERIFIED LIVE** ✅
- [x] [05] — Dispatch cards: apply package-color to the package+weight row (bg + text + border) — **VERIFIED LIVE** ✅
- [x] [SP-01] — Extract `PKG_COLORS` constant to shared utils (recommended before implementing [01]–[05]) — **IMPLEMENTED** in `src/lib/stores/pos/utils.ts` ✅

---

---

## Live Verification — Run 161721-b231e3a5 (2026-03-11)

**Viewport:** 1440×900 (expanded from 1024×768 for banner visibility)
**Session:** Ate Rose (staff/tag) → Kuya Benny (kitchen/tag)
**Tables opened:** T1 (Pork Unlimited), T3 (Beef Unlimited), T5 (Beef+Pork Unlimited)

### POS Floor Plan — 3-table comparison
- T1: rose fill (`#fce7f3`) + rose stroke (`#be185d`) + "PORK" badge in rose-700 ✅
- T3: blue fill (`#dbeafe`) + blue stroke (`#1d4ed8`) + "BEEF" badge in blue-700 ✅
- T5: orange fill (`#fed7aa`) + orange stroke (`#ea580c`) + "Beef+Pork" badge in orange-600 ✅
- All three immediately distinguishable at a glance — zero ambiguity between beef/combo (previously identical violet)

### Weigh Station Left Panel
- T1 card: `border-l-4 border-rose-500` + rose-50 package row + "Pork Unlimited" in rose-700 ✅
- T3 card: `border-l-4 border-blue-500` + blue-50 package row + "Beef Unlimited" in blue-700 ✅
- T5 card: `border-l-4 border-orange-500` + orange-50 package row + "Beef + Pork Unlimited" in orange-700 ✅

### Weigh Station Center Panel (item selected)
- Full-bleed blue background wash renders on Sliced Beef selection ✅
- `🐄 BEEF` banner in `text-8xl font-black blue-700` confirmed present ✅
- **⚠ Partial fold issue:** At 1024×768 standard tablet viewport, the protein banner is cut above the fold because `justify-center` pushes the long content (banner + info + numpad) above the visible area. At 1440×900, the top of the banner is just barely visible. This is a residual concern — see note below.

### Dispatch Board
- T1: rose `border-l-4` card outline + rose-50 "Pork Unlimited" row ✅
- T3: blue `border-l-4` card outline + blue-50 "Beef Unlimited" row ✅
- T5: orange `border-l-4` card outline + orange-50 "Beef + Pork Unlimited" row ✅
- Entire dispatch board immediately scannable by protein type ✅

### Residual Concern — Weigh Station Protein Banner Fold
> The `text-8xl` banner + item info + numpad together exceeds the available center panel height on a 768px tablet. Because the container uses `justify-center`, the banner scrolls above the fold when content overflows. Users would need to scroll up manually to see the full "🐄 BEEF" / "🐷 PORK" heading.
>
> **Suggested fix:** Replace `justify-center` with `justify-start pt-8` on the center content div when `selectedItem` is truthy, so the protein banner is always anchored at the top of the panel rather than centered. Alternatively, keep `justify-center` and remove the banner from the flow (position it as a sticky header above the scrollable content).

---

## Severity Summary

| Finding | Where | Severity | Effort |
|---|---|---|---|
| [01] beef = combo color clash | POS FloorPlan | Critical — color system broken | S |
| [02] near-white table fills | POS FloorPlan | High — wasted visual channel | S |
| [03] No protein banner | Weigh Station | Critical — safety in high-intensity service | M |
| [04] Amber-all left panel | Weigh Station | High — no visual scanning possible | S |
| [05] Amber-all dispatch cards | Dispatch Board | Medium — slower scanning at expo | S |
| [SP-01] PKG_COLORS shared constant | All surfaces | Architecture — prevents drift | S |
| [SP-02] Full-bleed protein panel | Weigh Station | Design — defines the new pattern | M |
| [SP-03] Package stroke on floor | POS FloorPlan | Design — max visual signal | S |
