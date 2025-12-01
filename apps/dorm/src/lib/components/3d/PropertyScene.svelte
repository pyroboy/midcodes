<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { OrbitControls, Float } from '@threlte/extras';
	import RentalUnitBlock from './RentalUnitBlock.svelte';

	let { floors, rentalUnits } = $props();

	// Rotation animation
	let rotation = 0;
	useTask((delta) => {
		// Slow rotation
		// rotation += delta * 0.05;
	});

	// Simple Grid Layout Calculator
	function getLayout(floorId: number) {
		const unitsOnFloor = rentalUnits.filter((u: any) => u.floor_id === floorId);
		// Sort by unit number for logical ordering
		unitsOnFloor.sort((a: any, b: any) => a.number - b.number);

		const cols = 4; // Max units per row
		const spacingX = 4;
		const spacingZ = 4;

		return unitsOnFloor.map((unit: any, index: number) => ({
			...unit,
			x: (index % cols) * spacingX - (cols * spacingX) / 2 + 2,
			z: Math.floor(index / cols) * spacingZ
		}));
	}
</script>

<T.PerspectiveCamera makeDefault position={[15, 15, 25]} fov={45} lookAt={[0, 5, 0]}>
	<OrbitControls
		enableDamping
		autoRotate={true}
		autoRotateSpeed={0.5}
		maxPolarAngle={Math.PI / 2 - 0.1}
	/>
</T.PerspectiveCamera>

<!-- Lighting -->
<T.DirectionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
<T.DirectionalLight position={[-10, 10, -10]} intensity={0.5} />
<T.AmbientLight intensity={0.6} />

<!-- Floor Hierarchy -->
<T.Group position={[0, -5, 0]}>
	{#each floors as floor, i}
		<!-- Vertical Stacking: Floor height 4 units -->
		<T.Group position={[0, i * 4, 0]}>
			<!-- Floor Base Plate -->
			<T.Mesh position={[0, -0.1, 0]}>
				<T.BoxGeometry args={[20, 0.2, 20]} />
				<T.MeshStandardMaterial color="#334155" />
			</T.Mesh>

			<!-- 3D Text for Floor Number -->
			<!-- We can use basic text geometry or simple blocks for now -->

			<!-- Units on this floor -->
			{#each getLayout(floor.id) as unit}
				<RentalUnitBlock {unit} position={[unit.x, 0.85, unit.z]} />
			{/each}
		</T.Group>
	{/each}
</T.Group>
