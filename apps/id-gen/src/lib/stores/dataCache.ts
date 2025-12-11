/**
 * Client-side data cache store
 * Persists data across navigations to avoid redundant fetches
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	maxAge: number; // milliseconds
}

// In-memory cache that persists across navigations
const cache = new Map<string, CacheEntry<any>>();

/**
 * Creates a cached store that persists data in memory
 * @param key - Unique cache key
 * @param maxAgeMs - Cache duration in milliseconds (default: 5 minutes)
 */
export function createCachedStore<T>(key: string, maxAgeMs = 5 * 60 * 1000) {
	const store = writable<T | null>(null);
	const loading = writable<boolean>(false);

	return {
		subscribe: store.subscribe,
		loading: { subscribe: loading.subscribe },

		/**
		 * Get data from cache or fetch if stale/missing
		 * @param fetcher - Async function to fetch fresh data
		 * @param force - If true, bypass cache and fetch fresh
		 */
		async fetch(fetcher: () => Promise<T>, force = false): Promise<T> {
			if (!browser) {
				// On server, always fetch fresh
				const data = await fetcher();
				store.set(data);
				return data;
			}

			const cached = cache.get(key);
			const now = Date.now();

			// Return cached if valid and not forced
			if (!force && cached && now - cached.timestamp < cached.maxAge) {
				store.set(cached.data);
				return cached.data;
			}

			// Fetch fresh data
			loading.set(true);
			try {
				const data = await fetcher();
				cache.set(key, { data, timestamp: now, maxAge: maxAgeMs });
				store.set(data);
				return data;
			} finally {
				loading.set(false);
			}
		},

		/**
		 * Get current cached value without fetching
		 */
		getCached(): T | null {
			const cached = cache.get(key);
			if (cached && Date.now() - cached.timestamp < cached.maxAge) {
				return cached.data;
			}
			return null;
		},

		/**
		 * Check if cache is still valid
		 */
		isValid(): boolean {
			const cached = cache.get(key);
			if (!cached) return false;
			return Date.now() - cached.timestamp < cached.maxAge;
		},

		/**
		 * Update cached data directly (for optimistic updates)
		 */
		update(updater: (current: T | null) => T) {
			const currentData = this.getCached();
			const newData = updater(currentData);
			cache.set(key, { data: newData, timestamp: Date.now(), maxAge: maxAgeMs });
			store.set(newData);
		},

		/**
		 * Invalidate cache (force next fetch to be fresh)
		 */
		invalidate() {
			cache.delete(key);
			store.set(null);
		}
	};
}

// ============================================
// Pre-created caches for common data
// ============================================

/** Templates list cache (5 min) */
export const templatesCache = createCachedStore<any[]>('templates', 5 * 60 * 1000);

/** Recent cards cache (2 min - changes more frequently) */
export const recentCardsCache = createCachedStore<any[]>('recent-cards', 2 * 60 * 1000);

/** Template assets cache (10 min - rarely changes) */
export const templateAssetsCache = createCachedStore<any[]>('template-assets', 10 * 60 * 1000);

/** User profile cache (10 min) */
export const userProfileCache = createCachedStore<any>('user-profile', 10 * 60 * 1000);

/** ID cards list cache (2 min) */
export const idCardsCache = createCachedStore<any[]>('idcards', 2 * 60 * 1000);

// ============================================
// Global cache utilities
// ============================================

/**
 * Invalidate all caches (e.g., on logout)
 */
export function invalidateAllCaches() {
	cache.clear();
	templatesCache.invalidate();
	recentCardsCache.invalidate();
	templateAssetsCache.invalidate();
	userProfileCache.invalidate();
	idCardsCache.invalidate();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
	const stats: Record<string, { age: number; valid: boolean }> = {};
	const now = Date.now();

	cache.forEach((entry, key) => {
		stats[key] = {
			age: Math.round((now - entry.timestamp) / 1000),
			valid: now - entry.timestamp < entry.maxAge
		};
	});

	return stats;
}
