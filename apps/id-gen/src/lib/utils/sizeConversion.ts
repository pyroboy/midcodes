export type UnitType = 'inches' | 'mm' | 'cm' | 'pixels';

export interface CardSize {
	name: string;
	width: number;
	height: number;
	unit: UnitType;
	description?: string;
}

export interface PixelDimensions {
	width: number;
	height: number;
}

export interface StoredCardSize {
	widthPixels: number;
	heightPixels: number;
	dpi: number;
	unitType: UnitType;
	unitWidth: number;
	unitHeight: number;
}

// Standard DPI for high-quality printing
export const DEFAULT_DPI = 300;

// Utility to switch card orientation
export function switchOrientation(cardSize: CardSize): CardSize {
	return {
		...cardSize,
		width: cardSize.height,
		height: cardSize.width
	};
}

// Common card sizes with flexible units
export const COMMON_CARD_SIZES: CardSize[] = [
	{
		name: 'Credit Card',
		width: 3.375,
		height: 2.125,
		unit: 'inches',
		description: 'Standard credit card size (85.6mm x 53.98mm)'
	},
	{
		name: 'Business Card',
		width: 3.5,
		height: 2.0,
		unit: 'inches',
		description: 'Standard business card size (89mm x 51mm)'
	},
	{
		name: 'ID Badge',
		width: 4.0,
		height: 3.0,
		unit: 'inches',
		description: 'Standard ID badge size (102mm x 76mm)'
	},
	{
		name: 'Mini Card',
		width: 2.5,
		height: 1.5,
		unit: 'inches',
		description: 'Compact card size (64mm x 38mm)'
	},
	{
		name: 'Jumbo Card',
		width: 4.25,
		height: 2.75,
		unit: 'inches',
		description: 'Large card size (108mm x 70mm)'
	}
];

// Unit conversion factors to inches (as base for DPI calculations)
export const UNIT_TO_INCHES: Record<UnitType, number> = {
	inches: 1,
	mm: 0.0393701,
	cm: 0.393701,
	pixels: 1 / DEFAULT_DPI // pixels converted at default DPI
};

/**
 * Get unit symbol for display
 */
export function getUnitSymbol(unit: UnitType): string {
	switch (unit) {
		case 'inches':
			return '"';
		case 'mm':
			return 'mm';
		case 'cm':
			return 'cm';
		case 'pixels':
			return 'px';
		default:
			return '';
	}
}

/**
 * Format dimensions for display
 */
export function formatDimensions(
	cardSize: CardSize,
	showPixels: boolean = true,
	dpi: number = DEFAULT_DPI
): string {
	const symbol = getUnitSymbol(cardSize.unit);
	const baseText = `${cardSize.width}${symbol} × ${cardSize.height}${symbol}`;

	if (showPixels && cardSize.unit !== 'pixels') {
		const pixels = cardSizeToPixels(cardSize, dpi);
		return `${baseText} (${pixels.width}px × ${pixels.height}px)`;
	}

	return baseText;
}

/**
 * Convert any unit to pixels
 */
export function unitToPixels(value: number, unit: UnitType, dpi: number = DEFAULT_DPI): number {
	if (unit === 'pixels') {
		return Math.round(value);
	}
	// Convert to inches first, then to pixels
	const inches = value * UNIT_TO_INCHES[unit];
	return Math.round(inches * dpi);
}

/**
 * Convert pixels to any unit
 */
export function pixelsToUnit(pixels: number, unit: UnitType, dpi: number = DEFAULT_DPI): number {
	if (unit === 'pixels') {
		return pixels;
	}
	// Convert to inches first, then to target unit
	const inches = pixels / dpi;
	return inches / UNIT_TO_INCHES[unit];
}

/**
 * Convert card size to pixel dimensions
 */
export function cardSizeToPixels(cardSize: CardSize, dpi: number = DEFAULT_DPI): PixelDimensions {
	return {
		width: unitToPixels(cardSize.width, cardSize.unit, dpi),
		height: unitToPixels(cardSize.height, cardSize.unit, dpi)
	};
}

/**
 * Convert pixel dimensions to card size in specified unit
 */
export function pixelsToCardSize(
	dimensions: PixelDimensions,
	unit: UnitType = 'inches',
	dpi: number = DEFAULT_DPI
): CardSize {
	return {
		name: 'Custom',
		width: pixelsToUnit(dimensions.width, unit, dpi),
		height: pixelsToUnit(dimensions.height, unit, dpi),
		unit: unit,
		description: `Custom size (${dimensions.width}px x ${dimensions.height}px)`
	};
}

/**
 * Convert card size to stored format (pixels as base)
 */
export function cardSizeToStored(cardSize: CardSize, dpi: number = DEFAULT_DPI): StoredCardSize {
	const pixels = cardSizeToPixels(cardSize, dpi);
	return {
		widthPixels: pixels.width,
		heightPixels: pixels.height,
		dpi: dpi,
		unitType: cardSize.unit,
		unitWidth: cardSize.width,
		unitHeight: cardSize.height
	};
}

/**
 * Convert stored format back to card size
 */
export function storedToCardSize(stored: StoredCardSize): CardSize {
	return {
		name: 'Stored Size',
		width: stored.unitWidth,
		height: stored.unitHeight,
		unit: stored.unitType,
		description: `${stored.unitWidth}${getUnitSymbol(stored.unitType)} × ${stored.unitHeight}${getUnitSymbol(stored.unitType)} (${stored.widthPixels}px × ${stored.heightPixels}px at ${stored.dpi} DPI)`
	};
}

/**
 * Find the closest matching common card size for given dimensions
 */
export function findClosestCardSize(
	dimensions: PixelDimensions,
	dpi: number = DEFAULT_DPI
): CardSize {
	const targetInches = pixelsToCardSize(dimensions, 'inches', dpi);

	let closestSize = COMMON_CARD_SIZES[0];
	let smallestDifference = Number.MAX_VALUE;

	for (const size of COMMON_CARD_SIZES) {
		// Convert size to inches for comparison
		const sizeInches =
			size.unit === 'inches'
				? size
				: {
						width: unitToPixels(size.width, size.unit, dpi) / dpi,
						height: unitToPixels(size.height, size.unit, dpi) / dpi
					};

		const widthDiff = Math.abs(sizeInches.width - targetInches.width);
		const heightDiff = Math.abs(sizeInches.height - targetInches.height);
		const totalDiff = widthDiff + heightDiff;

		if (totalDiff < smallestDifference) {
			smallestDifference = totalDiff;
			closestSize = size;
		}
	}

	return closestSize;
}

/**
 * Validate if dimensions are within reasonable bounds for card printing
 */
export function validateCardDimensions(cardSize: CardSize): { valid: boolean; error?: string } {
	// Convert to inches for validation (reasonable bounds)
	const widthInches =
		cardSize.unit === 'inches'
			? cardSize.width
			: unitToPixels(cardSize.width, cardSize.unit) / DEFAULT_DPI;
	const heightInches =
		cardSize.unit === 'inches'
			? cardSize.height
			: unitToPixels(cardSize.height, cardSize.unit) / DEFAULT_DPI;

	const minSize = 0.5; // Minimum 0.5 inch
	const maxSize = 24.0; // Maximum 24 inches

	if (widthInches < minSize || heightInches < minSize) {
		return {
			valid: false,
			error: `Card dimensions must be at least ${minSize}" in both width and height`
		};
	}

	if (widthInches > maxSize || heightInches > maxSize) {
		return {
			valid: false,
			error: `Card dimensions cannot exceed ${maxSize}" in either width or height`
		};
	}

	return { valid: true };
}

/**
 * Get aspect ratio from card size
 */
export function getAspectRatio(cardSize: CardSize): number {
	return cardSize.width / cardSize.height;
}

/**
 * Create a custom card size with validation
 */
export function createCustomCardSize(
	width: number,
	height: number,
	unit: UnitType,
	name: string = 'Custom'
): { cardSize?: CardSize; error?: string } {
	const cardSize: CardSize = {
		name,
		width,
		height,
		unit,
		description: `Custom size (${width}${getUnitSymbol(unit)} x ${height}${getUnitSymbol(unit)})`
	};

	const validation = validateCardDimensions(cardSize);
	if (!validation.valid) {
		return { error: validation.error };
	}

	return { cardSize };
}

/**
 * Legacy support: Convert old hardcoded dimensions to card size
 */
export const LEGACY_CARD_SIZE: CardSize = {
	name: 'Legacy Template',
	width: 1013,
	height: 638,
	unit: 'pixels',
	description: 'Legacy template size (1013px x 638px)'
};

/**
 * Create card size from pixel dimensions (for legacy support)
 */
export function createCardSizeFromPixels(
	width: number,
	height: number,
	name: string = 'Legacy'
): CardSize {
	return {
		name,
		width,
		height,
		unit: 'pixels',
		description: `${name} (${width}px × ${height}px)`
	};
}
