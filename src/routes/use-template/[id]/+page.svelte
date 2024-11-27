<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';
    import { auth, session, user } from '$lib/stores/auth';
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
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';

    interface SelectOption {
        value: string;
        label: string;
    }

    interface TemplateElement {
        id: string;
        type: 'text' | 'photo' | 'signature' | 'selection';
        side: 'front' | 'back';
        x: number;
        y: number;
        width?: number;
        height?: number;
        variableName: string;
        content?: string;
        options?: string[];
    }

    interface Template {
        id: string;
        name: string;
        org_id: string;
        template_elements: TemplateElement[];
        front_background: string;
        back_background: string;
        orientation: 'landscape' | 'portrait';
    }

    interface ImagePosition {
        x: number;
        y: number;
        width: number;
        height: number;
        scale: number;
    }

    interface FileUploads {
        [key: string]: File | null;
    }

    let templateId = $page.params.id;
    let template: Template | null = null;
    let loading = true;
    let error: string | null = null;
    let formElement: HTMLFormElement;
    let debugMessages: string[] = [];
    let formData: Record<string, string> = {};
    let fileUploads: FileUploads = {};
    let imagePositions: Record<string, ImagePosition> = {};
    let selectedOptions: Record<string, SelectOption> = {};
    let frontCanvasComponent: IdCanvas;
    let backCanvasComponent: IdCanvas;
    let frontCanvasReady = false;
    let backCanvasReady = false;
    let fullResolution = false;
    let mouseMoving = false;
    let formErrors: Record<string, boolean> = {};
    let fileUrls: Record<string, string> = {};

    $: {
        console.log('Use Template Page: Session exists:', !!$session);
        console.log('Use Template Page: User exists:', !!$user);
    }

    async function loadTemplate() {
        if (!templateId) return;
        
        const { data, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (templateError) {
            console.error('Template fetch error:', templateError);
            error = 'Failed to load template';
            return;
        }

        template = data;
        loading = false;
        initializeFormData();
    }

    function initializeFormData() {
        if (!template?.template_elements) return;

        template.template_elements.forEach((element) => {
            if (!element.variableName) return;
            
            if (element.type === 'text' || element.type === 'selection') {
                formData[element.variableName] = element.content || '';
                
                if (element.type === 'selection') {
                    selectedOptions[element.variableName] = {
                        value: formData[element.variableName],
                        label: formData[element.variableName] || 'Select an option'
                    };
                }
            } else if (element.type === 'photo' || element.type === 'signature') {
                fileUploads[element.variableName] = null;
                imagePositions[element.variableName] = {
                    x: 0,
                    y: 0,
                    width: element.width || 100,
                    height: element.height || 100,
                    scale: 1
                };
            }
        });
    }

    onMount(async () => {
        console.log('Use Template Page: Mounted');
        if (!$session) {
            goto('/auth');
            return;
        }
        
        await loadTemplate();
    });

    function handleCanvasReady(side: 'front' | 'back') {
        if (side === 'front') {
            frontCanvasReady = true;
        } else {
            backCanvasReady = true;
        }
    }

    function handleSelectionChange(event: CustomEvent<SelectOption>, variableName: string) {
        const selection = event.detail;
        formData[variableName] = selection.value;
        selectedOptions[variableName] = {
            value: selection.value,
            label: selection.label
        };
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

    async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!template || !frontCanvasComponent || !backCanvasComponent) return;

    loading = true;
    error = null;

    try {
        if (!validateForm()) {
            loading = false;
            return;
        }

        const formDataToSubmit = new FormData();
        formDataToSubmit.append('templateId', template.id);

        // Get rendered images from canvases using renderFullResolution
        const [frontBlob, backBlob] = await Promise.all([
            frontCanvasComponent.renderFullResolution(),
            backCanvasComponent.renderFullResolution()
        ]);

        formDataToSubmit.append('frontImage', frontBlob);
        formDataToSubmit.append('backImage', backBlob);

        // Add form fields with proper prefix
        for (const [key, value] of Object.entries(formData)) {
            formDataToSubmit.append(`form_${key}`, value);
        }

        // Add file uploads
        for (const [key, file] of Object.entries(fileUploads)) {
            if (file) {
                formDataToSubmit.append(`upload_${key}`, file);
            }
        }

        const response = await fetch('?/saveIdCard', {
            method: 'POST',
            body: formDataToSubmit
        });

        const result = await response.json();

        if (result.type === 'success') {
            goto('/all-ids');
        } else {
            error = result.data?.message || 'Failed to save ID card';
            addDebugMessage(`Error: ${error}`);
        }
    } catch (err) {
        console.error('Error submitting form:', err);
        error = err instanceof Error ? err.message : 'Failed to submit form';
        addDebugMessage(`Error: ${error}`);
    } finally {
        loading = false;
    }
}

    function handleMouseDown() {
        mouseMoving = true;
    }

    function handleMouseUp() {
        mouseMoving = false;
    }

    function handleToggle(checked: boolean) {
        darkMode.set(checked);
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
        if (!input.files?.length) return;

        const file = input.files[0];
        fileUploads[variableName] = file;

        // Revoke old URL if it exists
        if (fileUrls[variableName]) {
            URL.revokeObjectURL(fileUrls[variableName]);
        }

        // Create and store new URL
        const url = URL.createObjectURL(file);
        fileUrls[variableName] = url;
    }

    function validateForm(): boolean {
    formErrors = {};
    let isValid = true;
    let emptyFields: string[] = [];

    if (!template) return false;

    template.template_elements.forEach((element) => {
        if (!element.variableName) return;

        if (element.type === 'text' || element.type === 'selection') {
            if (!formData[element.variableName]?.trim()) {
                formErrors[element.variableName] = true;
                emptyFields.push(element.variableName);
                isValid = false;
            }
        }
        // Removed validation for photo and signature fields since they're optional
    });

    if (!isValid) {
        addDebugMessage(`Please fill in the following fields: ${emptyFields.join(', ')}`);
    }

    return isValid;
}
    function addDebugMessage(message: string) {
        debugMessages = [...debugMessages, message];
    }

    onDestroy(() => {
        // Clean up file URLs
        Object.values(fileUrls).forEach(URL.revokeObjectURL);
    });
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
                                isDragging={mouseMoving}
                                on:ready={() => handleCanvasReady('front')}
                                on:error={({ detail }) => addDebugMessage(`Front Canvas Error: ${detail.code} - ${detail.message}`)}
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
                                isDragging={mouseMoving}
                                on:ready={() => handleCanvasReady('back')}
                                on:error={({ detail }) => addDebugMessage(`Back Canvas Error: ${detail.code} - ${detail.message}`)}
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

                </div>
                <p class="text-muted-foreground mb-6">Please fill out these details for your ID card.</p>

                {#if template && template.template_elements}
                    <form 
                        bind:this={formElement}
                        action="?/saveIdCard"
                        method="POST"
                        enctype="multipart/form-data"
                        on:submit|preventDefault={handleSubmit}
                        use:enhance
                    >
                        {#each template.template_elements as element (element.variableName)}
                            {#if element.variableName}
                                <div role="button" tabindex="-1" class="grid grid-cols-[auto,1fr] gap-4 items-center" 
                                    on:mousedown={handleMouseDown} 
                                    on:mouseup={handleMouseUp}>
                                    <Label for={element.variableName} class="text-right">
                                        {element.variableName}
                                        {#if element.type === 'text' || element.type === 'selection'}
                                            <span class="text-red-500">*</span>
                                        {/if}
                                    </Label>
                                    {#if element.type === 'text'}
                                        <div class="w-full">
                                            <input 
                                                type="text"
                                                id={element.variableName}
                                                name={element.variableName}
                                                bind:value={formData[element.variableName]}
                                                class="w-full px-3 py-2 border rounded-md {formErrors[element.variableName] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}"
                                                placeholder={`Enter ${element.variableName}`}
                                            />
                                            {#if formErrors[element.variableName]}
                                                <p class="mt-1 text-sm text-red-500">This field is required</p>
                                            {/if}
                                        </div>
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
                                                        // Clear error when value is selected
                                                        if (formErrors[element.variableName]) {
                                                            formErrors[element.variableName] = false;
                                                        }
                                                    }
                                                }}
                                            >
                                                <Select.Trigger class="w-full {formErrors[element.variableName] ? 'border-red-500 ring-1 ring-red-500' : ''}">
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
                                            {#if formErrors[element.variableName]}
                                                <p class="mt-1 text-sm text-red-500">Please select an option</p>
                                            {/if}
                                        </div>

                                    {:else if element.type === 'photo' || element.type === 'signature'}
                                        <ThumbnailInput
                                            width={element.width || 100}
                                            height={element.height || 100}
                                            fileUrl={fileUrls[element.variableName]}
                                            initialScale={imagePositions[element.variableName]?.scale ?? 1}
                                            initialX={imagePositions[element.variableName]?.x ?? 0}
                                            initialY={imagePositions[element.variableName]?.y ?? 0}
                                            isSignature={element.type === 'signature'}
                                            on:selectFile={() => handleSelectFile(element.variableName)}
                                            on:update={(e) => handleImageUpdate(e, element.variableName)}
                                        />
                                    {/if}
                                </div>
                            {/if}
                        {/each}
                        <Button type="submit" class="w-full mt-6" disabled={loading}>
                            {#if loading}
                                <Loader class="mr-2 h-4 w-4 animate-spin" />
                            {/if}
                            Generate and Save ID Card
                        </Button>
                    </form>
                {/if}

                {#if debugMessages.length > 0}
                    <div class="mt-6 p-4 rounded-lg {$darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'} border {$darkMode ? 'border-gray-700' : 'border-gray-300'}">
                        <h3 class="font-bold mb-2 {$darkMode ? 'text-gray-100' : 'text-gray-800'}">Debug Messages:</h3>
                        <div class="space-y-1">
                            {#each debugMessages as message}
                                <div class="py-1 {$darkMode ? 'text-gray-300' : 'text-gray-700'}">{message}</div>
                            {/each}
                        </div>
                    </div>
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