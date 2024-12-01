<script lang="ts">
  import { page } from '$app/stores';
  import SelectRole from './SelectRole.svelte';
  export let currentView: 'dashboard' | 'event-manager' = 'dashboard';

  // Get user role from page data
  $: isSuperAdmin = $page.data.profile?.role === 'super_admin';
</script>

<nav class="flex flex-col gap-2 p-4 min-w-[200px]">
  {#if isSuperAdmin}
    <div class="mb-4 pb-4 border-b">
      <SelectRole />
    </div>
  {/if}
  
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
