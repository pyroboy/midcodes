# Neon PostgreSQL Guide — WTFPOS

**Status: PREPARATION. Not yet connected.**
**Neon version target: latest serverless driver**
**ORM: Drizzle ORM**

---

## Why Neon for WTFPOS

| Need | Neon solution |
|---|---|
| Cross-branch analytics (Tagbilaran + Panglao in one query) | Both branches replicate to same Neon project |
| Owner reports without VPN to restaurant LAN | Neon is cloud-hosted, accessible anywhere |
| Complex SQL (JOINs, window functions, aggregations) | Full PostgreSQL — not possible in RxDB |
| Data archival (orders > 90 days) | Neon persists long-term; RxDB purges |
| Audit trail for BIR compliance | Immutable rows in Neon (never hard-delete) |

---

## Neon Project Structure

```
Neon Project: wtfpos-prod
├── Main branch: main (production data)
│   └── Database: wtfpos
│       ├── Schema: public
│       │   ├── orders
│       │   ├── order_deductions
│       │   ├── stock_items
│       │   ├── deliveries
│       │   ├── waste
│       │   ├── expenses
│       │   ├── adjustments
│       │   ├── stock_counts
│       │   ├── kds_history
│       │   ├── x_reads
│       │   └── audit_logs
│       └── Schema: archive (old data)
│           ├── orders_archive
│           └── deductions_archive
├── Dev branch: dev (mirrors main, for development)
└── Staging branch: staging
```

**Use Neon branching** for dev/staging — it creates copy-on-write snapshots instantly with no data duplication cost.

---

## Table Design Rules

### 1. Every table has these four columns

```sql
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- replication checkpoint
deleted     BOOLEAN NOT NULL DEFAULT false       -- soft delete mirror of RxDB _deleted
location_id TEXT NOT NULL                        -- branch isolation
id          TEXT PRIMARY KEY                     -- matches RxDB nanoid() primary key
```

### 2. JSONB for nested arrays

RxDB stores `items`, `payments`, `subBills` as nested arrays. Neon stores them as JSONB.
Query individual items using PostgreSQL JSONB operators when needed for analytics.

```sql
-- Count items per order
SELECT id, jsonb_array_length(items) as item_count FROM orders;

-- Find orders with a specific menu item
SELECT * FROM orders WHERE items @> '[{"menuItemId": "xxx"}]';
```

### 3. camelCase ↔ snake_case mapping

Drizzle handles this automatically when you define column names. Always define columns in `snake_case` in Drizzle schema and access them in `camelCase` in TypeScript.

### 4. Indexes for replication and reports

Every table needs:
```sql
-- Required for RxDB replication pull queries
CREATE INDEX ON {table} (updated_at);
CREATE INDEX ON {table} (updated_at, id);

-- Required for branch-scoped reports
CREATE INDEX ON {table} (location_id, created_at);
CREATE INDEX ON {table} (location_id, status);  -- for operational tables
```

---

## Full Schema Reference

```sql
-- Core analytical tables (all branches, all time)

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    order_type TEXT NOT NULL,          -- 'dine-in' | 'takeout'
    customer_name TEXT DEFAULT '',
    table_id TEXT,
    table_number INTEGER,
    package_name TEXT,
    package_id TEXT,
    pax INTEGER NOT NULL DEFAULT 1,
    items JSONB NOT NULL DEFAULT '[]',
    payments JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL,              -- 'open' | 'pending_payment' | 'paid' | 'cancelled'
    discount_type TEXT DEFAULT 'none',
    discount_pax INTEGER DEFAULT 0,
    discount_ids JSONB DEFAULT '[]',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    bill_printed BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    cancel_reason TEXT DEFAULT '',
    closed_by TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    paid_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE stock_items (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
    par_level NUMERIC(10,3),
    updated_at TIMESTAMPTZ NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false
);

-- Indexes (create after tables)
CREATE INDEX orders_location_status ON orders (location_id, status);
CREATE INDEX orders_location_created ON orders (location_id, created_at);
CREATE INDEX orders_updated_at ON orders (updated_at, id);
CREATE INDEX expenses_location_created ON expenses (location_id, created_at);
CREATE INDEX expenses_updated_at ON expenses (updated_at, id);
```

---

## Row-Level Security (Branch Isolation)

For Phase 3+, add RLS to prevent cross-branch data leakage from direct DB access:

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Tagbilaran branch can only see Tagbilaran data
CREATE POLICY orders_branch_isolation ON orders
    FOR ALL
    USING (location_id = current_setting('app.location_id', true));
```

Set the session variable in the connection:
```ts
const sql = neon(DATABASE_URL);
await sql`SET app.location_id = ${locationId}`;
```

For owner-level access (all branches), skip the RLS policy (use a separate role or `current_setting` that matches a bypass condition).

---

## Analytics Query Patterns

### Daily sales summary by branch
```sql
SELECT
    location_id,
    DATE(created_at AT TIME ZONE 'Asia/Manila') as day,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
    SUM(total) FILTER (WHERE status = 'paid') as revenue,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancellations
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY location_id, day
ORDER BY location_id, day;
```

### Top-selling items this week
```sql
WITH item_counts AS (
    SELECT
        o.location_id,
        item->>'menuItemName' as item_name,
        SUM((item->>'quantity')::int) as total_sold
    FROM orders o,
    LATERAL jsonb_array_elements(o.items) as item
    WHERE o.status = 'paid'
    AND o.created_at >= NOW() - INTERVAL '7 days'
    AND (item->>'status') != 'cancelled'
    GROUP BY o.location_id, item_name
)
SELECT * FROM item_counts ORDER BY location_id, total_sold DESC LIMIT 20;
```

### Branch comparison (gross revenue)
```sql
SELECT
    location_id,
    SUM(total) as gross_revenue,
    COUNT(*) as total_orders,
    AVG(pax) as avg_pax,
    AVG(total) as avg_check
FROM orders
WHERE status = 'paid'
AND DATE(created_at AT TIME ZONE 'Asia/Manila') = CURRENT_DATE - 1
GROUP BY location_id;
```

---

## Data Archival Strategy

Orders and deductions accumulate fast. Archival after 90 days keeps RxDB lean.

```sql
-- Move paid orders older than 90 days to archive schema
INSERT INTO archive.orders_archive
SELECT * FROM orders
WHERE status IN ('paid', 'cancelled')
AND closed_at < NOW() - INTERVAL '90 days';

-- Delete the original (hard delete ok in Neon — it's the archive, not RxDB)
DELETE FROM orders
WHERE id IN (SELECT id FROM archive.orders_archive WHERE closed_at < NOW() - INTERVAL '90 days');
```

Run this as a Neon scheduled job or a nightly SvelteKit cron.

---

## Environment Setup

```bash
# .env.local (development)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Neon branching for dev:
# Create a dev branch in Neon console → copy its connection string
DATABASE_URL=postgresql://user:pass@ep-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Drizzle Config

```ts
// drizzle.config.ts (create at project root when Phase 3 begins)
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/neon-schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config;
```

```bash
# Generate migrations
pnpm drizzle-kit generate:pg

# Apply to Neon
pnpm drizzle-kit push:pg
```

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — preparation mode |
