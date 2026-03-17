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
	images?: Array<{
		url: string;
		width: number;
		height: number;
	}>;
	seed: number;
	prompt?: string;
	error?: string;
}

// Cache fal client initialization status
let falInitialized = false;

// Initialize fal client with credentials if available (cached)
function initFal(): boolean {
	// Return cached status if already initialized
	if (falInitialized) return true;

	const falKey = env.FAL_KEY;
	console.log('[fal-layers] FAL_KEY present:', !!falKey);
	if (falKey) {
		try {
			fal.config({ credentials: falKey });
			falInitialized = true;
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
 * Includes retry logic with exponential backoff.
 */
export async function decomposeWithFal(request: DecomposeRequest): Promise<DecomposeResponse> {
	const isConfigured = initFal();

	// Return mock data for development when FAL_KEY is not set
	if (!isConfigured) {
		console.log('[fal-layers] FAL_KEY not configured, returning mock data');
		return getMockResponse(request.numLayers ?? 4, request.imageUrl);
	}

	const maxAttempts = 3;
	let lastError: unknown;
	let delay = 2000; // Start with 2 seconds for AI API calls

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			console.log(
				`[fal-layers] Attempt ${attempt}/${maxAttempts}: Calling fal.ai qwen-image-layered API...`
			);
			console.log('[fal-layers] Image URL:', request.imageUrl);
			console.log('[fal-layers] Num layers:', request.numLayers ?? 4);

			const result = await fal.subscribe('fal-ai/qwen-image-layered', {
				input: {
					image_url: request.imageUrl,
					prompt: request.prompt,
					negative_prompt: request.negative_prompt ?? '',
					num_inference_steps: request.num_inference_steps ?? 28,
					guidance_scale: request.guidance_scale ?? 5,
					acceleration: request.acceleration ?? 'regular',
					num_layers: request.numLayers ?? 4,
					output_format: 'png',
					enable_safety_checker: true,
					seed: request.seed
				},
				logs: true,
				onQueueUpdate: (update) => {
					console.log('[fal-layers] Queue status:', update.status);
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers]', msg));
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
			lastError = error;
			console.error(`[fal-layers] Attempt ${attempt} failed:`, error);

			// Check if error is retryable (network issues, timeouts, 5xx errors)
			const isRetryable = isRetryableError(error);

			if (attempt < maxAttempts && isRetryable) {
				console.log(`[fal-layers] Retrying in ${delay}ms...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay = Math.min(delay * 2, 15000); // Exponential backoff, max 15s
				continue;
			}

			// Non-retryable or exhausted attempts
			break;
		}
	}

	// Failed after all attempts
	const errorMessage =
		lastError instanceof Error
			? lastError.message
			: typeof lastError === 'object' && lastError !== null && 'message' in lastError
				? String((lastError as { message: unknown }).message)
				: 'Unknown error calling fal.ai API';

	console.error('[fal-layers] All attempts failed. Last error:', errorMessage);

	return {
		success: false,
		layers: [],
		seed: 0,
		error: errorMessage
	};
}

/**
 * Check if an error is retryable (network issues, timeouts, server errors)
 */
function isRetryableError(error: unknown): boolean {
	if (error instanceof TypeError) return true; // Network error
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('timeout')) return true;
		if (msg.includes('network')) return true;
		if (msg.includes('econnreset')) return true;
		if (msg.includes('econnrefused')) return true;
		if (msg.includes('503')) return true;
		if (msg.includes('502')) return true;
		if (msg.includes('504')) return true;
	}
	return false;
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
 * Submit a decomposition task to the fal.ai queue.
 * Returns a requestId immediately.
 */
export async function submitDecomposeWithFal(
	request: DecomposeRequest
): Promise<{ requestId: string }> {
	initFal();
	const res = await fal.queue.submit('fal-ai/qwen-image-layered', {
		input: {
			image_url: request.imageUrl,
			prompt: request.prompt,
			negative_prompt: request.negative_prompt ?? '',
			num_inference_steps: request.num_inference_steps ?? 28,
			guidance_scale: request.guidance_scale ?? 5,
			acceleration: request.acceleration ?? 'regular',
			num_layers: request.numLayers ?? 4,
			output_format: 'png',
			enable_safety_checker: true,
			seed: request.seed
		}
	});
	return { requestId: res.request_id };
}

/**
 * Submit an upscale task to the fal.ai queue.
 */
export async function submitUpscaleWithFal(
	imageUrl: string,
	model: UpscaleModel = 'seedvr',
	options?: {
		upscaleFactor?: number;
		denoise?: number | 'Low' | 'Medium' | 'High';
	}
): Promise<{ requestId: string }> {
	initFal();
	let endpoint = '';
	let input: any = { image_url: imageUrl };

	if (model === 'seedvr') {
		endpoint = 'fal-ai/seedvr/upscale/image';
		input = {
			...input,
			upscale_mode: 'factor',
			upscale_factor: options?.upscaleFactor ?? 2,
			target_resolution: '1080p',
			noise_scale: 0.1,
			output_format: 'png'
		};
	} else if (model === 'aurasr') {
		endpoint = 'fal-ai/aura-sr';
		input = { ...input, upscaling_factor: options?.upscaleFactor ?? 4 };
	} else if (model === 'esrgan') {
		endpoint = 'fal-ai/esrgan';
		input = { ...input, face_enhance: true, denoise: options?.denoise ?? 3 };
	} else if (model === 'recraft-creative') {
		endpoint = 'fal-ai/recraft/upscale/creative';
	} else if (model === 'ccsr') {
		endpoint = 'fal-ai/ccsr';
		input = { ...input, scale: 1.5, steps: 30, color_fix_type: 'adain' };
	}

	const res = await fal.queue.submit(endpoint, { input });
	return { requestId: res.request_id };
}

/**
 * Check status of a fal.ai queue request.
 */
export async function checkFalStatus(
	endpoint: string,
	requestId: string
): Promise<{
	status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'IN_QUEUE';
	result?: any;
	error?: any;
}> {
	initFal();
	// Use type casting for options to avoid requestId missing error if the lib requires it in the object
	const status = await fal.queue.status(endpoint, { requestId, logs: false } as any);

	if (status.status === 'COMPLETED') {
		const result = await fal.queue.result(endpoint, { requestId } as any);
		return { status: 'COMPLETED', result: result.data };
	}

	// Use type casting for comparison if the enum is too narrow
	if ((status.status as string) === 'FAILED') {
		return { status: 'FAILED', error: 'Fal.ai task failed' };
	}

	return { status: status.status as any };
}

export type UpscaleModel = 'seedvr' | 'aurasr' | 'esrgan' | 'recraft-creative' | 'ccsr';

/**
 * Upscale an image by 2x using the selected model.
 */
export async function upscaleImage(
	imageUrl: string,
	model: UpscaleModel = 'seedvr',
	options?: {
		upscaleFactor?: number;
		denoise?: number | 'Low' | 'Medium' | 'High'; // For models that support it
	}
): Promise<string> {
	const isConfigured = initFal();
	if (!isConfigured) {
		console.log('[fal-layers] FAL_KEY not configured, returning original image for mock upscale');
		return imageUrl;
	}

	try {
		console.log(`[fal-layers] Calling fal.ai upscale API (${model})...`);
		let result: any;

		if (model === 'seedvr') {
			result = await fal.subscribe('fal-ai/seedvr/upscale/image', {
				input: {
					image_url: imageUrl,
					upscale_mode: 'factor',
					upscale_factor: options?.upscaleFactor ?? 2,
					target_resolution: '1080p',
					noise_scale: 0.1,
					output_format: 'png'
				} as any, // Cast input to any as requested
				logs: true,
				onQueueUpdate: (update) => {
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers] [upscale]', msg));
					}
				}
			});
		} else if (model === 'aurasr') {
			result = await fal.subscribe('fal-ai/aura-sr', {
				input: {
					image_url: imageUrl,
					upscaling_factor: (options?.upscaleFactor ?? 4) as any
				} as any, // Cast input to any as requested

				logs: true,
				onQueueUpdate: (update) => {
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers] [upscale]', msg));
					}
				}
			});
		} else if (model === 'esrgan') {
			result = await fal.subscribe('fal-ai/esrgan', {
				input: {
					image_url: imageUrl,
					face_enhance: true, // Commonly desired with ESRGAN
					denoise: options?.denoise ?? 3 // Default to Level 3 as requested ("usually High/Level 3")
				} as any, // Cast input to any as requested

				logs: true,
				onQueueUpdate: (update) => {
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers] [upscale]', msg));
					}
				}
			});
		} else if (model === 'recraft-creative') {
			result = await fal.subscribe('fal-ai/recraft/upscale/creative', {
				input: {
					image_url: imageUrl
				} as any, // Cast input to any as requested

				logs: true,
				onQueueUpdate: (update) => {
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers] [upscale]', msg));
					}
				}
			});
		} else if (model === 'ccsr') {
			result = await fal.subscribe('fal-ai/ccsr', {
				input: {
					image_url: imageUrl,
					scale: 1.5, // Default from request
					tile_diffusion: 'none',
					tile_diffusion_size: 1024,
					tile_diffusion_stride: 512,
					tile_vae_decoder_size: 314, // Note: using 314 as requested, though seems specific
					tile_vae_encoder_size: 1024,
					steps: 30,
					t_max: 0.5,
					t_min: 0.4,
					color_fix_type: 'adain'
				} as any,

				logs: true,
				onQueueUpdate: (update) => {
					if (update.status === 'IN_PROGRESS' && update.logs) {
						update.logs
							.map((log) => log.message)
							.forEach((msg) => console.log('[fal-layers] [upscale]', msg));
					}
				}
			});
		} else {
			throw new Error(`Unknown upscale model: ${model}`);
		}

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

export interface RemoveElementRequest {
	imageUrl: string;
	prompt: string; // What to remove from the image
	imageWidth?: number;
	imageHeight?: number;
	guidanceScale?: number;
	numInferenceSteps?: number;
	seed?: number;
}

export interface RemoveElementResponse {
	success: boolean;
	resultUrl?: string;
	seed?: number;
	error?: string;
}

/**
 * Submit a remove element task to the fal.ai queue.
 */
export async function submitRemoveElement(
	request: RemoveElementRequest
): Promise<{ requestId: string }> {
	initFal();
	const imageSize =
		request.imageWidth && request.imageHeight
			? {
					width: request.imageWidth,
					height: request.imageHeight
				}
			: undefined;

	const res = await fal.queue.submit('fal-ai/qwen-image-edit-2509-lora-gallery/remove-element', {
		input: {
			image_urls: [request.imageUrl],
			prompt: request.prompt || 'Remove the specified element from the scene',
			guidance_scale: request.guidanceScale ?? 1,
			num_inference_steps: request.numInferenceSteps ?? 6,
			acceleration: 'regular',
			negative_prompt: ' ',
			enable_safety_checker: true,
			output_format: 'png',
			num_images: 1,
			lora_scale: 1,
			...(imageSize && { image_size: imageSize }),
			...(request.seed && { seed: request.seed })
		}
	});
	return { requestId: res.request_id };
}

/**
 * Remove unwanted elements from images using Qwen-Image-Edit-Remover-General-LoRA.
 * Cleanly removes specified elements while maintaining consistency and quality.
 */
export async function removeElementFromImage(
	request: RemoveElementRequest
): Promise<RemoveElementResponse> {
	const isConfigured = initFal();
	if (!isConfigured) {
		console.log('[fal-layers] FAL_KEY not configured, returning mock data for remove element');
		return {
			success: true,
			resultUrl: request.imageUrl, // Return original in mock mode
			seed: 12345
		};
	}

	const maxAttempts = 3;
	let lastError: unknown;
	let delay = 2000;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			console.log(
				`[fal-layers] Attempt ${attempt}/${maxAttempts}: Calling fal.ai remove-element API...`
			);
			console.log('[fal-layers] Image URL:', request.imageUrl);
			console.log('[fal-layers] Remove prompt:', request.prompt);

			// Build image_size parameter if dimensions provided
			const imageSize =
				request.imageWidth && request.imageHeight
					? {
							width: request.imageWidth,
							height: request.imageHeight
						}
					: undefined;

			const result = await fal.subscribe(
				'fal-ai/qwen-image-edit-2509-lora-gallery/remove-element',
				{
					input: {
						image_urls: [request.imageUrl],
						prompt: request.prompt || 'Remove the specified element from the scene',
						guidance_scale: request.guidanceScale ?? 1,
						num_inference_steps: request.numInferenceSteps ?? 6,
						acceleration: 'regular',
						negative_prompt: ' ',
						enable_safety_checker: true,
						output_format: 'png',
						num_images: 1,
						lora_scale: 1,
						...(imageSize && { image_size: imageSize }),
						...(request.seed && { seed: request.seed })
					},
					logs: true,
					onQueueUpdate: (update) => {
						console.log('[fal-layers] [remove-element] Queue status:', update.status);
						if (update.status === 'IN_PROGRESS' && update.logs) {
							update.logs
								.map((log) => log.message)
								.forEach((msg) => console.log('[fal-layers] [remove-element]', msg));
						}
					}
				}
			);

			console.log('[fal-layers] Remove element result:', JSON.stringify(result.data, null, 2));

			// Extract the first image from results
			const images = result.data.images as Array<{ url: string }>;
			if (images && images.length > 0 && images[0].url) {
				return {
					success: true,
					resultUrl: images[0].url,
					seed: result.data.seed as number | undefined
				};
			}

			throw new Error('No image URL in remove element response');
		} catch (error: unknown) {
			lastError = error;
			console.error(`[fal-layers] Remove element attempt ${attempt} failed:`, error);

			const isRetryable = isRetryableError(error);
			if (attempt < maxAttempts && isRetryable) {
				console.log(`[fal-layers] Retrying remove element in ${delay}ms...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay = Math.min(delay * 2, 15000);
				continue;
			}
			break;
		}
	}

	const errorMessage =
		lastError instanceof Error
			? lastError.message
			: typeof lastError === 'object' && lastError !== null && 'message' in lastError
				? String((lastError as { message: unknown }).message)
				: 'Unknown error calling fal.ai remove element API';

	console.error('[fal-layers] Remove element all attempts failed. Last error:', errorMessage);

	return {
		success: false,
		error: errorMessage
	};
}
