---
name: fix-audit
description: >
  Coordinates parallel agents to fix issues from UX audit reports. Reads an audit file,
  presents each issue as a before/after/insight/validate breakdown, asks the user once
  at the end to acknowledge, splits work across agents by module, updates the audit file
  with checkboxes and fix summaries in-place, and runs pnpm check after all fixes land.
  Use when the user says "fix audit issues", "fix the audit", "fix all issues",
  "fix-audit", "fix the UX issues", "implement audit fixes", "resolve audit findings",
  or references a specific audit report file and asks to fix it. Also triggers on
  "fix [01]", "fix everything from the audit", or "fix issues".
version: 5.0.0
---

# Audit Issue Fix — WTFPOS

Takes a UX audit report (from the `ux-audit` skill) and turns findings into code fixes.
For each issue, presents a clear **before → after** picture validated against the Design Bible,
coordinates parallel agents by module ownership, updates the audit file with checkboxes +
fix summaries, and validates with `pnpm check`.

**North star:** Every audit should close the loop into code. This skill is the bridge
between "we found 44 issues" and "we fixed 44 issues." The **Ideal flow** from each issue's
five-field dossier becomes the acceptance criteria — the fix is only done when that flow is achieved.
The Design Bible's 14 principles provide the validation lens for every fix.

---

## References

| Reference | Purpose |
|---|---|
| `skills/ux-audit/audits/` | v4+ format audit reports (new) — primary input files for this skill |
| `skills/ux-audit/audits-legacy/` | Pre-v4 format audits (old P0/P1/P2 format) — can still be used as input but issues use different ID format |
| `skills/ux-audit/SKILL.md` | Audit report format (Section D / Recommendations — five-field dossier) |
| `skills/ux-audit/references/DESIGN_BIBLE.md` | 14 UX principles used for validation scoring (Hick's Law, Fitts's Law, Miller's Law, etc.) |
| `skills/ux-audit/references/AUDIT_PROMPTS.md` | 110 audit prompt templates for re-auditing after fixes |
| `CLAUDE.md` (project root) | WTFPOS coding conventions, file structure, development rules |

---

## WORKSPACE RULES (READ FIRST AND LAST)

These rules apply to the orchestrator AND every subagent. Re-read before cleanup.

**WR-1 — NEVER take screenshots.**
Screenshots are permanently banned. They waste tokens and execution time.
Use `playwright-cli snapshot` for structured page state. Never `screenshot`.

**WR-2 — Run-scoped workspace folder.**
Every fix-audit run creates one workspace folder with a unique run ID:
```bash
_fix_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_fix_work="skills/fix-audit/work-${_fix_run_id}"
mkdir -p "$_fix_work"
```
All agent subfolders live inside: `$_fix_work/agent-1/`, `$_fix_work/agent-2/`, etc.

**WR-3 — Clean start, clean end.**
- **Start:** Create `$_fix_work` at the beginning of the run. No leftover files from previous runs.
- **End:** After Gate 5 report is delivered, delete the entire workspace: `rm -rf "$_fix_work"`
- If the run crashes, the folder stays for debugging. Next run creates a fresh one.

**WR-4 — Agent prompts include workspace path + result file.**
Every agent prompt MUST include this block verbatim (with the actual path substituted):
```
## WORKSPACE RULES
1. Your workspace folder: `skills/fix-audit/work-{run-id}/agent-{N}/`
2. NEVER take screenshots — they waste tokens and execution time
3. Write any scratch notes or temp files ONLY inside your workspace folder
4. Clean up: the orchestrator handles workspace deletion — do NOT delete your own folder
5. Write your results to `results.md` in your workspace folder using the EXACT delimited format
```

---

## Output

This skill **modifies the original audit file in-place**. The original five-field dossier is
**preserved intact** — fix results are **appended below** it, never replacing it. This ensures
retry agents have full context if an issue fails and needs a second pass.

After fixing, each issue becomes:

```markdown
- [x] **[01]** · Staff · **SVG floor tile click targets overlap**
  > **What:** Adjacent tables share SVG hit areas — tapping one opens the neighbour.
  > **How to reproduce:**
  > 1. Open POS floor plan with 8+ tables
  > 2. Tap table T3 when T4 is directly adjacent
  > 3. T4 opens instead of T3
  > **Why this breaks:** Ate Rose serves 40 tables per shift. One wrong tap = walk to wrong table.
  > **Ideal flow:** Each table has an isolated 8px hit region — tapping always opens the correct table.
  > **The staff story:** "I tapped Table 3 but Table 4 opened — had to apologize." — Ate Rose
  > **Affected role(s):** Staff
  >
  > ---
  > **Fix:** Added explicit pointer-events regions with 8px padding between SVG table `<g>`
  > elements in `FloorPlan.svelte`. Verified on 1024×768 viewport with 8 adjacent tables.
  > **Validate:** Fitts's Law ✅ (≥44px) · Gestalt (Proximity) ✅ (8px gap) · Visibility of System Status ✅
  > **Snapshot:** ✅ Verified — table elements present with isolated hit regions in accessibility tree
```

**Why preserve the dossier:** If [01] fails and you re-run fix-audit, the retry agent sees the
full "How to reproduce" steps and "Staff story" — not just a collapsed Before/After sentence.

---

## Human in the Loop Gates

### Gate 1 — Audit File Selection [FAST-SKIP]

**Trigger:** Every time this skill is invoked.

**Action:** If the user did not specify an audit file, list recent audits and ask:

> **Which audit report should I fix?**
>
> Recent audits:
> - `2026-03-09_chaos-full-service-all-roles-altacitta.md` (44 issues)
> - `2026-03-09_expenses-manager-tag-chaotic.md` (18 issues)
> - ...
>
> Paste the filename, or say "latest" for the most recent.

**Skip if:** User already specified a file path or said "fix the audit" in a conversation
where only one audit has been discussed.

---

### Gate 2 — Issue Walkthrough & Acknowledgment (THE CORE GATE) [FAST-SKIP]

**Trigger:** After reading the audit file.

**Action:** Read the Design Bible (`skills/ux-audit/references/DESIGN_BIBLE.md`). Present **all
issues as a single flat list** using the **before / after / insight / validate** format. Each issue
draws its data from the five-field dossier in the audit file. After the full list, ask **one
question** at the end.

**How to build each issue block:**

| Field | Source from audit dossier | What to write |
|---|---|---|
| **Before** | "How to reproduce" steps | Describe the broken experience in one sentence (user perspective) |
| **After** | "Ideal flow" acceptance criteria | Describe the fixed experience in one sentence (user perspective) |
| **Insight** | "Why this breaks" + "The staff story" | Justify why this fix matters — use the persona story |
| **Validate** | Design Bible principles | List 2–4 Design Bible principles this fix satisfies (from the 14 in DESIGN_BIBLE.md) |

**Format — present like this:**

```
## All Issues (44 total)

[01] · Staff · SVG floor tile click targets overlap
  Before:  Tapping a table on a crowded floor plan opens the adjacent table instead.
  After:   Each table has an isolated hit region — tapping always opens the correct table.
  Insight: Ate Rose serves 40 tables per shift. One wrong tap means walking to the wrong
           table, apologizing, walking back. Multiply by 10 mistakes per rush hour.
  Validate: Fitts's Law · Gestalt (Proximity) · Visibility of System Status

[02] · Staff · Custom pax input bypasses table capacity
  Before:  A cashier can type 12 pax for a 4-seat table with no warning.
  After:   Pax input is capped at table capacity with a clear "max 4 seats" message.
  Insight: Overcounting pax means wrong AYCE charges. Boss Chris loses ₱399 per phantom guest.
  Validate: Error Prevention · Consistency · Hick's Law

[03] · Staff · Cash preset buttons are 32px
  Before:  Cash denomination buttons are too small — stressed cashier mistaps during checkout.
  After:   Cash buttons are 44px+ touch targets with clear spacing between denominations.
  Insight: "I accidentally hit ₱500 instead of ₱1000 and gave wrong change." — Ate Rose
  Validate: Fitts's Law · Motor Efficiency · WCAG Touch Targets

[... all issues listed ...]

> **Fix all 44 issues?** Reply "yes" to confirm.
> To skip specific issues: "skip [16], [22]"
> To adjust a fix direction: "[05]: 'I want the button hidden, not disabled'"
```

**Rules for building the before/after:**

1. **Before** is always a broken user experience, not a code description
2. **After** is always the ideal user experience — pulled from the audit's "Ideal flow" field
3. **Insight** justifies the fix using the named persona (Ate Rose, Kuya Marc, Sir Dan, Boss Chris) and the "Why this breaks" / "The staff story" from the dossier
4. **Validate** lists 2–4 Design Bible principles this fix addresses. Common principles:
   - Hick's Law, Fitts's Law, Miller's Law, Jakob's Law, Doherty Threshold
   - Visibility of System Status, Error Prevention, Consistency, Recognition over Recall
   - Gestalt (Proximity / Similarity / Closure), Visual Hierarchy, WCAG, Motor Efficiency
5. The **After** sentence becomes the **acceptance criteria** — agents must achieve this state
6. The **Validate** principles become the **quality check** — agents reference these when implementing

**Shorthand the user can use:**
- `yes` — accept all issues as presented
- `yes, but [05]: "I want the button hidden, not disabled"` — accept all, override one
- `skip [16], [18]` — skip specific issues

**Fast-track rule:** If the user says "yes", "all", "fix them", "do it", or any blanket affirmative
in their **invocation message** (e.g., "fix-audit latest, yes to all"), skip the full issue listing.
Instead show a one-line confirmation:

> **[N] issues acknowledged with before/after specs. Proceeding to agent plan.**

This saves ~2,000 output tokens. Only present the full list if the user needs to review individual issues.

---

### Gate 3 — Agent Plan Approval [HARD-STOP]

**Trigger:** After all issues are acknowledged.

**Action:** Present the agent split plan:

> **Here's how I'll split the work across [N] agents:**
>
> | Agent | Module | Issues | Files | Est. |
> |---|---|---|---|---|
> | 1 | POS / Staff | [01], [02], [06], [08], [09] | FloorPlan, PaxModal, VoidModal, OrderSidebar | ~8 min |
> | 2 | Kitchen / KDS | [11]–[17] | kitchen/orders, InventoryTable, InventoryItemRow | ~10 min |
> | 3 | Checkout + Session | [03], [04], [05], [07], [10] | CheckoutModal, session.svelte, AppSidebar | ~8 min |
> | 4 | Weigh Station | [18], [19], [20]–[22] | kitchen/+layout, weigh-station, YieldCalculator | ~8 min |
>
> **Total: [N] issues across [M] agents, ~[T] minutes**
>
> Proceed? Or adjust the split?

---

### Gate 4 — Schema Change Warning [HARD-STOP]

**Trigger:** Any acknowledged issue requires modifying an RxDB schema.

**Action:** STOP and warn:

> **Schema change required for [ID].**
> This bumps `[collection]` from v[N] → v[N+1] and requires a migration in `db/index.ts`.
> Existing data on real devices will be migrated.
>
> Should I proceed? (Y/N)

---

### Gate 5 — Post-Fix Report & Validation Check [HARD-STOP]

**Trigger:** After all agents complete.

**Action:** Present results as an **ASCII colored summary report** followed by the per-issue validation table. Always render this — never collapse to a plain markdown table.

---

#### ASCII Summary Report Format

Render a full-width box-drawing summary block, then a per-issue table. Use the exact
Unicode box characters below so the output looks consistent in the terminal.

**Block 1 — Scoreboard (always rendered first):**

```
╔══════════════════════════════════════════════════════════╗
║  FIX SUMMARY · [audit_filename]                          ║
║  [YYYY-MM-DD] · [N] issues processed                    ║
╠═══════════════╤═══════════════╤══════════════════════════╣
║ Status        │ Count         │ Rate                     ║
╠═══════════════╪═══════════════╪══════════════════════════╣
║  ✅ Fixed     │  [N]          │  [%]%                    ║
║  ❌ Failed    │  [N]          │  [%]%                    ║
╠═══════════════╪═══════════════╪══════════════════════════╣
║  TOTAL        │  [N]          │  100%                    ║
╚═══════════════╧═══════════════╧══════════════════════════╝

  pnpm check  ·  ✅ PASS (0 new errors)
  Validate pass: [N]/[N] ([%]%)   |   Snapshot verified: [N]/[N] ([%]%)
```

If `pnpm check` failed, replace with:
```
  pnpm check  ·  ❌ FAIL — [N] new error(s)
  Validate pass: [N]/[N] ([%]%)   |   Snapshot verified: [N]/[N] ([%]%)
```

**Block 2 — Per-issue validation table:**

```
╔═══════╤══════════════════════════════════════╤══════════╤══════════════════════════╤══════════╗
║ ID    │ Issue                                │ Status   │ Validate                 │ Snapshot ║
╠═══════╪══════════════════════════════════════╪══════════╪══════════════════════════╪══════════╣
║ [01]  │ SVG floor tile click targets overlap │ ✅ FIXED │ Fitts ✅ · Gestalt ✅    │ ✅ YES   ║
║ [02]  │ Custom pax input bypasses capacity   │ ✅ FIXED │ ErrorPrev ✅ · Hick's ✅ │ ✅ YES   ║
║ [15]  │ No floor badge after kitchen refuse  │ ❌ FAIL  │ ❌ type error            │ ❌ NO    ║
╚═══════╧══════════════════════════════════════╧══════════╧══════════════════════════╧══════════╝
```

**Rendering rules:**
1. Status cell: `✅ FIXED` / `❌ FAIL`
2. Validate cell: abbreviated principle names with ✅/❌ per principle, or `❌ [reason]` if failed
3. Snapshot cell: `✅ YES` / `❌ NO` / `⏭ SKIP` / `—` (N/A)
3. Truncate long text to fit column width — wrap with `…` rather than breaking the table border
4. Sort rows: sequential by issue number [01], [02], ... [CR-01], [CR-02]
5. If any issue FAILED, add a **Failed Issues** section below the table:

```
  ── FAILED ISSUES ─────────────────────────────────────────────────────────
  ❌ [15]  No floor badge after kitchen refuse
           Reason: Type error in FloorPlan.svelte — kitchenAlerts not on table type
           Validate: Visibility of System Status ❌ (badge never rendered) · Gestalt ❌
           Snapshot: ❌ Component crashes on render
           Next: Attempt manual fix or re-audit to confirm scope
  ──────────────────────────────────────────────────────────────────────────
```

**Block 3 — Re-audit prompt (always last):**

```
  ── NEXT STEP ─────────────────────────────────────────────────────────────
  Run a re-audit to verify fixes?
  Suggested prompt: "[paste from AUDIT_PROMPTS.md matching the audited flow]"
  ──────────────────────────────────────────────────────────────────────────
```

---

## Workflow

### Step 1 — Parse Input

Extract from the user's request:

| Parameter | Parsing rule | Default |
|---|---|---|
| `audit_file` | File path or filename from `skills/ux-audit/audits/` | Gate 1 if missing |
| `scope` | "all", specific issue numbers like "[01], [05]", or "skip [16]" | Gate 2 always |

---

### Step 1.5 — Create Workspace

```bash
_fix_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_fix_work="skills/fix-audit/work-${_fix_run_id}"
mkdir -p "$_fix_work"
```

This folder holds all agent scratch work. Each agent gets `$_fix_work/agent-{N}/`.

---

### Step 2 — Read & Parse the Audit File

Read the audit file. Also read the Design Bible (`skills/ux-audit/references/DESIGN_BIBLE.md`).

Parse each issue from the five-field dossier format (ux-audit v4.0+):

```
{
  id: "[01]",
  role: "Staff",
  title: "SVG floor tile click targets overlap",
  what: "Adjacent tables share hit areas...",
  how_to_reproduce: ["1. Open POS floor plan", "2. Tap table T3...", ...],
  why_this_breaks: "Ate Rose serves 40 tables per shift...",
  ideal_flow: "Each table has an isolated 8px hit region...",
  staff_story: "\"I tapped Table 3 but Table 4 opened...\" — Ate Rose",
  affected_roles: ["Staff"],
  // Built at Gate 2 from the above + Design Bible:
  before: "",    // derived from how_to_reproduce
  after: "",     // derived from ideal_flow
  insight: "",   // derived from why_this_breaks + staff_story
  validate: []   // 2-4 Design Bible principles
}
```

**Parsing rules:**
- Issues use `##### [01]` headers with sequential flat numbering — no P0/P1/P2 prefixes
- Cross-role issues use `##### [CR-01]` headers — treat identically
- There is no effort/impact metadata — all issues are equal weight
- **Structural proposals** use `##### [SP-01]` headers — these are NOT element-level fixes.
  SPs propose new pages, tab reorganization, input consolidation, or workflow restructuring.
  They use a different format (Problem pattern, Current structure, Proposed structure, etc.)
  and require **explicit user confirmation before implementation**. When parsing an audit file:
  - Parse `[SP-##]` items separately from `[##]` and `[CR-##]` items
  - At Gate 2, present SPs last with the note: "These are structural proposals, not element fixes. Implementing them creates new routes/components. Want to include any?"
  - If the user says yes to an SP, treat its "Implementation sketch" field as the scope definition and its "Proposed structure" as the acceptance criteria
  - SPs typically spawn their own dedicated agent(s) since they affect multiple files and may create new routes

---

### Step 3 — Gate 2 Walkthrough

Present all issues as a single flat list using the before/after/insight/validate format.
Ask one question at the end. Collect user acknowledgments and any overridden After statements.

After Gate 2, you have a final list of **acknowledged issues** with before/after specs.

---

### Step 3.5 — Map File Dependencies Per Issue

For each acknowledged issue, the orchestrator maps the **file dependency chain** — not just the
file to modify, but the files the agent must READ to understand the data flow.

**How to build the dependency map:**

1. Start from the issue's "How to reproduce" steps — identify the component(s) the user interacts with
2. Trace the data flow: which store does that component read from? Which collection backs that store?
3. List files in order: **Read first** (understand the chain) → **Modify** (make the change)

**Example — [02] No floor badge after kitchen refuse:**

```
Read first (data flow):
  1. src/lib/stores/pos/kds.svelte.ts         ← KDS ticket state, refusal status
  2. src/lib/stores/floor-layout.svelte.ts     ← floor data source (tables + elements)
  3. src/lib/db/schemas.ts                     ← kds_tickets schema (check for refusal fields)
Modify:
  1. src/lib/components/pos/FloorPlan.svelte   ← render badge on tile
  2. src/lib/stores/pos/kds.svelte.ts          ← add helper: getRefusedTableIds()
```

**Example — [01] Cash preset buttons are 32px:**

```
Read first:
  1. src/lib/components/pos/CheckoutModal.svelte  ← the only file involved
Modify:
  1. src/lib/components/pos/CheckoutModal.svelte  ← change button height + gap
```

**Rules:**
- Simple CSS fixes: read and modify lists are usually the same single file
- Cross-module fixes: read list is typically 3-5 files tracing the reactive chain
- If the orchestrator is unsure about the data flow, it should READ the files itself before building the map
- The dependency map feeds directly into Step 5 (agent prompts) as "Files to read first" and "Files to modify"

---

### Step 4 — Plan Agent Split

Group acknowledged issues by **file ownership** to prevent merge conflicts.

**Splitting rules:**

1. **Never assign the same file to two agents.** Same file = same agent.
2. **Group by module first**, then resolve file overlaps:
   - POS: `pos/*.svelte`, `stores/pos/orders.svelte.ts`, `stores/pos/tables.svelte.ts`
   - Kitchen: `kitchen/**/*.svelte`, `stores/pos/kds.svelte.ts`
   - Stock: `stock/**/*.svelte`, `stores/stock.svelte.ts`
   - Reports: `reports/**/*.svelte`
   - Expenses: `routes/expenses/`, `stores/expenses.svelte.ts`
   - Session/Sidebar: `stores/session.svelte.ts`, `AppSidebar.svelte`
   - DB/Schema: `db/schemas.ts`, `db/index.ts`
3. Minimum 3 issues per agent (unless only 1-2 acknowledged).
4. Maximum 8 agents.
5. Simple fixes (CSS, copy, token changes): batch 8-10 per agent. Complex fixes (logic, schema, multi-file): max 4-5 per agent.

**Agent count heuristic:**

| Acknowledged issues | Agent count |
|---|---|
| 1–4 | 1 |
| 5–12 | 2 |
| 13–24 | 3–4 |
| 25–40 | 4–6 |
| 40+ | 6–8 |

---

### Step 5 — Build Agent Prompts

Each agent prompt MUST include:

1. **Workspace rules** — Run-scoped folder path + screenshot ban (see Agent Prompt Template)
2. **Role identity** — "You are fixing UX audit issues in the WTFPOS SvelteKit app"
3. **Design Bible** — "Read `skills/ux-audit/references/DESIGN_BIBLE.md` for the 14 UX principles"
4. **WTFPOS conventions** — "Follow all conventions in `CLAUDE.md` at project root" (do NOT duplicate the full list — agents load CLAUDE.md themselves)
5. **Exact issue list** — ID, title, before/after/insight/validate for each issue
6. **After as acceptance criteria** — "The fix is done when the After state is achieved"
7. **Validate with rubric** — Each principle has a concrete pass criterion (see Validate Rubric below)
8. **File dependency map** — From Step 3.5: "Read first" (data flow) and "Modify" (change targets)
9. **Post-fix snapshot verification** — "Run `playwright-cli snapshot` and verify the fix in the accessibility tree"
10. **Verification** — "Run `pnpm check` after all changes and fix any type errors"
11. **Result file** — "Write results to `results.md` in your workspace folder using the exact format below"

#### Validate Rubric

When building agent prompts, expand each Validate principle into a **concrete pass criterion**
based on the issue context. Do NOT leave principles as bare names — agents need checkable criteria.

| Principle | Pass criterion template |
|---|---|
| Fitts's Law | All tap targets ≥ `{size}` with ≥ `{gap}` gap between adjacent targets |
| Hick's Law | User chooses from ≤ `{N}` visible options at decision point |
| Miller's Law | No more than `{N}` items in a single group/list without chunking |
| Jakob's Law | Interaction pattern matches standard POS/restaurant convention: `{pattern}` |
| Doherty Threshold | Feedback visible within `{ms}`ms of user action |
| Visibility of System Status | State change `{what}` is visible without user action, within `{ms}`ms |
| Error Prevention | Invalid input `{what}` is blocked/warned before submission |
| Consistency | Element matches existing pattern in `{reference component}` |
| Recognition over Recall | `{what}` is visible on screen, not requiring memory |
| Gestalt (Proximity) | Related elements `{what}` are within `{px}`px; unrelated separated by ≥ `{px}`px |
| Gestalt (Similarity) | Same-function elements share `{visual property}` |
| Visual Hierarchy | Primary action is visually dominant via `{method}` (size/color/position) |
| WCAG Touch Targets | Touch target ≥ 44×44px with ≥ 8px spacing |
| Motor Efficiency | Action requires ≤ `{N}` taps/steps to complete |

**Example — expanding for issue [01] Cash preset buttons:**
```
Validate:
- Fitts's Law: All cash preset buttons ≥ 44px height with ≥ 8px gap between adjacent buttons
- Motor Efficiency: Selecting a cash denomination requires exactly 1 tap (no scroll, no expand)
- WCAG Touch Targets: Each button ≥ 44×44px with ≥ 8px spacing to neighbours
```

The orchestrator fills in the `{placeholders}` based on the issue context. This gives the agent
a checkable rubric, not just a principle name to self-grade.

---

### Step 6 — Launch Agents

Create agent subfolders and launch all agents **in a single message** using parallel `Agent` tool calls.

```bash
mkdir -p "$_fix_work/agent-1" "$_fix_work/agent-2" "$_fix_work/agent-3"  # etc.
```

- Each agent prompt includes the workspace path from WR-4
- `run_in_background: true` for all agents
- Each agent runs `pnpm check` at the end
- Each agent runs `playwright-cli snapshot` to verify UI changes (see Post-Fix Snapshot Verification)
- If `pnpm check` fails, agent attempts to fix before returning

#### Post-Fix Snapshot Verification (Agent-Side)

After implementing fixes and passing `pnpm check`, each agent MUST verify UI-facing changes
using `playwright-cli snapshot`. This catches "code compiles but UI is wrong" failures.

**Agent verification steps:**

1. Open the app: `playwright-cli open http://localhost:5173`
2. Navigate to the page affected by the fix (follow the "How to reproduce" steps from the dossier)
3. Run `playwright-cli snapshot` to get the accessibility tree
4. Check the snapshot for the expected state:
   - **Size/spacing fix:** Look for the element — does it exist? Are its properties correct?
   - **New element (badge, indicator):** Does the element appear in the tree with the right role/label?
   - **Conditional rendering:** Trigger the condition — does the element appear/disappear?
   - **State change:** Perform the action — does the snapshot reflect the new state?
5. Record the result in `SNAPSHOT_VERIFIED` field of the result file

**What to check per principle type:**

| Principle | What to verify in snapshot |
|---|---|
| Fitts's Law / WCAG | Element exists with role=button or role=link — size cannot be read from snapshot, but existence confirms rendering |
| Visibility of System Status | Status element appears in tree after trigger action (e.g., badge after refuse) |
| Error Prevention | Error message / guard appears when invalid input is attempted |
| Gestalt (Proximity) | Related elements are siblings or close in tree structure |
| Hick's Law | Count visible options at decision point in snapshot |

**Rules:**
- NEVER use `playwright-cli screenshot` — only `snapshot`
- If the dev server isn't running, skip snapshot verification and note `SNAPSHOT_VERIFIED: SKIPPED (no dev server)`
- If the fix is purely backend/store logic with no UI change, note `SNAPSHOT_VERIFIED: N/A (no UI change)`
- Close the browser session after verification: `playwright-cli close`

---

### Step 7 — Collect Results

As each agent completes, **read its result file** — do NOT parse chat output:

```bash
cat "$_fix_work/agent-1/results.md"
cat "$_fix_work/agent-2/results.md"
# etc.
```

**Parsing rules:**
1. Read the header block (`<!-- RUN ... -->` + `<!-- ISSUES: ... -->`) — verify the run ID matches the current run. If it doesn't, the file is stale from a previous crashed run — ignore it
2. Split on `<!-- RESULT [ID] -->` ... `<!-- END [ID] -->` delimiters
3. Extract `STATUS`, `FILE`, `BEFORE_AFTER`, `VALIDATE`, `SNAPSHOT_VERIFIED`, `SUMMARY`, `PNPM_CHECK` fields
4. If a result file is missing → agent crashed before writing anything → mark all its issues NOT ATTEMPTED
5. If a result file is truncated (has `<!-- RESULT [05] -->` but no `<!-- END [05] -->`) → agent crashed mid-issue → mark that issue FAILED with reason "agent crash — partial output"
5. Map each fix back to its **After** — does the BEFORE_AFTER field confirm the after-state was achieved?
6. Check **Validate** field — are all principles marked ✅ with concrete criterion results?
7. Check **SNAPSHOT_VERIFIED** — did the agent confirm the UI change in the accessibility tree?
   - `YES` = UI verified, high confidence
   - `NO` = UI check failed, treat as soft warning (fix may still be correct if pnpm check passes)
   - `SKIPPED` = dev server not running, acceptable
   - `N/A` = no UI change (store/logic only), acceptable

**Why file-based:** Chat output is free-text and formatting varies between agents. The delimited
result file is mechanically parseable — no ambiguity, no missed results from extra newlines or
label variations.

---

### Step 8 — Update the Audit File

Transform the original audit file in-place. **Preserve the original five-field dossier** and
append fix results below a `---` separator inside the same blockquote.

**Per-issue format (fixed):**
```markdown
- [x] **[01]** · Staff · **SVG floor tile click targets overlap**
  > **What:** Adjacent tables share SVG hit areas...
  > **How to reproduce:**
  > 1. Open POS floor plan with 8+ tables
  > 2. Tap table T3 when T4 is directly adjacent
  > 3. T4 opens instead of T3
  > **Why this breaks:** Ate Rose serves 40 tables per shift...
  > **Ideal flow:** Each table has an isolated 8px hit region...
  > **The staff story:** "I tapped Table 3 but Table 4 opened..." — Ate Rose
  > **Affected role(s):** Staff
  >
  > ---
  > **Fix:** Added 8px pointer-events padding between SVG `<g>` table elements in FloorPlan.svelte.
  > Tested with 8 adjacent tables on 1024×768 viewport. pnpm check passes.
  > **Validate:** Fitts's Law ✅ (≥44px) · Gestalt (Proximity) ✅ (8px gap) · Visibility of System Status ✅
  > **Snapshot:** ✅ Verified — button elements present in checkout accessibility tree
```

**Per-issue format (failed):**
```markdown
- [ ] **[15]** · Kitchen · **No per-table floor badge after kitchen refuse** — FAILED
  > **What:** No visual cue on floor plan when kitchen refuses...
  > **How to reproduce:**
  > 1. Open kitchen orders, refuse an item on table T5
  > 2. Switch to POS floor plan
  > 3. No badge visible on T5
  > **Why this breaks:** Staff keeps sending orders to a table the kitchen already flagged...
  > **Ideal flow:** Staff sees a persistent badge on the floor tile...
  > **The staff story:** "Kitchen refused the pork belly but I didn't know..." — Ate Rose
  > **Affected role(s):** Staff, Kitchen
  >
  > ---
  > **Failure:** Type error in FloorPlan.svelte — `kitchenAlerts` property not found on table type.
  > **Validate:** Visibility of System Status ❌ (badge never rendered) · Gestalt (Proximity) ❌
  > **Snapshot:** ❌ Could not verify — component crashes on render
```

**Rule:** Everything above the `---` inside the blockquote is the **original dossier** — never
modify it. Everything below is the **fix result** — written by the orchestrator from agent output.

**Add Fix Summary at top of file:**

```markdown
## Fix Summary (YYYY-MM-DD)

| Status | Count | Rate |
|---|---|---|
| Fixed | 40 | 95% |
| Failed | 2 | 5% |
| **Total** | **42** | |

`pnpm check`: PASS (0 new errors)

### Validate pass: 40/42 (95%)
```

Preserve all other sections (Layout Maps, Principles, Handoffs, Scorecard) unchanged.

---

### Step 9 — Final Validation

Run `pnpm check` one final time to catch cross-agent conflicts.

If errors: fix inline if simple, present at Gate 5 if complex.

---

### Step 10 — Report to User (Gate 5)

Render the **ASCII Summary Report** exactly as specified in Gate 5:

1. **Block 1 — Scoreboard** — box-drawing table with Fixed/Failed counts + rates, `pnpm check` status, validate pass-rate, and snapshot verification rate
2. **Block 2 — Per-issue table** — every issue row with status icon, validate principle verdicts, and snapshot status
3. **Failed Issues section** — only if any issue FAILED, with reason and next step
4. **Block 3 — Re-audit prompt** — always present, pulled from `skills/ux-audit/references/AUDIT_PROMPTS.md`

Do not summarize in prose. Always render the full ASCII report.

---

### Step 11 — Workspace Cleanup

After Gate 5 report is delivered to the user:

```bash
rm -rf "$_fix_work"
```

This removes all agent scratch folders. The audit file (in `skills/ux-audit/audits/`) is preserved.

---

## Agent Prompt Template

```
You are fixing UX audit issues in the WTFPOS SvelteKit app (Svelte 5 runes, Tailwind CSS v3).
The app is at `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS`.

## WORKSPACE RULES
1. Your workspace folder: `skills/fix-audit/work-{run-id}/agent-{N}/`
2. NEVER take screenshots — they waste tokens and execution time
3. Write any scratch notes or temp files ONLY inside your workspace folder
4. Clean up: the orchestrator handles workspace deletion — do NOT delete your own folder
5. Write your results to `results.md` in your workspace folder using the EXACT delimited format

## Design Bible Reference
Read `skills/ux-audit/references/DESIGN_BIBLE.md` for the 14 UX principles.
Each issue has a **Validate** field listing which principles the fix must satisfy.
Use these principles as your quality lens when implementing.

## WTFPOS Conventions
Follow ALL conventions in `CLAUDE.md` at project root. Key reminders:
- Svelte 5 runes only, `onclick` not `on:click`, 44px touch targets
- `lucide-svelte` named imports, `cn()` for classes, design tokens not raw hex
- RxDB: `incrementalPatch`/`incrementalModify`, always include `updatedAt`

## Your Module: [MODULE NAME]

## Issues to Fix

### [01]: [Title]
**Before:** [Broken experience — one sentence, user perspective]
**After (acceptance criteria):** [Fixed experience — this is what "done" looks like]
**Insight:** [Why this matters — persona story]
**Validate (with rubric):**
- Fitts's Law: All cash preset buttons ≥ 44px height with ≥ 8px gap between adjacent buttons
- Motor Efficiency: Selecting a cash denomination requires exactly 1 tap
- WCAG Touch Targets: Each button ≥ 44×44px with ≥ 8px spacing to neighbours
**Read first (data flow):**
1. `src/lib/components/pos/CheckoutModal.svelte` — current button rendering
**Modify:**
1. `src/lib/components/pos/CheckoutModal.svelte` — change button height + gap

### [02]: [Title]
...

## Steps
1. Read the files listed in **Read first** for each issue to understand the data flow
2. For each issue, implement the fix so that the **After** state is achieved
3. Cross-check against each **Validate** criterion — is the concrete pass condition met?
4. Run `pnpm check` after all changes and fix any type errors
5. Run `playwright-cli snapshot` to verify UI changes in the accessibility tree
6. Write your results to `results.md` in your workspace folder using the EXACT format below

## Result File Format

Write to: `[your-workspace-folder]/results.md`

Start with a header block, then use EXACT delimiters — the orchestrator parses them mechanically:

<!-- RUN {run-id} · AGENT {N} · {ISO timestamp} -->
<!-- ISSUES: [01], [02], [06], [08], [09] -->

<!-- RESULT [01] -->
STATUS: FIXED
FILE: src/lib/components/pos/FloorPlan.svelte
BEFORE_AFTER: Tapping adjacent tables → Each table has isolated hit region
VALIDATE: Fitts's Law ✅ (buttons ≥ 44px) · Gestalt (Proximity) ✅ (8px gap) · Visibility of System Status ✅ (correct table opens)
SNAPSHOT_VERIFIED: YES — snapshot shows button[role=button] elements in checkout section, all present after fix
SUMMARY: Added 8px pointer-events padding between SVG table elements. Each table now has an isolated hit region that prevents click bleed. Verified on 1024×768 viewport with 8 adjacent tables. pnpm check passes.
PNPM_CHECK: PASS
<!-- END [01] -->

<!-- RESULT [02] -->
STATUS: FAILED
FILE: src/lib/components/pos/PaxModal.svelte
BEFORE_AFTER: Cashier types 12 pax for 4-seat table → (not achieved)
VALIDATE: Error Prevention ❌ (guard not added — missing prop)
SNAPSHOT_VERIFIED: NO — could not trigger guard to verify
SUMMARY: Attempted to add capacity guard but PaxModal does not receive table.maxSeats prop. Need schema change to expose seat count.
PNPM_CHECK: PASS
<!-- END [02] -->

RULES:
- Header block (RUN + ISSUES lines) MUST be the first two lines — the orchestrator uses them to verify identity
- One <!-- RESULT [ID] --> block per issue, in order
- STATUS is exactly FIXED or FAILED — nothing else
- VALIDATE includes the concrete criterion result in parentheses after each ✅/❌
- SNAPSHOT_VERIFIED is YES/NO/SKIPPED/N/A with a short proof or reason after the dash
- SUMMARY is 2-4 sentences on ONE line (no line breaks inside)
- PNPM_CHECK is PASS or FAIL — reflects state AFTER all fixes
- If you crash mid-work, write what you have — partial results are better than none
```

---

## Edge Cases

### User says "yes" to everything instantly
Accept all before/after specs as presented. Skip to Gate 3 immediately. This is the fast path.

### User overrides an After statement with something different
Use the user's version — they know their restaurant better. The user's After becomes
the acceptance criteria even if it conflicts with the audit's Ideal flow.

### User skips specific issues
Do not include skipped issues in the agent split. Leave them unchecked in the audit file.

### Audit file has no five-field dossier format
Parse issue IDs from headers (`##### [01]`) or inline bold (`**[01]**`).
Fall back to line-by-line scanning. If the audit is from ux-audit < v4.0 (uses P0-01 format),
map old IDs to sequential [01], [02] numbering.

### Issue requires schema change
Trigger Gate 4. If approved, assign schema change to a dedicated agent that runs first
(sequentially, not in parallel) because other agents may depend on the new fields.

### Issue was "previously fixed but not implemented"
Treat as a normal fix. Read the file fresh and implement from scratch.

### Two agents need the same file
Re-split: merge those agents into one, or extract shared file changes into a lead agent
that runs first.

### pnpm check fails after all agents complete
Common causes: type mismatch, missing prop, rune outside `.svelte.ts`.
Fix inline if simple. If complex, present at Gate 5.

---

## Agent Crash Recovery

When an agent returns partial results, times out, or fails:

1. **Read partial result file** — check `$_fix_work/agent-{N}/results.md` for any `<!-- RESULT -->` blocks that completed
2. **Mark un-attempted issues** — in the audit file, add: `- [ ] **[09]** · ... — NOT ATTEMPTED (agent crash)`
3. **Present at Gate 5** — show crash in the scoreboard:
   ```
   ── AGENT CRASH ──────────────────────────────────────────────
   Agent 3 (Kitchen/KDS) crashed after fixing 2 of 6 issues.
   Not attempted: [09], [10], [11], [12]
   ────────────────────────────────────────────────────────────
   ```
4. **Offer retry** — "Retry these 4 issues in a new agent? (y/n)"
5. **If retry accepted** — launch a single replacement agent with only the un-attempted issues
6. **If declined** — mark as FAILED in the report with reason "agent crash — not attempted"

---

## Multi-Audit Mode

When fixing 2+ audit files simultaneously:

1. **Parse all issues** from all audit files into a single list
2. **Deduplicate** — issues targeting the same file + same area = same fix. Criteria:
   - Same `menuItemId` / component / store function referenced
   - Same fix description or overlapping fix hint
   - Mark duplicates: `[01] (from audit A) = [03] (from audit B)`
3. **Present deduplicated list** at Gate 2 with source audit markers:
   ```
   [01] · Staff · Schema: expenseDate field missing [from: expenses-audit, expense-manager-b]
   ```
4. **Fix once, update all** — after fixing, write the same fix summary to ALL source audit files
5. **Scoreboard** — show per-audit-file breakdown in addition to the unified scoreboard

---

## Self-Improvement Protocol

When the user corrects any fix this skill produced:
1. **Update the audit file** — change `[x]` to `[ ]`, note the correction
2. **Update the fix summary** — decrement Fixed, increment Failed
3. **Apply the correction** — fix the code to match the user's feedback
4. **Check the After statement** — if the After was achieved but the fix was wrong, the
   After was too vague. Ask the user for a sharper one.
5. **Update this SKILL.md** — if the error was systematic, add a note to the Agent Prompt
   Template so future agents don't repeat it

---

## User Profile (auto-updated by Self-Improvement Protocol)

Track observed user patterns to optimize gate behavior. Update after each run.

| Pattern | Observed | Gate impact |
|---|---|---|
| Fast-path preference | YES — user always confirms all issues | Gate 2: auto-fast-track before/after specs |
| Fix preference | ALWAYS — user always wants fixes after audit | Gate 6 (ux-audit): auto-invoke |
| Issue filter | ALL — user never skips issues | Gate 2: present all, no filtering |
| Schema approval | YES — user always approves schema changes | Gate 4: show warning, don't block |

> **Rule:** After 3 consecutive runs with the same pattern, upgrade from observation to default.
> After 1 run that breaks the pattern, reset to neutral.

---

## Run Log

Append one row after every execution. This data drives self-improvement decisions.

| Date | Audit file(s) | Issues | Agents | Crashed | Fixed | Failed | Fast-path? | Tokens est. |
|---|---|---|---|---|---|---|---|---|

> **Self-improvement trigger:** If crash rate exceeds 10% across last 5 runs, add crash
> patterns to Agent Prompt Template. If fast-path rate is 100% across last 5 runs, upgrade
> Gate 2 to permanent fast-track.

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 5.0.0 | 2026-03-10 | **Three-layer verification upgrade**: (1) Step 3.5 added — orchestrator maps file dependency chains per issue (Read first → Modify), agents stop guessing which files to read, (2) Validate Rubric — each Design Bible principle is expanded into a concrete pass criterion with measurable thresholds (e.g., "Fitts's Law: buttons ≥ 44px with ≥ 8px gap"), agents check against rubric not just principle names, (3) Post-fix snapshot verification — agents run `playwright-cli snapshot` after fixing and verify UI changes in the accessibility tree, new SNAPSHOT_VERIFIED field in result files (YES/NO/SKIPPED/N/A), (4) Agent Prompt Template updated with dependency map, expanded rubric, and snapshot verification steps, (5) ASCII Summary Report adds Snapshot verified rate and per-issue snapshot column, (6) Per-issue audit file format adds Snapshot line |
| 4.2.0 | 2026-03-10 | **Result file identity headers**: Agent result files now start with `<!-- RUN {run-id} · AGENT {N} · {timestamp} -->` and `<!-- ISSUES: [...] -->` header lines. Orchestrator verifies run ID matches before parsing — stale files from crashed previous runs are ignored. Header also lists assigned issues for cross-check. |
| 4.1.0 | 2026-03-10 | **Non-lossy dossier + structured result files**: (1) Step 8 now preserves the original five-field dossier intact — fix results appended below a `---` separator, never replacing the dossier. Retry agents get full context on failed issues, (2) Agents write results to `results.md` in their workspace folder using `<!-- RESULT [ID] -->` delimiters instead of free-text chat output. Orchestrator parses files mechanically — no ambiguity from formatting drift, (3) Step 7 rewritten to read from result files with crash detection (missing file = agent crash, truncated block = partial crash), (4) WR-4 updated to include result file rule, (5) Output section updated to show preserved dossier format |
| 4.0.0 | 2026-03-10 | **Design Bible integration + before/after format**: (1) Added Design Bible as reference — 14 UX principles now validate every fix, (2) Gate 2 rewritten: before/after/insight/validate format replaces one-line expectations, (3) Step 2 parsing aligned to ux-audit v4.0 five-field dossier — no P0/P1/P2 prefixes, (4) Flat sequential numbering [01], [02] throughout, (5) Agent Prompt Template includes Design Bible + Validate principles + workspace rules, (6) ASCII Summary Report: removed P0/P1/P2 row breakdown, added Validate pass-rate, (7) WORKSPACE RULES section: run-scoped folders, screenshot ban, agent isolation, (8) Per-issue audit file format: Before/After/Fix/Validate instead of Expectation/Fix, (9) Step 11 added for workspace cleanup, (10) Dropped effort/impact metadata — all issues equal weight |
| 3.0.0 | 2026-03-09 | **Self-assessment overhaul**: (1) Gate classification FAST-SKIP/HARD-STOP, (2) Gate 2 fast-track for "yes to all", (3) Agent crash recovery with retry, (4) Multi-audit dedup mode, (5) User profile + run log for data-driven self-improvement, (6) Remove conventions duplication from agent prompts — reference CLAUDE.md instead, (7) Fix residual SKIPPED/DEFERRED references, (8) Bump to v3.0.0 |
| 2.3.0 | 2026-03-09 | **Remove Skipped column**: report now shows only Fixed / Failed — no Skipped concept |
| 2.2.0 | 2026-03-09 | **ASCII Summary Report**: Gate 5 and Step 10 now render a box-drawing colored report (scoreboard + per-issue table + failed section + re-audit prompt) instead of plain markdown tables |
| 2.1.0 | 2026-03-09 | **Gate 2 flat list**: removed P0/P1/P2 grouping — all issues presented as one flat list with a single question at the end |
| 2.0.0 | 2026-03-09 | **Gate 2 rewrite**: per-issue acknowledgment with one-sentence future expectation; expectations become acceptance criteria stored in audit file; Gate 5 maps fixes to expectations; suggested re-audit after completion |
| 1.0.0 | 2026-03-09 | Initial skill creation |

---

## WORKSPACE RULES REMINDER (READ LAST)

Before finishing, re-check:
- ✅ All agent scratch files are inside `skills/fix-audit/work-{run-id}/`
- ✅ No screenshots were taken (WR-1)
- ✅ All agent results collected from `results.md` files — not from chat output
- ✅ Original dossiers preserved in audit file — fix results appended below `---`, never replacing
- ✅ Workspace cleaned up after Gate 5 report: `rm -rf "$_fix_work"` (WR-3)
- ✅ Audit file in `skills/ux-audit/audits/` is preserved — never deleted
