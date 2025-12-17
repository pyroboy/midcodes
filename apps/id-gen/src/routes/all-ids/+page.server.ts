import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { idcards } from '$lib/server/schema';
import { eq, inArray } from 'drizzle-orm';

// Minimal server load - just register dependency for smart invalidation
export const load = (async ({ depends }) => {
	// Register dependency for smart invalidation
	depends('app:idcards');
	return {};
}) satisfies PageServerLoad;

// Keep form actions for delete/update operations
export const actions: Actions = {
	deleteCard: async ({ request }) => {
		const formData = await request.formData();
		const cardId = formData.get('cardId')?.toString();

		if (!cardId) {
			return fail(400, { error: 'Card ID is required' });
		}

		try {
			// First get the card details to get the image paths
			const [card] = await db
				.select({
					frontImage: idcards.frontImage,
					backImage: idcards.backImage
				})
				.from(idcards)
				.where(eq(idcards.id, cardId))
				.limit(1);

			if (!card) {
				return fail(404, { error: 'Card not found' });
			}

			const supabaseAdmin = (await import('$lib/server/supabase')).getSupabaseAdmin();

			// Delete images from storage if they exist
			const imagesToDelete = [];
			if (card.frontImage) imagesToDelete.push(card.frontImage);
			if (card.backImage) imagesToDelete.push(card.backImage);

			if (imagesToDelete.length > 0) {
				const { error: storageError } = await supabaseAdmin.storage
					.from('rendered-id-cards')
					.remove(imagesToDelete);

				if (storageError) {
					console.error('Error deleting images:', storageError);
					return fail(500, { error: 'Failed to delete images' });
				}
			}

			// Delete the card record
			await db.delete(idcards).where(eq(idcards.id, cardId));

			return { success: true };
		} catch (error) {
			console.error('Error in delete action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	},

	deleteMultiple: async ({ request }) => {
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
			const cards = await db
				.select({
					id: idcards.id,
					frontImage: idcards.frontImage,
					backImage: idcards.backImage
				})
				.from(idcards)
				.where(inArray(idcards.id, ids));

			const supabaseAdmin = (await import('$lib/server/supabase')).getSupabaseAdmin();

			// Collect all image paths to delete
			const imagesToDelete = [];
			for (const card of cards) {
				if (card.frontImage) imagesToDelete.push(card.frontImage);
				if (card.backImage) imagesToDelete.push(card.backImage);
			}

			// Delete all images from storage in one batch
			if (imagesToDelete.length > 0) {
				const { error: storageError } = await supabaseAdmin.storage
					.from('rendered-id-cards')
					.remove(imagesToDelete);

				if (storageError) {
					console.error('Error deleting images:', storageError);
					return fail(500, { error: 'Failed to delete images' });
				}
			}

			// Delete all card records
			await db.delete(idcards).where(inArray(idcards.id, ids));

			return { success: true };
		} catch (error) {
			console.error('Error in delete multiple action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	},

	updateField: async ({ request }) => {
		const formData = await request.formData();
		const cardId = formData.get('cardId')?.toString();
		const fieldName = formData.get('fieldName')?.toString();
		const fieldValue = formData.get('fieldValue')?.toString() ?? '';

		if (!cardId || !fieldName) {
			return fail(400, { error: 'Card ID and field name are required' });
		}

		try {
			// First get the current data
			const [card] = await db
				.select({ data: idcards.data })
				.from(idcards)
				.where(eq(idcards.id, cardId))
				.limit(1);

			if (!card) {
				return fail(404, { error: 'Card not found' });
			}

			// Merge the new field value with existing data
			const currentData = (card.data as any) || {};
			const updatedData = {
				...currentData,
				[fieldName]: fieldValue
			};

			// Update the card
			await db.update(idcards).set({ data: updatedData }).where(eq(idcards.id, cardId));

			return { success: true, cardId, fieldName, fieldValue };
		} catch (error) {
			console.error('Error in update field action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
