<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { supabase } from '$lib/supabaseClient';
    import { Button } from "$lib/components/ui/button";
    import { Copy, Trash2, ExternalLink, Edit } from 'lucide-svelte';
    import type { TemplateData } from './stores/templateStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    export let templates: TemplateData[] = [];
    let selectedTemplate: TemplateData | null = null;
    let notification: string | null = null;
    let hoveredTemplate: string | null = null;
    const dispatch = createEventDispatcher();
    
    // Get user profile from page store

    async function deleteTemplate(template: TemplateData) {
        try {
            if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
                return;
            }

            // Create FormData
            const formData = new FormData();
            formData.append('templateId', template.id);

            // Call server action
            const response = await fetch('/id-gen/templates?/delete', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            // Remove template from list
            templates = templates.filter(t => t.id !== template.id);
            showNotification('Template deleted successfully');
        } catch (err) {
            console.error('Error deleting template:', err);
            showNotification('Error deleting template');
        }
    }

    async function duplicateTemplate(template: TemplateData) {
        try {
            // Create new template data with a new ID
            const newTemplate: TemplateData = {
                ...template,
                id: crypto.randomUUID(),
                name: `Copy of ${template.name}`,
                created_at: new Date().toISOString()
            };

            // Create FormData
            const formData = new FormData();
            formData.append('templateData', JSON.stringify(newTemplate));

            // Call server action
            const response = await fetch('/id-gen/templates?/create', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to duplicate template');
            }

            const result = await response.json();
            
            // Add new template to list and show success message
            templates = [result.data, ...templates];
            showNotification('Template duplicated successfully');
            
            // Reload the page to refresh the template list
            window.location.reload();
        } catch (err) {
            console.error('Error duplicating template:', err);
            showNotification('Error duplicating template');
        }
    }

    function useTemplate(id: string) {
        goto(`/id-gen/use-template/${id}`);
    }

    function showNotification(message: string) {
        notification = message;
        setTimeout(() => {
            notification = null;
        }, 3000);
    }

    function selectTemplate(template: TemplateData) {
        selectedTemplate = template;
        console.log(' TemplateList: Template selected:', template.id);
        dispatch('select', { id: template.id });
    }

    function handleActionClick(e: Event, template: TemplateData, action: 'edit' | 'use' | 'duplicate' | 'delete') {
        e.stopPropagation(); // Prevent the template click event from firing
        switch (action) {
            case 'edit':
                selectTemplate(template);
                break;
            case 'use':
                useTemplate(template.id);
                break;
            case 'duplicate':
                duplicateTemplate(template);
                break;
            case 'delete':
                deleteTemplate(template);
                break;
        }
    }
</script>

<div class="h-full w-full overflow-y-auto bg-background p-6">
    <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight">Templates</h2>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each templates as template (template.id)}
            <div 
                class="bg-white rounded-lg shadow-md overflow-hidden"
                role="article"
                aria-label={`Template card for ${template.name}`}
                on:mouseenter={() => hoveredTemplate = template.id}
                on:mouseleave={() => hoveredTemplate = null}
            >
                <button 
                    class="w-full text-left"
                    on:click={() => useTemplate(template.id)}
                    on:keydown={(e) => e.key === 'Enter' && useTemplate(template.id)}
                    aria-label={`Use template: ${template.name}`}
                >
                    {#if template.front_background}
                        <img 
                            src={template.front_background} 
                            alt={template.name}
                            class="aspect-[1.6/1] w-full object-cover"
                        />
                    {:else}
                        <div class="aspect-[1.6/1] w-full flex items-center justify-center bg-muted">
                            <span class="text-muted-foreground">No preview</span>
                        </div>
                    {/if}
                </button>

                <div class="p-3 text-center">
                    <h3 class="text-sm font-medium">{template.name}</h3>
                </div>

                <div class="absolute right-2 top-2 flex gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0"
                        on:click={(e) => handleActionClick(e, template, 'edit')}
                        aria-label={`Edit ${template.name}`}
                    >
                        <Edit class="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0"
                        on:click={(e) => handleActionClick(e, template, 'duplicate')}
                        aria-label={`Duplicate ${template.name}`}
                    >
                        <Copy class="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0"
                        on:click={(e) => handleActionClick(e, template, 'delete')}
                        aria-label={`Delete ${template.name}`}
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        {/each}
    </div>
</div>

{#if notification}
    <div 
        class="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg"
        transition:fade
    >
        {notification}
    </div>
{/if}

<style>
</style>