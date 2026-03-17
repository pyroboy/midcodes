import { db } from '$lib/server/db';
import { churches, pastors, churchPastors, events } from '$lib/server/schema';
import { eq, and, gte, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	// Fetch church by slug
	const [church] = await db
		.select()
		.from(churches)
		.where(and(eq(churches.slug, slug), eq(churches.isActive, true)))
		.limit(1);

	if (!church) {
		error(404, 'Church not found');
	}

	// Fetch assigned pastors via churchPastors join
	const assignedPastors = await db
		.select({
			id: pastors.id,
			name: pastors.name,
			slug: pastors.slug,
			title: pastors.title,
			role: churchPastors.role,
			photoUrl: pastors.photoUrl,
			isPrimary: churchPastors.isPrimary
		})
		.from(churchPastors)
		.innerJoin(pastors, eq(churchPastors.pastorId, pastors.id))
		.where(and(eq(churchPastors.churchId, church.id), eq(pastors.isActive, true)))
		.orderBy(asc(pastors.sortOrder));

	// Fetch upcoming events for this church
	const now = new Date();
	const upcomingEvents = await db
		.select({
			id: events.id,
			title: events.title,
			slug: events.slug,
			date: events.date,
			location: events.location,
			description: events.description,
			imageUrl: events.imageUrl
		})
		.from(events)
		.where(
			and(
				eq(events.churchId, church.id),
				eq(events.isPublished, true),
				gte(events.date, now)
			)
		)
		.orderBy(asc(events.date))
		.limit(6);

	return {
		church,
		pastors: assignedPastors,
		events: upcomingEvents
	};
};
