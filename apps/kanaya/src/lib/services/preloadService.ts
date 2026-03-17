/**
 * Preload Service - Smart Navigation Preloading
 *
 * Features:
 * - Three-tier loading: Structure -> Server Data -> Assets
 * - Persistent state across page reloads via sessionStorage
 * - Current page awareness to skip redundant work
 * - Sequential priority queue
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { preloadData } from '$app/navigation';
import { page } from '$app/stores';
import { preloadImages, getRouteAssets } from './assetPreloader';

// Route preload state - Three-tier system
export interface RoutePreloadState {
	href: string;
	structure: 'idle' | 'loading' | 'ready'; // Tier 1: HTML/JS bundle
	serverData: 'idle' | 'loading' | 'ready'; // Tier 2: Server load data
	assets: 'idle' | 'loading' | 'ready'; // Tier 3: Images/media
	progress: number; // 0-100 (visual combined progress)
	serverDataLoadedAt?: number; // Timestamp when server data was cached
	lastNavigatedAt?: number; // Timestamp when user last navigated to this route
	wasCached?: boolean; // Whether the last navigation was served from cache
}

// Dependency keys registered by each route's load function
export const ROUTE_DEPENDENCIES: Record<string, string[]> = {
	'/': ['app:templates', 'app:recent-cards', 'app:template-assets'],
	'/all-ids': ['app:idcards'],
	'/templates': ['app:templates'],
	'/account': ['app:user-profile', 'app:credits'],
	'/pricing': ['app:user-profile', 'app:credits']
};

// Main routes to preload in priority order
export const PRELOAD_ROUTES = ['/', '/all-ids', '/templates', '/account', '/pricing'];

// Initial state factory
const createInitialState = (): Map<string, RoutePreloadState> => {
	const map = new Map();
	PRELOAD_ROUTES.forEach((href) => {
		map.set(href, {
			href,
			structure: 'idle',
			serverData: 'idle',
			assets: 'idle',
			progress: 0
		});
	});
	return map;
};

// Store for preload states
export const preloadStates = writable<Map<string, RoutePreloadState>>(createInitialState());

// Derived store for easy access
export const getPreloadState = (href: string) => {
	return derived(preloadStates, ($states) => $states.get(href));
};

// Configuration
const IDLE_TIMEOUT_MS = 2000;
const PRELOAD_DELAY_MS = 300;
const SESSION_KEY = 'idgen_preload_state_v2'; // Bumped version for new structure

// Runtime state
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let isPreloading = false;
let currentRouteIndex = 0;
let currentPath = '/';

// Load persisted state from sessionStorage
function restoreState() {
	if (!browser) return;

	try {
		const saved = sessionStorage.getItem(SESSION_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			const restoredMap = new Map();

			// Hydrate map
			PRELOAD_ROUTES.forEach((href) => {
				const savedState = parsed.find((s: any) => s.href === href);
				if (savedState) {
					// Don't restore 'loading' states, reset them to idle
					const structure =
						savedState.structure === 'loading' ? 'idle' : savedState.structure || 'idle';
					const serverData =
						savedState.serverData === 'loading' ? 'idle' : savedState.serverData || 'idle';
					const assets = savedState.assets === 'loading' ? 'idle' : savedState.assets || 'idle';

					restoredMap.set(href, { ...savedState, structure, serverData, assets });
				} else {
					restoredMap.set(href, {
						href,
						structure: 'idle',
						serverData: 'idle',
						assets: 'idle',
						progress: 0
					});
				}
			});

			preloadStates.set(restoredMap);
		}
	} catch (e) {
		console.warn('Failed to restore preload state', e);
	}
}

// Save state to sessionStorage
function persistState() {
	if (!browser) return;

	const states = get(preloadStates);
	const serializable = Array.from(states.values());
	sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializable));
}

// Update a route's state
function updateRouteState(href: string, updates: Partial<RoutePreloadState>) {
	preloadStates.update((states) => {
		const current = states.get(href);
		if (!current) return states;

		// Calculate visual progress - Three tiers: 0-33%, 34-66%, 67-100%
		let progress = current.progress;

		const nextStructure = updates.structure || current.structure;
		const nextServerData = updates.serverData || current.serverData;
		const nextAssets = updates.assets || current.assets;

		if (nextStructure === 'ready') progress = Math.max(progress, 33);
		if (nextServerData === 'ready') progress = Math.max(progress, 66);
		if (nextAssets === 'ready') progress = 100;
		if (nextStructure === 'idle' && nextServerData === 'idle' && nextAssets === 'idle')
			progress = 0;

		states.set(href, { ...current, ...updates, progress });
		return new Map(states);
	});

	persistState();
}

// Preload structure (Tier 1) - just marks as ready since SvelteKit bundles are automatic
async function preloadStructure(href: string): Promise<boolean> {
	const state = get(preloadStates).get(href);
	if (state?.structure === 'ready') return true;

	updateRouteState(href, { structure: 'loading' });

	// Structure is essentially instant - SvelteKit handles JS bundle caching
	// We just mark it as ready to show in the debug panel
	await new Promise((r) => setTimeout(r, 50)); // Small delay for visual feedback
	updateRouteState(href, { structure: 'ready' });
	return true;
}

// Preload server data (Tier 2) - triggers server load functions
async function preloadServerData(href: string): Promise<boolean> {
	const state = get(preloadStates).get(href);
	if (state?.serverData === 'ready') return true;

	// Can't load server data if structure isn't ready
	if (state?.structure !== 'ready') return false;

	updateRouteState(href, { serverData: 'loading' });

	try {
		// Preload SvelteKit data (triggers load function and caches result)
		await preloadData(href);

		// Record timestamp when server data was cached
		updateRouteState(href, { serverData: 'ready', serverDataLoadedAt: Date.now() });
		console.log(`[Preload] Server data cached for ${href}`);
		return true;
	} catch (error) {
		console.warn(`Failed to preload server data for ${href}:`, error);
		updateRouteState(href, { serverData: 'idle' }); // Reset on error so we can try again
		return false;
	}
}

// Preload heavy assets (Tier 3)
async function preloadAssets(href: string): Promise<boolean> {
	// Skip if already ready
	const state = get(preloadStates).get(href);
	if (state?.assets === 'ready') return true;

	// Can't load assets if server data isn't ready
	if (state?.serverData !== 'ready') return false;

	updateRouteState(href, { assets: 'loading' });

	try {
		const assets = getRouteAssets(href);
		if (assets.length > 0) {
			await preloadImages(assets);
		}

		// Simulate network delay for other assets that might be fetched
		// This gives time for the browser to breathe between heavy tasks
		await new Promise((r) => setTimeout(r, 100));

		updateRouteState(href, { assets: 'ready' });
		return true;
	} catch (error) {
		console.warn(`Failed to preload assets for ${href}:`, error);
		updateRouteState(href, { assets: 'idle' });
		return false;
	}
}

// Main sequential preload loop - Three-tier progressive loading
async function preloadSequentially(startIndex: number = 0) {
	if (!browser || isPreloading) return;

	isPreloading = true;
	currentRouteIndex = startIndex;

	// Loop 1: Structure (High Priority - instant)
	for (let i = 0; i < PRELOAD_ROUTES.length; i++) {
		const href = PRELOAD_ROUTES[i];
		if (href === currentPath) continue;
		await preloadStructure(href);
	}

	// Loop 2: Server Data (Medium Priority - background fetch)
	for (let i = 0; i < PRELOAD_ROUTES.length; i++) {
		const href = PRELOAD_ROUTES[i];
		if (href === currentPath) continue;

		await preloadServerData(href);

		// Small breather between server requests
		await new Promise((r) => setTimeout(r, 100));
	}

	// Loop 3: Heavy Assets (Lazy Priority)
	for (let i = 0; i < PRELOAD_ROUTES.length; i++) {
		const href = PRELOAD_ROUTES[i];
		if (href === currentPath) continue;

		// Use requestIdleCallback for asset loading to not block main thread
		if ('requestIdleCallback' in window) {
			await new Promise<void>((resolve) => {
				(window as any).requestIdleCallback(
					async () => {
						await preloadAssets(href);
						resolve();
					},
					{ timeout: 2000 }
				);
			});
		} else {
			await preloadAssets(href);
		}

		// Larger breather between asset batches
		await new Promise((r) => setTimeout(r, PRELOAD_DELAY_MS));
	}

	isPreloading = false;
}

// Reset idle timer on user interaction
function resetIdleTimer() {
	if (idleTimer) clearTimeout(idleTimer);

	idleTimer = setTimeout(() => {
		preloadSequentially(0); // Start from beginning to check for any missed items
	}, IDLE_TIMEOUT_MS);
}

// Initialize preload service
export function initPreloadService() {
	if (!browser) return;

	restoreState();

	// Subscribe to page store to track current location
	// We use a simplified version here since we can't easily subscribe
	// to $page inside init without passing it in
	// Ideally this is called from root layout where $page is available

	// Listen for user interactions to reset idle timer
	const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
	events.forEach((event) => {
		window.addEventListener(event, resetIdleTimer, { passive: true });
	});

	// Start initial idle timer
	resetIdleTimer();

	// Return cleanup function
	return () => {
		if (idleTimer) clearTimeout(idleTimer);
		events.forEach((event) => {
			window.removeEventListener(event, resetIdleTimer);
		});
	};
}

// Update current path helper (monitor navigation)
export function updateCurrentPath(path: string) {
	currentPath = path;

	// Check if this navigation was served from cache (serverData was already fetched)
	const state = get(preloadStates).get(path);
	const wasCached = state?.serverData === 'ready' && state?.serverDataLoadedAt !== undefined;
	const now = Date.now();

	// Mark current path as fully loaded since user is there
	updateRouteState(path, {
		structure: 'ready',
		serverData: 'ready',
		assets: 'ready',
		lastNavigatedAt: now,
		wasCached,
		// If wasn't cached before, set serverDataLoadedAt now
		serverDataLoadedAt: state?.serverDataLoadedAt || now
	});

	if (browser) {
		console.log(
			`[Preload] Navigate to ${path}: ${wasCached ? '✅ CACHED (no server fetch needed)' : '🔄 Fresh fetch'}`
		);
	}
}

// Check if running on mobile
export function isMobile(): boolean {
	if (!browser) return false;
	return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Get pagination limit based on device
export function getPageLimit(type: 'ids' | 'templates'): number {
	const mobile = isMobile();
	if (type === 'ids') {
		return mobile ? 10 : 20;
	}
	return mobile ? 6 : 12;
}
