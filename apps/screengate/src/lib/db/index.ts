import { createRxDatabase, type RxDatabase, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { scanSchema, personSchema } from './schemas';

let _db: RxDatabase | null = null;
const DB_NAME = 'screengate_cache';

export async function getDb(): Promise<RxDatabase> {
	if (_db) return _db;

	// Check globalThis for HMR persistence
	if (typeof globalThis !== 'undefined' && (globalThis as any).__rxdb_screengate) {
		_db = (globalThis as any).__rxdb_screengate;
		return _db!;
	}

	try {
		_db = await createRxDatabase({
			name: DB_NAME,
			storage: getRxStorageDexie(),
			ignoreDuplicate: true
		});
	} catch (e: any) {
		if (e.code === 'COL23' || e.message?.includes('COL23')) {
			await removeRxDatabase(DB_NAME, getRxStorageDexie());
			_db = await createRxDatabase({
				name: DB_NAME,
				storage: getRxStorageDexie(),
				ignoreDuplicate: true
			});
		} else {
			throw e;
		}
	}

	await _db!.addCollections({
		scans: { schema: scanSchema },
		people: { schema: personSchema }
	});

	if (typeof globalThis !== 'undefined') {
		(globalThis as any).__rxdb_screengate = _db;
	}

	return _db!;
}

export async function upsertRxDoc(collection: string, doc: Record<string, any>) {
	const db = await getDb();
	await db[collection].upsert(doc);
}

export async function removeRxDoc(collection: string, id: string) {
	const db = await getDb();
	const doc = await db[collection].findOne(id).exec();
	if (doc) await doc.remove();
}
