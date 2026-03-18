import { resyncCollection } from '$lib/db/replication';

function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

export function resyncUtilityData() {
	bgResync('readings');
	bgResync('billings');
	bgResync('meters');
}
