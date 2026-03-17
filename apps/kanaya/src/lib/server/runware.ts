/**
 * Runware AI API Service
 * Server-side service for background removal using Runware's AI API.
 */

import { env } from './env';

const RUNWARE_API_URL = 'https://api.runware.ai/v1';

export interface RunwareBackgroundRemovalRequest {
	taskType: 'imageBackgroundRemoval';
	taskUUID: string;
	inputImage: string; // Base64 image or URL
	outputType: ('URL' | 'base64Data' | 'dataURI')[];
	outputFormat: 'PNG' | 'WEBP' | 'JPG';
	model?: string;
	includeCost?: boolean;
	settings?: {
		rgba?: [number, number, number, number];
		alphaMattingForegroundThreshold?: number;
		alphaMattingBackgroundThreshold?: number;
		alphaMattingErodeSize?: number;
	};
}

export interface RunwareBackgroundRemovalResponse {
	data: {
		taskType: string;
		imageUUID: string;
		imageURL?: string;
		imageBase64Data?: string;
		cost?: number;
	}[];
	error?: {
		message: string;
		code: string;
	};
}

export interface BackgroundRemovalResult {
	success: boolean;
	imageUrl?: string;
	imageBase64?: string;
	cost?: number;
	error?: string;
}

/**
 * Remove background from an image using Runware AI API.
 *
 * @param imageBase64 - Base64 encoded image data (with or without data URI prefix)
 * @returns Result with processed image URL or base64 data
 */
// ============ IMAGE UPSCALE ============

export interface RunwareUpscaleRequest {
	taskType: 'imageUpscale';
	taskUUID: string;
	inputImage: string; // URL or base64
	outputType: ('URL' | 'base64Data' | 'dataURI')[];
	outputFormat: 'WEBP' | 'PNG' | 'JPG' | 'JPEG';
	includeCost: boolean;
	upscaleFactor: 2 | 4;
	model: string;
}

export interface UpscaleResult {
	success: boolean;
	imageUrl?: string;
	imageBase64?: string;
	cost?: number;
	error?: string;
}

/**
 * Upscale an image using Runware AI API.
 * Uses the runware:503@1 model with 2x upscale factor.
 */
export async function upscaleImageWithRunware(
	imageInput: string, // URL or base64
	upscaleFactor: 2 | 4 = 4
): Promise<UpscaleResult> {
	const RUNWARE_API_KEY = env.RUNWARE_API_KEY;

	if (!RUNWARE_API_KEY) {
		console.error('[Runware] API key not configured');
		return {
			success: false,
			error: 'Runware API key not configured.'
		};
	}

	const requestBody: RunwareUpscaleRequest[] = [
		{
			taskType: 'imageUpscale',
			taskUUID: crypto.randomUUID(),
			inputImage: imageInput,
			outputType: ['URL'],
			outputFormat: 'WEBP',
			includeCost: true,
			upscaleFactor,
			model: 'runware:503@1'
		}
	];

	try {
		console.log('[Runware] Sending upscale request...');

		const response = await fetch(RUNWARE_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${RUNWARE_API_KEY}`
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Runware] Upscale API error:', response.status, errorText);
			return {
				success: false,
				error: `Runware API error: ${response.status} - ${errorText}`
			};
		}

		const result = await response.json();

		if (result.error) {
			console.error('[Runware] Upscale API returned error:', result.error);
			return {
				success: false,
				error: result.error.message || 'Unknown Runware API error'
			};
		}

		if (!result.data || result.data.length === 0) {
			console.error('[Runware] No data in upscale response');
			return {
				success: false,
				error: 'No data returned from Runware API'
			};
		}

		const processedImage = result.data[0];
		console.log('[Runware] Upscale successful, cost:', processedImage.cost);

		return {
			success: true,
			imageUrl: processedImage.imageURL,
			imageBase64: processedImage.imageBase64Data,
			cost: processedImage.cost
		};
	} catch (error) {
		console.error('[Runware] Upscale request failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to connect to Runware API'
		};
	}
}

// ============ IMAGE EDIT (REMOVE ELEMENTS) ============

export type RemoveType = 'face' | 'text' | 'logo' | 'qr' | 'all';

export interface RunwareEditRequest {
	taskType: 'imageInference';
	taskUUID: string;
	numberResults: number;
	outputFormat: 'JPEG' | 'PNG' | 'WEBP';
	includeCost: boolean;
	outputType: ('URL' | 'dataURI')[];
	providerSettings?: {
		prunaai?: {
			turbo?: boolean;
		};
	};
	model: string;
	positivePrompt: string;
	inputs: {
		referenceImages: string[];
	};
	safety?: {
		checkContent: boolean;
	};
}

export interface EditResult {
	success: boolean;
	imageUrl?: string;
	imageDataUri?: string;
	cost?: number;
	error?: string;
}

/**
 * Remove elements from an image using Runware AI API.
 * Uses prunaai:2@1 model for element removal.
 */
export async function editImageWithRunware(
	imageInput: string, // URL or base64
	removeType: RemoveType,
	customPrompt?: string
): Promise<EditResult> {
	const RUNWARE_API_KEY = env.RUNWARE_API_KEY;

	if (!RUNWARE_API_KEY) {
		console.error('[Runware] API key not configured');
		return {
			success: false,
			error: 'Runware API key not configured.'
		};
	}

	// Build prompt based on remove type
	const promptMap: Record<RemoveType, string> = {
		face: 'remove body and face',
		text: 'remove text',
		logo: 'Remove logo and logo brand',
		qr: 'remove qr code/ barcode',
		all: 'remove text, face, and logo from this image'
	};

	const requestBody: RunwareEditRequest[] = [
		{
			taskType: 'imageInference',
			taskUUID: crypto.randomUUID(),
			numberResults: 1,
			outputFormat: 'JPEG',
			includeCost: true,
			outputType: ['URL', 'dataURI'],
			providerSettings: {
				prunaai: {
					turbo: true
				}
			},
			model: 'prunaai:2@1',
			positivePrompt:
				customPrompt && customPrompt.trim().length > 0 ? customPrompt : promptMap[removeType],
			inputs: {
				referenceImages: [imageInput]
			},
			safety: {
				checkContent: false
			}
		}
	];

	try {
		console.log('[Runware] Sending edit request for:', removeType);

		const response = await fetch(RUNWARE_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${RUNWARE_API_KEY}`
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Runware] Edit API error:', response.status, errorText);
			return {
				success: false,
				error: `Runware API error: ${response.status} - ${errorText}`
			};
		}

		const result = await response.json();

		if (result.error) {
			console.error('[Runware] Edit API returned error:', result.error);
			return {
				success: false,
				error: result.error.message || 'Unknown Runware API error'
			};
		}

		if (!result.data || result.data.length === 0) {
			console.error('[Runware] No data in edit response');
			return {
				success: false,
				error: 'No data returned from Runware API'
			};
		}

		const processedImage = result.data[0];
		console.log('[Runware] Edit successful, cost:', processedImage.cost);

		return {
			success: true,
			imageUrl: processedImage.imageURL,
			imageDataUri: processedImage.imageDataURI,
			cost: processedImage.cost
		};
	} catch (error) {
		console.error('[Runware] Edit request failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to connect to Runware API'
		};
	}
}

// ============ BACKGROUND REMOVAL ============

export async function removeBackgroundWithRunware(
	imageBase64: string
): Promise<BackgroundRemovalResult> {
	const RUNWARE_API_KEY = env.RUNWARE_API_KEY;

	if (!RUNWARE_API_KEY) {
		console.error('[Runware] API key not configured');
		return {
			success: false,
			error: 'Runware API key not configured. Please add RUNWARE_API_KEY to your environment.'
		};
	}

	// Ensure we have clean base64 data (remove data URI prefix if present)
	let cleanBase64 = imageBase64;
	if (imageBase64.includes(',')) {
		cleanBase64 = imageBase64.split(',')[1];
	}

	const requestBody: RunwareBackgroundRemovalRequest[] = [
		{
			taskType: 'imageBackgroundRemoval',
			taskUUID: crypto.randomUUID(),
			inputImage: cleanBase64,
			outputType: ['URL'],
			outputFormat: 'PNG',
			model: 'runware:110@1',
			includeCost: true
		}
	];

	try {
		console.log('[Runware] Sending background removal request...');

		const response = await fetch(RUNWARE_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${RUNWARE_API_KEY}`
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Runware] API error:', response.status, errorText);
			return {
				success: false,
				error: `Runware API error: ${response.status} - ${errorText}`
			};
		}

		const result = (await response.json()) as RunwareBackgroundRemovalResponse;

		if (result.error) {
			console.error('[Runware] API returned error:', result.error);
			return {
				success: false,
				error: result.error.message || 'Unknown Runware API error'
			};
		}

		if (!result.data || result.data.length === 0) {
			console.error('[Runware] No data in response');
			return {
				success: false,
				error: 'No data returned from Runware API'
			};
		}

		const processedImage = result.data[0];
		console.log('[Runware] Background removal successful, cost:', processedImage.cost);

		return {
			success: true,
			imageUrl: processedImage.imageURL,
			imageBase64: processedImage.imageBase64Data,
			cost: processedImage.cost
		};
	} catch (error) {
		console.error('[Runware] Request failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to connect to Runware API'
		};
	}
}
