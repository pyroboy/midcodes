/**
 * Global Session State — Svelte 5 Runes
 * Holds the currently logged-in user and selected location.
 * Locations can be 'retail' (tables + POS + KDS) or 'warehouse' (inventory only).
 */

export type Role         = 'staff' | 'manager' | 'kitchen' | 'owner' | 'admin';
export type LocationType = 'retail' | 'warehouse';
export type LocationId   = 'qc' | 'mkti' | 'wh-qc' | 'all';

/** @deprecated Use LocationId */
export type BranchId = LocationId;

export interface Location {
	id: LocationId;
	name: string;
	type: LocationType;
}

/** @deprecated Use Location */
export interface Branch { id: LocationId; name: string; }

export const LOCATIONS: Location[] = [
	{ id: 'qc',    name: 'Alta Cita (QC)',       type: 'retail'    },
	{ id: 'mkti',  name: 'Alona (Makati)',        type: 'retail'    },
	{ id: 'wh-qc', name: 'QC Central Warehouse', type: 'warehouse' },
	{ id: 'all',   name: 'All Locations',         type: 'retail'    },
];

/** @deprecated Use LOCATIONS */
export const BRANCHES = LOCATIONS;

/** Roles that can see cross-location data and the Admin tab */
export const ELEVATED_ROLES: Role[] = ['owner', 'admin', 'manager'];
export const ADMIN_ROLES: Role[]    = ['owner', 'admin'];

/** Which top-level nav tabs each role can access */
export const ROLE_NAV_ACCESS: Record<Role, string[]> = {
	staff:   ['/pos'],
	kitchen: ['/kitchen', '/stock'],
	manager: ['/pos', '/kitchen', '/stock', '/reports'],
	owner:   ['/pos', '/kitchen', '/stock', '/reports', '/admin'],
	admin:   ['/pos', '/kitchen', '/stock', '/reports', '/admin'],
};

export const session = $state({
	userName:   '',
	role:       'staff' as Role,
	/** Current location; replaces the old 'branch' field */
	locationId: 'qc' as LocationId,
	/** True when the user cannot switch locations */
	isLocked:   false,
});

// ─── Location Helpers ─────────────────────────────────────────────────────────

export function getCurrentLocation(): Location | undefined {
	return LOCATIONS.find(l => l.id === session.locationId);
}

/** True when the current location is a warehouse (inventory-only, no POS/floor) */
export function isWarehouseSession(): boolean {
	return getCurrentLocation()?.type === 'warehouse';
}

export function isRetailSession(): boolean {
	return !isWarehouseSession();
}

export function setSession(userName: string, role: Role, locationId: LocationId = 'qc') {
	session.userName = userName;
	session.role     = role;

	const isElevated = ELEVATED_ROLES.includes(role);

	// Non-elevated roles cannot be placed in the aggregate 'all' view
	if (!isElevated && locationId === 'all') {
		session.locationId = 'qc';
	} else {
		session.locationId = locationId;
	}

	// Non-elevated roles are locked to their assigned location
	session.isLocked = !isElevated;
}
