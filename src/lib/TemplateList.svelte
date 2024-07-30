<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import { supabase } from '$lib/supabaseClient';
    
    interface Template {
        id: string;
        name: string;
        orientation: 'landscape' | 'portrait';
        created_at: string;
        front_background: string;
    }
    
    let templates: Template[] = [];
    let selectedTemplate: Template | null = null;
    let notification: string | null = null;
    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        await fetchTemplates();
    });
    
    async function fetchTemplates() {
        const { data, error } = await supabase
            .from('templates')
            .select('id, name, orientation, created_at, front_background')
            .order('created_at', { ascending: false });
    
        if (error) {
            console.error('Error fetching templates:', error);
        } else {
            templates = data || [];
        }
    }
    
    function selectTemplate(template: Template) {
        selectedTemplate = template;
        dispatch('select', template);
    }
    
    async function deleteTemplate(id: string) {
        if (confirm('Are you sure you want to delete this template?')) {
            const { error } = await supabase
                .from('templates')
                .delete()
                .match({ id });
        
            if (error) {
                console.error('Error deleting template:', error);
                showNotification('Error deleting template');
            } else {
                templates = templates.filter(t => t.id !== id);
                if (selectedTemplate?.id === id) {
                    selectedTemplate = null;
                }
                showNotification('Template deleted successfully');
            }
        }
    }

    function useTemplate(id: string) {
        window.location.href = `/use-template/${id}`;
    }

    function showNotification(message: string) {
        notification = message;
        setTimeout(() => {
            notification = null;
        }, 3000);
    }
</script>

<div class="template-list">
    <h2>Templates</h2>
    {#each templates as template (template.id)}
        <div class="template-item" class:selected={selectedTemplate?.id === template.id}>
            <div class="template-info" role="button" tabindex="0" on:click={() => selectTemplate(template)} on:keydown={(e) => e.key === 'Enter' && selectTemplate(template)}>
                <span class="template-name">{template.name}</span>
                <img src={template.front_background} alt={`Front of ${template.name}`} class="template-image" />
                <span>{template.orientation}</span>
                <span>{new Date(template.created_at).toLocaleDateString()}</span>
            </div>
            <div class="template-actions">
                <button on:click={() => useTemplate(template.id)}>Use</button>
                <button on:click={() => deleteTemplate(template.id)}>Delete</button>
            </div>
        </div>
    {/each}
</div>

{#if notification}
    <div class="notification" transition:fade>
        {notification}
    </div>
{/if}

<style>
    .template-list {
        width: 300px;
        border-right: 1px solid #ccc;
        padding: 10px;
        height: 100vh;
        overflow-y: auto;
    }
    
    .template-item {
        padding: 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .template-item:hover {
        background-color: #f0f0f0;
    }
    
    .selected {
        background-color: #e0e0e0;
    }
    
    .template-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1;
    }

    .template-name {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .template-image {
        width: 70%;
        max-width: 175px;
        height: auto;
        margin: 10px 0;
        object-fit: cover;
    }

    .template-actions {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-left: 10px;
    }

    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
</style>