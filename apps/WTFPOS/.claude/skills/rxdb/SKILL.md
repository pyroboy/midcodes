---
name: rxdb
description: >
  Manages RxDB collections, schemas, stores, and data operations in the WTFPOS SvelteKit project.
  Use when the user wants to add a new RxDB collection, modify an existing schema, add fields to
  a collection, create a reactive Svelte store backed by RxDB, write store helper functions
  (insert/update/delete), debug RxDB errors (SC34, SC36, SC38, DXE1, COL12, VD2), bump schema
  versions, write migration strategies, or do anything involving the local-first IndexedDB
  persistence layer. Also triggers on "database", "collection", "schema", "migration", "seed",
  "persistence", "IndexedDB", "offline-first", or "sync". Even simple requests like "add a field
  to orders" or "create a new table for tips" trigger this skill.
---

# RxDB Management — WTFPOS

Local-first persistence layer using RxDB v16 + IndexedDB (Dexie). Every data mutation flows
through RxDB, and Svelte 5 stores reactively subscribe via `createRxStore()`.

## Full Reference

Read the detailed skill and guides before any RxDB work:

- **Full skill:** `skills/rxdb/SKILL.md`
- **15 core rules:** `skills/rxdb/references/RXDB_GUIDE.md`
- **Error codes:** `skills/rxdb/references/RXDB_SCHEMA_VALIDATION_GUIDE.md`
- **Replication:** `skills/rxdb/references/RXDB_REPLICATION_GUIDE.md`

## Key Files

| File | Purpose |
|---|---|
| `src/lib/db/schemas.ts` | All `RxJsonSchema` definitions |
| `src/lib/db/index.ts` | DB singleton, collection registration, migrations |
| `src/lib/db/seed.ts` | Seeds empty DB with mock data |
| `src/lib/stores/sync.svelte.ts` | `createRxStore()` reactive bridge |

## Non-Negotiable Rules

- **NEVER** use `.patch()` or `.modify()` — always `incrementalPatch` / `incrementalModify`
- **Every write** must include `updatedAt: new Date().toISOString()`
- **Guard** all `getDb()` calls with `if (!browser) return`
- **Read from `doc`** inside `incrementalModify`, never from Svelte store state
- **Use `nanoid()`** for primary keys
- **Every record** must include `locationId`

## Human in the Loop Gates

1. **Schema version bump + migration** — ask what's changing and whether real data exists
2. **Emergency database reset** — confirm before `resetDatabase()` or `indexedDB.deleteDatabase`
