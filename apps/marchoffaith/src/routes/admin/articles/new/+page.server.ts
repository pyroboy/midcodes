import { db } from '$lib/server/db';
import { articles } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, dbAction } from '$lib/server/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const title = formData.get('title')?.toString()?.trim();
		const date = formData.get('date')?.toString()?.trim();
		const category = formData.get('category')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim();
		const featuredImage = formData.get('featuredImage')?.toString()?.trim() || null;
		const isPublished = formData.get('isPublished') === 'on';

		if (!title) {
			return fail(400, {
				error: 'Title is required.',
				title,
				slug: '',
				date,
				category,
				description,
				featuredImage,
				isPublished
			});
		}

		const slug = formData.get('slug')?.toString()?.trim() || slugify(title);

		if (!slug || !date || !category || !description) {
			return fail(400, {
				error: 'Title, slug, date, category, and description are required.',
				title,
				slug,
				date,
				category,
				description,
				featuredImage,
				isPublished
			});
		}

		if (await isSlugTaken(articles, articles.slug, slug)) {
			return fail(400, { error: 'An item with this slug already exists. Please use a different title or edit the slug.', title, slug, date, category, description, featuredImage, isPublished: !!isPublished });
		}

		await dbAction(async () => {
			await db.insert(articles).values({
				title,
				slug,
				date,
				category,
				description,
				featuredImage,
				isPublished,
				images: [],
				content: []
			});
		}, 'Failed to create. Please try again.');

		throw redirect(303, '/admin/articles?success=created');
	}
};
