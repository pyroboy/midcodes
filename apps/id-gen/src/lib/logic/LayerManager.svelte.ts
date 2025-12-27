import { saveSession, loadSession, clearSession } from '$lib/utils/decomposeSession';
import type { DecomposedLayer, LayerSelection, CachedLayer } from '$lib/schemas/decompose.schema';
import type { SelectionResult } from './tools/BaseTool';
import { uploadProcessedImage } from '$lib/remote/index.remote';
import { fileToDataUrl } from '$lib/utils/imageProcessing';
import { toast } from 'svelte-sonner';
import { getProxiedUrl } from '$lib/utils/storage';

/**
 * Mask data for non-destructive erasing.
 * Stores mask information per layer for Phase 6 eraser tool.
 */
export interface LayerMask {
	layerId: string;
	/** Base64 encoded canvas data representing the mask */
	maskData: string;
	bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Validation helper for bounds
 */
function isValidBounds(bounds: any): boolean {
	return (
		bounds &&
		typeof bounds.x === 'number' &&
		typeof bounds.y === 'number' &&
		typeof bounds.width === 'number' &&
		typeof bounds.height === 'number' &&
		bounds.width > 0 &&
		bounds.height > 0
	);
}

export class LayerManager {
	// Global State
	activeSide = $state<'front' | 'back'>('front');
	saveState = $state<'saved' | 'saving' | 'unsaved'>('saved');
	syncState = $state<'synced' | 'pending' | 'syncing'>('synced');

	// Layer Data
	frontLayers = $state<DecomposedLayer[]>([]);
	backLayers = $state<DecomposedLayer[]>([]);
	selections = $state<Map<string, LayerSelection>>(new Map());

	// Mask Data (Phase 1 requirement - non-destructive editing support)
	masks = $state<Map<string, LayerMask>>(new Map());

	// UI State
	opacity = $state<Map<string, number>>(new Map());
	expandedIds = $state<Set<string>>(new Set());
	mergeMode = $state(false);
	selectedForMerge = $state<Set<string>>(new Set());
	showOriginalLayer = $state(true);

	// Cache State (Phase 8 - full upload queue system)
	cache = $state<Map<string, CachedLayer>>(new Map());

	// Concurrency & Resource State
	private isUploading = false;
	private blobLayers = new Set<string>(); // IDs of layers with blob URLs
	
	// Optimization: Cache layer canvases for optimistic drawing (Phase 6b)
	private layerCanvasCache = new Map<string, HTMLCanvasElement>();

	// Phase 8b: Logic for Hit Testing Cache (Pixel Perfect Selection)
	// Stores the 2D context of each layer's image to allow O(1) pixel read
	private hitTestCache = new Map<string, { ctx: CanvasRenderingContext2D; width: number; height: number }>();

	// Derived: count of pending/failed uploads
	pendingUploads = $derived(
		Array.from(this.cache.values()).filter(
			(c) => c.uploadStatus === 'pending' || c.uploadStatus === 'failed'
		).length
	);

	// Selection State (Phase 3)
	currentSelection = $state<SelectionResult | null>(null);

	// Derived
	currentLayers = $derived(this.activeSide === 'front' ? this.frontLayers : this.backLayers);

	constructor(initialSide: 'front' | 'back' = 'front') {
		this.activeSide = initialSide;
	}

	setSide(side: 'front' | 'back') {
		this.activeSide = side;
	}

	// --- Resource Management ---

	private registerBlobLayer(layerId: string) {
		this.blobLayers.add(layerId);
	}

	private cleanupBlobLayer(layerId: string, imageUrl: string) {
		if (this.blobLayers.has(layerId) || imageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(imageUrl);
			this.blobLayers.delete(layerId);
		}
		// Also clean up canvas cache
		if (this.layerCanvasCache.has(layerId)) {
			this.layerCanvasCache.delete(layerId);
		}
		// Clean up hit test cache
		if (this.hitTestCache.has(layerId)) {
			this.hitTestCache.delete(layerId);
		}
	}

	// --- Core Layer Operations ---

	addLayer(layer: DecomposedLayer, selection: LayerSelection) {
		// Validation (Phase 3b)
		if (!layer.id || !layer.name || !layer.imageUrl) {
			console.error('Invalid layer data:', layer);
			toast.error('Failed to add layer: Invalid data');
			return;
		}
		if (layer.bounds && !isValidBounds(layer.bounds)) {
			console.warn('Invalid layer bounds:', layer.bounds);
			// Correct bounds if possible or fallback? For now, warn.
		}

		const currentCount = this.activeSide === 'front' ? this.frontLayers.length : this.backLayers.length;
		if (currentCount >= 10) {
			toast.warning('High layer count may affect performance');
		}

		if (layer.imageUrl.startsWith('blob:')) {
			this.registerBlobLayer(layer.id);
		}

		if (layer.side === 'front') this.frontLayers.push(layer);
		else this.backLayers.push(layer);

		this.selections.set(layer.id, selection);
		this.selections = new Map(this.selections); // Trigger reactivity
		this.markUnsaved();
		
		// Preload hit cache
		this.initializeHitCache(layer);
	}



	// --- Hit Testing ---
	
	/**
	 * Preload layer image data into memory for fast pixel checking.
	 * Must be called when layer is added or image changes.
	 */
	async initializeHitCache(layer: DecomposedLayer) {
		if (this.hitTestCache.has(layer.id)) return; // Already cached

		const img = await this.loadImage(layer.imageUrl);
		if (!img) return;

		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		ctx.drawImage(img, 0, 0);
		this.hitTestCache.set(layer.id, { ctx, width: canvas.width, height: canvas.height });
	}

	/**
	 * Find the topmost layers at the given normalized position (0-1).
	 * Iterates in reverse z-index order (visual top to bottom).
	 * Uses cached pixel data for accurate "select through" capability.
	 */
	getLayersAtPosition(
		point: { x: number; y: number },
		canvasDimensions: { width: number; height: number }
	): string[] {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		// Create a copy to reverse without mutating original
		const uniqueLayers = [...list].sort((a, b) => b.zIndex - a.zIndex);

		const pxX = point.x * canvasDimensions.width;
		const pxY = point.y * canvasDimensions.height;

		const hits: string[] = [];

		for (const layer of uniqueLayers) {
			const bounds = layer.bounds;
			if (!bounds) continue;

			// 1. Simple bounding box check
			if (
				pxX >= bounds.x &&
				pxX <= bounds.x + bounds.width &&
				pxY >= bounds.y &&
				pxY <= bounds.y + bounds.height
			) {
				// 2. Optimized Pixel Check
				// Check if we have cached data for this layer
				const cached = this.hitTestCache.get(layer.id);
				
				if (cached) {
					// Map global pixel to layer relative pixel
					// Assumes layers are drawn at bounds size? 
					// Ideally layers are drawn 1:1 with bounds.
					// If bounds width != image width (scaled), we need to scale logic.
					
					const relativeX = pxX - bounds.x;
					const relativeY = pxY - bounds.y;
					
					const scaleX = cached.width / bounds.width;
					const scaleY = cached.height / bounds.height;
					
					const imgX = Math.floor(relativeX * scaleX);
					const imgY = Math.floor(relativeY * scaleY);

					if (imgX >= 0 && imgX < cached.width && imgY >= 0 && imgY < cached.height) {
						const alpha = cached.ctx.getImageData(imgX, imgY, 1, 1).data[3];
						if (alpha > 10) { // Threshold
							hits.push(layer.id);
						}
					}
				} else {
					// Fallback: If no cache yet (loading?), treat bound hit as valid
					// OR trigger load?
					// For usability, better to allow selection than deny it during load.
					hits.push(layer.id);
					// Lazily trigger cache init if missing?
					// this.initializeHitCache(layer); // Async, won't help this frame but helps next
				}
			}
		}

		return hits;
	}

	// --- Core Layer Operations ---



	removeLayer(layerId: string) {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const index = list.findIndex((l) => l.id === layerId);
		if (index === -1) return;

		const layer = list[index];
		this.cleanupBlobLayer(layer.id, layer.imageUrl);

		list.splice(index, 1);
		// Re-index zIndex
		list.forEach((l, i) => (l.zIndex = i));

		this.selections.delete(layerId);
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	/**
	 * Move a layer up or down in the visual stack.
	 * "up" = higher zIndex (visually on top), "down" = lower zIndex (visually below).
	 *
	 * In the layer panel (displayed bottom-to-top), this means:
	 * - "up" moves the layer to a LATER position in the array (swap with next)
	 * - "down" moves the layer to an EARLIER position in the array (swap with previous)
	 */
	moveLayer(layerId: string, direction: 'up' | 'down') {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const index = list.findIndex((l) => l.id === layerId);
		if (index === -1) return;

		// "up" = higher zIndex = swap with next element (later in array)
		// "down" = lower zIndex = swap with previous element (earlier in array)
		if (direction === 'up' && index < list.length - 1) {
			[list[index], list[index + 1]] = [list[index + 1], list[index]];
		} else if (direction === 'down' && index > 0) {
			[list[index - 1], list[index]] = [list[index], list[index - 1]];
		} else {
			return;
		}

		// Re-index all layers after swap
		list.forEach((l, i) => (l.zIndex = i));
		this.markUnsaved();
	}

	updateLayerImageUrl(layerId: string, newUrl: string) {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const layer = list.find((l) => l.id === layerId);
		if (layer) {
			if (!newUrl || typeof newUrl !== 'string') {
				toast.error('Invalid image URL');
				return;
			}

			// If replacing a blob URL, revoke the old one
			if (layer.imageUrl.startsWith('blob:') && layer.imageUrl !== newUrl) {
				this.cleanupBlobLayer(layer.id, layer.imageUrl);
			}

			layer.imageUrl = newUrl;
			// Update selection too if needed
			const sel = this.selections.get(layerId);
			if (sel) {
				sel.layerImageUrl = newUrl;
				this.selections = new Map(this.selections);
			}
			this.markUnsaved();
		}
	}

	// --- Selection & Metadata ---

	updateSelection(layerId: string, updates: Partial<LayerSelection>) {
		const current = this.selections.get(layerId);
		if (!current) return;
		this.selections.set(layerId, { ...current, ...updates });
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	setOpacity(layerId: string, value: number) {
		this.opacity.set(layerId, value);
		this.opacity = new Map(this.opacity);
	}

	toggleMergeSelection(layerId: string) {
		if (this.selectedForMerge.has(layerId)) this.selectedForMerge.delete(layerId);
		else this.selectedForMerge.add(layerId);
		this.selectedForMerge = new Set(this.selectedForMerge);
	}

	// --- Mask Management (Phase 1 requirement for Phase 6) ---


	/**
	 * Get mask for a layer if it exists.
	 */
	getMask(layerId: string): LayerMask | undefined {
		return this.masks.get(layerId);
	}

	/**
	 * Set or update mask for a layer.
	 */
	setMask(layerId: string, maskData: string, bounds: LayerMask['bounds']): void {
		if (!maskData || !maskData.startsWith('data:image/')) {
			console.error('Invalid mask data');
			toast.error('Failed to save mask: Invalid data format');
			return;
		}
		if (!isValidBounds(bounds)) {
			console.error('Invalid mask bounds');
			return;
		}

		this.masks.set(layerId, { layerId, maskData, bounds });
		this.masks = new Map(this.masks); // Trigger reactivity
		this.markUnsaved();
	}

	/**
	 * Clear mask for a layer (restore original).
	 */
	clearMask(layerId: string): void {
		if (this.masks.has(layerId)) {
			this.masks.delete(layerId);
			this.masks = new Map(this.masks);
			this.markUnsaved();
		}
	}

	/**
	 * Check if a layer has a mask.
	 */
	hasMask(layerId: string): boolean {
		return this.masks.has(layerId);
	}

	// --- Selection Management (Phase 3) ---

	/**
	 * Set the current selection result.
	 */
	setSelection(result: SelectionResult | null): void {
		this.currentSelection = result;
	}

	/**
	 * Clear the current selection.
	 */
	clearSelection(): void {
		this.currentSelection = null;
	}

	// --- Session Management ---

	markUnsaved() {
		this.saveState = 'unsaved';
	}

	saveToStorage(assetId: string) {
		this.saveState = 'saving';
		try {
			saveSession({
				assetId,
				frontLayers: this.frontLayers,
				backLayers: this.backLayers,
				layerSelections: Object.fromEntries(this.selections),
				layerOpacity: Object.fromEntries(this.opacity),
				layerMasks: Object.fromEntries(this.masks),
				currentSide: this.activeSide,
				showOriginalLayer: this.showOriginalLayer,
				savedAt: new Date().toISOString()
			});
			this.saveState = 'saved';
		} catch (e) {
			console.error('Save failed:', e);
			this.saveState = 'unsaved';
			if (e instanceof DOMException && e.name === 'QuotaExceededError') {
				toast.error('Local storage full. Cannot save progress.');
			} else {
				toast.error('Failed to save session.');
			}
		}
	}

	loadFromStorage(assetId: string) {
		const session = loadSession(assetId);
		if (session) {
			this.frontLayers = session.frontLayers || [];
			this.backLayers = session.backLayers || [];
			this.selections = new Map(Object.entries(session.layerSelections || {}));
			this.opacity = new Map(Object.entries(session.layerOpacity || {}));
			this.masks = new Map(Object.entries(session.layerMasks || {}));
			this.activeSide = session.currentSide || 'front';
			this.showOriginalLayer = session.showOriginalLayer ?? true;
			this.saveState = 'saved';

			// Validate and clean up any dead blob URLs (from previous crashed sessions)
			let hasDeadBlobs = false;
			const checkLayers = (layers: DecomposedLayer[]) => {
				layers.forEach((l) => {
					if (l.imageUrl && l.imageUrl.startsWith('blob:')) {
						console.error(`[LayerManager] Found dead blob URL for layer ${l.id}: ${l.imageUrl}`);
						// Replace with transparent pixel to prevent network errors
						l.imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
						hasDeadBlobs = true;
					}
				});
			};
			checkLayers(this.frontLayers);
			checkLayers(this.backLayers);

			if (hasDeadBlobs) {
				toast.warning('Some unsaved layer data could not be restored.');
			}

			return session;
		}
		return null;
	}

	clearCurrentSide() {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		list.forEach((l) => {
			this.selections.delete(l.id);
			this.cleanupBlobLayer(l.id, l.imageUrl);
			this.layerCanvasCache.delete(l.id);
		});
		
		if (this.activeSide === 'front') {
			this.frontLayers = [];
		} else {
			this.backLayers = [];
		}
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	addFromHistory(historyLayer: any) {
		// Handle full history item (with layers)
		if (historyLayer.layers && historyLayer.layers.length > 0) {
			// It's a decompose history item with sub-layers
			historyLayer.layers.forEach((l: any, i: number) => {
				const { layer, selection } = this.createLayerObj(
					l.imageUrl,
					l.name || `History Layer ${i}`,
					l.bounds || { x: 0, y: 0, width: 100, height: 100 },
					this.activeSide,
					this.currentLayers.length
				);
				this.addLayer(layer, selection);
			});
		} else {
			// Single layer or history item without layers
			const imageUrl =
				historyLayer.imageUrl || historyLayer.resultUrl || historyLayer.inputImageUrl;
			if (!imageUrl) return;

			const { layer, selection } = this.createLayerObj(
				imageUrl,
				historyLayer.name || historyLayer.model || 'AI Result',
				historyLayer.bounds || { x: 0, y: 0, width: 100, height: 100 },
				this.activeSide,
				this.currentLayers.length
			);
			this.addLayer(layer, selection);
		}
	}

	// --- Layer Actions (Phase 4) ---

	duplicateLayer(layerId: string) {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const layerIndex = list.findIndex((l) => l.id === layerId);
		if (layerIndex === -1) return;

		const originalLayer = list[layerIndex];
		const originalSelection = this.selections.get(layerId);
		const originalMask = this.masks.get(layerId);

		// Check limit
		if (list.length >= 10) {
			toast.warning('High layer count may affect performance');
		}

		// Generate new name
		let newName = `${originalLayer.name} (Copy)`;
		let counter = 2;
		while (list.some((l) => l.name === newName)) {
			newName = `${originalLayer.name} (Copy ${counter})`;
			counter++;
		}

		// Create new layer object
		const newId = crypto.randomUUID();
		const newLayer: DecomposedLayer = {
			...originalLayer,
			id: newId,
			name: newName,
			// Place it right above the original
			zIndex: originalLayer.zIndex + 1
		};

		// Note: If original has a blob URL, we should probably clone the blob 
		// if we want them to be independent, but strings are immutable so 
		// sharing the URL is fine until one changes.
		// However, we need to track it as a blob layer if it is one.
		if (newLayer.imageUrl.startsWith('blob:')) {
			this.registerBlobLayer(newId);
		}

		// Insert into list
		list.splice(layerIndex + 1, 0, newLayer);

		// Re-index all z-indices
		list.forEach((l, i) => (l.zIndex = i));

		// Duplicate Selection
		if (originalSelection) {
			this.selections.set(newId, {
				...originalSelection,
				layerId: newId,
				variableName: `${originalSelection.variableName}_copy`
			});
			this.selections = new Map(this.selections);
		}

		// Duplicate Mask
		if (originalMask) {
			this.masks.set(newId, {
				...originalMask,
				layerId: newId
			});
			this.masks = new Map(this.masks);
		}

		// Duplicate cached blob if present (Phase 8 upload queue preparation)
		const originalCachedBlob = this.cache.get(layerId);
		if (originalCachedBlob) {
			this.cache.set(newId, originalCachedBlob);
			this.cache = new Map(this.cache); // Trigger reactivity
		}

		this.markUnsaved();
	}

	reorderLayer(fromIndex: number, toIndex: number) {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		
		if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
		if (fromIndex === toIndex) return;

		const [movedLayer] = list.splice(fromIndex, 1);
		list.splice(toIndex, 0, movedLayer);

		// Re-index all z-indices
		list.forEach((l, i) => (l.zIndex = i));
		
		this.markUnsaved();
	}

	createLayerObj(
		url: string,
		name: string,
		bounds: any,
		side: 'front' | 'back',
		zIndex: number,
		cachedBlob?: Blob,
		layerType: 'decomposed' | 'drawing' | 'copied' | 'filled' = 'decomposed'
	) {
		if (!isValidBounds(bounds)) {
			// Fallback for invalid bounds
			bounds = { x: 0, y: 0, width: 100, height: 100 };
			console.warn('createLayerObj: Resetting invalid bounds to default');
		}

		const id = crypto.randomUUID();
		const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

		// If we have a blob, add to cache for upload queue
		if (cachedBlob) {
			this.addToCache(id, cachedBlob, side);
		}

		return {
			layer: {
				id,
				name,
				imageUrl: url,
				zIndex,
				suggestedType: layerType === 'drawing' ? 'drawing' : 'unknown',
				side,
				bounds,
				cachedBlob,
				layerType
			} as DecomposedLayer,
			selection: {
				layerId: id,
				included: true,
				elementType: layerType === 'drawing' ? 'graphic' : 'image', // Drawings are graphics
				variableName: `layer_${safeName}`,
				bounds,
				layerImageUrl: url,
				side
			} as LayerSelection
		};
	}

	createDrawingLayer(blob: Blob, bounds: { x: number; y: number; width: number; height: number }): string {
		const url = URL.createObjectURL(blob);
		const { layer, selection } = this.createLayerObj(
			url,
			'Drawing',
			bounds,
			this.activeSide,
			this.currentLayers.length,
			blob,
			'drawing'
		);
		this.addLayer(layer, selection);
		return layer.id; // Return new layer ID for brush tool to track
	}

	/**
	 * Merge a new drawing stroke onto an existing layer.
	 * Used by BrushTool to accumulate strokes on the same layer.
	 * @param layerId - ID of the existing layer to merge onto
	 * @param blob - New stroke as a Blob
	 * @param bounds - Bounds of the new stroke in canvas intrinsic coordinates
	 */
	async mergeDrawingToLayer(
		layerId: string, 
		blob: Blob, 
		bounds: { x: number; y: number; width: number; height: number }
	): Promise<void> {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const layerIndex = list.findIndex(l => l.id === layerId);
		if (layerIndex === -1) {
			console.error('[LayerManager] mergeDrawingToLayer: Layer not found:', layerId);
			return;
		}

		const layer = list[layerIndex];

		// OPTIMIZATION: Use cached canvas if available to avoid image decode
		let canvas = this.layerCanvasCache.get(layerId);
		
		// If no cached canvas, create one and load existing image
		if (!canvas) {
			const existingImage = await this.loadImage(layer.imageUrl);
			if (!existingImage) {
				console.error('[LayerManager] mergeDrawingToLayer: Failed to load existing image');
				return;
			}
			
			const existingBounds = layer.bounds || { 
				x: 0, 
				y: 0, 
				width: existingImage.width, 
				height: existingImage.height 
			};
			
			// Initialize canvas with sufficient size (might need resizing later)
			// For now, we'll size it exactly to current bounds, and resize if needed
			canvas = document.createElement('canvas');
			canvas.width = existingBounds.width;
			canvas.height = existingBounds.height;
			
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			
			ctx.drawImage(existingImage, 0, 0);
			
			// Store bounds in cache entry or rely on layer bounds? 
			// We need to know canvas position relative to global space.
			// Let's attach metadata to the canvas element itself for simplicity
			(canvas as any)._bounds = { ...existingBounds };
			
			this.layerCanvasCache.set(layerId, canvas);
		}

		const canvasBounds = (canvas as any)._bounds;

		// Check if we need to expand the canvas
		const newBounds = {
			x: Math.min(canvasBounds.x, bounds.x),
			y: Math.min(canvasBounds.y, bounds.y),
			width: 0,
			height: 0
		};
		newBounds.width = Math.max(canvasBounds.x + canvasBounds.width, bounds.x + bounds.width) - newBounds.x;
		newBounds.height = Math.max(canvasBounds.y + canvasBounds.height, bounds.y + bounds.height) - newBounds.y;

		// If bounds expanded, we need to resize the canvas
		if (newBounds.width > canvas.width || newBounds.height > canvas.height || 
			newBounds.x < canvasBounds.x || newBounds.y < canvasBounds.y) {
			
			const newCanvas = document.createElement('canvas');
			newCanvas.width = newBounds.width;
			newCanvas.height = newBounds.height;
			const newCtx = newCanvas.getContext('2d');
			if (!newCtx) return;
			
			// Draw existing canvas content at new relative position
			newCtx.drawImage(
				canvas,
				canvasBounds.x - newBounds.x,
				canvasBounds.y - newBounds.y
			);
			
			// Replace old canvas with new, resized one
			this.layerCanvasCache.set(layerId, newCanvas);
			canvas = newCanvas;
			(canvas as any)._bounds = newBounds;
		}

		// Now allow drawing the new stroke
		const strokeUrl = URL.createObjectURL(blob);
		const strokeImage = await this.loadImage(strokeUrl);
		URL.revokeObjectURL(strokeUrl);
		
		if (!strokeImage) {
			console.error('[LayerManager] mergeDrawingToLayer: Failed to load stroke image');
			return;
		}
		
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Draw new stroke relative to the (possibly updated) canvas bounds
		ctx.drawImage(
			strokeImage,
			bounds.x - (canvas as any)._bounds.x,
			bounds.y - (canvas as any)._bounds.y
		);

		// Convert result to blob
		return new Promise<void>((resolve) => {
			canvas!.toBlob((mergedBlob) => {
				if (mergedBlob) {
					// Clean up old blob URL if it exists
					if (layer.imageUrl.startsWith('blob:')) {
						URL.revokeObjectURL(layer.imageUrl);
					}

					const newUrl = URL.createObjectURL(mergedBlob);
					
					// Update layer properties - OPTIMISTIC UPDATE
					// Since we already have the canvas, maybe we can skip blob creation for display?
					// No, ImagePreview needs a URL. But this is fast enough.
					
					layer.imageUrl = newUrl;
					layer.bounds = (canvas as any)._bounds; // Use the tracked bounds
					layer.cachedBlob = mergedBlob;

					// Trigger reactivity
					if (this.activeSide === 'front') {
						this.frontLayers = [...this.frontLayers];
					} else {
						this.backLayers = [...this.backLayers];
					}

					// Update selection bounds
					const sel = this.selections.get(layerId);
					if (sel && layer.bounds) {
						sel.bounds = layer.bounds;
						sel.layerImageUrl = newUrl;
						this.selections = new Map(this.selections);
					}

					// Update cache for upload queue
					this.addToCache(layerId, mergedBlob, layer.side);
					this.registerBlobLayer(layerId);
					this.markUnsaved();
				}
				resolve();
			}, 'image/png');
		});
	}

	/**
	 * Helper to load an image from URL.
	 * Uses getProxiedUrl for external URLs to avoid CORS issues with canvas operations.
	 */
	private loadImage(url: string): Promise<HTMLImageElement | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = () => resolve(null);
			// Use proxied URL for external assets to avoid CORS issues
			const proxiedUrl = getProxiedUrl(url) || url;
			img.src = proxiedUrl;
		});
	}

	/**
	 * Check if a layer is a drawing layer (can be merged with brush strokes).
	 */
	isDrawingLayer(layerId: string): boolean {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const layer = list.find(l => l.id === layerId);
		return layer?.layerType === 'drawing';
	}

	// --- Hit Testing ---
	
	/**
	 * Find the topmost layer at the given normalized position (0-1).
	 * Iterates in reverse z-index order (visual top to bottom).
	 */
	/**
	 * Find the topmost layers at the given normalized position (0-1).
	 * Iterates in reverse z-index order (visual top to bottom).
	 */


	// --- Cache & Upload Queue (Phase 8) ---

	/**
	 * Add a blob to the upload cache with pending status.
	 */
	addToCache(layerId: string, blob: Blob, side: 'front' | 'back'): void {
		const entry: CachedLayer = {
			layerId,
			blob,
			side,
			createdAt: new Date(),
			uploadStatus: 'pending',
			retryCount: 0
		};
		this.cache.set(layerId, entry);
		this.cache = new Map(this.cache); // Trigger reactivity
		this.syncState = 'pending';
	}

	/**
	 * Get a cached blob URL for display (returns blob URL if cached, otherwise layer imageUrl).
	 */
	getCachedBlobUrl(layerId: string): string | null {
		const entry = this.cache.get(layerId);
		if (entry && entry.blob) {
			return URL.createObjectURL(entry.blob);
		}
		return null;
	}

	/**
	 * Process the upload queue - uploads all pending blobs to R2 sequentially.
	 * Updates layer imageUrl on success, marks as failed on error.
	 */
	async processUploadQueue(): Promise<{ uploaded: number; failed: number }> {
		if (this.isUploading) { 
			console.log('Upload already in progress');
			return { uploaded: 0, failed: 0 };
		}
		
		const pending = Array.from(this.cache.entries()).filter(
			([, entry]) => entry.uploadStatus === 'pending' || entry.uploadStatus === 'failed'
		);

		if (pending.length === 0) {
			this.syncState = 'synced';
			return { uploaded: 0, failed: 0 };
		}

		this.isUploading = true;
		this.syncState = 'syncing';
		let uploaded = 0;
		let failed = 0;

		try {
			for (const [layerId, entry] of pending) {
			// Update status to uploading
			entry.uploadStatus = 'uploading';
			this.cache.set(layerId, entry);
			this.cache = new Map(this.cache);

			try {
				// Convert blob to base64
				const base64 = await fileToDataUrl(entry.blob);

				// Upload to R2
				const result = await uploadProcessedImage({
					imageBase64: base64,
					mimeType: entry.blob.type || 'image/png'
				});

				if (result.success && result.url) {
					// Update layer URL
					this.updateLayerImageUrl(layerId, result.url);

					// Mark as uploaded and remove from cache
					entry.uploadStatus = 'uploaded';
					this.cache.delete(layerId);
					this.cache = new Map(this.cache);
					uploaded++;
				} else {
					throw new Error(result.error || 'Upload failed');
				}
			} catch (err) {
				// Mark as failed with error
				entry.uploadStatus = 'failed';
				entry.retryCount++;
				entry.error = err instanceof Error ? err.message : 'Upload failed';
				this.cache.set(layerId, entry);
				this.cache = new Map(this.cache);
				failed++;
				console.error(`[LayerManager] Upload failed for ${layerId}:`, err);
			}
		}

		} finally {
			this.isUploading = false;
			
			// Update sync state
			const stillPending = Array.from(this.cache.values()).some(
				(c) => c.uploadStatus === 'pending' || c.uploadStatus === 'failed'
			);
			this.syncState = stillPending ? 'pending' : 'synced';
		}

		return { uploaded, failed };
	}

	/**
	 * Retry failed uploads only.
	 */
	async retryFailedUploads(): Promise<{ uploaded: number; failed: number }> {
		// Reset failed entries to pending (up to 3 retries)
		for (const [layerId, entry] of this.cache.entries()) {
			if (entry.uploadStatus === 'failed' && entry.retryCount < 3) {
				entry.uploadStatus = 'pending';
				this.cache.set(layerId, entry);
			}
		}
		this.cache = new Map(this.cache);
		return this.processUploadQueue();
	}

	/**
	 * Check if there are any pending uploads that would be lost.
	 */
	hasPendingUploads(): boolean {
		return this.pendingUploads > 0;
	}
}
