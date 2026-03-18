import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { automationLogs } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import {
	getOverdueBillings,
	getMissingData,
	getPenaltyStatus,
	getOccupancyReport,
	getFinancialSummary,
	getPaymentActivity,
	getTenantOverview,
	getLeaseOverview,
	getBudgetSummary,
	getExpenseSummary,
	getMeterSummary,
	getMaintenanceSummary,
	getSystemHealth,
	generateCopySummary,
	type InsightsData
} from './queries';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return { insights: null, summary: '', automationLogs: [], appUrl: url.origin };
	}

	const [
		overdue, missingData, penalties, occupancy,
		financial, paymentActivity, tenantOverview, leaseOverview,
		budgetSummary, expenseSummary, meterSummary, maintenanceSummary,
		systemHealth, recentLogs
	] = await Promise.all([
		getOverdueBillings(),
		getMissingData(),
		getPenaltyStatus(),
		getOccupancyReport(),
		getFinancialSummary(),
		getPaymentActivity(),
		getTenantOverview(),
		getLeaseOverview(),
		getBudgetSummary(),
		getExpenseSummary(),
		getMeterSummary(),
		getMaintenanceSummary(),
		getSystemHealth(),
		db.select().from(automationLogs).orderBy(desc(automationLogs.startedAt)).limit(20)
	]);

	const insights: InsightsData = {
		overdue, missingData, penalties, occupancy,
		financial, paymentActivity, tenantOverview, leaseOverview,
		budgetSummary, expenseSummary, meterSummary, maintenanceSummary,
		systemHealth,
		generatedAt: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
	};

	const summary = generateCopySummary(insights, url.origin);

	return { insights, summary, automationLogs: recentLogs, appUrl: url.origin };
};
