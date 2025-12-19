<script lang="ts">
	import type { SizePreset } from '$lib/schemas/template-assets.schema';
	import {
		assetUploadStore,
		canProceedToNext,
		stepProgress,
		stepLabels,
		previewPairs
	} from '$lib/stores/assetUploadStore';
	import Step1SizeSelection from './steps/Step1SizeSelection.svelte';
	import Step2ImageUpload from './steps/Step2ImageUpload.svelte';
	import Step3CardDetection from './steps/Step3CardDetection.svelte';
	import Step4SaveAssets from './steps/Step4SaveAssets.svelte';
	import { cn } from '$lib/utils';
	import { extractAndResizeRegion } from '$lib/utils/cardExtraction';
	import { generateImageVariants, TEMPLATE_VARIANTS } from '$lib/utils/imageProcessing';
	import { fade } from 'svelte/transition';
	import { deserialize } from '$app/forms';

	interface Props {
		sizePresets: SizePreset[];
		userId: string;
		onComplete?: () => void;
		onCancel?: () => void;
	}

	let { sizePresets, userId, onComplete, onCancel }: Props = $props();

	const steps = ['size', 'upload', 'detection', 'save'] as const;
	
	let uploadProgress = $state({ current: 0, total: 0 });

	async function saveAssets() {
		// Filter for valid pairs (must have at least front)
        const pairsToSave = $previewPairs.filter(p => p.status === 'paired' || p.status === 'unpaired-front');
        
		if (pairsToSave.length === 0) return;

		assetUploadStore.setProcessing(true);
		assetUploadStore.setError(null);
		uploadProgress = { current: 0, total: pairsToSave.length };

		try {
            const frontFile = $assetUploadStore.frontImage;
            const backFile = $assetUploadStore.backImage;
            
			if (!frontFile && !backFile) throw new Error('No image files found');

			const preset = $assetUploadStore.selectedSizePreset;
			if (!preset) throw new Error('No size preset selected');

			if (!userId) throw new Error('You must be logged in to save assets');

			let successCount = 0;

			// Process each pair
			for (const [index, pair] of pairsToSave.entries()) {
				// Update progress
				uploadProgress = { current: index + 1, total: pairsToSave.length };

				// 1. Extract and resize to full dimensions
                // Front
                if (!frontFile) throw new Error('Front image is missing');
				const extractedFront = await extractAndResizeRegion(frontFile, pair.front, preset);
				const frontVariants = await generateImageVariants(extractedFront.blob, TEMPLATE_VARIANTS);
                
                // Back (Optional)
                let backVariants = null;
                let extractedBack = null;
                if (pair.back && backFile) {
                    extractedBack = await extractAndResizeRegion(backFile, pair.back, preset);
                    backVariants = await generateImageVariants(extractedBack.blob, TEMPLATE_VARIANTS);
                }

				// 3. Prepare FormData for server action
				const formData = new FormData();
                
                // Append Front
				formData.set('image_front_full', frontVariants.full, 'front-full.png');
				formData.set('image_front_preview', frontVariants.preview, 'front-preview.jpg');
				formData.set('image_front_thumb', frontVariants.thumb, 'front-thumb.jpg');
                
                // Append Back (if exists)
                if (backVariants) {
                    formData.set('image_back_full', backVariants.full, 'back-full.png');
				    formData.set('image_back_preview', backVariants.preview, 'back-preview.jpg');
				    formData.set('image_back_thumb', backVariants.thumb, 'back-thumb.jpg');
                }
				
                // Use Front ID for metadata lookup (as we keyed it by Front ID in store logic)
				const meta = $assetUploadStore.assetMetadata.get(pair.front.id);
				formData.set('name', meta?.name || `Template ${index + 1}`);
				formData.set('description', meta?.description || '');
				formData.set('category', meta?.category || '');
				formData.set('tags', JSON.stringify(meta?.tags || []));
				formData.set('sizePresetId', preset.id);
				formData.set('sampleType', $assetUploadStore.sampleType || 'blank_template');
				formData.set('orientation', pair.front.orientation);
				formData.set('widthPixels', extractedFront.width.toString());
				formData.set('heightPixels', extractedFront.height.toString());

				// 4. Call server action
				const response = await fetch('?/saveAsset', {
					method: 'POST',
					body: formData
				});

				const result = deserialize(await response.text());
				
				if (result.type === 'failure') {
					throw new Error((result.data as { error?: string })?.error || 'Failed to save asset');
				}
				
				if (result.type !== 'success') {
					throw new Error('Unexpected response from server');
				}

				successCount++;
			}

			if (successCount === pairsToSave.length) {
				if (onComplete) onComplete();
			}

		} catch (e) {
			console.error('Save error:', e);
			assetUploadStore.setError(e instanceof Error ? e.message : 'Failed to save assets');
		} finally {
			assetUploadStore.setProcessing(false);
		}
	}

	function nextStep() {
		// If currently on save step, trigger save
		if ($assetUploadStore.currentStep === 'save') {
			saveAssets();
			return;
		}

		const currentIndex = steps.indexOf($assetUploadStore.currentStep);
		// If going from detection to save, initialize metadata
		if ($assetUploadStore.currentStep === 'detection') {
			assetUploadStore.initializeMetadata();
		}
		
		if (currentIndex < steps.length - 1) {
			assetUploadStore.goToStep(steps[currentIndex + 1]);
		}
	}

	function prevStep() {
		const currentIndex = steps.indexOf($assetUploadStore.currentStep);
		if (currentIndex > 0) {
			assetUploadStore.goToStep(steps[currentIndex - 1]);
		}
	}

	function handleCancel() {
		assetUploadStore.reset();
		onCancel?.();
	}
</script>

<div class="space-y-6 relative">
	<!-- Upload Progress Overlay -->
	{#if $assetUploadStore.isProcessing && uploadProgress.total > 0}
		<div 
			transition:fade={{ duration: 200 }}
			class="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-background/90 backdrop-blur-sm"
		>
			<div class="w-full max-w-sm space-y-4 p-6 bg-card rounded-xl border border-border shadow-lg text-center">
				<div class="mx-auto h-12 w-12 text-primary">
					<svg class="animate-spin h-full w-full" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-foreground">Processing Templates</h3>
					<p class="text-muted-foreground mt-1">
						Saving {uploadProgress.current} of {uploadProgress.total} templates...
					</p>
				</div>
				<!-- Progress Bar -->
				<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
					<div 
						class="h-full bg-primary transition-all duration-300 ease-out"
						style="width: {(uploadProgress.current / uploadProgress.total) * 100}%"
					></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Progress steps -->
	<div class="relative">
		<div class="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted"></div>
		<div
			class="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
			style="width: {$stepProgress.percentage}%;"
		></div>

		<ol class="relative z-10 flex justify-between">
			{#each steps as step, index}
				{@const isCurrent = $assetUploadStore.currentStep === step}
				{@const isCompleted = index < steps.indexOf($assetUploadStore.currentStep)}
				{@const stepNumber = index + 1}

				<li class="flex flex-col items-center">
					<button
						type="button"
						onclick={() => isCompleted && assetUploadStore.goToStep(step)}
						disabled={!isCompleted || $assetUploadStore.isProcessing}
						class={cn(
							'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
							isCurrent && 'border-primary bg-primary text-primary-foreground',
							isCompleted && 'border-primary bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
							!isCurrent && !isCompleted && 'border-muted bg-background text-muted-foreground'
						)}
					>
						{#if isCompleted}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{stepNumber}
						{/if}
					</button>
					<span
						class={cn(
							'mt-2 text-xs font-medium',
							isCurrent ? 'text-foreground' : 'text-muted-foreground'
						)}
					>
						{stepLabels[step]}
					</span>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Error display -->
	{#if $assetUploadStore.error}
		<div class="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
			<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div class="flex-1">
				<p class="text-sm font-medium text-destructive">Error</p>
				<p class="mt-1 text-sm text-destructive/80">{$assetUploadStore.error}</p>
			</div>
			<button
				type="button"
				onclick={() => assetUploadStore.setError(null)}
				aria-label="Dismiss error"
				class="text-destructive/60 hover:text-destructive"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Step content -->
	<div class="min-h-[400px]">
		{#if $assetUploadStore.currentStep === 'size'}
			<Step1SizeSelection {sizePresets} />
		{:else if $assetUploadStore.currentStep === 'upload'}
			<Step2ImageUpload />
		{:else if $assetUploadStore.currentStep === 'detection'}
			<Step3CardDetection />
		{:else if $assetUploadStore.currentStep === 'save'}
			<Step4SaveAssets />
		{/if}
	</div>

	<!-- Navigation buttons -->
	<div class="flex items-center justify-between border-t border-border pt-6">
		<button
			type="button"
			onclick={handleCancel}
			disabled={$assetUploadStore.isProcessing}
			class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
		>
			Cancel
		</button>

		<div class="flex items-center gap-3">
			{#if $assetUploadStore.currentStep !== 'size'}
				<button
					type="button"
					onclick={prevStep}
					disabled={$assetUploadStore.isProcessing}
					class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Previous
				</button>
			{/if}

			<button
				type="button"
				onclick={nextStep}
				disabled={!$canProceedToNext || $assetUploadStore.isProcessing}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if $assetUploadStore.isProcessing}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					{#if $assetUploadStore.currentStep === 'detection'}
						Processing...
					{:else}
						Saving...
					{/if}
				{:else if $assetUploadStore.currentStep === 'save'}
					Save Templates
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				{:else}
					Next
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</div>
