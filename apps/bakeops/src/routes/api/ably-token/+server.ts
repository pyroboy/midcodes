import { json } from '@sveltejs/kit';
import { createAblyTokenRequest } from '$lib/server/ably';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const tokenRequest = await createAblyTokenRequest();
	return json(tokenRequest);
};
