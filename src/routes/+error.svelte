<!-- src/routes/+error.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        if ($page.status === 401) {
            goto('/login');
        }
    });
</script>

{#if $page.status === 401}
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
            <h1 class="text-2xl font-bold mb-4">Unauthorized Access</h1>
            <p class="mb-4">Please log in to access this page.</p>
            <p>Redirecting to login page...</p>
        </div>
    </div>
{:else}
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
            <h1 class="text-2xl font-bold mb-4">Error {$page.status}</h1>
            <p class="mb-4">{$page.error?.message || 'An error occurred'}</p>
        </div>
    </div>
{/if}
