import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes, recipeIngredients, ingredients } from '$lib/server/schema';
import { publishRecipeEvent } from '$lib/server/ably';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const row = await db.query.recipes.findFirst({
		where: eq(recipes.id, params.id),
		with: { recipeIngredients: { with: { ingredient: true } }, productPrices: true }
	});

	if (!row) return json({ error: 'Not found' }, { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const [row] = await db.update(recipes)
		.set({
			name: body.name,
			description: body.description,
			category: body.category,
			yieldAmount: body.yieldAmount,
			yieldUnit: body.yieldUnit,
			prepTime: body.prepTime,
			bakeTime: body.bakeTime,
			instructions: body.instructions,
			tips: body.tips,
			isActive: body.isActive
		})
		.where(eq(recipes.id, params.id))
		.returning();

	if (!row) return json({ error: 'Not found' }, { status: 404 });

	await publishRecipeEvent('recipe:updated', row);
	return json(row);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	await db.delete(recipes).where(eq(recipes.id, params.id));
	await publishRecipeEvent('recipe:deleted', { id: params.id });
	return json({ ok: true });
};
