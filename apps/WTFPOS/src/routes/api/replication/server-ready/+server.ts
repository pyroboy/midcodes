import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { emitBroadcast, getServerStoreSummary } from '$lib/server/replication-store';
import { isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/**
 * POST /api/replication/server-ready
 * Called by the server browser after it finishes re-pushing all local data
 * to the in-memory replication store (e.g. after a database reset + reseed).
 * Broadcasts SERVER_READY to all connected clients so they can start syncing.
 */
export const POST: RequestHandler = async ({ getClientAddress }) => {
	const ip = getClientAddress();

	// Only the server device can declare readiness
	if (!isLoopbackIP(ip)) {
		log.warn('ServerReady', `Rejected SERVER_READY from non-loopback IP: ${ip}`);
		return json({ error: 'Only the server can broadcast readiness' }, { status: 403 });
	}

	const { total, collections } = getServerStoreSummary();
	const colSummary = Object.entries(collections).map(([k, v]) => `${k}:${v}`).join(' ');

	if (total === 0) {
		log.error('ServerReady', `🚨 SERVER_READY called but store is EMPTY (0 docs)! Seed may have failed.`);
	} else {
		log.info('ServerReady', `📡 Broadcasting SERVER_READY — ${total} docs repopulated | ${colSummary}`);
	}

	emitBroadcast('SERVER_READY');
	return json({ ok: true, total, collections });
};
