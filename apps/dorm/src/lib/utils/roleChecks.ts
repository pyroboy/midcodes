export const ADMIN_ROLES = [
	'super_admin',
	'org_admin',
	'property_admin',
	'property_manager',
	'property_accountant',
	'id_gen_admin'
] as const;

export const STAFF_ROLES = [
	'property_maintenance',
	'property_utility',
	'property_frontdesk',
	'event_admin',
	'event_qr_checker'
] as const;

export const VIEW_ROLES = ['property_tenant', 'property_guest', 'id_gen_user', 'user'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type ViewRole = (typeof VIEW_ROLES)[number];
export type UserRole = AdminRole | StaffRole | ViewRole;

export function checkAccess(
	userRole: string | undefined,
	requiredLevel: 'admin' | 'staff' | 'view'
): boolean {
	if (!userRole) return false;

	switch (requiredLevel) {
		case 'admin':
			return ADMIN_ROLES.includes(userRole as AdminRole);
		case 'staff':
			return (
				ADMIN_ROLES.includes(userRole as AdminRole) || STAFF_ROLES.includes(userRole as StaffRole)
			);
		case 'view':
			return (
				ADMIN_ROLES.includes(userRole as AdminRole) ||
				STAFF_ROLES.includes(userRole as StaffRole) ||
				VIEW_ROLES.includes(userRole as ViewRole)
			);
		default:
			return false;
	}
}
