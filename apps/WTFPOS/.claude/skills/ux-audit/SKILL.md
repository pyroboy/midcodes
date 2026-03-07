---
name: ux-audit
description: >
  Audits WTFPOS pages and flows for UX/UI quality using playwright-cli snapshots and a
  comprehensive design reference (Design Bible). Use when the user asks for a "UX audit",
  "design review", "usability check", "layout assessment", "heuristic evaluation",
  "accessibility check", "does this page feel right", "is this easy to use", "check the layout",
  "review the flow", "audit this screen", or any request to evaluate a page's usability, visual
  hierarchy, cognitive load, motor efficiency, or consistency with the WTFPOS design system.
  Also triggers on "touch targets", "contrast ratio", "too many buttons", "feels cluttered",
  "hard to find", or "confusing layout".
allowed-tools: Bash(playwright-cli:*)
---

# UX Audit — WTFPOS

Audits any WTFPOS page or flow against the Design Bible using playwright-cli snapshots.
Produces a structured report with ASCII layout map, 14-principle assessment, empathy narrative,
and prioritized P0/P1/P2 recommendations.

## References

Before auditing, read the detailed skill and design reference:

- **Full skill workflow:** `skills/ux-audit/SKILL.md`
- **Design Bible (all principles):** `skills/ux-audit/references/DESIGN_BIBLE.md`
- **playwright-cli commands:** `.claude/skills/playwright-cli/SKILL.md`

## Quick Workflow

1. **Define scope** — page/flow, role, branch, viewport (default: 1024x768 tablet)
2. **Open** — `playwright-cli open http://localhost:5173`
3. **Resize** — `playwright-cli resize 1024 768`
4. **Login** as target role
5. **Navigate + snapshot** each state (`playwright-cli snapshot`)
6. **Capture** interaction states (empty, loaded, active, error, completion)
7. **Close** — `playwright-cli close` — produce audit report (4 sections: Layout Map, 14-Principle Table, Best Day Ever, Recommendations)
8. **Save** — write report to `skills/ux-audit/audits/YYYY-MM-DD_<page>-<role>-<branch>.md`
9. **Respond** — confirm file saved, then show summarized assessment (verdict counts, P0 items, overall take)

## Audit Output Sections

| Section | Content |
|---|---|
| **A. Text Layout Map** | ASCII art showing vertical space, button positions, zones, fold line |
| **B. Principle-by-Principle** | 14-row table: Hick's, Miller's, Fitts's, Jakob's, Doherty, Visibility, Gestalt x2, Hierarchy x2, WCAG x2, Consistency x2 — each with PASS/CONCERN/FAIL |
| **C. Best Day Ever** | Empathy narrative from target role's perspective during a busy shift |
| **D. Recommendations** | P0/P1/P2 with effort (S/M/L) and impact (High/Med/Low) |

## Human in the Loop Gates

1. **Production URL** — stop if URL is not localhost (confirm with user before proceeding)
2. **Muscle memory** — warn before recommending layout changes to daily-use pages (`/pos`, `/kitchen/orders`, checkout flow)

## WTFPOS Design Context

| Parameter | Value |
|---|---|
| Touch target min | 44px (48px for `.btn`) |
| Accent color | `#EA580C` (orange) |
| Device | 10-12" tablets, touch-first |
| Fonts | Inter (body), JetBrains Mono (prices/timers) |
| Layout shell | AppSidebar + LocationBanner + SidebarInset |
| Data layer | RxDB local-first (instant writes) |

## Previous Audits

Check `skills/ux-audit/audits/` for existing audit reports to avoid duplicate work and track improvements over time.
