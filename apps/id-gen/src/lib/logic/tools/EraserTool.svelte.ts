import {
	type CanvasTool,
	type ToolContext,
	normalizePointerEvent,
	DrawingTool
} from './BaseTool';
import { toast } from 'svelte-sonner';

/**
 * Eraser Tool Implementation
 *
 * Non-destructive eraser that works with layer masks.
 * Instead of modifying the source image, eraser strokes are rendered
 * to a mask that is applied via CSS mask-image.
 *
 * Requirements:
 * 1. Draw eraser strokes on a dedicated canvas.
 * 2. On pointer up, convert strokes to mask data and merge with layer's existing mask.
 * 3. Mask is stored as base64 data URL for CSS mask-image.
 * 4. Support size option (shared with brush).
 */
export class EraserTool extends DrawingTool implements CanvasTool {
	readonly name = 'eraser';
	readonly cursor = 'crosshair';
	readonly requiresLayer = true; // Eraser requires a selected layer

	// Runtime state
	protected isDrawing = false;
	private context: CanvasRenderingContext2D | null = null;
	private lastPoint: { x: number; y: number } | null = null;
	private targetLayerId: string | null = null;
	private existingMaskImage: HTMLImageElement | null = null;

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// Eraser renders to its own canvas, no overlay needed
	}

	onActivate(ctx: ToolContext): void {
		// Nothing unique needed on activation
	}

	onDeactivate(): void {
		this.isDrawing = false;
		this.context = null;
		this.lastPoint = null;
		this.targetLayerId = null;
		this.existingMaskImage = null;
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		// Eraser requires a selected layer (not the original background)
		if (!ctx.selectedLayerId || ctx.selectedLayerId === 'original-file') {
			toast.warning('Please select a layer to erase');
			return;
		}

		if (!ctx.canvasContext) {
			console.warn('[EraserTool] No canvas context available');
			return;
		}

		this.isDrawing = true;
		this.context = ctx.canvasContext;
		this.targetLayerId = ctx.selectedLayerId;

		// Set up context for eraser strokes
		// We draw in black (which will become transparent in the mask)
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';
		this.context.strokeStyle = '#000000';
		this.context.lineWidth = ctx.size;
		this.context.globalAlpha = 1;
		this.context.globalCompositeOperation = 'source-over';

		// Load existing mask if any
		this.loadExistingMask(ctx);

		const point = this.getPoint(e, ctx.canvasRect);
		this.lastPoint = point;

		// Start the path
		this.context.beginPath();
		this.context.moveTo(point.x, point.y);
		// Draw a dot in case it's just a click
		this.context.lineTo(point.x + 0.1, point.y + 0.1);
		this.context.stroke();
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing || !this.context || !this.lastPoint) return;

		const point = this.getPoint(e, ctx.canvasRect);

		// Draw eraser stroke
		this.context.lineTo(point.x, point.y);
		this.context.stroke();

		this.lastPoint = point;
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing) return;
		this.isDrawing = false;

		if (this.context && this.targetLayerId && ctx.layerManager) {
			this.context.closePath();
			this.finalizeMask(ctx);
		}

		this.context = null;
		this.lastPoint = null;
		this.targetLayerId = null;
		this.existingMaskImage = null;
	}

	private getPoint(e: PointerEvent, rect: DOMRect) {
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	/**
	 * Load existing mask for the layer and draw it to the canvas.
	 * This way new eraser strokes are merged with existing mask.
	 */
	private loadExistingMask(ctx: ToolContext): void {
		if (!this.targetLayerId || !ctx.layerManager) return;

		const existingMask = ctx.layerManager.getMask(this.targetLayerId);
		if (existingMask && existingMask.maskData && this.context && ctx.canvasElement) {
			const canvas = ctx.canvasElement as HTMLCanvasElement;
			
			// Load the existing mask image
			const img = new Image();
			img.onload = () => {
				if (this.context) {
					// Draw existing mask first (it's already inverted - black = transparent)
					// We need to invert when drawing so black areas stay black
					this.context.globalCompositeOperation = 'source-over';
					this.context.drawImage(img, 0, 0, canvas.width, canvas.height);
				}
			};
			img.src = existingMask.maskData;
			this.existingMaskImage = img;
		}
	}

	/**
	 * Finalize the eraser stroke by converting canvas content to mask data
	 * and updating the layer's mask in LayerManager.
	 */
	private finalizeMask(ctx: ToolContext): void {
		if (!ctx.canvasElement || !this.targetLayerId || !ctx.layerManager) return;

		const canvas = ctx.canvasElement as HTMLCanvasElement;
		const maskCtx = canvas.getContext('2d');
		if (!maskCtx) return;

		// Create the final mask canvas
		// In CSS mask-image: white = visible, black = transparent
		// Our eraser strokes are black on transparent
		// We need to create: white background, then apply eraser strokes as black
		
		const finalMaskCanvas = document.createElement('canvas');
		finalMaskCanvas.width = canvas.width;
		finalMaskCanvas.height = canvas.height;
		const finalCtx = finalMaskCanvas.getContext('2d');
		if (!finalCtx) return;

		// Start with white (fully visible)
		finalCtx.fillStyle = '#ffffff';
		finalCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);

		// Apply eraser strokes (black areas from our canvas)
		// Use destination-out to cut holes where we've drawn
		finalCtx.globalCompositeOperation = 'destination-out';
		finalCtx.drawImage(canvas, 0, 0);

		// Convert to data URL
		const maskData = finalMaskCanvas.toDataURL('image/png');

		// Calculate bounds (for now, full canvas)
		const bounds = {
			x: 0,
			y: 0,
			width: canvas.width,
			height: canvas.height
		};

		// Update mask in LayerManager
		ctx.layerManager.setMask(this.targetLayerId, maskData, bounds);
		ctx.historyManager.addLocalEntry('erase', this.targetLayerId);

		// Clear the drawing canvas for next stroke
		maskCtx.clearRect(0, 0, canvas.width, canvas.height);
	}
}

export function createEraserTool() {
	return new EraserTool();
}
