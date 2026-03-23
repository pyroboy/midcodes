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
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] property #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: property #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.properties.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
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
		bgResync('properties');
		return null;
	}
	bgResync('properties');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.properties.upsert(capturedSnapshot);
			} else {
				const doc = await db.properties.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: property #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Property rollback failed:', err);
		}
	};
}

/**
 * Optimistically soft-delete a property by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the property
 * disappears from the list immediately.
 */
export async function optimisticDeleteProperty(propertyId: number | string) {
	const sid = String(propertyId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Invalid property ID: ${propertyId}, skipping delete`);
		syncStatus.addLog(`Optimistic: property delete skipped — invalid ID`, 'warn');
		return;
	}
	console.log(`[Optimistic] property #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: property #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.properties.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] property #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: property #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Property delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: property #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('properties');
}
