---
name: fix-audit
description: >
  Coordinates parallel agents to fix issues from UX audit reports. Reads an audit file,
  walks the user through every issue with acknowledgment and one-sentence future expectation,
  splits work across agents by module, updates the audit file with checkboxes and fix summaries,
  and runs pnpm check. Use when the user says "fix audit issues", "fix the audit", "fix P0s",
  "fix all issues", "fix-audit", "fix the UX issues", "implement audit fixes",
  "resolve audit findings", "fix everything from the audit", or "fix all P1s".
---

# Audit Issue Fix — WTFPOS

Fixes issues found by the ux-audit skill. Walks the user through each issue for acknowledgment,
collects one-sentence future expectations as acceptance criteria, coordinates parallel fix agents,
and updates the audit report in-place with checkboxes and summaries.

## References

Read the full skill workflow before fixing:

- **Full skill workflow:** `skills/fix-audit/SKILL.md`
- **Audit reports (input):** `skills/ux-audit/audits/`
- **WTFPOS conventions:** `CLAUDE.md`

## Quick Workflow

1. **Select audit file** — pick from `skills/ux-audit/audits/` or say "latest"
2. **Walkthrough** — list all issues with suggested one-sentence expectations
3. **Acknowledge** — one question at the end; user confirms, skips, or overrides
4. **Agent plan** — present module split, user approves
5. **Fix** — parallel agents implement all acknowledged fixes
6. **Update audit** — add checkboxes, fix summaries, and expectations to the audit file
7. **Validate** — `pnpm check`, map fixes to expectations
8. **ASCII Report** — render box-drawing summary table (scoreboard + per-issue rows + re-audit prompt)
9. **Re-audit** — suggest a follow-up ux-audit prompt to verify fixes

## Human in the Loop Gates

1. **Audit file selection** — which report to fix?
2. **Issue walkthrough** — flat list of all issues, one question at the end
3. **Agent plan approval** — review the module split before launching agents
4. **Schema change warning** — if any fix requires an RxDB schema bump
5. **Post-fix report** — results with expectation-met mapping, suggest re-audit

## Issue Expectation Format

Each issue gets a user-facing one-sentence expectation:

```
P0-01 · Staff · SVG floor tile click targets overlap [M]
  → Staff can rapidly tap adjacent tables on a full floor without opening the wrong one.
```

The expectation becomes the acceptance criteria — the fix is done when that sentence is true.
