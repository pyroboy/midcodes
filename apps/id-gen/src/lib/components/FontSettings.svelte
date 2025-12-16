<script lang="ts">
	import type { TemplateElement } from '../stores/templateStore';
	import {
		Type,
		Bold,
		Italic,
		Underline,
		AlignLeft,
		AlignRight,
		AlignCenter,
		AlignJustifyIcon,
		AlignJustify,
		ChevronsUpDown,
		MoveHorizontal,
		ArrowUpNarrowWide
	} from '@lucide/svelte';
	import ColorInput from './ColorInput.svelte';

	let { element, fontOptions, onUpdateElements, elements, side } = $props<{
		element: TemplateElement;
		fontOptions: string[];
		onUpdateElements: (elements: TemplateElement[], side: 'front' | 'back') => void;
		elements: TemplateElement[];
		side: 'front' | 'back';
	}>();

	// Debug logging - comprehensive font inspection
	$effect(() => {
		console.log('🎨 [FontSettings] Debug:', {
			elementId: element.id,
			elementType: element.type,
			elementFontFamily: element.fontFamily,
			elementFontSize: element.fontSize,
			fontOptionsReceived: fontOptions?.length || 0,
			allFonts: fontOptions || '(none)',
			side
		});
		
		// Additional warning if no fonts
		if (!fontOptions || fontOptions.length === 0) {
			console.warn('⚠️ [FontSettings] No font options received! Font dropdown will be empty.');
		}
	});

	const fontWeightOptions = [
		'normal',
		'bold',
		'100',
		'200',
		'300',
		'400',
		'500',
		'600',
		'700',
		'800',
		'900'
	];

	function updateElement(updates: Partial<TemplateElement>) {
		const updatedElements = elements.map((el: { variableName: string }) =>
			el.variableName === element.variableName ? { ...el, ...updates } : el
		);
		onUpdateElements(updatedElements, side);
	}

	function handleFontChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		updateElement({ fontFamily: target.value });
	}

	function handleFontSizeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateElement({ fontSize: Number(target.value) });
	}

	function adjustFontSize(delta: number) {
		const currentSize = element.fontSize || element.size || 16;
		const newSize = Math.max(1, currentSize + delta); // Minimum size of 1
		updateElement({ fontSize: newSize });
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
			value={element.fontFamily} 
			onchange={handleFontChange} 
			class="font-select"
			style="font-family: '{element.fontFamily || 'Roboto'}', sans-serif;"
		>
			{#each fontOptions as font}
				<option value={font} style="font-family: '{font}', sans-serif;">{font}</option>
			{/each}
		</select>
		<select value={element.fontWeight} onchange={handleFontWeightChange}>
			{#each fontWeightOptions as weight}
				<option value={weight}>{weight}</option>
			{/each}
		</select>
	</div>
	<div class="settings-row font-size-row">
		<label class="font-size-label" for="font-size-{element.id}">Size:</label>
		<button class="size-button" onclick={() => adjustFontSize(-5)} title="Decrease by 5">-5</button>
		<button class="size-button" onclick={() => adjustFontSize(-1)} title="Decrease by 1">-1</button>
		<input 
			type="number" 
			id="font-size-{element.id}"
			value={element.fontSize || element.size || 16} 
			onchange={handleFontSizeChange} 
			class="font-size-input" 
		/>
		<button class="size-button" onclick={() => adjustFontSize(1)} title="Increase by 1">+1</button>
		<button class="size-button" onclick={() => adjustFontSize(5)} title="Increase by 5">+5</button>
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
		<button
			class="icon-button"
			onclick={() =>
				updateElement({
					textTransform: element.textTransform === 'uppercase' ? 'none' : 'uppercase'
				})}
		>
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
	
	.font-size-row {
		gap: 6px;
	}
	
	.font-size-label {
		font-size: 13px;
		color: #cccccc;
		margin-right: 4px;
	}
	
	
	select,
	input[type='number'] {
		background-color: #3d3d3d;
		color: #ffffff;
		border: 1px solid #4d4d4d;
		padding: 4px 8px;
		border-radius: 2px;
		font-size: 13px;
		min-height: 28px;
		cursor: pointer;
	}

	select {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3e%3cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 8px center;
		background-size: 12px;
		padding-right: 28px;
	}
	
	select:hover {
		border-color: #6d6d6d;
		background-color: #4d4d4d;
	}
	
	select:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
	}

	/* Font select shows each font in its own font family */
	.font-select {
		flex: 1;
		min-width: 120px;
	}
	
	.font-select option {
		padding: 4px 8px;
		background-color: #2d2d2d;
		color: #ffffff;
	}

	input[type='number'] {
		width: 60px;
	}
	
	.font-size-input {
		width: 55px;
		text-align: center;
	}
	
	.size-button {
		background-color: #3d3d3d;
		color: #ffffff;
		border: 1px solid #4d4d4d;
		padding: 4px 8px;
		border-radius: 2px;
		cursor: pointer;
		font-size: 12px;
		min-width: 32px;
		transition: all 0.15s;
	}
	
	.size-button:hover {
		background-color: #4d4d4d;
		border-color: #5d5d5d;
	}
	
	.size-button:active {
		background-color: #5d5d5d;
		transform: scale(0.95);
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
