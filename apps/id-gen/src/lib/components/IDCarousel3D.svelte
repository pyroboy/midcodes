<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { spring } from 'svelte/motion';
	import * as THREE from 'three';
	import { onDestroy, onMount } from 'svelte';

	// Enable texture caching
	THREE.Cache.enabled = true;
	import { browser } from '$app/environment';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import IDCarouselCard3D from './IDCarouselCard3D.svelte';

	// Types
	interface IDCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}

	// Props
	let {
		cards = [],
		onCardClick = () => {}
	}: {
		cards: IDCard[];
		onCardClick?: (card: IDCard) => void;
	} = $props();

	// State
	let currentIndex = $state(0);
	// Spring animation for natural physics-based motion
	let animatedIndex = spring(0, { stiffness: 0.12, damping: 0.5 });

	// Velocity tracking for inertia
	let velocity = 0;
	let lastPointerX = 0;
	let lastPointerTime = 0;

	$effect(() => {
		animatedIndex.set(currentIndex);
	});

	// Preload Manager
	// Automatically fetch next 20 textures into cache
	$effect(() => {
		const preloadRange = 20; // Lookahead
		const loaded = new Set();

		// Preload active zone + forward lookahead
		for (let i = -5; i <= preloadRange; i++) {
			const idx = currentIndex + i;
			if (idx >= 0 && idx < cards.length) {
				const url = getImageUrl(cards[idx]);
				if (url && !loaded.has(url)) {
					// Use raw loader to populate THREE.Cache
					// We don't need the result here, just the cache side-effect
					const loader = new THREE.TextureLoader();
					loader.setCrossOrigin('anonymous');
					loader.load(url);
					loaded.add(url);
				}
			}
		}
	});

	// Drag
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragOffset = $state(0);

	// Config
	const CARD_WIDTH = 3.6;
	const CARD_HEIGHT = 2.4;
	const CARD_SPACING = 2.8;
	const CENTER_SCALE = 1.4;
	const SIDE_SCALE = 0.8;
	const SIDE_TILT = 0.5;
	const VISIBLE_COUNT = 5;
	const CORNER_RADIUS = 0.15;

	function goTo(index: number) {
		currentIndex = Math.max(0, Math.min(cards.length - 1, index));
	}
	function next() {
		goTo(currentIndex + 1);
	}
	function prev() {
		goTo(currentIndex - 1);
	}

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragOffset = 0;
		velocity = 0;
		lastPointerX = e.clientX;
		lastPointerTime = performance.now();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		const now = performance.now();
		const dt = now - lastPointerTime;
		if (dt > 0) {
			const dx = lastPointerX - e.clientX;
			velocity = (dx / dt) * 8;
		}
		lastPointerX = e.clientX;
		lastPointerTime = now;

		dragOffset = (dragStartX - e.clientX) / 150;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;

		const INERTIA_THRESHOLD = 0.8;
		let movement = Math.round(dragOffset);

		if (Math.abs(velocity) > INERTIA_THRESHOLD && movement === 0) {
			movement = Math.sign(velocity);
		}

		// CAMP MOVEMENT: Prevent massive jumps that cause texture loading spikes/hangs
		// Limit to +/- 10 cards per swipe
		const rawMovement = movement;
		movement = Math.max(-10, Math.min(10, movement));

		if (movement !== 0) goTo(currentIndex + movement);
		dragOffset = 0;
		velocity = 0;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		if (wheelTimeout) return;

		if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
			const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
			goTo(currentIndex + Math.sign(delta));
			wheelTimeout = setTimeout(() => {
				wheelTimeout = null;
			}, 150);
		}
	}

	// Calculate visible indices including pre-fetch buffer
	// We want to render visible cards + 2-3 extra on sides
	let visibleIndices = $derived.by(() => {
		const half = 20; // Increased buffer as requested to preventing unloading geometries during fast scroll
		const result: number[] = [];
		for (let i = -half; i <= half; i++) {
			const idx = currentIndex + i;
			if (idx >= 0 && idx < cards.length) {
				result.push(idx);
			}
		}
		return result;
	});

	function getImageUrl(card: IDCard): string | null {
		if (!card.front_image) return null;
		return getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
	}

	const DEPTH_FACTOR = 1.0;

	function getCardTransform(cardIndex: number) {
		const effectiveIndex = $animatedIndex + dragOffset;
		const offset = cardIndex - effectiveIndex;
		const x = offset * CARD_SPACING;
		const z = -Math.abs(offset) * DEPTH_FACTOR;
		let rotY = 0;
		if (offset < -0.1) rotY = SIDE_TILT;
		else if (offset > 0.1) rotY = -SIDE_TILT;
		const distFromCenter = Math.abs(offset);
		const scale =
			distFromCenter < 0.3
				? CENTER_SCALE
				: Math.max(SIDE_SCALE, CENTER_SCALE - distFromCenter * 0.35);
		const opacity = Math.max(0.4, 1 - distFromCenter * 0.25);
		return { x, z, rotY, scale, opacity, distFromCenter };
	}

	// Geometry (Shared)
	function createRoundedRectShape(width: number, height: number, radius: number) {
		const shape = new THREE.Shape();
		const x = -width / 2;
		const y = -height / 2;
		shape.moveTo(x + radius, y);
		shape.lineTo(x + width - radius, y);
		shape.quadraticCurveTo(x + width, y, x + width, y + radius);
		shape.lineTo(x + width, y + height - radius);
		shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		shape.lineTo(x + radius, y + height);
		shape.quadraticCurveTo(x, y + height, x, y + height - radius);
		shape.lineTo(x, y + radius);
		shape.quadraticCurveTo(x, y, x + radius, y);
		return shape;
	}

	function fixUVs(geometry: THREE.BufferGeometry, width: number, height: number) {
		const pos = geometry.attributes.position;
		const uv = geometry.attributes.uv;
		const count = pos.count;
		for (let i = 0; i < count; i++) {
			const x = pos.getX(i);
			const y = pos.getY(i);
			const u = (x + width / 2) / width;
			const v = (y + height / 2) / height;
			uv.setXY(i, u, v);
		}
		uv.needsUpdate = true;
		return geometry;
	}

	const cardShape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
	const cardGeometry = fixUVs(new THREE.ShapeGeometry(cardShape), CARD_WIDTH, CARD_HEIGHT);
	const borderShape = createRoundedRectShape(
		CARD_WIDTH + 0.08,
		CARD_HEIGHT + 0.08,
		CORNER_RADIUS + 0.02
	);
	const borderGeometry = fixUVs(
		new THREE.ShapeGeometry(borderShape),
		CARD_WIDTH + 0.08,
		CARD_HEIGHT + 0.08
	);

	onDestroy(() => {
		if (wheelTimeout) clearTimeout(wheelTimeout);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="relative w-full h-[380px] sm:h-[440px] md:h-[500px] lg:h-[550px] cursor-grab active:cursor-grabbing select-none overflow-hidden"
	style="touch-action: pan-y;"
	role="application"
	aria-roledescription="3D card carousel"
	tabindex="0"
	onkeydown={handleKeydown}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onwheel={handleWheel}
>
	<Canvas>
		<T.PerspectiveCamera makeDefault position={[0, 0, 9]} fov={50} />
		<T.AmbientLight intensity={1.2} />
		<T.DirectionalLight position={[4, 4, 6]} intensity={0.7} />

		{#each visibleIndices as cardIndex (cardIndex)}
			{@const card = cards[cardIndex]}
			{@const transform = getCardTransform(cardIndex)}

			<!-- Use new component - texture handling is isolated here -->
			<IDCarouselCard3D
				url={getImageUrl(card)}
				{card}
				geometry={cardGeometry}
				{borderGeometry}
				{transform}
				{onCardClick}
				{isDragging}
			/>
		{/each}
	</Canvas>

	<!-- Nav Buttons -->
	<button
		type="button"
		class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-background/95 border border-border shadow-xl hover:bg-accent transition-all disabled:opacity-30 z-10"
		onclick={prev}
		disabled={currentIndex === 0}
		aria-label="Previous"
	>
		<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
			></path>
		</svg>
	</button>

	<button
		type="button"
		class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-background/95 border border-border shadow-xl hover:bg-accent transition-all disabled:opacity-30 z-10"
		onclick={next}
		disabled={currentIndex === cards.length - 1}
		aria-label="Next"
	>
		<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
		</svg>
	</button>

	<!-- Dot indicators -->
	<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
		{#each cards.slice(0, 8) as _, i}
			<button
				type="button"
				class="w-2.5 h-2.5 rounded-full transition-all duration-300 {i === currentIndex
					? 'bg-primary w-6'
					: 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}"
				onclick={() => goTo(i)}
				aria-label="Go to card {i + 1}"
			></button>
		{/each}
		{#if cards.length > 8}
			<span class="text-xs text-muted-foreground ml-1">+{cards.length - 8}</span>
		{/if}
	</div>
</div>
