import { getDb } from '$lib/db';
import { syncStatus } from '$lib/stores/sync-status.svelte';

export async function optimisticUpsertFloorLayoutItem(data: {
	id: number;
	floor_id: number;
	rental_unit_id?: number | null;
	item_type: string;
	grid_x: number;
	grid_y: number;
	grid_w: number;
	grid_h: number;
	label?: string | null;
	color?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] floor_layout_item #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: floor_layout_item #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.floor_layout_items.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.floor_layout_items.upsert({
			id: sid,
			floor_id: String(data.floor_id),
			rental_unit_id: data.rental_unit_id != null ? String(data.rental_unit_id) : null,
			item_type: data.item_type,
			grid_x: data.grid_x,
			grid_y: data.grid_y,
			grid_w: data.grid_w,
			grid_h: data.grid_h,
			label: data.label ?? null,
			color: data.color ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] floor_layout_item #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: floor_layout_item #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor layout item upsert failed:', err);
		syncStatus.addLog(`Optimistic: floor_layout_item #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		return null;
	}
	// Note: bgResync is NOT called here — bufferedMutation handles resync on server confirm/fail
	// Return rollback function for instant revert on server failure
	const capturedSnapshot = snapshot;
	const capturedSid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.floor_layout_items.upsert(capturedSnapshot);
			} else {
				const doc = await db.floor_layout_items.findOne(capturedSid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: floor_layout_item #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Floor layout item rollback failed:', err);
		}
	};
}

export async function optimisticDeleteFloorLayoutItem(itemId: number) {
	console.log(`[Optimistic] floor_layout_item #${itemId} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: floor_layout_item #${itemId} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.floor_layout_items.findOne(String(itemId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] floor_layout_item #${itemId} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: floor_layout_item #${itemId} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Floor layout item delete failed:', err);
		syncStatus.addLog(`Optimistic: floor_layout_item #${itemId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	// Note: bgResync is NOT called here — bufferedMutation handles resync on server confirm/fail
}
