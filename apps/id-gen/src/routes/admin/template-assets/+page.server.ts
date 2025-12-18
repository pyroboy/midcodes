import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateSizePresets, templateAssets } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch size presets from database with Drizzle
	const sizePresets = await db.select()
		.from(templateSizePresets)
		.where(eq(templateSizePresets.isActive, true))
		.orderBy(templateSizePresets.sortOrder);

	return {
		sizePresets: sizePresets ?? []
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
			
			const imageBlob = formData.get('image') as Blob;
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

			// Get supabaseAdmin for storage operations (hybrid approach)
			const supabaseAdmin = getSupabaseAdmin();

			// 1. Upload to Supabase Storage
			const { error: uploadError } = await supabaseAdmin.storage
				.from('template-assets')
				.upload(filename, imageBlob, {
					contentType: 'image/png',
					upsert: false
				});

			if (uploadError) {
				console.error('Storage upload error:', uploadError);
				return fail(500, { error: `Failed to upload image: ${uploadError.message}` });
			}

			// 2. Get Public URL
			const { data: { publicUrl } } = supabaseAdmin.storage
				.from('template-assets')
				.getPublicUrl(filename);

			// 3. Insert into Database with Drizzle
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
				await supabaseAdmin.storage.from('template-assets').remove([filename]);
				console.error('Database insert error:', dbError);
				return fail(500, { error: `Failed to save asset record: ${dbError.message}` });
			}
		} catch (e) {
			console.error('Unexpected error in saveAsset:', e);
			return fail(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
		}
	}
};
