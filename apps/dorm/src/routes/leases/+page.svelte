<script lang="ts">
	import LeaseFormModal from './LeaseFormModal.svelte';
	import LeaseList from './LeaseList.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Plus, Printer, Check, Clock, AlertTriangle, CircleDollarSign } from 'lucide-svelte';
	import type { z } from 'zod/v3';
	import { leaseSchema } from './formSchema';
	import { calculateLeaseBalanceStatus } from '$lib/utils/lease-status';
	import { formatCurrency } from '$lib/utils/format';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { printAllLeases } from '$lib/utils/print';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { resyncCollection } from '$lib/db/replication';
	import { optimisticDeleteLease } from '$lib/db/optimistic-leases';

	type FormType = z.infer<typeof leaseSchema>;

	let { data } = $props();

	// ─── RxDB reactive stores ───────────────────────────────────────────
	const leasesStore = createRxStore<any>('leases',
		(db) => db.leases.find({ selector: { deleted_at: { $eq: null } }, sort: [{ updated_at: 'desc' }] })
	);
	const tenantsStore = createRxStore<any>('tenants',
		(db) => db.tenants.find({ selector: { deleted_at: { $eq: null } }, sort: [{ name: 'asc' }] })
	);
	const rentalUnitsStore = createRxStore<any>('rental_units',
		(db) => db.rental_units.find()
	);
	const floorsStore = createRxStore<any>('floors',
		(db) => db.floors.find()
	);
	const propertiesStore = createRxStore<any>('properties',
		(db) => db.properties.find()
	);
	const leaseTenantsStore = createRxStore<any>('lease_tenants',
		(db) => db.lease_tenants.find()
	);
	const billingsStore = createRxStore<any>('billings',
		(db) => db.billings.find()
	);
	const paymentsStore = createRxStore<any>('payments',
		(db) => db.payments.find()
	);
	const paymentAllocationsStore = createRxStore<any>('payment_allocations',
		(db) => db.payment_allocations.find()
	);

	// ─── Derived data from RxDB stores ──────────────────────────────────
	let leases = $derived.by(() => {
		return leasesStore.value.map((lease: any) => {
			const unit = rentalUnitsStore.value.find((u: any) => String(u.id) === String(lease.rental_unit_id));
			const floor = unit ? floorsStore.value.find((f: any) => String(f.id) === String(unit.floor_id)) : null;
			const property = unit ? propertiesStore.value.find((p: any) => String(p.id) === String(unit.property_id)) : null;

			// Lease tenants
			const ltDocs = leaseTenantsStore.value.filter((lt: any) => String(lt.lease_id) === String(lease.id));
			const lease_tenants = ltDocs.map((lt: any) => {
				const tenant = tenantsStore.value.find((t: any) => String(t.id) === String(lt.tenant_id));
				return tenant ? {
					tenant: {
						name: tenant.name,
						email: tenant.email,
						contact_number: tenant.contact_number,
						profile_picture_url: tenant.profile_picture_url
					}
				} : null;
			}).filter(Boolean);

			// Billings for this lease
			const leaseBillings = billingsStore.value
				.filter((b: any) => String(b.lease_id) === String(lease.id))
				.map((b: any) => ({
					id: Number(b.id),
					type: b.type,
					utility_type: b.utility_type,
					amount: parseFloat(b.amount) || 0,
					paid_amount: parseFloat(b.paid_amount) || 0,
					balance: parseFloat(b.balance) || 0,
					status: b.status,
					due_date: b.due_date,
					billing_date: b.billing_date,
					penalty_amount: parseFloat(b.penalty_amount) || 0,
					notes: b.notes
				}));

			// Calculate totals
			const totalPaid = leaseBillings.reduce((sum: number, b: any) => sum + b.paid_amount, 0);
			const totalBalance = leaseBillings.reduce((sum: number, b: any) => sum + b.balance, 0);

			return {
				id: Number(lease.id),
				rental_unit_id: lease.rental_unit_id,
				name: lease.name,
				start_date: lease.start_date,
				end_date: lease.end_date,
				rent_amount: parseFloat(lease.rent_amount) || 0,
				security_deposit: parseFloat(lease.security_deposit) || 0,
				notes: lease.notes,
				terms_month: lease.terms_month,
				status: lease.status,
				created_at: lease.created_at,
				rental_unit: unit ? {
					...unit,
					id: Number(unit.id),
					floor: floor || null,
					property: property || null
				} : null,
				lease_tenants,
				billings: leaseBillings,
				totalPaid,
				balance: totalBalance
			} as any;
		});
	});

	let tenants = $derived(tenantsStore.value.map((t: any) => ({
		id: Number(t.id),
		name: t.name,
		email: t.email,
		contact_number: t.contact_number,
		profile_picture_url: t.profile_picture_url
	})));

	let rentalUnits = $derived(rentalUnitsStore.value.map((u: any) => {
		const property = propertiesStore.value.find((p: any) => String(p.id) === String(u.property_id));
		return {
			...u,
			id: Number(u.id),
			property: property ? { id: Number(property.id), name: property.name } : null
		};
	}));

	let isLoading = $derived(!leasesStore.initialized);

	let showModal = $state(false);
	let selectedLease: FormType | undefined = $state();
	let editMode = $state(false);

	// Add activeFilter state for summary card filtering
	let activeFilter = $state<'all' | 'paid' | 'pending' | 'partial' | 'overdue'>('all');

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let leaseToDelete = $state<any>(null);

	// Svelte 5 runes for reactive calculations
	let leasesWithStatus = $derived.by(() =>
		leases.map((lease) => ({
			...lease,
			balanceStatus: calculateLeaseBalanceStatus(lease)
		}))
	);

	// Calculate summary metrics using $derived
	let summaryMetrics = $derived.by(() => ({
		totalLeases: leasesWithStatus.length,
		paidInFull: leasesWithStatus.filter(
			(l) =>
				!l.balanceStatus.hasOverdue && !l.balanceStatus.hasPending && !l.balanceStatus.hasPartial
		).length,
		pendingCount: leasesWithStatus.filter((l) => l.balanceStatus.hasPending).length,
		partialCount: leasesWithStatus.filter((l) => l.balanceStatus.hasPartial).length,
		overdueCount: leasesWithStatus.filter((l) => l.balanceStatus.hasOverdue).length,
		totalPending: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.pendingBalance, 0),
		totalPartial: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.partialBalance, 0),
		totalOverdue: leasesWithStatus.reduce((sum, l) => sum + l.balanceStatus.overdueBalance, 0),
		totalBalance: leasesWithStatus.reduce((sum, l) => sum + (l.balance || 0), 0)
	}));

	// Filter leases based on activeFilter
	let filteredLeases = $derived.by(() => {
		if (activeFilter === 'all') {
			return leasesWithStatus;
		}

		return leasesWithStatus.filter((lease) => {
			if (!lease.balanceStatus) return false;

			switch (activeFilter) {
				case 'paid':
					return (
						!lease.balanceStatus.hasOverdue &&
						!lease.balanceStatus.hasPending &&
						!lease.balanceStatus.hasPartial
					);
				case 'pending':
					return lease.balanceStatus.hasPending;
				case 'partial':
					return lease.balanceStatus.hasPartial;
				case 'overdue':
					return lease.balanceStatus.hasOverdue;
				default:
					return true;
			}
		});
	});

	// Resync relevant collections after server actions
	async function refreshData() {
		await Promise.all([
			resyncCollection('leases'),
			resyncCollection('lease_tenants'),
			resyncCollection('billings'),
			resyncCollection('payments'),
			resyncCollection('payment_allocations')
		]).catch((err) => console.warn('[Leases] refreshData resync failed:', err));
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
		showDeleteDialog = false;
		leaseToDelete = null;

		// Optimistic: remove from UI immediately
		await optimisticDeleteLease(lease.id);

		const formData = new FormData();
		formData.append('id', String(lease.id));
		formData.append('reason', 'User initiated deletion');

		try {
			const result = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});
			const response = await result.json();

			if (result.ok) {
				toast.success(
					`Lease "${lease.name}" has been successfully archived. Payment history has been preserved.`
				);
			} else {
				console.error('Delete failed:', response);
				toast.error(response.error || response.message || 'Failed to delete lease');
				// Resync to restore the original state
				resyncCollection('leases');
			}
		} catch (error) {
			console.error('Error deleting lease:', error);
			toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			// Resync to restore the original state on network error
			resyncCollection('leases');
		}
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
	<!-- Header Section with Integrated Stats -->
	<div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
		<div class="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
			<!-- Title and Action Buttons -->
			<div class="flex items-center justify-between mb-2">
				<h1 class="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
					Leases Dashboard
				</h1>
				<div class="flex items-center gap-1 sm:gap-2">
					<Button
						onclick={handlePrintAllLeases}
						variant="outline"
						class="flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 py-1 text-xs sm:text-sm border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
						disabled={isLoading || filteredLeases.length === 0}
					>
						<Printer class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">Print All</span>
					</Button>
					<Button
						onclick={handleAddLease}
						class="flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
					>
						<Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">Add Lease</span>
					</Button>
				</div>
			</div>
			<!-- Responsive Summary Cards -->
			<div class="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 sm:mx-0 scrollbar-hide">
				<!-- All Leases Card -->
				<button
				onclick={() => (activeFilter = 'all')}
				aria-pressed={activeFilter === 'all'}
				class="flex-shrink-0 w-24 sm:w-28 min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-2 text-left transition-all duration-200 hover:shadow hover:border-blue-200 cursor-pointer {activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-base sm:text-xl font-bold text-slate-800">{summaryMetrics.totalLeases}</div>
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
					class="flex-shrink-0 w-24 sm:w-28 min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-2 text-left transition-all duration-200 hover:shadow hover:border-green-200 cursor-pointer {activeFilter === 'paid' ? 'ring-2 ring-green-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-base sm:text-xl font-bold text-green-600">{summaryMetrics.paidInFull}</div>
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
					class="flex-shrink-0 w-24 sm:w-28 min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-2 text-left transition-all duration-200 hover:shadow hover:border-yellow-200 cursor-pointer {activeFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-base sm:text-xl font-bold text-yellow-600">{summaryMetrics.pendingCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-yellow-600 truncate">
							<Clock class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Pending</span>
						</div>
						<span class="text-yellow-600 text-xs leading-tight font-medium truncate block">{formatCurrency(summaryMetrics.totalPending)}</span>
					{/if}
				</button>

				<!-- Partial Card -->
				<button
					onclick={() => (activeFilter = 'partial')}
				aria-pressed={activeFilter === 'partial'}
					class="flex-shrink-0 w-24 sm:w-28 min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-2 text-left transition-all duration-200 hover:shadow hover:border-amber-200 cursor-pointer {activeFilter === 'partial' ? 'ring-2 ring-amber-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-base sm:text-xl font-bold text-amber-600">{summaryMetrics.partialCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-amber-600 truncate">
							<AlertTriangle class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Partial</span>
						</div>
						<span class="text-amber-600 text-xs leading-tight font-medium truncate block">{formatCurrency(summaryMetrics.totalPartial)}</span>
					{/if}
				</button>

				<!-- Overdue Card -->
				<button
					onclick={() => (activeFilter = 'overdue')}
				aria-pressed={activeFilter === 'overdue'}
					class="flex-shrink-0 w-24 sm:w-28 min-w-[96px] bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 p-2 text-left transition-all duration-200 hover:shadow hover:border-red-200 cursor-pointer {activeFilter === 'overdue' ? 'ring-2 ring-red-500' : ''}"
				>
					{#if isLoading}
						<Skeleton class="h-5 w-8 mb-1" />
						<Skeleton class="h-3 w-12 mb-1" />
						<Skeleton class="h-3 w-10" />
					{:else}
						<div class="text-base sm:text-xl font-bold text-red-600">{summaryMetrics.overdueCount}</div>
						<div class="flex items-center gap-1 text-xs font-medium text-red-600 truncate">
							<AlertTriangle class="w-3 h-3 flex-shrink-0" />
							<span class="truncate">Overdue</span>
						</div>
						<span class="text-red-600 text-xs leading-tight font-medium truncate block">{formatCurrency(summaryMetrics.totalOverdue)}</span>
					{/if}
				</button>
			</div>


		</div>
	</div>

	<!-- Main Content Area -->
	<div class="max-w-7xl mx-auto  sm:px-2  ">
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
		<div class="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
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
			{:else}
				<LeaseList
					leases={filteredLeases}
					{tenants}
					{rentalUnits}
					on:edit={(event) => handleEdit(event.detail)}
					on:delete={(event) => handleDeleteLease(event.detail)}
					onStatusChange={handleStatusChange}
					onDataChange={refreshData}
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

					This will archive the lease (soft delete), preserve all payment and billing history, maintain audit compliance, and remove from active lease list. This action cannot be undone.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; leaseToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteLease}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
