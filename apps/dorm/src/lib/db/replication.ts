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
						let detail = '';
						try {
							const text = await res.text();
							// Try JSON first, fall back to raw text
							try {
								const body = JSON.parse(text);
								detail = body.detail || body.error || body.message || '';
							} catch {
								// SvelteKit may return HTML error pages — extract the message
								const match = text.match(/<pre[^>]*>([^<]+)/);
								detail = match?.[1]?.trim() || text.slice(0, 200);
							}
						} catch { /* ignore */ }
						const msg = detail
							? `Pull ${name} failed: ${res.status} — ${detail}`
							: `Pull ${name} failed: ${res.status}`;
						console.warn(`[RxSync:${name}]`, msg);
						throw new Error(msg);
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

		// Track errors — reset on each sync attempt
		let lastError = false;

		repl.error$.subscribe((err) => {
			lastError = true;
			console.error(`[RxSync:${name}] Replication error:`, err);
			syncStatus.markError(name, err);
		});

		// active$ emits false when replication goes idle after a pull batch.
		// Only mark synced if no error occurred during this pull cycle.
		repl.active$.subscribe((active) => {
			if (active) {
				// Starting a new pull — reset error flag
				lastError = false;
			} else if (!lastError) {
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
