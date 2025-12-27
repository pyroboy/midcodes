import {
	SelectionTool,
	normalizePointerEvent,
	distanceBetweenPoints,
	type NormalizedPoint,
	type ToolContext,
	type SelectionResult
} from './BaseTool';

/** Threshold for closing the lasso (3% of canvas dimension) */
const CLOSE_THRESHOLD = 0.03;

/**
 * Lasso selection tool for freeform polygon selection.
 * Standard pointer event flow: click to add points, click near start to close.
 *
 * Usage:
 * 1. Click (pointerDown + pointerUp in same spot) to add points
 * 2. Click near start point (within CLOSE_THRESHOLD) to close
 * 3. Selection actions popover appears when closed
 */
export class LassoTool extends SelectionTool {
	readonly name = 'lasso';
	readonly cursor = 'crosshair';

	// Svelte 5 reactive state for UI binding
	points = $state<NormalizedPoint[]>([]);
	isClosed = $state(false);
	isPopoverOpen = $state(false);

	private ctx: ToolContext | null = null;
	private pointerDownPoint: NormalizedPoint | null = null;

	onActivate(ctx: ToolContext): void {
		this.ctx = ctx;
		// Don't reset on activate - preserve state for popover interactions
	}

	onDeactivate(): void {
		this.reset();
		this.ctx = null;
	}

	/**
	 * Handle pointer down - record start point for click detection.
	 */
	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		if (this.isClosed) {
			this.reset();
		}
		this.ctx = ctx;
		this.pointerDownPoint = normalizePointerEvent(e, ctx.canvasRect);
	}



	/**
	 * Handle pointer move - for future drag support (unused in click-based lasso).
	 */
	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		// Lasso is click-based, no drag behavior currently
		// Future: could show preview line from last point to cursor
	}

	/**
	 * Handle pointer up - detect click and add point or close selection.
	 */
	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.pointerDownPoint) return;

		const upPoint = normalizePointerEvent(e, ctx.canvasRect);
		const moveDistance = distanceBetweenPoints(this.pointerDownPoint, upPoint);

		// Consider it a click if pointer didn't move much (< 1% of canvas)
		const CLICK_THRESHOLD = 0.01;
		if (moveDistance < CLICK_THRESHOLD) {
			this.handlePointAdd(upPoint);
		}

		this.pointerDownPoint = null;
	}

	/**
	 * Add a point to the lasso or close the selection.
	 */
	private handlePointAdd(point: NormalizedPoint): void {
		// If already closed and popover not open, reset and start new selection
		if (this.isClosed && !this.isPopoverOpen) {
			this.points = [point];
			this.isClosed = false;
			this.isPopoverOpen = false;
			return;
		}

		// If closed with popover open, don't add points
		if (this.isClosed) {
			return;
		}

		// Check if closing the loop (must have at least 3 points)
		if (this.points.length > 2) {
			const start = this.points[0];
			const dist = distanceBetweenPoints(point, start);

			if (dist < CLOSE_THRESHOLD) {
				this.isClosed = true;
				this.isPopoverOpen = true;
				this.notifyComplete();
				return;
			}
		}

		// Add new point
		this.points = [...this.points, point];
	}

	/**
	 * Legacy click handler for backward compatibility.
	 * @deprecated Use standard pointer events instead. This is kept for existing integrations.
	 * @returns true if click was handled by lasso tool
	 */
	handleClick(e: MouseEvent, canvasRect: DOMRect): boolean {
		const point: NormalizedPoint = {
			x: (e.clientX - canvasRect.left) / canvasRect.width,
			y: (e.clientY - canvasRect.top) / canvasRect.height
		};

		// If already closed and popover not open, reset and start new selection
		if (this.isClosed && !this.isPopoverOpen) {
			this.points = [point];
			this.isClosed = false;
			this.isPopoverOpen = false;
			return true;
		}

		// If closed with popover open, don't add points
		if (this.isClosed) {
			return false;
		}

		// Check if closing the loop (must have at least 3 points)
		if (this.points.length > 2) {
			const start = this.points[0];
			const dist = distanceBetweenPoints(point, start);

			if (dist < CLOSE_THRESHOLD) {
				this.isClosed = true;
				this.isPopoverOpen = true;
				this.notifyComplete();
				return true;
			}
		}

		// Add new point
		this.points = [...this.points, point];
		return true;
	}

	/**
	 * Complete the selection and trigger callback.
	 */
	private notifyComplete(): void {
		if (!this.onComplete || !this.ctx) return;

		const { widthPixels, heightPixels } = this.ctx.canvasDimensions;
		const bounds = this.calculateBounds(widthPixels, heightPixels);

		const result: SelectionResult = {
			points: this.getPoints(),
			bounds,
			type: 'lasso'
		};

		this.onComplete(result);
	}

	/**
	 * Confirm selection and execute copy action.
	 * Called from SelectionActions popover.
	 */
	confirmCopy(): NormalizedPoint[] {
		const points = this.getPoints();
		// Persistence: Do not reset here. Let user explicitly cancel or start new.
		return points;
	}

	/**
	 * Cancel selection and reset.
	 */
	cancel(): void {
		this.reset();
	}

	reset(): void {
		this.points = [];
		this.isClosed = false;
		this.isPopoverOpen = false;
		this.pointerDownPoint = null;
	}

	/** Get copy of current points */
	getPoints(): NormalizedPoint[] {
		return [...this.points];
	}

	/** Check if selection is closed */
	isSelectionClosed(): boolean {
		return this.isClosed;
	}

	/** Close popover without resetting selection */
	closePopover(): void {
		this.isPopoverOpen = false;
	}

	/**
	 * Render overlay is handled via Svelte template in ImagePreview.
	 * This method is a no-op since we use SVG elements for rendering.
	 */
	renderOverlay(_ctx: CanvasRenderingContext2D): void {
		// Lasso rendering is done via SVG in the Svelte template
		// This is intentionally empty
	}

	/**
	 * Generate SVG path data for the lasso polygon.
	 * Coordinates are in 0-100 range for viewBox.
	 */
	getSvgPath(): string {
		if (this.points.length === 0) return '';
		return this.points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
	}

	/**
	 * Generate SVG path for dim overlay (everything outside selection).
	 */
	getDimPath(): string {
		if (!this.isClosed || this.points.length < 3) return '';
		const poly = this.points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
		return `M0,0 H100 V100 H0 Z M${poly} Z`;
	}

	/**
	 * Get popover position (at first point).
	 */
	getPopoverPosition(): { x: number; y: number } | null {
		if (this.points.length === 0) return null;
		return {
			x: this.points[0].x * 100,
			y: this.points[0].y * 100
		};
	}
}

/**
 * Factory function to create a new LassoTool instance.
 */
export function createLassoTool(): LassoTool {
	return new LassoTool();
}
