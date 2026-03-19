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

// B3: Storage usage trend tracking
type StorageReading = { timestamp: number; usedMB: number };
const STORAGE_HISTORY_KEY = '__dorm_storage_history';
const MAX_READINGS = 10;

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

/** B3: Append a storage reading to localStorage history (max 10). */
function recordStorageReading(usedMB: number): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
		const history: StorageReading[] = raw ? JSON.parse(raw) : [];
		history.push({ timestamp: Date.now(), usedMB });
		// Keep only the last MAX_READINGS entries
		const trimmed = history.slice(-MAX_READINGS);
		localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(trimmed));
	} catch { /* quota exceeded — non-critical */ }
}

/**
 * B3: Get the storage usage trend direction based on recent readings.
 * Compares average of first 3 vs last 3 readings.
 * Returns null if fewer than 3 readings are available.
 */
export function getStorageTrend(): 'growing' | 'stable' | 'shrinking' | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
		if (!raw) return null;
		const history: StorageReading[] = JSON.parse(raw);
		if (history.length < 3) return null;

		const first3 = history.slice(0, 3);
		const last3 = history.slice(-3);
		const avgFirst = first3.reduce((s, r) => s + r.usedMB, 0) / first3.length;
		const avgLast = last3.reduce((s, r) => s + r.usedMB, 0) / last3.length;

		if (avgFirst === 0) return avgLast > 0 ? 'growing' : 'stable';
		const changePercent = ((avgLast - avgFirst) / avgFirst) * 100;
		if (changePercent > 5) return 'growing';
		if (changePercent < -5) return 'shrinking';
		return 'stable';
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

	// B3: Record storage reading for trend tracking
	if (status) {
		recordStorageReading(status.usedMB);
	}
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
