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
version: 4.7.0
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

## OUTPUT FORMAT — READ THIS FIRST

**Every audit (single-user and multi-user) MUST use this issue format in Section D:**

```
[01] Issue title
[02] Issue title
[03] Issue title
```

Each issue gets **five mandatory fields**: What, How to reproduce, Why this breaks, Ideal flow, The staff story.

**NEVER DO ANY OF THESE:**
- ❌ P0 / P1 / P2 priority grouping — BANNED
- ❌ Tables with Effort / Impact columns — BANNED
- ❌ `P0-1`, `P1-2` style IDs — BANNED
- ❌ Fix Checklist with priority prefixes — BANNED
- ❌ Referencing old audit files in `audits-legacy/` as format examples — they use a deprecated format

**ALWAYS DO THESE:**
- ✅ Flat sequential numbering: `[01]`, `[02]`, `[03]`…
- ✅ All five fields per issue (What, How to reproduce, Why this breaks, Ideal flow, The staff story)
- ✅ Named persona in "Why this breaks" (Ate Rose, Kuya Marc, Sir Dan, Boss Chris, Ate Lina, Kuya Benny)
- ✅ First-person quote in "The staff story"
- ✅ Fix Checklist uses `[01]`, `[02]` IDs (matching Section D)
- ✅ Structural proposals use `[SP-01]`, `[SP-02]` IDs (Section E) — max 3 per audit, only when warranted

See **Section D** in the Single-User Output Template for the full format specification.

---

## References

| Reference | Purpose | When to read |
|---|---|---|
| `references/DESIGN_BIBLE.md` | UX assessment framework (cognitive laws, heuristics, Gestalt, WCAG, POS patterns) | Every audit — the evaluation criteria |
| `references/ENVIRONMENT.md` | Restaurant physical context — lighting, wet hands, viewing distance, noise, shift rhythms | Every audit — adjusts pass/fail thresholds per zone |
| `references/KNOWN_PATTERNS.md` | 11 recurring systemic issues (KP-01 to KP-11) from 53 audits with fix patterns | Every audit — reference when a finding matches a known pattern |
| `references/PRD_QUICK_REF.md` | Feature status map — what's built, partial, or deferred per PRD module | Every audit — prevents false positives on unbuilt features |
| `references/BIR_REQUIREMENTS.md` | Philippine BIR compliance: X-Read, Z-Read, receipt field requirements | When auditing `/reports/x-read`, `/reports/eod`, or receipt flows |
| `references/ROLE_WORKFLOWS.md` | Per-role shift workflows with action frequency and UX criticality ratings | Every audit — weights findings by real-world impact |
| `.claude/skills/playwright-cli/SKILL.md` | playwright-cli commands for snapshots, navigation, interaction | When unsure about a playwright-cli command |
| `tailwind.config.js` | Design tokens (colors, radii, fonts) | When checking color values or token names |
| `src/app.css` | Reusable CSS classes (`.pos-card`, `.btn-*`, `.badge-*`, `.pos-input`) | When checking CSS class behavior |

---

## WORKSPACE RULES (READ FIRST AND LAST)

These four rules govern all file operations during any audit. They apply to the orchestrator
AND every subagent. Read them before starting. Re-read them before finishing.

### WR-1 — NEVER take screenshots

`playwright-cli screenshot` is **permanently banned**. No exceptions. No "final visual proof."
No "optional documentation image." The command must never appear in any audit session.

Use `playwright-cli snapshot` for everything. It returns a structured accessibility tree with
element refs — the only data format a UX audit needs.

```bash
# ✅ The ONLY command for capturing page state
playwright-cli snapshot

# ❌ BANNED — wastes tokens, takes longer, produces nothing usable
playwright-cli screenshot
```

### WR-2 — Dedicated workspace folder (run-scoped)

Every audit run gets its own uniquely-named folder. This prevents collisions when multiple
audits run concurrently (or a crashed audit left debris behind).

**Naming pattern:** `skills/ux-audit/work-{run-id}/`

Generate `{run-id}` at the start of every audit using:
```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
```

This produces IDs like `143022-a1b2c3d4` — human-readable timestamp + random suffix.

**Single-user audit:**
```
skills/ux-audit/work-143022-a1b2c3d4/
```

**Multi-user audit (subagents get scoped subfolders):**
```
skills/ux-audit/work-143022-a1b2c3d4/              ← orchestrator workspace
skills/ux-audit/work-143022-a1b2c3d4/agent-staff/  ← Staff agent writes here
skills/ux-audit/work-143022-a1b2c3d4/agent-kitchen/← Kitchen agent writes here
skills/ux-audit/work-143022-a1b2c3d4/agent-manager/← Manager agent writes here
skills/ux-audit/work-143022-a1b2c3d4/agent-owner/  ← Owner agent writes here
```

Split agents use suffixed names: `agent-staff-a/`, `agent-staff-b/`.

Nothing else. No `.playwright-cli/`. No `/tmp/`. Only this folder.

### WR-3 — Clean start, clean end

**First commands of every audit (before opening any browser):**
```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ux_work="skills/ux-audit/work-${_ux_run_id}"
mkdir -p "$_ux_work"
```

Store `$_ux_work` and pass it to all subagents. Every file operation uses this path.

**Last command of every audit (after saving the final report to `audits/`):**
> **Folder note:** New v4+ audits go in `audits/`. Old pre-v4 audits live in `audits-legacy/` — never write there.
```bash
rm -rf "$_ux_work"
```

No `comm` diffs. No before-snapshots. No temp files. The workspace is disposable.

### WR-4 — Subagent prompt MUST include workspace path

Every subagent prompt must contain these exact lines (with the real `$_ux_work` value substituted):

```
WORKSPACE RULES (mandatory):
- Your workspace is: {_ux_work}/agent-{role}/
- mkdir -p {_ux_work}/agent-{role}/ before writing anything.
- Save ALL working files here. Do NOT write to .playwright-cli/ or any other directory.
- Do NOT use `playwright-cli screenshot`. NEVER. Only use `playwright-cli snapshot`.
- Your final report goes here. The orchestrator will collect it after you finish.
- Do NOT run cleanup. The orchestrator handles cleanup after all agents return.
```

> **Why this section appears at the top of the skill:** So you read it before doing anything.
> It also appears as a reminder at the end of both Path A and Path B — so you don't forget.

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
| `kitchen` (sides prep) | `/kitchen/*`, `/stock/inventory` | Sides preparer — banchan, rice, soup, utensils. Shares KDS with grill cook. Hands wet from produce/soup. |
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
| Kitchen (grill) | Kuya Marc | `kitchen` | `tag` | `true` | `/kitchen/orders` |
| Kitchen (sides prep) | Ate Lina | `kitchen` | `tag` | `true` | `/kitchen/orders` |
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

### Rule 6 — Crash Recovery Signal

If an agent detects it's running low on tool calls or encountering repeated failures:

1. **Write current findings immediately** — append everything collected so far to the output file
2. **Add a `[PARTIAL]` marker** — at the end of the file, write: `[PARTIAL — completed steps 1-N of M, crashed at step N+1]`
3. **Return what you have** — do not retry failed operations. Return partial results so the orchestrator can decide whether to re-launch.

The orchestrator will parse `[PARTIAL]` markers and offer the user a retry for remaining steps.

---

## Orchestrator Crash Recovery

When a parallel agent returns partial results or times out:

1. **Check for `[PARTIAL]` marker** in the agent's output file
2. **Identify completed vs remaining steps** from the marker
3. **Present to user:**
   ```
   Agent "Staff-A" completed 3 of 6 steps before crashing.
   Completed: A1 (PASS), A2 (PASS), A3 (CONCERN)
   Remaining: A4, A5, A6
   Retry remaining steps? (y/n)
   ```
4. **If retry** — launch a replacement agent with only remaining steps, referencing the partial output file for context
5. **If declined** — synthesize report using partial data, noting gaps

> **15% of agents crash** (observed across 46 runs). This recovery path ensures no audit data is lost.

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

#### A0 — Read References (BEFORE opening any browser)

Read these references in parallel before doing anything else:

```
references/DESIGN_BIBLE.md        ← evaluation criteria
references/ENVIRONMENT.md         ← physical context (adjusts thresholds)
references/KNOWN_PATTERNS.md      ← recurring issues to watch for
references/PRD_QUICK_REF.md       ← feature status (prevents false positives)
references/ROLE_WORKFLOWS.md      ← action frequency (weights findings)
```

Also read if relevant to scope:
- `references/BIR_REQUIREMENTS.md` — if auditing X-Read, Z-Read, EOD, or receipt pages

Then read the target route's source files to understand the implementation before opening
the browser.

#### A1 — Define Scope

Clarify with the user:
- **Page or flow** — Single page (e.g., `/pos`) or multi-step flow (e.g., "create order to checkout")?
- **Role** — Which role to log in as? (affects what's visible and what matters)
- **Branch** — Which location? (`tag`, `pgl`, `all`)
- **Viewport** — Default tablet `1024x768`, or specify mobile/desktop

#### A2 — Open App

**Set up workspace (WR-3) and open the browser:**

```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ux_work="skills/ux-audit/work-${_ux_run_id}"
mkdir -p "$_ux_work"
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

Navigate to the target page. Take a **snapshot** at each meaningful state:

```bash
playwright-cli snapshot
```

Name your states mentally: `initial`, `loaded`, `active`, `empty`, `error`, `completion`.

#### A6 — Capture Interaction States

For interactive pages, trigger key states and snapshot each:
- **Empty state** — No data (e.g., no orders, empty inventory)
- **Loaded state** — Typical data volume
- **Active state** — Mid-interaction (e.g., order being built, modal open)
- **Error state** — Validation failure, network error
- **Completion state** — After successful action (e.g., order paid)

#### A7 — Close, Save & Clean Up

```bash
playwright-cli close
```

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

**After saving the report, clean up the workspace (WR-3):**

```bash
rm -rf "$_ux_work"
```

**After cleanup, your final response to the user must be:**

1. A "File saved" confirmation with the path
2. **Full issue list** — list EVERY finding from the audit. Do not summarise or drop items. Format:

```
[01] <Issue title> · <Affected role(s)>
     <What — one paragraph summary>
     "<The staff story — first-person quote>"

[02] <Issue title> · <Affected role(s)>
     <What — one paragraph summary>
     "<The staff story — first-person quote>"

...
```

3. **Structural proposals** (if any) — list any `[SP-##]` proposals separately from element issues:

```
[SP-01] <Proposal title> (addresses [03], [07], [11])
        <One-line summary of what's being proposed>

[SP-02] <Proposal title> (addresses [05], [09])
        <One-line summary>
```

4. **Overall recommendation** — A single, opinionated sentence that answers: "Is this flow ready for service?" Examples:
   - "This flow is **not ready for service** — issues 01 and 02 will cause errors during every shift."
   - "This flow is **ready for service with one caveat** — issue 01 should be addressed before the next busy weekend."
   - "This flow is **production-ready** — no blocking issues, all items are improvement-only."

5. **HITL: Fix Selection Gate** — After presenting the full list and recommendation, STOP and ask:

   > **Which of these would you like me to fix right now?**
   > Reply with issue numbers (e.g. "01, 02, 05") or say "all", "everything", or "none / just the report".
   > Structural proposals `[SP-##]` are for discussion — reply "discuss SP-01" to explore further.

   Wait for the user's reply. Then:
   - If user selects `[##]` items → implement the fixes immediately in the codebase, following all WTFPOS coding conventions (Svelte 5 runes, `incrementalPatch`, `nanoid`, location-scoped, `pnpm check` after each file)
   - If user says "discuss SP-##" → expand on the proposal: walk through the implementation sketch, estimate scope, discuss trade-offs. Do NOT implement without explicit user approval.
   - If user says "implement SP-##" → implement the structural change, creating new routes/components/stores as needed. Follow WTFPOS conventions. Run `pnpm check` after all changes.
   - If user says "none" or "just the report" → stop and leave the report as the deliverable

---

### Path B — Multi-User Audit

Simulates real restaurant operations using **multiple parallel agents**, each running its own
**single browser session** with **sequential role stints**. Each agent opens one browser,
switches between roles via `sessionStorage` swaps, and shares IndexedDB within its own
session. Agents run **different scenario sets** — varied table counts, pax, packages, payment
methods, edge cases — so the audit covers a wide range of restaurant conditions in parallel.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                                     │
│  (generates scenario sets, launches agents, synthesizes across agents)    │
└────────┬──────────────────┬──────────────────┬──────────────────────────┘
         │                  │                  │
   ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
   │  Agent 1   │    │  Agent 2   │    │  Agent 3   │
   │ "Quiet     │    │ "Friday    │    │ "Chaos     │
   │  Monday"   │    │  Rush"     │    │  Sunday"   │
   │            │    │            │    │            │
   │ Browser 1  │    │ Browser 2  │    │ Browser 3  │
   │ (own IDB)  │    │ (own IDB)  │    │ (own IDB)  │
   │            │    │            │    │            │
   │ Staff→Kit  │    │ Staff→Kit  │    │ Staff→Kit  │
   │ →Sides→    │    │ →Stove→    │    │ →Sides→    │
   │ Staff(co)  │    │ Staff(co)  │    │ Mgr→Staff  │
   │            │    │            │    │ (co)       │
   │ 6 scenes   │    │ 14 scenes  │    │ 12 scenes  │
   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
         │                 │                  │
         └────────┬────────┴──────────────────┘
                  │
          ┌───────▼───────┐
          │  Synthesize   │
          │  across all   │
          │  agents       │
          └───────────────┘
```

**Key design:** Each agent's browser has its own IndexedDB — agents do NOT share data.
This is intentional. Each agent simulates a complete, independent restaurant shift. The
value of multiple agents is **scenario variety**, not data sharing. The orchestrator
synthesizes findings *across* agents to find patterns that recur under different conditions.

**There are no pre-built scenarios.** Every multi-user audit dynamically generates scenario
sets based on the user's preferences, the roles selected, and the intensity level chosen.

#### B1 — Gather Preferences (HITL)

Ask the user these questions **before generating any scenarios**:

**Required:**
1. **Roles involved** — Which roles participate? (e.g., `staff` + `kitchen`, or `staff` + `kitchen` + `manager`)
2. **Branch** — Which location? All agents operate on the same branch (e.g., `tag`)
3. **Intensity level** — How thorough should the simulation be?

| Level | Agents | Scenarios per agent | Best for |
|---|---|---|---|
| **Light** | 1 agent | Up to 5 | Smoke testing, quick health checks, verifying a specific fix |
| **Heavy** | 2–3 agents | 6–10 each | Sprint-end validation, pre-deployment QA |
| **Extreme** | 3–4 agents | 10–15 each | Major release validation, first-time UX audit, investor demos |

**Optional (ask if not obvious from context):**
4. **Focus areas** — Any specific flows to emphasize? (e.g., "refills are buggy", "checkout feels slow", "kitchen can't keep up with tickets")
5. **Viewport per role** — Default: tablet `1024x768` for all. Can differ per role.
6. **Include chaos?** — Should scenarios include error/edge cases like refused items, voids, network hiccups, or just happy paths?

> **Note:** Light intensity uses 1 agent (equivalent to the single-agent model). Heavy
> and extreme use multiple agents with varied scenario sets running in parallel.

#### B2 — Generate Scenario Sets

Based on the user's preferences, generate **one scenario set per agent**. Each set is a
complete stint sequence representing a different restaurant condition. This is the creative
step — you are a scenario architect distributing variety across parallel agents.

**Step 1 — Design the agent roster:**

Each agent gets a **theme** — a restaurant condition that shapes all its scenarios:

| Agent | Theme example | What it tests |
|-------|-------------|--------------|
| Agent 1 | "Quiet Monday" | Happy paths, clean flows, baseline UX quality |
| Agent 2 | "Friday Rush" | Volume pressure, multiple tables, concurrent kitchen tickets |
| Agent 3 | "Chaos Sunday" | Edge cases: voids, refused items, leftover penalties, split bills, SC/PWD discounts |
| Agent 4 | "Takeout Tsunami" | Takeout-heavy shift, minimal dine-in, kitchen prioritization |

**Step 2 — Distribute scenario variation across agents:**

No two agents should test the same combination. Spread these across agents:

| Dimension | Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|-----------|---------|---------|---------|---------|
| Tables | 1-2 | 3-4 + takeout | All + takeout | 0-1 + heavy takeout |
| Pax | Solo, couple | 4-6 groups | 8+ groups, elders | 1-2 pax takeout |
| Package | Pork only | Mix, Beef | Premium, Pork, Mix | Pork, Beef |
| Payment | Cash only | GCash, Maya | Split bill, SC disc | Cash, Maya |
| Kitchen | Clean bump | Overflow queue | Refuse + refire | Takeout priority |
| Edge cases | None | Refill storm | Void, penalty, split | Package change mid-order |

**Step 3 — Generate stint sequence per agent:**

Each agent gets its own stint plan. All agents use the **same role roster** (the roles
selected in B1) but with different scenarios per role:

```
Agent 1: "Quiet Monday" (6 scenarios)          Agent 2: "Friday Rush" (14 scenarios)
├─ Staff: T4 solo, Pork, clean order            ├─ Staff: T4 barkada(6), T7 family(4),
├─ Kitchen: bump all, no issues                 │         T2 elders(3), Takeout JUAN
├─ Staff: cash checkout                         ├─ Kitchen dispatch: expo sprint
│                                               ├─ Kitchen stove: dine vs takeout
                                                ├─ Kitchen orders: bump + refuse
                                                ├─ Sides: banchan + refill test
                                                ├─ Weigh: 2 portions
                                                └─ Staff: refill storm, 3 checkouts
                                                          (cash, SC+GCash, split+penalty)
```

**Step 4 — Map handoff checks per agent:**

Each agent's stint transitions get their own handoff check expectations:

```
Agent 2 handoff checks:
[HANDOFF Stint 1→2] Staff sends 4 orders → Dispatch sees all 4 in "New Tables" strip
[HANDOFF Stint 2→3] Dispatch marks sides DONE → Stove sees only stove items
[HANDOFF Stint 4→5] Orders bumps 3, refuses 1 → Sides sees only pending sides
[HANDOFF Stint 6→7] All kitchen done → Staff sees bumped/refused badges, alerts
```

**Scenario generation rules (apply to every agent):**

1. **Think like the role** — A staff member during a Friday rush slams through orders.
   Kitchen is drowning in tickets. Generate scenarios that reflect reality.

2. **Each scenario is a mini-story** — Give it a name, context, and reason:

   ```
   S3 "Elder Discount": T2, 3 pax Beef AYCE
   Context: Elderly couple + grandchild. SC/PWD discount applied at checkout.
   Tests: Discount modal, pro-rata AYCE calculation, BIR receipt compliance.
   ```

3. **Order by escalation within each agent** — Simple scenarios first, complex last.

4. **Staff always bookends** — Staff opens tables early, returns for checkouts late.
   Kitchen/sides/weigh stints go in between. Manager/owner observes last.

#### B3 — Present Script for Approval (HITL)

**Before doing any codebase reading or browser work**, present the full agent roster
and stint plans to the user:

- Show **each agent** with its theme, stint sequence, scenarios, and handoff checks
- Show the **variation matrix** — what differs across agents
- Show total counts: agents, stints, scenarios, estimated snapshot budget
- Ask: "Does this plan look right? Want to add, remove, or modify any agents/scenarios?"

**Example presentation format:**

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 1: "Quiet Monday"   │  AGENT 2: "Friday Rush"          │
│  1 browser · 3 stints · 6S │  1 browser · 7 stints · 14S      │
├─────────────────────────────┼──────────────────────────────────┤
│ Staff → /pos                │  Staff → /pos                    │
│  S1 T4: solo, Pork, clean  │   S1 T4: 6 pax, Pork AYCE       │
│  S2 T7: couple, Beef       │   S2 T7: 4 pax, Mix AYCE        │
│  ─[HANDOFF]→ Kitchen       │   S3 T2: 3 pax, Beef AYCE       │
│                             │   S4 Takeout JUAN                │
│ Kitchen → /kitchen/orders   │   ─[HANDOFF]→ Kitchen            │
│  S3 Bump all, clean         │                                  │
│  ─[HANDOFF]→ Staff          │  Dispatch → /kitchen/dispatch    │
│                             │   S5 Expo sprint                 │
│ Staff → /pos                │  Stove → /kitchen/stove          │
│  S4 T4 cash checkout        │   S6 Queue + takeout priority    │
│  S5 T7 GCash checkout       │  Orders → /kitchen/orders        │
│  S6 No issues               │   S7 Bump + refuse 1 item        │
│                             │  Sides → /kitchen/sides-prep     │
│                             │   S8 Banchan + refill test        │
│                             │  Weigh → /kitchen/weigh-station  │
│                             │   S9 2 table portions             │
│                             │   ─[HANDOFF]→ Staff               │
│                             │                                   │
│                             │  Staff → /pos (return)            │
│                             │   S10 Refill storm T4             │
│                             │   S11 T4 cash                     │
│                             │   S12 T2 SC + GCash               │
│                             │   S13 T7 penalty + split          │
│                             │   S14 Takeout close               │
└─────────────────────────────┴───────────────────────────────────┘

Variation matrix:
| Dimension | Agent 1        | Agent 2                       |
|-----------|---------------|-------------------------------|
| Tables    | 2             | 3 + takeout                   |
| Pax       | 1-2           | 3-6                           |
| Payment   | Cash, GCash   | Cash, GCash, split, SC disc   |
| Kitchen   | Clean bump    | Refuse + refill + weigh       |
| Edge case | None          | Leftover penalty, split bill  |

Total: 2 agents (parallel), 10 stints, 20 scenarios, ~60 snapshots budget
```

**Do NOT proceed until the user approves the plan.** This is a Human in the Loop gate.

The user may:
- Approve as-is → proceed to B4
- Request more/fewer agents → regenerate
- Request scenario changes → adjust specific agent's stint plan
- Request different themes → regenerate with new themes

#### B4 — Codebase Reconnaissance (Orchestrator)

**Before launching any agents**, the orchestrator reads the codebase to understand what
interactions are possible. This is done **once** and the results are included in every
agent's prompt — agents don't need to do their own recon.

**Set up the workspace (WR-3):**

```bash
_ux_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ux_work="skills/ux-audit/work-${_ux_run_id}"
mkdir -p "$_ux_work"
```

**Read these files for each role in the approved script:**

| Role stint | Files to read |
|-----------|--------------|
| Staff (POS) | `src/routes/pos/+page.svelte`, `src/lib/stores/pos/orders.svelte.ts`, `src/lib/stores/pos/tables.svelte.ts`, `src/lib/stores/pos/payments.svelte.ts`, `src/lib/components/pos/AddItemModal.svelte`, `src/lib/components/pos/CheckoutModal.svelte` |
| Kitchen (dispatch) | `src/routes/kitchen/dispatch/+page.svelte`, `src/lib/stores/pos/kds.svelte.ts` |
| Kitchen (stove) | `src/routes/kitchen/stove/+page.svelte`, `src/lib/stores/pos/kds.svelte.ts` |
| Kitchen (orders) | `src/routes/kitchen/orders/+page.svelte`, `src/lib/stores/pos/kds.svelte.ts` |
| Kitchen (weigh) | `src/routes/kitchen/weigh-station/+page.svelte`, `src/lib/stores/bluetooth-scale.svelte.ts` |
| Manager (reports) | `src/routes/reports/+layout.svelte`, relevant report `+page.svelte` files |
| Any role | `src/lib/stores/session.svelte.ts` (for session payloads), `src/lib/db/seed.ts` (for available tables, menu items, stock) |

**What to extract from the codebase:**
- Available table IDs and their properties (from seed data or floor layout)
- Menu item names, categories, and IDs (from seed data)
- Button labels, modal triggers, form field names (from component templates)
- Session payload format per role (from `session.svelte.ts`)
- Navigation routes and how to reach each page
- What element refs or selectors to expect in snapshots

**Output:** A reconnaissance summary saved to `$_ux_work/recon.md`. This file is
included verbatim in every agent's prompt so they can write scripts targeting real
elements. If a scripted scenario requires a feature that doesn't exist, flag it now
and adjust the agent's scenario set before launching.

#### B5 — Script-First E2E (Per Agent) — Two-Pass Model

**CRITICAL RULE: No ad-hoc testing. Every agent MUST write the complete E2E script BEFORE
executing any of it.** The agent's job has two distinct passes:

- **Pass 1 (Script Creation):** Open browser, snapshot each target page to get real element
  refs, then write the COMPLETE script for ALL stints into `e2e-script.md`. Close browser.
- **Pass 2 (Execution + Audit):** Re-open browser, execute the pre-built script command
  by command. Audit at `[AUDIT]` and `[HANDOFF CHECK]` points. If a command fails (stale
  ref), patch the script and continue — but NEVER enter free-form exploration mode.

Each agent receives its own scenario set from B2 and the shared recon from B4. The agent
opens **one browser**, and roles are switched by swapping `sessionStorage` and navigating
to the target page — all within the same browser context. This naturally shares IndexedDB
(same origin, same browser) so cross-role data flows are real.

**How each agent works (two-pass):**

```
════════════════════════════════════════════
  PASS 1 — SCRIPT CREATION (recon snapshots)
════════════════════════════════════════════
Browser open (once)
│
├─ Set role: staff → navigate /pos → snapshot
│   Read element refs for tables, buttons, menu items
│
├─ Set role: kitchen → navigate /kitchen/orders → snapshot
│   Read element refs for ticket cards, bump buttons
│
├─ Set role: kitchen → navigate /kitchen/dispatch → snapshot
│   Read element refs for sides queue, expo view
│
├─ Set role: manager → navigate /reports/x-read → snapshot
│   Read element refs for report controls, data tables
│
├─ ... (snapshot every page in the stint plan)
│
Browser close
│
▼ WRITE COMPLETE e2e-script.md
  (all stints, all scenarios, all commands, all handoff checks)
  Use real refs from Pass 1 snapshots + recon.md
│
════════════════════════════════════════════
  PASS 2 — EXECUTION + AUDIT
════════════════════════════════════════════
Browser open (once)
│
├─ [STINT 1] Ate Rose · staff           → /pos
│   Execute S1, S2, S3 from script
│   [AUDIT] at marked points
│   ──── [HANDOFF CHECK] ────
│   [sessionStorage swap]
│
├─ [STINT 2] Kuya Marc · kitchen        → /kitchen/orders
│   Execute S4, S5 from script
│   [AUDIT] at marked points
│   ──── [HANDOFF CHECK] ────
│   [sessionStorage swap]
│
├─ [STINT 3] Ate Lina · kitchen         → /kitchen/sides-prep
│   Execute S6 from script
│   [sessionStorage swap]
│
├─ [STINT 4] Ate Rose · staff           → /pos
│   Execute S7, S8, S9 from script
│   [sessionStorage swap]
│
└─ [STINT 5] Sir Dan · manager          → /reports/x-read
    Execute S10, S11 from script
│
Browser close
```

**Why script-first, not iterative:**

Ad-hoc testing (snapshot → try something → snapshot → try something else) is slow,
unfocused, and produces scripts that can't be replayed. By writing the full script first:

- The agent **thinks through the entire flow** before touching anything — better coverage
- The script is **replayable** — you can re-run it later to verify fixes
- **Stale ref recovery** is simple: if a ref changed, snapshot the current state, patch
  that one command, and continue executing the script. No exploratory rabbit holes.
- The orchestrator can **review the script** before Pass 2 if desired

**Shared IndexedDB — why this works:**

One browser = one origin = one IndexedDB. When Staff creates an order in Stint 1,
the KDS tickets are written to the shared RxDB database. When Kitchen opens in Stint 2,
RxDB reads from the same IndexedDB — the tickets are there. No `--profile` hack needed,
no multi-session coordination, no `waitForTimeout`. Data is guaranteed present because
the stints are sequential.

**sessionStorage swap pattern:**

Between stints, swap the role by overwriting `sessionStorage` and navigating:

```bash
# === STINT SWAP: Staff → Kitchen ===
playwright-cli eval "sessionStorage.setItem('wtfpos_session', JSON.stringify({userName:'Kuya Marc', role:'kitchen', locationId:'tag', isLocked:true}))"
playwright-cli navigate http://localhost:5173/kitchen/orders
# Wait for page to settle after navigation
playwright-cli eval "new Promise(r => setTimeout(r, 1000))"
playwright-cli snapshot
```

The app reads `sessionStorage` on mount — swapping it and navigating triggers a fresh
session as the new role. IndexedDB is untouched by the swap.

**Pass 1 — Script creation rules:**

1. Open browser, set each role via sessionStorage, navigate to each target page, snapshot
2. Collect real element refs from every page in the stint plan
3. Write the COMPLETE `e2e-script.md` covering ALL stints using these real refs
4. For elements that only appear after interaction (modals, dropdowns, dynamic lists),
   use recon.md component analysis to predict ref patterns — mark these as `[DYNAMIC-REF]`
   in the script so Pass 2 knows to snapshot before those specific commands
5. Close browser after all recon snapshots are taken

**Pass 2 — Execution rules:**

1. Open browser (fresh session — clean IndexedDB for this agent)
2. Execute the pre-built script command by command, stint by stint
3. At `[AUDIT]` points: examine the snapshot output, record PASS / CONCERN / FAIL
4. At `[HANDOFF CHECK]` points: verify expected data is present, record handoff quality
5. At `[DYNAMIC-REF]` commands: snapshot first, resolve the real ref, then execute
6. **If a command fails:**
   - Snapshot current state to get updated refs
   - Patch ONLY the failing command in the script
   - Continue executing the rest of the script
   - The failure + recovery is audit data (note it in findings)
   - **NEVER** abandon the script and switch to free-form exploration
7. After all stints: close browser

**Script file:** Save the complete script to `$_ux_work/agent-{N}/e2e-script.md` during
Pass 1. During Pass 2, annotate it with execution results (PASS/FAIL per command). This
file becomes part of the audit record and is replayable.

#### B5.1 — E2E Script Structure

The script file (`$_ux_work/e2e-script.md`) follows this structure:

```markdown
# Multi-User E2E Audit Script
# Generated: YYYY-MM-DD
# Branch: tag | Intensity: heavy | Roles: 5

## Stint 1 — Ate Rose · staff → /pos
### Setup
playwright-cli open http://localhost:5173
playwright-cli eval "sessionStorage.setItem('wtfpos_session', JSON.stringify({userName:'Ate Rose', role:'staff', locationId:'tag', isLocked:true}))"
playwright-cli navigate http://localhost:5173/pos

### S1: "Barkada Night" — T4, 6 pax, Pork AYCE
playwright-cli snapshot                    # Capture floor plan state
playwright-cli click <ref>                 # Click table T4
# ... (steps filled in from recon + live snapshots)

### S2: "Family Dinner" — T7, 4 pax, Mix AYCE
# ...

### Handoff check → Kitchen
playwright-cli eval "sessionStorage.setItem('wtfpos_session', JSON.stringify({userName:'Kuya Marc', role:'kitchen', locationId:'tag', isLocked:true}))"
playwright-cli navigate http://localhost:5173/kitchen/orders
playwright-cli snapshot
# [AUDIT] Ticket visibility, count, readability

---

## Stint 2 — Kuya Marc · kitchen → /kitchen/orders
### S4: "The Monitor" — all-tickets view
# ...
```

**Rules for script creation (Pass 1):**
- Every `playwright-cli` command must use real element refs from Pass 1 recon snapshots
- Never guess element refs — always snapshot first, then target
- Mark interactions with dynamic elements (modals, dropdowns) as `[DYNAMIC-REF]`
- Include `[AUDIT]` comment lines at moments worth evaluating (these become findings)
- Include `[HANDOFF CHECK]` at every role transition
- Include the scenario name and context for each scenario block
- The script must be COMPLETE before Pass 2 begins — no partial scripts
- Max 30 snapshots across both passes combined (budget across all stints)

#### B6 — Launch Agents (Orchestrator)

Launch all agents **in parallel** using the `Agent` tool. Each agent gets a detailed
prompt containing:

1. **Workspace rules (WR-4)** — Agent writes to `$_ux_work/agent-{N}/`
2. **Codebase recon** — The full `$_ux_work/recon.md` from B4 (verbatim)
3. **Agent theme** — The agent's theme name and description
4. **Stint plan** — The approved stint sequence with scenarios and handoff checks
5. **References to include** — Remind the agent to read the Design Bible and
   ROLE_WORKFLOWS.md for audit lens per role
6. **E2E two-pass instructions** — The full B5 script-first mechanics:
   Pass 1 (recon snapshots → write complete script), Pass 2 (execute + audit),
   sessionStorage swap pattern, handoff checks, stale ref recovery, audit lens per role
7. **Snapshot budget** — 30 snapshots per agent
8. **Output file** — `$_ux_work/agent-{N}/findings.md` and `$_ux_work/agent-{N}/e2e-script.md`

**Agent prompt template (per agent):**

```
You are Agent {N}: "{Theme Name}" — a multi-user UX audit of WTFPOS branch {branch}.

WORKSPACE RULES (mandatory):
- Your workspace is: {_ux_work}/agent-{N}/
- mkdir -p {_ux_work}/agent-{N}/ before writing anything.
- Do NOT use `playwright-cli screenshot`. NEVER. Only use `playwright-cli snapshot`.
- Do NOT run cleanup. The orchestrator handles cleanup.

CODEBASE RECON (from orchestrator):
{contents of $_ux_work/recon.md}

YOUR STINT PLAN:
{agent's stint sequence from B3}

INSTRUCTIONS — TWO-PASS MODEL (NO AD-HOC TESTING):

  ╔═══════════════════════════════════════════════════════════╗
  ║  You MUST write the COMPLETE E2E script BEFORE executing  ║
  ║  any of it. No ad-hoc exploration. No iterative building. ║
  ╚═══════════════════════════════════════════════════════════╝

PASS 1 — SCRIPT CREATION:
1. Read references/DESIGN_BIBLE.md and references/ROLE_WORKFLOWS.md
2. Open browser: playwright-cli open http://localhost:5173
3. For each role/page in the stint plan:
   a. Swap sessionStorage for the role
   b. Navigate to the target page
   c. Snapshot to collect real element refs
   d. Do NOT interact with the app beyond navigation
4. Close browser: playwright-cli close
5. Write the COMPLETE e2e-script.md covering ALL stints, ALL scenarios,
   ALL handoff checks, using real refs from step 3.
   Mark dynamic elements (modals, post-interaction) as [DYNAMIC-REF].
   Save to {_ux_work}/agent-{N}/e2e-script.md

PASS 2 — EXECUTION + AUDIT:
6. Open browser: playwright-cli open http://localhost:5173
7. Execute e2e-script.md command by command, stint by stint
8. At [AUDIT] points: examine snapshot, record PASS/CONCERN/FAIL
9. At [HANDOFF CHECK] points: verify data from previous stint
10. At [DYNAMIC-REF] commands: snapshot first, resolve ref, then execute
11. If a command fails: snapshot, patch ONLY that command, continue.
    NEVER abandon the script for free-form exploration.
12. Close browser: playwright-cli close
13. Write findings to {_ux_work}/agent-{N}/findings.md
14. Return your findings file content in your response

AUDIT LENS PER ROLE:
- Staff: speed, clarity, error prevention, touch targets
- Kitchen (dispatch): expo overview, ticket grouping, sides/meat separation
- Kitchen (stove): queue readability, dine-in vs takeout, done marking speed
- Kitchen (orders): ticket density, bump efficiency, glanceability at 60cm
- Kitchen (sides): banchan vs refill distinction, batch done, utensil visibility
- Kitchen (weigh): scale reading clarity, portion mapping, live weight
- Manager: report accuracy, void/discount trail, data from completed orders
- Owner: cross-branch aggregation, dashboard quality

SNAPSHOT BUDGET: 30 total across all stints. Use wisely.
```

**Execution model per agent (two-pass):**

```
PASS 1 — SCRIPT CREATION (no interactions beyond navigation):
  For each role/page in the stint plan:
    1. Swap sessionStorage + navigate to target page
    2. Snapshot → collect real element refs
    3. Record refs for script creation
  Close browser.
  Write COMPLETE e2e-script.md using collected refs + recon.md.

PASS 2 — EXECUTION + AUDIT (follow the script):
  Open fresh browser.
  For each command in e2e-script.md:
    1. Execute the command
    2. At each [AUDIT] point:
       - Examine the snapshot
       - Record PASS / CONCERN / FAIL + principle violated
       - Append to findings.md
    3. At each [HANDOFF CHECK]:
       - Verify expected data is present
       - Record handoff quality (data found, visibility)
       - If handoff fails, record [HANDOFF-FAIL]
    4. At each [DYNAMIC-REF]:
       - Snapshot first, resolve the real ref, then execute
    5. If a command fails:
       - Snapshot current state to get updated refs
       - Patch ONLY the failing command
       - Continue executing the rest of the script
       - The failure + recovery is audit data
       - NEVER switch to free-form exploration
  Close browser.
```

**Write-as-you-go format (each agent writes to its own findings.md):**

```markdown
## Stint 2 — Kuya Marc · kitchen → /kitchen/orders

### [HANDOFF CHECK] Staff → Kitchen
- Tickets visible: YES (3 tickets appeared)
- Latency: Instant (same IndexedDB)
- Visibility: CONCERN — ticket text is 14px, hard to read from 60cm
- Meat vs sides distinction: FAIL — all tickets look identical

### S4: "The Monitor"
- Step: View all-tickets → CONCERN — 8 tickets, no priority ordering
- Step: Bump item → PASS — single tap, clear toast
- Step: Open history modal → FAIL — button is 32px, below 56px kitchen min
```

#### B7 — Synthesize Across Agents (Orchestrator)

After all agents return, the orchestrator has:
- `$_ux_work/agent-1/findings.md` + `e2e-script.md`
- `$_ux_work/agent-2/findings.md` + `e2e-script.md`
- `$_ux_work/agent-3/findings.md` + `e2e-script.md` (if applicable)

**Cross-agent synthesis process:**

1. **Read all agent findings** — Collect every observation from every agent

2. **De-duplicate across agents** — A touch target issue found by Agent 1 (Quiet Monday)
   AND Agent 3 (Chaos Sunday) is one issue, not two. But note that it was found under
   **different conditions** — this strengthens the finding.

3. **Flag condition-specific issues** — Some issues only appear under pressure:
   - "Ticket overflow is fine with 2 orders (Agent 1) but unreadable with 8 (Agent 2)"
   - "SC discount works for 1 elder (Agent 1) but fails for mixed-age group (Agent 3)"
   These get a `[CONDITION]` tag in the finding noting which agent theme exposed them.

4. **Build the unified report** using the **Multi-User Output Template**:

   - **Section A** (Layout maps) — One per role, from the agent with the most detailed snapshots for that role
   - **Section B** (Principle assessment) — 14-principle table per role, scored across all agents. A principle FAIL in any agent = FAIL overall.
   - **Section D** (Recommendations) — De-duplicated, with a "Seen in:" note per finding:
     ```
     **Seen in:** Agent 1 (Quiet Monday), Agent 3 (Chaos Sunday) — occurs regardless of load
     ```
     or:
     ```
     **Seen in:** Agent 2 (Friday Rush) only — occurs under volume pressure
     ```
   - **Section E** (Cross-role interaction) — Handoff checks from ALL agents combined into one table
   - **Section F** (Best Shift Ever) — Uses the most complex agent's stint sequence as the narrative backbone
   - **Section G** (Scenario scorecard) — All scenarios from all agents, grouped by agent theme
   - **Section H** (Cross-role recommendations) — Handoff issues from all agents, de-duplicated
   - **Section I** (Structural proposals) — If 3+ findings across agents share a structural root cause

5. **Confidence scoring** — Findings seen across multiple agents get higher confidence:
   - Found in 1 agent → reported as-is
   - Found in 2+ agents → tagged `[CONFIRMED]` — reproducible across conditions
   - Found in all agents → tagged `[SYSTEMIC]` — affects every shift type

#### B8 — Save & Clean Up Multi-User Audit File

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

**After saving the report, clean up the workspace (WR-3):**

```bash
rm -rf "$_ux_work"
```

**After cleanup, your final response to the user must be:**

1. A "File saved" confirmation with the path
2. **Scenario scorecard** — per-scenario pass/fail (from Section G)
3. **Per-role verdict summary** — PASS/CONCERN/FAIL counts per role
4. **Cross-role interaction score** — summary of handoff quality
5. **Full issue list** — list EVERY finding across all roles. Do not summarise or drop items. Format:

```
[01] <Issue title> · <Affected role(s)>
     <What — one paragraph summary>
     "<The staff story — first-person quote>"

[02] <Issue title> · <Affected role(s)>
     <What — one paragraph summary>
     "<The staff story — first-person quote>"

...
```

6. **Structural proposals** (if any) — list any `[SP-##]` proposals:

```
[SP-01] <Proposal title> (addresses [03], [07], [CR-02])
        <One-line summary of what's being proposed>
```

7. **Overall recommendation** — A single, opinionated sentence that answers: "Is this multi-user flow ready for a real service shift?" Examples:
   - "This multi-user flow is **not ready for service** — issues 01 and 02 will cause incorrect orders on every shift."
   - "This multi-user flow is **ready for service** — handoffs work, data flows correctly, all items are improvement-only."

8. **HITL: Fix Selection Gate** — After presenting everything, STOP and ask:

   > **Which of these would you like me to fix right now?**
   > Reply with issue numbers (e.g. "01, 02, 05"), cross-role issues ("CR-01"), or say "all", "everything", or "none / just the report".
   > Structural proposals `[SP-##]` are for discussion — reply "discuss SP-01" to explore further.

   Wait for the user's reply. Then:
   - If user selects `[##]` or `[CR-##]` items → implement the fixes immediately in the codebase, following all WTFPOS coding conventions (Svelte 5 runes, `incrementalPatch`, `nanoid`, location-scoped, `pnpm check` after each file)
   - If user says "discuss SP-##" → expand on the proposal: walk through the implementation sketch, estimate scope, discuss trade-offs. Do NOT implement without explicit user approval.
   - If user says "implement SP-##" → implement the structural change, creating new routes/components/stores as needed. Follow WTFPOS conventions. Run `pnpm check` after all changes.
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
5. **If the current page structure is the bottleneck** — what the *ideal interface* would look
   like, even if it doesn't exist yet. Don't limit the vision to the current architecture. If
   Ate Lina would be better served by a dedicated `/kitchen/sides` page, describe her ideal
   shift using that page, not the current generic KDS.

This section grounds the technical assessment in empathy for the restaurant worker. When the
vision describes an interface that doesn't exist, it feeds directly into Section E (Structural
Proposals).

#### D. Recommendations

Every issue gets the same depth of documentation. Issues are numbered sequentially: `[01]`, `[02]`, etc.
No priority grouping. No effort/impact metadata. The detail speaks for itself.

> ⚠️ **FORMAT ENFORCEMENT** — Do NOT output P0/P1/P2 tables, effort/impact columns, or any
> priority-grouped format. Every issue is a five-field dossier block (see template below).
> Old audit files in `audits-legacy/` use a deprecated format — do NOT copy their structure.
> New audits go in `audits/` only.

**Each issue MUST include all five fields:**

```markdown
---

##### [01] <Issue title>

**What:** <One paragraph — neutral, factual description of the issue. What is broken or
suboptimal. Reference specific components, routes, or elements.>

**How to reproduce:**
1. <Step — login role, branch>
2. <Step — navigate to route>
3. <Step — specific interaction>
4. <Result — what happens vs. what should happen>

**Why this breaks:** <One paragraph — scenario-based explanation of the real-world consequence.
Use a named persona (Ate Rose, Kuya Marc, Sir Dan, Boss Chris). Describe the cascade: what
error occurs, what it forces the user to do next, how much time/money it costs. Make it vivid
— this paragraph is what convinces someone to fix it.>

**Ideal flow:** <One paragraph — what the correct behavior looks like. This is the acceptance
criteria for the fix. Be specific: sizes, timings, visual states, interaction sequences.
A developer should be able to read this and know exactly what "done" looks like.>

**The staff story:** "<First-person quote from the affected role's perspective. Written as if
the restaurant worker is describing their frustration to the owner. Keep it human and grounded.>"

**Affected role(s):** <Role1, Role2>

---
```

**Rules for writing recommendations:**
- **All five fields are mandatory** — never skip any, even for "minor" issues
- **"Why this breaks" must use a named persona** — Ate Rose (staff), Kuya Marc (kitchen), Sir Dan (manager), Boss Chris (owner)
- **"Ideal flow" is the acceptance criteria** — the fix-audit skill will use this as the target state
- **"The staff story" must be first-person** — a quote, not a description
- **"How to reproduce" must be step-by-step** — a developer who has never seen the app should be able to follow it
- **Sequential numbering** — `[01]`, `[02]`, `[03]`… never skip numbers, never use priority prefixes
- **No tables for recommendations** — Section D is a series of `##### [NN]` blocks, NOT a markdown table with columns

#### Fix Checklist (end of report)

After all Section D issues, include a fix checklist for the fix-audit skill:

```markdown
## Fix Checklist (for `/fix-audit`)

- [ ] [01] — <Issue title>
- [ ] [02] — <Issue title>
- [ ] [03] — <Issue title>
...
```

IDs MUST match Section D numbering. Never use `P0-1`, `P1-2`, etc.

#### E. Structural Proposals (when warranted)

Section D fixes things within the current page/component structure. Section E proposes
**bigger changes** — new pages, tab reorganization, input consolidation, dedicated interfaces,
workflow splits, or interaction model overhauls.

**When to include Section E:**
- When 3+ Section D issues share the same root cause (a structural problem, not a styling problem)
- When a role's workflow doesn't map to any existing page (e.g., sides preparer using generic KDS)
- When the auditor observes that fixing individual elements cannot solve the fundamental friction
- When information is split across pages that should be consolidated, or crammed into one page that should be split
- When the audit reveals a missing interaction pattern (e.g., no drag-to-reorder, no inline editing, no batch actions)

**When NOT to include Section E:**
- When all issues are fixable within the current structure (contrast, sizing, spacing, copy)
- When the page is fundamentally sound and just needs polish
- If none of the Section D findings point to a structural root cause, **skip Section E entirely** — don't force it

**Each structural proposal uses the `[SP-##]` format:**

```markdown
---

##### [SP-01] <Proposal title>

**Problem pattern:** <Which Section D issues (by number) share this root cause, and what
the pattern is. E.g., "Issues [03], [07], and [11] all stem from the same problem: the
sides preparer has no dedicated view and must use the generic KDS, which was designed
for the grill cook's workflow.">

**Current structure:** <ASCII diagram or bullet list showing how the UI is organized today.
Show the page(s), tabs, panels, and information flow. Be specific about routes and components.>

**Proposed structure:** <ASCII diagram or bullet list showing the proposed reorganization.
Show new pages/tabs/panels, what moves where, what gets consolidated or split. Include
route paths if proposing new pages (e.g., `/kitchen/sides`).>

**Why individual fixes won't work:** <One paragraph explaining why patching the current
structure element-by-element is insufficient. What is the fundamental mismatch between
the current UI architecture and the user's real workflow? Reference the role workflow from
ROLE_WORKFLOWS.md if applicable.>

**Affected role(s):** <Which roles benefit, and how their workflow changes.>

**The staff story:** "<First-person quote from the role who would most benefit from this
restructuring. Frame it as what they wish existed.>"

**Implementation sketch:** <High-level technical notes — not a full spec, but enough for
a developer to understand the scope. Mention: new routes, new components, store changes,
data model implications. Reference existing WTFPOS patterns where possible.>

---
```

**Rules for structural proposals:**
- **`[SP-##]` numbering** — `[SP-01]`, `[SP-02]`, etc. Separate from `[01]` element issues.
- **Always link to Section D issues** — Every SP must reference which `[##]` issues it addresses. SPs without this link are vague wishlists.
- **Propose, don't prescribe** — SPs are conversation starters, not mandates. The user decides whether to pursue them.
- **Include ASCII diagrams** — Current vs. proposed structure must be visual, not just prose.
- **Be honest about scope** — Include an implementation sketch so the user understands the effort involved.
- **Max 3 SPs per audit** — If you have more than 3, combine related ones. Too many SPs dilutes the signal.

**Structural Proposals Checklist (end of report, after Fix Checklist):**

```markdown
## Structural Proposals (for discussion)

- [ ] [SP-01] — <Proposal title> (addresses [03], [07], [11])
- [ ] [SP-02] — <Proposal title> (addresses [05], [09])
```

### Multi-User Output Template

Multi-user audits include the single-user template sections (A–D) **per role stint**, plus
these additional sections that evaluate cross-role interaction quality.

#### E. Cross-Role Interaction Assessment

This section is **unique to multi-user audits**. It evaluates how well data and status flow
between roles at each **stint transition** — built directly from `[HANDOFF CHECK]` results
in the E2E script execution.

| # | Stint Transition | Source Role | Target Role | Data Expected | Data Found | Visibility | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Stint 1→2 | Staff (POS) | Kitchen (KDS) | 4 KDS tickets | 4 tickets found | Clear — ticket cards prominent | PASS |
| 2 | Stint 2→3 | Kitchen (KDS) | Sides (prep) | Sides-only tickets | All tickets shown, no filter | Missing — no sides distinction | FAIL |
| 3 | Stint 5→6 | Kitchen (KDS) | Staff (POS) | Bumped badges on orders | Badges present but 12px text | Subtle — easy to miss at speed | CONCERN |

**Evaluation criteria:**
- **Data Expected** — What data should exist from the previous stint?
- **Data Found** — What data actually appeared in the snapshot?
- **Visibility** — When the data is present, how obvious is it? (Clear = impossible to miss, Subtle = easy to overlook, Missing = not shown)
- **Verdict** — PASS (instant + clear), CONCERN (delayed or subtle), FAIL (failed or missing)

#### F. "Best Shift Ever" Vision (Multi-Role)

Same as Section C but written from **multiple perspectives** woven into a single narrative.
Don't limit the vision to the current page structure — if a role would be better served by
a dedicated page or reorganized interface, describe their ideal shift using that ideal interface.
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

#### H. Cross-Role Recommendations

In addition to per-role recommendations (Section D), add cross-role issues that emerge from
multi-device interaction. Use the **same five-field format** as Section D:

```markdown
---

##### [CR-01] <Cross-role issue title>

**What:** <What breaks in the handoff between roles. Reference the interaction point.>

**How to reproduce:**
1. <Role A does X>
2. <Role B expects to see Y>
3. <Result — what Role B actually sees>

**Why this breaks:** <Scenario with named personas showing the real-world cascade.
Emphasize the handoff moment — what happens when the kitchen doesn't see the void,
when the staff doesn't see the bump, etc.>

**Ideal flow:** <What the cross-role interaction should look like. Timing, visibility,
confirmation signals. A developer should know exactly what "done" means across both roles.>

**The staff story:** "<First-person quote — can be from either role's perspective,
whichever is more impacted by the broken handoff.>"

**Affected role(s):** <Role1 ↔ Role2>

---
```

Cross-role issues use `[CR-01]`, `[CR-02]`, etc. to distinguish from per-role issues.

#### I. Structural Proposals (when warranted)

Same format as single-user Section E (`[SP-##]` blocks), but multi-user audits have an
additional lens: **cross-role structural problems**. These are cases where the issue isn't
just one role's page — it's the way pages interact (or fail to interact) across roles.

**Additional triggers for Section I in multi-user audits:**
- A handoff that fails because the receiving role's page wasn't designed for the data
  the sending role produces (e.g., sides tickets look identical to meat tickets on KDS)
- Two roles that need to see the same data but have no shared view
- A manager oversight gap that would be solved by a new dashboard widget or consolidated view
- An interaction that requires switching between pages when it should happen in one place

SPs in multi-user audits should reference `[CR-##]` cross-role issues in addition to
per-role `[##]` issues in their "Problem pattern" field.

**Example multi-user SP:**

```markdown
##### [SP-01] Dedicated Sides Prep View (`/kitchen/sides`)

**Problem pattern:** Issues [04], [08] and cross-role issues [CR-02], [CR-03] all stem
from the same root cause: the sides preparer shares the generic KDS with the grill cook,
but their workflows are fundamentally different — Ate Lina needs to see refills separately,
track utensil prep, and manage banchan portions, none of which the current KDS supports.

**Current structure:**
┌─ /kitchen/orders ──────────────────────────┐
│  All tickets (meat + sides + refills)      │
│  No distinction between grill vs sides     │
│  Refills mixed with original orders        │
└────────────────────────────────────────────┘

**Proposed structure:**
┌─ /kitchen/orders ───────┐  ┌─ /kitchen/sides ──────────┐
│  Meat tickets only      │  │  Banchan + sides tickets   │
│  Grill cook focus       │  │  Refills highlighted       │
│  (Kuya Marc's view)     │  │  Utensil prep checklist    │
│                         │  │  (Ate Lina's view)         │
└─────────────────────────┘  └────────────────────────────┘

**Why individual fixes won't work:** ...
```

---

## Human in the Loop Gates

### 0. Scenario Presentation [FAST-SKIP] (ZEROTH GATE — BEFORE EVERYTHING)

**Trigger:** Every time the ux-audit skill is invoked.

**Action:** Present the user with a scenario summary before proceeding.

**Fast-skip:** Auto-skip when user's invocation already contains a complete scenario specification.

### 1. Audit Mode Selection [FAST-SKIP] (FIRST GATE)

**Trigger:** Every time the ux-audit skill is invoked.

**Action:** STOP and ask before doing anything else:
- "What type of audit do you want?"
  - **Single-user audit** — One role, one browser session. Evaluates a page or flow in isolation.
  - **Multi-user audit** — Multiple roles running in parallel browser sessions, simulating real restaurant operations (e.g., POS staff + kitchen crew interacting simultaneously).

**Why:** The audit mode determines the entire execution shape — number of agents, number of browser sessions, output format, and whether cross-role interaction is evaluated. Getting this wrong wastes significant time and compute.

**Exception:** If the user's request already clearly specifies the mode (e.g., "audit the POS page as staff" → single-user, "simulate kitchen and POS together" → multi-user), skip this gate and proceed with the implied mode.

**Fast-skip:** Auto-resolve when selected scenario clearly implies single-user or multi-user.

### 2. Production URL Check [HARD-STOP]

**Trigger:** User provides a URL that is not `localhost` or `127.0.0.1`.

**Action:** STOP and confirm:
- "This URL looks like a production/staging server. UX audits should run against the local dev server (`http://localhost:5173`). Should I proceed anyway, or switch to localhost?"

**Why:** Automated browser interaction against production could trigger rate limits, create test data, or affect real users.

### 3. Muscle Memory Disruption Warning

**Trigger:** Recommendations include layout changes to pages that staff use daily (specifically `/pos` floor plan, `/kitchen/orders` KDS queue, or checkout flow).

**Action:** Flag in the recommendations:
- "WARNING: This change affects a page used during every shift. Staff have built muscle memory for the current layout. Consider: (a) making the change between shifts, (b) keeping the same spatial positions for primary actions, (c) briefing staff before deployment."

**Why:** Moving a button that a cashier taps 200 times per shift can cause errors during the adjustment period.

### 4. Scenario Script Approval [HARD-STOP]

**Trigger:** Every multi-user audit, after scenario generation (Step B3).

**Action:** Present the full generated scenario script and STOP:
- Show all scenarios with names, contexts, and key actions per role
- Show the cross-role [HANDOFF] points
- Show agent count and estimated session length
- Ask: "Does this script look right? Want to add, remove, or modify any scenarios?"

**Why:** Generated scenarios are creative interpretations. The user knows their restaurant better than any AI — they should validate that the scenarios are realistic and test what actually matters. A bad script wastes significant time and produces irrelevant findings.

### 5. Multi-User Resource Warning [FAST-SKIP]

**Trigger:** Multi-user audit with 3+ roles OR extreme intensity level.

**Action:** Warn the user:
- "This audit will launch [N] parallel browser sessions with [M] scenarios each. This may take [estimated time] and consume significant resources. Proceed?"

**Why:** Each parallel agent opens a full browser instance. 3+ concurrent sessions or 10+ scenarios per agent on a dev machine may cause performance issues that affect the audit results themselves.

**Fast-skip:** Auto-skip for 2-role audits. Only hard-stop for 3+ roles or extreme intensity.

### 6. Fix Selection Gate [HARD-STOP] (POST-AUDIT, EVERY AUDIT)

**Trigger:** Every audit, after presenting the full issue list and overall recommendation.

**Action:** STOP and ask the user which issues to fix:
> "Which of these would you like me to fix right now? Reply with issue numbers (e.g. '01, 02, 05'), 'all', 'everything', or 'none / just the report'."

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
5. **Track agent crashes** — if an agent crashes, note the step and interaction that caused it.
   After 3 crashes on the same type of interaction (e.g., "clicking element ref after page nav"),
   add a workaround to the Agent Performance Rules.
6. **Track snapshot budget** — if agents consistently use fewer than 5 snapshots, the budget of 10
   may be too generous (wasting the rule's cognitive overhead). If agents hit 10 and need more,
   consider raising to 12.
7. **Track gate skip rate** — if a gate is auto-skipped 5+ times consecutively, consider removing
   it or merging with another gate.

When `tailwind.config.js` or `app.css` changes:
- Re-read the files and update the Color Tokens and CSS Classes tables above

---

## User Profile (auto-updated by Self-Improvement Protocol)

Track observed user patterns to optimize gate behavior. Update after each run.

| Pattern | Observed | Gate impact |
|---|---|---|
| Scenario spec style | COMPLETE — user always provides full spec | Gate 0: auto-fast-track |
| Fix preference | ALWAYS — user always wants fixes after audit | Gate 6: auto-invoke fix-audit |
| Intensity preference | EXTREME/CHAOS — user prefers thorough audits | Gate 5: show warning but don't block |
| Agent count comfort | HIGH — user comfortable with 4-8 parallel agents | Gate 5: informational only |

> **Rule:** After 3 consecutive runs with the same pattern, upgrade from observation to default.
> After 1 run that breaks the pattern, reset to neutral.

---

## Run Log

Append one row after every execution. This data drives self-improvement decisions.

| Date | Mode | Roles | Agents | Crashed | Snapshots used | Issues found | Fix invoked? |
|---|---|---|---|---|---|---|---|

> **Self-improvement triggers:**
> - Crash rate > 10% across last 5 runs → review Agent Performance Rules
> - Gate 0 skipped 5+ times → mark as permanent FAST-SKIP
> - Average snapshots < 5 per agent → reduce budget to 8
> - Fix always invoked → auto-invoke fix-audit without asking

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 4.7.0 | 2026-03-10 | **Multi-agent with varied scenarios + script-first enforcement**: (1) **Multi-agent architecture** — replaced single-agent model with multiple parallel agents, each running its own browser with a different scenario theme (e.g. "Quiet Monday", "Friday Rush", "Chaos Sunday"). Intensity maps to agent count: Light=1, Heavy=2-3, Extreme=3-4. (2) **Varied scenario sets** — B2 now generates per-agent scenario sets with a variation matrix ensuring different themes, pax counts, edge cases across agents for broader coverage. (3) **Orchestrator codebase recon (B4)** — done once by orchestrator, shared as `recon.md` with all agents. (4) **Script-first two-pass model (B5)** — agents MUST write the COMPLETE E2E script before executing ANY of it. Pass 1: open browser, snapshot each target page for real element refs, write complete `e2e-script.md`. Pass 2: execute the pre-built script command by command, audit at `[AUDIT]` and `[HANDOFF CHECK]` points. No ad-hoc exploration allowed. `[DYNAMIC-REF]` markers for elements that only appear after interaction. (5) **Agent launch (B6)** — parallel agent launch with detailed prompt template enforcing the two-pass model with prominent boxed warning against ad-hoc testing. (6) **Cross-agent synthesis (B7)** — de-duplication across agents, condition-specific `[CONDITION]` tags, confidence scoring (`[CONFIRMED]` = 2+ agents, `[SYSTEMIC]` = all agents). |
| 4.6.0 | 2026-03-10 | **Multi-user audit rewrite — single browser, sequential stints, pre-built E2E scripts**: Replaced the multi-agent parallel model (v4.4.0) with a fundamentally better approach. (1) **Single browser session** with sequential role stints via `sessionStorage` swaps — one origin = one IndexedDB = naturally shared data. No `--profile` hack, no multi-session coordination. (2) **Codebase reconnaissance (B4)** — agent reads routes, components, stores, and seed data before writing any script, extracting real selectors and available interactions. (3) **Iterative E2E script creation (B5)** — agent builds the playwright-cli script stint by stint, executing each stint and using actual snapshot element refs to inform the next stint's script. (4) **Inline handoff checks** — `[HANDOFF CHECK]` moments at every stint transition ARE the cross-role audit observations, not separate verification steps. (5) **Execute and audit (B6)** — single execution pass with write-as-you-go findings, error recovery, 30-snapshot budget across all stints. (6) Updated B2 handoff markers to use stint transitions instead of phase transitions. (7) Updated B3 approval format to show stint sequence diagram. (8) Updated B7 synthesis to work from single-agent findings file. (9) Updated Cross-Role Interaction Assessment (Section E) to use stint transition data. |
| 4.5.0 | 2026-03-10 | **Structural Proposals (Section E / Section I)**: Audits can now propose big UX/UI overhauls — new pages, tab consolidation, dedicated interfaces, workflow splits, interaction model changes. (1) Added Section E (`[SP-##]` format) to single-user template with six fields: Problem pattern (links to `[##]` issues), Current structure (ASCII), Proposed structure (ASCII), Why individual fixes won't work, The staff story, Implementation sketch. (2) Added Section I to multi-user template — same format but also references `[CR-##]` cross-role issues and cross-role structural gaps. (3) Updated Section C / Section F ("Best Day/Shift Ever" visions) to imagine ideal interfaces beyond current architecture. (4) Updated chat summary and Fix Selection Gate to present SPs separately with "discuss SP-01" and "implement SP-01" options. (5) Updated fix-audit skill to parse `[SP-##]` items and handle them as structural changes requiring dedicated agents. Max 3 SPs per audit. |
| 4.4.0 | 2026-03-10 | **Multi-user audit rewrite — shared IndexedDB + phase-based coordination**: (1) Fixed critical bug: playwright-cli named sessions (`-s=`) create isolated IndexedDB by default — agents could never see each other's data. Fix: all sessions now share `--profile=$_ux_profile` directory for common IndexedDB while keeping independent session control. (2) Replaced single parallel launch with **phase-based execution model**: Phase 1 (data producers: Staff, Sides Preparer) → handoff verification → Phase 2 (data consumers: Kitchen, Butcher) → handoff verification → Phase 3 (observers: Manager, Owner). (3) Added `[EXPECT]` directives for Phase 2+ agents — explicit data expectations they verify on first snapshot. (4) Orchestrator now performs handoff verification between phases using snapshot checks. (5) `[HANDOFF-FAIL]` records become legitimate cross-role UX findings. (6) Removed `waitForTimeout`-based coordination — data presence is guaranteed by phase ordering. (7) Updated architecture diagram to show phase flow and shared profile mechanism. |
| 4.3.0 | 2026-03-10 | **Audit folder separation**: Renamed existing `audits/` (55 old-format files) to `audits-legacy/`. New v4+ format audits now save to a fresh `audits/` folder. Updated all save path references and format enforcement warnings to reflect the split. Old files preserved for reference but clearly separated from new output. |
| 4.2.0 | 2026-03-10 | **Knowledge base expansion**: Added 5 new reference documents: (1) ENVIRONMENT.md — restaurant physical context (lighting, wet hands, viewing distance, noise, shift rhythms) with zone-specific threshold adjustments, (2) KNOWN_PATTERNS.md — digest of 11 recurring systemic issues (KP-01 to KP-11) from 53 audits with fix patterns, (3) PRD_QUICK_REF.md — feature status map from PRD to distinguish bugs vs. unbuilt vs. partial features, (4) BIR_REQUIREMENTS.md — Philippine BIR compliance for X-Read/Z-Read/receipt audits, (5) ROLE_WORKFLOWS.md — per-role shift workflows with action frequency counts and UX criticality ratings. Updated references table with "When to read" column. |
| 4.1.0 | 2026-03-10 | **Format enforcement hardening**: (1) Added "OUTPUT FORMAT — READ THIS FIRST" section near top of file with explicit anti-pattern list (P0/P1/P2 BANNED, effort/impact BANNED), (2) Added format enforcement callout in Section D template, (3) Added explicit Fix Checklist template with `[01]` IDs, (4) Warned against using old audit files as format reference — models were copying deprecated P0/P1/P2 table format from existing audits |
| 4.0.0 | 2026-03-10 | **Recommendations overhaul + Workspace rules**: (1) Section D replaced — issues now use five-field detailed dossier format (What, How to reproduce, Why this breaks, Ideal flow, The staff story) instead of table rows, (2) Dropped priority grouping (P0/P1/P2) — all issues flat sequential `[01]`, `[02]`, (3) Dropped Effort/Impact metadata, (4) WORKSPACE RULES added as top-level section — dedicated `skills/ux-audit/work/` folder, `rm -rf` clean start/end, (5) `playwright-cli screenshot` permanently banned — no exceptions, (6) Removed `comm -13` / `_ux_before` cleanup pattern from both paths, (7) Subagent prompts now require WR-4 workspace path as first section, (8) Section H (cross-role) uses same five-field format with `[CR-##]` prefix, (9) Chat summary updated to show What + staff story per issue, (10) Workspace folders are now run-scoped (`work-{run-id}/`) — concurrent audits never collide |
| 3.3.0 | 2026-03-09 | **Self-assessment overhaul**: (1) Gate classification FAST-SKIP/HARD-STOP for all 7 gates, (2) Agent crash recovery Rule 6 + orchestrator retry, (3) Fix zsh `$$` → `mktemp` for cross-shell safety, (4) Enhanced self-improvement with crash/snapshot/gate tracking, (5) User profile + run log for data-driven optimization |
| 3.0.0 | 2026-03-09 | **Agent Performance Rules**: Pre-bake auth via sessionStorage injection (skip login UI), hard snapshot budget (max 10), micro-audit pattern (5–7 steps/agent, split large roles), write-as-you-go (partial results survive crashes), known element ref shortcuts. Updated B4/B5/B6 to enforce rules. Updated architecture diagram to show split agents. |
| 2.4.0 | 2026-03-09 | Harden artifact cleanup: replace time-based `-newer` marker with exact before-snapshot diff (`comm -13`) + `.yml|.png` type-gate; orchestrator-only cleanup in multi-user path; safe for concurrent playwright-cli agents |
| 2.3.0 | 2026-03-09 | Add full issue breakdown (all findings, no summarising) + overall recommendation sentence + HITL Fix Selection Gate (gate #6) to both single-user and multi-user paths — audits now close the loop into code fixes |
| 2.2.0 | 2026-03-08 | Add mandatory `snapshot` over `screenshot` rule with rationale; reinforce in all workflow steps and agent prompt instructions |
| 2.1.0 | 2026-03-08 | Replace pre-built scenarios with dynamic scenario architect; add intensity levels (light/heavy/extreme); add script approval HITL gate; add scenario scorecard output |
| 2.0.0 | 2026-03-08 | Add multi-user audit mode: parallel agents, cross-role interaction assessment, pre-built scenarios, new HITL gates |
| 1.0.0 | 2026-03-07 | Initial skill creation |

---

## ⚠️ FORMAT REMINDER (READ LAST)

Before writing ANY audit output, verify:

1. **Section D uses `[01]`, `[02]` blocks** — NOT P0/P1/P2 tables
2. **Each issue has all five fields** — What, How to reproduce, Why this breaks, Ideal flow, The staff story
3. **Fix Checklist uses `[01]` IDs** — NOT `P0-1`, `P1-2`
4. **No Effort/Impact columns anywhere**
5. **No priority grouping anywhere**

If you catch yourself writing a table with `| ID | Issue | Location | Fix | Effort | Impact |` — STOP. That is the deprecated format. Go back and use the five-field dossier blocks from the Section D template.
