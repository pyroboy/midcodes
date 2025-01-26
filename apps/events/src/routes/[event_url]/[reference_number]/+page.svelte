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

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const { form, enhance, message } = superForm<EmailReceiptSchema>(data.form);
    let qrContainer: HTMLElement;
    let timeLeft = '';
    let timer: NodeJS.Timer;

    onMount(() => {
        updateTimeLeft();
        timer = setInterval(updateTimeLeft, 60000); // Update every minute
    });

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });

    function updateTimeLeft() {
        if (data.attendee.is_paid) {
            timeLeft = '';
            return;
        }

        const now = new Date();
        const deadline = new Date(data.attendee.payment_deadline);
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
            timeLeft = 'Expired';
            return;
        }

        const minutes = Math.floor(diff / 1000 / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            timeLeft = `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
        } else {
            timeLeft = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }
</script>

<svelte:head>
    <title>Registration Details - {data.event.event_name}</title>
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
                            <CardTitle class="text-xl sm:text-2xl">{data.event.event_name}</CardTitle>
                        </div>
                        <CardDescription>Registration Details</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <!-- QR Code -->
                        {#if data.attendee.is_paid}
                            <div class="flex flex-col items-center space-y-4">
                                <div class="flex justify-center">
                                    <div bind:this={qrContainer} class="qr-code">
                                        <img src={data.attendee.qr_code_url} alt="QR Code" class="w-48 h-48" />
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600">Show this QR code at the event entrance</p>
                            </div>
                        {:else}
                            <!-- Reference Number for unpaid tickets -->
                            <div class="text-center py-3 bg-blue-50 rounded-lg">
                                <p class="text-xs sm:text-sm text-blue-600 font-medium mb-1">Reference Number</p>
                                <p class="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tracking-wider break-all px-4">{data.attendee.reference_code}</p>
                            </div>
                        {/if}

                        <!-- Attendee Details -->
                        <div>
                            <h3 class="text-base sm:text-lg font-semibold mb-2">Attendee Information</h3>
                            <div class="space-y-2">
                                <div class="grid grid-cols-2 gap-2">
                                    <span class="text-gray-600">Name</span>
                                    <span class="font-medium">{data.attendee.first_name} {data.attendee.last_name}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <span class="text-gray-600">Email</span>
                                    <span class="font-medium">{data.attendee.email}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <span class="text-gray-600">Phone</span>
                                    <span class="font-medium">{data.attendee.phone}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <span class="text-gray-600">Ticket Type</span>
                                    <span class="font-medium">{data.attendee.ticket_type.name}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Status -->
                        <div>
                            <h3 class="text-base sm:text-lg font-semibold mb-2">Payment Status</h3>
                            <div class="flex items-center gap-2">
                                <div class={`w-2.5 h-2.5 rounded-full ${data.attendee.is_paid ? 'bg-green-500' : timeLeft === 'Expired' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                <span class={`text-sm sm:text-base font-medium ${data.attendee.is_paid ? 'text-green-600' : timeLeft === 'Expired' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {#if data.attendee.is_paid}
                                        Paid
                                    {:else if timeLeft === 'Expired'}
                                        Payment Expired
                                    {:else}
                                        Pending Payment ({timeLeft} left)
                                    {/if}
                                </span>
                            </div>
                        </div>

                        <!-- Email Receipt Form -->
                        {#if data.attendee.is_paid}
                            <form method="POST" use:enhance class="space-y-4">
                                <div>
                                    <Label for="email">Email Receipt</Label>
                                    <div class="flex gap-2">
                                        <Input
                                            type="email"
                                            id="email"
                                            name="email"
                                            bind:value={$form.email}
                                            placeholder="Enter email address"
                                        />
                                        <Button type="submit">
                                            Send
                                        </Button>
                                    </div>
                                </div>
                                {#if $message}
                                    <p class="text-sm text-green-600">{$message}</p>
                                {/if}
                            </form>
                        {/if}
                    </CardContent>
                </Card>
            </div>

            <!-- Right Column - Payment Instructions -->
            {#if !data.attendee.is_paid}
                <div id="payment-instructions" class="h-full scroll-mt-4">
                    <PaymentInstructions
                        event={data.event}
                        referenceCode={data.attendee.reference_code}
                        timeLeft={timeLeft}
                    />
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
