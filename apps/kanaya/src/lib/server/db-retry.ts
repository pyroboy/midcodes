/**
 * Database Retry and Timeout Utilities
 * 
 * Provides retry logic with exponential backoff and timeout handling
 * for database operations to prevent 503 errors in production.
 */

export interface RetryOptions {
	maxAttempts: number;
	initialDelayMs: number;
	maxDelayMs: number;
	backoffMultiplier: number;
	retryableErrors?: string[];
}

export interface TimeoutOptions {
	timeoutMs: number;
	onTimeout?: () => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
	maxAttempts: 3,
	initialDelayMs: 100,
	maxDelayMs: 5000,
	backoffMultiplier: 2,
	retryableErrors: [
		'connection',
		'timeout',
		'network',
		'ECONNREFUSED',
		'ECONNRESET',
		'ETIMEDOUT',
		'503',
		'502',
		'504'
	]
};

/**
 * Wrap a promise with timeout handling
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	options: TimeoutOptions
): Promise<T> {
	const { timeoutMs, onTimeout } = options;

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			if (onTimeout) {
				onTimeout();
			}
			reject(new Error(`Operation timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([promise, timeoutPromise]);
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		return result;
	} catch (error) {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		throw error;
	}
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: Partial<RetryOptions> = {}
): Promise<T> {
	const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
	let lastError: Error;
	let delay = opts.initialDelayMs;

	for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Check if error is retryable
			const isRetryable = isRetryableError(lastError, opts.retryableErrors);

			if (!isRetryable || attempt === opts.maxAttempts) {
				// Don't retry non-retryable errors or on last attempt
				break;
			}

			console.warn(
				`[DB Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms`,
				{
					error: lastError.message,
					nextAttemptIn: delay
				}
			);

			// Wait before retrying with exponential backoff
			await new Promise((resolve) => setTimeout(resolve, delay));
			delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
		}
	}

	throw lastError!;
}

/**
 * Combine retry and timeout for database operations
 */
export async function withRetryAndTimeout<T>(
	operation: () => Promise<T>,
	retryOptions: Partial<RetryOptions> = {},
	timeoutOptions: Partial<TimeoutOptions> = {}
): Promise<T> {
	const opts = {
		timeoutMs: 5000, // 5 second default timeout
		...timeoutOptions
	};

	return withRetry(
		() => withTimeout(operation(), opts),
		retryOptions
	);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, retryableErrors?: string[]): boolean {
	const message = error.message.toLowerCase();

	// Check against custom retryable errors
	if (retryableErrors) {
		for (const retryable of retryableErrors) {
			if (message.includes(retryable.toLowerCase())) {
				return true;
			}
		}
	}

	// Default retryable error patterns
	const defaultRetryablePatterns = [
		'connection',
		'timeout',
		'network',
		'econnrefused',
		'econnreset',
		'etimedout',
		'503',
		'502',
		'504'
	];

	for (const pattern of defaultRetryablePatterns) {
		if (message.includes(pattern)) {
			return true;
		}
	}

	return false;
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
	isOpen: boolean;
	failureCount: number;
	lastFailureTime: number;
	nextAttemptTime: number;
}

class CircuitBreaker {
	private state: CircuitBreakerState = {
		isOpen: false,
		failureCount: 0,
		lastFailureTime: 0,
		nextAttemptTime: 0
	};

	constructor(
		private failureThreshold: number = 5,
		private resetTimeoutMs: number = 60000 // 1 minute
	) {}

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		// Check if circuit is open
		if (this.state.isOpen) {
			if (Date.now() < this.state.nextAttemptTime) {
				throw new Error('Circuit breaker is open - too many failures');
			}
			// Try to reset
			this.state.isOpen = false;
			this.state.failureCount = 0;
		}

		try {
			const result = await operation();
			// Success - reset failure count
			this.state.failureCount = 0;
			return result;
		} catch (error) {
			this.state.failureCount++;
			this.state.lastFailureTime = Date.now();

			// Open circuit if threshold reached
			if (this.state.failureCount >= this.failureThreshold) {
				this.state.isOpen = true;
				this.state.nextAttemptTime = Date.now() + this.resetTimeoutMs;
				console.error(
					`[Circuit Breaker] Opened after ${this.state.failureCount} failures`,
					{
						resetAt: new Date(this.state.nextAttemptTime).toISOString()
					}
				);
			}

			throw error;
		}
	}

	getState(): CircuitBreakerState {
		return { ...this.state };
	}

	reset(): void {
		this.state = {
			isOpen: false,
			failureCount: 0,
			lastFailureTime: 0,
			nextAttemptTime: 0
		};
	}
}

// Export singleton circuit breaker instance
export const dbCircuitBreaker = new CircuitBreaker(5, 60000);
