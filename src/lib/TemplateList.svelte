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

    async function duplicateTemplate(template: TemplateData) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', template.id)
            .single();

        if (error) {
            showNotification('Error duplicating template');
            return;
        }

        const { id, ...templateData } = data;
        const newTemplate = {
            ...templateData,
            name: `Copy of ${data.name}`,
            created_at: new Date().toISOString()
        };

        const { data: insertedTemplate, error: insertError } = await supabase
            .from('templates')
            .insert([newTemplate])
            .select()
            .single();

        if (insertError) {
            showNotification('Error duplicating template');
        } else {
            templates = [insertedTemplate, ...templates];
            showNotification('Template duplicated successfully');
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

    function handleActionClick(e: Event, template: TemplateData, action: 'use' | 'duplicate' | 'delete') {
        e.stopPropagation();
        
        switch (action) {
            case 'use':
                useTemplate(template.id);
                break;
            case 'duplicate':
                duplicateTemplate(template);
                break;
            case 'delete':
                deleteTemplate(template.id);
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
            <article 
                class="template-card group relative rounded-lg border bg-card transition-all duration-300 ease-in-out hover:shadow-lg"
                aria-label={`Template: ${template.name}`}
                on:mouseenter={() => hoveredTemplate = template.id}
                on:mouseleave={() => hoveredTemplate = null}
            >
                <button 
                    class="aspect-[1.6/1] w-full overflow-hidden rounded-t-lg bg-muted text-left"
                    on:click={() => selectTemplate(template)}
                    on:keydown={(e) => e.key === 'Enter' && selectTemplate(template)}
                    aria-label={`Edit template: ${template.name}`}
                >
                    {#if template.front_background}
                        <img 
                            src={template.front_background} 
                            alt={`Preview of template: ${template.name}`}
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    {:else}
                        <div class="flex h-full items-center justify-center bg-muted">
                            <span class="text-muted-foreground">No preview</span>
                        </div>
                    {/if}
                </button>

                <div class="p-3 text-center">
                    <h3 class="text-sm font-medium">{template.name}</h3>
                </div>

                <div 
                    class="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-3 opacity-0 transition-opacity duration-300 bg-gradient-to-t from-background/90 to-transparent"
                    class:opacity-100={hoveredTemplate === template.id}
                    role="toolbar"
                    aria-label="Template actions"
                >
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0"
                        on:click={() => selectTemplate(template)}
                        aria-label={`Edit ${template.name}`}
                    >
                        <Edit class="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0"
                        on:click={(e) => handleActionClick(e, template, 'use')}
                        aria-label={`Use ${template.name}`}
                    >
                        <ExternalLink class="h-4 w-4" />
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
            </article>
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
    .template-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 200px;
    }

    /* Ensure buttons are clickable on touch devices */
    @media (hover: none) {
        .template-card .opacity-0 {
            opacity: 1 !important;
        }
    }
</style>