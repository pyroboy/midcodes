/**
 * Image Processing Utilities for ID Generator
 *
 * Provides client-side image processing for:
 * 1. Background removal (photos) - AI-powered using @imgly/background-removal
 * 2. Signature cleaning - Canvas-based thresholding with auto-crop
 */

import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { aiModelStore } from '$lib/stores/aiModel';
import { get } from 'svelte/store';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessingProgress {
	stage: 'loading' | 'processing' | 'complete';
	progress: number; // 0-100
	message: string;
}

export interface SignatureCleanOptions {
	/** Threshold for determining ink vs paper (0-255). Default: 160 */
	threshold?: number;
	/** Whether to auto-crop whitespace. Default: true */
	autoCrop?: boolean;
	/** Minimum padding around cropped content in pixels. Default: 10 */
	cropPadding?: number;
}

// ============================================================================
// BACKGROUND REMOVAL (for Photos)
// ============================================================================

/**
 * Remove background from an image using AI (client-side).
 * Downloads ~40MB model on first use, then cached by browser.
 *
 * @param imageSource - Image source (File, Blob, or data URL string)
 * @param onProgress - Optional progress callback
 * @returns Blob with transparent background (PNG)
 */
export async function removeBackground(
	imageSource: File | Blob | string,
	onProgress?: (progress: ProcessingProgress) => void
): Promise<Blob> {
	onProgress?.({
		stage: 'loading',
		progress: 0,
		message: 'Loading AI model...'
	});

	// Update global store if not already ready
	const currentStatus = get(aiModelStore).status;
	if (currentStatus !== 'ready') {
		aiModelStore.set({ status: 'loading', progress: 0 });
	}

	try {
		const blob = await imglyRemoveBackground(imageSource, {
			progress: (key: string, current: number, total: number) => {
				// Calculate progress for this specific item (file/step)
				const pct = Math.round((current / total) * 100);
				
				// Heuristic to determine what's happening
				// The library downloads model files first (onnx, wasm, etc.)
				let message = `Processing: ${pct}%`;
				let stage: 'loading' | 'processing' = 'processing';

				if (key.includes('fetch') || key.includes('model') || key.includes('onnx') || key.includes('wasm')) {
					message = `Loading AI model: ${pct}%`;
					stage = 'loading';
				}

				onProgress?.({
					stage,
					progress: pct,
					message
				});

				// Update global store
				if (stage === 'loading') {
					aiModelStore.set({ status: 'loading', progress: pct });
				}
			}
		});

		onProgress?.({
			stage: 'complete',
			progress: 100,
			message: 'Background removed!'
		});
		
		aiModelStore.set({ status: 'ready', progress: 100 });

		return blob;
	} catch (error) {
		console.error('[removeBackground] Error:', error);
		throw new Error('Failed to remove background. Please try again.');
	}
}

/**
 * Preload the AI model without processing a user image.
 * This can be called at app startup to warm up the cache.
 */
export async function preloadModel() {
	const current = get(aiModelStore);
	if (current.status === 'ready' || current.status === 'loading') return;

	console.log('[AI] Preloading model...');
	aiModelStore.set({ status: 'loading', progress: 0 });

	try {
		// Use a tiny 1x1 transparent pixel to trigger the download/init
		const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
		
		await imglyRemoveBackground(pixel, {
			progress: (key: string, current: number, total: number) => {
				const pct = Math.round((current / total) * 100);
				// We only care about model loading part here
				if (key.includes('fetch') || key.includes('model') || key.includes('onnx')) {
					aiModelStore.set({ status: 'loading', progress: pct });
				}
			}
		});
		
		console.log('[AI] Model preloaded successfully');
		aiModelStore.set({ status: 'ready', progress: 100 });
	} catch (err) {
		console.error('[AI] Preload failed:', err);
		aiModelStore.set({ status: 'error', progress: 0 });
	}
}

// ============================================================================
// SIGNATURE CLEANING (for Signatures)
// ============================================================================

/**
 * Clean a signature image by removing paper background and enhancing ink.
 * Uses canvas-based thresholding: light pixels → transparent, dark → black.
 *
 * @param imageSource - Image source (File, Blob, or data URL string)
 * @param options - Processing options
 * @returns Blob with cleaned signature (PNG with transparency)
 */
export async function cleanSignature(
	imageSource: File | Blob | string,
	options: SignatureCleanOptions = {}
): Promise<Blob> {
	const { threshold = 160, autoCrop = true, cropPadding = 10 } = options;

	// Load image into canvas
	const img = await loadImage(imageSource);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Failed to get canvas context');
	}

	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);

	// Apply signature cleaning algorithm
	applySignatureThreshold(ctx, canvas.width, canvas.height, threshold);

	// Auto-crop if enabled
	if (autoCrop) {
		const croppedCanvas = cropTransparentPixels(canvas, cropPadding);
		return canvasToBlob(croppedCanvas);
	}

	return canvasToBlob(canvas);
}

/**
 * Apply thresholding to clean signature:
 * - Light pixels (paper) → transparent
 * - Dark pixels (ink) → solid black
 */
function applySignatureThreshold(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	threshold: number
): void {
	const imgData = ctx.getImageData(0, 0, width, height);
	const data = imgData.data; // RGBA array

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Convert to grayscale using weighted average (luminance)
		const gray = 0.299 * r + 0.587 * g + 0.114 * b;

		if (gray > threshold) {
			// Light pixel (paper) → make transparent
			data[i + 3] = 0; // Alpha = 0
		} else {
			// Dark pixel (ink) → make solid black
			data[i] = 0; // R
			data[i + 1] = 0; // G
			data[i + 2] = 0; // B
			data[i + 3] = 255; // Alpha = fully opaque
		}
	}

	ctx.putImageData(imgData, 0, 0);
}

/**
 * Crop transparent pixels from around the content.
 * Returns a new canvas with only the content area + padding.
 */
function cropTransparentPixels(canvas: HTMLCanvasElement, padding: number): HTMLCanvasElement {
	const ctx = canvas.getContext('2d');
	if (!ctx) return canvas;

	const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imgData.data;

	let minX = canvas.width;
	let minY = canvas.height;
	let maxX = 0;
	let maxY = 0;

	// Find bounds of non-transparent pixels
	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const i = (y * canvas.width + x) * 4;
			const alpha = data[i + 3];

			if (alpha > 0) {
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}
		}
	}

	// No content found, return original
	if (maxX < minX || maxY < minY) {
		return canvas;
	}

	// Calculate cropped dimensions with padding
	const cropX = Math.max(0, minX - padding);
	const cropY = Math.max(0, minY - padding);
	const cropWidth = Math.min(canvas.width - cropX, maxX - minX + 1 + padding * 2);
	const cropHeight = Math.min(canvas.height - cropY, maxY - minY + 1 + padding * 2);

	// Create cropped canvas
	const croppedCanvas = document.createElement('canvas');
	croppedCanvas.width = cropWidth;
	croppedCanvas.height = cropHeight;

	const croppedCtx = croppedCanvas.getContext('2d');
	if (croppedCtx) {
		croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
	}

	return croppedCanvas;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load an image from various sources into an HTMLImageElement.
 */
async function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			// Revoke object URL if we created one
			if (source instanceof File || source instanceof Blob) {
				URL.revokeObjectURL(img.src);
			}
			resolve(img);
		};

		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};

		if (source instanceof File || source instanceof Blob) {
			img.src = URL.createObjectURL(source);
		} else if (typeof source === 'string') {
			img.src = source;
		} else {
			reject(new Error(`Invalid image source type: ${typeof source}`));
			return;
		}
	});
}

/**
 * Convert a canvas to a PNG Blob.
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to convert canvas to blob'));
				}
			},
			'image/png',
			1.0
		);
	});
}

/**
 * Convert a File/Blob to a data URL string.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}
