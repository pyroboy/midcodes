import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxDatabase } from 'rxdb';
import { syncStatus } from '$lib/stores/sync-status.svelte';

const COLLECTIONS_TO_SYNC = [
	'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
	'floors', 'meters', 'readings', 'billings', 'payments',
	'payment_allocations', 'expenses', 'budgets', 'penalty_configs'
];

const replications = new Map<string, RxReplicationState<any, any>>();

/** In-flight resync promises — prevents duplicate server queries for the same collection. */
const inFlightResyncs = new Map<string, Promise<void>>();

/** When true, all pulls are halted — Neon quota is exhausted or unreachable. */
let neonDown = false;

/**
 * Preflight: hit the health endpoint once before starting 14 replications.
 * Returns true if Neon is reachable, false if quota exceeded or down.
 * D4: Also sets neon health directly on syncStatus (latency included) so the
 * layout doesn't need to fire a separate checkNeonHealth() fetch.
 */
async function checkNeonReachable(): Promise<boolean> {
	const t0 = Date.now();
	try {
		const res = await fetch('/api/rxdb/health');
		const latencyMs = Date.now() - t0;
		if (!res.ok) {
			console.warn(`[RxSync] Neon health check failed (${res.status}) — skipping replication`);
			syncStatus.setNeonHealthDirect('error');
			return false;
		}
		syncStatus.setNeonHealthDirect('ok', latencyMs);
		return true;
	} catch {
		console.warn('[RxSync] Neon health check unreachable — skipping replication');
		syncStatus.setNeonHealthDirect('error');
		return false;
	}
}

// D6: When the tab becomes visible again after being hidden, re-check Neon
// reachability. If Neon was previously down and is now reachable, resume replication.
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', async () => {
		if (document.visibilityState === 'visible' && neonDown) {
			const ok = await checkNeonReachable();
			if (ok) {
				neonDown = false;
				syncStatus.addLog('Neon reconnected — replication resumed', 'success');
			}
		}
	});
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

						// DD3: Detect session expiry — halt replication instead of retrying forever
						if (res.status === 401) {
							console.error('[RxSync] Session expired — halting replication');
							syncStatus.addLog('Session expired — please sign in again', 'error');
							cancelAllReplications();
							return { documents: [], checkpoint };
						}

						// DD4: Rate limit — retry after cooldown, don't permanently halt
						if (res.status === 429) {
							const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
							const waitSec = isNaN(retryAfter) ? 60 : retryAfter;
							console.warn(`[RxSync:${name}] Rate limited — retrying after ${waitSec}s`);
							syncStatus.addLog(`Rate limited on ${name} — waiting ${waitSec}s`, 'warn');
							await new Promise(r => setTimeout(r, waitSec * 1000));
							throw new Error(`Rate limited on ${name}`); // RxDB will retry via retryTime
						}

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
 * Deduplicates concurrent calls — if a resync is already in-flight for this
 * collection, the existing promise is returned instead of firing a second pull.
 */
export async function resyncCollection(name: string): Promise<void> {
	if (neonDown) return;
	const repl = replications.get(name);
	if (!repl) return;

	// Deduplicate: return existing in-flight promise if one exists
	const existing = inFlightResyncs.get(name);
	if (existing) return existing;

	const promise = (async () => {
		syncStatus.markSyncing(name);
		await repl.reSync();
		await repl.awaitInSync();
	})().finally(() => {
		inFlightResyncs.delete(name);
	});

	inFlightResyncs.set(name, promise);
	return promise;
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
