<!-- @migration-task Error while migrating Svelte code: `$:` is not allowed in runes mode, use `$derived` or `$effect` instead
https://svelte.dev/e/legacy_reactive_statement_invalid -->
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

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let searchQuery = '';
    let showPrintPreview = false;
    let selectedAttendees: Attendee[] = [];

    const filteredAttendees = $derived(data.attendees.filter(attendee => {
        const searchLower = searchQuery.toLowerCase();
        return (
            attendee.first_name.toLowerCase().includes(searchLower) ||
            attendee.last_name.toLowerCase().includes(searchLower) ||
            attendee.reference_code.toLowerCase().includes(searchLower)
        );
    }));

    function toggleAttendee(attendee: Attendee) {
        const index = selectedAttendees.findIndex(a => a.id === attendee.id);
        if (index === -1) {
            selectedAttendees = [...selectedAttendees, attendee];
        } else {
            selectedAttendees = selectedAttendees.filter(a => a.id !== attendee.id);
        }
    }

    function selectAll(checked: boolean) {
        selectedAttendees = checked ? [...filteredAttendees] : [];
    }
</script>

<svelte:head>
    <title>Name Tags - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Name Tags</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <Card class="mb-6">
        <div class="p-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-between mb-6">
                <div class="flex-1">
                    <Label for="search">Search Attendees</Label>
                    <Input
                        type="text"
                        id="search"
                        placeholder="Search by name or reference number"
                        bind:value={searchQuery}
                    />
                </div>
                <div class="flex items-end">
                    <Button
                        disabled={selectedAttendees.length === 0}
                        on:click={() => showPrintPreview = true}
                    >
                        Print Selected ({selectedAttendees.length})
                    </Button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead class="w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedAttendees.length === filteredAttendees.length}
                                    on:change={(e) => selectAll(e.currentTarget.checked)}
                                    class="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Reference Number</TableHead>
                            <TableHead>Ticket Type</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each filteredAttendees as attendee}
                            {@const isSelected = selectedAttendees.some(a => a.id === attendee.id)}
                            <TableRow class={cn(isSelected && "bg-primary/5")}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        on:change={() => toggleAttendee(attendee)}
                                        class="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </TableCell>
                                <TableCell>
                                    {attendee.first_name} {attendee.last_name}
                                </TableCell>
                                <TableCell>
                                    <code class="text-sm">{attendee.reference_code}</code>
                                </TableCell>
                                <TableCell>{attendee.ticket_type.name}</TableCell>
                                <TableCell>
                                    {#if attendee.is_paid}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Paid
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending
                                        </span>
                                    {/if}
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        </div>
    </Card>
</div>

{#if showPrintPreview}
    <PrintOutLayout
        attendees={selectedAttendees}
        eventName={data.event.event_name}
        onClose={() => showPrintPreview = false}
    />
{/if}
