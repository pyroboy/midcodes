import { fileTypeFromBuffer } from 'file-type';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type ImageValidationResult = {
	valid: boolean;
	error?: string;
	sanitizedName?: string;
};

export type ServerImageValidationResult = {
	valid: boolean;
	error?: string;
	sanitizedName?: string;
	detectedMime?: string;
};

/**
 * SECURITY: Improved filename sanitization
 * - Removes path components
 * - Handles double extensions (e.g., malware.php.jpg)
 * - Rejects hidden files
 * - Only allows whitelisted extensions
 */
export function sanitizeFilename(name: string): string {
	// Remove path separators and get base filename
	const base = name.split(/[/\\]/).pop() || 'upload';

	// Reject hidden files (starting with dot)
	if (base.startsWith('.')) {
		return 'upload.unknown';
	}

	// Split into name parts and extension
	const parts = base.split('.');

	// Get the last extension
	const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';

	// Join remaining parts as the name (removes double extensions like .php.jpg)
	const nameWithoutExt = parts.join('_');

	// Sanitize name part (no dots, only alphanumeric, underscore, hyphen)
	const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_') || 'upload';

	// Validate extension against whitelist
	const safeExt = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) ? ext : 'unknown';

	return `${safeName}.${safeExt}`;
}

/**
 * Client-side validation (for quick feedback)
 * SECURITY WARNING: This should NOT be trusted server-side
 */
export function validateImageUpload(file: File): ImageValidationResult {
	if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as any)) {
		return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' };
	}

	if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
		return { valid: false, error: 'File too large. Maximum size: 10MB' };
	}

	const sanitizedName = sanitizeFilename(file.name);

	// Reject if extension couldn't be validated
	if (sanitizedName.endsWith('.unknown')) {
		return { valid: false, error: 'Invalid file extension' };
	}

	return { valid: true, sanitizedName };
}

/**
 * SECURITY: Server-side validation with magic byte checking
 * This validates the actual file content, not just the claimed MIME type
 *
 * @param buffer - ArrayBuffer of the file content
 * @param claimedFilename - Original filename (for extension extraction)
 * @returns Validation result with detected MIME type
 */
export async function validateImageUploadServer(
	buffer: ArrayBuffer,
	claimedFilename: string
): Promise<ServerImageValidationResult> {
	// Size check
	if (buffer.byteLength > MAX_IMAGE_FILE_SIZE_BYTES) {
		return { valid: false, error: 'File too large. Maximum size: 10MB' };
	}

	// Magic byte validation
	const uint8Array = new Uint8Array(buffer);
	const fileType = await fileTypeFromBuffer(uint8Array);

	if (!fileType) {
		return { valid: false, error: 'Could not determine file type' };
	}

	// Check if detected MIME is allowed
	if (!ALLOWED_IMAGE_MIME_TYPES.includes(fileType.mime as any)) {
		return {
			valid: false,
			error: `Invalid file type detected: ${fileType.mime}. Allowed: JPEG, PNG, WebP`,
			detectedMime: fileType.mime
		};
	}

	// SECURITY: Explicitly reject SVG (can contain XSS)
	if (fileType.mime === 'image/svg+xml') {
		return {
			valid: false,
			error: 'SVG files are not allowed for security reasons',
			detectedMime: fileType.mime
		};
	}

	// Sanitize filename
	const sanitizedName = sanitizeFilename(claimedFilename);

	// Override extension with detected type for extra safety
	const nameWithoutExt = sanitizedName.replace(/\.[^.]*$/, '');
	const safeFilename = `${nameWithoutExt}.${fileType.ext}`;

	return {
		valid: true,
		sanitizedName: safeFilename,
		detectedMime: fileType.mime
	};
}

/**
 * Validate file from a File object server-side
 * Convenience wrapper that reads the file buffer
 */
export async function validateFileServer(file: File): Promise<ServerImageValidationResult> {
	const buffer = await file.arrayBuffer();
	return validateImageUploadServer(buffer, file.name);
}
