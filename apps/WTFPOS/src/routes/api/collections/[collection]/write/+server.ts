import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, isValidCollection } from '$lib/server/replication-store';

const PK_FIELD: Record<string, string> = { stock_counts: 'stockItemId' };

function getPk(collection: string, doc: any): string {
	return doc[PK_FIELD[collection] ?? 'id'];
}

function findDocById(store: ReturnType<typeof getCollectionStore>, collection: string, id: string) {
	const { documents } = store!.pull(null, Infinity);
	return documents.find((doc: any) => getPk(collection, doc) === id) ?? null;
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
