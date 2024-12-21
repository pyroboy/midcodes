<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { createEventDispatcher } from 'svelte';

  export let leases: any[] = [];
  export let data: any;

  const dispatch = createEventDispatcher();

  function handleLeaseClick(lease: any) {
    if (data.isAdminLevel || data.isAccountant) {
      dispatch('leaseClick', lease);
    }
  }

  function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case 'ACTIVE':
      return 'default';  // Changed from 'success'
    case 'INACTIVE':
      return 'secondary';
    case 'TERMINATED':
      return 'destructive';
    case 'EXPIRED':
      return 'outline';  // Changed from 'warning'
    default:
      return 'secondary';
  }
}

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }
</script>

<div class="grid gap-4">
  {#each leases as lease}
    <Card.Root 
      class="cursor-pointer {(data.isAdminLevel || data.isAccountant) ? 'hover:bg-gray-50' : ''}"
      on:click={() => handleLeaseClick(lease)}
    >
      <Card.Header>
        <Card.Title class="flex justify-between items-center">
          <span>
            {lease.name}
            <Badge variant={getStatusVariant(lease.status)} class="ml-2">
              {lease.status}
            </Badge>
          </span>
          <span class="text-sm font-normal">
            Room {lease.room?.room_number}
            {#if lease.room?.floor}
              - Floor {lease.room.floor.floor_number}
              {#if lease.room.floor.wing}
                Wing {lease.room.floor.wing}
              {/if}
            {/if}
          </span>
        </Card.Title>
        <Card.Description>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong>Property:</strong> {lease.room?.property?.name}
            </div>
            <div>
              <strong>Type:</strong> {lease.type}
            </div>
            <div>
              <strong>Contract:</strong> {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
            </div>
            <div>
              <strong>Rent:</strong> {formatCurrency(lease.rent_amount)}
            </div>
          </div>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <div>
            <strong>Tenants:</strong>
            <div class="mt-1 space-y-1">
              {#each lease.lease_tenants as lt}
                <div class="text-sm">
                  {lt.tenant.name}
                  {#if lt.tenant.contact_number || lt.tenant.email}
                    <span class="text-gray-500">
                      ({lt.tenant.contact_number || lt.tenant.email})
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
          {#if lease.notes}
            <div class="text-sm">
              <strong>Notes:</strong> {lease.notes}
            </div>
          {/if}
          {#if lease.balance > 0}
            <div class="text-sm text-red-600">
              <strong>Outstanding Balance:</strong> {formatCurrency(lease.balance)}
            </div>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  {/each}
</div>