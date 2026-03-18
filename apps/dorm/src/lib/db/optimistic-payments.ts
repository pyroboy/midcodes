import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

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
 * Optimistically mark a payment as reverted in RxDB.
 * Sets `reverted_at` so the UI can immediately reflect the revert,
 * then triggers a background resync for payments and billings.
 */
export async function optimisticRevertPayment(paymentId: number) {
	console.log(`[Optimistic] payment #${paymentId} → reverting in RxDB...`);
	syncStatus.addLog(`Optimistic: payment #${paymentId} → reverting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(String(paymentId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				reverted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] payment #${paymentId} revert complete ✓`);
		syncStatus.addLog(`Optimistic: payment #${paymentId} reverted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Payment revert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: payment #${paymentId} revert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('payments');
	bgResync('billings');
}
