import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const start = Date.now();
	try {
		await db.execute(sql`SELECT 1`);
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
