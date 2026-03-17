// Image Upload Utilities
// Functions: blobToDataUrl(), fetchBackgroundAsBlob(), validateImageFile()

import { getProxiedUrl } from '$lib/utils/storage';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Maximum file size for uploads (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate an image file for upload
 * @param file - The file to validate
 * @returns null if valid, error message string if invalid
 */
export function validateImageFile(file: File): string | null {
	if (!file) {
		return 'No file provided for upload';
	}
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		return `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
	}
	if (file.size > MAX_FILE_SIZE) {
		return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 10MB`;
	}
	if (file.size === 0) {
		return 'File is empty';
	}
	return null;
}

/**
 * Convert a Blob or File to a data URL string
 * @param blob - The blob or file to convert
 * @returns Promise resolving to base64 data URL
 * @throws Error if conversion fails
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!blob) {
			reject(new Error('No blob provided for conversion'));
			return;
		}

		if (blob.size === 0) {
			reject(new Error('Empty blob provided for conversion'));
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === 'string') {
				resolve(result);
			} else {
				reject(new Error('FileReader did not return a string result'));
			}
		};
		reader.onerror = () => {
			reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
		};
		reader.onabort = () => {
			reject(new Error('FileReader was aborted'));
		};
		reader.readAsDataURL(blob);
	});
}

/**
 * Fetch an image from a URL and return as a Blob
 * Automatically routes through proxy for external URLs to handle CORS
 * @param url - The URL to fetch the image from
 * @param useProxy - Whether to route through the image proxy for CORS (default: true for external URLs)
 * @returns Promise resolving to the image Blob
 * @throws Error if fetch fails or response is not valid
 */
export async function fetchBackgroundAsBlob(url: string, useProxy: boolean = true): Promise<Blob> {
	if (!url) {
		throw new Error('No URL provided for fetch');
	}

	// Skip proxy for blob URLs and data URLs
	if (url.startsWith('blob:') || url.startsWith('data:')) {
		useProxy = false;
	}

	// Skip proxy for local paths
	if (url.startsWith('/') && !url.startsWith('//')) {
		useProxy = false;
	}

	// Validate URL format for external URLs
	if (!url.startsWith('/') && !url.startsWith('data:') && !url.startsWith('blob:')) {
		try {
			new URL(url);
		} catch {
			throw new Error(`Invalid URL format: ${url}`);
		}
	}

	// Use proxy for external URLs to handle CORS
	let fetchUrl = url;
	if (useProxy) {
		const proxiedUrl = getProxiedUrl(url, 'templates');
		if (proxiedUrl) {
			fetchUrl = proxiedUrl;
			console.log(`🔄 [fetchBackgroundAsBlob] Using proxy:`, { original: url, proxied: fetchUrl });
		}
	}

	try {
		const response = await fetch(fetchUrl);

		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type');
		if (contentType && !contentType.startsWith('image/')) {
			console.warn(`[fetchBackgroundAsBlob] Unexpected content type: ${contentType}`);
		}

		const blob = await response.blob();

		if (blob.size === 0) {
			throw new Error('Received empty blob from server');
		}

		console.log(`✅ [fetchBackgroundAsBlob] Fetched successfully:`, {
			url: url.substring(0, 50) + '...',
			size: blob.size,
			type: blob.type
		});

		return blob;
	} catch (error) {
		if (error instanceof TypeError && error.message.includes('fetch')) {
			throw new Error(`Network error fetching image: ${url}`);
		}
		throw error;
	}
}
