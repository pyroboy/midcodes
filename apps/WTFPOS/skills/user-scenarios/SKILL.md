---
name: user-scenarios
description: >
  Generates comprehensive, real-world user scenarios and an implementation assessment for a
  specific WTFPOS role and location. Use when the user says "create user-scenarios as <role>",
  "generate scenarios for <role>", "user scenarios for <role> role", or "create user-scenarios
  as <role> at <branch>". Produces two saved output files (scenarios + assessment) and prints
  a chat summary. Roles supported: staff, kitchen, manager, owner, admin.
version: 1.0.0
---

# User Scenarios — WTFPOS

This skill generates **25–40 real-world, location-scoped, end-to-end scenarios** for a specific
WTFPOS role, then produces an implementation assessment that maps each scenario to current
implementation status. Output is saved to `skills/user-scenarios/scenarios/` and a summary is
printed to chat.

**North star:** Every scenario must describe something that could realistically happen at
WTF! Samgyupsal — not abstract feature descriptions, but concrete situations a real employee
would face. Think past the happy path. A Friday dinner rush has 18 tables, 3 underpaid staff,
one broken tablet, a BIR inspector who just walked in, and a cook who just rage-quit.
The system must survive all of it.

## The Three Lenses for Scenario Generation

Before writing a single scenario, run the role through these three lenses:

### Lens 1 — Necessity ("What does this role NEED the system to do?")
What would make this role's job impossible without it? What data must be available?
What would cause the business to lose money, lose a customer, or fail a regulation?
These are P0 scenarios — the system is worthless without them.

### Lens 2 — Worst Case ("What is the worst thing that can realistically happen?")
Staff rage-quits mid-shift. BIR inspector walks in at 8 PM. Power dies for 3 seconds.
A drunk customer refuses to pay. A cashier deletes the wrong order. A cook forgets to log waste.
These scenarios reveal where the system breaks down and what data is unrecoverable.

### Lens 3 — People ("What happens when humans fail, not the system?")
Staff no-shows. Shift handover happens without a briefing. A new employee uses the wrong role.
A manager forgets their PIN. A staff member exits without closing their tables.
These scenarios test the system's resilience to human error and organizational chaos.

---

## References

| Reference | Purpose |
|---|---|
| `references/SCENARIO_CONTEXT.md` | Quick-ref: roles, routes, location rules, Manager PIN gates, data models |
| `USER_SCENARIOS.md` (project root) | Base scenario library — read for context, do not duplicate |
| `ORDER_SCENARIOS.md` (project root) | 39 order flow scenarios — cross-reference for ordering journeys |
| `KITCHEN_INVENTORY_SCENARIOS.md` (project root) | 32 BOH scenarios — cross-reference for kitchen/stock journeys |
| `ASSESSMENT_USER_SCENARIOS.md` (project root) | Existing gap analysis — use as baseline, extend per role |
| `src/lib/stores/session.svelte.ts` | Role definitions, ROLE_NAV_ACCESS, ELEVATED_ROLES, isWarehouseSession |
| `src/routes/` | Available pages per role |
| `PRD2.md` | Full product requirements for expected behaviors |

---

## Human in the Loop Gates

### Gate 1 — Unknown Role

**Trigger:** Role parsed from request is not one of `staff`, `kitchen`, `manager`, `owner`, `admin`.

**Action:** STOP and ask:
> "I didn't recognize the role '[X]'. Supported roles are: **staff**, **kitchen**, **manager**, **owner**, **admin**. Which role would you like scenarios for?"

### Gate 2 — Warehouse + Retail Role

**Trigger:** Location is `wh-tag` (Tagbilaran Central Warehouse) AND role is `staff` or `kitchen`.

**Action:** WARN before continuing:
> "Note: The warehouse location (`wh-tag`) has no POS or KDS access — `/pos` and `/kitchen` routes are hidden for warehouse sessions. Scenarios will be limited to stock/inventory operations only. Continue?"

### Gate 3 — Owner All-Access Warning

**Trigger:** Role is `owner` (all-access, all routes).

**Action:** WARN before generating:
> "Owner scenarios span all 5 route groups (POS, Kitchen, Stock, Reports, Admin) across all locations. This will generate 25+ scenarios. Confirm to proceed?"

---

## Workflow (8 Steps)

### Step 1 — Parse Parameters

Extract from the user's request:

| Parameter | Parsing rule | Default |
|---|---|---|
| `role` | "as `<role>`" or "for `<role>` role" | **required** — Gate 1 if missing |
| `location` | "at `<branch>`" or "for `<branch>`" | all retail locations (`tag` + `pgl`) |

Location aliases to accept:
- "tagbilaran", "alta citta", "altacitta", "tag" → `tag`
- "panglao", "alona", "alona beach", "alonabeach", "pgl" → `pgl`
- "warehouse", "wh", "wh-tag" → `wh-tag`
- "all", "both", unspecified → both retail locations

Run **Gate 1** (unknown role) and **Gate 2** (warehouse + retail role) now.

### Step 2 — Load Reference Context

Read these files before generating — do NOT skip:

1. `skills/user-scenarios/references/SCENARIO_CONTEXT.md` — role constraints table
2. `USER_SCENARIOS.md` — base scenarios (scan for the role's section, do not copy verbatim)
3. `ASSESSMENT_USER_SCENARIOS.md` — known gaps baseline (lines 1–80 are most useful)
4. `src/lib/stores/session.svelte.ts` — confirm ROLE_NAV_ACCESS for the role

**Goal of this step:** Know exactly which routes the role can access, what PIN gates exist,
and what the existing assessment already flagged as missing/partial.

### Step 3 — Generate Scenario File

Generate **25–40 scenarios** following the template in [Output Template A](#output-template-a).

Apply all three lenses (Necessity, Worst Case, People) before writing. Scenarios must span
all categories below. Do **not** copy scenarios verbatim from `USER_SCENARIOS.md`.

### Coverage Requirements

| Category | Min scenarios | Lens | Notes |
|---|---|---|---|
| Session start | 1 | People | Login, location select or lock confirmation |
| Primary daily workflows | 5–7 | Necessity | Core tasks this role does every shift |
| Regulatory & compliance | 2–3 | Worst Case | BIR inspector, health inspection, Z-Read for BIR |
| Manager PIN gates | 2–3 | Necessity | Approval flows, who gets blocked and why |
| Location-aware behavior | 2–3 | Necessity | `tag` vs `pgl` differences, cross-branch, warehouse |
| Cross-role interactions | 2–3 | People | Staff calls manager, kitchen escalates, handover |
| Staff incidents | 2–3 | Worst Case | Rage quit, no-show, early exit without closing tables, wrong role login |
| End-of-shift operations | 2 | Necessity | Z-Read, cash reconciliation, log-out handover |
| Hardware & system failure | 2–3 | Worst Case | Tablet crash, Bluetooth scale offline, printer dead, power blip |
| Financial edge cases | 2–3 | Worst Case | Wrong payment method, short drawer, unpaid table, customer dispute |
| Samgyupsal edge cases | 3–4 | Worst Case | AYCE timer abuse, meat weighing errors, 86'ing mid-rush, refill flood |
| Human error recovery | 2–3 | People | Voided wrong item, wrong pax, wrong discount, accidentally closed table |

### The Z-Read / X-Read Distinction (critical — explain in relevant scenarios)

**X-Read (Mid-Shift Audit):**
- Produces a snapshot of current cash totals without closing the shift
- Can be run multiple times per day
- Purpose: verify the drawer is correct at any point; catch theft or errors mid-service
- Does NOT reset sales counters
- BIR relevance: not a BIR document, but feeds into the Z-Read

**Z-Read (End-of-Day / EOD):**
- Closes the current shift permanently
- Resets the daily sales counter to zero
- Required by BIR (Bureau of Internal Revenue, Philippines) for official tax compliance
- Must be run once per day — running it twice creates two separate Z-Read records
- The Z-Read printout is a legal document; the owner must keep physical copies
- If the Z-Read is not run, the next day's sales add on top of the previous day — this is a BIR violation
- A BIR inspector can walk in at any time and demand to see the Z-Read records for the last 30 days

### The BIR Inspector Scenario (must include for manager and owner roles)

The BIR (Bureau of Internal Revenue) enforces tax compliance in the Philippines. A BIR inspector
can arrive unannounced at any operating business. They will typically ask for:
1. The current official receipt (OR) machine or POS receipt printout
2. The Z-Read records (called "Daily Sales Report") for the past 30 days
3. The VAT registration certificate
4. Evidence that the POS is BIR-accredited

The POS system must be able to produce, on demand:
- A Z-Read for any specific past date
- A summary of daily sales for a date range
- Receipts that show the required BIR fields: TIN, address, OR number, VAT breakdown

### Staff Incident Scenarios (must include rage quit, early exit, and no-show)

**Rage quit / walkout:** A staff member storms out mid-shift. Tables they were assigned to (if
server tracking is implemented) are now orphaned. Open orders may exist on their device session.
The manager must: identify which tables were affected, reassign or take over, ensure no order
is lost, and potentially deal with customers who saw the incident.

**Early exit without closing tables:** A cashier finishes their shift and logs out while 3 tables
are still active and mid-order. The next cashier logs in and finds active orders without context.
The manager must identify the state of each table from the POS without the previous cashier's
verbal handover.

**No-show / understaffed shift:** Only 1 cashier shows up instead of 3 for a Friday dinner rush.
The manager must handle POS duties themselves, approve their own PIN gates (conflict of interest),
and potentially call in the owner for oversight.

**Wrong role login:** A kitchen staff member accidentally logs in as a staff (cashier) role and
starts interacting with the POS instead of the KDS. Orders placed via POS don't show up on the
kitchen's device. Manager must identify the mismatch and correct it.

### Step 4 — Generate Assessment File

For each scenario, assess implementation status following [Output Template B](#output-template-b).

Status definitions:
- **IMPLEMENTED** — Route exists, data is wired, the scenario works end-to-end today
- **PARTIAL** — Route exists but data is missing, PIN gate is absent, or flow is incomplete
- **MISSING** — No route, no component, or feature is explicitly marked Phase 2+

Use `ASSESSMENT_USER_SCENARIOS.md` as the baseline — if a scenario maps to a known gap there,
inherit its status. For new scenarios, reason from the route list and known store capabilities.

### Step 5 — Save Scenario File

Save to:
```
skills/user-scenarios/scenarios/YYYY-MM-DD_scenarios-<role>-<location>.md
```

**Naming convention:**
- Date: today's date in `YYYY-MM-DD`
- Role: lowercase role name (`staff`, `kitchen`, `manager`, `owner`, `admin`)
- Location: `altacitta`, `alonabeach`, `warehouse`, or `all`

Example: `2026-03-07_scenarios-manager-altacitta.md`

### Step 6 — Save Assessment File

Save to:
```
skills/user-scenarios/scenarios/YYYY-MM-DD_assessment-<role>-<location>.md
```

Example: `2026-03-07_assessment-manager-altacitta.md`

### Step 7 — Print Chat Summary

After both files are saved, print the summary to chat using the format in
[Chat Summary Template](#chat-summary-template). Always include:
- File paths saved
- Scenario count
- IMPLEMENTED / PARTIAL / MISSING counts + percentages
- Top 3 P0 gaps
- Overall readiness score

### Step 8 — Self-Improvement Check

After printing the summary, offer:
> "If any scenario doesn't match what you've seen in the app, let me know and I'll update the file."

---

## Output Template A

```markdown
# User Scenarios — <Role> @ <Location> (<Date>)

## Role Context

- **Accessible routes:** [list from ROLE_NAV_ACCESS]
- **Location scope:** [tag / pgl / wh-tag / all — and what that means for this role]
- **Location switching:** [locked / free — and which locations]
- **Manager PIN required for:** [list specific operations that require PIN 1234]
- **Cannot do:** [explicit locked capabilities for this role]

---

## Scenarios

### SC-1: <Title>

**Situation:** [Real-world trigger — what happened in the restaurant that caused this scenario]
**Actor:** <role> @ <branch name>
**Journey:**
1. [Step — be specific: what they tap, what they see, what the system does]
2. [Step]
3. [Step]
...
**Expected system behavior:** [What the app should do — observable outcomes]
**Edge cases:** [What could go wrong, boundary inputs, unusual states]
**Success criteria:** [Observable outcome that confirms the scenario completed correctly]
**Failure criteria:** [What a broken experience looks like — what the user sees when it fails]

---

### SC-2: <Title>
...
```

---

## Output Template B

```markdown
# Assessment — <Role> Scenarios @ <Location> (<Date>)

## Coverage Summary

| Status | Count | % |
|---|---|---|
| Implemented | X | X% |
| Partial | X | X% |
| Missing | X | X% |
| **Total** | **X** | **100%** |

---

## Per-Scenario Status

| SC# | Title | Status | Primary Route | Notes |
|---|---|---|---|---|
| SC-1 | ... | IMPLEMENTED / PARTIAL / MISSING | /pos | ... |
| SC-2 | ... | ... | ... | ... |

---

## Priority Gap Table

| Priority | Gap | Blocking real use? | Effort |
|---|---|---|---|
| P0 | [Critical gap — user cannot complete their primary job] | Yes | S/M/L |
| P1 | [Friction gap — user can work but is slowed] | No | S/M/L |
| P2 | [Polish gap — nice-to-have, not urgent] | No | S/M/L |

**Effort:** S = < 1 hour, M = 1–4 hours, L = 4+ hours

---

## Overall Readiness Score

**[X/Y] scenarios fully implemented = X% production-ready for <Role> @ <Location>**

---

## Recommended Next Implementation

The top 3 missing scenarios that would unblock the most real-world use:

1. **SC-X: <Title>** — [Why this is the most impactful gap]
2. **SC-X: <Title>** — [Why this is second priority]
3. **SC-X: <Title>** — [Why this is third priority]
```

---

## Chat Summary Template

```
## User Scenarios Generated

**Role:** <Role> | **Location:** <Location name> (<locationId>)
**Date:** <YYYY-MM-DD>

**Files saved:**
  - skills/user-scenarios/scenarios/<filename>_scenarios.md  (<N> scenarios)
  - skills/user-scenarios/scenarios/<filename>_assessment.md

**Assessment snapshot:**
  - Implemented:  X / N  (X%)
  - Partial:      X / N  (X%)
  - Missing:      X / N  (X%)

**Top gaps (P0):**
  1. <SC#: Title> — <one-line reason it's P0>
  2. <SC#: Title> — <one-line reason it's P0>
  3. <SC#: Title> — <one-line reason it's P0>

**Overall readiness:** X% production-ready for <Role> role at <Location>
```

---

## Self-Improvement Protocol

- **User corrects a scenario** → update the saved `.md` file immediately, then acknowledge the fix
- **New route added to WTFPOS** → add it to the routes table in `references/SCENARIO_CONTEXT.md`
- **Role permissions change in `session.svelte.ts`** → update the role constraints table in `SCENARIO_CONTEXT.md`
- **A gap is fixed (feature shipped)** → if the user confirms, update the assessment file's status for that scenario and recalculate the readiness score
- **New scenario category emerges** → add it to the coverage requirements table in Step 3

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-03-07 | Initial skill creation |
| 1.1.0 | 2026-03-07 | Expanded to 25–40 scenarios; added three lenses framework; added regulatory/compliance, staff incidents, Z-Read/X-Read distinction, BIR inspector, and human error categories |
