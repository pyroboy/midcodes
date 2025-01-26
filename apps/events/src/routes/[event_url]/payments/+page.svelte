<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { PaymentStatusSchema } from './+page.server';
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
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
    import { formatDateTime, formatCurrency } from '$lib/utils';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let searchQuery = '';

    const { form, enhance } = superForm<PaymentStatusSchema>(data.form);

    $: filteredPayments = data.payments.filter(payment => {
        const searchLower = searchQuery.toLowerCase();
        return (
            payment.attendee.first_name.toLowerCase().includes(searchLower) ||
            payment.attendee.last_name.toLowerCase().includes(searchLower) ||
            payment.attendee.reference_code.toLowerCase().includes(searchLower) ||
            payment.payment_reference.toLowerCase().includes(searchLower)
        );
    });
</script>

<svelte:head>
    <title>Payments - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Payment Management</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>Total amount from confirmed payments</CardDescription>
            </CardHeader>
            <CardContent>
                <p class="text-3xl font-bold">{formatCurrency(data.totalRevenue)}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>Number of pending payment verifications</CardDescription>
            </CardHeader>
            <CardContent>
                <p class="text-3xl font-bold">{data.pendingPayments}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Payment Success Rate</CardTitle>
                <CardDescription>Percentage of successful payments</CardDescription>
            </CardHeader>
            <CardContent>
                <p class="text-3xl font-bold">{data.successRate}%</p>
            </CardContent>
        </Card>
    </div>

    <Card>
        <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>View and manage payment records</CardDescription>
        </CardHeader>
        <CardContent>
            <div class="mb-6">
                <Label for="search">Search Payments</Label>
                <Input
                    type="text"
                    id="search"
                    placeholder="Search by name, reference number, or payment reference"
                    bind:value={searchQuery}
                />
            </div>

            <div class="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Attendee</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment Reference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each filteredPayments as payment}
                            <TableRow>
                                <TableCell>
                                    {formatDateTime(payment.created_at)}
                                </TableCell>
                                <TableCell>
                                    {payment.attendee.first_name} {payment.attendee.last_name}
                                </TableCell>
                                <TableCell>
                                    <code class="text-sm">{payment.attendee.reference_code}</code>
                                </TableCell>
                                <TableCell>
                                    {formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell>
                                    {#if payment.status === 'verified'}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Verified
                                        </span>
                                    {:else if payment.status === 'pending'}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Failed
                                        </span>
                                    {/if}
                                </TableCell>
                                <TableCell>
                                    <code class="text-sm">{payment.payment_reference}</code>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
</div>
