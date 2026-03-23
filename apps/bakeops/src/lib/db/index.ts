import { createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { ingredientSchema, recipeSchema, batchSchema } from './schemas';

export type BakeOpsDB = RxDatabase;

let dbPromise: Promise<BakeOpsDB> | null = null;

export async function getDb(): Promise<BakeOpsDB> {
	if (dbPromise) return dbPromise;

	dbPromise = (async () => {
		// Reuse across HMR in dev
		if ((globalThis as any).__bakeops_db) {
			return (globalThis as any).__bakeops_db as BakeOpsDB;
		}

		const db = await createRxDatabase({
			name: 'bakeopsdb',
			storage: getRxStorageDexie(),
			ignoreDuplicate: true
		});

		await db.addCollections({
			ingredients: { schema: ingredientSchema },
			recipes: { schema: recipeSchema },
			batches: { schema: batchSchema }
		});

		(globalThis as any).__bakeops_db = db;
		return db;
	})();

	return dbPromise;
}
