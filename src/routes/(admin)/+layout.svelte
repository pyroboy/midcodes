<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Ensure we're using the admin layout
    $: console.log('[Admin Layout]', {
        path: $page.url.pathname,
        data: $page.data
    });

    onMount(() => {
        // Verify we're in an admin route
        if (!$page.url.pathname.startsWith('/midcodes')) {
            goto('/midcodes');
        }
    });
</script>

<div class="admin-layout">
    <slot />
</div>

<style>
    .admin-layout {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    :global(body) {
        background: white;
    }
</style>
