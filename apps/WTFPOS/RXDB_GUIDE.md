# RxDB Integration Guide for WTFPOS

## For AI Agents: SvelteKit + RxDB Local-First Development

This guide defines how to migrate WTFPOS from in-memory `$state` stores to RxDB-backed persistence. Follow these rules strictly.

---

## Current Architecture

```
BEFORE (current):
  Component → $state arrays (pos.svelte.ts) → lost on refresh

AFTER (target):
  Component → reactive getters → createRxStore() → RxDB Observable → IndexedDB
                                ↓ writes
                          db.collection.insert/update/remove → IndexedDB
```

### What Exists Already

| File | Status | Purpose |
|---|---|---|
| `src/lib/db/index.ts` | ✅ Working | Singleton `getDb()`, creates RxDB with Dexie storage, 8 collections |
| `src/lib/db/schemas.ts` | ✅ Working | All 8 schemas (version 0, no migrations) |
| `src/lib/db/seed.ts` | ✅ Working | Seeds empty DB from existing mock data constants |
| `src/lib/stores/sync.svelte.ts` | ⚠️ Partial | `createRxStore()` — read-only bridge, no write helpers |
| `src/routes/test-db/+page.svelte` | ✅ Working | Test harness proving RxDB works |

### What Needs Migration

| Store File | Collections Used | Priority |
|---|---|---|
| `pos.svelte.ts` | `tables`, `orders`, `menu_items` | 🔴 Critical — core POS |
| `stock.svelte.ts` | `stock_items`, `deliveries`, `waste`, `deductions` | 🟡 High |
| `expenses.svelte.ts` | `expenses` | 🟢 Low |
| `reports.svelte.ts` | None (derived from pos + stock) | 🟢 Auto-fixed when pos/stock migrate |
| `audit.svelte.ts` | Needs new collection | 🟡 High |
| `session.svelte.ts` | None (stays in-memory, device-local) | ⚪ No change |

---

## Rule 1: Browser-Only — Never Run RxDB on Server

RxDB uses IndexedDB which only exists in the browser. SvelteKit renders on both server and client.

```ts
// ✅ CORRECT — guard with `browser`
import { browser } from '$app/environment';

if (browser) {
    const db = await getDb();
}

// ❌ WRONG — will crash during SSR
const db = await getDb(); // IndexedDB doesn't exist on server
```

The existing `createRxStore()` already has this guard. Every new function that touches `getDb()` must also check `browser`.

---

## Rule 2: How createRxStore Works

```ts
// src/lib/stores/sync.svelte.ts — existing code
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

**Key behavior:**
- `query.$` is an RxDB Observable — fires automatically on ANY insert/update/delete to that collection
- `.toJSON()` strips RxDB metadata, returns plain objects matching your TypeScript types
- State starts as `[]` until DB initializes (check `initialized` before relying on data)
- This is READ-ONLY — writes go directly through `db.collection.insert()` etc.

---

## Rule 3: Migration Pattern — Store by Store

### Step 1: Create the reactive read store

```ts
// Example: migrating tables from pos.svelte.ts

// BEFORE:
export const tables = $state<Table[]>(makeTables());

// AFTER:
import { createRxStore } from './sync.svelte';
const _tables = createRxStore<Table>('tables', db => db.tables.find());
export const tables = { get value() { return _tables.value; } };
```

### Step 2: Create write helpers using getDb()

```ts
// Add to the store file or a new db helper file
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

export async function insertTable(table: Table) {
    if (!browser) return;
    const db = await getDb();
    await db.tables.insert(table);
    // No need to update $state — the RxDB observable fires automatically
}

export async function updateTable(id: string, patch: Partial<Table>) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.tables.findOne(id).exec();
    if (doc) await doc.patch(patch);
}

export async function removeTable(id: string) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.tables.findOne(id).exec();
    if (doc) await doc.remove();
}
```

### Step 3: Replace all direct array mutations

```ts
// BEFORE (direct $state mutation):
tables.push(newTable);
const idx = tables.findIndex(t => t.id === id);
tables[idx].status = 'occupied';
tables.splice(idx, 1);

// AFTER (RxDB operations):
await insertTable(newTable);
await updateTable(id, { status: 'occupied' });
await removeTable(id);
```

**Critical: The observable auto-updates the reactive state.** You do NOT manually push to arrays after a write.

---

## Rule 4: Functions Become Async

Every store function that mutates data must become `async`. This is the biggest code change.

```ts
// BEFORE:
export function openTable(tableId: string, pax: number) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    table.status = 'occupied';
    table.sessionStartedAt = new Date().toISOString();
    // ... create order, etc.
}

// AFTER:
export async function openTable(tableId: string, pax: number) {
    const db = await getDb();
    const tableDoc = await db.tables.findOne(tableId).exec();
    if (!tableDoc) return;

    await tableDoc.patch({
        status: 'occupied',
        sessionStartedAt: new Date().toISOString(),
        elapsedSeconds: 0
    });

    // Create the order
    const order: Order = { /* ... */ };
    await db.orders.insert(order);

    // Link order to table
    await tableDoc.patch({ currentOrderId: order.id });
}
```

### Handling async in Svelte components

```svelte
<script lang="ts">
    import { openTable } from '$lib/stores/pos.svelte';

    let loading = $state(false);

    async function handleOpen() {
        loading = true;
        await openTable('QC-T1', 4);
        loading = false;
    }
</script>

<button onclick={handleOpen} disabled={loading}>
    Open Table
</button>
```

---

## Rule 5: Querying Data

### Simple find all
```ts
const allTables = createRxStore<Table>('tables', db => db.tables.find());
```

### Filter by locationId (branch scoping)
```ts
import { session } from './session.svelte';

// Reactive query filtered by current branch
const branchTables = createRxStore<Table>('tables', db =>
    db.tables.find({ selector: { locationId: session.locationId } })
);
```

**⚠️ Limitation:** `createRxStore` captures the query at init time. If `session.locationId` changes after init, the query won't update. For dynamic filtering, either:
- Re-create the store when branch changes (simple, recommended for now)
- Filter in a `$derived` from the full collection (works, slightly less efficient)

```ts
// Option B: derive from full collection
const _allTables = createRxStore<Table>('tables', db => db.tables.find());
export const tables = $derived(
    _allTables.value.filter(t => t.locationId === session.locationId)
);
```

### Find one by ID
```ts
// For one-off lookups (not reactive):
const db = await getDb();
const doc = await db.tables.findOne('QC-T1').exec();
const table = doc?.toJSON() as Table;

// For reactive single-doc (use in components):
const tableStore = createRxStore<Table>('tables', db =>
    db.tables.findOne('QC-T1')
);
```

### Sorted queries
```ts
const recentOrders = createRxStore<Order>('orders', db =>
    db.orders.find({ sort: [{ createdAt: 'desc' }], limit: 50 })
);
```

---

## Rule 6: Schema Rules

### Current schemas are version 0 — no migrations needed yet

When you need to add a field later:
1. Bump `version` to 1
2. Add a `migrationStrategies` object to the collection config in `db/index.ts`
3. The migration runs automatically on next DB open

```ts
// Example future migration:
await db.addCollections({
    tables: {
        schema: tableSchemaV1, // version: 1
        migrationStrategies: {
            1: (oldDoc) => {
                oldDoc.newField = 'default_value';
                return oldDoc;
            }
        }
    }
});
```

### Schema-Type alignment gaps to fix

| Schema | Issue | Fix |
|---|---|---|
| `orderSchema` | `subBills` is untyped `{ type: 'array' }` | Add full SubBill item schema |
| `stockItemSchema` | `proteinType` missing from `required` | OK — it's optional in the type too |
| seed `expenses` | Uses stale `loc-ayala`/`loc-bgc` IDs | Change to `qc`/`mkti` |
| `audit` | No schema or collection exists | Need to create `auditSchema` + add collection |
| `kds_tickets` | No schema or collection exists | Need to create if KDS data should persist |

---

## Rule 7: What Stays In-Memory (Do NOT Migrate)

| Data | Why it stays in `$state` |
|---|---|
| `session` (user, role, branch) | Device-local, no persistence needed |
| `connectionState` | Runtime-only, reflects current network |
| `hardwareState` | Runtime-only, reflects current hardware |
| `alerts` (KDS kitchen alerts) | Ephemeral, cleared each shift |
| Timer tick state | Computed from `elapsedSeconds` which IS persisted |
| `kdsTickets` | Consider: these are derived from orders. Could stay derived. |

---

## Rule 8: The Seed File

`src/lib/db/seed.ts` runs on every `getDb()` call but only inserts data if `menu_items` collection is empty.

**Known issues to fix:**
- Expense seeds use wrong locationIds (`loc-ayala`, `loc-bgc` → should be `qc`, `mkti`)
- No audit log seeding
- Stock items use sequential IDs (`si-0`, `si-1`) — consider using `nanoid` for consistency

**When to re-seed:** If you change schemas and need fresh data, clear IndexedDB:
```js
// In browser console:
indexedDB.deleteDatabase('wtfpos_db');
location.reload();
```

---

## Rule 9: Migration Order (Do One Store at a Time)

### Phase 1: Menu Items (safest, read-heavy)
1. Replace `menuItems` in `pos.svelte.ts` with `createRxStore`
2. Convert `addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `toggleMenuItemAvailability` to async RxDB ops
3. Test: admin menu page still works, items persist on refresh

### Phase 2: Tables
1. Replace `tables` array with `createRxStore`
2. Convert `openTable`, `closeTable`, `transferTable`, `mergeTables`, `addTable`, `deleteTable`, `updateTableLayout`, `setTableMaintenance` to async
3. Handle `tickTimers` — this runs every second. Batch-update `elapsedSeconds` via RxDB (see performance note below)
4. Test: floor page works, table state persists

### Phase 3: Orders
1. Replace `orders` array with `createRxStore`
2. This is the largest migration — ~20 functions touch orders
3. Convert all payment, discount, split-bill, void functions
4. Test: full order lifecycle (open → items → pay → close)

### Phase 4: Stock
1. Replace `stockItems`, `deliveries`, `wasteEntries`, `deductions` with `createRxStore`
2. Convert `receiveDelivery`, `logWaste`, `deductFromStock`, `transferStock`, `adjustStock`
3. Test: receive delivery, serve order (auto-deduct), check variance

### Phase 5: Expenses
1. Replace `allExpenses` with `createRxStore`
2. Convert `addExpense`, `deleteExpense`
3. Simplest migration

### Phase 6: Audit Log
1. Create `auditSchema` and add `audit_logs` collection
2. Replace `auditLog` array with `createRxStore`
3. Convert `writeLog` to async insert

---

## Rule 10: Performance — Timer Ticks

`tickTimers()` runs every 1 second and updates `elapsedSeconds` on every occupied table. Writing to RxDB 8-16 times per second is fine for IndexedDB, but be aware:

```ts
// Option A: Direct patch (simple, fine for <20 tables)
export async function tickTimers() {
    const db = await getDb();
    const occupiedDocs = await db.tables.find({
        selector: { status: { $in: ['occupied', 'warning', 'critical'] } }
    }).exec();

    for (const doc of occupiedDocs) {
        await doc.patch({ elapsedSeconds: (doc.elapsedSeconds ?? 0) + 1 });
    }
}

// Option B: Keep timer in memory, persist periodically (better performance)
// Update in-memory every second, write to RxDB every 10-30 seconds
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
        if (doc) await doc.patch({ elapsedSeconds: seconds });
    }
}
// Call flushTimers() every 15 seconds via setInterval
```

**Recommendation:** Option B — keep timers snappy in memory, persist periodically. A 15-second write interval is more than enough for timer state that's only used for display.

---

## Rule 11: Derived/Computed Data (Reports)

`reports.svelte.ts` computes everything from `pos` and `stock` state. After migration:

```ts
// Reports will automatically work IF they read from the reactive stores
// Example:
export function salesSummary() {
    // This reads from the createRxStore-backed `orders`
    // which auto-updates when RxDB data changes
    const todayOrders = orders.value.filter(o => /* ... */);
    return { /* computed values */ };
}
```

No migration needed for reports — they just need to read from the new reactive getters.

---

## Rule 12: Error Handling Pattern

```ts
export async function safeDbOp<T>(operation: () => Promise<T>, fallback?: T): Promise<T | undefined> {
    if (!browser) return fallback;
    try {
        return await operation();
    } catch (err) {
        console.error('[RxDB Operation Failed]', err);
        // TODO: queue for retry if offline
        return fallback;
    }
}

// Usage:
await safeDbOp(() => db.orders.insert(newOrder));
```

---

## Rule 13: Testing After Migration

After each phase, verify:

1. **Persistence:** Perform an action → refresh the page → data still there
2. **Reactivity:** Open two browser tabs → change data in one → other tab updates
3. **Seed data:** Clear IndexedDB → reload → mock data appears
4. **No SSR crashes:** Run `pnpm build` — no IndexedDB errors during SSR

Quick test commands:
```bash
pnpm dev          # Test in browser
pnpm check        # TypeScript errors from async changes
pnpm build        # Verify no SSR issues
```

Browser console helpers:
```js
// Check DB contents
const { getDb } = await import('/src/lib/db/index.ts');
const db = await getDb();
const tables = await db.tables.find().exec();
console.log(tables.map(t => t.toJSON()));

// Nuke and re-seed
indexedDB.deleteDatabase('wtfpos_db');
location.reload();
```

---

## Rule 14: Production Update Protocol

### Version Tracking

The app version is defined in `src/lib/version.ts`:
- `APP_VERSION` — manually bumped string (e.g. `'0.1.0'`)
- `BUILD_DATE` — auto-injected by Vite at build time
- `BUILD_MODE` — `'production'` or `'development'`

Displayed in the TopBar as a subtle `v0.1.0` badge. Hover shows full build timestamp.

**Always bump `APP_VERSION` before deploying.** This is how you confirm which version each tablet is running.

### When Is It Safe to Update?

```
┌─────────────────────────────────────────────────────────────────┐
│  UPDATE SAFETY MATRIX                                          │
├────────────────────────┬───────────────┬────────────────────────┤
│  Change Type           │  Safe Window  │  Risk                  │
├────────────────────────┼───────────────┼────────────────────────┤
│  UI tweaks, labels,    │  Anytime      │  None — no data        │
│  colors, typo fixes    │               │  impact                │
├────────────────────────┼───────────────┼────────────────────────┤
│  Bug fixes (no schema) │  Anytime      │  Low — test first      │
├────────────────────────┼───────────────┼────────────────────────┤
│  New features reading  │  Slow hours   │  Low — new code reads  │
│  existing data         │  (2–4 PM)     │  existing collections  │
├────────────────────────┼───────────────┼────────────────────────┤
│  New store logic that  │  Between      │  Medium — verify       │
│  changes write paths   │  shifts       │  data integrity        │
├────────────────────────┼───────────────┼────────────────────────┤
│  New RxDB collection   │  Between      │  Medium — no migration │
│  (addCollections)      │  shifts       │  but restart needed    │
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

### Rollout Order (Always)

```
1. Deploy new build to server/hosting
   ↓
2. Update ONE tablet at one branch (canary)
   → Verify for 15 minutes: orders, tables, stock all work
   ↓
3. Update remaining tablets at that branch
   → Main POS first, then Kitchen KDS
   ↓
4. Move to next branch, repeat steps 2–3
   ↓
5. Owner phones last (lowest priority, lowest risk)
```

### How Staff Triggers Updates (Option B — Manual Prompt)

Updates should NEVER auto-refresh mid-transaction. When a new build is deployed:

1. The service worker (future PWA) detects a new version is available
2. A non-intrusive banner appears: **"Update available (v0.2.0)"**
3. Staff/manager taps **"Update Now"** when they're between customers
4. App reloads with new code; RxDB reopens existing IndexedDB (data intact)

Until the PWA service worker is implemented, updates happen via manual browser refresh.
The version badge in the TopBar lets you confirm the update took effect.

### Schema Migration Checklist (for version bumps)

Before deploying a schema change:

```
□ Bumped schema version number in schemas.ts
□ Added migrationStrategies in db/index.ts for the new version
□ Tested locally:
  - Created data on OLD version
  - Switched to NEW code, reloaded
  - Verified all old data migrated correctly
  - Verified new features work with migrated data
□ Tested fresh install (cleared IndexedDB, re-seeded)
□ Bumped APP_VERSION in version.ts
□ Deployed after service hours (10 PM+)
□ Canary tablet updated first
```

### Offline Branch Update Scenario

If a branch has been offline for days and you deployed an update:

```
Day 1: You deploy v0.2.0 (with schema v1 migration)
Day 1: Branch A updates → migration runs → all good
Day 3: Branch B comes back online
        → Tablet loads new app code (v0.2.0)
        → RxDB detects schema v0 → v1 mismatch
        → Migration runs on all local documents
        → Branch B is now on v0.2.0 with migrated data
        → Sync layer (when built) replays 2 days of data to server
```

This works because migrations are **per-device, automatic, and sequential**. Each tablet independently migrates its own IndexedDB. No coordination required.

---

## File Reference

| File | Purpose |
|---|---|
| `src/lib/db/index.ts` | DB singleton, collection registration |
| `src/lib/db/schemas.ts` | All RxJsonSchema definitions |
| `src/lib/db/seed.ts` | First-run mock data seeder |
| `src/lib/stores/sync.svelte.ts` | `createRxStore()` — reactive read bridge |
| `src/lib/stores/pos.svelte.ts` | Main POS store (tables, orders, menu) — **migrate this** |
| `src/lib/stores/stock.svelte.ts` | Stock store — **migrate this** |
| `src/lib/stores/expenses.svelte.ts` | Expenses — **migrate this** |
| `src/lib/stores/audit.svelte.ts` | Audit log — **needs schema + migrate** |
| `src/lib/stores/session.svelte.ts` | Session — **do NOT migrate** (stays in-memory) |
| `src/lib/stores/connection.svelte.ts` | Network state — **do NOT migrate** |
| `src/lib/stores/hardware.svelte.ts` | Hardware sim — **do NOT migrate** |
| `src/lib/version.ts` | App version + build date + update protocol notes |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/routes/test-db/+page.svelte` | Dev test page for RxDB |
