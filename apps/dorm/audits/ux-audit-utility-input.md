# UX Audit — Utility Input: Electricity Readings

**Route**: `/utility-input/electricity/[slug]/[date]`
**Date**: 2026-03-20
**Auditor**: Claude (Extreme depth)
**Property tested**: DA Tirol Dormitory (14 meters, 2 floors)
**Viewports**: Desktop 1440×900, Mobile 375×812

---

## v3 Edge Case Audit (Extreme — All Scenarios)

Tested 13 scenarios across invalid/missing/edge-case inputs. Findings below.

### Scenario Matrix

| # | Scenario | URL | Result | Severity |
|---|----------|-----|--------|----------|
| 1 | Happy path (today) | `/5/2026-03-20` | ✅ Renders 14 meters, 2 floors, all features work | — |
| 2 | Future date (5 days) | `/5/2026-03-25` | ⚠️ Renders normally — **no warning that date is in the future** | P1 |
| 3 | Far future (15 months) | `/5/2027-06-15` | ⚠️ Renders normally — 15 months in the future, no guard | P1 |
| 4 | Past date with existing readings | `/5/2025-10-15` | ⚠️ Shows info box, but **raw markdown `**` not rendered** — displays `**Friday, October 15, 2025**` literally | P1 |
| 5 | Very old date (2020) | `/5/2020-01-01` | ❌ **500 Internal Error** — server crash, likely date parsing issue | P0 |
| 6 | Invalid date string | `/5/not-a-date` | ❌ **500 Internal Error** — raw error page, no graceful handling | P0 |
| 7 | Non-existent property ID | `/99999/2026-03-20` | ✅ Graceful error: "Property with slug '99999' not found" | OK |
| 8 | Non-numeric slug | `/foobar/2026-03-20` | ✅ Graceful error: "Property with slug 'foobar' not found" | OK |
| 9 | Property with no meters | `/24/2026-03-20` | ❌ **Blank page** — shows date + "rat" but NO empty state message, no guidance | P0 |
| 10 | Date with existing readings (Oct 31) | `/5/2025-10-31` | ⚠️ Shows info but markdown `**` not rendered, says "view or update below" but **no meters shown** | P1 |
| 11 | Empty slug | `//2026-03-20` | ✅ SvelteKit 404 — expected behavior | OK |
| 12 | Partial date (YYYY-MM) | `/5/2026-03` | ❌ **500 Internal Error** — no date format validation | P0 |
| 13 | Nav arrows on error page | (any error state) | ⚠️ Arrow URLs have **empty property ID**: `/utility-input/electricity//2026-03-19` | P2 |

### Edge Case Issues

#### EC-P0-1: Invalid/malformed dates crash the server (500)
**Scenarios**: 5, 6, 12
**Location**: `+page.server.ts` — No date format validation before `new Date(date)` is called
**Impact**: Any URL with a bad date (`not-a-date`, `2026-03`, `2020-01-01`) returns a raw 500 error page. Users who manually edit the URL or follow a broken link see an ugly crash.
**Fix**: Add early date validation in the load function:
```ts
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!date || !dateRegex.test(date) || isNaN(new Date(date).getTime())) {
  errorDetails.push('Invalid date format. Use YYYY-MM-DD.');
}
```

#### EC-P0-2: Property with no meters shows blank page
**Scenario**: 9
**Location**: `+page.svelte` — The `{#if meters.length > 0}` block inside the form renders nothing when meters is empty; the `{:else}` for "No active electricity meters" only triggers inside the form which itself is inside a condition checking for `meters.length > 0`.
**Impact**: User sees date header and property name but absolutely nothing below — no error, no guidance, no "add meters" link. Dead end.
**Fix**: Add an empty state outside the form:
```svelte
{#if data.meters.length === 0 && !data.errors?.length}
  <div class="text-center py-12 text-gray-500">
    <p class="text-lg font-medium">No electricity meters found</p>
    <p class="text-sm mt-1">This property has no active electricity meters configured.</p>
    <a href="/meters" class="text-blue-600 hover:underline text-sm mt-3 inline-block">Manage Meters →</a>
  </div>
{/if}
```

#### EC-P1-1: Future dates accepted with no warning
**Scenarios**: 2, 3
**Location**: `+page.server.ts` — No future date guard
**Impact**: A user could accidentally enter readings for next week or next year. The server accepts the submission without question. While there's a date navigation UI, nothing prevents typing `/2027-06-15` in the URL.
**Fix**: Add a warning (not a block) for dates > today:
```svelte
{#if new Date(data.date) > new Date()}
  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
    ⚠ This date is in the future. Readings will be saved for {formatShortDate(data.date)}.
  </div>
{/if}
```

#### EC-P1-2: Markdown not rendered in info/error messages
**Scenarios**: 4, 10
**Location**: `+page.svelte` — The error message parser handles `[link](url)` but NOT `**bold**` markdown. Server sends `**Friday, October 31, 2025**` which displays as literal asterisks.
**Impact**: Messages look broken — raw `**` around dates confuse users.
**Fix**: Either strip markdown formatting in the server response, or extend `parseErrorMessage()` to handle `**bold**` → `<strong>`.

#### EC-P1-3: "Existing Data Found" says "view or update below" but shows NO meters
**Scenario**: 10
**Location**: `+page.server.ts:127` — When existing readings are found, the server returns `meters: []` (empty array). The info message says "You can view or update the existing readings below" but there's nothing below.
**Impact**: Contradictory UX — the message promises content that doesn't exist.
**Fix**: Either (a) return the actual meters with their existing readings pre-filled for editing, or (b) change the message to "Navigate to the next available date" and remove the "view or update below" text.

#### EC-P2-1: Nav arrows have empty slug on error pages
**Scenario**: 13
**Location**: `+page.svelte` — `data.property?.id` is null on error pages, producing URLs like `/utility-input/electricity//2026-03-19`
**Fix**: Hide nav arrows when `data.property` is null, or disable them.

---

## v2 UXI Scorecard (Post-Fix)

| Dim | Name | Weight | v1 | v2 | Change | Evidence |
|-----|------|--------|----|----|--------|----------|
| D1 | Task Efficiency | 20% | 5.0 | 8.0 | +3.0 | Enter-key advances ✓. "Next →" jump-to-empty button ✓. Ctrl+Enter to save ✓. Auto-focus first input ✓. Still no pre-fill (meter readings are inherently manual data entry — nothing to pre-fill). |
| D2 | Scroll & Density | 15% | 4.0 | 8.5 | +4.5 | Compact date header saves ~130px. Collapsible floor sections reduce 7 screenfuls to ~2 when floors are collapsed. Cards are tighter (p-2.5 vs p-4). Sticky CTA always visible ✓. |
| D3 | Information Architecture | 15% | 6.5 | 8.5 | +2.0 | Zero redundancy. Previous values now use `toLocaleString()` for readability (98,842 vs 98842). Floor progress pills ("1/6", "0/8") provide scanning context. Card borders convey state (green=filled, amber=warning, red=error). |
| D4 | Input Quality | 15% | 7.0 | 9.0 | +2.0 | `inputmode="decimal"` ✓. Explicit `h-10 bg-gray-50 border rounded-md` — inputs are clearly tappable ✓. kWh suffix via flex layout (no clipping) ✓. Auto-focus ✓. Save min-h-[44px] ✓. Nav arrows 40×40 ✓. |
| D5 | Visual Hierarchy | 10% | 6.0 | 8.5 | +2.5 | Floor sections with collapsible headers and progress pills create clear grouping. Card state colors (green/amber/red borders) create instant visual differentiation. Consumption badges color-coded. `tabular-nums` on all values ✓. |
| D6 | Progressive Disclosure | 10% | 3.0 | 9.0 | +6.0 | Floor sections fully collapsible ✓. Completed floors collapse to one line ✓. High-consumption warning appears only when triggered, with "Verify ✓" dismiss button ✓. Empty fields show no error (not "required" on empty). "Fill at least 1" reason appears only when 0 filled. |
| D7 | Feedback & Safety | 15% | 7.5 | 9.0 | +1.5 | Submit disabled with visible reason ("Fill at least 1 reading") ✓. Spinner on submit ✓. High consumption = warning not error — "Verify ✓" button to dismiss ✓. Threshold scales by time gap ✓. Server has duplicate guard ✓. Loading bar during date navigation ✓. |

### v2 UXI Composite Score

```
UXI = (8.0 × 0.20) + (8.5 × 0.15) + (8.5 × 0.15) + (9.0 × 0.15) +
      (8.5 × 0.10) + (9.0 × 0.10) + (9.0 × 0.15)
    = 1.60 + 1.275 + 1.275 + 1.35 + 0.85 + 0.90 + 1.35
    = 8.60
```

**UXI: 8.60 — Grade A (Excellent)**

> Up from 5.65 (Grade D) → 8.60 (Grade A). The collapsible floor sections (+6.0 on D6) and compact date header (+4.5 on D2) were the biggest wins. The walking-the-building workflow is now practical: collapse completed floors, tap "Next →" to jump to the next empty meter.

### Remaining Gaps to 10.0

| Gap | Score Impact | Difficulty | Notes |
|-----|-------------|------------|-------|
| No pre-fill (D1 ceiling) | D1 capped at ~8 | N/A | Meter readings are inherently manual — there's nothing to pre-fill. This is a domain constraint, not a UX failure. |
| No auto-advance after typing (D1) | +0.5 D1 | Medium | Auto-submit value after typing + short delay would remove the Enter-key step |
| No rapid-entry table mode (D2) | +0.5 D2 | High | A table-like layout (one row per meter, tab between cells) would be faster for desktop power users |
| No dark mode (D5) | +0.5 D5 | Low | Hardcoded light theme colors |
| No undo after save (D7) | +0.5 D7 | High | Would need a "revert readings" server action |

---

## v1 Audit (Original — Pre-Fix)

> The original audit findings are preserved below for reference.

---

## UXI Scorecard

| Dim | Name | Weight | Score | Justification |
|-----|------|--------|-------|---------------|
| D1 | Task Efficiency | 20% | 5.0 | 14 fields with NO pre-fill, NO smart defaults, NO batch entry shortcuts. Every field requires manual data entry. No remembered preferences. Enter-key advances to next input (good), but no "copy previous + offset" or "auto-fill from recent" patterns. |
| D2 | Scroll & Density | 15% | 4.0 | 14 meters = ~7 screenfuls on mobile (375×812). No collapsible floor sections. No "skip filled" navigation. Date header wastes 180px of prime mobile real estate. Sticky CTA is present (good), but user must scroll through all 14 cards linearly. |
| D3 | Information Architecture | 15% | 6.5 | Each card shows: meter name, previous reading + date, current input + date, consumption delta. No redundancy. "Previous" label is clear. However, floor grouping headers ("2ND FLOOR (6 METERS)") are not collapsible — they're just visual labels with no interaction. Missing: which meters have already been read today (no "already submitted" indicator). |
| D4 | Input Quality | 15% | 7.0 | `inputmode="decimal"` on all fields ✓. `type="number"` with `step="0.01"` ✓. Enter-key navigation ✓. Auto-focus first input on mount ✓. However: input has NO explicit height class — uses transparent bg with `text-xl` which could vary. "kWh" unit label uses `absolute right-0 bottom-2` which clips on narrow widths. Save button has `min-h-[44px]` on mobile ✓. Previous/Next day arrows are `w-12 h-12` ✓. |
| D5 | Visual Hierarchy | 10% | 6.0 | Floor sections labeled with uppercase headers. Cards have consistent structure (previous | divider | current). Consumption badge is color-coded (green/amber/red) — good. However: date header is **disproportionately large** on mobile — `text-2xl` date + `text-xl` property name inside a bordered card with `px-16` padding takes up ~25% of the viewport. The 3-column grid on desktop works well. |
| D6 | Progressive Disclosure | 10% | 3.0 | NO progressive disclosure at all. All 14 meters are shown simultaneously. Floor groups are not collapsible. No "show only unfilled" toggle. No "skip to next floor" navigation. The high-consumption warning (>500 units) shows as an error message inline — good — but the "unusually high consumption" message blocks submission even if the reading is correct, with no override. |
| D7 | Feedback & Safety | 15% | 7.5 | Real-time consumption feedback ✓ (color-coded badge). Baseline validation ✓ (prevents readings below previous). Error messages are specific ✓ ("Must be >= 39,458"). Submit button shows "Saving..." text during submission ✓. Progress counter ("2 / 14 filled") updates live ✓. Toast messages on success/failure ✓. However: NO duplicate guard (can submit same readings twice). Submit button is NOT disabled when 0 fields filled — clicking shows toast "Please enter at least one valid reading" but button should be disabled with reason. |

### UXI Composite Score

```
UXI = (5.0 × 0.20) + (4.0 × 0.15) + (6.5 × 0.15) + (7.0 × 0.15) +
      (6.0 × 0.10) + (3.0 × 0.10) + (7.5 × 0.15)
    = 1.00 + 0.60 + 0.975 + 1.05 + 0.60 + 0.30 + 1.125
    = 5.65
```

**UXI: 5.65 — Grade D (Below average)**

> Users can complete the task but the 7-screenful scroll on mobile with zero shortcuts, no collapsible sections, and a massive date header creates significant friction for a data-entry-intensive workflow done while walking a building.

---

## Issues

### P0 — Critical (Blocks daily use)

#### P0-1: Date header wastes ~25% of mobile viewport
**Location**: `+page.svelte:332-377`
**Problem**: The date display uses `bg-white border-2 rounded-lg py-4 px-16` with `text-2xl` date and `text-xl` property name — occupying ~180px on a 812px viewport. Previous/Next nav arrows use `w-12 h-12` absolute-positioned circles that eat further horizontal space.
**Impact**: On a data-entry page where the user scrolls 7 screenfuls, losing 25% of the first screen to a decorative date header is wasteful. The user already knows the date — they navigated here deliberately.
**Fix**: Compact inline header: `Mar 20, 2026 · DA Tirol Dormitory` with `<` / `>` arrows inline, all on one line. Save ~130px of vertical space.

#### P0-2: 7 screenfuls on mobile with no shortcuts
**Location**: `+page.svelte:408-534`
**Problem**: 14 meter cards render linearly with no way to skip, collapse, or filter. The UX Bible §6.7 states: "Utility readings are entered in bulk — this is a data entry task." Walking the building, the user must scroll past already-filled meters to find the next empty one.
**Impact**: Each meter card is ~140px tall on mobile. 14 × 140 = 1960px of content + headers. With 812px viewport (minus nav + sticky bar), that's ~7 screenfuls. Research (NNGroup): only 26% of viewing time goes below the fold.
**Fix**: (1) Make floor sections collapsible. (2) Add "Jump to next empty" button in sticky bar. (3) Show a compact list of floor labels as quick-jump anchors at the top.

#### P0-3: High-consumption warning blocks submission with no override
**Location**: `+page.svelte:176-181`
**Problem**: The `validateField()` function sets `fieldErrors[fieldName]` when consumption > 500, which prevents form submission entirely (line 68: `if (hasErrors) { cancel(); return; }`). There is NO way to override this — the user cannot submit a correct reading that happens to be >500 units above baseline.
**Impact**: Meters that serve entire floors or common areas routinely have >500 unit differences between monthly readings. The "2nd Floor - Main" meter shows a previous reading of 98,842 — even a modest increase to 99,500 (658 units) would be blocked.
**Fix**: Change from error to warning. Show amber badge "⚠ High consumption — please verify" but do NOT block submission. Alternatively, add a "I've verified this reading" checkbox that appears when consumption > 500.

### P1 — High (Significant friction)

#### P1-1: No "already submitted" indicator for today
**Problem**: If readings were already submitted for this property/date, there's no visual indication. The user sees empty fields and might re-enter, causing duplicates.
**Fix**: Server load function should check for existing readings for the requested date. Show a banner: "Readings were already submitted at 10:30 AM" with option to view/edit.

#### P1-2: Submit button enabled when 0 fields filled
**Location**: `+page.svelte:518, 530`
**Problem**: The "Save Readings" button has `disabled={$submitting}` — only disabled during submission. Clicking with 0 filled fields shows a toast error. UX Bible §5 Must-have: "Submit disabled with visible reason text."
**Fix**: `disabled={$submitting || filledCount === 0}`. Show helper text "Fill at least 1 reading" when count is 0.

#### P1-3: Input has no explicit height, uses transparent bg
**Location**: `+page.svelte:191-200`
**Problem**: The input class is `bg-transparent border-none outline-none text-xl font-bold w-full rounded` — no border or background until error state. Users may not realize which area is tappable. The UX Bible §3 Height Standards specifies `h-10` (40px) for mobile text inputs.
**Fix**: Add `h-10 bg-gray-50 border border-gray-200 px-2 rounded-md` as base state. Keep the `ring-2 ring-red-500` error state. This also makes the input feel like an input.

#### P1-4: "kWh" unit label clips on narrow viewports
**Location**: `+page.svelte:497`
**Problem**: `<span class="text-xs text-gray-500 ml-1 absolute right-0 bottom-2">kWh</span>` — absolute positioning can overlap the input value for large numbers on narrow screens.
**Fix**: Use a flex layout with the unit as a non-overlapping suffix: `<div class="flex items-baseline gap-1"><input .../><span>kWh</span></div>`.

#### P1-5: No loading state when navigating between dates
**Problem**: Clicking Previous/Next day triggers a full page navigation (`<a>` link to new route). There's no loading indicator — the page goes blank while the server fetches meters + readings for the new date.
**Fix**: Add a top-bar progress indicator or use SvelteKit's `beforeNavigate`/`afterNavigate` for a loading skeleton.

### P2 — Medium (Noticeable friction)

#### P2-1: No batch entry mode
**Problem**: The UX Bible §6.7 says "Tab between fields, auto-advance on entry." While Enter-key advances, there's no "rapid entry" mode where typing a value + pressing Enter commits and advances. Users must manually tab to each field.
**Fix**: Consider a table-like layout for rapid entry: one column per meter, single row of inputs, Tab moves to next cell. This would reduce the page from 7 screenfuls to ~2.

#### P2-2: Previous reading date is stale (Oct 31, 2025)
**Problem**: All meters show "Oct 31, 2025" as the last reading — ~5 months ago. The consumption calculation (current - previous over 5 months) will produce large numbers that trigger the >500 warning for nearly every meter.
**Fix**: The >500 threshold should be proportional to the time gap. `500 / 30 * daysDiff` would be more appropriate. A 5-month gap allows ~2,500 units before warning.

#### P2-3: No dark mode support
**Problem**: Page uses hardcoded `bg-white`, `text-gray-900`, `border-gray-200` — no dark mode CSS variables or `dark:` classes.
**Fix**: Low priority but worth noting. Use `bg-background`, `text-foreground` from the design system.

#### P2-4: Console shows 73 errors during interaction
**Problem**: After filling 2 fields, the console showed 73 errors and 17 warnings. This suggests reactivity issues, possibly from the `$form` binding on 14 number inputs simultaneously.
**Fix**: Investigate console errors. Likely RxDB sync-related noise, but could indicate performance issues on low-end mobile devices.

### P3 — Low (Polish)

#### P3-1: "Enter reading" placeholder clips on mobile
**Problem**: The placeholder text "Enter reading" at `text-xl font-bold` is quite large. On narrow viewports, it can extend beyond the card boundary, especially when "kWh" is absolutely positioned nearby.
**Fix**: Shorten to "0" or "---" as placeholder, or reduce placeholder font size.

#### P3-2: Floor grouping doesn't indicate progress
**Problem**: The header "2ND FLOOR (6 METERS)" shows total meters but not how many are filled. Adding "2/6" would give at-a-glance progress per section.
**Fix**: Change to "2ND FLOOR (2/6 filled)" or use a progress bar under the header.

#### P3-3: Date nav arrows have empty slugs in URL
**Problem**: When the page first loads before server resolves the property, the Previous/Next links generate URLs like `/utility-input/electricity//2026-03-19` (empty slug). This was visible in the initial snapshot (e17 ref).
**Fix**: Use the resolved property ID in the links, or hide nav arrows until property loads.

#### P3-4: No keyboard shortcut to save
**Problem**: Desktop users cannot press Ctrl+Enter or Ctrl+S to save readings. Must click the button.
**Fix**: Add a global `keydown` listener for `Ctrl+Enter` that triggers form submit.

---

## Domain Pattern Compliance (UX Bible §6.7)

| Pattern | Status | Notes |
|---------|--------|-------|
| Tab between fields | ⚠ Partial | Enter-key advances; Tab works natively but focus order isn't guaranteed across the 3-column grid on desktop |
| Auto-advance on entry | ✗ Missing | No auto-advance after entering a value — must press Enter manually |
| Numpad keyboard | ✓ Present | `inputmode="decimal"` on all inputs |
| Flag readings below previous | ✓ Present | Red border + "Must be >= X" message + red consumption badge |
| Highlight outliers | ⚠ Blocks | >500 is flagged as ERROR not WARNING — blocks submission entirely (P0-3) |
| Large inputs for mobile | ⚠ Partial | Font is `text-xl` but input has no explicit height or background — hard to distinguish tappable area |
| Walking-the-building UX | ✗ Missing | No jump-to-next-empty, no floor quick-nav, no compact mode |

---

## Recommendations (Priority Order)

1. **P0-3**: Change >500 consumption from error to warning — this is the most impactful single fix because it unblocks legitimate readings
2. **P0-1**: Compact the date header — recovers 130px of mobile real estate
3. **P0-2**: Add collapsible floor sections + "Jump to next empty" — reduces the 7-screenful scroll problem
4. **P1-2**: Disable submit when 0 filled + show reason text
5. **P1-3**: Give inputs explicit height + visible background
6. **P2-1**: Consider a table-based rapid-entry layout for desktop power users
7. **P2-2**: Scale the consumption warning threshold by time gap

---

## Screenshots

| Viewport | Screenshot | Notes |
|----------|-----------|-------|
| Desktop 1440×900 | `audit-utility-input-desktop-1440.png` | 3-column grid, date header prominent |
| Desktop full page | `audit-utility-input-desktop-full.png` | All 14 meters visible, save button at bottom |
| Desktop with data | `audit-utility-input-desktop-filled.png` | Shows green (+158 used) and red (-39358 used) consumption feedback |
| Mobile 375×812 | `audit-utility-input-mobile-375.png` | Date header takes ~25% viewport, cards stack vertically |
| Mobile full page | `audit-utility-input-mobile-full.png` | ~7 screenfuls of content |
| Mobile with data | `audit-utility-input-mobile-filled.png` | Green consumption badge, sticky "1/14 filled" bar |
| Mobile negative reading | `audit-utility-input-mobile-negative.png` | Red border, -39358 badge, "Must be >= 39,458" error |
