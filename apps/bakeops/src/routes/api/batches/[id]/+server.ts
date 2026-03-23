import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { batches, batchIngredients, ingredients } from '$lib/server/schema';
import { publishBatchEvent, publishIngredientEvent } from '$lib/server/ably';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Update batch status
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const updates: any = {};

	if (body.status) {
		updates.status = body.status;
		if (body.status === 'in_progress') updates.startedAt = new Date();
		if (body.status === 'completed') {
			updates.completedAt = new Date();
			if (body.actualYield != null) updates.actualYield = body.actualYield;

			// Deduct stock when completing
			const batchIngs = await db.query.batchIngredients.findMany({
				where: eq(batchIngredients.batchId, params.id)
			});
			for (const bi of batchIngs) {
				const [updated] = await db.update(ingredients)
					.set({ currentStock: sql`GREATEST(0, ${ingredients.currentStock} - ${bi.quantityUsed})` })
					.where(eq(ingredients.id, bi.ingredientId))
					.returning();
				await publishIngredientEvent('ingredient:updated', updated);
			}
		}
	}

	if (body.actualYield != null) updates.actualYield = body.actualYield;

	const [row] = await db.update(batches)
		.set(updates)
		.where(eq(batches.id, params.id))
		.returning();

	if (!row) return json({ error: 'Not found' }, { status: 404 });

	await publishBatchEvent('batch:updated', row);
	return json(row);
};
