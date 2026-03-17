import { toast } from 'svelte-sonner';
import {
    decomposeImage,
    upscaleImagePreview,
    removeElementFromLayer,
    uploadProcessedImage,
    saveHistoryItem
} from '$lib/remote/index.remote';
import { fileToImageData, processImageLSB, imageDataToBlob } from '$lib/utils/bye-synth-id';
import { fileToDataUrl, removeBackgroundCloud } from '$lib/utils/imageProcessing';
import type { LayerManager } from './LayerManager.svelte';
import type { HistoryManager } from './HistoryManager.svelte';
import type { DecomposedLayer } from '$lib/schemas/decompose.schema';
import { getProxiedUrl } from '$lib/utils/storage';
import { type NormalizedPoint } from './tools';

export class ImageProcessor {
    isProcessing = $state(false);
    processingLayerId = $state<string | null>(null);

    constructor(
        private layerManager: LayerManager,
        private historyManager: HistoryManager,
        private getAssetData: () => { id: string; width: number; height: number; templateId?: string }
    ) {}

    private get assetData() {
        return this.getAssetData();
    }

    /**
     * Optimization: Centralized execution wrapper to reduce boilerplate.
     * Handles isProcessing state, toasts, and standard error catching.
     */
    private async executeTask<T>(
        label: string, 
        task: (toastId: string | number) => Promise<T>
    ): Promise<T | undefined> {
        if (this.isProcessing) {
            toast.warning('Another operation is in progress');
            return undefined;
        }

        this.isProcessing = true;
        const toastId = toast.loading(label);

        try {
            return await task(toastId);
        } catch (e: any) {
            console.error(`[ImageProcessor] Error in ${label}:`, e);
            toast.error(e.message || 'Operation failed', { id: toastId });
            return undefined;
        } finally {
            this.isProcessing = false;
        }
    }

    // --- 1. Decompose ---
    async decompose(params: {
        imageUrl: string;
        numLayers: number;
        prompt?: string;
        negativePrompt?: string;
        settings: any;
    }) {
        return this.executeTask('Queuing decomposition...', async (toastId) => {
            // 1. Optimistic Update
            const tempId = this.historyManager.addOptimisticItem(
                'fal-ai-decompose',
                'Qwen-Image-Layered',
                params.imageUrl,
                this.layerManager.activeSide
            );

            const result = await decomposeImage({
                imageUrl: params.imageUrl,
                numLayers: params.numLayers,
                prompt: params.prompt,
                negative_prompt: params.negativePrompt,
                side: this.layerManager.activeSide,
                templateId: this.assetData.templateId,
                ...params.settings
            });

            if (!result.success || !result.jobId) {
                throw new Error(result.error || 'Failed to queue decomposition');
            }

            this.historyManager.updateOptimisticId(tempId, result.jobId);

            if (params.imageUrl.includes('original')) {
                this.layerManager.showOriginalLayer = false;
            }

            toast.success('Decomposition queued! Processing in background...', { id: toastId });
            return true;
        });
    }

    // --- 2. Upscale ---
    async upscaleLayer(
        layer: DecomposedLayer | { imageUrl: string; id: string },
        model: string,
        removeWatermark = false
    ) {
        return this.executeTask('Queuing upscale task...', async (toastId) => {
            let targetUrl = layer.imageUrl;

            if (removeWatermark) {
                toast.loading('Removing SynthID...', { id: toastId });
                targetUrl = await this.removeWatermarkLogic(targetUrl);
            }

            const tempId = this.historyManager.addOptimisticItem(
                `fal-ai-upscale-${model}`,
                model,
                layer.imageUrl,
                this.layerManager.activeSide
            );

            const result = await upscaleImagePreview({
                imageUrl: targetUrl,
                model: model as any,
                side: this.layerManager.activeSide,
                templateId: this.assetData.templateId || null
            });

            if (!result.success || !result.jobId) {
                throw new Error(result.error || 'Failed to queue upscale');
            }

            this.historyManager.updateOptimisticId(tempId, result.jobId);
            toast.success('Upscale queued! Processing in background...', { id: toastId });
            return true;
        });
    }

    // --- 3. Remove Element ---
    async removeElement(layer: DecomposedLayer, prompt: string) {
        return this.executeTask(`Queuing removal of "${prompt}"...`, async (toastId) => {
            const tempId = this.historyManager.addOptimisticItem(
                'fal-ai-remove',
                'qwen-image-edit',
                layer.imageUrl,
                this.layerManager.activeSide
            );

            const result = await removeElementFromLayer({
                imageUrl: layer.imageUrl,
                prompt,
                imageWidth: this.assetData.width,
                imageHeight: this.assetData.height,
                side: (layer as any).side || this.layerManager.activeSide,
                templateId: this.assetData.templateId || null
            });

            if (!result.success || !result.jobId) {
                throw new Error(result.error || 'Failed to queue removal');
            }

            this.historyManager.updateOptimisticId(tempId, result.jobId);
            toast.success('Removal queued! Processing in background...', { id: toastId });
            return true;
        });
    }

    // --- 4. Client-Side Merge ---
    async mergeSelectedLayers() {
        const ids = Array.from(this.layerManager.selectedForMerge);
        const layers = this.layerManager.currentLayers
            .filter((l) => ids.includes(l.id))
            .sort((a, b) => a.zIndex - b.zIndex);

        if (layers.length < 2) return;

        return this.executeTask('Merging layers...', async (toastId) => {
            const canvas = document.createElement('canvas');
            canvas.width = this.assetData.width;
            canvas.height = this.assetData.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No context');

            // Optimization: Load images in parallel using Promise.all
            const imagePromises = layers.map(l => new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = getProxiedUrl(l.imageUrl) || l.imageUrl;
            }));

            const images = await Promise.all(imagePromises);

            // Draw in sequence to maintain z-index order
            images.forEach(img => ctx.drawImage(img, 0, 0, canvas.width, canvas.height));

            const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
            if (!blob) throw new Error('Canvas blob failed');
            
            const base64 = await fileToDataUrl(blob);
            const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });

            if (upload.success && upload.url) {
                ids.forEach((id) => this.layerManager.removeLayer(id));

                const { layer, selection } = this.layerManager.createLayerObj(
                    upload.url,
                    `Merged (${ids.length})`,
                    { x: 0, y: 0, width: canvas.width, height: canvas.height },
                    this.layerManager.activeSide,
                    0
                );
                this.layerManager.addLayer(layer, selection);
                this.layerManager.mergeMode = false;
                this.layerManager.selectedForMerge.clear();
                toast.success('Layers merged', { id: toastId });
            }
        });
    }

    // --- 4.5. Lasso Cut (Heavily Optimized) ---
    async cutPolygon(layerId: string | null, points: { x: number; y: number }[], sourceImageUrl: string) {
        if (!layerId || points.length < 3 || !sourceImageUrl) return;

        return this.executeTask('Cutting selection...', async (toastId) => {
            // 1. Load source image
            const proxiedUrl = getProxiedUrl(sourceImageUrl) || sourceImageUrl;
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new Image();
                i.crossOrigin = 'anonymous';
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = proxiedUrl;
            });

            const canvasW = this.assetData.width;
            const canvasH = this.assetData.height;
            const isBackground = layerId === 'original-file';

            // 2. Determine Display Geometry (Exact "WYSIWYG" calculation)
            let layerX = 0, layerY = 0, layerW = canvasW, layerH = canvasH;

            if (!isBackground) {
                const layer = this.layerManager.currentLayers.find(l => l.id === layerId);
                if (layer && layer.bounds) {
                    layerX = layer.bounds.x;
                    layerY = layer.bounds.y;
                    layerW = layer.bounds.width;
                    layerH = layer.bounds.height;
                }
            } else {
                // Background uses object-fit: contain logic
                const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
                layerW = img.naturalWidth * scale;
                layerH = img.naturalHeight * scale;
                layerX = (canvasW - layerW) / 2;
                layerY = (canvasH - layerH) / 2;
            }

            // 3. Render "Display Canvas" 
            // This represents exactly what the user sees on screen.
            const displayCanvas = document.createElement('canvas');
            displayCanvas.width = canvasW;
            displayCanvas.height = canvasH;
            const displayCtx = displayCanvas.getContext('2d', { alpha: true });
            if (!displayCtx) throw new Error('No context');

            // Draw with object-fit logic applied
            displayCtx.drawImage(img, layerX, layerY, layerW, layerH);

            // 4. Calculate Bounding Box of Lasso
            const canvasPoints = points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }));
            const minX = Math.floor(Math.min(...canvasPoints.map(p => p.x)));
            const minY = Math.floor(Math.min(...canvasPoints.map(p => p.y)));
            const maxX = Math.ceil(Math.max(...canvasPoints.map(p => p.x)));
            const maxY = Math.ceil(Math.max(...canvasPoints.map(p => p.y)));
            const bboxW = maxX - minX;
            const bboxH = maxY - minY;

            if (bboxW <= 0 || bboxH <= 0) throw new Error('Invalid selection area');

            // 5. Create Cut Canvas (Optimized: Using Clip instead of Pixel Iteration)
            const cutCanvas = document.createElement('canvas');
            cutCanvas.width = bboxW;
            cutCanvas.height = bboxH;
            const cutCtx = cutCanvas.getContext('2d');
            if (!cutCtx) throw new Error('No cut context');

            // Optimization: Translate context so (0,0) is the top-left of the bounding box
            cutCtx.translate(-minX, -minY);

            // Draw Polygon Path
            cutCtx.beginPath();
            canvasPoints.forEach((p, i) => {
                if (i === 0) cutCtx.moveTo(p.x, p.y);
                else cutCtx.lineTo(p.x, p.y);
            });
            cutCtx.closePath();

            // Hardware Accelerated Masking
            // This replaces the expensive JS pixel loop
            cutCtx.clip();

            // Draw the display canvas into the clipped area
            // We draw the full display canvas, but only the clipped polygon part appears
            cutCtx.drawImage(displayCanvas, 0, 0);

            // 6. Generate Blob and Handle Result
            const cutBlob = await new Promise<Blob | null>(r => cutCanvas.toBlob(r, 'image/png'));
            if (!cutBlob) throw new Error('Cut blob creation failed');

            const blobUrl = URL.createObjectURL(cutBlob);
            const originLayer = this.layerManager.currentLayers.find(l => l.id === layerId);
            const originName = originLayer ? originLayer.name : 'Background';
            
            // Add layer immediately for UI responsiveness
            const { layer: newLayer, selection } = this.layerManager.createLayerObj(
                blobUrl,
                `${originName} (Copy)`,
                { x: minX, y: minY, width: bboxW, height: bboxH },
                this.layerManager.activeSide,
                this.layerManager.currentLayers.length + 1
            );
            this.layerManager.addLayer(newLayer, selection);
            toast.success('Copied selection', { id: toastId });

            // Background Upload
            const cutBase64 = await fileToDataUrl(cutBlob);
            uploadProcessedImage({ imageBase64: cutBase64, mimeType: 'image/png' })
                .then((res) => {
                    if (res.success && res.url) {
                        this.layerManager.updateLayerImageUrl(newLayer.id, res.url);
                        URL.revokeObjectURL(blobUrl); // Cleanup memory
                        
                        // History
                        saveHistoryItem({
                            originalUrl: sourceImageUrl,
                            resultUrl: res.url,
                            action: 'lasso-copy',
                            side: this.layerManager.activeSide,
                            templateId: this.assetData.templateId
                        }).then(() => this.historyManager.load());
                    }
                })
                .catch(err => console.error('Background upload failed', err));
        });
    }

    // --- 5. Set As Main Background ---
    async setAsMain(layerId: string) {
        const layer = this.layerManager.currentLayers.find((l) => l.id === layerId);
        if (!layer) return;

        if (!confirm(`Set this layer as the ${this.layerManager.activeSide} background?`)) return;

        return this.executeTask('Updating background...', async (toastId) => {
            const proxiedUrl = getProxiedUrl(layer.imageUrl) || layer.imageUrl;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();

            const { generateBackgroundVariants } = await import('$lib/utils/templateVariants');
            const variants = await generateBackgroundVariants(blob);

            const toBase64 = (b: Blob) => fileToDataUrl(b).then(s => s.split(',')[1] || s);

            const [fullBase64, thumbBase64, previewBase64] = await Promise.all([
                toBase64(variants.full),
                toBase64(variants.thumb),
                toBase64(variants.preview)
            ]);

            const { updateTemplateBackgroundWithVariants } = await import('$lib/remote/templates.update.remote');

            const result = await updateTemplateBackgroundWithVariants({
                assetId: this.assetData.id,
                side: this.layerManager.activeSide,
                fullBase64,
                thumbBase64,
                previewBase64,
                contentType: blob.type || 'image/png'
            });

            if (result.success && result.urls) {
                toast.success('Background updated', { id: toastId });
                return result.urls.fullUrl;
            }
            throw new Error(result.error || 'Failed to update background');
        });
    }

    // --- Helper: SynthID Removal ---
    private async removeWatermarkLogic(url: string) {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'temp.png', { type: 'image/png' });
        const imageData = await fileToImageData(file);
        const processed = processImageLSB(imageData, undefined, 'high');
        const processedBlob = await imageDataToBlob(processed.imageData, 'png');
        const base64 = await fileToDataUrl(processedBlob);
        const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });
        return upload.url || url;
    }

    // --- 6. Handle Crop ---
    async handleCrop(layerId: string, croppedImageUrl: string, originalLayerName: string, originalImageUrl: string) {
        const toastId = toast.loading('Processing crop...');
        try {
            const proxiedUrl = getProxiedUrl(croppedImageUrl) || croppedImageUrl;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            const base64 = await fileToDataUrl(blob);

            const uploadRes = await uploadProcessedImage({ imageBase64: base64, mimeType: blob.type });

            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error || 'Failed to upload cropped image');
            }

            // Cleanup local object URL if it was one
            if (croppedImageUrl.startsWith('blob:')) URL.revokeObjectURL(croppedImageUrl);

            const newImageUrl = uploadRes.url;

            await saveHistoryItem({
                originalUrl: originalImageUrl || croppedImageUrl,
                resultUrl: newImageUrl,
                action: 'crop',
                side: this.layerManager.activeSide,
                templateId: this.assetData.templateId
            });

            await this.historyManager.load();

            const layerName = layerId === 'original-file' ? `Cropped Original` : `Cropped ${originalLayerName}`;
            const { layer, selection } = this.layerManager.createLayerObj(
                newImageUrl,
                layerName,
                { x: 0, y: 0, width: this.assetData.width, height: this.assetData.height },
                this.layerManager.activeSide,
                this.layerManager.currentLayers.length
            );

            this.layerManager.addLayer(layer, selection);
            toast.success('Crop applied', { id: toastId });
            return true;
        } catch (e: any) {
            console.error('Crop error:', e);
            toast.error(e.message || 'Failed to apply crop', { id: toastId });
            return false;
        }
    }

    // --- 7. Selection Actions ---

    async fillSelection(points: NormalizedPoint[], color: string) {
        if (points.length < 3) return;

        return this.executeTask('Filling selection...', async (toastId) => {
            const canvasW = this.assetData.width;
            const canvasH = this.assetData.height;

            const canvas = document.createElement('canvas');
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No context');

            ctx.beginPath();
            points.forEach((p, i) => {
                const x = p.x * canvasW;
                const y = p.y * canvasH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Calculate efficient bounds for metadata
            const xs = points.map((p) => p.x * canvasW);
            const ys = points.map((p) => p.y * canvasH);
            const minX = Math.floor(Math.min(...xs));
            const minY = Math.floor(Math.min(...ys));
            const width = Math.ceil(Math.max(...xs)) - minX;
            const height = Math.ceil(Math.max(...ys)) - minY;

            const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
            if (!blob) throw new Error('Blob failed');
            const base64 = await fileToDataUrl(blob);

            const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });

            if (upload.success && upload.url) {
                const { layer, selection } = this.layerManager.createLayerObj(
                    upload.url,
                    'Fill Layer',
                    { x: 0, y: 0, width: canvasW, height: canvasH },
                    this.layerManager.activeSide,
                    this.layerManager.currentLayers.length
                );
                
                // Keep bounds roughly accurate even if image is full canvas
                layer.bounds = { x: 0, y: 0, width: canvasW, height: canvasH }; 

                this.layerManager.addLayer(layer, selection);
                this.historyManager.addLocalEntry('fill', layer.id);
                toast.success('Filled selection created', { id: toastId });
            }
        });
    }

    async deleteSelection(layerId: string, points: NormalizedPoint[]) {
        if (!layerId || points.length < 3) return;

        return this.executeTask('Creating mask...', async (toastId) => {
            const layer = this.layerManager.currentLayers.find((l) => l.id === layerId);
            if (!layer) throw new Error('Layer not found');

            const canvasW = this.assetData.width;
            const canvasH = this.assetData.height;
            const layerX = layer.bounds?.x ?? 0;
            const layerY = layer.bounds?.y ?? 0;
            const layerW = layer.bounds?.width ?? canvasW;
            const layerH = layer.bounds?.height ?? canvasH;

            const existingMask = this.layerManager.getMask(layerId);
            const canvas = document.createElement('canvas');
            canvas.width = layerW;
            canvas.height = layerH;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No context');

            if (existingMask) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = existingMask.maskData;
                });
                ctx.drawImage(img, 0, 0, layerW, layerH);
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, layerW, layerH);
            }

            // Draw erase polygon
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            points.forEach((p, i) => {
                const globalX = p.x * canvasW;
                const globalY = p.y * canvasH;
                const localX = globalX - layerX;
                const localY = globalY - layerY;
                if (i === 0) ctx.moveTo(localX, localY);
                else ctx.lineTo(localX, localY);
            });
            ctx.closePath();
            ctx.fillStyle = 'black'; 
            ctx.fill();

            const base64 = canvas.toDataURL('image/png');
            this.layerManager.setMask(layerId, base64, {
                x: layerX, y: layerY, width: layerW, height: layerH
            });

            toast.success('Area erased', { id: toastId });
            this.historyManager.addLocalEntry('erase', layerId);
        });
    }
    
    // --- 8. Background Removal ---
    async removeLayerBackground(layerId: string) {
        const layer = this.layerManager.currentLayers.find(l => l.id === layerId);
        if (!layer) return;

        return this.executeTask('Removing background...', async (toastId) => {
            const proxiedUrl = getProxiedUrl(layer.imageUrl) || layer.imageUrl;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            
            const processedBlob = await removeBackgroundCloud(blob);
            const base64 = await fileToDataUrl(processedBlob);
            const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });
            
            if (upload.success && upload.url) {
                this.layerManager.updateLayerImageUrl(layerId, upload.url);
                
                await saveHistoryItem({
                    originalUrl: layer.imageUrl,
                    resultUrl: upload.url,
                    action: 'remove-bg', 
                    side: this.layerManager.activeSide,
                    templateId: this.assetData.templateId
                });
                this.historyManager.load();
                toast.success('Background removed', { id: toastId });
            } else {
                throw new Error(upload.error || 'Upload failed');
            }
        });
    }
}