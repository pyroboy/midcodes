import type { TemplateElement } from '$lib/stores/templateStore';
import { createAdaptiveElements } from '$lib/utils/adaptiveElements';

/**
 * Triggers element creation when images are uploaded.
 * Waits for dimensions to be processed and creates default elements for brand new templates.
 * Skips element creation for existing templates that have stored elements.
 *
 * @param requiredPixelDimensions - The required pixel dimensions for the template
 * @param frontElements - Current front elements array
 * @param backElements - Current back elements array
 * @param currentTemplate - The current template being edited
 * @param selectedTemplate - The selected template from server data
 * @returns Promise resolving to the new front and back elements
 */
export async function triggerElementCreation(
	requiredPixelDimensions: { width: number; height: number } | null,
	frontElements: TemplateElement[],
	backElements: TemplateElement[],
	currentTemplate: { id?: string } | null | undefined,
	selectedTemplate: { id?: string } | null | undefined
): Promise<{ frontElements: TemplateElement[]; backElements: TemplateElement[] }> {
	// Ensure arrays are valid
	const safeFrontElements = Array.isArray(frontElements) ? frontElements : [];
	const safeBackElements = Array.isArray(backElements) ? backElements : [];

	// Wait a bit for the dimensions to be processed
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Skip element creation for existing templates that have stored elements
	// Only create default elements for brand new templates
	const currentId = currentTemplate?.id;
	const selectedId = selectedTemplate?.id;
	
	if (currentId && selectedId && selectedId === currentId) {
		console.log(
			'🔧 Skipping element creation - editing existing template with ID:',
			currentId
		);
		return { frontElements: safeFrontElements, backElements: safeBackElements };
	}

	// Validate dimensions before creating elements
	if (!requiredPixelDimensions) {
		console.warn('🔧 No dimensions available for element creation');
		return { frontElements: safeFrontElements, backElements: safeBackElements };
	}

	if (requiredPixelDimensions.width <= 0 || requiredPixelDimensions.height <= 0) {
		console.warn('🔧 Invalid dimensions for element creation:', requiredPixelDimensions);
		return { frontElements: safeFrontElements, backElements: safeBackElements };
	}

	if (safeFrontElements.length === 0 && safeBackElements.length === 0) {
		console.log('🔧 Creating default template elements...');

		try {
			// Create elements for both sides
			const frontElems = createAdaptiveElements(
				requiredPixelDimensions.width,
				requiredPixelDimensions.height,
				'front',
				'aspect-ratio'
			);

			const backElems = createAdaptiveElements(
				requiredPixelDimensions.width,
				requiredPixelDimensions.height,
				'back',
				'aspect-ratio'
			);

			console.log('✅ Created template elements:', {
				front: frontElems.length,
				back: backElems.length
			});

			return { frontElements: frontElems, backElements: backElems };
		} catch (error) {
			console.error('❌ Failed to create adaptive elements:', error);
			return { frontElements: safeFrontElements, backElements: safeBackElements };
		}
	}

	return { frontElements: safeFrontElements, backElements: safeBackElements };
}


/**
 * Sanitizes a template element to ensure valid data.
 * Ensures width/height are numbers and > 0, coordinates exist, and content exists.
 *
 * @param el - The template element to sanitize
 * @returns The sanitized template element
 */
export function sanitizeElement(el: TemplateElement): TemplateElement {
	if (!el) {
		console.warn('sanitizeElement received null/undefined element');
		return {
			id: crypto.randomUUID(),
			type: 'text',
			side: 'front',
			x: 0,
			y: 0,
			width: 100,
			height: 30,
			content: 'Text'
		} as TemplateElement;
	}

	// Safely parse numeric values with fallbacks
	const parseNum = (val: unknown, fallback: number): number => {
		if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
			return val;
		}
		if (typeof val === 'string') {
			const parsed = parseFloat(val);
			if (!isNaN(parsed) && isFinite(parsed)) {
				return parsed;
			}
		}
		return fallback;
	};

	const width = parseNum(el.width, 100);
	const height = parseNum(el.height, 30);

	return {
		...el,
		// Ensure width/height are numbers and > 0
		width: width > 0 ? width : 100,
		height: height > 0 ? height : 30,
		// Ensure coordinates exist and are valid numbers
		x: parseNum(el.x, 0),
		y: parseNum(el.y, 0),
		// Ensure content exists
		content: el.content ?? (el.type === 'text' ? 'Text' : ''),
		// Ensure side is valid
		side: el.side === 'front' || el.side === 'back' ? el.side : 'front'
	};
}

/**
 * Splits template elements by side (front/back).
 *
 * @param elements - Array of template elements to split
 * @returns Object containing front and back element arrays
 */
export function splitElementsBySide(
	elements: TemplateElement[] | null | undefined
): { front: TemplateElement[]; back: TemplateElement[] } {
	// Handle null/undefined input
	if (!elements || !Array.isArray(elements)) {
		return { front: [], back: [] };
	}

	return {
		front: elements.filter((el) => el && el.side === 'front'),
		back: elements.filter((el) => el && el.side === 'back')
	};
}

