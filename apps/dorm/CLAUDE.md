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
- Optimistic locking: `src/lib/server/optimistic-lock.ts` — extracts `_updated_at` from FormData, returns `{ conflict: true }` for 409s

**Client (RxDB):**
- Setup: `src/lib/db/index.ts` — singleton on `globalThis`, Dexie storage
- Schemas: `src/lib/db/schemas.ts` — 15 collections mirroring server tables (all at schema version 1)
- Collections: tenants, leases, lease_tenants, rental_units, properties, floors, meters, readings, billings, payments, payment_allocations, expenses, budgets, penalty_configs, floor_layout_items
- Cleanup config: `minimumDeletedTime: Infinity, autoStart: false` (prevents crashes on HMR)
- Nullable fields CANNOT be indexed per RxDB/Dexie constraints (SC36/DXE1)

### Replication (Pull-Only)

- `src/lib/db/replication.ts` — checkpoint-based pull from `/api/rxdb/pull/[collection]`
- Checkpoint: `updated_at + id` for pagination
- `resyncCollection(name)` / `resyncAll()` for manual invalidation after server mutations
- Returns `ResyncResult` type: `{ status: 'ok' | 'skipped' | 'partial', reason?, synced, skipped }`

**Eager vs. Lazy Collections (W7):**
- **Eager** (sync on startup): properties, floors, rental_units, tenants, leases, lease_tenants, meters, readings, billings, payments, payment_allocations
- **Lazy** (sync on first page access): expenses, budgets, penalty_configs, floor_layout_items

**Collection Dependency Map (W8):** Replication respects parent→child ordering:
```
floors → [properties]
rental_units → [properties, floors]
meters → [rental_units]
leases → [rental_units]
lease_tenants → [leases, tenants]
readings → [meters]
billings → [leases]
payments → [leases]
payment_allocations → [payments, billings]
floor_layout_items → [floors, rental_units]
```

**Optimizations:**
- Server `maxUpdatedAt` preflight health check (B1) — skips all pulls if data unchanged
- Cache < 5 min old bypasses health check entirely (W10)
- Checkpoint integrity validation (B1) — detects and resets checkpoints ahead of server
- `persistServerTs()` — localStorage persists `LAST_SYNC_TIME_KEY` and `LAST_SERVER_TS_KEY`
- Pause/resume sync (C1) — user-controllable via SyncDetailModal
- `reconcile()` — validates collection counts against server health endpoint
- `refreshLocalCounts()` — manually updates doc counts without network call

### Optimistic Updates

11 dedicated modules in `src/lib/db/optimistic-*.ts`:

| Module | Entity |
|--------|--------|
| `optimistic.ts` | tenants (core) |
| `optimistic-leases.ts` | leases |
| `optimistic-payments.ts` | payments |
| `optimistic-meters.ts` | meters |
| `optimistic-utility-billings.ts` | billings/readings |
| `optimistic-rental-units.ts` | rental units |
| `optimistic-floors.ts` | floors |
| `optimistic-properties.ts` | properties |
| `optimistic-budgets.ts` | budgets |
| `optimistic-expenses.ts` | expenses |
| `optimistic-transactions.ts` | transactions |
| `optimistic-floor-layout.ts` | floor layout items (with wall integrity protection) |

Each module exports `optimisticUpsert*()` and `optimisticDelete*()` functions that:
1. Snapshot existing doc for rollback
2. Immediately write to RxDB
3. Return a rollback function
4. Trigger background resync via `bgResync()` after server confirms

**Optimistic Utilities (`optimistic-utils.ts`):**
- `CONFLICT_MESSAGE` — standard 409 conflict message for users
- `isConflictResult()` — checks if action result is a 409 conflict
- `bgResync()` — debounced (500ms) background resync with offline queueing, mutation queue coordination, and wall integrity protection
- `bufferedMutation()` — generic mutation handler for all form modals (wraps optimistic write + server action + resync)
- `safeGetCollection()` — timeout-safe collection getter (5s max)
- Wall snapshot/restore for `floor_layout_items` to prevent accidental deletion during resync

### Data Pruning & Storage

**Pruning (`src/lib/db/pruning.ts`):**
- 12-month retention for historical collections (readings, payments, billings, expenses, payment_allocations)
- 90-day soft-delete tombstone sweep
- `cleanup(0)` after every bulk removal to flush RxDB internal tombstones (D5)
- Only affects local IndexedDB — server retains all data

**Storage Monitor (`src/lib/db/storage-monitor.ts`):**
- `checkStorageUsage()` — queries Storage API for quota status
- `getStorageTrend()` — tracks storage growth across 10 readings
- `checkAndAutoPrune()` — auto-prunes at critical threshold (95%)
- WARNING threshold at 80%, CRITICAL at 95%

### Server Transforms (`src/lib/server/transforms.ts`)

Centralized camelCase → snake_case mappings for all 15 RxDB collections:
- `transformTenant()`, `transformLease()`, `transformPayment()`, etc.
- Enforces string coercion for IDs (`sid()`), timestamp serialization (`ts()`)
- Field-by-field mapping ensures contract between pull endpoint & RxDB schemas

### Drizzle Type Gotcha

`decimal()` columns return **strings**, not numbers. When writing to Drizzle:
- Amounts: `String(number)` for inserts/updates
- Timestamps: `new Date(string)` for timestamp columns
- Reading back: `Number(row.amount)` or `parseFloat(row.amount)`

## Authentication

- **Better Auth** configured in `src/lib/server/auth.ts`
- **Hook chain** in `src/hooks.server.ts`: `betterAuthHandle` → `securityHeadersHandle` → `authGuard`
- **Auth cache**: 5-minute TTL per userId to avoid 2 Neon round-trips per navigation; skips DB query if no session cookie present
- **Session cookie**: `better-auth.session_token`
- **Dev bypass**: `dev_role` cookie for quick role switching in development (`src/lib/server/dev-bypass.ts`)
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

### Mutation Queue (`src/lib/stores/mutation-queue.svelte.ts`)

Central FIFO queue for offline-first buffered writes:
- Per-mutation: label, collection, type (`'create'|'update'|'delete'`), status (`'queued'|'syncing'|'confirmed'|'failed'`)
- `enqueue()` — adds and auto-processes
- `retry()` — requeues failed mutations
- Auto-removes confirmed items after 15s
- Offline-aware: pauses when `navigator.onLine = false`, resumes on `'online'` event
- Prevents resync while mutations still pending (optimistic consistency)

### Sync Status (`src/lib/stores/sync-status.svelte.ts`)

Comprehensive sync tracking:
- **Per-collection**: name, status, docCount, lastSyncedAt, error, parsedError
- **Global phase**: `'idle' | 'initializing' | 'syncing' | 'complete' | 'error'`
- **Flow direction**: `'pull' | 'push' | 'idle' | 'error'` (Neon ↔ IndexedDB)
- **Service health**: `'unknown' | 'checking' | 'ok' | 'error'`
- **Parsed errors**: RxDB diagnostic codes (VD2, SC34, DB9, etc.) with docs links
- **Status log**: 100 entries max, localStorage-persisted (level: info/success/error/warn)
- **Neon interaction tracking**: pull/push/health interactions with latency, bytes, doc counts
- **Helpers**: `isFresh()`, `isStale()` for clock-skew-safe age checks

### Sync UI Components (`src/lib/components/sync/`)

- `SyncIndicator.svelte` — status bar indicator
- `SyncDetailModal.svelte` — full diagnostic modal:
  - Collections grouped by category (Structure | Tenants & Leases | Utilities | Finance)
  - Per-collection retry buttons with loading state
  - "Retry All Failed" bulk action
  - Error deduplication by error code with RxDB docs links
  - Pause/Resume sync controls
  - Storage usage trend (growing/stable/shrinking)
  - Neon interaction history
  - Manual `refreshLocalCounts()` button

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
| `/payment-history` | Payment history with allocations (formerly /transactions) |
| `/expenses` | Expense tracking |
| `/budgets` | Budget management |
| `/penalties` | Late payment penalties |
| `/reports`, `/lease-report` | Reporting |
| `/insights` | Analytics dashboard |
| `/api/rxdb/pull/[collection]` | RxDB replication endpoint |
| `/api/rxdb/health` | Sync health check |
| `/api/auth/[...all]` | Better Auth API routes |
| `/api/automation/apply` | Lightweight write endpoint for client-detected automation |

## Client-Side Automation (`src/lib/db/client-automation.ts`)

Runs once after sync completes on app open. Detects issues from local RxDB data and sends lightweight writes to `/api/automation/apply`:

- **Overdue detection**: billings past due date still PENDING/PARTIAL → marks OVERDUE
- **Penalty calculation**: applies penalties based on `penalty_configs` (grace period, compound, max cap)
- **Reminders**: billings due within 3 days + leases expiring within 30 days → creates notification records
- **Idempotent**: server endpoint checks current status before writing (safe for concurrent tabs)
- **Once per session**: guard via `globalThis.__dorm_automation_ran` (can be reset for manual re-run from insights page)
- **No tombstone cleanup needed server-side**: client-side `pruning.ts` handles local IndexedDB; server soft-deleted records are invisible to all queries via `deleted_at` filter

## Testing

- `src/lib/db/contract.test.ts` — validates API response shapes match RxDB schemas
- `src/lib/db/integration.test.ts` — end-to-end sync scenarios
- `src/lib/db/replication.test.ts` — replication edge cases
- `src/lib/db/sync-collections.test.ts` — collection dependency ordering
- `src/lib/db/sync-counts.test.ts` — count validation against server
- `src/lib/db/floor-layout-sync.test.ts` — floor layout item resync integrity

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

### Buffered Mutation Pattern

```typescript
// Standard pattern for all form modals — wraps optimistic + server + resync
import { bufferedMutation } from '$lib/db/optimistic-utils';

await bufferedMutation({
  label: 'Update tenant',
  collection: 'tenants',
  type: 'update',
  optimistic: () => optimisticUpsertTenant(data),
  serverAction: () => submitForm(),
  onConflict: () => toast.error(CONFLICT_MESSAGE)
});
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
- **Soft-delete uniformity**: all collections use `deleted_at` field, filtered with `{ $eq: null }` in RxDB queries
- **ID coercion**: all Drizzle numeric IDs coerced to strings for RxDB via `sid()` in transforms
- **Wall integrity**: floor_layout_items resync snapshots WALL items before pull and restores any lost walls after
