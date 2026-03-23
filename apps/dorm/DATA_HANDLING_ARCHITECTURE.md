# Dorm Data Handling Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        SVELTE 5 UI LAYER                         │  │
│  │                                                                  │  │
│  │  +page.svelte                                                    │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────────┐     │  │
│  │  │  {#each store   │    │  FormModal.svelte                │     │  │
│  │  │   .value as x}  │    │  ┌────────────────────────────┐  │     │  │
│  │  │                 │    │  │ use:enhance(() => {         │  │     │  │
│  │  │  Reads from ▼   │    │  │   savedFormData = {...}     │  │     │  │
│  │  │  RxDB stores    │    │  │   onOpenChange(false)  ◄────┼──┼─ Eager close
│  │  │  (reactive)     │    │  │   if (editMode)             │  │     │  │
│  │  └────────┬────────┘    │  │     optimisticUpsert() ──┐  │  │     │  │
│  │           │             │  │   return onResult(r) {   │  │  │     │  │
│  │           │             │  │     if (create)          │  │  │     │  │
│  │           │             │  │       optimisticUpsert() ─┤  │  │     │  │
│  │           │             │  │     bgResync()           │  │  │     │  │
│  │           │             │  │   }                      │  │  │     │  │
│  │           │             │  └──────────────────────────┼─┘  │     │  │
│  │           │             └───────────────┬─────────────┼────┘     │  │
│  └───────────┼─────────────────────────────┼─────────────┼──────────┘  │
│              │                             │             │             │
│              │ subscribes ($)              │ POST        │             │
│              │                             │ form        │ upsert()    │
│              ▼                             │ action      ▼             │
│  ┌───────────────────────┐                 │  ┌─────────────────────┐  │
│  │   RxDB Reactive       │                 │  │  Optimistic Write   │  │
│  │   Stores              │                 │  │  Functions          │  │
│  │   (rx.svelte.ts)      │                 │  │                     │  │
│  │                       │ auto-updates    │  │  optimisticUpsert   │  │
│  │  createRxStore(name,  │◄────────────────┼──│   Tenant()          │  │
│  │    db => db.X.find({  │                 │  │   Floor()           │  │
│  │      selector: {      │                 │  │   Meter()           │  │
│  │        deleted_at:    │                 │  │   RentalUnit()      │  │
│  │          {$eq: null}  │                 │  │   Property()        │  │
│  │      }                │                 │  │   Lease()           │  │
│  │    })                 │                 │  │   Expense()         │  │
│  │  )                    │                 │  │   Budget()          │  │
│  │                       │                 │  │                     │  │
│  │  .value → T[]         │                 │  │  optimisticDelete   │  │
│  │  .initialized → bool  │                 │  │   Tenant/Floor/etc  │  │
│  └───────────┬───────────┘                 │  │   (soft-delete:     │  │
│              │                             │  │    deleted_at=now)  │  │
│              │ query.$.subscribe()         │  │                     │  │
│              │                             │  │  → db.X.upsert({}) │  │
│              ▼                             │  │  → bgResync()      │  │
│  ┌───────────────────────┐                 │  └────────┬────────────┘  │
│  │   RxDB 16             │                 │           │               │
│  │   (Dexie/IndexedDB)   │                 │           │ bgResync()    │
│  │                       │                 │           │ (debounced    │
│  │  14 collections:      │                 │           │  500ms)       │
│  │  tenants, leases,     │◄────────────────┼───────────┘               │
│  │  lease_tenants,       │  writes locally │                           │
│  │  rental_units,        │                 │                           │
│  │  properties, floors,  │                 │                           │
│  │  meters, readings,    │                 │                           │
│  │  billings, payments,  │                 │                           │
│  │  payment_allocations, │                 │                           │
│  │  expenses, budgets,   │                 │                           │
│  │  penalty_configs      │                 │                           │
│  │                       │                 │                           │
│  │  PK: string (coerced) │                 │                           │
│  │  Decimals: string     │                 │                           │
│  │  Schema version: 1    │                 │                           │
│  └───────────┬───────────┘                 │                           │
│              │                             │                           │
│              │ replication pull            │                           │
│              │ (checkpoint-based)          │                           │
│              ▼                             ▼                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    REPLICATION LAYER (replication.ts)             │  │
│  │                                                                  │  │
│  │  Startup sync strategy:                                          │  │
│  │  ┌──────────────────┐    ┌───────────────────────┐               │  │
│  │  │ EAGER (on boot): │    │ LAZY (on first access):│              │  │
│  │  │ properties       │    │ expenses               │              │  │
│  │  │ floors           │    │ budgets                │              │  │
│  │  │ rental_units     │    │ penalty_configs        │              │  │
│  │  │ tenants          │    └───────────────────────┘               │  │
│  │  │ leases           │                                            │  │
│  │  │ lease_tenants    │    Dependency order:                       │  │
│  │  │ meters           │    properties → floors → rental_units      │  │
│  │  │ readings         │    tenants ──┐                             │  │
│  │  │ billings         │    leases ───┼→ lease_tenants              │  │
│  │  │ payments         │    meters → readings                       │  │
│  │  │ payment_allocs   │    leases → billings → payment_allocs     │  │
│  │  └──────────────────┘                                            │  │
│  │                                                                  │  │
│  │  Pull mechanics:                                                 │  │
│  │  - Checkpoint = updated_at + id                                  │  │
│  │  - Batch size: 200 rows                                          │  │
│  │  - Retry: 5s                                                     │  │
│  │  - Dedup via in-flight promise map                               │  │
│  │  - Neon-down circuit breaker                                     │  │
│  │  - Offline detection → deferred resync                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    ═══════════════════════════════════
                         HTTP (SvelteKit server)
                    ═══════════════════════════════════
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SVELTEKIT SERVER                                 │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  FORM ACTIONS (+page.server.ts)                                   │ │
│  │                                                                   │ │
│  │  Pattern per entity:                                              │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │ create: async ({ request }) => {                            │  │ │
│  │  │   form = superValidate(request, zod(schema))               │  │ │
│  │  │   result = db.insert(table).values({...}).returning()      │  │ │
│  │  │   form.data.id = result[0].id  ◄── normalize ID on form   │  │ │
│  │  │   return { form, entity: result[0] }                       │  │ │
│  │  │ }                                                          │  │ │
│  │  │                                                            │  │ │
│  │  │ update: async ({ request }) => {                           │  │ │
│  │  │   form = superValidate(request, zod(schema))               │  │ │
│  │  │   db.update(table).set({...}).where(eq(id)).returning()    │  │ │
│  │  │   ⚠ NO id in .set() — only in .where()                    │  │ │
│  │  │   return { form, success: true }                           │  │ │
│  │  │ }                                                          │  │ │
│  │  │                                                            │  │ │
│  │  │ delete: async ({ request }) => {                           │  │ │
│  │  │   db.update(table).set({ deletedAt: new Date() })         │  │ │
│  │  │   return { success: true }                                 │  │ │
│  │  │ }                                                          │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  PULL API (/api/rxdb/pull/[collection])                           │ │
│  │                                                                   │ │
│  │  GET ?updatedAt=...&id=...&limit=200                              │ │
│  │                                                                   │ │
│  │  1. Validate collection name against allowlist                    │ │
│  │  2. Query Drizzle: WHERE updated_at > checkpoint                  │ │
│  │     ORDER BY updated_at ASC, id ASC  LIMIT 200                    │ │
│  │  3. Transform row → snake_case (transformTenant, etc.)            │ │
│  │  4. Return { documents, checkpoint: { updatedAt, id } }          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  HEALTH (/api/rxdb/health)                                        │ │
│  │  Returns max(updated_at) per collection for warm-start skip       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    ═══════════════════════════════════
                         Neon HTTP driver
                    ═══════════════════════════════════
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEON POSTGRESQL (Source of Truth)                     │
│                                                                        │
│  32 tables (Drizzle ORM schema)                                        │
│  25 pgEnums                                                            │
│  Soft-delete: deleted_at timestamp                                     │
│  Decimals stored as numeric → returned as strings by Drizzle           │
│  Serial IDs (integer PKs)                                              │
│                                                                        │
│  Auth subset: 4 tables (Better Auth) — lightweight for CF Workers      │
│  Full schema: lazy-loaded after auth check                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Write Path (Mutation Flow)

```
User clicks "Save"
       │
       ▼
  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │ 1. CAPTURE   │     │ 2. EAGER CLOSE   │     │ 3. OPTIMISTIC   │
  │ savedFormData│────▶│ Modal closes     │────▶│ WRITE (edits)   │
  │ = {...form}  │     │ toast.info(...)  │     │ db.X.upsert({}) │
  └──────────────┘     └──────────────────┘     │ (known ID)      │
                                                 └────────┬────────┘
                                                          │
       ┌──────────────────────────────────────────────────┘
       ▼
  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │ 4. FORM POST │     │ 5. SERVER ACTION │     │ 6. onResult     │
  │ to SvelteKit│────▶│ Drizzle insert/  │────▶│ serverData?.id  │
  │ form action  │     │ update + return  │     │ ?? leaseResult  │
  └──────────────┘     │ .returning()     │     │ ?? saved ID     │
                       └──────────────────┘     └────────┬────────┘
                                                          │
       ┌──────────────────────────────────────────────────┘
       ▼
  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │ 7. OPTIMISTIC│     │ 8. bgResync()   │     │ 9. RECONCILE    │
  │ WRITE (new)  │────▶│ (debounced      │────▶│ Pull from Neon  │
  │ With real ID │     │  500ms)          │     │ Overwrite RxDB  │
  │ from server  │     │                  │     │ with truth       │
  └──────────────┘     └──────────────────┘     └─────────────────┘
```

## Read Path

```
  ┌────────────────┐     ┌──────────────────┐     ┌─────────────────┐
  │ NEON (truth)    │     │ /api/rxdb/pull/  │     │ RxDB (local)    │
  │                │────▶│ [collection]     │────▶│ IndexedDB       │
  │ 32 tables      │     │ checkpoint pull  │     │ 14 collections  │
  │ camelCase cols  │     │ transform → snake│     │ snake_case      │
  └────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                   query.$.subscribe()
                                                           │
                                                           ▼
                                               ┌──────────────────────┐
                                               │ createRxStore()      │
                                               │ .value → T[]         │
                                               │ .initialized → bool  │
                                               │                      │
                                               │ selector:            │
                                               │  deleted_at: null    │
                                               └──────────┬───────────┘
                                                          │
                                                  $derived.by(() => {
                                                    Map lookups for
                                                    client-side joins
                                                  })
                                                          │
                                                          ▼
                                                    ┌──────────┐
                                                    │ UI render │
                                                    └──────────┘
```

## Entity Maturity Matrix

```
                    ┌──────────┬───────────┬───────────┬──────────┐
                    │ Server   │ onResult  │ Optimistic│ RxDB     │
  Entity            │ .return  │ + capture │ Upsert    │ Store    │
                    │ + ID set │ pattern   │ + Delete  │ filter   │
  ──────────────────┼──────────┼───────────┼───────────┼──────────┤
  Properties        │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Floors            │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Meters            │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Rental Units      │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Tenants           │    ✓     │   custom  │   ✓ / ✓   │    ✓     │
  Expenses          │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Budgets           │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  Leases            │    ✓     │     ✓     │   ✓ / ✓   │    ✓     │
  ──────────────────┼──────────┼───────────┼───────────┼──────────┤
  Payments          │    ✓     │  resync   │   - / ✓   │    ✓     │
  Transactions      │    ✓     │  resync   │   - / ✓   │    ✓     │
  Penalties         │    ✓     │  resync   │   - / -   │    ✓     │
  Utility-Billings  │    ✓     │  resync   │   - / -   │    ✓     │
                    └──────────┴───────────┴───────────┴──────────┘

  resync = no optimistic write; acceptable for low-frequency entities
```

## Key Architectural Invariants

1. **RxDB is pull-only** — no push replication. All writes go through SvelteKit form actions to Neon, then the client pulls back via checkpoint-based replication. Optimistic writes are a local-only bridge for instant UI feedback.

2. **savedFormData pattern** — SuperForm's `resetForm: true` clears form state *before* `onResult` fires. The snapshot captured in the enhance callback prevents data loss.

3. **Two-phase optimistic write** — for edits, the upsert fires immediately (ID is known). For creates, it waits for `onResult` to get the server-assigned ID. Both paths converge on `bgResync()` to reconcile with truth.

4. **Soft-delete everywhere** — both Neon (`deletedAt` timestamp) and RxDB (`deleted_at` field). RxDB stores filter with `deleted_at: { $eq: null }`. Hard deletes never happen.

5. **String coercion boundary** — Drizzle serial IDs (integers) are coerced to strings at the RxDB boundary. Decimal columns are stored as strings in both Drizzle and RxDB to preserve precision.

6. **Eager vs lazy sync** — 11 structural/core collections sync on startup; 3 low-frequency collections (expenses, budgets, penalty_configs) sync on first store access.

7. **bgResync is always called** — even if the optimistic write succeeds, bgResync fires to reconcile with server truth. This is the safety net that makes eventual consistency work.
