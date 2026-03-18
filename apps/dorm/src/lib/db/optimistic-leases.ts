import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for leases in the dorm RxDB cache.
 *
 * Leases use soft-delete (deleted_at), same pattern as tenants.
 * No optimistic create/update needed since those go through form actions
 * — just resync after success.
 */

/**
 * Optimistically soft-delete a lease by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the lease
 * disappears from the list immediately.
 */
export async function optimisticDeleteLease(leaseId: number) {
	try {
		console.log(`[Optimistic] Lease delete id=${leaseId} → soft-deleting in RxDB...`);
		syncStatus.addLog(`Optimistic: lease #${leaseId} → soft-deleting in RxDB...`, 'info');
		const db = await getDb();
		const doc = await db.leases.findOne(String(leaseId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			console.log(`[Optimistic] Lease delete id=${leaseId} → RxDB soft-deleted ✓`);
			syncStatus.addLog(`Optimistic: lease #${leaseId} → RxDB soft-deleted ✓`, 'success');
		} else {
			console.warn(`[Optimistic] Lease id=${leaseId} not found in RxDB`);
			syncStatus.addLog(`Optimistic: lease #${leaseId} not found in RxDB`, 'warn');
		}
	} catch (err) {
		console.warn('[Optimistic] Lease delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: lease delete failed — ${err instanceof Error ? err.message : err}`, 'error');
	}
	bgResync('leases');
}
