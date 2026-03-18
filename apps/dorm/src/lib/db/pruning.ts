import { getDb } from '$lib/db';

/**
 * Retention periods for historical collections.
 * Records older than this are pruned from IndexedDB to prevent unbounded growth.
 * The server retains all data — this only affects the local client cache.
 */
const RETENTION_MONTHS = 12;

/**
 * Soft-deleted records older than this many days are fully removed from the
 * local IndexedDB. The server copy is unaffected.
 */
const SOFT_DELETE_RETENTION_DAYS = 90;

const PRUNABLE_COLLECTIONS: { name: string; dateField: string }[] = [
	{ name: 'readings', dateField: 'reading_date' },
	{ name: 'payments', dateField: 'paid_at' },
	{ name: 'billings', dateField: 'billing_date' },
	{ name: 'expenses', dateField: 'expense_date' },
	{ name: 'payment_allocations', dateField: 'created_at' }
];

/**
 * All collections that carry a deleted_at field and therefore need the
 * soft-delete tombstone sweep.
 */
const ALL_SOFT_DELETE_COLLECTIONS = [
	'tenants',
	'leases',
	'lease_tenants',
	'rental_units',
	'properties',
	'floors',
	'meters',
	'readings',
	'billings',
	'payments',
	'payment_allocations',
	'expenses',
	'budgets',
	'penalty_configs'
];

/**
 * Remove records older than RETENTION_MONTHS from historical collections.
 * Safe to run after sync — the server still has the full history.
 * Only affects local IndexedDB to keep client storage lean.
 *
 * Also purges soft-deleted records that are older than SOFT_DELETE_RETENTION_DAYS
 * across all collections (W7), and calls cleanup(0) after every bulkRemove to
 * flush RxDB internal tombstones from IndexedDB (D5).
 */
export async function pruneOldRecords(): Promise<{ collection: string; pruned: number }[]> {
	const db = await getDb();
	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
	const cutoffStr = cutoff.toISOString();

	const results: { collection: string; pruned: number }[] = [];

	// ── Pass 1: date-range pruning for historical collections ────────────────
	for (const { name, dateField } of PRUNABLE_COLLECTIONS) {
		const collection = (db as any)[name];
		if (!collection) continue;

		try {
			const oldDocs = await collection.find({
				selector: {
					[dateField]: { $lt: cutoffStr }
				}
			}).exec();

			if (oldDocs.length > 0) {
				await collection.bulkRemove(oldDocs.map((d: any) => d.id));
				// D5: flush RxDB internal tombstones immediately after removal
				await collection.cleanup(0);
				results.push({ collection: name, pruned: oldDocs.length });
			}
		} catch (err) {
			console.warn(`[Pruning] Failed to prune ${name}:`, err);
		}
	}

	// ── Pass 2: soft-delete tombstone sweep across all collections ───────────
	// W7: remove records whose deleted_at is non-null and older than 90 days.
	const softCutoff = new Date(Date.now() - SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

	for (const name of ALL_SOFT_DELETE_COLLECTIONS) {
		const collection = (db as any)[name];
		if (!collection) continue;

		try {
			const softDeleted = await collection.find({
				selector: {
					deleted_at: { $ne: null, $lt: softCutoff }
				}
			}).exec();

			if (softDeleted.length > 0) {
				await collection.bulkRemove(softDeleted.map((d: any) => d.id));
				// D5: flush RxDB internal tombstones immediately after removal
				await collection.cleanup(0);
				results.push({ collection: `${name}:soft_deleted`, pruned: softDeleted.length });
			}
		} catch (err) {
			console.warn(`[Pruning] Failed to prune soft-deleted docs from ${name}:`, err);
		}
	}

	return results;
}
