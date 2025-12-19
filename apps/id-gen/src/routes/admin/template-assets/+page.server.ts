import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateSizePresets, templateAssets } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';
import { getTemplateAssetPath } from '$lib/utils/storagePath';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch size presets from database with Drizzle
	const sizePresets = await db.select()
		.from(templateSizePresets)
		.where(eq(templateSizePresets.isActive, true))
		.orderBy(templateSizePresets.sortOrder);

	// Map to snake_case for frontend compatibility (components expect Supabase usage)
	const mappedPresets = sizePresets.map(p => ({
		...p,
		width_inches: Number(p.widthInches),
		height_inches: Number(p.heightInches),
		width_mm: Number(p.widthMm),
		height_mm: Number(p.heightMm),
		width_pixels: p.widthPixels,
		height_pixels: p.heightPixels,
		aspect_ratio: p.aspectRatio ? Number(p.aspectRatio) : undefined,
		sort_order: p.sortOrder,
		is_active: p.isActive,
		created_at: p.createdAt?.toISOString(), // Serialize dates as strings for SvelteKit data
		updated_at: p.updatedAt?.toISOString()
	}));

	return {
		sizePresets: mappedPresets
	};
};

export const actions: Actions = {
	saveAsset: async ({ request, locals }) => {
		const { user } = locals;

		if (!user) {
			return fail(401, { error: 'You must be logged in to save assets' });
		}

		try {
			const formData = await request.formData();
			
			const fullBlob = formData.get('image_full') as File;
			const previewBlob = formData.get('image_preview') as File;
			const thumbBlob = formData.get('image_thumb') as File;
			
			const name = formData.get('name') as string;
			const description = formData.get('description') as string | null;
			const category = formData.get('category') as string | null;
			const tagsJson = formData.get('tags') as string;
			const sizePresetId = formData.get('sizePresetId') as string;
			const sampleType = formData.get('sampleType') as string;
			const orientation = formData.get('orientation') as string;
			const widthPixels = parseInt(formData.get('widthPixels') as string);
			const heightPixels = parseInt(formData.get('heightPixels') as string);
			
			if (!fullBlob || !name) {
				return fail(400, { error: 'Missing required fields' });
			}

			const tags = tagsJson ? JSON.parse(tagsJson) : [];
			const assetId = uuidv4();

            // 1. Upload variants to R2
			const variants = [
				{ variant: 'full', blob: fullBlob, side: 'front' as const },
				{ variant: 'preview', blob: previewBlob, side: 'front' as const },
				{ variant: 'thumb', blob: thumbBlob, side: 'front' as const }
			];

			const uploadResults = await Promise.all(
				variants.map(async (v) => {
					if (!v.blob) return null;
					const path = getTemplateAssetPath(assetId, v.variant as any, v.side, 'png');
					const url = await uploadToR2(path, v.blob, v.blob.type || 'image/png');
					return { variant: v.variant, path, url };
				})
			);

			const fullResult = uploadResults.find(r => r?.variant === 'full');
			if (!fullResult) throw new Error('Failed to upload full resolution image');

			// 2. Insert into Database
			try {
				const [asset] = await db.insert(templateAssets).values({
					id: assetId,
					name,
					description: description || undefined,
					category: category || undefined,
					tags: tags,
					sizePresetId: sizePresetId || undefined,
					sampleType: sampleType as any,
					orientation: orientation as any,
					imagePath: fullResult.path,
					imageUrl: fullResult.url,
					widthPixels,
					heightPixels,
					uploadedBy: user.id,
					isPublished: true
				}).returning();

				return { success: true, asset };
			} catch (dbError: any) {
				// Cleanup R2 on DB failure
				await Promise.allSettled(uploadResults.map(r => r ? deleteFromR2(r.path) : null));
				console.error('Database insert error:', dbError);
				return fail(500, { error: `Failed to save asset record: ${dbError.message}` });
			}
		} catch (e) {
			console.error('Unexpected error in saveAsset:', e);
			return fail(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
		}
	}
};
