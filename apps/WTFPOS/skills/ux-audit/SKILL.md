---
name: ux-audit
description: >
  Audits WTFPOS pages and flows for UX/UI quality using playwright-cli snapshots and a
  comprehensive design reference ("Design Bible"). Use this skill when the user asks for a
  "UX audit", "design review", "usability check", "layout assessment", "heuristic evaluation",
  "accessibility check", "does this page feel right", "is this easy to use", "check the layout",
  "review the flow", "audit this screen", or any request to evaluate a page's usability, visual
  hierarchy, cognitive load, motor efficiency, or consistency with the WTFPOS design system.
  Also triggers on "touch targets", "contrast ratio", "too many buttons", "feels cluttered",
  "hard to find", or "confusing layout". The output is a structured audit report with an ASCII
  layout map, principle-by-principle assessment, empathy narrative, and prioritized recommendations.
version: 1.0.0
---

# UX Audit — WTFPOS

This skill uses **playwright-cli snapshots** to audit any WTFPOS page or flow against the
Design Bible (`references/DESIGN_BIBLE.md`). The goal: assess layout, cognitive load, visual
hierarchy, motor efficiency, accessibility, and design system consistency — then produce
actionable, prioritized recommendations.

**North star:** The end user — a restaurant worker during a busy dinner rush — should have
the best experience possible, with zero friction.

## References

| Reference | Purpose |
|---|---|
| `references/DESIGN_BIBLE.md` | Complete UX/UI assessment framework (cognitive laws, heuristics, Gestalt, WCAG, POS patterns) |
| `.claude/skills/playwright-cli/SKILL.md` | playwright-cli commands for snapshots, navigation, interaction |
| `tailwind.config.js` | Design tokens (colors, radii, fonts) |
| `src/app.css` | Reusable CSS classes (`.pos-card`, `.btn-*`, `.badge-*`, `.pos-input`) |

---

## WTFPOS Design Context

These are the app-specific parameters to audit against:

### Touch & Interaction

| Parameter | Value | Source |
|---|---|---|
| Min touch target | 44px (`button`, `[role='button']`, `a`) | `app.css` base layer |
| Button min-height | 48px (`.btn` class) | `app.css` components |
| Device | 10-12" tablets, touch-first | PRD |
| Active scale | `active:scale-95` on all `.btn` | `app.css` |
| User select | Disabled on buttons (`.no-select`) | `app.css` |

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#EA580C` | Primary brand orange |
| `accent-dark` | `#C2410C` | Hover states |
| `accent-light` | `#FFF7ED` | Badges, soft backgrounds |
| `surface` | `#FFFFFF` | Cards, panels |
| `surface-secondary` | `#F9FAFB` | Page background |
| `border` | `#E5E7EB` | Borders, dividers |
| `status-green` | `#10B981` | Active, success, open |
| `status-yellow` | `#F59E0B` | Warning, pending |
| `status-red` | `#EF4444` | Danger, critical, overdue |
| `status-purple` | `#8B5CF6` | Owner/admin badges |
| `status-cyan` | `#06B6D4` | Info, Bluetooth |
| `foreground` | `#111827` | Default text |

### CSS Classes

| Class | Purpose |
|---|---|
| `.pos-card` | Rounded card (xl radius, white bg, border, p-4) |
| `.btn-primary` | Orange CTA button |
| `.btn-secondary` | White bordered button |
| `.btn-danger` | Red destructive button |
| `.btn-success` | Green confirmation button |
| `.btn-ghost` | Transparent hover button |
| `.badge-orange/green/yellow/red` | Status badges |
| `.pos-input` | Form input with focus ring |
| `.topbar` | DEPRECATED — do not expect on new pages |

### Layout Shell

```
SidebarProvider
+-- AppSidebar          (collapsible left rail / Sheet drawer)
+-- SidebarInset
    +-- MobileTopBar    (md:hidden, hamburger trigger)
    +-- LocationBanner  (always visible, all authenticated pages)
    +-- {children}      (page content)
```

### Roles & Their Primary Pages

| Role | Primary pages | Context |
|---|---|---|
| `staff` | `/pos` | Cashier during service — speed is everything |
| `kitchen` | `/kitchen/*` | Cook at grill station — glanceable, hands may be wet/greasy |
| `manager` | `/pos`, `/stock/*`, `/reports/*` | Oversees operations — needs cross-page efficiency |
| `owner` | All pages + `/admin/*` | Reviews data across branches — analytical lens |

---

## Audit Workflow

Follow these 8 steps in order:

### Step 1 — Define Scope

Before opening the browser, clarify with the user:
- **Page or flow** — Single page (e.g., `/pos`) or multi-step flow (e.g., "create order to checkout")?
- **Role** — Which role to log in as? (affects what's visible and what matters)
- **Branch** — Which location? (`tag`, `pgl`, `all`)
- **Viewport** — Default tablet `1024x768`, or specify mobile/desktop

### Step 2 — Open App

```bash
playwright-cli open http://localhost:5173
```

### Step 3 — Set Viewport

```bash
playwright-cli resize 1024 768
```

Use `1024 768` for tablet (default), `375 812` for mobile, `1440 900` for desktop.

### Step 4 — Login as Target Role

Navigate to `/`, select the role card, enter PIN if needed (manager PIN: `1234`), wait for redirect.

### Step 5 — Navigate & Snapshot

Navigate to the target page. Take a snapshot at each meaningful state:

```bash
playwright-cli snapshot
```

Name your states mentally: `initial`, `loaded`, `active`, `empty`, `error`, `completion`.

### Step 6 — Capture Interaction States

For interactive pages, trigger key states and snapshot each:
- **Empty state** — No data (e.g., no orders, empty inventory)
- **Loaded state** — Typical data volume
- **Active state** — Mid-interaction (e.g., order being built, modal open)
- **Error state** — Validation failure, network error
- **Completion state** — After successful action (e.g., order paid)

### Step 7 — Close & Produce Report

```bash
playwright-cli close
```

Now produce the audit report using the template below.

### Step 8 — Save Audit File

After producing the report, **always save it** to the audits folder:

```
skills/ux-audit/audits/YYYY-MM-DD_<page>-<role>-<branch>.md
```

**Naming convention:**
- Date: `YYYY-MM-DD`
- Page: route with slashes replaced by dashes (e.g., `pos`, `kitchen-orders`, `stock-transfers`)
- Role: `staff`, `kitchen`, `manager`, `owner`
- Branch: `altacitta`, `alonabeach`, `all`

Example: `2026-03-07_pos-staff-altacitta.md`

**After saving, your final response to the user must be:**
1. A "File saved" confirmation with the path
2. A **summarized version** of the assessment: verdict counts, the P0 items, and 2-3 sentence overall take

---

## Audit Output Template

Every audit report MUST include all four sections. Do not skip any.

### A. Text Layout Map

Create an ASCII art representation of the page layout. Show:
- Vertical space allocation (what takes how much room)
- Button positions and groupings
- The fold line (what's visible without scrolling at target viewport)
- Content zones and their relationships
- Touch target density hotspots

Example:
```
+--sidebar--+--------------------main-content--------------------+
| [nav]     | LocationBanner: [Alta Citta] [Change]              |
| [nav]     |---------------------------------------------------|
| [nav]     | +--floor-grid (70%)----------+ +--sidebar (30%)--+ |
| [nav]     | | [T1] [T2] [T3] [T4]       | | Order #1234     | |
| [nav]     | | [T5] [T6] [T7] [T8]       | | 3x Samgyup      | |
|           | |                            | | 2x Soju         | |
|           | |                            | |                 | |
|           | |          ~~fold~~           | | [Add Item]      | |
|           | |                            | | [Checkout]      | |
|           | +----------------------------+ +-----------------+ |
+--sidebar--+---------------------------------------------------+
```

### B. Principle-by-Principle Assessment

Evaluate each snapshot against these 14 principles. Use the Design Bible for detailed criteria.

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | PASS / CONCERN / FAIL | What you observed | What to change |
| 2 | **Miller's Law** (chunking) | | | |
| 3 | **Fitts's Law** (target size/distance) | | | |
| 4 | **Jakob's Law** (conventions) | | | |
| 5 | **Doherty Threshold** (response time) | | | |
| 6 | **Visibility of System Status** | | | |
| 7 | **Gestalt: Proximity** | | | |
| 8 | **Gestalt: Common Region** | | | |
| 9 | **Visual Hierarchy** (scale) | | | |
| 10 | **Visual Hierarchy** (contrast) | | | |
| 11 | **WCAG: Color Contrast** | | | |
| 12 | **WCAG: Touch Targets** | | | |
| 13 | **Consistency** (internal) | | | |
| 14 | **Consistency** (design system) | | | |

Verdicts:
- **PASS** — Meets or exceeds the principle's requirements
- **CONCERN** — Technically passes but could be improved; may cause friction under stress
- **FAIL** — Violates the principle; will cause errors or slowdowns during service

### C. "Best Day Ever" Vision

Write a short narrative (3-5 paragraphs) from the perspective of the target role user having a
perfect shift. Describe:
1. What the ideal experience looks like with this page/flow
2. How each interaction should feel (fast, confident, satisfying)
3. Where the current implementation gaps are relative to that ideal
4. What emotional state the user should be in at each step

This section grounds the technical assessment in empathy for the restaurant worker.

### D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact |
|---|---|---|---|---|
| **P0** | [User can't complete task or will make errors during service] | ... | S/M/L | High/Med/Low |
| **P1** | [Friction that slows down service but doesn't block] | ... | S/M/L | High/Med/Low |
| **P2** | [Polish that improves experience but isn't urgent] | ... | S/M/L | High/Med/Low |

- **P0** — Fix before next deployment. Service-blocking or error-causing.
- **P1** — Fix this sprint. Noticeable friction during busy shifts.
- **P2** — Backlog. Nice-to-have improvements.
- **Effort:** S = < 1 hour, M = 1-4 hours, L = 4+ hours
- **Impact:** High = affects every use, Med = affects common flows, Low = edge cases

---

## Human in the Loop Gates

### 1. Production URL Check

**Trigger:** User provides a URL that is not `localhost` or `127.0.0.1`.

**Action:** STOP and confirm:
- "This URL looks like a production/staging server. UX audits should run against the local dev server (`http://localhost:5173`). Should I proceed anyway, or switch to localhost?"

**Why:** Automated browser interaction against production could trigger rate limits, create test data, or affect real users.

### 2. Muscle Memory Disruption Warning

**Trigger:** Recommendations include layout changes to pages that staff use daily (specifically `/pos` floor plan, `/kitchen/orders` KDS queue, or checkout flow).

**Action:** Flag in the recommendations:
- "WARNING: This change affects a page used during every shift. Staff have built muscle memory for the current layout. Consider: (a) making the change between shifts, (b) keeping the same spatial positions for primary actions, (c) briefing staff before deployment."

**Why:** Moving a button that a cashier taps 200 times per shift can cause errors during the adjustment period.

---

## Auditable Pages Quick Reference

| Route | Primary Role | Audit Focus |
|---|---|---|
| `/` | All | Login speed, role selection clarity, error states |
| `/pos` | Staff | Floor plan readability, table status at a glance, order creation speed |
| `/pos` (order sidebar) | Staff | Item adding flow, quantity changes, checkout efficiency |
| `/kitchen/orders` | Kitchen | Ticket readability, status progression, glanceable from distance |
| `/kitchen/all-orders` | Kitchen | Order queue density, priority visibility |
| `/kitchen/weigh-station` | Kitchen | Scale reading clarity, weight-to-portion mapping |
| `/stock/*` | Manager | Inventory scanning, delivery receiving flow, count accuracy |
| `/stock/transfers` | Manager | Transfer creation, branch selection, confirmation |
| `/reports/*` | Owner | Data density, chart readability, date range selection |
| `/reports/branch-comparison` | Owner | Cross-branch comparison clarity, metric grouping |
| `/admin/users` | Admin | User CRUD efficiency, role assignment clarity |
| `/admin/floor-editor` | Admin | Element placement precision, preview accuracy |
| `/admin/devices` | Admin | Device pairing flow, connection status visibility |

---

## Self-Improvement Protocol

When the user corrects any finding from this skill:
1. **Update immediately** — Fix the incorrect assessment in your response
2. **Check DESIGN_BIBLE.md** — If the correction reveals a wrong principle interpretation, update the reference
3. **Check WTFPOS Design Context** — If design tokens, CSS classes, or layout shell have changed, update this SKILL.md
4. **New pages** — When a new route is added to WTFPOS, add it to the Auditable Pages table

When `tailwind.config.js` or `app.css` changes:
- Re-read the files and update the Color Tokens and CSS Classes tables above

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-03-07 | Initial skill creation |
