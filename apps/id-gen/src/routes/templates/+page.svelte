<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { onMount, tick } from 'svelte';
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
import { imageCache } from '$lib/utils/imageCache';

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
	let { data } = $props();

	let templates = $state<DatabaseTemplate[]>(data.templates);

	let user = $state(data.user);
	let org_id = $state(data.org_id);

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
				if (!('data' in result)) {
					console.error('❌ No template data in server response. Full result:', result);
					throw new Error('No template data received from server');
				}
			} else {
				console.error('❌ Unexpected response format:', typeof result, result);
				throw new Error('Server returned unexpected response format');
			}

			// Robustly extract the saved template from various server shapes
			let savedTemplate: any = null;
			try {
				if (result.data && typeof result.data === 'string') {
					// Server returned stringified JSON
					const parsed = JSON.parse(result.data);
					if (Array.isArray(parsed)) {
						// Prefer an object that looks like a template; ignore primitives (numbers/strings)
						const candidates = parsed.filter((item: any) =>
							item && typeof item === 'object' && (
								('front_background' in item) ||
								('back_background' in item) ||
								('template_elements' in item) ||
								('id' in item && 'name' in item)
							)
						);
						savedTemplate = candidates.length ? candidates[candidates.length - 1] : undefined;
					} else {
						savedTemplate = parsed;
					}
				} else if (result.data && typeof result.data === 'object' && 'template' in result.data) {
					// Some APIs return { template: {...} }
					savedTemplate = (result.data as any).template;
				} else {
					savedTemplate = result.data;
				}
			} catch (e) {
				console.error('❌ Failed to parse nested template data:', e);
				throw new Error('Failed to parse template data from server response');
			}

			if (!savedTemplate || typeof savedTemplate !== 'object') {
				throw new Error('Template was not saved properly - invalid data returned');
			}

			// Ensure the saved template has a stable string id (fallback to the one we sent)
			if (typeof savedTemplate.id !== 'string' || !savedTemplate.id) {
				console.warn('⚠️ Server returned non-string or missing id; falling back to client id', {
					serverId: savedTemplate.id,
					clientId: templateDataToSave.id
				});
				savedTemplate.id = templateDataToSave.id;
			}

			// If extraction failed, throw early with diagnostics
			if (!savedTemplate) {
				console.error('❌ Could not extract a template object from server response:', result.data);
				throw new Error('Failed to extract saved template from server response');
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
					const url = getSupabaseStorageUrl(value, 'templates');
					return `${url}?t=${Date.now()}`;
				}
				// Handle possible objects like { publicUrl } or { path }
				try {
					const maybeObj = value as any;
					const fromObj = (maybeObj?.publicUrl || maybeObj?.url || maybeObj?.path) as string | undefined;
					if (fromObj && typeof fromObj === 'string') {
						if (fromObj.startsWith('blob:') || fromObj.startsWith('data:')) return fromObj;
						const url = fromObj.startsWith('http') ? fromObj : getSupabaseStorageUrl(fromObj, 'templates');
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
			
			// Use the just-sent elements as source of truth to avoid stale server echoes
			savedTemplate.template_elements = allElements;

			// Build safe values for name and element count
			const safeName: string = typeof savedTemplate.name === 'string' ? savedTemplate.name : (currentTemplate?.name ?? 'Untitled Template');
			const elementsCount: number = Array.isArray(savedTemplate.template_elements)
				? savedTemplate.template_elements.length
				: (Array.isArray(allElements) ? allElements.length : 0);
			
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
			const listFront = (typeof frontUrl === 'string' && frontUrl.startsWith('http'))
				? `${frontUrl}?t=${Date.now()}`
				: (frontPreview ?? makePublicUrl(savedTemplate.front_background));
			const listBack = (typeof backUrl === 'string' && backUrl.startsWith('http'))
				? `${backUrl}?t=${Date.now()}`
				: (backPreview ?? makePublicUrl(savedTemplate.back_background));
			const normalizedForList = {
				...savedTemplate,
				id: savedTemplate.id as string,
				name: safeName,
				front_background: listFront ?? '',
				back_background: listBack ?? '',
				template_elements: allElements
			};

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

			// Update local templates array instead of full page reload
			await refreshTemplatesList(normalizedForList as any);

			// Invalidate server data to fetch fresh rows without hard reload
			try {
				await Promise.all([
					invalidate((url) => url.pathname === '/templates'),
					invalidate(`/templates?id=${savedTemplate.id}`)
				]);
			} catch (e) {
				console.warn('invalidate failed (non-fatal):', e);
			}
			
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
			// Normalize URLs to full Supabase public URLs for consistency
			const toUrl = (v: unknown) => {
				if (!v) return '';
				if (typeof v === 'string') {
					if (v.startsWith('blob:') || v.startsWith('data:')) return v; // leave blob/data untouched
					if (v.startsWith('http')) return v;
					return getSupabaseStorageUrl(v, 'templates');
				}
				try {
					const obj = v as any;
					const s = (obj?.publicUrl || obj?.url || obj?.path) as string | undefined;
					if (s && typeof s === 'string') {
						if (s.startsWith('blob:') || s.startsWith('data:')) return s;
						return s.startsWith('http') ? s : getSupabaseStorageUrl(s, 'templates');
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
			const existingIndex = templates.findIndex(t => t.id === normalized.id);
			
			if (existingIndex >= 0) {
				// Update existing template
				templates[existingIndex] = normalized;
				console.log('📝 Updated template in local list:', normalized.name);
			} else {
				// Add new template to the beginning of the list
				templates = [normalized, ...templates];
				console.log('➕ Added new template to local list:', normalized.name);
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
		const templateKey = (currentTemplate?.id ?? 'temp');
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

	/**
	 * Handle background position updates with drag performance optimization
	 */
	async function handleBackgroundPositionUpdate(position: BackgroundPosition, side: 'front' | 'back') {
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

	async function handleTemplateSelect(id: string) {
		try {
			isEditMode = true;

			// Navigate to new URL (this will handle state properly)
			await goto(`/templates?id=${id}`, { replaceState: true });
			// Ensure fresh editor mount when switching templates
			editorVersion++;

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
						width: data.selectedTemplate.width_pixels,
						height: data.selectedTemplate.height_pixels,
						unit: 'pixels'
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
		// Clear any cached blob URLs to avoid memory leaks
		try { imageCache.clear(); } catch {}
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
		// Fresh mount for new template
		editorVersion++;

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
				onSave={saveTemplate}
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
