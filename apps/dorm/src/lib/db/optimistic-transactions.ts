import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for the transactions (payments) RxDB cache.
 *
 * Pattern: patch RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/**
 * Optimistically revert (soft-delete) a transaction by setting reverted_at.
 * The derived query filters on `!reverted_at`, so the transaction
 * disappears from the list immediately.
 */
export async function optimisticDeleteTransaction(paymentId: number | string) {
	const sid = String(paymentId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Transaction delete skipped — invalid id: ${paymentId}`);
		syncStatus.addLog(`Optimistic: transaction delete skipped — invalid id: ${paymentId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] transaction #${sid} → reverting in RxDB...`);
	syncStatus.addLog(`Optimistic: transaction #${sid} → reverting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				reverted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] transaction #${sid} revert complete ✓`);
		syncStatus.addLog(`Optimistic: transaction #${sid} reverted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Transaction revert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: transaction #${sid} revert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('payments');
	bgResync('billings');
}
