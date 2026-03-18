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
	type InsightsData,
	type OverdueReport,
	type MissingDataItem,
	type PenaltyStatus,
	type OccupancyReport,
	type FinancialSummary,
	type PaymentActivity,
	type TenantOverview,
	type LeaseOverview,
	type BudgetSummary,
	type ExpenseSummary,
	type MeterSummary,
	type MaintenanceSummary
} from './queries';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return { insights: null, summary: '', automationLogs: [], appUrl: url.origin };
	}

	// Use Promise.allSettled so one failing query doesn't crash the entire page
	const results = await Promise.allSettled([
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

	const settled = <T>(r: PromiseSettledResult<T>, fallback: T): T => {
		if (r.status === 'fulfilled') return r.value;
		console.error('[Insights] Query failed:', r.reason?.message || r.reason);
		return fallback;
	};

	const emptyMaintenance = { total: 0, pending: 0, inProgress: 0, completed: 0, pendingItems: [] };
	const emptyHealth = { lastBillingDate: null, lastPaymentDate: null, lastReadingDate: null, lastExpenseDate: null, timeline: [] };

	const [
		overdue, missingData, penalties, occupancy,
		financial, paymentActivity, tenantOverview, leaseOverview,
		budgetSummary, expenseSummary, meterSummary, maintenanceSummary,
		systemHealth, recentLogs
	] = [
		settled(results[0], { critical: [], warning: [], mild: [], totalOverdueBalance: 0, totalTenants: 0 } as OverdueReport),
		settled(results[1], [] as MissingDataItem[]),
		settled(results[2], { eligible: [], applied: [], totalPenaltyApplied: 0, totalPenaltyOutstanding: 0 } as PenaltyStatus),
		settled(results[3], { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0, expiringIn30: [], expiringIn60: [], expiringIn90: [], expiredWithTenant: [], vacantList: [], totalMonthlyRevenue: 0 } as OccupancyReport),
		settled(results[4], { billingsByType: [], totalBilled: 0, totalCollected: 0, totalOutstanding: 0, collectionRate: 0, securityDeposits: { totalRequired: 0, totalPaid: 0, totalOutstanding: 0, fullyPaidLeases: 0, outstandingLeases: 0, details: [] } } as FinancialSummary),
		settled(results[5], { recentPayments: [], totalPaymentsThisMonth: 0, amountCollectedThisMonth: 0, methodBreakdown: [], revertedCount: 0, revertedAmount: 0 } as PaymentActivity),
		settled(results[6], { total: 0, active: 0, inactive: 0, pending: 0, blacklisted: 0, newThisMonth: 0 } as TenantOverview),
		settled(results[7], { total: 0, active: 0, expired: 0, terminated: 0, pending: 0, byType: [] } as LeaseOverview),
		settled(results[8], { totalBudgets: 0, totalPlanned: 0, totalActual: 0, totalPending: 0, utilizationRate: 0, overBudgetCount: 0, items: [] } as BudgetSummary),
		settled(results[9], { totalExpenses: 0, totalApproved: 0, totalPending: 0, totalRejected: 0, pendingApprovalAmount: 0, byType: [], recentExpenses: [] } as ExpenseSummary),
		settled(results[10], { totalMeters: 0, activeMeters: 0, byType: [], readingsThisMonth: 0, readingsLastMonth: 0, staleMeters: [] } as MeterSummary),
		settled(results[11], emptyMaintenance as MaintenanceSummary),
		settled(results[12], emptyHealth as any),
		settled(results[13], [] as any[])
	];

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
