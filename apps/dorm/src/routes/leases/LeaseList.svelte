<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LeaseCard from './LeaseCard.svelte';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import type { Lease } from '$lib/types/lease';

  interface Props {
    leases?: Lease[];
    onStatusChange: (id: string, status: string) => void;
  }

  let { leases = [], onStatusChange }: Props = $props();

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

<div class="">
  {#if leases.length === 0}
    <Alert>
      <AlertTitle>No Leases Available</AlertTitle>
      <AlertDescription>
        There are currently no leases in the system. Click the "Add New Lease" button above to create one.
      </AlertDescription>
    </Alert>
  {:else}
    {#each leases as lease (lease.id)}
      <LeaseCard
        lease={lease}
        onLeaseClick={handleLeaseClick}
        onDelete={handleDelete}
        {onStatusChange}
      />
    {/each}
  {/if}
</div>