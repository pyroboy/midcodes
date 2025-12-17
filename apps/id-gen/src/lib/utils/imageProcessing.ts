/**
 * Image Processing Utilities for ID Generator
 *
 * Provides image processing for:
 * 1. Background removal (photos) - Cloud-based using Runware AI API
 * 2. Signature cleaning - Canvas-based thresholding with auto-crop
 */

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
// CLOUD BACKGROUND REMOVAL (using Runware AI API)
// ============================================================================


/**
 * Remove background from an image using Runware AI API (server-side).
 * This is faster and more reliable than the client-side library.
 *
 * @param imageSource - Image source (File, Blob, or data URL string)
 * @param onProgress - Optional progress callback
 * @returns Blob with transparent background (PNG)
 */
export async function removeBackgroundCloud(
	imageSource: File | Blob | string,
	onProgress?: (progress: ProcessingProgress) => void
): Promise<Blob> {
	onProgress?.({
		stage: 'loading',
		progress: 0,
		message: 'Preparing image...'
	});

	// Resize image to reduce payload size (max 1024px on longest side)
	let optimizedSource = imageSource;
	if (imageSource instanceof File || imageSource instanceof Blob) {
		optimizedSource = await resizeImageForApi(imageSource, 1024);
	}

	// Convert to base64 for API
	let base64Image: string;
	if (typeof optimizedSource === 'string') {
		base64Image = optimizedSource;
	} else {
		base64Image = await fileToDataUrl(optimizedSource);
	}

	onProgress?.({
		stage: 'processing',
		progress: 30,
		message: 'Removing background...'
	});

	try {
		const response = await fetch('/api/remove-background', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ imageBase64: base64Image })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}

		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || 'Background removal failed');
		}

		onProgress?.({
			stage: 'processing',
			progress: 80,
			message: 'Downloading result...'
		});

		// Fetch the processed image from the URL
		let processedBlob: Blob;
		if (result.imageUrl) {
			const imageResponse = await fetch(result.imageUrl);
			if (!imageResponse.ok) {
				throw new Error('Failed to download processed image');
			}
			processedBlob = await imageResponse.blob();
		} else if (result.imageBase64) {
			// Convert base64 to blob
			const byteCharacters = atob(result.imageBase64);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			processedBlob = new Blob([byteArray], { type: 'image/png' });
		} else {
			throw new Error('No image data in response');
		}

		onProgress?.({
			stage: 'complete',
			progress: 100,
			message: 'Background removed!'
		});

		return processedBlob;
	} catch (error) {
		console.error('[removeBackgroundCloud] Error:', error);
		throw new Error(
			error instanceof Error ? error.message : 'Failed to remove background. Please try again.'
		);
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
// IMAGE OPTIMIZATION FOR API
// ============================================================================

/**
 * Resize an image to a maximum dimension while maintaining aspect ratio.
 * Also compresses as JPEG to reduce file size for faster API uploads.
 *
 * @param source - Image source (File or Blob)
 * @param maxDimension - Maximum width or height in pixels (default: 1024)
 * @returns Compressed Blob (JPEG format)
 */
async function resizeImageForApi(source: File | Blob, maxDimension: number = 1024): Promise<Blob> {
	const img = await loadImage(source);
	
	let { width, height } = img;
	
	// Only resize if larger than maxDimension
	if (width > maxDimension || height > maxDimension) {
		if (width > height) {
			height = Math.round((height / width) * maxDimension);
			width = maxDimension;
		} else {
			width = Math.round((width / height) * maxDimension);
			height = maxDimension;
		}
	}
	
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get canvas context');
	}
	
	ctx.drawImage(img, 0, 0, width, height);
	
	// Convert to JPEG with 85% quality for good balance of size/quality
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					console.log(`[resizeImageForApi] Resized: ${img.width}x${img.height} → ${width}x${height}, size: ${(blob.size / 1024).toFixed(1)}KB`);
					resolve(blob);
				} else {
					reject(new Error('Failed to convert canvas to blob'));
				}
			},
			'image/jpeg',
			0.85
		);
	});
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
