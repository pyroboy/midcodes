<script lang="ts">
    import { cn } from '$lib/utils';
    import type { Order } from '$lib/types';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import { changePax } from '$lib/stores/pos.svelte';

    interface Props {
        isOpen: boolean;
        order: Order | null;
        onClose: () => void;
    }

    let { isOpen, order, onClose }: Props = $props();

    let newPax = $state(1);
    let showPin = $state(false);

    $effect(() => {
        if (isOpen && order) {
            newPax = order.pax;
            showPin = false;
        }
    });

    function inc() { newPax++; }
    function dec() { if (newPax > 1) newPax--; }

    function handleConfirm() {
        if (newPax === order?.pax) {
            onClose();
        } else {
            showPin = true;
        }
    }

    function handlePinVerify() {
        if (order) {
            changePax(order.id, newPax);
        }
        showPin = false;
        onClose();
    }
</script>

{#if isOpen && order}
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    {#if !showPin}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl pos-card flex flex-col gap-6" onclick={(e) => e.stopPropagation()}>
            <div>
                <h2 class="text-2xl font-black text-gray-900">Change Pax</h2>
                <p class="mt-1 text-sm text-gray-500">Current: {order.pax} pax</p>
            </div>
            
            <div class="flex items-center justify-center gap-6 py-4">
                <button onclick={dec} class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary text-3xl text-gray-700 active:scale-95 transition-transform select-none border border-border" disabled={newPax <= 1}>−</button>
                <div class="flex h-20 w-24 flex-col items-center justify-center rounded-2xl bg-orange-50 border-2 border-orange-200 text-amber-900 shadow-inner">
                    <span class="text-4xl font-black">{newPax}</span>
                </div>
                <button onclick={inc} class="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-white shadow-xl shadow-orange-500/30 active:scale-95 transition-all select-none">+</button>
            </div>

            <div class="flex gap-3">
                <button onclick={onClose} class="btn-ghost flex-1 py-4 text-sm">Cancel</button>
                <button onclick={handleConfirm} class="btn-primary flex-1 py-4 text-sm shadow-xl shadow-orange-500/20" disabled={newPax === order.pax}>
                    Apply Change
                </button>
            </div>
        </div>
    {:else}
        <ManagerPinModal
            isOpen={true}
            title="Manager PIN Required"
            description="Enter manager PIN to authorize pax change."
            onClose={() => showPin = false}
            onConfirm={handlePinVerify}
            confirmLabel="Verify"
        />
    {/if}
</div>
{/if}
