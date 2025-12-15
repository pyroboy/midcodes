/**
 * Path Access Matrix
 * 
 * Defines which roles can access which paths in the application.
 * Used by the role emulation banner to show access status.
 */

// Role definitions
export const SUPER_ADMIN_ROLES = ['super_admin'];

export const ADMIN_ROLES = [
	'super_admin',
	'org_admin',
	'id_gen_admin'
];

export const ORG_ADMIN_ROLES = [
	'super_admin',
	'org_admin'
];

// CRUD permission types
export type CrudAction = 'create' | 'read' | 'update' | 'delete';

// Permission categories relevant to different pages
export interface CrudPermissions {
	create: boolean;
	read: boolean;
	update: boolean;
	delete: boolean;
}

// Default CRUD permissions for each role per resource type
// This is a simplified matrix - actual permissions come from database
export const ROLE_CRUD_PERMISSIONS: Record<string, Record<string, CrudPermissions>> = {
	// Super admins have all permissions
	'super_admin': {
		templates: { create: true, read: true, update: true, delete: true },
		idcards: { create: true, read: true, update: true, delete: true },
		users: { create: true, read: true, update: true, delete: true },
		invoices: { create: true, read: true, update: true, delete: true },
		credits: { create: true, read: true, update: true, delete: true },
		organizations: { create: true, read: true, update: true, delete: true },
		analytics: { create: false, read: true, update: false, delete: false }
	},
	'org_admin': {
		templates: { create: true, read: true, update: true, delete: true },
		idcards: { create: true, read: true, update: true, delete: true },
		users: { create: true, read: true, update: true, delete: false },
		invoices: { create: false, read: true, update: false, delete: false },
		credits: { create: false, read: true, update: false, delete: false },
		organizations: { create: false, read: true, update: true, delete: false },
		analytics: { create: false, read: true, update: false, delete: false }
	},
	'id_gen_admin': {
		templates: { create: true, read: true, update: true, delete: false },
		idcards: { create: true, read: true, update: true, delete: true },
		users: { create: false, read: true, update: true, delete: false },
		invoices: { create: false, read: true, update: false, delete: false },
		credits: { create: false, read: false, update: false, delete: false },
		organizations: { create: false, read: true, update: false, delete: false },
		analytics: { create: false, read: true, update: false, delete: false }
	},
	'id_gen_encoder': {
		templates: { create: false, read: true, update: false, delete: false },
		idcards: { create: true, read: true, update: true, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: false, read: false, update: false, delete: false },
		credits: { create: false, read: false, update: false, delete: false },
		organizations: { create: false, read: false, update: false, delete: false },
		analytics: { create: false, read: false, update: false, delete: false }
	},
	'id_gen_printer': {
		templates: { create: false, read: true, update: false, delete: false },
		idcards: { create: false, read: true, update: false, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: false, read: false, update: false, delete: false },
		credits: { create: false, read: false, update: false, delete: false },
		organizations: { create: false, read: false, update: false, delete: false },
		analytics: { create: false, read: false, update: false, delete: false }
	},
	'id_gen_viewer': {
		templates: { create: false, read: true, update: false, delete: false },
		idcards: { create: false, read: true, update: false, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: false, read: false, update: false, delete: false },
		credits: { create: false, read: false, update: false, delete: false },
		organizations: { create: false, read: false, update: false, delete: false },
		analytics: { create: false, read: false, update: false, delete: false }
	},
	'id_gen_template_designer': {
		templates: { create: true, read: true, update: true, delete: false },
		idcards: { create: false, read: true, update: false, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: false, read: false, update: false, delete: false },
		credits: { create: false, read: false, update: false, delete: false },
		organizations: { create: false, read: false, update: false, delete: false },
		analytics: { create: false, read: false, update: false, delete: false }
	},
	'id_gen_auditor': {
		templates: { create: false, read: true, update: false, delete: false },
		idcards: { create: false, read: true, update: false, delete: false },
		users: { create: false, read: true, update: false, delete: false },
		invoices: { create: false, read: true, update: false, delete: false },
		credits: { create: false, read: true, update: false, delete: false },
		organizations: { create: false, read: true, update: false, delete: false },
		analytics: { create: false, read: true, update: false, delete: false }
	},
	'id_gen_accountant': {
		templates: { create: false, read: false, update: false, delete: false },
		idcards: { create: false, read: false, update: false, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: true, read: true, update: true, delete: false },
		credits: { create: true, read: true, update: true, delete: false },
		organizations: { create: false, read: true, update: false, delete: false },
		analytics: { create: false, read: true, update: false, delete: false }
	},
	'id_gen_user': {
		templates: { create: false, read: true, update: false, delete: false },
		idcards: { create: true, read: true, update: true, delete: false },
		users: { create: false, read: false, update: false, delete: false },
		invoices: { create: false, read: true, update: false, delete: false },
		credits: { create: false, read: true, update: false, delete: false },
		organizations: { create: false, read: false, update: false, delete: false },
		analytics: { create: false, read: false, update: false, delete: false }
	}
};

// Map paths to their relevant resource types
export function getResourceTypeForPath(pathname: string): string {
	if (pathname.includes('/template')) return 'templates';
	if (pathname.includes('/idcard') || pathname.includes('/all-ids') || pathname.includes('/use-template')) return 'idcards';
	if (pathname.includes('/user')) return 'users';
	if (pathname.includes('/invoice')) return 'invoices';
	if (pathname.includes('/credit')) return 'credits';
	if (pathname.includes('/organization')) return 'organizations';
	if (pathname.includes('/analytics')) return 'analytics';
	if (pathname.includes('/admin')) return 'idcards'; // Default for admin pages
	return 'idcards'; // Default
}

// Get CRUD permissions for a role on a specific path
export function getCrudPermissionsForRole(role: string, pathname: string): CrudPermissions {
	const resourceType = getResourceTypeForPath(pathname);
	const rolePerms = ROLE_CRUD_PERMISSIONS[role];
	
	if (!rolePerms) {
		return { create: false, read: false, update: false, delete: false };
	}
	
	return rolePerms[resourceType] || { create: false, read: false, update: false, delete: false };
}

// All available roles
export type RoleName = 
	| 'super_admin'
	| 'org_admin'
	| 'id_gen_admin'
	| 'id_gen_encoder'
	| 'id_gen_printer'
	| 'id_gen_viewer'
	| 'id_gen_template_designer'
	| 'id_gen_auditor'
	| 'id_gen_accountant'
	| 'id_gen_user';

// Path access configuration
export interface PathAccessConfig {
	pattern: string | RegExp;
	allowedRoles: RoleName[] | 'all' | 'authenticated' | 'super_admin_only';
	name: string;
	description: string;
}

/**
 * Path access matrix - defines which roles can access which paths
 * Order matters: more specific paths should come first
 */
export const PATH_ACCESS_MATRIX: PathAccessConfig[] = [
	// Super admin only pages
	{
		pattern: '/admin/credits',
		allowedRoles: 'super_admin_only',
		name: 'Credits Management',
		description: 'Manage organization credits'
	},
	{
		pattern: '/admin/ai-settings',
		allowedRoles: 'super_admin_only',
		name: 'AI Settings',
		description: 'Configure AI API settings and keys'
	},
	{
		pattern: '/debug-user',
		allowedRoles: 'super_admin_only',
		name: 'Debug User',
		description: 'Debug user information'
	},
	
	// Admin pages (any admin role)
	{
		pattern: '/admin/analytics',
		allowedRoles: ['super_admin', 'org_admin'],
		name: 'Analytics',
		description: 'View analytics and reports'
	},
	{
		pattern: '/admin/organization',
		allowedRoles: 'super_admin_only',
		name: 'Organization Management',
		description: 'Manage all organizations'
	},
	{
		pattern: '/admin/users',
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_admin'],
		name: 'User Management',
		description: 'Manage users in organization'
	},
	{
		pattern: '/admin/roles',
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_admin'],
		name: 'Roles Management',
		description: 'Manage roles and permissions'
	},
	{
		pattern: '/admin/invoices',
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_accountant'],
		name: 'Invoices',
		description: 'View and manage invoices'
	},
	{
		pattern: '/admin/ai-generation',
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_admin'],
		name: 'AI Generation',
		description: 'AI photo generation tools'
	},
	{
		pattern: '/admin/template-assets',
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_template_designer'],
		name: 'Template Assets',
		description: 'Manage template assets'
	},
	{
		pattern: /^\/admin/,
		allowedRoles: ['super_admin', 'org_admin', 'id_gen_admin'],
		name: 'Admin Dashboard',
		description: 'Admin dashboard access'
	},
	
	// Organization page
	{
		pattern: '/organization',
		allowedRoles: ['super_admin', 'org_admin'],
		name: 'My Organization',
		description: 'View and manage your organization'
	},
	
	// Templates 
	{
		pattern: /^\/templates/,
		allowedRoles: 'authenticated',
		name: 'Templates',
		description: 'View and use ID card templates'
	},
	{
		pattern: /^\/use-template/,
		allowedRoles: 'authenticated',
		name: 'Use Template',
		description: 'Generate ID cards from template'
	},
	
	// IDs and cards
	{
		pattern: /^\/all-ids/,
		allowedRoles: 'authenticated',
		name: 'All IDs',
		description: 'View all generated ID cards'
	},
	
	// Profile
	{
		pattern: '/profile',
		allowedRoles: 'authenticated',
		name: 'Profile',
		description: 'User profile settings'
	},
	
	// Account
	{
		pattern: '/account',
		allowedRoles: 'authenticated',
		name: 'Account',
		description: 'Account settings and billing'
	},
	
	// Public pages
	{
		pattern: '/',
		allowedRoles: 'all',
		name: 'Home',
		description: 'Home page'
	},
	{
		pattern: '/auth',
		allowedRoles: 'all',
		name: 'Authentication',
		description: 'Login and signup'
	},
	{
		pattern: '/pricing',
		allowedRoles: 'all',
		name: 'Pricing',
		description: 'View pricing plans'
	},
	{
		pattern: '/how-it-works',
		allowedRoles: 'all',
		name: 'How It Works',
		description: 'Learn how the app works'
	}
];

export type PathAccessStatus = 'allowed' | 'blocked' | 'bypassing' | 'unknown';

export interface PathAccessResult {
	status: PathAccessStatus;
	pathConfig: PathAccessConfig | null;
	reason: string;
}

/**
 * Check if a role has access to a specific path
 * @param pathname - The current page path
 * @param emulatedRole - The role being emulated
 * @param originalRole - The original role of the user
 * @param isEmulating - Whether role emulation is active
 * @param hasBypassParam - Whether the URL has ?superadmin_bypass=true
 */
export function checkPathAccess(
	pathname: string,
	emulatedRole: string | null | undefined,
	originalRole: string | null | undefined,
	isEmulating: boolean,
	hasBypassParam: boolean = false
): PathAccessResult {
	// Find matching path config
	const pathConfig = PATH_ACCESS_MATRIX.find((config) => {
		if (typeof config.pattern === 'string') {
			return pathname === config.pattern || pathname.startsWith(config.pattern + '/');
		}
		return config.pattern.test(pathname);
	});

	if (!pathConfig) {
		return {
			status: 'unknown',
			pathConfig: null,
			reason: 'No access rules defined for this path'
		};
	}

	// When emulating, check if the emulated role has access
	const roleToCheck = isEmulating ? emulatedRole : originalRole;
	
	// Check access based on allowed roles
	if (pathConfig.allowedRoles === 'all') {
		return {
			status: 'allowed',
			pathConfig,
			reason: 'Public page - accessible to everyone'
		};
	}

	if (pathConfig.allowedRoles === 'authenticated') {
		return {
			status: 'allowed',
			pathConfig,
			reason: 'Available to all authenticated users'
		};
	}

	if (pathConfig.allowedRoles === 'super_admin_only') {
		const emulatedIsSuperAdmin = SUPER_ADMIN_ROLES.includes(emulatedRole || '');
		const originalIsSuperAdmin = SUPER_ADMIN_ROLES.includes(originalRole || '');
		
		// If emulating and emulated role doesn't have access
		if (isEmulating && !emulatedIsSuperAdmin && originalIsSuperAdmin) {
			// Only show "bypassing" if they have the bypass param
			if (hasBypassParam) {
				return {
					status: 'bypassing',
					pathConfig,
					reason: `Super Admin only - ${emulatedRole} cannot access, but bypassing with original role`
				};
			} else {
				// No bypass param = "assuming role" = should be blocked
				return {
					status: 'blocked',
					pathConfig,
					reason: `Super Admin only - ${emulatedRole} does not have access`
				};
			}
		}
		
		const roleHasAccess = SUPER_ADMIN_ROLES.includes(roleToCheck || '');
		if (roleHasAccess) {
			return {
				status: 'allowed',
				pathConfig,
				reason: 'Super Admin access granted'
			};
		}
		
		return {
			status: 'blocked',
			pathConfig,
			reason: 'Super Admin privileges required'
		};
	}

	// Check array of allowed roles
	const allowedRoles = pathConfig.allowedRoles as RoleName[];
	const emulatedHasAccess = allowedRoles.includes(emulatedRole as RoleName);
	const originalHasAccess = allowedRoles.includes(originalRole as RoleName);

	// If emulating and emulated role doesn't have access but original does
	if (isEmulating && !emulatedHasAccess && originalHasAccess) {
		// Only show "bypassing" if they have the bypass param
		if (hasBypassParam) {
			return {
				status: 'bypassing',
				pathConfig,
				reason: `${emulatedRole} cannot access, but bypassing with ${originalRole}`
			};
		} else {
			// No bypass param = "assuming role" = should be blocked
			return {
				status: 'blocked',
				pathConfig,
				reason: `${emulatedRole} does not have access to this page`
			};
		}
	}

	const roleHasAccess = allowedRoles.includes(roleToCheck as RoleName);
	if (roleHasAccess) {
		return {
			status: 'allowed',
			pathConfig,
			reason: `${roleToCheck} has access to this page`
		};
	}

	return {
		status: 'blocked',
		pathConfig,
		reason: `Required role: ${allowedRoles.join(' or ')}`
	};
}

/**
 * Get display color class for access status
 */
export function getAccessStatusColor(status: PathAccessStatus): string {
	switch (status) {
		case 'allowed':
			return 'text-green-400 bg-green-500/20';
		case 'blocked':
			return 'text-red-400 bg-red-500/20';
		case 'bypassing':
			return 'text-amber-400 bg-amber-500/20';
		default:
			return 'text-gray-400 bg-gray-500/20';
	}
}

/**
 * Get display icon for access status
 */
export function getAccessStatusIcon(status: PathAccessStatus): string {
	switch (status) {
		case 'allowed':
			return '✓';
		case 'blocked':
			return '✕';
		case 'bypassing':
			return '⚠';
		default:
			return '?';
	}
}

/**
 * Get status label for display
 */
export function getAccessStatusLabel(status: PathAccessStatus): string {
	switch (status) {
		case 'allowed':
			return 'Allowed';
		case 'blocked':
			return 'Blocked';
		case 'bypassing':
			return 'Bypassing';
		default:
			return 'Unknown';
	}
}

// All roles for the permission matrix display
export const ALL_ROLES: RoleName[] = [
	'super_admin',
	'org_admin',
	'id_gen_admin',
	'id_gen_encoder',
	'id_gen_printer',
	'id_gen_viewer',
	'id_gen_template_designer',
	'id_gen_auditor',
	'id_gen_accountant',
	'id_gen_user'
];

// Role display names for better readability
export const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
	'super_admin': 'Super Admin',
	'org_admin': 'Org Admin',
	'id_gen_admin': 'Admin',
	'id_gen_encoder': 'Encoder',
	'id_gen_printer': 'Printer',
	'id_gen_viewer': 'Viewer',
	'id_gen_template_designer': 'Template Designer',
	'id_gen_auditor': 'Auditor',
	'id_gen_accountant': 'Accountant',
	'id_gen_user': 'User'
};

export interface RoleAccessInfo {
	role: RoleName;
	displayName: string;
	hasAccess: boolean;
	isCurrentRole: boolean;
	isEmulatedRole: boolean;
	crud: CrudPermissions;
}

/**
 * Get all roles with their access status for a given path
 */
export function getAllRolesAccessForPath(
	pathname: string,
	emulatedRole: string | null | undefined,
	originalRole: string | null | undefined
): RoleAccessInfo[] {
	// Find matching path config
	const pathConfig = PATH_ACCESS_MATRIX.find((config) => {
		if (typeof config.pattern === 'string') {
			return pathname === config.pattern || pathname.startsWith(config.pattern + '/');
		}
		return config.pattern.test(pathname);
	});

	return ALL_ROLES.map(role => {
		let hasAccess = false;

		if (!pathConfig) {
			hasAccess = false;
		} else if (pathConfig.allowedRoles === 'all') {
			hasAccess = true;
		} else if (pathConfig.allowedRoles === 'authenticated') {
			hasAccess = true;
		} else if (pathConfig.allowedRoles === 'super_admin_only') {
			hasAccess = SUPER_ADMIN_ROLES.includes(role);
		} else {
			hasAccess = (pathConfig.allowedRoles as RoleName[]).includes(role);
		}

		// Get CRUD permissions for this role on this path
		const crud = getCrudPermissionsForRole(role, pathname);

		return {
			role,
			displayName: ROLE_DISPLAY_NAMES[role],
			hasAccess,
			isCurrentRole: originalRole === role,
			isEmulatedRole: emulatedRole === role,
			crud
		};
	});
}

/**
 * Get path config for current pathname
 */
export function getPathConfig(pathname: string): PathAccessConfig | null {
	return PATH_ACCESS_MATRIX.find((config) => {
		if (typeof config.pattern === 'string') {
			return pathname === config.pattern || pathname.startsWith(config.pattern + '/');
		}
		return config.pattern.test(pathname);
	}) || null;
}
