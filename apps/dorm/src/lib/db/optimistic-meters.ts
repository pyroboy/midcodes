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
}) {
	console.log(`[Optimistic] meter #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: meter #${data.id} → writing to RxDB...`, 'info');
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.meters.findOne(sid).exec();
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
	}
	bgResync('meters');
}

/**
 * Optimistically delete a meter from RxDB.
 */
export async function optimisticDeleteMeter(meterId: number) {
	console.log(`[Optimistic] meter #${meterId} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: meter #${meterId} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.meters.findOne(String(meterId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] meter #${meterId} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: meter #${meterId} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Meter delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: meter #${meterId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('meters');
}
