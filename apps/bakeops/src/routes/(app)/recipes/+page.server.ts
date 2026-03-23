import { db } from '$lib/server/db';
import { recipes, ingredients } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.query.recipes.findMany({
		with: { recipeIngredients: { with: { ingredient: true } } },
		orderBy: [desc(recipes.createdAt)]
	});

	const allIngredients = await db.select().from(ingredients);

	return { recipes: rows, ingredients: allIngredients };
};
