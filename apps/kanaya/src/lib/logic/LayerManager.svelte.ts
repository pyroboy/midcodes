import { saveSession, loadSession, clearSession } from '$lib/utils/decomposeSession';
import type { DecomposedLayer, LayerSelection, CachedLayer } from '$lib/schemas/decompose.schema';
import type { SelectionResult } from './tools/BaseTool';
import { uploadProcessedImage } from '$lib/remote/index.remote';
import { fileToDataUrl } from '$lib/utils/imageProcessing';
import { toast } from 'svelte-sonner';
import { getProxiedUrl } from '$lib/utils/storage';

/**
 * Mask data for non-destructive erasing.
 */
export interface LayerMask {
    layerId: string;
    maskData: string;
    bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Optimization: Hit test cache now stores only Alpha data (1 byte per pixel)
 * instead of full Canvas Contexts (4 bytes + DOM overhead).
 */
interface HitTestData {
    alphaMap: Uint8Array;
    width: number;
    height: number;
}

function isValidBounds(bounds: any): boolean {
    return (
        bounds &&
        typeof bounds.x === 'number' && typeof bounds.y === 'number' &&
        typeof bounds.width === 'number' && typeof bounds.height === 'number' &&
        bounds.width > 0 && bounds.height > 0
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

    // Mask Data
    masks = $state<Map<string, LayerMask>>(new Map());

    // UI State
    opacity = $state<Map<string, number>>(new Map());
    expandedIds = $state<Set<string>>(new Set());
    mergeMode = $state(false);
    selectedForMerge = $state<Set<string>>(new Set());
    showOriginalLayer = $state(true);

    // Cache State
    cache = $state<Map<string, CachedLayer>>(new Map());

    // Internal State
    private isUploading = false;
    private blobLayers = new Set<string>(); 
    
    // Optimizations
    private layerCanvasCache = new Map<string, HTMLCanvasElement>();
    private hitTestCache = new Map<string, HitTestData>();
    private mergeQueue = new Map<string, Promise<void>>();
    
    // Shared canvas for operations to avoid GC churn
    private _sharedCanvas: HTMLCanvasElement | null = null;

    // Derived
    pendingUploads = $derived(
        Array.from(this.cache.values()).filter(
            (c) => c.uploadStatus === 'pending' || c.uploadStatus === 'failed'
        ).length
    );

    currentSelection = $state<SelectionResult | null>(null);
    
    // Helper to get mutable reference to the current list
    private get activeLayerList() {
        return this.activeSide === 'front' ? this.frontLayers : this.backLayers;
    }

    currentLayers = $derived(this.activeSide === 'front' ? this.frontLayers : this.backLayers);

    constructor(initialSide: 'front' | 'back' = 'front') {
        this.activeSide = initialSide;
    }

    setSide(side: 'front' | 'back') {
        this.activeSide = side;
    }

    // --- Reactivity Helpers ---

    private triggerSelectionsUpdate() {
        this.selections = new Map(this.selections);
    }

    private triggerMasksUpdate() {
        this.masks = new Map(this.masks);
    }

    private triggerCacheUpdate() {
        this.cache = new Map(this.cache);
    }

    private getSharedCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
        if (!this._sharedCanvas) {
            this._sharedCanvas = document.createElement('canvas');
        }
        const canvas = this._sharedCanvas;
        // Resize if necessary (growing only is usually better for memory stability, but resizing is safer for logic)
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.clearRect(0, 0, width, height);
        return { canvas, ctx };
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
        this.layerCanvasCache.delete(layerId);
        this.hitTestCache.delete(layerId);
    }

    // --- Core Layer Operations ---

    addLayer(layer: DecomposedLayer, selection: LayerSelection) {
        if (!layer.id || !layer.name || !layer.imageUrl) {
            console.error('Invalid layer data:', layer);
            toast.error('Failed to add layer: Invalid data');
            return;
        }

        const list = this.activeLayerList;
        if (list.length >= 10) toast.warning('High layer count may affect performance');

        if (layer.imageUrl.startsWith('blob:')) {
            this.registerBlobLayer(layer.id);
        }

        list.push(layer);
        this.selections.set(layer.id, selection);
        this.triggerSelectionsUpdate();
        this.markUnsaved();
        
        // Async hit cache initialization
        this.initializeHitCache(layer);
    }

    // --- Optimized Hit Testing ---
    
    async initializeHitCache(layer: DecomposedLayer) {
        if (this.hitTestCache.has(layer.id)) return;

        try {
            const img = await this.loadImage(layer.imageUrl);
            if (!img) return;

            // Use shared canvas to extract data - prevents creating a DOM element for every layer
            const { ctx } = this.getSharedCanvas(img.naturalWidth, img.naturalHeight);
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
            const pixels = imageData.data;
            const pixelCount = pixels.length / 4;
            
            // Optimization: Store ONLY the alpha channel.
            // Reduces memory usage by 75% compared to storing full RGBA.
            const alphaMap = new Uint8Array(pixelCount);
            
            for (let i = 0; i < pixelCount; i++) {
                alphaMap[i] = pixels[i * 4 + 3];
            }

            this.hitTestCache.set(layer.id, { 
                alphaMap, 
                width: img.naturalWidth, 
                height: img.naturalHeight 
            });
        } catch (e) {
            console.warn('Failed to init hit cache for layer', layer.id);
        }
    }

    getLayersAtPosition(
        point: { x: number; y: number },
        canvasDimensions: { width: number; height: number }
    ): string[] {
        // Create a copy to reverse without mutating original (Optimization: slice first)
        const uniqueLayers = [...this.activeLayerList].sort((a, b) => b.zIndex - a.zIndex);

        const pxX = point.x * canvasDimensions.width;
        const pxY = point.y * canvasDimensions.height;
        const hits: string[] = [];

        for (const layer of uniqueLayers) {
            const bounds = layer.bounds;
            if (!bounds) continue;

            if (
                pxX >= bounds.x && pxX <= bounds.x + bounds.width &&
                pxY >= bounds.y && pxY <= bounds.y + bounds.height
            ) {
                const cached = this.hitTestCache.get(layer.id);
                
                if (cached) {
                    const relativeX = pxX - bounds.x;
                    const relativeY = pxY - bounds.y;
                    
                    const scaleX = cached.width / bounds.width;
                    const scaleY = cached.height / bounds.height;
                    
                    const imgX = Math.floor(relativeX * scaleX);
                    const imgY = Math.floor(relativeY * scaleY);

                    if (imgX >= 0 && imgX < cached.width && imgY >= 0 && imgY < cached.height) {
                        // O(1) Lookup in typed array
                        const alpha = cached.alphaMap[imgY * cached.width + imgX];
                        if (alpha > 10) hits.push(layer.id);
                    }
                } else {
                    // Fallback: simple bounding box hit
                    hits.push(layer.id);
                }
            }
        }
        return hits;
    }

    removeLayer(layerId: string) {
        const list = this.activeLayerList;
        const index = list.findIndex((l) => l.id === layerId);
        if (index === -1) return;

        const layer = list[index];
        this.cleanupBlobLayer(layer.id, layer.imageUrl);

        list.splice(index, 1);
        list.forEach((l, i) => (l.zIndex = i)); // Re-index

        this.selections.delete(layerId);
        this.triggerSelectionsUpdate();
        this.markUnsaved();
    }

    moveLayer(layerId: string, direction: 'up' | 'down') {
        const list = this.activeLayerList;
        const index = list.findIndex((l) => l.id === layerId);
        if (index === -1) return;

        if (direction === 'up' && index < list.length - 1) {
            [list[index], list[index + 1]] = [list[index + 1], list[index]];
        } else if (direction === 'down' && index > 0) {
            [list[index - 1], list[index]] = [list[index], list[index - 1]];
        } else {
            return;
        }

        list.forEach((l, i) => (l.zIndex = i));
        this.markUnsaved();
    }

    updateLayerImageUrl(layerId: string, newUrl: string) {
        const list = this.activeLayerList;
        const layer = list.find((l) => l.id === layerId);
        if (layer) {
            if (!newUrl || typeof newUrl !== 'string') {
                toast.error('Invalid image URL');
                return;
            }

            if (layer.imageUrl.startsWith('blob:') && layer.imageUrl !== newUrl) {
                this.cleanupBlobLayer(layer.id, layer.imageUrl);
            }

            layer.imageUrl = newUrl;
            const sel = this.selections.get(layerId);
            if (sel) {
                sel.layerImageUrl = newUrl;
                this.triggerSelectionsUpdate();
            }
            this.markUnsaved();
        }
    }

    // --- Selection & Metadata ---

    updateSelection(layerId: string, updates: Partial<LayerSelection>) {
        const current = this.selections.get(layerId);
        if (!current) return;
        this.selections.set(layerId, { ...current, ...updates });
        this.triggerSelectionsUpdate();
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

    // --- Mask Management ---

    getMask(layerId: string): LayerMask | undefined {
        return this.masks.get(layerId);
    }

    setMask(layerId: string, maskData: string, bounds: LayerMask['bounds']): void {
        if (!maskData || !maskData.startsWith('data:image/')) return;
        if (!isValidBounds(bounds)) return;

        this.masks.set(layerId, { layerId, maskData, bounds });
        this.triggerMasksUpdate();
        this.markUnsaved();
    }

    clearMask(layerId: string): void {
        if (this.masks.has(layerId)) {
            this.masks.delete(layerId);
            this.triggerMasksUpdate();
            this.markUnsaved();
        }
    }

    hasMask(layerId: string): boolean {
        return this.masks.has(layerId);
    }

    // --- Selection State ---

    setSelection(result: SelectionResult | null): void {
        this.currentSelection = result;
    }

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
            toast.error(e instanceof DOMException && e.name === 'QuotaExceededError' 
                ? 'Local storage full.' : 'Failed to save session.');
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

            let hasDeadBlobs = false;
            const checkLayers = (layers: DecomposedLayer[]) => {
                layers.forEach((l) => {
                    if (l.imageUrl?.startsWith('blob:')) {
                        // Dead blobs cannot be restored from localStorage, replace with transparent
                        l.imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                        hasDeadBlobs = true;
                    }
                });
            };
            checkLayers(this.frontLayers);
            checkLayers(this.backLayers);

            if (hasDeadBlobs) toast.warning('Some unsaved layer data could not be restored.');
            return session;
        }
        return null;
    }

    clearCurrentSide() {
        const list = this.activeLayerList;
        list.forEach((l) => {
            this.selections.delete(l.id);
            this.cleanupBlobLayer(l.id, l.imageUrl);
        });
        
        if (this.activeSide === 'front') this.frontLayers = [];
        else this.backLayers = [];
        
        this.triggerSelectionsUpdate();
        this.markUnsaved();
    }

    addFromHistory(historyLayer: any) {
        if (historyLayer.layers?.length > 0) {
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
            const imageUrl = historyLayer.imageUrl || historyLayer.resultUrl || historyLayer.inputImageUrl;
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

    // --- Layer Actions ---

    duplicateLayer(layerId: string) {
        const list = this.activeLayerList;
        const layerIndex = list.findIndex((l) => l.id === layerId);
        if (layerIndex === -1) return;

        const originalLayer = list[layerIndex];
        const originalSelection = this.selections.get(layerId);
        const originalMask = this.masks.get(layerId);

        if (list.length >= 10) toast.warning('High layer count may affect performance');

        // Name generation
        let newName = `${originalLayer.name} (Copy)`;
        let counter = 2;
        while (list.some((l) => l.name === newName)) {
            newName = `${originalLayer.name} (Copy ${counter})`;
            counter++;
        }

        const newId = crypto.randomUUID();
        const newLayer: DecomposedLayer = {
            ...originalLayer,
            id: newId,
            name: newName,
            zIndex: originalLayer.zIndex + 1
        };

        if (newLayer.imageUrl.startsWith('blob:')) {
            this.registerBlobLayer(newId);
        }

        list.splice(layerIndex + 1, 0, newLayer);
        list.forEach((l, i) => (l.zIndex = i));

        if (originalSelection) {
            this.selections.set(newId, {
                ...originalSelection,
                layerId: newId,
                variableName: `${originalSelection.variableName}_copy`
            });
            this.triggerSelectionsUpdate();
        }

        if (originalMask) {
            this.masks.set(newId, { ...originalMask, layerId: newId });
            this.triggerMasksUpdate();
        }

        const originalCachedBlob = this.cache.get(layerId);
        if (originalCachedBlob) {
            this.cache.set(newId, originalCachedBlob);
            this.triggerCacheUpdate();
        }

        this.markUnsaved();
    }

    reorderLayer(fromIndex: number, toIndex: number) {
        const list = this.activeLayerList;
        if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return;

        const [movedLayer] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, movedLayer);
        list.forEach((l, i) => (l.zIndex = i));
        this.markUnsaved();
    }

    createLayerObj(
        url: string, name: string, bounds: any, side: 'front' | 'back',
        zIndex: number, cachedBlob?: Blob, layerType: 'decomposed' | 'drawing' | 'copied' | 'filled' = 'decomposed'
    ) {
        if (!isValidBounds(bounds)) bounds = { x: 0, y: 0, width: 100, height: 100 };

        const id = crypto.randomUUID();
        const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

        if (cachedBlob) this.addToCache(id, cachedBlob, side);

        return {
            layer: {
                id, name, imageUrl: url, zIndex,
                suggestedType: layerType === 'drawing' ? 'drawing' : 'unknown',
                side, bounds, cachedBlob, layerType
            } as DecomposedLayer,
            selection: {
                layerId: id, included: true,
                elementType: layerType === 'drawing' ? 'graphic' : 'image',
                variableName: `layer_${safeName}`,
                bounds, layerImageUrl: url, side
            } as LayerSelection
        };
    }

    createDrawingLayer(blob: Blob, bounds: { x: number; y: number; width: number; height: number }): string {
        const url = URL.createObjectURL(blob);
        const { layer, selection } = this.createLayerObj(
            url, 'Drawing', bounds, this.activeSide,
            this.currentLayers.length, blob, 'drawing'
        );
        this.addLayer(layer, selection);
        return layer.id;
    }

    async mergeDrawingToLayer(
        layerId: string,
        blob: Blob,
        bounds: { x: number; y: number; width: number; height: number },
        compositeOperation: GlobalCompositeOperation = 'source-over'
    ): Promise<void> {
        // Serialization queue
        const previous = this.mergeQueue.get(layerId) || Promise.resolve();
        const task = previous.then(() => this._performMerge(layerId, blob, bounds, compositeOperation));
        this.mergeQueue.set(layerId, task);
        return task;
    }

    private async _performMerge(
        layerId: string,
        blob: Blob,
        bounds: { x: number; y: number; width: number; height: number },
        compositeOperation: GlobalCompositeOperation
    ): Promise<void> {
        console.log('[_performMerge] Called with:', {
            layerId,
            strokeBounds: bounds,
            compositeOperation
        });
        
        const list = this.activeLayerList;
        const layer = list.find(l => l.id === layerId);
        if (!layer) return;

        console.log('[_performMerge] Layer found:', {
            layerId: layer.id,
            layerBounds: layer.bounds,
            hasLayerBounds: !!layer.bounds
        });

        let canvas = this.layerCanvasCache.get(layerId);
        
        // 1. Initialize canvas if needed
        if (!canvas) {
            console.log('[_performMerge] No cached canvas, loading from imageUrl');
            const existingImage = await this.loadImage(layer.imageUrl);
            if (!existingImage) return;
            
            console.log('[_performMerge] Loaded existing image:', {
                imageWidth: existingImage.width,
                imageHeight: existingImage.height
            });
            
            const existingBounds = layer.bounds || { x: 0, y: 0, width: existingImage.width, height: existingImage.height };
            console.log('[_performMerge] Using existingBounds:', existingBounds);
            
            canvas = document.createElement('canvas');
            canvas.width = existingBounds.width;
            canvas.height = existingBounds.height;
            
            const ctx = canvas.getContext('2d')!;
            // Scale the image to fit the layer bounds (image might be larger than bounds)
            ctx.drawImage(existingImage, 0, 0, existingBounds.width, existingBounds.height);
            (canvas as any)._bounds = { ...existingBounds };
            this.layerCanvasCache.set(layerId, canvas);
            
            console.log('[_performMerge] Created canvas:', {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                _bounds: (canvas as any)._bounds
            });
        }

        // 2. Resize Logic
        const canvasBounds = (canvas as any)._bounds;
        const newBounds = {
            x: Math.min(canvasBounds.x, bounds.x),
            y: Math.min(canvasBounds.y, bounds.y),
            width: 0, height: 0
        };
        newBounds.width = Math.max(canvasBounds.x + canvasBounds.width, bounds.x + bounds.width) - newBounds.x;
        newBounds.height = Math.max(canvasBounds.y + canvasBounds.height, bounds.y + bounds.height) - newBounds.y;

        if (newBounds.width > canvas.width || newBounds.height > canvas.height || 
            newBounds.x < canvasBounds.x || newBounds.y < canvasBounds.y) {
            
            const newCanvas = document.createElement('canvas');
            newCanvas.width = newBounds.width;
            newCanvas.height = newBounds.height;
            const newCtx = newCanvas.getContext('2d')!;
            
            // Draw existing at new relative position
            newCtx.drawImage(canvas, canvasBounds.x - newBounds.x, canvasBounds.y - newBounds.y);
            
            this.layerCanvasCache.set(layerId, newCanvas);
            canvas = newCanvas;
            (canvas as any)._bounds = newBounds;
        }

        // 3. Draw Stroke
        const strokeUrl = URL.createObjectURL(blob);
        const strokeImage = await this.loadImage(strokeUrl);
        URL.revokeObjectURL(strokeUrl);
        
        if (!strokeImage) return;
        
        const ctx = canvas.getContext('2d')!;
        ctx.globalCompositeOperation = compositeOperation;
        ctx.drawImage(strokeImage, bounds.x - (canvas as any)._bounds.x, bounds.y - (canvas as any)._bounds.y);
        ctx.globalCompositeOperation = 'source-over';

        // 4. Update Layer
        return new Promise<void>((resolve) => {
            canvas!.toBlob((mergedBlob) => {
                if (mergedBlob) {
                    if (layer.imageUrl.startsWith('blob:')) URL.revokeObjectURL(layer.imageUrl);

                    const newUrl = URL.createObjectURL(mergedBlob);
                    layer.imageUrl = newUrl;
                    layer.bounds = (canvas as any)._bounds;
                    layer.cachedBlob = mergedBlob;

                    // Trigger simple array reassignment for Svelte 5 reactivity
                    if (this.activeSide === 'front') this.frontLayers = [...this.frontLayers];
                    else this.backLayers = [...this.backLayers];

                    const sel = this.selections.get(layerId);
                    if (sel) {
                        if (layer.bounds) {
                            sel.bounds = layer.bounds;
                        }
                        sel.layerImageUrl = newUrl;
                        this.triggerSelectionsUpdate();
                    }

                    this.addToCache(layerId, mergedBlob, layer.side);
                    this.registerBlobLayer(layerId);
                    
                    // Invalidate and reload hit cache
                    this.hitTestCache.delete(layerId);
                    this.initializeHitCache(layer);
                    this.markUnsaved();
                }
                resolve();
            }, 'image/png');
        });
    }

    private loadImage(url: string): Promise<HTMLImageElement | null> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = getProxiedUrl(url) || url;
        });
    }

    isDrawingLayer(layerId: string): boolean {
        const list = this.activeLayerList;
        return list.find(l => l.id === layerId)?.layerType === 'drawing';
    }

    // --- Cache & Upload Queue ---

    addToCache(layerId: string, blob: Blob, side: 'front' | 'back'): void {
        this.cache.set(layerId, {
            layerId, blob, side,
            createdAt: new Date(),
            uploadStatus: 'pending',
            retryCount: 0
        });
        this.triggerCacheUpdate();
        this.syncState = 'pending';
    }

    getCachedBlobUrl(layerId: string): string | null {
        const entry = this.cache.get(layerId);
        return entry?.blob ? URL.createObjectURL(entry.blob) : null;
    }

    confirmLayerUpload(layerId: string, newUrl: string) {
        const list = this.activeLayerList;
        const layer = list.find((l) => l.id === layerId);
        
        if (layer) {
            if (layer.imageUrl.startsWith('blob:') && layer.imageUrl !== newUrl) {
                URL.revokeObjectURL(layer.imageUrl);
                this.blobLayers.delete(layerId);
            }
            layer.imageUrl = newUrl;
            
            const sel = this.selections.get(layerId);
            if (sel) {
                sel.layerImageUrl = newUrl;
                this.triggerSelectionsUpdate();
            }
            this.markUnsaved();
        }
    }

    /**
     * Optimization: Parallel Uploads
     * Processes uploads in batches instead of one by one.
     */
    async processUploadQueue(): Promise<{ uploaded: number; failed: number }> {
        if (this.isUploading) return { uploaded: 0, failed: 0 };
        
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

        const CONCURRENCY = 3; // Limit simultaneous uploads
        const processItem = async (layerId: string, entry: CachedLayer) => {
            entry.uploadStatus = 'uploading';
            this.cache.set(layerId, entry); 
            // Note: We don't trigger full map reactivity here to avoid excessive re-renders during loop

            try {
                const base64 = await fileToDataUrl(entry.blob);
                const result = await uploadProcessedImage({
                    imageBase64: base64,
                    mimeType: entry.blob.type || 'image/png'
                });

                if (result.success && result.url) {
                    this.confirmLayerUpload(layerId, result.url);
                    entry.uploadStatus = 'uploaded';
                    this.cache.delete(layerId);
                    uploaded++;
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            } catch (err) {
                entry.uploadStatus = 'failed';
                entry.retryCount++;
                entry.error = err instanceof Error ? err.message : 'Upload failed';
                this.cache.set(layerId, entry);
                failed++;
                console.error(`[LayerManager] Upload failed for ${layerId}:`, err);
            }
        };

        try {
            // Simple batch processing
            for (let i = 0; i < pending.length; i += CONCURRENCY) {
                const batch = pending.slice(i, i + CONCURRENCY);
                await Promise.all(batch.map(([id, entry]) => processItem(id, entry)));
                this.triggerCacheUpdate(); // Update UI after each batch
            }
        } finally {
            this.isUploading = false;
            const stillPending = Array.from(this.cache.values()).some(
                (c) => c.uploadStatus === 'pending' || c.uploadStatus === 'failed'
            );
            this.syncState = stillPending ? 'pending' : 'synced';
        }

        return { uploaded, failed };
    }

    async retryFailedUploads() {
        for (const [layerId, entry] of this.cache.entries()) {
            if (entry.uploadStatus === 'failed' && entry.retryCount < 3) {
                entry.uploadStatus = 'pending';
                this.cache.set(layerId, entry);
            }
        }
        this.triggerCacheUpdate();
        return this.processUploadQueue();
    }

    hasPendingUploads(): boolean {
        return this.pendingUploads > 0;
    }

    async mergeLayers(layerIds: string[]): Promise<string | null> {
        if (layerIds.length < 2) {
            toast.warning('Select at least 2 layers to merge');
            return null;
        }

        const list = this.activeLayerList;
        const layersToMerge = list
            .filter(l => layerIds.includes(l.id))
            .sort((a, b) => a.zIndex - b.zIndex);

        if (layersToMerge.length < 2) return null;

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const layer of layersToMerge) {
            const bounds = layer.bounds || { x: 0, y: 0, width: 100, height: 100 };
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }

        const mergedBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

        // Reuse shared canvas logic if possible, but for merging we need a new context 
        // because we might be drawing multiple images. A fresh canvas is safer here.
        const canvas = document.createElement('canvas');
        canvas.width = mergedBounds.width;
        canvas.height = mergedBounds.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        for (const layer of layersToMerge) {
            const img = await this.loadImage(layer.imageUrl);
            if (img) {
                const bounds = layer.bounds || { x: 0, y: 0, width: img.width, height: img.height };
                ctx.drawImage(img, bounds.x - mergedBounds.x, bounds.y - mergedBounds.y, bounds.width, bounds.height);
            }
        }

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                const topLayer = layersToMerge[layersToMerge.length - 1];
                const mergedUrl = URL.createObjectURL(blob);
                
                const { layer: mergedLayer, selection: mergedSelection } = this.createLayerObj(
                    mergedUrl, 'Merged Layer', mergedBounds, this.activeSide, topLayer.zIndex, blob, 'drawing'
                );

                for (const layer of [...layersToMerge].reverse()) {
                    this.removeLayer(layer.id);
                }

                this.addLayer(mergedLayer, mergedSelection);
                
                // Fix Z-indices
                const updatedList = this.activeLayerList;
                updatedList.forEach((l, i) => (l.zIndex = i));

                toast.success(`Merged ${layersToMerge.length} layers`);
                resolve(mergedLayer.id);
            }, 'image/png');
        });
    }

    // --- Static Element Management ---

    isStaticElement(layerId: string): boolean {
        return !!this.selections.get(layerId)?.pairedElementId;
    }

    getPairedElementId(layerId: string): string | undefined {
        return this.selections.get(layerId)?.pairedElementId;
    }

    async ensureLayerUploaded(layerId: string): Promise<string | null> {
        const list = this.activeLayerList;
        const layer = list.find((l) => l.id === layerId);
        if (!layer) return null;

        if (!layer.imageUrl.startsWith('blob:') && !layer.imageUrl.startsWith('data:')) {
            return layer.imageUrl;
        }

        const cached = this.cache.get(layerId);
        let base64: string | null = null;
        let mimeType = 'image/png';

        try {
            if (cached && cached.uploadStatus !== 'uploaded') {
                base64 = await fileToDataUrl(cached.blob);
                mimeType = cached.blob.type || mimeType;
            } else if (layer.imageUrl.startsWith('blob:')) {
                const response = await fetch(layer.imageUrl);
                const blob = await response.blob();
                base64 = await fileToDataUrl(blob);
                mimeType = blob.type || mimeType;
            }

            if (base64) {
                const result = await uploadProcessedImage({ imageBase64: base64, mimeType });
                if (result.success && result.url) {
                    this.confirmLayerUpload(layerId, result.url);
                    if (cached) {
                        cached.uploadStatus = 'uploaded';
                        this.cache.delete(layerId);
                        this.triggerCacheUpdate();
                    }
                    return result.url;
                }
            }
        } catch (err) {
            console.error('[LayerManager] ensureLayerUploaded error:', err);
        }
        return null;
    }

    setPairedElementId(layerId: string, elementId: string | undefined) {
        const selection = this.selections.get(layerId);
        if (selection) {
            this.selections.set(layerId, { ...selection, pairedElementId: elementId });
            this.triggerSelectionsUpdate();
            const layer = this.activeLayerList.find((l) => l.id === layerId);
            if (layer) layer.pairedElementId = elementId;
            this.markUnsaved();
        }
    }

    updateLayerName(layerId: string, newName: string) {
        const list = this.activeLayerList;
        const layer = list.find((l) => l.id === layerId);
        if (!layer) return;

        layer.name = newName;
        const selection = this.selections.get(layerId);
        if (selection) {
            const safeName = newName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            this.selections.set(layerId, { ...selection, variableName: safeName || selection.variableName });
            this.triggerSelectionsUpdate();
        }
        this.markUnsaved();
        return selection?.pairedElementId;
    }

    getLayerDataForStaticElement(layerId: string) {
        const list = this.activeLayerList;
        const layer = list.find((l) => l.id === layerId);
        const selection = this.selections.get(layerId);

        if (!layer || !selection) return null;

        return {
            name: layer.name,
            imageUrl: layer.imageUrl,
            bounds: selection.bounds || layer.bounds || { x: 0, y: 0, width: 100, height: 100 },
            side: layer.side || this.activeSide
        };
    }

    // ============================================================================
    // BACKGROUND LAYER MANAGEMENT
    // ============================================================================

    static readonly BG_LAYER_ID = 'background-layer';

    getBackgroundLayer(): DecomposedLayer | null {
        const list = this.activeLayerList;
        return list.find((l) => l.id === LayerManager.BG_LAYER_ID) || null;
    }

    async createBackgroundLayer(originalImageUrl: string, width: number, height: number): Promise<string> {
		console.log('[LayerManager.createBackgroundLayer] Called with:', {
			originalImageUrl: originalImageUrl?.substring(0, 50) + '...',
			width,
			height,
			activeSide: this.activeSide
		});
		
		const existing = this.getBackgroundLayer();
		if (existing) {
			console.log('[LayerManager.createBackgroundLayer] BG layer already exists:', existing.id);
			return existing.id;
		}

		// IMPORTANT: Set explicit bounds to match the canvas dimensions, NOT the original image dimensions.
		// The original image might be larger (e.g., 1200x1968) than the canvas (638x1013).
		// Brush stroke coordinates are in canvas space, so the merge canvas must match.
		const bounds = { x: 0, y: 0, width, height };
		
		const layer: DecomposedLayer = {
			id: LayerManager.BG_LAYER_ID,
			name: 'Background',
			imageUrl: originalImageUrl,
			zIndex: 0,
			side: this.activeSide,
			suggestedType: 'graphic',
			layerType: 'decomposed',
			bounds // Explicit bounds for correct merge coordinate system
		};

		const selection: LayerSelection = {
			layerId: LayerManager.BG_LAYER_ID,
			elementType: 'graphic',
			variableName: 'background',
			included: true,
			bounds: { x: 0, y: 0, width, height }, // Full canvas bounds for selection
			side: this.activeSide,
			layerImageUrl: originalImageUrl
		};
		
		console.log('[LayerManager.createBackgroundLayer] Created layer:', {
			layerId: layer.id,
			layerBounds: layer.bounds,
			selectionBounds: selection.bounds
		});
		
        if (this.activeSide === 'front') this.frontLayers = [layer, ...this.frontLayers];
        else this.backLayers = [layer, ...this.backLayers];
        
        this.selections.set(layer.id, selection);
        this.triggerSelectionsUpdate();
        this.markUnsaved();
        
        return layer.id;
    }

    async ensureBackgroundLayer(originalImageUrl: string, width: number, height: number): Promise<DecomposedLayer> {
        let bgLayer = this.getBackgroundLayer();
        if (!bgLayer) {
            await this.createBackgroundLayer(originalImageUrl, width, height);
            bgLayer = this.getBackgroundLayer();
        }
        return bgLayer!;
    }
}