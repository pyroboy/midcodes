/**
 * Image Proxy Manager for Low-Resolution Drag Performance
 *
 * This module provides efficient low-resolution proxy generation for smooth
 * drag operations while maintaining full quality when dragging stops.
 */

import { browser } from '$app/environment';

// Configuration constants
const DEFAULT_MAX_PROXY_DIMENSION = 800;
const PROXY_QUALITY = 0.8; // JPEG quality for proxy images
const MAX_CACHE_SIZE = 20; // Maximum number of cached proxy images
const PROXY_SMOOTHING_QUALITY: ImageSmoothingQuality = 'low';

export interface ProxyConfig {
	maxDimension?: number;
	quality?: number;
	enableCache?: boolean;
}

/**
 * Manages low-resolution proxy images for performance optimization
 */
export class ImageProxyManager {
	private proxyCache = new Map<string, HTMLImageElement>();
	private cacheKeys: string[] = []; // Track insertion order for LRU
	private maxCacheSize: number;
	private defaultMaxDimension: number;

	constructor(maxCacheSize = MAX_CACHE_SIZE, maxDimension = DEFAULT_MAX_PROXY_DIMENSION) {
		this.maxCacheSize = maxCacheSize;
		this.defaultMaxDimension = maxDimension;
	}

	/**
	 * Get or create a low-resolution proxy image
	 */
	async getOrCreateProxy(
		originalImage: HTMLImageElement,
		cacheKey: string,
		config: ProxyConfig = {}
	): Promise<HTMLImageElement> {
		if (!browser || !originalImage || !originalImage.complete) {
			throw new Error('Invalid image or browser environment');
		}

		// Check cache first
		if (config.enableCache !== false && this.proxyCache.has(cacheKey)) {
			this.updateCacheAccess(cacheKey);
			return this.proxyCache.get(cacheKey)!;
		}

		// Generate new proxy
		const proxy = await this.generateProxy(originalImage, config);

		if (config.enableCache !== false) {
			this.cacheProxy(cacheKey, proxy);
		}

		return proxy;
	}

	/**
	 * Generate a low-resolution proxy image
	 */
	private async generateProxy(
		originalImage: HTMLImageElement,
		config: ProxyConfig = {}
	): Promise<HTMLImageElement> {
		const maxDimension = config.maxDimension ?? this.defaultMaxDimension;
		const quality = config.quality ?? PROXY_QUALITY;

		// Calculate scaled dimensions while preserving aspect ratio
		const { width: originalWidth, height: originalHeight } = {
			width: originalImage.naturalWidth,
			height: originalImage.naturalHeight
		};

		// Skip proxy generation if image is already small enough
		if (Math.max(originalWidth, originalHeight) <= maxDimension) {
			return originalImage;
		}

		const scale = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);

		const scaledWidth = Math.round(originalWidth * scale);
		const scaledHeight = Math.round(originalHeight * scale);

		// Create canvas for proxy generation
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('Failed to get canvas context for proxy generation');
		}

		canvas.width = scaledWidth;
		canvas.height = scaledHeight;

		// Optimize canvas settings for speed
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = PROXY_SMOOTHING_QUALITY;

		// Draw scaled image
		ctx.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight);

		// Convert to data URL with compression
		const dataUrl = canvas.toDataURL('image/jpeg', quality);

		// Create and load proxy image
		const proxyImage = new Image();

		return new Promise((resolve, reject) => {
			proxyImage.onload = () => {
				console.log(
					`🖼️ Generated proxy: ${originalWidth}x${originalHeight} → ${scaledWidth}x${scaledHeight} (${(scale * 100).toFixed(1)}%)`
				);
				resolve(proxyImage);
			};
			proxyImage.onerror = () => {
				reject(new Error('Failed to load generated proxy image'));
			};
			proxyImage.src = dataUrl;
		});
	}

	/**
	 * Cache a proxy image with LRU eviction
	 */
	private cacheProxy(cacheKey: string, proxy: HTMLImageElement): void {
		// Remove from cache if already exists (for reordering)
		if (this.proxyCache.has(cacheKey)) {
			const index = this.cacheKeys.indexOf(cacheKey);
			if (index > -1) {
				this.cacheKeys.splice(index, 1);
			}
		}

		// Add to cache
		this.proxyCache.set(cacheKey, proxy);
		this.cacheKeys.push(cacheKey);

		// Evict oldest if cache is full
		while (this.cacheKeys.length > this.maxCacheSize) {
			const oldestKey = this.cacheKeys.shift();
			if (oldestKey) {
				this.proxyCache.delete(oldestKey);
			}
		}
	}

	/**
	 * Update cache access order for LRU
	 */
	private updateCacheAccess(cacheKey: string): void {
		const index = this.cacheKeys.indexOf(cacheKey);
		if (index > -1) {
			// Move to end (most recently used)
			this.cacheKeys.splice(index, 1);
			this.cacheKeys.push(cacheKey);
		}
	}

	/**
	 * Clear all cached proxy images
	 */
	clearCache(): void {
		this.proxyCache.clear();
		this.cacheKeys = [];
		console.log('🗑️ Proxy cache cleared');
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; maxSize: number; keys: string[] } {
		return {
			size: this.proxyCache.size,
			maxSize: this.maxCacheSize,
			keys: [...this.cacheKeys]
		};
	}

	/**
	 * Remove specific proxy from cache
	 */
	removeFromCache(cacheKey: string): boolean {
		const removed = this.proxyCache.delete(cacheKey);
		if (removed) {
			const index = this.cacheKeys.indexOf(cacheKey);
			if (index > -1) {
				this.cacheKeys.splice(index, 1);
			}
		}
		return removed;
	}
}

/**
 * Global proxy manager instance
 */
export const globalProxyManager = new ImageProxyManager();

/**
 * Utility function for quick proxy generation without caching
 */
export async function generateQuickProxy(
	image: HTMLImageElement,
	maxDimension = DEFAULT_MAX_PROXY_DIMENSION
): Promise<HTMLImageElement> {
	const manager = new ImageProxyManager(0); // No caching
	return manager.getOrCreateProxy(image, 'temp', {
		maxDimension,
		enableCache: false
	});
}

/**
 * Performance monitoring for proxy generation
 */
export class ProxyPerformanceMonitor {
	private generationTimes: number[] = [];
	private maxSamples = 10;

	startGeneration(): number {
		return performance.now();
	}

	endGeneration(startTime: number): number {
		const duration = performance.now() - startTime;
		this.generationTimes.push(duration);

		// Keep only recent samples
		if (this.generationTimes.length > this.maxSamples) {
			this.generationTimes.shift();
		}

		return duration;
	}

	getAverageGenerationTime(): number {
		if (this.generationTimes.length === 0) return 0;
		return this.generationTimes.reduce((a, b) => a + b, 0) / this.generationTimes.length;
	}

	getStats(): { average: number; samples: number; latest: number } {
		return {
			average: this.getAverageGenerationTime(),
			samples: this.generationTimes.length,
			latest: this.generationTimes[this.generationTimes.length - 1] || 0
		};
	}
}

export const proxyPerformanceMonitor = new ProxyPerformanceMonitor();
