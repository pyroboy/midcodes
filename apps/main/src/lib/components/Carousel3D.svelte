<script lang="ts">
	import type { App } from '$lib/data/apps.js';
	import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import Badge from './Badge.svelte';
	
	interface Props {
		apps: App[];
		onSelect?: (app: App) => void;
		selectedId?: string;
		autoRotate?: boolean;
		cardWidth?: number;
		gap?: number;
	}
	
	let { apps, onSelect, selectedId, autoRotate = true, cardWidth = 280, gap = 20 }: Props = $props();
	
	// Current card index (center card)
	let currentIndex = $state(0);
	let isHovered = $state(false);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartIndex = $state(0);
	
	// Calculate spacing between cards
	const cardSpacing = $derived(cardWidth + gap);
	
	// Get current front card
	const frontCardIndex = $derived(() => {
		return ((currentIndex % apps.length) + apps.length) % apps.length;
	});
	
	const frontApp = $derived(apps[frontCardIndex()]);
	
	// Auto-scroll
	let autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	
	function startAutoScroll() {
		if (autoScrollInterval) return;
		autoScrollInterval = setInterval(() => {
			if (!isHovered && !isDragging && autoRotate) {
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
	
	// Navigation
	function scrollLeft() {
		goToCard(currentIndex - 1);
	}
	
	function scrollRight() {
		goToCard(currentIndex + 1);
	}
	
	function goToCard(index: number) {
		// Handle wrapping
		currentIndex = ((index % apps.length) + apps.length) % apps.length;
		onSelect?.(apps[currentIndex]);
	}
	
	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			scrollLeft();
		} else if (e.key === 'ArrowRight') {
			scrollRight();
		}
	}
	
	// Mouse/touch drag handling
	function handleDragStart(e: MouseEvent | TouchEvent) {
		isDragging = true;
		dragStartX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		dragStartIndex = currentIndex;
	}
	
	function handleDragMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		// Just track for end handler
	}
	
	function handleDragEnd(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		isDragging = false;
		
		const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
		const deltaX = endX - dragStartX;
		
		// Swipe threshold
		if (Math.abs(deltaX) > 50) {
			if (deltaX > 0) {
				scrollLeft();
			} else {
				scrollRight();
			}
		}
	}
	
	// Get card style based on position relative to center
	function getCardStyle(index: number) {
		// Calculate position relative to current center
		let relativePosition = index - currentIndex;
		
		// Handle wrapping for a smooth visual (consider cards wrap around)
		if (relativePosition > apps.length / 2) {
			relativePosition -= apps.length;
		} else if (relativePosition < -apps.length / 2) {
			relativePosition += apps.length;
		}
		
		// Calculate X translation
		const translateX = relativePosition * cardSpacing;
		
		// Opacity: center is full, edges fade out
		// Use absolute distance from center to determine opacity
		const absDistance = Math.abs(relativePosition);
		const maxVisibleCards = 2.5; // Cards beyond this are fully transparent
		const opacity = Math.max(0, 1 - (absDistance / maxVisibleCards));
		
		// Scale: center is full size, edges are smaller
		const scale = Math.max(0.7, 1 - absDistance * 0.1);
		
		// Z-index: center is on top
		const zIndex = 100 - Math.abs(relativePosition) * 10;
		
		// Is this the front/center card?
		const isFront = relativePosition === 0;
		
		return { 
			translateX, 
			opacity, 
			scale, 
			zIndex: Math.round(zIndex), 
			isFront 
		};
	}
	
	// Category color gradients
	const categoryGradients: Record<string, string> = {
		core: 'from-blue-500/20 to-indigo-600/20',
		document: 'from-purple-500/20 to-pink-600/20',
		utility: 'from-slate-400/20 to-slate-600/20'
	};
	
	onMount(() => {
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
	<!-- Carousel Container -->
	<div 
		class="carousel-container relative mx-auto overflow-hidden"
		style="height: 320px; max-width: 100%;"
	>
		<!-- Edge Fade Overlays -->
		<div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none"></div>
		<div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none"></div>
		
		<!-- Carousel Track (slides horizontally) -->
		<div 
			class="carousel-track absolute left-1/2 top-1/2"
			style="
				transform: translateX(-50%) translateY(-50%);
				transition: {isDragging ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'};
			"
			onmousedown={handleDragStart}
			ontouchstart={handleDragStart}
			onmousemove={handleDragMove}
			ontouchmove={handleDragMove}
			onmouseup={handleDragEnd}
			ontouchend={handleDragEnd}
			onmouseleave={handleDragEnd}
		>
			{#each apps as app, i}
				{@const style = getCardStyle(i)}
				<button
					class="carousel-card absolute cursor-pointer group"
					style="
						transform: translateX({style.translateX}px) scale({style.scale});
						left: -{cardWidth / 2}px;
						top: -120px;
						opacity: {style.opacity};
						z-index: {style.zIndex};
						transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
					"
					onclick={(e) => { e.stopPropagation(); goToCard(i); }}
					aria-label="View {app.displayName}"
				>
					<div 
						class="card-inner relative w-[280px] h-[240px] rounded-2xl overflow-hidden border transition-all duration-300
							{style.isFront ? 'border-primary/50 shadow-2xl shadow-primary/20 ring-2 ring-primary/30' : 'border-border/50 shadow-lg'}
						"
					>
						<!-- Background -->
						<div class="absolute inset-0 bg-card/90 backdrop-blur-sm">
							{#if app.thumbnail}
								<img 
									src={app.thumbnail} 
									alt={app.displayName}
									class="w-full h-full object-cover opacity-30"
								/>
							{:else}
								<div class="w-full h-full bg-gradient-to-br {categoryGradients[app.category]}"></div>
							{/if}
							<div class="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent"></div>
						</div>
						
						<!-- Content -->
						<div class="relative h-full flex flex-col justify-between p-5">
							<!-- Top: Category & Tech -->
							<div class="flex items-start justify-between">
								<Badge class="bg-primary/20 text-primary px-2 py-1 text-xs capitalize">
									{app.category}
								</Badge>
								<span class="text-xs text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded">
									{app.status}
								</span>
							</div>
							
							<!-- Middle: Title & Description -->
							<div class="flex-1 flex flex-col justify-center text-center py-4">
								<h3 class="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
									{app.displayName}
								</h3>
								<p class="text-sm text-muted-foreground line-clamp-2">
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
						
						<!-- Hover Glow Effect -->
						<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
							bg-gradient-to-t from-primary/10 via-transparent to-transparent"></div>
					</div>
				</button>
			{/each}
		</div>
	</div>
	
	
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
	<div class="flex justify-center gap-2 mt-6">
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
	<div class="mt-4 text-center">
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
	.carousel-card {
		user-select: none;
		-webkit-user-select: none;
	}
	
	.carousel-track {
		cursor: grab;
	}
	
	.carousel-track:active {
		cursor: grabbing;
	}
	
	/* Ensure smooth 3D rendering */
	.carousel-container,
	.carousel-track,
	.carousel-card {
		-webkit-transform-style: preserve-3d;
		transform-style: preserve-3d;
	}
</style>
