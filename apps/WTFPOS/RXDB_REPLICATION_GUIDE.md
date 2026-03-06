# RxDB Replication Guide for WTFPOS

## For AI Agents: Multi-Device LAN Sync & Cloud Replication

This guide defines how WTFPOS replicates data between multiple tablets on a branch LAN and (Phase 2) to a Neon PostgreSQL cloud database. Follow these rules strictly.

**RxDB version: `^16.21.1`** | **Replication protocol: RxDB built-in (pull/push checkpoint-based)**

---

## Architecture Overview

```
Phase 1 — LAN Sync (per branch)
┌─────────────────────────────────────────────────────────┐
│  Branch LAN (e.g., QC)                                  │
│                                                         │
│  ┌──────────────────┐  HTTP/WS   ┌───────────────────┐  │
│  │  Main Tablet      │◄─────────►│  POS Tablet #2    │  │
│  │  (SvelteKit Node) │           │  (browser-only)   │  │
│  │  RxDB + Server    │           │  RxDB + replicate │  │
│  └────────┬─────────┘           └───────────────────┘  │
│           │            HTTP/WS   ┌───────────────────┐  │
│           │◄────────────────────►│  KDS Tablet       │  │
│           │                      │  (browser-only)   │  │
│           │                      └───────────────────┘  │
│           │                                             │
│  Phase 2  │  HTTPS (internet)                           │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │  Neon PostgreSQL  │◄──── Makati branch (same setup)  │
│  │  (cloud)          │◄──── Owner dashboard              │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘

Data flow:
  Tablet → local RxDB (IndexedDB) → replication → LAN server → replication → Neon

Offline behavior:
  Tablet writes to local IndexedDB immediately.
  Changes queue in the replication checkpoint.
  When connectivity resumes, queued changes push automatically.
```

---

## Rule 1: Every Replicated Schema MUST Have `updatedAt`

RxDB's replication protocol is checkpoint-based. The pull handler asks: "give me all documents changed after checkpoint X." Without a monotonically increasing `updatedAt` on every document, the server cannot answer this question.

```ts
// REQUIRED on every schema that replicates
updatedAt: { type: 'string', maxLength: 30 }

// REQUIRED in the required array
required: [..., 'updatedAt']

// REQUIRED in indexes (the pull query sorts/filters by this)
indexes: [..., 'updatedAt']
```

### Setting `updatedAt` on every write

Every insert, patch, and modify must set `updatedAt`:

```ts
// Insert
await db.orders.insert({
    ...orderData,
    updatedAt: new Date().toISOString()
});

// incrementalPatch — always include updatedAt
await doc.incrementalPatch({
    status: 'paid',
    updatedAt: new Date().toISOString()
});

// incrementalModify — always set updatedAt in the callback
await doc.incrementalModify((d) => {
    d.items = [...d.items, newItem];
    d.updatedAt = new Date().toISOString();
    return d;
});
```

**If you forget `updatedAt` on a write, that change will never be pulled by other devices.** This is the single most common replication bug.

### Why ISO 8601 strings and not Unix timestamps?

RxDB indexes work best with strings that have `maxLength`. ISO 8601 strings (`2026-03-06T14:30:00.000Z`, 24 chars) sort lexicographically in the correct chronological order, making them ideal for RxDB's padded string index format with Dexie.

---

## Rule 2: Soft Deletes — Never Hard-Delete Replicated Documents

RxDB uses `_deleted: true` internally for document removal. When you call `doc.remove()`, the document is NOT erased from storage — it is marked `_deleted: true` and replicated as a deletion event.

**Critical rules:**

1. **Never use `indexedDB.deleteDatabase()` on a device that has unreplicated changes** — those changes are lost forever.
2. **Never bypass RxDB to delete IndexedDB entries directly** — replication won't know.
3. **Your Postgres tables must have a `deleted` column** — when a deletion replicates to Neon, mark the row as deleted instead of running `DELETE FROM`.
4. **Queries automatically filter out `_deleted` documents** — you don't need to add `_deleted: false` to selectors.

```ts
// CORRECT — RxDB handles soft delete internally
await orderDoc.remove();
// The order is now _deleted: true in IndexedDB
// Replication will push this deletion to the server
// Other devices will remove it from their local state

// WRONG — manually deleting from IndexedDB
// This bypasses RxDB's change tracking entirely
```

### Cleanup / Archival

Deleted documents accumulate over time. Periodically purge old deleted documents:

```ts
// Run during maintenance window (after close, 10 PM+)
// Only purge documents deleted more than 30 days ago
async function purgeOldDeleted(collectionName: string, daysOld: number) {
    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    // Use the internal storage to find deleted docs
    // This is a maintenance operation — not for normal app flow
    await db[collectionName].cleanup(0); // removes all _deleted docs
}
```

**Warning:** Only call `cleanup()` after ALL devices have synced past the deletion checkpoint. If a device hasn't synced yet, it won't receive the deletion event.

---

## Rule 3: Which Collections Replicate

| Collection | Replicate? | Conflict Risk | Notes |
|---|---|---|---|
| `tables` | Yes | HIGH | Multiple tablets open/close tables simultaneously |
| `orders` | Yes | HIGH | Items added from POS, bumped from KDS, paid from register |
| `menu_items` | Yes (one-way: server to clients) | LOW | Only admin changes menu. Push from server, pull on clients. |
| `stock_items` | Yes | MEDIUM | Stock adjustments from multiple sources |
| `deliveries` | Yes | LOW | Usually one person receives deliveries |
| `waste` | Yes | LOW | Append-only log |
| `deductions` | Yes | LOW | Append-only (created on order items sent) |
| `expenses` | Yes | LOW | Append-only log |
| `adjustments` | Yes | LOW | Append-only log |
| `stock_counts` | Yes | MEDIUM | Multiple people may count at once |
| `kds_tickets` | Yes | HIGH | POS creates, KDS bumps — concurrent by design |
| `kds_history` | Yes | LOW | Append-only (bumped tickets) |
| `devices` | Yes | LOW | Each device only writes its own record |
| `x_reads` | Yes | LOW | Generated once, read-only after |
| `utility_readings` | Yes | LOW | One entry per day |

### Collections that NEVER replicate

| Data | Storage | Why |
|---|---|---|
| `session` (user, role, branch) | In-memory `$state` | Device-local identity |
| `connectionState` | In-memory `$state` | Runtime network status |
| `hardwareState` | In-memory `$state` | Runtime device sensors |
| Timer ticks (in-memory cache) | `Map<string, number>` | Display-only, derived from `elapsedSeconds` |

---

## Rule 4: Conflict Resolution Strategy

### Default behavior (keeps master/server version)

RxDB's default conflict handler discards the client fork and keeps the master state. This is **wrong for a POS** because it means:
- Staff adds items on POS tablet, KDS bumps items simultaneously → one side's changes are lost
- Two cashiers apply payment to the same order → one payment disappears

### Custom conflict handlers for high-risk collections

You MUST define custom conflict handlers for `orders`, `tables`, and `kds_tickets`.

```ts
// ─── Order Conflict Handler ──────────────────────────────────────────────────
// Strategy: merge arrays (items, payments), take latest scalar fields

import type { RxConflictHandler } from 'rxdb';

export const orderConflictHandler: RxConflictHandler<any> = {
    isEqual(a, b) {
        // Fast check: same revision means no conflict
        return JSON.stringify(a) === JSON.stringify(b);
    },
    resolve(i) {
        const master = i.realMasterState;
        const fork = i.newDocumentState;

        // For arrays: merge by item ID, keeping the newer version of each item
        const mergedItems = mergeById(master.items, fork.items, 'id');
        const mergedPayments = mergeById(master.payments, fork.payments, 'method');

        // For scalars: take the one with the later updatedAt
        const base = master.updatedAt >= fork.updatedAt ? master : fork;

        return {
            ...base,
            items: mergedItems,
            payments: mergedPayments,
            // Recompute totals from merged items
            subtotal: mergedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
            updatedAt: new Date().toISOString() // new merge timestamp
        };
    }
};

// Helper: merge two arrays by a key field, preferring the entry from the longer array
// or the entry that appears in both (latest wins)
function mergeById<T extends Record<string, any>>(
    masterArr: T[],
    forkArr: T[],
    key: string
): T[] {
    const map = new Map<string, T>();
    for (const item of masterArr) map.set(item[key], item);
    for (const item of forkArr) map.set(item[key], item); // fork overwrites master per-item
    return Array.from(map.values());
}
```

```ts
// ─── Table Conflict Handler ──────────────────────────────────────────────────
// Strategy: prefer the state that represents "more activity"
// occupied > warning > critical > available > reserved

export const tableConflictHandler: RxConflictHandler<any> = {
    isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    },
    resolve(i) {
        const master = i.realMasterState;
        const fork = i.newDocumentState;

        // Take the version with the later updatedAt
        // This ensures the most recent action (open, close, seat) wins
        if (master.updatedAt >= fork.updatedAt) return master;
        return fork;
    }
};
```

```ts
// ─── KDS Ticket Conflict Handler ─────────────────────────────────────────────
// Strategy: merge item statuses — if any side bumped an item, keep the bump

export const kdsTicketConflictHandler: RxConflictHandler<any> = {
    isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    },
    resolve(i) {
        const master = i.realMasterState;
        const fork = i.newDocumentState;

        // Merge items: if either side set status to 'done', keep 'done'
        const statusPriority: Record<string, number> = {
            pending: 0, preparing: 1, done: 2
        };

        const mergedItems = master.items.map((mItem: any) => {
            const fItem = fork.items.find((f: any) => f.id === mItem.id);
            if (!fItem) return mItem;
            const mPrio = statusPriority[mItem.status] ?? 0;
            const fPrio = statusPriority[fItem.status] ?? 0;
            return fPrio > mPrio ? fItem : mItem;
        });

        // Include any items in fork that don't exist in master (new items added)
        const masterIds = new Set(master.items.map((i: any) => i.id));
        const newFromFork = fork.items.filter((f: any) => !masterIds.has(f.id));

        return {
            ...master,
            items: [...mergedItems, ...newFromFork],
            updatedAt: new Date().toISOString()
        };
    }
};
```

### Register conflict handlers when adding collections

```ts
await db.addCollections({
    orders: {
        schema: orderSchema,
        migrationStrategies: identityMigration2,
        conflictHandler: orderConflictHandler     // <-- add this
    },
    tables: {
        schema: tableSchema,
        migrationStrategies: identityMigration1,
        conflictHandler: tableConflictHandler      // <-- add this
    },
    kds_tickets: {
        schema: kdsTicketSchema,
        migrationStrategies: identityMigration1,
        conflictHandler: kdsTicketConflictHandler  // <-- add this
    },
    // Other collections use default handler (last-write-wins via master preference)
    // This is fine for append-only logs (waste, deliveries, expenses, etc.)
});
```

---

## Rule 5: Replication Setup — Phase 1 (LAN WebSocket)

### Package requirements

```bash
# Already installed:
# rxdb@^16.21.1, rxjs@^7.8.2

# Additional for replication (check RxDB v16 plugin availability):
# The replication plugins are included in the rxdb package — no extra install needed.
# Import from:
#   rxdb/plugins/replication
#   rxdb/plugins/replication-websocket (if using WebSocket transport)
```

### Option A: Custom HTTP Replication (recommended for SvelteKit)

Since your main tablet runs SvelteKit with `adapter-node`, you can add API routes that speak RxDB's replication protocol directly.

```ts
// ─── Client side (every tablet including the main one) ───────────────────────
// src/lib/db/replication.ts

import { replicateRxCollection } from 'rxdb/plugins/replication';
import { Subject } from 'rxjs';
import { browser } from '$app/environment';
import { getDb } from '$lib/db';

const PULL_INTERVAL = 5000; // 5 seconds — adjust for LAN latency
const BATCH_SIZE = 50;

interface ReplicationCheckpoint {
    updatedAt: string;
    id: string;
}

export async function startReplication(serverUrl: string) {
    if (!browser) return;
    const db = await getDb();

    const collectionsToReplicate = [
        'tables', 'orders', 'menu_items', 'stock_items',
        'deliveries', 'waste', 'deductions', 'expenses',
        'adjustments', 'stock_counts', 'kds_tickets',
        'kds_history', 'devices', 'x_reads', 'utility_readings'
    ];

    const replications = [];

    for (const colName of collectionsToReplicate) {
        const collection = db[colName];
        if (!collection) continue;

        const replicationState = replicateRxCollection({
            collection,
            replicationIdentifier: `wtfpos-lan-${colName}`,
            deletedField: '_deleted',

            // ─── Pull: fetch changes from server ─────────────────────
            pull: {
                async handler(lastCheckpoint: ReplicationCheckpoint | undefined, batchSize: number) {
                    const params = new URLSearchParams({
                        collection: colName,
                        limit: String(batchSize)
                    });
                    if (lastCheckpoint) {
                        params.set('updatedAt', lastCheckpoint.updatedAt);
                        params.set('id', lastCheckpoint.id);
                    }

                    const response = await fetch(
                        `${serverUrl}/api/replication/pull?${params}`
                    );
                    const data = await response.json();

                    return {
                        documents: data.documents,
                        checkpoint: data.checkpoint
                    };
                },
                batchSize: BATCH_SIZE,
                // Stream: use server-sent events or WebSocket for real-time
                // For polling mode, set the interval:
                // (RxDB v16 uses `live` + pull interval internally)
            },

            // ─── Push: send local changes to server ──────────────────
            push: {
                async handler(changeRows) {
                    const response = await fetch(
                        `${serverUrl}/api/replication/push`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                collection: colName,
                                changeRows
                            })
                        }
                    );
                    const conflicts = await response.json();
                    return conflicts; // Array of conflicting master docs
                },
                batchSize: BATCH_SIZE
            },

            live: true,         // Keep replication running (not one-shot)
            retryTime: 5000,    // Retry after 5s on failure
            autoStart: true
        });

        replications.push(replicationState);
    }

    return replications;
}
```

### Option B: WebSocket Replication (real-time, lower latency)

```ts
// Better for KDS ↔ POS communication where sub-second updates matter
// Uses rxdb/plugins/replication-websocket

import { replicateWithWebsocketServer } from 'rxdb/plugins/replication-websocket';

// On the main tablet (server side):
// Start a WebSocket server alongside the SvelteKit Node server

// On client tablets:
export async function startWebSocketReplication(wsUrl: string) {
    if (!browser) return;
    const db = await getDb();

    // The WebSocket plugin handles pull + push over a single WS connection
    // It automatically sends change events in real-time (no polling)
    const replicationState = await replicateWithWebsocketServer({
        collection: db.orders,
        url: wsUrl, // e.g., 'ws://192.168.1.100:3001'
        // ... additional config
    });

    return replicationState;
}
```

**Recommendation:** Start with HTTP replication (Option A) for simplicity. Switch high-traffic collections (orders, kds_tickets) to WebSocket later if the 5-second polling latency is noticeable on the KDS.

---

## Rule 6: Server-Side Replication Endpoints (SvelteKit API Routes)

The main tablet runs these API routes. Other tablets call them.

```ts
// src/routes/api/replication/pull/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db';

export const GET: RequestHandler = async ({ url }) => {
    const collectionName = url.searchParams.get('collection');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const checkpointUpdatedAt = url.searchParams.get('updatedAt');
    const checkpointId = url.searchParams.get('id');

    if (!collectionName) {
        return json({ error: 'collection parameter required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db[collectionName];
    if (!collection) {
        return json({ error: `Unknown collection: ${collectionName}` }, { status: 404 });
    }

    // Build selector: documents updated after the checkpoint
    let selector: any = {};
    if (checkpointUpdatedAt && checkpointId) {
        selector = {
            $or: [
                { updatedAt: { $gt: checkpointUpdatedAt } },
                {
                    updatedAt: { $eq: checkpointUpdatedAt },
                    id: { $gt: checkpointId }
                }
            ]
        };
    }

    // Query including deleted documents (replication needs them)
    const docs = await collection.find({
        selector,
        sort: [{ updatedAt: 'asc' }, { id: 'asc' }],
        limit
    }).exec();

    const documents = docs.map((doc: any) => doc.toJSON());

    // Build checkpoint from the last document
    const lastDoc = documents[documents.length - 1];
    const checkpoint = lastDoc
        ? { updatedAt: lastDoc.updatedAt, id: lastDoc.id }
        : (checkpointUpdatedAt ? { updatedAt: checkpointUpdatedAt, id: checkpointId } : null);

    return json({ documents, checkpoint });
};
```

```ts
// src/routes/api/replication/push/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
    const { collection: collectionName, changeRows } = await request.json();

    if (!collectionName || !changeRows) {
        return json({ error: 'collection and changeRows required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db[collectionName];
    if (!collection) {
        return json({ error: `Unknown collection: ${collectionName}` }, { status: 404 });
    }

    const conflicts: any[] = [];

    for (const row of changeRows) {
        const { newDocumentState, assumedMasterState } = row;

        try {
            const existingDoc = await collection
                .findOne(newDocumentState.id || newDocumentState[collection.schema.primaryPath])
                .exec();

            if (!existingDoc) {
                // Document doesn't exist on server — insert it
                if (!newDocumentState._deleted) {
                    await collection.insert(newDocumentState);
                }
                // If _deleted and doesn't exist, nothing to do
            } else {
                // Document exists — check for conflicts
                const masterState = existingDoc.toJSON();

                // Compare assumed master state with actual master state
                // If they differ, it's a conflict
                if (
                    assumedMasterState &&
                    JSON.stringify(assumedMasterState) !== JSON.stringify(masterState)
                ) {
                    // Conflict: return the actual master state
                    conflicts.push(masterState);
                } else {
                    // No conflict: apply the change
                    if (newDocumentState._deleted) {
                        await existingDoc.remove();
                    } else {
                        await existingDoc.incrementalPatch(newDocumentState);
                    }
                }
            }
        } catch (err) {
            console.error(`[Replication Push] Error processing ${collectionName}:`, err);
            // On error, return the current master state as a conflict
            // so the client can retry with the correct assumed state
            try {
                const doc = await collection
                    .findOne(newDocumentState.id || newDocumentState[collection.schema.primaryPath])
                    .exec();
                if (doc) conflicts.push(doc.toJSON());
            } catch {
                // Ignore — worst case, the client retries
            }
        }
    }

    return json(conflicts);
};
```

---

## Rule 7: Server URL Configuration

Tablets need to know where the main server is. Store this in localStorage (not RxDB — it needs to be available before the database initializes).

```ts
// src/lib/stores/replication-config.svelte.ts

import { browser } from '$app/environment';

const SERVER_URL_KEY = 'wtfpos_server_url';
const DEFAULT_PORT = 3000;

// Reactive state
let serverUrl = $state<string>(getStoredServerUrl());
let isMainServer = $state<boolean>(getStoredIsMainServer());

function getStoredServerUrl(): string {
    if (!browser) return '';
    return localStorage.getItem(SERVER_URL_KEY) || '';
}

function getStoredIsMainServer(): boolean {
    if (!browser) return false;
    return localStorage.getItem('wtfpos_is_main_server') === 'true';
}

export const replicationConfig = {
    get serverUrl() { return serverUrl; },
    get isMainServer() { return isMainServer; },
    get isConfigured() { return !!serverUrl || isMainServer; },

    setServerUrl(url: string) {
        serverUrl = url;
        if (browser) localStorage.setItem(SERVER_URL_KEY, url);
    },

    setIsMainServer(value: boolean) {
        isMainServer = value;
        if (browser) localStorage.setItem('wtfpos_is_main_server', String(value));
    },

    /**
     * Auto-detect the server URL on the LAN.
     * Tries common patterns: same hostname different port, .local addresses.
     */
    async autoDetect(): Promise<string | null> {
        if (!browser) return null;

        const candidates = [
            `http://${window.location.hostname}:${DEFAULT_PORT}`,
            `http://wtfpos-server.local:${DEFAULT_PORT}`,
            // Try common LAN IPs
            `http://192.168.1.100:${DEFAULT_PORT}`,
            `http://192.168.0.100:${DEFAULT_PORT}`,
        ];

        for (const url of candidates) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(`${url}/api/replication/health`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (res.ok) return url;
            } catch {
                continue;
            }
        }

        return null;
    }
};
```

### Health check endpoint (main server)

```ts
// src/routes/api/replication/health/+server.ts
import { json } from '@sveltejs/kit';

export const GET = () => {
    return json({
        status: 'ok',
        server: 'wtfpos-main',
        timestamp: new Date().toISOString()
    });
};
```

### LAN Discovery Options

| Method | Pros | Cons | Recommendation |
|---|---|---|---|
| **Manual IP entry** | Simple, no dependencies | Must update if IP changes | Good for initial setup |
| **QR code pairing** | Visual, easy for staff | Requires camera access | Good for onboarding new devices |
| **mDNS (`.local`)** | Automatic, no IP needed | Requires mDNS support on LAN | Best long-term solution |
| **Auto-detect scan** | No configuration needed | Slow, may hit wrong server | Fallback only |

**Recommended approach:** Manual IP entry in admin settings, with QR code as a convenience feature. Store in localStorage so it persists across sessions.

---

## Rule 8: Connection State — Upgraded for Replication

Your current `connectionState` only tracks internet connectivity. Upgrade it to track LAN server reachability separately.

```ts
// Upgraded connection state model

export interface ConnectionState {
    // Internet connectivity (navigator.onLine + ping check)
    internet: boolean;

    // LAN server reachability (can we reach the main tablet?)
    lanServer: boolean;
    lanServerLastSeen: string | null;  // ISO timestamp

    // Replication health
    replicationActive: boolean;
    lastPullAt: string | null;
    lastPushAt: string | null;
    pendingPushCount: number;          // Changes waiting to be pushed

    // Error state
    lastError: string | null;
}
```

### UI indicators

```
 LAN Server     Replication     Internet
 ● Connected    ● Synced        ● Online      → All green: fully operational
 ● Connected    ○ Syncing...    ● Online      → Catching up
 ● Connected    ● Synced        ○ Offline     → LAN works, no cloud (Phase 2)
 ○ Offline      ○ Queued (5)    ● Online      → Server down, changes queuing
 ○ Offline      ○ Queued (5)    ○ Offline     → Fully offline, local-only mode
```

Staff should see a simple status badge. Managers/admins see the full breakdown.

---

## Rule 9: Replication Lifecycle

### When to start replication

```ts
// src/routes/+layout.svelte (root layout, runs once on app mount)

import { onMount, onDestroy } from 'svelte';
import { startReplication } from '$lib/db/replication';
import { replicationConfig } from '$lib/stores/replication-config.svelte';

let replications: any[] = [];

onMount(async () => {
    // Only start replication if configured and not the main server
    // (Main server doesn't replicate to itself)
    if (replicationConfig.serverUrl && !replicationConfig.isMainServer) {
        replications = await startReplication(replicationConfig.serverUrl) || [];
    }
});

onDestroy(() => {
    // Cancel all replications on unmount
    for (const rep of replications) {
        rep.cancel();
    }
});
```

### When to pause/resume replication

RxDB v16 sets `toggleOnDocumentVisible: true` by default, meaning replication automatically pauses when the browser tab is hidden and resumes when visible. This is good for battery life on tablets.

For manual control:

```ts
// Pause during sensitive operations (e.g., Z-reading generation)
for (const rep of replications) {
    await rep.cancel(); // or rep.pause() if supported
}

// Resume after
replications = await startReplication(serverUrl);
```

### Error recovery

```ts
replicationState.error$.subscribe((err) => {
    console.error(`[Replication Error] ${collectionName}:`, err);

    // Common errors:
    // - Network timeout: retryTime handles this automatically
    // - 409 CONFLICT: conflict handler resolves this
    // - 422 Validation: document doesn't match schema — log and skip
    // - Server unreachable: retry loop continues until server returns
});
```

---

## Rule 10: Phase 2 — Neon PostgreSQL Cloud Sync

### Architecture change

In Phase 2, the main tablet's SvelteKit server replicates its RxDB data to Neon PostgreSQL. Client tablets still replicate to the main tablet (LAN). The main tablet acts as the bridge.

```
Client tablets → LAN → Main tablet (RxDB) → HTTPS → Neon PostgreSQL
                                                ↑
                                    SvelteKit API routes or
                                    background sync worker
```

### Postgres schema design

Every RxDB collection maps to a Postgres table. Key rules:

1. **Column names match RxDB property names** (camelCase in RxDB → snake_case in Postgres via Drizzle)
2. **Every table has `updated_at` and `deleted` columns**
3. **`location_id` on every table** for branch isolation
4. **JSON columns for nested objects** (items arrays, payments arrays)

```sql
-- Example: orders table in Neon
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    order_type TEXT NOT NULL,
    customer_name TEXT,
    table_id TEXT,
    table_number INTEGER,
    package_name TEXT,
    package_id TEXT,
    pax INTEGER NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',         -- stored as JSON array
    status TEXT NOT NULL,
    discount_type TEXT,
    discount_pax INTEGER DEFAULT 0,
    discount_ids JSONB DEFAULT '[]',
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    vat_amount NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    payments JSONB NOT NULL DEFAULT '[]',       -- stored as JSON array
    created_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    bill_printed BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    cancel_reason TEXT DEFAULT '',
    closed_by TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false,

    -- Indexes for replication pull queries
    INDEX idx_orders_updated_at (updated_at),
    INDEX idx_orders_location_status (location_id, status),
    INDEX idx_orders_location_created (location_id, created_at)
);
```

### Replication from main tablet to Neon

The main tablet runs a background sync process:

```ts
// src/lib/db/cloud-sync.ts (runs only on the main tablet)

import { replicateRxCollection } from 'rxdb/plugins/replication';

export async function startCloudSync(neonApiUrl: string) {
    const db = await getDb();

    // Same replication pattern as LAN, but pointing at Neon API
    for (const colName of collectionsToReplicate) {
        replicateRxCollection({
            collection: db[colName],
            replicationIdentifier: `wtfpos-cloud-${colName}`,

            pull: {
                async handler(checkpoint, batchSize) {
                    // Fetch from Neon via SvelteKit API
                    const res = await fetch(`${neonApiUrl}/api/cloud/pull`, {
                        method: 'POST',
                        body: JSON.stringify({ collection: colName, checkpoint, batchSize })
                    });
                    return res.json();
                },
                batchSize: 100
            },

            push: {
                async handler(changeRows) {
                    const res = await fetch(`${neonApiUrl}/api/cloud/push`, {
                        method: 'POST',
                        body: JSON.stringify({ collection: colName, changeRows })
                    });
                    return res.json();
                },
                batchSize: 100
            },

            live: true,
            retryTime: 30000 // 30 seconds — cloud sync is less urgent
        });
    }
}
```

### Data volume planning

| Collection | Estimated rows/month/branch | Storage (Neon) | Notes |
|---|---|---|---|
| `orders` | ~6,000 | ~2 MB | Archive after 90 days |
| `deductions` | ~15,000 | ~3 MB | Archive after 90 days |
| `deliveries` | ~300 | ~100 KB | Keep all |
| `waste` | ~500 | ~100 KB | Keep all |
| `expenses` | ~200 | ~50 KB | Keep all |
| `stock_items` | ~50 (static) | ~10 KB | Keep all |
| `menu_items` | ~30 (static) | ~5 KB | Keep all |
| `kds_tickets` | ~6,000 | ~2 MB | Archive after 30 days |
| **Total** | | **~10 MB/month** | Well within Neon free tier |

---

## Rule 11: Schema Migration Coordination (Multi-Device)

When you update a schema version, all devices must migrate. In a multi-device setup, this is more complex:

### Rollout protocol

```
1. Take the system offline (end of day, after Z-reading)
2. Stop replication on all client tablets
3. Deploy new code to the main tablet server FIRST
   → Main tablet runs migrations on its local RxDB
   → Main tablet's API routes now expect the new schema
4. Update client tablets one at a time
   → Each client runs its own local migration on load
   → Replication resumes with new schema
5. Verify: check all devices show correct data
```

### Schema version mismatch between devices

If a client has schema v1 and the server has schema v2:
- **Pull:** Client receives v2 documents but its local schema is v1 → RxDB migration runs on the client's local data
- **Push:** Client pushes v1-shaped documents → Server must handle gracefully

**Rule: Always update the server first, then clients.** Never let a client with a newer schema push to a server with an older schema.

### Migration strategy for `updatedAt` field (the first replication migration)

When you add `updatedAt` to all schemas for the first time:

```ts
// In db/index.ts — migration for adding updatedAt
const addUpdatedAtMigration = (prevVersion: number) => ({
    ...Object.fromEntries(
        Array.from({ length: prevVersion }, (_, i) => [i + 1, (doc: any) => doc])
    ),
    [prevVersion + 1]: (oldDoc: any) => {
        // Set updatedAt to the best available timestamp
        oldDoc.updatedAt = oldDoc.updatedAt
            || oldDoc.createdAt
            || oldDoc.receivedAt
            || oldDoc.loggedAt
            || new Date().toISOString();
        return oldDoc;
    }
});
```

---

## Rule 12: Security for LAN Replication

The LAN replication endpoints are HTTP (not HTTPS) on the local network. Minimum security measures:

### API key authentication

```ts
// Simple shared secret — set via admin settings, stored in localStorage
const REPLICATION_API_KEY = 'wtfpos-branch-key-xxxxx';

// Client: include in every replication request
headers: {
    'Content-Type': 'application/json',
    'X-WTFPOS-API-Key': REPLICATION_API_KEY
}

// Server: validate in API routes
const apiKey = request.headers.get('X-WTFPOS-API-Key');
if (apiKey !== expectedKey) {
    return json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Branch isolation

Tablets should only replicate with their own branch's server. The server should validate that the device's `locationId` matches the branch it's configured for.

### Rate limiting

Not critical for LAN (trusted devices), but add basic protection:
- Max 10 requests/second per device
- Max batch size of 100 documents per push

---

## Rule 13: Testing Replication Locally

Before deploying to real tablets, test with multiple browser tabs:

### Method 1: Two tabs, same browser

Your RxDB config already has `multiInstance: true`. Open two tabs to the same dev server. Changes in one tab appear in the other via the BroadcastChannel (built into RxDB). This tests **multi-tab sync** but NOT network replication.

### Method 2: Two browser instances, same dev server

Open Chrome and Firefox (or Chrome + Chrome Incognito) to `http://localhost:5173`. Each has its own IndexedDB. This simulates two separate devices.

To test replication:
1. Start the dev server: `pnpm dev`
2. Open Tab A (Chrome) — this acts as the "main tablet"
3. Open Tab B (Firefox) — this acts as a "client tablet"
4. Configure Tab B to replicate to `http://localhost:5173`
5. Create an order on Tab A → verify it appears on Tab B
6. Modify the order on Tab B → verify changes appear on Tab A

### Method 3: Two dev servers on different ports

```bash
# Terminal 1: Main server
PORT=3000 pnpm dev

# Terminal 2: Client
PORT=3001 pnpm dev
# Configure this instance to replicate to http://localhost:3000
```

---

## Preparation Checklist

### Before starting Phase 1 (LAN Sync)

```
Schema changes:
  [ ] Add `updatedAt` field to ALL replicated schemas
  [ ] Bump schema versions for all affected collections
  [ ] Write migration strategies that backfill updatedAt from existing timestamps
  [ ] Update ALL write operations to set updatedAt: new Date().toISOString()
  [ ] Test migrations locally (create data on old version, load new code)

Conflict handlers:
  [ ] Implement orderConflictHandler (merge items + payments arrays)
  [ ] Implement tableConflictHandler (latest updatedAt wins)
  [ ] Implement kdsTicketConflictHandler (merge item statuses, prefer 'done')
  [ ] Register handlers in addCollections()
  [ ] Test: modify same order on two tabs simultaneously, verify merge

Replication infrastructure:
  [ ] Create /api/replication/pull endpoint
  [ ] Create /api/replication/push endpoint
  [ ] Create /api/replication/health endpoint
  [ ] Create replication.ts client module
  [ ] Create replication-config.svelte.ts (server URL storage)
  [ ] Add API key authentication to replication endpoints
  [ ] Upgrade connectionState to track lanServer + replicationActive

UI:
  [ ] Add "Server URL" field to admin settings
  [ ] Add "This is the main server" toggle to admin settings
  [ ] Add connection/sync status indicator to TopBar
  [ ] Show pending push count when offline

Testing:
  [ ] Test with two browser instances (Chrome + Firefox)
  [ ] Test offline scenario: disconnect LAN, make changes, reconnect
  [ ] Test conflict scenario: edit same order on two devices
  [ ] Test server restart: stop main tablet, verify clients queue changes
  [ ] Test fresh device join: new tablet connects and pulls all data
```

### Before starting Phase 2 (Neon PostgreSQL)

```
Database setup:
  [ ] Create Neon project and database
  [ ] Design Postgres schema matching RxDB schemas (with snake_case columns)
  [ ] Add updated_at and deleted columns to all tables
  [ ] Set up Drizzle ORM (or @neondatabase/serverless)
  [ ] Create migration files for Postgres schema
  [ ] Add row-level security for branch isolation

Cloud sync:
  [ ] Create /api/cloud/pull and /api/cloud/push endpoints
  [ ] These endpoints talk to Neon via Drizzle/serverless driver
  [ ] Implement camelCase ↔ snake_case field mapping
  [ ] Implement JSON ↔ JSONB conversion for array fields
  [ ] Cloud sync only runs on the main tablet (not client tablets)

Data management:
  [ ] Implement order archival (move orders > 90 days to archive table)
  [ ] Implement deduction archival
  [ ] Set up Neon connection pooling (for concurrent branch syncs)
  [ ] Monitor Neon storage usage

Owner dashboard:
  [ ] Owner dashboard queries Neon directly (not local RxDB)
  [ ] Branch comparison reports pull from Neon
  [ ] Real-time: owner sees both branches via cloud data
```

---

## File Reference (Replication-Related)

| File | Purpose | Status |
|---|---|---|
| `src/lib/db/replication.ts` | Client replication setup (startReplication, stopReplication) | To create |
| `src/lib/db/cloud-sync.ts` | Main tablet → Neon sync (Phase 2) | To create |
| `src/lib/db/conflict-handlers.ts` | Custom conflict handlers for orders, tables, KDS | To create |
| `src/lib/stores/replication-config.svelte.ts` | Server URL, isMainServer config | To create |
| `src/lib/stores/connection.svelte.ts` | Upgraded: internet + lanServer + replication status | To upgrade |
| `src/routes/api/replication/pull/+server.ts` | Pull endpoint (main tablet serves) | To create |
| `src/routes/api/replication/push/+server.ts` | Push endpoint (main tablet serves) | To create |
| `src/routes/api/replication/health/+server.ts` | Health check for LAN discovery | To create |
| `src/routes/api/cloud/pull/+server.ts` | Neon pull (Phase 2) | To create |
| `src/routes/api/cloud/push/+server.ts` | Neon push (Phase 2) | To create |
| `src/routes/admin/settings/+page.svelte` | Server URL config UI | To create |
