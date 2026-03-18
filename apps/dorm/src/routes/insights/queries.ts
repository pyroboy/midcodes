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
import { eq, and, lt, lte, gte, gt, sql, isNull, ne, or, inArray, desc, asc, count } from 'drizzle-orm';

// ── Helper ──────────────────────────────────────

function peso(n: number): string {
	return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

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

// ── Types ───────────────────────────────────────

export interface OverdueBilling {
	billingId: number;
	tenantName: string;
	tenantId: number;
	leaseId: number;
	type: string;
	amount: string;
	balance: string;
	penaltyAmount: string;
	dueDate: string;
	daysOverdue: number;
	status: string;
	unitName: string;
}

export interface OverdueReport {
	critical: OverdueBilling[];
	warning: OverdueBilling[];
	mild: OverdueBilling[];
	totalOverdueBalance: number;
	totalTenants: number;
}

export interface MissingDataItem {
	category: string;
	description: string;
	items: { id: number; name: string; detail: string }[];
}

export interface PenaltyStatus {
	eligible: {
		billingId: number;
		tenantName: string;
		type: string;
		amount: string;
		balance: string;
		dueDate: string;
		daysOverdue: number;
		configPercentage: string;
		gracePeriod: number;
	}[];
	applied: {
		billingId: number;
		tenantName: string;
		type: string;
		penaltyAmount: string;
		originalAmount: string;
		dueDate: string;
	}[];
	totalPenaltyApplied: number;
	totalPenaltyOutstanding: number;
}

export interface OccupancyUnit {
	unitId: number;
	unitName: string;
	floorNumber: number;
	propertyName: string;
	status: string;
	baseRate: string;
	tenantName: string | null;
	leaseEnd: string | null;
	leaseStatus: string | null;
}

export interface OccupancyReport {
	totalUnits: number;
	occupiedUnits: number;
	vacantUnits: number;
	occupancyRate: number;
	expiringIn30: OccupancyUnit[];
	expiringIn60: OccupancyUnit[];
	expiringIn90: OccupancyUnit[];
	expiredWithTenant: OccupancyUnit[];
	vacantList: OccupancyUnit[];
	totalMonthlyRevenue: number;
}

export interface BillingBreakdown {
	type: string;
	utilityType: string | null;
	totalBilled: number;
	totalPaid: number;
	totalBalance: number;
	count: number;
	paidCount: number;
	overdueCount: number;
}

export interface FinancialSummary {
	billingsByType: BillingBreakdown[];
	totalBilled: number;
	totalCollected: number;
	totalOutstanding: number;
	collectionRate: number;
	securityDeposits: {
		totalRequired: number;
		totalPaid: number;
		totalOutstanding: number;
		fullyPaidLeases: number;
		outstandingLeases: number;
		details: { leaseName: string; tenantName: string; amount: string; paidAmount: string; balance: string; status: string }[];
	};
}

export interface RecentPayment {
	id: number;
	amount: string;
	method: string;
	paidBy: string;
	paidAt: string;
	referenceNumber: string | null;
	reverted: boolean;
}

export interface PaymentActivity {
	recentPayments: RecentPayment[];
	totalPaymentsThisMonth: number;
	amountCollectedThisMonth: number;
	methodBreakdown: { method: string; count: number; total: number }[];
	revertedCount: number;
	revertedAmount: number;
}

export interface TenantOverview {
	total: number;
	active: number;
	inactive: number;
	pending: number;
	blacklisted: number;
	newThisMonth: number;
}

export interface LeaseOverview {
	total: number;
	active: number;
	expired: number;
	terminated: number;
	pending: number;
	byType: { type: string; count: number }[];
}

export interface BudgetSummary {
	totalBudgets: number;
	totalPlanned: number;
	totalActual: number;
	totalPending: number;
	utilizationRate: number;
	overBudgetCount: number;
	items: { name: string; category: string | null; planned: number; actual: number; status: string | null }[];
}

export interface ExpenseSummary {
	totalExpenses: number;
	totalApproved: number;
	totalPending: number;
	totalRejected: number;
	pendingApprovalAmount: number;
	byType: { type: string; count: number; total: number }[];
	recentExpenses: { description: string; amount: number; type: string; status: string; date: string | null }[];
}

export interface MeterSummary {
	totalMeters: number;
	activeMeters: number;
	byType: { type: string; count: number }[];
	readingsThisMonth: number;
	readingsLastMonth: number;
	staleMeters: { name: string; lastReading: string | null; type: string }[];
}

export interface MaintenanceSummary {
	total: number;
	pending: number;
	inProgress: number;
	completed: number;
	pendingItems: { title: string; unitName: string; createdAt: string | null }[];
}

export interface MonthActivity {
	month: string; // "2026-03"
	label: string; // "Mar 2026"
	billingsCreated: number;
	paymentsReceived: number;
	amountCollected: number;
	meterReadings: number;
	expensesLogged: number;
}

export interface SystemHealth {
	lastBillingDate: string | null;
	lastPaymentDate: string | null;
	lastReadingDate: string | null;
	lastExpenseDate: string | null;
	daysSinceLastBilling: number | null;
	daysSinceLastPayment: number | null;
	daysSinceLastReading: number | null;
	monthlyTimeline: MonthActivity[];
}

export interface InsightsData {
	overdue: OverdueReport;
	missingData: MissingDataItem[];
	penalties: PenaltyStatus;
	occupancy: OccupancyReport;
	financial: FinancialSummary;
	paymentActivity: PaymentActivity;
	tenantOverview: TenantOverview;
	leaseOverview: LeaseOverview;
	budgetSummary: BudgetSummary;
	expenseSummary: ExpenseSummary;
	meterSummary: MeterSummary;
	maintenanceSummary: MaintenanceSummary;
	systemHealth: SystemHealth;
	generatedAt: string;
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

// ── Copy Summary Generator (with AI navigation instructions) ──

interface TenantAggregate {
	name: string;
	unit: string;
	rentBalance: number;
	utilityBalance: number;
	penaltyBalance: number;
	otherBalance: number;
	totalBalance: number;
	maxDaysOverdue: number;
	billingCount: number;
	rentBills: number;
	utilBills: number;
}

function aggregateByTenant(items: OverdueBilling[]): TenantAggregate[] {
	const map = new Map<string, TenantAggregate>();
	for (const b of items) {
		const key = `${b.tenantId}`;
		if (!map.has(key)) {
			map.set(key, { name: b.tenantName, unit: b.unitName, rentBalance: 0, utilityBalance: 0, penaltyBalance: 0, otherBalance: 0, totalBalance: 0, maxDaysOverdue: 0, billingCount: 0, rentBills: 0, utilBills: 0 });
		}
		const agg = map.get(key)!;
		const bal = Number(b.balance);
		if (b.type === 'RENT') { agg.rentBalance += bal; agg.rentBills++; }
		else if (b.type === 'UTILITY') { agg.utilityBalance += bal; agg.utilBills++; }
		else if (b.type === 'PENALTY') agg.penaltyBalance += bal;
		else agg.otherBalance += bal;
		agg.totalBalance += bal;
		agg.maxDaysOverdue = Math.max(agg.maxDaysOverdue, b.daysOverdue);
		agg.billingCount++;
	}
	return Array.from(map.values()).sort((a, b) => b.totalBalance - a.totalBalance);
}

export function generateCopySummary(data: InsightsData, appUrl?: string): string {
	const l: string[] = [];
	const { overdue, missingData, penalties, occupancy, financial, paymentActivity, tenantOverview, leaseOverview, budgetSummary, expenseSummary, meterSummary, maintenanceSummary, systemHealth } = data;

	// ── Header & AI instructions ──
	l.push(`# Dorm Management — Comprehensive Summary Report`);
	l.push(`Generated: ${data.generatedAt} (Asia/Manila timezone)`);
	l.push(`Currency: Philippine Peso (PHP, ₱)`);
	l.push('');
	l.push(`## How to Use This Report`);
	l.push(`This is a structured data export from a dormitory management system. An AI assistant`);
	l.push(`can read this and answer natural-language questions about the business.`);
	l.push('');
	l.push(`**Navigation:** Each section is numbered with §. Reference them in your questions.`);
	l.push(`**Data format:** Tenant balances are aggregated (one line per tenant, total across all billing types).`);
	l.push(`**Currency:** All amounts are Philippine Pesos (₱). Format: ₱1,234.56`);
	l.push('');
	l.push(`**Example questions you can ask:**`);
	l.push(`- "Which tenants owe the most?" → §3 (ranked by total balance)`);
	l.push(`- "What's our collection rate?" → §1 KPIs + §4 Financial`);
	l.push(`- "Draft a payment reminder for [name]" → Use §3 for amounts + §5 for last payment`);
	l.push(`- "Which leases need renewal?" → §6 Occupancy (expiring leases)`);
	l.push(`- "Are we over budget?" → §8 Budgets`);
	l.push(`- "What security deposits are missing?" → §4.2`);
	l.push(`- "Summarize this month" → Combine §1, §4, §5`);
	l.push(`- "What maintenance is pending?" → §10`);
	l.push(`- "What data is missing?" → §11 Data Quality`);
	l.push(`- "Is the system being used?" → §1b System Health`);
	l.push('');
	if (appUrl) {
		l.push(`### How to Access This Report`);
		l.push(`1. Open the Insights page: ${appUrl}/insights`);
		l.push(`2. Click the **"Copy Summary"** button (top-right)`);
		l.push(`3. Paste into any AI chatbot (ChatGPT, Claude.ai, Gemini)`);
		l.push(`4. Ask questions in natural language — the AI will reference the sections above`);
		l.push(`5. To refresh data, click **"Refresh"** on the Insights page, then copy again`);
		l.push('');
	}
	l.push(`### Table of Contents`);
	l.push(`§1 Quick KPIs — §1b System Health & Monthly Activity`);
	l.push(`§2 Tenants & Leases — §3 Overdue & Penalties (by tenant)`);
	l.push(`§4 Financials — §5 Recent Payments — §6 Occupancy — §7 Meters`);
	l.push(`§8 Budgets — §9 Expenses — §10 Maintenance — §11 Data Quality`);
	l.push('');

	// ── §1 Quick KPIs ──
	l.push(`## §1 Quick KPIs`);
	l.push(`| Metric | Value |`);
	l.push(`|--------|-------|`);
	l.push(`| Total Overdue Balance | ${peso(overdue.totalOverdueBalance)} |`);
	l.push(`| Tenants with Overdue | ${overdue.totalTenants} |`);
	l.push(`| Occupancy Rate | ${occupancy.occupancyRate.toFixed(1)}% (${occupancy.occupiedUnits}/${occupancy.totalUnits}) |`);
	l.push(`| Collection Rate | ${financial.collectionRate.toFixed(1)}% |`);
	l.push(`| Total Outstanding | ${peso(financial.totalOutstanding)} |`);
	l.push(`| This Month Collections | ${peso(paymentActivity.amountCollectedThisMonth)} (${paymentActivity.totalPaymentsThisMonth} payments) |`);
	l.push(`| Monthly Revenue (base) | ${peso(occupancy.totalMonthlyRevenue)} |`);
	l.push(`| Active Tenants | ${tenantOverview.active} |`);
	l.push(`| Active Leases | ${leaseOverview.active} |`);
	l.push(`| Security Deposits | ${peso(financial.securityDeposits.totalPaid)} collected, ${financial.securityDeposits.outstandingLeases} outstanding |`);
	l.push(`| Penalties Eligible | ${penalties.eligible.length} billings |`);
	l.push(`| Reverted Payments | ${paymentActivity.revertedCount} (${peso(paymentActivity.revertedAmount)}) |`);
	l.push(`| Maintenance Pending | ${maintenanceSummary.pending} |`);
	l.push(`| Data Quality Issues | ${missingData.reduce((s, c) => s + c.items.length, 0)} |`);
	l.push('');

	// ── §1b System Health & Monthly Activity Timeline ──
	l.push(`## §1b System Health & Monthly Activity`);

	// Last activity indicators
	l.push(`### Last Activity`);
	l.push(`| Activity | Last Date | Days Ago | Status |`);
	l.push(`|----------|-----------|----------|--------|`);

	const healthItems: [string, string | null, number | null][] = [
		['Billing Created', systemHealth.lastBillingDate, systemHealth.daysSinceLastBilling],
		['Payment Received', systemHealth.lastPaymentDate, systemHealth.daysSinceLastPayment],
		['Meter Reading', systemHealth.lastReadingDate, systemHealth.daysSinceLastReading],
	];

	for (const [label, date, days] of healthItems) {
		const dateStr = date ? new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
		const daysStr = days !== null ? `${days}d` : '-';
		const status = days === null ? '⚠️ No data' : days <= 7 ? '✓ Current' : days <= 30 ? '⚠️ Aging' : '🚨 Stale';
		l.push(`| ${label} | ${dateStr} | ${daysStr} | ${status} |`);
	}

	// Overall system status
	const activeDays = healthItems.map(([,, d]) => d).filter((d): d is number => d !== null);
	const maxInactive = activeDays.length > 0 ? Math.max(...activeDays) : null;
	if (maxInactive !== null && maxInactive > 60) {
		l.push('');
		l.push(`> 🚨 **SYSTEM APPEARS DORMANT** — No operational activity recorded in ${maxInactive} days.`);
		l.push(`> The system may not be in active use. Overdue balances and penalties continue to accumulate.`);
	} else if (maxInactive !== null && maxInactive > 30) {
		l.push('');
		l.push(`> ⚠️ **Low activity** — Some operations haven't been recorded in ${maxInactive} days.`);
	}
	l.push('');

	// Monthly timeline table
	if (systemHealth.monthlyTimeline.length > 0) {
		l.push(`### Monthly Activity (last 12 months)`);
		l.push(`| Month | Billings | Payments | Collected | Readings | Expenses | Status |`);
		l.push(`|-------|----------|----------|-----------|----------|----------|--------|`);
		for (const m of systemHealth.monthlyTimeline) {
			const hasActivity = m.billingsCreated > 0 || m.paymentsReceived > 0 || m.meterReadings > 0;
			const status = hasActivity ? '✓ Active' : '✗ No activity';
			l.push(`| ${m.label} | ${m.billingsCreated} | ${m.paymentsReceived} | ${peso(m.amountCollected)} | ${m.meterReadings} | ${m.expensesLogged} | ${status} |`);
		}
		l.push('');

		// Readiness summary
		const activeMonths = systemHealth.monthlyTimeline.filter((m) => m.billingsCreated > 0 || m.paymentsReceived > 0 || m.meterReadings > 0);
		const inactiveMonths = systemHealth.monthlyTimeline.length - activeMonths.length;
		if (inactiveMonths > 0) {
			l.push(`**Report readiness:** ${activeMonths.length}/12 months have recorded activity. ${inactiveMonths} month(s) with zero activity.`);
		} else {
			l.push(`**Report readiness:** ✓ All 12 months have recorded activity.`);
		}
		l.push('');
	}

	// ── §2 Tenant & Lease Overview ──
	l.push(`## §2 Tenant & Lease Overview`);
	l.push(`### Tenants`);
	l.push(`- Total: ${tenantOverview.total} (Active: ${tenantOverview.active}, Inactive: ${tenantOverview.inactive}, Pending: ${tenantOverview.pending}, Blacklisted: ${tenantOverview.blacklisted})`);
	if (tenantOverview.newThisMonth > 0) l.push(`- New this month: ${tenantOverview.newThisMonth}`);
	l.push(`### Leases`);
	l.push(`- Total: ${leaseOverview.total} (Active: ${leaseOverview.active}, Expired: ${leaseOverview.expired}, Terminated: ${leaseOverview.terminated}, Pending: ${leaseOverview.pending})`);
	if (leaseOverview.byType.length > 0) {
		l.push(`- By unit type: ${leaseOverview.byType.map((t) => `${t.type}: ${t.count}`).join(', ')}`);
	}
	l.push('');

	// ── §3 Overdue & Penalties — MERGED, AGGREGATED BY TENANT ──
	l.push(`## §3 Overdue Payments & Penalties — By Tenant (ranked by total balance)`);
	l.push(`- Total overdue: ${peso(overdue.totalOverdueBalance)} across ${overdue.totalTenants} tenants`);
	l.push(`- Penalties applied: ${peso(penalties.totalPenaltyApplied)} | Eligible: ${penalties.eligible.length} billings`);

	// Collect penalty config rates for summary
	const penaltyRates = new Map<string, string>();
	for (const p of penalties.eligible) {
		if (!penaltyRates.has(p.type)) penaltyRates.set(p.type, p.configPercentage);
	}
	if (penaltyRates.size > 0) {
		l.push(`- Penalty rates: ${Array.from(penaltyRates.entries()).map(([t, r]) => `${t}=${r}%`).join(', ')}`);
	}
	l.push('');

	const allOverdue = [...overdue.critical, ...overdue.warning, ...overdue.mild];
	const tenantAgg = aggregateByTenant(allOverdue);

	if (tenantAgg.length > 0) {
		// Merged table with penalty-eligible indicator
		const penaltyEligibleTenants = new Set(penalties.eligible.map((p) => p.tenantName));

		l.push(`| # | Tenant | Unit | Total Owed | Rent | Utility | Days | Bills | Penalty? |`);
		l.push(`|---|--------|------|------------|------|---------|------|-------|----------|`);
		tenantAgg.forEach((t, i) => {
			const penFlag = penaltyEligibleTenants.has(t.name) ? `✗ ${t.rentBills}R+${t.utilBills}U eligible` : '✓ N/A';
			l.push(`| ${i + 1} | ${t.name} | ${t.unit} | ${peso(t.totalBalance)} | ${peso(t.rentBalance)} | ${peso(t.utilityBalance)} | ${t.maxDaysOverdue}d | ${t.billingCount} | ${penFlag} |`);
		});
		l.push('');

		// Severity summary
		const criticalTenants = aggregateByTenant(overdue.critical);
		const warningTenants = aggregateByTenant(overdue.warning);
		const mildTenants = aggregateByTenant(overdue.mild);
		l.push(`**Severity:** ${criticalTenants.length} critical (30+ days), ${warningTenants.length} warning (8-30 days), ${mildTenants.length} mild (1-7 days)`);
	} else {
		l.push(`✓ No overdue payments. All tenants are current.`);
	}

	if (penalties.applied.length > 0) {
		l.push('');
		l.push(`### Penalties Already Applied`);
		for (const p of penalties.applied) {
			l.push(`- **${p.tenantName}**: ${p.type}, penalty=${peso(Number(p.penaltyAmount))} on ${peso(Number(p.originalAmount))}`);
		}
	}
	l.push('');

	// ── §4 Financial Summary ──
	l.push(`## §4 Financial Summary`);
	l.push(`- Total billed (all time): ${peso(financial.totalBilled)}`);
	l.push(`- Total collected: ${peso(financial.totalCollected)}`);
	l.push(`- Total outstanding: ${peso(financial.totalOutstanding)}`);
	l.push(`- Collection rate: ${financial.collectionRate.toFixed(1)}%`);
	l.push('');

	l.push(`### §4.1 Billing Breakdown by Type`);
	l.push(`| Type | Count | Billed | Collected | Outstanding | Paid | Overdue |`);
	l.push(`|------|-------|--------|-----------|-------------|------|---------|`);
	for (const bt of financial.billingsByType) {
		const label = bt.type === 'UTILITY' ? `UTILITY (${bt.utilityType})` : bt.type;
		l.push(`| ${label} | ${bt.count} | ${peso(bt.totalBilled)} | ${peso(bt.totalPaid)} | ${peso(bt.totalBalance)} | ${bt.paidCount} | ${bt.overdueCount} |`);
	}
	l.push('');

	l.push(`### §4.2 Security Deposits`);
	const sd = financial.securityDeposits;
	l.push(`- Total required: ${peso(sd.totalRequired)}`);
	l.push(`- Total collected: ${peso(sd.totalPaid)}`);
	l.push(`- Total outstanding: ${peso(sd.totalOutstanding)}`);
	l.push(`- Fully paid: ${sd.fullyPaidLeases} leases | Outstanding: ${sd.outstandingLeases} leases`);

	// Only show detail for outstanding deposits
	const sdOutstanding = sd.details.filter((d) => Number(d.balance) > 0);
	if (sdOutstanding.length > 0) {
		l.push(`#### Outstanding Security Deposits`);
		for (const d of sdOutstanding) {
			l.push(`- **${d.tenantName}** (${d.leaseName}): required=${peso(Number(d.amount))}, paid=${peso(Number(d.paidAmount))}, balance=${peso(Number(d.balance))}`);
		}
	} else if (sd.details.length > 0) {
		l.push(`- ✓ All ${sd.fullyPaidLeases} security deposits are fully paid.`);
	}
	l.push('');

	// ── §5 Recent Payment Activity (COMPACT — groups repetitive payments) ──
	l.push(`## §5 Recent Payment Activity`);
	l.push(`- Payments this month: ${paymentActivity.totalPaymentsThisMonth}`);
	l.push(`- Amount collected this month: ${peso(paymentActivity.amountCollectedThisMonth)}`);
	if (paymentActivity.revertedCount > 0) {
		l.push(`- ⚠️ Reverted payments (all time): ${paymentActivity.revertedCount} totaling ${peso(paymentActivity.revertedAmount)}`);
	}
	if (paymentActivity.methodBreakdown.length > 0) {
		l.push(`### Payment Methods (this month)`);
		for (const m of paymentActivity.methodBreakdown) {
			l.push(`- ${m.method}: ${m.count} payments, ${peso(m.total)}`);
		}
	}
	if (paymentActivity.recentPayments.length > 0) {
		// Group repetitive payments by date+amount+method+paidBy
		const paymentGroups = new Map<string, { date: string; amount: number; method: string; paidBy: string; count: number; reverted: number; refs: string[] }>();
		for (const p of paymentActivity.recentPayments) {
			const date = new Date(p.paidAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
			const key = `${date}|${p.amount}|${p.method}|${p.paidBy}`;
			if (!paymentGroups.has(key)) {
				paymentGroups.set(key, { date, amount: Number(p.amount), method: p.method, paidBy: p.paidBy, count: 0, reverted: 0, refs: [] });
			}
			const g = paymentGroups.get(key)!;
			g.count++;
			if (p.reverted) g.reverted++;
			if (p.referenceNumber) g.refs.push(p.referenceNumber);
		}

		l.push(`### Last ${paymentActivity.recentPayments.length} Payments`);
		for (const g of paymentGroups.values()) {
			if (g.count === 1) {
				l.push(`- ${g.date}: ${peso(g.amount)} via ${g.method} by ${g.paidBy}${g.refs.length > 0 ? ` (ref: ${g.refs[0]})` : ''}${g.reverted > 0 ? ' ⚠️ REVERTED' : ''}`);
			} else {
				const total = g.amount * g.count;
				l.push(`- ${g.date}: ${g.count}× ${peso(g.amount)} = ${peso(total)} via ${g.method} by ${g.paidBy}${g.reverted > 0 ? ` (${g.reverted} reverted)` : ''}`);
			}
		}
	} else {
		l.push(`- No payments recorded.`);
	}
	l.push('');

	// ── §6 Occupancy & Lease Expiry (LOUDER expired lease warnings) ──
	l.push(`## §6 Occupancy & Lease Expiry`);
	l.push(`- Total units: ${occupancy.totalUnits}`);
	l.push(`- Occupied: ${occupancy.occupiedUnits} (${occupancy.occupancyRate.toFixed(1)}%)`);
	l.push(`- Vacant: ${occupancy.vacantUnits}`);
	l.push(`- Monthly revenue (base rates): ${peso(occupancy.totalMonthlyRevenue)}`);
	l.push('');

	if (occupancy.expiredWithTenant.length > 0) {
		const expiredCount = occupancy.expiredWithTenant.length;
		const oldestExpired = occupancy.expiredWithTenant
			.map((u) => u.leaseEnd!)
			.sort()[0];
		const daysSinceOldest = Math.floor((Date.now() - new Date(oldestExpired).getTime()) / 86400000);

		l.push(`### 🚨 CRITICAL: ${expiredCount} Expired Leases — Tenants Still in Unit`);
		l.push(`These leases ended but the system still shows the units as OCCUPIED.`);
		l.push(`Oldest expiry: ${oldestExpired} (${daysSinceOldest} days ago). Action needed: renew lease or process move-out.`);
		l.push('');
		for (const u of occupancy.expiredWithTenant) {
			const daysExpired = Math.floor((Date.now() - new Date(u.leaseEnd!).getTime()) / 86400000);
			l.push(`- ${u.unitName} (${u.propertyName}, Fl ${u.floorNumber}): **${u.tenantName}**, expired ${u.leaseEnd} (${daysExpired}d ago)`);
		}
		l.push('');
	}

	for (const [label, items] of [
		['Expiring within 30 days', occupancy.expiringIn30],
		['Expiring in 31-60 days', occupancy.expiringIn60],
		['Expiring in 61-90 days', occupancy.expiringIn90]
	] as [string, OccupancyUnit[]][]) {
		if (items.length > 0) {
			l.push(`### ${label}`);
			for (const u of items) { l.push(`- ${u.unitName}: ${u.tenantName}, ends ${u.leaseEnd}`); }
			l.push('');
		}
	}

	if (occupancy.vacantList.length > 0) {
		l.push(`### Vacant Units`);
		for (const u of occupancy.vacantList) { l.push(`- ${u.unitName} (${u.propertyName}, Fl ${u.floorNumber}): ${peso(Number(u.baseRate))}/mo`); }
		l.push('');
	}

	// ── §7 Meters & Utility Readings (SMART — condenses when all stale) ──
	l.push(`## §7 Meters & Utility Readings`);
	l.push(`- Total meters: ${meterSummary.totalMeters} (Active: ${meterSummary.activeMeters})`);
	if (meterSummary.byType.length > 0) {
		l.push(`- By type: ${meterSummary.byType.map((t) => `${t.type}: ${t.count}`).join(', ')}`);
	}
	l.push(`- Readings this month: ${meterSummary.readingsThisMonth} | Last month: ${meterSummary.readingsLastMonth}`);
	if (meterSummary.staleMeters.length > 0) {
		const staleCount = meterSummary.staleMeters.length;
		const allStale = staleCount === meterSummary.activeMeters && meterSummary.activeMeters > 0;
		const staleDates = meterSummary.staleMeters.map((m) => m.lastReading).filter(Boolean) as string[];
		const mostRecentStale = staleDates.length > 0 ? staleDates.sort().reverse()[0] : null;
		const allSameDate = staleDates.length > 0 && staleDates.every((d) => d === staleDates[0]);

		if (allStale && allSameDate && mostRecentStale) {
			l.push(`### ⚠️ ALL ${staleCount} active meters stale — last reading: ${mostRecentStale}`);
			l.push(`No meter readings have been recorded since ${mostRecentStale}. Utility billing is blocked until new readings are entered.`);
		} else if (allStale) {
			l.push(`### ⚠️ ALL ${staleCount} active meters have stale readings (30+ days)`);
			if (mostRecentStale) l.push(`Most recent reading across all meters: ${mostRecentStale}`);
			l.push(`Utility billing is blocked until new readings are entered.`);
		} else {
			l.push(`### ⚠️ ${staleCount}/${meterSummary.activeMeters} meters stale (no reading in 30+ days)`);
			for (const m of meterSummary.staleMeters) {
				l.push(`- ${m.name} (${m.type}): last reading ${m.lastReading ?? 'never'}`);
			}
		}
	}
	l.push('');

	// ── §8 Budgets ──
	l.push(`## §8 Budgets`);
	if (budgetSummary.totalBudgets === 0) {
		l.push(`- No budgets created yet.`);
	} else {
		l.push(`- Total budgets: ${budgetSummary.totalBudgets}`);
		l.push(`- Planned: ${peso(budgetSummary.totalPlanned)} | Actual: ${peso(budgetSummary.totalActual)} | Utilization: ${budgetSummary.utilizationRate.toFixed(1)}%`);
		if (budgetSummary.overBudgetCount > 0) l.push(`- ⚠️ Over-budget: ${budgetSummary.overBudgetCount} projects`);
		if (budgetSummary.items.length > 0) {
			l.push(`| Project | Category | Planned | Actual | Variance | Status |`);
			l.push(`|---------|----------|---------|--------|----------|--------|`);
			for (const b of budgetSummary.items) {
				const v = b.actual - b.planned;
				const vLabel = v > 0 ? `+${peso(v)} OVER` : v < 0 ? `${peso(Math.abs(v))} under` : 'On track';
				l.push(`| ${b.name} | ${b.category ?? '-'} | ${peso(b.planned)} | ${peso(b.actual)} | ${vLabel} | ${b.status ?? '-'} |`);
			}
		}
	}
	l.push('');

	// ── §9 Expenses ──
	l.push(`## §9 Expenses`);
	if (expenseSummary.totalExpenses === 0) {
		l.push(`- No expenses recorded yet.`);
	} else {
		l.push(`- Total: ${expenseSummary.totalExpenses} | Approved: ${peso(expenseSummary.totalApproved)} | Pending: ${expenseSummary.totalPending} (${peso(expenseSummary.pendingApprovalAmount)}) | Rejected: ${expenseSummary.totalRejected}`);
		if (expenseSummary.byType.length > 0) {
			l.push(`- By type: ${expenseSummary.byType.map((t) => `${t.type}: ${t.count} (${peso(t.total)})`).join(', ')}`);
		}
		if (expenseSummary.recentExpenses.length > 0) {
			l.push(`### Recent Expenses`);
			for (const e of expenseSummary.recentExpenses) {
				const date = e.date ? new Date(e.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'N/A';
				l.push(`- ${date}: ${peso(e.amount)} — ${e.description} (${e.type}, ${e.status})`);
			}
		}
	}
	l.push('');

	// ── §10 Maintenance ──
	l.push(`## §10 Maintenance`);
	if (maintenanceSummary.total === 0) {
		l.push(`- No maintenance requests recorded.`);
	} else {
		l.push(`- Total: ${maintenanceSummary.total} (Pending: ${maintenanceSummary.pending}, In Progress: ${maintenanceSummary.inProgress}, Completed: ${maintenanceSummary.completed})`);
		if (maintenanceSummary.pendingItems.length > 0) {
			l.push(`### Pending Requests`);
			for (const m of maintenanceSummary.pendingItems) {
				const date = m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'N/A';
				l.push(`- ${m.title} (${m.unitName}), created ${date}`);
			}
		}
	}
	l.push('');

	// ── §11 Data Quality Issues ──
	l.push(`## §11 Data Quality Issues`);
	if (missingData.length === 0) {
		l.push(`- ✓ All data looks complete. No issues found.`);
	} else {
		const totalIssues = missingData.reduce((s, c) => s + c.items.length, 0);
		l.push(`${totalIssues} issues across ${missingData.length} categories:`);
		l.push('');
		for (const cat of missingData) {
			l.push(`### ${cat.category} (${cat.items.length})`);
			l.push(`${cat.description}`);
			// Compact: show up to 10, then summarize
			const shown = cat.items.slice(0, 10);
			for (const item of shown) { l.push(`- ${item.name}: ${item.detail}`); }
			if (cat.items.length > 10) {
				l.push(`- ... and ${cat.items.length - 10} more`);
			}
			l.push('');
		}
	}

	// ── Footer ──
	l.push(`---`);
	l.push(`End of report. ${tenantAgg.length} tenants tracked, 11 sections.`);
	l.push(`Tip: Ask "prioritize collections for this week", "draft a reminder to [name]", or "what needs attention first?"`);

	return l.join('\n');
}
