import { createRxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import {
	tableSchema,
	orderSchema,
	menuItemSchema,
	stockItemSchema,
	deliverySchema,
	wasteSchema,
	deductionSchema,
	expenseSchema,
	adjustmentSchema,
	stockCountSchema,
	deviceSchema
} from './schemas';

import { dev } from '$app/environment';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// Register necessary plugins
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Add dev mode plugin only in development to catch errors and allow ignoreDuplicate for HMR
if (dev) {
	addRxPlugin(RxDBDevModePlugin);
}

import { wrappedValidateIsMyJsonValidStorage } from 'rxdb/plugins/validate-is-my-json-valid';

const globalForRxDB = globalThis as unknown as {
	__wtfposDbPromise: Promise<any> | null;
};

let dbPromise: Promise<any> | null = globalForRxDB.__wtfposDbPromise || null;

export async function getDb() {
	if (dbPromise) return dbPromise;

	dbPromise = globalForRxDB.__wtfposDbPromise = (async () => {
		// Initialize the database with Dexie (IndexedDB) as the storage engine
		const db = await createRxDatabase({
			name: 'wtfpos_db',
			storage: dev 
				? wrappedValidateIsMyJsonValidStorage({ storage: getRxStorageDexie() })
				: getRxStorageDexie(),
            multiInstance: true,          // Allow multiple instances per tab (good for SvelteKit HMR)
            eventReduce: true             // Query optimization
		});

		// Add our collections using the defined schemas
		await db.addCollections({
			tables: { schema: tableSchema },
			orders: { schema: orderSchema },
			menu_items: { schema: menuItemSchema },
			stock_items: { schema: stockItemSchema },
			deliveries: { schema: deliverySchema },
			waste: { schema: wasteSchema },
			deductions: { schema: deductionSchema },
			expenses: { schema: expenseSchema },
			adjustments: { schema: adjustmentSchema },
			stock_counts: { schema: stockCountSchema },
			devices: { schema: deviceSchema }
		});

        // Try to dynamically import the seeder and run it only in uninitialized environments
        const seedModule = await import('./seed');
        await seedModule.seedDatabaseIfNeeded(db as any);

		return db;
	})();

	return dbPromise;
}

/**
 * Completely removes the RxDB database from IndexedDB and reloads the page.
 * This will trigger a fresh initialization and seed on the next load.
 */
export async function resetDatabase() {
	if (typeof window === 'undefined') return;

	try {
		if (dbPromise) {
			const db = await dbPromise;
			await db.remove();
			dbPromise = null;
		} else {
			await removeRxDatabase('wtfpos_db', getRxStorageDexie());
		}
	} catch (err) {
		console.error('[RxDB] Failed to remove database gracefully, fallback to IndexedDB API', err);
		window.indexedDB.deleteDatabase('wtfpos_db');
	}

	window.location.reload();
}
