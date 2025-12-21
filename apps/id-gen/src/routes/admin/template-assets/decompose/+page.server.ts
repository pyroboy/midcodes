import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateAssets, templates } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Require auth
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	// Check admin role
	if (
		!locals.user ||
		!['super_admin', 'org_admin', 'id_gen_admin'].includes(locals.user.role as string)
	) {
		throw error(403, 'Admin access required');
	}

	const assetId = url.searchParams.get('assetId');

	if (!assetId) {
		throw error(400, 'Asset ID is required. Please navigate from the Manage Assets page.');
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

		// Fetch the linked template if exists
		let template = null;
		if (asset.templateId) {
			const [tmpl] = await db
				.select()
				.from(templates)
				.where(eq(templates.id, asset.templateId))
				.limit(1);
			template = tmpl || null;
		}

		// Format for client
		return {
			asset: {
				id: asset.id,
				name: asset.name,
				description: asset.description,
				category: asset.category,
				orientation: asset.orientation,
				sampleType: asset.sampleType,
				imageUrl: asset.imageUrl,
				backImageUrl: asset.backImageUrl,
				widthPixels: asset.widthPixels,
				heightPixels: asset.heightPixels,
				templateId: asset.templateId
			},
			template: template
				? {
						id: template.id,
						name: template.name,
						widthPixels: template.widthPixels,
						heightPixels: template.heightPixels,
						orientation: template.orientation,
						frontBackground: template.frontBackground,
						backBackground: template.backBackground,
						elementCount: Array.isArray(template.templateElements)
							? template.templateElements.length
							: 0
					}
				: null
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Error loading asset for decompose:', err);
		throw error(500, 'Failed to load asset');
	}
};
