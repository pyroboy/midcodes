import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, session, org_id, permissions } = locals;

	// Require authentication
	if (!session || !user) {
		throw redirect(302, '/auth');
	}

	// Use robust super admin check
	if (!checkSuperAdmin(locals)) {
		throw error(403, 'Admin access required');
	}

	return {
		debug: {
			hasUser: !!user,
			hasSession: !!session,
			userId: user?.id,
			userEmail: user?.email,
			// Avoid returning sensitive metadata
			orgId: org_id,
			permissions: permissions,
			userRoles: roles.length ? roles : singleRole ? [singleRole] : []
		}
	};
};
