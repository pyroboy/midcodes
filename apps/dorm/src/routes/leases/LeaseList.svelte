<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LeaseCard from './LeaseCard.svelte';
  import LeaseFilters from './LeaseFilters.svelte';
  import { FileText } from 'lucide-svelte';
  import type { Lease } from '$lib/types/lease';

  interface Props {
    leases?: (Lease & { balanceStatus?: any })[];
    tenants?: any[];
    rentalUnits?: any[];
    onStatusChange: (id: string, status: string) => void;
  }

  let { leases = [], tenants = [], rentalUnits = [], onStatusChange }: Props = $props();

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

  let filteredLeases = $derived.by(() => {
    let filtered = [...leases];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(lease => {
        const leaseName = (lease.name || `Lease #${lease.id}`).toLowerCase();
        const tenantNames = lease.lease_tenants?.map(lt => lt.name?.toLowerCase() || '').join(' ') || '';
        const unitInfo = `${lease.rental_unit?.floor?.floor_number || ''} ${lease.rental_unit?.rental_unit_number || ''}`.toLowerCase();
        const propertyName = lease.rental_unit?.property?.name?.toLowerCase() || '';
        
        return leaseName.includes(searchTerm) || 
               tenantNames.includes(searchTerm) || 
               unitInfo.includes(searchTerm) || 
               propertyName.includes(searchTerm);
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(lease => lease.status === filters.status);
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter(lease => {
        const startYear = new Date(lease.start_date).getFullYear().toString();
        return startYear === filters.year;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'name-az':
        filtered.sort((a, b) => (a.name || `Lease #${a.id}`).localeCompare(b.name || `Lease #${b.id}`));
        break;
      case 'name-za':
        filtered.sort((a, b) => (b.name || `Lease #${b.id}`).localeCompare(a.name || `Lease #${a.id}`));
        break;
      case 'recent-edited':
        filtered.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        break;
      case 'oldest-edited':
        filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        break;
      case 'floor-unit':
        filtered.sort((a, b) => {
          const aFloor = parseInt(a.rental_unit?.floor?.floor_number || '0');
          const bFloor = parseInt(b.rental_unit?.floor?.floor_number || '0');
          if (aFloor !== bFloor) return aFloor - bFloor;
          return (a.rental_unit?.rental_unit_number || '').localeCompare(b.rental_unit?.rental_unit_number || '');
        });
        break;
      case 'unit-floor':
        filtered.sort((a, b) => {
          const aUnit = a.rental_unit?.rental_unit_number || '';
          const bUnit = b.rental_unit?.rental_unit_number || '';
          if (aUnit !== bUnit) return aUnit.localeCompare(bUnit);
          return parseInt(a.rental_unit?.floor?.floor_number || '0') - parseInt(b.rental_unit?.floor?.floor_number || '0');
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
          const aDate = a.balanceStatus?.nextDueDate ? new Date(a.balanceStatus.nextDueDate) : new Date('9999-12-31');
          const bDate = b.balanceStatus?.nextDueDate ? new Date(b.balanceStatus.nextDueDate) : new Date('9999-12-31');
          return aDate.getTime() - bDate.getTime();
        });
        break;
      case 'days-overdue':
        filtered.sort((a, b) => (b.balanceStatus?.daysOverdue || 0) - (a.balanceStatus?.daysOverdue || 0));
        break;
    }

    return filtered;
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

<div class="space-y-4">
  {#if filteredLeases.length === 0}
    <div class="flex flex-col items-center justify-center py-16 px-6">
      <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <FileText class="w-12 h-12 text-slate-400" />
      </div>
      <h3 class="text-xl font-semibold text-slate-700 mb-2">
        {leases.length === 0 ? 'No Leases Available' : 'No Leases Match Filters'}
      </h3>
      <p class="text-slate-600 text-center max-w-md">
        {leases.length === 0 
          ? 'There are currently no leases in the system. Click the "Add Lease" button above to create your first rental agreement.'
          : 'Try adjusting your search criteria or filters to find the leases you\'re looking for.'
        }
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each filteredLeases as lease (lease.id)}
        <LeaseCard
          lease={lease}
          {tenants}
          {rentalUnits}
          onLeaseClick={handleLeaseClick}
          onDelete={handleDelete}
          {onStatusChange}
        />
      {/each}
    </div>
  {/if}
</div>