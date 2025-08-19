<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import type { TemplateElement } from '$lib/types/types';
	import ElementList from './ElementList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Upload, Image as ImageIcon, Plus, X, Move, Scaling } from '@lucide/svelte';
	import { loadGoogleFonts, getAllFontFamilies, isFontLoaded, fonts } from '../config/fonts';
	import { CoordinateSystem } from '$lib/utils/coordinateSystem';
import { createAdaptiveElements } from '$lib/utils/adaptiveElements';
import { cssForBackground, clampBackgroundPosition, computeDraw, computeContainerViewportInImage } from '$lib/utils/backgroundGeometry';
import type { Dims } from '$lib/utils/backgroundGeometry';
import { browser } from '$app/environment';
import { logDebugInfo, type DebugInfo } from '$lib/utils/backgroundDebug';
import { 
	debounce, 
	throttle, 
	CanvasRenderManager, 
	ImageCache, 
	CoordinateCache, 
	PerformanceMonitor 
} from '$lib/utils/canvasPerformance';

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
		onUpdateBackgroundPosition = null, // (position: {x: number, y: number, scale: number}, side: 'front' | 'back') => void
		// Optional version bump to force re-derivation of internal caches without remount
		version = 0
	} = $props();

	// Calculate dynamic base dimensions
	let baseDimensions = $derived(() => {
		if (pixelDimensions && pixelDimensions.width > 0 && pixelDimensions.height > 0) {
			// Use actual pixel dimensions, scaled down for UI (align with IdCanvas)
			const maxWidth = 600; // Max width for preview (must match IdCanvas)
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
	let mainCanvas: HTMLCanvasElement | undefined = $state();
	let mainCtx: CanvasRenderingContext2D;
	let mainImageElement: HTMLImageElement | null = $state(null);
	let loadedImageSize = $state<{width: number, height: number} | null>(null);
	let fontOptions: string[] = $state([]);
	let fontsLoaded = false;
	let previewDimensions = $state({
		width: 0,
		height: 0,
		scale: 1
	});

	// Debug state for visual feedback verification
	let debugState = $state({
		lastUpdate: Date.now(),
		position: backgroundPosition,
		previewBounds: null as DOMRect | null,
		cssValues: { size: '', position: '' },
		enabled: true // Enable debug by default
	});

	// Performance optimization instances
	let canvasRenderManager: CanvasRenderManager | null = null;
	let imageCache: ImageCache;
	let coordinateCache: CoordinateCache;
	let performanceMonitor: PerformanceMonitor;

	// Debounced and throttled functions
	let debouncedUpdateBackground: (...args: any[]) => void;
	let throttledDraw: (...args: any[]) => void;
	let debouncedUpdateElements: (...args: any[]) => void;

	// Performance timing functions
	let endImageLoadTiming: (() => void) | null = null;
	let endCanvasDrawTiming: (() => void) | null = null;

	function resetInternalCaches(reason: string) {
		console.log('♻️ Resetting internal caches in TemplateForm due to:', reason);
		// Destroy and null-out CanvasRenderManager so it can be recreated
		if (canvasRenderManager) {
			try { canvasRenderManager.destroy(); } catch {}
			canvasRenderManager = null;
		}
		// Clear caches
		if (imageCache) {
			try { imageCache.clearAll?.(); } catch {}
		}
		if (coordinateCache) {
			try { coordinateCache.clear?.(); } catch {}
		}
		if (performanceMonitor) {
			try { performanceMonitor.clear?.(); } catch {}
		}
		// Recreate debounced/throttled wrappers to avoid capturing stale state
		debouncedUpdateBackground = debounce(updateBackgroundPosition, 100);
		throttledDraw = throttle(drawMainCanvas, 16);
		debouncedUpdateElements = debounce(updateElements, 50);
		// Force image to reload on next effect pass
		lastLoadedPreview = null;
	}


	// Coordinate system scale must mirror the baseDimensions downscale (actual -> preview)
	let coordSystem = $derived(() => {
		const currentBase = baseDimensions();

		// Return early if dimensions are not yet available
		if (currentBase.actualWidth === 0 || currentBase.actualHeight === 0) {
			return new CoordinateSystem(100, 100, 1); // Default fallback
		}

		// Compute base scale factor between actual pixels and preview pixels
		const scale = currentBase.width > 0
			? currentBase.width / currentBase.actualWidth
			: 1;

		return new CoordinateSystem(currentBase.actualWidth, currentBase.actualHeight, scale);
	});

	function updatePreviewDimensions() {
		if (!templateContainer?.parentElement) return;

		const currentBase = baseDimensions();

		// Return early if dimensions are not yet available
		if (currentBase.width === 0 || currentBase.height === 0) {
			return previewDimensions;
		}

		// Use fixed base preview size to match IdCanvas scaling (avoid parent-driven resizes)
		const containerWidth = currentBase.width;
		const containerHeight = currentBase.height;

		const scale = 1; // Already scaled by baseDimensions; keep 1:1 here to match IdCanvas


		previewDimensions = {
			width: containerWidth,
			height: containerHeight,
			scale
		};

		return previewDimensions;
	}

	onMount(() => {
		// Initialize performance optimization instances
		// Note: CanvasRenderManager will be initialized once we have the canvas element
		imageCache = new ImageCache();
		coordinateCache = new CoordinateCache();
		performanceMonitor = new PerformanceMonitor();

		// Initialize debounced and throttled functions
		debouncedUpdateBackground = debounce(updateBackgroundPosition, 100);
		throttledDraw = throttle(drawMainCanvas, 16); // ~60fps
		debouncedUpdateElements = debounce(updateElements, 50);

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

		return () => {
			resizeObserver.disconnect();
		};
	});

	onDestroy(() => {
		// Cleanup performance optimization instances
		if (canvasRenderManager) {
			canvasRenderManager.destroy();
		}
		if (imageCache) {
			imageCache.clearAll();
		}
		if (coordinateCache) {
			coordinateCache.clear();
		}
		if (performanceMonitor) {
			performanceMonitor.clear(); // Log final performance report
		}
	});

	// Track last loaded preview URL to prevent redundant reloads
	let lastLoadedPreview: string | null = null;
	
	// Initialize canvas context and handle all canvas-related updates
	$effect(() => {
		if (mainCanvas && !mainCtx) {
			mainCtx = mainCanvas.getContext('2d')!;
			console.log('🎨 Main canvas context initialized');
		}
		
		// Initialize CanvasRenderManager once we have the canvas
		if (mainCanvas && !canvasRenderManager) {
			canvasRenderManager = new CanvasRenderManager(mainCanvas);
			// Add the drawing callback to the render manager
			canvasRenderManager.addRenderCallback(drawMainCanvas);
			console.log('🚀 CanvasRenderManager initialized with render callback');
		}
		
		// Update canvas dimensions when preview dimensions change
		if (mainCanvas && previewDimensions.width > 0 && previewDimensions.height > 0) {
			if (mainCanvas.width !== previewDimensions.width || mainCanvas.height !== previewDimensions.height) {
				mainCanvas.width = previewDimensions.width;
				mainCanvas.height = previewDimensions.height;
				console.log('🔧 Canvas dimensions updated:', previewDimensions);
				
				// Re-get context after dimension change (some browsers require this)
				if (mainCtx) {
					mainCtx = mainCanvas.getContext('2d')!;
				}
				
				// Trigger redraw after canvas resize if we have image
				if (mainImageElement) {
					throttledDraw();
				}
			}
		}
	});
	
	// Separate effect for image loading to prevent excessive reloads
	$effect(() => {
		console.log('🔍 Image loading effect triggered:', {
			preview,
			lastLoadedPreview,
			hasMainCtx: !!mainCtx,
			previewWidth: previewDimensions.width,
			side,
			urlChanged: preview !== lastLoadedPreview
		});
		
		// Only reload if preview URL actually changed
		if (preview && preview !== lastLoadedPreview) {
			if (mainCtx && previewDimensions.width > 0) {
				console.log('🖼️ Loading main canvas image (URL changed):', preview);
				lastLoadedPreview = preview;
				loadMainImage();
			} else {
				console.log('⏳ Delaying image load - waiting for canvas setup:', {
					hasMainCtx: !!mainCtx,
					previewWidth: previewDimensions.width
				});
				// Don't update lastLoadedPreview yet, so it will retry when canvas is ready
			}
		} else if (!preview) {
			console.log('⚠️ No preview URL provided for', side);
			// Clear the image when preview is removed
			mainImageElement = null;
			loadedImageSize = null;
			lastLoadedPreview = null;
		} else if (preview === lastLoadedPreview) {
			console.log('ℹ️ Preview URL unchanged, skipping reload:', preview);
		}
	});
	
	// Additional effect to retry loading when canvas becomes ready
	$effect(() => {
		// Retry loading if we have a preview URL but haven't loaded it yet due to canvas not being ready
		if (preview && preview !== lastLoadedPreview && mainCtx && previewDimensions.width > 0) {
			console.log('🔄 Canvas ready - loading pending image:', preview);
			lastLoadedPreview = preview;
			loadMainImage();
		}
	});

	// When version changes, explicitly re-derive internal caches without requiring a remount
	$effect(() => {
		// Access version to create a dependency
		const v = version;
		if (v !== undefined) {
			resetInternalCaches('version changed');
			// If canvas is available, allow CanvasRenderManager to be reinitialized by existing effects
			// and trigger a redraw once image is (re)loaded
			if (preview && mainCtx) {
				loadMainImage();
			} else if (canvasRenderManager) {
				canvasRenderManager.markDirty();
			}
		}
	});
	
	// Separate effect for drawing/redrawing
	$effect(() => {
		// Only redraw when background position changes or we have a valid image
		if (backgroundPosition && mainImageElement && mainCtx && previewDimensions.width > 0) {
			throttledDraw();
		}
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

	// Background manipulation removed - use thumbnail controls only

	function loadMainImage() {
		if (!preview) {
			console.log('🚫 No preview URL provided');
			return;
		}
		
		if (!mainCtx) {
			console.log('🚫 Canvas context not ready');
			return;
		}
		
		// Check if image is already cached
		const cachedImage = imageCache?.get(preview);
		if (cachedImage) {
			console.log('🚀 Using cached image:', preview);
			mainImageElement = cachedImage;
			throttledDraw();
			return;
		}
		
		console.log('🔄 Loading main image:', preview);
		
		// Clear previous image and canvas
		mainImageElement = null;
		loadedImageSize = null;
		
		// Immediately clear the canvas to show loading state
		if (mainCtx && previewDimensions.width > 0 && previewDimensions.height > 0) {
			mainCtx.clearRect(0, 0, previewDimensions.width, previewDimensions.height);
			console.log('🧹 Cleared canvas for new image load');
		}
		
		// Start performance tracking
		const stopTiming = performanceMonitor?.startTiming('imageLoad');
		
		const img = new Image();
		img.crossOrigin = 'anonymous';
		
		img.onload = () => {
			console.log('✅ Main image loaded successfully:', {
				url: preview,
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight,
				hasValidDimensions: img.naturalWidth > 0 && img.naturalHeight > 0
			});
			
			stopTiming?.();
			
			if (img.naturalWidth > 0 && img.naturalHeight > 0) {
				mainImageElement = img;
				loadedImageSize = { width: img.naturalWidth, height: img.naturalHeight };
				// Cache the loaded image
				imageCache?.set(preview, img);
				// Force immediate draw for new image (not throttled)
				console.log('🎨 Forcing immediate canvas redraw for new image');
				drawMainCanvas();
			} else {
				console.error('❌ Image loaded but has invalid dimensions');
				loadedImageSize = null;
			}
		};
		
		img.onerror = (error) => {
			console.error('❌ Failed to load main canvas image:', {
				url: preview,
				error: error
			});
			stopTiming?.();
			mainImageElement = null;
			loadedImageSize = null;
		};
		
		img.src = preview;
	}

	function drawMainCanvas() {
		if (!mainCtx || !mainImageElement || !previewDimensions.width || !previewDimensions.height) {
			console.log('❌ Main canvas draw failed - missing requirements:', {
				hasCtx: !!mainCtx,
				hasImage: !!mainImageElement,
				previewDims: previewDimensions
			});
			return;
		}

		// Use CanvasRenderManager for optimized rendering
		canvasRenderManager?.markDirty();
		
		// Start performance tracking
		const stopTiming = performanceMonitor?.startTiming('canvasDraw');
		
		console.log('🎨 Drawing main canvas...', {
			canvasSize: { width: previewDimensions.width, height: previewDimensions.height },
			imageSize: { width: mainImageElement.naturalWidth, height: mainImageElement.naturalHeight },
			backgroundPosition
		});

		// Clear canvas
		mainCtx.clearRect(0, 0, previewDimensions.width, previewDimensions.height);
		
		// Reset transforms
		mainCtx.resetTransform();
		
		const imageDims: Dims = {
			width: mainImageElement.naturalWidth,
			height: mainImageElement.naturalHeight
		};
		
		// Use same logic as main template CSS but with canvas
		const currentBase = baseDimensions();
		const container = previewDimensions;
		
		if (currentBase.actualWidth === 0 || currentBase.actualHeight === 0) {
			console.log('❌ Base dimensions not available:', currentBase);
			stopTiming?.();
			return;
		}
				// FIXED: Use the same logic as thumbnail red box to show the container viewport
		const containerDims: Dims = {
			width: currentBase.actualWidth,
			height: currentBase.actualHeight
		};
		
		// Calculate what part of the image the container viewport "sees" (same as red box)
		const viewportRect = computeContainerViewportInImage(imageDims, containerDims, backgroundPosition);
		
		console.log('🎯 Canvas draw parameters (VIEWPORT SYNC):', {
			viewportInImage: viewportRect,
			containerDims,
			backgroundPosition,
			canvasSize: { width: container.width, height: container.height }
		});
		
		// Draw only the viewport portion of the image, scaled to fill the entire canvas
		// This matches what the red box represents in the thumbnail
		mainCtx.drawImage(
			mainImageElement,
			viewportRect.x, viewportRect.y, viewportRect.width, viewportRect.height, // Source rect in image
			0, 0, container.width, container.height // Destination rect (fill entire canvas)
		);
		
		stopTiming?.();
		console.log('✅ Main canvas draw complete');
	}

	function updateBackgroundPosition() {
		const currentBase = baseDimensions();
		
		// Early return if dimensions not available
		if (currentBase.actualWidth === 0 || currentBase.actualHeight === 0) {
			console.warn('⚠️ Cannot update background position: dimensions not available');
			return;
		}

		// Notify parent component first
		if (onUpdateBackgroundPosition) {
			onUpdateBackgroundPosition(backgroundPosition, side);
		}

		// Debug logging
		if (debugState.enabled && browser) {
			const container = { width: previewDimensions.width, height: previewDimensions.height };
			const image = { width: currentBase.actualWidth, height: currentBase.actualHeight };
			
				const newCssValues = { 
					size: 'canvas-only', 
					position: 'canvas-only' 
				};

			console.log('🎯 Background Position Updated:', {
				position: backgroundPosition,
				cssValues: newCssValues,
				containerDims: container,
				imageDims: image
			});

			// Update debug state
			debugState = {
				...debugState,
				lastUpdate: Date.now(),
				position: { ...backgroundPosition },
				previewBounds: templateContainer?.getBoundingClientRect() || null,
				cssValues: newCssValues
			};

			// Debug info for logging
			const debugInfo: DebugInfo = {
				component: 'TemplateForm',
				position: backgroundPosition,
				cssValues: newCssValues,
				timestamp: Date.now()
			};

			logDebugInfo(debugInfo);

			window.dispatchEvent(new CustomEvent('background-position-update', {
				detail: debugInfo
			}));
		}
	}

	let elementStyle = $derived((element: TemplateElement) => {
		const currentCoordSystem = coordSystem();

		// Get position from coordinate system - no offset needed with accurate background positioning
		const positionStyle = currentCoordSystem.createPositionStyle(
			element.x || 0,
			element.y || 0,
			element.width || 0,
			element.height || 0
		);

		return positionStyle;
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
				style="background-color: white;"
			>
				<!-- Background layer with fallback -->
				{#if preview}
					<!-- Canvas-only rendering -->
					<canvas
						bind:this={mainCanvas}
						width={previewDimensions.width}
						height={previewDimensions.height}
				class="background-canvas"
				style="display: block;"
			></canvas>
				{/if}
				
				<!-- Elements overlay layer -->
				{#if debugState.enabled && preview}
					<div class="debug-overlay">
						<!-- Background position indicator (user offset from center) -->
						<div 
							class="position-indicator" 
							style="left: calc(50% + {backgroundPosition.x}px); 
							       top: calc(50% + {backgroundPosition.y}px);">
							📍
						</div>
						
						<!-- Template center point (50%, 50%) -->
						<div 
							class="template-center-indicator" 
							style="left: 50%; top: 50%;">
							🎯
						</div>
						
						<!-- Crop frame boundaries (simplified visualization) -->
						<div class="crop-bounds-indicator">
							<div class="crop-info">
								Template: {baseDimensions().actualWidth}×{baseDimensions().actualHeight}px
								<br>Position: {Math.round(backgroundPosition.x)}, {Math.round(backgroundPosition.y)}
								<br>Scale: {(backgroundPosition.scale * 100).toFixed(0)}%
								<br><br><strong>Main Canvas Red Box Corners:</strong>
								{#if mainImageElement && previewDimensions.width > 0}
									{@const imageDims = { width: mainImageElement.naturalWidth, height: mainImageElement.naturalHeight }}
									{@const containerDims = { width: previewDimensions.width, height: previewDimensions.height }}
									{@const { drawW, drawH, topLeft } = computeDraw(imageDims, containerDims, backgroundPosition)}
									<br>Top-Left: ({Math.round(topLeft.x)}, {Math.round(topLeft.y)})
									<br>Top-Right: ({Math.round(topLeft.x + drawW)}, {Math.round(topLeft.y)})
									<br>Bottom-Left: ({Math.round(topLeft.x)}, {Math.round(topLeft.y + drawH)})
									<br>Bottom-Right: ({Math.round(topLeft.x + drawW)}, {Math.round(topLeft.y + drawH)})
									<br>Box Size: {Math.round(drawW)}×{Math.round(drawH)}px
								{:else}
									<br>Corners: (not calculated)
								{/if}
								<br><br><strong>Loaded Image Size:</strong>
								{#if loadedImageSize}
									<br>{loadedImageSize.width}×{loadedImageSize.height}px
								{:else}
									<br>No image loaded
								{/if}
							</div>
						</div>
						<div class="debug-controls">
							<button 
								class="debug-button" 
								title="Toggle debug overlay"
								onclick={() => debugState.enabled = false}>
								❌ Debug
							</button>
						</div>
					</div>
				{/if}
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
								<ImageIcon class="w-8 h-8 mb-2 text-muted-foreground/40" />
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
					<!-- Background manipulation controls removed - use thumbnail controls only -->
					
				<div class="elements-overlay">
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
					
					{#if !debugState.enabled}
						<Button
							variant="outline"
							size="icon"
							class="debug-toggle"
							onclick={() => debugState.enabled = true}
							title="Enable debug mode"
						>
							🐛
						</Button>
					{/if}
					</div> <!-- Close elements-overlay -->
				{/if}
			</div>
		</div>
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
		position: relative;
		background-color: white;
		overflow: hidden;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
	}


	.background-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		transition: opacity 0.3s ease;
	}

	.elements-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
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

	.debug-toggle {
		position: absolute;
		top: 10px;
		right: 50px;
		z-index: 10;
		font-size: 12px;
	}
	
	.debug-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 100;
	}
	
	.position-indicator {
		position: absolute;
		font-size: 20px;
		transition: all 0.2s ease;
		margin-left: -10px;
		margin-top: -20px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
	}
	
	.debug-controls {
		position: absolute;
		top: 50px;
		right: 10px;
		z-index: 101;
		pointer-events: auto;
	}
	
	.debug-button {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
	}
	
	.debug-button:hover {
		background: rgba(0, 0, 0, 0.9);
	}
	
	.template-center-indicator {
		position: absolute;
		font-size: 24px;
		transition: all 0.2s ease;
		margin-left: -12px;
		margin-top: -24px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
		z-index: 102;
	}
	
	.crop-bounds-indicator {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 101;
		pointer-events: none;
	}
	
	.crop-info {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 11px;
		font-family: monospace;
		line-height: 1.4;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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

	/* Background manipulation controls removed - use thumbnail controls only */

</style>
