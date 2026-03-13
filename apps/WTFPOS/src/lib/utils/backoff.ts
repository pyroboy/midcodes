/**
 * Exponential backoff with full jitter.
 * Per AWS architecture blog: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * Returns a randomized delay in ms that grows exponentially with attempt count,
 * capped at maxMs. Full jitter prevents thundering herd when multiple devices
 * reconnect simultaneously after a server restart.
 */
export function calculateBackoff(
	attempt: number,
	baseMs = 1_000,
	maxMs = 30_000
): number {
	const exponential = Math.min(baseMs * Math.pow(2, attempt), maxMs);
	return Math.random() * exponential;
}
