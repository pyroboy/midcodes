<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import type { TemplateElement } from '$lib/types/types';
	import ElementList from './ElementList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Upload, Image as ImageIcon, Plus, X, Move, Scaling } from '@lucide/svelte';
	import { loadGoogleFonts, getAllFontFamilies, isFontLoaded, fonts } from '../config/fonts';
	import { CoordinateSystem } from '$lib/utils/coordinateSystem';
	import { createAdaptiveElements } from '$lib/utils/adaptiveElements';
	import {
		cssForBackground,
		clampBackgroundPosition,
		computeDraw,
		computeContainerViewportInImage
	} from '$lib/utils/backgroundGeometry';
	import type { Dims } from '$lib/utils/backgroundGeometry';
	import { browser } from '$app/environment';
	import {
		debounce,
		throttle,
		CanvasRenderManager,
		ImageCache,
		CoordinateCache,
		PerformanceMonitor
	} from '$lib/utils/canvasPerformance';

	// Local state for optimization
	let activeDragElement: TemplateElement | null = $state(null);
	let activeDragIndex: number | null = $state(null);
	let hasModified = false; // Track if we actually changed anything

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
	// Shared hover state between canvas and element list
	let hoveredElementId: string | null = $state(null);
	let selectedElementId: string | null = $state(null);
	let selectionVersion = $state(0); // Track repeated selections of same element
	let startX: number, startY: number;
	let currentElementIndex: number | null = $state(null);
	let resizeHandle: string | null = $state(null);

	// Original dimensions at resize start (for proportional font scaling)
	let originalWidth: number = 0;
	let originalHeight: number = 0;
	let originalX: number = 0;
	let originalY: number = 0;
	let originalFontSize: number = 0;
	// Original mouse position at resize start (for cumulative delta calculation)
	let resizeStartMouseX: number = 0;
	let resizeStartMouseY: number = 0;

	// Rotation state
	let isRotating = $state(false);
	let rotateStartAngle: number = 0;
	let rotateElementStartRotation: number = 0;
	let rotationCursorPos = $state({ x: 0, y: 0 });
	let currentRotationValue = $state(0);

	// Background manipulation state
	let isDraggingBackground = false;
	let isResizingBackground = false;
	let backgroundResizeHandle: string | null = null;
	let templateContainer: HTMLElement | undefined = $state();
	let mainCanvas: HTMLCanvasElement | undefined = $state();
	let mainCtx: CanvasRenderingContext2D;
	let mainImageElement: HTMLImageElement | null = $state(null);
	let loadedImageSize = $state<{ width: number; height: number } | null>(null);
	let fontOptions: string[] = $state([]);
	let fontsLoaded = false;

	// Debug: Log whenever fontOptions changes
	$effect(() => {
		console.log('🔤 [TemplateForm] fontOptions updated:', {
			side,
			count: fontOptions.length,
			fonts: fontOptions,
			fontsLoaded
		});
	});
	let previewDimensions = $state({
		width: 0,
		height: 0,
		scale: 1
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
			try {
				canvasRenderManager.destroy();
			} catch {}
			canvasRenderManager = null;
		}
		// Clear caches
		if (imageCache) {
			try {
				imageCache.clearAll?.();
			} catch {}
		}
		if (coordinateCache) {
			try {
				coordinateCache.clear?.();
			} catch {}
		}
		if (performanceMonitor) {
			try {
				performanceMonitor.clear?.();
			} catch {}
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
		const scale = currentBase.width > 0 ? currentBase.width / currentBase.actualWidth : 1;

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
		if ((elements?.length ?? 0) === 0) {
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

		console.log('🔤 [TemplateForm] Starting font load...', { side });

		// Debug: Check what getAllFontFamilies returns BEFORE loading
		const preLoadFonts = getAllFontFamilies();
		console.log('🔤 [TemplateForm] Pre-load available fonts:', preLoadFonts);

		loadGoogleFonts()
			.then(() => {
				const loadedFonts = getAllFontFamilies();
				console.log('✅ [TemplateForm] Google Fonts loaded successfully:', {
					side,
					count: loadedFonts.length,
					fonts: loadedFonts
				});
				fontOptions = loadedFonts;
				fontsLoaded = true;
			})
			.catch((error) => {
				console.error('❌ [TemplateForm] Error loading Google Fonts:', error);
				const fallbackFonts = getAllFontFamilies();
				console.log('⚠️ [TemplateForm] Using fallback fonts:', fallbackFonts);
				fontOptions = fallbackFonts;
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
			if (
				mainCanvas.width !== previewDimensions.width ||
				mainCanvas.height !== previewDimensions.height
			) {
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

	function updateElements(elementList: TemplateElement[] = elements) {
		// Log element updates with position details for debugging robustness
		const debugInfo = elementList.map((el: TemplateElement) => ({
			type: el.type,
			id: el.id,
			// Log with sub-pixel precision
			pos: `(${Number((el.x || 0).toFixed(2))}, ${Number((el.y || 0).toFixed(2))})`,
			size: `(${Number((el.width || 0).toFixed(2))}x${Number((el.height || 0).toFixed(2))})`,
			side
		}));

		console.log(`📏 [TemplateForm:${side}] Updating ${elementList.length} elements:`, debugInfo);

		onUpdateElements?.(
			elementList.map((el: TemplateElement) => ({ ...el, side })),
			side
		);
	}

	/**
	 * Measure the true bounding box height for a text element based on text wrapping.
	 * Returns the height needed to fit all text at the given width and font size.
	 * All dimensions are in storage coordinates (actual pixels).
	 *
	 * Handles:
	 * - Word wrapping (split on spaces)
	 * - Character-level breaking for long words that exceed container width
	 * - Hyphen breaking for ID-like content (e.g., "75-005-24")
	 * - Explicit newlines
	 */
	function measureTextBoundingBox(element: TemplateElement, newWidth: number): number {
		const text = element.content || 'Sample Text';
		const fontSize = element.fontSize || element.size || 16;
		const fontFamily = element.fontFamily || element.font || 'Arial';
		const fontWeight = element.fontWeight || '400';
		const lineHeight = 1.3; // Slightly more generous line height for readability

		// Handle empty or whitespace-only text
		if (!text.trim()) {
			const defaultHeight = fontSize * lineHeight + 10;
			console.log('📐 [measureTextBoundingBox] Empty text, using default height:', defaultHeight);
			return defaultHeight;
		}

		// Create a temporary canvas for measurement
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.warn('📐 [measureTextBoundingBox] Could not get canvas context');
			return element.height || 50;
		}

		// Set up font for measurement
		ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;

		/**
		 * Break a word into chunks that fit within maxWidth.
		 * Uses character-level breaking to ensure every chunk fits.
		 */
		function breakWord(word: string, maxWidth: number): string[] {
			const result: string[] = [];

			/**
			 * Break a single segment into character-sized chunks that fit within maxWidth
			 */
			function breakToCharacters(segment: string): string[] {
				const charChunks: string[] = [];
				let currentChunk = '';

				for (let i = 0; i < segment.length; i++) {
					const char = segment[i];
					const testChunk = currentChunk + char;

					if (ctx!.measureText(testChunk).width <= maxWidth) {
						currentChunk = testChunk;
					} else {
						if (currentChunk) {
							charChunks.push(currentChunk);
						}
						currentChunk = char;
					}
				}
				if (currentChunk) {
					charChunks.push(currentChunk);
				}

				return charChunks.length > 0 ? charChunks : [segment];
			}

			// First, try breaking on hyphens (for ID-like content)
			if (word.includes('-')) {
				const hyphenParts = word.split('-');

				for (let i = 0; i < hyphenParts.length; i++) {
					const part = hyphenParts[i];
					// Add hyphen back except for last part
					const segment = i < hyphenParts.length - 1 ? part + '-' : part;

					// Check if this segment fits
					if (ctx!.measureText(segment).width <= maxWidth) {
						result.push(segment);
					} else {
						// Break segment into smaller chunks
						const brokenChunks = breakToCharacters(segment);
						result.push(...brokenChunks);
					}
				}

				return result;
			}

			// No hyphens - do character-level breaking
			return breakToCharacters(word);
		}

		// Split text into lines (handle explicit newlines)
		const paragraphs = text.split('\n');
		let totalLineCount = 0;

		for (const paragraph of paragraphs) {
			if (paragraph.trim() === '') {
				// Empty paragraph still counts as one line
				totalLineCount++;
				continue;
			}

			// Word wrap the paragraph to calculate how many lines we need
			const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
			if (words.length === 0) {
				totalLineCount++;
				continue;
			}

			let line = '';
			let paragraphLineCount = 0;

			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				const wordWidth = ctx.measureText(word).width;

				// If word itself is wider than the container, break it
				if (wordWidth > newWidth) {
					// Finish current line if there's content
					if (line.trim()) {
						paragraphLineCount++;
						line = '';
					}

					// Break the word into smaller chunks
					const wordChunks = breakWord(word, newWidth);
					for (const chunk of wordChunks) {
						paragraphLineCount++;
					}
					continue;
				}

				const testLine = line + (line ? ' ' : '') + word;
				const metrics = ctx.measureText(testLine);

				if (metrics.width > newWidth && line !== '') {
					// Current line would exceed width, wrap to new line
					paragraphLineCount++;
					line = word;
				} else {
					line = testLine;
				}
			}

			// Don't forget the last line
			if (line) {
				paragraphLineCount++;
			}

			totalLineCount += Math.max(1, paragraphLineCount);
		}

		// Ensure at least 1 line
		totalLineCount = Math.max(1, totalLineCount);

		// Calculate height based on line count and line height
		// Add some padding for better visual appearance
		const textHeight = totalLineCount * fontSize * lineHeight;
		const padding = 8; // Small padding top/bottom
		const calculatedHeight = Math.ceil(textHeight + padding);

		console.log('📐 [measureTextBoundingBox] Calculated:', {
			text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
			fontSize,
			fontFamily,
			newWidth,
			totalLineCount,
			textHeight,
			calculatedHeight
		});

		// Ensure minimum height (at least one line of text)
		return Math.max(calculatedHeight, fontSize * lineHeight + padding);
	}

	// 🛡️ SECURITY: Auto-clamp elements when dimensions change (e.g. orientation flip)
	// This ensures elements don't get lost off-screen if the card size shrinks or rotates
	$effect(() => {
		const dim = baseDimensions();
		if (dim.actualWidth > 0 && dim.actualHeight > 0 && elements.length > 0) {
			let changed = false;
			const newElements = elements.map((el: TemplateElement) => {
				const maxX = Math.max(0, dim.actualWidth - (el.width || 0));
				const maxY = Math.max(0, dim.actualHeight - (el.height || 0));

				const currentX = el.x || 0;
				const currentY = el.y || 0;

				// Clamp to new bounds
				const newX = Math.min(Math.max(currentX, 0), maxX);
				const newY = Math.min(Math.max(currentY, 0), maxY);

				if (newX !== currentX || newY !== currentY) {
					console.log(
						`⚠️ [TemplateForm:${side}] Clamping element ${el.id} (${el.type}) to fit new bounds:`,
						{
							from: { x: currentX, y: currentY },
							to: { x: newX, y: newY },
							bounds: { w: dim.actualWidth, h: dim.actualHeight }
						}
					);
					changed = true;
					return { ...el, x: newX, y: newY };
				}
				return el;
			});

			if (changed) {
				elements = newElements;
				updateElements();
			}
		}
	});

	function limitDragBounds(
		index: number,
		x: number,
		y: number,
		width?: number,
		height?: number,
		metrics?: TextMetrics
	) {
		const newElements = elements.map((el: TemplateElement, i: number) => {
			if (i === index) {
				let newEl = { ...el, side };
				if (templateContainer) {
					const bounds = coordSystem().getStorageBounds();
					const maxX = bounds.width - (newEl.width || 0);
					const maxY = bounds.height - (newEl.height || 0);

					// Use sub-pixel precision (2 decimal places) instead of rounding
					newEl.x = Number(Math.min(Math.max(x, 0), maxX).toFixed(2));
					newEl.y = Number(Math.min(Math.max(y, 0), maxY).toFixed(2));

					if ((el.type === 'photo' || el.type === 'signature') && width && height) {
						newEl.width = Math.max(20, Number(width.toFixed(2)));
						newEl.height = Math.max(20, Number(height.toFixed(2)));
					} else if (el.type === 'text' && metrics) {
						newEl.width = Math.max(
							20,
							Number((metrics.width / previewDimensions.scale).toFixed(2))
						);
					}
				}
				return newEl;
			}
			return el;
		});
		// Pass the new list directly to updateElements
		updateElements(newElements);
	}

	function handleSidebarSelect(id: string | null) {
		selectedElementId = id;
		selectionVersion++;
	}

	function onMouseDown(event: MouseEvent, index: number, handle: string | null = null) {
		const element = elements[index];
		selectedElementId = element.id; // Select on interaction
		selectionVersion++; // Force update even if ID is same

		console.log('🔴 Handle Tapped:', handle || 'element-body', 'on side:', $state.snapshot(side));

		// Initialize local drag state
		activeDragElement = { ...element };
		activeDragIndex = index;
		hasModified = false;

		if (handle) {
			isResizing = true;
			resizeHandle = handle;
			// Store original dimensions and position for uniform scaling
			originalWidth = element.width || 100;
			originalHeight = element.height || 100;
			originalX = element.x || 0;
			originalY = element.y || 0;
			originalFontSize = element.fontSize || element.size || 16;
			// Store original mouse position for cumulative delta calculation
			resizeStartMouseX = event.clientX;
			resizeStartMouseY = event.clientY;
		} else {
			isDragging = true;
		}
		currentElementIndex = index;
		startX = event.clientX;
		startY = event.clientY;
		// Don't prevent default immediately if we want to allow some events,
		// but for dragging we usually do.
		// However, for simple selection (click), we might not want to prevent everything.
		// But since we are starting a drag/resize, preventDefault is standard to stop text selection/scrolling.
		event.preventDefault();
		event.stopPropagation(); // Prevent clearing selection via background click
	}

	function onTouchStart(event: TouchEvent, index: number, handle: string | null = null) {
		if (event.touches.length > 0) {
			// Prevent default to stop scrolling interaction immediately on touch start
			// Only call preventDefault if the event is cancelable (not from a passive listener)
			if (event.cancelable) {
				event.preventDefault();
			}
			const touch = event.touches[0];
			// Create a synthetic MouseEvent for compatibility
			const mouseEvent = new MouseEvent('mousedown', {
				clientX: touch.clientX,
				clientY: touch.clientY,
				bubbles: true,
				cancelable: true
			});
			onMouseDown(mouseEvent, index, handle);
		}
	}

	function onTouchMove(event: TouchEvent) {
		if (event.touches.length > 0 && (isDragging || isResizing)) {
			// Prevent scrolling while dragging
			// Only call preventDefault if the event is cancelable (not from a passive listener)
			if (event.cancelable) {
				event.preventDefault();
			}

			const touch = event.touches[0];
			const mouseEvent = new MouseEvent('mousemove', {
				clientX: touch.clientX,
				clientY: touch.clientY,
				bubbles: true,
				cancelable: true
			});
			onMouseMove(mouseEvent);
		}
	}

	function onTouchEnd(event: TouchEvent) {
		onMouseUp();
	}

	function onRotationStart(event: MouseEvent, index: number) {
		const element = elements[index];
		selectedElementId = element.id;
		selectionVersion++;

		activeDragElement = { ...element };
		activeDragIndex = index;
		hasModified = false;

		isRotating = true;
		currentElementIndex = index;

		// Calculate element center in screen coordinates
		const rect = templateContainer?.getBoundingClientRect();
		if (!rect) return;

		const currentCoordSystem = coordSystem();
		const previewPos = currentCoordSystem.storageToPreview({
			x: (element.x || 0) + (element.width || 0) / 2,
			y: (element.y || 0) + (element.height || 0) / 2
		});

		const centerX = rect.left + previewPos.x;
		const centerY = rect.top + previewPos.y;

		// Calculate starting angle from center to mouse position
		rotateStartAngle =
			Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
		rotateElementStartRotation = element.rotation || 0;

		event.preventDefault();
		event.stopPropagation();
	}

	function onTouchRotationStart(event: TouchEvent, index: number) {
		if (event.touches.length > 0) {
			// Only call preventDefault if the event is cancelable (not from a passive listener)
			if (event.cancelable) {
				event.preventDefault();
			}
			const touch = event.touches[0];
			const mouseEvent = new MouseEvent('mousedown', {
				clientX: touch.clientX,
				clientY: touch.clientY,
				bubbles: true,
				cancelable: true
			});
			onRotationStart(mouseEvent, index);
		}
	}

	function onBackgroundClick() {
		if (!isDragging && !isResizing && !isRotating) {
			selectedElementId = null;
		}
	}

	function onMouseMove(event: MouseEvent) {
		if (
			(!isDragging && !isResizing && !isRotating) ||
			currentElementIndex === null ||
			!activeDragElement
		)
			return;

		// Handle rotation
		if (isRotating) {
			const rect = templateContainer?.getBoundingClientRect();
			if (!rect) return;

			const currentCoordSystem = coordSystem();
			const previewPos = currentCoordSystem.storageToPreview({
				x: (activeDragElement.x || 0) + (activeDragElement.width || 0) / 2,
				y: (activeDragElement.y || 0) + (activeDragElement.height || 0) / 2
			});

			const centerX = rect.left + previewPos.x;
			const centerY = rect.top + previewPos.y;

			// Calculate current angle from center to mouse position
			const currentAngle =
				Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);

			// Calculate rotation delta
			const deltaAngle = currentAngle - rotateStartAngle;

			// Calculate new rotation (keep raw value for display, can be negative)
			let rawRotation = rotateElementStartRotation + deltaAngle;

			// Snap to 15-degree increments when Shift is held
			if (event.shiftKey) {
				rawRotation = Math.round(rawRotation / 15) * 15;
			}

			// Normalize to -180 to +180 range for display and storage
			let normalizedRotation = rawRotation % 360;
			if (normalizedRotation > 180) {
				normalizedRotation -= 360;
			} else if (normalizedRotation < -180) {
				normalizedRotation += 360;
			}

			// Store display value
			currentRotationValue = Math.round(normalizedRotation);

			// Track cursor position for tooltip
			rotationCursorPos = { x: event.clientX, y: event.clientY };

			// Update local state
			activeDragElement = { ...activeDragElement, rotation: Number(normalizedRotation.toFixed(2)) };
			hasModified = true;

			return; // Don't process drag/resize when rotating
		}

		if (isResizing) {
			console.log(
				'⚪ Dragging White Circle:',
				$state.snapshot({
					handle: resizeHandle,
					mouseX: event.clientX,
					mouseY: event.clientY
				})
			);
		}

		const dx = event.clientX - startX;
		const dy = event.clientY - startY;

		// Use coordinate system for mouse movement conversion
		const storageDelta = coordSystem().scaleMouseDelta(dx, dy);

		// Operate on local state activeDragElement instead of elements array
		const updatedElement = { ...activeDragElement }; // Start from current local state

		if (isResizing && updatedElement.width !== undefined && updatedElement.height !== undefined) {
			let newWidth = updatedElement.width;
			let newHeight = updatedElement.height;
			let newX = updatedElement.x || 0;
			let newY = updatedElement.y || 0;

			// Determine if this is a side handle (width-only) or corner handle (proportional)
			const isSideHandle = resizeHandle === 'middle-left' || resizeHandle === 'middle-right';
			const isCornerHandle = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(
				resizeHandle || ''
			);

			switch (resizeHandle) {
				// CORNER HANDLES
				case 'top-left':
				case 'top-right':
				case 'bottom-left':
				case 'bottom-right': {
					// Check if this is a text element (uniform scaling) or photo/signature (freeform)
					const isTextElement =
						updatedElement.type === 'text' || updatedElement.type === 'selection';

					if (isTextElement) {
						// TEXT ELEMENTS: Uniform scaling (maintain aspect ratio like Canva)
						// Use CUMULATIVE delta from resize start for stable uniform scaling
						const cumulativeDx = event.clientX - resizeStartMouseX;
						const cumulativeDy = event.clientY - resizeStartMouseY;
						const cumulativeStorageDelta = coordSystem().scaleMouseDelta(
							cumulativeDx,
							cumulativeDy
						);

						const aspectRatio = originalWidth / originalHeight;
						let scaleDelta: number;

						if (resizeHandle === 'bottom-right') {
							scaleDelta = (cumulativeStorageDelta.x + cumulativeStorageDelta.y) / 2;
							newWidth = originalWidth + scaleDelta;
							newHeight = newWidth / aspectRatio;
						} else if (resizeHandle === 'top-left') {
							scaleDelta = (-cumulativeStorageDelta.x - cumulativeStorageDelta.y) / 2;
							newWidth = originalWidth + scaleDelta;
							newHeight = newWidth / aspectRatio;
							newX = originalX - scaleDelta;
							newY = originalY - scaleDelta / aspectRatio;
						} else if (resizeHandle === 'top-right') {
							scaleDelta = (cumulativeStorageDelta.x - cumulativeStorageDelta.y) / 2;
							newWidth = originalWidth + scaleDelta;
							newHeight = newWidth / aspectRatio;
							newY = originalY - scaleDelta / aspectRatio;
						} else if (resizeHandle === 'bottom-left') {
							scaleDelta = (-cumulativeStorageDelta.x + cumulativeStorageDelta.y) / 2;
							newWidth = originalWidth + scaleDelta;
							newHeight = newWidth / aspectRatio;
							newX = originalX - scaleDelta;
						}
					} else {
						// PHOTO/SIGNATURE: Freeform scaling (width and height independent)
						if (resizeHandle === 'bottom-right') {
							newWidth += storageDelta.x;
							newHeight += storageDelta.y;
						} else if (resizeHandle === 'top-left') {
							newWidth -= storageDelta.x;
							newHeight -= storageDelta.y;
							newX += storageDelta.x;
							newY += storageDelta.y;
						} else if (resizeHandle === 'top-right') {
							newWidth += storageDelta.x;
							newHeight -= storageDelta.y;
							newY += storageDelta.y;
						} else if (resizeHandle === 'bottom-left') {
							newWidth -= storageDelta.x;
							newHeight += storageDelta.y;
							newX += storageDelta.x;
						}
					}
					break;
				}
				// Side handles - change width only (use incremental delta)
				case 'middle-left':
					newWidth -= storageDelta.x;
					newX += storageDelta.x;
					break;
				case 'middle-right':
					newWidth += storageDelta.x;
					break;
			}

			// Constrain to bounds using coordinate system
			const constrainedPos = coordSystem().constrainToStorage(
				{ x: newX, y: newY },
				{ width: Math.max(20, newWidth), height: Math.max(20, newHeight) }
			);

			// Use sub-pixel precision
			updatedElement.x = Number(constrainedPos.x.toFixed(2));
			updatedElement.y = Number(constrainedPos.y.toFixed(2));
			updatedElement.width = Math.max(20, Number(newWidth.toFixed(2)));
			updatedElement.height = Math.max(20, Number(newHeight.toFixed(2)));

			// Proportional font scaling for text/selection elements when using CORNER handles
			const isTextElement = updatedElement.type === 'text' || updatedElement.type === 'selection';
			if (isTextElement && isCornerHandle && originalWidth > 0 && originalHeight > 0) {
				// Use geometric mean (sqrt of area ratio) for balanced scaling
				const areaRatio =
					(updatedElement.width * updatedElement.height) / (originalWidth * originalHeight);
				const scaleFactor = Math.sqrt(areaRatio);
				// Calculate new font size with minimum of 8px
				const newFontSize = Math.max(8, Math.round(originalFontSize * scaleFactor));
				updatedElement.fontSize = newFontSize;
			}

			// Side handles: auto-calculate height based on text wrapping (fontSize remains unchanged)
			// (isTextElement already defined above)

			console.log('🔍 [Resize Debug] Checking side handle auto-height:', {
				elementType: updatedElement.type,
				isTextElement,
				isSideHandle,
				resizeHandle,
				width: updatedElement.width,
				height: updatedElement.height,
				fontSize: updatedElement.fontSize || updatedElement.size,
				content: (updatedElement.content || '').substring(0, 30)
			});

			if (isTextElement && isSideHandle) {
				console.log('📏 [Side Handle Resize] TRIGGERED - Before auto-height:', {
					elementType: updatedElement.type,
					width: updatedElement.width,
					currentHeight: updatedElement.height,
					fontSize: updatedElement.fontSize || updatedElement.size || 16,
					content: updatedElement.content
				});
				const autoHeight = measureTextBoundingBox(updatedElement, updatedElement.width);
				const oldHeight = updatedElement.height;
				updatedElement.height = Math.max(20, Number(autoHeight.toFixed(2)));
				console.log('📏 [Side Handle Resize] After auto-height:', {
					autoHeight,
					oldHeight,
					newHeight: updatedElement.height,
					heightChanged: oldHeight !== updatedElement.height
				});
			}
		} else {
			// Just update position during dragging, maintain original size
			const newPos = {
				x: (updatedElement.x || 0) + storageDelta.x,
				y: (updatedElement.y || 0) + storageDelta.y
			};

			const constrainedPos = coordSystem().constrainToStorage(newPos, {
				width: updatedElement.width || 0,
				height: updatedElement.height || 0
			});

			updatedElement.x = Number(constrainedPos.x.toFixed(2));
			updatedElement.y = Number(constrainedPos.y.toFixed(2));
		}

		// Update local state
		activeDragElement = updatedElement;
		hasModified = true;

		// Live update for text elements during resize - push to elements array immediately
		// This allows sidebar to show live font size changes (no throttling)
		if (isResizing && currentElementIndex !== null) {
			const isTextElement = updatedElement.type === 'text' || updatedElement.type === 'selection';
			if (isTextElement) {
				const updatedElements = [...elements];
				updatedElements[currentElementIndex] = updatedElement;
				// Direct update for immediate feedback
				updateElements(updatedElements);
			}
		}

		startX = event.clientX;
		startY = event.clientY;
	}

	function onMouseUp() {
		// Commit changes ONLY if we actually modified the element
		if (
			hasModified &&
			(isDragging || isResizing || isRotating) &&
			currentElementIndex !== null &&
			activeDragElement
		) {
			const updatedElements = [...elements];
			updatedElements[currentElementIndex] = activeDragElement;
			updateElements(updatedElements);
		}

		isDragging = false;
		isResizing = false;
		isRotating = false;
		currentElementIndex = null;
		activeDragElement = null; // Clear local state
		activeDragIndex = null;
		hasModified = false;
		resizeHandle = null;

		// Reset rotation tracking
		rotateStartAngle = 0;
		rotateElementStartRotation = 0;

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
		const viewportRect = computeContainerViewportInImage(
			imageDims,
			containerDims,
			backgroundPosition
		);

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
			viewportRect.x,
			viewportRect.y,
			viewportRect.width,
			viewportRect.height, // Source rect in image
			0,
			0,
			container.width,
			container.height // Destination rect (fill entire canvas)
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
	}

	let elementStyle = $derived((element: TemplateElement) => {
		const currentCoordSystem = coordSystem();

		// Use percentage positioning for responsive layouts
		const positionStyle = currentCoordSystem.createPercentagePositionStyle(
			element.x || 0,
			element.y || 0,
			element.width || 0,
			element.height || 0
		);

		// Add rotation transform if element has rotation
		const rotation = element.rotation || 0;
		if (rotation !== 0) {
			positionStyle['transform'] = `rotate(${rotation}deg)`;
			positionStyle['transform-origin'] = 'center center';
		}

		return positionStyle;
	});

	let textStyle = $derived((element: TemplateElement) => {
		const currentCoordSystem = coordSystem();
		const storageDims = currentCoordSystem.storageDimensions;
		// Calculate font-size as percentage of container width using cqw units
		// This ensures text scales proportionally with the container
		// Use fontSize (new) with fallback to size (legacy) for backwards compatibility
		const fontSizeCqw = ((element.fontSize || element.size || 16) / storageDims.width) * 100;
		const letterSpacingCqw = element.letterSpacing
			? (element.letterSpacing / storageDims.width) * 100
			: null;

		return {
			// Use fontFamily (new) with fallback to font (legacy)
			'font-family': `"${element.fontFamily || element.font || 'Arial'}", sans-serif`,
			'font-weight': element.fontWeight || '400',
			'font-style': element.fontStyle || 'normal',
			'font-size': `${fontSizeCqw.toFixed(3)}cqw`,
			color: element.color || '#000000',
			'text-align': element.alignment || 'left',
			'text-transform': element.textTransform || 'none',
			'text-decoration-line': element.textDecoration || 'none',
			'letter-spacing': letterSpacingCqw ? `${letterSpacingCqw.toFixed(3)}cqw` : 'normal',
			'line-height': element.lineHeight || '1.2',
			opacity: typeof element.opacity === 'number' ? element.opacity : 1,
			display: 'block',
			width: '100%',
			'white-space': 'pre-wrap',
			'word-break': 'break-word'
		};
	});

	function stopPropagation<E extends Event>(fn: (e: E) => void) {
		return (e: E) => {
			e.stopPropagation();
			fn(e);
		};
	}
	// Custom action to add non-passive touch listeners
	function nonPassiveTouch(node: HTMLElement, handler: (e: TouchEvent) => void) {
		let currentHandler = handler;

		const eventHandler = (e: TouchEvent) => {
			currentHandler(e);
		};

		node.addEventListener('touchstart', eventHandler, { passive: false });

		return {
			update(newHandler: (e: TouchEvent) => void) {
				currentHandler = newHandler;
			},
			destroy() {
				node.removeEventListener('touchstart', eventHandler);
			}
		};
	}

	onMount(() => {
		// Add non-passive touch listeners to window to support preventing default (scrolling)
		// This fixes the "Unable to preventDefault inside passive event listener" error
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', onTouchEnd);
		return () => {
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
		};
	});
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
						style="display: block;"
					></canvas>
					<!-- Click listener for background to clear selection -->
					<div
						class="selection-clear-layer"
						role="button"
						tabindex="0"
						onclick={onBackgroundClick}
						onkeydown={(e) => e.key === 'Enter' && onBackgroundClick()}
						style="position:absolute; inset:0; z-index: 2;"
						aria-label="Clear selection"
					></div>
				{/if}

				<!-- Elements overlay layer -->
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
						{#each elements ?? [] as element, i}
							<div
								class="template-element {element.type}"
								class:highlighted={hoveredElementId === element.id}
								class:selected={selectedElementId === element.id}
								style={Object.entries(
									elementStyle(
										activeDragIndex === i && activeDragElement ? activeDragElement : element
									)
								)
									.map(([key, value]) => `${key}: ${value}`)
									.join(';')}
								onmouseenter={() => (hoveredElementId = element.id)}
								onmouseleave={() => (hoveredElementId = null)}
								onmousedown={(e) => onMouseDown(e, i)}
								use:nonPassiveTouch={(e) => onTouchStart(e, i)}
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
								{:else if element.type === 'graphic'}
									{#if element.src}
										<img
											src={element.src}
											alt={element.alt || 'Graphic'}
											class="graphic-image"
											style="object-fit: {element.fit || 'contain'}; width: 100%; height: 100%;"
										/>
									{:else}
										<div class="placeholder graphic-placeholder">
											<span>Graphic</span>
										</div>
									{/if}
								{/if}
								<div class="resize-handles">
									<div
										class="resize-handle top-left"
										class:active={resizeHandle === 'top-left' && currentElementIndex === i}
										onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-left'))}
										use:nonPassiveTouch={stopPropagation((e) => onTouchStart(e, i, 'top-left'))}
										role="button"
										tabindex="0"
										aria-label="Resize top left"
									></div>
									<div
										class="resize-handle top-right"
										class:active={resizeHandle === 'top-right' && currentElementIndex === i}
										onmousedown={stopPropagation((e) => onMouseDown(e, i, 'top-right'))}
										use:nonPassiveTouch={stopPropagation((e) => onTouchStart(e, i, 'top-right'))}
										role="button"
										tabindex="0"
										aria-label="Resize top right"
									></div>
									<div
										class="resize-handle bottom-left"
										class:active={resizeHandle === 'bottom-left' && currentElementIndex === i}
										onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-left'))}
										use:nonPassiveTouch={stopPropagation((e) => onTouchStart(e, i, 'bottom-left'))}
										role="button"
										tabindex="0"
										aria-label="Resize bottom left"
									></div>
									<div
										class="resize-handle bottom-right"
										class:active={resizeHandle === 'bottom-right' && currentElementIndex === i}
										onmousedown={stopPropagation((e) => onMouseDown(e, i, 'bottom-right'))}
										use:nonPassiveTouch={stopPropagation((e) => onTouchStart(e, i, 'bottom-right'))}
										role="button"
										tabindex="0"
										aria-label="Resize bottom right"
									></div>
									<!-- Side handles for width-only resize (text elements only) -->
									{#if element.type === 'text' || element.type === 'selection'}
										<div
											class="resize-handle side-handle middle-left"
											class:active={resizeHandle === 'middle-left' && currentElementIndex === i}
											onmousedown={stopPropagation((e) => onMouseDown(e, i, 'middle-left'))}
											use:nonPassiveTouch={stopPropagation((e) =>
												onTouchStart(e, i, 'middle-left')
											)}
											role="button"
											tabindex="0"
											aria-label="Resize width left"
										></div>
										<div
											class="resize-handle side-handle middle-right"
											class:active={resizeHandle === 'middle-right' && currentElementIndex === i}
											onmousedown={stopPropagation((e) => onMouseDown(e, i, 'middle-right'))}
											use:nonPassiveTouch={stopPropagation((e) =>
												onTouchStart(e, i, 'middle-right')
											)}
											role="button"
											tabindex="0"
											aria-label="Resize width right"
										></div>
									{/if}
									<!-- Rotation handle - positioned 40px below element bottom center -->
									<div
										class="rotation-handle"
										class:active={isRotating && currentElementIndex === i}
										onmousedown={stopPropagation((e) => onRotationStart(e, i))}
										use:nonPassiveTouch={stopPropagation((e) => onTouchRotationStart(e, i))}
										role="button"
										tabindex="0"
										aria-label="Rotate element"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
											<path d="M21 3v5h-5" />
										</svg>
									</div>
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
					</div>
					<!-- Close elements-overlay -->
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
			{hoveredElementId}
			{selectedElementId}
			{selectionVersion}
			onSelect={handleSidebarSelect}
			onHoverElement={(id) => {
				hoveredElementId = id;
			}}
		/>
	</div>
</div>

<!-- Rotation value tooltip (positioned near cursor) -->
{#if isRotating}
	<div
		class="rotation-tooltip"
		style="left: {rotationCursorPos.x + 16}px; top: {rotationCursorPos.y + 16}px;"
	>
		{currentRotationValue}°
	</div>
{/if}

<style>
	.template-section {
		margin-bottom: 2.5rem;
		width: 100%;
		padding: 1rem;
		overflow: visible;
	}

	.template-layout {
		display: flex;
		gap: 1.25rem;
		width: 100%;
		flex-direction: column;
		overflow: visible; /* Allow controls to extend outside */
	}

	@media (max-width: 1023px) {
		.template-section {
			padding: 1rem;
		}

		.preview-container {
			margin: 0 auto;
		}

		.template-layout {
			align-items: center;
		}
	}

	@media (min-width: 1024px) {
		.template-section {
			padding-right: 120px; /* Add space for background controls on desktop */
		}

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
		overflow: visible; /* Allow rotation handle to extend outside */
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
		container-type: inline-size; /* Enable container queries for responsive font sizing */
	}

	.background-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1; /* Explicitly lower */
		transition: opacity 0.3s ease;
	}

	.elements-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 10; /* Explicitly higher than canvas (1) and other potential layers */
		pointer-events: none; /* Allow clicks to pass through empty areas */
		overflow: visible; /* Allow rotation handle to extend outside */
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
		/* Violet border (Canva style) */
		/* Default: hidden or very subtle unless selected/hovered? 
		   User said "I want the borders to be thick and more opaque". 
		   Usually unselected elements show content only. 
		              Ref: "I want the borders to be violet... thicker and more opaque"
		              If I make it outline always, it might look messy. 
		              Let's make it visible on hover/selection. 
		              If user meant "always visible", I can change. 
		              Standard UI: visible on hover/select. */
		outline: none; /* Only show when selected/hovered to avoid clutter? Or always? */
		touch-action: none; /* Prevent browser scrolling/zooming while interacting */
		box-shadow: none;
		box-sizing: border-box;
		opacity: 1; /* Fully opaque content */
		transition:
			box-shadow 0.15s ease,
			outline-color 0.15s ease;
		pointer-events: auto; /* Re-enable clicks on actual elements */
		z-index: 20; /* Ensure individual elements are clickable */
		/* Add a default size to ensure visibility even if content is empty */
		min-width: 20px;
		min-height: 20px;
	}

	.template-element.highlighted,
	.template-element:hover,
	.template-element.selected {
		/* Show border when highlighted, hovered, OR selected */
		outline: 3px solid #8b5cf6;
	}

	/* Add a specific style for selected to be very clear */
	.template-element.selected {
		z-index: 25; /* Bring selected to front */
		outline: 3px solid #8b5cf6;
	}

	.resize-handle {
		position: absolute;
		/* Big invisible hitbox (44px standard touch target) */
		width: 44px;
		height: 44px;
		background-color: transparent;
		border: none;
		border-radius: 50%;
		display: none;
		align-items: center;
		justify-content: center;
		justify-content: center;
		z-index: 30; /* Above element */
		touch-action: none; /* Prevent scrolling while dragging handle */
	}

	.template-element:hover .resize-handle,
	.template-element.selected .resize-handle,
	.resize-handle.active {
		display: flex;
	}

	/* The Visual White Circle (Visual Indicator) */
	.resize-handle::after {
		content: '';
		width: 12px; /* Slightly larger visual dot */
		height: 12px;
		background-color: white;
		border: 1px solid #8b5cf6; /* Violet border */
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		transition: transform 0.1s;
	}

	/* Hover effect on the handle itself */
	.resize-handle:hover::after {
		transform: scale(1.2);
	}

	/* The Big White Transparent Circle when Holding/Dragging */
	.resize-handle.active::before {
		content: '';
		position: absolute;
		width: 60px; /* Even bigger glow when active */
		height: 60px;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		pointer-events: none;
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

	.graphic-image {
		display: block;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.graphic-placeholder {
		background-color: rgba(139, 92, 246, 0.2);
		border: 1px dashed rgba(139, 92, 246, 0.5);
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
		top: -22px;
		left: -22px;
		cursor: nwse-resize;
	}
	.resize-handle.top-right {
		top: -22px;
		right: -22px;
		cursor: nesw-resize;
	}
	.resize-handle.bottom-left {
		bottom: -22px;
		left: -22px;
		cursor: nesw-resize;
	}
	.resize-handle.bottom-right {
		bottom: -22px;
		right: -22px;
		cursor: nwse-resize;
	}
	/* Side handles for width-only resize - bar shaped, positioned on edge */
	.resize-handle.side-handle {
		width: 6px;
		height: 32px;
		border-radius: 3px;
	}
	.resize-handle.side-handle::after {
		width: 6px;
		height: 32px;
		border-radius: 3px;
	}
	.resize-handle.middle-left {
		top: 50%;
		left: -3px; /* Half of width (6px/2) to center on the edge */
		transform: translateY(-50%);
		cursor: ew-resize;
	}
	.resize-handle.middle-right {
		top: 50%;
		right: -3px; /* Half of width (6px/2) to center on the edge */
		transform: translateY(-50%);
		cursor: ew-resize;
	}

	/* Rotation handle styles */
	.rotation-handle {
		position: absolute;
		left: 50%;
		bottom: -50px; /* 40px gap + handle radius */
		transform: translateX(-50%);
		width: 24px;
		height: 24px;
		background-color: white;
		border: 2px solid #8b5cf6;
		border-radius: 50%;
		display: none;
		align-items: center;
		justify-content: center;
		cursor: grab;
		z-index: 35;
		touch-action: none;
		color: #8b5cf6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Only show rotation handle when element is selected (not on hover) */
	.template-element.selected .rotation-handle,
	.rotation-handle.active {
		display: flex;
	}

	.rotation-handle:hover {
		background-color: #f3e8ff;
		transform: translateX(-50%) scale(1.1);
	}

	.rotation-handle.active {
		cursor: grabbing;
		background-color: #8b5cf6;
		color: white;
	}

	/* Rotation tooltip - positioned fixed to follow cursor */
	:global(.rotation-tooltip) {
		position: fixed;
		background-color: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		pointer-events: none;
		z-index: 9999;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		letter-spacing: 0.5px;
	}

	/* Background manipulation controls removed - use thumbnail controls only */
</style>
