import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipeIngredients, recipes, ingredients } from '$lib/server/schema';
import { publishRecipeEvent } from '$lib/server/ably';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Add ingredient to recipe + recalculate costs
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const [row] = await db.insert(recipeIngredients).values({
		recipeId: params.id,
		ingredientId: body.ingredientId,
		amount: body.amount,
		unitOverride: body.unitOverride || null,
		notes: body.notes || null
	}).returning();

	// Recalculate recipe cost
	await recalcRecipeCost(params.id);

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.id, params.id),
		with: { recipeIngredients: { with: { ingredient: true } } }
	});

	await publishRecipeEvent('recipe:updated', recipe);
	return json(row, { status: 201 });
};

// Remove ingredient from recipe
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	await db.delete(recipeIngredients).where(eq(recipeIngredients.id, body.recipeIngredientId));

	await recalcRecipeCost(params.id);

	const recipe = await db.query.recipes.findFirst({
		where: eq(recipes.id, params.id),
		with: { recipeIngredients: { with: { ingredient: true } } }
	});

	await publishRecipeEvent('recipe:updated', recipe);
	return json({ ok: true });
};

async function recalcRecipeCost(recipeId: string) {
	// Get all ingredients for this recipe with their costs
	const ri = await db.query.recipeIngredients.findMany({
		where: eq(recipeIngredients.recipeId, recipeId),
		with: { ingredient: true }
	});

	let totalCentavos = 0;
	for (const item of ri) {
		const ing = item.ingredient;
		if (ing.packageSize > 0 && ing.currentAvgCost > 0) {
			// cost per unit = avgCostPerPackage / packageSize * amount
			totalCentavos += Math.round((ing.currentAvgCost / ing.packageSize) * item.amount);
		}
	}

	const recipe = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
	const perUnit = recipe && recipe.yieldAmount > 0 ? Math.round(totalCentavos / recipe.yieldAmount) : 0;

	await db.update(recipes)
		.set({ totalCostCentavos: totalCentavos, perUnitCostCentavos: perUnit })
		.where(eq(recipes.id, recipeId));
}
