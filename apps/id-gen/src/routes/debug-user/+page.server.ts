import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, session, org_id, permissions } = locals;

	return {
		debug: {
			hasUser: !!user,
			hasSession: !!session,
			userId: user?.id,
			userEmail: user?.email,
			userMetadata: user?.user_metadata,
			appMetadata: user?.app_metadata,
			orgId: org_id,
			permissions: permissions,
			userRoles: user?.app_metadata?.role
				? [user.app_metadata.role]
				: user?.app_metadata?.roles || []
		}
	};
};
