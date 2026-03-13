import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { SERVER_EPOCH } from '$lib/server/epoch';
import { trackClient, isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

const ALL_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
	'stock_events', 'deductions', 'expenses', 'stock_counts', 'devices',
	'kds_tickets', 'readings', 'audit_logs',
	'floor_elements', 'shifts'
];

/**
 * Returns the doc count + checksum per collection in the server's in-memory store.
 * Clients use counts to detect whether the server has been restarted
 * and checksums for periodic data integrity verification.
 */
export const GET: RequestHandler = async ({ url, request, getClientAddress }) => {
	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', 'replication/status');
	const label = isLoopbackIP(ip) ? '💻 Server' : `📱 ${client.deviceHint}`;

	const includeChecksums = url.searchParams.get('checksums') === '1';

	const counts: Record<string, number> = {};
	const checksums: Record<string, number> = {};
	let total = 0;

	for (const name of ALL_COLLECTIONS) {
		const store = getCollectionStore(name);
		counts[name] = store ? store.count() : 0;
		total += counts[name];
		if (includeChecksums && store) {
			checksums[name] = store.checksum();
		}
	}

	log.trace('Sync', `📊 ${label} checked status — server has ${total} total docs (epoch=${SERVER_EPOCH})`);

	const response: any = { counts, total, epoch: SERVER_EPOCH };
	if (includeChecksums) response.checksums = checksums;
	return json(response);
};
