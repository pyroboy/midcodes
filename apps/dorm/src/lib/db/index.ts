import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
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
	penaltyConfigSchema,
	floorLayoutItemSchema
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
	addRxPlugin(RxDBLeaderElectionPlugin);
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

// Shared collection config: identity migration + no auto-cleanup timer
// (we call cleanup(0) explicitly in pruning.ts — the auto-timer crashes on HMR)
const col = (schema: any) => ({
	schema,
	migrationStrategies: IDENTITY_MIGRATION,
	cleanup: { minimumDeletedTime: Infinity, autoStart: false }
});

// New collections starting at version 0 — no migration strategy needed
const col0 = (schema: any) => ({
	schema,
	migrationStrategies: {},
	cleanup: { minimumDeletedTime: Infinity, autoStart: false }
});

const COLLECTIONS = {
	tenants: col(tenantSchema),
	leases: col(leaseSchema),
	lease_tenants: col(leaseTenantSchema),
	rental_units: col(rentalUnitSchema),
	properties: col(propertySchema),
	floors: col(floorSchema),
	meters: col(meterSchema),
	readings: col(readingSchema),
	billings: col(billingSchema),
	payments: col(paymentSchema),
	payment_allocations: col(paymentAllocationSchema),
	expenses: col(expenseSchema),
	budgets: col(budgetSchema),
	penalty_configs: col(penaltyConfigSchema),
	floor_layout_items: col0(floorLayoutItemSchema)
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
