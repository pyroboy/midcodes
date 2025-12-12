<script lang="ts">
	import type { App } from '$lib/data/apps.js';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	interface Props {
		apps: App[];
		onSelect?: (app: App) => void;
		selectedId?: string;
	}
	
	let { apps, onSelect, selectedId }: Props = $props();
	
	let scrollContainer: HTMLDivElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(true);
	
	function updateScrollState() {
		if (!scrollContainer) return;
		canScrollLeft = scrollContainer.scrollLeft > 0;
		canScrollRight = scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth - 10;
	}
	
	function scrollBy(direction: number) {
		const scrollAmount = 300;
		scrollContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
	}
	
	onMount(() => {
		updateScrollState();
	});
</script>

<div class="relative group">
	<!-- Scroll Left Button -->
	{#if canScrollLeft}
		<button
			onclick={() => scrollBy(-1)}
			class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100"
			aria-label="Scroll left"
		>
			<ChevronLeft class="h-5 w-5" />
		</button>
	{/if}
	
	<!-- Carousel Track -->
	<div 
		bind:this={scrollContainer}
		onscroll={updateScrollState}
		class="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-4"
	>
		{#each apps as app}
			<button
				onclick={() => onSelect?.(app)}
				class="flex-shrink-0 group/item relative overflow-hidden rounded-xl border transition-all duration-300 {selectedId === app.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'}"
			>
				<div class="w-40 h-24 relative">
					{#if app.thumbnail}
						<img 
							src={app.thumbnail} 
							alt={app.displayName}
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
							<span class="text-3xl font-bold text-foreground/20">{app.name.charAt(0).toUpperCase()}</span>
						</div>
					{/if}
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
					<div class="absolute bottom-2 left-2 right-2">
						<p class="text-white text-sm font-medium truncate">{app.displayName}</p>
					</div>
				</div>
			</button>
		{/each}
	</div>
	
	<!-- Scroll Right Button -->
	{#if canScrollRight}
		<button
			onclick={() => scrollBy(1)}
			class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100"
			aria-label="Scroll right"
		>
			<ChevronRight class="h-5 w-5" />
		</button>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
