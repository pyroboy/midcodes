import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { emitBroadcast } from '$lib/server/replication-store';

export const POST: RequestHandler = async () => {
	emitBroadcast('RESET_ALL');
	return json({ ok: true });
};
