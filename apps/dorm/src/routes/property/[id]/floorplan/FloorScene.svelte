<script lang="ts">
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import { Vector3 } from 'three';
	import { onDestroy } from 'svelte';
	import type { FloorLayoutItem } from './types';
	import { itemsToWallSet, edgesToLines, edgeKey, buildWallMetaMap, type WallStorageItem, type WallMeta, type WallLine } from './wallEngine';
	import { createWallWithOpenings, clearWallGeomCache, type WallOpening } from './wallGeometry';

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

	// ─── Interactive door open/close with tweened animation ──────────────────
	// Tracks which doors are closed. By default all doors render OPEN.
	let closedDoors = $state<Set<string>>(new Set());

	function toggleDoor(doorKey: string) {
		const next = new Set(closedDoors);
		if (next.has(doorKey)) next.delete(doorKey);
		else next.add(doorKey);
		closedDoors = next;
		_anyAnimating = true; // wake up the tween loop
	}

	const OPEN_ANGLE = Math.PI * 0.44; // ~80° swing

	// Tween system: plain objects (not $state) to avoid state_unsafe_mutation.
	// useTask lerps currents toward targets each frame, then bumps a $state
	// tick counter to trigger template re-render.
	const _animTargets = new Map<string, number>();
	const _animCurrents: Record<string, number> = {};
	let _animTick = $state(0);

	/** Returns an animated (tweened) value that smoothly approaches `target`. */
	function animatedVal(key: string, target: number): number {
		_animTargets.set(key, target);
		if (!(key in _animCurrents)) _animCurrents[key] = target;
		void _animTick; // subscribe to tick for re-renders
		return _animCurrents[key];
	}

	let _anyAnimating = false;

	useTask((delta) => {
		if (!_anyAnimating) return; // skip when all doors are at rest
		const speed = 6;
		let stillMoving = false;
		for (const [key, target] of _animTargets) {
			const current = _animCurrents[key] ?? target;
			const diff = target - current;
			if (Math.abs(diff) > 0.001) {
				_animCurrents[key] = current + diff * Math.min(1, speed * delta);
				stillMoving = true;
			} else if (current !== target) {
				_animCurrents[key] = target;
			}
		}
		_anyAnimating = stillMoving;
		if (stillMoving) _animTick++;
	});

	// Dispose cached geometries on component destroy
	onDestroy(() => clearWallGeomCache());

	// ─── Door/Window opening computation ─────────────────────────────────────
	const DOOR_HEIGHT = 2.1; // meters

	function computeOpenings(meta: WallMeta, wallLength: number): WallOpening[] {
		if (meta.door) {
			const doorW = Math.min((meta.doorWidth ?? 80) / 100, wallLength * 0.9);
			return [{ offsetAlongWall: wallLength / 2, width: doorW, bottomY: 0, topY: DOOR_HEIGHT }];
		}
		if (meta.window) {
			const winW = Math.min((meta.windowWidth ?? 100) / 100, wallLength * 0.9);
			const sill = meta.sill ?? 0.9;
			const winH = (meta.windowHeight ?? 120) / 100;
			return [{ offsetAlongWall: wallLength / 2, width: winW, bottomY: sill, topY: Math.min(sill + winH, WALL_3D_HEIGHT) }];
		}
		return [];
	}
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
		{@const openings = computeOpenings(meta, totalLen)}
		{@const wallGeom = createWallWithOpenings(totalLen, WALL_3D_HEIGHT, WALL_3D_THICK, openings)}

		<!-- Wall mesh with proper cutouts via ExtrudeGeometry -->
		{#if isHoriz}
			<T.Mesh
				position.x={line.x1 * CELL}
				position.y={yBase}
				position.z={line.y1 * CELL - WALL_3D_THICK / 2}
				geometry={wallGeom}
			>
				<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
			</T.Mesh>
		{:else}
			<T.Mesh
				position.x={line.x1 * CELL + WALL_3D_THICK / 2}
				position.y={yBase}
				position.z={line.y1 * CELL}
				rotation.y={Math.PI / 2}
				geometry={wallGeom}
			>
				<T.MeshStandardMaterial color={wallColor} roughness={0.85} />
			</T.Mesh>
		{/if}

		<!-- 3D Door models (interactive open/close with tween) -->
		{#if meta.door && openings.length > 0}
			{@const op = openings[0]}
			{@const doorH = op.topY - op.bottomY}
			{@const dType = meta.door}
			{@const DOOR_THICK = 0.04}
			{@const DOOR_COLOR = '#8B6914'}
			{@const DOOR_FRAME_COLOR = '#5C4A1E'}
			{@const FRAME_W = 0.05}
			{@const isOpen = !closedDoors.has(eKey)}
			{@const swingLeft = (meta.swing ?? 'left') === 'left'}
			{@const inward = (meta.openDir ?? 'inward') === 'inward'}

			{#if isHoriz}
				{@const fx = line.x1 * CELL + op.offsetAlongWall}
				{@const fz = line.y1 * CELL}
				{@const doorTarget = isOpen ? -(swingLeft ? 1 : -1) * (inward ? 1 : -1) * OPEN_ANGLE : 0}
				{@const doorAngle = animatedVal(eKey, doorTarget)}

				<!-- Door frame (static — doesn't rotate) -->
				<T.Mesh position.x={fx} position.y={yBase + op.topY + FRAME_W / 2} position.z={fz}>
					<T.BoxGeometry args={[op.width + FRAME_W * 2, FRAME_W, WALL_3D_THICK + 0.02]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>
				<T.Mesh position.x={fx - op.width / 2 - FRAME_W / 2} position.y={yBase + doorH / 2} position.z={fz}>
					<T.BoxGeometry args={[FRAME_W, doorH, WALL_3D_THICK + 0.02]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>
				<T.Mesh position.x={fx + op.width / 2 + FRAME_W / 2} position.y={yBase + doorH / 2} position.z={fz}>
					<T.BoxGeometry args={[FRAME_W, doorH, WALL_3D_THICK + 0.02]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>

				<!-- Door panel(s) — pivot group at hinge edge -->
				{#if dType === 'single' || dType === 'pocket' || dType === 'french'}
					{@const hingeX = swingLeft ? fx - op.width / 2 : fx + op.width / 2}
					{@const panelOff = swingLeft ? (op.width - 0.02) / 2 : -(op.width - 0.02) / 2}
					<T.Group position.x={hingeX} position.y={yBase + doorH / 2} position.z={fz} rotation.y={doorAngle}>
						<T.Mesh position.x={panelOff} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[op.width - 0.02, doorH - 0.02, DOOR_THICK]} />
							<T.MeshStandardMaterial
								color={dType === 'french' ? '#93c5fd' : DOOR_COLOR}
								roughness={dType === 'french' ? 0.1 : 0.6}
								transparent={dType === 'french'}
								opacity={dType === 'french' ? 0.4 : 1}
							/>
						</T.Mesh>
						{@const handleOff = swingLeft ? op.width - 0.1 : -(op.width - 0.1)}
						<T.Mesh position.x={handleOff} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02}>
							<T.BoxGeometry args={[0.03, 0.12, 0.04]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
				{:else if dType === 'double' || dType === 'bifold'}
					{@const halfW = op.width / 2 - 0.01}
					{@const leftTarget = isOpen ? -(inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const rightTarget = isOpen ? (inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const leftAngle = animatedVal(`${eKey}-L`, leftTarget)}
					{@const rightAngle = animatedVal(`${eKey}-R`, rightTarget)}
					<!-- Left leaf -->
					<T.Group position.x={fx - op.width / 2} position.y={yBase + doorH / 2} position.z={fz}
						rotation.y={leftAngle}>
						<T.Mesh position.x={halfW / 2} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[halfW, doorH - 0.02, DOOR_THICK]} />
							<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
						</T.Mesh>
						<T.Mesh position.x={halfW - 0.06} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02}>
							<T.BoxGeometry args={[0.03, 0.1, 0.03]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
					<!-- Right leaf -->
					<T.Group position.x={fx + op.width / 2} position.y={yBase + doorH / 2} position.z={fz}
						rotation.y={rightAngle}>
						<T.Mesh position.x={-halfW / 2} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[halfW, doorH - 0.02, DOOR_THICK]} />
							<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
						</T.Mesh>
						<T.Mesh position.x={-(halfW - 0.06)} position.y={-doorH * 0.05} position.z={DOOR_THICK / 2 + 0.02}>
							<T.BoxGeometry args={[0.03, 0.1, 0.03]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
				{:else if dType === 'sliding'}
					{@const slideTarget = isOpen ? op.width * 0.42 : 0}
					{@const slideOff = animatedVal(`${eKey}-slide`, slideTarget)}
					<T.Mesh position.x={fx - op.width * 0.13} position.y={yBase + doorH / 2} position.z={fz - DOOR_THICK / 2}>
						<T.BoxGeometry args={[op.width * 0.55, doorH - 0.02, DOOR_THICK * 0.7]} />
						<T.MeshStandardMaterial color="#7A5C12" roughness={0.6} />
					</T.Mesh>
					<T.Mesh
						position.x={fx + op.width * 0.13 - slideOff}
						position.y={yBase + doorH / 2}
						position.z={fz + DOOR_THICK / 2}
						onclick={() => toggleDoor(eKey)}
					>
						<T.BoxGeometry args={[op.width * 0.55, doorH - 0.02, DOOR_THICK * 0.7]} />
						<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
					</T.Mesh>
				{/if}

			{:else}
				{@const fx = line.x1 * CELL}
				{@const fz = line.y1 * CELL + op.offsetAlongWall}
				{@const doorTarget = isOpen ? (swingLeft ? 1 : -1) * (inward ? 1 : -1) * OPEN_ANGLE : 0}
				{@const doorAngle = animatedVal(eKey, doorTarget)}

				<!-- Door frame (static) -->
				<T.Mesh position.x={fx} position.y={yBase + op.topY + FRAME_W / 2} position.z={fz}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, FRAME_W, op.width + FRAME_W * 2]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>
				<T.Mesh position.x={fx} position.y={yBase + doorH / 2} position.z={fz - op.width / 2 - FRAME_W / 2}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, doorH, FRAME_W]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>
				<T.Mesh position.x={fx} position.y={yBase + doorH / 2} position.z={fz + op.width / 2 + FRAME_W / 2}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.02, doorH, FRAME_W]} />
					<T.MeshStandardMaterial color={DOOR_FRAME_COLOR} roughness={0.7} />
				</T.Mesh>

				<!-- Door panel(s) — pivot group at hinge edge -->
				{#if dType === 'single' || dType === 'pocket' || dType === 'french'}
					{@const hingeZ = swingLeft ? fz - op.width / 2 : fz + op.width / 2}
					{@const panelOff = swingLeft ? (op.width - 0.02) / 2 : -(op.width - 0.02) / 2}
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={hingeZ} rotation.y={doorAngle}>
						<T.Mesh position.z={panelOff} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, op.width - 0.02]} />
							<T.MeshStandardMaterial
								color={dType === 'french' ? '#93c5fd' : DOOR_COLOR}
								roughness={dType === 'french' ? 0.1 : 0.6}
								transparent={dType === 'french'}
								opacity={dType === 'french' ? 0.4 : 1}
							/>
						</T.Mesh>
						{@const handleOff = swingLeft ? op.width - 0.1 : -(op.width - 0.1)}
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={handleOff}>
							<T.BoxGeometry args={[0.04, 0.12, 0.03]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
				{:else if dType === 'double' || dType === 'bifold'}
					{@const halfW = op.width / 2 - 0.01}
					{@const leftTarget = isOpen ? (inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const rightTarget = isOpen ? -(inward ? 1 : -1) * OPEN_ANGLE : 0}
					{@const leftAngle = animatedVal(`${eKey}-L`, leftTarget)}
					{@const rightAngle = animatedVal(`${eKey}-R`, rightTarget)}
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={fz - op.width / 2}
						rotation.y={leftAngle}>
						<T.Mesh position.z={halfW / 2} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, halfW]} />
							<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
						</T.Mesh>
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={halfW - 0.06}>
							<T.BoxGeometry args={[0.03, 0.1, 0.03]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
					<T.Group position.x={fx} position.y={yBase + doorH / 2} position.z={fz + op.width / 2}
						rotation.y={rightAngle}>
						<T.Mesh position.z={-halfW / 2} onclick={() => toggleDoor(eKey)}>
							<T.BoxGeometry args={[DOOR_THICK, doorH - 0.02, halfW]} />
							<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
						</T.Mesh>
						<T.Mesh position.x={DOOR_THICK / 2 + 0.02} position.y={-doorH * 0.05} position.z={-(halfW - 0.06)}>
							<T.BoxGeometry args={[0.03, 0.1, 0.03]} />
							<T.MeshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
						</T.Mesh>
					</T.Group>
				{:else if dType === 'sliding'}
					{@const slideTarget = isOpen ? op.width * 0.42 : 0}
					{@const slideOff = animatedVal(`${eKey}-slide`, slideTarget)}
					<T.Mesh position.x={fx - DOOR_THICK / 2} position.y={yBase + doorH / 2} position.z={fz - op.width * 0.13}>
						<T.BoxGeometry args={[DOOR_THICK * 0.7, doorH - 0.02, op.width * 0.55]} />
						<T.MeshStandardMaterial color="#7A5C12" roughness={0.6} />
					</T.Mesh>
					<T.Mesh
						position.x={fx + DOOR_THICK / 2}
						position.y={yBase + doorH / 2}
						position.z={fz + op.width * 0.13 - slideOff}
						onclick={() => toggleDoor(eKey)}
					>
						<T.BoxGeometry args={[DOOR_THICK * 0.7, doorH - 0.02, op.width * 0.55]} />
						<T.MeshStandardMaterial color={DOOR_COLOR} roughness={0.6} />
					</T.Mesh>
				{/if}
			{/if}
		{/if}

		<!-- 3D Window model (frame + glass + mullions) -->
		{#if meta.window && openings.length > 0}
			{@const op = openings[0]}
			{@const glassH = op.topY - op.bottomY}
			{@const glassCenterY = yBase + (op.bottomY + op.topY) / 2}
			{@const wType = meta.window}
			{@const FRAME_T = 0.04}
			{@const FRAME_COLOR = '#E8E8E8'}
			{@const GLASS_COLOR = '#93c5fd'}

			{#if isHoriz}
				{@const wx = line.x1 * CELL + op.offsetAlongWall}
				{@const wz = line.y1 * CELL}

				<!-- Window frame (4 sides) -->
				<!-- Top rail -->
				<T.Mesh position.x={wx} position.y={yBase + op.topY - FRAME_T / 2} position.z={wz}>
					<T.BoxGeometry args={[op.width, FRAME_T, WALL_3D_THICK * 0.8]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<!-- Bottom rail (sill) -->
				<T.Mesh position.x={wx} position.y={yBase + op.bottomY + FRAME_T / 2} position.z={wz}>
					<T.BoxGeometry args={[op.width + 0.06, FRAME_T, WALL_3D_THICK + 0.04]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<!-- Left stile -->
				<T.Mesh position.x={wx - op.width / 2 + FRAME_T / 2} position.y={glassCenterY} position.z={wz}>
					<T.BoxGeometry args={[FRAME_T, glassH, WALL_3D_THICK * 0.8]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<!-- Right stile -->
				<T.Mesh position.x={wx + op.width / 2 - FRAME_T / 2} position.y={glassCenterY} position.z={wz}>
					<T.BoxGeometry args={[FRAME_T, glassH, WALL_3D_THICK * 0.8]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>

				<!-- Glass pane -->
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
					<T.BoxGeometry args={[op.width - FRAME_T * 2, glassH - FRAME_T * 2, 0.01]} />
					<T.MeshStandardMaterial color={GLASS_COLOR} transparent opacity={0.3} roughness={0.05} metalness={0.1} />
				</T.Mesh>

				<!-- Type-specific mullions -->
				{#if wType === 'fixed'}
					<!-- Cross mullion (horizontal + vertical) -->
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.02, glassH - FRAME_T * 2, 0.03]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[op.width - FRAME_T * 2, 0.02, 0.03]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'sliding'}
					<!-- Vertical center divider -->
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.025, glassH - FRAME_T * 2, 0.03]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'casement'}
					<!-- Vertical center divider (two panes that open) -->
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.025, glassH - FRAME_T * 2, 0.03]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'awning'}
					<!-- Horizontal center divider -->
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[op.width - FRAME_T * 2, 0.025, 0.03]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{/if}
			{:else}
				{@const wx = line.x1 * CELL}
				{@const wz = line.y1 * CELL + op.offsetAlongWall}

				<!-- Window frame (4 sides) - vertical wall -->
				<T.Mesh position.x={wx} position.y={yBase + op.topY - FRAME_T / 2} position.z={wz}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, FRAME_T, op.width]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={yBase + op.bottomY + FRAME_T / 2} position.z={wz}>
					<T.BoxGeometry args={[WALL_3D_THICK + 0.04, FRAME_T, op.width + 0.06]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz - op.width / 2 + FRAME_T / 2}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, glassH, FRAME_T]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz + op.width / 2 - FRAME_T / 2}>
					<T.BoxGeometry args={[WALL_3D_THICK * 0.8, glassH, FRAME_T]} />
					<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
				</T.Mesh>

				<!-- Glass pane -->
				<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
					<T.BoxGeometry args={[0.01, glassH - FRAME_T * 2, op.width - FRAME_T * 2]} />
					<T.MeshStandardMaterial color={GLASS_COLOR} transparent opacity={0.3} roughness={0.05} metalness={0.1} />
				</T.Mesh>

				<!-- Type-specific mullions -->
				{#if wType === 'fixed'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.03, glassH - FRAME_T * 2, 0.02]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.03, 0.02, op.width - FRAME_T * 2]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'sliding'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.03, glassH - FRAME_T * 2, 0.025]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'casement'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.03, glassH - FRAME_T * 2, 0.025]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{:else if wType === 'awning'}
					<T.Mesh position.x={wx} position.y={glassCenterY} position.z={wz}>
						<T.BoxGeometry args={[0.03, 0.025, op.width - FRAME_T * 2]} />
						<T.MeshStandardMaterial color={FRAME_COLOR} roughness={0.3} />
					</T.Mesh>
				{/if}
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
