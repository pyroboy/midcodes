import { db } from '$lib/server/db';
import { sermons } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const publishedSermons = await db
		.select()
		.from(sermons)
		.where(eq(sermons.isPublished, true))
		.orderBy(desc(sermons.date));

	return { sermons: publishedSermons };
};
