<script lang="ts">
	import { Canvas } from '@threlte/core';
	import FloorScene from './FloorScene.svelte';
	import type { FloorLayoutItem } from './types';

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
</script>

<div class="w-full h-full rounded-lg overflow-hidden border bg-gradient-to-b from-sky-50 to-sky-100">
	<Canvas>
		<FloorScene
			{floors}
			{allItems}
			{rentalUnits}
			{selectedFloorId}
			{onUnitClick}
		/>
	</Canvas>
</div>
