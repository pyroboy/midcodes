<script lang="ts">
  import type { PageData } from './$types';
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { ExtendedTenant } from './types';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';

  interface Props {
      tenants: ExtendedTenant[];
  }

  let { tenants }: Props = $props();

  const dispatch = createEventDispatcher<{
      edit: ExtendedTenant;
      delete: ExtendedTenant;
  }>();

  let selectedProperty: string | undefined = $state();
  let selectedStatus: string | undefined = $state();
  let searchQuery = $state('');

  let filteredTenants = $derived(tenants.filter(tenant => {
      const matchesProperty = !selectedProperty || 
          (tenant.lease?.location?.property?.id?.toString() === selectedProperty);
      const matchesStatus = !selectedStatus || tenant.tenant_status === selectedStatus;
      const matchesSearch = !searchQuery || 
          tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProperty && matchesStatus && matchesSearch;
  }));

  function handleEdit(tenant: ExtendedTenant) {
      dispatch('edit', tenant);
  }

  function handleDelete(tenant: ExtendedTenant) {
      dispatch('delete', tenant);
  }
</script>

<div class="w-2/3 border-4 border-red-500">
  <div class="bg-white shadow rounded-lg">
      <div class="p-4 border-b">
          <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Tenants</h2>
          </div>
          
          <div class="flex gap-4 mb-4">
              <div class="flex-1">
                  <input
                      type="text"
                      placeholder="Search tenants..."
                      class="w-full px-3 py-2 border rounded-lg"
                      bind:value={searchQuery}
                  />
              </div>
          </div>
      </div>
      <Table.Root>
          <Table.Header>
              <Table.Row>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Email</Table.Head>
                  <Table.Head>Contact Number</Table.Head>
                  <Table.Head>Property</Table.Head>
                  <Table.Head>Rental Unit</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head class="text-right">Actions</Table.Head>
              </Table.Row>
          </Table.Header>
          <Table.Body>
              {#each filteredTenants as tenant (tenant.id)}
                  <Table.Row>
                      <Table.Cell>{tenant.name}</Table.Cell>
                      <Table.Cell>{tenant.email || 'N/A'}</Table.Cell>
                      <Table.Cell>{tenant.contact_number || 'N/A'}</Table.Cell>
                      <Table.Cell>
                          {#if tenant.lease?.location?.property?.name}
                              {tenant.lease.location.property.name}
                          {:else}
                              Not Assigned
                          {/if}
                      </Table.Cell>
                      <Table.Cell>
                          {#if tenant.lease?.location?.number}
                              {tenant.lease.location.number}
                          {:else}
                              Not Assigned
                          {/if}
                      </Table.Cell>
                      <Table.Cell>
                          <Badge variant={tenant.tenant_status === 'ACTIVE' ? 'secondary' : 
                              tenant.tenant_status === 'PENDING' ? 'outline' : 'destructive'}>
                              {tenant.tenant_status}
                          </Badge>
                      </Table.Cell>
                      <Table.Cell class="text-right">
                          <div class="flex justify-end gap-2">
                              <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onclick={() => handleEdit(tenant)}
                              >
                                  Edit
                              </Button>
                              <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onclick={() => handleDelete(tenant)}
                              >
                                  Delete
                              </Button>
                          </div>
                      </Table.Cell>
                  </Table.Row>
              {/each}
          </Table.Body>
      </Table.Root>
  </div>
</div>