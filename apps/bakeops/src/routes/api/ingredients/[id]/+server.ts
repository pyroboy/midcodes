import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { ingredients } from '$lib/server/schema';
import { publishIngredientEvent } from '$lib/server/ably';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const [row] = await db.update(ingredients)
		.set({
			name: body.name,
			category: body.category,
			defaultUnit: body.defaultUnit,
			packageSize: body.packageSize,
			currentAvgCost: body.currentAvgCost,
			reorderThreshold: body.reorderThreshold,
			currentStock: body.currentStock,
			supplier: body.supplier
		})
		.where(eq(ingredients.id, params.id))
		.returning();

	if (!row) return json({ error: 'Not found' }, { status: 404 });

	await publishIngredientEvent('ingredient:updated', row);
	return json(row);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	await db.delete(ingredients).where(eq(ingredients.id, params.id));
	await publishIngredientEvent('ingredient:deleted', { id: params.id });
	return json({ ok: true });
};
