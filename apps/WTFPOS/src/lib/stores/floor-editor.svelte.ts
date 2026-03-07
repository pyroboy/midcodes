/**
 * Floor Editor — editor-only ephemeral state.
 * Changes here are NOT persisted until the user clicks Save.
 */
import type { Table, FloorElement, FloorCanvasConfig, ChairConfig } from '$lib/types';

export interface PendingTableUpdate {
	label?: string;
	capacity?: number;
	width?: number;
	height?: number;
	color?: string | null;
	opacity?: number | null;
	borderRadius?: number | null;
	borderWidth?: number | null;
	rotation?: number | null;
	chairConfig?: ChairConfig | null;
	x?: number;
	y?: number;
}

function createFloorEditorStore() {
	// Selection
	let selectedId = $state<string | null>(null);
	let selectedType = $state<'table' | 'element' | null>(null);

	// Pending changes (not yet written to RxDB)
	let pendingTableUpdates = $state<Map<string, PendingTableUpdate>>(new Map());
	let pendingElements = $state<Map<string, FloorElement>>(new Map());
	let deletedElementIds = $state<Set<string>>(new Set());
	let deletedTableIds = $state<Set<string>>(new Set());

	// Canvas config (pending)
	let canvasConfig = $state<FloorCanvasConfig>({
		id: 'tag',
		locationId: 'tag',
		width: 900,
		height: 600,
		gridSize: 20,
		updatedAt: new Date().toISOString()
	});

	// Viewport
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);

	// Toggles
	let snapEnabled = $state(true);
	let gridVisible = $state(true);

	// Chair editor modal
	let chairModalOpen = $state(false);
	let chairModalTableId = $state<string | null>(null);

	const isDirty = $derived(
		pendingTableUpdates.size > 0 ||
		pendingElements.size > 0 ||
		deletedElementIds.size > 0 ||
		deletedTableIds.size > 0
	);

	return {
		get selectedId() { return selectedId; },
		get selectedType() { return selectedType; },
		get pendingTableUpdates() { return pendingTableUpdates; },
		get pendingElements() { return pendingElements; },
		get deletedElementIds() { return deletedElementIds; },
		get deletedTableIds() { return deletedTableIds; },
		get canvasConfig() { return canvasConfig; },
		get zoom() { return zoom; },
		get panX() { return panX; },
		get panY() { return panY; },
		get snapEnabled() { return snapEnabled; },
		get gridVisible() { return gridVisible; },
		get isDirty() { return isDirty; },
		get chairModalOpen() { return chairModalOpen; },
		get chairModalTableId() { return chairModalTableId; },

		select(id: string, type: 'table' | 'element') {
			selectedId = id;
			selectedType = type;
		},

		deselect() {
			selectedId = null;
			selectedType = null;
		},

		patchTable(tableId: string, patch: PendingTableUpdate) {
			const existing = pendingTableUpdates.get(tableId) ?? {};
			pendingTableUpdates.set(tableId, { ...existing, ...patch });
			pendingTableUpdates = new Map(pendingTableUpdates);
		},

		getMergedTable(table: Table): Table {
			const patch = pendingTableUpdates.get(table.id);
			if (!patch) return table;
			// Strip null values — Table uses undefined not null for optional fields
			const clean: Partial<Table> = {};
			for (const [k, v] of Object.entries(patch)) {
				if (v !== null) (clean as any)[k] = v;
			}
			return { ...table, ...clean };
		},

		markTableDeleted(tableId: string) {
			deletedTableIds.add(tableId);
			deletedTableIds = new Set(deletedTableIds);
			pendingTableUpdates.delete(tableId);
			pendingTableUpdates = new Map(pendingTableUpdates);
			if (selectedId === tableId) { selectedId = null; selectedType = null; }
		},

		upsertElement(el: FloorElement) {
			pendingElements.set(el.id, el);
			pendingElements = new Map(pendingElements);
		},

		deleteElement(id: string) {
			deletedElementIds.add(id);
			deletedElementIds = new Set(deletedElementIds);
			pendingElements.delete(id);
			pendingElements = new Map(pendingElements);
			if (selectedId === id) { selectedId = null; selectedType = null; }
		},

		patchElement(id: string, patch: Partial<FloorElement>) {
			const existing = pendingElements.get(id);
			if (existing) {
				pendingElements.set(id, { ...existing, ...patch });
				pendingElements = new Map(pendingElements);
			}
		},

		setCanvasConfig(cfg: Partial<FloorCanvasConfig>) {
			canvasConfig = { ...canvasConfig, ...cfg };
		},

		setZoom(z: number) { zoom = Math.max(0.25, Math.min(3, z)); },
		setPan(x: number, y: number) { panX = x; panY = y; },
		toggleSnap() { snapEnabled = !snapEnabled; },
		toggleGrid() { gridVisible = !gridVisible; },

		openChairModal(tableId: string) {
			chairModalTableId = tableId;
			chairModalOpen = true;
		},
		closeChairModal() {
			chairModalOpen = false;
			chairModalTableId = null;
		},

		discard() {
			pendingTableUpdates = new Map();
			pendingElements = new Map();
			deletedElementIds = new Set();
			deletedTableIds = new Set();
			selectedId = null;
			selectedType = null;
		}
	};
}

export const floorEditor = createFloorEditorStore();
