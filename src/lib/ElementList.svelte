<script lang="ts">
    import type { TemplateElement } from '../stores/templateStore';
    import PositionGroup from './PositionGroup.svelte';
    
    import FontSettings from './FontSettings.svelte';
    


    export let elements: TemplateElement[];
    export let fontOptions: string[];
    
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    function updateElement(index: number, updates: Partial<TemplateElement>) {
        elements[index] = { ...elements[index], ...updates };
        dispatch('update', { elements });
    }

    function removeElement(index: number) {
        elements = elements.filter((_, i) => i !== index);
        dispatch('update', { elements });
    }

    function addElement(type: 'text' | 'photo' | 'signature') {
        const newElement: TemplateElement = {
            variableName: `new_${type}_${Date.now()}`,
            type,
            side: 'front', // Assuming 'front' as default, adjust as needed
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            ...(type === 'text' ? { content: 'New Text', font: 'Arial', size: 16, color: '#ffffff', alignment: 'left' } : {})
        };
        elements = [...elements, newElement];
        dispatch('update', { elements });
    }
</script>

<div class="element-list">
    <h3>Elements</h3>
    {#each elements as element, i}
        <div class="element-item">
            <div class="element-header">
                <span>{element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element</span>
                <button class="remove-element" on:click={() => removeElement(i)}>×</button>
            </div>
            <div class="element-inputs">
                <div class="input-group">
                    <label>
                        Variable Name
                        <input bind:value={element.variableName} on:input={() => updateElement(i, { variableName: element.variableName })}>
                    </label>
                </div>
              {#if element.type === 'text'}
    <div class="input-group">
        <label>
            Text
            <input bind:value={element.content} on:input={() => updateElement(i, { content: element.content })}>
        </label>
    </div>
    <FontSettings 
        {element} 
        {fontOptions} 
        on:update={(event) => updateElement(i, event.detail)}
    />
{/if}

                <PositionGroup 
                    x={element.x} 
                    y={element.y} 
                    width={element.width} 
                    height={element.height} 
                    on:update={({ detail }) => updateElement(i, detail)} 
                />
            </div>
        </div>
    {/each}
    <div class="add-elements">
        <button on:click={() => addElement('text')}>Add Text</button>
        <button on:click={() => addElement('photo')}>Add Photo</button>
        <button on:click={() => addElement('signature')}>Add Signature</button>
    </div>
</div>

<style>
    .element-list {
        width: 300px;
        background-color: #1e1e1e;
        color: #ffffff;
        padding: 10px;
        border-radius: 5px;
    }
    .element-item {
        margin-bottom: 10px;
        background-color: #2d2d2d;
        border-radius: 5px;
        overflow: hidden;
    }
    .element-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #3d3d3d;
        padding: 5px 10px;
    }
    .element-inputs {
        padding: 10px;
    }

    .input-group label {
        display: flex;
        flex-direction: column;
        font-size: 12px;
    }
    .input-group input {
        width: 100%;
        background-color: #3d3d3d;
        border: 1px solid #4d4d4d;
        color: #ffffff;
        padding: 2px 5px;
        border-radius: 3px;
    }
    .remove-element {
        background: none;
        border: none;
        color: #ff6b6b;
        cursor: pointer;
        font-size: 16px;
    }
    .add-elements {
        display: flex;
        gap: 5px;
        margin-top: 10px;
    }
    .add-elements button {
        flex: 1;
        background-color: #4d4d4d;
        border: none;
        color: #ffffff;
        padding: 5px;
        cursor: pointer;
        border-radius: 3px;
    }
   
</style>