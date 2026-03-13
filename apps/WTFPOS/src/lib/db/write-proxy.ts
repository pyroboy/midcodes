import { isRxDbMode, isFullRxDbMode } from '$lib/stores/data-mode.svelte';
import { getDb } from '$lib/db';
import { getActiveReplication } from '$lib/db/replication';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionProxy {
	insert(doc: any): Promise<any>;
	findOne(id: string): { exec(): Promise<any | null> };
	incrementalPatch(id: string, patch: Record<string, any>): Promise<any>;
	incrementalModify(id: string, fn: (doc: any) => any): Promise<any>;
	remove(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Primary key resolution
// ---------------------------------------------------------------------------

const PK_FIELD: Record<string, string> = { stock_counts: 'stockItemId' };

function getPk(collection: string): string {
	return PK_FIELD[collection] ?? 'id';
}

// ---------------------------------------------------------------------------
// Debounced reSync — after server writes, force replication to pull immediately
// so local RxDB (and thus UI) updates without waiting for the SSE round-trip.
// Debounced per-collection to avoid flooding during bulk ops like "ALL DONE".
// ---------------------------------------------------------------------------

const _resyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleResync(collection: string) {
	const existing = _resyncTimers.get(collection);
	if (existing) clearTimeout(existing);
	_resyncTimers.set(collection, setTimeout(() => {
		_resyncTimers.delete(collection);
		try {
			const rep = getActiveReplication(collection);
			if (rep && typeof rep.reSync === 'function') {
				rep.reSync();
			}
		} catch { /* best-effort */ }
	}, 50)); // 50ms debounce — coalesces rapid writes, still feels instant
}

// ---------------------------------------------------------------------------
// Per-document write queue — serializes concurrent writes to the same doc ID.
// Without this, concurrent incrementalModify calls (e.g. adding 15 items to an
// order) all read the same stale base document and overwrite each other.
// This mirrors what RxDB does internally for its incrementalModify.
// ---------------------------------------------------------------------------

const _writeQueues = new Map<string, Promise<any>>();

function enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
	const prev = _writeQueues.get(key) ?? Promise.resolve();
	const next = prev.then(fn, fn); // run fn even if previous write failed
	_writeQueues.set(key, next);
	// Clean up the map entry when the chain settles to avoid memory leaks
	next.then(() => {
		if (_writeQueues.get(key) === next) _writeQueues.delete(key);
	});
	return next;
}

// ---------------------------------------------------------------------------
// Server-backed implementation (SSE / API-fetch modes)
// ---------------------------------------------------------------------------

function createServerProxy(collectionName: string): CollectionProxy {
	const baseUrl = `/api/collections/${collectionName}`;

	async function serverFindOne(id: string): Promise<any | null> {
		// Use ?id= param to fetch a single document — avoids pulling the entire collection
		// which can be huge for orders (hundreds of docs) and cause mobile timeouts.
		const res = await fetch(`${baseUrl}/read?id=${encodeURIComponent(id)}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.document ?? null;
	}

	/** Queue key scoped to collection + document ID */
	function qk(id: string) { return `${collectionName}:${id}`; }

	return {
		async insert(doc: any): Promise<any> {
			const res = await fetch(`${baseUrl}/write`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ operation: 'insert', data: doc }),
			});
			if (!res.ok) throw new Error(`Insert failed: ${res.status}`);
			const result = await res.json();
			scheduleResync(collectionName);
			return result;
		},

		findOne(id: string) {
			return {
				exec: () => serverFindOne(id),
			};
		},

		incrementalPatch(id: string, patch: Record<string, any>): Promise<any> {
			return enqueue(qk(id), async () => {
				const res = await fetch(`${baseUrl}/write`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ operation: 'patch', id, data: patch }),
				});
				if (!res.ok) throw new Error(`Patch failed: ${res.status}`);
				const result = await res.json();
				scheduleResync(collectionName);
				return result;
			});
		},

		incrementalModify(id: string, fn: (doc: any) => any): Promise<any> {
			return enqueue(qk(id), async () => {
				const current = await serverFindOne(id);
				if (!current) throw new Error(`Document ${id} not found in ${collectionName}`);
				const modified = fn(current);
				const res = await fetch(`${baseUrl}/write`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ operation: 'patch', id, data: modified }),
				});
				if (!res.ok) throw new Error(`Modify failed: ${res.status}`);
				const result = await res.json();
				scheduleResync(collectionName);
				return result;
			});
		},

		async remove(id: string): Promise<void> {
			const res = await fetch(`${baseUrl}/write`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ operation: 'remove', id }),
			});
			if (!res.ok) throw new Error(`Remove failed: ${res.status}`);
			scheduleResync(collectionName);
		},
	};
}

// ---------------------------------------------------------------------------
// RxDB-backed implementation
// ---------------------------------------------------------------------------

function createRxDbProxy(collectionName: string): CollectionProxy {
	return {
		async insert(doc: any): Promise<any> {
			const db = await getDb();
			return (db as any)[collectionName].insert(doc);
		},

		findOne(id: string) {
			return {
				async exec(): Promise<any | null> {
					const db = await getDb();
					return (db as any)[collectionName].findOne(id).exec();
				},
			};
		},

		async incrementalPatch(id: string, patch: Record<string, any>): Promise<any> {
			const db = await getDb();
			const doc = await (db as any)[collectionName].findOne(id).exec();
			if (!doc) throw new Error(`Document ${id} not found in ${collectionName}`);
			return doc.incrementalPatch({
				...patch,
				updatedAt: new Date().toISOString(),
			});
		},

		async incrementalModify(id: string, fn: (doc: any) => any): Promise<any> {
			const db = await getDb();
			const doc = await (db as any)[collectionName].findOne(id).exec();
			if (!doc) throw new Error(`Document ${id} not found in ${collectionName}`);
			return doc.incrementalModify(fn);
		},

		async remove(id: string): Promise<void> {
			const db = await getDb();
			const doc = await (db as any)[collectionName].findOne(id).exec();
			if (doc) await doc.remove();
		},
	};
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a collection proxy that delegates to RxDB or server HTTP endpoints
 * depending on the current data mode.
 *
 * Key rule: Only the server tablet (full-rxdb) writes to local RxDB.
 * Thin clients (selective-rxdb) write directly to the server via HTTP.
 * This avoids relying on RxDB's background replication push, which can
 * fail silently (circuit breaker, network errors, memory storage quirks).
 * Thin clients still READ from local RxDB (fed by replication pull/SSE).
 */
export function getWritableCollection(collectionName: string): CollectionProxy {
	if (isFullRxDbMode()) {
		return createRxDbProxy(collectionName);
	}
	return createServerProxy(collectionName);
}
