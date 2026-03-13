import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, isValidCollection } from '$lib/server/replication-store';

export const GET: RequestHandler = ({ params, url }) => {
	const { collection } = params;

	if (!isValidCollection(collection)) {
		return json({ error: `Invalid collection: ${collection}` }, { status: 400 });
	}

	const store = getCollectionStore(collection);
	if (!store) {
		return json({ error: `Store not found: ${collection}` }, { status: 404 });
	}

	const { documents, checkpoint } = store.pull(null, Infinity);

	const locationId = url.searchParams.get('locationId');
	const filtered = locationId
		? documents.filter((doc: any) => doc.locationId === locationId)
		: documents;

	return json({ documents: filtered, checkpoint });
};
