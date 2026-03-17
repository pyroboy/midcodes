/**
 * Vision Service (Gemini Edition)
 * Server-side service for detecting elements on ID cards using Google Gemini 1.5 Flash.
 */

import { env } from './env';
import type { TemplateElementInput } from '$lib/schemas/template-element.schema';

// We'll use the REST API to avoid adding extra dependencies for now
const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface VisionDetectionResult {
	success: boolean;
	elements: TemplateElementInput[];
	rawResponse?: string;
	error?: string;
}

/**
 * Detect elements on an ID card image using Gemini 1.5 Flash.
 *
 * @param imageBase64 - Base64 encoded image data (with or without prefix)
 * @returns Detected elements mapped to TemplateElement sequence
 */
export async function detectElementsWithVision(
	imageBase64: string
): Promise<VisionDetectionResult> {
	const API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY;

	if (!API_KEY) {
		console.error('[Vision] Gemini API key not configured');
		return {
			success: false,
			elements: [],
			error: 'Google API key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env'
		};
	}

	// Ensure we have clean base64 data and mime type
	let cleanBase64 = imageBase64;
	let mimeType = 'image/png';

	if (imageBase64.includes(',')) {
		const parts = imageBase64.split(',');
		const match = parts[0].match(/data:(.*?);/);
		if (match) mimeType = match[1];
		cleanBase64 = parts[1];
	}

	const prompt = `
        Analyze this ID card image and detect all logical elements. 
        For each element, provide:
        1. type: 'text', 'photo', 'qr', 'image', or 'signature'
        2. x, y, width, height: Bounding box in pixels (estimate based on image context)
        3. variableName: A unique snake_case name (e.g., 'full_name', 'employee_id', 'photo', 'qr_code')
        4. side: 'front'
        5. Attributes: 
           - For text: content, fontSize (approx), color, textAlign
           - For photo/image: fit: 'cover'
        
        Return ONLY a JSON array of objects inside an "elements" field following this schema:
        {
          "elements": [
            {
              "type": "text",
              "x": number, "y": number, "width": number, "height": number,
              "variableName": "string",
              "side": "front",
              "content": "string",
              "fontSize": number,
              "color": "string",
              "visible": true,
              "rotation": 0,
              "opacity": 1
            }
          ]
        }
    `;

	try {
		console.log('[Vision] Sending detection request to Gemini Flash...');

		const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{ text: prompt },
							{
								inline_data: {
									mime_type: mimeType,
									data: cleanBase64
								}
							}
						]
					}
				],
				generationConfig: {
					response_mime_type: 'application/json',
					max_output_tokens: 2000
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Vision] Gemini API error:', response.status, errorText);
			return {
				success: false,
				elements: [],
				error: `Gemini API error: ${response.status}`
			};
		}

		const result = await response.json();
		const candidates = result.candidates || [];
		if (candidates.length === 0) {
			return { success: false, elements: [], error: 'No response candidates from Gemini' };
		}

		const contentText = candidates[0].content?.parts?.[0]?.text;
		if (!contentText) {
			return { success: false, elements: [], error: 'Empty text response from Gemini' };
		}

		const parsed = JSON.parse(contentText);
		const elements = parsed.elements || [];

		return {
			success: true,
			elements: elements as TemplateElementInput[],
			rawResponse: contentText
		};
	} catch (error) {
		console.error('[Vision] Gemini request failed:', error);
		return {
			success: false,
			elements: [],
			error: error instanceof Error ? error.message : 'Failed to connect to Gemini API'
		};
	}
}
