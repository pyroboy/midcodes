<script lang="ts">
    import type { PageData } from './$types';
    import { RoleConfig } from '$lib/auth/roleConfig';

    export let data: PageData;

    const role = data.profile?.role || 'id_gen_user';
    const roleConfig = RoleConfig[role];
    const allowedPaths = roleConfig.allowedPaths.filter(path => path.showInNav);

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getIdNumber(data: any) {
        try {
            return data?.id_number || 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }

    function getName(data: any) {
        try {
            return data?.full_name || 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }
</script>

<style>
    :global(.dark) {
        color-scheme: dark;
    }
</style>

<div class="container mx-auto px-4 py-8">
    <!-- Welcome Section -->
    <div class="card-content bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 class="text-3xl font-bold mb-2">Welcome, {data.profile?.email || data.user?.email}</h1>
        <p class="text-gray-600">Role: {roleConfig.label}</p>
        {#if data.profile?.org_id}
            <p class="text-gray-600">Organization ID: {data.profile.org_id}</p>
        {/if}
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card-content rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-2">Total ID Cards</h3>
            <p class="text-3xl font-bold text-primary">{data.totalCards}</p>
        </div>
        <!-- Add more stat cards as needed -->
    </div>

    <!-- Navigation Links -->
    <div class="card-content rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each allowedPaths as { path, label }}
                <a 
                    href={path.replace('/**', '')} 
                    class="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200"
                >
                    <h3 class="text-lg font-semibold mb-1">{label}</h3>
                </a>
            {/each}
        </div>
    </div>

    <!-- Recent Activity -->
    {#if data.error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
            <p>Error loading recent activity. Please try again later.</p>
        </div>
    {:else if data.recentCards?.length > 0}
        <div class="card-content bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold mb-4">Recent ID Cards</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full table-auto">
                    <thead>
                        <tr class="bg-muted">
                            <th class="px-4 py-2 text-left">ID</th>
                            <th class="px-4 py-2 text-left">ID Number</th>
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-left">Created At</th>
                            <th class="px-4 py-2 text-left">Has Images</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.recentCards as card}
                            <tr class="border-t hover:bg-gray-50">
                                <td class="px-4 py-2 font-mono text-sm">{card.id}</td>
                                <td class="px-4 py-2">{getIdNumber(card.data)}</td>
                                <td class="px-4 py-2">{getName(card.data)}</td>
                                <td class="px-4 py-2">{formatDate(card.created_at)}</td>
                                <td class="px-4 py-2">
                                    <div class="flex gap-2">
                                        {#if card.front_image}
                                            <span class="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">Front</span>
                                        {/if}
                                        {#if card.back_image}
                                            <span class="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">Back</span>
                                        {/if}
                                        {#if !card.front_image && !card.back_image}
                                            <span class="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">No Images</span>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <p>No ID cards generated yet.</p>
        </div>
    {/if}
</div>
