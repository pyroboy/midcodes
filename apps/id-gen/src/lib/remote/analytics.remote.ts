import { error } from '@sveltejs/kit';
import { query, getRequestEvent } from '$app/server';
import { checkAdmin } from '$lib/utils/adminPermissions';

// Helper to require admin permissions
// Uses checkAdmin which properly handles role emulation
async function requireAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;
	if (!checkAdmin(locals)) {
		throw error(403, 'Admin privileges required.');
	}
	return { user, supabase: locals.supabase as any, org_id: locals.org_id };
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
	const { supabase, org_id, user } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const [
		{ count: totalCards },
		{ count: cardsThisMonth },
		{ data: usersData },
		{ data: invoicesData }
	] = await Promise.all([
		// Total cards
		supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
		// Cards this month
		supabase.from('idcards').select('*', { count: 'exact', head: true })
			.eq('org_id', org_id)
			.gte('created_at', thisMonth.toISOString()),
		// Users with credit balances
		supabase.from('profiles').select('credits_balance').eq('org_id', org_id),
		// Paid invoices
		supabase.from('invoices').select('total_amount, paid_at')
			.eq('org_id', org_id)
			.eq('status', 'paid')
	]);

	const users = usersData as { credits_balance: number }[] | null;
	const invoices = invoicesData as { total_amount: number; paid_at: string }[] | null;

	const totalCreditsBalance = users?.reduce((sum, u) => sum + (u.credits_balance || 0), 0) || 0;
	const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
	const revenueThisMonth = invoices
		?.filter(inv => inv.paid_at && new Date(inv.paid_at) >= thisMonth)
		.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

	return {
		totalRevenue: totalRevenue / 100, // Convert centavos to PHP
		totalCards: totalCards || 0,
		totalCreditsBalance,
		totalUsers: users?.length || 0,
		cardsThisMonth: cardsThisMonth || 0,
		revenueThisMonth: revenueThisMonth / 100
	};
});

// ==================== REVENUE ANALYTICS ====================

export const getRevenueAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<RevenueAnalytics> => {
	const { supabase, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);

	const { data: invoices, error: invError } = await supabase
		.from('invoices')
		.select('id, status, total_amount, paid_at, created_at')
		.eq('org_id', org_id);

	if (invError) throw error(500, 'Failed to fetch invoices');

	const invoicesList = (invoices || []) as { 
		id: string; 
		status: string; 
		total_amount: number; 
		paid_at: string | null;
		created_at: string;
	}[];

	// Calculate totals
	const paidInvoices = invoicesList.filter(inv => inv.status === 'paid');
	const pendingInvoices = invoicesList.filter(inv => inv.status === 'sent');

	const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
	const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
	const averageInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

	// Revenue by day (last N days, paid invoices only)
	const revenueByDay: DailyDataPoint[] = [];
	const dayMap = new Map<string, number>();

	paidInvoices
		.filter(inv => inv.paid_at && new Date(inv.paid_at) >= start)
		.forEach(inv => {
			const date = new Date(inv.paid_at!).toISOString().split('T')[0];
			dayMap.set(date, (dayMap.get(date) || 0) + inv.total_amount);
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
			amount: current.amount + inv.total_amount
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
	const { supabase, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);

	const [
		{ data: transactions },
		{ data: users }
	] = await Promise.all([
		supabase.from('credit_transactions').select('*').eq('org_id', org_id),
		supabase.from('profiles').select('id, email, credits_balance, card_generation_count').eq('org_id', org_id)
	]);

	const txList = (transactions || []) as {
		id: string;
		transaction_type: string;
		amount: number;
		created_at: string;
		user_id: string;
	}[];

	const usersList = (users || []) as {
		id: string;
		email: string;
		credits_balance: number;
		card_generation_count: number;
	}[];

	// Calculate totals by type
	let totalPurchased = 0, totalUsed = 0, totalRefunded = 0, totalBonus = 0;
	txList.forEach(tx => {
		switch (tx.transaction_type) {
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
		.filter(tx => new Date(tx.created_at) >= start)
		.forEach(tx => {
			const date = new Date(tx.created_at).toISOString().split('T')[0];
			if (tx.transaction_type === 'purchase' || tx.transaction_type === 'bonus') {
				dayPurchased.set(date, (dayPurchased.get(date) || 0) + tx.amount);
			} else if (tx.transaction_type === 'usage') {
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
		.filter(u => u.card_generation_count > 0)
		.sort((a, b) => b.card_generation_count - a.card_generation_count)
		.slice(0, 10)
		.map(u => ({
			email: u.email || 'Unknown',
			used: u.card_generation_count,
			balance: u.credits_balance
		}));

	// Transaction type breakdown
	const typeCounts = new Map<string, { count: number; amount: number }>();
	txList.forEach(tx => {
		const current = typeCounts.get(tx.transaction_type) || { count: 0, amount: 0 };
		typeCounts.set(tx.transaction_type, {
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
	const { supabase, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);
	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const [
		{ count: totalCards },
		{ count: cardsThisMonth },
		{ data: recentCards },
		{ data: templates },
		{ data: users }
	] = await Promise.all([
		supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
		supabase.from('idcards').select('*', { count: 'exact', head: true })
			.eq('org_id', org_id)
			.gte('created_at', thisMonth.toISOString()),
		supabase.from('idcards').select('id, template_id, user_id, created_at')
			.eq('org_id', org_id)
			.gte('created_at', start.toISOString())
			.order('created_at', { ascending: false }),
		supabase.from('templates').select('id, name').eq('org_id', org_id),
		supabase.from('profiles').select('id, email, card_generation_count').eq('org_id', org_id)
	]);

	const cardsList = (recentCards || []) as { id: string; template_id: string; user_id: string; created_at: string }[];
	const templatesList = (templates || []) as { id: string; name: string }[];
	const usersList = (users || []) as { id: string; email: string; card_generation_count: number }[];

	// Cards by day
	const dayMap = new Map<string, number>();
	cardsList.forEach(card => {
		const date = new Date(card.created_at).toISOString().split('T')[0];
		dayMap.set(date, (dayMap.get(date) || 0) + 1);
	});

	const cardsByDay: DailyDataPoint[] = [];
	for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
		const dateStr = d.toISOString().split('T')[0];
		cardsByDay.push({ date: dateStr, value: dayMap.get(dateStr) || 0 });
	}

	// Cards by template
	const templateMap = new Map<string, number>();
	cardsList.forEach(card => {
		if (card.template_id) {
			templateMap.set(card.template_id, (templateMap.get(card.template_id) || 0) + 1);
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
		.filter(u => u.card_generation_count > 0)
		.sort((a, b) => b.card_generation_count - a.card_generation_count)
		.slice(0, 10)
		.map(u => ({
			email: u.email || 'Unknown',
			count: u.card_generation_count
		}));

	return {
		totalCards: totalCards || 0,
		cardsThisMonth: cardsThisMonth || 0,
		cardsByDay,
		cardsByTemplate,
		topGenerators
	};
});

// ==================== USER ANALYTICS ====================

export const getUserAnalytics = query('unchecked', async ({ days = 30 }: { days?: number }): Promise<UserAnalytics> => {
	const { supabase, org_id } = await requireAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { start } = getDateRange(days);
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const { data: users, error: usersError } = await supabase
		.from('profiles')
		.select('id, email, role, created_at, updated_at')
		.eq('org_id', org_id);

	if (usersError) throw error(500, 'Failed to fetch users');

	const usersList = (users || []) as {
		id: string;
		email: string;
		role: string;
		created_at: string;
		updated_at: string;
	}[];

	// Active users (updated in last 30 days)
	const activeUsers = usersList.filter(u => 
		u.updated_at && new Date(u.updated_at) >= thirtyDaysAgo
	).length;

	// New users this month
	const newUsersThisMonth = usersList.filter(u => 
		new Date(u.created_at) >= thisMonth
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
		.filter(u => new Date(u.created_at) >= start)
		.forEach(u => {
			const date = new Date(u.created_at).toISOString().split('T')[0];
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
