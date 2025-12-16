<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Download, Trash2, Eye } from 'lucide-svelte';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';

	// Remove rigid type constraints to allow flexibility
	export let card: any;
	export let isSelected: boolean = false;
	export let onToggleSelect: (card: any) => void;
	export let onDownload: (card: any) => void;
	export let onDelete: (card: any) => void;
	export let onOpenPreview: (e: MouseEvent, card: any) => void;
	export let downloading: boolean = false;
	export let deleting: boolean = false;
	// Template dimensions for correct aspect ratio (portrait vs landscape)
	export let templateDimensions: { width: number; height: number; orientation: 'landscape' | 'portrait' } | null = null;

	// Calculate aspect ratio from template dimensions
	// Use actual dimensions if provided, otherwise derive from orientation or default to landscape
	$: aspectRatio = templateDimensions
		? `${templateDimensions.width}/${templateDimensions.height}`
		: '1013/638';

	// Calculate the "long edge" - this is the max dimension of the card
	// We use this to ensure uniform visual sizing across different orientations
	$: longEdge = templateDimensions 
		? Math.max(templateDimensions.width, templateDimensions.height)
		: 1013;
	
	$: shortEdge = templateDimensions
		? Math.min(templateDimensions.width, templateDimensions.height)
		: 638;

	// Calculate container width that ensures uniform visual footprint:
	// - For landscape (width > height): use 100% of available width
	// - For portrait (width < height): width should be (shortEdge/longEdge) of container
	// This makes the "long edge" visually consistent across both orientations
	$: isPortrait = templateDimensions ? templateDimensions.width < templateDimensions.height : false;
	$: containerWidthPercent = isPortrait ? (shortEdge / longEdge) * 100 : 100;

	function handleClick(e: MouseEvent) {
		// Prevent triggering if clicking buttons/checkbox
		const target = e.target as HTMLElement;
		if (target.closest('button') || target.closest('input')) return;
		onOpenPreview?.(e, card);
	}

	const frontUrl = card.front_image
		? getSupabaseStorageUrl(card.front_image, 'rendered-id-cards')
		: null;
</script>

<div
	class="group relative h-full w-full"
	role="button"
	tabindex="0"
	on:click={handleClick}
	on:keydown={(e) => {
		if (e.key === 'Enter') handleClick(new MouseEvent('click'));
	}}
>
	<!-- Selection Checkbox (Absolute Top Left) -->
	<div class="absolute top-2 left-2 z-10">
		<input
			aria-label="Select card"
			type="checkbox"
			checked={isSelected}
			on:click={(e) => {
				e.stopPropagation();
				onToggleSelect(card);
			}}
			class="h-5 w-5 rounded border-muted-foreground text-primary focus:ring-primary"
		/>
	</div>

	<Card
		class="h-full flex flex-col overflow-hidden border-border bg-card hover:shadow-md transition-all duration-200 hover:border-primary/50"
	>
		<!-- Image Area - uniform sizing: portrait cards are narrower to match landscape visual footprint -->
		<div class="w-full bg-muted/50 flex items-center justify-center overflow-hidden border-b border-border py-2">
			<div
				class="relative"
				style="width: {containerWidthPercent}%; aspect-ratio: {aspectRatio};"
			>
				{#if frontUrl}
					<img
						src={frontUrl}
						alt="Card preview"
						class="w-full h-full transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
				{:else}
					<div class="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
						<Eye class="w-8 h-8 mb-1 opacity-50" />
						<span class="text-xs">No Preview</span>
					</div>
				{/if}

				<!-- Mobile overlay hint -->
				<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
			</div>
		</div>

		<CardContent class="flex-1 p-3 flex flex-col justify-between gap-3">
			<!-- Text Info -->
			<div class="space-y-1">
				<h3
					class="font-semibold text-sm text-foreground truncate"
					title={card.fields?.['Name']?.value}
				>
					{card.fields?.['Name']?.value || card.fields?.['name']?.value || 'Untitled ID'}
				</h3>
				<p class="text-xs text-muted-foreground truncate">
					{card.template_name}
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-2 pt-2 border-t border-border/50">
				<Button
					variant="outline"
					size="sm"
					class="flex-1 h-8 text-xs px-2 bg-background hover:bg-muted hover:text-foreground"
					onclick={(e) => {
						e.stopPropagation();
						onDownload(card);
					}}
					disabled={downloading}
				>
					{#if downloading}
						<span class="animate-spin mr-1"> ⏳ </span>
					{:else}
						<Download class="w-3 h-3 mr-1.5" />
					{/if}
					<span class="hidden sm:inline">Download</span>
					<span class="sm:hidden">Save</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
					onclick={(e) => {
						e.stopPropagation();
						onDelete(card);
					}}
					disabled={deleting}
				>
					<Trash2 class="w-3.5 h-3.5" />
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
