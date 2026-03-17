import type { LayerManager } from './LayerManager.svelte';

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
    /** * Blob data for local layers. 
     * Stored by reference (Blobs are immutable) to allow restoring blob URLs.
     */
    blob?: Blob; 
}

export type UndoActionType = 
    | 'layer-add'
    | 'layer-delete'
    | 'layer-modify'
    | 'layer-reorder';

export interface UndoEntry {
    type: UndoActionType;
    layerId: string;
    beforeSnapshot?: LayerSnapshot;
    afterSnapshot?: LayerSnapshot;
    fromIndex?: number;
    toIndex?: number;
    timestamp: number;
}

const MAX_UNDO_STACK_SIZE = 50;

/**
 * UndoManager - Optimized for memory safety and Svelte 5 reactivity.
 * Implements the Memento pattern to save/restore layer states.
 */
export class UndoManager {
    private undoStack = $state<UndoEntry[]>([]);
    private redoStack = $state<UndoEntry[]>([]);
    
    canUndo = $derived(this.undoStack.length > 0);
    canRedo = $derived(this.redoStack.length > 0);

    constructor(private layerManager: LayerManager) {}

    /**
     * Push a new undo entry. Clears redo stack.
     */
    push(entry: Omit<UndoEntry, 'timestamp'>): void {
        const fullEntry: UndoEntry = {
            ...entry,
            timestamp: Date.now()
        };

        // Add to stack
        this.undoStack = [...this.undoStack, fullEntry];
        
        // Enforce max stack size
        if (this.undoStack.length > MAX_UNDO_STACK_SIZE) {
            this.undoStack = this.undoStack.slice(this.undoStack.length - MAX_UNDO_STACK_SIZE);
            // Note: We do NOT revoke blobs here. The History Stack holds the *data*, 
            // not the active URL. Browsers GC Blobs automatically when all references drop.
        }

        // Clear redo stack (standard undo behavior)
        this.redoStack = [];

        console.log(`[UndoManager] Pushed ${entry.type} for layer ${entry.layerId}`);
    }

    /**
     * Capture a snapshot of a layer's current state.
     */
    captureSnapshot(layerId: string): LayerSnapshot | null {
        // Access via public getter or determine side dynamically
        const list = this.layerManager.activeSide === 'front' 
            ? this.layerManager.frontLayers 
            : this.layerManager.backLayers;
            
        const layer = list.find(l => l.id === layerId);
        
        if (!layer) return null;

        return {
            id: layer.id,
            imageUrl: layer.imageUrl,
            // Create shallow copy of bounds to prevent reference mutations
            bounds: layer.bounds ? { ...layer.bounds } : { x: 0, y: 0, width: 100, height: 100 },
            side: layer.side,
            name: layer.name,
            layerType: layer.layerType,
            // Optimization: No need to .slice() the blob. Blobs are immutable.
            blob: layer.cachedBlob
        };
    }

    undo(): boolean {
        if (this.undoStack.length === 0) {
            console.log('[UndoManager] Nothing to undo');
            return false;
        }

        const entry = this.undoStack[this.undoStack.length - 1];
        this.undoStack = this.undoStack.slice(0, -1);

        const success = this.applyUndo(entry);
        
        if (success) {
            this.redoStack = [...this.redoStack, entry];
        }

        return success;
    }

    redo(): boolean {
        if (this.redoStack.length === 0) {
            console.log('[UndoManager] Nothing to redo');
            return false;
        }

        const entry = this.redoStack[this.redoStack.length - 1];
        this.redoStack = this.redoStack.slice(0, -1);

        const success = this.applyRedo(entry);

        if (success) {
            this.undoStack = [...this.undoStack, entry];
        }

        return success;
    }

    private applyUndo(entry: UndoEntry): boolean {
        switch (entry.type) {
            case 'layer-modify':
                return entry.beforeSnapshot ? this.restoreLayerSnapshot(entry.beforeSnapshot) : false;

            case 'layer-add':
                // Undo "Add" = Remove the layer
                this.layerManager.removeLayer(entry.layerId);
                return true;

            case 'layer-delete':
                // Undo "Delete" = Restore the layer
                return entry.beforeSnapshot ? this.recreateLayerFromSnapshot(entry.beforeSnapshot) : false;

            case 'layer-reorder':
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

    private applyRedo(entry: UndoEntry): boolean {
        switch (entry.type) {
            case 'layer-modify':
                return entry.afterSnapshot ? this.restoreLayerSnapshot(entry.afterSnapshot) : false;

            case 'layer-add':
                // Redo "Add" = Restore the layer
                return entry.afterSnapshot ? this.recreateLayerFromSnapshot(entry.afterSnapshot) : false;

            case 'layer-delete':
                // Redo "Delete" = Remove the layer again
                this.layerManager.removeLayer(entry.layerId);
                return true;

            case 'layer-reorder':
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
     * CRITICAL: Handles Memory Leaks by revoking orphaned Blob URLs.
     */
    private restoreLayerSnapshot(snapshot: LayerSnapshot): boolean {
        const list = snapshot.side === 'front' 
            ? this.layerManager.frontLayers 
            : this.layerManager.backLayers;
        
        const layer = list.find(l => l.id === snapshot.id);
        if (!layer) {
            console.warn(`[UndoManager] Layer ${snapshot.id} not found for restore`);
            return false;
        }

        // 1. MEMORY CLEANUP: 
        // If the *current* layer has a blob URL that is different from the snapshot,
        // we must revoke it, or it will leak memory.
        if (layer.imageUrl.startsWith('blob:') && layer.imageUrl !== snapshot.imageUrl) {
            URL.revokeObjectURL(layer.imageUrl);
        }

        // 2. Prepare new state
        let imageUrl = snapshot.imageUrl;
        if (snapshot.blob && snapshot.imageUrl.startsWith('blob:')) {
            // We must generate a FRESH URL because the old one in the snapshot might have been revoked
            // or we simply want to ensure validity.
            imageUrl = URL.createObjectURL(snapshot.blob);
        }

        // 3. Update Layer State (Mutation)
        layer.imageUrl = imageUrl;
        layer.bounds = { ...snapshot.bounds };
        layer.name = snapshot.name;
        layer.cachedBlob = snapshot.blob;

        // 4. Force Reactivity on Lists (Svelte 5)
        if (snapshot.side === 'front') {
            this.layerManager.frontLayers = [...this.layerManager.frontLayers];
        } else {
            this.layerManager.backLayers = [...this.layerManager.backLayers];
        }

        // 5. Update Selection (Sync UI)
        const sel = this.layerManager.selections.get(snapshot.id);
        if (sel) {
            sel.bounds = { ...snapshot.bounds };
            sel.layerImageUrl = imageUrl;
            // Force map reactivity
            this.layerManager.selections = new Map(this.layerManager.selections);
        }

        this.layerManager.markUnsaved();
        return true;
    }

    /**
     * Recreate a layer from a snapshot (used for Undo-Delete or Redo-Add).
     */
    private recreateLayerFromSnapshot(snapshot: LayerSnapshot): boolean {
        let imageUrl = snapshot.imageUrl;
        
        // Regenerate URL from blob if needed
        if (snapshot.blob) {
            imageUrl = URL.createObjectURL(snapshot.blob);
        }

        const { layer, selection } = this.layerManager.createLayerObj(
            imageUrl,
            snapshot.name,
            snapshot.bounds,
            snapshot.side,
            this.layerManager.currentLayers.length, // Appends to top
            snapshot.blob,
            (snapshot.layerType as any) || 'decomposed'
        );

        // Restore strictly to the snapshot ID to maintain references
        layer.id = snapshot.id;
        selection.layerId = snapshot.id;

        this.layerManager.addLayer(layer, selection);
        
        // Restore specific z-index if needed? 
        // For simplicity, addLayer puts it at the end. 
        // If 'layer-reorder' events exist, they will handle position.
        
        return true;
    }

    /**
     * Clear both stacks.
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        console.log('[UndoManager] Cleared undo/redo stacks');
    }
}