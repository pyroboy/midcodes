import { db } from '$lib/server/db';
import { ingredients, recipes, batches, businesses } from '$lib/server/schema';
import { eq, sql, lt, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [ingredientCount] = await db.select({ count: sql<number>`count(*)` }).from(ingredients);
	const [recipeCount] = await db.select({ count: sql<number>`count(*)` }).from(recipes);

	const recentBatches = await db.query.batches.findMany({
		with: { recipe: true, business: true },
		orderBy: [desc(batches.createdAt)],
		limit: 5
	});

	const lowStock = await db.select().from(ingredients)
		.where(lt(ingredients.currentStock, ingredients.reorderThreshold))
		.limit(10);

	const allBusinesses = await db.select().from(businesses);

	return {
		stats: {
			ingredients: ingredientCount.count,
			recipes: recipeCount.count
		},
		recentBatches,
		lowStock,
		businesses: allBusinesses
	};
};
