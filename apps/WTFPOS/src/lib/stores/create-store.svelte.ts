import { isRxDbMode } from '$lib/stores/data-mode.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { createServerStore } from '$lib/stores/server-store.svelte';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoreResult<T> {
	get value(): T[];
	get initialized(): boolean;
}

interface ServerStoreOpts<T> {
	filter?: { locationId?: string };
	sort?: (a: T, b: T) => number;
	primaryKey?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Universal store factory that routes between RxDB and server-backed stores
 * based on the current data mode.
 *
 * @param collectionName - RxDB collection name (e.g. 'orders', 'tables')
 * @param rxdbQueryFn    - Query builder used when in RxDB mode
 * @param sseOpts        - Options forwarded to createServerStore in SSE/API modes
 */
export function createStore<T extends Record<string, any>>(
	collectionName: string,
	rxdbQueryFn: (db: any) => any,
	sseOpts?: ServerStoreOpts<T>
): StoreResult<T> {
	if (isRxDbMode()) {
		return createRxStore<T>(collectionName, rxdbQueryFn);
	}
	return createServerStore<T>(collectionName, sseOpts);
}
