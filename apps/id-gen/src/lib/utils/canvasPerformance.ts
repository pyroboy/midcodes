/**
 * Canvas Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing canvas rendering performance,
 * including debouncing, render batching, and animation frame management.
 */

export type RenderCallback = () => void;

/**
 * Debounce utility for frequent function calls
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate = false
): T {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return ((...args: Parameters<T>) => {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};

		const callNow = immediate && !timeout;
		
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		
		if (callNow) func(...args);
	}) as T;
}

/**
 * Throttle utility for rate-limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): T {
	let inThrottle = false;
	
	return ((...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	}) as T;
}

/**
 * Canvas Render Manager for optimized drawing operations
 */
export class CanvasRenderManager {
	private isDirty = false;
	private animationFrame: number | null = null;
	private renderCallbacks: RenderCallback[] = [];
	private canvas: HTMLCanvasElement;
	private lastRenderTime = 0;
	private targetFPS = 60;
	private frameInterval: number;

	constructor(canvas: HTMLCanvasElement, targetFPS = 60) {
		this.canvas = canvas;
		this.targetFPS = targetFPS;
		this.frameInterval = 1000 / targetFPS;
	}

	/**
	 * Mark the canvas as dirty (needs redraw)
	 */
	markDirty() {
		if (!this.isDirty) {
			this.isDirty = true;
			this.scheduleRender();
		}
	}

	/**
	 * Add a render callback
	 */
	addRenderCallback(callback: RenderCallback) {
		if (!this.renderCallbacks.includes(callback)) {
			this.renderCallbacks.push(callback);
		}
	}

	/**
	 * Remove a render callback
	 */
	removeRenderCallback(callback: RenderCallback) {
		const index = this.renderCallbacks.indexOf(callback);
		if (index > -1) {
			this.renderCallbacks.splice(index, 1);
		}
	}

	/**
	 * Schedule a render on the next animation frame
	 */
	private scheduleRender() {
		if (this.animationFrame) {
			return; // Already scheduled
		}

		this.animationFrame = requestAnimationFrame((currentTime) => {
			// FPS limiting
			if (currentTime - this.lastRenderTime >= this.frameInterval) {
				this.render();
				this.lastRenderTime = currentTime;
			} else {
				// Re-schedule for next frame
				this.animationFrame = null;
				this.scheduleRender();
			}
		});
	}

	/**
	 * Execute all render callbacks
	 */
	private render() {
		if (!this.isDirty) {
			this.animationFrame = null;
			return;
		}

		// Execute all render callbacks
		for (const callback of this.renderCallbacks) {
			try {
				callback();
			} catch (error) {
				console.error('Error in render callback:', error);
			}
		}

		this.isDirty = false;
		this.animationFrame = null;
	}

	/**
	 * Force immediate render (bypasses FPS limiting)
	 */
	forceRender() {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
		this.render();
	}

	/**
	 * Cleanup resources
	 */
	destroy() {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
		this.renderCallbacks = [];
		this.isDirty = false;
	}
}

/**
 * Image cache for avoiding repeated loading
 */
export class ImageCache {
	private cache = new Map<string, HTMLImageElement>();
	private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

	/**
	 * Get or load an image
	 */
	async getImage(url: string): Promise<HTMLImageElement> {
		// Return cached image if available
		const cached = this.cache.get(url);
		if (cached) {
			return cached;
		}

		// Return existing loading promise if in progress
		const loading = this.loadingPromises.get(url);
		if (loading) {
			return loading;
		}

		// Start loading new image
		const promise = this.loadImage(url);
		this.loadingPromises.set(url, promise);

		try {
			const img = await promise;
			this.cache.set(url, img);
			this.loadingPromises.delete(url);
			return img;
		} catch (error) {
			this.loadingPromises.delete(url);
			throw error;
		}
	}

	/**
	 * Load an image with promise
	 */
	private loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			
			img.onload = () => {
				if (img.naturalWidth > 0 && img.naturalHeight > 0) {
					resolve(img);
				} else {
					reject(new Error('Image loaded but has invalid dimensions'));
				}
			};
			
			img.onerror = () => {
				reject(new Error(`Failed to load image: ${url}`));
			};
			
			img.src = url;
		});
	}

	/**
	 * Preload multiple images
	 */
	async preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
		const promises = urls.map(url => this.getImage(url));
		return Promise.all(promises);
	}

	/**
	 * Clear cached image
	 */
	clear(url: string) {
		this.cache.delete(url);
		this.loadingPromises.delete(url);
	}

	/**
	 * Clear all cached images
	 */
	clearAll() {
		this.cache.clear();
		this.loadingPromises.clear();
	}

	/**
	 * Get cached image synchronously (or null if not cached)
	 */
	get(url: string): HTMLImageElement | null {
		return this.cache.get(url) || null;
	}

	/**
	 * Set cached image synchronously
	 */
	set(url: string, image: HTMLImageElement) {
		this.cache.set(url, image);
	}

	/**
	 * Get cache size info
	 */
	getCacheInfo() {
		return {
			cachedImages: this.cache.size,
			loadingImages: this.loadingPromises.size,
			urls: Array.from(this.cache.keys())
		};
	}
}

/**
 * Coordinate cache for expensive calculations
 */
export class CoordinateCache {
	private cache = new Map<string, any>();
	private maxEntries = 1000;

	/**
	 * Get or calculate cached value
	 */
	get<T>(key: string, calculator: () => T): T {
		const cached = this.cache.get(key);
		if (cached !== undefined) {
			return cached;
		}

		const value = calculator();
		this.set(key, value);
		return value;
	}

	/**
	 * Set cached value
	 */
	set(key: string, value: any) {
		// Simple LRU: remove oldest entries if cache is full
		if (this.cache.size >= this.maxEntries) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(key, value);
	}

	/**
	 * Clear cache
	 */
	clear() {
		this.cache.clear();
	}

	/**
	 * Invalidate entries matching pattern
	 */
	invalidate(pattern: RegExp) {
		for (const key of this.cache.keys()) {
			if (pattern.test(key)) {
				this.cache.delete(key);
			}
		}
	}
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
	private metrics = new Map<string, number[]>();
	private maxSamples = 100;

	/**
	 * Start timing an operation
	 */
	startTiming(label: string): () => void {
		const startTime = performance.now();
		
		return () => {
			const endTime = performance.now();
			const duration = endTime - startTime;
			this.recordMetric(label, duration);
		};
	}

	/**
	 * Record a metric value
	 */
	recordMetric(label: string, value: number) {
		if (!this.metrics.has(label)) {
			this.metrics.set(label, []);
		}

		const samples = this.metrics.get(label)!;
		samples.push(value);

		// Keep only recent samples
		if (samples.length > this.maxSamples) {
			samples.shift();
		}
	}

	/**
	 * Get metric statistics
	 */
	getStats(label: string) {
		const samples = this.metrics.get(label);
		if (!samples || samples.length === 0) {
			return null;
		}

		const sorted = [...samples].sort((a, b) => a - b);
		const sum = samples.reduce((a, b) => a + b, 0);

		return {
			count: samples.length,
			min: sorted[0],
			max: sorted[sorted.length - 1],
			avg: sum / samples.length,
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)]
		};
	}

	/**
	 * Get all stats
	 */
	getAllStats() {
		const stats: Record<string, any> = {};
		for (const label of this.metrics.keys()) {
			stats[label] = this.getStats(label);
		}
		return stats;
	}

	/**
	 * Clear metrics
	 */
	clear() {
		this.metrics.clear();
	}
}
