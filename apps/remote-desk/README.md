# FlowWork - Remote Desk Workforce Management

A modern workforce management platform built with SvelteKit 5, RxDB for offline-first synchronization, and Neon PostgreSQL for persistent storage.

## Features

- **GPS Clock In/Out** - Record employee locations with timestamps
- **Task Management** - Assign, track, and complete work tasks
- **Inventory Tracking** - Real-time stock level monitoring
- **Expense Reporting** - Submit and approve work expenses
- **Shift Scheduling** - View and manage employee schedules
- **Team Messaging** - Real-time team communication
- **Analytics & Reports** - Performance metrics and insights
- **Admin Dashboard** - System management and configuration
- **Offline-First** - RxDB local-first architecture with automatic sync

## Tech Stack

- **Frontend**: SvelteKit 5, Svelte 5 Runes, Bits UI, TailwindCSS
- **Offline Database**: RxDB v16+ with Dexie/IndexedDB
- **Server Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better-auth (placeholder)
- **Forms**: Sveltekit-superforms with Zod validation
- **Icons**: Lucide-svelte, date-fns

## Project Structure

```
src/
├── app.html              - Root HTML shell
├── app.postcss           - TailwindCSS directives
├── lib/
│   ├── components/       - Reusable UI components
│   ├── stores/          - Svelte 5 runes stores
│   ├── types.ts         - TypeScript type definitions
│   ├── rxdb/            - RxDB database setup
│   │   ├── database.ts  - DB initialization
│   │   ├── types.ts     - RxDB collection types
│   │   └── collections/ - Schema definitions
│   └── server/
│       ├── db.ts        - Drizzle + Neon setup
│       └── schema.ts    - Drizzle schema definitions
└── routes/
    ├── +layout.svelte        - Root layout
    ├── +page.svelte          - Dashboard
    ├── (auth)/               - Public routes
    │   └── login/
    └── (protected)/          - Protected routes
        ├── shifts/           - Clock in/out
        ├── tasks/            - Task management
        ├── inventory/        - Stock tracking
        ├── expenses/         - Expense reports
        ├── messages/         - Team chat
        ├── schedules/        - Shift scheduling
        ├── reports/          - Analytics
        └── admin/            - System settings
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (Neon account)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:5174
```

### Development

```bash
npm run dev
```

Opens http://localhost:5174

### Database Setup

```bash
# Generate Drizzle migrations
npm run db:generate

# Push schema to Neon
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Build

```bash
npm run build
npm run preview
```

## RxDB Sync Architecture

FlowWork uses a local-first approach:

1. **Local Writes** - All changes written to RxDB (IndexedDB) first
2. **Background Sync** - Changes automatically pushed to Neon via `/api/sync`
3. **Conflict Resolution** - Server-side merging with last-write-wins
4. **Offline Support** - Full functionality without internet

## API Endpoints

### POST /api/sync

Handles bidirectional RxDB ↔ Neon synchronization.

Request:
```json
{
  "collection": "shifts",
  "operation": "push|pull",
  "data": { ... },
  "checkpoint": 1234
}
```

## Development Patterns

### Creating a New Store

```typescript
// src/lib/stores/example.svelte.ts
import { writable } from 'svelte/store';

function createExampleStore() {
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    action: () => update(state => ({ ...state, updated: true }))
  };
}

export const example = createExampleStore();
```

### Using in Components

```svelte
<script>
  import { example } from '$lib/stores/example.svelte';
</script>

<p>{$example.message}</p>
<button onclick={() => example.action()}>Click me</button>
```

### Adding RxDB Queries

```typescript
const shifts = await db.shifts.find({ employee_id }).exec();
await db.shifts.insert({ id, employee_id, ... });
```

## Roadmap

- [ ] Complete authentication with Better-auth
- [ ] GPS location validation & tracking
- [ ] Real-time RxDB sync with conflict resolution
- [ ] Photo upload for task evidence
- [ ] Push notifications
- [ ] Mobile app variant
- [ ] Advanced analytics & reporting
- [ ] Multi-language support

## Contributing

Follow these patterns:

1. Use SvelteKit 5 with Svelte runes (`let x = $state()`)
2. Type all functions with TypeScript
3. Place UI components in Bits UI when possible
4. Use TailwindCSS utility classes
5. Keep stores in `src/lib/stores`
6. Implement server logic in `src/routes/api`

## License

Proprietary - FlowWork by MidCodes

## Support

For issues or questions, refer to the project documentation or contact the development team.
