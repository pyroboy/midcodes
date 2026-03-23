import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { recipes } from '$lib/server/schema';
import { publishRecipeEvent } from '$lib/server/ably';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rows = await db.query.recipes.findMany({
		with: { recipeIngredients: { with: { ingredient: true } } },
		orderBy: [desc(recipes.createdAt)]
	});
	return json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const [row] = await db.insert(recipes).values({
		businessId: body.businessId || null,
		name: body.name,
		description: body.description || null,
		category: body.category || 'cookies',
		yieldAmount: body.yieldAmount,
		yieldUnit: body.yieldUnit || 'pcs',
		prepTime: body.prepTime || null,
		bakeTime: body.bakeTime || null,
		instructions: body.instructions || [],
		tips: body.tips || []
	}).returning();

	await publishRecipeEvent('recipe:created', row);
	return json(row, { status: 201 });
};
