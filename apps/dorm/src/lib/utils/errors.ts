/**
 * Centralized Error Handling Utilities
 *
 * This module provides consistent error handling across the application:
 * - Standardized error types and codes
 * - Consistent error logging
 * - Error response formatting
 * - Error classification (client vs server errors)
 * - Proper error sanitization
 */

import { error, fail, type NumericRange } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Error Types & Codes
// ============================================================================

export enum ErrorCode {
	// Authentication & Authorization (401, 403)
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	PERMISSION_DENIED = 'PERMISSION_DENIED',

	// Validation (400)
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	INVALID_INPUT = 'INVALID_INPUT',
	DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
	CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

	// Resource Errors (404, 409, 410)
	NOT_FOUND = 'NOT_FOUND',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	CONFLICT = 'CONFLICT',
	GONE = 'GONE',

	// Business Logic (422)
	BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
	INVALID_STATE = 'INVALID_STATE',
	INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
	LEASE_EXPIRED = 'LEASE_EXPIRED',

	// Database (500)
	DATABASE_ERROR = 'DATABASE_ERROR',
	QUERY_FAILED = 'QUERY_FAILED',
	TRANSACTION_FAILED = 'TRANSACTION_FAILED',

	// External Services (502, 503, 504)
	EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	TIMEOUT = 'TIMEOUT',

	// Internal (500)
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorContext {
	/** User ID if available */
	userId?: string;
	/** User role if available */
	userRole?: string;
	/** Resource ID being operated on */
	resourceId?: string | number;
	/** Resource type (e.g., 'tenant', 'lease', 'payment') */
	resourceType?: string;
	/** Additional metadata */
	metadata?: Record<string, any>;
	/** Request path */
	path?: string;
	/** Action being performed */
	action?: string;
}

export interface AppError {
	/** Error code for classification */
	code: ErrorCode;
	/** User-friendly message */
	message: string;
	/** HTTP status code */
	status: NumericRange<400, 599>;
	/** Technical details (not shown to users) */
	details?: string;
	/** Context information */
	context?: ErrorContext;
	/** Original error if any */
	originalError?: unknown;
}

// ============================================================================
// Error Classification Helpers
// ============================================================================

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(status: number): boolean {
	return status >= 400 && status < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(status: number): boolean {
	return status >= 500 && status < 600;
}

/**
 * Check if error should be retried
 */
export function isRetryableError(status: number): boolean {
	return [408, 429, 500, 502, 503, 504].includes(status);
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a standardized error object
 */
export function createError(
	code: ErrorCode,
	message: string,
	status: NumericRange<400, 599>,
	details?: string,
	context?: ErrorContext,
	originalError?: unknown
): AppError {
	return {
		code,
		message,
		status,
		details,
		context,
		originalError
	};
}

/**
 * Create an unauthorized error (401)
 */
export function createUnauthorizedError(
	message = 'You must be logged in to access this resource',
	context?: ErrorContext
): AppError {
	return createError(ErrorCode.UNAUTHORIZED, message, 401, undefined, context);
}

/**
 * Create a forbidden error (403)
 */
export function createForbiddenError(
	message = 'You do not have permission to perform this action',
	context?: ErrorContext
): AppError {
	return createError(ErrorCode.FORBIDDEN, message, 403, undefined, context);
}

/**
 * Create a validation error (400)
 */
export function createValidationError(
	message: string,
	details?: string,
	context?: ErrorContext
): AppError {
	return createError(ErrorCode.VALIDATION_ERROR, message, 400, details, context);
}

/**
 * Create a not found error (404)
 */
export function createNotFoundError(
	resourceType: string,
	resourceId?: string | number,
	context?: ErrorContext
): AppError {
	const message = resourceId
		? `${resourceType} with ID ${resourceId} not found`
		: `${resourceType} not found`;

	return createError(
		ErrorCode.RESOURCE_NOT_FOUND,
		message,
		404,
		undefined,
		{ ...context, resourceType, resourceId }
	);
}

/**
 * Create a conflict error (409)
 */
export function createConflictError(
	message: string,
	details?: string,
	context?: ErrorContext
): AppError {
	return createError(ErrorCode.CONFLICT, message, 409, details, context);
}

/**
 * Create a business rule violation error (422)
 */
export function createBusinessRuleError(
	message: string,
	details?: string,
	context?: ErrorContext
): AppError {
	return createError(ErrorCode.BUSINESS_RULE_VIOLATION, message, 422, details, context);
}

/**
 * Create a database error (500)
 */
export function createDatabaseError(
	message = 'A database error occurred',
	originalError?: unknown,
	context?: ErrorContext
): AppError {
	return createError(
		ErrorCode.DATABASE_ERROR,
		message,
		500,
		originalError instanceof Error ? originalError.message : String(originalError),
		context,
		originalError
	);
}

/**
 * Create an internal server error (500)
 */
export function createInternalError(
	message = 'An unexpected error occurred',
	originalError?: unknown,
	context?: ErrorContext
): AppError {
	return createError(
		ErrorCode.INTERNAL_ERROR,
		message,
		500,
		originalError instanceof Error ? originalError.message : String(originalError),
		context,
		originalError
	);
}

// ============================================================================
// Supabase Error Handling
// ============================================================================

/**
 * Convert Supabase error to AppError
 */
export function handleSupabaseError(
	supabaseError: any,
	context?: ErrorContext
): AppError {
	const errorMessage = supabaseError?.message || 'Database operation failed';

	// Check for specific error patterns
	if (errorMessage.includes('duplicate key')) {
		return createError(
			ErrorCode.DUPLICATE_ENTRY,
			'A record with this information already exists',
			409,
			errorMessage,
			context,
			supabaseError
		);
	}

	if (errorMessage.includes('foreign key')) {
		return createError(
			ErrorCode.CONSTRAINT_VIOLATION,
			'This operation would violate data integrity constraints',
			400,
			errorMessage,
			context,
			supabaseError
		);
	}

	if (errorMessage.includes('violates check constraint')) {
		return createValidationError(
			'The provided data does not meet validation requirements',
			errorMessage,
			context
		);
	}

	if (errorMessage.includes('Policy check failed') || errorMessage.includes('permission')) {
		return createForbiddenError(
			'You do not have permission to perform this operation',
			context
		);
	}

	if (errorMessage.includes('not found')) {
		return createError(
			ErrorCode.NOT_FOUND,
			'The requested resource was not found',
			404,
			errorMessage,
			context,
			supabaseError
		);
	}

	// Default to database error
	return createDatabaseError(
		'A database error occurred. Please try again.',
		supabaseError,
		context
	);
}

// ============================================================================
// Error Logging
// ============================================================================

export interface ErrorLogOptions {
	/** Log level */
	level?: 'error' | 'warn' | 'info';
	/** Whether to log to console */
	console?: boolean;
	/** Whether to log to external service (future: Sentry, etc.) */
	external?: boolean;
}

/**
 * Log error with context
 */
export function logError(
	appError: AppError,
	options: ErrorLogOptions = {}
): void {
	const {
		level = 'error',
		console: logToConsole = true,
		external = false
	} = options;

	// Prepare log entry
	const logEntry = {
		timestamp: new Date().toISOString(),
		level,
		code: appError.code,
		message: appError.message,
		status: appError.status,
		details: appError.details,
		context: appError.context,
		stack: appError.originalError instanceof Error ? appError.originalError.stack : undefined
	};

	// Console logging
	if (logToConsole) {
		const logMessage = `[${appError.code}] ${appError.message}`;
		const logDetails = {
			status: appError.status,
			context: appError.context,
			details: appError.details
		};

		switch (level) {
			case 'error':
				console.error(logMessage, logDetails);
				if (appError.originalError) {
					console.error('Original error:', appError.originalError);
				}
				break;
			case 'warn':
				console.warn(logMessage, logDetails);
				break;
			case 'info':
				console.info(logMessage, logDetails);
				break;
		}
	}

	// External logging (future: send to Sentry, LogRocket, etc.)
	if (external) {
		// TODO: Implement external error tracking
		// sendToSentry(logEntry);
	}
}

// ============================================================================
// Error Response Formatting
// ============================================================================

/**
 * Throw a SvelteKit error from AppError
 */
export function throwError(appError: AppError, logOptions?: ErrorLogOptions): never {
	// Log the error
	logError(appError, logOptions);

	// Throw SvelteKit error (navigates to error page)
	throw error(appError.status, {
		message: appError.message,
		code: appError.code
	});
}

/**
 * Return a SvelteKit fail response from AppError
 */
export function failWithError(
	appError: AppError,
	form?: any,
	logOptions?: ErrorLogOptions
): ReturnType<typeof fail> {
	// Log the error
	logError(appError, logOptions);

	// Return fail response (stays on same page with error)
	return fail(appError.status, {
		form,
		error: appError.message,
		code: appError.code
	});
}

/**
 * Return a JSON error response
 */
export function jsonError(appError: AppError, logOptions?: ErrorLogOptions) {
	// Log the error
	logError(appError, logOptions);

	// Return JSON response
	return new Response(
		JSON.stringify({
			error: {
				code: appError.code,
				message: appError.message,
				status: appError.status
			}
		}),
		{
			status: appError.status,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
}

// ============================================================================
// Error Recovery Utilities
// ============================================================================

export interface RetryOptions {
	/** Maximum number of retry attempts */
	maxAttempts?: number;
	/** Initial delay in milliseconds */
	initialDelay?: number;
	/** Backoff multiplier */
	backoffMultiplier?: number;
	/** Maximum delay in milliseconds */
	maxDelay?: number;
	/** Custom retry condition */
	shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const {
		maxAttempts = 3,
		initialDelay = 1000,
		backoffMultiplier = 2,
		maxDelay = 10000,
		shouldRetry = () => true
	} = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (err) {
			lastError = err;

			// Check if we should retry
			if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
				throw err;
			}

			// Calculate delay with exponential backoff
			const delay = Math.min(
				initialDelay * Math.pow(backoffMultiplier, attempt - 1),
				maxDelay
			);

			console.warn(
				`Operation failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`,
				err
			);

			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Execute operation with rollback on failure
 */
export async function withRollback<T>(
	operation: () => Promise<T>,
	rollback: () => Promise<void>,
	context?: ErrorContext
): Promise<T> {
	try {
		return await operation();
	} catch (err) {
		console.error('Operation failed, attempting rollback...', err);

		try {
			await rollback();
			console.info('Rollback completed successfully');
		} catch (rollbackErr) {
			console.error('Rollback failed:', rollbackErr);
			// Log both errors
			const rollbackError = createInternalError(
				'Operation failed and rollback also failed',
				{ original: err, rollback: rollbackErr },
				context
			);
			logError(rollbackError);
		}

		throw err;
	}
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Assert that a value is defined (not null/undefined)
 */
export function assertDefined<T>(
	value: T | null | undefined,
	fieldName: string,
	context?: ErrorContext
): asserts value is T {
	if (value === null || value === undefined) {
		throw failWithError(
			createValidationError(
				`${fieldName} is required`,
				undefined,
				context
			)
		);
	}
}

/**
 * Assert that a condition is true
 */
export function assertTrue(
	condition: boolean,
	message: string,
	context?: ErrorContext
): asserts condition {
	if (!condition) {
		throw failWithError(
			createBusinessRuleError(message, undefined, context)
		);
	}
}
