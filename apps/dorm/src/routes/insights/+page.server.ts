import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { automationLogs, billings, payments, readings, expenses } from '$lib/server/schema';
import { desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return { automationLogs: [], systemHealth: null, appUrl: url.origin };
	}

	const now = new Date();

	// Run 5 cheap server queries in parallel — timeline is computed client-side from RxDB
	const results = await Promise.allSettled([
		// 1. Automation logs (not in RxDB)
		db
			.select()
			.from(automationLogs)
			.orderBy(desc(automationLogs.startedAt))
			.limit(20),

		// 2-5. Last activity dates (4 cheap MAX queries for system health indicators)
		db.select({ d: sql<string>`MAX(${billings.createdAt})` }).from(billings),
		db.select({ d: sql<string>`MAX(${payments.paidAt})` }).from(payments),
		db.select({ d: sql<string>`MAX(${readings.readingDate})` }).from(readings),
		db.select({ d: sql<string>`MAX(${expenses.createdAt})` }).from(expenses)
	]);

	const settled = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
		r.status === 'fulfilled' ? r.value : fallback;

	const recentLogs = settled(results[0], [] as any[]);
	const lastBillingDate = settled(results[1], [{ d: null }] as any[])[0]?.d ?? null;
	const lastPaymentDate = settled(results[2], [{ d: null }] as any[])[0]?.d ?? null;
	const lastReadingDate = settled(results[3], [{ d: null }] as any[])[0]?.d ?? null;
	const lastExpenseDate = settled(results[4], [{ d: null }] as any[])[0]?.d ?? null;

	function daysSince(dateStr: string | null): number | null {
		if (!dateStr) return null;
		return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
	}

	return {
		automationLogs: recentLogs,
		systemHealth: {
			lastBillingDate,
			lastPaymentDate,
			lastReadingDate,
			lastExpenseDate,
			daysSinceLastBilling: daysSince(lastBillingDate),
			daysSinceLastPayment: daysSince(lastPaymentDate),
			daysSinceLastReading: daysSince(lastReadingDate),
			monthlyTimeline: [] // Computed client-side from RxDB stores
		},
		appUrl: url.origin
	};
};
