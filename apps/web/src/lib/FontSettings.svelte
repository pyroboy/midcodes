<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { TemplateElement } from './stores/templateStore';
    import { 
        Type, Bold, Italic, Underline, AlignLeft, AlignCenter, 
        AlignRight, AlignJustify, ChevronsUpDown, MoveHorizontal, 
        ArrowUpNarrowWide
    } from 'lucide-svelte';
    import ColorInput from './ColorInput.svelte';

    interface Props {
        element: TemplateElement;
        fontOptions: string[];
    }

    let { element = $bindable(), fontOptions }: Props = $props();

    const dispatch = createEventDispatcher();

    const fontWeightOptions = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    function updateElement(updates: Partial<TemplateElement>) {
        dispatch('update', { ...element, ...updates });
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
        <select bind:value={element.font} onchange={() => updateElement({ font: element.font })}>
            {#each fontOptions as font}
                <option value={font}>{font}</option>
            {/each}
        </select>
        <input type="number" bind:value={element.size} oninput={() => updateElement({ size: element.size })}>
        <select bind:value={element.fontWeight} onchange={() => updateElement({ fontWeight: element.fontWeight })}>
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
    select {
        flex-grow: 1;
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