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
	originalRole?: string | null;
}

// All roles that grant super admin access
const SUPER_ADMIN_ROLES = ['super_admin'];

// All roles that grant general admin access
const ADMIN_ROLES = ['super_admin', 'org_admin', 'id_gen_admin'];

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

/**
 * Check if a super admin should bypass a 403 error via URL parameter.
 * This allows super admins to access pages they would normally be blocked from
 * (e.g., during role emulation) for debugging purposes.
 */
export function shouldBypassFor403(locals: App.Locals, url: URL): boolean {
	const isSuperAdmin = checkSuperAdmin(locals);
	const hasBypassParam = url.searchParams.get('superadmin_bypass') === 'true';
	return isSuperAdmin && hasBypassParam;
}

/**
 * Check if a super admin wants to "assume" the emulated role and experience being blocked.
 * This is indicated by the ABSENCE of the superadmin_bypass param when emulating.
 * When wantsToAssumeRole is true, server routes should check the emulated role only.
 */
export function wantsToAssumeRole(locals: App.Locals, url: URL): boolean {
	const { roleEmulation } = locals;
	const isSuperAdmin = checkSuperAdmin(locals);
	const hasBypassParam = url.searchParams.get('superadmin_bypass') === 'true';

	// User wants to assume role if:
	// 1. They are a super admin
	// 2. They are actively emulating a role
	// 3. They did NOT include the bypass parameter (meaning they want to be blocked)
	return isSuperAdmin && roleEmulation?.active === true && !hasBypassParam;
}

/**
 * Check super admin status using ONLY the emulated role (not original role).
 * Use this when the user wants to "assume" the emulated role for testing.
 */
export function checkSuperAdminEmulatedOnly(locals: App.Locals): boolean {
	const { roleEmulation } = locals;

	// If emulating, check only the emulated role
	if (roleEmulation?.active && roleEmulation?.emulatedRole) {
		return SUPER_ADMIN_ROLES.includes(roleEmulation.emulatedRole);
	}

	// Not emulating - fall back to normal check
	return checkSuperAdmin(locals);
}

/**
 * Check admin status using ONLY the emulated role (not original role).
 * Use this when the user wants to "assume" the emulated role for testing.
 */
export function checkAdminEmulatedOnly(locals: App.Locals): boolean {
	const { roleEmulation } = locals;

	// If emulating, check only the emulated role
	if (roleEmulation?.active && roleEmulation?.emulatedRole) {
		return ADMIN_ROLES.includes(roleEmulation.emulatedRole);
	}

	// Not emulating - fall back to normal check
	return checkAdmin(locals);
}

/**
 * Get the bypass URL for the current page.
 * Adds the superadmin_bypass=true parameter to the URL.
 */
export function getBypassUrl(url: URL): string {
	const bypassUrl = new URL(url);
	bypassUrl.searchParams.set('superadmin_bypass', 'true');
	return bypassUrl.toString();
}

/**
 * Result type for soft access denial (instead of throwing 403).
 * This allows super admins to see a bypass prompt.
 */
export interface AccessDeniedResult {
	accessDenied: true;
	requiredRole: string;
	requiredPermission?: string;
	currentRole?: string;
	emulatedRole?: string;
	isSuperAdmin: boolean;
}

/**
 * Result type when access is granted via bypass.
 */
export interface BypassedAccessResult {
	bypassedAccess: true;
	requiredRole: string;
	originalRole?: string;
}
