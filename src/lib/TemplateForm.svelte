<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { templateData } from '../stores/templateStore';
    import type { TemplateData, TemplateElement } from '../stores/templateStore';

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

    onMount(() => {
        if (elements.length === 0) {
            elements = side === 'front' ? [...defaultFrontElements] : [...defaultBackElements];
            updateStore();
        }
    });


function updateStore() {
    templateData.update((data: TemplateData) => {
        const updatedElements = data.template_elements.filter((el: TemplateElement) => el.side !== side);
        return {
            ...data,
            template_elements: [...updatedElements, ...elements.map(el => ({ ...el, side }))]
        };
    });
}

    function removeElement(index: number) {
        elements = elements.filter((_, i) => i !== index);
        updateStore();
        dispatch('update', { elements, side });
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

    function addElement(type: 'text' | 'photo' | 'signature') {
        const newElement: TemplateElement = {
            variableName: `new_${type}_${Date.now()}`,
            type,
            side,
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            ...(type === 'text' ? { content: 'New Text', font: 'Arial', size: 16, color: '#000000', alignment: 'left' } : {})
        };
        elements = [...elements, newElement];
        updateStore();
        dispatch('update', { elements, side });
    }

    function updateElement() {
        updateStore();
        dispatch('update', { elements, side });
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
                console.log(metrics)
                limitDragBounds(currentElementIndex, newX, newY, element.width, element.height, metrics);
            }
        }

        startX = event.clientX;
        startY = event.clientY;
        updateElement();
    }

    function onMouseUp() {
        isDragging = false;
        isResizing = false;
        currentElementIndex = null;
        resizeHandle = null;
    }

    const fontOptions = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 
        'Impact', 'Brush Script MT', 'Lucida Sans', 'Tahoma', 'Lucida Console', 'Optima'
    ];



    const defaultFrontElements: TemplateElement[] = [
        { variableName: 'licenseNo', type: 'text', side: 'front', content: '75-005-24', x: 293, y: 159, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'valid', type: 'text', side: 'front', content: '01/01/2026', x: 295, y: 179, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'name', type: 'text', side: 'front', content: 'Junifer D. Oban', x: 256, y: 246, font: 'Arial', size: 21, color: '#000000', alignment: 'left' },
        { variableName: 'photo', type: 'photo', side: 'front', x: 50, y: 131, width: 119, height: 158 },
        { variableName: 'signature', type: 'signature', side: 'front', x: 263, y: 196, width: 152, height: 65 },
        { variableName: 'idType', type: 'text', side: 'front', content: 'Ministerial License', x: 198, y: 131, font: 'Arial', size: 16, color: '#000000', alignment: 'left' },
        { variableName: 'position', type: 'text', side: 'front', content: 'General Treasurer', x: 276, y: 270, font: 'Arial', size: 16, color: '#000000', alignment: 'left' }
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
    <h2>{side.charAt(0).toUpperCase() + side.slice(1)} Template</h2>
    <div class="template-layout">
        <div class="template-container {side}" bind:this={templateContainer} style:background-image="url('{preview || '/placeholder-1013x638.png'}')">
            {#if !preview}
                <label class="file-input-label">
                    Choose File
                    <input type="file" accept="image/*" on:change={handleImageUpload} />
                </label>
            {:else}
                <button class="remove-image" on:click={removeImage}>X</button>
            {/if}
            {#if preview}
                {#each elements as element, i}
                    <div
                        id="element-{side}-{i}"
                        class="template-element {element.type}"
                        style="left: {element.x}px; top: {element.y}px; width: {element.width}px; height: {element.height}px;"
                        on:mousedown={(e) => onMouseDown(e, i)}
                        role="button" tabindex="0" aria-label="{element.type} element"
                    >
                        {#if element.type === 'text'}
                            <span style:font-family={element.font} style:font-size="{element.size}px" style:color={element.color} style:text-align={element.alignment}>{element.content}</span>
                        {:else if element.type === 'photo'}
                            <div class="placeholder photo-placeholder">Photo</div>
                        {:else if element.type === 'signature'}
                            <div class="placeholder signature-placeholder">Signature</div>
                        {/if}
                        <div role="button" tabindex="0" aria-label="Resize top-left" class="resize-handle top-left" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'top-left')}></div>
                        <div role="button" tabindex="0" aria-label="Resize top-right" class="resize-handle top-right" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'top-right')}></div>
                        <div role="button" tabindex="0" aria-label="Resize bottom-left" class="resize-handle bottom-left" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'bottom-left')}></div>
                        <div role="button" tabindex="0" aria-label="Resize bottom-right" class="resize-handle bottom-right" on:mousedown|stopPropagation={(e) => onMouseDown(e, i, 'bottom-right')}></div>
                    </div>
                {/each}
            {/if}
        </div>
        {#if preview}
            <div class="element-list">
                <h3>Elements</h3>
                {#each elements as element, i}
                    <div class="element-item">
                        <div class="element-inputs">
                            <label title="Unique identifier for the element">
                                Variable Name:
                                <input bind:value={element.variableName} on:input={updateElement}>
                            </label>
                            {#if element.type === 'text'}
                                <label title="Content of the text element">
                                    Text:
                                    <input bind:value={element.content} on:input={updateElement}>
                                </label>
                                <label title="Horizontal position">
                                    X:
                                    <input type="number" bind:value={element.x} on:input={updateElement}>
                                </label>
                                <label title="Vertical position">
                                    Y:
                                    <input type="number" bind:value={element.y} on:input={updateElement}>
                                </label>
                       <label title="Font family">
    Font:
    <select bind:value={element.font} on:change={updateElement}>
        {#each fontOptions as font}
            <option value={font}>{font}</option>
        {/each}
    </select>
</label>

                                <label title="Font size in pixels">
                                    Size:
                                    <input type="number" bind:value={element.size} on:input={updateElement}>
                                </label>
                                <label title="Text color" class="color-label">
                                    Color:
                                    <input type="color" bind:value={element.color} class="color-input" on:input={updateElement}>
                                </label>
                                <label title="Text alignment">
                                    Alignment:
                                    <select bind:value={element.alignment} on:change={updateElement}>
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                </label>
                                <label title="Width of the element">
                                    Width:
                                    <input type="number" bind:value={element.width} on:input={updateElement}>
                                </label>
                                <label title="Height of the element">
                                    Height:
                                    <input type="number" bind:value={element.height} on:input={updateElement}>
                                </label>
                            {:else if element.type === 'photo' || element.type === 'signature'}
                                <label title="Horizontal position">
                                    X:
                                    <input type="number" bind:value={element.x} on:input={updateElement}>
                                </label>
                                <label title="Vertical position">
                                    Y:
                                    <input type="number" bind:value={element.y} on:input={updateElement}>
                                </label>
                                <label title="Width of the element">
                                    Width:
                                    <input type="number" bind:value={element.width} on:input={updateElement}>
                                </label>
                                <label title="Height of the element">
                                    Height:
                                    <input type="number" bind:value={element.height} on:input={updateElement}>
                                </label>
                            {/if}
                            <button class="remove-element" on:click={() => removeElement(i)}>X</button>
                        </div>
                    </div>
                {/each}
                <button on:click={() => addElement('text')}>Add Text</button>
                <button on:click={() => addElement('photo')}>Add Photo</button>
                <button on:click={() => addElement('signature')}>Add Signature</button>
            </div>
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
    .element-list {
        width: 100%;
        max-width: 600px;
    }
    .element-item {
        margin-bottom: 20px;
    }
    .element-inputs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .element-inputs label {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 80px;
    }
    .element-inputs input, .element-inputs select {
        width: 100%;
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
    }
    .color-label {
        display: flex;
        align-items: center;
    }
    .color-input {
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .remove-element {
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        cursor: pointer;
        padding: 0;
        line-height: 20px;
        text-align: center;
    }
    .resize-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: white;
        border: 1px solid #000;
        border-radius: 50%;
    }
    .resize-handle.top-left { top: -4px; left: -4px; cursor: nwse-resize; }
    .resize-handle.top-right { top: -4px; right: -4px; cursor: nesw-resize; }
    .resize-handle.bottom-left { bottom: -4px; left: -4px; cursor: nesw-resize; }
    .resize-handle.bottom-right { bottom: -4px; right: -4px; cursor: nwse-resize; }
</style>