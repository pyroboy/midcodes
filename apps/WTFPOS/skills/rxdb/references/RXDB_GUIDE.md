# RxDB Integration Guide for WTFPOS

## For AI Agents: SvelteKit + RxDB Local-First Development

This guide defines how WTFPOS uses RxDB for persistence. Follow these rules strictly.

**RxDB version: `^16.21.1`** (v16 line — all examples use v16 APIs)

---

## Current Architecture

```
Component → reactive getters → createRxStore() → RxDB Observable → IndexedDB (Dexie)
                                    ↓ writes
                          db.collection.insert / incrementalPatch / incrementalModify
```

---

## What Exists

| File | Status | Purpose |
|---|---|---|
| `src/lib/db/index.ts` | Working | Singleton `getDb()`, creates RxDB with Dexie storage, all collections |
| `src/lib/db/schemas.ts` | Working | All schemas (mostly version 0, stock_counts at version 1) |
| `src/lib/db/seed.ts` | Working | Seeds empty DB from mock data constants |
| `src/lib/stores/sync.svelte.ts` | Working | `createRxStore()` — reactive read bridge |
| `src/lib/stores/pos.svelte.ts` | Migrated | Tables, orders, menu items — all RxDB-backed |
| `src/lib/stores/stock.svelte.ts` | Migrated | Stock, deliveries, waste, deductions |
| `src/lib/stores/expenses.svelte.ts` | Migrated | Expenses |
| `src/lib/stores/audit.svelte.ts` | Partial | Audit log |
| `src/lib/stores/session.svelte.ts` | In-memory | Device-local — DO NOT migrate |

### Collections Registered in `db/index.ts`

| Collection | Schema | Version |
|---|---|---|
| `tables` | `tableSchema` | 1 |
| `orders` | `orderSchema` | 2 |
| `menu_items` | `menuItemSchema` | 0 |
| `stock_items` | `stockItemSchema` | 1 |
| `deliveries` | `deliverySchema` | 2 |
| `waste` | `wasteSchema` | 2 |
| `deductions` | `deductionSchema` | 1 |
| `expenses` | `expenseSchema` | 2 |
| `adjustments` | `adjustmentSchema` | 2 |
| `stock_counts` | `stockCountSchema` | 1 (has migration) |
| `devices` | `deviceSchema` | 0 |
| `kds_tickets` | `kdsTicketSchema` | 1 |
| `kds_history` | `kdsHistorySchema` | 0 |
| `x_reads` | `xReadSchema` | 0 |
| `utility_readings` | `utilityReadingSchema` | 0 |

---

## Rule 1: Browser-Only — Never Run RxDB on Server

RxDB uses IndexedDB which only exists in the browser.

```ts
// CORRECT — guard with `browser`
import { browser } from '$app/environment';

if (browser) {
    const db = await getDb();
}

// WRONG — will crash during SSR
const db = await getDb();
```

Every function that calls `getDb()` must check `browser` first, or be called only from component event handlers (which only fire in the browser).

---

## Rule 2: NEVER Use `.patch()` or `.modify()` — Always Use Incremental Variants

This is the most critical rule. Using `.patch()` or `.modify()` on a document fetched even milliseconds ago will throw a **409 CONFLICT** error if any other write happened in between.

| Method | Retries on Conflict? | Use When |
|---|---|---|
| `incrementalModify(fn)` | YES — re-runs fn on latest doc | Arrays, computed fields, or anything reading current doc state |
| `incrementalPatch({...})` | YES — applies patch to latest doc | Simple scalar field updates (status, billTotal, etc.) |
| `patch({...})` | NO — throws 409 CONFLICT | NEVER use this |
| `modify(fn)` | NO — throws 409 CONFLICT | NEVER use this |

```ts
// CORRECT — incrementalPatch for scalar fields
await tableDoc.incrementalPatch({ status: 'occupied', billTotal: 1398 });

// CORRECT — incrementalModify when reading current array state
await orderDoc.incrementalModify((doc: Order) => {
    doc.items = [...doc.items, newItem];
    Object.assign(doc, calculateOrderTotals(doc));
    return doc;
});

// WRONG — throws 409 if any concurrent write happened
await tableDoc.patch({ status: 'occupied' });

// WRONG — stale array data causes items to be lost
const order = orderDoc.toMutableJSON();
await orderDoc.patch({ items: [...order.items, newItem] }); // order.items may be stale
```

### When to use `incrementalModify` vs `incrementalPatch`

Use `incrementalModify` when:
- You are **merging arrays** (items, payments, sub-bills)
- Your new value **depends on the current doc value** (`doc.items`, `doc.pax`, etc.)
- You need to **compute new totals** from the updated doc

Use `incrementalPatch` when:
- You are setting **independent scalar fields** (status, billTotal, currentOrderId)
- The new value does **not depend** on the current doc state

### `incrementalPatch` is shallow — nested objects are overwritten

```ts
// If doc.meta = { field1: 1, field2: 2 }
await doc.incrementalPatch({ meta: { field1: 3 } });
// Result: doc.meta = { field1: 3 }  ← field2 is GONE

// Use incrementalModify for nested object merges instead:
await doc.incrementalModify((doc: any) => {
    doc.meta = { ...doc.meta, field1: 3 };
    return doc;
});
```

This is relevant for `subBills`, nested `items`, and any nested object in schemas.

---

## Rule 3: Read from RxDB Doc Inside Mutations — Not from Svelte Store State

Inside any `incrementalModify` callback, always read from `doc` — not from `orders.value`, `kdsTickets.value`, or any Svelte reactive store. Svelte store state may lag behind by one or more writes.

```ts
// WRONG — `order.items` is from Svelte store state, may be 1-2 writes behind
const order = orders.value.find(o => o.id === orderId);
await orderDoc.incrementalPatch({ items: [...order.items, newItem] });

// CORRECT — `doc.items` is always the latest revision from IndexedDB
await orderDoc.incrementalModify((doc: Order) => {
    doc.items = [...doc.items, newItem];
    return doc;
});
```

**Rule of thumb:** Use Svelte store state (`orders.value`, `tables.value`) for **display only**. Use RxDB document data (`doc.*` inside `incrementalModify`) for **writes**.

---

## Rule 4: How `createRxStore` Works

```ts
// src/lib/stores/sync.svelte.ts
export function createRxStore<T = any>(
    collectionName: string,
    queryFn: (db: any) => any
) {
    let state = $state<T[]>([]);
    let initialized = $state(false);

    if (browser) {
        getDb().then(db => {
            const query = queryFn(db);
            query.$.subscribe((documents: any[]) => {
                state = documents.map(doc => doc.toJSON());
                initialized = true;
            });
        });
    }

    return {
        get value() { return state; },
        get initialized() { return initialized; }
    };
}
```

Key behavior:
- `query.$` fires automatically on ANY insert/update/delete to that collection
- `.toJSON()` strips RxDB internal fields (`_rev`, `_meta`, etc.), returns plain objects
- State starts as `[]` until DB initializes — check `initialized` before relying on data
- **READ-ONLY** — writes go directly through `db.collection.insert()` / `incrementalPatch()` / `incrementalModify()`

### Branch-scoped queries

`createRxStore` captures the query at init time. If `session.locationId` changes, the query won't update. Filter in a `$derived` instead:

```ts
// Recommended approach: fetch all, filter reactively
const _allTables = createRxStore<Table>('tables', db => db.tables.find());
export const tables = {
    get value() {
        return _allTables.value.filter(t => t.locationId === session.branch);
    }
};
```

---

## Rule 5: Write Helper Pattern

```ts
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

// Simple scalar update — incrementalPatch is fine
export async function setTableStatus(id: string, status: string) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.tables.findOne(id).exec();
    if (doc) await doc.incrementalPatch({ status });
}

// Array merge — always use incrementalModify
export async function addPaymentToOrder(orderId: string, method: string, amount: number) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.orders.findOne(orderId).exec();
    if (doc) {
        await doc.incrementalModify((d: Order) => {
            d.payments = [...d.payments, { method, amount }];
            return d;
        });
    }
}

// Insert — no conflict risk
export async function insertTable(table: Table) {
    if (!browser) return;
    const db = await getDb();
    await db.tables.insert(table);
    // No need to update Svelte state — the RxDB observable fires automatically
}

// Remove
export async function removeTable(id: string) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.tables.findOne(id).exec();
    if (doc) await doc.remove();
}
```

---

## Rule 6: Functions Must Be Async

Every store function that mutates data must be `async`. Call them with `await` from Svelte component handlers.

```svelte
<script lang="ts">
    import { openTable } from '$lib/stores/pos.svelte';

    let loading = $state(false);

    async function handleOpen() {
        loading = true;
        await openTable('TAG-T1', 4);
        loading = false;
    }
</script>

<button onclick={handleOpen} disabled={loading}>Open Table</button>
```

---

## Rule 7: Querying Data

```ts
// Find all (unfiltered)
const allOrders = createRxStore<Order>('orders', db => db.orders.find());

// Filtered
const openOrders = createRxStore<Order>('orders', db =>
    db.orders.find({ selector: { status: 'open' } })
);

// Sorted + limited
const recentOrders = createRxStore<Order>('orders', db =>
    db.orders.find({ sort: [{ createdAt: 'desc' }], limit: 100 })
);

// One-off lookup (not reactive)
const db = await getDb();
const doc = await db.tables.findOne('TAG-T1').exec();
const table = doc?.toJSON() as Table;
```

### Specify indexes for performance-critical queries

By default RxDB's query planner picks an index, but you can force it:

```ts
db.orders.find({
    selector: { locationId: 'tag', status: 'open' },
    index: ['locationId', 'status']  // Compound index — add to schema
})
```

---

## Rule 8: Schema Design & Indexing

### SC34: String fields used in indexes MUST have `maxLength`

**Error SC34** (from RxDB dev-mode): `"Fields of type string that are used in an index, must have set the maxLength attribute"`

This error fires at startup when `addCollections()` is called. It will crash the entire DB init. Every string field that appears in `indexes: [...]` must explicitly set `maxLength`:

```ts
// WRONG — crashes with SC34 at startup
export const orderSchema = {
    properties: {
        status: { type: 'string' },       // ← no maxLength
        createdAt: { type: 'string' },    // ← no maxLength
    },
    indexes: ['status', 'createdAt']      // ← these will throw SC34
};

// CORRECT
export const orderSchema = {
    properties: {
        status: { type: 'string', maxLength: 50 },
        createdAt: { type: 'string', maxLength: 30 },  // ISO 8601 = 24 chars, use 30 for safety
    },
    indexes: ['status', 'createdAt']
};
```

**Recommended `maxLength` values by field type:**

| Field type | maxLength |
|---|---|
| Primary keys / IDs (nanoid) | 100 |
| Status enums (e.g. `'open'`, `'paid'`) | 50 |
| ISO 8601 datetime strings | 30 |
| Location / branch IDs | 100 |
| Category strings | 100 |

### SC36: Nullable / union types cannot be indexed

**Error SC36**: `"A field of this type cannot be used as index"`

RxDB only supports `string`, `number`, `integer`, and `boolean` as index types. Nullable unions like `['string', 'null']` will throw SC36.

```ts
// WRONG — SC36 at startup
tableId: { type: ['string', 'null'] }
// indexes: ['tableId']  ← throws SC36

// FIX option 1 — remove it from the index (preferred if not queried by this field)
// FIX option 2 — use a sentinel value ('') instead of null and keep type: 'string'
```

### SC38: Boolean index fields must be in `required`

**Error SC38**: `"Fields of type boolean that are used in an index, must be required in the schema"`

```ts
// WRONG — SC38
depleted: { type: 'boolean' }
// required: ['id', 'stockItemId']  ← 'depleted' missing → SC38

// CORRECT
required: ['id', 'stockItemId', 'depleted']
// migration must default depleted: oldDoc.depleted ?? false
```

### SC34: String index fields must have `maxLength`

**Every field in an index must have `maxLength` — including fields inside compound indexes:**
```ts
// Compound index ['locationId', 'status'] requires BOTH fields to have maxLength
indexes: [['locationId', 'status']]
// → locationId must have maxLength ✅
// → status must have maxLength ✅
```

### Index rules

- Put the most selective field first in compound indexes
- Only index fields used in `selector` or `sort`
- All string fields used in any index (simple or compound) must have `maxLength`
- Adding indexes requires a schema version bump + identity migration

### Current indexes in this app

```ts
tableSchema:     ['locationId', 'status', ['locationId', 'status']]
orderSchema:     ['locationId', 'status', 'createdAt', ['locationId', 'status'], ['locationId', 'createdAt']]
stockItemSchema: ['locationId', 'category', 'menuItemId', ['locationId', 'category']]
deliverySchema:  ['stockItemId', 'depleted', 'receivedAt', ['stockItemId', 'depleted']]
wasteSchema:     ['stockItemId', 'loggedAt']
deductionSchema: ['stockItemId', 'orderId', ['stockItemId', 'orderId']]
adjustmentSchema:['stockItemId', 'loggedAt']
expenseSchema:   ['locationId', 'createdAt', ['locationId', 'createdAt']]
kdsTicketSchema: ['orderId']
```

---

## Rule 9: Schema Migrations

When you change ANY schema property — including adding `maxLength`, adding indexes, or adding/renaming fields:

1. Bump `version` in the schema
2. Add a `migrationStrategies` entry in `db/index.ts`
3. Migration runs automatically on next DB open

If the data shape hasn't changed (only constraints or indexes changed), use an identity migration:

```ts
// db/index.ts
const identityMigration1 = { 1: (oldDoc: any) => oldDoc };
const identityMigration2 = { 1: (oldDoc: any) => oldDoc, 2: (oldDoc: any) => oldDoc };

// schema bumped 0→1: use identityMigration1
// schema bumped 0→1→2: use identityMigration2
```

```ts
// db/index.ts — adding a migration
await db.addCollections({
    orders: {
        schema: orderSchemaV1, // version: 1
        migrationStrategies: {
            1: (oldDoc) => {
                oldDoc.cancelReason = oldDoc.cancelReason ?? null;
                return oldDoc;
            }
        }
    }
});
```

**Migration rules:**
- You cannot remove a `required` field without a migration
- You can add optional fields without bumping version (they just won't exist on old docs)
- Test migrations locally before deploying: create data on old version, load new code, verify

---

## Rule 10: Performance — Timer Ticks

`tickTimers()` runs every second and updates `elapsedSeconds` on occupied tables. Keep it in memory and only flush periodically:

```ts
// Option A: Full RxDB write every second (fine for < 20 tables, but generates many writes)
export async function tickTimers() {
    const db = await getDb();
    const occupiedDocs = await db.tables.find({
        selector: { status: { $in: ['occupied', 'warning', 'critical'] } }
    }).exec();
    for (const doc of occupiedDocs) {
        await doc.incrementalPatch({ elapsedSeconds: (doc.elapsedSeconds ?? 0) + 1 });
    }
}

// Option B: In-memory tick, flush to RxDB every 15 seconds (recommended)
let timerCache = new Map<string, number>();

export function tickTimersLocal() {
    for (const [id, seconds] of timerCache) {
        timerCache.set(id, seconds + 1);
    }
}

export async function flushTimers() {
    const db = await getDb();
    for (const [id, seconds] of timerCache) {
        const doc = await db.tables.findOne(id).exec();
        if (doc) await doc.incrementalPatch({ elapsedSeconds: seconds });
    }
}
// Call flushTimers() every 15 seconds via setInterval
```

**Recommendation:** Option B — keep timers snappy in memory, persist every 15 seconds.

---

## Rule 11: Error Handling

```ts
export async function safeDbOp<T>(operation: () => Promise<T>, fallback?: T): Promise<T | undefined> {
    if (!browser) return fallback;
    try {
        return await operation();
    } catch (err) {
        console.error('[RxDB Operation Failed]', err);
        return fallback;
    }
}

// Usage:
await safeDbOp(() => db.orders.insert(newOrder));
await safeDbOp(() => orderDoc.incrementalModify(mutateFn));
```

Note: `incrementalPatch` and `incrementalModify` already retry on 409 CONFLICT internally. You still need error handling for other failure types (IndexedDB quota exceeded, etc.).

---

## Rule 12: What Stays In-Memory (Do NOT Migrate)

| Data | Why it stays in `$state` |
|---|---|
| `session` (user, role, branch) | Device-local, no persistence needed |
| `connectionState` | Runtime-only |
| `hardwareState` | Runtime-only |
| `alerts` (KDS kitchen alerts) | Ephemeral, cleared each shift |
| Timer display tick | Computed from `elapsedSeconds` which IS persisted |

---

## Rule 13: Seed File

`src/lib/db/seed.ts` runs on every `getDb()` call but only inserts if `menu_items` is empty.

**Known issues:**
- Expense seeds use wrong locationIds (`loc-ayala`, `loc-bgc` → should be `tag`, `pgl`)
- No audit log seeding
- Stock items use sequential IDs (`si-0`, `si-1`) — use `nanoid` for consistency

**Reset DB in browser console:**
```js
indexedDB.deleteDatabase('wtfpos_db');
location.reload();
```

---

## Rule 14: RxDB 16 Specifics (current version)

Key changes in v16 that affect this codebase:

- **`memory-synced` storage removed** — use memory-mapped storage instead if needed
- **Conflict handler split**: `conflictHandler` now has separate `isEqual()` and `resolve()` methods. The default handler keeps master state (correct for offline-first).
- **Dev-mode requires a schema validator** — already configured in `db/index.ts` with `wrappedValidateIsMyJsonValidStorage`
- **`toggleOnDocumentVisible` defaults to `true`** — replication pauses when tab is hidden, resumes when visible
- **`eventReduce: true`** is already set in our config — this enables EventReduce algorithm that avoids re-running queries on every change (significant perf win)
- **`multiInstance: true`** is set — allows multiple tabs to share the same IndexedDB; important for multi-tablet POS use

---

## Rule 15: Production Update Protocol

### When Is It Safe to Update?

```
┌─────────────────────────────────────────────────────────────────┐
│  UPDATE SAFETY MATRIX                                          │
├────────────────────────┬───────────────┬────────────────────────┤
│  Change Type           │  Safe Window  │  Risk                  │
├────────────────────────┼───────────────┼────────────────────────┤
│  UI tweaks, labels,    │  Anytime      │  None                  │
│  colors, typo fixes    │               │                        │
├────────────────────────┼───────────────┼────────────────────────┤
│  Bug fixes (no schema) │  Anytime      │  Low — test first      │
├────────────────────────┼───────────────┼────────────────────────┤
│  New features reading  │  Slow hours   │  Low                   │
│  existing data         │  (2–4 PM)     │                        │
├────────────────────────┼───────────────┼────────────────────────┤
│  New store logic that  │  Between      │  Medium — verify       │
│  changes write paths   │  shifts       │  data integrity        │
├────────────────────────┼───────────────┼────────────────────────┤
│  New RxDB collection   │  Between      │  Medium — restart      │
│  (addCollections)      │  shifts       │  needed                │
├────────────────────────┼───────────────┼────────────────────────┤
│  Schema version bump   │  After close  │  HIGH — migration runs │
│  (field add/rename)    │  (10 PM+)     │  on every document     │
├────────────────────────┼───────────────┼────────────────────────┤
│  Breaking schema       │  After close  │  CRITICAL — test       │
│  (remove field, change │  + backup     │  migration on copy     │
│  primary key)          │  first        │  of production data    │
├────────────────────────┼───────────────┼────────────────────────┤
│  Force-clear IndexedDB │  NEVER        │  DATA LOSS             │
│  remotely              │  remotely     │                        │
└────────────────────────┴───────────────┴────────────────────────┘
```

### Rollout Order

```
1. Deploy new build to server
2. Update ONE tablet at one branch (canary)
   → Verify for 15 minutes: orders, tables, stock all work
3. Update remaining tablets at that branch (main POS first, then KDS)
4. Move to next branch, repeat
5. Owner phones last
```

### Schema Migration Checklist

```
□ Bumped schema version number in schemas.ts
□ Added migrationStrategies in db/index.ts
□ Tested locally:
  - Created data on OLD version
  - Switched to NEW code, reloaded
  - Verified all old data migrated correctly
□ Tested fresh install (cleared IndexedDB, re-seeded)
□ Bumped APP_VERSION in version.ts
□ Deployed after service hours (10 PM+)
□ Canary tablet updated first
```

---

## File Reference

| File | Purpose |
|---|---|
| `src/lib/db/index.ts` | DB singleton, collection registration, error recovery |
| `src/lib/db/schemas.ts` | All RxJsonSchema definitions |
| `src/lib/db/seed.ts` | First-run mock data seeder |
| `src/lib/stores/sync.svelte.ts` | `createRxStore()` — reactive read bridge |
| `src/lib/stores/pos.svelte.ts` | Main POS store (tables, orders, menu) |
| `src/lib/stores/stock.svelte.ts` | Stock store |
| `src/lib/stores/expenses.svelte.ts` | Expenses |
| `src/lib/stores/audit.svelte.ts` | Audit log |
| `src/lib/stores/session.svelte.ts` | Session — DO NOT migrate (stays in-memory) |
| `src/lib/stores/connection.svelte.ts` | Network state — DO NOT migrate |
| `src/lib/stores/hardware.svelte.ts` | Hardware sim — DO NOT migrate |
| `src/lib/version.ts` | App version + build date |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/routes/test-db/+page.svelte` | Dev test page for RxDB |
