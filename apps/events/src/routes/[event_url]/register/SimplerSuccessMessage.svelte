<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Check } from 'lucide-svelte';

    export let referenceCode: string;
    export let eventName: string;
</script>

<Card>
    <CardHeader>
        <div class="flex items-center gap-3">
            <div class="rounded-full bg-green-100 p-2">
                <Check class="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Registration Successful!</CardTitle>
        </div>
        <CardDescription>
            You have successfully registered for {eventName}
        </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
        <div>
            <h3 class="text-base font-semibold mb-2">Reference Number</h3>
            <div class="bg-blue-50 p-3 rounded-lg text-center">
                <p class="font-mono text-xl sm:text-2xl font-bold text-blue-700 tracking-wider break-all">{referenceCode}</p>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm text-gray-600">
                Please save your reference number. You'll need it to:
            </p>
            <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Complete your payment</li>
                <li>Check your registration status</li>
                <li>Access your e-ticket after payment</li>
            </ul>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" class="flex-1" on:click={() => window.print()}>
                Print Reference
            </Button>
            <Button class="flex-1" on:click={() => window.location.href = `/events/${eventName}/${referenceCode}`}>
                View Details
            </Button>
        </div>
    </CardContent>
</Card>
