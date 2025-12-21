import { fal } from '@fal-ai/client';
import { env } from './env';

/**
 * fal.ai integration for Qwen-Image-Layered model.
 * Decomposes images into multiple RGBA layers.
 */

export interface DecomposeRequest {
	imageUrl: string; // Must be publicly accessible URL
	numLayers?: number; // Default: 4
	prompt?: string; // Optional caption for better layer detection
	negative_prompt?: string; // Optional negative prompt
	num_inference_steps?: number; // Default: 28
	guidance_scale?: number; // Default: 5
	acceleration?: string; // Default: "regular"
	seed?: number; // For reproducible results
}

export interface FalLayerImage {
	url: string;
	width: number;
	height: number;
	content_type?: string;
	file_name?: string;
	file_size?: number;
}

export interface DecomposeResponse {
	success: boolean;
	layers: Array<{
		url: string; // fal.ai hosted PNG URL
		width: number;
		height: number;
		zIndex: number; // 0 = bottom layer
	}>;
	seed: number;
	prompt?: string;
	error?: string;
}

// Initialize fal client with credentials if available
function initFal(): boolean {
	const falKey = env.FAL_KEY;
	console.log('[fal-layers] FAL_KEY present:', !!falKey);
	if (falKey) {
		try {
			fal.config({ credentials: falKey });
			return true;
		} catch (e) {
			console.error('[fal-layers] Failed to configure fal client:', e);
			return false;
		}
	}
	return false;
}

/**
 * Decompose an image into multiple RGBA layers using Qwen-Image-Layered.
 */
export async function decomposeWithFal(request: DecomposeRequest): Promise<DecomposeResponse> {
	const isConfigured = initFal();

	// Return mock data for development when FAL_KEY is not set
	if (!isConfigured) {
		console.log('[fal-layers] FAL_KEY not configured, returning mock data');
		return getMockResponse(request.numLayers ?? 4, request.imageUrl);
	}

	try {
		console.log('[fal-layers] Calling fal.ai qwen-image-layered API...');
		console.log('[fal-layers] Image URL:', request.imageUrl);
		console.log('[fal-layers] Num layers:', request.numLayers ?? 4);

		const result = await fal.subscribe('fal-ai/qwen-image-layered', {
			input: {
				image_url: request.imageUrl,
				prompt: request.prompt,
				negative_prompt: request.negative_prompt ?? "",
				num_inference_steps: request.num_inference_steps ?? 28,
				guidance_scale: request.guidance_scale ?? 5,
				acceleration: request.acceleration ?? "regular",
				num_layers: request.numLayers ?? 4,
				output_format: 'png',
				enable_safety_checker: true, 
				seed: request.seed
			},
			logs: true,
			onQueueUpdate: (update) => {
				console.log('[fal-layers] Queue status:', update.status);
				if (update.status === 'IN_PROGRESS' && update.logs) {
					update.logs.map((log) => log.message).forEach((msg) => console.log('[fal-layers]', msg));
				}
			}
		});

		console.log('[fal-layers] Result received:', JSON.stringify(result.data, null, 2));
		console.log('[fal-layers] Received', result.data.images?.length ?? 0, 'layers');

		return {
			success: true,
			layers: (result.data.images as FalLayerImage[]).map((img, index) => ({
				url: img.url,
				width: img.width ?? 0,
				height: img.height ?? 0,
				zIndex: index
			})),
			seed: result.data.seed as number,
			prompt: result.data.prompt as string | undefined
		};
	} catch (error: unknown) {
		console.error('[fal-layers] API error:', error);
		console.error('[fal-layers] Error type:', typeof error);
		console.error(
			'[fal-layers] Error details:',
			JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2)
		);

		const errorMessage =
			error instanceof Error
				? error.message
				: typeof error === 'object' && error !== null && 'message' in error
					? String((error as { message: unknown }).message)
					: 'Unknown error calling fal.ai API';

		return {
			success: false,
			layers: [],
			seed: 0,
			error: errorMessage
		};
	}
}

/**
 * Mock response for development without API key.
 * Returns placeholder layer URLs that can be used for UI development.
 */
function getMockResponse(numLayers: number, sourceImageUrl: string): DecomposeResponse {
	console.log('[fal-layers] Generating mock response with', numLayers, 'layers');

	// Generate mock layers with the source image as first layer (background)
	// and placeholder URLs for other layers
	const layers = Array.from({ length: numLayers }, (_, i) => ({
		url:
			i === 0
				? sourceImageUrl
				: `/api/mock-layer?index=${i}&source=${encodeURIComponent(sourceImageUrl)}`,
		width: 1050, // Standard ID card width at 300 DPI
		height: 600, // Standard ID card height at 300 DPI
		zIndex: i
	}));

	return {
		success: true,
		layers,
		seed: 12345,
		prompt: 'Mock decomposition for development'
	};
}

/**
 * Check if fal.ai is configured and ready to use.
 */
export function isFalConfigured(): boolean {
	return !!env.FAL_KEY;
}

/**
 * Upscale an image by 2x using seedvr/upscale/image model.
 */
export async function upscaleImage(imageUrl: string): Promise<string> {
	const isConfigured = initFal();
	if (!isConfigured) {
		console.log('[fal-layers] FAL_KEY not configured, returning original image for mock upscale');
		return imageUrl;
	}

	try {
		console.log('[fal-layers] Calling fal.ai upscale API...');
		const result = await fal.subscribe('fal-ai/seedvr/upscale/image', {
			input: {
				image_url: imageUrl,
				upscale_mode: 'factor',
				upscale_factor: 2,
				target_resolution: '1080p',
				noise_scale: 0.1,
				output_format: 'png'
			},
			logs: true,
			onQueueUpdate: (update) => {
				if (update.status === 'IN_PROGRESS' && update.logs) {
					update.logs.map((log) => log.message).forEach((msg) => console.log('[fal-layers] [upscale]', msg));
				}
			}
		});

		console.log('[fal-layers] Upscale result:', JSON.stringify(result.data, null, 2));
		
		if (result.data.image && result.data.image.url) {
			return result.data.image.url;
		}
		
		throw new Error('No image URL in upscale response');

	} catch (error) {
		console.error('[fal-layers] Upscale failed:', error);
		throw error;
	}
}
