<script lang="ts">
	import type { SizePreset } from '$lib/schemas/template-assets.schema';
	import { estimateCardsPerA4 } from '$lib/schemas/template-assets.schema';
	import { assetUploadStore } from '$lib/stores/assetUploadStore';
	import { cn } from '$lib/utils';

	interface Props {
		sizePresets: SizePreset[];
	}

	let { sizePresets }: Props = $props();

	function handleSelect(preset: SizePreset) {
		assetUploadStore.selectSize(preset);
	}

	function formatDimensions(preset: SizePreset): string {
		return `${preset.width_inches}" × ${preset.height_inches}" (${preset.width_pixels}px × ${preset.height_pixels}px)`;
	}
</script>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-xl font-semibold text-foreground">Select Card Size</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Choose the size category for your template samples
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each sizePresets as preset (preset.id)}
			{@const estimate = estimateCardsPerA4(preset)}
			{@const isSelected = $assetUploadStore.selectedSizePreset?.id === preset.id}

			<button
				type="button"
				onclick={() => handleSelect(preset)}
				class={cn(
					'relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50',
					isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
				)}
			>
				{#if isSelected}
					<div
						class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
					>
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				{/if}

				<div class="mb-3 flex items-center gap-2">
					<!-- Card preview icon -->
					<div
						class="flex h-10 w-14 items-center justify-center rounded border border-muted-foreground/30 bg-muted/50"
						style="aspect-ratio: {preset.width_inches}/{preset.height_inches};"
					>
						<span class="text-[8px] font-medium text-muted-foreground">
							{preset.width_inches}" × {preset.height_inches}"
						</span>
					</div>
				</div>

				<h3 class="font-semibold text-foreground">{preset.name}</h3>

				<p class="mt-1 text-xs text-muted-foreground">
					{formatDimensions(preset)}
				</p>

				{#if preset.description}
					<p class="mt-2 text-xs text-muted-foreground/80">
						{preset.description}
					</p>
				{/if}

				<div class="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span>~{estimate.total} cards per A4</span>
					<span class="text-muted-foreground/50">({estimate.columns}×{estimate.rows})</span>
				</div>
			</button>
		{/each}
	</div>

	{#if sizePresets.length === 0}
		<div class="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
			<p class="text-muted-foreground">No size presets available</p>
		</div>
	{/if}
</div>
