# Floor Plan Editor - 9 Feature Implementation Plan

**Target directory:** `src/routes/property/[id]/floorplan/`
**Constraint:** No DB schema changes. No Svelte legacy stores. `pnpm check` must pass at 0 errors.

---

## Codebase Orientation

### File map (all paths relative to `src/routes/property/[id]/floorplan/`)

| File | Role |
|---|---|
| `wallEngine.ts` | Pure TS: wall Set encoding, flood-fill room detection, edge/line conversion |
| `types.ts` | Shared TypeScript interfaces and constants (`FloorLayoutItemType`, `EditorMode`, etc.) |
| `FloorGrid.svelte` | 2D SVG grid: wall drawing, room detection rendering, assignment popup |
| `FloorScene.svelte` | Threlte 3D scene: wall box meshes, room floor tiles, camera animation |
| `FloorViewer3D.svelte` | Thin canvas wrapper around `FloorScene.svelte` |
| `ItemSidebar.svelte` | Left sidebar: tool toggle, unit list, instructions |
| `+page.svelte` | Orchestrator: RxDB stores, pending change queue, save/discard |
| `+page.server.ts` | Server actions: `upsertItem`, `batchWalls`, `deleteItem` |

### Key data flow

```
RxDB (currentFloorItems)
  → FloorGrid: wallItems → itemsToWallSet() → wallSet → edgesToLines() → SVG
  → FloorGrid: wallSet → detectRooms() → detectedRooms → room fills + labels
  → FloorScene: wallItems → itemsToWallSet() → edgesToLines() → BoxGeometry meshes
```

### Wall storage encoding in `floor_layout_items`

```
N edge (q, r): grid_x=q, grid_y=r, grid_w=0, grid_h=1
W edge (q, r): grid_x=q, grid_y=r, grid_w=1, grid_h=0
```

The `label` column is `string | null` — currently unused for WALL items. Features 2, 3, and 7 use it as a JSON payload.

---

## Build Order and Dependency Graph

```
Independent (can be built in parallel):
  Feature 4 (Thick walls)       — SVG rendering only, no data model changes
  Feature 5 (Room area)         — roomLabel() extension only
  Feature 8 (Alignment guides)  — drawing state extension only
  Feature 9 (Stairwell/elevator symbols) — rendering only

After Feature 4 is done:
  Feature 2 (Doors)             — extends thick-wall rendering + wallEngine
  Feature 3 (Windows)           — extends thick-wall rendering + wallEngine (parallel with F2)

After Features 2 and 3 are done:
  Feature 7 (Wall color)        — extends the door/window label JSON pattern

Feature 1 (Undo/Redo) can be built at any point — touches +page.svelte and FloorGrid.svelte only
Feature 6 (PNG export) can be built at any point — standalone export utility
```

### Recommended sprint order

| Sprint | Features | Rationale |
|---|---|---|
| 1 | 4, 5, 8, 9 | Rendering-only, zero risk, no data model changes |
| 2 | 1, 6 | UX improvements, independent of other features |
| 3 | 2, 3 | Metadata on walls, depends on thick-wall rendering from F4 |
| 4 | 7 | Extends door/window label JSON pattern from F2/F3 |

---

## Data Model

No new tables. All metadata lives in `floor_layout_items.label` as a JSON string for WALL rows.

### Label JSON schema for WALL items

```typescript
// src/routes/property/[id]/floorplan/wallEngine.ts — add near top

export interface WallMeta {
  door?: 'single' | 'double' | 'sliding';
  swing?: 'left' | 'right' | 'both';
  window?: 'standard' | 'bay' | 'transom';
  sill?: number;       // meters from floor, e.g. 0.9
  color?: string;      // hex string, e.g. '#ff0000'
}

export function parseWallMeta(label: string | null): WallMeta {
  if (!label) return {};
  try { return JSON.parse(label); } catch { return {}; }
}

export function serializeWallMeta(meta: WallMeta): string | null {
  const keys = Object.keys(meta);
  if (keys.length === 0) return null;
  return JSON.stringify(meta);
}
```

The existing `+page.server.ts` `batchWalls` action already passes `label` through when doing upserts via `upsertItem`. The `batchWalls` action currently hard-codes no label on inserts — we will extend it in Features 2, 3, and 7 by adding a `label` field to the `add` array elements.

---

## Feature 1: Undo/Redo

### Overview

Snapshot the entire editor state (wall edge keys + room assignment items) before each committed gesture. Maintain two stacks: undo (max 50 entries) and redo. Ctrl+Z / Ctrl+Shift+Z operate on these stacks. The snapshot is taken in `+page.svelte` before each `handleWallAdd`, `handleWallRemove`, `handleRoomAssign`, `handleRoomClear` call, then applied by diffing snapshot-vs-current and calling the existing RxDB optimistic helpers.

### File changes

**`+page.svelte`** — primary implementation site

```typescript
// State additions at top of <script>
interface EditorSnapshot {
  wallKeys: string[];            // all canonical edge keys at time of snapshot
  assignments: {                 // non-WALL items
    id: string;
    item_type: string;
    grid_x: number; grid_y: number; grid_w: number; grid_h: number;
    rental_unit_id: string | null;
    label: string | null;
    color: string | null;
  }[];
}

const UNDO_LIMIT = 50;
let undoStack = $state<EditorSnapshot[]>([]);
let redoStack = $state<EditorSnapshot[]>([]);

function captureSnapshot(): EditorSnapshot {
  const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
  const wallSet = itemsToWallSet(wallItems as unknown as WallStorageItem[]);
  return {
    wallKeys: [...wallSet],
    assignments: currentFloorItems
      .filter((i: any) => i.item_type !== 'WALL')
      .map((i: any) => ({
        id: i.id,
        item_type: i.item_type,
        grid_x: i.grid_x, grid_y: i.grid_y,
        grid_w: i.grid_w, grid_h: i.grid_h,
        rental_unit_id: i.rental_unit_id ?? null,
        label: i.label ?? null,
        color: i.color ?? null
      }))
  };
}

function pushUndo(snapshot: EditorSnapshot) {
  undoStack = [...undoStack.slice(-UNDO_LIMIT + 1), snapshot];
  redoStack = [];   // any new gesture clears redo
}

async function applySnapshot(snapshot: EditorSnapshot) {
  // 1. Compute wall diff: snapshot → current → remove extras, add missing
  const snapshotSet = new Set(snapshot.wallKeys);
  const currentWallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
  const currentSet = itemsToWallSet(currentWallItems as unknown as WallStorageItem[]);

  const toAdd: WallEdge[] = [];
  const toRemove: WallEdge[] = [];

  for (const key of snapshotSet) {
    if (!currentSet.has(key)) toAdd.push(parseEdgeKey(key));
  }
  for (const key of currentSet) {
    if (!snapshotSet.has(key)) toRemove.push(parseEdgeKey(key));
  }

  // 2. Apply wall changes via existing handlers (they handle RxDB + pending queue)
  if (toAdd.length > 0) await handleWallAdd(toAdd);
  if (toRemove.length > 0) await handleWallRemove(toRemove);

  // 3. Apply assignment diff
  const snapshotAssignKeys = new Set(snapshot.assignments.map(a =>
    `${a.grid_x},${a.grid_y},${a.grid_w},${a.grid_h}`));
  const currentAssigns = currentFloorItems.filter((i: any) => i.item_type !== 'WALL');

  // Remove assignments not in snapshot
  for (const item of currentAssigns) {
    const k = `${item.grid_x},${item.grid_y},${item.grid_w},${item.grid_h}`;
    if (!snapshotAssignKeys.has(k)) {
      await handleRoomClear(item.id);
    }
  }

  // Upsert snapshot assignments
  for (const a of snapshot.assignments) {
    await handleRoomAssign({
      roomId: `${a.grid_x},${a.grid_y}`,
      cells: [],
      bounds: {
        minQ: a.grid_x, minR: a.grid_y,
        maxQ: a.grid_x + a.grid_w, maxR: a.grid_y + a.grid_h
      },
      item_type: a.item_type as FloorLayoutItemType,
      rental_unit_id: a.rental_unit_id ? parseInt(a.rental_unit_id, 10) : null,
      label: a.label
    });
  }
}

async function undo() {
  if (undoStack.length === 0) return;
  const current = captureSnapshot();
  redoStack = [...redoStack, current];
  const prev = undoStack[undoStack.length - 1];
  undoStack = undoStack.slice(0, -1);
  await applySnapshot(prev);
}

async function redo() {
  if (redoStack.length === 0) return;
  const current = captureSnapshot();
  undoStack = [...undoStack.slice(-UNDO_LIMIT + 1), current];
  const next = redoStack[redoStack.length - 1];
  redoStack = redoStack.slice(0, -1);
  await applySnapshot(next);
}
```

Wrap each handler to capture before mutating:

```typescript
async function handleWallAdd(edges: WallEdge[]) {
  pushUndo(captureSnapshot());     // <-- add this line
  // ... existing body unchanged
}
// Same pattern for handleWallRemove, handleRoomAssign, handleRoomClear
```

Keyboard binding in the `<svelte:window>` section:

```svelte
<svelte:window
  on:beforeunload={handleBeforeUnload}
  on:keydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
  }}
/>
```

Add undo/redo buttons to the header toolbar (between the Discard and Save buttons):

```svelte
<button
  onclick={undo}
  disabled={undoStack.length === 0}
  class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-sm disabled:opacity-30"
  title="Undo (Ctrl+Z)"
>
  <Undo2 class="w-3.5 h-3.5" />
</button>
<button
  onclick={redo}
  disabled={redoStack.length === 0}
  class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-sm disabled:opacity-30"
  title="Redo (Ctrl+Shift+Z)"
>
  <Redo2 class="w-3.5 h-3.5" />
</button>
```

Add `Redo2` to the lucide-svelte import alongside the existing `Undo2`.

**`FloorGrid.svelte`** — no changes required. Undo/redo is orchestrated entirely from `+page.svelte` using the existing `onWallAdd`/`onWallRemove` callbacks.

**`wallEngine.ts`** — no changes required. `parseEdgeKey` is already exported and needed by `applySnapshot`.

### Implementation notes

- `captureSnapshot()` must be called BEFORE the mutation, not after.
- The `pushUndo` in each handler fires every gesture (one drag = one snapshot). Individual edge additions within a drag are not separate undo entries because the gesture completes atomically in `handleWindowMouseUp`.
- `applySnapshot` calls the same `handleWallAdd`/`handleWallRemove` that normally push to `undoStack` — you must suppress the inner `pushUndo` during undo/redo application. Use a boolean guard: `let isApplyingSnapshot = false;` and gate `pushUndo` on `!isApplyingSnapshot`.

### Risks and mitigations

- **Risk:** Deep undo stacks consuming memory with large floor plans. **Mitigation:** 50-entry cap with `.slice(-49)` on each push.
- **Risk:** Undo after a save produces a state with temp IDs that server doesn't know about. **Mitigation:** Document that undo is session-scoped — after a save, the undo stack is not cleared (you can undo visual state) but server state has already been persisted. Add a console warning if `pendingChanges.length === 0` and user undoes.

---

## Feature 2: Doors on Walls

### Overview

Doors are stored as metadata on existing WALL edge items via the `label` JSON field. They do not break flood-fill enclosure. Rendering shows a gap + arc swing in 2D and a split wall with gap in 3D.

### File changes

**`wallEngine.ts`** — add door-aware helpers

```typescript
// After the parseWallMeta/serializeWallMeta additions from the data model section

export function hasDoor(wallMetaMap: Map<string, WallMeta>, q: number, r: number, dir: AnyDir): boolean {
  const [cq, cr, cd] = canonicalize(q, r, dir);
  const meta = wallMetaMap.get(edgeKey(cq, cr, cd));
  return !!meta?.door;
}

export function hasWindow(wallMetaMap: Map<string, WallMeta>, q: number, r: number, dir: AnyDir): boolean {
  const [cq, cr, cd] = canonicalize(q, r, dir);
  const meta = wallMetaMap.get(edgeKey(cq, cr, cd));
  return !!meta?.window;
}

// Build a map from edge key → WallMeta from the DB items
export function buildWallMetaMap(items: WallStorageItem[]): Map<string, WallMeta> {
  const map = new Map<string, WallMeta>();
  for (const item of items) {
    if (!item.label) continue;
    const meta = parseWallMeta(item.label);
    if (Object.keys(meta).length === 0) continue;
    // Derive canonical key the same way itemsToWallSet does
    if (item.grid_w === 0 && item.grid_h !== 0) {
      map.set(edgeKey(item.grid_x, item.grid_y, 'N'), meta);
    } else if (item.grid_h === 0 && item.grid_w !== 0) {
      map.set(edgeKey(item.grid_x, item.grid_y, 'W'), meta);
    }
  }
  return map;
}
```

**Extend `WallStorageItem`** to include label:

```typescript
export interface WallStorageItem {
  id?: string;
  floor_id: string;
  item_type: 'WALL';
  grid_x: number;
  grid_y: number;
  grid_w: number;
  grid_h: number;
  label?: string | null;   // <-- add this field
}
```

**`FloorGrid.svelte`** — door tool mode and 2D rendering

Add a new tool option `'door'` and `'window'` to the `DrawTool` union:

```typescript
type DrawTool = 'draw' | 'erase' | 'select' | 'door' | 'window';
```

Add derived `wallMetaMap`:

```typescript
let wallMetaMap = $derived(buildWallMetaMap(wallItems));
```

In the click handler (inside `handleWindowMouseUp`, the `!dragged && drawState` branch), add door/window toggle:

```typescript
} else if (!dragged && drawState) {
  if (tool === 'door' || tool === 'window') {
    const { px, py } = getGridOffset(e);
    const edge = findNearestWallEdge(px, py, cellSize * 0.6);
    if (edge) {
      onWallMetaToggle(edge, tool);  // new callback
    }
  } else if (eraseMode) {
    // ... existing erase click
  } else {
    // ... existing draw click / room assignment
  }
}
```

Add `onWallMetaToggle` to the component props:

```typescript
onWallMetaToggle: (edge: WallEdge, kind: 'door' | 'window') => void;
```

Replace the wall line rendering block in the SVG with a new component-level snippet that handles door rendering:

```svelte
<!-- Wall lines with door/window overlays -->
{#each wallLines as line (`${line.x1},${line.y1},${line.x2},${line.y2}`)}
  {@const isHoriz = line.y1 === line.y2}
  {@const edgeK = isHoriz
    ? edgeKey(Math.min(line.x1, line.x2), line.y1, 'N')
    : edgeKey(line.x1, Math.min(line.y1, line.y2), 'W')}
  {@const meta = wallMetaMap.get(edgeK) ?? {}}
  {@const x1 = line.x1 * cellSize}
  {@const y1 = line.y1 * cellSize}
  {@const x2 = line.x2 * cellSize}
  {@const y2 = line.y2 * cellSize}
  {@const wallThick = 4}  <!-- Feature 4 will change this to dynamic thickness -->

  {#if meta.door}
    <!-- Door: two half-wall segments + arc swing -->
    {@const midX = (x1 + x2) / 2}
    {@const midY = (y1 + y2) / 2}
    {@const doorW = cellSize * 0.8}
    {#if isHoriz}
      <!-- Left half -->
      <line x1={x1} y1={y1} x2={midX - doorW / 2} y2={y1}
        stroke="#334155" stroke-width={wallThick} stroke-linecap="square" />
      <!-- Right half -->
      <line x1={midX + doorW / 2} y1={y1} x2={x2} y2={y1}
        stroke="#334155" stroke-width={wallThick} stroke-linecap="square" />
      <!-- Arc swing indicator -->
      <path
        d="M {midX - doorW / 2} {y1} A {doorW} {doorW} 0 0 1 {midX} {y1 + doorW}"
        stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 2" fill="none" />
      <!-- Door panel -->
      <line x1={midX - doorW / 2} y1={y1} x2={midX} y2={y1 + doorW}
        stroke="#64748b" stroke-width="1.5" />
    {:else}
      <!-- Vertical door — same pattern rotated -->
      <line x1={x1} y1={y1} x2={x1} y2={midY - doorW / 2}
        stroke="#334155" stroke-width={wallThick} stroke-linecap="square" />
      <line x1={x1} y1={midY + doorW / 2} x2={x1} y2={y2}
        stroke="#334155" stroke-width={wallThick} stroke-linecap="square" />
      <path
        d="M {x1} {midY - doorW / 2} A {doorW} {doorW} 0 0 1 {x1 + doorW} {midY}"
        stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 2" fill="none" />
      <line x1={x1} y1={midY - doorW / 2} x2={x1 + doorW} y2={midY}
        stroke="#64748b" stroke-width="1.5" />
    {/if}
  {:else}
    <!-- Plain wall -->
    <line {x1} {y1} {x2} {y2}
      stroke={meta.color ?? '#334155'} stroke-width={wallThick} stroke-linecap="square" />
  {/if}
{/each}
```

**`FloorScene.svelte`** — 3D door rendering

For each wall line that has a door, split the `BoxGeometry` into two shorter segments. The gap is `CELL * 0.8` wide centered on the segment midpoint:

```svelte
{#each floorWallLines as line (`w-${line.x1},${line.y1},${line.x2},${line.y2}`)}
  {@const meta = floorWallMetaMap.get(
    line.y1 === line.y2
      ? edgeKey(Math.min(line.x1, line.x2), line.y1, 'N')
      : edgeKey(line.x1, Math.min(line.y1, line.y2), 'W')
  ) ?? {}}
  {@const isHoriz = line.y1 === line.y2}
  {@const totalLen = isHoriz ? (line.x2 - line.x1) * CELL : (line.y2 - line.y1) * CELL}
  {@const doorW = CELL * 0.8}
  {@const halfLen = (totalLen - doorW) / 2}

  {#if meta.door && totalLen > doorW}
    <!-- Two wall segments flanking the door gap -->
    <!-- (Full template markup depends on isHoriz — same BoxGeometry pattern as existing walls) -->
    <!-- Left/top segment: length = halfLen, positioned at start + halfLen/2 -->
    <!-- Right/bottom segment: length = halfLen, positioned at end - halfLen/2 -->
  {:else}
    <!-- Standard wall box — existing markup unchanged -->
  {/if}
{/each}
```

Add `buildWallMetaMap` import from `wallEngine` in `FloorScene.svelte` and compute:

```typescript
let floorWallMetaMap = $derived(buildWallMetaMap(floorWallItems));
```

**`ItemSidebar.svelte`** — add Door and Window tool buttons

Extend the tool toggle group to include Door and Window buttons below the existing trio, using a door-icon (a rectangle with a curved opening) or a lucide Door icon:

```svelte
<div class="flex rounded-lg border overflow-hidden mt-2">
  <button
    class="flex-1 ... {tool === 'door' ? 'bg-amber-600 text-white' : '...'}"
    onclick={() => onToolChange('door')}
    title="Place door on wall"
  >
    Door
  </button>
  <button
    class="flex-1 ... {tool === 'window' ? 'bg-sky-600 text-white' : '...'}"
    onclick={() => onToolChange('window')}
    title="Place window on wall"
  >
    Window
  </button>
</div>
```

**`+page.svelte`** — add `handleWallMetaToggle`

```typescript
async function handleWallMetaToggle(edge: WallEdge, kind: 'door' | 'window') {
  // Find the existing WALL item that matches this edge
  const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
  const match = wallItems.find((i: any) => {
    if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
    if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
    return false;
  });
  if (!match) return; // Door/window only on existing walls

  const currentMeta = parseWallMeta(match.label);
  let newMeta: WallMeta;

  if (kind === 'door') {
    newMeta = currentMeta.door
      ? { ...currentMeta, door: undefined, swing: undefined }  // toggle off
      : { ...currentMeta, door: 'single', swing: 'left' };     // toggle on
  } else {
    newMeta = currentMeta.window
      ? { ...currentMeta, window: undefined, sill: undefined }
      : { ...currentMeta, window: 'standard', sill: 0.9 };
  }

  const newLabel = serializeWallMeta(newMeta);
  const updated = { ...match, label: newLabel };

  await optimisticUpsertFloorLayoutItem(updated);
  pendingChanges = [...pendingChanges, { type: 'upsert', item: updated }];
}
```

**`+page.server.ts`** — `batchWalls` must preserve label on inserts

Add `label` to the `add` array type and pass it through:

```typescript
const { add, removeIds } = payload as {
  add: {
    floor_id: number; grid_x: number; grid_y: number;
    grid_w: number; grid_h: number; label?: string | null;
  }[];
  removeIds: number[];
};
// In the insert values:
add.map((w: any) => ({
  floorId: w.floor_id,
  itemType: 'WALL' as const,
  gridX: w.grid_x, gridY: w.grid_y,
  gridW: w.grid_w, gridH: w.grid_h,
  label: w.label ?? null         // <-- preserve metadata
}))
```

### Room detection — doors do NOT break enclosure

No change to `detectRooms()` or `canPass()`. Doors are purely visual metadata. The wall edge key is still present in the `Set<string>`, so `hasWall()` returns true regardless of door metadata.

### Types update

In `types.ts`, extend `DrawTool` exports:

```typescript
// Replace the local type in FloorGrid.svelte:
// export it from types.ts so ItemSidebar and +page.svelte share it
export type DrawTool = 'draw' | 'erase' | 'select' | 'door' | 'window';
```

---

## Feature 3: Windows on Walls

### Overview

Identical storage and toggle pattern to Feature 2. Separate `window` key in `WallMeta`. Different 2D symbol (double parallel lines perpendicular to wall) and different 3D rendering (gap + transparent pane).

### File changes

**`wallEngine.ts`** — already covered by `WallMeta.window` and `hasWindow()` added in Feature 2.

**`FloorGrid.svelte`** — add window rendering inside the wall loop:

```svelte
{:else if meta.window}
  <!-- Window: full wall line with cross-hatched pane overlay -->
  <line {x1} {y1} {x2} {y2}
    stroke="#334155" stroke-width={wallThick} stroke-linecap="square" />
  {#if isHoriz}
    {@const midX = (x1 + x2) / 2}
    {@const paneW = cellSize * 0.6}
    <!-- Double parallel lines perpendicular to wall (symbol) -->
    <line x1={midX - paneW / 2} y1={y1 - 6} x2={midX + paneW / 2} y2={y1 - 6}
      stroke="#7dd3fc" stroke-width="2" />
    <line x1={midX - paneW / 2} y1={y1 + 6} x2={midX + paneW / 2} y2={y1 + 6}
      stroke="#7dd3fc" stroke-width="2" />
    <!-- Glass fill -->
    <rect x={midX - paneW / 2} y={y1 - 6} width={paneW} height={12}
      fill="#bae6fd" opacity="0.5" />
  {:else}
    <!-- Vertical window — same pattern rotated -->
    {@const midY = (y1 + y2) / 2}
    {@const paneH = cellSize * 0.6}
    <line x1={x1 - 6} y1={midY - paneH / 2} x2={x1 - 6} y2={midY + paneH / 2}
      stroke="#7dd3fc" stroke-width="2" />
    <line x1={x1 + 6} y1={midY - paneH / 2} x2={x1 + 6} y2={midY + paneH / 2}
      stroke="#7dd3fc" stroke-width="2" />
    <rect x={x1 - 6} y={midY - paneH / 2} width={12} height={paneH}
      fill="#bae6fd" opacity="0.5" />
  {/if}
{:else}
  <!-- Plain wall -->
```

**`FloorScene.svelte`** — 3D window rendering

For wall segments with `meta.window`, render a gap in the wall and fill it with a thin semi-transparent box using a `MeshStandardMaterial` with `transparent={true}` and `opacity={0.35}` and `color="#93c5fd"`:

```svelte
{#if meta.window && totalLen > CELL * 0.6}
  <!-- Two wall flanking segments + glass pane -->
  {@const glassW = CELL * 0.6}
  {@const flankLen = (totalLen - glassW) / 2}
  <!-- Render two BoxGeometry flanks (same as door but smaller gap) -->
  <!-- Render glass pane: BoxGeometry args=[glassW, WALL_3D_HEIGHT * 0.6, 0.02] -->
  <!-- Glass material: transparent, opacity 0.35, color #93c5fd -->
{:else}
  <!-- Standard wall -->
{/if}
```

**`ItemSidebar.svelte`** — Window button already added in Feature 2 door section.

**`+page.svelte`** — `handleWallMetaToggle` already handles the `'window'` kind.

---

## Feature 4: Wall Double-Line Rendering (Thick Walls)

### Overview

Replace the `<line stroke-width="4">` primitive with a filled SVG rectangle (polygon) computed from the wall centerline plus a configurable perpendicular half-thickness. Wall junctions are handled by computing the corners of each wall rect independently — for v1, simple capped ends (stroke-linecap="square" equivalent) are acceptable; true miter joins can be a v2 polish item.

### File changes

**`FloorGrid.svelte`** — only file changed

Add a configurable thickness constant and a helper that converts a line into a rectangle polygon:

```typescript
// Near the top of <script>
const WALL_HALF_THICK = $derived(Math.max(3, cellSize * 0.08));  // scales with zoom

function wallLineToRect(
  x1: number, y1: number, x2: number, y2: number, halfThick: number
): string {
  // Returns SVG polygon points string for the wall rectangle
  if (y1 === y2) {
    // Horizontal wall: expand perpendicular (Y axis)
    return [
      `${x1},${y1 - halfThick}`,
      `${x2},${y1 - halfThick}`,
      `${x2},${y1 + halfThick}`,
      `${x1},${y1 + halfThick}`
    ].join(' ');
  } else {
    // Vertical wall: expand perpendicular (X axis)
    return [
      `${x1 - halfThick},${y1}`,
      `${x1 + halfThick},${y1}`,
      `${x1 + halfThick},${y2}`,
      `${x1 - halfThick},${y2}`
    ].join(' ');
  }
}
```

Replace the wall line rendering:

```svelte
<!-- Before (Feature 4) -->
<line
  x1={line.x1 * cellSize} y1={line.y1 * cellSize}
  x2={line.x2 * cellSize} y2={line.y2 * cellSize}
  stroke="#334155" stroke-width="4" stroke-linecap="square"
/>

<!-- After (Feature 4) -->
<polygon
  points={wallLineToRect(
    line.x1 * cellSize, line.y1 * cellSize,
    line.x2 * cellSize, line.y2 * cellSize,
    WALL_HALF_THICK
  )}
  fill={meta.color ?? '#334155'}
/>
```

Also update the draw preview to use the same thickness:

```svelte
<!-- Draw preview — keep as dashed line but use stroke-width matching half-thick * 2 -->
<line ... stroke-width={WALL_HALF_THICK * 2} stroke-dasharray="6 4" />
```

### Junction treatment (v1)

Adjacent wall polygons will overlap slightly at corners, which is acceptable and looks correct for interior walls. The fill color is opaque, so overlap blending is not an issue. True miter joins (cutting 45-degree corners) are a v2 enhancement requiring intersection math.

### Impact on Features 2 and 3

Feature 2 and 3 door/window gap calculations must use `WALL_HALF_THICK` for the perpendicular extent of the pane/arc symbol. Update those renders accordingly after Feature 4 is complete.

---

## Feature 5: Room Area Display

### Overview

Extend the `roomLabel()` function to append an area string. Add a `cellSizeMeters` prop to `FloorGrid.svelte` (default `1.0`). Area = `room.cells.length × cellSizeMeters²`.

### File changes

**`FloorGrid.svelte`**

Add prop:

```typescript
let {
  ...existing props,
  cellSizeMeters = 1.0   // 1 cell = 1 meter by default
}: {
  ...
  cellSizeMeters?: number;
} = $props();
```

Extend `roomLabel()`:

```typescript
function roomLabel(room: DetectedRoom): { text: string; assigned: boolean } {
  const a = getAssignment(room);
  const areaSqM = room.cells.length * cellSizeMeters * cellSizeMeters;
  const areaStr = areaSqM >= 1
    ? `${areaSqM.toFixed(1)} m²`
    : `${(areaSqM * 10000).toFixed(0)} cm²`;  // for very small cells

  if (!a) return { text: `${room.cells.length} cells · ${areaStr}`, assigned: false };

  if (a.item_type === 'RENTAL_UNIT' && a.rental_unit_id) {
    const unit = rentalUnitsMap.get(a.rental_unit_id);
    return {
      text: unit ? `${unit.name} · ${areaStr}` : `Rental Unit · ${areaStr}`,
      assigned: true
    };
  }

  const typeLabel = ITEM_TYPE_LABELS[a.item_type] ?? a.item_type;
  const customLabel = a.label ? `${a.label} · ${areaStr}` : `${typeLabel} · ${areaStr}`;
  return { text: customLabel, assigned: true };
}
```

**`+page.svelte`** — pass the new prop:

```svelte
<FloorGrid
  ...
  cellSizeMeters={1.0}
/>
```

Consider exposing a UI control in the sidebar or header to let the user configure cell size (e.g., a small select: 0.5m / 1m / 2m). This is optional for v1.

---

## Feature 6: PNG Export

### Overview

Add an Export button in the header. Use the browser's built-in `OffscreenCanvas` (or a regular canvas with `drawImage` from the SVG blob) to render the floor plan grid at 2x resolution. Avoid third-party dependencies — use native SVG-to-canvas serialization.

### Implementation approach

The SVG is inside a `<div>` with a nested `<svg>`. Serialize the SVG to a Blob, draw it via `Image` onto a 2x canvas, then download as PNG.

### File changes

**New file: `src/routes/property/[id]/floorplan/exportPng.ts`**

```typescript
/**
 * Exports the floor plan SVG + room labels to a PNG file.
 * Serializes the SVG element to a data URL, draws to a 2x canvas, then triggers download.
 */
export async function exportFloorPlanPng(
  svgEl: SVGSVGElement,
  labelsEl: HTMLElement,
  filename: string = 'floorplan.png',
  scale: number = 2
): Promise<void> {
  const svgRect = svgEl.getBoundingClientRect();
  const w = svgRect.width * scale;
  const h = svgRect.height * scale;

  // 1. Serialize SVG
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // 2. Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      resolve();
    };
    img.onerror = reject;
    img.src = svgUrl;
  });

  // 3. Trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}
```

**`FloorGrid.svelte`** — expose SVG element ref and export trigger

```typescript
// Add a ref for the SVG element
let svgEl = $state<SVGSVGElement | undefined>();

// Expose export function via $props or bind
// Option A: expose a bindable ref to a function
// Option B: export button lives in FloorGrid itself
```

Simplest approach: add an Export button inside `FloorGrid.svelte` since it has direct access to the SVG element. Place it alongside the existing zoom controls:

```svelte
<button
  class="px-2 py-1 rounded bg-background border text-xs hover:bg-secondary"
  onclick={async () => {
    if (!svgEl) return;
    const { exportFloorPlanPng } = await import('./exportPng');
    await exportFloorPlanPng(svgEl, gridEl!, `floor-${floorId}.png`);
  }}
>
  Export PNG
</button>
```

Bind the SVG ref:

```svelte
<svg bind:this={svgEl} class="absolute inset-0 pointer-events-none" width="100%" height="100%">
```

### Limitations

- Room label HTML `<div>` elements are not captured in the SVG export because they are DOM overlays. To include them, use `html2canvas` (add as dev dependency) or re-render labels as SVG `<text>` elements inside the SVG. The recommended v1 approach is to render labels as `<text>` elements directly inside the SVG, duplicating the existing HTML label logic. See the label rendering note below.

**Optional label SVG fallback inside the SVG element:**

```svelte
<!-- Inside the SVG, after room fills, for export-compatible labels -->
{#each detectedRooms as room (room.id)}
  {@const info = roomLabel(room)}
  {@const cx = ((room.bounds.minQ + room.bounds.maxQ) / 2) * cellSize}
  {@const cy = ((room.bounds.minR + room.bounds.maxR) / 2) * cellSize}
  {@const rw = (room.bounds.maxQ - room.bounds.minQ) * cellSize}
  {#if rw > 36}
    <text
      x={cx} y={cy}
      text-anchor="middle" dominant-baseline="middle"
      font-size="11" font-family="sans-serif" fill="#1e293b"
    >
      {info.text}
    </text>
  {/if}
{/each}
```

---

## Feature 7: Wall Color per Segment

### Overview

Each wall edge stores an optional `color` in its `WallMeta` label JSON. A Select tool click on a wall edge opens a color picker. The wall renders in its custom color in both 2D and 3D.

### File changes

**`wallEngine.ts`** — `WallMeta.color` already defined in the data model section. No further changes.

**`FloorGrid.svelte`** — select-mode click on wall

Add a `selectedWallEdge` state and a color picker popup:

```typescript
let selectedWallEdge = $state<{ edge: WallEdge; anchorPx: { x: number; y: number } } | null>(null);
let selectedWallColor = $state('#334155');
```

In `handleWindowMouseUp`, for `tool === 'select'` without drag:

```typescript
if (!dragged && drawState && tool === 'select') {
  const { px, py } = getGridOffset(e);
  const edge = findNearestWallEdge(px, py, cellSize * 0.6);
  if (edge) {
    const key = edgeKey(edge.q, edge.r, edge.dir);
    const meta = wallMetaMap.get(key) ?? {};
    selectedWallColor = meta.color ?? '#334155';
    selectedWallEdge = { edge, anchorPx: { x: px, y: py } };
  }
}
```

Color picker popup in SVG overlay (positioned as absolute div):

```svelte
{#if selectedWallEdge}
  <div
    class="absolute z-40 bg-background border rounded-lg shadow-lg p-3 space-y-2"
    style="left: {selectedWallEdge.anchorPx.x}px; top: {selectedWallEdge.anchorPx.y + 8}px;"
    onmousedown={(e) => e.stopPropagation()}
  >
    <p class="text-xs font-semibold text-muted-foreground">Wall Color</p>
    <input
      type="color"
      bind:value={selectedWallColor}
      class="w-full h-8 rounded border cursor-pointer"
    />
    <div class="flex gap-2">
      <button
        class="flex-1 px-2 py-1.5 rounded bg-primary text-primary-foreground text-xs"
        onclick={() => {
          onWallColorChange(selectedWallEdge!.edge, selectedWallColor);
          selectedWallEdge = null;
        }}
      >Apply</button>
      <button
        class="px-2 py-1.5 rounded border text-xs"
        onclick={() => {
          onWallColorChange(selectedWallEdge!.edge, null);  // reset to default
          selectedWallEdge = null;
        }}
      >Reset</button>
      <button
        class="px-2 py-1.5 rounded border text-xs"
        onclick={() => (selectedWallEdge = null)}
      >Cancel</button>
    </div>
  </div>
{/if}
```

Add `onWallColorChange` prop:

```typescript
onWallColorChange: (edge: WallEdge, color: string | null) => void;
```

2D rendering: the wall polygon fill already uses `meta.color ?? '#334155'` from the Feature 4 wall rect rendering — no additional changes needed.

**`FloorScene.svelte`** — 3D custom color

```svelte
<T.MeshStandardMaterial color={meta.color ?? WALL_3D_COLOR} roughness={0.85} />
```

**`+page.svelte`** — add `handleWallColorChange`

```typescript
async function handleWallColorChange(edge: WallEdge, color: string | null) {
  const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
  const match = wallItems.find((i: any) => {
    if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
    if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
    return false;
  });
  if (!match) return;

  const currentMeta = parseWallMeta(match.label);
  const newMeta: WallMeta = color
    ? { ...currentMeta, color }
    : (({ color: _c, ...rest }) => rest)(currentMeta);  // remove color key

  const newLabel = serializeWallMeta(newMeta);
  const updated = { ...match, label: newLabel };
  await optimisticUpsertFloorLayoutItem(updated);
  pendingChanges = [...pendingChanges, { type: 'upsert', item: updated }];
}
```

---

## Feature 8: Alignment Guides

### Overview

During wall drawing, when the cursor position aligns (within 1px of snap) with any existing wall endpoint X or Y coordinate, show thin dashed lines across the full grid at that coordinate. Only active when `tool === 'draw'` and `drawState !== null`.

### File changes

**`FloorGrid.svelte`** — only file changed

Compute the set of all existing wall endpoint coordinates:

```typescript
let wallEndpoints = $derived.by(() => {
  const xs = new Set<number>();
  const ys = new Set<number>();
  for (const line of wallLines) {
    xs.add(line.x1); xs.add(line.x2);
    ys.add(line.y1); ys.add(line.y2);
  }
  return { xs, ys };
});
```

Compute active guide lines from cursor snap:

```typescript
let alignmentGuides = $derived.by(() => {
  if (!drawState || tool !== 'draw' || !cursorSnap) return { x: null as number | null, y: null as number | null };
  const gx = wallEndpoints.xs.has(cursorSnap.x) ? cursorSnap.x : null;
  const gy = wallEndpoints.ys.has(cursorSnap.y) ? cursorSnap.y : null;
  return { x: gx, y: gy };
});
```

Render guide lines inside the SVG (before wall lines, after grid lines):

```svelte
<!-- Alignment guides — only during wall drawing -->
{#if alignmentGuides.x !== null}
  <line
    x1={alignmentGuides.x * cellSize} y1={0}
    x2={alignmentGuides.x * cellSize} y2={gridRows * cellSize}
    stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"
    class="pointer-events-none"
  />
{/if}
{#if alignmentGuides.y !== null}
  <line
    x1={0} y1={alignmentGuides.y * cellSize}
    x2={gridCols * cellSize} y2={alignmentGuides.y * cellSize}
    stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"
    class="pointer-events-none"
  />
{/if}
```

No changes to any other files.

### Performance note

`wallEndpoints` is a `$derived` that iterates all wall lines — this is O(n walls) on every wall set change, which is acceptable for typical floor plans (< 1000 edges). The guide line check itself is O(1) Set lookup.

---

## Feature 9: Stairs and Elevator Visual Indicators

### Overview

`STAIRWELL` and `ELEVATOR` are already in `types.ts` and `ROOM_FILL_COLORS`. This feature adds custom 2D SVG symbols drawn over the room fill when a room is assigned as either type. No new data, no new DB fields.

### 2D Symbols

**STAIRWELL:** A series of horizontal parallel lines (stair treads) with an up-arrow at one end.

**ELEVATOR:** An X drawn corner-to-corner of the room bounding box, with a small door symbol on one side.

### File changes

**`FloorGrid.svelte`** — add symbol rendering after room fills

Insert a new SVG group after the existing `{#each detectedRooms}` room fill block:

```svelte
<!-- Special symbols for STAIRWELL and ELEVATOR rooms -->
{#each detectedRooms as room (room.id)}
  {@const a = getAssignment(room)}
  {#if a?.item_type === 'STAIRWELL' || a?.item_type === 'ELEVATOR'}
    {@const rx = room.bounds.minQ * cellSize}
    {@const ry = room.bounds.minR * cellSize}
    {@const rw = (room.bounds.maxQ - room.bounds.minQ) * cellSize}
    {@const rh = (room.bounds.maxR - room.bounds.minR) * cellSize}
    {@const cx = rx + rw / 2}
    {@const cy = ry + rh / 2}

    {#if a.item_type === 'STAIRWELL'}
      <!-- Stair treads: horizontal lines spaced evenly -->
      {@const steps = Math.max(3, Math.floor(rh / 14))}
      {@const stepH = rh / steps}
      {#each Array(steps) as _, si}
        {@const stepY = ry + si * stepH}
        {@const stepW = rw * (1 - si / steps)}  <!-- tapering for perspective -->
        <line
          x1={rx + (rw - stepW) / 2} y1={stepY + stepH * 0.8}
          x2={rx + (rw + stepW) / 2} y2={stepY + stepH * 0.8}
          stroke="#92400e" stroke-width="1.5" opacity="0.7"
        />
      {/each}
      <!-- Up arrow -->
      <polygon
        points="{cx},{ry + 6} {cx - 5},{ry + 14} {cx + 5},{ry + 14}"
        fill="#92400e" opacity="0.8"
      />

    {:else}
      <!-- ELEVATOR: X symbol + door indicator -->
      <!-- Corner-to-corner X -->
      <line x1={rx + 4} y1={ry + 4} x2={rx + rw - 4} y2={ry + rh - 4}
        stroke="#4338ca" stroke-width="1.5" opacity="0.6" />
      <line x1={rx + rw - 4} y1={ry + 4} x2={rx + 4} y2={ry + rh - 4}
        stroke="#4338ca" stroke-width="1.5" opacity="0.6" />
      <!-- Door gap at bottom center -->
      {@const doorW = Math.min(rw * 0.4, 24)}
      <line x1={cx - doorW / 2} y1={ry + rh - 2} x2={cx} y2={ry + rh - 2}
        stroke="#4338ca" stroke-width="2" opacity="0.8" />
      <line x1={cx} y1={ry + rh - 2} x2={cx + doorW / 2} y2={ry + rh - 2}
        stroke="#4338ca" stroke-width="2" opacity="0.8" />
    {/if}
  {/if}
{/each}
```

**`FloorScene.svelte`** — 3D stair/elevator geometry

For `STAIRWELL` items, replace the flat floor `BoxGeometry` with a series of stacked thin boxes simulating stair treads:

```svelte
{#if item.item_type === 'STAIRWELL'}
  {@const stepCount = 6}
  {@const stepDepth = d / stepCount}
  {#each Array(stepCount) as _, si}
    {@const stepY = yBase + (si / stepCount) * WALL_3D_HEIGHT * 0.6}
    {@const stepH = WALL_3D_HEIGHT * 0.6 / stepCount}
    <T.Mesh
      position.x={x + w / 2}
      position.y={stepY + stepH / 2}
      position.z={z + si * stepDepth + stepDepth / 2}
    >
      <T.BoxGeometry args={[w - 0.04, stepH, stepDepth - 0.02]} />
      <T.MeshStandardMaterial color="#fde68a" roughness={0.8} />
    </T.Mesh>
  {/each}
{:else if item.item_type === 'ELEVATOR'}
  <!-- Box with slightly raised top -->
  <T.Mesh
    position.x={x + w / 2}
    position.y={yBase + WALL_3D_HEIGHT * 0.4}
    position.z={z + d / 2}
  >
    <T.BoxGeometry args={[w - 0.04, WALL_3D_HEIGHT * 0.8, d - 0.04]} />
    <T.MeshStandardMaterial color="#c7d2fe" roughness={0.6} transparent opacity={0.7} />
  </T.Mesh>
{:else}
  <!-- Standard flat floor tile — existing markup -->
{/if}
```

**`types.ts`** — no changes needed (STAIRWELL/ELEVATOR already present in all relevant constants).

---

## Complete File Change Summary

| File | Features | Change type |
|---|---|---|
| `wallEngine.ts` | 2, 3, 7 | Add `WallMeta`, `parseWallMeta`, `serializeWallMeta`, `hasDoor`, `hasWindow`, `buildWallMetaMap`; extend `WallStorageItem.label` |
| `types.ts` | 2, 3 | Export `DrawTool` (move from local in FloorGrid); add `'door'` and `'window'` to the union |
| `FloorGrid.svelte` | 1, 2, 3, 4, 5, 6, 7, 8, 9 | Most changes live here |
| `FloorScene.svelte` | 2, 3, 7, 9 | Door/window gaps, wall color, stair/elevator geometry |
| `ItemSidebar.svelte` | 2, 3 | Door and Window tool buttons |
| `+page.svelte` | 1, 2, 3, 7 | Undo/redo stacks, `handleWallMetaToggle`, `handleWallColorChange` |
| `+page.server.ts` | 2, 3, 7 | Extend `batchWalls` to pass `label` on inserts |
| `exportPng.ts` (new) | 6 | PNG export utility |

---

## TypeScript Gotchas and Constraints

### `WallMeta` object spread with key removal

TypeScript will reject `delete meta.color` on an interface-typed object. Use destructuring:

```typescript
const { color: _removed, ...rest } = currentMeta;
const newMeta: WallMeta = rest;
```

### `DrawTool` union extension and `pnpm check`

After adding `'door'` and `'window'` to `DrawTool` in `types.ts`, update:
- `FloorGrid.svelte`: import `DrawTool` from `./types` instead of defining it locally
- `ItemSidebar.svelte`: update the `DrawTool` import and the tool toggle type
- `+page.svelte`: the `drawTool` state type `'draw' | 'erase'` must be widened to `DrawTool`

### `wallMetaMap` in FloorScene

`FloorScene.svelte` currently imports from `wallEngine.ts`. Add `buildWallMetaMap`, `parseWallMeta` to the import list. The component is inside a `Canvas` context (Threlte) — no Svelte store usage allowed, only props and `$derived`.

### Undo during save

If `handleSave()` is in progress (`isSaving === true`), disable undo/redo buttons. Check `isSaving` before calling `undo()` / `redo()`.

### Export PNG on Cloudflare edge

`exportFloorPlanPng` uses `OffscreenCanvas` / `document.createElement('canvas')` — this is client-only code. The function is dynamically imported inside an `onclick` handler, so it is never executed on the server/edge and will not cause build errors.

---

## Testing Checklist

### Feature 1 (Undo/Redo)
- [ ] Draw 3 wall segments, undo 3 times — canvas returns to blank
- [ ] Draw, undo, draw again — redo stack clears
- [ ] Undo past 50 entries does nothing
- [ ] Ctrl+Z during save (isSaving=true) is blocked
- [ ] Keyboard shortcut works on Mac (Cmd+Z) and Windows (Ctrl+Z)

### Feature 2 (Doors)
- [ ] Door tool click on existing wall adds door metadata
- [ ] Door tool click on same wall removes door metadata (toggle)
- [ ] Door tool click on empty space does nothing
- [ ] Room enclosure still detected with door on boundary wall
- [ ] Door arc renders in correct direction for H and V walls
- [ ] Save + reload: door persists

### Feature 3 (Windows)
- [ ] Window renders double-parallel-line symbol perpendicular to wall axis
- [ ] Window pane shows blue-tinted semi-transparent fill
- [ ] Room enclosure still detected with window on boundary wall
- [ ] 3D glass pane visible with transparency
- [ ] Save + reload: window persists

### Feature 4 (Thick walls)
- [ ] Walls render as filled rectangles at default zoom (48px cell)
- [ ] Wall thickness scales correctly at min (24px) and max (96px) zoom levels
- [ ] Adjacent perpendicular walls overlap cleanly (no visible gap)
- [ ] Draw preview line uses matching thickness

### Feature 5 (Room area)
- [ ] Unassigned room shows cell count + area
- [ ] Assigned room shows type label + area
- [ ] Rental unit room shows unit name + area
- [ ] Area rounds to 1 decimal place
- [ ] Area updates immediately when walls change (reactive)

### Feature 6 (PNG export)
- [ ] Export button visible in zoom control area
- [ ] Download triggers a .png file
- [ ] Exported image includes wall fills and room fills at 2x resolution
- [ ] Exported image has white background
- [ ] Export works with large grids (20x16 cells at 96px = 1920x1536px)

### Feature 7 (Wall color)
- [ ] Select tool click near wall opens color picker popup
- [ ] Apply button updates wall color in 2D immediately
- [ ] Reset button returns wall to default slate color
- [ ] Custom color persists after save + reload
- [ ] 3D view uses custom wall color on the matching mesh

### Feature 8 (Alignment guides)
- [ ] Guide lines only appear during active wall drawing (not in erase or assign mode)
- [ ] Vertical guide appears when cursor X matches an existing wall endpoint X
- [ ] Horizontal guide appears when cursor Y matches an existing wall endpoint Y
- [ ] Guides disappear when mouse moves off alignment
- [ ] No performance degradation with 200+ wall segments

### Feature 9 (Stair/elevator symbols)
- [ ] STAIRWELL room shows horizontal tread lines + arrow
- [ ] ELEVATOR room shows X symbol + door gap
- [ ] Symbols scale with cellSize (tread count adjusts to room height)
- [ ] 3D stairwell renders as stepped geometry
- [ ] 3D elevator renders as semi-transparent box
- [ ] Symbols don't appear on unassigned rooms or other types

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `label` JSON on WALL items breaks existing `itemsToWallSet` | Low | `itemsToWallSet` ignores `label` entirely — the wall Set is built from grid coords only |
| Wall thick rendering creates visual overlap at junctions | Medium | Acceptable for v1; junctions look correct because walls share endpoint; miter v2 |
| Undo during a server save creates inconsistent state | Medium | Disable undo/redo while `isSaving === true` |
| PNG export fails in Safari due to SVG Blob URL rendering | Medium | Test in Safari; fallback: use `foreignObject` or `html2canvas` as a dependency |
| Threlte `$derived` recalculation of `floorWallMetaMap` in FloorScene causes 3D flicker | Low | `$derived` is synchronous; no async gaps; Threlte re-renders are batched per frame |
| `DrawTool` union widening breaks `pnpm check` if any exhaustive switch exists | Low | Search for `switch(tool)` in codebase before widening; add `default` branches |
| Door/window gap logic when wall is 1-cell long | Medium | Guard: only split if `totalLen > gapW + 2 * minSegLen` (e.g., minSegLen = 0.1 CELL) |
