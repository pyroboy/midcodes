<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import TemplateList from '$lib/components/TemplateList.svelte';
	import TemplateEdit from '$lib/components/TemplateEdit.svelte';
	import CroppingConfirmationDialog from '$lib/components/CroppingConfirmationDialog.svelte';
	import { uploadImage } from '$lib/database';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import { pushState } from '$app/navigation';
	import type { TemplateElement, TemplateData } from '$lib/stores/templateStore';
	import type { CardSize } from '$lib/utils/sizeConversion';
	import { cardSizeToPixels } from '$lib/utils/sizeConversion';

	// Type that matches the actual database schema
	type DatabaseTemplate = {
		id: string;
		user_id: string;
		name: string;
		description?: string | null;
		org_id: string;
		front_background: string;
		back_background: string;
		front_background_url?: string | null;
		back_background_url?: string | null;
		orientation: 'landscape' | 'portrait';
		template_elements: TemplateElement[];
		created_at: string;
		updated_at?: string | null;
	};
import {
	needsCropping,
	cropBackgroundImage,
	getImageDimensions,
	type BackgroundPosition
} from '$lib/utils/imageCropper';
import { browser } from '$app/environment';
import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';

	// data means get data from server
	let { data } = $props();

	let templates = $state<DatabaseTemplate[]>(data.templates);

	let user = $state(data.user);
	let org_id = $state(data.org_id);

	let frontBackground: File | null = null;
	let backBackground: File | null = null;
	let frontPreview: string | null = $state(null);
	let backPreview: string | null = $state(null);
	let errorMessage = $state('');
	let currentTemplate: DatabaseTemplate | null = $state(null);
	let frontElements: TemplateElement[] = $state([]);
	let backElements: TemplateElement[] = $state([]);

	// Current template size info
	let currentCardSize: CardSize | null = $state(null);
	let requiredPixelDimensions: { width: number; height: number } | null = $state(null);

	// Add view mode state
	let isLoading = $state(false);
	let isEditMode = $state(false);
	
	// Preload 3D card geometries for templates
	const templateGeometries = $state<Record<string, any>>({});
	let readyModelsCount = $state(0);
	let totalTemplatesCount = $state(0);

	// Background position tracking for cropping
	let frontBackgroundPosition: BackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
	let backBackgroundPosition: BackgroundPosition = $state({ x: 0, y: 0, scale: 1 });

	// Cropping dialog state
	let showCroppingDialog = $state(false);
	let pendingSave = $state(false);
	let croppingDialogData = $state<{
		front?: {
			originalSize: { width: number; height: number };
			needsCropping: boolean;
			filename: string;
		};
		back?: {
			originalSize: { width: number; height: number };
			needsCropping: boolean;
			filename: string;
		};
	}>({});

	async function validateBackgrounds(): Promise<boolean> {
		if ((!frontBackground && !frontPreview) || (!backBackground && !backPreview)) {
			errorMessage =
				'Both front and back backgrounds are required. Please ensure both are present.';
			return false;
		}

		// Only validate that images can be loaded - cropping handles size requirements
		if (frontBackground) {
			const frontValid = await validateImage(frontBackground, 'front');
			if (!frontValid) return false;
		}

		if (backBackground) {
			const backValid = await validateImage(backBackground, 'back');
			if (!backValid) return false;
		}
		return true;
	}

	async function validateImage(file: File, side: string): Promise<boolean> {
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
			errorMessage = `Error loading ${side} background image. Please try again.`;
			return false;
		}
	}

	async function saveTemplate() {
		if (!(await validateBackgrounds())) {
			return;
		}

		// Check if cropping is needed before proceeding
		if (!pendingSave) {
			await checkAndShowCroppingDialog();
			return;
		}

		try {
			// Reset pending save flag
			pendingSave = false;

			let frontUrl = frontPreview;
			let backUrl = backPreview;

			// Process front background with cropping if needed
			if (frontBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing front background...');
				const frontResult = await cropBackgroundImage(
					frontBackground,
					requiredPixelDimensions,
					frontBackgroundPosition
				);

				// Use the cropped file for upload
				frontBackground = frontResult.croppedFile;
				frontUrl = await uploadImage(frontResult.croppedFile, 'front', user?.id);
				console.log('✅ Front background processed and uploaded:', {
					wasCropped: frontResult.wasCropped,
					originalSize: frontResult.originalSize,
					finalSize: frontResult.croppedSize,
					url: frontUrl
				});
			}

			// Process back background with cropping if needed
			if (backBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing back background...');
				const backResult = await cropBackgroundImage(
					backBackground,
					requiredPixelDimensions,
					backBackgroundPosition
				);

				// Use the cropped file for upload
				backBackground = backResult.croppedFile;
				backUrl = await uploadImage(backResult.croppedFile, 'back', user?.id);
				console.log('✅ Back background processed and uploaded:', {
					wasCropped: backResult.wasCropped,
					originalSize: backResult.originalSize,
					finalSize: backResult.croppedSize,
					url: backUrl
				});
			}

			// Combine front and back elements
			const allElements = [...frontElements, ...backElements];

			// Debug elements state
			console.log('🔍 Elements debug:', {
				frontElements: frontElements.length,
				backElements: backElements.length,
				allElements: allElements.length,
				frontElementsData: frontElements,
				backElementsData: backElements
			});

			// Validate elements
			if (allElements.length === 0) {
				console.error('❌ No template elements found');
				throw new Error(
					'No template elements provided - elements may not have been created yet. Try adding some elements to the template first.'
				);
			}

			console.log('🔍 URLs before saving to database:', {
				frontUrl: frontUrl,
				backUrl: backUrl,
				frontUrlType: typeof frontUrl,
				backUrlType: typeof backUrl
			});

			const templateDataToSave = {
				id: currentTemplate?.id || crypto.randomUUID(),
				user_id: user?.id ?? '',
				name: currentTemplate?.name || 'Untitled Template',
				front_background: frontUrl || '',
				back_background: backUrl || '',
				orientation: currentTemplate?.orientation ?? 'landscape',
				template_elements: allElements,
				created_at: currentTemplate?.created_at || new Date().toISOString(),
				org_id: org_id ?? ''
			};

			if (!templateDataToSave.user_id) {
				throw new Error('User ID is required');
			}

			if (!templateDataToSave.org_id) {
				throw new Error('Organization ID is required');
			}

			console.log('💾 Saving to database...');

			// Create form data
			const formData = new FormData();
			formData.append('templateData', JSON.stringify(templateDataToSave));

			// Use fetch to call the server action
			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Server error:', errorText);
				throw new Error(`Server error: ${errorText}`);
			}

			const result = await response.json();

			if (result.type === 'failure') {
				console.error('❌ Server action failed:', result);
				throw new Error(result.message || 'Failed to save template');
			}

			if (!result.data) {
				console.error('❌ No template data received');
				throw new Error('No template data received');
			}

			console.log('✅ Template saved successfully:', {
				savedData: result.data
			});

			alert('Template saved successfully!');
			window.location.reload();
		} catch (error) {
			console.error('❌ Error saving template:', error);
			errorMessage = `Error saving template: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
		}
	}

	async function checkAndShowCroppingDialog() {
		if (!requiredPixelDimensions || (!frontBackground && !backBackground)) {
			// No cropping needed or no files to check
			pendingSave = true;
			await saveTemplate();
			return;
		}

		try {
			const cropCheckResults: Array<{
				side: 'front' | 'back';
				file: File;
				needsCropping: boolean;
				originalSize: { width: number; height: number };
			}> = [];

			// Check front background
			if (frontBackground) {
				const frontSize = await getImageDimensions(frontBackground);
				const frontNeedsCropping = needsCropping(
					frontSize,
					requiredPixelDimensions,
					frontBackgroundPosition
				);
				cropCheckResults.push({
					side: 'front',
					file: frontBackground,
					needsCropping: frontNeedsCropping,
					originalSize: frontSize
				});
			}

			// Check back background
			if (backBackground) {
				const backSize = await getImageDimensions(backBackground);
				const backNeedsCropping = needsCropping(
					backSize,
					requiredPixelDimensions,
					backBackgroundPosition
				);
				cropCheckResults.push({
					side: 'back',
					file: backBackground,
					needsCropping: backNeedsCropping,
					originalSize: backSize
				});
			}

			// Populate dialog data
			croppingDialogData = {};
			cropCheckResults.forEach((result) => {
				if (result.side === 'front') {
					croppingDialogData.front = {
						originalSize: result.originalSize,
						needsCropping: result.needsCropping,
						filename: result.file.name
					};
				} else {
					croppingDialogData.back = {
						originalSize: result.originalSize,
						needsCropping: result.needsCropping,
						filename: result.file.name
					};
				}
			});

			// If any cropping is needed, show dialog
			const anyCroppingNeeded = cropCheckResults.some((result) => result.needsCropping);

			if (anyCroppingNeeded || cropCheckResults.length > 0) {
				showCroppingDialog = true;
			} else {
				// No cropping needed, proceed directly
				pendingSave = true;
				await saveTemplate();
			}
		} catch (error) {
			console.error('❌ Error checking cropping requirements:', error);
			errorMessage = `Error checking images: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	function handleCroppingConfirm() {
		showCroppingDialog = false;
		pendingSave = true;
		saveTemplate();
	}

	function handleCroppingCancel() {
		showCroppingDialog = false;
		pendingSave = false;
	}

	async function handleImageUpload(files: File[], side: 'front' | 'back') {
		const file = files[0];
		if (side === 'front') {
			frontBackground = file;
			frontPreview = URL.createObjectURL(file);
		} else {
			backBackground = file;
			backPreview = URL.createObjectURL(file);
		}

		// Trigger element creation if elements are empty and dimensions are available
		await triggerElementCreation();
	}

	async function triggerElementCreation() {
		// Wait a bit for the dimensions to be processed
		await new Promise((resolve) => setTimeout(resolve, 100));

		if (requiredPixelDimensions && frontElements.length === 0 && backElements.length === 0) {
			console.log('🔧 Creating default template elements...');

			// Import the element creation utility
			const { createAdaptiveElements } = await import('$lib/utils/adaptiveElements');

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

			// Update the elements arrays
			frontElements = frontElems;
			backElements = backElems;

			console.log('✅ Created template elements:', {
				front: frontElems.length,
				back: backElems.length
			});
		}
	}

	function handleRemoveImage(side: 'front' | 'back') {
		if (side === 'front') {
			frontBackground = null;
			frontPreview = null;
		} else {
			backBackground = null;
			backPreview = null;
		}
	}

	async function handleTemplateSelect(id: string) {
		try {
			isEditMode = true;

			// Navigate to new URL (this will handle state properly)
			await goto(`/templates?id=${id}`, { replaceState: true });

			if (data.selectedTemplate) {
				currentTemplate = data.selectedTemplate;
				// Convert storage paths to full URLs if they're not already URLs
				frontPreview = data.selectedTemplate.front_background?.startsWith('http') 
					? data.selectedTemplate.front_background
					: data.selectedTemplate.front_background 
						? getSupabaseStorageUrl(data.selectedTemplate.front_background, 'templates')
						: null;
				backPreview = data.selectedTemplate.back_background?.startsWith('http')
					? data.selectedTemplate.back_background
					: data.selectedTemplate.back_background
						? getSupabaseStorageUrl(data.selectedTemplate.back_background, 'templates')
						: null;
				frontElements = (data.selectedTemplate.template_elements as TemplateElement[]).filter(
					(el) => el.side === 'front'
				);
				backElements = (data.selectedTemplate.template_elements as TemplateElement[]).filter(
					(el) => el.side === 'back'
				);

				// Set size data for existing template
				if (data.selectedTemplate.width_pixels && data.selectedTemplate.height_pixels) {
					// Template has new size fields
					currentCardSize = {
						name: data.selectedTemplate.name,
						width: data.selectedTemplate.unit_width || data.selectedTemplate.width_pixels,
						height: data.selectedTemplate.unit_height || data.selectedTemplate.height_pixels,
						unit: (data.selectedTemplate.unit_type as any) || 'pixels'
					};
					requiredPixelDimensions = {
						width: data.selectedTemplate.width_pixels,
						height: data.selectedTemplate.height_pixels
					};
				} else {
					// Legacy template - use hardcoded dimensions
					currentCardSize = {
						name: 'Legacy Template',
						width: 1013,
						height: 638,
						unit: 'pixels' as const
					};
					requiredPixelDimensions = {
						width: 1013,
						height: 638
					};
				}
			}
		} catch (err: unknown) {
			const error = err instanceof Error ? err : new Error('An unexpected error occurred');
			console.error('❌ EditTemplate: Error:', error);
			errorMessage = error.message;
			isEditMode = false;
		}
	}

	function updateElements(elements: TemplateElement[], side: 'front' | 'back') {
		if (side === 'front') {
			frontElements = elements;
		} else {
			backElements = elements;
		}
	}

	function handleBack() {
		isEditMode = false;
		clearForm();
	}

	function clearForm() {
		console.log('🔄 EditTemplate: Clearing form');
		frontBackground = null;
		backBackground = null;
		frontPreview = null;
		backPreview = null;
		frontElements = [];
		backElements = [];
		errorMessage = '';
		currentTemplate = {
			id: '',
			user_id: user?.id ?? '',
			name: '',
			front_background: '',
			back_background: '',
			orientation: 'landscape' as const,
			template_elements: [],
			created_at: new Date().toISOString(),
			org_id: org_id ?? ''
		};
		console.log('✅ EditTemplate: Form cleared');
	}

	function handleCreateNewTemplate(cardSize: CardSize, templateName: string) {
		// Set up new template creation
		currentCardSize = cardSize;
		requiredPixelDimensions = cardSizeToPixels(cardSize, 300); // Use hardcoded DPI

		// Create new template with only database-compatible properties
		currentTemplate = {
			id: crypto.randomUUID(),
			user_id: user?.id ?? '',
			name: templateName,
			front_background: '',
			back_background: '',
			orientation: cardSize.width >= cardSize.height ? 'landscape' : 'portrait',
			template_elements: [],
			created_at: new Date().toISOString(),
			org_id: org_id ?? ''
		};

		// Clear existing data
		frontBackground = null;
		backBackground = null;
		frontPreview = null;
		backPreview = null;
		frontElements = [];
		backElements = [];
		errorMessage = '';

		// Enter edit mode
		isEditMode = true;

		console.log('✅ New template created:', {
			name: templateName,
			cardSize: cardSize,
			pixelDimensions: requiredPixelDimensions
		});
	}

	// Load 3D geometries for all templates asynchronously
	$effect(() => {
		if (browser && templates && templates.length > 0) {
			totalTemplatesCount = templates.length;
			readyModelsCount = 0;
			
			console.log(`🚀 Templates: Starting 3D model generation for ${totalTemplatesCount} templates...`);
			
			// Process each template
			templates.forEach(async (template) => {
				const templateName = template.name;
				try {
					console.log(`🔄 Creating 3D model for template "${templateName}"...`);
					
					// Use default card dimensions for all templates since size fields don't exist in DB
					const geometry = await createCardFromInches(3.375, 2.125); // Standard credit card size
					
					templateGeometries[templateName] = geometry;
					readyModelsCount++;
					
					console.log(`✅ 3D model ready for template "${templateName}" (${readyModelsCount}/${totalTemplatesCount})`);
					
					// Log when all models are ready
					if (readyModelsCount === totalTemplatesCount) {
						console.log(`🎉 All ${totalTemplatesCount} template 3D models are ready!`);
					}
				} catch (error) {
					console.error(`❌ Failed to create 3D model for template "${templateName}":`, error);
					// Still increment count to avoid hanging
					readyModelsCount++;
					if (readyModelsCount === totalTemplatesCount) {
						console.log(`⚠️ Template 3D model generation completed with ${Object.keys(templateGeometries).length} successful models out of ${totalTemplatesCount}`);
					}
				}
			});
		}
	});

	onMount(() => {
		const handlePopState = (event: PopStateEvent) => {
			if (isEditMode) {
				handleBack();
				// Push a new state to prevent going back
				history.pushState({ editing: true }, '', window.location.href);
			}
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	});
</script>

<main class="h-full">
	<div class="edit-template-container {isEditMode ? 'edit-mode' : ''}">
		{#if !isEditMode}
			<TemplateList
				templates={templates ?? []}
				onSelect={(id: string) => handleTemplateSelect(id)}
				onCreateNew={handleCreateNewTemplate}
			/>
		{:else}
			<TemplateEdit
				{isLoading}
				{frontElements}
				{backElements}
				{frontPreview}
				{backPreview}
				{errorMessage}
				cardSize={currentCardSize}
				pixelDimensions={requiredPixelDimensions}
				onBack={handleBack}
				onSave={saveTemplate}
				onClear={clearForm}
				onUpdateElements={(elements, side) => updateElements(elements, side)}
				onImageUpload={(files, side) => handleImageUpload(files, side)}
				onRemoveImage={(side) => handleRemoveImage(side)}
				onUpdateBackgroundPosition={(position, side) => {
			$state.snapshot(`Background side updated for ${side}:`);
			$state.snapshot(`Background position updated for ${position}`);
					if (side === 'front') {
						frontBackgroundPosition = { ...position };
					} else {
						backBackgroundPosition = { ...position };
					}
				}}
			/>
		{/if}
	</div>

	<!-- Cropping Confirmation Dialog -->
	<CroppingConfirmationDialog
		bind:open={showCroppingDialog}
		frontImageInfo={croppingDialogData.front || null}
		backImageInfo={croppingDialogData.back || null}
		templateSize={requiredPixelDimensions || { width: 1013, height: 638 }}
		onConfirm={handleCroppingConfirm}
		onCancel={handleCroppingCancel}
	/>
</main>

<style>
	.edit-template-container {
		display: flex;
		width: 100%;
		height: 100%;
		transition: all 0.3s ease;
	}

	.edit-template-container.edit-mode {
		justify-content: center;
	}



	:global(.animate-pulse) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
