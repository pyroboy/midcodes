<script lang="ts">
    import { run } from 'svelte/legacy';

    import { onMount } from 'svelte';
    import type { UserProfile } from '$lib/stores/auth';
    import TemplateForm from '$lib/components/TemplateForm.svelte';
    import TemplateList from '$lib/components/TemplateList.svelte';
    import { uploadImage } from '$lib/database';
    import { templateData } from '$lib/stores/templateStore';
    import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';
    import { auth, session, profile } from '$lib/stores/auth';

    
    interface Props {
        // Add data prop from server
        data: {
        templates: TemplateData[],
        user: UserProfile
    };
    }

    let { data }: Props = $props();

    let frontBackground: File | null = null;
    let backBackground: File | null = null;
    let frontPreview: string | null = $state(null);
    let backPreview: string | null = $state(null);
    let errorMessage = $state('');

    let frontElements: TemplateElement[] = $state([]);
    let backElements: TemplateElement[] = $state([]);

    // Add view mode state
    let isLoading = $state(false);
    let isEditMode = $state(false);

    onMount(async () => {
        if (!$session) {
            window.location.href = '/login';
        }
    });

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
        console.log('📝 Starting template save...', {
            frontElementsCount: frontElements.length,
            backElementsCount: backElements.length,
            authStatus: {
                hasSession: !!$session,
                hasUser: !!$profile,
                userId: $profile?.id
            }
        });

        if (!$session || !$profile) {
            console.error('❌ Auth check failed:', { session: !!$session, user: !!$profile });
            errorMessage = 'User is not authenticated.';
            return;
        }

        if (!(await validateBackgrounds())) {
            console.error('❌ Background validation failed');
            return;
        }

        try {
            let frontUrl = frontPreview;
            let backUrl = backPreview;

            console.log('🖼️ Processing backgrounds:', {
                hasFrontBackground: !!frontBackground,
                hasBackBackground: !!backBackground,
                currentFrontUrl: frontUrl,
                currentBackUrl: backUrl
            });

            if (frontBackground) {
                frontUrl = await uploadImage(frontBackground, 'front', $profile.id);
                console.log('✅ Front background uploaded:', frontUrl);
            }
            if (backBackground) {
                backUrl = await uploadImage(backBackground, 'back', $profile.id);
                console.log('✅ Back background uploaded:', backUrl);
            }

            const templateDataToSave: TemplateData = {
                id: $templateData.id || crypto.randomUUID(),
                user_id: $profile?.id ?? '',
                name: $templateData.name,
                front_background: $templateData.front_background,
                back_background: $templateData.back_background,
                orientation: $templateData.orientation,
                template_elements: $templateData.template_elements,
                created_at: $templateData.created_at || new Date().toISOString(),
                org_id: $profile?.org_id ?? ''
            };

            console.log('📋 Template data to save:', {
                id: templateDataToSave.id,
                name: templateDataToSave.name,
                userId: templateDataToSave.user_id,
                elementsCount: templateDataToSave.template_elements.length,
                frontElements: frontElements.map(el => ({ type: el.type, name: el.variableName })),
                backElements: backElements.map(el => ({ type: el.type, name: el.variableName }))
            });

            if (templateDataToSave.template_elements.length === 0) {
                console.error('❌ No template elements found');
                throw new Error('No template elements provided');
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

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ Server action failed:', result);
                throw new Error(result.message || 'Failed to save template');
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

    async function handleImageUpload(data: { event: Event, side: 'front' | 'back' }) {
        const { event, side } = data;
        const target = event.target as HTMLInputElement;
        if (!target.files?.length) return;

        const file = target.files[0];
        if (side === 'front') {
            frontBackground = file;
            frontPreview = URL.createObjectURL(file);
        } else {
            backBackground = file;
            backPreview = URL.createObjectURL(file);
        }

        errorMessage = '';
    }

    function handleRemoveImage(data: { side: 'front' | 'back' }) {
        const { side } = data;
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

    function updateElements(event: CustomEvent<{ elements: TemplateElement[], side: 'front' | 'back' }>) {
        const { elements, side } = event.detail;
        if (side === 'front') {
            frontElements = elements;
        } else {
            backElements = elements;
        }
        templateData.update((data) => ({
            ...data,
            template_elements: [...frontElements, ...backElements]
        }));
    }

    async function handleTemplateSelect(event: CustomEvent<{ id: string }>) {
        const templateId = event.detail.id;
        console.log('🔄 EditTemplate: Template select event received:', event.detail);
        
        // Immediately show loading state
        isEditMode = true;
        isLoading = true;
        
        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ EditTemplate: Server response:', errorText);
                throw new Error('Failed to fetch template. Please try again.');
            }
            
            const data = await response.json();
            console.log('📥 EditTemplate: Template data fetched:', {
                id: data.id,
                name: data.name,
                elements: data.template_elements?.length || 0,
                frontBackground: data.front_background?.substring(0, 50) + '...',
                backBackground: data.back_background?.substring(0, 50) + '...'
            });

            // Update store which will trigger reactive updates
            templateData.select(data);
            frontBackground = null;
            backBackground = null;
            errorMessage = '';
        } catch (err: unknown) {
            const error = err as Error;
            console.error('❌ EditTemplate: Error:', error);
            errorMessage = error.message || 'An unexpected error occurred. Please try again.';
            isEditMode = false;
        } finally {
            isLoading = false;
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
        templateData.set({
            id: '',
            user_id: $profile?.id ?? '',
            name: '',
            front_background: '',
            back_background: '',
            orientation: 'landscape' as const,
            template_elements: [],
            created_at: new Date().toISOString(),
            org_id: $profile?.org_id ?? ''
        });
        console.log('✅ EditTemplate: Form cleared');
    }

    // Reactive declarations for template elements
    run(() => {
        if ($templateData && $templateData.template_elements) {
            frontElements = $templateData.template_elements.filter(el => el.side === 'front');
            backElements = $templateData.template_elements.filter(el => el.side === 'back');
            frontPreview = $templateData.front_background;
            backPreview = $templateData.back_background;
            
            console.log('📋 EditTemplate: Elements filtered:', {
                front: {
                    count: frontElements.length,
                    elements: frontElements.map(e => ({
                        name: e.variableName,
                        type: e.type,
                        position: { x: e.x, y: e.y }
                    }))
                },
                back: {
                    count: backElements.length,
                    elements: backElements.map(e => ({
                        name: e.variableName,
                        type: e.type,
                        position: { x: e.x, y: e.y }
                    }))
                }
            });
        }
    });
</script>

<main class="h-full">
    <div class="edit-template-container {isEditMode ? 'edit-mode' : ''}">
        {#if !isEditMode}
            <TemplateList templates={data.templates} on:select={handleTemplateSelect} />
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
                        <div class="template-form">
                            <TemplateForm
                                side="front"
                                bind:elements={frontElements}
                                bind:preview={frontPreview}
                                onImageUpload={handleImageUpload}
                                onRemoveImage={handleRemoveImage}
                            />
                        </div>
                        <div class="template-form">
                            <TemplateForm
                                side="back"
                                bind:elements={backElements}
                                bind:preview={backPreview}
                                onImageUpload={handleImageUpload}
                                onRemoveImage={handleRemoveImage}
                            />
                        </div>

                        {#if errorMessage}
                            <p class="mt-4 text-sm text-red-600">{errorMessage}</p>
                        {/if}

                        <div class="mt-6 flex gap-4">
                            <button 
                                onclick={saveTemplate}
                                class="inline-flex justify-center rounded-md border-0 bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 dark:focus:ring-blue-400 transition-colors duration-200 dark:shadow-blue-900/30"
                            >
                                Save Template
                            </button>
                            <button 
                                onclick={clearForm}
                                class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Clear Form
                            </button>
                        </div>
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