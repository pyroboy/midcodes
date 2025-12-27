import {
	SelectionTool,
	normalizePointerEvent,
	type NormalizedPoint,
	type ToolContext,
	type SelectionResult
} from './BaseTool';

/**
 * Rectangle selection tool for click-drag rectangular selection.
 * 
 * Usage:
 * 1. Click and drag to define rectangle bounds
 * 2. Release mouse to complete selection
 * 3. Hold Shift while dragging for square constraint
 */
export class RectangleTool extends SelectionTool {
	readonly name = 'rectangle';
	readonly cursor = 'crosshair';

	// Svelte 5 reactive state
	startPoint = $state<NormalizedPoint | null>(null);
	currentPoint = $state<NormalizedPoint | null>(null);
	isClosed = $state(false);
	isPopoverOpen = $state(false);
	shiftHeld = $state(false);

	private ctx: ToolContext | null = null;
	private isDragging = false;

	onActivate(ctx: ToolContext): void {
		this.ctx = ctx;
	}

	onDeactivate(): void {
		this.reset();
		this.ctx = null;
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		if (this.isClosed) {
			// Reset if clicking after selection is complete
			this.reset();
		}

		this.ctx = ctx;
		this.startPoint = normalizePointerEvent(e, ctx.canvasRect);
		this.currentPoint = this.startPoint;
		this.isDragging = true;
		this.shiftHeld = e.shiftKey;
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDragging || !this.startPoint) return;

		this.shiftHeld = e.shiftKey;
		let point = normalizePointerEvent(e, ctx.canvasRect);

		// Apply square constraint if Shift is held
		if (this.shiftHeld) {
			point = this.constrainToSquare(this.startPoint, point);
		}

		this.currentPoint = point;
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDragging || !this.startPoint) return;

		this.shiftHeld = e.shiftKey;
		let point = normalizePointerEvent(e, ctx.canvasRect);

		if (this.shiftHeld) {
			point = this.constrainToSquare(this.startPoint, point);
		}

		this.currentPoint = point;
		this.isDragging = false;

		// Check if selection has meaningful size (at least 1% of canvas)
		const width = Math.abs(this.currentPoint.x - this.startPoint.x);
		const height = Math.abs(this.currentPoint.y - this.startPoint.y);

		if (width > 0.01 && height > 0.01) {
			this.isClosed = true;
			this.isPopoverOpen = true;
			this.notifyComplete();
		} else {
			// Selection too small, reset
			this.reset();
		}
	}

	onKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			this.reset();
		}
	}

	/**
	 * Constrain point to form a square from start point.
	 */
	private constrainToSquare(start: NormalizedPoint, current: NormalizedPoint): NormalizedPoint {
		const dx = current.x - start.x;
		const dy = current.y - start.y;
		const size = Math.max(Math.abs(dx), Math.abs(dy));

		return {
			x: start.x + Math.sign(dx) * size,
			y: start.y + Math.sign(dy) * size
		};
	}

	/**
	 * Get normalized bounding box.
	 */
	getBounds(): { x: number; y: number; width: number; height: number } | null {
		if (!this.startPoint || !this.currentPoint) return null;

		const minX = Math.min(this.startPoint.x, this.currentPoint.x);
		const minY = Math.min(this.startPoint.y, this.currentPoint.y);
		const maxX = Math.max(this.startPoint.x, this.currentPoint.x);
		const maxY = Math.max(this.startPoint.y, this.currentPoint.y);

		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		};
	}

	/**
	 * Generate polygon points for the rectangle (for clipping).
	 * Returns 4 corner points in normalized coordinates.
	 */
	getPoints(): NormalizedPoint[] {
		const bounds = this.getBounds();
		if (!bounds) return [];

		return [
			{ x: bounds.x, y: bounds.y },
			{ x: bounds.x + bounds.width, y: bounds.y },
			{ x: bounds.x + bounds.width, y: bounds.y + bounds.height },
			{ x: bounds.x, y: bounds.y + bounds.height }
		];
	}

	/**
	 * Complete the selection and trigger callback.
	 */
	private notifyComplete(): void {
		if (!this.onComplete || !this.ctx) return;

		const { widthPixels, heightPixels } = this.ctx.canvasDimensions;
		const bounds = this.getBounds();
		if (!bounds) return;

		const result: SelectionResult = {
			points: this.getPoints(),
			bounds: {
				x: Math.floor(bounds.x * widthPixels),
				y: Math.floor(bounds.y * heightPixels),
				width: Math.ceil(bounds.width * widthPixels),
				height: Math.ceil(bounds.height * heightPixels)
			},
			type: 'rectangle'
		};

		this.onComplete(result);
	}

	/**
	 * Confirm selection and return points for action.
	 */
	confirmCopy(): NormalizedPoint[] {
		const points = this.getPoints();
		// Persistence: Do not reset here.
		return points;
	}

	/**
	 * Cancel selection.
	 */
	cancel(): void {
		this.reset();
	}

	reset(): void {
		this.startPoint = null;
		this.currentPoint = null;
		this.isClosed = false;
		this.isPopoverOpen = false;
		this.isDragging = false;
		this.shiftHeld = false;
	}

	/** Close popover without resetting */
	closePopover(): void {
		this.isPopoverOpen = false;
	}

	/**
	 * Get popover position (center of selection).
	 */
	getPopoverPosition(): { x: number; y: number } | null {
		const bounds = this.getBounds();
		if (!bounds) return null;

		return {
			x: (bounds.x + bounds.width / 2) * 100,
			y: bounds.y * 100
		};
	}

	/** Lasso uses this, provide stub for interface compat */
	renderOverlay(_ctx: CanvasRenderingContext2D): void {
		// Rendering handled in Svelte component
	}
}

/**
 * Factory function to create a new RectangleTool instance.
 */
export function createRectangleTool(): RectangleTool {
	return new RectangleTool();
}
