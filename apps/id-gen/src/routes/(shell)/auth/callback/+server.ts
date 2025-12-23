import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This callback endpoint is for OAuth redirects
// With Better Auth, OAuth is handled differently - this is a compatibility shim
export const GET: RequestHandler = async ({ url, locals }) => {
	const returnTo = url.searchParams.get('returnTo');
	const code = url.searchParams.get('code');

	// If there's an OAuth code, Better Auth handles it via its own callback
	// This endpoint is kept for backwards compatibility redirects
	if (code) {
		// Better Auth handles OAuth via /api/auth/callback/[provider]
		// Just redirect to home after OAuth
		console.log('Legacy OAuth callback received, redirecting');
	}

	// Redirect to returnTo parameter if provided, otherwise go to home
	const redirectUrl = returnTo || '/';
	throw redirect(303, redirectUrl);
};
