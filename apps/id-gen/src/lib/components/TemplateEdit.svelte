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
        onUpdateBackgroundPosition = () => {}
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
        onUpdateBackgroundPosition?: (position: {x: number, y: number, scale: number}, side: 'front' | 'back') => void;
    } = $props();
    
    // Background position state
    let frontBackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
    let backBackgroundPosition = $state({ x: 0, y: 0, scale: 1 });
</script>

<div class="template-form-container active">
    <div class="back-button-container">
        <button 
            onclick={onBack}
            class="back-button inline-flex items-center text-lg dark:text-gray-300 text-gray-700 hover:text-primary dark:hover:text-primary-400"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                class="w-6 h-6 mr-2"
                stroke-width="2.5" 
                stroke-linecap="round" 
                stroke-linejoin="round"
            >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
        </button>
    </div>

    <div class="template-content">
        <h1 class="text-2xl font-bold mb-2">Edit Template</h1>
        
        {#if cardSize && pixelDimensions}
            <div class="mb-6 p-3 bg-muted/50 rounded-lg border">
                <div class="text-sm text-muted-foreground">
                    <strong class="text-foreground">Card Size:</strong> 
                    {#if cardSize.unit}
                        {cardSize.width}{cardSize.unit === 'inches' ? '"' : cardSize.unit === 'mm' ? 'mm' : cardSize.unit === 'cm' ? 'cm' : 'px'} × {cardSize.height}{cardSize.unit === 'inches' ? '"' : cardSize.unit === 'mm' ? 'mm' : cardSize.unit === 'cm' ? 'cm' : 'px'}
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
                    <div class="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div class="h-64 bg-gray-200 rounded"></div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>

                <!-- Skeleton for back template form -->
                <div class="space-y-4">
                    <div class="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div class="h-64 bg-gray-200 rounded"></div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="template-form">
                <TemplateForm
                    side="front"
                    elements={frontElements}
                    preview={frontPreview}
                    cardSize={cardSize}
                    pixelDimensions={pixelDimensions}
                    bind:backgroundPosition={frontBackgroundPosition}
                    onUpdateElements={(elements:TemplateElement[], side: 'front' | 'back') => onUpdateElements(elements, side)}
                    onImageUpload={(files:File[],side: 'front' | 'back') => onImageUpload(files, side)}
                    onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
                    onUpdateBackgroundPosition={onUpdateBackgroundPosition}
                />
            </div>
            <div class="template-form">
                <TemplateForm
                    side="back"
                    elements={backElements}
                    preview={backPreview}
                    cardSize={cardSize}
                    pixelDimensions={pixelDimensions}
                    bind:backgroundPosition={backBackgroundPosition}
                    onUpdateElements={(elements:TemplateElement[], side: 'front' | 'back') => onUpdateElements(elements, side)}
                    onImageUpload={(files:File[],side: 'front' | 'back') => onImageUpload(files, side)}
                    onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
                    onUpdateBackgroundPosition={onUpdateBackgroundPosition}
                />
            </div>

            {#if errorMessage}
                <p class="mt-4 text-sm text-red-600">{errorMessage}</p>
            {/if}

            <div class="mt-6 flex gap-4">
                <button 
                    onclick={onSave}
                    class="inline-flex justify-center rounded-md border-0 bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 dark:focus:ring-blue-400 transition-colors duration-200 dark:shadow-blue-900/30"
                >
                    Save Template
                </button>
                <button 
                    onclick={onClear}
                    class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    Clear Form
                </button>
            </div>
        {/if}
    </div>
</div>
