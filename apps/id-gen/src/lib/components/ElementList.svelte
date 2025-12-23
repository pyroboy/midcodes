<script lang="ts">
	import { stopPropagation } from 'svelte/legacy';
	import type { TemplateElement } from '../stores/templateStore';
	import PositionGroup from './PositionGroup.svelte';
	import FontSettings from './FontSettings.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import {
		ChevronDown,
		ChevronUp,
		ArrowUp,
		ArrowDown,
		Scaling,
		Image,
		Settings
	} from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import {
		computeVisibleRectInImage,
		mapImageRectToThumb,
		clampBackgroundPosition
	} from '$lib/utils/backgroundGeometry';
	import type { Dims } from '$lib/utils/backgroundGeometry';
	import BackgroundThumbnail from './BackgroundThumbnail.svelte';
	import OrgAssetPickerModal from './OrgAssetPickerModal.svelte';
	import { uploadOrgGraphic } from '$lib/remote/graphic.remote';

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
		onHoverElement = null as ((id: string | null) => void) | null,
		selectedElementId = null as string | null,
		selectionVersion = 0,
		onSelect = null as ((id: string | null) => void) | null
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
		selectedElementId?: string | null;
		selectionVersion?: number;
		onSelect?: (id: string | null) => void;
	}>();

	let openSectionIndex: number | null = $state(null);

	// Debug: Log fontOptions when they change
	$effect(() => {
		console.log('🔤 [ElementList] fontOptions received:', {
			side,
			count: fontOptions?.length || 0,
			fonts: fontOptions || [],
			hasElements: elements?.length || 0
		});
	});

	// Effect to auto-open section when an element is selected (or re-clicked)
	$effect(() => {
		// Depend on selectionVersion to trigger re-open even if ID is same
		if (selectionVersion !== undefined && selectedElementId) {
			const index = elements.findIndex((el: TemplateElement) => el.id === selectedElementId);
			if (index !== -1) {
				openSectionIndex = index;
			}
		} else if (selectedElementId === null) {
			openSectionIndex = null;
		}
	});

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

	// Z-order controls: array order = render order (first = bottom/back, last = top/front)
	function moveElementUp(index: number) {
		// Move toward back (earlier in array = rendered first = behind)
		if (index === 0) return;
		const updated = [...elements];
		[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
		onUpdateElements(updated, side);
	}

	function moveElementDown(index: number) {
		// Move toward front (later in array = rendered last = on top)
		if (index >= elements.length - 1) return;
		const updated = [...elements];
		[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
		onUpdateElements(updated, side);
	}

	// Graphic element: file upload and asset picker state
	let assetPickerOpen = $state(false);
	let assetPickerTargetIndex = $state<number | null>(null);
	let uploadingGraphic = $state(false);

	async function handleGraphicFileUpload(index: number, event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file type
		const allowedTypes = ['image/png', 'image/webp', 'image/svg+xml'];
		if (!allowedTypes.includes(file.type)) {
			alert('Only PNG, WebP, and SVG files are allowed');
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be under 5MB');
			return;
		}

		uploadingGraphic = true;

		try {
			// Convert file to base64
			const base64 = await fileToBase64(file);

			// Upload to R2
			const result = await uploadOrgGraphic({
				filename: file.name,
				contentType: file.type as 'image/png' | 'image/webp' | 'image/svg+xml',
				base64Data: base64
			});

			if (result.success && result.url) {
				updateElementAtIndex(index, { src: result.url });
			} else {
				alert(result.error || 'Failed to upload graphic');
			}
		} catch (err) {
			console.error('Graphic upload error:', err);
			alert('Failed to upload graphic');
		} finally {
			uploadingGraphic = false;
			input.value = '';
		}
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function openAssetPicker(index: number) {
		assetPickerTargetIndex = index;
		assetPickerOpen = true;
	}

	function handleAssetSelect(url: string) {
		if (assetPickerTargetIndex !== null) {
			updateElementAtIndex(assetPickerTargetIndex, { src: url });
		}
		assetPickerOpen = false;
		assetPickerTargetIndex = null;
	}

	function closeAssetPicker() {
		assetPickerOpen = false;
		assetPickerTargetIndex = null;
	}

	function addElement(type: 'text' | 'photo' | 'signature' | 'selection' | 'graphic' | 'qr') {
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
						fontFamily: 'Roboto',
						fontSize: 16,
						color: '#ffffff',
						alignment: 'left'
					}
				: type === 'selection'
					? {
							options: ['Option 1', 'Option 2', 'Option 3'],
							fontFamily: 'Roboto',
							fontSize: 16,
							color: '#ffffff',
							alignment: 'left'
						}
					: type === 'graphic'
						? {
								src: '', // URL of the static graphic
								fit: 'contain' as const,
								maintainAspectRatio: true,
								width: 200,
								height: 200
							}
						: type === 'qr'
							? {
									contentMode: 'auto' as const, // 'auto' = digital profile URL, 'custom' = manual content
									content: '',
									errorCorrectionLevel: 'M' as const,
									backgroundColor: '#ffffff',
									foregroundColor: '#000000',
									width: 150,
									height: 150
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
		position: { x?: number; y?: number; width?: number; height?: number; rotation?: number }
	) {
		updateElementAtIndex(index, position);
	}

	function handleSelectionChange(index: number, value: string) {
		updateElementAtIndex(index, { content: value });
	}

	function toggleSection(index: number) {
		if (openSectionIndex === index) {
			openSectionIndex = null;
			onSelect?.(null);
		} else {
			openSectionIndex = index;
			onSelect?.(elements[index].id);
		}
	}

	let backgroundExpanded = $state(false);

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
		<div
			class="element-item"
			class:highlighted={hoveredElementId === element.id || selectedElementId === element.id}
			id={`element-item-${i}`}
		>
			<div
				class="element-header"
				role="button"
				tabindex="0"
				onclick={() => toggleSection(i)}
				onkeydown={(e) => e.key === 'Enter' && toggleSection(i)}
				onmouseenter={() => onHoverElement?.(element.id)}
				onmouseleave={() => onHoverElement?.(null)}
			>
				<div class="header-content">
					<span class="chevron">
						{#if openSectionIndex === i}
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
				<!-- Z-order controls -->
				<div class="z-order-controls">
					<button
						class="z-btn"
						onclick={stopPropagation(() => moveElementUp(i))}
						disabled={i === 0}
						title="Move back (behind other elements)"
					>
						<ArrowUp size={12} />
					</button>
					<button
						class="z-btn"
						onclick={stopPropagation(() => moveElementDown(i))}
						disabled={i === elements.length - 1}
						title="Move forward (in front of other elements)"
					>
						<ArrowDown size={12} />
					</button>
				</div>
				<button class="remove-element" onclick={stopPropagation(() => removeElement(i))}>×</button>
			</div>

			{#if openSectionIndex === i}
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
					{:else if element.type === 'graphic'}
						<div class="input-group">
							<label for="graphic-file-{i}">Graphic Source</label>
							<!-- File upload button -->
							<div class="graphic-source-buttons">
								<input
									type="file"
									id="graphic-file-{i}"
									accept="image/png,image/webp,image/svg+xml"
									class="hidden"
									onchange={(e) => handleGraphicFileUpload(i, e)}
									disabled={uploadingGraphic}
								/>
								<button
									type="button"
									class="graphic-btn"
									onclick={() => document.getElementById(`graphic-file-${i}`)?.click()}
									disabled={uploadingGraphic}
								>
									<Image size={14} />
									{uploadingGraphic ? 'Uploading...' : 'Upload File'}
								</button>
								<button
									type="button"
									class="graphic-btn"
									onclick={() => openAssetPicker(i)}
									disabled={uploadingGraphic}
								>
									<Settings size={14} />
									Choose from Assets
								</button>
							</div>
							<!-- URL input (advanced) -->
							<details class="mt-2">
								<summary class="text-xs text-muted-foreground cursor-pointer">Or enter URL manually</summary>
								<Input
									id="graphic-url-{i}"
									value={element.src || ''}
									placeholder="https://..."
									class="mt-1"
									oninput={(e) => updateElementAtIndex(i, { src: e.currentTarget.value })}
								/>
							</details>
							<!-- Preview -->
							{#if element.src}
								<div class="graphic-preview mt-2">
									<img
										src={element.src}
										alt="Graphic preview"
										class="max-w-full max-h-20 rounded border border-border object-contain"
									/>
									<button
										type="button"
										class="remove-graphic-btn"
										onclick={() => updateElementAtIndex(i, { src: '' })}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
						<div class="input-group">
							<label for="fit-mode-{i}">Fit Mode</label>
							<Select.Root
								name="fit-mode-{i}"
								type="single"
								value={element.fit || 'contain'}
								onValueChange={(value) =>
									updateElementAtIndex(i, { fit: value as 'cover' | 'contain' | 'fill' | 'none' })}
							>
								<Select.Trigger id="fit-mode-{i}">
									{element.fit || 'contain'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="contain">Contain (fit inside, centered)</Select.Item>
									<Select.Item value="cover">Cover (fill box, clip overflow)</Select.Item>
									<Select.Item value="fill">Fill (stretch to fit)</Select.Item>
									<Select.Item value="none">None (original size, centered)</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="input-group">
							<label for="border-radius-{i}">Border Radius</label>
							<Input
								id="border-radius-{i}"
								type="number"
								min="0"
								value={element.borderRadius || 0}
								oninput={(e) =>
									updateElementAtIndex(i, { borderRadius: parseInt(e.currentTarget.value) || 0 })}
							/>
						</div>
					{:else if element.type === 'qr'}
						<div class="input-group">
							<label for="qr-mode-{i}">QR Content Mode</label>
							<Select.Root
								name="qr-mode-{i}"
								type="single"
								value={element.contentMode || 'auto'}
								onValueChange={(value) =>
									updateElementAtIndex(i, { contentMode: value as 'auto' | 'custom' })}
							>
								<Select.Trigger id="qr-mode-{i}">
									{element.contentMode === 'custom' ? 'Custom URL/Text' : 'Auto (Digital Profile)'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="auto">Auto (Digital Profile)</Select.Item>
									<Select.Item value="custom">Custom URL/Text</Select.Item>
								</Select.Content>
							</Select.Root>
							<p class="hint-text">Auto mode generates a QR code linking to the cardholder's digital profile.</p>
						</div>
						{#if element.contentMode === 'custom'}
							<div class="input-group">
								<label for="qr-content-{i}">QR Content</label>
								<Input
									id="qr-content-{i}"
									value={element.content || ''}
									placeholder="https://example.com or any text"
									oninput={(e) => updateElementAtIndex(i, { content: e.currentTarget.value })}
								/>
							</div>
						{/if}
						<div class="input-group">
							<label for="qr-error-level-{i}">Error Correction</label>
							<Select.Root
								name="qr-error-level-{i}"
								type="single"
								value={element.errorCorrectionLevel || 'M'}
								onValueChange={(value) =>
									updateElementAtIndex(i, { errorCorrectionLevel: value as 'L' | 'M' | 'Q' | 'H' })}
							>
								<Select.Trigger id="qr-error-level-{i}">
									{element.errorCorrectionLevel || 'M'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="L">L - Low (7%)</Select.Item>
									<Select.Item value="M">M - Medium (15%)</Select.Item>
									<Select.Item value="Q">Q - Quartile (25%)</Select.Item>
									<Select.Item value="H">H - High (30%)</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="input-group color-row">
							<div class="color-input">
								<label for="qr-fg-{i}">Foreground</label>
								<input
									type="color"
									id="qr-fg-{i}"
									value={element.foregroundColor || '#000000'}
									oninput={(e) => updateElementAtIndex(i, { foregroundColor: e.currentTarget.value })}
								/>
							</div>
							<div class="color-input">
								<label for="qr-bg-{i}">Background</label>
								<input
									type="color"
									id="qr-bg-{i}"
									value={element.backgroundColor || '#ffffff'}
									oninput={(e) => updateElementAtIndex(i, { backgroundColor: e.currentTarget.value })}
								/>
							</div>
						</div>
					{/if}

					<PositionGroup
						x={element.x}
						y={element.y}
						width={element.width}
						height={element.height}
						rotation={element.rotation || 0}
						onUpdate={(updates: Record<string, any>) => handlePositionChange(i, updates)}
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
		<button onclick={() => addElement('graphic')}>Add Graphic</button>
		<button onclick={() => addElement('qr')}>Add QR</button>
	</div>
</div>

<!-- Organization Asset Picker Modal -->
<OrgAssetPickerModal
	bind:open={assetPickerOpen}
	onSelect={handleAssetSelect}
	onClose={closeAssetPicker}
/>

<style>
	.element-list {
		width: 400px;
		background-color: var(--color-card);
		color: var(--color-foreground);
		padding: 0.75rem;
		border-radius: 0.5rem;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
	}

	.element-item {
		background-color: var(--color-muted);
		border-radius: 0.375rem;
		margin-bottom: 0.25rem;
		overflow: hidden;
	}

	.element-item.highlighted .element-header {
		background-color: var(--color-accent);
		box-shadow:
			0 0 0 1px rgba(139, 92, 246, 0.4) inset,
			0 0 8px rgba(139, 92, 246, 0.35);
	}

	.element-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.75rem;
		background-color: var(--color-secondary);
		cursor: pointer;
		user-select: none;
		min-height: 2rem;
	}

	.element-header:hover {
		background-color: var(--color-border);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.chevron {
		display: flex;
		align-items: center;
		color: var(--color-muted-foreground);
	}

	.element-type {
		font-weight: 500;
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.element-name {
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
	}

	.element-name.duplicate {
		color: #ff4444;
		font-weight: 500;
	}

	.element-inputs {
		padding: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.input-group {
		margin-bottom: 1rem;
	}

	.input-group label {
		display: block;
		margin-bottom: 0.375rem;
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.remove-element {
		background: none;
		border: none;
		color: var(--color-muted-foreground);
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

	.z-order-controls {
		display: flex;
		gap: 2px;
		margin-right: 0.5rem;
	}

	.z-btn {
		background: none;
		border: 1px solid var(--color-border);
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: 2px;
		line-height: 1;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.z-btn:hover:not(:disabled) {
		color: var(--color-foreground);
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.z-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Graphic element styles */
	.graphic-source-buttons {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.graphic-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		background-color: var(--color-secondary);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.graphic-btn:hover {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.graphic-preview {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background-color: var(--color-muted);
		border-radius: 0.375rem;
	}

	.remove-graphic-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		background-color: transparent;
		color: #ff4444;
		border: 1px solid #ff4444;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.remove-graphic-btn:hover {
		background-color: rgba(255, 68, 68, 0.1);
	}

	.hidden {
		display: none;
	}

	.options-textarea {
		width: 100%;
		min-height: 80px;
		background-color: var(--color-muted);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		padding: 0.5rem;
		font-family: inherit;
		resize: vertical;
	}

	.options-textarea:focus {
		outline: none;
		border-color: var(--color-ring);
	}

	.add-elements {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		margin-top: 16px;
	}

	.add-elements button {
		background-color: var(--color-secondary);
		border: none;
		color: var(--color-foreground);
		padding: 8px;
		cursor: pointer;
		border-radius: 3px;
		font-size: 12px;
		transition: background-color 0.2s;
	}

	.add-elements button:hover {
		background-color: var(--color-accent);
	}

	.error-message {
		color: #ff4444;
		font-size: 0.8rem;
		margin-top: 4px;
	}

	/* Background Section */
	.background-section .element-header {
		background-color: var(--color-accent);
	}

	.background-section .element-header:hover {
		background-color: var(--color-accent-foreground);
	}

	/* Loading placeholder for background controls */
	.loading-placeholder {
		padding: 2rem;
		text-align: center;
		color: var(--color-muted-foreground);
		font-style: italic;
		background: var(--color-muted);
		border-radius: 4px;
		border: 1px dashed var(--color-border);
	}

	/* Background controls container */
	.background-section-layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* QR element color inputs */
	.color-row {
		display: flex;
		gap: 1rem;
	}

	.color-input {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.color-input input[type="color"] {
		width: 100%;
		height: 32px;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		cursor: pointer;
		background: transparent;
	}

	.hint-text {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		margin-top: 0.25rem;
	}
</style>
