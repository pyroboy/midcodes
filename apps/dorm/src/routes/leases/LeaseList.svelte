<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LeaseCard from './LeaseCard.svelte';
  import { FileText } from 'lucide-svelte';
  import type { Lease } from '$lib/types/lease';

  interface Props {
    leases?: Lease[];
    tenants?: any[];
    rentalUnits?: any[];
    onStatusChange: (id: string, status: string) => void;
  }

  let { leases = [], tenants = [], rentalUnits = [], onStatusChange }: Props = $props();

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
</script>

<div class="space-y-4">
  {#if leases.length === 0}
    <div class="flex flex-col items-center justify-center py-16 px-6">
      <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <FileText class="w-12 h-12 text-slate-400" />
      </div>
      <h3 class="text-xl font-semibold text-slate-700 mb-2">No Leases Available</h3>
      <p class="text-slate-600 text-center max-w-md">
        There are currently no leases in the system. Click the "Add Lease" button above to create your first rental agreement.
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each leases as lease (lease.id)}
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