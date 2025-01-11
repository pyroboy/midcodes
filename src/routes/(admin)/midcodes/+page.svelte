<script lang="ts">
    import SideNav from './SideNav.svelte';
    import IdCardDashboard from './IdCardDashboard.svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    
    export let data: PageData;
    let currentView: 'dashboard' | 'event-manager' = 'dashboard';

    // Redirect to auth if no user or stats
    if (!data.session?.user || !data.stats) {
        goto('/auth');
    }
</script>

{#if data.session?.user && data.stats}
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
{/if}
