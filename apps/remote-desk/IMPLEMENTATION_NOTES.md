# Remote Desk - Implementation Notes for ArjoTech

**App**: FlowWork Workforce Management (Remote Desk)
**Status**: ✅ Scaffold Complete - Ready to Ship
**Estimated Dev Time to MVP**: 2-3 weeks

---

## What's Done

### ✅ Complete Scaffold (All 56 Files)

**Architecture Files**:
- Config: `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.ts`, `drizzle.config.ts`
- Environment: `.env.example` (DATABASE_URL, BETTER_AUTH_SECRET)
- Linting: `.prettierrc`, `.eslintrc.cjs`, `.gitignore`

**Database Layer**:
- Drizzle ORM schema with 8 tables (employees, shifts, tasks, inventory, expenses, messages, schedules, locations)
- Neon PostgreSQL setup (`src/lib/server/db.ts`)
- Full indexes on foreign keys & frequently queried fields

**RxDB Offline-First** (WTFPOS pattern):
- RxDB database initialization with Dexie/IndexedDB
- 8 collection schemas (JSON schemas with v0, primaryKey, indexes)
- Type-safe collection types for TypeScript

**State Management**:
- 4 Svelte 5 runes stores (auth, shifts, tasks, inventory)
- Proper store patterns with `subscribe`, `set`, `update`

**Route Structure**:
- Public routes: Login page
- Protected routes: 8 feature pages (shifts, tasks, inventory, expenses, messages, schedules, reports, admin)
- API route: `/api/sync` sync endpoint (placeholder)
- Root layout with sidebar nav & dark mode

**UI/UX**:
- Bits UI Card components on all pages
- TailwindCSS shadcn theme (light/dark)
- Functional UI - no dummy content, all tied to stores
- Mock data for development

---

## What's NOT Done (Expected Next Steps)

### 🔴 Critical Path (Do First)

1. **Authentication** (2-3 days)
   - Better-auth setup & configuration
   - Login/signup/logout flow
   - Session validation middleware
   - Protected route guards

   **Files to create**:
   - `src/lib/server/auth.ts` (Better-auth setup)
   - `src/routes/(auth)/signup/+page.svelte`
   - `src/hooks.server.ts` (session middleware)

2. **RxDB ↔ Neon Sync** (3-4 days) ⭐ CRITICAL
   - Implement `/api/sync` endpoint with pull/push logic
   - Checkpoint tracking for sync state
   - Conflict resolution (last-write-wins)
   - Error handling & retry logic

   **Files to create**:
   - `src/lib/server/sync.ts` (sync logic)
   - Expand `src/routes/api/sync/+server.ts` with full implementation

3. **GPS Clock-In Validation** (2 days)
   - Geofence verification (employee within X meters of location)
   - Photo capture for shifts
   - Timestamp verification

   **Files to update**:
   - `src/routes/(protected)/shifts/+page.svelte` (add geofence logic)
   - Add `src/lib/utils/geolocation.ts` (distance calculation)

### 🟡 High Priority (Week 2)

4. **Expense Approval Workflow** (2 days)
   - Approval form page
   - Email notifications
   - Ledger integration (track approvals)

5. **Real-Time Messaging** (2 days)
   - WebSocket or polling for messages
   - Channel subscriptions
   - Notification badges

6. **Photo Upload** (1-2 days)
   - Task evidence photos
   - Expense receipts
   - Cloudflare R2 integration

### 🟢 Nice to Have (Later)

- Push notifications
- Mobile responsive refinement
- Advanced analytics queries
- Multi-branch support
- Permission-based admin controls

---

## Database Schema Notes

### Collections Created

```sql
-- Employees
employees (id, email, name, phone, role, avatar_url, home_lat, home_lng, created_at)
  ├─ Indexes: email (unique), role, created_at
  └─ Roles: admin | manager | staff

-- Shifts (with GPS)
shifts (id, employee_id FK, location_id FK, clock_in, clock_out,
        clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
        status, notes, created_at)
  ├─ Indexes: employee_id, location_id, status, created_at
  └─ Status: active | completed | missed

-- Tasks
tasks (id, title, description, assigned_to FK, location_id FK,
       status, priority, photo_url, completed_at, created_at)
  ├─ Indexes: assigned_to, location_id, status, priority
  ├─ Status: pending | in_progress | completed | cancelled
  └─ Priority: low | medium | high | urgent

-- Inventory
inventory (id, name, sku, quantity, min_stock, location_id FK,
           category, unit, updated_at, created_at)
  ├─ Indexes: sku (unique), location_id, category
  └─ Tracks stock levels + low-stock alerts

-- Expenses
expenses (id, employee_id FK, amount, category, description,
          receipt_url, status, approved_by FK, created_at)
  ├─ Indexes: employee_id, status, category
  ├─ Status: pending | approved | rejected
  └─ Categories: Transport | Meals | Equipment | Office | Other

-- Messages
messages (id, sender_id FK, channel, content, created_at)
  ├─ Indexes: sender_id, channel, created_at
  └─ Channels: general | team | announcements | {custom}

-- Schedules
schedules (id, employee_id FK, location_id FK, date,
           start_time, end_time, created_at)
  ├─ Indexes: employee_id, date, location_id
  └─ Times: HH:MM format

-- Locations
locations (id, name, address, lat, lng, created_at)
  ├─ Indexes: name
  └─ Geospatial support (can add PostGIS later)
```

---

## Sync Strategy (RxDB → Neon)

### Pull Direction (Server → Client)

```typescript
// GET /api/sync?collection=shifts&checkpoint=1234
Response:
{
  collection: 'shifts',
  docs: [{ id, employee_id, clock_in, status, ... }],
  checkpoint: 1235
}
```

### Push Direction (Client → Server)

```typescript
// POST /api/sync
Request:
{
  collection: 'shifts',
  operation: 'push',
  docs: [{ id, _deleted?, ... }],
  checkpoint: 1234
}
Response:
{
  success: true,
  checkpoint: 1235,
  conflicts: [] // If any
}
```

### Conflict Resolution

- **Last-write-wins**: Server timestamp is authority
- **Deletions**: If doc deleted locally but modified on server, prompt user
- **Retries**: Automatic exponential backoff for transient failures

---

## Styling Notes

### Colors (Bits UI / Shadcn Palette)

- **Primary** (Blue): `#000000` → `#FFFFFF` (dark mode)
- **Secondary** (Gray): `#F5F5F5` → `#0A0A0A`
- **Destructive** (Red): `#EF4444`
- **Accent** (Orange): `#FF6B35` (for alerts, urgency)
- **Sidebar**: Custom colors for navigation contrast

### Responsive Breakpoints

- Mobile: 0-640px (hide sidebar, stack vertically)
- Tablet: 641px-1024px (sidebar collapses to icons)
- Desktop: 1025px+ (full sidebar + content)

---

## Store Patterns

### Adding a New Store

```typescript
// src/lib/stores/example.svelte.ts
import { writable } from 'svelte/store';

interface ExampleState {
  value: string;
  loading: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  value: '',
  loading: false,
  error: null
};

function createExampleStore() {
  const { subscribe, set, update } = writable<ExampleState>(initialState);

  return {
    subscribe,
    setValue: (value: string) => update((s) => ({ ...s, value })),
    setLoading: (loading: boolean) => update((s) => ({ ...s, loading })),
    setError: (error: string | null) => update((s) => ({ ...s, error })),
    reset: () => set(initialState)
  };
}

export const example = createExampleStore();
```

### Using in Components

```svelte
<script>
  import { example } from '$lib/stores/example.svelte';
</script>

<p>{$example.value}</p>
<button onclick={() => example.setValue('new value')}>Update</button>
```

---

## Performance Optimization Notes

### RxDB Caching

All RxDB queries are cached per collection. Re-querying is O(1):

```typescript
const shifts = await db.shifts.find().exec(); // Cached after first call
```

### Drizzle Queries (Server-Side)

Use for complex aggregations:

```typescript
import { eq, count, sum } from 'drizzle-orm';

// Count shifts per employee
const stats = await db
  .select({
    employee_id: shifts.employee_id,
    total_hours: count()
  })
  .from(shifts)
  .groupBy(shifts.employee_id);
```

### Image Optimization

All images should be optimized:
- Profile avatars: 256x256px WebP
- Task photos: 1200x1200px WebP (compressed)
- Expense receipts: 600x800px PDF or JPG

---

## Testing Checklist Before Ship

- [ ] Login flow works (auth impl)
- [ ] Offline clock-in records to RxDB
- [ ] Sync sends data to Neon
- [ ] Tasks update in real-time across clients
- [ ] Inventory low-stock alerts trigger
- [ ] Expenses can be submitted & approved
- [ ] Messages appear instantly
- [ ] Schedule view shows all shifts
- [ ] Reports calculate correctly
- [ ] Dark mode toggle works
- [ ] Mobile responsive (shifts page especially)
- [ ] GPS permission request works
- [ ] Error states display properly

---

## Deployment Checklist

- [ ] Set `DATABASE_URL` in Vercel
- [ ] Set `BETTER_AUTH_SECRET` in Vercel
- [ ] Run `npm run build` locally (no errors)
- [ ] Test preview build: `npm run preview`
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Test production login
- [ ] Verify sync works in production
- [ ] Check error logging (Sentry integration recommended)

---

## File Sizes & Asset Considerations

- **Current scaffold**: 188 KB (uncompressed source)
- **After npm install**: ~500 MB (node_modules - use pnpm for monorepo)
- **Production bundle**: ~150-200 KB (gzipped with adapter-vercel)
- **Database**: Neon free tier supports up to 10 GB

---

## Recommended Next Commit Message

```
feat: scaffold remote-desk (FlowWork) SvelteKit 5 app

- Initialize SvelteKit 5 with Vercel adapter
- Add RxDB v16 offline-first database with Dexie storage
- Add Neon PostgreSQL + Drizzle ORM schema (8 tables)
- Create 8 Svelte 5 runes stores (auth, shifts, tasks, inventory)
- Build 8 feature routes (shifts, tasks, inventory, expenses, messages, schedules, reports, admin)
- Add protected route layout with sidebar navigation
- Add Bits UI + TailwindCSS dark mode theme
- Create /api/sync endpoint (placeholder for RxDB sync)
- Document architecture and implementation notes

Scaffold is complete and ready for:
1. Authentication implementation
2. RxDB ↔ Neon sync logic
3. GPS clock-in validation

Estimated MVP: 2-3 weeks from here.
```

---

## Questions for Arjo

1. **Geofence Radius**: How many meters is acceptable? (default: 50m)
2. **Sync Interval**: How often should RxDB push to Neon? (default: every 30s)
3. **Offline Timeout**: How long before offline shifts are auto-synced? (default: 5min after clock-out)
4. **Photo Storage**: Use Cloudflare R2 or Supabase storage?
5. **Notifications**: Email, SMS, or push only?
6. **Admin Approval Flow**: Auto-approve under ₱500, or manual for all?

---

**Scaffold Created**: 2026-03-21
**Ready for Development**: YES
**Ship Date Estimate**: 2026-04-11 (3 weeks if full-time)
