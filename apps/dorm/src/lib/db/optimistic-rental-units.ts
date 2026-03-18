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

export async function optimisticUpsertRentalUnit(data: {
	id: number;
	name: string;
	number: number;
	capacity: number;
	rental_unit_status: string;
	base_rate: string;
	property_id: number;
	floor_id: number;
	type: string;
	amenities?: any;
}) {
	console.log(`[Optimistic] rental_unit #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: rental_unit #${data.id} → writing to RxDB...`, 'info');
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.rental_units.findOne(sid).exec();
		await db.rental_units.upsert({
			id: sid,
			name: data.name,
			number: data.number,
			capacity: data.capacity,
			rental_unit_status: data.rental_unit_status,
			base_rate: String(data.base_rate),
			property_id: data.property_id,
			floor_id: data.floor_id,
			type: data.type,
			amenities: data.amenities ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
		console.log(`[Optimistic] rental_unit #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: rental_unit #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] RentalUnit upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: rental_unit #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('rental_units');
}

export async function optimisticDeleteRentalUnit(unitId: number) {
	console.log(`[Optimistic] rental_unit #${unitId} → deleting from RxDB...`);
	syncStatus.addLog(`Optimistic: rental_unit #${unitId} → deleting from RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.rental_units.findOne(String(unitId)).exec();
		if (doc) await doc.remove();
		console.log(`[Optimistic] rental_unit #${unitId} delete complete ✓`);
		syncStatus.addLog(`Optimistic: rental_unit #${unitId} deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] RentalUnit delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: rental_unit #${unitId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('rental_units');
}
