<script lang="ts">
    import type { Table, Order } from '$lib/types';
    import { formatPeso, formatCountdown, cn } from '$lib/utils';

    interface Props {
        mainTables: Table[];
        orders: Order[];
        selectedTableId: string | null;
        ontableclick: (table: Table) => void;
    }

    let { mainTables, orders, selectedTableId, ontableclick }: Props = $props();

    function tableCardClass(t: Table) {
        let base = 'relative overflow-hidden transition-all ';

        // Status colors
        if (t.status === 'maintenance') return base + 'border-2 border-dashed border-gray-400 bg-gray-200 opacity-60 cursor-not-allowed';
        if (t.status === 'available') return base + 'border border-gray-300 bg-white hover:border-accent shadow-sm';
        // Check if table's order is pending payment (held e-wallet)
        if (t.status === 'billing') {
            const order = t.currentOrderId ? orders.find(o => o.id === t.currentOrderId) : null;
            if (order?.status === 'pending_payment') return base + 'border-2 border-cyan-500 bg-cyan-50 shadow-md';
            return base + 'border border-orange-500 bg-orange-100 shadow-md';
        }

        // Unli-time critical blinking (if it's not billing/dirty)
        if (t.status === 'critical') return base + 'border-2 border-red-500 bg-status-green-light animate-border-pulse-red ring-2 ring-red-500 ring-offset-2';
        if (t.status === 'warning') return base + 'border-2 border-yellow-400 bg-status-green-light shadow-md animate-border-pulse-yellow';

        return base + 'border-2 border-emerald-500 bg-emerald-50 shadow-md';
    }

    function timerBadgeClass(t: Table) {
        if (t.status === 'critical') return 'bg-red-500 text-white font-bold animate-pulse';
        if (t.status === 'warning')  return 'bg-yellow-400 text-gray-900 font-bold';
        if (t.status === 'billing') {
            const order = t.currentOrderId ? orders.find(o => o.id === t.currentOrderId) : null;
            if (order?.status === 'pending_payment') return 'bg-cyan-500 text-white font-bold';
            return 'bg-orange-500 text-white font-bold';
        }
        return 'bg-emerald-500 text-white';
    }
</script>

<div class="flex-1 rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">Main Dining</h2>
    <div class="relative" style="min-height: 340px;">
        {#each mainTables as table (table.id)}
            <button
                onclick={() => ontableclick(table)}
                class={cn(tableCardClass(table), selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent')}
                style="position: absolute; left: {table.x}px; top: {table.y}px; width: {table.width ?? 92}px; height: {table.height ?? 92}px;"
                aria-label="Table {table.label}"
            >
                <div class="flex w-full items-start justify-between">
                    <span class="text-base font-extrabold text-gray-900 z-10">{table.label}</span>
                    {#if table.status === 'maintenance'}
                        <span class="rounded-full px-1.5 py-0.5 text-[9px] font-semibold z-10 bg-gray-500 text-white">🔧</span>
                    {:else if table.status !== 'available'}
                        <span class={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold z-10', timerBadgeClass(table))}>
                            {table.remainingSeconds !== null ? formatCountdown(table.remainingSeconds) : ''}
                        </span>
                    {/if}
                </div>
                {#if table.status === 'maintenance'}
                    <div class="mt-1 text-[10px] font-semibold text-gray-500 z-10 uppercase">Out of Order</div>
                {:else}
                <div class="mt-1 text-xs text-gray-400 z-10">
                    {#if table.currentOrderId}
                        {@const o = orders.find(ord => ord.id === table.currentOrderId)}
                        {o?.pax ?? table.capacity}p
                    {:else}
                        {table.capacity}p
                    {/if}
                </div>
                {/if}
                {#if table.billTotal}
                    <div class="mt-1 font-mono text-xs font-bold text-gray-900 z-10">
                        {formatPeso(table.billTotal)}
                    </div>
                {/if}
                {#if table.currentOrderId}
                    {@const order = orders.find(o => o.id === table.currentOrderId)}
                    {#if order?.packageId === 'pkg-pork'}
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400"></div>
                    {:else if order?.packageId === 'pkg-beef'}
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
                    {:else if order?.packageId === 'pkg-combo'}
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-400 to-purple-500"></div>
                    {/if}
                {/if}
            </button>
        {/each}

        <div class="absolute bottom-2 left-2 flex gap-6 text-xs text-gray-300">
            <span>🍳 KITCHEN</span>
            <span>🚪 ENTRANCE</span>
        </div>
    </div>
</div>
