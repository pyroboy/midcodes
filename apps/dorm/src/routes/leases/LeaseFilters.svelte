<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
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
    balanceStatus: 'all' | 'overdue' | 'pending' | 'partial' | 'paid';
  }

  let filters = $state<FilterState>({
    search: '',
    status: '',
    year: '',
    sortBy: 'name-az',
    balanceStatus: 'all'
  });

  // Get unique years from lease start dates
  let availableYears = $derived.by(() => {
    const years = new Set<string>();
    leases.forEach(lease => {
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
    leases.forEach(lease => {
      if (lease.status) {
        statuses.add(lease.status);
      }
    });
    return Array.from(statuses).sort();
  });

  function handleFilterChange(key: keyof FilterState, value: string) {
    if (key === 'balanceStatus') {
      filters[key] = value as 'all' | 'overdue' | 'pending' | 'partial' | 'paid';
    } else {
      filters[key] = value;
    }
    onFiltersChange(filters);
  }

  function clearAllFilters() {
    filters = {
      search: '',
      status: '',
      year: '',
      sortBy: 'name-az',
      balanceStatus: 'all'
    };
    onFiltersChange(filters);
  }

  let hasActiveFilters = $derived(
    filters.search || filters.status || filters.year || filters.sortBy !== 'name-az' || filters.balanceStatus !== 'all'
  );

  // Reactive statement to handle filter changes
  $effect(() => {
    onFiltersChange(filters);
  });
</script>

<div class="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 mb-6">
  <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
    <!-- Search Bar -->
    <div class="flex-1 min-w-0">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search lease, tenant, unit, floor..."
          bind:value={filters.search}
          class="pl-10 pr-4 h-10"
        />
      </div>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-wrap gap-3 items-center">
      <!-- Status Filter -->
      <Select.Root
        type="single"
        bind:value={filters.status}
      >
        <Select.Trigger class="w-40 h-10">
          {filters.status || "All Status"}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="">All Status</Select.Item>
          {#each availableStatuses as status}
            <Select.Item value={status}>{status}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <!-- Balance Status Filter -->
      <Select.Root
        type="single"
        bind:value={filters.balanceStatus}
      >
        <Select.Trigger class="w-40 h-10">
          {filters.balanceStatus === 'all' ? 'All Balances' :
           filters.balanceStatus === 'overdue' ? 'Overdue' :
           filters.balanceStatus === 'pending' ? 'Pending' :
           filters.balanceStatus === 'partial' ? 'Partial' :
           filters.balanceStatus === 'paid' ? 'Paid' : 'All Balances'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All Balances</Select.Item>
          <Select.Item value="overdue">Overdue</Select.Item>
          <Select.Item value="pending">Pending</Select.Item>
          <Select.Item value="partial">Partial</Select.Item>
          <Select.Item value="paid">Paid</Select.Item>
        </Select.Content>
      </Select.Root>

      <!-- Year Filter -->
      <Select.Root
        type="single"
        bind:value={filters.year}
      >
        <Select.Trigger class="w-32 h-10">
          {filters.year || "All Years"}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="">All Years</Select.Item>
          {#each availableYears as year}
            <Select.Item value={year}>{year}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <!-- Sort Filter -->
      <Select.Root
        type="single"
        bind:value={filters.sortBy}
      >
        <Select.Trigger class="w-48 h-10">
          {filters.sortBy === 'name-az' ? 'Name A-Z' : 
           filters.sortBy === 'name-za' ? 'Name Z-A' :
           filters.sortBy === 'recent-edited' ? 'Recently Edited' :
           filters.sortBy === 'oldest-edited' ? 'Oldest Edited' :
           filters.sortBy === 'floor-unit' ? 'Floor/Unit Number' :
           filters.sortBy === 'unit-floor' ? 'Unit/Floor Number' :
           filters.sortBy === 'balance-desc' ? 'Balance (High to Low)' :
           filters.sortBy === 'balance-asc' ? 'Balance (Low to High)' :
           filters.sortBy === 'due-date' ? 'Next Due Date' :
           filters.sortBy === 'days-overdue' ? 'Days Overdue' : 'Name A-Z'}
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

      <!-- Clear Filters Button -->
      {#if hasActiveFilters}
        <Button
          variant="outline"
          size="sm"
          onclick={clearAllFilters}
          class="h-10 px-3 text-slate-600 hover:text-slate-800"
        >
          <X class="w-4 h-4 mr-1" />
          Clear All
        </Button>
      {/if}
    </div>
  </div>

  <!-- Active Filters Display -->
  {#if hasActiveFilters}
    <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
      <span class="text-xs text-slate-500 font-medium">Active Filters:</span>
      {#if filters.search}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
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
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          Status: {filters.status}
          <button
            onclick={() => handleFilterChange('status', '')}
            class="hover:bg-green-200 rounded-full p-0.5"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      {/if}
      {#if filters.balanceStatus !== 'all'}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
          Balance: {filters.balanceStatus.charAt(0).toUpperCase() + filters.balanceStatus.slice(1)}
          <button
            onclick={() => handleFilterChange('balanceStatus', 'all')}
            class="hover:bg-red-200 rounded-full p-0.5"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      {/if}
      {#if filters.year}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
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
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
          Sort: {filters.sortBy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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