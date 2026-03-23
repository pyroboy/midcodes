/**
 * Reactive Svelte 5 store backed by an RxDB collection query.
 * Subscribes to the RxDB observable so the UI updates automatically
 * when local data changes (from Ably sync or optimistic updates).
 *
 * Usage:
 *   const orders = createRxStore('orders',
 *     db => db.orders.find({ selector: { status: { $ne: 'completed' } }, sort: [{ created_at: 'desc' }] })
 *   );
 *   // In template: {#each orders.value as order}
 */

import { getDb } from '$lib/db';
import { browser } from '$app/environment';

export function createRxStore<T = any>(
	collectionName: string,
	queryFn: (db: any) => any
) {
	let state = $state<T[]>([]);
	let initialized = $state(false);
	let error = $state<string | null>(null);
	let subscription: any = null;

	if (browser) {
		getDb()
			.then((db) => {
				const query = queryFn(db);
				subscription = query.$.subscribe((documents: any[]) => {
					state = documents.map((doc: any) => doc.toJSON());
					initialized = true;
				});
			})
			.catch((err: any) => {
				console.error(`[RxStore:${collectionName}] Failed to initialize:`, err);
				error = err?.message || 'RxDB initialization failed';
				initialized = true;
			});
	}

	return {
		get value() { return state; },
		get initialized() { return initialized; },
		get error() { return error; },
		unsubscribe() {
			subscription?.unsubscribe();
			subscription = null;
		}
	};
}
