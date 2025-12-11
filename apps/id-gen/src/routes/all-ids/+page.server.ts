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

export const load = (async ({ locals, url, depends, setHeaders }) => {
	// Cache for 1 minute (ID cards change more frequently)
	setHeaders({
		'cache-control': 'private, max-age=60'
	});

	// Register dependency for selective invalidation
	depends('app:idcards');

	const { session, supabase, org_id } = locals;
	if (!session) throw error(401, 'Unauthorized');
	if (!org_id) throw error(403, 'No organization context found');

	// Pagination parameters with mobile-aware defaults
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '20')));
	const offset = (page - 1) * limit;

	// Run queries in parallel for better performance
	const [cardsResult, countResult] = await Promise.all([
		// Fetch paginated ID cards
		supabase
			.from('idcards')
			.select(
				`
			id,
			template_id,
			front_image,
			back_image,
			created_at,
			data,
			templates (
				name
			)
		`
			)
			.eq('org_id', org_id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1),
		// Get total count for pagination
		supabase.from('idcards').select('id', { count: 'exact', head: true }).eq('org_id', org_id)
	]);

	const { data: cards, error: fetchError } = cardsResult;
	const totalCount = countResult.count || 0;

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
					side: 'front'
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

	// Get unique template names from the current page's cards
	const templateNames = Array.from(
		new Set(idCards.map((card) => card.template_name).filter(Boolean))
	);

	// Only fetch template metadata if there are templates to query
	let templateFields: { [templateName: string]: TemplateVariable[] } = {};
	let templateDimensions: Record<string, { width: number; height: number; unit: string }> = {};

	if (templateNames.length > 0) {
		// Fetch template info in parallel
		const [templatesResult, dimsResult] = await Promise.all([
			supabase
				.from('templates')
				.select('name, template_elements')
				.eq('org_id', org_id)
				.in('name', templateNames),
			supabase
				.from('templates')
				.select('name, width_pixels, height_pixels')
				.eq('org_id', org_id)
				.in('name', templateNames)
		]);

		if (templatesResult.data) {
			templatesResult.data.forEach((template: any) => {
				const elements = template.template_elements || [];
				templateFields[template.name] = elements
					.filter((el: any) => el.type === 'text' || el.type === 'selection')
					.map((el: any) => ({
						variableName: el.variableName,
						side: el.side
					}));
			});
		}

		if (dimsResult.data) {
			dimsResult.data.forEach((template: any) => {
				templateDimensions[template.name] = {
					width: template.width_pixels || 1013,
					height: template.height_pixels || 638,
					unit: 'pixels'
				};
			});
		}
	}

	const metadata: Metadata = {
		organization_name: 'Organization',
		templates: templateFields,
		pagination: {
			total_records: totalCount,
			current_offset: offset,
			limit: limit
		}
	};

	return {
		idCards,
		metadata,
		templateDimensions,
		pagination: {
			page,
			limit,
			total: totalCount,
			totalPages: Math.ceil(totalCount / limit)
		}
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
	},

	updateField: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const cardId = formData.get('cardId')?.toString();
		const fieldName = formData.get('fieldName')?.toString();
		const fieldValue = formData.get('fieldValue')?.toString() ?? '';

		if (!cardId || !fieldName) {
			return fail(400, { error: 'Card ID and field name are required' });
		}

		try {
			// First get the current data
			const { data: cardData, error: fetchError } = await supabase
				.from('idcards')
				.select('data')
				.eq('id', cardId)
				.single();

			if (fetchError) {
				console.error('Error fetching card:', fetchError);
				return fail(500, { error: 'Failed to fetch card' });
			}

			// Merge the new field value with existing data
			const currentData = (cardData as any)?.data || {};
			const updatedData = {
				...currentData,
				[fieldName]: fieldValue
			};

			// Update the card
			const { error: updateError } = await (supabase as any)
				.from('idcards')
				.update({ data: updatedData })
				.eq('id', cardId);

			if (updateError) {
				console.error('Error updating card:', updateError);
				return fail(500, { error: 'Failed to update card' });
			}

			return { success: true, cardId, fieldName, fieldValue };
		} catch (error) {
			console.error('Error in update field action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
