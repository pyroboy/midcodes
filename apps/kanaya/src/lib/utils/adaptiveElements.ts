import type { TemplateElement } from '$lib/stores/templateStore';

/**
 * Adaptive Element Positioning System
 *
 * This utility creates default template elements that adapt to different canvas sizes
 * based on aspect ratio scaling, ensuring consistent relative positioning across
 * different card dimensions.
 */

interface LegacyElementData {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Legacy dimensions that the original default elements were designed for */
export const LEGACY_DIMENSIONS = {
	width: 1013,
	height: 638,
	aspectRatio: 1013 / 638
};

/** Original default front elements designed for 1013×638 canvas */
export const LEGACY_FRONT_ELEMENTS: TemplateElement[] = [
	{
		id: 'licenseNo',
		variableName: 'licenseNo',
		type: 'text',
		content: '75-005-24',
		x: 293,
		y: 159,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 16,
		color: '#000000',
		alignment: 'left',
		side: 'front'
	},
	{
		id: 'valid',
		variableName: 'valid',
		type: 'text',
		content: '01/01/2026',
		x: 295,
		y: 179,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 16,
		color: '#000000',
		alignment: 'left',
		side: 'front'
	},
	{
		id: 'name',
		variableName: 'name',
		type: 'text',
		content: 'Junifer D. Oban',
		x: 256,
		y: 246,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 21,
		color: '#000000',
		alignment: 'left',
		side: 'front'
	},
	{
		id: 'photo',
		variableName: 'photo',
		type: 'photo',
		x: 50,
		y: 131,
		width: 119,
		height: 158,
		side: 'front'
	},
	{
		id: 'signature',
		variableName: 'signature',
		type: 'signature',
		x: 263,
		y: 196,
		width: 152,
		height: 65,
		side: 'front'
	},
	{
		id: 'idType',
		variableName: 'idType',
		type: 'selection',
		options: ['Ministerial License', 'Ordination License', 'Local License'],
		x: 198,
		y: 131,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 16,
		color: '#000000',
		alignment: 'left',
		side: 'front'
	},
	{
		id: 'position',
		variableName: 'position',
		type: 'selection',
		options: ['General Treasurer', 'General Secretary', 'District Superintendent', 'Pastor'],
		x: 276,
		y: 270,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 16,
		color: '#000000',
		alignment: 'left',
		side: 'front'
	}
];

/** Original default back elements designed for 1013×638 canvas */
export const LEGACY_BACK_ELEMENTS: TemplateElement[] = [
	{
		id: 'contactName',
		variableName: 'contactName',
		type: 'text',
		content: 'Ralph Steven D. Trigo',
		x: 113,
		y: 36,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 13,
		color: '#000000',
		alignment: 'left',
		side: 'back'
	},
	{
		id: 'addresss',
		variableName: 'addresss',
		type: 'text',
		content: 'San Isidro District',
		x: 112,
		y: 55,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 13,
		color: '#000000',
		alignment: 'left',
		side: 'back'
	},
	{
		id: 'contactNo',
		variableName: 'contactNo',
		type: 'text',
		content: '9478920644',
		x: 112,
		y: 74,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 13,
		color: '#000000',
		alignment: 'left',
		side: 'back'
	},
	{
		id: 'tin',
		variableName: 'tin',
		type: 'text',
		content: '943-403-393',
		x: 133,
		y: 115,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 13,
		color: '#000000',
		alignment: 'left',
		side: 'back'
	},
	{
		id: 'sss',
		variableName: 'sss',
		type: 'text',
		content: '943-403-393',
		x: 133,
		y: 138,
		width: 100,
		height: 20,
		font: 'Arial',
		size: 13,
		color: '#000000',
		alignment: 'left',
		side: 'back'
	}
];

/**
 * Scaling strategy types for element positioning
 */
export type ScalingStrategy =
	| 'aspect-ratio' // Maintain aspect ratio, scale proportionally
	| 'relative' // Use relative positioning (percentages)
	| 'uniform' // Uniform scale based on average dimension change
	| 'width-only' // Scale only by width, maintain relative height
	| 'height-only'; // Scale only by height, maintain relative width

/**
 * Scale factor calculation based on different strategies
 */
function calculateScaleFactors(
	canvasWidth: number,
	canvasHeight: number,
	strategy: ScalingStrategy = 'aspect-ratio'
): { scaleX: number; scaleY: number } {
	const legacyAspect = LEGACY_DIMENSIONS.aspectRatio;
	const canvasAspect = canvasWidth / canvasHeight;

	switch (strategy) {
		case 'aspect-ratio':
			// Maintain the original aspect ratio, fit to canvas
			if (canvasAspect >= legacyAspect) {
				// Canvas is wider, scale by height
				return {
					scaleX: canvasHeight / LEGACY_DIMENSIONS.height,
					scaleY: canvasHeight / LEGACY_DIMENSIONS.height
				};
			} else {
				// Canvas is taller, scale by width
				return {
					scaleX: canvasWidth / LEGACY_DIMENSIONS.width,
					scaleY: canvasWidth / LEGACY_DIMENSIONS.width
				};
			}

		case 'relative':
			// Scale each dimension independently (preserve relative positioning)
			return {
				scaleX: canvasWidth / LEGACY_DIMENSIONS.width,
				scaleY: canvasHeight / LEGACY_DIMENSIONS.height
			};

		case 'uniform':
			// Use the average scale factor
			const avgScale =
				(canvasWidth / LEGACY_DIMENSIONS.width + canvasHeight / LEGACY_DIMENSIONS.height) / 2;
			return { scaleX: avgScale, scaleY: avgScale };

		case 'width-only':
			// Scale only by width, maintain aspect ratio for elements
			return {
				scaleX: canvasWidth / LEGACY_DIMENSIONS.width,
				scaleY: canvasWidth / LEGACY_DIMENSIONS.width
			};

		case 'height-only':
			// Scale only by height, maintain aspect ratio for elements
			return {
				scaleX: canvasHeight / LEGACY_DIMENSIONS.height,
				scaleY: canvasHeight / LEGACY_DIMENSIONS.height
			};
	}
}

/**
 * Scale a single element's positioning data
 */
function scaleElement(
	element: LegacyElementData,
	scaleX: number,
	scaleY: number,
	canvasWidth: number,
	canvasHeight: number
): LegacyElementData {
	return {
		x: Math.round(element.x * scaleX),
		y: Math.round(element.y * scaleY),
		width: Math.max(20, Math.round(element.width * scaleX)), // Minimum 20px width
		height: Math.max(20, Math.round(element.height * scaleY)) // Minimum 20px height
	};
}

/**
 * Ensure scaled element fits within canvas bounds
 */
function constrainToBounds(
	element: LegacyElementData,
	canvasWidth: number,
	canvasHeight: number
): LegacyElementData {
	const maxX = canvasWidth - element.width;
	const maxY = canvasHeight - element.height;

	return {
		...element,
		x: Math.max(0, Math.min(element.x, maxX)),
		y: Math.max(0, Math.min(element.y, maxY))
	};
}

/**
 * Create adaptive default elements for a specific canvas size
 */
export function createAdaptiveElements(
	canvasWidth: number,
	canvasHeight: number,
	side: 'front' | 'back',
	strategy: ScalingStrategy = 'aspect-ratio'
): TemplateElement[] {
	// Validate canvas dimensions
	if (canvasWidth < 100 || canvasHeight < 100) {
		console.warn('Canvas dimensions too small, using legacy size fallback');
		canvasWidth = LEGACY_DIMENSIONS.width;
		canvasHeight = LEGACY_DIMENSIONS.height;
	}

	// Select the appropriate legacy elements
	const legacyElements = side === 'front' ? LEGACY_FRONT_ELEMENTS : LEGACY_BACK_ELEMENTS;

	// Calculate scale factors
	const { scaleX, scaleY } = calculateScaleFactors(canvasWidth, canvasHeight, strategy);

	// Scale each element
	const scaledElements = legacyElements.map((element) => {
		const scaledPos = scaleElement(element, scaleX, scaleY, canvasWidth, canvasHeight);
		const constrainedPos = constrainToBounds(scaledPos, canvasWidth, canvasHeight);

		return {
			...element,
			x: constrainedPos.x,
			y: constrainedPos.y,
			width: constrainedPos.width,
			height: constrainedPos.height,
			side
		};
	});

	return scaledElements;
}

/**
 * Create adaptive front elements
 */
export function createAdaptiveFrontElements(
	canvasWidth: number,
	canvasHeight: number,
	strategy: ScalingStrategy = 'aspect-ratio'
): TemplateElement[] {
	return createAdaptiveElements(canvasWidth, canvasHeight, 'front', strategy);
}

/**
 * Create adaptive back elements
 */
export function createAdaptiveBackElements(
	canvasWidth: number,
	canvasHeight: number,
	strategy: ScalingStrategy = 'aspect-ratio'
): TemplateElement[] {
	return createAdaptiveElements(canvasWidth, canvasHeight, 'back', strategy);
}

/**
 * Get optimal scaling strategy based on aspect ratio difference
 */
export function getOptimalScalingStrategy(
	canvasWidth: number,
	canvasHeight: number
): ScalingStrategy {
	const legacyAspect = LEGACY_DIMENSIONS.aspectRatio;
	const canvasAspect = canvasWidth / canvasHeight;
	const aspectRatioDifference = Math.abs(legacyAspect - canvasAspect) / legacyAspect;

	// If aspect ratios are very similar (within 10%), use relative scaling
	if (aspectRatioDifference <= 0.1) {
		return 'relative';
	}

	// If canvas is significantly different, use aspect-ratio fitting
	return 'aspect-ratio';
}

/**
 * Preview adaptively positioned elements (for debugging)
 */
export function previewAdaptiveElements(
	canvasWidth: number = 1013,
	canvasHeight: number = 638,
	side: 'front' | 'back' = 'front'
): TemplateElement[] {
	console.log(
		`Creating adaptive elements for ${canvasWidth}×${canvasHeight} canvas (${side} side)`
	);

	const adaptiveElements = createAdaptiveElements(canvasWidth, canvasHeight, side);

	console.log(`Generated ${adaptiveElements.length} adaptive elements:`);
	adaptiveElements.forEach((element, index) => {
		console.log(
			`  ${index + 1}. ${element.id}: ${element.x},${element.y} (${element.width}×${element.height})`
		);
	});

	return adaptiveElements;
}
