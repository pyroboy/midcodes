<script lang="ts">
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import type { EmailReceiptSchema } from './+page.server';
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import PaymentInstructions from '../register/PaymentInstructions.svelte';
    import { Check, Clock, AlertTriangle } from 'lucide-svelte';

    export let data: PageData;

    const { form, enhance, message } = superForm<EmailReceiptSchema>(data.form);
    let qrContainer;

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

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    // Payment timeout countdown
    function getTimeLeft(createdAt: string, timeoutMinutes: number) {
        const createdTime = new Date(createdAt).getTime();
        const timeoutTime = createdTime + (timeoutMinutes * 60 * 1000);
        const now = new Date().getTime();
        return Math.max(0, timeoutTime - now);
    }

    function formatTimeLeft(ms: number) {
        if (ms <= 0) return 'Expired';
        
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        // Only show timer if less than 60 minutes remaining
        if (days === 0 && hours === 0 && minutes >= 60) return '';

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0 || days > 0) timeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;

        return timeString.trim();
    }

    let timeLeft = '';
    let countdownInterval: number;

    onMount(() => {
        if (!data.attendee.is_paid) {
            countdownInterval = window.setInterval(() => {
                const newTimeLeft = formatTimeLeft(
                    getTimeLeft(
                        data.attendee.created_at,
                        data.event.payment_timeout_minutes || 60
                    )
                );
                // Only update if we have a value to show (less than 60 mins) or if expired
                if (newTimeLeft === 'Expired' || newTimeLeft !== '') {
                    timeLeft = newTimeLeft;
                }
            }, 1000);
        }
    });

    onDestroy(() => {
        if (countdownInterval) clearInterval(countdownInterval);
    });

    $: amount = data.attendee.ticket_info.price?.toString() || '0';
</script>

<svelte:head>
    <title>Attendee Details - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="max-w-5xl mx-auto">
        <!-- Main Content Grid -->
        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Left Column - QR and Details -->
            <div class="space-y-6">
                <Card>
                    <CardHeader>
                        <div class="flex items-center gap-3 mb-2">
                     
                            <CardTitle class="text-2xl">{data.event.event_name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent class="space-y-6">
                        <!-- QR Code -->
                        {#if data.attendee.is_paid}
                            <div class="flex flex-col items-center space-y-6">
                                <div class="flex justify-center">
                                    <img 
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={data.attendee.reference_code_url}"
                                        alt="Registration QR Code"
                                        class="w-48 h-48 lg:w-64 lg:h-64 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <!-- Debug info - will remove after fixing -->
                         
                                <!-- Reference Number -->
                                <div class="text-center py-4 bg-blue-50 rounded-lg w-full">
                                    <p class="text-sm text-blue-600 font-medium mb-1">Reference Number</p>
                                    <p class="font-mono text-3xl lg:text-4xl font-bold text-blue-700 tracking-wider break-all px-4">{data.attendee.reference_code_url}</p>
                                </div>

                                <p class="text-sm text-gray-600 text-center">
                                    Use this QR code for event check-in
                                </p>

                                <!-- Timer/Link section -->
                                <div class="text-center">
                                    <a
                                        href="/{$page.params.event_url}/{data.attendee.reference_code_url}"
                                        class="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View your ticket
                                    </a>
                                </div>
                            </div>
                        {:else}
                            <!-- Reference Number for unpaid tickets -->
                            <div class="text-center py-4 bg-blue-50 rounded-lg">
                                <p class="text-sm text-blue-600 font-medium mb-1">Reference Number</p>
                                <p class="font-mono text-3xl lg:text-4xl font-bold text-blue-700 tracking-wider break-all px-4">{data.attendee.reference_code_url}</p>
                                
                                <!-- Payment Countdown -->
                                {#if timeLeft !== ''}
                                    <div class="mt-4 flex flex-col items-center gap-2">
                                        <div class="flex items-center gap-2">
                                            {#if timeLeft === 'Expired'}
                                                <AlertTriangle class="w-5 h-5 text-red-500" />
                                                <span class="text-red-600 font-medium">Registration Expired</span>
                                            {:else}
                                                <Clock class="w-5 h-5 text-yellow-500" />
                                                <span class="text-yellow-600 font-medium">Time remaining to pay:</span>
                                            {/if}
                                        </div>
                                        <div class={`text-2xl font-mono font-bold ${timeLeft === 'Expired' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {timeLeft || '...'}
                                        </div>
                                        {#if timeLeft === 'Expired'}
                                            <p class="text-sm text-red-600 mt-2">
                                                Your registration has expired. Please register again to get a new slot.
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Attendee Info -->
                        <div>
                            <h3 class="text-lg font-semibold mb-2">Attendee Information</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Name</Label>
                                    <p class="text-lg font-medium">
                                        {data.attendee.basic_info.firstName} {data.attendee.basic_info.lastName}
                                    </p>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <p class="text-lg break-all">{data.attendee.basic_info.email}</p>
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <p class="text-lg">{data.attendee.basic_info.phone}</p>
                                </div>
                                <div>
                                    <Label>Ticket Type</Label>
                                    <p class="text-lg">{data.attendee.ticket_info.type}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Status -->
                        <div>
                            <h3 class="text-lg font-semibold mb-2">Payment Status</h3>
                            <div class="flex items-center gap-2">
                                <div class={`w-3 h-3 rounded-full ${data.attendee.is_paid ? 'bg-green-500' : timeLeft === 'Expired' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                <span class={`font-medium ${data.attendee.is_paid ? 'text-green-600' : timeLeft === 'Expired' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {data.attendee.is_paid ? 'Paid' : timeLeft === 'Expired' ? 'Expired' : 'Payment Pending'}
                                </span>
                            </div>
                            {#if data.attendee.is_paid}
                                <p class="text-sm text-gray-600 mt-1">
                                    Amount Paid: {formatCurrency(data.attendee.ticket_info.price || 0)}
                                </p>
                                <p class="text-sm text-gray-600">
                                    Date: {formatDate(data.attendee.updated_at)}
                                </p>
                            {/if}
                        </div>

                        <!-- Email Receipt Form -->
                        {#if data.attendee.is_paid}
                            <div>
                                <h3 class="text-lg font-semibold mb-2">Email Receipt</h3>
                                <form method="POST" action="?/sendReceipt" use:enhance>
                                    <div class="flex gap-4">
                                        <div class="flex-1">
                                            <Input
                                                type="email"
                                                name="email"
                                                placeholder="Enter email address"
                                                bind:value={$form.email}
                                            />
                                        </div>
                                        <Button type="submit">Send Receipt</Button>
                                    </div>
                                    {#if $message}
                                        <p class="text-sm mt-2" class:text-green-600={$message.success} class:text-red-600={!$message.success}>
                                            {$message.text}
                                        </p>
                                    {/if}
                                </form>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column - Payment Instructions -->
            {#if !data.attendee.is_paid}
                <div class="h-full">
                    <PaymentInstructions amount={amount} referenceCode={data.attendee.reference_code_url} />
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Hide scrollbar for Chrome, Safari and Opera */
    .overflow-y-auto::-webkit-scrollbar {
        display: none;
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    .overflow-y-auto {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
</style>
