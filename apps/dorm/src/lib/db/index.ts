import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import {
	tenantSchema,
	leaseSchema,
	leaseTenantSchema,
	rentalUnitSchema,
	propertySchema,
	floorSchema,
	meterSchema,
	readingSchema,
	billingSchema,
	paymentSchema,
	paymentAllocationSchema,
	expenseSchema,
	budgetSchema,
	penaltyConfigSchema
} from './schemas';

import { dev } from '$app/environment';

// v0→v1 migration: index-only change, no data transformation needed.
const IDENTITY_MIGRATION = { 1: (doc: any) => doc };

// Register plugins once — guard against duplicate registration
let pluginsRegistered = false;
if (!pluginsRegistered) {
	addRxPlugin(RxDBUpdatePlugin);
	addRxPlugin(RxDBQueryBuilderPlugin);
	addRxPlugin(RxDBCleanupPlugin);
	addRxPlugin(RxDBMigrationSchemaPlugin);
	pluginsRegistered = true;
}

// Dev-mode plugin must be loaded BEFORE createRxDatabase
let devModeReady: Promise<void>;
if (dev) {
	devModeReady = import('rxdb/plugins/dev-mode').then(({ RxDBDevModePlugin }) => {
		addRxPlugin(RxDBDevModePlugin);
	});
} else {
	devModeReady = Promise.resolve();
}

const COLLECTIONS = {
	tenants: { schema: tenantSchema, migrationStrategies: IDENTITY_MIGRATION },
	leases: { schema: leaseSchema, migrationStrategies: IDENTITY_MIGRATION },
	lease_tenants: { schema: leaseTenantSchema, migrationStrategies: IDENTITY_MIGRATION },
	rental_units: { schema: rentalUnitSchema, migrationStrategies: IDENTITY_MIGRATION },
	properties: { schema: propertySchema, migrationStrategies: IDENTITY_MIGRATION },
	floors: { schema: floorSchema, migrationStrategies: IDENTITY_MIGRATION },
	meters: { schema: meterSchema, migrationStrategies: IDENTITY_MIGRATION },
	readings: { schema: readingSchema, migrationStrategies: IDENTITY_MIGRATION },
	billings: { schema: billingSchema, migrationStrategies: IDENTITY_MIGRATION },
	payments: { schema: paymentSchema, migrationStrategies: IDENTITY_MIGRATION },
	payment_allocations: { schema: paymentAllocationSchema, migrationStrategies: IDENTITY_MIGRATION },
	expenses: { schema: expenseSchema, migrationStrategies: IDENTITY_MIGRATION },
	budgets: { schema: budgetSchema, migrationStrategies: IDENTITY_MIGRATION },
	penalty_configs: { schema: penaltyConfigSchema, migrationStrategies: IDENTITY_MIGRATION }
};

// Store the singleton on globalThis to survive Vite's production code-splitting
const DB_KEY = '__dorm_rxdb';
const DB_PROMISE_KEY = '__dorm_rxdb_promise';

function getCachedDb(): RxDatabase | null {
	return (globalThis as any)[DB_KEY] ?? null;
}

export async function getDb(): Promise<RxDatabase> {
	// Return cached instance immediately
	const cached = getCachedDb();
	if (cached) return cached;

	// Return in-flight promise if one exists
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

		let db: RxDatabase;
		try {
			db = await createRxDatabase({
				name: 'dorm_db',
				storage,
				eventReduce: true,
				// ignoreDuplicate only works with dev-mode plugin loaded.
				// In production, we rely on the globalThis promise cache to prevent duplicates.
				ignoreDuplicate: dev
			});
		} catch (err: any) {
			// DB9: database already exists — reuse it
			if (err?.code === 'DB9' || err?.message?.includes('already exists')) {
				console.warn('[RxDB] Database already exists, attempting reuse');
				// Try creating with ignoreDuplicate in dev, or just re-throw in prod
				// The globalThis cache should prevent this, but as a safety net:
				const existingCached = getCachedDb();
				if (existingCached) return existingCached;
				throw err;
			}
			throw err;
		}

		// Only add collections if not already present
		if (Object.keys(db.collections).length === 0) {
			await db.addCollections(COLLECTIONS);
		}

		// Cache the resolved instance
		(globalThis as any)[DB_KEY] = db;
		return db;
	})();

	return (globalThis as any)[DB_PROMISE_KEY];
}
