import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkAdmin } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ parent, locals }) => {
	await parent();
	const { user } = locals;

	if (!user) {
		throw error(403, 'Access denied');
	}

	// Require admin role
	const isAdmin = checkAdmin(locals);

	if (!isAdmin) {
		throw error(403, 'Admin privileges required');
	}

	return {};
};
