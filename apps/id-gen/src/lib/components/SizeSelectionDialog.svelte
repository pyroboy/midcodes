<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Switch } from '$lib/components/ui/switch';
	import { ChevronLeft, ChevronRight, Loader2 } from '@lucide/svelte';
	import {
		COMMON_CARD_SIZES,
		cardSizeToPixels,
		formatDimensions,
		getUnitSymbol,
		switchOrientation,
		DEFAULT_DPI,
		type CardSize,
		type UnitType
	} from '$lib/utils/sizeConversion';
	import { cn } from '$lib/utils';

	// Import new components
	import ModalCard3DPreview from './ModalCard3DPreview.svelte';
	import TemplateBrowser from './TemplateBrowser.svelte';
	import CustomDesignForm from './CustomDesignForm.svelte';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';

	// Import remote functions
	import {
		getTemplateAssetsBySize,
		createCustomDesignRequest,
		uploadCustomDesignAsset
	} from '$lib/remote/templates.remote';

	// Types
	type WizardStep = 'size' | 'template' | 'custom' | 'background';

	interface Props {
		open?: boolean;
		// Data from parent (template assets counts, etc.)
		templateAssetCounts?: Record<string, number>;
	}

	let { open = $bindable(false), templateAssetCounts = {} }: Props = $props();

	const dispatch = createEventDispatcher<{
		sizeSelected: { cardSize: CardSize; templateName: string; selectedTemplateAsset?: TemplateAsset };
		customDesignSubmitted: { sizeInfo: { width: number; height: number; name: string }; instructions: string; files: File[]; requestId?: string };
		cancel: void;
	}>();

	// Wizard state
	let currentStep = $state<WizardStep>('size');
	
	// Size selection state
	let selectedSizeType: 'common' | 'custom' = $state('common');
	let selectedCommonSize: CardSize = $state(COMMON_CARD_SIZES[0]);
	let isPortrait: boolean = $state(false);
	let customWidth: number = $state(3.5);
	let customHeight: number = $state(2.0);
	let customUnit: UnitType = $state('inches');
	let templateName: string = $state('');
	let customSizeName: string = $state('Custom Card');
	let error: string = $state('');

	// Template selection state
	let templateAssets = $state<TemplateAsset[]>([]);
	let loadingAssets = $state(false);
	let selectedTemplateAsset = $state<TemplateAsset | null>(null);

	// Compute the base card size (always landscape orientation for 3D preview)
	let baseCardSize = $derived(() => {
		return selectedSizeType === 'common'
			? selectedCommonSize
			: { name: customSizeName, width: customWidth, height: customHeight, unit: customUnit };
	});

	// Compute the final card size with orientation (for actual template creation)
	let finalCardSize = $derived(() => {
		return isPortrait ? switchOrientation(baseCardSize()) : baseCardSize();
	});

	// Base pixel dimensions (always landscape, for 3D preview rotation only)
	let basePixelDimensions = $derived(cardSizeToPixels(baseCardSize()));

	// Final pixel dimensions (with orientation applied, for template creation)
	let pixelDimensions = $derived(cardSizeToPixels(finalCardSize()));

	const availableUnits: { value: UnitType; label: string }[] = [
		{ value: 'inches', label: 'Inches (")' },
		{ value: 'mm', label: 'Millimeters (mm)' },
		{ value: 'cm', label: 'Centimeters (cm)' },
		{ value: 'pixels', label: 'Pixels (px)' }
	];

	// Step titles
	const stepTitles: Record<WizardStep, string> = {
		size: 'Choose Card Size',
		template: 'Select Template',
		custom: 'Request Custom Design',
		background: 'Select Background'
	};

	// Progress indicator
	const steps: WizardStep[] = ['size', 'template', 'background'];
	let currentStepIndex = $derived(steps.indexOf(currentStep === 'custom' ? 'template' : currentStep));

	// Get template count for a size
	function getTemplateCount(sizeName: string): number {
		// For now, return from prop or simulate counts
		// In real app, this would be fetched via remote function
		return templateAssetCounts[sizeName] || Math.floor(Math.random() * 5);
	}

	// Size selection handlers
	function handleSizeTypeChange(value: string) {
		selectedSizeType = value as 'common' | 'custom';
		error = '';
	}

	function handleCommonSizeChange(size: CardSize) {
		selectedCommonSize = size;
		templateName = templateName || `${size.name} Template`;
	}

	function handleCustomSizeChange() {
		templateName = templateName || `${customSizeName} Template`;
		error = '';
	}

	// Navigation
	function goToStep(step: WizardStep) {
		currentStep = step;
	}

	function goNext() {
		if (currentStep === 'size') {
			// Load template assets for this size
			loadTemplatesForSize();
			currentStep = 'template';
		} else if (currentStep === 'template') {
			// Validate template name before proceeding
			if (!templateName.trim()) {
				error = 'Template name is required';
				return;
			}
			if (selectedTemplateAsset) {
				// User selected a template, go to final confirmation
				handleConfirm();
			} else {
				// Go to background selection for blank templates
				currentStep = 'background';
			}
		} else if (currentStep === 'background') {
			handleConfirm();
		}
	}

	function goBack() {
		if (currentStep === 'template') {
			currentStep = 'size';
		} else if (currentStep === 'custom') {
			currentStep = 'template';
		} else if (currentStep === 'background') {
			currentStep = 'template';
		}
	}

	// Load templates for current size
	async function loadTemplatesForSize() {
		loadingAssets = true;
		try {
			// Call remote function to get template assets
			// We pass null for sizePresetId since we're using client-side size definitions
			// In a full implementation, you'd match the selected size to a size preset in the database
			const assets = await getTemplateAssetsBySize({ sizePresetId: null });
			templateAssets = assets || [];
		} catch (e) {
			console.error('Error loading templates:', e);
			templateAssets = [];
		} finally {
			loadingAssets = false;
		}
	}

	// Template browser handlers
	function handleTemplateSelect(asset: TemplateAsset) {
		selectedTemplateAsset = asset;
	}

	function handleCustomDesignClick() {
		currentStep = 'custom';
	}

	// Custom design submission
	let isSubmittingCustomDesign = $state(false);

	async function handleCustomDesignSubmit(data: { instructions: string; files: File[] }) {
		isSubmittingCustomDesign = true;
		error = '';

		try {
			// Upload reference files first
			const uploadedPaths: string[] = [];
			for (const file of data.files) {
				const arrayBuffer = await file.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);
				const result = await uploadCustomDesignAsset({
					file: uint8Array as unknown as Buffer,
					fileName: file.name
				});
				uploadedPaths.push(result.path);
			}

			// Create the custom design request in the database
			const result = await createCustomDesignRequest({
				size_preset_id: null, // Using custom size from client-side definitions
				width_pixels: pixelDimensions.width,
				height_pixels: pixelDimensions.height,
				size_name: finalCardSize().name,
				design_instructions: data.instructions,
				reference_assets: uploadedPaths
			});

			// Dispatch event with the request ID for parent component
			dispatch('customDesignSubmitted', {
				sizeInfo: {
					width: pixelDimensions.width,
					height: pixelDimensions.height,
					name: finalCardSize().name
				},
				instructions: data.instructions,
				files: data.files,
				requestId: result.id
			});

			// Reset and close
			resetForm();
			open = false;
		} catch (e) {
			console.error('Error submitting custom design request:', e);
			error = e instanceof Error ? e.message : 'Failed to submit custom design request';
		} finally {
			isSubmittingCustomDesign = false;
		}
	}

	// Final confirmation
	function handleConfirm() {
		if (!templateName.trim()) {
			error = 'Template name is required';
			return;
		}

		dispatch('sizeSelected', {
			cardSize: finalCardSize(),
			templateName: templateName.trim(),
			selectedTemplateAsset: selectedTemplateAsset || undefined
		});

		resetForm();
	}

	function handleCancel() {
		dispatch('cancel');
		resetForm();
	}

	function resetForm() {
		currentStep = 'size';
		templateName = '';
		selectedSizeType = 'common';
		selectedCommonSize = COMMON_CARD_SIZES[0];
		isPortrait = false;
		customWidth = 3.5;
		customHeight = 2.0;
		customUnit = 'inches';
		customSizeName = 'Custom Card';
		error = '';
		templateAssets = [];
		selectedTemplateAsset = null;
	}

	// Reset when dialog closes
	$effect(() => {
		if (!open) {
			resetForm();
		}
	});
</script>

<Dialog bind:open>
	<DialogContent
		class="w-[95vw] max-w-lg sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0"
	>
		<!-- 3D Preview (fixed at top) with portrait toggle overlay -->
		{#if browser}
			<div class="flex-shrink-0 relative">
				<ModalCard3DPreview
					widthPixels={basePixelDimensions.width}
					heightPixels={basePixelDimensions.height}
					sizeName={finalCardSize().name}
					imageUrl={selectedTemplateAsset?.image_url || null}
					isPortrait={isPortrait}
					height={currentStep === 'size' ? '55vh' : '200px'}
					showControls={true}
					autoRotate={false}
				/>
				<!-- Portrait toggle overlay (only on size step) -->
				{#if currentStep === 'size'}
					<div class="absolute bottom-3 right-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm">
						<Label for="portrait-toggle" class="text-xs cursor-pointer text-muted-foreground">Portrait</Label>
						<Switch id="portrait-toggle" bind:checked={isPortrait} />
					</div>
				{/if}
			</div>
		{/if}

		<!-- Progress indicator -->
		<div class="flex-shrink-0 px-4 py-3 border-b border-border bg-muted/30">
			<div class="flex items-center justify-center gap-2">
				{#each steps as step, i}
					{@const isActive = currentStepIndex >= i}
					{@const isCurrent = currentStepIndex === i}
					<div
						class={cn(
							'h-2 rounded-full transition-all',
							isCurrent ? 'w-8 bg-primary' : isActive ? 'w-2 bg-primary/60' : 'w-2 bg-muted-foreground/30'
						)}
					></div>
				{/each}
			</div>
		</div>

		<!-- Header (hidden for size step) -->
		{#if currentStep !== 'size'}
			<DialogHeader class="flex-shrink-0 px-4 pt-4 pb-2">
				<DialogTitle>{stepTitles[currentStep]}</DialogTitle>
				<DialogDescription>
					{#if currentStep === 'template'}
						Select an existing template or request a custom design.
					{:else if currentStep === 'custom'}
						Describe your desired design and upload reference images.
					{:else}
						Choose a background for your template.
					{/if}
				</DialogDescription>
			</DialogHeader>
		{/if}

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto px-4 pb-4">
			<!-- STEP 1: Size Selection -->
			{#if currentStep === 'size'}
				<div class="space-y-3 pt-2">
					<!-- Size type toggle -->
					<div class="flex items-center justify-center">
						<RadioGroup
							value={selectedSizeType}
							onValueChange={handleSizeTypeChange}
							class="flex flex-row gap-4"
						>
							<div class="flex items-center space-x-2">
								<RadioGroupItem value="common" id="common" />
								<Label for="common" class="cursor-pointer text-sm">Common Sizes</Label>
							</div>
							<div class="flex items-center space-x-2">
								<RadioGroupItem value="custom" id="custom" />
								<Label for="custom" class="cursor-pointer text-sm">Custom Size</Label>
							</div>
						</RadioGroup>
					</div>

					{#if selectedSizeType === 'common'}
						<!-- Horizontal scrollable card sizes -->
						<div class="overflow-x-auto pb-2 -mx-4 px-4">
							<div class="flex gap-2 min-w-max">
								{#each COMMON_CARD_SIZES as size}
									{@const currentSize = isPortrait ? switchOrientation(size) : size}
									{@const aspectRatio = currentSize.width / currentSize.height}
									{@const templateCount = getTemplateCount(size.name)}
									<button
										type="button"
										class={cn(
											'flex-shrink-0 w-24 p-2 rounded-lg border transition-all hover:shadow-md active:scale-[0.98]',
											selectedCommonSize.name === size.name
												? 'border-primary bg-primary/5 ring-1 ring-primary'
												: 'border-border hover:border-primary/50 bg-card'
										)}
										onclick={() => handleCommonSizeChange(size)}
									>
										<!-- Visual Preview -->
										<div class="flex justify-center mb-1.5 h-[32px] items-center">
											<div
												class="border border-foreground/20 bg-background shadow-sm"
												style="width: {Math.min(32, 32 * aspectRatio)}px; height: {Math.min(32 / aspectRatio, 32)}px;"
											></div>
										</div>
										<div class="text-center">
											<div class="text-[11px] font-medium truncate">{size.name}</div>
											<div class="text-[9px] text-muted-foreground">
												{formatDimensions(currentSize, false)}
											</div>
											{#if templateCount > 0}
												<div class="text-[9px] text-primary font-medium">
													{templateCount} template{templateCount !== 1 ? 's' : ''}
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<!-- Custom size inputs -->
						<div class="space-y-3">
							<div class="space-y-2">
								<Label for="customName" class="text-sm">Size Name</Label>
								<Input
									id="customName"
									bind:value={customSizeName}
									placeholder="Enter custom size name"
									oninput={handleCustomSizeChange}
									class="bg-background"
								/>
							</div>

							<div class="grid grid-cols-3 gap-2">
								<div class="space-y-1">
									<Label for="unit" class="text-xs">Unit</Label>
									<select
										id="unit"
										bind:value={customUnit}
										class="w-full h-9 px-2 py-1 text-sm bg-background border border-input rounded-md"
										onchange={handleCustomSizeChange}
									>
										{#each availableUnits as unit}
											<option value={unit.value}>{unit.label}</option>
										{/each}
									</select>
								</div>
								<div class="space-y-1">
									<Label for="width" class="text-xs">Width</Label>
									<Input
										id="width"
										type="number"
										bind:value={customWidth}
										min="0.1"
										step={customUnit === 'pixels' ? '1' : '0.1'}
										oninput={handleCustomSizeChange}
										class="bg-background h-9 text-sm"
									/>
								</div>
								<div class="space-y-1">
									<Label for="height" class="text-xs">Height</Label>
									<Input
										id="height"
										type="number"
										bind:value={customHeight}
										min="0.1"
										step={customUnit === 'pixels' ? '1' : '0.1'}
										oninput={handleCustomSizeChange}
										class="bg-background h-9 text-sm"
									/>
								</div>
							</div>

							<div class="text-center text-xs text-muted-foreground">
								{pixelDimensions.width} × {pixelDimensions.height}px @ {DEFAULT_DPI} DPI
							</div>
						</div>
					{/if}
				</div>

			<!-- STEP 2: Template Selection -->
			{:else if currentStep === 'template'}
				<div class="space-y-4">
					<!-- Template Name Input -->
					<div class="space-y-2">
						<Label for="templateName">Template Name *</Label>
						<Input
							id="templateName"
							bind:value={templateName}
							placeholder="Enter a name for your template"
							class="w-full bg-background"
						/>
					</div>

					<!-- Template Browser -->
					<TemplateBrowser
						assets={templateAssets}
						loading={loadingAssets}
						onSelect={handleTemplateSelect}
						onCustomDesign={handleCustomDesignClick}
						selectedAssetId={selectedTemplateAsset?.id || null}
						emptyMessage="No templates available for {finalCardSize().name}"
					/>
				</div>

			<!-- STEP 2b: Custom Design Request -->
			{:else if currentStep === 'custom'}
				<CustomDesignForm
					sizeName={finalCardSize().name}
					widthPixels={pixelDimensions.width}
					heightPixels={pixelDimensions.height}
					onSubmit={handleCustomDesignSubmit}
					onCancel={() => (currentStep = 'template')}
				/>

			<!-- STEP 3: Background Selection -->
			{:else if currentStep === 'background'}
				<div class="space-y-4">
					<p class="text-sm text-muted-foreground text-center">
						Background selection coming soon. For now, create a blank template and add backgrounds in the editor.
					</p>
				</div>
			{/if}

			{#if error}
				<div class="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 mt-4">
					{error}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if currentStep !== 'custom'}
			<DialogFooter class="flex-shrink-0 flex-row justify-between border-t border-border p-4 gap-2">
				{#if currentStep === 'size'}
					<Button variant="outline" onclick={handleCancel}>
						Cancel
					</Button>
					<Button onclick={goNext}>
						Next
						<ChevronRight class="h-4 w-4 ml-1" />
					</Button>
				{:else}
					<Button variant="outline" onclick={goBack}>
						<ChevronLeft class="h-4 w-4 mr-1" />
						Back
					</Button>
					<Button onclick={goNext}>
						{currentStep === 'background' ? 'Create Template' : selectedTemplateAsset ? 'Use Template' : 'Skip & Create Blank'}
						{#if currentStep !== 'background'}
							<ChevronRight class="h-4 w-4 ml-1" />
						{/if}
					</Button>
				{/if}
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
