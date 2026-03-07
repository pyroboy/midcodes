<script lang="ts">
	import { tables as allTables, addTable } from '$lib/stores/pos.svelte';
	import type { Table, FloorElement, FloorElementType } from '$lib/types';
	import { session, LOCATIONS } from '$lib/stores/session.svelte';
	import { floorEditor } from '$lib/stores/floor-editor.svelte';
	import { getDb } from '$lib/db';
	import { browser } from '$app/environment';
	import { nanoid } from 'nanoid';
	import { writeLog } from '$lib/stores/audit.svelte';
	import { cn } from '$lib/utils';
	import TableSVG from '$lib/components/floor-editor/TableSVG.svelte';
	import FloorElementSVG from '$lib/components/floor-editor/FloorElementSVG.svelte';
	import ChairEditorModal from '$lib/components/floor-editor/ChairEditorModal.svelte';

	// ─── Location selector ────────────────────────────────────────────────────
	const retailLocations = LOCATIONS.filter(l => l.type === 'retail');
	let selectedLocationId = $state<string>(
		session.locationId === 'all' || session.locationId === 'wh-tag' ? 'tag' : session.locationId
	);

	const locationTables = $derived(
		allTables.value
			.filter(t => t.locationId === selectedLocationId && !floorEditor.deletedTableIds.has(t.id))
			.map(t => floorEditor.getMergedTable(t))
	);

	// Merge persisted elements with pending ones, exclude deleted
	let persistedElements = $state<FloorElement[]>([]);
	const visibleElements = $derived.by(() => {
		const seen = new Set<string>();
		const result: FloorElement[] = [];
		for (const el of [...persistedElements, ...floorEditor.pendingElements.values()]) {
			if (el.locationId === selectedLocationId && !floorEditor.deletedElementIds.has(el.id) && !seen.has(el.id)) {
				seen.add(el.id);
				result.push(el);
			}
		}
		return result;
	});

	// ─── Canvas config ────────────────────────────────────────────────────────
	const CANVAS_W = $derived(floorEditor.canvasConfig.width);
	const CANVAS_H = $derived(floorEditor.canvasConfig.height);
	const GRID_SIZE = $derived(floorEditor.canvasConfig.gridSize);

	// ─── Load from RxDB ───────────────────────────────────────────────────────
	$effect(() => {
		if (!browser) return;
		(async () => {
			const db = await getDb();
			const allEls = await db.floor_elements.find().exec();
			const allJson = allEls.map((e: any) => e.toJSON());
			persistedElements = allJson.filter((e: any) => e.type !== 'canvas_config');
			const cfg = allJson.find((e: any) => e.type === 'canvas_config' && e.locationId === selectedLocationId);
			if (cfg) {
				floorEditor.setCanvasConfig(cfg);
			} else {
				floorEditor.setCanvasConfig({
					id: `canvas_${selectedLocationId}`,
					locationId: selectedLocationId,
					width: 900,
					height: 600,
					gridSize: 20
				});
			}
		})();
	});

	// ─── Drag state ───────────────────────────────────────────────────────────
	type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'rotate';

	let dragId = $state<string | null>(null);
	let dragType = $state<'table' | 'element' | null>(null);
	let dragMode = $state<DragMode>('move');
	let dragStartMouse = $state({ x: 0, y: 0 });
	let dragStartPos = $state({ x: 0, y: 0 });
	let dragStartSize = $state({ w: 0, h: 0 });
	let dragStartRotation = $state(0);

	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });
	let panStartOffset = $state({ x: 0, y: 0 });

	// SVG element ref — needed for screen→canvas coordinate conversion
	let svgEl = $state<SVGSVGElement | null>(null);

	function snapVal(v: number): number {
		if (!floorEditor.snapEnabled) return v;
		return Math.round(v / GRID_SIZE) * GRID_SIZE;
	}

	/** Convert a screen pointer event to canvas coordinates (accounts for pan + zoom). */
	function svgPoint(e: PointerEvent): { x: number; y: number } {
		const rect = svgEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
		return {
			x: (e.clientX - rect.left - floorEditor.panX) / floorEditor.zoom,
			y: (e.clientY - rect.top  - floorEditor.panY) / floorEditor.zoom
		};
	}

	/** Inverse-rotate a canvas point around (cx, cy) to get table-local coordinates. */
	function inverseRotate(px: number, py: number, cx: number, cy: number, deg: number) {
		const rad = (-deg * Math.PI) / 180;
		const dx = px - cx, dy = py - cy;
		return {
			x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
			y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
		};
	}

	function startDrag(e: PointerEvent, item: Table | FloorElement, type: 'table' | 'element') {
		e.stopPropagation();
		floorEditor.select(item.id, type);
		dragId = item.id;
		dragType = type;
		dragMode = 'move';
		dragStartMouse = { x: e.clientX, y: e.clientY };
		dragStartPos = { x: item.x, y: item.y };
	}

	function startResize(corner: 'nw' | 'ne' | 'sw' | 'se', e: PointerEvent, table: Table) {
		e.stopPropagation();
		dragId = table.id;
		dragType = 'table';
		dragMode = `resize-${corner}`;
		dragStartMouse = { x: e.clientX, y: e.clientY };
		dragStartPos = { x: table.x, y: table.y };
		dragStartSize = { w: table.width ?? 112, h: table.height ?? 112 };
		dragStartRotation = table.rotation ?? 0;
	}

	function startRotate(e: PointerEvent, table: Table) {
		e.stopPropagation();
		dragId = table.id;
		dragType = 'table';
		dragMode = 'rotate';
		dragStartMouse = { x: e.clientX, y: e.clientY };
		dragStartPos = { x: table.x, y: table.y };
		dragStartSize = { w: table.width ?? 112, h: table.height ?? 112 };
		dragStartRotation = table.rotation ?? 0;
	}

	function startRotateElement(e: PointerEvent, el: FloorElement) {
		e.stopPropagation();
		dragId = el.id;
		dragType = 'element';
		dragMode = 'rotate';
		dragStartMouse = { x: e.clientX, y: e.clientY };
		dragStartPos = { x: el.x, y: el.y };
		dragStartSize = { w: el.width, h: el.height };
		dragStartRotation = el.rotation ?? 0;
	}

	function startResizeElement(corner: 'nw' | 'ne' | 'sw' | 'se', e: PointerEvent, el: FloorElement) {
		e.stopPropagation();
		dragId = el.id;
		dragType = 'element';
		dragMode = `resize-${corner}`;
		dragStartMouse = { x: e.clientX, y: e.clientY };
		dragStartPos = { x: el.x, y: el.y };
		dragStartSize = { w: el.width, h: el.height };
		dragStartRotation = el.rotation ?? 0;
	}

	function onPointerMove(e: PointerEvent) {
		if (isPanning) {
			floorEditor.setPan(
				panStartOffset.x + (e.clientX - panStart.x),
				panStartOffset.y + (e.clientY - panStart.y)
			);
			return;
		}
		if (!dragId || !dragType) return;

		if (dragMode === 'move') {
			const dx = (e.clientX - dragStartMouse.x) / floorEditor.zoom;
			const dy = (e.clientY - dragStartMouse.y) / floorEditor.zoom;
			if (dragType === 'table') {
				floorEditor.patchTable(dragId, { x: snapVal(dragStartPos.x + dx), y: snapVal(dragStartPos.y + dy) });
			} else {
				floorEditor.patchElement(dragId, { x: snapVal(dragStartPos.x + dx), y: snapVal(dragStartPos.y + dy) });
			}
			return;
		}

		if (dragMode === 'rotate') {
			const p = svgPoint(e);
			const W = dragStartSize.w, H = dragStartSize.h;
			const centerX = dragStartPos.x + W / 2;
			const centerY = dragStartPos.y + H / 2;
			const rawAngle = Math.atan2(p.y - centerY, p.x - centerX) * 180 / Math.PI + 90;
			// Snap to 15° increments when snap is on
			const angle = floorEditor.snapEnabled ? Math.round(rawAngle / 15) * 15 : rawAngle;
			if (dragType === 'table') {
				floorEditor.patchTable(dragId, { rotation: angle });
			} else {
				floorEditor.patchElement(dragId, { rotation: angle });
			}
			return;
		}

		if (dragMode.startsWith('resize-')) {
			const corner = dragMode.slice(7) as 'nw' | 'ne' | 'sw' | 'se';
			const p = svgPoint(e);
			const { w: startW, h: startH } = dragStartSize;
			const centerX = dragStartPos.x + startW / 2;
			const centerY = dragStartPos.y + startH / 2;
			// Work in table-local space (un-rotated) so resize axes are always aligned
			const local = inverseRotate(p.x, p.y, centerX, centerY, dragStartRotation);
			const MIN = 40;

			let { x: newX, y: newY } = dragStartPos;
			let newW = startW, newH = startH;

			if (corner === 'se') {
				newW = Math.max(MIN, snapVal(local.x - dragStartPos.x));
				newH = Math.max(MIN, snapVal(local.y - dragStartPos.y));
			} else if (corner === 'ne') {
				newW = Math.max(MIN, snapVal(local.x - dragStartPos.x));
				const top = Math.min(dragStartPos.y + startH - MIN, snapVal(local.y));
				newH = dragStartPos.y + startH - top;
				newY = top;
			} else if (corner === 'sw') {
				const left = Math.min(dragStartPos.x + startW - MIN, snapVal(local.x));
				newW = dragStartPos.x + startW - left;
				newX = left;
				newH = Math.max(MIN, snapVal(local.y - dragStartPos.y));
			} else { // nw
				const left = Math.min(dragStartPos.x + startW - MIN, snapVal(local.x));
				newW = dragStartPos.x + startW - left;
				newX = left;
				const top = Math.min(dragStartPos.y + startH - MIN, snapVal(local.y));
				newH = dragStartPos.y + startH - top;
				newY = top;
			}
			if (dragType === 'table') {
				floorEditor.patchTable(dragId, { x: newX, y: newY, width: newW, height: newH });
			} else {
				floorEditor.patchElement(dragId, { x: newX, y: newY, width: newW, height: newH });
			}
		}
	}

	function onPointerUp() {
		dragId = null;
		dragType = null;
		isPanning = false;
	}

	function onCanvasPointerDown(e: PointerEvent) {
		if (e.button === 1) {
			isPanning = true;
			panStart = { x: e.clientX, y: e.clientY };
			panStartOffset = { x: floorEditor.panX, y: floorEditor.panY };
			return;
		}
		floorEditor.deselect();
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.97 : 1.03;
		floorEditor.setZoom(floorEditor.zoom * delta);
	}

	// ─── Keyboard shortcuts ───────────────────────────────────────────────────
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') { floorEditor.deselect(); return; }
		if ((e.key === 'Delete' || e.key === 'Backspace') && floorEditor.selectedId) {
			if (floorEditor.selectedType === 'table') {
				const t = locationTables.find(t => t.id === floorEditor.selectedId);
				if (t && t.status === 'available') floorEditor.markTableDeleted(t.id);
			} else {
				floorEditor.deleteElement(floorEditor.selectedId);
			}
		}
	}

	// ─── Inspector selection ─────────────────────────────────────────────────
	const selectedTable = $derived(
		floorEditor.selectedType === 'table'
			? locationTables.find(t => t.id === floorEditor.selectedId) ?? null
			: null
	);

	const selectedElement = $derived(
		floorEditor.selectedType === 'element'
			? visibleElements.find(e => e.id === floorEditor.selectedId) ?? null
			: null
	);

	// ─── Add element ─────────────────────────────────────────────────────────
	const ELEMENT_TYPES: { type: FloorElementType; label: string }[] = [
		{ type: 'wall',      label: '🧱 Wall' },
		{ type: 'divider',   label: '📏 Divider' },
		{ type: 'entrance',  label: '🚪 Entrance' },
		{ type: 'exit',      label: '🚪 Exit' },
		{ type: 'bar',       label: '🍺 Bar' },
		{ type: 'kitchen',   label: '🍳 Kitchen' },
		{ type: 'furniture', label: '🪑 Furniture' },
		{ type: 'stairs',    label: '🪜 Stairs' },
		{ type: 'label',     label: '🏷️ Label' },
	];

	let showElementMenu = $state(false);

	function addElement(type: FloorElementType) {
		showElementMenu = false;
		const el: FloorElement = {
			id: nanoid(),
			locationId: selectedLocationId,
			type,
			shape: 'rect',
			x: snapVal(CANVAS_W / 2 - 60),
			y: snapVal(CANVAS_H / 2 - 30),
			width: type === 'wall' ? 200 : 120,
			height: type === 'wall' ? 20 : 60,
			label: (type !== 'wall' && type !== 'divider')
				? type.charAt(0).toUpperCase() + type.slice(1)
				: '',
			updatedAt: new Date().toISOString()
		};
		floorEditor.upsertElement(el);
		floorEditor.select(el.id, 'element');
	}

	// ─── Add table ────────────────────────────────────────────────────────────
	async function handleAddTable() {
		const maxNum = locationTables.reduce((max, t) => {
			const m = t.label.match(/^T(\d+)$/);
			return m ? Math.max(max, parseInt(m[1])) : max;
		}, 0);
		await addTable(selectedLocationId, `T${maxNum + 1}`, 4, snapVal(80), snapVal(80));
		writeLog('admin', `Added table to ${selectedLocationId}`);
	}

	// ─── Save ─────────────────────────────────────────────────────────────────
	async function save() {
		if (!browser) return;
		const db = await getDb();

		for (const [id, patch] of floorEditor.pendingTableUpdates) {
			const doc = await db.tables.findOne(id).exec();
			if (doc) await doc.incrementalPatch({ ...JSON.parse(JSON.stringify(patch)), updatedAt: new Date().toISOString() });
		}

		for (const id of floorEditor.deletedTableIds) {
			const doc = await db.tables.findOne(id).exec();
			if (doc && doc.status === 'available') await doc.remove();
		}

		for (const el of floorEditor.pendingElements.values()) {
			const plain = JSON.parse(JSON.stringify(el));
			const existing = await db.floor_elements.findOne(el.id).exec();
			if (existing) {
				await existing.incrementalPatch({ ...plain, updatedAt: new Date().toISOString() });
			} else {
				await db.floor_elements.insert({ ...plain, updatedAt: new Date().toISOString() });
			}
		}

		for (const id of floorEditor.deletedElementIds) {
			const doc = await db.floor_elements.findOne(id).exec();
			if (doc) await doc.remove();
		}

		const canvasId = `canvas_${selectedLocationId}`;
		const canvasCfg = {
			id: canvasId,
			locationId: selectedLocationId,
			type: 'canvas_config',
			shape: 'rect',
			x: 0,
			y: 0,
			width: floorEditor.canvasConfig.width,
			height: floorEditor.canvasConfig.height,
			gridSize: floorEditor.canvasConfig.gridSize,
			updatedAt: new Date().toISOString()
		};
		const existingCfg = await db.floor_elements.findOne(canvasId).exec();
		if (existingCfg) {
			await existingCfg.incrementalPatch(canvasCfg);
		} else {
			await db.floor_elements.insert(canvasCfg);
		}

		const allEls2 = await db.floor_elements.find().exec();
		persistedElements = allEls2.map((e: any) => e.toJSON()).filter((e: any) => e.type !== 'canvas_config');
		floorEditor.discard();
		writeLog('admin', `Saved floor layout for ${selectedLocationId}`);
	}

	// Chair modal table (with pending patches merged)
	const chairModalTable = $derived(
		floorEditor.chairModalTableId
			? locationTables.find(t => t.id === floorEditor.chairModalTableId) ?? null
			: null
	);
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="flex h-full flex-col overflow-hidden">

	<!-- ── Toolbar ── -->
	<div class="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
		<!-- Location tabs -->
		<div class="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
			{#each retailLocations as loc}
				<button
					class={cn("px-3 py-1 text-sm font-semibold rounded-md transition-colors",
						selectedLocationId === loc.id ? "bg-white text-accent shadow-sm" : "text-gray-500 hover:text-gray-900")}
					onclick={() => { selectedLocationId = loc.id; floorEditor.discard(); }}
				>{loc.name}</button>
			{/each}
		</div>

		<div class="w-px h-5 bg-gray-200"></div>

		<button onclick={handleAddTable} class="btn-secondary text-xs px-3 py-1.5">+ Table</button>

		<!-- Element dropdown -->
		<div class="relative">
			<button onclick={() => showElementMenu = !showElementMenu} class="btn-secondary text-xs px-3 py-1.5">
				+ Element ▾
			</button>
			{#if showElementMenu}
				<div
					role="menu"
					tabindex="0"
					class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 min-w-40"
					onclick={() => showElementMenu = false}
					onkeydown={(e) => e.key === "Escape" && (showElementMenu = false)}
				>
					{#each ELEMENT_TYPES as et}
						<button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700" onclick={() => addElement(et.type)}>
							{et.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="w-px h-5 bg-gray-200"></div>

		<!-- Zoom -->
		<button onclick={() => floorEditor.setZoom(floorEditor.zoom * 1.1)} class="btn-ghost text-sm w-7 h-7 flex items-center justify-center">+</button>
		<span class="text-xs font-mono text-gray-500 w-10 text-center">{Math.round(floorEditor.zoom * 100)}%</span>
		<button onclick={() => floorEditor.setZoom(floorEditor.zoom * 0.9)} class="btn-ghost text-sm w-7 h-7 flex items-center justify-center">−</button>
		<button onclick={() => { floorEditor.setZoom(1); floorEditor.setPan(0, 0); }} class="btn-ghost text-xs px-2">1:1</button>

		<div class="w-px h-5 bg-gray-200"></div>

		<button
			onclick={() => floorEditor.toggleGrid()}
			class={cn("text-xs px-2.5 py-1 rounded-md border transition-colors",
				floorEditor.gridVisible ? "border-accent bg-accent/5 text-accent font-semibold" : "border-gray-200 text-gray-500 hover:text-gray-700")}
		>Grid</button>
		<button
			onclick={() => floorEditor.toggleSnap()}
			class={cn("text-xs px-2.5 py-1 rounded-md border transition-colors",
				floorEditor.snapEnabled ? "border-accent bg-accent/5 text-accent font-semibold" : "border-gray-200 text-gray-500 hover:text-gray-700")}
		>Snap</button>

		<div class="flex-1"></div>

		{#if floorEditor.isDirty}
			<span class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">Unsaved</span>
		{/if}
		<button onclick={() => floorEditor.discard()} disabled={!floorEditor.isDirty} class="btn-secondary text-xs px-3 disabled:opacity-40">
			Discard
		</button>
		<button onclick={save} disabled={!floorEditor.isDirty} class="btn-primary text-xs px-4 disabled:opacity-40">
			Save Floor
		</button>
	</div>

	<!-- ── Canvas + Inspector ── -->
	<div class="flex flex-1 overflow-hidden">

		<!-- SVG Canvas -->
		<div
			class="flex-1 bg-gray-200 overflow-hidden relative select-none"
			role="application"
			aria-label="Floor editor canvas"
			onwheel={onWheel}
		>
			<svg
				bind:this={svgEl}
				width="100%"
				height="100%"
				onpointerdown={onCanvasPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				style="cursor: {isPanning ? 'grabbing' : 'default'}; touch-action: none;"
			>
				<g transform="translate({floorEditor.panX} {floorEditor.panY}) scale({floorEditor.zoom})">
					<!-- White canvas background -->
					<rect width={CANVAS_W} height={CANVAS_H} fill="#ffffff" rx="8" />

					<!-- Grid pattern -->
					{#if floorEditor.gridVisible}
						<defs>
							<pattern id="floor-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
								<path d="M {GRID_SIZE} 0 L 0 0 0 {GRID_SIZE}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
							</pattern>
						</defs>
						<rect width={CANVAS_W} height={CANVAS_H} fill="url(#floor-grid)" rx="8" />
					{/if}

					<!-- Canvas border -->
					<rect width={CANVAS_W} height={CANVAS_H} fill="none" stroke="#d1d5db" stroke-width="1.5" rx="8" />

					<!-- Floor elements -->
					{#each visibleElements as el (el.id)}
						<FloorElementSVG
							element={el}
							selected={floorEditor.selectedId === el.id}
							onclick={(e) => { e.stopPropagation(); floorEditor.select(el.id, 'element'); }}
							onpointerdown={(e) => startDrag(e, el, 'element')}
							onrotatestart={(e) => startRotateElement(e, el)}
							onresizestart={(corner, e) => startResizeElement(corner, e, el)}
						/>
					{/each}

					<!-- Tables -->
					{#each locationTables as table (table.id)}
						<TableSVG
							table={table}
							selected={floorEditor.selectedId === table.id}
							mode="editor"
							onclick={(e) => { e.stopPropagation(); floorEditor.select(table.id, 'table'); }}
							onpointerdown={(e) => startDrag(e, table, 'table')}
							onresizestart={(corner, e) => startResize(corner, e, table)}
							onrotatestart={(e) => startRotate(e, table)}
						/>
					{/each}
				</g>
			</svg>

			{#if locationTables.length === 0 && visibleElements.length === 0}
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<span class="text-5xl mb-3">🪑</span>
					<p class="text-gray-400 text-sm">No tables yet — click "+ Table" to add one</p>
				</div>
			{/if}
		</div>

		<!-- ── Inspector Panel ── -->
		<div class="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shrink-0">

			{#if selectedTable}
				<!-- TABLE INSPECTOR -->
				<div class="p-4 border-b border-gray-100 bg-accent/5">
					<p class="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">Table Selected</p>
					<p class="text-base font-bold text-gray-900">{selectedTable.label}</p>
				</div>

				<div class="p-4 flex flex-col gap-4 flex-1">
					<!-- Label -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</span>
						<input
							type="text"
							value={selectedTable.label}
							class="pos-input"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { label: (e.target as HTMLInputElement).value })}
						/>
					</label>

					<!-- Capacity -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity (pax)</span>
						<input
							type="number" min="1" max="30"
							value={selectedTable.capacity}
							class="pos-input"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { capacity: parseInt((e.target as HTMLInputElement).value) || 1 })}
						/>
					</label>

					<!-- Width / Height -->
					<div class="grid grid-cols-2 gap-2">
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">W (px)</span>
							<input
								type="number" min="40" max="400"
								value={selectedTable.width ?? 112}
								class="pos-input"
								oninput={(e) => floorEditor.patchTable(selectedTable!.id, { width: parseInt((e.target as HTMLInputElement).value) || 112 })}
							/>
						</label>
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">H (px)</span>
							<input
								type="number" min="40" max="400"
								value={selectedTable.height ?? 112}
								class="pos-input"
								oninput={(e) => floorEditor.patchTable(selectedTable!.id, { height: parseInt((e.target as HTMLInputElement).value) || 112 })}
							/>
						</label>
					</div>

					<!-- Border radius slider -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Roundness — {selectedTable.borderRadius ?? 10}px
						</span>
						<input
							type="range" min="0" max="60" step="2"
							value={selectedTable.borderRadius ?? 10}
							class="w-full accent-accent"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { borderRadius: parseInt((e.target as HTMLInputElement).value) })}
						/>
					</label>

					<!-- Border width slider -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Border Width — {selectedTable.borderWidth ?? 1.5}px
						</span>
						<input
							type="range" min="0" max="6" step="0.5"
							value={selectedTable.borderWidth ?? 1.5}
							class="w-full accent-accent"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { borderWidth: parseFloat((e.target as HTMLInputElement).value) })}
						/>
					</label>

					<!-- Rotation -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rotation (°)</span>
						<input
							type="number" min="-180" max="180"
							value={selectedTable.rotation ?? 0}
							class="pos-input"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { rotation: parseFloat((e.target as HTMLInputElement).value) || 0 })}
						/>
					</label>

					<!-- Color -->
					<div class="flex flex-col gap-2">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Table Color</span>
						<div class="flex items-center gap-2 flex-wrap">
							<input
								type="color"
								value={selectedTable.color ?? '#ffffff'}
								class="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer shrink-0"
								oninput={(e) => floorEditor.patchTable(selectedTable!.id, { color: (e.target as HTMLInputElement).value })}
							/>
							{#each ['#ffffff','#fff7ed','#f0fdf4','#eff6ff','#fdf4ff','#fef2f2','#1e293b'] as c}
								<button
									class="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110
										{selectedTable.color === c ? 'border-gray-900 scale-110' : 'border-gray-200'}"
									style="background-color: {c}"
									aria-label="Table color {c}"
									onclick={() => floorEditor.patchTable(selectedTable!.id, { color: c })}
								></button>
							{/each}
						</div>
					</div>

					<!-- Opacity -->
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Opacity — {Math.round((selectedTable.opacity ?? 1) * 100)}%
						</span>
						<input
							type="range" min="0.1" max="1" step="0.05"
							value={selectedTable.opacity ?? 1}
							class="w-full accent-accent"
							oninput={(e) => floorEditor.patchTable(selectedTable!.id, { opacity: parseFloat((e.target as HTMLInputElement).value) })}
						/>
					</label>

					<!-- Chair editor CTA -->
					<button
						onclick={() => floorEditor.openChairModal(selectedTable!.id)}
						class="btn-secondary w-full text-sm flex items-center justify-center gap-2 py-2.5"
					>
						<span>🪑</span> Edit Chairs…
					</button>

					<div class="h-px bg-gray-100"></div>

					<!-- Delete -->
					{#if selectedTable.status === 'available'}
						<button onclick={() => floorEditor.markTableDeleted(selectedTable!.id)} class="btn-danger w-full text-sm">
							Delete Table
						</button>
					{:else}
						<p class="text-xs text-amber-600 text-center bg-amber-50 border border-amber-100 rounded-lg py-2 px-3">
							Table is in use — cannot delete while occupied
						</p>
					{/if}
				</div>

			{:else if selectedElement}
				<!-- ELEMENT INSPECTOR -->
				<div class="p-4 border-b border-gray-100 bg-blue-50">
					<p class="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-0.5">Element Selected</p>
					<p class="text-base font-bold text-gray-900 capitalize">{selectedElement.type}</p>
				</div>

				<div class="p-4 flex flex-col gap-4">
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</span>
						<input
							type="text"
							value={selectedElement.label ?? ''}
							class="pos-input"
							oninput={(e) => floorEditor.patchElement(selectedElement!.id, { label: (e.target as HTMLInputElement).value })}
						/>
					</label>

					<div class="grid grid-cols-2 gap-2">
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">W (px)</span>
							<input type="number" min="10" value={selectedElement.width} class="pos-input"
								oninput={(e) => floorEditor.patchElement(selectedElement!.id, { width: parseInt((e.target as HTMLInputElement).value) || 10 })} />
						</label>
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">H (px)</span>
							<input type="number" min="10" value={selectedElement.height} class="pos-input"
								oninput={(e) => floorEditor.patchElement(selectedElement!.id, { height: parseInt((e.target as HTMLInputElement).value) || 10 })} />
						</label>
					</div>

					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Rotation — {selectedElement.rotation ?? 0}°
						</span>
						<input type="range" min="-180" max="180" step="15"
							value={selectedElement.rotation ?? 0}
							class="w-full accent-accent"
							oninput={(e) => floorEditor.patchElement(selectedElement!.id, { rotation: parseFloat((e.target as HTMLInputElement).value) || 0 })} />
					</label>

					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Color</span>
						<input type="color" value={selectedElement.color ?? '#374151'} class="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
							oninput={(e) => floorEditor.patchElement(selectedElement!.id, { color: (e.target as HTMLInputElement).value })} />
					</div>

					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Opacity — {Math.round((selectedElement.opacity ?? 0.7) * 100)}%
						</span>
						<input type="range" min="0.05" max="1" step="0.05" value={selectedElement.opacity ?? 0.7} class="w-full accent-accent"
							oninput={(e) => floorEditor.patchElement(selectedElement!.id, { opacity: parseFloat((e.target as HTMLInputElement).value) })} />
					</label>

					<div class="h-px bg-gray-100"></div>

					<button onclick={() => floorEditor.deleteElement(selectedElement!.id)} class="btn-danger w-full text-sm">
						Delete Element
					</button>
				</div>

			{:else}
				<!-- CANVAS SETTINGS (nothing selected) -->
				<div class="p-4 border-b border-gray-100">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Inspector</p>
					<p class="text-sm text-gray-500 mt-0.5">Click a table or element to edit it.</p>
				</div>

				<div class="p-4 flex flex-col gap-4">
					<p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Canvas Settings</p>

					<div class="grid grid-cols-2 gap-2">
						<label class="flex flex-col gap-1.5">
							<span class="text-xs text-gray-500">Width (px)</span>
							<input type="number" min="400" max="3000" step="50"
								value={floorEditor.canvasConfig.width}
								class="pos-input"
								oninput={(e) => floorEditor.setCanvasConfig({ width: parseInt((e.target as HTMLInputElement).value) || 900 })} />
						</label>
						<label class="flex flex-col gap-1.5">
							<span class="text-xs text-gray-500">Height (px)</span>
							<input type="number" min="300" max="3000" step="50"
								value={floorEditor.canvasConfig.height}
								class="pos-input"
								oninput={(e) => floorEditor.setCanvasConfig({ height: parseInt((e.target as HTMLInputElement).value) || 600 })} />
						</label>
					</div>

					<label class="flex flex-col gap-1.5">
						<span class="text-xs text-gray-500">Grid Size (px)</span>
						<input type="number" min="5" max="100" step="5"
							value={floorEditor.canvasConfig.gridSize}
							class="pos-input"
							oninput={(e) => floorEditor.setCanvasConfig({ gridSize: parseInt((e.target as HTMLInputElement).value) || 20 })} />
					</label>

					<div class="border-t border-gray-100 pt-3 text-xs text-gray-400 space-y-1">
						<p>• Drag tables &amp; elements to move</p>
						<p>• Scroll to zoom in/out</p>
						<p>• Middle-click drag to pan</p>
						<p>• <kbd class="bg-gray-100 rounded px-1 font-mono">Del</kbd> deletes selection</p>
						<p>• <kbd class="bg-gray-100 rounded px-1 font-mono">Esc</kbd> deselects</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Chair Editor Modal (portal-style, full-screen overlay) -->
{#if floorEditor.chairModalOpen && chairModalTable}
	<ChairEditorModal table={chairModalTable} />
{/if}
