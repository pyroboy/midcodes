import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	try {
		const { db } = await import('$lib/server/db');
		const { announcements } = await import('$lib/server/schema');
		const { eq, asc, and, or, isNull, gte } = await import('drizzle-orm');

		const now = new Date();

		const activeAnnouncements = await db
			.select({
				id: announcements.id,
				message: announcements.message,
				linkUrl: announcements.linkUrl,
				linkText: announcements.linkText,
				isActive: announcements.isActive
			})
			.from(announcements)
			.where(
				and(
					eq(announcements.isActive, true),
					or(isNull(announcements.expiresAt), gte(announcements.expiresAt, now))
				)
			)
			.orderBy(asc(announcements.sortOrder));

		return { announcements: activeAnnouncements };
	} catch {
		// During build/prerender, database may not be available
		return { announcements: [] };
	}
};
