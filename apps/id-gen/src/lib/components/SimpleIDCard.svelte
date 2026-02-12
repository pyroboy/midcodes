<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Download, Trash2, Eye } from 'lucide-svelte';
	import { getStorageUrl } from '$lib/utils/storage';
	import SecureTokenBadge from '$lib/components/SecureTokenBadge.svelte';

	// Props using Svelte 5 $props() rune
	interface Props {
		card: any;
		isSelected?: boolean;
		onToggleSelect: (card: any, event?: MouseEvent) => void;
		onDownload: (card: any) => void;
		onDelete: (card: any) => void;
		onOpenPreview: (e: MouseEvent, card: any) => void;
		downloading?: boolean;
		deleting?: boolean;
		templateDimensions?: {
			width: number;
			height: number;
			orientation: 'landscape' | 'portrait';
		} | null;
	}

	let {
		card,
		isSelected = false,
		onToggleSelect,
		onDownload,
		onDelete,
		onOpenPreview,
		downloading = false,
		deleting = false,
		templateDimensions = null
	}: Props = $props();

	// Calculate aspect ratio from template dimensions
	// Use actual dimensions if provided, otherwise derive from orientation or default to landscape
	let aspectRatio = $derived(
		templateDimensions ? `${templateDimensions.width}/${templateDimensions.height}` : '1013/638'
	);

	// Calculate the "long edge" - this is the max dimension of the card
	// We use this to ensure uniform visual sizing across different orientations
	let longEdge = $derived(
		templateDimensions ? Math.max(templateDimensions.width, templateDimensions.height) : 1013
	);

	let shortEdge = $derived(
		templateDimensions ? Math.min(templateDimensions.width, templateDimensions.height) : 638
	);

	// Calculate container width that ensures uniform visual footprint:
	// - For landscape (width > height): use 100% of available width
	// - For portrait (width < height): width should be (shortEdge/longEdge) of container
	// This makes the "long edge" visually consistent across both orientations
	let isPortrait = $derived(
		templateDimensions ? templateDimensions.width < templateDimensions.height : false
	);
	let containerWidthPercent = $derived(isPortrait ? (shortEdge / longEdge) * 100 : 100);

	function handleClick(e: MouseEvent) {
		// Prevent triggering if clicking buttons/checkbox
		const target = e.target as HTMLElement;
		if (target.closest('button') || target.closest('input')) return;
		onOpenPreview?.(e, card);
	}

	// Use low-res version if available, fallback to full resolution
	// Use getProxiedUrl to ensure we get the full URL with bucket prepended AND proxied for CORS if needed
	let frontUrl = $derived(
		card.front_image_low_res
			? getStorageUrl(card.front_image_low_res, 'cards')
			: card.front_image
				? getStorageUrl(card.front_image, 'cards')
				: null
	);
</script>

<div
	class="group relative h-full w-full"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter') handleClick(new MouseEvent('click'));
	}}
>
	<!-- Selection Checkbox (Absolute Top Left) -->
	<div class="absolute top-2 left-2 z-10">
		<input
			aria-label="Select card"
			type="checkbox"
			checked={isSelected}
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				onToggleSelect(card, e);
			}}
			class="h-5 w-5 rounded border-muted-foreground text-primary focus:ring-primary"
		/>
	</div>

	<Card
		class="h-full flex flex-col overflow-hidden border-border bg-card hover:shadow-md transition-all duration-200 hover:border-primary/50 {isSelected
			? 'ring-2 ring-primary border-primary'
			: ''}"
	>
		<!-- Image Area - uniform sizing: portrait cards are narrower to match landscape visual footprint -->
		<div
			class="w-full bg-muted/50 flex items-center justify-center overflow-hidden border-b border-border py-2"
		>
			<div class="relative" style="width: {containerWidthPercent}%; aspect-ratio: {aspectRatio};">
				{#if frontUrl}
					<img
						src={frontUrl}
						alt="Card preview"
						class="w-full h-full transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
						decoding="async"
					/>
				{:else}
					<div
						class="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
					>
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
				{#if card.digital_card}
					<div class="mt-1">
						<SecureTokenBadge
							slug={card.digital_card.slug}
							status={card.digital_card.status}
							showLink={true}
							compact={true}
						/>
					</div>
				{/if}
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
