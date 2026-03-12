---
name: report-audit
description: >
  Audits WTFPOS report pages for data analytics quality using interactive playwright-cli
  commands and the Data Analytics Bible (docs/DATA_ANALYTICS_BIBLE.md). Use when the user asks
  for a "report audit", "data audit", "analytics review", "check this report", "is this chart
  correct", "does this data make sense", "audit the reports", "review the dashboard", "check
  the KPIs", "are the numbers right", or any request to evaluate a report page's metric accuracy,
  chart selection, data presentation, cognitive load, comparison context, or consistency with
  data visualization best practices. Also triggers on "wrong chart type", "misleading axis",
  "missing context", "vanity metric", "pie chart", "data-ink ratio", "KPI cards", "empty state",
  "comparison missing", "report looks off".
allowed-tools: Bash(playwright-cli:*)
---

# Report Audit — WTFPOS

Audits any WTFPOS report page against the Data Analytics Bible **and** the data schema layer
using playwright-cli snapshots. Traces every displayed metric back to its RxDB schema field
and PRD business requirement. Produces a structured report with schema provenance map,
12-dimension scorecard, PRD-grounded "Best Report" vision, and sequentially numbered findings.

## References

Before auditing, read the detailed skill and data reference:

- **Full skill workflow:** `skills/report-audit/SKILL.md`
- **Data Analytics Bible (all principles):** `docs/DATA_ANALYTICS_BIBLE.md`
- **PRD (business requirements):** `PRD2.md` — Module 3 + relevant domain module
- **Data schema:** `src/lib/db/schemas.ts` + `src/lib/types.ts`
- **playwright-cli commands:** `.claude/skills/playwright-cli/SKILL.md`

## Quick Workflow

1. **Interpret prompt** → map to report route(s)
2. **Read references** → Bible + PRD (full Module 3) + ENVIRONMENT
3. **Schema grounding** → read `schemas.ts`, `types.ts`, `seed.ts` — build Data Provenance Table
4. **Present audit plan** → DO NOT open browser yet
5. **Code + schema integrity check** → trace schema → store → component → display → PRD
6. **Workspace setup** → `skills/report-audit/work-{run-id}/`
7. **Interactive browser session** → playwright-cli snapshots (max 12)
8. **Write report** → `skills/report-audit/audits/YYYY-MM-DD_<report>-<branch>.md`
9. **Deliver & ask** → show scorecard + findings, ask which to fix

## Output Format

- **Flat sequential numbering:** `[01]`, `[02]`, `[03]`...
- **Five fields per issue:** What, Bible Violation, Why This Misleads, Ideal State, The Owner Story
- **Named personas:** Boss Chris (owner), Sir Dan (manager), Ate Rose (staff)
- **NO** P0/P1/P2 grouping — BANNED
- **NO** effort/impact tables — BANNED

## Scorecard Dimensions (12)

1. Information Hierarchy (Shneiderman)
2. KPI Card Design
3. Chart Selection (Cleveland & McGill)
4. Data-Ink Ratio (Tufte)
5. Color Encoding (Brewer)
6. Comparison Context
7. Cognitive Load (Sweller)
8. Data Integrity
9. Empty States
10. Accessibility
11. Anti-Patterns
12. Data Schema Cohesion (every metric traces to a real field + PRD requirement)
