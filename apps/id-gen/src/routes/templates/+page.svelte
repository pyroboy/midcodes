<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import TemplateList from '$lib/components/TemplateList.svelte';
    import TemplateEdit from '$lib/components/TemplateEdit.svelte';
    import { uploadImage } from '$lib/database';
    import { pushState } from '$app/navigation';
    import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';

    // data means get data from server
    let { data } = $props();

    let templates = $state(data.templates); 
   
    let user = $state(data.user);
    let org_id = $state(data.org_id);


    let frontBackground: File | null = null;
    let backBackground: File | null = null;
    let frontPreview: string | null = $state(null);
    let backPreview: string | null = $state(null);
    let errorMessage = $state('');
    let currentTemplate: TemplateData | null = $state(null);
    let frontElements: TemplateElement[] = $state([]);
    let backElements: TemplateElement[] = $state([]);


    // Add view mode state
    let isLoading = $state(false);
    let isEditMode = $state(false);


    async function validateBackgrounds(): Promise<boolean> {
        if ((!frontBackground && !frontPreview) || (!backBackground && !backPreview)) {
            errorMessage = 'Both front and back backgrounds are required. Please ensure both are present.';
            return false;
        }

        if (frontBackground) {
            const frontValid = await validateImage(frontBackground, 'front');
            if (!frontValid) return false;
        }

        if (backBackground) {
            const backValid = await validateImage(backBackground, 'back');
            if (!backValid) return false;
        }
        return true;
    }

    async function validateImage(file: File, side: string): Promise<boolean> {
        try {
            const url = URL.createObjectURL(file);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });

            if (img.width !== 1013 || img.height !== 638) {
                errorMessage = `${side.charAt(0).toUpperCase() + side.slice(1)} background must be exactly 1013x638 pixels.`;
                return false;
            }

            return true;
        } catch {
            errorMessage = `Error validating ${side} background image. Please try again.`;
            return false;
        }
    }

    async function saveTemplate() {
        if (!(await validateBackgrounds())) {
            return;
        }
        try {
            let frontUrl = frontPreview;
            let backUrl = backPreview;

            if (frontBackground) {
                frontUrl = await uploadImage(frontBackground, 'front', user?.id);
                console.log('✅ Front background uploaded:', frontUrl);
            }
            if (backBackground) {
                backUrl = await uploadImage(backBackground, 'back', user?.id);
                console.log('✅ Back background uploaded:', backUrl);
            }

            // Combine front and back elements
            const allElements = [...frontElements, ...backElements];

            // Validate elements
            if (allElements.length === 0) {
                console.error('❌ No template elements found');
                throw new Error('No template elements provided');
            }

            const templateDataToSave: TemplateData = {
                id: currentTemplate?.id || crypto.randomUUID(),
                user_id: user?.id ?? '',
                name: currentTemplate?.name || 'Untitled Template',
                front_background: frontUrl || '',  // Provide default empty string
                back_background: backUrl || '',    // Provide default empty string
                orientation: currentTemplate?.orientation ?? 'landscape',
                template_elements: allElements,  // Use the combined elements
                created_at: currentTemplate?.created_at || new Date().toISOString(),
                org_id: org_id ?? ''
            };

            if (!templateDataToSave.user_id) {
                throw new Error('User ID is required');
            }

            if (!templateDataToSave.org_id) {
                throw new Error('Organization ID is required');
            }

            console.log('💾 Saving to database...');
            
            // Create form data
            const formData = new FormData();
            formData.append('templateData', JSON.stringify(templateDataToSave));

            // Use fetch to call the server action
            const response = await fetch('?/create', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                throw new Error(`Server error: ${errorText}`);
            }

            const result = await response.json();

            if (result.type === 'failure') {
                console.error('❌ Server action failed:', result);
                throw new Error(result.message || 'Failed to save template');
            }

            if (!result.data) {
                console.error('❌ No template data received');
                throw new Error('No template data received');
            }

            console.log('✅ Template saved successfully:', {
                savedData: result.data
            });

            alert('Template saved successfully!');
            window.location.reload();
        } catch (error) {
            console.error('❌ Error saving template:', error);
            errorMessage = `Error saving template: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        }
    }

    async function handleImageUpload(files:File[], side: 'front' | 'back' ) {
        const file = files[0];
        if (side === 'front') {
            frontBackground = file;
            frontPreview = URL.createObjectURL(file);
        } else {
            backBackground = file;
            backPreview = URL.createObjectURL(file);
        }
    }

    function handleRemoveImage( side: 'front' | 'back' ) {
        if (side === 'front') {
            frontBackground = null;
            frontPreview = null;
            frontElements = [];
        } else {
            backBackground = null;
            backPreview = null;
            backElements = [];
        }
    }


    async function handleTemplateSelect( id: string ) {
        try {
            isEditMode = true;
            
            // Push state when entering edit mode
            pushState( `/templates?id=${id}`,{ editing: true });
            
            // Navigate to new URL
            await goto(`/templates?id=${id}`, { replaceState: true });
            
            if (data.selectedTemplate) {
                currentTemplate = data.selectedTemplate;
                frontPreview = data.selectedTemplate.front_background;
                backPreview = data.selectedTemplate.back_background;
                frontElements = (data.selectedTemplate.template_elements as TemplateElement[]).filter(el => el.side === 'front');
                backElements = (data.selectedTemplate.template_elements as TemplateElement[]).filter(el => el.side === 'back');
            }



        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('An unexpected error occurred');
            console.error('❌ EditTemplate: Error:', error);
            errorMessage = error.message;
            isEditMode = false;
        }
    }

    function updateElements( elements: TemplateElement[], side: 'front' | 'back' ) {
        if (side === 'front') {
            frontElements = elements;
        } else {
            backElements = elements;
        }
    }



    function handleBack() {
        isEditMode = false;
        clearForm();
    }

    function clearForm() {
        console.log('🔄 EditTemplate: Clearing form');
        frontBackground = null;
        backBackground = null;
        frontPreview = null;
        backPreview = null;
        frontElements = [];
        backElements = [];
        errorMessage = '';
        currentTemplate = {
            id: '',
            user_id: user?.id ?? '',
            name: '',
            front_background: '',
            back_background: '',
            orientation: 'landscape' as const,
            template_elements: [],
            created_at: new Date().toISOString(),
            org_id: org_id ?? ''
        };
        console.log('✅ EditTemplate: Form cleared');
    }

    onMount(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (isEditMode) {
                handleBack();
                // Push a new state to prevent going back
                history.pushState({ editing: true }, '', window.location.href);
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    });

</script>

<main class="h-full">
    <div class="edit-template-container {isEditMode ? 'edit-mode' : ''}">
        {#if !isEditMode}
            <TemplateList 
                templates={templates??[]} 
                onSelect={(id: string) => handleTemplateSelect(id)} 
            />
        {:else}
            <div class="template-form-container active">
                <div class="back-button-container">
                    <button 
                        onclick={handleBack}
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
                        <TemplateEdit 
                            {isLoading}
                            {frontElements}
                            {backElements}
                            {frontPreview}
                            {backPreview}
                            {errorMessage}
                            onBack={handleBack}
                            onSave={saveTemplate}
                            onClear={clearForm}
                            onUpdateElements={(elements, side) => updateElements(elements, side)}
                            onImageUpload={(files, side) => handleImageUpload(files, side)}
                            onRemoveImage={(side) => handleRemoveImage(side)}
                        />
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    .edit-template-container {
        display: flex;
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;
    }

    .edit-template-container.edit-mode {
        justify-content: center;
    }

    .template-form-container {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
        max-width: 100%;
        transition: all 0.3s ease;
        position: relative;
    }

    .template-form-container.active {
        max-width: 1200px;
        margin: 0 auto;
    }

    .back-button-container {
        position: sticky;
        top: 0;
        left: 0;
        padding: 1rem 0;
        z-index: 10;
    }

    .back-button {
        font-size: 1.125rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .template-content {
        padding-top: 1rem;
    }

    :global(.animate-pulse) {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: .5;
        }
    }
</style>