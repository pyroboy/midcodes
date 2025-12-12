<script lang="ts">
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
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

	import type { AllIdsCacheSnapshot } from './allIdsCache';
	import {
		ALL_IDS_CACHE_TTL_MS,
		clearAllIdsCache,
		isAllIdsCacheFresh,
		readAllIdsCache,
		writeAllIdsCache
	} from './allIdsCache';

	import { cachedRemoteFunctionCall, clearRemoteFunctionCacheByPrefix } from '$lib/remote/remoteFunctionCache';
	
	// Import remote functions
	import { getIDCards, getCardCount, getTemplateDimensions, getTemplateMetadata } from './data.remote';
	import type { IDCard } from './data.remote';

	// Constants
	const INITIAL_LOAD = 20;
	const LOAD_MORE_COUNT = 15;
	const VISIBLE_LIMIT = 15; // Max cards to render at once for performance

	const scopeKey = $derived(() => {
		const d = $page.data as any;
		const userId = d?.user?.id ?? 'anon';
		const orgId = d?.org_id ?? 'no-org';
		return `${userId}:${orgId}`;
	});

	function clearAllIdsRemoteCache() {
		clearRemoteFunctionCacheByPrefix(`idgen:rf:v1:${scopeKey}:all-ids:`);
	}

	// Loading states
	let initialLoading = $state(true);
	let loadingMore = $state(false);
	let isRefreshing = $state(false);
	let hasMore = $state(true);
	let totalCount = $state(0);

	// Cache timestamps (do NOT update on UI-only changes)
	let dataCachedAt = $state(0);

	// Scroll restoration (internal scroll container)
	let scrollTop = $state(0);

	// Data states
	let dataRows = $state<IDCard[]>([]);
	let templateDimensions = $state<Record<string, { width: number; height: number; unit: string }>>({});
	let templateFields = $state<Record<string, { variableName: string; side: string }[]>>({});
	
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
	let loadMoreTrigger = $state<HTMLDivElement | null>(null);
	let observer: IntersectionObserver | null = null;
	
	// Visible card window for performance
	let visibleStartIndex = $state(0);

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
	async function loadInitialCards(opts: { forceRefresh?: boolean; background?: boolean } = {}) {
		const forceRefresh = opts.forceRefresh ?? false;
		const background = opts.background ?? false;

		// Only show skeleton on first load (no data yet and not background refresh)
		if (!background && dataRows.length === 0) {
			initialLoading = true;
		} else {
			isRefreshing = true;
		}

		try {
			const [result, count] = await Promise.all([
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getIDCards',
					args: { offset: 0, limit: INITIAL_LOAD },
					forceRefresh,
					fetcher: (args) => getIDCards(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true }
				}),
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getCardCount',
					args: null as any,
					forceRefresh,
					fetcher: async (_args) => getCardCount(),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true }
				})
			]);

			dataRows = result.cards;
			totalCount = count;
			hasMore = result.hasMore;
			dataCachedAt = Date.now();

			// Load template dimensions for current cards
			await loadTemplateDimensionsForCards(result.cards, forceRefresh);
		} catch (err) {
			console.error('Error loading initial cards:', err);
			errorMessage = 'Failed to load ID cards';
		} finally {
			initialLoading = false;
			isRefreshing = false;
		}
	}

	// Load more cards (infinite scroll)
	async function loadMoreCards(opts: { forceRefresh?: boolean } = {}) {
		if (loadingMore || !hasMore) return;
		
		// Don't load more if we already have all cards
		if (dataRows.length >= totalCount && totalCount > 0) {
			hasMore = false;
			return;
		}

		const forceRefresh = opts.forceRefresh ?? false;

		loadingMore = true;
		try {
			const result = await cachedRemoteFunctionCall({
				scopeKey,
				keyBase: 'all-ids:getIDCards',
				args: { offset: dataRows.length, limit: LOAD_MORE_COUNT },
				forceRefresh,
				fetcher: (args) => getIDCards(args),
				options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true }
			});

			if (result.cards.length > 0) {
				dataRows = [...dataRows, ...result.cards];
			}
			
			// More accurate hasMore check based on total count
			hasMore = result.hasMore && dataRows.length < totalCount;
			dataCachedAt = Date.now();

			// Load template dimensions for new cards
			if (result.cards.length > 0) {
				await loadTemplateDimensionsForCards(result.cards, forceRefresh);
			}
		} catch (err) {
			console.error('Error loading more cards:', err);
		} finally {
			loadingMore = false;
		}
	}
	
	// Show more cached cards (when we have more in cache than visible)
	function showMoreCachedCards() {
		visibleStartIndex += VISIBLE_LIMIT;
	}

	// Load template dimensions and metadata for a set of cards
	async function loadTemplateDimensionsForCards(cards: IDCard[], forceRefresh: boolean = false) {
		const newTemplateNames = [...new Set(cards.map((c) => c.template_name).filter(Boolean))].filter(
			(name) => !templateDimensions[name]
		);

		if (newTemplateNames.length > 0) {
			// Load both dimensions and metadata in parallel
			const [dims, fields] = await Promise.all([
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getTemplateDimensions',
					args: newTemplateNames,
					forceRefresh,
					fetcher: (args) => getTemplateDimensions(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true }
				}),
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getTemplateMetadata',
					args: newTemplateNames,
					forceRefresh,
					fetcher: (args) => getTemplateMetadata(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true }
				})
			]);
			templateDimensions = { ...templateDimensions, ...dims };
			templateFields = { ...templateFields, ...fields };
		}
	}

	// Setup infinite scroll via scroll event listener
	let scrollCleanup: (() => void) | null = null;
	
	function setupScrollListener() {
		if (!browser) return;
		
		// Cleanup previous listener
		scrollCleanup?.();
		
		// Find the scroll container
		const scrollContainer = document.querySelector('.all-ids-scroll') as HTMLElement | null;
		if (!scrollContainer) return;
		
		const handleScroll = () => {
			scrollTop = scrollContainer.scrollTop;
		};
		
		scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		scrollCleanup = () => scrollContainer.removeEventListener('scroll', handleScroll);
	}
	
	// Debounce timer for scroll check
	let scrollCheckTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShowingMoreCards = false; // Guard to prevent recursive triggers
	
	// Check if we need to load more based on scroll position
	function checkAndLoadMore() {
		if (initialLoading || !browser || isShowingMoreCards) return;
		
		const scrollContainer = document.querySelector('.all-ids-scroll') as HTMLElement | null;
		if (!scrollContainer) return;
		
		const { scrollHeight, clientHeight, scrollTop: currentScrollTop } = scrollContainer;
		const distanceFromBottom = scrollHeight - currentScrollTop - clientHeight;
		
		// Load more when within 600px of bottom (generous threshold for smoother UX)
		if (distanceFromBottom < 600) {
			// 1) First: Show more cached cards if available
			if (hasMoreCachedCards) {
				isShowingMoreCards = true;
				showMoreCachedCards();
				// Wait for DOM to settle, then check if we need to load even more
				setTimeout(() => {
					isShowingMoreCards = false;
					// Re-check after DOM update - this creates a chain of loads when at bottom
					checkAndLoadMore();
				}, 50);
				return; // Don't proceed to server fetch yet
			}
			
			// 2) Then: Fetch more from server if no more cached cards
			// or if we're running low on cached cards
			const cachedRemaining = allFilteredCards.length - filteredCards.length;
			if (hasMore && !loadingMore && cachedRemaining < LOAD_MORE_COUNT) {
				loadMoreCards();
			}
		}
	}
	
	// Debounced scroll check - only triggered by actual user scrolling
	function debouncedScrollCheck() {
		if (scrollCheckTimeout) {
			clearTimeout(scrollCheckTimeout);
		}
		scrollCheckTimeout = setTimeout(() => {
			checkAndLoadMore();
		}, 100); // 100ms debounce
	}

	onMount(() => {
		// 1) Hydrate immediately from route snapshot cache (no skeleton on back)
		const cached = readAllIdsCache(scopeKey);
		if (cached) {
			dataRows = cached.cards;
			totalCount = cached.totalCount;
			hasMore = cached.hasMore;
			templateDimensions = cached.templateDimensions;
			templateFields = cached.templateFields;

			searchQuery = cached.ui.searchQuery;
			cardMinWidth = cached.ui.cardMinWidth;
			viewMode.set(cached.ui.viewMode);

			scrollTop = cached.scrollTop;
			dataCachedAt = cached.cachedAt;

			initialLoading = false;

			// Restore scroll position after DOM paint
			void tick().then(() => {
				const el = document.querySelector('.all-ids-scroll') as HTMLElement | null;
				if (el) el.scrollTop = cached.scrollTop || 0;
			});

			// 2) If stale, refresh in background (keep current list rendered)
			if (!isAllIdsCacheFresh(cached, ALL_IDS_CACHE_TTL_MS)) {
				void loadInitialCards({ forceRefresh: true, background: true });
			}
		} else {
			// First visit (no cache): do normal initial load (shows skeleton)
			loadInitialCards();
		}

		return () => {
			scrollCleanup?.();
			if (scrollCheckTimeout) clearTimeout(scrollCheckTimeout);
		};
	});

	// Setup scroll listener after initial load and when view mode changes
	$effect(() => {
		const _ = $viewMode; // Subscribe to viewMode changes
		if (!initialLoading) {
			// Small delay to ensure DOM is updated after view mode change
			setTimeout(() => {
				setupScrollListener();
				// Also check if we need to load more initially (e.g., content doesn't fill viewport)
				checkAndLoadMore();
			}, 100);
		}
	});

	// Direct scroll event handler - triggers debounced load check
	$effect(() => {
		if (!browser) return;
		if (initialLoading) return;

		const el = document.querySelector('.all-ids-scroll') as HTMLElement | null;
		if (!el) return;

		const onScroll = () => {
			scrollTop = el.scrollTop;
			// Use debounced check instead of direct checkAndLoadMore
			debouncedScrollCheck();
		};

		el.addEventListener('scroll', onScroll, { passive: true });
		return () => el.removeEventListener('scroll', onScroll);
	});

	// Persist snapshot cache (do not update cachedAt here; only update dataCachedAt on fetch/mutations)
	$effect(() => {
		if (!browser) return;
		if (initialLoading) return;

		const snapshot: AllIdsCacheSnapshot = {
			version: 1,
			cachedAt: dataCachedAt || Date.now(),
			cards: dataRows,
			totalCount,
			hasMore,
			nextOffset: dataRows.length,
			templateDimensions,
			templateFields,
			ui: {
				searchQuery,
				cardMinWidth,
				viewMode: $viewMode
			},
			scrollTop
		};

		writeAllIdsCache(snapshot, scopeKey);
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

	// Filter cards based on search query
	let allFilteredCards = $derived((() => {
		if (!searchQuery.trim()) return dataRows;
		
		const query = searchQuery.toLowerCase().trim();
		return dataRows.filter(card => {
			// Search in template name
			if (card.template_name?.toLowerCase().includes(query)) return true;
			// Search in field values
			if (card.fields) {
				for (const key of Object.keys(card.fields)) {
					const value = card.fields[key]?.value;
					if (value?.toLowerCase().includes(query)) return true;
				}
			}
			return false;
		});
	})());
	
	// Visible cards - limited for performance, but cache stores all
	let filteredCards = $derived(allFilteredCards.slice(0, visibleStartIndex + VISIBLE_LIMIT));
	
	// Show "load more UI" button when there are more cached cards to show
	let hasMoreCachedCards = $derived(filteredCards.length < allFilteredCards.length);

	// Group filtered cards by template
	let groupedCards = $derived((() => {
		const groups: Record<string, IDCard[]> = {};
		filteredCards.forEach((card) => {
			const templateName = card.template_name || 'Unassigned';
			if (!groups[templateName]) {
				groups[templateName] = [];
			}
			groups[templateName].push(card);
		});
		return groups;
	})());

	// Editing state for inline field editing
	let editingCell = $state<{ cardId: string; fieldName: string } | null>(null);
	let editValue = $state('');
	let savingCell = $state(false);

	// Start editing a cell
	function startEditing(cardId: string, fieldName: string, currentValue: string) {
		editingCell = { cardId, fieldName };
		editValue = currentValue;
		// Focus input after DOM updates
		setTimeout(() => {
			const input = document.getElementById(`edit-${cardId}-${fieldName}`);
			if (input instanceof HTMLInputElement) {
				input.focus();
				input.select();
			}
		}, 0);
	}

	// Save edit
	async function saveEdit() {
		if (!editingCell || savingCell) return;
		
		savingCell = true;
		try {
			const formData = new FormData();
			formData.append('cardId', editingCell.cardId);
			formData.append('fieldName', editingCell.fieldName);
			formData.append('fieldValue', editValue);

			const response = await fetch('?/updateField', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Update local data
				const cardIndex = dataRows.findIndex(c => getCardId(c) === editingCell?.cardId);
				if (cardIndex !== -1 && editingCell) {
					const card = dataRows[cardIndex];
					if (!card.fields) card.fields = {};
					card.fields[editingCell.fieldName] = { value: editValue, side: 'front' };
					dataRows = [...dataRows];
				}
			}
		} catch (error) {
			console.error('Error saving field:', error);
		} finally {
			editingCell = null;
			editValue = '';
			savingCell = false;
		}
	}

	// Handle keyboard in edit mode
	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			editingCell = null;
			editValue = '';
		}
	}

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
				dataCachedAt = Date.now();

				// Ensure remote-function pages don't remain stale after mutations
				clearAllIdsRemoteCache();
				clearAllIdsCache(scopeKey);
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
				dataCachedAt = Date.now();

				clearAllIdsRemoteCache();
				clearAllIdsCache(scopeKey);
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
				<button
					class="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isRefreshing || initialLoading}
					onclick={async () => {
						// Keep old content visible while revalidating
						isRefreshing = true;
						clearAllIdsRemoteCache();
						clearAllIdsCache(scopeKey);
						await loadInitialCards({ forceRefresh: true, background: true });

						// Optionally scroll to top after refresh
						await tick();
						const el = document.querySelector('.all-ids-scroll') as HTMLElement | null;
						if (el) el.scrollTop = 0;
						isRefreshing = false;
					}}
				>
					{isRefreshing ? 'Refreshing…' : 'Refresh'}
				</button>

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
	{:else if $viewMode === 'table'}
		<!-- Table View -->
		<div class="space-y-8 overflow-auto flex-1 all-ids-scroll">
			{#each Object.entries(groupedCards) as [templateName, cards]}
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
							<div class="h-6 w-1 bg-primary rounded-full"></div>
							{templateName}
						</h3>
						<span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{cards.length} items</span>
					</div>

					<div class="relative w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
						<table class="w-full text-sm text-left">
							<thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
								<tr>
									<th class="w-10 px-4 py-3">
										<input
											type="checkbox"
											class="rounded border-muted-foreground"
											checked={cards.every(c => selectionManager.isSelected(getCardId(c)))}
											onchange={() => {
												const allSelected = cards.every(c => selectionManager.isSelected(getCardId(c)));
												cards.forEach(c => {
													const cardId = getCardId(c);
													if (allSelected) {
														selectedCards.delete(cardId);
													} else {
														selectedCards.add(cardId);
													}
												});
												selectedCards = new Set(selectedCards);
											}}
										/>
									</th>
									<th class="px-4 py-3 font-medium">Preview</th>
									{#if templateFields[templateName]}
										{#each templateFields[templateName] || [] as field}
											<th class="px-4 py-3 font-medium whitespace-nowrap">{field.variableName}</th>
										{/each}
									{/if}
									<th class="px-4 py-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each cards as card}
									<tr class="hover:bg-muted/30 transition-colors group">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground"
												checked={selectionManager.isSelected(getCardId(card))}
												onchange={() => selectionManager.toggleSelection(getCardId(card))}
											/>
										</td>
										<td class="px-4 py-2 w-24" onclick={(e) => openPreview(e, card)}>
											<div class="h-10 w-16 bg-muted rounded overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors">
												{#if card.front_image}
													<img
														src={getSupabaseStorageUrl(card.front_image, 'rendered-id-cards')}
														alt="Thumb"
														class="w-full h-full object-cover"
														loading="lazy"
													/>
												{/if}
											</div>
										</td>
										{#if templateFields[templateName]}
											{#each templateFields[templateName] || [] as field}
												<td
													class="px-4 py-3 whitespace-nowrap text-foreground cursor-pointer hover:bg-muted/50"
													ondblclick={() => startEditing(
														getCardId(card),
														field.variableName,
														card.fields?.[field.variableName]?.value || ''
													)}
													title="Double-click to edit"
												>
													{#if editingCell?.cardId === getCardId(card) && editingCell?.fieldName === field.variableName}
														<input
															id="edit-{getCardId(card)}-{field.variableName}"
															type="text"
															bind:value={editValue}
															onkeydown={handleEditKeydown}
															onblur={saveEdit}
															class="w-full px-2 py-1 text-sm border border-primary rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
															disabled={savingCell}
														/>
													{:else}
														{card.fields?.[field.variableName]?.value || '-'}
													{/if}
												</td>
											{/each}
										{/if}
										<td class="px-4 py-3 text-right">
											<div class="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													class="p-1.5 hover:bg-muted rounded text-blue-500"
													onclick={() => downloadCard(card)}
													title="Download"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
													</svg>
												</button>
												<button
													class="p-1.5 hover:bg-muted rounded text-red-500"
													onclick={() => handleDelete(card)}
													title="Delete"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
													</svg>
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
			
			<!-- Load More Trigger -->
			{#if hasMore || hasMoreCachedCards}
				<div class="py-4">
					{#if loadingMore}
						<div class="text-center text-muted-foreground text-sm">
							Loading more… {dataRows.length} of {totalCount}
						</div>
					{:else if hasMoreCachedCards}
						<div class="text-center text-muted-foreground text-xs">
							Showing {filteredCards.length} of {allFilteredCards.length} loaded • {dataRows.length} of {totalCount} total
						</div>
					{:else}
						<div class="h-1"></div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Grid View -->
		<div class="space-y-10 overflow-auto flex-1 all-ids-scroll" style="--card-min-width: {cardMinWidth}px;">
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
			
			<!-- Load More Trigger -->
			{#if hasMore || hasMoreCachedCards}
				<div class="py-4">
					{#if loadingMore}
						<div class="text-center text-muted-foreground text-sm mb-3">
							Loading more… {dataRows.length} of {totalCount}
						</div>
						<IDCardSkeleton count={3} minWidth={cardMinWidth} />
					{:else if hasMoreCachedCards}
						<div class="text-center text-muted-foreground text-xs">
							Showing {filteredCards.length} of {allFilteredCards.length} loaded • {dataRows.length} of {totalCount} total
						</div>
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
