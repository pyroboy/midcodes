import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxDatabase } from 'rxdb';
import { syncStatus } from '$lib/stores/sync-status.svelte';

const COLLECTIONS_TO_SYNC = [
	'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
	'floors', 'meters', 'readings', 'billings', 'payments',
	'payment_allocations', 'expenses', 'budgets', 'penalty_configs'
];

const replications = new Map<string, RxReplicationState<any, any>>();

/** When true, all pulls are halted — Neon quota is exhausted or unreachable. */
let neonDown = false;

/**
 * Preflight: hit the health endpoint once before starting 14 replications.
 * Returns true if Neon is reachable, false if quota exceeded or down.
 */
async function checkNeonReachable(): Promise<boolean> {
	try {
		const res = await fetch('/api/rxdb/health');
		if (!res.ok) {
			console.warn(`[RxSync] Neon health check failed (${res.status}) — skipping replication`);
			syncStatus.addLog(`Neon unreachable (${res.status}) — using cached data`, 'warn');
			return false;
		}
		return true;
	} catch {
		console.warn('[RxSync] Neon health check unreachable — skipping replication');
		syncStatus.addLog('Neon unreachable — using cached data', 'warn');
		return false;
	}
}

/**
 * Start pull-only replication for all collections.
 *
 * Strategy (quota-friendly):
 * - Preflight health check — if Neon returns 402, skip everything
 * - One-shot pull on startup (checkpoint-based — 0 docs if nothing changed)
 * - Per-mutation resync via resyncCollection() after each create/update/delete
 * - No polling, no visibility resync, no retries on fatal errors
 */
export async function startSync(db: RxDatabase): Promise<Map<string, RxReplicationState<any, any>>> {
	syncStatus.setPhase('syncing');
	neonDown = false;

	// Preflight: check if Neon is reachable before firing 14 parallel pulls
	const reachable = await checkNeonReachable();
	if (!reachable) {
		neonDown = true;
		syncStatus.setPhase('error');
		return replications;
	}

	for (const name of COLLECTIONS_TO_SYNC) {
		if (replications.has(name)) continue;
		const collection = (db as any)[name];
		if (!collection) continue;

		syncStatus.markSyncing(name);

		const repl = replicateRxCollection({
			collection,
			replicationIdentifier: `dorm-neon-${name}`,
			pull: {
				async handler(checkpoint: any, batchSize: number) {
					if (neonDown) {
						return { documents: [], checkpoint };
					}

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

						if (detail.includes('402') || detail.includes('exceeded the data transfer quota')) {
							if (!neonDown) {
								console.error('[RxSync] Neon quota exceeded — stopping all replication');
								syncStatus.addLog('Neon quota exceeded — replication paused', 'error');
							}
							neonDown = true;
							cancelAllReplications();
							return { documents: [], checkpoint };
						}

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
			retryTime: 120000, // 2 min — only matters if a transient error occurs
			autoStart: true
		});

		let lastError = false;

		repl.error$.subscribe((err) => {
			lastError = true;
			if (!neonDown) {
				console.error(`[RxSync:${name}] Replication error:`, err);
				syncStatus.markError(name, err);
			}
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

function cancelAllReplications() {
	for (const [, repl] of replications) {
		repl.cancel();
	}
	replications.clear();
}

/**
 * Force a single collection to re-pull from Neon.
 * Call this after a mutation (create/update/delete) to refresh local data.
 */
export async function resyncCollection(name: string): Promise<void> {
	if (neonDown) return;
	const repl = replications.get(name);
	if (!repl) return;
	syncStatus.markSyncing(name);
	await repl.reSync();
	await repl.awaitInSync();
}

/**
 * Force all collections to re-pull (manual refresh only).
 */
export async function resyncAll(): Promise<void> {
	if (neonDown) return;
	await Promise.all(
		Array.from(replications.keys()).map((name) => resyncCollection(name))
	);
}
