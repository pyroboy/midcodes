import { getDb } from '$lib/db';
import { browser } from '$app/environment';

/**
 * Creates a reactive Svelte 5 store linked to an RxDB collection query.
 * Subscribes to the RxDB observable so the UI updates automatically
 * whenever local data changes (insert/update/delete from replication).
 *
 * Usage:
 *   const tenants = createRxStore<TenantDoc>('tenants',
 *     db => db.tenants.find({ selector: { deleted_at: { $eq: null } }, sort: [{ name: 'asc' }] })
 *   );
 *   // In template: {#each tenants.value as t}
 */
export function createRxStore<T = any>(
	collectionName: string,
	queryFn: (db: any) => any
) {
	let state = $state<T[]>([]);
	let initialized = $state(false);
	let error = $state<string | null>(null);

	if (browser) {
		getDb()
			.then((db) => {
				const query = queryFn(db);
				query.$.subscribe((documents: any[]) => {
					state = documents.map((doc: any) => doc.toJSON());
					initialized = true;
				});
			})
			.catch((err: any) => {
				console.error(`[RxStore:${collectionName}] Failed to initialize:`, err);
				error = err?.message || 'RxDB initialization failed';
				// Mark as initialized so pages don't stay on skeleton forever
				initialized = true;
			});
	}

	return {
		get value() {
			return state;
		},
		get initialized() {
			return initialized;
		},
		get error() {
			return error;
		}
	};
}
