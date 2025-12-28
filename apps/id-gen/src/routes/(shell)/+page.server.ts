import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateAssets as schemaTemplateAssets } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '$lib/utils/logger';

/**
 * Marketing homepage - minimal data loading
 * Only fetches published template assets for 3D showcase
 * Authenticated users are redirected client-side to /dashboard
 */
export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	try {
		// Fetch template assets for the 3D card showcase (public)
		const templateAssetsData = await db
			.select({
				id: schemaTemplateAssets.id,
				imageUrl: schemaTemplateAssets.imageUrl,
				widthPixels: schemaTemplateAssets.widthPixels,
				heightPixels: schemaTemplateAssets.heightPixels,
				name: schemaTemplateAssets.name,
				orientation: schemaTemplateAssets.orientation
			})
			.from(schemaTemplateAssets)
			.where(eq(schemaTemplateAssets.isPublished, true))
			.orderBy(desc(schemaTemplateAssets.createdAt))
			.limit(20)
			.catch((err) => {
				logger.warn('Template assets fetch failed for marketing page:', err.message);
				return [];
			});

		const templateAssets = templateAssetsData.map((a) => ({
			...a,
			image_url: a.imageUrl,
			width_pixels: a.widthPixels,
			height_pixels: a.heightPixels
		}));

		return {
			user,
			templateAssets
		};
	} catch (err: any) {
		logger.error('Marketing page load error:', err.message);
		return {
			user,
			templateAssets: []
		};
	}
};
