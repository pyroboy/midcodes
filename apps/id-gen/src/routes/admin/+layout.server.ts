import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { checkSuperAdmin, checkAdmin } from '$lib/utils/adminPermissions';

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

	// Use robust admin check that considers ALL role sources
	const hasAdminAccess = checkAdmin(locals);
	const isSuperAdmin = checkSuperAdmin(locals);

	if (!hasAdminAccess) {
		// If user is actively emulating but originally has admin rights, we allow them in
		// but flag it so the UI can show a warning (checkAdmin already handles this)
		
		// If still no access after robust check, they truly don't have permission
		console.log('Admin access denied. User:', user?.email, 'Effective roles:', effectiveRoles);
		
		if (roleEmulation?.active) {
			// Show blocked by emulation UI instead of error
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
				blockedByEmulation: true,
				isSuperAdmin: false,
				availableRolesForEmulation: []
			};
		}
		
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

	// Available roles for emulation (only shown to super admins)
	// isSuperAdmin is already defined above using the robust check
	
	const availableRolesForEmulation = isSuperAdmin ? [
		{ value: 'org_admin', label: 'Org Admin' },
		{ value: 'id_gen_admin', label: 'ID Gen Admin' },
		{ value: 'id_gen_encoder', label: 'Encoder' },
		{ value: 'id_gen_printer', label: 'Printer' },
		{ value: 'id_gen_viewer', label: 'Viewer' },
		{ value: 'id_gen_template_designer', label: 'Template Designer' },
		{ value: 'id_gen_auditor', label: 'Auditor' },
		{ value: 'id_gen_accountant', label: 'Accountant' },
		{ value: 'id_gen_user', label: 'User' }
	] : [];

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
		warningEmulationIgnored: !hasAdminAccess && roleEmulation?.active,
		isSuperAdmin,
		availableRolesForEmulation
	};
};
