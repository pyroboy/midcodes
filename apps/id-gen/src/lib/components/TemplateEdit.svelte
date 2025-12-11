<script lang="ts">
	import type { TemplateElement } from '$lib/types/types';
	import TemplateForm from './TemplateForm.svelte';

	let {
		isLoading = false,
		frontElements = [],
		backElements = [],
		frontPreview = null,
		backPreview = null,
		errorMessage = '',
		onBack,
		onSave,
		onClear,
		onUpdateElements,
		onImageUpload,
		onRemoveImage,
		cardSize = null,
		pixelDimensions = null,
		onUpdateBackgroundPosition = () => {},
		version = 0
	}: {
		isLoading?: boolean;
		frontElements?: TemplateElement[];
		backElements?: TemplateElement[];
		frontPreview?: string | null;
		backPreview?: string | null;
		errorMessage?: string;
		onBack: () => void;
		onSave: () => void;
		onClear: () => void;
		onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
		onImageUpload: (files: File[], side: 'front' | 'back') => void;
		onRemoveImage: (side: 'front' | 'back') => void;
		cardSize?: any;
		pixelDimensions?: { width: number; height: number } | null;
		onUpdateBackgroundPosition?: (
			position: { x: number; y: number; scale: number },
			side: 'front' | 'back'
		) => void;
		version?: number;
	} = $props();

	// Background position state
	let frontBackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
	let backBackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
</script>

<div class="template-form-container active">
	<div class="template-content">
		<h1 class="text-2xl font-bold mb-2">Edit Template</h1>

		{#if cardSize && pixelDimensions}
			<div class="mb-6 p-3 bg-muted/50 rounded-lg border">
				<div class="text-sm text-muted-foreground">
					<strong class="text-foreground">Card Size:</strong>
					{#if cardSize.unit}
						{cardSize.width}{cardSize.unit === 'inches'
							? '"'
							: cardSize.unit === 'mm'
								? 'mm'
								: cardSize.unit === 'cm'
									? 'cm'
									: 'px'} × {cardSize.height}{cardSize.unit === 'inches'
							? '"'
							: cardSize.unit === 'mm'
								? 'mm'
								: cardSize.unit === 'cm'
									? 'cm'
									: 'px'}
					{:else}
						{cardSize.widthInches || cardSize.width}" × {cardSize.heightInches || cardSize.height}"
					{/if}
					<span class="ml-2 text-xs">
						({pixelDimensions.width}px × {pixelDimensions.height}px at 300 DPI)
					</span>
				</div>
			</div>
		{/if}

		{#if isLoading}
			<div class="animate-pulse space-y-8">
				<!-- Skeleton for front template form -->
				<div class="space-y-4">
					<div class="h-8 bg-muted rounded w-1/4"></div>
					<div class="h-64 bg-muted rounded"></div>
					<div class="space-y-2">
						<div class="h-4 bg-muted rounded w-1/3"></div>
						<div class="h-4 bg-muted rounded w-1/4"></div>
					</div>
				</div>

				<!-- Skeleton for back template form -->
				<div class="space-y-4">
					<div class="h-8 bg-muted rounded w-1/4"></div>
					<div class="h-64 bg-muted rounded"></div>
					<div class="space-y-2">
						<div class="h-4 bg-muted rounded w-1/3"></div>
						<div class="h-4 bg-muted rounded w-1/4"></div>
					</div>
				</div>
			</div>
		{:else}
			<div class="template-form">
				{#key `front-${version}`}
					<TemplateForm
						side="front"
						elements={frontElements}
						preview={frontPreview}
						{cardSize}
						{pixelDimensions}
						bind:backgroundPosition={frontBackgroundPosition}
						onUpdateElements={(elements: TemplateElement[], side: 'front' | 'back') =>
							onUpdateElements(elements, side)}
						onImageUpload={(files: File[], side: 'front' | 'back') => onImageUpload(files, side)}
						onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
						{onUpdateBackgroundPosition}
						{version}
					/>
				{/key}
			</div>
			<div class="template-form">
				{#key `back-${version}`}
					<TemplateForm
						side="back"
						elements={backElements}
						preview={backPreview}
						{cardSize}
						{pixelDimensions}
						bind:backgroundPosition={backBackgroundPosition}
						onUpdateElements={(elements: TemplateElement[], side: 'front' | 'back') =>
							onUpdateElements(elements, side)}
						onImageUpload={(files: File[], side: 'front' | 'back') => onImageUpload(files, side)}
						onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
						{onUpdateBackgroundPosition}
					/>
				{/key}
			</div>

			{#if errorMessage}
				<p class="mt-4 text-sm text-red-600">{errorMessage}</p>
			{/if}

			<div class="mt-6 flex gap-4">
				<button
					onclick={onSave}
					class="inline-flex justify-center rounded-md border-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
				>
					Save Template
				</button>
				<button
					onclick={onClear}
					class="inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					Clear Form
				</button>
			</div>
		{/if}
	</div>
</div>
