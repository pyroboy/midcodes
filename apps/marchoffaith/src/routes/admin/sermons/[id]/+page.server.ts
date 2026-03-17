import { db } from '$lib/server/db';
import { sermons } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!id || isNaN(id)) {
		throw error(404, 'Sermon not found');
	}

	const [sermon] = await db
		.select()
		.from(sermons)
		.where(eq(sermons.id, id));

	if (!sermon) {
		throw error(404, 'Sermon not found');
	}

	return { sermon };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const title = formData.get('title')?.toString()?.trim();
		const date = formData.get('date')?.toString()?.trim();
		const speaker = formData.get('speaker')?.toString()?.trim();
		const videoUrl = formData.get('videoUrl')?.toString()?.trim() || null;
		const audioUrl = formData.get('audioUrl')?.toString()?.trim() || null;
		const description = formData.get('description')?.toString()?.trim() || null;
		const thumbnailUrl = formData.get('thumbnailUrl')?.toString()?.trim() || null;
		const isPublished = formData.get('isPublished') === 'on';

		if (!title) {
			return fail(400, {
				error: 'Title is required.',
				title,
				slug: '',
				date,
				speaker,
				videoUrl,
				audioUrl,
				description,
				thumbnailUrl,
				isPublished
			});
		}

		const slug = formData.get('slug')?.toString()?.trim() || slugify(title);

		if (!slug || !date || !speaker) {
			return fail(400, {
				error: 'Title, slug, date, and speaker are required.',
				title,
				slug,
				date,
				speaker,
				videoUrl,
				audioUrl,
				description,
				thumbnailUrl,
				isPublished
			});
		}

		if (await isSlugTaken(sermons, sermons.slug, slug, id, sermons.id)) {
			return fail(400, { error: 'An item with this slug already exists.', title, slug, date, speaker, videoUrl, audioUrl, description, thumbnailUrl, isPublished: !!isPublished });
		}

		await dbAction(async () => {
			const result = await db
				.update(sermons)
				.set({
					title,
					slug,
					date,
					speaker,
					videoUrl,
					audioUrl,
					description,
					thumbnailUrl,
					isPublished,
					updatedAt: new Date()
				})
				.where(eq(sermons.id, id))
				.returning({ id: sermons.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update. Please try again.');

		throw redirect(303, '/admin/sermons?success=updated');
	}
};
