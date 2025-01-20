<script lang="ts">
  import { page } from '$app/stores';
  import SelectRole from './EmulateRole.svelte';
  interface Props {
    currentView?: 'dashboard' | 'event-manager'; // Get user role from page data
  }

  let { currentView = $bindable('dashboard') }: Props = $props();

  
</script>

<nav class="flex flex-col gap-2 p-4 min-w-[200px]">
    <div class="mb-4 pb-4 border-b">
      <SelectRole />
    </div>
  
  <!-- Role Display -->

  
  <button 
    onclick={() => currentView = 'dashboard'}
    class="p-3 text-left hover:bg-gray-100 rounded-lg transition-colors {currentView === 'dashboard' ? 'bg-gray-100' : ''}"
  >
    Id Card Gen
  </button>
  <button 
    onclick={() => currentView = 'event-manager'}
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
