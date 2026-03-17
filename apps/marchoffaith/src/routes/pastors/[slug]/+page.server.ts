import { db } from '$lib/server/db';
import { pastors, churches, churchPastors } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	// Fetch pastor by slug
	const [pastor] = await db
		.select()
		.from(pastors)
		.where(and(eq(pastors.slug, slug), eq(pastors.isActive, true)))
		.limit(1);

	if (!pastor) {
		error(404, 'Pastor not found');
	}

	// Fetch church assignments via churchPastors join
	const churchAssignments = await db
		.select({
			id: churches.id,
			name: churches.name,
			slug: churches.slug,
			city: churches.city,
			province: churches.province,
			role: churchPastors.role,
			since: churchPastors.since,
			isPrimary: churchPastors.isPrimary
		})
		.from(churchPastors)
		.innerJoin(churches, eq(churchPastors.churchId, churches.id))
		.where(and(eq(churchPastors.pastorId, pastor.id), eq(churches.isActive, true)))
		.orderBy(asc(churches.sortOrder));

	return {
		pastor,
		churches: churchAssignments
	};
};
