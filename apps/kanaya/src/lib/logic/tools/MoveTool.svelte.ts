import {
	type CanvasTool,
	type ToolContext,
	normalizePointerEvent
} from './BaseTool';

/**
 * Move Tool Implementation
 *
 * Allows repositioning layers on the canvas by dragging.
 * Similar to Photoshop's Move Tool (V).
 *
 * Features:
 * - Click and drag to move the selected layer
 * - Updates layer bounds in real-time
 * - Supports undo/redo
 */
export class MoveTool implements CanvasTool {
	readonly name = 'move';
	readonly cursor = 'move';
	readonly requiresLayer = true;

	// State
	private isDragging = false;
	private startPoint: { x: number; y: number } | null = null;
	private originalBounds: { x: number; y: number; width: number; height: number } | null = null;
	private targetLayerId: string | null = null;

	onActivate(ctx: ToolContext): void {
		// Pick up selected layer
		if (ctx.selectedLayerId && ctx.selectedLayerId !== 'original-file') {
			this.targetLayerId = ctx.selectedLayerId;
		}
	}

	onDeactivate(): void {
		this.reset();
	}

	onPointerDown(e: PointerEvent, ctx: ToolContext): void {
		if (!ctx.selectedLayerId || ctx.selectedLayerId === 'original-file') {
			return; // Can't move original background
		}

		const layer = ctx.layerManager.currentLayers.find(l => l.id === ctx.selectedLayerId);
		if (!layer) return;

		this.isDragging = true;
		this.targetLayerId = ctx.selectedLayerId;
		
		// Store start position in canvas intrinsic pixels
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const scaleY = ctx.canvasDimensions.heightPixels / ctx.canvasRect.height;
		
		this.startPoint = {
			x: (e.clientX - ctx.canvasRect.left) * scaleX,
			y: (e.clientY - ctx.canvasRect.top) * scaleY
		};

		// Store original bounds for undo
		this.originalBounds = layer.bounds ? { ...layer.bounds } : { 
			x: 0, 
			y: 0, 
			width: ctx.canvasDimensions.widthPixels, 
			height: ctx.canvasDimensions.heightPixels 
		};

		// Capture undo snapshot before moving
		if (ctx.undoManager && this.targetLayerId) {
			// We'll capture the full snapshot on pointer up after move completes
		}
	}

	onPointerMove(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDragging || !this.startPoint || !this.targetLayerId || !this.originalBounds) {
			return;
		}

		const layer = ctx.layerManager.currentLayers.find(l => l.id === this.targetLayerId);
		if (!layer) return;

		// Calculate current position in canvas intrinsic pixels
		const scaleX = ctx.canvasDimensions.widthPixels / ctx.canvasRect.width;
		const scaleY = ctx.canvasDimensions.heightPixels / ctx.canvasRect.height;
		
		const currentPoint = {
			x: (e.clientX - ctx.canvasRect.left) * scaleX,
			y: (e.clientY - ctx.canvasRect.top) * scaleY
		};

		// Calculate delta
		const deltaX = currentPoint.x - this.startPoint.x;
		const deltaY = currentPoint.y - this.startPoint.y;

		// Calculate new bounds
		const newBounds = {
			x: Math.round(this.originalBounds.x + deltaX),
			y: Math.round(this.originalBounds.y + deltaY),
			width: this.originalBounds.width,
			height: this.originalBounds.height
		};

		// Update layer bounds (directly mutate for real-time feedback)
		layer.bounds = newBounds;

		// Trigger reactivity
		if (layer.side === 'front') {
			ctx.layerManager.frontLayers = [...ctx.layerManager.frontLayers];
		} else {
			ctx.layerManager.backLayers = [...ctx.layerManager.backLayers];
		}

		// Update selection bounds too
		const sel = ctx.layerManager.selections.get(this.targetLayerId);
		if (sel) {
			sel.bounds = { ...newBounds };
			ctx.layerManager.selections = new Map(ctx.layerManager.selections);
		}
	}

	onPointerUp(e: PointerEvent, ctx: ToolContext): void {
		if (!this.isDragging || !this.targetLayerId) {
			this.reset();
			return;
		}

		// Capture undo entry if position changed
		if (this.originalBounds && ctx.undoManager) {
			const layer = ctx.layerManager.currentLayers.find(l => l.id === this.targetLayerId);
			if (layer && layer.bounds) {
				// Check if position actually changed
				const moved = 
					layer.bounds.x !== this.originalBounds.x ||
					layer.bounds.y !== this.originalBounds.y;

				if (moved) {
					// Push undo entry with position change
					const afterSnapshot = ctx.undoManager.captureSnapshot(this.targetLayerId);
					if (afterSnapshot) {
						// Create a before snapshot with original bounds
						const beforeSnapshot = {
							...afterSnapshot,
							bounds: { ...this.originalBounds }
						};
						
						ctx.undoManager.push({
							type: 'layer-modify',
							layerId: this.targetLayerId,
							beforeSnapshot,
							afterSnapshot
						});
					}

					ctx.layerManager.markUnsaved();
					ctx.historyManager?.addLocalEntry('move', 'layer-moved');

					// Sync static element position if layer is paired
					const pairedElementId = ctx.layerManager.getPairedElementId(this.targetLayerId);
					if (pairedElementId && layer.bounds) {
						// Fire and forget - sync position to template element
						this.syncStaticElementPosition(ctx, pairedElementId, layer.bounds);
					}
				}
			}
		}

		this.reset();
	}

	/**
	 * Sync static element position to template (fire and forget)
	 */
	private async syncStaticElementPosition(
		ctx: ToolContext,
		elementId: string,
		bounds: { x: number; y: number; width: number; height: number }
	): Promise<void> {
		try {
			// Dynamic import to avoid circular dependency
			const { syncStaticElementPosition } = await import('$lib/remote/static-element.remote');
			
			// Get template ID from the page context (passed through layerManager or toolManager)
			// For now, we'll use a simple approach - the layer manager knows about templates
			// The actual templateId should be passed through context
			const templateId = (ctx as any).templateId;
			if (!templateId) {
				console.warn('[MoveTool] No templateId in context, cannot sync static element position');
				return;
			}

			const result = await syncStaticElementPosition({ templateId, elementId, bounds });
			if (!result.success) {
				console.warn('[MoveTool] Failed to sync static element position:', result.error);
			}
		} catch (err) {
			console.error('[MoveTool] Error syncing static element position:', err);
		}
	}

	renderOverlay(ctx: CanvasRenderingContext2D): void {
		// Move tool doesn't need a custom overlay - the selection glow shows the layer
	}

	reset(): void {
		this.isDragging = false;
		this.startPoint = null;
		this.originalBounds = null;
		this.targetLayerId = null;
	}
}

export function createMoveTool(): MoveTool {
	return new MoveTool();
}
