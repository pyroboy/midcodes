import type { LayerManager } from './LayerManager.svelte';
import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

/**
 * Snapshot of a layer's state for undo/redo.
 */
export interface LayerSnapshot {
	id: string;
	imageUrl: string;
	bounds: { x: number; y: number; width: number; height: number };
	side: 'front' | 'back';
	name: string;
	layerType?: string;
	/** Blob data for local layers (needed to restore blob URLs) */
	blob?: Blob;
}

/**
 * Types of undoable actions.
 */
export type UndoActionType = 
	| 'layer-add'
	| 'layer-delete'
	| 'layer-modify'
	| 'layer-reorder';

/**
 * Entry in the undo/redo stack.
 */
export interface UndoEntry {
	type: UndoActionType;
	/** Layer ID affected */
	layerId: string;
	/** Snapshot of layer state BEFORE the action */
	beforeSnapshot?: LayerSnapshot;
	/** Snapshot of layer state AFTER the action (for redo) */
	afterSnapshot?: LayerSnapshot;
	/** For reorder: original index */
	fromIndex?: number;
	/** For reorder: new index */
	toIndex?: number;
	/** Timestamp */
	timestamp: number;
}

const MAX_UNDO_STACK_SIZE = 50;

/**
 * UndoManager - Local undo/redo stack for layer operations.
 * 
 * Uses snapshot-based undo where each action captures the layer state
 * before modification.
 */
export class UndoManager {
	private undoStack = $state<UndoEntry[]>([]);
	private redoStack = $state<UndoEntry[]>([]);
	
	/** Whether undo is available */
	canUndo = $derived(this.undoStack.length > 0);
	/** Whether redo is available */
	canRedo = $derived(this.redoStack.length > 0);
	/** Number of undo entries */
	undoCount = $derived(this.undoStack.length);
	/** Number of redo entries */
	redoCount = $derived(this.redoStack.length);

	constructor(private layerManager: LayerManager) {}

	/**
	 * Push a new undo entry. Clears redo stack.
	 */
	push(entry: Omit<UndoEntry, 'timestamp'>): void {
		const fullEntry: UndoEntry = {
			...entry,
			timestamp: Date.now()
		};

		this.undoStack = [...this.undoStack, fullEntry];
		
		// Enforce max stack size
		if (this.undoStack.length > MAX_UNDO_STACK_SIZE) {
			// Remove oldest entries (from the front)
			const excess = this.undoStack.length - MAX_UNDO_STACK_SIZE;
			// Clean up blob URLs from removed entries
			for (let i = 0; i < excess; i++) {
				this.cleanupEntry(this.undoStack[i]);
			}
			this.undoStack = this.undoStack.slice(excess);
		}

		// Clear redo stack when new action is performed
		this.redoStack.forEach(entry => this.cleanupEntry(entry));
		this.redoStack = [];

		console.log(`[UndoManager] Pushed ${entry.type} for layer ${entry.layerId}`);
	}

	/**
	 * Capture a snapshot of a layer's current state.
	 * Clones blob data so the snapshot is independent of future layer changes.
	 */
	captureSnapshot(layerId: string): LayerSnapshot | null {
		const layers = this.layerManager.activeSide === 'front' 
			? this.layerManager.frontLayers 
			: this.layerManager.backLayers;
		
		const layer = layers.find(l => l.id === layerId);
		if (!layer) return null;

		// Only capture blob if this is a blob URL (local layer)
		// For remote URLs, we just store the URL and don't need the blob
		let blobCopy: Blob | undefined = undefined;
		if (layer.imageUrl.startsWith('blob:') && layer.cachedBlob) {
			// Clone the blob to ensure the snapshot has its own copy
			blobCopy = layer.cachedBlob.slice(0, layer.cachedBlob.size, layer.cachedBlob.type);
		}

		return {
			id: layer.id,
			imageUrl: layer.imageUrl,
			bounds: layer.bounds ? { ...layer.bounds } : { x: 0, y: 0, width: 100, height: 100 },
			side: layer.side,
			name: layer.name,
			layerType: layer.layerType,
			blob: blobCopy
		};
	}

	/**
	 * Undo the last action.
	 */
	undo(): boolean {
		if (this.undoStack.length === 0) {
			console.log('[UndoManager] Nothing to undo');
			return false;
		}

		const entry = this.undoStack[this.undoStack.length - 1];
		this.undoStack = this.undoStack.slice(0, -1);

		const success = this.applyUndo(entry);
		
		if (success) {
			// Move to redo stack
			this.redoStack = [...this.redoStack, entry];
			console.log(`[UndoManager] Undid ${entry.type} for layer ${entry.layerId}`);
		}

		return success;
	}

	/**
	 * Redo the last undone action.
	 */
	redo(): boolean {
		if (this.redoStack.length === 0) {
			console.log('[UndoManager] Nothing to redo');
			return false;
		}

		const entry = this.redoStack[this.redoStack.length - 1];
		this.redoStack = this.redoStack.slice(0, -1);

		const success = this.applyRedo(entry);

		if (success) {
			// Move back to undo stack
			this.undoStack = [...this.undoStack, entry];
			console.log(`[UndoManager] Redid ${entry.type} for layer ${entry.layerId}`);
		}

		return success;
	}

	/**
	 * Apply an undo action - restores the state BEFORE the action.
	 */
	private applyUndo(entry: UndoEntry): boolean {
		switch (entry.type) {
			case 'layer-modify':
				// Restore the layer to its before-snapshot state
				if (entry.beforeSnapshot) {
					return this.restoreLayerSnapshot(entry.beforeSnapshot);
				}
				return false;

			case 'layer-add':
				// Undo add = remove the layer
				this.layerManager.removeLayer(entry.layerId);
				return true;

			case 'layer-delete':
				// Undo delete = re-add the layer from snapshot
				if (entry.beforeSnapshot) {
					return this.recreateLayerFromSnapshot(entry.beforeSnapshot);
				}
				return false;

			case 'layer-reorder':
				// Undo reorder = move back to original position
				if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
					this.layerManager.reorderLayer(entry.toIndex, entry.fromIndex);
					return true;
				}
				return false;

			default:
				console.warn(`[UndoManager] Unknown action type: ${entry.type}`);
				return false;
		}
	}

	/**
	 * Apply a redo action - restores the state AFTER the action.
	 */
	private applyRedo(entry: UndoEntry): boolean {
		switch (entry.type) {
			case 'layer-modify':
				// Restore to after-snapshot state
				if (entry.afterSnapshot) {
					return this.restoreLayerSnapshot(entry.afterSnapshot);
				}
				return false;

			case 'layer-add':
				// Redo add = re-add the layer
				if (entry.afterSnapshot) {
					return this.recreateLayerFromSnapshot(entry.afterSnapshot);
				}
				return false;

			case 'layer-delete':
				// Redo delete = remove the layer again
				this.layerManager.removeLayer(entry.layerId);
				return true;

			case 'layer-reorder':
				// Redo reorder = apply the reorder again
				if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
					this.layerManager.reorderLayer(entry.fromIndex, entry.toIndex);
					return true;
				}
				return false;

			default:
				return false;
		}
	}

	/**
	 * Restore a layer to a snapshot state.
	 */
	private restoreLayerSnapshot(snapshot: LayerSnapshot): boolean {
		const layers = snapshot.side === 'front' 
			? this.layerManager.frontLayers 
			: this.layerManager.backLayers;
		
		const layer = layers.find(l => l.id === snapshot.id);
		if (!layer) {
			console.warn(`[UndoManager] Layer ${snapshot.id} not found for restore`);
			return false;
		}

		// If snapshot has a blob, create a fresh blob URL
		let imageUrl = snapshot.imageUrl;
		if (snapshot.blob && snapshot.imageUrl.startsWith('blob:')) {
			// Create new blob URL for the snapshot's blob
			imageUrl = URL.createObjectURL(snapshot.blob);
		}

		// Update the layer in place
		layer.imageUrl = imageUrl;
		layer.bounds = { ...snapshot.bounds };
		layer.name = snapshot.name;
		layer.cachedBlob = snapshot.blob;

		// CRITICAL: Trigger reactivity by reassigning the layer array
		// This ensures the UI updates to reflect the restored state
		if (snapshot.side === 'front') {
			this.layerManager.frontLayers = [...this.layerManager.frontLayers];
		} else {
			this.layerManager.backLayers = [...this.layerManager.backLayers];
		}

		// Update the selection too
		const sel = this.layerManager.selections.get(snapshot.id);
		if (sel) {
			sel.bounds = { ...snapshot.bounds };
			sel.layerImageUrl = imageUrl;
			// Trigger reactivity
			this.layerManager.selections = new Map(this.layerManager.selections);
		}

		this.layerManager.markUnsaved();
		return true;
	}

	/**
	 * Recreate a layer from a snapshot (for undo delete / redo add).
	 */
	private recreateLayerFromSnapshot(snapshot: LayerSnapshot): boolean {
		// Create blob URL if we have cached blob
		let imageUrl = snapshot.imageUrl;
		if (snapshot.blob) {
			imageUrl = URL.createObjectURL(snapshot.blob);
		}

		const { layer, selection } = this.layerManager.createLayerObj(
			imageUrl,
			snapshot.name,
			snapshot.bounds,
			snapshot.side,
			this.layerManager.currentLayers.length,
			snapshot.blob,
			(snapshot.layerType as any) || 'decomposed'
		);

		// Override the ID to match the original
		layer.id = snapshot.id;
		selection.layerId = snapshot.id;

		this.layerManager.addLayer(layer, selection);
		return true;
	}

	/**
	 * Clean up blob URLs from an entry.
	 */
	private cleanupEntry(entry: UndoEntry): void {
		// We don't revoke blob URLs here as they might still be in use
		// The browser will clean them up when the page unloads
	}

	/**
	 * Clear both stacks.
	 */
	clear(): void {
		this.undoStack.forEach(entry => this.cleanupEntry(entry));
		this.redoStack.forEach(entry => this.cleanupEntry(entry));
		this.undoStack = [];
		this.redoStack = [];
		console.log('[UndoManager] Cleared undo/redo stacks');
	}
}
