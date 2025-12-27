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
 * 2. On pointer up, snapshot the drawing and create a new layer.
 * 3. Support size and opacity options.
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

	onActivate(ctx: ToolContext): void {
		// Nothing unique needed on activation
	}

	onDeactivate(): void {
		this.isDrawing = false;
		this.context = null;
		this.lastPoint = null;
		this.boundingBox = null;
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
		// Add padding for stroke width (approximate, using max possible brush size / 2)
		const padding = 50; 
		this.boundingBox.minX = Math.min(this.boundingBox.minX, x);
		this.boundingBox.minY = Math.min(this.boundingBox.minY, y);
		this.boundingBox.maxX = Math.max(this.boundingBox.maxX, x);
		this.boundingBox.maxY = Math.max(this.boundingBox.maxY, y);
	}

	private async finalizeStroke(ctx: ToolContext) {
		if (!ctx.canvasElement || !this.boundingBox || !ctx.layerManager) return;

		// 1. Calculate tight bounds (with padding for stroke width)
		// We use the actual tool size for padding
		const padding = Math.ceil(ctx.size / 2) + 2; 

		const bounds = {
			x: Math.max(0, Math.floor(this.boundingBox.minX - padding)),
			y: Math.max(0, Math.floor(this.boundingBox.minY - padding)),
			width: Math.ceil(this.boundingBox.maxX - this.boundingBox.minX + padding * 2),
			height: Math.ceil(this.boundingBox.maxY - this.boundingBox.minY + padding * 2)
		};

		// Clip bounds to canvas size
		if (ctx.canvasDimensions) {
			bounds.x = Math.max(0, bounds.x);
			bounds.y = Math.max(0, bounds.y);
			// We iterate scaled pixels on screen, but we need to map to intrinsic pixels 
			// Wait, the canvas logic in DrawingCanvas should match the display size perfectly?
			// The DrawingCanvas will have width/height attributes set to `widthPixels` and `heightPixels`.
			// The CSS size is constrained by aspect-ratio.
			// However, `e.clientX` logic maps to CSS pixels.
			// We need to coordinate scaling.
			// Let's assume DrawingCanvas handles the scale transform or is sized 1:1 with CSS.
			// Implementation Detail: Helper `DrawingCanvas` should handle coordinate mapping.
			// Ideally, we interpret the coordinates as-is if the canvas is scaled via CSS but internal resolution is high.
		}

		// BUT, if we extract directly from the canvas element, we get the resolution of the canvas.
		// If the canvas.width != rect.width, we have a scale factor.
		
		const canvas = ctx.canvasElement as HTMLCanvasElement;
		const scaleX = canvas.width / ctx.canvasRect.width;
		const scaleY = canvas.height / ctx.canvasRect.height;

		const mappedBounds = {
			x: Math.floor(bounds.x * scaleX),
			y: Math.floor(bounds.y * scaleY),
			width: Math.ceil(bounds.width * scaleX),
			height: Math.ceil(bounds.height * scaleY)
		};

		// 2. Extract ImageData from the canvas
		// We can create a temp canvas to crop specifically this area
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = mappedBounds.width;
		tempCanvas.height = mappedBounds.height;
		
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) return;

		tempCtx.drawImage(
			canvas,
			mappedBounds.x,
			mappedBounds.y,
			mappedBounds.width,
			mappedBounds.height,
			0,
			0,
			mappedBounds.width,
			mappedBounds.height
		);

		// 3. Clear the original drawing canvas immediately
		// The user expects the stroke to "become" a layer.
		const mainCtx = canvas.getContext('2d');
		mainCtx?.clearRect(0, 0, canvas.width, canvas.height);

		// 4. Convert temp canvas to Blob
		tempCanvas.toBlob((blob) => {
			if (blob && ctx.layerManager) {
				// 5. Add to layer manager
				// We need to map the bounds back to the "asset" coordinate space (which is what the canvas internal resolution should be)
				// `mappedBounds` is exactly that if canvas.width == asset.width.
				
				// Warning: mappedBounds might have 0 width/height if just a dot that got rounded down?
				if (mappedBounds.width <= 0 || mappedBounds.height <= 0) return;

				ctx.layerManager.createDrawingLayer(blob, mappedBounds);
				ctx.historyManager.addLocalEntry('draw', 'new-layer');
			}
		}, 'image/png');
	}
}

export function createBrushTool() {
	return new BrushTool();
}
