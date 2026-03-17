import { db } from '$lib/server/db';
import { pastors, churchPastors, churches } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPastors = await db
		.select()
		.from(pastors)
		.orderBy(asc(pastors.sortOrder), asc(pastors.name));

	// Load church assignments for each pastor
	const pastorsWithChurches = await Promise.all(
		allPastors.map(async (pastor) => {
			const assignments = await db
				.select({
					churchId: churches.id,
					churchName: churches.name,
					role: churchPastors.role,
					isPrimary: churchPastors.isPrimary
				})
				.from(churchPastors)
				.innerJoin(churches, eq(churchPastors.churchId, churches.id))
				.where(eq(churchPastors.pastorId, pastor.id));

			return { ...pastor, churches: assignments };
		})
	);

	return { pastors: pastorsWithChurches };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(pastors, pastors.id, request, 'pastor')
};
