import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, cookies }) => {
	// Sign out via Better Auth
	try {
		await auth.api.signOut({
			headers: request.headers
		});
	} catch (e) {
		console.error('[SIGNOUT] Better Auth signOut failed:', e);
	}

	// Clear any app-specific cookies
	const cookieOptions = { path: '/', expires: new Date(0) };
	cookies.set('sidebar:state', '', cookieOptions);
	cookies.set('selectedOrgId', '', cookieOptions);

	throw redirect(303, '/auth');
};

export const POST = GET;
