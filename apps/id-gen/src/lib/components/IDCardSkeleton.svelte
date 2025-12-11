<script lang="ts">
	interface Props {
		count?: number;
		minWidth?: number;
	}

	let { count = 8, minWidth = 250 }: Props = $props();
</script>

<!-- Skeleton Grid for ID Cards - matches SimpleIDCard structure -->
<div 
	class="grid gap-4"
	style="grid-template-columns: repeat(auto-fill, minmax({minWidth}px, 1fr));"
>
	{#each Array(count) as _, i}
		<div class="relative h-full w-full">
			<!-- Checkbox skeleton (absolute top left like the real card) -->
			<div class="absolute top-2 left-2 z-10">
				<div class="h-5 w-5 bg-muted rounded animate-shimmer"></div>
			</div>
			
			<div class="h-full flex flex-col overflow-hidden rounded-xl border border-border bg-card">
				<!-- Image Area skeleton - matches aspect-[1.58/1] -->
				<div class="relative w-full aspect-[1.58/1] bg-muted/50 border-b border-border animate-shimmer">
					<!-- Icon placeholder in center -->
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="w-10 h-10 bg-muted/70 rounded-lg"></div>
					</div>
				</div>
				
				<!-- Content area - matches CardContent -->
				<div class="flex-1 p-3 flex flex-col justify-between gap-3">
					<!-- Text Info -->
					<div class="space-y-1">
						<!-- Name skeleton -->
						<div class="h-4 bg-muted rounded w-3/4 animate-shimmer"></div>
						<!-- Template name skeleton -->
						<div class="h-3 bg-muted rounded w-1/2 animate-shimmer"></div>
					</div>
					
					<!-- Action Buttons -->
					<div class="flex gap-2 pt-2 border-t border-border/50">
						<!-- Download button skeleton -->
						<div class="flex-1 h-8 bg-muted rounded animate-shimmer"></div>
						<!-- Delete button skeleton -->
						<div class="h-8 w-8 bg-muted rounded animate-shimmer"></div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes shimmer {
		0% { 
			opacity: 0.7;
		}
		50% { 
			opacity: 0.4;
		}
		100% { 
			opacity: 0.7;
		}
	}
	
	.animate-shimmer {
		animation: shimmer 1.5s ease-in-out infinite;
	}
</style>
