/**
 * POST /api/ably-token
 *
 * Issues a short-lived Ably token request for authenticated clients.
 * The Ably client on the browser uses this to authenticate — the raw API key
 * never leaves the server.
 *
 * Returns a token request object that the Ably SDK exchanges for a real token.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createAblyTokenRequest } from '$lib/server/ably';

export const POST: RequestHandler = async ({ locals }) => {
	// Only authenticated users get an Ably token
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const role = locals.user.role ?? 'staff';

	try {
		const tokenRequest = await createAblyTokenRequest(locals.user.id, role);
		return json(tokenRequest);
	} catch (err) {
		console.error('[ably-token] Failed to create token request:', err);
		throw error(500, 'Failed to create Ably token');
	}
};
