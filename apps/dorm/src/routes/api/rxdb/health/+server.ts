import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const start = Date.now();
	try {
		// Single query: health check + MAX(updated_at) across all 15 synced tables.
		// Uses indexes on updated_at — negligible cost vs the old SELECT 1.
		const result = await Promise.race([
			db.execute(sql`
				SELECT MAX(max_ts) AS max_updated_at FROM (
					SELECT MAX(updated_at) AS max_ts FROM tenants
					UNION ALL SELECT MAX(updated_at) FROM leases
					UNION ALL SELECT MAX(updated_at) FROM lease_tenants
					UNION ALL SELECT MAX(updated_at) FROM rental_unit
					UNION ALL SELECT MAX(updated_at) FROM properties
					UNION ALL SELECT MAX(updated_at) FROM floors
					UNION ALL SELECT MAX(updated_at) FROM meters
					UNION ALL SELECT MAX(updated_at) FROM readings
					UNION ALL SELECT MAX(updated_at) FROM billings
					UNION ALL SELECT MAX(updated_at) FROM payments
					UNION ALL SELECT MAX(updated_at) FROM payment_allocations
					UNION ALL SELECT MAX(updated_at) FROM expenses
					UNION ALL SELECT MAX(updated_at) FROM budgets
					UNION ALL SELECT MAX(updated_at) FROM penalty_configs
					UNION ALL SELECT MAX(updated_at) FROM floor_layout_items
				) sub
			`),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Health check timeout (5s)')), 5000)
			)
		]);
		const maxUpdatedAt = (result as any)?.rows?.[0]?.max_updated_at ?? null;
		return json({
			neon: 'reachable',
			latencyMs: Date.now() - start,
			maxUpdatedAt
		});
	} catch (err: any) {
		return json(
			{
				neon: 'unreachable',
				error: err?.message || 'Connection failed',
				latencyMs: Date.now() - start
			},
			{ status: 503 }
		);
	}
};
