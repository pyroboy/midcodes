import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkAdmin, checkAdminEmulatedOnly, checkSuperAdmin, shouldBypassFor403, wantsToAssumeRole } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	// Get data from parent layout (authentication check happens there)
	const parentData = await parent();
	const { user, roleEmulation } = locals;

	if (!user) {
		throw error(403, 'Access denied');
	}

	// Check if user wants to assume the emulated role and experience being blocked
	const assumingRole = wantsToAssumeRole(locals, url);

	// Require admin role - use emulated-only check if user wants to assume role
	const isAdmin = assumingRole 
		? checkAdminEmulatedOnly(locals) 
		: checkAdmin(locals);
	
	const isSuperAdmin = checkSuperAdmin(locals);
	const canBypass = shouldBypassFor403(locals, url);

	// If not admin and not bypassing, handle soft denial
	if (!isAdmin && !canBypass) {
		// Check if original role is super admin (for bypass prompt)
		if (isSuperAdmin) {
			// Super admin assuming role - show bypass prompt instead of 403
			return {
				...parentData,
				accessDenied: true,
				assumingRole: true,
				requiredRole: 'admin',
				currentRole: roleEmulation?.originalRole || user.role,
				emulatedRole: roleEmulation?.emulatedRole,
				isSuperAdmin: true,
				defaultDays: 30
			};
		}

		// Not a super admin at all - throw hard 403
		throw error(403, 'Admin privileges required');
	}

	// Determine if this is a bypassed access
	const bypassedAccess = canBypass;

	// Analytics data is fetched client-side via remote functions for better caching
	// and to support date range changes without full page reloads
	return {
		...parentData,
		// Initial date range (can be changed client-side)
		defaultDays: 30,
		assumingRole: false,
		bypassedAccess,
		requiredRole: bypassedAccess ? 'admin' : undefined,
		originalRole: bypassedAccess ? roleEmulation?.originalRole || user.role : undefined
	};
};
