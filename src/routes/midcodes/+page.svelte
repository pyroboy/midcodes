<script lang="ts">
    import SideNav from './SideNav.svelte';
    import IdCardDashboard from './IdCardDashboard.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    let currentView: 'dashboard' | 'event-manager' = 'dashboard';
</script>

<div class="flex">
    <SideNav bind:currentView />
    <div class="flex-1">
        {#if currentView === 'dashboard'}
            <IdCardDashboard {data} />
        {:else if currentView === 'event-manager'}
            <div class="p-6">
                <h1 class="text-3xl font-bold">Event Manager</h1>
                <p class="mt-4">Event management features coming soon...</p>
            </div>
        {/if}
    </div>
</div>
