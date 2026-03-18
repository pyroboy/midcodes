import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for the transactions (payments) RxDB cache.
 *
 * Pattern: patch RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
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
}

/**
 * Optimistically revert (soft-delete) a transaction by setting reverted_at.
 * The derived query filters on `!reverted_at`, so the transaction
 * disappears from the list immediately.
 */
export async function optimisticDeleteTransaction(paymentId: number) {
	console.log(`[Optimistic] transaction #${paymentId} → reverting in RxDB...`);
	syncStatus.addLog(`Optimistic: transaction #${paymentId} → reverting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(String(paymentId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				reverted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] transaction #${paymentId} revert complete ✓`);
		syncStatus.addLog(`Optimistic: transaction #${paymentId} reverted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Transaction revert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: transaction #${paymentId} revert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('payments');
	bgResync('billings');
}
