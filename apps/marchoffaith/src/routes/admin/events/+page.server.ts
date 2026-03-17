import { db } from '$lib/server/db';
import { events, churches } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allEvents = await db
		.select({
			id: events.id,
			title: events.title,
			slug: events.slug,
			date: events.date,
			endDate: events.endDate,
			location: events.location,
			churchId: events.churchId,
			description: events.description,
			imageUrl: events.imageUrl,
			isPublished: events.isPublished,
			createdAt: events.createdAt,
			updatedAt: events.updatedAt,
			churchName: churches.name
		})
		.from(events)
		.leftJoin(churches, eq(events.churchId, churches.id))
		.orderBy(desc(events.date));

	return { events: allEvents };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(events, events.id, request, 'event')
};
