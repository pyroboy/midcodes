<script lang="ts">
	import { onMount, createEventDispatcher, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { debounce } from 'lodash-es';
	import type { TemplateElement } from '../stores/templateStore';
	import { CoordinateSystem } from '$lib/utils/coordinateSystem';
	import { generateImageVariants, CARD_VARIANTS } from '$lib/utils/imageProcessing';
	import { getProxiedUrl } from '$lib/utils/storage';
	import { generateQRDataUrl, loadQRImage } from '$lib/utils/qrCodeGenerator';
	import { buildDigitalProfileUrl } from '$lib/utils/slugGeneration';

	let {
		elements,
		backgroundUrl,
		formData,
		fileUploads,
		imagePositions,
		fullResolution = false,
		isDragging = false,
		showBoundingBoxes = false, // Flag to control bounding box visibility
		pixelDimensions = null,
		digitalCardSlug = null // For QR auto mode - generates profile URL
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
		digitalCardSlug?: string | null;
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
			const maxPreviewWidth = 600; // Align with TemplateForm maxWidth
			const maxPreviewHeight = 600; // Use same cap to derive the same min-scale formula

			// Calculate scale factors to fit within preview bounds (match TemplateForm logic)
			const widthScale = maxPreviewWidth / dims.width;
			const heightScale = maxPreviewHeight / dims.height;

			// Use the smaller scale to ensure it fits (equivalent to TemplateForm base scale)
			const scale = Math.min(widthScale, heightScale, 1); // Never upscale beyond 1:1

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
	// Cache File -> blobUrl to avoid creating new blob URLs on every render
	const blobUrlCache = new WeakMap<File, string>();
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

	/**
	 * Get or create a blob URL for a File, using cache to avoid creating new URLs on every render
	 */
	function getBlobUrlForFile(file: File): string {
		let blobUrl = blobUrlCache.get(file);
		if (!blobUrl) {
			blobUrl = URL.createObjectURL(file);
			blobUrlCache.set(file, blobUrl);
		}
		return blobUrl;
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

	async function waitForFonts() {
		if (!document.fonts) return;

		const fontsToLoad = new Set<string>();
		elements.forEach((element) => {
			// Check specific fonts for text/selection elements
			// Use fontFamily (new) with fallback to font (legacy)
			const fontName = element.fontFamily || element.font;
			if ((element.type === 'text' || element.type === 'selection') && fontName) {
				const weight = element.fontWeight || 400;
				const style = element.fontStyle || 'normal';
				fontsToLoad.add(`${style} ${weight} 16px "${fontName}"`);
			}
		});

		const promises = [];
		for (const font of fontsToLoad) {
			// document.fonts.load returns a Promise that resolves to a generic list of loaded fonts
			promises.push(document.fonts.load(font));
		}

		try {
			await Promise.all(promises);
			await document.fonts.ready;
		} catch (e) {
			console.warn('Font loading warning:', e);
			// Proceed anyway if font loading fails, to avoid blocking render forever
		}
	}

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

			// Wait for fonts to ensure robustness of initial render
			await waitForFonts();

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
			// Use the centralized proxy helper which handles R2, custom domains, etc.
			// Passing 'templates' as default bucket, though full URLs are usually passed here
			const proxiedUrl = getProxiedUrl(url, 'templates');
			const src = proxiedUrl || url;

			if (src !== url) {
				console.log(`[IdCanvas] Proxying image: ${url} -> ${src}`);
			} else {
				console.log(`[IdCanvas] Loading image directly: ${url}`);
			}

			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = () =>
				reject(new CanvasOperationError(`Failed to load image: ${url}`, 'IMAGE_LOAD_ERROR'));
			img.src = src;
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
				} else if (element.type === 'photo' || element.type === 'signature' || element.type === 'graphic') {
					await renderImageElement(ctx, element, renderCoordSystem, isOffScreen);
				} else if (element.type === 'qr') {
					await renderQrElement(ctx, element, renderCoordSystem, isOffScreen);
				}
			} catch (error) {
				console.error(`[IdCanvas] Error rendering element ${element.variableName}:`, error);
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
			// Use fontSize (new) with fallback to size (legacy) for backwards compatibility
			const fontSize = Math.round(
				(element.fontSize || element.size || 12) * renderCoordSystem.scale
			);
			const fontOptions = {
				// Use fontFamily (new) with fallback to font (legacy)
				family: element.fontFamily || element.font,
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

			// Calculate center point for rotation
			const centerX = elementX + elementWidth / 2;
			const centerY = elementY + elementHeight / 2;

			// Apply rotation if present
			const rotation = element.rotation || 0;
			if (rotation !== 0) {
				ctx.save();
				ctx.translate(centerX, centerY);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-centerX, -centerY);
			}

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

			// Restore context if rotation was applied
			if (rotation !== 0) {
				ctx.restore();
			}
		} catch (error: any) {
			throw new CanvasOperationError(
				`Failed to render text element: ${element.variableName}`,
				'TEXT_RENDER_ERROR'
			);
		}
	}

	// Calculate fit dimensions for graphic elements
	function calculateFitDimensions(
		imgWidth: number,
		imgHeight: number,
		boxWidth: number,
		boxHeight: number,
		fit: 'cover' | 'contain' | 'fill' | 'none' = 'contain'
	): { width: number; height: number; x: number; y: number } {
		switch (fit) {
			case 'contain': {
				const scale = Math.min(boxWidth / imgWidth, boxHeight / imgHeight);
				const w = imgWidth * scale;
				const h = imgHeight * scale;
				return { width: w, height: h, x: (boxWidth - w) / 2, y: (boxHeight - h) / 2 };
			}
			case 'cover': {
				const scale = Math.max(boxWidth / imgWidth, boxHeight / imgHeight);
				const w = imgWidth * scale;
				const h = imgHeight * scale;
				return { width: w, height: h, x: (boxWidth - w) / 2, y: (boxHeight - h) / 2 };
			}
			case 'fill':
				return { width: boxWidth, height: boxHeight, x: 0, y: 0 };
			case 'none':
			default:
				// Center the image at original size
				return {
					width: imgWidth,
					height: imgHeight,
					x: (boxWidth - imgWidth) / 2,
					y: (boxHeight - imgHeight) / 2
				};
		}
	}

	async function renderImageElement(
		ctx: CanvasRenderingContext2D,
		element: TemplateElement,
		renderCoordSystem: CoordinateSystem,
		isOffScreen: boolean
	) {
		if (element.type !== 'photo' && element.type !== 'signature' && element.type !== 'graphic')
			return;

		try {
			// Graphics use element.src, photos/signatures use fileUploads
			let file = fileUploads[element.variableName];
			let imageUrl: string | null = null;

			if (element.type === 'graphic' && (element as any).src) {
				imageUrl = (element as any).src;
			} else if (file) {
				// Use cached blob URL to avoid creating new ones on every render
				imageUrl = getBlobUrlForFile(file);
			}

			if (!imageUrl) {
				if (!isOffScreen && (element.type === 'photo' || element.type === 'signature')) {
					const position = renderCoordSystem.storageToPreview({
						x: element.x || 0,
						y: element.y || 0
					});
					const dimensions = renderCoordSystem.storageToPreviewDimensions({
						width: element.width || 100,
						height: element.height || 100
					});
					renderPlaceholder(
						ctx,
						position.x,
						position.y,
						dimensions.width,
						dimensions.height,
						element.type,
						renderCoordSystem.scale
					);
				}
				return;
			}

			const pos = imagePositions[element.variableName] || { x: 0, y: 0, scale: 1 };

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

			// Calculate center point for rotation
			const centerX = elementX + elementWidth / 2;
			const centerY = elementY + elementHeight / 2;

			// Apply rotation if present
			const rotation = element.rotation || 0;

			ctx.save();

			// Apply rotation transform before clipping
			if (rotation !== 0) {
				ctx.translate(centerX, centerY);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-centerX, -centerY);
			}

			// Draw red bounding box if enabled
			if (showBoundingBoxes) {
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 1;
				ctx.strokeRect(elementX, elementY, elementWidth, elementHeight);
			}

			ctx.beginPath();
			ctx.rect(elementX, elementY, elementWidth, elementHeight);
			ctx.clip();

			try {
				if (element.type === 'signature') {
					ctx.globalCompositeOperation = 'multiply';
				}

				const image = await loadAndCacheImage(
					imageUrl,
					isDragging && !isOffScreen && !(element.type === 'signature')
				);

				let x: number, y: number, drawWidth: number, drawHeight: number;

				if (element.type === 'graphic') {
					// Use fit mode calculation for graphics (no user positioning)
					const fitMode = (element.fit as 'cover' | 'contain' | 'fill' | 'none') || 'contain';
					const dims = calculateFitDimensions(
						image.width,
						image.height,
						elementWidth,
						elementHeight,
						fitMode
					);
					drawWidth = Math.round(dims.width);
					drawHeight = Math.round(dims.height);
					x = Math.round(elementX + dims.x);
					y = Math.round(elementY + dims.y);
				} else {
					// Photo/signature: allow user positioning and scaling
					const imgAspectRatio = image.width / image.height;
					const elementAspectRatio = elementWidth / elementHeight;

					drawWidth = Math.round(elementWidth * (pos.scale || 1));
					drawHeight = Math.round(elementHeight * (pos.scale || 1));

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

					x = Math.round(elementX + (elementWidth - drawWidth) / 2 + offsetPosition.x);
					y = Math.round(elementY + (elementHeight - drawHeight) / 2 + offsetPosition.y);
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
						element.type === 'graphic' ? 'Graphic' : 'Error Photo',
						renderCoordSystem.scale
					);
				}
				throw new CanvasOperationError(
					`Failed to load image for ${element.variableName}: ${error.message || 'Unknown error'}`,
					'IMAGE_RENDER_ERROR'
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

			// Transparent background (don't fill)

			// Dashed border
			ctx.save();
			ctx.strokeStyle = '#aaaaaa';
			ctx.lineWidth = 2;
			ctx.setLineDash([6 * scale, 4 * scale]); // Scale the dashes
			ctx.strokeRect(roundedX, roundedY, roundedWidth, roundedHeight);
			ctx.restore();

			// Uniform text size based on card scale (standardized)
			ctx.fillStyle = '#aaaaaa';
			const fontSize = Math.round(24 * scale);

			ctx.font = `${fontSize}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Format type string (e.g. "photo" -> "Photo")
			const label = type.charAt(0).toUpperCase() + type.slice(1);

			ctx.fillText(
				label,
				Math.round(roundedX + roundedWidth / 2),
				Math.round(roundedY + roundedHeight / 2)
			);
		} catch (error: any) {
			throw new CanvasOperationError('Failed to render placeholder', 'PLACEHOLDER_RENDER_ERROR');
		}
	}

	// Cache for QR code images to avoid regenerating on every render
	const qrImageCache = new Map<string, { image: HTMLImageElement; lastUsed: number }>();

	async function renderQrElement(
		ctx: CanvasRenderingContext2D,
		element: TemplateElement,
		renderCoordSystem: CoordinateSystem,
		isOffScreen: boolean
	) {
		if (element.type !== 'qr') return;

		// Calculate position and dimensions first so we have them for the placeholder in case of error
		let elementX = 0;
		let elementY = 0;
		let elementWidth = 100;
		let elementHeight = 100;

		try {
			// Calculate position and dimensions
			const position = renderCoordSystem.storageToPreview({
				x: element.x || 0,
				y: element.y || 0
			});
			const dimensions = renderCoordSystem.storageToPreviewDimensions({
				width: element.width || 100,
				height: element.height || 100
			});

			elementX = Math.round(position.x);
			elementY = Math.round(position.y);
			elementWidth = Math.round(dimensions.width);
			elementHeight = Math.round(dimensions.height);

			// Determine QR content based on contentMode
			let qrContent: string;

			const contentMode = element.contentMode || 'auto';

			if (contentMode === 'auto') {
				// Auto mode: generate URL from digital card slug
				if (digitalCardSlug) {
					qrContent = buildDigitalProfileUrl(digitalCardSlug);
				} else {
					// Fallback if slug is missing (shouldn't happen in normal flow if server passes it)
					console.warn('[IdCanvas] QR Auto Mode: Missing digitalCardSlug, using placeholder');
					qrContent = 'https://kanaya.app/id/PREVIEW-SLUG-MISSING';
				}
			} else if (contentMode === 'custom' && element.content) {
				// Custom mode: use the content field
				qrContent = element.content;
			} else {
				// No real content available - use placeholder
				qrContent = 'https://kanaya.app/id/SAMPLE-preview123';
			}

			// Validate QR content isn't empty
			if (!qrContent.trim()) {
				throw new CanvasOperationError('QR content is empty', 'QR_EMPTY_CONTENT');
			}

			// Calculate center point for rotation
			const centerX = elementX + elementWidth / 2;
			const centerY = elementY + elementHeight / 2;

			// Apply rotation if present
			const rotation = element.rotation || 0;

			ctx.save();

			if (rotation !== 0) {
				ctx.translate(centerX, centerY);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-centerX, -centerY);
			}

			// Draw bounding box if enabled
			if (showBoundingBoxes) {
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 1;
				ctx.strokeRect(elementX, elementY, elementWidth, elementHeight);
			}

			// Generate cache key
			const errorLevel = element.errorCorrectionLevel || 'M';
			const fgColor = element.foregroundColor || '#000000';
			const bgColor = element.backgroundColor || '#ffffff';
			const cacheKey = `${qrContent}-${errorLevel}-${fgColor}-${bgColor}`;

			// Check cache for existing QR image
			let qrImage: HTMLImageElement;
			const cachedEntry = qrImageCache.get(cacheKey);

			if (cachedEntry) {
				cachedEntry.lastUsed = Date.now();
				qrImage = cachedEntry.image;
			} else {
				// Generate QR code data URL
				const qrSize = Math.max(elementWidth, elementHeight) * 2; // 2x for quality (retina-like)
				
				try {
					const dataUrl = await generateQRDataUrl(qrContent, {
						width: qrSize,
						errorCorrectionLevel: errorLevel,
						color: {
							dark: fgColor,
							light: bgColor
						}
					});

					// Load as image
					qrImage = await loadQRImage(dataUrl);

					// Cache the image
					qrImageCache.set(cacheKey, { image: qrImage, lastUsed: Date.now() });

					// Clean old cache entries
					if (qrImageCache.size > 15) {
						let oldestKey: string | null = null;
						let oldestTime = Infinity;
						for (const [key, entry] of qrImageCache) {
							if (entry.lastUsed < oldestTime) {
								oldestTime = entry.lastUsed;
								oldestKey = key;
							}
						}
						if (oldestKey) qrImageCache.delete(oldestKey);
					}
				} catch (err) {
					console.error('[IdCanvas] QR Generation failed internally:', err);
					throw new CanvasOperationError('Failed to generate QR code image', 'QR_GEN_ERROR');
				}
			}

			// Draw QR code - maintain square aspect ratio, centered
			const size = Math.min(elementWidth, elementHeight);
			const drawX = elementX + (elementWidth - size) / 2;
			const drawY = elementY + (elementHeight - size) / 2;

			ctx.drawImage(qrImage, drawX, drawY, size, size);

			ctx.restore();
		} catch (error: any) {
			console.error(`[IdCanvas] Error rendering QR element ${element.variableName}:`, error);
			
			// Restore context to ensure we don't leave it in a transformed state
			ctx.restore(); 

			// Show placeholder on error
			// Re-calculate basic dimensions if they failed (fallback)
			if (elementWidth <= 0) elementWidth = 100;
			if (elementHeight <= 0) elementHeight = 100;
			
			// Ensure we are drawing in a clean state (no rotation from previous try)
			ctx.save();
			// Note: We don't re-apply rotation for the error placeholder to keep it readable,
			// or apply it if we successfully calculated it. Let's stick to simple placement for error.
			
			renderPlaceholder(
				ctx,
				elementX,
				elementY,
				elementWidth,
				elementHeight,
				'QR Error',
				renderCoordSystem.scale
			);
			ctx.restore();
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

	/**
	 * Render the card at full resolution and generate multiple variants (full, preview).
	 */
	export async function renderFullResolutionVariants(): Promise<Record<string, Blob>> {
		const fullBlob = await renderFullResolution();
		// Generate variants (full, preview)
		return await generateImageVariants(fullBlob, CARD_VARIANTS);
	}

	// Trigger render when any of the dependencies change
	$effect(() => {
		// Track all dependencies that should trigger a render
		elements;
		fileUploads;
		imagePositions;
		fullResolution;
		isDragging;
		digitalCardSlug; // Track slug changes for QR auto mode

		// Track individual element properties for deep reactivity
		elements.forEach((element) => {
			if (element.type === 'text' || element.type === 'selection') {
				// Access the specific formData property to trigger reactivity
				formData[element.variableName];
			}
			// Track graphic src changes
			if (element.type === 'graphic') {
				(element as any).src;
			}
			// Track QR element property changes
			if (element.type === 'qr') {
				element.contentMode;
				element.content;
				element.foregroundColor;
				element.backgroundColor;
				element.errorCorrectionLevel;
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
