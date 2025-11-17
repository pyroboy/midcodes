import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

interface IDCardField {
	value: string | null;
	side: 'front' | 'back';
}

interface TemplateVariable {
	variableName: string;
	side: 'front' | 'back';
}

interface PaginationInfo {
	total_records: number;
	current_offset: number;
	limit: number | null;
}

interface Metadata {
	organization_name: string;
	templates: {
		[templateName: string]: TemplateVariable[];
	};
	pagination: PaginationInfo;
}

export interface IDCard {
	idcard_id: string;
	template_name: string;
	front_image: string | null;
	back_image: string | null;
	created_at: string;
	fields: {
		[fieldName: string]: IDCardField;
	};
}

interface IDCardResponse {
	metadata: Metadata;
	idcards: IDCard[];
}

export const load = (async ({ locals }) => {
	const { session, supabase, org_id } = locals;
	if (!session) throw error(401, 'Unauthorized');
	if (!org_id) throw error(403, 'No organization context found');

	const { data, error: fetchError } = await supabase.rpc('get_idcards_by_org', {
		org_id: org_id,
		page_limit: null,
		page_offset: 0
	});

	if (fetchError) throw error(500, fetchError.message);
	if (!data) throw error(404, 'No ID cards found');

	// Type guard for the response structure
	const response = data as IDCardResponse;
	if (
		!response.metadata?.organization_name ||
		!Array.isArray(response.idcards) ||
		!response.metadata.templates ||
		!response.metadata.pagination
	) {
		throw error(500, 'Invalid API response format');
	}

	// Fetch template dimensions for 3D geometry preparation
	const templateNames = Array.from(new Set(response.idcards.map((card) => card.template_name)));

	const { data: templates, error: templatesError } = await supabase
		.from('templates')
		.select('name, width_pixels, height_pixels')
		.eq('org_id', org_id)
		.in('name', templateNames);

	if (templatesError) {
		console.warn('Could not fetch template dimensions:', templatesError);
	}

	// Create template dimensions map
	const templateDimensions: Record<string, { width: number; height: number; unit: string }> = {};

	if (templates) {
		templates.forEach((template) => {
			templateDimensions[template.name] = {
				width: template.width_pixels || 1013,
				height: template.height_pixels || 638,
				unit: 'pixels'
			};
		});
	}

	return {
		idCards: response.idcards,
		metadata: response.metadata,
		templateDimensions
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteCard: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const cardId = formData.get('cardId')?.toString();

		if (!cardId) {
			return fail(400, { error: 'Card ID is required' });
		}

		try {
			// First get the card details to get the image paths
			const { data: card, error: fetchError } = await supabase
				.from('idcards')
				.select('front_image, back_image')
				.eq('id', cardId)
				.single();

			if (fetchError) {
				console.error('Error fetching card:', fetchError);
				return fail(500, { error: 'Failed to fetch card details' });
			}

			// Delete images from storage if they exist
			const imagesToDelete = [];
			if (card.front_image) imagesToDelete.push(card.front_image);
			if (card.back_image) imagesToDelete.push(card.back_image);

			if (imagesToDelete.length > 0) {
				const { error: storageError } = await supabase.storage
					.from('rendered-id-cards')
					.remove(imagesToDelete);

				if (storageError) {
					console.error('Error deleting images:', storageError);
					return fail(500, { error: 'Failed to delete images' });
				}
			}

			// Delete the card record
			const { error: deleteError } = await supabase.from('idcards').delete().eq('id', cardId);

			if (deleteError) {
				console.error('Error deleting card:', deleteError);
				return fail(500, { error: 'Failed to delete card' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error in delete action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	},

	deleteMultiple: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const cardIds = formData.get('cardIds')?.toString();

		if (!cardIds) {
			return fail(400, { error: 'Card IDs are required' });
		}

		try {
			const ids = JSON.parse(cardIds);
			if (!Array.isArray(ids)) {
				return fail(400, { error: 'Invalid card IDs format' });
			}

			// First get all cards to get their image paths
			const { data: cards, error: fetchError } = await supabase
				.from('idcards')
				.select('id, front_image, back_image')
				.in('id', ids);

			if (fetchError) {
				console.error('Error fetching cards:', fetchError);
				return fail(500, { error: 'Failed to fetch card details' });
			}

			// Collect all image paths to delete
			const imagesToDelete = [];
			for (const card of cards || []) {
				if (card.front_image) imagesToDelete.push(card.front_image);
				if (card.back_image) imagesToDelete.push(card.back_image);
			}

			// Delete all images from storage in one batch
			if (imagesToDelete.length > 0) {
				const { error: storageError } = await supabase.storage
					.from('rendered-id-cards')
					.remove(imagesToDelete);

				if (storageError) {
					console.error('Error deleting images:', storageError);
					return fail(500, { error: 'Failed to delete images' });
				}
			}

			// Delete all card records
			const { error: deleteError } = await supabase.from('idcards').delete().in('id', ids);

			if (deleteError) {
				console.error('Error deleting cards:', deleteError);
				return fail(500, { error: 'Failed to delete cards' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error in delete multiple action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
