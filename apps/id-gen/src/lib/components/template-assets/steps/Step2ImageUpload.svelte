<script lang="ts">
	import { assetUploadStore } from '$lib/stores/assetUploadStore';
	import type { SampleType } from '$lib/schemas/template-assets.schema';
	import { A4_DIMENSIONS } from '$lib/schemas/template-assets.schema';
	import { validateImageUpload } from '$lib/utils/fileValidation';
	import { cn } from '$lib/utils';

	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement>();

	const sampleTypes: { value: SampleType; label: string; description: string }[] = [
		{
			value: 'data_filled',
			label: 'Data Filled Sample',
			description: 'Template with example text and photos filled in'
		},
		{
			value: 'blank_template',
			label: 'Blank Template',
			description: 'Empty template with placeholders only'
		}
	];

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const file = e.dataTransfer?.files[0];
		if (file) {
			processFile(file);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	function processFile(file: File) {
		const validation = validateImageUpload(file);
		if (!validation.valid) {
			assetUploadStore.setError(validation.error || 'Invalid file');
			return;
		}

		// Create object URL for preview
		const url = URL.createObjectURL(file);

		// Default to data_filled if not already set
		const sampleType = $assetUploadStore.sampleType || 'data_filled';

		assetUploadStore.setUploadedImage(file, url, sampleType);
	}

	function handleSampleTypeChange(type: SampleType) {
		assetUploadStore.setSampleType(type);
	}

	function handleRemoveImage() {
		assetUploadStore.clearUploadedImage();
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<!-- Main container with side-by-side layout -->
<div class="flex gap-6 min-h-[500px]">
	<!-- LEFT: A4 Preview Area (fixed width) -->
	<div class="w-1/2 flex-shrink-0">
		<div class="sticky top-4">
			{#if $assetUploadStore.uploadedImage}
				<!-- Image Preview -->
				<div class="relative overflow-hidden rounded-lg border border-border bg-muted/20">
					<img
						src={$assetUploadStore.uploadedImageUrl}
						alt="Uploaded A4 scan"
						class="mx-auto max-h-[500px] w-auto object-contain"
					/>

					<!-- Remove button -->
					<button
						type="button"
						onclick={handleRemoveImage}
						aria-label="Remove image"
						class="absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-destructive-foreground transition-colors hover:bg-destructive"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- File info -->
				<div class="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<span class="text-sm font-medium text-foreground truncate max-w-[200px]">
							{$assetUploadStore.uploadedImage.name}
						</span>
					</div>
					<span class="text-sm text-muted-foreground">
						{formatFileSize($assetUploadStore.uploadedImage.size)}
					</span>
				</div>
			{:else}
				<!-- Empty state / Drop zone -->
				<div
					role="button"
					tabindex="0"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					onclick={() => fileInput?.click()}
					onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
					class={cn(
						'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors min-h-[400px]',
						isDragging
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
					)}
				>
					<svg
						class="mb-4 h-16 w-16 text-muted-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>

					<p class="mb-1 text-sm font-medium text-foreground">
						Drop your A4 scan here
					</p>
					<p class="text-xs text-muted-foreground">or click to browse</p>
					<p class="mt-2 text-xs text-muted-foreground/70">
						PNG or JPG, max 10MB
					</p>
				</div>

				<input
					bind:this={fileInput}
					type="file"
					accept="image/png,image/jpeg,image/jpg"
					onchange={handleFileSelect}
					class="hidden"
				/>
			{/if}
		</div>
	</div>

	<!-- RIGHT: Controls and Info -->
	<div class="w-1/2 space-y-6">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Upload A4 Document</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Upload a scanned A4 image containing ID card samples
			</p>
		</div>

		<!-- Sample Type Selection -->
		<div class="space-y-3" role="group" aria-labelledby="sample-type-label">
			<span id="sample-type-label" class="text-sm font-medium text-foreground">Sample Type</span>
			<div class="grid grid-cols-1 gap-3">
				{#each sampleTypes as type (type.value)}
					{@const isSelected = $assetUploadStore.sampleType === type.value}
					<button
						type="button"
						onclick={() => handleSampleTypeChange(type.value)}
						class={cn(
							'flex flex-col rounded-lg border-2 p-4 text-left transition-all',
							isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
						)}
					>
						<div class="flex items-center gap-2">
							<div
								class={cn(
									'h-4 w-4 rounded-full border-2 transition-colors',
									isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50'
								)}
							>
								{#if isSelected}
									<div class="flex h-full w-full items-center justify-center">
										<div class="h-1.5 w-1.5 rounded-full bg-primary-foreground"></div>
									</div>
								{/if}
							</div>
							<span class="font-medium text-foreground">{type.label}</span>
						</div>
						<p class="mt-1 pl-6 text-xs text-muted-foreground">{type.description}</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- Size preset reminder -->
		{#if $assetUploadStore.selectedSizePreset}
			<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
				<div class="flex items-center gap-2">
					<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-sm text-blue-700 dark:text-blue-300">
						Detecting <strong>{$assetUploadStore.selectedSizePreset.name}</strong> sized cards
						({$assetUploadStore.selectedSizePreset.width_inches}" × {$assetUploadStore.selectedSizePreset.height_inches}")
					</span>
				</div>
			</div>
		{/if}

		<!-- Recommended dimensions -->
		<div class="rounded-lg border border-border bg-muted/30 p-4">
			<h4 class="text-sm font-medium text-foreground mb-2">Recommended Specifications</h4>
			<ul class="text-xs text-muted-foreground space-y-1">
				<li>• Resolution: {A4_DIMENSIONS.width} × {A4_DIMENSIONS.height} pixels</li>
				<li>• DPI: {A4_DIMENSIONS.dpi}</li>
				<li>• Format: PNG or JPG</li>
				<li>• Max size: 10MB</li>
			</ul>
		</div>
	</div>
</div>
