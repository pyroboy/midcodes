<script lang="ts">
    import type { TemplateElement } from '../stores/templateStore';
    import { 
        Type, Bold, Italic, Underline, AlignLeft, AlignRight, AlignCenter, 
        AlignJustifyIcon, AlignJustify, ChevronsUpDown, MoveHorizontal,
        ArrowUpNarrowWide
    } from 'lucide-svelte';
    import ColorInput from './ColorInput.svelte';

    let { 
        element,
        fontOptions,
        onUpdateElements,
        elements,
        side
     } = $props<{
        element: TemplateElement;
        fontOptions: string[];
        onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
        elements: TemplateElement[];
        side: 'front' | 'back';
    }>();

    const fontWeightOptions = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

console.log(elements);

    function updateElement(updates: Partial<TemplateElement>) {
        const updatedElements = elements.map((el: { variableName: string; }) => 
            el.variableName === element.variableName ? { ...el, ...updates } : el
        );
        onUpdateElements(updatedElements, side);
    }

    function handleFontChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        updateElement({ font: target.value });
    }

    function handleFontSizeChange(e: Event) {
        const target = e.target as HTMLInputElement;
        updateElement({ size: Number(target.value) });
    }

    function handleFontWeightChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        updateElement({ fontWeight: target.value });
    }

    function toggleBold() {
        const newWeight = element.fontWeight === 'bold' ? 'normal' : 'bold';
        updateElement({ fontWeight: newWeight });
    }

    function toggleItalic() {
        const newStyle = element.fontStyle === 'italic' ? 'normal' : 'italic';
        updateElement({ fontStyle: newStyle });
    }

    function toggleUnderline() {
        const newDecoration = element.textDecoration === 'underline' ? 'none' : 'underline';
        updateElement({ textDecoration: newDecoration });
    }

    function handleColorUpdate(event: CustomEvent) {
        const { color, opacity, visible } = event.detail;
        updateElement({ 
            color,
            opacity: opacity / 100,
            visible
        });
    }
</script>

<div class="font-settings">
    <div class="settings-row">
        <select 
            value={element.font}
            onchange={handleFontChange}
        >
            {#each fontOptions as font}
                <option value={font}>{font}</option>
            {/each}
        </select>
        <input 
            type="number" 
            value={element.size}
            onchange={handleFontSizeChange}
        >
        <select 
            value={element.fontWeight}
            onchange={handleFontWeightChange}
        >
            {#each fontWeightOptions as weight}
                <option value={weight}>{weight}</option>
            {/each}
        </select>
    </div>
    <div class="settings-row">
        <button class="icon-button" onclick={() => updateElement({ alignment: 'left' })}>
            <AlignLeft size={18} color={element.alignment === 'left' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={() => updateElement({ alignment: 'center' })}>
            <AlignCenter size={18} color={element.alignment === 'center' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={() => updateElement({ alignment: 'right' })}>
            <AlignRight size={18} color={element.alignment === 'right' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={() => updateElement({ alignment: 'justify' })}>
            <AlignJustify size={18} color={element.alignment === 'justify' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={toggleBold}>
            <Bold size={18} color={element.fontWeight === 'bold' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={toggleItalic}>
            <Italic size={18} color={element.fontStyle === 'italic' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button" onclick={toggleUnderline}>
            <Underline size={18} color={element.textDecoration === 'underline' ? '#ffffff' : '#888888'} />
        </button>
    </div>
    <div class="settings-row">
        <button class="icon-button">
            <MoveHorizontal size={18} color="#888888" />
        </button>
        <button class="icon-button">
            <ArrowUpNarrowWide size={18} color="#888888" />
        </button>
        <button class="icon-button" onclick={() => updateElement({ textTransform: element.textTransform === 'uppercase' ? 'none' : 'uppercase' })}>
            <Type size={18} color={element.textTransform === 'uppercase' ? '#ffffff' : '#888888'} />
        </button>
        <button class="icon-button">
            <ChevronsUpDown size={18} color="#888888" />
        </button>
    </div>
    <div class="settings-row">
        <ColorInput 
            color={element.color} 
            opacity={element.opacity ? element.opacity * 100 : 100}
            visible={element.visible !== false}
            on:update={handleColorUpdate}
        />
    </div>
</div>

<style>
    .font-settings {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background-color: #2d2d2d;
        padding: 8px;
        border-radius: 4px;
    }
    .settings-row {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    select, input[type="number"] {
        background-color: #3d3d3d;
        color: #ffffff;
        border: 1px solid #4d4d4d;
        padding: 4px;
        border-radius: 2px;
    }
  
    input[type="number"] {
        width: 60px;
    }
    .icon-button {
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
    }
    .icon-button:hover {
        background-color: #4d4d4d;
    }
</style>