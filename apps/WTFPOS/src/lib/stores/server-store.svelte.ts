import { browser } from '$app/environment';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SseChangeEvent {
	collection: string;
	documents: any[];
	checkpoint: { id: string; updatedAt: string } | null;
}

interface BroadcastEvent {
	signal: string;
}

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

type CollectionCallback = (documents: any[]) => void;
type ReconnectCallback = () => void;

interface ServerStoreOpts<T> {
	filter?: { locationId?: string };
	sort?: (a: T, b: T) => number;
	primaryKey?: string;
}

// ─── SSE Manager (lazy singleton) ────────────────────────────────────────────

class SseManager {
	connectionState = $state<ConnectionState>('disconnected');

	private es: EventSource | null = null;
	private collectionCallbacks = new Map<string, Set<CollectionCallback>>();
	private reconnectCallbacks = new Set<ReconnectCallback>();
	private wasConnected = false;

	connect() {
		if (!browser) return;
		if (this.es) return; // already connected or connecting

		this.connectionState = 'reconnecting';
		const es = new EventSource('/api/replication/stream');
		this.es = es;

		es.onopen = () => {
			const needsRefresh = this.wasConnected;
			this.wasConnected = true;
			this.connectionState = 'connected';

			if (needsRefresh) {
				// Reconnected after a drop — notify stores to re-fetch snapshots
				for (const cb of this.reconnectCallbacks) {
					try { cb(); } catch { /* noop */ }
				}
			}
		};

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data) as SseChangeEvent;
				const callbacks = this.collectionCallbacks.get(data.collection);
				if (callbacks) {
					for (const cb of callbacks) {
						try { cb(data.documents); } catch { /* noop */ }
					}
				}
			} catch {
				// Ignore malformed messages (heartbeat comments won't reach here)
			}
		};

		// Listen for broadcast events (e.g. RESET_ALL)
		es.addEventListener('broadcast', (event) => {
			try {
				const data = JSON.parse((event as MessageEvent).data) as BroadcastEvent;
				if (data.signal === 'RESET_ALL') {
					// Trigger full re-fetch on all stores
					for (const cb of this.reconnectCallbacks) {
						try { cb(); } catch { /* noop */ }
					}
				}
			} catch { /* noop */ }
		});

		es.onerror = () => {
			// EventSource auto-reconnects. Mark state as reconnecting.
			if (this.connectionState === 'connected') {
				this.connectionState = 'reconnecting';
			}
		};
	}

	/**
	 * Register a callback for document changes on a specific collection.
	 * Returns an unsubscribe function.
	 */
	onCollectionChange(collection: string, cb: CollectionCallback): () => void {
		let set = this.collectionCallbacks.get(collection);
		if (!set) {
			set = new Set();
			this.collectionCallbacks.set(collection, set);
		}
		set.add(cb);
		return () => {
			set!.delete(cb);
			if (set!.size === 0) {
				this.collectionCallbacks.delete(collection);
			}
		};
	}

	/**
	 * Register a callback that fires on SSE reconnect (to re-fetch snapshots).
	 * Returns an unsubscribe function.
	 */
	onReconnect(cb: ReconnectCallback): () => void {
		this.reconnectCallbacks.add(cb);
		return () => this.reconnectCallbacks.delete(cb);
	}

	destroy() {
		if (this.es) {
			this.es.close();
			this.es = null;
		}
		this.collectionCallbacks.clear();
		this.reconnectCallbacks.clear();
		this.connectionState = 'disconnected';
		this.wasConnected = false;
	}
}

// Lazy singleton — created on first createServerStore() call
let _manager: SseManager | null = null;

function getManager(): SseManager {
	if (!_manager) {
		_manager = new SseManager();
		_manager.connect();
	}
	return _manager;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the reactive SSE connection state.
 * Only meaningful after at least one `createServerStore()` call has initialized the manager.
 */
export function getSseConnectionState(): ConnectionState {
	if (!_manager) return 'disconnected';
	return _manager.connectionState;
}

/**
 * Fetches the initial snapshot for a collection from the bulk-read endpoint.
 */
async function fetchSnapshot<T>(
	collectionName: string,
	opts?: ServerStoreOpts<T>
): Promise<T[]> {
	const params = new URLSearchParams();
	if (opts?.filter?.locationId) {
		params.set('locationId', opts.filter.locationId);
	}
	const qs = params.toString();
	const url = `/api/collections/${collectionName}/read${qs ? `?${qs}` : ''}`;

	const res = await fetch(url);
	if (!res.ok) {
		console.error(`[ServerStore] Failed to fetch snapshot for ${collectionName}: ${res.status}`);
		return [];
	}

	const data = await res.json();
	// Endpoint may return { documents: [...] } or a raw array
	return Array.isArray(data) ? data : (data.documents ?? []);
}

/**
 * Creates a reactive Svelte 5 store backed by the SSE replication stream.
 * Same interface as `createRxStore`: `{ get value(): T[], get initialized(): boolean }`.
 *
 * On creation: fetches an initial snapshot from the bulk-read endpoint.
 * On SSE events: upserts documents into the internal map and updates the reactive array.
 * On SSE reconnect: re-fetches the full snapshot to catch any missed events.
 *
 * Usage:
 *   const orders = createServerStore<Order>('orders', { filter: { locationId: 'tag' } });
 *   // orders.value — reactive T[]
 *   // orders.initialized — true after first snapshot load
 */
export function createServerStore<T extends Record<string, any>>(
	collectionName: string,
	opts?: ServerStoreOpts<T>
) {
	const pkField = opts?.primaryKey ?? 'id';
	const sortFn = opts?.sort;

	let docs = $state<T[]>([]);
	let initialized = $state(false);

	// Internal map keyed by primary key for O(1) upserts
	const docMap = new Map<string, T>();

	/** Rebuild the reactive array from the internal map */
	function rebuildArray() {
		let arr = Array.from(docMap.values());
		if (sortFn) {
			arr.sort(sortFn);
		}
		docs = arr;
	}

	/** Upsert documents into the map and rebuild the reactive array */
	function upsertDocs(documents: T[]) {
		let changed = false;
		for (const doc of documents) {
			const key = doc[pkField] as string;
			if (!key) continue;

			// Apply locationId filter if configured
			if (opts?.filter?.locationId && doc.locationId !== opts.filter.locationId) {
				continue;
			}

			docMap.set(key, doc);
			changed = true;
		}
		if (changed) {
			rebuildArray();
		}
	}

	/** Load full snapshot, replacing all data */
	async function loadSnapshot() {
		try {
			const snapshot = await fetchSnapshot<T>(collectionName, opts);
			docMap.clear();
			for (const doc of snapshot) {
				const key = (doc as any)[pkField] as string;
				if (key) {
					docMap.set(key, doc);
				}
			}
			rebuildArray();
			initialized = true;
		} catch (err) {
			console.error(`[ServerStore] Snapshot load failed for ${collectionName}:`, err);
		}
	}

	if (browser) {
		const manager = getManager();

		// Fetch initial snapshot
		loadSnapshot();

		// Subscribe to SSE changes for this collection
		manager.onCollectionChange(collectionName, (documents: any[]) => {
			upsertDocs(documents as T[]);
		});

		// On reconnect, re-fetch the full snapshot to catch missed events
		manager.onReconnect(() => {
			loadSnapshot();
		});
	}

	return {
		get value(): T[] {
			return docs;
		},
		get initialized(): boolean {
			return initialized;
		}
	};
}
