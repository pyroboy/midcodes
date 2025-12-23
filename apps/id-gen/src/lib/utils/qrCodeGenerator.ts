/**
 * QR Code Generation Utilities
 *
 * Generates QR codes for digital profile URLs using the qrcode library.
 * Supports both browser (canvas) and server (data URL) rendering.
 */

import QRCode from 'qrcode';
import { buildDigitalProfileUrl } from './slugGeneration';

// --- Types ---

export interface QRCodeOptions {
	/** Width of the QR code in pixels */
	width?: number;
	/** Margin around the QR code (in modules) */
	margin?: number;
	/** Error correction level: L (7%), M (15%), Q (25%), H (30%) */
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	/** Colors for the QR code */
	color?: {
		dark?: string;
		light?: string;
	};
}

export interface QRRenderResult {
	dataUrl: string;
	width: number;
	height: number;
}

// --- Default Options ---

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
	width: 256,
	margin: 2,
	errorCorrectionLevel: 'M',
	color: {
		dark: '#000000',
		light: '#ffffff'
	}
};

// --- Generation Functions ---

/**
 * Generate a QR code as a data URL (base64 PNG)
 *
 * Works in both browser and server environments.
 *
 * @param content - The content to encode (URL, text, etc.)
 * @param options - QR code options
 * @returns Data URL string (e.g., "data:image/png;base64,...")
 */
export async function generateQRDataUrl(
	content: string,
	options: QRCodeOptions = {}
): Promise<string> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return QRCode.toDataURL(content, {
		width: opts.width,
		margin: opts.margin,
		errorCorrectionLevel: opts.errorCorrectionLevel,
		color: opts.color
	});
}

/**
 * Generate a QR code directly onto a canvas element
 *
 * Browser-only. Useful for live preview rendering.
 *
 * @param content - The content to encode
 * @param canvas - Canvas element to draw on
 * @param options - QR code options
 */
export async function generateQRToCanvas(
	content: string,
	canvas: HTMLCanvasElement,
	options: QRCodeOptions = {}
): Promise<void> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	await QRCode.toCanvas(canvas, content, {
		width: opts.width,
		margin: opts.margin,
		errorCorrectionLevel: opts.errorCorrectionLevel,
		color: opts.color
	});
}

/**
 * Generate a QR code for a digital profile URL
 *
 * Convenience function that builds the full URL from a slug.
 *
 * @param slug - Digital card slug (e.g., "PNGS-abc1234567")
 * @param options - QR code options
 * @returns Data URL string
 */
export async function generateProfileQRDataUrl(
	slug: string,
	options: QRCodeOptions = {}
): Promise<string> {
	const url = buildDigitalProfileUrl(slug);
	return generateQRDataUrl(url, options);
}

/**
 * Load a QR code data URL as an Image element
 *
 * Useful for drawing onto canvas contexts.
 *
 * @param dataUrl - QR code data URL
 * @returns Loaded Image element
 */
export function loadQRImage(dataUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load QR code image'));
		img.src = dataUrl;
	});
}

/**
 * Generate QR code and return as loaded Image element
 *
 * Combines generation and loading for canvas rendering.
 *
 * @param content - Content to encode
 * @param options - QR code options
 * @returns Loaded Image element ready for canvas drawing
 */
export async function generateQRImage(
	content: string,
	options: QRCodeOptions = {}
): Promise<HTMLImageElement> {
	const dataUrl = await generateQRDataUrl(content, options);
	return loadQRImage(dataUrl);
}

/**
 * Generate QR code for profile and return as loaded Image
 *
 * @param slug - Digital card slug
 * @param options - QR code options
 * @returns Loaded Image element
 */
export async function generateProfileQRImage(
	slug: string,
	options: QRCodeOptions = {}
): Promise<HTMLImageElement> {
	const url = buildDigitalProfileUrl(slug);
	return generateQRImage(url, options);
}

// --- Validation ---

/**
 * Calculate the minimum QR version needed for content
 *
 * Useful for determining if content fits within version 3 limit.
 *
 * @param content - Content to encode
 * @param errorLevel - Error correction level
 * @returns Estimated QR version (1-40)
 */
export function estimateQRVersion(
	content: string,
	errorLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): number {
	// Alphanumeric capacity per version at each error level
	// Version 3 capacities: L=77, M=61, Q=47, H=35
	const capacities: Record<string, number[]> = {
		L: [
			25, 47, 77, 114, 154, 195, 224, 279, 335, 395, 468, 535, 619, 667, 758, 854, 938, 1046, 1153,
			1249
		],
		M: [
			20, 38, 61, 90, 122, 154, 178, 221, 262, 311, 366, 419, 483, 528, 600, 656, 734, 816, 909,
			970
		],
		Q: [
			16, 29, 47, 67, 87, 108, 125, 157, 189, 221, 259, 296, 352, 376, 426, 470, 531, 574, 644, 702
		],
		H: [
			10, 20, 35, 50, 64, 84, 93, 122, 143, 174, 200, 227, 259, 283, 321, 365, 408, 452, 493, 557
		]
	};

	const contentLength = content.length;
	const caps = capacities[errorLevel];

	for (let version = 0; version < caps.length; version++) {
		if (caps[version] >= contentLength) {
			return version + 1;
		}
	}

	return 40; // Maximum version
}

/**
 * Check if content fits within QR version 3 (for compact codes)
 *
 * @param content - Content to encode
 * @param errorLevel - Error correction level
 * @returns True if content fits in version 3
 */
export function fitsInQRVersion3(
	content: string,
	errorLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): boolean {
	return estimateQRVersion(content, errorLevel) <= 3;
}
