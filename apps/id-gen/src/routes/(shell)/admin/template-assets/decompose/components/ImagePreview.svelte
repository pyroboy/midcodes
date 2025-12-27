<script lang="ts">
	import { ImageIcon } from 'lucide-svelte';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';
	import type { LayerMask, LayerManager } from '$lib/logic/LayerManager.svelte';
	import type { ToolManager } from '$lib/logic/ToolManager.svelte';
	import type { ImageProcessor } from '$lib/logic/ImageProcessor.svelte';
	import type { HistoryManager } from '$lib/logic/HistoryManager.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import { LassoTool } from '$lib/logic/tools/LassoTool.svelte';
	import { RectangleTool } from '$lib/logic/tools/RectangleTool.svelte';
	import { EllipseTool } from '$lib/logic/tools/EllipseTool.svelte';
	import { BrushTool } from '$lib/logic/tools/BrushTool.svelte';
	import { EraserTool } from '$lib/logic/tools/EraserTool.svelte';
	import { BucketTool } from '$lib/logic/tools/BucketTool.svelte';
	import { GradientTool } from '$lib/logic/tools/GradientTool.svelte';
	import DrawingCanvas from './DrawingCanvas.svelte';
	import BrushCursor from './BrushCursor.svelte';
	import type { ToolName, NormalizedPoint } from '$lib/logic/tools';
	import { toast } from 'svelte-sonner';

	type SelectionAction = 'copy' | 'fill' | 'delete';

	let {
		currentImageUrl,
		currentLayers,
		layerSelections,
		masks = new Map(),
		showOriginalLayer,
		selectedLayerId,
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
		onToolChange,
		onDuplicate
	}: {
		currentImageUrl: string | null;
		currentLayers: DecomposedLayer[];
		layerSelections: Map<string, LayerSelection>;
		masks?: Map<string, LayerMask>;
		showOriginalLayer: boolean;
		selectedLayerId: string | null;
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
		onToolChange?: (tool: ToolName) => void;
		onDuplicate?: () => void;
	} = $props();

	// Tool instances
	const lassoTool = new LassoTool();
	const rectangleTool = new RectangleTool();
	const ellipseTool = new EllipseTool();
	const brushTool = new BrushTool();
	const eraserTool = new EraserTool();
	const bucketTool = new BucketTool();
	const gradientTool = new GradientTool();

	// Get the active tool instance
	const activeToolInstance = $derived(
		activeTool === 'lasso'
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
		console.log('[Lasso Debug] pointerdown', { activeTool, hasCanvasElement: !!canvasElement });
		if (!activeTool || !canvasElement) return;

		// Don't handle if clicking on popover or toolbar
		const target = e.target as HTMLElement;
		if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;

		updateCanvasRect();
		console.log('[Lasso Debug] canvasRect updated', { hasRect: !!canvasRect });
		if (!canvasRect) return;

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
			canvasContext: drawingContext ?? undefined
		};

		if (activeTool === 'lasso') {
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
		}
	}

	function handlePointerMove(e: PointerEvent) {
		// Update mouse position for brush cursor (in pixels relative to canvas element)
		// This matches the coordinate system used by BrushTool for drawing
		if ((activeTool === 'brush' || activeTool === 'eraser') && canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			mousePosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
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
			canvasContext: drawingContext ?? undefined
		};

		if (activeTool === 'rectangle') {
			rectangleTool.onPointerMove(e, ctx);
		} else if (activeTool === 'ellipse') {
			ellipseTool.onPointerMove(e, ctx);
		} else if (activeTool === 'brush') {
			brushTool.onPointerMove(e, ctx);
		} else if (activeTool === 'eraser') {
			eraserTool.onPointerMove(e, ctx);
		} else if (activeTool === 'gradient') {
			gradientTool.onPointerMove(e, ctx);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		console.log('[Lasso Debug] pointerup', { activeTool, hasCanvasRect: !!canvasRect });
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
			canvasContext: drawingContext ?? undefined
		};

		if (activeTool === 'lasso') {
			console.log(
				'[Lasso Debug] calling lassoTool.onPointerUp, points before:',
				lassoTool.points.length
			);
			lassoTool.onPointerUp(e, ctx);
			console.log('[Lasso Debug] points after:', lassoTool.points.length);
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
		}
	}

	function handleInnerClick(e: MouseEvent) {
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
		class="relative h-[500px] bg-muted/50 flex items-center justify-center p-4 border border-border rounded-md overflow-hidden"
		onclick={handleOuterClick}
		role="button"
		tabindex="0"
	>
		<!-- Inner Image Wrapper - Constrained by aspect ratio within fixed-height parent -->
		<div
			bind:this={canvasElement}
			class="relative shadow-sm transition-all bg-[length:20px_20px] bg-repeat"
			style="
				aspect-ratio: {widthPixels}/{heightPixels};
				height: 100%;
				max-width: 100%;
				background-image: conic-gradient(#eee 90deg, transparent 90deg), conic-gradient(transparent 90deg, #eee 90deg);
				cursor: {showBrushCursor ? 'none' : 'default'};
			"
			onclick={handleInnerClick}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointerleave={() => (mousePosition = null)}
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
							class="absolute transition-opacity duration-200 pointer-events-none"
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
							"
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
							<div
								class="absolute inset-0 border-2 transition-opacity {selectedLayerId === layer.id
									? 'border-primary opacity-100'
									: 'border-transparent opacity-0'}"
							></div>
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
