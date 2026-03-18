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
 *
 * Pull strategy (quota-friendly):
 * - One-shot pull on startup (checkpoint-based — returns 0 docs if nothing changed)
 * - Per-mutation resync via resyncCollection() after each create/update/delete
 * - No polling, no visibility resync — minimizes Neon data transfer
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
					const cpUpdatedAt = checkpoint?.updated_at || '1970-01-01T00:00:00Z';
					const cpId = String(checkpoint?.id || '0');

					const params = new URLSearchParams({
						updatedAt: cpUpdatedAt,
						id: cpId,
						limit: String(batchSize)
					});

					const res = await fetch(`/api/rxdb/pull/${name}?${params}`);
					if (!res.ok) {
						let detail = '';
						try {
							const text = await res.text();
							try {
								const body = JSON.parse(text);
								detail = body.cause || body.detail || body.error || body.message || '';
							} catch {
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
					const docCount = data.documents?.length || 0;
					if (docCount > 0) {
						console.log(`[RxSync:${name}] ← ${docCount} doc(s) from Neon`);
						syncStatus.addLog(`Pull: ${name} ← ${docCount} doc(s)`, 'info');
					}
					return {
						documents: data.documents,
						checkpoint: data.checkpoint
					};
				},
				batchSize: 200
			},
			live: false,
			retryTime: 30000,
			autoStart: true
		});

		let lastError = false;

		repl.error$.subscribe((err) => {
			lastError = true;
			console.error(`[RxSync:${name}] Replication error:`, err);
			syncStatus.markError(name, err);
		});

		repl.active$.subscribe((active) => {
			if (active) {
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
 * Force all collections to re-pull (manual refresh only).
 */
export async function resyncAll(): Promise<void> {
	await Promise.all(
		Array.from(replications.keys()).map((name) => resyncCollection(name))
	);
}
