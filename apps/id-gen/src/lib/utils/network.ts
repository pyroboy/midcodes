/**
 * Network status utility
 * Uses the Network Information API explicitly supported in Chromium browsers.
 * Fallbacks to "fast" for other browsers.
 */

export interface NetworkStatus {
	isSlow: boolean;
	effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

export function getNetworkStatus(): NetworkStatus {
	// Check if navigation.connection exists (Chrome/Edge/Android)
	if (
		typeof navigator !== 'undefined' &&
		'connection' in navigator &&
		navigator.connection
	) {
		const conn = navigator.connection as any;
		const effectiveType = conn.effectiveType || 'unknown';
		
		// Consider 2g, slow-2g, and 3g as "slow"
		// 4g is considered fast
		const isSlow = ['slow-2g', '2g', '3g'].includes(effectiveType);
		
		return { isSlow, effectiveType };
	}

	// Default to fast if API is unsupported (Safari, Firefox)
	return { isSlow: false, effectiveType: 'unknown' };
}
