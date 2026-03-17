import { browser } from '$app/environment';

/**
 * Asset Preloader Service
 * Handles lazy loading of heavy assets like images and 3D textures
 */

// Track loaded assets to prevent duplicate work
const loadedAssets = new Set<string>();

// Preload a single image
export function preloadImage(url: string): Promise<void> {
	if (!browser || !url) return Promise.resolve();
	if (loadedAssets.has(url)) return Promise.resolve();

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			loadedAssets.add(url);
			resolve();
		};
		img.onerror = () => {
			console.warn(`Failed to preload image: ${url}`);
			// Resolve anyway to not block the queue
			resolve();
		};
		img.src = url;
	});
}

// Preload multiple images
export async function preloadImages(urls: string[]): Promise<void> {
	const uniqueUrls = urls.filter((url) => url && !loadedAssets.has(url));
	await Promise.all(uniqueUrls.map((url) => preloadImage(url)));
}

// Preload 3D assets (textures, etc)
// This simulates 3D asset loading behavior since actual GLTF loading
// depends on the thrlete/three.js context which isn't available here
export async function preload3DAssets(templateId: string): Promise<void> {
	// In a real scenario, this would cache GLTF models or textures
	// For now, we'll simulate the network request timing
	if (loadedAssets.has(`3d-${templateId}`)) return;

	// Store that we've "preloaded" this 3d asset
	loadedAssets.add(`3d-${templateId}`);
}

// Get list of critical assets for a route
export function getRouteAssets(href: string): string[] {
	switch (href) {
		case '/':
			return [
				'/fonts/PermanentMarker-Regular.ttf'
				// Add any other static critical assets
			];
		case '/templates':
			return []; // Template images are dynamic
		case '/pricing':
			return []; // Pricing icons are SVGs
		default:
			return [];
	}
}
