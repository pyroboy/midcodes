<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { supabase } from '$lib/supabaseClient';
    import { Button } from "$lib/components/ui/button";
    import { Copy, Trash2, ExternalLink } from 'lucide-svelte';
    
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
    let hoveredAction: 'use' | 'duplicate' | 'delete' | null = null;
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

    async function duplicateTemplate(template: Template) {
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
        window.location.href = `/use-template/${id}`;
    }

    function showNotification(message: string) {
        notification = message;
        setTimeout(() => {
            notification = null;
        }, 3000);
    }

    function handleActionClick(e: Event, template: Template, action: 'use' | 'duplicate' | 'delete') {
        e.stopPropagation();
        selectTemplate(template);
        
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

    function setHoveredAction(action: 'use' | 'duplicate' | 'delete' | null) {
        hoveredAction = action;
    }

    function getRowClasses(template: Template): string {
        const baseClasses = "group relative transition-all duration-200";
        
        if (selectedTemplate?.id === template.id) {
            return `${baseClasses} bg-muted`;
        }
        
        switch (hoveredAction) {
            case 'use':
                return `${baseClasses} bg-primary/5`;
            case 'duplicate':
                return `${baseClasses} bg-warning/5`;
            case 'delete':
                return `${baseClasses} bg-destructive/5`;
            default:
                return `${baseClasses} hover:bg-muted/50`;
        }
    }
</script>

<div class="h-full w-[40%] overflow-hidden bg-background">
    <div class="flex flex-col space-y-4 p-4">
        <h2 class="text-2xl font-bold tracking-tight">Templates</h2>
        
        <div class="relative overflow-x-auto rounded-lg border bg-card">
            <table class="w-full text-sm">
                <thead class="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium">Template</th>
                        <th class="hidden px-4 py-3 text-left font-medium sm:table-cell">Created</th>
                        <th class="hidden px-4 py-3 text-left font-medium sm:table-cell">Orientation</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each templates as template (template.id)}
                        <tr 
                            class={getRowClasses(template)}
                            class:selected={selectedTemplate?.id === template.id}
                            on:click={() => selectTemplate(template)}
                            tabindex="0"
                            role="button"
                            on:keydown={(e) => e.key === 'Enter' && selectTemplate(template)}
                        >
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <img 
                                        src={template.front_background} 
                                        alt={template.name}
                                        class="h-12 w-12 rounded-md border object-cover"
                                    />
                                    <span class="font-medium">{template.name}</span>
                                </div>
                            </td>
                            <td class="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                {new Date(template.created_at).toLocaleDateString()}
                            </td>
                            <td class="hidden px-4 py-3 capitalize text-muted-foreground sm:table-cell">
                                {template.orientation}
                            </td>
                            
                            <div class="invisible absolute inset-0 flex items-center justify-end opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                <div 
                                    class="flex items-center gap-2 px-4"
                                    transition:slide={{ axis: 'y', duration: 200 }}
                                >
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        on:click={(e) => handleActionClick(e, template, 'use')}
                                        on:mouseenter={() => setHoveredAction('use')}
                                        on:mouseleave={() => setHoveredAction(null)}
                                        class="hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <ExternalLink class="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        on:click={(e) => handleActionClick(e, template, 'duplicate')}
                                        on:mouseenter={() => setHoveredAction('duplicate')}
                                        on:mouseleave={() => setHoveredAction(null)}
                                        class="hover:bg-warning hover:text-warning-foreground"
                                    >
                                        <Copy class="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        on:click={(e) => handleActionClick(e, template, 'delete')}
                                        on:mouseenter={() => setHoveredAction('delete')}
                                        on:mouseleave={() => setHoveredAction(null)}
                                        class="hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

{#if notification}
    <div 
        class="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg"
        transition:fade={{ duration: 200 }}
    >
        {notification}
    </div>
{/if}

<style>
    :global(tr.selected) {
        background-color: hsl(var(--muted));
    }
</style>