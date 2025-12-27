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
		if (this.isProcessing) {
			toast.warning('Another operation is in progress');
			return false;
		}

		const toastId = toast.loading('Queuing decomposition task...');
		this.isProcessing = true;

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
		} finally {
			this.isProcessing = false;
		}
	}

	// --- 2. Upscale (with SynthID Removal) ---
	async upscaleLayer(
		layer: DecomposedLayer | { imageUrl: string; id: string },
		model: string,
		removeWatermark = false
	) {
		if (this.isProcessing) return false;

		const toastId = toast.loading('Queuing upscale task...');
		this.isProcessing = true;

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
		} finally {
			this.isProcessing = false;
		}

	}

	// --- 3. Remove Element ---
	async removeElement(layer: DecomposedLayer, prompt: string) {
		if (this.isProcessing) return false;
		this.isProcessing = true;

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
		} finally {
			this.isProcessing = false;
		}

	}

	// --- 4. Client-Side Merge ---
	async mergeSelectedLayers() {
		if (this.isProcessing) return;

		const ids = Array.from(this.layerManager.selectedForMerge);
		const layers = this.layerManager.currentLayers
			.filter((l) => ids.includes(l.id))
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

			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
			if (!blob) throw new Error('Canvas blob failed');
			const base64 = await fileToDataUrl(blob);

			const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });
			if (upload.success && upload.url) {
				// Remove old
				ids.forEach((id) => this.layerManager.removeLayer(id));

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

	// --- 4.5. Lasso Cut ---
	async cutPolygon(layerId: string | null, points: { x: number; y: number }[], sourceImageUrl: string) {
		if (this.isProcessing) return;

		if (!layerId || points.length < 3 || !sourceImageUrl) {
			console.warn('cutPolygon: Missing arguments', { layerId, pointsLen: points.length, sourceImageUrl });
			return;
		}

		this.isProcessing = true;
		const toastId = toast.loading('Cutting selection...');

		try {
			// 1. Load source image via PROXY to avoid CORS
			const proxiedUrl = getProxiedUrl(sourceImageUrl) || sourceImageUrl;

			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const i = new Image();
				i.crossOrigin = 'anonymous';
				i.onload = () => resolve(i);
				i.onerror = reject;
				i.src = proxiedUrl;
			});

			// Canvas Dimensions (Target Space)
			const canvasW = this.assetData.width;
			const canvasH = this.assetData.height;

			// Source Layer Position & Dimensions
			let layerX = 0;
			let layerY = 0;
			let layerW = canvasW;
			let layerH = canvasH;

			if (layerId && layerId !== 'original-file') {
				const layer = this.layerManager.currentLayers.find(l => l.id === layerId);
				if (layer && layer.bounds) {
					layerX = layer.bounds.x;
					layerY = layer.bounds.y;
					layerW = layer.bounds.width;
					layerH = layer.bounds.height;
				}
			} else {
				// For 'original-file' (Background), we must replicate 'object-fit: contain' logic
				// to match what the user sees on screen.
				const natW = img.naturalWidth;
				const natH = img.naturalHeight;
				
				// Calculate scaling to 'contain' within canvasW/canvasH
				const scale = Math.min(canvasW / natW, canvasH / natH);
				
				layerW = natW * scale;
				layerH = natH * scale;
				
				// Center it
				layerX = (canvasW - layerW) / 2;
				layerY = (canvasH - layerH) / 2;
			}

			// Calculate "Cut" Bounding Box in CANVAS COORDINATES
			// Lasso points are 0-1 relative to CANVAS
			const canvasPoints = points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }));
			const minX = Math.floor(Math.min(...canvasPoints.map(p => p.x)));
			const minY = Math.floor(Math.min(...canvasPoints.map(p => p.y)));
			const maxX = Math.ceil(Math.max(...canvasPoints.map(p => p.x)));
			const maxY = Math.ceil(Math.max(...canvasPoints.map(p => p.y)));

			const bboxW = maxX - minX;
			const bboxH = maxY - minY;

			if (bboxW <= 0 || bboxH <= 0) throw new Error('Invalid selection dimensions');

			console.log('Cutting polygon:', { minX, minY, bboxW, bboxH, layerX, layerY });

			// --- Create Cut Canvas ---
			const cutCanvas = document.createElement('canvas');
			cutCanvas.width = bboxW;
			cutCanvas.height = bboxH;
			const cutCtx = cutCanvas.getContext('2d', { alpha: true, willReadFrequently: true });
			if (!cutCtx) throw new Error('No cut context');

			// --- STEP 1: Draw the source image portion ---
			const drawX = layerX - minX;
			const drawY = layerY - minY;
			cutCtx.drawImage(img, drawX, drawY, layerW, layerH);

			// --- STEP 2: Convert polygon points to local canvas coordinates ---
			const localPoints = canvasPoints.map(p => ({
				x: p.x - minX,
				y: p.y - minY
			}));

			// --- STEP 3: Use pixel manipulation for guaranteed transparency ---
			// This approach manually sets alpha=0 for pixels outside the polygon
			const imageData = cutCtx.getImageData(0, 0, bboxW, bboxH);
			const data = imageData.data;

			// Point-in-polygon test using ray casting algorithm
			function isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
				let inside = false;
				for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
					const xi = polygon[i].x, yi = polygon[i].y;
					const xj = polygon[j].x, yj = polygon[j].y;

					if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
						inside = !inside;
					}
				}
				return inside;
			}

			// Set alpha to 0 for all pixels outside the polygon
			for (let y = 0; y < bboxH; y++) {
				for (let x = 0; x < bboxW; x++) {
					const idx = (y * bboxW + x) * 4;
					if (!isPointInPolygon(x, y, localPoints)) {
						data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
					}
				}
			}

			// Put the modified image data back
			cutCtx.putImageData(imageData, 0, 0);

			// DEBUG: Verify transparency
			const cornerAlpha = data[3];
			console.log('[cutPolygon] Corner pixel alpha (should be 0):', cornerAlpha);
			const centerIdx = (Math.floor(bboxH / 2) * bboxW + Math.floor(bboxW / 2)) * 4;
			console.log('[cutPolygon] Center pixel alpha:', data[centerIdx + 3]);

			const cutBlob = await new Promise<Blob | null>(r => cutCanvas.toBlob(r, 'image/png'));
			if (!cutBlob) throw new Error('Cut blob failed');
			console.log('[cutPolygon] PNG blob size:', cutBlob.size, 'bytes');

			const cutBase64 = await fileToDataUrl(cutBlob);
			console.log('[cutPolygon] Uploading cut result...');
			const cutUpload = await uploadProcessedImage({ imageBase64: cutBase64, mimeType: 'image/png' });

			// --- Apply Changes ---
			if (cutUpload.success && cutUpload.url) {
				// 2. Add new layer
				const originLayer = this.layerManager.currentLayers.find(l => l.id === layerId);
				const originLayerName = originLayer ? originLayer.name : 'Background';
				
				const { layer: newLayer, selection } = this.layerManager.createLayerObj(
					cutUpload.url,
					`${originLayerName} (Copy)`,
					{ x: minX, y: minY, width: bboxW, height: bboxH }, // Positioned where the cut happened
					this.layerManager.activeSide,
					this.layerManager.currentLayers.length + 1
				);
				// Ensure independent layer
				newLayer.parentId = undefined;
				this.layerManager.addLayer(newLayer, selection);
				
				// 3. Save to History
				const currentLayersSnapshot = this.layerManager.currentLayers.map(l => ({
					imageUrl: l.imageUrl,
					name: l.name,
					bounds: l.bounds,
					width: l.bounds?.width || 0,
					height: l.bounds?.height || 0,
					zIndex: l.zIndex,
					side: l.side
				}));

				await saveHistoryItem({
					originalUrl: sourceImageUrl,
					resultUrl: cutUpload.url,
					action: 'lasso-copy',
					side: this.layerManager.activeSide as 'front' | 'back',
					templateId: this.assetData.templateId,
					layers: currentLayersSnapshot
				});
				
				// Refresh history list
				this.historyManager.load();

				toast.success('Copied selection to new layer', { id: toastId });
			} else {
				throw new Error('Failed to upload cut result');
			}

		} catch (e: any) {
			console.error('Cut error details:', e);
			toast.error('Cut failed: ' + e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
		}
	}

	// --- 5. Set As Main Background ---
	async setAsMain(layerId: string) {
		if (this.isProcessing) return;

		const layer = this.layerManager.currentLayers.find((l) => l.id === layerId);
		if (!layer) return;

		if (!confirm(`Set this layer as the ${this.layerManager.activeSide} background?`)) return;

		this.isProcessing = true;
		const toastId = toast.loading('Preparing background variants...');

		try {
			// 1. Fetch the layer image
			const response = await fetch(layer.imageUrl);
			if (!response.ok) throw new Error('Failed to fetch layer image');
			const blob = await response.blob();

			// 2. Generate variants (thumb, preview) client-side
			toast.loading('Generating thumbnails...', { id: toastId });
			const { generateBackgroundVariants } = await import('$lib/utils/templateVariants');
			const variants = await generateBackgroundVariants(blob);

			// 3. Convert blobs to base64 for upload
			const toBase64 = async (b: Blob): Promise<string> => {
				const reader = new FileReader();
				return new Promise((resolve, reject) => {
					reader.onloadend = () => {
						const result = reader.result as string;
						// Remove data URL prefix to get raw base64
						resolve(result.split(',')[1] || result);
					};
					reader.onerror = reject;
					reader.readAsDataURL(b);
				});
			};

			const [fullBase64, thumbBase64, previewBase64] = await Promise.all([
				toBase64(variants.full),
				toBase64(variants.thumb),
				toBase64(variants.preview)
			]);

			// 4. Upload all variants and update database
			toast.loading('Uploading variants...', { id: toastId });
			const { updateTemplateBackgroundWithVariants } = await import(
				'$lib/remote/templates.update.remote'
			);

			const result = await updateTemplateBackgroundWithVariants({
				assetId: this.assetData.id,
				side: this.layerManager.activeSide,
				fullBase64,
				thumbBase64,
				previewBase64,
				contentType: blob.type || 'image/png'
			});

			if (result.success && result.urls) {
				toast.success('Background updated with thumbnails', { id: toastId });
				return result.urls.fullUrl;
			} else {
				throw new Error(result.error || 'Failed to update background');
			}
		} catch (e) {
			console.error('setAsMain error:', e);
			toast.error(e instanceof Error ? e.message : 'Failed to set background', { id: toastId });
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
	async handleCrop(
		layerId: string,
		croppedImageUrl: string,
		originalLayerName: string,
		originalImageUrl: string
	) {
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
			const layerName =
				layerId === 'original-file' ? `Cropped Original` : `Cropped ${originalLayerName}`;

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
	// --- 7. Selection Actions (Phase 3) ---

	async fillSelection(points: NormalizedPoint[], color: string) {
		if (this.isProcessing) return;
		if (points.length < 3) return;

		this.isProcessing = true;
		const toastId = toast.loading('Filling selection...');

		try {
			const canvasW = this.assetData.width;
			const canvasH = this.assetData.height;

			const canvas = document.createElement('canvas');
			canvas.width = canvasW;
			canvas.height = canvasH;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('No context');

			// Draw shape
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

			// Calculate bounds
			const xs = points.map((p) => p.x * canvasW);
			const ys = points.map((p) => p.y * canvasH);
			const minX = Math.floor(Math.min(...xs));
			const minY = Math.floor(Math.min(...ys));
			const maxX = Math.ceil(Math.max(...xs));
			const maxY = Math.ceil(Math.max(...ys));
			const width = maxX - minX;
			const height = maxY - minY;

			// Convert to blob and upload
			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
			if (!blob) throw new Error('Blob creation failed');
			const base64 = await fileToDataUrl(blob);

			const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });

			if (upload.success && upload.url) {
				const { layer, selection } = this.layerManager.createLayerObj(
					upload.url,
					'Fill Layer',
					{ x: 0, y: 0, width: canvasW, height: canvasH }, // Full size transparent with fill
					this.layerManager.activeSide,
					this.layerManager.currentLayers.length
				);
				// Override bounds to efficient size if we wanted, but keeping simple for now
				// Actually, let's use the bounds we calculated for cleaner metadata
				layer.bounds = { x: minX, y: minY, width, height };
				
				// BUT: The image created is full canvas size. 
				// To support optimized bounds, we should have cropped the canvas.
				// For now, let's stick to full canvas to avoid alignment issues 
				// unless we implement the crop logic here. 
				// Let's stick to full canvas for reliability first, then optimize.
				layer.bounds = { x: 0, y: 0, width: canvasW, height: canvasH };

				this.layerManager.addLayer(layer, selection);
				this.historyManager.addLocalEntry('fill', layer.id);
				toast.success('Filled selection created', { id: toastId });
			} else {
				throw new Error('Upload failed');
			}
		} catch (e: any) {
			console.error('Fill error:', e);
			toast.error('Fill failed: ' + e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
		}
	}

	async deleteSelection(layerId: string, points: NormalizedPoint[]) {
		if (this.isProcessing) return;
		if (!layerId || points.length < 3) return;

		this.isProcessing = true;
		const toastId = toast.loading('Creating mask...');

		try {
			// Phase 6 Precursor: Non-destructive masking
			// We must generate the mask RELATIVE TO THE LAYER'S BOUNDS
			// because the mask is applied to the <img> element which matches the layer's bounds.

			const layer = this.layerManager.currentLayers.find((l) => l.id === layerId);
			if (!layer) throw new Error('Layer not found');

			// Determine layer bounds (in canvas pixels)
			// If layer has no bounds (e.g. original background might not?), assume full canvas
			const canvasW = this.assetData.width;
			const canvasH = this.assetData.height;
			
			const layerX = layer.bounds?.x ?? 0;
			const layerY = layer.bounds?.y ?? 0;
			const layerW = layer.bounds?.width ?? canvasW;
			const layerH = layer.bounds?.height ?? canvasH;

			// Check for existing mask
			const existingMask = this.layerManager.getMask(layerId);
			
			const canvas = document.createElement('canvas');
			canvas.width = layerW;
			canvas.height = layerH;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('No context');

			if (existingMask) {
				// If existing mask exists, draw it first
				// We assume existing mask matches layer bounds (robustness assumption)
				const img = new Image();
				await new Promise((resolve) => {
					img.onload = resolve;
					img.src = existingMask.maskData;
				});
				ctx.drawImage(img, 0, 0, layerW, layerH);
			} else {
				// Initialize as full opaque (white)
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, layerW, layerH);
			}

			// Draw the ERASE polygon
			// We must translate separate canvas points to layer-local coordinates
			// Point (px) = Point (normalized) * CanvasSize
			// LocalPoint (px) = Point (px) - LayerOffset
			
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

			// Export
			const base64 = canvas.toDataURL('image/png');
			
			this.layerManager.setMask(layerId, base64, {
				x: layerX, y: layerY, width: layerW, height: layerH
			});

			toast.success('Area erased', { id: toastId });
			this.historyManager.addLocalEntry('erase', layerId);

		} catch (e: any) {
			console.error('Delete error:', e);
			toast.error('Delete failed: ' + e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
		}
	}
	
	// --- 8. Background Removal (Manual) ---
	async removeLayerBackground(layerId: string) {
		if (this.isProcessing) return;
		
		const layer = this.layerManager.currentLayers.find(l => l.id === layerId);
		if (!layer) return;

		this.isProcessing = true;
		const toastId = toast.loading('Removing background...');

		try {
			// 1. Fetch current image
			const response = await fetch(layer.imageUrl);
			const blob = await response.blob();
			
			// 2. Call cloud API
			const processedBlob = await removeBackgroundCloud(blob);
			
			// 3. Convert to base64 and Upload
			const base64 = await fileToDataUrl(processedBlob);
			const upload = await uploadProcessedImage({ imageBase64: base64, mimeType: 'image/png' });
			
			if (upload.success && upload.url) {
				// 4. Update layer
				this.layerManager.updateLayerImageUrl(layerId, upload.url);
				
				// 5. History
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
		} catch (e: any) {
			console.error('BG Remove error:', e);
			toast.error('BG removal failed: ' + e.message, { id: toastId });
		} finally {
			this.isProcessing = false;
		}
	}
}
