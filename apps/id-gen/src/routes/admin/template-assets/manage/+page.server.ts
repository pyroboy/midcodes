import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateAssets, templateSizePresets } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Require auth
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch assets with size preset data using Drizzle
		// Drizzle doesn't support direct relation expansion like Supabase yet unless using db.query
		// We'll fetch assets first
		const assets = await db.select().from(templateAssets).orderBy(desc(templateAssets.createdAt));

		// Fetch presets separately to join manually
		const presets = await db.select().from(templateSizePresets);
		const presetMap = new Map(presets.map((p) => [p.id, p]));

		const assetsWithPresets = assets.map((asset) => {
			const preset = asset.sizePresetId ? presetMap.get(asset.sizePresetId) : null;
			return {
				id: asset.id,
				created_at: asset.createdAt?.toISOString(),
				updated_at: asset.updatedAt?.toISOString(),
				name: asset.name,
				description: asset.description,
				category: asset.category,
				tags: asset.tags,
				size_preset_id: asset.sizePresetId,
				sample_type: asset.sampleType,
				orientation: asset.orientation,
				image_path: asset.imagePath,
				image_url: asset.imageUrl,
				width_pixels: asset.widthPixels,
				height_pixels: asset.heightPixels,
				is_published: asset.isPublished,
				published_at: asset.publishedAt?.toISOString(),
				uploaded_by: asset.uploadedBy,
				size_preset: preset
					? {
							id: preset.id,
							name: preset.name,
							slug: preset.slug,
							width_inches: parseFloat(preset.widthInches),
							height_inches: parseFloat(preset.heightInches),
							width_mm: parseFloat(preset.widthMm),
							height_mm: parseFloat(preset.heightMm),
							width_pixels: preset.widthPixels,
							height_pixels: preset.heightPixels,
							dpi: preset.dpi,
							aspect_ratio: preset.aspectRatio ? parseFloat(preset.aspectRatio) : undefined,
							description: preset.description,
							sort_order: preset.sortOrder,
							is_active: preset.isActive,
							created_at: preset.createdAt?.toISOString(),
							updated_at: preset.updatedAt?.toISOString()
						}
					: null
			};
		});

		return {
			assets: assetsWithPresets || []
		};
	} catch (err) {
		console.error('Error loading assets:', err);
		throw error(500, 'Failed to load assets');
	}
};
