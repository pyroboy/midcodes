<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { TestAttendeeSchema } from './+page.server';
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '$lib/components/ui/select';
    import { formatCurrency } from '$lib/utils';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const { form, enhance, errors, message } = superForm<TestAttendeeSchema>(data.form);
</script>

<svelte:head>
    <title>Test Registration - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Test Registration</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <Card class="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create Test Attendee</CardTitle>
            <CardDescription>Create a test registration with specified payment status</CardDescription>
        </CardHeader>
        <CardContent>
            <form method="POST" use:enhance class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <Label for="ticket_type_id">Ticket Type</Label>
                        <Select name="ticket_type_id" bind:value={$form.ticket_type_id}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                                {#each data.ticketTypes as ticket}
                                    <SelectItem value={ticket.id}>
                                        {ticket.name} - {formatCurrency(ticket.price)}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                        {#if $errors.ticket_type_id}
                            <p class="text-sm text-red-500 mt-1">{$errors.ticket_type_id}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="first_name">First Name</Label>
                        <Input
                            type="text"
                            id="first_name"
                            name="first_name"
                            bind:value={$form.first_name}
                        />
                        {#if $errors.first_name}
                            <p class="text-sm text-red-500 mt-1">{$errors.first_name}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="last_name">Last Name</Label>
                        <Input
                            type="text"
                            id="last_name"
                            name="last_name"
                            bind:value={$form.last_name}
                        />
                        {#if $errors.last_name}
                            <p class="text-sm text-red-500 mt-1">{$errors.last_name}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="email">Email</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            bind:value={$form.email}
                        />
                        {#if $errors.email}
                            <p class="text-sm text-red-500 mt-1">{$errors.email}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="phone">Phone</Label>
                        <Input
                            type="tel"
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                        />
                        {#if $errors.phone}
                            <p class="text-sm text-red-500 mt-1">{$errors.phone}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="payment_status">Payment Status</Label>
                        <Select name="payment_status" bind:value={$form.payment_status}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        {#if $errors.payment_status}
                            <p class="text-sm text-red-500 mt-1">{$errors.payment_status}</p>
                        {/if}
                    </div>
                </div>

                {#if $message}
                    <div class="p-4 rounded-lg bg-green-50 text-green-700">
                        {$message}
                    </div>
                {/if}

                <Button type="submit" class="w-full">Create Test Attendee</Button>
            </form>
        </CardContent>
    </Card>
</div>
