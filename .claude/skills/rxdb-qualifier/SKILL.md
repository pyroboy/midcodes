---
name: rxdb-qualifier
description: >
  Assess the current codebase to determine if RxDB offline-first architecture is justified
  for this app. Analyzes actual code — schemas, data access patterns, write frequency,
  connectivity profile, backend billing model — and produces a per-collection scorecard.
  Trigger on: "qualify rxdb", "rxdb qualifier", "assess rxdb", "is rxdb needed",
  "does this app need rxdb", "evaluate offline-first", "audit data architecture",
  "is local-first justified", "rxdb fitness", "should we keep rxdb", "rxdb cost-benefit",
  "data layer assessment", or any request to evaluate whether the current app's data
  handling justifies RxDB or a local-first client database. Also trigger when discussing
  whether to add or remove RxDB from the current project, or when evaluating the data
  architecture during a refactor or architecture review.
---

# RxDB Qualifier: Codebase-Driven Offline-First Fitness Assessment

This skill evaluates whether the **current codebase** justifies RxDB (or equivalent
local-first database) adoption. It mines actual code artifacts — schemas, stores, routes,
replication config, optimistic writes, server actions — to produce a quantitative scorecard.
No user questionnaire needed; the codebase IS the questionnaire.

## When to Use This Skill

Run this assessment when:
- Evaluating whether the current app benefits from its RxDB implementation
- Considering adding RxDB to an app that doesn't have it yet
- Architecture review or refactor that questions the data layer
- Cost optimization audit for serverless backends
- The user asks "is RxDB justified for this app?" or "should we keep/add RxDB?"

## Assessment Workflow

### Step 0: Discover Codebase Context (Automated)

**Do NOT ask the user questions.** Instead, read the codebase to extract all context.

#### 0a. Read Project Documentation
Read these files to understand the app's purpose, stack, and architecture:
- `CLAUDE.md` (root and app-level) — architecture overview, stack, conventions
- Any PRD files (`docs/*.md`, `PRD*.md`) — product requirements, user personas
- `package.json` — dependencies, deployment target

Extract from these:
- **App description**: what does the app do, who uses it?
- **Backend stack**: serverless (Neon, Supabase, Turso) vs always-on?
- **Deployment target**: edge (Cloudflare Workers), serverless, traditional?
- **Auth model**: who are the users, what roles exist?

#### 0b. Discover Data Collections
Read these files to identify all data entities:
- **Server schema** (`src/lib/server/schema.ts` or equivalent Drizzle/Prisma schema)
- **Client schema** (`src/lib/db/schemas.ts` or equivalent RxDB/PouchDB schema)
- **If no client DB exists**: use the server schema as the collection list and assess each for RxDB fitness

For each collection, extract:
- Field count, field types (especially `decimal`, `timestamp`, `jsonb`)
- Primary key type (serial → string coercion needed?)
- Relationships (foreign keys, join tables)
- Soft-delete pattern (`deleted_at` field?)

#### 0c. Analyze Data Access Patterns
Read these files to understand how data flows:
- **Route files** (`src/routes/**/+page.server.ts`) — what server actions exist per entity?
- **Store files** (`src/lib/stores/*.svelte.ts` or equivalent) — how is data consumed in UI?
- **Optimistic write modules** (`src/lib/db/optimistic-*.ts`) — which collections have client writes?
- **Replication config** (`src/lib/db/replication.ts`) — what sync strategy is used?
- **API routes** (`src/routes/api/**`) — what server endpoints exist?

For each collection, determine:
- **Write origin**: client-only, server-only, or both?
- **Write frequency**: bulk batch, per-action, real-time stream?
- **Read pattern**: list views, detail views, dashboards, reports?
- **Re-read multiplicity**: how many components/pages consume this collection?

#### 0d. Infer Connectivity & Environment
From the codebase and PRD, infer:
- **Connectivity profile**: office app (always online), field app (intermittent), consumer app (variable)?
- **User environment**: desktop browser, mobile, PWA, native?
- **Concurrent users per device**: single-user or shared device?

#### 0e. Check for Regulatory Constraints
Scan for:
- PII handling (names, emails, phone numbers, addresses)
- Financial data (payment amounts, account numbers)
- Health data (HIPAA indicators)
- Any encryption-at-rest or data residency requirements

### Step 1: Read the Scoring Framework

**Before scoring, always read the reference file:**
```
references/scoring-framework.md
```
(Relative to this skill's directory)

This contains the full scoring matrices, research citations, weight calculations,
and interpretation thresholds. Do NOT score from memory — the framework has specific
numerical thresholds calibrated from research.

### Step 2: Score Each Collection

Apply the scoring framework **per data collection**, not globally. Use the data
gathered in Step 0 to fill in each dimension's score with evidence from the code.

For each collection, score across all three domains:
- **Domain A: Economics** (server cost reduction potential) — 6 dimensions, max 12 pts
- **Domain B: UX Impact** (perceived performance & resilience gain) — 5 dimensions, max 10 pts
- **Domain C: DX Impact** (implementation complexity vs benefit) — 5 dimensions, max 10 pts

**Evidence requirement:** Every score MUST cite the specific file and pattern that
justifies it. For example:
- "A1=2: `rx.svelte.ts` creates a reactive store for `tenants` consumed by 4 route pages
  (tenants, leases, rental-unit, reports) — R > 10:1 re-read ratio"
- "B2=1: App deploys to Cloudflare Pages (adapter-cloudflare in svelte.config.js),
  users are property managers — likely office/WiFi but not guaranteed"

### Step 3: Determine Priority Profile

**Infer the priority profile from the codebase** — do not ask the user:

| Signal in Code | Inferred Profile |
|----------------|-----------------|
| Scale-to-zero serverless backend (Neon, Turso, Supabase free tier) | **Cost-first** (0.50/0.30/0.20) |
| PWA manifest, service worker, Capacitor/Cordova, field-use PRD | **UX-first** (0.25/0.50/0.25) |
| Solo dev (single contributor in git), tight README deadlines | **DX-first** (0.20/0.30/0.50) |
| Mixed signals or unclear | **Balanced** (0.34/0.33/0.33) |

State which profile was chosen and why.

### Step 4: Calculate Weighted Composite Score

```
Domain_A_pct = (sum of A scores) / 12 × 100
Domain_B_pct = (sum of B scores) / 10 × 100
Domain_C_pct = (sum of C scores) / 10 × 100

Composite = (Domain_A_pct × W_econ) + (Domain_B_pct × W_ux) + (Domain_C_pct × W_dx)
```

### Step 5: Interpret and Recommend

| Composite Score | Verdict | Recommendation |
|-----------------|---------|----------------|
| **75–100** | **STRONG ADOPT** | RxDB is a clear architectural win. Implement full offline-first with bidirectional sync. |
| **55–74** | **CONDITIONAL ADOPT** | RxDB benefits exist but evaluate per-collection. Hybrid topology recommended. |
| **35–54** | **LIGHTWEIGHT ALTERNATIVE** | Full RxDB may be over-engineered. Consider SvelteKit `load` + `stale-while-revalidate`, or a simple service worker cache. |
| **0–34** | **DO NOT ADOPT** | RxDB adds complexity without proportional benefit. Use standard server-side rendering. |

### Step 6: Generate the Report

Save the report to the app's root directory as `RXDB_QUALIFICATION_REPORT.md`.

The report MUST contain:

1. **Executive Summary** — one-paragraph verdict with composite score and the key deciding factors from the codebase
2. **Codebase Evidence Summary** — table of what was discovered:
   - Collections found (client vs server-only)
   - Backend type and billing model
   - Deployment target
   - Connectivity profile (inferred)
   - Write patterns per collection
3. **Per-Collection Scorecard** — table showing each collection's scores across all 3 domains, with the evidence citation for each score
4. **Authority Topology Map** — which collections should be:
   - Client-authoritative (RxDB is master, bidirectional sync)
   - Server-authoritative (RxDB is read cache, pull-only)
   - Server-only (no RxDB needed)
5. **Risk Flags** — any dimensions that scored 0 (hard contra-indicators)
6. **Hard Contra-Indicator Check** — explicit pass/fail for each:
   - Regulatory block (HIPAA/PCI-DSS)
   - Strong consistency requirement
   - Dataset exceeds client capacity (>100MB unscopeable)
   - Schema volatility (weekly+ changes)
7. **Recommendations** — ordered action items:
   - Which collections to keep/add in RxDB
   - Which collections to remove/avoid in RxDB
   - Sync strategy recommendations per collection
   - Cost impact estimate
8. **UX Gain Summary** — expected perceived performance improvements using RAIL model thresholds

## Key Principles

- **Mine the code, don't interview the user.** The codebase contains all the answers — schemas, access patterns, deployment config, PRD. Read them.
- **Score per-collection, not per-app.** A single app almost always has a mix of RxDB-fit and RxDB-unfit data.
- **Every score needs a code citation.** No score without a file:line or pattern reference.
- **Zero is a valid score.** Hard contra-indicators produce 0 and override other scores.
- **The economics domain uses serverless-specific cost modeling.** If the backend is always-on, reduce Econ scores by 1/dimension (min 0).
- **If RxDB already exists in the codebase**, the assessment becomes a validation — is the current implementation justified? Are there collections that shouldn't be in RxDB?
- **If RxDB does NOT exist**, the assessment is a recommendation — which collections (if any) would benefit from local-first architecture?
