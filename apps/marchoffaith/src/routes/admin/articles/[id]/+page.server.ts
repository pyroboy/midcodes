import { db } from '$lib/server/db';
import { articles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!id || isNaN(id)) {
		throw error(404, 'Article not found');
	}

	const [article] = await db
		.select()
		.from(articles)
		.where(eq(articles.id, id));

	if (!article) {
		throw error(404, 'Article not found');
	}

	return { article };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
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

		if (await isSlugTaken(articles, articles.slug, slug, id, articles.id)) {
			return fail(400, { error: 'An item with this slug already exists.', title, slug, date, category, description, featuredImage, isPublished: !!isPublished });
		}

		await dbAction(async () => {
			const result = await db
				.update(articles)
				.set({
					title,
					slug,
					date,
					category,
					description,
					featuredImage,
					isPublished,
					updatedAt: new Date()
				})
				.where(eq(articles.id, id))
				.returning({ id: articles.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update. Please try again.');

		throw redirect(303, '/admin/articles?success=updated');
	}
};
