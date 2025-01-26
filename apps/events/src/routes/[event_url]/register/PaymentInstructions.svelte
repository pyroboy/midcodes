<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import type { Event } from '$lib/types/database';

    export let event: Event;
    export let referenceCode: string;
    export let timeLeft: string;
</script>

<Card>
    <CardHeader>
        <CardTitle>Payment Instructions</CardTitle>
        <CardDescription>Please complete your payment within {timeLeft}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
        <div>
            <h3 class="text-base font-semibold mb-2">Reference Number</h3>
            <div class="bg-blue-50 p-3 rounded-lg text-center">
                <p class="font-mono text-xl sm:text-2xl font-bold text-blue-700 tracking-wider break-all">{referenceCode}</p>
            </div>
        </div>

        <div>
            <h3 class="text-base font-semibold mb-2">Payment Methods</h3>
            <div class="space-y-4">
                {#if event.payment_methods}
                    {#each Object.entries(event.payment_methods) as [method, details]}
                        <div class="border rounded-lg p-4">
                            <h4 class="font-medium mb-2 capitalize">{method}</h4>
                            <div class="space-y-2 text-sm">
                                {#each Object.entries(details) as [key, value]}
                                    <div class="grid grid-cols-2 gap-2">
                                        <span class="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span class="font-medium">{value}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>

        {#if event.payment_instructions}
            <div>
                <h3 class="text-base font-semibold mb-2">Additional Instructions</h3>
                <div class="prose prose-sm max-w-none">
                    {@html event.payment_instructions}
                </div>
            </div>
        {/if}
    </CardContent>
</Card>
