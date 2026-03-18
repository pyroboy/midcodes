import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/**
 * Optimistic write helpers for the transactions (payments) RxDB cache.
 *
 * Pattern: patch RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

/**
 * Optimistically revert (soft-delete) a transaction by setting reverted_at.
 * The derived query filters on `!reverted_at`, so the transaction
 * disappears from the list immediately.
 */
export async function optimisticDeleteTransaction(paymentId: number) {
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(String(paymentId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				reverted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
	} catch (err) {
		console.warn('[Optimistic] Transaction revert failed, falling back to resync:', err);
	}
	bgResync('payments');
	bgResync('billings');
}
