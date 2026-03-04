<script lang="ts">
    import type { Table, Order } from '$lib/types';
    import { formatPeso, cn } from '$lib/utils';
    import { printBill, confirmHeldPayment, cancelHeldPayment } from '$lib/stores/pos.svelte';
    import { advanceTakeoutStatus } from '$lib/stores/pos.svelte';

    interface Props {
        order: Order | undefined;
        table: Table | null;
        onclose: () => void;
        onadditem: () => void;
        oncheckout: () => void;
        onvoid: () => void;
        ontransfer: () => void;
        onchangepackage: () => void;
        onsplit: () => void;
        onchangepax: () => void;
    }

    let { 
        order, 
        table, 
        onclose, 
        onadditem, 
        oncheckout, 
        onvoid, 
        ontransfer, 
        onchangepackage, 
        onsplit,
        onchangepax
    }: Props = $props();

    function takeoutLabel(takeoutOrders: Order[], order: Order) {
        const idx = takeoutOrders.indexOf(order);
        return `#TO${String(idx + 1).padStart(2, '0')}`;
    }

    function timerBadgeClass(t: Table | null) {
        if (!t) return 'bg-emerald-500 text-white';
        if (t.status === 'critical') return 'bg-red-500 text-white font-bold animate-pulse';
        if (t.status === 'warning')  return 'bg-yellow-400 text-gray-900 font-bold';
        if (t.status === 'billing') return 'bg-orange-500 text-white font-bold';
        return 'bg-emerald-500 text-white';
    }
</script>

<div class="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface overflow-y-auto">
    {#if !order}
        <div class="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center select-none">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary text-3xl">
                🧾
            </div>
            <div class="flex flex-col gap-1.5">
                <span class="text-sm font-semibold text-gray-700">No Table Selected</span>
                <span class="text-xs text-gray-400 leading-relaxed">Tap an occupied table on the floor plan to view its running bill here.</span>
            </div>
            <div class="mt-2 flex flex-col items-center gap-2 text-xs text-gray-400">
                <span class="flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-status-green inline-block"></span>
                    Green = available — tap to open
                </span>
                <span class="flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-accent inline-block"></span>
                    Orange = occupied — tap to view bill
                </span>
            </div>
        </div>
    {:else}
        <div class="flex flex-col gap-3 border-b border-border px-5 py-4">
            <div class="flex items-center justify-between">
                <button
                    onclick={onadditem}
                    class="btn-primary gap-1.5 px-3 text-sm"
                    style="min-height: 36px"
                >
                    + ADD
                </button>
                <div class="flex items-center gap-2.5">
                    {#if order.orderType === 'takeout'}
                        <span class="flex items-center gap-1.5">
                            <span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">📦 TAKEOUT</span>
                            <span class="text-xl font-extrabold text-gray-900">{order.customerName ?? 'Walk-in'}</span>
                        </span>
                    {:else}
                        <span class="text-xl font-extrabold text-gray-900">{table?.label}</span>
                        <span class="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-gray-600">
                            👥 {order.pax} pax
                        </span>
                    {/if}
                </div>
                <button onclick={onclose} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
            </div>
            {#if order.orderType === 'takeout'}
                {@const tStatus = order.takeoutStatus ?? 'new'}
                <div class="flex items-center justify-between rounded-lg bg-orange-50 border border-dashed border-orange-200 px-3 py-1.5">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-accent">{takeoutLabel([], order)}</span>
                        <span class={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
                            tStatus === 'new' ? 'bg-blue-500' :
                            tStatus === 'preparing' ? 'bg-yellow-500' :
                            tStatus === 'ready' ? 'bg-status-green' :
                            'bg-gray-400'
                        )}>
                            {tStatus.toUpperCase()}
                        </span>
                    </div>
                    {#if tStatus === 'ready'}
                        <button
                            onclick={() => advanceTakeoutStatus(order.id)}
                            class="text-[10px] font-semibold text-accent hover:underline"
                            style="min-height: unset"
                        >
                            → Mark Picked Up
                        </button>
                    {/if}
                </div>
            {:else if order.packageName}
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-900">🔥 {order.packageName}</span>
                    {#if table?.elapsedSeconds !== null}
                        <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                            ⏱ {Math.floor((table?.elapsedSeconds ?? 0) / 60)}m
                        </span>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="flex-1 divide-y divide-border-light px-5">
            {#each order.items as item (item.id)}
                <div class={cn('flex items-start justify-between py-3', item.status === 'cancelled' && 'opacity-50')}>
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-gray-900">{item.menuItemName}</span>
                            {#if item.weight}
                                <span class="text-xs text-gray-400">{item.weight}g</span>
                            {/if}
                        </div>
                        <span class="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {#if item.status === 'cancelled'}
                            <span class="text-xs italic text-status-red">voided by Manager</span>
                        {/if}
                    </div>
                    <div class="flex items-center gap-2 shrink-0 ml-2">
                        {#if item.tag === 'PKG'}
                            <div class="flex flex-col items-end">
                                <span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
                                <span class="rounded px-2 py-0.5 text-[10px] font-bold bg-accent-light text-accent">PKG</span>
                            </div>
                        {:else if item.tag === 'FREE'}
                            <span class="rounded px-2 py-0.5 text-[10px] font-bold bg-status-green-light text-status-green">FREE</span>
                        {:else if item.status === 'cancelled'}
                            <span class="rounded px-2 py-0.5 text-[10px] font-bold bg-status-red-light text-status-red">VOID</span>
                        {:else}
                            <span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <div class="border-t border-border px-5 py-4 flex flex-col gap-1">
            <div class="flex justify-between text-sm text-gray-500">
                <span>{order.items.filter(i => i.status !== 'cancelled').length} items</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-base font-bold text-gray-900">BILL</span>
                <span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(order.total)}</span>
            </div>
        </div>

        <div class="flex flex-col gap-2 px-5 pb-5">
            {#if order.status === 'pending_payment'}
                <div class="flex items-center justify-center gap-2 rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2 mb-1">
                    <span class="text-xs font-bold text-cyan-700 uppercase tracking-wider">⏳ Awaiting {order.pendingPaymentMethod === 'maya' ? 'Maya' : 'GCash'} Confirmation</span>
                </div>
                <div class="flex gap-2">
                    <button onclick={() => cancelHeldPayment(order.id)} class="btn-ghost flex-1 text-sm border border-gray-300" style="min-height: 44px">Cancel Hold</button>
                    <button onclick={() => confirmHeldPayment(order.id)} class="btn-success flex-1 text-sm bg-cyan-600 hover:bg-cyan-700 text-white" style="min-height: 44px">✓ Confirm Payment</button>
                </div>
            {:else}
            <div class="flex gap-2">
                <button onclick={onvoid} class="btn-danger flex-1 text-sm" style="min-height: 44px">🗑 Void</button>
                <button onclick={oncheckout} class="btn-success flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" style="min-height: 44px">💳 Checkout</button>
                <button onclick={() => printBill(order.id)} class="btn-secondary px-3 text-sm bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800" style="min-height: 44px">🖨</button>
            </div>
            {/if}
            <div class="flex gap-2">
                {#if order.orderType === 'dine-in' && table}
                    <button onclick={ontransfer} class="btn-secondary flex-1 text-xs" style="min-height: 38px">🔀 Transfer</button>
                    <button onclick={onchangepax} class="btn-secondary flex-1 text-xs" style="min-height: 38px">👥 Pax</button>
                {/if}
                {#if order.packageId && order.orderType === 'dine-in'}
                    <button onclick={onchangepackage} class="btn-secondary flex-1 text-xs" style="min-height: 38px">🔄 Change Pkg</button>
                {/if}
                {#if order.items.filter(i => i.status !== 'cancelled').length > 0}
                    <button onclick={onsplit} class="btn-secondary flex-1 text-xs" style="min-height: 38px">✂️ Split Bill</button>
                {/if}
            </div>
        </div>
    {/if}
</div>
