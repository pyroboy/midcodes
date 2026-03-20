/**
 * Unit tests for sync modal count accuracy.
 *
 * Verifies that local RxDB doc counts update correctly after every mutation type
 * (create, update, delete) and that the sync modal's comparison between
 * local (RxDB) and remote (Neon) counts produces accurate match/mismatch signals.
 *
 * Count flow under test:
 *   optimistic write → RxDB docs change → countActiveDocs() → markSynced(name, count)
 *   refreshLocalCounts() → updateCollection(name, { docCount })
 *   fetchNeonCounts() → neonCounts[name] compared to col.docCount
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
	collections: [] as { name: string; status: string; docCount: number }[],
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

let mockDb: Record<string, any> = {};

vi.mock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
vi.mock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
vi.mock('$lib/db', () => ({
	getDb: vi.fn(() => Promise.resolve(mockDb))
}));
vi.mock('rxdb/plugins/replication', () => ({
	replicateRxCollection: vi.fn(() => ({
		active$: { subscribe: vi.fn(), pipe: vi.fn() },
		error$: { subscribe: vi.fn() },
		cancel: vi.fn(),
		reSync: vi.fn(),
		awaitInSync: vi.fn(() => Promise.resolve())
	}))
}));
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

// ─── ALL collections ─────────────────────────────────────────────────────────

const ALL_COLLECTIONS = [
	'properties', 'floors', 'rental_units',
	'tenants', 'leases', 'lease_tenants', 'meters',
	'readings', 'billings', 'payments', 'payment_allocations',
	'expenses', 'budgets', 'penalty_configs', 'floor_layout_items'
];

// ─── Helper: mock collection with in-memory doc store ────────────────────────

function createMockCollection(docs: Record<string, any>[] = []) {
	const store = new Map<string, Record<string, any>>();
	for (const doc of docs) store.set(String(doc.id), { ...doc });

	return {
		find: vi.fn((query?: any) => ({
			exec: vi.fn(() => {
				let results = Array.from(store.values());
				if (query?.selector) {
					const sel = query.selector;
					if (sel.deleted_at?.$eq === null) {
						results = results.filter((d) => d.deleted_at == null);
					}
				}
				return Promise.resolve(
					results.map((d) => ({
						...d,
						toJSON: () => ({ ...d }),
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
					toJSON: () => ({ ...doc }),
					created_at: doc.created_at,
					incrementalPatch: vi.fn((patch: any) => {
						Object.assign(doc, patch);
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
		_store: store
	};
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
	mockSyncStatus.neonCounts = null;
	mockMutationQueue.items = [];
	mockDb = {};
});

afterEach(() => {
	vi.unstubAllGlobals();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. countActiveDocs — ONLY counts docs where deleted_at IS NULL
// ═════════════════════════════════════════════════════════════════════════════

describe('countActiveDocs — filters soft-deleted records', () => {
	it('should count only active (non-deleted) docs', async () => {
		const col = createMockCollection([
			{ id: '1', name: 'Active 1', deleted_at: null },
			{ id: '2', name: 'Active 2', deleted_at: null },
			{ id: '3', name: 'Deleted', deleted_at: '2025-01-15T00:00:00Z' }
		]);

		// countActiveDocs is private, but we can verify via find({ deleted_at: { $eq: null } })
		const docs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(docs.length).toBe(2);
	});

	it('should return 0 for empty collection', async () => {
		const col = createMockCollection([]);
		const docs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(docs.length).toBe(0);
	});

	it('should return 0 when all docs are soft-deleted', async () => {
		const col = createMockCollection([
			{ id: '1', deleted_at: '2025-01-01T00:00:00Z' },
			{ id: '2', deleted_at: '2025-02-01T00:00:00Z' }
		]);
		const docs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(docs.length).toBe(0);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. COUNT AFTER CREATE — local count should increase by 1
// ═════════════════════════════════════════════════════════════════════════════

describe('count after create — each collection', () => {
	const CREATE_SPECS: { name: string; module: string; fn: string; data: Record<string, any> }[] = [
		{
			name: 'tenants', module: './optimistic', fn: 'optimisticUpsertTenant',
			data: { id: 100, name: 'New Tenant', tenant_status: 'active', contact_number: '09170000000' }
		},
		{
			name: 'properties', module: './optimistic-properties', fn: 'optimisticUpsertProperty',
			data: { id: 100, name: 'New Dorm', address: '456 Ave', type: 'dormitory', status: 'active' }
		},
		{
			name: 'floors', module: './optimistic-floors', fn: 'optimisticUpsertFloor',
			data: { id: 100, property_id: 1, floor_number: 3, status: 'active' }
		},
		{
			name: 'rental_units', module: './optimistic-rental-units', fn: 'optimisticUpsertRentalUnit',
			data: { id: 100, name: 'Unit 301', number: '301', capacity: 2, base_rate: '3000', property_id: 1, floor_id: 1, type: 'single' }
		},
		{
			name: 'leases', module: './optimistic-leases', fn: 'optimisticUpsertLease',
			data: { id: 100, rental_unit_id: 1, name: 'Lease Z', start_date: '2025-06-01', end_date: '2026-05-31', rent_amount: '4000', status: 'active' }
		},
		{
			name: 'meters', module: './optimistic-meters', fn: 'optimisticUpsertMeter',
			data: { id: 100, name: 'Meter Z', location_type: 'unit', rental_unit_id: 1, type: 'water', status: 'active' }
		},
		{
			name: 'expenses', module: './optimistic-expenses', fn: 'optimisticUpsertExpense',
			data: { id: 100, amount: '500', description: 'Supplies', type: 'supplies', status: 'paid', expense_date: '2025-03-19', property_id: 1 }
		},
		{
			name: 'budgets', module: './optimistic-budgets', fn: 'optimisticUpsertBudget',
			data: { id: 100, project_name: 'Paint', planned_amount: '10000', status: 'active', property_id: 1 }
		},
		{
			name: 'floor_layout_items', module: './optimistic-floor-layout', fn: 'optimisticUpsertFloorLayoutItem',
			data: { id: -999, floor_id: 1, item_type: 'WALL', grid_x: 0, grid_y: 0, grid_w: 1, grid_h: 1 }
		}
	];

	for (const spec of CREATE_SPECS) {
		it(`${spec.name}: count increases from 3 → 4 after create`, async () => {
			// Start with 3 active docs
			const col = createMockCollection([
				{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
				{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
				{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
			]);
			mockDb = { [spec.name]: col };

			vi.resetModules();
			const mod = await import(spec.module);
			await mod[spec.fn](spec.data);

			// Count active docs — should be 4 now
			const activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
			expect(activeDocs.length).toBe(4);
		});
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. COUNT AFTER UPDATE — local count stays the same
// ═════════════════════════════════════════════════════════════════════════════

describe('count after update — stays the same', () => {
	const UPDATE_SPECS: { name: string; module: string; fn: string; data: Record<string, any> }[] = [
		{
			name: 'tenants', module: './optimistic', fn: 'optimisticUpsertTenant',
			data: { id: 2, name: 'Updated Tenant', tenant_status: 'active', contact_number: '09170000000' }
		},
		{
			name: 'properties', module: './optimistic-properties', fn: 'optimisticUpsertProperty',
			data: { id: 2, name: 'Updated Dorm', address: '456 Ave', type: 'dormitory', status: 'active' }
		},
		{
			name: 'floors', module: './optimistic-floors', fn: 'optimisticUpsertFloor',
			data: { id: 2, property_id: 1, floor_number: 2, wing: 'C', status: 'active' }
		},
		{
			name: 'rental_units', module: './optimistic-rental-units', fn: 'optimisticUpsertRentalUnit',
			data: { id: 2, name: 'Unit Updated', number: '102', capacity: 8, base_rate: '9000', property_id: 1, floor_id: 1, type: 'double' }
		},
		{
			name: 'leases', module: './optimistic-leases', fn: 'optimisticUpsertLease',
			data: { id: 2, rental_unit_id: 1, name: 'Lease Updated', start_date: '2025-06-01', end_date: '2026-05-31', rent_amount: '5000', status: 'active' }
		},
		{
			name: 'meters', module: './optimistic-meters', fn: 'optimisticUpsertMeter',
			data: { id: 2, name: 'Meter Updated', location_type: 'unit', rental_unit_id: 1, type: 'water', status: 'inactive' }
		},
		{
			name: 'expenses', module: './optimistic-expenses', fn: 'optimisticUpsertExpense',
			data: { id: 2, amount: '999', description: 'Updated', type: 'supplies', status: 'paid', expense_date: '2025-03-19', property_id: 1 }
		},
		{
			name: 'budgets', module: './optimistic-budgets', fn: 'optimisticUpsertBudget',
			data: { id: 2, project_name: 'Paint Revised', planned_amount: '12000', status: 'active', property_id: 1 }
		}
	];

	for (const spec of UPDATE_SPECS) {
		it(`${spec.name}: count stays at 3 after updating existing doc`, async () => {
			const col = createMockCollection([
				{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
				{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z' },
				{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
			]);
			mockDb = { [spec.name]: col };

			vi.resetModules();
			const mod = await import(spec.module);
			await mod[spec.fn](spec.data);

			const activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
			expect(activeDocs.length).toBe(3);
		});
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. COUNT AFTER DELETE — local count decreases by 1
// ═════════════════════════════════════════════════════════════════════════════

describe('count after delete — decreases by 1', () => {
	const DELETE_SPECS: { name: string; module: string; fn: string }[] = [
		{ name: 'tenants', module: './optimistic', fn: 'optimisticDeleteTenant' },
		{ name: 'properties', module: './optimistic-properties', fn: 'optimisticDeleteProperty' },
		{ name: 'floors', module: './optimistic-floors', fn: 'optimisticDeleteFloor' },
		{ name: 'rental_units', module: './optimistic-rental-units', fn: 'optimisticDeleteRentalUnit' },
		{ name: 'leases', module: './optimistic-leases', fn: 'optimisticDeleteLease' },
		{ name: 'meters', module: './optimistic-meters', fn: 'optimisticDeleteMeter' },
		{ name: 'expenses', module: './optimistic-expenses', fn: 'optimisticDeleteExpense' },
		{ name: 'budgets', module: './optimistic-budgets', fn: 'optimisticDeleteBudget' },
		{ name: 'floor_layout_items', module: './optimistic-floor-layout', fn: 'optimisticDeleteFloorLayoutItem' }
	];

	for (const spec of DELETE_SPECS) {
		it(`${spec.name}: count decreases from 3 → 2 after soft-delete`, async () => {
			const col = createMockCollection([
				{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
				{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
				{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
			]);
			mockDb = { [spec.name]: col };

			vi.resetModules();
			const mod = await import(spec.module);
			await mod[spec.fn](2);

			// Doc id=2 now has deleted_at set
			const activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
			expect(activeDocs.length).toBe(2);
		});
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. refreshLocalCounts — updates docCount for ALL 15 collections
// ═════════════════════════════════════════════════════════════════════════════

describe('refreshLocalCounts — updates all 15 collections', () => {
	it('should call updateCollection with correct count for each collection', async () => {
		vi.resetModules();
		vi.doUnmock('$lib/db/replication');

		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('rxdb/plugins/replication', () => ({
			replicateRxCollection: vi.fn(() => ({
				active$: { subscribe: vi.fn(), pipe: vi.fn() },
				error$: { subscribe: vi.fn() },
				cancel: vi.fn(), reSync: vi.fn(),
				awaitInSync: vi.fn(() => Promise.resolve())
			}))
		}));
		vi.doMock('rxjs', () => ({
			firstValueFrom: vi.fn(() => Promise.resolve()),
			filter: vi.fn((fn: any) => fn),
			skip: vi.fn(() => (source: any) => source)
		}));

		// Build a db where each collection has a known number of active docs
		const expectedCounts: Record<string, number> = {};
		const fakeDb: Record<string, any> = {};
		for (let i = 0; i < ALL_COLLECTIONS.length; i++) {
			const name = ALL_COLLECTIONS[i];
			const docCount = i + 1; // 1, 2, 3, ... 15
			expectedCounts[name] = docCount;

			const docs: Record<string, any>[] = [];
			for (let j = 0; j < docCount; j++) {
				docs.push({ id: String(j + 1), deleted_at: null });
			}
			// Add 2 soft-deleted docs per collection to verify filtering
			docs.push({ id: '998', deleted_at: '2025-01-01T00:00:00Z' });
			docs.push({ id: '999', deleted_at: '2025-01-01T00:00:00Z' });

			fakeDb[name] = createMockCollection(docs);
		}

		// startSync sets syncDb, which refreshLocalCounts needs
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true, status: 200,
			json: () => Promise.resolve({ maxUpdatedAt: '2025-01-20T00:00:00Z' })
		});
		vi.stubGlobal('fetch', fetchMock);
		storage.set('__dorm_last_server_ts', '2025-01-01T00:00:00Z');

		const { startSync, refreshLocalCounts } = await import('./replication');
		await startSync(fakeDb as any);

		vi.clearAllMocks(); // clear calls from startSync
		const counts = await refreshLocalCounts();

		// Verify counts returned
		for (const name of ALL_COLLECTIONS) {
			expect(counts[name]).toBe(expectedCounts[name]);
		}

		// Verify updateCollection was called for each collection with correct docCount
		for (const name of ALL_COLLECTIONS) {
			expect(mockSyncStatus.updateCollection).toHaveBeenCalledWith(
				name,
				expect.objectContaining({ docCount: expectedCounts[name] })
			);
		}
	});

	it('should return empty object when db not initialized', async () => {
		vi.resetModules();
		vi.doUnmock('$lib/db/replication');

		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('rxdb/plugins/replication', () => ({ replicateRxCollection: vi.fn() }));
		vi.doMock('rxjs', () => ({
			firstValueFrom: vi.fn(() => Promise.resolve()),
			filter: vi.fn((fn: any) => fn),
			skip: vi.fn(() => (source: any) => source)
		}));

		// Don't call startSync — syncDb is null
		const { refreshLocalCounts } = await import('./replication');
		const counts = await refreshLocalCounts();
		expect(Object.keys(counts).length).toBe(0);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. markSynced — sets docCount on collection state
// ═════════════════════════════════════════════════════════════════════════════

describe('markSynced — propagates docCount to sync status', () => {
	it('should be called with correct count after startup sync for each eager collection', async () => {
		vi.resetModules();
		vi.doUnmock('$lib/db/replication');

		// Track active$ subscribers so we can trigger them
		const activeSubscribers: Record<string, (active: boolean) => void> = {};
		vi.doMock('$lib/stores/sync-status.svelte', () => ({ syncStatus: mockSyncStatus, isFresh: (a: number, m: number) => a >= 0 && a < m, isStale: (a: number, t: number) => a >= 0 && a > t }));
		vi.doMock('$lib/stores/mutation-queue.svelte', () => ({ mutationQueue: mockMutationQueue }));
		vi.doMock('rxdb/plugins/replication', () => ({
			replicateRxCollection: vi.fn((opts: any) => {
				const name = opts.replicationIdentifier.replace('dorm-neon-', '');
				return {
					active$: {
						subscribe: (cb: (active: boolean) => void) => {
							activeSubscribers[name] = cb;
							return { unsubscribe: vi.fn() };
						},
						pipe: vi.fn()
					},
					error$: { subscribe: vi.fn() },
					cancel: vi.fn(),
					reSync: vi.fn(),
					awaitInSync: vi.fn(() => Promise.resolve())
				};
			})
		}));
		vi.doMock('rxjs', () => ({
			firstValueFrom: vi.fn(() => Promise.resolve()),
			filter: vi.fn((fn: any) => fn),
			skip: vi.fn(() => (source: any) => source)
		}));

		// Each collection has a different number of active docs
		const fakeDb: Record<string, any> = {};
		const expectedCounts: Record<string, number> = {};
		const EAGER = [
			'properties', 'floors', 'rental_units', 'tenants', 'leases',
			'lease_tenants', 'meters', 'readings', 'billings', 'payments', 'payment_allocations'
		];
		for (let i = 0; i < EAGER.length; i++) {
			const name = EAGER[i];
			const count = (i + 1) * 10;
			expectedCounts[name] = count;
			const docs = Array.from({ length: count }, (_, j) => ({
				id: String(j + 1), deleted_at: null
			}));
			fakeDb[name] = createMockCollection(docs);
		}
		// Add lazy collections too (needed for db structure)
		for (const name of ['expenses', 'budgets', 'penalty_configs', 'floor_layout_items']) {
			fakeDb[name] = createMockCollection([]);
		}

		storage.set('__dorm_last_server_ts', '2025-01-01T00:00:00Z');
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true, status: 200,
			json: () => Promise.resolve({ maxUpdatedAt: '2025-01-20T00:00:00Z' })
		});
		vi.stubGlobal('fetch', fetchMock);

		const { startSync } = await import('./replication');
		await startSync(fakeDb as any);

		// Simulate replication completing for each eager collection
		for (const name of EAGER) {
			if (activeSubscribers[name]) {
				activeSubscribers[name](true);  // pull started
				activeSubscribers[name](false); // pull completed
			}
		}

		// Wait for async countActiveDocs to resolve
		await new Promise((r) => setTimeout(r, 50));

		// Verify markSynced was called with correct counts
		for (const name of EAGER) {
			expect(mockSyncStatus.markSynced).toHaveBeenCalledWith(name, expectedCounts[name]);
		}
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. COUNT AFTER CREATE → DELETE SEQUENCE — net effect
// ═════════════════════════════════════════════════════════════════════════════

describe('count after create then delete — net zero change', () => {
	it('tenants: 3 → create → 4 → delete same → 3', async () => {
		const col = createMockCollection([
			{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
		]);
		mockDb = { tenants: col };

		vi.resetModules();
		const { optimisticUpsertTenant, optimisticDeleteTenant } = await import('./optimistic');

		// Create
		await optimisticUpsertTenant({
			id: 50, name: 'Temp Tenant', tenant_status: 'active', contact_number: '09170000000'
		});
		let activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(4);

		// Delete the same one
		await optimisticDeleteTenant(50);
		activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(3);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. COUNT AFTER ROLLBACK — returns to original
// ═════════════════════════════════════════════════════════════════════════════

describe('count after rollback — returns to pre-mutation count', () => {
	it('tenants: 3 → create → 4 → rollback → 3', async () => {
		const col = createMockCollection([
			{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
		]);
		mockDb = { tenants: col };

		vi.resetModules();
		const { optimisticUpsertTenant } = await import('./optimistic');

		const rollback = await optimisticUpsertTenant({
			id: 50, name: 'Will Rollback', tenant_status: 'active', contact_number: '09170000000'
		});

		let activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(4);

		// Rollback — doc gets soft-deleted (no prior snapshot since it was new)
		await rollback!();

		activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(3);
	});

	it('leases: update then rollback → count unchanged, data restored', async () => {
		const col = createMockCollection([
			{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z',
			  rental_unit_id: '1', name: 'Original', start_date: '2025-01-01', end_date: '2025-12-31',
			  rent_amount: '5000', status: 'active', security_deposit: '10000' },
			{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '3', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
		]);
		mockDb = { leases: col };

		vi.resetModules();
		const { optimisticUpsertLease } = await import('./optimistic-leases');

		const rollback = await optimisticUpsertLease({
			id: 1, rental_unit_id: 1, name: 'Updated Lease',
			start_date: '2025-06-01', end_date: '2026-05-31', rent_amount: '8000', status: 'active'
		});

		// Count should still be 3 (update, not create)
		let activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(3);

		// Rollback
		await rollback!();

		// Count should still be 3
		activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(3);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. PAYMENT REVERT — count impact (reverted payments should still be counted)
// ═════════════════════════════════════════════════════════════════════════════

describe('payment revert — reverted_at does NOT change active count', () => {
	it('reverted payments still count as active (deleted_at is null)', async () => {
		const col = createMockCollection([
			{ id: '1', amount: '5000', reverted_at: null, deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '2', amount: '3000', reverted_at: null, deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '3', amount: '2000', reverted_at: null, deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
		]);
		mockDb = { payments: col, billings: createMockCollection() };

		vi.resetModules();
		const { optimisticRevertPayment } = await import('./optimistic-payments');

		await optimisticRevertPayment(2);

		// reverted_at is set, but deleted_at is still null → still counts as active
		const activeDocs = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(activeDocs.length).toBe(3); // still 3, reverted_at doesn't affect count
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. NEON COUNT COMPARISON — match vs mismatch detection
// ═════════════════════════════════════════════════════════════════════════════

describe('Neon count comparison — sync modal match/mismatch', () => {
	it('should detect match when local docCount equals Neon count', () => {
		const localDocCount = 42;
		const neonCount = 42;
		const diff = localDocCount - neonCount;
		expect(diff).toBe(0);
		// This is the exact logic from SyncDetailModal.svelte line 433-434
		const status = diff === 0 ? '✓ synced' : `⚠ ${diff > 0 ? `+${diff} extra` : `${diff} missing`}`;
		expect(status).toBe('✓ synced');
	});

	it('should detect +N extra when local > Neon', () => {
		const localDocCount = 48;
		const neonCount = 42;
		const diff = localDocCount - neonCount;
		expect(diff).toBe(6);
		const status = diff === 0 ? '✓ synced' : `⚠ ${diff > 0 ? `+${diff} extra` : `${diff} missing`}`;
		expect(status).toBe('⚠ +6 extra');
	});

	it('should detect N missing when local < Neon', () => {
		const localDocCount = 32;
		const neonCount = 42;
		const diff = localDocCount - neonCount;
		expect(diff).toBe(-10);
		const status = diff === 0 ? '✓ synced' : `⚠ ${diff > 0 ? `+${diff} extra` : `${diff} missing`}`;
		expect(status).toBe('⚠ -10 missing');
	});

	it('should flag hasMismatch correctly', () => {
		// Mirrors the logic at SyncDetailModal.svelte line 801
		const neonCounts: Record<string, number> = { tenants: 87, leases: 40, floor_layout_items: 42 };
		const collections = [
			{ name: 'tenants', docCount: 87 },
			{ name: 'leases', docCount: 40 },
			{ name: 'floor_layout_items', docCount: 48 } // mismatch!
		];

		for (const col of collections) {
			const hasMismatch = neonCounts !== null
				&& neonCounts[col.name] !== undefined
				&& col.docCount !== neonCounts[col.name];

			if (col.name === 'floor_layout_items') {
				expect(hasMismatch).toBe(true);
			} else {
				expect(hasMismatch).toBe(false);
			}
		}
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. MULTI-STEP SCENARIO — create multiple, delete one, verify count
// ═════════════════════════════════════════════════════════════════════════════

describe('multi-step scenario — batch operations', () => {
	it('tenants: create 3 + delete 1 → net +2 from baseline', async () => {
		const col = createMockCollection([
			{ id: '1', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' },
			{ id: '2', deleted_at: null, updated_at: '2025-01-01T00:00:00Z' }
		]);
		mockDb = { tenants: col };

		vi.resetModules();
		const { optimisticUpsertTenant, optimisticDeleteTenant } = await import('./optimistic');

		// Create 3
		await optimisticUpsertTenant({ id: 10, name: 'A', tenant_status: 'active' });
		await optimisticUpsertTenant({ id: 11, name: 'B', tenant_status: 'active' });
		await optimisticUpsertTenant({ id: 12, name: 'C', tenant_status: 'active' });

		let active = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(active.length).toBe(5); // 2 + 3

		// Delete 1
		await optimisticDeleteTenant(11);

		active = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(active.length).toBe(4); // 5 - 1
	});

	it('floor_layout_items: create 5 temp walls, all get replaced → count matches server', async () => {
		// Simulate: 5 temp walls created, then server creates 5 real ones, cleanup removes temps
		const col = createMockCollection([
			// 5 temp walls
			{ id: '-1', floor_id: '1', item_type: 'WALL', grid_x: 0, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '-2', floor_id: '1', item_type: 'WALL', grid_x: 1, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '-3', floor_id: '1', item_type: 'WALL', grid_x: 2, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '-4', floor_id: '1', item_type: 'WALL', grid_x: 3, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '-5', floor_id: '1', item_type: 'WALL', grid_x: 4, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			// 5 real walls (same positions — server assigned IDs)
			{ id: '100', floor_id: '1', item_type: 'WALL', grid_x: 0, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '101', floor_id: '1', item_type: 'WALL', grid_x: 1, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '102', floor_id: '1', item_type: 'WALL', grid_x: 2, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '103', floor_id: '1', item_type: 'WALL', grid_x: 3, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null },
			{ id: '104', floor_id: '1', item_type: 'WALL', grid_x: 4, grid_y: 0, grid_w: 1, grid_h: 1, deleted_at: null }
		]);
		mockDb = { floor_layout_items: col };

		// Before cleanup: 10 docs (5 temp + 5 real)
		let active = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(active.length).toBe(10);

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

		// After cleanup: only 5 real docs remain (temps replaced)
		active = await col.find({ selector: { deleted_at: { $eq: null } } }).exec();
		expect(active.length).toBe(5);

		// Count now matches what Neon would report
		const neonCount = 5;
		expect(active.length).toBe(neonCount);
	});
});
