import { db } from '$lib/server/db';
import { events, churches } from '$lib/server/schema';
import { eq, asc, gte, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();

	const upcomingEvents = await db
		.select({
			id: events.id,
			title: events.title,
			slug: events.slug,
			date: events.date,
			endDate: events.endDate,
			location: events.location,
			description: events.description,
			imageUrl: events.imageUrl,
			churchName: churches.name
		})
		.from(events)
		.leftJoin(churches, eq(events.churchId, churches.id))
		.where(and(eq(events.isPublished, true), gte(events.date, now)))
		.orderBy(asc(events.date));

	return { events: upcomingEvents };
};
