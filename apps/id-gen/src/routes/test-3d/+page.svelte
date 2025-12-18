<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { NoToneMapping } from 'three';
	import SimpleTexturePlane from '$lib/components/SimpleTexturePlane.svelte';
	import { getSupabaseStorageUrl } from '$lib/utils/storage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Test texture that we know works (square)
	const TEST_URL = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg';

	// ID Card aspect ratio (landscape card 3.5" x 2.25" ≈ 3:2 or ~1.55:1)
	const CARD_WIDTH = 3;
	const CARD_HEIGHT = 2; // 3:2 aspect ratio

	// Get all card URLs
	let cardUrls = $derived(data.cards
		.map((c) => c.front_image)
		.filter((path): path is string => !!path)
		.map((path) => getSupabaseStorageUrl(path, 'rendered-id-cards')));

	// Grid layout config
	const COLUMNS = 4;
	const SPACING = 0.3;

	// Calculate grid position for each card
	function getGridPosition(index: number): { x: number; y: number } {
		const col = index % COLUMNS;
		const row = Math.floor(index / COLUMNS);
		const totalWidth = COLUMNS * (CARD_WIDTH + SPACING) - SPACING;
		const x = col * (CARD_WIDTH + SPACING) - totalWidth / 2 + CARD_WIDTH / 2;
		const y = -row * (CARD_HEIGHT + SPACING);
		return { x, y };
	}
</script>

<svelte:head>
	<title>3D Texture Test - ID Cards</title>
</svelte:head>

<div class="min-h-screen bg-neutral-900 p-6">
	<div class="max-w-6xl mx-auto">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-white">ID Card Texture Test</h1>
			<p class="text-neutral-400 mt-2">
				Test texture (square) + {cardUrls.length} ID cards (3:2 aspect ratio)
			</p>
		</div>

		<div class="w-full h-[600px] bg-black rounded-xl overflow-hidden border border-neutral-700">
			<Canvas toneMapping={NoToneMapping}>
				<T.PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
				<T.AmbientLight intensity={1.5} />

				<!-- Test texture (top-left, square) -->
				<T.Group position={[-6, 3, 0]}>
					<SimpleTexturePlane url={TEST_URL} width={2} height={2} />
				</T.Group>

				<!-- ID Cards Grid -->
				{#each cardUrls as url, i (url)}
					{@const pos = getGridPosition(i)}
					<T.Group position={[pos.x, pos.y, 0]}>
						<SimpleTexturePlane {url} width={CARD_WIDTH} height={CARD_HEIGHT} />
					</T.Group>
				{/each}
			</Canvas>
		</div>

		<div class="mt-4 p-4 bg-neutral-800 rounded-lg text-white">
			<p class="font-semibold">Loaded: {cardUrls.length} ID cards</p>
			<p class="text-sm text-neutral-400 mt-1">
				Grid: {COLUMNS} columns, {CARD_WIDTH}x{CARD_HEIGHT} card size
			</p>
		</div>
	</div>
</div>
