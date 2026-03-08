---
name: ux-audit
description: >
  Audits WTFPOS pages and flows for UX/UI quality using playwright-cli snapshots and a
  comprehensive design reference ("Design Bible"). Supports two modes: **single-user audit**
  (one role, one browser session) and **multi-user audit** (multiple roles in parallel browser
  sessions simulating real multi-device restaurant operations). Use this skill when the user
  asks for a "UX audit", "design review", "usability check", "layout assessment", "heuristic
  evaluation", "accessibility check", "does this page feel right", "is this easy to use",
  "check the layout", "review the flow", "audit this screen", or any request to evaluate a
  page's usability, visual hierarchy, cognitive load, motor efficiency, or consistency with the
  WTFPOS design system. Also triggers on "touch targets", "contrast ratio", "too many buttons",
  "feels cluttered", "hard to find", "confusing layout", "simulate kitchen and pos", "multi-device
  test", or "parallel role audit".
version: 3.0.0
---

# UX Audit — WTFPOS

This skill uses **playwright-cli snapshots** to audit any WTFPOS page or flow against the
Design Bible (`references/DESIGN_BIBLE.md`). It supports two audit modes:

- **Single-user audit** — One role, one browser session. Evaluates a page or flow in isolation.
- **Multi-user audit** — Multiple roles in parallel browser sessions. Simulates real restaurant
  operations where POS staff, kitchen crew, and managers interact with the system simultaneously,
  testing cross-role data flow and UX coordination.

**North star:** The end user — a restaurant worker during a busy dinner rush — should have
the best experience possible, with zero friction. In multi-user mode, we also evaluate how
well the system communicates **between** roles in real time.

## References

| Reference | Purpose |
|---|---|
| `references/DESIGN_BIBLE.md` | Complete UX/UI assessment framework (cognitive laws, heuristics, Gestalt, WCAG, POS patterns) |
| `.claude/skills/playwright-cli/SKILL.md` | playwright-cli commands for snapshots, navigation, interaction |
| `tailwind.config.js` | Design tokens (colors, radii, fonts) |
| `src/app.css` | Reusable CSS classes (`.pos-card`, `.btn-*`, `.badge-*`, `.pos-input`) |

---

## IMPORTANT: Use `snapshot`, NOT `screenshot`

**When running playwright-cli during any audit, ALWAYS use `snapshot` instead of `screenshot`.**

```bash
# ✅ CORRECT — returns structured accessibility tree with element refs
playwright-cli snapshot

# ❌ WRONG — returns a pixel image, wastes tokens, no element refs
playwright-cli screenshot
```

**Why this matters:**

- `snapshot` returns a **structured accessibility tree** with clickable element references (`e1`, `e2`, …). This is what you need to evaluate touch targets, button labels, hierarchy, grouping, and WCAG compliance — all the things a UX audit cares about.
- `screenshot` returns a **pixel image**. It burns multimodal tokens, provides no element refs for interaction, and gives you far less actionable data for UX assessment.
- After taking a `snapshot`, you can interact with any element by its ref (e.g., `playwright-cli click e3`). Screenshots give you nothing to interact with.

**The only valid use of `screenshot`** is for a final visual proof image attached to the audit report — and even then, `snapshot` should come first. If you need a visual, take the snapshot first, then optionally take a screenshot for documentation.

**Rule: Every state you evaluate during an audit MUST be captured with `snapshot`. No exceptions.**

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

## Agent Performance Rules (Multi-User)

These rules apply to **every agent** launched in a multi-user audit. They minimize tool call
waste, prevent data loss from agent crashes, and maximize useful output per agent.

### Rule 1 — Pre-Bake Auth (Skip Login UI)

Agents inject `sessionStorage` directly instead of navigating the login UI.
This saves 4–8 tool calls per agent and eliminates "Username not found" failures
with fictional personas.

```bash
# Step 1: Inject session BEFORE navigating to any authenticated page
playwright-cli eval "sessionStorage.setItem('wtfpos_session', JSON.stringify({userName:'Ate Rose', role:'staff', locationId:'tag', isLocked:true}))"

# Step 2: Navigate directly to the role's primary page
playwright-cli navigate http://localhost:5173/pos
```

**Session payloads per role:**

| Role | userName | role | locationId | isLocked | Primary page |
|------|----------|------|------------|----------|-------------|
| Staff | Ate Rose | `staff` | `tag` | `true` | `/pos` |
| Kitchen | Kuya Marc | `kitchen` | `tag` | `true` | `/kitchen/orders` |
| Manager | Sir Dan | `manager` | `tag` | `false` | `/pos` |
| Owner | Boss Chris | `owner` | `all` | `false` | `/pos` |

> **Why `isLocked`?** Staff and kitchen roles cannot switch locations (`isLocked: true`).
> Manager and owner are elevated roles that can switch freely (`isLocked: false`).

### Rule 2 — Hard Snapshot Budget (max 10 per agent)

Each agent is limited to **10 snapshots max**. Snapshot only when:
- Entering a new page for the first time
- A modal or overlay opens
- Something unexpected happens (error, wrong state, missing element)
- A `[HANDOFF]` point requires verification

Do **NOT** snapshot after: clicking a nav link you've used before, filling a form field,
or re-entering a page you've already captured.

### Rule 3 — Micro-Audit Steps (5–7 per agent)

Each agent should have **5–7 focused steps**, not 10–12 broad steps. If a role needs
more coverage, split into 2 focused agents running in parallel:

```
❌ Bad:   1 agent × 12 steps = ~200 tool calls, high failure risk
✅ Good:  2 agents × 6 steps = ~80 tool calls each, low failure risk
```

Split examples:
- `Staff-A`: table open → package select → add items (5 steps)
- `Staff-B`: checkout → receipt → order history (5 steps)

### Rule 4 — Write-As-You-Go

Agents must **write partial results to their output file after each completed step**.
If the agent dies at step 5, steps 1–4 are preserved.

```
After step B1: append "B1: PASS — ..." to file
After step B2: append "B2: CONCERN — ..." to file
...
After final step: write complete report with Key Findings section
```

Use the `Write` tool to create the file after step 1, then `Edit` to append after
each subsequent step. This ensures zero data loss on crash.

### Rule 5 — Skip Snapshots for Known Navigation

These elements are stable across all authenticated pages — agents can interact
with them without taking a snapshot first:

| Element | Location | How to reach |
|---------|----------|-------------|
| LocationBanner | Top of every page, inside `SidebarInset` | Always visible |
| Sidebar nav links | Left rail (desktop) or Sheet drawer (mobile) | Always visible on desktop |
| Login role cards | `/` login page | Always visible |
| Location switcher | Inside LocationBanner → "Change Location" button | Always 2 clicks |

When navigating to a known page via URL (e.g., `playwright-cli navigate http://localhost:5173/reports/eod`),
skip the intermediate snapshot — navigate first, then snapshot the destination.

---

## Audit Workflow

### Step 1 — Select Audit Mode (MANDATORY FIRST STEP)

**Before anything else**, ask the user:

> **What type of audit do you want?**
>
> 1. **Single-user audit** — Evaluate one role's experience on a page or flow (e.g., "staff using `/pos`")
> 2. **Multi-user audit** — Simulate multiple roles interacting simultaneously across the system (e.g., "staff takes order on POS while kitchen handles tickets on KDS")

**This is a Human in the Loop gate.** Do NOT proceed until the user selects a mode.

Based on the selection, follow either **Path A** (single-user) or **Path B** (multi-user) below.

---

### Path A — Single-User Audit

Follow these 7 steps in order.

#### A1 — Define Scope

Clarify with the user:
- **Page or flow** — Single page (e.g., `/pos`) or multi-step flow (e.g., "create order to checkout")?
- **Role** — Which role to log in as? (affects what's visible and what matters)
- **Branch** — Which location? (`tag`, `pgl`, `all`)
- **Viewport** — Default tablet `1024x768`, or specify mobile/desktop

#### A2 — Open App

Before opening the browser, snapshot the exact list of files already in `.playwright-cli/`. This is the baseline — cleanup will only delete files **not in this list**:

```bash
mkdir -p .playwright-cli/
ls .playwright-cli/ 2>/dev/null | sort > /tmp/ux-audit-before-$$
```

Then open the browser:

```bash
playwright-cli open http://localhost:5173
```

#### A3 — Set Viewport

```bash
playwright-cli resize 1024 768
```

Use `1024 768` for tablet (default), `375 812` for mobile, `1440 900` for desktop.

#### A4 — Login as Target Role

Navigate to `/`, select the role card, enter PIN if needed (manager PIN: `1234`), wait for redirect.

#### A5 — Navigate & Snapshot

Navigate to the target page. Take a **snapshot** (NOT screenshot) at each meaningful state:

```bash
# ✅ Always use snapshot — gives you the accessibility tree + element refs
playwright-cli snapshot

# ❌ Never use screenshot for evaluation — use snapshot instead
```

Name your states mentally: `initial`, `loaded`, `active`, `empty`, `error`, `completion`.

#### A6 — Capture Interaction States

For interactive pages, trigger key states and snapshot each:
- **Empty state** — No data (e.g., no orders, empty inventory)
- **Loaded state** — Typical data volume
- **Active state** — Mid-interaction (e.g., order being built, modal open)
- **Error state** — Validation failure, network error
- **Completion state** — After successful action (e.g., order paid)

#### A7 — Close, Clean Up & Save

```bash
playwright-cli close
```

**Immediately after closing, delete only the files THIS session created:**

```bash
comm -13 /tmp/ux-audit-before-$$ <(ls .playwright-cli/ 2>/dev/null | sort) \
  | grep -E '\.(yml|png)$' \
  | xargs -I{} rm -f ".playwright-cli/{}"
rm /tmp/ux-audit-before-$$
```

**Why this pattern is safe for concurrent agents:**
- `$$` is the shell PID — unique per process, so two concurrent audit sessions never share a before-list file
- `comm -13` computes the exact diff: files in the current directory that were **not** in the before-snapshot. Only those files are candidates for deletion.
- `grep -E '\.(yml|png)$'` is a type-gate — even if the diff accidentally included an unexpected file, only known playwright-cli artifact types are deleted
- Files that existed before this session started (from other running agents, previous sessions, or anything else) are in the before-list and will **never** be deleted
- The `.playwright-cli/` directory itself is preserved
- No time-based logic — this is an exact filename set diff, not a timestamp approximation

Produce the audit report using the **Single-User Output Template** below. Save to:

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
2. **Full issue breakdown** — list EVERY finding from the audit, grouped by priority. Do not summarise or drop items. Format:

```
P0 — MUST FIX (service-blocking)
  [P0-1] <Issue title> — <one-line description> [Effort: S/M/L]
  [P0-2] ...

P1 — FIX THIS SPRINT (friction)
  [P1-1] <Issue title> — <one-line description> [Effort: S/M/L]
  ...

P2 — BACKLOG (polish)
  [P2-1] <Issue title> — <one-line description> [Effort: S/M/L]
  ...
```

3. **Overall recommendation** — A single, opinionated sentence that answers: "Is this flow ready for service?" Examples:
   - "This flow is **not ready for service** — P0-1 and P0-2 will cause errors during every shift."
   - "This flow is **ready for service with one caveat** — P0-1 should be addressed before the next busy weekend."
   - "This flow is **production-ready** — no blocking issues, P1 items are improvement-only."

4. **HITL: Fix Selection Gate** — After presenting the full breakdown and recommendation, STOP and ask:

   > **Which of these would you like me to fix right now?**
   > Reply with the issue codes (e.g. "P0-1, P0-2, P1-1") or say "all P0s", "everything", or "none / just the report".

   Wait for the user's reply. Then:
   - If user selects items → implement the fixes immediately in the codebase, following all WTFPOS coding conventions (Svelte 5 runes, `incrementalPatch`, `nanoid`, location-scoped, `pnpm check` after each file)
   - If user says "none" or "just the report" → stop and leave the report as the deliverable

---

### Path B — Multi-User Audit

Simulates real restaurant operations with **parallel agents** controlling separate browser sessions.
Each agent logs in as a different role and performs actions that affect the other agents' views.

**There are no pre-built scenarios.** Every multi-user audit dynamically generates scenarios
based on the user's preferences, the roles selected, and the intensity level chosen.

#### B1 — Gather Preferences (HITL)

Ask the user these questions **before generating any scenarios**:

**Required:**
1. **Roles involved** — Which roles participate? (e.g., `staff` + `kitchen`, or `staff` + `kitchen` + `manager`)
2. **Branch** — Which location? All agents operate on the same branch (e.g., `tag`)
3. **Intensity level** — How thorough should the simulation be?

| Level | Scenarios | Depth | Best for |
|---|---|---|---|
| **Light** | Up to 5 | Quick pass — covers core happy paths | Smoke testing, quick health checks, verifying a specific fix |
| **Heavy** | 6–10 | Thorough — includes edge cases, error paths, concurrent pressure | Sprint-end validation, pre-deployment QA |
| **Extreme** | 10–15 | Full service simulation — multiple overlapping orders, refills, voids, takeouts, kitchen pressure | Major release validation, first-time UX audit, investor demos |

**Optional (ask if not obvious from context):**
4. **Focus areas** — Any specific flows to emphasize? (e.g., "refills are buggy", "checkout feels slow", "kitchen can't keep up with tickets")
5. **Viewport per role** — Default: tablet `1024x768` for all. Can differ per role.
6. **Include chaos?** — Should scenarios include error/edge cases like refused items, voids, network hiccups, or just happy paths?

#### B2 — Generate Scenario Script

Based on the user's preferences, **dynamically generate** the scenario script. This is the
creative step — you are a scenario architect, not a template runner.

**Scenario generation rules:**

1. **Read the codebase first** — Before generating scenarios, read the relevant store files,
   components, and routes for the selected roles. Understand what actions are actually possible
   in the current build (don't script interactions that don't exist yet).

2. **Think like the roles** — A staff member during a Friday night rush doesn't methodically
   test features. They slam through orders, juggle multiple tables, handle walk-ins and call-in
   takeouts simultaneously. Kitchen is drowning in tickets. Generate scenarios that reflect this
   reality.

3. **Vary the scenarios** — Each scenario should test a different aspect:
   - Different order types (dine-in AYCE, dine-in à la carte, takeout)
   - Different pax counts (solo, couple, large group of 8+)
   - Different payment methods (cash, GCash, Maya, split bill)
   - Different package types (Pork, Beef, Premium, Mix)
   - Time pressure (multiple tables opening within seconds of each other)
   - Interruptions (refill mid-checkout, void mid-service, kitchen refuse mid-order)
   - Edge cases (last table available, all tables occupied, 0 stock on popular item)

4. **Order scenarios by escalation** — Start simple, build complexity:
   - Scenarios 1-2: Single table, clean happy path
   - Scenarios 3-5: Multiple tables, overlapping actions
   - Scenarios 6-8: Edge cases, error paths, interruptions
   - Scenarios 9-12: Full pressure — concurrent everything
   - Scenarios 13-15: Chaos — everything that can go wrong does

5. **Each scenario is a mini-story** — Not just "open table, add item." Give it a name,
   a context, and a reason why this scenario matters for UX:

   ```
   Scenario 3: "The Impatient Group"
   Context: A group of 6 walks in during peak hour. They're hungry and want to order fast.
   Tests: Pax entry speed, package selection for large group, kitchen queue priority.
   ```

6. **Map cross-role handoff points** — For each scenario, explicitly mark where one role's
   action should trigger a visible change for another role. These are the critical UX moments:

   ```
   [HANDOFF] Staff sends order → Kitchen sees ticket (expect: <2s, clearly visible)
   [HANDOFF] Kitchen bumps meat → Staff sees "served" badge (expect: instant, green badge)
   ```

#### B3 — Present Script for Approval (HITL)

**Before launching any agents**, present the generated scenario script to the user:

- Show all scenarios as a numbered list with names, context, and key actions
- Show the cross-role handoff points
- Show the estimated agent count and parallel session count
- Ask: "Does this script look right? Want to add, remove, or modify any scenarios?"

**Do NOT proceed until the user approves the script.** This is a Human in the Loop gate.

The user may:
- Approve as-is → proceed to B4
- Request additions → regenerate and re-present
- Request removals → trim and re-present
- Request modifications → adjust and re-present

#### B4 — Agent Architecture

**Before launching any agents**, snapshot the exact list of files already in `.playwright-cli/`. This is the orchestrator's baseline — cleanup will only delete files not in this list:

```bash
mkdir -p .playwright-cli/
ls .playwright-cli/ 2>/dev/null | sort > /tmp/ux-audit-before-$$
```

Each role gets its own **parallel Agent** with its own playwright-cli browser session.
Agents are launched using the `Agent` tool with **parallel calls in a single message**.

> **IMPORTANT:** All agents MUST follow the **Agent Performance Rules** section above.
> Include those rules in every agent prompt. Key rules: pre-bake auth via sessionStorage
> injection, max 10 snapshots, 5–7 steps per agent, write-as-you-go, skip known nav.

**Micro-audit splitting:** If a role has more than 7 steps in the approved script,
split it into 2 focused agents (e.g., `Staff-A: table flow`, `Staff-B: checkout flow`).
Both agents run in parallel.

**How it works:**

```
┌─────────────────────────────────────────────────────┐
│                  MAIN ORCHESTRATOR                   │
│  (generates script, launches agents, synthesizes)    │
└──────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │
 ┌─────▼────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐
 │ Staff-A  │ │Staff-B │ │ KDS    │ │Manager │
 │ tables   │ │checkout│ │kitchen │ │reports │
 │ 5 steps  │ │5 steps │ │6 steps │ │6 steps │
 └─────┬────┘ └──┬─────┘ └──┬─────┘ └──┬─────┘
       │         │          │          │
       └─────────┴─────┬────┴──────────┘
                       │
               ┌───────▼───────┐
               │  Shared RxDB  │
               │  (IndexedDB)  │
               └───────────────┘
```

**Shared state mechanism:** All browser sessions on `localhost:5173` share the same
IndexedDB database (same origin). When POS Agent creates an order + KDS ticket,
Kitchen Agent sees it reactively via RxDB subscriptions. This accurately simulates
Phase 1 same-device data flow.

**Auth injection (mandatory — replaces login UI):**

Each agent's first two commands must be:
```bash
playwright-cli open http://localhost:5173
playwright-cli eval "sessionStorage.setItem('wtfpos_session', JSON.stringify({userName:'ROLE_NAME', role:'ROLE', locationId:'LOC', isLocked:LOCKED}))"
playwright-cli navigate http://localhost:5173/TARGET_PAGE
```

See **Rule 1** in Agent Performance Rules for the exact session payloads per role.

#### B5 — Build Agent Prompts

Each agent receives a detailed prompt built from the approved scenario script.
**Every agent prompt MUST include** the 5 Agent Performance Rules verbatim.

**Prompt structure per agent:**

1. **Role identity** — Who they are, which branch, what their shift looks like
2. **Auth injection commands** — The exact 3 playwright-cli commands to inject session
   and navigate to the target page (from Rule 1). No login UI.
3. **Steps (5–7 max)** — Only this agent's steps from the approved script. If the role
   had more than 7 steps, this agent gets half of them.
4. **Snapshot budget** — "You have 10 snapshots max. Use them wisely."
5. **Write-as-you-go instruction** — "After each completed step, append your finding to
   the output file. Use Write for the first step, Edit/append for subsequent steps."
6. **Audit lens** — What to evaluate from this role's perspective:
   - Staff: speed, clarity, error prevention, touch target sizing
   - Kitchen: glanceability, ticket priority, bump efficiency, hands-may-be-greasy ergonomics
   - Manager: oversight visibility, cross-page navigation efficiency, data accuracy
   - Owner: cross-branch overview quality, admin access, data aggregation accuracy
7. **Synchronization cues** — What to wait for at each [HANDOFF] point (use `waitForTimeout`
   or snapshot-and-check patterns). Include generous pauses (3-5s) at handoff points.
8. **Output format** — Return a structured mini-report:
   - Per-step: PASS/CONCERN/FAIL + one-line observation
   - Key Findings: bullet list with P0/P1/P2 severity
   - Role-specific assessment section (e.g., "Bump Undo Toast Assessment" for kitchen)
9. **Output file path** — Where to save the partial audit file

#### B6 — Launch Parallel Agents

Launch all agents **in a single message** using parallel `Agent` tool calls.

**Agent count guidelines:**

| Roles requested | Steps per role | Total agents |
|----------------|---------------|-------------|
| 2 roles × ≤7 steps each | ≤7 | 2 agents |
| 3 roles × ≤7 steps each | ≤7 | 3 agents |
| 4 roles × ≤7 steps each | ≤7 | 4 agents |
| Any role × 8+ steps | Split → 2 agents | +1 agent per split |
| 4 roles × 10+ steps each | Split all | 8 agents |

**Timing coordination:**
- Agents don't directly communicate with each other
- Coordination happens through **shared data** — Agent 1 creates data, Agent 2 observes it
- Use `waitForTimeout` in playwright-cli to allow data propagation between roles
- Each agent should include pauses (3-5 seconds) at synchronization points

**Execution order within each agent:**
1. Open browser, inject sessionStorage (Rule 1), navigate to primary page
2. Run steps in order (1, 2, 3...) — max 7 steps
3. Snapshot at key state changes — max 10 snapshots (Rule 2)
4. Write findings after each step (Rule 4)
5. At [HANDOFF] points, pause and check for expected data from other agent
6. After all steps, write final Key Findings section and close browser
7. Return structured report

#### B7 — Collect & Synthesize

After all agents return their individual reports:

1. **Combine layout maps** — Show each role's view side-by-side
2. **Cross-role interaction assessment** — Section E (see Multi-User Output Template)
3. **Per-role principle assessment** — Standard 14-principle table for each role
4. **Unified recommendations** — Merge and de-duplicate across roles, flag cross-role issues
5. **"Best Shift Ever" vision** — Multi-perspective narrative covering all roles in the scenario
6. **Scenario scorecard** — Per-scenario pass/fail summary

#### B8 — Clean Up & Save Multi-User Audit File

**After all agents have returned their reports**, delete only the files this session created:

```bash
comm -13 /tmp/ux-audit-before-$$ <(ls .playwright-cli/ 2>/dev/null | sort) \
  | grep -E '\.(yml|png)$' \
  | xargs -I{} rm -f ".playwright-cli/{}"
rm /tmp/ux-audit-before-$$
```

**Critical rules for multi-user cleanup:**
- The before-snapshot was taken at B4 (before any agent launched), so the diff covers everything all parallel sub-agents generated
- Individual sub-agents do **NOT** run their own cleanup — only the orchestrator runs cleanup, and only after all agents have returned. This prevents an early-finishing agent from deleting files a still-running agent is actively writing.
- The `grep -E '\.(yml|png)$'` type-gate means even a diff collision with an unrelated concurrent playwright-cli process won't delete anything unexpected
- Any other running playwright-cli sessions (from unrelated tasks) that started before B4 are protected by the before-snapshot; sessions that started after B4 but are still running when cleanup executes are protected by the `.yml|.png` gate since their files would already be in-use and were created concurrently — in practice this window is tiny (milliseconds between agent completion and cleanup)

Save to:

```
skills/ux-audit/audits/YYYY-MM-DD_<intensity>-multi-<branch>.md
```

**Naming convention:**
- Date: `YYYY-MM-DD`
- Intensity: `light`, `heavy`, or `extreme`
- `multi` marker to distinguish from single-user audits
- Branch: `altacitta`, `alonabeach`

Example: `2026-03-08_heavy-multi-altacitta.md`

**After saving, your final response to the user must be:**

1. A "File saved" confirmation with the path
2. **Scenario scorecard** — per-scenario pass/fail (from Section G)
3. **Per-role verdict summary** — PASS/CONCERN/FAIL counts per role
4. **Cross-role interaction score** — summary of handoff quality
5. **Full issue breakdown** — list EVERY finding across all roles, grouped by priority. Do not summarise or drop items. Format:

```
P0 — MUST FIX (service-blocking)
  [P0-1] <Role(s)> · <Issue title> — <one-line description> [Effort: S/M/L]
  [P0-2] ...

P1 — FIX THIS SPRINT (friction)
  [P1-1] <Role(s)> · <Issue title> — <one-line description> [Effort: S/M/L]
  ...

P2 — BACKLOG (polish)
  [P2-1] <Role(s)> · <Issue title> — <one-line description> [Effort: S/M/L]
  ...
```

6. **Overall recommendation** — A single, opinionated sentence that answers: "Is this multi-user flow ready for a real service shift?" Examples:
   - "This multi-user flow is **not ready for service** — kitchen rejections are invisible to staff (P0-1) and will cause incorrect orders on every shift."
   - "This multi-user flow is **ready for service** — handoffs work, data flows correctly, P1 items are friction-only."

7. **HITL: Fix Selection Gate** — After presenting everything, STOP and ask:

   > **Which of these would you like me to fix right now?**
   > Reply with the issue codes (e.g. "P0-1, P1-2") or say "all P0s", "everything", or "none / just the report".

   Wait for the user's reply. Then:
   - If user selects items → implement the fixes immediately in the codebase, following all WTFPOS coding conventions (Svelte 5 runes, `incrementalPatch`, `nanoid`, location-scoped, `pnpm check` after each file)
   - If user says "none" or "just the report" → stop and leave the report as the deliverable

---

## Audit Output Templates

### Single-User Output Template

Every single-user audit report MUST include all four sections. Do not skip any.

#### A. Text Layout Map

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

#### B. Principle-by-Principle Assessment

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

#### C. "Best Day Ever" Vision

Write a short narrative (3-5 paragraphs) from the perspective of the target role user having a
perfect shift. Describe:
1. What the ideal experience looks like with this page/flow
2. How each interaction should feel (fast, confident, satisfying)
3. Where the current implementation gaps are relative to that ideal
4. What emotional state the user should be in at each step

This section grounds the technical assessment in empathy for the restaurant worker.

#### D. Prioritized Recommendations

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

### Multi-User Output Template

Multi-user audits include the single-user template sections (A–D) **per role**, plus
these additional sections that evaluate cross-role interaction quality.

#### E. Cross-Role Interaction Assessment

This section is **unique to multi-user audits**. It evaluates how well data and status flow
between roles during the scenario.

| # | Interaction Point | Source Role | Target Role | Latency | Visibility | Verdict |
|---|---|---|---|---|---|---|
| 1 | Order created → KDS ticket appears | Staff (POS) | Kitchen (KDS) | Instant / Delayed / Failed | Clear / Subtle / Missing | PASS / CONCERN / FAIL |
| 2 | Kitchen bumps ticket → POS order status updates | Kitchen (KDS) | Staff (POS) | ... | ... | ... |
| 3 | Kitchen refuses item → POS alert appears | Kitchen (KDS) | Staff (POS) | ... | ... | ... |
| 4 | ... | ... | ... | ... | ... | ... |

**Evaluation criteria:**
- **Latency** — How quickly does the receiving role see the change? (Instant = <1s, Delayed = 1-5s, Failed = never appeared)
- **Visibility** — When the change arrives, how obvious is it? (Clear = impossible to miss, Subtle = easy to overlook, Missing = not shown)
- **Verdict** — PASS (instant + clear), CONCERN (delayed or subtle), FAIL (failed or missing)

#### F. "Best Shift Ever" Vision (Multi-Role)

Same as Section C but written from **multiple perspectives** woven into a single narrative.
Follow the scenario chronologically, switching between role perspectives as they interact:

1. Staff opens the table and starts the order...
2. Meanwhile, in the kitchen, the ticket appears on the KDS...
3. The kitchen bumps the meat, and back at the register, the staff sees...
4. The manager glances at the reports screen and notices...

This narrative should highlight **handoff moments** — the points where one role's action
triggers a visible change for another role. These handoffs are where multi-device UX
succeeds or fails.

#### G. Scenario Scorecard

Unique to multi-user audits. Summarizes each generated scenario's outcome:

| # | Scenario Name | Completed? | Handoffs OK? | Friction Points | Verdict |
|---|---|---|---|---|---|
| 1 | "First Table of the Night" | Yes / Partial / Blocked | 3/3 | 0 | PASS |
| 2 | "The Impatient Group" | ... | 2/4 | 2 | CONCERN |
| ... | ... | ... | ... | ... | ... |

#### H. Multi-User Specific Recommendations

In addition to per-role recommendations (Section D), add cross-role recommendations:

| Priority | Cross-Role Issue | Roles Affected | Fix | Effort | Impact |
|---|---|---|---|---|---|
| **P0** | [Data doesn't flow between roles] | Staff ↔ Kitchen | ... | S/M/L | High/Med/Low |
| **P1** | [Status update is delayed or not obvious] | ... | ... | S/M/L | High/Med/Low |
| **P2** | [Could improve coordination UX] | ... | ... | S/M/L | High/Med/Low |

---

## Human in the Loop Gates

### 1. Audit Mode Selection (FIRST GATE)

**Trigger:** Every time the ux-audit skill is invoked.

**Action:** STOP and ask before doing anything else:
- "What type of audit do you want?"
  - **Single-user audit** — One role, one browser session. Evaluates a page or flow in isolation.
  - **Multi-user audit** — Multiple roles running in parallel browser sessions, simulating real restaurant operations (e.g., POS staff + kitchen crew interacting simultaneously).

**Why:** The audit mode determines the entire execution shape — number of agents, number of browser sessions, output format, and whether cross-role interaction is evaluated. Getting this wrong wastes significant time and compute.

**Exception:** If the user's request already clearly specifies the mode (e.g., "audit the POS page as staff" → single-user, "simulate kitchen and POS together" → multi-user), skip this gate and proceed with the implied mode.

### 2. Production URL Check

**Trigger:** User provides a URL that is not `localhost` or `127.0.0.1`.

**Action:** STOP and confirm:
- "This URL looks like a production/staging server. UX audits should run against the local dev server (`http://localhost:5173`). Should I proceed anyway, or switch to localhost?"

**Why:** Automated browser interaction against production could trigger rate limits, create test data, or affect real users.

### 3. Muscle Memory Disruption Warning

**Trigger:** Recommendations include layout changes to pages that staff use daily (specifically `/pos` floor plan, `/kitchen/orders` KDS queue, or checkout flow).

**Action:** Flag in the recommendations:
- "WARNING: This change affects a page used during every shift. Staff have built muscle memory for the current layout. Consider: (a) making the change between shifts, (b) keeping the same spatial positions for primary actions, (c) briefing staff before deployment."

**Why:** Moving a button that a cashier taps 200 times per shift can cause errors during the adjustment period.

### 4. Scenario Script Approval

**Trigger:** Every multi-user audit, after scenario generation (Step B3).

**Action:** Present the full generated scenario script and STOP:
- Show all scenarios with names, contexts, and key actions per role
- Show the cross-role [HANDOFF] points
- Show agent count and estimated session length
- Ask: "Does this script look right? Want to add, remove, or modify any scenarios?"

**Why:** Generated scenarios are creative interpretations. The user knows their restaurant better than any AI — they should validate that the scenarios are realistic and test what actually matters. A bad script wastes significant time and produces irrelevant findings.

### 5. Multi-User Resource Warning

**Trigger:** Multi-user audit with 3+ roles OR extreme intensity level.

**Action:** Warn the user:
- "This audit will launch [N] parallel browser sessions with [M] scenarios each. This may take [estimated time] and consume significant resources. Proceed?"

**Why:** Each parallel agent opens a full browser instance. 3+ concurrent sessions or 10+ scenarios per agent on a dev machine may cause performance issues that affect the audit results themselves.

### 6. Fix Selection Gate (POST-AUDIT, EVERY AUDIT)

**Trigger:** Every audit, after presenting the full issue breakdown and overall recommendation.

**Action:** STOP and ask the user which issues to fix:
> "Which of these would you like me to fix right now? Reply with issue codes (e.g. 'P0-1, P1-2'), 'all P0s', 'everything', or 'none / just the report'."

**Then:**
- If any items selected → implement fixes inline, one file at a time, run `pnpm check` after all changes
- If "none" → stop here; the report is the deliverable

**Why:** Audits without action are noise. This gate closes the loop between findings and code — making every audit immediately actionable, with the user in control of scope.

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
| 3.0.0 | 2026-03-09 | **Agent Performance Rules**: Pre-bake auth via sessionStorage injection (skip login UI), hard snapshot budget (max 10), micro-audit pattern (5–7 steps/agent, split large roles), write-as-you-go (partial results survive crashes), known element ref shortcuts. Updated B4/B5/B6 to enforce rules. Updated architecture diagram to show split agents. |
| 2.4.0 | 2026-03-09 | Harden artifact cleanup: replace time-based `-newer` marker with exact before-snapshot diff (`comm -13`) + `.yml|.png` type-gate; orchestrator-only cleanup in multi-user path; safe for concurrent playwright-cli agents |
| 2.3.0 | 2026-03-09 | Add full issue breakdown (all findings, no summarising) + overall recommendation sentence + HITL Fix Selection Gate (gate #6) to both single-user and multi-user paths — audits now close the loop into code fixes |
| 2.2.0 | 2026-03-08 | Add mandatory `snapshot` over `screenshot` rule with rationale; reinforce in all workflow steps and agent prompt instructions |
| 2.1.0 | 2026-03-08 | Replace pre-built scenarios with dynamic scenario architect; add intensity levels (light/heavy/extreme); add script approval HITL gate; add scenario scorecard output |
| 2.0.0 | 2026-03-08 | Add multi-user audit mode: parallel agents, cross-role interaction assessment, pre-built scenarios, new HITL gates |
| 1.0.0 | 2026-03-07 | Initial skill creation |
