<script lang="ts">
	import { cn } from '$lib/utils';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';
	import { Button } from '$lib/components/ui/button';
	import { Palette, Wand2, Loader2 } from '@lucide/svelte';

	interface Props {
		assets: TemplateAsset[];
		loading?: boolean;
		onSelect?: (asset: TemplateAsset) => void;
		onCustomDesign?: () => void;
		selectedAssetId?: string | null;
		emptyMessage?: string;
	}

	let {
		assets = [],
		loading = false,
		onSelect,
		onCustomDesign,
		selectedAssetId = null,
		emptyMessage = 'No templates available for this size'
	}: Props = $props();

	function handleSelect(asset: TemplateAsset) {
		onSelect?.(asset);
	}
</script>

<div class="template-browser">
	{#if loading}
		<div class="loading-state">
			<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
			<p class="text-sm text-muted-foreground mt-2">Loading templates...</p>
		</div>
	{:else if assets.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Palette class="h-12 w-12 text-muted-foreground/50" />
			</div>
			<p class="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
			{#if onCustomDesign}
				<Button variant="default" size="sm" onclick={onCustomDesign}>
					<Wand2 class="h-4 w-4 mr-2" />
					Design My Own
				</Button>
			{/if}
		</div>
	{:else}
		<div class="template-grid">
			{#each assets as asset (asset.id)}
				{@const isSelected = selectedAssetId === asset.id}
				<button
					type="button"
					class={cn(
						'template-card',
						isSelected && 'selected'
					)}
					onclick={() => handleSelect(asset)}
				>
					<div class="template-image">
						<img
							src={asset.image_url}
							alt={asset.name}
							loading="lazy"
						/>
						{#if isSelected}
							<div class="selected-overlay">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						{/if}
					</div>
					<div class="template-info">
						<span class="template-name">{asset.name}</span>
						{#if asset.category}
							<span class="template-category">{asset.category}</span>
						{/if}
					</div>
				</button>
			{/each}

			<!-- Custom Design Card -->
			{#if onCustomDesign}
				<button
					type="button"
					class="template-card custom-design-card"
					onclick={onCustomDesign}
				>
					<div class="custom-design-content">
						<Wand2 class="h-8 w-8 text-primary" />
						<span class="custom-design-label">Custom Design</span>
						<span class="custom-design-hint">Request a unique template</span>
					</div>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.template-browser {
		width: 100%;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.empty-icon {
		margin-bottom: 1rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 50%;
	}

	.template-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.template-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.template-card {
		position: relative;
		display: flex;
		flex-direction: column;
		border: 2px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: hidden;
		background: hsl(var(--background));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.template-card:hover {
		border-color: hsl(var(--primary) / 0.5);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
	}

	.template-card.selected {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.template-image {
		position: relative;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: hsl(var(--muted) / 0.5);
	}

	.template-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.selected-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--primary) / 0.6);
	}

	.template-info {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.125rem;
	}

	.template-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.template-category {
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.custom-design-card {
		border-style: dashed;
		border-color: hsl(var(--primary) / 0.3);
	}

	.custom-design-card:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.custom-design-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		gap: 0.5rem;
		min-height: 120px;
	}

	.custom-design-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--primary));
	}

	.custom-design-hint {
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
	}
</style>
