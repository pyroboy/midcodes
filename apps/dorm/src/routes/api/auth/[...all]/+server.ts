import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// Better Auth catch-all handler — processes sign-in, sign-up, session, etc.
// and sets its own cookies correctly.
export const GET: RequestHandler = async ({ request }) => {
	return auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
	return auth.handler(request);
};
