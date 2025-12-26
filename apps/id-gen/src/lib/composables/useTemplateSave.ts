import { toast } from 'svelte-sonner';
import { deserialize } from '$app/forms';
import { invalidate } from '$app/navigation';
import { getTemplateAssetPath } from '$lib/utils/storagePath';
import { getProxiedUrl } from '$lib/utils/storage';
import { blobToDataUrl, fetchBackgroundAsBlob as fetchBgAsBlob } from '$lib/utils/templateImageUpload';
import { cropBackgroundImage, createLowResVersion, type BackgroundPosition } from '$lib/utils/imageCropper';
import { generateAndUploadVariants, type VariantUrls } from '$lib/utils/templateVariants';
import type { DatabaseTemplate, EditorTemplateData, TemplateElement } from '$lib/types/template';
import { LEGACY_CARD_SIZE } from '$lib/utils/sizeConversion';
import { detectOrientationFromDimensions } from '$lib/utils/templateHelpers';

/**
 * Type for the upload function that must be provided by the page
 * This allows the hook to work with SvelteKit server actions
 */
export type UploadImageFn = (file: File, path: string, userId?: string) => Promise<string>;

export interface UseTemplateSaveOptions {
	user: { id: string } | null;
	org_id: string;
	/** Upload function that calls the server action - must be provided by the page */
	uploadImage: UploadImageFn;
	/** Callback when save succeeds */
	onSaveSuccess: (template: DatabaseTemplate) => void;
	/** Callback to refresh templates list */
	onRefreshList: (template: DatabaseTemplate) => Promise<void>;
}

export interface SaveParams {
	currentTemplate: DatabaseTemplate | EditorTemplateData;
	frontBackground: File | null;
	backBackground: File | null;
	frontPreview: string | null;
	backPreview: string | null;
	frontElements: TemplateElement[];
	backElements: TemplateElement[];
	requiredPixelDimensions: { width: number; height: number };
	frontBackgroundPosition: BackgroundPosition;
	backBackgroundPosition: BackgroundPosition;
	validateBackgrounds: () => Promise<boolean>;
}

/**
 * Fetch an existing background image URL as a Blob for variant regeneration
 * Wraps the utility function with side-specific logging for template save context
 */
async function fetchBackgroundAsBlob(url: string, side: 'front' | 'back'): Promise<Blob | null> {
	if (!url) {
		console.log(`⚠️ [fetchBackgroundAsBlob] No URL provided for ${side}`);
		return null;
	}
	if (url.startsWith('blob:') || url.startsWith('data:')) {
		console.log(`⚠️ [fetchBackgroundAsBlob] ${side}: Cannot fetch blob/data URL, skipping`);
		return null;
	}

	console.log(`🔄 [fetchBackgroundAsBlob] Fetching ${side} background from:`, url);

	try {
		// Use proxied URL to handle CORS
		const proxiedUrl = getProxiedUrl(url, 'templates');
		console.log(`🔄 [fetchBackgroundAsBlob] ${side}: Proxied URL:`, proxiedUrl);

		if (!proxiedUrl) {
			console.error(`❌ [fetchBackgroundAsBlob] ${side}: Could not generate proxied URL`);
			return null;
		}

		const blob = await fetchBgAsBlob(proxiedUrl, false);
		console.log(
			`✅ [fetchBackgroundAsBlob] ${side}: Fetched successfully, size: ${blob.size} bytes, type: ${blob.type}`
		);
		return blob;
	} catch (e) {
		console.error(`❌ [fetchBackgroundAsBlob] ${side}: Failed to fetch`, e);
		return null;
	}
}

export function useTemplateSave(options: UseTemplateSaveOptions) {
	const { user, org_id, uploadImage, onSaveSuccess, onRefreshList } = options;

	// State
	let isSaving = $state(false);
	let isLoading = $state(false);
	let isGeneratingVariants = $state(false);
	let variantGenerationProgress = $state('');
	let savingTemplateId = $state<string | null>(null);

	// Fly animation state
	let isClosingReview = $state(false);
	let flyTarget = $state<{ top: number; left: number; width: number; height: number } | null>(null);

	async function saveTemplate(params: SaveParams): Promise<DatabaseTemplate | null> {
		const {
			currentTemplate,
			frontBackground,
			backBackground,
			frontPreview,
			backPreview,
			frontElements,
			backElements,
			requiredPixelDimensions,
			frontBackgroundPosition,
			backBackgroundPosition,
			validateBackgrounds
		} = params;

		if (!(await validateBackgrounds())) {
			return null;
		}

		// Set loading state
		isLoading = true;
		isSaving = true;

		// Show initial progress toast
		const toastId = toast.loading('Preparing template for save...', {
			duration: Infinity
		});

		try {
			let frontUrl = frontPreview;
			let backUrl = backPreview;
			let frontLowResUrl: string | null = (currentTemplate as any)?.front_background_low_res || null;
			let backLowResUrl: string | null = (currentTemplate as any)?.back_background_low_res || null;

			// Store cropped blobs for variant generation
			let croppedFrontBlob: Blob | null = null;
			let croppedBackBlob: Blob | null = null;

			// Generate template ID early for consistent styling
			const templateId = currentTemplate?.id || crypto.randomUUID();
			savingTemplateId = templateId;

			// Update progress: Processing images
			toast.loading('Processing background images...', { id: toastId });

			// Process front background with cropping if needed
			if (frontBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing front background...');
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

				croppedFrontBlob = frontResult.croppedFile;

				toast.loading('Uploading front background to storage...', { id: toastId });

				const frontPath = getTemplateAssetPath(templateId, 'full', 'front', 'png');
				frontUrl = await uploadImage(frontResult.croppedFile, frontPath, user?.id);

				if (!frontUrl || typeof frontUrl !== 'string') {
					throw new Error('Upload succeeded but returned invalid URL');
				}

				// Generate and upload low-res version
				try {
					console.log('🖼️ Generating front low-res version...');
					const frontLowRes = await createLowResVersion(frontResult.croppedFile);
					const frontLowResPath = getTemplateAssetPath(templateId, 'preview', 'front', 'jpg');
					frontLowResUrl = await uploadImage(frontLowRes, frontLowResPath, user?.id);
					console.log('✅ Front low-res uploaded:', frontLowResUrl);
				} catch (lowResError) {
					console.warn('⚠️ Failed to generate/upload front low-res (non-fatal):', lowResError);
					frontLowResUrl = frontUrl;
				}

				console.log('✅ Front background uploaded successfully:', frontUrl);
				toast.loading('Front image uploaded ✓ Processing back image...', { id: toastId });
			} else if (frontPreview && requiredPixelDimensions && !croppedFrontBlob) {
				// Editing existing template - fetch background for variant regeneration
				console.log('🔄 [saveTemplate] No new front image uploaded, fetching existing for variant regeneration...');
				toast.loading('Fetching existing front image for variant update...', { id: toastId });
				croppedFrontBlob = await fetchBackgroundAsBlob(frontPreview, 'front');
			}

			// Process back background with cropping if needed
			if (backBackground && requiredPixelDimensions) {
				console.log('🖼️ Processing back background...');
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

				croppedBackBlob = backResult.croppedFile;

				toast.loading('Uploading back background to storage...', { id: toastId });

				const backPath = getTemplateAssetPath(templateId, 'full', 'back', 'png');
				backUrl = await uploadImage(backResult.croppedFile, backPath, user?.id);

				if (!backUrl || typeof backUrl !== 'string') {
					throw new Error('Upload succeeded but returned invalid URL');
				}

				// Generate and upload low-res version
				try {
					console.log('🖼️ Generating back low-res version...');
					const backLowRes = await createLowResVersion(backResult.croppedFile);
					const backLowResPath = getTemplateAssetPath(templateId, 'preview', 'back', 'jpg');
					backLowResUrl = await uploadImage(backLowRes, backLowResPath, user?.id);
					console.log('✅ Back low-res uploaded:', backLowResUrl);
				} catch (lowResError) {
					console.warn('⚠️ Failed to generate/upload back low-res (non-fatal):', lowResError);
					backLowResUrl = backUrl;
				}

				console.log('✅ Back background uploaded successfully:', backUrl);
				toast.loading('Both images uploaded ✓ Preparing to save...', { id: toastId });
			} else if (backPreview && requiredPixelDimensions && !croppedBackBlob) {
				// Editing existing template - fetch background for variant regeneration
				console.log('🔄 [saveTemplate] No new back image uploaded, fetching existing for variant regeneration...');
				toast.loading('Fetching existing back image for variant update...', { id: toastId });
				croppedBackBlob = await fetchBackgroundAsBlob(backPreview, 'back');
			}

			// Combine front and back elements
			const allElements = [...frontElements, ...backElements];

			console.log('🔍 Elements debug:', {
				frontElements: frontElements.length,
				backElements: backElements.length,
				allElements: allElements.length
			});

			if (allElements.length === 0) {
				console.error('❌ No template elements found');
				throw new Error('No template elements provided - elements may not have been created yet.');
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
					isGeneratingVariants = true;
					variantGenerationProgress = 'Generating template variants...';
					toast.loading('Generating template variants...', { id: toastId });
					console.log('🎨 Generating template variants...');

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
					variantGenerationProgress = 'Variants uploaded ✓';
					toast.loading('Variants uploaded ✓ Saving to database...', { id: toastId });
				} catch (variantError) {
					console.warn('⚠️ Failed to generate variants (non-fatal):', variantError);
				} finally {
					isGeneratingVariants = false;
					variantGenerationProgress = '';
				}
			}

			// Ensure we're not saving data: or blob: URLs to the database
			if (!frontUrl || !backUrl) {
				throw new Error('Failed to process background images - missing URLs');
			}

			if (frontUrl.startsWith('data:') || frontUrl.startsWith('blob:')) {
				throw new Error('Front background upload failed - received invalid URL type.');
			}
			if (backUrl.startsWith('data:') || backUrl.startsWith('blob:')) {
				throw new Error('Back background upload failed - received invalid URL type.');
			}

			// Ensure we are saving the exact dimensions used in the editor
			const widthToSave = requiredPixelDimensions?.width || (currentTemplate as any)?.width_pixels || LEGACY_CARD_SIZE.width;
			const heightToSave = requiredPixelDimensions?.height || (currentTemplate as any)?.height_pixels || LEGACY_CARD_SIZE.height;
			const orientationToSave = detectOrientationFromDimensions(widthToSave, heightToSave);

			const templateDataToSave = {
				id: currentTemplate?.id || crypto.randomUUID(),
				user_id: user?.id ?? '',
				name: currentTemplate?.name || 'Untitled Template',
				front_background: frontUrl || '',
				back_background: backUrl || '',
				front_background_low_res: frontLowResUrl,
				back_background_low_res: backLowResUrl,
				orientation: orientationToSave,
				width_pixels: widthToSave,
				height_pixels: heightToSave,
				dpi: 300,
				template_elements: allElements,
				created_at: currentTemplate?.created_at || new Date().toISOString(),
				org_id: org_id ?? '',
				// Asset variant URLs
				...variantUrls
			};

			if (!templateDataToSave.user_id) {
				throw new Error('User ID is required');
			}

			if (!templateDataToSave.org_id) {
				throw new Error('Organization ID is required');
			}

			// Update progress: Saving to database
			toast.loading('Saving template to database...', { id: toastId });
			console.log('💾 Saving to database...');

			// Create form data - SvelteKit actions require FormData, not JSON body
			const formData = new FormData();
			formData.append('templateData', JSON.stringify(templateDataToSave));

			// Use fetch to call the server action - CORRECT endpoint is ?/create
			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());
			console.log('[saveTemplate] Action result:', result);

			let savedTemplate: DatabaseTemplate | null = null;

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

			// Validate that critical data was saved correctly
			if (!savedTemplate.id) {
				console.error('❌ Template saved but no ID returned');
				throw new Error('Template was not saved properly - no ID returned');
			}

			console.log('✅ Template saved successfully:', {
				id: savedTemplate.id,
				name: savedTemplate.name
			});

			// Show success toast notification
			const action = currentTemplate?.id ? 'updated' : 'created';
			toast.success(`Template ${action} successfully!`, {
				description: `"${savedTemplate.name}" has been saved.`,
				duration: 4000
			});

			// Refresh templates list
			try {
				await onRefreshList(savedTemplate);
				console.log('✅ Local templates list updated');

				// Invalidate the shared dependency so other pages get fresh data
				await invalidate('app:templates');
				console.log('✅ Cache invalidated for app:templates');
			} catch (e) {
				console.warn('⚠️ Non-fatal error updating list/cache:', e);
			}

			// Call success callback
			onSaveSuccess(savedTemplate);

			return savedTemplate;

		} catch (error) {
			console.error('❌ Error saving template:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';

			toast.error('Failed to save template', {
				description: errorMsg,
				duration: 6000
			});

			return null;
		} finally {
			isLoading = false;
			isSaving = false;
			savingTemplateId = null;
			toast.dismiss(toastId);
		}
	}

	/**
	 * Set fly target for animation
	 */
	function setFlyTarget(target: { top: number; left: number; width: number; height: number } | null) {
		flyTarget = target;
	}

	/**
	 * Start closing animation
	 */
	function startClosingAnimation() {
		isClosingReview = true;
	}

	/**
	 * End closing animation
	 */
	function endClosingAnimation() {
		isClosingReview = false;
		flyTarget = null;
	}

	return {
		get isSaving() { return isSaving; },
		get isLoading() { return isLoading; },
		get isGeneratingVariants() { return isGeneratingVariants; },
		get variantGenerationProgress() { return variantGenerationProgress; },
		get savingTemplateId() { return savingTemplateId; },
		get isClosingReview() { return isClosingReview; },
		get flyTarget() { return flyTarget; },
		saveTemplate,
		setFlyTarget,
		startClosingAnimation,
		endClosingAnimation
	};
}
