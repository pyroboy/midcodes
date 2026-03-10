/**
 * Global Session State — Svelte 5 Runes
 * Holds the currently logged-in user and selected location.
 * Locations can be 'retail' (tables + POS + KDS) or 'warehouse' (inventory only).
 * Session is persisted to sessionStorage (not localStorage) to prevent same-origin tab collision.
 */
import { browser } from '$app/environment';

const SESSION_KEY = 'wtfpos_session';

export type Role          = 'staff' | 'manager' | 'kitchen' | 'owner' | 'admin';
export type LocationType  = 'retail' | 'warehouse';
export type LocationId    = 'tag' | 'pgl' | 'wh-tag' | 'all';
export type KitchenFocus  = 'butcher' | 'sides' | 'dispatch' | 'stove' | null;

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
	{ id: 'tag',    name: 'Alta Citta (Tagbilaran)',       type: 'retail'    },
	{ id: 'pgl',    name: 'Alona Beach (Panglao)',         type: 'retail'    },
	{ id: 'wh-tag', name: 'Tagbilaran Central Warehouse',  type: 'warehouse' },
	{ id: 'all',    name: 'All Locations',                  type: 'retail'    },
];

/** @deprecated Use LOCATIONS */
export const BRANCHES = LOCATIONS;

/** Human-readable short names for locations (eliminates duplication across components) */
export const LOCATION_SHORT_NAMES: Record<string, string> = {
	'tag': 'Alta Citta', 'pgl': 'Alona Beach', 'wh-tag': 'Warehouse'
};

/** Roles that can see cross-location data and the Admin tab */
export const ELEVATED_ROLES: Role[] = ['owner', 'admin', 'manager'];
export const ADMIN_ROLES: Role[]    = ['owner', 'admin'];

/** Manager override PIN — single source of truth. Set VITE_MANAGER_PIN in .env to override. */
export const MANAGER_PIN = import.meta.env.VITE_MANAGER_PIN || '1234';

/** Which top-level nav tabs each role can access */
export const ROLE_NAV_ACCESS: Record<Role, string[]> = {
	staff:   ['/pos'],
	kitchen: ['/kitchen', '/stock'],
	manager: ['/pos', '/kitchen', '/stock', '/reports'],
	owner:   ['/pos', '/kitchen', '/stock', '/reports', '/admin'],
	admin:   ['/pos', '/kitchen', '/stock', '/reports', '/admin'],
};

function loadPersistedSession(): { userName: string; role: Role; locationId: LocationId; isLocked: boolean; kitchenFocus: KitchenFocus } {
	if (!browser) return { userName: '', role: 'staff', locationId: 'tag', isLocked: false, kitchenFocus: null };
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (raw) return { kitchenFocus: null, ...JSON.parse(raw) };
	} catch {}
	return { userName: '', role: 'staff', locationId: 'tag', isLocked: false, kitchenFocus: null };
}

const _persisted = loadPersistedSession();

export const session = $state({
	userName:     _persisted.userName,
	role:         _persisted.role,
	/** Current location; replaces the old 'branch' field */
	locationId:   _persisted.locationId,
	/** True when the user cannot switch locations */
	isLocked:     _persisted.isLocked,
	/** Kitchen sub-role for focused UI — butcher/sides/dispatch/stove or null */
	kitchenFocus: _persisted.kitchenFocus,
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
		resolvedLocationId: (!isElevated && locationId === 'all') ? 'tag' : locationId,
		isLocked: !isElevated
	};
}

export function setSession(userName: string, role: Role, locationId: LocationId = 'tag', kitchenFocus: KitchenFocus = null) {
	session.userName     = userName;
	session.role         = role;
	session.kitchenFocus = kitchenFocus;
	const { resolvedLocationId, isLocked } = deriveSessionState(role, locationId);
	session.locationId = resolvedLocationId;
	session.isLocked   = isLocked;
	if (browser) {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify({
			userName:     session.userName,
			role:         session.role,
			locationId:   session.locationId,
			isLocked:     session.isLocked,
			kitchenFocus: session.kitchenFocus,
		}));
	}
}

/**
 * Update the active location and persist to sessionStorage so that the choice
 * survives SvelteKit client-side navigation.  Elevated roles can switch freely;
 * locked roles (staff / kitchen) are silently ignored.
 */
export function setLocation(locationId: LocationId) {
	if (session.isLocked) return;
	session.locationId = locationId;
	if (browser) {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify({
			userName:     session.userName,
			role:         session.role,
			locationId:   session.locationId,
			isLocked:     session.isLocked,
			kitchenFocus: session.kitchenFocus,
		}));
	}
}

// TODO: P0-8 session expiry warning — requires server-side session timestamps

export function clearSession() {
	session.userName     = '';
	session.role         = 'staff';
	session.locationId   = 'tag';
	session.isLocked     = false;
	session.kitchenFocus = null;
	if (browser) sessionStorage.removeItem(SESSION_KEY);
}
