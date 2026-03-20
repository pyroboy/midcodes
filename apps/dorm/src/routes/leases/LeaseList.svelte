<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import LeaseCard from './LeaseCard.svelte';
	import LeaseFilters from './LeaseFilters.svelte';
	import { FileText } from 'lucide-svelte';
	import type { Lease } from '$lib/types/lease';

	interface Props {
		leases?: (Lease & { balanceStatus?: any; _searchText?: string; _sortName?: string; _startMs?: number; _updatedMs?: number; _floorNum?: number; _unitNum?: string })[];
		tenants?: any[];
		rentalUnits?: any[];
		tenantNameMap?: Map<string, any>;
		onStatusChange: (id: string, status: string) => void;
		onDataChange?: () => Promise<void>;
		batchMode?: boolean;
		selectedLeaseIds?: Set<number>;
		onBatchToggle?: (id: number) => void;
	}

	let { leases = [], tenants = [], rentalUnits = [], tenantNameMap = new Map(), onStatusChange, onDataChange, batchMode = false, selectedLeaseIds = new Set(), onBatchToggle }: Props = $props();

	interface FilterState {
		search: string;
		status: string;
		year: string;
		sortBy: string;
	}

	const PAGE_SIZE = 20;
	let currentPage = $state(1);

	let filters = $state<FilterState>({
		search: '',
		status: '',
		year: '',
		sortBy: 'name-az'
	});

	// Single-pass filter + sort using precomputed keys
	let filteredLeases = $derived.by(() => {
		const searchTerm = filters.search ? filters.search.toLowerCase() : '';
		const statusFilter = filters.status;
		const yearFilter = filters.year;
		const sortBy = filters.sortBy;

		// Single-pass filter (combines search + status + year)
		let filtered: typeof leases;
		if (!searchTerm && !statusFilter && !yearFilter) {
			// Fast path: no filtering needed, just clone for sort
			filtered = leases.slice();
		} else {
			filtered = [];
			for (let i = 0; i < leases.length; i++) {
				const lease = leases[i];

				// Search filter — uses precomputed _searchText
				if (searchTerm && !(lease._searchText || '').includes(searchTerm)) continue;

				// Status filter
				if (statusFilter && lease.status !== statusFilter) continue;

				// Year filter — uses precomputed _startMs (avoids new Date() per item)
				if (yearFilter) {
					const year = new Date(lease._startMs || 0).getFullYear().toString();
					if (year !== yearFilter) continue;
				}

				filtered.push(lease);
			}
		}

		// Sort using precomputed keys (no allocation in comparators)
		switch (sortBy) {
			case 'name-az':
				filtered.sort((a, b) => (a._sortName || '').localeCompare(b._sortName || ''));
				break;
			case 'name-za':
				filtered.sort((a, b) => (b._sortName || '').localeCompare(a._sortName || ''));
				break;
			case 'recent-edited':
				filtered.sort((a, b) => (b._updatedMs || 0) - (a._updatedMs || 0));
				break;
			case 'oldest-edited':
				filtered.sort((a, b) => (a._updatedMs || 0) - (b._updatedMs || 0));
				break;
			case 'floor-unit':
				filtered.sort((a, b) => {
					const fd = (a._floorNum || 0) - (b._floorNum || 0);
					return fd !== 0 ? fd : (a._unitNum || '').localeCompare(b._unitNum || '');
				});
				break;
			case 'unit-floor':
				filtered.sort((a, b) => {
					const ud = (a._unitNum || '').localeCompare(b._unitNum || '');
					return ud !== 0 ? ud : (a._floorNum || 0) - (b._floorNum || 0);
				});
				break;
			case 'balance-desc':
				filtered.sort((a, b) => (b.balance || 0) - (a.balance || 0));
				break;
			case 'balance-asc':
				filtered.sort((a, b) => (a.balance || 0) - (b.balance || 0));
				break;
			case 'due-date':
				filtered.sort((a, b) => {
					const aMs = a.balanceStatus?.nextDueDate ? new Date(a.balanceStatus.nextDueDate).getTime() : 2524608000000;
					const bMs = b.balanceStatus?.nextDueDate ? new Date(b.balanceStatus.nextDueDate).getTime() : 2524608000000;
					return aMs - bMs;
				});
				break;
			case 'days-overdue':
				filtered.sort((a, b) => (b.balanceStatus?.daysOverdue || 0) - (a.balanceStatus?.daysOverdue || 0));
				break;
		}

		return filtered;
	});

	// Paginated slice of filtered leases
	let paginatedLeases = $derived(filteredLeases.slice(0, currentPage * PAGE_SIZE));
	let hasMore = $derived(paginatedLeases.length < filteredLeases.length);

	// Reset page when filters change
	$effect(() => {
		// Access filter values to track them
		filters.search; filters.status; filters.year; filters.sortBy;
		currentPage = 1;
	});

	const dispatch = createEventDispatcher<{
		leaseClick: any;
		delete: any;
	}>();

	function handleLeaseClick(lease: any) {
		dispatch('leaseClick', lease);
	}

	function handleDelete(event: Event, lease: any) {
		event.stopPropagation();
		dispatch('delete', lease);
	}

	function handleFiltersChange(newFilters: FilterState) {
		filters = newFilters;
	}
</script>

<LeaseFilters {leases} onFiltersChange={handleFiltersChange} />

<div class="">
	{#if filteredLeases.length === 0}
		<div class="flex flex-col items-center justify-center">
			<div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
				<FileText class="w-12 h-12 text-slate-400" />
			</div>
			<h3 class="text-xl font-semibold text-slate-700 mb-2">
				{leases.length === 0 ? 'No Leases Available' : 'No Leases Match Filters'}
			</h3>
			<p class="text-slate-600 text-center max-w-md">
				{leases.length === 0
					? 'There are currently no leases in the system. Click the "Add Lease" button above to create your first rental agreement.'
					: "Try adjusting your search criteria or filters to find the leases you're looking for."}
			</p>
		</div>
	{:else}
		<div class="">
			{#each paginatedLeases as lease (lease.id)}
				<LeaseCard
					{lease}
					{tenants}
					{rentalUnits}
					{tenantNameMap}
					onLeaseClick={handleLeaseClick}
					onDelete={handleDelete}
					{onStatusChange}
					{onDataChange}
					{batchMode}
					isSelected={selectedLeaseIds.has(lease.id)}
					onBatchToggle={() => onBatchToggle?.(lease.id)}
				/>
			{/each}
		</div>
		{#if hasMore}
			<div class="flex justify-center py-4">
				<button
					onclick={() => currentPage++}
					class="px-6 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
				>
					Show More ({filteredLeases.length - paginatedLeases.length} remaining)
				</button>
			</div>
		{/if}
	{/if}
</div>
