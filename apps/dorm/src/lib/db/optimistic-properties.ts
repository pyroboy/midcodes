import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/**
 * Optimistic write helpers for the properties RxDB cache.
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
 * Optimistically insert or update a property in RxDB.
 * Call after the server confirms success.
 */
export async function optimisticUpsertProperty(data: {
	id: number;
	name: string;
	address: string;
	type: string;
	status: string;
}) {
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.properties.findOne(sid).exec();
		await db.properties.upsert({
			id: sid,
			name: data.name,
			address: data.address,
			type: data.type,
			status: data.status,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
	} catch (err) {
		console.warn('[Optimistic] Property upsert failed, falling back to resync:', err);
	}
	bgResync('properties');
}

/**
 * Optimistically remove a property from RxDB.
 * Properties use hard delete (no deleted_at column).
 */
export async function optimisticDeleteProperty(propertyId: number) {
	try {
		const db = await getDb();
		const doc = await db.properties.findOne(String(propertyId)).exec();
		if (doc) {
			await doc.remove();
		}
	} catch (err) {
		console.warn('[Optimistic] Property delete failed, falling back to resync:', err);
	}
	bgResync('properties');
}
