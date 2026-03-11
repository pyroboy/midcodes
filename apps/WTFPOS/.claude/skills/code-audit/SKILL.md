---
name: code-audit
description: >
  Pre-flight code viability check for UX audit scenarios. Traces data flow, state transitions,
  store calls, and reactive chains through the codebase WITHOUT opening a browser. Identifies
  dead code paths, missing guards, broken reactive chains, unimplemented handlers, and state
  management gaps that would cause a UX audit to fail. This is a sub-skill of ux-audit —
  it runs automatically before every UX audit as Gate 0.5 (Code Viability Gate). Also invocable
  standalone. Triggers on: "code audit", "pre-check", "code viability", "trace the flow",
  "will this scenario work", "dry run".
---

# Code Audit — WTFPOS

Pre-flight code-only check that traces scenario viability through source code before the UX
audit opens a browser. No Playwright, no browser — just code reading and static trace analysis.

## References

Before auditing, read the detailed skill and trace templates:

- **Full skill workflow:** `skills/code-audit/SKILL.md`
- **Trace templates:** `skills/code-audit/references/TRACE_TEMPLATES.md`
- **Missed patterns log:** `skills/code-audit/references/MISSED_PATTERNS.md`
- **Known UX patterns:** `skills/ux-audit/references/KNOWN_PATTERNS.md`
- **Role workflows:** `skills/ux-audit/references/ROLE_WORKFLOWS.md`
- **PRD feature status:** `skills/ux-audit/references/PRD_QUICK_REF.md`

## Quick Workflow

1. **Parse scenario** — extract roles, pages, actions, data expectations, handoff points
2. **Map actions to code paths** — use trace templates (T1–T9) as starting points
3. **Read source files** — route → component → store → RxDB, verify each link in the chain
4. **Check each trace point** — route exists, component mounted, handler defined, store method implemented, RxDB write correct, reactive chain unbroken
5. **Cross-reference known patterns** — flag expected KP-## hits from KNOWN_PATTERNS.md
6. **Produce Viability Report** — routes summary, action traces, blockers, warnings, confidence score

## What Gets Checked

| Category | What | Pass condition |
|---|---|---|
| Route & access | Route file exists, role has nav access | File present + ROLE_NAV_ACCESS allows |
| Component chain | Component imported and mounted in parent | Import + tag in template |
| Store methods | Handler calls store method that exists | Method exported and implemented |
| RxDB writes | Uses incrementalPatch/Modify, has updatedAt + locationId | Correct pattern in method body |
| Reactive chain | $state → $derived → template binding unbroken | Data flows from RxDB to UI |
| Modal state | Open/close/reset logic, prerequisites met | State var + cleanup present |
| Cross-role (multi-user) | Role A write triggers Role B $derived update | RxDB subscription active on receiver |

## Output: Viability Report

- **Confidence:** HIGH / MEDIUM / LOW
- **Blockers:** Must fix before UX audit (file:line + fix hint)
- **Warnings:** Known patterns expected to surface (KP-## references)
- **Expected KP hits:** Pre-flagged for the UX audit to watch

## Human in the Loop Gates

- **CA-1 (Blocker Review):** HARD-STOP if blockers found → fix-iterate loop until clean
- **CA-2 (Warning Ack):** FAST-SKIP if warnings only → auto-proceed
- **CA-3 (Clean Pass):** AUTO-PROCEED → "Code audit clean, proceeding"
- **CA-4 (Post-Fix Next Steps):** AUTO-PROCEED after fixes applied → show fix summary, then continue to UX audit (or end if standalone)

## Integration with ux-audit

Runs automatically as **Gate 0.5** in the ux-audit pipeline (between scenario presentation and browser launch). Can also be invoked standalone via `/code-audit` or "check if this scenario will work".
