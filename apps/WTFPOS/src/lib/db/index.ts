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
	auditLogSchema,
	kitchenAlertSchema
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

// ─── Migration helpers ──────────────────────────────────────────────────────

/** Backfills updatedAt from the best available timestamp on the document */
function addUpdatedAt(oldDoc: any, ...fallbackFields: string[]) {
	if (!oldDoc.updatedAt) {
		for (const field of fallbackFields) {
			if (oldDoc[field]) { oldDoc.updatedAt = oldDoc[field]; return oldDoc; }
		}
		oldDoc.updatedAt = new Date().toISOString();
	}
	return oldDoc;
}

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
				tables: {
					schema: tableSchema,
					migrationStrategies: {
						1: (d: any) => d, // v0→v1: indexes
						2: (d: any) => addUpdatedAt(d, 'sessionStartedAt') // v1→v2: +updatedAt
					}
				},
				orders: {
					schema: orderSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => d, // v2→v3: nested required
						4: (d: any) => addUpdatedAt(d, 'createdAt') // v3→v4: +updatedAt
					}
				},
				menu_items: {
					schema: menuItemSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d) // v0→v1: +updatedAt (no existing timestamp)
					}
				},
				stock_items: {
					schema: stockItemSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d) // v1→v2: +updatedAt
					}
				},
				deliveries: {
					schema: deliverySchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => { d.depleted = d.depleted ?? false; return d; },
						3: (d: any) => addUpdatedAt(d, 'receivedAt') // v2→v3: +updatedAt
					}
				},
				waste: {
					schema: wasteSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'loggedAt') // v2→v3: +updatedAt
					}
				},
				deductions: {
					schema: deductionSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d, 'timestamp') // v1→v2: +updatedAt
					}
				},
				expenses: {
					schema: expenseSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'createdAt') // v2→v3: +updatedAt
					}
				},
				adjustments: {
					schema: adjustmentSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'loggedAt') // v2→v3: +updatedAt
					}
				},
				stock_counts: {
					schema: stockCountSchema,
					migrationStrategies: {
						1: (d: any) => {
							return {
								stockItemId: d.stockItemId,
								counted: {
									am10: d.counted?.['10am'] || d.counted?.am10 || null,
									pm4: d.counted?.['4pm'] || d.counted?.pm4 || null,
									pm10: d.counted?.['10pm'] || d.counted?.pm10 || null
								}
							};
						},
						2: (d: any) => addUpdatedAt(d) // v1→v2: +updatedAt
					}
				},
				devices: {
					schema: deviceSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d, 'lastSeenAt') // v0→v1: +updatedAt
					}
				},
				kds_tickets: {
					schema: kdsTicketSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d, // v1→v2: nested required
						3: (d: any) => addUpdatedAt(d, 'createdAt') // v2→v3: +updatedAt
					}
				},
				kds_history: {
					schema: kdsHistorySchema,
					migrationStrategies: {
						1: (d: any) => d, // v0→v1: nested required
						2: (d: any) => addUpdatedAt(d, 'bumpedAt') // v1→v2: +updatedAt
					}
				},
				x_reads: {
					schema: xReadSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d, 'timestamp') // v0→v1: +updatedAt
					}
				},
				audit_logs: {
					schema: auditLogSchema
				},
				kitchen_alerts: {
					schema: kitchenAlertSchema
				}
			});

			// Try to dynamically import the seeder and run it only in uninitialized environments
			const seedModule = await import('./seed');
			await seedModule.seedDatabaseIfNeeded(db as any);

			return db;
		} catch (err: any) {
			console.error('[RxDB] Fatal initialization error:', err);
			globalForRxDB.__wtfposDbPromise = null;

			// Auto-recovery for critical schema mismatch or corrupted storage
			// DM4: Migration error, DB9: Database creation failed, SC1/SC34: Schema validation failed
			if (err?.code === 'DM4' || err?.code === 'DB9' || err?.code === 'SC1' || err?.code === 'SC34' ||
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
