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
	currentTemplate: any,
	selectedTemplate: any
): Promise<{ frontElements: TemplateElement[]; backElements: TemplateElement[] }> {
	// Wait a bit for the dimensions to be processed
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Skip element creation for existing templates that have stored elements
	// Only create default elements for brand new templates
	if (currentTemplate?.id && selectedTemplate?.id === currentTemplate.id) {
		console.log(
			'🔧 Skipping element creation - editing existing template with ID:',
			currentTemplate.id
		);
		return { frontElements, backElements };
	}

	if (requiredPixelDimensions && frontElements.length === 0 && backElements.length === 0) {
		console.log('🔧 Creating default template elements...');

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
	}

	return { frontElements, backElements };
}

/**
 * Sanitizes a template element to ensure valid data.
 * Ensures width/height are numbers and > 0, coordinates exist, and content exists.
 *
 * @param el - The template element to sanitize
 * @returns The sanitized template element
 */
export function sanitizeElement(el: TemplateElement): TemplateElement {
	return {
		...el,
		// Ensure width/height are numbers and > 0
		width: typeof el.width === 'number' && el.width > 0 ? el.width : 100,
		height: typeof el.height === 'number' && el.height > 0 ? el.height : 30,
		// Ensure coordinates exist
		x: Number(el.x) || 0,
		y: Number(el.y) || 0,
		// Ensure content exists
		content: el.content || (el.type === 'text' ? 'Text' : '')
	};
}

/**
 * Splits template elements by side (front/back).
 *
 * @param elements - Array of template elements to split
 * @returns Object containing front and back element arrays
 */
export function splitElementsBySide(
	elements: TemplateElement[]
): { front: TemplateElement[]; back: TemplateElement[] } {
	return {
		front: elements.filter((el) => el.side === 'front'),
		back: elements.filter((el) => el.side === 'back')
	};
}
