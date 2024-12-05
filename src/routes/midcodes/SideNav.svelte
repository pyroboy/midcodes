<script lang="ts">
  import { page } from '$app/stores';
  import SelectRole from './SelectRole.svelte';
  import { roleState } from '$lib/stores/auth';
  export let currentView: 'dashboard' | 'event-manager' = 'dashboard';

  // Get user role from page data
  $: currentRole = $roleState.currentRole;
  $: emulatedRole = $roleState.emulatedRole;
  $: originalOrgId = $roleState.originalOrgId;
  $: emulatedOrgId = $roleState.emulatedOrgId;
</script>

<nav class="flex flex-col gap-2 p-4 min-w-[200px]">
    <div class="mb-4 pb-4 border-b">
      <SelectRole />
    </div>
  
  <!-- Role Display -->
  <div class="mb-4 pb-4 border-b text-sm">
    <div class="flex flex-col gap-1">
      <div class="text-gray-600">
        Current Role: <span class="font-medium text-gray-900">{currentRole || 'None'}</span>
      </div>
      {#if emulatedRole}
        <div class="text-gray-600">
          Emulated Role: <span class="font-medium text-blue-600">{emulatedRole}</span>
        </div>
      {/if}
      <div class="text-gray-600">
        Original Org: <span class="font-medium text-gray-900">{originalOrgId || 'None'}</span>
      </div>
      {#if emulatedOrgId}
        <div class="text-gray-600">
          Emulated Org: <span class="font-medium text-blue-600">{emulatedOrgId}</span>
        </div>
      {/if}
    </div>
  </div>
  
  <button 
    on:click={() => currentView = 'dashboard'}
    class="p-3 text-left hover:bg-gray-100 rounded-lg transition-colors {currentView === 'dashboard' ? 'bg-gray-100' : ''}"
  >
    Id Card Gen
  </button>
  <button 
    on:click={() => currentView = 'event-manager'}
    class="p-3 text-left hover:bg-gray-100 rounded-lg transition-colors {currentView === 'event-manager' ? 'bg-gray-100' : ''}"
  >
    Event Manager
  </button>
</nav>

<style>
  button {
    all: unset;
    cursor: pointer;
  }
</style>
