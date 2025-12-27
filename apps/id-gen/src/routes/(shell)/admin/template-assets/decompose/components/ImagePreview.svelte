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
	import type { ToolName, NormalizedPoint } from '$lib/logic/tools';

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

	function updateCanvasRect() {
		if (canvasElement) {
			canvasRect = canvasElement.getBoundingClientRect();
		}
	}

	function handlePointerDown(e: PointerEvent) {
		if (!activeTool || !canvasElement) return;

		// Don't handle if clicking on popover or toolbar
		const target = e.target as HTMLElement;
		if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;

		updateCanvasRect();
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
			tolerance: toolManager?.toolOptions?.tolerance,
			canvasDimensions: { widthPixels, heightPixels },
			canvasElement: drawingCanvasElement,
			canvasContext: drawingContext ?? undefined
		};

		// For brush, we need real options. Ideally ImagePreview should receive toolOptions props.
		// For now, using defaults or what's passed in ctx.
		// Update: ImagePreview has activeTool but not full options prop.
		// We should probably rely on `activeToolInstance` pattern more.

		if (activeTool === 'lasso') {
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
			tolerance: toolManager?.toolOptions?.tolerance,
			canvasDimensions: { widthPixels, heightPixels },
			canvasElement: drawingCanvasElement,
			canvasContext: drawingContext ?? undefined
		};

		if (activeTool === 'lasso') {
			lassoTool.onPointerUp(e, ctx);
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

		// If a selection tool is active, delegate to pointer events
		if (activeTool === 'lasso' || activeTool === 'rectangle' || activeTool === 'ellipse') {
			// Don't interact if clicking on the popover or toolbar
			if (target.closest('[data-toolbar]') || target.closest('[data-selection-popover]')) return;

			// For lasso, use legacy click handler for backward compatibility
			if (activeTool === 'lasso') {
				e.stopPropagation();
				updateCanvasRect();
				if (canvasRect) {
					lassoTool.handleClick(e, canvasRect);
				}
			}
			return;
		}

		// If NOT a selection tool, deselect tool when clicking on canvas
		if (!target.closest('[data-toolbar]')) {
			// Tool deselection is handled by parent
		}
	}

	function handleOuterClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Don't handle if clicking on toolbar area
		if (!target.closest('[data-toolbar]')) {
			lassoTool.reset();
			rectangleTool.reset();
			ellipseTool.reset();
			eraserTool.reset();
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
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="relative aspect-[1.6/1] bg-muted/50 flex items-center justify-center pb-20 border border-border rounded-md overflow-hidden"
		onclick={handleOuterClick}
		role="button"
		tabindex="0"
	>
		<!-- Inner Image Wrapper - Constrained by Aspect Ratio -->
		<div
			bind:this={canvasElement}
			class="relative w-full h-full shadow-sm flex items-center justify-center transition-all bg-[length:20px_20px] bg-repeat"
			style="max-width: 100%; max-height: 100%; aspect-ratio: {widthPixels}/{heightPixels}; background-image: conic-gradient(#eee 90deg, transparent 90deg), conic-gradient(transparent 90deg, #eee 90deg);"
			onclick={handleInnerClick}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			role="button"
			tabindex="0"
		>
			{#if currentLayers.length > 0}
				<!-- Render Decomposed Layers -->
				<div class="relative w-full h-full">
					<!-- Original File Layer (shown behind all others when enabled) -->
					{#if showOriginalLayer && currentImageUrl}
						<img
							src={currentImageUrl}
							alt="Original file"
							class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
							style="z-index: -1; opacity: 0.5;"
						/>
					{/if}

					{#each currentLayers as layer (layer.id)}
						{@const selection = layerSelections.get(layer.id)}
						{@const mask = masks.get(layer.id)}
						{@const hasBounds = layer.bounds && layer.bounds.width > 0 && layer.bounds.height > 0}
						<!-- Added mask-image style -->
						<img
							src={layer.imageUrl}
							alt={layer.name}
							class="absolute object-fill transition-opacity duration-200 pointer-events-none"
							style="
								z-index: {layer.zIndex}; 
								opacity: {selection?.included ? 1 : 0};
								left: {hasBounds ? ((layer.bounds?.x || 0) / widthPixels) * 100 : 0}%;
								top: {hasBounds ? ((layer.bounds?.y || 0) / heightPixels) * 100 : 0}%;
								width: {hasBounds ? ((layer.bounds?.width || 0) / widthPixels) * 100 : 100}%;
								height: {hasBounds ? ((layer.bounds?.height || 0) / heightPixels) * 100 : 100}%;
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
						{#each currentLayers as layer (layer.id)}
							<div
								class="absolute inset-0 border-2 transition-opacity {selectedLayerId === layer.id
									? 'border-primary opacity-100'
									: 'border-transparent opacity-0'}"
							></div>
						{/each}
					</div>
				</div>
			{:else if currentImageUrl && showOriginalLayer}
				<img
					src={currentImageUrl}
					alt="{assetName} - {activeSide}"
					class="w-full h-full object-contain"
				/>
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
