import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, recordPush } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP, recordClientSync } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const store = getCollectionStore(params.collection);
	if (!store) throw error(404, `Unknown collection: ${params.collection}`);

	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', `push/${params.collection}`);
	const isServer = isLoopbackIP(ip);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	const changeRows = await request.json();
	if (!Array.isArray(changeRows)) throw error(400, 'Expected array of change rows');

	const conflicts = store.push(changeRows);
	if (!isServer) recordClientSync(ip);
	const col = params.collection;
	const accepted = changeRows.length - conflicts.length;

	// Track server store state + log milestones
	if (accepted > 0) recordPush(col, accepted);

	if (conflicts.length > 0) {
		log.warn('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (${conflicts.length} conflicts, store=${store.count()})`);
	} else if (isServer && changeRows.length === 1 && (col === 'tables' || col === 'devices')) {
		log.trace('Sync', `⬆ ${label} pushed 1 doc → ${col} (store=${store.count()})`);
	} else {
		log.debug('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (store=${store.count()})`);
	}

	return json(conflicts);
};
