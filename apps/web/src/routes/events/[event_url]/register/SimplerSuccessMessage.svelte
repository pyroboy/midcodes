<script lang="ts">
    import { Check } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import type { RegistrationResponse } from './schema';
    
    interface Props {
        data: RegistrationResponse;
    }

    let { data }: Props = $props();
    
    let visible = $state(false);
    let showCheck = $state(false);
    let showText = $state(false);
    let typedText = $state('');
    const fullText = `Please complete payment within ${data.paymentTimeoutMinutes} minutes`;
    
    onMount(() => {
        visible = true;
        setTimeout(() => showCheck = true, 300);
        setTimeout(() => showText = true, 1000);
        
        let currentChar = 0;
        const typeInterval = setInterval(() => {
            if (currentChar < fullText.length) {
                typedText = fullText.slice(0, currentChar + 1);
                currentChar++;
            } else {
                clearInterval(typeInterval);
            }
        }, 50);
        
        return () => clearInterval(typeInterval);
    });
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    class:opacity-0={!visible}
    class:opacity-100={visible}
    transition:fade={{ duration: 200 }}>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-12 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        <!-- Success Check Animation -->
        <div class="relative w-32 h-32 mb-8">
            <div class="absolute inset-0 bg-green-100 rounded-full scale-0 animate-in zoom-in duration-500 delay-300"
                class:scale-100={showCheck}></div>
            <div class="absolute inset-0 flex items-center justify-center opacity-0 scale-50"
                class:opacity-100={showCheck}
                class:scale-100={showCheck}
                style="transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s">
                <Check class="w-16 h-16 text-green-600 stroke-[3]" />
            </div>
        </div>

        <!-- Success Message -->
        <div class="text-center space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 animate-in fade-in slide-in-from-bottom duration-500 delay-500">
                Registration Successful!
            </h2>
            {#if showText}
                <p class="text-gray-600 h-6 font-medium">
                    {typedText}
                </p>
                <p class="text-gray-600 mt-2">
                    Reference Code: <span class="font-mono font-bold">{data.referenceCode}</span>
                </p>
            {/if}
        </div>
    </div>
</div>

<style>
    .opacity-0 {
        opacity: 0;
    }
    .opacity-100 {
        opacity: 1;
    }
    .scale-0 {
        transform: scale(0);
    }
    .scale-50 {
        transform: scale(0.5);
    }
    .scale-100 {
        transform: scale(1);
    }
</style>