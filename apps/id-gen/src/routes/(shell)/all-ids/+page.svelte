<script lang="ts">
	// TIMING: Log when script module starts executing (before onMount)
	const SCRIPT_START_TIME = performance.now();
	console.log(
		'%c═══════════════════════════════════════════════════════════════',
		'color: #a855f7; font-weight: bold'
	);
	console.log(
		`%c📜 ALL-IDS SCRIPT START @ ${new Date().toISOString()}`,
		'color: #a855f7; font-weight: bold; font-size: 14px'
	);
	console.log(
		'%c═══════════════════════════════════════════════════════════════',
		'color: #a855f7; font-weight: bold'
	);
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import ClientOnly from '$lib/components/ClientOnly.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import JSZip from 'jszip';
	import { toast } from 'svelte-sonner';
	import { getProxiedUrl, getStorageUrl } from '$lib/utils/storage';
	import { createCardFromInches } from '$lib/utils/cardGeometry';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import { viewMode, detectViewportDefault } from '$lib/stores/viewMode';
	import SmartIDCard from './SmartIDCard.svelte';
	import EmptyIDs from '$lib/components/empty-states/EmptyIDs.svelte';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
	import SecureTokenBadge from '$lib/components/SecureTokenBadge.svelte';

	import type { AllIdsCacheSnapshot } from './allIdsCache';
	import {
		ALL_IDS_CACHE_TTL_MS,
		clearAllIdsCache,
		isAllIdsCacheFresh,
		readAllIdsCache,
		writeAllIdsCache
	} from './allIdsCache';

	import {
		cachedRemoteFunctionCall,
		clearRemoteFunctionCacheByPrefix
	} from '$lib/remote/remoteFunctionCache';

	// Import remote functions
	import {
		getIDCards,
		getCardDetails,
		getCardCount,
		getTemplateDimensions,
		getTemplateMetadata
	} from './data.remote';
	import type { IDCard } from './data.remote';

	// Constants
	const INITIAL_LOAD = 50;
	const LOAD_MORE_COUNT = 50;
	const VISIBLE_LIMIT = 100; // Max cards to render at once for performance
	const MAX_CACHED_CARDS = 200; // Cap cache to prevent SessionStorage overflow (~5MB limit)
	const PREFETCH_AHEAD = 100; // How many upcoming card images to prefetch

	// Logging helpers
	const LOG_PREFIX = '[AllIds]';
	const logStyles = {
		header: 'color: #6366f1; font-weight: bold; font-size: 14px;',
		cache: 'color: #22c55e; font-weight: bold;',
		fetch: 'color: #f59e0b; font-weight: bold;',
		stale: 'color: #ef4444; font-weight: bold;',
		info: 'color: #64748b;',
		data: 'color: #0ea5e9;'
	};

	function logSection(title: string, style: string = logStyles.header) {
		console.log(`%c${LOG_PREFIX} ═══════════════════════════════════════`, style);
		console.log(`%c${LOG_PREFIX} ${title}`, style);
		console.log(`%c${LOG_PREFIX} ═══════════════════════════════════════`, style);
	}

	const scopeKey = $derived.by(() => {
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
	let dataRows = $state<any[]>([]);
	let templateDimensions = $state<
		Record<
			string,
			{ width: number; height: number; orientation: 'landscape' | 'portrait'; unit: string }
		>
	>({});
	let templateFields = $state<Record<string, { variableName: string; side: string }[]>>({});

	// UI states
	let searchQuery = $state('');
	let selectedTemplateFilter = $state<string>('all'); // 'all' or template name
	let selectedColumnFilter = $state<string>('all'); // 'all' or column name
	let selectedFrontImage: string | null = $state(null);
	let selectedBackImage: string | null = $state(null);
	let selectedFilenameField = $state<string>('Name'); // Default to 'Name' field for filenames
	let selectedTemplateDimensions: { width: number; height: number; unit?: string } | null =
		$state(null);
	let selectedCardGeometry: any = $state(null);
	let downloadingCards = $state(new Set<string>());
	let deletingCards = $state(new Set<string>());
	let selectedCards = $state(new Set<string>());
	let selectedCount = $derived(selectedCards.size);
	let isBulkDownloading = $state(false);
	let bulkDownloadProgress = $state({ current: 0, total: 0 });
	let errorMessage = '';

	// IntersectionObserver action for infinite scroll — 800px lookahead for early prefetch
	function intersectionObserver(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						checkAndLoadMore();
					}
				});
			},
			{ threshold: 0.1, rootMargin: '800px' }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	// Image prefetching — preload upcoming card images before they enter viewport
	const prefetchedUrls = new Set<string>();

	function prefetchUpcomingImages() {
		if (!browser) return;

		const visibleCount = filteredCards.length;
		const endIndex = Math.min(visibleCount + PREFETCH_AHEAD, allFilteredCards.length);

		for (let i = visibleCount; i < endIndex; i++) {
			const card = allFilteredCards[i];
			const imagePath = card.front_image_low_res || card.front_image;
			if (!imagePath || prefetchedUrls.has(imagePath)) continue;

			prefetchedUrls.add(imagePath);
			const img = new Image();
			img.src = getStorageUrl(imagePath, 'cards');
		}
	}

	// Throttled scroll handler for proactive prefetch
	let scrollRafId: number | null = null;

	function onScrollPrefetch(el: HTMLElement) {
		if (scrollRafId !== null) return;
		scrollRafId = requestAnimationFrame(() => {
			scrollRafId = null;
			const { scrollTop: st, scrollHeight, clientHeight } = el;
			const scrollRemaining = scrollHeight - st - clientHeight;
			const threshold = clientHeight * 1.5; // 1.5 viewports ahead

			if (scrollRemaining < threshold) {
				checkAndLoadMore();
			}

			// Always prefetch images regardless of scroll position
			prefetchUpcomingImages();
		});
	}

	// Visible card window for performance
	let visibleStartIndex = $state(0);
	
	// Track last selected card for shift-select range
	let lastSelectedCardId = $state<string | null>(null);

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

	function updateCardData(card: IDCard) {
		const index = dataRows.findIndex((c) => getCardId(c) === card.idcard_id);
		if (index !== -1) {
			// Preserve existing properties if any, but overwrite with new data
			dataRows[index] = { ...dataRows[index], ...card };
		}
	}

	// Load initial cards
	async function loadInitialCards(opts: { forceRefresh?: boolean; background?: boolean } = {}) {
		const forceRefresh = opts.forceRefresh ?? false;
		const background = opts.background ?? false;
		const startTime = performance.now();

		console.group(`%c${LOG_PREFIX} 📥 loadInitialCards()`, logStyles.fetch);
		console.log(
			`%c├─ forceRefresh: ${forceRefresh}`,
			forceRefresh ? logStyles.stale : logStyles.info
		);
		console.log(`%c├─ background: ${background}`, logStyles.info);
		console.log(`%c├─ current dataRows.length: ${dataRows.length}`, logStyles.info);

		// Only show skeleton on first load (no data yet and not background refresh)
		if (!background && dataRows.length === 0) {
			console.log(`%c├─ 🔄 Showing skeleton (first load)`, logStyles.fetch);
			initialLoading = true;
		} else {
			console.log(`%c├─ 🔄 Showing refresh indicator (has existing data)`, logStyles.cache);
			isRefreshing = true;
		}

		try {
			console.log(`%c├─ ⏳ Calling remote functions...`, logStyles.info);
			const [result, count] = await Promise.all([
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getIDCards',
					args: { offset: 0, limit: INITIAL_LOAD },
					forceRefresh,
					fetcher: (args) => getIDCards(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true, debug: true }
				}),
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getCardCount',
					args: null as any,
					forceRefresh,
					fetcher: async (_args) => getCardCount(),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true, debug: true }
				})
			]);

			// Cards now come with full data (front_image, back_image, fields, etc.)
			const finalResult = result;

			const elapsed = (performance.now() - startTime).toFixed(2);
			console.log(`%c├─ ✅ Remote functions completed in ${elapsed}ms`, logStyles.cache);
			console.log(`%c├─ 📊 Results:`, logStyles.data);
			console.log(`%c│  ├─ cards received: ${finalResult.cards.length}`, logStyles.data);
			console.log(`%c│  ├─ total count: ${count}`, logStyles.data);
			console.log(`%c│  └─ hasMore: ${finalResult.hasMore}`, logStyles.data);

			dataRows = finalResult.cards;
			totalCount = count;
			hasMore = finalResult.hasMore;
			dataCachedAt = Date.now();

			// Load template dimensions for current cards
			console.log(`%c├─ 📐 Loading template dimensions...`, logStyles.info);
			await loadTemplateDimensionsForCards(finalResult.cards, forceRefresh);
			console.log(`%c└─ ✅ Template dimensions loaded`, logStyles.cache);
		} catch (err) {
			console.error('Error loading initial cards:', err);
			errorMessage = 'Failed to load ID cards';
		} finally {
			initialLoading = false;
			isRefreshing = false;
			console.groupEnd();
		}
	}

	// Load more cards (infinite scroll)
	async function loadMoreCards(opts: { forceRefresh?: boolean } = {}) {
		if (loadingMore || !hasMore) {
			console.log(
				`%c${LOG_PREFIX} ⏸️ loadMoreCards() skipped - loadingMore: ${loadingMore}, hasMore: ${hasMore}`,
				logStyles.info
			);
			return;
		}

		// Don't load more if we already have all cards
		if (dataRows.length >= totalCount && totalCount > 0) {
			console.log(
				`%c${LOG_PREFIX} ✅ loadMoreCards() - All cards loaded (${dataRows.length}/${totalCount})`,
				logStyles.cache
			);
			hasMore = false;
			return;
		}

		const forceRefresh = opts.forceRefresh ?? false;
		const startTime = performance.now();
		const currentOffset = dataRows.length;

		console.group(`%c${LOG_PREFIX} 📥 loadMoreCards() [offset: ${currentOffset}]`, logStyles.fetch);
		console.log(`%c├─ forceRefresh: ${forceRefresh}`, logStyles.info);
		console.log(`%c├─ current cards: ${dataRows.length}/${totalCount}`, logStyles.info);

		loadingMore = true;
		try {
			console.log(`%c├─ ⏳ Fetching next ${LOAD_MORE_COUNT} cards...`, logStyles.info);
			const result = await cachedRemoteFunctionCall({
				scopeKey,
				keyBase: 'all-ids:getIDCards',
				args: { offset: dataRows.length, limit: LOAD_MORE_COUNT },
				forceRefresh,
				fetcher: (args) => getIDCards(args),
				options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true, debug: true }
			});

			// Cards now come with full data
			const finalResult = result;

			const elapsed = (performance.now() - startTime).toFixed(2);
			console.log(`%c├─ ✅ Completed in ${elapsed}ms`, logStyles.cache);
			console.log(`%c├─ 📊 Results:`, logStyles.data);
			console.log(`%c│  ├─ new cards: ${finalResult.cards.length}`, logStyles.data);
			console.log(`%c│  └─ hasMore from server: ${finalResult.hasMore}`, logStyles.data);

			if (finalResult.cards.length > 0) {
				dataRows = [...dataRows, ...finalResult.cards];
				console.log(`%c├─ 📦 Total cards now: ${dataRows.length}`, logStyles.data);
			}

			// More accurate hasMore check based on total count
			hasMore = finalResult.hasMore && dataRows.length < totalCount;
			dataCachedAt = Date.now();
			console.log(`%c├─ 🔄 hasMore updated: ${hasMore}`, logStyles.info);

			// Load template dimensions for new cards
			if (result.cards.length > 0) {
				console.log(`%c├─ 📐 Loading template dimensions for new cards...`, logStyles.info);
				await loadTemplateDimensionsForCards(finalResult.cards, forceRefresh);
			}
			console.log(`%c└─ ✅ loadMoreCards complete`, logStyles.cache);
		} catch (err) {
			console.error('Error loading more cards:', err);
		} finally {
			loadingMore = false;
			console.groupEnd();
		}
	}

	// Show more cached cards (when we have more in cache than visible)
	function showMoreCachedCards() {
		// Ensure we don't exceed bounds
		const remaining = allFilteredCards.length - (visibleStartIndex + VISIBLE_LIMIT);
		if (remaining > 0) {
			visibleStartIndex += VISIBLE_LIMIT;
		} else {
			// Show all remaining cards
			visibleStartIndex = Math.max(0, allFilteredCards.length - VISIBLE_LIMIT);
		}
	}

	// Load template dimensions and metadata for a set of cards
	async function loadTemplateDimensionsForCards(cards: IDCard[], forceRefresh: boolean = false) {
		const newTemplateNames = [...new Set(cards.map((c) => c.template_name).filter(Boolean))].filter(
			(name) => !templateDimensions[name]
		);

		if (newTemplateNames.length > 0) {
			console.log(
				`%c${LOG_PREFIX} │  📐 Loading ${newTemplateNames.length} template(s): ${newTemplateNames.join(', ')}`,
				logStyles.info
			);

			// Load both dimensions and metadata in parallel
			const [dims, fields] = await Promise.all([
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getTemplateDimensions',
					args: newTemplateNames,
					forceRefresh,
					fetcher: (args) => getTemplateDimensions(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true, debug: true }
				}),
				cachedRemoteFunctionCall({
					scopeKey,
					keyBase: 'all-ids:getTemplateMetadata',
					args: newTemplateNames,
					forceRefresh,
					fetcher: (args) => getTemplateMetadata(args),
					options: { ttlMs: ALL_IDS_CACHE_TTL_MS, staleWhileRevalidate: true, debug: true }
				})
			]);
			templateDimensions = { ...templateDimensions, ...dims };
			templateFields = { ...templateFields, ...fields };
			console.log(
				`%c${LOG_PREFIX} │  ✅ Template data loaded for: ${newTemplateNames.join(', ')}`,
				logStyles.cache
			);
		} else {
			console.log(`%c${LOG_PREFIX} │  ✅ All template dimensions already cached`, logStyles.cache);
		}
	}

	// Load lock to prevent concurrent fetches
	let loadLock = false;

	// Check if we need to load more (called by IntersectionObserver)
	async function checkAndLoadMore() {
		if (initialLoading || !browser || loadLock) {
			return;
		}

		// 1) First: Show more cached cards if available
		if (hasMoreCachedCards) {
			console.log(
				`%c${LOG_PREFIX} 📜 checkAndLoadMore() - Showing more cached cards (${filteredCards.length}/${allFilteredCards.length} visible)`,
				logStyles.cache
			);
			loadLock = true;
			showMoreCachedCards();
			await tick();
			loadLock = false;
			return;
		}

		// 2) Then: Fetch more from server if no more cached cards
		if (hasMore && !loadingMore) {
			console.log(
				`%c${LOG_PREFIX} 🌐 checkAndLoadMore() - Fetching more from server...`,
				logStyles.fetch
			);
			await loadMoreCards();
		}
	}

	onMount(() => {
		const mountStartTime = performance.now();
		const absoluteTime = Date.now();

		console.log(
			'%c═══════════════════════════════════════════════════════════════',
			'color: #f59e0b; font-weight: bold'
		);
		console.log(
			`%c🚀 ALL-IDS PAGE MOUNT @ ${new Date(absoluteTime).toISOString()}`,
			'color: #f59e0b; font-weight: bold; font-size: 14px'
		);
		console.log(
			'%c═══════════════════════════════════════════════════════════════',
			'color: #f59e0b; font-weight: bold'
		);
		console.log(`%c├─ [T+0ms] onMount started`, 'color: #64748b');
		console.log(`%c├─ scopeKey: ${scopeKey}`, logStyles.info);

		// Apply viewport-based view mode AFTER hydration (prevents SSR mismatch)
		// Only if user hasn't explicitly set a preference in localStorage
		const storedViewMode = localStorage.getItem('id-gen-view-mode');
		if (!storedViewMode) {
			const optimalMode = detectViewportDefault();
			if (optimalMode !== $viewMode) {
				console.log(
					`%c${LOG_PREFIX} 📱 Applying viewport-based view mode: ${optimalMode}`,
					logStyles.info
				);
				viewMode.set(optimalMode);
			}
		}

		// 1) Check for cached data
		console.log(
			`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Reading cache...`,
			'color: #64748b'
		);
		const cacheReadStart = performance.now();
		const cached = readAllIdsCache(scopeKey);
		console.log(
			`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Cache read complete (${(performance.now() - cacheReadStart).toFixed(1)}ms)`,
			'color: #64748b'
		);

		if (cached) {
			const cacheAge = Date.now() - cached.cachedAt;
			const cacheAgeSeconds = (cacheAge / 1000).toFixed(1);
			const isFresh = isAllIdsCacheFresh(cached, ALL_IDS_CACHE_TTL_MS);

			console.log(
				`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] ✅ Cache HIT`,
				'color: #22c55e; font-weight: bold'
			);
			console.log(`%c│  ├─ cards: ${cached.cards.length}`, 'color: #64748b');
			console.log(
				`%c│  ├─ age: ${cacheAgeSeconds}s (${isFresh ? 'FRESH' : 'STALE'})`,
				'color: #64748b'
			);

			// Step 1: Hydrate metadata + UI state
			console.log(
				`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Hydrating metadata...`,
				'color: #64748b'
			);
			const metadataStart = performance.now();
			templateDimensions = cached.templateDimensions;
			templateFields = cached.templateFields;
			searchQuery = cached.ui.searchQuery;
			cardMinWidth = cached.ui.cardMinWidth;
			viewMode.set(cached.ui.viewMode);
			dataCachedAt = cached.cachedAt;
			totalCount = cached.totalCount;
			hasMore = cached.hasMore;
			console.log(
				`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Metadata hydrated (${(performance.now() - metadataStart).toFixed(1)}ms)`,
				'color: #64748b'
			);

			// Step 2: Schedule card hydration for next frame
			console.log(
				`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Scheduling card hydration (rAF)...`,
				'color: #64748b'
			);
			console.log(
				'%c└─ ════════════════════════════════════════════════════════════',
				'color: #f59e0b'
			);

			requestAnimationFrame(() => {
				const rafStart = performance.now();
				console.log(
					`%c├─ [T+${(rafStart - mountStartTime).toFixed(1)}ms] rAF fired - hydrating ${cached.cards.length} cards...`,
					'color: #f59e0b; font-weight: bold'
				);

				// Hydrate card data
				dataRows = cached.cards;
				initialLoading = false;
				totalCount = cached.totalCount;

				console.log(
					`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Cards assigned to state (${dataRows.length} cards)`,
					'color: #64748b'
				);

				// Wait for Svelte to finish rendering all cards to DOM
				tick().then(() => {
					console.log(
						`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] tick() complete - DOM updated`,
						'color: #22c55e'
					);
					console.log(
						'%c═══════════════════════════════════════════════════════════════',
						'color: #22c55e; font-weight: bold'
					);
					console.log(
						`%c🎉 RENDER COMPLETE @ ${new Date().toISOString()}`,
						'color: #22c55e; font-weight: bold; font-size: 14px'
					);
					console.log(
						`%c   Total time from script start to render: ${(performance.now() - SCRIPT_START_TIME).toFixed(1)}ms`,
						'color: #22c55e; font-weight: bold'
					);
					console.log(
						`%c   Total time from mount to render: ${(performance.now() - mountStartTime).toFixed(1)}ms`,
						'color: #22c55e; font-weight: bold'
					);
					console.log(
						'%c═══════════════════════════════════════════════════════════════',
						'color: #22c55e; font-weight: bold'
					);
				});

				// Restore scroll position after cards are rendered
				requestAnimationFrame(() => {
					const el = document.querySelector('.all-ids-scroll') as HTMLElement | null;
					if (el) {
						el.scrollTop = cached.scrollTop || 0;
						console.log(
							`%c├─ [T+${(performance.now() - mountStartTime).toFixed(1)}ms] Scroll restored to ${cached.scrollTop}`,
							'color: #64748b'
						);
					}
				});

				// FIXED: Background refresh must run AFTER render is complete
				// Using setTimeout to escape the current render cycle
				// This prevents isRefreshing=true from blocking tick()
				if (!isFresh) {
					console.log(`%c├─ 🔄 Cache stale - scheduling background refresh...`, 'color: #f59e0b');
					setTimeout(() => {
						console.log(`%c├─ 🔄 Starting background refresh (post-render)`, 'color: #f59e0b');
						void loadInitialCards({ forceRefresh: true, background: true });
					}, 0);
				}
			});
		} else {
			console.group(`%c${LOG_PREFIX} ❌ NO PAGE SNAPSHOT CACHE`, logStyles.fetch);
			console.log(`%c├─ 🔄 First visit or cache expired`, logStyles.info);
			console.log(`%c└─ 📥 Starting initial data fetch (showing skeleton)...`, logStyles.fetch);
			console.groupEnd();

			// First visit (no cache): do normal initial load (shows skeleton)
			loadInitialCards().then(() => {
				const totalTime = (performance.now() - mountStartTime).toFixed(2);
				logSection(`✅ PAGE LOAD COMPLETE (from NETWORK FETCH)`, logStyles.fetch);
				console.log(`%c${LOG_PREFIX} ⏱️ Total load time: ${totalTime}ms`, logStyles.fetch);
			});
		}
	});

	// Track scroll position for cache persistence + proactive prefetch
	$effect(() => {
		if (!browser || initialLoading) return;

		const el = document.querySelector('.all-ids-scroll') as HTMLElement | null;
		if (!el) return;

		const onScroll = () => {
			scrollTop = el.scrollTop;
			onScrollPrefetch(el);
		};

		el.addEventListener('scroll', onScroll, { passive: true });

		// Initial prefetch of upcoming images
		prefetchUpcomingImages();

		return () => el.removeEventListener('scroll', onScroll);
	});

	// Track if cache needs writing (only true after actual data changes)
	let cacheNeedsWrite = $state(false);
	let cacheWriteDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Mark cache as needing write when data actually changes
	$effect(() => {
		if (!browser || initialLoading) return;
		// Only mark for write when dataCachedAt changes (meaning new data was fetched)
		if (dataCachedAt) {
			cacheNeedsWrite = true;
		}
	});

	// Persist snapshot cache with debounce (only when data actually changed)
	$effect(() => {
		if (!browser || initialLoading || !cacheNeedsWrite) return;

		// Cancel any pending write
		if (cacheWriteDebounceTimer) {
			clearTimeout(cacheWriteDebounceTimer);
		}

		// Debounce: write cache after settling (e.g., after scroll stops)
		cacheWriteDebounceTimer = setTimeout(() => {
			const writeStart = performance.now();
			console.log(`%c[Cache] Starting cache write (${dataRows.length} cards)...`, 'color: #64748b');

			// Cap cached cards to prevent SessionStorage overflow
			const cardsToCache = dataRows.slice(0, MAX_CACHED_CARDS);
			const cacheHasMore = hasMore || dataRows.length > MAX_CACHED_CARDS;

			const snapshot: AllIdsCacheSnapshot = {
				version: 1,
				cachedAt: dataCachedAt || Date.now(),
				cards: cardsToCache,
				totalCount,
				hasMore: cacheHasMore,
				nextOffset: cardsToCache.length,
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
			cacheNeedsWrite = false;
			console.log(
				`%c[Cache] Cache write complete (${(performance.now() - writeStart).toFixed(1)}ms)`,
				'color: #64748b'
			);
		}, 500); // 500ms debounce - only write after activity settles
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

	// Get unique template names for filter dropdown
	let availableTemplates = $derived(
		[...new Set(dataRows.map((card) => card.template_name).filter(Boolean))].sort()
	);

	// Get unique column names from template fields metadata for filter dropdown
	let availableColumns = $derived(
		(() => {
			const columns = new Set<string>();
			// Use templateFields for actual template column data
			Object.values(templateFields).forEach((fields) => {
				fields.forEach((field) => columns.add(field.variableName));
			});
			return [...columns].sort();
		})()
	);

	// Filter cards based on search query, template filter, and column filter
	let allFilteredCards = $derived(
		(() => {
			let filtered = dataRows;

			// Template filter
			if (selectedTemplateFilter !== 'all') {
				filtered = filtered.filter((card) => card.template_name === selectedTemplateFilter);
			}

			// Column filter (only show cards that have a value in the selected column)
			if (selectedColumnFilter !== 'all') {
				filtered = filtered.filter((card) => {
					const fieldValue = card.fields?.[selectedColumnFilter]?.value;
					return fieldValue !== undefined && fieldValue !== '';
				});
			}

			// Search query filter
			if (!searchQuery.trim()) return filtered;

			const query = searchQuery.toLowerCase().trim();
			return filtered.filter((card) => {
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
		})()
	);

	// Visible cards - limited for performance, but cache stores all
	let filteredCards = $derived.by(() => {
		const sliced = allFilteredCards.slice(0, visibleStartIndex + VISIBLE_LIMIT);
		console.log(
			`%c[DEBUG] filteredCards: ${sliced.length} of ${allFilteredCards.length} (visibleStartIndex=${visibleStartIndex}, VISIBLE_LIMIT=${VISIBLE_LIMIT})`,
			'color: #ec4899'
		);
		return sliced;
	});

	// Show "load more UI" button when there are more cached cards to show
	let hasMoreCachedCards = $derived(filteredCards.length < allFilteredCards.length);

	// Group filtered cards by template
	let groupedCards = $derived(
		(() => {
			const groups: Record<string, IDCard[]> = {};
			filteredCards.forEach((card) => {
				const templateName = card.template_name || 'Unassigned';
				if (!groups[templateName]) {
					groups[templateName] = [];
				}
				groups[templateName].push(card);
			});
			return groups;
		})()
	);

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
				const cardIndex = dataRows.findIndex((c) => getCardId(c) === editingCell?.cardId);
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
		toggleSelection: (cardId: string, event?: MouseEvent | Event) => {
			if (!cardId) return;
			const newSelectedCards = new Set(selectedCards);
			
			// Handle Shift+Click Range Selection
			if (event instanceof MouseEvent && event.shiftKey && lastSelectedCardId) {
				// Use allFilteredCards to ensure we can select across the entire filtered dataset, not just the visible slice
				const currentIndex = allFilteredCards.findIndex(c => getCardId(c) === cardId);
				const lastIndex = allFilteredCards.findIndex(c => getCardId(c) === lastSelectedCardId);

				if (currentIndex !== -1 && lastIndex !== -1) {
					const start = Math.min(currentIndex, lastIndex);
					const end = Math.max(currentIndex, lastIndex);
					
					// Get all cards in the range from the full filtered dataset
					const rangeCards = allFilteredCards.slice(start, end + 1);
					
					// Add all cards in range to selection
					rangeCards.forEach(card => {
						const id = getCardId(card);
						if (id) newSelectedCards.add(id);
					});
					
					selectedCards = newSelectedCards;
					// Update anchor to the current card to allow extending the selection from here
					lastSelectedCardId = cardId;
					return;
				}
			}

			// Single Toggle Behavior
			if (newSelectedCards.has(cardId)) {
				newSelectedCards.delete(cardId);
				lastSelectedCardId = null; // Clear anchor on deselect
			} else {
				newSelectedCards.add(cardId);
				lastSelectedCardId = cardId; // Set anchor on select
			}
			selectedCards = newSelectedCards;
		},
		clearSelection: () => {
			selectedCards = new Set();
			lastSelectedCardId = null;
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

	// Helper to sanitize filenames
	function sanitizeFilename(name: string): string {
		return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	}

	// Helper to get download name based on selected field
	function getDownloadName(card: IDCard, formatField: string): string {
		// Priority: Selected Field -> 'Name' -> 'name' -> ID
		let rawName = '';
		if (formatField && formatField !== 'Name' && card.fields?.[formatField]?.value) {
			rawName = card.fields[formatField].value;
		} else if (card.fields?.['Name']?.value) {
			rawName = card.fields['Name'].value;
		} else if (card.fields?.['name']?.value) {
			rawName = card.fields['name'].value;
		} else {
			rawName = `id-${getCardId(card)}`;
		}
		return sanitizeFilename(rawName) || `id-${getCardId(card)}`;
	}

	// Helper to get file extension from URL/path
	function getFileExtension(path: string): string {
		if (!path) return 'jpg';
		// Handle data URLs
		if (path.startsWith('data:image/')) {
			const match = path.match(/data:image\/([a-zA-Z]+);base64/);
			return match ? match[1] : 'jpg';
		}
		// Handle normal paths
		const parts = path.split('.');
		if (parts.length > 1) {
			const ext = parts.pop()?.toLowerCase();
			if (ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
				return ext;
			}
		}
		return 'jpg'; // Default fallback
	}

	// Download card
	async function downloadCard(card: IDCard) {
		const cardId = getCardId(card);
		downloadingCards.add(cardId);
		downloadingCards = downloadingCards;

		try {
			const zip = new JSZip();
			const downloadName = getDownloadName(card, selectedFilenameField);
			const folder = zip.folder(downloadName);
			if (!folder) throw new Error('Failed to create folder');

			if (card.front_image) {
				const frontImageUrl = getProxiedUrl(card.front_image, 'cards');
				if (frontImageUrl) {
					const frontResponse = await fetch(frontImageUrl);
					if (frontResponse.ok) {
						const frontBlob = await frontResponse.blob();
						const ext = getFileExtension(card.front_image);
						folder.file(`${downloadName}_front.${ext}`, frontBlob);
					}
				}
			}

			if (card.back_image) {
				const backImageUrl = getProxiedUrl(card.back_image, 'cards');
				if (backImageUrl) {
					const backResponse = await fetch(backImageUrl);
					if (backResponse.ok) {
						const backBlob = await backResponse.blob();
						const ext = getFileExtension(card.back_image);
						folder.file(`${downloadName}_back.${ext}`, backBlob);
					}
				}
			}

			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${downloadName}.zip`;
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
				const downloadName = getDownloadName(card, selectedFilenameField);
				const folder = zip.folder(downloadName);

				if (folder) {
					if (card.front_image) {
						const frontImageUrl = getProxiedUrl(card.front_image, 'cards');
						if (frontImageUrl) {
							const frontResponse = await fetch(frontImageUrl);
							if (frontResponse.ok) {
								const frontBlob = await frontResponse.blob();
								const ext = getFileExtension(card.front_image);
								folder.file(`${downloadName}_front.${ext}`, frontBlob);
							}
						}
					}
					if (card.back_image) {
						const backImageUrl = getProxiedUrl(card.back_image, 'cards');
						if (backImageUrl) {
							const backResponse = await fetch(backImageUrl);
							if (backResponse.ok) {
								const backBlob = await backResponse.blob();
								const ext = getFileExtension(card.back_image);
								folder.file(`${downloadName}_back.${ext}`, backBlob);
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
				toast.success('ID card deleted successfully');
			} else {
				toast.error('Failed to delete ID card');
			}
		} catch (error) {
			console.error('Error deleting ID card:', error);
			toast.error('An error occurred while deleting the ID card');
		} finally {
			deletingCards.delete(cardId);
			deletingCards = deletingCards;
		}
	}

	// Delete selected cards
	async function deleteSelectedCards() {
		const selectedRows = dataRows.filter((card) => selectionManager.isSelected(getCardId(card)));
		if (selectedRows.length === 0) return;

		if (
			!confirm(
				`Are you sure you want to delete ${selectedRows.length} ID card${selectedRows.length > 1 ? 's' : ''}?`
			)
		) {
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
				toast.success(`Successfully deleted ${cardIds.length} ID cards`);
			} else {
				toast.error('Failed to delete selected ID cards');
			}
		} catch (error) {
			console.error('Error deleting ID cards:', error);
			toast.error('An error occurred while deleting the selected ID cards');
		} finally {
			deletingCards = new Set();
		}
	}
</script>

<div class="h-full flex flex-col overflow-hidden">
	<div class="container mx-auto px-4 py-4 flex-1 flex flex-col min-h-0 max-w-7xl">
		<!-- Controls Header -->
		<div
			class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-xl shadow-sm mb-4"
		>
			<!-- Search & Filters -->
			<div class="flex flex-wrap items-center gap-3">
				<!-- Search Input -->
				<div class="relative w-full md:w-48">
					<input
						type="text"
						placeholder="Search cards..."
						class="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
						bind:value={searchQuery}
					/>
					<svg
						class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>

				<!-- Template Filter Dropdown -->
				<select
					bind:value={selectedTemplateFilter}
					class="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
				>
					<option value="all">All Templates ({availableTemplates.length})</option>
					{#each availableTemplates as template}
						<option value={template}>{template}</option>
					{/each}
				</select>

				<!-- Column Filter Dropdown -->
				<select
					bind:value={selectedColumnFilter}
					class="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
				>
					<option value="all">All Columns ({availableColumns.length})</option>
					{#each availableColumns as column}
						<option value={column}>{column}</option>
					{/each}
				</select>

				<!-- Filename Field Dropdown -->
				<div class="relative group" title="Select field to use for file names">
					<select
						bind:value={selectedFilenameField}
						class="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary pr-8"
					>
						<option value="Name">Filename: Default (Name)</option>
						{#each availableColumns as column}
							{#if column !== 'Name'}
								<option value={column}>Filename: {column}</option>
							{/if}
						{/each}
					</select>
				</div>

				<!-- Clear Filters Button -->
				{#if searchQuery || selectedTemplateFilter !== 'all' || selectedColumnFilter !== 'all'}
					<button
						onclick={() => {
							searchQuery = '';
							selectedTemplateFilter = 'all';
							selectedColumnFilter = 'all';
						}}
						class="px-3 py-2 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
					>
						Clear filters
					</button>
				{/if}
			</div>

			<!-- Card Count -->
			<div class="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
				<span class="font-medium text-foreground">{allFilteredCards.length}</span>
				<span>of</span>
				<span>{totalCount}</span>
				<span>cards</span>
				{#if allFilteredCards.length !== dataRows.length}
					<span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">filtered</span>
				{/if}
			</div>

			<!-- Actions & Toggles -->
			<div
				class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end"
			>
				{#if selectedCount > 0}
					<div class="flex gap-2">
						<button
							class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							onclick={downloadSelectedCards}
							disabled={isBulkDownloading}
						>
							{#if isBulkDownloading}
								<svg
									class="animate-spin h-3 w-3"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
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
							<button
								class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground"
								onclick={zoomOut}>−</button
							>
							<button
								class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground"
								onclick={zoomIn}>+</button
							>
						</div>
					{/if}
					<ViewModeToggle />
				</div>
			</div>
		</div>

		<!-- Content Area -->
		{#if initialLoading}
			<!-- Card skeletons only - page structure already visible -->
			<div class="flex-1 overflow-auto all-ids-scroll">
				<div class="p-4">
					<div class="responsive-grid">
						<IDCardSkeleton count={8} minWidth={cardMinWidth} />
					</div>
				</div>
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
							<span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
								>{cards.length} items</span
							>
						</div>

						<div
							class="relative w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm"
						>
							<table class="w-full text-sm text-left">
								<thead
									class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border"
								>
									<tr>
										<th class="w-10 px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground"
												checked={cards.every((c) => selectionManager.isSelected(getCardId(c)))}
												onchange={() => {
													const allSelected = cards.every((c) =>
														selectionManager.isSelected(getCardId(c))
													);
													cards.forEach((c) => {
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
										<th class="px-4 py-3 font-medium whitespace-nowrap">SecureToken</th>
										{#if templateFields[templateName]}
											{#each templateFields[templateName] || [] as field}
												<th class="px-4 py-3 font-medium whitespace-nowrap">{field.variableName}</th
												>
											{/each}
										{/if}
										<th class="px-4 py-3 font-medium text-right">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each cards as card}
										{@const dims = templateDimensions[card.template_name]}
										{@const isPortrait = dims ? dims.height > dims.width : false}
										<tr class="hover:bg-muted/30 transition-colors group {selectionManager.isSelected(getCardId(card)) ? 'bg-primary/10' : ''}">
											<td class="px-4 py-3">
												<input
													type="checkbox"
													class="rounded border-muted-foreground"
													checked={selectionManager.isSelected(getCardId(card))}
													onclick={(e) => e.stopPropagation()} 
													onchange={(e) => selectionManager.toggleSelection(getCardId(card), e)}
												/>
											</td>
											<td class="px-4 py-2" onclick={(e) => openPreview(e, card)}>
												<div
													class="bg-muted rounded overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors flex items-center justify-center"
													style="width: {isPortrait ? '28px' : '48px'}; height: {isPortrait
														? '44px'
														: '30px'};"
												>
													{#if card.front_image}
														<img
															src={getProxiedUrl(card.front_image, 'cards')}
															alt="Thumb"
															class="w-full h-full"
															loading="lazy"
														/>
													{/if}
												</div>
											</td>
											<td class="px-4 py-3">
												<SecureTokenBadge
													slug={card.digital_card?.slug}
													status={card.digital_card?.status}
													showLink={true}
													compact={false}
												/>
											</td>
											{#if templateFields[templateName]}
												{#each templateFields[templateName] || [] as field}
													<td
														class="px-4 py-3 whitespace-nowrap text-foreground cursor-pointer hover:bg-muted/50"
														ondblclick={() =>
															startEditing(
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
												<div
													class="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<button
														class="p-1.5 hover:bg-muted rounded text-blue-500"
														onclick={() => downloadCard(card)}
														title="Download"
													>
														<svg
															class="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
															/>
														</svg>
													</button>
													<button
														class="p-1.5 hover:bg-muted rounded text-red-500"
														onclick={() => handleDelete(card)}
														title="Delete"
													>
														<svg
															class="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
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

				<!-- Load More Trigger (IntersectionObserver sentinel) -->
				{#if hasMore || hasMoreCachedCards}
					<div class="py-6" use:intersectionObserver>
						{#if loadingMore}
							<div class="flex flex-col items-center gap-2">
								<div class="flex items-center gap-3 text-primary">
									<svg
										class="animate-spin h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span class="text-sm font-medium">Fetching more cards...</span>
								</div>
								<span class="text-xs text-muted-foreground"
									>{dataRows.length} of {totalCount} loaded</span
								>
							</div>
						{:else if hasMoreCachedCards}
							<div class="flex flex-col items-center gap-2">
								<div class="flex items-center gap-3 text-primary">
									<svg
										class="animate-spin h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span class="text-sm font-medium">Loading more cards...</span>
								</div>
								<span class="text-xs text-muted-foreground"
									>{filteredCards.length} of {allFilteredCards.length} displayed</span
								>
							</div>
						{:else}
							<div class="h-1"></div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Grid View -->
			<div
				class="space-y-10 overflow-auto flex-1 all-ids-scroll"
				style="--card-min-width: {cardMinWidth}px;"
			>
				{#each Object.entries(groupedCards) as [templateName, cards]}
					<div class="space-y-4">
						<div class="flex items-center gap-3 border-b border-border pb-2">
							<h3 class="text-lg font-semibold text-foreground">{templateName}</h3>
							<span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
								>{cards.length}</span
							>
						</div>

						<div class="responsive-grid">
							{#each cards as card}
								<div class="card-wrapper">
									<SmartIDCard
										id={getCardId(card)}
										initialData={card}
										minWidth={cardMinWidth}
										onDataLoaded={updateCardData}
										isSelected={selectionManager.isSelected(getCardId(card))}
										onToggleSelect={(c, e) => selectionManager.toggleSelection(getCardId(card), e)}
										onDownload={downloadCard}
										onDelete={handleDelete}
										onOpenPreview={openPreview}
										deleting={deletingCards.has(getCardId(card))}
										downloading={downloadingCards.has(getCardId(card))}
										templateDimensions={templateDimensions[card.template_name] || null}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Load More Trigger (IntersectionObserver sentinel) -->
				{#if hasMore || hasMoreCachedCards}
					<div class="py-6" use:intersectionObserver>
						{#if loadingMore}
							<div class="flex flex-col items-center gap-2 mb-4">
								<div class="flex items-center gap-3 text-primary">
									<svg
										class="animate-spin h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span class="text-sm font-medium">Fetching more cards...</span>
								</div>
								<span class="text-xs text-muted-foreground"
									>{dataRows.length} of {totalCount} loaded</span
								>
							</div>
							<div class="responsive-grid">
								<IDCardSkeleton count={3} minWidth={cardMinWidth} />
							</div>
						{:else if hasMoreCachedCards}
							<div class="flex flex-col items-center gap-2">
								<div class="flex items-center gap-3 text-primary">
									<svg
										class="animate-spin h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span class="text-sm font-medium">Loading more cards...</span>
								</div>
								<span class="text-xs text-muted-foreground"
									>{filteredCards.length} of {allFilteredCards.length} displayed</span
								>
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
			frontImageUrl={selectedFrontImage ? getProxiedUrl(selectedFrontImage, 'cards') : null}
			backImageUrl={selectedBackImage ? getProxiedUrl(selectedBackImage, 'cards') : null}
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
