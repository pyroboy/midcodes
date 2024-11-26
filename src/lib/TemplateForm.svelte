<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { templateData } from '../stores/templateStore';
    import type { TemplateData, TemplateElement } from '../stores/templateStore';
    import ElementList from './ElementList.svelte';
    import PositionGroup from './PositionGroup.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Upload, Image, Plus, X } from 'lucide-svelte';
    import { loadGoogleFonts, getAllFontFamilies, isFontLoaded, fonts } from './config/fonts';

    export let side: 'front' | 'back';
    export let preview: string | null;
    export let elements: TemplateElement[];

    const dispatch = createEventDispatcher();

    let isDragging = false;
    let isResizing = false;
    let startX: number, startY: number;
    let currentElementIndex: number | null = null;
    let resizeHandle: string | null = null;
    let templateContainer: HTMLElement;
    let fontOptions: string[] = [];
    let fontsLoaded = false;
    onMount(async () => {
        if (elements.length === 0) {
            elements = side === 'front' ? [...defaultFrontElements] : [...defaultBackElements];
            updateStore();
        }
        
        try {
            await loadGoogleFonts();
            fontOptions = getAllFontFamilies();
            fontsLoaded = true;
            console.log('Loaded fonts:', fontOptions);
        } catch (error) {
            console.error('Error loading some Google Fonts:', error);
            // Still use all available fonts even if some failed to load
            fontOptions = getAllFontFamilies();
            fontsLoaded = true;
            console.log('Using available fonts:', fontOptions);
        }
    });

    $: textStyle = (element: TemplateElement) => {
    const fontFamily = element.font || 'Arial';
    return {
        'font-family': `"${fontFamily}", ${getFontFallback(fontFamily)}`,
        'font-weight': element.fontWeight || '400',
        'font-style': element.fontStyle || 'normal',
        'font-size': `${element.size}px`,
        'color': element.color || '#000000',
        'text-align': element.alignment || 'left',
        'text-transform': element.textTransform || 'none',
        'text-decoration': element.textDecoration || 'none',
        'letter-spacing': element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
        'line-height': element.lineHeight || 'normal',
        'opacity': element.opacity || 1,
        'display': 'block', // This ensures text-align works properly
        'width': '100%'    // This ensures text-align affects the full width
    };
};

function getFontFallback(font: string): string {
    const fontConfig = fonts.find(f => f.family === font);
    return fontConfig?.category || 'sans-serif';
}



    function updateStore() {
        templateData.update((data: TemplateData) => {
            const updatedElements = data.template_elements.filter((el: TemplateElement) => el.side !== side);
            return {
                ...data,
                template_elements: [...updatedElements, ...elements.map(el => ({ ...el, side }))],
                fonts: fontOptions
            };
        });
    }

    function limitDragBounds(index: number, x: number, y: number, width?: number, height?: number, metrics?: TextMetrics) {
        elements = elements.map((el, i) => {
            if (i === index) {
                let newEl = { ...el, side };
                if (templateContainer) {
                    const containerRect = templateContainer.getBoundingClientRect();
                    const maxX = containerRect.width - (newEl.width || 0);
                    const maxY = containerRect.height - (newEl.height || 0);

                    newEl.x = Math.min(Math.max(x, 0), maxX);
                    newEl.y = Math.min(Math.max(y, 0), maxY);

                    if ((el.type === 'photo' || el.type === 'signature') && width && height) {
                        newEl.width = Math.max(1, Math.round(width));
                        newEl.height = Math.max(1, Math.round(height));
                    } else if (el.type === 'text') {
                        const elWidth = width || (metrics?.width || 0);
                        newEl.width = Math.max(1, Math.round(elWidth));
                    }
                }
                return newEl;
            }
            return el;
        });
        updateStore();
        dispatch('update', { elements, side });
    }

    function handleImageUpload(event: Event) {
        dispatch('imageUpload', { event, side });
    }

    function removeImage() {
        dispatch('removeImage', { side });
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

        const element = elements[currentElementIndex];

        if (isResizing) {
            let newWidth = element.width || 0;
            let newHeight = element.height || 0;
            let newX = element.x;
            let newY = element.y;

            switch (resizeHandle) {
                case 'top-left':
                    newWidth -= dx;
                    newHeight -= dy;
                    newX += dx;
                    newY += dy;
                    break;
                case 'top-right':
                    newWidth += dx;
                    newHeight -= dy;
                    newY += dy;
                    break;
                case 'bottom-left':
                    newWidth -= dx;
                    newHeight += dy;
                    newX += dx;
                    break;
                case 'bottom-right':
                    newWidth += dx;
                    newHeight += dy;
                    break;
            }

            const containerRect = templateContainer.getBoundingClientRect();
            const maxX = containerRect.width;
            const maxY = containerRect.height;

            newX = Math.max(0, Math.min(newX, maxX - newWidth));
            newY = Math.max(0, Math.min(newY, maxY - newHeight));

            element.x = newX;
            element.y = newY;
            element.width = Math.max(20, newWidth);
            element.height = Math.max(20, newHeight);
        } else {
            const newX = element.x + dx;
            const newY = element.y + dy;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                context.font = `${element.size}px ${element.font}`;
                const metrics = context.measureText(element.content || '');
                limitDragBounds(currentElementIndex, newX, newY, element.width, element.height, metrics);
            }
        }

        startX = event.clientX;
        startY = event.clientY;
        updateStore();
    }

    function onMouseUp() {
        isDragging = false;
        isResizing = false;
        currentElementIndex = null;
        resizeHandle = null;
    }

    function handleElementsUpdate(event: CustomEvent) {
        elements = event.detail.elements;
        updateStore();
        dispatch('update', { elements, side });
    }

    const defaultFrontElements: TemplateElement[] = [
        { variableName: 'licenseNo', type: 'text', side: 'front', content: '75-005-24', x: 293, y: 159, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'valid', type: 'text', side: 'front', content: '01/01/2026', x: 295, y: 179, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'name', type: 'text', side: 'front', content: 'Junifer D. Oban', x: 256, y: 246, font: 'Arial', size: 21, color: '#000000', alignment: 'left' },
        { variableName: 'photo', type: 'photo', side: 'front', x: 50, y: 131, width: 119, height: 158 },
        { variableName: 'signature', type: 'signature', side: 'front', x: 263, y: 196, width: 152, height: 65 },
        { variableName: 'idType', type: 'selection', side: 'front', options: ['Ministerial License', 'Ordination License', 'Local License'], x: 198, y: 131, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'position', type: 'selection', side: 'front', options: ['General Treasurer', 'General Secretary', 'District Superintendent', 'Pastor'], x: 276, y: 270, font: 'Arial', size: 16, color: '#000000', alignment: 'left' }
    ];

    const defaultBackElements: TemplateElement[] = [
        { variableName: 'contactName', type: 'text', side: 'back', content: 'Ralph Steven D. Trigo', x: 113, y: 36, font: 'Arial', size: 13, color: '#000000', alignment: 'left' },
        { variableName: 'addresss', type: 'text', side: 'back', content: 'San Isidro District', x: 112, y: 55, font: 'Arial', size: 13, color: '#000000', alignment: 'left' },
        { variableName: 'contactNo', type: 'text', side: 'back', content: '9478920644', x: 112, y: 74, font: 'Arial', size: 13, color: '#000000', alignment: 'left' },
        { variableName: 'tin', type: 'text', side: 'back', content: '943-403-393', x: 133, y: 115, font: 'Arial', size: 13, color: '#000000', alignment: 'left' },
        { variableName: 'sss', type: 'text', side: 'back', content: '943-403-393', x: 133, y: 138, font: 'Arial', size: 13, color: '#000000', alignment: 'left' }
    ];
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="template-section">
    <h2 class="text-2xl font-semibold mb-4 text-foreground">{side.charAt(0).toUpperCase() + side.slice(1)} Template</h2>
    <div class="template-layout">
        <div class="template-container {side} group" 
             class:has-preview={preview}
             bind:this={templateContainer} 
             style:background-image={preview ? `url('${preview}')` : 'none'}>
            
            {#if !preview}
                <div class="placeholder-design">
                    <div class="placeholder-content">
                        <div class="icon-container">
                            <Image class="w-8 h-8 mb-2 text-muted-foreground/40" />
                            <Plus class="w-4 h-4 text-primary absolute -right-1 -bottom-1" />
                        </div>
                        <h3 class="text-lg font-medium text-foreground/80 mb-1">Add Template Background</h3>
                        <p class="text-sm text-muted-foreground mb-4">Recommended size: 1013x638 pixels</p>
                        <label class="upload-button">
                            <input type="file" accept="image/*" on:change={handleImageUpload} />
                            <span class="upload-text">
                                <Upload class="w-4 h-4 mr-2" />
                                Choose File
                            </span>
                        </label>
                    </div>
                    <div class="placeholder-grid" />
                </div>
            {:else}
                {#each elements as element, i}
                    <div
                        class="template-element {element.type}"
                        style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px;"
                        on:mousedown={(e) => onMouseDown(e, i)}
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
                            <div class="resize-handle top-left" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'top-left')} role="button" tabindex="0" aria-label="Resize top left"></div>
                            <div class="resize-handle top-right" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'top-right')} role="button" tabindex="0" aria-label="Resize top right"></div>
                            <div class="resize-handle bottom-left" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'bottom-left')} role="button" tabindex="0" aria-label="Resize bottom left"></div>
                            <div class="resize-handle bottom-right" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'bottom-right')} role="button" tabindex="0" aria-label="Resize bottom right"></div>
                        </div>
                    </div>
                {/each}
                <Button variant="destructive" size="icon" class="remove-image" on:click={removeImage}>
                    <X class="w-4 h-4" />
                </Button>
            {/if}
        </div>
        {#if preview}
            <ElementList 
                {elements} 
                {fontOptions} 
                on:update={handleElementsUpdate}
            />
        {/if}
    </div>
</div>

<style>
    .template-section {
        margin-bottom: 40px;
    }

    .template-layout {
        display: flex;
        gap: 20px;
    }

    .template-container {
        width: 506.5px;
        height: 319px;
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

    /* Restored Original Styles */
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

    .file-input-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
    }

    .file-input-label input[type="file"] {
        display: none;
    }

    .remove-image {
        position: absolute;
        top: 10px;
        right: 10px;
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .resize-handle.top-left { top: -4px; left: -4px; cursor: nwse-resize; }
    .resize-handle.top-right { top: -4px; right: -4px; cursor: nesw-resize; }
    .resize-handle.bottom-left { bottom: -4px; left: -4px; cursor: nesw-resize; }
    .resize-handle.bottom-right { bottom: -4px; right: -4px; cursor: nwse-resize; }
</style>