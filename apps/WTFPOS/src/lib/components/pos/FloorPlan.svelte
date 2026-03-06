<script lang="ts">
    import type { Table, Order } from '$lib/types';
    import { formatPeso, formatCountdown, cn } from '$lib/utils';
    import { Users } from 'lucide-svelte';

    interface Props {
        mainTables: Table[];
        orders: Order[];
        selectedTableId: string | null;
        ontableclick: (table: Table) => void;
    }

    let { mainTables, orders, selectedTableId, ontableclick }: Props = $props();

    // O(1) order lookup by tableId
    const orderMap = $derived(new Map(orders.filter(o => o.tableId).map(o => [o.tableId!, o])));

    function cardBorderClass(t: Table, order: Order | undefined) {
        if (t.status === 'maintenance') return 'border-2 border-dashed border-gray-400 cursor-not-allowed';
        if (t.status === 'available') return 'border border-gray-300 hover:border-accent';
        if (t.status === 'billing') {
            if (order?.status === 'pending_payment') return 'border-2 border-cyan-500';
            return 'border-2 border-orange-500';
        }
        if (t.status === 'critical') return 'border-2 border-red-500 animate-border-pulse-red ring-2 ring-red-500 ring-offset-2';
        if (t.status === 'warning') return 'border-2 border-yellow-400 animate-border-pulse-yellow';
        return 'border-2 border-emerald-500';
    }

    function cardBgClass(t: Table, order: Order | undefined) {
        if (t.status === 'maintenance') return 'bg-gray-200 opacity-60';
        if (t.status === 'available') return 'bg-white';
        if (t.status === 'billing') {
            if (order?.status === 'pending_payment') return 'bg-cyan-50';
            return 'bg-orange-50';
        }
        // occupied states — package-driven background
        if (order?.packageId === 'pkg-pork') return 'bg-pink-50';
        if (order?.packageId === 'pkg-beef') return 'bg-purple-50';
        if (order?.packageId === 'pkg-combo') return 'bg-amber-50';
        return 'bg-emerald-50';
    }

    function pkgBadge(packageId: string | undefined | null) {
        if (packageId === 'pkg-pork') return { label: 'PORK', cls: 'bg-pink-100 text-pink-700 border border-pink-300' };
        if (packageId === 'pkg-beef') return { label: 'BEEF', cls: 'bg-purple-100 text-purple-700 border border-purple-300' };
        if (packageId === 'pkg-combo') return { label: 'P&B', cls: 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 border border-purple-300' };
        return null;
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
    <div class="relative" style="min-height: 400px;">
        {#each mainTables as table (table.id)}
            {@const order = orderMap.get(table.id)}
            {@const badge = pkgBadge(order?.packageId)}
            <button
                onclick={() => ontableclick(table)}
                class={cn(
                    'relative flex flex-col p-1.5 rounded-lg transition-all shadow-sm',
                    cardBorderClass(table, order),
                    cardBgClass(table, order),
                    selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent'
                )}
                style="position: absolute; left: {table.x}px; top: {table.y}px; width: {table.width ?? 112}px; height: {table.height ?? 112}px;"
                aria-label="Table {table.label}"
            >
                <!-- Top row: pkg pill | timer/maintenance badge -->
                <div class="flex w-full items-center justify-between gap-0.5">
                    {#if badge}
                        <span class={cn('rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-tight', badge.cls)}>{badge.label}</span>
                    {:else}
                        <span></span>
                    {/if}
                    {#if table.status === 'maintenance'}
                        <span class="rounded-full px-1.5 py-0.5 text-[9px] bg-gray-500 text-white">🔧</span>
                    {:else if table.status !== 'available'}
                        <span class={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', timerBadgeClass(table))}>
                            {table.elapsedSeconds !== null ? formatCountdown(table.elapsedSeconds) : ''}
                        </span>
                    {/if}
                </div>
                <!-- Center: table label + pax -->
                <div class="flex-1 flex flex-col items-center justify-center">
                    <span class="text-xl font-extrabold text-gray-900 leading-tight">{table.label}</span>
                    {#if table.status !== 'available' && table.status !== 'maintenance'}
                        <span class="flex items-center gap-0.5 text-xs font-semibold text-gray-600">
                            <Users size={11} />{order?.pax ?? table.capacity} pax
                        </span>
                    {/if}
                </div>
                <!-- Bottom: bill total -->
                {#if table.billTotal}
                    <div class="w-full text-center font-mono text-xs font-bold text-gray-900">{formatPeso(table.billTotal)}</div>
                {/if}
            </button>
        {/each}

        <div class="absolute bottom-2 left-2 flex gap-6 text-xs text-gray-300">
            <span>🍳 KITCHEN</span>
            <span>🚪 ENTRANCE</span>
        </div>
    </div>
</div>
