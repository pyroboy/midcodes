<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { ExtendedTenant, Rental_unit } from './types';
  type Property = Database['public']['Tables']['properties']['Row'];
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
    rental_unit: Rental_unit[];
    properties: Property[];
    profile: ServerProfile | null;
    isAdminLevel: boolean;
    isStaffLevel: boolean;
  }

  type ServerProfile = Database['public']['Tables']['profiles']['Row'];

  export let data: PageState;

  const dispatch = createEventDispatcher<{
    edit: ExtendedTenant;
    delete: ExtendedTenant;
  }>();

  let selectedProperty: string | undefined;
  let selectedStatus: string | undefined;
  let searchQuery = '';

  $: filteredTenants = data.tenants.filter(tenant => {
    const matchesProperty = !selectedProperty || 
      (tenant.lease?.location?.property?.id?.toString() === selectedProperty);
    const matchesStatus = !selectedStatus || tenant.tenant_status === selectedStatus;
    const matchesSearch = !searchQuery || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase());
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

  function getRental_UnitStatusColor(status: string): string {
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
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head>Contact Number</Table.Head>
            <Table.Head>Property</Table.Head>
            <Table.Head>Rental_unit</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each sortedTenants as tenant (tenant.id)}
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
                  <Button size="sm" variant="outline" on:click={() => handleEdit(tenant)}>
                    Edit
                  </Button>
                  {#if data.isAdminLevel}
                    <Button size="sm" variant="destructive" on:click={() => handleDelete(tenant)}>
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