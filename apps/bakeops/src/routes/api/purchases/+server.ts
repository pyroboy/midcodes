import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { purchases, ingredients } from '$lib/server/schema';
import { publishIngredientEvent } from '$lib/server/ably';
import { eq, desc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rows = await db.query.purchases.findMany({
		with: { ingredient: true },
		orderBy: [desc(purchases.purchasedAt)]
	});
	return json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();

	// Insert purchase
	const [purchase] = await db.insert(purchases).values({
		ingredientId: body.ingredientId,
		quantity: body.quantity,
		totalCost: body.totalCost,
		supplier: body.supplier || null,
		recordedBy: locals.user.id
	}).returning();

	// Update ingredient stock and avg cost
	const [ingredient] = await db.update(ingredients)
		.set({
			currentStock: sql`${ingredients.currentStock} + ${body.quantity}`,
			currentAvgCost: sql`CASE
				WHEN ${ingredients.currentStock} = 0 THEN ${Math.round(body.totalCost / body.quantity * (await db.select({ ps: ingredients.packageSize }).from(ingredients).where(eq(ingredients.id, body.ingredientId)).then(r => r[0]?.ps || 1)))}
				ELSE ${ingredients.currentAvgCost}
			END`
		})
		.where(eq(ingredients.id, body.ingredientId))
		.returning();

	await publishIngredientEvent('ingredient:updated', ingredient);
	return json(purchase, { status: 201 });
};
