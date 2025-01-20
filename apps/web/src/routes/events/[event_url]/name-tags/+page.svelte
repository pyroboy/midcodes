<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { PrintStatusSchema } from './+page.server';
    import type { Attendee } from '$lib/types/database';
    import { Button } from '$lib/components/ui/button';
    import { Card } from '$lib/components/ui/card';
    import { Switch } from '$lib/components/ui/switch';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from '$lib/components/ui/table';
    import { cn } from '$lib/utils';
    import PrintOutLayout from '$lib/components/name-tag/PrintOutLayout.svelte';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const { form, enhance } = superForm<PrintStatusSchema>(data.form);

    let searchQuery = $state('');
    let showPrintedOnly = $state(false);
    let showUnprintedOnly = $state(true); // Default to showing unprinted only
    let selectedAttendees: Attendee[] = $state([]);
    let showPrintPreview = $state(false);

    // Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle print preview
    const openPrintPreview = (attendee: Attendee) => {
        selectedAttendees = [attendee];
        showPrintPreview = true;
    };

    // Handle print completion
    const handlePrinted = async () => {
        if (selectedAttendees.length > 0) {
            const attendee = selectedAttendees[0];
            $form.attendeeId = attendee.id;
            $form.isPrinted = true;
        }
    };



    // Filter attendees based on search and print status
    let filteredAttendees = $derived((data.attendees as Attendee[]).filter(attendee => {
        const matchesSearch = searchQuery === '' || 
            Object.values(attendee.basic_info).some(value => 
                value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            );
        
        const matchesPrintStatus = 
            (!showPrintedOnly && !showUnprintedOnly) ||
            (showPrintedOnly && attendee.is_printed) ||
            (showUnprintedOnly && !attendee.is_printed);
        
        return matchesSearch && matchesPrintStatus;
    }));
</script>

<svelte:head>
    <title>Name Tags - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Name Tags</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <!-- Print Summary Card -->
    <Card class="p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <h3 class="font-semibold text-lg mb-2">Total Attendees</h3>
                <p class="text-2xl font-bold text-primary">
                    {data.attendees.length}
                </p>
            </div>
            <div>
                <h3 class="font-semibold text-lg mb-2">Printed</h3>
                <p class="text-2xl font-bold text-green-600">
                    {data.attendees.filter(a => a.is_printed).length}
                </p>
            </div>
            <div>
                <h3 class="font-semibold text-lg mb-2">Not Printed</h3>
                <p class="text-2xl font-bold text-red-600">
                    {data.attendees.filter(a => !a.is_printed).length}
                </p>
            </div>
        </div>
    </Card>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1">
            <Input
                type="search"
                placeholder="Search attendees..."
                bind:value={searchQuery}
            />
        </div>
        <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
                <Switch bind:checked={showPrintedOnly} />
                <Label>Printed Only</Label>
            </div>
            <div class="flex items-center gap-2">
                <Switch bind:checked={showUnprintedOnly} />
                <Label>Not Printed Only</Label>
            </div>
        </div>
    </div>

    <!-- Attendees Table -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Print Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each filteredAttendees as attendee (attendee.id)}
                    <TableRow>
                        <TableCell>
                            {attendee.basic_info.firstName} {attendee.basic_info.lastName}
                        </TableCell>
                        <TableCell>{attendee.basic_info.email}</TableCell>
                        <TableCell>{attendee.basic_info.phone}</TableCell>
                        <TableCell>{attendee.ticket_info.type}</TableCell>
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <Switch
                                    checked={attendee.is_printed}
                                    onCheckedChange={(checked) => {
                                        $form.attendeeId = attendee.id;
                                        $form.isPrinted = checked;
                                    }}
                                />
                                <span class={cn(
                                    "text-sm font-medium",
                                    attendee.is_printed ? "text-green-600" : "text-red-600"
                                )}>
                                    {attendee.is_printed ? 'Printed' : 'Not Printed'}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span class="text-sm text-gray-600">
                                {formatDate(attendee.updated_at)}
                            </span>
                        </TableCell>
                        <TableCell>
                            <Button 
                                variant="outline" 
                                size="sm"
                                on:click={() => openPrintPreview(attendee)}
                            >
                                Print Preview
                            </Button>
                        </TableCell>
                    </TableRow>
                {:else}
                    <TableRow>
                        <TableCell colspan={7} class="text-center py-8 text-gray-500">
                            No attendees found
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>

<!-- Print Preview -->
{#if showPrintPreview}
    <PrintOutLayout
        attendees={selectedAttendees}
        eventName={data.event.event_name}
        onClose={() => showPrintPreview = false}
        onPrinted={handlePrinted}
    />
{/if}
