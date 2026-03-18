import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxDatabase } from 'rxdb';
import { syncStatus } from '$lib/stores/sync-status.svelte';

const COLLECTIONS_TO_SYNC = [
	'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
	'floors', 'meters', 'readings', 'billings', 'payments',
	'payment_allocations', 'expenses', 'budgets', 'penalty_configs'
];

const replications = new Map<string, RxReplicationState<any, any>>();

/**
 * Start pull-only replication for all collections.
 * Each collection pulls from GET /api/rxdb/pull/[collection] using
 * checkpoint-based pagination (updated_at + id).
 */
export function startSync(db: RxDatabase): Map<string, RxReplicationState<any, any>> {
	syncStatus.setPhase('syncing');

	for (const name of COLLECTIONS_TO_SYNC) {
		if (replications.has(name)) continue;
		const collection = (db as any)[name];
		if (!collection) {
			console.warn(`[RxSync] Collection "${name}" not found, skipping`);
			continue;
		}

		syncStatus.markSyncing(name);

		const repl = replicateRxCollection({
			collection,
			replicationIdentifier: `dorm-neon-${name}`,
			pull: {
				async handler(checkpoint: any, batchSize: number) {
					const params = new URLSearchParams({
						updatedAt: checkpoint?.updated_at || '1970-01-01T00:00:00Z',
						id: String(checkpoint?.id || '0'),
						limit: String(batchSize)
					});

					const res = await fetch(`/api/rxdb/pull/${name}?${params}`);
					if (!res.ok) {
						throw new Error(`Pull ${name} failed: ${res.status}`);
					}

					const data = await res.json();
					return {
						documents: data.documents,
						checkpoint: data.checkpoint
					};
				},
				batchSize: 200
			},
			live: false,
			retryTime: 5000,
			autoStart: true
		});

		// Track errors first so we know if replication had issues
		let hadError = false;

		repl.error$.subscribe((err) => {
			hadError = true;
			console.error(`[RxSync:${name}] Replication error:`, err);
			// Pass raw error object so the store can extract RxDB error codes
			syncStatus.markError(name, err);
		});

		// Track sync completion — active$ emits false when idle
		// Only mark synced if no errors occurred
		repl.active$.subscribe((active) => {
			if (!active && !hadError) {
				syncStatus.markSynced(name, 0);
			}
		});

		replications.set(name, repl);
	}

	return replications;
}

/**
 * Force a single collection to re-pull from Neon.
 * Call this after a mutation (create/update/delete) to refresh local data.
 */
export async function resyncCollection(name: string): Promise<void> {
	const repl = replications.get(name);
	if (!repl) {
		console.warn(`[RxSync] No replication found for "${name}"`);
		return;
	}
	syncStatus.markSyncing(name);
	await repl.reSync();
	await repl.awaitInSync();
}

/**
 * Force all collections to re-pull.
 */
export async function resyncAll(): Promise<void> {
	await Promise.all(
		Array.from(replications.keys()).map((name) => resyncCollection(name))
	);
}
