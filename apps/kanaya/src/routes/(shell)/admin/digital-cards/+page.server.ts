import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { hasRole } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { digitalCards } from '$lib/server/schema';
import { eq, desc, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');

	if (!hasRole(locals, ['super_admin', 'org_admin', 'id_gen_admin'])) {
		throw error(403, 'Admin access required');
	}

	const org_id = locals.org_id;

	// Get all digital cards for this org
	const cards = await db
		.select()
		.from(digitalCards)
		.where(org_id ? eq(digitalCards.orgId, org_id) : undefined)
		.orderBy(desc(digitalCards.createdAt))
		.limit(200);

	// Get status counts
	const statusCounts = await db
		.select({
			status: digitalCards.status,
			count: count()
		})
		.from(digitalCards)
		.where(org_id ? eq(digitalCards.orgId, org_id) : undefined)
		.groupBy(digitalCards.status);

	return {
		cards,
		statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.count)]))
	};
};
