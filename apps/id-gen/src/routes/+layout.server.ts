// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Destructure all the auth-related data from locals
	const { session, user, org_id, permissions } = locals;

	return {
		session,
		user,
		org_id,
		permissions
	};
};
