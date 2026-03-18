import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, cookies }) => {
	// Sign out via Better Auth (invalidates session in DB)
	try {
		await auth.api.signOut({
			headers: request.headers
		});
	} catch (e) {
		console.error('[SIGNOUT] Better Auth signOut failed:', e);
	}

	// Explicitly clear the session cookie — auth.api.signOut() invalidates the DB
	// session but its Set-Cookie header isn't propagated through SvelteKit's
	// redirect, so the browser keeps sending the stale cookie.
	const cookieOptions = { path: '/', expires: new Date(0) };
	cookies.set('better-auth.session_token', '', cookieOptions);
	cookies.set('dev_role', '', cookieOptions);
	cookies.set('sidebar_state', '', cookieOptions);
	cookies.set('selectedOrgId', '', cookieOptions);

	throw redirect(303, '/auth');
};

export const POST = GET;
