import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const returnTo = url.searchParams.get('returnTo');

	if (code) {
		await supabase.auth.exchangeCodeForSession(code);
	}

	// Redirect to returnTo parameter if provided, otherwise go to home
	const redirectUrl = returnTo || '/';
	throw redirect(303, redirectUrl);
};
