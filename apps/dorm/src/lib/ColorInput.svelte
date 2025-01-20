<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Eye, EyeOff, Minus } from 'lucide-svelte';

    interface Props {
        color?: string;
        opacity?: number;
        visible?: boolean;
    }

    let { color = $bindable('#000000'), opacity = $bindable(100), visible = $bindable(true) }: Props = $props();

    const dispatch = createEventDispatcher();

    function updateColor(newColor: string) {
        color = newColor;
        dispatch('update', { color, opacity, visible });
    }

    function updateOpacity(newOpacity: number) {
        opacity = Math.max(0, Math.min(100, newOpacity));
        dispatch('update', { color, opacity, visible });
    }

    function toggleVisibility() {
        visible = !visible;
        dispatch('update', { color, opacity, visible });
    }

    function handleColorPickerChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target) {
            updateColor(target.value);
        }
    }
</script>

<div class="color-input">
    <div class="color-preview-wrapper">
        <div class="color-preview" style="background-color: {color};"></div>
        <input 
            type="color" 
            value={color}
            oninput={handleColorPickerChange}
            class="color-picker"
        >
    </div>
    <input 
        type="text" 
        bind:value={color} 
        oninput={() => updateColor(color)}
        maxlength="7"
    >
    <span class="opacity">{opacity}%</span>
    <button class="icon-button" onclick={toggleVisibility}>
        {#if visible}
            <Eye size={18} />
        {:else}
            <EyeOff size={18} />
        {/if}
    </button>
    <button class="icon-button">
        <Minus size={18} />
    </button>
</div>
<style>
    .color-input {
        display: flex;
        align-items: center;
        background-color: #3d3d3d;
        border-radius: 4px;
        padding: 4px;
        gap: 8px;
        width: 100%;
    }
    .color-preview-wrapper {
        position: relative;
        width: 20px;
        height: 20px;
    }
    .color-preview {
        width: 100%;
        height: 100%;
        border-radius: 2px;
        border: 1px solid #4d4d4d;
    }
    .color-picker {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
    input[type="text"] {
        background-color: transparent;
        border: none;
        color: #ffffff;
        width: 70px;
    }
    .opacity {
        color: #ffffff;
        font-size: 14px;
        margin-left: auto;
    }
    .icon-button {
        background: none;
        border: none;
        color: #ffffff;
        cursor: pointer;
        padding: 2px;
    }
    .icon-button:hover {
        background-color: #4d4d4d;
        border-radius: 2px;
    }
</style>