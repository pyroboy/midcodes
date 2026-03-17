import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { billings } from '$lib/server/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const leaseId = Number(params.id);
	const year = url.searchParams.get('year');
	const type = url.searchParams.get('type');

	if (!year || !type) {
		throw error(400, 'Year and type are required query parameters.');
	}

	try {
		const data = await db
			.select()
			.from(billings)
			.where(
				and(
					eq(billings.leaseId, leaseId),
					eq(billings.type, type as any),
					gte(billings.billingDate, `${year}-01-01`),
					lte(billings.billingDate, `${year}-12-31`)
				)
			);

		return json(data);
	} catch (err) {
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'An unexpected error occurred.');
	}
};
