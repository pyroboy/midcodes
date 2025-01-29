<script lang="ts">
    import type { TemplateElement } from '$lib/types/types';
    import TemplateForm from './TemplateForm.svelte';

    export let isLoading = false;
    export let frontElements: TemplateElement[] = [];
    export let backElements: TemplateElement[] = [];
    export let frontPreview: string | null = null;
    export let backPreview: string | null = null;
    export let errorMessage: string = '';

    export let onBack: () => void;
    export let onSave: () => void;
    export let onClear: () => void;
    export let onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
    export let onImageUpload: (files: File[], side: 'front' | 'back') => void;
    export let onRemoveImage: (side: 'front' | 'back') => void;
</script>

<div class="template-form-container active">
    <div class="back-button-container">
        <button 
            on:click={onBack}
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
        <h1 class="text-2xl font-bold mb-6">Edit Template</h1>

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
                    onUpdateElements={(elements:TemplateElement[], side: 'front' | 'back') => onUpdateElements(elements, side)}
                    onImageUpload={(files:File[],side: 'front' | 'back') => onImageUpload(files, side)}
                    onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
                />
            </div>
            <div class="template-form">
                <TemplateForm
                    side="back"
                    elements={backElements}
                    preview={backPreview}
                    onUpdateElements={(elements:TemplateElement[], side: 'front' | 'back') => onUpdateElements(elements, side)}
                    onImageUpload={(files:File[],side: 'front' | 'back') => onImageUpload(files, side)}
                    onRemoveImage={(side: 'front' | 'back') => onRemoveImage(side)}
                />
            </div>

            {#if errorMessage}
                <p class="mt-4 text-sm text-red-600">{errorMessage}</p>
            {/if}

            <div class="mt-6 flex gap-4">
                <button 
                    on:click={onSave}
                    class="inline-flex justify-center rounded-md border-0 bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 dark:focus:ring-blue-400 transition-colors duration-200 dark:shadow-blue-900/30"
                >
                    Save Template
                </button>
                <button 
                    on:click={onClear}
                    class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    Clear Form
                </button>
            </div>
        {/if}
    </div>
</div>
