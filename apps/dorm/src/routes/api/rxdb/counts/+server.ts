import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

/**
 * Returns active (non-deleted) row counts for all 15 synced tables.
 * Applies the same retention rules as client-side pruning (pruning.ts):
 *
 * 1. All collections: `deleted_at IS NULL` (active records only)
 * 2. Historical collections: also `date_field >= 12 months ago`
 *    (readings, payments, billings, expenses, payment_allocations)
 *
 * This matches exactly what RxDB retains after pruning, and what
 * the user sees in the UI. No false mismatches.
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const start = Date.now();
	try {
		// 12-month retention cutoff (same as pruning.ts RETENTION_MONTHS)
		const retentionCutoff = new Date();
		retentionCutoff.setMonth(retentionCutoff.getMonth() - 12);
		const retentionStr = retentionCutoff.toISOString();

		const result = await Promise.race([
			db.execute(sql`
				SELECT 'tenants' AS collection, COUNT(*)::int AS count FROM tenants WHERE deleted_at IS NULL
				UNION ALL SELECT 'leases', COUNT(*)::int FROM leases WHERE deleted_at IS NULL
				UNION ALL SELECT 'lease_tenants', COUNT(*)::int FROM lease_tenants WHERE deleted_at IS NULL
				UNION ALL SELECT 'rental_units', COUNT(*)::int FROM rental_unit WHERE deleted_at IS NULL
				UNION ALL SELECT 'properties', COUNT(*)::int FROM properties WHERE deleted_at IS NULL
				UNION ALL SELECT 'floors', COUNT(*)::int FROM floors WHERE deleted_at IS NULL
				UNION ALL SELECT 'meters', COUNT(*)::int FROM meters WHERE deleted_at IS NULL
				UNION ALL SELECT 'readings', COUNT(*)::int FROM readings
					WHERE deleted_at IS NULL AND (reading_date IS NULL OR reading_date >= ${retentionStr}::timestamptz)
				UNION ALL SELECT 'billings', COUNT(*)::int FROM billings
					WHERE deleted_at IS NULL AND (billing_date IS NULL OR billing_date >= ${retentionStr}::timestamptz)
				UNION ALL SELECT 'payments', COUNT(*)::int FROM payments
					WHERE deleted_at IS NULL AND (paid_at IS NULL OR paid_at >= ${retentionStr}::timestamptz)
				UNION ALL SELECT 'payment_allocations', COUNT(*)::int FROM payment_allocations
					WHERE deleted_at IS NULL AND (created_at IS NULL OR created_at >= ${retentionStr}::timestamptz)
				UNION ALL SELECT 'expenses', COUNT(*)::int FROM expenses
					WHERE deleted_at IS NULL AND (expense_date IS NULL OR expense_date >= ${retentionStr}::timestamptz)
				UNION ALL SELECT 'budgets', COUNT(*)::int FROM budgets WHERE deleted_at IS NULL
				UNION ALL SELECT 'penalty_configs', COUNT(*)::int FROM penalty_configs WHERE deleted_at IS NULL
				UNION ALL SELECT 'floor_layout_items', COUNT(*)::int FROM floor_layout_items WHERE deleted_at IS NULL
			`),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Count query timeout (5s)')), 5000)
			)
		]);

		const rows = (result as any)?.rows ?? [];
		const counts: Record<string, number> = {};
		for (const row of rows) {
			counts[row.collection] = Number(row.count);
		}

		return json({
			counts,
			fetchedAt: Date.now(),
			latencyMs: Date.now() - start
		});
	} catch (err: any) {
		return json(
			{
				error: 'Count query failed',
				detail: err?.message || 'Unknown error',
				latencyMs: Date.now() - start
			},
			{ status: 500 }
		);
	}
};
