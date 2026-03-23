import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for meters in the dorm RxDB cache.
 *
 * Pattern: upsert into RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/**
 * Optimistically insert or update a meter in RxDB.
 * Call after the server confirms success.
 */
export async function optimisticUpsertMeter(data: {
	id: number;
	name: string;
	location_type: string;
	property_id?: number | null;
	floor_id?: number | null;
	rental_unit_id?: number | null;
	type: string;
	is_active?: boolean | null;
	status: string;
	notes?: string | null;
	initial_reading?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] meter #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: meter #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.meters.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.meters.upsert({
			id: sid,
			name: data.name,
			location_type: data.location_type,
			property_id: data.property_id != null ? String(data.property_id) : null,
			floor_id: data.floor_id != null ? String(data.floor_id) : null,
			rental_unit_id: data.rental_unit_id != null ? String(data.rental_unit_id) : null,
			type: data.type,
			is_active: data.is_active ?? null,
			status: data.status,
			notes: data.notes ?? null,
			initial_reading: data.initial_reading ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] meter #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: meter #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Meter upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: meter #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('meters');
		return null;
	}
	bgResync('meters');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.meters.upsert(capturedSnapshot);
			} else {
				const doc = await db.meters.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: meter #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Meter rollback failed:', err);
		}
	};
}

/**
 * Optimistically delete a meter from RxDB.
 */
export async function optimisticDeleteMeter(meterId: number | string) {
	const sid = String(meterId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Meter delete skipped — invalid id: ${meterId}`);
		syncStatus.addLog(`Optimistic: meter delete skipped — invalid id: ${meterId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] meter #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: meter #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.meters.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] meter #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: meter #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Meter delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: meter #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('meters');
}
