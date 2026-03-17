import { db } from '$lib/server/db';
import { galleries } from '$lib/server/schema';
import { eq, asc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const publishedGalleries = await db
		.select({
			id: galleries.id,
			title: galleries.title,
			slug: galleries.slug,
			date: galleries.date,
			description: galleries.description,
			coverImageUrl: galleries.coverImageUrl,
			sortOrder: galleries.sortOrder,
			imageCount: sql<number>`(select count(*) from gallery_images where gallery_images.gallery_id = ${galleries.id})`.mapWith(Number)
		})
		.from(galleries)
		.where(eq(galleries.isPublished, true))
		.orderBy(asc(galleries.sortOrder));

	return { galleries: publishedGalleries };
};
