import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, isValidCollection } from '$lib/server/replication-store';

const PK_FIELD: Record<string, string> = { stock_counts: 'stockItemId' };

function getPk(collection: string, doc: any): string {
	return doc[PK_FIELD[collection] ?? 'id'];
}

function getAllDocs(store: ReturnType<typeof getCollectionStore>): any[] {
	const { documents } = store!.pull(null, Infinity);
	return documents;
}

function findDocById(store: ReturnType<typeof getCollectionStore>, collection: string, id: string) {
	return getAllDocs(store).find((doc: any) => getPk(collection, doc) === id) ?? null;
}

// ─── Business Logic Guards ───────────────────────────────────────────────────
// These prevent multi-device race conditions where two thin clients can both
// see a table as "available" and independently create orders for it.

/**
 * Guard: Reject dine-in order insert if the table already has an open order.
 * Returns the existing order if found (idempotent), or null to proceed.
 */
function guardDuplicateTableOrder(
	data: any
): { existingOrder: any } | null {
	if (data.orderType !== 'dine-in' || !data.tableId) return null;

	const ordersStore = getCollectionStore('orders');
	if (!ordersStore) return null;

	const allOrders = getAllDocs(ordersStore);
	const existingOrder = allOrders.find(
		(o: any) =>
			o.tableId === data.tableId &&
			o.status === 'open' &&
			!o._deleted &&
			o.id !== data.id // don't match against itself
	);

	if (existingOrder) {
		console.warn(
			`[Write Guard] Blocked duplicate order for table ${data.tableId} — ` +
			`existing order: ${existingOrder.id}, attempted: ${data.id}`
		);
		return { existingOrder };
	}

	return null;
}

/**
 * Guard: Reject table patch to 'occupied' if it's already occupied.
 * Returns the current table doc (idempotent no-op) so the client isn't confused.
 */
function guardDuplicateTableOccupancy(
	collection: string,
	id: string,
	data: any,
	existing: any
): { currentDoc: any } | null {
	if (collection !== 'tables') return null;
	if (data.status !== 'occupied') return null;
	if (existing.status !== 'occupied') return null;

	// Table is already occupied — return current state, don't overwrite
	console.warn(
		`[Write Guard] Blocked duplicate table occupancy for ${id} — ` +
		`already occupied with order ${existing.currentOrderId}`
	);
	return { currentDoc: existing };
}

export const POST: RequestHandler = async ({ params, request }) => {
	const { collection } = params;

	if (!isValidCollection(collection)) {
		return json({ error: `Invalid collection: ${collection}` }, { status: 400 });
	}

	const store = getCollectionStore(collection);
	if (!store) {
		return json({ error: `Store not found: ${collection}` }, { status: 404 });
	}

	const body = await request.json();
	const { operation, id, data } = body as {
		operation: string;
		id?: string;
		data?: any;
	};

	switch (operation) {
		case 'insert': {
			if (!data) {
				return json({ error: 'Missing data for insert' }, { status: 400 });
			}
			if (!data.updatedAt) {
				data.updatedAt = new Date().toISOString();
			}

			// Guard: prevent duplicate dine-in orders for the same table
			if (collection === 'orders') {
				const guard = guardDuplicateTableOrder(data);
				if (guard) {
					return json({
						document: guard.existingOrder,
						conflicts: [],
						guarded: true,
						reason: `Table ${data.tableId} already has open order ${guard.existingOrder.id}`
					});
				}
			}

			const conflicts = store.push([
				{ newDocumentState: data, assumedMasterState: null }
			]);
			return json({ document: data, conflicts });
		}

		case 'patch': {
			if (!id) {
				return json({ error: 'Missing id for patch' }, { status: 400 });
			}
			const existing = findDocById(store, collection, id);
			if (!existing) {
				return json({ error: `Document not found: ${id}` }, { status: 404 });
			}

			// Guard: prevent patching a table to occupied when it's already occupied
			const tableGuard = guardDuplicateTableOccupancy(collection, id, data, existing);
			if (tableGuard) {
				return json({
					document: tableGuard.currentDoc,
					conflicts: [],
					guarded: true,
					reason: `Table ${id} is already occupied`
				});
			}

			const merged = {
				...existing,
				...data,
				updatedAt: new Date().toISOString()
			};
			const conflicts = store.push([
				{ newDocumentState: merged, assumedMasterState: existing }
			]);
			return json({ document: merged, conflicts });
		}

		case 'remove': {
			if (!id) {
				return json({ error: 'Missing id for remove' }, { status: 400 });
			}
			const existing = findDocById(store, collection, id);
			if (!existing) {
				return json({ error: `Document not found: ${id}` }, { status: 404 });
			}
			const deleted = {
				...existing,
				_deleted: true,
				updatedAt: new Date().toISOString()
			};
			const conflicts = store.push([
				{ newDocumentState: deleted, assumedMasterState: existing }
			]);
			return json({ document: deleted, conflicts });
		}

		default:
			return json({ error: `Unknown operation: ${operation}` }, { status: 400 });
	}
};
