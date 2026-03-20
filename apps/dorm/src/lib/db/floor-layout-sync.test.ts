/**
 * Unit tests for floor_layout_items sync lifecycle.
 *
 * Covers:
 * - Optimistic upsert with temp (negative) IDs
 * - Optimistic soft-delete
 * - Rollback on server failure
 * - Temp-ID cleanup: only removes temps with matching real records
 * - Temp-ID cleanup: keeps unsynced temps when no real counterpart
 * - Lazy collection startup re-sync
 * - Pruning includes floor_layout_items
 * - bgResync triggers cleanup after resync
 * - Wall integrity: snapshot → resync → restore lost walls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Shared mock state ──────────────────────────────────────────────────────

const mockSyncStatus = {
	setPhase: vi.fn(),
	addLog: vi.fn(),
	setNeonHealthDirect: vi.fn(),
	recordHealthCheck: vi.fn(),
	markSyncing: vi.fn(),
	markSynced: vi.fn(),
	markError: vi.fn(),
	markPulled: vi.fn(),
	recordPull: vi.fn(),
	recordPush: vi.fn(),
	updateCollection: vi.fn(),
	setPaused: vi.fn(),
	markMutationResolved: vi.fn(),
	phase: 'idle' as string,
	collections: [] as { name: string; status: string }[],
	neonCounts: null as Record<string, number> | null,
	pulledDocs: {} as Record<string, number>
};

const mockMutationQueue = {
	pause: vi.fn(),
	resume: vi.fn(),
	enqueue: vi.fn(),
	items: [] as any[],
	pending: 0
};

// Track what getDb returns — tests swap this before importing modules
let mockDb: Record<string, any> = {};

vi.mock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
vi.mock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
vi.mock('$lib/db', () => ({
	getDb: vi.fn(() => Promise.resolve(mockDb))
}));

// Mock RxDB replication
vi.mock('rxdb/plugins/replication', () => ({
	replicateRxCollection: vi.fn(() => ({
		active$: { subscribe: vi.fn(), pipe: vi.fn() },
		error$: { subscribe: vi.fn() },
		cancel: vi.fn(),
		reSync: vi.fn(),
		awaitInSync: vi.fn(() => Promise.resolve())
	}))
}));

// Mock rxjs operators
vi.mock('rxjs', () => ({
	firstValueFrom: vi.fn(() => Promise.resolve()),
	filter: vi.fn((fn: any) => fn),
	skip: vi.fn(() => (source: any) => source)
}));

// ─── Fake localStorage ──────────────────────────────────────────────────────

const storage = new Map<string, string>();
const fakeLocalStorage = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => storage.set(key, value),
	removeItem: (key: string) => storage.delete(key),
	clear: () => storage.clear()
};

// ─── Helper: create a mock RxDB collection ──────────────────────────────────

function createMockCollection(docs: Record<string, any>[] = []) {
	const store = new Map<string, Record<string, any>>();
	for (const doc of docs) {
		store.set(String(doc.id), { ...doc });
	}

	const collection: any = {
		find: vi.fn((query?: any) => ({
			exec: vi.fn(() => {
				let results = Array.from(store.values());
				if (query?.selector) {
					const sel = query.selector;
					if (sel.deleted_at?.$eq === null) {
						results = results.filter((d) => d.deleted_at === null || d.deleted_at === undefined);
					}
					if (sel.deleted_at?.$ne !== undefined) {
						results = results.filter((d) => d.deleted_at !== null && d.deleted_at !== undefined);
					}
					if (sel.item_type) {
						results = results.filter((d) => d.item_type === sel.item_type);
					}
				}
				// Return doc-like objects with toJSON
				return Promise.resolve(
					results.map((d) => ({
						...d,
						toJSON: (withMeta?: boolean) => ({ ...d }),
						incrementalPatch: vi.fn((patch: any) => {
							const existing = store.get(String(d.id));
							if (existing) Object.assign(existing, patch);
							return Promise.resolve();
						})
					}))
				);
			})
		})),
		findOne: vi.fn((id: string) => ({
			exec: vi.fn(() => {
				const doc = store.get(id);
				if (!doc) return Promise.resolve(null);
				return Promise.resolve({
					...doc,
					toJSON: (withMeta?: boolean) => ({ ...doc }),
					created_at: doc.created_at,
					incrementalPatch: vi.fn((patch: any) => {
						Object.assign(doc, patch);
						return Promise.resolve();
					}),
					remove: vi.fn(() => {
						store.delete(id);
						return Promise.resolve();
					})
				});
			})
		})),
		upsert: vi.fn((doc: any) => {
			store.set(String(doc.id), { ...doc });
			return Promise.resolve();
		}),
		bulkRemove: vi.fn((ids: string[]) => {
			for (const id of ids) store.delete(id);
			return Promise.resolve();
		}),
		cleanup: vi.fn(() => Promise.resolve()),
		// Expose internal store for assertions
		_store: store
	};

	return collection;
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
	storage.clear();
	vi.clearAllMocks();
	vi.stubGlobal('localStorage', fakeLocalStorage);
	vi.stubGlobal('navigator', { onLine: true });
	vi.stubGlobal('fetch', vi.fn());
	(globalThis as any).__dorm_replications = new Map();
	(globalThis as any).__dorm_inFlightResyncs = new Map();
	mockSyncStatus.phase = 'idle';
	mockSyncStatus.collections = [];
	mockDb = {};
});

afterEach(() => {
	vi.unstubAllGlobals();
});

// ─── Tests: optimistic upsert ────────────────────────────────────────────────

describe('optimisticUpsertFloorLayoutItem', () => {
	it('should write a temp-ID item to RxDB with correct fields', async () => {
		const col = createMockCollection();
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		const { optimisticUpsertFloorLayoutItem } = await import('./optimistic-floor-layout');

		await optimisticUpsertFloorLayoutItem({
			id: -1000,
			floor_id: 5,
			item_type: 'WALL',
			grid_x: 3,
			grid_y: 4,
			grid_w: 1,
			grid_h: 1
		});

		// The doc should exist in the collection store
		expect(col._store.has('-1000')).toBe(true);
		const doc = col._store.get('-1000')!;
		expect(doc.floor_id).toBe('5');
		expect(doc.item_type).toBe('WALL');
		expect(doc.grid_x).toBe(3);
		expect(doc.grid_y).toBe(4);
		expect(doc.deleted_at).toBeNull();
	});

	it('should return a rollback function that soft-deletes the temp item', async () => {
		const col = createMockCollection();
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		const { optimisticUpsertFloorLayoutItem } = await import('./optimistic-floor-layout');

		const rollback = await optimisticUpsertFloorLayoutItem({
			id: -2000,
			floor_id: 5,
			item_type: 'ROOM',
			grid_x: 0,
			grid_y: 0,
			grid_w: 2,
			grid_h: 2
		});

		expect(rollback).not.toBeNull();
		expect(col._store.has('-2000')).toBe(true);

		// Execute rollback — should soft-delete since there's no prior snapshot
		await rollback!();

		const doc = col._store.get('-2000');
		expect(doc?.deleted_at).toBeTruthy();
	});

	it('should restore original snapshot on rollback for existing items', async () => {
		const originalDoc = {
			id: '42',
			floor_id: '5',
			item_type: 'ROOM',
			grid_x: 1,
			grid_y: 1,
			grid_w: 3,
			grid_h: 3,
			label: 'Room A',
			color: null,
			rental_unit_id: null,
			created_at: '2025-01-01T00:00:00Z',
			updated_at: '2025-01-01T00:00:00Z',
			deleted_at: null
		};
		const col = createMockCollection([originalDoc]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		const { optimisticUpsertFloorLayoutItem } = await import('./optimistic-floor-layout');

		const rollback = await optimisticUpsertFloorLayoutItem({
			id: 42,
			floor_id: 5,
			item_type: 'ROOM',
			grid_x: 1,
			grid_y: 1,
			grid_w: 4,  // changed size
			grid_h: 4
		});

		// Confirm the update happened
		expect(col._store.get('42')?.grid_w).toBe(4);

		// Rollback should restore original
		await rollback!();
		expect(col._store.get('42')?.grid_w).toBe(3);
	});
});

// ─── Tests: optimistic delete ────────────────────────────────────────────────

describe('optimisticDeleteFloorLayoutItem', () => {
	it('should soft-delete an existing item', async () => {
		const col = createMockCollection([
			{
				id: '100',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 0,
				grid_y: 0,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			}
		]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		const { optimisticDeleteFloorLayoutItem } = await import('./optimistic-floor-layout');

		await optimisticDeleteFloorLayoutItem(100);

		const doc = col._store.get('100');
		expect(doc?.deleted_at).toBeTruthy();
	});

	it('should skip invalid IDs without error', async () => {
		const col = createMockCollection();
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		const { optimisticDeleteFloorLayoutItem } = await import('./optimistic-floor-layout');

		// Should not throw for any of these
		await optimisticDeleteFloorLayoutItem('undefined');
		await optimisticDeleteFloorLayoutItem('null');
		await optimisticDeleteFloorLayoutItem('NaN');

		expect(mockSyncStatus.addLog).toHaveBeenCalledWith(
			expect.stringContaining('delete skipped'),
			'warn'
		);
	});
});

// ─── Tests: cleanupReplacedTempIds (via bgResync) ───────────────────────────

describe('cleanupReplacedTempIds', () => {
	it('should remove temp docs that have matching real records', async () => {
		// Temp wall at (3,4) + real wall at same position → temp should be removed
		const col = createMockCollection([
			{
				id: '-1000',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 3,
				grid_y: 4,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			},
			{
				id: '200',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 3,
				grid_y: 4,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			}
		]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		// cleanupReplacedTempIds is private — we test it through bgResync
		// but we can also test the logic directly by importing the module
		// and calling bgResync with a mock resyncCollection
		vi.doMock('$lib/db/replication', () => ({
			resyncCollection: vi.fn(() => Promise.resolve({ status: 'ok', synced: 1, skipped: 0 }))
		}));
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('$lib/db', () => ({ getDb: vi.fn(() => Promise.resolve(mockDb)) }));

		const { bgResync } = await import('./optimistic-utils');

		// Trigger bgResync and wait for debounce
		bgResync('floor_layout_items');
		await new Promise((r) => setTimeout(r, 600)); // wait past 500ms debounce

		// Temp doc should be removed (matching real record exists)
		expect(col._store.has('-1000')).toBe(false);
		// Real doc should remain
		expect(col._store.has('200')).toBe(true);
	});

	it('should keep temp docs when no matching real record exists', async () => {
		// Temp wall at (3,4) but NO real wall at that position → temp should survive
		const col = createMockCollection([
			{
				id: '-1000',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 3,
				grid_y: 4,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			},
			{
				id: '200',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 7,
				grid_y: 8,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			}
		]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		vi.doMock('$lib/db/replication', () => ({
			resyncCollection: vi.fn(() => Promise.resolve({ status: 'ok', synced: 1, skipped: 0 }))
		}));
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('$lib/db', () => ({ getDb: vi.fn(() => Promise.resolve(mockDb)) }));

		const { bgResync } = await import('./optimistic-utils');

		bgResync('floor_layout_items');
		await new Promise((r) => setTimeout(r, 600));

		// Temp doc should survive — no matching real record at (3,4)
		expect(col._store.has('-1000')).toBe(true);
		expect(col._store.has('200')).toBe(true);
	});

	it('should match by signature: same position but different type should NOT match', async () => {
		// Temp WALL at (3,4) + real ROOM at (3,4) → different types, temp survives
		const col = createMockCollection([
			{
				id: '-1000',
				floor_id: '5',
				item_type: 'WALL',
				grid_x: 3,
				grid_y: 4,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			},
			{
				id: '200',
				floor_id: '5',
				item_type: 'ROOM',
				grid_x: 3,
				grid_y: 4,
				grid_w: 1,
				grid_h: 1,
				deleted_at: null
			}
		]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		vi.doMock('$lib/db/replication', () => ({
			resyncCollection: vi.fn(() => Promise.resolve({ status: 'ok', synced: 1, skipped: 0 }))
		}));
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('$lib/db', () => ({ getDb: vi.fn(() => Promise.resolve(mockDb)) }));

		const { bgResync } = await import('./optimistic-utils');

		bgResync('floor_layout_items');
		await new Promise((r) => setTimeout(r, 600));

		// Both should survive — different item_type means different signature
		expect(col._store.has('-1000')).toBe(true);
		expect(col._store.has('200')).toBe(true);
	});
});

// ─── Tests: wall integrity (snapshot + restore) ─────────────────────────────

describe('wall integrity protection', () => {
	it('should restore walls that were lost during resync', async () => {
		// Start with 2 walls, then resync "loses" one (simulated by removing from store)
		const wallDoc = {
			id: '-500',
			floor_id: '5',
			item_type: 'WALL',
			grid_x: 1,
			grid_y: 2,
			grid_w: 1,
			grid_h: 1,
			label: null,
			color: null,
			deleted_at: null,
			created_at: '2025-01-01T00:00:00Z',
			updated_at: '2025-01-01T00:00:00Z'
		};

		const col = createMockCollection([wallDoc]);
		mockDb = { floor_layout_items: col };

		vi.resetModules();
		// Resync mock that removes the wall (simulates pull overwrite)
		vi.doMock('$lib/db/replication', () => ({
			resyncCollection: vi.fn(async () => {
				col._store.delete('-500');
				return { status: 'ok', synced: 1, skipped: 0 };
			})
		}));
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('$lib/db', () => ({ getDb: vi.fn(() => Promise.resolve(mockDb)) }));

		const { bgResync } = await import('./optimistic-utils');

		bgResync('floor_layout_items');
		await new Promise((r) => setTimeout(r, 600));

		// WallGuard should have restored the lost wall
		expect(col._store.has('-500')).toBe(true);
	});
});

// ─── Tests: lazy collection re-sync on startup ──────────────────────────────

describe('startSync — lazy collection re-sync', () => {
	it('should call reSync() on previously-started lazy collections when server changed', async () => {
		vi.resetModules();
		// Clear any doMock for $lib/db/replication from bgResync tests
		vi.doUnmock('$lib/db/replication');

		const mockReSync = vi.fn();
		const mockRepl = {
			active$: { subscribe: vi.fn(), pipe: vi.fn() },
			error$: { subscribe: vi.fn() },
			cancel: vi.fn(),
			reSync: mockReSync,
			awaitInSync: vi.fn(() => Promise.resolve())
		};

		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('rxdb/plugins/replication', () => ({
			replicateRxCollection: vi.fn(() => ({
				active$: { subscribe: vi.fn(), pipe: vi.fn() },
				error$: { subscribe: vi.fn() },
				cancel: vi.fn(),
				reSync: vi.fn(),
				awaitInSync: vi.fn(() => Promise.resolve())
			}))
		}));
		vi.doMock('rxjs', () => ({
			firstValueFrom: vi.fn(() => Promise.resolve()),
			filter: vi.fn((fn: any) => fn),
			skip: vi.fn(() => (source: any) => source)
		}));

		// Pre-populate replications map with a lazy collection
		const replMap = new Map();
		replMap.set('floor_layout_items', mockRepl);
		(globalThis as any).__dorm_replications = replMap;

		// Set up: server changed (different timestamp than cached)
		storage.set('__dorm_last_server_ts', '2025-01-01T00:00:00Z');

		const fetchMock = vi.fn()
			// Health check returns newer timestamp
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ maxUpdatedAt: '2025-01-15T00:00:00Z' })
			});
		vi.stubGlobal('fetch', fetchMock);

		const { startSync } = await import('./replication');

		const db = createFakeDb([
			'properties', 'floors', 'rental_units', 'tenants', 'leases',
			'lease_tenants', 'meters', 'readings', 'billings', 'payments',
			'payment_allocations', 'expenses', 'budgets', 'penalty_configs', 'floor_layout_items'
		]);
		await startSync(db as any);

		// floor_layout_items was in the replications map → reSync should be called
		expect(mockReSync).toHaveBeenCalled();
		expect(mockSyncStatus.markSyncing).toHaveBeenCalledWith('floor_layout_items');
	});

	it('should NOT call reSync() on lazy collections not yet accessed', async () => {
		vi.resetModules();
		vi.doUnmock('$lib/db/replication');

		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('rxdb/plugins/replication', () => ({
			replicateRxCollection: vi.fn(() => ({
				active$: { subscribe: vi.fn(), pipe: vi.fn() },
				error$: { subscribe: vi.fn() },
				cancel: vi.fn(),
				reSync: vi.fn(),
				awaitInSync: vi.fn(() => Promise.resolve())
			}))
		}));
		vi.doMock('rxjs', () => ({
			firstValueFrom: vi.fn(() => Promise.resolve()),
			filter: vi.fn((fn: any) => fn),
			skip: vi.fn(() => (source: any) => source)
		}));

		// Empty replications map — no lazy collections accessed yet
		(globalThis as any).__dorm_replications = new Map();

		storage.set('__dorm_last_server_ts', '2025-01-01T00:00:00Z');

		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ maxUpdatedAt: '2025-01-15T00:00:00Z' })
		});
		vi.stubGlobal('fetch', fetchMock);

		const { startSync } = await import('./replication');

		const db = createFakeDb([
			'properties', 'floors', 'rental_units', 'tenants', 'leases',
			'lease_tenants', 'meters', 'readings', 'billings', 'payments',
			'payment_allocations', 'expenses', 'budgets', 'penalty_configs', 'floor_layout_items'
		]);
		await startSync(db as any);

		// markSyncing should NOT have been called for floor_layout_items
		// (it IS called for eager collections, so check specifically for lazy ones)
		const lazyMarkSyncingCalls = mockSyncStatus.markSyncing.mock.calls
			.filter((c: any[]) => c[0] === 'floor_layout_items');
		expect(lazyMarkSyncingCalls.length).toBe(0);
	});
});

// ─── Tests: pruning includes floor_layout_items ─────────────────────────────

describe('pruning — floor_layout_items soft-delete sweep', () => {
	it('should prune soft-deleted floor_layout_items older than 90 days', async () => {
		vi.resetModules();

		const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
		const softDeletedItem = {
			id: '999',
			deleted_at: ninetyOneDaysAgo.toISOString(),
			item_type: 'WALL'
		};

		const mockBulkRemove = vi.fn(() => Promise.resolve());
		const mockCleanup = vi.fn(() => Promise.resolve());

		// Build a full mock db with floor_layout_items having soft-deleted docs
		const dbCollections: Record<string, any> = {};
		const allCollections = [
			'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
			'floors', 'meters', 'readings', 'billings', 'payments',
			'payment_allocations', 'expenses', 'budgets', 'penalty_configs', 'floor_layout_items'
		];
		for (const name of allCollections) {
			dbCollections[name] = {
				find: vi.fn((query: any) => ({
					exec: vi.fn(() => {
						// Only floor_layout_items has soft-deleted docs for this test
						if (name === 'floor_layout_items' && query?.selector?.deleted_at?.$ne !== undefined) {
							return Promise.resolve([softDeletedItem]);
						}
						return Promise.resolve([]);
					})
				})),
				bulkRemove: mockBulkRemove,
				cleanup: mockCleanup
			};
		}

		vi.doMock('$lib/db', () => ({
			getDb: vi.fn(() => Promise.resolve(dbCollections))
		}));

		const { pruneOldRecords } = await import('./pruning');
		const results = await pruneOldRecords();

		// Should have a result for floor_layout_items:soft_deleted
		const floorLayoutResult = results.find(
			(r) => r.collection === 'floor_layout_items:soft_deleted'
		);
		expect(floorLayoutResult).toBeDefined();
		expect(floorLayoutResult!.pruned).toBe(1);
		expect(mockBulkRemove).toHaveBeenCalledWith(['999']);
	});
});

// ─── Tests: bgResync skips cleanup for non-floor-layout collections ─────────

describe('bgResync — collection-specific behavior', () => {
	it('should NOT run temp cleanup for non-floor-layout collections', async () => {
		const col = createMockCollection([
			{ id: '-1', name: 'Test', deleted_at: null }
		]);
		mockDb = { tenants: col };

		vi.resetModules();
		vi.doMock('$lib/db/replication', () => ({
			resyncCollection: vi.fn(() => Promise.resolve({ status: 'ok', synced: 1, skipped: 0 }))
		}));
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('$lib/db', () => ({ getDb: vi.fn(() => Promise.resolve(mockDb)) }));

		const { bgResync } = await import('./optimistic-utils');

		bgResync('tenants');
		await new Promise((r) => setTimeout(r, 600));

		// The temp doc should still exist — cleanup only runs for floor_layout_items
		expect(col._store.has('-1')).toBe(true);
	});
});

// ─── Helper for replication tests ────────────────────────────────────────────

function createFakeDb(collections: string[]) {
	const db: Record<string, any> = {};
	for (const name of collections) {
		db[name] = {
			find: vi.fn(() => ({
				exec: vi.fn(() => Promise.resolve([]))
			})),
			findOne: vi.fn(() => ({
				exec: vi.fn(() => Promise.resolve(null))
			})),
			upsert: vi.fn(() => Promise.resolve()),
			bulkRemove: vi.fn(() => Promise.resolve()),
			cleanup: vi.fn(() => Promise.resolve())
		};
	}
	return db;
}
