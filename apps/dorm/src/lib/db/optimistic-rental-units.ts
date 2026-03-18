import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
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
	} catch (err) {
		console.warn('[Optimistic] RentalUnit upsert failed, falling back to resync:', err);
	}
	bgResync('rental_units');
}

export async function optimisticDeleteRentalUnit(unitId: number) {
	try {
		const db = await getDb();
		const doc = await db.rental_units.findOne(String(unitId)).exec();
		if (doc) await doc.remove();
	} catch (err) {
		console.warn('[Optimistic] RentalUnit delete failed, falling back to resync:', err);
	}
	bgResync('rental_units');
}
