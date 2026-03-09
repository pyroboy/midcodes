---
name: fix-audit
description: >
  Coordinates parallel agents to fix issues from UX audit reports. Reads an audit file,
  lists all issues as a flat list with one-sentence future-state expectations, asks the
  user once at the end to acknowledge, splits work across agents by module, updates the
  audit file with checkboxes and fix summaries in-place, and runs pnpm check after all
  fixes land. Use when the user says "fix audit issues", "fix the audit", "fix P0s",
  "fix all issues", "fix-audit", "fix the UX issues", "implement audit fixes",
  "resolve audit findings", or references a specific audit report file and asks to fix
  it. Also triggers on "fix P0-01", "fix everything from the audit", or "fix all P1s".
version: 3.0.0
---

# Audit Issue Fix — WTFPOS

Takes a UX audit report (from the `ux-audit` skill) and turns findings into code fixes.
Walks the user through every issue with an acknowledgment prompt, collects a one-sentence
future expectation for each, coordinates parallel agents by module ownership, updates
the audit file with checkboxes + fix summaries + expectations, and validates with `pnpm check`.

**North star:** Every audit should close the loop into code. This skill is the bridge
between "we found 44 issues" and "we fixed 44 issues." The user's one-sentence expectation
per issue becomes the acceptance criteria — the fix is only done when that expectation is met.

---

## References

| Reference | Purpose |
|---|---|
| `skills/ux-audit/audits/` | All audit reports — the input files for this skill |
| `skills/ux-audit/SKILL.md` | Audit report format (Section D / Recommendations table) |
| `skills/ux-audit/references/AUDIT_PROMPTS.md` | 110 audit prompt templates for re-auditing after fixes |
| `CLAUDE.md` (project root) | WTFPOS coding conventions, file structure, development rules |

---

## Output

This skill **modifies the original audit file in-place**. After fixing, each issue becomes:

```markdown
- [x] **P0-01** · Staff · **SVG floor tile click targets overlap**
  > **Expectation:** Staff can rapidly tap adjacent tables on a full floor without opening the wrong one.
  > **Fix:** Added explicit pointer-events regions with 8px padding between SVG table `<g>`
  > elements in `FloorPlan.svelte`. Each table now has an isolated hit area that prevents
  > click bleed to adjacent tiles. Verified on 1024×768 viewport with 8 adjacent tables.
```

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

**Action:** Present **all issues as a single flat list** (no grouping by priority). Each issue
shows its ID, priority tag, role, title, effort, and a suggested expectation. After the full
list, ask **one question** at the end.

**Format — present like this:**

```
## All Issues (44 total)

P0-01 · Staff · SVG floor tile click targets overlap [P0 · Effort: M]
  → Staff can rapidly tap adjacent tables on a full floor without opening the wrong one.

P0-02 · Staff · Custom pax input bypasses capacity [P0 · Effort: S]
  → A cashier typing a pax count higher than the table seats gets blocked with a clear message.

P0-03 · Staff · Cash preset buttons are 32px [P0 · Effort: S]
  → Cash buttons are large enough that a stressed cashier never mistaps during checkout.

P1-01 · Owner · Location switch not persisted to sessionStorage [P1 · Effort: S]
  → Owner switches branch once and it sticks — no re-disabling on page navigation.

P1-02 · Owner · Quick Action links clickable when locationId='all' [P1 · Effort: S]
  → Quick Actions are greyed out when no branch is selected — impossible to click into a broken state.

P2-01 · Staff · Refill badge has no pulse animation [P2 · Effort: S]
  → Active refill badges pulse gently so staff catches them on a crowded floor plan.

[... all issues listed ...]

> **Fix all 44 issues?** Reply "yes" to confirm all with suggested expectations.
> To skip specific issues: "skip P1-16, P2-11"
> To override an expectation: "P1-05: 'cashier should never see the word optional on required fields'"
```

**Rules for the expectation sentence:**

1. **Claude generates a suggested expectation** for every issue based on the audit description
2. **The user can accept, override, or skip** each issue
3. Expectations are written from the **user's perspective** (staff, kitchen, manager, owner)
4. Expectations are **outcome-focused**, not implementation-focused:
   - Good: "Kitchen sees a red VOIDED overlay with a 10-second countdown on cancelled items"
   - Bad: "Add voided flag to KDS ticket and render with bg-red-50"
5. The expectation becomes the **acceptance criteria** — it's stored in the audit file alongside the fix summary

**Shorthand the user can use:**
- `yes` — accept all issues with suggested expectations
- `yes, but P1-05: "cashier should never see the word optional on required fields"` — accept all, override one expectation
- `skip P1-16, P1-18` — skip specific issues

**Fast-track rule:** If the user says "yes", "all", "fix them", "do it", or any blanket affirmative
in their **invocation message** (e.g., "fix-audit latest, yes to all"), skip the full issue listing.
Instead show a one-line confirmation:

> **[N] issues acknowledged with suggested expectations. Proceeding to agent plan.**

This saves ~2,000 output tokens. Only present the full list if the user needs to review individual issues.

---

### Gate 3 — Agent Plan Approval [HARD-STOP]

**Trigger:** After all issues are acknowledged.

**Action:** Present the agent split plan:

> **Here's how I'll split the work across [N] agents:**
>
> | Agent | Module | Issues | Files | Est. |
> |---|---|---|---|---|
> | 1 | POS / Staff | P0-01, P0-02, P1-04, P1-06, P1-07 | FloorPlan, PaxModal, VoidModal, OrderSidebar | ~8 min |
> | 2 | Kitchen / KDS | P1-09–P1-15 | kitchen/orders, InventoryTable, InventoryItemRow | ~10 min |
> | 3 | Checkout + Session | P0-03, P1-01, P1-02, P1-05, P1-08 | CheckoutModal, session.svelte, AppSidebar | ~8 min |
> | 4 | Weigh Station | P0-04, P0-05, P1-16–P1-18 | kitchen/+layout, weigh-station, YieldCalculator | ~8 min |
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

### Gate 5 — Post-Fix Report & Expectation Check [HARD-STOP]

**Trigger:** After all agents complete.

**Action:** Present results as an **ASCII colored summary report** followed by the per-issue expectation table. Always render this — never collapse to a plain markdown table.

---

#### ASCII Summary Report Format

Render a full-width box-drawing summary block, then a per-issue table. Use the exact
Unicode box characters below so the output looks consistent in the terminal.

**Block 1 — Scoreboard (always rendered first):**

```
╔══════════════════════════════════════════════════════════╗
║  FIX SUMMARY · [audit_filename]                          ║
║  [YYYY-MM-DD] · [N] issues processed                    ║
╠══════════╤═══════════════╤══════════════════════════════╣
║ Priority │ ✅ Fixed       │ ❌ Failed                    ║
╠══════════╪═══════════════╪══════════════════════════════╣
║  🔴 P0   │  [N] / [total]│    [N]                      ║
║  🟡 P1   │  [N] / [total]│    [N]                      ║
║  🟢 P2   │  [N] / [total]│    [N]                      ║
╠══════════╪═══════════════╪══════════════════════════════╣
║  TOTAL   │  [N] / [total]│    [N]                      ║
╚══════════╧═══════════════╧══════════════════════════════╝

  pnpm check  ·  ✅ PASS (0 new errors)   |   Expectations met: [N]/[N] ([%]%)
```

If `pnpm check` failed, replace with:
```
  pnpm check  ·  ❌ FAIL — [N] new error(s)   |   Expectations met: [N]/[N] ([%]%)
```

**Block 2 — Per-issue expectation table:**

```
╔═══════╤════════════════════════════════════════════════╤══════════╤════════════════════════════════╗
║ ID    │ Issue                                          │ Status   │ Expectation                    ║
╠═══════╪════════════════════════════════════════════════╪══════════╪════════════════════════════════╣
║ P0-01 │ SVG floor tile click targets overlap           │ ✅ FIXED │ ✅ Yes — 8px hit regions added ║
║ P0-02 │ Custom pax input bypasses capacity             │ ✅ FIXED │ ✅ Yes — guard in handleCustom ║
║ P1-15 │ No floor badge after kitchen refuse            │ ❌ FAIL  │ ❌ No — type error in FloorPlan║
╚═══════╧════════════════════════════════════════════════╧══════════╧════════════════════════════════╝
```

**Rendering rules:**
1. Status cell: `✅ FIXED` / `❌ FAIL`
2. Expectation cell: `✅ Yes — [short proof]` / `❌ No — [short reason]`
3. Truncate long text to fit column width — wrap with `…` rather than breaking the table border
4. Sort rows: all P0s first, then P1s, then P2s
5. If any issue FAILED, add a **Failed Issues** section below the table:

```
  ── FAILED ISSUES ─────────────────────────────────────────────────────────
  ❌ P1-15  No floor badge after kitchen refuse
            Reason: Type error in FloorPlan.svelte — kitchenAlerts not on table type
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
| `scope` | "all", "P0s", "P0s and P1s", specific codes | Gate 2 always |

---

### Step 2 — Read & Parse the Audit File

Read the audit file. Parse each issue into:

```
{
  id: "P0-01",
  priority: "P0",
  role: "Staff",
  title: "SVG floor tile click targets overlap",
  description: "wrong table opens under stress...",
  effort: "M",
  impact: "High",
  fix_hint: "Add pointer-events regions...",
  expectation: ""  // filled by user at Gate 2
}
```

---

### Step 3 — Gate 2 Walkthrough

Present all issues as a single flat list with suggested expectations.
Ask one question at the end. Collect user acknowledgments and any overridden expectations.

After Gate 2, you have a final list of **acknowledged issues** with expectations.

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
5. S-effort: batch 8-10 per agent. M/L-effort: max 4-5 per agent.

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

1. **Role identity** — "You are fixing UX audit issues in the WTFPOS SvelteKit app"
2. **WTFPOS conventions** — "Follow all conventions in `CLAUDE.md` at project root" (do NOT duplicate the full list — agents load CLAUDE.md themselves)
3. **Exact issue list** — ID, title, description, fix hint, AND the user's expectation sentence
4. **Expectation as acceptance criteria** — "The fix is done when: [expectation sentence]"
5. **Files to read first** — every file the agent needs to understand
6. **Files to modify** — every file the agent will change
7. **Verification** — "Run `pnpm check` after all changes and fix any type errors"
8. **Output format:**
   ```
   P0-01: FIXED
   File: src/lib/components/pos/FloorPlan.svelte
   Expectation: Staff can rapidly tap adjacent tables without opening the wrong one.
   Summary: [4 sentences describing what was changed and why]
   ```

---

### Step 6 — Launch Agents

Launch all agents **in a single message** using parallel `Agent` tool calls.

- `run_in_background: true` for all agents
- Each agent runs `pnpm check` at the end
- If `pnpm check` fails, agent attempts to fix before returning

---

### Step 7 — Collect Results

As each agent completes:

1. Record status per issue: FIXED / FAILED
2. Capture 4-sentence summary per issue
3. Note `pnpm check` result
4. Map each fix back to its expectation — does the fix meet it?

---

### Step 8 — Update the Audit File

Transform the original audit file in-place:

**Per-issue format (fixed):**
```markdown
- [x] **P0-01** · Staff · **SVG floor tile click targets overlap** [M]
  > **Expectation:** Staff can rapidly tap adjacent tables on a full floor without opening the wrong one.
  > **Fix:** Added 8px pointer-events padding between SVG `<g>` table elements in FloorPlan.svelte.
  > Each table now has an isolated hit region that prevents click bleed to adjacent tiles.
  > Tested with 8 adjacent tables on 1024×768 viewport. pnpm check passes.
```

**Per-issue format (failed):**
```markdown
- [ ] **P1-15** · Kitchen · **No per-table floor badge after kitchen refuse** [M] — FAILED
  > **Expectation:** Staff sees a persistent badge on the floor tile when kitchen refuses an item.
  > **Failure:** Type error in FloorPlan.svelte — `kitchenAlerts` property not found on table type.
```

**Add Fix Summary at top of file:**

```markdown
## Fix Summary (YYYY-MM-DD)

| Status | Count |
|---|---|
| Fixed | 40 |
| Failed | 2 |
| **Total** | **42** |

`pnpm check`: PASS (0 new errors)

### Expectations met: 40/42 (95%)
```

Preserve all other sections (Layout Maps, Principles, Handoffs, Scorecard) unchanged.

---

### Step 9 — Final Validation

Run `pnpm check` one final time to catch cross-agent conflicts.

If errors: fix inline if simple, present at Gate 5 if complex.

---

### Step 10 — Report to User (Gate 5)

Render the **ASCII Summary Report** exactly as specified in Gate 5:

1. **Block 1 — Scoreboard** — box-drawing table with P0/P1/P2 row breakdown, Fixed/Failed columns, `pnpm check` status, and expectation hit-rate
2. **Block 2 — Per-issue table** — every issue row with status icon and one-line expectation verdict
3. **Failed Issues section** — only if any issue FAILED, with reason and next step
4. **Block 3 — Re-audit prompt** — always present, pulled from `skills/ux-audit/references/AUDIT_PROMPTS.md`

Do not summarize in prose. Always render the full ASCII report.

---

## Agent Prompt Template

```
You are fixing UX audit issues in the WTFPOS SvelteKit app (Svelte 5 runes, Tailwind CSS v3).
The app is at `/Users/arjomagno/Documents/GitHub/midcodes/apps/WTFPOS`.

## WTFPOS Conventions
Follow ALL conventions in `CLAUDE.md` at project root. Key reminders:
- Svelte 5 runes only, `onclick` not `on:click`, 44px touch targets
- `lucide-svelte` named imports, `cn()` for classes, design tokens not raw hex
- RxDB: `incrementalPatch`/`incrementalModify`, always include `updatedAt`

## Your Module: [MODULE NAME]

## Issues to Fix

### [P0-01]: [Title]
**Description:** [Full description from audit]
**Fix hint:** [Suggested approach]
**File(s):** [Files to modify]
**Expectation (acceptance criteria):** [User's one-sentence expectation]

### [P0-02]: [Title]
...

## Steps
1. Read [file list] to understand current code
2. Implement fixes for each issue
3. For each fix, verify it meets the stated expectation
4. Run `pnpm check` and fix any type errors
5. For each issue, report: FIXED / FAILED with a 4-sentence summary
```

---

## Edge Cases

### User says "yes" to everything instantly
Accept all suggested expectations. Skip to Gate 3 immediately. This is the fast path.

### User overrides an expectation with something contradictory
Use the user's version — they know their restaurant better. The user's expectation becomes
the acceptance criteria even if it conflicts with the audit's recommendation.

### User skips specific issues
Do not include skipped issues in the agent split. Leave them unchecked in the audit file.

### Audit file has no table format
Parse issue IDs from headers (`### P0-01`) or inline bold (`**[P0-01]**`).
Fall back to line-by-line scanning.

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

1. **Parse partial output** — extract which issues were FIXED vs which were never attempted
2. **Mark un-attempted issues** — in the audit file, add: `- [ ] **P1-09** · ... — NOT ATTEMPTED (agent crash)`
3. **Present at Gate 5** — show crash in the scoreboard:
   ```
   ── AGENT CRASH ──────────────────────────────────────────────
   Agent 3 (Kitchen/KDS) crashed after fixing 2 of 6 issues.
   Not attempted: P1-09, P1-10, P1-11, P1-12
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
   - Mark duplicates: `P0-01 (from audit A) = P0-03 (from audit B)`
3. **Present deduplicated list** at Gate 2 with source audit markers:
   ```
   P0-01 · Staff · Schema: expenseDate field missing [from: expenses-audit, expense-manager-b]
   ```
4. **Fix once, update all** — after fixing, write the same fix summary to ALL source audit files
5. **Scoreboard** — show per-audit-file breakdown in addition to the unified scoreboard

---

## Self-Improvement Protocol

When the user corrects any fix this skill produced:
1. **Update the audit file** — change `[x]` to `[ ]`, note the correction
2. **Update the fix summary** — decrement Fixed, increment Failed
3. **Apply the correction** — fix the code to match the user's feedback
4. **Check the expectation** — if the expectation was met but the fix was wrong, the
   expectation was too vague. Ask the user for a sharper one.
5. **Update this SKILL.md** — if the error was systematic, add a note to the Agent Prompt
   Template so future agents don't repeat it

---

## User Profile (auto-updated by Self-Improvement Protocol)

Track observed user patterns to optimize gate behavior. Update after each run.

| Pattern | Observed | Gate impact |
|---|---|---|
| Fast-path preference | YES — user always confirms all issues | Gate 2: auto-fast-track |
| Fix preference | ALWAYS — user always wants fixes after audit | Gate 6 (ux-audit): auto-invoke |
| Priority filter | ALL — user never filters by priority | Gate 2: skip priority grouping |
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
| 3.0.0 | 2026-03-09 | **Self-assessment overhaul**: (1) Gate classification FAST-SKIP/HARD-STOP, (2) Gate 2 fast-track for "yes to all", (3) Agent crash recovery with retry, (4) Multi-audit dedup mode, (5) User profile + run log for data-driven self-improvement, (6) Remove conventions duplication from agent prompts — reference CLAUDE.md instead, (7) Fix residual SKIPPED/DEFERRED references, (8) Bump to v3.0.0 |
| 2.3.0 | 2026-03-09 | **Remove Skipped column**: report now shows only Fixed / Failed — no Skipped concept |
| 2.2.0 | 2026-03-09 | **ASCII Summary Report**: Gate 5 and Step 10 now render a box-drawing colored report (scoreboard + per-issue table + failed section + re-audit prompt) instead of plain markdown tables |
| 2.1.0 | 2026-03-09 | **Gate 2 flat list**: removed P0/P1/P2 grouping — all issues presented as one flat list with a single question at the end |
| 2.0.0 | 2026-03-09 | **Gate 2 rewrite**: per-issue acknowledgment with one-sentence future expectation; expectations become acceptance criteria stored in audit file; Gate 5 maps fixes to expectations; suggested re-audit after completion |
| 1.0.0 | 2026-03-09 | Initial skill creation |
