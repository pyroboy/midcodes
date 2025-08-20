<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import ImagePreviewModal from './ImagePreviewModal.svelte';
	import ClientOnly from './ClientOnly.svelte';

	// Types
	interface IDCard {
		idcard_id?: number;
		template_name: string;
		front_image?: string | null;
		back_image?: string | null;
		created_at?: string;
		fields?: Record<string, { value: string }>;
	}

	interface TemplateDimensions {
		width: number;
		height: number;
		unit?: string;
	}

	// Props
	let {
		open = false,
		cards = [],
		initialIndex = 0,
		templateDimensions = null,
		cardGeometry = null,
		mode = 'simple', // 'simple' | '3d'
		onClose = () => {},
		onDownload = () => {},
		onEdit = () => {},
		onDelete = null
	} = $props<{
		open: boolean;
		cards: IDCard[];
		initialIndex?: number;
		templateDimensions?: TemplateDimensions | null;
		cardGeometry?: any;
		mode?: 'simple' | '3d';
		onClose?: () => void;
		onDownload?: (card: IDCard) => void;
		onEdit?: (card: IDCard) => void;
		onDelete?: ((card: IDCard) => void) | null;
	}>();

	const dispatch = createEventDispatcher<{
		close: void;
		download: IDCard;
		edit: IDCard;
		delete: IDCard;
		navigate: { direction: 'prev' | 'next'; index: number };
	}>();

	// State
	let currentIndex = $state(initialIndex);
	let isNavigating = $state(false);

	// Derived values
	let currentCard = $derived(cards[currentIndex] || null);
	let hasMultipleCards = $derived(cards.length > 1);
	let canNavigatePrev = $derived(currentIndex > 0);
	let canNavigateNext = $derived(currentIndex < cards.length - 1);

	// Get formatted URLs for current card
	let frontImageUrl = $derived(
		currentCard?.front_image ? getSupabaseStorageUrl(currentCard.front_image, 'rendered-id-cards') : null
	);
	let backImageUrl = $derived(
		currentCard?.back_image ? getSupabaseStorageUrl(currentCard.back_image, 'rendered-id-cards') : null
	);

	// Update index when initialIndex prop changes
	$effect(() => {
		currentIndex = Math.max(0, Math.min(initialIndex, cards.length - 1));
	});

	// Debug modal props
	$effect(() => {
		console.log('🎭 IDPreviewModal props:', {
			open,
			cardsLength: cards.length,
			initialIndex,
			mode,
			currentIndex
		});
	});

	// Navigation functions
	function navigatePrev() {
		if (canNavigatePrev && !isNavigating) {
			isNavigating = true;
			currentIndex--;
			dispatch('navigate', { direction: 'prev', index: currentIndex });
			setTimeout(() => isNavigating = false, 100);
		}
	}

	function navigateNext() {
		if (canNavigateNext && !isNavigating) {
			isNavigating = true;
			currentIndex++;
			dispatch('navigate', { direction: 'next', index: currentIndex });
			setTimeout(() => isNavigating = false, 100);
		}
	}

	// Event handlers
	function handleClose() {
		onClose();
		dispatch('close');
	}

	function handleDownload() {
		if (currentCard) {
			onDownload(currentCard);
			dispatch('download', currentCard);
		}
	}

	function handleEdit() {
		if (currentCard) {
			onEdit(currentCard);
			dispatch('edit', currentCard);
		}
	}

	function handleDelete() {
		if (currentCard && onDelete) {
			onDelete(currentCard);
			dispatch('delete', currentCard);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		
		switch (event.key) {
			case 'Escape':
				handleClose();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				navigatePrev();
				break;
			case 'ArrowRight':
				event.preventDefault();
				navigateNext();
				break;
			case ' ':
				event.preventDefault();
				handleDownload();
				break;
		}
	}

	function handleModalBackdropClick(event: MouseEvent) {
		if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
			handleClose();
		}
	}

	// Format metadata for display
	function getCardMetadata(card: IDCard) {
		const metadata = [];
		
		if (card.created_at) {
			const date = new Date(card.created_at).toLocaleDateString();
			metadata.push(`Created: ${date}`);
		}
		
		if (card.template_name) {
			metadata.push(`Template: ${card.template_name}`);
		}
		
		if (templateDimensions) {
			const { width, height, unit = 'px' } = templateDimensions;
			metadata.push(`Size: ${width}×${height} ${unit}`);
		}
		
		return metadata;
	}

	// Get display name for card
	function getCardDisplayName(card: IDCard) {
		return (
			card.fields?.['Name']?.value ||
			card.fields?.['name']?.value ||
			card.fields?.['Full Name']?.value ||
			`ID Card ${card.idcard_id || ''}`
		);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && currentCard}
	{#if mode === '3d' && (frontImageUrl || backImageUrl)}
		<!-- Use the full 3D preview modal for advanced preview -->
		<ClientOnly>
			<ImagePreviewModal
				frontImageUrl={frontImageUrl}
				backImageUrl={backImageUrl}
				{cardGeometry}
				{templateDimensions}
				onClose={handleClose}
			/>
		</ClientOnly>
	{:else}
		<!-- Simple modal for dashboard and quick previews -->
		<div class="fixed inset-0 z-50">
			<div 
				class="fixed inset-0 bg-black/80 backdrop-blur-sm modal-backdrop" 
				role="presentation" 
				on:click={handleModalBackdropClick}
			></div>

			<div class="fixed inset-0 flex items-center justify-center p-2 md:p-4">
				<div 
					class="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl" 
					role="dialog"
					aria-labelledby="modal-title"
					aria-describedby="modal-description"
				>
					<!-- Header -->
					<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						<div class="flex-1">
							<h2 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
								{getCardDisplayName(currentCard)}
							</h2>
							<div id="modal-description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
								{#each getCardMetadata(currentCard) as metadata}
									<span class="inline-block mr-4">{metadata}</span>
								{/each}
							</div>
						</div>
						
						<!-- Navigation Counter -->
						{#if hasMultipleCards}
							<div class="text-sm text-gray-500 dark:text-gray-400 mx-4">
								{currentIndex + 1} of {cards.length}
							</div>
						{/if}
						
						<!-- Close Button -->
						<button 
							type="button" 
							class="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors" 
							on:click={handleClose}
							aria-label="Close preview"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>

					<!-- Content -->
					<div class="relative">
						<!-- Navigation Buttons -->
						{#if hasMultipleCards}
							<button 
								type="button"
								class="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 dark:bg-gray-800/90 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								on:click={navigatePrev}
								disabled={!canNavigatePrev || isNavigating}
								aria-label="Previous card"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
								</svg>
							</button>
							
							<button 
								type="button"
								class="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 dark:bg-gray-800/90 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								on:click={navigateNext}
								disabled={!canNavigateNext || isNavigating}
								aria-label="Next card"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</button>
						{/if}

						<!-- Image Preview -->
						<div class="p-6">
							<div class="grid gap-6 {frontImageUrl && backImageUrl ? 'md:grid-cols-2' : 'grid-cols-1'}">
								{#if frontImageUrl}
									<div class="space-y-2">
										<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Front</h3>
										<div class="relative group">
											<img 
												src={frontImageUrl} 
												alt="Front of ID card"
												class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-[1.02]"
												loading="lazy"
											/>
										</div>
									</div>
								{/if}
								
								{#if backImageUrl}
									<div class="space-y-2">
										<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Back</h3>
										<div class="relative group">
											<img 
												src={backImageUrl} 
												alt="Back of ID card"
												class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-[1.02]"
												loading="lazy"
											/>
										</div>
									</div>
								{/if}
								
								{#if !frontImageUrl && !backImageUrl}
									<div class="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
										<div class="text-center text-gray-500 dark:text-gray-400">
											<svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
											</svg>
											<p>No preview available</p>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
						<div class="flex items-center gap-2">
							<button 
								type="button"
								class="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-colors"
								on:click={handleDownload}
								aria-label="Download card"
							>
								<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								Download
							</button>
							
							<button 
								type="button"
								class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
								on:click={handleEdit}
								aria-label="Edit card"
							>
								<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
								</svg>
								Edit
							</button>

							{#if onDelete}
								<button 
									type="button"
									class="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-colors"
									on:click={handleDelete}
									aria-label="Delete card"
								>
									<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
									</svg>
									Delete
								</button>
							{/if}
						</div>

						{#if mode === 'simple' && (frontImageUrl || backImageUrl)}
							<button 
								type="button"
								class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
								on:click={() => mode = '3d'}
								aria-label="Switch to 3D view"
							>
								<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
								</svg>
								3D View
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}