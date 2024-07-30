<!-- src/routes/use-template/[id]/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';
    
    let template: any = null;
    let formData: {[key: string]: string} = {};
    let errorMessage = '';
    
    onMount(async () => {
        const templateId = $page.params.id;
        await fetchTemplate(templateId);
    });
    
    async function fetchTemplate(id: string) {
        const { data, error } = await supabase
            .from('templates')
            .select(`
                *,
                template_elements (*)
            `)
            .eq('id', id)
            .single();
    
        if (error) {
            console.error('Error fetching template:', error);
            errorMessage = 'Failed to load template';
        } else {
            template = data;
            initializeFormData();
        }
    }
    
    function initializeFormData() {
        const elements = [...template.template_elements];
        elements.forEach(el => {
            formData[el.variableName] = el.content || '';
        });
    }
    
    async function saveIdCard() {
        const { data, error } = await supabase
            .from('id_cards')
            .insert({
                template_id: template.id,
                data: JSON.stringify(formData),
                front_image: template.front_background,
                back_image: template.back_background
            });
    
        if (error) {
            console.error('Error saving ID card:', error);
            errorMessage = 'Failed to save ID card';
        } else {
            alert('ID card saved successfully!');
            // Optionally redirect to a success page or clear the form
        }
    }
    </script>
    
    <div class="use-template-container">
        <div class="preview-container">
            {#if template}
                <div class="preview {template.orientation}">
                    <img src={template.front_background} alt="Front" class="preview-image">
                    <img src={template.back_background} alt="Back" class="preview-image">
                </div>
            {/if}
        </div>
        <div class="form-container">
            <h1>Use Template</h1>
            {#if template}
                <form on:submit|preventDefault={saveIdCard}>
                    {#each template.template_elements as element (element.id)}
                        <div class="form-group">
                            <label for={element.variableName}>{element.variableName}</label>
                            <input 
                                type={element.type === 'photo' || element.type === 'signature' ? 'file' : 'text'}
                                id={element.variableName}
                                bind:value={formData[element.variableName]}
                            >
                        </div>
                    {/each}
                    <button type="submit">Save ID Card</button>
                </form>
            {/if}
            {#if errorMessage}
                <p class="error">{errorMessage}</p>
            {/if}
        </div>
    </div>
    
    <style>
    .use-template-container {
        display: flex;
        height: 100vh;
    }
    
    .preview-container {
        flex: 1;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .preview {
        display: flex;
        max-width: 100%;
        max-height: 100%;
    }
    
    .preview.landscape {
        flex-direction: column;
    }
    
    .preview.portrait {
        flex-direction: row;
    }
    
    .preview-image {
        max-width: 100%;
        max-height: 50%;
        object-fit: contain;
    }
    
    .form-container {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .error {
        color: red;
    }
    </style>