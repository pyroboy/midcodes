import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateSizePresets, templateAssets } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';

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
			
			const imageBlob = formData.get('image') as File; // Cast to File for better type
			const name = formData.get('name') as string;
			const description = formData.get('description') as string | null;
			const category = formData.get('category') as string | null;
			const tagsJson = formData.get('tags') as string;
			const sizePresetId = formData.get('sizePresetId') as string;
			const sampleType = formData.get('sampleType') as string;
			const orientation = formData.get('orientation') as string;
			const widthPixels = parseInt(formData.get('widthPixels') as string);
			const heightPixels = parseInt(formData.get('heightPixels') as string);
			const filename = formData.get('filename') as string;

			if (!imageBlob || !name || !filename) {
				return fail(400, { error: 'Missing required fields' });
			}

			const tags = tagsJson ? JSON.parse(tagsJson) : [];

            // 1. Upload to R2 (Cloudflare)
            // Note: filename should probably be unique, maybe prepend a folder or uuid if not already done by frontend
            const publicUrl = await uploadToR2(filename, imageBlob, imageBlob.type || 'image/png');

			// 2. Insert into Database with Drizzle
			try {
				const [asset] = await db.insert(templateAssets).values({
					name,
					description: description || undefined,
					category: category || undefined,
					tags: tags,
					sizePresetId: sizePresetId || undefined,
					sampleType: sampleType as any,
					orientation: orientation as any,
					imagePath: filename,
					imageUrl: publicUrl,
					widthPixels,
					heightPixels,
					uploadedBy: user.id,
					isPublished: true
				}).returning();

				return { success: true, asset };
			} catch (dbError: any) {
				// Rollback storage upload
				await deleteFromR2(filename);
				console.error('Database insert error:', dbError);
				return fail(500, { error: `Failed to save asset record: ${dbError.message}` });
			}
		} catch (e) {
			console.error('Unexpected error in saveAsset:', e);
			return fail(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
		}
	}
};
