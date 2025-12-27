import {
	type CanvasTool,
	type ToolContext,
	DrawingTool
} from './BaseTool';

/**
 * Gradient Tool Implementation
 *
 * Click-drag tool that creates a gradient fill layer.
 * Gradient goes from current color to transparent.
 *
 * Requirements:
 * 1. Click to set start point, drag to set end point.
 * 2. Create linear gradient from start to end.
 * 3. Gradient: current color (100% opacity) → transparent.
 * 4. Create new layer with the gradient result.
 */
export class GradientTool extends DrawingTool implements CanvasTool {
	readonly name = 'gradient';
	readonly cursor = 'crosshair';
	readonly requiresLayer = false;

	// Runtime state
	protected isDrawing = false;
	private startPoint: { x: number; y: number } | null = null;
	private endPoint: { x: number; y: number } | null = null;
	private previewContext: CanvasRenderingContext2D | null = null;

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// Could show gradient preview here if we wire it up
		if (this.startPoint && this.endPoint) {
			// Draw preview line
			ctx.save();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(this.startPoint.x, this.startPoint.y);
			ctx.lineTo(this.endPoint.x, this.endPoint.y);
			ctx.stroke();
			ctx.restore();
		}
	}

	onActivate(ctx: ToolContext): void {
		this.reset();
	}

	onDeactivate(): void {
		this.reset();
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		this.isDrawing = true;
		const rect = ctx.canvasRect;
		this.startPoint = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
		this.endPoint = { ...this.startPoint };
		this.previewContext = ctx.canvasContext ?? null;

		// Draw initial preview
		this.updatePreview(ctx);
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDrawing || !this.startPoint) return;

		const rect = ctx.canvasRect;
		this.endPoint = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};

		// Update preview
		this.updatePreview(ctx);
	}

	async onPointerUp(e: PointerEvent, ctx: ToolContext): Promise<void> {
		if (!this.isDrawing) return;
		this.isDrawing = false;

		if (!this.startPoint || !this.endPoint) {
			this.reset();
			return;
		}

		// Clear preview
		if (this.previewContext && ctx.canvasElement) {
			const canvas = ctx.canvasElement as HTMLCanvasElement;
			this.previewContext.clearRect(0, 0, canvas.width, canvas.height);
		}

		// Create final gradient layer
		await this.createGradientLayer(ctx);
		this.reset();
	}

	private updatePreview(ctx: ToolContext): void {
		if (!this.previewContext || !ctx.canvasElement || !this.startPoint || !this.endPoint) return;

		const canvas = ctx.canvasElement as HTMLCanvasElement;
		const pCtx = this.previewContext;

		// Clear previous preview
		pCtx.clearRect(0, 0, canvas.width, canvas.height);

		// Scale points to canvas resolution
		const scaleX = canvas.width / ctx.canvasRect.width;
		const scaleY = canvas.height / ctx.canvasRect.height;

		const sx = this.startPoint.x * scaleX;
		const sy = this.startPoint.y * scaleY;
		const ex = this.endPoint.x * scaleX;
		const ey = this.endPoint.y * scaleY;

		// Create gradient
		const gradient = pCtx.createLinearGradient(sx, sy, ex, ey);
		gradient.addColorStop(0, ctx.color);
		gradient.addColorStop(1, 'rgba(0,0,0,0)');

		pCtx.fillStyle = gradient;
		pCtx.fillRect(0, 0, canvas.width, canvas.height);
	}

	private async createGradientLayer(ctx: ToolContext): Promise<void> {
		if (!ctx.layerManager || !this.startPoint || !this.endPoint) return;

		const canvasDimensions = ctx.canvasDimensions;
		if (!canvasDimensions) return;

		const canvasW = canvasDimensions.widthPixels;
		const canvasH = canvasDimensions.heightPixels;

		// Create final gradient canvas
		const gradientCanvas = document.createElement('canvas');
		gradientCanvas.width = canvasW;
		gradientCanvas.height = canvasH;
		const gCtx = gradientCanvas.getContext('2d');
		if (!gCtx) return;

		// Scale points from screen space to canvas space
		const scaleX = canvasW / ctx.canvasRect.width;
		const scaleY = canvasH / ctx.canvasRect.height;

		const sx = this.startPoint.x * scaleX;
		const sy = this.startPoint.y * scaleY;
		const ex = this.endPoint.x * scaleX;
		const ey = this.endPoint.y * scaleY;

		// Create gradient
		const gradient = gCtx.createLinearGradient(sx, sy, ex, ey);
		gradient.addColorStop(0, ctx.color);
		gradient.addColorStop(1, 'rgba(0,0,0,0)');

		gCtx.fillStyle = gradient;
		gCtx.fillRect(0, 0, canvasW, canvasH);

		// Convert to blob and create layer
		const blob = await new Promise<Blob | null>(resolve =>
			gradientCanvas.toBlob(resolve, 'image/png')
		);

		if (blob) {
			ctx.layerManager.createDrawingLayer(blob, {
				x: 0,
				y: 0,
				width: canvasW,
				height: canvasH
			});
		}
	}

	public reset(): void {
		this.isDrawing = false;
		this.startPoint = null;
		this.endPoint = null;
		this.previewContext = null;
	}
}

export function createGradientTool() {
	return new GradientTool();
}
