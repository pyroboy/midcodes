<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { invalidate, goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import TemplatesPageSkeleton from '$lib/components/skeletons/TemplatesPageSkeleton.svelte';
	import { getPreloadState } from '$lib/services/preloadService';
	import TemplateList from '$lib/components/TemplateList.svelte';
	import TemplateEdit from '$lib/components/TemplateEdit.svelte';
	import CroppingConfirmationDialog from '$lib/components/CroppingConfirmationDialog.svelte';
	import { getStorageUrl } from '$lib/utils/storage';
	import { generateAndUploadVariants, type VariantUrls } from '$lib/utils/templateVariants';

	// Upload image via server action to R2
	async function uploadImage(file: File, path: string, userId?: string): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('path', path);
		if (userId) formData.append('userId', userId);

		try {
			const response = await fetch('?/uploadImage', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());
			console.log('[uploadImage] Server response (deserialized):', result);
		
			if (result.type === 'success') {
				const data = result.data as any;
				if (data?.url) return data.url;
			}
			
			if (result.type === 'failure') {
				const data = result.data as any;
				throw new Error(data?.error || 'Upload failed');
			}

			if (result.type === 'error') {
				throw new Error(result.error?.message || 'Upload error');
			}
			
			throw new Error('Invalid response from upload server: ' + JSON.stringify(result));
		} catch (e) {
			console.error('[uploadImage] Error:', e);
			throw e;
		}
	}
	import { pushState } from '$app/navigation';
	import type { TemplateElement, TemplateData } from '$lib/stores/templateStore';
	import type { CardSize } from '$lib/utils/sizeConversion';
	import {
		cardSizeToPixels,
		LEGACY_CARD_SIZE,
		COMMON_CARD_SIZES,
		findClosestCardSize,
		switchOrientation
	} from '$lib/utils/sizeConversion';
	import { createAdaptiveElements } from '$lib/utils/adaptiveElements';

	/**
	 * Robustly detect orientation from pixel dimensions
	 * @returns 'portrait' if height > width, 'landscape' otherwise
	 */
	function detectOrientationFromDimensions(width: number, height: number): 'landscape' | 'portrait' {
		return height > width ? 'portrait' : 'landscape';
	}

	/**
	 * Ensure pixel dimensions are correctly oriented for the given orientation.
	 * If the current dimensions don't match the expected orientation, swap them.
	 * @param dims Current pixel dimensions
	 * @param expectedOrientation The orientation the dimensions should represent
	 * @returns Correctly oriented dimensions
	 */
	function getOrientationAwarePixelDimensions(
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

	// Smart Loading State
	const preloadState = getPreloadState('/templates');
	let isStructureReady = $derived($preloadState?.serverData === 'ready');
	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;
	});

	// Type that matches the actual database schema
	type DatabaseTemplate = {
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
		template_elements: TemplateElement[];
		width_pixels?: number;
		height_pixels?: number;
		dpi?: number;
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
		createLowResVersion,
		type BackgroundPosition
	} from '$lib/utils/imageCropper';
	import { browser } from '$app/environment';
	import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';
	import { toast } from 'svelte-sonner';
	import { imageCache } from '$lib/utils/imageCache';
	import IdCanvas from '$lib/components/IdCanvas.svelte';
	import { FlipHorizontal, FlipVertical, Save, X, Edit, RotateCcw } from 'lucide-svelte';

	// Convert a Blob/File to a base64 data URL for stable, in-memory previews
	async function blobToDataUrl(fileOrBlob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(fileOrBlob);
		});
	}

	// data means get data from server
	let {
		data
	}: {
		data: {
			templates: DatabaseTemplate[];
			selectedTemplate?: any;
			user: any;
			org_id: string;
			newTemplateParams?: { name: string; width: number; height: number; unit: string; orientation?: 'landscape' | 'portrait'; front_background?: string } | null;
		};
	} = $props();

	let templates = $state<DatabaseTemplate[]>(untrack(() => data.templates));
	let user = $state(untrack(() => data.user));
	let org_id = $state(untrack(() => data.org_id));

	$effect(() => {
		templates = data.templates;
		user = data.user;
		org_id = data.org_id;
	});

	let frontBackground: File | null = null;
	let backBackground: File | null = null;
	let frontPreview: string | null = $state(null);
	let backPreview: string | null = $state(null);
	// Separate crop preview URLs for final output validation
	let frontCropPreview: string | null = $state(null);
	let backCropPreview: string | null = $state(null);
	let errorMessage = $state('');
	let currentTemplate: DatabaseTemplate | null = $state(null);
	let frontElements: TemplateElement[] = $state([]);
	let backElements: TemplateElement[] = $state([]);
	// Force-reload knob for the editor when child components hold internal state
	let editorVersion = $state(0);

	// Current template size info
	let currentCardSize: CardSize | null = $state(null);
	let requiredPixelDimensions: { width: number; height: number } | null = $state(null);

	// Edit mode state
	let isEditMode = $state(false);
	let isSaving = $state(false);

	// Review & Animation State
	let isReviewing = $state(false);
	let reviewSide = $state<'front' | 'back'>('front');
	let reviewRotation = $state(0);
	
	// Fly Animation State
	let isClosingReview = $state(false);
	let flyTarget = $state<{ top: number; left: number; width: number; height: number } | null>(null);
	let savingTemplateId = $state<string | null>(null);

	function startReview() {
		console.log('👀 Starting Template Review');
		if (!currentTemplate?.name) {
			toast.error('Please enter a template name first');
			return;
		}
		if (!frontPreview || !backPreview) {
			toast.error('Both front and back designs are required');
			return;
		}
		isReviewing = true;
		reviewSide = 'front';
		reviewRotation = 0;
	}

	function cancelReview() {
		isReviewing = false;
	}

	function flipReview() {
		reviewSide = reviewSide === 'front' ? 'back' : 'front';
		reviewRotation += 180;
	}

	// Preload 3D card geometries for templates
	const templateGeometries = $state<Record<string, any>>({});
	let readyModelsCount = $state(0);
	let totalTemplatesCount = $state(0);

	// Background position tracking for cropping
	let frontBackgroundPosition: BackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
	let backBackgroundPosition: BackgroundPosition = $state({ x: 0, y: 0, scale: 1 });

	// Drag performance optimization state
	let isDraggingBackground = $state(false);
	let dragUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastPositionUpdateTime = $state(0);
	let positionUpdateCount = $state(0);

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

	// NEW: Auto-load from URL data
	$effect(() => {
		// If server provided a template (via ?id=...) AND we haven't loaded it yet
		if (data.selectedTemplate && currentTemplate?.id !== data.selectedTemplate.id) {
			initializeEditor(data.selectedTemplate);
		}
	});

	// Handle new template creation from home page
	let hasHandledNewTemplate = $state(false);
	$effect(() => {
		if (data.newTemplateParams && !hasHandledNewTemplate) {
			hasHandledNewTemplate = true;
			
			// Debug: Log the incoming newTemplateParams
			console.log('📥 [Templates Page] Received newTemplateParams from server:', {
				name: data.newTemplateParams.name,
				width: data.newTemplateParams.width,
				height: data.newTemplateParams.height,
				unit: data.newTemplateParams.unit,
				orientation: data.newTemplateParams.orientation,
				front_background: data.newTemplateParams.front_background,
				front_background_length: data.newTemplateParams.front_background?.length || 0,
				front_background_type: typeof data.newTemplateParams.front_background
			});
			
			// Create CardSize from params
			const cardSize: CardSize = {
				name: data.newTemplateParams.name,
				width: data.newTemplateParams.width,
				height: data.newTemplateParams.height,
				unit: data.newTemplateParams.unit as 'inches' | 'mm' | 'cm' | 'pixels'
			};
			// Trigger new template creation with optional front_background
			handleCreateNewTemplate(
				cardSize, 
				data.newTemplateParams.name,
				data.newTemplateParams.orientation,
				data.newTemplateParams.front_background
			);
		}
	});

	/**
	 * Find the best default size for legacy templates by analyzing existing templates
	 * or falling back to a reasonable standard size
	 */
	function findBestDefaultSize(): CardSize {
		// If no templates exist, use the standard credit card size
		if (!templates || templates.length === 0) {
			return COMMON_CARD_SIZES.find((size) => size.name === 'CR80 (ATM Size)') || LEGACY_CARD_SIZE;
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
		return COMMON_CARD_SIZES.find((size) => size.name === 'CR80 (ATM Size)') || LEGACY_CARD_SIZE;
	}

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
			let frontLowResUrl: string | null = (currentTemplate as any)?.front_background_low_res || null;
			let backLowResUrl: string | null = (currentTemplate as any)?.back_background_low_res || null;

			// Store cropped blobs for variant generation
			let croppedFrontBlob: Blob | null = null;
			let croppedBackBlob: Blob | null = null;

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

				// Store cropped blob for variant generation
				croppedFrontBlob = frontResult.croppedFile;

				// Immediately preview the cropped image using a stable data URL
				try {
					const dataUrl = await blobToDataUrl(frontResult.croppedFile);
					frontPreview = dataUrl; // Stable, no need to revoke
				} catch (e) {
					console.warn('Failed converting front blob to data URL', e);
				}

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

					// Generate and upload low-res version
					try {
						console.log('🖼️ Generating front low-res version...');
						const frontLowRes = await createLowResVersion(frontResult.croppedFile);
						console.log('📄 Uploading front low-res image...');
						frontLowResUrl = await uploadImage(frontLowRes, `front_low_${Date.now()}`, user?.id);
						console.log('✅ Front low-res uploaded:', frontLowResUrl);
					} catch (lowResError) {
						console.warn('⚠️ Failed to generate/upload front low-res (non-fatal):', lowResError);
						// Fallback to high-res if low-res fails
						frontLowResUrl = frontUrl; 
					}

					console.log('✅ Front background uploaded successfully:', frontUrl);
					toast.loading('Front image uploaded ✓ Processing back image...', { id: toastId });
				} catch (uploadError) {
					console.error('❌ Front image upload failed:', uploadError);
					const errorMsg =
						uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
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

				// Store cropped blob for variant generation
				croppedBackBlob = backResult.croppedFile;

				// Immediately preview the cropped image using a stable data URL
				try {
					const dataUrl = await blobToDataUrl(backResult.croppedFile);
					backPreview = dataUrl;
				} catch (e) {
					console.warn('Failed converting back blob to data URL', e);
				}

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

					// Generate and upload low-res version
					try {
						console.log('🖼️ Generating back low-res version...');
						const backLowRes = await createLowResVersion(backResult.croppedFile);
						console.log('📄 Uploading back low-res image...');
						backLowResUrl = await uploadImage(backLowRes, `back_low_${Date.now()}`, user?.id);
						console.log('✅ Back low-res uploaded:', backLowResUrl);
					} catch (lowResError) {
						console.warn('⚠️ Failed to generate/upload back low-res (non-fatal):', lowResError);
						// Fallback to high-res if low-res fails
						backLowResUrl = backUrl;
					}

					console.log('✅ Back background uploaded successfully:', backUrl);
					toast.loading('Both images uploaded ✓ Preparing to save...', { id: toastId });
				} catch (uploadError) {
					console.error('❌ Back image upload failed:', uploadError);
					const errorMsg =
						uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
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

			// Generate and upload asset variants (thumb, preview, blank, sample)
			let variantUrls: VariantUrls = {
				thumb_front_url: '',
				thumb_back_url: '',
				preview_front_url: '',
				preview_back_url: '',
				blank_front_url: '',
				blank_back_url: '',
				sample_front_url: '',
				sample_back_url: ''
			};

			if (croppedFrontBlob && croppedBackBlob && requiredPixelDimensions) {
				try {
					toast.loading('Generating template variants...', { id: toastId });
					console.log('🎨 Generating template variants...');

					const templateId = currentTemplate?.id || crypto.randomUUID();
					variantUrls = await generateAndUploadVariants(
						{
							templateId,
							frontBackground: croppedFrontBlob,
							backBackground: croppedBackBlob,
							elements: allElements,
							dimensions: requiredPixelDimensions
						},
						async (file, path) => await uploadImage(file, path, user?.id)
					);

					console.log('✅ Variants generated and uploaded:', variantUrls);
					toast.loading('Variants uploaded ✓ Saving to database...', { id: toastId });
				} catch (variantError) {
					console.warn('⚠️ Failed to generate variants (non-fatal):', variantError);
					// Continue saving without variants - they're non-critical
				}
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

			// Ensure we are saving the exact dimensions used in the editor
			const widthToSave = requiredPixelDimensions?.width || (currentTemplate as any)?.width_pixels || LEGACY_CARD_SIZE.width;
			const heightToSave = requiredPixelDimensions?.height || (currentTemplate as any)?.height_pixels || LEGACY_CARD_SIZE.height;
			
			// Robustly detect orientation from the dimensions we are about to save
			const orientationToSave = detectOrientationFromDimensions(widthToSave, heightToSave);

			const templateDataToSave = {
				id: currentTemplate?.id || crypto.randomUUID(),
				user_id: user?.id ?? '',
				name: currentTemplate?.name || 'Untitled Template',
				front_background: frontUrl || '',
				back_background: backUrl || '',
				front_background_low_res: frontLowResUrl,
				back_background_low_res: backLowResUrl,
				orientation: orientationToSave, // Use detected orientation for consistency
				width_pixels: widthToSave, // explicitly save dimensions
				height_pixels: heightToSave,
				dpi: 300, // Standardize on 300 DPI
				template_elements: allElements,
				created_at: currentTemplate?.created_at || new Date().toISOString(),
				org_id: org_id ?? '',
				// Asset variant URLs
				...variantUrls
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

			const result = deserialize(await response.text());
			console.log('[saveTemplate] Action result:', result);

			let savedTemplate: any = null;

			if (result.type === 'success') {
				const actionResult = result.data as any;
				if (actionResult.success) {
					savedTemplate = actionResult.data;
				} else {
					throw new Error(actionResult.message || 'Save failed');
				}
			} else if (result.type === 'failure') {
				const data = result.data as any;
				throw new Error(data?.message || 'Save failed');
			} else if (result.type === 'error') {
				throw new Error(result.error.message);
			} else {
				throw new Error(`Unexpected action result type: ${result.type}`);
			}

			if (!savedTemplate) {
				throw new Error('Template data missing from success response');
			}

			// Revoke any previous blob: previews to avoid stale object URLs
			try {
				if (frontPreview?.startsWith('blob:')) URL.revokeObjectURL(frontPreview);
				if (backPreview?.startsWith('blob:')) URL.revokeObjectURL(backPreview);
			} catch (e) {
				console.warn('Failed to revoke old blob URLs', e);
			}

			// Force a re-render before setting the new image URLs
			frontPreview = null;
			backPreview = null;
			await tick();

			// Ensure previews use the full public URL and bust cache to show immediately
			const makePublicUrl = (value: unknown) => {
				if (!value) return null;
				// Handle strings directly
				if (typeof value === 'string') {
					// If it's a blob/data URL, use it as-is (no cache-busting)
					if (value.startsWith('blob:') || value.startsWith('data:')) return value;
					// Full URL — append cache-buster
					if (value.startsWith('http')) return `${value}?t=${Date.now()}`;
					// Storage path — convert to public URL and append cache-buster
					const url = getStorageUrl(value, 'templates');
					return `${url}?t=${Date.now()}`;
				}
				// Handle possible objects like { publicUrl } or { path }
				try {
					const maybeObj = value as any;
					const fromObj = (maybeObj?.publicUrl || maybeObj?.url || maybeObj?.path) as
						| string
						| undefined;
					if (fromObj && typeof fromObj === 'string') {
						if (fromObj.startsWith('blob:') || fromObj.startsWith('data:')) return fromObj;
						const url = fromObj.startsWith('http')
							? fromObj
							: getStorageUrl(fromObj, 'templates');
						return `${url}?t=${Date.now()}`;
					}
				} catch {}
				return null;
			};
			// Prefer the freshly uploaded URLs if available (most reliable)
			if (typeof frontUrl === 'string' && frontUrl.startsWith('http')) {
				frontPreview = `${frontUrl}?t=${Date.now()}`;
			} else {
				frontPreview = makePublicUrl(savedTemplate.front_background);
			}
			if (typeof backUrl === 'string' && backUrl.startsWith('http')) {
				backPreview = `${backUrl}?t=${Date.now()}`;
			} else {
				backPreview = makePublicUrl(savedTemplate.back_background);
			}

			// Persist public URLs in cache and resolve
			const templateKeyAfterSave = savedTemplate.id ?? currentTemplate?.id ?? 'temp';
			const frontKey = imageCache.key(templateKeyAfterSave, 'front');
			const backKey = imageCache.key(templateKeyAfterSave, 'back');
			if (frontPreview) imageCache.setPublic(frontKey, frontPreview);
			if (backPreview) imageCache.setPublic(backKey, backPreview);
			frontPreview = imageCache.resolve(frontKey);
			backPreview = imageCache.resolve(backKey);

			// Use the just-sent elements as source of truth
			savedTemplate.template_elements = allElements;

			// Build safe values
			const safeName: string =
				typeof savedTemplate.name === 'string'
					? savedTemplate.name
					: (currentTemplate?.name ?? 'Untitled Template');
			const elementsCount: number = Array.isArray(savedTemplate.template_elements)
				? savedTemplate.template_elements.length
				: Array.isArray(allElements)
					? allElements.length
					: 0;

			// --- FIX START ---
			// Explicitly grab dimensions from our local state to ensure preview aspect ratio is correct immediately
			const safeWidth =
				savedTemplate.width_pixels || requiredPixelDimensions?.width || LEGACY_CARD_SIZE.width;
			const safeHeight =
				savedTemplate.height_pixels || requiredPixelDimensions?.height || LEGACY_CARD_SIZE.height;
			const safeDpi = savedTemplate.dpi || 300;
			// --- FIX END ---

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
			if (
				!savedTemplate.name ||
				!savedTemplate.front_background ||
				!savedTemplate.back_background
			) {
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
				name: safeName,
				elementsCount,
				action: templateDataToSave.id ? 'updated' : 'created',
				frontBgUrl: !!savedTemplate.front_background,
				backBgUrl: !!savedTemplate.back_background
			});

			// Show success toast notification
			const action = templateDataToSave.id ? 'updated' : 'created';
			toast.success(`Template ${action} successfully!`, {
				description: `"${safeName}" with ${elementsCount} elements has been saved.`,
				duration: 4000
			});

			// Normalize data we pass to list — prefer the preview URLs we just set
			// Prefer the known uploaded URLs for the list as well
			// Prefer the already-loaded preview (Blob/Data URL) for instant display
			// This avoids "skeleton" loading states by using the image we already have in memory
			const listFront = frontPreview || 
				(typeof frontUrl === 'string' && frontUrl.startsWith('http')
					? `${frontUrl}?t=${Date.now()}`
					: makePublicUrl(savedTemplate.front_background));

			const listBack = backPreview ||
				(typeof backUrl === 'string' && backUrl.startsWith('http')
					? `${backUrl}?t=${Date.now()}`
					: makePublicUrl(savedTemplate.back_background));

			// --- FIX START: Force dimensions into list object ---
			const currentWidth =
				requiredPixelDimensions?.width || savedTemplate.width_pixels || LEGACY_CARD_SIZE.width;
			const currentHeight =
				requiredPixelDimensions?.height || savedTemplate.height_pixels || LEGACY_CARD_SIZE.height;

			const normalizedForList = {
				...savedTemplate,
				id: savedTemplate.id as string,
				name: safeName,
				// Ensure we use the stable URLs
				front_background: listFront ?? '',
				back_background: listBack ?? '',
				template_elements: allElements,
				// CRITICAL: Explicitly set dimensions from local state so the list preview isn't a square
				width_pixels: Number(currentWidth),
				height_pixels: Number(currentHeight),
				orientation: currentWidth >= currentHeight ? 'landscape' : 'portrait',
				dpi: savedTemplate.dpi || 300
			};
			// --- FIX END ---

			console.log('📦 List normalization:', {
				savedFront: savedTemplate.front_background,
				savedBack: savedTemplate.back_background,
				listFront,
				listBack
			});

			// Update local current template and element arrays to reflect latest positions immediately
			currentTemplate = {
				...(currentTemplate ?? savedTemplate),
				...savedTemplate,
				template_elements: allElements
			} as DatabaseTemplate;
			frontElements = allElements.filter((el) => el.side === 'front').map((el) => ({ ...el }));
			backElements = allElements.filter((el) => el.side === 'back').map((el) => ({ ...el }));
			// Bump version to remount the editor and purge any internal caches
			editorVersion++;

			// Update local templates array and caches safely
			try {
				// Update local templates array instead of full page reload
				await refreshTemplatesList(normalizedForList as any);

				// Optimization: Removed explicit invalidation to prevent UI flash
				// The local update is sufficient for user feedback
				console.log('⚡️ Optimized: Skipped full invalidation');
			} catch (e) {
				console.warn('⚠️ Non-fatal error updating list/cache:', e);
			}

			// Smooth Transition Logic
			if (isReviewing && savedTemplate?.id) {
				// 1. Reveal List behind the modal
				savingTemplateId = savedTemplate.id; // Set loading state on list item
				isEditMode = false;
				await tick();
				
				// Small delay to ensure list rendering (TemplateList component mount)
				// With persistent list, this is mostly for the 'invisible' class removal to take effect
				await new Promise((r) => setTimeout(r, 50));

				// 2. Find Target Card in the list - assume it's the one we just saved
				const targetEl = document.getElementById(`template-card-${savedTemplate.id}`);
				if (targetEl) {
					console.log('🎯 Found fly target:', targetEl);
					
					// Scroll to it if needed (optional but good for seamless)
					targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
					
					const rect = targetEl.getBoundingClientRect();
					
					// Capture target coordinates
					flyTarget = { 
						top: rect.top, 
						left: rect.left, 
						width: rect.width, 
						height: rect.height 
					};
					
					// 3. Trigger Animation State
					// This will transform the card to 'fixed' at the target rect
					isClosingReview = true; 
					
					// Reset rotation to flat for landing if needed, or keep it. 
					// Ideally we want front face?
					if (reviewSide === 'back') {
						// Optional: quickly flip back to front or just land as is
						reviewRotation = 0; 
					}
					
					// 4. Wait for CSS transition (600ms matching the style)
					await new Promise((r) => setTimeout(r, 600));
				} else {
					console.warn('⚠️ Could not find target card element for animation');
				}
				
				// 5. Final Cleanup
				isReviewing = false;
				isClosingReview = false;
				flyTarget = null;
				savingTemplateId = null; // Clear loading state
				handleBack(); // Updates URL and clears form
			} else if (isEditMode) {
				// Fallback for non-review save
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
			// Normalize URLs to full Supabase public URLs for consistency
			const toUrl = (v: unknown) => {
				if (!v) return '';
				if (typeof v === 'string') {
					if (v.startsWith('blob:') || v.startsWith('data:')) return v; // leave blob/data untouched
					if (v.startsWith('http')) return v;
					return getStorageUrl(v, 'templates');
				}
				try {
					const obj = v as any;
					const s = (obj?.publicUrl || obj?.url || obj?.path) as string | undefined;
					if (s && typeof s === 'string') {
						if (s.startsWith('blob:') || s.startsWith('data:')) return s;
						return s.startsWith('http') ? s : getStorageUrl(s, 'templates');
					}
				} catch {}
				return '';
			};
			const timestamp = Date.now();
			const baseFront = toUrl((savedTemplate as any).front_background);
			const baseBack = toUrl((savedTemplate as any).back_background);
			console.log('🧭 refreshTemplatesList URL resolution:', { baseFront, baseBack });
			const addBuster = (url: string) => {
				if (!url) return '';
				if (url.startsWith('blob:') || url.startsWith('data:')) return url; // don't append to blob/data URLs
				const sep = url.includes('?') ? '&' : '?';
				return `${url}${sep}t=${timestamp}`;
			};
			const normalized: DatabaseTemplate = {
				...savedTemplate,
				front_background: addBuster(baseFront),
				back_background: addBuster(baseBack)
			};

			// Check if this is an update or create
			const existingIndex = templates.findIndex((t) => t.id === normalized.id);

			if (existingIndex >= 0) {
				// Update existing template
				templates[existingIndex] = normalized;
				console.log('📝 Updated template in local list:', normalized.name);
			} else {
				// Add new template to the beginning of the list
				templates = [normalized, ...templates];
				console.log('➕ Added new template to local list:', normalized.name);
			}

			// Optimization: Skipped background fetch to keep UI stable
			// Rely purely on the local update above
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
					const position =
						result.side === 'front' ? frontBackgroundPosition : backBackgroundPosition;
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
		const templateKey = currentTemplate?.id ?? 'temp';
		const key = imageCache.key(templateKey, side);

		// Store the raw file for later save/crop
		if (side === 'front') {
			frontBackground = file;
		} else {
			backBackground = file;
		}

		// Always show full-resolution original image for main editing
		// The main canvas should display the complete image, not a cropped version
		const fullResolutionUrl = URL.createObjectURL(file);
		imageCache.setPreview(key, fullResolutionUrl);

		if (side === 'front') {
			frontPreview = imageCache.resolve(key);
		} else {
			backPreview = imageCache.resolve(key);
		}

		// Note: Crop preview generation is now handled separately when needed
		// This ensures users can see the full image quality during editing

		// Trigger element creation if elements are empty and dimensions are available
		await triggerElementCreation();

		// Generate initial crop preview if dimensions are available
		await updateCropPreviews();
	}

	async function triggerElementCreation() {
		// Wait a bit for the dimensions to be processed
		await new Promise((resolve) => setTimeout(resolve, 100));

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

			// Update the elements arrays
			frontElements = frontElems;
			backElements = backElems;

			console.log('✅ Created template elements:', {
				front: frontElems.length,
				back: backElems.length
			});
		}
	}

	/**
	 * Handle background position updates with drag performance optimization
	 */
	async function handleBackgroundPositionUpdate(
		position: BackgroundPosition,
		side: 'front' | 'back'
	) {
		// Update position immediately for responsiveness
		if (side === 'front') {
			frontBackgroundPosition = { ...position };
		} else {
			backBackgroundPosition = { ...position };
		}

		// Detect if this is likely a drag operation based on update frequency
		const now = performance.now();
		const timeSinceLastUpdate = now - lastPositionUpdateTime;
		lastPositionUpdateTime = now;

		// Consider it dragging if updates come within 50ms of each other
		const isLikelyDragging = timeSinceLastUpdate < 50;

		if (isLikelyDragging) {
			positionUpdateCount++;
			isDraggingBackground = true;

			// Clear existing timeout
			if (dragUpdateTimeout) {
				clearTimeout(dragUpdateTimeout);
			}

			// Debounce expensive crop preview updates during drag
			dragUpdateTimeout = setTimeout(async () => {
				await updateCropPreviews();
				isDraggingBackground = false;
				positionUpdateCount = 0;
				dragUpdateTimeout = null;
			}, 150); // Wait 150ms after drag movement stops
		} else {
			// Immediate update when not dragging (single position change)
			isDraggingBackground = false;
			positionUpdateCount = 0;
			await updateCropPreviews();
		}
	}

	/**
	 * Generate crop previews for both front and back images
	 * This creates separate cropped preview images that show what the final output will look like
	 */
	async function updateCropPreviews() {
		// Skip expensive operations during active drag
		if (isDraggingBackground || !requiredPixelDimensions) return;

		// Generate front crop preview
		if (frontBackground) {
			try {
				const cropPreviewUrl = await generateCropPreviewUrl(
					frontBackground,
					requiredPixelDimensions,
					frontBackgroundPosition
				);
				frontCropPreview = cropPreviewUrl;
			} catch (e) {
				console.warn('Failed to generate front crop preview:', e);
				frontCropPreview = null;
			}
		}

		// Generate back crop preview
		if (backBackground) {
			try {
				const cropPreviewUrl = await generateCropPreviewUrl(
					backBackground,
					requiredPixelDimensions,
					backBackgroundPosition
				);
				backCropPreview = cropPreviewUrl;
			} catch (e) {
				console.warn('Failed to generate back crop preview:', e);
				backCropPreview = null;
			}
		}
	}

	function handleRemoveImage(side: 'front' | 'back') {
		if (side === 'front') {
			frontBackground = null;
			frontPreview = null;
			frontCropPreview = null;
		} else {
			backBackground = null;
			backPreview = null;
			backCropPreview = null;
		}
	}

	// NEW: Centralized initialization function
	function initializeEditor(templateData: DatabaseTemplate) {
		console.log('🚀 Initializing Editor with:', templateData.name);

		// A. Enable Edit Mode
		isEditMode = true;
		currentTemplate = templateData;

		// B. Setup Previews (Handle both URLs and Storage Paths)
		// Helper to ensure we have a usable URL
		const resolveUrl = (pathOrUrl: string | null) => {
			if (!pathOrUrl) return null;
			if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('blob:')) return pathOrUrl;
			return getStorageUrl(pathOrUrl, 'templates');
		};

		frontPreview = resolveUrl(templateData.front_background);
		backPreview = resolveUrl(templateData.back_background);

		// C. Sanitize Elements (CRITICAL for Bounding Boxes)
		const sanitizeElement = (el: TemplateElement) => ({
			...el,
			// Ensure width/height are numbers and > 0
			width: typeof el.width === 'number' && el.width > 0 ? el.width : 100,
			height: typeof el.height === 'number' && el.height > 0 ? el.height : 30,
			// Ensure coordinates exist
			x: Number(el.x) || 0,
			y: Number(el.y) || 0,
			// Ensure content exists
			content: el.content || (el.type === 'text' ? 'Text' : '')
		});

		// Split and Sanitize
		frontElements = (templateData.template_elements as TemplateElement[])
			.filter((el) => el.side === 'front')
			.map(sanitizeElement);

		backElements = (templateData.template_elements as TemplateElement[])
			.filter((el) => el.side === 'back')
			.map(sanitizeElement);

		// D. Set Dimensions with robust orientation handling
		const td = templateData as any;
		const storedOrientation = templateData.orientation || 'landscape';
		
		if (td.width_pixels && td.height_pixels) {
			// Validate that stored dimensions match the orientation field
			const detectedOrientation = detectOrientationFromDimensions(td.width_pixels, td.height_pixels);
			
			// Ensure dimensions match the expected orientation
			const correctedDimensions = getOrientationAwarePixelDimensions(
				{ width: td.width_pixels, height: td.height_pixels },
				storedOrientation
			);
			
			console.log('📐 Template dimensions check:', {
				storedOrientation,
				detectedOrientation,
				originalDims: { width: td.width_pixels, height: td.height_pixels },
				correctedDims: correctedDimensions,
				dimensionsWereSwapped: detectedOrientation !== storedOrientation
			});
			
			currentCardSize = {
				name: templateData.name,
				width: correctedDimensions.width,
				height: correctedDimensions.height,
				unit: 'pixels'
			};
			requiredPixelDimensions = correctedDimensions;
		} else {
			// Legacy fallback - apply orientation to the default size
			let defaultSize = findBestDefaultSize();
			let defaultPixels = cardSizeToPixels(defaultSize, 300);
			
			// Ensure the default dimensions match the template's stored orientation
			const correctedPixels = getOrientationAwarePixelDimensions(defaultPixels, storedOrientation);
			
			// If dimensions were swapped, update the card size too
			if (correctedPixels.width !== defaultPixels.width) {
				defaultSize = switchOrientation(defaultSize);
			}
			
			console.log('📐 Legacy template orientation fix:', {
				storedOrientation,
				originalDefaultDims: defaultPixels,
				correctedDims: correctedPixels
			});
			
			currentCardSize = defaultSize;
			requiredPixelDimensions = correctedPixels;
		}

		// E. Force Editor Refresh
		editorVersion++;

		console.log('✅ Editor Initialized. Elements:', {
			front: frontElements.length,
			back: backElements.length,
			orientation: storedOrientation,
			dimensions: requiredPixelDimensions
		});
	}

	async function handleTemplateSelect(id: string) {
		try {
			// 1. Navigate
			await goto(`/templates?id=${id}`, { replaceState: true });

			// 2. The navigation updates `data.selectedTemplate` automatically via SvelteKit load functions.
			//    The $effect we added in Step 2 will detect this change and call initializeEditor.
			//    HOWEVER, for immediate responsiveness without waiting for network,
			//    we can find the template in the list and load it immediately:

			const selected = templates.find((t) => t.id === id);
			if (selected) {
				initializeEditor(selected);
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

	async function handleBack() {
		isEditMode = false;
		// Clear the URL ?id= parameter to prevent re-triggering edit mode on navigation
		// derived from data.selectedTemplate effect
		if (browser && window.location.search) {
			await goto('/templates', { replaceState: true });
		}
		
		currentTemplate = null;
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
		// Clear any cached blob URLs to avoid memory leaks
		try {
			imageCache.clear();
		} catch {}
		console.log('✅ EditTemplate: Form cleared');
	}

	function handleCreateNewTemplate(
		cardSize: CardSize, 
		templateName: string,
		orientation?: 'landscape' | 'portrait',
		frontBackgroundUrl?: string
	) {
		// Debug: Log incoming parameters
		console.log('🔧 [handleCreateNewTemplate] Called with:', {
			cardSize: cardSize,
			templateName: templateName,
			orientation: orientation,
			frontBackgroundUrl: frontBackgroundUrl,
			frontBackgroundUrl_length: frontBackgroundUrl?.length || 0,
			frontBackgroundUrl_type: typeof frontBackgroundUrl,
			frontBackgroundUrl_truthy: !!frontBackgroundUrl
		});
		
		// Set up new template creation
		currentCardSize = cardSize;
		requiredPixelDimensions = cardSizeToPixels(cardSize, 300); // Use hardcoded DPI

		// Determine orientation from params or calculate from dimensions
		const finalOrientation = orientation || detectOrientationFromDimensions(requiredPixelDimensions.width, requiredPixelDimensions.height);

		// Create new template with only database-compatible properties
		currentTemplate = {
			id: crypto.randomUUID(),
			user_id: user?.id ?? '',
			name: templateName,
			front_background: frontBackgroundUrl || '',
			back_background: '',
			orientation: finalOrientation,
			width_pixels: requiredPixelDimensions.width,
			height_pixels: requiredPixelDimensions.height,
			dpi: 300,
			template_elements: [],
			created_at: new Date().toISOString(),
			org_id: org_id ?? ''
		};

		// Clear existing data
		frontBackground = null;
		backBackground = null;
		// Set front preview if a template asset was selected
		frontPreview = frontBackgroundUrl || null;
		backPreview = null;
		frontElements = [];
		backElements = [];
		errorMessage = '';

		// Enter edit mode
		isEditMode = true;
		// Fresh mount for new template
		editorVersion++;

		console.log('✅ [handleCreateNewTemplate] New template created:', {
			templateId: currentTemplate!.id,
			name: templateName,
			cardSize: cardSize,
			pixelDimensions: requiredPixelDimensions,
			orientation: finalOrientation,
			front_background: currentTemplate!.front_background,
			front_background_set: !!currentTemplate!.front_background,
			frontPreview: frontPreview,
			frontPreview_set: !!frontPreview,
			isEditMode: isEditMode,
			editorVersion: editorVersion
		});
	}

	// Load 3D geometries for all templates asynchronously
	$effect(() => {
		if (browser && templates && templates.length > 0) {
			totalTemplatesCount = templates.length;
			readyModelsCount = 0;

			console.log(
				`🚀 Templates: Starting 3D model generation for ${totalTemplatesCount} templates...`
			);

			// Process each template
			templates.forEach(async (template) => {
				const templateName = template.name;
				try {
					console.log(`🔄 Creating 3D model for template "${templateName}"...`);

					// Use default card dimensions for all templates since size fields don't exist in DB
					const geometry = await createCardFromInches(3.375, 2.125); // Standard credit card size

					templateGeometries[templateName] = geometry;
					readyModelsCount++;

					console.log(
						`✅ 3D model ready for template "${templateName}" (${readyModelsCount}/${totalTemplatesCount})`
					);

					// Log when all models are ready
					if (readyModelsCount === totalTemplatesCount) {
						console.log(`🎉 All ${totalTemplatesCount} template 3D models are ready!`);
					}
				} catch (error) {
					console.error(`❌ Failed to create 3D model for template "${templateName}":`, error);
					// Still increment count to avoid hanging
					readyModelsCount++;
					if (readyModelsCount === totalTemplatesCount) {
						console.log(
							`⚠️ Template 3D model generation completed with ${Object.keys(templateGeometries).length} successful models out of ${totalTemplatesCount}`
						);
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
	<!-- Layout Container -->
	<!-- Layout Container: Use Grid for robust stacking -->
	<div class="grid grid-cols-1 grid-rows-1 w-full h-full overflow-hidden bg-background">
		<!-- Template List (Always mounted, Base Layer) -->
		<!-- Using col-start-1 row-start-1 to place it in the same cell as editor -->
		<div class="col-start-1 row-start-1 w-full h-full overflow-hidden {isEditMode ? 'invisible pointer-events-none' : 'visible'}">
			<TemplateList
				templates={templates ?? []}
				onSelect={(id: string) => handleTemplateSelect(id)}
				onCreateNew={handleCreateNewTemplate}
				savingTemplateId={savingTemplateId}
			/>
		</div>

		<!-- Edit View Overlay (Top Layer) -->
		{#if isEditMode}
			<div class="col-start-1 row-start-1 z-10 w-full h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
				{#key editorVersion}
					<TemplateEdit
						version={editorVersion}
						{isLoading}
						{frontElements}
						{backElements}
						{frontPreview}
						{backPreview}
						{errorMessage}
						cardSize={currentCardSize}
						pixelDimensions={requiredPixelDimensions}
						onBack={handleBack}
						onSave={startReview}
						onClear={clearForm}
						onUpdateElements={(elements, side) => updateElements(elements, side)}
						onImageUpload={(files, side) => handleImageUpload(files, side)}
						onRemoveImage={(side) => handleRemoveImage(side)}
						onUpdateBackgroundPosition={async (position, side) => {
							$state.snapshot(`Background side updated for ${side}:`);
							$state.snapshot(`Background position updated for ${position}`);
							// Use optimized background position handler with drag performance
							await handleBackgroundPositionUpdate(position, side);
						}}
					/>
				{/key}
			</div>
		{/if}
	</div>

	<!-- Cropping Confirmation Dialog -->
	<CroppingConfirmationDialog
		bind:open={showCroppingDialog}
		frontImageInfo={croppingDialogData.front || null}
		backImageInfo={croppingDialogData.back || null}
		templateSize={requiredPixelDimensions || {
			width: LEGACY_CARD_SIZE.width,
			height: LEGACY_CARD_SIZE.height
		}}
		onConfirm={handleCroppingConfirm}
		onCancel={handleCroppingCancel}
	/>
	<!-- Robust Review Overlay -->
	{#if isReviewing && requiredPixelDimensions}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			onclick={(e) => { if(e.target === e.currentTarget && !isClosingReview) cancelReview() }}
		>
			<!-- Backdrop with fade out -->
			<div class="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-600" class:opacity-0={isClosingReview}></div>

			<div class="relative w-full max-w-4xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
				
				<!-- Header -->
				<div class="w-full flex items-center justify-center mb-8 relative transition-opacity duration-300" class:opacity-0={isClosingReview}>
					<h2 class="text-2xl font-bold text-white">Review Template</h2>
					<button 
						onclick={cancelReview}
						class="absolute right-0 p-2 text-white/50 hover:text-white transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<!-- 3D Flip Preview Area -->
				<!-- Scale down large cards to fit screen -->
				<div 
					class="relative perspective-1000 mb-8 select-none" 
					style="
						width: {isClosingReview && flyTarget ? flyTarget.width : requiredPixelDimensions.width * 0.6}px; 
						height: {isClosingReview && flyTarget ? flyTarget.height : requiredPixelDimensions.height * 0.6}px;
						position: {isClosingReview ? 'fixed' : 'relative'};
						top: {isClosingReview && flyTarget ? flyTarget.top : ''}px;
						left: {isClosingReview && flyTarget ? flyTarget.left : ''}px;
						transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
						z-index: 100;
						pointer-events: {isClosingReview ? 'none' : 'auto'};
					"
				>
					<!-- Flip Container -->
					<div 
						class="w-full h-full relative transition-transform duration-700 ease-in-out transform-style-3d cursor-pointer"
						style="transform: rotateY({isClosingReview ? 0 : reviewRotation}deg);"
						onclick={flipReview}
						role="button"
						tabindex="0"
					>
						<!-- Front Face -->
						<div class="absolute inset-0 backface-hidden shadow-2xl rounded-lg overflow-hidden bg-white">
							<IdCanvas
								pixelDimensions={requiredPixelDimensions}
								backgroundUrl={frontPreview || ''}
								elements={frontElements}
								showBoundingBoxes={false}
								formData={{}}
								fileUploads={{}}
								imagePositions={{}}
							/>
							<div class="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-md z-10">FRONT</div>
						</div>

						<!-- Back Face -->
						<div 
							class="absolute inset-0 backface-hidden shadow-2xl rounded-lg overflow-hidden bg-white"
							style="transform: rotateY(180deg);"
						>
							<IdCanvas
								pixelDimensions={requiredPixelDimensions}
								backgroundUrl={backPreview || ''}
								elements={backElements}
								showBoundingBoxes={false}
								formData={{}}
								fileUploads={{}}
								imagePositions={{}}
							/>
							<div class="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-md z-10">BACK</div>
						</div>
					</div>
					
						<div class="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-sm flex items-center gap-2 pointer-events-none whitespace-nowrap transition-opacity duration-300" class:opacity-0={isClosingReview}>
						<RotateCcw size={14} />
						Click card to flip • Verify your design before saving
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-4 items-center mt-4 transition-opacity duration-300" class:opacity-0={isClosingReview}>
					<button
						onclick={cancelReview}
						class="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-medium flex items-center gap-2 border border-white/10"
					>
						<Edit size={18} />
						Back to Edit
					</button>
					
					<button
						onclick={() => saveTemplate()}
						class="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all font-bold flex items-center gap-2 transform hover:scale-105 active:scale-95"
					>
						<Save size={18} />
						Save Template
					</button>
				</div>

				<!-- Metadata -->
				<div class="mt-8 text-center text-white/40 text-sm transition-opacity duration-300" class:opacity-0={isClosingReview}>
					<p class="font-medium">{currentTemplate?.name || 'Untitled Template'}</p>
					<p>{requiredPixelDimensions.width}px × {requiredPixelDimensions.height}px • {frontElements.length + backElements.length} Elements</p>
				</div>

			</div>
		</div>
	{/if}
</main>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	.transform-style-3d {
		transform-style: preserve-3d;
	}
	.backface-hidden {
		backface-visibility: hidden;
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
