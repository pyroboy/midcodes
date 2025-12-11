<script lang="ts">
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import JSZip from 'jszip';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import { createCardFromInches } from '$lib/utils/cardGeometry';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import { viewMode } from '$lib/stores/viewMode';
	import SimpleIDCard from '$lib/components/SimpleIDCard.svelte';
	import EmptyIDs from '$lib/components/empty-states/EmptyIDs.svelte';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
	
	// Import remote functions
	import { getIDCards, getCardCount, getTemplateDimensions } from './data.remote';
	import type { IDCard } from './data.remote';

	// Constants
	const INITIAL_LOAD = 10;
	const LOAD_MORE_COUNT = 10;

	// Loading states
	let initialLoading = $state(true);
	let loadingMore = $state(false);
	let hasMore = $state(true);
	let totalCount = $state(0);

	// Data states
	let dataRows = $state<IDCard[]>([]);
	let templateDimensions = $state<Record<string, { width: number; height: number; unit: string }>>({});
	
	// UI states
	let searchQuery = $state('');
	let selectedFrontImage: string | null = $state(null);
	let selectedBackImage: string | null = $state(null);
	let selectedTemplateDimensions: { width: number; height: number; unit?: string } | null = $state(null);
	let selectedCardGeometry: any = $state(null);
	let downloadingCards = $state(new Set<string>());
	let deletingCards = $state(new Set<string>());
	let selectedCards = $state(new Set<string>());
	let selectedCount = $derived(selectedCards.size);
	let isBulkDownloading = $state(false);
	let bulkDownloadProgress = $state({ current: 0, total: 0 });
	let errorMessage = '';

	// Infinite scroll ref
	let loadMoreTrigger: HTMLDivElement;
	let observer: IntersectionObserver | null = null;

	// Card zoom control
	let cardMinWidth = $state(250);
	const MIN_WIDTH = 150;
	const MAX_WIDTH = 450;
	const STEP = 25;

	function zoomOut() {
		cardMinWidth = Math.max(MIN_WIDTH, cardMinWidth - STEP);
	}
	function zoomIn() {
		cardMinWidth = Math.min(MAX_WIDTH, cardMinWidth + STEP);
	}

	// Load initial cards
	async function loadInitialCards() {
		try {
			const [result, count] = await Promise.all([
				getIDCards({ offset: 0, limit: INITIAL_LOAD }),
				getCardCount()
			]);
			
			dataRows = result.cards;
			totalCount = count;
			hasMore = result.hasMore;
			
			// Load template dimensions for current cards
			await loadTemplateDimensionsForCards(result.cards);
		} catch (err) {
			console.error('Error loading initial cards:', err);
			errorMessage = 'Failed to load ID cards';
		} finally {
			initialLoading = false;
		}
	}

	// Load more cards (infinite scroll)
	async function loadMoreCards() {
		if (loadingMore || !hasMore) return;
		
		loadingMore = true;
		try {
			const result = await getIDCards({ offset: dataRows.length, limit: LOAD_MORE_COUNT });
			
			dataRows = [...dataRows, ...result.cards];
			hasMore = result.hasMore;
			
			// Load template dimensions for new cards
			await loadTemplateDimensionsForCards(result.cards);
		} catch (err) {
			console.error('Error loading more cards:', err);
		} finally {
			loadingMore = false;
		}
	}

	// Load template dimensions for a set of cards
	async function loadTemplateDimensionsForCards(cards: IDCard[]) {
		const newTemplateNames = [...new Set(cards.map(c => c.template_name).filter(Boolean))]
			.filter(name => !templateDimensions[name]);
		
		if (newTemplateNames.length > 0) {
			const dims = await getTemplateDimensions(newTemplateNames);
			templateDimensions = { ...templateDimensions, ...dims };
		}
	}

	// Setup infinite scroll observer
	function setupObserver() {
		if (!browser || !loadMoreTrigger) return;
		
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) {
					loadMoreCards();
				}
			},
			{ rootMargin: '200px' }
		);
		
		observer.observe(loadMoreTrigger);
	}

	onMount(() => {
		loadInitialCards();
		return () => {
			observer?.disconnect();
		};
	});

	// Setup observer after initial load
	$effect(() => {
		if (!initialLoading && loadMoreTrigger) {
			setupObserver();
		}
	});

	// 3D card geometries - loaded on-demand
	const templateGeometries = $state<Record<string, any>>({});

	async function loadGeometryForTemplate(templateName: string) {
		if (templateGeometries[templateName] || !templateDimensions[templateName]) {
			return templateGeometries[templateName];
		}

		const dimensions = templateDimensions[templateName];
		try {
			const widthInches = dimensions.width / 300;
			const heightInches = dimensions.height / 300;
			const geometry = await createCardFromInches(widthInches, heightInches);
			templateGeometries[templateName] = geometry;
			return geometry;
		} catch (error) {
			console.error(`Failed to load geometry for template "${templateName}":`, error);
			return null;
		}
	}

	// Group cards by template
	let groupedCards = $derived((() => {
		const groups: Record<string, IDCard[]> = {};
		dataRows.forEach((card) => {
			const templateName = card.template_name || 'Unassigned';
			if (!groups[templateName]) {
				groups[templateName] = [];
			}
			groups[templateName].push(card);
		});
		return groups;
	})());

	// Selection helpers
	function getCardId(card: IDCard): string {
		return card.idcard_id?.toString() || '';
	}

	function handleCheckboxClick(event: Event, card: IDCard) {
		event.stopPropagation();
		const cardId = getCardId(card);
		if (!cardId) return;

		const newSelectedCards = new Set(selectedCards);
		if (newSelectedCards.has(cardId)) {
			newSelectedCards.delete(cardId);
		} else {
			newSelectedCards.add(cardId);
		}
		selectedCards = newSelectedCards;
	}

	const selectionManager = {
		isSelected: (cardId: string) => selectedCards.has(cardId),
		toggleSelection: (cardId: string) => {
			if (!cardId) return;
			const newSelectedCards = new Set(selectedCards);
			if (newSelectedCards.has(cardId)) {
				newSelectedCards.delete(cardId);
			} else {
				newSelectedCards.add(cardId);
			}
			selectedCards = newSelectedCards;
		},
		clearSelection: () => {
			selectedCards = new Set();
		}
	};

	// Open preview modal
	async function openPreview(event: MouseEvent, card: IDCard) {
		const target = event.target as HTMLElement;
		if (target.closest('input[type="checkbox"]') || target.closest('button')) {
			return;
		}

		selectedFrontImage = card.front_image ?? null;
		selectedBackImage = card.back_image ?? null;
		selectedTemplateDimensions = templateDimensions[card.template_name] || null;
		selectedCardGeometry = await loadGeometryForTemplate(card.template_name);
	}

	function closePreview() {
		selectedFrontImage = null;
		selectedBackImage = null;
		selectedTemplateDimensions = null;
		selectedCardGeometry = null;
	}

	// Download card
	async function downloadCard(card: IDCard) {
		const cardId = getCardId(card);
		downloadingCards.add(cardId);
		downloadingCards = downloadingCards;

		try {
			const zip = new JSZip();
			const nameField = card.fields?.['Name']?.value || card.fields?.['name']?.value || `id-${cardId}`;
			const folder = zip.folder(nameField);
			if (!folder) throw new Error('Failed to create folder');

			if (card.front_image) {
				const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
				if (frontImageUrl) {
					const frontResponse = await fetch(frontImageUrl);
					if (frontResponse.ok) {
						const frontBlob = await frontResponse.blob();
						folder.file(`${nameField}_front.jpg`, frontBlob);
					}
				}
			}

			if (card.back_image) {
				const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
				if (backImageUrl) {
					const backResponse = await fetch(backImageUrl);
					if (backResponse.ok) {
						const backBlob = await backResponse.blob();
						folder.file(`${nameField}_back.jpg`, backBlob);
					}
				}
			}

			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${nameField}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading ID card:', error);
		} finally {
			downloadingCards.delete(cardId);
			downloadingCards = downloadingCards;
		}
	}

	// Download selected cards
	async function downloadSelectedCards() {
		const selectedRows = dataRows.filter((card) => selectionManager.isSelected(getCardId(card)));
		if (selectedRows.length === 0) return;

		isBulkDownloading = true;
		bulkDownloadProgress = { current: 0, total: selectedRows.length };

		try {
			const zip = new JSZip();

			for (const card of selectedRows) {
				const cardId = getCardId(card);
				const nameField = card.fields?.['Name']?.value || `id-${cardId}`;
				const folder = zip.folder(nameField);
				
				if (folder) {
					if (card.front_image) {
						const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
						if (frontImageUrl) {
							const frontResponse = await fetch(frontImageUrl);
							if (frontResponse.ok) {
								const frontBlob = await frontResponse.blob();
								folder.file(`${nameField}_front.jpg`, frontBlob);
							}
						}
					}
					if (card.back_image) {
						const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
						if (backImageUrl) {
							const backResponse = await fetch(backImageUrl);
							if (backResponse.ok) {
								const backBlob = await backResponse.blob();
								folder.file(`${nameField}_back.jpg`, backBlob);
							}
						}
					}
				}
				
				bulkDownloadProgress.current++;
				bulkDownloadProgress = bulkDownloadProgress;
			}

			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `id-cards-${new Date().toISOString().split('T')[0]}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			selectedCards = new Set();
		} catch (error) {
			console.error('Error downloading ID cards:', error);
		} finally {
			isBulkDownloading = false;
			bulkDownloadProgress = { current: 0, total: 0 };
		}
	}

	// Delete card
	async function handleDelete(card: IDCard) {
		const cardId = getCardId(card);
		if (!cardId) return;

		deletingCards.add(cardId);
		deletingCards = deletingCards;

		try {
			const formData = new FormData();
			formData.append('cardId', cardId);

			const response = await fetch('?/deleteCard', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				dataRows = dataRows.filter((row) => getCardId(row) !== cardId);
				selectedCards.delete(cardId);
				selectedCards = new Set(selectedCards);
				totalCount--;
			}
		} catch (error) {
			console.error('Error deleting ID card:', error);
		} finally {
			deletingCards.delete(cardId);
			deletingCards = deletingCards;
		}
	}

	// Delete selected cards
	async function deleteSelectedCards() {
		const selectedRows = dataRows.filter((card) => selectionManager.isSelected(getCardId(card)));
		if (selectedRows.length === 0) return;

		if (!confirm(`Are you sure you want to delete ${selectedRows.length} ID card${selectedRows.length > 1 ? 's' : ''}?`)) {
			return;
		}

		try {
			const cardIds = selectedRows.map((card) => getCardId(card)).filter(Boolean);
			cardIds.forEach((id) => deletingCards.add(id));
			deletingCards = deletingCards;

			const formData = new FormData();
			formData.append('cardIds', JSON.stringify(cardIds));

			const response = await fetch('?/deleteMultiple', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				dataRows = dataRows.filter((card) => !cardIds.includes(getCardId(card)));
				selectedCards = new Set();
				totalCount -= cardIds.length;
			}
		} catch (error) {
			console.error('Error deleting ID cards:', error);
		} finally {
			deletingCards = new Set();
		}
	}
</script>

<div class="h-full flex flex-col overflow-hidden" in:fade={{ duration: 200 }}>
	<div class="container mx-auto px-4 py-4 flex-1 flex flex-col min-h-0 max-w-7xl">

	<!-- Controls Header -->
	<div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-xl shadow-sm mb-4">
		<!-- Search & Count -->
		<div class="flex items-center gap-4">
			<div class="relative w-full md:w-64">
				<input
					type="text"
					placeholder="Search cards..."
					class="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
					bind:value={searchQuery}
				/>
				<svg class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
			</div>
			<span class="text-sm text-muted-foreground whitespace-nowrap">
				{dataRows.length} of {totalCount} cards
			</span>
		</div>

		<!-- Actions & Toggles -->
		<div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
			{#if selectedCount > 0}
				<div class="flex gap-2">
					<button
						class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						onclick={downloadSelectedCards}
						disabled={isBulkDownloading}
					>
						{#if isBulkDownloading}
							<svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							{bulkDownloadProgress.current}/{bulkDownloadProgress.total}
						{:else}
							Download ({selectedCount})
						{/if}
					</button>
					<button
						class="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:bg-destructive/90 transition-colors shadow-sm"
						onclick={deleteSelectedCards}
					>
						Delete ({selectedCount})
					</button>
				</div>
			{/if}

			<div class="flex items-center gap-2 ml-auto border-l border-border pl-3">
				{#if $viewMode !== 'table'}
					<div class="flex items-center bg-muted rounded-lg p-0.5">
						<button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground" onclick={zoomOut}>−</button>
						<button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground" onclick={zoomIn}>+</button>
					</div>
				{/if}
				<ViewModeToggle />
			</div>
		</div>
	</div>

	<!-- Content Area -->
	{#if initialLoading}
		<!-- Initial Skeleton Loading State -->
		<div class="space-y-6">
			<div class="flex items-center gap-2">
				<div class="h-6 w-1 bg-muted rounded-full animate-pulse"></div>
				<div class="h-5 w-32 bg-muted rounded animate-pulse"></div>
				<div class="h-5 w-16 bg-muted rounded-full animate-pulse ml-auto"></div>
			</div>
			<IDCardSkeleton count={INITIAL_LOAD} minWidth={cardMinWidth} />
		</div>
	{:else if dataRows.length === 0}
		<EmptyIDs />
	{:else}
		<!-- Grid View -->
		<div class="space-y-10 overflow-auto flex-1" style="--card-min-width: {cardMinWidth}px;">
			{#each Object.entries(groupedCards) as [templateName, cards]}
				<div class="space-y-4">
					<div class="flex items-center gap-3 border-b border-border pb-2">
						<h3 class="text-lg font-semibold text-foreground">{templateName}</h3>
						<span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cards.length}</span>
					</div>

					<div class="responsive-grid">
						{#each cards as card}
							<div class="card-wrapper">
								<SimpleIDCard
									{card}
									isSelected={selectionManager.isSelected(getCardId(card))}
									onToggleSelect={() => selectionManager.toggleSelection(getCardId(card))}
									onDownload={downloadCard}
									onDelete={handleDelete}
									onOpenPreview={openPreview}
									deleting={deletingCards.has(getCardId(card))}
									downloading={downloadingCards.has(getCardId(card))}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Load More Trigger / Loading More Skeleton -->
			{#if hasMore}
				<div bind:this={loadMoreTrigger} class="py-4">
					{#if loadingMore}
						<IDCardSkeleton count={3} minWidth={cardMinWidth} />
					{:else}
						<div class="h-1"></div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	</div>
</div>

<!-- Preview Modal -->
{#if selectedFrontImage || selectedBackImage}
	<ClientOnly>
		<ImagePreviewModal
			frontImageUrl={selectedFrontImage ? getSupabaseStorageUrl(selectedFrontImage, 'rendered-id-cards') : null}
			backImageUrl={selectedBackImage ? getSupabaseStorageUrl(selectedBackImage, 'rendered-id-cards') : null}
			cardGeometry={selectedCardGeometry}
			templateDimensions={selectedTemplateDimensions}
			onClose={closePreview}
		/>
	</ClientOnly>
{/if}

<style>
	.responsive-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
		gap: 1rem;
		width: 100%;
	}

	@media (max-width: 480px) {
		.responsive-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		}
	}

	.card-wrapper {
		height: auto;
		width: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
