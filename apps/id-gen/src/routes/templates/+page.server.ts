import { error, fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session, org_id, user }, url }) => {
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	let templateId = url.searchParams.get('id');
	let selectedTemplate = null;

	if (templateId) {
		const { data: template, error: templateError } = await supabase
			.from('templates')
			.select('*')
			.eq('id', templateId)
			.single();

		if (templateError) {
			console.error('Error fetching template:', templateError);
			throw error(500, 'Failed to fetch template');
		}

		selectedTemplate = template;
	}

	// Fetch all templates for the list
	const templates = await supabase
		.from('templates')
		.select(
			`
                id,
                name,
                user_id,
                org_id,
                orientation,
                created_at,
                front_background,
                back_background,
                template_elements
            `
		)
		.eq('org_id', org_id)
		.order('created_at', { ascending: false });

	if (templates.error) {
		console.error('Error fetching templates:', templates.error);
		throw error(500, 'Failed to fetch templates');
	}

	// console.log('Templates:', templates.data);

	return {
		templates: templates.data,
		selectedTemplate,
		user,
		org_id
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const { supabase, session, org_id } = locals;

		try {
			const formData = await request.formData();
			const templateDataStr = formData.get('templateData') as string;

			if (!templateDataStr) {
				throw error(400, 'Template data is required');
			}

			const templateData = JSON.parse(templateDataStr);

			// Set the org_id and user_id from the session
			templateData.user_id = session?.user?.id;
			templateData.org_id = org_id;

			console.log('🎨 Server: Processing template save:', {
				id: templateData.id,
				name: templateData.name,
				org_id: templateData.org_id,
				elementsCount: templateData.template_elements?.length
			});

			// Set the user_id from the session

			const { data, error: dbError } = await supabase
				.from('templates')
				.upsert(templateData)
				.select()
				.single();

			if (dbError) {
				console.error('❌ Server: Database error:', dbError);
				throw error(500, 'Error saving template');
			}

			if (!data) {
				throw error(500, 'No data returned from database');
			}

			console.log('✅ Server: Template saved successfully:', {
				id: data.id,
				name: data.name,
				org_id: data.org_id,
				elementsCount: data.template_elements?.length,
				action: templateData.id ? 'updated' : 'created'
			});

			return {
				success: true,
				data,
				message: `Template ${templateData.id ? 'updated' : 'created'} successfully`
			};
		} catch (err) {
			console.error('❌ Server: Error in create action:', err);
			throw error(
				err instanceof Error && err.message.includes('400') ? 400 : 500,
				err instanceof Error ? err.message : 'Error processing template save'
			);
		}
	},

	delete: async ({ request, locals: { supabase, session } }) => {
		if (!session) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;

			if (!templateId) {
				throw error(400, 'Template ID is required');
			}

			console.log('🗑️ Server: Processing template delete:', { templateId });

			// First, update ID cards that use this template
			const { error: updateError } = await supabase
				.from('idcards')
				.update({ template_id: null })
				.eq('template_id', templateId);

			if (updateError) {
				console.error('❌ Server: Error updating ID cards:', updateError);
				throw error(500, 'Error updating ID cards');
			}

			// Then delete the template, ensuring it belongs to the user
			const { error: deleteError } = await supabase
				.from('templates')
				.delete()
				.match({ id: templateId })
				.eq('user_id', session.user.id);

			if (deleteError) {
				console.error('❌ Server: Database error:', deleteError);
				throw error(500, 'Error deleting template');
			}

			console.log('✅ Server: Template deleted successfully:', { templateId });

			return {
				success: true,
				message: 'Template deleted successfully'
			};
		} catch (err) {
			console.error('❌ Server: Error in delete action:', err);
			throw error(
				err instanceof Error && err.message.includes('400') ? 400 : 500,
				err instanceof Error ? err.message : 'Error deleting template'
			);
		}
	},
	select: async ({ request, locals: { supabase, session } }) => {
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const templateId = formData.get('id');

		if (!templateId) {
			return fail(400, { message: 'Template ID is required' });
		}

		try {
			const { data: template, error: templateError } = await supabase
				.from('templates')
				.select('*')
				.eq('id', templateId)
				.single();

			if (templateError) {
				console.error('Error fetching template:', templateError);
				return fail(500, { message: 'Failed to fetch template' });
			}

			if (!template) {
				return fail(404, { message: 'Template not found' });
			}

			// Return a properly structured form action response
			return {
				type: 'success',
				data: {
					id: template.id,
					user_id: template.user_id,
					name: template.name,
					front_background: template.front_background,
					back_background: template.back_background,
					orientation: template.orientation,
					created_at: template.created_at,
					updated_at: template.updated_at,
					template_elements: template.template_elements,
					org_id: template.org_id
				}
			};
		} catch (err) {
			console.error('Server error:', err);
			return fail(500, { message: 'Internal server error' });
		}
	}
};

// Function to determine orientation from image dimensions
async function getImageOrientation(imageUrl: string): Promise<'landscape' | 'portrait'> {
	try {
		const response = await fetch(imageUrl);
		const buffer = await response.arrayBuffer();
		const blob = new Blob([buffer]);
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.src = url;
		await new Promise((resolve) => (img.onload = resolve));
		const width = img.width;
		const height = img.height;
		URL.revokeObjectURL(url);
		return width >= height ? 'landscape' : 'portrait';
	} catch (err) {
		console.error('Error determining image orientation:', err);
		return 'landscape'; // default fallback
	}
}
