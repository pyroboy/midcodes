import type { LayerManager } from '../LayerManager.svelte';
import type { ToolManager } from '../ToolManager.svelte';
import type { ImageProcessor } from '../ImageProcessor.svelte';
import type { HistoryManager } from '../HistoryManager.svelte';
import type { UndoManager } from '../UndoManager.svelte';

/**
 * Context passed to tools during pointer events and rendering.
 * Provides access to canvas dimensions, selected layer, and manager instances.
 */
export interface ToolContext {
	/** Bounding rectangle of the canvas element */
	canvasRect: DOMRect;
	/** ID of currently selected layer, or null if none */
	selectedLayerId: string | null;
	/** Reference to LayerManager for layer operations */
	layerManager: LayerManager;
	/** Reference to ToolManager for tool state */
	toolManager: ToolManager;
	/** Reference to ImageProcessor for heavy operations */
	imageProcessor: ImageProcessor;
	/** Reference to HistoryManager for tracking actions */
	historyManager: HistoryManager;
	/** Current drawing color (hex) */
	color: string;
	/** Current brush/eraser size in pixels */
	size: number;
	/** Current opacity (0-100) */
	opacity: number;
	/** Current hardness (0-100, 0 = soft/feathered, 100 = hard edge) */
	hardness: number;
	/** Canvas dimensions */
	canvasDimensions: {
		widthPixels: number;
		heightPixels: number;
	};
	/** Optional drawing canvas element (for drawing tools) */
	canvasElement?: HTMLCanvasElement | HTMLElement;
	/** Optional drawing context (for drawing tools) */
	canvasContext?: CanvasRenderingContext2D;
	/** Flood fill tolerance */
	tolerance?: number;
	/** Reference to UndoManager for undo/redo operations */
	undoManager?: UndoManager;
	/** Template ID for syncing static elements */
	templateId?: string;
}

/**
 * Normalized point coordinates (0-1 range relative to canvas).
 */
export interface NormalizedPoint {
	x: number;
	y: number;
}

/**
 * Tool options that vary by tool type.
 */
export interface ToolOptions {
	/** Brush/eraser size in pixels */
	size: number;
	/** Drawing opacity (0-100) */
	opacity: number;
	/** Current color (hex) */
	color: string;
	/** Brush hardness (0-100, 0 = soft/feathered, 100 = hard edge) */
	hardness: number;
	/** Flood fill tolerance (for bucket tool) */
	tolerance?: number;
}

/**
 * Result from a completed selection operation.
 */
export interface SelectionResult {
	/** Normalized points defining the selection boundary */
	points: NormalizedPoint[];
	/** Bounding box in pixel coordinates */
	bounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	/** Type of selection (lasso, rectangle, ellipse) */
	type: 'lasso' | 'rectangle' | 'ellipse';
}

/**
 * Base interface all canvas tools must implement.
 * Tools handle pointer events and can render overlays.
 */
export interface CanvasTool {
	/** Unique tool identifier */
	readonly name: string;
	/** CSS cursor style when tool is active */
	readonly cursor: string;
	/** Whether tool requires a layer to be selected */
	readonly requiresLayer: boolean;

	/**
	 * Called when tool becomes active.
	 * Use for initialization and setup.
	 */
	onActivate(ctx: ToolContext): void;

	/**
	 * Called when switching away from this tool.
	 * Use for cleanup.
	 */
	onDeactivate(): void;

	/**
	 * Handle pointer down event.
	 * @param e - The pointer event
	 * @param ctx - Tool context with canvas info
	 */
	onPointerDown(e: PointerEvent, ctx: ToolContext): void;

	/**
	 * Handle pointer move event.
	 * @param e - The pointer event
	 * @param ctx - Tool context with canvas info
	 */
	onPointerMove(e: PointerEvent, ctx: ToolContext): void;

	/**
	 * Handle pointer up event.
	 * @param e - The pointer event
	 * @param ctx - Tool context with canvas info
	 */
	onPointerUp(e: PointerEvent, ctx: ToolContext): void;

	/**
	 * Optional keyboard event handler.
	 * @param e - The keyboard event
	 */
	onKeyDown?(e: KeyboardEvent): void;

	/**
	 * Optional overlay renderer for tools with visual feedback.
	 * Called each frame when tool is active.
	 * @param ctx - 2D canvas rendering context
	 */
	renderOverlay?(ctx: CanvasRenderingContext2D): void;

	/**
	 * Reset tool to initial state.
	 * Called on Escape key or explicit reset.
	 */
	reset(): void;
}

/**
 * Abstract base class for selection tools (lasso, rectangle, ellipse).
 * Provides common selection state and completion callback handling.
 *
 * NOTE: Child classes should define their own reactive state using $state()
 * for properties like points, isActive, isClosed. We don't declare them here
 * to avoid conflicts with Svelte 5's $state reactivity system.
 */
export abstract class SelectionTool implements CanvasTool {
	abstract readonly name: string;
	abstract readonly cursor: string;
	readonly requiresLayer = false;

	// NOTE: points, isActive, isClosed are managed by child classes with $state()
	// Do NOT declare them here as it interferes with Svelte 5 reactivity

	/** Callback when selection is completed */
	onComplete?: (result: SelectionResult) => void;

	abstract onActivate(ctx: ToolContext): void;
	abstract onDeactivate(): void;
	abstract onPointerDown(e: PointerEvent, ctx: ToolContext): void;
	abstract onPointerMove(e: PointerEvent, ctx: ToolContext): void;
	abstract onPointerUp(e: PointerEvent, ctx: ToolContext): void;
	abstract renderOverlay?(ctx: CanvasRenderingContext2D): void;

	// These methods must be implemented by child classes since they manage their own $state
	abstract reset(): void;
	abstract getPoints(): NormalizedPoint[];
	abstract isSelectionClosed(): boolean;

	/**
	 * Calculate bounding box from selection points.
	 * Child classes should call this with their points array.
	 */
	protected calculateBoundsFromPoints(
		points: NormalizedPoint[],
		widthPixels: number,
		heightPixels: number
	) {
		if (points.length === 0) {
			return { x: 0, y: 0, width: 0, height: 0 };
		}

		const xs = points.map((p) => p.x * widthPixels);
		const ys = points.map((p) => p.y * heightPixels);

		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		return {
			x: Math.floor(minX),
			y: Math.floor(minY),
			width: Math.ceil(maxX - minX),
			height: Math.ceil(maxY - minY)
		};
	}
}

/**
 * Abstract base class for drawing tools (brush, eraser).
 * Provides common stroke handling.
 */
export abstract class DrawingTool implements CanvasTool {
	abstract readonly name: string;
	abstract readonly cursor: string;
	abstract readonly requiresLayer: boolean;

	protected isDrawing = false;
	protected currentStroke: NormalizedPoint[] = [];

	/** Callback when stroke is completed */
	onStrokeComplete?: (points: NormalizedPoint[]) => void;

	abstract onActivate(ctx: ToolContext): void;
	abstract onDeactivate(): void;
	abstract onPointerDown(e: PointerEvent, ctx: ToolContext): void;
	abstract onPointerMove(e: PointerEvent, ctx: ToolContext): void;
	abstract onPointerUp(e: PointerEvent, ctx: ToolContext): void;

	/**
	 * Optional overlay renderer for tools with visual feedback.
	 * Called each frame when tool is active.
	 * @param ctx - 2D canvas rendering context
	 */
	renderOverlay?(ctx: CanvasRenderingContext2D): void;

	reset(): void {
		this.isDrawing = false;
		this.currentStroke = [];
	}
}

/**
 * Helper to convert pointer event to normalized coordinates (0-1).
 */
export function normalizePointerEvent(e: PointerEvent, rect: DOMRect): NormalizedPoint {
	return {
		x: (e.clientX - rect.left) / rect.width,
		y: (e.clientY - rect.top) / rect.height
	};
}

/**
 * Calculate distance between two normalized points.
 */
export function distanceBetweenPoints(a: NormalizedPoint, b: NormalizedPoint): number {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
