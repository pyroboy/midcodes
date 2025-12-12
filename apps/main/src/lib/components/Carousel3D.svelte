<script lang="ts">
	import { T, Canvas, useTask } from '@threlte/core';
	import { Float, HTML } from '@threlte/extras';
	import type { App } from '$lib/data/apps.js';
	import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import Badge from './Badge.svelte';
	
	interface Props {
		apps: App[];
		onSelect?: (app: App) => void;
		selectedId?: string;
		autoRotate?: boolean;
	}
	
	let { apps, onSelect, selectedId, autoRotate = true }: Props = $props();
	
	// Card dimensions and spacing
	const cardSpacing = 3.5; // 3D units between cards
	
	// Current center position (which card index is at center)
	let currentIndex = $state(0);
	let targetX = $state(0);
	let currentX = $state(0);
	let isHovered = $state(false);
	let mounted = $state(false);
	
	// Calculate target X position based on current index
	$effect(() => {
		targetX = -currentIndex * cardSpacing;
	});
	
	// Get current front card
	const frontCardIndex = $derived(() => {
		return ((currentIndex % apps.length) + apps.length) % apps.length;
	});
	
	const frontApp = $derived(apps[frontCardIndex()]);
	
	// Auto-scroll timer
	let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	
	function startAutoScroll() {
		if (autoScrollInterval) return;
		autoScrollInterval = setInterval(() => {
			if (!isHovered && autoRotate) {
				goToCard((currentIndex + 1) % apps.length);
			}
		}, 4000);
	}
	
	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
	}
	
	// Navigation functions
	function scrollLeft() {
		const newIndex = (currentIndex - 1 + apps.length) % apps.length;
		goToCard(newIndex);
	}
	
	function scrollRight() {
		const newIndex = (currentIndex + 1) % apps.length;
		goToCard(newIndex);
	}
	
	function goToCard(index: number) {
		currentIndex = index;
		onSelect?.(apps[index]);
	}
	
	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			scrollLeft();
		} else if (e.key === 'ArrowRight') {
			scrollRight();
		}
	}
	
	// Get card style based on position relative to center
	function getCardStyle(index: number) {
		// Calculate position relative to current center
		let relativePosition = index - currentIndex;
		
		// Handle wrapping
		if (relativePosition > apps.length / 2) {
			relativePosition -= apps.length;
		} else if (relativePosition < -apps.length / 2) {
			relativePosition += apps.length;
		}
		
		// X position in 3D space
		const x = relativePosition * cardSpacing;
		
		// Opacity: center is full, edges fade out
		const absDistance = Math.abs(relativePosition);
		const maxVisible = 2.5;
		const opacity = Math.max(0, 1 - (absDistance / maxVisible));
		
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
	
	onMount(() => {
		mounted = true;
		startAutoScroll();
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
		}
	});
	
	onDestroy(() => {
		stopAutoScroll();
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<div 
	class="carousel-wrapper relative w-full py-8"
	role="region"
	aria-label="3D Project Carousel"
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	<!-- 3D Canvas -->
	{#if mounted}
	<div class="carousel-canvas" style="height: 380px;">
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
						<Float 
							floatIntensity={style.isFront ? 0.3 : 0.1} 
							rotationIntensity={0.1} 
							speed={2}
						>
							<T.Group 
								position.x={style.x}
								position.y={style.y}
								position.z={style.z}
								scale={style.scale}
							>
								<!-- Card plane -->
								<T.Mesh
									onclick={() => goToCard(i)}
								>
									<T.PlaneGeometry args={[2.8, 2.2]} />
									<T.MeshStandardMaterial 
										color={categoryColors[app.category] || '#6366f1'}
										transparent
										opacity={style.opacity * 0.15}
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
								
								<!-- Inner card content area -->
								<T.Mesh position.z={0.02}>
									<T.PlaneGeometry args={[2.7, 2.1]} />
									<T.MeshStandardMaterial 
										color="#0f172a"
										transparent
										opacity={style.opacity * 0.95}
										metalness={0.1}
										roughness={0.9}
									/>
								</T.Mesh>
								
								<!-- Glow effect for front card -->
								{#if style.isFront}
									<T.Mesh position.z={-0.05}>
										<T.PlaneGeometry args={[3.2, 2.6]} />
										<T.MeshBasicMaterial 
											color="#6366f1"
											transparent
											opacity={0.2}
										/>
									</T.Mesh>
								{/if}
								
								<!-- HTML overlay for card content -->
								<HTML 
									transform 
									position.z={0.05}
									scale={0.018}
									pointerEvents="none"
								>
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
											<h3 class="text-lg font-bold text-foreground mb-1 line-clamp-2 {style.isFront ? 'text-primary' : ''}">
												{app.displayName}
											</h3>
											<p class="text-xs text-muted-foreground line-clamp-2">
												{app.description}
											</p>
										</div>
										
										<!-- Bottom: Tech Stack -->
										<div class="flex flex-wrap justify-center gap-1">
											{#each app.techStack.slice(0, 3) as tech}
												<span class="text-xs text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-full">
													{tech}
												</span>
											{/each}
											{#if app.techStack.length > 3}
												<span class="text-xs text-muted-foreground/60">
													+{app.techStack.length - 3}
												</span>
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
	<div class="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none"></div>
	<div class="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none"></div>
	
	<!-- Navigation Buttons -->
	<button
		onclick={scrollLeft}
		class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full
			bg-card/90 backdrop-blur border border-border shadow-lg 
			flex items-center justify-center text-foreground 
			hover:bg-primary/10 hover:border-primary/40 hover:scale-110
			transition-all duration-200"
		aria-label="Previous project"
	>
		<ChevronLeft class="h-6 w-6" />
	</button>
	
	<button
		onclick={scrollRight}
		class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full
			bg-card/90 backdrop-blur border border-border shadow-lg 
			flex items-center justify-center text-foreground 
			hover:bg-primary/10 hover:border-primary/40 hover:scale-110
			transition-all duration-200"
		aria-label="Next project"
	>
		<ChevronRight class="h-6 w-6" />
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
	}
	
	.carousel-canvas :global(canvas) {
		width: 100% !important;
		height: 100% !important;
	}
	
	.card-content {
		font-family: inherit;
	}
</style>
