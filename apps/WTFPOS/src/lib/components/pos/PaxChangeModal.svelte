<script lang="ts">
    import { cn, formatPeso } from '$lib/utils';
    import type { Order } from '$lib/types';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import { changePax } from '$lib/stores/pos.svelte';
    import ModalWrapper from '$lib/components/ModalWrapper.svelte';

    interface Props {
        isOpen: boolean;
        order: Order | null;
        onClose: () => void;
    }

    let { isOpen, order, onClose }: Props = $props();

    let newPax = $state(1);
    let showPin = $state(false);

    const pkgItem = $derived(order?.items.find(i => i.tag === 'PKG') ?? null);
    const showPricePreview = $derived(!!order?.packageId && !!pkgItem && newPax !== (order?.pax ?? 0));

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

<ModalWrapper open={isOpen && !!order} onclose={onClose} zIndex={60} ariaLabel="Change pax count">
  {#if order}
    {#if !showPin}
        <div class="w-full max-w-[380px] rounded-2xl bg-surface p-6 shadow-2xl pos-card flex flex-col gap-6">
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

            <div class={cn('rounded-xl bg-surface-secondary px-4 py-3 text-center text-sm', !showPricePreview && 'invisible')}>
                <span class="text-gray-500">{order.packageName} × {newPax} pax = </span>
                <span class="font-mono font-bold text-gray-900">{formatPeso((pkgItem?.unitPrice ?? 0) * newPax)}</span>
                <span class={cn('ml-1 font-semibold', newPax > (order.pax ?? 0) ? 'text-status-green' : 'text-status-red')}>
                    ({newPax > (order.pax ?? 0) ? '+' : ''}{formatPeso((pkgItem?.unitPrice ?? 0) * (newPax - (order.pax ?? 0)))})
                </span>
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
  {/if}
</ModalWrapper>
