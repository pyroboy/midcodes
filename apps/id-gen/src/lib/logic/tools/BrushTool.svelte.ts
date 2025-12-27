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
	private lastPoint: { x: number; y: number } | null = null;
	private boundingBox: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null = null;

	// Track the layer ID we're drawing on for this stroke
	private targetLayerId: string | null = null;

	onActivate(ctx: ToolContext): void {
		// Pick up selected layer if one exists
		if (ctx.selectedLayerId && ctx.selectedLayerId !== 'original-file') {
			this.targetLayerId = ctx.selectedLayerId;
		}
	}

	onDeactivate(): void {
		this.isDrawing = false;
		this.context = null;
		this.lastPoint = null;
		this.boundingBox = null;
		this.targetLayerId = null;
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		if (!ctx.canvasContext) return; // Must have drawing context

		this.isDrawing = true;
		this.context = ctx.canvasContext;
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';
		this.context.strokeStyle = ctx.color;
		
		// Scale brush size from CSS pixels to canvas intrinsic pixels
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		this.context.lineWidth = ctx.size * scaleX;
		this.context.globalAlpha = ctx.opacity / 100;

		const point = this.getPoint(e, ctx.canvasRect, ctx.canvasDimensions);
		this.lastPoint = point;

		// Initialize bounding box
		this.boundingBox = {
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		};

		// Start the path
		this.context.beginPath();
		this.context.moveTo(point.x, point.y);
		// Draw a dot in case it's just a click
		this.context.lineTo(point.x + 0.1, point.y + 0.1);
		this.context.stroke();

		// Use currently selected layer (any type) - capture at pointer down
		if (ctx.selectedLayerId && ctx.selectedLayerId !== 'original-file') {
			this.targetLayerId = ctx.selectedLayerId;
		} else {
			this.targetLayerId = null; // Will create new layer
		}
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing || !this.context || !this.lastPoint) return;

		const point = this.getPoint(e, ctx.canvasRect, ctx.canvasDimensions);

		// Update bounding box
		this.updateBoundingBox(point.x, point.y);

		// Draw line
		this.context.lineTo(point.x, point.y);
		this.context.stroke();

		this.lastPoint = point;
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing) return;
		this.isDrawing = false;

		if (this.context && this.boundingBox && ctx.layerManager) {
			this.context.closePath();
			this.finalizeStroke(ctx);
		}

		this.context = null;
		this.lastPoint = null;
		this.boundingBox = null;
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
		if (!this.boundingBox) return;
		this.boundingBox.minX = Math.min(this.boundingBox.minX, x);
		this.boundingBox.minY = Math.min(this.boundingBox.minY, y);
		this.boundingBox.maxX = Math.max(this.boundingBox.maxX, x);
		this.boundingBox.maxY = Math.max(this.boundingBox.maxY, y);
	}

	private async finalizeStroke(ctx: ToolContext) {
		if (!ctx.canvasElement || !this.boundingBox || !ctx.layerManager) return;

		const canvas = ctx.canvasElement as HTMLCanvasElement;
		
		// Calculate padding in canvas intrinsic pixels
		const scaleX = canvas.width / ctx.canvasRect.width;
		const scaledBrushSize = ctx.size * scaleX;
		const padding = Math.ceil(scaledBrushSize / 2) + 2;

		// Bounds are already in canvas intrinsic coordinates
		const bounds = {
			x: Math.max(0, Math.floor(this.boundingBox.minX - padding)),
			y: Math.max(0, Math.floor(this.boundingBox.minY - padding)),
			width: Math.ceil(this.boundingBox.maxX - this.boundingBox.minX + padding * 2),
			height: Math.ceil(this.boundingBox.maxY - this.boundingBox.minY + padding * 2)
		};

		// Clip bounds to canvas size
		bounds.width = Math.min(bounds.width, canvas.width - bounds.x);
		bounds.height = Math.min(bounds.height, canvas.height - bounds.y);

		// Validate bounds
		if (bounds.width <= 0 || bounds.height <= 0) return;

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
			if (!blob || !ctx.layerManager) return;

			// If we have a target layer, merge onto it
			if (targetLayerId) {
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


