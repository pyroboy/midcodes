<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { Float, HTML } from '@threlte/extras';
	import type { App } from '$lib/data/apps.js';
	import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { Texture } from 'three';
	import {
		CanvasTexture,
		ClampToEdgeWrapping,
		LinearFilter,
		LinearMipmapLinearFilter,
		SRGBColorSpace,
		TextureLoader
	} from 'three';

	interface Props {
		apps: App[];
		onSelect?: (app: App) => void;
		selectedId?: string;
		autoRotate?: boolean;
	}

	let { apps, onSelect, selectedId, autoRotate = true }: Props = $props();

	// Card dimensions and spacing
	const cardSpacing = 3.5; // 3D units between cards

	// ==== Autoplay / interaction gating ====
	const autoplayIntervalMs = 4000;
	const autoplayIdleDelayMs = 2500;

	let isHovered = $state(false);
	let isDragging = $state(false);
	let lastInteractionAt = $state(Date.now());

	function markInteraction() {
		lastInteractionAt = Date.now();
	}

	// ==== Center position (float while dragging, snapped to int when released) ====
	let currentIndex = $state(0); // the selected (snapped) index 0..len-1
	let targetCenter = $state(0); // may drift outside [0..len) to preserve wrap continuity
	let animatedCenter = $state(0);

	let rafId = 0;
	function scheduleAnimateCenter() {
		if (rafId) return;

		const tick = () => {
			const diff = targetCenter - animatedCenter;
			const step = diff * 0.14;

			// Stop when close enough to avoid re-rendering forever
			if (Math.abs(diff) < 0.0008) {
				animatedCenter = targetCenter;
				rafId = 0;
				return;
			}

			animatedCenter += step;
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
	}

	function mod(n: number, m: number) {
		return ((n % m) + m) % m;
	}

	function normalizeToNearestCycle(index0toLen: number, reference: number) {
		const len = apps.length;
		const base = mod(index0toLen, len);
		return base + Math.round((reference - base) / len) * len;
	}

	function snapToCenter(center: number) {
		const len = apps.length;
		if (len === 0) return;

		const normalizedIndex = mod(Math.round(center), len);
		currentIndex = normalizedIndex;

		// Keep continuity (avoid jumping from e.g. 9.8 -> 0.0)
		targetCenter = normalizeToNearestCycle(normalizedIndex, center);

		onSelect?.(apps[normalizedIndex]);
		scheduleAnimateCenter();
	}

	function goToCard(index: number) {
		if (apps.length === 0) return;
		markInteraction();

		const center = normalizeToNearestCycle(index, targetCenter);
		snapToCenter(center);
	}

	function scrollLeft() {
		snapToCenter(Math.round(targetCenter) - 1);
	}

	function scrollRight() {
		snapToCenter(Math.round(targetCenter) + 1);
	}

	// Keep in sync with external selection (if provided)
	$effect(() => {
		if (!selectedId || isDragging || apps.length === 0) return;
		const idx = apps.findIndex((a) => a.id === selectedId);
		if (idx >= 0 && idx !== currentIndex) {
			currentIndex = idx;
			targetCenter = normalizeToNearestCycle(idx, targetCenter);
			animatedCenter = targetCenter;
			scheduleAnimateCenter();
		}
	});

	// Visible "front" card based on what's rendered
	const frontCardIndex = $derived(() => {
		if (apps.length === 0) return 0;
		return mod(Math.round(animatedCenter), apps.length);
	});

	const frontApp = $derived(apps[frontCardIndex()]);

	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			scrollLeft();
		} else if (e.key === 'ArrowRight') {
			scrollRight();
		}
	}

	// ==== Drag / pointer interaction ====
	let canvasEl = $state<HTMLDivElement | null>(null);

	let dragStartX = 0;
	let dragStartCenter = 0;
	let lastPointerX = 0;
	let lastPointerT = 0;
	let velocityIndexPerSec = 0;
	let suppressClickUntil = 0;

	function pixelsPerCard() {
		const w = canvasEl?.getBoundingClientRect().width ?? 900;
		// Drag across ~60% of width to move one card
		return Math.max(220, w * 0.6);
	}

	function onPointerDown(e: PointerEvent) {
		// Only left click for mouse, allow touch/pen
		if (e.pointerType === 'mouse' && e.button !== 0) return;

		markInteraction();
		isDragging = true;

		dragStartX = e.clientX;
		dragStartCenter = targetCenter;

		lastPointerX = e.clientX;
		lastPointerT = performance.now();
		velocityIndexPerSec = 0;

		try {
			(canvasEl as HTMLDivElement).setPointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;

		markInteraction();

		const ppc = pixelsPerCard();
		const dx = e.clientX - dragStartX;
		const deltaIndex = -dx / ppc;

		targetCenter = dragStartCenter + deltaIndex;
		scheduleAnimateCenter();

		const now = performance.now();
		const dt = now - lastPointerT;
		if (dt > 0) {
			const ddx = e.clientX - lastPointerX;
			const dIndex = -ddx / ppc;
			velocityIndexPerSec = dIndex / (dt / 1000);
		}
		lastPointerX = e.clientX;
		lastPointerT = now;
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging) return;

		markInteraction();
		isDragging = false;

		const movedPx = Math.abs(e.clientX - dragStartX);
		if (movedPx > 6) suppressClickUntil = Date.now() + 350;

		// Inertia: project a bit in the direction of travel then snap
		const projected = targetCenter + velocityIndexPerSec * 0.22;
		snapToCenter(projected);

		try {
			(canvasEl as HTMLDivElement).releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	}

	function allowCardClick() {
		return Date.now() > suppressClickUntil && !isDragging;
	}

	// Get card style based on position relative to center (float for smooth drag)
	function getCardStyle(index: number) {
		const len = apps.length || 1;

		// Calculate position relative to current center
		let relativePosition = index - animatedCenter;

		// Handle wrapping (keep the "shortest" distance around the loop)
		if (relativePosition > len / 2) {
			relativePosition -= len;
		} else if (relativePosition < -len / 2) {
			relativePosition += len;
		}

		// X position in 3D space
		const x = relativePosition * cardSpacing;

		// Opacity: center is full, edges fade out
		const absDistance = Math.abs(relativePosition);
		const maxVisible = 2.5;
		const opacity = Math.max(0, 1 - absDistance / maxVisible);

		// Scale: center is bigger
		const scale = Math.max(0.7, 1 - absDistance * 0.15);

		// Z position: push edges back slightly for depth
		const z = -absDistance * 0.5;

		// Y position: subtle arc effect
		const y = -absDistance * absDistance * 0.05;

		// Is center card?
		const isFront = absDistance < 0.5;

		return { x, y, z, opacity, scale, isFront, relativePosition };
	}

	// Category color gradients for fallback
	const categoryColors: Record<string, string> = {
		core: '#6366f1',
		document: '#a855f7',
		utility: '#64748b'
	};

	// ==== Textures (real map textures; uses thumbnail if present, otherwise procedural) ====
	const textureLoader = new TextureLoader();
	const textureCache = new Map<string, Texture>();

	function applyTextureDefaults(tex: Texture) {
		tex.colorSpace = SRGBColorSpace;
		tex.wrapS = ClampToEdgeWrapping;
		tex.wrapT = ClampToEdgeWrapping;
		tex.minFilter = LinearMipmapLinearFilter;
		tex.magFilter = LinearFilter;
		tex.needsUpdate = true;
		return tex;
	}

	function makeFallbackTexture(app: App) {
		// Match the plane ratio (2.7 / 2.1 ≈ 1.2857)
		const w = 640;
		const h = 498;

		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			const tex = new CanvasTexture(canvas);
			tex.flipY = false;
			return applyTextureDefaults(tex);
		}

		const accent = categoryColors[app.category] ?? '#6366f1';

		// Background gradient
		const gradient = ctx.createLinearGradient(0, 0, w, h);
		gradient.addColorStop(0, '#0b1220');
		gradient.addColorStop(0.55, '#0f172a');
		gradient.addColorStop(1, accent);

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);

		// Subtle diagonal pattern
		ctx.globalAlpha = 0.12;
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		for (let i = -h; i < w; i += 28) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i + h, h);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;

		// Text
		ctx.fillStyle = 'rgba(255,255,255,0.92)';
		ctx.font = '700 44px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(app.name, w / 2, h / 2 - 22);

		ctx.fillStyle = 'rgba(255,255,255,0.72)';
		ctx.font = '500 22px Inter, system-ui, sans-serif';
		ctx.fillText(app.category.toUpperCase(), w / 2, h / 2 + 36);

		const tex = new CanvasTexture(canvas);
		// Canvas textures otherwise appear vertically flipped relative to HTML (text ends up upside down)
		tex.flipY = false;

		return applyTextureDefaults(tex);
	}

	function getAppTexture(app: App) {
		const cached = textureCache.get(app.id);
		if (cached) return cached;

		if (typeof window !== 'undefined' && app.thumbnail) {
			const tex = textureLoader.load(app.thumbnail, (loaded) => applyTextureDefaults(loaded));
			applyTextureDefaults(tex);
			textureCache.set(app.id, tex);
			return tex;
		}

		const tex = typeof window !== 'undefined' ? makeFallbackTexture(app) : null;
		if (tex) textureCache.set(app.id, tex);
		// SSR fallback: no map
		return tex as unknown as Texture;
	}

	// ==== Auto-scroll timer ====
	let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	let mounted = $state(false);

	function startAutoScroll() {
		if (autoScrollInterval) return;

		autoScrollInterval = setInterval(() => {
			if (!autoRotate) return;
			if (document?.hidden) return;
			if (isHovered || isDragging) return;

			const idleFor = Date.now() - lastInteractionAt;
			if (idleFor < autoplayIdleDelayMs) return;

			scrollRight();
		}, autoplayIntervalMs);
	}

	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
	}

	function handleVisibilityChange() {
		// Prevent "immediate rotate" when tab becomes visible again
		markInteraction();
	}

	onMount(() => {
		mounted = true;

		// Ensure initial values are consistent
		targetCenter = currentIndex;
		animatedCenter = currentIndex;

		startAutoScroll();

		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}
	});

	onDestroy(() => {
		stopAutoScroll();

		if (rafId) cancelAnimationFrame(rafId);

		for (const tex of textureCache.values()) tex.dispose();
		textureCache.clear();

		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	});
</script>

<div
	class="carousel-wrapper relative w-full py-8"
	role="region"
	aria-label="3D Project Carousel"
	onmouseenter={() => {
		isHovered = true;
		markInteraction();
	}}
	onmouseleave={() => {
		isHovered = false;
		markInteraction();
	}}
>
	<!-- 3D Canvas -->
	{#if mounted}
		<div
			bind:this={canvasEl}
			class="carousel-canvas h-[300px] sm:h-[340px] md:h-[380px] {isDragging ? 'is-dragging' : ''}"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<Canvas>
				<!-- Lighting -->
				<T.AmbientLight intensity={0.6} />
				<T.DirectionalLight position={[5, 5, 5]} intensity={0.8} />
				<T.PointLight position={[-5, 3, 2]} intensity={0.4} color="#6366f1" />
				<T.PointLight position={[5, 3, 2]} intensity={0.4} color="#ec4899" />

				<!-- Camera -->
				<T.PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

				<!-- Cards group -->
				<T.Group>
					{#each apps as app, i}
						{@const style = getCardStyle(i)}
						{#if style.opacity > 0.05}
							<Float floatIntensity={style.isFront ? 0.3 : 0.1} rotationIntensity={0.1} speed={2}>
								<T.Group position.x={style.x} position.y={style.y} position.z={style.z} scale={style.scale}>
									<!-- Card plane -->
									<T.Mesh
										onclick={() => {
											if (!allowCardClick()) return;
											goToCard(i);
										}}
									>
										<T.PlaneGeometry args={[2.8, 2.2]} />
										<T.MeshStandardMaterial
											color={categoryColors[app.category] || '#6366f1'}
											transparent
											opacity={style.opacity * 0.12}
											metalness={0.3}
											roughness={0.7}
										/>
									</T.Mesh>

									<!-- Card border/frame -->
									<T.Mesh position.z={0.01}>
										<T.PlaneGeometry args={[2.85, 2.25]} />
										<T.MeshStandardMaterial
											color={style.isFront ? '#6366f1' : '#374151'}
											transparent
											opacity={style.opacity * (style.isFront ? 0.8 : 0.3)}
											metalness={0.5}
											roughness={0.5}
										/>
									</T.Mesh>

									<!-- Inner card content area (textured) -->
									<T.Mesh position.z={0.02}>
										<T.PlaneGeometry args={[2.7, 2.1]} />
										<T.MeshStandardMaterial
											color="#ffffff"
											map={getAppTexture(app)}
											transparent
											opacity={style.opacity * 0.95}
											metalness={0.05}
											roughness={0.85}
										/>
									</T.Mesh>

									<!-- Glow effect for front card -->
									{#if style.isFront}
										<T.Mesh position.z={-0.05}>
											<T.PlaneGeometry args={[3.2, 2.6]} />
											<T.MeshBasicMaterial color="#6366f1" transparent opacity={0.2} />
										</T.Mesh>
									{/if}

									<!-- HTML overlay for card content -->
									<HTML transform position.z={0.05} scale={0.018} pointerEvents="none">
										<div
											class="card-content w-[280px] h-[220px] flex flex-col justify-between p-4 pointer-events-none"
											style="opacity: {style.opacity};"
										>
											<!-- Top: Category -->
											<div class="flex items-start justify-between">
												<span class="text-xs px-2 py-1 rounded bg-primary/30 text-primary font-medium capitalize">
													{app.category}
												</span>
												<span class="text-xs text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded">
													{app.status}
												</span>
											</div>

											<!-- Middle: Title & Description -->
											<div class="flex-1 flex flex-col justify-center text-center py-3">
												<h3
													class="text-lg font-bold text-foreground mb-1 line-clamp-2 {style.isFront ? 'text-primary' : ''}"
												>
													{app.displayName}
												</h3>
												<p class="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
											</div>

											<!-- Bottom: Tech Stack -->
											<div class="flex flex-wrap justify-center gap-1">
												{#each app.techStack.slice(0, 3) as tech}
													<span class="text-xs text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-full">
														{tech}
													</span>
												{/each}
												{#if app.techStack.length > 3}
													<span class="text-xs text-muted-foreground/60">+{app.techStack.length - 3}</span>
												{/if}
											</div>
										</div>
									</HTML>
								</T.Group>
							</Float>
						{/if}
					{/each}
				</T.Group>
			</Canvas>
		</div>
	{/if}

	<!-- Edge Fade Overlays -->
	<div
		class="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none"
	></div>
	<div
		class="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none"
	></div>

	<!-- Navigation Buttons -->
	<button
		onclick={scrollLeft}
		class="absolute left-3 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full
			bg-card/90 backdrop-blur border border-border shadow-lg
			flex items-center justify-center text-foreground
			hover:bg-primary/10 hover:border-primary/40 hover:scale-110
			transition-all duration-200"
		aria-label="Previous project"
	>
		<ChevronLeft class="h-5 w-5 md:h-6 md:w-6" />
	</button>

	<button
		onclick={scrollRight}
		class="absolute right-3 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full
			bg-card/90 backdrop-blur border border-border shadow-lg
			flex items-center justify-center text-foreground
			hover:bg-primary/10 hover:border-primary/40 hover:scale-110
			transition-all duration-200"
		aria-label="Next project"
	>
		<ChevronRight class="h-5 w-5 md:h-6 md:w-6" />
	</button>
	
	<!-- Dot Indicators -->
	<div class="flex justify-center gap-2 mt-4">
		{#each apps as app, i}
			<button
				onclick={() => goToCard(i)}
				class="w-2 h-2 rounded-full transition-all duration-300
					{frontCardIndex() === i 
						? 'bg-primary w-6 scale-110' 
						: 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
					}"
				aria-label="Go to {app.displayName}"
			></button>
		{/each}
	</div>
	
	<!-- Front Card Info Bar -->
	<div class="mt-3 text-center">
		<a 
			href={frontApp?.path}
			class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20
				text-primary hover:bg-primary/20 transition-all duration-200"
		>
			<ExternalLink class="h-4 w-4" />
			<span class="font-medium">{frontApp?.displayName}</span>
		</a>
	</div>
</div>

<style>
	.carousel-canvas {
		width: 100%;
		position: relative;
		touch-action: pan-y;
		cursor: grab;
	}

	.carousel-canvas.is-dragging {
		cursor: grabbing;
	}

	.carousel-canvas :global(canvas) {
		width: 100% !important;
		height: 100% !important;
	}

	.card-content {
		font-family: inherit;
	}
</style>
