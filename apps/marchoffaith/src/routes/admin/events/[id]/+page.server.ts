import { db } from '$lib/server/db';
import { events, churches } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseDate, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!id || isNaN(id)) throw error(404, 'Event not found');

	const [event] = await db
		.select()
		.from(events)
		.where(eq(events.id, id));

	if (!event) throw error(404, 'Event not found');

	const allChurches = await db
		.select()
		.from(churches)
		.orderBy(asc(churches.name));

	return { event, churches: allChurches };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const title = formData.get('title')?.toString()?.trim();
		const dateStr = formData.get('date')?.toString()?.trim();

		if (!title || !dateStr) {
			return fail(400, { error: 'Title and date are required.' });
		}

		const slug = formData.get('slug')?.toString()?.trim() || slugify(title);

		const date = parseDate(dateStr);
		if (!date) return fail(400, { error: 'Invalid date format' });

		const endDateStr = formData.get('endDate')?.toString()?.trim();
		const endDate = endDateStr ? parseDate(endDateStr) : null;
		if (endDateStr && !endDate) return fail(400, { error: 'Invalid end date format' });

		const location = formData.get('location')?.toString()?.trim() || null;
		const churchIdStr = formData.get('churchId')?.toString()?.trim();
		const churchId = churchIdStr ? Number(churchIdStr) : null;
		const description = formData.get('description')?.toString()?.trim() || null;
		const imageUrl = formData.get('imageUrl')?.toString()?.trim() || null;
		const isPublished = formData.get('isPublished') === 'on';

		if (await isSlugTaken(events, events.slug, slug, id, events.id)) {
			return fail(400, { error: 'An item with this slug already exists.' });
		}

		await dbAction(async () => {
			const result = await db
				.update(events)
				.set({
					title,
					slug,
					date,
					endDate,
					location,
					churchId,
					description,
					imageUrl,
					isPublished,
					updatedAt: new Date()
				})
				.where(eq(events.id, id))
				.returning({ id: events.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update. Please try again.');

		throw redirect(303, '/admin/events?success=updated');
	}
};
