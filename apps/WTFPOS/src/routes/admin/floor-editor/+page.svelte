<script lang="ts">
	import { tables as allTables, addTable, updateTableLayout, deleteTable } from '$lib/stores/pos.svelte';
	import type { Table } from '$lib/types';
	import { session, LOCATIONS } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import { writeLog } from '$lib/stores/audit.svelte';

	let selectedLocationId = $state<string>(
		session.locationId === 'all' ? 'qc' : (session.locationId === 'wh-qc' ? 'qc' : session.locationId)
	);

	const retailLocations = LOCATIONS.filter(l => l.type === 'retail');
	const tables = $derived(allTables.filter(t => t.locationId === selectedLocationId));

	// ─── Dragging State ──────────────────────────────────────────────────────────
	let draggingTableId = $state<string | null>(null);
	let startMouseX = $state(0);
	let startMouseY = $state(0);
	let initialTableX = $state(0);
	let initialTableY = $state(0);

	// Holds temporary layout alterations until saved
	let pendingLayout = $state<Map<string, { x: number; y: number }>>(new Map());

	let hasChanges = $derived(pendingLayout.size > 0);

	function startDrag(e: MouseEvent, table: Table) {
		draggingTableId = table.id;
		startMouseX = e.clientX;
		startMouseY = e.clientY;

		const currentCoords = pendingLayout.get(table.id) || { x: table.x, y: table.y };
		initialTableX = currentCoords.x;
		initialTableY = currentCoords.y;

		// Prevent text selection while dragging
		e.preventDefault();
	}

	function onMouseMove(e: MouseEvent) {
		if (!draggingTableId) return;

		const dx = e.clientX - startMouseX;
		const dy = e.clientY - startMouseY;

		// Snap to 10px grid
		const newX = Math.round((initialTableX + dx) / 10) * 10;
		const newY = Math.round((initialTableY + dy) / 10) * 10;

		pendingLayout.set(draggingTableId, { x: newX, y: newY });
		pendingLayout = new Map(pendingLayout); // trigger reactivity
	}

	function onMouseUp() {
		draggingTableId = null;
	}

	function getMergedTable(table: Table): Table {
		const override = pendingLayout.get(table.id);
		if (override) {
			return { ...table, ...override };
		}
		return table;
	}

	// ─── Properties Editor ──────────────────────────────────────────────────────
	let activeTableId = $state<string | null>(null);
	let editLabel = $state('');
	let editCapacity = $state(2);

	const activeTable = $derived(tables.find(t => t.id === activeTableId));

	function selectForEdit(table: Table) {
		activeTableId = table.id;
		editLabel = table.label;
		editCapacity = table.capacity;
	}

	function createTable() {
		// Find the highest existing table number to avoid duplicates after deletion
		const maxNum = tables.reduce((max, t) => {
			const match = t.label.match(/^T(\d+)$/);
			return match ? Math.max(max, parseInt(match[1])) : max;
		}, 0);
		addTable(selectedLocationId, `T${maxNum + 1}`, 2, 50, 50);
		writeLog('admin', `Added table to ${selectedLocationId}`);
	}

	function removeTable() {
		if (activeTableId) {
			deleteTable(activeTableId);
			pendingLayout.delete(activeTableId);
			pendingLayout = new Map(pendingLayout);
			activeTableId = null;
			writeLog('admin', `Removed table from ${selectedLocationId}`);
		}
	}

	function saveProperties() {
		if (activeTableId) {
			const t = allTables.find(t => t.id === activeTableId);
			if (t) {
				t.label = editLabel;
				t.capacity = editCapacity;
			}
		}
		activeTableId = null;
	}

	function saveLayout() {
		const updates = Array.from(pendingLayout.entries()).map(([id, pos]) => ({
			id, x: pos.x, y: pos.y
		}));
		updateTableLayout(updates);
		pendingLayout.clear();
		pendingLayout = new Map();
		activeTableId = null;
		writeLog('admin', `Saved layout changes for ${selectedLocationId}`);
	}

	function discardLayout() {
		pendingLayout.clear();
		pendingLayout = new Map();
		activeTableId = null;
	}
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="flex h-full gap-6">
	<!-- Canvas / Editor Area -->
	<div class="flex-1 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
				{#each retailLocations as loc}
					<button
						class={cn(
							"px-4 py-1.5 text-sm font-semibold rounded-md transition-colors",
							selectedLocationId === loc.id ? "bg-white text-accent shadow-sm" : "text-gray-500 hover:text-gray-900"
						)}
						onclick={() => { selectedLocationId = loc.id; discardLayout(); }}
					>
						{loc.name}
					</button>
				{/each}
			</div>

			<div class="flex gap-2">
				<button onclick={createTable} class="btn-secondary px-4">
					+ Add Table
				</button>
			</div>
		</div>

		<!-- The Floor Canvas -->
		<div class="flex-1 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl relative overflow-hidden select-none">
			<!-- Canvas Background Grid -->
			<div class="absolute inset-0" style="background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5;"></div>

			<!-- Tables -->
			{#each tables as table (table.id)}
				{@const rendered = getMergedTable(table)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onmousedown={(e) => { selectForEdit(table); startDrag(e, table); }}
					class={cn(
						"absolute flex flex-col items-center justify-center rounded-lg border-2 cursor-grab active:cursor-grabbing transition-shadow",
						activeTableId === table.id ? "border-accent bg-accent-light shadow-lg z-20" : "border-gray-400 bg-white hover:border-accent z-10"
					)}
					style="left: {rendered.x}px; top: {rendered.y}px; width: {rendered.width ?? 92}px; height: {rendered.height ?? 92}px;"
				>
					<span class="text-base font-extrabold text-gray-900 pointer-events-none">{rendered.label}</span>
					<span class="text-xs text-gray-400 pointer-events-none">{rendered.capacity}p</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Sidebar / Inspector -->
	<div class="w-80 flex flex-col gap-4">
		<div class="pos-card p-5 border-l-4 border-l-accent flex flex-col gap-5">
			<div>
				<h2 class="text-lg font-bold text-gray-900">Publish Floor</h2>
				<p class="text-sm text-gray-500">Apply table position changes.</p>
			</div>
			
			<div class="flex flex-col gap-2">
				<button onclick={saveLayout} disabled={!hasChanges} class="btn-primary w-full disabled:opacity-40">
					Save Layout
				</button>
				<button onclick={discardLayout} disabled={!hasChanges} class="btn-secondary w-full disabled:opacity-40">
					Discard Changes
				</button>
			</div>
			
			{#if hasChanges}
				<div class="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
					You have unsaved positioning changes!
				</div>
			{/if}
		</div>

		<!-- Table Properties -->
		<div class="pos-card p-5 flex flex-col gap-4">
			<h2 class="text-base font-bold text-gray-900 border-b border-border pb-2">Table Properties</h2>
			
			{#if activeTable}
				<div class="flex flex-col gap-4">
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase">Label</span>
						<input type="text" bind:value={editLabel} class="pos-input" />
					</label>
					
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase">Capacity (Pax)</span>
						<input type="number" bind:value={editCapacity} class="pos-input" min="1" max="20" />
					</label>

					<div class="flex gap-2 pt-2">
						<button onclick={saveProperties} class="btn-secondary flex-1">Apply</button>
						<button onclick={removeTable} class="btn-danger flex-1">Delete</button>
					</div>
				</div>
			{:else}
				<div class="py-6 text-center text-sm text-gray-400">
					Click a table to edit it.
				</div>
			{/if}
		</div>
	</div>
</div>
