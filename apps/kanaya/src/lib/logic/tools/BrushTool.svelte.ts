import {
	type CanvasTool,
	type ToolContext,
	normalizePointerEvent,
	DrawingTool
} from './BaseTool';

/**
 * Brush Tool Implementation
 *
 * Requirements:
 * 1. Draw freehand lines on a dedicated canvas.
 * 2. On pointer up, merge the drawing into the selected layer (any type) or create a new layer.
 * 3. Support size and opacity options.
 * 4. Capture undo snapshots before modifying layers.
 */
export class BrushTool extends DrawingTool implements CanvasTool {
	readonly name = 'brush';
	readonly cursor = 'crosshair';
	readonly requiresLayer = false;

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// Brush renders directly to its own canvas, no overlay needed
	}

	// Runtime state
	protected isDrawing = false;
	private context: CanvasRenderingContext2D | null = null;
	private points: { x: number; y: number }[] = [];
	private boundingBox: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null = null;
	// Track the blur radius to adjust bounding box padding
	private currentBlurRadius = 0;

	// Track the layer ID we're drawing on for this stroke
	private targetLayerId: string | null = null;

	onActivate(ctx: ToolContext): void {
		// Pick up selected layer if one exists
		if (ctx.selectedLayerId === 'original-file') {
			const bgLayer = ctx.layerManager.getBackgroundLayer();
			this.targetLayerId = bgLayer?.id || null;
		} else if (ctx.selectedLayerId) {
			this.targetLayerId = ctx.selectedLayerId;
		}
	}

	onDeactivate(): void {
		this.isDrawing = false;
		this.context = null;
		this.points = [];
		this.boundingBox = null;
		this.targetLayerId = null;
		this.currentBlurRadius = 0;
	}

	async onPointerDown(e: PointerEvent, ctx: ToolContext): Promise<void> {
		console.log('[BrushTool] onPointerDown - Coordinate Debug:', {
			hasCtx: !!ctx.canvasContext,
			canvasRect: ctx.canvasRect ? {
				left: ctx.canvasRect.left,
				top: ctx.canvasRect.top,
				width: ctx.canvasRect.width,
				height: ctx.canvasRect.height
			} : null,
			canvasDimensions: ctx.canvasDimensions,
			pointerEvent: {
				clientX: e.clientX,
				clientY: e.clientY
			}
		});
		if (!ctx.canvasContext) return; // Must have drawing context

		this.isDrawing = true;
		this.context = ctx.canvasContext;
		this.points = [];

		// Calculate blur radius once per stroke
		// Scale brush size from CSS pixels to canvas intrinsic pixels
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const scaleY = ctx.canvasDimensions.heightPixels / ctx.canvasRect.height;
		
		console.log('[BrushTool] Scale factors:', { scaleX, scaleY });
		
		if (ctx.hardness < 100) {
			// Reduced max blur to /4 to avoid excessive size blowup
			this.currentBlurRadius = ((ctx.size * scaleX) * (1 - ctx.hardness / 100)) / 4;
		} else {
			this.currentBlurRadius = 0;
		}

		const point = this.getPoint(e, ctx.canvasRect, ctx.canvasDimensions);
		console.log('[BrushTool] First stroke point (canvas intrinsic coords):', point);
		
		this.addPoint(point);

		// Use currently selected layer (any type) - capture at pointer down
		// If 'original-file' is selected, auto-create the background layer
		if (ctx.selectedLayerId === 'original-file') {
			// Auto-create BG layer from original image
			if (ctx.originalImageUrl) {
				const bgLayerId = await ctx.layerManager.createBackgroundLayer(
					ctx.originalImageUrl,
					ctx.canvasDimensions.widthPixels,
					ctx.canvasDimensions.heightPixels
				);
				this.targetLayerId = bgLayerId;
				console.log('[BrushTool] Created/found BG layer:', bgLayerId);
			} else {
				// Fallback: check if BG layer already exists
				const bgLayer = ctx.layerManager.getBackgroundLayer();
				this.targetLayerId = bgLayer?.id || null;
			}
		} else if (ctx.selectedLayerId) {
			this.targetLayerId = ctx.selectedLayerId;
		} else {
			this.targetLayerId = null; // Will create new layer
		}

		this.renderStroke(ctx);
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing || !this.context) return;

		const point = this.getPoint(e, ctx.canvasRect, ctx.canvasDimensions);
		this.addPoint(point);
		this.renderStroke(ctx);
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		console.log('[BrushTool] onPointerUp', { isDrawing: this.isDrawing, hasContext: !!this.context });
		if (!this.isDrawing) return;
		this.isDrawing = false;

		if (this.context) {
			if (this.boundingBox && ctx.layerManager) {
				this.context.closePath();
				this.finalizeStroke(ctx);
			} else {
				console.log('[BrushTool] Skipping finalizeStroke', { bbox: !!this.boundingBox, lm: !!ctx.layerManager });
			}
			// Reset filter
			this.context.filter = 'none';
		}

		this.context = null;
		this.points = [];
		this.boundingBox = null;
		this.currentBlurRadius = 0;
	}

	private addPoint(point: { x: number; y: number }) {
		this.points.push(point);
		this.updateBoundingBox(point.x, point.y);
	}

	private renderStroke(ctx: ToolContext) {
		if (!this.context || !ctx.canvasElement || this.points.length === 0) return;

		const canvas = ctx.canvasElement as HTMLCanvasElement;
		
		// Clear entire canvas to avoid opacity stacking
		this.context.clearRect(0, 0, canvas.width, canvas.height);

		// Setup styles
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';
		this.context.strokeStyle = ctx.color;
		this.context.lineWidth = ctx.size * scaleX;
		this.context.globalAlpha = ctx.opacity / 100;

		if (this.currentBlurRadius > 0) {
			this.context.filter = `blur(${this.currentBlurRadius}px)`;
		} else {
			this.context.filter = 'none';
		}

		this.context.beginPath();

		if (this.points.length < 2) {
			// Draw a single dot
			const p = this.points[0];
			this.context.moveTo(p.x, p.y);
			this.context.lineTo(p.x + 0.1, p.y + 0.1);
		} else {
			// Draw smooth curve through points
			this.context.moveTo(this.points[0].x, this.points[0].y);
			
			// Use quadratic curves for smoothing
			for (let i = 1; i < this.points.length - 1; i++) {
				const p1 = this.points[i];
				const p2 = this.points[i + 1];
				const midX = (p1.x + p2.x) / 2;
				const midY = (p1.y + p2.y) / 2;
				this.context.quadraticCurveTo(p1.x, p1.y, midX, midY);
			}
			
			// Connect to last point
			const last = this.points[this.points.length - 1];
			this.context.lineTo(last.x, last.y);
		}

		this.context.stroke();
	}

	/**
	 * Transform CSS pixel coordinates to canvas intrinsic coordinates.
	 * The canvas is displayed at CSS size but draws at intrinsic resolution.
	 */
	private getPoint(e: PointerEvent, rect: DOMRect, canvasDimensions?: { widthPixels: number; heightPixels: number }) {
		const cssX = e.clientX - rect.left;
		const cssY = e.clientY - rect.top;
		
		if (canvasDimensions) {
			// Scale from CSS space to canvas intrinsic space
			const scaleX = canvasDimensions.widthPixels / rect.width;
			const scaleY = canvasDimensions.heightPixels / rect.height;
			return {
				x: cssX * scaleX,
				y: cssY * scaleY
			};
		}
		
		return { x: cssX, y: cssY };
	}

	private updateBoundingBox(x: number, y: number) {
		if (!this.boundingBox) {
			this.boundingBox = { minX: x, minY: y, maxX: x, maxY: y };
			return;
		}
		this.boundingBox.minX = Math.min(this.boundingBox.minX, x);
		this.boundingBox.minY = Math.min(this.boundingBox.minY, y);
		this.boundingBox.maxX = Math.max(this.boundingBox.maxX, x);
		this.boundingBox.maxY = Math.max(this.boundingBox.maxY, y);
	}

	private async finalizeStroke(ctx: ToolContext) {
		console.log('[BrushTool] finalizeStroke called'); // Uncommented
		if (!ctx.canvasElement || !this.boundingBox || !ctx.layerManager) {
			console.log('[BrushTool] Missing dependencies', { canvas: !!ctx.canvasElement, bbox: !!this.boundingBox, lm: !!ctx.layerManager });
			return;
		}

		const canvas = ctx.canvasElement as HTMLCanvasElement;
		
		// Calculate padding in canvas intrinsic pixels
		const scaleX = canvas.width / ctx.canvasRect.width;
		const scaledBrushSize = ctx.size * scaleX;
		
		// Include blur radius in padding calculation to avoid clipping
		// We add a safety margin (e.g. 2x radius) because blur bell curve extends far
		const extraBlurPadding = this.currentBlurRadius * 2;
		const padding = Math.ceil(scaledBrushSize / 2 + extraBlurPadding) + 2;

		// Bounds are already in canvas intrinsic coordinates
		const bounds = {
			x: Math.max(0, Math.floor(this.boundingBox.minX - padding)),
			y: Math.max(0, Math.floor(this.boundingBox.minY - padding)),
			width: Math.ceil(this.boundingBox.maxX - this.boundingBox.minX + padding * 2),
			height: Math.ceil(this.boundingBox.maxY - this.boundingBox.minY + padding * 2)
		};
		
		/*console.log('[BrushTool] Finalize Bounds:', {
			rawBBox: this.boundingBox,
			padding,
			calculatedBounds: bounds,
			canvasWidth: canvas.width
		});*/

		// Clip bounds to canvas size
		bounds.width = Math.min(bounds.width, canvas.width - bounds.x);
		bounds.height = Math.min(bounds.height, canvas.height - bounds.y);

		// Validate bounds
		if (bounds.width <= 0 || bounds.height <= 0) {
			console.log('[BrushTool] Invalid bounds', bounds);
			return;
		}

		// Extract ImageData from the canvas
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = bounds.width;
		tempCanvas.height = bounds.height;
		
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) return;

		tempCtx.drawImage(
			canvas,
			bounds.x,
			bounds.y,
			bounds.width,
			bounds.height,
			0,
			0,
			bounds.width,
			bounds.height
		);

		// Delay clearing the original drawing canvas until AFTER the merge is complete
		// This prevents "flicker" where the stroke disappears before the layer updates
		
		// Convert temp canvas to Blob and handle layer persistence
		const targetLayerId = this.targetLayerId;
		const mainCtx = canvas.getContext('2d');
		
		tempCanvas.toBlob(async (blob) => {
			// console.log('[BrushTool] generated blob:', blob ? blob.size : 'null');
			if (!blob || !ctx.layerManager) {
				console.error('[BrushTool] Failed to generate blob or missing layerManager');
				return;
			}

			// If we have a target layer, merge onto it
			if (targetLayerId) {
				// console.log('[BrushTool] Merging to target layer:', targetLayerId);
				// Capture undo snapshot BEFORE modifying
				if (ctx.undoManager) {
					const beforeSnapshot = ctx.undoManager.captureSnapshot(targetLayerId);
					if (beforeSnapshot) {
						// We'll push to undo after merge is complete with afterSnapshot
						await ctx.layerManager.mergeDrawingToLayer(targetLayerId, blob, bounds);
						
						const afterSnapshot = ctx.undoManager.captureSnapshot(targetLayerId);
						ctx.undoManager.push({
							type: 'layer-modify',
							layerId: targetLayerId,
							beforeSnapshot,
							afterSnapshot: afterSnapshot || undefined
						});
					} else {
						// Layer might have been deleted, just merge
						await ctx.layerManager.mergeDrawingToLayer(targetLayerId, blob, bounds);
					}
				} else {
					await ctx.layerManager.mergeDrawingToLayer(targetLayerId, blob, bounds);
				}
				ctx.historyManager?.addLocalEntry('draw', 'stroke-merged');
			} else {
				// Create a new drawing layer
				const newLayerId = ctx.layerManager.createDrawingLayer(blob, bounds);
				
				// Capture undo snapshot for layer-add
				if (ctx.undoManager) {
					const afterSnapshot = ctx.undoManager.captureSnapshot(newLayerId);
					ctx.undoManager.push({
						type: 'layer-add',
						layerId: newLayerId,
						afterSnapshot: afterSnapshot || undefined
					});
				}
				ctx.historyManager?.addLocalEntry('draw', 'new-layer');
			}

			// Clear the drawing canvas ONLY after the layer has been updated
			mainCtx?.clearRect(0, 0, canvas.width, canvas.height);
		}, 'image/png');
	}
}

export function createBrushTool() {
	return new BrushTool();
}


