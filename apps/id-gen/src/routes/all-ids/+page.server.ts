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

	// Fetch ID cards with LEFT JOIN to include unassigned cards
	const { data: cards, error: fetchError } = await supabase
		.from('idcards')
		.select(`
			id,
			template_id,
			front_image,
			back_image,
			created_at,
			data,
			templates (
				name
			)
		`)
		.eq('org_id', org_id)
		.order('created_at', { ascending: false });

	if (fetchError) throw error(500, fetchError.message);
	if (!cards) throw error(404, 'No ID cards found');

	// Transform the data to match the expected format
	const idCards: IDCard[] = cards.map((card: any) => {
		const templateName = card.templates?.name || null;
		const cardData = card.data || {};

		// Convert data fields to the expected format
		const fields: { [fieldName: string]: IDCardField } = {};
		Object.entries(cardData).forEach(([key, value]) => {
			if (typeof value === 'string' || value === null) {
				fields[key] = {
					value: value as string | null,
					side: 'front' // Default to front, adjust if you have side info
				};
			}
		});

		return {
			idcard_id: card.id,
			template_name: templateName,
			front_image: card.front_image,
			back_image: card.back_image,
			created_at: card.created_at,
			fields
		};
	});

	// Build metadata
	const templateNames = Array.from(new Set(idCards.map((card) => card.template_name).filter(Boolean)));

	// Fetch template info for metadata
	const { data: templates } = await supabase
		.from('templates')
		.select('name, template_elements')
		.eq('org_id', org_id)
		.in('name', templateNames);

	const templateFields: { [templateName: string]: TemplateVariable[] } = {};
	if (templates) {
		templates.forEach((template: any) => {
			const elements = template.template_elements || [];
			templateFields[template.name] = elements
				.filter((el: any) => el.type === 'text' || el.type === 'selection')
				.map((el: any) => ({
					variableName: el.variableName,
					side: el.side
				}));
		});
	}

	const metadata: Metadata = {
		organization_name: 'Organization', // You might want to fetch this
		templates: templateFields,
		pagination: {
			total_records: idCards.length,
			current_offset: 0,
			limit: null
		}
	};

	// Fetch template dimensions for 3D geometry preparation
	const { data: templateDims, error: templatesError } = await supabase
		.from('templates')
		.select('name, width_pixels, height_pixels')
		.eq('org_id', org_id)
		.in('name', templateNames);

	if (templatesError) {
		console.warn('Could not fetch template dimensions:', templatesError);
	}

	// Create template dimensions map
	const templateDimensions: Record<string, { width: number; height: number; unit: string }> = {};

	if (templateDims) {
		templateDims.forEach((template: any) => {
			templateDimensions[template.name] = {
				width: template.width_pixels || 1013,
				height: template.height_pixels || 638,
				unit: 'pixels'
			};
		});
	}

	return {
		idCards,
		metadata,
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
			const { data: cardData, error: fetchError } = await supabase
				.from('idcards')
				.select('front_image, back_image')
				.eq('id', cardId)
				.single();

			if (fetchError) {
				console.error('Error fetching card:', fetchError);
				return fail(500, { error: 'Failed to fetch card details' });
			}

			const card = cardData as any;

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
			const { data: cardsData, error: fetchError } = await supabase
				.from('idcards')
				.select('id, front_image, back_image')
				.in('id', ids);

			if (fetchError) {
				console.error('Error fetching cards:', fetchError);
				return fail(500, { error: 'Failed to fetch card details' });
			}

			const cards = cardsData as any[] | null;

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
