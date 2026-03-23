/**
 * RxDB client database for schooldocs.
 *
 * Collections cached locally:
 *   - orders         (admin work queue — frequent reads)
 *   - document_types (config data — near-static)
 *
 * Data flow:
 *   1. Admin opens app → server loads data from Neon → populates RxDB
 *   2. Admin reads come from RxDB (instant, no DB round-trip)
 *   3. Writes go to Neon via server actions (source of truth)
 *   4. After write, server publishes Ably event
 *   5. Ably event arrives on client → updateRxCollection() patches local RxDB
 *   6. Svelte UI reactively updates via RxDB subscription
 */

import { createRxDatabase, removeRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { ordersSchema, documentTypesSchema } from './schemas';
import { dev } from '$app/environment';

// Register plugins once
let pluginsRegistered = false;
if (!pluginsRegistered) {
	addRxPlugin(RxDBUpdatePlugin);
	addRxPlugin(RxDBQueryBuilderPlugin);
	addRxPlugin(RxDBCleanupPlugin);
	addRxPlugin(RxDBMigrationSchemaPlugin);
	pluginsRegistered = true;
}

// Dev-mode validation plugin (loads async to avoid prod bundle bloat)
let devModeReady: Promise<void>;
if (dev) {
	devModeReady = import('rxdb/plugins/dev-mode').then(({ RxDBDevModePlugin }) => {
		addRxPlugin(RxDBDevModePlugin);
	});
} else {
	devModeReady = Promise.resolve();
}

const IDENTITY_MIGRATION = { 1: (doc: any) => doc };

const col = (schema: any) => ({
	schema,
	migrationStrategies: IDENTITY_MIGRATION,
	cleanup: { minimumDeletedTime: Infinity, autoStart: false }
});

const COLLECTIONS = {
	orders: col(ordersSchema),
	document_types: col(documentTypesSchema)
};

const DB_KEY = '__schooldocs_rxdb';
const DB_PROMISE_KEY = '__schooldocs_rxdb_promise';

function getCachedDb(): RxDatabase | null {
	return (globalThis as any)[DB_KEY] ?? null;
}

export async function getDb(): Promise<RxDatabase> {
	const cached = getCachedDb();
	if (cached) return cached;

	if ((globalThis as any)[DB_PROMISE_KEY]) {
		try {
			return await (globalThis as any)[DB_PROMISE_KEY];
		} catch {
			(globalThis as any)[DB_PROMISE_KEY] = null;
		}
	}

	(globalThis as any)[DB_PROMISE_KEY] = (async () => {
		await devModeReady;

		let storage: any = getRxStorageDexie();
		if (dev) {
			const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv');
			storage = wrappedValidateAjvStorage({ storage });
		}

		const DB_NAME = 'schooldocs_db';

		// Fallback hash for HTTP (non-secure) contexts (e.g. LAN dev)
		const hasSubtle = typeof globalThis.crypto?.subtle?.digest === 'function';
		const hashFunction = hasSubtle
			? undefined
			: async (input: string) => {
					let h = 5381;
					for (let i = 0; i < input.length; i++) {
						h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
					}
					return h.toString(16).padStart(8, '0');
				};

		const createDb = async () => {
			const db = await createRxDatabase({
				name: DB_NAME,
				storage,
				eventReduce: true,
				multiInstance: false,
				ignoreDuplicate: dev,
				...(hashFunction ? { hashFunction } : {})
			});
			if (Object.keys(db.collections).length === 0) {
				await db.addCollections(COLLECTIONS);
			}
			return db;
		};

		let db: RxDatabase;
		try {
			db = await createDb();
		} catch (err: any) {
			if (err?.code === 'COL23') {
				console.warn('[RxDB] Stale DB detected, removing and recreating');
				await removeRxDatabase(DB_NAME, storage);
				db = await createDb();
			} else {
				throw err;
			}
		}

		(globalThis as any)[DB_KEY] = db;
		return db;
	})();

	return (globalThis as any)[DB_PROMISE_KEY];
}

/**
 * Upsert a document into a local RxDB collection.
 * Called when an Ably event arrives — keeps local cache in sync with Neon.
 */
export async function upsertRxDoc(
	collection: 'orders' | 'document_types',
	doc: Record<string, unknown>
): Promise<void> {
	const db = await getDb();
	await (db as any)[collection].upsert(doc);
}

/**
 * Remove a document from a local RxDB collection.
 * Called when an Ably delete event arrives.
 */
export async function removeRxDoc(
	collection: 'orders' | 'document_types',
	id: string
): Promise<void> {
	const db = await getDb();
	const doc = await (db as any)[collection].findOne(id).exec();
	if (doc) await doc.remove();
}
