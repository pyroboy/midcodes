interface CacheEntry {
    url: string;
    timestamp: number;
}

interface TransformFailure {
    timestamp: number;
    error: boolean;
}

export class GlobalImageCache {
    private static instance: GlobalImageCache;
    private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000;
    private static readonly CACHE_PREFIX = 'supabase_img_';

    private memoryCache: Map<string, string>;
    private failedTransforms: Set<string>;
    private inFlightRequests: Map<string, Promise<string | null>>;
    private fetchQueue: Map<string, Promise<Blob>>;
    private processingFiles: Set<string>;

    private constructor() {
        this.memoryCache = new Map();
        this.failedTransforms = new Set();
        this.inFlightRequests = new Map();
        this.fetchQueue = new Map();
        this.processingFiles = new Set();
        this.cleanupExpiredCache();
    }

    static getInstance(): GlobalImageCache {
        if (!GlobalImageCache.instance) {
            GlobalImageCache.instance = new GlobalImageCache();
        }
        return GlobalImageCache.instance;
    }

    isProcessing(transformKey: string): boolean {
        return this.processingFiles.has(transformKey);
    }

    setProcessing(transformKey: string): void {
        this.processingFiles.add(transformKey);
    }

    clearProcessing(transformKey: string): void {
        this.processingFiles.delete(transformKey);
    }

    async getFromFetchQueue(url: string): Promise<Blob | null> {
        const existingFetch = this.fetchQueue.get(url);
        if (existingFetch) return existingFetch;
        return null;
    }

    setFetchQueue(url: string, promise: Promise<Blob>): void {
        this.fetchQueue.set(url, promise);
    }

    clearFetchQueue(url: string): void {
        this.fetchQueue.delete(url);
    }

    private getFailureKey(cacheKey: string): string {
        return `failed_${cacheKey}`;
    }

    hasFailedBefore(cacheKey: string): boolean {
        const failureKey = this.getFailureKey(cacheKey);
        return this.failedTransforms.has(failureKey);
    }

    markAsFailed(cacheKey: string): void {
        const failureKey = this.getFailureKey(cacheKey);
        this.failedTransforms.add(failureKey);
        
        try {
            localStorage.setItem(failureKey, JSON.stringify({
                timestamp: Date.now(),
                error: true
            } as TransformFailure));
        } catch (error) {
            console.warn('Error storing failure in localStorage:', error);
        }
    }

    async get(cacheKey: string): Promise<string | null> {
        if (this.hasFailedBefore(cacheKey)) {
            return null;
        }

        const inFlightRequest = this.inFlightRequests.get(cacheKey);
        if (inFlightRequest) {
            console.log('🔄 Using in-flight request for:', cacheKey);
            return inFlightRequest;
        }

        const memCached = this.memoryCache.get(cacheKey);
        if (memCached) {
            console.log('✅ Found in memory cache:', cacheKey);
            return memCached;
        }

        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const entry = JSON.parse(cached) as CacheEntry;
                if (Date.now() - entry.timestamp < GlobalImageCache.CACHE_DURATION) {
                    this.memoryCache.set(cacheKey, entry.url);
                    return entry.url;
                }
                localStorage.removeItem(cacheKey);
            }
        } catch (err) {
            console.warn('Cache read error:', err);
        }
        return null;
    }

    set(cacheKey: string, url: string): void {
        this.memoryCache.set(cacheKey, url);

        try {
            const entry: CacheEntry = {
                url,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (err) {
            console.warn('Cache write error:', err);
        }
    }

    setInFlight(cacheKey: string, promise: Promise<string | null>): void {
        this.inFlightRequests.set(cacheKey, promise);
    }

    clearInFlight(cacheKey: string): void {
        this.inFlightRequests.delete(cacheKey);
    }

    private cleanupExpiredCache(): void {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(GlobalImageCache.CACHE_PREFIX)) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        try {
                            const entry = JSON.parse(cached) as CacheEntry | TransformFailure;
                            if (Date.now() - entry.timestamp > GlobalImageCache.CACHE_DURATION) {
                                localStorage.removeItem(key);
                                this.memoryCache.delete(key);
                                if (key.startsWith('failed_')) {
                                    const failureKey = key.replace('failed_', '');
                                    this.failedTransforms.delete(failureKey);
                                }
                            }
                        } catch (error) {
                            console.warn('Error parsing cache entry:', error);
                            localStorage.removeItem(key);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error cleaning up cache:', error);
        }
    }

    cleanup(url: string): void {
        this.memoryCache.forEach((cachedUrl, key) => {
            if (cachedUrl === url) {
                this.memoryCache.delete(key);
                this.failedTransforms.delete(this.getFailureKey(key));
                try {
                    localStorage.removeItem(key);
                    localStorage.removeItem(this.getFailureKey(key));
                } catch (error) {
                    console.warn('Error removing from localStorage:', error);
                }
            }
        });
    }
}

export const imageCache = GlobalImageCache.getInstance();