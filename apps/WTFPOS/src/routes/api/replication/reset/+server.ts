import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { emitBroadcast } from '$lib/server/replication-store';
import { isLoopbackIP } from '$lib/server/client-tracker';

export const POST: RequestHandler = async ({ getClientAddress }) => {
	const ip = getClientAddress();

	// Only the server tablet (loopback) can trigger a full database reset.
	// Thin clients on the LAN must not be able to wipe all data.
	if (!isLoopbackIP(ip)) {
		return json({ error: 'Reset is only allowed from the server device' }, { status: 403 });
	}

	emitBroadcast('RESET_ALL');
	return json({ ok: true });
};
