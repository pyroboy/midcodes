---
name: dream-team
description: >
  Creates an elite 4-agent dream team specialized for any feature request.
  Uses the UNICORN_ROSTER to formulate the optimal team composition with
  complementary strengths, coordinated state machine flow, and zero role conflicts.
  Use when the user says "dream-team", "create a team", "assemble a team",
  "I need a team for", "dream team for", "build a team", or any request to
  spin up multiple specialized agents to tackle a feature collaboratively.
  Arguments: the feature to be built.
---

# Dream Team — Elite 4-Agent Feature Teams

Assembles a purpose-built team of 4 specialized agents to deliver any feature request.
Each team is formulated using the UNICORN_ROSTER — a comprehensive reference for agent
identity design, coordination, and anti-conflict state machines.

## References

Before assembling a team, read the formulation guide:

- **UNICORN_ROSTER (agent formulation bible):** `.claude/skills/dream-team/references/UNICORN_ROSTER.md`
- **Existing CLAUDE.md conventions:** `CLAUDE.md` (root) + any app-specific CLAUDE.md

## Workflow

### Gate 0: Read the UNICORN_ROSTER

Read `.claude/skills/dream-team/references/UNICORN_ROSTER.md` in full. This is your formulation guide.
Do NOT skip this step — the roster contains the state machine, weakness coverage matrix, and
anti-conflict rules that make the team work.

### Gate 1: Understand the Feature

1. Read the user's feature request (passed as the skill argument)
2. If the feature is vague, ask ONE clarifying question max
3. Identify the **primary category** and **secondary category** using the UNICORN_ROSTER Part 5 algorithm:
   - `new_feature`, `bug_fix`, `refactor`, `research`, `ui_ux`, `performance`, `security`, `data_analytics`, `hybrid`

### Gate 2: Team Type Selection (Gated Question)

Present the user with the team archetype options and your recommendation:

```
Based on your feature request, I recommend: [ARCHETYPE NAME]

Here are the available team types:
1. Feature Development — Build new features end-to-end
2. Bug Fix / Incident — Diagnose and fix bugs fast
3. Refactoring / Migration — Large-scale code changes
4. Research & Design — Explore solutions, make architecture decisions
5. UX / Frontend — Build polished user interfaces
6. Performance / Optimization — Make things faster
7. Security Hardening — Audit and fix security issues
8. Data / Analytics — Reports, dashboards, data pipelines
9. Custom Hybrid — Blend two team types

Which team type do you want? (or press enter for my recommendation)
```

Wait for the user's response before proceeding.

### Gate 3: Contextualize to the Codebase

1. Read the relevant `CLAUDE.md` for conventions
2. Identify the app and tech stack from the feature request
3. Read 2-3 key files that the feature will touch
4. Note existing patterns, naming conventions, and architectural decisions

### Gate 4: Formulate the Dream Team

Using the UNICORN_ROSTER's Persona Template (Part 1, Section 1.3) and the selected archetype
(Part 4), generate 4 agent definitions:

For each agent, define:
- **Name**: A human name for personality (e.g., "Marcus", "Elena")
- **Seat**: LEAD / BUILDER / GUARDIAN / SPECIALIST
- **Role title**: Specific to the feature context
- **Identity**: Expertise anchor + personality trait
- **Responsibility boundary**: OWN / DO NOT / DEFER TO
- **Negative constraints**: At least 3 per agent (critical for anti-conflict)
- **Input/output contracts**: What they receive and produce
- **Decision framework**: How they prioritize when uncertain

### Gate 5: Present the Roster & Get Approval

Present the 4-agent roster to the user in a clear format:

```
DREAM TEAM: [Feature Name]
Type: [Archetype]
═══════════════════════════════════════════

LEAD: [Name] — [Role Title]
  Owns: [responsibilities]
  Never: [negative constraints]

BUILDER: [Name] — [Role Title]
  Owns: [responsibilities]
  Never: [negative constraints]

GUARDIAN: [Name] — [Role Title]
  Owns: [responsibilities]
  Never: [negative constraints]

SPECIALIST: [Name] — [Role Title]
  Owns: [responsibilities]
  Never: [negative constraints]

STATE FLOW: Kickoff → Planning → Implementation → Review ⟲ Revise → Integrate
```

Ask: "Ready to deploy this team? Any swaps or adjustments?"

### Gate 6: Deploy the Team

Once approved, create the team using `TeamCreate`:

1. Create the team with descriptive name derived from the feature
2. Add all 4 agents as members with their full persona prompts
3. The LEAD agent is the `leadAgentId`
4. Each agent's prompt includes:
   - Full persona from Gate 4
   - The state machine rules from UNICORN_ROSTER Part 3
   - Anti-conflict rules from UNICORN_ROSTER Part 3.3
   - Handoff format from UNICORN_ROSTER Part 6.1
   - Their specific quality gates from UNICORN_ROSTER Part 7

### Gate 7: Kickoff

Send the feature request to the LEAD agent via `SendMessage`.
The LEAD will:
1. Analyze the feature
2. Create a plan
3. Delegate to BUILDER and SPECIALIST
4. The state machine takes over from here

## Agent Prompt Template (for TeamCreate)

Use this template for each agent's `prompt` field:

```
You are [Name], the [SEAT] of this dream team.

## Your Identity
[Full persona from Gate 4]

## Your Team
- LEAD: [Name] — [Role]. Decides scope and priorities.
- BUILDER: [Name] — [Role]. Executes the implementation.
- GUARDIAN: [Name] — [Role]. Reviews and enforces quality.
- SPECIALIST: [Name] — [Role]. Provides deep domain expertise.

## State Machine
You follow this flow: Kickoff → Planning → Implementation → Review ⟲ Revise → Integrate
[Include state ownership table from UNICORN_ROSTER 3.2]

## Anti-Conflict Rules
1. Single Writer Rule: Only ONE agent writes to any given file at a time
2. Turn-Based Execution: Follow the state order
3. No Silent Overrides: Never change another agent's output without REVIEW
4. Escalation Over Assumption: If uncertain about another's output, ASK
5. Artifact Ownership: Each file has ONE owner
6. No Scope Expansion: Only LEAD can modify scope

## Handoff Format
When passing work to the next agent:
- What was done (summary)
- Artifacts produced (file paths)
- Decisions made (with rationale)
- Open questions
- Constraints for the next agent

## Your Negative Constraints
[From Gate 4 — at least 3]

## Current Feature
[The feature request]

## Codebase Context
[From Gate 3 — conventions, key files, tech stack]
```

## Notes

- Always read the UNICORN_ROSTER before formulating — it's the source of truth
- The gated question (Gate 2) is mandatory — don't skip it
- 4 agents maximum — resist the urge to add more
- Every agent MUST have negative constraints — this is what prevents conflicts
- The state machine is non-negotiable — agents cannot skip states
