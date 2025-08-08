<script lang="ts">
	import { invalidateAll, invalidate } from '$app/navigation';
	import LeaseFormModal from './LeaseFormModal.svelte';
	import LeaseList from './LeaseList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, Printer } from 'lucide-svelte';
	import type { z } from 'zod';
	import { leaseSchema } from './formSchema';
	import { calculateLeaseBalanceStatus } from '$lib/utils/lease-status';
	import { formatCurrency } from '$lib/utils/format';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onMount } from 'svelte';
	import { printAllLeases } from '$lib/utils/print';

	type FormType = z.infer<typeof leaseSchema>;

	let { data } = $props();
	let leases = $state<any[]>(data.leases);
	let tenants = $state(data.tenants);
	let rentalUnits = $state(data.rental_units);
	let showModal = $state(false);
	let selectedLease: FormType | undefined = $state();
	let editMode = $state(false);
	let isLoading = $state(data.lazy === true);

	// Add activeFilter state for summary card filtering
	let activeFilter = $state<'all' | 'paid' | 'pending' | 'partial' | 'overdue'>('all');

	// Function to load data from promises
	async function loadDataFromPromises() {
		if (data.leasesPromise && data.tenantsPromise && data.rentalUnitsPromise) {
			try {
				const [loadedLeases, loadedTenants, loadedRentalUnits] = await Promise.all([
					data.leasesPromise,
					data.tenantsPromise,
					data.rentalUnitsPromise
				]);

				leases = loadedLeases;
				tenants = loadedTenants;
				rentalUnits = loadedRentalUnits;
				isLoading = false;
			} catch (error) {
				console.error('Error loading lease data:', error);
				isLoading = false;
			}
		}
	}

	// Function to refresh data after server actions
	async function refreshData() {
		isLoading = true;
		try {
			// Invalidate all dependencies to get fresh data
			await invalidateAll();
			
			// After invalidation, the data object should have new promises
			// We need to wait for the next tick to ensure data is updated
			await new Promise(resolve => setTimeout(resolve, 0));
			
			// Reload data from new promises
			await loadDataFromPromises();
		} catch (error) {
			console.error('Error refreshing data:', error);
			isLoading = false;
		}
	}

	// Load data lazily on mount
	onMount(async () => {
		if (data.lazy) {
			await loadDataFromPromises();
		}
	});

	$effect(() => {
		if (!data.lazy) {
			leases = data.leases;
			tenants = data.tenants;
			rentalUnits = data.rental_units;
		}
	});

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

	async function handleDeleteLease(
		lease: FormType & {
			billings?: { paid_amount: number }[];
			balance?: number;
			name?: string;
			id?: number;
		}
	) {
		// Enhanced confirmation dialog with detailed warning
		const hasPayments = lease.billings?.some((b: { paid_amount: number }) => b.paid_amount > 0);
		const totalBalance = lease.balance || 0;

		let confirmMessage = `Are you sure you want to archive lease "${lease.name}"?\n\n`;
		if (hasPayments) {
			confirmMessage += `⚠️  WARNING: This lease has payment history that will be preserved for audit purposes.\n\n`;
		}

		if (totalBalance > 0) {
			confirmMessage += `💰 Outstanding Balance: ₱${totalBalance.toLocaleString()}\n`;
		}

		confirmMessage += `\nThis action will:\n`;
		confirmMessage += `• Archive the lease (soft delete)\n`;
		confirmMessage += `• Preserve all payment and billing history\n`;
		confirmMessage += `• Maintain audit compliance\n`;
		confirmMessage += `• Remove from active lease list\n\n`;
		confirmMessage += `This action cannot be undone. Continue?`;

		if (!confirm(confirmMessage)) return;

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
				// Refresh data to get latest state from server
				await refreshData();
				// Show success message
				alert(
					`Lease "${lease.name}" has been successfully archived. Payment history has been preserved.`
				);
			} else {
				console.error('Delete failed:', response);
				alert(response.error || response.message || 'Failed to delete lease');
			}
		} catch (error) {
			console.error('Error deleting lease:', error);
			alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function handleModalClose() {
		showModal = false;
		selectedLease = undefined;
		editMode = false;
	}

	function handleStatusChange(id: string, status: string) {
		leases = leases.map((lease) => (lease.id === id ? { ...lease, status } : lease));
	}
</script>

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
	<!-- Header Section with Integrated Stats -->
	<div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
			<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div class="flex items-center gap-4">
					<div>
						<h1
							class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
						>
							Leases Dashboard
						</h1>
						<p class="text-slate-600 text-sm mt-1">Manage rental agreements and track payments</p>
					</div>
				</div>

				<!-- Enhanced Stats Overview - Now Clickable -->
				<div class="flex items-center gap-3 text-xs sm:text-sm">
					<button
						onclick={() => handleFilterClick('all')}
						class="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {activeFilter ===
						'all'
							? 'bg-blue-100 ring-2 ring-blue-500'
							: 'bg-blue-50 hover:bg-blue-100'}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-blue-600 font-medium">{summaryMetrics.totalLeases}</span>
						{/if}
						<span class="text-slate-600">Total</span>
					</button>

					<button
						onclick={() => handleFilterClick('paid')}
						class="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 {activeFilter ===
						'paid'
							? 'bg-green-100 ring-2 ring-green-500'
							: 'bg-green-50 hover:bg-green-100'}"
					>
						{#if isLoading}
							<Skeleton class="h-4 w-6" />
						{:else}
							<span class="text-green-600 font-medium">{summaryMetrics.paidInFull}</span>
						{/if}
						<span class="text-slate-600">Paid</span>
					</button>

					<button
						onclick={() => handleFilterClick('pending')}
						class="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 {activeFilter ===
						'pending'
							? 'bg-orange-100 ring-2 ring-orange-500'
							: 'bg-orange-50 hover:bg-orange-100'}"
					>
						{#if isLoading}
							<div class="flex flex-col space-y-1">
								<Skeleton class="h-4 w-6" />
								<Skeleton class="h-3 w-12" />
							</div>
						{:else}
							<div class="flex flex-col">
								<span class="text-orange-600 font-medium">{summaryMetrics.pendingCount}</span>
								<span class="text-orange-600 text-xs"
									>{formatCurrency(summaryMetrics.totalPending)}</span
								>
							</div>
						{/if}
						<span class="text-slate-600">Pending</span>
					</button>

					<button
						onclick={() => handleFilterClick('partial')}
						class="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 {activeFilter ===
						'partial'
							? 'bg-amber-100 ring-2 ring-amber-500'
							: 'bg-amber-50 hover:bg-amber-100'}"
					>
						{#if isLoading}
							<div class="flex flex-col space-y-1">
								<Skeleton class="h-4 w-6" />
								<Skeleton class="h-3 w-12" />
							</div>
						{:else}
							<div class="flex flex-col">
								<span class="text-amber-600 font-medium">{summaryMetrics.partialCount}</span>
								<span class="text-amber-600 text-xs"
									>{formatCurrency(summaryMetrics.totalPartial)}</span
								>
							</div>
						{/if}
						<span class="text-slate-600">Partial</span>
					</button>

					<button
						onclick={() => handleFilterClick('overdue')}
						class="flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 {activeFilter ===
						'overdue'
							? 'bg-red-100 ring-2 ring-red-500'
							: 'bg-red-50 hover:bg-red-100'}"
					>
						{#if isLoading}
							<div class="flex flex-col space-y-1">
								<Skeleton class="h-4 w-6" />
								<Skeleton class="h-3 w-12" />
							</div>
						{:else}
							<div class="flex flex-col">
								<span class="text-red-600 font-medium">{summaryMetrics.overdueCount}</span>
								<span class="text-red-600 text-xs"
									>{formatCurrency(summaryMetrics.totalOverdue)}</span
								>
							</div>
						{/if}
						<span class="text-slate-600">Overdue</span>
					</button>
				</div>

				<div class="flex items-center gap-2">
					<Button
						onclick={handlePrintAllLeases}
						variant="outline"
						class="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200"
						disabled={isLoading || filteredLeases.length === 0}
					>
						<Printer class="w-4 h-4" />
						Print All
					</Button>
					<Button
						onclick={handleAddLease}
						class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
					>
						<Plus class="w-4 h-4" />
						Add Lease
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<!-- Active Filter Display -->
		{#if activeFilter !== 'all'}
			<div class="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium text-slate-600">Showing:</span>
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
