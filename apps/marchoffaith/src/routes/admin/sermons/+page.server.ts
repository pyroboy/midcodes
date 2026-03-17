import { db } from '$lib/server/db';
import { sermons } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import { deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allSermons = await db
		.select()
		.from(sermons)
		.orderBy(desc(sermons.date));

	return { sermons: allSermons };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(sermons, sermons.id, request, 'sermon')
};
