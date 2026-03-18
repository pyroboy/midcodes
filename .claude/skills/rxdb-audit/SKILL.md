---
name: rxdb-audit
description: Audits RxDB offline-first implementations for cost efficiency, sync correctness, and architectural best practices. Use this skill when the user asks to audit, review, or evaluate their RxDB setup, check sync efficiency, evaluate replication patterns, assess server cost impact, review offline-first architecture, or wants to know if their RxDB implementation follows best practices. Also triggers on "is my sync efficient", "are we calling the server too much", "review the replication", "check the offline-first setup", "audit the database layer", "RxDB health check", "sync cost review", or any request to evaluate whether an RxDB implementation is optimally minimizing server resource consumption. Even if the user just says "audit the db" or "check the sync layer", this skill should trigger.
---

# RxDB Offline-First Architecture Audit

**The one rule:** Every design decision exists to **call the server less.** Every unnecessary round-trip is wasted money. Every idle compute hour prevented is profit kept.

Three non-negotiable patterns underpin every RxDB sync system:
1. **Tombstones** — soft-delete via `_deleted`/`deleted_at`, never physical DELETE on replicated tables. Without this, deleted records resurrect as zombie data.
2. **Checkpoints** — delta pulls via `updated_at + id` pagination. Without this, every sync is a full table scan.
3. **Conflict resolution** — deterministic strategy (LWW, server-wins, field-merge). Without this, rejected pushes create retry storms.

Four pillars separate a production-grade implementation from a toy one:
1. **Offline write buffering** — writes persist locally and push in background; per-document queuing prevents lost updates.
2. **Conflict resolution** — server-side push guards enforce business logic (state machines, dedup, auto-merge) beyond simple LWW.
3. **Storage persistence & recovery** — auto-recovery from IndexedDB corruption, migration timeouts, multi-tab reset coordination.
4. **Schema migrations** — sequential `migrationStrategies` with backfill defaults, supporting PK changes and data restructuring.

## References

- `references/best-practices.md` — decision matrices, cost economics, detailed reasoning for each pattern
- `references/offline-first-patterns.md` — production-grade code patterns for the four pillars (write buffering, conflicts, storage, migrations) plus resilience patterns (circuit breakers, backoff, reconciliation, diagnostics)

## Audit Workflow

### Phase 1: Discovery

Identify the target app and read its RxDB implementation files:

| File | What to extract |
|------|----------------|
| `db/index.ts` | Storage engine, plugins, singleton pattern, error recovery, migration timeouts, auto-reset |
| `db/schemas.ts` | Collection schemas — check every field for `id`, `updated_at`/`updatedAt`, `_deleted`/`deleted_at`. Check `version` numbers and `migrationStrategies` |
| `db/replication.ts` | `live` flag, batch size, retry strategy, checkpoint logic, push/pull direction, generation-based resync, SSE/polling, circuit breaker |
| `db/optimistic.ts` or `db/write-proxy.ts` | Write patterns, per-document queuing, resync triggers, debouncing, thin client vs full mode |
| `db/reconcile.ts` (if exists) | Auto-heal checks, orphan detection, stale status cleanup |
| Pull/push API endpoints | Server-side query shape, auth checks, scoping filters, push guards (state machine, dedup, auto-merge), audit trail |
| Reactive stores (`*.svelte.ts`) | Subscription lifecycle, cleanup, soft-delete filters in queries |
| `connection.svelte.ts` (if exists) | Connectivity detection: probe-based vs navigator.onLine only, tiers, circuit breakers |
| Service worker / manifest | PWA setup, cache strategies, offline navigation fallback |

### Phase 2: Checklist Audit

Score each item: **PASS** / **WARN** / **FAIL** / **N/A**.

Not every item applies to every topology. A pull-only app doesn't need conflict handlers. A LAN-only app doesn't have serverless cost concerns (but still needs data integrity checks). Adapt the lens — for serverless backends, the economic lens dominates; for LAN setups, reliability and data integrity dominate.

#### 1. Authority Topology
- [ ] Authority explicitly defined per collection (server-auth, client-auth, or hybrid)
- [ ] Pull-only collections have no push logic
- [ ] Client-authoritative collections have declared conflict handlers

#### 2. Adoption Justification
- [ ] No anti-pattern collections (ephemeral state, strong-consistency data, >100MB unscopeable datasets)
- [ ] Collections scoped to client needs (filtered by org/role/time, not full table dumps)

#### 3. Fundamental Patterns
- [ ] Every replicated table has a deletion marker (`_deleted` or `deleted_at`)
- [ ] Queries filter out deleted records (both RxDB selectors and server SQL)
- [ ] No physical DELETEs on replicated tables
- [ ] Tombstone cleanup mechanism exists
- [ ] Every replicated table has `updated_at` (auto-updating, indexed)
- [ ] Pull queries use checkpoint pagination with correct sort order
- [ ] Timestamp precision preserved (PostgreSQL microsecond vs JS millisecond)
- [ ] Conflict strategy is deterministic (if bidirectional)
- [ ] Conflicts resolve in a single round-trip (if bidirectional)

#### 4. Sync Strategy
- [ ] `live: true` never used with serverless databases
- [ ] Writes are batched (not per-keystroke)
- [ ] Pulls are event-driven (not interval-polled)
- [ ] Cross-device notifications use SSE or equivalent (not DB polling)
- [ ] Database connections close immediately after operations

#### 5. Schema Design
- [ ] Every collection has `id` + `updated_at` + deletion marker
- [ ] Primary keys are strings (Drizzle serial IDs coerced)
- [ ] Decimal/monetary fields use correct types (strings for Drizzle decimal)
- [ ] Sync payloads are lean (no binary data, large blobs separated)
- [ ] Indexes only on non-nullable `required` fields (RxDB 16 + Dexie constraint: SC36/DXE1 — nullable fields like `deleted_at` CANNOT be indexed; string indexes need `maxLength`; number indexes need `minimum`/`maximum`/`multipleOf`)

#### 6. Initial Sync
- [ ] Bootstrap is paginated (not single mega-query)
- [ ] Critical collections sync first
- [ ] Skeleton/loading states exist during sync

#### 7. Client Storage
- [ ] `navigator.storage.persist()` called (especially critical when IndexedDB is canonical store)
- [ ] Collection-level data expiry exists for historical data
- [ ] Storage usage monitored with user-facing warnings

#### 8. Security
- [ ] Sync endpoints authenticated
- [ ] Authorization enforced (scope-limited pulls per role/org)
- [ ] Server validates all pushed data
- [ ] Sensitive PII not replicated in plaintext

#### 9. Error Handling
- [ ] Quota exceeded handled gracefully
- [ ] Network failures don't lose data (writes persist locally)
- [ ] Schema migration supported (version bumps with strategies)
- [ ] Sync failures have backoff (not tight retry loops)
- [ ] Circuit breaker prevents hammering a known-down backend

#### 10. Offline Write Buffering
- [ ] Writes go to local RxDB first, not directly to server (for full-mode clients)
- [ ] Per-document write queue exists to prevent lost updates from concurrent modifications
- [ ] Resync is debounced after writes (not fired per-keystroke, coalesces rapid mutations)
- [ ] Thin client variant exists for devices that don't need offline writes (direct server writes + pull)
- [ ] Write proxy abstracts mode selection (full RxDB vs thin client) transparently
- [ ] Offline writes are preserved and pushed when connectivity returns (no silent data loss)

#### 11. Conflict Resolution (Beyond LWW)
- [ ] Server-side push guards enforce state machine validation (only valid status transitions accepted)
- [ ] Duplicate detection prevents invalid duplicate records (e.g., two active sessions for same entity)
- [ ] Auto-merge or auto-heal logic exists for conflicts that can be resolved programmatically
- [ ] Conflicts returned to client are NOT retried — client re-pulls server state instead
- [ ] Audit trail logs all rejected pushes (guard type, entity ID, description)
- [ ] Side-effect triggers exist on push (e.g., auto-close children when parent closes)

#### 12. Storage Persistence & Recovery
- [ ] Auto-recovery on IndexedDB corruption (recognizes error codes like COL12, DM4, DB9, SC1, SC34, UT8)
- [ ] Migration timeout guard exists (e.g., 45s for full clients, 5s for thin clients)
- [ ] Recovery is limited to one attempt per session (prevents reload loops)
- [ ] Multi-tab reset coordination via BroadcastChannel (one tab resets → all tabs reload)
- [ ] URL escape hatch exists for manual recovery (e.g., `?reset-db=1`)
- [ ] Storage tier selection matches device type (Dexie for full, Memory for thin clients)
- [ ] Sync checkpoints are cleared on database reset (prevents stale checkpoint after recovery)

#### 13. Schema Migrations
- [ ] Schema versions are > 0 for collections that have evolved (not stuck at v0 indefinitely)
- [ ] `migrationStrategies` defined for every version bump with pure transform functions
- [ ] Migrations backfill with sensible defaults (using `??` fallback, not hard-coded values)
- [ ] Migrations are sequential and never modified after release (add new version, don't edit old)
- [ ] PK changes are handled correctly (re-derive composite IDs, accept delete+re-insert cost)
- [ ] Thin clients can skip non-critical migrations (selective sync for priority collections)

### Phase 3: Deep Dive (Beyond the Checklist)

The checklist catches structural issues. This phase catches the subtle bugs and cost leaks that only emerge from tracing actual code paths. These are the findings that make an audit genuinely valuable.

**A. Count server queries per user action.** Trace the actual Neon/server round-trips for each common operation. Build this table:

| Action | Server Queries | Optimal | Waste |
|--------|---------------|---------|-------|
| App startup | ? | 1 (batched) | ? |
| Create record | ? | 0-1 | ? |
| Delete record | ? | 0-1 | ? |
| [app-specific actions] | ? | ? | ? |

Look for: double resyncs (optimistic module resyncs + page resyncs for the same mutation), resyncing unrelated collections after an action, health check preflight adding an extra query.

**B. Trace delete paths end-to-end.** For each collection that supports deletion:
1. What does the server action do? (`db.delete()` = physical DELETE = zombie data)
2. What does the optimistic delete do? (`doc.remove()` in RxDB creates a tombstone that pull-only replication may not be able to undo)
3. Does the RxDB schema have a deletion field?
4. Does the pull endpoint include deleted records in its response?

This is the #1 source of data integrity bugs in RxDB systems.

**C. Check reactive store subscription lifecycle.** For each `createRxStore` or RxDB `.$.subscribe()`:
- Is the subscription cleaned up on component destroy / navigation?
- Orphaned subscriptions leak memory and fire stale updates.

**D. Verify type consistency between server and client.** Compare:
- Drizzle schema types → transform functions → RxDB schema types
- Primary keys should be strings everywhere. Foreign keys referencing string PKs should also be strings, not numbers.
- Decimal columns return strings from Drizzle — RxDB schema should match.

**E. Identify O(n) scans in hot paths.** In push guards, pull handlers, and write proxies:
- Are documents scanned linearly (`.find()` on arrays) where a Map/index lookup would be O(1)?
- Does this scale with data volume?

**F. Check for resync deduplication.** Can the same collection be resynced concurrently by two code paths? If so, is there an in-flight guard to prevent duplicate server queries?

**G. Trace the offline write lifecycle.** For apps with push replication:
1. Does a write persist in local RxDB before any network call?
2. If the push fails, is the local write preserved?
3. On reconnect, does the push retry automatically?
4. Is there a per-document queue preventing concurrent modifications from causing lost updates?
5. Are rapid writes debounced before triggering resync (e.g., 50ms coalesce)?

**H. Audit push guard coverage.** For apps with bidirectional sync:
1. Map every push guard: what invalid state does it prevent?
2. Are there business-logic invariants NOT covered by guards? (e.g., can two devices create conflicting records that both pass guards?)
3. Do guards log to an audit trail for debugging?
4. Are guard rejections returned as conflicts (client re-pulls) or as errors (client retries)?

**I. Test storage recovery paths.** For each recovery mechanism:
1. What RxDB error codes trigger auto-recovery?
2. Is recovery limited to one attempt per session (prevents reload loops)?
3. Does multi-tab reset work (BroadcastChannel coordination)?
4. Is the `?reset-db=1` escape hatch available for field debugging?
5. Are sync checkpoints cleared on recovery (prevents stale state)?

**J. Validate migration chain integrity.** For each collection with version > 0:
1. Feed a v0 document through all migration steps — does the output match the current schema?
2. Are migrations pure functions (no side effects, no async)?
3. Do migrations handle missing fields gracefully (using `??` fallback)?
4. If PK changed, is the composite ID derivation deterministic?

**K. Assess connectivity detection.** For the connection monitoring layer:
1. Is `navigator.onLine` the sole check, or are probes used?
2. Do probes have circuit breakers (prevent storms on flaky networks)?
3. Are connectivity tiers exposed to UI (offline/lan/full)?
4. Does visibility change trigger immediate resync?

**L. Evaluate resilience patterns.** For the overall system:
1. Circuit breaker: does it exist? What's the threshold/reset time?
2. Backoff: exponential with jitter, or fixed intervals?
3. Reconciliation: periodic sweep for data inconsistencies?
4. Diagnostics: automated health checks on startup?
5. Generation-based resync: does server restart force clean checkpoint?

### Phase 4: Generate the Report

Save as `RXDB_AUDIT_REPORT.md` in the target app's directory.

```markdown
# RxDB Audit Report

**App:** [name]
**Date:** [ISO date]
**Auditor:** Claude (rxdb-audit skill)

## Summary

| Category | Pass | Warn | Fail | N/A |
|----------|------|------|------|-----|
| 1. Authority Topology | | | | |
| 2. Adoption Justification | | | | |
| 3. Fundamental Patterns | | | | |
| 4. Sync Strategy | | | | |
| 5. Schema Design | | | | |
| 6. Initial Sync | | | | |
| 7. Storage Management | | | | |
| 8. Security | | | | |
| 9. Error Handling | | | | |
| 10. Offline Write Buffering | | | | |
| 11. Conflict Resolution | | | | |
| 12. Storage Persistence & Recovery | | | | |
| 13. Schema Migrations | | | | |
| **Total** | | | | |

**Overall Score:** [X / Y applicable] ([%])

## Server Query Cost Map

| Action | Current Queries | Optimal | Waste |
|--------|----------------|---------|-------|
| App startup | | | |
| [per-action rows] | | | |

## Critical Findings (FAIL)

### [Item name]
- **Category:** [1-13]
- **File:** `path/to/file.ts:line`
- **Issue:** What's wrong
- **Impact:** Server cost / data integrity / UX consequence
- **Fix:** Specific remediation with code if helpful
- **Reference:** See `references/offline-first-patterns.md` § [section] for production pattern

## Deep Dive Findings

### [Finding name]
- **Phase:** [A-L]
- **File:** `path/to/file.ts:line`
- **Issue:** What the checklist didn't catch
- **Impact:** Why it matters
- **Fix:** How to resolve

## Warnings (WARN)

[Same structure as FAIL]

## Passing Items

[Acknowledge what's working well]

## Server Cost Assessment

- **Current efficiency:** [low / moderate / high / optimal]
- **Biggest cost driver:** [specific mechanism]
- **Estimated savings from fixes:** [qualitative]

## Offline Resilience Assessment

- **Write safety:** [none / partial / full] — Can writes survive network loss?
- **Conflict handling:** [LWW-only / guarded / comprehensive] — Are business logic invariants enforced?
- **Storage recovery:** [none / manual / auto] — Can the app recover from IndexedDB corruption?
- **Migration readiness:** [frozen / partial / production-grade] — Can schemas evolve without data loss?
- **Connectivity awareness:** [naive / probe-based / tiered] — Does the app know its actual connectivity state?

## Recommendations (Priority Order)

1. [Highest impact first]
```

## Judgment Principles

- A technically correct implementation that calls the server 10x more than necessary is a WARN, not a PASS.
- A slightly unconventional approach that demonstrably minimizes server interaction is a PASS even if it deviates from textbook patterns.
- For LAN-only architectures, reframe "server cost" as "reliability and data integrity" — the economic lens doesn't apply when the server is localhost.
- For the four pillar categories (10-13), score against the patterns documented in `references/offline-first-patterns.md`. A missing pillar is a FAIL if the app claims offline-first capability. It's a WARN if the app is online-first but uses RxDB.
- For decision matrices and detailed reasoning behind each pattern, consult `references/best-practices.md`.
- For production code patterns and implementation examples, consult `references/offline-first-patterns.md`.
