---
name: neon
description: >
  Neon PostgreSQL integration for WTFPOS. Use when the user wants to add cloud database
  connectivity, set up cross-branch analytics reports, create Postgres schemas mirroring RxDB
  collections, implement RxDB-to-Neon replication, write SQL queries for the owner dashboard,
  set up Drizzle ORM, or design data archival for old orders. Also triggers on "cloud database",
  "PostgreSQL", "Neon", "Drizzle", "SQL query", "analytics", "branch comparison reports", or
  "cloud backup". IMPORTANT: Neon is the analytical layer — it does NOT replace RxDB.
  Current phase: PREPARATION ONLY.
---

# Neon — WTFPOS Cloud Analytics

Neon is a serverless PostgreSQL platform serving as the analytical truth and cloud backup target.

**Status: PREPARATION MODE.** Neon is not yet connected.

## Full Reference

- **Full skill:** `skills/neon/SKILL.md`
- **Connection & Drizzle:** `skills/neon/references/NEON_GUIDE.md`
- **RxDB bridge:** `skills/neon/references/NEON_RXDB_BRIDGE.md`

## Role in Architecture

```
RxDB (operational)  ->  Neon (analytical + backup)
     local/fast             cloud/queryable

RxDB: today's orders, live tables, current stock
Neon: weekly sales trends, branch comparison, archived orders (>90 days)
```

**Never use Neon for:** Reading current order status, table state, or live KDS data.

## Human in the Loop Gate

- **Phase activation** — Neon implementation requires explicit Phase 3 trigger from user
