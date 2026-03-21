<script lang="ts">
	import LeaseFormModal from './LeaseFormModal.svelte';
	import LeaseList from './LeaseList.svelte';
	import BatchPaymentModal from './BatchPaymentModal.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Plus, Printer, Check, Clock, AlertTriangle, CircleDollarSign, FileText, CircleDot, CreditCard } from 'lucide-svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { z } from 'zod/v3';
	import { leaseSchema } from './formSchema';
	import { calculateLeaseBalanceStatus } from '$lib/utils/lease-status';
	import { formatCurrency, formatCompactCurrency } from '$lib/utils/format';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { printAllLeases } from '$lib/utils/print';
	import {
		leasesStore,
		tenantsStore,
		rentalUnitsStore,
		floorsStore,
		propertiesStore,
		leaseTenantsStore,
		billingsStore,
		paymentsStore,
		paymentAllocationsStore
	} from '$lib/stores/collections.svelte';
	import { resyncCollection } from '$lib/db/replication';
	import { optimisticDeleteLease } from '$lib/db/optimistic-leases';
	import { bufferedMutation } from '$lib/db/optimistic-utils';
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';

	type FormType = z.infer<typeof leaseSchema>;

	// ─── Derived data from RxDB stores (Map-based O(n) joins) ──────────

	// Tenant name→tenant map for O(1) profile picture lookups in LeaseCard
	let tenantNameMap = $derived.by(() => {
		const m = new Map<string, any>();
		for (const t of tenantsStore.value) m.set(t.name, t);
		return m;
	});

	let leases = $derived.by(() => {
		// Build lookup maps once — O(m) per collection
		const unitMap = new Map<string, any>();
		for (const u of rentalUnitsStore.value) unitMap.set(String(u.id), u);

		const floorMap = new Map<string, any>();
		for (const f of floorsStore.value) floorMap.set(String(f.id), f);

		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		const tenantMap = new Map<string, any>();
		for (const t of tenantsStore.value) tenantMap.set(String(t.id), t);

		// Group lease_tenants by lease_id
		const ltByLease = new Map<string, any[]>();
		for (const lt of leaseTenantsStore.value) {
			const key = String(lt.lease_id);
			const arr = ltByLease.get(key);
			if (arr) arr.push(lt);
			else ltByLease.set(key, [lt]);
		}

		// Group billings by lease_id
		const billByLease = new Map<string, any[]>();
		for (const b of billingsStore.value) {
			const key = String(b.lease_id);
			const arr = billByLease.get(key);
			if (arr) arr.push(b);
			else billByLease.set(key, [b]);
		}

		const paymentMap = new Map<string, any>();
		for (const p of paymentsStore.value) paymentMap.set(String(p.id), p);

		const allocByBilling = new Map<string, any[]>();
		for (const a of paymentAllocationsStore.value) {
			const key = String(a.billing_id);
			const arr = allocByBilling.get(key);
			if (arr) arr.push(a);
			else allocByBilling.set(key, [a]);
		}

		// Single pass over leases with O(1) lookups — sorted by updated_at desc
		const sortedLeases = [...leasesStore.value].sort((a: any, b: any) => {
			const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bMs - aMs;
		});
		return sortedLeases.map((lease: any) => {
			const leaseId = String(lease.id);
			const unit = unitMap.get(String(lease.rental_unit_id));
			const floor = unit ? floorMap.get(String(unit.floor_id)) ?? null : null;
			const property = unit ? propMap.get(String(unit.property_id)) ?? null : null;

			// Lease tenants via pre-grouped map
			const ltDocs = ltByLease.get(leaseId) || [];
			const lease_tenants = [];
			const tenantNameParts: string[] = [];
			for (const lt of ltDocs) {
				const tenant = tenantMap.get(String(lt.tenant_id));
				if (tenant) {
					lease_tenants.push({
						tenant: {
							name: tenant.name,
							email: tenant.email,
							contact_number: tenant.contact_number,
							profile_picture_url: tenant.profile_picture_url
						}
					});
					if (tenant.name) tenantNameParts.push(tenant.name.toLowerCase());
				}
			}

			// Billings via pre-grouped map
			const rawBillings = billByLease.get(leaseId) || [];
			const leaseBillings = [];
			let totalPaid = 0;
			let totalBalance = 0;
			for (const b of rawBillings) {
				const paidAmt = parseFloat(b.paid_amount) || 0;
				const bal = parseFloat(b.balance) || 0;
				totalPaid += paidAmt;
				totalBalance += bal;
				const billingId = String(b.id);
				const rawAllocs = allocByBilling.get(billingId) || [];
				const allocations = rawAllocs.map((a: any) => ({
					id: Number(a.id),
					payment_id: a.payment_id,
					billing_id: a.billing_id,
					amount: parseFloat(a.amount) || 0,
					payment: paymentMap.get(String(a.payment_id)) ?? null
				}));
				leaseBillings.push({
					id: Number(b.id),
					type: b.type,
					utility_type: b.utility_type,
					amount: parseFloat(b.amount) || 0,
					paid_amount: paidAmt,
					balance: bal,
					status: b.status,
					due_date: b.due_date,
					billing_date: b.billing_date,
					penalty_amount: parseFloat(b.penalty_amount) || 0,
					notes: b.notes,
					allocations
				});
			}

			const leaseName = lease.name || `Lease #${lease.id}`;
			const floorNum = floor?.floor_number || '';
			const unitNum = unit?.rental_unit_number || '';
			const propName = property?.name || '';

			// Precompute search text + sort keys once (avoids per-keystroke recomputation)
			const _searchText = `${leaseName} ${tenantNameParts.join(' ')} ${floorNum} ${unitNum} ${propName}`.toLowerCase();
			const _sortName = leaseName.toLowerCase();
			const _startMs = new Date(lease.start_date).getTime();
			const _updatedMs = lease.updated_at ? new Date(lease.updated_at).getTime() : _startMs;
			const _floorNum = parseInt(floorNum) || 0;
			const _unitNum = unitNum;

			return {
				id: Number(lease.id),
				rental_unit_id: lease.rental_unit_id,
				name: leaseName,
				start_date: lease.start_date,
				end_date: lease.end_date,
				rent_amount: parseFloat(lease.rent_amount) || 0,
				security_deposit: parseFloat(lease.security_deposit) || 0,
				notes: lease.notes,
				terms_month: lease.terms_month,
				status: lease.status,
				created_at: lease.created_at,
				updated_at: lease.updated_at,
				rental_unit: unit ? {
					...unit,
					id: Number(unit.id),
					floor,
					property
				} : null,
				lease_tenants,
				billings: leaseBillings,
				totalPaid,
				balance: totalBalance,
				// Precomputed keys for fast search & sort (no allocation in hot paths)
				_searchText,
				_sortName,
				_startMs,
				_updatedMs,
				_floorNum,
				_unitNum,
			} as any;
		});
	});

	let tenants = $derived([...tenantsStore.value].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((t: any) => ({
		id: Number(t.id),
		name: t.name,
		email: t.email,
		contact_number: t.contact_number,
		profile_picture_url: t.profile_picture_url
	})));

	let rentalUnits = $derived.by(() => {
		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);
		return rentalUnitsStore.value.map((u: any) => {
			const property = propMap.get(String(u.property_id));
			return {
				...u,
				id: Number(u.id),
				property: property ? { id: Number(property.id), name: property.name } : null
			};
		});
	});

	let isLoading = $derived(!leasesStore.initialized);

	let showModal = $state(false);
	let selectedLease: FormType | undefined = $state();
	let editMode = $state(false);

	// Add activeFilter state for summary card filtering
	let activeFilter = $state<'all' | 'paid' | 'pending' | 'partial' | 'overdue'>('all');

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let leaseToDelete = $state<any>(null);

	// #7: Batch payment mode
	let batchMode = $state(false);
	let selectedLeaseIds = $state<Set<number>>(new Set());
	let showBatchModal = $state(false);

	function handleBatchToggle(id: number) {
		const next = new Set(selectedLeaseIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			if (next.size >= 50) {
				toast.error('Maximum 50 leases per batch');
				return;
			}
			next.add(id);
		}
		selectedLeaseIds = next;
	}

	// P0-1: Select all visible (filtered) leases with unpaid billings
	function handleSelectAllVisible() {
		const unpaidLeases = filteredLeases.filter((l: any) =>
			l.billings?.some((b: any) => b.status !== 'PAID')
		);
		if (selectedLeaseIds.size === unpaidLeases.length) {
			// Deselect all
			selectedLeaseIds = new Set();
		} else {
			selectedLeaseIds = new Set(unpaidLeases.slice(0, 50).map((l: any) => l.id));
		}
	}

	// Single-pass: enrich with status + compute summary metrics together
	let leasesAndMetrics = $derived.by(() => {
		let paidInFull = 0;
		let pendingCount = 0;
		let partialCount = 0;
		let overdueCount = 0;
		let totalPending = 0;
		let totalPartial = 0;
		let totalOverdue = 0;
		let totalBalance = 0;

		const enriched = leases.map((lease) => {
			const balanceStatus = calculateLeaseBalanceStatus(lease);

			// Accumulate metrics in the same pass
			totalBalance += lease.balance || 0;
			if (balanceStatus.hasOverdue) {
				overdueCount++;
				totalOverdue += balanceStatus.overdueBalance;
			}
			if (balanceStatus.hasPartial) {
				partialCount++;
				totalPartial += balanceStatus.partialBalance;
			}
			if (balanceStatus.hasPending) {
				pendingCount++;
				totalPending += balanceStatus.pendingBalance;
			}
			if (!balanceStatus.hasOverdue && !balanceStatus.hasPending && !balanceStatus.hasPartial) {
				paidInFull++;
			}

			return { ...lease, balanceStatus };
		});

		return {
			leasesWithStatus: enriched,
			summaryMetrics: {
				totalLeases: enriched.length,
				paidInFull,
				pendingCount,
				partialCount,
				overdueCount,
				totalPending,
				totalPartial,
				totalOverdue,
				totalBalance
			}
		};
	});

	let leasesWithStatus = $derived(leasesAndMetrics.leasesWithStatus);
	let summaryMetrics = $derived(leasesAndMetrics.summaryMetrics);

	// Filter leases based on activeFilter
	let filteredLeases = $derived.by(() => {
		if (activeFilter === 'all') return leasesWithStatus;

		return leasesWithStatus.filter((lease) => {
			const s = lease.balanceStatus;
			if (!s) return false;
			switch (activeFilter) {
				case 'paid': return !s.hasOverdue && !s.hasPending && !s.hasPartial;
				case 'pending': return s.hasPending;
				case 'partial': return s.hasPartial;
				case 'overdue': return s.hasOverdue;
				default: return true;
			}
		});
	});

	// #7: Batch derived (must be after filteredLeases)
	let selectableCount = $derived(
		filteredLeases.filter((l: any) => l.billings?.some((b: any) => b.status !== 'PAID')).length
	);
	let batchLeases = $derived(
		filteredLeases.filter((l: any) => selectedLeaseIds.has(l.id))
	);

	let batchTotal = $derived(
		batchLeases.reduce((sum: number, l: any) => {
			return (
				sum +
				(l.billings?.reduce((s: number, b: any) => {
					if (b.status === 'PAID') return s;
					return s + (b.amount + (b.penalty_amount || 0) - (b.paid_amount || 0));
				}, 0) || 0)
			);
		}, 0)
	);

	// Resync relevant collections after server actions
	async function refreshData() {
		const collections = ['leases', 'lease_tenants', 'billings', 'payments', 'payment_allocations'];
		syncStatus.addLog('Leases: resyncing after server action...', 'info');
		try {
			await Promise.all(collections.map((c) => resyncCollection(c)));
			syncStatus.addLog('Leases: all collections resynced ✓', 'success');
		} catch (err) {
			console.warn('[Leases] refreshData resync failed:', err);
			syncStatus.addLog(`Leases: resync failed — ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function handleAddLease() {
		selectedLease = undefined;
		editMode = false;
		showModal = true;
	}

	function handleEdit(lease: FormType) {
		selectedLease = lease;
		editMode = true;
		showModal = true;
	}

	function handleFilterClick(filter: 'all' | 'paid' | 'pending' | 'partial' | 'overdue') {
		activeFilter = filter;
	}

	function handlePrintAllLeases() {
		// Use the filtered leases that are currently displayed
		printAllLeases(filteredLeases);
	}

	function handleDeleteLease(
		lease: FormType & {
			billings?: { paid_amount: number }[];
			balance?: number;
			name?: string;
			id?: number;
		}
	) {
		leaseToDelete = lease;
		showDeleteDialog = true;
	}

	async function confirmDeleteLease() {
		if (!leaseToDelete) return;
		const lease = leaseToDelete;

		// Close confirmation dialog immediately
		showDeleteDialog = false;
		leaseToDelete = null;

		await bufferedMutation({
			label: `Delete lease "${lease.name}"`,
			collection: 'leases',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteLease(lease.id);
			},
			serverAction: async () => {
				const formData = new FormData();
				formData.append('id', String(lease.id));
				formData.append('reason', 'User initiated deletion');
				const result = await fetch('?/delete', {
					method: 'POST',
					body: formData
				});
				if (!result.ok) {
					const response = await result.json().catch(() => ({}));
					throw new Error(response.error || response.message || 'Failed to delete lease');
				}
				return result;
			},
			onSuccess: async () => {
				toast.success(
					`Lease "${lease.name}" has been successfully archived. Payment history has been preserved.`
				);
			}
		});
	}

	function handleModalClose() {
		showModal = false;
		selectedLease = undefined;
		editMode = false;
	}

	function handleStatusChange(id: string, status: string) {
		// RxDB store will auto-update after resync; this is a no-op now
	}
</script>

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
	<div class="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
		<SyncErrorBanner collections={['leases', 'tenants', 'lease_tenants', 'billings', 'payments', 'payment_allocations', 'rental_units']} />
	</div>
	<!-- Header Section with Integrated Stats -->
	<div class="sm:sticky sm:top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
		<div class="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 sm:py-3">
			<!-- Title and Action Buttons -->
			<div class="flex items-center justify-between mb-1 sm:mb-2">
				<h1 class="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
					Leases Dashboard
				</h1>
				<div class="flex items-center gap-1 sm:gap-2">
					<Button
						onclick={() => {
							batchMode = !batchMode;
							if (!batchMode) selectedLeaseIds = new Set();
						}}
						variant={batchMode ? 'default' : 'outline'}
						class="flex items-center justify-center gap-1 sm:gap-2 h-9 sm:h-9 min-h-[44px] px-2 sm:px-3 py-1 text-xs sm:text-sm {batchMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300'} shadow-sm"
						disabled={isLoading || filteredLeases.length === 0}
					>
						<CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">{batchMode ? 'Cancel Batch' : 'Pay Multiple'}</span>
					</Button>
					<Button
						onclick={handlePrintAllLeases}
						variant="outline"
						class="flex items-center justify-center gap-1 sm:gap-2 h-9 sm:h-9 min-h-[44px] px-2 sm:px-3 py-1 text-xs sm:text-sm border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
						disabled={isLoading || filteredLeases.length === 0}
					>
						<Printer class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">Print All</span>
					</Button>
					<Button
						onclick={handleAddLease}
						class="flex items-center justify-center gap-1 sm:gap-2 h-9 sm:h-9 min-h-[44px] px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
					>
						<Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">Add Lease</span>
					</Button>
				</div>
			</div>
			<!-- Responsive Summary Cards -->
			<div class="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-2 -mx-1 sm:mx-0 scrollbar-hide">
				<!-- All Leases Card -->
				<button
				onclick={() => (activeFilter = 'all')}
				aria-pressed={activeFilter === 'all'}
				class="flex-shrink-0 w-[72px] sm:w-28 min-w-[72px] sm:min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-1.5 sm:p-2 text-left transition-all duration-200 hover:shadow hover:border-blue-200 cursor-pointer {activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-sm sm:text-xl font-bold text-slate-800">{summaryMetrics.totalLeases}</div>
						<div class="flex items-center gap-1 text-slate-600 text-xs font-medium truncate">
							<CircleDollarSign class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Total</span>
						</div>
					{/if}
				</button>

				<!-- Paid in Full Card -->
				<button
					onclick={() => (activeFilter = 'paid')}
				aria-pressed={activeFilter === 'paid'}
					class="flex-shrink-0 w-[72px] sm:w-28 min-w-[72px] sm:min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-1.5 sm:p-2 text-left transition-all duration-200 hover:shadow hover:border-green-200 cursor-pointer {activeFilter === 'paid' ? 'ring-2 ring-green-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-sm sm:text-xl font-bold text-green-600">{summaryMetrics.paidInFull}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-green-600 truncate">
							<Check class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Paid</span>
						</div>
					{/if}
				</button>

				<!-- Pending Card -->
				<button
					onclick={() => (activeFilter = 'pending')}
				aria-pressed={activeFilter === 'pending'}
					class="flex-shrink-0 w-[72px] sm:w-28 min-w-[72px] sm:min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-1.5 sm:p-2 text-left transition-all duration-200 hover:shadow hover:border-yellow-200 cursor-pointer {activeFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-sm sm:text-xl font-bold text-yellow-600">{summaryMetrics.pendingCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-yellow-600 truncate">
							<Clock class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Pending</span>
						</div>
						<span class="text-yellow-600 text-xs leading-tight font-medium block">
							<span class="sm:hidden">{formatCompactCurrency(summaryMetrics.totalPending)}</span>
							<span class="hidden sm:inline">{formatCurrency(summaryMetrics.totalPending)}</span>
						</span>
					{/if}
				</button>

				<!-- Partial Card -->
				<button
					onclick={() => (activeFilter = 'partial')}
				aria-pressed={activeFilter === 'partial'}
					class="flex-shrink-0 w-[72px] sm:w-28 min-w-[72px] sm:min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-1.5 sm:p-2 text-left transition-all duration-200 hover:shadow hover:border-amber-200 cursor-pointer {activeFilter === 'partial' ? 'ring-2 ring-amber-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-sm sm:text-xl font-bold text-amber-600">{summaryMetrics.partialCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-amber-600 truncate">
							<CircleDot class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Partial</span>
						</div>
						{#if summaryMetrics.totalPartial > 0}
						<span class="text-amber-600 text-xs leading-tight font-medium block">
							<span class="sm:hidden">{formatCompactCurrency(summaryMetrics.totalPartial)}</span>
							<span class="hidden sm:inline">{formatCurrency(summaryMetrics.totalPartial)}</span>
						</span>
					{/if}
					{/if}
				</button>

				<!-- Overdue Card -->
				<button
					onclick={() => (activeFilter = 'overdue')}
				aria-pressed={activeFilter === 'overdue'}
					class="flex-shrink-0 w-[72px] sm:w-28 min-w-[72px] sm:min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-1.5 sm:p-2 text-left transition-all duration-200 hover:shadow hover:border-red-200 cursor-pointer {activeFilter === 'overdue' ? 'ring-2 ring-red-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-sm sm:text-xl font-bold text-red-600">{summaryMetrics.overdueCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-red-600 truncate">
							<AlertTriangle class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Overdue</span>
						</div>
						{#if summaryMetrics.totalOverdue > 0}
						<span class="text-red-600 text-xs leading-tight font-medium block">
							<span class="sm:hidden">{formatCompactCurrency(summaryMetrics.totalOverdue)}</span>
							<span class="hidden sm:inline">{formatCurrency(summaryMetrics.totalOverdue)}</span>
						</span>
					{/if}
					{/if}
				</button>
			</div>


		</div>
	</div>

	<!-- Main Content Area -->
	<div class="max-w-7xl mx-auto  sm:px-2  ">
		<!-- Batch mode hint banner + Select All -->
		{#if batchMode}
			<div class="mx-3 sm:mx-0 mb-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<CreditCard class="w-4 h-4 flex-shrink-0" />
					{#if selectedLeaseIds.size === 0}
						<span>Tap leases to select, or use Select All.</span>
					{:else}
						<span><strong>{selectedLeaseIds.size}</strong> of {selectableCount} selected</span>
					{/if}
				</div>
				<button
					type="button"
					class="text-xs font-medium text-green-700 hover:text-green-900 hover:underline flex-shrink-0"
					onclick={handleSelectAllVisible}
				>
					{selectedLeaseIds.size === selectableCount ? 'Deselect All' : `Select All (${selectableCount})`}
				</button>
			</div>
		{/if}
		<!-- Active Filter Display -->
		{#if activeFilter !== 'all'}
			<div class="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="text-xs sm:text-sm font-medium text-slate-500 truncate">All</div>
						<span
							class="px-2 py-1 rounded-md text-sm font-medium {activeFilter === 'paid'
								? 'bg-green-100 text-green-700'
								: activeFilter === 'pending'
									? 'bg-orange-100 text-orange-700'
									: activeFilter === 'partial'
										? 'bg-amber-100 text-amber-700'
										: activeFilter === 'overdue'
											? 'bg-red-100 text-red-700'
											: 'bg-blue-100 text-blue-700'}"
						>
							{activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Leases
						</span>
						<span class="text-sm text-slate-500"
							>({filteredLeases.length} of {leasesWithStatus.length})</span
						>
					</div>
					<button
						onclick={() => handleFilterClick('all')}
						class="text-sm text-slate-600 hover:text-slate-800 underline"
					>
						Show All
					</button>
				</div>
			</div>
		{/if}

		<!-- Lease List Section -->
		<div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm {batchMode && selectedLeaseIds.size > 0 ? 'pb-20' : ''}">
			{#if isLoading}
				<!-- Skeleton Loading State -->
				<div class="p-6">
					<div class="space-y-6">
						<!-- Skeleton cards that match lease structure -->
						{#each Array(5) as _, i (i)}
							<div class="border border-slate-200 rounded-lg p-6">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4 flex-1">
										<div class="space-y-2">
											<Skeleton class="h-5 w-48" />
											<Skeleton class="h-4 w-32" />
										</div>
										<div class="flex-1 ml-8">
											<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
												<div class="space-y-1">
													<Skeleton class="h-3 w-16" />
													<Skeleton class="h-4 w-24" />
												</div>
												<div class="space-y-1">
													<Skeleton class="h-3 w-16" />
													<Skeleton class="h-4 w-20" />
												</div>
												<div class="space-y-1">
													<Skeleton class="h-3 w-16" />
													<Skeleton class="h-4 w-28" />
												</div>
												<div class="space-y-1">
													<Skeleton class="h-3 w-16" />
													<Skeleton class="h-4 w-16" />
												</div>
											</div>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Skeleton class="h-6 w-16" />
										<Skeleton class="h-8 w-8" />
										<Skeleton class="h-8 w-8" />
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if leasesWithStatus.length === 0}
				<div class="p-6">
					<EmptyState icon={FileText} title="No Leases Found" description="Get started by creating your first lease agreement.">
						{#snippet action()}
							<Button onclick={handleAddLease} class="bg-blue-600 hover:bg-blue-700 text-white">
								<Plus class="w-4 h-4 mr-2" />
								Create Lease
							</Button>
						{/snippet}
					</EmptyState>
				</div>
			{:else}
				<LeaseList
					leases={filteredLeases}
					{tenants}
					{rentalUnits}
					{tenantNameMap}
					on:edit={(event) => handleEdit(event.detail)}
					on:delete={(event) => handleDeleteLease(event.detail)}
					onStatusChange={handleStatusChange}
					onDataChange={refreshData}
					{batchMode}
					{selectedLeaseIds}
					onBatchToggle={handleBatchToggle}
				/>
			{/if}
		</div>
	</div>
</div>

<!-- Modal for Create/Edit -->
<LeaseFormModal
	open={showModal}
	lease={selectedLease}
	{editMode}
	{tenants}
	{rentalUnits}
	onOpenChange={handleModalClose}
	onDataChange={refreshData}
/>

<!-- #7: Batch payment sticky bar -->
{#if batchMode && selectedLeaseIds.size > 0}
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-area-bottom">
		<div class="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
			<div class="text-sm">
				<span class="font-semibold">{selectedLeaseIds.size}</span> lease{selectedLeaseIds.size !== 1 ? 's' : ''}
				<span class="text-muted-foreground mx-1">&mdash;</span>
				<span class="font-semibold tabular-nums">{formatCurrency(batchTotal)}</span>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					onclick={() => { selectedLeaseIds = new Set(); }}
					class="h-9 px-3 text-sm min-h-[44px] sm:min-h-0"
				>
					Clear
				</Button>
				<Button
					onclick={() => { showBatchModal = true; }}
					class="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-sm font-medium min-h-[44px] sm:min-h-0"
				>
					<CreditCard class="w-4 h-4 mr-2" />
					Pay Selected
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- #7: Batch Payment Modal -->
{#if showBatchModal}
	<BatchPaymentModal
		leases={batchLeases}
		isOpen={showBatchModal}
		onOpenChange={(open) => {
			showBatchModal = open;
			if (!open) {
				batchMode = false;
				selectedLeaseIds = new Set();
			}
		}}
		onDataChange={refreshData}
	/>
{/if}

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Archive Lease</AlertDialog.Title>
			<AlertDialog.Description>
				{#if leaseToDelete}
					Are you sure you want to archive lease "{leaseToDelete.name}"?

					{#if leaseToDelete.billings?.some((b: { paid_amount: number }) => b.paid_amount > 0)}
						Warning: This lease has payment history that will be preserved for audit purposes.
					{/if}

					{#if (leaseToDelete.balance || 0) > 0}
						Outstanding Balance: {formatCurrency(leaseToDelete.balance)}
					{/if}

					This will archive the lease (soft delete), preserve all payment and billing history, maintain audit compliance, and remove from active lease list. The lease will be removed from the active list but all data is preserved.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; leaseToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteLease}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
