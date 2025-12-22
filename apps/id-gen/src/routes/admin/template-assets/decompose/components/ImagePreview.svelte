<script lang="ts">
	import { ImageIcon } from 'lucide-svelte';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';

	let {
		currentImageUrl,
		currentLayers,
		layerSelections,
		showOriginalLayer,
		selectedLayerId,
		assetName,
		activeSide,
		widthPixels,
		heightPixels,
		orientation
	}: {
		currentImageUrl: string | null;
		currentLayers: DecomposedLayer[];
		layerSelections: Map<string, LayerSelection>;
		showOriginalLayer: boolean;
		selectedLayerId: string | null;
		assetName: string;
		activeSide: string;
		widthPixels: number;
		heightPixels: number;
		orientation: string;
	} = $props();
</script>

<div class="rounded-lg border border-border bg-card overflow-hidden">
	<div class="p-4 border-b border-border bg-muted/30">
		<h2 class="font-medium text-foreground">Template Preview</h2>
		<p class="text-xs text-muted-foreground">
			{widthPixels} x {heightPixels}px • {orientation}
		</p>
	</div>

	<div class="relative aspect-[1.6/1] bg-muted/50 flex items-center justify-center">
		{#if currentLayers.length > 0}
			<!-- Render Decomposed Layers -->
			<div class="relative w-full h-full">
				<!-- Original File Layer (shown behind all others when enabled) -->
				{#if showOriginalLayer && currentImageUrl}
					<img
						src={currentImageUrl}
						alt="Original file"
						class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
						style="z-index: -1; opacity: 0.5;"
					/>
				{/if}

				{#each currentLayers as layer (layer.id)}
					{@const selection = layerSelections.get(layer.id)}
					<img
						src={layer.imageUrl}
						alt={layer.name}
						class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
						style="z-index: {layer.zIndex}; opacity: {selection?.included ? 1 : 0};"
					/>
				{/each}

				<!-- Selection Overlay (High Z-Index) -->
				<div class="absolute inset-0 pointer-events-none" style="z-index: 9999;">
					{#each currentLayers as layer (layer.id)}
						<div
							class="absolute inset-0 border-2 transition-opacity {selectedLayerId === layer.id
								? 'border-primary opacity-100'
								: 'border-transparent opacity-0'}"
						></div>
					{/each}
				</div>
			</div>
		{:else if currentImageUrl && showOriginalLayer}
			<img
				src={currentImageUrl}
				alt="{assetName} - {activeSide}"
				class="max-w-full max-h-full object-contain"
			/>
		{:else}
			<div class="text-center text-muted-foreground">
				<ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-30" />
				<p class="text-sm">No image available</p>
			</div>
		{/if}
	</div>
</div>
