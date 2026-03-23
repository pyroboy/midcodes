import { db } from '$lib/server/db';
import { ingredients } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.select().from(ingredients).orderBy(desc(ingredients.createdAt));
	return { ingredients: rows };
};
