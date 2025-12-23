/**
 * Retry utility for async operations with exponential backoff.
 */

export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	maxAttempts?: number;
	/** Initial delay in milliseconds (default: 1000) */
	initialDelayMs?: number;
	/** Multiplier for exponential backoff (default: 2) */
	backoffMultiplier?: number;
	/** Maximum delay between retries (default: 10000) */
	maxDelayMs?: number;
	/** Function to determine if error is retryable (default: all errors) */
	isRetryable?: (error: unknown) => boolean;
	/** Optional callback on each retry */
	onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxAttempts: 3,
	initialDelayMs: 1000,
	backoffMultiplier: 2,
	maxDelayMs: 10000,
	isRetryable: () => true,
	onRetry: () => {}
};

/**
 * Execute an async function with retry logic and exponential backoff.
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let lastError: unknown;
	let delay = opts.initialDelayMs;

	for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Check if we should retry
			if (attempt >= opts.maxAttempts || !opts.isRetryable(error)) {
				throw error;
			}

			// Calculate next delay
			const nextDelay = Math.min(delay, opts.maxDelayMs);
			opts.onRetry(attempt, error, nextDelay);

			// Wait before retry
			await sleep(nextDelay);
			delay *= opts.backoffMultiplier;
		}
	}

	throw lastError;
}

/**
 * Fetch with timeout wrapper.
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Fetch response
 */
export async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeoutMs: number = 30000
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal
		});
		return response;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error(`Request timed out after ${timeoutMs}ms`);
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Retry-enabled fetch with timeout.
 */
export async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	retryOptions: RetryOptions & { timeoutMs?: number } = {}
): Promise<Response> {
	const { timeoutMs = 30000, ...retry } = retryOptions;

	return withRetry(() => fetchWithTimeout(url, options, timeoutMs), {
		...retry,
		isRetryable: (error) => {
			// Retry on network errors and timeouts, not on 4xx responses
			if (error instanceof TypeError) return true; // Network error
			if (error instanceof Error && error.message.includes('timed out')) return true;
			return retry.isRetryable?.(error) ?? true;
		}
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
