<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { deserialize } from '$app/forms';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';

	// Components
	import TemplatesPageSkeleton from '$lib/components/skeletons/TemplatesPageSkeleton.svelte';
	import TemplateList from '$lib/components/TemplateList.svelte';
	import TemplateEditorLayout from '$lib/components/TemplateEditorLayout.svelte';
	import TemplateReviewModal from '$lib/components/TemplateReviewModal.svelte';
	import CroppingConfirmationDialog from '$lib/components/CroppingConfirmationDialog.svelte';

	// Hooks
	import { useTemplateEditor } from '$lib/composables/useTemplateEditor.svelte';
	import { useImageUpload } from '$lib/composables/useImageUpload.svelte';
	import { useReviewModal } from '$lib/composables/useReviewModal.svelte';
	import { useCroppingDialog } from '$lib/composables/useCroppingDialog.svelte';
	import { useTemplateSave } from '$lib/composables/useTemplateSave.svelte';

	// Utils
	import { getPreloadState } from '$lib/services/preloadService';
	import { LEGACY_CARD_SIZE } from '$lib/utils/sizeConversion';
	import type { DatabaseTemplate } from '$lib/types/template';
	import type { CardSize } from '$lib/utils/sizeConversion';

	let { data } = $props();

	// Smart Loading State
	const preloadState = getPreloadState('/templates');
	let isStructureReady = $derived($preloadState?.serverData === 'ready');
	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;
	});

	// Super admin status
	let isSuperAdmin = $derived($page.data.isSuperAdmin === true);

	// Upload image via server action to R2
	async function uploadImage(
		file: File,
		path: string,
		userId?: string,
		signal?: AbortSignal
	): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('path', path);
		if (userId) formData.append('userId', userId);

		try {
			const response = await fetch('?/uploadImage', {
				method: 'POST',
				body: formData,
				signal
			});

			const result = deserialize(await response.text());
			console.log('[uploadImage] Server response (deserialized):', result);

			if (result.type === 'success') {
				const data = result.data as any;
				if (data?.url) return data.url;
				// URL missing from success response - this shouldn't happen
				throw new Error('Upload succeeded but no URL was returned by server');
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

	// Initialize hooks (untrack since we intentionally want initial values)
	const editor = untrack(() =>
		useTemplateEditor({
			data: data,
			initialTemplates: data.templates,
			user: data.user,
			org_id: data.org_id
		})
	);

	// Re-sync templates when data changes (e.g. navigation)
	$effect(() => {
		// This is a bit of a hack to access the internal templates array if needed,
		// but useTemplateEditor manages its own state.
		// Ideally we would have a setTemplates method if we need to force update from prop.
		// For now, we trust the hook to handle initial state and updates.
	});

	const imageUpload = useImageUpload({
		getRequiredPixelDimensions: () => editor.requiredPixelDimensions,
		templateId: editor.currentTemplate?.id,
		initialFrontPreview: editor.currentTemplate?.front_background || null,
		initialBackPreview: editor.currentTemplate?.back_background || null
	});

	// Sync editor state changes to image upload hook
	// Track if user intentionally removed backgrounds (to avoid re-syncing from template)
	let userRemovedFront = $state(false);
	let userRemovedBack = $state(false);

	// Wrap handleRemoveImage to track intentional removals
	function handleRemoveImageWithTracking(side: 'front' | 'back') {
		if (side === 'front') userRemovedFront = true;
		else userRemovedBack = true;
		imageUpload.handleRemoveImage(side);
	}

	// Wrap handleImageUpload to reset removal tracking when uploading new image
	async function handleImageUploadWithTracking(files: FileList | null, side: 'front' | 'back') {
		if (side === 'front') userRemovedFront = false;
		else userRemovedBack = false;
		await imageUpload.handleImageUpload(files, side);
	}

	$effect(() => {
		// When template changes, update the image upload hook's previews
		if (editor.currentTemplate) {
			// Only sync if:
			// - Values differ AND
			// - Not a data URL (local upload) AND
			// - User didn't intentionally remove the background
			if (
				editor.currentTemplate.front_background !== imageUpload.frontPreview &&
				!imageUpload.frontPreview?.startsWith('data:') &&
				!userRemovedFront
			) {
				imageUpload.setPreview('front', editor.currentTemplate.front_background);
			}
			if (
				editor.currentTemplate.back_background !== imageUpload.backPreview &&
				!imageUpload.backPreview?.startsWith('data:') &&
				!userRemovedBack
			) {
				imageUpload.setPreview('back', editor.currentTemplate.back_background);
			}
		} else if (!editor.isEditMode) {
			// Reset when exiting edit mode
			imageUpload.reset();
			userRemovedFront = false;
			userRemovedBack = false;
		}
	});

	// Sync current backgrounds to editor for change detection
	$effect(() => {
		editor.setCurrentBackgrounds(imageUpload.frontPreview, imageUpload.backPreview);
	});

	const reviewModal = useReviewModal();

	const croppingDialog = useCroppingDialog();

	const templateSave = untrack(() =>
		useTemplateSave({
			user: data.user,
			org_id: data.org_id,
			uploadImage: uploadImage,
			onSaveSuccess: (savedTemplate) => {
				editor.updateTemplatesList(savedTemplate);
				// Update current template with saved data (e.g. new ID)
				editor.setCurrentTemplate(savedTemplate);
			},
			onRefreshList: async () => {
				await invalidate('app:templates');
			}
		})
	);

	// Handle Save Action
	function handleSave() {
		// 1. Validate backgrounds first
		if (
			(!imageUpload.frontBackground && !imageUpload.frontPreview) ||
			(!imageUpload.backBackground && !imageUpload.backPreview)
		) {
			editor.errorMessage = 'Both front and back backgrounds are required.';
			return;
		}

		// 2. Check for cropping
		const needsCrop = croppingDialog.checkAndShowCroppingDialog({
			frontBackground: imageUpload.frontBackground,
			backBackground: imageUpload.backBackground,
			requiredPixelDimensions: editor.requiredPixelDimensions,
			frontBackgroundPosition: imageUpload.frontBackgroundPosition,
			backBackgroundPosition: imageUpload.backBackgroundPosition
		});

		needsCrop.then((shouldShow) => {
			if (!shouldShow) {
				// No cropping needed, proceed to review
				reviewModal.startReview({
					currentTemplate: editor.currentTemplate,
					frontPreview: imageUpload.frontPreview,
					backPreview: imageUpload.backPreview,
					updateCropPreviews: imageUpload.updateCropPreviews
				});
			}
		});
	}

	// Handle Confirmation from Review Modal (Actual Save)
	async function handleConfirmSave() {
		if (!editor.currentTemplate || !editor.requiredPixelDimensions) return;

		const savedTemplate = await templateSave.saveTemplate({
			currentTemplate: editor.currentTemplate,
			frontBackground: imageUpload.frontBackground,
			backBackground: imageUpload.backBackground,
			frontPreview: imageUpload.frontPreview,
			backPreview: imageUpload.backPreview,
			frontElements: editor.frontElements,
			backElements: editor.backElements,
			requiredPixelDimensions: editor.requiredPixelDimensions,
			frontBackgroundPosition: imageUpload.frontBackgroundPosition,
			backBackgroundPosition: imageUpload.backBackgroundPosition,
			validateBackgrounds: async () => true // Already validated
		});

		if (savedTemplate) {
			// Find target element in the list for fly animation
			// The list might be lazily rendering the new item, so we poll for it briefly
			const pollForElement = async (id: string, maxAttempts = 10, interval = 50) => {
				for (let i = 0; i < maxAttempts; i++) {
					const el = document.getElementById(id);
					if (el) return el;
					await new Promise((r) => setTimeout(r, interval));
				}
				return null;
			};

			const targetEl = await pollForElement(`template-card-${savedTemplate.id}`);

			if (targetEl) {
				const rect = targetEl.getBoundingClientRect();
				// Target the inner image container for better visual alignment
				const imageContainer = targetEl.querySelector('.relative.shadow-md');
				const targetRect = imageContainer ? imageContainer.getBoundingClientRect() : rect;

				// Set fly target to the list item position
				reviewModal.setFlyTarget({
					top: targetRect.top,
					left: targetRect.left,
					width: targetRect.width,
					height: targetRect.height
				});

				// Start the fly animation
				reviewModal.startClosingAnimation();

				// Wait for animation to finish (approx 600ms + buffer)
				setTimeout(() => {
					// Switch back to list view
					editor.handleBack();
					// Reset animation state
					reviewModal.endClosingAnimation();
				}, 700);
			} else {
				console.warn('⚠️ Animation target not found, skipping fly animation');
				// Fallback if target not found
				editor.handleBack();
				reviewModal.confirmAndSave(async () => {});
			}
		}
	}

	// Handle Cropping Confirm
	function handleCroppingConfirm() {
		croppingDialog.handleCroppingConfirm();
		// Proceed to review after cropping confirmed
		reviewModal.startReview({
			currentTemplate: editor.currentTemplate,
			frontPreview: imageUpload.frontPreview,
			backPreview: imageUpload.backPreview,
			updateCropPreviews: imageUpload.updateCropPreviews
		});
	}

	// Auto-load template from URL
	$effect(() => {
		if (data.selectedTemplate && editor.currentTemplate?.id !== data.selectedTemplate.id) {
			editor.initializeEditor(data.selectedTemplate);
		}
	});

	// Handle new template creation parameters
	let hasHandledNewTemplate = $state(false);
	$effect(() => {
		if (data.newTemplateParams && !hasHandledNewTemplate) {
			hasHandledNewTemplate = true;
			const params = data.newTemplateParams;

			const cardSize: CardSize = {
				name: params.name,
				width: params.width,
				height: params.height,
				unit: params.unit as any
			};

			editor.handleCreateNewTemplate(
				cardSize,
				params.name,
				params.orientation,
				params.front_background
			);
		}
	});

	// Derived props for TemplateList
	// We need to pass the size presets
	let sizePresets = $derived(data.sizePresets || []);
</script>

<main class="h-full">
	{#if !isStructureReady && isLoading}
		<TemplatesPageSkeleton />
	{:else}
		<div class="grid grid-cols-1 grid-rows-1 w-full h-full overflow-hidden bg-background">
			<!-- Template List -->
			{#if !editor.isEditMode || reviewModal.isReviewing || templateSave.isLoading}
				<div
					class="col-start-1 row-start-1 w-full h-full overflow-hidden"
					in:fade={{ duration: 200, delay: 150, easing: cubicOut }}
					out:fade={{ duration: 150, easing: cubicIn }}
				>
					<TemplateList
						templates={editor.templates}
						onSelect={editor.handleTemplateSelect}
						onCreateNew={editor.handleCreateNewTemplate}
						savingTemplateId={templateSave.isSaving ? templateSave.savingTemplateId : null}
						{sizePresets}
					/>
				</div>
			{/if}

			<!-- Edit View -->
			{#if editor.isEditMode && !reviewModal.isReviewing && !templateSave.isLoading}
				<div
					class="col-start-1 row-start-1 w-full h-full z-10"
					in:fade={{ duration: 200, delay: 100, easing: cubicOut }}
					out:fade={{ duration: 150, easing: cubicIn }}
				>
					<TemplateEditorLayout
						version={editor.editorVersion}
						isLoading={templateSave.isLoading}
						frontElements={editor.frontElements}
						backElements={editor.backElements}
						frontPreview={imageUpload.frontPreview}
						backPreview={imageUpload.backPreview}
						errorMessage={editor.errorMessage}
						cardSize={editor.currentCardSize}
						pixelDimensions={editor.requiredPixelDimensions}
						hasChanges={editor.hasChanges}
						onBack={editor.handleBack}
						onSave={handleSave}
						onClear={editor.clearForm}
						onUpdateElements={editor.updateElements}
						onImageUpload={handleImageUploadWithTracking}
						onRemoveImage={handleRemoveImageWithTracking}
						onUpdateBackgroundPosition={imageUpload.handleBackgroundPositionUpdate}
						{isSuperAdmin}
						templateId={editor.currentTemplate?.id ?? null}
						onDecompose={editor.handleDecompose}
						isDecomposing={editor.isDecomposing}
					/>
				</div>
			{/if}
		</div>

		<!-- Cropping Dialog -->
		<CroppingConfirmationDialog
			bind:open={croppingDialog.showCroppingDialog}
			frontImageInfo={croppingDialog.croppingDialogData.front || null}
			backImageInfo={croppingDialog.croppingDialogData.back || null}
			templateSize={editor.requiredPixelDimensions || {
				width: LEGACY_CARD_SIZE.width,
				height: LEGACY_CARD_SIZE.height
			}}
			onConfirm={handleCroppingConfirm}
			onCancel={croppingDialog.handleCroppingCancel}
		/>

		<!-- Review Modal -->
		<TemplateReviewModal
			isOpen={reviewModal.isReviewing}
			frontCropPreview={imageUpload.frontCropPreview}
			backCropPreview={imageUpload.backCropPreview}
			frontPreview={imageUpload.frontPreview}
			backPreview={imageUpload.backPreview}
			frontElements={editor.frontElements}
			backElements={editor.backElements}
			requiredPixelDimensions={editor.requiredPixelDimensions}
			currentTemplate={editor.currentTemplate}
			reviewSide={reviewModal.reviewSide}
			reviewRotation={reviewModal.reviewRotation}
			isClosingReview={reviewModal.isClosingReview}
			flyTarget={reviewModal.flyTarget}
			isGeneratingVariants={templateSave.isGeneratingVariants}
			variantGenerationProgress={templateSave.variantGenerationProgress}
			isLoading={templateSave.isLoading}
			onFlip={reviewModal.flipReview}
			onCancel={reviewModal.cancelReview}
			onConfirm={handleConfirmSave}
			onAbort={templateSave.cancelSave}
		/>
	{/if}
</main>
