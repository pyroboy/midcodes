import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CreditTransaction } from '$lib/schemas/billing.schema';
import { db } from '$lib/server/db';
import { creditTransactions, profiles, idcards, templates } from '$lib/server/schema';
import { eq, desc, gte, sql, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user, org_id } = locals;

	if (!user) {
		throw redirect(302, '/auth');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const type = url.searchParams.get('type') || 'all';
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		// Build query for credit transactions
		const whereConditions = type && type !== 'all'
			? and(eq(creditTransactions.userId, user.id), eq(creditTransactions.transactionType, type))
			: eq(creditTransactions.userId, user.id);

		const transactions = await db.select()
			.from(creditTransactions)
			.where(whereConditions)
			.orderBy(desc(creditTransactions.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count
		const countResult = await db.select({ count: sql<number>`count(*)` })
			.from(creditTransactions)
			.where(whereConditions);
		const count = Number(countResult[0]?.count || 0);

		// Get user's current credit info
		const [profile] = await db.select({
			creditsBalance: profiles.creditsBalance,
			cardGenerationCount: profiles.cardGenerationCount,
			templateCount: profiles.templateCount,
			unlimitedTemplates: profiles.unlimitedTemplates
		})
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		// Get usage summary for current month
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const monthlyTransactions = await db.select({
			amount: creditTransactions.amount,
			transactionType: creditTransactions.transactionType
		})
			.from(creditTransactions)
			.where(and(
				eq(creditTransactions.userId, user.id),
				gte(creditTransactions.createdAt, startOfMonth)
			));

		// Calculate monthly usage
		let creditsUsedThisMonth = 0;
		let creditsPurchasedThisMonth = 0;

		for (const tx of monthlyTransactions) {
			if (tx.transactionType === 'usage' && tx.amount < 0) {
				creditsUsedThisMonth += Math.abs(tx.amount);
			} else if (tx.transactionType === 'purchase' && tx.amount > 0) {
				creditsPurchasedThisMonth += tx.amount;
			}
		}

		// Get ID cards and templates created this month
		const cardsThisMonthResult = await db.select({ count: sql<number>`count(*)` })
			.from(idcards)
			.where(and(
				eq(idcards.orgId, org_id!),
				gte(idcards.createdAt, startOfMonth)
			));
		const cardsThisMonth = Number(cardsThisMonthResult[0]?.count || 0);

		const templatesThisMonthResult = await db.select({ count: sql<number>`count(*)` })
			.from(templates)
			.where(and(
				eq(templates.orgId, org_id!),
				gte(templates.createdAt, startOfMonth)
			));
		const templatesThisMonth = Number(templatesThisMonthResult[0]?.count || 0);

		return {
			transactions: (transactions || []) as unknown as CreditTransaction[],
			totalCount: count,
			currentPage: page,
			totalPages: Math.ceil(count / limit),
			filterType: type,
			summary: {
				currentBalance: profile?.creditsBalance || 0,
				cardGenerationCount: profile?.cardGenerationCount || 0,
				templateCount: profile?.templateCount || 0,
				unlimitedTemplates: profile?.unlimitedTemplates || false,
				creditsUsedThisMonth,
				creditsPurchasedThisMonth,
				cardsThisMonth,
				templatesThisMonth
			}
		};
	} catch (error) {
		console.error('Error loading history:', error);
		return {
			transactions: [],
			totalCount: 0,
			currentPage: 1,
			totalPages: 1,
			filterType: 'all',
			summary: {
				currentBalance: 0,
				cardGenerationCount: 0,
				templateCount: 0,
				unlimitedTemplates: false,
				creditsUsedThisMonth: 0,
				creditsPurchasedThisMonth: 0,
				cardsThisMonth: 0,
				templatesThisMonth: 0
			},
			error: 'Failed to load history'
		};
	}
};
