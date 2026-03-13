/**
 * Circuit Breaker — prevents cascading failures by fail-fasting
 * when a downstream service is unresponsive.
 *
 * States: closed (normal) → open (fail-fast) → half-open (probe) → closed
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
	failureThreshold?: number;
	resetTimeoutMs?: number;
}

export class CircuitBreaker {
	private state: CircuitState = 'closed';
	private failures = 0;
	private lastFailureTime = 0;
	private readonly failureThreshold: number;
	private readonly resetTimeoutMs: number;

	constructor(opts: CircuitBreakerOptions = {}) {
		this.failureThreshold = opts.failureThreshold ?? 3;
		this.resetTimeoutMs = opts.resetTimeoutMs ?? 30_000;
	}

	getState(): CircuitState {
		if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
			this.state = 'half-open';
		}
		return this.state;
	}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		const current = this.getState();
		if (current === 'open') {
			throw new Error('Circuit breaker is open');
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (err) {
			this.onFailure();
			throw err;
		}
	}

	private onSuccess() {
		this.failures = 0;
		this.state = 'closed';
	}

	private onFailure() {
		this.failures++;
		this.lastFailureTime = Date.now();
		if (this.failures >= this.failureThreshold) {
			this.state = 'open';
		}
	}

	reset() {
		this.failures = 0;
		this.state = 'closed';
		this.lastFailureTime = 0;
	}
}
