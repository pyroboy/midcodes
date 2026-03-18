# CLAUDE.md

This file provides guidance to Claude Code when working with the dorm app.

## Development Commands

- `pnpm dev` — start development server
- `pnpm build` — build for production (Cloudflare)
- `pnpm check` — type-check (svelte-check)
- `pnpm lint` — Prettier + ESLint
- `pnpm format` — auto-format code
- `pnpm test` — run all tests (integration + unit)
- `pnpm test:unit` — Vitest only
- `pnpm test:integration` — Playwright only

## Architecture Overview

SvelteKit dormitory management app with an **offline-first** dual-database architecture.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Svelte 5 + SvelteKit 2, Tailwind CSS 3, shadcn-svelte | UI |
| Client DB | RxDB 16 (Dexie/IndexedDB) | Local cache, offline-first reads |
| Server DB | Neon PostgreSQL + Drizzle ORM | Source of truth |
| Auth | Better Auth 1.4 (email/password, admin plugin) | Sessions, roles, permissions |
| Deployment | Cloudflare Pages (adapter-cloudflare) | Edge runtime |
| Forms | sveltekit-superforms + Zod | Validation |
| Storage | AWS S3 (presigned URLs) | Image uploads |
| Currency | Philippine Peso (PHP) — use `formatCurrency()` from `$lib/utils/format` | |

## Database Architecture

### Dual Database (Server + Client)

**Server (Neon + Drizzle):**
- Schema: `src/lib/server/schema.ts` — 32 tables, 25 pgEnums
- Connection: `src/lib/server/db.ts` — lazy-init Neon HTTP with retry/timeout/circuit-breaker
- Auth schema: `src/lib/server/schema-auth.ts` — lightweight 4-table subset for Better Auth (stays under CF Workers CPU limit)

**Client (RxDB):**
- Setup: `src/lib/db/index.ts` — singleton on `globalThis`, Dexie storage
- Schemas: `src/lib/db/schemas.ts` — 14 collections mirroring server tables
- Collections: tenants, leases, lease_tenants, rental_units, properties, floors, meters, readings, billings, payments, payment_allocations, expenses, budgets, penalty_configs

### Replication (Pull-Only)

- `src/lib/db/replication.ts` — checkpoint-based pull from `/api/rxdb/pull/[collection]`
- Batch size: 200, retry: 5s
- Checkpoint: `updated_at + id` for pagination
- `resyncCollection(name)` / `resyncAll()` for manual invalidation after server mutations

### Optimistic Updates

- `src/lib/db/optimistic.ts` — write to RxDB immediately, resync in background
- Pattern: `optimisticUpsertTenant()`, `optimisticDeleteTenant()` (similar for other entities)
- Soft-delete: sets `deleted_at` timestamp; RxDB queries filter `deleted_at: { $eq: null }`
- If server rejects, `resyncCollection()` reverts the optimistic write

### Drizzle Type Gotcha

`decimal()` columns return **strings**, not numbers. When writing to Drizzle:
- Amounts: `String(number)` for inserts/updates
- Timestamps: `new Date(string)` for timestamp columns
- Reading back: `Number(row.amount)` or `parseFloat(row.amount)`

## Authentication

- **Better Auth** configured in `src/lib/server/auth.ts`
- **Hook chain** in `src/hooks.server.ts`: `betterAuthHandle` → `securityHeadersHandle` → `authGuard`
- **Session cookie**: `better-auth.session_token`
- **Dev bypass**: `dev_role` cookie for quick role switching in development
- **Roles** (from `userRoleEnum`): super_admin, property_admin, property_manager, property_accountant, property_maintenance, property_utility, property_frontdesk, property_tenant, property_guest, etc.
- **Permissions**: string array on `locals.permissions` (e.g., `'tenants.read'`, `'payments.create'`)
- `locals.permissions` is **optional** (`string[] | undefined`) — always use `?.includes()` or guard

## State Management

### RxDB Reactive Stores

Data flows through RxDB stores, not server load functions:

```typescript
// src/lib/stores/rx.svelte.ts
const tenantsStore = createRxStore<any>('tenants',
  (db) => db.tenants.find({ selector: { deleted_at: { $eq: null } }, sort: [{ name: 'asc' }] })
);

// In template: {#each tenantsStore.value as tenant}
// Loading state: {#if !tenantsStore.initialized} → show skeleton
```

Server `+page.server.ts` files now only provide **superforms** for create/update actions. Data loading is client-side via RxDB.

### Enriching RxDB Data (Client-Side Joins)

Pages that need relationships (e.g., tenants with leases) build **Map lookups** for O(1) joins:

```typescript
let enriched = $derived.by(() => {
  const leaseMap = new Map();
  for (const l of leasesStore.value) leaseMap.set(String(l.id), l);
  // ... join via map lookups instead of .find()
});
```

### Sync Status

- `src/lib/stores/sync-status.svelte.ts` — tracks per-collection sync state
- `src/lib/components/sync/SyncIndicator.svelte` — UI indicator

## Route Structure

Each feature route contains:
- `+page.server.ts` — form actions (create/update/delete) + superform init
- `+page.svelte` — main page with RxDB stores for data
- `formSchema.ts` — Zod validation schema
- `types.ts` — TypeScript interfaces
- Component files (modals, forms, tables, cards)

### Routes

| Route | Purpose |
|-------|---------|
| `/auth` | Login/logout/password reset |
| `/properties` | Dormitory properties |
| `/floors` | Building floors and wings |
| `/rental-unit` | Individual rental units |
| `/tenants` | Tenant management |
| `/leases` | Lease agreements |
| `/meters` | Utility meters |
| `/utility-billings` | Meter readings and billing |
| `/utility-input/electricity/[slug]/[date]` | Bulk meter reading entry |
| `/payments` | Payment recording |
| `/transactions` | Financial transactions |
| `/expenses` | Expense tracking |
| `/budgets` | Budget management |
| `/penalties` | Late payment penalties |
| `/reports`, `/lease-report` | Reporting |
| `/insights` | Analytics dashboard |
| `/api/rxdb/pull/[collection]` | RxDB replication endpoint |
| `/api/rxdb/health` | Sync health check |
| `/api/auth/[...all]` | Better Auth API routes |
| `/api/cron` | Automated jobs (penalties, reminders) |

## Key Patterns

### Form Handling

```typescript
// Server: provide superform
export const load = async () => ({
  form: await superValidate(zod(formSchema))
});

// Client: use superform with optimistic writes
const { form, errors, enhance } = superForm(data.form, {
  validators: zodClient(formSchema),
  validationMethod: 'onsubmit',
  invalidateAll: false // don't refetch — RxDB handles it
});

// After server confirms, optimistic write to RxDB
await optimisticUpsertTenant({ id: tenantId, ...formData });
```

### Performance Patterns

- **Search debouncing**: 300ms debounce on search inputs before filtering
- **Pagination**: client-side pagination (e.g., 24 items/page) to cap DOM nodes
- **Single-pass derived**: combine stats + filtering in one loop, not separate `.filter()` calls
- **Map lookups**: use `Map` for O(1) joins instead of nested `.find()` calls
- **Skeleton loading**: show skeletons while `!store.initialized`, then render data
- **No console.log in $derived**: avoid GC pressure in reactive computations

### Image Upload

`src/lib/components/ui/ImageUploadWithCrop.svelte` — deferred upload pattern:
1. User crops image locally (canvas-based)
2. `onCropReady` stores file + preview URL
3. On form submit: upload to `/api/upload-image` first, then submit form with URL

## Important Constraints

- **Cloudflare Workers**: edge runtime with CPU/memory limits. Auth uses lightweight 4-table schema; full 32-table schema lazy-loaded only after auth.
- **RxDB primary keys are strings**: Drizzle serial IDs must be coerced to strings in RxDB schemas
- **`decimal()` → string**: all monetary/numeric Drizzle decimal columns return strings (see Drizzle Type Gotcha above)
- **`permissions` is optional**: always guard with `?.includes()` or `if (!permissions)` check
- **Svelte 5 runes**: use `$state()`, `$derived()`, `$effect()` — not legacy stores
- **Store files**: must use `.svelte.ts` extension for runes reactivity
- **No top-level await** in client modules (Safari WebKit bug #242740)
