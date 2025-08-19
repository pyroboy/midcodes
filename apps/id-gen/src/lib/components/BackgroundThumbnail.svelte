<script lang="ts">
	import { onMount } from 'svelte';
	import { Move, Scaling, RotateCcw, BugPlay } from '@lucide/svelte';
	import { calculateCropFrame, validateCropFrameAlignment, calculatePositionFromFrame, coverBase, computeDraw, computeVisibleRectInImage, computeContainerViewportInImage, mapImageRectToThumb, clampBackgroundPosition, type Dims, type BackgroundPosition } from '$lib/utils/backgroundGeometry';
	import { browser } from '$app/environment';
	import { logDebugInfo, type DebugInfo } from '$lib/utils/backgroundDebug';
	
	interface Props {
		imageUrl: string;
		templateDimensions: { width: number; height: number };
		position: { x: number; y: number; scale: number };
		onPositionChange: (position: { x: number; y: number; scale: number }) => void;
		maxThumbnailWidth?: number;
		disabled?: boolean;
		debugMode?: boolean;
	}

	let {
		imageUrl,
		templateDimensions,
		position = $bindable({ x: 0, y: 0, scale: 1 }),
		onPositionChange,
		maxThumbnailWidth = 150,
		disabled = false,
		debugMode = false
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDragging = $state(false);
	let imageElement: HTMLImageElement | null = $state(null);
	
	// Debug state for visual feedback verification
	let debugState = $state({
		lastUpdate: Date.now(),
		position,
		cropFrameInfo: null as any,
		validationInfo: true,
		enabled: true // Enable debug by default
	});
	
	// Calculate thumbnail dimensions to match selected image aspect ratio
	const thumbnailDimensions = $derived(() => {
		if (imageElement && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
			const imageAspect = imageElement.naturalWidth / imageElement.naturalHeight;
			
			// Calculate dimensions that fit within maxThumbnailWidth while maintaining image aspect ratio
			let thumbWidth = maxThumbnailWidth;
			let thumbHeight = maxThumbnailWidth / imageAspect;
			
			// If height exceeds maxThumbnailWidth, constrain by height instead
			if (thumbHeight > maxThumbnailWidth) {
				thumbHeight = maxThumbnailWidth;
				thumbWidth = maxThumbnailWidth * imageAspect;
			}
			
			const result = {
				width: Math.round(thumbWidth),
				height: Math.round(thumbHeight)
			};
			return result;
		}
		
		// Fallback to square if no image loaded yet
		return {
			width: maxThumbnailWidth,
			height: maxThumbnailWidth
		};
	});

	// Legacy THUMB_SIZE for compatibility (use width as primary dimension)
	const THUMB_SIZE = $derived(thumbnailDimensions().width);

	// Only log debug info when explicitly called, not on reactive updates
	function logThumbnailDebug(isUserInteraction = false) {
		if (debugState.enabled && browser && isUserInteraction) {
			// Update debug state
			debugState = {
				...debugState,
				lastUpdate: Date.now(),
				position: { ...position },
				cropFrameInfo: cropFrame(),
				validationInfo: isValidCropAlignment()
			};

			// Broadcast position update for debugging
			const debugInfo: DebugInfo = {
				component: 'BackgroundThumbnail',
				position,
				cropFrame: debugState.cropFrameInfo,
				timestamp: Date.now()
			};

			logDebugInfo(debugInfo);

			window.dispatchEvent(new CustomEvent('background-position-update', {
				detail: debugInfo
			}));
		}
	}

	// Listen for position updates from other components
	onMount(() => {
		if (browser) {
			const listener = (e: Event) => {
				if (debugMode && e instanceof CustomEvent) {
					console.log('📡 Position sync:', e.detail);
				}
			};
			window.addEventListener('background-position-update', listener);
			return () => window.removeEventListener('background-position-update', listener);
		}
	});

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		loadImage();
	});

	function loadImage() {
		if (!imageUrl) return;
		
		const img = new Image();
		img.crossOrigin = 'anonymous';
		
		img.onload = () => {
			imageElement = img;
			drawThumbnail();
		};
		
		img.onerror = () => {
			console.error('Failed to load image');
		};
		
		img.src = imageUrl;
	}

	function drawThumbnail() {
		if (!ctx || !imageElement) return;

		const thumbDims = thumbnailDimensions();
		
		// Clear canvas
		ctx.clearRect(0, 0, thumbDims.width, thumbDims.height);
		
		// Reset transforms
		ctx.resetTransform();
		
		// NEW LOGIC: Always draw the full image, thumbnail now matches image aspect ratio
		const imageDims: Dims = {
			width: imageElement!.naturalWidth,
			height: imageElement!.naturalHeight
		};
		
		// Draw the full image scaled to fit the thumbnail (object-fit: contain)
		const imgAspect = imageDims.width / imageDims.height;
		const thumbAspect = thumbDims.width / thumbDims.height;
		
		let drawWidth, drawHeight, offsetX, offsetY;
		
		if (imgAspect > thumbAspect) {
			// Image is wider - fit to width
			drawWidth = thumbDims.width;
			drawHeight = thumbDims.width / imgAspect;
			offsetX = 0;
			offsetY = (thumbDims.height - drawHeight) / 2;
		} else {
			// Image is taller - fit to height
			drawHeight = thumbDims.height;
			drawWidth = thumbDims.height * imgAspect;
			offsetX = (thumbDims.width - drawWidth) / 2;
			offsetY = 0;
		}
		
		// Draw the entire image
		ctx.drawImage(imageElement, offsetX, offsetY, drawWidth, drawHeight);
		
		// Draw border around thumbnail
		ctx.strokeStyle = '#e5e7eb';
		ctx.lineWidth = 1;
		ctx.strokeRect(0.5, 0.5, thumbDims.width - 1, thumbDims.height - 1);
	}

	function handleStart(event: MouseEvent | TouchEvent, mode: 'move' | 'resize') {
		if (disabled) return;
		
		event.preventDefault();
		isDragging = true;

		const startPoint = 'touches' in event
			? { x: event.touches[0].clientX, y: event.touches[0].clientY }
			: { x: event.clientX, y: event.clientY };

		const startValues = { ...position };

		function handleMove(e: MouseEvent | TouchEvent) {
			if (!isDragging) return;

			const currentPoint = 'touches' in e
				? { x: e.touches[0].clientX, y: e.touches[0].clientY }
				: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

			const dx = currentPoint.x - startPoint.x;
			const dy = currentPoint.y - startPoint.y;

			if (mode === 'resize') {
				// Scale based on diagonal movement like ThumbnailInput
				const delta = Math.max(dx, dy);
				const newScale = Math.max(0.1, Math.min(3, startValues.scale + delta / 100));
				const newPosition = { 
					x: startValues.x,
					y: startValues.y,
					scale: newScale 
				};
				
				// Apply clamping to scale operations with scale constraints
				if (imageElement) {
					const imageDims: Dims = {
						width: imageElement.naturalWidth,
						height: imageElement.naturalHeight
					};
					
					// Calculate minimum scale to ensure image always covers template area
					const { s0 } = coverBase(imageDims, templateDimensions);
					const minScale = Math.max(0.1, s0 > 0 ? 1 / s0 : 0.1); // Minimum scale to maintain coverage
					const maxScale = 3; // Maximum scale limit
					
					// Clamp scale first
					const clampedScale = Math.max(minScale, Math.min(maxScale, newPosition.scale));
					const scaleClampedPosition = { ...newPosition, scale: clampedScale };
					
					// Then apply position clamping
					position = clampBackgroundPosition(imageDims, templateDimensions, scaleClampedPosition);
				} else {
					position = newPosition;
				}
			} else {
				// Move position - convert screen pixels to template coordinates
				// SYNCHRONIZED WITH MAIN CANVAS: Use exact same coordinate conversion
				const thumbDims = thumbnailDimensions();
				
				// Use the same logic as main canvas: image dimensions scaled by thumbnail display scale
				// Main uses: previewScale = previewDimensions.scale (calculated as containerWidth / baseWidth)
				// For thumbnail: calculate equivalent scale
				if (imageElement) {
					const imageAspect = imageElement.naturalWidth / imageElement.naturalHeight;
					const thumbAspect = thumbDims.width / thumbDims.height;
					
					// Calculate how image is displayed in thumbnail (object-fit: contain)
					let imageDisplayScale;
					if (imageAspect > thumbAspect) {
						// Image fits to thumbnail width
						imageDisplayScale = thumbDims.width / imageElement.naturalWidth;
					} else {
						// Image fits to thumbnail height  
						imageDisplayScale = thumbDims.height / imageElement.naturalHeight;
					}
					
					const newPosition = {
						x: startValues.x - dx / imageDisplayScale,
						y: startValues.y - dy / imageDisplayScale,
						scale: startValues.scale
					};
					
					// Apply clamping to prevent red box from going out of bounds
					const imageDims: Dims = {
						width: imageElement.naturalWidth,
						height: imageElement.naturalHeight
					};
					
					position = clampBackgroundPosition(imageDims, templateDimensions, newPosition);
				} else {
					// Fallback to old logic if image not available
					const thumbnailDisplayScale = thumbDims.width / templateDimensions.width;
					const newPosition = {
						x: startValues.x + dx / thumbnailDisplayScale,
						y: startValues.y + dy / thumbnailDisplayScale,
						scale: startValues.scale
					};
					
					// Apply clamping even in fallback case
					if (imageElement && imageElement instanceof HTMLImageElement && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
						const imageDims: Dims = {
							width: imageElement.naturalWidth,
							height: imageElement.naturalHeight
						};
						position = clampBackgroundPosition(imageDims, templateDimensions, newPosition);
					} else {
						position = newPosition; // No clamping if no image available
					}
				}
			}

				onPositionChange(position);
				
				// Log debug info for user interaction
				logThumbnailDebug(true);
		}

		function handleEnd() {
			isDragging = false;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleEnd);
		}

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleEnd);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', handleEnd);
	}

	function autoFit() {
		if (disabled) return;
		
		const newPosition = { x: 0, y: 0, scale: 1 };
		position = newPosition;
		onPositionChange(newPosition);
		
		// Log debug info for user interaction
		logThumbnailDebug(true);
	}

	// Calculate crop frame to show template boundaries using GROUND TRUTH function
	let cropFrame = $derived(() => {
		if (!imageElement || !templateDimensions.width || !templateDimensions.height) {
			return null;
		}
		
		const imageDims: Dims = {
			width: imageElement!.naturalWidth,
			height: imageElement!.naturalHeight
		};

		const containerDims: Dims = templateDimensions;
		const thumbDims = thumbnailDimensions();
		
		// ✅ FIXED: Use container viewport instead of visible rect for consistent size
		// The red box represents the container viewport boundaries, not the visible image area
		// This ensures the red box maintains constant size when panning (only position changes)
		const viewportRect = computeContainerViewportInImage(imageDims, containerDims, position);
		
		// Then map to thumbnail coordinates using the ground truth mapping function
		const thumbnailRect = mapImageRectToThumb(viewportRect, imageDims, thumbDims);
		
		// ✅ DEBUG: Log the coordinate transformation for verification
		if (debugState.enabled && browser) {
			console.log('🎯 Crop Frame Calculation:', {
				position,
				imageDims,
				containerDims,
				thumbDims,
				viewportRect,
				thumbnailRect,
				mappedResult: {
					x: Math.round(thumbnailRect.x * 100) / 100,
					y: Math.round(thumbnailRect.y * 100) / 100,
					width: Math.round(thumbnailRect.width * 100) / 100,
					height: Math.round(thumbnailRect.height * 100) / 100
				}
			});
		}
		
		// The viewport can extend beyond image bounds, so we don't clamp to thumbnail bounds
		// This allows the red box to show the true container viewport position
		return {
			x: thumbnailRect.x,
			y: thumbnailRect.y,
			width: Math.max(1, thumbnailRect.width), // Minimum 1px to ensure visibility
			height: Math.max(1, thumbnailRect.height) // Minimum 1px to ensure visibility
		};
	});
	
	// Validation for debugging
	let isValidCropAlignment = $derived(() => {
		if (!imageElement) return true;
		
		const imageDims: Dims = {
			width: imageElement!.naturalWidth,
			height: imageElement!.naturalHeight
		};
		
		const containerDims: Dims = templateDimensions;
		const positionData: BackgroundPosition = position;
		
		return validateCropFrameAlignment(imageDims, containerDims, positionData);
	});

	// Calculate handle positions
	let handlePositions = $derived(() => {
		const frame = cropFrame();
		if (!frame) return null;
		
		const handleSize = 8; // Handle size in pixels
		const offset = handleSize / 2; // Center the handle on the corner
		
		// Position handles relative to the red box (crop-frame) div, not absolute thumbnail
		// Since the handles are children of the crop-frame div, we use relative positioning
		return {
			topLeft: { 
				x: -offset, // Top-left corner of red box
				y: -offset 
			},
			topRight: { 
				x: frame.width - offset, // Top-right corner of red box
				y: -offset 
			},
			bottomLeft: { 
				x: -offset, // Bottom-left corner of red box
				y: frame.height - offset 
			},
			bottomRight: { 
				x: frame.width - offset, // Bottom-right corner of red box
				y: frame.height - offset 
			}
		};
	});

	// Handle red box dragging (moving the entire crop area)
	function handleRedBoxDrag(event: MouseEvent | TouchEvent) {
		if (disabled) return;
		
		// Check if the click is on a resize handle - if so, don't start drag
		const target = event.target as HTMLElement;
		if (target.classList.contains('resize-handle')) {
			return; // Let resize handle take precedence
		}
		
		event.preventDefault();
		event.stopPropagation();
		isDragging = true;

		const startPoint = 'touches' in event
			? { x: event.touches[0].clientX, y: event.touches[0].clientY }
			: { x: event.clientX, y: event.clientY };

		const startValues = { ...position };

		function handleMove(e: MouseEvent | TouchEvent) {
			if (!isDragging) return;

			const currentPoint = 'touches' in e
				? { x: e.touches[0].clientX, y: e.touches[0].clientY }
				: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

			const dx = currentPoint.x - startPoint.x;
			const dy = currentPoint.y - startPoint.y;

			// Use the same coordinate conversion logic as existing move operation
			const thumbDims = thumbnailDimensions();
			
			if (imageElement) {
				const imageAspect = imageElement.naturalWidth / imageElement.naturalHeight;
				const thumbAspect = thumbDims.width / thumbDims.height;
				
				// Calculate how image is displayed in thumbnail (object-fit: contain)
				let imageDisplayScale;
				if (imageAspect > thumbAspect) {
					// Image fits to thumbnail width
					imageDisplayScale = thumbDims.width / imageElement.naturalWidth;
				} else {
					// Image fits to thumbnail height  
					imageDisplayScale = thumbDims.height / imageElement.naturalHeight;
				}
				
				const newPosition = {
					x: startValues.x - dx / imageDisplayScale,
					y: startValues.y - dy / imageDisplayScale,
					scale: startValues.scale
				};
				
				// Apply clamping to prevent red box from going out of bounds
				const imageDims: Dims = {
					width: imageElement.naturalWidth,
					height: imageElement.naturalHeight
				};
				
				position = clampBackgroundPosition(imageDims, templateDimensions, newPosition);
			} else {
				// Fallback to old logic if image not available
				const thumbnailDisplayScale = thumbDims.width / templateDimensions.width;
				const newPosition = {
					x: startValues.x + dx / thumbnailDisplayScale,
					y: startValues.y + dy / thumbnailDisplayScale,
					scale: startValues.scale
				};
				
				// Apply clamping even in fallback case
				if (imageElement && imageElement instanceof HTMLImageElement && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
					const imageDims: Dims = {
						width: imageElement.naturalWidth,
						height: imageElement.naturalHeight
					};
					position = clampBackgroundPosition(imageDims, templateDimensions, newPosition);
				} else {
					position = newPosition; // No clamping if no image available
				}
			}

			onPositionChange(position);
			
			// Log debug info for user interaction
			logThumbnailDebug(true);
		}

		function handleEnd() {
			isDragging = false;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleEnd);
		}

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleEnd);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', handleEnd);
	}

	// Handle resize operations
	function handleResize(event: MouseEvent | TouchEvent, handle: string) {
		if (disabled) return;
		
		event.preventDefault();
		isDragging = true;
		
		const startPoint = 'touches' in event
			? { x: event.touches[0].clientX, y: event.touches[0].clientY }
			: { x: event.clientX, y: event.clientY };
		
		const startFrame = cropFrame();
		if (!startFrame || !imageElement) return;
		
		function handleMove(e: MouseEvent | TouchEvent) {
			if (!isDragging || !startFrame || !imageElement) return;
			
			const currentPoint = 'touches' in e
				? { x: e.touches[0].clientX, y: e.touches[0].clientY }
				: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
			
			const dx = currentPoint.x - startPoint.x;
			const dy = currentPoint.y - startPoint.y;
			
			// Calculate new frame dimensions based on handle direction
			let newWidth = startFrame.width;
			let newHeight = startFrame.height;
			let newX = startFrame.x;
			let newY = startFrame.y;
			
			switch (handle) {
				case 'top-left':
					newWidth = Math.max(20, startFrame.width - dx);
					newHeight = Math.max(20, startFrame.height - dy);
					newX = startFrame.x + (startFrame.width - newWidth);
					newY = startFrame.y + (startFrame.height - newHeight);
					break;
				case 'top-right':
					newWidth = Math.max(20, startFrame.width + dx);
					newHeight = Math.max(20, startFrame.height - dy);
					newY = startFrame.y + (startFrame.height - newHeight);
					break;
				case 'bottom-left':
					newWidth = Math.max(20, startFrame.width - dx);
					newHeight = Math.max(20, startFrame.height + dy);
					newX = startFrame.x + (startFrame.width - newWidth);
					break;
				case 'bottom-right':
					newWidth = Math.max(20, startFrame.width + dx);
					newHeight = Math.max(20, startFrame.height + dy);
					break;
			}
			
			// Clamp to thumbnail bounds
			newX = Math.max(0, Math.min(THUMB_SIZE - newWidth, newX));
			newY = Math.max(0, Math.min(THUMB_SIZE - newHeight, newY));
			newWidth = Math.min(THUMB_SIZE - newX, newWidth);
			newHeight = Math.min(THUMB_SIZE - newY, newHeight);
			
			// Calculate the corresponding position change
			const imageDims: Dims = {
				width: imageElement!.naturalWidth,
				height: imageElement!.naturalHeight
			};
			
			const newPos = calculatePositionFromFrame(
				newWidth, 
				newHeight, 
				newX, 
				newY, 
				imageDims, 
				templateDimensions,
				THUMB_SIZE
			);
			
			// Apply clamping to resize operations as well
			const clampedPos = clampBackgroundPosition(imageDims, templateDimensions, newPos);
			
			position = clampedPos;
			onPositionChange(clampedPos);
			
			// Log debug info for user interaction
			logThumbnailDebug(true);
		}
		
		function handleEnd() {
			isDragging = false;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleEnd);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleEnd);
		}
		
		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleEnd);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', handleEnd);
	}

	// Redraw when image changes
	$effect(() => {
		if (imageUrl) {
			loadImage();
		}
	});

	// Redraw when thumbnail size changes
	$effect(() => {
		if (THUMB_SIZE && imageElement && ctx) {
			drawThumbnail();
		}
	});

	// Redraw when position changes
	$effect(() => {
		if (position && imageElement && ctx) {
			drawThumbnail();
		}
	});

	// Debug state is now updated only during user interactions
	// No automatic $effect to prevent infinite loops
</script>

<div class="background-thumbnail" class:disabled class:dragging={isDragging}>
	<div class="thumbnail-container">
		<div class="thumbnail-wrapper" style="--thumb-width: {thumbnailDimensions().width}px; --thumb-height: {thumbnailDimensions().height}px;">
			<canvas
				bind:this={canvas}
				width={thumbnailDimensions().width}
				height={thumbnailDimensions().height}
				class="thumbnail-canvas"
			></canvas>
			
			<!-- Calculated crop frame overlay -->
			<div class="crop-overlay">
				{#if cropFrame() && handlePositions()}
					{@const frame = cropFrame()!}
					{@const handles = handlePositions()!}
					<div 
						class="crop-frame"
						class:invalid={!isValidCropAlignment()}
						class:draggable={!disabled}
						style="
							left: {frame.x}px;
							top: {frame.y}px;
							width: {frame.width}px;
							height: {frame.height}px;
							cursor: {disabled ? 'default' : 'move'};
						"
						onmousedown={(e) => !disabled && handleRedBoxDrag(e)}
						ontouchstart={(e) => !disabled && handleRedBoxDrag(e)}
						role="button"
						aria-label="Drag to move crop area"
						tabindex="0"
					>
						<!-- Resize handles -->
						{#if !disabled}
							<div 
								class="resize-handle top-left"
								style="left: {handles.topLeft.x}px; top: {handles.topLeft.y}px; cursor: nw-resize;"
								onmousedown={(e) => handleResize(e, 'top-left')}
								ontouchstart={(e) => handleResize(e, 'top-left')}
								role="button"
								aria-label="Resize top-left"
								tabindex="0"
							></div>
							<div 
								class="resize-handle top-right"
								style="left: {handles.topRight.x}px; top: {handles.topRight.y}px; cursor: ne-resize;"
								onmousedown={(e) => handleResize(e, 'top-right')}
								ontouchstart={(e) => handleResize(e, 'top-right')}
								role="button"
								aria-label="Resize top-right"
								tabindex="0"
							></div>
							<div 
								class="resize-handle bottom-left"
								style="left: {handles.bottomLeft.x}px; top: {handles.bottomLeft.y}px; cursor: sw-resize;"
								onmousedown={(e) => handleResize(e, 'bottom-left')}
								ontouchstart={(e) => handleResize(e, 'bottom-left')}
								role="button"
								aria-label="Resize bottom-left"
								tabindex="0"
							></div>
							<div 
								class="resize-handle bottom-right"
								style="left: {handles.bottomRight.x}px; top: {handles.bottomRight.y}px; cursor: se-resize;"
								onmousedown={(e) => handleResize(e, 'bottom-right')}
								ontouchstart={(e) => handleResize(e, 'bottom-right')}
								role="button"
								aria-label="Resize bottom-right"
								tabindex="0"
							></div>
						{/if}
						
						<!-- Template area center point indicator (center of red box) -->
						<div 
							class="template-center-indicator" 
							style="left: 50%; top: 50%; pointer-events: none;">
							🎯
						</div>
						
						<!-- Crop preview overlay -->
						{#if isDragging && debugMode}
								<div class="crop-preview" style="pointer-events: none;">
									<div class="preview-indicator">
										<span>Crop: {Math.round(frame.width)}×{Math.round(frame.height)}px</span>
										<span>Scale: {(position.scale * 100).toFixed(0)}%</span>
										<span>Pos: {Math.round(position.x)}, {Math.round(position.y)}</span>
										<span><strong>Thumbnail Red Box:</strong></span>
										<span>Top-Left: ({Math.round(frame.x)}, {Math.round(frame.y)})</span>
									</div>
								</div>
							{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Control handles -->
	<div class="control-handles">
		<button
			class="control-handle move-handle"
			class:dragging={isDragging}
			onmousedown={(e) => handleStart(e, 'move')}
			ontouchstart={(e) => handleStart(e, 'move')}
			disabled={disabled}
			title="Drag to move background"
		>
			<Move size={14} />
		</button>
		
		<button
			class="control-handle scale-handle"
			class:dragging={isDragging}
			onmousedown={(e) => handleStart(e, 'resize')}
			ontouchstart={(e) => handleStart(e, 'resize')}
			disabled={disabled}
			title="Drag to scale background"
		>
			<Scaling size={14} />
		</button>
		
		<button
			class="control-handle auto-fit-handle"
			onclick={autoFit}
			disabled={disabled}
			title="Auto-fit background"
		>
			<RotateCcw size={14} />
		</button>
		
		<button
			class="control-handle debug-handle"
			class:active={debugState.enabled}
			onclick={() => debugState.enabled = !debugState.enabled}
			disabled={disabled}
			title="Toggle debug mode"
		>
			<BugPlay size={14} />
		</button>
	</div>

	<!-- Position info -->
	{#if !disabled}
		<div class="position-info">
			<div class="info-row">
				<span class="info-label">Position:</span>
				<span class="info-value">{Math.round(position.x)}, {Math.round(position.y)}</span>
			</div>
			<div class="info-row">
				<span class="info-label">Scale:</span>
				<span class="info-value">{(position.scale * 100).toFixed(0)}%</span>
			</div>
			{#if cropFrame()}
				{@const frame = cropFrame()!}
				<div class="info-row">
					<span class="info-label"><strong>Red Box Corners:</strong></span>
					<span class="info-value"></span>
				</div>
				<div class="info-row">
					<span class="info-label">Top-Left:</span>
					<span class="info-value">
						({Math.round(frame.x)}, {Math.round(frame.y)})
					</span>
				</div>
				<div class="info-row">
					<span class="info-label">Top-Right:</span>
					<span class="info-value">
						({Math.round(frame.x + frame.width)}, {Math.round(frame.y)})
					</span>
				</div>
				<div class="info-row">
					<span class="info-label">Bottom-Left:</span>
					<span class="info-value">
						({Math.round(frame.x)}, {Math.round(frame.y + frame.height)})
					</span>
				</div>
				<div class="info-row">
					<span class="info-label">Bottom-Right:</span>
					<span class="info-value">
						({Math.round(frame.x + frame.width)}, {Math.round(frame.y + frame.height)})
					</span>
				</div>
			{/if}
			{#if debugMode && cropFrame()}
				{@const frame = cropFrame()!}
				<div class="debug-info">
					<div class="info-row">
						<span class="info-label">Crop Frame:</span>
						<span class="info-value">
							x={Math.round(frame.x)}, y={Math.round(frame.y)}
						</span>
					</div>
					<div class="info-row">
						<span class="info-label">Crop Size:</span>
						<span class="info-value">
							{Math.round(frame.width)}×{Math.round(frame.height)}
						</span>
					</div>
					<div class="info-row">
						<span class="info-label">Valid:</span>
						<span class="info-value" class:valid={isValidCropAlignment()} class:invalid={!isValidCropAlignment()}>
							{isValidCropAlignment() ? 'Yes' : 'No'}
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.background-thumbnail {
		display: flex;
		flex-direction: column;
		gap: 8px;
		user-select: none;
	}

	.background-thumbnail.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.thumbnail-container {
		display: flex;
		justify-content: center;
	}

	.thumbnail-wrapper {
		position: relative;
		border-radius: 6px;
		overflow: hidden;
		background: #f9fafb;
		width: var(--thumb-width, 150px);
		height: var(--thumb-height, 150px);
	}

	.thumbnail-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.crop-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.crop-frame {
		position: absolute;
		/* Dynamic positioning via inline styles */
		border: 3px solid #ef4444;
		background: rgba(239, 68, 68, 0.15);
		box-shadow: 
			0 0 0 2px rgba(255, 255, 255, 0.9),
			0 0 0 9999px rgba(0, 0, 0, 0.4);
		transition: all 0.2s ease;
		z-index: 10;
		pointer-events: auto; /* Enable pointer events for dragging */
		cursor: move !important; /* Force move cursor everywhere on the crop frame */
	}
	
	/* Add a pseudo-element to ensure the entire area is clickable */
	.crop-frame::after {
		content: '';
		position: absolute;
		inset: 0;
		cursor: move !important;
		z-index: 1; /* Below resize handles but above background */
	}
	
	/* Ultra-specific selector to override any parent styles */
	.background-thumbnail .crop-overlay .crop-frame {
		cursor: move !important;
	}
	
	.background-thumbnail .crop-overlay .crop-frame:hover {
		cursor: move !important;
	}
	
	/* Ensure draggable cursor is visible */
	.crop-frame[role="button"] {
		cursor: move !important;
	}
	
	.crop-frame.draggable {
		cursor: move !important;
	}
	
	.crop-frame.draggable:hover {
		background: rgba(239, 68, 68, 0.25) !important;
		border-color: #dc2626 !important;
		cursor: move !important;
	}
	
	.crop-frame::before {
		content: 'Template Area';
		position: absolute;
		top: -25px;
		left: 0;
		background: #ef4444;
		color: white;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
		z-index: 11;
	}

	.crop-frame.invalid {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.control-handles {
		display: flex;
		justify-content: center;
		gap: 4px;
	}

	.control-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		color: #6b7280;
	}

	.control-handle:hover:not(:disabled) {
		background: #e5e7eb;
		border-color: #9ca3af;
		color: #374151;
	}

	.control-handle:active:not(:disabled),
	.control-handle.dragging {
		background: #d1d5db;
		border-color: #6b7280;
		color: #111827;
	}

	.control-handle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.move-handle:not(:disabled) {
		cursor: move;
	}

	.scale-handle:not(:disabled) {
		cursor: se-resize;
	}

	.debug-handle {
		color: #6b7280;
	}

	.debug-handle.active {
		background: #3b82f6;
		border-color: #2563eb;
		color: white;
	}

	.debug-handle:not(:disabled):hover {
		background: #e5e7eb;
		border-color: #9ca3af;
		color: #374151;
	}

	.debug-handle.active:not(:disabled):hover {
		background: #2563eb;
		border-color: #1d4ed8;
		color: white;
	}

	.position-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 11px;
		color: #6b7280;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		font-weight: 500;
	}

	.info-value {
		font-family: monospace;
		background: #f3f4f6;
		padding: 1px 4px;
		border-radius: 3px;
	}

	.debug-info {
		border-top: 1px solid #e5e7eb;
		padding-top: 4px;
		margin-top: 4px;
	}

	.info-value.valid {
		background: #dcfce7;
		color: #16a34a;
	}

	.info-value.invalid {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Resize Handles */
	.resize-handle {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: #3b82f6;
		border: 1px solid white;
		border-radius: 50%;
		cursor: pointer;
		z-index: 15; /* Higher than crop-frame to show resize cursors */
		pointer-events: auto;
		transition: all 0.15s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.resize-handle:hover {
		background-color: #2563eb;
		transform: scale(1.2);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.resize-handle:active {
		background-color: #1d4ed8;
		transform: scale(1.1);
	}

	/* Cursor styles for different resize directions */
	.resize-handle.top-left {
		cursor: nw-resize;
	}

	.resize-handle.top-right {
		cursor: ne-resize;
	}

	.resize-handle.bottom-left {
		cursor: sw-resize;
	}

	.resize-handle.bottom-right {
		cursor: se-resize;
	}

	/* Crop Preview Overlay */
	.crop-preview {
		position: absolute;
		top: 5px;
		left: 5px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 8px;
		border-radius: 4px;
		font-size: 11px;
		z-index: 20;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.preview-indicator {
		display: flex;
		flex-direction: column;
		gap: 2px;
		line-height: 1.2;
	}

	.preview-indicator span {
		font-family: monospace;
		font-size: 10px;
		white-space: nowrap;
	}

	/* Enhanced crop frame styling */
	.crop-frame {
		pointer-events: none; /* Allow handles to receive events */
	}

	.crop-frame.invalid .resize-handle {
		background-color: #ef4444;
		border-color: white;
	}

	.crop-frame.invalid .resize-handle:hover {
		background-color: #dc2626;
	}

	/* Improved transitions when dragging */
	.background-thumbnail.dragging .crop-frame {
		transition: none;
	}

	.background-thumbnail.dragging .resize-handle {
		transition: none;
	}
	
	/* Template center indicator */
	.template-center-indicator {
		position: absolute;
		font-size: 16px;
		transition: all 0.2s ease;
		transform: translate(-50%, -50%); /* Center the emoji on the exact center point */
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
		z-index: 12;
		pointer-events: none;
	}
</style>
