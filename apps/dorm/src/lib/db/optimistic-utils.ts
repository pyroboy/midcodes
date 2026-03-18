import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Background resync — fire and forget, never blocks UI.
 * Debounced per collection (500ms) to coalesce rapid successive calls.
 * Shared across all optimistic write modules.
 */
export function bgResync(collection: string) {
	const existing = debounceTimers.get(collection);
	if (existing) clearTimeout(existing);

	debounceTimers.set(
		collection,
		setTimeout(() => {
			debounceTimers.delete(collection);

			// DD5: Don't attempt resync when offline — queue for when connectivity returns
			if (typeof navigator !== 'undefined' && !navigator.onLine) {
				syncStatus.addLog(`Offline — ${collection} resync deferred`, 'warn');
				const onOnline = () => {
					window.removeEventListener('online', onOnline);
					bgResync(collection); // Re-trigger when back online
				};
				window.addEventListener('online', onOnline);
				return;
			}

			console.log(`[Optimistic] Resync "${collection}" → pulling from Neon...`);
			syncStatus.addLog(`Resync: pulling ${collection} from Neon...`, 'info');
			resyncCollection(collection)
				.then(() => {
					console.log(`[Optimistic] Resync "${collection}" complete ✓`);
					syncStatus.addLog(`Resync: ${collection} reconciled with Neon ✓`, 'success');
				})
				.catch((err) => {
					console.warn(`[Optimistic] Resync "${collection}" failed:`, err);
					syncStatus.addLog(`Resync: ${collection} failed — ${err?.message || err}`, 'error');
				});
		}, 500)
	);
}
