<script lang="ts">
    import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
    import { onMount } from 'svelte';

    // Props
    export let selectedEvent: { event_status: string; event_name: string } | null = null;
    export let formSubmitted: boolean = false;

    // Types
    interface ActivityLog {
        id: number;
        activity: string;
        created_at: string;
        username: string | null;
        role: string | null;
    }

    // State
    let logs: ActivityLog[] = [];
    let loading = false;

    // Log initial state
    console.log('Initial selectedEvent:', selectedEvent);
    console.log('Initial formSubmitted:', formSubmitted);

    // Fetch logs when event changes
    $: if (selectedEvent?.event_name) {
        console.log('Fetching logs for event:', selectedEvent.event_name);
        fetchLogs(selectedEvent.event_name);
    } else {
        console.log('No event selected. Clearing logs.');
        logs = [];
    }

    async function fetchLogs(eventName: string) {
        console.log('fetchLogs called with eventName:', eventName);
        loading = true;
        try {
            const response = await fetch(`/activities?eventName=${encodeURIComponent(eventName)}`);
            console.log('Fetch response:', response);

            if (!response.ok) {
                // Log if response status is not OK (e.g., 404 or 500)
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched logs:', data);
            logs = data.activities;
        } catch (error) {
            console.error('Error fetching logs:', error);
            logs = [];
        } finally {
            loading = false;
            console.log('Loading status:', loading);
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        console.log('Formatting date:', dateString, '=>', date);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

{#if selectedEvent}
    <div class="mt-4 space-y-4">


        <!-- Activity Logs -->
        <Card>
            <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
                {#if loading}
                    <div class="text-center py-4">
                        Loading logs...
                    </div>
                {:else if logs.length === 0}
                    <div class="text-center text-gray-500 py-4">
                        No activity logs found for this event
                    </div>
                {:else}
                    <div class="logs-container">
                        {#each logs as log (log.id)}
                            <div class="border-b border-gray-100 last:border-0 pb-3">
                                <div class="flex flex-col gap-1">
                                    <div class="flex justify-between items-start">
                                        <span class="text-sm font-medium">
                                            {log.activity}
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            {formatDate(log.created_at)}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-600">
                                        by {log.username || 'Unknown'} ({log.role || 'Unknown'})
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>
    </div>
{/if}

<style>
    .logs-container {
        max-height: 300px;
        overflow-y: auto;
        padding-right: 6px;
    }

    .logs-container::-webkit-scrollbar {
        width: 6px;
    }

    .logs-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .logs-container::-webkit-scrollbar-thumb {
        background-color: rgb(203 213 225);
        border-radius: 3px;
    }

    /* For Firefox */
    .logs-container {
        scrollbar-width: thin;
        scrollbar-color: rgb(203 213 225) transparent;
    }
</style>