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
		const assets = await db.select()
			.from(templateAssets)
			.orderBy(desc(templateAssets.createdAt));

		// Fetch presets separately to join manually (or use db.query if schema relations defined)
		// Assuming we want all presets to map them
		const presets = await db.select().from(templateSizePresets);
		const presetMap = new Map(presets.map(p => [p.id, p]));

		const assetsWithPresets = assets.map(asset => ({
			...asset,
			size_preset: asset.sizePresetId ? presetMap.get(asset.sizePresetId) : null
		}));

		return {
			assets: assetsWithPresets || []
		};
	} catch (err) {
		console.error('Error loading assets:', err);
		throw error(500, 'Failed to load assets');
	}
};
