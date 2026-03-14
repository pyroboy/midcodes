/**
 * Client-side collection checksum — matches the server's djb2 hash algorithm.
 * Computes a hash of sorted (updatedAt + primaryKey) pairs, identical to
 * CollectionStore.checksum() on the server side.
 *
 * Used for periodic data integrity verification: if checksums match,
 * the client and server have identical data without comparing every document.
 */

const PK_FIELD: Record<string, string> = {};

function getPk(collection: string, doc: any): string {
	return doc[PK_FIELD[collection] ?? 'id'];
}

/**
 * Compute a checksum for all documents in a local RxDB collection.
 * Algorithm mirrors server's CollectionStore.checksum() exactly.
 */
export async function computeLocalChecksum(
	db: any,
	collectionName: string
): Promise<number> {
	const col = db[collectionName] ?? db.collections?.[collectionName];
	if (!col) return 0;

	const docs = await col.find().exec();

	// Build sorted keys matching server: "updatedAt\0primaryKey"
	const keys = docs
		.map((d: any) => {
			const json = d.toJSON ? d.toJSON() : d;
			return `${json.updatedAt ?? ''}\0${getPk(collectionName, json)}`;
		})
		.sort();

	// djb2 hash — must match server exactly
	let hash = 5381;
	for (const str of keys) {
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
		}
	}

	return hash;
}

const ALL_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
	'stock_events', 'deductions', 'expenses', 'stock_counts', 'devices',
	'kds_tickets', 'readings', 'audit_logs',
	'floor_elements'
];

export interface IntegrityResult {
	ok: boolean;
	mismatched: string[];
	matched: string[];
	checkedAt: string;
}

/**
 * Verify data integrity by comparing local checksums against the server's.
 * Returns which collections match and which have diverged.
 */
export async function verifyIntegrity(db: any): Promise<IntegrityResult> {
	try {
		const res = await fetch('/api/replication/status?checksums=1', {
			signal: AbortSignal.timeout(10_000)
		});
		if (!res.ok) {
			return { ok: false, mismatched: ['(server unreachable)'], matched: [], checkedAt: new Date().toISOString() };
		}

		const data = await res.json();
		const serverChecksums: Record<string, number> = data.checksums ?? {};

		const matched: string[] = [];
		const mismatched: string[] = [];

		for (const name of ALL_COLLECTIONS) {
			const serverChecksum = serverChecksums[name];
			if (serverChecksum === undefined) continue; // server has no data for this collection

			const localChecksum = await computeLocalChecksum(db, name);
			if (localChecksum === serverChecksum) {
				matched.push(name);
			} else {
				mismatched.push(name);
			}
		}

		return {
			ok: mismatched.length === 0,
			mismatched,
			matched,
			checkedAt: new Date().toISOString()
		};
	} catch {
		return { ok: false, mismatched: ['(verification failed)'], matched: [], checkedAt: new Date().toISOString() };
	}
}
