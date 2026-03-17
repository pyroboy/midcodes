import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const isLoginPage = url.pathname === '/admin/login';
	const session = cookies.get('admin_session');

	if (!session && !isLoginPage) {
		redirect(303, '/admin/login');
	}

	if (session && isLoginPage) {
		redirect(303, '/admin');
	}

	return { authenticated: !!session };
};
