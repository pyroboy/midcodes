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
 * Generate a normal map for the Baybayin "Ka" (ᜃ) symbol
 * This creates an emboss effect when applied to MeshStandardMaterial
 */
export function createBaybaninNormalMap(size: number = 512): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Fill with neutral normal (pointing straight up: RGB = 128, 128, 255)
	ctx.fillStyle = 'rgb(128, 128, 255)';
	ctx.fillRect(0, 0, size, size);

	// Create a height map first (grayscale)
	const heightCanvas = document.createElement('canvas');
	heightCanvas.width = size;
	heightCanvas.height = size;
	const heightCtx = heightCanvas.getContext('2d')!;

	// Black background
	heightCtx.fillStyle = 'black';
	heightCtx.fillRect(0, 0, size, size);

	// Draw the Baybayin symbol in white (height = 1)
	heightCtx.fillStyle = 'white';
	heightCtx.font = `${size * 0.7}px serif`;
	heightCtx.textAlign = 'center';
	heightCtx.textBaseline = 'middle';
	heightCtx.fillText('ᜃ', size / 2, size / 2);

	// Get height data
	const heightData = heightCtx.getImageData(0, 0, size, size);
	const normalData = ctx.getImageData(0, 0, size, size);

	// Convert height map to normal map using Sobel operators
	const strength = 2.0; // Emboss strength

	for (let y = 1; y < size - 1; y++) {
		for (let x = 1; x < size - 1; x++) {
			const idx = (y * size + x) * 4;

			// Sobel X (horizontal gradient)
			const tl = heightData.data[((y - 1) * size + (x - 1)) * 4] / 255;
			const l = heightData.data[(y * size + (x - 1)) * 4] / 255;
			const bl = heightData.data[((y + 1) * size + (x - 1)) * 4] / 255;
			const tr = heightData.data[((y - 1) * size + (x + 1)) * 4] / 255;
			const r = heightData.data[(y * size + (x + 1)) * 4] / 255;
			const br = heightData.data[((y + 1) * size + (x + 1)) * 4] / 255;

			// Sobel Y (vertical gradient)
			const t = heightData.data[((y - 1) * size + x) * 4] / 255;
			const b = heightData.data[((y + 1) * size + x) * 4] / 255;

			// Compute gradients
			const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
			const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

			// Create normal vector
			let nx = -dX * strength;
			let ny = -dY * strength;
			let nz = 1.0;

			// Normalize
			const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
			nx /= len;
			ny /= len;
			nz /= len;

			// Convert to RGB (0-255 range)
			normalData.data[idx] = Math.floor((nx + 1) * 0.5 * 255); // R
			normalData.data[idx + 1] = Math.floor((ny + 1) * 0.5 * 255); // G
			normalData.data[idx + 2] = Math.floor((nz + 1) * 0.5 * 255); // B
			normalData.data[idx + 3] = 255; // A
		}
	}

	ctx.putImageData(normalData, 0, 0);

	// Apply slight blur for smoother normals
	ctx.filter = 'blur(1px)';
	ctx.drawImage(canvas, 0, 0);
	ctx.filter = 'none';

	const texture = new THREE.CanvasTexture(canvas);
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
 */
export function createHeroCardTexture(
	width: number = 1024,
	height: number = 640,
	variant: 'hero' | 'student' | 'dorm' | 'event' | 'ceo' = 'hero'
): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;

	// Variant-specific colors
	const colorSchemes = {
		hero: {
			primary: '#ffffff',
			secondary: '#f3f4f6', // gray-100
			accent: '#e5e7eb', // gray-200
			symbol: 'rgba(0, 0, 0, 0.05)' // Dark symbol for contrast
		},
		student: {
			primary: '#0d1b2a',
			secondary: '#1b263b',
			accent: '#415a77',
			symbol: 'rgba(255, 255, 255, 0.1)'
		},
		dorm: {
			primary: '#2d1b0e',
			secondary: '#3d2914',
			accent: '#5d4037',
			symbol: 'rgba(255, 255, 255, 0.1)'
		},
		event: {
			primary: '#1a0a2e',
			secondary: '#2d1b4e',
			accent: '#4a235a',
			symbol: 'rgba(255, 255, 255, 0.1)'
		},
		ceo: {
			primary: '#000000',
			secondary: '#111111',
			accent: '#222222',
			symbol: 'rgba(212, 175, 55, 0.05)' // Gold hint
		}
	};

	const colors = colorSchemes[variant] || colorSchemes['hero'];
	if (!colors) {
		console.error(`MarketingTextureManager: No color scheme found for variant "${variant}". Defaulting to hero.`);
	}

	// Background gradient
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, colors.primary);
	gradient.addColorStop(0.5, colors.secondary);
	gradient.addColorStop(1, colors.accent);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	// Draw large Baybayin symbol watermark
	ctx.fillStyle = colors.symbol;
	ctx.font = `${height * 0.6}px serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('ᜃ', width / 2, height / 2);

	// Add subtle grid pattern
	ctx.strokeStyle = variant === 'hero' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';
	ctx.lineWidth = 1;
	for (let x = 0; x < width; x += 40) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}
	for (let y = 0; y < height; y += 40) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}

	// Add variant-specific elements
	if (variant === 'student') {
		// University badge placeholder
		ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.beginPath();
		ctx.arc(width * 0.15, height * 0.2, 50, 0, Math.PI * 2);
		ctx.fill();

		// Text placeholders
		ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.fillRect(width * 0.3, height * 0.15, width * 0.5, 20);
		ctx.fillRect(width * 0.3, height * 0.25, width * 0.4, 15);
	} else if (variant === 'dorm') {
		// Keycard stripe
		ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
		ctx.fillRect(0, height * 0.4, width, height * 0.15);
	} else if (variant === 'event') {
		// VIP badge
		ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
		ctx.font = 'bold 40px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('VIP', width / 2, height * 0.25);
	} else if (variant === 'ceo') {
		// CEO style (minimalist border)
		ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'; // Gold
		ctx.lineWidth = 2;
		ctx.strokeRect(40, 40, width - 80, height - 80);
		
		ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
		ctx.font = 'bold 36px serif';
		ctx.textAlign = 'center';
		ctx.fillText('CHIEF EXECUTIVE', width / 2, height * 0.4);
		
		ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
		ctx.font = '24px sans-serif';
		ctx.fillText('KANAYA INC.', width / 2, height * 0.6);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/**
 * Create a back-of-card texture (simpler design)
 */
export function createCardBackTexture(width: number = 1024, height: number = 640): THREE.CanvasTexture {
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

	// Barcode placeholder
	ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
	const barcodeY = height * 0.6;
	for (let i = 0; i < 40; i++) {
		const barWidth = Math.random() > 0.5 ? 6 : 3;
		ctx.fillRect(width * 0.15 + i * 15, barcodeY, barWidth, 60);
	}

	// QR code placeholder
	ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
	ctx.fillRect(width * 0.75, barcodeY - 10, 80, 80);

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
