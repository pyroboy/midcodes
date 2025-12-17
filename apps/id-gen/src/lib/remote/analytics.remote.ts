import { error } from '@sveltejs/kit';
import { query, getRequestEvent } from '$app/server';
import { checkAdmin } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { idcards, profiles, invoices, creditTransactions, templates } from '$lib/server/schema';
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';

// Helper to require admin permissions
// Uses checkAdmin which properly handles role emulation
async function requireAdminPermissions() {
	const { locals } = getRequestEvent();
	if (!checkAdmin(locals)) {
		throw error(403, 'Admin privileges required.');
	}
	return { user: locals.user, org_id: locals.org_id };
}

// Helper to check if user is super admin
function isSuperAdmin(role?: string): boolean {
	return ['super_admin'].includes(role || '');
}

// Date range helpers
function getDateRange(days: number): { start: Date; end: Date } {
	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - days);
	start.setHours(0, 0, 0, 0);
	return { start, end };
}

// Type definitions
interface DailyDataPoint {
	date: string;
	value: number;
}

interface RevenueAnalytics {
	totalRevenue: number;
	paidInvoicesCount: number;
	pendingRevenue: number;
	averageInvoiceValue: number;
	revenueByDay: DailyDataPoint[];
	invoiceStatusBreakdown: { status: string; count: number; amount: number }[];
}

interface CreditAnalytics {
	totalPurchased: number;
	totalUsed: number;
	totalRefunded: number;
	totalBonus: number;
	netCredits: number;
	transactionsByDay: { date: string; purchased: number; used: number }[];
	topConsumers: { email: string; used: number; balance: number }[];
	transactionTypeBreakdown: { type: string; count: number; amount: number }[];
}

interface CardAnalytics {
	totalCards: number;
	cardsThisMonth: number;
	cardsByDay: DailyDataPoint[];
	cardsByTemplate: { templateName: string; count: number }[];
	topGenerators: { email: string; count: number }[];
}

interface UserAnalytics {
	totalUsers: number;
	activeUsers: number;
	newUsersThisMonth: number;
	usersByRole: { role: string; count: number }[];
	registrationsByDay: DailyDataPoint[];
}

interface OverviewStats {
	totalRevenue: number;
	totalCards: number;
	totalCreditsBalance: number;
	totalUsers: number;
	cardsThisMonth: number;
	revenueThisMonth: number;
}

// ==================== OVERVIEW ANALYTICS ====================

export const getOverviewAnalytics = query(async (): Promise<OverviewStats> => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const [
		totalCardsResult,
		cardsThisMonthResult,
		users,
		paidInvoices
	] = await Promise.all([
		// Total cards
		db.select({ count: sql`count(*)` }).from(idcards).where(eq(idcards.orgId, org_id)),
		// Cards this month
		db.select({ count: sql`count(*)` }).from(idcards).where(and(eq(idcards.orgId, org_id), gte(idcards.createdAt, thisMonth))),
		// Users with credit balances
		db.select({ creditsBalance: profiles.creditsBalance }).from(profiles).where(eq(profiles.orgId, org_id)),
		// Paid invoices
		db.select({ totalAmount: invoices.totalAmount, paidAt: invoices.paidAt })
			.from(invoices)
			.where(and(eq(invoices.orgId, org_id), eq(invoices.status, 'paid')))
	]);

	const totalCards = Number(totalCardsResult[0]?.count || 0);
	const cardsThisMonth = Number(cardsThisMonthResult[0]?.count || 0);

	const totalCreditsBalance = users.reduce((sum, u) => sum + (u.creditsBalance || 0), 0);
	const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
	const revenueThisMonth = paidInvoices
		.filter(inv => inv.paidAt && inv.paidAt >= thisMonth)
		.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

	return {
		totalRevenue: totalRevenue / 100, // Convert centavos to PHP
		totalCards,
		totalCreditsBalance,
		totalUsers: users.length,
		cardsThisMonth,
		revenueThisMonth: revenueThisMonth / 100
	};
});

// ==================== REVENUE ANALYTICS ====================

export const getRevenueAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<RevenueAnalytics> => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);

	const invoicesList = await db
		.select({ 
			id: invoices.id, 
			status: invoices.status, 
			totalAmount: invoices.totalAmount, 
			paidAt: invoices.paidAt, 
			createdAt: invoices.createdAt 
		})
		.from(invoices)
		.where(eq(invoices.orgId, org_id));

	// Calculate totals
	const paidInvoices = invoicesList.filter(inv => inv.status === 'paid');
	const pendingInvoices = invoicesList.filter(inv => inv.status === 'sent');

	const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
	const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
	const averageInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

	// Revenue by day (last N days, paid invoices only)
	const revenueByDay: DailyDataPoint[] = [];
	const dayMap = new Map<string, number>();

	paidInvoices
		.filter(inv => inv.paidAt && inv.paidAt >= start)
		.forEach(inv => {
			const date = inv.paidAt!.toISOString().split('T')[0];
			dayMap.set(date, (dayMap.get(date) || 0) + (inv.totalAmount || 0));
		});

	// Fill in all days in range
	for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().split('T')[0];
		revenueByDay.push({ date: dateStr, value: (dayMap.get(dateStr) || 0) / 100 });
	}

	// Invoice status breakdown
	const statusCounts = new Map<string, { count: number; amount: number }>();
	invoicesList.forEach(inv => {
		const current = statusCounts.get(inv.status) || { count: 0, amount: 0 };
		statusCounts.set(inv.status, {
			count: current.count + 1,
			amount: current.amount + (inv.totalAmount || 0)
		});
	});

	const invoiceStatusBreakdown = Array.from(statusCounts.entries()).map(([status, data]) => ({
		status,
		count: data.count,
		amount: data.amount / 100
	}));

	return {
		totalRevenue: totalRevenue / 100,
		paidInvoicesCount: paidInvoices.length,
		pendingRevenue: pendingRevenue / 100,
		averageInvoiceValue: averageInvoiceValue / 100,
		revenueByDay,
		invoiceStatusBreakdown
	};
});

// ==================== CREDITS ANALYTICS ====================

export const getCreditAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<CreditAnalytics> => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);

	const [
		txList,
		usersList
	] = await Promise.all([
		db.select().from(creditTransactions).where(eq(creditTransactions.orgId, org_id)),
		db.select({
			id: profiles.id,
			email: profiles.email,
			creditsBalance: profiles.creditsBalance,
			cardGenerationCount: profiles.cardGenerationCount
		}).from(profiles).where(eq(profiles.orgId, org_id))
	]);

	// Calculate totals by type
	let totalPurchased = 0, totalUsed = 0, totalRefunded = 0, totalBonus = 0;
	txList.forEach(tx => {
		switch (tx.transactionType) {
			case 'purchase': totalPurchased += tx.amount; break;
			case 'usage': totalUsed += Math.abs(tx.amount); break;
			case 'refund': totalRefunded += Math.abs(tx.amount); break;
			case 'bonus': totalBonus += tx.amount; break;
		}
	});

	// Transactions by day
	const dayPurchased = new Map<string, number>();
	const dayUsed = new Map<string, number>();

	txList
		.filter(tx => tx.createdAt && tx.createdAt >= start)
		.forEach(tx => {
			const date = tx.createdAt!.toISOString().split('T')[0];
			if (tx.transactionType === 'purchase' || tx.transactionType === 'bonus') {
				dayPurchased.set(date, (dayPurchased.get(date) || 0) + tx.amount);
			} else if (tx.transactionType === 'usage') {
				dayUsed.set(date, (dayUsed.get(date) || 0) + Math.abs(tx.amount));
			}
		});

	const transactionsByDay: { date: string; purchased: number; used: number }[] = [];
	for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().split('T')[0];
		transactionsByDay.push({
			date: dateStr,
			purchased: dayPurchased.get(dateStr) || 0,
			used: dayUsed.get(dateStr) || 0
		});
	}

	// Top credit consumers (by card generation count as proxy for usage)
	const topConsumers = usersList
		.filter(u => u.cardGenerationCount > 0)
		.sort((a, b) => b.cardGenerationCount - a.cardGenerationCount)
		.slice(0, 10)
		.map(u => ({
			email: u.email || 'Unknown',
			used: u.cardGenerationCount,
			balance: u.creditsBalance
		}));

	// Transaction type breakdown
	const typeCounts = new Map<string, { count: number; amount: number }>();
	txList.forEach(tx => {
		const current = typeCounts.get(tx.transactionType) || { count: 0, amount: 0 };
		typeCounts.set(tx.transactionType, {
			count: current.count + 1,
			amount: current.amount + Math.abs(tx.amount)
		});
	});

	const transactionTypeBreakdown = Array.from(typeCounts.entries()).map(([type, data]) => ({
		type,
		count: data.count,
		amount: data.amount
	}));

	return {
		totalPurchased,
		totalUsed,
		totalRefunded,
		totalBonus,
		netCredits: totalPurchased + totalBonus - totalRefunded,
		transactionsByDay,
		topConsumers,
		transactionTypeBreakdown
	};
});

// ==================== CARD ANALYTICS ====================

export const getCardAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<CardAnalytics> => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);
	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const [
		totalCardsResult,
		cardsThisMonthResult,
		recentCards,
		templatesList,
		usersList
	] = await Promise.all([
		db.select({ count: sql`count(*)` }).from(idcards).where(eq(idcards.orgId, org_id)),
		db.select({ count: sql`count(*)` }).from(idcards).where(and(eq(idcards.orgId, org_id), gte(idcards.createdAt, thisMonth))),
		db.select({ id: idcards.id, templateId: idcards.templateId, createdAt: idcards.createdAt })
			.from(idcards)
			.where(and(eq(idcards.orgId, org_id), gte(idcards.createdAt, start)))
			.orderBy(desc(idcards.createdAt)),
		db.select({ id: templates.id, name: templates.name }).from(templates).where(eq(templates.orgId, org_id)),
		db.select({ id: profiles.id, email: profiles.email, cardGenerationCount: profiles.cardGenerationCount })
			.from(profiles).where(eq(profiles.orgId, org_id))
	]);

	const totalCards = Number(totalCardsResult[0]?.count || 0);
	const cardsThisMonth = Number(cardsThisMonthResult[0]?.count || 0);

	// Cards by day
	const dayMap = new Map<string, number>();
	recentCards.forEach(card => {
		const date = card.createdAt!.toISOString().split('T')[0];
		dayMap.set(date, (dayMap.get(date) || 0) + 1);
	});

	const cardsByDay: DailyDataPoint[] = [];
	for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().split('T')[0];
		cardsByDay.push({ date: dateStr, value: dayMap.get(dateStr) || 0 });
	}

	// Cards by template
	const templateMap = new Map<string, number>();
	recentCards.forEach(card => {
		if (card.templateId) {
			templateMap.set(card.templateId, (templateMap.get(card.templateId) || 0) + 1);
		}
	});

	const templateNameMap = new Map(templatesList.map(t => [t.id, t.name]));
	const cardsByTemplate = Array.from(templateMap.entries())
		.map(([id, count]) => ({
			templateName: templateNameMap.get(id) || 'Unknown Template',
			count
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	// Top generators
	const topGenerators = usersList
		.filter(u => u.cardGenerationCount > 0)
		.sort((a, b) => b.cardGenerationCount - a.cardGenerationCount)
		.slice(0, 10)
		.map(u => ({
			email: u.email || 'Unknown',
			count: u.cardGenerationCount
		}));

	return {
		totalCards,
		cardsThisMonth,
		cardsByDay,
		cardsByTemplate,
		topGenerators
	};
});

// ==================== USER ANALYTICS ====================

export const getUserAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<UserAnalytics> => {
	const { org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const usersList = await db
		.select({
			id: profiles.id,
			email: profiles.email,
			role: profiles.role,
			createdAt: profiles.createdAt,
			updatedAt: profiles.updatedAt
		})
		.from(profiles)
		.where(eq(profiles.orgId, org_id));

	// Active users (updated in last 30 days)
	const activeUsers = usersList.filter(u => 
		u.updatedAt && u.updatedAt >= thirtyDaysAgo
	).length;

	// New users this month
	const newUsersThisMonth = usersList.filter(u => 
		u.createdAt && u.createdAt >= thisMonth
	).length;

	// Users by role
	const roleMap = new Map<string, number>();
	usersList.forEach(u => {
		const role = u.role || 'unknown';
		roleMap.set(role, (roleMap.get(role) || 0) + 1);
	});

	const usersByRole = Array.from(roleMap.entries())
		.map(([role, count]) => ({ role, count }))
		.sort((a, b) => b.count - a.count);

	// Registrations by day
	const dayMap = new Map<string, number>();
	usersList
		.filter(u => u.createdAt && u.createdAt >= start)
		.forEach(u => {
			const date = u.createdAt!.toISOString().split('T')[0];
			dayMap.set(date, (dayMap.get(date) || 0) + 1);
		});

	const registrationsByDay: DailyDataPoint[] = [];
	for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().split('T')[0];
		registrationsByDay.push({ date: dateStr, value: dayMap.get(dateStr) || 0 });
	}

	return {
		totalUsers: usersList.length,
		activeUsers,
		newUsersThisMonth,
		usersByRole,
		registrationsByDay
	};
});
