import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/**
 * Optimistic write helpers for leases in the dorm RxDB cache.
 *
 * Leases use soft-delete (deleted_at), same pattern as tenants.
 * No optimistic create/update needed since those go through form actions
 * — just resync after success.
 */

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

/**
 * Optimistically soft-delete a lease by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the lease
 * disappears from the list immediately.
 */
export async function optimisticDeleteLease(leaseId: number) {
	try {
		const db = await getDb();
		const doc = await db.leases.findOne(String(leaseId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
	} catch (err) {
		console.warn('[Optimistic] Lease delete failed, falling back to resync:', err);
	}
	bgResync('leases');
}
