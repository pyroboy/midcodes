import { browser } from '$app/environment';
import { pruneOldRecords } from './pruning';

export type StorageStatus = {
	usedMB: number;
	quotaMB: number;
	percentUsed: number;
	warning: boolean;
	critical: boolean;
};

const WARNING_THRESHOLD = 80; // % — show warning
const CRITICAL_THRESHOLD = 95; // % — show critical alert

/**
 * Check IndexedDB storage usage via the Storage API.
 * Returns null if the API is not available (e.g., SSR, Firefox private browsing).
 */
export async function checkStorageUsage(): Promise<StorageStatus | null> {
	if (!browser || !navigator.storage?.estimate) return null;

	try {
		const { usage, quota } = await navigator.storage.estimate();
		if (!usage || !quota) return null;

		const usedMB = Math.round((usage / (1024 * 1024)) * 10) / 10;
		const quotaMB = Math.round((quota / (1024 * 1024)) * 10) / 10;
		const percentUsed = Math.round((usage / quota) * 100);

		return {
			usedMB,
			quotaMB,
			percentUsed,
			warning: percentUsed >= WARNING_THRESHOLD,
			critical: percentUsed >= CRITICAL_THRESHOLD
		};
	} catch {
		return null;
	}
}

/**
 * Check storage usage and emit sonner toasts + sync-status log entries when
 * thresholds are exceeded.  Call this after sync completes instead of the
 * raw checkStorageUsage() so notification logic lives in one place.
 */
export async function checkAndAutoPrune(): Promise<void> {
	const status = await checkStorageUsage();
	if (!status?.warning) return;

	const { syncStatus } = await import('$lib/stores/sync-status.svelte');
	const level = status.critical ? 'error' : 'warn';
	syncStatus.addLog(
		`Storage: ${status.usedMB}MB / ${status.quotaMB}MB (${status.percentUsed}%)`,
		level
	);

	if (status.critical) {
		// W6: auto-prune when storage is at a critical level before alerting.
		try {
			await pruneOldRecords();
		} catch (err) {
			console.warn('[StorageMonitor] Auto-prune failed:', err);
		}

		const { toast } = await import('svelte-sonner');
		toast.error('Storage almost full', {
			description: `${status.percentUsed}% used (${status.usedMB}MB / ${status.quotaMB}MB). Clear browser data if issues occur.`
		});
	}
}
