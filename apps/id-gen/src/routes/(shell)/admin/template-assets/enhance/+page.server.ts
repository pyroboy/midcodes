import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateAssets } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Require auth
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	// Get assetId from query params
	const assetId = url.searchParams.get('assetId');

	if (!assetId) {
		throw error(400, 'Asset ID is required');
	}

	try {
		// Fetch the asset
		const [asset] = await db
			.select()
			.from(templateAssets)
			.where(eq(templateAssets.id, assetId))
			.limit(1);

		if (!asset) {
			throw error(404, 'Asset not found');
		}

		return {
			asset: {
				id: asset.id,
				name: asset.name,
				frontImageUrl: asset.imageUrl,
				backImageUrl: asset.backImageUrl,
				widthPixels: asset.widthPixels,
				heightPixels: asset.heightPixels,
				orientation: asset.orientation
			}
		};
	} catch (err) {
		console.error('Error loading asset:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load asset');
	}
};
