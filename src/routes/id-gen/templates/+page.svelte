<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import type { User } from '@supabase/supabase-js';
    import TemplateForm from '$lib/TemplateForm.svelte';
    import TemplateList from '$lib/TemplateList.svelte';
    import { uploadImage } from '$lib/database';
    import { templateData } from '$lib/stores/templateStore';
    import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';

    // Add data prop from server
    export let data: {
        templates: TemplateData[],
        user: {
            id: string;
            role: string;
            org_id: string | null;
        }
    };

    let user: User | null = null;
    let frontBackground: File | null = null;
    let backBackground: File | null = null;
    let frontPreview: string | null = null;
    let backPreview: string | null = null;
    let orientation: 'landscape' | 'portrait' = 'landscape';
    let errorMessage = '';

    let frontElements: TemplateElement[] = [];
    let backElements: TemplateElement[] = [];

    // Add view mode state
    let isLoading = false;
    let isEditMode = false;

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
        if (!user) {
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
        console.log('front elements count:', frontElements.length);
        console.log('back elements count:', backElements.length);

        if (!user) {
            errorMessage = 'User is not authenticated.';
            return;
        }

        if (!(await validateBackgrounds())) {
            return;
        }

        try {
            let frontUrl = frontPreview;
            let backUrl = backPreview;

            if (frontBackground) {
                frontUrl = await uploadImage(frontBackground, 'front', user.id);
            }
            if (backBackground) {
                backUrl = await uploadImage(backBackground, 'back', user.id);
            }

            const templateDataToSave: TemplateData = {
                id: $templateData.id || crypto.randomUUID(),
                user_id: user.id,
                name: $templateData.name || 'My Template',
                front_background: frontUrl!,
                back_background: backUrl!,
                orientation: orientation,
                template_elements: [...frontElements, ...backElements],
                created_at: $templateData.created_at || new Date().toISOString()
            };

            if (templateDataToSave.template_elements.length === 0) {
                throw new Error('No template elements provided');
            }

            const { data, error } = await supabase
                .from('templates')
                .upsert([templateDataToSave])
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No template data returned after upsert');

            alert('Template saved successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error saving template:', error);
            errorMessage = `Error saving template: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        }
    }

    async function handleImageUpload(event: CustomEvent) {
        const { event: fileEvent, side } = event.detail;
        const input = fileEvent.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
            errorMessage = 'Please upload an image file.';
            return;
        }

        const isValid = await validateImage(file, side);
        if (!isValid) return;

        if (side === 'front') {
            frontBackground = file;
            frontPreview = URL.createObjectURL(file);
        } else {
            backBackground = file;
            backPreview = URL.createObjectURL(file);
        }

        errorMessage = '';
    }

    function removeImage(event: CustomEvent) {
        const { side } = event.detail;
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
                orientation: data.orientation,
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
        orientation = 'landscape';
        frontElements = [];
        backElements = [];
        errorMessage = '';
        templateData.set({
            id: '',
            user_id: user?.id || '',
            name: '',
            front_background: '',
            back_background: '',
            orientation: 'landscape',
            template_elements: [],
            created_at: new Date().toISOString()
        });
        console.log('✅ EditTemplate: Form cleared');
    }

    // Reactive declarations for template elements
    $: {
        if ($templateData && $templateData.template_elements) {
            frontElements = $templateData.template_elements.filter(el => el.side === 'front');
            backElements = $templateData.template_elements.filter(el => el.side === 'back');
            frontPreview = $templateData.front_background;
            backPreview = $templateData.back_background;
            orientation = $templateData.orientation;
            
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
    }
</script>

<main class="h-full">
    <div class="edit-template-container {isEditMode ? 'edit-mode' : ''}">
        {#if !isEditMode}
            <TemplateList templates={data.templates} on:select={handleTemplateSelect} />
        {:else}
            <div class="template-form-container active">
                <div class="back-button-container">
                    <button 
                        on:click={handleBack}
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

                            <!-- Skeleton for orientation selector -->
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 rounded w-1/6"></div>
                                <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                    {:else}
                        <div class="template-form">
                            <TemplateForm
                                side="front"
                                bind:elements={frontElements}
                                bind:preview={frontPreview}
                                on:imageUpload={handleImageUpload}
                                on:removeImage={removeImage}
                            />
                        </div>
                        <div class="template-form">
                            <TemplateForm
                                side="back"
                                bind:elements={backElements}
                                bind:preview={backPreview}
                                on:imageUpload={handleImageUpload}
                                on:removeImage={removeImage}
                            />
                        </div>

                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700">
                                Orientation:
                                <select 
                                    bind:value={orientation}
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                >
                                    <option value="landscape">Landscape</option>
                                    <option value="portrait">Portrait</option>
                                </select>
                            </label>
                        </div>

                        {#if errorMessage}
                            <p class="mt-4 text-sm text-red-600">{errorMessage}</p>
                        {/if}

                        <div class="mt-6 flex gap-4">
                            <button 
                                on:click={saveTemplate}
                                class="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Save Template
                            </button>
                            <button 
                                on:click={clearForm}
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