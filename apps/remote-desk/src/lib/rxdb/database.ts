import { createRxDatabase, addRxPlugin, removeRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import type { RxDatabase } from 'rxdb';
import type { RemoteDeskCollections } from './types';

import employeesSchema from './collections/employees';
import shiftsSchema from './collections/shifts';
import tasksSchema from './collections/tasks';
import inventorySchema from './collections/inventory';
import expensesSchema from './collections/expenses';
import messagesSchema from './collections/messages';
import schedulesSchema from './collections/schedules';

let db: RxDatabase<RemoteDeskCollections> | null = null;

/**
 * Initialize RxDB database with Dexie storage.
 * Following the WTFPOS pattern for RxDB setup.
 */
export async function initializeRxDB(): Promise<RxDatabase<RemoteDeskCollections>> {
	if (db) {
		return db;
	}

	// Add dev mode in development
	if (import.meta.env.DEV) {
		addRxPlugin(RxDBDevModePlugin);
	}

	db = await createRxDatabase<RemoteDeskCollections>({
		name: 'remote_desk_db',
		storage: getRxStorageDexie(),
		multiInstance: true,
		eventReduce: true
	});

	// Add collections
	await db.addCollections({
		employees: {
			schema: employeesSchema,
			migrationStrategies: {}
		},
		shifts: {
			schema: shiftsSchema,
			migrationStrategies: {}
		},
		tasks: {
			schema: tasksSchema,
			migrationStrategies: {}
		},
		inventory: {
			schema: inventorySchema,
			migrationStrategies: {}
		},
		expenses: {
			schema: expensesSchema,
			migrationStrategies: {}
		},
		messages: {
			schema: messagesSchema,
			migrationStrategies: {}
		},
		schedules: {
			schema: schedulesSchema,
			migrationStrategies: {}
		}
	});

	return db;
}

/**
 * Get the RxDB database instance.
 * Initializes if not already done.
 */
export async function getDB(): Promise<RxDatabase<RemoteDeskCollections>> {
	if (!db) {
		return initializeRxDB();
	}
	return db;
}

/**
 * Cleanup function for closing database connections.
 */
export async function closeDB(): Promise<void> {
	if (db) {
		await db.destroy();
		db = null;
	}
}
