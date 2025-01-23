<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';

  interface Props {
    leases?: any[];
  }

  let { leases = [] }: Props = $props();

  const dispatch = createEventDispatcher<{
    leaseClick: any;
    edit: any;
    delete: any;
  }>();

  function handleLeaseClick(lease: any) {
    dispatch('leaseClick', lease);
  }

  function handleEdit(event: Event, lease: any) {
    event.stopPropagation();
    dispatch('edit', lease);
  }

  function handleDelete(event: Event, lease: any) {
    event.stopPropagation();
    dispatch('delete', lease);
  }

  function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'TERMINATED':
        return 'destructive';
      case 'EXPIRED':
        return 'outline';
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
      class="cursor-pointer hover:bg-gray-50"
      onclick={() => handleLeaseClick(lease)}
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
          Rental_unit {lease.rental_unit?.rental_unit_number}
          {#if lease.rental_unit?.floor}
            - Floor {lease.rental_unit.floor.floor_number}
            {#if lease.rental_unit.floor.wing}
              Wing {lease.rental_unit.floor.wing}
            {/if}
          {/if}
        </span>
      </Card.Title>
      
      <!-- Replaced div grid inside Card.Description with separate section -->
      <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
        <p>
          <strong>Property:</strong> {lease.rental_unit?.property?.name}
        </p>
        <p>
          <strong>Type:</strong> {lease.type}
        </p>
        <p>
          <strong>Contract:</strong> {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
        </p>
        <p>
          <strong>Rent:</strong> {formatCurrency(lease.rent_amount)}
        </p>
      </div>
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

          <div class="flex justify-end gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              onclick={(e) => handleEdit(e, lease)}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onclick={(e) => handleDelete(e, lease)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/each}
</div>