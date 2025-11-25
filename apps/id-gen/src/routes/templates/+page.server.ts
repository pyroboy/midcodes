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
                width_pixels,
                height_pixels,
                dpi,
                orientation,
                created_at,
                front_background,
                back_background,
                template_elements
            `
		)
		.eq('org_id', org_id!)
		.order('created_at', { ascending: false });

	const templatesData = (templates.data as any[]) || [];

	if (templates.error) {
		console.error('Error fetching templates:', templates.error);
		throw error(500, 'Failed to fetch templates');
	}

	// console.log('Templates:', templates.data);

	return {
		templates: templatesData,
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

			// Build a strict payload to avoid accidental schema drift
			const now = new Date().toISOString();
			const payload = {
				id: templateData.id,
				user_id: templateData.user_id,
				org_id: templateData.org_id,
				name: templateData.name,
				width_pixels: templateData.width_pixels,
				height_pixels: templateData.height_pixels,
				dpi: templateData.dpi,
				front_background: templateData.front_background,
				back_background: templateData.back_background,
				orientation: templateData.orientation,
				template_elements: templateData.template_elements,
				created_at: templateData.created_at ?? now,
				updated_at: now
			};

			console.log('🎨 Server: Processing template save:', {
				id: payload.id,
				name: payload.name,
				org_id: payload.org_id,
				elementsCount: Array.isArray(payload.template_elements) ? payload.template_elements.length : 0
			});

			// Use upsert so client-generated IDs work for new templates and updates
			let data, dbError;
			({ data, error: dbError } = await supabase
				.from('templates')
				.upsert(payload as any, { onConflict: 'id' })
				.select('*')
				.single());

			if (dbError) {
				console.error('❌ Server: Database error:', dbError);
				throw error(500, 'Error saving template');
			}

			if (!data) {
				throw error(500, 'No data returned from database');
			}

			const dataAny = data as any;

			console.log('✅ Server: Template saved successfully:', {
				id: dataAny.id,
				name: dataAny.name,
				org_id: dataAny.org_id,
				elementsCount: Array.isArray(dataAny.template_elements)
					? dataAny.template_elements.length
					: 0,
				action: payload.id ? 'updated' : 'created'
			});

			return {
				success: true,
				data,
				message: `Template ${payload.id ? 'updated' : 'created'} successfully`
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
			const { error: updateError } = await (supabase as any)
				.from('idcards')
				.update({ template_id: null })
				.eq('template_id', templateId);

			if (updateError) {
				console.error('❌ Server: Error updating ID cards:', updateError);
				throw error(500, 'Error updating ID cards');
			}

			// Then delete the template, ensuring it belongs to the user
			const { error: deleteError } = await (supabase as any)
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
			const { data: templateData, error: templateError } = await supabase
				.from('templates')
				.select('*')
				.eq('id', templateId)
				.single();

			if (templateError) {
				console.error('Error fetching template:', templateError);
				return fail(500, { message: 'Failed to fetch template' });
			}

			if (!templateData) {
				return fail(404, { message: 'Template not found' });
			}

			const t = templateData as any;

			// Return a properly structured form action response
			return {
				type: 'success',
				data: {
					id: t.id,
					user_id: t.user_id,
					name: t.name,
					width_pixels: t.width_pixels,
					height_pixels: t.height_pixels,
					dpi: t.dpi,
					front_background: t.front_background,
					back_background: t.back_background,
					orientation: t.orientation,
					created_at: t.created_at,
					updated_at: t.updated_at,
					template_elements: t.template_elements,
					org_id: t.org_id
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
