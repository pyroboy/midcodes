import { db } from '$lib/server/db';
import { batches, recipes, businesses } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.query.batches.findMany({
		with: { recipe: true, business: true },
		orderBy: [desc(batches.createdAt)]
	});

	const allRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isActive, true)
	});
	const allBusinesses = await db.select().from(businesses);

	return { batches: rows, recipes: allRecipes, businesses: allBusinesses };
};
