// Simple in-memory cache with TTL
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

// Cache event system for real-time updates
type CacheEventListener = (key: string) => void;

// Browser-level event for cross-component communication
const CACHE_EVENT = 'cache-updated';

class SimpleCache {
	private cache = new Map<string, CacheEntry<any>>();
	private listeners: CacheEventListener[] = [];

	/**
	 * Subscribe to cache changes
	 * @param listener Callback function that receives the cache key
	 * @returns Unsubscribe function
	 */
	subscribe(listener: CacheEventListener): () => void {
		this.listeners.push(listener);
		return () => {
			const index = this.listeners.indexOf(listener);
			if (index > -1) {
				this.listeners.splice(index, 1);
			}
		};
	}

	/**
	 * Notify all listeners of cache change
	 */
	private notify(key: string): void {
		// Debug logging for event tracking
		if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
			console.log(`🔔 [Cache Event] Key changed: ${key}`);
		}

		// Notify local listeners
		this.listeners.forEach(listener => listener(key));

		// Emit browser event for cross-component updates (browser-only)
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent(CACHE_EVENT, { detail: { key, timestamp: Date.now() } }));
		}
	}

	/**
	 * Get value from cache
	 * @param key Cache key
	 * @returns Cached value or undefined if expired/missing
	 */
	get<T>(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			// Expired - remove it
			this.cache.delete(key);
			this.notify(key);
			return undefined;
		}

		return entry.data as T;
	}

	/**
	 * Set value in cache
	 * @param key Cache key
	 * @param data Data to cache
	 * @param ttl Time to live in milliseconds (default: 5 minutes)
	 */
	set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
		this.notify(key);
	}

	/**
	 * Delete specific key from cache
	 * @param key Cache key
	 */
	delete(key: string): void {
		this.cache.delete(key);
		this.notify(key);
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
		this.notify('*');
	}

	/**
	 * Delete all keys matching a pattern
	 * @param pattern Regex pattern to match keys
	 */
	deletePattern(pattern: RegExp): void {
		for (const key of this.cache.keys()) {
			if (pattern.test(key)) {
				this.cache.delete(key);
				this.notify(key);
			}
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		let valid = 0;
		let expired = 0;
		const now = Date.now();

		for (const entry of this.cache.values()) {
			if (now - entry.timestamp > entry.ttl) {
				expired++;
			} else {
				valid++;
			}
		}

		return {
			total: this.cache.size,
			valid,
			expired
		};
	}

	/**
	 * Get detailed cache status for all tracked keys
	 */
	getDetailedStatus() {
		const now = Date.now();
		const status: Record<string, { cached: boolean; expiresIn?: number }> = {};

		for (const [key, entry] of this.cache.entries()) {
			const timeLeft = entry.ttl - (now - entry.timestamp);
			status[key] = {
				cached: timeLeft > 0,
				expiresIn: timeLeft > 0 ? timeLeft : undefined
			};
		}

		return status;
	}

	/**
	 * Get all cache keys
	 */
	getAllKeys(): string[] {
		return Array.from(this.cache.keys());
	}
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
	SHORT: 2 * 60 * 1000,        // 2 minutes
	MEDIUM: 5 * 60 * 1000,       // 5 minutes
	LONG: 10 * 60 * 1000,        // 10 minutes
	VERY_LONG: 30 * 60 * 1000    // 30 minutes
} as const;

// Cache key generators
export const cacheKeys = {
	properties: () => 'properties:all',
	activeProperties: () => 'properties:active',
	tenants: () => 'tenants:all',
	rentalUnits: () => 'rental_units:all',
	leases: () => 'leases:all',
	leasesCore: () => 'leases:core',
	leasesFinancial: () => 'leases:financial',
	transactions: (filters?: string) => filters ? `transactions:${filters}` : 'transactions:all',
	billings: (leaseId?: number) => leaseId ? `billings:lease:${leaseId}` : 'billings:all',
	payments: () => 'payments:all',
	utilityBillings: () => 'utility_billings:all',
	meters: () => 'meters:all',
	readings: () => 'readings:all',
	expenses: () => 'expenses:all',
	budgets: () => 'budgets:all'
} as const;