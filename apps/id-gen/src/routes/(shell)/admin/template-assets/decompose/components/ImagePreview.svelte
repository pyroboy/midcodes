<script lang="ts">
	import { ImageIcon } from 'lucide-svelte';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';
	import type { LayerMask, LayerManager } from '$lib/logic/LayerManager.svelte';
	import type { ToolManager } from '$lib/logic/ToolManager.svelte';
	import type { ImageProcessor } from '$lib/logic/ImageProcessor.svelte';
	import type { HistoryManager } from '$lib/logic/HistoryManager.svelte';
	import type { UndoManager } from '$lib/logic/UndoManager.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import { LassoTool } from '$lib/logic/tools/LassoTool.svelte';
	import { RectangleTool } from '$lib/logic/tools/RectangleTool.svelte';
	import { EllipseTool } from '$lib/logic/tools/EllipseTool.svelte';
	import { BrushTool } from '$lib/logic/tools/BrushTool.svelte';
	import { EraserTool } from '$lib/logic/tools/EraserTool.svelte';
	import { BucketTool } from '$lib/logic/tools/BucketTool.svelte';
	import { GradientTool } from '$lib/logic/tools/GradientTool.svelte';
	import { MoveTool } from '$lib/logic/tools/MoveTool.svelte';
	import { EyedropperTool } from '$lib/logic/tools/EyedropperTool.svelte';
	import DrawingCanvas from './DrawingCanvas.svelte';
	import BrushCursor from './BrushCursor.svelte';
	import EyedropperCursor from './EyedropperCursor.svelte';
	import type { ToolName, NormalizedPoint } from '$lib/logic/tools';
	import { getProxiedUrl } from '$lib/utils/storage';

	type SelectionAction = 'copy' | 'fill' | 'delete';

	let {
		currentImageUrl,
		currentLayers,
		layerSelections,
		masks = new Map(),
		showOriginalLayer,
		selectedLayerId,
		selectedLayerIds = new Set(),
		assetName,
		activeSide,
		widthPixels,
		heightPixels,
		orientation,
		activeTool = null,
		currentColor = '#3b82f6',
		onSelectionAction,
		isProcessing = false,
		layerManager,
		toolManager,
		imageProcessor,
		historyManager,
		undoManager,
		templateId,
		onToolChange,
		onDuplicate,
		onSelectLayer
	}: {
		currentImageUrl: string | null;
		currentLayers: DecomposedLayer[];
		layerSelections: Map<string, LayerSelection>;
		masks?: Map<string, LayerMask>;
		showOriginalLayer: boolean;
		selectedLayerId: string | null;
		selectedLayerIds?: Set<string>;
		assetName: string;
		activeSide: string;
		widthPixels: number;
		heightPixels: number;
		orientation: string;
		activeTool?: ToolName;
		currentColor?: string;
		onSelectionAction?: (action: SelectionAction, points: NormalizedPoint[]) => void;
		isProcessing?: boolean;
		layerManager: LayerManager;
		toolManager: ToolManager;
		imageProcessor: ImageProcessor;
		historyManager: HistoryManager;
		undoManager?: UndoManager;
		templateId?: string;
		onToolChange?: (tool: ToolName) => void;
		onDuplicate?: () => void;
		onSelectLayer?: (layerId: string | null, addToSelection?: boolean) => void;
	} = $props();

	// Tool instances
	const lassoTool = new LassoTool();
	const rectangleTool = new RectangleTool();
	const ellipseTool = new EllipseTool();
	const brushTool = new BrushTool();
	const eraserTool = new EraserTool();
	const bucketTool = new BucketTool();
	const gradientTool = new GradientTool();
	const moveTool = new MoveTool();
	const eyedropperTool = new EyedropperTool();

	// Get the active tool instance
	const activeToolInstance = $derived(
		activeTool === 'move'
			? moveTool
			: activeTool === 'lasso'
				? lassoTool
				: activeTool === 'rectangle'
					? rectangleTool
					: activeTool === 'ellipse'
						? ellipseTool
						: activeTool === 'brush'
							? brushTool
							: activeTool === 'eraser'
								? eraserTool
								: activeTool === 'bucket'
									? bucketTool
									: activeTool === 'gradient'
										? gradientTool
										: activeTool === 'eyedropper'
											? eyedropperTool
											: null
	);

	// Unified rendered layers (combines original + decomposed)
	const renderedLayers = $derived.by(() => {
		const layers = [];

		// 1. Add Original/Background if enabled (at z-index 0)
		if (showOriginalLayer && currentImageUrl) {
			layers.push({
				id: 'original-bg',
				name: 'Original Image',
				imageUrl: currentImageUrl,
				zIndex: 0,
				isBackground: true,
				bounds: { x: 0, y: 0, width: widthPixels, height: heightPixels }
			});
		}

		// 2. Add existing decomposed layers (shifted to start at z-index 1)
		if (currentLayers) {
			layers.push(
				...currentLayers.map((l) => ({
					...l,
					zIndex: (l.zIndex || 0) + 1,
					isBackground: false
				}))
			);
		}

		return layers.sort((a, b) => a.zIndex - b.zIndex);
	});

	// Unified selection closed state
	const isSelectionClosed = $derived(
		(activeTool === 'lasso' && lassoTool.isClosed) ||
			(activeTool === 'rectangle' && rectangleTool.isClosed) ||
			(activeTool === 'ellipse' && ellipseTool.isClosed)
	);

	let canvasRect: DOMRect | null = null;
	let canvasElement: HTMLDivElement | null = null;
	let drawingCanvasElement: HTMLCanvasElement | undefined = $state();
	let drawingContext: CanvasRenderingContext2D | null | undefined = $state();

	// Mouse position for brush cursor (relative to canvas element)
	let mousePosition = $state<{ x: number; y: number } | null>(null);
	// Track layer under cursor for hover effect
	let hoveredLayerId = $state<string | null>(null);

	// Eyedropper state
	let eyedropperScreenPos = $state<{ x: number; y: number } | null>(null);
	let eyedropperCanvasPos = $state<{ x: number; y: number } | null>(null);
	let eyedropperCompositeCtx = $state<CanvasRenderingContext2D | null>(null);

	// Check if eyedropper is active
	const showEyedropper = $derived(activeTool === 'eyedropper' && eyedropperScreenPos !== null);

	// Build composite canvas when eyedropper becomes active
	$effect(() => {
		if (activeTool === 'eyedropper') {
			buildEyedropperComposite();
		} else {
			eyedropperCompositeCtx = null;
			eyedropperScreenPos = null;
			eyedropperCanvasPos = null;
		}
	});

	/**
	 * Build a composite canvas of all visible layers for eyedropper sampling.
	 */
	async function buildEyedropperComposite() {
		const canvas = document.createElement('canvas');
		canvas.width = widthPixels;
		canvas.height = heightPixels;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		// Draw background if visible
		if (showOriginalLayer && currentImageUrl) {
			try {
				const img = await loadImageAsync(currentImageUrl);
				ctx.drawImage(img, 0, 0, widthPixels, heightPixels);
			} catch (e) {
				console.warn('[Eyedropper] Failed to load background:', e);
			}
		}

		// Draw each layer in order
		for (const layer of renderedLayers) {
			if (layer.isBackground) continue; // Already drawn above

			const selection = layerSelections.get(layer.id);
			const isVisible = selection?.included ?? false;
			if (!isVisible) continue;

			try {
				const img = await loadImageAsync(layer.imageUrl);
				const bounds = layer.bounds || { x: 0, y: 0, width: widthPixels, height: heightPixels };
				ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
			} catch (e) {
				console.warn('[Eyedropper] Failed to load layer:', layer.id, e);
			}
		}

		eyedropperCompositeCtx = ctx;
	}

	/**
	 * Load an image with CORS support.
	 */
	function loadImageAsync(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			// Use proxied URL for external assets
			const proxiedUrl = getProxiedUrl(url) || url;
			img.src = proxiedUrl;
		});
	}

	/**
	 * Pick color from the composite canvas at the current eyedropper position.
	 */
	function pickEyedropperColor() {
		if (!eyedropperCompositeCtx || !eyedropperCanvasPos) {
			console.warn('[Eyedropper] No composite context or position available');
			return;
		}

		const x = Math.floor(eyedropperCanvasPos.x);
		const y = Math.floor(eyedropperCanvasPos.y);

		// Ensure we're within bounds
		if (x < 0 || x >= widthPixels || y < 0 || y >= heightPixels) {
			console.warn('[Eyedropper] Position out of bounds');
			return;
		}

		try {
			const imageData = eyedropperCompositeCtx.getImageData(x, y, 1, 1);
			const [r, g, b] = imageData.data;

			// Convert to hex
			const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

			// Update the tool color
			toolManager.setToolOption('color', hex);

			// Deselect the eyedropper tool (close the picker)
			toolManager.setTool(null);
		} catch (e) {
			console.error('[Eyedropper] Failed to get pixel color:', e);
		}
	}

	// Ensure hit test cache is initialized for all layers
	$effect(() => {
		if (currentLayers && currentLayers.length > 0) {
			currentLayers.forEach((l) => {
				layerManager.initializeHitCache(l);
			});
		}
	});

	// Check if we should show the brush cursor
	const showBrushCursor = $derived(
		(activeTool === 'brush' || activeTool === 'eraser') && mousePosition !== null
	);

	function updateCanvasRect() {
		if (canvasElement) {
			canvasRect = canvasElement.getBoundingClientRect();
		}
	}

	function handlePointerDown(e: PointerEvent) {
		console.log('[Pointer Debug] pointerdown', { activeTool, hasCanvasElement: !!canvasElement });
		// If no tool is active, or move tool is active, allow layer selection
		if (!canvasElement) return;

		// Set pointer capture to ensure we receive pointerup even if mouse leaves canvas
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		// Don't handle if clicking on popover or toolbar
		const target = e.target as HTMLElement;
		if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;

		updateCanvasRect();
		// console.log('[Pointer Debug] canvasRect updated', { hasRect: !!canvasRect });
		if (!canvasRect) return;

		let nextLayerId: string | null = null;

		// Hit Testing for Selection
		// Only if using Move tool or NO tool
		if (!activeTool || activeTool === 'move') {
			const point = {
				x: (e.clientX - canvasRect.left) / canvasRect.width,
				y: (e.clientY - canvasRect.top) / canvasRect.height
			};

			/*console.log('[Hit Test]', {
				client: { x: e.clientX, y: e.clientY },
				canvasRect: {
					left: canvasRect.left,
					top: canvasRect.top,
					w: canvasRect.width,
					h: canvasRect.height
				},
				normalized: point,
				dimensions: { w: widthPixels, h: heightPixels }
			});*/

			// Synchronous bounding box hit test
			const hitLayerIds = layerManager.getLayersAtPosition(point, {
				width: widthPixels,
				height: heightPixels
			});

			console.log('[Hit Test] Hits:', hitLayerIds);

			// Filter out original-file from selection consideration
			const validHits = hitLayerIds.filter((id) => id !== 'original-file');
			console.log('[Hit Test] Valid Hits:', validHits);

			if (validHits.length > 0) {
				// Always select the top-most layer (first hit).
				// Removed cycling logic as it caused accidental selection of underlying layers during drag.
				nextLayerId = validHits[0];
			}

			const isShiftHeld = e.shiftKey;

			if (nextLayerId) {
				// Select the layer (with shift for multi-select)
				if (onSelectLayer) {
					onSelectLayer(nextLayerId, isShiftHeld);
				}
			} else if (!isShiftHeld && selectedLayerIds.size > 0) {
				// Deselect if clicking on empty space (only if not shift-clicking)
				console.log('[Pointer Debug] Deselecting layer (miss)');
				if (onSelectLayer) {
					onSelectLayer(null, false);
				}
			}
		}

		const ctx = {
			canvasRect,
			selectedLayerId,
			layerManager,
			toolManager,
			imageProcessor,
			historyManager,
			color: toolManager?.toolOptions?.color || currentColor,
			size: toolManager?.toolOptions?.size || 20,
			opacity: toolManager?.toolOptions?.opacity || 100,
			hardness: toolManager?.toolOptions?.hardness ?? 100,
			tolerance: toolManager?.toolOptions?.tolerance,
			canvasDimensions: { widthPixels, heightPixels },
			canvasElement: drawingCanvasElement,
			canvasContext: drawingContext ?? undefined,
			undoManager,
			templateId
		};

		if (activeTool === 'move') {
			// If we just selected a new layer, ensure the move tool context uses it.
			// Reactivity (selectedLayerId prop) won't have updated yet in this tick.
			if (nextLayerId) {
				ctx.selectedLayerId = nextLayerId;
			}
			moveTool.onPointerDown(e, ctx);
		} else if (activeTool === 'lasso') {
			console.log('[Lasso Debug] calling lassoTool.onPointerDown');
			lassoTool.onPointerDown(e, ctx);
		} else if (activeTool === 'rectangle') {
			rectangleTool.onPointerDown(e, ctx);
		} else if (activeTool === 'ellipse') {
			ellipseTool.onPointerDown(e, ctx);
		} else if (activeTool === 'brush') {
			brushTool.onPointerDown(e, ctx);
		} else if (activeTool === 'eraser') {
			eraserTool.onPointerDown(e, ctx);
		} else if (activeTool === 'bucket') {
			bucketTool.onPointerDown(e, ctx);
		} else if (activeTool === 'gradient') {
			gradientTool.onPointerDown(e, ctx);
		} else if (activeTool === 'eyedropper') {
			// Pick color from the composite canvas at the current position
			pickEyedropperColor();
		}
	}

	function handlePointerMove(e: PointerEvent) {
		// Update mouse position for brush cursor (in pixels relative to canvas element)
		// This matches the coordinate system used by BrushTool for drawing
		if (canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			mousePosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};

			// Track eyedropper position when eyedropper tool is active
			if (activeTool === 'eyedropper') {
				eyedropperScreenPos = { x: e.clientX, y: e.clientY };
				// Convert to canvas pixel coordinates
				const scaleX = widthPixels / rect.width;
				const scaleY = heightPixels / rect.height;
				eyedropperCanvasPos = {
					x: (e.clientX - rect.left) * scaleX,
					y: (e.clientY - rect.top) * scaleY
				};
			}
		} else {
			mousePosition = null;
			eyedropperScreenPos = null;
			eyedropperCanvasPos = null;
		}

		if (!activeTool || !canvasRect) {
			// Even if tool is not active, we want hover effect
			// But we need canvasRect for accurate hit test coordinates?
			// Usually canvasRect is updated on pointer interaction.
			// Let's rely on cached `canvasRect` or update it if invalid?
			// Updating on every move might be expensive but maybe okay here.
			if (canvasElement && !canvasRect) {
				updateCanvasRect();
			}
		}

		// Hover Effect Logic (When Move tool or No tool is active)
		if ((!activeTool || activeTool === 'move') && canvasRect && layerManager) {
			const point = {
				x: (e.clientX - canvasRect.left) / canvasRect.width,
				y: (e.clientY - canvasRect.top) / canvasRect.height
			};

			// Quick hit test
			const hits = layerManager.getLayersAtPosition(point, {
				width: widthPixels,
				height: heightPixels
			});

			const validHits = hits.filter((id) => id !== 'original-file');

			if (validHits.length > 0) {
				// For hover, just show the top-most one or the one that would be selected next?
				// Simplest UX: Hover the top-most one.
				hoveredLayerId = validHits[0];
			} else {
				hoveredLayerId = null;
			}
		} else {
			hoveredLayerId = null;
		}

		if (!activeTool || !canvasRect) return;

		const ctx = {
			canvasRect,
			selectedLayerId,
			layerManager, // Pass layerManager
			toolManager,
			imageProcessor,
			historyManager,
			color: toolManager?.toolOptions?.color || currentColor,
			size: toolManager?.toolOptions?.size || 20,
			opacity: toolManager?.toolOptions?.opacity || 100,
			hardness: toolManager?.toolOptions?.hardness ?? 100,
			tolerance: toolManager?.toolOptions?.tolerance,
			canvasDimensions: { widthPixels, heightPixels },
			canvasElement: drawingCanvasElement,
			canvasContext: drawingContext ?? undefined,
			undoManager,
			templateId
		};

		if (activeTool === 'move') {
			moveTool.onPointerMove(e, ctx);
		} else if (activeTool === 'rectangle') {
			rectangleTool.onPointerMove(e, ctx);
		} else if (activeTool === 'ellipse') {
			ellipseTool.onPointerMove(e, ctx);
		} else if (activeTool === 'brush') {
			brushTool.onPointerMove(e, ctx);
		} else if (activeTool === 'eraser') {
			eraserTool.onPointerMove(e, ctx);
		} else if (activeTool === 'gradient') {
			gradientTool.onPointerMove(e, ctx);
		} else if (activeTool === 'eyedropper') {
			eyedropperTool.onPointerMove(e, ctx);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		console.log('[Pointer Debug] pointerup', { activeTool, hasCanvasRect: !!canvasRect });
		if (!activeTool || !canvasRect) return;

		const ctx = {
			canvasRect,
			selectedLayerId,
			layerManager,
			toolManager,
			imageProcessor,
			historyManager,
			color: toolManager?.toolOptions?.color || currentColor,
			size: toolManager?.toolOptions?.size || 20,
			opacity: toolManager?.toolOptions?.opacity || 100,
			hardness: toolManager?.toolOptions?.hardness ?? 100,
			tolerance: toolManager?.toolOptions?.tolerance,
			canvasDimensions: { widthPixels, heightPixels },
			canvasElement: drawingCanvasElement,
			canvasContext: drawingContext ?? undefined,
			undoManager,
			templateId
		};

		if (activeTool === 'move') {
			moveTool.onPointerUp(e, ctx);
		} else if (activeTool === 'lasso') {
			console.log(
				'[Pointer Debug] calling lassoTool.onPointerUp, points before:',
				lassoTool.points.length
			);
			lassoTool.onPointerUp(e, ctx);
			console.log('[Pointer Debug] points after:', lassoTool.points.length);
		} else if (activeTool === 'rectangle') {
			rectangleTool.onPointerUp(e, ctx);
		} else if (activeTool === 'ellipse') {
			ellipseTool.onPointerUp(e, ctx);
		} else if (activeTool === 'brush') {
			brushTool.onPointerUp(e, ctx);
		} else if (activeTool === 'eraser') {
			eraserTool.onPointerUp(e, ctx);
		} else if (activeTool === 'bucket') {
			bucketTool.onPointerUp(e, ctx);
		} else if (activeTool === 'gradient') {
			gradientTool.onPointerUp(e, ctx);
		} else if (activeTool === 'eyedropper') {
			eyedropperTool.onPointerUp(e, ctx);
		}
	}

	function handleInnerClick(e: MouseEvent) {
		e.stopPropagation();
		const target = e.target as HTMLElement;

		// If a selection tool is active, pointer events handle everything
		// Don't use legacy click handler - it causes double-registration of points
		if (activeTool === 'lasso' || activeTool === 'rectangle' || activeTool === 'ellipse') {
			// Don't interact if clicking on the popover or toolbar
			if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;
			// Pointer events (pointerdown/pointerup) handle point addition
			e.stopPropagation();
			return;
		}

		// If NOT a selection tool, deselect tool when clicking on canvas
		if (!target.closest('[data-toolbar]')) {
			// Tool deselection is handled by parent
			console.log('[Pointer Debug] Inner click handled (propagation stopped)');
		}
	}

	function handleOuterClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Don't reset if clicking on toolbar, popover, or inside canvas area
		if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;

		// Don't reset selection tools if they're currently active (user is drawing)
		if (activeTool === 'lasso' || activeTool === 'rectangle' || activeTool === 'ellipse') {
			// Only reset if clicking OUTSIDE the canvas wrapper entirely
			if (target.closest('.canvas-stack-content') || canvasElement?.contains(target)) {
				return; // Don't reset - user is interacting with canvas
			}
		}

		// Reset all tools when clicking outside canvas area
		lassoTool.reset();
		rectangleTool.reset();
		ellipseTool.reset();
		eraserTool.reset();

		if (onSelectLayer) {
			console.log('[Pointer Debug] Deselecting layer (outer click)');
			onSelectLayer(null);
		}
	}

	// Reset all tools when active tool changes
	$effect(() => {
		if (activeTool !== 'lasso') lassoTool.reset();
		if (activeTool !== 'rectangle') rectangleTool.reset();
		if (activeTool !== 'ellipse') ellipseTool.reset();
	});

	// Sync tool selection completion to LayerManager
	$effect(() => {
		const handleComplete = (result: any) => {
			layerManager.setSelection(result);
		};

		lassoTool.onComplete = handleComplete;
		rectangleTool.onComplete = handleComplete;
		ellipseTool.onComplete = handleComplete;
		// Initialize with null/clear if no tool is active or selection is open?
		// Actually, we probably want to clear checking if 'activeTool' changed.
		// But let's rely on manual resets for now.
	});

	// Escape key resets selection
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				lassoTool.reset();
				rectangleTool.reset();
				ellipseTool.reset();
			}
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	});

	function handleSelectionAction(action: SelectionAction) {
		if (onSelectionAction) {
			let points: NormalizedPoint[] = [];

			if (activeTool === 'lasso' && lassoTool.isClosed) {
				points = lassoTool.confirmCopy();
			} else if (activeTool === 'rectangle' && rectangleTool.isClosed) {
				points = rectangleTool.confirmCopy();
			} else if (activeTool === 'ellipse' && ellipseTool.isClosed) {
				points = ellipseTool.confirmCopy();
			}

			if (points.length > 0) {
				onSelectionAction(action, points);
			}
		}
	}
</script>

<div class="rounded-lg border border-border bg-card overflow-hidden">
	<div class="p-4 border-b border-border bg-muted/30">
		<h2 class="font-medium text-foreground">Template Preview</h2>
		<p class="text-xs text-muted-foreground">
			{widthPixels} x {heightPixels}px • {orientation}
		</p>
		<!-- DEBUG: Remove after testing -->
		{#if activeTool === 'lasso'}
			<p class="text-xs text-blue-500 mt-1">
				Lasso: {lassoTool.points.length} pts | closed: {lassoTool.isClosed}
			</p>
		{/if}
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="relative h-[500px] bg-muted/50 flex items-center justify-center p-4 border border-border rounded-md overflow-hidden select-none"
		onclick={handleOuterClick}
		role="button"
		tabindex="0"
	>
		<!-- Inner Image Wrapper - Constrained by aspect ratio within fixed-height parent -->
		<div
			bind:this={canvasElement}
			class="relative shadow-sm transition-all bg-[length:20px_20px] bg-repeat select-none"
			style="
				aspect-ratio: {widthPixels}/{heightPixels};
				height: 100%;
				max-width: 100%;
				background-image: conic-gradient(#eee 90deg, transparent 90deg), conic-gradient(transparent 90deg, #eee 90deg);
				cursor: {showBrushCursor || activeTool === 'eyedropper'
				? 'none'
				: activeTool === 'move'
					? hoveredLayerId
						? 'move'
						: 'default'
					: activeTool
						? 'crosshair'
						: 'default'};
				user-select: none;
				-webkit-user-select: none;
			"
			onclick={handleInnerClick}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointerleave={() => {
				mousePosition = null;
				hoveredLayerId = null;
				eyedropperScreenPos = null;
				eyedropperCanvasPos = null;
			}}
			role="button"
			tabindex="0"
		>
			{#if renderedLayers.length > 0}
				<!-- Render Decomposed Layers - explicit transparent background for proper layer compositing -->
				<div class="relative w-full h-full" style="background: transparent;">
					{#each renderedLayers as layer, idx (layer.id)}
						{@const selection = layerSelections.get(layer.id)}
						{@const mask = masks.get(layer.id)}
						{@const isVisible = layer.isBackground ? true : (selection?.included ?? false)}
						{@const hasBounds = layer.bounds && layer.bounds.width > 0 && layer.bounds.height > 0}
						{@const boundsX = layer.bounds?.x || 0}
						{@const boundsY = layer.bounds?.y || 0}
						{@const boundsW = layer.bounds?.width || 0}
						{@const boundsH = layer.bounds?.height || 0}
						{@const cssLeft = hasBounds ? (boundsX / widthPixels) * 100 : 0}
						{@const cssTop = hasBounds ? (boundsY / heightPixels) * 100 : 0}
						{@const cssWidth = hasBounds ? (boundsW / widthPixels) * 100 : 100}
						{@const cssHeight = hasBounds ? (boundsH / heightPixels) * 100 : 100}
						{@const objectFit = layer.isBackground ? 'contain' : 'fill'}
						<!-- Layer with explicit transparent background for PNG transparency -->
						<!-- Using object-contain to preserve PNG aspect ratio and transparency -->
						<img
							src={layer.imageUrl}
							alt={layer.name}
							draggable="false"
							class="absolute transition-opacity duration-200 pointer-events-none select-none"
							style="
								background: transparent;
								object-fit: {objectFit};
								object-position: center;
								z-index: {layer.zIndex};
								opacity: {isVisible ? 1 : 0};
								left: {cssLeft}%;
								top: {cssTop}%;
								width: {cssWidth}%;
								height: {cssHeight}%;
								mask-image: {mask ? `url(${mask.maskData})` : 'none'};
								mask-size: 100% 100%;
								-webkit-mask-image: {mask ? `url(${mask.maskData})` : 'none'};
								-webkit-mask-size: 100% 100%;
								filter: {selectedLayerIds.has(layer.id)
								? 'var(--selection-drop-shadow)'
								: hoveredLayerId === layer.id
									? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))'
									: 'none'};
							"
							class:layer-selection-glow={selectedLayerIds.has(layer.id)}
						/>
					{/each}

					<!-- Selection Overlay (High Z-Index) -->
					<div class="absolute inset-0 pointer-events-none" style="z-index: 9999;">
						{#if activeTool === 'brush' || activeTool === 'eraser'}
							<DrawingCanvas
								width={widthPixels}
								height={heightPixels}
								bind:canvasElement={drawingCanvasElement}
								bind:context={drawingContext}
							/>
						{/if}
						<!-- Brush Cursor -->
						{#if showBrushCursor && mousePosition}
							<BrushCursor
								x={mousePosition.x}
								y={mousePosition.y}
								size={toolManager?.toolOptions?.size || 20}
								hardness={toolManager?.toolOptions?.hardness ?? 100}
								color={toolManager?.toolOptions?.color || currentColor}
								isEraser={activeTool === 'eraser'}
							/>
						{/if}
						{#each renderedLayers as layer (layer.id)}
							{@const hasBounds = layer.bounds && layer.bounds.width > 0 && layer.bounds.height > 0}
							{@const boundsX = layer.bounds?.x || 0}
							{@const boundsY = layer.bounds?.y || 0}
							{@const boundsW = layer.bounds?.width || 0}
							{@const boundsH = layer.bounds?.height || 0}
							{@const cssLeft = hasBounds ? (boundsX / widthPixels) * 100 : 0}
							{@const cssTop = hasBounds ? (boundsY / heightPixels) * 100 : 0}
							{@const cssWidth = hasBounds ? (boundsW / widthPixels) * 100 : 100}
							{@const cssHeight = hasBounds ? (boundsH / heightPixels) * 100 : 100}
						{/each}
					</div>
				</div>
			{:else}
				<div class="text-center text-muted-foreground">
					<ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-30" />
					<p class="text-sm">No image available</p>
				</div>
			{/if}

			<!-- Unified Selection Overlay -->
			<SelectionOverlay
				{activeTool}
				{lassoTool}
				{rectangleTool}
				{ellipseTool}
				{isProcessing}
				onAction={handleSelectionAction}
			/>
		</div>
	</div>
</div>

<!-- Eyedropper Cursor (Fixed position, follows mouse) -->
{#if showEyedropper && eyedropperScreenPos && eyedropperCanvasPos && eyedropperCompositeCtx}
	<EyedropperCursor
		x={eyedropperScreenPos.x}
		y={eyedropperScreenPos.y}
		canvasX={eyedropperCanvasPos.x}
		canvasY={eyedropperCanvasPos.y}
		compositeCtx={eyedropperCompositeCtx}
		zoomLevel={10}
		gridSize={11}
	/>
{/if}

<style>
	/* Glowing pulse animation for selected layer */
	.layer-selection-glow {
		animation: selection-pulse 2s ease-in-out infinite;
	}

	@keyframes selection-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 2px rgba(34, 211, 238, 0.8))
				drop-shadow(0 0 6px rgba(34, 211, 238, 0.4));
		}
		50% {
			filter: drop-shadow(0 0 4px rgba(34, 211, 238, 1))
				drop-shadow(0 0 12px rgba(34, 211, 238, 0.6));
		}
	}
</style>
