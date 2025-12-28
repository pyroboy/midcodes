import {
	type CanvasTool,
	type ToolContext,
	normalizePointerEvent,
	DrawingTool
} from './BaseTool';
import { toast } from 'svelte-sonner';
import { getProxiedUrl } from '$lib/utils/storage';

/**
 * Eraser Tool Implementation
 *
 * REAL-TIME eraser that directly modifies layer pixels as you draw.
 * Instead of showing white strokes, it immediately erases pixels
 * from the layer, showing transparency in real-time.
 *
 * Features:
 * 1. Immediate visual feedback - pixels disappear as you draw
 * 2. Proper coordinate scaling from CSS to canvas intrinsic dimensions
 * 3. Smooth stroke rendering using quadratic bezier curves
 * 4. Soft brush support via blur filter based on hardness setting
 * 5. Full undo/redo snapshot support
 * 6. Direct layer modification (no overlay strokes)
 */
export class EraserTool extends DrawingTool implements CanvasTool {
	readonly name = 'eraser';
	readonly cursor = 'crosshair';
	readonly requiresLayer = true;

	// Runtime state
	protected isDrawing = false;
	private layerCanvas: HTMLCanvasElement | null = null;
	private layerCtx: CanvasRenderingContext2D | null = null;
	private lastPoint: { x: number; y: number } | null = null;
	private currentBlurRadius = 0;
	private targetLayerId: string | null = null;
	private beforeSnapshot: any = null;
	private layerBounds: { x: number; y: number; width: number; height: number } | null = null;

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// No overlay needed - we draw directly on the layer
	}

	onActivate(ctx: ToolContext): void {
		// Nothing unique needed on activation
	}

	onDeactivate(): void {
		this.reset();
	}

	reset() {
		this.isDrawing = false;
		this.layerCanvas = null;
		this.layerCtx = null;
		this.lastPoint = null;
		this.currentBlurRadius = 0;
		this.targetLayerId = null;
		this.beforeSnapshot = null;
		this.layerBounds = null;
	}

	async onPointerDown(e: PointerEvent, ctx: ToolContext): Promise<void> {
		// Eraser requires a selected layer (not the original background)
		if (!ctx.selectedLayerId || ctx.selectedLayerId === 'original-file') {
			toast.warning('Please select a layer to erase');
			return;
		}

		this.targetLayerId = ctx.selectedLayerId;

		// Get the layer data
		const layers = ctx.layerManager.activeSide === 'front'
			? ctx.layerManager.frontLayers
			: ctx.layerManager.backLayers;
		const layer = layers.find(l => l.id === ctx.selectedLayerId);
		if (!layer) {
			console.warn('[EraserTool] Layer not found');
			return;
		}

		// Capture undo snapshot BEFORE any modifications
		if (ctx.undoManager) {
			this.beforeSnapshot = ctx.undoManager.captureSnapshot(this.targetLayerId);
		}

		// Load the layer image into a canvas for direct editing
		try {
			const img = await this.loadImage(layer.imageUrl);
			if (!img) {
				console.warn('[EraserTool] Failed to load layer image');
				return;
			}

			// Create a canvas for direct editing
			this.layerCanvas = document.createElement('canvas');
			this.layerBounds = layer.bounds || { x: 0, y: 0, width: img.width, height: img.height };
			this.layerCanvas.width = this.layerBounds.width;
			this.layerCanvas.height = this.layerBounds.height;
			this.layerCtx = this.layerCanvas.getContext('2d', { willReadFrequently: true });

			if (!this.layerCtx) {
				console.warn('[EraserTool] Failed to get canvas context');
				return;
			}

			// Draw the current layer content
			this.layerCtx.drawImage(img, 0, 0, this.layerBounds.width, this.layerBounds.height);

			this.isDrawing = true;

			// Calculate blur radius based on hardness
			const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
			if (ctx.hardness < 100) {
				this.currentBlurRadius = ((ctx.size * scaleX) * (1 - ctx.hardness / 100)) / 4;
			} else {
				this.currentBlurRadius = 0;
			}

			// Get the first point and erase
			const point = this.getPoint(e, ctx);
			this.eraseAt(point, ctx);
			this.lastPoint = point;

			// Update the layer display immediately
			this.updateLayerDisplay(ctx);
		} catch (err) {
			console.error('[EraserTool] Error initializing:', err);
		}
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing || !this.layerCtx || !this.layerCanvas) return;

		const point = this.getPoint(e, ctx);

		// Draw erasing stroke from last point to current point
		if (this.lastPoint) {
			this.eraseStroke(this.lastPoint, point, ctx);
		} else {
			this.eraseAt(point, ctx);
		}

		this.lastPoint = point;

		// Update the layer display immediately
		this.updateLayerDisplay(ctx);
	}

	async onPointerUp(e: PointerEvent, ctx: ToolContext): Promise<void> {
		if (!this.isDrawing || !this.layerCanvas || !this.targetLayerId) {
			this.reset();
			return;
		}

		this.isDrawing = false;

		// Finalize: convert canvas to blob and update layer
		await this.finalizeErase(ctx);

		this.reset();
	}

	/**
	 * Get point in layer coordinates (accounting for layer bounds offset)
	 */
	private getPoint(e: PointerEvent, ctx: ToolContext): { x: number; y: number } {
		const cssX = e.clientX - ctx.canvasRect.left;
		const cssY = e.clientY - ctx.canvasRect.top;

		// Scale to canvas dimensions
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const scaleY = ctx.canvasDimensions.heightPixels / ctx.canvasRect.height;
		const canvasX = cssX * scaleX;
		const canvasY = cssY * scaleY;

		// Convert to layer-local coordinates
		if (this.layerBounds) {
			return {
				x: canvasX - this.layerBounds.x,
				y: canvasY - this.layerBounds.y
			};
		}

		return { x: canvasX, y: canvasY };
	}

	/**
	 * Erase at a single point (for dots)
	 */
	private eraseAt(point: { x: number; y: number }, ctx: ToolContext) {
		if (!this.layerCtx) return;

		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const brushSize = ctx.size * scaleX;

		// Save context state
		this.layerCtx.save();

		// Use destination-out to erase
		this.layerCtx.globalCompositeOperation = 'destination-out';
		this.layerCtx.lineCap = 'round';
		this.layerCtx.lineJoin = 'round';
		this.layerCtx.lineWidth = brushSize;
		this.layerCtx.strokeStyle = 'rgba(0, 0, 0, 1)';

		// Apply blur for soft edges
		if (this.currentBlurRadius > 0) {
			this.layerCtx.filter = `blur(${this.currentBlurRadius}px)`;
		}

		// Draw a tiny stroke to make a dot
		this.layerCtx.beginPath();
		this.layerCtx.moveTo(point.x, point.y);
		this.layerCtx.lineTo(point.x + 0.1, point.y + 0.1);
		this.layerCtx.stroke();

		// Restore context state
		this.layerCtx.restore();
	}

	/**
	 * Erase a stroke from point A to point B
	 */
	private eraseStroke(from: { x: number; y: number }, to: { x: number; y: number }, ctx: ToolContext) {
		if (!this.layerCtx) return;

		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const brushSize = ctx.size * scaleX;

		// Save context state
		this.layerCtx.save();

		// Use destination-out to erase
		this.layerCtx.globalCompositeOperation = 'destination-out';
		this.layerCtx.lineCap = 'round';
		this.layerCtx.lineJoin = 'round';
		this.layerCtx.lineWidth = brushSize;
		this.layerCtx.strokeStyle = 'rgba(0, 0, 0, 1)';

		// Apply blur for soft edges
		if (this.currentBlurRadius > 0) {
			this.layerCtx.filter = `blur(${this.currentBlurRadius}px)`;
		}

		// Draw line segment
		this.layerCtx.beginPath();
		this.layerCtx.moveTo(from.x, from.y);
		this.layerCtx.lineTo(to.x, to.y);
		this.layerCtx.stroke();

		// Restore context state
		this.layerCtx.restore();
	}

	/**
	 * Update the layer's display in real-time
	 */
	private updateLayerDisplay(ctx: ToolContext) {
		if (!this.layerCanvas || !this.targetLayerId || !ctx.layerManager) return;

		// Create a new blob URL for the modified canvas
		this.layerCanvas.toBlob((blob) => {
			if (!blob || !this.targetLayerId) return;

			// Revoke old URL and create new one
			const layers = ctx.layerManager.activeSide === 'front'
				? ctx.layerManager.frontLayers
				: ctx.layerManager.backLayers;
			const layer = layers.find(l => l.id === this.targetLayerId);

			if (layer) {
				// Revoke old blob URL if it exists
				if (layer.imageUrl.startsWith('blob:')) {
					URL.revokeObjectURL(layer.imageUrl);
				}

				// Create new blob URL
				const newUrl = URL.createObjectURL(blob);
				layer.imageUrl = newUrl;

				// Trigger reactivity
				if (ctx.layerManager.activeSide === 'front') {
					ctx.layerManager.frontLayers = [...ctx.layerManager.frontLayers];
				} else {
					ctx.layerManager.backLayers = [...ctx.layerManager.backLayers];
				}
			}
		}, 'image/png');
	}

	/**
	 * Finalize the erase operation
	 */
	private async finalizeErase(ctx: ToolContext): Promise<void> {
		if (!this.layerCanvas || !this.targetLayerId || !ctx.layerManager) return;

		const targetLayerId = this.targetLayerId;
		const layerCanvas = this.layerCanvas;
		const bounds = this.layerBounds;

		return new Promise((resolve) => {
			layerCanvas.toBlob(async (blob) => {
				if (!blob) {
					console.error('[EraserTool] Failed to generate final blob');
					resolve();
					return;
				}

				// Get layer reference
				const layers = ctx.layerManager.activeSide === 'front'
					? ctx.layerManager.frontLayers
					: ctx.layerManager.backLayers;
				const layer = layers.find(l => l.id === targetLayerId);

				if (layer) {
					// Update layer with final blob
					if (layer.imageUrl.startsWith('blob:')) {
						URL.revokeObjectURL(layer.imageUrl);
					}
					const newUrl = URL.createObjectURL(blob);
					layer.imageUrl = newUrl;
					layer.cachedBlob = blob;

					// Update selection
					const sel = ctx.layerManager.selections.get(targetLayerId);
					if (sel) {
						sel.layerImageUrl = newUrl;
						ctx.layerManager.selections = new Map(ctx.layerManager.selections);
					}

					// Trigger reactivity
					if (ctx.layerManager.activeSide === 'front') {
						ctx.layerManager.frontLayers = [...ctx.layerManager.frontLayers];
					} else {
						ctx.layerManager.backLayers = [...ctx.layerManager.backLayers];
					}

					// Add to upload cache
					ctx.layerManager.addToCache(targetLayerId, blob, layer.side);

					// Update hit test cache
					ctx.layerManager.initializeHitCache(layer);

					ctx.layerManager.markUnsaved();
				}

				// Push undo action
				if (ctx.undoManager && this.beforeSnapshot) {
					const afterSnapshot = ctx.undoManager.captureSnapshot(targetLayerId);
					ctx.undoManager.push({
						type: 'layer-modify',
						layerId: targetLayerId,
						beforeSnapshot: this.beforeSnapshot,
						afterSnapshot: afterSnapshot || undefined
					});
				}

				ctx.historyManager?.addLocalEntry('erase', 'erased-from-layer');

				resolve();
			}, 'image/png');
		});
	}

	/**
	 * Load an image from URL with CORS support
	 */
	private loadImage(url: string): Promise<HTMLImageElement | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = () => resolve(null);
			const proxiedUrl = getProxiedUrl(url) || url;
			img.src = proxiedUrl;
		});
	}
}

export function createEraserTool() {
	return new EraserTool();
}
