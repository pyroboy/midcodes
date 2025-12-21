import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateSizePresets, templates } from '$lib/server/schema'; // Changed to templates
import { eq } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';
import { getTemplateAssetPath } from '$lib/utils/storagePath';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch size presets from database with Drizzle
	const sizePresets = await db
		.select()
		.from(templateSizePresets)
		.where(eq(templateSizePresets.isActive, true))
		.orderBy(templateSizePresets.sortOrder);

	// Map to snake_case for frontend compatibility (components expect Supabase usage)
	const mappedPresets = sizePresets.map((p) => ({
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

			// Front Asset
			const frontFull = formData.get('image_front_full') as File;
			const frontPreview = formData.get('image_front_preview') as File;
			const frontThumb = formData.get('image_front_thumb') as File;

			// Back Asset (Optional)
			const backFull = formData.get('image_back_full') as File;
			const backPreview = formData.get('image_back_preview') as File;
			const backThumb = formData.get('image_back_thumb') as File;

			const name = formData.get('name') as string;
			const description = formData.get('description') as string | null;
			const category = formData.get('category') as string | null;
			const tagsJson = formData.get('tags') as string;
			const sizePresetId = formData.get('sizePresetId') as string;
			const sampleType = formData.get('sampleType') as string;
			const orientation = formData.get('orientation') as string;
			const widthPixels = parseInt(formData.get('widthPixels') as string);
			const heightPixels = parseInt(formData.get('heightPixels') as string);

			if (!frontFull || !name) {
				return fail(400, { error: 'Missing required fields (Front Image or Name)' });
			}

			const tags = tagsJson ? JSON.parse(tagsJson) : [];
			const templateId = uuidv4();

			// 1. Upload variants to R2
			const variants = [
				// Front
				{ variant: 'full', blob: frontFull, side: 'front' as const },
				{ variant: 'preview', blob: frontPreview, side: 'front' as const },
				{ variant: 'thumb', blob: frontThumb, side: 'front' as const },
				// Back
				...(backFull
					? [
							{ variant: 'full', blob: backFull, side: 'back' as const },
							{ variant: 'preview', blob: backPreview, side: 'back' as const },
							{ variant: 'thumb', blob: backThumb, side: 'back' as const }
						]
					: [])
			];

			const uploadResults = await Promise.all(
				variants.map(async (v) => {
					if (!v.blob) return null;
					// Use png for consistency
					const extension = v.blob.type === 'image/jpeg' ? 'jpg' : 'png';
					const finalPath = getTemplateAssetPath(templateId, v.variant as any, v.side, extension);

					const url = await uploadToR2(finalPath, v.blob, v.blob.type || 'image/png');
					return { variant: v.variant, side: v.side, path: finalPath, url };
				})
			);

			// Extract URLs
			const getUrl = (side: 'front' | 'back', variant: 'full' | 'preview' | 'thumb') =>
				uploadResults.find((r) => r?.side === side && r?.variant === variant)?.url;
			
			const getPath = (side: 'front' | 'back', variant: 'full' | 'preview' | 'thumb') =>
				uploadResults.find((r) => r?.side === side && r?.variant === variant)?.path;

			const frontBackground = getUrl('front', 'full');
			const frontPath = getPath('front', 'full'); // Need path for R2 deletion reference if needed
			
			if (!frontBackground || !frontPath) throw new Error('Failed to upload front background');

			// 2. Insert into Database
			try {
				await db.transaction(async (tx) => {
					// A. Create Template Record
					await tx.insert(templates).values({
						id: templateId,
						userId: user.id,
						name,
						orientation: orientation as any,
						widthPixels,
						heightPixels,

						frontBackground: frontBackground,
						previewFrontUrl: getUrl('front', 'preview'),
						thumbFrontUrl: getUrl('front', 'thumb'),

						backBackground: getUrl('back', 'full'),
						previewBackUrl: getUrl('back', 'preview'),
						thumbBackUrl: getUrl('back', 'thumb'),

						templateElements: []
					});

					// B. Create Asset Library Record
					// This makes it visible in "Manage Assets"
					const { templateAssets } = await import('$lib/server/schema');
					await tx.insert(templateAssets).values({
						name,
						description,
						category,
						tags,
						sizePresetId: sizePresetId || null,
						sampleType: (sampleType as any) || 'stock',
						orientation: orientation as any,
						imagePath: frontPath, // Store R2 path
						imageUrl: frontBackground, // Store public URL
						widthPixels,
						heightPixels,
						isPublished: true, // Auto-publish for now? Or keep draft.
						uploadedBy: user.id
					});
				});

				return { success: true, id: templateId };
			} catch (dbError: any) {
				// Cleanup R2 on DB failure
				await Promise.allSettled(uploadResults.map((r) => (r ? deleteFromR2(r.path) : null)));
				console.error('Database insert error:', dbError);
				return fail(500, { error: `Failed to save template record: ${dbError.message}` });
			}
		} catch (e) {
			console.error('Unexpected error in saveAsset:', e);
			return fail(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
		}
	}
};
