import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	if (user?.role !== 'super_admin') {
		throw error(403, 'Super admin privileges required.');
	}

	return {};
};
