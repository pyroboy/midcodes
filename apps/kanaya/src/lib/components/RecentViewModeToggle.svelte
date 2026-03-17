<script lang="ts">
	import { recentViewMode, type RecentViewMode } from '$lib/stores/recentViewMode';
	import { LayoutGrid, List, GalleryHorizontal } from 'lucide-svelte';

	function setMode(mode: RecentViewMode) {
		recentViewMode.set(mode);
	}

	const modes = [
		{ key: 'carousel' as const, icon: GalleryHorizontal, title: 'Carousel view' },
		{ key: 'grid' as const, icon: LayoutGrid, title: 'Grid view' },
		{ key: 'list' as const, icon: List, title: 'List view' }
	];
</script>

<div
	class="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/50"
	role="group"
	aria-label="View mode toggle"
>
	{#each modes as mode}
		<button
			class="p-1.5 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
				{$recentViewMode === mode.key
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground hover:bg-background/50'}"
			aria-pressed={$recentViewMode === mode.key}
			title={mode.title}
			onclick={() => setMode(mode.key)}
		>
			<mode.icon class="h-4 w-4" />
		</button>
	{/each}
</div>
