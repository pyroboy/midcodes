import {
	type CanvasTool,
	type ToolContext,
	DrawingTool
} from './BaseTool';
import { toast } from 'svelte-sonner';

/**
 * Bucket (Flood Fill) Tool Implementation
 *
 * Click-to-fill tool that creates a new layer with the filled area.
 * If a selection is active, fills within the selection bounds.
 *
 * Requirements:
 * 1. Click to flood fill contiguous area with current color.
 * 2. Use tolerance setting to determine color matching.
 * 3. Create new layer with the filled result.
 */
export class BucketTool extends DrawingTool implements CanvasTool {
	readonly name = 'bucket';
	readonly cursor = 'crosshair';
	readonly requiresLayer = true; // Needs a layer to sample from

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// Bucket tool has no overlay
	}

	onActivate(ctx: ToolContext): void {
		// Nothing needed
	}

	onDeactivate(): void {
		// Nothing needed
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		// Bucket acts on pointer up (click)
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		// No drag behavior for bucket
	}

	async onPointerUp(e: PointerEvent, ctx: ToolContext): Promise<void> {
		if (!ctx.selectedLayerId || ctx.selectedLayerId === 'original-file') {
			toast.warning('Please select a layer to fill');
			return;
		}

		if (!ctx.layerManager) {
			console.warn('[BucketTool] No layer manager');
			return;
		}

		const rect = ctx.canvasRect;
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// Get normalized click position (0-1)
		const normX = clickX / rect.width;
		const normY = clickY / rect.height;

		// Delegate to LayerManager/ImageProcessor for actual fill
		// We need to load the layer image, perform flood fill, and create new layer
		await this.performFloodFill(ctx, normX, normY);
	}

	private async performFloodFill(ctx: ToolContext, normX: number, normY: number): Promise<void> {
		if (!ctx.layerManager || !ctx.selectedLayerId) return;

		const tolerance = ctx.tolerance ?? 32;
		const fillColor = ctx.color;
		const canvasDimensions = ctx.canvasDimensions;

		if (!canvasDimensions) {
			console.warn('[BucketTool] No canvas dimensions');
			return;
		}

		const canvasW = canvasDimensions.widthPixels;
		const canvasH = canvasDimensions.heightPixels;

		// Find the selected layer
		const layer = ctx.layerManager.currentLayers.find(
			(l: any) => l.id === ctx.selectedLayerId
		);
		if (!layer) {
			console.warn('[BucketTool] Layer not found');
			return;
		}

		// Load the layer image
		const img = await this.loadImage(layer.imageUrl);
		if (!img) return;

		// Create canvas from image
		const srcCanvas = document.createElement('canvas');
		srcCanvas.width = canvasW;
		srcCanvas.height = canvasH;
		const srcCtx = srcCanvas.getContext('2d');
		if (!srcCtx) return;

		// Draw the layer image at its bounds
		const bounds = layer.bounds ?? { x: 0, y: 0, width: canvasW, height: canvasH };
		srcCtx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);

		// Get image data
		const imageData = srcCtx.getImageData(0, 0, canvasW, canvasH);
		const data = imageData.data;

		// Calculate pixel coordinates
		const startX = Math.floor(normX * canvasW);
		const startY = Math.floor(normY * canvasH);

		if (startX < 0 || startX >= canvasW || startY < 0 || startY >= canvasH) {
			console.warn('[BucketTool] Click out of bounds');
			return;
		}

		// Get target color at click position
		const startIdx = (startY * canvasW + startX) * 4;
		const targetR = data[startIdx];
		const targetG = data[startIdx + 1];
		const targetB = data[startIdx + 2];
		const targetA = data[startIdx + 3];

		// Parse fill color
		const fillRGB = this.hexToRgb(fillColor);
		if (!fillRGB) return;

		// Flood fill algorithm (BFS)
		const visited = new Set<number>();
		const queue: [number, number][] = [[startX, startY]];
		const filledPixels: [number, number][] = [];

		while (queue.length > 0) {
			const [x, y] = queue.shift()!;
			const key = y * canvasW + x;

			if (visited.has(key)) continue;
			if (x < 0 || x >= canvasW || y < 0 || y >= canvasH) continue;

			const idx = key * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			const a = data[idx + 3];

			// Check if color matches within tolerance
			if (!this.colorMatch(r, g, b, a, targetR, targetG, targetB, targetA, tolerance)) {
				continue;
			}

			visited.add(key);
			filledPixels.push([x, y]);

			// Add neighbors
			queue.push([x + 1, y]);
			queue.push([x - 1, y]);
			queue.push([x, y + 1]);
			queue.push([x, y - 1]);
		}

		if (filledPixels.length === 0) {
			console.warn('[BucketTool] No pixels to fill');
			return;
		}

		// Create result canvas with fill
		const resultCanvas = document.createElement('canvas');
		resultCanvas.width = canvasW;
		resultCanvas.height = canvasH;
		const resultCtx = resultCanvas.getContext('2d');
		if (!resultCtx) return;

		// Clear to transparent
		resultCtx.clearRect(0, 0, canvasW, canvasH);

		// Set fill color
		resultCtx.fillStyle = fillColor;

		// Draw each filled pixel
		for (const [x, y] of filledPixels) {
			resultCtx.fillRect(x, y, 1, 1);
		}

		// Calculate bounding box of filled area
		let minX = canvasW, minY = canvasH, maxX = 0, maxY = 0;
		for (const [x, y] of filledPixels) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}

		const fillBounds = {
			x: minX,
			y: minY,
			width: maxX - minX + 1,
			height: maxY - minY + 1
		};

		// Convert to blob and create layer
		const blob = await new Promise<Blob | null>(resolve => 
			resultCanvas.toBlob(resolve, 'image/png')
		);

		if (blob) {
			const url = URL.createObjectURL(blob);
			ctx.layerManager.createDrawingLayer(blob, {
				x: 0,
				y: 0,
				width: canvasW,
				height: canvasH
			});
		}
	}

	private async loadImage(url: string): Promise<HTMLImageElement | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = () => resolve(null);
			img.src = url;
		});
	}

	private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: null;
	}

	private colorMatch(
		r1: number, g1: number, b1: number, a1: number,
		r2: number, g2: number, b2: number, a2: number,
		tolerance: number
	): boolean {
		return (
			Math.abs(r1 - r2) <= tolerance &&
			Math.abs(g1 - g2) <= tolerance &&
			Math.abs(b1 - b2) <= tolerance &&
			Math.abs(a1 - a2) <= tolerance
		);
	}
}

export function createBucketTool() {
	return new BucketTool();
}
