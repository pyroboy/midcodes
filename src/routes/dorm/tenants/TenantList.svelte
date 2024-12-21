<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { ExtendedTenant, Room, Floor, Property, Profile } from './types';
  import type { TenantFormData } from './formSchema';
  import * as Table from '$lib/components/ui/table';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";
  import type { Database } from '$lib/database.types';
  import { Badge } from '$lib/components/ui/badge';

  interface PageState {
    form: any;
    tenants: ExtendedTenant[];
    rooms: Room[];
    properties: Property[];
    users: Profile[];
    userRole: string;
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  }

  export let data: PageState;

  const dispatch = createEventDispatcher<{
    edit: ExtendedTenant;
    delete: ExtendedTenant;
  }>();

  let selectedProperty: string | undefined;
  let selectedStatus: string | undefined;
  let searchQuery = '';

  $: filteredTenants = data.tenants.filter(tenant => {
    const matchesProperty = !selectedProperty || tenant.lease?.location.property.id.toString() === selectedProperty;
    const matchesStatus = !selectedStatus || tenant.tenant_status === selectedStatus;
    const matchesSearch = !searchQuery || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.lease?.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.lease?.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProperty && matchesStatus && matchesSearch;
  });

  function handleEdit(tenant: ExtendedTenant) {
    dispatch('edit', tenant);
  }

  function handleDelete(tenant: ExtendedTenant) {
    if (confirm('Are you sure you want to delete this tenant?')) {
      dispatch('delete', tenant);
    }
  }

  function updatePropertyFilter(value: { value: string } | undefined) {
    selectedProperty = value?.value;
  }

  function updateStatusFilter(value: { value: string } | undefined) {
    selectedStatus = value?.value;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getRoomStatusColor(status: string): string {
    switch (status) {
      case 'VACANT':
        return 'bg-green-100 text-green-800';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(date: string | undefined) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  function formatCurrency(amount: number | undefined) {
    if (amount === undefined) return '-';
    return `₱${amount.toLocaleString()}`;
  }

  $: sortedTenants = filteredTenants.sort((a, b) => {
    // Sort by status first (ACTIVE first, then others)
    if (a.tenant_status === 'ACTIVE' && b.tenant_status !== 'ACTIVE') return -1;
    if (a.tenant_status !== 'ACTIVE' && b.tenant_status === 'ACTIVE') return 1;
    
    // Then sort by outstanding balance (highest first)
    if (a.outstanding_balance !== b.outstanding_balance) {
      return b.outstanding_balance - a.outstanding_balance;
    }
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
</script>

<div class="w-2/3">
  <div class="bg-white shadow rounded-lg">
    <div class="p-4 border-b">
      <h2 class="text-xl font-semibold mb-4">Tenants</h2>
      
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search tenants..."
            class="w-full px-3 py-2 border rounded-lg"
            bind:value={searchQuery}
          />
        </div>
        
        <div class="w-48">
          <Select onSelectedChange={updatePropertyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {#each data.properties as property}
                <SelectItem value={property.id.toString()}>{property.name}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="w-48">
          <Select onSelectedChange={updateStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <div class="p-4">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-[200px]">Name</Table.Head>
            <Table.Head>Room</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head class="text-right">Balance</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each sortedTenants as tenant (tenant.id)}
            <Table.Row>
              <Table.Cell class="font-medium">
                {tenant.name}
                <div class="text-sm text-gray-500">
                  {tenant.contact_number || 'No contact'}
                </div>
              </Table.Cell>
              <Table.Cell>
                {#if tenant.lease?.location}
                  <div class="flex flex-col">
                    <span>Room {tenant.lease.location.number}</span>
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" class={getRoomStatusColor(tenant.lease.location.room_status)}>
                        {tenant.lease.location.room_status}
                      </Badge>
                      {#if tenant.lease.location.floor}
                        <span>Floor {tenant.lease.location.floor.floor_number}</span>
                        {#if tenant.lease.location.floor.wing}
                          <span>Wing {tenant.lease.location.floor.wing}</span>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {:else}
                  <span class="text-gray-500">No room assigned</span>
                {/if}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={getStatusColor(tenant.tenant_status)}>
                  {tenant.tenant_status}
                </Badge>
                {#if tenant.lease?.status}
                  <Badge variant="outline" class={getStatusColor(tenant.lease.status)}>
                    {tenant.lease.status}
                  </Badge>
                {/if}
              </Table.Cell>
              <Table.Cell class="text-right">
                <div class="flex flex-col items-end">
                  <span class={tenant.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                    ₱{tenant.outstanding_balance.toLocaleString()}
                  </span>
                  {#if tenant.lease?.next_payment_due}
                    <span class="text-sm text-gray-500">
                      Due {formatDate(tenant.lease.next_payment_due)}
                    </span>
                  {/if}
                </div>
              </Table.Cell>
              <Table.Cell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" on:click={() => handleEdit(tenant)}>
                    Edit
                  </Button>
                  {#if data.isAdminLevel}
                    <Button variant="destructive" size="sm" on:click={() => handleDelete(tenant)}>
                      Delete
                    </Button>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </div>
</div>