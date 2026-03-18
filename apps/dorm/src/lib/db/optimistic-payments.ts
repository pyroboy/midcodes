import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/** Background resync -- fire and forget, never blocks UI. */
function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

/**
 * Optimistically mark a payment as reverted in RxDB.
 * Sets `reverted_at` so the UI can immediately reflect the revert,
 * then triggers a background resync for payments and billings.
 */
export async function optimisticRevertPayment(paymentId: number) {
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
		console.warn('[Optimistic] Payment revert failed, falling back to resync:', err);
	}
	bgResync('payments');
	bgResync('billings');
}
