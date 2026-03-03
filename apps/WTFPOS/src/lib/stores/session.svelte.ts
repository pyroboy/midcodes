/**
 * Global Session State — Svelte 5 Runes
 * Holds the currently logged-in user and selected branch.
 * Read/written by TopBar and any page that needs role/branch context.
 */

export type Role     = 'staff' | 'manager' | 'kitchen' | 'owner' | 'admin';
export type BranchId = 'qc' | 'mkti' | 'all';

export interface Branch { id: BranchId; name: string; }

export const BRANCHES: Branch[] = [
	{ id: 'qc',   name: 'Quezon City Branch' },
	{ id: 'mkti', name: 'Makati Branch' },
	{ id: 'all',  name: 'All Branches' }
];

/** Roles that can see cross-branch data and the Admin tab */
export const ELEVATED_ROLES: Role[] = ['owner', 'admin', 'manager'];
export const ADMIN_ROLES: Role[]    = ['owner', 'admin'];

export const session = $state({
	userName: '',
	role: 'staff' as Role,
	/** branch is always 'qc' for non-elevated roles */
	branch: 'qc' as BranchId
});

export function setSession(userName: string, role: Role) {
	session.userName = userName;
	session.role     = role;
	// Non-elevated roles are always scoped to a single branch
	session.branch   = ELEVATED_ROLES.includes(role) ? session.branch : 'qc';
}
