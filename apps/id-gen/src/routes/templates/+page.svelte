<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import TemplateList from '$lib/components/TemplateList.svelte';
    import TemplateEdit from '$lib/components/TemplateEdit.svelte';
    import { uploadImage } from '$lib/database';
    import { pushState } from '$app/navigation';
    import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';
    import type { CardSize } from '$lib/utils/sizeConversion';
    import { cardSizeToPixels, DEFAULT_DPI } from '$lib/utils/sizeConversion';

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

    // Current template size info
    let currentCardSize: CardSize | null = $state(null);
    let requiredPixelDimensions: { width: number; height: number } | null = $state(null);

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

            // Use dynamic dimensions if available, otherwise fall back to legacy size
            const expectedWidth = requiredPixelDimensions?.width || 1013;
            const expectedHeight = requiredPixelDimensions?.height || 638;

            if (img.width !== expectedWidth || img.height !== expectedHeight) {
                const sizeInfo = currentCardSize 
                    ? `${currentCardSize.widthInches}" × ${currentCardSize.heightInches}" (${expectedWidth}px × ${expectedHeight}px)`
                    : `${expectedWidth}px × ${expectedHeight}px`;
                errorMessage = `${side.charAt(0).toUpperCase() + side.slice(1)} background must be exactly ${sizeInfo}.`;
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
                
                // Set size data for existing template
                if (data.selectedTemplate.width_pixels && data.selectedTemplate.height_pixels) {
                    // Template has new size fields
                    currentCardSize = {
                        name: data.selectedTemplate.name,
                        width: data.selectedTemplate.unit_width || data.selectedTemplate.width_pixels,
                        height: data.selectedTemplate.unit_height || data.selectedTemplate.height_pixels,
                        unit: (data.selectedTemplate.unit_type as any) || 'pixels'
                    };
                    requiredPixelDimensions = {
                        width: data.selectedTemplate.width_pixels,
                        height: data.selectedTemplate.height_pixels
                    };
                } else {
                    // Legacy template - use hardcoded dimensions
                    currentCardSize = {
                        name: 'Legacy Template',
                        width: 1013,
                        height: 638,
                        unit: 'pixels' as const
                    };
                    requiredPixelDimensions = {
                        width: 1013,
                        height: 638
                    };
                }
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

    function handleCreateNewTemplate(cardSize: CardSize, templateName: string) {
        // Set up new template creation
        currentCardSize = cardSize;
        requiredPixelDimensions = cardSizeToPixels(cardSize, DEFAULT_DPI);
        
        // Create new template with card size information
        currentTemplate = {
            id: crypto.randomUUID(),
            user_id: user?.id ?? '',
            name: templateName,
            front_background: '',
            back_background: '',
            orientation: cardSize.widthInches >= cardSize.heightInches ? 'landscape' : 'portrait',
            template_elements: [],
            created_at: new Date().toISOString(),
            org_id: org_id ?? '',
            // Add size information for new templates
            width_inches: cardSize.widthInches,
            height_inches: cardSize.heightInches,
            dpi: DEFAULT_DPI
        };

        // Clear existing data
        frontBackground = null;
        backBackground = null;
        frontPreview = null;
        backPreview = null;
        frontElements = [];
        backElements = [];
        errorMessage = '';

        // Enter edit mode
        isEditMode = true;
        
        console.log('✅ New template created:', {
            name: templateName,
            cardSize: cardSize,
            pixelDimensions: requiredPixelDimensions
        });
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
                onCreateNew={handleCreateNewTemplate}
            />
        {:else}
            <TemplateEdit 
                {isLoading}
                {frontElements}
                {backElements}
                {frontPreview}
                {backPreview}
                {errorMessage}
                cardSize={currentCardSize}
                pixelDimensions={requiredPixelDimensions}
                onBack={handleBack}
                onSave={saveTemplate}
                onClear={clearForm}
                onUpdateElements={(elements, side) => updateElements(elements, side)}
                onImageUpload={(files, side) => handleImageUpload(files, side)}
                onRemoveImage={(side) => handleRemoveImage(side)}
            />
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