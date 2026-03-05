import { createRxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
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
	deviceSchema,
	kdsTicketSchema,
	kdsHistorySchema,
	xReadSchema,
	utilityReadingSchema
} from './schemas';

import { dev } from '$app/environment';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// Register necessary plugins
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

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
	if (globalForRxDB.__wtfposDbPromise) {
		try {
			return await globalForRxDB.__wtfposDbPromise;
		} catch (err) {
			console.error('[RxDB] Existing database promise failed, clearing and retrying...', err);
			globalForRxDB.__wtfposDbPromise = null;
		}
	}

	dbPromise = globalForRxDB.__wtfposDbPromise = (async () => {
		try {
			// Initialize the database with Dexie (IndexedDB) as the storage engine
			const db = await createRxDatabase({
				name: 'wtfpos_db',
				storage: dev 
					? wrappedValidateIsMyJsonValidStorage({ storage: getRxStorageDexie() })
					: getRxStorageDexie(),
				multiInstance: true,          // Allow multiple instances per tab (good for SvelteKit HMR)
				eventReduce: true,             // Query optimization
				ignoreDuplicate: true,         // Vital for HMR/Development
				closeDuplicates: true          // Recommended for HMR
			});

			// Check if collections already exist (prevents COL23)
			if (Object.keys(db.collections).length > 0) {
				console.log('[RxDB] Collections already exist, skipping addCollections');
				return db;
			}

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
				stock_counts: { 
					schema: stockCountSchema,
					migrationStrategies: {
							1: (oldDoc: any) => {
								return {
									stockItemId: oldDoc.stockItemId,
									counted: {
										am10: oldDoc.counted?.['10am'] || oldDoc.counted?.am10 || null,
										pm4: oldDoc.counted?.['4pm'] || oldDoc.counted?.pm4 || null,
										pm10: oldDoc.counted?.['10pm'] || oldDoc.counted?.pm10 || null
									}
								};
							}
					}
				},
				devices: { schema: deviceSchema },
				kds_tickets: { schema: kdsTicketSchema },
				kds_history: { schema: kdsHistorySchema },
				x_reads: { schema: xReadSchema },
				utility_readings: { schema: utilityReadingSchema }
			});

			// Try to dynamically import the seeder and run it only in uninitialized environments
			const seedModule = await import('./seed');
			await seedModule.seedDatabaseIfNeeded(db as any);

			return db;
		} catch (err: any) {
			console.error('[RxDB] Fatal initialization error:', err);
			globalForRxDB.__wtfposDbPromise = null;
			
			// Auto-recovery for critical schema mismatch or corrupted storage
			// DM4: Migration error, DB9: Database creation failed, SC1: Schema validation failed on load
			if (err?.code === 'DM4' || err?.code === 'DB9' || err?.code === 'SC1' || 
			    err?.message?.includes('closed') || err?.message?.includes('NotFound')) {
				console.warn('[RxDB] Unrecoverable database state detected. Initiating emergency reset...');
				if (typeof window !== 'undefined') {
					// Fallback to native IndexedDB clear if RxDB is too broken to gracefully drop
					window.indexedDB.deleteDatabase('wtfpos_db');
					window.location.reload();
				}
			}
			throw err;
		}
	})();

	return globalForRxDB.__wtfposDbPromise;
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
