/**
 * Central mutation queue for offline-first buffered writes.
 * Tracks every pending mutation with status, processes FIFO,
 * and auto-retries when reconnecting after offline.
 */
import { nanoid } from 'nanoid';

export type MutationType = 'create' | 'update' | 'delete';
export type MutationStatus = 'queued' | 'syncing' | 'confirmed' | 'failed';

export type PendingMutation = {
	id: string;
	label: string;
	collection: string;
	type: MutationType;
	status: MutationStatus;
	createdAt: number;
	error?: string;
	serverAction: () => Promise<any>;
	onSuccess?: (result: any) => Promise<void>;
	onFailure?: (error: any) => Promise<void>;
};

/** How long confirmed items stay visible before auto-removal (ms) */
const CONFIRMED_VISIBLE_MS = 15_000;

function createMutationQueue() {
	let items = $state<PendingMutation[]>([]);
	let processing = $state(false);
	let paused = $state(false);

	/** Number of queued + syncing items */
	function pendingCount() {
		return items.filter((m) => m.status === 'queued' || m.status === 'syncing').length;
	}

	/** Add a mutation to the queue and start processing */
	function enqueue(mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'status'>) {
		const entry: PendingMutation = {
			...mutation,
			id: nanoid(8),
			createdAt: Date.now(),
			status: 'queued'
		};
		items = [...items, entry];
		processQueue();
		return entry.id;
	}

	/** Process queued items FIFO, one at a time */
	async function processQueue() {
		if (processing) return;
		// Don't process when offline — the online listener will resume
		if (typeof navigator !== 'undefined' && !navigator.onLine) return;
		// Don't process when paused — resume() will restart
		if (paused) return;

		const next = items.find((m) => m.status === 'queued');
		if (!next) return;

		processing = true;
		// Mark syncing
		items = items.map((m) => (m.id === next.id ? { ...m, status: 'syncing' as const } : m));

		try {
			const result = await next.serverAction();
			// Mark confirmed
			items = items.map((m) => (m.id === next.id ? { ...m, status: 'confirmed' as const } : m));
			if (next.onSuccess) {
				try { await next.onSuccess(result); } catch { /* non-critical */ }
			}
			// Auto-remove confirmed items after delay
			setTimeout(() => {
				items = items.filter((m) => m.id !== next.id);
			}, CONFIRMED_VISIBLE_MS);
		} catch (err: any) {
			// Mark failed
			items = items.map((m) =>
				m.id === next.id
					? { ...m, status: 'failed' as const, error: err?.message || String(err) }
					: m
			);
			if (next.onFailure) {
				try { await next.onFailure(err); } catch { /* non-critical */ }
			}
		} finally {
			processing = false;
			// Process next in queue
			processQueue();
		}
	}

	/** Retry a failed mutation */
	function retry(id: string) {
		items = items.map((m) =>
			m.id === id && m.status === 'failed'
				? { ...m, status: 'queued' as const, error: undefined }
				: m
		);
		processQueue();
	}

	/** Dismiss a confirmed or failed mutation from the list */
	function dismiss(id: string) {
		items = items.filter((m) => m.id !== id);
	}

	/** Clear all confirmed items */
	function clearConfirmed() {
		items = items.filter((m) => m.status !== 'confirmed');
	}

	/** Pause queue processing — queued items stay queued, no new server calls */
	function pause() {
		paused = true;
	}

	/** Resume queue processing — immediately processes any queued items */
	function resume() {
		paused = false;
		processQueue();
	}

	// Auto-retry when coming back online
	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => {
			processQueue();
		});
	}

	return {
		get items() { return items; },
		get pending() { return pendingCount(); },
		get processing() { return processing; },
		get paused() { return paused; },
		enqueue,
		retry,
		dismiss,
		clearConfirmed,
		pause,
		resume
	};
}

export const mutationQueue = createMutationQueue();
