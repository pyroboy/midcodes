<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import { Vector3 } from 'three';
	import type { FloorLayoutItem } from './types';
	import { itemsToWallSet, edgesToLines, edgeKey, buildWallMetaMap, type WallStorageItem } from './wallEngine';

	let {
		floors,
		allItems,
		rentalUnits,
		selectedFloorId,
		onUnitClick
	}: {
		floors: any[];
		allItems: FloorLayoutItem[];
		rentalUnits: any[];
		selectedFloorId: string | null;
		onUnitClick: (rentalUnitId: string) => void;
	} = $props();

	interactivity();

	const { camera } = useThrelte();

	// OrbitControls ref for updating target
	let controlsRef = $state<any>(null);

	const CELL = 1;
	const FLOOR_GAP = 5;
	const WALL_HEIGHT = 2.8;
	const WALL_THICK = 0.08;
	const SLAB_THICK = 0.15;
	const FLOOR_THICK = 0.02;
	const SLAB_PAD = 0.5;       // padding around items for the slab

	const WALL_3D_THICK = 0.12;
	const WALL_3D_HEIGHT = 3.0;
	const WALL_3D_COLOR = '#64748b';  // slate-500

	// Items grouped by floor
	let itemsByFloor = $derived.by(() => {
		const map = new Map<string, FloorLayoutItem[]>();
		for (const item of allItems) {
			const list = map.get(item.floor_id) ?? [];
			list.push(item);
			map.set(item.floor_id, list);
		}
		return map;
	});

	// Per-floor bounding box (only floors with items)
	let floorBounds = $derived.by(() => {
		const map = new Map<string, { minX: number; minZ: number; maxX: number; maxZ: number }>();
		for (const [floorId, items] of itemsByFloor) {
			if (items.length === 0) continue;
			let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
			for (const item of items) {
				minX = Math.min(minX, item.grid_x);
				minZ = Math.min(minZ, item.grid_y);
				maxX = Math.max(maxX, item.grid_x + item.grid_w);
				maxZ = Math.max(maxZ, item.grid_y + item.grid_h);
			}
			map.set(floorId, {
				minX: minX * CELL - SLAB_PAD,
				minZ: minZ * CELL - SLAB_PAD,
				maxX: maxX * CELL + SLAB_PAD,
				maxZ: maxZ * CELL + SLAB_PAD
			});
		}
		return map;
	});

	let occupancyMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const unit of rentalUnits) map.set(unit.id, unit.rental_unit_status);
		return map;
	});

	function floorColor(item: FloorLayoutItem): string {
		if (item.item_type !== 'RENTAL_UNIT') {
			const areaColors: Record<string, string> = {
				CORRIDOR: '#e2e8f0',
				BATHROOM: '#cffafe',
				KITCHEN: '#ffedd5',
				COMMON_ROOM: '#ede9fe',
				STAIRWELL: '#fef9c3',
				ELEVATOR: '#fef9c3',
				STORAGE: '#f5f5f4',
				OFFICE: '#dcfce7',
				CUSTOM: '#f1f5f9'
			};
			return item.color || areaColors[item.item_type] || '#f1f5f9';
		}
		if (item.color) return item.color;
		const status = occupancyMap.get(item.rental_unit_id ?? '');
		if (status === 'OCCUPIED') return '#fecaca';
		if (status === 'RESERVED') return '#fef08a';
		return '#bbf7d0';
	}

	// Only render floors that have items placed
	let floorsWithItems = $derived(
		[...floors]
			.filter((f: any) => (itemsByFloor.get(f.id)?.length ?? 0) > 0)
			.sort((a: any, b: any) => a.floor_number - b.floor_number)
	);

	// Compute target center for the selected floor
	let selectedFloorCenter = $derived.by(() => {
		if (!selectedFloorId) return null;
		const bounds = floorBounds.get(selectedFloorId);
		if (!bounds) return null;
		// Find the floor's vertical position
		const floorIdx = floorsWithItems.findIndex((f: any) => f.id === selectedFloorId);
		const yBase = (floorIdx >= 0 ? floorIdx : 0) * FLOOR_GAP;
		return {
			x: (bounds.minX + bounds.maxX) / 2,
			y: yBase + WALL_HEIGHT / 2,
			z: (bounds.minZ + bounds.maxZ) / 2
		};
	});

	// Smooth camera animation to selected floor
	let animating = $state(false);
	$effect(() => {
		const center = selectedFloorCenter;
		if (!center || !controlsRef) return;

		// Animate target + camera position
		const controls = controlsRef;
		const cam = camera.current;
		if (!cam || !controls.target) return;

		const targetPos = new Vector3(center.x, center.y, center.z);
		const startTarget = controls.target.clone();
		const startCam = cam.position.clone();

		// Camera offset from target (keep same viewing angle, just re-center)
		const offset = new Vector3(12, 14, 12);
		const endCam = targetPos.clone().add(offset);

		animating = true;
		const duration = 600; // ms
		const startTime = performance.now();

		function animate() {
			const elapsed = performance.now() - startTime;
			const t = Math.min(elapsed / duration, 1);
			// Ease out cubic
			const ease = 1 - Math.pow(1 - t, 3);

			controls.target.lerpVectors(startTarget, targetPos, ease);
			cam.position.lerpVectors(startCam, endCam, ease);
			controls.update();

			if (t < 1) {
				requestAnimationFrame(animate);
			} else {
				animating = false;
			}
		}
		requestAnimationFrame(animate);
	});
</script>

<T.AmbientLight intensity={0.7} />
<T.DirectionalLight position={[15, 30, 15]} intensity={0.8} />
<T.DirectionalLight position={[-10, 20, -5]} intensity={0.3} />

<T.PerspectiveCamera makeDefault position={[15, 18, 15]} fov={45}>
	<OrbitControls bind:ref={controlsRef} enablePan enableZoom enableDamping />
</T.PerspectiveCamera>

<!-- Only render floors that have items -->
{#each floorsWithItems as floor, floorIndex (floor.id)}
	{@const yBase = floorIndex * FLOOR_GAP}
	{@const floorItems = itemsByFloor.get(floor.id) ?? []}
	{@const isSelected = String(floor.id) === String(selectedFloorId)}
	{@const bounds = floorBounds.get(floor.id)}

	<!-- Floor slab + perimeter walls -->
	{#if bounds}
		{@const slabW = bounds.maxX - bounds.minX}
		{@const slabD = bounds.maxZ - bounds.minZ}
		{@const cx = bounds.minX + slabW / 2}
		{@const cz = bounds.minZ + slabD / 2}

		<!-- Slab -->
		<T.Mesh
			position.x={cx}
			position.y={yBase - SLAB_THICK / 2}
			position.z={cz}
			receiveShadow
		>
			<T.BoxGeometry args={[slabW, SLAB_THICK, slabD]} />
			<T.MeshStandardMaterial
				color={isSelected ? '#dbeafe' : '#e5e7eb'}
				roughness={0.9}
			/>
		</T.Mesh>

	{/if}

	<!-- Wall segments from edge-based wall engine -->
	{@const floorWallItems = floorItems.filter((i) => i.item_type === 'WALL') as unknown as WallStorageItem[]}
	{@const floorWallSet = itemsToWallSet(floorWallItems)}
	{@const floorWallLines = edgesToLines(floorWallSet)}
	{@const floorWallMetaMap = buildWallMetaMap(floorWallItems)}

	{#each floorWallLines as line (`w-${line.x1},${line.y1},${line.x2},${line.y2}`)}
		{@const isHoriz = line.y1 === line.y2}
		{@const totalLen = isHoriz ? (line.x2 - line.x1) * CELL : (line.y2 - line.y1) * CELL}
		{@const eKey = isHoriz
			? edgeKey(Math.min(line.x1, line.x2), line.y1, 'N')
			: edgeKey(line.x1, Math.min(line.y1, line.y2), 'W')}
		{@const meta = floorWallMetaMap.get(eKey) ?? {}}
		{@const wallColor = meta.color ?? WALL_3D_COLOR}
		{@const doorW = CELL * 0.8}
		{@const windowW = CELL * 0.6}

		{#if meta.door && totalLen > doorW}
			<!-- Door: two wall segments flanking a gap -->
			{@const halfLen = (totalLen - doorW) / 2}
			{#if isHoriz}
				{@const startX = line.x1 * CELL}
				{@const z = line.y1 * CELL}
				<!-- Left segment -->
				<T.Mesh
					position.x={startX + halfLen / 2}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={z}
				>
					<T.BoxGeometry args={[halfLen, WALL_3D_HEIGHT, WALL_3D_THICK]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Right segment -->
				<T.Mesh
					position.x={startX + halfLen + doorW + halfLen / 2}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={z}
				>
					<T.BoxGeometry args={[halfLen, WALL_3D_HEIGHT, WALL_3D_THICK]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
			{:else}
				{@const x = line.x1 * CELL}
				{@const startZ = line.y1 * CELL}
				<!-- Top segment -->
				<T.Mesh
					position.x={x}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={startZ + halfLen / 2}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, WALL_3D_HEIGHT, halfLen]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Bottom segment -->
				<T.Mesh
					position.x={x}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={startZ + halfLen + doorW + halfLen / 2}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, WALL_3D_HEIGHT, halfLen]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
			{/if}
		{:else if meta.window && totalLen > windowW}
			<!-- Window: two wall segments + transparent glass pane -->
			{@const flankLen = (totalLen - windowW) / 2}
			{@const glassH = WALL_3D_HEIGHT * 0.6}
			{#if isHoriz}
				{@const startX = line.x1 * CELL}
				{@const z = line.y1 * CELL}
				<!-- Left flank -->
				<T.Mesh
					position.x={startX + flankLen / 2}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={z}
				>
					<T.BoxGeometry args={[flankLen, WALL_3D_HEIGHT, WALL_3D_THICK]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Right flank -->
				<T.Mesh
					position.x={startX + flankLen + windowW + flankLen / 2}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={z}
				>
					<T.BoxGeometry args={[flankLen, WALL_3D_HEIGHT, WALL_3D_THICK]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Glass pane -->
				<T.Mesh
					position.x={startX + flankLen + windowW / 2}
					position.y={yBase + WALL_3D_HEIGHT * 0.55}
					position.z={z}
				>
					<T.BoxGeometry args={[windowW, glassH, 0.02]} />
					<T.MeshStandardMaterial color="#93c5fd" transparent opacity={0.35} roughness={0.1} />
				</T.Mesh>
			{:else}
				{@const x = line.x1 * CELL}
				{@const startZ = line.y1 * CELL}
				<!-- Top flank -->
				<T.Mesh
					position.x={x}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={startZ + flankLen / 2}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, WALL_3D_HEIGHT, flankLen]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Bottom flank -->
				<T.Mesh
					position.x={x}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={startZ + flankLen + windowW + flankLen / 2}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, WALL_3D_HEIGHT, flankLen]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
				<!-- Glass pane -->
				<T.Mesh
					position.x={x}
					position.y={yBase + WALL_3D_HEIGHT * 0.55}
					position.z={startZ + flankLen + windowW / 2}
				>
					<T.BoxGeometry args={[0.02, glassH, windowW]} />
					<T.MeshStandardMaterial color="#93c5fd" transparent opacity={0.35} roughness={0.1} />
				</T.Mesh>
			{/if}
		{:else}
			<!-- Standard wall -->
			{#if isHoriz}
				<T.Mesh
					position.x={(line.x1 + (line.x2 - line.x1) / 2) * CELL}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={line.y1 * CELL}
				>
					<T.BoxGeometry args={[totalLen, WALL_3D_HEIGHT, WALL_3D_THICK]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
			{:else}
				<T.Mesh
					position.x={line.x1 * CELL}
					position.y={yBase + WALL_3D_HEIGHT / 2}
					position.z={(line.y1 + (line.y2 - line.y1) / 2) * CELL}
				>
					<T.BoxGeometry args={[WALL_3D_THICK, WALL_3D_HEIGHT, totalLen]} />
					<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
				</T.Mesh>
			{/if}
		{/if}
	{/each}

	<!-- Room floor tiles (non-wall items only) -->
	{#each floorItems.filter((i) => i.item_type !== 'WALL') as item (item.id)}
		{@const isUnit = item.item_type === 'RENTAL_UNIT'}
		{@const x = item.grid_x * CELL}
		{@const z = item.grid_y * CELL}
		{@const w = item.grid_w * CELL}
		{@const d = item.grid_h * CELL}
		{@const color = floorColor(item)}

		<T.Mesh
			position.x={x + w / 2}
			position.y={yBase + FLOOR_THICK / 2}
			position.z={z + d / 2}
			receiveShadow
			onclick={() => {
				if (isUnit && item.rental_unit_id) onUnitClick(item.rental_unit_id);
			}}
		>
			<T.BoxGeometry args={[w - 0.02, FLOOR_THICK, d - 0.02]} />
			<T.MeshStandardMaterial color={color} roughness={0.7} />
		</T.Mesh>
	{/each}
{/each}
