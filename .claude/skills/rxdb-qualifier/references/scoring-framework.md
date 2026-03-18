# RxDB Qualifier: Scoring Framework Reference

> This file contains the complete scoring matrices for the RxDB qualification assessment.
> All thresholds are calibrated from published research and industry frameworks.
> Read this file completely before scoring any collection.

---

## Table of Contents

1. [Domain A: Economics (Server Cost Reduction Potential)](#domain-a-economics)
2. [Domain B: UX Impact (Perceived Performance & Resilience)](#domain-b-ux-impact)
3. [Domain C: DX Impact (Implementation Complexity vs Benefit)](#domain-c-dx-impact)
4. [Composite Score Calculation](#composite-score-calculation)
5. [Hard Contra-Indicators (Automatic Disqualification)](#hard-contra-indicators)
6. [Authority Topology Decision Matrix](#authority-topology-decision-matrix)
7. [Application Archetype Quick-Match](#application-archetype-quick-match)
8. [Research Citations](#research-citations)

---

## Domain A: Economics (Server Cost Reduction Potential)

**Max Score: 12 points (6 dimensions × 2 points each)**

This domain quantifies how much server cost reduction RxDB would deliver. It is most
relevant when the backend is serverless (Neon, Supabase, PlanetScale, Turso) where
billing is on compute-hours and egress. For always-on backends, reduce all Econ scores
by 1 point per dimension (minimum 0).

### A1: Read Multiplicity Ratio (R)

_How many times is the same data re-read per session vs. how often it changes?_

**Research basis:** Serverless databases bill per query execution. Each redundant read
is a wasted compute cycle. RxDB eliminates all reads after the initial sync, converting
O(N) server cost to O(1).

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | R > 10:1 | Data is read 10+ times per session but changes ≤ once/day. Massive cache ROI. |
| **1** | R = 3:1 – 10:1 | Moderate re-read frequency. Meaningful but not transformative savings. |
| **0** | R ≈ 1:1 | Each read fetches genuinely new data. No caching benefit. |

**How to estimate R:** Count the number of times a page/component that displays this
collection's data is loaded or refreshed in a typical user session. Divide by the number
of times the underlying data actually changes in that period.

### A2: Write Batch Tolerance (W)

_How much latency can writes tolerate before reaching the server?_

**Research basis:** Each individual server write on serverless = one wake-up event.
Neon's minimum wake-up is ~0.5s cold start + query execution. Batching N writes into
one wake-up reduces total compute time by a factor approaching N.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | W > 30s | Writes can be batched into 30s+ windows. Maximum server sleep time. |
| **1** | W = 5s – 30s | Writes can be debounced. Moderate savings. |
| **0** | W < 5s | Near-synchronous server commit required. No batching benefit. |

**Decision guide:**
- POS transaction → W > 30s (batch on "Complete Order") = 2
- Chat message → W < 5s (users expect near-instant delivery) = 0
- Field inspection → W > 60s (batch on "Submit Report") = 2
- Financial transfer → W < 100ms (ACID required) = 0

### A3: Serverless Billing Sensitivity (B)

_How does the backend's billing model interact with this collection's access pattern?_

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Scale-to-zero serverless (Neon, Turso, PlanetScale serverless) | Every avoided query directly saves money. RxDB ROI is highest. |
| **1** | Provisioned serverless (Supabase pro, fixed CU allocation) | Cost savings exist but are bounded by provisioned capacity. |
| **0** | Always-on (self-hosted Postgres, RDS, dedicated instance) | Server runs regardless of query volume. RxDB doesn't reduce infra cost. |

### A4: Egress Volume Potential (E)

_How much data transfer would this collection generate without local caching?_

**Research basis:** Neon egress: ~$0.09/GB. Supabase: $0.09/GB after free tier.
At 50 users × 500KB payload × 20 loads/day = 500MB/day = 15GB/month = ~$1.35/month.
Modest, but scales linearly with users and compounds with multiple collections.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | > 5 GB/month projected egress for this collection | RxDB delta sync could reduce this by 80-95%. |
| **1** | 1-5 GB/month | Meaningful reduction. |
| **0** | < 1 GB/month | Negligible egress cost. Not a cost driver. |

### A5: Wake-Up Frequency Reduction (F)

_How many server wake-ups per hour would RxDB eliminate?_

**Research basis:** Neon cold start: ~0.5-2s. Each wake-up consumes a minimum compute
quantum even for trivial queries. At $0.16/CU-hour, 100 unnecessary wake-ups/hour
across users can cost $2-5/day.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Would eliminate > 50 wake-ups/hour across all users | Major cost driver. |
| **1** | Would eliminate 10-50 wake-ups/hour | Moderate savings. |
| **0** | < 10 wake-ups/hour already | Low-frequency access. Minimal wake-up savings. |

### A6: Sync Payload Efficiency (P)

_How much can delta sync reduce the data transferred vs. full fetches?_

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Dataset > 1000 rows, change rate < 5% per sync cycle | Delta sync transfers <5% of total dataset. Massive efficiency gain. |
| **1** | Dataset 100-1000 rows, or change rate 5-20% | Moderate delta efficiency. |
| **0** | Dataset < 100 rows or change rate > 20% | Delta sync overhead approaches full fetch cost. |

---

## Domain B: UX Impact (Perceived Performance & Resilience)

**Max Score: 10 points (5 dimensions × 2 points each)**

This domain quantifies the user-facing performance improvement RxDB would deliver.
Scoring uses research-backed perception thresholds.

### B1: Response Time Improvement (RAIL-R)

_How much faster would UI responses be with local data vs. server round-trips?_

**Research basis:** Google's RAIL model (2015) and Jakob Nielsen's response time
research (1993) establish three critical perception thresholds:
- **< 100ms**: User perceives action as instantaneous
- **100ms – 1000ms**: User notices delay but flow is unbroken
- **> 1000ms**: User's attention wanders; perceived as "slow"
- **> 10000ms**: User abandons task

NN/g's study of 298 designs found performance and satisfaction scores are strongly
correlated (r ≈ 0.7). The System Usability Scale (SUS) — a 10-item, 5-point Likert
questionnaire producing scores 0-100 — consistently shows higher scores for faster
interfaces. Average SUS across all tested products is ~68; scores above 80.3 represent
the top 10% (Grade A).

RxDB local reads typically complete in < 5ms (IndexedDB) to < 1ms (OPFS/SQLite).
Server round-trips typically range 50-500ms (nearby region) to 500-3000ms (cross-region
or cold start).

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Current server response > 500ms; RxDB would bring it under 100ms | Crosses the RAIL "instantaneous" threshold. Users perceive a qualitative change. Estimated SUS lift: +5 to +15 points. |
| **1** | Current server response 100-500ms; RxDB would reduce to < 50ms | Improvement is measurable but users may not consciously notice. Estimated SUS lift: +2 to +5 points. |
| **0** | Current server response already < 100ms (e.g., edge cache, CDN) | Already in the "instantaneous" zone. RxDB adds no perceptible speed gain. |

### B2: Offline Resilience Value (RAIL-L)

_How much value does the ability to work offline provide?_

**Research basis:** RAIL's Load guideline targets interactive content in < 5s.
When network is unavailable, server-dependent apps show infinite load time (complete
failure). Offline-first apps show 0ms load (local data). The gap is not incremental —
it is the difference between "works" and "doesn't work."

The Apdex (Application Performance Index) score formula:
`Apdex = (Satisfied + Tolerating/2) / Total`
Where Satisfied = response < T, Tolerating = response < 4T, Frustrated = response > 4T.
When offline, all server-dependent requests are Frustrated (Apdex contribution = 0).
Offline-first maintains Apdex = 1.0 for cached data regardless of network state.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Network reliability coefficient N < 0.7 (frequently offline) | Users regularly lose connectivity. Offline capability is a hard UX requirement. Apdex without RxDB drops below 0.5 during outages. |
| **1** | N = 0.7 – 0.95 (occasionally unreliable) | Periodic disruptions. Offline capability prevents frustration events. |
| **0** | N > 0.95 (reliably online, e.g., office admin panel) | Network failures are rare edge cases, not a UX concern. |

### B3: Perceived Data Freshness (Stale-While-Revalidate Effect)

_Does showing cached data immediately (even if slightly stale) improve perceived UX
vs. showing a loading spinner while fetching fresh data?_

**Research basis:** Google's Largest Contentful Paint (LCP) Core Web Vital targets
< 2.5s. Stale-while-revalidate patterns show content instantly (LCP ≈ 0) and update
silently in background. Users consistently rate "instant stale + background refresh"
higher than "delayed fresh" in satisfaction surveys, except when data staleness has
safety or financial implications.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Data can be minutes-to-hours stale without business impact | Perfect SWR candidate. Users see instant UI, data refreshes silently. |
| **1** | Data can be seconds stale (< 30s tolerance) | SWR still helps but the refresh window is tight. |
| **0** | Data must be real-time accurate (financial, safety-critical) | Stale data is a business risk. Server must be authoritative. |

### B4: Task Completion Resilience

_How does offline capability affect task completion rates?_

**Research basis:** NN/g identifies task success rate as a primary usability metric.
Apps that fail mid-task due to connectivity loss force users to re-enter data,
creating "error recovery" scenarios that dramatically reduce task-level satisfaction
(measured by SEQ — Single Ease Question — on a 1-7 scale). Research shows that
forced task restart reduces SEQ scores by 2-3 points on average.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Multi-step workflows where data loss on disconnect is catastrophic (field inspections, long forms, POS transactions) | RxDB prevents data loss entirely. Task completion rate: ~100% regardless of connectivity. |
| **1** | Short workflows where re-entry is annoying but not catastrophic | RxDB improves convenience but the cost of failure is low. |
| **0** | Single-action operations or server-mediated workflows | No multi-step local state to protect. |

### B5: Multi-Device Consistency Perception

_How important is it that users perceive consistent data across their devices?_

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Users actively work on multiple devices and expect seamless continuity | RxDB + sync provides this. Without it, users must manually transfer context. |
| **1** | Users occasionally switch devices | Nice-to-have but not critical. |
| **0** | Single-device use case | No cross-device sync benefit. |

---

## Domain C: DX Impact (Implementation Complexity vs Benefit)

**Max Score: 10 points (5 dimensions × 2 points each)**

This domain evaluates whether the engineering cost of implementing RxDB is justified
by the benefits. It uses dimensions adapted from the SPACE framework (Forsgren, Storey,
Maddila et al., 2021) and the DXI (Developer Experience Index) research by DX/Abi Noda,
which found that each 1-point DXI gain correlates to ~13 minutes/week saved per developer.

### C1: Schema Stability

_How stable is this collection's schema? Frequent schema changes multiply RxDB
maintenance cost._

**Research basis:** RxDB requires explicit JSON Schema definitions. Schema migrations
in a distributed local-first system are significantly more complex than server-only
migrations — every client device must be upgraded, and data must be migrated locally.
The DXI dimension "confidence in making changes" directly correlates with schema
stability. Unstable schemas reduce this confidence.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Schema is stable or changes < 1x per quarter | Low maintenance burden. Schema migration is rare. |
| **1** | Schema changes 1-3x per quarter | Moderate migration overhead. Manageable with RxDB's migration plugin. |
| **0** | Schema changes frequently (weekly or more) | Migration overhead dominates. RxDB becomes a maintenance liability. |

### C2: Conflict Resolution Complexity

_How complex is the conflict resolution logic required for this collection?_

**Research basis:** The DXI dimension "cognitive load" measures the mental effort
required to understand and maintain system behavior. Complex conflict resolution
significantly increases cognitive load. Single-writer patterns (C=1) require zero
conflict logic; LWW requires minimal; field-level merge requires substantial;
CRDT-based resolution requires deep expertise.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Single-writer guarantee (C=1) or pull-only (server-authoritative) | Zero conflict logic needed. DX overhead is minimal. |
| **1** | Low multi-writer (C=2-5), LWW acceptable | Simple conflict handler. Moderate DX overhead. |
| **0** | High multi-writer (C>5), custom merge logic required | Significant engineering investment in conflict resolution. |

### C3: Existing Stack Compatibility

_How well does RxDB integrate with the existing technology stack?_

**Research basis:** The SPACE "Efficiency and Flow" dimension measures how much
developers can stay in productive flow. Technology that requires extensive adapter
code, unfamiliar paradigms, or incompatible data access patterns disrupts flow.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Stack already includes reactive framework (Svelte, React) + client-side storage capability (Capacitor, Electron, PWA) | RxDB is a natural fit. Minimal glue code. |
| **1** | Partially compatible (e.g., SvelteKit SSR-first but can add client-side) | Some adaptation needed. Moderate integration effort. |
| **0** | Incompatible paradigm (server-rendered MPA, no client-side JS framework) | RxDB requires fundamental architecture change. |

### C4: Team Familiarity and Ramp-Up Cost

_How much learning is required to implement and maintain RxDB?_

**Research basis:** DXI's "deep work" dimension measures ability to focus without
interruption. New technology adoption temporarily reduces deep work capacity as
developers context-switch between learning and building. The SPACE "Activity" dimension
tracks productive output, which drops during ramp-up periods. Research from the
University of Waterloo's technology adoption framework shows ramp-up duration is
proportional to technology complexity and inversely proportional to prior experience.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Team has prior experience with RxDB, PouchDB, WatermelonDB, or similar local-first databases | Minimal ramp-up. Productive immediately. |
| **1** | Team understands reactive data and has built offline features before, but not with RxDB specifically | Moderate ramp-up (1-2 weeks). |
| **0** | Team has no local-first experience and limited reactive/sync expertise | Significant ramp-up (3-6 weeks). High risk of implementation errors. |

### C5: Maintenance Burden Proportionality

_Is the ongoing maintenance cost of the RxDB sync layer proportional to the benefit?_

**Research basis:** The DXI dimension "local iteration speed" measures how quickly
developers can make and validate changes. Each additional sync-related abstraction
(conflict handlers, tombstone cleanup, checkpoint management, storage limits) slows
iteration. This is justified only when the measured benefit (from Domains A and B)
exceeds the measured cost.

| Score | Threshold | Description |
|-------|-----------|-------------|
| **2** | Collection is core to the app's value proposition AND Domains A+B score ≥ 70% | Maintenance is justified by central importance and high benefit. |
| **1** | Collection is important but not core, OR Domains A+B score 40-69% | Marginal justification. Consider simpler caching alternatives. |
| **0** | Collection is peripheral, OR Domains A+B score < 40% | Maintenance cost exceeds benefit. Do not implement RxDB for this collection. |

---

## Composite Score Calculation

### Step 1: Normalize Domain Scores to Percentages

```
Domain_A_pct = (A1 + A2 + A3 + A4 + A5 + A6) / 12 × 100
Domain_B_pct = (B1 + B2 + B3 + B4 + B5) / 10 × 100
Domain_C_pct = (C1 + C2 + C3 + C4 + C5) / 10 × 100
```

### Step 2: Apply Priority Weights

Ask the user for their priority profile, or infer from context:

| Priority Profile | When to Use | W_econ | W_ux | W_dx |
|------------------|-------------|--------|------|------|
| **Cost-first** | Serverless backend, budget-constrained, scale concern | 0.50 | 0.30 | 0.20 |
| **UX-first** | Consumer app, field workers, emerging markets, unreliable connectivity | 0.25 | 0.50 | 0.25 |
| **DX-first** | Solo developer, tight deadline, MVP/prototype, small team | 0.20 | 0.30 | 0.50 |
| **Balanced** | No clear priority or mixed requirements | 0.34 | 0.33 | 0.33 |

### Step 3: Calculate Composite

```
Composite = (Domain_A_pct × W_econ) + (Domain_B_pct × W_ux) + (Domain_C_pct × W_dx)
```

### Step 4: Interpret

| Composite | Grade | Verdict |
|-----------|-------|---------|
| **75–100** | **A** | **STRONG ADOPT.** Implement full offline-first with bidirectional sync. |
| **55–74** | **B** | **CONDITIONAL ADOPT.** Evaluate per-collection. Hybrid topology recommended. |
| **35–54** | **C** | **LIGHTWEIGHT ALTERNATIVE.** Consider SWR cache, service worker, or simpler client cache. |
| **0–34** | **D** | **DO NOT ADOPT.** Standard server-side rendering is appropriate. |

---

## Hard Contra-Indicators (Automatic Disqualification)

If ANY of the following conditions are true for a collection, it is automatically
disqualified from RxDB adoption regardless of other scores. Mark the collection as
**BLOCKED** and explain the reason.

| Contra-Indicator | Condition | Reason |
|------------------|-----------|--------|
| **Regulatory Block** | Data is under HIPAA, PCI-DSS, or equivalent with client-storage restrictions | Legal prohibition on client-side persistence without extensive security infrastructure |
| **Strong Consistency Requirement** | Overselling, double-booking, or financial ledger integrity requires server-side ACID | Eventual consistency introduces unacceptable business risk |
| **Dataset Exceeds Client Capacity** | Unscopeable dataset > 100MB that cannot be filtered to a client-relevant subset | IndexedDB/OPFS cannot practically store the working set |
| **Schema Volatility** | Schema changes more than weekly with no migration strategy | Distributed schema migration would consume all DX budget |

---

## Authority Topology Decision Matrix

After scoring, use this matrix to determine the correct topology per collection:

| Composite Score | Write Origin | Recommended Topology |
|-----------------|-------------|---------------------|
| A (75-100) + writes from end-user devices | End-user | **Client-Authoritative (Topology B)** — RxDB is master, bidirectional sync |
| A (75-100) + writes from server/admin only | Server/admin | **Server-Authoritative (Topology A)** — RxDB is read cache, pull-only |
| B (55-74) | Mixed | **Hybrid (Topology C)** — evaluate per-collection |
| C (35-54) | Any | **No RxDB** — use SvelteKit load + SWR or service worker cache |
| D (0-34) | Any | **No RxDB** — standard server-side rendering |

---

## Application Archetype Quick-Match

Before running the full scoring matrix, check if the app matches a known archetype.
If it does, the expected score range is pre-calibrated:

| Archetype | Description | Expected Composite | Typical Topology |
|-----------|-------------|-------------------|-----------------|
| **Transactional Data Capture** | POS, ticket entry, booking kiosks, order terminals | 80-95 (Grade A) | Client-auth for transactions, server-auth for catalog |
| **Field Data Collection** | Meter reading, inspections, surveys, environmental monitoring | 85-100 (Grade A) | Client-auth for readings, server-auth for reference |
| **Operational Dashboard** | Task boards, logistics tracking, warehouse management | 60-80 (Grade A-B) | Hybrid — mostly pull, occasional status pushes |
| **Event Logging / Telemetry** | IoT sensors, activity tracking, incident logs | 75-90 (Grade A) | Push-only, no pull needed |
| **Offline-Tolerant Collaboration** | Shared project tools, team notes, collaborative checklists | 55-75 (Grade B) | Bidirectional with field-level merge |
| **Low-Frequency Dashboard** | Weekly report viewer, analytics display | 15-30 (Grade D) | No RxDB — server render |
| **Strong-Consistency Transactional** | Financial transfers, inventory reservation, live bidding | 5-20 (Grade D) | No RxDB — server must arbitrate |
| **Large Analytical Dataset** | Data warehouse queries, historical archives | 10-25 (Grade D) | No RxDB — server-side pagination |

---

## Research Citations

### UX & Perceived Performance
- **Nielsen, J. (1993).** "Usability Engineering." Response time thresholds: 0.1s (instant), 1.0s (flow), 10s (abandon). Foundation for RAIL model.
- **Google RAIL Model (2015).** Irish, P. & Lewis, P. Response: <100ms, Animation: <16ms/frame, Idle: <50ms chunks, Load: <5000ms interactive. Published at web.dev/rail.
- **NN/g (2018).** "User Satisfaction vs. Performance Metrics." Study of 298 designs showing r≈0.7 correlation between objective performance and subjective satisfaction. Users prefer faster design 70% of the time.
- **System Usability Scale (SUS).** Brooke, J. (1996). 10-item questionnaire, scores 0-100. Average: 68. Grade A (top 10%): >80.3. Grade F (bottom 15%): <51.
- **Single Ease Question (SEQ).** Sauro & Dumas (2009). 7-point post-task satisfaction scale. Benchmark mean: 5.5. Scores below 4.0 indicate serious usability problems.
- **Apdex (Application Performance Index).** Open standard for measuring user satisfaction with response time. Apdex = (Satisfied + Tolerating/2) / Total.

### Developer Experience
- **SPACE Framework.** Forsgren, N., Storey, M-A., Maddila, C., et al. (2021). Five dimensions: Satisfaction/well-being, Performance, Activity, Communication/Collaboration, Efficiency/Flow. Published in ACM Queue.
- **Developer Experience Index (DXI).** DX/Abi Noda & Laura Tacho. 14 dimensions including deep work, local iteration speed, release process, cognitive load. Each 1-point DXI gain ≈ 13 min/week saved per developer (~10 hrs/year). Top-quartile DXI teams show 4-5× higher engineering speed/quality. Based on data from 40,000+ developers across 800 organizations.
- **DX Core 4.** Unified framework combining DORA, SPACE, and DevEx. Four dimensions: Speed, Effectiveness, Quality, Impact.
- **NASA-TLX.** Hart & Staveland (1988). Multidimensional workload assessment (mental demand, temporal demand, effort, frustration, performance, physical demand). Cited in 9,000+ studies.

### Technology Adoption & Economics
- **Technology Adoption Lifecycle.** Rogers, E.M. (1962). Diffusion of Innovations. Innovators (2.5%), Early Adopters (13.5%), Early Majority (34%), Late Majority (34%), Laggards (16%).
- **TOE Framework.** Tornatzky & Fleischer (1990). Technology-Organization-Environment model for adoption decisions.
- **Neon Serverless Billing.** Compute: ~$0.16/CU-hour. Egress: ~$0.09/GB. Scale-to-zero after 5 min inactivity. Cold start: ~0.5-2s.
- **University of Waterloo Technology Adoption Framework.** Duration of competitive advantage = f(adoption stage × standard deviation of adoption cycle).

### Offline-First Architecture
- **Kleppmann, M. et al. (2019).** Local-first software and CRDTs for collaborative applications.
- **Offline-First Mobile Architecture (2024).** JAIGS, Vol 07, Issue 1. DOI: 10.60087. Multi-tier storage, delta synchronization, conflict resolution patterns.
- **Android Offline-First Guide (2025).** Refresh strategy thresholds: <5min (fresh), 5-30min (judgment zone), >30min (stale).
