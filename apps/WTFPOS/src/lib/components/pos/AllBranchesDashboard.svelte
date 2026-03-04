<script lang="ts">
    import type { Table, Order } from '$lib/types';
    import { formatPeso, formatCountdown, cn } from '$lib/utils';

    interface Props {
        allTables: Table[];
        allOrders: Order[];
    }

    let { allTables, allOrders }: Props = $props();

    const branches = [
        { id: 'qc',   name: 'Alta Cita' },
        { id: 'mkti', name: 'Alona'     }
    ] as const;
</script>

<div class="flex flex-1 flex-col overflow-hidden bg-surface-secondary">
    <div class="flex items-center justify-between border-b border-border px-5 py-2.5">
        <div class="flex items-center gap-2.5">
            <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-60"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green"></span>
            </span>
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-gray-900">ALL BRANCHES — LIVE</span>
        </div>
        <span class="text-[11px] font-mono uppercase tracking-wider text-gray-600">read only · order taking disabled</span>
    </div>

    <div class="flex flex-1 divide-x divide-border overflow-hidden">
        {#each branches as branch (branch.id)}
            {@const bTables = allTables.filter(t => t.locationId === branch.id)}
            {@const bOrders = allOrders.filter(o => o.locationId === branch.id && o.status === 'open')}
            {@const bOcc    = bTables.filter(t => t.status !== 'available').length}
            {@const bFree   = bTables.filter(t => t.status === 'available').length}
            {@const bSales  = bOrders.reduce((s, o) => s + o.total, 0)}

            <div class="flex flex-1 flex-col overflow-hidden">
                <div class="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
                    <span class="text-sm font-bold uppercase tracking-wide text-gray-900">{branch.name}</span>
                    <div class="flex items-center gap-3 text-[11px] font-mono font-bold">
                        <span class="text-status-red">{bOcc} OCC</span>
                        <span class="text-status-green">{bFree} FREE</span>
                        <span class="text-accent font-bold">{formatPeso(bSales)}</span>
                    </div>
                </div>

                <div class="relative overflow-hidden" style="min-height: 340px;">
                    {#each bTables as t, idx (t.id)}
                        {@const tOrder = bOrders.find(o => o.id === t.currentOrderId)}
                        <div
                            class={cn(
                                'absolute flex flex-col rounded-lg px-2.5 py-2',
                                t.status === 'available' ? 'border border-status-green bg-status-green-light' :
                                t.status === 'critical'  ? 'border border-status-red bg-status-red-light' :
                                t.status === 'warning'   ? 'border border-status-yellow bg-status-yellow-light' :
                                                           'border border-accent bg-accent-light'
                            )}
                            style="left: {t.x}px; top: {t.y}px; width: {t.width ?? 82}px;"
                        >
                            <span class="text-xs font-bold text-gray-900">{t.label}</span>
                            {#if t.status !== 'available'}
                                <span class={cn('text-[10px] font-mono',
                                    t.status === 'critical' ? 'text-status-red' :
                                    t.status === 'warning'  ? 'text-status-yellow' : 'text-accent'
                                )}>
                                    {t.elapsedSeconds !== null ? formatCountdown(t.elapsedSeconds) : '–'}
                                </span>
                                {#if tOrder}<span class="text-[10px] font-mono text-gray-400">{tOrder.pax}p</span>{/if}
                                {#if t.billTotal}<span class="text-[10px] font-mono text-accent font-bold">{formatPeso(t.billTotal)}</span>{/if}
                            {:else}
                                <span class="text-[10px] font-mono text-status-green">free</span>
                            {/if}
                        </div>
                    {/each}
                </div>

                <div class="flex flex-col gap-1.5 border-t border-border bg-surface px-4 py-3">
                    <span class="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Active Orders</span>
                    {#if bOrders.length === 0}
                        <span class="text-[11px] font-mono text-gray-400">No active orders</span>
                    {:else}
                        {#each bOrders.slice(0, 4) as order}
                            {@const oTable = allTables.find(t => t.id === order.tableId)}
                            <div class="flex items-center justify-between text-[11px] font-mono">
                                <span class="truncate text-gray-700">
                                    {#if order.orderType === 'takeout'}
                                        📦 {order.customerName ?? 'Walk-in'}
                                    {:else}
                                        🪑 {oTable?.label ?? '?'} · {order.packageName ?? '–'} · {order.pax}p
                                    {/if}
                                </span>
                                <span class="ml-3 shrink-0 font-bold text-accent">{formatPeso(order.total)}</span>
                            </div>
                        {/each}
                        {#if bOrders.length > 4}
                            <span class="text-[10px] font-mono text-gray-400">+{bOrders.length - 4} more orders</span>
                        {/if}
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>
