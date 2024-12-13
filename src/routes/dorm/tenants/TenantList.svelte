<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import { createEventDispatcher } from 'svelte';
  
    export let tenants: any[];
    export let leases: any[];
    export let showDeleteConfirmation: boolean = false;
  
    const dispatch = createEventDispatcher();
  
    function editTenant(tenant: any) {
      dispatch('edit', tenant);
    }
  
    function handleDelete(event: Event) {
      if (showDeleteConfirmation) {
        if (!confirm('Are you sure you want to delete this tenant?')) {
          return false;
        }
      }
      dispatch('deleteSuccess');
    
    }
  </script>
  
  <div class="w-2/3 pr-4">
    <h2 class="text-xl font-bold mb-2">Tenant List</h2>
    <ul class="space-y-2">
      {#each tenants as tenant}
        <li class="flex items-center justify-between bg-gray-100 p-2 rounded">
          <span>
            {leases.find(l => l.id === tenant.mainleaseId)?.leaseType} = {tenant.tenantName} - {tenant.tenantContactNumber || 'N/A'} - 
            Location: {tenant.location?.locationName || 'N/A'}
          </span>
          <div>
            <Button on:click={() => editTenant(tenant)}>Edit</Button>
            <form method="POST" action="?/delete" on:submit={handleDelete} class="inline">
              <input type="hidden" name="id" value={tenant.id} />
              <Button type="submit">Delete</Button>
            </form>
          </div>
        </li>
      {/each}
    </ul>
  </div>