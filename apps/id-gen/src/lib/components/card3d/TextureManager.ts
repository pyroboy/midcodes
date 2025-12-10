/**
 * TextureManager - handles all texture loading, caching, and preloading
 * Extracted from TemplateCard3D.svelte for better organization
 */

import * as THREE from 'three';
import type { ShowcaseImage, TextureLoadResult, PreloadProgress } from './types';

export class TextureManager {
	private textureLoader: THREE.TextureLoader;
	private showcaseCache: Map<string, THREE.Texture> = new Map();
	private onProgress?: (progress: PreloadProgress) => void;

	// Track current textures for disposal
	private frontTexture: THREE.Texture | null = null;
	private backTexture: THREE.Texture | null = null;

	constructor(onProgress?: (progress: PreloadProgress) => void) {
		this.textureLoader = new THREE.TextureLoader();
		this.textureLoader.crossOrigin = 'anonymous';
		this.onProgress = onProgress;
	}

	/**
	 * Configure texture with standard settings
	 */
	private configureTexture(texture: THREE.Texture): void {
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.needsUpdate = true;
	}

	/**
	 * Apply aspect ratio correction to texture
	 */
	private applyAspectCorrection(texture: THREE.Texture, targetAspect: number): void {
		if (!texture.image?.width || !texture.image?.height) return;

		const imageAspect = texture.image.width / texture.image.height;
		if (imageAspect > targetAspect) {
			const scale = targetAspect / imageAspect;
			texture.repeat.set(scale, 1);
			texture.offset.set((1 - scale) / 2, 0);
		} else {
			const scale = imageAspect / targetAspect;
			texture.repeat.set(1, scale);
			texture.offset.set(0, (1 - scale) / 2);
		}
		texture.needsUpdate = true;
	}

	/**
	 * Load front texture with aspect ratio correction
	 */
	loadFrontTexture(
		url: string,
		aspect: number,
		onSuccess: (texture: THREE.Texture) => void,
		onError: () => void
	): void {
		// Dispose old texture
		if (this.frontTexture) {
			this.frontTexture.dispose();
			this.frontTexture = null;
		}

		console.log('[TextureManager] Loading front:', url);

		this.textureLoader.load(
			url,
			(loadedTexture) => {
				this.configureTexture(loadedTexture);
				this.applyAspectCorrection(loadedTexture, aspect);
				this.frontTexture = loadedTexture;
				console.log('[TextureManager] Front loaded successfully');
				onSuccess(loadedTexture);
			},
			undefined,
			(err) => {
				console.error('[TextureManager] Front error:', err);
				onError();
			}
		);
	}

	/**
	 * Load back texture with aspect ratio correction
	 */
	loadBackTexture(
		url: string,
		aspect: number,
		onSuccess: (texture: THREE.Texture) => void,
		onError: () => void
	): void {
		// Dispose old back texture
		if (this.backTexture) {
			this.backTexture.dispose();
			this.backTexture = null;
		}

		console.log('[TextureManager] Loading back:', url);

		this.textureLoader.load(
			url,
			(loadedTexture) => {
				this.configureTexture(loadedTexture);
				this.applyAspectCorrection(loadedTexture, aspect);
				this.backTexture = loadedTexture;
				console.log('[TextureManager] Back loaded successfully');
				onSuccess(loadedTexture);
			},
			undefined,
			(err) => {
				console.error('[TextureManager] Back error:', err);
				onError();
			}
		);
	}

	/**
	 * Load showcase texture - uses cache if available
	 * Returns cached texture immediately or loads and caches
	 */
	loadShowcaseTexture(
		url: string,
		onSuccess: (texture: THREE.Texture) => void,
		onError: () => void,
		onLoadStart?: () => void
	): void {
		// Don't load if URL is empty or invalid
		if (!url || url.trim() === '') {
			onError();
			return;
		}

		// Check cache first - instant swap if available
		const cachedTexture = this.showcaseCache.get(url);
		if (cachedTexture) {
			onSuccess(cachedTexture);
			return;
		}

		// Start loading (fallback for non-cached images)
		onLoadStart?.();

		const showcaseLoader = new THREE.TextureLoader();
		showcaseLoader.crossOrigin = 'anonymous';

		showcaseLoader.load(
			url,
			(loadedTexture) => {
				// Validate texture has actual image data
				if (
					!loadedTexture.image ||
					loadedTexture.image.width === 0 ||
					loadedTexture.image.height === 0
				) {
					console.error('[TextureManager] Showcase texture invalid - no image data');
					loadedTexture.dispose();
					onError();
					return;
				}

				this.configureTexture(loadedTexture);

				// Add to cache for future use
				this.showcaseCache.set(url, loadedTexture);
				onSuccess(loadedTexture);
			},
			undefined,
			(err) => {
				console.error('[TextureManager] Showcase texture error:', err);
				onError();
			}
		);
	}

	/**
	 * Get texture from cache
	 */
	getCached(url: string): THREE.Texture | null {
		return this.showcaseCache.get(url) || null;
	}

	/**
	 * Check if we have a cached texture ready for a given orientation
	 */
	hasReadyTextureForOrientation(
		images: ShowcaseImage[],
		orientation: 'landscape' | 'portrait'
	): boolean {
		const matchingImages = images.filter((img) => img.orientation === orientation);
		return matchingImages.some((img) => this.showcaseCache.has(img.image_url));
	}

	/**
	 * Get images matching a specific orientation
	 */
	getMatchingImages(
		images: ShowcaseImage[],
		orientation: 'landscape' | 'portrait'
	): ShowcaseImage[] {
		return images.filter((img) => img.orientation === orientation);
	}

	/**
	 * Find first cached image for orientation
	 */
	findCachedImageForOrientation(
		images: ShowcaseImage[],
		orientation: 'landscape' | 'portrait'
	): { image: ShowcaseImage; texture: THREE.Texture } | null {
		const matchingImages = this.getMatchingImages(images, orientation);
		for (const img of matchingImages) {
			const tex = this.showcaseCache.get(img.image_url);
			if (tex) {
				return { image: img, texture: tex };
			}
		}
		return null;
	}

	/**
	 * Preload all showcase textures into cache
	 */
	async preloadShowcaseTextures(images: ShowcaseImage[]): Promise<void> {
		if (images.length === 0) {
			this.onProgress?.({ progress: 1, loaded: 0, total: 0, isReady: true });
			return;
		}

		// Filter valid images
		const validImages = images.filter((img) => img.image_url && img.image_url.trim() !== '');
		const total = validImages.length;
		let loaded = 0;

		// Notify parent of initial loading state
		this.onProgress?.({ progress: 0, loaded: 0, total, isReady: false });

		console.log('[TextureManager] Preloading', total, 'showcase textures...');

		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';

		const loadPromises = validImages.map((img) => {
			return new Promise<void>((resolve) => {
				// Skip if already in cache
				if (this.showcaseCache.has(img.image_url)) {
					loaded++;
					const progress = total > 0 ? loaded / total : 1;
					this.onProgress?.({ progress, loaded, total, isReady: false });
					resolve();
					return;
				}

				loader.load(
					img.image_url,
					(loadedTexture) => {
						if (
							loadedTexture.image &&
							loadedTexture.image.width > 0 &&
							loadedTexture.image.height > 0
						) {
							this.configureTexture(loadedTexture);
							this.showcaseCache.set(img.image_url, loadedTexture);
						}
						loaded++;
						const progress = total > 0 ? loaded / total : 1;
						this.onProgress?.({ progress, loaded, total, isReady: false });
						resolve();
					},
					undefined,
					() => {
						// Still count failed loads toward progress
						loaded++;
						const progress = total > 0 ? loaded / total : 1;
						this.onProgress?.({ progress, loaded, total, isReady: false });
						resolve();
					}
				);
			});
		});

		await Promise.all(loadPromises);
		this.onProgress?.({ progress: 1, loaded, total, isReady: true });
		console.log('[TextureManager] Preloaded', this.showcaseCache.size, 'showcase textures into cache');
	}

	/**
	 * Check if cache is ready (has textures)
	 */
	isCacheReady(): boolean {
		return this.showcaseCache.size > 0;
	}

	/**
	 * Get cache size
	 */
	getCacheSize(): number {
		return this.showcaseCache.size;
	}

	/**
	 * Dispose front texture
	 */
	disposeFrontTexture(): void {
		if (this.frontTexture) {
			this.frontTexture.dispose();
			this.frontTexture = null;
		}
	}

	/**
	 * Dispose back texture
	 */
	disposeBackTexture(): void {
		if (this.backTexture) {
			this.backTexture.dispose();
			this.backTexture = null;
		}
	}

	/**
	 * Cleanup all textures
	 */
	dispose(): void {
		this.disposeFrontTexture();
		this.disposeBackTexture();

		// Dispose all cached showcase textures
		this.showcaseCache.forEach((tex) => {
			tex.dispose();
		});
		this.showcaseCache.clear();
	}
}
