<script lang="ts">
    import { onMount } from 'svelte';
    import type { TemplateElement } from '$lib/types/types';
    import ElementList from './ElementList.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Upload, Image, Plus, X } from 'lucide-svelte';
    import { loadGoogleFonts, getAllFontFamilies, isFontLoaded, fonts } from '../config/fonts';



    let { 
        side, 
        preview, 
        elements,
        onUpdateElements, // (elements:TemplateElement[], side: 'front' | 'back')
        onImageUpload, // (files: File[], side: 'front' | 'back')
        onRemoveImage,  // (side: 'front' | 'back')
        // New props for dynamic sizing
        cardSize = null,
        pixelDimensions = null
    }= $props();


    // let currentElements = $state(elements);
    // Legacy dimensions for fallback
    const LEGACY_WIDTH = 506.5;
    const LEGACY_HEIGHT = 319;
    const BASE_WIDTH = 1013;
    const BASE_HEIGHT = 638;
    
    // Calculate dynamic base dimensions
    let baseDimensions = $derived(() => {
        if (pixelDimensions) {
            // Use actual pixel dimensions, scaled down for UI
            const maxWidth = 600; // Max width for preview
            const scale = Math.min(maxWidth / pixelDimensions.width, maxWidth / pixelDimensions.height);
            return {
                width: pixelDimensions.width * scale,
                height: pixelDimensions.height * scale,
                actualWidth: pixelDimensions.width,
                actualHeight: pixelDimensions.height
            };
        }
        // Fallback to legacy dimensions
        return {
            width: LEGACY_WIDTH,
            height: LEGACY_HEIGHT,
            actualWidth: 1013,
            actualHeight: 638
        };
    });



    let files: File[] = $state([]);
    let isDragging = false;
    let isResizing = false;
    let startX: number, startY: number;
    let currentElementIndex: number | null = null;
    let resizeHandle: string | null = null;
    let templateContainer: HTMLElement | undefined = $state();
    let fontOptions: string[] = $state([]);
    let fontsLoaded = false;
    let previewDimensions = $state({
        width: LEGACY_WIDTH,
        height: LEGACY_HEIGHT,
        scale: 1
    });

    function updatePreviewDimensions() {
        if (!templateContainer?.parentElement) return;

        const currentBase = baseDimensions();
        const parentWidth = templateContainer.parentElement.offsetWidth;
        const containerWidth = Math.min(parentWidth, currentBase.width);
        const containerHeight = (containerWidth / currentBase.width) * currentBase.height;
        const scale = containerWidth / currentBase.width;

        previewDimensions = {
            width: containerWidth,
            height: containerHeight,
            scale
        };

        return previewDimensions;
    }

    onMount(() => {
        if (elements.length === 0) {
            elements = side === 'front' ? [...defaultFrontElements] : [...defaultBackElements];
        }
        
        loadGoogleFonts().then(() => {
            fontOptions = getAllFontFamilies();
            fontsLoaded = true;
        }).catch(error => {
            console.error('Error loading some Google Fonts:', error);
            fontOptions = getAllFontFamilies();
            fontsLoaded = true;
        });

        const resizeObserver = new ResizeObserver(() => {
            updatePreviewDimensions();
        });

        if (templateContainer?.parentElement) {
            resizeObserver.observe(templateContainer.parentElement);
            updatePreviewDimensions();
        }

        return () => resizeObserver.disconnect();
    });


    function updateElements() {
        onUpdateElements?.(elements.map((el: TemplateElement) => ({ ...el, side })), side);
    }

    function limitDragBounds(index: number, x: number, y: number, width?: number, height?: number, metrics?: TextMetrics) {
        elements = elements.map((el: TemplateElement, i: number) => {
            if (i === index) {
                let newEl = { ...el, side };
                if (templateContainer) {
                    const maxX = BASE_WIDTH - (newEl.width || 0);
                    const maxY = BASE_HEIGHT - (newEl.height || 0);

                    newEl.x = Math.min(Math.max(x, 0), maxX);
                    newEl.y = Math.min(Math.max(y, 0), maxY);

                    if ((el.type === 'photo' || el.type === 'signature') && width && height) {
                        newEl.width = Math.max(20, Math.round(width));
                        newEl.height = Math.max(20, Math.round(height));
                    } else if (el.type === 'text' && metrics) {
                        newEl.width = Math.max(20, Math.round(metrics.width / previewDimensions.scale));
                    }
                }
                return newEl;
            }
            return el;
        });
        updateElements();
    }

    function onMouseDown(event: MouseEvent, index: number, handle: string | null = null) {
        if (handle) {
            isResizing = true;
            resizeHandle = handle;
        } else {
            isDragging = true;
        }
        currentElementIndex = index;
        startX = event.clientX;
        startY = event.clientY;
        event.preventDefault();
    }

    function onMouseMove(event: MouseEvent) {
        if ((!isDragging && !isResizing) || currentElementIndex === null) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        const scaledDx = dx / previewDimensions.scale;
        const scaledDy = dy / previewDimensions.scale;

        const element = elements[currentElementIndex];
        if (!element) return;

        const updatedElements = [...elements];
        const updatedElement = { ...element };

        if (isResizing && element.width !== undefined && element.height !== undefined) {
            let newWidth = element.width;
            let newHeight = element.height;
            let newX = element.x || 0;
            let newY = element.y || 0;

            switch (resizeHandle) {
                case 'top-left':
                    newWidth -= scaledDx;
                    newHeight -= scaledDy;
                    newX += scaledDx;
                    newY += scaledDy;
                    break;
                case 'top-right':
                    newWidth += scaledDx;
                    newHeight -= scaledDy;
                    newY += scaledDy;
                    break;
                case 'bottom-left':
                    newWidth -= scaledDx;
                    newHeight += scaledDy;
                    newX += scaledDx;
                    break;
                case 'bottom-right':
                    newWidth += scaledDx;
                    newHeight += scaledDy;
                    break;
            }

            newX = Math.max(0, Math.min(newX, BASE_WIDTH - newWidth));
            newY = Math.max(0, Math.min(newY, BASE_HEIGHT - newHeight));

            updatedElement.x = newX;
            updatedElement.y = newY;
            updatedElement.width = Math.max(20, newWidth);
            updatedElement.height = Math.max(20, newHeight);
        } else {
            // Just update position during dragging, maintain original size
            const newX = Math.max(0, Math.min((element.x || 0) + scaledDx, BASE_WIDTH - (element.width || 0)));
            const newY = Math.max(0, Math.min((element.y || 0) + scaledDy, BASE_HEIGHT - (element.height || 0)));
            
            updatedElement.x = newX;
            updatedElement.y = newY;
        }

        updatedElements[currentElementIndex] = updatedElement;
        onUpdateElements(updatedElements, side);

        startX = event.clientX;
        startY = event.clientY;
    }

    function onMouseUp() {
        isDragging = false;
        isResizing = false;
        currentElementIndex = null;
        resizeHandle = null;
    }


    const defaultFrontElements: TemplateElement[] = [
    { 
        id: 'licenseNo',
        variableName: 'licenseNo', 
        type: 'text', 
        content: '75-005-24', 
        x: 293, 
        y: 159, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 16, 
        color: '#000000', 
        alignment: 'left',
        side: 'front'
    },
    { 
        id: 'valid',
        variableName: 'valid', 
        type: 'text', 
        content: '01/01/2026', 
        x: 295, 
        y: 179, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 16, 
        color: '#000000', 
        alignment: 'left',
        side: 'front'
    },
    { 
        id: 'name',
        variableName: 'name', 
        type: 'text', 
        content: 'Junifer D. Oban', 
        x: 256, 
        y: 246, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 21, 
        color: '#000000', 
        alignment: 'left',
        side: 'front'
    },
    { 
        id: 'photo',
        variableName: 'photo', 
        type: 'photo', 
        x: 50, 
        y: 131, 
        width: 119,
        height: 158,
        side: 'front'
    },
    { 
        id: 'signature',
        variableName: 'signature', 
        type: 'signature', 
        x: 263, 
        y: 196, 
        width: 152,
        height: 65,
        side: 'front'
    },
    { 
        id: 'idType',
        variableName: 'idType', 
        type: 'selection', 
        options: ['Ministerial License', 'Ordination License', 'Local License'], 
        x: 198, 
        y: 131, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 16, 
        color: '#000000', 
        alignment: 'left',
        side: 'front'
    },
    { 
        id: 'position',
        variableName: 'position', 
        type: 'selection', 
        options: ['General Treasurer', 'General Secretary', 'District Superintendent', 'Pastor'], 
        x: 276, 
        y: 270, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 16, 
        color: '#000000', 
        alignment: 'left',
        side: 'front'
    }
];

const defaultBackElements: TemplateElement[] = [
    { 
        id: 'contactName',
        variableName: 'contactName', 
        type: 'text', 
        content: 'Ralph Steven D. Trigo', 
        x: 113, 
        y: 36, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 13, 
        color: '#000000', 
        alignment: 'left',
        side: 'back'
    },
    { 
        id: 'addresss',
        variableName: 'addresss', 
        type: 'text', 
        content: 'San Isidro District', 
        x: 112, 
        y: 55, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 13, 
        color: '#000000', 
        alignment: 'left',
        side: 'back'
    },
    { 
        id: 'contactNo',
        variableName: 'contactNo', 
        type: 'text', 
        content: '9478920644', 
        x: 112, 
        y: 74, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 13, 
        color: '#000000', 
        alignment: 'left',
        side: 'back'
    },
    { 
        id: 'tin',
        variableName: 'tin', 
        type: 'text', 
        content: '943-403-393', 
        x: 133, 
        y: 115, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 13, 
        color: '#000000', 
        alignment: 'left',
        side: 'back'
    },
    { 
        id: 'sss',
        variableName: 'sss', 
        type: 'text', 
        content: '943-403-393', 
        x: 133, 
        y: 138, 
        width: 100,
        height: 20,
        font: 'Arial', 
        size: 13, 
        color: '#000000', 
        alignment: 'left',
        side: 'back'
    }
];

    let elementStyle = $derived((element: TemplateElement) => ({
        left: `${(element.x || 0) * previewDimensions.scale}px`,
        top: `${(element.y || 0) * previewDimensions.scale}px`,
        width: `${((element.width || 0) * previewDimensions.scale)}px`,
        height: `${((element.height || 0) * previewDimensions.scale)}px`
    }));

    let textStyle = $derived((element: TemplateElement) => ({
        'font-family': `"${element.font || 'Arial'}", sans-serif`,
        'font-weight': element.fontWeight || '400',
        'font-style': element.fontStyle || 'normal',
        'font-size': `${((element.size || 16) * previewDimensions.scale)}px`,
        'color': element.color || '#000000',
        'text-align': element.alignment || 'left',
        'text-transform': element.textTransform || 'none',
        'text-decoration-line': element.textDecoration || 'none',
        'letter-spacing': element.letterSpacing ? `${element.letterSpacing * previewDimensions.scale}px` : 'normal',
        'line-height': element.lineHeight || '1.2',
        'opacity': typeof element.opacity === 'number' ? element.opacity : 1,
        'display': 'block',
        'width': '100%',
        'white-space': 'pre-wrap',
        'word-break': 'break-word'
    }));



    function stopPropagation(fn: (e: MouseEvent) => void) {
        return (e: MouseEvent) => {
            e.stopPropagation();
            fn(e);
        };
    }
</script>
<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="template-section">
    <h2 class="text-2xl font-semibold mb-4 text-foreground">{side.charAt(0).toUpperCase() + side.slice(1)} Template</h2>
    <div class="template-layout">
        <div class="preview-container" 
             style="max-width: {baseDimensions().width}px; aspect-ratio: {baseDimensions().width}/{baseDimensions().height};">
            <div 
                class="template-container {side} group" 
                class:has-preview={preview}
                bind:this={templateContainer}
                style="background-image: {preview ? `url('${preview}')` : 'none'};"
            >
                {#if !preview}
                    <div class="placeholder-design">
                        <div class="placeholder-content">
                            <div class="icon-container">
                                <Image class="w-8 h-8 mb-2 text-muted-foreground/40" />
                                <Plus class="w-4 h-4 text-primary absolute -right-1 -bottom-1" />
                            </div>
                            <h3 class="text-lg font-medium text-foreground/80 mb-1">Add Template Background</h3>
                            <p class="text-sm text-muted-foreground mb-4">
                                Required size: {baseDimensions().actualWidth}×{baseDimensions().actualHeight} pixels
                                {#if cardSize}
                                    <br>
                                    <span class="text-xs">
                                        ({cardSize.width}{cardSize.unit === 'inches' ? '"' : cardSize.unit === 'mm' ? 'mm' : cardSize.unit === 'cm' ? 'cm' : 'px'} × {cardSize.height}{cardSize.unit === 'inches' ? '"' : cardSize.unit === 'mm' ? 'mm' : cardSize.unit === 'cm' ? 'cm' : 'px'} at 300 DPI)
                                    </span>
                                {/if}
                            </p>
                            <label class="upload-button">
                                <input type="file" accept="image/*" onchange={(e) => onImageUpload(e,side)} />
                                <span class="upload-text">
                                    <Upload class="w-4 h-4 mr-2" />
                                    Choose File
                                </span>
                            </label>
                        </div>
                        <div class="placeholder-grid"></div>
                    </div>
                {:else}
                    {#each elements as element, i}
                        <div
                            class="template-element {element.type}"
                            style={Object.entries(elementStyle(element))
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(';')}
                            onmousedown={(e) => onMouseDown(e, i)}
                            role="button"
                            tabindex="0"
                            aria-label="{element.type} element"
                        >
                            {#if element.type === 'text' || element.type === 'selection'}
                            <span style={Object.entries(textStyle(element))
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(';')}>
                                {element.type === 'selection' ? (element.content || element.options?.[0] || 'Select option') : element.content}
                            </span>
                        {:else if element.type === 'photo'}
                            <div class="placeholder photo-placeholder">
                                <span>Photo Area</span>
                            </div>
                        {:else if element.type === 'signature'}
                            <div class="placeholder signature-placeholder">
                                <span>Signature Area</span>
                            </div>
                        {/if}
                        <div class="resize-handles">
                            <div class="resize-handle top-left" onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-left'))} role="button" tabindex="0" aria-label="Resize top left"></div>
                            <div class="resize-handle top-right" onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-right'))} role="button" tabindex="0" aria-label="Resize top right"></div>
                            <div class="resize-handle bottom-left" onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-left'))} role="button" tabindex="0" aria-label="Resize bottom left"></div>
                            <div class="resize-handle bottom-right" onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-right'))} role="button" tabindex="0" aria-label="Resize bottom right"></div>
                        </div>
                    </div>
                {/each}
                <Button variant="destructive" size="icon" class="remove-image" onclick={onRemoveImage}>
                    <X class="w-4 h-4" />
                </Button>
            {/if}
        </div>
    </div>
    {#if preview}
        <ElementList 
           {elements}
           {onUpdateElements}
            {fontOptions} 
            {side}
        />
    {/if}
</div>
</div>

<style>
.template-section {
    margin-bottom: 2.5rem;
    width: 100%;
    padding: 1rem;
}

.template-layout {
    display: flex;
    gap: 1.25rem;
    width: 100%;
    flex-direction: column;
}

@media (min-width: 1024px) {
    .template-layout {
        flex-direction: row;
        align-items: flex-start;
    }

    .preview-container {
        flex: 0 0 600px;
        max-width: 600px;
    }
}

.preview-container {
    width: 100%;
    max-width: 600px;
    /* aspect-ratio is now set dynamically via style attribute */
    position: relative;
    background: var(--background);
}

.template-container {
    width: 100%;
    height: 100%;
    border: 1px solid #000;
    position: relative;
    background-size: cover;
    background-position: center;
    overflow: hidden;
}

.placeholder-design {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
}

.placeholder-content {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 1.5rem;
}

.icon-container {
    position: relative;
    display: inline-flex;
    margin-bottom: 1rem;
}

.placeholder-grid {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    pointer-events: none;
    background-image: linear-gradient(to right, var(--primary) 1px, transparent 1px),
                     linear-gradient(to bottom, var(--primary) 1px, transparent 1px);
    background-size: 20px 20px;
}

.template-element {
    position: absolute;
    cursor: move;
    border: 1px solid cyan;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
    box-sizing: border-box;
    opacity: 0.5;
}

.template-element:hover {
    opacity: 1;
}

.resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: white;
    border: 1px solid #000;
    border-radius: 50%;
    display: none;
}

.template-element:hover .resize-handle {
    display: block;
}

.template-element.text span {
    display: block;
    width: 100%;
    cursor: move;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.placeholder {
    background-color: rgba(200, 200, 200, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    width: 100%;
    height: 100%;
}

.upload-button {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: var(--primary);
    color: white;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.upload-button:hover {
    background-color: var(--primary-hover);
}

.upload-button input[type="file"] {
    display: none;
}

.upload-text {
    display: inline-flex;
    align-items: center;
    font-size: 0.875rem;
}

.remove-image {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
}

.resize-handle.top-left { top: -4px; left: -4px; cursor: nwse-resize; }
.resize-handle.top-right { top: -4px; right: -4px; cursor: nesw-resize; }
.resize-handle.bottom-left { bottom: -4px; left: -4px; cursor: nesw-resize; }
.resize-handle.bottom-right { bottom: -4px; right: -4px; cursor: nwse-resize; }
</style>