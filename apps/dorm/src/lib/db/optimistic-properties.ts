import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for the properties RxDB cache.
 *
 * Pattern: upsert into RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

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
	console.log(`[Optimistic] property #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: property #${data.id} → writing to RxDB...`, 'info');
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
		console.log(`[Optimistic] property #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: property #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Property upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: property #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('properties');
}

/**
 * Optimistically remove a property from RxDB.
 * Properties use hard delete (no deleted_at column).
 */
export async function optimisticDeleteProperty(propertyId: number) {
	console.log(`[Optimistic] property #${propertyId} → deleting from RxDB...`);
	syncStatus.addLog(`Optimistic: property #${propertyId} → deleting from RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.properties.findOne(String(propertyId)).exec();
		if (doc) {
			await doc.remove();
		}
		console.log(`[Optimistic] property #${propertyId} delete complete ✓`);
		syncStatus.addLog(`Optimistic: property #${propertyId} deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Property delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: property #${propertyId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('properties');
}
