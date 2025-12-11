<script lang="ts">
	interface Props {
		count?: number;
		minWidth?: number;
	}

	let { count = 8, minWidth = 250 }: Props = $props();
</script>

<!-- Skeleton Grid for ID Cards -->
<div 
	class="grid gap-4"
	style="grid-template-columns: repeat(auto-fill, minmax({minWidth}px, 1fr));"
>
	{#each Array(count) as _, i}
		<div class="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
			<!-- Image skeleton -->
			<div class="aspect-[1.586/1] bg-muted"></div>
			
			<!-- Content skeleton -->
			<div class="p-3 space-y-2">
				<!-- Name -->
				<div class="h-4 bg-muted rounded w-3/4"></div>
				
				<!-- Fields -->
				<div class="space-y-1.5">
					<div class="h-3 bg-muted rounded w-1/2"></div>
					<div class="h-3 bg-muted rounded w-2/3"></div>
				</div>
				
				<!-- Actions -->
				<div class="flex gap-2 pt-2">
					<div class="h-7 w-7 bg-muted rounded"></div>
					<div class="h-7 w-7 bg-muted rounded"></div>
					<div class="h-7 w-7 bg-muted rounded"></div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
	
	.animate-pulse :global(.bg-muted) {
		background: linear-gradient(
			90deg,
			hsl(var(--muted)) 0%,
			hsl(var(--muted) / 0.5) 50%,
			hsl(var(--muted)) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}
</style>
