/**
 * Admin Permission Utilities
 * 
 * Provides consistent, robust permission checking across all admin pages.
 * This ensures super admins never get locked out, even during role emulation.
 */

// Uses App.Locals from app.d.ts (globally available)

interface AdminCheckResult {
	isSuperAdmin: boolean;
	isAdmin: boolean;
	userRole: string;
	effectiveRole: string;
	isEmulating: boolean;
	originalRole?: string;
}

// All roles that grant super admin access
const SUPER_ADMIN_ROLES = ['super_admin', 'id_gen_super_admin'];

// All roles that grant general admin access
const ADMIN_ROLES = ['super_admin', 'id_gen_super_admin', 'org_admin', 'id_gen_org_admin', 'id_gen_admin', 'property_admin'];

/**
 * Comprehensive check for super admin status.
 * Checks ALL possible sources of role information to ensure super admins never get locked out.
 */
export function checkSuperAdmin(locals: App.Locals): boolean {
	const { user, effectiveRoles, roleEmulation } = locals;
	
	// Check 1: Original role during emulation (super admin emulating another role)
	if (roleEmulation?.active && roleEmulation?.originalRole) {
		if (SUPER_ADMIN_ROLES.includes(roleEmulation.originalRole)) {
			return true;
		}
	}
	
	// Check 2: User's profile role
	if (user?.role && SUPER_ADMIN_ROLES.includes(user.role)) {
		return true;
	}
	
	// Check 3: Effective roles from JWT
	if (effectiveRoles?.some((role: string) => SUPER_ADMIN_ROLES.includes(role))) {
		return true;
	}
	
	// Check 4: User metadata (backup)
	const metadataRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
	if (metadataRole && SUPER_ADMIN_ROLES.includes(metadataRole)) {
		return true;
	}
	
	return false;
}

/**
 * Comprehensive check for any admin status (super admin, org admin, etc.)
 * Checks ALL possible sources of role information.
 */
export function checkAdmin(locals: App.Locals): boolean {
	const { user, effectiveRoles, roleEmulation } = locals;
	
	// Check 1: Original role during emulation
	if (roleEmulation?.active && roleEmulation?.originalRole) {
		if (ADMIN_ROLES.includes(roleEmulation.originalRole)) {
			return true;
		}
	}
	
	// Check 2: User's profile role
	if (user?.role && ADMIN_ROLES.includes(user.role)) {
		return true;
	}
	
	// Check 3: Effective roles from JWT
	if (effectiveRoles?.some((role: string) => ADMIN_ROLES.includes(role))) {
		return true;
	}
	
	// Check 4: User metadata (backup)
	const metadataRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
	if (metadataRole && ADMIN_ROLES.includes(metadataRole)) {
		return true;
	}
	
	return false;
}

/**
 * Get full admin status with details for debugging and UI purposes.
 */
export function getAdminStatus(locals: App.Locals): AdminCheckResult {
	const { user, effectiveRoles, roleEmulation } = locals;
	
	const isEmulating = roleEmulation?.active || false;
	const originalRole = roleEmulation?.originalRole;
	const userRole = user?.role || 'unknown';
	const effectiveRole = effectiveRoles?.[0] || userRole;
	
	return {
		isSuperAdmin: checkSuperAdmin(locals),
		isAdmin: checkAdmin(locals),
		userRole,
		effectiveRole,
		isEmulating,
		originalRole
	};
}

/**
 * Check if user has a specific role (considering emulation).
 * Super admins ALWAYS pass this check.
 */
export function hasRole(locals: App.Locals, requiredRoles: string[]): boolean {
	// Super admins always have access
	if (checkSuperAdmin(locals)) {
		return true;
	}
	
	const { user, effectiveRoles, roleEmulation } = locals;
	
	// Check original role if emulating
	if (roleEmulation?.active && roleEmulation?.originalRole) {
		if (requiredRoles.includes(roleEmulation.originalRole)) {
			return true;
		}
	}
	
	// Check profile role
	if (user?.role && requiredRoles.includes(user.role)) {
		return true;
	}
	
	// Check effective roles
	if (effectiveRoles?.some((role: string) => requiredRoles.includes(role))) {
		return true;
	}
	
	return false;
}
