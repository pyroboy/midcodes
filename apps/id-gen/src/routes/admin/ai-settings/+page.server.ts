import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkSuperAdmin, checkSuperAdminEmulatedOnly, shouldBypassFor403, wantsToAssumeRole } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const parentData = await parent();
	const { user, roleEmulation } = locals;

	if (!user) {
		throw error(403, 'Access denied');
	}

	// Check if user wants to assume the emulated role and experience being blocked
	const assumingRole = wantsToAssumeRole(locals, url);

	// Require super admin role for AI settings - use emulated-only check if user wants to assume role
	const isSuperAdmin = assumingRole 
		? checkSuperAdminEmulatedOnly(locals) 
		: checkSuperAdmin(locals);
	
	const canBypass = shouldBypassFor403(locals, url);

	// If not super admin and not bypassing, handle denial
	if (!isSuperAdmin && !canBypass) {
		// Check if original role is super admin (for bypass prompt)
		const originalIsSuperAdmin = checkSuperAdmin(locals);

		if (originalIsSuperAdmin) {
			// Super admin assuming role - show access denied page with bypass option
			return {
				...parentData,
				accessDenied: true,
				assumingRole: true,
				requiredRole: 'super_admin',
				currentRole: roleEmulation?.originalRole || user.role,
				emulatedRole: roleEmulation?.emulatedRole,
				isSuperAdmin: true
			};
		}

		// Not a super admin at all - throw hard 403
		throw error(403, 'Super admin privileges required');
	}

	// Determine if this is a bypassed access
	const bypassedAccess = canBypass;

	return {
		...parentData,
		assumingRole: false,
		bypassedAccess,
		requiredRole: bypassedAccess ? 'super_admin' : undefined,
		originalRole: bypassedAccess ? roleEmulation?.originalRole || user.role : undefined
	};
};
