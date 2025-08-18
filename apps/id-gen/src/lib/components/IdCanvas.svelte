<script lang="ts">
	import { onMount, createEventDispatcher, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { debounce } from 'lodash-es';
	import type { TemplateElement } from '../stores/templateStore';
	import { CoordinateSystem } from '$lib/utils/coordinateSystem';

	let {
		elements,
		backgroundUrl,
		formData,
		fileUploads,
		imagePositions,
		fullResolution = false,
		isDragging = false,
		showBoundingBoxes = false, // Flag to control bounding box visibility
		pixelDimensions = null
	}: {
		elements: TemplateElement[];
		backgroundUrl: string;
		formData: { [key: string]: string };
		fileUploads: { [key: string]: File | null };
		imagePositions: {
			[key: string]: { x: number; y: number; width: number; height: number; scale: number };
		};
		fullResolution?: boolean;
		isDragging?: boolean;
		showBoundingBoxes?: boolean;
		pixelDimensions?: { width: number; height: number } | null;
	} = $props();

	const dispatch = createEventDispatcher<{
		error: { message: string; code: string };
		ready: { isReady: boolean };
		rendered: void;
	}>();

	type CanvasError = {
		code: string;
		message: string;
	};

	class CanvasOperationError extends Error {
		code: string;
		constructor(message: string, code: string) {
			super(message);
			this.code = code;
			this.name = 'CanvasOperationError';
		}
	}

	let displayCanvas: HTMLCanvasElement;
	let bufferCanvas: HTMLCanvasElement;
	let offscreenCanvas: OffscreenCanvas | null = null;
	let displayCtx: CanvasRenderingContext2D | null = null;
	let bufferCtx: CanvasRenderingContext2D | null = null;
	let isReady = false;
	let isRendering = false;
	let renderRequested = false;
	let isMounted = false;

	const DEBOUNCE_DELAY = 20;
	const PREVIEW_SCALE = 0.5;
	const LEGACY_WIDTH = 1013;
	const LEGACY_HEIGHT = 638;
	const LOW_RES_SCALE = 0.2;
	const MAX_CACHE_SIZE = 20;
	const MEMORY_CHECK_INTERVAL = 10000;

	// Dynamic canvas dimensions based on pixelDimensions prop
	let canvasDimensions = $derived(() => {
		if (pixelDimensions && pixelDimensions.width > 0 && pixelDimensions.height > 0) {
			return { width: pixelDimensions.width, height: pixelDimensions.height };
		}
		return { width: LEGACY_WIDTH, height: LEGACY_HEIGHT };
	});

	// Calculate canvas scaling with adaptive preview sizing for custom dimensions
	let canvasScaling = $derived(() => {
		const dims = canvasDimensions();
		if (fullResolution) {
			// Full resolution uses 1:1 scaling
			return { scale: 1, canvasWidth: dims.width, canvasHeight: dims.height };
		} else {
			// Adaptive preview scaling based on template size
			const maxPreviewWidth = 600; // Maximum preview width
			const maxPreviewHeight = 400; // Maximum preview height

			// Calculate scale factors to fit within preview bounds
			const widthScale = maxPreviewWidth / dims.width;
			const heightScale = maxPreviewHeight / dims.height;

			// Use the smaller scale to ensure it fits within both dimensions
			const scale = Math.min(widthScale, heightScale, 1); // Don't scale up beyond 1:1

			const previewWidth = dims.width * scale;
			const previewHeight = dims.height * scale;

			return {
				scale,
				canvasWidth: previewWidth,
				canvasHeight: previewHeight
			};
		}
	});

	// Coordinate system using proper canvas scaling (matches TemplateForm approach)
	let coordSystem = $derived(() => {
		const dims = canvasDimensions();
		const scaling = canvasScaling();
		return new CoordinateSystem(dims.width, dims.height, scaling.scale);
	});

	const imageCache = new Map<string, { image: HTMLImageElement; lastUsed: number }>();
	const lowResImageCache = new Map<string, { image: HTMLImageElement; lastUsed: number }>();
	let memoryCheckInterval: ReturnType<typeof setInterval>;

	function cleanImageCache() {
		const now = Date.now();
		const maxAge = 5 * 60 * 1000;

		for (const [url, entry] of imageCache) {
			if (now - entry.lastUsed > maxAge) {
				URL.revokeObjectURL(url);
				imageCache.delete(url);
			}
		}

		for (const [url, entry] of lowResImageCache) {
			if (now - entry.lastUsed > maxAge) {
				URL.revokeObjectURL(url);
				lowResImageCache.delete(url);
			}
		}

		while (imageCache.size > MAX_CACHE_SIZE) {
			let oldestUrl: string | null = null;
			let oldestTime = Infinity;

			for (const [url, entry] of imageCache) {
				if (entry.lastUsed < oldestTime) {
					oldestTime = entry.lastUsed;
					oldestUrl = url;
				}
			}

			if (oldestUrl) {
				URL.revokeObjectURL(oldestUrl);
				imageCache.delete(oldestUrl);
			}
		}
	}

	function checkMemoryUsage() {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
				console.warn('High memory usage detected, cleaning caches...');
				cleanImageCache();
			}
		}
	}

	function disposeCanvas(canvas: HTMLCanvasElement | null) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
		canvas.width = 0;
		canvas.height = 0;
	}

	async function loadAndCacheImage(
		url: string,
		lowRes: boolean = false
	): Promise<HTMLImageElement> {
		if (!browser || !url) {
			throw new CanvasOperationError(
				'Cannot load image: browser not available or URL is empty',
				'IMAGE_LOAD_ERROR'
			);
		}

		const cache = lowRes ? lowResImageCache : imageCache;
		const cacheEntry = cache.get(url);

		// Return cached image if available and update last used time
		if (cacheEntry?.image) {
			cacheEntry.lastUsed = Date.now();
			return cacheEntry.image;
		}

		// Clean cache if it's getting too large
		if (cache.size >= MAX_CACHE_SIZE) {
			cleanImageCache();
		}

		try {
			const img = await loadImage(url);

			if (lowRes) {
				const lowResImg = await createLowResImage(img);
				cache.set(url, { image: lowResImg, lastUsed: Date.now() });
				return lowResImg;
			}

			cache.set(url, { image: img, lastUsed: Date.now() });
			return img;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			throw new CanvasOperationError(
				`Failed to load and cache image: ${message}`,
				'IMAGE_CACHE_ERROR'
			);
		}
	}

	export function isCanvasReady(): { ready: boolean; error?: CanvasError } {
		try {
			if (!browser) {
				throw new CanvasOperationError(
					'Canvas operations are only available in browser environment',
					'BROWSER_UNAVAILABLE'
				);
			}

			if (!displayCanvas) {
				throw new CanvasOperationError(
					'Display canvas is not initialized',
					'DISPLAY_CANVAS_MISSING'
				);
			}

			if (!bufferCanvas) {
				throw new CanvasOperationError('Buffer canvas is not initialized', 'BUFFER_CANVAS_MISSING');
			}

			if (!offscreenCanvas) {
				throw new CanvasOperationError(
					'Offscreen canvas is not initialized',
					'OFFSCREEN_CANVAS_MISSING'
				);
			}

			if (!displayCtx || !bufferCtx) {
				throw new CanvasOperationError('Canvas context is not initialized', 'CONTEXT_MISSING');
			}

			if (!isReady) {
				throw new CanvasOperationError('Canvas is not ready for operations', 'CANVAS_NOT_READY');
			}

			return { ready: true };
		} catch (error) {
			if (error instanceof CanvasOperationError) {
				return {
					ready: false,
					error: {
						code: error.code,
						message: error.message
					}
				};
			}
			return {
				ready: false,
				error: {
					code: 'UNKNOWN_ERROR',
					message: 'An unexpected error occurred while checking canvas readiness'
				}
			};
		}
	}

	onMount(async () => {
		if (browser) {
			isMounted = true;
			await initializeCanvases();
			memoryCheckInterval = setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL);
		}
	});

	onDestroy(() => {
		if (memoryCheckInterval) {
			clearInterval(memoryCheckInterval);
		}
		disposeCanvas(displayCanvas);
		disposeCanvas(bufferCanvas);
		cleanImageCache();
	});

	// Use reactive effect to handle canvas initialization when dependencies change
	$effect(() => {
		// Track dependencies that should trigger reinitializaton
		canvasDimensions();

		if (browser && !isReady && isMounted) {
			initializeCanvases();
		}
	});

	async function initializeCanvases() {
		if (!browser || !displayCanvas) {
			dispatch('error', {
				code: 'INITIALIZATION_ERROR',
				message: 'Cannot initialize canvas: browser or canvas not available'
			});
			return;
		}

		try {
			displayCtx = displayCanvas.getContext('2d');
			if (!displayCtx) {
				throw new CanvasOperationError(
					'Failed to get display canvas context',
					'DISPLAY_CONTEXT_ERROR'
				);
			}

			bufferCanvas = document.createElement('canvas');
			bufferCtx = bufferCanvas.getContext('2d');
			if (!bufferCtx) {
				throw new CanvasOperationError(
					'Failed to get buffer canvas context',
					'BUFFER_CONTEXT_ERROR'
				);
			}

			const dims = canvasDimensions();
			offscreenCanvas = new OffscreenCanvas(dims.width, dims.height);

			await new Promise((resolve) => requestAnimationFrame(resolve));

			isReady = true;
			await renderIdCard();
			dispatch('ready', { isReady: true });
		} catch (error) {
			isReady = false;
			const errorDetails =
				error instanceof CanvasOperationError
					? { code: error.code, message: error.message }
					: { code: 'INITIALIZATION_ERROR', message: 'Failed to initialize canvas' };

			dispatch('error', errorDetails);
		}
	}

	async function loadImage(url: string): Promise<HTMLImageElement> {
		if (!browser || !url) {
			throw new CanvasOperationError(
				'Cannot load image: browser not available or URL is empty',
				'IMAGE_LOAD_ERROR'
			);
		}

		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = () =>
				reject(new CanvasOperationError(`Failed to load image: ${url}`, 'IMAGE_LOAD_ERROR'));
			img.src = url;
		});
	}

	async function createLowResImage(img: HTMLImageElement): Promise<HTMLImageElement> {
		if (!browser) return img;

		try {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				throw new CanvasOperationError(
					'Failed to get context for low-res image creation',
					'LOWRES_CONTEXT_ERROR'
				);
			}

			const pxLimit = 400;
			let newWidth = img.width * LOW_RES_SCALE;
			let newHeight = img.height * LOW_RES_SCALE;

			if (newWidth > pxLimit || newHeight > pxLimit) {
				const aspectRatio = img.width / img.height;
				if (newWidth > newHeight) {
					newWidth = pxLimit;
					newHeight = newWidth / aspectRatio;
				} else {
					newHeight = pxLimit;
					newWidth = newHeight * aspectRatio;
				}
			}

			canvas.width = newWidth;
			canvas.height = newHeight;
			ctx.drawImage(img, 0, 0, newWidth, newHeight);

			return new Promise((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(
								new CanvasOperationError(
									'Failed to create blob for low-res image',
									'BLOB_CREATION_ERROR'
								)
							);
							return;
						}
						const lowResImg = new Image();
						lowResImg.onload = () => {
							disposeCanvas(canvas);
							resolve(lowResImg);
						};
						lowResImg.onerror = (error) =>
							reject(new CanvasOperationError('Failed to load low-res image', 'LOWRES_LOAD_ERROR'));
						const objectUrl = URL.createObjectURL(blob);
						lowResImg.src = objectUrl;
						lowResImg.onload = () => {
							URL.revokeObjectURL(objectUrl);
							resolve(lowResImg);
						};
					},
					'image/jpeg',
					0.5
				);
			});
		} catch (error) {
			console.error('Error creating low-res image:', error);
			return img; // Fallback to original image
		}
	}

	interface FontOptions {
		family?: string;
		size?: number;
		weight?: string | number;
		style?: 'normal' | 'italic' | 'oblique';
	}

	function getFontString(options: FontOptions): string {
		const { style = 'normal', weight = 400, size = 16, family = 'Arial' } = options;

		return `${style} ${weight} ${size}px "${family}"`;
	}

	function measureTextHeight(ctx: CanvasRenderingContext2D, options: FontOptions = {}): number {
		if (!browser) return 0;

		const previousFont = ctx.font;
		// Use a test string that includes ascenders and descenders
		const testString = 'WÁjpqy|{}();'; // This string includes various height cases

		try {
			ctx.font = getFontString(options);

			const metrics = ctx.measureText(testString);

			// Get the most accurate height measurements possible
			const height =
				Math.abs(metrics.actualBoundingBoxAscent || 0) +
				Math.abs(metrics.actualBoundingBoxDescent || 0);

			const fontHeight =
				Math.abs(metrics.fontBoundingBoxAscent || 0) +
				Math.abs(metrics.fontBoundingBoxDescent || 0);

			// Use em height as a fallback if metrics are not available
			const emHeight = (options.size || 16) * 1.2; // 1.2 is a typical line-height ratio

			// Return the largest of the available measurements to ensure text fits
			return Math.max(height, fontHeight, emHeight);
		} catch (error) {
			console.error('Error measuring text height:', error);
			// Fallback to a reasonable default based on font size
			return (options.size || 16) * 1.2;
		} finally {
			ctx.font = previousFont;
		}
	}
	const debouncedRender = debounce(() => {
		if (!renderRequested && browser) {
			renderRequested = true;
			requestAnimationFrame(renderIdCard);
		}
	}, DEBOUNCE_DELAY);

	async function renderIdCard() {
		const readinessCheck = isCanvasReady();
		if (!readinessCheck.ready || isRendering) {
			if (readinessCheck.error) {
				dispatch('error', readinessCheck.error);
			}
			return;
		}

		try {
			isRendering = true;
			renderRequested = false;

			const scaling = canvasScaling();
			const width = Math.round(scaling.canvasWidth);
			const height = Math.round(scaling.canvasHeight);

			if (bufferCanvas.width !== width || bufferCanvas.height !== height) {
				bufferCanvas.width = width;
				bufferCanvas.height = height;
			}
			await renderCanvas(bufferCtx!, scaling.scale, false);

			if (displayCanvas.width !== width || displayCanvas.height !== height) {
				displayCanvas.width = width;
				displayCanvas.height = height;
			}
			displayCtx!.drawImage(bufferCanvas, 0, 0);

			dispatch('rendered');
			checkMemoryUsage();
		} catch (error) {
			const errorDetails =
				error instanceof CanvasOperationError
					? { code: error.code, message: error.message }
					: { code: 'RENDER_ERROR', message: 'Failed to render ID card' };

			dispatch('error', errorDetails);
		} finally {
			isRendering = false;
			if (renderRequested && browser) {
				requestAnimationFrame(renderIdCard);
			}
		}
	}

	async function renderCanvas(ctx: CanvasRenderingContext2D, scale: number, isOffScreen: boolean) {
		// Create coordinate system for this specific render context
		const dims = canvasDimensions();
		const renderCoordSystem = new CoordinateSystem(dims.width, dims.height, scale);
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if (backgroundUrl) {
			try {
				const backgroundImage = await loadAndCacheImage(backgroundUrl);
				ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
			} catch (error) {
				dispatch('error', {
					code: 'BACKGROUND_LOAD_ERROR',
					message: 'Error loading background image'
				});
			}
		}

		for (const element of elements) {
			try {
				if (element.type === 'text' || element.type === 'selection') {
					renderTextElement(ctx, element, renderCoordSystem);
				} else if (element.type === 'photo' || element.type === 'signature') {
					await renderImageElement(ctx, element, renderCoordSystem, isOffScreen);
				}
			} catch (error) {
				dispatch('error', {
					code: 'ELEMENT_RENDER_ERROR',
					message: `Error rendering element ${element.variableName}`
				});
			}
		}
	}

	function renderTextElement(
		ctx: CanvasRenderingContext2D,
		element: TemplateElement,
		renderCoordSystem: CoordinateSystem
	) {
		if (element.type !== 'text' && element.type !== 'selection') return;

		try {
			const fontSize = Math.round((element.size || 12) * renderCoordSystem.scale);
			const fontOptions = {
				family: element.font,
				size: fontSize,
				weight: element.fontWeight,
				style: element.fontStyle
			};
			ctx.font = getFontString(fontOptions);
			ctx.fillStyle = element.color || 'black';
			ctx.textAlign = element.alignment as CanvasTextAlign;
			ctx.textBaseline = 'middle';

			let text = '';
			if (element.type === 'selection') {
				text = formData[element.variableName] || element.options?.[0] || '';
			} else {
				text = formData[element.variableName] || '';
			}

			const transform = element.textTransform || 'none';
			if (transform === 'uppercase') {
				text = text.toUpperCase();
			} else if (transform === 'lowercase') {
				text = text.toLowerCase();
			} else if (transform === 'capitalize') {
				text = text
					.split(' ')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
					.join(' ');
			}

			// Use coordinate system for consistent positioning
			const position = renderCoordSystem.storageToPreview({
				x: element.x || 0,
				y: element.y || 0
			});
			const dimensions = renderCoordSystem.storageToPreviewDimensions({
				width: element.width || 0,
				height: element.height || 0
			});

			const elementX = Math.round(position.x);
			const elementY = Math.round(position.y);
			const elementWidth = Math.round(dimensions.width);
			const elementHeight = Math.round(dimensions.height);

			// Draw red bounding box if enabled
			if (showBoundingBoxes) {
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 1;
				ctx.strokeRect(elementX, elementY, elementWidth, elementHeight);
			}

			let x = elementX;
			if (element.alignment === 'center') {
				x += Math.round(elementWidth / 2);
			} else if (element.alignment === 'right') {
				x += elementWidth;
			}

			const textHeight = measureTextHeight(ctx, fontOptions);
			const y = Math.round(elementY + elementHeight / 2); // Center vertically within element height

			if (element.textDecoration === 'underline') {
				const metrics = ctx.measureText(text);
				const lineY = Math.round(y + textHeight / 2); // Adjust underline position
				ctx.beginPath();
				ctx.moveTo(Math.round(x - (element.alignment === 'right' ? metrics.width : 0)), lineY);
				ctx.lineTo(Math.round(x + (element.alignment === 'left' ? metrics.width : 0)), lineY);
				ctx.strokeStyle = element.color || 'black';
				ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.05));
				ctx.stroke();
			}

			if (typeof element.opacity === 'number') {
				ctx.globalAlpha = element.opacity;
			}

			ctx.fillText(text, x, y);
			ctx.globalAlpha = 1;
		} catch (error: any) {
			throw new CanvasOperationError(
				`Failed to render text element: ${element.variableName}`,
				'TEXT_RENDER_ERROR'
			);
		}
	}

	async function renderImageElement(
		ctx: CanvasRenderingContext2D,
		element: TemplateElement,
		renderCoordSystem: CoordinateSystem,
		isOffScreen: boolean
	) {
		if (element.type !== 'photo' && element.type !== 'signature') return;

		try {
			const file = fileUploads[element.variableName];
			const pos = imagePositions[element.variableName];

			// Use coordinate system for consistent positioning
			const position = renderCoordSystem.storageToPreview({
				x: element.x || 0,
				y: element.y || 0
			});
			const dimensions = renderCoordSystem.storageToPreviewDimensions({
				width: element.width || 100,
				height: element.height || 100
			});

			const elementX = Math.round(position.x);
			const elementY = Math.round(position.y);
			const elementWidth = Math.round(dimensions.width);
			const elementHeight = Math.round(dimensions.height);

			// Draw red bounding box if enabled
			if (showBoundingBoxes) {
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 1;
				ctx.strokeRect(elementX, elementY, elementWidth, elementHeight);
			}

			ctx.save();
			ctx.beginPath();
			ctx.rect(elementX, elementY, elementWidth, elementHeight);
			ctx.clip();

			if (file) {
				try {
					const image = await loadAndCacheImage(
						URL.createObjectURL(file),
						isDragging && !isOffScreen && !(element.type === 'signature')
					);
					const imgAspectRatio = image.width / image.height;
					const elementAspectRatio = elementWidth / elementHeight;

					let drawWidth = Math.round(elementWidth * (pos.scale || 1));
					let drawHeight = Math.round(elementHeight * (pos.scale || 1));

					if (imgAspectRatio > elementAspectRatio) {
						drawHeight = Math.round(drawWidth / imgAspectRatio);
					} else {
						drawWidth = Math.round(drawHeight * imgAspectRatio);
					}

					// Apply position offset from imagePositions, scaled through coordinate system
					const offsetPosition = renderCoordSystem.storageToPreview({
						x: pos.x || 0,
						y: pos.y || 0
					});

					const x = Math.round(elementX + (elementWidth - drawWidth) / 2 + offsetPosition.x);
					const y = Math.round(elementY + (elementHeight - drawHeight) / 2 + offsetPosition.y);

					if (element.type === 'signature') {
						ctx.globalCompositeOperation = 'multiply';
					}

					ctx.drawImage(image, x, y, drawWidth, drawHeight);
					ctx.globalCompositeOperation = 'source-over';
				} catch (error: any) {
					if (!isOffScreen) {
						renderPlaceholder(
							ctx,
							elementX,
							elementY,
							elementWidth,
							elementHeight,
							'Error Photo',
							renderCoordSystem.scale
						);
					}
					throw new CanvasOperationError(
						`Failed to load image for ${element.variableName}: ${error.message || 'Unknown error'}`,
						'IMAGE_RENDER_ERROR'
					);
				}
			} else if (!isOffScreen) {
				renderPlaceholder(
					ctx,
					elementX,
					elementY,
					elementWidth,
					elementHeight,
					element.type,
					renderCoordSystem.scale
				);
			}

			ctx.restore();
		} catch (error: any) {
			throw new CanvasOperationError(
				`Failed to render image element: ${element.variableName}`,
				'IMAGE_RENDER_ERROR'
			);
		}
	}

	function renderPlaceholder(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		type: string,
		scale: number
	) {
		if (!browser) return;

		try {
			const roundedX = Math.round(x);
			const roundedY = Math.round(y);
			const roundedWidth = Math.round(width);
			const roundedHeight = Math.round(height);

			ctx.fillStyle = '#f0f0f0';
			ctx.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
			ctx.strokeStyle = '#999';
			ctx.strokeRect(roundedX, roundedY, roundedWidth, roundedHeight);
			ctx.fillStyle = '#999';
			ctx.font = `${Math.round(12 * scale)}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(
				type,
				Math.round(roundedX + roundedWidth / 2),
				Math.round(roundedY + roundedHeight / 2)
			);
		} catch (error: any) {
			throw new CanvasOperationError('Failed to render placeholder', 'PLACEHOLDER_RENDER_ERROR');
		}
	}

	export async function renderFullResolution(): Promise<Blob> {
		const readinessCheck = isCanvasReady();
		if (!readinessCheck.ready) {
			dispatch('error', {
				code: readinessCheck.error?.code || 'CANVAS_NOT_READY',
				message: readinessCheck.error?.message || 'Canvas is not ready for rendering'
			});
			throw new CanvasOperationError(
				readinessCheck.error?.message || 'Canvas is not ready for rendering',
				readinessCheck.error?.code || 'CANVAS_NOT_READY'
			);
		}

		if (!offscreenCanvas) {
			const error = {
				code: 'OFFSCREEN_CANVAS_ERROR',
				message: 'Offscreen canvas is not available for full resolution render'
			};
			dispatch('error', error);
			throw new CanvasOperationError(error.message, error.code);
		}

		try {
			const offscreenCtx = offscreenCanvas.getContext('2d');
			if (!offscreenCtx) {
				throw new CanvasOperationError(
					'Could not get 2D context from offscreen canvas',
					'CONTEXT_ACQUISITION_ERROR'
				);
			}

			const dims = canvasDimensions();
			offscreenCanvas.width = dims.width;
			offscreenCanvas.height = dims.height;
			offscreenCtx.clearRect(0, 0, dims.width, dims.height);

			await renderCanvas(offscreenCtx as unknown as CanvasRenderingContext2D, 1, true);

			const blob = await offscreenCanvas.convertToBlob({
				type: 'image/png',
				quality: 1
			});

			if (!blob) {
				throw new CanvasOperationError('Failed to generate image blob', 'BLOB_GENERATION_ERROR');
			}

			return blob;
		} catch (error: any) {
			const errorDetails =
				error instanceof CanvasOperationError
					? { code: error.code, message: error.message }
					: { code: 'RENDER_ERROR', message: 'Failed to render full resolution image' };

			dispatch('error', errorDetails);
			throw new CanvasOperationError(errorDetails.message, errorDetails.code);
		}
	}

	// Trigger render when any of the dependencies change
	$effect(() => {
		// Track all dependencies that should trigger a render
		elements;
		fileUploads;
		imagePositions;
		fullResolution;
		isDragging;

		// Track individual formData properties being used in text elements
		elements.forEach((element) => {
			if (element.type === 'text' || element.type === 'selection') {
				// Access the specific formData property to trigger reactivity
				formData[element.variableName];
			}
		});

		if (browser) {
			debouncedRender();
		}
	});
</script>

<canvas
	bind:this={displayCanvas}
	class="block w-full h-auto border border-slate-200 rounded-md shadow-sm [image-rendering:crisp-edges]"
></canvas>
