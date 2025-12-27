import {
	SelectionTool,
	normalizePointerEvent,
	type NormalizedPoint,
	type ToolContext,
	type SelectionResult
} from './BaseTool';

/** Number of points to approximate ellipse as polygon */
const ELLIPSE_SEGMENTS = 36;

/**
 * Ellipse selection tool for click-drag elliptical selection.
 * 
 * Usage:
 * 1. Click and drag to define ellipse bounding box
 * 2. Release mouse to complete selection
 * 3. Hold Shift while dragging for circle constraint
 */
export class EllipseTool extends SelectionTool {
	readonly name = 'ellipse';
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

		if (this.shiftHeld) {
			point = this.constrainToCircle(this.startPoint, point);
		}

		this.currentPoint = point;
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDragging || !this.startPoint) return;

		this.shiftHeld = e.shiftKey;
		let point = normalizePointerEvent(e, ctx.canvasRect);

		if (this.shiftHeld) {
			point = this.constrainToCircle(this.startPoint, point);
		}

		this.currentPoint = point;
		this.isDragging = false;

		// Check if selection has meaningful size
		const width = Math.abs(this.currentPoint.x - this.startPoint.x);
		const height = Math.abs(this.currentPoint.y - this.startPoint.y);

		if (width > 0.01 && height > 0.01) {
			this.isClosed = true;
			this.isPopoverOpen = true;
			this.notifyComplete();
		} else {
			this.reset();
		}
	}

	onKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			this.reset();
		}
	}

	/**
	 * Constrain point to form a circle from start point.
	 */
	private constrainToCircle(start: NormalizedPoint, current: NormalizedPoint): NormalizedPoint {
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
	 * Get ellipse center and radii in normalized coordinates.
	 */
	getEllipseParams(): { cx: number; cy: number; rx: number; ry: number } | null {
		const bounds = this.getBounds();
		if (!bounds) return null;

		return {
			cx: bounds.x + bounds.width / 2,
			cy: bounds.y + bounds.height / 2,
			rx: bounds.width / 2,
			ry: bounds.height / 2
		};
	}

	/**
	 * Generate polygon points approximating the ellipse (for clipping).
	 */
	getPoints(): NormalizedPoint[] {
		const params = this.getEllipseParams();
		if (!params) return [];

		const points: NormalizedPoint[] = [];
		for (let i = 0; i < ELLIPSE_SEGMENTS; i++) {
			const angle = (2 * Math.PI * i) / ELLIPSE_SEGMENTS;
			points.push({
				x: params.cx + params.rx * Math.cos(angle),
				y: params.cy + params.ry * Math.sin(angle)
			});
		}
		return points;
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
			type: 'ellipse'
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

	/** Check if selection is closed/complete */
	isSelectionClosed(): boolean {
		return this.isClosed;
	}

	/**
	 * Get popover position (top center of ellipse).
	 */
	getPopoverPosition(): { x: number; y: number } | null {
		const bounds = this.getBounds();
		if (!bounds) return null;

		return {
			x: (bounds.x + bounds.width / 2) * 100,
			y: bounds.y * 100
		};
	}

	renderOverlay(_ctx: CanvasRenderingContext2D): void {
		// Rendering handled in Svelte component
	}
}

/**
 * Factory function to create a new EllipseTool instance.
 */
export function createEllipseTool(): EllipseTool {
	return new EllipseTool();
}
