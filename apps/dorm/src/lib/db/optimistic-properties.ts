import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for the properties RxDB cache.
 *
 * Pattern: upsert into RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

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
			updated_at: new Date().toISOString(),
			deleted_at: null
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
 * Optimistically soft-delete a property by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the property
 * disappears from the list immediately.
 */
export async function optimisticDeleteProperty(propertyId: number) {
	console.log(`[Optimistic] property #${propertyId} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: property #${propertyId} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.properties.findOne(String(propertyId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] property #${propertyId} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: property #${propertyId} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Property delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: property #${propertyId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('properties');
}
