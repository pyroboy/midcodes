<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import { Search, X, Filter } from 'lucide-svelte';
	import { leaseStatusEnum } from './formSchema';
	import type { Lease } from '$lib/types/lease';

	interface Props {
		leases: Lease[];
		onFiltersChange: (filters: FilterState) => void;
	}

	let { leases, onFiltersChange }: Props = $props();

	interface FilterState {
		search: string;
		status: string;
		year: string;
		sortBy: string;
	}

	let filters = $state<FilterState>({
		search: '',
		status: '',
		year: '',
		sortBy: 'name-az'
	});

	// Get unique years from lease start dates
	let availableYears = $derived.by(() => {
		const years = new Set<string>();
		leases.forEach((lease) => {
			if (lease.start_date) {
				const year = new Date(lease.start_date).getFullYear().toString();
				years.add(year);
			}
		});
		return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
	});

	// Get unique statuses
	let availableStatuses = $derived.by(() => {
		const statuses = new Set<string>();
		leases.forEach((lease) => {
			if (lease.status) {
				statuses.add(lease.status);
			}
		});
		return Array.from(statuses).sort();
	});

	function handleFilterChange(key: keyof FilterState, value: string) {
		filters[key] = value;
		onFiltersChange(filters);
	}

	function clearAllFilters() {
		filters = {
			search: '',
			status: '',
			year: '',
			sortBy: 'name-az'
		};
		onFiltersChange(filters);
	}

	let hasActiveFilters = $derived(
		filters.search || filters.status || filters.year || filters.sortBy !== 'name-az'
	);

	let showFiltersPopover = $state(false);

	// Reactive statement to handle filter changes
	$effect(() => {
		onFiltersChange(filters);
	});
</script>

<div class="bg-white/60 backdrop-blur-sm  p-2">
	<div class="flex items-center gap-3">
		<!-- Search Bar -->
		<div class="flex-1">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
				<Input
					type="text"
					placeholder="Search leases..."
					bind:value={filters.search}
					oninput={() => onFiltersChange(filters)}
					class="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>
		</div>

		<!-- Filters Button -->
		<Popover.Root bind:open={showFiltersPopover}>
			<Popover.Trigger>
				<Button
					variant="outline"
					class="h-10 px-4 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 transition-colors {hasActiveFilters ? 'border-blue-300 text-blue-700 bg-blue-50' : ''}"
				>
					<Filter class="w-4 h-4 mr-2" />
					Filters
					{#if hasActiveFilters}
						<span class="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
							{[filters.status, filters.year, filters.sortBy !== 'name-az' ? 'sort' : ''].filter(Boolean).length}
						</span>
					{/if}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-80 p-4" align="end">
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-slate-900">Filter Options</h3>
						{#if hasActiveFilters}
							<Button
								variant="ghost"
								size="sm"
								onclick={clearAllFilters}
								class="text-slate-500 hover:text-slate-700 p-1 h-auto"
							>
								<X class="w-4 h-4 mr-1" />
								Clear All
							</Button>
						{/if}
					</div>

					<!-- Status Filter -->
					<div class="space-y-2">
						<label for="status-select" class="text-sm font-medium text-slate-700">Status</label>
						<Select.Root type="single" bind:value={filters.status}>
							<Select.Trigger id="status-select" class="w-full h-9">
								{filters.status || 'All Status'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">All Status</Select.Item>
								{#each availableStatuses as status}
									<Select.Item value={status}>{status}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Year Filter -->
					<div class="space-y-2">
						<label for="year-select" class="text-sm font-medium text-slate-700">Year</label>
						<Select.Root type="single" bind:value={filters.year}>
							<Select.Trigger id="year-select" class="w-full h-9">
								{filters.year || 'All Years'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">All Years</Select.Item>
								{#each availableYears as year}
									<Select.Item value={year}>{year}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Sort Filter -->
					<div class="space-y-2">
						<label for="sort-select" class="text-sm font-medium text-slate-700">Sort By</label>
						<Select.Root type="single" bind:value={filters.sortBy}>
							<Select.Trigger id="sort-select" class="w-full h-9">
								{filters.sortBy === 'name-az'
									? 'Name A-Z'
									: filters.sortBy === 'name-za'
										? 'Name Z-A'
										: filters.sortBy === 'recent-edited'
											? 'Recently Edited'
											: filters.sortBy === 'oldest-edited'
												? 'Oldest Edited'
												: filters.sortBy === 'floor-unit'
													? 'Floor/Unit Number'
													: filters.sortBy === 'unit-floor'
														? 'Unit/Floor Number'
														: filters.sortBy === 'balance-desc'
															? 'Balance (High to Low)'
															: filters.sortBy === 'balance-asc'
																? 'Balance (Low to High)'
																: filters.sortBy === 'due-date'
																	? 'Next Due Date'
																	: filters.sortBy === 'days-overdue'
																		? 'Days Overdue'
																		: 'Name A-Z'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="name-az">Name A-Z</Select.Item>
								<Select.Item value="name-za">Name Z-A</Select.Item>
								<Select.Item value="recent-edited">Recently Edited</Select.Item>
								<Select.Item value="oldest-edited">Oldest Edited</Select.Item>
								<Select.Item value="floor-unit">Floor/Unit Number</Select.Item>
								<Select.Item value="unit-floor">Unit/Floor Number</Select.Item>
								<Select.Item value="balance-desc">Balance (High to Low)</Select.Item>
								<Select.Item value="balance-asc">Balance (Low to High)</Select.Item>
								<Select.Item value="due-date">Next Due Date</Select.Item>
								<Select.Item value="days-overdue">Days Overdue</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- Active Filters Display -->
	{#if hasActiveFilters}
		<div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
			<span class="sr-only">Active Filters:</span>
			<span class="text-xs text-slate-500 font-medium hidden sm:inline">Active Filters:</span>
			{#if filters.search}
				<span
					class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap"
				>
					Search: "{filters.search}"
					<button
						onclick={() => handleFilterChange('search', '')}
						class="hover:bg-blue-200 rounded-full p-0.5"
					>
						<X class="w-3 h-3" />
					</button>
				</span>
			{/if}
			{#if filters.status}
				<span
					class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
				>
					Status: {filters.status}
					<button
						onclick={() => handleFilterChange('status', '')}
						class="hover:bg-green-200 rounded-full p-0.5"
					>
						<X class="w-3 h-3" />
					</button>
				</span>
			{/if}
			{#if filters.year}
				<span
					class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
				>
					Year: {filters.year}
					<button
						onclick={() => handleFilterChange('year', '')}
						class="hover:bg-purple-200 rounded-full p-0.5"
					>
						<X class="w-3 h-3" />
					</button>
				</span>
			{/if}
			{#if filters.sortBy !== 'name-az'}
				<span
					class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
				>
					Sort: {filters.sortBy.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
					<button
						onclick={() => handleFilterChange('sortBy', 'name-az')}
						class="hover:bg-orange-200 rounded-full p-0.5"
					>
						<X class="w-3 h-3" />
					</button>
				</span>
			{/if}
		</div>
	{/if}
</div>
