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
	stockEventSchema,
	deductionSchema,
	expenseSchema,
	stockCountSchema,
	deviceSchema,
	kdsTicketSchema,
	readingSchema,
	auditLogSchema,
	kitchenAlertSchema,
	floorElementSchema,
	shiftsSchema
} from './schemas';
import { LEGACY_CATEGORY_MAP } from '$lib/stores/expenses.utils';

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
						2: (d: any) => addUpdatedAt(d, 'sessionStartedAt'), // v1→v2: +updatedAt
						3: (d: any) => ({  // v2→v3: +style fields
							...d,
							color: d.color ?? null,
							opacity: d.opacity ?? null,
							borderRadius: d.borderRadius ?? null,
							rotation: d.rotation ?? null,
							chairConfig: d.chairConfig ?? null
						})
					}
				},
				orders: {
					schema: orderSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => d, // v2→v3: nested required
						4: (d: any) => addUpdatedAt(d, 'createdAt'), // v3→v4: +updatedAt
						5: (d: any) => d,  // v4→v5: nullable string fields (schema-only fix)
						6: (d: any) => d,  // v5→v6: printStatus string → string|null (schema-only fix)
						7: (d: any) => {   // v6→v7: backfill addedAt on existing items
							if (d.items) {
								d.items = d.items.map((item: any) => ({
									...item,
									addedAt: item.addedAt ?? d.createdAt ?? new Date().toISOString()
								}));
							}
							return d;
						},
						8: (d: any) => ({ // v7→v8: +childPax, +freePax, +childUnitPrice on items
							...d,
							childPax: d.childPax ?? 0,
							freePax: d.freePax ?? 0,
							items: d.items ? d.items.map((item: any) => ({ ...item, childUnitPrice: item.childUnitPrice ?? null })) : d.items
						}),
						9: (d: any) => ({ ...d, discountIdPhotos: d.discountIdPhotos ?? [] }), // v8→v9: +discountIdPhotos for BIR audit trail
						10: (d: any) => ({ ...d, discountEntries: d.discountEntries ?? null }), // v9→v10: +discountEntries for multi-discount stacking
						11: (d: any) => ({ ...d, scCount: d.scCount ?? 0, pwdCount: d.pwdCount ?? 0 }), // v10→v11: +scCount, +pwdCount (SC/PWD headcount from PaxModal)
						12: (d: any) => { // v11→v12: migrate discountEntries from old field names to canonical pax/ids/idPhotos
							if (d.discountEntries) {
								const migrated: Record<string, any> = {};
								for (const [type, entry] of Object.entries(d.discountEntries as Record<string, any>)) {
									if (entry && typeof entry === 'object') {
										migrated[type] = {
											pax:      entry.pax      ?? entry.discountPax ?? 1,
											ids:      entry.ids      ?? entry.discountIds ?? [],
											idPhotos: entry.idPhotos ?? (entry.discountIdPhotos ?? []).map((p: string) => p ? [p] : [])
										};
									}
								}
								d.discountEntries = migrated;
							}
							return d;
						}
					}
				},
				menu_items: {
					schema: menuItemSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d), // v0→v1: +updatedAt
						2: (d: any) => d,               // v1→v2: +scaledAutoSides (optional, passthrough)
						3: (d: any) => d                // v2→v3: +childPrice (optional, passthrough)
					}
				},
				stock_items: {
					schema: stockItemSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d), // v1→v2: +updatedAt
						3: (d: any) => {
							const colors: Record<string, string> = { Meats: 'DC2626', Sides: '10B981', Dishes: 'F59E0B', Drinks: '3B82F6' };
							const bg = colors[d.category] || '6B7280';
							const label = (d.name || '').replace(/\s*\(.*?\)\s*/g, '').trim().substring(0, 18);
							const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#${bg}"/><text x="100" y="108" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
							d.image = `data:image/svg+xml,${encodeURIComponent(svg)}`;
							return d;
						} // v2→v3: +image
					}
				},
				deliveries: {
					schema: deliverySchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => { d.depleted = d.depleted ?? false; return d; },
						3: (d: any) => addUpdatedAt(d, 'receivedAt'), // v2→v3: +updatedAt
						4: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }), // v3→v4: +locationId (defaults to primary branch)
						5: (d: any) => ({ ...d, unitCost: d.unitCost ?? null }) // v4→v5: +unitCost (optional procurement cost)
					}
				},
				stock_events: {
					schema: stockEventSchema,
					migrationStrategies: {
						1: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }) // v0→v1: +locationId (defaults to primary branch)
					}
				},
				deductions: {
					schema: deductionSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d, 'timestamp'), // v1→v2: +updatedAt
					3: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }) // v2→v3: +locationId (defaults to primary branch)
					}
				},
				expenses: {
					schema: expenseSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'createdAt'), // v2→v3: +updatedAt
						4: (d: any) => ({ ...d, expenseDate: d.expenseDate ?? null }), // v3→v4: +expenseDate
						5: (d: any) => d, // v4→v5: schema fix for DB6
						6: (d: any) => { // v5→v6: category simplification — map legacy categories to new names
							if (d.category && LEGACY_CATEGORY_MAP[d.category]) {
								d.category = LEGACY_CATEGORY_MAP[d.category];
							}
							return d;
						},
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
						3: (d: any) => addUpdatedAt(d, 'createdAt'), // v2→v3: +updatedAt
						4: (d: any) => ({ ...d, bumpedAt: null, bumpedBy: null }), // v3→v4: merged kds_history
						5: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }), // v4→v5: +locationId
						6: (d: any) => d  // v5→v6: locationId maxLength fix (schema-only)
					}
				},
				readings: {
					schema: readingSchema,
					migrationStrategies: {
						1: (d: any) => ({ ...d, maya: 0, voidAmount: null }) // v0→v1: +maya payment method, +voidAmount
					}
				},
				audit_logs: {
					schema: auditLogSchema
				},
				kitchen_alerts: {
					schema: kitchenAlertSchema
				},
				floor_elements: {
					schema: floorElementSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => ({ ...d, gridSize: null }) // v1→v2: merged floor_canvas
					}
				},
				shifts: {
					schema: shiftsSchema
					// v0 — new collection, no migrations needed
				},
			});

			// Try to dynamically import the seeder and run it only in uninitialized environments
			const seedModule = await import('./seed');
			await seedModule.seedDatabaseIfNeeded(db as any);

			return db;
		} catch (err: any) {
			console.error('[RxDB] Fatal initialization error:', err);
			globalForRxDB.__wtfposDbPromise = null;

			// Auto-recovery for critical schema mismatch or corrupted storage
			// COL12: Migration strategy mismatch, DM4: Migration error, DB9: Database creation failed, SC1/SC34: Schema validation failed
			if (err?.code === 'COL12' || err?.code === 'DM4' || err?.code === 'DB9' || err?.code === 'SC1' || err?.code === 'SC34' ||
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
