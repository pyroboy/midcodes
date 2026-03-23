import { db } from '$lib/server/db';
import { productPrices, recipes, businesses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const prices = await db.query.productPrices.findMany({
		with: { recipe: true, business: true }
	});

	const allRecipes = await db.query.recipes.findMany({
		where: eq(recipes.isActive, true)
	});
	const allBusinesses = await db.select().from(businesses);

	return { prices, recipes: allRecipes, businesses: allBusinesses };
};
