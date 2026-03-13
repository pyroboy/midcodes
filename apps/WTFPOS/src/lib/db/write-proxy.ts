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
// Server-backed implementation (SSE / API-fetch modes)
// ---------------------------------------------------------------------------

function createServerProxy(collectionName: string): CollectionProxy {
	const baseUrl = `/api/collections/${collectionName}`;

	async function serverFindOne(id: string): Promise<any | null> {
		const res = await fetch(`${baseUrl}/read`);
		if (!res.ok) return null;
		const data = await res.json();
		// The read endpoint returns { documents: [...], checkpoint } — unwrap it
		const docs: any[] = Array.isArray(data) ? data : (data.documents ?? []);
		const pkField = getPk(collectionName);
		// Filter out soft-deleted docs — they're still in the store but logically removed
		return docs.find((d: any) => d[pkField] === id && !d._deleted) ?? null;
	}

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

		async incrementalPatch(id: string, patch: Record<string, any>): Promise<any> {
			const res = await fetch(`${baseUrl}/write`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ operation: 'patch', id, data: patch }),
			});
			if (!res.ok) throw new Error(`Patch failed: ${res.status}`);
			const result = await res.json();
			scheduleResync(collectionName);
			return result;
		},

		async incrementalModify(id: string, fn: (doc: any) => any): Promise<any> {
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
