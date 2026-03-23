/**
 * Wall-first floor plan engine.
 *
 * Walls live on grid EDGES (between cells), not inside cells.
 * Only canonical N (north) and W (west) edges are stored to avoid duplication:
 *   South of (q,r) = North of (q, r+1)
 *   East of (q,r)  = West of (q+1, r)
 *
 * Reference: https://www.redblobgames.com/grids/edges/
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type EdgeDir = 'N' | 'W';
export type AnyDir = 'N' | 'S' | 'E' | 'W';

export interface WallEdge {
	q: number;
	r: number;
	dir: EdgeDir;
}

export interface DetectedRoom {
	id: string;
	cells: { q: number; r: number }[];
	bounds: { minQ: number; minR: number; maxQ: number; maxR: number };
}

export interface WallLine {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

// ─── Key Encoding ──────────────────────────────────────────────────────────

export function edgeKey(q: number, r: number, dir: EdgeDir): string {
	return `${q},${r},${dir}`;
}

export function parseEdgeKey(key: string): WallEdge {
	const [q, r, dir] = key.split(',');
	return { q: Number(q), r: Number(r), dir: dir as EdgeDir };
}

// ─── Canonicalization ──────────────────────────────────────────────────────

export function canonicalize(q: number, r: number, dir: AnyDir): [number, number, EdgeDir] {
	switch (dir) {
		case 'N':
			return [q, r, 'N'];
		case 'S':
			return [q, r + 1, 'N'];
		case 'W':
			return [q, r, 'W'];
		case 'E':
			return [q + 1, r, 'W'];
	}
}

// ─── Wall Set Operations ───────────────────────────────────────────────────

export function addWall(walls: Set<string>, q: number, r: number, dir: AnyDir): void {
	const [cq, cr, cd] = canonicalize(q, r, dir);
	walls.add(edgeKey(cq, cr, cd));
}

export function removeWall(walls: Set<string>, q: number, r: number, dir: AnyDir): void {
	const [cq, cr, cd] = canonicalize(q, r, dir);
	walls.delete(edgeKey(cq, cr, cd));
}

export function hasWall(walls: Set<string>, q: number, r: number, dir: AnyDir): boolean {
	const [cq, cr, cd] = canonicalize(q, r, dir);
	return walls.has(edgeKey(cq, cr, cd));
}

// ─── Line ↔ Edge Conversion ───────────────────────────────────────────────

/**
 * Convert a drawn line segment between grid intersections into canonical wall edges.
 * Line must be axis-aligned (horizontal or vertical).
 *
 * A horizontal line at y=R from x=A to x=B produces N edges for cells (A..B-1, R).
 * A vertical line at x=C from y=A to y=B produces W edges for cells (C, A..B-1).
 */
export function lineToEdges(x1: number, y1: number, x2: number, y2: number): WallEdge[] {
	const edges: WallEdge[] = [];

	if (y1 === y2) {
		// Horizontal line
		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		for (let q = minX; q < maxX; q++) {
			edges.push({ q, r: y1, dir: 'N' });
		}
	} else if (x1 === x2) {
		// Vertical line
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);
		for (let r = minY; r < maxY; r++) {
			edges.push({ q: x1, r, dir: 'W' });
		}
	}
	// Non-axis-aligned lines are silently ignored

	return edges;
}

/**
 * Convert wall set back to line segments for rendering.
 * Each stored edge becomes one line segment (no merging).
 *
 * N edge (q, r): line from intersection (q, r) to (q+1, r)
 * W edge (q, r): line from intersection (q, r) to (q, r+1)
 */
export function edgesToLines(walls: Set<string>): WallLine[] {
	const lines: WallLine[] = [];
	for (const key of walls) {
		const { q, r, dir } = parseEdgeKey(key);
		if (dir === 'N') {
			lines.push({ x1: q, y1: r, x2: q + 1, y2: r });
		} else {
			lines.push({ x1: q, y1: r, x2: q, y2: r + 1 });
		}
	}
	return lines;
}

// ─── Storage Round-Trip ────────────────────────────────────────────────────

export interface WallStorageItem {
	id?: string;
	floor_id: string;
	item_type: 'WALL';
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	label?: string | null;
}

// ─── Wall Metadata (Doors, Windows, Color) ────────────────────────────────

export type DoorType = 'single' | 'double' | 'sliding' | 'pocket' | 'bifold' | 'french';
export type WindowType = 'fixed' | 'sliding' | 'casement' | 'awning' | 'bay';
export type SwingDir = 'left' | 'right' | 'both';
export type OpenDir = 'inward' | 'outward';

export interface WallMeta {
	door?: DoorType;
	swing?: SwingDir;
	openDir?: OpenDir;
	doorWidth?: number;      // cm (default 80 single, 120 double)
	window?: WindowType;
	sill?: number;           // meters from floor (default 0.9)
	windowWidth?: number;    // cm (default 100)
	windowHeight?: number;   // cm (default 120)
	color?: string;
}

export function parseWallMeta(label: string | null): WallMeta {
	if (!label) return {};
	try {
		return JSON.parse(label);
	} catch {
		return {};
	}
}

export function serializeWallMeta(meta: WallMeta): string | null {
	// Remove undefined keys before checking
	const clean: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(meta)) {
		if (v !== undefined) clean[k] = v;
	}
	if (Object.keys(clean).length === 0) return null;
	return JSON.stringify(clean);
}

export function buildWallMetaMap(items: WallStorageItem[]): Map<string, WallMeta> {
	const map = new Map<string, WallMeta>();
	for (const item of items) {
		if (!item.label) continue;
		const meta = parseWallMeta(item.label);
		// Remove undefined keys for checking
		const hasKeys = Object.values(meta).some((v) => v !== undefined);
		if (!hasKeys) continue;
		if (item.grid_w === 0 && item.grid_h !== 0) {
			map.set(edgeKey(item.grid_x, item.grid_y, 'N'), meta);
		} else if (item.grid_h === 0 && item.grid_w !== 0) {
			map.set(edgeKey(item.grid_x, item.grid_y, 'W'), meta);
		}
	}
	return map;
}

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

/**
 * Convert WALL items from the database into a canonical wall Set.
 *
 * Encoding:
 *   grid_w=0, grid_h≠0 → N edge at (grid_x, grid_y)
 *   grid_h=0, grid_w≠0 → W edge at (grid_x, grid_y)
 *
 * Legacy multi-cell items (grid_w>1 or grid_h>1) are expanded into individual edges.
 */
export function itemsToWallSet(items: WallStorageItem[]): Set<string> {
	const walls = new Set<string>();

	for (const item of items) {
		if (item.grid_w === 0 && item.grid_h === 0) continue; // degenerate, skip

		if (item.grid_w === 0) {
			// Single N edge
			addWall(walls, item.grid_x, item.grid_y, 'N');
		} else if (item.grid_h === 0) {
			// Single W edge
			addWall(walls, item.grid_x, item.grid_y, 'W');
		} else {
			// Legacy multi-cell: expand horizontal line from (grid_x, grid_y) to (grid_x+grid_w, grid_y)
			// or vertical line from (grid_x, grid_y) to (grid_x, grid_y+grid_h)
			if (item.grid_h === 1 || item.grid_h === 0) {
				// Horizontal
				for (let q = item.grid_x; q < item.grid_x + item.grid_w; q++) {
					addWall(walls, q, item.grid_y, 'N');
				}
			} else if (item.grid_w === 1 || item.grid_w === 0) {
				// Vertical
				for (let r = item.grid_y; r < item.grid_y + item.grid_h; r++) {
					addWall(walls, item.grid_x, r, 'W');
				}
			}
		}
	}

	return walls;
}

/**
 * Compute the diff between the wall set and existing WALL items.
 * Returns edges that need to be added and item IDs to remove.
 */
export function wallSetDiff(
	walls: Set<string>,
	existingItems: WallStorageItem[]
): { toAdd: WallEdge[]; toRemoveIds: string[] } {
	const existingSet = itemsToWallSet(existingItems);

	const toAdd: WallEdge[] = [];
	for (const key of walls) {
		if (!existingSet.has(key)) {
			toAdd.push(parseEdgeKey(key));
		}
	}

	const toRemoveIds: string[] = [];
	for (const item of existingItems) {
		if (!item.id) continue;
		// Check if this item's edges are still in the wall set
		if (item.grid_w === 0 && item.grid_h !== 0) {
			const [cq, cr, cd] = canonicalize(item.grid_x, item.grid_y, 'N');
			if (!walls.has(edgeKey(cq, cr, cd))) toRemoveIds.push(item.id);
		} else if (item.grid_h === 0 && item.grid_w !== 0) {
			const [cq, cr, cd] = canonicalize(item.grid_x, item.grid_y, 'W');
			if (!walls.has(edgeKey(cq, cr, cd))) toRemoveIds.push(item.id);
		}
	}

	return { toAdd, toRemoveIds };
}

// ─── Room Detection (Flood Fill) ──────────────────────────────────────────

/**
 * Check if passage exists between two adjacent cells (no wall on shared edge).
 */
function canPass(walls: Set<string>, fromQ: number, fromR: number, toQ: number, toR: number): boolean {
	if (toQ === fromQ + 1) return !hasWall(walls, fromQ, fromR, 'E');
	if (toQ === fromQ - 1) return !hasWall(walls, fromQ, fromR, 'W');
	if (toR === fromR + 1) return !hasWall(walls, fromQ, fromR, 'S');
	if (toR === fromR - 1) return !hasWall(walls, fromQ, fromR, 'N');
	return false;
}

/**
 * Detect enclosed rooms via BFS flood fill.
 *
 * 1. BFS from all boundary-reachable cells → mark as "outside"
 * 2. Remaining unvisited connected cells = enclosed rooms
 */
export function detectRooms(walls: Set<string>, gridW: number, gridH: number): DetectedRoom[] {
	if (gridW <= 0 || gridH <= 0) return [];

	const visited = new Uint8Array(gridW * gridH); // 0 = unvisited, 1 = outside, 2 = room
	const idx = (q: number, r: number) => r * gridW + q;

	// Phase 1: Flood fill "outside" from boundary cells
	const outsideQueue: number[] = [];

	// Seed boundary cells that can reach outside
	for (let q = 0; q < gridW; q++) {
		for (let r = 0; r < gridH; r++) {
			const isBoundary =
				(r === 0 && !hasWall(walls, q, r, 'N')) ||
				(r === gridH - 1 && !hasWall(walls, q, r, 'S')) ||
				(q === 0 && !hasWall(walls, q, r, 'W')) ||
				(q === gridW - 1 && !hasWall(walls, q, r, 'E'));

			if (isBoundary && visited[idx(q, r)] === 0) {
				visited[idx(q, r)] = 1;
				outsideQueue.push(q, r);
			}
		}
	}

	// BFS expand outside
	let i = 0;
	while (i < outsideQueue.length) {
		const q = outsideQueue[i++];
		const r = outsideQueue[i++];

		const neighbors: [number, number][] = [];
		if (q > 0) neighbors.push([q - 1, r]);
		if (q < gridW - 1) neighbors.push([q + 1, r]);
		if (r > 0) neighbors.push([q, r - 1]);
		if (r < gridH - 1) neighbors.push([q, r + 1]);

		for (const [nq, nr] of neighbors) {
			if (visited[idx(nq, nr)] !== 0) continue;
			if (canPass(walls, q, r, nq, nr)) {
				visited[idx(nq, nr)] = 1;
				outsideQueue.push(nq, nr);
			}
		}
	}

	// Phase 2: Find enclosed rooms from unvisited cells
	const rooms: DetectedRoom[] = [];

	for (let r = 0; r < gridH; r++) {
		for (let q = 0; q < gridW; q++) {
			if (visited[idx(q, r)] !== 0) continue;

			// BFS to find all connected interior cells
			const cells: { q: number; r: number }[] = [];
			const roomQueue: number[] = [q, r];
			visited[idx(q, r)] = 2;
			let ri = 0;

			while (ri < roomQueue.length) {
				const cq = roomQueue[ri++];
				const cr = roomQueue[ri++];
				cells.push({ q: cq, r: cr });

				const neighbors: [number, number][] = [];
				if (cq > 0) neighbors.push([cq - 1, cr]);
				if (cq < gridW - 1) neighbors.push([cq + 1, cr]);
				if (cr > 0) neighbors.push([cq, cr - 1]);
				if (cr < gridH - 1) neighbors.push([cq, cr + 1]);

				for (const [nq, nr] of neighbors) {
					if (visited[idx(nq, nr)] !== 0) continue;
					if (canPass(walls, cq, cr, nq, nr)) {
						visited[idx(nq, nr)] = 2;
						roomQueue.push(nq, nr);
					}
				}
			}

			if (cells.length > 0) {
				let minQ = Infinity, minR = Infinity, maxQ = -Infinity, maxR = -Infinity;
				for (const c of cells) {
					minQ = Math.min(minQ, c.q);
					minR = Math.min(minR, c.r);
					maxQ = Math.max(maxQ, c.q + 1);
					maxR = Math.max(maxR, c.r + 1);
				}

				rooms.push({
					id: roomId(cells),
					cells,
					bounds: { minQ, minR, maxQ, maxR }
				});
			}
		}
	}

	return rooms;
}

/**
 * Stable room ID from sorted cell coordinates.
 */
export function roomId(cells: { q: number; r: number }[]): string {
	return cells
		.map((c) => `${c.q},${c.r}`)
		.sort()
		.join('|');
}
