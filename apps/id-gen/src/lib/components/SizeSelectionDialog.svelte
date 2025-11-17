<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
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
	import { RotateCw } from '@lucide/svelte';
	import {
		COMMON_CARD_SIZES,
		createCustomCardSize,
		cardSizeToPixels,
		formatDimensions,
		getUnitSymbol,
		switchOrientation,
		DEFAULT_DPI,
		type CardSize,
		type UnitType
	} from '$lib/utils/sizeConversion';

	let { open = $bindable(false) } = $props();

	const dispatch = createEventDispatcher<{
		sizeSelected: { cardSize: CardSize; templateName: string };
		cancel: void;
	}>();

	let selectedSizeType: 'common' | 'custom' = $state('common');
	let selectedCommonSize: CardSize = $state(COMMON_CARD_SIZES[0]);
	let isPortrait: boolean = $state(false);
	let customWidth: number = $state(3.5);
	let customHeight: number = $state(2.0);
	let customUnit: UnitType = $state('inches');
	let templateName: string = $state('');
	let customSizeName: string = $state('Custom Card');
	let error: string = $state('');

	// Compute the final card size with orientation
	let finalCardSize = $derived(() => {
		const baseSize =
			selectedSizeType === 'common'
				? selectedCommonSize
				: { name: customSizeName, width: customWidth, height: customHeight, unit: customUnit };
		return isPortrait ? switchOrientation(baseSize) : baseSize;
	});

	const availableUnits: { value: UnitType; label: string }[] = [
		{ value: 'inches', label: 'Inches (")' },
		{ value: 'mm', label: 'Millimeters (mm)' },
		{ value: 'cm', label: 'Centimeters (cm)' },
		{ value: 'pixels', label: 'Pixels (px)' }
	];

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

	function handleConfirm() {
		if (!templateName.trim()) {
			error = 'Template name is required';
			return;
		}

		dispatch('sizeSelected', {
			cardSize: finalCardSize(),
			templateName: templateName.trim()
		});

		// Reset form
		templateName = '';
		selectedSizeType = 'common';
		selectedCommonSize = COMMON_CARD_SIZES[0];
		isPortrait = false;
		customWidth = 3.5;
		customHeight = 2.0;
		customUnit = 'inches';
		customSizeName = 'Custom Card';
		error = '';
	}

	function handleCancel() {
		dispatch('cancel');
		// Reset form
		templateName = '';
		selectedSizeType = 'common';
		selectedCommonSize = COMMON_CARD_SIZES[0];
		isPortrait = false;
		customWidth = 3.5;
		customHeight = 2.0;
		customUnit = 'inches';
		customSizeName = 'Custom Card';
		error = '';
	}

	let pixelDimensions = $derived(cardSizeToPixels(finalCardSize()));
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Create New Template</DialogTitle>
			<DialogDescription>
				Choose a card size and provide a name for your new template.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Template Name -->
			<div class="space-y-2">
				<Label for="templateName">Template Name</Label>
				<Input
					id="templateName"
					bind:value={templateName}
					placeholder="Enter template name"
					class="w-full"
				/>
			</div>

			<!-- Size Selection -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">Card Size</Label>
					<!-- Orientation Toggle -->
					<div class="flex items-center space-x-2">
						<RotateCw class="w-4 h-4" />
						<Label for="portrait-toggle" class="text-sm">Portrait</Label>
						<Switch id="portrait-toggle" bind:checked={isPortrait} />
					</div>
				</div>

				<RadioGroup value={selectedSizeType} onValueChange={handleSizeTypeChange}>
					<div class="flex items-center space-x-2">
						<RadioGroupItem value="common" id="common" />
						<Label for="common">Common Sizes</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroupItem value="custom" id="custom" />
						<Label for="custom">Custom Size</Label>
					</div>
				</RadioGroup>

				{#if selectedSizeType === 'common'}
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
						{#each COMMON_CARD_SIZES as size}
							{@const currentSize = isPortrait ? switchOrientation(size) : size}
							{@const pixels = cardSizeToPixels(currentSize)}
							{@const aspectRatio = currentSize.width / currentSize.height}
							<Card
								class="cursor-pointer transition-colors {selectedCommonSize === size
									? 'border-primary bg-primary/5'
									: 'hover:border-primary/50'}"
								onclick={() => handleCommonSizeChange(size)}
							>
								<CardContent class="p-3">
									<!-- Visual Preview -->
									<div class="flex justify-center mb-2">
										<div
											class="border border-border bg-muted"
											style="width: {Math.min(60, 60 * aspectRatio)}px; height: {Math.min(
												60 / aspectRatio,
												60
											)}px;"
										></div>
									</div>
									<div class="text-center">
										<div class="text-sm font-medium">{size.name}</div>
										<div class="text-xs text-muted-foreground">
											{formatDimensions(currentSize, false)}
										</div>
										<div class="text-xs text-muted-foreground">
											{pixels.width}×{pixels.height}px
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else}
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="customName">Custom Size Name</Label>
							<Input
								id="customName"
								bind:value={customSizeName}
								placeholder="Enter custom size name"
								oninput={handleCustomSizeChange}
							/>
						</div>

						<div class="space-y-2">
							<Label for="unit">Unit</Label>
							<select
								id="unit"
								bind:value={customUnit}
								class="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								onchange={handleCustomSizeChange}
							>
								{#each availableUnits as unit}
									<option value={unit.value}>{unit.label}</option>
								{/each}
							</select>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="width">Width ({getUnitSymbol(customUnit)})</Label>
								<Input
									id="width"
									type="number"
									bind:value={customWidth}
									min="0.1"
									max={customUnit === 'pixels' ? '5000' : customUnit === 'mm' ? '600' : '24'}
									step={customUnit === 'pixels' ? '1' : customUnit === 'mm' ? '1' : '0.1'}
									oninput={handleCustomSizeChange}
								/>
							</div>
							<div class="space-y-2">
								<Label for="height">Height ({getUnitSymbol(customUnit)})</Label>
								<Input
									id="height"
									type="number"
									bind:value={customHeight}
									min="0.1"
									max={customUnit === 'pixels' ? '5000' : customUnit === 'mm' ? '600' : '24'}
									step={customUnit === 'pixels' ? '1' : customUnit === 'mm' ? '1' : '0.1'}
									oninput={handleCustomSizeChange}
								/>
							</div>
						</div>

						<!-- Custom Size Preview -->
						<div class="bg-muted p-4 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium">Preview</span>
								<span class="text-xs text-muted-foreground">
									{pixelDimensions.width}×{pixelDimensions.height}px
								</span>
							</div>
							{#snippet customPreview()}
								{@const finalSize = finalCardSize()}
								{@const aspectRatio = finalSize.width / finalSize.height}
								<div class="flex justify-center">
									<div
										class="border-2 border-border bg-background"
										style="width: {Math.min(80, 80 * aspectRatio)}px; height: {Math.min(
											80 / aspectRatio,
											80
										)}px;"
									></div>
								</div>
								<div class="text-center text-xs text-muted-foreground mt-2">
									{formatDimensions(finalSize, false)}
								</div>
							{/snippet}
							{@render customPreview()}
						</div>
					</div>
				{/if}
			</div>

			<!-- Current Selection Summary -->
			<div class="bg-primary/5 border border-primary/20 p-4 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<h4 class="font-semibold">Selected Configuration</h4>
					{#snippet summaryPreview()}
						{@const finalSize = finalCardSize()}
						{@const aspectRatio = finalSize.width / finalSize.height}
						<div class="flex justify-center">
							<div
								class="border border-primary bg-primary/10"
								style="width: {Math.min(40, 40 * aspectRatio)}px; height: {Math.min(
									40 / aspectRatio,
									40
								)}px;"
							></div>
						</div>
					{/snippet}
					{@render summaryPreview()}
				</div>
				<div class="text-sm space-y-1">
					<div><strong>Template:</strong> {templateName || 'Not specified'}</div>
					<div>
						<strong>Size:</strong>
						{formatDimensions(finalCardSize(), false)}
						{isPortrait ? '(Portrait)' : '(Landscape)'}
					</div>
					<div>
						<strong>Image:</strong>
						{pixelDimensions.width} × {pixelDimensions.height} pixels @ {DEFAULT_DPI} DPI
					</div>
				</div>
			</div>

			{#if error}
				<div class="text-sm text-destructive bg-destructive/10 p-3 rounded">
					{error}
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleConfirm}>Create Template</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
