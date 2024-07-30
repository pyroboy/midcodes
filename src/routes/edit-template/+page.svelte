<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import type { User } from '@supabase/supabase-js';
    import TemplateForm from '$lib/TemplateForm.svelte';
    import TemplateList from '$lib/TemplateList.svelte';
    import { uploadImage } from '$lib/database';
    import { templateData } from '../../stores/templateStore';
    import type { TemplateData, TemplateElement } from '../../stores/templateStore';

    let user: User | null = null;
    let frontBackground: File | null = null;
    let backBackground: File | null = null;
    let frontPreview: string | null = null;
    let backPreview: string | null = null;
    let orientation: 'landscape' | 'portrait' = 'landscape';
    let errorMessage = '';
    
    let frontElements: TemplateElement[] = [];
    let backElements: TemplateElement[] = [];

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
        if (!user) {
            window.location.href = '/login';
        }
    });

    async function saveTemplate() {
        console.log('front elements count:', frontElements.length);
        console.log('back elements count:', backElements.length);

        if (!user || !frontBackground || !backBackground) {
            errorMessage = 'Please upload both front and back backgrounds.';
            return;
        }

        try {
            const frontUrl = await uploadImage(frontBackground, 'front', user.id);
            const backUrl = await uploadImage(backBackground, 'back', user.id);

            const templateDataToSave: TemplateData = {
                id: crypto.randomUUID(),
                user_id: user.id,
                name: 'My Template',
                front_background: frontUrl,
                back_background: backUrl,
                orientation: orientation,
                template_elements: [...frontElements, ...backElements],
            };

            if (templateDataToSave.template_elements.length === 0) {
                throw new Error('No template elements provided');
            }

            const { data, error } = await supabase
                .from('templates')
                .insert([templateDataToSave])
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No template data returned after insert');

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
    
        const img = new Image();
        img.onload = async () => {
            if (img.width !== 1013 || img.height !== 638) {
                errorMessage = `${side.charAt(0).toUpperCase() + side.slice(1)} background must be exactly 1013x638 pixels.`;
                return;
            }
    
            if (side === 'front') {
                frontBackground = file;
                frontPreview = URL.createObjectURL(file);
            } else {
                backBackground = file;
                backPreview = URL.createObjectURL(file);
            }
    
            errorMessage = '';
        };
        img.onerror = () => {
            errorMessage = 'Error loading image. Please try again.';
        };
        img.src = URL.createObjectURL(file);
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

    function updateElements(event: CustomEvent<{elements: TemplateElement[], side: 'front' | 'back'}>) {
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

    async function fetchTemplateDetails(templateId: string): Promise<TemplateData> {
        const { data, error } = await supabase
            .from('templates')
            .select(`
                id,
                user_id,
                name,
                front_background,
                back_background,
                orientation,
                template_elements
            `)
            .eq('id', templateId)
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error('Template not found');
        }

        const templateData: TemplateData = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            front_background: data.front_background,
            back_background: data.back_background,
            orientation: data.orientation,
            template_elements: data.template_elements.map((el: any): TemplateElement => ({
                variableName: el.variable_name,
                type: el.type as 'text' | 'photo',
                side: el.side as 'front' | 'back',
                content: el.content,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                font: el.font,
                size: el.size,
                color: el.color,
                alignment: el.alignment as 'left' | 'center' | 'right',
            })),
        };

        return templateData;
    }

    async function handleTemplateSelect(event: CustomEvent) {
        const selectedTemplate = event.detail;
        try {
            const data = await fetchTemplateDetails(selectedTemplate.id);
            if (data) {
                orientation = data.orientation;
                frontPreview = data.front_background;
                backPreview = data.back_background;
                frontElements = data.template_elements.filter((el) => el.side === 'front');
                backElements = data.template_elements.filter((el) => el.side === 'back');
                templateData.set(data);
            }
        } catch (error) {
            console.error('Error fetching template details:', error);
            errorMessage = 'Error fetching template details. Please try again.';
        }
    }

    function clearForm() {
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
            template_elements: []
        });
    }

    $: {
        if ($templateData) {
            frontElements = $templateData.template_elements.filter((el) => el.side === 'front');
            backElements = $templateData.template_elements.filter((el) => el.side === 'back');
        }
    }
</script>

<main>
    <div class="edit-template-container">
        <TemplateList on:select={handleTemplateSelect} />
        <div class="template-form-container">
            <h1>Edit Template</h1>
    
            <TemplateForm
                side="front"
                preview={frontPreview}
                elements={frontElements}
                on:imageUpload={handleImageUpload}
                on:removeImage={removeImage}
                on:update={updateElements}
            />
        
            <TemplateForm
                side="back"
                preview={backPreview}
                elements={backElements}
                on:imageUpload={handleImageUpload}
                on:removeImage={removeImage}
                on:update={updateElements}
            />

            <div>
                <label>
                    Orientation:
                    <select bind:value={orientation}>
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                    </select>
                </label>
            </div>

            {#if errorMessage}
                <p class="error">{errorMessage}</p>
            {/if}

            <button on:click={saveTemplate}>Save Template</button>
            <button on:click={clearForm}>Clear Form</button>
        </div>
    </div>
</main>

<style>
    .edit-template-container {
        display: flex;
        width: 100vw;
        height: 100vh;
    }

    .template-form-container {
        flex-grow: 1;
        padding: 20px;
        overflow-y: auto;
    }

    .error {
        color: red;
    }

    button {
        background-color: #4CAF50;
        color: white;
        padding: 14px 20px;
        margin: 8px 0;
        border: none;
        cursor: pointer;
        width: 100%;
    }

    button:hover {
        opacity: 0.8;
    }
</style>