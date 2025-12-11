<script lang="ts">
	import { onMount } from 'svelte';
	import { assetUploadStore, selectedRegions } from '$lib/stores/assetUploadStore';
	import { getDetectionConfigForSize, type DetectedRegion } from '$lib/schemas/template-assets.schema';
	import { detectCardsInImage } from '$lib/utils/cardDetection';
	import { cn } from '$lib/utils';

	let canvasContainer: HTMLDivElement;
	let imageElement: HTMLImageElement | null = $state(null);
	let imageLoaded = $state(false);
	let displayScale = $state(1);
	let draggingRegion: string | null = $state(null);
	let resizingRegion: { id: string; handle: string } | null = $state(null);
	let dragStart = $state({ x: 0, y: 0 });

	// Run detection when component mounts
	onMount(() => {
		if ($assetUploadStore.uploadedImage && $assetUploadStore.selectedSizePreset) {
			runDetection();
		}
	});

	async function runDetection() {
		if (!$assetUploadStore.uploadedImage || !$assetUploadStore.selectedSizePreset) return;

		assetUploadStore.setProcessing(true);
		assetUploadStore.setError(null);

		try {
			const config = getDetectionConfigForSize($assetUploadStore.selectedSizePreset);
			const regions = await detectCardsInImage($assetUploadStore.uploadedImage, config);

			if (regions.length === 0) {
				assetUploadStore.setError(
					'No cards detected. Try adjusting the image or add regions manually.'
				);
			}

			assetUploadStore.setDetectedRegions(regions);
		} catch (err) {
			console.error('Detection error:', err);
			assetUploadStore.setError('Failed to detect cards. Please try again.');
		} finally {
			assetUploadStore.setProcessing(false);
		}
	}

	function handleImageLoad(e: Event) {
		const img = e.target as HTMLImageElement;
		imageElement = img;
		imageLoaded = true;

		// Calculate display scale to fit in container
		if (canvasContainer) {
			const containerWidth = canvasContainer.clientWidth;
			const containerHeight = 500; // Max height
			const imgAspect = img.naturalWidth / img.naturalHeight;
			const containerAspect = containerWidth / containerHeight;

			if (imgAspect > containerAspect) {
				displayScale = containerWidth / img.naturalWidth;
			} else {
				displayScale = containerHeight / img.naturalHeight;
			}
		}
	}

	function getRegionStyle(region: DetectedRegion): string {
		return `
			left: ${region.x * displayScale}px;
			top: ${region.y * displayScale}px;
			width: ${region.width * displayScale}px;
			height: ${region.height * displayScale}px;
			transform: rotate(${region.rotation}deg);
		`;
	}

	function handleRegionMouseDown(e: MouseEvent, region: DetectedRegion, handle?: string) {
		e.stopPropagation();

		if (handle) {
			resizingRegion = { id: region.id, handle };
		} else {
			draggingRegion = region.id;
		}

		dragStart = { x: e.clientX, y: e.clientY };
	}

	function handleMouseMove(e: MouseEvent) {
		if (!draggingRegion && !resizingRegion) return;

		const dx = (e.clientX - dragStart.x) / displayScale;
		const dy = (e.clientY - dragStart.y) / displayScale;

		if (draggingRegion) {
			const region = $assetUploadStore.detectedRegions.find((r) => r.id === draggingRegion);
			if (region) {
				assetUploadStore.updateRegion(draggingRegion, {
					x: Math.max(0, region.x + dx),
					y: Math.max(0, region.y + dy)
				});
			}
		} else if (resizingRegion) {
			const currentResizing = resizingRegion; // Capture for type narrowing
			const region = $assetUploadStore.detectedRegions.find((r) => r.id === currentResizing.id);
			if (region) {
				const updates: Partial<DetectedRegion> = {};

				switch (currentResizing.handle) {
					case 'se':
						updates.width = Math.max(50, region.width + dx);
						updates.height = Math.max(50, region.height + dy);
						break;
					case 'sw':
						updates.x = region.x + dx;
						updates.width = Math.max(50, region.width - dx);
						updates.height = Math.max(50, region.height + dy);
						break;
					case 'ne':
						updates.y = region.y + dy;
						updates.width = Math.max(50, region.width + dx);
						updates.height = Math.max(50, region.height - dy);
						break;
					case 'nw':
						updates.x = region.x + dx;
						updates.y = region.y + dy;
						updates.width = Math.max(50, region.width - dx);
						updates.height = Math.max(50, region.height - dy);
						break;
				}

				assetUploadStore.updateRegion(resizingRegion.id, updates);
			}
		}

		dragStart = { x: e.clientX, y: e.clientY };
	}

	function handleMouseUp() {
		draggingRegion = null;
		resizingRegion = null;
	}

	function addManualRegion() {
		if (!imageElement) return;

		const preset = $assetUploadStore.selectedSizePreset;
		if (!preset) return;

		// Add region in center of image (default to landscape)
		const newRegion: DetectedRegion = {
			id: `manual-${Date.now()}`,
			x: (imageElement.naturalWidth - preset.width_pixels) / 2,
			y: (imageElement.naturalHeight - preset.height_pixels) / 2,
			width: preset.width_pixels,
			height: preset.height_pixels,
			rotation: 0,
			confidence: 1,
			orientation: 'landscape',
			isManuallyAdjusted: true,
			isSelected: true
		};

		assetUploadStore.addManualRegion(newRegion);
	}

	function getConfidenceColor(confidence: number): string {
		if (confidence >= 0.8) return 'bg-green-500';
		if (confidence >= 0.5) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<!-- Main container with side-by-side layout -->
<div class="flex gap-6 min-h-[500px]">
	<!-- LEFT: A4 Image with Detection Overlays (same position as upload step) -->
	<div class="w-1/2 flex-shrink-0">
		<div class="sticky top-4">
			<!-- Detection canvas -->
			<div
				bind:this={canvasContainer}
				class="relative overflow-hidden rounded-lg border border-border bg-muted/20"
			>
				{#if $assetUploadStore.uploadedImageUrl}
					<!-- Wrapper that matches the displayed image size for proper overlay positioning -->
					<div 
						class="relative mx-auto"
						style="width: {imageElement ? imageElement.naturalWidth * displayScale : 'auto'}px; height: {imageElement ? imageElement.naturalHeight * displayScale : 'auto'}px;"
					>
						<img
							src={$assetUploadStore.uploadedImageUrl}
							alt="Uploaded A4 scan"
							onload={handleImageLoad}
							class="block w-full h-full object-contain"
						/>

						{#if imageLoaded}
							<!-- Region overlays - positioned relative to the wrapper -->
							{#each $assetUploadStore.detectedRegions as region (region.id)}
								<div
									role="button"
									tabindex="0"
									onmousedown={(e) => handleRegionMouseDown(e, region)}
									onkeydown={(e) => e.key === 'Delete' && assetUploadStore.removeRegion(region.id)}
									class={cn(
										'absolute cursor-move border-2 transition-colors',
										region.isSelected
											? 'border-primary bg-primary/10'
											: 'border-muted-foreground/50 bg-muted-foreground/5'
									)}
									style={getRegionStyle(region)}
								>
									<!-- Selection checkbox -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											assetUploadStore.toggleRegionSelection(region.id);
										}}
										class="absolute -left-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded border-2 border-white bg-background shadow"
									>
										{#if region.isSelected}
											<svg class="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										{/if}
									</button>

									<!-- Confidence badge -->
									<div
										class={cn(
											'absolute -right-2 -top-2 z-10 flex h-5 items-center rounded px-1.5 text-[10px] font-medium text-white',
											getConfidenceColor(region.confidence)
										)}
									>
										{(region.confidence * 100).toFixed(0)}%
									</div>

									<!-- Delete button -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											assetUploadStore.removeRegion(region.id);
										}}
										aria-label="Delete region"
										class="absolute -bottom-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow transition-colors hover:bg-destructive/80"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>

									<!-- Orientation toggle button -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											assetUploadStore.toggleOrientation(region.id);
										}}
										aria-label="Toggle orientation"
										title={`Current: ${region.orientation}. Click to toggle.`}
										class="absolute -bottom-2 left-1/2 z-10 flex h-5 -translate-x-1/2 items-center gap-0.5 rounded bg-blue-500 px-1.5 text-[10px] font-medium text-white shadow transition-colors hover:bg-blue-600"
									>
										{#if region.orientation === 'landscape'}
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
											</svg>
											<span>L</span>
										{:else}
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
											</svg>
											<span>P</span>
										{/if}
									</button>

									<!-- Resize handles -->
									{#each ['nw', 'ne', 'sw', 'se'] as handle}
										<div
											role="button"
											tabindex="0"
											onmousedown={(e) => handleRegionMouseDown(e, region, handle)}
											onkeydown={() => {}}
											class={cn(
												'absolute h-3 w-3 rounded-full border-2 border-white bg-primary shadow',
												handle === 'nw' && '-left-1.5 -top-1.5 cursor-nw-resize',
												handle === 'ne' && '-right-1.5 -top-1.5 cursor-ne-resize',
												handle === 'sw' && '-bottom-1.5 -left-1.5 cursor-sw-resize',
												handle === 'se' && '-bottom-1.5 -right-1.5 cursor-se-resize'
											)}
										></div>
									{/each}

									<!-- Manual indicator -->
									{#if region.isManuallyAdjusted}
										<div class="absolute bottom-1 left-1 rounded bg-yellow-500 px-1 py-0.5 text-[8px] font-medium text-white">
											Manual
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<!-- Processing indicator -->
			{#if $assetUploadStore.isProcessing}
				<div class="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					Detecting cards...
				</div>
			{/if}
		</div>
	</div>

	<!-- RIGHT: Detection Controls and Region List -->
	<div class="w-1/2 space-y-4">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-semibold text-foreground">Detected Cards</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Review and adjust the detected card regions
				</p>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={runDetection}
				disabled={$assetUploadStore.isProcessing}
				class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
			>
				{#if $assetUploadStore.isProcessing}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					Detecting...
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Re-detect
				{/if}
			</button>

			<button
				type="button"
				onclick={addManualRegion}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add Region
			</button>
		</div>

		<!-- Selection controls -->
		<div class="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
			<span class="text-sm font-medium text-foreground">
				{$selectedRegions.length} of {$assetUploadStore.detectedRegions.length} selected
			</span>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => assetUploadStore.selectAllRegions()}
					class="text-xs text-primary hover:underline"
				>
					Select all
				</button>
				<button
					type="button"
					onclick={() => assetUploadStore.deselectAllRegions()}
					class="text-xs text-muted-foreground hover:underline"
				>
					Deselect all
				</button>
			</div>
		</div>

		<!-- Empty state -->
		{#if $assetUploadStore.detectedRegions.length === 0 && !$assetUploadStore.isProcessing}
			<div class="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
				<p class="text-sm text-muted-foreground">
					No regions detected. Click "Add Region" to manually define card areas.
				</p>
			</div>
		{/if}

		<!-- Region cards list (vertical scrollable) -->
		{#if $assetUploadStore.detectedRegions.length > 0}
			<div class="space-y-2 max-h-[400px] overflow-y-auto pr-2">
				{#each $assetUploadStore.detectedRegions as region, index (region.id)}
					<div
						class={cn(
							'flex items-center gap-3 rounded-lg border-2 p-3 transition-colors',
							region.isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30 opacity-60'
						)}
					>
						<!-- Thumbnail -->
						<div class="relative w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
							<div class="aspect-[1.6/1]">
								{#if $assetUploadStore.uploadedImageUrl && imageElement}
									<canvas
										class="h-full w-full"
										width={region.width}
										height={region.height}
										use:cropCanvas={{
											imageUrl: $assetUploadStore.uploadedImageUrl,
											region
										}}
									></canvas>
								{/if}
							</div>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-medium text-foreground text-sm">Card {index + 1}</span>
								<span
									class={cn(
										'rounded px-1.5 py-0.5 text-[10px] font-medium text-white',
										getConfidenceColor(region.confidence)
									)}
								>
									{(region.confidence * 100).toFixed(0)}%
								</span>
								{#if region.isManuallyAdjusted}
									<span class="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
										Manual
									</span>
								{/if}
							</div>
							<div class="text-xs text-muted-foreground mt-1">
								{region.width} × {region.height}px • {region.orientation}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => assetUploadStore.toggleRegionSelection(region.id)}
								class={cn(
									'p-1.5 rounded transition-colors',
									region.isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
								)}
								aria-label={region.isSelected ? 'Deselect' : 'Select'}
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{#if region.isSelected}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									{:else}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									{/if}
								</svg>
							</button>
							<button
								type="button"
								onclick={() => assetUploadStore.removeRegion(region.id)}
								class="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
								aria-label="Delete"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<script lang="ts" module>
	// Svelte action to render cropped region preview
	// Note: DetectedRegion type is imported in the main script block
	// Svelte action to render cropped region preview
	function cropCanvas(
		canvas: HTMLCanvasElement,
		options: { imageUrl: string; region: DetectedRegion }
	) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.onload = () => {
			ctx.drawImage(
				img,
				options.region.x,
				options.region.y,
				options.region.width,
				options.region.height,
				0,
				0,
				canvas.width,
				canvas.height
			);
		};
		img.src = options.imageUrl;

		return {
			update(newOptions: { imageUrl: string; region: DetectedRegion }) {
				img.onload = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(
						img,
						newOptions.region.x,
						newOptions.region.y,
						newOptions.region.width,
						newOptions.region.height,
						0,
						0,
						canvas.width,
						canvas.height
					);
				};
				if (img.complete) {
					img.onload(new Event('load'));
				}
			}
		};
	}
</script>
