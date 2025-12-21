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
		UNIT_TO_INCHES,
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
		getTemplateAssetCounts,
		createCustomDesignRequest,
		uploadCustomDesignAsset
	} from '$lib/remote/templates.remote';

	// Types
	type WizardStep = 'size' | 'template' | 'custom' | 'material' | 'addons' | 'naming';

	// Material types
	type MaterialType = 'standard_laminated' | 'premium_direct' | 'techsmart_rfid' | 'techsmart_nfc';

	// Add-on types
	interface AddOnSelection {
		uvOverlay: boolean;
		holographic: boolean;
		lanyard: 'none' | '3/4' | '1';
		caseType: 'none' | 'soft' | 'hard';
		retractor: boolean;
	}

	interface Props {
		open?: boolean;
		sizePresets?: any[]; // Database template size presets
	}

	let { open = $bindable(false), sizePresets = [] }: Props = $props();

	// Merge DB presets with common card sizes, preferring DB values
	const availableSizes = $derived.by(() => {
		if (!sizePresets || sizePresets.length === 0) {
			return COMMON_CARD_SIZES;
		}

		// Map DB presets to CardSize format
		const dbSizes: CardSize[] = sizePresets
			.filter((p) => p.is_active !== false)
			.map((p) => {
				// Handle both snake_case (raw DB/legacy) and camelCase (Drizzle) property names
				const wIn = p.widthInches ?? p.width_inches;
				const hIn = p.heightInches ?? p.height_inches;
				const wPx = p.widthPixels ?? p.width_pixels;
				const hPx = p.heightPixels ?? p.height_pixels;
				
				const widthInches = typeof wIn === 'string' ? parseFloat(wIn) : Number(wIn);
				const heightInches = typeof hIn === 'string' ? parseFloat(hIn) : Number(hIn);
				const dpi = p.dpi || DEFAULT_DPI;

				// Calculate dimensions with fallbacks
				const finalWidth = Number.isFinite(widthInches)
					? widthInches
					: (wPx && dpi ? wPx / dpi : 3.375);

				const finalHeight = Number.isFinite(heightInches)
					? heightInches
					: (hPx && dpi ? hPx / dpi : 2.125);

				return {
					name: p.name,
					slug: p.slug,
					width: finalWidth,
					height: finalHeight,
					unit: 'inches' as UnitType,
					description: p.description || ''
				};
			});

		console.log('[SizeSelection] DB Presets loaded:', { count: sizePresets.length, dbSizes });

		// Create a map by slug for easy lookup
		const dbSizeMap = new Map(dbSizes.map((s) => [s.slug, s]));

		// Start with common sizes to maintain order and fallbacks
		const mergedSizes = COMMON_CARD_SIZES.map((commonSize) => {
			if (commonSize.slug && dbSizeMap.has(commonSize.slug)) {
				return dbSizeMap.get(commonSize.slug)!;
			}
			return commonSize;
		});

		// Add any DB-only sizes that weren't in common sizes
		const commonSlugs = new Set(COMMON_CARD_SIZES.map((s) => s.slug).filter(Boolean));
		const newSizes = dbSizes.filter((s) => s.slug && !commonSlugs.has(s.slug));
		
		const result = [...mergedSizes, ...newSizes];
		console.log('[SizeSelection] Final Available Sizes:', result);
		return result;
	});

	// Template asset counts loaded from server (keyed by "slug:orientation")
	let templateAssetCounts = $state<Record<string, number>>({});
	let countsLoaded = $state(false);

	const dispatch = createEventDispatcher<{
		sizeSelected: {
			cardSize: CardSize;
			templateName: string;
			selectedTemplateAsset?: TemplateAsset;
		};
		customDesignSubmitted: {
			sizeInfo: { width: number; height: number; name: string };
			instructions: string;
			files: File[];
			requestId?: string;
		};
		cancel: void;
	}>();

	// Wizard state
	let currentStep = $state<WizardStep>('size');

	// Size selection state
	let selectedSizeType: 'common' | 'custom' = $state('common');
	let selectedCommonSize: CardSize = $state(COMMON_CARD_SIZES[0]);

	// Update selected size when available sizes change or on init
	$effect(() => {
		if (selectedCommonSize === COMMON_CARD_SIZES[0] && availableSizes.length > 0) {
			selectedCommonSize = availableSizes[0];
		}
	});

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

	// Material selection state
	let selectedMaterial = $state<MaterialType>('standard_laminated');

	// Add-ons selection state
	let addOns = $state<AddOnSelection>({
		uvOverlay: false,
		holographic: false,
		lanyard: 'none',
		caseType: 'none',
		retractor: false
	});

	// Check if CR80 size (Premium materials only available for CR80)
	let isCR80 = $derived(() => {
		const size = baseCardSize();
		return (
			size.slug === 'cr80' ||
			size.name?.toLowerCase().includes('cr80') ||
			size.name?.toLowerCase().includes('atm')
		);
	});



	// Compute the base card size (always landscape orientation for 3D preview)
	let baseCardSize = $derived.by(() => {
		let size;
		if (selectedSizeType === 'common') {
			// Ensure safe defaults even for common sizes
			size = {
				...selectedCommonSize,
				width: Number.isFinite(selectedCommonSize?.width) ? selectedCommonSize.width : 3.375,
				height: Number.isFinite(selectedCommonSize?.height) ? selectedCommonSize.height : 2.125
			};
		} else {
			// Sanitize custom inputs - prevent NaN/null propagation
			size = {
				name: customSizeName,
				width: Number.isFinite(customWidth) && customWidth > 0 ? customWidth : 3.5,
				height: Number.isFinite(customHeight) && customHeight > 0 ? customHeight : 2.0,
				unit: customUnit
			};
		}
		return size;
	});

	// Compute the final card size with orientation (for actual template creation)
	let finalCardSize = $derived.by(() => {
		return isPortrait ? switchOrientation(baseCardSize) : baseCardSize;
	});

	// Base pixel dimensions (always landscape, for 3D preview rotation only)
	let basePixelDimensions = $derived(cardSizeToPixels(baseCardSize));

	$effect(() => {
		console.log('[SizeSelection] State Debug:', {
			selectedSizeType,
			selectedCommonSize,
			customWidth,
			customHeight,
			baseCardSize,
			basePixelDimensions
		});
	});

	// Final pixel dimensions (with orientation applied, for template creation)
	let pixelDimensions = $derived(cardSizeToPixels(finalCardSize));

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
		material: 'Choose Material',
		addons: 'Add-ons & Accessories',
		naming: 'Name Your Template'
	};

	// Progress indicator (main steps, excluding custom which is a branch)
	const steps: WizardStep[] = ['size', 'template', 'material', 'addons', 'naming'];
	let currentStepIndex = $derived(
		steps.indexOf(currentStep === 'custom' ? 'template' : currentStep)
	);

	// Get template count for a size and current orientation
	function getTemplateCount(size: CardSize): number {
		if (!size.slug) return 0;
		const orientation = isPortrait ? 'portrait' : 'landscape';
		const key = `${size.slug}:${orientation}`;
		return templateAssetCounts[key] || 0;
	}

	// Load template asset counts from server
	async function loadTemplateAssetCounts() {
		if (countsLoaded) return;
		try {
			templateAssetCounts = await getTemplateAssetCounts();
			countsLoaded = true;
		} catch (e) {
			console.error('Error loading template asset counts:', e);
		}
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
			// Go to material selection
			currentStep = 'material';
			// Reset material to standard if not CR80
			if (!isCR80()) {
				selectedMaterial = 'standard_laminated';
			}
		} else if (currentStep === 'material') {
			// Go to add-ons
			currentStep = 'addons';
		} else if (currentStep === 'addons') {
			// Go to naming
			currentStep = 'naming';
		} else if (currentStep === 'naming') {
			// Validate and submit
			handleConfirm();
		}
	}

	function goBack() {
		if (currentStep === 'template') {
			currentStep = 'size';
		} else if (currentStep === 'custom') {
			currentStep = 'template';
		} else if (currentStep === 'material') {
			currentStep = 'template';
		} else if (currentStep === 'addons') {
			currentStep = 'material';
		} else if (currentStep === 'naming') {
			currentStep = 'addons';
		}
	}

	// Load templates for current size and orientation
	async function loadTemplatesForSize() {
		loadingAssets = true;
		try {
			const orientation = isPortrait ? 'portrait' : 'landscape';
			const sizePresetSlug = baseCardSize.slug || null;
			const assets = await getTemplateAssetsBySize({ sizePresetSlug, orientation });
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
				size_name: finalCardSize.name,
				design_instructions: data.instructions,
				reference_assets: uploadedPaths
			});

			// Dispatch event with the request ID for parent component
			dispatch('customDesignSubmitted', {
				sizeInfo: {
					width: pixelDimensions.width,
					height: pixelDimensions.height,
					name: finalCardSize.name
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
			cardSize: finalCardSize,
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
		selectedCommonSize = availableSizes.length > 0 ? availableSizes[0] : COMMON_CARD_SIZES[0];
		isPortrait = false;
		customWidth = 3.5;
		customHeight = 2.0;
		customUnit = 'inches';
		customSizeName = 'Custom Card';
		error = '';
		templateAssets = [];
		selectedTemplateAsset = null;
		// Reset material and add-ons
		selectedMaterial = 'standard_laminated';
		addOns = {
			uvOverlay: false,
			holographic: false,
			lanyard: 'none',
			caseType: 'none',
			retractor: false
		};
	}

	// Load template counts when dialog opens
	$effect(() => {
		if (open) {
			loadTemplateAssetCounts();
		}
	});

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
					sizeName={finalCardSize.name}
					imageUrl={selectedTemplateAsset?.image_url || null}
					{isPortrait}
					height={currentStep === 'size' ? '55vh' : '200px'}
					showControls={true}
					autoRotate={false}
				/>
				<!-- Portrait toggle overlay (only on size step) -->
				{#if currentStep === 'size'}
					<div
						class="absolute bottom-3 right-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm"
					>
						<Label for="portrait-toggle" class="text-xs cursor-pointer text-muted-foreground"
							>Portrait</Label
						>
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
							isCurrent
								? 'w-8 bg-primary'
								: isActive
									? 'w-2 bg-primary/60'
									: 'w-2 bg-muted-foreground/30'
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
					{:else if currentStep === 'material'}
						Select the card material for your ID cards.
					{:else if currentStep === 'addons'}
						Enhance your cards with security features and accessories.
					{:else if currentStep === 'naming'}
						Give your template a memorable name.
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
								{#each availableSizes as size}
									{@const currentSize = isPortrait ? switchOrientation(size) : size}
									{@const aspectRatio = currentSize.width / currentSize.height}
									{@const templateCount = getTemplateCount(size)}
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
												style="width: {Math.min(32, 32 * aspectRatio)}px; height: {Math.min(
													32 / aspectRatio,
													32
												)}px;"
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
					<!-- Template Browser -->
					<TemplateBrowser
						assets={templateAssets}
						loading={loadingAssets}
						onSelect={handleTemplateSelect}
						onCustomDesign={handleCustomDesignClick}
						selectedAssetId={selectedTemplateAsset?.id || null}
						emptyMessage="No templates available for {finalCardSize.name}"
					/>
				</div>

				<!-- STEP 2b: Custom Design Request -->
			{:else if currentStep === 'custom'}
				<CustomDesignForm
					sizeName={finalCardSize.name}
					widthPixels={pixelDimensions.width}
					heightPixels={pixelDimensions.height}
					onSubmit={handleCustomDesignSubmit}
					onCancel={() => (currentStep = 'template')}
				/>

				<!-- STEP 3: Material Selection -->
			{:else if currentStep === 'material'}
				<div class="space-y-4">
					<RadioGroup bind:value={selectedMaterial} class="space-y-3">
						<!-- Standard Laminated - Available for all sizes -->
						<label
							class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 {selectedMaterial ===
							'standard_laminated'
								? 'border-primary bg-primary/5 ring-1 ring-primary'
								: 'border-border'}"
						>
							<RadioGroupItem value="standard_laminated" id="mat-standard" class="mt-1" />
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium">Standard Laminated (PVC)</span>
									<span class="text-sm text-muted-foreground">₱23-50/card</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Durable PVC with protective lamination. Available for all sizes.
								</p>
							</div>
						</label>

						<!-- Premium Direct Print - CR80 only -->
						<label
							class="flex items-start gap-3 p-4 rounded-lg border transition-all {!isCR80()
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer hover:border-primary/50'} {selectedMaterial === 'premium_direct'
								? 'border-primary bg-primary/5 ring-1 ring-primary'
								: 'border-border'}"
						>
							<RadioGroupItem
								value="premium_direct"
								id="mat-premium"
								class="mt-1"
								disabled={!isCR80()}
							/>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium">Premium Direct Print</span>
									<span class="text-sm text-muted-foreground">₱120-180/card</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Professional edge-to-edge printing. {!isCR80()
										? 'Only available for CR80 size.'
										: 'Premium quality finish.'}
								</p>
							</div>
						</label>

						<!-- TechSmart NFC - CR80 only -->
						<label
							class="flex items-start gap-3 p-4 rounded-lg border transition-all {!isCR80()
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer hover:border-primary/50'} {selectedMaterial === 'techsmart_nfc'
								? 'border-primary bg-primary/5 ring-1 ring-primary'
								: 'border-border'}"
						>
							<RadioGroupItem
								value="techsmart_nfc"
								id="mat-nfc"
								class="mt-1"
								disabled={!isCR80()}
							/>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium">TechSmart NFC</span>
									<span class="text-sm text-muted-foreground">₱180-220/card</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Embedded NFC chip for digital ID linking. {!isCR80()
										? 'Only available for CR80 size.'
										: 'Tap to verify.'}
								</p>
							</div>
						</label>

						<!-- TechSmart RFID - CR80 only -->
						<label
							class="flex items-start gap-3 p-4 rounded-lg border transition-all {!isCR80()
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer hover:border-primary/50'} {selectedMaterial === 'techsmart_rfid'
								? 'border-primary bg-primary/5 ring-1 ring-primary'
								: 'border-border'}"
						>
							<RadioGroupItem
								value="techsmart_rfid"
								id="mat-rfid"
								class="mt-1"
								disabled={!isCR80()}
							/>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium">TechSmart RFID</span>
									<span class="text-sm text-muted-foreground">₱220-280/card</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Embedded RFID chip for access control. {!isCR80()
										? 'Only available for CR80 size.'
										: 'Door & gate access.'}
								</p>
							</div>
						</label>
					</RadioGroup>
				</div>

				<!-- STEP 4: Add-ons & Accessories -->
			{:else if currentStep === 'addons'}
				<div class="space-y-6">
					<!-- Security Features -->
					<div class="space-y-3">
						<h4 class="text-sm font-medium">Security Features</h4>
						<div class="space-y-2">
							<label
								class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-all {addOns.uvOverlay
									? 'border-primary bg-primary/5'
									: 'border-border'}"
							>
								<div>
									<span class="font-medium">UV Overlay</span>
									<p class="text-xs text-muted-foreground">
										Hidden security pattern visible under UV light
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">+₱25/card</span>
									<Switch bind:checked={addOns.uvOverlay} />
								</div>
							</label>
							<label
								class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-all {addOns.holographic
									? 'border-primary bg-primary/5'
									: 'border-border'}"
							>
								<div>
									<span class="font-medium">Holographic Overlay</span>
									<p class="text-xs text-muted-foreground">
										Tamper-evident holographic security layer
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">+₱35/card</span>
									<Switch bind:checked={addOns.holographic} />
								</div>
							</label>
						</div>
					</div>

					<!-- Lanyard -->
					<div class="space-y-3">
						<h4 class="text-sm font-medium">Lanyard</h4>
						<div class="grid grid-cols-3 gap-2">
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.lanyard === 'none'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.lanyard = 'none')}
							>
								<span class="text-sm font-medium">None</span>
							</button>
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.lanyard === '3/4'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.lanyard = '3/4')}
							>
								<span class="text-sm font-medium">3/4"</span>
								<p class="text-xs text-muted-foreground">₱40-50</p>
							</button>
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.lanyard === '1'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.lanyard = '1')}
							>
								<span class="text-sm font-medium">1"</span>
								<p class="text-xs text-muted-foreground">₱55-70</p>
							</button>
						</div>
					</div>

					<!-- Card Case -->
					<div class="space-y-3">
						<h4 class="text-sm font-medium">Card Case</h4>
						<div class="grid grid-cols-3 gap-2">
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.caseType === 'none'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.caseType = 'none')}
							>
								<span class="text-sm font-medium">None</span>
							</button>
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.caseType === 'soft'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.caseType = 'soft')}
							>
								<span class="text-sm font-medium">Soft</span>
								<p class="text-xs text-muted-foreground">₱10</p>
							</button>
							<button
								type="button"
								class="p-3 rounded-lg border text-center transition-all {addOns.caseType === 'hard'
									? 'border-primary bg-primary/5 ring-1 ring-primary'
									: 'border-border hover:border-primary/50'}"
								onclick={() => (addOns.caseType = 'hard')}
							>
								<span class="text-sm font-medium">Hard</span>
								<p class="text-xs text-muted-foreground">₱25</p>
							</button>
						</div>
					</div>

					<!-- Retractor -->
					<label
						class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-all {addOns.retractor
							? 'border-primary bg-primary/5'
							: 'border-border'}"
					>
						<div>
							<span class="font-medium">Badge Retractor</span>
							<p class="text-xs text-muted-foreground">Retractable reel for easy badge access</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm text-muted-foreground">₱35</span>
							<Switch bind:checked={addOns.retractor} />
						</div>
					</label>
				</div>

				<!-- STEP 5: Naming -->
			{:else if currentStep === 'naming'}
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="templateName">Template Name *</Label>
						<Input
							id="templateName"
							bind:value={templateName}
							placeholder="e.g., Company Employee ID, Student Card"
							class="w-full bg-background text-lg"
						/>
						<p class="text-xs text-muted-foreground">
							This name will help you identify this template in your library.
						</p>
					</div>

					<!-- Summary of selections -->
					<div class="mt-6 p-4 rounded-lg bg-muted/50 border border-border space-y-2">
						<h4 class="text-sm font-medium">Summary</h4>
						<div class="text-sm text-muted-foreground space-y-1">
							<p>
								<span class="text-foreground">Size:</span>
								{finalCardSize().name} ({isPortrait ? 'Portrait' : 'Landscape'})
							</p>
							<p>
								<span class="text-foreground">Template:</span>
								{selectedTemplateAsset?.name || 'Blank'}
							</p>
							<p>
								<span class="text-foreground">Material:</span>
								{selectedMaterial === 'standard_laminated'
									? 'Standard Laminated'
									: selectedMaterial === 'premium_direct'
										? 'Premium Direct Print'
										: selectedMaterial === 'techsmart_nfc'
											? 'TechSmart NFC'
											: 'TechSmart RFID'}
							</p>
							{#if addOns.uvOverlay || addOns.holographic || addOns.lanyard !== 'none' || addOns.caseType !== 'none' || addOns.retractor}
								<p>
									<span class="text-foreground">Add-ons:</span>
									{[
										addOns.uvOverlay && 'UV Overlay',
										addOns.holographic && 'Holographic',
										addOns.lanyard !== 'none' && `${addOns.lanyard}" Lanyard`,
										addOns.caseType !== 'none' &&
											`${addOns.caseType === 'soft' ? 'Soft' : 'Hard'} Case`,
										addOns.retractor && 'Retractor'
									]
										.filter(Boolean)
										.join(', ')}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			{#if error}
				<div
					class="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 mt-4"
				>
					{error}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if currentStep !== 'custom'}
			<DialogFooter class="flex-shrink-0 flex-row justify-between border-t border-border p-4 gap-2">
				{#if currentStep === 'size'}
					<Button variant="outline" onclick={handleCancel}>Cancel</Button>
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
						{#if currentStep === 'naming'}
							Create Template
						{:else if currentStep === 'template'}
							{selectedTemplateAsset ? 'Continue' : 'Skip Template'}
							<ChevronRight class="h-4 w-4 ml-1" />
						{:else}
							Next
							<ChevronRight class="h-4 w-4 ml-1" />
						{/if}
					</Button>
				{/if}
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
