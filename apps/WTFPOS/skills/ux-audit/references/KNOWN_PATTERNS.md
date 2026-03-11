# Known Recurring UX Patterns

Digest of systemic issues found across 53 audit runs (2026-03-07 to 2026-03-10). When an audit
finds one of these patterns, reference this document to note it is a **known systemic issue**
rather than a one-off finding. This helps the fix-audit skill prioritize systemic fixes over
isolated patches.

Last updated: 2026-03-10 (based on 15 representative audits across all modules — kitchen KDS+weigh rush audit)

---

## KP-01 — Touch Target Violations (style="min-height: unset")

**Frequency:** 15/16 audits (systemic)
**Principle:** Fitts's Law + WCAG Touch Targets
**Root cause:** Inline `style="min-height: unset"` or Tailwind `min-h-[32px]` overrides on
buttons, explicitly bypassing the `app.css` base layer rule of `min-height: 44px`.
**Affected components:** CheckoutModal close (✕), discount buttons, VoidModal reasons, cash
preset chips, filter pills, KDS bump sub-buttons, QuickNumberInput steppers, pax change chip,
yield calculator close button, report toggle buttons, sub-nav tab links, **KdsHistoryModal close (✕),
RefuseReasonModal close (✕), BluetoothScaleStatus dropdown buttons (Open Simulator, preset weights,
Disconnect), kitchen/all-orders close buttons (lines 445 and 599)**.
**Fix pattern:** Remove inline style overrides. Use `py-2.5` + border to achieve ≥44px.
Kitchen/weigh-station targets should be ≥56px (see ENVIRONMENT.md).
**Status:** Recurring — each new modal or form tends to reintroduce the pattern.

---

## KP-02 — Low-Contrast Status Badges

**Frequency:** 10/12 audits (systemic)
**Principle:** WCAG Color Contrast (AA requires 4.5:1 for small text)
**Root cause:** Status badges use same-hue light-on-lighter combinations that fail AA.
**Worst offenders:**
- `text-status-green` (#10B981) on `bg-status-green-light` → 3.2:1 (FAIL)
- `text-amber-600` on `bg-amber-100` → 3.3:1 (FAIL)
- `text-blue-600` on `bg-blue-100` → 3.6:1 (FAIL)
- White text on `#F59E0B` yellow badge → 2.1:1 (CRITICAL FAIL)
**Fix pattern:** Darken text to `-700` or `-800` variants. E.g., `text-emerald-700` (#047857)
on `bg-emerald-50` → 6.8:1 (passes AAA).
**Environmental note:** In kitchen steam and dim dining lighting, even borderline-pass ratios
(4.5–5.0:1) become effectively unreadable. Target ≥5.5:1 for all WTFPOS badges.

---

## KP-03 — Silent Cross-Role Handoff Failures

**Frequency:** 7/12 audits
**Principle:** Visibility of System Status
**Root cause:** RxDB reactivity updates data but no explicit notification signals are sent
across roles for certain critical actions.
**Key gaps:**
- Staff voids an item → kitchen sees no signal, continues prepping
- Staff requests refill → kitchen cannot distinguish from new orders (same ticket)
- Kitchen refuses item → floor alert is dismissable, no persistent badge on table card
- Kitchen marks 86/sold-out → no KDS-side confirmation that staff was alerted
**Fix pattern:** Each cross-role action needs: (1) a persistent visual indicator on the
receiving role's primary screen, (2) a badge or marker that doesn't disappear until
acknowledged, (3) a distinct visual treatment from normal items (color, icon, position).

---

## KP-04 — Refill Items Not Visually Separated

**Frequency:** 6/12 audits
**Principle:** Gestalt Proximity + Visual Hierarchy
**Root cause:** Refill meats are appended to existing item lists with no group boundary, round
indicator, or visual separator.
**Where it appears:**
- OrderSidebar running bill — Round 2 meats below fold, no "Round 2" header
- KDS ticket — refill items inline with original order items
- AddItemModal — no context about which round this is
**Fix pattern:** Add a visible "Round N" separator/header in running bill and KDS ticket.
Use a subtle background tint or left-border to group refill items visually.

---

## KP-05 — No Success Confirmation After Critical Actions

**Frequency:** 6/12 audits
**Principle:** Visibility of System Status + Doherty Threshold
**Root cause:** Actions complete silently — no toast, no flash, no confirmation badge.
**Key gaps:**
- CHARGE order → no "Sent to kitchen" toast
- Save delivery → no "18kg received" confirmation
- Log waste → no feedback
- Save expense → raw error or nothing
- Stock adjustment → no confirmation
**Fix pattern:** Every write action that creates or modifies a record should produce a brief
(2–3 second) toast/banner confirming success. Include the key data point ("₱1,200 payment
recorded" not just "Success").

---

## KP-06 — Ghost UI (Interactive Controls With No Effect)

**Frequency:** 5/12 audits
**Principle:** Jakob's Law + Visibility of System Status
**Root cause:** Controls render and respond to clicks (state changes, visual feedback) but
produce zero change in displayed data — because the underlying functionality isn't implemented.
**Key examples:**
- Best Sellers "Today / This Week" toggle → changes button state, data unchanged
- Category default selector → resets on page load
- Some filter dropdowns → visually toggle but query doesn't filter
**Fix pattern:** If functionality is deferred: remove the control entirely, OR replace with a
static label ("Showing: All-Time") that communicates the limitation without false affordance.
Never render an interactive control that does nothing.

---

## KP-07 — Information Density Exceeding Miller's Law

**Frequency:** 7/12 audits
**Principle:** Miller's Law (7±2)
**Root cause:** Lists, navs, and data tables present 9+ ungrouped items at the same hierarchy.
**Key areas:**
- OrderSidebar with 9+ identical [REQUESTING] badges in sequence
- KDS ticket with 12+ items requiring scroll
- Reports sub-nav with 15+ tabs (mitigated by grouping, but still dense)
- Expense category picker with 11 ungrouped options
- AddItemModal with 50+ menu items (no search/filter)
**Fix pattern:** Group related items visually (Gestalt Common Region). Add collapse/expand
for long lists. Add search/typeahead for >10 items. Use progressive disclosure.

---

## KP-08 — "All Locations" Context Creates Dead UI

**Frequency:** 6/12 audits
**Principle:** Visibility of System Status + Jakob's Law
**Root cause:** When `session.locationId === 'all'`, certain branch-specific features disable
silently. Buttons appear available but do nothing, or data shows all-zeros.
**Key areas:**
- EOD button disabled with no explanation (compliance violation if accidentally triggered)
- Quick Actions greyed out with tooltip-only explanation
- Reports show ₱0.00 totals with no empty-state copy
- X-Read generation still available in ALL context (BIR compliance risk)
**Fix pattern:** In ALL context: (1) hide branch-specific actions entirely, or (2) show with
explicit "Select a branch first" overlay/message. Never show a greyed-out button without an
inline explanation visible at glance distance.

---

## KP-09 — Date/Time Format Inconsistency

**Frequency:** 8/12 audits
**Principle:** Internal Consistency
**Root cause:** No centralized date formatting utility. Each component formats dates
independently using different approaches (ISO, locale, custom).
**Variants seen in a single session:**
- `2026-03-09` (ISO) in expense and delivery logs
- `Mar 9, 2026` (human) in X-Read reports
- `03/09/2026` (browser locale) in date pickers
- `Today, 7:32 PM` (relative) in some timestamps
**Fix pattern:** Centralize all date formatting through a shared utility. Use consistent
Philippine-friendly format: `Mar 9, 2026` for dates, `7:32 PM` for times, `Mar 9, 7:32 PM`
for datetime. Never expose ISO format to end users.

---

## KP-10 — Empty States Without Context

**Frequency:** 7/12 audits
**Principle:** Visibility of System Status
**Root cause:** Pages load with all-zero numbers or empty lists with no explanatory copy.
**Key areas:**
- Sales Summary showing ₱0.00 totals (is this empty data or a filter issue?)
- Branch Comparison with zeros across all metrics
- Best Sellers "No meat sales data yet" with developer-facing copy that doesn't explain the
  actual data source (meat deductions, not orders)
**Fix pattern:** Every empty/zero state should include: (1) what the user is looking at,
(2) why it's empty (no data yet / wrong filter / wrong branch), (3) what action would
populate it. Developer-facing copy ("after tables are served and orders are closed") should
be rewritten in user-facing language.

---

## KP-11 — Scroll-Hidden Primary Actions

**Frequency:** 7/16 audits
**Principle:** Fitts's Law + Information Visibility
**Root cause:** Primary action buttons (All DONE, Complete, Submit) positioned below content
that may require 1–2 viewport scrolls to reach.
**Key areas:**
- KDS ticket with 12+ items — "All DONE" button unreachable without 1,700px scroll
- Running bill with refill items below fold — staff can't confirm refill without scrolling
- Long forms (delivery, stock count) with submit at bottom
- **CheckoutModal "Confirm Payment"** — hidden below fold on 1024×768 at every checkout
**Fix pattern:** Pin primary action buttons to viewport bottom (`sticky bottom-0`) or use a
floating action button. Critical actions must be reachable without scrolling regardless of
content length.

---

## KP-12 — Global Singleton State on Per-Card UI Controls

**Frequency:** 2/15 audits (active — confirmed in KDS+weigh rush audit 2026-03-10)
**Principle:** Gestalt Consistency + Jakob's Law (card = one entity)
**Root cause:** Module-level `$state` variables (section collapse toggles, inline confirmation dialogs) stored outside the `#each` loop, referenced inside it. User intends a card-local action but the state radiates globally to all other cards.
**Key examples:**
- `showDishes` in `kitchen/orders/+page.svelte` — toggling DISHES section on one ticket hides it on ALL active tickets
- `confirmingUnEighty6` in `kitchen/orders/+page.svelte` — inline restore confirmation renders on every ticket card where the same `menuItemName` appears
**At-risk pattern:** Any `let foo = $state(...)` at module level that is referenced inside an `{#each items}` loop to control per-item visual behavior.
**Fix pattern:** Move per-item state into `Map<string, T>` keyed by the loop item's unique ID (`orderId`, `itemId`). For boolean toggles: `Map<string, boolean>` with a default value. For string/null dialogs: `Map<string, string | null>`. This ensures card-local actions remain card-local regardless of how many items are in the list.
**Status:** Active — fix-audit should address both instances in `kitchen/orders/+page.svelte`.

---

## KP-13 — Station-Filtered KDS Template Missing Item Categories

**Frequency:** 1/15 audits (new — kitchen KDS+weigh rush audit 2026-03-10)
**Principle:** Visibility of System Status + Consistency
**Root cause:** The `groupItems()` helper in `kitchen/orders/+page.svelte` builds `meats`,
`dishes`, `service` groups. The template renders `grouped.dishes` (DISHES & DRINKS section)
and `grouped.service` (NEEDS section) but has NO template block rendering `grouped.meats`.
Meat items in KDS tickets are silently invisible on the legacy `/kitchen/orders` page.
**Where it appears:**
- `/kitchen/orders/+page.svelte` — meats group computed but not rendered
- May affect any future KDS sub-station views that derive from the same groupItems pattern
**Impact:** A kitchen worker on `/kitchen/orders` sees an incomplete ticket. If their station
handles meats (as opposed to stove-only), they have no KDS visibility for the meat items.
**Fix pattern:** Add a `{#if grouped.meats.length > 0}` template block analogous to the
DISHES section, rendering meats with the same ✓ checkmark + RETURN/86 actions. Alternatively,
if `/kitchen/orders` is intentionally a dishes-only view (the stove focus page), add a
prominent banner: "MEATS handled by Dispatch station — use /kitchen/dispatch for meat tickets".
**Status:** Active — document intent (dishes-only vs all-items) and either render or explain.

---

## How to Use This Document

**During audit:** When you find an issue that matches a KP-## pattern above, reference it:
> "This is an instance of **KP-01** (Touch Target Violations) — a systemic pattern found in
> 10 of 12 representative audits. See `references/KNOWN_PATTERNS.md`."

**During fix-audit:** Systemic patterns (KP-01, KP-02) benefit from project-wide fixes
(search-and-replace across all files) rather than per-component patches. Reference the
"Fix pattern" field for the recommended approach.

**Self-improvement:** After every audit run, check if a new finding matches an existing
pattern. If a pattern appears in ≥3 more audits, increase its frequency count. If a pattern
stops appearing after fixes, mark it as RESOLVED with the date.
