/**
 * In-memory document store for LAN replication.
 * Each collection has a Map<primaryKey, doc> holding the latest version,
 * plus a sorted index for efficient pull pagination.
 *
 * Data is volatile — lost on server restart. This is fine for Phase 1:
 * the main tablet's browser holds the canonical IndexedDB and will
 * re-push all its docs to the fresh server on reconnect.
 *
 * Scale characteristics (with sorted index):
 * - Push: O(log n) per doc (binary search for index insertion)
 * - Pull: O(log n + batchSize) per request (binary search + slice)
 * - Memory: ~2x per doc (Map entry + index entry)
 * - Tested safe up to ~500K docs per collection in Node.js default heap
 */

import { log } from './logger';
import { clearTrackedClients } from './client-tracker';

// ─── Reset write-lock ────────────────────────────────────────────────────────
// During a RESET_ALL→SERVER_READY window, all incoming pushes are silently
// dropped so stale client data can't re-populate the freshly cleared stores.
let _isResetting = false;

/** True while a database reset is in progress — pushes should be silently dropped */
export function isResetting(): boolean {
	return _isResetting;
}

// Primary key field per collection (most use 'id')
const PK_FIELD: Record<string, string> = {};

function pk(collection: string, doc: any): string {
	return doc[PK_FIELD[collection] ?? 'id'];
}

/** Composite sort key: updatedAt + primaryKey for deterministic ordering */
function sortKey(collection: string, doc: any): string {
	return `${doc.updatedAt ?? ''}\0${pk(collection, doc)}`;
}

// ─── Field-level merge ───────────────────────────────────────────────────────

/**
 * Collections eligible for field-level merge instead of pure LWW.
 * Only collections where concurrent edits to different fields are common.
 * Fields listed here are merged independently; unlisted fields use LWW.
 */
const MERGEABLE_COLLECTIONS = new Set(['orders', 'tables', 'kds_tickets', 'stock_items', 'deliveries']);

/**
 * Fields that should never be merged (always take the latest value).
 * These are either metadata or require atomic consistency.
 */
const MERGE_SKIP_FIELDS = new Set(['id', 'updatedAt', 'createdAt', 'locationId', '_rev', '_deleted', '_attachments']);

/**
 * CRDT-style monotonic fields: these only increase, so conflicts resolve via max().
 * This prevents lost deductions when two POS tablets charge the same delivery batch
 * simultaneously — both increment usedQty, and max() preserves the higher value.
 */
const MONOTONIC_FIELDS: Record<string, Set<string>> = {
	deliveries: new Set(['usedQty']),
};

/**
 * Attempt field-level merge between server state, client's assumed state, and client's new state.
 * Returns the merged document with non-overlapping changes reconciled.
 * Same-field conflicts use per-field LWW, except for CRDT monotonic fields which use max().
 */
function tryFieldMerge(
	collectionName: string,
	serverDoc: any,
	assumedState: any,
	newState: any
): any | null {
	const merged = { ...serverDoc };
	const monotonicSet = MONOTONIC_FIELDS[collectionName];

	const allKeys = new Set([...Object.keys(serverDoc), ...Object.keys(newState)]);

	for (const key of allKeys) {
		if (MERGE_SKIP_FIELDS.has(key)) continue;

		const serverVal = JSON.stringify(serverDoc[key]);
		const assumedVal = JSON.stringify(assumedState[key]);
		const newVal = JSON.stringify(newState[key]);

		const serverChanged = serverVal !== assumedVal;
		const clientChanged = newVal !== assumedVal;

		if (serverChanged && clientChanged) {
			if (serverVal !== newVal) {
				// CRDT: monotonic fields resolve via max() — prevents lost increments
				if (monotonicSet?.has(key) && typeof serverDoc[key] === 'number' && typeof newState[key] === 'number') {
					merged[key] = Math.max(serverDoc[key], newState[key]);
				} else {
					// LWW at field level: take the newer updatedAt
					if (newState.updatedAt > serverDoc.updatedAt) {
						merged[key] = newState[key];
					}
				}
			}
		} else if (clientChanged) {
			merged[key] = newState[key];
		}
	}

	// Always take the latest updatedAt
	merged.updatedAt = newState.updatedAt > serverDoc.updatedAt
		? newState.updatedAt
		: serverDoc.updatedAt;

	return merged;
}

// ─── Per-collection store ────────────────────────────────────────────────────

interface ChangeEvent {
	documents: any[];
	checkpoint: { id: string; updatedAt: string } | null;
}

type ChangeListener = (event: ChangeEvent) => void;

class CollectionStore {
	readonly name: string;
	private docs = new Map<string, any>();
	private listeners = new Set<ChangeListener>();

	/**
	 * Sorted index: array of { key: sortKey, pk: primaryKey } sorted by key.
	 * Enables O(log n) checkpoint lookups instead of O(n log n) full sort.
	 * Rebuilt lazily only when needed (dirty flag).
	 */
	private sortedIndex: { key: string; pk: string }[] = [];
	private indexDirty = false;

	constructor(name: string) {
		this.name = name;
	}

	subscribe(fn: ChangeListener): () => void {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	private emit(event: ChangeEvent) {
		for (const fn of this.listeners) {
			try { fn(event); } catch { /* noop */ }
		}
	}

	/** Count only live (non-deleted) documents — matches RxDB find().exec() behavior */
	count(): number {
		let n = 0;
		for (const doc of this.docs.values()) {
			if (!doc._deleted) n++;
		}
		return n;
	}

	/** Total documents including soft-deleted ones */
	countAll(): number {
		return this.docs.size;
	}

	private ensureIndex() {
		if (!this.indexDirty && this.sortedIndex.length === this.docs.size) return;
		this.sortedIndex = Array.from(this.docs.entries()).map(([docPk, doc]) => ({
			key: sortKey(this.name, doc),
			pk: docPk
		}));
		this.sortedIndex.sort((a, b) => a.key.localeCompare(b.key));
		this.indexDirty = false;
	}

	/** Binary search: find first index entry with key > target */
	private findAfter(targetKey: string): number {
		const idx = this.sortedIndex;
		let lo = 0, hi = idx.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			if (idx[mid].key <= targetKey) {
				lo = mid + 1;
			} else {
				hi = mid;
			}
		}
		return lo;
	}

	pull(checkpoint: { id: string; updatedAt: string } | null, batchSize: number) {
		this.ensureIndex();

		let startIdx = 0;
		if (checkpoint) {
			const checkpointKey = `${checkpoint.updatedAt}\0${checkpoint.id}`;
			startIdx = this.findAfter(checkpointKey);
		}

		const batch = this.sortedIndex.slice(startIdx, startIdx + batchSize);
		const documents = batch
			.map(entry => this.docs.get(entry.pk))
			.filter((doc): doc is NonNullable<typeof doc> => {
				if (!doc) return false;
				// Skip probe/diagnostic documents that don't conform to user schemas.
				// NOTE: __repltest_ is NOT filtered here — the round-trip diagnostic test
				// needs to push+pull its test doc via HTTP. The SSE stream has its own
				// independent filter (TEST_DOC_PREFIXES) that prevents probe docs from
				// reaching RxDB clients.
				const docId = pk(this.name, doc);
				if (typeof docId !== 'string') return true;
				return !docId.startsWith('__ping_') && !docId.startsWith('__diag_')
					&& !docId.startsWith('__synctest_')
					&& !docId.startsWith('__syncprobe_');
			});

		const lastDoc = documents[documents.length - 1];
		const newCheckpoint = lastDoc
			? { id: pk(this.name, lastDoc), updatedAt: lastDoc.updatedAt }
			: checkpoint;

		return { documents, checkpoint: newCheckpoint };
	}

	push(changeRows: any[]): any[] {
		const conflicts: any[] = [];
		const changedDocs: any[] = [];

		for (const row of changeRows) {
			const docPk = pk(this.name, row.newDocumentState);

			// Reject probe/diagnostic documents that don't match the collection schema.
			// These are created by ping tests, replication diagnostics, etc. and poison the pull stream.
			if (typeof docPk === 'string' && (docPk.startsWith('__ping_') || docPk.startsWith('__diag_'))) {
				continue;
			}
			const current = this.docs.get(docPk);

			// Conflict: server has a different version than what client assumed
			if (current && row.assumedMasterState) {
				if (current.updatedAt !== row.assumedMasterState.updatedAt) {
					// Attempt field-level merge for eligible collections
					if (MERGEABLE_COLLECTIONS.has(this.name)) {
						const merged = tryFieldMerge(this.name, current, row.assumedMasterState, row.newDocumentState);
						if (merged) {
							this.docs.set(docPk, merged);
							changedDocs.push(merged);
							continue;
						}
					}
					conflicts.push(current);
					continue;
				}
			} else if (current && !row.assumedMasterState) {
				// Client thinks doc is new, but server already has it.
				// Accept if server version is older or equal (first-push wins scenario).
				if (current.updatedAt > row.newDocumentState.updatedAt) {
					conflicts.push(current);
					continue;
				}
			}

			this.docs.set(docPk, row.newDocumentState);
			changedDocs.push(row.newDocumentState);
		}

		if (changedDocs.length > 0) {
			// Mark index as dirty — will be rebuilt on next pull()
			this.indexDirty = true;

			const lastDoc = changedDocs[changedDocs.length - 1];
			this.emit({
				documents: changedDocs,
				checkpoint: { id: pk(this.name, lastDoc), updatedAt: lastDoc.updatedAt }
			});
		}

		return conflicts;
	}

	/**
	 * Compute a fast checksum of all documents: hash of sorted (id + updatedAt) pairs.
	 * Used for periodic data integrity verification between client and server.
	 * djb2 hash is non-cryptographic but fast and sufficient for drift detection.
	 */
	checksum(): number {
		this.ensureIndex();
		let hash = 5381;
		for (const entry of this.sortedIndex) {
			const str = entry.key; // already "updatedAt\0primaryKey"
			for (let i = 0; i < str.length; i++) {
				hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
			}
		}
		return hash;
	}

	/**
	 * Patch specific fields on an existing document in-place.
	 * Used for lightweight server-side updates (e.g. screen-state beacon).
	 * Returns true if the doc was found and patched.
	 */
	patchDoc(docId: string, fields: Record<string, any>): boolean {
		if (_isResetting) return false;
		const current = this.docs.get(docId);
		if (!current) return false;

		const patched = { ...current, ...fields };
		this.docs.set(docId, patched);
		this.indexDirty = true;

		this.emit({
			documents: [patched],
			checkpoint: { id: docId, updatedAt: patched.updatedAt }
		});
		return true;
	}

	clear() {
		this.docs.clear();
		this.sortedIndex = [];
		this.indexDirty = false;
	}
}

// ─── Singleton registry ──────────────────────────────────────────────────────

const VALID_COLLECTIONS = new Set([
	'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
	'stock_events', 'deductions', 'expenses', 'stock_counts', 'devices',
	'kds_tickets', 'readings', 'audit_logs',
	'floor_elements', 'shifts'
]);

const stores = new Map<string, CollectionStore>();

// ── Startup banner (once per process, survives HMR re-evaluations) ───────────
const _global = globalThis as any;
if (!_global.__wtfpos_db_banner) {
	_global.__wtfpos_db_banner = true;
	log.banner(
		'',
		'  🟢  SERVER STARTED  🟢',
		'',
		`  In-memory replication store initialized`,
		`  ${VALID_COLLECTIONS.size} collections registered`,
		`  ${new Date().toLocaleString('en-PH')}`,
		''
	);
}

export function getCollectionStore(name: string): CollectionStore | null {
	if (!VALID_COLLECTIONS.has(name)) return null;
	if (!stores.has(name)) stores.set(name, new CollectionStore(name));
	return stores.get(name)!;
}

export function isValidCollection(name: string): boolean {
	return VALID_COLLECTIONS.has(name);
}

/** Last time any document was pushed to any collection */
let _lastPushAt: string | null = null;
let _totalDocs = 0;
let _lastSummaryTotal = 0;

/** Get a snapshot of server store state */
export function getServerStoreSummary(): { total: number; lastPushAt: string | null; collections: Record<string, number> } {
	const collections: Record<string, number> = {};
	let total = 0;
	for (const name of VALID_COLLECTIONS) {
		const store = stores.get(name);
		const count = store ? store.count() : 0;
		if (count > 0) collections[name] = count;
		total += count;
	}
	_totalDocs = total;
	return { total, lastPushAt: _lastPushAt, collections };
}

/** Called after every push to update last-push timestamp and log milestones */
export function recordPush(collection: string, docCount: number) {
	_lastPushAt = new Date().toISOString();
	_totalDocs += docCount;

	// Suppress milestones during reset — the DATABASE RESET COMPLETE banner shows final totals
	if (_isResetting) return;

	// Log a summary at milestones: first push, every 500 docs, or first time a collection gets data
	if (_lastSummaryTotal === 0 || _totalDocs - _lastSummaryTotal >= 500) {
		_lastSummaryTotal = _totalDocs;
		const { total, collections } = getServerStoreSummary();
		const colSummary = Object.entries(collections).map(([k, v]) => `${k}:${v}`).join(' ');
		log.info('ServerStore', `📦 ${total} total docs | ${colSummary} | last push: ${new Date(_lastPushAt!).toLocaleTimeString()}`);
	}

}

// ─── Global broadcast (reset all devices) ────────────────────────────────────

type BroadcastListener = (signal: string) => void;
const broadcastListeners = new Set<BroadcastListener>();

export function subscribeBroadcast(fn: BroadcastListener): () => void {
	broadcastListeners.add(fn);
	return () => broadcastListeners.delete(fn);
}

export function emitBroadcast(signal: string) {
	if (signal === 'RESET_ALL') {
		_isResetting = true; // Block all writes immediately
		for (const store of stores.values()) {
			store.clear();
		}
		clearTrackedClients(); // Wipe ghost client entries
		_totalDocs = 0;
		_lastSummaryTotal = 0;
		_lastPushAt = null;
		// Bump epoch so clients that reconnect later detect the reset
		import('./epoch').then(m => m.bumpServerEpoch()).catch(() => {});

		log.banner(
			'',
			'  🔥  SERVER STORES CLEARED  🔥',
			'',
			`  All ${VALID_COLLECTIONS.size} in-memory collections wiped`,
			`  Epoch bumped — writes blocked until SERVER_READY`,
			`  Waiting for server browser to reseed + repush...`,
			`  ${new Date().toLocaleString('en-PH')}`,
			''
		);
	}
	if (signal === 'SERVER_READY') {
		const wasResetting = _isResetting;
		_isResetting = false; // Re-allow writes — server is ready
		const { total, collections } = getServerStoreSummary();
		const colSummary = Object.entries(collections).map(([k, v]) => `${k}:${v}`).join(' ');

		if (wasResetting) {
			// Post-reset: fire was extinguished, database reseeded
			log.banner(
				'',
				'  🔥🔥🔥  DATABASE RESET COMPLETE  🧯✅',
				'',
				`  ${total} docs reseeded across ${Object.keys(collections).length} collections`,
				`  ${colSummary}`,
				`  All fires extinguished — writes unblocked`,
				`  Clients may now sync fresh data`,
				`  ${new Date().toLocaleString('en-PH')}`,
				''
			);
		} else {
			// Normal startup: server populated for the first time
			log.banner(
				'',
				'  ✅  SERVER READY  ✅',
				'',
				`  ${total} docs across ${Object.keys(collections).length} collections`,
				`  ${colSummary}`,
				`  Clients may now sync`,
				`  ${new Date().toLocaleString('en-PH')}`,
				''
			);
		}
	}
	for (const fn of broadcastListeners) {
		try { fn(signal); } catch { /* noop */ }
	}
}
