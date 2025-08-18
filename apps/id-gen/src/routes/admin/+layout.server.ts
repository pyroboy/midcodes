import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { supabase, session, user, org_id, permissions } = locals;

	// Check if user is authenticated
	if (!session || !user) {
		throw redirect(303, `/auth?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	// Check if user has admin permissions
	// The roles are stored in app_metadata, not in a direct role property
	const userRoles = user.app_metadata?.role ? [user.app_metadata.role] : 
		(user.app_metadata?.roles || []);
	
	const adminRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'property_admin'];
	const hasAdminRole = userRoles.some((role: string) => adminRoles.includes(role));
	
	if (!hasAdminRole) {
		console.log('Access denied. User roles:', userRoles, 'Required:', adminRoles);
		throw error(403, 'Access denied. Admin privileges required.');
	}

	// Get organization information
	let organization = null;
	if (org_id) {
		const { data: orgData, error: orgError } = await supabase
			.from('organizations')
			.select('id, name, created_at')
			.eq('id', org_id)
			.single();

		if (orgError) {
			console.error('Error fetching organization:', orgError);
		} else {
			organization = orgData;
		}
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role
		},
		organization,
		org_id,
		permissions
	};
};