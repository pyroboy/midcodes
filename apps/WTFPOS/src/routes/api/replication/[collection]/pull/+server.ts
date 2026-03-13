import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP, recordClientSync } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

export const GET: RequestHandler = async ({ params, url, request, getClientAddress }) => {
	const store = getCollectionStore(params.collection);
	if (!store) throw error(404, `Unknown collection: ${params.collection}`);

	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', `pull/${params.collection}`);
	const isServer = isLoopbackIP(ip);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	const updatedAt = url.searchParams.get('updatedAt') ?? '';
	const id = url.searchParams.get('id') ?? '';
	const batchSize = Math.min(parseInt(url.searchParams.get('limit') ?? '500', 10), 1000);

	const checkpoint = updatedAt ? { id, updatedAt } : null;
	const result = store.pull(checkpoint, batchSize);
	if (!isServer) recordClientSync(ip);

	const docCount = result.documents.length;
	const col = params.collection;

	if (docCount > 0 && !isServer) {
		// iPad/LAN client receiving data — important to see at info level
		log.info('Sync', `⬇ ${label} pulled ${docCount} docs ← ${col} (store=${store.count()})`);
	} else if (docCount > 0) {
		// Server self-pull — debug noise
		const level = col === 'devices' ? 'trace' : 'debug';
		log[level]('Sync', `⬇ ${label} pulled ${docCount} docs ← ${col} (store=${store.count()})`);
	} else {
		log.trace('Sync', `⬇ ${label} pulled 0 docs ← ${col} (up to date, store=${store.count()})`);
	}

	return json(result);
};
