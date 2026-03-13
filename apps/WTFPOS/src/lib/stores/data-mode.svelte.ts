import { browser } from '$app/environment';
import { session, type Role } from './session.svelte';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataMode = 'full-rxdb' | 'selective-rxdb' | 'sse-only' | 'api-fetch';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The 6 RxDB collections that POS staff/manager thin clients need. */
export const SELECTIVE_COLLECTIONS = [
	'tables',
	'orders',
	'menu_items',
	'floor_elements',
	'kds_tickets',
	'devices'
] as const;

const STORAGE_KEY = 'wtfpos_data_mode';

// ---------------------------------------------------------------------------
// Reactive state — restore from sessionStorage immediately so stores created
// during module initialization (before resolveDataMode() is called) use the
// correct mode. Without this, page refresh defaults to 'full-rxdb' on clients.
// ---------------------------------------------------------------------------

function restoreFromCache(): DataMode {
	if (!browser) return 'full-rxdb';
	try {
		const cached = sessionStorage.getItem(STORAGE_KEY) as DataMode | null;
		if (cached && ['full-rxdb', 'selective-rxdb', 'sse-only', 'api-fetch'].includes(cached)) {
			return cached;
		}
	} catch { /* sessionStorage not available */ }
	return 'full-rxdb';
}

let dataMode = $state<DataMode>(restoreFromCache());

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

interface DeviceIdentity {
	isServer: boolean;
}

async function fetchDeviceIdentity(): Promise<DeviceIdentity> {
	try {
		const res = await fetch('/api/device/identify');
		if (!res.ok) return { isServer: false };
		return (await res.json()) as DeviceIdentity;
	} catch {
		return { isServer: false };
	}
}

function modeForRole(role: Role): DataMode {
	if (role === 'staff' || role === 'manager') return 'selective-rxdb';
	if (role === 'kitchen') return 'selective-rxdb';
	// owner, admin
	return 'api-fetch';
}

/**
 * Resolve the data mode for the current device/session.
 *
 * 1. If the device is the server tablet → `full-rxdb`
 * 2. Otherwise fall back to a role-based mode
 *
 * Persists the result to `sessionStorage` so reloads are instant.
 */
export async function resolveDataMode(): Promise<DataMode> {
	if (!browser) return 'full-rxdb';

	// Fast path: restore from sessionStorage on reload
	const cached = sessionStorage.getItem(STORAGE_KEY) as DataMode | null;
	if (cached) {
		dataMode = cached;
	}

	const identity = await fetchDeviceIdentity();

	let resolved: DataMode;
	if (identity.isServer) {
		resolved = 'full-rxdb';
	} else {
		resolved = modeForRole(session.role);
	}

	dataMode = resolved;
	sessionStorage.setItem(STORAGE_KEY, resolved);
	return resolved;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when the client uses RxDB (full or selective). */
export function isRxDbMode(): boolean {
	return dataMode === 'full-rxdb' || dataMode === 'selective-rxdb';
}

/** True only for the server tablet with all 17 collections. */
export function isFullRxDbMode(): boolean {
	return dataMode === 'full-rxdb';
}

/** True when the client relies solely on SSE streams (kitchen displays). */
export function isSseMode(): boolean {
	return dataMode === 'sse-only';
}

/** True when the client fetches data via REST + SSE invalidation (owner/admin). */
export function isApiFetchMode(): boolean {
	return dataMode === 'api-fetch';
}

/** Alias for `isRxDbMode()` — true when RxDB must be initialised. */
export function needsRxDb(): boolean {
	return isRxDbMode();
}

// ---------------------------------------------------------------------------
// Export reactive state (read-only access via getter)
// ---------------------------------------------------------------------------

export function getDataMode(): DataMode {
	return dataMode;
}
