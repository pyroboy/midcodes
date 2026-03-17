/**
 * Template Variants Generator
 *
 * Orchestrates the generation of all template asset variants:
 * - thumb: 200px thumbnail of backgrounds (JPEG)
 * - preview: 800px preview of backgrounds (JPEG)
 * - blank: Full resolution with placeholder boxes (PNG)
 * - sample: Full resolution with sample data (PNG)
 */

import { browser } from '$app/environment';
import type { TemplateElement } from '$lib/stores/templateStore';
import { generateImageVariants, TEMPLATE_VARIANTS } from './imageProcessing';
import { renderTemplateSide } from './headlessCanvasRenderer';
import { generateSampleFormData } from './defaultFormData';
import { getTemplateAssetPath } from './storagePath';

// ============================================================================
// WATERMARK CONFIGURATION (OG-04)
// ============================================================================

export interface WatermarkOptions {
	text?: string;
	opacity?: number;
	fontSize?: number;
	color?: string;
	rotation?: number;
}

const DEFAULT_WATERMARK: WatermarkOptions = {
	text: 'SAMPLE',
	opacity: 0.15,
	fontSize: 48,
	color: '#000000',
	rotation: -30
};

/**
 * Apply a diagonal watermark pattern to an image blob
 */
export async function applyWatermark(
	imageBlob: Blob,
	options: WatermarkOptions = {}
): Promise<Blob> {
	const opts = { ...DEFAULT_WATERMARK, ...options };

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			// Draw original image
			ctx.drawImage(img, 0, 0);

			// Configure watermark style
			ctx.globalAlpha = opts.opacity!;
			ctx.fillStyle = opts.color!;
			ctx.font = `bold ${opts.fontSize}px Arial, sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Calculate spacing for tiled watermark pattern
			const textWidth = ctx.measureText(opts.text!).width;
			const spacing = textWidth * 1.5;
			const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

			// Save context and apply rotation
			ctx.save();
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate((opts.rotation! * Math.PI) / 180);

			// Draw tiled watermark pattern
			for (let y = -diagonal; y < diagonal; y += spacing) {
				for (let x = -diagonal; x < diagonal; x += spacing) {
					ctx.fillText(opts.text!, x, y);
				}
			}

			ctx.restore();

			// Convert back to blob
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to create blob from watermarked canvas'));
					}
				},
				'image/png',
				1.0
			);
		};

		img.onerror = () => reject(new Error('Failed to load image for watermarking'));
		img.src = URL.createObjectURL(imageBlob);
	});
}

/**
 * Configuration for variant generation
 */
export interface VariantGenerationOptions {
	templateId: string;
	frontBackground: Blob;
	backBackground: Blob;
	elements: TemplateElement[];
	dimensions: { width: number; height: number };
	/** Optional watermark configuration for sample images (OG-04) */
	watermark?: WatermarkOptions | boolean;
}

/**
 * Generated variant blobs
 */
export interface GeneratedVariants {
	thumbFront: Blob;
	thumbBack: Blob;
	previewFront: Blob;
	previewBack: Blob;
	blankFront: Blob;
	blankBack: Blob;
	sampleFront: Blob;
	sampleBack: Blob;
}

/**
 * URLs after upload
 */
export interface VariantUrls {
	thumb_front_url: string;
	thumb_back_url: string;
	preview_front_url: string;
	preview_back_url: string;
	blank_front_url: string;
	blank_back_url: string;
	sample_front_url: string;
	sample_back_url: string;
}

/**
 * Generate background variants (thumb and preview) from a blob
 * Uses existing TEMPLATE_VARIANTS config from imageProcessing
 */
export async function generateBackgroundVariants(
	blob: Blob
): Promise<{ thumb: Blob; preview: Blob; full: Blob }> {
	const variants = await generateImageVariants(blob, TEMPLATE_VARIANTS);
	return {
		thumb: variants.thumb,
		preview: variants.preview,
		full: variants.full
	};
}

/**
 * Generate all 8 template variants
 */
export async function generateTemplateVariants(
	options: VariantGenerationOptions
): Promise<GeneratedVariants> {
	if (!browser) {
		throw new Error('generateTemplateVariants can only be called in browser environment');
	}

	const { frontBackground, backBackground, elements, dimensions } = options;

	// Generate sample form data from element variable names
	const sampleFormData = generateSampleFormData(elements);

	// Process in parallel for performance
	const [frontBgVariants, backBgVariants, blankFront, blankBack, sampleFront, sampleBack] =
		await Promise.all([
			// Background-only variants (thumb, preview) - fast, no rendering
			generateBackgroundVariants(frontBackground),
			generateBackgroundVariants(backBackground),

			// Rendered variants (blank) - show placeholders
			renderTemplateSide(
				frontBackground,
				elements,
				'front',
				{}, // Empty form data
				{}, // Empty file uploads
				dimensions,
				'blank'
			),
			renderTemplateSide(
				backBackground,
				elements,
				'back',
				{}, // Empty form data
				{}, // Empty file uploads
				dimensions,
				'blank'
			),

			// Rendered variants (sample) - show sample text
			renderTemplateSide(
				frontBackground,
				elements,
				'front',
				sampleFormData,
				{}, // Empty file uploads - placeholders will show for photos
				dimensions,
				'sample'
			),
			renderTemplateSide(backBackground, elements, 'back', sampleFormData, {}, dimensions, 'sample')
		]);

	// Apply watermark to sample images if enabled (OG-04)
	let finalSampleFront = sampleFront;
	let finalSampleBack = sampleBack;

	if (options.watermark) {
		const watermarkOpts =
			typeof options.watermark === 'boolean' ? {} : options.watermark;

		const [watermarkedFront, watermarkedBack] = await Promise.all([
			applyWatermark(sampleFront, watermarkOpts),
			applyWatermark(sampleBack, watermarkOpts)
		]);

		finalSampleFront = watermarkedFront;
		finalSampleBack = watermarkedBack;
	}

	return {
		thumbFront: frontBgVariants.thumb,
		thumbBack: backBgVariants.thumb,
		previewFront: frontBgVariants.preview,
		previewBack: backBgVariants.preview,
		blankFront,
		blankBack,
		sampleFront: finalSampleFront,
		sampleBack: finalSampleBack
	};
}

/**
 * Upload function type for dependency injection
 */
type UploadFunction = (file: File, path: string) => Promise<string>;

/**
 * Upload all variants to storage and return URLs
 */
export async function uploadVariants(
	variants: GeneratedVariants,
	templateId: string,
	uploadFn: UploadFunction
): Promise<VariantUrls> {
	// Define all upload tasks
	const uploadTasks = [
		{
			key: 'thumb_front_url' as const,
			blob: variants.thumbFront,
			path: getTemplateAssetPath(templateId, 'thumb', 'front', 'jpg')
		},
		{
			key: 'thumb_back_url' as const,
			blob: variants.thumbBack,
			path: getTemplateAssetPath(templateId, 'thumb', 'back', 'jpg')
		},
		{
			key: 'preview_front_url' as const,
			blob: variants.previewFront,
			path: getTemplateAssetPath(templateId, 'preview', 'front', 'jpg')
		},
		{
			key: 'preview_back_url' as const,
			blob: variants.previewBack,
			path: getTemplateAssetPath(templateId, 'preview', 'back', 'jpg')
		},
		{
			key: 'blank_front_url' as const,
			blob: variants.blankFront,
			path: getTemplateAssetPath(templateId, 'blank', 'front', 'png')
		},
		{
			key: 'blank_back_url' as const,
			blob: variants.blankBack,
			path: getTemplateAssetPath(templateId, 'blank', 'back', 'png')
		},
		{
			key: 'sample_front_url' as const,
			blob: variants.sampleFront,
			path: getTemplateAssetPath(templateId, 'sample', 'front', 'png')
		},
		{
			key: 'sample_back_url' as const,
			blob: variants.sampleBack,
			path: getTemplateAssetPath(templateId, 'sample', 'back', 'png')
		}
	];

	// Upload all in parallel using Promise.allSettled for resilience
	const results = await Promise.allSettled(
		uploadTasks.map(async (task) => {
			const file = new File([task.blob], task.path.split('/').pop() || 'variant', {
				type: task.path.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
			});
			const url = await uploadFn(file, task.path);
			return { key: task.key, url };
		})
	);

	// Build result object, using empty string for failed uploads
	const urls: VariantUrls = {
		thumb_front_url: '',
		thumb_back_url: '',
		preview_front_url: '',
		preview_back_url: '',
		blank_front_url: '',
		blank_back_url: '',
		sample_front_url: '',
		sample_back_url: ''
	};

	for (const result of results) {
		if (result.status === 'fulfilled') {
			urls[result.value.key] = result.value.url;
		} else {
			console.warn('Failed to upload variant:', result.reason);
		}
	}

	return urls;
}

/**
 * Main entry point: generate and upload all variants
 */
export async function generateAndUploadVariants(
	options: VariantGenerationOptions,
	uploadFn: UploadFunction
): Promise<VariantUrls> {
	// Generate all variants
	const variants = await generateTemplateVariants(options);

	// Upload all variants
	return await uploadVariants(variants, options.templateId, uploadFn);
}
