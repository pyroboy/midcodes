/**
 * ID Card Error Types
 *
 * Structured error types for ID card save operations.
 * Provides context-rich errors for debugging and user-friendly messages.
 */

export type IdCardErrorCode =
	| 'UPLOAD_FAILED'
	| 'DB_INSERT_FAILED'
	| 'DIGITAL_CARD_FAILED'
	| 'CLEANUP_PARTIAL'
	| 'CLEANUP_FAILED'
	| 'VALIDATION_FAILED'
	| 'TEMPLATE_NOT_FOUND'
	| 'UNAUTHORIZED'
	| 'SLUG_GENERATION_FAILED';

export interface IdCardError {
	code: IdCardErrorCode;
	message: string;
	details?: Record<string, unknown>;
	recoverable: boolean;
	/** Original error for logging */
	cause?: Error;
}

/**
 * User-facing error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<IdCardErrorCode, string> = {
	UPLOAD_FAILED: 'Failed to upload images. Please check your connection and try again.',
	DB_INSERT_FAILED: 'Failed to save card data. Please try again.',
	DIGITAL_CARD_FAILED: 'Card saved but digital profile creation failed. You can create it later.',
	CLEANUP_PARTIAL: 'An error occurred during cleanup. Some files may not have been removed.',
	CLEANUP_FAILED: 'Failed to clean up after error. Please contact support if issues persist.',
	VALIDATION_FAILED: 'Invalid data provided. Please check your input.',
	TEMPLATE_NOT_FOUND: 'Template not found. It may have been deleted.',
	UNAUTHORIZED: 'You do not have permission to perform this action.',
	SLUG_GENERATION_FAILED: 'Failed to generate a unique profile URL. Please try again.'
};

/**
 * Create a structured ID card error
 */
export function createIdCardError(
	code: IdCardErrorCode,
	details?: Record<string, unknown>,
	cause?: Error
): IdCardError {
	return {
		code,
		message: ERROR_MESSAGES[code],
		details,
		recoverable: isRecoverable(code),
		cause
	};
}

/**
 * Determine if an error is recoverable (user can retry)
 */
function isRecoverable(code: IdCardErrorCode): boolean {
	switch (code) {
		case 'UPLOAD_FAILED':
		case 'DB_INSERT_FAILED':
		case 'SLUG_GENERATION_FAILED':
			return true;
		case 'VALIDATION_FAILED':
		case 'TEMPLATE_NOT_FOUND':
		case 'UNAUTHORIZED':
			return false;
		case 'DIGITAL_CARD_FAILED':
		case 'CLEANUP_PARTIAL':
		case 'CLEANUP_FAILED':
			return true; // Operation partially succeeded
		default:
			return false;
	}
}

/**
 * Get the user-facing message for an error code
 */
export function getUserMessage(code: IdCardErrorCode): string {
	return ERROR_MESSAGES[code];
}

/**
 * Type guard to check if an object is an IdCardError
 */
export function isIdCardError(obj: unknown): obj is IdCardError {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'code' in obj &&
		'message' in obj &&
		'recoverable' in obj
	);
}

/**
 * Result type for cleanup operations
 */
export interface CleanupResult {
	success: boolean;
	deletedPaths: string[];
	failedPaths: string[];
	errors: Array<{ path: string; error: string }>;
}

/**
 * Result type for ID card save with partial success support
 */
export interface SaveIdCardResult {
	success: boolean;
	error?: IdCardError;
	/** Partial failures that didn't prevent the main operation */
	warnings?: IdCardError[];
	data?: {
		idCard: {
			id: string;
			templateId: string | null;
			orgId: string;
			frontImage: string | null;
			backImage: string | null;
		};
		digitalCard?: {
			id: string;
			slug: string;
			status: string;
			claimCode?: string;
			profileUrl?: string;
		};
	};
}
