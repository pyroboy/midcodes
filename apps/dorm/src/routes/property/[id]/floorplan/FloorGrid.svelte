<script lang="ts">
	import { onMount } from 'svelte';
	import type { FloorLayoutItem, FloorLayoutItemType, WallDrawState, GridIntersection, RoomAssignmentTarget, DrawTool } from './types';
	import { ITEM_TYPE_LABELS, ROOM_TYPES, ROOM_FILL_COLORS } from './types';
	import { itemsToWallSet, edgesToLines, lineToEdges, detectRooms, edgeKey, buildWallMetaMap, type WallEdge, type WallStorageItem, type DetectedRoom, type WallMeta } from './wallEngine';
	import DoorWindowPopup from './DoorWindowPopup.svelte';

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
		onWallMetaUpdate,
		onWallColorChange,
		onAreaUpdate
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
		onWallMetaUpdate?: (edge: WallEdge, meta: WallMeta) => void;
		onWallColorChange: (edge: WallEdge, color: string | null) => void;
		onAreaUpdate?: (item: { id: string; grid_x: number; grid_y: number; grid_w: number; grid_h: number; cells?: string[] }) => void;
	} = $props();

	let cellSize = $state(48);
	let gridCols = $state(20);
	let gridRows = $state(16);
	let cellSizeMeters = 1.0; // 1 cell = 1 meter

	// ─── Area cell helpers ──────────────────────────────────────────
	function parseAreaCells(item: FloorLayoutItem): string[] | null {
		if (!item.color || item.color.startsWith('#')) return null;
		return item.color.split(';');
	}

	/** Find the cell nearest to the bounding box center that's actually in the shape */
	function labelCellPos(cellKeys: string[], gx: number, gy: number, gw: number, gh: number): { x: number; y: number } {
		const cx = gx + gw / 2;
		const cy = gy + gh / 2;
		let bestKey = cellKeys[0];
		let bestDist = Infinity;
		for (const key of cellKeys) {
			const [q, r] = key.split(',').map(Number);
			const dx = (q + 0.5) - cx;
			const dy = (r + 0.5) - cy;
			const d = dx * dx + dy * dy;
			if (d < bestDist) { bestDist = d; bestKey = key; }
		}
		const [bq, br] = bestKey.split(',').map(Number);
		return { x: (bq + 0.5) * cellSize, y: (br + 0.5) * cellSize };
	}

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

	// Cells occupied by assigned areas — for overlap-based suppression of detected rooms
	let occupiedCells = $derived.by(() => {
		const cells = new Set<string>();
		for (const item of items) {
			if (item.item_type === 'WALL' || item.deleted_at !== null) continue;
			const stored = parseAreaCells(item);
			if (stored) {
				for (const key of stored) cells.add(key);
			} else {
				for (let q = item.grid_x; q < item.grid_x + item.grid_w; q++) {
					for (let r = item.grid_y; r < item.grid_y + item.grid_h; r++) {
						cells.add(`${q},${r}`);
					}
				}
			}
		}
		return cells;
	});

	function roomOverlapsAssigned(room: DetectedRoom): boolean {
		for (const cell of room.cells) {
			if (occupiedCells.has(`${cell.q},${cell.r}`)) return true;
		}
		return false;
	}

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

	// ─── Selected area (for click-to-manage room assignments) ──────
	let selectedAreaId = $state<string | null>(null);
	let areaPopupPos = $state<{ x: number; y: number } | null>(null);

	// ─── Area drag & resize ───────────────────────────────────────
	let areaDrag = $state<{ id: string; startPx: { x: number; y: number }; origX: number; origY: number } | null>(null);
	let areaResize = $state<{ id: string; startPx: { x: number; y: number }; origW: number; origH: number; origX: number; origY: number; corner: 'br' | 'bl' | 'tr' | 'tl' | 'r' | 'l' | 't' | 'b' } | null>(null);
	// Live preview of area bounds during drag/resize
	let areaPreview = $state<{ id: string; grid_x: number; grid_y: number; grid_w: number; grid_h: number } | null>(null);

	// ─── Edit Area Mode (cell-by-cell painting) ──────────────────
	let editAreaMode = $state(false);
	let editAreaId = $state<string | null>(null);
	let editAreaTool = $state<'add' | 'remove'>('add');
	let editAreaCells = $state<Set<string>>(new Set()); // "q,r" keys
	let editAreaPaintingActive = $state(false);
	let editAreaHoverCell = $state<{ q: number; r: number } | null>(null);

	function isAdjacentToArea(q: number, r: number): boolean {
		return editAreaCells.has(`${q - 1},${r}`) || editAreaCells.has(`${q + 1},${r}`) ||
			editAreaCells.has(`${q},${r - 1}`) || editAreaCells.has(`${q},${r + 1}`);
	}

	function editAreaToggleCell(q: number, r: number) {
		const key = `${q},${r}`;
		if (editAreaTool === 'add') {
			if (editAreaCells.size === 0 || isAdjacentToArea(q, r)) {
				editAreaCells = new Set([...editAreaCells, key]);
			}
		} else {
			if (editAreaCells.has(key)) {
				const next = new Set(editAreaCells);
				next.delete(key);
				editAreaCells = next;
			}
		}
	}

	function handleEditAreaMouseMove(e: MouseEvent) {
		if (!editAreaPaintingActive) return;
		const { px, py } = getGridOffset(e);
		const { q, r } = cellFromPixel(px, py);
		editAreaToggleCell(q, r);
	}

	function handleEditAreaMouseUp() {
		editAreaPaintingActive = false;
		window.removeEventListener('mousemove', handleEditAreaMouseMove);
		window.removeEventListener('mouseup', handleEditAreaMouseUp);
	}

	function commitEditArea() {
		if (!editAreaId || editAreaCells.size === 0) { cancelEditArea(); return; }
		let minQ = Infinity, minR = Infinity, maxQ = -Infinity, maxR = -Infinity;
		for (const key of editAreaCells) {
			const [q, r] = key.split(',').map(Number);
			minQ = Math.min(minQ, q); minR = Math.min(minR, r);
			maxQ = Math.max(maxQ, q + 1); maxR = Math.max(maxR, r + 1);
		}
		onAreaUpdate?.({
			id: editAreaId,
			grid_x: minQ, grid_y: minR,
			grid_w: maxQ - minQ, grid_h: maxR - minR,
			cells: Array.from(editAreaCells)
		});
		cancelEditArea();
	}

	function cancelEditArea() {
		editAreaMode = false;
		editAreaId = null;
		editAreaCells = new Set();
		editAreaPaintingActive = false;
		editAreaHoverCell = null;
	}

	function handleAreaDragStart(id: string, e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		const item = items.find((i) => i.id === id);
		if (!item) return;
		areaDrag = { id, startPx: { x: e.clientX, y: e.clientY }, origX: item.grid_x, origY: item.grid_y };
		areaPreview = { id, grid_x: item.grid_x, grid_y: item.grid_y, grid_w: item.grid_w, grid_h: item.grid_h };
		areaPopupPos = null; // hide popup while dragging
		window.addEventListener('mousemove', handleAreaMouseMove);
		window.addEventListener('mouseup', handleAreaMouseUp);
	}

	function handleAreaResizeStart(id: string, corner: 'br' | 'bl' | 'tr' | 'tl' | 'r' | 'l' | 't' | 'b', e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		const item = items.find((i) => i.id === id);
		if (!item) return;
		areaResize = { id, startPx: { x: e.clientX, y: e.clientY }, origW: item.grid_w, origH: item.grid_h, origX: item.grid_x, origY: item.grid_y, corner };
		areaPreview = { id, grid_x: item.grid_x, grid_y: item.grid_y, grid_w: item.grid_w, grid_h: item.grid_h };
		areaPopupPos = null;
		window.addEventListener('mousemove', handleAreaMouseMove);
		window.addEventListener('mouseup', handleAreaMouseUp);
	}

	function handleAreaMouseMove(e: MouseEvent) {
		if (areaDrag) {
			const dx = Math.round((e.clientX - areaDrag.startPx.x) / cellSize);
			const dy = Math.round((e.clientY - areaDrag.startPx.y) / cellSize);
			const item = items.find((i) => i.id === areaDrag!.id);
			if (item) {
				areaPreview = {
					id: areaDrag.id,
					grid_x: Math.max(0, areaDrag.origX + dx),
					grid_y: Math.max(0, areaDrag.origY + dy),
					grid_w: item.grid_w,
					grid_h: item.grid_h
				};
			}
		} else if (areaResize) {
			const dx = Math.round((e.clientX - areaResize.startPx.x) / cellSize);
			const dy = Math.round((e.clientY - areaResize.startPx.y) / cellSize);
			const c = areaResize.corner;
			let gx = areaResize.origX, gy = areaResize.origY;
			let gw = areaResize.origW, gh = areaResize.origH;
			if (c === 'br') { gw = Math.max(1, gw + dx); gh = Math.max(1, gh + dy); }
			else if (c === 'bl') { gx = Math.min(gx + gw - 1, gx + dx); gw = Math.max(1, gw - dx); gh = Math.max(1, gh + dy); }
			else if (c === 'tr') { gy = Math.min(gy + gh - 1, gy + dy); gw = Math.max(1, gw + dx); gh = Math.max(1, gh - dy); }
			else if (c === 'tl') { gx = Math.min(gx + gw - 1, gx + dx); gy = Math.min(gy + gh - 1, gy + dy); gw = Math.max(1, gw - dx); gh = Math.max(1, gh - dy); }
			else if (c === 'r') { gw = Math.max(1, gw + dx); }
			else if (c === 'l') { gx = Math.min(gx + gw - 1, gx + dx); gw = Math.max(1, gw - dx); }
			else if (c === 'b') { gh = Math.max(1, gh + dy); }
			else if (c === 't') { gy = Math.min(gy + gh - 1, gy + dy); gh = Math.max(1, gh - dy); }
			areaPreview = { id: areaResize.id, grid_x: Math.max(0, gx), grid_y: Math.max(0, gy), grid_w: gw, grid_h: gh };
		}
	}

	function handleAreaMouseUp() {
		window.removeEventListener('mousemove', handleAreaMouseMove);
		window.removeEventListener('mouseup', handleAreaMouseUp);

		if (areaPreview && onAreaUpdate) {
			const item = items.find((i) => i.id === areaPreview!.id);
			if (item && (
				item.grid_x !== areaPreview.grid_x ||
				item.grid_y !== areaPreview.grid_y ||
				item.grid_w !== areaPreview.grid_w ||
				item.grid_h !== areaPreview.grid_h
			)) {
				const storedCells = parseAreaCells(item);
				let newCells: string[] | undefined;

				if (storedCells) {
					if (areaDrag) {
						// Move: translate all cells by delta
						const dq = areaPreview.grid_x - item.grid_x;
						const dr = areaPreview.grid_y - item.grid_y;
						newCells = storedCells.map((key) => {
							const [q, r] = key.split(',').map(Number);
							return `${q + dq},${r + dr}`;
						});
					} else if (areaResize) {
						// Resize: clip to new bounds, then snake-extend edge cells into expanded area
						const ox = item.grid_x, oy = item.grid_y;
						const ow = item.grid_w, oh = item.grid_h;
						const nx = areaPreview.grid_x, ny = areaPreview.grid_y;
						const nw = areaPreview.grid_w, nh = areaPreview.grid_h;

						// Start with existing cells clipped to new bounds
						const cellSet = new Set(
							storedCells.filter((key) => {
								const [q, r] = key.split(',').map(Number);
								return q >= nx && q < nx + nw && r >= ny && r < ny + nh;
							})
						);

						// Snake-extend: extrude edge cells in each expanded direction
						const oldRight = ox + ow - 1, oldBottom = oy + oh - 1;
						const oldLeft = ox, oldTop = oy;

						// Right expansion
						if (nx + nw > ox + ow) {
							for (const key of storedCells) {
								const [q, r] = key.split(',').map(Number);
								if (q === oldRight && r >= ny && r < ny + nh) {
									for (let eq = oldRight + 1; eq < nx + nw; eq++) cellSet.add(`${eq},${r}`);
								}
							}
						}

						// Left expansion
						if (nx < ox) {
							for (const key of storedCells) {
								const [q, r] = key.split(',').map(Number);
								if (q === oldLeft && r >= ny && r < ny + nh) {
									for (let eq = nx; eq < oldLeft; eq++) cellSet.add(`${eq},${r}`);
								}
							}
						}

						// Down expansion (uses current cellSet so corner fills from right/left)
						if (ny + nh > oy + oh) {
							const snap = [...cellSet];
							for (const key of snap) {
								const [q, r] = key.split(',').map(Number);
								if (r === oldBottom && q >= nx && q < nx + nw) {
									for (let er = oldBottom + 1; er < ny + nh; er++) cellSet.add(`${q},${er}`);
								}
							}
						}

						// Up expansion (uses current cellSet so corner fills from right/left)
						if (ny < oy) {
							const snap = [...cellSet];
							for (const key of snap) {
								const [q, r] = key.split(',').map(Number);
								if (r === oldTop && q >= nx && q < nx + nw) {
									for (let er = ny; er < oldTop; er++) cellSet.add(`${q},${er}`);
								}
							}
						}

						newCells = [...cellSet];
						if (newCells.length === 0) newCells = undefined;
					}
				}

				onAreaUpdate({
					id: areaPreview.id,
					grid_x: areaPreview.grid_x,
					grid_y: areaPreview.grid_y,
					grid_w: areaPreview.grid_w,
					grid_h: areaPreview.grid_h,
					cells: newCells
				});
			}
			// Re-show popup at new position
			selectedAreaId = areaPreview.id;
			areaPopupPos = {
				x: areaPreview.grid_x * cellSize + (areaPreview.grid_w * cellSize) / 2,
				y: (areaPreview.grid_y + areaPreview.grid_h) * cellSize + 8
			};
		}

		areaDrag = null;
		areaResize = null;
		areaPreview = null;
	}

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
		selectedAreaId = null;
		areaPopupPos = null;
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

	// ─── Door/Window properties popup ─────────────────────────────────
	let dwPopup = $state<{
		kind: 'door' | 'window';
		edge: WallEdge;
		meta: WallMeta;
		anchorPx: { x: number; y: number };
	} | null>(null);

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

		// Edit area mode: paint cells
		if (editAreaMode) {
			e.preventDefault();
			const { px, py } = getGridOffset(e);
			const { q, r } = cellFromPixel(px, py);
			editAreaToggleCell(q, r);
			editAreaPaintingActive = true;
			window.addEventListener('mousemove', handleEditAreaMouseMove);
			window.addEventListener('mouseup', handleEditAreaMouseUp);
			return;
		}

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
		if (editAreaMode) editAreaHoverCell = { q, r };
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
					// No walls in selection → treat as area assignment (Prison Architect style)
					clearSelection();
					const minQ = Math.floor(rect.x / cellSize);
					const minR = Math.floor(rect.y / cellSize);
					const maxQ = Math.ceil((rect.x + rect.w) / cellSize);
					const maxR = Math.ceil((rect.y + rect.h) / cellSize);

					if (maxQ > minQ && maxR > minR) {
						const cells: { q: number; r: number }[] = [];
						for (let q = minQ; q < maxQ; q++) {
							for (let r = minR; r < maxR; r++) {
								cells.push({ q, r });
							}
						}
						assignTarget = {
							roomId: `area-${minQ},${minR}`,
							cells,
							bounds: { minQ, minR, maxQ, maxR },
							anchorPx: { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
						};
						const existingKey = `${minQ},${minR},${maxQ - minQ},${maxR - minR}`;
						const existing = assignmentMap.get(existingKey);
						if (existing) {
							assignType = existing.item_type as FloorLayoutItemType;
							assignUnitId = existing.rental_unit_id ?? '';
						} else {
							assignType = 'RENTAL_UNIT';
							assignUnitId = '';
						}
					}
				}
			} else {
				// Single click (no drag): check room first, then wall color
				clearSelection();
				const { px, py } = getGridOffset(e);
				const { q, r } = cellFromPixel(px, py);
				const room = cellRoomMap.get(`${q},${r}`);

				if (room) {
					// Clicked inside a detected room → open assignment popup
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
				} else {
					// Not in a room → check if clicking a wall with door/window or plain wall
					const nearEdge = findNearestWallEdge(px, py, cellSize * 0.6);
					if (nearEdge) {
						const key = edgeKey(nearEdge.q, nearEdge.r, nearEdge.dir);
						const meta = wallMetaMap.get(key) ?? {};
						if (meta.door) {
							// Wall has a door → open door properties popup
							dwPopup = { kind: 'door', edge: nearEdge, meta, anchorPx: { x: px, y: py } };
						} else if (meta.window) {
							// Wall has a window → open window properties popup
							dwPopup = { kind: 'window', edge: nearEdge, meta, anchorPx: { x: px, y: py } };
						} else {
							// Plain wall → open color picker
							selectedWallColor = meta.color ?? '#334155';
							selectedWallForColor = { edge: nearEdge, anchorPx: { x: px, y: py } };
						}
					} else {
						selectedWallForColor = null;
					}
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
				// Door/window tool click → open properties popup if already has one, otherwise toggle
				const { px, py } = getGridOffset(e);
				const nearEdge = findNearestWallEdge(px, py, cellSize * 0.6);
				if (nearEdge) {
					const key = edgeKey(nearEdge.q, nearEdge.r, nearEdge.dir);
					const existingMeta = wallMetaMap.get(key) ?? {};
					const hasMeta = (tool === 'door' && existingMeta.door) || (tool === 'window' && existingMeta.window);
					if (hasMeta) {
						// Already has door/window → open properties popup
						dwPopup = { kind: tool, edge: nearEdge, meta: existingMeta, anchorPx: { x: px, y: py } };
					} else {
						// No door/window yet → place one (toggle)
						onWallMetaToggle(nearEdge, tool);
					}
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
		if (editAreaMode) {
			if (e.key === 'Escape') cancelEditArea();
			if (e.key === 'Enter') commitEditArea();
			return;
		}
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
			dwPopup = null;
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

	<!-- Edit Area Mode banner -->
	{#if editAreaMode}
		<div class="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-background/95 backdrop-blur border rounded-lg shadow-lg px-4 py-2">
			<span class="text-sm font-semibold">Edit Area</span>
			<div class="flex rounded-md border overflow-hidden">
				<button
					class="px-2.5 py-1 text-xs font-medium transition-colors {editAreaTool === 'add' ? 'bg-green-600 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}"
					onclick={() => (editAreaTool = 'add')}
				>+ Add</button>
				<button
					class="px-2.5 py-1 text-xs font-medium transition-colors {editAreaTool === 'remove' ? 'bg-red-600 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}"
					onclick={() => (editAreaTool = 'remove')}
				>&minus; Remove</button>
			</div>
			<span class="text-xs text-muted-foreground">{editAreaCells.size} cells</span>
			<button class="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90" onclick={commitEditArea}>Done</button>
			<button class="px-3 py-1 rounded border text-xs hover:bg-secondary" onclick={cancelEditArea}>Cancel</button>
		</div>
	{/if}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={gridEl}
		class="relative"
		class:cursor-crosshair={!editAreaMode && (tool === 'draw' || tool === 'door' || tool === 'window') && (!hoveredRoomId || drawState)}
		class:cursor-pointer={!editAreaMode && tool === 'draw' && hoveredRoomId && !drawState}
		class:cursor-cell={editAreaMode || tool === 'erase'}
		class:cursor-default={!editAreaMode && tool === 'select'}
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

			<!-- Room fills (only unassigned — assigned areas use their own overlay) -->
			{#each detectedRooms as room (room.id)}
				{@const fill = roomFillColor(room)}
			{#if !roomOverlapsAssigned(room)}
				{#each room.cells as cell (`${cell.q},${cell.r}`)}
					<rect
						x={cell.q * cellSize + 1} y={cell.r * cellSize + 1}
						width={cellSize - 2} height={cellSize - 2}
						{fill} opacity="0.4"
					/>
				{/each}
			{/if}
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

			<!-- Edit Area Mode: cell overlays -->
			{#if editAreaMode}
				{#each Array.from(editAreaCells) as cellKey (cellKey)}
					{@const [cq, cr] = cellKey.split(',').map(Number)}
					<rect
						x={cq * cellSize + 1} y={cr * cellSize + 1}
						width={cellSize - 2} height={cellSize - 2}
						fill="#22c55e" opacity="0.35"
					/>
				{/each}
				<!-- Hover preview cell -->
				{#if editAreaHoverCell}
					{@const hq = editAreaHoverCell.q}
					{@const hr = editAreaHoverCell.r}
					<rect
						x={hq * cellSize} y={hr * cellSize}
						width={cellSize} height={cellSize}
						fill={editAreaTool === 'add' ? '#22c55e' : '#ef4444'}
						opacity="0.15"
					/>
				{/if}
			{/if}

			<!-- Area cell fills (custom shapes from edit area mode) -->
			{#each items.filter((i) => i.item_type !== 'WALL' && i.deleted_at === null) as areaItem (`acf-${areaItem.id}`)}
				{@const areaCells = parseAreaCells(areaItem)}
				{#if areaCells}
					{@const aFill = ROOM_FILL_COLORS[areaItem.item_type] ?? ROOM_FILL_COLORS._unassigned}
					{#each areaCells as cellKey (`acf-${areaItem.id}-${cellKey}`)}
						{@const [cq, cr] = cellKey.split(',').map(Number)}
						<rect
							x={cq * cellSize + 1} y={cr * cellSize + 1}
							width={cellSize - 2} height={cellSize - 2}
							fill={aFill} opacity="0.4"
						/>
					{/each}
				{/if}
			{/each}

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
					<!-- Door: type-aware rendering with swing direction -->
					{@const midX = (x1 + x2) / 2}
					{@const midY = (y1 + y2) / 2}
					{@const doorW = cellSize * 0.8}
					{@const swLeft = (meta.swing ?? 'left') === 'left'}
					{@const inward = (meta.openDir ?? 'inward') === 'inward'}
					{@const dType = meta.door}

					<!-- Wall flanks around gap -->
					{#if isHoriz}
						<polygon points={wallLineToRect(x1, y1, midX - doorW / 2, y1, ht)} fill={wallColor} />
						<polygon points={wallLineToRect(midX + doorW / 2, y1, x2, y1, ht)} fill={wallColor} />
					{:else}
						<polygon points={wallLineToRect(x1, y1, x1, midY - doorW / 2, ht)} fill={wallColor} />
						<polygon points={wallLineToRect(x1, midY + doorW / 2, x1, y2, ht)} fill={wallColor} />
					{/if}

					{#if dType === 'single' || dType === 'french'}
						{#if isHoriz}
							{@const hx = swLeft ? midX - doorW / 2 : midX + doorW / 2}
							{@const dy = inward ? doorW * 0.7 : -doorW * 0.7}
							<line x1={hx} y1={y1} x2={hx + (swLeft ? doorW * 0.5 : -doorW * 0.5)} y2={y1 + dy} stroke="#64748b" stroke-width="1.5" />
							<path d="M {hx} {y1} A {doorW * 0.7} {doorW * 0.7} 0 0 {(swLeft && inward) || (!swLeft && !inward) ? 1 : 0} {hx + (swLeft ? doorW * 0.5 : -doorW * 0.5)} {y1 + dy}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
						{:else}
							{@const hy = swLeft ? midY - doorW / 2 : midY + doorW / 2}
							{@const dx = inward ? doorW * 0.7 : -doorW * 0.7}
							<line x1={x1} y1={hy} x2={x1 + dx} y2={hy + (swLeft ? doorW * 0.5 : -doorW * 0.5)} stroke="#64748b" stroke-width="1.5" />
							<path d="M {x1} {hy} A {doorW * 0.7} {doorW * 0.7} 0 0 {(swLeft && inward) || (!swLeft && !inward) ? 0 : 1} {x1 + dx} {hy + (swLeft ? doorW * 0.5 : -doorW * 0.5)}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
						{/if}
					{:else if dType === 'double'}
						{#if isHoriz}
							{@const dy = inward ? doorW * 0.5 : -doorW * 0.5}
							<line x1={midX - doorW / 2} y1={y1} x2={midX} y2={y1 + dy} stroke="#64748b" stroke-width="1.5" />
							<line x1={midX + doorW / 2} y1={y1} x2={midX} y2={y1 + dy} stroke="#64748b" stroke-width="1.5" />
							<path d="M {midX - doorW / 2} {y1} A {doorW * 0.5} {doorW * 0.5} 0 0 {inward ? 1 : 0} {midX} {y1 + dy}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
							<path d="M {midX + doorW / 2} {y1} A {doorW * 0.5} {doorW * 0.5} 0 0 {inward ? 0 : 1} {midX} {y1 + dy}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
						{:else}
							{@const dx = inward ? doorW * 0.5 : -doorW * 0.5}
							<line x1={x1} y1={midY - doorW / 2} x2={x1 + dx} y2={midY} stroke="#64748b" stroke-width="1.5" />
							<line x1={x1} y1={midY + doorW / 2} x2={x1 + dx} y2={midY} stroke="#64748b" stroke-width="1.5" />
							<path d="M {x1} {midY - doorW / 2} A {doorW * 0.5} {doorW * 0.5} 0 0 {inward ? 0 : 1} {x1 + dx} {midY}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
							<path d="M {x1} {midY + doorW / 2} A {doorW * 0.5} {doorW * 0.5} 0 0 {inward ? 1 : 0} {x1 + dx} {midY}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" fill="none" />
						{/if}
					{:else if dType === 'sliding'}
						{#if isHoriz}
							<rect x={midX - doorW / 2} y={y1 - 3} width={doorW * 0.55} height={6} fill="#94a3b8" rx="1" />
							<rect x={midX - doorW * 0.05} y={y1 - 3} width={doorW * 0.55} height={6} fill="#64748b" rx="1" />
							<polygon points="{midX + doorW * 0.35},{y1 + 6} {midX + doorW * 0.35},{y1 + 12} {midX + doorW * 0.45},{y1 + 9}" fill="#334155" />
						{:else}
							<rect x={x1 - 3} y={midY - doorW / 2} width={6} height={doorW * 0.55} fill="#94a3b8" rx="1" />
							<rect x={x1 - 3} y={midY - doorW * 0.05} width={6} height={doorW * 0.55} fill="#64748b" rx="1" />
							<polygon points="{x1 + 6},{midY + doorW * 0.35} {x1 + 12},{midY + doorW * 0.35} {x1 + 9},{midY + doorW * 0.45}" fill="#334155" />
						{/if}
					{:else if dType === 'pocket'}
						{#if isHoriz}
							<rect x={midX - doorW * 0.1} y={y1 - 3} width={doorW * 0.4} height={6} fill="#94a3b8" rx="1" />
							<rect x={midX - doorW / 2} y={y1 - 2} width={doorW * 0.35} height={4} fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 2" rx="1" />
						{:else}
							<rect x={x1 - 3} y={midY - doorW * 0.1} width={6} height={doorW * 0.4} fill="#94a3b8" rx="1" />
							<rect x={x1 - 2} y={midY - doorW / 2} width={4} height={doorW * 0.35} fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 2" rx="1" />
						{/if}
					{:else if dType === 'bifold'}
						{#if isHoriz}
							{@const dy = inward ? doorW * 0.4 : -doorW * 0.4}
							<line x1={midX - doorW / 2} y1={y1} x2={midX} y2={y1 + dy} stroke="#64748b" stroke-width="1.5" />
							<line x1={midX} y1={y1 + dy} x2={midX + doorW / 2} y2={y1} stroke="#64748b" stroke-width="1.5" />
							<circle cx={midX} cy={y1 + dy} r="2" fill="#94a3b8" />
						{:else}
							{@const dx = inward ? doorW * 0.4 : -doorW * 0.4}
							<line x1={x1} y1={midY - doorW / 2} x2={x1 + dx} y2={midY} stroke="#64748b" stroke-width="1.5" />
							<line x1={x1 + dx} y1={midY} x2={x1} y2={midY + doorW / 2} stroke="#64748b" stroke-width="1.5" />
							<circle cx={x1 + dx} cy={midY} r="2" fill="#94a3b8" />
						{/if}
					{/if}

				{:else if meta.window}
					<!-- Window: type-aware rendering -->
					{@const wMid = isHoriz ? (x1 + x2) / 2 : (y1 + y2) / 2}
					{@const paneSize = cellSize * 0.6}
					{@const wType = meta.window}
					<polygon points={wallLineToRect(x1, y1, x2, y2, ht)} fill={wallColor} />

					{#if wType === 'fixed'}
						{#if isHoriz}
							<rect x={wMid - paneSize / 2} y={y1 - 6} width={paneSize} height={12} fill="#bae6fd" opacity="0.5" rx="1" />
							<line x1={wMid} y1={y1 - 6} x2={wMid} y2={y1 + 6} stroke="#334155" stroke-width="0.7" />
							<line x1={wMid - paneSize / 2} y1={y1} x2={wMid + paneSize / 2} y2={y1} stroke="#334155" stroke-width="0.7" />
						{:else}
							<rect x={x1 - 6} y={wMid - paneSize / 2} width={12} height={paneSize} fill="#bae6fd" opacity="0.5" rx="1" />
							<line x1={x1 - 6} y1={wMid} x2={x1 + 6} y2={wMid} stroke="#334155" stroke-width="0.7" />
							<line x1={x1} y1={wMid - paneSize / 2} x2={x1} y2={wMid + paneSize / 2} stroke="#334155" stroke-width="0.7" />
						{/if}
					{:else if wType === 'sliding'}
						{#if isHoriz}
							<rect x={wMid - paneSize / 2} y={y1 - 5} width={paneSize * 0.55} height={10} fill="#bae6fd" stroke="#334155" stroke-width="0.8" rx="1" />
							<rect x={wMid - paneSize * 0.05} y={y1 - 5} width={paneSize * 0.55} height={10} fill="#93c5fd" stroke="#334155" stroke-width="0.8" rx="1" />
						{:else}
							<rect x={x1 - 5} y={wMid - paneSize / 2} width={10} height={paneSize * 0.55} fill="#bae6fd" stroke="#334155" stroke-width="0.8" rx="1" />
							<rect x={x1 - 5} y={wMid - paneSize * 0.05} width={10} height={paneSize * 0.55} fill="#93c5fd" stroke="#334155" stroke-width="0.8" rx="1" />
						{/if}
					{:else if wType === 'casement'}
						{#if isHoriz}
							<rect x={wMid - paneSize / 2} y={y1 - 6} width={paneSize} height={12} fill="#bae6fd" opacity="0.5" rx="1" />
							<path d="M {wMid - paneSize / 2} {y1 + 6} L {wMid - paneSize * 0.1} {y1 - 4} L {wMid - paneSize / 2} {y1 - 6}" stroke="#64748b" stroke-width="0.8" fill="none" stroke-dasharray="2 2" />
						{:else}
							<rect x={x1 - 6} y={wMid - paneSize / 2} width={12} height={paneSize} fill="#bae6fd" opacity="0.5" rx="1" />
							<path d="M {x1 + 6} {wMid - paneSize / 2} L {x1 - 4} {wMid - paneSize * 0.1} L {x1 + 6} {wMid - paneSize / 2}" stroke="#64748b" stroke-width="0.8" fill="none" stroke-dasharray="2 2" />
						{/if}
					{:else if wType === 'awning'}
						{#if isHoriz}
							<rect x={wMid - paneSize / 2} y={y1 - 6} width={paneSize} height={12} fill="#bae6fd" opacity="0.5" rx="1" />
							<line x1={wMid - paneSize / 2} y1={y1 - 6} x2={wMid} y2={y1 + 4} stroke="#64748b" stroke-width="0.8" stroke-dasharray="2 2" />
							<line x1={wMid + paneSize / 2} y1={y1 - 6} x2={wMid} y2={y1 + 4} stroke="#64748b" stroke-width="0.8" stroke-dasharray="2 2" />
						{:else}
							<rect x={x1 - 6} y={wMid - paneSize / 2} width={12} height={paneSize} fill="#bae6fd" opacity="0.5" rx="1" />
							<line x1={x1 - 6} y1={wMid - paneSize / 2} x2={x1 + 4} y2={wMid} stroke="#64748b" stroke-width="0.8" stroke-dasharray="2 2" />
							<line x1={x1 - 6} y1={wMid + paneSize / 2} x2={x1 + 4} y2={wMid} stroke="#64748b" stroke-width="0.8" stroke-dasharray="2 2" />
						{/if}
					{:else if wType === 'bay'}
						{#if isHoriz}
							<polygon points="{wMid - paneSize / 2},{y1} {wMid - paneSize * 0.3},{y1 + 10} {wMid + paneSize * 0.3},{y1 + 10} {wMid + paneSize / 2},{y1}" fill="#bae6fd" fill-opacity="0.4" stroke="#334155" stroke-width="1" />
						{:else}
							<polygon points="{x1},{wMid - paneSize / 2} {x1 + 10},{wMid - paneSize * 0.3} {x1 + 10},{wMid + paneSize * 0.3} {x1},{wMid + paneSize / 2}" fill="#bae6fd" fill-opacity="0.4" stroke="#334155" stroke-width="1" />
						{/if}
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

			<!-- SVG text labels for rooms (visible in PNG export, unassigned only) -->
			{#each detectedRooms as room (`label-${room.id}`)}
				{@const info = roomLabel(room)}
				{#if !roomOverlapsAssigned(room)}
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
				{/if}
			{/each}
		</svg>

		<!-- Assigned area overlays -->
		{#each items.filter((i) => i.item_type !== 'WALL' && i.deleted_at === null) as areaItem (areaItem.id)}
			{@const preview = areaPreview?.id === areaItem.id ? areaPreview : null}
			{@const ax = (preview?.grid_x ?? areaItem.grid_x) * cellSize}
			{@const ay = (preview?.grid_y ?? areaItem.grid_y) * cellSize}
			{@const aw = (preview?.grid_w ?? areaItem.grid_w) * cellSize}
			{@const ah = (preview?.grid_h ?? areaItem.grid_h) * cellSize}
			{@const aFill = ROOM_FILL_COLORS[areaItem.item_type] ?? ROOM_FILL_COLORS._unassigned}
			{@const hasCells = parseAreaCells(areaItem) !== null}
			{@const isSelected = selectedAreaId === areaItem.id}
			{@const aLabel = areaItem.item_type === 'RENTAL_UNIT' && areaItem.rental_unit_id
				? (rentalUnitsMap.get(areaItem.rental_unit_id)?.name ?? 'Rental Unit')
				: (areaItem.label ?? ITEM_TYPE_LABELS[areaItem.item_type] ?? areaItem.item_type)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute rounded-sm transition-all {isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : 'cursor-pointer'}"
				style="left: {ax}px; top: {ay}px; width: {aw}px; height: {ah}px;
					background: {hasCells ? 'transparent' : aFill}; opacity: {hasCells ? 1 : (isSelected ? 0.5 : 0.3)};
					border: {hasCells && !isSelected ? 'none' : `2px ${isSelected ? 'solid' : 'dashed'} ${aFill}`};"
				onclick={(e) => {
					e.stopPropagation();
					if (selectedAreaId === areaItem.id) {
						clearSelection();
					} else {
						clearSelection();
						selectedAreaId = areaItem.id;
						areaPopupPos = { x: ax + aw / 2, y: ay + ah + 8 };
					}
				}}
				onmousedown={(e) => {
					e.stopPropagation();
					if (isSelected) {
						handleAreaDragStart(areaItem.id, e);
					}
				}}
			>
				{#if aw > 36 && ah > 24}
					{@const areaCellKeys = parseAreaCells(areaItem)}
					{#if areaCellKeys}
						{@const lp = labelCellPos(areaCellKeys, preview?.grid_x ?? areaItem.grid_x, preview?.grid_y ?? areaItem.grid_y, preview?.grid_w ?? areaItem.grid_w, preview?.grid_h ?? areaItem.grid_h)}
						<div
							class="absolute pointer-events-none flex items-center justify-center"
							style="left: {lp.x - ax}px; top: {lp.y - ay}px; transform: translate(-50%, -50%);"
						>
							<span class="px-2 py-0.5 rounded-md text-xs font-semibold leading-tight truncate shadow-sm bg-white/90 text-slate-800 border border-slate-200 whitespace-nowrap">
								{aLabel}
							</span>
						</div>
					{:else}
						<div class="w-full h-full flex items-center justify-center p-1 pointer-events-none">
							<span class="px-2 py-0.5 rounded-md text-xs font-semibold leading-tight truncate max-w-full shadow-sm bg-white/90 text-slate-800 border border-slate-200">
								{aLabel}
							</span>
						</div>
					{/if}
				{/if}

				<!-- Resize handles (all 4 corners) -->
				{#if isSelected}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl cursor-se-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'br', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-br cursor-nw-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'tl', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-bl cursor-ne-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'tr', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 rounded-tr cursor-sw-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'bl', e)}></div>
					<!-- Edge handles -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-6 bg-blue-500 rounded-l cursor-e-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'r', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-6 bg-blue-500 rounded-r cursor-w-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'l', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-6 bg-blue-500 rounded-t cursor-s-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 'b', e)}></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-6 bg-blue-500 rounded-b cursor-n-resize hover:bg-blue-600 transition-colors"
						onmousedown={(e) => handleAreaResizeStart(areaItem.id, 't', e)}></div>
				{/if}
			</div>
		{/each}

		<!-- Area action popup -->
		{#if selectedAreaId && areaPopupPos}
			{@const selArea = items.find((i) => i.id === selectedAreaId)}
			{#if selArea}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute z-30 bg-background border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2"
					style="left: {Math.max(8, areaPopupPos.x - 120)}px; top: {areaPopupPos.y}px;"
					onmousedown={(e) => e.stopPropagation()}
				>
					<span class="text-xs text-muted-foreground font-medium truncate max-w-[100px]">
						{selArea.label ?? ITEM_TYPE_LABELS[selArea.item_type] ?? selArea.item_type}
					</span>
					<button
						class="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
						onclick={() => {
							// Enter edit area mode — seed from stored cells or fall back to bounds
							editAreaMode = true;
							editAreaId = selectedAreaId;
							editAreaTool = 'add';
							const a = selArea;
							const storedCells = parseAreaCells(a);
							if (storedCells) {
								editAreaCells = new Set(storedCells);
							} else {
								const cells = new Set<string>();
								for (let q = a.grid_x; q < a.grid_x + a.grid_w; q++) {
									for (let r = a.grid_y; r < a.grid_y + a.grid_h; r++) {
										cells.add(`${q},${r}`);
									}
								}
								editAreaCells = cells;
							}
							selectedAreaId = null;
							areaPopupPos = null;
						}}
					>
						Edit
					</button>
					<button
						class="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
						onclick={() => { onRoomClear(selectedAreaId!); clearSelection(); }}
					>
						Delete
					</button>
					<button
						class="px-2 py-1 rounded border text-xs hover:bg-secondary transition-colors text-muted-foreground"
						onclick={clearSelection}
					>
						&times;
					</button>
				</div>
			{/if}
		{/if}

		<!-- Room labels (unassigned detected rooms only — assigned areas use their own overlay) -->
		{#each detectedRooms as room (room.id)}
			{@const info = roomLabel(room)}
			{@const a = getAssignment(room)}
			{#if !roomOverlapsAssigned(room)}
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

				</div>
			{/if}
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

		<!-- Door/Window properties popup -->
		{#if dwPopup}
			<DoorWindowPopup
				kind={dwPopup.kind}
				meta={dwPopup.meta}
				anchorPx={dwPopup.anchorPx}
				gridWidth={gridCols * cellSize}
				gridHeight={gridRows * cellSize}
				onUpdate={(newMeta) => {
					if (onWallMetaUpdate) onWallMetaUpdate(dwPopup!.edge, newMeta);
				}}
				onDelete={() => {
					// Remove the door/window by toggling it off
					onWallMetaToggle(dwPopup!.edge, dwPopup!.kind);
					dwPopup = null;
				}}
				onClose={() => (dwPopup = null)}
			/>
		{/if}
	</div>
</div>
