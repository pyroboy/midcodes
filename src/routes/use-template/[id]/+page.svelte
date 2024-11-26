<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import IdCanvas from '$lib/IdCanvas.svelte';
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { darkMode } from '../../../stores/darkMode';
    import { Switch } from "$lib/components/ui/switch";
    import ThumbnailInput from '$lib/ThumbnailInput.svelte';
    import { Loader } from 'lucide-svelte';
    import type { Session } from '@supabase/supabase-js';
    
    import type { 
        Template,
        SelectItem,
        FormData,
        FileUploads,
        ImagePositions,
        CachedFileUrls
    } from './types';

    interface PageData {
        template: Template;
        session: Session;
    }

    export let data: PageData;

    let frontCanvasComponent: IdCanvas;
    let backCanvasComponent: IdCanvas;
    let template: Template = data.template;
    let selectedOptions: Record<string, SelectItem> = {};
    let formData: FormData = {};
    let fileUploads: FileUploads = {};
    let imagePositions: ImagePositions = {};
    let cachedFileUrls: CachedFileUrls = {};
    let debugMessages: string[] = [];
    let errorMessage: string | null = null;
    let isSaving = false;
    let MOUSE_MOVING = false;
    let fullResolution = false;

    onMount(async () => {
        if (browser) {
            initializeFormData();
            
            if (template?.template_elements) {
                template.template_elements.forEach((element) => {
                    if (element.type === 'selection' && element.variableName) {
                        selectedOptions[element.variableName] = {
                            value: formData[element.variableName] || '',
                            label: formData[element.variableName] || 'Select an option'
                        };
                    }
                });
            }

            await Promise.all([
                new Promise(resolve => frontCanvasComponent?.$on('mounted', resolve)),
                new Promise(resolve => backCanvasComponent?.$on('mounted', resolve))
            ]);

            if (frontCanvasComponent?.canvas && frontCanvasComponent?.hiddenCanvas &&
                backCanvasComponent?.canvas && backCanvasComponent?.hiddenCanvas) {
                saveIdCard();
            } else {
                console.error('Canvas components not properly initialized');
                addDebugMessage('Error: Canvas components not properly initialized');
            }
        }
    });
    function handleSelectChange(selection: SelectItem | undefined, variableName: string) {
        if (selection) {
            formData[variableName] = selection.value;
            selectedOptions[variableName] = {
                value: selection.value,
                label: selection.value
            };
        }
    }

    onDestroy(() => {
        Object.values(cachedFileUrls).forEach(URL.revokeObjectURL);
    });

    function initializeFormData() {
        if (template?.template_elements) {
            template.template_elements.forEach((el) => {
                if (!el.variableName) return;
                
                if (el.type === 'text' || el.type === 'selection') {
                    formData[el.variableName] = el.content || '';
                } else if (el.type === 'photo' || el.type === 'signature') {
                    fileUploads[el.variableName] = null;
                    imagePositions[el.variableName] = {
                        x: 0,
                        y: 0,
                        width: el.width || 100,
                        height: el.height || 100,
                        scale: 1
                    };
                }
            });
        }
    }

    function handleImageUpdate(event: CustomEvent, variableName: string) {
        const { scale, x, y } = event.detail;
        imagePositions[variableName] = {
            ...imagePositions[variableName],
            scale,
            x,
            y
        };
    }

    function handleSelectFile(variableName: string) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => handleFileUpload(e, variableName);
        input.click();
    }

    function handleFileUpload(event: Event, variableName: string) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            fileUploads[variableName] = file;
            formData[variableName] = file.name;
            createAndCacheFileUrl(file, variableName);
        }
    }

    function createAndCacheFileUrl(file: File, variableName: string) {
        if (cachedFileUrls[variableName]) {
            URL.revokeObjectURL(cachedFileUrls[variableName]);
        }
        const url = URL.createObjectURL(file);
        cachedFileUrls[variableName] = url;
        return url;
    }

    function handleToggle(checked: boolean) {
        darkMode.set(checked);
    }

    function handleMouseDown() {
        MOUSE_MOVING = true;
    }

    function handleMouseUp() {
        MOUSE_MOVING = false;
    }

    function addDebugMessage(message: string) {
        console.log(message);
        debugMessages = [...debugMessages, message];
    }

    async function saveIdCard() {
        if (!template) {
            console.error("Template not loaded");
            addDebugMessage("Error: Template not loaded");
            errorMessage = "Template not loaded";
            return;
        }

        isSaving = true;
        debugMessages = [];
        addDebugMessage("Starting saveIdCard function");

        try {
            if (!frontCanvasComponent || !backCanvasComponent) {
                throw new Error('Canvas components not initialized');
            }

            addDebugMessage("Rendering full resolution canvases");

            const [frontBlob, backBlob] = await Promise.all([
                frontCanvasComponent.renderFullResolution(),
                backCanvasComponent.renderFullResolution()
            ]);

            if (!frontBlob || !backBlob) {
                throw new Error('Failed to create blobs from canvases');
            }

            const savedData = {
                ...formData,
                imagePositions,
                fileUploads: Object.fromEntries(
                    Object.entries(fileUploads).map(([key, file]) => [key, file ? file.name : null])
                )
            };

            const formDataToSend = new FormData();
            formDataToSend.append('frontBlob', frontBlob);
            formDataToSend.append('backBlob', backBlob);
            formDataToSend.append('templateId', template.id);
            formDataToSend.append('data', JSON.stringify(savedData));

            const response = await fetch('?/saveIdCard', {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to save ID card');
            }

            addDebugMessage('ID card saved successfully');
            alert('ID card saved successfully!');
        } catch (error) {
            errorMessage = `Failed to save ID card: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
            addDebugMessage(errorMessage);
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="container mx-auto p-4 flex flex-col md:flex-row gap-4">
    <div class="w-full md:w-1/2">
        <Card class="h-full">
            <div class="p-4">
                <h2 class="text-2xl font-bold mb-4">ID Card Preview</h2>
                <div class="canvas-wrapper" class:landscape={template?.orientation === 'landscape'} class:portrait={template?.orientation === 'portrait'}>
                    <div class="front-canvas">
                        <h3 class="text-lg font-semibold mb-2">Front</h3>
                        {#if template}
                            <IdCanvas
                                bind:this={frontCanvasComponent}
                                elements={template.template_elements.filter(el => el.side === 'front')}
                                backgroundUrl={template.front_background}
                                {formData}
                                {fileUploads}
                                {imagePositions}
                                {fullResolution}
                                isDragging={MOUSE_MOVING}
                                on:rendered={() => console.log('Front canvas rendered')}
                            />
                        {/if}
                    </div>
                    <div class="back-canvas">
                        <h3 class="text-lg font-semibold mb-2">Back</h3>
                        {#if template}
                            <IdCanvas
                                bind:this={backCanvasComponent}
                                elements={template.template_elements.filter(el => el.side === 'back')}
                                backgroundUrl={template.back_background}
                                {formData}
                                {fileUploads}
                                {imagePositions}
                                {fullResolution}
                                isDragging={MOUSE_MOVING}
                                on:rendered={() => console.log('Back canvas rendered')}
                            />
                        {/if}
                    </div>
                </div>
            </div>
        </Card>
    </div>
    <div class="w-full md:w-1/2">
        <Card class="h-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">ID Card Form</h2>
                    <Switch 
                        checked={$darkMode} 
                        onCheckedChange={handleToggle}
                    >
                        <span class="sr-only">Toggle dark mode</span>
                        <span aria-hidden="true">{$darkMode ? '🌙' : '☀️'}</span>
                    </Switch>
                </div>
                <p class="text-muted-foreground mb-6">Please fill out these details for your ID card.</p>
                {#if template && template.template_elements}
                    <form on:submit|preventDefault={saveIdCard} class="space-y-4">
                        {#each template.template_elements as element (element.variableName)}
                            {#if element.variableName}
                                <div role="button" tabindex="-1" class="grid grid-cols-[auto,1fr] gap-4 items-center" 
                                    on:mousedown={handleMouseDown} 
                                    on:mouseup={handleMouseUp}>
                                    <Label for={element.variableName} class="text-base whitespace-nowrap">
                                        {element.variableName}:
                                    </Label>
                                    {#if element.type === 'text'}
                                        <Input 
                                            type="text"
                                            id={element.variableName}
                                            bind:value={formData[element.variableName]}
                                            class="bg-muted"
                                        />
                                    {:else if element.type === 'selection' && element.options}
                                        <div class="relative w-full">
                                            <Select.Root
                                                selected={selectedOptions[element.variableName]}
                                                onSelectedChange={(selection) => {
                                                    if (selection && typeof selection.value === 'string') {
                                                        formData[element.variableName] = selection.value;
                                                        selectedOptions[element.variableName] = {
                                                            value: selection.value,
                                                            label: selection.value
                                                        };
                                                    }
                                                }}
                                            >
                                                <Select.Trigger class="w-full">
                                                    <Select.Value placeholder="Select an option">
                                                        {selectedOptions[element.variableName]?.label || 'Select an option'}
                                                    </Select.Value>
                                                </Select.Trigger>
                                                <Select.Content>
                                                    {#each element.options as option}
                                                        <Select.Item 
                                                            value={option}
                                                            label={option}
                                                        >
                                                            {option}
                                                        </Select.Item>
                                                    {/each}
                                                </Select.Content>
                                            </Select.Root>
                                        </div>
                                    {:else if element.type === 'photo' || element.type === 'signature'}
                                        <ThumbnailInput
                                            width={element.width || 100}
                                            height={element.height || 100}
                                            fileUrl={cachedFileUrls[element.variableName]}
                                            initialScale={imagePositions[element.variableName]?.scale ?? 1}
                                            initialX={imagePositions[element.variableName]?.x ?? 0}
                                            initialY={imagePositions[element.variableName]?.y ?? 0}
                                            isSignature={element.type === 'signature'}
                                            on:selectFile={() => handleSelectFile(element.variableName)}
                                            on:update={(e) => handleImageUpdate(e, element.variableName)}
                                        />
                                    {/if}
                                </div>
                            {:else}
                                <p class="text-red-500">Error: Invalid template element (missing variable name)</p>
                            {/if}
                        {/each}
                        <Button type="submit" class="w-full mt-6" on:click={saveIdCard} disabled={isSaving}>
                            {#if isSaving}
                                <Loader class="mr-2 h-4 w-4 animate-spin" />
                            {/if}
                            Generate and Save ID Card
                        </Button>
                        {#if debugMessages.length > 0}
                            <div class="mt-4 p-2 bg-gray-100 rounded">
                                <h4 class="font-semibold">Debug Messages:</h4>
                                <ul class="list-disc pl-5">
                                    {#each debugMessages as message}
                                        <li>{message}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </form>
                {/if}
            </div>
        </Card>
    </div>
</div>

<style>
    :global(.dark) {
        color-scheme: dark;
    }
    .canvas-wrapper {
        display: flex;
        gap: 20px;
    }
    .canvas-wrapper.landscape {
        flex-direction: column;
    }
    .canvas-wrapper.portrait {
        flex-direction: row;
    }
</style>