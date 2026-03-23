<script lang="ts">
	import type { PageData } from './$types';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import {
		AlertTriangle,
		AlertCircle,
		Clock,
		Copy,
		Check,
		TrendingDown,
		Users,
		Home,
		ShieldAlert,
		FileWarning,
		Building2,
		ChevronDown,
		ChevronUp,
		RefreshCw,
		Play,
		Loader2,
		CheckCircle,
		XCircle,
		Activity,
		CreditCard,
		Wrench,
		DollarSign
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import {
		tenantsStore,
		leasesStore,
		leaseTenantsStore,
		rentalUnitsStore,
		floorsStore,
		propertiesStore,
		billingsStore,
		paymentsStore,
		metersStore,
		readingsStore,
		expensesStore,
		budgetsStore,
		penaltyConfigsStore
	} from '$lib/stores/collections.svelte';
	import { generateCopySummary, type InsightsData } from './insights-types';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data }: { data: PageData } = $props();
	let copied = $state(false);
	let runningJobs = $state(false);
	let jobResult = $state<any>(null);
	let showJobResult = $state(false);
	let expandedLogId = $state<number | null>(null);
	let expandedSections = $state<Record<string, boolean>>({
		overdue: true,
		missing: true,
		penalties: true,
		occupancy: true,
		automation: true
	});

	const logs = $derived(data.automationLogs ?? []);

	// ── Loading check ──────────────────────────────────────────────────────
	let isLoading = $derived(
		!billingsStore.initialized ||
			!paymentsStore.initialized ||
			!tenantsStore.initialized ||
			!leasesStore.initialized ||
			!leaseTenantsStore.initialized ||
			!rentalUnitsStore.initialized ||
			!floorsStore.initialized ||
			!propertiesStore.initialized ||
			!metersStore.initialized ||
			!readingsStore.initialized ||
			!expensesStore.initialized ||
			!budgetsStore.initialized ||
			!penaltyConfigsStore.initialized
	);

	// ── Overdue Report ─────────────────────────────────────────────────────
	let overdueReport = $derived.by(() => {
		const today = new Date().toISOString().split('T')[0];
		const allBillings = billingsStore.value;
		const overdueBills = allBillings.filter(
			(b: any) =>
				b.due_date < today &&
				['PENDING', 'PARTIAL', 'OVERDUE', 'PENALIZED'].includes(b.status) &&
				Number(b.balance) > 0
		);
		const leaseMap = new Map(leasesStore.value.map((l: any) => [String(l.id), l]));
		const unitMap = new Map(rentalUnitsStore.value.map((u: any) => [String(u.id), u]));
		const ltByLease = new Map<string, any[]>();
		for (const lt of leaseTenantsStore.value) {
			const lid = String(lt.lease_id);
			if (!ltByLease.has(lid)) ltByLease.set(lid, []);
			ltByLease.get(lid)!.push(lt);
		}
		const tenantMap = new Map(tenantsStore.value.map((t: any) => [String(t.id), t]));

		const mapped = overdueBills.flatMap((b: any) => {
			const lease = leaseMap.get(String(b.lease_id));
			if (!lease) return [];
			const unit = unitMap.get(String(lease.rental_unit_id));
			const lts = ltByLease.get(String(lease.id)) || [];
			return lts.map((lt: any) => {
				const tenant = tenantMap.get(String(lt.tenant_id));
				const daysOverdue = Math.max(
					0,
					Math.floor((Date.now() - new Date(b.due_date).getTime()) / 86400000)
				);
				return {
					billingId: Number(b.id),
					tenantName: tenant?.name ?? 'Unknown',
					tenantId: Number(lt.tenant_id),
					leaseId: Number(lease.id),
					type: b.type,
					amount: b.amount,
					balance: b.balance,
					penaltyAmount: b.penalty_amount ?? '0',
					dueDate: b.due_date,
					daysOverdue,
					status: b.status,
					unitName: unit?.name ?? 'Unknown'
				};
			});
		});
		const seen = new Set<number>();
		const unique = mapped.filter((b: any) => {
			if (seen.has(b.billingId)) return false;
			seen.add(b.billingId);
			return true;
		});
		const critical = unique.filter((b: any) => b.daysOverdue > 30);
		const warning = unique.filter((b: any) => b.daysOverdue >= 8 && b.daysOverdue <= 30);
		const mild = unique.filter((b: any) => b.daysOverdue >= 1 && b.daysOverdue < 8);
		const totalOverdueBalance = unique.reduce((s: number, b: any) => s + Number(b.balance), 0);
		const uniqueTenants = new Set(unique.map((b: any) => b.tenantId));
		return { critical, warning, mild, totalOverdueBalance, totalTenants: uniqueTenants.size };
	});

	// ── Financial Summary ──────────────────────────────────────────────────
	let financialSummary = $derived.by(() => {
		const allBillings = billingsStore.value;
		const typeMap = new Map<
			string,
			{
				type: string;
				utilityType: string | null;
				totalBilled: number;
				totalPaid: number;
				totalBalance: number;
				count: number;
				paidCount: number;
				overdueCount: number;
			}
		>();
		for (const b of allBillings) {
			const key = b.type === 'UTILITY' ? `UTILITY_${b.utility_type ?? 'OTHER'}` : b.type;
			if (!typeMap.has(key))
				typeMap.set(key, {
					type: b.type,
					utilityType: b.utility_type,
					totalBilled: 0,
					totalPaid: 0,
					totalBalance: 0,
					count: 0,
					paidCount: 0,
					overdueCount: 0
				});
			const entry = typeMap.get(key)!;
			entry.totalBilled += Number(b.amount);
			entry.totalPaid += Number(b.paid_amount ?? 0);
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

		// Security deposits
		const sdBillings = allBillings.filter((b: any) => b.type === 'SECURITY_DEPOSIT');
		const sdByLease = new Map<string, any>();
		for (const sd of sdBillings) {
			if (!sdByLease.has(String(sd.lease_id))) sdByLease.set(String(sd.lease_id), sd);
		}
		const sdList = Array.from(sdByLease.values());
		const sdTotalRequired = sdList.reduce((s: number, d: any) => s + Number(d.amount), 0);
		const sdTotalPaid = sdList.reduce((s: number, d: any) => s + Number(d.paid_amount ?? 0), 0);
		const sdFullyPaid = sdList.filter((d: any) => d.status === 'PAID').length;

		return {
			billingsByType,
			totalBilled,
			totalCollected,
			totalOutstanding,
			collectionRate,
			securityDeposits: {
				totalRequired: sdTotalRequired,
				totalPaid: sdTotalPaid,
				totalOutstanding: sdTotalRequired - sdTotalPaid,
				fullyPaidLeases: sdFullyPaid,
				outstandingLeases: sdList.length - sdFullyPaid,
				details: [] as any[]
			}
		};
	});

	// ── Tenant Overview ────────────────────────────────────────────────────
	let tenantOverviewReport = $derived.by(() => {
		const allTenants = tenantsStore.value;
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		return {
			total: allTenants.length,
			active: allTenants.filter((t: any) => t.tenant_status === 'ACTIVE').length,
			inactive: allTenants.filter((t: any) => t.tenant_status === 'INACTIVE').length,
			pending: allTenants.filter((t: any) => t.tenant_status === 'PENDING').length,
			blacklisted: allTenants.filter((t: any) => t.tenant_status === 'BLACKLISTED').length,
			newThisMonth: allTenants.filter(
				(t: any) => t.created_at && new Date(t.created_at) >= monthStart
			).length
		};
	});

	// ── Lease Overview ─────────────────────────────────────────────────────
	let leaseOverviewReport = $derived.by(() => {
		const allLeases = leasesStore.value;
		const unitMap = new Map(rentalUnitsStore.value.map((u: any) => [String(u.id), u]));

		const typeMap = new Map<string, number>();
		for (const l of allLeases) {
			const unit = unitMap.get(String(l.rental_unit_id));
			const unitType = unit?.type ?? 'UNKNOWN';
			typeMap.set(unitType, (typeMap.get(unitType) ?? 0) + 1);
		}

		return {
			total: allLeases.length,
			active: allLeases.filter((l: any) => l.status === 'ACTIVE').length,
			expired: allLeases.filter((l: any) => l.status === 'EXPIRED').length,
			terminated: allLeases.filter((l: any) => l.status === 'TERMINATED').length,
			pending: allLeases.filter((l: any) => l.status === 'PENDING').length,
			byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
		};
	});

	// ── Payment Activity ───────────────────────────────────────────────────
	let paymentActivityReport = $derived.by(() => {
		const allPayments = paymentsStore.value;
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthStartStr = monthStart.toISOString();

		// Recent 15 payments (sorted by paid_at desc)
		const sorted = [...allPayments].sort((a: any, b: any) => {
			return new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime();
		});
		const recent15 = sorted.slice(0, 15);
		const recentPayments = recent15.map((p: any) => ({
			id: Number(p.id),
			amount: p.amount,
			method: p.method,
			paidBy: p.paid_by,
			paidAt: p.paid_at,
			referenceNumber: p.reference_number,
			reverted: !!p.reverted_at
		}));

		// This month's payments
		const thisMonthPayments = allPayments.filter(
			(p: any) => p.paid_at >= monthStartStr && !p.reverted_at
		);
		const totalPaymentsThisMonth = thisMonthPayments.length;
		const amountCollectedThisMonth = thisMonthPayments.reduce(
			(s: number, p: any) => s + Number(p.amount),
			0
		);

		// Method breakdown
		const methodMap = new Map<string, { count: number; total: number }>();
		for (const p of thisMonthPayments) {
			const existing = methodMap.get(p.method) ?? { count: 0, total: 0 };
			existing.count++;
			existing.total += Number(p.amount);
			methodMap.set(p.method, existing);
		}
		const methodBreakdown = Array.from(methodMap.entries()).map(([method, d]) => ({
			method,
			...d
		}));

		// Reverted payments (all time)
		const allReverted = allPayments.filter((p: any) => p.reverted_at);
		const revertedCount = allReverted.length;
		const revertedAmount = allReverted.reduce((s: number, p: any) => s + Number(p.amount), 0);

		return {
			recentPayments,
			totalPaymentsThisMonth,
			amountCollectedThisMonth,
			methodBreakdown,
			revertedCount,
			revertedAmount
		};
	});

	// ── Occupancy Report ───────────────────────────────────────────────────
	let occupancyReport = $derived.by(() => {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const in30 = new Date(today);
		in30.setDate(in30.getDate() + 30);
		const in60 = new Date(today);
		in60.setDate(in60.getDate() + 60);
		const in90 = new Date(today);
		in90.setDate(in90.getDate() + 90);
		const d30 = in30.toISOString().split('T')[0];
		const d60 = in60.toISOString().split('T')[0];
		const d90 = in90.toISOString().split('T')[0];

		const allUnits = rentalUnitsStore.value;
		const activeLeases = leasesStore.value.filter((l: any) => l.status === 'ACTIVE');
		const leaseByUnit = new Map<string, any>();
		for (const l of activeLeases) {
			leaseByUnit.set(String(l.rental_unit_id), l);
		}

		const ltByLease = new Map<string, any[]>();
		for (const lt of leaseTenantsStore.value) {
			const lid = String(lt.lease_id);
			if (!ltByLease.has(lid)) ltByLease.set(lid, []);
			ltByLease.get(lid)!.push(lt);
		}
		const tenantMap = new Map(tenantsStore.value.map((t: any) => [String(t.id), t]));
		const floorMap = new Map(floorsStore.value.map((f: any) => [String(f.id), f]));
		const propMap = new Map(propertiesStore.value.map((p: any) => [String(p.id), p]));

		const units = allUnits.map((u: any) => {
			const lease = leaseByUnit.get(String(u.id));
			const floor = floorMap.get(String(u.floor_id));
			const prop = propMap.get(String(u.property_id));
			let tenantName: string | null = null;
			if (lease) {
				const lts = ltByLease.get(String(lease.id)) || [];
				if (lts.length > 0) {
					const t = tenantMap.get(String(lts[0].tenant_id));
					tenantName = t?.name ?? null;
				}
			}
			return {
				unitId: Number(u.id),
				unitName: u.name,
				floorNumber: floor?.floor_number ?? 0,
				propertyName: prop?.name ?? 'Unknown',
				status: u.rental_unit_status,
				baseRate: u.base_rate,
				tenantName,
				leaseEnd: lease?.end_date ?? null,
				leaseStatus: lease?.status ?? null
			};
		});

		const totalUnits = units.length;
		const occupiedUnits = units.filter((u: any) => u.status === 'OCCUPIED').length;
		const vacantUnits = units.filter((u: any) => u.status === 'VACANT').length;
		const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

		return {
			totalUnits,
			occupiedUnits,
			vacantUnits,
			occupancyRate,
			expiringIn30: units.filter(
				(u: any) => u.leaseEnd && u.leaseEnd >= todayStr && u.leaseEnd <= d30
			),
			expiringIn60: units.filter((u: any) => u.leaseEnd && u.leaseEnd > d30 && u.leaseEnd <= d60),
			expiringIn90: units.filter((u: any) => u.leaseEnd && u.leaseEnd > d60 && u.leaseEnd <= d90),
			expiredWithTenant: units.filter(
				(u: any) => u.leaseEnd && u.leaseEnd < todayStr && u.status === 'OCCUPIED'
			),
			vacantList: units.filter((u: any) => u.status === 'VACANT'),
			totalMonthlyRevenue: units
				.filter((u: any) => u.status === 'OCCUPIED')
				.reduce((sum: number, u: any) => sum + Number(u.baseRate), 0)
		};
	});

	// ── Missing Data Report ────────────────────────────────────────────────
	let missingDataReport = $derived.by(() => {
		const items: { category: string; description: string; items: { id: number; name: string; detail: string }[] }[] = [];

		// Tenants without contact number
		const noContact = tenantsStore.value.filter(
			(t: any) =>
				(!t.contact_number || t.contact_number === '') && t.tenant_status !== 'INACTIVE'
		);
		if (noContact.length > 0)
			items.push({
				category: 'Missing Contact Info',
				description: 'Active tenants without contact numbers',
				items: noContact.map((t: any) => ({
					id: Number(t.id),
					name: t.name,
					detail: 'No contact number'
				}))
			});

		// Tenants without email
		const noEmail = tenantsStore.value.filter(
			(t: any) => (!t.email || t.email === '') && t.tenant_status !== 'INACTIVE'
		);
		if (noEmail.length > 0)
			items.push({
				category: 'Missing Email',
				description: 'Active tenants without email addresses',
				items: noEmail.map((t: any) => ({
					id: Number(t.id),
					name: t.name,
					detail: 'No email'
				}))
			});

		// Tenants without emergency contact
		const noEmergency = tenantsStore.value.filter(
			(t: any) => !t.emergency_contact && t.tenant_status !== 'INACTIVE'
		);
		if (noEmergency.length > 0)
			items.push({
				category: 'Missing Emergency Contact',
				description: 'Active tenants without emergency contact info',
				items: noEmergency.map((t: any) => ({
					id: Number(t.id),
					name: t.name,
					detail: 'No emergency contact'
				}))
			});

		// Units without meters
		const meterUnitIds = new Set(metersStore.value.map((m: any) => String(m.rental_unit_id)));
		const unitsWithoutMeters = rentalUnitsStore.value.filter(
			(u: any) => !meterUnitIds.has(String(u.id))
		);
		if (unitsWithoutMeters.length > 0)
			items.push({
				category: 'Units Without Meters',
				description: 'Rental units with no assigned meters',
				items: unitsWithoutMeters.map((u: any) => ({
					id: Number(u.id),
					name: u.name,
					detail: 'No meter assigned'
				}))
			});

		// Stale meter readings (30+ days)
		const staleDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
		const readingsByMeter = new Map<string, string>();
		for (const r of readingsStore.value) {
			const mid = String(r.meter_id);
			const existing = readingsByMeter.get(mid);
			if (!existing || r.reading_date > existing) {
				readingsByMeter.set(mid, r.reading_date);
			}
		}
		const activeMeters = metersStore.value.filter((m: any) => m.status === 'ACTIVE');
		const staleMeters = activeMeters.filter((m: any) => {
			const latest = readingsByMeter.get(String(m.id));
			return !latest || latest < staleDate;
		});
		if (staleMeters.length > 0)
			items.push({
				category: 'Stale Meter Readings',
				description: 'Active meters with no readings in the past 30 days',
				items: staleMeters.map((m: any) => ({
					id: Number(m.id),
					name: m.name,
					detail: readingsByMeter.get(String(m.id))
						? `Last reading: ${readingsByMeter.get(String(m.id))}`
						: 'No readings recorded'
				}))
			});

		return items;
	});

	// ── Penalty Status ─────────────────────────────────────────────────────
	let penaltyStatus = $derived.by(() => {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const configs = penaltyConfigsStore.value;

		const leaseMap = new Map(leasesStore.value.map((l: any) => [String(l.id), l]));
		const ltByLease = new Map<string, any[]>();
		for (const lt of leaseTenantsStore.value) {
			const lid = String(lt.lease_id);
			if (!ltByLease.has(lid)) ltByLease.set(lid, []);
			ltByLease.get(lid)!.push(lt);
		}
		const tenantMap = new Map(tenantsStore.value.map((t: any) => [String(t.id), t]));

		const overdueBills = billingsStore.value.filter(
			(b: any) =>
				b.due_date < todayStr &&
				['PENDING', 'PARTIAL', 'OVERDUE', 'PENALIZED'].includes(b.status) &&
				Number(b.balance) > 0
		);

		// Dedup by billing id
		const seen = new Set<string>();
		const uniqueBills = overdueBills.filter((b: any) => {
			if (seen.has(String(b.id))) return false;
			seen.add(String(b.id));
			return true;
		});

		const eligible: any[] = [];
		const applied: any[] = [];

		for (const bill of uniqueBills) {
			const lease = leaseMap.get(String(bill.lease_id));
			if (!lease) continue;
			const lts = ltByLease.get(String(lease.id)) || [];
			const firstTenant = lts.length > 0 ? tenantMap.get(String(lts[0].tenant_id)) : null;
			const tenantName = firstTenant?.name ?? 'Unknown';
			const config = configs.find((c: any) => c.type === bill.type);
			const daysOverdue = Math.floor(
				(today.getTime() - new Date(bill.due_date).getTime()) / 86400000
			);
			const penaltyAmt = Number(bill.penalty_amount ?? 0);

			if (penaltyAmt > 0) {
				applied.push({
					billingId: Number(bill.id),
					tenantName,
					type: bill.type,
					penaltyAmount: bill.penalty_amount ?? '0',
					originalAmount: bill.amount,
					dueDate: bill.due_date
				});
			} else if (config && daysOverdue > config.grace_period) {
				eligible.push({
					billingId: Number(bill.id),
					tenantName,
					type: bill.type,
					amount: bill.amount,
					balance: bill.balance,
					dueDate: bill.due_date,
					daysOverdue,
					configPercentage: config.penalty_percentage,
					gracePeriod: config.grace_period
				});
			}
		}

		const totalPenaltyApplied = applied.reduce(
			(s: number, a: any) => s + Number(a.penaltyAmount),
			0
		);
		return {
			eligible,
			applied,
			totalPenaltyApplied,
			totalPenaltyOutstanding: totalPenaltyApplied
		};
	});

	// ── Budget Summary ─────────────────────────────────────────────────────
	let budgetSummaryReport = $derived.by(() => {
		const allBudgets = budgetsStore.value;
		const totalPlanned = allBudgets.reduce(
			(s: number, b: any) => s + Number(b.planned_amount),
			0
		);
		const totalActual = allBudgets.reduce(
			(s: number, b: any) => s + Number(b.actual_amount ?? 0),
			0
		);
		const totalPending = allBudgets.reduce(
			(s: number, b: any) => s + Number(b.pending_amount ?? 0),
			0
		);
		const overBudgetCount = allBudgets.filter(
			(b: any) => Number(b.actual_amount ?? 0) > Number(b.planned_amount)
		).length;

		return {
			totalBudgets: allBudgets.length,
			totalPlanned,
			totalActual,
			totalPending,
			utilizationRate: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0,
			overBudgetCount,
			items: allBudgets.map((b: any) => ({
				name: b.project_name,
				category: b.project_category ?? null,
				planned: Number(b.planned_amount),
				actual: Number(b.actual_amount ?? 0),
				status: b.status ?? null
			}))
		};
	});

	// ── Expense Summary ────────────────────────────────────────────────────
	let expenseSummaryReport = $derived.by(() => {
		const allExpenses = expensesStore.value;
		const approved = allExpenses.filter((e: any) => e.status === 'APPROVED');
		const pending = allExpenses.filter((e: any) => e.status === 'PENDING');
		const rejected = allExpenses.filter((e: any) => e.status === 'REJECTED');

		const typeMap = new Map<string, { count: number; total: number }>();
		for (const e of approved) {
			const existing = typeMap.get(e.type) ?? { count: 0, total: 0 };
			existing.count++;
			existing.total += Number(e.amount);
			typeMap.set(e.type, existing);
		}

		const recent = [...allExpenses]
			.sort((a: any, b: any) => {
				const da = a.expense_date ? new Date(a.expense_date).getTime() : 0;
				const db2 = b.expense_date ? new Date(b.expense_date).getTime() : 0;
				return db2 - da;
			})
			.slice(0, 10);

		return {
			totalExpenses: allExpenses.length,
			totalApproved: approved.reduce((s: number, e: any) => s + Number(e.amount), 0),
			totalPending: pending.length,
			totalRejected: rejected.length,
			pendingApprovalAmount: pending.reduce((s: number, e: any) => s + Number(e.amount), 0),
			byType: Array.from(typeMap.entries()).map(([type, d]) => ({ type, ...d })),
			recentExpenses: recent.map((e: any) => ({
				description: e.description,
				amount: Number(e.amount),
				type: e.type,
				status: e.status,
				date: e.expense_date ?? null
			}))
		};
	});

	// ── Meter Summary ──────────────────────────────────────────────────────
	let meterSummaryReport = $derived.by(() => {
		const allMeters = metersStore.value;
		const typeMap = new Map<string, number>();
		for (const m of allMeters) {
			typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1);
		}

		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
			.toISOString()
			.split('T')[0];
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			.toISOString()
			.split('T')[0];

		const allReadings = readingsStore.value;
		const readingsThisMonth = allReadings.filter(
			(r: any) => r.reading_date >= thisMonthStart
		).length;
		const readingsLastMonth = allReadings.filter(
			(r: any) => r.reading_date >= lastMonthStart && r.reading_date < thisMonthStart
		).length;

		// Stale meters
		const staleDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
		const readingsByMeter = new Map<string, string>();
		for (const r of allReadings) {
			const mid = String(r.meter_id);
			const existing = readingsByMeter.get(mid);
			if (!existing || r.reading_date > existing) {
				readingsByMeter.set(mid, r.reading_date);
			}
		}
		const activeMeters = allMeters.filter((m: any) => m.status === 'ACTIVE');
		const stale = activeMeters.filter((m: any) => {
			const latest = readingsByMeter.get(String(m.id));
			return !latest || latest < staleDate;
		});

		return {
			totalMeters: allMeters.length,
			activeMeters: activeMeters.length,
			byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
			readingsThisMonth,
			readingsLastMonth,
			staleMeters: stale.map((m: any) => ({
				name: m.name,
				lastReading: readingsByMeter.get(String(m.id)) ?? null,
				type: m.type
			}))
		};
	});

	// ── Monthly Timeline (client-side from RxDB) ─────────────────────────
	let monthlyTimeline = $derived.by(() => {
		const now = new Date();
		const months: { month: string; label: string; billingsCreated: number; paymentsReceived: number; amountCollected: number; meterReadings: number; expensesLogged: number }[] = [];

		for (let i = 0; i < 12; i++) {
			const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
			const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
			const label = monthDate.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });

			const monthStartMs = monthDate.getTime();
			const nextMonthMs = nextMonth.getTime();
			const monthStartDateStr = `${monthStr}-01`;
			const nextMonthDateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

			let billingsCreated = 0;
			let paymentsReceived = 0;
			let amountCollected = 0;
			let meterReadings = 0;
			let expensesLogged = 0;

			for (const b of billingsStore.value) {
				if (!b.created_at) continue;
				const t = new Date(b.created_at).getTime();
				if (t >= monthStartMs && t < nextMonthMs) billingsCreated++;
			}
			for (const p of paymentsStore.value) {
				if (!p.paid_at) continue;
				const t = new Date(p.paid_at).getTime();
				if (t >= monthStartMs && t < nextMonthMs && !p.reverted_at) {
					paymentsReceived++;
					amountCollected += Number(p.amount) || 0;
				}
			}
			for (const r of readingsStore.value) {
				if (!r.reading_date) continue;
				if (r.reading_date >= monthStartDateStr && r.reading_date < nextMonthDateStr) meterReadings++;
			}
			for (const e of expensesStore.value) {
				if (!e.created_at) continue;
				const t = new Date(e.created_at).getTime();
				if (t >= monthStartMs && t < nextMonthMs) expensesLogged++;
			}

			months.push({ month: monthStr, label, billingsCreated, paymentsReceived, amountCollected, meterReadings, expensesLogged });
		}
		return months;
	});

	// ── Combined Insights object ───────────────────────────────────────────
	let insights = $derived.by(() => {
		if (isLoading) return null;
		const sh = data.systemHealth;
		return {
			overdue: overdueReport,
			missingData: missingDataReport,
			penalties: penaltyStatus,
			occupancy: occupancyReport,
			financial: financialSummary,
			paymentActivity: paymentActivityReport,
			tenantOverview: tenantOverviewReport,
			leaseOverview: leaseOverviewReport,
			budgetSummary: budgetSummaryReport,
			expenseSummary: expenseSummaryReport,
			meterSummary: meterSummaryReport,
			maintenanceSummary: {
				total: 0,
				pending: 0,
				inProgress: 0,
				completed: 0,
				pendingItems: []
			},
			systemHealth: sh ? { ...sh, monthlyTimeline } : {
				lastBillingDate: null, lastPaymentDate: null, lastReadingDate: null, lastExpenseDate: null,
				daysSinceLastBilling: null, daysSinceLastPayment: null, daysSinceLastReading: null,
				monthlyTimeline
			},
			generatedAt: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
		} as InsightsData;
	});

	// ── Copy Summary ───────────────────────────────────────────────────────
	let summary = $derived(insights ? generateCopySummary(insights, data.appUrl) : '');

	async function copySummary() {
		if (!summary) return;
		try {
			await navigator.clipboard.writeText(summary);
			copied = true;
			toast.success(
				'Summary copied to clipboard! Paste into ChatGPT or Claude.ai for analysis.'
			);
			setTimeout(() => (copied = false), 3000);
		} catch {
			toast.error('Failed to copy — try selecting and copying manually.');
		}
	}

	async function runAutomationJobs() {
		runningJobs = true;
		jobResult = null;
		showJobResult = true;
		try {
			const { runClientAutomation } = await import('$lib/db/client-automation');
			// Reset the once-per-session guard so manual trigger works
			(globalThis as any).__dorm_automation_ran = false;
			const auto = await runClientAutomation();
			jobResult = {
				ok: auto.errors.length === 0,
				overdue: auto.overdue,
				penalties: auto.penalties,
				reminders: auto.reminders,
				errors: auto.errors
			};

			if (auto.errors.length === 0) {
				const parts: string[] = [];
				if (auto.overdue.applied > 0) parts.push(`${auto.overdue.applied} overdue`);
				if (auto.penalties.applied > 0) parts.push(`${auto.penalties.applied} penalties`);
				if (auto.reminders.sent > 0) parts.push(`${auto.reminders.sent} reminders`);
				toast.success(parts.length > 0 ? `Applied: ${parts.join(', ')}` : 'All items already up to date');
			} else {
				toast.warning('Automation completed with some errors.');
			}

			await invalidateAll();
		} catch (e) {
			toast.error('Automation failed.');
			jobResult = { error: e instanceof Error ? e.message : String(e) };
		}
		runningJobs = false;
	}

	function handleRunClick() {
		runAutomationJobs();
	}

	function toggleSection(key: string) {
		expandedSections[key] = !expandedSections[key];
	}

	function formatLogTime(dateStr: string | Date): string {
		const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		return d.toLocaleString('en-PH', {
			timeZone: 'Asia/Manila',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function jobTypeLabel(type: string): string {
		const map: Record<string, string> = {
			OVERDUE_CHECK: 'Overdue Detection',
			PENALTY_CALC: 'Penalty Calculation',
			REMINDER: 'Payment Reminders',
			UTILITY_BILLING: 'Utility Billing'
		};
		return map[type] ?? type;
	}

	function severityColor(days: number): string {
		if (days > 30) return 'text-red-600 bg-red-50 border-red-200';
		if (days >= 8) return 'text-orange-600 bg-orange-50 border-orange-200';
		return 'text-yellow-600 bg-yellow-50 border-yellow-200';
	}

	function humanizeBillingType(type: string): string {
		const map: Record<string, string> = {
			RENT: 'Rent',
			UTILITY: 'Utility',
			SECURITY_DEPOSIT: 'Security Deposit',
			ADVANCE_RENT: 'Advance Rent',
			MISCELLANEOUS: 'Miscellaneous',
			PENALTY: 'Penalty'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function humanizeStatus(status: string): string {
		const map: Record<string, string> = {
			PENDING: 'Pending',
			PARTIAL: 'Partial',
			PAID: 'Paid',
			OVERDUE: 'Overdue',
			PENALIZED: 'Penalized',
			ACTIVE: 'Active',
			INACTIVE: 'Inactive',
			EXPIRED: 'Expired',
			TERMINATED: 'Terminated',
			BLACKLISTED: 'Blacklisted',
			APPROVED: 'Approved',
			REJECTED: 'Rejected',
			IN_PROGRESS: 'In Progress',
			COMPLETED: 'Completed',
			SUCCESS: 'Success',
			FAILED: 'Failed'
		};
		return map[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function formatDate(dateStr: string): string {
		try {
			const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
			return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
		} catch {
			return dateStr;
		}
	}

	function humanizeUtilityType(type: string | null): string {
		if (!type) return 'Other';
		const map: Record<string, string> = {
			ELECTRICITY: 'Electricity',
			WATER: 'Water',
			OTHER: 'Other'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function humanizePaymentMethod(method: string): string {
		const map: Record<string, string> = {
			CASH: 'Cash',
			GCASH: 'GCash',
			BANK_TRANSFER: 'Bank Transfer',
			CHECK: 'Check',
			CREDIT_CARD: 'Credit Card',
			DEBIT_CARD: 'Debit Card',
			OTHER: 'Other'
		};
		return map[method] ?? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function humanizeExpenseType(type: string): string {
		const map: Record<string, string> = {
			MAINTENANCE: 'Maintenance',
			SUPPLIES: 'Supplies',
			UTILITIES: 'Utilities',
			SALARY: 'Salary',
			INSURANCE: 'Insurance',
			TAX: 'Tax',
			OTHER: 'Other'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function humanizeMeterType(type: string): string {
		const map: Record<string, string> = {
			ELECTRICITY: 'Electricity',
			WATER: 'Water',
			GAS: 'Gas',
			OTHER: 'Other'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function humanizeUnitType(type: string): string {
		const map: Record<string, string> = {
			ROOM: 'Room',
			BED: 'Bed',
			STUDIO: 'Studio',
			APARTMENT: 'Apartment',
			DORMITORY: 'Dormitory'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<svelte:head>
	<title>Insights — Dorm Management</title>
</svelte:head>

<div class="space-y-6">
	<SyncErrorBanner collections={['billings', 'payments', 'tenants', 'leases', 'rental_units', 'meters', 'readings', 'expenses', 'budgets']} />

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Insights</h1>
			<p class="text-sm text-muted-foreground mt-1">
				{#if insights}
					Generated {insights.generatedAt}
				{:else if isLoading}
					Loading data from local cache...
				{:else}
					No data available
				{/if}
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/insights"
				data-sveltekit-reload
				class="inline-flex items-center gap-2 rounded-md border px-3 py-2 min-h-[44px] text-sm hover:bg-muted transition-colors"
			>
				<RefreshCw class="h-4 w-4" />
				Refresh
			</a>
			<button
				onclick={copySummary}
				disabled={!summary}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 min-h-[44px] text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if copied}
					<Check class="h-4 w-4" />
					Copied!
				{:else}
					<Copy class="h-4 w-4" />
					Copy Summary
				{/if}
			</button>
		</div>
	</div>

	{#if isLoading}
		<!-- Loading skeletons -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Array(8) as _}
				<div class="rounded-lg border p-4 space-y-2">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="h-8 w-32" />
					<Skeleton class="h-3 w-20" />
				</div>
			{/each}
		</div>
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="rounded-lg border p-4 space-y-3">
					<Skeleton class="h-5 w-48" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-3/4" />
				</div>
			{/each}
		</div>
	{:else if !insights}
		<div class="rounded-lg border p-8 text-center text-muted-foreground">
			<FileWarning class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p>Log in to see insights.</p>
		</div>
	{:else}
		<!-- KPI Cards Row -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Total Overdue -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<TrendingDown class="h-4 w-4 text-red-500" />
					Total Overdue
				</div>
				<p class="text-2xl font-bold text-red-600 tabular-nums">
					{formatCurrency(insights.overdue.totalOverdueBalance)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.overdue.totalTenants} tenant{insights.overdue.totalTenants !== 1 ? 's' : ''}
				</p>
			</div>

			<!-- Collection Rate -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Activity class="h-4 w-4 text-green-500" />
					Collection Rate
				</div>
				<p class="text-2xl font-bold text-green-600 tabular-nums">
					{insights.financial.collectionRate.toFixed(1)}%
				</p>
				<p class="text-xs text-muted-foreground tabular-nums">
					{formatCurrency(insights.financial.totalCollected)} of {formatCurrency(insights.financial.totalBilled)}
				</p>
			</div>

			<!-- Occupancy Rate -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Home class="h-4 w-4 text-blue-500" />
					Occupancy
				</div>
				<p class="text-2xl font-bold tabular-nums">
					{insights.occupancy.occupancyRate.toFixed(1)}%
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.occupancy.occupiedUnits}/{insights.occupancy.totalUnits} units
				</p>
			</div>

			<!-- This Month Collections -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<CreditCard class="h-4 w-4 text-emerald-500" />
					This Month
				</div>
				<p class="text-2xl font-bold text-emerald-600 tabular-nums">
					{formatCurrency(insights.paymentActivity.amountCollectedThisMonth)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.paymentActivity.totalPaymentsThisMonth} payment{insights.paymentActivity.totalPaymentsThisMonth !== 1 ? 's' : ''}
				</p>
			</div>

			<!-- Penalties Pending -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<ShieldAlert class="h-4 w-4 text-orange-500" />
					Penalties Eligible
				</div>
				<p class="text-2xl font-bold text-orange-600 tabular-nums">
					{insights.penalties.eligible.length}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.penalties.applied.length} already applied
				</p>
			</div>

			<!-- Security Deposits -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<DollarSign class="h-4 w-4 text-violet-500" />
					Security Deposits
				</div>
				<p class="text-2xl font-bold text-violet-600 tabular-nums">
					{formatCurrency(insights.financial.securityDeposits.totalPaid)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.financial.securityDeposits.fullyPaidLeases} paid, {insights.financial.securityDeposits.outstandingLeases} outstanding
				</p>
			</div>

			<!-- Active Tenants -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Users class="h-4 w-4 text-cyan-500" />
					Tenants
				</div>
				<p class="text-2xl font-bold tabular-nums">
					{insights.tenantOverview.active}
				</p>
				<p class="text-xs text-muted-foreground">
					active of {insights.tenantOverview.total} total{insights.tenantOverview.newThisMonth > 0 ? `, +${insights.tenantOverview.newThisMonth} new` : ''}
				</p>
			</div>

			<!-- Maintenance -->
			{#if insights.maintenanceSummary.total > 0}
				<div class="rounded-lg border p-4 space-y-1">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Wrench class="h-4 w-4 text-amber-500" />
						Maintenance
					</div>
					<p class="text-2xl font-bold text-amber-600 tabular-nums">
						{insights.maintenanceSummary.pending}
					</p>
					<p class="text-xs text-muted-foreground">
						pending, {insights.maintenanceSummary.inProgress} in progress
					</p>
				</div>
			{/if}

			<!-- Data Issues -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<FileWarning class="h-4 w-4 text-yellow-500" />
					Data Issues
				</div>
				<p class="text-2xl font-bold text-yellow-600 tabular-nums">
					{insights.missingData.reduce((s: number, c: any) => s + c.items.length, 0)}
				</p>
				<p class="text-xs text-muted-foreground">
					across {insights.missingData.length} categor{insights.missingData.length !== 1 ? 'ies' : 'y'}
				</p>
			</div>
		</div>

		<!-- Section: Overdue Payments -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('overdue')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
						<AlertTriangle class="h-4 w-4 text-red-600" />
					</div>
					<div>
						<h2 class="font-semibold">Overdue Payments & Balances</h2>
						<p class="text-sm text-muted-foreground">
							{insights.overdue.critical.length + insights.overdue.warning.length + insights.overdue.mild.length} overdue billing{insights.overdue.critical.length + insights.overdue.warning.length + insights.overdue.mild.length !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				{#if expandedSections.overdue}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.overdue}
				<div class="border-t p-4 space-y-4">
					{#if insights.overdue.critical.length === 0 && insights.overdue.warning.length === 0 && insights.overdue.mild.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No overdue payments. Great job!</p>
					{:else}
						{#each [
							{ label: 'Critical (30+ days)', items: insights.overdue.critical, dot: 'bg-red-500' },
							{ label: 'Warning (8-30 days)', items: insights.overdue.warning, dot: 'bg-orange-500' },
							{ label: 'Mild (1-7 days)', items: insights.overdue.mild, dot: 'bg-yellow-500' }
						] as group}
							{#if group.items.length > 0}
								<div>
									<h3 class="text-sm font-medium mb-2 flex items-center gap-2">
										<span class="inline-block w-2 h-2 rounded-full {group.dot}"></span>
										{group.label}
										<span class="text-xs text-muted-foreground">({group.items.length})</span>
									</h3>
									<div class="space-y-2">
										{#each group.items as billing}
											<div class="flex items-center justify-between rounded-md border p-3 text-sm {severityColor(billing.daysOverdue)}">
												<div class="flex-1 min-w-0">
													<span class="font-medium">{billing.tenantName}</span>
													<span class="text-xs opacity-75 ml-2">{billing.unitName}</span>
													<div class="text-xs opacity-75 mt-0.5">
														{humanizeBillingType(billing.type)} — Due: {formatDate(billing.dueDate)} ({billing.daysOverdue}d overdue)
													</div>
												</div>
												<div class="text-right shrink-0 ml-4 tabular-nums">
													<div class="font-semibold">{formatCurrency(Number(billing.balance))}</div>
													{#if Number(billing.penaltyAmount) > 0}
														<div class="text-xs">+{formatCurrency(Number(billing.penaltyAmount))} penalty</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Missing Data -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('missing')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
						<FileWarning class="h-4 w-4 text-yellow-600" />
					</div>
					<div>
						<h2 class="font-semibold">Missing / Incomplete Data</h2>
						<p class="text-sm text-muted-foreground">
							{insights.missingData.reduce((s: number, c: any) => s + c.items.length, 0)} issue{insights.missingData.reduce((s: number, c: any) => s + c.items.length, 0) !== 1 ? 's' : ''} found
						</p>
					</div>
				</div>
				{#if expandedSections.missing}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.missing}
				<div class="border-t p-4 space-y-4">
					{#if insights.missingData.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">All data looks complete!</p>
					{:else}
						{#each insights.missingData as category}
							<div>
								<h3 class="text-sm font-medium mb-1">{category.category}</h3>
								<p class="text-xs text-muted-foreground mb-2">{category.description}</p>
								<div class="space-y-1">
									{#each category.items as item}
										<div class="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm">
											<span class="font-medium text-yellow-800">{item.name}</span>
											<span class="text-xs text-yellow-600">{item.detail}</span>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Penalty Status -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('penalties')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
						<ShieldAlert class="h-4 w-4 text-orange-600" />
					</div>
					<div>
						<h2 class="font-semibold">Penalty Status</h2>
						<p class="text-sm text-muted-foreground">
							{insights.penalties.eligible.length} eligible, {insights.penalties.applied.length} applied
						</p>
					</div>
				</div>
				{#if expandedSections.penalties}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.penalties}
				<div class="border-t p-4 space-y-4">
					{#if insights.penalties.eligible.length === 0 && insights.penalties.applied.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No penalty activity.</p>
					{:else}
						{#if insights.penalties.eligible.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2 text-orange-700">Eligible for Penalty (not yet applied)</h3>
								<div class="space-y-2">
									{#each insights.penalties.eligible as p}
										<div class="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 p-3 text-sm">
											<div class="flex-1 min-w-0">
												<span class="font-medium text-orange-800">{p.tenantName}</span>
												<div class="text-xs text-orange-600 mt-0.5">
													{humanizeBillingType(p.type)} — {p.daysOverdue}d overdue (grace: {p.gracePeriod}d, rate: {p.configPercentage}%)
												</div>
											</div>
											<div class="text-right shrink-0 ml-4 tabular-nums">
												<div class="font-semibold text-orange-800">{formatCurrency(Number(p.balance))}</div>
												<div class="text-xs text-orange-600">of {formatCurrency(Number(p.amount))}</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if insights.penalties.applied.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2 text-red-700">Penalties Applied</h3>
								<p class="text-xs text-muted-foreground mb-2 tabular-nums">
									Total: {formatCurrency(insights.penalties.totalPenaltyApplied)}
								</p>
								<div class="space-y-2">
									{#each insights.penalties.applied as p}
										<div class="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm">
											<div class="flex-1 min-w-0">
												<span class="font-medium text-red-800">{p.tenantName}</span>
												<div class="text-xs text-red-600 mt-0.5">{humanizeBillingType(p.type)} — Due: {formatDate(p.dueDate)}</div>
											</div>
											<div class="text-right shrink-0 ml-4 tabular-nums">
												<div class="font-semibold text-red-800">+{formatCurrency(Number(p.penaltyAmount))}</div>
												<div class="text-xs text-red-600">on {formatCurrency(Number(p.originalAmount))}</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Occupancy & Lease Expiry -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('occupancy')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
						<Building2 class="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<h2 class="font-semibold">Occupancy & Lease Expiry</h2>
						<p class="text-sm text-muted-foreground">
							{insights.occupancy.occupiedUnits} occupied, {insights.occupancy.vacantUnits} vacant
						</p>
					</div>
				</div>
				{#if expandedSections.occupancy}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.occupancy}
				<div class="border-t p-4 space-y-4">
					<!-- Occupancy bar -->
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-muted-foreground">Occupancy Rate</span>
							<span class="font-medium">{insights.occupancy.occupancyRate.toFixed(1)}%</span>
						</div>
						<div class="h-3 rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500"
								class:bg-green-500={insights.occupancy.occupancyRate >= 80}
								class:bg-yellow-500={insights.occupancy.occupancyRate >= 50 && insights.occupancy.occupancyRate < 80}
								class:bg-red-500={insights.occupancy.occupancyRate < 50}
								style="width: {insights.occupancy.occupancyRate}%"
							></div>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground mt-1">
							<span>{insights.occupancy.occupiedUnits} occupied</span>
							<span>{insights.occupancy.vacantUnits} vacant</span>
						</div>
					</div>

					<div class="text-sm">
						<span class="text-muted-foreground">Est. monthly revenue: </span>
						<span class="font-medium tabular-nums">{formatCurrency(insights.occupancy.totalMonthlyRevenue)}</span>
					</div>

					{#if insights.occupancy.expiredWithTenant.length > 0}
						<div>
							<h3 class="text-sm font-medium mb-2 text-red-700 flex items-center gap-1">
								<AlertCircle class="h-3.5 w-3.5" />
								Expired Leases (tenant still in unit)
							</h3>
							<div class="space-y-1">
								{#each insights.occupancy.expiredWithTenant as u}
									<div class="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-2 text-sm">
										<div>
											<span class="font-medium text-red-800">{u.unitName}</span>
											<span class="text-xs text-red-600 ml-2">{u.propertyName}, Floor {u.floorNumber}</span>
										</div>
										<div class="text-xs text-red-600">
											{u.tenantName} — ended {formatDate(u.leaseEnd ?? '')}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#each [
						{ label: 'Expiring within 30 days', items: insights.occupancy.expiringIn30, borderColor: 'border-orange-200', bgColor: 'bg-orange-50', textColor: 'text-orange-800', subColor: 'text-orange-600' },
						{ label: 'Expiring in 31-60 days', items: insights.occupancy.expiringIn60, borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', subColor: 'text-yellow-600' },
						{ label: 'Expiring in 61-90 days', items: insights.occupancy.expiringIn90, borderColor: 'border-blue-200', bgColor: 'bg-blue-50', textColor: 'text-blue-800', subColor: 'text-blue-600' }
					] as group}
						{#if group.items.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2">{group.label} ({group.items.length})</h3>
								<div class="space-y-1">
									{#each group.items as u}
										<div class="flex items-center justify-between rounded-md border {group.borderColor} {group.bgColor} p-2 text-sm">
											<span class="font-medium {group.textColor}">{u.unitName}</span>
											<span class="text-xs {group.subColor}">{u.tenantName} — ends {formatDate(u.leaseEnd ?? '')}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}

					{#if insights.occupancy.vacantList.length > 0}
						<div>
							<h3 class="text-sm font-medium mb-2">Vacant Units ({insights.occupancy.vacantList.length})</h3>
							<div class="space-y-1">
								{#each insights.occupancy.vacantList as u}
									<div class="flex items-center justify-between rounded-md border p-2 text-sm">
										<div>
											<span class="font-medium">{u.unitName}</span>
											<span class="text-xs text-muted-foreground ml-2">{u.propertyName}, Floor {u.floorNumber}</span>
										</div>
										<span class="text-sm font-medium tabular-nums">{formatCurrency(Number(u.baseRate))}/mo</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Automation Logs -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('automation')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
						<Activity class="h-4 w-4 text-purple-600" />
					</div>
					<div>
						<h2 class="font-semibold">Automation Logs</h2>
						<p class="text-sm text-muted-foreground">
							{logs.length} recent run{logs.length !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				{#if expandedSections.automation}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.automation}
				<div class="border-t p-4 space-y-4">
					<!-- Run Jobs Button -->
					<div class="flex items-center gap-3">
							<button
								onclick={handleRunClick}
								disabled={runningJobs}
								class="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 min-h-[44px] text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
							>
								{#if runningJobs}
									<Loader2 class="h-4 w-4 animate-spin" />
									Running...
								{:else}
									<Play class="h-4 w-4" />
									Run Jobs Now
								{/if}
							</button>
							<span class="text-xs text-muted-foreground">
								Runs overdue detection, penalty calculation & reminders
							</span>
					</div>

					<!-- Last Run Result -->
					{#if showJobResult && jobResult}
						<div class={cn(
							"rounded-md border p-3 text-sm",
							jobResult.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
						)}>
							<div class="flex items-center gap-2 font-medium mb-2">
								{#if jobResult.ok}
									<CheckCircle class="h-4 w-4 text-green-600" />
									<span class="text-green-800">Jobs completed successfully</span>
								{:else}
									<XCircle class="h-4 w-4 text-red-600" />
									<span class="text-red-800">{jobResult.error || 'Jobs completed with errors'}</span>
								{/if}
							</div>
							{#if jobResult.results}
								<div class="space-y-1 text-xs">
									{#if jobResult.results.overdue}
										<div class="flex justify-between">
											<span>Overdue Detection</span>
											<span>
												{jobResult.results.overdue.updated ?? 0} updated, {jobResult.results.overdue.notified ?? 0} notified
											</span>
										</div>
									{/if}
									{#if jobResult.results.penalties}
										<div class="flex justify-between">
											<span>Penalty Calculation</span>
											<span>
												{jobResult.results.penalties.applied ?? 0} applied, ₱{(jobResult.results.penalties.totalPenaltyAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
											</span>
										</div>
									{/if}
									{#if jobResult.results.reminders}
										<div class="flex justify-between">
											<span>Payment Reminders</span>
											<span>
												{jobResult.results.reminders.sent ?? 0} sent, {jobResult.results.reminders.skipped ?? 0} skipped
											</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Log History -->
					{#if logs.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No automation runs yet. Click "Run Jobs Now" to test.</p>
					{:else}
						<div class="space-y-2">
							{#each logs as log (log.id)}
								<div class="rounded-md border overflow-hidden">
									<button
										onclick={() => expandedLogId = expandedLogId === log.id ? null : log.id}
										class="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors text-left"
									>
										<div class="flex items-center gap-3">
											{#if log.status === 'SUCCESS'}
												<CheckCircle class="h-4 w-4 text-green-500 shrink-0" />
											{:else if log.status === 'PARTIAL'}
												<AlertTriangle class="h-4 w-4 text-yellow-500 shrink-0" />
											{:else}
												<XCircle class="h-4 w-4 text-red-500 shrink-0" />
											{/if}
											<div>
												<span class="font-medium">{jobTypeLabel(log.jobType)}</span>
												<span class={cn(
													"ml-2 text-xs px-1.5 py-0.5 rounded-full",
													log.status === 'SUCCESS' && "bg-green-100 text-green-700",
													log.status === 'PARTIAL' && "bg-yellow-100 text-yellow-700",
													log.status === 'FAILED' && "bg-red-100 text-red-700"
												)}>
													{humanizeStatus(log.status)}
												</span>
											</div>
										</div>
										<div class="flex items-center gap-3 text-xs text-muted-foreground">
											<span>{log.itemsProcessed} processed</span>
											{#if (log.itemsFailed ?? 0) > 0}
												<span class="text-red-500">{log.itemsFailed} failed</span>
											{/if}
											<span>{formatLogTime(log.startedAt)}</span>
											{#if expandedLogId === log.id}
												<ChevronUp class="h-3.5 w-3.5" />
											{:else}
												<ChevronDown class="h-3.5 w-3.5" />
											{/if}
										</div>
									</button>

									{#if expandedLogId === log.id}
										<div class="border-t bg-muted/30 p-3">
											<pre class="text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">{JSON.stringify(log.details, null, 2)}</pre>
											{#if log.error}
												<div class="mt-2 text-xs text-red-600 font-medium">
													Error: {log.error}
												</div>
											{/if}
											{#if log.completedAt}
												<div class="mt-2 text-[10px] text-muted-foreground">
													Duration: {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Copy Summary Preview -->
		<section class="rounded-lg border p-4">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-medium text-muted-foreground">Summary Preview (for AI chatbot)</h2>
				<button
					onclick={copySummary}
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
				>
					{#if copied}
						<Check class="h-3 w-3" />
						Copied
					{:else}
						<Copy class="h-3 w-3" />
						Copy
					{/if}
				</button>
			</div>
			<pre class="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{summary}</pre>
		</section>
	{/if}
</div>
