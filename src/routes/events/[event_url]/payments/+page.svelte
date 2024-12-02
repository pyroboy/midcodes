<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { PaymentUpdateSchema } from './+page.server';
    import type { Attendee } from '$lib/types/database';
    import type { SuperValidated } from 'sveltekit-superforms';
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
    import toast from 'svelte-french-toast';
    import { z } from 'zod';
    import { invalidateAll } from '$app/navigation';

    export let data: PageData;

    const { form, enhance } = superForm<z.infer<PaymentUpdateSchema>>(data.form, {
        onResult: async ({ result }) => {
            if (result.type === 'success') {
                await invalidateAll();
                toast.success('Payment status updated');
            } else if (result.type === 'error') {
                toast.error('Failed to update payment status');
            }
        },
        resetForm: false,
        applyAction: true,
        invalidateAll: true
    });

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

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

    let searchQuery = '';
    let showPaidOnly = false;
    let showUnpaidOnly = false;

    // Filter attendees based on search and payment status
    $: filteredAttendees = (data.attendees as any[]).filter(attendee => {
        const matchesSearch = searchQuery === '' || 
            Object.values(attendee.basic_info).some(value => 
                value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            );
        
        const matchesPaymentStatus = 
            (!showPaidOnly && !showUnpaidOnly) ||
            (showPaidOnly && attendee.is_paid) ||
            (showUnpaidOnly && !attendee.is_paid);
        
        return matchesSearch && matchesPaymentStatus;
    });

    // Handle payment toggle
    const handlePaymentToggle = async (attendeeId: string, isPaid: boolean) => {
        const userId = data.session?.user?.id;
        if (!userId) {
            toast.error('Please log in to update payment status');
            return;
        }
        
        form.update($form => ({
            ...$form,
            attendeeId,
            isPaid,
            receivedBy: userId
        }));
    };
</script>

<svelte:head>
    <title>Payment Management - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Payment Management</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <!-- Payment Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card class="p-6">
            <h3 class="font-semibold text-lg mb-2">Grand Total</h3>
            <p class="text-2xl font-bold text-primary">
                {formatCurrency(data.paymentSummary.grandTotal)}
            </p>
        </Card>
        
        <Card class="p-6">
            <h3 class="font-semibold text-lg mb-2">Total Paid</h3>
            <p class="text-2xl font-bold text-green-600">
                {formatCurrency(data.paymentSummary.totalPaid)}
            </p>
        </Card>
        
        <Card class="p-6">
            <h3 class="font-semibold text-lg mb-2">Total Unpaid</h3>
            <p class="text-2xl font-bold text-red-600">
                {formatCurrency(data.paymentSummary.totalUnpaid)}
            </p>
        </Card>
    </div>

    <!-- Receiver Summary -->
    {#if Object.keys(data.paymentSummary.totalByReceiver).length > 0}
        <Card class="p-6 mb-8">
            <h3 class="font-semibold text-lg mb-4">Payments by Receiver</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#each Object.entries(data.paymentSummary.totalByReceiver) as [receiver, amount]}
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="font-medium">{receiver}</p>
                        <p class="text-lg font-bold text-primary">{formatCurrency(amount)}</p>
                    </div>
                {/each}
            </div>
        </Card>
    {/if}

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
                <Switch bind:checked={showPaidOnly} />
                <Label>Paid Only</Label>
            </div>
            <div class="flex items-center gap-2">
                <Switch bind:checked={showUnpaidOnly} />
                <Label>Unpaid Only</Label>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Reference Link</TableHead>
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
                        <TableCell>{formatCurrency(attendee.ticket_info.price || 0)}</TableCell>
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <form
                                    method="POST"
                                    action="?/updatePayment"
                                    use:enhance
                                    class="flex items-center"
                                >
                                    <input type="hidden" name="attendeeId" value={attendee.id} />
                                    <input type="hidden" name="isPaid" value={!attendee.is_paid} />
                                    <input type="hidden" name="receivedBy" value={data.session?.user?.id ?? ''} />
                                    <button type="submit" class="w-full">
                                        <Switch
                                            checked={attendee.is_paid}
                                            onCheckedChange={() => {
                                                if (!data.session?.user?.id) {
                                                    toast.error('Please log in to update payment status');
                                                    return;
                                                }
                                            }}
                                        />
                                    </button>
                                </form>
                                <span class={cn(
                                    "text-sm font-medium",
                                    attendee.is_paid ? "text-green-600" : "text-red-600"
                                )}>
                                    {attendee.is_paid ? 'Paid' : 'Unpaid'}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span class="text-sm text-gray-600">
                                {attendee.received_by || '-'}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span class="text-sm text-gray-600">
                                {formatDate(attendee.updated_at)}
                            </span>
                        </TableCell>
                        <TableCell>
                            {#if attendee.reference_code_url}
                                <a 
                                    href="/{data.event.event_url}/{attendee.reference_code_url}" 
                                    class="text-primary hover:text-primary/80 underline"
                                >
                                    View Details
                                </a>
                            {:else}
                                <span class="text-gray-400">No Reference</span>
                            {/if}
                        </TableCell>
                    </TableRow>
                {:else}
                    <TableRow>
                        <TableCell colspan={9} class="text-center py-8 text-gray-500">
                            No attendees found
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>
