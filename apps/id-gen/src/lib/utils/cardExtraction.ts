/**
 * Card Extraction Utility
 * Extracts detected card regions from images and resizes to standard dimensions
 */

import type { DetectedRegion, SizePreset } from '$lib/schemas/template-assets.schema';

export interface ExtractedCard {
	regionId: string;
	blob: Blob;
	dataUrl: string;
	width: number;
	height: number;
	orientation: 'landscape' | 'portrait';
}

/**
 * Extract a region from an image and resize to exact preset dimensions
 * This is used during upload to ensure consistent sizing
 */
export async function extractAndResizeRegion(
	imageSource: HTMLImageElement | File,
	region: DetectedRegion,
	sizePreset: SizePreset
): Promise<ExtractedCard> {
	const img = imageSource instanceof File ? await loadImageFromFile(imageSource) : imageSource;

	// Determine target dimensions based on orientation
	const targetWidth =
		region.orientation === 'landscape' ? sizePreset.width_pixels : sizePreset.height_pixels;
	const targetHeight =
		region.orientation === 'landscape' ? sizePreset.height_pixels : sizePreset.width_pixels;

	// Create canvas for extraction and resizing
	const canvas = document.createElement('canvas');
	canvas.width = targetWidth;
	canvas.height = targetHeight;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get canvas context');

	// Enable high-quality scaling
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	// Draw the cropped region, resized to target dimensions
	ctx.drawImage(
		img,
		region.x,
		region.y,
		region.width,
		region.height,
		0,
		0,
		targetWidth,
		targetHeight
	);

	// Convert to blob
	const blob = await canvasToBlob(canvas, 'image/png', 1.0);
	const dataUrl = canvas.toDataURL('image/png');

	return {
		regionId: region.id,
		blob,
		dataUrl,
		width: targetWidth,
		height: targetHeight,
		orientation: region.orientation
	};
}

/**
 * Extract all selected regions from an image
 */
export async function extractAllSelectedRegions(
	imageSource: HTMLImageElement | File,
	regions: DetectedRegion[],
	sizePreset: SizePreset
): Promise<ExtractedCard[]> {
	const selectedRegions = regions.filter((r) => r.isSelected);
	const results: ExtractedCard[] = [];

	for (const region of selectedRegions) {
		const extracted = await extractAndResizeRegion(imageSource, region, sizePreset);
		results.push(extracted);
	}

	return results;
}

/**
 * Extract region at original size (for preview, without resizing)
 */
export async function extractRegionPreview(
	imageSource: HTMLImageElement | File,
	region: DetectedRegion
): Promise<ExtractedCard> {
	const img = imageSource instanceof File ? await loadImageFromFile(imageSource) : imageSource;

	const canvas = document.createElement('canvas');
	canvas.width = region.width;
	canvas.height = region.height;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get canvas context');

	ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

	const blob = await canvasToBlob(canvas, 'image/png', 0.9);
	const dataUrl = canvas.toDataURL('image/png');

	return {
		regionId: region.id,
		blob,
		dataUrl,
		width: region.width,
		height: region.height,
		orientation: region.orientation
	};
}

/**
 * Load image from File object
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(img.src);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(img.src);
			reject(new Error('Failed to load image'));
		};
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to create blob'));
				}
			},
			type,
			quality
		);
	});
}
