import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/**
 * Optimistic write helpers for meters in the dorm RxDB cache.
 *
 * Pattern: upsert into RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

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
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.meters.findOne(sid).exec();
		await db.meters.upsert({
			id: sid,
			name: data.name,
			location_type: data.location_type,
			property_id: data.property_id ?? null,
			floor_id: data.floor_id ?? null,
			rental_unit_id: data.rental_unit_id ?? null,
			type: data.type,
			is_active: data.is_active ?? null,
			status: data.status,
			notes: data.notes ?? null,
			initial_reading: data.initial_reading ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
	} catch (err) {
		console.warn('[Optimistic] Meter upsert failed, falling back to resync:', err);
	}
	bgResync('meters');
}

/**
 * Optimistically delete a meter from RxDB.
 */
export async function optimisticDeleteMeter(meterId: number) {
	try {
		const db = await getDb();
		const doc = await db.meters.findOne(String(meterId)).exec();
		if (doc) await doc.remove();
	} catch (err) {
		console.warn('[Optimistic] Meter delete failed, falling back to resync:', err);
	}
	bgResync('meters');
}
