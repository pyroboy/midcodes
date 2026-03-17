import { db } from '$lib/server/db';
import { churches, churchPastors, pastors } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allChurches = await db
		.select()
		.from(churches)
		.orderBy(asc(churches.sortOrder), asc(churches.name));

	// Load pastor assignments for each church
	const churchesWithPastors = await Promise.all(
		allChurches.map(async (church) => {
			const assignments = await db
				.select({
					id: churchPastors.id,
					role: churchPastors.role,
					isPrimary: churchPastors.isPrimary,
					pastorName: pastors.name
				})
				.from(churchPastors)
				.innerJoin(pastors, eq(churchPastors.pastorId, pastors.id))
				.where(eq(churchPastors.churchId, church.id));

			return { ...church, pastors: assignments };
		})
	);

	return { churches: churchesWithPastors };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(churches, churches.id, request, 'church')
};
