/**
 * Shared types and pure functions for the Insights page.
 * This file has NO server imports, so it can be used client-side.
 */

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
		details: {
			leaseName: string;
			tenantName: string;
			amount: string;
			paidAmount: string;
			balance: string;
			status: string;
		}[];
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
	items: {
		name: string;
		category: string | null;
		planned: number;
		actual: number;
		status: string | null;
	}[];
}

export interface ExpenseSummary {
	totalExpenses: number;
	totalApproved: number;
	totalPending: number;
	totalRejected: number;
	pendingApprovalAmount: number;
	byType: { type: string; count: number; total: number }[];
	recentExpenses: {
		description: string;
		amount: number;
		type: string;
		status: string;
		date: string | null;
	}[];
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
	daysSinceLastBilling?: number | null;
	daysSinceLastPayment?: number | null;
	daysSinceLastReading?: number | null;
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

// ── Helper ──────────────────────────────────────

function peso(n: number): string {
	return `\u20B1${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ── Tenant Aggregation (for copy summary) ───────

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
			map.set(key, {
				name: b.tenantName,
				unit: b.unitName,
				rentBalance: 0,
				utilityBalance: 0,
				penaltyBalance: 0,
				otherBalance: 0,
				totalBalance: 0,
				maxDaysOverdue: 0,
				billingCount: 0,
				rentBills: 0,
				utilBills: 0
			});
		}
		const agg = map.get(key)!;
		const bal = Number(b.balance);
		if (b.type === 'RENT') {
			agg.rentBalance += bal;
			agg.rentBills++;
		} else if (b.type === 'UTILITY') {
			agg.utilityBalance += bal;
			agg.utilBills++;
		} else if (b.type === 'PENALTY') agg.penaltyBalance += bal;
		else agg.otherBalance += bal;
		agg.totalBalance += bal;
		agg.maxDaysOverdue = Math.max(agg.maxDaysOverdue, b.daysOverdue);
		agg.billingCount++;
	}
	return Array.from(map.values()).sort((a, b) => b.totalBalance - a.totalBalance);
}

// ── Copy Summary Generator (with AI navigation instructions) ──

export function generateCopySummary(data: InsightsData, appUrl?: string): string {
	const l: string[] = [];
	const {
		overdue,
		missingData,
		penalties,
		occupancy,
		financial,
		paymentActivity,
		tenantOverview,
		leaseOverview,
		budgetSummary,
		expenseSummary,
		meterSummary,
		maintenanceSummary,
		systemHealth
	} = data;

	// ── Header & AI instructions ──
	l.push(`# Dorm Management — Comprehensive Summary Report`);
	l.push(`Generated: ${data.generatedAt} (Asia/Manila timezone)`);
	l.push(`Currency: Philippine Peso (PHP, \u20B1)`);
	l.push('');
	l.push(`## How to Use This Report`);
	l.push(
		`This is a structured data export from a dormitory management system. An AI assistant`
	);
	l.push(`can read this and answer natural-language questions about the business.`);
	l.push('');
	l.push(
		`**Navigation:** Each section is numbered with \u00A7. Reference them in your questions.`
	);
	l.push(
		`**Data format:** Tenant balances are aggregated (one line per tenant, total across all billing types).`
	);
	l.push(
		`**Currency:** All amounts are Philippine Pesos (\u20B1). Format: \u20B11,234.56`
	);
	l.push('');
	l.push(`**Example questions you can ask:**`);
	l.push(
		`- "Which tenants owe the most?" \u2192 \u00A73 (ranked by total balance)`
	);
	l.push(
		`- "What's our collection rate?" \u2192 \u00A71 KPIs + \u00A74 Financial`
	);
	l.push(
		`- "Draft a payment reminder for [name]" \u2192 Use \u00A73 for amounts + \u00A75 for last payment`
	);
	l.push(
		`- "Which leases need renewal?" \u2192 \u00A76 Occupancy (expiring leases)`
	);
	l.push(`- "Are we over budget?" \u2192 \u00A78 Budgets`);
	l.push(
		`- "What security deposits are missing?" \u2192 \u00A74.2`
	);
	l.push(
		`- "Summarize this month" \u2192 Combine \u00A71, \u00A74, \u00A75`
	);
	l.push(
		`- "What maintenance is pending?" \u2192 \u00A710`
	);
	l.push(
		`- "What data is missing?" \u2192 \u00A711 Data Quality`
	);
	l.push(
		`- "Is the system being used?" \u2192 \u00A71b System Health`
	);
	l.push('');
	if (appUrl) {
		l.push(`### How to Access This Report`);
		l.push(`1. Open the Insights page: ${appUrl}/insights`);
		l.push(`2. Click the **"Copy Summary"** button (top-right)`);
		l.push(`3. Paste into any AI chatbot (ChatGPT, Claude.ai, Gemini)`);
		l.push(
			`4. Ask questions in natural language \u2014 the AI will reference the sections above`
		);
		l.push(
			`5. To refresh data, click **"Refresh"** on the Insights page, then copy again`
		);
		l.push('');
	}
	l.push(`### Table of Contents`);
	l.push(
		`\u00A71 Quick KPIs \u2014 \u00A71b System Health & Monthly Activity`
	);
	l.push(
		`\u00A72 Tenants & Leases \u2014 \u00A73 Overdue & Penalties (by tenant)`
	);
	l.push(
		`\u00A74 Financials \u2014 \u00A75 Recent Payments \u2014 \u00A76 Occupancy \u2014 \u00A77 Meters`
	);
	l.push(
		`\u00A78 Budgets \u2014 \u00A79 Expenses \u2014 \u00A710 Maintenance \u2014 \u00A711 Data Quality`
	);
	l.push('');

	// ── §1 Quick KPIs ──
	l.push(`## \u00A71 Quick KPIs`);
	l.push(`| Metric | Value |`);
	l.push(`|--------|-------|`);
	l.push(
		`| Total Overdue Balance | ${peso(overdue.totalOverdueBalance)} |`
	);
	l.push(`| Tenants with Overdue | ${overdue.totalTenants} |`);
	l.push(
		`| Occupancy Rate | ${occupancy.occupancyRate.toFixed(1)}% (${occupancy.occupiedUnits}/${occupancy.totalUnits}) |`
	);
	l.push(`| Collection Rate | ${financial.collectionRate.toFixed(1)}% |`);
	l.push(
		`| Total Outstanding | ${peso(financial.totalOutstanding)} |`
	);
	l.push(
		`| This Month Collections | ${peso(paymentActivity.amountCollectedThisMonth)} (${paymentActivity.totalPaymentsThisMonth} payments) |`
	);
	l.push(
		`| Monthly Revenue (base) | ${peso(occupancy.totalMonthlyRevenue)} |`
	);
	l.push(`| Active Tenants | ${tenantOverview.active} |`);
	l.push(`| Active Leases | ${leaseOverview.active} |`);
	l.push(
		`| Security Deposits | ${peso(financial.securityDeposits.totalPaid)} collected, ${financial.securityDeposits.outstandingLeases} outstanding |`
	);
	l.push(
		`| Penalties Eligible | ${penalties.eligible.length} billings |`
	);
	l.push(
		`| Reverted Payments | ${paymentActivity.revertedCount} (${peso(paymentActivity.revertedAmount)}) |`
	);
	l.push(`| Maintenance Pending | ${maintenanceSummary.pending} |`);
	l.push(
		`| Data Quality Issues | ${missingData.reduce((s, c) => s + c.items.length, 0)} |`
	);
	l.push('');

	// ── §1b System Health & Monthly Activity Timeline ──
	l.push(`## \u00A71b System Health & Monthly Activity`);

	// Last activity indicators
	l.push(`### Last Activity`);
	l.push(`| Activity | Last Date | Days Ago | Status |`);
	l.push(`|----------|-----------|----------|--------|`);

	const healthItems: [string, string | null, number | null | undefined][] = [
		[
			'Billing Created',
			systemHealth.lastBillingDate,
			systemHealth.daysSinceLastBilling
		],
		[
			'Payment Received',
			systemHealth.lastPaymentDate,
			systemHealth.daysSinceLastPayment
		],
		[
			'Meter Reading',
			systemHealth.lastReadingDate,
			systemHealth.daysSinceLastReading
		]
	];

	for (const [label, date, days] of healthItems) {
		const dateStr = date
			? new Date(date).toLocaleDateString('en-PH', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			: 'Never';
		const daysStr = days != null ? `${days}d` : '-';
		const status =
			days == null
				? '\u26A0\uFE0F No data'
				: days <= 7
					? '\u2713 Current'
					: days <= 30
						? '\u26A0\uFE0F Aging'
						: '\uD83D\uDEA8 Stale';
		l.push(`| ${label} | ${dateStr} | ${daysStr} | ${status} |`);
	}

	// Overall system status
	const activeDays = healthItems
		.map(([, , d]) => d)
		.filter((d): d is number => d != null);
	const maxInactive = activeDays.length > 0 ? Math.max(...activeDays) : null;
	if (maxInactive !== null && maxInactive > 60) {
		l.push('');
		l.push(
			`> \uD83D\uDEA8 **SYSTEM APPEARS DORMANT** \u2014 No operational activity recorded in ${maxInactive} days.`
		);
		l.push(
			`> The system may not be in active use. Overdue balances and penalties continue to accumulate.`
		);
	} else if (maxInactive !== null && maxInactive > 30) {
		l.push('');
		l.push(
			`> \u26A0\uFE0F **Low activity** \u2014 Some operations haven't been recorded in ${maxInactive} days.`
		);
	}
	l.push('');

	// Monthly timeline table
	if (systemHealth.monthlyTimeline.length > 0) {
		l.push(`### Monthly Activity (last 12 months)`);
		l.push(
			`| Month | Billings | Payments | Collected | Readings | Expenses | Status |`
		);
		l.push(
			`|-------|----------|----------|-----------|----------|----------|--------|`
		);
		for (const m of systemHealth.monthlyTimeline) {
			const hasActivity =
				m.billingsCreated > 0 ||
				m.paymentsReceived > 0 ||
				m.meterReadings > 0;
			const status = hasActivity ? '\u2713 Active' : '\u2717 No activity';
			l.push(
				`| ${m.label} | ${m.billingsCreated} | ${m.paymentsReceived} | ${peso(m.amountCollected)} | ${m.meterReadings} | ${m.expensesLogged} | ${status} |`
			);
		}
		l.push('');

		// Readiness summary
		const activeMonths = systemHealth.monthlyTimeline.filter(
			(m) =>
				m.billingsCreated > 0 ||
				m.paymentsReceived > 0 ||
				m.meterReadings > 0
		);
		const inactiveMonths =
			systemHealth.monthlyTimeline.length - activeMonths.length;
		if (inactiveMonths > 0) {
			l.push(
				`**Report readiness:** ${activeMonths.length}/12 months have recorded activity. ${inactiveMonths} month(s) with zero activity.`
			);
		} else {
			l.push(
				`**Report readiness:** \u2713 All 12 months have recorded activity.`
			);
		}
		l.push('');
	}

	// ── §2 Tenant & Lease Overview ──
	l.push(`## \u00A72 Tenant & Lease Overview`);
	l.push(`### Tenants`);
	l.push(
		`- Total: ${tenantOverview.total} (Active: ${tenantOverview.active}, Inactive: ${tenantOverview.inactive}, Pending: ${tenantOverview.pending}, Blacklisted: ${tenantOverview.blacklisted})`
	);
	if (tenantOverview.newThisMonth > 0)
		l.push(`- New this month: ${tenantOverview.newThisMonth}`);
	l.push(`### Leases`);
	l.push(
		`- Total: ${leaseOverview.total} (Active: ${leaseOverview.active}, Expired: ${leaseOverview.expired}, Terminated: ${leaseOverview.terminated}, Pending: ${leaseOverview.pending})`
	);
	if (leaseOverview.byType.length > 0) {
		l.push(
			`- By unit type: ${leaseOverview.byType.map((t) => `${t.type}: ${t.count}`).join(', ')}`
		);
	}
	l.push('');

	// ── §3 Overdue & Penalties — MERGED, AGGREGATED BY TENANT ──
	l.push(
		`## \u00A73 Overdue Payments & Penalties \u2014 By Tenant (ranked by total balance)`
	);
	l.push(
		`- Total overdue: ${peso(overdue.totalOverdueBalance)} across ${overdue.totalTenants} tenants`
	);
	l.push(
		`- Penalties applied: ${peso(penalties.totalPenaltyApplied)} | Eligible: ${penalties.eligible.length} billings`
	);

	// Collect penalty config rates for summary
	const penaltyRates = new Map<string, string>();
	for (const p of penalties.eligible) {
		if (!penaltyRates.has(p.type))
			penaltyRates.set(p.type, p.configPercentage);
	}
	if (penaltyRates.size > 0) {
		l.push(
			`- Penalty rates: ${Array.from(penaltyRates.entries()).map(([t, r]) => `${t}=${r}%`).join(', ')}`
		);
	}
	l.push('');

	const allOverdue = [
		...overdue.critical,
		...overdue.warning,
		...overdue.mild
	];
	const tenantAgg = aggregateByTenant(allOverdue);

	if (tenantAgg.length > 0) {
		const penaltyEligibleTenants = new Set(
			penalties.eligible.map((p) => p.tenantName)
		);

		l.push(
			`| # | Tenant | Unit | Total Owed | Rent | Utility | Days | Bills | Penalty? |`
		);
		l.push(
			`|---|--------|------|------------|------|---------|------|-------|----------|`
		);
		tenantAgg.forEach((t, i) => {
			const penFlag = penaltyEligibleTenants.has(t.name)
				? `\u2717 ${t.rentBills}R+${t.utilBills}U eligible`
				: '\u2713 N/A';
			l.push(
				`| ${i + 1} | ${t.name} | ${t.unit} | ${peso(t.totalBalance)} | ${peso(t.rentBalance)} | ${peso(t.utilityBalance)} | ${t.maxDaysOverdue}d | ${t.billingCount} | ${penFlag} |`
			);
		});
		l.push('');

		// Severity summary
		const criticalTenants = aggregateByTenant(overdue.critical);
		const warningTenants = aggregateByTenant(overdue.warning);
		const mildTenants = aggregateByTenant(overdue.mild);
		l.push(
			`**Severity:** ${criticalTenants.length} critical (30+ days), ${warningTenants.length} warning (8-30 days), ${mildTenants.length} mild (1-7 days)`
		);
	} else {
		l.push(
			`\u2713 No overdue payments. All tenants are current.`
		);
	}

	if (penalties.applied.length > 0) {
		l.push('');
		l.push(`### Penalties Already Applied`);
		for (const p of penalties.applied) {
			l.push(
				`- **${p.tenantName}**: ${p.type}, penalty=${peso(Number(p.penaltyAmount))} on ${peso(Number(p.originalAmount))}`
			);
		}
	}
	l.push('');

	// ── §4 Financial Summary ──
	l.push(`## \u00A74 Financial Summary`);
	l.push(
		`- Total billed (all time): ${peso(financial.totalBilled)}`
	);
	l.push(`- Total collected: ${peso(financial.totalCollected)}`);
	l.push(
		`- Total outstanding: ${peso(financial.totalOutstanding)}`
	);
	l.push(
		`- Collection rate: ${financial.collectionRate.toFixed(1)}%`
	);
	l.push('');

	l.push(`### \u00A74.1 Billing Breakdown by Type`);
	l.push(
		`| Type | Count | Billed | Collected | Outstanding | Paid | Overdue |`
	);
	l.push(
		`|------|-------|--------|-----------|-------------|------|---------|`
	);
	for (const bt of financial.billingsByType) {
		const label =
			bt.type === 'UTILITY' ? `UTILITY (${bt.utilityType})` : bt.type;
		l.push(
			`| ${label} | ${bt.count} | ${peso(bt.totalBilled)} | ${peso(bt.totalPaid)} | ${peso(bt.totalBalance)} | ${bt.paidCount} | ${bt.overdueCount} |`
		);
	}
	l.push('');

	l.push(`### \u00A74.2 Security Deposits`);
	const sd = financial.securityDeposits;
	l.push(`- Total required: ${peso(sd.totalRequired)}`);
	l.push(`- Total collected: ${peso(sd.totalPaid)}`);
	l.push(`- Total outstanding: ${peso(sd.totalOutstanding)}`);
	l.push(
		`- Fully paid: ${sd.fullyPaidLeases} leases | Outstanding: ${sd.outstandingLeases} leases`
	);

	// Only show detail for outstanding deposits
	const sdOutstanding = sd.details.filter((d) => Number(d.balance) > 0);
	if (sdOutstanding.length > 0) {
		l.push(`#### Outstanding Security Deposits`);
		for (const d of sdOutstanding) {
			l.push(
				`- **${d.tenantName}** (${d.leaseName}): required=${peso(Number(d.amount))}, paid=${peso(Number(d.paidAmount))}, balance=${peso(Number(d.balance))}`
			);
		}
	} else if (sd.details.length > 0) {
		l.push(
			`- \u2713 All ${sd.fullyPaidLeases} security deposits are fully paid.`
		);
	}
	l.push('');

	// ── §5 Recent Payment Activity ──
	l.push(`## \u00A75 Recent Payment Activity`);
	l.push(
		`- Payments this month: ${paymentActivity.totalPaymentsThisMonth}`
	);
	l.push(
		`- Amount collected this month: ${peso(paymentActivity.amountCollectedThisMonth)}`
	);
	if (paymentActivity.revertedCount > 0) {
		l.push(
			`- \u26A0\uFE0F Reverted payments (all time): ${paymentActivity.revertedCount} totaling ${peso(paymentActivity.revertedAmount)}`
		);
	}
	if (paymentActivity.methodBreakdown.length > 0) {
		l.push(`### Payment Methods (this month)`);
		for (const m of paymentActivity.methodBreakdown) {
			l.push(`- ${m.method}: ${m.count} payments, ${peso(m.total)}`);
		}
	}
	if (paymentActivity.recentPayments.length > 0) {
		// Group repetitive payments by date+amount+method+paidBy
		const paymentGroups = new Map<
			string,
			{
				date: string;
				amount: number;
				method: string;
				paidBy: string;
				count: number;
				reverted: number;
				refs: string[];
			}
		>();
		for (const p of paymentActivity.recentPayments) {
			const date = new Date(p.paidAt).toLocaleDateString('en-PH', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
			const key = `${date}|${p.amount}|${p.method}|${p.paidBy}`;
			if (!paymentGroups.has(key)) {
				paymentGroups.set(key, {
					date,
					amount: Number(p.amount),
					method: p.method,
					paidBy: p.paidBy,
					count: 0,
					reverted: 0,
					refs: []
				});
			}
			const g = paymentGroups.get(key)!;
			g.count++;
			if (p.reverted) g.reverted++;
			if (p.referenceNumber) g.refs.push(p.referenceNumber);
		}

		l.push(
			`### Last ${paymentActivity.recentPayments.length} Payments`
		);
		for (const g of paymentGroups.values()) {
			if (g.count === 1) {
				l.push(
					`- ${g.date}: ${peso(g.amount)} via ${g.method} by ${g.paidBy}${g.refs.length > 0 ? ` (ref: ${g.refs[0]})` : ''}${g.reverted > 0 ? ' \u26A0\uFE0F REVERTED' : ''}`
				);
			} else {
				const total = g.amount * g.count;
				l.push(
					`- ${g.date}: ${g.count}\u00D7 ${peso(g.amount)} = ${peso(total)} via ${g.method} by ${g.paidBy}${g.reverted > 0 ? ` (${g.reverted} reverted)` : ''}`
				);
			}
		}
	} else {
		l.push(`- No payments recorded.`);
	}
	l.push('');

	// ── §6 Occupancy & Lease Expiry ──
	l.push(`## \u00A76 Occupancy & Lease Expiry`);
	l.push(`- Total units: ${occupancy.totalUnits}`);
	l.push(
		`- Occupied: ${occupancy.occupiedUnits} (${occupancy.occupancyRate.toFixed(1)}%)`
	);
	l.push(`- Vacant: ${occupancy.vacantUnits}`);
	l.push(
		`- Monthly revenue (base rates): ${peso(occupancy.totalMonthlyRevenue)}`
	);
	l.push('');

	if (occupancy.expiredWithTenant.length > 0) {
		const expiredCount = occupancy.expiredWithTenant.length;
		const oldestExpired = occupancy.expiredWithTenant
			.map((u) => u.leaseEnd!)
			.sort()[0];
		const daysSinceOldest = Math.floor(
			(Date.now() - new Date(oldestExpired).getTime()) / 86400000
		);

		l.push(
			`### \uD83D\uDEA8 CRITICAL: ${expiredCount} Expired Leases \u2014 Tenants Still in Unit`
		);
		l.push(
			`These leases ended but the system still shows the units as OCCUPIED.`
		);
		l.push(
			`Oldest expiry: ${oldestExpired} (${daysSinceOldest} days ago). Action needed: renew lease or process move-out.`
		);
		l.push('');
		for (const u of occupancy.expiredWithTenant) {
			const daysExpired = Math.floor(
				(Date.now() - new Date(u.leaseEnd!).getTime()) / 86400000
			);
			l.push(
				`- ${u.unitName} (${u.propertyName}, Fl ${u.floorNumber}): **${u.tenantName}**, expired ${u.leaseEnd} (${daysExpired}d ago)`
			);
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
			for (const u of items) {
				l.push(`- ${u.unitName}: ${u.tenantName}, ends ${u.leaseEnd}`);
			}
			l.push('');
		}
	}

	if (occupancy.vacantList.length > 0) {
		l.push(`### Vacant Units`);
		for (const u of occupancy.vacantList) {
			l.push(
				`- ${u.unitName} (${u.propertyName}, Fl ${u.floorNumber}): ${peso(Number(u.baseRate))}/mo`
			);
		}
		l.push('');
	}

	// ── §7 Meters & Utility Readings ──
	l.push(`## \u00A77 Meters & Utility Readings`);
	l.push(
		`- Total meters: ${meterSummary.totalMeters} (Active: ${meterSummary.activeMeters})`
	);
	if (meterSummary.byType.length > 0) {
		l.push(
			`- By type: ${meterSummary.byType.map((t) => `${t.type}: ${t.count}`).join(', ')}`
		);
	}
	l.push(
		`- Readings this month: ${meterSummary.readingsThisMonth} | Last month: ${meterSummary.readingsLastMonth}`
	);
	if (meterSummary.staleMeters.length > 0) {
		const staleCount = meterSummary.staleMeters.length;
		const allStale =
			staleCount === meterSummary.activeMeters &&
			meterSummary.activeMeters > 0;
		const staleDates = meterSummary.staleMeters
			.map((m) => m.lastReading)
			.filter(Boolean) as string[];
		const mostRecentStale =
			staleDates.length > 0 ? staleDates.sort().reverse()[0] : null;
		const allSameDate =
			staleDates.length > 0 &&
			staleDates.every((d) => d === staleDates[0]);

		if (allStale && allSameDate && mostRecentStale) {
			l.push(
				`### \u26A0\uFE0F ALL ${staleCount} active meters stale \u2014 last reading: ${mostRecentStale}`
			);
			l.push(
				`No meter readings have been recorded since ${mostRecentStale}. Utility billing is blocked until new readings are entered.`
			);
		} else if (allStale) {
			l.push(
				`### \u26A0\uFE0F ALL ${staleCount} active meters have stale readings (30+ days)`
			);
			if (mostRecentStale)
				l.push(
					`Most recent reading across all meters: ${mostRecentStale}`
				);
			l.push(
				`Utility billing is blocked until new readings are entered.`
			);
		} else {
			l.push(
				`### \u26A0\uFE0F ${staleCount}/${meterSummary.activeMeters} meters stale (no reading in 30+ days)`
			);
			for (const m of meterSummary.staleMeters) {
				l.push(
					`- ${m.name} (${m.type}): last reading ${m.lastReading ?? 'never'}`
				);
			}
		}
	}
	l.push('');

	// ── §8 Budgets ──
	l.push(`## \u00A78 Budgets`);
	if (budgetSummary.totalBudgets === 0) {
		l.push(`- No budgets created yet.`);
	} else {
		l.push(`- Total budgets: ${budgetSummary.totalBudgets}`);
		l.push(
			`- Planned: ${peso(budgetSummary.totalPlanned)} | Actual: ${peso(budgetSummary.totalActual)} | Utilization: ${budgetSummary.utilizationRate.toFixed(1)}%`
		);
		if (budgetSummary.overBudgetCount > 0)
			l.push(
				`- \u26A0\uFE0F Over-budget: ${budgetSummary.overBudgetCount} projects`
			);
		if (budgetSummary.items.length > 0) {
			l.push(
				`| Project | Category | Planned | Actual | Variance | Status |`
			);
			l.push(
				`|---------|----------|---------|--------|----------|--------|`
			);
			for (const b of budgetSummary.items) {
				const v = b.actual - b.planned;
				const vLabel =
					v > 0
						? `+${peso(v)} OVER`
						: v < 0
							? `${peso(Math.abs(v))} under`
							: 'On track';
				l.push(
					`| ${b.name} | ${b.category ?? '-'} | ${peso(b.planned)} | ${peso(b.actual)} | ${vLabel} | ${b.status ?? '-'} |`
				);
			}
		}
	}
	l.push('');

	// ── §9 Expenses ──
	l.push(`## \u00A79 Expenses`);
	if (expenseSummary.totalExpenses === 0) {
		l.push(`- No expenses recorded yet.`);
	} else {
		l.push(
			`- Total: ${expenseSummary.totalExpenses} | Approved: ${peso(expenseSummary.totalApproved)} | Pending: ${expenseSummary.totalPending} (${peso(expenseSummary.pendingApprovalAmount)}) | Rejected: ${expenseSummary.totalRejected}`
		);
		if (expenseSummary.byType.length > 0) {
			l.push(
				`- By type: ${expenseSummary.byType.map((t) => `${t.type}: ${t.count} (${peso(t.total)})`).join(', ')}`
			);
		}
		if (expenseSummary.recentExpenses.length > 0) {
			l.push(`### Recent Expenses`);
			for (const e of expenseSummary.recentExpenses) {
				const date = e.date
					? new Date(e.date).toLocaleDateString('en-PH', {
							month: 'short',
							day: 'numeric'
						})
					: 'N/A';
				l.push(
					`- ${date}: ${peso(e.amount)} \u2014 ${e.description} (${e.type}, ${e.status})`
				);
			}
		}
	}
	l.push('');

	// ── §10 Maintenance ──
	l.push(`## \u00A710 Maintenance`);
	if (maintenanceSummary.total === 0) {
		l.push(`- No maintenance requests recorded.`);
	} else {
		l.push(
			`- Total: ${maintenanceSummary.total} (Pending: ${maintenanceSummary.pending}, In Progress: ${maintenanceSummary.inProgress}, Completed: ${maintenanceSummary.completed})`
		);
		if (maintenanceSummary.pendingItems.length > 0) {
			l.push(`### Pending Requests`);
			for (const m of maintenanceSummary.pendingItems) {
				const date = m.createdAt
					? new Date(m.createdAt).toLocaleDateString('en-PH', {
							month: 'short',
							day: 'numeric'
						})
					: 'N/A';
				l.push(`- ${m.title} (${m.unitName}), created ${date}`);
			}
		}
	}
	l.push('');

	// ── §11 Data Quality Issues ──
	l.push(`## \u00A711 Data Quality Issues`);
	if (missingData.length === 0) {
		l.push(
			`- \u2713 All data looks complete. No issues found.`
		);
	} else {
		const totalIssues = missingData.reduce(
			(s, c) => s + c.items.length,
			0
		);
		l.push(
			`${totalIssues} issues across ${missingData.length} categories:`
		);
		l.push('');
		for (const cat of missingData) {
			l.push(`### ${cat.category} (${cat.items.length})`);
			l.push(`${cat.description}`);
			const shown = cat.items.slice(0, 10);
			for (const item of shown) {
				l.push(`- ${item.name}: ${item.detail}`);
			}
			if (cat.items.length > 10) {
				l.push(`- ... and ${cat.items.length - 10} more`);
			}
			l.push('');
		}
	}

	// ── Footer ──
	l.push(`---`);
	l.push(
		`End of report. ${tenantAgg.length} tenants tracked, 11 sections.`
	);
	l.push(
		`Tip: Ask "prioritize collections for this week", "draft a reminder to [name]", or "what needs attention first?"`
	);

	return l.join('\n');
}
