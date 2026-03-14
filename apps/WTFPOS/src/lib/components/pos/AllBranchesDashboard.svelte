<script lang="ts">
    import type { Table, Order, ChairSide } from '$lib/types';
    import { formatPeso, formatCountdown, cn } from '$lib/utils';
    import { floorLayout } from '$lib/stores/floor-layout.svelte';
    import LocationSelectorModal from '$lib/components/stock/LocationSelectorModal.svelte';
    import { ArrowDownUp } from 'lucide-svelte';

    let showLocationModal = $state(false);

    interface Props {
        allTables: Table[];
        allOrders: Order[];
    }

    let { allTables, allOrders }: Props = $props();

    const branches = [
        { id: 'tag', name: 'Alta Citta'   },
        { id: 'pgl', name: 'Alona Beach'  }
    ] as const;

    function tableStroke(t: Table): string {
        if (t.status === 'available') return '#10b981';
        if (t.status === 'critical') return '#ef4444';
        if (t.status === 'warning') return '#eab308';
        return '#EA580C';
    }

    function tableFill(t: Table): string {
        if (t.status === 'available') return '#ecfdf5';
        if (t.status === 'critical') return '#fef2f2';
        if (t.status === 'warning') return '#fefce8';
        return '#fff7ed';
    }

    function timerColor(t: Table): string {
        if (t.status === 'critical') return '#ef4444';
        if (t.status === 'warning') return '#eab308';
        return '#EA580C';
    }

    // ─── Chair rendering ─────────────────────────────────────────────────────
    const CHAIR_THICKNESS = 10;
    const CHAIR_GAP = 4;

    function chairRects(table: Table, side: ChairSide, sideName: 'top' | 'bottom' | 'left' | 'right'): Array<{ x: number; y: number; w: number; h: number }> {
        if (side.type === 'none') return [];
        const W = table.width ?? 82;
        const H = table.height ?? 80;
        const isHoriz = sideName === 'top' || sideName === 'bottom';
        const spanW = isHoriz ? W : H;

        // Bench types: lounge, l-shape (legacy), diner (legacy) all render as bench
        if (side.type === 'lounge' || side.type === 'l-shape' || side.type === 'diner') {
            const cw = isHoriz ? spanW - CHAIR_GAP * 2 : CHAIR_THICKNESS;
            const ch = isHoriz ? CHAIR_THICKNESS : spanW - CHAIR_GAP * 2;
            const cx = isHoriz ? table.x + CHAIR_GAP : (sideName === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
            const cy = isHoriz ? (sideName === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP) : table.y + CHAIR_GAP;
            return [{ x: cx, y: cy, w: cw, h: ch }];
        }
        if (side.type === 'individual') {
            const count = Math.max(1, side.count);
            const chairW = isHoriz ? Math.min(20, (spanW - CHAIR_GAP * (count + 1)) / count) : CHAIR_THICKNESS;
            const chairH = isHoriz ? CHAIR_THICKNESS : Math.min(20, (spanW - CHAIR_GAP * (count + 1)) / count);
            const totalSpan = isHoriz ? chairW * count + CHAIR_GAP * (count - 1) : chairH * count + CHAIR_GAP * (count - 1);
            const startOffset = isHoriz ? table.x + (W - totalSpan) / 2 : table.y + (H - totalSpan) / 2;
            return Array.from({ length: count }, (_, i) => {
                const step = isHoriz ? chairW + CHAIR_GAP : chairH + CHAIR_GAP;
                const x = isHoriz ? startOffset + i * step : (sideName === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
                const y = isHoriz ? (sideName === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP) : startOffset + i * step;
                return { x, y, w: chairW, h: chairH };
            });
        }
        return [];
    }

    // ─── Auto corner-fill: curved connector where adjacent bench sides meet ─
    function isBenchType(s: ChairSide): boolean {
        return s.type === 'lounge' || s.type === 'l-shape' || s.type === 'diner';
    }

    function cornerFillPaths(table: Table): Array<{ d: string; color: string; opacity: number }> {
        if (!table.chairConfig) return [];
        const cfg = table.chairConfig;
        const W = table.width ?? 82;
        const H = table.height ?? 80;
        const crx = Math.min(table.borderRadius ?? 8, W / 2, H / 2);
        const ri = crx + CHAIR_GAP;
        const ro = crx + CHAIR_GAP + CHAIR_THICKNESS;
        const fills: Array<{ d: string; color: string; opacity: number }> = [];

        if (isBenchType(cfg.top) && isBenchType(cfg.right)) {
            const acx = table.x + W - crx, acy = table.y + crx;
            fills.push({ d: `M${acx},${acy - ro} A${ro},${ro} 0 0,1 ${acx + ro},${acy} L${acx + ri},${acy} A${ri},${ri} 0 0,0 ${acx},${acy - ri} Z`, color: cfg.top.color ?? '#9ca3af', opacity: Math.min(cfg.top.opacity ?? 0.85, cfg.right.opacity ?? 0.85) });
        }
        if (isBenchType(cfg.right) && isBenchType(cfg.bottom)) {
            const acx = table.x + W - crx, acy = table.y + H - crx;
            fills.push({ d: `M${acx + ro},${acy} A${ro},${ro} 0 0,1 ${acx},${acy + ro} L${acx},${acy + ri} A${ri},${ri} 0 0,0 ${acx + ri},${acy} Z`, color: cfg.right.color ?? '#9ca3af', opacity: Math.min(cfg.right.opacity ?? 0.85, cfg.bottom.opacity ?? 0.85) });
        }
        if (isBenchType(cfg.bottom) && isBenchType(cfg.left)) {
            const acx = table.x + crx, acy = table.y + H - crx;
            fills.push({ d: `M${acx},${acy + ro} A${ro},${ro} 0 0,1 ${acx - ro},${acy} L${acx - ri},${acy} A${ri},${ri} 0 0,0 ${acx},${acy + ri} Z`, color: cfg.bottom.color ?? '#9ca3af', opacity: Math.min(cfg.bottom.opacity ?? 0.85, cfg.left.opacity ?? 0.85) });
        }
        if (isBenchType(cfg.left) && isBenchType(cfg.top)) {
            const acx = table.x + crx, acy = table.y + crx;
            fills.push({ d: `M${acx - ro},${acy} A${ro},${ro} 0 0,1 ${acx},${acy - ro} L${acx},${acy - ri} A${ri},${ri} 0 0,0 ${acx - ri},${acy} Z`, color: cfg.left.color ?? '#9ca3af', opacity: Math.min(cfg.left.opacity ?? 0.85, cfg.top.opacity ?? 0.85) });
        }
        return fills;
    }

    function elementColor(type: string, color?: string | null): string {
        if (color) return color;
        switch (type) {
            case 'wall':      return '#374151';
            case 'divider':   return '#6b7280';
            case 'entrance':  return '#10b981';
            case 'exit':      return '#ef4444';
            case 'bar':       return '#8b5cf6';
            case 'kitchen':   return '#f59e0b';
            case 'stairs':    return '#3b82f6';
            case 'furniture': return '#92400e';
            case 'label':     return '#1e293b';
            default:          return '#9ca3af';
        }
    }
</script>

<div class="flex flex-1 flex-col overflow-hidden bg-surface-secondary">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border px-3 py-2 sm:px-5 sm:py-2.5">
        <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-60"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green"></span>
            </span>
            <span class="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-gray-900">ALL BRANCHES — LIVE</span>
        </div>
        <span class="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-gray-500 hidden sm:inline">read only · order taking disabled</span>
        <span class="text-[9px] font-mono uppercase tracking-wider text-gray-500 sm:hidden">read only</span>
    </div>

    <!-- Select Branch CTA (P2-15) -->
    <div class="border-b border-border bg-accent-light px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3">
        <p class="text-xs sm:text-sm font-semibold text-accent">
            You are viewing all branches in read-only mode.
        </p>
        <button
            onclick={() => (showLocationModal = true)}
            class="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-dark active:scale-95 min-h-[44px] sm:min-h-0"
        >
            <ArrowDownUp class="h-3.5 w-3.5 shrink-0" />
            Select Branch to act
        </button>
    </div>

    <!-- Branch panels -->
    <div class="flex flex-col landscape:flex-row md:flex-row flex-1 divide-y landscape:divide-y-0 landscape:divide-x md:divide-y-0 md:divide-x divide-border overflow-y-auto landscape:overflow-hidden md:overflow-hidden">
        {#each branches as branch (branch.id)}
            {@const bTables = allTables.filter(t => t.locationId === branch.id)}
            {@const bOrders = allOrders.filter(o => o.locationId === branch.id && o.status === 'open')}
            {@const activeTableIds = new Set(bOrders.filter(o => o.tableId).map(o => o.tableId!))}
            {@const bOcc    = bTables.filter(t => t.status !== 'available' || activeTableIds.has(t.id)).length}
            {@const bFree   = bTables.filter(t => t.status === 'available' && !activeTableIds.has(t.id)).length}
            {@const bSales  = bOrders.reduce((s, o) => s + o.total, 0)}
            {@const canvas  = floorLayout.canvasFor(branch.id)}
            {@const elements = floorLayout.elementsFor(branch.id)}

            <div class="flex flex-1 flex-col overflow-hidden min-h-0">
                <!-- Branch header -->
                <div class="flex items-center justify-between border-b border-border bg-surface px-3 py-2 sm:px-4 sm:py-2.5">
                    <span class="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-900">{branch.name}</span>
                    <div class="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono font-bold">
                        <span class="text-status-red">{bOcc} OCC</span>
                        <span class="text-status-green">{bFree} FREE</span>
                        <span class="text-accent font-bold">{formatPeso(bSales)}</span>
                    </div>
                </div>

                <!-- Floor plan SVG with auto-scaling via viewBox -->
                <div class="relative flex-1 overflow-hidden min-h-[200px] sm:min-h-[280px] md:min-h-[340px]">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 {canvas.width} {canvas.height}"
                        preserveAspectRatio="xMidYMid meet"
                        class="block w-full h-full"
                    >
                        <rect width={canvas.width} height={canvas.height} fill="#ffffff" rx="6" />
                        <rect width={canvas.width} height={canvas.height} fill="none" stroke="#e5e7eb" stroke-width="1" rx="6" />

                        <!-- Floor elements -->
                        {#each elements as el (el.id)}
                            {@const elColor = elementColor(el.type, el.color)}
                            {@const elCx = el.x + el.width / 2}
                            {@const elCy = el.y + el.height / 2}
                            <g transform="rotate({el.rotation ?? 0} {elCx} {elCy})">
                                {#if el.shape === 'rect'}
                                    <rect x={el.x} y={el.y} width={el.width} height={el.height} fill="none" stroke={elColor} stroke-width="1.5" stroke-dasharray="6 3" opacity={el.opacity ?? 0.7} rx="3" />
                                {:else if el.shape === 'circle'}
                                    <ellipse cx={elCx} cy={elCy} rx={el.width / 2} ry={el.height / 2} fill="none" stroke={elColor} stroke-width="1.5" stroke-dasharray="6 3" opacity={el.opacity ?? 0.7} />
                                {/if}
                                {#if el.label}
                                    <text x={elCx} y={elCy} text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="9" font-weight="600" fill={elColor} pointer-events="none">{el.label}</text>
                                {/if}
                            </g>
                        {/each}

                        <!-- Tables -->
                        {#each bTables as t (t.id)}
                            {@const tOrder = bOrders.find(o => o.id === t.currentOrderId)}
                            {@const W = t.width ?? 82}
                            {@const H = t.height ?? 80}
                            {@const tcx = t.x + W / 2}
                            {@const tcy = t.y + H / 2}
                            <g transform="rotate({t.rotation ?? 0} {tcx} {tcy})">
                                <!-- Chairs -->
                                {#if t.chairConfig}
                                    {#each (['top','bottom','left','right'] as const) as sideName}
                                        {@const side = t.chairConfig[sideName]}
                                        {#if side && side.type !== 'none'}
                                            {#each chairRects(t, side, sideName) as r}
                                                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="3" fill={side.color ?? '#9ca3af'} opacity={side.opacity ?? 0.85} />
                                            {/each}
                                        {/if}
                                    {/each}
                                    {#each cornerFillPaths(t) as cf}
                                        <path d={cf.d} fill={cf.color} opacity={cf.opacity} />
                                    {/each}
                                {/if}
                                <rect
                                    x={t.x} y={t.y}
                                    width={W} height={H}
                                    rx={t.borderRadius ?? 8}
                                    fill={tableFill(t)}
                                    stroke={tableStroke(t)}
                                    stroke-width={t.borderWidth ?? 1.5}
                                    opacity={t.status === 'maintenance' ? 0.4 : 1}
                                />
                                <text
                                    x={tcx} y={tcy - (t.status !== 'available' ? 4 : 0)}
                                    text-anchor="middle" dominant-baseline="middle"
                                    font-family="Inter, sans-serif" font-size="11" font-weight="700"
                                    fill="#111827" pointer-events="none"
                                >{t.label}</text>
                                {#if t.status !== 'available'}
                                    <text
                                        x={tcx} y={tcy + 8}
                                        text-anchor="middle" dominant-baseline="middle"
                                        font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700"
                                        fill={timerColor(t)} pointer-events="none"
                                    >{t.elapsedSeconds !== null ? formatCountdown(t.elapsedSeconds) : ''}</text>
                                    {#if tOrder}
                                        <text x={tcx} y={tcy + 18} text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="7" fill="#6b7280" pointer-events="none">{tOrder.pax}p</text>
                                    {/if}
                                    {#if t.billTotal}
                                        <text x={tcx} y={tcy + 28} text-anchor="middle" dominant-baseline="middle" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#EA580C" pointer-events="none">{formatPeso(t.billTotal)}</text>
                                    {/if}
                                {:else}
                                    <text x={tcx} y={tcy + 8} text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="8" fill="#10b981" pointer-events="none">free</text>
                                {/if}
                            </g>
                        {/each}
                    </svg>
                </div>

                <!-- Active orders -->
                <div class="flex flex-col gap-1 sm:gap-1.5 border-t border-border bg-surface px-3 py-2 sm:px-4 sm:py-3">
                    <span class="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Active Orders</span>
                    {#if bOrders.length === 0}
                        <span class="text-[10px] sm:text-[11px] font-mono text-gray-400">No active orders</span>
                    {:else}
                        {#each bOrders.slice(0, 4) as order}
                            {@const oTable = allTables.find(t => t.id === order.tableId)}
                            <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                                <span class="truncate text-gray-700">
                                    {#if order.orderType === 'takeout'}
                                        {order.customerName ?? 'Walk-in'}
                                    {:else}
                                        {oTable?.label ?? '?'} · {order.packageName ?? ''} · {order.pax}p
                                    {/if}
                                </span>
                                <span class="ml-2 sm:ml-3 shrink-0 font-bold text-accent">{formatPeso(order.total)}</span>
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

{#if showLocationModal}
    <LocationSelectorModal onClose={() => (showLocationModal = false)} />
{/if}
