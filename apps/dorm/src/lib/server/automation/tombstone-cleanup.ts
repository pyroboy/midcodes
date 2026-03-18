import { db } from '$lib/server/db';
import {
	tenants, leases, leaseTenants, rentalUnit, properties,
	floors, meters, readings, billings, payments,
	paymentAllocations, expenses, budgets, penaltyConfigs
} from '$lib/server/schema';
import { sql, lt, and, isNotNull } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * Permanently delete soft-deleted records older than the retention period.
 * Safe because:
 * - RxDB clients filter `deleted_at: { $eq: null }` — they never see these records
 * - After 90 days, all clients have synced past these tombstones
 * - The pull endpoint returns them via checkpoint, so clients learn about the deletion
 *   before the tombstone is purged
 */
const RETENTION_DAYS = 90;

type CleanupTarget = { name: string; table: PgTable; col: any };

const TABLES_WITH_SOFT_DELETE: CleanupTarget[] = [
	{ name: 'tenants', table: tenants, col: tenants.deletedAt },
	{ name: 'leases', table: leases, col: leases.deletedAt },
	{ name: 'lease_tenants', table: leaseTenants, col: leaseTenants.deletedAt },
	{ name: 'rental_units', table: rentalUnit, col: rentalUnit.deletedAt },
	{ name: 'properties', table: properties, col: properties.deletedAt },
	{ name: 'floors', table: floors, col: floors.deletedAt },
	{ name: 'meters', table: meters, col: meters.deletedAt },
	{ name: 'readings', table: readings, col: readings.deletedAt },
	{ name: 'billings', table: billings, col: billings.deletedAt },
	{ name: 'payments', table: payments, col: payments.deletedAt },
	{ name: 'payment_allocations', table: paymentAllocations, col: paymentAllocations.deletedAt },
	{ name: 'expenses', table: expenses, col: expenses.deletedAt },
	{ name: 'budgets', table: budgets, col: budgets.deletedAt },
	{ name: 'penalty_configs', table: penaltyConfigs, col: penaltyConfigs.deletedAt }
];

export async function runTombstoneCleanup(): Promise<{ table: string; deleted: number }[]> {
	const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(RETENTION_DAYS))} days'`;
	const results: { table: string; deleted: number }[] = [];

	for (const { name, table, col } of TABLES_WITH_SOFT_DELETE) {
		try {
			const deleted = await db
				.delete(table)
				.where(and(isNotNull(col), lt(col, cutoff)));

			// Drizzle delete returns { rowCount } for pg driver
			const count = (deleted as any)?.rowCount ?? (deleted as any)?.length ?? 0;
			if (count > 0) {
				results.push({ table: name, deleted: count });
			}
		} catch (err) {
			console.error(`[Tombstone] Failed to clean ${name}:`, err);
		}
	}

	return results;
}
