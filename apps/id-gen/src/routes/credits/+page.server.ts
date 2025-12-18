import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, creditTransactions, idcards, paymentRecords } from '$lib/server/schema';
import { eq, desc, gte, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to auth if not logged in
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	try {
		// Get user's current credit balance
		const [profile] = await db.select({
			creditsBalance: profiles.creditsBalance
		})
			.from(profiles)
			.where(eq(profiles.id, locals.user.id))
			.limit(1);

		// Get recent credit transactions
		const transactions = await db.select()
			.from(creditTransactions)
			.where(eq(creditTransactions.userId, locals.user.id))
			.orderBy(desc(creditTransactions.createdAt))
			.limit(50);

		// Get usage statistics for the current month
		const currentMonth = new Date();
		const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

		// Get monthly usage (cards created this month by user's org)
		const monthlyUsageResult = await db.select({ count: sql<number>`count(*)` })
			.from(idcards)
			.where(gte(idcards.createdAt, startOfMonth));
		const monthlyUsage = Number(monthlyUsageResult[0]?.count || 0);

		// Get all-time card count
		const totalGenResult = await db.select({ count: sql<number>`count(*)` })
			.from(idcards);
		const totalGenerations = Number(totalGenResult[0]?.count || 0);

		// Get purchase history from payment_records table
		const purchases = await db.select()
			.from(paymentRecords)
			.where(eq(paymentRecords.userId, locals.user.id))
			.orderBy(desc(paymentRecords.createdAt))
			.limit(20);

		return {
			user: locals.user,
			credits: profile?.creditsBalance || 0,
			transactions: transactions || [],
			monthlyUsage,
			totalGenerations,
			purchases: purchases.filter(p => p.status === 'paid' || p.status === 'completed') || []
		};
	} catch (error) {
		console.error('Error loading credits data:', error);
		return {
			user: locals.user,
			credits: 0,
			monthlyGenerationsUsed: 0,
			transactions: [],
			monthlyUsage: 0,
			totalGenerations: 0,
			purchases: [],
			error: 'Failed to load credits data'
		};
	}
};
