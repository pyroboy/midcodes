import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

/**
 * Reconcile endpoint: compares server counts with client-reported counts.
 *
 * GET /api/rxdb/reconcile?client=tenants:47,leases:12,floor_layout_items:121
 *
 * Returns per-collection: server count, client count, delta, and status (ok/mismatch/missing).
 * Also returns floor_layout_items breakdown by floor_id for spatial data debugging.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const clientParam = url.searchParams.get('client') || '';
	const clientCounts: Record<string, number> = {};

	// Parse client counts: "tenants:47,leases:12"
	if (clientParam) {
		for (const pair of clientParam.split(',')) {
			const [name, count] = pair.split(':');
			if (name && count) clientCounts[name.trim()] = Number(count);
		}
	}

	const start = Date.now();
	try {
		// Get server counts (active records only)
		const countResult = await db.execute(sql`
			SELECT 'tenants' AS collection, COUNT(*)::int AS count FROM tenants WHERE deleted_at IS NULL
			UNION ALL SELECT 'leases', COUNT(*)::int FROM leases WHERE deleted_at IS NULL
			UNION ALL SELECT 'lease_tenants', COUNT(*)::int FROM lease_tenants WHERE deleted_at IS NULL
			UNION ALL SELECT 'rental_units', COUNT(*)::int FROM rental_unit WHERE deleted_at IS NULL
			UNION ALL SELECT 'properties', COUNT(*)::int FROM properties WHERE deleted_at IS NULL
			UNION ALL SELECT 'floors', COUNT(*)::int FROM floors WHERE deleted_at IS NULL
			UNION ALL SELECT 'meters', COUNT(*)::int FROM meters WHERE deleted_at IS NULL
			UNION ALL SELECT 'readings', COUNT(*)::int FROM readings WHERE deleted_at IS NULL
			UNION ALL SELECT 'billings', COUNT(*)::int FROM billings WHERE deleted_at IS NULL
			UNION ALL SELECT 'payments', COUNT(*)::int FROM payments WHERE deleted_at IS NULL
			UNION ALL SELECT 'payment_allocations', COUNT(*)::int FROM payment_allocations WHERE deleted_at IS NULL
			UNION ALL SELECT 'expenses', COUNT(*)::int FROM expenses WHERE deleted_at IS NULL
			UNION ALL SELECT 'budgets', COUNT(*)::int FROM budgets WHERE deleted_at IS NULL
			UNION ALL SELECT 'penalty_configs', COUNT(*)::int FROM penalty_configs WHERE deleted_at IS NULL
			UNION ALL SELECT 'floor_layout_items', COUNT(*)::int FROM floor_layout_items WHERE deleted_at IS NULL
		`);

		const serverCounts: Record<string, number> = {};
		for (const row of (countResult as any)?.rows ?? []) {
			serverCounts[row.collection] = Number(row.count);
		}

		// Floor layout items breakdown by floor
		const floorBreakdown = await db.execute(sql`
			SELECT floor_id, item_type, COUNT(*)::int AS count
			FROM floor_layout_items
			WHERE deleted_at IS NULL
			GROUP BY floor_id, item_type
			ORDER BY floor_id, item_type
		`);

		const floorDetails: Record<string, Record<string, number>> = {};
		for (const row of (floorBreakdown as any)?.rows ?? []) {
			const fid = String(row.floor_id);
			if (!floorDetails[fid]) floorDetails[fid] = {};
			floorDetails[fid][row.item_type] = Number(row.count);
		}

		// Build reconciliation report
		const reconciliation: Record<string, {
			server: number;
			client: number | null;
			delta: number | null;
			status: 'ok' | 'mismatch' | 'no_client_data';
		}> = {};

		for (const [collection, serverCount] of Object.entries(serverCounts)) {
			const clientCount = clientCounts[collection] ?? null;
			reconciliation[collection] = {
				server: serverCount,
				client: clientCount,
				delta: clientCount !== null ? clientCount - serverCount : null,
				status: clientCount === null ? 'no_client_data'
					: clientCount === serverCount ? 'ok'
					: 'mismatch'
			};
		}

		const mismatches = Object.entries(reconciliation).filter(([, v]) => v.status === 'mismatch');

		return json({
			reconciliation,
			mismatches: mismatches.length,
			floor_layout_items_by_floor: floorDetails,
			latencyMs: Date.now() - start
		});
	} catch (err: any) {
		return json(
			{ error: 'Reconcile failed', detail: err?.message, latencyMs: Date.now() - start },
			{ status: 500 }
		);
	}
};
