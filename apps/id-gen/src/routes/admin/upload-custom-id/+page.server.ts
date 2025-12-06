import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, org_id } = locals;

	if (!org_id) {
		return {
			templates: []
		};
	}

	// Fetch templates for the dropdown
	const { data: templates, error: templatesError } = await supabase
		.from('templates')
		.select('id, name')
		.eq('org_id', org_id)
		.order('name', { ascending: true });

	if (templatesError) {
		console.error('Error fetching templates:', templatesError);
		return {
			templates: []
		};
	}

	return {
		templates: templates || []
	};
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const { supabase, org_id } = locals;

		if (!org_id) {
			return fail(403, { error: 'No organization context found' });
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;
			const frontImage = formData.get('frontImage') as File;
			const backImage = formData.get('backImage') as File;

			if (!templateId || !frontImage || !backImage) {
				return fail(400, { error: 'Template and both images are required' });
			}

			// Upload front image
			const frontPath = `front_custom_${Date.now()}_${frontImage.name}`;
			const { error: frontUploadError } = await supabase.storage
				.from('rendered-id-cards')
				.upload(frontPath, frontImage, {
					contentType: frontImage.type,
					upsert: false
				});

			if (frontUploadError) {
				console.error('Error uploading front image:', frontUploadError);
				return fail(500, { error: 'Failed to upload front image' });
			}

			// Upload back image
			const backPath = `back_custom_${Date.now()}_${backImage.name}`;
			const { error: backUploadError } = await supabase.storage
				.from('rendered-id-cards')
				.upload(backPath, backImage, {
					contentType: backImage.type,
					upsert: false
				});

			if (backUploadError) {
				console.error('Error uploading back image:', backUploadError);
				// Cleanup front image
				await supabase.storage.from('rendered-id-cards').remove([frontPath]);
				return fail(500, { error: 'Failed to upload back image' });
			}

			// Insert ID card record
			const { error: insertError } = await supabase.from('idcards').insert({
				template_id: templateId,
				org_id: org_id,
				front_image: frontPath,
				back_image: backPath,
				data: {}
			} as any);

			if (insertError) {
				console.error('Error inserting ID card:', insertError);
				// Cleanup uploaded images
				await supabase.storage.from('rendered-id-cards').remove([frontPath, backPath]);
				return fail(500, { error: 'Failed to save ID card' });
			}

			return { success: true, message: 'ID card uploaded successfully' };
		} catch (err) {
			console.error('Error in upload action:', err);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
