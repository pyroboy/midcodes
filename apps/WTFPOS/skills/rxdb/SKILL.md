---
name: rxdb
description: >
  Manages RxDB collections, schemas, stores, and data operations in the WTFPOS SvelteKit project.
  This skill should be used whenever the user wants to add a new RxDB collection, modify an existing
  schema, add fields to a collection, create a reactive Svelte store backed by RxDB, write store
  helper functions (insert/update/delete), debug RxDB errors (SC34, SC36, SC38, DXE1, COL12, VD2),
  bump schema versions, write migration strategies, or do anything involving the local-first
  IndexedDB persistence layer. Also use this skill when the user mentions "database", "collection",
  "schema", "migration", "seed", "persistence", "IndexedDB", "offline-first", or "sync" in the
  context of the WTFPOS codebase. Even simple requests like "add a field to orders" or "create a
  new table for tips" should trigger this skill because they require coordinated changes across
  multiple files with strict RxDB rules.
version: 1.0.0
---

# RxDB Management — WTFPOS

This skill guides all RxDB operations in the WTFPOS project. RxDB is the local-first persistence
layer using IndexedDB (via Dexie) in the browser. Every data mutation flows through RxDB, and
Svelte 5 stores reactively subscribe to RxDB query observables.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/db/schemas.ts` | All `RxJsonSchema` definitions |
| `src/lib/db/index.ts` | DB singleton (`getDb()`), collection registration, migration strategies |
| `src/lib/db/seed.ts` | Seeds empty DB with mock data on first load |
| `src/lib/db/seed-history.ts` | Generates 7 days of historical data |
| `src/lib/stores/sync.svelte.ts` | `createRxStore()` — reactive read bridge from RxDB to Svelte 5 |
| `src/lib/stores/pos.svelte.ts` | POS store (tables, orders, menu) — RxDB-backed |
| `src/lib/stores/stock.svelte.ts` | Stock store (inventory, deliveries, waste) — RxDB-backed |
| `src/lib/stores/expenses.svelte.ts` | Expenses store — RxDB-backed |
| `src/lib/stores/audit.svelte.ts` | Audit log store |
| `src/lib/stores/session.svelte.ts` | Session — in-memory only, never migrate to RxDB |

For deep reference on specific topics, read from the `references/` folder alongside this SKILL.md:
- `references/RXDB_GUIDE.md` — Complete integration rules (15 rules covering all patterns)
- `references/RXDB_SCHEMA_VALIDATION_GUIDE.md` — Every SC/DXE/VD error code explained
- `references/RXDB_REPLICATION_GUIDE.md` — Multi-device sync and `updatedAt` requirements

## Architecture

```
Component → reactive getters → createRxStore() → RxDB Observable → IndexedDB (Dexie)
                                    | writes
                          db.collection.insert / incrementalPatch / incrementalModify
```

- **Reads**: `createRxStore()` subscribes to `query.$` and maps docs to plain JSON via `.toJSON()`
- **Writes**: Direct RxDB document operations — insert, incrementalPatch, incrementalModify, remove
- **Reactivity**: RxDB observables fire automatically on any write — no manual state updates needed

---

## Human in the Loop — Critical Gates

**STOP and ask the user before performing any of these actions.** Do not proceed until you have
a clear answer. These gates exist because the consequences are hard or impossible to reverse.

### 1. Schema version bump + migration

**Trigger:** Any change to `version` in a schema, or adding a migration strategy.

**Ask:**
- "What exactly is changing in this schema — new field, renamed field, or index change?"
- "Is there existing data on real devices that this migration will run against, or only dev seed data?"
- "Should I write the migration to be a no-op (identity) or actively transform existing documents?"

**Why:** A wrong migration silently corrupts existing documents. There is no undo.

---

### 2. Emergency database reset (`resetDatabase()` or `indexedDB.deleteDatabase`)

**Trigger:** Any code path that calls `resetDatabase()` or `indexedDB.deleteDatabase('wtfpos_db')`.

**Ask:**
- "Is this intentional? This destroys ALL local RxDB data on this device permanently."
- "Has this device synced recently? Any unsynced changes will be lost forever."
- "Is this a dev reset or a production device?"

**Why:** Unrecoverable data loss. No soft delete, no undo, no backup.

---

### 3. Removing a field from `required[]` or changing a primary key

**Trigger:** Deleting a field from the `required` array, or any discussion of changing `primaryKey`.

**Ask:**
- "Is relaxing this field's requirement intentional, or is this a workaround for a validation error?"
- "(Primary key change only) Changing the primary key requires dropping and recreating the collection, which deletes all existing documents in it. Is that acceptable?"

**Why:** `required` relaxation can allow corrupt documents through silently. Primary key changes are destructive.

---

### 4. Adding or removing an index

**Trigger:** Adding a field to `indexes[]` or removing one.

**Ask:**
- "Does this indexed field have `maxLength` (strings) or `minimum`/`maximum`/`multipleOf` (numbers)? If not, this will throw SC34/SC35 at boot."
- "Is this field in `required[]`? Indexed fields not in `required` throw DXE1."

**Why:** Index rule violations crash the app silently at boot with no clear error until you know the codes.

---

## Critical Rules

These are non-negotiable. Violating them causes data loss, 409 conflicts, or boot crashes.

### 1. Never use `.patch()` or `.modify()` — always use incremental variants

`.patch()` and `.modify()` throw 409 CONFLICT if any concurrent write happened. The incremental
variants retry automatically on conflict.

```ts
// CORRECT
await doc.incrementalPatch({ status: 'paid', updatedAt: new Date().toISOString() });
await doc.incrementalModify((d) => { d.items = [...d.items, newItem]; d.updatedAt = new Date().toISOString(); return d; });

// WRONG — throws 409 on concurrent writes
await doc.patch({ status: 'paid' });
await doc.modify((d) => { d.items.push(newItem); return d; });
```

**When to use which:**
- `incrementalPatch` — setting independent scalar fields (status, total, name)
- `incrementalModify` — merging arrays, computing values from current doc state

### 2. Every write must set `updatedAt`

Without `updatedAt`, changes are invisible to replication. Every insert, patch, and modify must
include `updatedAt: new Date().toISOString()`.

### 3. Guard `getDb()` with browser check

RxDB uses IndexedDB which only exists in the browser. Every function calling `getDb()` must check
`browser` first, or be called only from event handlers.

```ts
import { browser } from '$app/environment';
if (!browser) return;
const db = await getDb();
```

### 4. Read from doc inside incrementalModify, not from Svelte store state

Svelte store state may lag behind by one or more writes. Inside `incrementalModify`, always read
from the `doc` parameter — it contains the latest revision from IndexedDB.

```ts
// CORRECT — doc.items is the latest revision
await orderDoc.incrementalModify((doc) => {
    doc.items = [...doc.items, newItem];
    return doc;
});

// WRONG — orders.value may be stale
const order = orders.value.find(o => o.id === orderId);
await orderDoc.incrementalPatch({ items: [...order.items, newItem] });
```

### 5. Use `nanoid()` for primary keys

Sequential IDs collide across devices during replication. Always use `nanoid()`.

---

## Workflow: Adding a New Collection

Follow these steps in order. All four files must be updated.

### Step 1: Define the schema in `schemas.ts`

```ts
export const tipSchema: RxJsonSchema<any> = {
    title: 'tip schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id:         { type: 'string', maxLength: 100 },
        orderId:    { type: 'string', maxLength: 100 },
        amount:     { type: 'number' },
        method:     { type: 'string' },
        createdAt:  { type: 'string', maxLength: 30 },
        updatedAt:  { type: 'string', maxLength: 30 }
    },
    required: ['id', 'orderId', 'amount', 'method', 'createdAt', 'updatedAt'],
    indexes: ['orderId', 'createdAt', 'updatedAt']
};
```

**Schema checklist (violations crash the app at boot):**

| Rule | Check |
|---|---|
| Primary key has `maxLength` | SC39 — crashes in production too |
| String fields in indexes have `maxLength` | SC34 |
| Number fields in indexes have `minimum`, `maximum`, `multipleOf` | SC35, SC37 |
| Boolean fields in indexes are in `required` | SC38 |
| All indexed fields are in `required` | DXE1 (Dexie constraint) |
| No nullable unions (`['string', 'null']`) in indexes | SC36 |
| No `_rev`, `_deleted`, `_meta`, `_attachments` in properties | SC10 (auto-added) |
| Primary key not listed in `indexes` | SC13 (auto-indexed) |
| No `default` in nested schemas | SC7 |
| `version` is a non-negative integer | SC11 |

### Step 2: Register the collection in `db/index.ts`

Import the schema and add it to `addCollections()`:

```ts
import { tipSchema } from './schemas';

// Inside addCollections():
tips: {
    schema: tipSchema
    // No migrationStrategies needed for version 0
}
```

### Step 3: Add seed data in `seed.ts` (if needed)

Add to the `seedDatabaseIfNeeded` function after the menu items check:

```ts
await db.tips.bulkInsert([
    { id: nanoid(), orderId: 'some-order-id', amount: 50, method: 'cash',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]);
```

### Step 4: Create the reactive store

In the relevant store file (or a new `.svelte.ts` file):

```ts
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

// Reactive read — automatically updates on any write
const _allTips = createRxStore<Tip>('tips', db => db.tips.find());

export const tips = {
    get value() { return _allTips.value; },
    get initialized() { return _allTips.initialized; }
};

// Write helpers
export async function addTip(orderId: string, amount: number, method: string) {
    if (!browser) return;
    const db = await getDb();
    const { nanoid } = await import('nanoid');
    await db.tips.insert({
        id: nanoid(),
        orderId,
        amount,
        method,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
}
```

---

## Workflow: Adding a Field to an Existing Schema

### Step 1: Add the property to the schema in `schemas.ts`

```ts
// Add to properties:
tipPercentage: { type: 'number' }

// If it should be required, add to required array
// If it should be indexed, add to indexes AND ensure it meets index rules
```

### Step 2: Bump the version number

```ts
version: 1,  // was 0
```

### Step 3: Add migration strategy in `db/index.ts`

```ts
tips: {
    schema: tipSchema,
    migrationStrategies: {
        1: (oldDoc: any) => {
            oldDoc.tipPercentage = oldDoc.tipPercentage ?? 0;
            oldDoc.updatedAt = oldDoc.updatedAt || new Date().toISOString();
            return oldDoc;
        }
    }
}
```

Migration strategies must cover every version step: version N requires strategies `{1: fn, 2: fn, ..., N: fn}`.

For changes that don't alter data shape (adding indexes, adding `maxLength`), use identity migrations:

```ts
1: (oldDoc: any) => oldDoc
```

---

## Workflow: Writing Store Helpers

### Insert (no conflict risk)

```ts
export async function createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!browser) return;
    const db = await getDb();
    const { nanoid } = await import('nanoid');
    const now = new Date().toISOString();
    await db.expenses.insert({ ...data, id: nanoid(), createdAt: now, updatedAt: now });
}
```

### Scalar update (incrementalPatch)

```ts
export async function updateTableStatus(id: string, status: string) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.tables.findOne(id).exec();
    if (doc) await doc.incrementalPatch({ status, updatedAt: new Date().toISOString() });
}
```

### Array merge (incrementalModify)

```ts
export async function addItemToOrder(orderId: string, newItem: OrderItem) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.orders.findOne(orderId).exec();
    if (doc) {
        await doc.incrementalModify((d: any) => {
            d.items = [...d.items, newItem];
            d.subtotal = d.items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
            d.updatedAt = new Date().toISOString();
            return d;
        });
    }
}
```

### Remove

```ts
export async function removeOrder(id: string) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.orders.findOne(id).exec();
    if (doc) await doc.remove();  // Soft-delete — RxDB sets _deleted: true internally
}
```

---

## Debugging Common Errors

When you encounter an RxDB error, read `RXDB_SCHEMA_VALIDATION_GUIDE.md` for the full list. Here
are the most frequent ones:

| Error | Cause | Fix |
|---|---|---|
| **SC34** | String field in index missing `maxLength` | Add `maxLength` to the property |
| **SC36** | Nullable union (`['string','null']`) in index | Remove from indexes or make non-nullable |
| **SC38** | Boolean field in index not in `required` | Add field to `required` array |
| **SC39** | Primary key missing `maxLength` | Add `maxLength: 100` to primary key — crashes in production |
| **DXE1** | Indexed field not in `required` | Add field to `required` array |
| **COL12** | Migration strategy count mismatch | Version N needs strategies 1..N |
| **VD2** | Document fails schema validation on write | Check required fields, types, no extra properties |
| **DB6** | Schema hash changed without version bump | Bump `version` in schema |
| **409 CONFLICT** | Used `.patch()`/`.modify()` instead of incremental | Switch to `incrementalPatch`/`incrementalModify` |

### Emergency database reset

If the database is corrupted beyond repair (common during development):

```ts
import { resetDatabase } from '$lib/db';
await resetDatabase();  // Drops IndexedDB and reloads
```

Or in browser console: `indexedDB.deleteDatabase('wtfpos_db'); location.reload();`

---

## Current Collections Reference

| Collection | Schema | Version | Primary Key | Key Indexes |
|---|---|---|---|---|
| `tables` | `tableSchema` | 2 | `id` | locationId, status, updatedAt |
| `orders` | `orderSchema` | 4 | `id` | locationId, status, createdAt, updatedAt |
| `menu_items` | `menuItemSchema` | 1 | `id` | updatedAt |
| `stock_items` | `stockItemSchema` | 3 | `id` | locationId, category, menuItemId, updatedAt |
| `deliveries` | `deliverySchema` | 3 | `id` | stockItemId, depleted, receivedAt, updatedAt |
| `waste` | `wasteSchema` | 3 | `id` | stockItemId, loggedAt, updatedAt |
| `deductions` | `deductionSchema` | 2 | `id` | stockItemId, orderId, updatedAt |
| `expenses` | `expenseSchema` | 3 | `id` | locationId, createdAt, updatedAt |
| `adjustments` | `adjustmentSchema` | 3 | `id` | stockItemId, loggedAt, updatedAt |
| `stock_counts` | `stockCountSchema` | 2 | `stockItemId` | updatedAt |
| `devices` | `deviceSchema` | 1 | `id` | updatedAt |
| `kds_tickets` | `kdsTicketSchema` | 3 | `id` | orderId, updatedAt |
| `kds_history` | `kdsHistorySchema` | 2 | `id` | updatedAt |
| `x_reads` | `xReadSchema` | 1 | `id` | updatedAt |
| `audit_logs` | `auditLogSchema` | 0 | `id` | isoTimestamp, action, updatedAt |
| `kitchen_alerts` | `kitchenAlertSchema` | 0 | `id` | orderId, updatedAt |

## Branch-Scoped Queries

`createRxStore` captures the query at init time. For branch filtering, fetch all and filter reactively:

```ts
const _allTables = createRxStore<Table>('tables', db => db.tables.find());
export const tables = {
    get value() {
        return _allTables.value.filter(t => t.locationId === session.branch);
    }
};
```

## Performance Note: Timer Ticks

`tickTimers()` runs every second for occupied tables. Keep ticks in memory and flush to RxDB every
15 seconds to avoid excessive writes. See `RXDB_GUIDE.md` Rule 10 for the pattern.
