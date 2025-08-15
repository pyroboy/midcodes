<script lang="ts">
    import { fade } from 'svelte/transition';
    import { Button } from "$lib/components/ui/button";
    import { Copy, Trash2, Edit, Plus } from 'lucide-svelte';
    import type { TemplateData } from '../stores/templateStore';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import SizeSelectionDialog from './SizeSelectionDialog.svelte';
    import type { CardSize } from '$lib/utils/sizeConversion';
    

    let { 
        templates = $bindable([]),
        onSelect,
        onCreateNew
     } = $props();
    let selectedTemplate: TemplateData | null = null;
    let notification: string | null = $state(null);
    let hoveredTemplate: string | null = $state(null);
    let showSizeDialog: boolean = $state(false);
    


    async function deleteTemplate(template: TemplateData) {
        try {
            if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
                return;
            }

            // Create FormData
            const formData = new FormData();
            formData.append('templateId', template.id);

            // Call server action
            const response = await fetch('/templates?/delete', {
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
            // Ensure we have all the necessary data from the original template
            if (!template || !template.id) {
                throw new Error('Invalid template data');
            }

            // Create new template data with a new ID
            const newTemplate = {
                ...template,                 // Copy all fields including org_id
                id: crypto.randomUUID(),     // New ID
                name: `Copy of ${template.name}`,
                created_at: new Date().toISOString(),
                user_id: template.user_id,   // Preserve user_id
                org_id: template.org_id      // Explicitly preserve org_id
            };

            console.log('Duplicating template:', {
                originalId: template.id,
                newId: newTemplate.id,
                org_id: newTemplate.org_id
            });

            // Create FormData
            const formData = new FormData();
            formData.append('templateData', JSON.stringify(newTemplate));

            // Call server action
            const response = await fetch('/templates?/create', {
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
            
            // Instead of reloading, invalidate the data
            await invalidate('app:templates');
        } catch (err) {
            console.error('Error duplicating template:', err);
            showNotification('Error duplicating template');
        }
    }

    function useTemplate(id: string) {
        // Use data-sveltekit-reload="off" to prevent full page reload
        goto(`/use-template/${id}`, { replaceState: false });
    }

    function showNotification(message: string) {
        notification = message;
        setTimeout(() => {
            notification = null;
        }, 3000);
    }

    function selectTemplate(template: TemplateData) {
        selectedTemplate = template;

        onSelect(selectedTemplate.id);

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

    function handleCreateNew() {
        showSizeDialog = true;
    }

    function handleSizeSelected(event: CustomEvent<{ cardSize: CardSize; templateName: string }>) {
        const { cardSize, templateName } = event.detail;
        showSizeDialog = false;
        onCreateNew?.(cardSize, templateName);
    }

    function handleSizeSelectionCancel() {
        showSizeDialog = false;
    }
</script>

<div class="h-full w-full overflow-y-auto bg-background p-6">
    <div class="mb-8 flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Templates</h2>
        <Button onclick={handleCreateNew} class="flex items-center gap-2">
            <Plus class="h-4 w-4" />
            Create New Template
        </Button>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each templates as template (template.id)}
            <div 
                class="bg-card text-card-foreground dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative group"
                role="article"
                aria-label={`Template card for ${template.name}`}
                onmouseenter={() => hoveredTemplate = template.id}
                onmouseleave={() => hoveredTemplate = null}
            >
                <a 
                    href="/use-template/{template.id}"
                    class="block w-full text-left"
                    data-sveltekit-preload-data="hover"
                    data-sveltekit-noscroll
                    data-sveltekit-reload="off"
                >
                    {#if template.front_background}
                        <img 
                            src={template.front_background} 
                            alt={template.name}
                            class="aspect-[1.6/1] w-full object-cover"
                        />
                    {:else}
                        <div class="aspect-[1.6/1] w-full flex items-center justify-center bg-muted dark:bg-gray-700">
                            <span class="text-muted-foreground dark:text-gray-400">No preview</span>
                        </div>
                    {/if}
                    <div class="p-3 text-center">
                        <h3 class="text-sm font-medium text-foreground dark:text-gray-200">{template.name}</h3>
                    </div>
                </a>

                <div class="absolute right-2 top-2 flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xs rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
                        onclick={(e) => handleActionClick(e, template, 'edit')}
                        aria-label={`Edit ${template.name}`}
                    >
                        <Edit class="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
                        onclick={(e) => handleActionClick(e, template, 'duplicate')}
                        aria-label={`Duplicate ${template.name}`}
                    >
                        <Copy class="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        class="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground dark:text-gray-200"
                        onclick={(e) => handleActionClick(e, template, 'delete')}
                        aria-label={`Delete ${template.name}`}
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- Size Selection Dialog -->
<SizeSelectionDialog 
    bind:open={showSizeDialog}
    on:sizeSelected={handleSizeSelected}
    on:cancel={handleSizeSelectionCancel}
/>

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