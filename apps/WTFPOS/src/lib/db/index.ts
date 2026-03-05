import { createRxDatabase, addRxPlugin } from 'rxdb';
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

// Register necessary plugins
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

let dbPromise: Promise<any> | null = null;

export async function getDb() {
	if (dbPromise) return dbPromise;

	dbPromise = (async () => {
		// Initialize the database with Dexie (IndexedDB) as the storage engine
		const db = await createRxDatabase({
			name: 'wtfpos_db',
			storage: getRxStorageDexie(),
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
