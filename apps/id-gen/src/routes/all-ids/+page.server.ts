import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Minimal server load - just register dependency for smart invalidation
// Auth is already handled by hooks.server.ts, org_id comes from root layout
// Card data is fetched client-side via remote functions
export const load = (async ({ depends, setHeaders }) => {
	// Register dependency for smart invalidation
	// Use invalidate('app:idcards') to re-run this load without full page refresh
	depends('app:idcards');

	// Cache this minimal response for 5 minutes - it has no dynamic data
	// setHeaders({ 'cache-control': 'private, max-age=300' });

	return {};
}) satisfies PageServerLoad;

// Keep form actions for delete/update operations
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
