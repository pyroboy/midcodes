import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ locals }) => {
	// Use robust super admin check that considers all role sources
	if (!checkSuperAdmin(locals)) {
		throw error(403, 'Super admin privileges required.');
	}

	return {};
};
