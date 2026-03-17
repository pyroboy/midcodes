/**
 * Comprehensive Error Handling Utilities
 *
 * This module provides a systematic approach to error handling throughout the application,
 * including custom error classes, safe operations, and logging infrastructure.
 */

// ==================== ERROR TYPES ====================

export type ErrorType = 'validation' | 'network' | 'database' | 'permission' | 'runtime';

export class ApplicationError extends Error {
	constructor(
		message: string,
		public type: ErrorType,
		public retryable = false,
		public context?: Record<string, any>
	) {
		super(message);
		this.name = 'ApplicationError';
	}
}

export interface ErrorState {
	hasError: boolean;
	errorType: ErrorType;
	message: string;
	retryable: boolean;
	timestamp: Date;
}

// ==================== LOGGING INFRASTRUCTURE ====================

export interface LogEntry {
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	context?: Record<string, any>;
	timestamp: Date;
	component?: string;
}

export class Logger {
	private isDevelopment = process.env.NODE_ENV === 'development';

	private getCallerComponent(): string {
		const stack = new Error().stack;
		// Extract component name from stack trace
		const match = stack?.match(/at.*\/([^\/]+\.svelte)/);
		return match ? match[1] : 'unknown';
	}

	private sendToErrorService(entry: LogEntry) {
		// In production, send to external error monitoring service
		// This could be Sentry, LogRocket, or custom endpoint
		if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
			try {
				window.navigator.sendBeacon('/api/logs', JSON.stringify(entry));
			} catch (e) {
				// Fallback if beacon fails
				console.error('Failed to send log entry', e);
			}
		}
	}

	debug(message: string, context?: Record<string, any>) {
		if (this.isDevelopment) {
			console.debug(message, context);
		}
	}

	info(message: string, context?: Record<string, any>) {
		const entry: LogEntry = {
			level: 'info',
			message,
			context,
			timestamp: new Date(),
			component: this.getCallerComponent()
		};

		if (this.isDevelopment) {
			console.info(message, context);
		} else {
			this.sendToErrorService(entry);
		}
	}

	warn(message: string, context?: Record<string, any>) {
		const entry: LogEntry = {
			level: 'warn',
			message,
			context,
			timestamp: new Date(),
			component: this.getCallerComponent()
		};

		console.warn(message, context);

		if (!this.isDevelopment) {
			this.sendToErrorService(entry);
		}
	}

	error(message: string, context?: Record<string, any>) {
		const entry: LogEntry = {
			level: 'error',
			message,
			context,
			timestamp: new Date(),
			component: this.getCallerComponent()
		};

		// Always log errors to console
		console.error(message, context);

		// Send to external service in production
		if (!this.isDevelopment) {
			this.sendToErrorService(entry);
		}
	}
}

export const logger = new Logger();

// ==================== SAFE OPERATIONS ====================

/**
 * Safe array operations that handle null/undefined arrays gracefully
 */
export const safeArrayOperation = <T, R>(
	array: T[] | null | undefined,
	operation: (item: T, index: number) => R
): R[] => {
	return array?.map(operation) ?? [];
};

export const safeArrayFilter = <T>(
	array: T[] | null | undefined,
	predicate: (item: T, index: number) => boolean
): T[] => {
	return array?.filter(predicate) ?? [];
};

export const safeArrayFind = <T>(
	array: T[] | null | undefined,
	predicate: (item: T, index: number) => boolean
): T | undefined => {
	return array?.find(predicate);
};

export const safeArrayReduce = <T, R>(
	array: T[] | null | undefined,
	callback: (accumulator: R, current: T, index: number) => R,
	initialValue: R
): R => {
	return array?.reduce(callback, initialValue) ?? initialValue;
};

/**
 * Standardized async error handling wrapper
 */
export async function safeAsync<T>(
	operation: () => Promise<T>,
	fallback?: T
): Promise<{ success: boolean; data?: T; error?: string }> {
	try {
		const data = await operation();
		return { success: true, data };
	} catch (error) {
		logger.error('Async operation failed', {
			error: error instanceof Error ? error.message : error,
			operation: operation.name
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			data: fallback
		};
	}
}

/**
 * Supabase-specific error handling
 */
export async function safeSupabaseOperation<T>(
	operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
	const { data, error } = await operation();

	if (error) {
		logger.error('Supabase operation failed', {
			error: error.message,
			code: error.code
		});
		throw new ApplicationError(error.message, 'database', false, { code: error.code });
	}

	if (data === null) {
		throw new ApplicationError('No data returned from database', 'database');
	}

	return data;
}

// ==================== RETRY MECHANISMS ====================

export interface RetryOptions {
	maxAttempts: number;
	delayMs: number;
	backoffMultiplier?: number;
	retryableErrors?: ErrorType[];
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
	const { maxAttempts, delayMs, backoffMultiplier = 1.5, retryableErrors = ['network'] } = options;

	let lastError: Error;
	let currentDelay = delayMs;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			// Don't retry if it's not a retryable error type
			if (error instanceof ApplicationError && !retryableErrors.includes(error.type)) {
				throw error;
			}

			// Don't retry on last attempt
			if (attempt === maxAttempts) {
				break;
			}

			logger.warn(`Operation failed, retrying (${attempt}/${maxAttempts})`, {
				error: lastError.message,
				nextAttemptIn: currentDelay
			});

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, currentDelay));
			currentDelay *= backoffMultiplier;
		}
	}

	throw lastError!;
}

// ==================== PERFORMANCE MONITORING ====================

export class ApplicationMonitor {
	private errorCounts = new Map<string, number>();
	private performanceThresholds = {
		render: 16, // 60fps = 16ms per frame
		api: 2000, // 2 second API timeout
		memory: 50 * 1024 * 1024 // 50MB
	};

	trackError(error: ApplicationError) {
		const key = `${error.type}:${error.message}`;
		this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);

		// Alert if error frequency is high
		if (this.errorCounts.get(key)! > 5) {
			logger.error('High frequency error detected', {
				error: key,
				count: this.errorCounts.get(key)
			});
		}
	}

	trackPerformance(operation: string, duration: number) {
		const threshold =
			this.performanceThresholds[operation as keyof typeof this.performanceThresholds];
		if (threshold && duration > threshold) {
			logger.warn('Performance threshold exceeded', {
				operation,
				duration,
				threshold
			});
		}
	}

	measureAsync<T>(operation: string, asyncFn: () => Promise<T>): Promise<T> {
		const startTime = Date.now();

		return asyncFn()
			.then((result) => {
				this.trackPerformance(operation, Date.now() - startTime);
				return result;
			})
			.catch((error) => {
				this.trackPerformance(operation, Date.now() - startTime);
				throw error;
			});
	}
}

export const monitor = new ApplicationMonitor();

// ==================== GLOBAL ERROR HANDLERS ====================

export function setupGlobalErrorHandlers() {
	if (typeof window === 'undefined') return;

	// Handle unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		logger.error('Unhandled promise rejection', {
			error: event.reason,
			stack: event.reason?.stack
		});

		// Prevent console spam in production
		if (process.env.NODE_ENV === 'production') {
			event.preventDefault();
		}
	});

	// Handle global JavaScript errors
	window.addEventListener('error', (event) => {
		logger.error('Global JavaScript error', {
			message: event.message,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			stack: event.error?.stack
		});
	});
}
