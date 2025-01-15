<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { PaymentUpdateSchema, PaymentSummary } from './+page.server';
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
    import { invalidate } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import { AlertTriangle, Check, Clock, Trash2 } from 'lucide-svelte';

    export let data: PageData;

    const { form, enhance } = superForm<z.infer<PaymentUpdateSchema>>(data.form, {
        onSubmit: ({ formData }) => {
            isUpdating = true;
            const formValues = Object.fromEntries(formData);
            console.log('[Client] Form data being submitted:', formValues);
            return true;
        },
        onResult: async ({ result }) => {
            console.log('[Client] Form submission result:', result);
            if (result.type === 'success') {
                // Invalidate both the attendees and payment summary data
                await Promise.all([
                    invalidate('app:attendees'),
                    invalidate('app:payment-summary')
                ]);
                toast.success('Payment status updated');
            } else if (result.type === 'error') {
                if (result.error === 'PAYMENT_EXPIRED') {
                    toast.error('Payment window has expired. Registration must be done again.');
                } else {
                    toast.error('Failed to update payment status');
                }
            }
            setTimeout(() => {
                isUpdating = false;
            }, 2000); // Small delay to ensure the UI updates are smooth
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
    let showArchived = false;
    let isUpdating = false;

    // Filter attendees based on search and payment status
    $: filteredAttendees = data.attendees
        .filter(attendee => 
            // Handle archived entries based on toggle
            (showArchived || attendee.attendance_status !== 'archived') &&
            // Apply search filter
            (!searchQuery || 
                attendee.basic_info.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                attendee.basic_info.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                attendee.basic_info.email?.toLowerCase().includes(searchQuery.toLowerCase())
            ) &&
            // Apply paid filter
            (!showPaidOnly || attendee.is_paid) &&
            (!showUnpaidOnly || !attendee.is_paid)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Get count of archived entries
    $: archivedCount = data.attendees.filter(a => a.attendance_status === 'archived').length;

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

    // Timer state
    let timers: { [key: string]: { timeLeft: string; interval: ReturnType<typeof setInterval>; isExpired: boolean } } = {};

    function calculateTimeLeft(createdAt: string) {
        const created = new Date(createdAt).getTime();
        const now = new Date().getTime();
        const timeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const timeLeft = created + timeLimit - now;

        if (timeLeft <= 0) return '00:00:00';

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function startTimer(attendeeId: string, createdAt: string) {
        if (timers[attendeeId]) return;

        const interval = setInterval(() => {
            const timeLeft = calculateTimeLeft(createdAt);
            timers[attendeeId] = { ...timers[attendeeId], timeLeft };
            
            if (timeLeft === '00:00:00') {
                clearInterval(timers[attendeeId].interval);
                timers[attendeeId].isExpired = true;
                timers = { ...timers }; // Trigger reactivity
            }
        }, 1000);

        timers[attendeeId] = {
            timeLeft: calculateTimeLeft(createdAt),
            interval,
            isExpired: false
        };
    }

    onMount(() => {
        // Start timers for all unpaid registrations
        filteredAttendees.forEach(attendee => {
            if (!attendee.is_paid && attendee.attendance_status !== 'expired' && attendee.attendance_status !== 'archived') {
                startTimer(attendee.id, attendee.created_at);
            }
        });
    });

    onDestroy(() => {
        // Clean up all intervals
        Object.values(timers).forEach(timer => {
            clearInterval(timer.interval);
        });
    });

    function getStatusDisplay(attendee: any) {
        if (attendee.attendance_status === 'expired') {
            return {
                text: 'Expired',
                classes: 'bg-red-100 text-red-800',
                icon: AlertTriangle
            };
        }
        return attendee.is_paid 
            ? { text: 'Paid', classes: 'bg-green-100 text-green-800', icon: Check }
            : { text: 'Pending', classes: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }

    const paymentsByReceiver: Record<string, number> = data.paymentSummary.totalByReceiver;

    $: expiredIds = filteredAttendees
        .filter(attendee => {
            const timer = timers[attendee.id];
            return (timer?.timeLeft && Number(timer.timeLeft) <= 0) || timer?.isExpired || attendee.attendance_status === 'expired';
        })
        .map(attendee => attendee.id);

    async function handleClearExpired() {
        if (!expiredIds.length) return;

        console.log('[Client] Clearing expired entries:', { expiredIds });

        try {
            const formData = new FormData();
            formData.append('attendeeIds', JSON.stringify(expiredIds));

            const result = await fetch(`?/clearExpired`, {
                method: 'POST',
                body: formData
            });

            const response = await result.json();
            
            if (result.ok) {
                console.log('[Client] Successfully cleared expired entries');
                toast.success('Successfully cleared expired entries');
                window.location.reload();
            } else {
                console.error('[Client] Failed to clear expired entries:', response);
                toast.error(response.message || 'Failed to clear expired entries');
            }
        } catch (error) {
            console.error('[Client] Error clearing expired entries:', error);
            toast.error('Failed to clear expired entries');
        }
    }
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card class="p-6">
            <h3 class="font-semibold text-lg mb-2">Total Attendees</h3>
            <p class="text-2xl font-bold text-primary">
                {data.attendees.length}
            </p>
        </Card>
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

<!-- Payment Summary Section -->
{#if Object.keys(paymentsByReceiver).length > 0}
    <div class="container mx-auto px-4 pb-8">
        <Card class="p-6">
            <h3 class="font-semibold text-lg mb-4">Payments by Receiver</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each Object.entries(paymentsByReceiver) as [receiver, amount]}
                    <div class="bg-gray-50 p-4 rounded-lg relative {isUpdating ? 'opacity-50' : ''}">
                        {#if isUpdating}
                            <div class="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        {/if}
                        <p class="text-sm text-gray-600 mb-1">Receiver</p>
                        <p class="font-medium mb-2">{receiver}</p>
                        <p class="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p class="text-lg font-bold text-primary">{formatCurrency(amount)}</p>
                    </div>
                {/each}
            </div>
        </Card>
    </div>
{/if}

    <!-- Filters -->
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
            <Input
                type="search"
                placeholder="Search attendees..."
                bind:value={searchQuery}
                class="w-[300px]"
            />
            {#if expiredIds.length > 0}
                <Button
                    variant="destructive"
                    size="sm"
                    on:click={handleClearExpired}
                    class="flex items-center gap-2"
                >
                    <Trash2 class="w-4 h-4" />
                    Clear {expiredIds.length} Expired {expiredIds.length === 1 ? 'Entry' : 'Entries'}
                </Button>
            {/if}
        </div>
        <div class="flex items-center gap-2">
            <div class="flex items-center gap-2">
                <Switch bind:checked={showPaidOnly} />
                <Label>Paid Only</Label>
            </div>
            <div class="flex items-center gap-2">
                <Switch bind:checked={showUnpaidOnly} />
                <Label>Unpaid Only</Label>
            </div>
            <div class="flex items-center gap-2">
                <Switch bind:checked={showArchived} />
                <Label>Show Archived ({archivedCount})</Label>
                {#if showArchived && archivedCount > 0}
                    <form action="?/deleteAllArchived" method="POST" use:enhance>
                        <input type="hidden" name="eventUrl" value={data.event.url} />
                        <Button
                            variant="destructive"
                            size="sm"
                            class="flex items-center gap-2"
                        >
                            <Trash2 class="w-3 h-3" />
                            Delete All Archives
                        </Button>
                    </form>
                {/if}
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
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead class="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each filteredAttendees as attendee (attendee.id)}
                    <TableRow>
                        <TableCell>
                            {attendee.basic_info.firstName} {attendee.basic_info.lastName}
                        </TableCell>
                        <TableCell>{attendee.basic_info.email}</TableCell>
                        <TableCell>{attendee.ticket_info.type}</TableCell>
                        <TableCell>{formatCurrency(attendee.ticket_info.price || 0)}</TableCell>
                        <TableCell>
                            {#if attendee.reference_code_url}
                            <a 
                            href="/events/{data.event.event_url}/{attendee.reference_code_url}" 
                            class="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {attendee.reference_code_url}
                        </a>
                            {:else}
                                -
                            {/if}
                        </TableCell>

                        <TableCell>
                            {formatDate(attendee.created_at)}
                        </TableCell>
                        <TableCell>
                            {#if attendee.attendance_status === 'expired' || (timers[attendee.id]?.isExpired)}
                                <div class="flex items-center gap-2">
                                    <AlertTriangle class="w-4 h-4 text-red-500" />
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                        Expired
                                    </span>
                                </div>
                            {:else if attendee.attendance_status === 'archived'}
                                <div class="flex items-center gap-2">
                                    <AlertTriangle class="w-4 h-4 text-gray-500" />
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                        Archived
                                    </span>
                                </div>
                            {:else}
                                <div class="flex items-center gap-2">
                                    <svelte:component 
                                        this={attendee.is_paid ? Check : Clock} 
                                        class="w-4 h-4 {attendee.is_paid ? 'text-green-500' : 'text-yellow-500'}" 
                                    />
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold {attendee.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                        {attendee.is_paid ? 'Paid' : 'Pending'}
                                    </span>
                                    {#if !attendee.is_paid && timers[attendee.id] && !timers[attendee.id].isExpired}
                                        <span class="text-sm {timers[attendee.id].timeLeft === '00:00:00' ? 'text-red-600 font-semibold' : 'text-gray-600'}">
                                            ({timers[attendee.id].timeLeft})
                                        </span>
                                    {/if}
                                </div>
                            {/if}
                        </TableCell>
                        <TableCell class="text-right">
                            {#if !attendee.is_paid && attendee.attendance_status !== 'expired' && attendee.attendance_status !== 'archived'}
                                <form
                                    method="POST"
                                    action="?/updatePayment"
                                    use:enhance
                                    class="flex items-center justify-end"
                                >
                                    <input type="hidden" name="attendeeId" value={attendee.id} />
                                    <input type="hidden" name="receivedBy" value={data.session?.user?.id} />
                                    <Button 
                                        type="submit" 
                                        variant="outline" 
                                        size="sm"
                                        disabled={!data.session?.user?.id}
                                        class="relative"
                                    >
                                        <div class="flex items-center">
                                            <Check class="w-4 h-4 mr-2" />
                                            Confirm Payment
                                        </div>
                                    </Button>
                                </form>
                            {/if}
                        </TableCell>
                    </TableRow>
                {:else}
                    <TableRow>
                        <TableCell colspan={10} class="text-center py-8 text-gray-500">
                            No attendees found
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>
