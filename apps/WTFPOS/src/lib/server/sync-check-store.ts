/**
 * In-memory store for client sync check reports.
 * Clients POST their local RxDB collection counts + read/write test results,
 * and the server test-db page reads all reports.
 *
 * Ephemeral — lost on server restart, max 20 reports kept.
 */

export interface CollectionTestResult {
	localCount: number;        // -1 = collection not available
	readOk: boolean;           // could read (pull) from server
	readMs: number | null;
	writeOk: boolean;          // could write (push) to server and read back
	writeMs: number | null;
	error: string | null;
}

export interface SyncCheckReport {
	id: string;
	clientIp: string;
	deviceHint: string;
	isServer: boolean;
	/** Per-collection test results */
	collections: Record<string, CollectionTestResult>;
	/** Timestamp when the client ran the check */
	checkedAt: string;
}

type SyncCheckListener = (report: SyncCheckReport) => void;

const MAX_REPORTS = 20;
const reports: SyncCheckReport[] = [];
const listeners = new Set<SyncCheckListener>();

/** Add or update a report from a client (keyed by clientIp). */
export function addSyncCheckReport(report: SyncCheckReport) {
	// Replace existing report from same IP
	const idx = reports.findIndex(r => r.clientIp === report.clientIp);
	if (idx >= 0) {
		reports[idx] = report;
	} else {
		reports.push(report);
		if (reports.length > MAX_REPORTS) reports.shift();
	}
	for (const fn of listeners) {
		try { fn(report); } catch { /* noop */ }
	}
}

/** Get all current reports. */
export function getSyncCheckReports(): SyncCheckReport[] {
	return [...reports];
}

/** Subscribe to new reports. Returns unsubscribe function. */
export function subscribeSyncCheck(fn: SyncCheckListener): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
