import { db } from '$lib/server/db';
import { galleries, galleryImages } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!id || isNaN(id)) {
		throw error(404, 'Gallery not found');
	}

	const [gallery] = await db
		.select()
		.from(galleries)
		.where(eq(galleries.id, id));

	if (!gallery) {
		throw error(404, 'Gallery not found');
	}

	const images = await db
		.select()
		.from(galleryImages)
		.where(eq(galleryImages.galleryId, id))
		.orderBy(asc(galleryImages.sortOrder));

	return { gallery, images };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
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

		if (await isSlugTaken(galleries, galleries.slug, slug, id, galleries.id)) {
			return fail(400, { error: 'A gallery with this slug already exists.', title, slug, date, description, coverImageUrl, sortOrder: sortOrder?.toString(), isPublished: !!isPublished });
		}

		await dbAction(async () => {
			const result = await db
				.update(galleries)
				.set({
					title,
					slug,
					date,
					description,
					coverImageUrl,
					sortOrder,
					isPublished,
					updatedAt: new Date()
				})
				.where(eq(galleries.id, id))
				.returning({ id: galleries.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update.');

		throw redirect(303, '/admin/gallery?success=updated');
	},

	addImage: async ({ request, params }) => {
		const galleryId = Number(params.id);
		const formData = await request.formData();

		const imageUrl = formData.get('imageUrl')?.toString()?.trim();
		const caption = formData.get('caption')?.toString()?.trim() || null;
		const sortOrder = parseIntSafe(formData.get('sortOrder')?.toString()) ?? 0;

		if (!imageUrl) {
			return fail(400, { imageError: 'Image URL is required.' });
		}

		await dbAction(async () => {
			await db.insert(galleryImages).values({
				galleryId,
				imageUrl,
				caption,
				sortOrder
			});
		}, 'Failed to add image.');

		return { imageSuccess: true };
	},

	removeImage: async ({ request }) => {
		const formData = await request.formData();
		const imageId = Number(formData.get('imageId'));

		if (!imageId || isNaN(imageId)) {
			return fail(400, { imageError: 'Invalid image ID' });
		}

		await dbAction(async () => {
			const result = await db.delete(galleryImages).where(eq(galleryImages.id, imageId)).returning({ id: galleryImages.id });
			if (result.length === 0) throw new Error('Image not found');
		}, 'Failed to remove image.');

		return { imageSuccess: true };
	}
};
