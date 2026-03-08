<script lang="ts">
    import { cn, formatPeso } from '$lib/utils';
    import type { Order } from '$lib/types';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import { applyLeftoverPenalty, waiveLeftoverPenalty } from '$lib/stores/pos.svelte';
    import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
    import { btScale } from '$lib/stores/bluetooth-scale.svelte';

    interface Props {
        isOpen: boolean;
        order: Order | null;
        onClose: () => void;
        onPreCheckout: () => void;
    }

    let { isOpen, order, onClose, onPreCheckout }: Props = $props();

    let weightStr = $state('');
    let rate = $state(50); // PHP 50 per 100g
    let showPin = $state(false);

    $effect(() => {
        if (isOpen) {
            weightStr = '';
            showPin = false;
        }
    });

    const weightGrams = $derived(parseInt(weightStr) || 0);
    const penaltyAmount = $derived(Math.ceil(weightGrams / 100) * rate);

    function handleNumpad(val: string) {
        if (weightStr.length < 5) weightStr += val;
    }
    function handleBackspace() {
        weightStr = weightStr.slice(0, -1);
    }
    function handleClear() {
        weightStr = '';
    }

    function handleApply() {
        if (order && weightGrams > 0) {
            applyLeftoverPenalty(order.id, weightGrams, rate);
        }
        onPreCheckout();
    }

    function handleSkip() {
        showPin = true;
    }

    function handlePinVerify() {
        if (order) {
            waiveLeftoverPenalty(order.id);
        }
        showPin = false;
        onPreCheckout();
    }
</script>

{#if isOpen && order}
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    {#if !showPin}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl pos-card flex flex-col gap-6" onclick={(e) => e.stopPropagation()}>
            <button onclick={onClose} class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center">✕</button>
            
            <div>
                <h2 class="text-xl font-black text-gray-900">Leftover Check</h2>
                <p class="text-sm text-gray-500">Weigh any uneaten meat. Leftovers over 100g are charged at <span class="font-semibold text-accent">₱{rate}/100g</span>. Enter 0 if plate is clean.</p>
            </div>

            {#if btScale.connectionStatus === 'connected'}
                <BluetoothWeightInput
                    id="leftover-weight"
                    value={weightStr}
                    onValueChange={(v) => { weightStr = v; }}
                    theme="light"
                />
            {/if}

            <div class="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 p-4 border border-border">
                <span class="text-3xl font-black {weightGrams > 0 ? 'text-accent' : 'text-gray-300'}">{weightGrams} g</span>
                <span class="text-sm font-semibold text-status-red">{weightGrams > 0 ? `+ ${formatPeso(penaltyAmount)}` : 'No penalty'}</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
                {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
                    <button onclick={() => handleNumpad(digit)} class="rounded-xl border border-gray-200 bg-white py-4 text-xl font-bold shadow-sm active:scale-95">{digit}</button>
                {/each}
                <button onclick={handleClear} class="rounded-xl border border-gray-200 bg-gray-100 py-4 text-sm font-bold text-gray-500 shadow-sm active:scale-95">CLR</button>
                <button onclick={() => handleNumpad('0')} class="rounded-xl border border-gray-200 bg-white py-4 text-xl font-bold shadow-sm active:scale-95">0</button>
                <button onclick={handleBackspace} class="rounded-xl border border-gray-200 bg-gray-100 py-4 text-xl font-bold shadow-sm active:scale-95">⌫</button>
            </div>

            <div class="flex gap-2">
                <button onclick={handleSkip} class="btn-ghost flex-1 py-3 text-xs">Waive (Manager)</button>
                {#if weightGrams > 0}
                    <button onclick={handleApply} class="btn-primary flex-[2] py-3 text-sm shadow-xl shadow-orange-500/20">
                        Apply & Checkout
                    </button>
                {:else}
                    <button onclick={onPreCheckout} class="btn-success flex-[2] py-3 text-sm shadow-xl text-white bg-status-green hover:bg-emerald-600">
                        Skip / Checkout
                    </button>
                {/if}
            </div>
        </div>
    {:else}
        <ManagerPinModal
            isOpen={true}
            title="Waive Penalty?"
            description="Enter manager PIN to waive leftover penalty."
            onClose={() => showPin = false}
            onConfirm={handlePinVerify}
            confirmLabel="Waive"
        />
    {/if}
</div>
{/if}
