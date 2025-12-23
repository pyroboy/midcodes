/**
 * Transaction Utilities for Database Operations
 *
 * Note: Neon HTTP driver doesn't support native transactions.
 * This utility provides:
 * - Retry logic for unique constraint violations (slug collisions)
 * - Cleanup callbacks for failed operations
 * - Consistent error handling patterns
 */

import { db } from './db';

// --- Types ---

export interface OperationResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface OperationOptions {
	maxRetries?: number;
	retryDelay?: number;
	onFailure?: () => Promise<void>;
}

// --- Error Detection ---

/**
 * Check if error is a unique constraint violation (slug collision)
 */
export function isUniqueViolation(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return (
			msg.includes('unique constraint') ||
			msg.includes('duplicate key') ||
			msg.includes('unique_violation') ||
			msg.includes('23505') // PostgreSQL unique violation code
		);
	}
	return false;
}

/**
 * Check if error is a foreign key violation
 */
export function isForeignKeyViolation(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return (
			msg.includes('foreign key') ||
			msg.includes('violates foreign key constraint') ||
			msg.includes('23503') // PostgreSQL FK violation code
		);
	}
	return false;
}

// --- Retry Logic ---

/**
 * Execute a function with retry logic for retryable errors
 *
 * @param fn - Function to execute
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: OperationOptions = {}
): Promise<T> {
	const { maxRetries = 3, retryDelay = 100 } = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Only retry on unique constraint violations
			if (!isUniqueViolation(error) || attempt === maxRetries) {
				throw error;
			}

			console.log(`[transactionUtils] Retry ${attempt}/${maxRetries} after unique violation`);

			// Small delay before retry
			if (retryDelay > 0) {
				await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
			}
		}
	}

	throw lastError;
}

// --- Safe Operation Wrapper ---

/**
 * Execute an operation with error handling and optional cleanup
 *
 * @param fn - Operation to execute
 * @param options - Options including cleanup callback
 * @returns Operation result with success/error status
 */
export async function safeOperation<T>(
	fn: () => Promise<T>,
	options: OperationOptions = {}
): Promise<OperationResult<T>> {
	const { onFailure } = options;

	try {
		const data = await fn();
		return { success: true, data };
	} catch (error) {
		console.error('[transactionUtils] Operation failed:', error);

		// Run cleanup callback if provided
		if (onFailure) {
			try {
				await onFailure();
				console.log('[transactionUtils] Cleanup completed');
			} catch (cleanupError) {
				console.error('[transactionUtils] Cleanup failed:', cleanupError);
			}
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Execute an operation with retry and cleanup
 *
 * @param fn - Operation to execute
 * @param options - Options for retry and cleanup
 * @returns Operation result
 */
export async function safeOperationWithRetry<T>(
	fn: () => Promise<T>,
	options: OperationOptions = {}
): Promise<OperationResult<T>> {
	return safeOperation(() => withRetry(fn, options), options);
}

// --- Batch Operations ---

/**
 * Execute multiple operations, rolling back on failure
 *
 * Note: Since Neon HTTP doesn't support true transactions,
 * this executes sequentially and runs cleanup callbacks on failure
 *
 * @param operations - Array of operations to execute
 * @param cleanups - Cleanup functions indexed by operation
 * @returns Combined results
 */
export async function executeBatch<T extends Record<string, unknown>>(operations: {
	[K in keyof T]: {
		execute: () => Promise<T[K]>;
		cleanup?: (result: T[K]) => Promise<void>;
	};
}): Promise<OperationResult<T>> {
	const results: Partial<T> = {};
	const completedKeys: (keyof T)[] = [];

	try {
		for (const key of Object.keys(operations) as (keyof T)[]) {
			const op = operations[key];
			results[key] = await op.execute();
			completedKeys.push(key);
		}

		return { success: true, data: results as T };
	} catch (error) {
		console.error('[transactionUtils] Batch operation failed:', error);

		// Run cleanup for completed operations in reverse order
		for (const key of completedKeys.reverse()) {
			const op = operations[key];
			if (op.cleanup && results[key] !== undefined) {
				try {
					await op.cleanup(results[key] as T[keyof T]);
					console.log(`[transactionUtils] Cleaned up: ${String(key)}`);
				} catch (cleanupError) {
					console.error(`[transactionUtils] Cleanup failed for ${String(key)}:`, cleanupError);
				}
			}
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Batch operation failed'
		};
	}
}

// --- Convenience Exports ---

export { db };
