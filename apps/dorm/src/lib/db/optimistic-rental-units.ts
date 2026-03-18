import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

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
			property_id: String(data.property_id),
			floor_id: String(data.floor_id),
			type: data.type,
			amenities: data.amenities ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
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
	console.log(`[Optimistic] rental_unit #${unitId} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: rental_unit #${unitId} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.rental_units.findOne(String(unitId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] rental_unit #${unitId} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: rental_unit #${unitId} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] RentalUnit delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: rental_unit #${unitId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('rental_units');
}
