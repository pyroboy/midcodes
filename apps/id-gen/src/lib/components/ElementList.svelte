<script lang="ts">
	import { stopPropagation } from 'svelte/legacy';
	import type { TemplateElement } from '../stores/templateStore';
	import PositionGroup from './PositionGroup.svelte';
	import FontSettings from './FontSettings.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { ChevronDown, ChevronUp, Move, Scaling, Image, Settings } from '@lucide/svelte';
import { slide } from 'svelte/transition';
import { computeVisibleRectInImage, mapImageRectToThumb, clampBackgroundPosition } from '$lib/utils/backgroundGeometry';
import type { Dims } from '$lib/utils/backgroundGeometry';
import BackgroundThumbnail from './BackgroundThumbnail.svelte';

let {
		elements,
		onUpdateElements,
		fontOptions,
		side,
		preview = null,
		backgroundPosition = $bindable({ x: 0, y: 0, scale: 1 }),
		onUpdateBackgroundPosition = null,
		cardSize = null,
		pixelDimensions = null,
		hoveredElementId = null as string | null,
		onHoverElement = null as ((id: string | null) => void) | null
	} = $props<{
		elements: TemplateElement[];
		onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
		fontOptions: string[];
		side: 'front' | 'back';
		preview?: string | null;
		backgroundPosition?: { x: number; y: number; scale: number };
		onUpdateBackgroundPosition?:
			| ((position: { x: number; y: number; scale: number }, side: 'front' | 'back') => void)
			| null;
		cardSize?: any;
		pixelDimensions?: { width: number; height: number } | null;
		hoveredElementId?: string | null;
		onHoverElement?: (id: string | null) => void | null;
	}>();

	let variableNameErrors: { [key: number]: string } = $state({});

	// Helper function to create a new element array with an update at specific index
	function updateElementAtIndex(index: number, updates: Partial<TemplateElement>) {
		const updatedElements = elements.map((el: TemplateElement, i: number) =>
			i === index ? { ...el, ...updates } : el
		);
		onUpdateElements(updatedElements, side);
	}

	function removeElement(index: number) {
		const updatedElements = elements.filter((_: TemplateElement, i: number) => i !== index);
		onUpdateElements(updatedElements, side);
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
			...(type === 'text'
				? {
						content: 'New Text',
						fontFamily: 'Arial',
						fontSize: 16,
						color: '#ffffff',
						alignment: 'left'
					}
				: type === 'selection'
					? {
							options: ['Option 1', 'Option 2', 'Option 3'],
							fontFamily: 'Arial',
							fontSize: 16,
							color: '#ffffff',
							alignment: 'left'
						}
					: {})
		};
		onUpdateElements([...elements, newElement], side);
	}

	function isDuplicateVariableName(name: string, currentIndex: number): boolean {
		return elements.some(
			(el: TemplateElement, index: number) => index !== currentIndex && el.variableName === name
		);
	}

	function handleVariableNameChange(index: number, newName: string) {
		// Always update the element first for immediate feedback
		updateElementAtIndex(index, { variableName: newName });

		// Then check for duplicates
		if (isDuplicateVariableName(newName, index)) {
			variableNameErrors[index] = 'Variable name must be unique';
			variableNameErrors = { ...variableNameErrors }; // Trigger reactivity
		} else {
			// Clear error if it exists
			if (variableNameErrors[index]) {
				variableNameErrors[index] = '';
				variableNameErrors = { ...variableNameErrors }; // Trigger reactivity
			}
		}
	}

	function handleContentChange(index: number, newValue: string) {
		updateElementAtIndex(index, { content: newValue });
	}

	function handleOptionsChange(index: number, optionsString: string) {
		const options = optionsString
			.split('\n')
			.map((opt) => opt.trim())
			.filter((opt) => opt.length > 0);
		updateElementAtIndex(index, { options });
	}

	function handlePositionChange(
		index: number,
		position: { x?: number; y?: number; width?: number; height?: number }
	) {
		updateElementAtIndex(index, position);
	}

	function handleSelectionChange(index: number, value: string) {
		updateElementAtIndex(index, { content: value });
	}

	let expandedElementIndex: number | null = $state(null);
	let backgroundExpanded = $state(false);

	function toggleElement(index: number) {
		expandedElementIndex = expandedElementIndex === index ? null : index;
	}

	function toggleBackground() {
		backgroundExpanded = !backgroundExpanded;
	}

	function getOptionsString(options: string[] | undefined): string {
		return options?.join('\n') || '';
	}

	function hasNameDuplicate(name: string): boolean {
		return elements.filter((el: TemplateElement) => el.variableName === name).length > 1;
	}

	// Note: Background control functions now handled by BackgroundThumbnail component
</script>

<div class="element-list">
	<!-- Background Image Section -->
	{#if preview}
		<div class="element-item background-section">
			<div
				class="element-header"
				role="button"
				tabindex="0"
				onclick={toggleBackground}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggleBackground();
					}
				}}
			>
				<div class="header-content">
					<span class="chevron">
						{#if backgroundExpanded}
							<ChevronUp size={16} />
						{:else}
							<ChevronDown size={16} />
						{/if}
					</span>
					<Image size={16} />
					<span class="element-type">Background Image</span>
				</div>
			</div>

			{#if backgroundExpanded}
				<div class="element-inputs" transition:slide={{ duration: 200 }}>
					<div class="input-group">
						<label for="background-image-{side}">Background Image</label>
						<div
							id="background-image-{side}"
							class="background-section-layout"
							role="group"
							aria-label="Background image controls"
						>
							{#if pixelDimensions}
								<BackgroundThumbnail
									imageUrl={preview}
									templateDimensions={pixelDimensions}
									bind:position={backgroundPosition}
									onPositionChange={(newPosition) => {
										backgroundPosition = newPosition;
										if (onUpdateBackgroundPosition) {
											onUpdateBackgroundPosition(newPosition, side);
										}
									}}
									maxThumbnailWidth={300}
								/>
							{:else}
								<div class="loading-placeholder">
									<p>Loading template dimensions...</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Elements List -->
{#each elements ?? [] as element, i}
		<div class="element-item" class:highlighted={hoveredElementId === element.id}>
<div
				class="element-header"
				role="button"
				tabindex="0"
				onmouseenter={() => onHoverElement?.(element.id)}
				onmouseleave={() => onHoverElement?.(null)}
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
					<span class="element-type"
						>{element.type.charAt(0).toUpperCase() + element.type.slice(1)}</span
					>
					<span class="element-name" class:duplicate={hasNameDuplicate(element.variableName)}>
						{element.variableName}
					</span>
				</div>
				<button class="remove-element" onclick={stopPropagation(() => removeElement(i))}>×</button>
			</div>

			{#if expandedElementIndex === i}
				<div class="element-inputs" transition:slide={{ duration: 200 }}>
					<div class="input-group">
						<label for="variable-name-{i}">Variable Name</label>
						<Input
							id="variable-name-{i}"
							value={element.variableName}
							oninput={(e) => handleVariableNameChange(i, e.currentTarget.value)}
						/>
						{#if variableNameErrors[i]}
							<span class="error-message">{variableNameErrors[i]}</span>
						{/if}
					</div>

					{#if element.type === 'text'}
						<div class="input-group">
							<label for="text-content-{i}">Text</label>
							<Input
								id="text-content-{i}"
								value={element.content}
								oninput={(e) => handleContentChange(i, e.currentTarget.value)}
							/>
						</div>
						<FontSettings {element} {onUpdateElements} {elements} {fontOptions} {side} />
					{:else if element.type === 'selection'}
						<div class="input-group">
							<label for="select-{i}">Current Selection</label>
							<Select.Root
								name="select-{i}"
								type="single"
								value={element.content}
								onValueChange={(value) => handleSelectionChange(i, value)}
							>
								<Select.Trigger id="select-{i}">
									{element.content || (element.options?.[0] ?? 'Select option')}
								</Select.Trigger>
								<Select.Content>
									{#each element.options || [] as option}
										<Select.Item value={option}>
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
								oninput={(e) => handleOptionsChange(i, e.currentTarget.value)}
								rows="4"
							></textarea>
						</div>
						<FontSettings {element} {onUpdateElements} {elements} {fontOptions} {side} />
					{/if}

					<PositionGroup
						x={element.x}
						y={element.y}
						width={element.width}
						height={element.height}
						onUpdate={(updates: Record<'x' | 'y' | 'width' | 'height', number | undefined>) =>
							handlePositionChange(i, updates)}
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

.element-item.highlighted .element-header {
		background-color: #4a4a4a;
		box-shadow: 0 0 0 1px rgba(0,255,255,0.4) inset, 0 0 8px rgba(0,255,255,0.35);
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

	.element-name.duplicate {
		color: #ff4444;
		font-weight: 500;
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

	.error-message {
		color: #ff4444;
		font-size: 0.8rem;
		margin-top: 4px;
	}

	/* Background Section */
	.background-section .element-header {
		background-color: #4a3a2a;
	}

	.background-section .element-header:hover {
		background-color: #5f4f2f;
	}

	/* Loading placeholder for background controls */
	.loading-placeholder {
		padding: 2rem;
		text-align: center;
		color: #a0a0a0;
		font-style: italic;
		background: #2a2a2a;
		border-radius: 4px;
		border: 1px dashed #5a5a5a;
	}

	/* Background controls container */
	.background-section-layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}


</style>
