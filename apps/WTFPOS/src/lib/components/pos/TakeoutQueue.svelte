<script lang="ts">
    import type { Order } from '$lib/types';
    import { formatPeso, cn } from '$lib/utils';
    import { session } from '$lib/stores/session.svelte';

    interface Props {
        takeoutOrders: Order[];
        selectedTakeoutId: string | null;
        onclick: (order: Order) => void;
        onadvancestatus: (orderId: string) => void;
    }

    let { takeoutOrders, selectedTakeoutId, onclick, onadvancestatus }: Props = $props();

    function takeoutLabel(order: Order) {
        const idx = takeoutOrders.indexOf(order);
        return `#TO${String(idx + 1).padStart(2, '0')}`;
    }
</script>

{#if takeoutOrders.length > 0}
    <div class="border-t border-dashed border-orange-200 pt-4 flex flex-col gap-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
            📦 Takeout Orders
            <span class="rounded-full bg-accent px-2 py-0.5 text-[10px] text-white font-bold">{takeoutOrders.length}</span>
        </h2>
        <div class="flex flex-wrap gap-2">
            {#each takeoutOrders as order (order.id)}
                {@const tStatus = order.takeoutStatus ?? 'new'}
                <div class="relative flex flex-col gap-1 rounded-xl border-2 border-dashed px-4 py-3 text-left transition-all"
                    class:border-accent={selectedTakeoutId === order.id}
                    class:bg-accent-light={selectedTakeoutId === order.id}
                    class:border-blue-400={tStatus === 'new' && selectedTakeoutId !== order.id}
                    class:bg-blue-50={tStatus === 'new' && selectedTakeoutId !== order.id}
                    class:border-yellow-400={tStatus === 'preparing' && selectedTakeoutId !== order.id}
                    class:bg-yellow-50={tStatus === 'preparing' && selectedTakeoutId !== order.id}
                    class:border-green-400={tStatus === 'ready' && selectedTakeoutId !== order.id}
                    class:bg-green-50={tStatus === 'ready' && selectedTakeoutId !== order.id}
                    style="min-width: 140px"
                >
                    <button
                        onclick={() => onclick(order)}
                        class="text-left"
                        style="min-height: unset"
                    >
                        <span class="font-mono text-[11px] font-bold text-accent">{takeoutLabel(order)}</span>
                        <div class="text-sm font-semibold text-gray-900">{order.customerName ?? 'Walk-in'}</div>
                        <span class="font-mono text-xs font-bold text-gray-700">{formatPeso(order.total)}</span>
                        <div class="text-[10px] text-gray-400">{order.items.filter(i => i.status !== 'cancelled').length} items</div>
                    </button>
                    <span class={cn(
                        'absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-white',
                        tStatus === 'new' ? 'bg-blue-500' :
                        tStatus === 'preparing' ? 'bg-yellow-500' :
                        tStatus === 'ready' ? 'bg-status-green animate-pulse' :
                        'bg-gray-400'
                    )}>
                        {tStatus === 'new' ? 'NEW' : tStatus === 'preparing' ? 'PREP' : tStatus === 'ready' ? 'READY' : 'DONE'}
                    </span>
                    {#if tStatus !== 'picked_up' && session.role !== 'staff'}
                        <button
                            onclick={(e) => { e.stopPropagation(); onadvancestatus(order.id); }}
                            class="mt-1 flex items-center justify-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                            style="min-height: 24px"
                        >
                            → {tStatus === 'new' ? 'Start Prep' : tStatus === 'preparing' ? 'Mark Ready' : 'Picked Up'}
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}
