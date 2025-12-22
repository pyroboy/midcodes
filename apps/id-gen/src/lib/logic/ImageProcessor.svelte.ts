import { toast } from 'svelte-sonner';
import { 
	decomposeImage, upscaleImagePreview, removeElementFromLayer, 
	uploadProcessedImage, checkJobStatus
} from '$lib/remote/index.remote';
import { saveEnhancedImage } from '$lib/remote/enhance.remote';
import { fileToImageData, processImageLSB, imageDataToBlob } from '$lib/utils/bye-synth-id';
import { fileToDataUrl } from '$lib/utils/imageProcessing';
import type { LayerManager } from './LayerManager.svelte';
import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

export class ImageProcessor {
	isProcessing = $state(false);
	processingLayerId = $state<string | null>(null);

	constructor(
		private layerManager: LayerManager,
		private assetData: { id: string; width: number; height: number; templateId?: string }
	) {}

	/**
	 * Polls for job completion
	 */
	private async pollJobStatus(jobId: string, onUpdate?: (status: string) => void): Promise<any> {
		let attempts = 0;
		const maxAttempts = 60; // 5 minutes at 5s interval
		
		while (attempts < maxAttempts) {
			const res = await checkJobStatus({ jobId });
			
			if (res.status === 'completed') {
				return res.result;
			}
			
			if (res.status === 'failed') {
				throw new Error(res.error || 'Job failed');
			}
			
			if (onUpdate) onUpdate(res.status);
			
			// Wait 5 seconds
			await new Promise(resolve => setTimeout(resolve, 5000));
			attempts++;
		}
		
		throw new Error('Polling timed out after 5 minutes');
	}

	// --- 1. Decompose ---
	async decompose(params: {
		imageUrl: string;
		numLayers: number;
		prompt?: string;
		negativePrompt?: string;
		settings: any;
	}) {
		this.isProcessing = true;
		const toastId = toast.loading('Queuing decomposition task...');

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

			toast.loading('Processing decomposition in background...', { id: toastId });
			
			const pollResult = await this.pollJobStatus(result.jobId, (status) => {
				if (status === 'processing') toast.loading('AI is processing layers...', { id: toastId });
			});

			if (pollResult && pollResult.layers) {
				// Hide original if decomposing background
				if (params.imageUrl.includes('original')) {
					this.layerManager.showOriginalLayer = false;
				}

				pollResult.layers.forEach((l: any, i: number) => {
					const { layer, selection } = this.layerManager.createLayerObj(
						l.url,
						`Layer ${i + 1}`,
						{ x: 0, y: 0, width: l.width, height: l.height },
						this.layerManager.activeSide,
						this.layerManager.currentLayers.length
					);
					this.layerManager.addLayer(layer, selection);
				});
				toast.success('Decomposition complete', { id: toastId });
				return true;
			}
			throw new Error('Decomposition result missing layers');
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || 'Failed', { id: toastId });
			return false;
		} finally {
			this.isProcessing = false;
		}
	}

	// --- 2. Upscale (with SynthID Removal) ---
	async upscaleLayer(layer: DecomposedLayer | { imageUrl: string; id: string }, model: string, removeWatermark = false) {
		this.isProcessing = true;
		this.processingLayerId = layer.id;
		const toastId = toast.loading('Queuing upscale task...');

		try {
			let targetUrl = layer.imageUrl;

			if (removeWatermark) {
				toast.loading('Removing SynthID...', { id: toastId });
				targetUrl = await this.removeWatermarkLogic(targetUrl);
			}

			const result = await upscaleImagePreview({
				imageUrl: targetUrl,
				model: model as any,
				side: this.layerManager.activeSide,
				templateId: this.assetData.templateId || null
			});

			if (!result.success || !result.jobId) {
				throw new Error(result.error || 'Failed to queue upscale');
			}

			toast.loading('Processing upscale in background...', { id: toastId });

			const pollResult = await this.pollJobStatus(result.jobId);

			if (pollResult && pollResult.resultUrl) {
				if (layer.id === 'original-file') {
					toast.success('Upscale complete', { id: toastId });
					return pollResult.resultUrl;
				} else {
					this.layerManager.updateSelection(layer.id, { layerImageUrl: pollResult.resultUrl });
					const l = this.layerManager.currentLayers.find(x => x.id === layer.id);
					if(l) l.imageUrl = pollResult.resultUrl;
					toast.success('Layer upscaled', { id: toastId });
				}
			}
		} catch (e: any) {
			toast.error(e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
			this.processingLayerId = null;
		}
	}

	// --- 3. Remove Element ---
	async removeElement(layer: DecomposedLayer, prompt: string) {
		this.isProcessing = true;
		this.processingLayerId = layer.id;
		const toastId = toast.loading(`Queuing removal of "${prompt}"...`);
		try {
			const result = await removeElementFromLayer({
				imageUrl: layer.imageUrl,
				prompt,
				imageWidth: this.assetData.width,
				imageHeight: this.assetData.height,
				side: layer.side,
				templateId: this.assetData.templateId || null
			});

			if (!result.success || !result.jobId) {
				throw new Error(result.error || 'Failed to queue removal');
			}

			toast.loading('Processing removal in background...', { id: toastId });

			const pollResult = await this.pollJobStatus(result.jobId);

			if (pollResult && pollResult.resultUrl) {
				const { layer: newLayer, selection } = this.layerManager.createLayerObj(
					pollResult.resultUrl,
					`Removed: ${prompt.slice(0, 10)}`,
					layer.bounds,
					layer.side,
					this.layerManager.currentLayers.length
				);
				this.layerManager.addLayer(newLayer, selection);
				toast.success('Element removed', { id: toastId });
			}
		} catch (e: any) {
			toast.error(e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
			this.processingLayerId = null;
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
    async handleCrop(layerId: string, croppedImageUrl: string, originalLayerName: string) {
        const toastId = toast.loading('Processing crop...');
        try {
            // 1. Upload the cropped image
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            // Convert to base64 for uploadProcessedImage
            // Or use a helper
            const base64 = await fileToDataUrl(blob);

            const uploadRes = await uploadProcessedImage({
                imageBase64: base64,
                mimeType: blob.type
            });

            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error || 'Failed to upload cropped image');
            }

            const newImageUrl = uploadRes.url;
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
