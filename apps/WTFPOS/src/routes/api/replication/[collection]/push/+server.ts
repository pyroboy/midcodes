import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, recordPush } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP, recordClientSync } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

// ─── Business Logic Guard: Duplicate Table Orders ────────────────────────────
// When a dine-in order is pushed for a table that already has an open order,
// silently drop the duplicate from the push (don't store it on the server).
// This prevents multi-device race conditions from creating duplicate orders.
// NOTE: We don't return these as RxDB conflicts because the existing order
// has a different document ID — RxDB's conflict protocol is per-document.
function filterDuplicateTableOrders(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'orders') return { allowed: changeRows, dropped: 0 };

	const ordersStore = getCollectionStore('orders');
	if (!ordersStore) return { allowed: changeRows, dropped: 0 };

	const allDocs = ordersStore.pull(null, Infinity).documents;
	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		if (
			doc &&
			doc.orderType === 'dine-in' &&
			doc.tableId &&
			doc.status === 'open' &&
			!doc._deleted &&
			// Only guard new inserts (assumedMasterState is null)
			!row.assumedMasterState
		) {
			const existing = allDocs.find(
				(o: any) =>
					o.tableId === doc.tableId &&
					o.status === 'open' &&
					!o._deleted &&
					o.id !== doc.id
			);
			if (existing) {
				log.warn('Sync', `[Guard] Dropped duplicate order for table ${doc.tableId} — existing: ${existing.id}, attempted: ${doc.id}`);
				dropped++;
				continue;
			}
		}
		allowed.push(row);
	}

	return { allowed, dropped };
}

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const store = getCollectionStore(params.collection);
	if (!store) throw error(404, `Unknown collection: ${params.collection}`);

	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', `push/${params.collection}`);
	const isServer = isLoopbackIP(ip);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	const changeRows = await request.json();
	if (!Array.isArray(changeRows)) throw error(400, 'Expected array of change rows');

	// Apply business logic guards before pushing
	const { allowed, dropped } = filterDuplicateTableOrders(changeRows, params.collection);

	const conflicts = allowed.length > 0 ? store.push(allowed) : [];

	if (!isServer) recordClientSync(ip);
	const col = params.collection;
	const accepted = changeRows.length - conflicts.length - dropped;

	// Track server store state + log milestones
	if (accepted > 0) recordPush(col, accepted);

	if (conflicts.length > 0 || dropped > 0) {
		log.warn('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (${conflicts.length} conflicts${dropped > 0 ? `, ${dropped} dropped by guard` : ''}, store=${store.count()})`);
	} else if (isServer && changeRows.length === 1 && (col === 'tables' || col === 'devices')) {
		log.trace('Sync', `⬆ ${label} pushed 1 doc → ${col} (store=${store.count()})`);
	} else {
		log.debug('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (store=${store.count()})`);
	}

	return json(conflicts);
};
