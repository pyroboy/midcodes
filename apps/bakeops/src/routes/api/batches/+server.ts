import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { batches, batchIngredients, recipeIngredients, ingredients } from '$lib/server/schema';
import { publishBatchEvent } from '$lib/server/ably';
import { eq, desc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rows = await db.query.batches.findMany({
		with: { recipe: true, business: true, batchIngredients: { with: { ingredient: true } } },
		orderBy: [desc(batches.createdAt)]
	});
	return json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const multiplier = parseFloat(body.multiplier || '1');

	// Get recipe ingredients to snapshot costs
	const ri = await db.query.recipeIngredients.findMany({
		where: eq(recipeIngredients.recipeId, body.recipeId),
		with: { ingredient: true }
	});

	// Calculate total cost
	let totalCost = 0;
	const ingredientSnapshots = ri.map((item) => {
		const costPerUnit = item.ingredient.packageSize > 0
			? Math.round(item.ingredient.currentAvgCost / item.ingredient.packageSize)
			: 0;
		const qty = Math.round(item.amount * multiplier);
		totalCost += costPerUnit * qty;
		return {
			ingredientId: item.ingredientId,
			quantityUsed: qty,
			unitCostAtTime: costPerUnit
		};
	});

	// Create batch
	const [batch] = await db.insert(batches).values({
		recipeId: body.recipeId,
		businessId: body.businessId,
		multiplier: String(multiplier),
		plannedYield: Math.round(body.plannedYield * multiplier),
		status: 'planned',
		totalCostCentavos: totalCost,
		scheduledFor: body.scheduledFor || null,
		producedBy: locals.user.id
	}).returning();

	// Insert batch ingredient snapshots
	if (ingredientSnapshots.length > 0) {
		await db.insert(batchIngredients).values(
			ingredientSnapshots.map((s) => ({ ...s, batchId: batch.id }))
		);
	}

	await publishBatchEvent('batch:created', batch);
	return json(batch, { status: 201 });
};
