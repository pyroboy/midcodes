import { db } from '$lib/server/db';
import { events, churches } from '$lib/server/schema';
import { asc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseDate, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allChurches = await db
		.select()
		.from(churches)
		.orderBy(asc(churches.name));

	return { churches: allChurches };
};

export const actions: Actions = {
	default: async ({ request }) => {
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

		if (await isSlugTaken(events, events.slug, slug)) {
			return fail(400, { error: 'An item with this slug already exists. Please use a different title or edit the slug.' });
		}

		await dbAction(async () => {
			await db.insert(events).values({
				title,
				slug,
				date,
				endDate,
				location,
				churchId,
				description,
				imageUrl,
				isPublished
			});
		}, 'Failed to create. Please try again.');

		throw redirect(303, '/admin/events?success=created');
	}
};
