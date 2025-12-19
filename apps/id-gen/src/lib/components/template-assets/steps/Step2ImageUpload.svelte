<script lang="ts">
	import { assetUploadStore } from '$lib/stores/assetUploadStore';
	import type { SampleType } from '$lib/schemas/template-assets.schema';
	import { A4_DIMENSIONS } from '$lib/schemas/template-assets.schema';
	import { validateImageUpload } from '$lib/utils/fileValidation';
	import { cn } from '$lib/utils';

	// Independent states for drag behavior
	let isDraggingFront = $state(false);
	let isDraggingBack = $state(false);
	
	let frontInput = $state<HTMLInputElement>();
	let backInput = $state<HTMLInputElement>();

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

	function handleDragOver(e: DragEvent, side: 'front' | 'back') {
		e.preventDefault();
		if (side === 'front') isDraggingFront = true;
		else isDraggingBack = true;
	}

	function handleDragLeave(e: DragEvent, side: 'front' | 'back') {
		e.preventDefault();
		if (side === 'front') isDraggingFront = false;
		else isDraggingBack = false;
	}

	function handleDrop(e: DragEvent, side: 'front' | 'back') {
		e.preventDefault();
		if (side === 'front') isDraggingFront = false;
		else isDraggingBack = false;

		const file = e.dataTransfer?.files[0];
		if (file) {
			processFile(file, side);
		}
	}

	function handleFileSelect(e: Event, side: 'front' | 'back') {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file, side);
		}
	}

	function processFile(file: File, side: 'front' | 'back') {
		const validation = validateImageUpload(file);
		if (!validation.valid) {
			assetUploadStore.setError(validation.error || 'Invalid file');
			return;
		}

		// Create object URL for preview
		const url = URL.createObjectURL(file);
		
		if (side === 'front') {
			assetUploadStore.setFrontImage(file, url);
		} else {
			assetUploadStore.setBackImage(file, url);
		}

		// Default to data_filled if not already set (one time init)
		if (!$assetUploadStore.sampleType) {
			assetUploadStore.setSampleType('data_filled');
		}
	}

	function handleSampleTypeChange(type: SampleType) {
		assetUploadStore.setSampleType(type);
	}

	function handleRemoveImage(side: 'front' | 'back') {
		if (side === 'front') {
			assetUploadStore.clearFrontImage();
			if (frontInput) frontInput.value = '';
		} else {
			assetUploadStore.clearBackImage();
			if (backInput) backInput.value = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="space-y-6 min-h-[500px]">
	
	<!-- Header & Controls -->
	<div class="flex items-start justify-between">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Upload Scans</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Upload scanned A4 pages. Upload both Front and Back scans to create paired templates.
			</p>
		</div>
		
		<!-- Sample Type Selection (Compact) -->
		<div class="flex gap-2">
			{#each sampleTypes as type (type.value)}
				{@const isSelected = $assetUploadStore.sampleType === type.value}
				<button
					type="button"
					onclick={() => handleSampleTypeChange(type.value)}
					class={cn(
						'px-3 py-1.5 text-xs font-medium rounded-md border transition-all',
						isSelected 
							? 'bg-primary text-primary-foreground border-primary' 
							: 'bg-background text-muted-foreground border-border hover:border-primary/50'
					)}
				>
					{type.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Dual Upload Area -->
	<div class="grid grid-cols-2 gap-6">
		<!-- FRONT -->
		<div class="space-y-2">
			<span class="text-sm font-semibold text-foreground flex items-center gap-2">
				<span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">A</span> Front Page
			</span>
			
			{#if $assetUploadStore.frontImage}
				<div class="relative overflow-hidden rounded-lg border border-border bg-muted/20 aspect-[1/1.414]">
					<img
						src={$assetUploadStore.frontImageUrl}
						alt="Front scan"
						class="w-full h-full object-contain"
					/>
					<button
						type="button"
						aria-label="Remove front image"
						onclick={() => handleRemoveImage('front')}
						class="absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-destructive-foreground hover:bg-destructive"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<div class="absolute bottom-0 left-0 right-0 bg-black/50 p-2 backdrop-blur-sm">
						<p class="text-xs text-white truncate text-center">{$assetUploadStore.frontImage.name}</p>
					</div>
				</div>
			{:else}
				<div
					role="button"
					tabindex="0"
					ondragover={(e) => handleDragOver(e, 'front')}
					ondragleave={(e) => handleDragLeave(e, 'front')}
					ondrop={(e) => handleDrop(e, 'front')}
					onclick={() => frontInput?.click()}
					onkeydown={(e) => e.key === 'Enter' && frontInput?.click()}
					class={cn(
						'flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors aspect-[1/1.414]',
						isDraggingFront
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
					)}
				>
					<svg class="mb-2 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p class="text-sm font-medium text-foreground">Upload Front</p>
					<input bind:this={frontInput} type="file" accept="image/png,image/jpeg,image/jpg" onchange={(e) => handleFileSelect(e, 'front')} class="hidden" />
				</div>
			{/if}
		</div>

		<!-- BACK -->
		<div class="space-y-2">
			<span class="text-sm font-semibold text-foreground flex items-center gap-2">
				<span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">B</span> Back Page
			</span>
			
			{#if $assetUploadStore.backImage}
				<div class="relative overflow-hidden rounded-lg border border-border bg-muted/20 aspect-[1/1.414]">
					<img
						src={$assetUploadStore.backImageUrl}
						alt="Back scan"
						class="w-full h-full object-contain"
					/>
					<button
						type="button"
						aria-label="Remove back image"
						onclick={() => handleRemoveImage('back')}
						class="absolute right-2 top-2 rounded-full bg-destructive/90 p-1.5 text-destructive-foreground hover:bg-destructive"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<div class="absolute bottom-0 left-0 right-0 bg-black/50 p-2 backdrop-blur-sm">
						<p class="text-xs text-white truncate text-center">{$assetUploadStore.backImage.name}</p>
					</div>
				</div>
			{:else}
				<div
					role="button"
					tabindex="0"
					ondragover={(e) => handleDragOver(e, 'back')}
					ondragleave={(e) => handleDragLeave(e, 'back')}
					ondrop={(e) => handleDrop(e, 'back')}
					onclick={() => backInput?.click()}
					onkeydown={(e) => e.key === 'Enter' && backInput?.click()}
					class={cn(
						'flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors aspect-[1/1.414]',
						isDraggingBack
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
					)}
				>
					<svg class="mb-2 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p class="text-sm font-medium text-foreground">Upload Back</p>
					<input bind:this={backInput} type="file" accept="image/png,image/jpeg,image/jpg" onchange={(e) => handleFileSelect(e, 'back')} class="hidden" />
				</div>
			{/if}
		</div>
	</div>

	<!-- Info Footer -->
	{#if $assetUploadStore.selectedSizePreset}
		<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex justify-between items-center">
			<div class="flex items-center gap-2">
				<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span class="text-sm text-blue-700 dark:text-blue-300">
					Detecting <strong>{$assetUploadStore.selectedSizePreset.name}</strong> sized cards
				</span>
			</div>
			<span class="text-xs text-muted-foreground">
				Format: PNG/JPG • Max: 10MB
			</span>
		</div>
	{/if}
</div>
