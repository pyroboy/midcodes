import { db } from '$lib/server/db';
import { articles } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allArticles = await db
		.select()
		.from(articles)
		.orderBy(desc(articles.date));

	return { articles: allArticles };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(articles, articles.id, request, 'article')
};
