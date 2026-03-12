---
name: report-audit
description: >
  Audits WTFPOS report pages for data analytics quality using interactive playwright-cli
  commands and the Data Analytics Bible (docs/DATA_ANALYTICS_BIBLE.md). Use this skill when
  the user asks for a "report audit", "data audit", "analytics review", "check this report",
  "is this chart correct", "does this data make sense", "audit the reports", "review the
  dashboard", "check the KPIs", "are the numbers right", or any request to evaluate a report
  page's metric accuracy, chart selection, data presentation, cognitive load, comparison
  context, or consistency with data visualization best practices. Also triggers on "wrong
  chart type", "misleading axis", "missing context", "vanity metric", "pie chart", "data-ink
  ratio", "KPI cards", "empty state", "comparison missing", "report looks off".
version: 1.0.0
---

# Report Audit — WTFPOS

This skill uses **interactive `playwright-cli` commands** to audit any WTFPOS report page
against the Data Analytics Bible (`docs/DATA_ANALYTICS_BIBLE.md`).

**How audits work:** Open browser with `playwright-cli open` → set viewport → login as owner
→ navigate to report page → take snapshots at key states → read snapshots with Claude vision
→ close browser → produce the audit report.

## OUTPUT FORMAT — READ THIS FIRST

**Every audit uses this issue format in Section D:**

```
[01] Issue title
[02] Issue title
[03] Issue title
```

Each issue gets **five mandatory fields**: What, Bible Violation, Why This Misleads, Ideal State, The Owner Story.

**NEVER DO ANY OF THESE:**
- P0 / P1 / P2 priority grouping — BANNED
- Tables with Effort / Impact columns — BANNED
- `P0-1`, `P1-2` style IDs — BANNED

**ALWAYS DO THESE:**
- Flat sequential numbering: `[01]`, `[02]`, `[03]`...
- All five fields per issue (What, Bible Violation, Why This Misleads, Ideal State, The Owner Story)
- Named persona in "Why This Misleads" (Boss Chris = owner, Sir Dan = manager, Ate Rose = staff)
- First-person quote in "The Owner Story"
- Fix Checklist uses `[01]`, `[02]` IDs (matching Section D)

See **Section D** in the Output Template for the full format specification.

---

## References

| Reference | Purpose | When to read |
|---|---|---|
| `docs/DATA_ANALYTICS_BIBLE.md` | Data analytics assessment framework | Every audit — the evaluation criteria |
| `skills/ux-audit/references/ENVIRONMENT.md` | Restaurant physical context | Every audit — adjusts expectations |
| `skills/ux-audit/references/PRD_QUICK_REF.md` | Feature status map | Every audit — prevents false positives |
| `PRD2.md` (Module 3 + relevant module) | Business intent — what questions each report must answer, who uses it, what decisions it enables | Every audit — grounds findings in end-user needs |
| `src/lib/db/schemas.ts` | All RxDB collection schemas — field names, types, indexes | Every audit — verifies displayed metrics trace to real fields |
| `src/lib/db/seed.ts` + `seed-history.ts` | Seed data — what test data exists and its shape | When assessing data substantiality and empty-state behavior |
| `src/lib/types.ts` | TypeScript types — Order, MenuItem, StockItem, KdsTicket, etc. | Every audit — canonical field definitions |
| `skills/ux-audit/references/BIR_REQUIREMENTS.md` | Philippine tax compliance | BIR reports (X-Read, Z-Read, EOD) |
| `.claude/skills/playwright-cli/SKILL.md` | Tool usage conventions | To understand how to control browser via CLI |

---

## WORKSPACE RULES

### WR-1 — Snapshots are the audit observation tool

`playwright-cli snapshot` outputs a **YAML accessibility tree** — element refs, labels, roles,
and structural hierarchy. This is how you:
- Count KPI cards and evaluate information density (Miller's Law)
- Verify axis labels, chart titles, and data labels
- Check for comparison context (vs. prior period, vs. target)
- Assess empty states, loading states, and zero-data handling
- Evaluate visual hierarchy and progressive disclosure

**Snapshot budget:** Max **12 snapshots per audit run**. Budget them for:
- Default landing state of the report page (required)
- Each filter/period variation that changes the view (1-2)
- Chart interactions (tooltips, drill-downs) (1-2)
- Empty state (if testable) (1)
- Mobile viewport (optional, 1)

### WR-2 — Dedicated workspace folder (run-scoped)

Every audit run gets its own uniquely-named folder.

**Naming pattern:** `skills/report-audit/work-{run-id}/`

Generate `{run-id}` at the start of every audit using:
```bash
_ra_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
```

### WR-3 — Clean start, clean end

**First commands of every audit:**
```bash
_ra_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ra_work="skills/report-audit/work-${_ra_run_id}"
mkdir -p "$_ra_work"
```

**Last command of every audit (after saving the final report):**
```bash
rm -rf "$_ra_work"
```

---

## Playwright CLI Conventions

Follow the same conventions as the ux-audit skill. Key patterns:

### PC-1 — Role Injection (Skip Login UI)

Reports are primarily viewed by **owner** and **manager** roles. Default to owner for full access:

```bash
playwright-cli -s=${_ra_run_id} open "http://localhost:5173"
playwright-cli -s=${_ra_run_id} sessionstorage-set wtfpos_session '{"userName":"Boss Chris","role":"owner","locationId":"tag","isLocked":false}'
playwright-cli -s=${_ra_run_id} goto "http://localhost:5173/reports/sales-summary"
```

**Session payloads for report audits:**

| Role | userName | locationId | Use case |
|------|----------|------------|----------|
| Owner (single branch) | Boss Chris | `tag` | Per-branch report accuracy |
| Owner (all branches) | Boss Chris | `all` | Cross-branch aggregate view |
| Manager | Sir Dan | `tag` | Operational report view |

### PC-2 — Report-Specific Interactions

Reports have interactive elements to test:

| Interaction | How to test |
|---|---|
| Period selector (Today/Week/Month) | `playwright-cli -s=${_ra_run_id} click text="Week"` |
| Drill-down from KPI card | `playwright-cli -s=${_ra_run_id} click` on the KPI card element |
| Chart tooltips | `playwright-cli -s=${_ra_run_id} mousemove` over chart data points |
| Tab switching (e.g., Meat Report tabs) | `playwright-cli -s=${_ra_run_id} click text="Transfers"` |
| Location switching | Click "Change Location" → select branch |
| Empty state | Switch to a date range with no data |

### PC-3 — Snapshot Reading for Data Assessment

When reading a snapshot, focus on these data-specific elements:

1. **KPI cards** — count them (Miller's Law: max 4-6), check for comparison context (vs. prior period), check for units/currency symbols
2. **Chart elements** — identify chart type, count series, check axis labels, check for direct labels vs. legend
3. **Tables** — check column headers, alignment (numbers right-aligned?), grouping/subtotals
4. **Filter bar** — what period options exist, what's the default, is "Live" indicator present
5. **Empty states** — what shows when no data? Zeros or "No data" message?
6. **Data freshness** — is there a "last updated" or generation timestamp?

### PC-4 — Known Failure Patterns

Same as ux-audit:
- SVG chart elements may not appear in snapshots — use `run-code` for chart inspection
- Complex JS evaluation needs `run-code`, not `eval`
- Use `goto` not `navigate`

---

## Audit Workflow

### Step 0 — Interpret Freeform Prompt

**Trigger:** Any time the audit request arrives as natural language.

**Goal:** Identify which report page(s) to audit and what aspects to focus on.

**How:**
1. Read the raw prompt — look for: specific report names, data concerns, chart complaints, metric accuracy questions
2. Map to specific report routes (see Report Route Map below)
3. Identify the assessment focus: accuracy, presentation, completeness, compliance, or full audit

**Report Route Map:**

| Report | Route | Key Metrics |
|--------|-------|-------------|
| Sales Summary | `/reports/sales-summary` | Gross/Net Sales, VAT, Avg Ticket, Pax |
| Best Sellers | `/reports/best-sellers` | Top items by volume/revenue |
| Peak Hours | `/reports/peak-hours` | Hourly traffic heatmap |
| Gross Profit | `/reports/profit-gross` | Revenue - COGS, margin % |
| Net Profit | `/reports/profit-net` | Revenue - all OpEx, take-home |
| X-Reading | `/reports/x-read` | BIR mid-shift snapshot |
| End of Day | `/reports/eod` | Z-Reading, blind close, utilities |
| Expenses Daily | `/reports/expenses-daily` | Daily expense breakdown |
| Meat Report | `/reports/meat-report` | Consumption, transfers, conversion |
| Stock Variance | `/reports/stock-variance` | Expected vs actual, drift % |
| Table Sales | `/reports/table-sales` | Per-table revenue |
| Voids & Discounts | `/reports/voids-discounts` | Void/discount audit |
| Branch Comparison | `/reports/branch-comparison` | Cross-location analytics |

**Output format (present to user before proceeding):**

```
## Report Audit Scope

| # | Report Page | Assessment Focus | Key Bible Sections |
|---|-------------|-----------------|-------------------|
| 1 | Sales Summary | Full audit | Sec 2 (Cognitive), 4 (Charts), 5 (Structure) |
| 2 | Net Profit | Chart accuracy + KPI context | Sec 4.1 (Tufte), 7 (Comparison) |

Proceeding with these audits. Let me know if any should be adjusted.
```

Then immediately continue to Step 1.

---

### Step 1 — Define Scope

Clarify with the user (or infer from prompt):
- **Report page(s)** — Which specific report route(s)?
- **Role** — Owner (default) or Manager?
- **Branch** — Which location? (`tag`, `pgl`, `all`)
- **Viewport** — Default tablet `1024x768`
- **Data state** — Should there be seed data? (usually yes for meaningful audit)

---

### Step 2 — Read References + Data Schema Grounding

#### 2a. Design & Context References
Read the Data Analytics Bible and relevant context:
```
docs/DATA_ANALYTICS_BIBLE.md                    <- evaluation criteria (THE core reference)
skills/ux-audit/references/ENVIRONMENT.md       <- physical context
skills/ux-audit/references/PRD_QUICK_REF.md     <- feature status
```

#### 2b. PRD Business Intent (MANDATORY)
Read the **full PRD** (`PRD2.md`) — specifically:
- **Module 3** (Analytics & Reporting) — the requirements for the report being audited
- **The relevant module** for the report's domain (e.g., Module 2 for meat/stock reports, Module 1 for POS/sales reports)

Extract and note:
1. **Business questions** — What specific question does the PRD say this report answers?
2. **Target persona** — Who is the primary user? (Owner reviewing weekly? Manager mid-shift? Kitchen lead checking waste?)
3. **Decision context** — What action should the user take after reading this report?
4. **Required comparisons** — Does the PRD specify comparisons (branch vs. branch, period vs. period, actual vs. target)?
5. **Compliance requirements** — Any BIR, tax, or regulatory requirements?

This ensures every finding is grounded in **what the business actually needs**, not just abstract data-viz principles.

#### 2c. Data Schema Grounding (MANDATORY)
Read the data layer to understand what fields and data actually exist:
```
src/lib/db/schemas.ts                           <- all 17 RxDB collection schemas (field names, types, indexes)
src/lib/types.ts                                <- TypeScript types (Order, MenuItem, StockItem, etc.)
src/lib/db/seed.ts                              <- initial seed data shape
src/lib/db/seed-history.ts                      <- historical seed data (what test data reports will render)
```

For the specific report being audited, trace:
1. **Which collections** does the report query? (orders, expenses, stock_items, deliveries, etc.)
2. **Which fields** does each displayed metric derive from? Map every KPI/chart data point to its schema field(s)
3. **Field existence check** — Does every metric shown on the report actually have a corresponding field in the schema? Flag phantom metrics (displayed values with no backing data)
4. **Data substantiality** — Is the seed data sufficient to produce meaningful report output? Are there enough records, date ranges, and variety to exercise all report states?
5. **Derivation gaps** — Are there metrics that require cross-collection joins or computed fields that don't exist yet?

**Output a Data Provenance Table** (include in audit notes, feeds into Section B Data Flow Map):

```
| Displayed Metric    | Collection(s)  | Field(s)              | Derivation          | Status    |
|---------------------|----------------|-----------------------|---------------------|-----------|
| Gross Sales         | orders         | total, status         | SUM(total) WHERE status='closed' | ✅ Exists |
| Avg Prep Time       | orders         | —                     | —                   | ❌ No field |
| Waste % by Cut      | waste, stock   | qty, stockItemId      | SUM(waste.qty) / SUM(stock.currentQty) | ✅ Derivable |
```

Statuses:
- **✅ Exists** — Field exists in schema, store reads it correctly
- **✅ Derivable** — No single field, but computable from existing fields via store logic
- **⚠️ Partial** — Field exists but data is sparse/incomplete in seed (report may look empty)
- **❌ No field** — Metric is displayed but has no backing data in the schema (phantom metric)
- **❌ Stale** — Field exists but is never written to by any store function

**If any ❌ items are found:** Flag as a **Data Integrity FAIL** in the scorecard. These are the most critical findings — the report is showing data that doesn't exist.

#### 2d. Report Page Source
Read the relevant report page source to understand:
- What store functions compute the data (`src/lib/stores/reports.svelte.ts`)
- What chart components are used (`src/lib/components/reports/`)
- What KPIs are displayed and their computation logic

---

### Step 3 — Present Audit Plan (MANDATORY)

**DO NOT OPEN THE BROWSER YET.**

Write out a step-by-step **Audit Plan** covering what you will check on each page:

> **Audit Plan:**
> 1. Open Sales Summary as Owner at Tagbilaran.
> 2. Check default state: KPI cards (count, context, units), chart type, axis labels.
> 3. Switch period to "Week" — verify comparison context updates.
> 4. Switch period to "Month" — check data density and chart scaling.
> 5. Test empty state by switching to a date range with no orders.
> 6. Switch to "All Locations" — verify aggregate vs. per-branch handling.
> 7. Check mobile viewport (375px width) for responsive behavior.

Only proceed to Step 4 after the plan is defined.

---

### Step 3.5 — Code Viability + Data Integrity Check (AUTO — Gate 0.5)

**DO NOT OPEN THE BROWSER YET.**

#### 3.5a. Code Viability (same as before)

1. Read the report page component (`src/routes/reports/<report>/+page.svelte`)
2. Read the store functions it calls (`src/lib/stores/reports.svelte.ts`)
3. Verify: does the store filter by `session.locationId`? Does it handle empty data?
4. Check chart components for: axis labels, formatters, responsive props

#### 3.5b. Schema-to-Display Integrity Trace (NEW)

Using the **Data Provenance Table** from Step 2c, verify the full chain:

1. **Schema → Store:** For each collection field used, confirm the store function actually reads it (not just that it exists in the schema)
2. **Store → Component:** For each derived value in the store, confirm the page component actually binds to it
3. **Component → Display:** For each bound value, confirm the visual component formats it correctly (currency, weight units, percentages, dates)
4. **PRD → Display:** Cross-reference the PRD business questions (Step 2b) against what the report actually shows — flag any PRD requirement that has no corresponding visual element

**Produce a Chain Integrity Summary:**

```
Schema → Store → Component → Display → PRD Requirement
✅      ✅      ✅           ✅         ✅   Gross Sales (PRD M3-R1: "daily revenue at a glance")
✅      ✅      ✅           ⚠️         ✅   Net Sales (missing ₱ symbol in mobile)
❌      —       —           —          ✅   Prep Time (PRD M3-R4 wants it, schema has no field)
✅      ✅      ✅           ✅         ❌   Color-coded day bars (not in PRD — nice to have, not required)
```

#### 3.5c. Gate Decision

**Based on combined results:**
- **Blockers found (any ❌ in Schema→Store→Component):** STOP. Present with file:line. Ask user: "Fix now or skip?"
- **PRD gaps found (PRD wants it, report doesn't show it):** Note as findings for Section D, proceed.
- **Warnings only:** Note briefly, proceed to Step 4.
- **Clean:** "Code + schema check clean." Proceed to Step 4.

---

### Step 4 — Workspace Setup

```bash
_ra_run_id=$(date +%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
_ra_work="skills/report-audit/work-${_ra_run_id}"
mkdir -p "$_ra_work"
```

---

### Step 5 — Interactive Browser Session

Run consecutive `playwright-cli` commands:

1. **Open** — `playwright-cli -s=${_ra_run_id} --headed open --persistent "http://localhost:5173"`
2. **Resize** — `playwright-cli -s=${_ra_run_id} resize 1024 768`
3. **Login** — Inject owner session via `sessionstorage-set`
4. **Navigate** — `playwright-cli -s=${_ra_run_id} goto "http://localhost:5173/reports/<route>"`
5. **Snapshot** — Take initial snapshot of default state
6. **Interact** — Click through period selectors, tabs, drill-downs per the audit plan
7. **Snapshot after each state change** — Capture each view variation
8. **Close** — `playwright-cli -s=${_ra_run_id} close`

**During the session, assess each snapshot against the Bible's 11 evaluation dimensions:**

| # | Dimension | Bible Section | What to check |
|---|-----------|--------------|---------------|
| 1 | **Information Hierarchy** | Sec 3.1 (Shneiderman) | Overview first? Progressive disclosure? |
| 2 | **KPI Card Design** | Sec 5.2 | Count ≤6? Comparison context? Units? Trend indicator? |
| 3 | **Chart Selection** | Sec 4.4 (Cleveland & McGill) | Right chart for the question? Lie factor? |
| 4 | **Data-Ink Ratio** | Sec 4.1 (Tufte) | Chartjunk? 3D effects? Unnecessary gridlines? |
| 5 | **Color Encoding** | Sec 4.6 (Brewer) | Sequential/diverging/categorical correct? CVD safe? |
| 6 | **Comparison Context** | Sec 7.1 (4 types) | No lonely numbers? vs. prior period? vs. target? |
| 7 | **Cognitive Load** | Sec 2.3 (Sweller) | Extraneous load minimized? Split-attention? |
| 8 | **Data Integrity** | Sec 6 | Nulls handled? Rounding correct? Timezone consistent? |
| 9 | **Empty States** | Sec 5.4 | What shows with no data? Zeros vs "No data"? |
| 10 | **Accessibility** | Sec 9 | Contrast ratios? Non-color encoding? Tabular numerals? |
| 11 | **Anti-Patterns** | Sec 10 | Any of the 10 anti-patterns present? |
| 12 | **Data Schema Cohesion** | Step 2c + PRD | Every metric traces to a real field? PRD requirements covered? No phantom metrics? |

---

### Step 6 — Write Report + Clean Up

Write the audit report using the **Output Template** below and save to:
```
skills/report-audit/audits/YYYY-MM-DD_<report-name>-<branch>.md
```

Then clean up:
```bash
rm -rf "$_ra_work"
```

---

### Step 7 — Report Delivery & Loop

**After saving the report:**

1. Display the **Summary Scorecard** (Section A)
2. Display every finding from **Section D**
3. State overall recommendation (one sentence)
4. **HITL: Fix Selection Gate** — Ask: "Which issues should I fix now?"

Do not automatically fix anything. Wait for user input.

---

## Audit Output Template

Every report audit includes all five sections. Do not skip any.

### A. Data Analytics Scorecard

Score each of the 11 dimensions. This is the at-a-glance health check:

```markdown
## A. Data Analytics Scorecard

| # | Dimension | Verdict | Key Finding |
|---|-----------|---------|-------------|
| 1 | Information Hierarchy | PASS / CONCERN / FAIL | [one-line evidence] |
| 2 | KPI Card Design | | |
| 3 | Chart Selection | | |
| 4 | Data-Ink Ratio | | |
| 5 | Color Encoding | | |
| 6 | Comparison Context | | |
| 7 | Cognitive Load | | |
| 8 | Data Integrity | | |
| 9 | Empty States | | |
| 10 | Accessibility | | |
| 11 | Anti-Patterns | | |
| 12 | Data Schema Cohesion | | |

**Overall:** X/12 PASS, Y CONCERN, Z FAIL
```

Verdicts:
- **PASS** — Meets the Bible's standards for this dimension
- **CONCERN** — Technically functional but violates a principle; may mislead under certain conditions
- **FAIL** — Violates a core principle; will produce incorrect interpretation or missing context

### B. Data Flow Map + Schema Provenance

Create an ASCII art representation of the **full data chain** — from schema fields through to display:

```
[Schema Field]         → [RxDB Collection] → [Store Function] → [Derived Metric]    → [Visual Component]    → [PRD Req]

orders.total (number)  → orders            → salesSummary()   → grossSales (₱)      → KpiCard "Gross Sales" → M3-R1 ✅
orders.total           → orders            → salesSummary()   → netSales (₱)        → KpiCard "Net Sales"   → M3-R1 ✅
orders.total + pax     → orders            → salesSummary()   → avgTicket (₱)       → KpiCard "Avg Ticket"  → M3-R1 ✅
orders.closedAt (date) → orders            → salesSummary()   → salesByDay[] (₱[])  → ReportBarChart        → M3-R1 ✅
— (no field)           → —                 → —                → avgPrepTime         → —                     → M3-R4 ❌ PHANTOM
```

**Key:**
- ✅ = Full chain intact, PRD requirement met
- ⚠️ = Chain intact but formatting/context issue
- ❌ PHANTOM = Displayed metric with no backing schema field
- ❌ MISSING = PRD requires it but not displayed at all

This traces where each number comes from **and whether it should exist at all** — essential for verifying both data integrity and business completeness.

**Include the Data Provenance Table** from Step 2c below the flow map for quick reference.

### C. "Best Report" Vision (PRD-Grounded)

Write a short narrative (4-5 paragraphs) describing what this report page would look like
if it perfectly followed **both** the Data Analytics Bible **and** the PRD requirements:

1. **The persona moment** — Who opens this report, when, and why? (Use the PRD's target persona from Step 2b. Boss Chris at end of week reviewing profitability? Sir Dan mid-shift checking kitchen throughput?)
2. **Business questions answered** — List each specific question from the PRD that this report must answer. Show how each KPI/chart maps to a question.
3. **Data that must exist** — What schema fields and collection data are required for this report to be meaningful? Flag any gaps from the Data Provenance Table.
4. **Comparison context** — What comparisons make the numbers actionable? (vs. last week, vs. other branch, vs. target, vs. industry benchmark)
5. **The decision moment** — What action does the user take after reading this report? What would they do differently if a number was red vs. green? This is the ultimate test — if the report doesn't change behavior, it's a vanity dashboard.

This grounds the technical assessment in **documented business requirements**, not abstract principles.

### D. Findings

Every issue gets the same depth. Numbered sequentially: `[01]`, `[02]`, etc.

**Each issue includes all five fields:**

```markdown
---

##### [01] <Issue title>

**What:** <Factual description of the data presentation issue. Reference specific
components, chart types, or metric computations.>

**Bible Violation:** <Cite the specific section(s) of the Data Analytics Bible being
violated. Format: "Section X.Y — [Principle Name]". Include the specific rule that is
broken and why it matters for data interpretation.>

**Why This Misleads:** <Scenario-based explanation of how this issue causes incorrect
interpretation or missed insight. Use a named persona (Boss Chris reviewing weekly
numbers, Sir Dan checking mid-shift performance). Describe what wrong conclusion they
might draw and what business decision they might make incorrectly as a result.>

**Ideal State:** <What the correct implementation looks like. Be specific: chart type,
axis configuration, comparison context, formatting, labels. A developer should be able
to read this and know exactly what "done" looks like.>

**The Owner Story:** "<First-person quote from Boss Chris or Sir Dan describing what
they need from this report. Keep it grounded in the restaurant business context.>"
```

### E. Fix Checklist

List every finding as a checkbox with its ID and a one-line fix description:

```markdown
## E. Fix Checklist

- [ ] `[01]` — Replace pie chart with horizontal bar (Cleveland & McGill rank 3 vs 4)
- [ ] `[02]` — Add "vs. last week" comparison to all KPI cards (Sec 7.4 — no lonely numbers)
- [ ] `[03]` — Show "N/A" instead of "0" when no data exists for period (Sec 6.2 — null vs zero)
```

---

## Self-Improvement Protocol

When the user corrects something this skill states or when an audit finding is wrong:
1. Update this skill file immediately
2. If the correction relates to a Bible principle, update `docs/DATA_ANALYTICS_BIBLE.md`
3. If a new anti-pattern is discovered, add it to Bible Section 10

---

## Report-Specific Checklists

These are additional checks for specific report types. Read the relevant one before auditing.

### BIR Compliance Reports (X-Read, Z-Read, EOD)

Read `skills/ux-audit/references/BIR_REQUIREMENTS.md` first. Additional checks:
- [ ] Sequential numbering (non-resettable)
- [ ] All mandatory BIR fields present
- [ ] VAT computation correct (12%, inclusive)
- [ ] SC/PWD discount breakdown separate
- [ ] Payment method breakdown (Cash, GCash, Maya)
- [ ] Z-Read seals the day (immutable after issue)

### Meat Report

Additional checks:
- [ ] Protein group colors consistent (pork=orange, beef=red, chicken=yellow)
- [ ] Weight units consistent (g vs kg, auto-promote at 1000g)
- [ ] Variance % formula correct: (Expected - Actual) / Expected
- [ ] Consumption vs waste clearly distinguished
- [ ] Transfer reconciliation: OUT from one branch = IN at the other

### Profit Reports (Gross, Net)

Additional checks:
- [ ] COGS classification correct (FOOD_COGS set matches)
- [ ] OpEx categories complete and non-overlapping
- [ ] Margin % calculation: (Profit / Revenue) * 100
- [ ] Negative profit displayed in red with minus sign
- [ ] P&L table rows indented correctly for hierarchy

### Cross-Branch Reports

Additional checks:
- [ ] Both branches always shown (never silently filter to one)
- [ ] Warehouse (`wh-tag`) excluded from revenue reports
- [ ] Normalization considered (per-seat, per-staff, per-hour) for fair comparison
- [ ] Same color encoding for branches across all charts
