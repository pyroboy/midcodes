/**
 * Headless Canvas Renderer
 *
 * Standalone utility to render templates to canvas without DOM mounting.
 * Extracted from IdCanvas.svelte for use in variant generation.
 */

import { browser } from '$app/environment';
import { CoordinateSystem } from './coordinateSystem';
import type { TemplateElement } from '$lib/stores/templateStore';
import { getPlaceholderLabel } from './defaultFormData';

export interface RenderOptions {
	/** Background image URL or Blob */
	background: string | Blob;
	/** Template elements to render */
	elements: TemplateElement[];
	/** Form data values for text elements */
	formData: Record<string, string>;
	/** File uploads for photo/signature elements */
	fileUploads?: Record<string, File | Blob | null>;
	/** Canvas dimensions in pixels */
	dimensions: { width: number; height: number };
	/** Render mode: 'sample' shows text, 'blank' shows placeholders */
	mode: 'sample' | 'blank';
}

export interface RenderResult {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Load an image from URL or Blob
 */
async function loadImage(source: string | Blob): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${typeof source === 'string' ? source : 'blob'}`));

		if (source instanceof Blob) {
			img.src = URL.createObjectURL(source);
			// Clean up object URL after load
			const originalOnload = img.onload;
			img.onload = (e) => {
				URL.revokeObjectURL(img.src);
				if (originalOnload) (originalOnload as EventListener)(e);
			};
		} else {
			// Handle R2 URLs that need proxying
			let src = source;
			if (source.includes('.r2.dev') || source.includes('.r2.cloudflarestorage.com')) {
				src = `/api/image-proxy?url=${encodeURIComponent(source)}`;
			}
			img.src = src;
		}
	});
}

/**
 * Get CSS font string from element properties
 */
function getFontString(options: {
	family?: string;
	size?: number;
	weight?: string | number;
	style?: string;
}): string {
	const { style = 'normal', weight = 400, size = 16, family = 'Arial' } = options;
	return `${style} ${weight} ${size}px "${family}"`;
}

/**
 * Render a text element on the canvas
 */
function renderTextElement(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	element: TemplateElement,
	coordSystem: CoordinateSystem,
	formData: Record<string, string>,
	mode: 'sample' | 'blank'
): void {
	if (element.type !== 'text' && element.type !== 'selection') return;

	// Extract type-safe properties based on element type
	// Handle both legacy (size, font, alignment) and new (fontSize, fontFamily, textAlign) properties
	const fontSize = element.fontSize || element.size || 12;
	const fontFamily = element.fontFamily || element.font || 'Arial';
	const fontWeight = element.fontWeight || 'normal';
	const fontStyle = element.fontStyle || 'normal';
	const textAlign = element.alignment || 'left'; // templateStore uses 'alignment'
	const textTransform = element.textTransform || 'none';

	const scaledFontSize = Math.round(fontSize * coordSystem.scale);
	const fontOptions = {
		family: fontFamily,
		size: scaledFontSize,
		weight: fontWeight,
		style: fontStyle
	};

	ctx.font = getFontString(fontOptions);
	ctx.fillStyle = element.color || 'black';
	ctx.textAlign = textAlign as CanvasTextAlign;
	ctx.textBaseline = 'middle';

	// Get text content
	let text = '';
	if (mode === 'blank') {
		// In blank mode, show placeholder label
		text = getPlaceholderLabel(element);
		ctx.fillStyle = '#888888'; // Gray for placeholders
	} else {
		// In sample mode, use form data
		if (element.type === 'selection') {
			text = formData[element.variableName] || element.options?.[0] || '';
		} else {
			text = formData[element.variableName] || '';
		}
	}

	// Apply text transform
	if (textTransform === 'uppercase') {
		text = text.toUpperCase();
	} else if (textTransform === 'lowercase') {
		text = text.toLowerCase();
	} else if (textTransform === 'capitalize') {
		text = text
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	// Calculate position
	const position = coordSystem.storageToPreview({
		x: element.x || 0,
		y: element.y || 0
	});
	const dimensions = coordSystem.storageToPreviewDimensions({
		width: element.width || 0,
		height: element.height || 0
	});

	const elementX = Math.round(position.x);
	const elementY = Math.round(position.y);
	const elementWidth = Math.round(dimensions.width);
	const elementHeight = Math.round(dimensions.height);

	// Handle rotation
	const rotation = element.rotation || 0;
	if (rotation !== 0) {
		const centerX = elementX + elementWidth / 2;
		const centerY = elementY + elementHeight / 2;
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-centerX, -centerY);
	}

	// Calculate text position based on alignment
	let x = elementX;
	if (textAlign === 'center') {
		x += Math.round(elementWidth / 2);
	} else if (textAlign === 'right') {
		x += elementWidth;
	}
	const y = Math.round(elementY + elementHeight / 2);

	// Apply opacity
	if (typeof element.opacity === 'number') {
		ctx.globalAlpha = element.opacity;
	}

	ctx.fillText(text, x, y);
	ctx.globalAlpha = 1;

	if (rotation !== 0) {
		ctx.restore();
	}
}

/**
 * Render a placeholder box for photo/signature elements
 */
function renderPlaceholder(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	label: string,
	scale: number
): void {
	const roundedX = Math.round(x);
	const roundedY = Math.round(y);
	const roundedWidth = Math.round(width);
	const roundedHeight = Math.round(height);

	// Dashed border
	ctx.save();
	ctx.strokeStyle = '#aaaaaa';
	ctx.lineWidth = 2;
	ctx.setLineDash([6 * scale, 4 * scale]);
	ctx.strokeRect(roundedX, roundedY, roundedWidth, roundedHeight);
	ctx.restore();

	// Label text
	ctx.fillStyle = '#aaaaaa';
	const fontSize = Math.round(24 * scale);
	ctx.font = `${fontSize}px Arial`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.fillText(
		label,
		Math.round(roundedX + roundedWidth / 2),
		Math.round(roundedY + roundedHeight / 2)
	);
}

/**
 * Render an image element (photo, signature, image)
 */
async function renderImageElement(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	element: TemplateElement,
	coordSystem: CoordinateSystem,
	fileUploads: Record<string, File | Blob | null>,
	mode: 'sample' | 'blank'
): Promise<void> {
	if (element.type !== 'photo' && element.type !== 'signature' && element.type !== 'image' && element.type !== 'graphic') return;

	const position = coordSystem.storageToPreview({
		x: element.x || 0,
		y: element.y || 0
	});
	const dimensions = coordSystem.storageToPreviewDimensions({
		width: element.width || 100,
		height: element.height || 100
	});

	const elementX = Math.round(position.x);
	const elementY = Math.round(position.y);
	const elementWidth = Math.round(dimensions.width);
	const elementHeight = Math.round(dimensions.height);

	// For blank mode, always show placeholder
	if (mode === 'blank') {
		const label = getPlaceholderLabel(element);
		renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, label, coordSystem.scale);
		return;
	}

	// For sample mode with image/graphic type, try to load content (templateStore uses content for URLs)
	if ((element.type === 'image' || element.type === 'graphic') && element.content) {
		try {
			const img = await loadImage(element.content);

			// Handle rotation
			const rotation = element.rotation || 0;
			ctx.save();

			if (rotation !== 0) {
				const centerX = elementX + elementWidth / 2;
				const centerY = elementY + elementHeight / 2;
				ctx.translate(centerX, centerY);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-centerX, -centerY);
			}

			ctx.drawImage(img, elementX, elementY, elementWidth, elementHeight);
			ctx.restore();
		} catch {
			// If image fails to load, show placeholder
			renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, 'Image', coordSystem.scale);
		}
		return;
	}

	// For photo/signature in sample mode, check for file uploads or show placeholder
	const file = fileUploads[element.variableName];
	if (file) {
		try {
			const img = await loadImage(file);
			const rotation = element.rotation || 0;

			ctx.save();

			if (rotation !== 0) {
				const centerX = elementX + elementWidth / 2;
				const centerY = elementY + elementHeight / 2;
				ctx.translate(centerX, centerY);
				ctx.rotate((rotation * Math.PI) / 180);
				ctx.translate(-centerX, -centerY);
			}

			// Clip to element bounds
			ctx.beginPath();
			ctx.rect(elementX, elementY, elementWidth, elementHeight);
			ctx.clip();

			// Calculate cover fit
			const imgAspect = img.width / img.height;
			const elementAspect = elementWidth / elementHeight;
			let drawWidth = elementWidth;
			let drawHeight = elementHeight;

			if (imgAspect > elementAspect) {
				drawHeight = elementWidth / imgAspect;
			} else {
				drawWidth = elementHeight * imgAspect;
			}

			const drawX = elementX + (elementWidth - drawWidth) / 2;
			const drawY = elementY + (elementHeight - drawHeight) / 2;

			ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
			ctx.restore();
		} catch {
			const label = getPlaceholderLabel(element);
			renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, label, coordSystem.scale);
		}
	} else {
		// No file uploaded, show placeholder
		const label = getPlaceholderLabel(element);
		renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, label, coordSystem.scale);
	}
}

/**
 * Render a QR code element placeholder
 */
function renderQrElement(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	element: TemplateElement,
	coordSystem: CoordinateSystem,
	mode: 'sample' | 'blank'
): void {
	if (element.type !== 'qr') return;

	const position = coordSystem.storageToPreview({
		x: element.x || 0,
		y: element.y || 0
	});
	const dimensions = coordSystem.storageToPreviewDimensions({
		width: element.width || 100,
		height: element.height || 100
	});

	const elementX = Math.round(position.x);
	const elementY = Math.round(position.y);
	const elementWidth = Math.round(dimensions.width);
	const elementHeight = Math.round(dimensions.height);

	// For both modes, we show a QR placeholder (actual QR generation would require a library)
	renderPlaceholder(ctx, elementX, elementY, elementWidth, elementHeight, 'QR Code', coordSystem.scale);
}

/**
 * Render a template to a canvas and return as Blob
 */
export async function renderTemplate(options: RenderOptions): Promise<RenderResult> {
	if (!browser) {
		throw new Error('renderTemplate can only be called in browser environment');
	}

	const { background, elements, formData, fileUploads = {}, dimensions, mode } = options;

	// Create offscreen canvas
	const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Failed to get canvas context');
	}

	// Create coordinate system (scale = 1 for full resolution)
	const coordSystem = new CoordinateSystem(dimensions.width, dimensions.height, 1);

	// Draw background
	try {
		const bgImage = await loadImage(background);
		ctx.drawImage(bgImage, 0, 0, dimensions.width, dimensions.height);
	} catch (error) {
		console.warn('Failed to load background image:', error);
		// Fill with white if background fails
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, dimensions.width, dimensions.height);
	}

	// Render elements in order
	for (const element of elements) {
		if (!element.visible) continue;

		try {
			switch (element.type) {
				case 'text':
				case 'selection':
					renderTextElement(ctx, element, coordSystem, formData, mode);
					break;
				case 'photo':
				case 'signature':
				case 'image':
				case 'graphic':
					await renderImageElement(ctx, element, coordSystem, fileUploads, mode);
					break;
				case 'qr':
					renderQrElement(ctx, element, coordSystem, mode);
					break;
			}
		} catch (error) {
			console.warn(`Failed to render element ${element.variableName}:`, error);
		}
	}

	// Convert to blob
	const blob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });

	return {
		blob,
		width: dimensions.width,
		height: dimensions.height
	};
}

/**
 * Render template for a specific side (front or back)
 */
export async function renderTemplateSide(
	background: string | Blob,
	elements: TemplateElement[],
	side: 'front' | 'back',
	formData: Record<string, string>,
	fileUploads: Record<string, File | Blob | null>,
	dimensions: { width: number; height: number },
	mode: 'sample' | 'blank'
): Promise<Blob> {
	// Filter elements for this side
	const sideElements = elements.filter((el) => el.side === side);

	const result = await renderTemplate({
		background,
		elements: sideElements,
		formData,
		fileUploads,
		dimensions,
		mode
	});

	return result.blob;
}
