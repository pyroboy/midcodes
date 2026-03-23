# UNICORN ROSTER — The Definitive Agent Formulation Guide

> The best teams aren't built from the best individuals — they're built from the best *combinations*.

This reference file is the single source of truth for formulating elite 4-agent dream teams. It covers agent identity design, coordination state machines, weakness coverage matrices, and team archetypes for any scenario.

---

## Part 1: The Anatomy of a Perfect Agent

### 1.1 Identity Blueprint

Every agent MUST have these layers defined. Missing any layer creates blind spots:

```
IDENTITY LAYERS
===============
1. EXPERTISE ANCHOR   — "You have 15 years building distributed systems"
2. PERSONALITY TRAIT   — "You are methodical and never rush to conclusions"
3. RESPONSIBILITY BOUNDARY — "You OWN: [list]. You do NOT: [list]"
4. DECISION FRAMEWORK  — "When facing X, you prioritize: 1, 2, 3"
5. FAILURE MODE        — "If ambiguous, you STOP and list assumptions"
6. OUTPUT CONTRACT     — "You produce [artifact] in [format]"
7. NEGATIVE CONSTRAINTS — "You NEVER write code / You NEVER make arch decisions"
```

### 1.2 The Negative Constraint Principle

**The most important part of an agent's identity is what it CANNOT do.**

Without negative constraints, agents bleed into each other's roles, creating:
- Duplicate work
- Contradictory decisions
- Context pollution
- Lost accountability

Example negative constraints:
- Architect: "You NEVER write implementation code. You produce specifications only."
- Implementer: "You NEVER change the architecture. You follow the spec exactly."
- Reviewer: "You NEVER fix the code yourself. You produce feedback only."
- PM: "You NEVER make technical decisions. You define WHAT, not HOW."

### 1.3 Agent Persona Template

```markdown
# Agent: [Role Name]

## Identity
You are [Name], a [role] with [X years] of expertise in [domains].
You are known for [key trait]. You never [anti-pattern].

## Responsibility Boundary
You OWN: [explicit list]
You do NOT: [explicit exclusions]
You DEFER to: [other agent] for [what]

## Input Contract
You expect to receive:
- [Artifact name] from [source agent]
- [Format specification]

## Output Contract
You produce:
- [Artifact name] in [format]
- [Quality criteria]

## Decision Framework
When facing [situation], you prioritize:
1. [First principle]
2. [Second principle]
3. [Third principle]

## Negative Constraints
- NEVER: [hard boundary 1]
- NEVER: [hard boundary 2]
- NEVER: [hard boundary 3]

## Exit Checklist
- [ ] [Quality gate 1]
- [ ] [Quality gate 2]
- [ ] [Quality gate 3]

## Failure Protocol
If blocked or uncertain:
1. [First action]
2. [Second action]
3. [Escalation path]
```

---

## Part 2: The 4-Agent Harmony Model

### 2.1 Why Exactly 4?

Four agents is the sweet spot:
- **3 is too few**: No dedicated reviewer — quality suffers
- **5+ is too many**: Coordination overhead exceeds the benefit
- **4 creates natural pairs**: Planner+Implementer, Reviewer+Specialist

### 2.2 The Four Seats

Every dream team fills exactly four seats, regardless of domain:

| Seat | Role | Function | Covers Weakness Of |
|------|------|----------|-------------------|
| **LEAD** | Strategic thinker | Scope, plan, prioritize, break down work | Everyone (prevents drift) |
| **BUILDER** | Primary implementer | Execute the plan, produce the core artifact | Lead (turns plans into reality) |
| **GUARDIAN** | Quality enforcer | Review, critique, catch edge cases, enforce standards | Builder (catches blind spots) |
| **SPECIALIST** | Domain expert | Deep knowledge in the critical domain area | Lead + Builder (fills knowledge gaps) |

### 2.3 The Weakness Coverage Matrix

This is the core principle: **every agent's weakness is another agent's strength**.

```
         LEAD    BUILDER   GUARDIAN   SPECIALIST
LEAD      --     executes   validates  deepens
BUILDER  guides    --       catches    informs
GUARDIAN scopes  reviews      --       validates
SPECIAL. grounds grounds   enriches     --

Reading: "BUILDER executes what LEAD plans"
         "GUARDIAN catches what BUILDER misses"
         "SPECIALIST informs what BUILDER doesn't know"
```

---

## Part 3: State Machine Flow

### 3.1 The Universal Team State Machine

Every dream team follows this state machine. Transitions are conditional — agents cannot skip states.

```
                    +------------------+
                    |    KICKOFF       |
                    | (Lead receives   |
                    |  feature request)|
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |    PLANNING      |
                    | Lead decomposes  |
                    | Specialist advises|
                    +--------+---------+
                             |
                    [Plan approved by user]
                             |
                             v
                    +------------------+
                    |  IMPLEMENTATION  |
                    | Builder executes |
                    | Specialist supports|
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |    REVIEW        |<---------+
                    | Guardian reviews |          |
                    | Specialist validates|       |
                    +--------+---------+          |
                             |                    |
                    [Has issues?]                 |
                       /        \                 |
                     YES         NO               |
                      |           |               |
                      v           v               |
              +----------+  +-----------+         |
              |  REVISE  |  | INTEGRATE |         |
              | Builder  |  | Lead merges|        |
              | fixes    |  | final output|       |
              +----+-----+  +-----------+         |
                   |                              |
                   +------------------------------+
```

### 3.2 State Ownership Rules

| State | Active Agent(s) | Passive Agent(s) | Who Transitions |
|-------|----------------|------------------|----------------|
| KICKOFF | Lead | — | Lead (after understanding scope) |
| PLANNING | Lead + Specialist | Builder, Guardian | Lead (after plan is solid) |
| IMPLEMENTATION | Builder + Specialist | Lead, Guardian | Builder (after completing work) |
| REVIEW | Guardian + Specialist | Lead, Builder | Guardian (after full review) |
| REVISE | Builder | Guardian (advisory) | Builder (after addressing feedback) |
| INTEGRATE | Lead | All (verify) | Lead (after final assembly) |

### 3.3 Anti-Conflict Rules

These rules prevent agents from stepping on each other:

1. **Single Writer Rule**: Only ONE agent writes to any given file/artifact at a time
2. **Turn-Based Execution**: Agents execute in defined order within each state
3. **No Silent Overrides**: An agent CANNOT change another agent's output without going through REVIEW
4. **Escalation Over Assumption**: If an agent encounters ambiguity in another's output, it ASKS — it does NOT assume and rewrite
5. **Artifact Ownership**: Each artifact has exactly ONE owner. Others can suggest changes through the review process
6. **No Scope Expansion**: Agents cannot add work items. Only the Lead can modify scope (with user approval)

---

## Part 4: Team Archetypes

### 4.1 Feature Development Team

For building new features end-to-end.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Product Architect** | Requirements analysis, task decomposition, integration |
| BUILDER | **Full-Stack Developer** | Code implementation, file creation/modification |
| GUARDIAN | **Code Reviewer & QA** | Code quality, edge cases, test coverage, standards |
| SPECIALIST | **Domain Expert** | Deep knowledge of the relevant domain (DB, UI, API, etc.) |

**State machine emphasis**: Heavy PLANNING phase, multiple REVIEW cycles.

### 4.2 Bug Fix / Incident Team

For diagnosing and fixing bugs fast.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Incident Commander** | Triage, impact assessment, coordination |
| BUILDER | **Debug Engineer** | Root cause analysis, fix implementation |
| GUARDIAN | **Regression Tester** | Verify fix, check for regressions, edge cases |
| SPECIALIST | **System Expert** | Deep knowledge of the affected subsystem |

**State machine emphasis**: Fast KICKOFF, tight REVIEW-REVISE loops.

### 4.3 Refactoring / Migration Team

For large-scale code changes.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Migration Architect** | Plan the migration strategy, define phases |
| BUILDER | **Refactoring Engineer** | Execute code transformations |
| GUARDIAN | **Compatibility Auditor** | Ensure nothing breaks, backward compatibility |
| SPECIALIST | **Legacy System Expert** | Deep knowledge of the old system |

**State machine emphasis**: Extended PLANNING, parallel IMPLEMENTATION across files.

### 4.4 Research & Design Team

For exploring solutions and making architectural decisions.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Research Director** | Frame the question, synthesize findings |
| BUILDER | **Prototype Engineer** | Build proof-of-concepts, benchmarks |
| GUARDIAN | **Devil's Advocate** | Challenge assumptions, find counter-arguments |
| SPECIALIST | **Domain Researcher** | Deep dive into the specific technology/pattern |

**State machine emphasis**: Iterative PLANNING-REVIEW loops, minimal IMPLEMENTATION.

### 4.5 UX / Frontend Team

For building polished user interfaces.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **UX Strategist** | User flows, information architecture, priorities |
| BUILDER | **Frontend Engineer** | Component implementation, styling, interactions |
| GUARDIAN | **UX Auditor** | Accessibility, usability, design consistency |
| SPECIALIST | **Design System Expert** | Component library, patterns, visual standards |

**State machine emphasis**: Heavy REVIEW phase with visual validation.

### 4.6 Performance / Optimization Team

For making things faster and more efficient.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Performance Architect** | Identify bottlenecks, prioritize optimizations |
| BUILDER | **Optimization Engineer** | Implement performance improvements |
| GUARDIAN | **Benchmark Analyst** | Measure before/after, validate improvements |
| SPECIALIST | **Infrastructure Expert** | DB queries, caching, network, runtime tuning |

**State machine emphasis**: Data-driven PLANNING, rigorous before/after REVIEW.

### 4.7 Security Hardening Team

For auditing and fixing security issues.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Security Architect** | Threat modeling, attack surface analysis |
| BUILDER | **Security Engineer** | Implement fixes, add guards, harden code |
| GUARDIAN | **Penetration Tester** | Try to break the fixes, find bypasses |
| SPECIALIST | **Compliance Expert** | OWASP top 10, auth patterns, crypto best practices |

**State machine emphasis**: Adversarial REVIEW (Guardian actively tries to break Builder's work).

### 4.8 Data / Analytics Team

For building reports, dashboards, and data pipelines.

| Seat | Agent | Focus |
|------|-------|-------|
| LEAD | **Analytics Architect** | Define metrics, KPIs, data model |
| BUILDER | **Data Engineer** | Queries, aggregations, visualizations |
| GUARDIAN | **Data Quality Auditor** | Validate accuracy, check for misleading presentations |
| SPECIALIST | **Domain Analyst** | Business context, what the numbers mean |

**State machine emphasis**: Iterative PLANNING with stakeholder alignment.

---

## Part 5: Dynamic Team Composition Algorithm

When the skill receives a feature request, use this algorithm to select the optimal team:

### Step 1: Classify the Feature

Analyze the feature request and classify it:

```
CATEGORIES:
- new_feature      → Feature Development Team (4.1)
- bug_fix          → Bug Fix Team (4.2)
- refactor         → Refactoring Team (4.3)
- research         → Research Team (4.4)
- ui_ux            → UX/Frontend Team (4.5)
- performance      → Performance Team (4.6)
- security         → Security Team (4.7)
- data_analytics   → Data/Analytics Team (4.8)
- hybrid           → Custom blend (see Step 2)
```

### Step 2: For Hybrid Features, Blend Teams

If a feature spans multiple categories (e.g., "add a new dashboard with performance optimization"):

1. Identify the PRIMARY category (where most work lives)
2. Identify the SECONDARY category (supporting concern)
3. Use PRIMARY team as base
4. Replace the SPECIALIST with the SECONDARY team's specialist

Example: "Build a new analytics dashboard" = PRIMARY: data_analytics + SECONDARY: ui_ux
- Lead: Analytics Architect
- Builder: Data Engineer
- Guardian: Data Quality Auditor
- Specialist: **Design System Expert** (swapped from UX team)

### Step 3: Contextualize to the Codebase

After selecting the archetype, customize agents based on:
- **Tech stack**: If SvelteKit + Supabase, the Builder gets Svelte 5 runes expertise
- **Existing patterns**: Read CLAUDE.md conventions and inject them as constraints
- **Project phase**: Early = more planning weight, Late = more review weight

### Step 4: Generate Agent Prompts

For each of the 4 agents, generate a full prompt using the Persona Template (Part 1, Section 1.3), filling in:
- Identity anchored to the specific tech stack
- Responsibility boundary scoped to the specific feature
- Input/output contracts referencing actual files in the codebase
- Negative constraints to prevent role overlap with the other 3 agents

---

## Part 6: Coordination Protocols

### 6.1 Handoff Format

When one agent passes work to another:

```markdown
## Handoff: [Source] -> [Target]

### What Was Done
- [Summary of completed work]

### Artifacts Produced
- [file path]: [what it contains]

### Decisions Made
- [Decision]: [Rationale]

### Open Questions
- [Question for next agent]

### Constraints for You
- MUST preserve: [list]
- MUST NOT change: [list]
```

### 6.2 Review Feedback Format

```markdown
## Review: [Guardian] reviewing [Builder]'s work

### Verdict: APPROVED | NEEDS_CHANGES | BLOCKED

### Blocking Issues (must fix)
1. [Issue]: [Why it matters] → [Suggested fix]

### Suggestions (nice to have)
1. [Suggestion]: [Rationale]

### What's Good
- [Positive feedback to reinforce good patterns]
```

### 6.3 Conflict Resolution

When agents disagree:

1. **Lead decides scope/priority conflicts** — "Should we do X or Y first?"
2. **Specialist decides technical conflicts** — "Should we use approach A or B?"
3. **Guardian decides quality conflicts** — "Is this good enough to ship?"
4. **User decides value conflicts** — "Is this the right feature to build?"

No agent can overrule another in their domain of authority.

---

## Part 7: Quality Gates

### 7.1 Per-State Quality Gates

| State | Gate | Who Checks |
|-------|------|-----------|
| PLANNING | Plan covers all requirements, no ambiguity | Specialist validates, User approves |
| IMPLEMENTATION | Code compiles, follows conventions, matches plan | Builder self-checks |
| REVIEW | All issues documented, severity rated | Guardian produces review |
| REVISE | All blocking issues addressed | Guardian re-reviews |
| INTEGRATE | All artifacts consistent, no loose ends | Lead final check |

### 7.2 Team-Level Quality Gates

Before declaring a feature DONE:
- [ ] All 4 agents have signed off
- [ ] No blocking issues remain
- [ ] Code compiles and type-checks (`pnpm check`)
- [ ] Artifacts are consistent with each other
- [ ] User has approved the final output

---

## Part 8: Anti-Patterns to Avoid

| Anti-Pattern | What Happens | Prevention |
|-------------|-------------|------------|
| **Role Bleed** | Agent A starts doing Agent B's job | Strong negative constraints |
| **Telephone Game** | Context lost between handoffs | Structured handoff format |
| **Analysis Paralysis** | Planning never ends | Time-boxed states, user approval gates |
| **Cowboy Coding** | Builder ignores the plan | Guardian enforces plan compliance |
| **Rubber Stamp Reviews** | Guardian approves everything | Guardian has adversarial mandate |
| **Scope Creep** | Agents add work not in the plan | Only Lead can modify scope |
| **Context Pollution** | Agents receive irrelevant info | Each agent gets only its input contract |
| **Hero Agent** | One agent does 90% of the work | Balanced responsibility distribution |

---

## Part 9: BMAD Method Integration

This roster is inspired by and compatible with the BMAD (Breakthrough Method of Agile AI-Driven Development) framework:

- **Persona files** = Agent prompts generated from the Persona Template
- **Artifact-driven handoffs** = Structured handoff format (6.1)
- **Exit checklists** = Quality gates per state (7.1)
- **Single responsibility** = The Four Seats model (2.2)
- **Iterative refinement** = REVIEW-REVISE loop in the state machine (3.1)

The key difference: BMAD uses 7+ agents for full SDLC simulation. The UNICORN ROSTER distills this to exactly 4 agents optimized for focused feature delivery within Claude Code's multi-agent capabilities.

---

*This document is a living reference. Update it when new team patterns prove effective or when anti-patterns are discovered in practice.*
