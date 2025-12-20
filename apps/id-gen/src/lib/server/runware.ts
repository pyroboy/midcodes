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
