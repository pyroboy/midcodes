<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Pencil, Trash2 } from 'lucide-svelte';
  import type { TenantResponse } from '$lib/types/tenant';
  import { createEventDispatcher } from 'svelte';

  /* =====================================================
     PROPS & DATA INITIALIZATION
     ===================================================== */
  let { tenants } = $props<{
    tenants: TenantResponse[];
  }>();

  /* =====================================================
     EVENT DISPATCHER
     ===================================================== */
  const dispatch = createEventDispatcher<{
    edit: TenantResponse;
    delete: TenantResponse;
  }>();

  /* =====================================================
     HELPER FUNCTIONS
     ===================================================== */
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

  function handleEdit(tenant: TenantResponse) {
    dispatch('edit', tenant);
  }

  function handleDelete(tenant: TenantResponse) {
    dispatch('delete', tenant);
  }
</script>

<!--
  Tenant Table Component
  
  A reusable table component for displaying tenant information in a structured format.
  Supports edit and delete actions with event dispatching.
  
  @prop {TenantResponse[]} tenants - Array of tenant data to display
  @event {CustomEvent<TenantResponse>} edit - Fired when edit button is clicked
  @event {CustomEvent<TenantResponse>} delete - Fired when delete button is clicked
  
  @example
  ```svelte
  <TenantTable 
    {tenants}
    on:edit={handleEdit}
    on:delete={handleDelete}
  />
  ```
-->

<div class="overflow-x-auto">
  <table class="w-full">
    <thead class="bg-slate-50 border-b border-slate-200">
      <tr>
        <th class="text-left p-4 font-medium text-slate-600">Tenant</th>
        <th class="text-left p-4 font-medium text-slate-600">Contact</th>
        <th class="text-left p-4 font-medium text-slate-600">Status</th>
        <th class="text-left p-4 font-medium text-slate-600">Lease Info</th>
        <th class="text-right p-4 font-medium text-slate-600">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200">
      {#each tenants as tenant (tenant.id)}
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-4">
            <div class="flex items-center gap-3">
              {#if tenant.profile_picture_url}
                <img 
                  src={tenant.profile_picture_url} 
                  alt="{tenant.name}'s profile picture"
                  class="w-8 h-8 rounded-full object-cover"
                />
              {:else}
                <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <span class="text-slate-600 font-medium text-xs">
                    {tenant.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              {/if}
              <div class="font-medium text-slate-900">{tenant.name}</div>
            </div>
          </td>
          <td class="p-4">
            <div class="text-sm text-slate-600">
              {#if tenant.email}
                <div>{tenant.email}</div>
              {/if}
              {#if tenant.contact_number}
                <div class="text-slate-500">{tenant.contact_number}</div>
              {/if}
              {#if !tenant.email && !tenant.contact_number}
                <span class="text-slate-400">No contact info</span>
              {/if}
            </div>
          </td>
          <td class="p-4">
            <Badge class={getStatusColor(tenant.tenant_status)}>
              {tenant.tenant_status}
            </Badge>
          </td>
          <td class="p-4">
            <div class="text-sm text-slate-600">
              {#if tenant.lease}
                <div class="font-medium">{tenant.lease.location?.property?.name || 'N/A'}</div>
                <div class="text-slate-500">Unit {tenant.lease.location?.number || 'N/A'}</div>
              {:else}
                <span class="text-orange-600">No active lease</span>
              {/if}
            </div>
          </td>
          <td class="p-4">
            <div class="flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onclick={() => handleEdit(tenant)}
              >
                <Pencil class="h-3 w-3" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onclick={() => handleDelete(tenant)}
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div> 