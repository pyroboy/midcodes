<script lang="ts">
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();



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
        <h1 class="text-3xl font-bold mb-4">Welcome to ID Generator</h1>
        <p class="text-gray-600 mb-6">Generate and manage ID cards efficiently with our easy-to-use platform.</p>
        
        <div class="flex flex-wrap gap-4">
            <a href="/templates" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                    <path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
                Browse Templates
            </a>
            <a href="/all-ids" class="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                View All IDs
            </a>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card-content rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-2">Total ID Cards</h3>
            <p class="text-3xl font-bold text-primary">{data.totalCards}</p>
        </div>
        <!-- Add more stat cards as needed -->
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
