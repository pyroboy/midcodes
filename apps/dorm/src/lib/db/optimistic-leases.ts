import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for leases in the dorm RxDB cache.
 *
 * Leases use soft-delete (deleted_at), same pattern as tenants.
 * No optimistic create/update needed since those go through form actions
 * — just resync after success.
 */

/** Background resync — fire and forget, never blocks UI. Logs to sync modal. */
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
