# 3D Property Viewer — Phase 1 Implementation Plan

## Scope

This document covers **Phase 1 (Floor Grid MVP)** only. Phase 2 (unit interiors) and Phase 3 (smart features) are referenced but not detailed.

Phase 1 delivers:
- Drizzle schema + Neon migration for `floor_layout_items`
- RxDB collection + pull replication
- 2D DOM grid editor with drag-and-drop placement
- Basic 3D stacked view with Threlte
- Floor navigation and occupancy overlay

---

## Prerequisites Check

### Already installed (no action needed)

From `package.json`, these are already present:

- `three` ^0.171.0 — Three.js core
- `@threlte/core` ^8.0.0-next.41 — Threlte Svelte bindings
- `@threlte/extras` ^9.0.0-next.54 — OrbitControls, HTML overlays
- `@types/three` ^0.171.0 — TypeScript types

### Nothing to install for Phase 1

All required dependencies are already in the project. Threlte and Three.js are present. No `pnpm add` step is needed.

---

## Build Order Overview

```
Step 1  — Drizzle schema additions (schema.ts)
Step 2  — SQL migration script
Step 3  — RxDB schema (schemas.ts)
Step 4  — Transform function (transforms.ts)
Step 5  — Pull endpoint registration (pull/[collection]/+server.ts)
Step 6  — RxDB db registration (db/index.ts)
Step 7  — Replication registration (replication.ts)
Step 8  — RxDB stores (stores/collections.svelte.ts)
Step 9  — Optimistic write helpers (db/optimistic-floor-layout.ts)
Step 10 — Page server (routes/property/[id]/floorplan/+page.server.ts)
Step 11 — Grid editor component (FloorGrid.svelte)
Step 12 — Item sidebar component (ItemSidebar.svelte)
Step 13 — 3D viewer component (FloorViewer3D.svelte)
Step 14 — Page assembly (+page.svelte)
Step 15 — Wire into properties navigation
```

---

## Step 1 — Drizzle Schema Additions

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/server/schema.ts`

Add the two new enums and the `floorLayoutItems` table. Insert after the existing `automationJobStatusEnum` block and before the `notifications` table definition.

### Enums to add

```typescript
export const floorLayoutItemTypeEnum = pgEnum('floor_layout_item_type', [
	'RENTAL_UNIT',
	'CORRIDOR',
	'BATHROOM',
	'KITCHEN',
	'COMMON_ROOM',
	'STAIRWELL',
	'ELEVATOR',
	'STORAGE',
	'OFFICE',
	'CUSTOM'
]);
```

### Table to add

```typescript
export const floorLayoutItems = pgTable('floor_layout_items', {
	id: serial('id').primaryKey(),
	floorId: integer('floor_id')
		.notNull()
		.references(() => floors.id),
	rentalUnitId: integer('rental_unit_id').references(() => rentalUnit.id),
	itemType: floorLayoutItemTypeEnum('item_type').notNull(),
	gridX: integer('grid_x').notNull(),
	gridY: integer('grid_y').notNull(),
	gridW: integer('grid_w').notNull().default(2),
	gridH: integer('grid_h').notNull().default(2),
	label: text('label'),
	color: text('color'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});
```

Place the table definition after `automationLogs` and before the Better Auth re-export line at the bottom.

---

## Step 2 — SQL Migration Script

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/scripts/migrate/add-floor-layout-items.sql`

Create this file. Run it manually against Neon via the Neon console SQL editor or `psql`.

```sql
-- Migration: add floor_layout_items table
-- Run once against the Neon production database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'floor_layout_item_type') THEN
    CREATE TYPE floor_layout_item_type AS ENUM (
      'RENTAL_UNIT',
      'CORRIDOR',
      'BATHROOM',
      'KITCHEN',
      'COMMON_ROOM',
      'STAIRWELL',
      'ELEVATOR',
      'STORAGE',
      'OFFICE',
      'CUSTOM'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS floor_layout_items (
  id              serial PRIMARY KEY,
  floor_id        integer NOT NULL REFERENCES floors(id),
  rental_unit_id  integer REFERENCES rental_unit(id),
  item_type       floor_layout_item_type NOT NULL,
  grid_x          integer NOT NULL,
  grid_y          integer NOT NULL,
  grid_w          integer NOT NULL DEFAULT 2,
  grid_h          integer NOT NULL DEFAULT 2,
  label           text,
  color           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

-- Index for the most common query pattern: all items on a floor
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_floor_id
  ON floor_layout_items(floor_id);

-- Index for reverse lookup: which item links to a rental_unit
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_rental_unit_id
  ON floor_layout_items(rental_unit_id)
  WHERE rental_unit_id IS NOT NULL;

-- Index for checkpoint-based replication (updated_at + id cursor)
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_updated_at_id
  ON floor_layout_items(updated_at ASC, id ASC);
```

**How to run:** Paste into the Neon SQL console for the project's database. This is idempotent — safe to run more than once.

---

## Step 3 — RxDB Schema

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/db/schemas.ts`

Append after the `penaltyConfigSchema` block at the end of the file.

Key rules (from existing patterns in the file):
- `id` is `string` with `maxLength: 20` — Drizzle serial IDs must be coerced to strings
- Indexed fields must be scalar, required, and have `maxLength`/`minimum`/`maximum`
- Nullable fields use union type `['string', 'null']` — NOT indexed
- `deleted_at` is never indexed (SC36/DXE1 constraint documented in the schema file header)

```typescript
// ─── Floor Layout Items ──────────────────────────────────────────────────────

export const floorLayoutItemSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		floor_id: { type: 'string', maxLength: 20 },
		rental_unit_id: { type: ['string', 'null'] },
		item_type: { type: 'string', maxLength: 30 },
		grid_x: { type: 'number', minimum: -9999, maximum: 9999, multipleOf: 1 },
		grid_y: { type: 'number', minimum: -9999, maximum: 9999, multipleOf: 1 },
		grid_w: { type: 'number', minimum: 1, maximum: 999, multipleOf: 1 },
		grid_h: { type: 'number', minimum: 1, maximum: 999, multipleOf: 1 },
		label: { type: ['string', 'null'] },
		color: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] }
	},
	required: ['id', 'floor_id', 'item_type', 'grid_x', 'grid_y', 'grid_w', 'grid_h'],
	indexes: ['floor_id', 'item_type']
};
```

Note: `version: 0` because this is a new collection — no migration strategy needed.

---

## Step 4 — Transform Function

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/server/transforms.ts`

Append after the last existing transform function (`transformPenaltyConfig`).

```typescript
export function transformFloorLayoutItem(row: any) {
	return {
		id: sid(row.id),
		floor_id: sid(row.floorId),
		rental_unit_id: row.rentalUnitId != null ? sid(row.rentalUnitId) : null,
		item_type: row.itemType,
		grid_x: row.gridX,
		grid_y: row.gridY,
		grid_w: row.gridW,
		grid_h: row.gridH,
		label: row.label ?? null,
		color: row.color ?? null,
		created_at: ts(row.createdAt),
		updated_at: ts(row.updatedAt),
		deleted_at: ts(row.deletedAt)
	};
}
```

The `sid` and `ts` helpers are already defined at the top of that file — no new imports needed.

---

## Step 5 — Pull Endpoint Registration

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/api/rxdb/pull/[collection]/+server.ts`

This file has a `COLLECTIONS` record that maps collection name strings to table + transform + columns. Add an import and an entry.

**Add to the imports at the top:**

```typescript
import {
	// ... existing imports ...
	floorLayoutItems
} from '$lib/server/schema';
import {
	// ... existing imports ...
	transformFloorLayoutItem
} from '$lib/server/transforms';
```

**Add to the `COLLECTIONS` record:**

```typescript
floor_layout_items: {
	table: floorLayoutItems,
	transform: transformFloorLayoutItem,
	updatedAtCol: floorLayoutItems.updatedAt,
	idCol: floorLayoutItems.id
},
```

No other changes to this file — the existing query logic handles all collections identically.

---

## Step 6 — RxDB Database Registration

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/db/index.ts`

**Add to the imports from `./schemas`:**

```typescript
import {
	// ... existing imports ...
	floorLayoutItemSchema
} from './schemas';
```

**Add to the `COLLECTIONS` object** (the one passed to `db.addCollections`):

```typescript
const COLLECTIONS = {
	// ... existing collections ...
	floor_layout_items: col(floorLayoutItemSchema)
};
```

Note: `col()` is the local helper already defined in this file:
```typescript
const col = (schema: any) => ({
	schema,
	migrationStrategies: IDENTITY_MIGRATION,
	cleanup: { minimumDeletedTime: Infinity, autoStart: false }
});
```

Since `floorLayoutItemSchema` is `version: 0` (new collection), no migration strategy entry is needed. However, `IDENTITY_MIGRATION` is defined as `{ 1: (doc) => doc }` — it only applies to v0→v1, so you must pass an empty object `{}` for a v0 schema with no prior version:

```typescript
const col0 = (schema: any) => ({
	schema,
	migrationStrategies: {},
	cleanup: { minimumDeletedTime: Infinity, autoStart: false }
});

// Then in COLLECTIONS:
floor_layout_items: col0(floorLayoutItemSchema)
```

Add the `col0` helper alongside the existing `col` helper.

---

## Step 7 — Replication Registration

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/db/replication.ts`

The `floor_layout_items` collection should be **lazy** — it is only needed on the floor plan page, not on every page load. Follow the pattern of `expenses`, `budgets`, `penalty_configs`.

**Add to `LAZY_COLLECTIONS`:**

```typescript
const LAZY_COLLECTIONS = ['expenses', 'budgets', 'penalty_configs', 'floor_layout_items'];
```

**Add to `COLLECTION_DEPS`:**

```typescript
const COLLECTION_DEPS: Record<string, string[]> = {
	// ... existing entries ...
	floor_layout_items: ['floors', 'rental_units']
};
```

This ensures that when `floor_layout_items` is first synced, it automatically ensures `floors` and `rental_units` are fresh first (W8 pattern already implemented in `resyncCollection`).

---

## Step 8 — RxDB Store

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/stores/collections.svelte.ts`

Append after the `penaltyConfigsStore` export. This follows the lazy pattern exactly:

```typescript
export const floorLayoutItemsStore = createRxStore<any>('floor_layout_items', (db) => {
	ensureCollectionSynced('floor_layout_items');
	return db.floor_layout_items.find({ selector: { deleted_at: { $eq: null } } });
});
```

The page component will filter by `floor_id` client-side using a `$derived` Map lookup, following the same pattern as other stores that filter after fetching.

---

## Step 9 — Optimistic Write Helpers

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/lib/db/optimistic-floor-layout.ts` (new file)

This is a new file following the same pattern as `optimistic.ts` (tenants) and the other per-entity optimistic files.

```typescript
import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for floor_layout_items.
 * Pattern: write to RxDB immediately, background-resync from Neon to reconcile.
 */

export async function optimisticUpsertFloorLayoutItem(data: {
	id: number;
	floor_id: number;
	rental_unit_id?: number | null;
	item_type: string;
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	label?: string | null;
	color?: string | null;
}): Promise<(() => Promise<void>) | null> {
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.floor_layout_items.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.floor_layout_items.upsert({
			id: sid,
			floor_id: String(data.floor_id),
			rental_unit_id: data.rental_unit_id != null ? String(data.rental_unit_id) : null,
			item_type: data.item_type,
			grid_x: data.grid_x,
			grid_y: data.grid_y,
			grid_w: data.grid_w,
			grid_h: data.grid_h,
			label: data.label ?? null,
			color: data.color ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		syncStatus.addLog(`Optimistic: floor layout item #${data.id} → RxDB updated`, 'success');
	} catch (err) {
		syncStatus.addLog(
			`Optimistic: floor layout item upsert failed — ${err instanceof Error ? err.message : err}`,
			'error'
		);
		bgResync('floor_layout_items');
		return null;
	}
	bgResync('floor_layout_items');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.floor_layout_items.upsert(capturedSnapshot);
			} else {
				const doc = await db.floor_layout_items.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: floor layout item #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Floor layout item rollback failed:', err);
		}
	};
}

export async function optimisticDeleteFloorLayoutItem(itemId: number) {
	try {
		const db = await getDb();
		const doc = await db.floor_layout_items.findOne(String(itemId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			syncStatus.addLog(`Optimistic: floor layout item #${itemId} → soft-deleted`, 'success');
		}
	} catch (err) {
		syncStatus.addLog(
			`Optimistic: floor layout delete failed — ${err instanceof Error ? err.message : err}`,
			'error'
		);
	}
	bgResync('floor_layout_items');
}
```

---

## Step 10 — Page Server

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/+page.server.ts`

The server load function authenticates and provides the property ID. Data loading is client-side via RxDB (following the architecture where `+page.server.ts` only provides forms and auth).

```typescript
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { floorLayoutItems, floors, rentalUnit } from '$lib/server/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const propertyId = parseInt(params.id, 10);
	if (isNaN(propertyId)) throw error(400, 'Invalid property ID');

	return { propertyId };
};

export const actions: Actions = {
	/**
	 * Upsert a floor layout item (create or move/resize).
	 * Called by the grid editor after optimistic write succeeds.
	 */
	upsertItem: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const id = data.get('id') ? parseInt(data.get('id') as string, 10) : null;
		const floorId = parseInt(data.get('floor_id') as string, 10);
		const rentalUnitId = data.get('rental_unit_id')
			? parseInt(data.get('rental_unit_id') as string, 10)
			: null;
		const itemType = data.get('item_type') as string;
		const gridX = parseInt(data.get('grid_x') as string, 10);
		const gridY = parseInt(data.get('grid_y') as string, 10);
		const gridW = parseInt(data.get('grid_w') as string, 10);
		const gridH = parseInt(data.get('grid_h') as string, 10);
		const label = (data.get('label') as string) || null;
		const color = (data.get('color') as string) || null;

		if (id) {
			// Update existing
			const [updated] = await db
				.update(floorLayoutItems)
				.set({
					itemType: itemType as any,
					gridX,
					gridY,
					gridW,
					gridH,
					label,
					color,
					updatedAt: new Date()
				})
				.where(and(eq(floorLayoutItems.id, id), isNull(floorLayoutItems.deletedAt)))
				.returning();
			return { item: updated };
		} else {
			// Insert new
			const [inserted] = await db
				.insert(floorLayoutItems)
				.values({
					floorId,
					rentalUnitId,
					itemType: itemType as any,
					gridX,
					gridY,
					gridW,
					gridH,
					label,
					color
				})
				.returning();
			return { item: inserted };
		}
	},

	/**
	 * Soft-delete a floor layout item (returns it to the unplaced sidebar).
	 */
	deleteItem: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) throw error(400, 'Invalid item ID');

		await db
			.update(floorLayoutItems)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(floorLayoutItems.id, id));

		return { deleted: true };
	}
};
```

---

## Step 11 — Grid Editor Component

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/FloorGrid.svelte`

This is the DOM-based 2D grid editor. It receives placed items and unplaced units as props and emits events.

### Architecture

```
FloorGrid.svelte
  props:
    items: FloorLayoutItem[]       — already placed items (from RxDB, filtered by floor)
    unplacedUnits: RentalUnit[]    — units with no item in this floor
    floorId: number
    readonly?: boolean
  events (callback props):
    onPlace(item): void            — new item placed, call optimistic upsert
    onMove(item): void             — item moved or resized
    onDelete(itemId): void         — item removed, call optimistic delete
```

### Key state

```typescript
// Internal grid state
let cellSize = $state(64);                          // px per cell (64px default)
let gridCols = $state(12);                          // auto-expands
let gridRows = $state(8);                           // auto-expands
let selectedId = $state<string | null>(null);       // selected item id
let dragState = $state<DragState | null>(null);     // active drag
let mode = $state<'select' | 'paint'>('select');    // tool mode
let paintType = $state<string>('CORRIDOR');         // active paint type

// Undo history — 20-step ring buffer
let history = $state<FloorLayoutItem[][]>([]);
let historyIndex = $state(-1);
```

### Overlap detection utility

```typescript
function overlaps(a: GridRect, b: GridRect): boolean {
	return (
		a.grid_x < b.grid_x + b.grid_w &&
		a.grid_x + a.grid_w > b.grid_x &&
		a.grid_y < b.grid_y + b.grid_h &&
		a.grid_y + a.grid_h > b.grid_y
	);
}

function hasOverlap(candidate: GridRect, items: FloorLayoutItem[], excludeId?: string): boolean {
	return items.some(
		(item) => item.id !== excludeId && overlaps(candidate, item)
	);
}
```

### Auto-size formula for dropped rental units

```typescript
function autoSize(capacity: number): { w: number; h: number } {
	if (capacity <= 2) return { w: 2, h: 2 };
	if (capacity <= 4) return { w: 3, h: 2 };
	return { w: 4, h: 3 };
}
```

### Grid auto-expand

When an item is placed within 1 cell of the edge, expand that dimension by 4 cells:

```typescript
function maybeExpand(x: number, y: number, w: number, h: number) {
	if (x + w >= gridCols - 1) gridCols += 4;
	if (y + h >= gridRows - 1) gridRows += 4;
}
```

### Drag-and-drop strategy

Use the HTML5 Drag and Drop API (`draggable`, `ondragstart`, `ondragover`, `ondrop`). Grid cells are `<div>` elements. On drop:

1. Calculate target cell from `event.offsetX / cellSize` within the grid container
2. Check overlap — if invalid, show red ghost and reject drop
3. If valid, call `onPlace` or `onMove` callback with the new position
4. Call `optimisticUpsertFloorLayoutItem` from the parent page

### Keyboard shortcuts

```typescript
function handleKeydown(e: KeyboardEvent) {
	if (e.ctrlKey && e.key === 'z') undo();
	if (e.key === 'Delete' && selectedId) deleteSelected();
	if (e.key === 'Escape') selectedId = null;
}
```

### Component template structure

```html
<div class="flex h-full gap-4" onkeydown={handleKeydown} tabindex="-1">
  <!-- Tool palette bar -->
  <div class="flex flex-col gap-2 p-2 border-r">
    <!-- Select / Paint mode toggle -->
    <!-- Paint type selector (CORRIDOR, BATHROOM, etc.) -->
  </div>

  <!-- Grid canvas -->
  <div class="relative overflow-auto flex-1">
    <div
      class="relative"
      style="width: {gridCols * cellSize}px; height: {gridRows * cellSize}px;"
      ondragover={handleDragOver}
      ondrop={handleDrop}
    >
      <!-- Background grid lines via CSS grid or SVG -->
      <div class="absolute inset-0 grid pointer-events-none"
           style="grid-template-columns: repeat({gridCols}, {cellSize}px)">
        {#each Array(gridCols * gridRows) as _, i}
          <div class="border border-border/20"></div>
        {/each}
      </div>

      <!-- Placed items -->
      {#each items as item (item.id)}
        <FloorGridItem
          {item}
          {cellSize}
          selected={selectedId === item.id}
          onSelect={() => selectedId = item.id}
          onResizeStart={handleResizeStart}
        />
      {/each}

      <!-- Drag ghost -->
      {#if dragState?.ghost}
        <div
          class="absolute pointer-events-none opacity-50 rounded border-2"
          class:border-green-500={!dragState.isOverlap}
          class:border-red-500={dragState.isOverlap}
          class:bg-green-100={!dragState.isOverlap}
          class:bg-red-100={dragState.isOverlap}
          style="
            left: {dragState.ghost.x * cellSize}px;
            top: {dragState.ghost.y * cellSize}px;
            width: {dragState.ghost.w * cellSize}px;
            height: {dragState.ghost.h * cellSize}px;
          "
        ></div>
      {/if}
    </div>
  </div>
</div>
```

---

## Step 12 — Item Sidebar Component

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/ItemSidebar.svelte`

```
ItemSidebar.svelte
  props:
    unplacedUnits: RentalUnit[]
    floorId: number
    placedCount: number
    totalCount: number
    onDragStart(unit): void        — passes drag data to FloorGrid
```

Displays:
- Progress counter: "4 of 12 placed"
- List of unplaced units, each draggable
- Units with `rental_unit_status: 'OCCUPIED'` show a colored dot

```html
<div class="w-64 flex flex-col gap-3 p-4 border-r overflow-y-auto">
  <div class="text-sm text-muted-foreground">
    {placedCount} of {totalCount} placed
  </div>
  <div class="w-full bg-secondary rounded-full h-2">
    <div
      class="bg-primary h-2 rounded-full transition-all"
      style="width: {(placedCount / totalCount) * 100}%"
    ></div>
  </div>

  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2">
    Unplaced Units
  </p>

  {#each unplacedUnits as unit (unit.id)}
    <div
      class="p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing
             hover:border-primary transition-colors"
      draggable="true"
      ondragstart={(e) => onDragStart(unit)}
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{unit.name}</span>
        <span class="text-xs text-muted-foreground">cap. {unit.capacity}</span>
      </div>
      <div class="text-xs text-muted-foreground mt-0.5">{unit.type}</div>
    </div>
  {/each}

  {#if unplacedUnits.length === 0}
    <p class="text-sm text-muted-foreground text-center mt-4">
      All units placed
    </p>
  {/if}
</div>
```

---

## Step 13 — 3D Viewer Component

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/FloorViewer3D.svelte`

Uses Threlte. Each floor is rendered as a stacked slab with units as colored extruded boxes on top.

### Threlte version note

The installed version is `@threlte/core` ^8.0.0-next.41 (pre-release). The import paths for this version use `@threlte/core` and `@threlte/extras` directly. Check Threlte docs for the exact `next` API, but the pattern below matches the stable API which is backward-compatible.

### Component structure

```html
<script lang="ts">
  import { Canvas } from '@threlte/core';
  import FloorScene from './FloorScene.svelte';

  let {
    floors,           // Floor[] from RxDB, sorted by floor_number
    allItems,         // FloorLayoutItem[] — all items across all floors
    rentalUnits,      // RentalUnit[] — for labeling
    leases,           // Lease[] — for occupancy coloring
    selectedFloorId,  // number | null — highlighted floor
    onUnitClick       // (rentalUnitId: string) => void
  } = $props();

  // Camera defaults: isometric-ish perspective
  const CAMERA_POSITION: [number, number, number] = [20, 25, 20];
</script>

<div class="w-full h-full rounded-lg overflow-hidden border">
  <Canvas>
    <FloorScene
      {floors}
      {allItems}
      {rentalUnits}
      {leases}
      {selectedFloorId}
      {onUnitClick}
    />
  </Canvas>
</div>
```

### Scene component

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/FloorScene.svelte`

```html
<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';

  let { floors, allItems, rentalUnits, leases, selectedFloorId, onUnitClick } = $props();

  // Grid cell size in Three.js units (1 unit = 1 cell)
  const CELL = 1;
  // Floor vertical separation
  const FLOOR_HEIGHT = 4;
  // Unit extrusion height
  const UNIT_HEIGHT = 2.5;
  // Common area extrusion height
  const AREA_HEIGHT = 0.2;

  // Derived: build a Map<floor_id, FloorLayoutItem[]>
  let itemsByFloor = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const item of allItems) {
      const list = map.get(item.floor_id) ?? [];
      list.push(item);
      map.set(item.floor_id, list);
    }
    return map;
  });

  // Derived: occupancy map — rental_unit_id → 'VACANT' | 'OCCUPIED' | 'RESERVED'
  let occupancyMap = $derived.by(() => {
    const map = new Map<string, string>();
    for (const unit of rentalUnits) {
      map.set(unit.id, unit.rental_unit_status);
    }
    return map;
  });

  // Color by occupancy status
  function unitColor(item: any): string {
    if (item.item_type !== 'RENTAL_UNIT') return '#94a3b8'; // slate-400 for common areas
    if (item.color) return item.color;
    const status = occupancyMap.get(item.rental_unit_id ?? '');
    if (status === 'OCCUPIED') return '#ef4444';  // red-500
    if (status === 'RESERVED') return '#eab308'; // yellow-500
    return '#22c55e';                             // green-500 (VACANT)
  }

  // Sorted floors by floor_number ascending
  let sortedFloors = $derived(
    [...floors].sort((a, b) => a.floor_number - b.floor_number)
  );
</script>

<!-- Ambient + directional lighting -->
<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[10, 20, 10]} intensity={1} castShadow />

<!-- Camera + orbit controls -->
<T.PerspectiveCamera makeDefault position={[20, 25, 20]} fov={50}>
  <OrbitControls enablePan enableZoom minDistance={5} maxDistance={80} />
</T.PerspectiveCamera>

<!-- Floor slabs + items -->
{#each sortedFloors as floor, floorIndex (floor.id)}
  {@const yBase = floorIndex * FLOOR_HEIGHT}
  {@const items = itemsByFloor.get(floor.id) ?? []}
  {@const isSelected = String(floor.id) === String(selectedFloorId)}

  <!-- Floor slab -->
  <T.Mesh
    position={[0, yBase - 0.1, 0]}
    receiveShadow
  >
    <T.BoxGeometry args={[40, 0.2, 30]} />
    <T.MeshStandardMaterial
      color={isSelected ? '#dbeafe' : '#f8fafc'}
      opacity={0.8}
      transparent
    />
  </T.Mesh>

  <!-- Items on this floor -->
  {#each items as item (item.id)}
    {@const isUnit = item.item_type === 'RENTAL_UNIT'}
    {@const h = isUnit ? UNIT_HEIGHT : AREA_HEIGHT}
    {@const cx = item.grid_x + item.grid_w / 2}
    {@const cz = item.grid_y + item.grid_h / 2}
    {@const color = unitColor(item)}

    <T.Mesh
      position={[cx * CELL, yBase + h / 2, cz * CELL]}
      castShadow
      receiveShadow
      onclick={() => {
        if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
      }}
    >
      <T.BoxGeometry args={[item.grid_w * CELL - 0.1, h, item.grid_h * CELL - 0.1]} />
      <T.MeshStandardMaterial {color} />
    </T.Mesh>
  {/each}
{/each}
```

---

## Step 14 — Page Assembly

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/+page.svelte`

This is the main page component. It wires together the stores, floor selector, grid editor, 3D toggle, and detail panel.

```html
<script lang="ts">
  import { floorLayoutItemsStore } from '$lib/stores/collections.svelte';
  import { floorsStore, rentalUnitsStore, leasesStore } from '$lib/stores/collections.svelte';
  import { optimisticUpsertFloorLayoutItem, optimisticDeleteFloorLayoutItem }
    from '$lib/db/optimistic-floor-layout';
  import FloorGrid from './FloorGrid.svelte';
  import ItemSidebar from './ItemSidebar.svelte';
  import FloorViewer3D from './FloorViewer3D.svelte';

  let { data } = $props();
  const { propertyId } = data;

  // View mode
  let viewMode = $state<'2d' | '3d'>('2d');

  // Selected floor (default to first floor)
  let selectedFloorId = $state<string | null>(null);

  // Floors for this property
  let propertyFloors = $derived(
    floorsStore.value.filter((f) => f.property_id === String(propertyId))
      .sort((a, b) => a.floor_number - b.floor_number)
  );

  // Auto-select first floor when floors load
  $effect(() => {
    if (propertyFloors.length > 0 && !selectedFloorId) {
      selectedFloorId = propertyFloors[0].id;
    }
  });

  // Items on the current floor
  let currentFloorItems = $derived(
    floorLayoutItemsStore.value.filter((i) => i.floor_id === selectedFloorId)
  );

  // All units for this property
  let propertyUnits = $derived(
    rentalUnitsStore.value.filter((u) => u.property_id === String(propertyId))
  );

  // Set of rental_unit_ids that are placed on this floor
  let placedUnitIds = $derived(
    new Set(
      currentFloorItems
        .filter((i) => i.item_type === 'RENTAL_UNIT' && i.rental_unit_id)
        .map((i) => i.rental_unit_id)
    )
  );

  // Unplaced units = units on this floor not yet placed on this floor's grid
  let unplacedUnits = $derived(
    propertyUnits.filter(
      (u) => u.floor_id === selectedFloorId && !placedUnitIds.has(u.id)
    )
  );

  let placedCount = $derived(placedUnitIds.size);
  let totalCount = $derived(
    propertyUnits.filter((u) => u.floor_id === selectedFloorId).length
  );

  // Server action for persistence (fire-and-forget after optimistic write)
  async function handlePlace(item: any) {
    await optimisticUpsertFloorLayoutItem(item);
    // Server action submit via fetch (or superform action)
    // The optimistic write is the source of truth for the UI;
    // the background resync reconciles with Neon after confirmation.
  }

  async function handleDelete(itemId: string) {
    await optimisticDeleteFloorLayoutItem(parseInt(itemId, 10));
  }
</script>

<div class="flex flex-col h-screen overflow-hidden">
  <!-- Header bar -->
  <div class="flex items-center gap-4 px-6 py-3 border-b bg-background">
    <h1 class="text-lg font-semibold">Floor Plan</h1>

    <!-- Floor tabs -->
    <div class="flex gap-1 ml-4">
      {#each propertyFloors as floor (floor.id)}
        <button
          class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          class:bg-primary={selectedFloorId === floor.id}
          class:text-primary-foreground={selectedFloorId === floor.id}
          class:bg-secondary={selectedFloorId !== floor.id}
          onclick={() => selectedFloorId = floor.id}
        >
          Floor {floor.floor_number}
          {#if floor.wing} · {floor.wing}{/if}
        </button>
      {/each}
    </div>

    <!-- 2D / 3D toggle -->
    <div class="ml-auto flex rounded-md border overflow-hidden">
      <button
        class="px-3 py-1.5 text-sm transition-colors"
        class:bg-primary={viewMode === '2d'}
        class:text-primary-foreground={viewMode === '2d'}
        onclick={() => viewMode = '2d'}
      >
        2D
      </button>
      <button
        class="px-3 py-1.5 text-sm transition-colors"
        class:bg-primary={viewMode === '3d'}
        class:text-primary-foreground={viewMode === '3d'}
        onclick={() => viewMode = '3d'}
      >
        3D
      </button>
    </div>
  </div>

  <!-- Main content -->
  <div class="flex flex-1 overflow-hidden">
    {#if viewMode === '2d'}
      <!-- Unplaced units sidebar -->
      <ItemSidebar
        {unplacedUnits}
        floorId={parseInt(selectedFloorId ?? '0', 10)}
        {placedCount}
        {totalCount}
      />

      <!-- Grid editor -->
      <div class="flex-1 overflow-hidden">
        {#if !floorLayoutItemsStore.initialized}
          <!-- Skeleton while RxDB hydrates -->
          <div class="h-full flex items-center justify-center text-muted-foreground">
            Loading floor plan...
          </div>
        {:else if selectedFloorId}
          <FloorGrid
            items={currentFloorItems}
            {unplacedUnits}
            floorId={parseInt(selectedFloorId, 10)}
            onPlace={handlePlace}
            onMove={handlePlace}
            onDelete={handleDelete}
          />
        {/if}
      </div>
    {:else}
      <!-- 3D viewer fills remaining space -->
      <div class="flex-1 overflow-hidden">
        <FloorViewer3D
          floors={propertyFloors}
          allItems={floorLayoutItemsStore.value}
          rentalUnits={propertyUnits}
          leases={leasesStore.value}
          {selectedFloorId}
          onUnitClick={(unitId) => {
            // Navigate to lease for this unit or show detail panel
            console.log('unit clicked:', unitId);
          }}
        />
      </div>
    {/if}
  </div>
</div>
```

---

## Step 15 — Wire into Navigation

### Option A: Tab within property detail page

If the property detail page already exists at `/properties/[id]`, add a "Floor Plan" tab to its navigation. The tab links to `/property/[id]/floorplan`.

### Option B: Link from properties list

In `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/properties/+page.svelte`, add a "Floor Plan" button to each property card:

```html
<a href="/property/{property.id}/floorplan"
   class="btn btn-sm btn-outline">
  Floor Plan
</a>
```

### Route file to create

The SvelteKit route requires this directory structure:

```
src/routes/property/[id]/floorplan/
  +page.server.ts         (Step 10)
  +page.svelte            (Step 14)
  FloorGrid.svelte        (Step 11)
  FloorGridItem.svelte    (see below)
  ItemSidebar.svelte      (Step 12)
  FloorViewer3D.svelte    (Step 13)
  FloorScene.svelte       (Step 13 sub-component)
  types.ts                (shared types)
```

---

## Step 16 — FloorGridItem Sub-Component

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/FloorGridItem.svelte`

Renders a single placed item on the grid with selection state and resize handles.

```html
<script lang="ts">
  let { item, cellSize, selected, onSelect, onResizeStart } = $props();

  // Item type display labels
  const TYPE_LABELS: Record<string, string> = {
    RENTAL_UNIT: '',       // Use item.label or unit name
    CORRIDOR: 'Corridor',
    BATHROOM: 'Bathroom',
    KITCHEN: 'Kitchen',
    COMMON_ROOM: 'Common',
    STAIRWELL: 'Stairs',
    ELEVATOR: 'Elevator',
    STORAGE: 'Storage',
    OFFICE: 'Office',
    CUSTOM: item.label ?? 'Custom'
  };

  // Background colors by type (Tailwind classes — no opacity modifier syntax)
  const TYPE_COLORS: Record<string, string> = {
    RENTAL_UNIT: 'bg-blue-100 border-blue-300',
    CORRIDOR: 'bg-gray-100 border-gray-300',
    BATHROOM: 'bg-cyan-100 border-cyan-300',
    KITCHEN: 'bg-orange-100 border-orange-300',
    COMMON_ROOM: 'bg-purple-100 border-purple-300',
    STAIRWELL: 'bg-yellow-100 border-yellow-300',
    ELEVATOR: 'bg-yellow-100 border-yellow-300',
    STORAGE: 'bg-stone-100 border-stone-300',
    OFFICE: 'bg-green-100 border-green-300',
    CUSTOM: 'bg-slate-100 border-slate-300'
  };

  let colorClass = $derived(TYPE_COLORS[item.item_type] ?? 'bg-slate-100 border-slate-300');
  let label = $derived(item.label ?? TYPE_LABELS[item.item_type] ?? item.item_type);
</script>

<div
  class="absolute rounded border-2 cursor-pointer select-none overflow-hidden
         flex items-center justify-center text-xs font-medium
         transition-shadow hover:shadow-md
         {colorClass}
         {selected ? 'ring-2 ring-primary ring-offset-1' : ''}"
  style="
    left: {item.grid_x * cellSize + 1}px;
    top: {item.grid_y * cellSize + 1}px;
    width: {item.grid_w * cellSize - 2}px;
    height: {item.grid_h * cellSize - 2}px;
  "
  onclick={() => onSelect()}
  draggable="true"
>
  <span class="text-center leading-tight px-1">{label}</span>

  <!-- Resize handle (bottom-right corner) — only visible when selected -->
  {#if selected}
    <div
      class="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-tl cursor-se-resize"
      onmousedown={(e) => { e.stopPropagation(); onResizeStart(item, e); }}
    ></div>
  {/if}
</div>
```

---

## Step 17 — Types File

File: `/Users/arjomagno/Documents/GitHub/midcodes/apps/dorm/src/routes/property/[id]/floorplan/types.ts`

```typescript
export type FloorLayoutItemType =
	| 'RENTAL_UNIT'
	| 'CORRIDOR'
	| 'BATHROOM'
	| 'KITCHEN'
	| 'COMMON_ROOM'
	| 'STAIRWELL'
	| 'ELEVATOR'
	| 'STORAGE'
	| 'OFFICE'
	| 'CUSTOM';

export interface FloorLayoutItem {
	id: string;
	floor_id: string;
	rental_unit_id: string | null;
	item_type: FloorLayoutItemType;
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	label: string | null;
	color: string | null;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
}

export interface GridRect {
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	id?: string;
}

export interface DragState {
	ghost: { x: number; y: number; w: number; h: number } | null;
	isOverlap: boolean;
	sourceUnit?: any;
	sourceItem?: FloorLayoutItem;
}
```

---

## Risk Assessment

### Risk 1: Threlte pre-release API instability

**Impact:** Medium. `@threlte/core` ^8.0.0-next.41 is a pre-release. API surface for `<T.Mesh>` click handlers and `<OrbitControls>` may differ from stable docs.

**Mitigation:** Check the actual installed version with `cat node_modules/@threlte/core/package.json | grep '"version"'` before writing 3D components. The Threlte GitHub README for the `next` branch is the authoritative reference. The `onclick` prop on `<T.Mesh>` is available as of Threlte 7+ via the `interactivity()` plugin — confirm it is registered.

**Fallback:** If `onclick` on meshes is not supported in the installed pre-release, use a raycaster approach with a global `onclick` on the `<Canvas>` element.

### Risk 2: IndexedDB quota on the new collection

**Impact:** Low. `floor_layout_items` rows are small (no blobs). A building with 50 units across 5 floors creates at most ~300 rows including common areas.

**Mitigation:** None required. The existing pruning and storage monitor infrastructure applies automatically.

### Risk 3: `col0` helper — no migration for version 0

**Impact:** High if missed. If `IDENTITY_MIGRATION` (which only defines strategy `1`) is used for a `version: 0` schema, RxDB will throw an error about missing migration strategy for version 0→0 or similar.

**Mitigation:** The `col0` helper with `migrationStrategies: {}` is the correct pattern for new collections starting at version 0. This is explicit in Step 6.

### Risk 4: Drag-and-drop on touch devices

**Impact:** Low for Phase 1 (admin tool, likely desktop). HTML5 DnD is not supported on mobile Safari/Chrome without a polyfill.

**Mitigation:** Defer to Phase 3. Add a note in the component that touch support requires a DnD polyfill (e.g., `@formkit/drag-and-drop` or `SortableJS`).

### Risk 5: Server action vs. optimistic write ordering

**Impact:** Medium. If the server action fails after the optimistic write, the UI shows a state that Neon doesn't have. The background `resyncCollection` call will revert it, but there is a brief inconsistency window.

**Mitigation:** Already handled by the rollback function returned from `optimisticUpsertFloorLayoutItem`. The page should call the rollback if the server action returns an error. Example:

```typescript
const rollback = await optimisticUpsertFloorLayoutItem(item);
const result = await fetch(/* server action */);
if (!result.ok && rollback) await rollback();
```

---

## Complete File Checklist

### Files to modify (existing)

| File | Change |
|------|--------|
| `src/lib/server/schema.ts` | Add `floorLayoutItemTypeEnum` + `floorLayoutItems` table |
| `src/lib/server/transforms.ts` | Add `transformFloorLayoutItem` function |
| `src/lib/db/schemas.ts` | Add `floorLayoutItemSchema` |
| `src/lib/db/index.ts` | Import schema, add `col0` helper, register collection |
| `src/lib/db/replication.ts` | Add to `LAZY_COLLECTIONS` and `COLLECTION_DEPS` |
| `src/lib/stores/collections.svelte.ts` | Add `floorLayoutItemsStore` export |
| `src/routes/api/rxdb/pull/[collection]/+server.ts` | Import table + transform, add to `COLLECTIONS` |

### Files to create (new)

| File | Purpose |
|------|---------|
| `scripts/migrate/add-floor-layout-items.sql` | One-time Neon migration |
| `src/lib/db/optimistic-floor-layout.ts` | Optimistic write helpers |
| `src/routes/property/[id]/floorplan/+page.server.ts` | Auth + form actions |
| `src/routes/property/[id]/floorplan/+page.svelte` | Page assembly |
| `src/routes/property/[id]/floorplan/types.ts` | Shared TypeScript types |
| `src/routes/property/[id]/floorplan/FloorGrid.svelte` | 2D grid editor |
| `src/routes/property/[id]/floorplan/FloorGridItem.svelte` | Single placed item |
| `src/routes/property/[id]/floorplan/ItemSidebar.svelte` | Unplaced units list |
| `src/routes/property/[id]/floorplan/FloorViewer3D.svelte` | 3D viewer shell |
| `src/routes/property/[id]/floorplan/FloorScene.svelte` | Threlte scene |

---

## Implementation Sequence (Recommended Order)

Execute these in order. Each step builds on the previous.

1. Run the SQL migration against Neon (Step 2). Verify with `SELECT * FROM floor_layout_items LIMIT 1`.
2. Add Drizzle schema definition (Step 1). Run `pnpm -F dorm check` — expect no new type errors.
3. Add transform (Step 4) and register in pull endpoint (Step 5). Test with `GET /api/rxdb/pull/floor_layout_items?updatedAt=1970-01-01T00:00:00Z&id=0&limit=10` — expect `{ documents: [], checkpoint: {...} }`.
4. Add RxDB schema (Step 3), db registration (Step 6), replication (Step 7), and store (Step 8).
5. Create the optimistic helpers file (Step 9).
6. Create all route files (Steps 10–14, 16–17).
7. Link from the properties list (Step 15).
8. Run `pnpm -F dorm check` to verify types end-to-end.
9. `pnpm -F dorm dev` and test the floor plan page manually.

---

## Phase 2 Preview (Not Implemented Here)

When ready to implement unit interiors:

- Add `unitLayoutItemTypeEnum` and `unitLayoutItems` Drizzle table (same pattern)
- Add `unit_layout_item_type` SQL enum and `unit_layout_items` SQL table
- Add `unitLayoutItemSchema` to `schemas.ts` (version 0)
- Add `transformUnitLayoutItem` to `transforms.ts`
- Register `unit_layout_items` as a lazy collection
- Create `UnitInteriorGrid.svelte` — same DOM grid pattern but with furniture palette
- Route: clicking a placed RENTAL_UNIT item on the floor grid navigates to interior view
- Breadcrumb: Property > Floor N > Unit Name
- Furniture items have `rotation` field — add 90° rotation with `R` key shortcut

The `unit_layout_items.metadata` jsonb field stores bed-specific data (`bed_number`, `capacity_slot`) for Phase 3 tenant linking.
