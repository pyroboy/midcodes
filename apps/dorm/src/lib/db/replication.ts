import { replicateRxCollection, type RxReplicationState } from 'rxdb/plugins/replication';
import type { RxDatabase } from 'rxdb';
import { syncStatus } from '$lib/stores/sync-status.svelte';
import { mutationQueue } from '$lib/stores/mutation-queue.svelte';

/** Result of a resync operation — callers can inspect to show appropriate UI feedback. */
export type ResyncResult = {
	status: 'ok' | 'skipped' | 'partial';
	reason?: 'neon_down' | 'not_started';
	synced: number;
	skipped: number;
};

/** W7: Eager collections — synced on startup */
const EAGER_COLLECTIONS = [
	// Structural (sync first — needed for client-side joins/enrichment)
	'properties', 'floors', 'rental_units',
	// Core entities
	'tenants', 'leases', 'lease_tenants', 'meters',
	// Transactional
	'readings', 'billings', 'payments', 'payment_allocations'
];

/** W7: Lazy collections — synced on first page access */
const LAZY_COLLECTIONS = ['expenses', 'budgets', 'penalty_configs', 'floor_layout_items'];

const COLLECTIONS_TO_SYNC = [...EAGER_COLLECTIONS, ...LAZY_COLLECTIONS];

/** W8: Dependency map — parent collections that must be fresh before children */
const COLLECTION_DEPS: Record<string, string[]> = {
	floors: ['properties'],
	rental_units: ['properties', 'floors'],
	meters: ['rental_units'],
	leases: ['rental_units'],
	lease_tenants: ['leases', 'tenants'],
	readings: ['meters'],
	billings: ['leases'],
	payments: ['leases'],
	payment_allocations: ['payments', 'billings'],
	floor_layout_items: ['floors', 'rental_units']
};

// Persist across HMR — module-level Maps reset on hot reload, orphaning old replication instances
const replications: Map<string, RxReplicationState<any, any>> =
	(globalThis as any).__dorm_replications ??= new Map<string, RxReplicationState<any, any>>();

/** In-flight resync promises — prevents duplicate server queries for the same collection. */
const inFlightResyncs: Map<string, Promise<void>> =
	(globalThis as any).__dorm_inFlightResyncs ??= new Map<string, Promise<void>>();

/** When true, all pulls are halted — Neon quota is exhausted or unreachable. */
let neonDown = false;

/** C1: When true, all pulls are paused by the user. */
let syncPaused = false;

/** B1: Server maxUpdatedAt from preflight health check — used for checkpoint integrity validation. */
let serverMaxTs: string | null = null;

/** localStorage key for server-side maxUpdatedAt — used to skip pulls on warm startup. */
const LAST_SERVER_TS_KEY = '__dorm_last_server_ts';

/** W10: localStorage key for when the last full sync completed (epoch ms). */
const LAST_SYNC_TIME_KEY = '__dorm_last_sync_time';

/** Holds the maxUpdatedAt from the current sync's health check, persisted when all collections complete. */
let pendingServerTs: string | null = null;

/**
 * Count active (non-deleted) docs for a collection.
 * All synced collections have `deleted_at` — filter to match what the UI shows
 * and what the server count/integrity endpoints return.
 */
async function countActiveDocs(collection: any): Promise<number> {
	const docs = await collection.find({ selector: { deleted_at: { $eq: null } } }).exec();
	return docs.length;
}

/** W7: Reference to the database for lazy collection sync */
let syncDb: RxDatabase | null = null;

/**
 * Preflight: hit the health endpoint once before starting 14 replications.
 * Returns true if Neon is reachable, false if quota exceeded or down.
 * D4: Also sets neon health directly on syncStatus (latency included) so the
 * layout doesn't need to fire a separate checkNeonHealth() fetch.
 */
async function checkNeonReachable(): Promise<{ reachable: boolean; maxUpdatedAt: string | null }> {
	const t0 = Date.now();
	try {
		const res = await fetch('/api/rxdb/health');
		const latencyMs = Date.now() - t0;
		if (!res.ok) {
			console.warn(`[RxSync] Neon health check failed (${res.status}) — skipping replication`);
			syncStatus.setNeonHealthDirect('error');
			return { reachable: false, maxUpdatedAt: null };
		}
		const data = await res.json();
		syncStatus.setNeonHealthDirect('ok', latencyMs);
		syncStatus.recordHealthCheck(latencyMs, JSON.stringify(data).length);
		return { reachable: true, maxUpdatedAt: data.maxUpdatedAt ?? null };
	} catch {
		console.warn('[RxSync] Neon health check unreachable — skipping replication');
		syncStatus.setNeonHealthDirect('error');
		return { reachable: false, maxUpdatedAt: null };
	}
}

// D6: When the tab becomes visible again after being hidden, re-check Neon
// reachability. If Neon was previously down and is now reachable, resume replication.
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', async () => {
		if (document.visibilityState === 'visible' && neonDown) {
			const { reachable } = await checkNeonReachable();
			if (reachable) {
				neonDown = false;
				syncStatus.addLog('Neon reconnected — replication resumed', 'success');
			}
		}
	});
}

// Auto-pause when browser goes offline, auto-resume + resync when back online
if (typeof window !== 'undefined') {
	window.addEventListener('offline', () => {
		syncStatus.addLog('Browser went offline — sync paused', 'warn');
		syncStatus.setPaused(true);
	});
	window.addEventListener('online', () => {
		syncStatus.addLog('Browser back online — resuming sync', 'success');
		syncStatus.setPaused(false);
		// Only resync if we have active replications (i.e., initial sync already happened)
		if (replications.size > 0) {
			syncPaused = false;
			resyncAll().catch(() => {});
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
	syncDb = db; // W7: Store ref for lazy collection sync

	// W10: If last sync was < 5 min ago AND server TS matches, skip health check entirely
	const lastSyncTime = typeof localStorage !== 'undefined'
		? localStorage.getItem(LAST_SYNC_TIME_KEY)
		: null;
	const lastKnownTs = typeof localStorage !== 'undefined'
		? localStorage.getItem(LAST_SERVER_TS_KEY)
		: null;
	if (lastSyncTime && lastKnownTs) {
		const ageMs = Date.now() - Number(lastSyncTime);
		if (ageMs < 5 * 60 * 1000) {
			console.log(`[RxSync] Cache < ${Math.round(ageMs / 1000)}s old — serving from cache`);
			syncStatus.addLog('Serving from cache (< 5 min old)', 'success');
			syncStatus.setNeonHealthDirect('ok');
			for (const name of COLLECTIONS_TO_SYNC) {
				const collection = (db as any)[name];
				if (!collection) continue;
				try {
					const count = await countActiveDocs(collection);
					syncStatus.markSynced(name, count);
				} catch {
					syncStatus.markSynced(name, 0);
				}
			}
			syncStatus.setPhase('complete');
			return replications;
		}
	}

	// Preflight: check if Neon is reachable before firing parallel pulls
	const { reachable, maxUpdatedAt } = await checkNeonReachable();
	if (!reachable) {
		neonDown = true;
		syncStatus.setPhase('error');
		return replications;
	}

	// B1: Store server maxUpdatedAt for checkpoint integrity validation
	serverMaxTs = maxUpdatedAt;

	// W2: Skip all pulls if server data hasn't changed since last sync
	pendingServerTs = maxUpdatedAt;
	const cachedServerTs = typeof localStorage !== 'undefined'
		? localStorage.getItem(LAST_SERVER_TS_KEY)
		: null;
	if (maxUpdatedAt && cachedServerTs && maxUpdatedAt === cachedServerTs) {
		console.log('[RxSync] Server unchanged — skipping all pulls');
		syncStatus.addLog('Server unchanged — using cached data', 'success');
		// Mark all collections as synced with their active (non-deleted) doc counts
		for (const name of COLLECTIONS_TO_SYNC) {
			const collection = (db as any)[name];
			if (!collection) continue;
			try {
				const count = await countActiveDocs(collection);
				syncStatus.markSynced(name, count);
			} catch {
				syncStatus.markSynced(name, 0);
			}
		}
		// W10: Persist sync time
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(LAST_SYNC_TIME_KEY, String(Date.now()));
		}
		syncStatus.setPhase('complete');
		return replications;
	}

	// W7: Only sync eager collections on startup; lazy ones sync on first access
	for (const name of EAGER_COLLECTIONS) {
		if (replications.has(name)) continue;
		const collection = (db as any)[name];
		if (!collection) continue;

		syncStatus.markSyncing(name);

		const repl = replicateRxCollection({
			collection,
			replicationIdentifier: `dorm-neon-${name}`,
			pull: {
				async handler(checkpoint: any, batchSize: number) {
					if (neonDown || syncPaused || (typeof navigator !== 'undefined' && !navigator.onLine)) {
						return { documents: [], checkpoint };
					}

					// B1: Checkpoint integrity — if local checkpoint is ahead of server, reset it
					if (checkpoint?.updated_at && serverMaxTs) {
						const cpTime = new Date(checkpoint.updated_at).getTime();
						const serverTime = new Date(serverMaxTs).getTime();
						if (cpTime > serverTime) {
							syncStatus.addLog(`${name}: checkpoint ahead of server — resetting`, 'warn');
							return { documents: [], checkpoint: null };
						}
					}

					const pullStart = Date.now();
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
					const pullLatency = Date.now() - pullStart;
					const responseSize = JSON.stringify(data).length;
					syncStatus.recordPull(name, pullLatency, responseSize, docCount);
					// W12: Track pulled doc count for progress display
					if (docCount > 0) {
						syncStatus.markPulled(name, docCount);
						console.log(`[RxSync:${name}] ← ${docCount} doc(s) from Neon (${responseSize}B, ${pullLatency}ms)`);
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
				countActiveDocs(collection).then((count: number) => {
					syncStatus.markSynced(name, count);
					// W2: Persist maxUpdatedAt once all collections are synced
					if (pendingServerTs && syncStatus.phase === 'complete') {
						localStorage.setItem(LAST_SERVER_TS_KEY, pendingServerTs);
						localStorage.setItem(LAST_SYNC_TIME_KEY, String(Date.now()));
						pendingServerTs = null;
					}
				}).catch(() => {
					syncStatus.markSynced(name, 0);
				});
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
 *
 * W8: Automatically resyncs stale dependencies first (recursive, deduped).
 */
export async function resyncCollection(name: string): Promise<ResyncResult> {
	if (neonDown) return { status: 'skipped', reason: 'neon_down', synced: 0, skipped: 1 };
	const repl = replications.get(name);
	if (!repl) return { status: 'skipped', reason: 'not_started', synced: 0, skipped: 1 };

	// W2: Invalidate cached server timestamp — next startup must re-check
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(LAST_SERVER_TS_KEY);
	}

	// W8: Resync stale dependencies first
	const deps = COLLECTION_DEPS[name];
	if (deps) {
		const staleDeps = deps.filter((dep) => {
			const col = syncStatus.collections.find((c) => c.name === dep);
			return col && col.status !== 'synced';
		});
		if (staleDeps.length > 0) {
			await Promise.all(staleDeps.map((dep) => resyncCollection(dep)));
		}
	}

	// Deduplicate: return existing in-flight promise if one exists
	const existing = inFlightResyncs.get(name);
	if (existing) {
		await existing;
		return { status: 'ok', synced: 1, skipped: 0 };
	}

	const promise = (async () => {
		syncStatus.markSyncing(name);
		await repl.reSync();
		await repl.awaitInSync();
	})().finally(() => {
		inFlightResyncs.delete(name);
	});

	inFlightResyncs.set(name, promise);
	await promise;
	return { status: 'ok', synced: 1, skipped: 0 };
}

/**
 * W7: Start replication for a lazy collection on first access.
 * No-ops if already started. Call from store initialization.
 */
export async function ensureCollectionSynced(name: string): Promise<void> {
	if (replications.has(name)) return; // already syncing/synced
	if (!syncDb) return; // db not ready yet

	const collection = (syncDb as any)[name];
	if (!collection) return;

	syncStatus.markSyncing(name);

	const repl = replicateRxCollection({
		collection,
		replicationIdentifier: `dorm-neon-${name}`,
		pull: {
			async handler(checkpoint: any, batchSize: number) {
				if (neonDown || syncPaused || (typeof navigator !== 'undefined' && !navigator.onLine)) return { documents: [], checkpoint };

				const pullStart = Date.now();
				const cpUpdatedAt = checkpoint?.updated_at || '1970-01-01T00:00:00Z';
				const cpId = String(checkpoint?.id || '0');
				const params = new URLSearchParams({
					updatedAt: cpUpdatedAt, id: cpId, limit: String(batchSize)
				});

				const res = await fetch(`/api/rxdb/pull/${name}?${params}`);
				if (!res.ok) {
					const text = await res.text().catch(() => '');
					throw new Error(`Pull ${name} failed: ${res.status} — ${text.slice(0, 200)}`);
				}

				const data = await res.json();
				const docCount = data.documents?.length || 0;
				const pullLatency = Date.now() - pullStart;
				const responseSize = JSON.stringify(data).length;
				syncStatus.recordPull(name, pullLatency, responseSize, docCount);
				if (docCount > 0) syncStatus.markPulled(name, docCount);
				return { documents: data.documents, checkpoint: data.checkpoint };
			},
			batchSize: 200
		},
		live: false,
		retryTime: 120000,
		autoStart: true
	});

	let lastError = false;
	repl.error$.subscribe((err) => {
		lastError = true;
		if (!neonDown) syncStatus.markError(name, err);
	});
	repl.active$.subscribe((active) => {
		if (active) { lastError = false; }
		else if (!lastError) {
			countActiveDocs(collection)
				.then((count: number) => syncStatus.markSynced(name, count))
				.catch(() => syncStatus.markSynced(name, 0));
		}
	});

	replications.set(name, repl);
}

/**
 * Force all collections to re-pull (manual refresh only).
 */
export async function resyncAll(): Promise<ResyncResult> {
	if (neonDown) return { status: 'skipped', reason: 'neon_down', synced: 0, skipped: replications.size };
	const results = await Promise.all(
		Array.from(replications.keys()).map((name) => resyncCollection(name))
	);
	const synced = results.filter((r) => r.status === 'ok').length;
	const skipped = results.filter((r) => r.status === 'skipped').length;
	if (skipped === results.length) return { status: 'skipped', reason: results[0]?.reason, synced: 0, skipped };
	if (skipped > 0) return { status: 'partial', synced, skipped };
	return { status: 'ok', synced, skipped: 0 };
}

/**
 * Refresh local RxDB active doc counts and update the sync status store.
 * Counts only non-deleted records (deleted_at IS NULL) to match what the UI shows.
 */
export async function refreshLocalCounts(): Promise<Record<string, number>> {
	if (!syncDb) return {};
	const counts: Record<string, number> = {};
	const ALL_COLLECTIONS = [
		'properties', 'floors', 'rental_units',
		'tenants', 'leases', 'lease_tenants', 'meters',
		'readings', 'billings', 'payments', 'payment_allocations',
		'expenses', 'budgets', 'penalty_configs', 'floor_layout_items'
	];
	for (const name of ALL_COLLECTIONS) {
		const collection = (syncDb as any)[name];
		if (!collection) continue;
		try {
			const count = await countActiveDocs(collection);
			counts[name] = count;
			syncStatus.updateCollection(name, { docCount: count });
		} catch {
			counts[name] = 0;
		}
	}
	return counts;
}

/** Result of a reconciliation — per-collection breakdown of what was fixed. */
export type ReconcileResult = {
	status: 'ok' | 'skipped' | 'error';
	reason?: string;
	collections: {
		name: string;
		serverCount: number;
		localCount: number;
		orphansRemoved: number;
		missingFetched: number;
		inSync: boolean;
		/** Post-fix verification: did re-count confirm match? */
		verified: boolean;
		verifiedLocalCount?: number;
		verifiedServerCount?: number;
	}[];
	totalOrphansRemoved: number;
	totalMissingFetched: number;
	/** True only if post-fix verification confirmed all collections match */
	verified: boolean;
};

/**
 * Targeted reconciliation: compares ALL local RxDB IDs against ALL server IDs per collection.
 * No deleted_at filter — the pull endpoint sends all rows, so RxDB must mirror everything.
 * Fixes: removes orphans (local-only), fetches missing (server-only) by exact ID.
 * After fixing, runs a verification pass to confirm local is a true mirror of server.
 */
export async function reconcile(): Promise<ReconcileResult> {
	const empty: ReconcileResult = { status: 'skipped', collections: [], totalOrphansRemoved: 0, totalMissingFetched: 0, verified: false };
	if (neonDown) return { ...empty, reason: 'Server is unreachable' };
	if (!syncDb) return { ...empty, reason: 'Database not initialized' };

	syncStatus.addLog('Reconciliation started — comparing ALL local vs server IDs', 'info');

	try {
		// ── Phase 1: Fetch server-side integrity data (ALL rows, no deleted_at filter) ──
		const res = await fetch('/api/rxdb/integrity');
		if (!res.ok) {
			const msg = `Integrity endpoint failed: ${res.status}`;
			syncStatus.addLog(msg, 'error');
			return { ...empty, status: 'error', reason: msg };
		}
		const data = await res.json();
		const serverCollections: Record<string, { count: number; ids: number[] }> = data.collections;

		let totalOrphansRemoved = 0;
		let totalMissingFetched = 0;
		const results: ReconcileResult['collections'] = [];

		// ── Phase 2: Diff and fix each collection ──
		for (const [name, serverData] of Object.entries(serverCollections)) {
			const collection = (syncDb as any)[name];
			if (!collection) {
				results.push({ name, serverCount: serverData.count, localCount: 0, orphansRemoved: 0, missingFetched: 0, inSync: false, verified: false });
				continue;
			}

			// Get active local IDs (deleted_at IS NULL) — matches integrity endpoint filter
			const localDocs = await collection.find({ selector: { deleted_at: { $eq: null } } }).exec();
			const localIds = new Set<number>(localDocs.map((d: any) => Number(d.id)));
			const serverIds = new Set<number>(serverData.ids);

			// Compute diff
			const orphanIds: number[] = [];
			for (const id of localIds) {
				if (!serverIds.has(id)) orphanIds.push(id);
			}
			const missingIds: number[] = [];
			for (const id of serverIds) {
				if (!localIds.has(id)) missingIds.push(id);
			}

			const inSync = orphanIds.length === 0 && missingIds.length === 0;

			if (inSync) {
				syncStatus.addLog(`${name}: ${localIds.size}/${serverData.count} — in sync`, 'success');
				results.push({ name, serverCount: serverData.count, localCount: localIds.size, orphansRemoved: 0, missingFetched: 0, inSync: true, verified: true, verifiedLocalCount: localIds.size, verifiedServerCount: serverData.count });
				continue;
			}

			syncStatus.addLog(`${name}: local ${localIds.size} vs server ${serverData.count} — ${orphanIds.length} orphan(s), ${missingIds.length} missing`, 'warn');

			// 2a. Remove orphans from RxDB (IDs that exist locally but not on server)
			if (orphanIds.length > 0) {
				let removed = 0;
				for (const id of orphanIds) {
					try {
						const doc = await collection.findOne(String(id)).exec();
						if (doc) { await doc.remove(); removed++; }
					} catch { /* already gone */ }
				}
				totalOrphansRemoved += removed;
				syncStatus.addLog(`${name}: removed ${removed}/${orphanIds.length} orphan(s)`, removed === orphanIds.length ? 'success' : 'warn');
			}

			// 2b. Fetch missing rows from server by ID (IDs on server but not local)
			if (missingIds.length > 0) {
				let fetched = 0;
				try {
					// Batch in chunks of 100 to avoid URL length limits
					for (let i = 0; i < missingIds.length; i += 100) {
						const chunk = missingIds.slice(i, i + 100);
						const pullRes = await fetch(`/api/rxdb/pull/${name}?ids=${chunk.join(',')}`);
						if (pullRes.ok) {
							const pullData = await pullRes.json();
							for (const doc of pullData.documents || []) {
								await collection.upsert(doc);
								fetched++;
							}
						}
					}
					totalMissingFetched += fetched;
					syncStatus.addLog(`${name}: fetched ${fetched}/${missingIds.length} missing row(s)`, fetched === missingIds.length ? 'success' : 'warn');
				} catch {
					syncStatus.addLog(`${name}: failed to fetch missing rows`, 'error');
				}
			}

			results.push({
				name,
				serverCount: serverData.count,
				localCount: localIds.size,
				orphansRemoved: orphanIds.length,
				missingFetched: missingIds.length,
				inSync: false,
				verified: false // set in verification pass
			});
		}

		// ── Phase 3: Verification pass ──
		// Re-count ALL local docs and compare to server total to confirm fixes worked.
		syncStatus.addLog('Verification — re-counting ALL local docs vs server...', 'info');

		let allVerified = true;
		for (const r of results) {
			if (r.verified) continue; // already verified (was in sync from phase 2)
			const collection = (syncDb as any)[r.name];
			if (!collection) { allVerified = false; continue; }

			// Re-count active local docs (matching count endpoint filter)
			const postFixCount = await countActiveDocs(collection);
			const serverCount = serverCollections[r.name]?.count ?? 0;

			r.verifiedLocalCount = postFixCount;
			r.verifiedServerCount = serverCount;
			r.verified = postFixCount === serverCount;

			if (r.verified) {
				syncStatus.addLog(`✓ ${r.name}: verified ${postFixCount}/${serverCount} — true mirror`, 'success');
			} else {
				allVerified = false;
				syncStatus.addLog(`✗ ${r.name}: post-fix ${postFixCount} local vs ${serverCount} server — STILL MISMATCHED`, 'error');
			}
		}

		// ── Phase 4: Refresh store doc counts so UI collection table is current ──
		await refreshLocalCounts();

		// ── Phase 5: Summary ──
		const fixedCount = results.filter((r) => !r.inSync).length;
		if (fixedCount === 0) {
			syncStatus.addLog(`Reconciliation complete — all ${results.length} collections are true mirrors of server ✓`, 'success');
		} else if (allVerified) {
			syncStatus.addLog(
				`Reconciliation complete — fixed ${fixedCount} collection(s): ${totalOrphansRemoved} orphan(s) removed, ${totalMissingFetched} missing fetched. All verified ✓`,
				'success'
			);
		} else {
			const unverified = results.filter((r) => !r.verified);
			syncStatus.addLog(
				`Reconciliation done but ${unverified.length} collection(s) still mismatched: ${unverified.map((u) => u.name).join(', ')}`,
				'error'
			);
		}

		return { status: 'ok', collections: results, totalOrphansRemoved, totalMissingFetched, verified: allVerified };
	} catch (err: any) {
		const msg = err?.message || 'Reconciliation failed';
		syncStatus.addLog(msg, 'error');
		return { ...empty, status: 'error', reason: msg };
	}
}

/**
 * C1: Pause all replication pulls. Pull handlers return empty results while paused.
 */
export function pauseSync(): void {
	syncPaused = true;
	syncStatus.setPaused(true);
	mutationQueue.pause();
}

/**
 * C1: Resume all replication pulls and trigger a full resync.
 * Also resumes the mutation queue so queued writes start processing.
 * No-ops if browser is offline (auto-pause takes priority).
 */
export function resumeSync(): void {
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		syncStatus.addLog('Cannot resume — still offline', 'warn');
		return;
	}
	syncPaused = false;
	syncStatus.setPaused(false);
	mutationQueue.resume();
	resyncAll();
}
