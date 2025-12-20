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
			// category/tags logic if needed, currently schema doesn't have them on templates, but we can check if we need to add them.
			// Templates table doesn't have category/tags. I will skip them for now or store in context/metadata if available?
			// The prompt said "The `templates` database table will be the target".
			// The `templates` table has `orientation`, `widthPixels`, `heightPixels`.

			// const category = formData.get('category') as string | null;
			// const tagsJson = formData.get('tags') as string;
			// const sizePresetId = formData.get('sizePresetId') as string;
			// const sampleType = formData.get('sampleType') as string;
			const orientation = formData.get('orientation') as string;
			const widthPixels = parseInt(formData.get('widthPixels') as string);
			const heightPixels = parseInt(formData.get('heightPixels') as string);

			if (!frontFull || !name) {
				return fail(400, { error: 'Missing required fields (Front Image or Name)' });
			}

			// const tags = tagsJson ? JSON.parse(tagsJson) : [];
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
					const path = getTemplateAssetPath(templateId, v.variant as any, v.side, 'png'); // using png extension for standard
					// Note: Previews/Thumbs might be JPEGs based on generateImageVariants, need to handle extension from blob type?
					// getTemplateAssetPath handles extension arg.
					const extension = v.blob.type === 'image/jpeg' ? 'jpg' : 'png';
					const finalPath = getTemplateAssetPath(templateId, v.variant as any, v.side, extension);

					const url = await uploadToR2(finalPath, v.blob, v.blob.type || 'image/png');
					return { variant: v.variant, side: v.side, path: finalPath, url };
				})
			);

			// Extract URLs
			const getUrl = (side: 'front' | 'back', variant: 'full' | 'preview' | 'thumb') =>
				uploadResults.find((r) => r?.side === side && r?.variant === variant)?.url;

			const frontBackground = getUrl('front', 'full');
			if (!frontBackground) throw new Error('Failed to upload front background');

			// 2. Insert into Database
			try {
				const [template] = await db
					.insert(templates)
					.values({
						id: templateId,
						userId: user.id, // Linked to profile
						// orgId: user.orgId // We might need orgId from profile? `user` object from locals might not have orgId directly if it's BetterAuth User.
						// Need to check `user` object structure. `locals.user` is usually BetterAuth user.
						// Profiles table links user.id.
						// For now, I'll omit orgId if I don't have it handy, or fetch profile.
						// The original code used `uploadedBy: user.id` on `templateAssets`.
						// `templates` has `userId`.
						name,
						// description? No description col in `templates`
						// category? No.
						orientation: orientation as any,
						widthPixels,
						heightPixels,

						frontBackground: frontBackground,
						previewFrontUrl: getUrl('front', 'preview'),
						thumbFrontUrl: getUrl('front', 'thumb'),

						backBackground: getUrl('back', 'full'),
						previewBackUrl: getUrl('back', 'preview'),
						thumbBackUrl: getUrl('back', 'thumb'),

						templateElements: [] // Initialize empty

						// isPublished? templates doesn't have isPublished.
					})
					.returning();

				return { success: true, template };
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
