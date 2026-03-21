import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

/**
 * Sync status endpoint: returns per-collection latest updated_at, total counts,
 * and tombstone (soft-deleted) counts for debugging sync health.
 *
 * GET /api/rxdb/sync-status
 * GET /api/rxdb/sync-status?collection=floor_layout_items  (single collection detail)
 *
 * Returns:
 * - Per collection: active count, deleted count, latest updated_at
 * - Overall: total active, total deleted, max updated_at
 * - Optional: detailed records for a single collection (last 20 changes)
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const collectionFilter = url.searchParams.get('collection');
	const start = Date.now();

	try {
		// Per-collection stats: active count, deleted count, max updated_at
		const statsResult = await db.execute(sql`
			SELECT collection, active_count, deleted_count, max_updated_at FROM (
				SELECT 'tenants' AS collection,
					COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS active_count,
					COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS deleted_count,
					MAX(updated_at) AS max_updated_at
				FROM tenants
				UNION ALL SELECT 'leases', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM leases
				UNION ALL SELECT 'lease_tenants', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM lease_tenants
				UNION ALL SELECT 'rental_units', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM rental_unit
				UNION ALL SELECT 'properties', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM properties
				UNION ALL SELECT 'floors', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM floors
				UNION ALL SELECT 'meters', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM meters
				UNION ALL SELECT 'readings', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM readings
				UNION ALL SELECT 'billings', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM billings
				UNION ALL SELECT 'payments', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM payments
				UNION ALL SELECT 'payment_allocations', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM payment_allocations
				UNION ALL SELECT 'expenses', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM expenses
				UNION ALL SELECT 'budgets', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM budgets
				UNION ALL SELECT 'penalty_configs', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM penalty_configs
				UNION ALL SELECT 'floor_layout_items', COUNT(*) FILTER (WHERE deleted_at IS NULL)::int, COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int, MAX(updated_at) FROM floor_layout_items
			) sub
			ORDER BY collection
		`);

		const collections: Record<string, {
			active: number;
			deleted: number;
			total: number;
			latestUpdate: string | null;
		}> = {};

		let totalActive = 0;
		let totalDeleted = 0;
		let globalMaxTs: string | null = null;

		for (const row of (statsResult as any)?.rows ?? []) {
			const active = Number(row.active_count);
			const deleted = Number(row.deleted_count);
			collections[row.collection] = {
				active,
				deleted,
				total: active + deleted,
				latestUpdate: row.max_updated_at?.toISOString?.() ?? row.max_updated_at ?? null
			};
			totalActive += active;
			totalDeleted += deleted;
			if (row.max_updated_at) {
				const ts = row.max_updated_at?.toISOString?.() ?? row.max_updated_at;
				if (!globalMaxTs || ts > globalMaxTs) globalMaxTs = ts;
			}
		}

		const response: any = {
			collections,
			summary: {
				totalActive,
				totalDeleted,
				totalRecords: totalActive + totalDeleted,
				globalMaxUpdatedAt: globalMaxTs,
				tombstoneRatio: totalDeleted > 0
					? `${Math.round((totalDeleted / (totalActive + totalDeleted)) * 100)}%`
					: '0%'
			},
			latencyMs: Date.now() - start
		};

		// Optional: detailed recent changes for a single collection
		if (collectionFilter) {
			const tableMap: Record<string, string> = {
				tenants: 'tenants', leases: 'leases', lease_tenants: 'lease_tenants',
				rental_units: 'rental_unit', properties: 'properties', floors: 'floors',
				meters: 'meters', readings: 'readings', billings: 'billings',
				payments: 'payments', payment_allocations: 'payment_allocations',
				expenses: 'expenses', budgets: 'budgets', penalty_configs: 'penalty_configs',
				floor_layout_items: 'floor_layout_items'
			};
			const tableName = tableMap[collectionFilter];
			if (tableName) {
				const recent = await db.execute(
					sql.raw(`SELECT id, updated_at, deleted_at IS NOT NULL AS is_deleted FROM ${tableName} ORDER BY updated_at DESC LIMIT 20`)
				);
				response.recentChanges = (recent as any)?.rows ?? [];
			}
		}

		return json(response);
	} catch (err: any) {
		return json(
			{ error: 'Sync status query failed', detail: err?.message, latencyMs: Date.now() - start },
			{ status: 500 }
		);
	}
};
