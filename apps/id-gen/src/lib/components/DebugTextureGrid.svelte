<script lang="ts">
	import { T } from '@threlte/core';
	import DebugTexturePlane from './DebugTexturePlane.svelte';

	// Props
	let {
		urls,
		columns = 4,
		planeSize = 1.5,
		spacing = 0.2,
		yOffset = 4
	} = $props<{
		urls: (string | null)[];
		columns?: number;
		planeSize?: number;
		spacing?: number;
		yOffset?: number;
	}>();

	// Filter out null URLs
	let validUrls = $derived(urls.filter((u: string | null): u is string => u !== null));

	// Calculate grid positions
	function getGridPosition(index: number): { x: number; y: number } {
		const col = index % columns;
		const row = Math.floor(index / columns);
		const totalWidth = columns * (planeSize + spacing) - spacing;
		const x = col * (planeSize + spacing) - totalWidth / 2 + planeSize / 2;
		const y = yOffset - row * (planeSize * 0.67 + spacing); // 0.67 for card aspect ratio
		return { x, y };
	}

	// Card dimensions
	const planeHeight = $derived(planeSize * 0.67);
</script>

<!-- Debug Grid of Texture Planes -->
<T.Group>
	{#each validUrls.slice(0, 12) as url, i (url)}
		{@const pos = getGridPosition(i)}
		<DebugTexturePlane {url} x={pos.x} y={pos.y} width={planeSize} height={planeHeight} />
	{/each}
</T.Group>
