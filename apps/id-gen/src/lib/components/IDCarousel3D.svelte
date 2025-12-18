<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { spring } from 'svelte/motion';
	import * as THREE from 'three';
	import { NoToneMapping } from 'three';
	import { onDestroy } from 'svelte';
	import { getSupabaseStorageUrl } from '$lib/utils/storage';
	import Carousel3DItem from './Carousel3DItem.svelte';

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
		viewMode = 'carousel',
		columns = 4,
		onCardClick = () => {}
	}: {
		cards: IDCard[];
		viewMode?: 'carousel' | 'grid' | 'list';
		columns?: number;
		onCardClick?: (card: IDCard) => void;
	} = $props();

	// State
	let currentIndex = $state(0);
	// Spring animation for natural physics-based motion
	let animatedIndex = spring(0, { stiffness: 0.12, damping: 0.5 });
	// Camera position spring
	let cameraZ = spring(12, { stiffness: 0.05, damping: 0.5 });
	let cameraY = spring(0, { stiffness: 0.05, damping: 0.5 });
	// Elastic grid horizontal bounce
	let gridSpringX = spring(0, { stiffness: 0.1, damping: 0.4 });
	// Elastic grid vertical tilt (for scroll)
	let gridSpringY = spring(0, { stiffness: 0.1, damping: 0.4 });

	// Native Scroll State
	let scrollTop = $state(0);
	let lastScrollTop = 0;
	const ROW_HEIGHT_PIXELS = 180; // Pixels of scroll = 1 row in 3D

	// Velocity tracking for inertia
	let velocity = 0;
	let lastPointerX = 0;
	let lastPointerY = 0;
	let lastPointerTime = 0;

	// Pinch to zoom state
	let initialPinchDist = 0;
	let initialCameraZ = 0;
	let initialColumns = 0;
	let isPinching = false;
	
	// Touch drag state for grid elastic drag
	let touchStartX = 0;
	let touchStartY = 0;
	let lastTouchY = 0;
	
	// Scroll container ref for programmatic scroll
	let scrollContainerRef: HTMLElement | null = null;
	
	// Container width for dynamic card scaling (bigger screen = bigger cards)
	let containerWidth = $state(400); // Default mobile width
	
	// DEBUG: Adjustable target card width (temporary)
	let debugTargetCardWidth = $state(400);
	let debugManualOverride = $state(false); // When true, slider value is used instead of computed

	// Keep animatedIndex in sync with currentIndex
	// Note: This is the minimal $effect needed for spring animation sync
	$effect(() => {
		animatedIndex.set(currentIndex);
	});

	// Update camera based on view mode and container width
	$effect(() => {
		if (viewMode === 'grid') {
			// Card sizing with linear interpolation based on container width:
			// Derived from user testing:
			// - 333px → 0.80 multiplier
			// - 765px → 1.02 multiplier  
			// - 1487px → 1.62 multiplier (adjusted down for 3-col desktop)
			// Formula: multiplier = 0.5 + containerWidth * 0.00075
			const multiplier = 0.5 + containerWidth * 0.00075;
			let computedWidth = (containerWidth / columns) * multiplier;
			
			// Cap max card size for 3 columns to avoid oversized cards on large screens
			if (columns === 3 && computedWidth > 550) {
				computedWidth = 650;
			}
			
			// Use manual slider value if override is on, otherwise use computed
			const targetCardWidth = debugManualOverride ? debugTargetCardWidth : computedWidth;
			if (!debugManualOverride) {
				debugTargetCardWidth = Math.round(computedWidth);
			}
			
			// Calculate camera Z so 3D card (3.6 units) appears as targetCardWidth pixels
			const fovRadians = (50 * Math.PI) / 180;
			const desiredVisibleWidth = (3.6 * containerWidth) / targetCardWidth;
			const targetZ = desiredVisibleWidth / (2 * Math.tan(fovRadians / 2));
			
			// Clamp to reasonable range
			cameraZ.set(Math.max(5, Math.min(50, targetZ)));
			cameraY.set(0);
		} else {
			// Carousel mode: bring camera closer so center card fills the canvas height
			cameraZ.set(6);
			cameraY.set(0);
			gridSpringX.set(0); // Reset grid spring
		}
	});

	// Reset scroll position when columns change to maintain proper positioning
	$effect(() => {
		// Track columns change
		const _cols = columns;
		if (viewMode === 'grid' && scrollContainerRef) {
			// Reset scroll to top when column count changes
			scrollContainerRef.scrollTop = 0;
			scrollTop = 0;
			lastScrollTop = 0;
		}
	});

	// Track container width for dynamic card scaling
	$effect(() => {
		if (!scrollContainerRef) return;
		
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});
		
		observer.observe(scrollContainerRef);
		containerWidth = scrollContainerRef.clientWidth;
		
		return () => observer.disconnect();
	});

	// Config (Carousel)
	const CARD_WIDTH = 3.6;
	const CARD_HEIGHT = 2.4;
	const CARD_SPACING = 3.5;
	const CENTER_SCALE = 2.0;
	const SIDE_SCALE = 1.1;
	const SIDE_TILT = 0.5;
	const VISIBLE_COUNT = 5;
	const CORNER_RADIUS = 0.15;

	// Config (Grid)
	const GRID_SPACING_X = 3.8; // Tighter horizontal spacing for cards to fill width
	const GRID_SPACING_Y = 2.8; // Reduced row spacing for tighter layout
	
	// Dynamic PAGE_SIZE = columns * 4 rows
	let pageSize = $derived(columns * 4);
	
	// Total rows (approx)
	let totalRows = $derived(Math.ceil(cards.length / columns));
	// Visible rows in viewport (container is ~500px, each row takes ~150px visually)
	const VISIBLE_ROWS = 3;
	// Phantom scroll height = only scroll for rows beyond visible, plus container height
	// scrollableRows * rowHeight + container buffer
	let scrollHeight = $derived(Math.max(0, totalRows - VISIBLE_ROWS) * ROW_HEIGHT_PIXELS + 100);

	function goTo(index: number) {
		currentIndex = Math.max(0, Math.min(cards.length - 1, index));
	}
	function next() {
		// In continuous grid mode, next/prev might jump by a "page" worth or just a row
		// Let's keep page-like jumps for buttons
		if (viewMode === 'grid') {
			goTo(currentIndex + pageSize);
		} else {
			goTo(currentIndex + 1);
		}
	}
	function prev() {
		if (viewMode === 'grid') {
			goTo(currentIndex - pageSize);
		} else {
			goTo(currentIndex - 1);
		}
	}

	// Hold-to-scroll state
	let holdInterval: ReturnType<typeof setInterval> | null = null;
	let holdSpeed = 150; // Initial speed (ms between scrolls)
	let minHoldSpeed = 50; // Fastest speed when holding

	// Hold-to-scroll handlers
	function startHolding(direction: 'prev' | 'next') {
		if (holdInterval) return;
		
		const move = direction === 'next' ? next : prev;
		move(); // Immediate first move
		
		let speed = holdSpeed;
		const accelerate = () => {
			move();
			speed = Math.max(minHoldSpeed, speed - 10); // Accelerate
			holdInterval = setTimeout(accelerate, speed);
		};
		holdInterval = setTimeout(accelerate, speed);
	}

	function stopHolding() {
		if (holdInterval) {
			clearTimeout(holdInterval);
			holdInterval = null;
		}
	}

	function handleScroll(e: Event) {
		if (viewMode !== 'grid') return;
		const target = e.currentTarget as HTMLElement;
		const newScrollTop = target.scrollTop;
		
		// Calculate scroll velocity for vertical tilt effect
		const scrollDelta = newScrollTop - lastScrollTop;
		// Apply velocity to spring - high sensitivity for reactive tilt
		const scrollVelocityFactor = 0.15;
		gridSpringY.set(scrollDelta * scrollVelocityFactor, { hard: true });
		// Schedule bounce back to neutral (longer delay for visible effect)
		setTimeout(() => gridSpringY.set(0), 150);
		
		lastScrollTop = newScrollTop;
		scrollTop = newScrollTop;
	}

	// Drag
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragOffset = $state(0);
	
	// ... hold handlers ...

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragOffset = 0;
		velocity = 0;
		lastPointerX = e.clientX;
		lastPointerY = e.clientY;
		lastPointerTime = performance.now();
		
		// Only capture pointer in carousel mode - grid mode uses native scroll
		if (viewMode !== 'grid') {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || isPinching) return;

		const now = performance.now();
		const dt = now - lastPointerTime;
		
		if (viewMode === 'grid') {
			// Grid mode: elastic horizontal drag effect only
			const deltaX = e.clientX - dragStartX;
			// Very low sensitivity for subtle elastic effect
			const elasticFactor = 0.08;
			gridSpringX.set(deltaX * elasticFactor, { hard: true });
			// Note: vertical scroll handled by native scroll (overflow-y-auto)
		} else {
			// Carousel mode: horizontal drag to navigate cards
			const deltaX = e.clientX - lastPointerX;
			const DRAG_SENSITIVITY = 100; // pixels per card
			
			// Update drag offset (negative because drag left = next card)
			dragOffset -= deltaX / DRAG_SENSITIVITY;
			
			// Track velocity for inertia
			if (dt > 0) {
				velocity = -deltaX / dt;
			}
		}
		
		lastPointerX = e.clientX;
		lastPointerY = e.clientY;
		lastPointerTime = now;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		
		// Only release capture in carousel mode (where it was set)
		if (viewMode !== 'grid') {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		}

		if (viewMode === 'grid') {
			// Bounce back horizontally
			gridSpringX.set(0);
			return;
		}

		const INERTIA_THRESHOLD = 0.8;
		let movement = Math.round(dragOffset);

		if (Math.abs(velocity) > INERTIA_THRESHOLD && movement === 0) {
			movement = Math.sign(velocity);
		}

		// CAMP MOVEMENT
		const rawMovement = movement;
		movement = Math.max(-10, Math.min(10, movement));

		if (movement !== 0) goTo(currentIndex + movement);
		dragOffset = 0;
		velocity = 0;
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			// Pinch gesture - to change columns
			isPinching = true;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			initialPinchDist = Math.sqrt(dx * dx + dy * dy);
			initialColumns = columns;
			initialCameraZ = $cameraZ;
		} else if (e.touches.length === 1 && viewMode === 'grid') {
			// Single touch - for elastic drag and vertical scroll
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
			lastTouchY = e.touches[0].clientY;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (isPinching && e.touches.length === 2 && viewMode === 'grid') {
			// Pinch to change columns
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			
			// Map pinch distance change to column adjustment
			// Pinch in (smaller dist) = more columns, pinch out = fewer columns
			const ratio = initialPinchDist / dist;
			// Scale to column range: pinch in doubles = +4 cols, pinch out halves = -4 cols
			const colDelta = Math.round((ratio - 1) * 4);
			const newColumns = Math.max(2, Math.min(8, initialColumns + colDelta));
			
			if (newColumns !== columns) {
				// Dispatch event to parent to update columns
				const event = new CustomEvent('columnschange', { detail: { columns: newColumns } });
				document.dispatchEvent(event);
			}
		} else if (!isPinching && e.touches.length === 1 && viewMode === 'grid') {
			const currentX = e.touches[0].clientX;
			const currentY = e.touches[0].clientY;
			
			// Horizontal: subtle elastic effect (face tilt)
			const deltaX = currentX - touchStartX;
			const elasticFactor = 0.08;
			gridSpringX.set(deltaX * elasticFactor, { hard: true });
			
			// Vertical: programmatic scroll + face tilt
			const deltaY = lastTouchY - currentY; // Positive = scroll down
			if (scrollContainerRef) {
				scrollContainerRef.scrollTop += deltaY;
			}
			
			// Apply vertical tilt based on scroll velocity - high sensitivity for reactive tilt
			const scrollVelocityFactor = 0.15;
			gridSpringY.set(deltaY * scrollVelocityFactor, { hard: true });
			
			lastTouchY = currentY;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (isPinching && e.touches.length < 2) {
			isPinching = false;
		}
		
		if (viewMode === 'grid') {
			// Bounce back both horizontal and vertical tilt with spring animation
			gridSpringX.set(0);
			gridSpringY.set(0);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleWheel(e: WheelEvent) {
		// In grid mode, let native scroll handle it unless it's a pinch
		if (viewMode === 'grid') {
			if (e.ctrlKey) {
				e.preventDefault();
				const zoomDelta = e.deltaY * 0.05;
				const newZ = Math.min(30, Math.max(5, $cameraZ + zoomDelta));
				cameraZ.set(newZ);
			}
			return;
		}

		e.preventDefault();
		if (wheelTimeout) return; // Debounce

		// In grid mode allow generic scrolling
		// If pinch-to-zoom on trackpad (ctrlKey often set)
		if (e.ctrlKey) {
			// Zoom logic
			const zoomDelta = e.deltaY * 0.05;
			const newZ = Math.min(30, Math.max(5, $cameraZ + zoomDelta));
			cameraZ.set(newZ);
			return;
		}

		if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
			const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
			goTo(currentIndex + Math.sign(delta));
			
			wheelTimeout = setTimeout(() => {
				wheelTimeout = null;
			}, 50); // Fast response
		}
	}

	// Calculate visible indices
	let visibleIndices = $derived.by(() => {
		const result: number[] = [];
		
		if (viewMode === 'grid') {
			// Sync currentIndex purely for valid calculation reference, though we use scrollTop mostly
			// We calculate a "virtual" currentIndex based on scrollTop
			const scrollRow = scrollTop / ROW_HEIGHT_PIXELS;
			const virtualIndex = scrollRow * columns;

			// Window buffer
			const buffer = columns * 6; // ~6 rows buffer
			const start = Math.max(0, Math.floor(virtualIndex - buffer));
			const end = Math.min(cards.length, Math.ceil(virtualIndex + buffer));

			for (let i = start; i < end; i++) {
				result.push(i);
			}
		} else {
// ...
			const half = 20;
			for (let i = -half; i <= half; i++) {
				const idx = currentIndex + i;
				if (idx >= 0 && idx < cards.length) {
					result.push(idx);
				}
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
		let x, z, rotY, scale, opacity, distFromCenter;

		if (viewMode === 'grid') {
			// Grid Layout Calculation
			// Center the grid based on current page
			const ps = pageSize;
			const pageStart = Math.floor(currentIndex / ps) * ps;
			const indexInPage = cardIndex - pageStart;
			
			const col = indexInPage % columns;
			const totalRow = Math.floor(indexInPage / columns);
			
			// Center grid: (cols * spacing) / 2
			const gridWidth = columns * GRID_SPACING_X;
			const gridHeight = 3 * GRID_SPACING_Y; // Assume 3 rows visible
			
			// Cards stay in fixed positions (no horizontal movement from drag)
			x = (col * GRID_SPACING_X) - (gridWidth / 2) + (GRID_SPACING_X / 2);

			// Center vertically relative to camera
			// Calculate scroll offset based on scrollTop
			// The grid is centered at 0,0,0
			// We shift the entire grid UP as we scroll DOWN
			
			const scrollRow = scrollTop / ROW_HEIGHT_PIXELS;
				
			// We position relative to the "Top" of the grid minus the scroll offset
			// Row 0 should be at the top when scrollTop is 0
			// 
			// Let's assume camera is at Y=0 looking at center.
			// At scroll 0, we want row 0 to be near top of screen.
			// 
			// Let's start row 0 at some positive Y offset.
			const topY = 10; // Simple offset to bring row 0 into view
			
			const relativeRow = totalRow; 
			
			// y = top - (row * spacing) + (scrollTopConverted)
			// Actually we can just map row directly relative to scrollRow
			
			const effectiveRow = totalRow - scrollRow;
			// For 3D: positive Y is UP.
			// So row 0 is high up. Row 1 is lower.
			// As we scroll (scrollTop increases), scrollRow increases, effectiveRow decreases?
			// No. As we scroll down, we want to see lower rows.
			// So row 10 should move UP into view.
			
			// If scrollRow = 0, row 0 is at topY.
			// If scrollRow = 10, row 10 is at topY.
			// So Y = topY - (row - scrollRow) * spacing
			
			// Offset to position first row at top of visible area (not cut off)
			// Dynamic offset based on camera distance - more columns = camera further back = need more offset
			// Base offset 1.4 works for 3 columns (camera ~12), scale proportionally
			const baseCameraZ = 12;
			const cameraRatio = $cameraZ / baseCameraZ;
			const visibleRowOffset = 1.2 * cameraRatio;
			const y = (visibleRowOffset - (totalRow - scrollRow)) * GRID_SPACING_Y;
			
			z = 0;
			// Face tilt based on drag/scroll - cards rotate to face direction
			// Clamp to maximum tilt angle
			const maxTiltRad = 0.2324;
			
			// Horizontal: rotY from horizontal drag
			const rawTiltY = $gridSpringX * 0.5;
			rotY = Math.max(-maxTiltRad, Math.min(maxTiltRad, rawTiltY));
			
			// Vertical: rotX from scroll velocity
			const rawTiltX = $gridSpringY * 0.5;
			const rotX = Math.max(-maxTiltRad, Math.min(maxTiltRad, rawTiltX));
			
			scale = 1.0;
			opacity = 1;
			distFromCenter = 0;

			return { x, z, rotY, rotX, scale, opacity, distFromCenter, y };
		} else {
			// Carousel Layout Calculation
			const effectiveIndex = $animatedIndex + dragOffset;
			const offset = cardIndex - effectiveIndex;
			x = offset * CARD_SPACING;
			z = -Math.abs(offset) * DEPTH_FACTOR;
			rotY = 0;
			if (offset < -0.1) rotY = SIDE_TILT;
			else if (offset > 0.1) rotY = -SIDE_TILT;
			distFromCenter = Math.abs(offset);
			scale =
				distFromCenter < 0.3
					? CENTER_SCALE
					: Math.max(SIDE_SCALE, CENTER_SCALE - distFromCenter * 0.35);
			opacity = Math.max(0.4, 1 - distFromCenter * 0.25);
			
			return { x, z, rotY, rotX: 0, scale, opacity, distFromCenter, y: 0 };
		}
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
		if (holdInterval) clearTimeout(holdInterval);
	});

	// Carousel container height based on center card dimensions - compact fit
	const carouselHeight = Math.round(CARD_HEIGHT * CENTER_SCALE * 35 + 40);
</script>

<!-- DEBUG PANEL - HIDDEN (set to true to show) -->
{#if false && viewMode === 'grid'}
<div class="bg-yellow-100 dark:bg-yellow-900 p-3 mb-2 rounded text-sm space-y-2">
	<div class="font-bold">DEBUG: Card Sizing</div>
	<div class="grid grid-cols-2 gap-2 text-xs">
		<div>Container Width: <span class="font-mono">{containerWidth}px</span></div>
		<div>Camera Z: <span class="font-mono">{$cameraZ.toFixed(2)}</span></div>
		<div>Columns: <span class="font-mono">{columns}</span></div>
		<div>Target Card Width: <span class="font-mono">{debugTargetCardWidth}px</span></div>
		<div>Mode: <span class="font-mono">{containerWidth < 768 ? 'Mobile' : 'Desktop'}</span></div>
		<div>Override: <span class="font-mono">{debugManualOverride ? 'ON' : 'OFF'}</span></div>
	</div>
	<div class="flex items-center gap-2">
		<input type="checkbox" id="debug-override" bind:checked={debugManualOverride} />
		<label for="debug-override" class="text-xs">Manual Override</label>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-xs">Target Card Width:</span>
		<input type="range" min="50" max="800" bind:value={debugTargetCardWidth} class="flex-1" disabled={!debugManualOverride} />
		<span class="font-mono text-xs w-16">{debugTargetCardWidth}px</span>
	</div>
	<div class="text-xs text-gray-600">
		Computed: {columns} cards × {debugTargetCardWidth}px = {columns * debugTargetCardWidth}px (container: {containerWidth}px)
	</div>
</div>
{/if}

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div 
	bind:this={scrollContainerRef}
	class="relative w-full select-none h-[180px] sm:h-[200px] md:h-[240px] lg:h-[280px] xl:h-[320px] {viewMode === 'grid' ? 'overflow-y-auto overflow-x-hidden !h-[380px] sm:!h-[480px] md:!h-[580px] lg:!h-[700px] xl:!h-[800px]' : 'overflow-hidden'}"
	role="application"
	aria-roledescription="3D card carousel"
	onscroll={handleScroll}
>
	<!-- Sticky 3D Wrapper -->
	<div
		class="sticky top-0 left-0 w-full h-full z-10 outline-none"
		style="touch-action: {viewMode === 'grid' ? 'pan-y' : 'none'};"
		tabindex="0"
		role="application"
		aria-roledescription="3D card viewer"
		onkeydown={handleKeydown}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onwheel={handleWheel}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	>


	<Canvas toneMapping={NoToneMapping}>
		<T.PerspectiveCamera makeDefault position={[0, $cameraY, $cameraZ]} fov={50} />
		<T.AmbientLight intensity={1.2} />
		<T.DirectionalLight position={[4, 4, 6]} intensity={0.7} />



		{#each visibleIndices as cardIndex (cardIndex)}
			{@const card = cards[cardIndex]}
			{@const transform = getCardTransform(cardIndex)}

			<!-- Use new component - texture handling is isolated here -->
			<Carousel3DItem
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
	{#if viewMode !== 'grid'}
	<button
		type="button"
		class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-background/95 border border-border shadow-xl hover:bg-accent transition-all disabled:opacity-30 z-10"
		onmousedown={() => startHolding('prev')}
		onmouseup={stopHolding}
		onmouseleave={stopHolding}
		ontouchstart={() => startHolding('prev')}
		ontouchend={stopHolding}
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
		onmousedown={() => startHolding('next')}
		onmouseup={stopHolding}
		onmouseleave={stopHolding}
		ontouchstart={() => startHolding('next')}
		ontouchend={stopHolding}
		disabled={currentIndex === cards.length - 1}
		aria-label="Next"
	>
		<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
		</svg>
	</button>
	{/if}

	<!-- Dot indicators -->
	{#if viewMode !== 'grid'}
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
	{/if}
	</div>

	<!-- Phantom spacer to create scrollable area -->
	{#if viewMode === 'grid'}
		<div style="height: {scrollHeight}px; width: 100%; pointer-events: none;"></div>
	{/if}
</div>
