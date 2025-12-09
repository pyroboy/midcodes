import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Fetch size presets from database
	const { data: sizePresets, error: presetsError } = await supabase
		.from('template_size_presets')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (presetsError) {
		console.error('Error fetching size presets:', presetsError);
	}

	return {
		sizePresets: sizePresets ?? []
	};
};

export const actions: Actions = {
	saveAsset: async ({ request, locals }) => {
		const { supabase, user } = locals;

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

			// 1. Upload to Supabase Storage
			const { error: uploadError } = await supabase.storage
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
			const { data: { publicUrl } } = supabase.storage
				.from('template-assets')
				.getPublicUrl(filename);

			// 3. Insert into Database
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { error: dbError, data: asset } = await supabase
				.from('template_assets')
				.insert({
					name,
					description,
					category,
					tags,
					size_preset_id: sizePresetId,
					sample_type: sampleType,
					orientation,
					image_path: filename,
					image_url: publicUrl,
					width_pixels: widthPixels,
					height_pixels: heightPixels,
					uploaded_by: user.id,
					is_published: true
				} as any)
				.select()
				.single();

			if (dbError) {
				// Rollback storage upload
				await supabase.storage.from('template-assets').remove([filename]);
				console.error('Database insert error:', dbError);
				return fail(500, { error: `Failed to save asset record: ${dbError.message}` });
			}

			return { success: true, asset };
		} catch (e) {
			console.error('Unexpected error in saveAsset:', e);
			return fail(500, { error: e instanceof Error ? e.message : 'Unexpected error' });
		}
	}
};
