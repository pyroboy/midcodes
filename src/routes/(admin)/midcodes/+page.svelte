<script lang="ts">
    import SideNav from './SideNav.svelte';
    import IdCardDashboard from './IdCardDashboard.svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    export let data: PageData;
    let currentView: 'dashboard' | 'event-manager' = 'dashboard';
    let loading = true;
    let error: string | null = null;

    onMount(() => {
        // Only redirect if there's no session
        if (!data.session?.user) {
            goto('/auth');
            return;
        }

        // Handle stats data loading
        if (!data.stats) {
            error = 'Failed to load statistics data';
        } else {
            // Ensure we're in the admin layout context
            if (!window.location.pathname.startsWith('/midcodes')) {
                goto('/midcodes');
            }
        }

        loading = false;
    });
</script>

{#if loading}
    <div class="loading-spinner">
        Loading midcodes dashboard...
    </div>
{:else if error}
    <div class="error-message">
        {error}
    </div>
{:else}
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
