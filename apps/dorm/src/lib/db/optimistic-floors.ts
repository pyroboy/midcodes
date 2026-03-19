import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

export async function optimisticUpsertFloor(data: {
	id: number;
	property_id: number;
	floor_number: number;
	wing?: string | null;
	status: string;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] floor #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: floor #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.floors.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.floors.upsert({
			id: sid,
			property_id: String(data.property_id),
			floor_number: data.floor_number,
			wing: data.wing ?? null,
			status: data.status,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] floor #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: floor #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: floor #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('floors');
		return null;
	}
	bgResync('floors');
	// Return rollback function for instant revert on server failure
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.floors.upsert(capturedSnapshot);
			} else {
				const doc = await db.floors.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: floor #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Floor rollback failed:', err);
		}
	};
}

export async function optimisticDeleteFloor(floorId: number | string) {
	const sid = String(floorId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Floor delete skipped — invalid id: ${floorId}`);
		syncStatus.addLog(`Optimistic: floor delete skipped — invalid id: ${floorId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] floor #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: floor #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.floors.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] floor #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: floor #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: floor #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('floors');
}
