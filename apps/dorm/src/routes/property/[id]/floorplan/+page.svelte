<script lang="ts">
	import { floorLayoutItemsStore } from '$lib/stores/collections.svelte';
	import { floorsStore, rentalUnitsStore, tenantsStore, leasesStore, leaseTenantsStore } from '$lib/stores/collections.svelte';
	import {
		optimisticUpsertFloorLayoutItem,
		optimisticDeleteFloorLayoutItem
	} from '$lib/db/optimistic-floor-layout';
	import { bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { resyncCollection } from '$lib/db/replication';
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import FloorGrid from './FloorGrid.svelte';
	import ItemSidebar from './ItemSidebar.svelte';
	import FloorViewer3D from './FloorViewer3D.svelte';
	import { Save, Undo2, Redo2, Loader2, RefreshCw, Pencil } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { FloorLayoutItemType, DrawTool } from './types';
	import { parseEdgeKey, itemsToWallSet, detectRooms, parseWallMeta, serializeWallMeta, type WallEdge, type WallStorageItem, type WallMeta } from './wallEngine';

	import { page } from '$app/stores';

	/** Extract plain layout fields from an RxDB doc proxy, stripping _rev, _meta etc. (H3 fix) */
	function cleanItem(doc: any): { id: number; floor_id: number; rental_unit_id: number | null; item_type: string; grid_x: number; grid_y: number; grid_w: number; grid_h: number; label: string | null; color: string | null } {
		return {
			id: parseInt(doc.id, 10),
			floor_id: parseInt(doc.floor_id, 10),
			rental_unit_id: doc.rental_unit_id ? parseInt(doc.rental_unit_id, 10) : null,
			item_type: doc.item_type,
			grid_x: doc.grid_x,
			grid_y: doc.grid_y,
			grid_w: doc.grid_w,
			grid_h: doc.grid_h,
			label: doc.label ?? null,
			color: doc.color ?? null
		};
	}

	let { data } = $props();
	let propertyId = $derived(data.propertyId);

	// Default to 3D if ?view=3d is in the URL (from top bar quick access)
	let viewMode = $state<'2d' | '3d'>($page.url.searchParams.get('view') === '3d' ? '3d' : '2d');
	let selectedFloorId = $state<string | null>(null);
	let drawTool = $state<DrawTool>('select');

	// Floors for this property
	let propertyFloors = $derived(
		floorsStore.value
			.filter((f: any) => f.property_id === String(propertyId))
			.sort((a: any, b: any) => a.floor_number - b.floor_number)
	);

	$effect(() => {
		if (propertyFloors.length > 0 && !selectedFloorId) {
			selectedFloorId = propertyFloors[0].id;
		}
	});

	let currentFloorItems = $derived(
		floorLayoutItemsStore.value.filter((i: any) => i.floor_id === selectedFloorId)
	);

	let propertyUnits = $derived(
		rentalUnitsStore.value.filter((u: any) => u.property_id === String(propertyId))
	);

	let rentalUnitsMap = $derived.by(() => {
		const map = new Map<string, any>();
		for (const u of propertyUnits) map.set(u.id, u);
		return map;
	});

	let placedUnitIds = $derived(
		new Set(
			currentFloorItems
				.filter((i: any) => i.item_type === 'RENTAL_UNIT' && i.rental_unit_id)
				.map((i: any) => i.rental_unit_id)
		)
	);

	let unplacedUnits = $derived(
		propertyUnits.filter(
			(u: any) => u.floor_id === selectedFloorId && !placedUnitIds.has(u.id)
		)
	);

	let placedCount = $derived(placedUnitIds.size);
	let totalCount = $derived(
		propertyUnits.filter((u: any) => u.floor_id === selectedFloorId).length
	);

	// Build rental_unit_id → tenant names map (for 3D popup)
	let unitTenantsMap = $derived.by(() => {
		const map = new Map<string, { name: string; status: string }[]>();
		// Build lease_id → rental_unit_id
		const leaseUnitMap = new Map<string, string>();
		for (const lease of leasesStore.value) {
			if (lease.rental_unit_id) leaseUnitMap.set(String(lease.id), String(lease.rental_unit_id));
		}
		// Build tenant_id → tenant
		const tenantMap = new Map<string, any>();
		for (const t of tenantsStore.value) tenantMap.set(String(t.id), t);
		// Link via lease_tenants
		for (const lt of leaseTenantsStore.value) {
			const unitId = leaseUnitMap.get(String(lt.lease_id));
			if (!unitId) continue;
			const tenant = tenantMap.get(String(lt.tenant_id));
			if (!tenant) continue;
			if (!map.has(unitId)) map.set(unitId, []);
			map.get(unitId)!.push({ name: tenant.name, status: tenant.status ?? 'active' });
		}
		return map;
	});

	// Use timestamp-based temp IDs to avoid collisions across page navigations
	let tempIdCounter = $state(-Date.now());

	// ─── Deferred Save Pattern ────────────────────────────────────────
	// All edits write to RxDB locally (instant UI) but defer server sync
	// until the user clicks Save. This prevents wall loss from premature resyncs.

	type PendingChange =
		| { type: 'wall_add'; walls: { floor_id: number; grid_x: number; grid_y: number; grid_w: number; grid_h: number }[] }
		| { type: 'wall_remove'; ids: number[] }
		| { type: 'upsert'; item: any }
		| { type: 'delete'; id: string };

	let pendingChanges = $state<PendingChange[]>([]);
	let isSaving = $state(false);
	let isDirty = $derived(pendingChanges.length > 0);

	let brokenRooms = $state<{ id: string; label: string }[]>([]);
	let showBrokenConfirm = $state(false);

	// ─── Undo / Redo ─────────────────────────────────────────────────

	interface EditorSnapshot {
		wallKeys: string[];
		assignments: {
			id: string;
			item_type: string;
			grid_x: number;
			grid_y: number;
			grid_w: number;
			grid_h: number;
			rental_unit_id: string | null;
			label: string | null;
			color: string | null;
		}[];
	}

	const UNDO_LIMIT = 50;
	let undoStack = $state<EditorSnapshot[]>([]);
	let redoStack = $state<EditorSnapshot[]>([]);
	let isApplyingSnapshot = $state(false);

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
					grid_x: i.grid_x,
					grid_y: i.grid_y,
					grid_w: i.grid_w,
					grid_h: i.grid_h,
					rental_unit_id: i.rental_unit_id ?? null,
					label: i.label ?? null,
					color: i.color ?? null
				}))
		};
	}

	function pushUndo(snapshot: EditorSnapshot) {
		if (isApplyingSnapshot) return;
		undoStack = [...undoStack.slice(-UNDO_LIMIT + 1), snapshot];
		redoStack = [];
	}

	async function applySnapshot(snapshot: EditorSnapshot) {
		isApplyingSnapshot = true;
		try {
			// 1. Compute wall diff
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

			// 2. Apply wall changes
			if (toRemove.length > 0) await handleWallRemove(toRemove);
			if (toAdd.length > 0) await handleWallAdd(toAdd);

			// 3. Apply assignment diff
			const snapshotAssignKeys = new Set(
				snapshot.assignments.map(
					(a) => `${a.grid_x},${a.grid_y},${a.grid_w},${a.grid_h}`
				)
			);
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
						minQ: a.grid_x,
						minR: a.grid_y,
						maxQ: a.grid_x + a.grid_w,
						maxR: a.grid_y + a.grid_h
					},
					item_type: a.item_type as FloorLayoutItemType,
					rental_unit_id: a.rental_unit_id ? parseInt(a.rental_unit_id, 10) : null,
					label: a.label
				});
			}
		} finally {
			isApplyingSnapshot = false;
		}
	}

	async function undo() {
		if (undoStack.length === 0 || isSaving) return;
		const current = captureSnapshot();
		redoStack = [...redoStack, current];
		const prev = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		await applySnapshot(prev);
	}

	async function redo() {
		if (redoStack.length === 0 || isSaving) return;
		const current = captureSnapshot();
		undoStack = [...undoStack.slice(-UNDO_LIMIT + 1), current];
		const next = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		await applySnapshot(next);
	}

	function handleUndoKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
			e.preventDefault();
			undo();
		}
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
			e.preventDefault();
			redo();
		}
		if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
			e.preventDefault();
			redo();
		}
	}

	// Keep sync indicator in sync with unsaved floor plan edits
	$effect(() => {
		syncStatus.setUnsavedEdits(pendingChanges.length);
		return () => syncStatus.setUnsavedEdits(0); // Clear on unmount
	});

	// ─── Local-only operations (no server calls) ──────────────────────

	async function handleWallAdd(edges: WallEdge[]) {
		if (edges.length === 0) return;
		pushUndo(captureSnapshot());
		const floorId = parseInt(selectedFloorId!, 10);

		const walls = edges.map((edge) => ({
			floor_id: floorId,
			grid_x: edge.q,
			grid_y: edge.r,
			grid_w: edge.dir === 'N' ? 0 : 1,
			grid_h: edge.dir === 'W' ? 0 : 1
		}));

		// Write to RxDB locally for instant display
		for (const w of walls) {
			const tempId = tempIdCounter--;
			await optimisticUpsertFloorLayoutItem({
				...w,
				id: tempId,
				item_type: 'WALL',
				label: null,
				color: null
			});
		}

		// Queue for save
		pendingChanges = [...pendingChanges, { type: 'wall_add', walls }];
	}

	async function handleWallRemove(edges: WallEdge[]) {
		if (edges.length === 0) return;
		pushUndo(captureSnapshot());
		const wallItemsList = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
		const matchedIds: string[] = [];

		for (const edge of edges) {
			const matches = wallItemsList.filter((i: any) => {
				if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
				if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
				return false;
			});
			for (const m of matches) matchedIds.push(m.id);
		}

		if (matchedIds.length === 0) return;

		// Soft-delete locally
		for (const id of matchedIds) {
			await optimisticDeleteFloorLayoutItem(parseInt(id, 10));
		}

		// Track all deletions as unsaved changes
		// Only real IDs (positive) need server calls; temp IDs are local-only
		const realIds = matchedIds.filter((id) => parseInt(id, 10) > 0).map((id) => parseInt(id, 10));
		pendingChanges = [...pendingChanges, { type: 'wall_remove', ids: realIds }];

		checkBrokenRooms();
	}

	function checkBrokenRooms() {
		const assignments = currentFloorItems.filter((i: any) => i.item_type !== 'WALL');
		if (assignments.length === 0) return;

		const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
		const wallSet = itemsToWallSet(wallItems as unknown as WallStorageItem[]);
		const rooms = detectRooms(wallSet, 60, 60);

		const existingBounds = new Set(
			rooms.map(
				(r) =>
					`${r.bounds.minQ},${r.bounds.minR},${r.bounds.maxQ - r.bounds.minQ},${r.bounds.maxR - r.bounds.minR}`
			)
		);

		const broken: { id: string; label: string }[] = [];
		for (const a of assignments) {
			const key = `${a.grid_x},${a.grid_y},${a.grid_w},${a.grid_h}`;
			if (!existingBounds.has(key)) {
				broken.push({ id: a.id, label: a.label || a.item_type });
			}
		}

		if (broken.length > 0) {
			brokenRooms = broken;
			showBrokenConfirm = true;
		}
	}

	async function confirmUnassignBrokenSingle(id: string) {
		await optimisticDeleteFloorLayoutItem(parseInt(id, 10));
		pendingChanges = [...pendingChanges, { type: 'delete', id }];
		brokenRooms = brokenRooms.filter((b) => b.id !== id);
		if (brokenRooms.length === 0) showBrokenConfirm = false;
		toast.info('Unassigned broken room');
	}

	function dismissBrokenConfirm() {
		showBrokenConfirm = false;
		brokenRooms = [];
	}

	async function handleRoomAssign(assignment: {
		roomId: string;
		cells: { q: number; r: number }[];
		bounds: { minQ: number; minR: number; maxQ: number; maxR: number };
		item_type: FloorLayoutItemType;
		rental_unit_id: number | null;
		label: string | null;
	}) {
		pushUndo(captureSnapshot());
		const existing = currentFloorItems.find(
			(i: any) =>
				i.item_type !== 'WALL' &&
				i.grid_x === assignment.bounds.minQ &&
				i.grid_y === assignment.bounds.minR &&
				i.grid_w === assignment.bounds.maxQ - assignment.bounds.minQ &&
				i.grid_h === assignment.bounds.maxR - assignment.bounds.minR
		);

		const item = {
			id: existing ? parseInt(existing.id, 10) : tempIdCounter--,
			floor_id: parseInt(selectedFloorId!, 10),
			rental_unit_id: assignment.rental_unit_id,
			item_type: assignment.item_type,
			grid_x: assignment.bounds.minQ,
			grid_y: assignment.bounds.minR,
			grid_w: assignment.bounds.maxQ - assignment.bounds.minQ,
			grid_h: assignment.bounds.maxR - assignment.bounds.minR,
			label: assignment.label,
			color: null
		};

		await optimisticUpsertFloorLayoutItem(item);
		pendingChanges = [...pendingChanges, { type: 'upsert', item }];
	}

	async function handleAreaUpdate(update: { id: string; grid_x: number; grid_y: number; grid_w: number; grid_h: number; cells?: string[] }) {
		pushUndo(captureSnapshot());
		const item = currentFloorItems.find((i: any) => i.id === update.id);
		if (!item) return;

		const updated = {
			id: parseInt(update.id, 10),
			floor_id: parseInt(selectedFloorId!, 10),
			rental_unit_id: item.rental_unit_id ? parseInt(item.rental_unit_id, 10) : null,
			item_type: item.item_type,
			grid_x: update.grid_x,
			grid_y: update.grid_y,
			grid_w: update.grid_w,
			grid_h: update.grid_h,
			label: item.label ?? null,
			color: update.cells ? update.cells.join(';') : (item.color ?? null)
		};

		await optimisticUpsertFloorLayoutItem(updated);
		pendingChanges = [...pendingChanges, { type: 'upsert', item: updated }];
	}

	async function handleRoomClear(roomId: string) {
		pushUndo(captureSnapshot());
		// Delete only the specific area item, not all non-wall items
		const item = currentFloorItems.find((i: any) => i.id === roomId && i.item_type !== 'WALL');
		if (item) {
			await optimisticDeleteFloorLayoutItem(parseInt(item.id, 10));
			pendingChanges = [...pendingChanges, { type: 'delete', id: item.id }];
		}
	}

	// ─── Feature 2/3: Door & Window Meta Toggle ─────────────────────

	async function handleWallMetaToggle(edge: WallEdge, kind: 'door' | 'window') {
		const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
		const match = wallItems.find((i: any) => {
			if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
			if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
			return false;
		});
		if (!match) return; // Only toggle on existing walls

		pushUndo(captureSnapshot());

		const currentMeta = parseWallMeta(match.label);
		let newMeta: WallMeta;

		if (kind === 'door') {
			if (currentMeta.door) {
				// Toggle off: remove door + swing keys
				const { door: _d, swing: _s, ...rest } = currentMeta;
				newMeta = rest;
			} else {
				// Toggle on: add door, also remove window if present
				const { window: _w, sill: _si, ...rest } = currentMeta;
				newMeta = { ...rest, door: 'single', swing: 'left' };
			}
		} else {
			if (currentMeta.window) {
				// Toggle off: remove window + sill keys
				const { window: _w, sill: _si, ...rest } = currentMeta;
				newMeta = rest;
			} else {
				// Toggle on: add window, also remove door if present
				const { door: _d, swing: _s, ...rest } = currentMeta;
				newMeta = { ...rest, window: 'fixed', sill: 0.9 };
			}
		}

		const newLabel = serializeWallMeta(newMeta);
		const updated = { ...cleanItem(match), label: newLabel };

		await optimisticUpsertFloorLayoutItem(updated);
		pendingChanges = [...pendingChanges, { type: 'upsert', item: updated }];
	}

	async function handleWallMetaUpdate(edge: WallEdge, newMeta: WallMeta) {
		const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
		const match = wallItems.find((i: any) => {
			if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
			if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
			return false;
		});
		if (!match) return;

		pushUndo(captureSnapshot());

		const updatedLabel = serializeWallMeta(newMeta);
		const updatedItem = { ...cleanItem(match), label: updatedLabel };

		await optimisticUpsertFloorLayoutItem(updatedItem);
		pendingChanges = [...pendingChanges, { type: 'upsert', item: updatedItem }];
	}

	// ─── Feature 7: Wall Color Change ────────────────────────────────

	async function handleWallColorChange(edge: WallEdge, color: string | null) {
		const wallItems = currentFloorItems.filter((i: any) => i.item_type === 'WALL');
		const match = wallItems.find((i: any) => {
			if (edge.dir === 'N') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_w === 0;
			if (edge.dir === 'W') return i.grid_x === edge.q && i.grid_y === edge.r && i.grid_h === 0;
			return false;
		});
		if (!match) return;

		const currentMeta = parseWallMeta(match.label);
		let newMeta: WallMeta;

		if (color) {
			newMeta = { ...currentMeta, color };
		} else {
			// Remove color key via destructuring
			const { color: _removed, ...rest } = currentMeta;
			newMeta = rest;
		}

		const newLabel = serializeWallMeta(newMeta);
		const updated = { ...cleanItem(match), label: newLabel };

		await optimisticUpsertFloorLayoutItem(updated);
		pendingChanges = [...pendingChanges, { type: 'upsert', item: updated }];
	}

	// ─── Save All Changes ─────────────────────────────────────────────

	async function handleSave() {
		if (!isDirty || isSaving) return;
		isSaving = true;

		let hadConflict = false;
		let hadError = false;

		try {
			// Consolidate wall adds and removes
			const allWallAdds: { floor_id: number; grid_x: number; grid_y: number; grid_w: number; grid_h: number }[] = [];
			const allWallRemoveIds: number[] = [];
			const upserts: any[] = [];
			const deletes: string[] = [];

			for (const change of pendingChanges) {
				switch (change.type) {
					case 'wall_add':
						allWallAdds.push(...change.walls);
						break;
					case 'wall_remove':
						allWallRemoveIds.push(...change.ids);
						break;
					case 'upsert':
						upserts.push(change.item);
						break;
					case 'delete':
						// Only delete items with real server IDs (positive)
						if (parseInt(change.id, 10) > 0) deletes.push(change.id);
						break;
				}
			}

			// 1. Batch walls (single server call for all wall adds + removes)
			if (allWallAdds.length > 0 || allWallRemoveIds.length > 0) {
				const fd = new FormData();
				fd.set('payload', JSON.stringify({ add: allWallAdds, removeIds: allWallRemoveIds }));

				try {
					const res = await fetch('?/batchWalls', { method: 'POST', body: fd });
					if (!res.ok) throw new Error(`Wall batch save failed: ${res.status}`);
				} catch (err: any) {
					hadError = true;
					toast.error('Wall save failed', { description: err?.message || 'Server error' });
					// Rollback: resync from server to get correct state
					await resyncCollection('floor_layout_items');
					return;
				}
			}

			// 2. Room upserts — send _updated_at for optimistic locking on existing items
			for (const item of upserts) {
				const fd = buildItemFormData(item);
				// Include updated_at for optimistic locking on existing items
				if (item.id > 0) {
					const existingItem = currentFloorItems.find((i: any) => i.id === String(item.id));
					if (existingItem?.updated_at) {
						fd.set('_updated_at', existingItem.updated_at);
					}
				}

				try {
					const res = await fetch('?/upsertItem', { method: 'POST', body: fd });
					if (!res.ok) {
						if (res.status === 409) {
							hadConflict = true;
							toast.error(CONFLICT_MESSAGE);
						} else {
							throw new Error(`Upsert failed: ${res.status}`);
						}
					}
				} catch (err: any) {
					if (!hadConflict) {
						hadError = true;
						toast.error('Save failed', { description: err?.message || 'Server error' });
					}
					// On any failure, resync to restore server truth and abort remaining
					await resyncCollection('floor_layout_items');
					return;
				}
			}

			// 3. Deletes
			for (const id of deletes) {
				const fd = new FormData();
				fd.set('id', id);
				try {
					const res = await fetch('?/deleteItem', { method: 'POST', body: fd });
					if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
				} catch (err: any) {
					hadError = true;
					toast.error('Delete failed', { description: err?.message || 'Server error' });
					await resyncCollection('floor_layout_items');
					return;
				}
			}

			// All steps succeeded — clear pending and resync to get real IDs
			pendingChanges = [];
			undoStack = [];
			redoStack = [];
			await resyncCollection('floor_layout_items');
			toast.success('Floor plan saved');
		} catch (err: any) {
			toast.error('Save failed', { description: err?.message || 'Server error' });
			// Resync on unexpected error to restore consistent state
			await resyncCollection('floor_layout_items').catch(() => {});
		} finally {
			isSaving = false;
		}
	}

	async function handleDiscard() {
		if (!isDirty) return;
		pendingChanges = [];
		undoStack = [];
		redoStack = [];
		// Resync from server to revert local changes
		await resyncCollection('floor_layout_items');
		toast.info('Changes discarded');
	}

	// ─── Helpers ───────────────────────────────────────────────────────

	function buildItemFormData(item: any): FormData {
		const fd = new FormData();
		if (item.id && item.id > 0) fd.set('id', String(item.id));
		fd.set('floor_id', String(item.floor_id));
		if (item.rental_unit_id) fd.set('rental_unit_id', String(item.rental_unit_id));
		fd.set('item_type', item.item_type);
		fd.set('grid_x', String(item.grid_x));
		fd.set('grid_y', String(item.grid_y));
		fd.set('grid_w', String(item.grid_w));
		fd.set('grid_h', String(item.grid_h));
		if (item.label) fd.set('label', item.label);
		if (item.color) fd.set('color', item.color);
		return fd;
	}

	// Warn before leaving with unsaved changes
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (isDirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}
</script>

<svelte:head>
	<style>
		/* Override root layout: kill main scroll + padding so floorplan owns the full space */
		main#main-content {
			overflow: hidden !important;
			padding: 0 !important;
		}
		main#main-content > div {
			height: 100% !important;
			max-width: none !important;
		}
	</style>
</svelte:head>

<svelte:window on:beforeunload={handleBeforeUnload} on:keydown={handleUndoKeydown} />

<div class="flex flex-col h-full overflow-hidden">
	<!-- Header -->
	<div class="flex items-center gap-4 px-6 py-3 border-b bg-background shrink-0">
		{#if viewMode === '3d'}
			<button
				onclick={() => (viewMode = '2d')}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
				title="Switch to 2D Editor"
			>
				<Pencil class="w-3.5 h-3.5" />
				Edit
			</button>
		{:else}
			<a href="/properties" class="text-muted-foreground hover:text-foreground text-sm">
				&larr; Properties
			</a>
		{/if}
		<h1 class="text-lg font-semibold">{viewMode === '3d' ? '3D View' : 'Floor Plan'}</h1>

		{#if propertyFloors.length > 0}
			<div class="flex gap-1 ml-4">
				{#each propertyFloors as floor (floor.id)}
					<button
						class="px-3 py-1.5 rounded text-sm font-medium transition-colors
							{selectedFloorId === floor.id
							? 'bg-primary text-primary-foreground'
							: 'bg-secondary hover:bg-secondary/80'}"
						onclick={() => (selectedFloorId = floor.id)}
					>
						Floor {floor.floor_number}
						{#if floor.wing}<span class="opacity-70"> · {floor.wing}</span>{/if}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Undo / Redo -->
		<div class="flex items-center gap-1 ml-4">
			<button
				onclick={undo}
				disabled={undoStack.length === 0 || isSaving}
				class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-sm disabled:opacity-30"
				title="Undo (Ctrl+Z)"
			>
				<Undo2 class="w-3.5 h-3.5" />
			</button>
			<button
				onclick={redo}
				disabled={redoStack.length === 0 || isSaving}
				class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-sm disabled:opacity-30"
				title="Redo (Ctrl+Shift+Z)"
			>
				<Redo2 class="w-3.5 h-3.5" />
			</button>
		</div>

		<!-- Save / Discard buttons -->
		<div class="ml-auto flex items-center gap-2">
			{#if isDirty}
				<span class="text-xs text-amber-600 font-medium">
					{pendingChanges.length} unsaved change{pendingChanges.length !== 1 ? 's' : ''}
				</span>
				<button
					onclick={handleDiscard}
					disabled={isSaving}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border hover:bg-muted transition-colors disabled:opacity-50"
				>
					<Undo2 class="w-3.5 h-3.5" />
					Discard
				</button>
			{/if}
			<button
				onclick={handleSave}
				disabled={!isDirty || isSaving}
				class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50
					{isDirty
					? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
					: 'bg-muted text-muted-foreground'}"
			>
				{#if isSaving}
					<Loader2 class="w-3.5 h-3.5 animate-spin" />
					Saving...
				{:else}
					<Save class="w-3.5 h-3.5" />
					Save
				{/if}
			</button>

			<div class="ml-2 flex rounded-md border overflow-hidden">
				<button
					class="px-3 py-1.5 text-sm font-medium transition-colors
						{viewMode === '2d' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}"
					onclick={() => (viewMode = '2d')}
				>
					2D Editor
				</button>
				<button
					class="px-3 py-1.5 text-sm font-medium transition-colors
						{viewMode === '3d' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'}"
					onclick={() => (viewMode = '3d')}
				>
					3D View
				</button>
			</div>
		</div>
	</div>

	<!-- Main content -->
	<div class="flex flex-1 overflow-hidden">
		{#if viewMode === '2d'}
			<ItemSidebar
				{unplacedUnits}
				{placedCount}
				{totalCount}
				tool={drawTool}
				onToolChange={(t) => (drawTool = t)}
			/>

			<div class="flex-1 min-h-0 overflow-hidden flex flex-col">
				{#if !floorLayoutItemsStore.initialized}
					<div class="h-full flex items-center justify-center text-muted-foreground">
						Loading floor plan...
					</div>
				{:else if selectedFloorId}
					<FloorGrid
						items={currentFloorItems}
						floorId={parseInt(selectedFloorId, 10)}
						tool={drawTool}
						{rentalUnitsMap}
						{unplacedUnits}
						onWallAdd={handleWallAdd}
						onWallRemove={handleWallRemove}
						onRoomAssign={handleRoomAssign}
						onRoomClear={handleRoomClear}
						onWallMetaToggle={handleWallMetaToggle}
						onWallMetaUpdate={handleWallMetaUpdate}
						onWallColorChange={handleWallColorChange}
						onAreaUpdate={handleAreaUpdate}
						onToolToggle={() => (drawTool = drawTool === 'draw' ? 'erase' : 'draw')}
					/>
				{:else}
					<div class="h-full flex items-center justify-center text-muted-foreground">
						No floors found. Add floors first.
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex-1 overflow-hidden min-h-0" style="height: 100%;">
				<FloorViewer3D
					floors={propertyFloors}
					allItems={floorLayoutItemsStore.value}
					rentalUnits={propertyUnits}
					{unitTenantsMap}
					{selectedFloorId}
					onUnitClick={(unitId) => {
						console.log('Unit clicked:', unitId);
					}}
				/>
			</div>
		{/if}
	</div>

	{#if showBrokenConfirm && brokenRooms.length > 0}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div class="bg-background rounded-lg shadow-xl p-5 max-w-sm mx-4 space-y-3">
				<h3 class="text-sm font-semibold">Room assignments broken</h3>
				<p class="text-xs text-muted-foreground">
					Removing walls broke {brokenRooms.length} room assignment{brokenRooms.length !== 1 ? 's' : ''}. These rooms are no longer enclosed:
				</p>
				<ul class="text-xs space-y-1.5 max-h-40 overflow-y-auto">
					{#each brokenRooms as b (b.id)}
						<li class="flex items-center justify-between gap-2 px-2 py-1.5 bg-red-50 rounded border border-red-200">
							<span class="text-red-700 truncate">{b.label}</span>
							<button
								class="shrink-0 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-medium hover:bg-red-700"
								onclick={() => confirmUnassignBrokenSingle(b.id)}
							>
								Unassign
							</button>
						</li>
					{/each}
				</ul>
				<div class="flex justify-end">
					<button
						class="px-3 py-1.5 rounded border text-xs hover:bg-secondary"
						onclick={dismissBrokenConfirm}
					>
						Keep all
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
