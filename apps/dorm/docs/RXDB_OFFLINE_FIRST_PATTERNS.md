# RxDB Offline-First Patterns for SvelteKit

A production-grade reference for building offline-first SvelteKit apps with RxDB. Covers the four pillars that separate a toy implementation from a resilient one: **offline write buffering**, **conflict resolution**, **storage persistence**, and **schema migrations**.

> Derived from real production patterns. Framework-agnostic concepts, SvelteKit-specific examples.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Offline Write Buffering](#1-offline-write-buffering)
3. [Conflict Resolution](#2-conflict-resolution)
4. [Storage Persistence & Recovery](#3-storage-persistence--recovery)
5. [Schema Migrations](#4-schema-migrations)
6. [Replication Architecture](#5-replication-architecture)
7. [Connectivity Detection](#6-connectivity-detection)
8. [Svelte 5 Store Integration](#7-svelte-5-store-integration)
9. [Resilience Patterns](#8-resilience-patterns)
10. [Anti-Patterns](#anti-patterns)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (SvelteKit Client)                                 │
│                                                             │
│  ┌──────────┐    ┌────────────┐    ┌─────────────────────┐  │
│  │ Svelte 5 │◄──►│ Write      │───►│ RxDB (IndexedDB)    │  │
│  │ Stores   │    │ Proxy      │    │ - Local-first reads  │  │
│  │ $state() │    │ (per-doc   │    │ - Push queue         │  │
│  │ $derived()│   │  queue)    │    │ - Schema migrations  │  │
│  └──────────┘    └────────────┘    └──────────┬───────────┘  │
│                                               │              │
│                                    ┌──────────▼───────────┐  │
│                                    │ Replication Engine    │  │
│                                    │ - Push (writes → srv)│  │
│                                    │ - Pull (srv → local) │  │
│                                    │ - SSE live stream     │  │
│                                    │ - Circuit breaker     │  │
│                                    └──────────┬───────────┘  │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                        ┌───────────────────────▼──────────────┐
                        │  Server (SvelteKit API Routes)       │
                        │                                      │
                        │  /api/replication/[collection]/push   │
                        │  /api/replication/[collection]/pull   │
                        │  /api/replication/stream (SSE)        │
                        │                                      │
                        │  ┌──────────────────────────────────┐│
                        │  │ Push Guards (business logic)     ││
                        │  │ - State machine validation       ││
                        │  │ - Duplicate detection            ││
                        │  │ - Auto-heal / merge              ││
                        │  │ - Audit trail                    ││
                        │  └──────────────────────────────────┘│
                        │                                      │
                        │  ┌──────────────────────────────────┐│
                        │  │ Database (PostgreSQL / SQLite)   ││
                        │  │ Source of truth                  ││
                        │  └──────────────────────────────────┘│
                        └──────────────────────────────────────┘
```

**Key principle**: Writes go to local RxDB first, then push to server in the background. Reads come from local RxDB, which stays in sync via pull replication + SSE live updates. The server is the source of truth but is not required for reads or initial writes.

---

## 1. Offline Write Buffering

### The Problem

When a user submits a form while offline (or on flaky WiFi), the write must not be lost. Naive implementations that POST directly to the server will fail silently or show an error.

### The Solution: Write-to-Local + Background Push

```typescript
// write-proxy.ts — mode-aware write abstraction

import { getDb } from './index';
import { getActiveReplication } from './replication';

// Per-document write queue prevents lost updates from concurrent modifications
const writeQueues = new Map<string, Promise<any>>();

function enqueue<T>(docId: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(docId) ?? Promise.resolve();
  const next = prev.then(fn, fn); // run fn even if previous write failed
  writeQueues.set(docId, next);
  next.finally(() => {
    if (writeQueues.get(docId) === next) writeQueues.delete(docId);
  });
  return next;
}

// Debounced resync — coalesces rapid writes (e.g., adding 15 items)
const resyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleResync(collection: string) {
  const existing = resyncTimers.get(collection);
  if (existing) clearTimeout(existing);
  resyncTimers.set(
    collection,
    setTimeout(() => {
      const rep = getActiveReplication(collection);
      if (rep?.reSync) rep.reSync();
    }, 50) // 50ms debounce
  );
}

// Write proxy for a collection
export function createWriteProxy(collectionName: string) {
  return {
    async insert(doc: any) {
      const db = await getDb();
      const result = await db[collectionName].insert(doc);
      scheduleResync(collectionName);
      return result;
    },

    async upsert(doc: any) {
      const db = await getDb();
      const result = await db[collectionName].upsert(doc);
      scheduleResync(collectionName);
      return result;
    },

    async incrementalModify(id: string, mutator: (doc: any) => any) {
      return enqueue(id, async () => {
        const db = await getDb();
        const doc = await db[collectionName].findOne(id).exec();
        if (!doc) throw new Error(`Doc ${id} not found in ${collectionName}`);
        const result = await doc.incrementalModify(mutator);
        scheduleResync(collectionName);
        return result;
      });
    },

    async softDelete(id: string) {
      return this.incrementalModify(id, (doc: any) => {
        doc.deletedAt = new Date().toISOString();
        return doc;
      });
    }
  };
}
```

### Why Per-Document Queuing Matters

Without queuing, rapid concurrent writes to the same document cause lost updates:

```
// WITHOUT queue (broken):
// Thread A reads doc v1, modifies, writes v2
// Thread B reads doc v1 (stale!), modifies, writes v3
// Thread A's changes are lost

// WITH queue (safe):
// Thread A reads doc v1 → writes v2
// Thread B waits → reads doc v2 → writes v3
// Both changes preserved
```

### Thin Client Variant

For devices that don't need offline support (e.g., shared kiosks on LAN), skip local writes entirely:

```typescript
// Thin clients write directly to server, then pull result
export function createServerWriteProxy(collectionName: string) {
  return {
    async insert(doc: any) {
      const res = await fetch(`/api/${collectionName}`, {
        method: 'POST',
        body: JSON.stringify(doc)
      });
      if (!res.ok) throw new Error(`Server write failed: ${res.status}`);
      scheduleResync(collectionName); // pull server state into local RxDB
      return res.json();
    }
  };
}
```

---

## 2. Conflict Resolution

### The Problem

Two devices modify the same record offline. When both sync, whose version wins?

### Strategy: Server Guards + Last-Write-Wins

RxDB's default conflict handler uses `_meta.lwt` (last-write timestamp) for automatic LWW. But LWW alone isn't enough — you need **server-side business logic guards** to prevent invalid states.

### Server-Side Push Guards

```typescript
// +server.ts — push endpoint with business logic guards

import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

interface PushRow {
  newDocumentState: any;
  assumedMasterState: any | null;
}

export async function POST({ request }) {
  const { rows } = await request.json() as { rows: PushRow[] };
  const conflicts: any[] = [];
  const accepted: any[] = [];

  for (const row of rows) {
    const doc = row.newDocumentState;

    // Guard 1: State machine validation
    // Only allow valid transitions (e.g., draft → active → closed)
    const existing = await db.query.items.findFirst({
      where: (t, { eq }) => eq(t.id, doc.id)
    });

    if (existing) {
      const validTransitions: Record<string, string[]> = {
        draft: ['active', 'cancelled'],
        active: ['paused', 'closed', 'cancelled'],
        paused: ['active', 'cancelled'],
        // closed and cancelled are terminal — no transitions allowed
      };

      const allowed = validTransitions[existing.status] ?? [];
      if (doc.status !== existing.status && !allowed.includes(doc.status)) {
        // Log to audit trail
        await db.insert(auditLogs).values({
          type: 'invalid_transition',
          entityId: doc.id,
          description: `Blocked ${existing.status} → ${doc.status}`,
          timestamp: new Date()
        });
        // Return as conflict — client will re-pull server state
        conflicts.push(existing);
        continue;
      }
    }

    // Guard 2: Duplicate detection
    // e.g., prevent two active sessions for the same entity
    if (doc.status === 'active') {
      const duplicate = await db.query.items.findFirst({
        where: (t, { eq, and, ne }) =>
          and(eq(t.groupId, doc.groupId), eq(t.status, 'active'), ne(t.id, doc.id))
      });

      if (duplicate) {
        // Option A: silently drop the duplicate
        // Option B: auto-merge into existing
        // Option C: return as conflict
        conflicts.push(duplicate);
        continue;
      }
    }

    // Guard 3: Auto-heal side effects
    // e.g., when a parent closes, auto-close children
    if (doc.status === 'closed' && existing?.status !== 'closed') {
      await db.update(children)
        .set({ status: 'closed', closedAt: new Date() })
        .where(eq(children.parentId, doc.id));
    }

    accepted.push(doc);
  }

  // Batch upsert accepted docs
  if (accepted.length > 0) {
    await db.insert(items)
      .values(accepted)
      .onConflictDoUpdate({ target: items.id, set: /* ... */ });
  }

  return json({ conflicts });
}
```

### Key Insight: Conflicts Are Not Errors

When a conflict is returned from push, the client does **not** retry. Instead, the next pull cycle fetches the server's authoritative version. This avoids infinite conflict loops.

```
Client A writes doc v2 (offline)
Client B writes doc v3 (offline)
Client A pushes v2 → server accepts (first write wins)
Client B pushes v3 → server returns conflict (v2 exists)
Client B pulls → gets v2 from server → local state updated
```

---

## 3. Storage Persistence & Recovery

### The Problem

IndexedDB can be evicted by the browser under storage pressure. Safari is especially aggressive. If the database is corrupted or evicted, the app must recover gracefully.

### Auto-Recovery Pattern

```typescript
// db/index.ts — database initialization with recovery

import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

const DB_NAME = 'myapp_db';
const MIGRATION_TIMEOUT_MS = 45_000;
const RECOVERABLE_ERRORS = ['COL12', 'DM4', 'DB9', 'SC1', 'SC34', 'UT8'];

let dbPromise: Promise<any> | null = null;
let recoveryAttempted = false;

export function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

async function initDb() {
  // URL escape hatch: ?reset-db=1 forces clean slate
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset-db') === '1') {
      await deleteDatabase();
      window.location.replace(window.location.pathname);
      return new Promise(() => {}); // never resolves — page is reloading
    }
  }

  try {
    return await Promise.race([
      createDatabase(),
      timeout(MIGRATION_TIMEOUT_MS, 'Database migration timed out')
    ]);
  } catch (err: any) {
    // Auto-recovery: delete and retry once per session
    if (!recoveryAttempted && isRecoverableError(err)) {
      recoveryAttempted = true;
      console.warn('RxDB init failed, attempting recovery:', err.code ?? err.message);
      await deleteDatabase();
      return createDatabase();
    }
    throw err;
  }
}

function isRecoverableError(err: any): boolean {
  return RECOVERABLE_ERRORS.some(code =>
    err?.code === code || err?.message?.includes(code)
  );
}

async function deleteDatabase() {
  // Clear RxDB's internal state
  if (typeof indexedDB !== 'undefined') {
    const dbs = await indexedDB.databases?.() ?? [];
    for (const db of dbs) {
      if (db.name?.startsWith(DB_NAME)) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  }
  // Clear sync checkpoints
  localStorage.removeItem('myapp-sync-gen');
}

async function createDatabase() {
  // Choose storage based on device type
  const storage = isThinClient()
    ? getRxStorageMemory()  // thin clients: no persistence needed
    : getRxStorageDexie();  // full clients: IndexedDB via Dexie

  const db = await createRxDatabase({
    name: DB_NAME,
    storage,
    multiInstance: true // BroadcastChannel for multi-tab sync
  });

  await db.addCollections(/* ... */);
  return db;
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}
```

### Multi-Tab Reset Coordination

When one tab resets the database, all tabs must reload:

```typescript
// Broadcast reset across tabs
if (typeof BroadcastChannel !== 'undefined') {
  const channel = new BroadcastChannel('myapp-reset');

  channel.onmessage = (event) => {
    if (event.data === 'RESET') {
      window.location.reload();
    }
  };

  // Call this before deleting the database
  function broadcastReset() {
    channel.postMessage('RESET');
  }
}
```

### Storage Tiers by Device Type

| Device Type | Storage Backend | Rationale |
|-------------|----------------|-----------|
| Primary (server/admin) | Dexie (IndexedDB) | Full persistence, survives restarts |
| Thin client (shared kiosk) | Memory | Fast init, no stale data, no Safari IDB bugs |
| Development | Dexie + reset shortcut | `?reset-db=1` for quick recovery during dev |

---

## 4. Schema Migrations

### The Problem

As your app evolves, collection schemas change. Adding fields, restructuring data, and renaming properties must happen without losing existing user data.

### Sequential Migration Strategies

RxDB requires a `migrationStrategies` object mapping version numbers to transform functions. Migrations run sequentially (v1 → v2 → v3).

```typescript
// schemas.ts — collection with migration history

export const ordersSchema = {
  version: 6,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    status: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          addedAt: { type: 'string' },     // added in v3
          cancelReason: { type: 'string' }, // added in v5
          cancelledAt: { type: ['string', 'null'] } // added in v5
        }
      }
    },
    discountEntries: { type: 'object' },  // added in v4, restructured in v6
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }         // added in v2
  },
  required: ['id', 'status', 'createdAt']
};

export const ordersMigrations = {
  // v1: baseline (no migration needed)

  1: (doc: any) => {
    // v0 → v1: no-op (baseline schema change)
    return doc;
  },

  2: (doc: any) => {
    // v1 → v2: add updatedAt, backfill from createdAt
    doc.updatedAt = doc.updatedAt ?? doc.createdAt;
    return doc;
  },

  3: (doc: any) => {
    // v2 → v3: add addedAt to each item, backfill from order createdAt
    if (Array.isArray(doc.items)) {
      for (const item of doc.items) {
        item.addedAt = item.addedAt ?? doc.createdAt;
      }
    }
    return doc;
  },

  4: (doc: any) => {
    // v3 → v4: add discountEntries object
    doc.discountEntries = doc.discountEntries ?? {};
    return doc;
  },

  5: (doc: any) => {
    // v4 → v5: add cancellation fields to items
    if (Array.isArray(doc.items)) {
      for (const item of doc.items) {
        item.cancelReason = item.cancelReason ?? null;
        item.cancelledAt = item.cancelledAt ?? null;
      }
    }
    return doc;
  },

  6: (doc: any) => {
    // v5 → v6: restructure discount entries
    // Old: { "SC": { count: 2 } }
    // New: { "SC": { count: 2, names: [], tins: [] } }
    if (doc.discountEntries && typeof doc.discountEntries === 'object') {
      for (const key of Object.keys(doc.discountEntries)) {
        const entry = doc.discountEntries[key];
        if (entry && typeof entry === 'object') {
          entry.names = entry.names ?? [];
          entry.tins = entry.tins ?? [];
        }
      }
    }
    return doc;
  }
};
```

### Wiring Migrations to Collections

```typescript
// db/index.ts — addCollections with migrationStrategies

await db.addCollections({
  orders: {
    schema: ordersSchema,
    migrationStrategies: ordersMigrations
  },
  // ...other collections
});
```

### Migration Rules

1. **Always increment `version`** when changing the schema shape
2. **Never modify an existing migration** — add a new version instead
3. **Backfill with sensible defaults** — use `?? fallbackValue`, not hard-coded constants
4. **Keep migrations pure** — `(oldDoc) => newDoc`, no side effects, no async
5. **Test migrations** — feed an old doc through all migration steps, assert output
6. **No-op migrations are fine** — sometimes you just bump the version for index changes

### Primary Key Changes (Advanced)

When you need to change a document's primary key (e.g., switching to a composite key):

```typescript
// v3 → v4: change PK from stockItemId to composite
4: (doc: any) => {
  // Derive new composite ID
  const locationId = doc.locationId ?? 'default';
  const date = doc.date ?? new Date().toISOString().slice(0, 10);
  doc.id = `${doc.stockItemId}-${locationId}-${date}`;
  return doc;
}
```

> **Warning**: PK changes force RxDB to delete and re-insert every document. This is slow for large collections. Schedule these for off-peak hours if possible.

---

## 5. Replication Architecture

### Push + Pull + Live Stream

```typescript
// replication.ts — hybrid replication setup

import { replicateRxCollection } from 'rxdb/plugins/replication';

// Generation counter: bump to force full resync after server restart
function getSyncGeneration(): number {
  return parseInt(localStorage.getItem('myapp-sync-gen') ?? '0', 10);
}

function bumpGeneration(): void {
  const next = getSyncGeneration() + 1;
  localStorage.setItem('myapp-sync-gen', String(next));
}

export function setupReplication(db: any, collectionName: string) {
  const gen = getSyncGeneration();

  const replication = replicateRxCollection({
    collection: db[collectionName],

    // Unique per generation — forces fresh checkpoints on bump
    replicationIdentifier: `myapp-${collectionName}-g${gen}`,

    push: {
      batchSize: 200,
      async handler(rows) {
        const res = await fetch(`/api/replication/${collectionName}/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows })
        });
        if (!res.ok) throw new Error(`Push failed: ${res.status}`);
        const { conflicts } = await res.json();
        return conflicts; // RxDB re-pulls conflicted docs
      }
    },

    pull: {
      batchSize: 500,
      async handler(checkpoint, batchSize) {
        const params = new URLSearchParams({ limit: String(batchSize) });
        if (checkpoint) {
          params.set('updatedAt', checkpoint.updatedAt);
          params.set('id', checkpoint.id);
        }
        const res = await fetch(
          `/api/replication/${collectionName}/pull?${params}`
        );
        if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
        return res.json(); // { documents, checkpoint }
      },
      // SSE stream provides live: true behavior
      stream$: getLiveStream(collectionName)
    },

    retryTime: 5000,
    autoStart: true
  });

  return replication;
}
```

### Generation-Based Full Resync

Instead of manually manipulating RxDB checkpoints (fragile), change the `replicationIdentifier` to force a clean slate:

```typescript
// On app startup: detect if server restarted
async function checkServerEpoch() {
  const res = await fetch('/api/replication/epoch');
  const { epoch, totalDocs } = await res.json();
  const lastEpoch = localStorage.getItem('myapp-server-epoch');

  if (lastEpoch && lastEpoch !== epoch) {
    // Server restarted — bump generation to force full resync
    bumpGeneration();
  }

  if (totalDocs < 5) {
    // Server is empty (fresh deploy or data loss) — re-push everything
    bumpGeneration();
  }

  localStorage.setItem('myapp-server-epoch', epoch);
}
```

### SSE Live Stream (Single Multiplexed Connection)

Avoid opening one SSE connection per collection (browsers limit to 6 concurrent connections):

```typescript
// Single SSE stream for all collections
function createLiveStream() {
  const subjects = new Map<string, Subject<any>>();
  const eventSource = new EventSource('/api/replication/stream');

  eventSource.onmessage = (event) => {
    const { collection, checkpoint } = JSON.parse(event.data);
    const subject = subjects.get(collection);
    if (subject) subject.next(checkpoint);
  };

  return {
    getStream(collectionName: string) {
      if (!subjects.has(collectionName)) {
        subjects.set(collectionName, new Subject());
      }
      return subjects.get(collectionName)!.asObservable();
    }
  };
}
```

### Polling Fallback

Mobile browsers kill background SSE connections. Add polling as a safety net:

```typescript
// Poll secondary collections when SSE might be dead
setInterval(() => {
  for (const name of SECONDARY_COLLECTIONS) {
    const rep = getActiveReplication(name);
    rep?.reSync();
  }
}, 10_000); // every 10s

// Immediate resync when tab becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    for (const name of ALL_COLLECTIONS) {
      getActiveReplication(name)?.reSync();
    }
  }
});
```

---

## 6. Connectivity Detection

### The Problem

`navigator.onLine` is unreliable — it returns `true` on captive portals, broken WiFi, and LAN-only networks.

### Three-Tier Connectivity with Probe-Based Detection

```typescript
// stores/connection.svelte.ts

type ConnectivityTier = 'full' | 'lan' | 'offline';

let tier = $state<ConnectivityTier>('offline');
let lastCheck = $state<number>(0);

// Circuit breakers prevent probe storms on flaky networks
const lanBreaker = new CircuitBreaker({ threshold: 3, resetMs: 30_000 });
const internetBreaker = new CircuitBreaker({ threshold: 3, resetMs: 60_000 });

async function probeLan(): Promise<boolean> {
  if (lanBreaker.isOpen()) return false;
  try {
    const res = await fetchWithTimeout('/api/ping', { timeout: 5000 });
    lanBreaker.recordSuccess();
    return res.ok;
  } catch {
    lanBreaker.recordFailure();
    return false;
  }
}

async function probeInternet(): Promise<boolean> {
  if (internetBreaker.isOpen()) return false;
  try {
    const res = await fetchWithTimeout('https://clients3.google.com/generate_204', {
      timeout: 5000,
      mode: 'no-cors'
    });
    internetBreaker.recordSuccess();
    return true;
  } catch {
    internetBreaker.recordFailure();
    return false;
  }
}

async function updateConnectivity() {
  if (!navigator.onLine) {
    tier = 'offline';
    return;
  }
  const hasLan = await probeLan();
  if (!hasLan) {
    tier = 'offline';
    return;
  }
  const hasInternet = await probeInternet();
  tier = hasInternet ? 'full' : 'lan';
  lastCheck = Date.now();
}

// Probe every 60 seconds + on browser online/offline events
if (typeof window !== 'undefined') {
  setInterval(updateConnectivity, 60_000);
  window.addEventListener('online', updateConnectivity);
  window.addEventListener('offline', () => { tier = 'offline'; });
}

export const connectionState = {
  get tier() { return tier; },
  get lastCheck() { return lastCheck; }
};
```

### Using Connectivity in UI

```svelte
<script>
  import { connectionState } from '$lib/stores/connection.svelte';
</script>

{#if connectionState.tier === 'offline'}
  <Banner variant="warning">You're offline. Changes will sync when reconnected.</Banner>
{:else if connectionState.tier === 'lan'}
  <Banner variant="info">LAN only — cloud features unavailable.</Banner>
{/if}
```

---

## 7. Svelte 5 Store Integration

### Reactive RxDB Stores with Runes

```typescript
// stores/create-store.svelte.ts

import { browser } from '$app/environment';
import { getDb } from '$lib/db';

export function createRxStore<T>(
  collectionName: string,
  queryFn: (db: any) => any
) {
  let items = $state<T[]>([]);
  let initialized = $state(false);

  if (browser) {
    getDb().then((db) => {
      const query = queryFn(db);
      // RxDB query observable → Svelte 5 reactive state
      query.$.subscribe((docs: any[]) => {
        items = docs.map((doc: any) => doc.toJSON());
        initialized = true;
      });
    });
  }

  return {
    get value() { return items; },
    get initialized() { return initialized; }
  };
}
```

### Usage in Components

```svelte
<script lang="ts">
  import { createRxStore } from '$lib/stores/create-store.svelte';

  const tenantsStore = createRxStore('tenants', (db) =>
    db.tenants.find({
      selector: { deletedAt: { $eq: null } },
      sort: [{ name: 'asc' }]
    })
  );

  // Client-side joins via Map lookups (O(1) per join)
  let enriched = $derived.by(() => {
    const leaseMap = new Map(leasesStore.value.map(l => [l.tenantId, l]));
    return tenantsStore.value.map(t => ({
      ...t,
      lease: leaseMap.get(t.id) ?? null
    }));
  });
</script>

{#if !tenantsStore.initialized}
  <SkeletonTable rows={5} />
{:else}
  {#each enriched as tenant}
    <TenantCard {tenant} />
  {/each}
{/if}
```

### Important: `.svelte.ts` Extension

Files using `$state()`, `$derived()`, or `$effect()` **must** use the `.svelte.ts` extension. Plain `.ts` files cannot use runes — the Svelte compiler won't process them.

---

## 8. Resilience Patterns

### Circuit Breaker

Prevents hot retry loops when the server is down:

```typescript
// utils/circuit-breaker.ts

type State = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: State = 'closed';
  private failures = 0;
  private lastFailure = 0;

  constructor(
    private opts: { threshold: number; resetMs: number }
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      // Auto-transition to half-open after resetMs
      if (Date.now() - this.lastFailure > this.opts.resetMs) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.opts.threshold) {
      this.state = 'open';
    }
  }
}
```

### Exponential Backoff with Full Jitter

Prevents thundering herd after server restart:

```typescript
// utils/backoff.ts

export function calculateBackoff(attempt: number, baseMs = 1000, maxMs = 30_000): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Full jitter: random value between 0 and exponential cap
  return Math.floor(Math.random() * exponential);
}
```

### Reconciliation Sweep

Periodically scan for data inconsistencies and auto-heal:

```typescript
// db/reconcile.ts — runs every N minutes

export async function runReconciliation(db: any) {
  const checks = [
    checkOrphanedChildren,   // children referencing non-existent parents
    checkStaleStatuses,      // entities stuck in intermediate states
    checkNegativeQuantities, // stock that went below zero
    checkDuplicateActives,   // multiple active records where only one allowed
  ];

  for (const check of checks) {
    try {
      const fixes = await check(db);
      if (fixes > 0) {
        console.info(`Reconciliation: ${check.name} fixed ${fixes} issues`);
      }
    } catch (err) {
      console.warn(`Reconciliation: ${check.name} failed`, err);
    }
  }
}

async function checkOrphanedChildren(db: any): Promise<number> {
  // Build parent ID set, find children with missing parents, soft-delete them
  const parentIds = new Set(db.parents.find().exec().map((d: any) => d.id));
  const orphans = db.children.find().exec().filter(
    (c: any) => c.parentId && !parentIds.has(c.parentId)
  );
  for (const orphan of orphans) {
    await orphan.incrementalModify((doc: any) => {
      doc.deletedAt = new Date().toISOString();
      return doc;
    });
  }
  return orphans.length;
}
```

### Replication Diagnostics

Run automated health checks on startup to detect sync issues early:

```typescript
// db/diagnostics.ts — runs 5s after initialization

export async function runDiagnostics(db: any) {
  const results: Record<string, string> = {};

  // Phase 1: Can we reach the pull endpoint?
  try {
    const res = await fetch('/api/replication/orders/pull?limit=1');
    results.pullEndpoint = res.ok ? 'OK' : `FAIL (${res.status})`;
  } catch (err) {
    results.pullEndpoint = `FAIL (${err})`;
  }

  // Phase 2: Does local RxDB have data?
  for (const name of ['orders', 'items', 'users']) {
    const count = await db[name].count().exec();
    results[`local_${name}`] = String(count);
  }

  // Phase 3: Can we reach the push endpoint?
  try {
    const res = await fetch('/api/replication/orders/push', {
      method: 'POST',
      body: JSON.stringify({ rows: [] }) // empty push = connectivity test
    });
    results.pushEndpoint = res.ok ? 'OK' : `FAIL (${res.status})`;
  } catch (err) {
    results.pushEndpoint = `FAIL (${err})`;
  }

  console.table(results);
  return results;
}
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Do This Instead |
|---|---|---|
| `navigator.onLine` as sole connectivity check | Unreliable on captive portals, broken WiFi | Probe-based detection with circuit breakers |
| Fixed retry intervals (`setTimeout(retry, 1000)`) | Thundering herd after server restart | Exponential backoff with full jitter |
| Manual checkpoint manipulation | Fragile, breaks on RxDB updates | Generation-based `replicationIdentifier` |
| One SSE connection per collection | Hits browser's 6-connection limit | Single multiplexed SSE stream |
| Trust `push` always succeeds | Silent data loss on conflict | Server-side guards + audit trail |
| Delete + re-insert for schema changes | Data loss if interrupted | Sequential `migrationStrategies` |
| Retry forever on error | CPU burn, battery drain | Circuit breaker (open after N failures) |
| Same storage for all device types | Slow init on thin clients, Safari IDB bugs | Memory storage for thin clients |
| `console.log` in `$derived` | GC pressure in reactive computations | Log in `$effect` or event handlers |
| Nested `.find()` for joins | O(n^2) per render | Build `Map` lookups, O(1) per join |

---

## Quick Reference: When Do You Need RxDB?

| Requirement | Need RxDB? | Alternative |
|---|---|---|
| App works fully offline (reads + writes) | **Yes** | — |
| Multi-device sync with conflict resolution | **Yes** | — |
| Instant UI updates (optimistic writes) | Maybe | `use:enhance` + `$state()` |
| Client-side caching for performance | Maybe | SvelteKit `load()` + HTTP cache |
| Small user base, always-online | **No** | Server-rendered SvelteKit |
| Admin dashboard / back-office tool | **No** | Standard SvelteKit patterns |

**Rule of thumb**: If your users close the app, walk into an elevator, and expect it to still work — you need RxDB. If they always have WiFi and can wait 200ms for a server round-trip, you don't.
