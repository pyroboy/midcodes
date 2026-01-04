/**
 * MarketingTextureManager.ts - Texture loading and generation for marketing page
 *
 * Handles:
 * - Procedural normal map generation for Baybayin emboss
 * - Card texture loading and caching
 * - Preloading for smooth transitions
 */
import * as THREE from 'three';

// ============================================================================
// NORMAL MAP GENERATION
// ============================================================================

/**
 * Generate a simple normal map for the Baybayin "Ka" (ᜃ) symbol
 * Optimized: Uses simple gradient instead of expensive Sobel filter
 */
export function createBaybaninNormalMap(size: number = 128): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Fill with neutral normal (pointing straight up: RGB = 128, 128, 255)
	ctx.fillStyle = 'rgb(128, 128, 255)';
	ctx.fillRect(0, 0, size, size);

	// Simple emboss effect using shadow (much faster than Sobel)
	ctx.shadowColor = 'rgb(180, 180, 255)';
	ctx.shadowBlur = 4;
	ctx.shadowOffsetX = 2;
	ctx.shadowOffsetY = 2;
	ctx.fillStyle = 'rgb(100, 100, 255)';
	ctx.font = `${size * 0.6}px serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('ᜃ', size / 2, size / 2);

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

/**
 * Generate the Baybayin "Ka" (ᜃ) logo for the exploded layers
 */
export function createKaLogoTexture(size: number = 64): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Draw circle background
	ctx.fillStyle = '#10b981'; // Emerald 500
	ctx.beginPath();
	ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
	ctx.fill();

	// Draw "Ka" symbol
	ctx.fillStyle = '#ffffff';
	ctx.font = `${size * 0.6}px serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('ᜃ', size / 2, size / 2);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

// ============================================================================
// CARD TEXTURE GENERATION
// ============================================================================

export interface CardTextureSet {
	front: THREE.Texture;
	back: THREE.Texture;
	normalMap: THREE.Texture;
}

/**
 * Create a gradient card texture with Baybayin pattern
 * Optimized: Reduced resolution, simplified drawing
 */
export function createHeroCardTexture(
	width: number = 512,
	height: number = 320,
	variant: 'hero' | 'student' | 'dorm' | 'event' | 'ceo' = 'hero'
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;

	// Simplified color schemes
	const colorSchemes: Record<string, { bg: string; symbol: string }> = {
		hero: { bg: '#ffffff', symbol: 'rgba(0, 0, 0, 0.03)' },
		student: { bg: '#1b263b', symbol: 'rgba(255, 255, 255, 0.05)' },
		dorm: { bg: '#3d2914', symbol: 'rgba(255, 255, 255, 0.05)' },
		event: { bg: '#2d1b4e', symbol: 'rgba(255, 255, 255, 0.05)' },
		ceo: { bg: '#0a0a0a', symbol: 'rgba(212, 175, 55, 0.03)' }
	};

	const colors = colorSchemes[variant] || colorSchemes['hero'];

	// Simple solid background (faster than gradient)
	ctx.fillStyle = colors.bg;
	ctx.fillRect(0, 0, width, height);

	// Draw Baybayin symbol watermark
	ctx.fillStyle = colors.symbol;
	ctx.font = `${height * 0.5}px serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('ᜃ', width / 2, height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/**
 * Create a back-of-card texture (simpler design)
 * Optimized: Reduced resolution, minimal drawing
 */
export function createCardBackTexture(width: number = 512, height: number = 320): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;

	// Dark solid background
	ctx.fillStyle = '#0a0a0f';
	ctx.fillRect(0, 0, width, height);

	// Magnetic stripe
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, height * 0.15, width, height * 0.15);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

// ============================================================================
// TEXTURE CACHING
// ============================================================================

const textureCache = new Map<string, THREE.Texture>();

/**
 * Get or create a cached texture
 */
export function getCachedTexture(
	key: string,
	factory: () => THREE.Texture
): THREE.Texture {
	if (textureCache.has(key)) {
		return textureCache.get(key)!;
	}
	const texture = factory();
	textureCache.set(key, texture);
	return texture;
}

/**
 * Dispose all cached textures (call on page unmount)
 */
export function disposeCachedTextures() {
	textureCache.forEach((texture) => texture.dispose());
	textureCache.clear();
}
