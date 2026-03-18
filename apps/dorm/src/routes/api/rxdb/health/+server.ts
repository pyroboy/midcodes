import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const start = Date.now();
	try {
		await Promise.race([
			db.execute(sql`SELECT 1`),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Health check timeout (5s)')), 5000)
			)
		]);
		return json({
			neon: 'reachable',
			latencyMs: Date.now() - start
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
