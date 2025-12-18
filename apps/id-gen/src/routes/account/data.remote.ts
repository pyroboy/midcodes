import { query, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { profiles, idcards, templates, creditTransactions } from '$lib/server/schema';
import { eq, sql, desc, gte, and } from 'drizzle-orm';

// Query for user credits (balance, counts, features)
export const getUserCredits = query(async () => {
	const { locals } = getRequestEvent();
	const { user } = locals;
	
	if (!user?.id) return null;
	
	const profile = await db.query.profiles.findFirst({
		where: eq(profiles.id, user.id),
		columns: {
			creditsBalance: true,
			cardGenerationCount: true,
			templateCount: true,
			unlimitedTemplates: true,
			removeWatermarks: true
		}
	});

	if (!profile) {
		return null;
	}

	return {
		credits_balance: profile.creditsBalance || 0,
		card_generation_count: profile.cardGenerationCount || 0,
		template_count: profile.templateCount || 0,
		unlimited_templates: profile.unlimitedTemplates || false,
		remove_watermarks: profile.removeWatermarks || false
	};
});

// Query for dashboard stats
export const getDashboardStats = query(async () => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;
	
	if (!org_id) {
		return { totalCards: 0, totalTemplates: 0, weeklyCards: 0, recentCardsCount: 0 };
	}

	const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	// Run all count queries in parallel using Drizzle
	const [cardsCountResult, templatesCountResult, weeklyCardsResult, recentCardsResult] = await Promise.all([
		// Total cards
		db.select({ count: sql<number>`count(*)` })
			.from(idcards)
			.where(eq(idcards.orgId, org_id)),
		// Total templates
		db.select({ count: sql<number>`count(*)` })
			.from(templates)
			.where(eq(templates.orgId, org_id)),
		// This week's cards
		db.select({ count: sql<number>`count(*)` })
			.from(idcards)
			.where(and(eq(idcards.orgId, org_id), gte(idcards.createdAt, oneWeekAgo))),
		// Recent cards (just to get count of recent ones? Or do we need list? The return type implies count)
		// But previous code selected ID with limit 12 then returned length.
		db.select({ id: idcards.id })
			.from(idcards)
			.where(eq(idcards.orgId, org_id))
			.orderBy(desc(idcards.createdAt))
			.limit(12)
	]);

	return {
		totalCards: Number(cardsCountResult[0]?.count || 0),
		totalTemplates: Number(templatesCountResult[0]?.count || 0),
		weeklyCards: Number(weeklyCardsResult[0]?.count || 0),
		recentCardsCount: recentCardsResult.length || 0
	};
});

// Query for credit history
export const getCreditHistory = query(async () => {
	const { locals } = getRequestEvent();
	const { user } = locals;
	
	if (!user?.id) return [];

	const history = await db.select()
		.from(creditTransactions)
		.where(eq(creditTransactions.userId, user.id))
		.orderBy(desc(creditTransactions.createdAt))
		.limit(30);

	return history || [];
});
