/**
 * Card Display Dimensions Calculator
 *
 * Provides precise pixel dimensions for displaying ID cards that fill the screen
 * with a fixed padding. The card will be as large as possible while respecting:
 * - Horizontal padding (1cm on each side)
 * - Bottom padding for footer/chevron
 * - Maintaining the card's aspect ratio
 */

export interface CardDisplayConfig {
	/** Card aspect ratio (width / height) */
	aspectRatio: number;
	/** Viewport width in CSS pixels */
	viewportWidth: number;
	/** Viewport height in CSS pixels */
	viewportHeight: number;
	/** Horizontal padding in pixels (applied to each side), default: ~1cm (38px) */
	horizontalPadding?: number;
	/** Bottom padding for footer/chevron in pixels, default: 180 */
	bottomPadding?: number;
	/** Top padding in pixels, default: 40 */
	topPadding?: number;
}

export interface CardDisplayDimensions {
	/** Calculated width in CSS pixels */
	width: number;
	/** Calculated height in CSS pixels */
	height: number;
}

/**
 * Default padding: 1cm ≈ 38px at 96 DPI
 * Using 40px for nice round number
 */
const DEFAULT_HORIZONTAL_PADDING = 40;
const DEFAULT_BOTTOM_PADDING = 180;
const DEFAULT_TOP_PADDING = 40;

/**
 * Calculate exact pixel dimensions for card display
 *
 * Strategy: Fill the available space while maintaining aspect ratio
 * - Available width = viewport width - (2 × horizontal padding)
 * - Available height = viewport height - top padding - bottom padding
 * - Card fills whichever dimension is the constraint
 *
 * @param config - Configuration object with viewport and card parameters
 * @returns Calculated dimensions
 */
export function calculateCardDisplayDimensions(config: CardDisplayConfig): CardDisplayDimensions {
	const {
		aspectRatio,
		viewportWidth,
		viewportHeight,
		horizontalPadding = DEFAULT_HORIZONTAL_PADDING,
		bottomPadding = DEFAULT_BOTTOM_PADDING,
		topPadding = DEFAULT_TOP_PADDING
	} = config;

	// Calculate available space
	const availableWidth = viewportWidth - horizontalPadding * 2;
	const availableHeight = viewportHeight - bottomPadding - topPadding;

	// Calculate what the card dimensions would be if constrained by width
	const widthConstrainedWidth = availableWidth;
	const widthConstrainedHeight = availableWidth / aspectRatio;

	// Calculate what the card dimensions would be if constrained by height
	const heightConstrainedHeight = availableHeight;
	const heightConstrainedWidth = availableHeight * aspectRatio;

	let width: number;
	let height: number;

	// Use the smaller of the two to fit within both constraints
	if (widthConstrainedHeight <= availableHeight) {
		// Width is the constraint
		width = widthConstrainedWidth;
		height = widthConstrainedHeight;
	} else {
		// Height is the constraint
		width = heightConstrainedWidth;
		height = heightConstrainedHeight;
	}

	// Ensure minimum sizes for usability (at least 200px wide)
	const minWidth = 200;
	if (width < minWidth) {
		width = minWidth;
		height = minWidth / aspectRatio;
	}

	// Round to whole pixels for crisp rendering
	width = Math.round(width);
	height = Math.round(height);

	return {
		width,
		height
	};
}

/**
 * Detect if the current viewport is mobile
 */
export function isMobileViewport(width: number): boolean {
	return width < 768;
}

/**
 * Get default aspect ratio for standard ID cards (CR80)
 * CR80: 3.375" × 2.125" ≈ 1.588
 */
export const DEFAULT_CARD_ASPECT_RATIO = 1.588;
