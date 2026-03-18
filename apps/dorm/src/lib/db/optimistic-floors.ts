import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

export async function optimisticUpsertFloor(data: {
	id: number;
	property_id: number;
	floor_number: number;
	wing?: string | null;
	status: string;
}) {
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
	} catch (err) {
		console.warn('[Optimistic] Floor upsert failed, falling back to resync:', err);
	}
	bgResync('floors');
}

export async function optimisticDeleteFloor(floorId: number) {
	try {
		const db = await getDb();
		const doc = await db.floors.findOne(String(floorId)).exec();
		if (doc) await doc.remove();
	} catch (err) {
		console.warn('[Optimistic] Floor delete failed, falling back to resync:', err);
	}
	bgResync('floors');
}
