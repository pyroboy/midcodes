<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { createEventDispatcher } from 'svelte';

  export let tenants: any[] = [];
  export let data: any;

  const dispatch = createEventDispatcher();

  function handleTenantClick(tenant: any) {
    if (data.isAdminLevel || data.isStaffLevel) {
      dispatch('tenantClick', tenant);
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'BLACKLISTED':
        return 'destructive';
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
</script>

<div class="grid gap-4">
  {#each tenants as tenant}
    <Card.Root 
      class="cursor-pointer {(data.isAdminLevel || data.isStaffLevel) ? 'hover:bg-gray-50' : ''}"
      on:click={() => handleTenantClick(tenant)}
    >
      <Card.Header>
        <Card.Title class="flex justify-between items-center">
          <span>
            {tenant.user?.full_name}
            <Badge variant={getStatusVariant(tenant.tenant_status)} class="ml-2">
              {tenant.tenant_status}
            </Badge>
          </span>
          <span class="text-sm font-normal">
            Room {tenant.room?.room_number}
            {#if tenant.room?.floor}
              - Floor {tenant.room.floor.floor_number}
              {#if tenant.room.floor.wing}
                Wing {tenant.room.floor.wing}
              {/if}
            {/if}
          </span>
        </Card.Title>
        <Card.Description>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong>Property:</strong> {tenant.property?.name}
            </div>
            <div>
              <strong>Contact:</strong> {tenant.user?.email}
            </div>
            <div>
              <strong>Contract:</strong> {formatDate(tenant.contract_start_date)} - {formatDate(tenant.contract_end_date)}
            </div>
            <div>
              <strong>Monthly Rate:</strong> ₱{tenant.monthly_rate.toLocaleString()}
            </div>
          </div>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if tenant.emergency_contact}
          <div class="text-sm">
            <strong>Emergency Contact:</strong>
            {tenant.emergency_contact.name} ({tenant.emergency_contact.relationship})
            - {tenant.emergency_contact.phone}
          </div>
        {/if}
        {#if tenant.notes}
          <div class="mt-2 text-sm">
            <strong>Notes:</strong> {tenant.notes}
          </div>
        {/if}
      </Card.Content>
      <Card.Footer class="text-sm text-gray-500">
        Created by {tenant.created_by_user?.full_name}
      </Card.Footer>
    </Card.Root>
  {/each}
</div>