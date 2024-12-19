<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Table from '$lib/components/ui/table';
  import type { PageData } from './$types';

  export let data: PageData;

  const dispatch = createEventDispatcher();

  function handleEdit(tenant: any) {
    dispatch('edit', tenant);
  }
</script>

<div class="w-2/3">
  <div class="bg-white shadow rounded-lg">
    <div class="p-4 border-b">
      <h2 class="text-xl font-semibold">Tenants</h2>
    </div>
    <div class="p-4">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Property</Table.Head>
            <Table.Head>Room</Table.Head>
            <Table.Head>Tenant</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Contract Period</Table.Head>
            <Table.Head>Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.tenants ?? [] as tenant}
            <Table.Row>
              <Table.Cell>{tenant.property?.name ?? '-'}</Table.Cell>
              <Table.Cell>
                {#if tenant.room}
                  {tenant.room.floor?.wing ? `${tenant.room.floor.wing} Wing, ` : ''}
                  Floor {tenant.room.floor?.floor_number}, Room {tenant.room.room_number}
                {:else}
                  -
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if tenant.user}
                  <div>
                    <div class="font-medium">{tenant.user.full_name}</div>
                    <div class="text-sm text-gray-500">{tenant.user.email}</div>
                    {#if tenant.user.phone}
                      <div class="text-sm text-gray-500">{tenant.user.phone}</div>
                    {/if}
                  </div>
                {:else}
                  -
                {/if}
              </Table.Cell>
              <Table.Cell>
                <span class="px-2 py-1 text-xs font-semibold rounded-full
                  {tenant.tenant_status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                   tenant.tenant_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                   tenant.tenant_status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                   'bg-red-100 text-red-800'}">
                  {tenant.tenant_status}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div class="text-sm">
                  {new Date(tenant.contract_start_date).toLocaleDateString()} -
                  {new Date(tenant.contract_end_date).toLocaleDateString()}
                </div>
                <div class="text-xs text-gray-500">
                  ₱{tenant.monthly_rate.toLocaleString()} / month
                </div>
              </Table.Cell>
              <Table.Cell>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" on:click={() => handleEdit(tenant)}>
                    Edit
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
</div>