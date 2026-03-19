# Adding a New Table to the Dorm App

> The definitive checklist for adding a new Neon table and wiring it through RxDB, replication, stores, optimistic writes, and UI. Reference entity: **floors**.

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Neon (PG)  │────▶│  Pull API    │────▶│  RxDB (IDB)  │
│  Drizzle ORM │     │  /api/rxdb/  │     │  Dexie Store  │
│  schema.ts   │     │  pull/[col]  │     │  schemas.ts   │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       │  Form Actions                           │  Reactive Store
       │  (+page.server.ts)                      │  (collections.svelte.ts)
       │                                         │
       ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Server      │     │  Optimistic  │     │  Svelte 5    │
│  Validation  │◀───▶│  Writes      │◀───▶│  UI ($state, │
│  (Zod)       │     │  + bgResync  │     │   $derived)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Data flow (write):**
1. User submits form → server validates + writes to Neon
2. Client does optimistic write to RxDB (instant UI)
3. `bgResync()` pulls from Neon in background to confirm

**Data flow (read):**
1. On startup, RxDB pulls from Neon via checkpoint-based replication
2. Svelte store subscribes to RxDB query observable
3. UI renders from store (`$derived` from `floorsStore.value`)

---

## Checklist

Copy this checklist into your task when adding a new table. Replace `{entity}` with your entity name (e.g., `floor_layout_items`).

### Database Layer

- [ ] **1. Drizzle enum** — `src/lib/server/schema.ts`
  - Add `pgEnum` if your entity has status/type fields
  - Place near other enums at the top of the file

- [ ] **2. Drizzle table** — `src/lib/server/schema.ts`
  - Add `pgTable` definition with all columns
  - Must include: `id serial PK`, `createdAt`, `updatedAt`, `deletedAt` (soft delete)
  - Foreign keys: `.references(() => parentTable.id)`

- [ ] **3. SQL migration** — `scripts/migrate/add-{entity}.sql`
  - Idempotent: `CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... END $$` for enums
  - Add indexes: `floor_id`, `updated_at + id` (for replication), any FK columns
  - Run against Neon: `source .env.local && psql "$NEON_DATABASE_URL" -f scripts/migrate/add-{entity}.sql`

### Transform Layer

- [ ] **4. Transform function** — `src/lib/server/transforms.ts`
  - Add `transformEntity(row)` that maps camelCase Drizzle → snake_case RxDB
  - IDs: `sid(row.id)` — coerces number to string
  - Timestamps: `ts(row.createdAt)` — Date to ISO string
  - Nullable FKs: `row.fkId != null ? sid(row.fkId) : null`
  - Nullable strings: `row.field ?? null`

### RxDB Layer

- [ ] **5. RxDB schema** — `src/lib/db/schemas.ts`
  - Version: `0` for new collections (no migration needed)
  - `id` is always `{ type: 'string', maxLength: 20 }`
  - FK fields: `{ type: 'string', maxLength: 20 }` if NOT NULL, `{ type: ['string', 'null'] }` if nullable
  - Number fields that are indexed need: `minimum`, `maximum`, `multipleOf`
  - String fields that are indexed need: `maxLength`
  - **Indexed fields MUST be in `required` array**
  - **Nullable fields CANNOT be indexed** (SC36/DXE1 error)
  - `deleted_at` is NEVER indexed (it's nullable)

- [ ] **6. DB registration** — `src/lib/db/index.ts`
  - Import your schema from `./schemas`
  - For new collections (version 0): use `col0(yourSchema)`
  - For existing collections (version 1+): use `col(yourSchema)`
  - Add to `COLLECTIONS` object

  ```typescript
  // Version 0 (new collection — no migration)
  const col0 = (schema: any) => ({
    schema,
    migrationStrategies: {},
    cleanup: { minimumDeletedTime: Infinity, autoStart: false }
  });

  // Version 1+ (has v0→v1 migration)
  const col = (schema: any) => ({
    schema,
    migrationStrategies: IDENTITY_MIGRATION,
    cleanup: { minimumDeletedTime: Infinity, autoStart: false }
  });
  ```

### Replication Layer

- [ ] **7. Pull endpoint** — `src/routes/api/rxdb/pull/[collection]/+server.ts`
  - Import table from `$lib/server/schema`
  - Import transform from `$lib/server/transforms`
  - Add entry to `COLLECTIONS` record:
  ```typescript
  {entity}: {
    table: entityTable,
    transform: transformEntity,
    updatedAtCol: entityTable.updatedAt,
    idCol: entityTable.id
  }
  ```

- [ ] **8. Replication config** — `src/lib/db/replication.ts`
  - **EAGER** (syncs on startup): add to `EAGER_COLLECTIONS` — use for core entities needed on most pages
  - **LAZY** (syncs on first page access): add to `LAZY_COLLECTIONS` — use for feature-specific data
  - Add to `COLLECTION_DEPS` if it depends on parent collections:
  ```typescript
  {entity}: ['parent_collection_1', 'parent_collection_2']
  ```

- [ ] **9. Health endpoint** — `src/routes/api/rxdb/health/+server.ts`
  - Add `UNION ALL SELECT MAX(updated_at) FROM {table_name}` to the health check query
  - This ensures `maxUpdatedAt` includes your new table

### Store Layer

- [ ] **10. RxDB store** — `src/lib/stores/collections.svelte.ts`
  - **Eager collections:**
  ```typescript
  export const entityStore = createRxStore<any>('{entity}', (db) =>
    db.{entity}.find({ selector: { deleted_at: { $eq: null } } })
  );
  ```
  - **Lazy collections** (trigger sync on first access):
  ```typescript
  export const entityStore = createRxStore<any>('{entity}', (db) => {
    ensureCollectionSynced('{entity}');
    return db.{entity}.find({ selector: { deleted_at: { $eq: null } } });
  });
  ```

### Optimistic Writes

- [ ] **11. Optimistic helpers** — `src/lib/db/optimistic-{entity}.ts` (new file)
  - `optimisticUpsertEntity(data)` — returns rollback function
  - `optimisticDeleteEntity(id)` — soft-delete
  - Pattern (copy from `optimistic-floors.ts` and rename):
  ```typescript
  import { getDb } from '$lib/db';
  import { bgResync } from '$lib/db/optimistic-utils';
  import { syncStatus } from '$lib/stores/sync-status.svelte';

  export async function optimisticUpsertEntity(data: {
    id: number;
    // ... your fields
  }): Promise<(() => Promise<void>) | null> {
    let snapshot: Record<string, any> | null = null;
    try {
      const db = await getDb();
      const sid = String(data.id);
      const existing = await db.{entity}.findOne(sid).exec();
      snapshot = existing ? existing.toJSON(true) : null;
      await db.{entity}.upsert({
        id: sid,
        // ... map all fields, coerce IDs to strings
        created_at: existing ? existing.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      });
    } catch (err) {
      bgResync('{entity}');
      return null;
    }
    bgResync('{entity}');
    const capturedSnapshot = snapshot;
    const capturedSid = String(data.id);
    return async () => {
      // rollback logic
    };
  }

  export async function optimisticDeleteEntity(id: number) {
    try {
      const db = await getDb();
      const doc = await db.{entity}.findOne(String(id)).exec();
      if (doc) {
        await doc.incrementalPatch({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) { /* log */ }
    bgResync('{entity}');
  }
  ```

### UI Layer

- [ ] **12. Zod form schema** — `src/routes/{route}/formSchema.ts`
  - Match Drizzle types: `z.coerce.number()` for integer FKs
  - `id: z.number().optional()` (absent on create, present on update)
  - Enum fields: `z.enum([...])` matching pgEnum values
  - Defaults matching Drizzle defaults

- [ ] **13. Page server** — `src/routes/{route}/+page.server.ts`
  - `load`: return `superValidate(zod(schema))` for form init
  - `create` action: validate → check duplicates → `db.insert()` → return form with new ID
  - `update` action: validate → optimistic lock check → `db.update()` → return form
  - `delete` action: `db.update().set({ deletedAt: new Date() })` (soft delete)
  - Always return `{ form }` so client gets the server-assigned ID

- [ ] **14. Page component** — `src/routes/{route}/+page.svelte`
  - Data from `entityStore.value` (NOT from server load)
  - Skeleton while `!entityStore.initialized`
  - `superForm` with:
    - `invalidateAll: false` (RxDB handles data, not SvelteKit)
    - `onSubmit`: capture form data, close modal, optimistic write for updates
    - `onResult`: optimistic write for creates (with server ID), `bgResync()`
    - `onError`: rollback + `bgResync()`
  - Delete via `bufferedMutation()`

- [ ] **15. Form component** — `src/routes/{route}/EntityForm.svelte`
  - Hidden `id` + `_updated_at` fields for edit mode
  - `use:enhance` on `<form>`
  - Enum selectors with `Select.Root`
  - Error display with `data-error` attribute pattern

### Verification

- [ ] **16. Type check** — `pnpm check` passes with 0 errors
- [ ] **17. Dev test** — `pnpm dev` → navigate to page → verify data loads from RxDB
- [ ] **18. Create test** — create entity → verify instant UI update → verify Neon has the row
- [ ] **19. Update test** — edit entity → verify optimistic update → verify Neon updated
- [ ] **20. Delete test** — delete entity → verify disappears → verify `deleted_at` set in Neon
- [ ] **21. Resync test** — modify row directly in Neon SQL → refresh page → verify RxDB picks up change

---

## Type Mapping Reference

| Drizzle (Server) | Transform | RxDB Schema | Notes |
|---|---|---|---|
| `serial('id')` | `sid(row.id)` → `"42"` | `{ type: 'string', maxLength: 20 }` | Always string in RxDB |
| `integer('fk_id').notNull()` | `sid(row.fkId)` | `{ type: 'string', maxLength: 20 }` | FK coerced to string |
| `integer('fk_id')` (nullable) | `row.fkId != null ? sid(row.fkId) : null` | `{ type: ['string', 'null'] }` | Cannot index nullable |
| `text('name').notNull()` | `row.name` | `{ type: 'string', maxLength: 200 }` | maxLength if indexed |
| `text('notes')` (nullable) | `row.notes ?? null` | `{ type: ['string', 'null'] }` | |
| `integer('count').notNull()` | `row.count` | `{ type: 'number', minimum: 0, maximum: 9999, multipleOf: 1 }` | min/max/multipleOf if indexed |
| `decimal('amount', {10,2})` | `row.amount` (already string from Drizzle) | `{ type: 'string' }` | Decimals are strings! |
| `boolean('active')` | `row.isActive ?? null` | `{ type: ['boolean', 'null'] }` | |
| `jsonb('data')` | `row.data ?? null` | `{ type: ['object', 'null'] }` | |
| `timestamp('created_at')` | `ts(row.createdAt)` → ISO string | `{ type: ['string', 'null'] }` | Never indexed |
| `pgEnum('status', [...])` | `row.status` | `{ type: 'string', maxLength: 20 }` | Can index if required+maxLength |

---

## Eager vs Lazy Decision

| Use EAGER when... | Use LAZY when... |
|---|---|
| Data needed on most pages | Data only needed on one feature page |
| Used in client-side joins by other collections | Standalone, no dependents |
| Small dataset (< 500 rows typical) | Could be large or rarely accessed |
| Structural data (properties, floors, units) | Feature data (expenses, budgets, floor plans) |

**EAGER** collections sync on every startup (11 currently).
**LAZY** collections sync only when their store is first accessed (4 currently).

---

## Common Gotchas

### 1. `col()` vs `col0()` — Version Mismatch
- Existing collections at `version: 1` use `col()` with `IDENTITY_MIGRATION`
- New collections at `version: 0` use `col0()` with `migrationStrategies: {}`
- Using `col()` on a v0 schema will throw an RxDB error about missing migration strategy

### 2. Indexed Nullable Field — SC36/DXE1 Error
```
// WRONG — will throw SC36
properties: {
  deleted_at: { type: ['string', 'null'] }  // nullable
},
indexes: ['deleted_at']  // ← ERROR: can't index nullable

// CORRECT — don't index nullable fields
indexes: ['status', 'floor_id']  // only required, scalar fields
```

### 3. Decimal Columns Return Strings
```typescript
// Drizzle decimal(10,2) returns "1234.56" (string), not 1234.56 (number)
// In RxDB schema: { type: 'string' }
// In UI: Number(row.amount) or parseFloat(row.amount)
// When writing to Drizzle: String(amount)
```

### 4. Form Data ID for Creates
```typescript
// Server MUST return the new ID so client can optimistic-write with real ID:
const [inserted] = await db.insert(table).values({...}).returning({ id: table.id });
form.data.id = inserted.id;  // ← critical
return { form };
```

### 5. Optimistic Lock for Updates
```typescript
// FloorForm sends hidden field: <input type="hidden" name="_updated_at" value={updatedAt} />
// Server extracts with extractLockTimestamp() and passes to optimisticLockUpdate()
// If another user modified the row → 409 conflict → client rolls back
```

### 6. Checkpoint Microsecond Precision
The pull endpoint preserves PostgreSQL microsecond timestamps via `to_char()`.
If you use `new Date().toISOString()` (millisecond precision) as a checkpoint,
it can cause infinite re-pull loops. The pull endpoint handles this correctly —
don't change the `_rawUpdatedAt` logic.

### 7. Health Endpoint Must Include New Tables
If you add a table but forget to add it to the health endpoint's `UNION ALL`,
the `maxUpdatedAt` comparison may skip pulls when your new table has newer data.

---

## File Checklist Template

Copy-paste for your PR description:

```
### Files Modified
- [ ] `src/lib/server/schema.ts` — enum + table
- [ ] `src/lib/server/transforms.ts` — transform function
- [ ] `src/lib/db/schemas.ts` — RxDB schema
- [ ] `src/lib/db/index.ts` — collection registration
- [ ] `src/lib/db/replication.ts` — EAGER/LAZY + deps
- [ ] `src/lib/stores/collections.svelte.ts` — reactive store
- [ ] `src/routes/api/rxdb/pull/[collection]/+server.ts` — pull endpoint
- [ ] `src/routes/api/rxdb/health/+server.ts` — health check query

### Files Created
- [ ] `scripts/migrate/add-{entity}.sql` — Neon migration
- [ ] `src/lib/db/optimistic-{entity}.ts` — optimistic writes
- [ ] `src/routes/{route}/formSchema.ts` — Zod schema
- [ ] `src/routes/{route}/+page.server.ts` — load + actions
- [ ] `src/routes/{route}/+page.svelte` — page component
- [ ] `src/routes/{route}/EntityForm.svelte` — form component
```
