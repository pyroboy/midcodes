import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions } from './$types';
import { env } from '$lib/server/env';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const pin = data.get('pin')?.toString();

		if (!pin || pin !== env.ADMIN_PIN) {
			return fail(401, { error: 'Invalid PIN' });
		}

		cookies.set('admin_session', 'authenticated', {
			path: '/admin',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		redirect(303, '/admin');
	}
};
