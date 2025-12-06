import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, session, org_id, permissions } = locals;

	// Require authentication
	if (!session || !user) {
		throw redirect(302, '/auth');
	}

	// Only allow super_admin role
	const roles = (user.app_metadata?.roles as string[] | undefined) || [];
	const singleRole = (user.app_metadata?.role as string | undefined) || undefined;
	const hasSuperAdmin = roles.includes('super_admin') || singleRole === 'super_admin';
	if (!hasSuperAdmin) {
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
