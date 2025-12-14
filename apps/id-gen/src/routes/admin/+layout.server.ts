import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url, setHeaders }) => {
	// Prevent caching of admin pages
	setHeaders({
		'Cache-Control': 'no-store, no-cache, must-revalidate, private',
		'Pragma': 'no-cache',
		'Expires': '0'
	});
	const { supabase, session, user, org_id, permissions, effectiveRoles, roleEmulation } = locals;

	// Check if user is authenticated
	if (!session || !user) {
		throw redirect(303, `/auth?returnTo=${encodeURIComponent(url.pathname)}`);
	}

	// Check if user has admin permissions using effective roles
	const adminRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'property_admin'];
	const hasAdminRole = effectiveRoles?.some((role: string) => adminRoles.includes(role));

	if (!hasAdminRole) {
		// If user is actively emulating but originally has admin rights, we allow them in
		// but flag it so the UI can show a warning

		if (roleEmulation?.active && roleEmulation?.originalRole) {
			const originalIsAdmin = adminRoles.includes(roleEmulation.originalRole);
			if (originalIsAdmin) {
				console.log('Admin emulation bypass active. Original role:', roleEmulation.originalRole);
				// Continue loading, but maybe return a warning flag
				// We don't return early here, we fall through to normal loading
			} else {
				// Block non-admins who are emulating
				console.log('Admin access blocked by emulation:', roleEmulation);
				return {
					user: {
						id: user.id,
						email: user.email,
						role: user.role
					},
					organization: null,
					org_id,
					permissions,
					roleEmulation,
					blockedByEmulation: true
				};
			}
		} else {
			// No emulation or original role is not admin
			console.log('Access denied. Effective roles:', effectiveRoles, 'Required:', adminRoles);
			throw error(403, 'Access denied. Admin privileges required.');
		}
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
		permissions,
		roleEmulation,
		blockedByEmulation: false,
		warningEmulationIgnored: !hasAdminRole && roleEmulation?.active && adminRoles.includes(roleEmulation.originalRole || '')
	};
};
