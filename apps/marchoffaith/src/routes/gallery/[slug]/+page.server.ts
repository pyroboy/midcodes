import { db } from '$lib/server/db';
import { galleries, galleryImages } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [gallery] = await db
		.select()
		.from(galleries)
		.where(and(eq(galleries.slug, params.slug), eq(galleries.isPublished, true)));

	if (!gallery) {
		throw error(404, 'Gallery not found');
	}

	const images = await db
		.select()
		.from(galleryImages)
		.where(eq(galleryImages.galleryId, gallery.id))
		.orderBy(asc(galleryImages.sortOrder));

	return { gallery, images };
};
