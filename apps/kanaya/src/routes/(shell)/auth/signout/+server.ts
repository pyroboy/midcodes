import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	await auth.api.signOut({
		headers: request.headers
	});

	// Also clear emulation cookie if present
	cookies.delete('role_emulation', { path: '/' });

	throw redirect(303, '/auth');
};
