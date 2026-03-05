import { getDb } from '$lib/db';
import { browser } from '$app/environment';

/**
 * Creates a reactive Svelte 5 store linked to an RxDB collection query.
 * Initial state sets to an empty array until the observable resolves.
 * 
 * Usage:
 * const tables = createRxStore('tables', db => db.tables.find());
 */
export function createRxStore<T = any>(
    collectionName: string, 
    queryFn: (db: any) => any // db[collection].find(...)
) {
    let state = $state<T[]>([]);
	let initialized = $state(false);

    if (browser) {
        // Fetch DB and subscribe to the query observable
        getDb().then(db => {
            const query = queryFn(db);
            query.$.subscribe((documents: any[]) => {
                // Update the state reactively whenever local/cloud data changes
                state = documents.map(doc => doc.toJSON());
                initialized = true;
            });
        }).catch(err => {
            console.error('Failed to initialize RxDB store:', err);
        });
    }

    return {
        get value() {
            return state;
        },
		get initialized() {
			return initialized;
		}
    };
}
