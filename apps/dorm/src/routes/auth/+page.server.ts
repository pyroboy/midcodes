import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already logged in, redirect
	if (locals.session) {
		const returnTo = url.searchParams.get('returnTo') || '/';
		throw redirect(303, returnTo);
	}

	// Always show quick-access cards alongside the login form.
	// Quick-access bypasses Better Auth entirely (no bcrypt, no DB session).
	// Real login also works (schema split keeps CF Workers under CPU limit).
	return {
		devBypass: true
	};
};
