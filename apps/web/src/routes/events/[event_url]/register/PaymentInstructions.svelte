<script lang="ts">
    import { CreditCard, Camera, Smartphone, MapPin, AlertCircle } from 'lucide-svelte';
    import { onMount } from 'svelte';
    
    interface Props {
        amount: string;
        referenceCode: string;
    }

    let { amount, referenceCode }: Props = $props();

    let visible = $state(false);
    let gcashVisible = $state(false);
    let onsiteVisible = $state(false);
    let importantVisible = $state(false);

    onMount(() => {
        setTimeout(() => visible = true, 500);
        setTimeout(() => gcashVisible = true, 1000);
        setTimeout(() => onsiteVisible = true, 2000);
        setTimeout(() => importantVisible = true, 3000);
    });
</script>

<div class="bg-yellow-50 rounded-lg p-4 space-y-3 h-full overflow-y-auto">
    <div class="flex items-center gap-2 text-yellow-800 font-semibold animate-in fade-in slide-in-from-right duration-500">
        <CreditCard size={20} />
        <h3>Payment Instructions</h3>
    </div>
    {#if visible}
    <div class="space-y-2 text-sm text-yellow-700 animate-in fade-in slide-in-from-right duration-300">
        <p>Please complete your payment within 24 hours to secure your registration.</p>
        <div class="space-y-1">
            <p class="font-medium">Payment Methods:</p>
            <div class="space-y-4">
                <!-- GCash Instructions -->
                {#if gcashVisible}
                <div class="bg-white rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-right duration-500">
                    <div class="flex items-center gap-2 mb-2">
                        <Smartphone size={18} class="text-blue-500" />
                        <h4 class="font-medium text-blue-900">GCash Payment</h4>
                    </div>
                    <ol class="list-decimal list-inside space-y-2 text-gray-700 [&>li]:animate-in [&>li]:fade-in [&>li]:slide-in-from-right [&>li]:duration-300">
                        <li style="animation-delay: 100ms">Open your GCash app</li>
                        <li style="animation-delay: 200ms">Tap "Send Money"</li>
                        <li style="animation-delay: 300ms">Enter number: <span class="font-mono font-medium">0935 -079-4880</span></li>
                        <li style="animation-delay: 400ms">Enter amount: <span class="font-medium">₱{amount}</span></li>
                        <li style="animation-delay: 500ms">In the message field, type: <span class="font-mono font-medium">{referenceCode}</span></li>
                        <li style="animation-delay: 600ms">Take a screenshot of the payment confirmation</li>
                    </ol>
                    <div class="mt-2 flex items-center gap-1 text-xs text-blue-600">
                        <Camera size={14} />
                        <p>Remember to screenshot your payment!</p>
                    </div>
                </div>
                {/if}

                <!-- Onsite Payment Instructions -->
                {#if onsiteVisible}
                <div class="bg-white rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-right duration-500">
                    <div class="flex items-center gap-2 mb-2">
                        <MapPin size={18} class="text-blue-500" />
                        <h4 class="font-medium text-blue-900">Onsite Registration</h4>
                    </div>
                    <ol class="list-decimal list-inside space-y-2 text-gray-700 [&>li]:animate-in [&>li]:fade-in [&>li]:slide-in-from-right [&>li]:duration-300">
                        <li style="animation-delay: 100ms">Visit our registration booth at the venue</li>
                        <li style="animation-delay: 200ms">Present your reference code: <span class="font-mono font-medium">{referenceCode}</span></li>
                        <li style="animation-delay: 300ms">Pay the amount: <span class="font-medium">₱{amount}</span></li>
                        <li style="animation-delay: 400ms">Collect your official receipt</li>
                        <li style="animation-delay: 500ms">Get your event materials and ID</li>
                    </ol>
                    <div class="mt-2 flex items-center gap-1 text-xs text-blue-600">
                        <MapPin size={14} />
                        <p>Registration booth opens 1 hour before the event</p>
                    </div>
                </div>
                {/if}
            </div>
        </div>

        <!-- Important Note -->
        {#if importantVisible}
        <div class="flex items-start gap-2 bg-white p-3 rounded-lg mt-3 shadow-sm animate-in fade-in slide-in-from-right duration-500">
            <AlertCircle size={18} class="text-yellow-600 shrink-0 mt-0.5" />
            <div class="space-y-1">
                <p class="font-medium text-yellow-800">Important:</p>
                <ul class="list-disc list-inside text-yellow-700 space-y-1 [&>li]:animate-in [&>li]:fade-in [&>li]:slide-in-from-right [&>li]:duration-300">
                    <li style="animation-delay: 100ms">Keep your reference number for registration</li>
                    <li style="animation-delay: 200ms">For GCash payments, keep your payment screenshot</li>
                    <li style="animation-delay: 300ms">Arrive early to avoid registration queues</li>
                </ul>
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>