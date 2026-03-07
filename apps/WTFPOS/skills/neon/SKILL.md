---
name: neon
description: >
  Neon PostgreSQL integration for WTFPOS. Use this skill when the user wants to add cloud database
  connectivity, set up cross-branch analytics reports, create Postgres schemas mirroring RxDB
  collections, implement RxDB-to-Neon replication (cloud sync), write SQL queries for the owner
  dashboard, set up Drizzle ORM, use @neondatabase/serverless, or design the data archival strategy
  for orders older than 90 days. Also use when the user mentions "cloud database", "PostgreSQL",
  "Neon", "Drizzle", "SQL query", "analytics", "branch comparison reports", or "cloud backup".
  IMPORTANT: Neon is the analytical layer — it does NOT replace RxDB for operational data.
  Current phase: PREPARATION ONLY. Neon is not yet connected.
version: 1.0.0
---

# Neon — WTFPOS Cloud Analytics & Replication Target

Neon is a serverless PostgreSQL platform. In WTFPOS it serves two roles:
1. **Analytical truth** — complex SQL queries for reports the owner needs across branches
2. **Cloud backup** — replication target for RxDB data (via Phase 2 cloud sync)

**Current status: PREPARATION MODE.** Neon is not yet connected. This skill documents the planned
integration so that when Phase 3 begins, the schema design and connection patterns are ready.

## References
- `references/NEON_GUIDE.md` — Connection setup, schema rules, Drizzle patterns
- `references/NEON_RXDB_BRIDGE.md` — How RxDB replication talks to Neon, field mapping

---

## Role in the Architecture

```
RxDB (operational)  →  Neon (analytical + backup)
     local/fast             cloud/queryable

RxDB: today's orders, live tables, current stock
Neon: weekly sales trends, branch comparison, archived orders (>90 days)
```

**Never use Neon for:** Reading current order status, table state, or live KDS data.
These are operational queries → use RxDB.

---

## Context7 — Fetch Fresh Docs Before Implementing

```
// Always resolve the library ID first
mcp__context7__resolve-library-id({ libraryName: "@neondatabase/serverless" })
mcp__context7__resolve-library-id({ libraryName: "drizzle-orm" })

// Then fetch relevant documentation
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "<resolved id>",
  topic: "connection pooling transactions",
  tokens: 5000
})
```

If Context7 doesn't have the library, use WebSearch for the Neon or Drizzle docs.

---

## Packages

```bash
# Install when Phase 3 begins
pnpm add @neondatabase/serverless drizzle-orm
pnpm add -D drizzle-kit
```

**Why `@neondatabase/serverless` over `pg`?**
SvelteKit server routes may run in edge/serverless environments where TCP connections
(standard `pg`) don't work. `@neondatabase/serverless` uses HTTP or WebSocket transport.

---

## Postgres Schema Rules for WTFPOS

Every Neon table must mirror its RxDB counterpart with these rules:

| Rule | Why |
|---|---|
| Column names: `snake_case` | Postgres convention; map from RxDB `camelCase` in Drizzle |
| Every table has `updated_at TIMESTAMPTZ` | Replication checkpoint basis |
| Every table has `deleted BOOLEAN DEFAULT false` | RxDB soft-delete propagation |
| Every table has `location_id TEXT` | Branch isolation at the DB level |
| Array fields → `JSONB` | RxDB `items[]`, `payments[]` stored as JSON |
| No foreign key constraints between operational tables | RxDB doesn't enforce FK; neither should Neon |

---

## When to Query RxDB vs Neon

| Report / Feature | Source | Reason |
|---|---|---|
| Current open orders | RxDB | Real-time, needs latest state |
| Today's sales total | RxDB | Available locally |
| Yesterday's sales by branch | Neon | Cross-branch needs cloud |
| Weekly revenue trend | Neon | Complex SQL aggregation |
| Branch comparison (Tagbilaran vs Panglao) | Neon | Requires both branches' data |
| Meat variance (current vs counted) | RxDB | Operational, needs live stock |
| Historical meat variance (monthly) | Neon | Archived data |
| Top-selling items this week | Neon | Requires deductions join |
| X-Reading / Z-Reading | RxDB | Operational, local |

---

## Drizzle Schema Pattern

```ts
// src/lib/db/neon-schema.ts (create when Phase 3 begins)
import { pgTable, text, integer, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id:               text('id').primaryKey(),
  locationId:       text('location_id').notNull(),
  orderType:        text('order_type').notNull(),
  customerName:     text('customer_name'),
  tableId:          text('table_id'),
  tableNumber:      integer('table_number'),
  packageName:      text('package_name'),
  pax:              integer('pax').notNull(),
  items:            jsonb('items').notNull().default([]),
  payments:         jsonb('payments').notNull().default([]),
  status:           text('status').notNull(),
  subtotal:         numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount:   numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  vatAmount:        numeric('vat_amount', { precision: 10, scale: 2 }).notNull(),
  total:            numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull(),
  closedAt:         timestamp('closed_at', { withTimezone: true }),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull(),
  deleted:          boolean('deleted').notNull().default(false),
}, (table) => ({
  locationStatusIdx: index('orders_location_status_idx').on(table.locationId, table.status),
  updatedAtIdx:      index('orders_updated_at_idx').on(table.updatedAt),
  locationCreatedIdx: index('orders_location_created_idx').on(table.locationId, table.createdAt),
}));
```

---

## Connection Pattern (SvelteKit Server Routes)

```ts
// src/lib/server/neon.ts (create when Phase 3 begins)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DATABASE_URL } from '$env/static/private';
import * as schema from '$lib/db/neon-schema';

// Create once, reuse across requests (Neon handles connection pooling)
export function getNeonDb() {
  const sql = neon(DATABASE_URL);
  return drizzle(sql, { schema });
}
```

```ts
// In a SvelteKit server route:
import { getNeonDb } from '$lib/server/neon';
import { orders } from '$lib/db/neon-schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET({ url }) {
  const db = getNeonDb();
  const locationId = url.searchParams.get('location') ?? 'tag';
  const since = url.searchParams.get('since') ?? new Date(Date.now() - 7 * 86400000).toISOString();

  const results = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.locationId, locationId),
        gte(orders.createdAt, new Date(since)),
        eq(orders.deleted, false)
      )
    )
    .orderBy(orders.createdAt);

  return json(results);
}
```

---

## Environment Variables

```bash
# .env (add when Phase 3 begins)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Use `$env/static/private` (build-time) for the connection string — it's a secret.

---

## Human in the Loop — Critical Gates

**STOP and ask the user before any of these actions.** Neon is a cloud database with real billing,
real data, and no local undo. Mistakes here affect all branches simultaneously.

### 1. Provisioning or connecting to Neon for the first time

**Trigger:** First time setting `DATABASE_URL`, running `drizzle-kit push`, or creating tables.

**Ask:**
- "Is this the production Neon project or a dev/staging branch?"
- "Have you shared the `DATABASE_URL` via `.env` — or should I generate placeholder code only?"
- "Which Neon branch are we targeting: `main` (production) or a dev branch?"

**Why:** Running migrations against the production `main` branch is irreversible.
Neon branching exists specifically so you target a dev branch first.

---

### 2. Running a destructive SQL operation (DROP, DELETE, TRUNCATE, ALTER)

**Trigger:** Any generated SQL that includes `DROP TABLE`, `DELETE FROM`, `TRUNCATE`, or
`ALTER TABLE ... DROP COLUMN`.

**Ask:**
- "This SQL is destructive and cannot be undone. Should I generate the query for review first before running it?"
- "Is the affected data archived or backed up elsewhere?"
- "Is replication from RxDB currently active? If so, deleted rows may be re-inserted by the next sync."

**Why:** RxDB replication uses soft deletes (`deleted = true`). Hard-deleting from Neon while
replication is active will re-insert the rows on the next sync cycle.

---

### 3. Schema migration on existing Neon data

**Trigger:** `drizzle-kit generate` followed by `drizzle-kit push`, or manual `ALTER TABLE`.

**Ask:**
- "Are any branch devices actively syncing to this database right now?"
- "Does this migration add a NOT NULL column without a DEFAULT? If so, existing rows will fail."
- "Should we pause replication on branch devices before running this migration?"

**Why:** Adding a NOT NULL column with no DEFAULT to a live table fails on every existing row.
Always add with a DEFAULT first, backfill, then tighten the constraint.

---

### 4. Changing the replication scope (which collections sync to Neon)

**Trigger:** Adding or removing a collection from `CLOUD_SYNC_COLLECTIONS` in `cloud-sync.ts`.

**Ask:**
- "Adding a collection: has this collection's Neon table been created and migrated first?"
- "Removing a collection: is there any code that still queries Neon for this collection's data?"
- "Is the `updatedAt` field present and indexed on this collection in both RxDB and Neon?"

**Why:** Adding a collection that has no Neon table crashes cloud sync for all collections.
The replication loop is shared — one failure stops everything.

---

## Self-Improvement Protocol

When any of the following occur:
- Neon API or SDK changes (check with Context7)
- Schema design decisions are revised after first implementation
- Drizzle ORM version changes affect the patterns here
- The user corrects a Neon-specific assumption

**Action:** Update this SKILL.md and the relevant references file before continuing.
Re-fetch docs with Context7: `mcp__context7__resolve-library-id({ libraryName: "@neondatabase/serverless" })`

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — preparation mode, not yet connected |
