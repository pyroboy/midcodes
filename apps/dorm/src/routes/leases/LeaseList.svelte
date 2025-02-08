<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LeaseCard from './LeaseCard.svelte';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';

  interface Lease {
    id: string;
    name: string;
    status: string;
    rental_unit?: {
      rental_unit_number: string;
      floor?: {
        floor_number: string;
        wing?: string;
      };
      property?: {
        name: string;
      }
    };
    type: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    security_deposit: number;
    lease_tenants: Array<{
        name: string;
        contact_number?: string;
        email?: string;

    }>;
    notes?: string;
    balance: number;
    billings?: any[];
    payment_schedules?: any[];
  }

  interface Props {
    leases?: Lease[];
  }

  let { leases = [] }: Props = $props();

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

<div class="grid gap-4">
  {#if leases.length === 0}
    <Alert>
      <AlertTitle>No Leases Available</AlertTitle>
      <AlertDescription>
        There are currently no leases in the system. Click the "Add New Lease" button above to create one.
      </AlertDescription>
    </Alert>
  {:else}
    {#each leases as lease}
      <LeaseCard
        lease={lease}
        onLeaseClick={handleLeaseClick}
        onDelete={handleDelete}
      />
    {/each}
  {/if}
</div>