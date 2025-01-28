<script lang="ts">
    import { stopPropagation } from 'svelte/legacy';

    import type { TemplateElement } from '../stores/templateStore';
    import PositionGroup from './PositionGroup.svelte';
    import FontSettings from './FontSettings.svelte';
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input"
    import { ChevronDown, ChevronUp } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    
    let { elements = $bindable(), fontOptions, side } = $props();



    function updateElement(index: number, updates: Partial<TemplateElement>) {
        elements[index] = { ...elements[index], ...updates };
    }

    function removeElement(index: number) {
        elements = elements.filter((_: TemplateElement, i: number) => i !== index);
    }

    function addElement(type: 'text' | 'photo' | 'signature' | 'selection') {
        const newElement: TemplateElement = {
            id: `new_${type}_${Date.now()}`,
            variableName: `new_${type}_${Date.now()}`,
            type,
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            side,
            ...(type === 'text' ? {
                content: 'New Text',
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                textAlign: 'left'
            } : type === 'selection' ? {
                options: ['Option 1', 'Option 2', 'Option 3'],
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                textAlign: 'left'
            } : {})
        };
        elements = [...elements, newElement];
    }

    const getTriggerContent = (element: TemplateElement) => {
        return element.content || (element.options?.[0] ?? 'Select option');
    };

    function getOptionsString(options: string[] | undefined): string {
        return options?.join('\n') || '';
    }

    function handleOptionsInput(event: Event, index: number) {
        const target = event.target as HTMLTextAreaElement;
        const options = target.value
            .split('\n')
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0);
        updateElement(index, { options });

    }

    let expandedElementIndex: number | null = $state(null);

    function toggleElement(index: number) {
        expandedElementIndex = expandedElementIndex === index ? null : index;
    }
</script>

<div class="element-list">
    {#each elements as element, i}
        <div class="element-item">
            <div class="element-header" 
                role="button"
                tabindex="0"
                onclick={() => toggleElement(i)}
                onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleElement(i);
                    }
                }}
            >
                <div class="header-content">
                    <span class="chevron">
                        {#if expandedElementIndex === i}
                            <ChevronUp size={16} />
                        {:else}
                            <ChevronDown size={16} />
                        {/if}
                    </span>
                    <span class="element-type">{element.type.charAt(0).toUpperCase() + element.type.slice(1)}</span>
                    <span class="element-name">{element.variableName}</span>
                </div>
                <button class="remove-element" onclick={stopPropagation(() => removeElement(i))}>×</button>
            </div>
            {#if expandedElementIndex === i}
                <div class="element-inputs" transition:slide={{ duration: 200 }}>
                    <div class="input-group">
                        <label for="variable-name-{i}">Variable Name</label>
                        <Input 
                            id="variable-name-{i}"
                            bind:value={element.variableName} 
                            oninput={() => updateElement(i, { variableName: element.variableName })}
                        />
                    </div>

                    {#if element.type === 'text'}
                        <div class="input-group">
                            <label for="text-content-{i}">Text</label>
                            <Input 
                                id="text-content-{i}"
                                bind:value={element.content} 
                                oninput={() => updateElement(i, { content: element.content })}
                            />
                        </div>
                        <FontSettings 
                            bind:element = {elements[i]}
                            {fontOptions} 
                        />
                    {:else if element.type === 'selection'}
                        <div class="input-group">
                            <label for="select-{i}">Options</label>
                            <Select.Root
                                name="select-{i}"
                                type="single"
                                bind:value={element.content}
                            >
                                <Select.Trigger id="select-{i}">
                                    {getTriggerContent(element)}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each element.options || [] as option}
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
                        <div class="input-group">
                            <label for="options-{i}">Edit Options (one per line)</label>
                            <textarea
                                id="options-{i}"
                                class="options-textarea"
                                value={getOptionsString(element.options)}
                                oninput={(event) => handleOptionsInput(event, i)}
                                rows="4"
                            ></textarea>
                        </div>
                        <FontSettings 
                        bind:element = {elements[i]}
                            {fontOptions} 
                        />
                    {/if}

                    <PositionGroup 
                        x={element.x} 
                        y={element.y} 
                        width={element.width} 
                        height={element.height} 
                    />
                </div>
            {/if}
        </div>
    {/each}
    <div class="add-elements">
        <button onclick={() => addElement('text')}>Add Text</button>
        <button onclick={() => addElement('photo')}>Add Photo</button>
        <button onclick={() => addElement('signature')}>Add Signature</button>
        <button onclick={() => addElement('selection')}>Add Selection</button>
    </div>
</div>

<style>
    .element-list {
        width: 400px;
        background-color: #1e1e1e;
        color: #000;
        padding: 0.75rem;
        border-radius: 0.5rem;
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
    }

    .element-item {
        background-color: #2d2d2d;
        border-radius: 0.375rem;
        margin-bottom: 0.25rem;
        overflow: hidden;
    }

    .element-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.75rem;
        background-color: #363636;
        cursor: pointer;
        user-select: none;
        min-height: 2rem;
    }

    .element-header:hover {
        background-color: #404040;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .chevron {
        display: flex;
        align-items: center;
        color: #a0a0a0;
    }

    .element-type {
        font-weight: 500;
        color: #e0e0e0;
        font-size: 0.875rem;
    }

    .element-name {
        color: #a0a0a0;
        font-size: 0.75rem;
    }

    .element-inputs {
        padding: 0.75rem;
        border-top: 1px solid #404040;
    }

    .input-group {
        margin-bottom: 1rem;
    }

    .input-group label {
        display: block;
        margin-bottom: 0.375rem;
        color: #e0e0e0;
        font-size: 0.875rem;
    }

    .remove-element {
        background: none;
        border: none;
        color: #a0a0a0;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        border-radius: 0.25rem;
    }

    .remove-element:hover {
        color: #ff4444;
        background-color: rgba(255, 68, 68, 0.1);
    }

    .options-textarea {
        width: 100%;
        min-height: 80px;
        background-color: #2d2d2d;
        color: #ffffff;
        border: 1px solid #404040;
        border-radius: 0.375rem;
        padding: 0.5rem;
        font-family: inherit;
        resize: vertical;
    }

    .options-textarea:focus {
        outline: none;
        border-color: #606060;
    }

    .add-elements {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-top: 16px;
    }

    .add-elements button {
        background-color: #4d4d4d;
        border: none;
        color: #ffffff;
        padding: 8px;
        cursor: pointer;
        border-radius: 3px;
        font-size: 12px;
        transition: background-color 0.2s;
    }

    .add-elements button:hover {
        background-color: #5d5d5d;
    }
</style>