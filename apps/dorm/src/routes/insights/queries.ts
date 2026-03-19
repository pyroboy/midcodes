import { db } from '$lib/server/db';
import {
	billings,
	leases,
	leaseTenants,
	tenants,
	rentalUnit,
	floors,
	properties,
	meters,
	readings,
	penaltyConfigs,
	payments,
	expenses,
	budgets,
	maintenance
} from '$lib/server/schema';
import { eq, and, lt, gte, gt, sql, isNull, ne, or, inArray, desc, asc } from 'drizzle-orm';

// Re-export types and generateCopySummary from the client-safe module
export type {
	OverdueBilling,
	OverdueReport,
	MissingDataItem,
	PenaltyStatus,
	OccupancyUnit,
	OccupancyReport,
	BillingBreakdown,
	FinancialSummary,
	RecentPayment,
	PaymentActivity,
	TenantOverview,
	LeaseOverview,
	BudgetSummary,
	ExpenseSummary,
	MeterSummary,
	MaintenanceSummary,
	MonthActivity,
	SystemHealth,
	InsightsData
} from './insights-types';
export { generateCopySummary } from './insights-types';

import type {
	OverdueBilling,
	MissingDataItem,
	PenaltyStatus,
	OccupancyUnit,
	OccupancyReport,
	BillingBreakdown,
	RecentPayment,
	FinancialSummary,
	PaymentActivity,
	TenantOverview,
	LeaseOverview,
	BudgetSummary,
	ExpenseSummary,
	MeterSummary,
	MaintenanceSummary,
	SystemHealth,
	MonthActivity,
	OverdueReport
} from './insights-types';

// ── Helper ──────────────────────────────────────

function dedup<T extends { billingId?: number; id?: number }>(
	rows: T[],
	key: keyof T = 'billingId' as keyof T
): T[] {
	const seen = new Set<unknown>();
	return rows.filter((r) => {
		const v = r[key];
		if (seen.has(v)) return false;
		seen.add(v);
		return true;
	});
}

// ── Queries ─────────────────────────────────────

export async function getOverdueBillings(): Promise<OverdueReport> {
	const today = new Date().toISOString().split('T')[0];

	const overdueBillingRows = await db
		.select({
			billingId: billings.id,
			type: billings.type,
			amount: billings.amount,
			balance: billings.balance,
			penaltyAmount: billings.penaltyAmount,
			dueDate: billings.dueDate,
			status: billings.status,
			leaseId: billings.leaseId,
			tenantName: tenants.name,
			tenantId: tenants.id,
			unitName: rentalUnit.name
		})
		.from(billings)
		.innerJoin(leases, eq(billings.leaseId, leases.id))
		.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
		.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
		.innerJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
		.where(
			and(
				lt(billings.dueDate, today),
				inArray(billings.status, ['PENDING', 'PARTIAL', 'OVERDUE', 'PENALIZED']),
				gt(billings.balance, '0')
			)
		)
		.orderBy(asc(billings.dueDate));

	const mapped: OverdueBilling[] = overdueBillingRows.map((r) => {
		const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(r.dueDate).getTime()) / 86400000));
		return {
			billingId: r.billingId, tenantName: r.tenantName, tenantId: r.tenantId,
			leaseId: r.leaseId, type: r.type, amount: r.amount, balance: r.balance,
			penaltyAmount: r.penaltyAmount ?? '0', dueDate: r.dueDate, daysOverdue,
			status: r.status, unitName: r.unitName
		};
	});

	const unique = dedup(mapped);
	const critical = unique.filter((b) => b.daysOverdue > 30);
	const warning = unique.filter((b) => b.daysOverdue >= 8 && b.daysOverdue <= 30);
	const mild = unique.filter((b) => b.daysOverdue >= 1 && b.daysOverdue < 8);
	const totalOverdueBalance = unique.reduce((sum, b) => sum + Number(b.balance), 0);
	const uniqueTenants = new Set(unique.map((b) => b.tenantId));

	return { critical, warning, mild, totalOverdueBalance, totalTenants: uniqueTenants.size };
}

export async function getMissingData(): Promise<MissingDataItem[]> {
	const items: MissingDataItem[] = [];

	const noContact = await db.select({ id: tenants.id, name: tenants.name }).from(tenants)
		.where(and(or(isNull(tenants.contactNumber), eq(tenants.contactNumber, '')), ne(tenants.tenantStatus, 'INACTIVE')));
	if (noContact.length > 0) items.push({ category: 'Missing Contact Info', description: 'Active tenants without contact numbers', items: noContact.map((t) => ({ id: t.id, name: t.name, detail: 'No contact number' })) });

	const noEmail = await db.select({ id: tenants.id, name: tenants.name }).from(tenants)
		.where(and(or(isNull(tenants.email), eq(tenants.email, '')), ne(tenants.tenantStatus, 'INACTIVE')));
	if (noEmail.length > 0) items.push({ category: 'Missing Email', description: 'Active tenants without email addresses', items: noEmail.map((t) => ({ id: t.id, name: t.name, detail: 'No email' })) });

	const noEmergency = await db.select({ id: tenants.id, name: tenants.name }).from(tenants)
		.where(and(isNull(tenants.emergencyContact), ne(tenants.tenantStatus, 'INACTIVE')));
	if (noEmergency.length > 0) items.push({ category: 'Missing Emergency Contact', description: 'Active tenants without emergency contact info', items: noEmergency.map((t) => ({ id: t.id, name: t.name, detail: 'No emergency contact' })) });

	const unitsWithoutMeters = await db.select({ id: rentalUnit.id, name: rentalUnit.name }).from(rentalUnit)
		.leftJoin(meters, eq(rentalUnit.id, meters.rentalUnitId)).where(isNull(meters.id));
	if (unitsWithoutMeters.length > 0) items.push({ category: 'Units Without Meters', description: 'Rental units with no assigned meters', items: unitsWithoutMeters.map((u) => ({ id: u.id, name: u.name, detail: 'No meter assigned' })) });

	const staleDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
	const activeMeters = await db.select({ meterId: meters.id, meterName: meters.name, latestReading: sql<string>`MAX(${readings.readingDate})`.as('latest_reading') })
		.from(meters).leftJoin(readings, eq(meters.id, readings.meterId)).where(eq(meters.status, 'ACTIVE')).groupBy(meters.id, meters.name);
	const staleMeters = activeMeters.filter((m) => !m.latestReading || m.latestReading < staleDate);
	if (staleMeters.length > 0) items.push({ category: 'Stale Meter Readings', description: 'Active meters with no readings in the past 30 days', items: staleMeters.map((m) => ({ id: m.meterId, name: m.meterName, detail: m.latestReading ? `Last reading: ${m.latestReading}` : 'No readings recorded' })) });

	return items;
}

export async function getPenaltyStatus(): Promise<PenaltyStatus> {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const configs = await db.select().from(penaltyConfigs);

	const overdueBills = await db.select({
		billingId: billings.id, type: billings.type, amount: billings.amount, balance: billings.balance,
		penaltyAmount: billings.penaltyAmount, dueDate: billings.dueDate, status: billings.status, tenantName: tenants.name
	}).from(billings)
		.innerJoin(leases, eq(billings.leaseId, leases.id))
		.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
		.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
		.where(and(lt(billings.dueDate, todayStr), inArray(billings.status, ['PENDING', 'PARTIAL', 'OVERDUE', 'PENALIZED']), gt(billings.balance, '0')));

	const uniqueBills = dedup(overdueBills);
	const eligible: PenaltyStatus['eligible'] = [];
	const applied: PenaltyStatus['applied'] = [];

	for (const bill of uniqueBills) {
		const config = configs.find((c) => c.type === bill.type);
		const daysOverdue = Math.floor((today.getTime() - new Date(bill.dueDate).getTime()) / 86400000);
		const penaltyAmt = Number(bill.penaltyAmount ?? 0);

		if (penaltyAmt > 0) {
			applied.push({ billingId: bill.billingId, tenantName: bill.tenantName, type: bill.type, penaltyAmount: bill.penaltyAmount ?? '0', originalAmount: bill.amount, dueDate: bill.dueDate });
		} else if (config && daysOverdue > config.gracePeriod) {
			eligible.push({ billingId: bill.billingId, tenantName: bill.tenantName, type: bill.type, amount: bill.amount, balance: bill.balance, dueDate: bill.dueDate, daysOverdue, configPercentage: config.penaltyPercentage, gracePeriod: config.gracePeriod });
		}
	}

	const totalPenaltyApplied = applied.reduce((s, a) => s + Number(a.penaltyAmount), 0);
	return { eligible, applied, totalPenaltyApplied, totalPenaltyOutstanding: totalPenaltyApplied };
}

export async function getOccupancyReport(): Promise<OccupancyReport> {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
	const in60 = new Date(today); in60.setDate(in60.getDate() + 60);
	const in90 = new Date(today); in90.setDate(in90.getDate() + 90);

	const allUnits = await db.select({
		unitId: rentalUnit.id, unitName: rentalUnit.name, unitStatus: rentalUnit.rentalUnitStatus,
		baseRate: rentalUnit.baseRate, floorNumber: floors.floorNumber, propertyName: properties.name,
		leaseId: leases.id, leaseEnd: leases.endDate, leaseStatus: leases.status, tenantName: tenants.name
	}).from(rentalUnit)
		.innerJoin(floors, eq(rentalUnit.floorId, floors.id))
		.innerJoin(properties, eq(rentalUnit.propertyId, properties.id))
		.leftJoin(leases, and(eq(rentalUnit.id, leases.rentalUnitId), eq(leases.status, 'ACTIVE')))
		.leftJoin(leaseTenants, leases.id ? eq(leases.id, leaseTenants.leaseId) : undefined)
		.leftJoin(tenants, leaseTenants.tenantId ? eq(leaseTenants.tenantId, tenants.id) : undefined);

	const unitMap = new Map<number, OccupancyUnit>();
	for (const row of allUnits) {
		if (!unitMap.has(row.unitId)) {
			unitMap.set(row.unitId, { unitId: row.unitId, unitName: row.unitName, floorNumber: row.floorNumber, propertyName: row.propertyName, status: row.unitStatus, baseRate: row.baseRate, tenantName: row.tenantName, leaseEnd: row.leaseEnd, leaseStatus: row.leaseStatus });
		}
	}

	const units = Array.from(unitMap.values());
	const totalUnits = units.length;
	const occupiedUnits = units.filter((u) => u.status === 'OCCUPIED').length;
	const vacantUnits = units.filter((u) => u.status === 'VACANT').length;
	const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
	const d30 = in30.toISOString().split('T')[0], d60 = in60.toISOString().split('T')[0], d90 = in90.toISOString().split('T')[0];

	return {
		totalUnits, occupiedUnits, vacantUnits, occupancyRate,
		expiringIn30: units.filter((u) => u.leaseEnd && u.leaseEnd >= todayStr && u.leaseEnd <= d30),
		expiringIn60: units.filter((u) => u.leaseEnd && u.leaseEnd > d30 && u.leaseEnd <= d60),
		expiringIn90: units.filter((u) => u.leaseEnd && u.leaseEnd > d60 && u.leaseEnd <= d90),
		expiredWithTenant: units.filter((u) => u.leaseEnd && u.leaseEnd < todayStr && u.status === 'OCCUPIED'),
		vacantList: units.filter((u) => u.status === 'VACANT'),
		totalMonthlyRevenue: units.filter((u) => u.status === 'OCCUPIED').reduce((sum, u) => sum + Number(u.baseRate), 0)
	};
}

// ── NEW: Financial Summary (all billing types + security deposits) ──

export async function getFinancialSummary(): Promise<FinancialSummary> {
	// All billings grouped by type
	const allBillings = await db.select({
		type: billings.type,
		utilityType: billings.utilityType,
		amount: billings.amount,
		paidAmount: billings.paidAmount,
		balance: billings.balance,
		status: billings.status,
		leaseId: billings.leaseId
	}).from(billings);

	const typeMap = new Map<string, BillingBreakdown>();
	for (const b of allBillings) {
		const key = b.type === 'UTILITY' ? `UTILITY_${b.utilityType ?? 'OTHER'}` : b.type;
		if (!typeMap.has(key)) {
			typeMap.set(key, { type: b.type, utilityType: b.utilityType, totalBilled: 0, totalPaid: 0, totalBalance: 0, count: 0, paidCount: 0, overdueCount: 0 });
		}
		const entry = typeMap.get(key)!;
		entry.totalBilled += Number(b.amount);
		entry.totalPaid += Number(b.paidAmount ?? 0);
		entry.totalBalance += Number(b.balance);
		entry.count++;
		if (b.status === 'PAID') entry.paidCount++;
		if (b.status === 'OVERDUE' || b.status === 'PENALIZED') entry.overdueCount++;
	}

	const billingsByType = Array.from(typeMap.values());
	const totalBilled = billingsByType.reduce((s, b) => s + b.totalBilled, 0);
	const totalCollected = billingsByType.reduce((s, b) => s + b.totalPaid, 0);
	const totalOutstanding = billingsByType.reduce((s, b) => s + b.totalBalance, 0);
	const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

	// Security deposits detail
	const sdBillings = await db.select({
		amount: billings.amount,
		paidAmount: billings.paidAmount,
		balance: billings.balance,
		status: billings.status,
		leaseId: billings.leaseId,
		leaseName: leases.name,
		tenantName: tenants.name
	}).from(billings)
		.innerJoin(leases, eq(billings.leaseId, leases.id))
		.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
		.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
		.where(eq(billings.type, 'SECURITY_DEPOSIT'));

	// Dedup by leaseId for SD summary (one SD billing per lease typically)
	const sdByLease = new Map<number, typeof sdBillings[0]>();
	for (const sd of sdBillings) {
		if (!sdByLease.has(sd.leaseId)) sdByLease.set(sd.leaseId, sd);
	}
	const sdList = Array.from(sdByLease.values());
	const sdTotalRequired = sdList.reduce((s, d) => s + Number(d.amount), 0);
	const sdTotalPaid = sdList.reduce((s, d) => s + Number(d.paidAmount ?? 0), 0);
	const sdTotalOutstanding = sdList.reduce((s, d) => s + Number(d.balance), 0);
	const sdFullyPaid = sdList.filter((d) => d.status === 'PAID').length;

	return {
		billingsByType,
		totalBilled, totalCollected, totalOutstanding, collectionRate,
		securityDeposits: {
			totalRequired: sdTotalRequired,
			totalPaid: sdTotalPaid,
			totalOutstanding: sdTotalOutstanding,
			fullyPaidLeases: sdFullyPaid,
			outstandingLeases: sdList.length - sdFullyPaid,
			details: sdList.map((d) => ({
				leaseName: d.leaseName, tenantName: d.tenantName,
				amount: d.amount, paidAmount: d.paidAmount ?? '0',
				balance: d.balance, status: d.status
			}))
		}
	};
}

// ── NEW: Recent Payment Activity ──

export async function getPaymentActivity(): Promise<PaymentActivity> {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	const recentPaymentRows = await db.select({
		id: payments.id, amount: payments.amount, method: payments.method,
		paidBy: payments.paidBy, paidAt: payments.paidAt,
		referenceNumber: payments.referenceNumber,
		revertedAt: payments.revertedAt
	}).from(payments).orderBy(desc(payments.paidAt)).limit(15);

	const recentPayments: RecentPayment[] = recentPaymentRows.map((p) => ({
		id: p.id, amount: p.amount, method: p.method, paidBy: p.paidBy,
		paidAt: p.paidAt.toISOString(), referenceNumber: p.referenceNumber,
		reverted: !!p.revertedAt
	}));

	// This month's payments
	const thisMonthPayments = await db.select({
		amount: payments.amount, method: payments.method, revertedAt: payments.revertedAt
	}).from(payments).where(gte(payments.paidAt, monthStart));

	const activeThisMonth = thisMonthPayments.filter((p) => !p.revertedAt);
	const totalPaymentsThisMonth = activeThisMonth.length;
	const amountCollectedThisMonth = activeThisMonth.reduce((s, p) => s + Number(p.amount), 0);

	// Method breakdown
	const methodMap = new Map<string, { count: number; total: number }>();
	for (const p of activeThisMonth) {
		const existing = methodMap.get(p.method) ?? { count: 0, total: 0 };
		existing.count++;
		existing.total += Number(p.amount);
		methodMap.set(p.method, existing);
	}
	const methodBreakdown = Array.from(methodMap.entries()).map(([method, data]) => ({ method, ...data }));

	// Reverted payments
	const allReverted = await db.select({ amount: payments.amount }).from(payments).where(gt(payments.revertedAt, sql`'1970-01-01'`));
	const revertedCount = allReverted.length;
	const revertedAmount = allReverted.reduce((s, p) => s + Number(p.amount), 0);

	return { recentPayments, totalPaymentsThisMonth, amountCollectedThisMonth, methodBreakdown, revertedCount, revertedAmount };
}

// ── NEW: Tenant Overview ──

export async function getTenantOverview(): Promise<TenantOverview> {
	const allTenants = await db.select({ status: tenants.tenantStatus, createdAt: tenants.createdAt }).from(tenants).where(isNull(tenants.deletedAt));

	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	return {
		total: allTenants.length,
		active: allTenants.filter((t) => t.status === 'ACTIVE').length,
		inactive: allTenants.filter((t) => t.status === 'INACTIVE').length,
		pending: allTenants.filter((t) => t.status === 'PENDING').length,
		blacklisted: allTenants.filter((t) => t.status === 'BLACKLISTED').length,
		newThisMonth: allTenants.filter((t) => t.createdAt && new Date(t.createdAt) >= monthStart).length
	};
}

// ── NEW: Lease Overview ──

export async function getLeaseOverview(): Promise<LeaseOverview> {
	const allLeases = await db.select({
		status: leases.status,
		type: rentalUnit.type
	}).from(leases)
		.innerJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
		.where(isNull(leases.deletedAt));

	const typeMap = new Map<string, number>();
	for (const l of allLeases) {
		typeMap.set(l.type, (typeMap.get(l.type) ?? 0) + 1);
	}

	return {
		total: allLeases.length,
		active: allLeases.filter((l) => l.status === 'ACTIVE').length,
		expired: allLeases.filter((l) => l.status === 'EXPIRED').length,
		terminated: allLeases.filter((l) => l.status === 'TERMINATED').length,
		pending: allLeases.filter((l) => l.status === 'PENDING').length,
		byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
	};
}

// ── NEW: Budget Summary ──

export async function getBudgetSummary(): Promise<BudgetSummary> {
	const allBudgets = await db.select({
		name: budgets.projectName, category: budgets.projectCategory,
		planned: budgets.plannedAmount, actual: budgets.actualAmount,
		pending: budgets.pendingAmount, status: budgets.status
	}).from(budgets);

	const totalPlanned = allBudgets.reduce((s, b) => s + Number(b.planned), 0);
	const totalActual = allBudgets.reduce((s, b) => s + Number(b.actual ?? 0), 0);
	const totalPending = allBudgets.reduce((s, b) => s + Number(b.pending ?? 0), 0);
	const overBudgetCount = allBudgets.filter((b) => Number(b.actual ?? 0) > Number(b.planned)).length;

	return {
		totalBudgets: allBudgets.length,
		totalPlanned, totalActual, totalPending,
		utilizationRate: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0,
		overBudgetCount,
		items: allBudgets.map((b) => ({
			name: b.name, category: b.category, planned: Number(b.planned),
			actual: Number(b.actual ?? 0), status: b.status
		}))
	};
}

// ── NEW: Expense Summary ──

export async function getExpenseSummary(): Promise<ExpenseSummary> {
	const allExpenses = await db.select({
		amount: expenses.amount, type: expenses.type, status: expenses.status,
		description: expenses.description, date: expenses.expenseDate
	}).from(expenses);

	const approved = allExpenses.filter((e) => e.status === 'APPROVED');
	const pending = allExpenses.filter((e) => e.status === 'PENDING');
	const rejected = allExpenses.filter((e) => e.status === 'REJECTED');

	const typeMap = new Map<string, { count: number; total: number }>();
	for (const e of approved) {
		const existing = typeMap.get(e.type) ?? { count: 0, total: 0 };
		existing.count++;
		existing.total += Number(e.amount);
		typeMap.set(e.type, existing);
	}

	// Recent 10 expenses
	const recent = allExpenses
		.sort((a, b) => {
			const da = a.date ? new Date(a.date).getTime() : 0;
			const db2 = b.date ? new Date(b.date).getTime() : 0;
			return db2 - da;
		})
		.slice(0, 10);

	return {
		totalExpenses: allExpenses.length,
		totalApproved: approved.reduce((s, e) => s + Number(e.amount), 0),
		totalPending: pending.length,
		totalRejected: rejected.length,
		pendingApprovalAmount: pending.reduce((s, e) => s + Number(e.amount), 0),
		byType: Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data })),
		recentExpenses: recent.map((e) => ({
			description: e.description, amount: Number(e.amount), type: e.type,
			status: e.status, date: e.date?.toISOString() ?? null
		}))
	};
}

// ── NEW: Meter & Reading Summary ──

export async function getMeterSummary(): Promise<MeterSummary> {
	const allMeters = await db.select({
		id: meters.id, name: meters.name, type: meters.type, status: meters.status
	}).from(meters);

	const typeMap = new Map<string, number>();
	for (const m of allMeters) { typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1); }

	const now = new Date();
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];

	const readingsThisMonth = await db.select({ id: readings.id }).from(readings).where(gte(readings.readingDate, thisMonthStart));
	const readingsLastMonth = await db.select({ id: readings.id }).from(readings).where(and(gte(readings.readingDate, lastMonthStart), lt(readings.readingDate, thisMonthStart)));

	// Stale meters
	const staleDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
	const meterReadings = await db.select({
		meterId: meters.id, meterName: meters.name, meterType: meters.type,
		latestReading: sql<string>`MAX(${readings.readingDate})`.as('lr')
	}).from(meters).leftJoin(readings, eq(meters.id, readings.meterId)).where(eq(meters.status, 'ACTIVE')).groupBy(meters.id, meters.name, meters.type);
	const stale = meterReadings.filter((m) => !m.latestReading || m.latestReading < staleDate);

	return {
		totalMeters: allMeters.length,
		activeMeters: allMeters.filter((m) => m.status === 'ACTIVE').length,
		byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
		readingsThisMonth: readingsThisMonth.length,
		readingsLastMonth: readingsLastMonth.length,
		staleMeters: stale.map((m) => ({ name: m.meterName, lastReading: m.latestReading, type: m.meterType }))
	};
}

// ── NEW: Maintenance Summary ──

export async function getMaintenanceSummary(): Promise<MaintenanceSummary> {
	const allMaint = await db.select({
		title: maintenance.title, status: maintenance.status,
		createdAt: maintenance.createdAt, unitId: maintenance.locationId
	}).from(maintenance);

	const pendingItems = allMaint.filter((m) => m.status === 'PENDING');

	// Get unit names for pending items
	const unitIds = pendingItems.map((p) => p.unitId);
	let unitNames = new Map<number, string>();
	if (unitIds.length > 0) {
		const unitRows = await db.select({ id: rentalUnit.id, name: rentalUnit.name }).from(rentalUnit).where(inArray(rentalUnit.id, unitIds));
		unitNames = new Map(unitRows.map((u) => [u.id, u.name]));
	}

	return {
		total: allMaint.length,
		pending: pendingItems.length,
		inProgress: allMaint.filter((m) => m.status === 'IN_PROGRESS').length,
		completed: allMaint.filter((m) => m.status === 'COMPLETED').length,
		pendingItems: pendingItems.slice(0, 10).map((m) => ({
			title: m.title, unitName: unitNames.get(m.unitId) ?? `Unit #${m.unitId}`,
			createdAt: m.createdAt?.toISOString() ?? null
		}))
	};
}

// ── NEW: System Health & Monthly Timeline ──

export async function getSystemHealth(): Promise<SystemHealth> {
	const now = new Date();

	// Last activity dates
	const [lastBilling] = await db.select({ d: sql<string>`MAX(${billings.createdAt})` }).from(billings);
	const [lastPayment] = await db.select({ d: sql<string>`MAX(${payments.paidAt})` }).from(payments);
	const [lastReading] = await db.select({ d: sql<string>`MAX(${readings.readingDate})` }).from(readings);
	const [lastExpense] = await db.select({ d: sql<string>`MAX(${expenses.createdAt})` }).from(expenses);

	function daysSince(dateStr: string | null): number | null {
		if (!dateStr) return null;
		return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
	}

	const lastBillingDate = lastBilling?.d ?? null;
	const lastPaymentDate = lastPayment?.d ?? null;
	const lastReadingDate = lastReading?.d ?? null;
	const lastExpenseDate = lastExpense?.d ?? null;

	// Monthly timeline — last 12 months
	const timeline: MonthActivity[] = [];
	for (let i = 0; i < 12; i++) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthStr = monthDate.toISOString().split('T')[0].slice(0, 7); // "2026-03"
		const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
		const startStr = monthStart.toISOString().split('T')[0];
		const endStr = monthEnd.toISOString().split('T')[0];
		const label = monthDate.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });

		const [billCount] = await db.select({ c: sql<number>`COUNT(*)` }).from(billings)
			.where(and(gte(billings.createdAt, monthStart), lt(billings.createdAt, monthEnd)));

		const payRows = await db.select({ amount: payments.amount, revertedAt: payments.revertedAt })
			.from(payments)
			.where(and(gte(payments.paidAt, monthStart), lt(payments.paidAt, monthEnd)));
		const activePayments = payRows.filter((p) => !p.revertedAt);

		const [readCount] = await db.select({ c: sql<number>`COUNT(*)` }).from(readings)
			.where(and(gte(readings.readingDate, startStr), lt(readings.readingDate, endStr)));

		const [expCount] = await db.select({ c: sql<number>`COUNT(*)` }).from(expenses)
			.where(and(gte(expenses.createdAt, monthStart), lt(expenses.createdAt, monthEnd)));

		timeline.push({
			month: monthStr,
			label,
			billingsCreated: Number(billCount?.c ?? 0),
			paymentsReceived: activePayments.length,
			amountCollected: activePayments.reduce((s, p) => s + Number(p.amount), 0),
			meterReadings: Number(readCount?.c ?? 0),
			expensesLogged: Number(expCount?.c ?? 0)
		});
	}

	return {
		lastBillingDate,
		lastPaymentDate,
		lastReadingDate,
		lastExpenseDate,
		daysSinceLastBilling: daysSince(lastBillingDate),
		daysSinceLastPayment: daysSince(lastPaymentDate),
		daysSinceLastReading: daysSince(lastReadingDate),
		monthlyTimeline: timeline
	};
}

// generateCopySummary and aggregateByTenant have been moved to ./insights-types.ts
