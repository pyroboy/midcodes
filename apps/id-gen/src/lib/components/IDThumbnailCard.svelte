<script lang="ts">

	// Types
	interface IDCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}

	import { getProxiedUrl } from '$lib/utils/storage';

	// Props
	let {
		card,
		onPreview = () => {},
		onDownload = () => {},
		onEdit = () => {},
		downloading = false,
		className = ''
	} = $props<{
		card: IDCard;
		onPreview?: (card: IDCard) => void;
		onDownload?: (card: IDCard) => void;
		onEdit?: (card: IDCard) => void;
		downloading?: boolean;
		className?: string;
	}>();

	// Derived values
	let frontImageUrl = $derived(
		card.front_image ? getProxiedUrl(card.front_image, 'rendered-id-cards') : null
	);

	let cardDisplayName = $derived(
		card.fields?.['Name']?.value ||
			card.fields?.['name']?.value ||
			card.fields?.['Full Name']?.value ||
			`ID ${card.idcard_id || ''}`
	);

	let formattedDate = $derived(
		card.created_at ? new Date(card.created_at).toLocaleDateString() : null
	);

	// Event handlers
	function handlePreview(event: Event) {
		console.log('🖱️ IDThumbnailCard: handlePreview called', { card, event });
		// Don't trigger preview if clicking on actual action buttons (not the card itself)
		const target = event.target as HTMLElement;
		if (target.closest('button:not([data-card-container])')) {
			console.log('🖱️ IDThumbnailCard: Click on actual button, ignoring');
			return;
		}
		console.log('🖱️ IDThumbnailCard: Calling onPreview with card:', card);
		onPreview(card);
	}

	function handleDownload(event: MouseEvent) {
		event.stopPropagation();
		onDownload(card);
	}

	function handleEdit(event: MouseEvent) {
		event.stopPropagation();
		onEdit(card);
	}
</script>

<div
	class="group relative bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer {className}"
	onclick={handlePreview}
	role="button"
	tabindex="0"
	data-card-container
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onPreview(card);
		}
	}}
	aria-label="Preview {cardDisplayName}"
>
	<!-- Thumbnail Image -->
	<div class="aspect-[3/2] relative overflow-hidden rounded-t-lg bg-muted">
		{#if frontImageUrl}
			<img
				src={frontImageUrl}
				alt="Preview of {cardDisplayName}"
				class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
				loading="lazy"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-muted-foreground">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
			</div>
		{/if}

		<!-- Hover Overlay -->
		<div
			class="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center"
		>
			<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<div class="bg-background/90 rounded-full p-2 shadow-sm">
					<svg
						class="w-5 h-5 text-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						></path>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						></path>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Card Content -->
	<div class="p-4">
		<!-- Card Title and Template -->
		<div class="mb-2">
			<h3 class="font-medium text-foreground text-sm truncate" title={cardDisplayName}>
				{cardDisplayName}
			</h3>
			<p class="text-xs text-muted-foreground truncate" title={card.template_name}>
				{card.template_name}
			</p>
		</div>

		<!-- Date -->
		{#if formattedDate}
			<p class="text-xs text-muted-foreground mb-3">
				{formattedDate}
			</p>
		{/if}

		<!-- Action Buttons -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="flex-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors"
				onclick={handleDownload}
				disabled={downloading}
				aria-label="Download {cardDisplayName}"
			>
				{#if downloading}
					<svg class="w-3 h-3 inline mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Downloading...
				{:else}
					<svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					Download
				{/if}
			</button>

			<button
				type="button"
				class="px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
				onclick={handleEdit}
				aria-label="Edit {cardDisplayName}"
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					></path>
				</svg>
			</button>
		</div>
	</div>
</div>
