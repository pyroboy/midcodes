import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { ingredients } from '$lib/server/schema';
import { publishIngredientEvent } from '$lib/server/ably';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const rows = await db.select().from(ingredients).orderBy(desc(ingredients.createdAt));
	return json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const [row] = await db.insert(ingredients).values({
		name: body.name,
		category: body.category,
		defaultUnit: body.defaultUnit || 'g',
		packageSize: body.packageSize,
		currentAvgCost: body.currentAvgCost || 0,
		reorderThreshold: body.reorderThreshold || 0,
		currentStock: body.currentStock || 0,
		supplier: body.supplier || null
	}).returning();

	await publishIngredientEvent('ingredient:created', row);
	return json(row, { status: 201 });
};
