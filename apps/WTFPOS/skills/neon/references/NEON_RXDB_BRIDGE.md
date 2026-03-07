# Neon ↔ RxDB Bridge — WTFPOS

How RxDB data flows into Neon, and how Neon data feeds back into reports.

**Status: PREPARATION. Not yet implemented.**

---

## Data Flow Architecture

```
[Branch device - browser]
    RxDB (IndexedDB)
        ↓ incrementalPatch/insert fires
        ↓ background sync (every 30s or on change)
[Branch device - SvelteKit server]
    POST /api/cloud/push → upsert into Neon
    GET  /api/cloud/pull ← query Neon for changes (menu_items, settings)

[Neon PostgreSQL]
    All branches' data merged in one database
    → SQL analytics queries

[Owner device - browser]
    Reports pages → GET /api/reports/... → Neon SQL query → JSON → UI
```

---

## Cloud Sync Implementation Plan

### The push direction (RxDB → Neon)

The main tablet's SvelteKit server runs a background cloud sync:

```ts
// src/lib/db/cloud-sync.ts

import { replicateRxCollection } from 'rxdb/plugins/replication';
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

const CLOUD_SYNC_COLLECTIONS = [
    'orders', 'expenses', 'stock_items', 'deliveries',
    'waste', 'adjustments', 'stock_counts', 'kds_history',
    'x_reads', 'audit_logs'
];

// menu_items and tables are NOT cloud-synced (branch-local operational data)
// sessions and devices are NOT cloud-synced (device-local)

export async function startCloudSync(apiBase: string) {
    if (!browser) return;
    const db = await getDb();

    const replications = CLOUD_SYNC_COLLECTIONS.map(colName => {
        return replicateRxCollection({
            collection: db[colName],
            replicationIdentifier: `wtfpos-neon-${colName}`,
            deletedField: '_deleted',

            pull: {
                async handler(checkpoint, batchSize) {
                    const res = await fetch(`${apiBase}/api/cloud/pull`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ collection: colName, checkpoint, batchSize })
                    });
                    return res.json();
                },
                batchSize: 100
            },

            push: {
                async handler(changeRows) {
                    const res = await fetch(`${apiBase}/api/cloud/push`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ collection: colName, changeRows })
                    });
                    return res.json(); // conflicts array
                },
                batchSize: 100
            },

            live: true,
            retryTime: 30_000 // 30s — cloud sync is less urgent than LAN sync
        });
    });

    return replications;
}
```

### The push endpoint (SvelteKit → Neon)

```ts
// src/routes/api/cloud/push/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNeonDb } from '$lib/server/neon';
import { getTableForCollection } from '$lib/db/neon-schema';

export const POST: RequestHandler = async ({ request }) => {
    const { collection, changeRows } = await request.json();
    const db = getNeonDb();
    const table = getTableForCollection(collection);
    if (!table) return json({ error: 'Unknown collection' }, { status: 400 });

    const conflicts: any[] = [];

    for (const row of changeRows) {
        const { newDocumentState } = row;

        // Convert camelCase RxDB document to snake_case Neon row
        const neonRow = toNeonRow(collection, newDocumentState);

        // Upsert: insert or update based on primary key
        // Use Drizzle's onConflictDoUpdate
        await db
            .insert(table)
            .values(neonRow)
            .onConflictDoUpdate({
                target: table.id,
                set: {
                    ...neonRow,
                    // Always update updatedAt to reflect the latest push
                }
            });
    }

    // Neon is append-mode for WTFPOS — we don't return conflicts
    // (Neon is not the master; RxDB is. Neon receives, doesn't arbitrate.)
    return json(conflicts);
};
```

### Field mapping (RxDB camelCase → Neon snake_case)

```ts
// src/lib/db/neon-field-map.ts

// Maps RxDB document fields to Neon column names
// Only non-trivial mappings needed — Drizzle handles the rest
export const FIELD_MAP: Record<string, Record<string, string>> = {
    orders: {
        orderType:       'order_type',
        customerName:    'customer_name',
        tableId:         'table_id',
        tableNumber:     'table_number',
        packageName:     'package_name',
        packageId:       'package_id',
        discountType:    'discount_type',
        discountPax:     'discount_pax',
        discountIds:     'discount_ids',
        discountAmount:  'discount_amount',
        vatAmount:       'vat_amount',
        cancelReason:    'cancel_reason',
        closedAt:        'closed_at',
        closedBy:        'closed_by',
        billPrinted:     'bill_printed',
        locationId:      'location_id',
        createdAt:       'created_at',
        updatedAt:       'updated_at',
        // _deleted maps to deleted column
    }
};

export function toNeonRow(collection: string, rxdbDoc: any): Record<string, any> {
    const map = FIELD_MAP[collection] ?? {};
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(rxdbDoc)) {
        if (key === '_deleted') {
            result.deleted = value;
            continue;
        }
        const neonKey = map[key] ?? toSnakeCase(key);
        result[neonKey] = value;
    }

    return result;
}

function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
```

---

## The Pull Direction (Neon → RxDB)

Most collections are **push-only** from RxDB to Neon. The pull direction is only needed for:
- `menu_items` — Admin makes a change via owner dashboard → all branches pull it
- `settings` — Future: system-wide configuration

For operational collections (orders, stock, etc.), Neon never sends data back to RxDB.

---

## Reports: Querying Neon Directly

Reports that span branches bypass RxDB entirely and query Neon:

```ts
// src/routes/reports/branch-comparison/+page.server.ts

import { getNeonDb } from '$lib/server/neon';
import { orders } from '$lib/db/neon-schema';
import { eq, gte, sql } from 'drizzle-orm';

export async function load() {
    const db = getNeonDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const summary = await db
        .select({
            locationId: orders.locationId,
            revenue: sql<number>`SUM(${orders.total})`,
            orderCount: sql<number>`COUNT(*)`,
            avgCheck: sql<number>`AVG(${orders.total})`
        })
        .from(orders)
        .where(
            and(
                eq(orders.status, 'paid'),
                gte(orders.createdAt, yesterday)
            )
        )
        .groupBy(orders.locationId);

    return { summary };
}
```

---

## Which Collections Sync to Neon

| Collection | Sync to Neon | Direction | Reason |
|---|---|---|---|
| `orders` | ✅ Yes | RxDB → Neon | Core analytics |
| `expenses` | ✅ Yes | RxDB → Neon | P&L analysis |
| `stock_items` | ✅ Yes | RxDB → Neon | Variance tracking |
| `deliveries` | ✅ Yes | RxDB → Neon | COGS tracking |
| `waste` | ✅ Yes | RxDB → Neon | Variance tracking |
| `adjustments` | ✅ Yes | RxDB → Neon | Audit trail |
| `stock_counts` | ✅ Yes | RxDB → Neon | Historical counts |
| `kds_history` | ✅ Yes | RxDB → Neon | Service analytics |
| `x_reads` | ✅ Yes | RxDB → Neon | BIR compliance archive |
| `audit_logs` | ✅ Yes | RxDB → Neon | Compliance |
| `menu_items` | ⚠️ Bidirectional | Both | Admin pushes changes |
| `tables` | ❌ No | — | Operational only, no analytics value |
| `kds_tickets` | ❌ No | — | Ephemeral; kds_history is the record |
| `devices` | ❌ No | — | Device-local |
| `session` | ❌ No | — | In-memory only |

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — preparation mode |
