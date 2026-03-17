import { db } from '$lib/server/db';
import { galleries } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const title = formData.get('title')?.toString()?.trim();
		const slug = formData.get('slug')?.toString()?.trim() || (title ? slugify(title) : '');
		const date = formData.get('date')?.toString()?.trim() || null;
		const description = formData.get('description')?.toString()?.trim() || null;
		const coverImageUrl = formData.get('coverImageUrl')?.toString()?.trim() || null;
		const sortOrder = parseIntSafe(formData.get('sortOrder')?.toString()) ?? 0;
		const isPublished = formData.get('isPublished') === 'on';

		if (!title || !slug) {
			return fail(400, {
				error: 'Title and slug are required.',
				title,
				slug,
				date,
				description,
				coverImageUrl,
				sortOrder,
				isPublished
			});
		}

		if (await isSlugTaken(galleries, galleries.slug, slug)) {
			return fail(400, { error: 'A gallery with this slug already exists.', title, slug, date, description, coverImageUrl, sortOrder: sortOrder?.toString(), isPublished: !!isPublished });
		}

		await dbAction(async () => {
			await db.insert(galleries).values({
				title,
				slug,
				date,
				description,
				coverImageUrl,
				sortOrder,
				isPublished
			});
		}, 'Failed to create. Please try again.');

		throw redirect(303, '/admin/gallery?success=created');
	}
};
