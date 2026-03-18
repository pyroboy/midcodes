import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

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

export async function optimisticUpsertFloor(data: {
	id: number;
	property_id: number;
	floor_number: number;
	wing?: string | null;
	status: string;
}) {
	console.log(`[Optimistic] floor #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: floor #${data.id} → writing to RxDB...`, 'info');
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.floors.findOne(sid).exec();
		await db.floors.upsert({
			id: sid,
			property_id: data.property_id,
			floor_number: data.floor_number,
			wing: data.wing ?? null,
			status: data.status,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
		console.log(`[Optimistic] floor #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: floor #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: floor #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('floors');
}

export async function optimisticDeleteFloor(floorId: number) {
	console.log(`[Optimistic] floor #${floorId} → deleting from RxDB...`);
	syncStatus.addLog(`Optimistic: floor #${floorId} → deleting from RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.floors.findOne(String(floorId)).exec();
		if (doc) await doc.remove();
		console.log(`[Optimistic] floor #${floorId} delete complete ✓`);
		syncStatus.addLog(`Optimistic: floor #${floorId} deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: floor #${floorId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('floors');
}
