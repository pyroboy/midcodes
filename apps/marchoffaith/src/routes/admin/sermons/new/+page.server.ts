import { db } from '$lib/server/db';
import { sermons } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, dbAction } from '$lib/server/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
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

		if (await isSlugTaken(sermons, sermons.slug, slug)) {
			return fail(400, { error: 'An item with this slug already exists. Please use a different title or edit the slug.', title, slug, date, speaker, videoUrl, audioUrl, description, thumbnailUrl, isPublished: !!isPublished });
		}

		await dbAction(async () => {
			await db.insert(sermons).values({
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
		}, 'Failed to create. Please try again.');

		throw redirect(303, '/admin/sermons?success=created');
	}
};
