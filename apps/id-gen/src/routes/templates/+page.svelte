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
		orientation: 'landscape' | 'portrait';
		template_elements: TemplateElement[];
		created_at: string;
		updated_at?: string | null;
	};

	// Type for server response
	type ServerResponse = {
		success: boolean;
		data: DatabaseTemplate;
		message: string;
	};
import {
	needsCropping,
	cropBackgroundImage,
	getImageDimensions,
	generateCropPreviewUrl,
	type BackgroundPosition
} from '$lib/utils/imageCropper';
import { browser } from '$app/environment';
import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';
import { toast } from 'svelte-sonner';

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
			previewUrl?: string;
		};
		back?: {
			originalSize: { width: number; height: number };
			needsCropping: boolean;
			filename: string;
			previewUrl?: string;
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

		// Set loading state
		isLoading = true;
		errorMessage = '';

		// Show initial progress toast
		const toastId = toast.loading('Preparing template for save...', {
			duration: Infinity // Keep it until we update or dismiss it
		});

		try {
			// Reset pending save flag
			pendingSave = false;

			let frontUrl = frontPreview;
			let backUrl = backPreview;

			// Update progress: Processing images
			toast.loading('Processing background images...', { id: toastId });

			// Process front background with cropping if needed
			if (frontBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing front background...');
				
				// Update progress: Cropping front image
				toast.loading('Cropping front background image...', { id: toastId });
				
				const frontResult = await cropBackgroundImage(
					frontBackground,
					requiredPixelDimensions,
					frontBackgroundPosition
				);

				console.log('✅ Front image cropped:', {
					wasCropped: frontResult.wasCropped,
					originalSize: frontResult.originalSize,
					finalSize: frontResult.croppedSize
				});

				// Update progress: Uploading front image
				toast.loading('Uploading front background to storage...', { id: toastId });
				
			// Upload the cropped file with improved error handling and progress updates
			try {
				// 📄 Show detailed upload progress
				toast.loading('Uploading front image to cloud storage...', { id: toastId });
				console.log('📄 Starting front image upload...');
				
				frontUrl = await uploadImage(frontResult.croppedFile, `front_${Date.now()}`, user?.id);
				
				if (!frontUrl || typeof frontUrl !== 'string') {
					throw new Error('Upload succeeded but returned invalid URL');
				}
				
				console.log('✅ Front background uploaded successfully:', frontUrl);
				toast.loading('Front image uploaded ✓ Processing back image...', { id: toastId });
			} catch (uploadError) {
				console.error('❌ Front image upload failed:', uploadError);
				const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
				throw new Error(`Failed to upload front background: ${errorMsg}`);
			}
			}

			// Process back background with cropping if needed
			if (backBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing back background...');
				
				// Update progress: Cropping back image
				toast.loading('Cropping back background image...', { id: toastId });
				
				const backResult = await cropBackgroundImage(
					backBackground,
					requiredPixelDimensions,
					backBackgroundPosition
				);

				console.log('✅ Back image cropped:', {
					wasCropped: backResult.wasCropped,
					originalSize: backResult.originalSize,
					finalSize: backResult.croppedSize
				});

				// Update progress: Uploading back image
				toast.loading('Uploading back background to storage...', { id: toastId });
				
			// Upload the cropped file with improved error handling and progress updates
			try {
				// 📄 Show detailed upload progress
				toast.loading('Uploading back image to cloud storage...', { id: toastId });
				console.log('📄 Starting back image upload...');
				
				backUrl = await uploadImage(backResult.croppedFile, `back_${Date.now()}`, user?.id);
				
				if (!backUrl || typeof backUrl !== 'string') {
					throw new Error('Upload succeeded but returned invalid URL');
				}
				
				console.log('✅ Back background uploaded successfully:', backUrl);
				toast.loading('Both images uploaded ✓ Preparing to save...', { id: toastId });
			} catch (uploadError) {
				console.error('❌ Back image upload failed:', uploadError);
				const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
				throw new Error(`Failed to upload back background: ${errorMsg}`);
			}
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

			// 🚨 DEBUG: Track template ID handling
			console.log('🏷️ Template ID Debug:', {
				currentTemplate: currentTemplate,
				currentTemplateId: currentTemplate?.id,
				isEditingExisting: !!currentTemplate?.id,
				isCreatingNew: !currentTemplate?.id,
				willUseExistingId: !!currentTemplate?.id,
				willGenerateNewId: !currentTemplate?.id
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

			// 🚨 DEBUG: Confirm the final ID being sent
			console.log('💾 Final template data to save:', {
				id: templateDataToSave.id,
				name: templateDataToSave.name,
				isUpdate: !!currentTemplate?.id,
				hasExistingId: currentTemplate?.id === templateDataToSave.id
			});

			if (!templateDataToSave.user_id) {
				throw new Error('User ID is required');
			}

			if (!templateDataToSave.org_id) {
				throw new Error('Organization ID is required');
			}

			// Update progress: Saving to database
			toast.loading('Saving template to database...', { id: toastId });

			console.log('💾 Saving to database...');

			// Validate URLs before saving
			if (!frontUrl || !backUrl) {
				throw new Error('Failed to process background images - missing URLs');
			}

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

			// 🚨 DEBUG: Parse response as raw text first to see what we're actually getting
			const responseText = await response.text();
			console.log('🔍 RAW server response text:', responseText);
			console.log('🔍 RAW response text length:', responseText.length);
			
			// Try to parse as JSON
			let result;
			try {
				result = JSON.parse(responseText);
				console.log('🔍 Parsed JSON result:', {
					result: result,
					type: typeof result,
					isArray: Array.isArray(result),
					keys: result && typeof result === 'object' ? Object.keys(result) : 'N/A'
				});
			} catch (jsonError) {
				console.error('❌ Failed to parse JSON response:', jsonError);
				throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}...`);
			}

			// Handle server response based on actual format
			if (result && typeof result === 'object') {
				// Check for SvelteKit form action format: { type: 'success', data: {...} } 
				if (result.type === 'success' && result.data) {
					console.log('✅ SvelteKit form action success format detected');
					result.success = true; // Normalize to our expected format
				} else if (result.type === 'failure') {
					console.error('❌ SvelteKit form action failed:', result);
					throw new Error(result.message || 'Server form action failed');
				}
				
				// Check for our custom format: { success: true, data: {...} }
				if (result.success === false) {
					const errorMsg = result.message || 'Server action failed';
					console.error('❌ Server action failed:', errorMsg);
					throw new Error(errorMsg);
				}
				
				// Ensure we have data
				if (!result.data) {
					console.error('❌ No template data in server response. Full result:', result);
					throw new Error('No template data received from server');
				}
			} else {
				console.error('❌ Unexpected response format:', typeof result, result);
				throw new Error('Server returned unexpected response format');
			}

			const savedTemplate = result.data;
			
			// Debug the saved template structure
			console.log('✅ Template data received:', {
				id: savedTemplate.id,
				name: savedTemplate.name,
				hasElements: !!savedTemplate.template_elements,
				elementsCount: savedTemplate.template_elements?.length
			});
			if (!savedTemplate.id) {
				console.error('❌ Template saved but no ID returned');
				throw new Error('Template was not saved properly - no ID returned');
			}

			// Validate that critical data was saved correctly
			if (!savedTemplate.name || !savedTemplate.front_background || !savedTemplate.back_background) {
				console.error('❌ Template saved but missing critical data:', {
					hasName: !!savedTemplate.name,
					hasFrontBg: !!savedTemplate.front_background,
					hasBackBg: !!savedTemplate.back_background
				});
				throw new Error('Template was saved but some data appears to be missing');
			}

			// Validate that template elements were saved
			if (!savedTemplate.template_elements || savedTemplate.template_elements.length === 0) {
				console.error('❌ Template saved but no elements found');
				throw new Error('Template was saved but template elements were not stored properly');
			}

			console.log('✅ Template saved and validated successfully:', {
				id: savedTemplate.id,
				name: savedTemplate.name,
				elementsCount: savedTemplate.template_elements?.length,
				action: templateDataToSave.id ? 'updated' : 'created',
				frontBgUrl: !!savedTemplate.front_background,
				backBgUrl: !!savedTemplate.back_background
			});

			// Show success toast notification
			const action = templateDataToSave.id ? 'updated' : 'created';
			toast.success(`Template ${action} successfully!`, {
				description: `"${savedTemplate.name}" with ${savedTemplate.template_elements.length} elements has been saved.`,
				duration: 4000
			});

			// Update local templates array instead of full page reload
			await refreshTemplatesList(savedTemplate);
			
			// Go back to templates list if we were creating/editing
			if (isEditMode) {
				handleBack();
			}
		} catch (error) {
			console.error('❌ Error saving template:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
			errorMessage = `Error saving template: ${errorMsg}`;
			
			// Show error toast notification
			toast.error('Failed to save template', {
				description: errorMsg,
				duration: 6000
			});
		} finally {
			// Always reset loading state
			isLoading = false;
			
			// Dismiss the progress toast
			toast.dismiss(toastId);
		}
	}

	/**
	 * Updates the local templates list without requiring a full page reload
	 */
	async function refreshTemplatesList(savedTemplate: DatabaseTemplate) {
		try {
			// Check if this is an update or create
			const existingIndex = templates.findIndex(t => t.id === savedTemplate.id);
			
			if (existingIndex >= 0) {
				// Update existing template
				templates[existingIndex] = savedTemplate;
				console.log('📝 Updated template in local list:', savedTemplate.name);
			} else {
				// Add new template to the beginning of the list
				templates = [savedTemplate, ...templates];
				console.log('➕ Added new template to local list:', savedTemplate.name);
			}
			
			// Optional: Fetch fresh data from server to ensure consistency
			// This is a fallback in case the local update doesn't work perfectly
			setTimeout(async () => {
				try {
					const response = await fetch('/templates');
					if (response.ok) {
						const html = await response.text();
						// We could parse the HTML to extract fresh template data if needed
						console.log('🔄 Background refresh completed');
					}
				} catch (error) {
					console.warn('⚠️ Background refresh failed:', error);
				}
			}, 2000); // Refresh in background after 2 seconds
			
		} catch (error) {
			console.error('❌ Error refreshing templates list:', error);
			// Fallback: reload the page if local update fails
			toast.info('Refreshing templates...', {
				description: 'The page will reload to show the latest templates.',
				duration: 2000
			});
			setTimeout(() => window.location.reload(), 2000);
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

			// Generate preview URLs and populate dialog data
			croppingDialogData = {};
			
			// Process each result and generate preview URLs
			for (const result of cropCheckResults) {
				try {
					// Generate preview URL using the new utility
					const position = result.side === 'front' ? frontBackgroundPosition : backBackgroundPosition;
					const previewUrl = await generateCropPreviewUrl(
						result.file,
						requiredPixelDimensions,
						position
					);
					
					if (result.side === 'front') {
						croppingDialogData.front = {
							originalSize: result.originalSize,
							needsCropping: result.needsCropping,
							filename: result.file.name,
							previewUrl
						};
					} else {
						croppingDialogData.back = {
							originalSize: result.originalSize,
							needsCropping: result.needsCropping,
							filename: result.file.name,
							previewUrl
						};
					}
					
					console.log(`🖼️ Generated crop preview for ${result.side}:`, {
						needsCropping: result.needsCropping,
						originalSize: result.originalSize,
						position,
						previewLength: previewUrl.length
					});
				} catch (error) {
					console.warn(`⚠️ Failed to generate preview for ${result.side}:`, error);
					// Continue without preview URL
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
				}
			}

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
		// Reset currentTemplate to null instead of empty object
		// This ensures ID generation works correctly for new templates
		currentTemplate = null;
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
