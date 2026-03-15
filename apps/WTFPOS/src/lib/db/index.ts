import { createRxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
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
addRxPlugin(RxDBLeaderElectionPlugin);

// Add dev mode plugin only in development to catch errors and allow ignoreDuplicate for HMR
if (dev) {
	addRxPlugin(RxDBDevModePlugin);
}

// AJV validator instead of is-my-json-valid: the latter uses naive modulo for
// multipleOf checks, which fails for large timestamps due to IEEE 754 precision
// (e.g. 1773409342808 % 0.01 !== 0 in JavaScript). AJV handles this correctly.
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

const globalForRxDB = globalThis as unknown as {
	__wtfposDbPromise: Promise<any> | null;
};

let dbPromise: Promise<any> | null = globalForRxDB.__wtfposDbPromise || null;

/** Null out the cached DB promise so getDb() creates a fresh instance on next call. */
export function clearDbPromise() {
	globalForRxDB.__wtfposDbPromise = null;
	dbPromise = null;
}

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

// Remote log helper — posts to server console for devices without dev tools
function _dbLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
	if (typeof window === 'undefined') return;
	fetch('/api/replication/client-log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ level, message, data }),
		keepalive: true,
	}).catch(() => {});
}

export async function getDb() {
	// ── URL escape hatch: ?reset-db=1 ────────────────────────────────────
	// Navigate to http://<server-ip>:5173/?reset-db=1 on any device to
	// force-clear IndexedDB + all sync state. Useful when the app is frozen
	// (e.g. COL12 loop) and you can't tap any buttons.
	// Runs BEFORE the existing-promise check so it works even when getDb() is stuck.
	const _resetGuard = (window as any).__wtfposResetInProgress;
	if (typeof window !== 'undefined' && !_resetGuard && new URLSearchParams(window.location.search).has('reset-db')) {
		(window as any).__wtfposResetInProgress = true;
		// Fire remote log FIRST so it always appears in the server console
		const hostname = window.location.hostname;
		const isServer = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
		const deviceLabel = isServer ? 'Server (Mac)' : `LAN client (${hostname})`;
		_dbLog('error', `🧹 RESET-DB triggered by ${deviceLabel} — clearing state`);
		// Small delay to let the fetch fire before we start deleting
		await new Promise(r => setTimeout(r, 200));

		globalForRxDB.__wtfposDbPromise = null;
		try { sessionStorage.clear(); } catch { /* noop */ }
		try { localStorage.removeItem('wtfpos-sync-gen'); } catch { /* noop */ }
		try { localStorage.removeItem('wtfpos-sync-epoch'); } catch { /* noop */ }
		// Only delete IndexedDB on server/localhost — thin clients use memory storage
		if (isServer) {
			await new Promise<void>((resolve) => {
				const req = window.indexedDB.deleteDatabase('wtfpos_db');
				req.onsuccess = () => { _dbLog('info', '🧹 RESET-DB: IndexedDB deleted successfully'); resolve(); };
				req.onerror = () => { _dbLog('warn', '🧹 RESET-DB: IndexedDB delete error'); resolve(); };
				req.onblocked = () => { _dbLog('warn', '🧹 RESET-DB: IndexedDB delete blocked (open connections)'); resolve(); };
				setTimeout(resolve, 3000);
			});
		}
		_dbLog('info', '🧹 RESET-DB complete — redirecting to clean URL');
		await new Promise(r => setTimeout(r, 200));
		// Redirect to clean URL (no ?reset-db) to prevent re-triggering
		window.location.replace(window.location.origin + window.location.pathname);
		await new Promise(() => {}); // block — redirect is happening
	}

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
			// ── Detect thin client FIRST — this determines storage engine ─────
			const isRemoteClient = typeof window !== 'undefined'
				&& window.location.hostname !== 'localhost'
				&& window.location.hostname !== '127.0.0.1';

			// Thin clients use in-memory storage (no IndexedDB = no Safari bugs = instant init).
			// Server uses Dexie (IndexedDB) as the persistent canonical store.
			let storage: any = isRemoteClient
				? getRxStorageMemory()
				: getRxStorageDexie();

			if (dev) {
				storage = wrappedValidateAjvStorage({ storage });
			}

			// crypto.subtle is unavailable on non-HTTPS non-localhost (e.g. phone on LAN via IP).
			// Provide a JS fallback hash so RxDB doesn't throw UT8.
			async function fallbackHash(input: string): Promise<string> {
				if (typeof crypto !== 'undefined' && crypto.subtle) {
					const data = new TextEncoder().encode(input);
					const buf = await crypto.subtle.digest('SHA-256', data);
					return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
				}
				// Simple djb2-based hash — not cryptographic, but RxDB only needs it for internal dedup
				let h = 5381;
				for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
				return h.toString(16).padStart(8, '0');
			}

			_dbLog('info', `getDb() creating RxDatabase... (${isRemoteClient ? 'MEMORY storage' : 'Dexie/IDB storage'})`);

			const db = await createRxDatabase({
				name: 'wtfpos_db',
				storage,
				multiInstance: !isRemoteClient, // Thin clients: single tab, skip BroadcastChannel overhead
				eventReduce: true,              // Query optimization
				ignoreDuplicate: true,          // Vital for HMR/Development
				closeDuplicates: true,          // Recommended for HMR
				hashFunction: fallbackHash      // Avoids UT8 on insecure LAN contexts
			});

			_dbLog('info', 'getDb() RxDatabase created, adding collections...', { existingCollections: Object.keys(db.collections).length, isRemoteClient });

			// Check if collections already exist (prevents COL23)
			if (Object.keys(db.collections).length > 0) {
				console.log('[RxDB] Collections already exist, skipping addCollections');
				return db;
			}

			// ── Collection definitions ───────────────────────────────────────
			// Split into PRIORITY (needed by thin clients) and SECONDARY (server/admin only).
			// Thin clients (iPads on LAN) only create the 6 priority collections —
			// this cuts IndexedDB work by ~66% and avoids Mobile Safari timeouts.

			const PRIORITY_COLLECTION_DEFS = {
				tables: {
					schema: tableSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d, 'sessionStartedAt'),
						3: (d: any) => ({
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
						3: (d: any) => d,
						4: (d: any) => addUpdatedAt(d, 'createdAt'),
						5: (d: any) => d,
						6: (d: any) => d,
						7: (d: any) => {
							if (d.items) {
								d.items = d.items.map((item: any) => ({
									...item,
									addedAt: item.addedAt ?? d.createdAt ?? new Date().toISOString()
								}));
							}
							return d;
						},
						8: (d: any) => ({
							...d,
							childPax: d.childPax ?? 0,
							freePax: d.freePax ?? 0,
							items: d.items ? d.items.map((item: any) => ({ ...item, childUnitPrice: item.childUnitPrice ?? null })) : d.items
						}),
						9: (d: any) => ({ ...d, discountIdPhotos: d.discountIdPhotos ?? [] }),
						10: (d: any) => ({ ...d, discountEntries: d.discountEntries ?? null }),
						11: (d: any) => ({ ...d, scCount: d.scCount ?? 0, pwdCount: d.pwdCount ?? 0 }),
						12: (d: any) => {
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
						},
						// v13: added cancelReason/cancelledAt/acknowledgedBy/acknowledgedAt to items — no backfill needed
						13: (d: any) => d,
						// v14: added names[] and tins[] to discountEntries for BIR SC/PWD compliance (RR 7-2010 / RR 5-2017)
						14: (d: any) => {
							if (d.discountEntries) {
								for (const entry of Object.values(d.discountEntries as Record<string, any>)) {
									if (entry && typeof entry === 'object') {
										entry.names = entry.names ?? Array.from({ length: entry.pax ?? 1 }, () => '');
										entry.tins = entry.tins ?? Array.from({ length: entry.pax ?? 1 }, () => '');
									}
								}
							}
							return d;
						}
					}
				},
				menu_items: {
					schema: menuItemSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d),
						2: (d: any) => d,
						3: (d: any) => d
					}
				},
				kds_tickets: {
					schema: kdsTicketSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'createdAt'),
						4: (d: any) => ({ ...d, bumpedAt: null, bumpedBy: null }),
						5: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }),
						6: (d: any) => d
					}
				},
				devices: {
					schema: deviceSchema,
					migrationStrategies: {
						1: (d: any) => addUpdatedAt(d, 'lastSeenAt'),
						2: (d: any) => ({ ...d, dbLastUpdated: '', dbDocCount: 0 }),
						3: (d: any) => ({ ...d, isServer: false }),
						4: (d: any) => ({ ...d, ipAddress: '' }),
						5: (d: any) => ({ ...d, dataMode: 'full-rxdb' }),
						6: (d: any) => ({ ...d, isScreenActive: true })
					}
				},
				floor_elements: {
					schema: floorElementSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => ({ ...d, gridSize: null })
					}
				},
			};

			const SECONDARY_COLLECTION_DEFS = {
				stock_items: {
					schema: stockItemSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d),
						3: (d: any) => {
							const colors: Record<string, string> = { Meats: 'DC2626', Sides: '10B981', Dishes: 'F59E0B', Drinks: '3B82F6' };
							const bg = colors[d.category] || '6B7280';
							const label = (d.name || '').replace(/\s*\(.*?\)\s*/g, '').trim().substring(0, 18);
							const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#${bg}"/><text x="100" y="108" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
							d.image = `data:image/svg+xml,${encodeURIComponent(svg)}`;
							return d;
						}
					}
				},
				deliveries: {
					schema: deliverySchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => { d.depleted = d.depleted ?? false; return d; },
						3: (d: any) => addUpdatedAt(d, 'receivedAt'),
						4: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' }),
						5: (d: any) => ({ ...d, unitCost: d.unitCost ?? null })
					}
				},
				stock_events: {
					schema: stockEventSchema,
					migrationStrategies: {
						1: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' })
					}
				},
				deductions: {
					schema: deductionSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => addUpdatedAt(d, 'timestamp'),
						3: (d: any) => ({ ...d, locationId: d.locationId ?? 'tag' })
					}
				},
				expenses: {
					schema: expenseSchema,
					migrationStrategies: {
						1: (d: any) => d,
						2: (d: any) => d,
						3: (d: any) => addUpdatedAt(d, 'createdAt'),
						4: (d: any) => ({ ...d, expenseDate: d.expenseDate ?? null }),
						5: (d: any) => d,
						6: (d: any) => {
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
						2: (d: any) => addUpdatedAt(d),
						3: (d: any) => ({ ...d, locationId: '', date: null }),
						// Migration: stock_counts v3 → v4
						// Changes primary key from stockItemId to unique id
						// Generates a deterministic id from stockItemId + locationId + date
						4: (d: any) => {
							d.id = `${d.stockItemId}-${d.locationId || 'noloc'}-${d.date || 'nodate'}`;
							return d;
						},
						// Migration: stock_counts v4 → v5
						// Makes date required (non-nullable) — backfills null dates
						5: (d: any) => {
							if (!d.date) {
								d.date = new Date().toISOString().slice(0, 10);
								// Re-derive id to match the now-populated date
								d.id = `${d.stockItemId}-${d.locationId || 'noloc'}-${d.date}`;
							}
							return d;
						}
					}
				},
				readings: {
					schema: readingSchema,
					migrationStrategies: {
						1: (d: any) => ({ ...d, maya: 0, voidAmount: null })
					}
				},
				audit_logs: {
					schema: auditLogSchema,
					migrationStrategies: {
						1: (d: any) => {
							const branchMap: Record<string, string> = {
								'TAG': 'tag', 'PGL': 'pgl', 'WH-TAG': 'wh-tag', 'ALL': 'all'
							};
							d.locationId = branchMap[d.branch] ?? d.branch?.toLowerCase() ?? 'tag';
							return d;
						}
					}
				},
				shifts: {
					schema: shiftsSchema
				},
			};

			// Thin clients: only create priority collections (6 vs 18 = ~66% faster)
			const collectionDefs = isRemoteClient
				? PRIORITY_COLLECTION_DEFS
				: { ...PRIORITY_COLLECTION_DEFS, ...SECONDARY_COLLECTION_DEFS };

			const collectionCount = Object.keys(collectionDefs).length;

			// Add our collections using the defined schemas.
			// Wrap in a timeout — on mobile Safari, stale IndexedDB migrations can hang forever.
			// If it takes >20s, nuke IndexedDB and reload for a clean start.
			const addCollectionsPromise = db.addCollections(collectionDefs);

			// Mobile Safari can take 15-25s to create 17 collections with indexes even
			// on a clean database. Thin clients only create 6, so they should be much faster.
			// Track attempts to avoid infinite loops.
			// Reset attempt counter if the code version changed (deploy with fixes)
			const DB_INIT_VERSION = '2'; // bump when changing init logic to reset stuck clients
			if (sessionStorage.getItem('wtfpos_db_init_ver') !== DB_INIT_VERSION) {
				sessionStorage.removeItem('wtfpos_db_attempt');
				sessionStorage.setItem('wtfpos_db_init_ver', DB_INIT_VERSION);
			}
			const attempt = parseInt(sessionStorage.getItem('wtfpos_db_attempt') || '0', 10);
			const MIGRATION_TIMEOUT_MS = isRemoteClient
				? (attempt === 0 ? 5_000 : 10_000)   // thin client: memory storage is instant (5s/10s)
				: (attempt === 0 ? 45_000 : 90_000); // server: 45s first, 90s retry
			_dbLog('info', `addCollections() starting — ${collectionCount} collections (attempt ${attempt + 1}, timeout ${MIGRATION_TIMEOUT_MS / 1000}s, ${isRemoteClient ? 'THIN CLIENT' : 'SERVER'})`);

			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('addCollections() timed out')), MIGRATION_TIMEOUT_MS)
			);

			try {
				await Promise.race([addCollectionsPromise, timeoutPromise]);
				_dbLog('info', 'getDb() addCollections() complete', { collections: Object.keys(db.collections).length });
				// Success — clear attempt counter
				try { sessionStorage.removeItem('wtfpos_db_attempt'); } catch { /* noop */ }
			} catch (migrationErr: any) {
				_dbLog('error', 'getDb() addCollections() failed or timed out', {
					error: migrationErr?.message ?? String(migrationErr),
					attempt: attempt + 1,
				});

				if (typeof window !== 'undefined' && attempt < 3) {
					// Track attempt count to prevent infinite reload loops
					try { sessionStorage.setItem('wtfpos_db_attempt', String(attempt + 1)); } catch { /* noop */ }
					// Clear sync state
					try { localStorage.removeItem('wtfpos-sync-gen'); } catch { /* noop */ }
					try { localStorage.removeItem('wtfpos-sync-epoch'); } catch { /* noop */ }

					if (isRemoteClient) {
						// Memory storage — nothing to delete, just close and reload
						_dbLog('info', 'Memory storage timeout — closing and reloading');
						try { await db.close(); } catch { /* noop */ }
					} else {
						// Dexie/IDB storage — must delete IndexedDB before reload
						// Clear the session clean flag so next reload re-deletes IDB
						try { sessionStorage.removeItem('wtfpos_db_clean'); } catch { /* noop */ }
						// CRITICAL: Close the RxDB connection FIRST — otherwise deleteDatabase
						// gets blocked by the open connection and never completes on Mobile Safari.
						try {
							_dbLog('info', `Closing RxDB connection before delete (attempt ${attempt + 1})`);
							await db.close();
						} catch {
							_dbLog('warn', 'db.close() failed — proceeding with raw IDB close');
							// Fallback: try to close the raw Dexie/IDB connections
							try {
								const idbDb = (db as any).internalStore?.internals?.dexieDb?.backendDB?.();
								if (idbDb && typeof idbDb.close === 'function') idbDb.close();
							} catch { /* best effort */ }
						}
						// Small delay to let the connection fully release
						await new Promise(r => setTimeout(r, 500));

						_dbLog('info', 'Deleting IndexedDB...');
						await new Promise<void>((resolve) => {
							const req = window.indexedDB.deleteDatabase('wtfpos_db');
							req.onsuccess = () => { _dbLog('info', 'IndexedDB deleted successfully'); resolve(); };
							req.onerror = () => { _dbLog('warn', 'IndexedDB delete error'); resolve(); };
							req.onblocked = () => {
								// onblocked means connections are still open — wait and retry
								_dbLog('warn', 'IndexedDB delete blocked — waiting 2s for connections to close');
								setTimeout(resolve, 2000);
							};
							setTimeout(resolve, 5000); // safety timeout
						});
					}
					_dbLog('info', 'Reloading page...');
					window.location.reload();
					// Block forever — reload is happening
					await new Promise(() => {});
				}
				throw migrationErr;
			}

			// Try to dynamically import the seeder and run it only in uninitialized environments
			const seedModule = await import('./seed');
			await seedModule.seedDatabaseIfNeeded(db as any);

			// Start LAN replication after DB is ready (gated by data mode)
			if (typeof window !== 'undefined') {
				const { isFullRxDbMode, isRxDbMode } = await import('../stores/data-mode.svelte');

				if (isRxDbMode()) {
					_dbLog('info', 'getDb() complete — importing replication module', { collections: Object.keys(db.collections).length, fullMode: isFullRxDbMode() });

					import('./replication').then(({ startReplication, SELECTIVE_COLLECTIONS }) => {
						if (isFullRxDbMode()) {
							startReplication(db as any);
						} else {
							// selective-rxdb: only replicate priority collections
							startReplication(db as any, { collections: [...SELECTIVE_COLLECTIONS] });
						}
					}).catch(err => {
						console.warn('[RxDB] Replication setup failed (non-fatal):', err);
						_dbLog('error', 'Replication module import or start failed', { error: err?.message ?? String(err) });
					});
				} else {
					_dbLog('info', 'getDb() complete — skipping replication (data mode does not require it)');
				}
			}

			return db;
		} catch (err: any) {
			console.error('[RxDB] Fatal initialization error:', err);
			globalForRxDB.__wtfposDbPromise = null;

			// Show error on screen so it's visible on phones without dev tools
			if (typeof document !== 'undefined') {
				const el = document.createElement('div');
				el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#991b1b;color:white;padding:16px;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:50vh;overflow:auto';
				el.textContent = `[RxDB Error] code=${err?.code ?? 'unknown'}\n${err?.message ?? err}\n\nStack: ${err?.stack ?? 'none'}`;
				const btn = document.createElement('button');
				btn.textContent = 'Clear DB & Reload';
				btn.style.cssText = 'margin-top:12px;padding:8px 16px;background:white;color:#991b1b;border:none;border-radius:6px;font-weight:bold;font-size:14px';
				btn.onclick = () => { window.indexedDB.deleteDatabase('wtfpos_db'); window.location.reload(); };
				el.appendChild(document.createElement('br'));
				el.appendChild(btn);
				document.body.appendChild(el);
			}

			// Auto-recovery for critical schema mismatch or corrupted storage
			// COL12: Migration strategy mismatch, DM4: Migration error, DB9: Database creation failed, SC1/SC34: Schema validation failed
			if (err?.code === 'COL12' || err?.code === 'DM4' || err?.code === 'DB9' || err?.code === 'SC1' || err?.code === 'SC34' || err?.code === 'UT8' ||
			    err?.message?.includes('closed') || err?.message?.includes('NotFound')) {
				console.warn('[RxDB] Unrecoverable database state detected. Initiating emergency reset...');
				if (typeof window !== 'undefined') {
					// Prevent infinite reload loop — only auto-reset once per session
					const resetKey = 'wtfpos_db_reset';
					if (sessionStorage.getItem(resetKey)) {
						console.error('[RxDB] Already attempted reset this session — stopping to prevent reload loop. Clear site data manually.');
					} else {
						sessionStorage.setItem(resetKey, Date.now().toString());
						// Clear all sync/session flags so the next load starts completely fresh
						try { sessionStorage.removeItem('wtfpos_db_clean'); } catch { /* noop */ }
						try { sessionStorage.removeItem('wtfpos_db_attempt'); } catch { /* noop */ }
						try { localStorage.removeItem('wtfpos-sync-gen'); } catch { /* noop */ }
						try { localStorage.removeItem('wtfpos-sync-epoch'); } catch { /* noop */ }
						// AWAIT the delete — fire-and-forget races the reload and the stale IDB survives
						await new Promise<void>((resolve) => {
							const req = window.indexedDB.deleteDatabase('wtfpos_db');
							req.onsuccess = () => resolve();
							req.onerror = () => resolve();
							req.onblocked = () => resolve();
							setTimeout(resolve, 3000);
						});
						window.location.reload();
					}
				}
			}
			throw err;
		}
	})();

	return globalForRxDB.__wtfposDbPromise;
}

/**
 * Wait for this tab to become the RxDB leader.
 * Only the leader should run background tasks (heartbeat, replication pushes)
 * to prevent duplicate work across multiple tabs.
 * Returns immediately if this tab is already leader.
 */
export async function waitForLeadership(): Promise<void> {
	const db = await getDb();
	await (db as any).waitForLeadership();
}

/**
 * Check if this tab is currently the RxDB leader (non-blocking).
 */
export async function isLeader(): Promise<boolean> {
	try {
		const db = await getDb();
		return !!(db as any).isLeader;
	} catch {
		return false;
	}
}

/**
 * Completely removes the RxDB database from IndexedDB and reloads the page.
 * This will trigger a fresh initialization and seed on the next load.
 */
export async function resetDatabase() {
	if (typeof window === 'undefined') return;

	const isRemoteClient = window.location.hostname !== 'localhost'
		&& window.location.hostname !== '127.0.0.1';

	try {
		if (dbPromise) {
			const db = await dbPromise;
			await db.remove();
			dbPromise = null;
		} else {
			// Use the correct storage engine for removeRxDatabase
			let storage: any = isRemoteClient ? getRxStorageMemory() : getRxStorageDexie();
			if (dev) {
				try { storage = wrappedValidateAjvStorage({ storage }); } catch { /* fallback */ }
			}
			await removeRxDatabase('wtfpos_db', storage);
		}
	} catch (err) {
		console.error('[RxDB] Failed to remove database gracefully, fallback to IndexedDB API', err);
		if (!isRemoteClient) {
			window.indexedDB.deleteDatabase('wtfpos_db');
		}
	}

	// For memory storage clients, also clear session state so fresh reload works cleanly
	if (isRemoteClient) {
		try { sessionStorage.clear(); } catch { /* noop */ }
	}

	window.location.reload();
}
