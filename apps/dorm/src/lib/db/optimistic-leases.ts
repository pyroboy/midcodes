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
 * Optimistically upsert a lease into RxDB for instant UI feedback.
 * Follows the same pattern as optimisticUpsertFloor / optimisticUpsertMeter.
 */
export async function optimisticUpsertLease(data: {
	id: number;
	rental_unit_id: number;
	name: string;
	start_date: string;
	end_date: string;
	rent_amount: number | string;
	notes?: string | null;
	terms_month?: number | null;
	status: string;
	created_by?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] lease #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: lease #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.leases.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.leases.upsert({
			id: sid,
			rental_unit_id: String(data.rental_unit_id),
			name: data.name,
			start_date: data.start_date,
			end_date: data.end_date,
			rent_amount: String(data.rent_amount || 0),
			security_deposit: existing?.security_deposit ?? String(0),
			notes: data.notes ?? null,
			terms_month: data.terms_month ?? null,
			status: data.status,
			created_by: data.created_by ?? existing?.created_by ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null,
			deleted_by: null,
			deletion_reason: null
		});
		console.log(`[Optimistic] lease #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: lease #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Lease upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: lease #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('leases');
		return null;
	}
	bgResync('leases');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.leases.upsert(capturedSnapshot);
			} else {
				const doc = await db.leases.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: lease #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Lease rollback failed:', err);
		}
	};
}

/**
 * Optimistically soft-delete a lease by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the lease
 * disappears from the list immediately.
 */
export async function optimisticDeleteLease(leaseId: number | string) {
	const sid = String(leaseId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Lease delete skipped — invalid id: ${leaseId}`);
		syncStatus.addLog(`Optimistic: lease delete skipped — invalid id: ${leaseId}`, 'warn');
		return;
	}
	try {
		console.log(`[Optimistic] Lease delete id=${sid} → soft-deleting in RxDB...`);
		syncStatus.addLog(`Optimistic: lease #${sid} → soft-deleting in RxDB...`, 'info');
		const db = await getDb();
		const doc = await db.leases.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			console.log(`[Optimistic] Lease delete id=${sid} → RxDB soft-deleted ✓`);
			syncStatus.addLog(`Optimistic: lease #${sid} → RxDB soft-deleted ✓`, 'success');
		} else {
			console.warn(`[Optimistic] Lease id=${sid} not found in RxDB`);
			syncStatus.addLog(`Optimistic: lease #${sid} not found in RxDB`, 'warn');
		}
	} catch (err) {
		console.warn('[Optimistic] Lease delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: lease delete failed — ${err instanceof Error ? err.message : err}`, 'error');
	}
	bgResync('leases');
}
