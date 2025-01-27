<script lang="ts">
    import { writable, type Writable } from 'svelte/store';
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import * as Select from "$lib/components/ui/select";
    import EventsFilter from './EventsFilter.svelte';
    import EventsTable from './EventsTable.svelte';
    import { invalidate } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import toast, { Toaster } from 'svelte-french-toast';
    import { troubleshootMedalTallySystem } from './troubleshoot';
    import Fuse from 'fuse.js';
    import { onMount } from 'svelte';
    export let data: PageData;
    import SecureDeleteDialog from './SecureDeleteDialog.svelte';



    let diagnosticResults: Awaited<ReturnType<typeof troubleshootMedalTallySystem>> | null = null;
    let isRunningDiagnostics = false;
    let troubleshootError: string | null = null;

    async function runDiagnostics() {
        isRunningDiagnostics = true;
        troubleshootError = null;
        
        try {
            diagnosticResults = await troubleshootMedalTallySystem(data.supabase);
            
            if (diagnosticResults.errors.length > 0) {
                toast.error(`Found ${diagnosticResults.errors.length} system issues`);
            } else {
                toast.success('All systems operational');
            }
        } catch (e) {
            troubleshootError = e instanceof Error ? e.message : 'Failed to run diagnostics';
            toast.error(troubleshootError);
        } finally {
            isRunningDiagnostics = false;
        }
    }

    onMount(() => {
        runDiagnostics();
    })




    const EVENT_CATEGORIES = [
        'Athletics',
        'Academics & Literary',
        'Music',
        'Dances',
        'E-Sports',
        'MMUB',
        'Special'
    ] as const;

    const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
    type EventStatus = (typeof EVENT_STATUSES)[number] | 'All';
    type EventCategory = (typeof EVENT_CATEGORIES)[number];

    interface EventData {
        id: string;
        event_name: string;
        medal_count: number | null;
        category: EventCategory;
        event_status: Exclude<EventStatus, 'All'>;
        updated_by?: string;
        created_at?: string;
        updated_at?: string;
    }

    let events: Writable<EventData[]> = writable(data.events || []);
    let isProcessing: Record<string, boolean> = {};
    let editingEvent: EventData | null = null;
    let rowErrors: Record<string, string> = {};
    const showConfirmModal = writable(false);

    // Search and filter state
    let searchQuery = "";
    let statusFilter: EventStatus = "All";
    
    const fuseOptions = {
        keys: ['event_name', 'category'],
        threshold: 0.3,
        ignoreLocation: true
    };

    $: fuse = new Fuse($events, fuseOptions);
    
    $: filteredEvents = (() => {
        let results = searchQuery ? 
            fuse.search(searchQuery).map(result => result.item) : 
            $events;

        if (statusFilter !== 'All') {
            results = results.filter(event => event.event_status === statusFilter);
        }

        return results;
    })();

    $: {
        if (data.events) {
            events.set(data.events);
        }
    }

    function isEventCategory(value: string): value is EventCategory {
        return EVENT_CATEGORIES.includes(value as EventCategory);
    }

    $: categorySelected = $form.category 
        ? { value: $form.category, label: $form.category }
        : { value: '', label: 'Select category' };

  // In your parent component where superForm is defined
  const { form, errors, enhance, reset, message } = superForm(data.form, {
    resetForm: true,
    onResult: async ({ result }) => {
        // Handle error result type
        if (result.type === 'error') {
            const errorMessage = result.error instanceof Error 
                ? result.error.message 
                : 'Failed to update event'
            toast.error(errorMessage)
            return
        }

        // Handle success and failure cases
        if (result.type === 'success' || result.type === 'failure') {
            const resultData = result.data

            // Check for server-side errors including materialized view errors
            if (resultData?.success === false || resultData?.error) {
                const errorMessage = resultData.message || 
                                   resultData.error || 
                                   'Failed to update event'
                toast.error(errorMessage)

                // Update form if provided
                if (resultData.form) {
                    form.set(resultData.form)
                }
                return
            }

            // Only show success if we have no errors
            if (result.type === 'success') {
                editingEvent = null
                await invalidate('events')
                events.update(currentEvents => {
                    return currentEvents.map(event => 
                        event.id === $form.id 
                            ? {
                                ...event,
                                event_name: $form.event_name,
                                category: $form.category,
                                medal_count: $form.medal_count,
                                event_status: $form.event_status
                            } 
                            : event
                    )
                })
                toast.success('Event updated successfully')
            }
        }
    },
    onError: (error) => {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred'
        toast.error(errorMessage)
    }
})

// Make sure your events store is reactive
$: {
    if (data.events) {
        events.set(data.events);
    }
}
async function handleStatusChange(event: CustomEvent<{ newStatus: Exclude<EventStatus, 'All'>; eventId: string }>) {
    const { newStatus, eventId } = event.detail;
    
    if (isProcessing[eventId]) return;

    try {
        isProcessing[eventId] = true;
        delete rowErrors[eventId];

        const currentEvent = $events.find(e => e.id === eventId);
        if (!currentEvent) throw new Error('Event not found');

        const formData = new FormData();
        formData.append('id', eventId);
        formData.append('event_status', newStatus);
        formData.append('event_name', currentEvent.event_name);
        formData.append('medal_count', String(currentEvent.medal_count ?? 0));
        formData.append('category', currentEvent.category);
        formData.append('isStatusUpdate', 'true');  // Add this line


        const response = await fetch('?/update', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success === false) {
            throw new Error(result.message || result.error || 'Failed to update status');
        }

        await invalidate('events');
        events.update(currentEvents => 
            currentEvents.map(e => 
                e.id === eventId ? { ...e, event_status: newStatus } : e
            )
        );
        
        toast.success(result.message || 'Status updated successfully');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
        rowErrors[eventId] = errorMessage;
        toast.error(errorMessage);
        
        events.update(e => e);
    } finally {
        isProcessing[eventId] = false;
    }
}
let deleteDialogOpen = false;
let eventToDelete: EventData | null = null;
async function handleConfirmDelete() {
    if (!eventToDelete) {
        deleteDialogOpen = false;
        return;
    }
    
    // Capture the ID before async operations
    const eventIdToDelete = eventToDelete.id;
    
    try {
        const formData = new FormData();
        formData.append('id', eventIdToDelete);

        const response = await fetch('?/delete', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Failed to delete event');
        }

        events.update(currentEvents => 
            currentEvents.filter(e => e.id !== eventIdToDelete)
        );
        await invalidate('events');
        toast.success('Event deleted successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(errorMessage);
    } finally {
        deleteDialogOpen = false;
        eventToDelete = null;
    }
}

function handleDelete(event: CustomEvent<EventData>) {
    console.log('Delete triggered:', event.detail);
    eventToDelete = event.detail;
    deleteDialogOpen = true;
    console.log('Dialog state:', deleteDialogOpen);
}

function editEvent(event: CustomEvent<EventData>) {
    editingEvent = { ...event.detail };
    
    // Explicitly set form values
    $form = {
        id: event.detail.id,
        event_name: event.detail.event_name,
        medal_count: event.detail.medal_count ?? 0,
        category: event.detail.category,
        event_status: event.detail.event_status
    };

    // Force update category selection
    categorySelected = {
        value: event.detail.category,
        label: event.detail.category
    };
}

    function cancelEdit() {
        editingEvent = null;
        reset();
    }


</script>

<div class="container mx-auto p-4 space-y-8">
    <Card>
        <CardHeader>
            <CardTitle>Events Management</CardTitle>
        </CardHeader>
        <CardContent>
            <form method="POST" use:enhance>
                {#if $message}
                    <div class="alert mb-4" class:error={$message.includes('error')} class:success={!$message.includes('error')}
                         transition:fade|local>
                        {$message}
                    </div>
                {/if}
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="space-y-2">
                        <Label for="event_name">Event Name</Label>
                        <Input id="event_name" name="event_name" bind:value={$form.event_name} />
                        {#if $errors.event_name}
                            <span class="text-red-500 text-sm" transition:fade|local>{$errors.event_name}</span>
                        {/if}
                    </div>
                    
                    <div class="space-y-2">
                        <Label for="medal_count">Medal Count</Label>
                        <Input id="medal_count" name="medal_count" type="number" bind:value={$form.medal_count} />
                        {#if $errors.medal_count}
                            <span class="text-red-500 text-sm" transition:fade|local>{$errors.medal_count}</span>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="category">Category</Label>
                        <Select.Root
                        selected={categorySelected}
                        onSelectedChange={(selection) => {
                            if (selection && isEventCategory(selection.value)) {
                                $form.category = selection.value;
                                categorySelected = { value: selection.value, label: selection.value };
                            }
                        }}
                    >
                        <Select.Trigger>
                            <Select.Value placeholder="Select category" />
                        </Select.Trigger>
                        <Select.Content>
                            {#each EVENT_CATEGORIES as category}
                                <Select.Item 
                                    value={category}
                                    label={category}
                                />
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    <input type="hidden" name="category" bind:value={$form.category} />
                    {#if $errors.category}
                        <span class="text-red-500 text-sm" transition:fade|local>{$errors.category}</span>
                    {/if}
                    </div>
                </div>

                {#if editingEvent}
                <input type="hidden" name="id" value={editingEvent.id} />
            {/if}
                
    <div class="flex space-x-2">
        <Button type="submit" formaction={editingEvent ? "?/update" : "?/create"}>
            {editingEvent ? 'Update Event' : 'Create Event'}
        </Button>
        {#if editingEvent}
            <Button type="button" variant="outline" on:click={cancelEdit}>Cancel</Button>
        {/if}
    </div>
            </form>
        </CardContent>
    </Card>

    <EventsFilter
    search={searchQuery}
    onSearchChange={(value) => searchQuery = value}
    status={statusFilter}
    onStatusChange={(value) => statusFilter = value}
/>

    <EventsTable 
        events={filteredEvents}
        role={data.role}
        {isProcessing}
        {rowErrors}
        on:statusChange={handleStatusChange}
        on:editEvent={editEvent}
        on:deleteEvent={handleDelete}
    />
    {#if deleteDialogOpen}
    <SecureDeleteDialog 
        open={true}
        eventName={eventToDelete?.event_name ?? ''}
        on:close={() => {
            deleteDialogOpen = false;
            eventToDelete = null;
        }}
        on:confirm={handleConfirmDelete}
    />
{/if}
    <Toaster />
</div>

<style>
    .alert {
        padding: 10px;
        border-radius: 4px;
    }
    .error {
        background-color: #f8d7da;
        color: #721c24;
    }
    .success {
        background-color: #d4edda;
        color: #155724;
    }
</style>