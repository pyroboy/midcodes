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
function initFal() {
	const falKey = env.FAL_KEY;
	if (falKey) {
		fal.config({ credentials: falKey });
		return true;
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

		const result = await fal.subscribe('fal-ai/qwen-image-layered', {
			input: {
				image_url: request.imageUrl,
				prompt: request.prompt,
				num_layers: request.numLayers ?? 4,
				output_format: 'png',
				enable_safety_checker: false, // ID cards shouldn't trigger safety
				seed: request.seed
			},
			logs: true,
			onQueueUpdate: (update) => {
				if (update.status === 'IN_PROGRESS' && update.logs) {
					update.logs.map((log) => log.message).forEach((msg) => console.log('[fal-layers]', msg));
				}
			}
		});

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
	} catch (error) {
		console.error('[fal-layers] API error:', error);
		return {
			success: false,
			layers: [],
			seed: 0,
			error: error instanceof Error ? error.message : 'Unknown error calling fal.ai API'
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
