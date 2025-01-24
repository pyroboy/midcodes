<script lang="ts">
    import { run } from 'svelte/legacy';

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
    
    // Ensure we're using the admin layout
    run(() => {
        console.log('[Admin Layout]', {
            path: $page.url.pathname,
            data: $page.data
        });
    });

    onMount(() => {
        // Verify we're in an admin route
        if (!$page.url.pathname.startsWith('/midcodes')) {
            goto('/midcodes');
        }
    });
</script>

<div class="admin-layout">
    <nav class="bg-gray-800 p-4 mb-4">
        <div class="container mx-auto">
            <div class="flex space-x-4">
                <a href="/admin/document-types" class="text-white hover:text-gray-300">Document Types List</a>
                <a href="/admin/document-types/new" class="text-white hover:text-gray-300">Create Document Type</a>
            </div>
        </div>
    </nav>
    {@render children?.()}
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
