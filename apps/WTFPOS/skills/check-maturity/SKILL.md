---
name: check-maturity
description: >
  Evaluates WTFPOS application maturity against its PRD using a 4-level maturity
  framework. Audits feature completeness, UX adherence, operational stability,
  and technical debt across all four modules. Generates a dated maturity report
  with per-module scores, gap analysis, and prioritized recommendations.
  Triggers on "maturity check", "check maturity", "PRD alignment", "how mature",
  "how complete", "feature completeness", "readiness assessment", "progress report",
  "PRD gap analysis", "maturity audit", "how far along", "what's missing".
version: 1.0.0
---

# Check Maturity — PRD Alignment & Application Maturity Audit

Measures the delta between what the PRD promises and what the live WTFPOS application actually delivers. Produces a comprehensive maturity report scoring the app across four dimensions and four PRD modules.

---

## References

| Reference | Purpose |
|---|---|
| `references/MATURITY_FRAMEWORK.md` | The 4-level maturity scale, evaluation dimensions, and continuous optimization theory |
| `PRD.md` (project root) | The Product Requirement Document — the baseline for all evaluation |
| `CLAUDE.md` (project root) | Current architecture, routes, components, collections, and conventions |

---

## Output

Reports are saved to `skills/check-maturity/reports/` with the naming convention:

```
YYYY-MM-DD_maturity-report.md
```

Each report contains:
1. **Executive Summary** — overall maturity level (1–4), one-paragraph verdict
2. **Module Scorecards** — per-module (M1–M4) feature completeness percentage
3. **Dimension Assessment** — scores across 4 dimensions (Feature Completeness, UX Adherence, Operational Stability, Technical Debt)
4. **Gap Analysis** — every PRD requirement mapped to Implemented / Partial / Missing
5. **Priority Recommendations** — P0/P1/P2 items blocking the next maturity level
6. **Technical Debt Inventory** — known shortcuts, workarounds, hardcoded values
7. **Maturity Trajectory** — what must happen to reach the next level

---

## Maturity Levels (adapted for WTFPOS)

| Level | Label | WTFPOS Indicators |
|---|---|---|
| **1 — Emerging** | Alpha / Draft | Basic flows work but high defect rate, missing modules, no deployment pipeline |
| **2 — Defined** | Beta / MVP | All 4 modules have core features, but optimization is low, some PRD items missing |
| **3 — Mature** | V1 Production | Full PRD coverage, stable operations, low defect rate, UX matches design system |
| **4 — Leading** | Continuous Optimization | Real-time telemetry, predictive analytics, PRD evolves from live data, zero-downtime deploys |

---

## Evaluation Dimensions

### Dimension 1: Feature Completeness

Compare every functional requirement in PRD.md against the live codebase:

**Module 1 — Core POS & System Foundation:**
- Visual table floor map with live statuses
- 90-minute countdown timer with color-coded alerts
- Table Reset Tracking
- Pax-First Seating (pax → package → running bill)
- Pax Modifications (Manager PIN required)
- Per-table order entry with categorized menu
- Mid-session add-ons
- Package Upgrades (prorated)
- Grace Period Voids (30-second window)
- Senior/PWD discounts (20%, pro-rata for AYCE)
- Multiple payment methods (Cash, GCash, Maya)
- Manager PIN for cancellations/refunds
- Cash Drawers & Floats
- Master KDS screen
- Dedicated Bluetooth Weighing Screen
- Live Weigh-Out (exact gram deductions)
- KDS Bump Flow
- Thermal receipt printing (BIR compliance)
- BIR X-Readings and Z-Readings

**Module 2 — Stock Management:**
- End-to-end tracking (delivery → debone → slice → weigh-out → waste)
- Role-based access (Butcher, Server)
- Preparation waste logging
- Three daily stock counts (10 AM, 4 PM, 10 PM)
- Dynamic stock counting (reconciliation at exact minute)
- Variance and accuracy reports

**Module 3 — Multi-Branch Analytics & Reporting:**
- Centralized owner-level view (up to 2 branches)
- Branch-level data isolation
- Branch managers see only their own data
- Global navigation (Floor | Stock | Reports | Admin)
- Consolidated EOD & Daily Reports
- Missing Inventory (Drift) Tracking
- Expense Management Entry
- Daily Expense Breakdown
- Monthly Expense Trend
- Sales Summary & Revenue Trend
- Best-Selling Items & Meat Consumption
- Peak Service Hours & Turnovers
- Gross Profit Summary
- Net Profit Summary
- Branch Comparison

**Module 4 — Administration & System Logs:**
- Global Branch Selection (Owner/Admin only)
- Admin Portal link in navigation
- User Management (CRUD)
- Global App Logs

### Dimension 2: UX Adherence

Evaluate against PRD Section 4 (UI/UX & Interface Requirements) and `CLAUDE.md` design system:
- Touch-optimized hit areas (min 44px)
- State indicators & fallbacks (sync status, kitchen offline alert)
- Authentication (numeric keypad for PIN)
- Floor Plan View (visual table layout + 90-min timer)
- Register View (split panes, mid-session add-ons, payments)
- KDS & Weighing View (high-contrast, knuckle-sized buttons, wet-environment)
- Meat & Pantry forms (receiving, waste, timed counts)
- Expense Entry (PIN-protected, categorized)
- Analytics Dashboard (branch toggle, data visualizations)

### Dimension 3: Operational Stability

Evaluate the application's non-functional maturity:
- Build process (`pnpm build` succeeds cleanly)
- Type safety (`pnpm check` passes)
- Schema migrations (all have strategies)
- Offline-first resilience (RxDB + IndexedDB)
- Error handling (dev overlay, DbHealthBanner, ConnectionStatus)
- Device heartbeat monitoring
- Update safety (service worker, no mid-transaction refresh)
- Deployment protocol adherence

### Dimension 4: Technical Debt

Identify and catalogue:
- Deprecated components still in use (e.g., TopBar)
- Legacy shims (e.g., `pos.svelte.ts` re-export)
- Hardcoded values (e.g., Manager PIN `1234`)
- Missing test coverage
- Schema version gaps or skipped migrations
- TODO/FIXME/HACK comments in codebase
- Unused imports or dead code
- Phase 1 workarounds that Phase 2+ would resolve

---

## Workflow

### Step 1: Launch Parallel Evaluation Agents

Launch **four agents in parallel**, one per evaluation dimension:

**Agent A — Feature Completeness:**
- Read `PRD.md` for the full requirements list
- Read `CLAUDE.md` for the current route map and component inventory
- For each PRD requirement, search the codebase to verify implementation
- Classify each as: **Implemented** (fully working), **Partial** (exists but incomplete), or **Missing** (not found)
- Return a structured table with module, requirement, status, and evidence (file:line)

**Agent B — UX Adherence:**
- Read PRD Section 4 (UI/UX requirements)
- Read `CLAUDE.md` design system section
- Inspect key page components for touch targets, design tokens, responsive patterns
- Check for state indicators (ConnectionStatus, DbHealthBanner, LocationBanner)
- Check for the specialized KDS/weighing high-contrast interface
- Return a UX compliance table with requirement, status, and notes

**Agent C — Operational Stability:**
- Run `pnpm check` and capture results
- Inspect `db/index.ts` for migration coverage
- Verify error handling components exist and are mounted in root layout
- Check for deployment protocol artifacts (version.ts, service worker config)
- Verify offline-first patterns (RxDB guards, browser checks)
- Return an operational health table

**Agent D — Technical Debt:**
- Search for `TODO`, `FIXME`, `HACK`, `DEPRECATED`, `legacy`, `shim`, `workaround` in codebase
- Check for hardcoded values (PIN codes, magic numbers)
- Identify unused exports or dead code
- Check for deprecated component usage
- Count files without TypeScript strict types
- Return a categorized debt inventory with severity (Critical/High/Medium/Low)

### Step 2: Synthesize Results

After all four agents return:

1. **Calculate per-module feature completeness:**
   - Count Implemented / Partial / Missing per module
   - Percentage = (Implemented + 0.5 × Partial) / Total × 100

2. **Determine overall maturity level:**
   - Level 1 if any module < 40% complete
   - Level 2 if all modules ≥ 40% and average < 70%
   - Level 3 if all modules ≥ 70% and average ≥ 85%
   - Level 4 if Level 3 + operational excellence + zero critical debt

3. **Identify the top blockers preventing the next level**

### Step 3: Generate Report

Write the report to `skills/check-maturity/reports/YYYY-MM-DD_maturity-report.md`

---

## Report Template

```markdown
# WTFPOS Maturity Report

**Date:** YYYY-MM-DD
**Evaluator:** Claude (check-maturity skill v1.0.0)
**PRD Baseline:** PRD.md
**Current Phase:** Phase 1 — Local-First Foundation

---

## Executive Summary

**Overall Maturity Level: [1–4] — [Label]**

[One paragraph summarizing the application's current state, strongest areas,
and the single biggest gap preventing the next maturity level.]

---

## Module Scorecards

| Module | Requirements | Implemented | Partial | Missing | Score |
|---|---|---|---|---|---|
| M1: Core POS & Foundation | N | n | n | n | NN% |
| M2: Stock Management | N | n | n | n | NN% |
| M3: Analytics & Reporting | N | n | n | n | NN% |
| M4: Administration & Logs | N | n | n | n | NN% |
| **Overall** | **N** | **n** | **n** | **n** | **NN%** |

---

## Dimension Scores

| Dimension | Score | Level | Notes |
|---|---|---|---|
| Feature Completeness | NN% | L# | ... |
| UX Adherence | NN% | L# | ... |
| Operational Stability | NN% | L# | ... |
| Technical Debt | [Low/Med/High/Critical] | L# | ... |

---

## Detailed Gap Analysis

### Module 1: Core POS & System Foundation

| # | PRD Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| 1.1 | Visual table floor map | ✅ Implemented | FloorPlan.svelte | ... |
| ... | ... | ... | ... | ... |

### Module 2: Stock Management
[Same table format]

### Module 3: Analytics & Reporting
[Same table format]

### Module 4: Administration & System Logs
[Same table format]

---

## UX Compliance

| PRD UX Requirement | Status | Evidence | Notes |
|---|---|---|---|
| Touch-optimized hit areas (44px) | ✅ | app.css min-height rule | ... |
| ... | ... | ... | ... |

---

## Operational Health

| Check | Status | Details |
|---|---|---|
| `pnpm check` passes | ✅/⚠️/❌ | N errors, N warnings |
| Schema migrations complete | ✅/❌ | N/N collections covered |
| ... | ... | ... |

---

## Technical Debt Inventory

| # | Category | Severity | Description | File(s) | Remediation |
|---|---|---|---|---|---|
| 1 | Deprecated | Medium | TopBar still imported in N files | ... | Remove, use AppSidebar |
| ... | ... | ... | ... | ... | ... |

**Debt Summary:** N Critical, N High, N Medium, N Low

---

## Priority Recommendations

| Priority | Item | Blocking Level | Effort | Impact |
|---|---|---|---|---|
| P0 | ... | L3 → L4 | S/M/L | High |
| P1 | ... | L2 → L3 | S/M/L | Medium |
| P2 | ... | Polish | S/M/L | Low |

---

## Maturity Trajectory

**Current Level:** [N] — [Label]
**Next Level:** [N+1] — [Label]

**To reach Level [N+1], the following must be completed:**
1. ...
2. ...
3. ...

**Estimated gap:** N PRD requirements remaining (N% of total)
```

---

## Human in the Loop Gates

### Gate 1: Before Running Full Audit

**Trigger:** User invokes `/check-maturity` or asks for a maturity assessment.
**Ask:** "I'll evaluate WTFPOS against all PRD requirements across 4 dimensions. This will read many files across the codebase. Should I proceed with the full audit, or focus on a specific module (M1–M4)?"
**Why:** A full audit launches 4 parallel agents reading dozens of files. Let the user scope it down if they only care about one area.

### Gate 2: Before Saving Report

**Trigger:** Report is synthesized and ready to save.
**Action:** Print the Executive Summary and Module Scorecards to chat. Ask: "Here's the summary. I'll save the full report to `skills/check-maturity/reports/`. Proceed?"
**Why:** The user should see the verdict before a file is written.

---

## Critical Rules

1. **PRD.md is the single source of truth** — every requirement evaluation maps back to a specific PRD line item
2. **Never inflate scores** — if a feature is partially implemented, it's Partial, not Implemented. If it exists in code but has known bugs, it's Partial.
3. **Evidence-based** — every status must cite a file path or component name as evidence
4. **Phase-aware** — features planned for Phase 2+ that aren't implemented are NOT counted as "Missing". They are excluded from the score and noted as "Deferred to Phase N"
5. **No hallucinated features** — if a search doesn't find implementation evidence, the feature is Missing. Don't assume it exists because a related component exists.
6. **Technical debt is not failure** — intentional debt (like hardcoded PIN for MVP) is catalogued but not penalized the same as unintentional debt
7. **Run `pnpm check` as part of every audit** — type safety is a core maturity signal

---

## Self-Improvement Protocol

- **When user corrects a status assessment:** Update this skill's evaluation criteria to prevent the same mis-classification
- **When PRD is updated:** Re-read PRD.md before next audit to pick up new/changed requirements
- **When new routes/components are added:** These may satisfy previously "Missing" requirements — re-evaluate on next run
- **When a new module or dimension is suggested:** Add it to the evaluation framework and bump skill version

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-03-08 | Initial skill creation with 4-dimension framework, parallel agent workflow, report template |
