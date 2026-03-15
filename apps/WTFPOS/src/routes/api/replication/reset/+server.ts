import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { emitBroadcast, getServerStoreSummary } from '$lib/server/replication-store';
import { isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async ({ getClientAddress }) => {
	const ip = getClientAddress();

	// Only the server tablet (loopback) can trigger a full database reset.
	// Thin clients on the LAN must not be able to wipe all data.
	if (!isLoopbackIP(ip)) {
		log.warn('Reset', `Rejected reset request from non-loopback IP: ${ip}`);
		return json({ error: 'Reset is only allowed from the server device' }, { status: 403 });
	}

	const before = getServerStoreSummary();
	const colSummary = Object.entries(before.collections).map(([k, v]) => `${k}:${v}`).join(' ');
	log.banner(
		'',
		'  🔥  RESET REQUESTED  🔥',
		'',
		`  Wiping ${before.total} docs across ${Object.keys(before.collections).length} collections`,
		`  ${colSummary || '(empty)'}`,
		`  ${new Date().toLocaleString('en-PH')}`,
		''
	);

	emitBroadcast('RESET_ALL');

	const after = getServerStoreSummary();
	log.info('Reset', `🧹 Post-wipe: ${after.total} docs remain (should be 0). Writes blocked until SERVER_READY.`);
	if (after.total > 0) {
		log.error('Reset', `🚨 POST-WIPE RESIDUAL: ${after.total} docs survived RESET_ALL! Collections: ${JSON.stringify(after.collections)}`);
	}

	return json({ ok: true, before: before.total, after: after.total });
};
