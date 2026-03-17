import { db } from '$lib/server/db';
import { articles, churches, pastors, contactSubmissions } from '$lib/server/schema';
import { count, eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [[articleCount], [churchCount], [pastorCount], [unreadCount], recentMessages] =
		await Promise.all([
			db.select({ value: count() }).from(articles),
			db.select({ value: count() }).from(churches),
			db.select({ value: count() }).from(pastors),
			db.select({ value: count() }).from(contactSubmissions).where(eq(contactSubmissions.isRead, false)),
			db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(5)
		]);

	return {
		stats: {
			articles: articleCount.value,
			churches: churchCount.value,
			pastors: pastorCount.value,
			unread: unreadCount.value
		},
		recentMessages
	};
};
