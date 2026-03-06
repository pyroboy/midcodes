/**
 * Global Session State — Svelte 5 Runes
 * Holds the currently logged-in user and selected location.
 * Locations can be 'retail' (tables + POS + KDS) or 'warehouse' (inventory only).
 * Session is persisted to localStorage so it survives page reloads.
 */
import { browser } from '$app/environment';

const SESSION_KEY = 'wtfpos_session';

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

function loadPersistedSession(): { userName: string; role: Role; locationId: LocationId; isLocked: boolean } {
	if (!browser) return { userName: '', role: 'staff', locationId: 'qc', isLocked: false };
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		if (raw) return JSON.parse(raw);
	} catch {}
	return { userName: '', role: 'staff', locationId: 'qc', isLocked: false };
}

const _persisted = loadPersistedSession();

export const session = $state({
	userName:   _persisted.userName,
	role:       _persisted.role,
	/** Current location; replaces the old 'branch' field */
	locationId: _persisted.locationId,
	/** True when the user cannot switch locations */
	isLocked:   _persisted.isLocked,
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

/** Pure derivation of location and lock state from role — no side effects. */
export function deriveSessionState(
	role: Role,
	locationId: LocationId
): { resolvedLocationId: LocationId; isLocked: boolean } {
	const isElevated = ELEVATED_ROLES.includes(role);
	return {
		resolvedLocationId: (!isElevated && locationId === 'all') ? 'qc' : locationId,
		isLocked: !isElevated
	};
}

export function setSession(userName: string, role: Role, locationId: LocationId = 'qc') {
	session.userName = userName;
	session.role     = role;
	const { resolvedLocationId, isLocked } = deriveSessionState(role, locationId);
	session.locationId = resolvedLocationId;
	session.isLocked   = isLocked;
	if (browser) {
		localStorage.setItem(SESSION_KEY, JSON.stringify({
			userName: session.userName,
			role:     session.role,
			locationId: session.locationId,
			isLocked:   session.isLocked,
		}));
	}
}

export function clearSession() {
	session.userName   = '';
	session.role       = 'staff';
	session.locationId = 'qc';
	session.isLocked   = false;
	if (browser) localStorage.removeItem(SESSION_KEY);
}
