<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card"
    import { Button } from "$lib/components/ui/button"
    import { fade } from 'svelte/transition'
    import StatusControl from './StatusControl.svelte'
    import { goto } from '$app/navigation'
    import { createEventDispatcher } from 'svelte'

    const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const
    type EventStatus = typeof EVENT_STATUSES[number]

    interface Event {
        id: string
        event_name: string
        category: string
        event_status: EventStatus
        medal_count: number | null
    }

    export let events: Event[]
    export let role: 'Admin' | 'TabulationHead' | undefined
    export let isProcessing: Record<string, boolean> = {}
    export let rowErrors: Record<string, string> = {}

    function getStatusBadgeClass(status: EventStatus): string {
        const statusClasses = {
            nodata: 'bg-gray-100 text-gray-800',
            forReview: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            locked: 'bg-amber-100 text-amber-800',
            locked_published: 'bg-purple-100 text-purple-800'
        }
        return `inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`
    }

    function formatStatusLabel(status: EventStatus): string {
        const labels = {
            nodata: 'No Data',
            forReview: 'For Review',
            approved: 'Approved',
            locked: 'Locked',
            locked_published: 'Published'
        }
        return labels[status]
    }

    function canEditEvent(event: Event): boolean {
        if (role === 'Admin') return true
        if (role === 'TabulationHead') {
            return event.event_status !== 'locked' && 
                   event.event_status !== 'locked_published'
        }
        return false
    }

    function canChangeStatus(event: Event): boolean {
        if (role === 'Admin') return true
        if (role === 'TabulationHead') {
            return event.event_status !== 'locked' && 
                   event.event_status !== 'locked_published'
        }
        return false
    }

    function editEvent(event: Event) {
    dispatch('editEvent', event);  // Instead of goto, dispatch an event
}

function openConfirmModal(event: Event) {
    dispatch('deleteEvent', event)  // Change to match the listener
}

    function handleStatusChange(event: CustomEvent<{ newStatus: EventStatus; eventId: string }>) {
        dispatch('statusChange', event.detail)
    }

    const dispatch = createEventDispatcher()
</script>

<Card>
    <CardHeader>
        <CardTitle>Event List</CardTitle>
    </CardHeader>
    <CardContent>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr>
                        <th class="text-left p-2">Event Name</th>
                        <th class="text-left p-2">Category</th>
                        <th class="text-left p-2">Medal Count</th>
                        <th class="text-center p-2">Status</th>
                        <th class="text-center p-2">Status Control</th>
                        <th class="text-left p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each events as event (event.id)}
                        <tr class:opacity-50={isProcessing[event.id]}>
                            <td class="p-2">{event.event_name}</td>
                            <td class="p-2">{event.category || 'N/A'}</td>
                            <td class="p-2">{event.medal_count !== null ? event.medal_count : 'N/A'}</td>
                            <td class="p-2 text-center">
                                <span class={getStatusBadgeClass(event.event_status)}>
                                    {formatStatusLabel(event.event_status)}
                                </span>
                            </td>
                            <td class="p-2">
                                {#if role === 'Admin' || role === 'TabulationHead'}
                                    <StatusControl
                                        status={event.event_status}
                                        eventId={event.id}
                                        isProcessing={isProcessing[event.id]}
                                        canChange={canChangeStatus(event)}
                                        userRole={role}
                                        on:statusChange={handleStatusChange}
                                    />
                                {/if}
                            </td>
                            <td class="p-2">
                                <div class="flex space-x-2">
                                    {#if canEditEvent(event)}
                                        <Button 
                                            on:click={() => editEvent(event)} 
                                            variant="outline" 
                                            size="sm"
                                        >
                                            Edit
                                        </Button>
                                    {/if}
                                    
                                    {#if role === 'Admin' && canEditEvent(event)}
                                        <Button 
                                            on:click={() => openConfirmModal(event)} 
                                            variant="destructive" 
                                            size="sm"
                                        >
                                            Delete
                                        </Button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                        {#if rowErrors[event.id]}
                            <tr>
                                <td colspan="6" class="p-2 bg-red-50">
                                    <div class="text-red-600 text-sm" transition:fade|local>
                                        {rowErrors[event.id]}
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    </CardContent>
</Card>