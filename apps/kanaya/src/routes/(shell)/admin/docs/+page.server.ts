import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const parentData = await parent();
	const { user } = locals;

	if (!user) {
		throw error(403, 'Access denied');
	}

	// Super admin only - internal documentation
	const isSuperAdmin = checkSuperAdmin(locals);

	if (!isSuperAdmin) {
		throw error(403, 'Super admin privileges required. This is internal documentation.');
	}

	return {
		...parentData
	};
};
