import { db } from '$lib/server/db';
import { galleries, galleryImages } from '$lib/server/schema';
import { asc, sql } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allGalleries = await db
		.select({
			id: galleries.id,
			title: galleries.title,
			slug: galleries.slug,
			date: galleries.date,
			description: galleries.description,
			coverImageUrl: galleries.coverImageUrl,
			isPublished: galleries.isPublished,
			sortOrder: galleries.sortOrder,
			createdAt: galleries.createdAt,
			updatedAt: galleries.updatedAt,
			imageCount: sql<number>`(select count(*) from gallery_images where gallery_images.gallery_id = ${galleries.id})`.mapWith(Number)
		})
		.from(galleries)
		.orderBy(asc(galleries.sortOrder));

	return { galleries: allGalleries };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(galleries, galleries.id, request, 'gallery')
};
