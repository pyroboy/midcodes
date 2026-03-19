import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

/**
 * Returns per-collection counts and sorted ID arrays for active records,
 * applying the same filters as the count endpoint and client-side pruning:
 *
 * 1. All collections: `deleted_at IS NULL` (active records only)
 * 2. Historical collections: also `date_field >= 12 months ago`
 *    (readings, payments, billings, expenses, payment_allocations)
 *
 * This ensures the reconcile compares the same dataset as the count check
 * and what the user sees in the UI. No more contradictions.
 *
 * Single SQL query using UNION ALL + JSON aggregation — one Neon round-trip.
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
				SELECT collection, count, ids FROM (
					SELECT 'tenants' AS collection, COUNT(*)::int AS count,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json) AS ids
						FROM tenants WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'leases', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM leases WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'lease_tenants', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM lease_tenants WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'rental_units', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM rental_unit WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'properties', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM properties WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'floors', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM floors WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'meters', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM meters WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'readings', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM readings
						WHERE deleted_at IS NULL AND (reading_date IS NULL OR reading_date >= ${retentionStr}::timestamptz)
					UNION ALL
					SELECT 'billings', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM billings
						WHERE deleted_at IS NULL AND (billing_date IS NULL OR billing_date >= ${retentionStr}::timestamptz)
					UNION ALL
					SELECT 'payments', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM payments
						WHERE deleted_at IS NULL AND (paid_at IS NULL OR paid_at >= ${retentionStr}::timestamptz)
					UNION ALL
					SELECT 'payment_allocations', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM payment_allocations
						WHERE deleted_at IS NULL AND (created_at IS NULL OR created_at >= ${retentionStr}::timestamptz)
					UNION ALL
					SELECT 'expenses', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM expenses
						WHERE deleted_at IS NULL AND (expense_date IS NULL OR expense_date >= ${retentionStr}::timestamptz)
					UNION ALL
					SELECT 'budgets', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM budgets WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'penalty_configs', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM penalty_configs WHERE deleted_at IS NULL
					UNION ALL
					SELECT 'floor_layout_items', COUNT(*)::int,
						COALESCE(JSON_AGG(id ORDER BY id), '[]'::json)
						FROM floor_layout_items WHERE deleted_at IS NULL
				) sub
			`),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Integrity check timeout (10s)')), 10000)
			)
		]);

		const rows = (result as any)?.rows ?? [];
		const collections: Record<string, { count: number; ids: number[] }> = {};
		for (const row of rows) {
			collections[row.collection] = {
				count: row.count,
				ids: row.ids ?? []
			};
		}

		return json({
			collections,
			latencyMs: Date.now() - start
		});
	} catch (err: any) {
		return json(
			{ error: err?.message || 'Integrity check failed', latencyMs: Date.now() - start },
			{ status: 500 }
		);
	}
};
