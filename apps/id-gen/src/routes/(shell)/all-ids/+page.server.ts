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
			console.log(`[deleteCard] Fetching card details for ${cardId}...`);
			const [card] = await db
				.select({
					frontImage: idcards.frontImage,
					backImage: idcards.backImage,
					frontImageLowRes: idcards.frontImageLowRes,
					backImageLowRes: idcards.backImageLowRes,
					originalAssets: idcards.originalAssets
				})
				.from(idcards)
				.where(eq(idcards.id, cardId))
				.limit(1);

			if (!card) {
				console.error(`[deleteCard] Card ${cardId} not found in DB`);
				return fail(404, { error: 'Card not found' });
			}
			console.log(`[deleteCard] Found card. collecting images...`);

			// Delete images from R2 storage if they exist
			const imagesToDelete: string[] = [];
			if (card.frontImage) imagesToDelete.push(card.frontImage);
			if (card.backImage) imagesToDelete.push(card.backImage);
			if (card.frontImageLowRes) imagesToDelete.push(card.frontImageLowRes);
			if (card.backImageLowRes) imagesToDelete.push(card.backImageLowRes);

			// Add original assets to deletion list
			if (card.originalAssets && typeof card.originalAssets === 'object') {
				const assets = card.originalAssets as Record<string, { path: string }>;
				Object.values(assets).forEach((asset) => {
					if (asset?.path) imagesToDelete.push(asset.path);
				});
			}

			console.log(`[deleteCard] Deleting ${imagesToDelete.length} images:`, imagesToDelete);

			if (imagesToDelete.length > 0) {
				try {
					const { deleteFromR2 } = await import('$lib/server/s3');
					await Promise.allSettled(imagesToDelete.map((key) => deleteFromR2(key)));
					console.log(`[deleteCard] Images deleted from R2`);
				} catch (storageError) {
					console.error('[deleteCard] Error deleting images from R2:', storageError);
					// Non-fatal - continue with database deletion
				}
			}

			// Delete the card record
			console.log(`[deleteCard] Deleting DB record for ${cardId}...`);
			await db.delete(idcards).where(eq(idcards.id, cardId));
			console.log(`[deleteCard] DB record deleted successfully`);

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
			console.log(`[deleteMultiple] Fetching details for ${ids.length} cards...`);
			const cards = await db
				.select({
					id: idcards.id,
					frontImage: idcards.frontImage,
					backImage: idcards.backImage,
					frontImageLowRes: idcards.frontImageLowRes,
					backImageLowRes: idcards.backImageLowRes,
					originalAssets: idcards.originalAssets
				})
				.from(idcards)
				.where(inArray(idcards.id, ids));
			
			console.log(`[deleteMultiple] Found ${cards.length} cards.`);

			// Collect all image paths to delete from R2
			const imagesToDelete: string[] = [];
			for (const card of cards) {
				if (card.frontImage) imagesToDelete.push(card.frontImage);
				if (card.backImage) imagesToDelete.push(card.backImage);
				if (card.frontImageLowRes) imagesToDelete.push(card.frontImageLowRes);
				if (card.backImageLowRes) imagesToDelete.push(card.backImageLowRes);

				// Add original assets to deletion list
				if (card.originalAssets && typeof card.originalAssets === 'object') {
					const assets = card.originalAssets as Record<string, { path: string }>;
					Object.values(assets).forEach((asset) => {
						if (asset?.path) imagesToDelete.push(asset.path);
					});
				}
			}

			console.log(`[deleteMultiple] Deleting ${imagesToDelete.length} images...`);

			// Delete all images from R2 storage
			if (imagesToDelete.length > 0) {
				try {
					const { deleteFromR2 } = await import('$lib/server/s3');
					await Promise.allSettled(imagesToDelete.map((key) => deleteFromR2(key)));
					console.log(`[deleteMultiple] Images deleted from R2`);
				} catch (storageError) {
					console.error('[deleteMultiple] Error deleting images from R2:', storageError);
					// Non-fatal - continue with database deletion
				}
			}

			// Delete all card records
			console.log(`[deleteMultiple] Deleting DB records...`);
			await db.delete(idcards).where(inArray(idcards.id, ids));
			console.log(`[deleteMultiple] DB records deleted successfully`);

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
