<script lang="ts">
	import { onMount } from 'svelte';
	import type { TemplateElement } from '$lib/types/types';
	import ElementList from './ElementList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Upload, Image, Plus, X, Move, Scaling } from '@lucide/svelte';
	import { loadGoogleFonts, getAllFontFamilies, isFontLoaded, fonts } from '../config/fonts';
	import { CoordinateSystem } from '$lib/utils/coordinateSystem';
	import { createAdaptiveElements } from '$lib/utils/adaptiveElements';

	let {
		side,
		preview,
		elements,
		onUpdateElements, // (elements:TemplateElement[], side: 'front' | 'back')
		onImageUpload, // (files: File[], side: 'front' | 'back')
		onRemoveImage, // (side: 'front' | 'back')
		// New props for dynamic sizing
		cardSize = null,
		pixelDimensions = null,
		// Background image controls
		backgroundPosition = $bindable({ x: 0, y: 0, scale: 1 } as {
			x: number;
			y: number;
			scale: number;
		}),
		onUpdateBackgroundPosition = null // (position: {x: number, y: number, scale: number}, side: 'front' | 'back') => void
	} = $props();

	// Calculate dynamic base dimensions
	let baseDimensions = $derived(() => {
		if (pixelDimensions && pixelDimensions.width > 0 && pixelDimensions.height > 0) {
			// Use actual pixel dimensions, scaled down for UI
			const maxWidth = 700; // Max width for preview
			const scale = Math.min(maxWidth / pixelDimensions.width, maxWidth / pixelDimensions.height);
			return {
				width: pixelDimensions.width * scale,
				height: pixelDimensions.height * scale,
				actualWidth: pixelDimensions.width,
				actualHeight: pixelDimensions.height
			};
		}
		// Return default dimensions when pixelDimensions is not yet available
		return {
			width: 0,
			height: 0,
			actualWidth: 0,
			actualHeight: 0
		};
	});

	let files: File[] = $state([]);
	let isDragging = false;
	let isResizing = false;
	let startX: number, startY: number;
	let currentElementIndex: number | null = null;
	let resizeHandle: string | null = null;

	// Background manipulation state
	let isDraggingBackground = false;
	let isResizingBackground = false;
	let backgroundResizeHandle: string | null = null;
	let templateContainer: HTMLElement | undefined = $state();
	let fontOptions: string[] = $state([]);
	let fontsLoaded = false;
	let previewDimensions = $state({
		width: 0,
		height: 0,
		scale: 1
	});

	// Calculate background positioning to align with elements
	let backgroundInfo = $derived(() => {
		const currentBase = baseDimensions();
		const container = previewDimensions;

		// Return early if dimensions are not yet available
		if (currentBase.actualWidth === 0 || currentBase.actualHeight === 0) {
			return { bgScale: 1, bgOffsetX: 0, bgOffsetY: 0 };
		}

		// Calculate how background-size: cover affects the image
		const backgroundAspect = currentBase.actualWidth / currentBase.actualHeight;
		const containerAspect = container.width / container.height;

		let bgScale,
			bgOffsetX = 0,
			bgOffsetY = 0;

		if (backgroundAspect > containerAspect) {
			// Background is wider - height fits, width is cropped
			bgScale = container.height / currentBase.actualHeight;
			const scaledBgWidth = currentBase.actualWidth * bgScale * 2;
			bgOffsetX = (container.width - scaledBgWidth) / 2; // Negative if cropped
		} else {
			// Background is taller - width fits, height is cropped
			bgScale = container.width / currentBase.actualWidth;
			const scaledBgHeight = currentBase.actualHeight * bgScale;
			bgOffsetY = (container.height - scaledBgHeight) / 2; // Negative if cropped
		}

		// Debug background positioning
		console.log('📱 Background positioning:', {
			currentBase,
			container,
			backgroundAspect,
			containerAspect,
			bgScale,
			bgOffsetX,
			bgOffsetY
		});

		return { bgScale, bgOffsetX, bgOffsetY };
	});

	// Unified coordinate system - use background scale for proper alignment
	let coordSystem = $derived(() => {
		const currentBase = baseDimensions();
		const bgInfo = backgroundInfo();

		// Return early if dimensions are not yet available
		if (currentBase.actualWidth === 0 || currentBase.actualHeight === 0) {
			return new CoordinateSystem(100, 100, 1); // Default fallback
		}

		// Use the actual background scale from CSS background-size: cover
		const scale = bgInfo.bgScale;

		return new CoordinateSystem(currentBase.actualWidth, currentBase.actualHeight, scale);
	});

	function updatePreviewDimensions() {
		if (!templateContainer?.parentElement) return;

		const currentBase = baseDimensions();

		// Return early if dimensions are not yet available
		if (currentBase.width === 0 || currentBase.height === 0) {
			return previewDimensions;
		}

		const parentWidth = templateContainer.parentElement.offsetWidth;
		const containerWidth = Math.min(parentWidth, currentBase.width);
		const containerHeight = (containerWidth / currentBase.width) * currentBase.height;

		const scale = containerWidth / currentBase.width;

		// Debug dimensions
		console.log('🔍 Dimensions Debug:', {
			parentWidth,
			currentBase,
			containerWidth,
			containerHeight,
			scale,
			templateContainerSize: templateContainer
				? {
						width: templateContainer.offsetWidth,
						height: templateContainer.offsetHeight
					}
				: 'not available'
		});

		previewDimensions = {
			width: containerWidth,
			height: containerHeight,
			scale
		};

		return previewDimensions;
	}

	onMount(() => {
		// Wait for dimensions to be available before creating elements
		if (elements.length === 0) {
			const currentBase = baseDimensions();
			if (currentBase.actualWidth > 0 && currentBase.actualHeight > 0) {
				elements = createAdaptiveElements(
					currentBase.actualWidth,
					currentBase.actualHeight,
					side,
					'aspect-ratio'
				);
			}
		}

		loadGoogleFonts()
			.then(() => {
				fontOptions = getAllFontFamilies();
				fontsLoaded = true;
			})
			.catch((error) => {
				console.error('Error loading some Google Fonts:', error);
				fontOptions = getAllFontFamilies();
				fontsLoaded = true;
			});

		const resizeObserver = new ResizeObserver(() => {
			updatePreviewDimensions();
		});

		if (templateContainer?.parentElement) {
			resizeObserver.observe(templateContainer.parentElement);
			updatePreviewDimensions();
		}

		return () => resizeObserver.disconnect();
	});

	function updateElements() {
		onUpdateElements?.(
			elements.map((el: TemplateElement) => ({ ...el, side })),
			side
		);
	}

	function limitDragBounds(
		index: number,
		x: number,
		y: number,
		width?: number,
		height?: number,
		metrics?: TextMetrics
	) {
		elements = elements.map((el: TemplateElement, i: number) => {
			if (i === index) {
				let newEl = { ...el, side };
				if (templateContainer) {
					const bounds = coordSystem().getStorageBounds();
					const maxX = bounds.width - (newEl.width || 0);
					const maxY = bounds.height - (newEl.height || 0);

					newEl.x = Math.round(Math.min(Math.max(x, 0), maxX));
					newEl.y = Math.round(Math.min(Math.max(y, 0), maxY));

					if ((el.type === 'photo' || el.type === 'signature') && width && height) {
						newEl.width = Math.max(20, Math.round(width));
						newEl.height = Math.max(20, Math.round(height));
					} else if (el.type === 'text' && metrics) {
						newEl.width = Math.max(20, Math.round(metrics.width / previewDimensions.scale));
					}
				}
				return newEl;
			}
			return el;
		});
		updateElements();
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

		// Use coordinate system for mouse movement conversion
		const storageDelta = coordSystem().scaleMouseDelta(dx, dy);

		const element = elements[currentElementIndex];
		if (!element) return;

		const updatedElements = [...elements];
		const updatedElement = { ...element };
		const bounds = coordSystem().getStorageBounds();

		if (isResizing && element.width !== undefined && element.height !== undefined) {
			let newWidth = element.width;
			let newHeight = element.height;
			let newX = element.x || 0;
			let newY = element.y || 0;

			switch (resizeHandle) {
				case 'top-left':
					newWidth -= storageDelta.x;
					newHeight -= storageDelta.y;
					newX += storageDelta.x;
					newY += storageDelta.y;
					break;
				case 'top-right':
					newWidth += storageDelta.x;
					newHeight -= storageDelta.y;
					newY += storageDelta.y;
					break;
				case 'bottom-left':
					newWidth -= storageDelta.x;
					newHeight += storageDelta.y;
					newX += storageDelta.x;
					break;
				case 'bottom-right':
					newWidth += storageDelta.x;
					newHeight += storageDelta.y;
					break;
			}

			// Constrain to bounds using coordinate system
			const constrainedPos = coordSystem().constrainToStorage(
				{ x: newX, y: newY },
				{ width: Math.max(20, newWidth), height: Math.max(20, newHeight) }
			);

			updatedElement.x = Math.round(constrainedPos.x);
			updatedElement.y = Math.round(constrainedPos.y);
			updatedElement.width = Math.max(20, Math.round(newWidth));
			updatedElement.height = Math.max(20, Math.round(newHeight));
		} else {
			// Just update position during dragging, maintain original size
			const newPos = {
				x: (element.x || 0) + storageDelta.x,
				y: (element.y || 0) + storageDelta.y
			};

			const constrainedPos = coordSystem().constrainToStorage(newPos, {
				width: element.width || 0,
				height: element.height || 0
			});

			updatedElement.x = Math.round(constrainedPos.x);
			updatedElement.y = Math.round(constrainedPos.y);
		}

		updatedElements[currentElementIndex] = updatedElement;
		onUpdateElements(updatedElements, side);

		startX = event.clientX;
		startY = event.clientY;
	}

	function onMouseUp() {
		isDragging = false;
		isResizing = false;
		currentElementIndex = null;
		resizeHandle = null;

		// Background manipulation cleanup
		isDraggingBackground = false;
		isResizingBackground = false;
		backgroundResizeHandle = null;
	}

	// Background manipulation functions similar to ThumbnailInput
	function handleBackgroundStart(event: MouseEvent, mode: 'move' | 'resize') {
		event.preventDefault();
		event.stopPropagation();

		const startPoint = { x: event.clientX, y: event.clientY };
		const startValues = {
			scale: backgroundPosition.scale,
			x: backgroundPosition.x,
			y: backgroundPosition.y
		};

		function handleMove(e: MouseEvent) {
			const currentPoint = { x: e.clientX, y: e.clientY };
			const dx = currentPoint.x - startPoint.x;
			const dy = currentPoint.y - startPoint.y;

			if (mode === 'resize') {
				// Scale based on diagonal movement like ThumbnailInput
				const delta = Math.max(dx, dy);
				const newScale = Math.max(0.1, Math.min(3, startValues.scale + delta / 100));
				backgroundPosition = { ...backgroundPosition, scale: newScale };
			} else {
				// Move position - scale the movement appropriately
				const scale = coordSystem().scale;
				backgroundPosition = {
					...backgroundPosition,
					x: startValues.x + dx / scale,
					y: startValues.y + dy / scale
				};
			}

			updateBackgroundPosition();
		}

		function handleEnd() {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
		}

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleEnd);
	}

	function updateBackgroundPosition() {
		if (onUpdateBackgroundPosition) {
			onUpdateBackgroundPosition(backgroundPosition, side);
		}
	}

	let elementStyle = $derived((element: TemplateElement) => {
		const currentCoordSystem = coordSystem();
		const bgInfo = backgroundInfo();

		// Get base position from coordinate system
		const baseStyle = currentCoordSystem.createPositionStyle(
			element.x || 0,
			element.y || 0,
			element.width || 0,
			element.height || 0
		);

		// Apply background offset to align with actual background position
		const adjustedStyle = {
			...baseStyle,
			left: `${Math.round(parseFloat(baseStyle.left) + bgInfo.bgOffsetX)}px`,
			top: `${Math.round(parseFloat(baseStyle.top) + bgInfo.bgOffsetY)}px`
		};

		// Debug element positioning for key elements
		if (element.variableName === 'name' || element.variableName === 'photo') {
			console.log(`📍 Element "${element.variableName}" positioning:`, {
				storageCoords: { x: element.x, y: element.y, width: element.width, height: element.height },
				baseStyle,
				backgroundOffset: { x: bgInfo.bgOffsetX, y: bgInfo.bgOffsetY },
				adjustedStyle,
				coordSystemScale: currentCoordSystem.scale
			});
		}

		return adjustedStyle;
	});

	let textStyle = $derived((element: TemplateElement) => {
		const currentCoordSystem = coordSystem();
		const scale = currentCoordSystem.scale;
		return {
			'font-family': `"${element.font || 'Arial'}", sans-serif`,
			'font-weight': element.fontWeight || '400',
			'font-style': element.fontStyle || 'normal',
			'font-size': `${Math.round((element.size || 16) * scale)}px`,
			color: element.color || '#000000',
			'text-align': element.alignment || 'left',
			'text-transform': element.textTransform || 'none',
			'text-decoration-line': element.textDecoration || 'none',
			'letter-spacing': element.letterSpacing
				? `${Math.round(element.letterSpacing * scale)}px`
				: 'normal',
			'line-height': element.lineHeight || '1.2',
			opacity: typeof element.opacity === 'number' ? element.opacity : 1,
			display: 'block',
			width: '100%',
			'white-space': 'pre-wrap',
			'word-break': 'break-word'
		};
	});

	function stopPropagation(fn: (e: MouseEvent) => void) {
		return (e: MouseEvent) => {
			e.stopPropagation();
			fn(e);
		};
	}
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="template-section">
	<h2 class="text-2xl font-semibold mb-4 text-foreground">
		{side.charAt(0).toUpperCase() + side.slice(1)} Template
	</h2>
	<div class="template-layout">
		<div
			class="preview-container"
			style="max-width: {baseDimensions().width || 0}px; aspect-ratio: {baseDimensions().width ||
				1}/{baseDimensions().height || 1};"
		>
			<div
				class="template-container {side} group"
				class:has-preview={preview}
				bind:this={templateContainer}
				style="background-image: {preview ? `url('${preview}')` : 'none'}; 
                       background-size: {preview ? `${100 * backgroundPosition.scale}%` : 'cover'};
                       background-position: {preview
					? `${50 + backgroundPosition.x}% ${50 + backgroundPosition.y}%`
					: 'center'};
                       background-repeat: no-repeat;
                       background-color: white;"
			>
				{#if !preview}
					<label class="placeholder-design clickable-container">
						<input
							type="file"
							accept="image/*"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								const files = Array.from(target?.files || []);
								if (files.length > 0) onImageUpload(files, side);
							}}
							class="hidden-file-input"
						/>
						<div class="placeholder-content">
							<div class="icon-container">
								<Image class="w-8 h-8 mb-2 text-muted-foreground/40" />
								<Plus class="w-4 h-4 text-primary absolute -right-1 -bottom-1" />
							</div>
							<h3 class="text-lg font-medium text-foreground/80 mb-1">Add Template Background</h3>
							<p class="text-sm text-muted-foreground mb-4">
								Required size: {baseDimensions().actualWidth || 0}×{baseDimensions().actualHeight ||
									0} pixels
								{#if cardSize}
									<br />
									<span class="text-xs">
										({cardSize.width}{cardSize.unit === 'inches'
											? '"'
											: cardSize.unit === 'mm'
												? 'mm'
												: cardSize.unit === 'cm'
													? 'cm'
													: 'px'} × {cardSize.height}{cardSize.unit === 'inches'
											? '"'
											: cardSize.unit === 'mm'
												? 'mm'
												: cardSize.unit === 'cm'
													? 'cm'
													: 'px'} at 300 DPI)
									</span>
								{/if}
							</p>
							<div class="upload-button">
								<span class="upload-text">
									<Upload class="w-4 h-4 mr-2" />
									Choose File or Click Anywhere
								</span>
							</div>
						</div>
						<div class="placeholder-grid"></div>
					</label>
				{:else}
					{#each elements as element, i}
						<div
							class="template-element {element.type}"
							style={Object.entries(elementStyle(element))
								.map(([key, value]) => `${key}: ${value}`)
								.join(';')}
							onmousedown={(e) => onMouseDown(e, i)}
							role="button"
							tabindex="0"
							aria-label="{element.type} element"
						>
							{#if element.type === 'text' || element.type === 'selection'}
								<span
									style={Object.entries(textStyle(element))
										.map(([key, value]) => `${key}: ${value}`)
										.join(';')}
								>
									{element.type === 'selection'
										? element.content || element.options?.[0] || 'Select option'
										: element.content}
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
								<div
									class="resize-handle top-left"
									onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-left'))}
									role="button"
									tabindex="0"
									aria-label="Resize top left"
								></div>
								<div
									class="resize-handle top-right"
									onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-right'))}
									role="button"
									tabindex="0"
									aria-label="Resize top right"
								></div>
								<div
									class="resize-handle bottom-left"
									onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-left'))}
									role="button"
									tabindex="0"
									aria-label="Resize bottom left"
								></div>
								<div
									class="resize-handle bottom-right"
									onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-right'))}
									role="button"
									tabindex="0"
									aria-label="Resize bottom right"
								></div>
							</div>
						</div>
					{/each}
					<Button
						variant="destructive"
						size="icon"
						class="remove-image"
						onclick={() => onRemoveImage(side)}
					>
						<X class="w-4 h-4" />
					</Button>
				{/if}
			</div>
		</div>
		{#if preview}
			<ElementList
				{elements}
				{onUpdateElements}
				{fontOptions}
				{side}
				{preview}
				bind:backgroundPosition
				{onUpdateBackgroundPosition}
				{cardSize}
				{pixelDimensions}
			/>
		{/if}
	</div>
</div>

<style>
	.template-section {
		margin-bottom: 2.5rem;
		width: 100%;
		padding: 1rem;
		padding-right: 120px; /* Add space for background controls */
		overflow: visible;
	}

	.template-layout {
		display: flex;
		gap: 1.25rem;
		width: 100%;
		flex-direction: column;
		overflow: visible; /* Allow controls to extend outside */
	}

	@media (min-width: 1024px) {
		.template-layout {
			flex-direction: row;
			align-items: flex-start;
		}

		.preview-container {
			flex: 0 0 600px;
			max-width: 600px;
		}
	}

	.preview-container {
		width: 100%;
		max-width: 600px;
		/* aspect-ratio is now set dynamically via style attribute */
		position: relative;
		background: var(--background);
		overflow: visible; /* Allow handles to extend outside */
	}

	.template-container {
		width: 100%;
		height: 100%;
		border: 1px solid #000;
		position: relative;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-color: white;
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

	.clickable-container {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clickable-container:hover {
		background: var(--accent);
	}

	.clickable-container:hover .placeholder-content {
		transform: scale(1.02);
	}

	.hidden-file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.placeholder-content {
		position: relative;
		z-index: 10;
		text-align: center;
		padding: 1.5rem;
		transition: transform 0.2s ease;
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
		background-image:
			linear-gradient(to right, var(--primary) 1px, transparent 1px),
			linear-gradient(to bottom, var(--primary) 1px, transparent 1px);
		background-size: 20px 20px;
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
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	.upload-button {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background-color: var(--primary);
		color: white;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.upload-button:hover {
		background-color: var(--primary-hover);
	}

	.upload-button input[type='file'] {
		display: none;
	}

	.upload-text {
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
	}

	.remove-image {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 10;
	}

	.resize-handle.top-left {
		top: -4px;
		left: -4px;
		cursor: nwse-resize;
	}
	.resize-handle.top-right {
		top: -4px;
		right: -4px;
		cursor: nesw-resize;
	}
	.resize-handle.bottom-left {
		bottom: -4px;
		left: -4px;
		cursor: nesw-resize;
	}
	.resize-handle.bottom-right {
		bottom: -4px;
		right: -4px;
		cursor: nwse-resize;
	}
</style>
