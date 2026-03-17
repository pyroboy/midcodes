import { goto, pushState } from '$app/navigation';
import { tick } from 'svelte';
import { toast } from 'svelte-sonner';
import type { TemplateElement } from '$lib/stores/templateStore';
import {
	type CardSize,
	cardSizeToPixels,
	LEGACY_CARD_SIZE
} from '$lib/utils/sizeConversion';
import {
	triggerElementCreation,
	sanitizeElement,
	splitElementsBySide
} from '$lib/utils/templateElements';
import { getProxiedUrl } from '$lib/utils/storage';
import { getOrCreateDecomposeAsset } from '$lib/remote/templates.remote';
// Use shared types from the central types file
import type { DatabaseTemplate, EditorTemplateData } from '$lib/types/template';

// Re-export types for convenience
export type { DatabaseTemplate, EditorTemplateData } from '$lib/types/template';

export interface UseTemplateEditorOptions {
	data: any; // The page data
	initialTemplates: EditorTemplateData[];
	user: { id: string } | null;
	org_id: string;
}

export function useTemplateEditor(options: UseTemplateEditorOptions) {
	const { data, initialTemplates, user, org_id } = options;

	// Templates array - can be updated after save
	let templates = $state<EditorTemplateData[]>([...initialTemplates]);

	let currentTemplate = $state<EditorTemplateData | null>(null);
	let isEditMode = $state(false);
	let editorVersion = $state(0);
	let errorMessage = $state('');
	
	// Template elements
	let frontElements = $state<TemplateElement[]>([]);
	let backElements = $state<TemplateElement[]>([]);

	// Dimensions
	let currentCardSize = $state<CardSize | null>(null);
	let requiredPixelDimensions = $state<{ width: number; height: number } | null>(null);

	// Decompose state
	let isDecomposing = $state(false);

	// Change tracking - store initial state snapshots
	let initialFrontElements = $state<string>('[]');
	let initialBackElements = $state<string>('[]');
	let initialFrontBackground = $state<string | null>(null);
	let initialBackBackground = $state<string | null>(null);

	// Current background state (updated by main page)
	let currentFrontPreview = $state<string | null>(null);
	let currentBackPreview = $state<string | null>(null);

	// Function to update current backgrounds for change tracking
	function setCurrentBackgrounds(frontPreview: string | null, backPreview: string | null) {
		currentFrontPreview = frontPreview;
		currentBackPreview = backPreview;
	}

	// Track if template has unsaved changes
	let hasChanges = $derived.by(() => {
		// For new templates (no initial background), any content is a change
		if (!initialFrontBackground && !initialBackBackground) {
			// Check if any backgrounds were added or elements exist
			return !!currentFrontPreview || !!currentBackPreview || 
				frontElements.length > 0 || backElements.length > 0;
		}
		
		// Compare current state to initial state
		const elementsChanged = 
			JSON.stringify(frontElements) !== initialFrontElements ||
			JSON.stringify(backElements) !== initialBackElements;

		// Check if backgrounds changed (comparing preview URLs)
		// A change is detected if:
		// - A background existed but is now null (removed)
		// - A background didn't exist but now has a value (added)
		// - The background URL changed (replaced with different image)
		const frontBackgroundChanged = initialFrontBackground !== currentFrontPreview;
		const backBackgroundChanged = initialBackBackground !== currentBackPreview;

		return elementsChanged || frontBackgroundChanged || backBackgroundChanged;
	});

	async function initializeEditor(templateData: EditorTemplateData) {
		console.log('📝 Initializing editor with template:', templateData?.id);

		// Reset state
		errorMessage = '';
		isEditMode = true;
		editorVersion++;

		// Deep copy to avoid mutating the original until saved
		const templateCopy: EditorTemplateData = JSON.parse(JSON.stringify(templateData));

		// Resolve URLs through proxy for CORS handling
		if (templateCopy.front_background && !templateCopy.front_background.startsWith('blob:')) {
			const proxied = getProxiedUrl(templateCopy.front_background, 'templates');
			if (proxied) templateCopy.front_background = proxied;
		}
		if (templateCopy.back_background && !templateCopy.back_background.startsWith('blob:')) {
			const proxied = getProxiedUrl(templateCopy.back_background, 'templates');
			if (proxied) templateCopy.back_background = proxied;
		}

		currentTemplate = templateCopy;

		// Set dimensions
		if (currentTemplate?.width_pixels && currentTemplate?.height_pixels) {
			currentCardSize = {
				name: 'Custom',
				width: currentTemplate.width_pixels,
				height: currentTemplate.height_pixels,
				unit: 'pixels'
			};
			requiredPixelDimensions = {
				width: currentTemplate.width_pixels,
				height: currentTemplate.height_pixels
			};
		} else {
			// Fallback for legacy templates
			currentCardSize = LEGACY_CARD_SIZE;
			requiredPixelDimensions = cardSizeToPixels(LEGACY_CARD_SIZE, 300);
		}

		// Initialize elements
		const elements = currentTemplate?.template_elements || [];
		const split = splitElementsBySide(elements);
		frontElements = split.front.map(sanitizeElement);
		backElements = split.back.map(sanitizeElement);

		// Capture initial state for change tracking
		initialFrontElements = JSON.stringify(frontElements);
		initialBackElements = JSON.stringify(backElements);
		initialFrontBackground = currentTemplate?.front_background || null;
		initialBackBackground = currentTemplate?.back_background || null;

		// Warn if backgrounds are missing
		if (!currentTemplate?.front_background) {
			toast.warning('Front background image is missing. Please upload one.');
		}
		if (!currentTemplate?.back_background) {
			toast.warning('Back background image is missing. Please upload one.');
		}

		await tick();
	}

	async function handleTemplateSelect(id: string) {
		const template = templates.find((t) => t.id === id);
		if (template) {
			await initializeEditor(template);
			pushState(`?id=${id}`, {
				showModal: true,
				selectedTemplateId: id
			});
		}
	}

	function handleBack() {
		isEditMode = false;
		currentTemplate = null;
		errorMessage = '';
		pushState('', {});
	}

	function clearForm() {
		handleBack();
	}

	async function handleCreateNewTemplate(
		cardSize: CardSize,
		name: string,
		orientation: 'landscape' | 'portrait' = 'landscape',
		frontBackgroundUrl?: string
	) {
		console.log('✨ Creating new template:', { name, cardSize, orientation });

		// Calculate pixels
		const pixels = cardSizeToPixels(cardSize, 300); // Default to 300 DPI
		requiredPixelDimensions = pixels;
		currentCardSize = cardSize;

		// Create base template structure
		const newTemplate: EditorTemplateData = {
			id: crypto.randomUUID(), // Temporary ID for UI
			user_id: user?.id || '',
			org_id: org_id,
			name: name,
			description: '',
			front_background: frontBackgroundUrl || '',
			back_background: '',
			orientation: orientation,
			template_elements: [],
			width_pixels: pixels.width,
			height_pixels: pixels.height,
			dpi: 300,
			created_at: new Date().toISOString()
		};

		// Initialize editor
		currentTemplate = newTemplate;
		isEditMode = true;
		editorVersion++;

		// Create default elements (lazy load to ensure dimensions are set)
		const { frontElements: newFront, backElements: newBack } = await triggerElementCreation(
			requiredPixelDimensions,
			[],
			[],
			currentTemplate,
			null // No selected template from server since this is new
		);
		
		frontElements = newFront;
		backElements = newBack;
	}

	function updateElements(elements: TemplateElement[], side: 'front' | 'back') {
		if (side === 'front') {
			frontElements = elements;
		} else {
			backElements = elements;
		}
	}

	/**
	 * Handle decompose button click - navigates to decompose page
	 * Creates a template asset if one doesn't exist
	 */
	async function handleDecompose() {
		// Check if template is saved (has an ID)
		if (!currentTemplate?.id) {
			toast.error('Please save the template first before decomposing');
			return;
		}

		isDecomposing = true;
		try {
			const result = await getOrCreateDecomposeAsset({
				templateId: currentTemplate.id
			});

			if (result.success && result.assetId) {
				// Navigate to decompose page
				goto(`/admin/template-assets/decompose?assetId=${result.assetId}`);
			} else {
				toast.error(result.error || 'Failed to prepare decompose asset');
			}
		} catch (err) {
			console.error('Decompose error:', err);
			toast.error('Failed to start decomposition');
		} finally {
			isDecomposing = false;
		}
	}

	/**
	 * Update templates list after save
	 */
	function updateTemplatesList(savedTemplate: EditorTemplateData) {
		const existingIndex = templates.findIndex((t) => t.id === savedTemplate.id);

		if (existingIndex >= 0) {
			// Update existing template
			templates[existingIndex] = savedTemplate;
			console.log('📝 Updated template in local list:', savedTemplate.name);
		} else {
			// Add new template to the beginning of the list
			templates = [savedTemplate, ...templates];
			console.log('➕ Added new template to local list:', savedTemplate.name);
		}
	}

	/**
	 * Set current template directly (used when loading from URL)
	 */
	function setCurrentTemplate(template: EditorTemplateData | null) {
		currentTemplate = template;
	}

	/**
	 * Update current template name
	 */
	function updateTemplateName(name: string) {
		if (currentTemplate) {
			currentTemplate = { ...currentTemplate, name };
		}
	}

	// Use getters for reactive state
	return {
		get templates() { return templates; },
		get currentTemplate() { return currentTemplate; },
		get isEditMode() { return isEditMode; },
		set isEditMode(value) { isEditMode = value; },
		get editorVersion() { return editorVersion; },
		get errorMessage() { return errorMessage; },
		set errorMessage(value) { errorMessage = value; },
		get frontElements() { return frontElements; },
		set frontElements(value) { frontElements = value; },
		get backElements() { return backElements; },
		set backElements(value) { backElements = value; },
		get currentCardSize() { return currentCardSize; },
		get requiredPixelDimensions() { return requiredPixelDimensions; },
		get isDecomposing() { return isDecomposing; },
		set isDecomposing(value) { isDecomposing = value; },
		get hasChanges() { return hasChanges; },

		initializeEditor,
		handleTemplateSelect,
		handleBack,
		clearForm,
		handleCreateNewTemplate,
		updateElements,
		handleDecompose,
		updateTemplatesList,
		setCurrentTemplate,
		updateTemplateName,
		setCurrentBackgrounds
	};
}
