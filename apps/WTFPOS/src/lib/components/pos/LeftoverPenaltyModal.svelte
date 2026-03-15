<script lang="ts">
    import { cn, formatPeso } from '$lib/utils';
    import type { Order } from '$lib/types';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import { applyLeftoverPenalty, waiveLeftoverPenalty } from '$lib/stores/pos.svelte';
    import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
    import { btScale } from '$lib/stores/bluetooth-scale.svelte';
    import ModalWrapper from '$lib/components/ModalWrapper.svelte';

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
    let showPolicyTip = $state(false);

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

<ModalWrapper open={isOpen && !!order} onclose={onClose} zIndex={60} ariaLabel="Leftover penalty" class="items-end sm:items-center">
  {#if order}
    {#if !showPin}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl bg-surface shadow-2xl pos-card flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden safe-bottom sm:pb-0" onclick={(e) => e.stopPropagation()}>
            <!-- Header — compact, fixed -->
            <div class="flex items-center justify-between px-4 pt-3 pb-2 sm:px-5 sm:pt-4 border-b border-gray-100">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">1</span>
                        <h2 class="text-sm sm:text-base font-black text-gray-900">Leftover Check</h2>
                    </div>
                    <span class="text-gray-300 text-xs">→</span>
                    <span class="text-[10px] sm:text-xs text-gray-400 font-medium">Payment</span>
                </div>
                <button onclick={onClose} class="text-gray-400 hover:text-gray-600 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg shrink-0">✕</button>
            </div>

            <!-- Scrollable content -->
            <div class="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3 sm:gap-4">
                <!-- Order badge + policy -->
                <div class="flex items-center justify-between">
                    <span class="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-accent tracking-wide">
                        {order.orderType === 'takeout'
                            ? `Takeout${order.customerName ? ` — ${order.customerName}` : ''}`
                            : order.tableId ?? 'Table'}
                        {order.pax ? ` · ${order.pax} pax` : ''}
                    </span>
                    <button
                        onclick={() => showPolicyTip = !showPolicyTip}
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                        style="min-height: unset"
                        aria-label="Show leftover policy"
                    >ℹ</button>
                </div>

                                    <p class={cn("rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800 leading-relaxed", !showPolicyTip && "hidden")}>
                    	AYCE leftover policy: uneaten meat is charged per gram. Enter the total weight of leftover meat.
                    </p>

                <p class="text-xs sm:text-sm text-gray-500 leading-relaxed">Weigh uneaten meat. Charged at <span class="font-semibold text-accent">₱{rate}/100g</span>. Enter 0 if clean.</p>

                {#if btScale.connectionStatus === 'connected'}
                    <BluetoothWeightInput
                        id="leftover-weight"
                        value={weightStr}
                        onValueChange={(v) => { weightStr = v; }}
                        theme="light"
                    />
                {/if}

                <!-- Weight display — compact -->
                <div class="flex items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 py-3 border border-border">
                    <span class="text-2xl sm:text-3xl font-black font-mono {weightGrams > 0 ? 'text-accent' : 'text-gray-300'}">{weightGrams}<span class="text-base sm:text-lg ml-0.5">g</span></span>
                    <span class={cn('text-xs sm:text-sm font-bold rounded-full px-2.5 py-1', weightGrams > 0 ? 'bg-status-red/10 text-status-red' : 'bg-gray-100 text-gray-400')}>
                        {weightGrams > 0 ? `+${formatPeso(penaltyAmount)}` : 'No penalty'}
                    </span>
                </div>

                <!-- Numpad — tighter on mobile -->
                <div class="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
                        <button onclick={() => handleNumpad(digit)} class="rounded-lg sm:rounded-xl border border-gray-200 bg-white py-3 sm:py-3.5 text-lg sm:text-xl font-bold active:scale-95 active:bg-gray-50 transition-all">{digit}</button>
                    {/each}
                    <button onclick={handleClear} class="rounded-lg sm:rounded-xl border border-gray-200 bg-gray-100 py-3 sm:py-3.5 text-xs font-bold text-gray-500 active:scale-95">CLR</button>
                    <button onclick={() => handleNumpad('0')} class="rounded-lg sm:rounded-xl border border-gray-200 bg-white py-3 sm:py-3.5 text-lg sm:text-xl font-bold active:scale-95 active:bg-gray-50 transition-all">0</button>
                    <button onclick={handleBackspace} class="rounded-lg sm:rounded-xl border border-gray-200 bg-gray-100 py-3 sm:py-3.5 text-lg sm:text-xl font-bold active:scale-95">⌫</button>
                </div>
            </div>

            <!-- Actions — fixed at bottom -->
            <div class="px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-100 bg-white">
                {#if weightGrams > 0}
                    <div class="flex gap-2">
                        <button onclick={handleSkip} class="btn-ghost flex-1 py-2.5 text-[10px] sm:text-xs">Override</button>
                        <button onclick={handleApply} class="btn-primary flex-[2] py-2.5 text-sm font-bold shadow-lg shadow-orange-500/20">
                            Apply +{formatPeso(penaltyAmount)} & Checkout
                        </button>
                    </div>
                {:else}
                    <button onclick={onPreCheckout} class="w-full rounded-xl py-3 text-sm font-bold text-white bg-status-green hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg">
                        ✓ No Leftovers — Checkout
                    </button>
                    <button onclick={handleSkip} class="w-full mt-1.5 py-2 text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 transition-colors" style="min-height: unset">
                        Manager Override →
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
  {/if}
</ModalWrapper>
