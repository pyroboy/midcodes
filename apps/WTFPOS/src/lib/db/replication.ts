/**
 * Client-side LAN replication.
 * Connects each RxDB collection to the SvelteKit server's replication API
 * so all devices on the same LAN share the same data.
 *
 * Uses a SINGLE multiplexed SSE stream (not one per collection) to avoid
 * saturating the browser's 6-connection-per-host limit on HTTP/1.1.
 *
 * On startup, checks if the server's in-memory store is empty (e.g. after
 * server restart). If so, uses a fresh replication generation to force
 * a full re-push of all local data — this is how historical data reaches
 * newly connected devices.
 *
 * Force-sync uses generation-based replication identifiers instead of
 * fragile internal checkpoint manipulation. Each new generation forces
 * RxDB to start from checkpoint=null.
 */
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { Subject } from 'rxjs';
import type { RxDatabase } from 'rxdb';
import { CircuitBreaker } from '$lib/utils/circuit-breaker';
import { calculateBackoff } from '$lib/utils/backoff';

// ─── Server device detection ─────────────────────────────────────────────────
// Checks all loopback variants: 'localhost', '127.0.0.1' (IPv4), '::1' (IPv6).
// IPv6 loopback is the default on macOS — missing it causes the server browser
// to misidentify itself as a LAN client, breaking the poll-based pull pipeline.
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function isServerBrowser(): boolean {
	return typeof window !== 'undefined' && LOOPBACK_HOSTNAMES.has(window.location.hostname);
}

// ─── Remote logger ───────────────────────────────────────────────────────────
// Posts client-side logs to the server so iPad errors appear in the terminal
function remoteLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
	try {
		fetch(`${getServerUrl()}/api/replication/client-log`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ level, message, data }),
			keepalive: true,
		}).catch(() => { /* fire and forget */ });
	} catch { /* noop */ }
}

// Priority tier 1: collections that populate the POS floor plan + active orders
const PRIORITY_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'floor_elements', 'kds_tickets', 'devices'
];

// Priority tier 2: everything else (history, stock, reports)
const SECONDARY_COLLECTIONS = [
	'stock_items', 'deliveries', 'stock_events', 'deductions',
	'expenses', 'stock_counts', 'readings', 'audit_logs',
	'shifts'
];

const REPLICATED_COLLECTIONS = [...PRIORITY_COLLECTIONS, ...SECONDARY_COLLECTIONS];

/** Collections that POS staff devices need — use with startReplication({ collections }) for selective sync. */
export const SELECTIVE_COLLECTIONS = ['tables', 'orders', 'menu_items', 'floor_elements', 'kds_tickets', 'devices'] as const;

interface Checkpoint { id: string; updatedAt: string }

// ─── HMR-safe state ──────────────────────────────────────────────────────────
// Store state on `window` so it survives Vite HMR module replacement.
// Without this, HMR resets the module vars while old replication instances
// keep running → duplicate pushes, push loops, zombie SSE connections.
// ─── Multi-tab reset coordination ─────────────────────────────────────────
// If user triggers "Reset All" in one tab, other tabs won't get SSE RESET_ALL
// because only the main replication tab listens. BroadcastChannel ensures ALL
// tabs on this device clear state and reload.
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
	try {
		const resetChannel = new BroadcastChannel('wtfpos-reset');
		resetChannel.onmessage = (event) => {
			if (event.data === 'RESET_ALL') {
				console.log('[Replication] RESET_ALL received via BroadcastChannel — clearing and reloading');
				try { sessionStorage.clear(); } catch { /* noop */ }
				window.location.reload();
			}
		};
	} catch { /* BroadcastChannel unavailable — single-tab only */ }
}

const _global = (typeof window !== 'undefined' ? window : globalThis) as any;
if (!_global.__wtfposRepl) {
	_global.__wtfposRepl = {
		activeReplications: new Map<string, any>(),
		sharedEventSource: null as EventSource | null,
		serverBreaker: new CircuitBreaker({ failureThreshold: 20, resetTimeoutMs: 15_000 }),
		startingReplication: false,
		replicationStarted: false,
	};
}
const activeReplications: Map<string, any> = _global.__wtfposRepl.activeReplications;
// Use getter/setter to keep global in sync
function getSharedEventSource(): EventSource | null { return _global.__wtfposRepl.sharedEventSource; }
function setSharedEventSource(es: EventSource | null) { _global.__wtfposRepl.sharedEventSource = es; }

// Circuit breaker for server requests — shared across all collections
const serverBreaker: CircuitBreaker = _global.__wtfposRepl.serverBreaker;

// Per-collection retry attempt counters for exponential backoff
const retryAttempts = new Map<string, number>();

// ─── Breaker-open log throttle ───────────────────────────────────────────────
// When the circuit breaker is open, 13 collections × every retry = wall of noise.
// Only send the first breaker-open log, then a summary every 30s.
let _lastBreakerLogTs = 0;
let _breakerLogSuppressed = 0;

function shouldLogBreakerOpen(): boolean {
	const now = Date.now();
	if (now - _lastBreakerLogTs > 30_000) {
		if (_breakerLogSuppressed > 0) {
			remoteLog('warn', `Circuit breaker: suppressed ${_breakerLogSuppressed} repeated messages`);
		}
		_lastBreakerLogTs = now;
		_breakerLogSuppressed = 0;
		return true;
	}
	_breakerLogSuppressed++;
	return false;
}

// ─── Reactive sync activity state ───────────────────────────────────────────
// Exposed so the SyncStatusBanner can show "Syncing..." during background sync

type SyncActivityListener = (activity: SyncActivity) => void;
const activityListeners = new Set<SyncActivityListener>();

export interface SyncActivity {
	/** Whether any collection is actively pulling or pushing right now */
	active: boolean;
	/** Number of collections currently active */
	activeCount: number;
	/** Names of collections currently syncing */
	activeCollections: string[];
	/** Whether the initial sync after startup is still in progress */
	initialSyncDone: boolean;
	/** Whether priority collections (tables, orders, menu, floor) have finished */
	prioritySyncDone: boolean;
	/** Per-collection sync completion tracking (for progress display) */
	completedCollections: string[];
	totalCollections: number;
	/** Current phase description */
	phase: string;
}

let currentActivity: SyncActivity = {
	active: false,
	activeCount: 0,
	activeCollections: [],
	initialSyncDone: false,
	prioritySyncDone: false,
	completedCollections: [],
	totalCollections: 0,
	phase: 'Initializing...',
};

function emitActivity(activity: SyncActivity) {
	currentActivity = activity;
	for (const fn of activityListeners) {
		try { fn(activity); } catch { /* noop */ }
	}
}

/** Subscribe to sync activity changes. Returns unsubscribe function. */
export function subscribeSyncActivity(fn: SyncActivityListener): () => void {
	activityListeners.add(fn);
	// Immediately emit current state
	fn(currentActivity);
	return () => activityListeners.delete(fn);
}

/** Get current sync activity snapshot (non-reactive). */
export function getSyncActivity(): SyncActivity {
	return currentActivity;
}

// Tracks per-collection active state
const activeStates = new Map<string, boolean>();

function updateActivity() {
	const activeNames: string[] = [];
	for (const [name, isActive] of activeStates) {
		if (isActive) activeNames.push(name);
	}
	emitActivity({
		...currentActivity,
		active: activeNames.length > 0,
		activeCount: activeNames.length,
		activeCollections: activeNames,
	});
}

// ─── Generation counter ─────────────────────────────────────────────────────

function getSyncGeneration(): number {
	try {
		return parseInt(localStorage.getItem('wtfpos-sync-gen') || '0', 10);
	} catch {
		return 0;
	}
}

function bumpSyncGeneration(): number {
	const next = getSyncGeneration() + 1;
	try { localStorage.setItem('wtfpos-sync-gen', String(next)); } catch { /* noop */ }
	return next;
}

function getServerUrl(): string {
	return window.location.origin;
}

const LAST_EPOCH_KEY = 'wtfpos-sync-epoch';

function getLastKnownEpoch(): number {
	try {
		return parseInt(localStorage.getItem(LAST_EPOCH_KEY) || '0', 10);
	} catch { return 0; }
}

function setLastKnownEpoch(epoch: number) {
	try { localStorage.setItem(LAST_EPOCH_KEY, String(epoch)); } catch { /* noop */ }
}

/**
 * Check if the server has restarted since last sync by comparing epochs.
 * Also detects empty server (first startup or data loss).
 * Returns { needsResync: true } if the client must bump generation.
 */
async function checkServerState(): Promise<{ needsResync: boolean; epoch: number; total: number }> {
	try {
		const res = await fetch(`${getServerUrl()}/api/replication/status`);
		if (!res.ok) {
			console.log(`[Replication] checkServerState() — status=${res.status}, assuming no resync needed`);
			return { needsResync: false, epoch: 0, total: 0 };
		}
		const data = await res.json();
		const total = data.total ?? 0;
		const serverEpoch = data.epoch ?? 0;
		const lastKnownEpoch = getLastKnownEpoch();

		// Case 1: Server store is empty (first boot or restart before any client pushed)
		if (total < 5) {
			console.log(`[Replication] checkServerState() — server empty (total=${total}), needs resync`);
			if (serverEpoch > 0) setLastKnownEpoch(serverEpoch);
			return { needsResync: true, epoch: serverEpoch, total };
		}

		// Case 2: Server epoch changed — server restarted, another client already re-pushed data
		// This is the key fix: without this, the client keeps its old checkpoint and misses
		// docs whose updatedAt changed positions in the sort order after the re-push.
		if (lastKnownEpoch > 0 && serverEpoch > 0 && serverEpoch !== lastKnownEpoch) {
			console.log(`[Replication] checkServerState() — epoch changed (${lastKnownEpoch} → ${serverEpoch}), server restarted — needs resync`);
			setLastKnownEpoch(serverEpoch);
			return { needsResync: true, epoch: serverEpoch, total };
		}

		// First time connecting (no known epoch) — record it, no resync needed
		if (serverEpoch > 0) setLastKnownEpoch(serverEpoch);

		console.log(`[Replication] checkServerState() — total=${total}, epoch=${serverEpoch}, no resync needed`);
		return { needsResync: false, epoch: serverEpoch, total };
	} catch (err) {
		console.log('[Replication] checkServerState() — fetch error, assuming no resync needed:', err);
		return { needsResync: false, epoch: 0, total: 0 };
	}
}

async function getServerCounts(): Promise<Record<string, number>> {
	try {
		const res = await fetch(`${getServerUrl()}/api/replication/status`);
		if (!res.ok) return {};
		const data = await res.json();
		return data.counts ?? {};
	} catch {
		return {};
	}
}

// ─── Start replication ──────────────────────────────────────────────────────

export async function startReplication(db: RxDatabase, options?: { generation?: number; collections?: string[] }) {
	// Count local docs so the server console can see if this device has data to push
	const localCounts: Record<string, number> = {};
	let localTotal = 0;
	for (const name of REPLICATED_COLLECTIONS) {
		const col = db.collections[name];
		if (col) {
			try {
				const count = await col.count().exec();
				if (count > 0) localCounts[name] = count;
				localTotal += count;
			} catch { /* noop */ }
		}
	}

	remoteLog('info', `startReplication() entered`, {
		hasGenOption: !!options?.generation,
		alreadyStarting: _global.__wtfposRepl.startingReplication,
		alreadyStarted: _global.__wtfposRepl.replicationStarted,
		localTotal,
		localCounts,
		isServer: isServerBrowser(),
	});

	// Skip if replication is already running with active SSE and live replication instances.
	// This prevents duplicate SSE connections on SvelteKit page navigation.
	// BUT: allow re-start if forced (generation bump), or if replications are dead (HMR killed them).
	if (!options?.generation && _global.__wtfposRepl.replicationStarted) {
		const es = getSharedEventSource();
		const esAlive = es && es.readyState !== EventSource.CLOSED;
		const hasActiveReps = activeReplications.size > 0;
		if (esAlive && hasActiveReps) {
			console.log('[Replication] Already running with active SSE — skipping duplicate start');
			remoteLog('info', 'startReplication() skipped — already running');
			return;
		}
		// SSE or replications are dead (e.g. after HMR) — allow restart
		console.log(`[Replication] Stale state detected (sse=${esAlive}, reps=${activeReplications.size}) — restarting`);
		_global.__wtfposRepl.replicationStarted = false;
	}

	// Prevent concurrent starts (HMR reloads can trigger multiple calls)
	if (_global.__wtfposRepl.startingReplication && !options?.generation) {
		console.log('[Replication] Already starting — skipping duplicate call');
		remoteLog('warn', 'startReplication() blocked by startingReplication guard');
		return;
	}
	_global.__wtfposRepl.startingReplication = true;
	const serverUrl = getServerUrl();
	const gen = options?.generation ?? getSyncGeneration();

	remoteLog('info', `startReplication() proceeding`, { gen, breakerState: serverBreaker.getState(), localTotal });

	// ── Always reset circuit breaker + retry counters on fresh start ──
	// This prevents stale failures (e.g. from a zombie server) from blocking the new sync.
	serverBreaker.reset();
	retryAttempts.clear();

	// Check if server restarted or is empty — either requires a full re-sync.
	// Skip if generation was explicitly passed — we're already in a recovery call
	// (prevents infinite recursion: empty server → bump → re-check → still empty → bump → ...)
	if (!options?.generation) {
		const { needsResync, total: storeTotal } = await checkServerState();
		if (needsResync) {
			console.log('[Replication] Server restart detected or store empty — bumping generation for full re-sync');
			const newGen = bumpSyncGeneration();
			return startReplication(db, { generation: newGen, collections: options?.collections });
		}

		// Case 3: Server device has way more local data than the replication store.
		// This happens after HMR reload or when the previous push was partial.
		// If local has 1683 docs but store only has 115, the store is stale — force re-push.
		if (isServerBrowser() && localTotal > 50 && storeTotal < localTotal * 0.5) {
			console.log(`[Replication] Server store is incomplete (store=${storeTotal}, local=${localTotal}) — bumping generation for full re-push`);
			remoteLog('warn', `Server store incomplete: ${storeTotal} in store vs ${localTotal} local — forcing full re-push`);
			const newGen = bumpSyncGeneration();
			return startReplication(db, { generation: newGen, collections: options?.collections });
		}
	} else {
		console.log(`[Replication] Recovery mode — generation=${gen}, skipping server state check`);
	}

	// Stop any leftover replications from a previous run (HMR reload, etc.)
	if (activeReplications.size > 0) {
		console.log(`[Replication] Cleaning up ${activeReplications.size} stale replications`);
		for (const rep of activeReplications.values()) {
			try { await rep.cancel(); } catch { /* noop */ }
		}
		activeReplications.clear();
	}
	const prevES = getSharedEventSource();
	if (prevES) {
		prevES.close();
		setSharedEventSource(null);
	}
	// Clear stale server poll interval (prevents duplicate polls after HMR)
	if (_global.__wtfposRepl.serverPollInterval) {
		clearInterval(_global.__wtfposRepl.serverPollInterval);
		_global.__wtfposRepl.serverPollInterval = null;
	}

	// Reset activity tracking
	activeStates.clear();
	emitActivity({ active: false, activeCount: 0, activeCollections: [], initialSyncDone: false, prioritySyncDone: false, completedCollections: [], totalCollections: 0, phase: 'Idle' });

	// Detect server device — uses polling instead of SSE (SSE to self is unstable on Vite)
	const isServerDevice = isServerBrowser();

	// If a collection whitelist is provided, only replicate those; otherwise replicate all
	const collectionsToSync = options?.collections
		? REPLICATED_COLLECTIONS.filter(name => options.collections!.includes(name))
		: REPLICATED_COLLECTIONS;

	// One Subject per collection — the shared SSE routes events to the right one
	const pullStreams = new Map<string, Subject<any>>();
	for (const name of collectionsToSync) {
		pullStreams.set(name, new Subject());
	}

	// Single SSE connection for ALL collections + broadcast signals.
	// ALL devices (including the server) use SSE for instant change delivery.
	// The server also keeps a slow safety-net poll to catch missed events after
	// SSE reconnections (EventSource auto-reconnects but missed events are lost).
	try {
		const es = new EventSource(`${serverUrl}/api/replication/stream`);
		setSharedEventSource(es);
		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				const stream = pullStreams.get(data.collection);
				if (stream) {
					stream.next({
						documents: data.documents,
						checkpoint: data.checkpoint
					});
				}
			} catch { /* parse error, ignore */ }
		};
		es.addEventListener('broadcast', (event: any) => {
			try {
				const data = JSON.parse(event.data);
				if (data.signal === 'RESET_ALL') {
					console.warn('[Replication] RESET_ALL received — full reset starting');
					performFullReset();
				} else if (data.signal === 'SYNC_CHECK') {
					console.log('[Replication] SYNC_CHECK received — reporting local counts');
					reportLocalCounts(db);
				}
			} catch { /* ignore */ }
		});
		es.onopen = () => {
			remoteLog('info', `SSE stream connected (${isServerDevice ? 'server' : 'client'})`);
			// On reconnect after a drop, do a gentle sequential resync of priority
			// collections to catch events missed during the disconnection gap.
			// This replaces the old "all-17-at-once" RESYNC storm.
			if (isServerDevice) {
				let delay = 0;
				for (const name of PRIORITY_COLLECTIONS) {
					const stream = pullStreams.get(name);
					if (stream) {
						setTimeout(() => stream.next('RESYNC'), delay);
						delay += 100; // stagger by 100ms to avoid connection saturation
					}
				}
			}
		};
		es.onerror = () => {
			if (isServerDevice) {
				// Server: DON'T fire RESYNC storm — EventSource auto-reconnects.
				// The onopen handler above will do a gentle catch-up.
				remoteLog('warn', 'SSE stream error — waiting for auto-reconnect');
			} else {
				// Client: trigger RESYNC to catch up (clients have more tolerance for
				// concurrent requests since they don't saturate their own server)
				remoteLog('warn', 'SSE stream error — triggering RESYNC');
				for (const stream of pullStreams.values()) {
					stream.next('RESYNC');
				}
			}
		};
	} catch (e) {
		console.warn('[Replication] SSE setup failed:', e);
	}

	// Server: slow safety-net poll (every 10s) to catch changes missed during SSE gaps.
	// This is a fallback only — SSE delivers changes instantly when connected.
	if (isServerDevice) {
		const pollInterval = setInterval(() => {
			// Only resync secondary collections (priority ones get SSE events instantly
			// and are also caught by the onopen handler above)
			for (const name of SECONDARY_COLLECTIONS) {
				const stream = pullStreams.get(name);
				if (stream) stream.next('RESYNC');
			}
		}, 10_000);
		_global.__wtfposRepl.serverPollInterval = pollInterval;
	}

	// LAN clients: safety-net poll (every 30s) to catch changes missed when
	// mobile browsers throttle/kill the SSE connection in background tabs.
	// Priority collections only — these are what the POS floor + kitchen need.
	if (!isServerDevice) {
		// Clear any previous client poll interval (HMR safety)
		if (_global.__wtfposRepl.clientPollInterval) {
			clearInterval(_global.__wtfposRepl.clientPollInterval);
			_global.__wtfposRepl.clientPollInterval = null;
		}
		const clientPoll = setInterval(() => {
			for (const name of PRIORITY_COLLECTIONS) {
				const stream = pullStreams.get(name);
				if (stream) stream.next('RESYNC');
			}
		}, 30_000);
		_global.__wtfposRepl.clientPollInterval = clientPoll;

		// Wake-up recovery: when a mobile browser tab becomes visible again after
		// being backgrounded, the SSE stream is often dead. Immediately resync
		// all priority collections so stale data (old KDS tickets, missing orders)
		// gets replaced within seconds of the user looking at the screen.
		if (typeof document !== 'undefined') {
			// Remove previous listener if any (HMR safety)
			if (_global.__wtfposRepl.visibilityHandler) {
				document.removeEventListener('visibilitychange', _global.__wtfposRepl.visibilityHandler);
			}
			const visibilityHandler = () => {
				if (document.visibilityState !== 'visible') return;
				remoteLog('info', 'Tab became visible — triggering priority resync');
				// Stagger resyncs to avoid a burst of concurrent fetches
				let delay = 0;
				for (const name of PRIORITY_COLLECTIONS) {
					const stream = pullStreams.get(name);
					if (stream) {
						setTimeout(() => stream.next('RESYNC'), delay);
						delay += 150;
					}
				}
				// Also resync secondary collections after priority ones settle
				setTimeout(() => {
					for (const name of SECONDARY_COLLECTIONS) {
						const stream = pullStreams.get(name);
						if (stream) stream.next('RESYNC');
					}
				}, delay + 500);
			};
			document.addEventListener('visibilitychange', visibilityHandler);
			_global.__wtfposRepl.visibilityHandler = visibilityHandler;
		}
	}

	// Set up replication per collection
	let started = 0;
	const initialSyncPromises: Promise<void>[] = [];
	const completedSyncCollections = new Set<string>();

	// Emit initial phase with total count
	emitActivity({
		...currentActivity,
		totalCollections: collectionsToSync.length,
		completedCollections: [],
		phase: 'Starting replication...',
	});

	for (const name of collectionsToSync) {
		const collection = db.collections[name];
		if (!collection) continue;

		activeStates.set(name, false);

		retryAttempts.set(name, 0);

		// All devices get push + pull. Server uses poll-based stream$ (no SSE to itself).
		// LAN clients use SSE-based stream$ for instant updates.
		const replicationState = replicateRxCollection({
			collection,
			replicationIdentifier: `wtfpos-lan-${name}-g${gen}`,
			live: true,
			retryTime: 1_000, // LAN is fast — retry quickly (1s)
			autoStart: true,

			pull: {
				async handler(checkpointOrNull: Checkpoint | null | undefined, batchSize: number) {
					const breakerState = serverBreaker.getState();
					if (breakerState !== 'closed' && shouldLogBreakerOpen()) {
						remoteLog('warn', `Pull ${name}: breaker is ${breakerState}`, { breakerState });
					}
					return serverBreaker.execute(async () => {
						const params = new URLSearchParams({ limit: String(batchSize) });
						if (checkpointOrNull) {
							params.set('updatedAt', checkpointOrNull.updatedAt);
							params.set('id', checkpointOrNull.id);
						}
						const res = await fetch(`${serverUrl}/api/replication/${name}/pull?${params}`);
						if (!res.ok) throw new Error(`Pull ${name} failed: ${res.status}`);
						retryAttempts.set(name, 0); // reset on success
						const data = await res.json();
						// Sanitize _meta.lwt: large integers fail RxDB's `multipleOf: 0.01`
						// check due to IEEE 754 precision (e.g. 1773406037049 % 0.01 → 0.009…).
						if (data.documents) {
							for (const doc of data.documents) {
								if (doc._meta?.lwt) {
									doc._meta.lwt = Math.round(doc._meta.lwt * 100) / 100;
								}
							}
						}
						return data;
					});
				},
				batchSize: 500,
				stream$: pullStreams.get(name)!.asObservable()
			},

			push: {
				async handler(changeRows) {
					return serverBreaker.execute(async () => {
						const res = await fetch(`${serverUrl}/api/replication/${name}/push`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(changeRows)
						});
						if (!res.ok) throw new Error(`Push ${name} failed: ${res.status}`);
						retryAttempts.set(name, 0); // reset on success
						const conflicts = await res.json();
						// Sanitize _meta.lwt in conflict docs (same IEEE 754 issue as pull)
						if (Array.isArray(conflicts)) {
							for (const doc of conflicts) {
								if (doc._meta?.lwt) {
									doc._meta.lwt = Math.round(doc._meta.lwt * 100) / 100;
								}
							}
						}
						return conflicts;
					});
				},
				batchSize: 200 // LAN is fast — larger batches reduce round-trips
			}
		});

		// Track active state for this collection
		replicationState.active$.subscribe((isActive: boolean) => {
			activeStates.set(name, isActive);
			updateActivity();
		});

		replicationState.error$.subscribe((err: any) => {
			const attempt = (retryAttempts.get(name) ?? 0) + 1;
			retryAttempts.set(name, attempt);
			const nextRetry = Math.round(calculateBackoff(attempt));
			const errMsg = err?.parameters?.errors?.[0]?.message ?? err?.message ?? String(err);
			console.warn(`[Replication] ${name} error (attempt ${attempt}, next retry ~${nextRetry}ms):`, errMsg);

			// Breaker-open errors are repetitive (13 collections × every retry) — throttle them
			const isBreakerOpen = errMsg.includes('Circuit breaker is open');
			if (isBreakerOpen && !shouldLogBreakerOpen()) return;

			remoteLog('error', `${name} replication error (attempt ${attempt})`, {
				message: errMsg,
				breakerState: serverBreaker.getState(),
				nextRetryMs: nextRetry,
				innerType: err?.parameters?.errors?.[0]?.constructor?.name,
				rxdbCode: err?.code,
			});
		});

		// Track initial sync completion (per-collection for progress display).
		// awaitInitialReplication() never rejects — it hangs forever if replication
		// keeps erroring (circuit breaker, network issues). Race with a 30s timeout
		// so one stuck collection doesn't block the entire overlay.
		const PER_COLLECTION_TIMEOUT_MS = 30_000;
		const awaitWithTimeout = Promise.race([
			replicationState.awaitInitialReplication().then(() => 'synced' as const),
			new Promise<'timeout'>(resolve =>
				setTimeout(() => resolve('timeout'), PER_COLLECTION_TIMEOUT_MS)
			),
		]);

		initialSyncPromises.push(
			awaitWithTimeout.then((result) => {
				completedSyncCollections.add(name);
				const label = result === 'timeout' ? 'timed out' : 'synced';
				emitActivity({
					...currentActivity,
					completedCollections: [...completedSyncCollections],
					phase: result === 'timeout'
						? `${name} ${label} (${completedSyncCollections.size}/${collectionsToSync.length})`
						: `Synced ${name} (${completedSyncCollections.size}/${collectionsToSync.length})`,
				});
				if (result === 'timeout') {
					console.warn(`[Replication] ${name} initial sync timed out after ${PER_COLLECTION_TIMEOUT_MS / 1000}s — counting as done`);
					remoteLog('warn', `${name} awaitInitialReplication() timed out — counting as done`);
				}
			}).catch(() => {
				// non-fatal — collection will keep retrying in background
				completedSyncCollections.add(name); // count as done to avoid hanging
				emitActivity({
					...currentActivity,
					completedCollections: [...completedSyncCollections],
					phase: `${name} skipped (${completedSyncCollections.size}/${collectionsToSync.length})`,
				});
			})
		);

		activeReplications.set(name, replicationState);
		started++;

		// (Removed: "first activity detected" remoteLog — fires 13× per reconnect with zero diagnostic value)
	}

	_global.__wtfposRepl.startingReplication = false;
	_global.__wtfposRepl.replicationStarted = true;
	const streamType = isServerDevice ? 'SSE+poll/10s' : 'SSE';
	console.log(`[Replication] Started push+pull for ${started} collections (gen=${gen}, ${streamType}, ${localTotal} local docs)${options?.generation ? ' — full re-push triggered' : ''}`);
	remoteLog('info', `Replication started push+pull (${streamType}) | ${localTotal} local docs${isServerDevice ? ' (SERVER — canonical data source)' : ' (LAN client)'}${localTotal === 0 ? ' ⚠️ LOCAL DB EMPTY — needs data from server' : ''}`, {
		collections: started,
		gen,
		fullRePush: !!options?.generation,
		localTotal,
		localCounts,
		isServerDevice,
	});

	// ── REPLICATION DIAGNOSTIC: Push + Pull + Local RxDB verification ──────
	// Runs on ALL devices (server + LAN clients). Reports to server console.
	// Phase 1: Direct HTTP pull test (does the API return data?)
	// Phase 2: Local RxDB count (did replication actually write data locally?)
	// Phase 3: Push test (can this device push data to the server?)
	setTimeout(async () => {
		const deviceLabel = isServerDevice ? 'SERVER' : 'CLIENT';
		const testCols = ['tables', 'menu_items', 'orders', 'kds_tickets', 'floor_elements'];

		// ── Phase 1: HTTP Pull Test — can we pull from the server API? ──
		const pullResults: { col: string; apiDocs: number; err?: string }[] = [];
		for (const col of testCols) {
			try {
				const res = await fetch(`${serverUrl}/api/replication/${col}/pull?limit=500`);
				if (!res.ok) {
					pullResults.push({ col, apiDocs: 0, err: `HTTP ${res.status}` });
					continue;
				}
				const data = await res.json();
				pullResults.push({ col, apiDocs: data.documents?.length ?? 0 });
			} catch (err: any) {
				pullResults.push({ col, apiDocs: 0, err: err.message });
			}
		}
		const pullSummary = pullResults.map(r =>
			`${r.apiDocs > 0 ? '✅' : '❌'} ${r.col}:${r.apiDocs}${r.err ? `(${r.err})` : ''}`
		).join('  ');
		const pullTotal = pullResults.reduce((s, r) => s + r.apiDocs, 0);
		remoteLog(pullTotal > 0 ? 'info' : 'error',
			`[${deviceLabel}] 📥 PULL TEST: ${pullSummary}`,
			{ pullResults }
		);

		// ── Phase 2: Local RxDB Count — did replication write data? ──
		const localResults: { col: string; local: number }[] = [];
		for (const col of testCols) {
			const collection = db.collections[col];
			if (!collection) { localResults.push({ col, local: -1 }); continue; }
			try {
				const count = await collection.count().exec();
				localResults.push({ col, local: count });
			} catch { localResults.push({ col, local: -1 }); }
		}
		const localSummary = localResults.map(r => {
			const apiDocs = pullResults.find(p => p.col === r.col)?.apiDocs ?? 0;
			const match = r.local >= apiDocs && r.local >= 0;
			return `${match ? '✅' : '❌'} ${r.col}:${r.local}/${apiDocs}`;
		}).join('  ');
		const localTotal = localResults.reduce((s, r) => s + Math.max(0, r.local), 0);
		remoteLog(localTotal > 0 ? 'info' : 'error',
			`[${deviceLabel}] 💾 LOCAL DB: ${localSummary} (local/server)`,
			{ localResults }
		);

		// ── Phase 3: Push Test — verify push endpoint responds (no store pollution) ──
		try {
			// Send an empty push to test connectivity — server returns [] for empty input
			const pushRes = await fetch(`${serverUrl}/api/replication/tables/push`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify([])
			});
			remoteLog(pushRes.ok ? 'info' : 'error',
				`[${deviceLabel}] 📤 PUSH TEST: ${pushRes.ok ? '✅' : '❌'} endpoint ${pushRes.ok ? 'reachable' : `HTTP ${pushRes.status}`}`
			);
		} catch (err: any) {
			remoteLog('error', `[${deviceLabel}] 📤 PUSH TEST: ❌ ${err.message}`);
		}

		// ── Server store totals for context ──
		try {
			const statusRes = await fetch(`${serverUrl}/api/replication/status`);
			if (statusRes.ok) {
				const status = await statusRes.json();
				remoteLog('info', `[${deviceLabel}] 📊 SERVER STORE: ${status.total} total docs | ${Object.entries(status.counts as Record<string, number>).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ')}`);
			}
		} catch { /* noop */ }
	}, 5_000);

	// Mark priority sync done when critical collections finish first
	const priorityPromises = PRIORITY_COLLECTIONS
		.filter(name => activeReplications.has(name))
		.map(name => activeReplications.get(name)!.awaitInitialReplication().catch(() => {}));

	Promise.allSettled(priorityPromises).then(() => {
		emitActivity({
			...currentActivity,
			prioritySyncDone: true,
			phase: 'Priority collections ready — syncing secondary...',
		});
		console.log('[Replication] Priority collections synced (tables, orders, menu, floor, kds, devices)');
	});

	// Mark initial sync done when all collections finish their first pull
	Promise.allSettled(initialSyncPromises).then(() => {
		emitActivity({
			...currentActivity,
			initialSyncDone: true,
			prioritySyncDone: true,
			completedCollections: [...completedSyncCollections],
			phase: 'All collections synced — server ready!',
		});
		console.log('[Replication] Initial sync complete for all collections');

		// Server: broadcast SERVER_READY so clients waiting after a reset can proceed
		if (isServerDevice) {
			fetch(`${serverUrl}/api/replication/server-ready`, { method: 'POST' })
				.then(() => console.log('[Replication] SERVER_READY broadcast sent'))
				.catch(() => console.warn('[Replication] Failed to broadcast SERVER_READY'));

			// Clear the "preparing" flag and overlay if this was a post-reset reload
			try {
				if (localStorage.getItem('wtfpos_server_preparing')) {
					localStorage.removeItem('wtfpos_server_preparing');
					const overlay = document.getElementById('wtfpos-reset-overlay');
					if (overlay) overlay.remove();
					console.log('[Replication] Server preparation complete — overlay removed');
				}
			} catch { /* noop */ }
		}
	});

	// ── Auto-recovery: if priority sync hasn't completed in 15s, clear DB and reload ──
	// This handles stale state that prevents replication from working.
	// Server device skips — its IDB is canonical and doesn't need recovery.
	if (isServerDevice) return;
	setTimeout(async () => {
		if (currentActivity.prioritySyncDone) return; // sync worked — nothing to do

		// Check if server is reachable and has data
		try {
			const res = await fetch(`${serverUrl}/api/replication/status`);
			if (!res.ok) return;
			const data = await res.json();
			if ((data.total ?? 0) < 10) return; // server has no data, nothing to recover

			// Check local data — if we have tables/menu locally, sync might just be slow
			const tablesCol = db.collections['tables'];
			const menuCol = db.collections['menu_items'];
			const localTables = tablesCol ? await tablesCol.count().exec() : 0;
			const localMenu = menuCol ? await menuCol.count().exec() : 0;
			if (localTables > 0 && localMenu > 0) return; // has local data — sync is just slow

			console.warn('[Replication] Auto-recovery: server has data but local DB is empty after 15s — clearing stale DB');
			// Clear sync state
			try { localStorage.removeItem('wtfpos-sync-gen'); } catch { /* noop */ }
			try { localStorage.removeItem('wtfpos-sync-epoch'); } catch { /* noop */ }
			try { localStorage.removeItem(LAST_EPOCH_KEY); } catch { /* noop */ }
			try { localStorage.removeItem('wtfpos_server_epoch'); } catch { /* noop */ }

			// Delete IndexedDB and reload
			await db.remove().catch(() => {});
			window.location.reload();
		} catch { /* server unreachable — don't auto-recover */ }
	}, 15_000);
}

// ─── Await / verify helpers ─────────────────────────────────────────────────

async function awaitInitialSync(timeoutMs = 120_000): Promise<{ ok: number; failed: string[] }> {
	if (activeReplications.size === 0) return { ok: 0, failed: [] };

	const entries = [...activeReplications.entries()];
	const results = await Promise.allSettled(
		entries.map(([, rep]) =>
			Promise.race([
				rep.awaitInitialReplication(),
				new Promise<void>((_, reject) =>
					setTimeout(() => reject(new Error('timeout')), timeoutMs)
				)
			])
		)
	);

	const failed: string[] = [];
	let ok = 0;
	for (let i = 0; i < results.length; i++) {
		if (results[i].status === 'fulfilled') {
			ok++;
		} else {
			failed.push(entries[i][0]);
		}
	}

	return { ok, failed };
}

async function verifySync(db: RxDatabase): Promise<{ collection: string; local: number; server: number }[]> {
	const serverCounts = await getServerCounts();
	const behind: { collection: string; local: number; server: number }[] = [];

	for (const name of REPLICATED_COLLECTIONS) {
		const col = db.collections[name];
		if (!col) continue;
		const serverCount = serverCounts[name] ?? 0;
		if (serverCount === 0) continue;

		const localCount = await col.count().exec();
		const tolerance = Math.max(5, Math.ceil(serverCount * 0.02));
		if (serverCount - localCount > tolerance) {
			behind.push({ collection: name, local: localCount, server: serverCount });
		}
	}

	return behind;
}

// ─── Stop / force sync ──────────────────────────────────────────────────────

export async function stopReplication() {
	_global.__wtfposRepl.replicationStarted = false;
	_global.__wtfposRepl.startingReplication = false;
	getSharedEventSource()?.close();
	setSharedEventSource(null);
	// Clear server polling interval if active
	if (_global.__wtfposRepl.serverPollInterval) {
		clearInterval(_global.__wtfposRepl.serverPollInterval);
		_global.__wtfposRepl.serverPollInterval = null;
	}
	// Clear client polling interval if active
	if (_global.__wtfposRepl.clientPollInterval) {
		clearInterval(_global.__wtfposRepl.clientPollInterval);
		_global.__wtfposRepl.clientPollInterval = null;
	}
	// Remove visibility change listener
	if (_global.__wtfposRepl.visibilityHandler && typeof document !== 'undefined') {
		document.removeEventListener('visibilitychange', _global.__wtfposRepl.visibilityHandler);
		_global.__wtfposRepl.visibilityHandler = null;
	}
	for (const rep of activeReplications.values()) {
		try { await rep.cancel(); } catch { /* noop */ }
	}
	activeReplications.clear();
	activeStates.clear();
	emitActivity({ active: false, activeCount: 0, activeCollections: [], initialSyncDone: false, prioritySyncDone: false, completedCollections: [], totalCollections: 0, phase: 'Idle' });
}

/**
 * Report local RxDB collection test results to the server for remote sync check.
 * For each collection: count local docs, test read (pull from server), test write (push + verify + cleanup).
 * Called when receiving SYNC_CHECK broadcast from the SSE stream.
 */
async function reportLocalCounts(db: any) {
	try {
		const collections: Record<string, any> = {};
		const collectionNames = Object.keys(db.collections || {});

		for (const name of collectionNames) {
			let localCount = -1;
			let readOk = false;
			let readMs: number | null = null;
			let writeOk = false;
			let writeMs: number | null = null;
			let error: string | null = null;

			// Count local docs
			try {
				const docs = await db.collections[name].find().exec();
				localCount = docs.length;
			} catch { /* collection not accessible */ }

			// Test READ: pull from server
			try {
				const readStart = performance.now();
				const res = await fetch(`/api/replication/${name}/pull?limit=1`, {
					signal: AbortSignal.timeout(5_000),
				});
				readMs = Math.round(performance.now() - readStart);
				readOk = res.ok;
			} catch (err: any) {
				error = `read: ${err.message || 'failed'}`;
			}

			// Test WRITE: push a probe doc, verify via read, cleanup
			try {
				const testId = `__syncprobe_${name}_${Date.now()}`;
				const writeStart = performance.now();

				// Build a minimal valid doc for this collection
				const probeDoc: any = {
					id: testId,
					updatedAt: new Date().toISOString(),
					locationId: 'test',
				};
				// stock_counts needs stockItemId and date fields for schema validation
				if (name === 'stock_counts') {
					probeDoc.stockItemId = testId;
					probeDoc.date = new Date().toISOString().slice(0, 10);
				}

				// Push
				const pushRes = await fetch(`/api/replication/${name}/push`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify([{
						newDocumentState: probeDoc,
						assumedMasterState: null,
					}]),
					signal: AbortSignal.timeout(5_000),
				});

				if (pushRes.ok) {
					// Verify it's in the server store
					const verifyRes = await fetch(`/api/replication/${name}/pull?limit=1000`, {
						signal: AbortSignal.timeout(5_000),
					});
					if (verifyRes.ok) {
						const data = await verifyRes.json();
						const docs = data.documents ?? [];
						const found = docs.some((d: any) => d.id === testId);
						writeOk = found;
					}

					// Cleanup: push _deleted version
					await fetch(`/api/replication/${name}/push`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify([{
							newDocumentState: { ...probeDoc, _deleted: true, updatedAt: new Date().toISOString() },
							assumedMasterState: probeDoc,
						}]),
						signal: AbortSignal.timeout(3_000),
					}).catch(() => {});
				}

				writeMs = Math.round(performance.now() - writeStart);
			} catch (err: any) {
				error = (error ? error + '; ' : '') + `write: ${err.message || 'failed'}`;
			}

			collections[name] = { localCount, readOk, readMs, writeOk, writeMs, error };
		}

		await fetch('/api/replication/sync-check', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ collections }),
			signal: AbortSignal.timeout(5_000),
		});
		console.log('[Replication] Sync check report sent:', Object.keys(collections).length, 'collections');
	} catch (err) {
		console.warn('[Replication] Failed to report sync check:', err);
	}
}

/**
 * Full reset: stop replication, clear sync state, delete IndexedDB, reload.
 * Called when receiving RESET_ALL broadcast OR directly from the admin UI.
 *
 * Server device: shows "Preparing server..." overlay, reloads immediately.
 *   After reload, getDb() seeds → startReplication() pushes → broadcasts SERVER_READY.
 *
 * Client device: shows "Waiting on server..." overlay, waits for SERVER_READY
 *   broadcast, THEN deletes local DB and reloads to sync from populated server.
 */
export async function performFullReset() {
	console.log('[Replication] performFullReset() — stopping replication');

	const isServer = isServerBrowser();

	// Broadcast to other tabs on this device so they also clear and reload
	try {
		if (typeof BroadcastChannel !== 'undefined') {
			const ch = new BroadcastChannel('wtfpos-reset');
			ch.postMessage('RESET_ALL');
			ch.close();
		}
	} catch { /* noop */ }

	if (isServer) {
		// ── SERVER: prepare immediately ──────────────────────────────────
		showResetOverlay('server');
		// Flag survives reload — tells the server to show overlay until store is populated
		try { localStorage.setItem('wtfpos_server_preparing', '1'); } catch { /* noop */ }
		await stopReplication();
		clearSyncKeys();
		await deleteLocalDb();
		try { sessionStorage.clear(); } catch { /* noop */ }
		console.log('[Replication] Server reloading for fresh seed...');
		window.location.reload();
	} else {
		// ── CLIENT: wait for server to finish preparing ──────────────────
		showResetOverlay('client');
		await stopReplication();

		// Listen for SERVER_READY via SSE before proceeding
		console.log('[Replication] Client waiting for SERVER_READY broadcast...');
		await waitForServerReady();

		// Server is populated — safe to delete local DB and resync
		updateOverlayStatus('Server ready — resyncing...');
		clearSyncKeys();
		await deleteLocalDb();
		try { sessionStorage.clear(); } catch { /* noop */ }
		console.log('[Replication] Client reloading to sync from populated server...');
		window.location.reload();
	}
}

function showResetOverlay(mode: 'server' | 'client') {
	if (typeof document === 'undefined') return;

	const emoji = mode === 'server' ? '🔧' : '⏳';
	const title = mode === 'server' ? 'PREPARING SERVER' : 'WAITING ON SERVER';
	const subtitle = mode === 'server'
		? 'Reseeding database and populating server store...'
		: 'Server is resetting — your data will sync once ready...';

	const overlay = document.createElement('div');
	overlay.id = 'wtfpos-reset-overlay';
	overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111827;color:white;gap:clamp(12px,3vw,24px);padding:24px;text-align:center';
	overlay.innerHTML = `
		<div style="font-size:clamp(48px,12vw,96px)">${emoji}</div>
		<div style="font-size:clamp(28px,8vw,64px);font-weight:900;letter-spacing:2px;line-height:1.1">${title}</div>
		<div id="wtfpos-reset-status" style="font-size:clamp(14px,3vw,24px);color:#9ca3af;max-width:90vw">${subtitle}</div>
		<div style="margin-top:clamp(8px,2vw,20px);width:clamp(36px,8vw,64px);height:clamp(36px,8vw,64px);border:4px solid #374151;border-top-color:#f97316;border-radius:50%;animation:spin 0.8s linear infinite"></div>
		<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
	`;
	document.body.appendChild(overlay);
}

function updateOverlayStatus(message: string) {
	const el = document.getElementById('wtfpos-reset-status');
	if (el) el.textContent = message;
}

/** Wait for SERVER_READY broadcast via a temporary SSE connection. */
function waitForServerReady(): Promise<void> {
	return new Promise((resolve) => {
		// Safety timeout: don't hang forever (60s)
		const timeout = setTimeout(() => {
			console.warn('[Replication] SERVER_READY timeout — proceeding anyway');
			es.close();
			resolve();
		}, 60_000);

		const es = new EventSource(`${getServerUrl()}/api/replication/stream`);

		es.addEventListener('broadcast', (event: any) => {
			try {
				const data = JSON.parse(event.data);
				if (data.signal === 'SERVER_READY') {
					console.log('[Replication] SERVER_READY received — proceeding with reset');
					clearTimeout(timeout);
					es.close();
					resolve();
				}
			} catch { /* ignore */ }
		});

		es.onerror = () => {
			// SSE disconnected — server might be restarting. EventSource auto-reconnects.
			updateOverlayStatus('Server restarting — reconnecting...');
		};

		es.onopen = () => {
			updateOverlayStatus('Connected — waiting for server to finish preparing...');
		};
	});
}

function clearSyncKeys() {
	const SYNC_KEYS = [
		'wtfpos-sync-gen',
		'wtfpos-sync-epoch',
		LAST_EPOCH_KEY,
		'wtfpos_server_epoch',
		'wtfpos_expense_templates',   // seed gate — must clear so seeder re-runs
		'wtfpos_yield_overrides',     // stock yield config — may reference deleted items
		'wtfpos_server_preparing',    // reset overlay flag — can get stuck
	];
	for (const key of SYNC_KEYS) {
		try { localStorage.removeItem(key); } catch { /* noop */ }
	}
	console.log('[Replication] Cleared sync localStorage keys');
}

async function deleteLocalDb() {
	try {
		const { getDb, clearDbPromise } = await import('$lib/db');
		const db = await getDb();
		// Close first to release IDB connections — prevents onblocked during remove
		try { await db.close(); } catch { /* noop */ }
		await db.remove();
		clearDbPromise();
		console.log('[Replication] RxDB database removed via db.close() + db.remove()');
	} catch {
		console.log('[Replication] Falling back to indexedDB.deleteDatabase()');
		// Still null out the promise so getDb() doesn't return a dead instance
		try {
			const { clearDbPromise } = await import('$lib/db');
			clearDbPromise();
		} catch { /* noop */ }
		await new Promise<void>((resolve) => {
			const req = window.indexedDB.deleteDatabase('wtfpos_db');
			req.onsuccess = () => resolve();
			req.onerror = () => resolve();
			req.onblocked = () => {
				console.warn('[Replication] IndexedDB delete blocked — open connections preventing delete');
				resolve();
			};
			setTimeout(resolve, 5000);
		});
	}
}

/** Get the active replication state for a specific collection (for targeted reSync). */
export function getActiveReplication(name: string): any | undefined {
	return activeReplications.get(name);
}

export async function forceFullSync(
	onProgress?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
	const { getDb } = await import('$lib/db');
	const db = await getDb();

	onProgress?.('Stopping current sync...');
	await stopReplication();

	const gen = bumpSyncGeneration();
	onProgress?.('Starting fresh sync...');
	console.log(`[Replication] Force sync — new generation ${gen}`);

	await startReplication(db as any, { generation: gen });

	onProgress?.('Downloading all records from server...');
	const { ok, failed } = await awaitInitialSync(120_000);
	console.log(`[Replication] Initial sync: ${ok} ok, ${failed.length} failed [${failed.join(', ')}]`);

	onProgress?.('Verifying sync completeness...');
	let behind = await verifySync(db as any);

	if (behind.length > 0) {
		console.warn(`[Replication] Verification: ${behind.length} collections still behind:`, behind);
		onProgress?.(`Retrying ${behind.length} incomplete collections...`);

		await new Promise(r => setTimeout(r, 3000));
		behind = await verifySync(db as any);
	}

	if (behind.length > 0) {
		console.warn(`[Replication] Still behind after retry:`, behind);
		onProgress?.('Forcing second sync pass...');

		await stopReplication();
		const gen2 = bumpSyncGeneration();
		await startReplication(db as any, { generation: gen2 });
		await awaitInitialSync(120_000);

		await new Promise(r => setTimeout(r, 2000));
		behind = await verifySync(db as any);
	}

	if (behind.length === 0) {
		console.log('[Replication] Force sync verified — all collections match server');
		return { success: true, message: 'All records synced successfully' };
	}

	const totalMissing = behind.reduce((sum, b) => sum + (b.server - b.local), 0);
	const msg = `${behind.length} collection${behind.length > 1 ? 's' : ''} still behind (${totalMissing} docs). Try refreshing the page.`;
	console.warn(`[Replication] Force sync incomplete: ${msg}`, behind);
	return { success: false, message: msg };
}
