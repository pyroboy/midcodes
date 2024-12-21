<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
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

  type DbRoom = Database['public']['Tables']['rooms']['Row'];
  type DbProperty = Database['public']['Tables']['properties']['Row'];
  type DbProfile = Database['public']['Tables']['profiles']['Row'];

  type Room = DbRoom & {
    floor?: {
      wing: string | null;
      floor_number: number;
    };
    property: DbProperty;
  };

  type Profile = DbProfile & {
    full_name: string;
    contact_number?: string;
  };

  interface ExtendedTenant extends Omit<TenantFormData, 'lease_id' | 'location_id'> {
    id: number;
    created_at: string;
    updated_at: string | null;
    lease?: {
      id: number;
      location: Room;
      user: Profile;
      start_date: string;
      end_date: string;
      rent_amount: number;
      security_deposit: number;
      notes: string | null;
    };
  }

  interface PageState {
    form: any;
    tenants: ExtendedTenant[];
    rooms: Room[];
    properties: DbProperty[];
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

  function formatDate(date: string | undefined) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  function formatCurrency(amount: number | undefined) {
    if (amount === undefined) return '-';
    return `₱${amount.toLocaleString()}`;
  }
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
            <Table.Head>Property</Table.Head>
            <Table.Head>Room</Table.Head>
            <Table.Head>Tenant</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Contract Period</Table.Head>
            <Table.Head>Financial</Table.Head>
            <Table.Head>Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filteredTenants as tenant}
            <Table.Row>
              <Table.Cell>{tenant.lease?.location.property.name ?? '-'}</Table.Cell>
              <Table.Cell>
                {#if tenant.lease?.location}
                  {tenant.lease.location.floor?.wing ? `${tenant.lease.location.floor.wing} Wing, ` : ''}
                  Floor {tenant.lease.location.floor?.floor_number}, Room {tenant.lease.location.number}
                {:else}
                  -
                {/if}
              </Table.Cell>
              <Table.Cell>
                {#if tenant.lease?.user}
                  <div>
                    <div class="font-medium">{tenant.lease.user.full_name}</div>
                    <div class="text-sm text-gray-500">{tenant.lease.user.email}</div>
                    {#if tenant.lease.user.contact_number}
                      <div class="text-sm text-gray-500">{tenant.lease.user.contact_number}</div>
                    {/if}
                  </div>
                {:else}
                  -
                {/if}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={getStatusColor(tenant.tenant_status)}>
                  {tenant.tenant_status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div class="text-sm">
                  {formatDate(tenant.lease?.start_date)} -
                  {formatDate(tenant.lease?.end_date)}
                </div>
                <div class="text-xs text-gray-500">
                  {formatCurrency(tenant.lease?.rent_amount)} / month
                </div>
              </Table.Cell>
              <Table.Cell>
                <div class="text-sm">
                  <div>Deposit: {formatCurrency(tenant.lease?.security_deposit)}</div>
                  {#if tenant.lease?.notes}
                    <div class="text-xs text-gray-500">{tenant.lease.notes}</div>
                  {/if}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div class="flex gap-2">
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
</div>