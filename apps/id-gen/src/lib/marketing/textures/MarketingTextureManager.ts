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

/**
 * Generate a QR code texture for a given URL
 * Uses a simple manual implementation for small payloads
 */
export function createQRCodeTexture(
	url: string = 'https://kanaya.app',
	size: number = 128
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// White background
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, size, size);

	// Simple QR-like pattern (21x21 modules for Version 1)
	// This creates a recognizable QR pattern without a full library
	const modules = 21;
	const moduleSize = Math.floor(size / (modules + 2)); // +2 for quiet zone
	const offset = Math.floor((size - modules * moduleSize) / 2);

	ctx.fillStyle = '#000000';

	// Helper to draw a module
	const drawModule = (row: number, col: number) => {
		ctx.fillRect(
			offset + col * moduleSize,
			offset + row * moduleSize,
			moduleSize,
			moduleSize
		);
	};

	// Finder patterns (7x7 squares in corners)
	const drawFinderPattern = (startRow: number, startCol: number) => {
		// Outer black square
		for (let r = 0; r < 7; r++) {
			for (let c = 0; c < 7; c++) {
				if (r === 0 || r === 6 || c === 0 || c === 6) {
					drawModule(startRow + r, startCol + c);
				}
			}
		}
		// Inner black square (3x3)
		for (let r = 2; r < 5; r++) {
			for (let c = 2; c < 5; c++) {
				drawModule(startRow + r, startCol + c);
			}
		}
	};

	// Draw finder patterns
	drawFinderPattern(0, 0); // Top-left
	drawFinderPattern(0, 14); // Top-right
	drawFinderPattern(14, 0); // Bottom-left

	// Timing patterns
	for (let i = 8; i < 13; i += 2) {
		drawModule(6, i);
		drawModule(i, 6);
	}

	// Data area - create pattern from URL hash
	let hash = 0;
	for (let i = 0; i < url.length; i++) {
		hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
	}

	// Fill data modules with pseudo-random pattern based on URL
	for (let row = 0; row < modules; row++) {
		for (let col = 0; col < modules; col++) {
			// Skip finder patterns and timing
			if (row < 9 && col < 9) continue; // Top-left
			if (row < 9 && col > 12) continue; // Top-right
			if (row > 12 && col < 9) continue; // Bottom-left
			if (row === 6 || col === 6) continue; // Timing

			// Pseudo-random based on position and hash
			const bit = ((hash >> ((row * col) % 31)) & 1) ^ ((row + col) & 1);
			if (bit) drawModule(row, col);
		}
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.magFilter = THREE.NearestFilter; // Sharp edges
	texture.minFilter = THREE.NearestFilter;
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
		hero: { bg: '#f8f9fa', symbol: 'rgba(0, 0, 0, 0.03)' },
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
