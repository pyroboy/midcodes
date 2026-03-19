<script lang="ts">
	import { onMount } from 'svelte';
	import type { FloorLayoutItem, FloorLayoutItemType, WallDrawState, GridIntersection, RoomAssignmentTarget, DrawTool } from './types';
	import { ITEM_TYPE_LABELS, ROOM_TYPES, ROOM_FILL_COLORS } from './types';
	import { itemsToWallSet, edgesToLines, lineToEdges, detectRooms, edgeKey, buildWallMetaMap, type WallEdge, type WallStorageItem, type DetectedRoom, type WallMeta } from './wallEngine';

	let {
		items,
		floorId,
		tool = 'draw' as DrawTool,
		rentalUnitsMap,
		unplacedUnits,
		onWallAdd,
		onWallRemove,
		onRoomAssign,
		onRoomClear,
		onToolToggle,
		onWallMetaToggle,
		onWallColorChange
	}: {
		items: FloorLayoutItem[];
		floorId: number;
		tool?: DrawTool;
		rentalUnitsMap: Map<string, any>;
		unplacedUnits: any[];
		onWallAdd: (edges: WallEdge[]) => void;
		onWallRemove: (edges: WallEdge[]) => void;
		onRoomAssign: (data: { roomId: string; cells: { q: number; r: number }[]; bounds: any; item_type: FloorLayoutItemType; rental_unit_id: number | null; label: string | null }) => void;
		onRoomClear: (roomId: string) => void;
		onToolToggle?: () => void;
		onWallMetaToggle: (edge: WallEdge, kind: 'door' | 'window') => void;
		onWallColorChange: (edge: WallEdge, color: string | null) => void;
	} = $props();

	let cellSize = $state(48);
	let gridCols = $state(20);
	let gridRows = $state(16);
	let cellSizeMeters = 1.0; // 1 cell = 1 meter

	// ─── Feature 4: Thick wall rendering ──────────────────────────────
	let WALL_HALF_THICK = $derived(Math.max(3, cellSize * 0.08));

	function wallLineToRect(x1: number, y1: number, x2: number, y2: number, ht: number): string {
		if (y1 === y2) {
			// Horizontal
			return `${x1},${y1 - ht} ${x2},${y1 - ht} ${x2},${y1 + ht} ${x1},${y1 + ht}`;
		}
		// Vertical
		return `${x1 - ht},${y1} ${x1 + ht},${y1} ${x1 + ht},${y2} ${x1 - ht},${y2}`;
	}

	// SVG element ref for PNG export
	let svgEl = $state<SVGSVGElement | undefined>();
	let isExporting = $state(false);

	// Grid container ref for reliable offset calculation
	let gridEl: HTMLDivElement | undefined = $state();

	// ─── Derived: Wall set + lines ─────────────────────────────────────
	let wallItems = $derived(items.filter((i) => i.item_type === 'WALL') as unknown as WallStorageItem[]);
	let wallSet = $derived(itemsToWallSet(wallItems));
	let wallLines = $derived(edgesToLines(wallSet));
	let wallMetaMap = $derived(buildWallMetaMap(wallItems));

	// ─── Derived: Room detection ───────────────────────────────────────
	let detectedRooms = $derived(detectRooms(wallSet, gridCols, gridRows));

	let cellRoomMap = $derived.by(() => {
		const map = new Map<string, DetectedRoom>();
		for (const room of detectedRooms) {
			for (const cell of room.cells) map.set(`${cell.q},${cell.r}`, room);
		}
		return map;
	});

	let assignmentMap = $derived.by(() => {
		const map = new Map<string, FloorLayoutItem>();
		for (const item of items) {
			if (item.item_type === 'WALL') continue;
			const key = `${item.grid_x},${item.grid_y},${item.grid_w},${item.grid_h}`;
			map.set(key, item);
		}
		return map;
	});

	function getAssignment(room: DetectedRoom): FloorLayoutItem | null {
		const key = `${room.bounds.minQ},${room.bounds.minR},${room.bounds.maxQ - room.bounds.minQ},${room.bounds.maxR - room.bounds.minR}`;
		return assignmentMap.get(key) ?? null;
	}

	function roomFillColor(room: DetectedRoom): string {
		const a = getAssignment(room);
		if (!a) return ROOM_FILL_COLORS._unassigned;
		return ROOM_FILL_COLORS[a.item_type] ?? ROOM_FILL_COLORS._unassigned;
	}

	function roomLabel(room: DetectedRoom): { text: string; area: string; assigned: boolean } {
		const a = getAssignment(room);
		const areaSqM = room.cells.length * cellSizeMeters * cellSizeMeters;
		const area = `${areaSqM.toFixed(1)} m²`;

		if (!a) return { text: `${room.cells.length} cells`, area, assigned: false };
		if (a.item_type === 'RENTAL_UNIT' && a.rental_unit_id) {
			const unit = rentalUnitsMap.get(a.rental_unit_id);
			return { text: unit?.name ?? 'Rental Unit', area, assigned: true };
		}
		return { text: a.label ?? ITEM_TYPE_LABELS[a.item_type] ?? a.item_type, area, assigned: true };
	}

	// ─── Drawing state ─────────────────────────────────────────────────
	let drawState = $state<WallDrawState | null>(null);
	let previewEnd = $state<GridIntersection | null>(null);
	let cursorSnap = $state<GridIntersection | null>(null);
	let eraseMode = $state(false);
	let dragStartPx = $state<{ x: number; y: number } | null>(null); // pixel position at mousedown

	// ─── Room hover ────────────────────────────────────────────────────
	let hoveredRoomId = $state<string | null>(null);

	// ─── Selection (bounding box) ──────────────────────────────────────
	let selStart = $state<{ px: number; py: number } | null>(null);
	let selEnd = $state<{ px: number; py: number } | null>(null);
	let selectedWallEdges = $state<WallEdge[]>([]);
	let selPopupPos = $state<{ x: number; y: number } | null>(null);

	let selRect = $derived.by(() => {
		if (!selStart || !selEnd) return null;
		return {
			x: Math.min(selStart.px, selEnd.px),
			y: Math.min(selStart.py, selEnd.py),
			w: Math.abs(selEnd.px - selStart.px),
			h: Math.abs(selEnd.py - selStart.py)
		};
	});

	function findWallsInRect(rect: { x: number; y: number; w: number; h: number }): WallEdge[] {
		const found: WallEdge[] = [];
		for (const line of wallLines) {
			const mx = ((line.x1 + line.x2) / 2) * cellSize;
			const my = ((line.y1 + line.y2) / 2) * cellSize;
			if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h) {
				if (line.y1 === line.y2) {
					found.push({ q: Math.min(line.x1, line.x2), r: line.y1, dir: 'N' });
				} else {
					found.push({ q: line.x1, r: Math.min(line.y1, line.y2), dir: 'W' });
				}
			}
		}
		return found;
	}

	function clearSelection() {
		selectedWallEdges = [];
		selPopupPos = null;
		selStart = null;
		selEnd = null;
	}

	function deleteSelectedWalls() {
		if (selectedWallEdges.length > 0) onWallRemove(selectedWallEdges);
		clearSelection();
	}

	// Build a Set of selected edge keys for highlighting
	let selectedEdgeKeys = $derived(new Set(selectedWallEdges.map((e) => `${e.q},${e.r},${e.dir}`)));

	// ─── Assignment popup ──────────────────────────────────────────────
	let assignTarget = $state<RoomAssignmentTarget | null>(null);
	let assignType = $state<FloorLayoutItemType>('RENTAL_UNIT');
	let assignUnitId = $state<string>('');

	// ─── Feature 7: Wall color picker ─────────────────────────────────
	let selectedWallForColor = $state<{ edge: WallEdge; anchorPx: { x: number; y: number } } | null>(null);
	let selectedWallColor = $state('#334155');

	// ─── Grid auto-expand ──────────────────────────────────────────────
	$effect(() => {
		if (!cursorSnap) return;
		if (cursorSnap.x >= gridCols - 1) gridCols = cursorSnap.x + 4;
		if (cursorSnap.y >= gridRows - 1) gridRows = cursorSnap.y + 4;
	});

	// ─── Offset helper (uses stored ref, not e.currentTarget) ──────────
	function getGridOffset(e: MouseEvent): { px: number; py: number } {
		if (!gridEl) return { px: 0, py: 0 };
		const rect = gridEl.getBoundingClientRect();
		return { px: e.clientX - rect.left, py: e.clientY - rect.top };
	}

	function snapToIntersection(px: number, py: number): GridIntersection {
		return { x: Math.round(px / cellSize), y: Math.round(py / cellSize) };
	}

	function cellFromPixel(px: number, py: number): { q: number; r: number } {
		return { q: Math.floor(px / cellSize), r: Math.floor(py / cellSize) };
	}

	// ─── Did the mouse move enough to count as a drag? ─────────────────
	function isDragDistance(e: MouseEvent): boolean {
		if (!dragStartPx) return false;
		const dx = e.clientX - dragStartPx.x;
		const dy = e.clientY - dragStartPx.y;
		return Math.abs(dx) > 5 || Math.abs(dy) > 5; // 5px threshold
	}

	// ─── Find nearest wall edge for deletion ───────────────────────────
	function findNearestWallEdge(px: number, py: number, snapDist: number = 12): WallEdge | null {
		let best: WallEdge | null = null;
		let bestDist = snapDist;

		for (const line of wallLines) {
			let dist: number;
			if (line.y1 === line.y2) {
				const minX = Math.min(line.x1, line.x2) * cellSize;
				const maxX = Math.max(line.x1, line.x2) * cellSize;
				if (px >= minX - 4 && px <= maxX + 4) {
					dist = Math.abs(py - line.y1 * cellSize);
				} else continue;
			} else {
				const minY = Math.min(line.y1, line.y2) * cellSize;
				const maxY = Math.max(line.y1, line.y2) * cellSize;
				if (py >= minY - 4 && py <= maxY + 4) {
					dist = Math.abs(px - line.x1 * cellSize);
				} else continue;
			}

			if (dist < bestDist) {
				bestDist = dist;
				if (line.y1 === line.y2) {
					best = { q: Math.min(line.x1, line.x2), r: line.y1, dir: 'N' };
				} else {
					best = { q: line.x1, r: Math.min(line.y1, line.y2), dir: 'W' };
				}
			}
		}
		return best;
	}

	// ─── Mouse handlers ────────────────────────────────────────────────

	function handleMouseDown(e: MouseEvent) {
		if (assignTarget) return;
		if (e.button === 2) return;

		const { px, py } = getGridOffset(e);

		// Select tool: start bounding box
		if (tool === 'select') {
			clearSelection();
			selStart = { px, py };
			selEnd = { px, py };
			dragStartPx = { x: e.clientX, y: e.clientY };
			e.preventDefault();
			window.addEventListener('mousemove', handleWindowMouseMove);
			window.addEventListener('mouseup', handleWindowMouseUp);
			return;
		}

		const snap = snapToIntersection(px, py);
		eraseMode = tool === 'erase';
		drawState = { start: snap, lockedAxis: null };
		previewEnd = snap;
		dragStartPx = { x: e.clientX, y: e.clientY };
		e.preventDefault();

		window.addEventListener('mousemove', handleWindowMouseMove);
		window.addEventListener('mouseup', handleWindowMouseUp);
	}

	function handleLocalMouseMove(e: MouseEvent) {
		// Only update hover + cursor snap (not drag — that's on window)
		const { px, py } = getGridOffset(e);
		cursorSnap = snapToIntersection(px, py);
		const { q, r } = cellFromPixel(px, py);
		hoveredRoomId = cellRoomMap.get(`${q},${r}`)?.id ?? null;
	}

	function handleWindowMouseMove(e: MouseEvent) {
		// Select tool: update bounding box
		if (tool === 'select' && selStart) {
			const { px, py } = getGridOffset(e);
			selEnd = { px, py };
			return;
		}

		if (!drawState) return;
		const { px, py } = getGridOffset(e);
		const snap = snapToIntersection(px, py);
		cursorSnap = snap;

		const dx = snap.x - drawState.start.x;
		const dy = snap.y - drawState.start.y;

		if (drawState.lockedAxis === null && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
			drawState.lockedAxis = Math.abs(dx) >= Math.abs(dy) ? 'H' : 'V';
		}

		if (drawState.lockedAxis === 'H') {
			previewEnd = { x: snap.x, y: drawState.start.y };
		} else if (drawState.lockedAxis === 'V') {
			previewEnd = { x: drawState.start.x, y: snap.y };
		} else {
			previewEnd = snap;
		}
	}

	function handleWindowMouseUp(e: MouseEvent) {
		window.removeEventListener('mousemove', handleWindowMouseMove);
		window.removeEventListener('mouseup', handleWindowMouseUp);

		// Select tool: finalize selection
		if (tool === 'select' && selStart && selEnd) {
			const rect = selRect;
			if (rect && rect.w > 5 && rect.h > 5) {
				// Drag selection: find walls inside bounding box
				selectedWallForColor = null;
				const edges = findWallsInRect(rect);
				if (edges.length > 0) {
					selectedWallEdges = edges;
					selPopupPos = { x: rect.x + rect.w / 2, y: rect.y + rect.h + 8 };
				} else {
					clearSelection();
				}
			} else {
				// Single click (no drag): open wall color picker if near a wall
				clearSelection();
				const { px, py } = getGridOffset(e);
				const nearEdge = findNearestWallEdge(px, py, cellSize * 0.6);
				if (nearEdge) {
					const key = edgeKey(nearEdge.q, nearEdge.r, nearEdge.dir);
					const meta = wallMetaMap.get(key) ?? {};
					selectedWallColor = meta.color ?? '#334155';
					selectedWallForColor = { edge: nearEdge, anchorPx: { x: px, y: py } };
				} else {
					selectedWallForColor = null;
				}
			}
			selStart = null;
			selEnd = null;
			dragStartPx = null;
			return;
		}

		const dragged = isDragDistance(e);

		if (drawState && previewEnd && dragged) {
			// Drag completed → draw or erase walls
			const s = drawState.start;
			const end = previewEnd;
			if (s.x !== end.x || s.y !== end.y) {
				const edges = lineToEdges(s.x, s.y, end.x, end.y);
				if (edges.length > 0) {
					if (eraseMode) {
						onWallRemove(edges);
					} else {
						onWallAdd(edges);
					}
				}
			}
		} else if (!dragged && drawState) {
			// Click without drag
			if (tool === 'door' || tool === 'window') {
				// Door/window tool click → toggle meta on nearest wall
				const { px, py } = getGridOffset(e);
				const nearEdge = findNearestWallEdge(px, py, cellSize * 0.6);
				if (nearEdge) {
					onWallMetaToggle(nearEdge, tool);
				}
			} else if (eraseMode) {
				// Erase mode click → delete nearest wall segment
				const { px, py } = getGridOffset(e);
				const edge = findNearestWallEdge(px, py, cellSize * 0.6);
				if (edge) {
					onWallRemove([edge]);
				}
			} else {
				// Draw mode click → room assignment
				const { px, py } = getGridOffset(e);
				const { q, r } = cellFromPixel(px, py);
				const room = cellRoomMap.get(`${q},${r}`);
				if (room) {
					assignTarget = {
						roomId: room.id,
						cells: room.cells,
						bounds: room.bounds,
						anchorPx: { x: px, y: py }
					};
					const existing = getAssignment(room);
					if (existing) {
						assignType = existing.item_type as FloorLayoutItemType;
						assignUnitId = existing.rental_unit_id ?? '';
					} else {
						assignType = 'RENTAL_UNIT';
						assignUnitId = '';
					}
				}
			}
		}

		drawState = null;
		previewEnd = null;
		eraseMode = false;
		dragStartPx = null;
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (assignTarget) return;
		// Right-click → delete nearest wall segment
		const { px, py } = getGridOffset(e);
		const edge = findNearestWallEdge(px, py, 14);
		if (edge) {
			onWallRemove([edge]);
		}
	}

	function commitAssignment() {
		if (!assignTarget) return;
		onRoomAssign({
			roomId: assignTarget.roomId,
			cells: assignTarget.cells,
			bounds: assignTarget.bounds,
			item_type: assignType,
			rental_unit_id: assignType === 'RENTAL_UNIT' && assignUnitId ? parseInt(assignUnitId, 10) : null,
			label: null
		});
		assignTarget = null;
	}

	function clearAssignment() {
		if (!assignTarget) return;
		onRoomClear(assignTarget.roomId);
		assignTarget = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (drawState) {
				window.removeEventListener('mousemove', handleWindowMouseMove);
				window.removeEventListener('mouseup', handleWindowMouseUp);
			}
			drawState = null;
			previewEnd = null;
			assignTarget = null;
			dragStartPx = null;
			selectedWallForColor = null;
			clearSelection();
		}
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (selectedWallEdges.length > 0) {
				deleteSelectedWalls();
				e.preventDefault();
			}
		}
		// E key toggles erase mode
		if (e.key === 'e' || e.key === 'E') {
			if (!assignTarget && !drawState) onToolToggle?.();
		}
	}

	// Cleanup on unmount
	onMount(() => {
		return () => {
			window.removeEventListener('mousemove', handleWindowMouseMove);
			window.removeEventListener('mouseup', handleWindowMouseUp);
		};
	});

	// Whether cursor is near a wall (for visual feedback)
	let nearWall = $derived.by(() => {
		if (!cursorSnap || drawState) return false;
		const px = cursorSnap.x * cellSize;
		const py = cursorSnap.y * cellSize;
		return findNearestWallEdge(px, py, 14) !== null;
	});

	// ─── Feature 8: Alignment guides ──────────────────────────────────
	let wallEndpoints = $derived.by(() => {
		const xs = new Set<number>();
		const ys = new Set<number>();
		for (const line of wallLines) {
			xs.add(line.x1); xs.add(line.x2);
			ys.add(line.y1); ys.add(line.y2);
		}
		return { xs, ys };
	});

	let alignGuides = $derived.by(() => {
		if (!drawState || tool !== 'draw' || !cursorSnap) return { x: null as number | null, y: null as number | null };
		return {
			x: wallEndpoints.xs.has(cursorSnap.x) ? cursorSnap.x : null,
			y: wallEndpoints.ys.has(cursorSnap.y) ? cursorSnap.y : null
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative overflow-auto flex-1 bg-muted/30"
	onkeydown={handleKeydown}
	tabindex="-1"
>
	<!-- Zoom + Export -->
	<div class="absolute top-2 right-2 z-20 flex gap-1">
		<button
			class="px-2 py-1 rounded bg-background border text-xs hover:bg-secondary disabled:opacity-40"
			disabled={isExporting}
			onclick={async () => {
				if (!svgEl) return;
				isExporting = true;
				try {
					const { exportFloorPlanPng } = await import('./exportPng');
					await exportFloorPlanPng(svgEl, `floor-${floorId}.png`);
				} finally {
					isExporting = false;
				}
			}}
		>
			{isExporting ? 'Exporting...' : 'Export PNG'}
		</button>
		<button class="px-2 py-1 rounded bg-background border text-xs hover:bg-secondary"
			onclick={() => (cellSize = Math.max(24, cellSize - 8))}>-</button>
		<span class="px-2 py-1 text-xs text-muted-foreground">{cellSize}px</span>
		<button class="px-2 py-1 rounded bg-background border text-xs hover:bg-secondary"
			onclick={() => (cellSize = Math.min(96, cellSize + 8))}>+</button>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={gridEl}
		class="relative"
		class:cursor-crosshair={(tool === 'draw' || tool === 'door' || tool === 'window') && (!hoveredRoomId || drawState)}
		class:cursor-pointer={tool === 'draw' && hoveredRoomId && !drawState}
		class:cursor-cell={tool === 'erase'}
		class:cursor-default={tool === 'select'}
		style="width: {gridCols * cellSize}px; height: {gridRows * cellSize}px; min-width: 100%; min-height: 100%;"
		onmousedown={handleMouseDown}
		onmousemove={handleLocalMouseMove}
		oncontextmenu={handleContextMenu}
	>
		<svg bind:this={svgEl} class="absolute inset-0 pointer-events-none" width="100%" height="100%">
			<!-- Grid lines -->
			{#each Array(gridCols + 1) as _, i}
				<line x1={i * cellSize} y1={0} x2={i * cellSize} y2={gridRows * cellSize}
					stroke="currentColor" stroke-opacity="0.06" stroke-width="1" />
			{/each}
			{#each Array(gridRows + 1) as _, i}
				<line x1={0} y1={i * cellSize} x2={gridCols * cellSize} y2={i * cellSize}
					stroke="currentColor" stroke-opacity="0.06" stroke-width="1" />
			{/each}

			<!-- Room fills -->
			{#each detectedRooms as room (room.id)}
				{@const fill = roomFillColor(room)}
				{#each room.cells as cell (`${cell.q},${cell.r}`)}
					<rect
						x={cell.q * cellSize + 1} y={cell.r * cellSize + 1}
						width={cellSize - 2} height={cellSize - 2}
						{fill} opacity="0.4"
					/>
				{/each}
			{/each}

			<!-- Hover highlight -->
			{#if hoveredRoomId && !drawState}
				{@const hRoom = detectedRooms.find((r) => r.id === hoveredRoomId)}
				{#if hRoom}
					{#each hRoom.cells as cell (`h-${cell.q},${cell.r}`)}
						<rect
							x={cell.q * cellSize} y={cell.r * cellSize}
							width={cellSize} height={cellSize}
							fill="#3b82f6" opacity="0.15"
						/>
					{/each}
				{/if}
			{/if}

			<!-- Alignment guides (Feature 8) -->
			{#if alignGuides.x !== null}
				<line
					x1={alignGuides.x * cellSize} y1={0}
					x2={alignGuides.x * cellSize} y2={gridRows * cellSize}
					stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"
				/>
			{/if}
			{#if alignGuides.y !== null}
				<line
					x1={0} y1={alignGuides.y * cellSize}
					x2={gridCols * cellSize} y2={alignGuides.y * cellSize}
					stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"
				/>
			{/if}

			<!-- Stairwell / Elevator symbols (Feature 9) -->
			{#each detectedRooms as room (`sym-${room.id}`)}
				{@const a = getAssignment(room)}
				{#if a?.item_type === 'STAIRWELL' || a?.item_type === 'ELEVATOR'}
					{@const rx = room.bounds.minQ * cellSize}
					{@const ry = room.bounds.minR * cellSize}
					{@const rw = (room.bounds.maxQ - room.bounds.minQ) * cellSize}
					{@const rh = (room.bounds.maxR - room.bounds.minR) * cellSize}
					{@const cx = rx + rw / 2}

					{#if a.item_type === 'STAIRWELL'}
						{@const steps = Math.max(3, Math.floor(rh / 14))}
						{@const stepH = rh / steps}
						{#each Array(steps) as _, si}
							{@const stepW = rw * (1 - si / steps) * 0.8}
							<line
								x1={cx - stepW / 2} y1={ry + si * stepH + stepH * 0.8}
								x2={cx + stepW / 2} y2={ry + si * stepH + stepH * 0.8}
								stroke="#92400e" stroke-width="1.5" opacity="0.6"
							/>
						{/each}
						<polygon
							points="{cx},{ry + 6} {cx - 5},{ry + 14} {cx + 5},{ry + 14}"
							fill="#92400e" opacity="0.7"
						/>
					{:else}
						<line x1={rx + 4} y1={ry + 4} x2={rx + rw - 4} y2={ry + rh - 4}
							stroke="#4338ca" stroke-width="1.5" opacity="0.5" />
						<line x1={rx + rw - 4} y1={ry + 4} x2={rx + 4} y2={ry + rh - 4}
							stroke="#4338ca" stroke-width="1.5" opacity="0.5" />
					{/if}
				{/if}
			{/each}

			<!-- Wall polygons with door/window overlays -->
			{#each wallLines as line (`${line.x1},${line.y1},${line.x2},${line.y2}`)}
				{@const isHoriz = line.y1 === line.y2}
				{@const eKey = isHoriz
					? edgeKey(Math.min(line.x1, line.x2), line.y1, 'N')
					: edgeKey(line.x1, Math.min(line.y1, line.y2), 'W')}
				{@const meta = wallMetaMap.get(eKey) ?? {}}
				{@const edgeDir = isHoriz ? 'N' : 'W'}
				{@const eq = isHoriz ? Math.min(line.x1, line.x2) : line.x1}
				{@const er = isHoriz ? line.y1 : Math.min(line.y1, line.y2)}
				{@const isSelected = selectedEdgeKeys.has(`${eq},${er},${edgeDir}`)}
				{@const x1 = line.x1 * cellSize}
				{@const y1 = line.y1 * cellSize}
				{@const x2 = line.x2 * cellSize}
				{@const y2 = line.y2 * cellSize}
				{@const wallColor = isSelected ? '#3b82f6' : (meta.color ?? '#334155')}
				{@const ht = isSelected ? WALL_HALF_THICK + 2 : WALL_HALF_THICK}

				{#if meta.door}
					<!-- Door: two half-wall segments with gap + arc swing -->
					{@const midX = (x1 + x2) / 2}
					{@const midY = (y1 + y2) / 2}
					{@const doorW = cellSize * 0.8}
					{#if isHoriz}
						<polygon points={wallLineToRect(x1, y1, midX - doorW / 2, y1, ht)} fill={wallColor} />
						<polygon points={wallLineToRect(midX + doorW / 2, y1, x2, y1, ht)} fill={wallColor} />
						<path
							d="M {midX - doorW / 2} {y1} A {doorW} {doorW} 0 0 1 {midX} {y1 + doorW}"
							stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 2" fill="none" />
						<line x1={midX - doorW / 2} y1={y1} x2={midX} y2={y1 + doorW}
							stroke="#64748b" stroke-width="1.5" />
					{:else}
						<polygon points={wallLineToRect(x1, y1, x1, midY - doorW / 2, ht)} fill={wallColor} />
						<polygon points={wallLineToRect(x1, midY + doorW / 2, x1, y2, ht)} fill={wallColor} />
						<path
							d="M {x1} {midY - doorW / 2} A {doorW} {doorW} 0 0 1 {x1 + doorW} {midY}"
							stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 2" fill="none" />
						<line x1={x1} y1={midY - doorW / 2} x2={x1 + doorW} y2={midY}
							stroke="#64748b" stroke-width="1.5" />
					{/if}
				{:else if meta.window}
					<!-- Window: full wall with glass pane overlay -->
					<polygon points={wallLineToRect(x1, y1, x2, y2, ht)} fill={wallColor} />
					{#if isHoriz}
						{@const wMidX = (x1 + x2) / 2}
						{@const paneW = cellSize * 0.6}
						<line x1={wMidX - paneW / 2} y1={y1 - 6} x2={wMidX + paneW / 2} y2={y1 - 6}
							stroke="#7dd3fc" stroke-width="2" />
						<line x1={wMidX - paneW / 2} y1={y1 + 6} x2={wMidX + paneW / 2} y2={y1 + 6}
							stroke="#7dd3fc" stroke-width="2" />
						<rect x={wMidX - paneW / 2} y={y1 - 6} width={paneW} height={12}
							fill="#bae6fd" opacity="0.5" />
					{:else}
						{@const wMidY = (y1 + y2) / 2}
						{@const paneH = cellSize * 0.6}
						<line x1={x1 - 6} y1={wMidY - paneH / 2} x2={x1 - 6} y2={wMidY + paneH / 2}
							stroke="#7dd3fc" stroke-width="2" />
						<line x1={x1 + 6} y1={wMidY - paneH / 2} x2={x1 + 6} y2={wMidY + paneH / 2}
							stroke="#7dd3fc" stroke-width="2" />
						<rect x={x1 - 6} y={wMidY - paneH / 2} width={12} height={paneH}
							fill="#bae6fd" opacity="0.5" />
					{/if}
				{:else}
					<!-- Plain wall -->
					<polygon points={wallLineToRect(x1, y1, x2, y2, ht)} fill={wallColor} />
				{/if}
			{/each}

			<!-- Selection rectangle (while dragging) -->
			{#if selRect && tool === 'select'}
				<rect
					x={selRect.x} y={selRect.y}
					width={selRect.w} height={selRect.h}
					fill="#3b82f6" fill-opacity="0.08"
					stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="6 3"
				/>
			{/if}

			<!-- Draw preview -->
			{#if drawState && previewEnd}
				{@const s = drawState.start}
				{#if s.x !== previewEnd.x || s.y !== previewEnd.y}
					<line
						x1={s.x * cellSize} y1={s.y * cellSize}
						x2={previewEnd.x * cellSize} y2={previewEnd.y * cellSize}
						stroke={eraseMode ? '#ef4444' : '#334155'}
						stroke-width={WALL_HALF_THICK * 2} stroke-dasharray="6 4" stroke-linecap="square" opacity="0.6"
					/>
				{/if}
				<circle cx={s.x * cellSize} cy={s.y * cellSize} r={WALL_HALF_THICK + 1} fill="#334155" opacity="0.7" />
			{/if}

			<!-- Cursor snap dot (when not drawing) -->
			{#if cursorSnap && !drawState && !assignTarget && tool !== 'select'}
				<circle
					cx={cursorSnap.x * cellSize} cy={cursorSnap.y * cellSize}
					r="5" fill="#334155" opacity="0.5"
				/>
			{/if}

			<!-- SVG text labels for rooms (visible in PNG export) -->
			{#each detectedRooms as room (`label-${room.id}`)}
				{@const info = roomLabel(room)}
				{@const cx = ((room.bounds.minQ + room.bounds.maxQ) / 2) * cellSize}
				{@const cy = ((room.bounds.minR + room.bounds.maxR) / 2) * cellSize}
				{@const rw = (room.bounds.maxQ - room.bounds.minQ) * cellSize}
				{@const rh = (room.bounds.maxR - room.bounds.minR) * cellSize}
				{#if rw > 36 && rh > 24}
					<text
						x={cx} y={cy - 4}
						text-anchor="middle" dominant-baseline="middle"
						font-size="11" font-family="system-ui, sans-serif"
						fill={info.assigned ? '#1e293b' : '#94a3b8'}
						font-weight={info.assigned ? '600' : '400'}
					>
						{info.text}
					</text>
					<text
						x={cx} y={cy + 10}
						text-anchor="middle" dominant-baseline="middle"
						font-size="9" font-family="system-ui, sans-serif"
						fill="#64748b"
					>
						{info.area}
					</text>
				{/if}
			{/each}
		</svg>

		<!-- Room labels -->
		{#each detectedRooms as room (room.id)}
			{@const info = roomLabel(room)}
			{@const a = getAssignment(room)}
			{@const rw = (room.bounds.maxQ - room.bounds.minQ) * cellSize}
			{@const rh = (room.bounds.maxR - room.bounds.minR) * cellSize}
			{#if rw > 36 && rh > 24}
				<div
					class="absolute pointer-events-none flex flex-col items-center justify-center gap-0.5 p-1"
					style="left: {room.bounds.minQ * cellSize}px; top: {room.bounds.minR * cellSize}px;
						width: {rw}px; height: {rh}px;"
				>
					<span
						class="px-2 py-0.5 rounded-md text-xs font-semibold leading-tight truncate max-w-full shadow-sm
							{info.assigned
								? 'bg-white/90 text-slate-800 border border-slate-200'
								: 'bg-white/60 text-slate-400 border border-dashed border-slate-300 italic'}"
					>
						{info.text}
					</span>
					<!-- Area display -->
					<span class="text-[10px] text-slate-500 leading-tight">{info.area}</span>
					{#if info.assigned && a}
						{#if a.item_type === 'RENTAL_UNIT' && a.rental_unit_id}
							{@const unit = rentalUnitsMap.get(a.rental_unit_id)}
							{#if unit && rh > 56}
								<span class="px-1.5 py-0.5 rounded bg-blue-100/80 text-[10px] text-blue-700 font-medium leading-tight truncate max-w-full">
									cap. {unit.capacity} · {unit.type}
								</span>
							{/if}
						{/if}
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Selection action popup -->
		{#if selectedWallEdges.length > 0 && selPopupPos}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute z-30 bg-background border rounded-lg shadow-lg px-3 py-2 flex items-center gap-3"
				style="left: {Math.max(8, selPopupPos.x - 80)}px; top: {selPopupPos.y}px;"
				onmousedown={(e) => e.stopPropagation()}
			>
				<span class="text-xs text-muted-foreground font-medium">
					{selectedWallEdges.length} wall{selectedWallEdges.length !== 1 ? 's' : ''} selected
				</span>
				<button
					class="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
					onclick={deleteSelectedWalls}
				>
					Delete
				</button>
				<button
					class="px-2.5 py-1 rounded border text-xs hover:bg-secondary transition-colors"
					onclick={clearSelection}
				>
					Cancel
				</button>
			</div>
		{/if}

		<!-- Wall color picker popup (Feature 7) -->
		{#if selectedWallForColor}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute z-40 bg-background border rounded-lg shadow-lg p-3 space-y-2"
				style="left: {Math.min(selectedWallForColor.anchorPx.x, gridCols * cellSize - 180)}px;
					   top: {Math.min(selectedWallForColor.anchorPx.y + 8, gridRows * cellSize - 140)}px;"
				onmousedown={(e) => e.stopPropagation()}
				onmouseup={(e) => e.stopPropagation()}
			>
				<p class="text-xs font-semibold text-muted-foreground">Wall Color</p>
				<input
					type="color"
					bind:value={selectedWallColor}
					class="w-full h-8 rounded border cursor-pointer"
				/>
				<div class="flex gap-2">
					<button
						class="flex-1 px-2 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
						onclick={() => {
							onWallColorChange(selectedWallForColor!.edge, selectedWallColor);
							selectedWallForColor = null;
						}}
					>Apply</button>
					<button
						class="px-2 py-1.5 rounded border text-xs hover:bg-secondary"
						onclick={() => {
							onWallColorChange(selectedWallForColor!.edge, null);
							selectedWallForColor = null;
						}}
					>Reset</button>
					<button
						class="px-2 py-1.5 rounded border text-xs hover:bg-secondary"
						onclick={() => (selectedWallForColor = null)}
					>Cancel</button>
				</div>
			</div>
		{/if}

		<!-- Assignment popup -->
		{#if assignTarget}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute z-30 bg-background border rounded-lg shadow-lg p-3 space-y-2 w-56"
				style="left: {Math.min(assignTarget.anchorPx.x, gridCols * cellSize - 240)}px;
					   top: {Math.min(assignTarget.anchorPx.y + 8, gridRows * cellSize - 200)}px;"
				onmousedown={(e) => e.stopPropagation()}
				onmouseup={(e) => e.stopPropagation()}
			>
				<p class="text-xs font-semibold text-muted-foreground uppercase">
					Assign Room ({assignTarget.cells.length} cells)
				</p>

				<select
					class="w-full rounded border px-2 py-1.5 text-sm bg-background"
					bind:value={assignType}
				>
					{#each ROOM_TYPES as rt}
						<option value={rt.value}>{rt.label}</option>
					{/each}
				</select>

				{#if assignType === 'RENTAL_UNIT'}
					<select
						class="w-full rounded border px-2 py-1.5 text-sm bg-background"
						bind:value={assignUnitId}
					>
						<option value="">Select unit...</option>
						{#each unplacedUnits as unit (unit.id)}
							<option value={unit.id}>{unit.name} (cap. {unit.capacity})</option>
						{/each}
					</select>
				{/if}

				<div class="flex gap-2">
					<button
						class="flex-1 px-2 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
						onclick={commitAssignment}
					>
						Assign
					</button>
					<button
						class="px-2 py-1.5 rounded border text-xs hover:bg-secondary text-destructive"
						onclick={clearAssignment}
					>
						Clear
					</button>
					<button
						class="px-2 py-1.5 rounded border text-xs hover:bg-secondary"
						onclick={() => (assignTarget = null)}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
