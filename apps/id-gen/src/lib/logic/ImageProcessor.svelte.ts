import { toast } from 'svelte-sonner';
import { 
	decomposeImage, upscaleImagePreview, removeElementFromLayer, 
	uploadProcessedImage, saveHistoryItem
} from '$lib/remote/index.remote';
import { saveEnhancedImage } from '$lib/remote/enhance.remote';
import { fileToImageData, processImageLSB, imageDataToBlob } from '$lib/utils/bye-synth-id';
import { fileToDataUrl } from '$lib/utils/imageProcessing';
import type { LayerManager } from './LayerManager.svelte';
import type { HistoryManager } from './HistoryManager.svelte';
import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

export class ImageProcessor {
	isProcessing = $state(false);
	processingLayerId = $state<string | null>(null);

	constructor(
		private layerManager: LayerManager,
		private historyManager: HistoryManager,
		private getAssetData: () => { id: string; width: number; height: number; templateId?: string }
	) {}

    private get assetData() { return this.getAssetData(); }

	// Note: Polling is now handled entirely by HistoryManager for better
	// synchronization and to avoid duplicate polling.

	// --- 1. Decompose ---
	async decompose(params: {
		imageUrl: string;
		numLayers: number;
		prompt?: string;
		negativePrompt?: string;
		settings: any;
	}) {
		const toastId = toast.loading('Queuing decomposition task...');

		// 1. Optimistic Update (Immediate)
		const tempId = this.historyManager.addOptimisticItem(
			'fal-ai-decompose', 
			'Qwen-Image-Layered', 
			params.imageUrl, 
			this.layerManager.activeSide
		);

		try {
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

			// 2. Reconcile temp ID with real job ID - HistoryManager handles polling
			this.historyManager.updateOptimisticId(tempId, result.jobId);

			// Hide original if decomposing background
			if (params.imageUrl.includes('original')) {
				this.layerManager.showOriginalLayer = false;
			}

			toast.success('Decomposition queued! Processing in background...', { id: toastId });
			return true;
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || 'Failed to queue', { id: toastId });
			return false;
		}
	}

	// --- 2. Upscale (with SynthID Removal) ---
	async upscaleLayer(layer: DecomposedLayer | { imageUrl: string; id: string }, model: string, removeWatermark = false) {
		const toastId = toast.loading('Queuing upscale task...');

		try {
			let targetUrl = layer.imageUrl;

			if (removeWatermark) {
				toast.loading('Removing SynthID...', { id: toastId });
				targetUrl = await this.removeWatermarkLogic(targetUrl);
			}

			// 1. Optimistic Update
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

			// 2. Reconcile ID - HistoryManager handles polling
			this.historyManager.updateOptimisticId(tempId, result.jobId);

			toast.success('Upscale queued! Processing in background...', { id: toastId });
			return true;
		} catch (e: any) {
			toast.error(e.message, { id: toastId });
			return false;
		}
	}

	// --- 3. Remove Element ---
	async removeElement(layer: DecomposedLayer, prompt: string) {
		const toastId = toast.loading(`Queuing removal of "${prompt}"...`);

		// 1. Optimistic Update
		const tempId = this.historyManager.addOptimisticItem(
			'fal-ai-remove', 
			'qwen-image-edit', 
			layer.imageUrl, 
			this.layerManager.activeSide
		);

		try {
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

			// 2. Reconcile ID - HistoryManager handles polling
			this.historyManager.updateOptimisticId(tempId, result.jobId);

			toast.success('Removal queued! Processing in background...', { id: toastId });
			return true;
		} catch (e: any) {
			toast.error(e.message, { id: toastId });
			return false;
		}
	}

	// --- 4. Client-Side Merge ---
	async mergeSelectedLayers() {
		const ids = Array.from(this.layerManager.selectedForMerge);
		const layers = this.layerManager.currentLayers
			.filter(l => ids.includes(l.id))
			.sort((a, b) => a.zIndex - b.zIndex);

		if (layers.length < 2) return;
		this.isProcessing = true;
		const toastId = toast.loading('Merging layers...');

		try {
			const canvas = document.createElement('canvas');
			canvas.width = this.assetData.width;
			canvas.height = this.assetData.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('No context');

			for (const l of layers) {
				await new Promise((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => {
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
						resolve(null);
					};
					img.onerror = reject;
					img.src = l.imageUrl; // Ensure proxy if needed
				});
			}

			const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
			if (!blob) throw new Error('Canvas blob failed');
			const base64 = await fileToDataUrl(blob);

			const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });
			if (upload.success && upload.url) {
				// Remove old
				ids.forEach(id => this.layerManager.removeLayer(id));
				
				// Add merged
				const { layer, selection } = this.layerManager.createLayerObj(
					upload.url,
					`Merged (${ids.length})`,
					{ x: 0, y: 0, width: canvas.width, height: canvas.height },
					this.layerManager.activeSide,
					0 // zIndex will be fixed by addLayer or manually
				);
				this.layerManager.addLayer(layer, selection);
				this.layerManager.mergeMode = false;
				this.layerManager.selectedForMerge.clear();
				toast.success('Layers merged', { id: toastId });
			}
		} catch (e: any) {
			console.error(e);
			toast.error('Merge failed', { id: toastId });
		} finally {
			this.isProcessing = false;
		}
	}

	// --- 5. Set As Main Background ---
	async setAsMain(layerId: string) {
		const layer = this.layerManager.currentLayers.find(l => l.id === layerId);
		if (!layer) return;

		if (!confirm(`Set this layer as the ${this.layerManager.activeSide} background?`)) return;

		this.isProcessing = true;
		try {
			const result = await saveEnhancedImage({
				assetId: this.assetData.id,
				imageUrl: layer.imageUrl,
				side: this.layerManager.activeSide
			});
			if (result.success) {
				toast.success('Background updated');
				return result.url;
			}
		} catch (e) {
			toast.error('Failed to set background');
		} finally {
			this.isProcessing = false;
		}
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
    // Crop is a fast, synchronous operation - no need for optimistic updates
    async handleCrop(layerId: string, croppedImageUrl: string, originalLayerName: string, originalImageUrl: string) {
        const toastId = toast.loading('Processing crop...');
        try {
            // 1. Upload the cropped image
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            const base64 = await fileToDataUrl(blob);

            const uploadRes = await uploadProcessedImage({
                imageBase64: base64,
                mimeType: blob.type
            });

            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error || 'Failed to upload cropped image');
            }

            const newImageUrl = uploadRes.url;
            
            // 3. Save to history directly (crop is synchronous, no need for optimistic update)
            await saveHistoryItem({
                originalUrl: originalImageUrl || croppedImageUrl,
                resultUrl: newImageUrl,
                action: 'crop',
                side: this.layerManager.activeSide,
                templateId: this.assetData.templateId
            });

            // 4. Refresh history to show the new crop item
            await this.historyManager.load();

            // 5. Add the cropped image as a layer
            const layerName = layerId === 'original-file' 
                    ? `Cropped Original` 
                    : `Cropped ${originalLayerName}`;

            const { layer, selection } = this.layerManager.createLayerObj(
                newImageUrl,
                layerName,
                {
                    x: 0,
                    y: 0,
                    width: this.assetData.width,
                    height: this.assetData.height
                },
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
}
