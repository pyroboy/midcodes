/**
 * Preload Service - Smart Navigation Preloading
 * 
 * Features:
 * - Two-tier loading: Skeleton (high priority) -> Assets (lazy priority)
 * - Persistent state across page reloads via sessionStorage
 * - Current page awareness to skip redundant work
 * - Sequential priority queue
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { preloadData } from '$app/navigation';
import { page } from '$app/stores';
import { preloadImages, getRouteAssets } from './assetPreloader';

// Route preload state
export interface RoutePreloadState {
	href: string;
	skeleton: 'idle' | 'loading' | 'ready';
	assets: 'idle' | 'loading' | 'ready';
	progress: number; // 0-100 (visual combined progress)
	serverDataLoadedAt?: number; // Timestamp when server data was cached
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
export const PRELOAD_ROUTES = [
	'/',
	'/all-ids',
	'/templates',
	'/account',
	'/pricing'
];

// Initial state factory
const createInitialState = (): Map<string, RoutePreloadState> => {
	const map = new Map();
	PRELOAD_ROUTES.forEach(href => {
		map.set(href, { 
			href, 
			skeleton: 'idle', 
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
const SESSION_KEY = 'idgen_preload_state';

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
			PRELOAD_ROUTES.forEach(href => {
				const savedState = parsed.find((s: any) => s.href === href);
				if (savedState) {
					// Don't restore 'loading' states, reset them to idle
					const skeleton = savedState.skeleton === 'loading' ? 'idle' : savedState.skeleton;
					const assets = savedState.assets === 'loading' ? 'idle' : savedState.assets;
					
					restoredMap.set(href, { ...savedState, skeleton, assets });
				} else {
					restoredMap.set(href, { href, skeleton: 'idle', assets: 'idle', progress: 0 });
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

		// Calculate visual progress
		// Skeleton = 0-50%, Assets = 51-100%
		let progress = current.progress;
		
		const nextSkeleton = updates.skeleton || current.skeleton;
		const nextAssets = updates.assets || current.assets;
		
		if (nextSkeleton === 'ready') progress = Math.max(progress, 50);
		if (nextAssets === 'ready') progress = 100;
		if (nextSkeleton === 'idle' && nextAssets === 'idle') progress = 0;

		states.set(href, { ...current, ...updates, progress });
		return new Map(states);
	});
	
	persistState();
}

// Preload just the skeleton/data (Tier 1)
async function preloadSkeleton(href: string): Promise<boolean> {
	// Skip if already ready
	const state = get(preloadStates).get(href);
	if (state?.skeleton === 'ready') return true;

	updateRouteState(href, { skeleton: 'loading' });
	
	try {
		// Preload SvelteKit data (triggers load function and caches result)
		await preloadData(href);
		
		// Record timestamp when server data was cached
		updateRouteState(href, { skeleton: 'ready', serverDataLoadedAt: Date.now() });
		return true;
	} catch (error) {
		console.warn(`Failed to preload skeleton for ${href}:`, error);
		updateRouteState(href, { skeleton: 'idle' }); // Reset on error so we can try again
		return false;
	}
}

// Preload heavy assets (Tier 2)
async function preloadAssets(href: string): Promise<boolean> {
	// Skip if already ready
	const state = get(preloadStates).get(href);
	if (state?.assets === 'ready') return true;
	
	// Can't load assets if skeleton isn't ready (data not fetched yet)
	if (state?.skeleton !== 'ready') return false;

	updateRouteState(href, { assets: 'loading' });
	
	try {
		const assets = getRouteAssets(href);
		if (assets.length > 0) {
			await preloadImages(assets);
		}
		
		// Simulate network delay for other assets that might be fetched
		// This gives time for the browser to breathe between heavy tasks
		await new Promise(r => setTimeout(r, 100));

		updateRouteState(href, { assets: 'ready' });
		return true;
	} catch (error) {
		console.warn(`Failed to preload assets for ${href}:`, error);
		updateRouteState(href, { assets: 'idle' });
		return false;
	}
}

// Main sequential preload loop
async function preloadSequentially(startIndex: number = 0) {
	if (!browser || isPreloading) return;
	
	isPreloading = true;
	currentRouteIndex = startIndex;

	// Loop 1: Vital Skeletons & Data (High Priority)
	for (let i = 0; i < PRELOAD_ROUTES.length; i++) {
		const href = PRELOAD_ROUTES[i];
		
		// Skip current page - already loading/loaded by browser
		if (href === currentPath) continue;
		
		await preloadSkeleton(href);
		
		// Small breather
		await new Promise(r => setTimeout(r, 50));
	}

	// Loop 2: Heavy Assets (Lazy Priority)
	for (let i = 0; i < PRELOAD_ROUTES.length; i++) {
		const href = PRELOAD_ROUTES[i];
		
		// Skip current page
		if (href === currentPath) continue;
		
		// Use requestIdleCallback for asset loading to not block main thread
		if ('requestIdleCallback' in window) {
			await new Promise<void>(resolve => {
				(window as any).requestIdleCallback(async () => {
					await preloadAssets(href);
					resolve();
				}, { timeout: 2000 });
			});
		} else {
			await preloadAssets(href);
		}

		// Larger breather between asset batches
		await new Promise(r => setTimeout(r, PRELOAD_DELAY_MS));
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
	
	// Mark current path as fully loaded since user is there
	updateRouteState(path, { skeleton: 'ready', assets: 'ready' });
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
