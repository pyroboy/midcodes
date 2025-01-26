<script lang="ts">
    import type { PageData } from './$types';
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { formatDateTime, formatCurrency } from '$lib/utils';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    $: registrationOpen = new Date() >= new Date(data.event.registration_start) && 
                         new Date() <= new Date(data.event.registration_end);

    $: eventStarted = new Date() >= new Date(data.event.start_date);
    $: eventEnded = new Date() >= new Date(data.event.end_date);
</script>

<svelte:head>
    <title>{data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <!-- Event Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-2">{data.event.event_name}</h1>
            {#if data.event.long_name}
                <p class="text-xl text-gray-600 mb-4">{data.event.long_name}</p>
            {/if}
            {#if data.event.description}
                <div class="prose max-w-none">
                    {@html data.event.description}
                </div>
            {/if}
        </div>

        <!-- Event Status -->
        <Card class="mb-8">
            <CardHeader>
                <CardTitle>Event Status</CardTitle>
                <CardDescription>Important dates and registration information</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Event Period</h3>
                        <p class="mt-1">
                            {formatDateTime(data.event.start_date)} to {formatDateTime(data.event.end_date)}
                        </p>
                        <div class="mt-2">
                            {#if eventEnded}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Event Ended
                                </span>
                            {:else if eventStarted}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Event Ongoing
                                </span>
                            {:else}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Upcoming
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Registration Period</h3>
                        <p class="mt-1">
                            {formatDateTime(data.event.registration_start)} to {formatDateTime(data.event.registration_end)}
                        </p>
                        <div class="mt-2">
                            {#if registrationOpen}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Registration Open
                                </span>
                            {:else if new Date() < new Date(data.event.registration_start)}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Registration Not Started
                                </span>
                            {:else}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Registration Closed
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Ticket Types -->
        <Card class="mb-8">
            <CardHeader>
                <CardTitle>Available Tickets</CardTitle>
                <CardDescription>Select from our available ticket types</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="space-y-4">
                    {#each data.ticketTypes as ticket}
                        {@const available = ticket.quantity - ticket.sold}
                        <div class="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h3 class="font-medium">{ticket.name}</h3>
                                {#if ticket.description}
                                    <p class="text-sm text-gray-600">{ticket.description}</p>
                                {/if}
                                <div class="mt-1 text-sm">
                                    {#if available > 0}
                                        <span class="text-green-600">{available} tickets available</span>
                                    {:else}
                                        <span class="text-red-600">Sold Out</span>
                                    {/if}
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-bold">{formatCurrency(ticket.price)}</p>
                            </div>
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if registrationOpen}
                <Button href="/{data.event.url}/register" class="flex-1 max-w-xs">
                    Register Now
                </Button>
            {/if}
            <Button href="/{data.event.url}/qr-checker" variant="outline" class="flex-1 max-w-xs">
                QR Scanner
            </Button>
            <Button href="/{data.event.url}/name-tags" variant="outline" class="flex-1 max-w-xs">
                Name Tags
            </Button>
        </div>
    </div>
</div>
