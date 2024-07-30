<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';
    import type { TemplateData, TemplateElement } from '../../../stores/templateStore';
    
    let template: TemplateData | null = null;
    let formData: {[key: string]: string} = {};
    let fileUploads: {[key: string]: File | null} = {};
    let imagePositions: {[key: string]: {x: number, y: number, width: number, height: number, scale: number}} = {};
    let errorMessage = '';
    
    let frontFinalCanvas: HTMLCanvasElement;
    let backFinalCanvas: HTMLCanvasElement;
    let MOUSE_MOVING = false
    const PREVIEW_SCALE = 0.5;
    const FULL_WIDTH = 1013;
    const FULL_HEIGHT = 638;
    let elementScale = 2;
    
    onMount(async () => {
        const templateId = $page.params.id;
        await fetchTemplate(templateId);
    });
    
    afterUpdate(() => {
        if (template) {
            renderIdCard();
        }
    });
    
    async function fetchTemplate(id: string) {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('id', id)
                .single();
    
            if (error) throw error;
    
            template = data as TemplateData;
            initializeFormData();
            console.log('Template fetched:', template);
        } catch (error) {
            console.error('Error fetching template:', error);
            errorMessage = 'Failed to load template';
        }
    }
    
    function initializeFormData() {
        if (template) {
            template.template_elements.forEach(el => {
                if (el.type === 'text') {
                    formData[el.variableName] = el.content || '';
                } else {
                    fileUploads[el.variableName] = null;
                    imagePositions[el.variableName] = {
                        x: el.x || 0,
                        y: el.y || 0,
                        width: el.width || 100,
                        height: el.height || 100,
                        scale: 1
                    };
                }
            });
        }
    }
    
    function handleFileUpload(event: Event, variableName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        fileUploads[variableName] = input.files[0];
        formData[variableName] = input.files[0].name; // Update formData with file name
        renderIdCard();
    }
}
    
    let isRendering = false;

async function renderIdCard(fullResolution = false) {
    if (!template || !frontFinalCanvas || !backFinalCanvas || isRendering) {
        return;
    }

    isRendering = true;

    const scale = fullResolution ? 1 : PREVIEW_SCALE;
    const width = FULL_WIDTH * scale;
    const height = FULL_HEIGHT * scale;

    const renderSide = async (
        canvas: HTMLCanvasElement,
        elements: TemplateElement[],
        backgroundUrl: string
    ) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        canvas.width = width;
        canvas.height = height;

        try {
            const backgroundImage = await loadImage(backgroundUrl);
            ctx.drawImage(backgroundImage, 0, 0, width, height);
        } catch (error) {
            console.error('Error loading background image:', error);
        }

        ctx.save();
        ctx.scale(scale * elementScale, scale * elementScale);
        for (const element of elements) {
    if (element.type === 'text') {
        ctx.font = `${element.size || 12}px ${element.font || 'Arial'}`;
        ctx.fillStyle = element.color || 'black';
        ctx.textAlign = element.alignment as CanvasTextAlign ;

        const text = formData[element.variableName] || '';
        const textMetrics = ctx.measureText(text);

        let x = element.x || 0;
        let y = (element.y || 0) + textMetrics.hangingBaseline; // Adjust y position based on the baseline

        // Adjust x position based on alignment
        if (element.alignment === 'center') {
            x =   ((element.width ||0 )*1.1)
        } else if (element.alignment === 'right') {
            x += (element.width || 0) 
        }

        ctx.fillText(text, x, y);
    
            } else if (element.type === 'photo' || element.type === 'signature') {
                const file = fileUploads[element.variableName];
                const pos = imagePositions[element.variableName];

                ctx.save();
                ctx.beginPath();
                ctx.rect(pos.x, pos.y, element.width || 100, element.height || 100);
                ctx.clip();

                if (file) {
                    try {
                        const image = await loadImage(URL.createObjectURL(file));
                        const aspectRatio = image.width / image.height;
                        let scaledWidth = pos.width * pos.scale;
                        let scaledHeight = scaledWidth / aspectRatio;

                        if (scaledHeight > pos.height * pos.scale) {
                            scaledHeight = pos.height * pos.scale;
                            scaledWidth = scaledHeight * aspectRatio;
                        }

                        ctx.drawImage(
                            image,
                            pos.x + ((element.width || 100) - scaledWidth) / 2,
                            pos.y + ((element.height || 100) - scaledHeight) / 2,
                            scaledWidth,
                            scaledHeight
                        );
                    } catch (error) {
                        console.error(`Error loading image for ${element.variableName}:`, error);
                    }
                } else {
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fillRect(pos.x, pos.y, element.width || 100, element.height || 100);
                    ctx.strokeStyle = '#999';
                    ctx.strokeRect(pos.x, pos.y, element.width || 100, element.height || 100);
                    ctx.fillStyle = '#999';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(element.type, pos.x + (element.width || 100) / 2, pos.y + (element.height || 100) / 2);
                }

                ctx.restore();
            }
        }
        ctx.restore();
    };

    await renderSide(frontFinalCanvas, template.template_elements.filter(el => el.side === 'front'), template.front_background);
   
   if (!MOUSE_MOVING)  {
    await renderSide(backFinalCanvas, template.template_elements.filter(el => el.side === 'back'), template.back_background);
}
    isRendering = false;
}

    function loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
    
    async function saveIdCard() {
        if (!template) {
            errorMessage = "Template not loaded";
            return;
        }
    
        try {
            // Render full resolution
            await renderIdCard(true);
    
            const frontBlob = await new Promise<Blob | null>(resolve => frontFinalCanvas.toBlob(resolve, 'image/png'));
            const backBlob = await new Promise<Blob | null>(resolve => backFinalCanvas.toBlob(resolve, 'image/png'));
    
            if (!frontBlob || !backBlob) throw new Error('Failed to create blobs from canvases');
    
            const timestamp = Date.now();
            const frontUpload = await uploadToStorage('rendered-id-cards', `${template.id}/front_${timestamp}.png`, frontBlob);
            const backUpload = await uploadToStorage('rendered-id-cards', `${template.id}/back_${timestamp}.png`, backBlob);
    
            const { data, error } = await supabase
                .from('idcards')
                .insert({
                    template_id: template.id,
                    front_image: frontUpload,
                    back_image: backUpload,
                    data: JSON.stringify({ ...formData, ...fileUploads, imagePositions })
                });
    
            if (error) throw error;
    
            console.log('ID card saved successfully:', data);
            alert('ID card saved successfully!');
    
            // Revert to preview scale
            renderIdCard();
        } catch (error) {
            console.error('Error saving ID card:', error);
            errorMessage = `Failed to save ID card: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        }
    }
    
    async function uploadToStorage(bucket: string, path: string, file: Blob): Promise<string> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });
    
        if (error) throw error;
        return data.path;
    }
    
    // function adjustElementScale(event: Event) {
    //     elementScale = parseFloat((event.target as HTMLInputElement).value);
    //     renderIdCard();
    // }
    
    function startResize(event: MouseEvent, variableName: string) {
    const startX = event.clientX;
    const startY = event.clientY;
    const startScale = imagePositions[variableName].scale;

    function onMouseMove(e: MouseEvent) {
        MOUSE_MOVING = true
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newScale = Math.max(0.1, startScale + Math.max(dx, dy) / 100);
        imagePositions[variableName] = {
            ...imagePositions[variableName],
            scale: newScale
        };
        renderIdCard();
        
    }

    function onMouseUp() {
        MOUSE_MOVING = false
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}



    function handleInputChange() {
        renderIdCard();
    }
    </script>
    
    <div class="use-template-container">
        <div class="preview-container">
            <div class="canvas-wrapper" class:landscape={template?.orientation === 'landscape'} class:portrait={template?.orientation === 'portrait'}>
                <div>
                    <h3>Front</h3>
                    <canvas bind:this={frontFinalCanvas}></canvas>
                </div>
                <div>
                    <h3>Back</h3>
                    <canvas bind:this={backFinalCanvas}></canvas>
                </div>
            </div>
            <!-- <div class="scale-control">
                <label for="elementScale">Element Scale:</label>
                <input type="range" id="elementScale" min="0.5" max="1.5" step="0.1" value={elementScale} on:input={adjustElementScale}>
                <span>{elementScale.toFixed(1)}</span>
            </div> -->
        </div>
        <div class="form-container">
            <h1>Use Template</h1>
            {#if template}
            <form on:submit|preventDefault={saveIdCard}>
                {#each template.template_elements as element (element.variableName)}
                    <div class="form-group">
                        <label for={element.variableName}>{element.variableName}</label>
                        {#if element.type === 'text'}
                        <input 
                            type="text"
                            id={element.variableName}
                            bind:value={formData[element.variableName]}
                            on:input={handleInputChange}
                        >
                    {:else if element.type === 'photo' || element.type === 'signature'}
                        <input 
                            type="file"
                            id={element.variableName}
                            accept={element.type === 'photo' ? 'image/*' : 'image/png'}
                            on:change={(e) => handleFileUpload(e, element.variableName)}
                        >
                        {#if fileUploads[element.variableName]}
                            <div 
                                class="resize-handle" 
                                role="button"
                                tabindex="0"
                                on:mousedown={(e) => startResize(e, element.variableName)}
                            >
                                Resize
                            </div>
                        {/if}
                    {/if}
                    
                    
                    </div>
                {/each}
                <button type="submit">Generate and Save ID Card</button>
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
            flex-direction: column;
            justify-content: center;
            align-items: center;
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
    
        canvas {
            border: 1px solid #ccc;
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
        .resize-handle {
        cursor: se-resize;
        background-color: #007bff;
        color: white;
        padding: 2px 5px;
        font-size: 12px;
        display: inline-block;
        margin-left: 10px;
    }

    </style>