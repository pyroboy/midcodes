import type { CardSize } from '$lib/utils/sizeConversion';
import {
	findClosestCardSize,
	switchOrientation,
	cardSizeToPixels,
	COMMON_CARD_SIZES,
	LEGACY_CARD_SIZE
} from '$lib/utils/sizeConversion';

/**
 * Type for database template records
 */
export interface DatabaseTemplate {
	id: string;
	user_id: string;
	name: string;
	description?: string | null;
	org_id: string;
	front_background: string;
	back_background: string;
	front_background_low_res?: string | null;
	back_background_low_res?: string | null;
	orientation: 'landscape' | 'portrait';
	template_elements: any[];
	width_pixels?: number;
	height_pixels?: number;
	dpi?: number;
	created_at: string;
	updated_at?: string | null;
	// Asset variant URLs (thumbnails, previews, samples)
	thumb_front_url?: string | null;
	thumb_back_url?: string | null;
	preview_front_url?: string | null;
	preview_back_url?: string | null;
	blank_front_url?: string | null;
	blank_back_url?: string | null;
	sample_front_url?: string | null;
	sample_back_url?: string | null;
	// Template metadata
	tags?: string[];
	usage_count?: number;
}

/**
 * Robustly detect orientation from pixel dimensions
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns 'portrait' if height > width, 'landscape' otherwise
 */
export function detectOrientationFromDimensions(
	width: number,
	height: number
): 'landscape' | 'portrait' {
	return height > width ? 'portrait' : 'landscape';
}

/**
 * Ensure pixel dimensions are correctly oriented for the given orientation.
 * If the current dimensions don't match the expected orientation, swap them.
 * @param dims - Current pixel dimensions
 * @param expectedOrientation - The orientation the dimensions should represent
 * @returns Correctly oriented dimensions
 */
export function getOrientationAwarePixelDimensions(
	dims: { width: number; height: number },
	expectedOrientation: 'landscape' | 'portrait'
): { width: number; height: number } {
	const currentOrientation = detectOrientationFromDimensions(dims.width, dims.height);

	if (currentOrientation !== expectedOrientation) {
		// Swap width and height to match expected orientation
		console.log('🔄 Swapping dimensions to match orientation:', {
			from: { width: dims.width, height: dims.height, orientation: currentOrientation },
			to: { width: dims.height, height: dims.width, orientation: expectedOrientation }
		});
		return { width: dims.height, height: dims.width };
	}

	return dims;
}

/**
 * Find the best default size for legacy templates by analyzing existing templates
 * or falling back to a reasonable standard size
 * @param templates - Array of existing templates to analyze
 * @param commonCardSizes - Array of common card sizes to match against
 * @param legacyCardSize - Fallback card size for legacy templates
 * @returns The best matching CardSize
 */
export function findBestDefaultSize(
	templates: DatabaseTemplate[],
	commonCardSizes: CardSize[] = COMMON_CARD_SIZES,
	legacyCardSize: CardSize = LEGACY_CARD_SIZE
): CardSize {
	// If no templates exist, use the standard credit card size
	if (!templates || templates.length === 0) {
		return commonCardSizes.find((size) => size.name === 'CR80 (ATM Size)') || legacyCardSize;
	}

	// Try to find templates with size information to analyze patterns
	const templatesWithSizes = templates.filter(
		(t) => (t as any).width_pixels && (t as any).height_pixels
	) as Array<DatabaseTemplate & { width_pixels: number; height_pixels: number }>;

	if (templatesWithSizes.length > 0) {
		// Count occurrences of each size to find the most common
		const sizeMap = new Map<string, { count: number; width: number; height: number }>();

		templatesWithSizes.forEach((template) => {
			const key = `${template.width_pixels}x${template.height_pixels}`;
			if (sizeMap.has(key)) {
				sizeMap.get(key)!.count++;
			} else {
				sizeMap.set(key, {
					count: 1,
					width: template.width_pixels,
					height: template.height_pixels
				});
			}
		});

		// Find the most common size
		let mostCommon = { count: 0, width: 0, height: 0 };
		for (const sizeInfo of sizeMap.values()) {
			if (sizeInfo.count > mostCommon.count) {
				mostCommon = sizeInfo;
			}
		}

		if (mostCommon.count > 0) {
			// Try to match it to a standard card size or create a custom one
			const closestStandardSize = findClosestCardSize(
				{
					width: mostCommon.width,
					height: mostCommon.height
				},
				300
			);

			// If it's close to a standard size (within 5% difference), use the standard
			const standardPixels = cardSizeToPixels(closestStandardSize, 300);
			const widthDiff = Math.abs(standardPixels.width - mostCommon.width) / mostCommon.width;
			const heightDiff = Math.abs(standardPixels.height - mostCommon.height) / mostCommon.height;

			if (widthDiff <= 0.05 && heightDiff <= 0.05) {
				return closestStandardSize;
			} else {
				// Create a custom size based on the most common dimensions
				return {
					name: 'Most Common Template Size',
					width: mostCommon.width,
					height: mostCommon.height,
					unit: 'pixels',
					description: `Most common size in existing templates (${mostCommon.width}px × ${mostCommon.height}px)`
				};
			}
		}
	}

	// If no patterns found or analysis failed, use Credit Card as the most common standard
	return commonCardSizes.find((size) => size.name === 'CR80 (ATM Size)') || legacyCardSize;
}

/**
 * Validates that both front and back backgrounds are present
 * @param frontBackground - Front background file
 * @param backBackground - Back background file
 * @param frontPreview - Front preview URL
 * @param backPreview - Back preview URL
 * @returns Promise resolving to true if valid, or an error message if invalid
 */
export async function validateBackgrounds(
	frontBackground: File | null,
	backBackground: File | null,
	frontPreview: string | null,
	backPreview: string | null
): Promise<true | string> {
	if ((!frontBackground && !frontPreview) || (!backBackground && !backPreview)) {
		return 'Both front and back backgrounds are required. Please ensure both are present.';
	}

	// Only validate that images can be loaded - cropping handles size requirements
	if (frontBackground) {
		const frontValid = await validateImage(frontBackground, 'front');
		if (typeof frontValid === 'string') return frontValid;
	}

	if (backBackground) {
		const backValid = await validateImage(backBackground, 'back');
		if (typeof backValid === 'string') return backValid;
	}

	return true;
}

/**
 * Validates that an image can be loaded
 * @param file - The image file to validate
 * @param side - The side being validated ('front' or 'back')
 * @returns Promise resolving to true if valid, or an error message if invalid
 */
export async function validateImage(
	file: File,
	side: string
): Promise<true | string> {
	try {
		const url = URL.createObjectURL(file);
		const img = new Image();
		await new Promise((resolve, reject) => {
			img.onload = resolve;
			img.onerror = reject;
			img.src = url;
		});

		// With cropping enabled, we only need to validate that the image loads
		// Size validation is now handled by the cropping workflow
		URL.revokeObjectURL(url);
		return true;
	} catch {
		return `Error loading ${side} background image. Please try again.`;
	}
}
