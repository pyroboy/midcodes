<script lang="ts">
    import type { Table, Order, FloorElement, ChairSide } from '$lib/types';
    import { formatPeso, formatCountdown, cn } from '$lib/utils';
    import { floorLayout } from '$lib/stores/floor-layout.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { getRefillCount } from '$lib/stores/pos.svelte';
    import { getPkgColors } from '$lib/stores/pos/utils';

    interface Props {
        mainTables: Table[];
        orders: Order[];
        selectedTableId: string | null;
        ontableclick: (table: Table) => void;
        tableRejectionMap?: Map<string, number>;
        activeKdsOrderIds?: Set<string>;
    }

    let { mainTables, orders, selectedTableId, ontableclick, tableRejectionMap = new Map(), activeKdsOrderIds = new Set() }: Props = $props();

    // Floor layout data
    const canvas = $derived(floorLayout.canvasFor(session.locationId));
    const floorElements = $derived(floorLayout.elementsFor(session.locationId));

    // Add padding around the canvas for chairs that extend outside tables
    const PAD = 30;
    const viewBox = $derived(`${-PAD} ${-PAD} ${canvas.width + PAD * 2} ${canvas.height + PAD * 2}`);

    // O(1) order lookup by order ID — keyed by order ID and resolved via table.currentOrderId
    // This prevents stale historical orders (pending_payment) from shadowing a freshly opened table.
    const orderMap = $derived(new Map(orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').map(o => [o.id, o])));

    // ─── Table rendering helpers ─────────────────────────────────────────────
    function tableFill(t: Table, order: Order | undefined): string {
        if (t.status === 'maintenance') return '#e5e7eb';
        if (t.status === 'available') return t.color ?? '#ffffff';
        if (t.status === 'billing') {
            if (order?.status === 'pending_payment') return '#ecfeff';
            return '#fff7ed';
        }
        if (order?.packageId) {
            const c = getPkgColors(order.packageId);
            if (c) return c.fill;
        }
        return '#ecfdf5';
    }

    function tableStroke(t: Table, order: Order | undefined): string {
        if (t.status === 'maintenance') return '#9ca3af';
        if (t.status === 'available') return '#d1d5db';
        if (t.status === 'billing') {
            if (order?.status === 'pending_payment') return '#06b6d4';
            return '#f97316';
        }
        if (t.status === 'critical') return '#ef4444';
        if (t.status === 'warning') return '#eab308';
        if (order?.packageId) {
            const c = getPkgColors(order.packageId);
            if (c) return c.stroke;
        }
        return '#10b981';
    }

    function timerColor(t: Table, order: Order | undefined): string {
        if (t.status === 'critical') return '#ef4444';
        if (t.status === 'warning') return '#eab308';
        if (t.status === 'billing') {
            if (order?.status === 'pending_payment') return '#06b6d4';
            return '#f97316';
        }
        return '#10b981';
    }

    function pkgLabel(packageId: string | undefined | null): string {
        if (packageId === 'pkg-pork') return 'PORK';
        if (packageId === 'pkg-beef') return 'BEEF';
        if (packageId === 'pkg-combo') return 'Beef+Pork';
        return '';
    }

    function pkgColor(packageId: string | undefined | null): string {
        return getPkgColors(packageId)?.label ?? '#6b7280';
    }

    // ─── Floor element colors ────────────────────────────────────────────────
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

    function elementEmoji(type: string): string {
        switch (type) {
            case 'entrance': return '\u{1F6AA}';
            case 'exit':     return '\u{1F6AA}';
            case 'bar':      return '\u{1F37A}';
            case 'kitchen':  return '\u{1F373}';
            case 'stairs':   return '\u{1FA9C}';
            default:         return '';
        }
    }

    // ─── Chair rendering ─────────────────────────────────────────────────────
    const CHAIR_THICKNESS = 14;
    const CHAIR_GAP = 6;

    function chairRects(table: Table, side: ChairSide, sideName: 'top' | 'bottom' | 'left' | 'right'): Array<{ x: number; y: number; w: number; h: number }> {
        if (side.type === 'none') return [];
        const W = table.width ?? 112;
        const H = table.height ?? 112;
        const isHoriz = sideName === 'top' || sideName === 'bottom';
        const spanW = isHoriz ? W : H;

        if (side.type === 'lounge') {
            const cw = isHoriz ? spanW - CHAIR_GAP * 2 : CHAIR_THICKNESS;
            const ch = isHoriz ? CHAIR_THICKNESS : spanW - CHAIR_GAP * 2;
            const cx = isHoriz ? table.x + CHAIR_GAP : (sideName === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
            const cy = isHoriz ? (sideName === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP) : table.y + CHAIR_GAP;
            return [{ x: cx, y: cy, w: cw, h: ch }];
        }
        if (side.type === 'individual') {
            const count = Math.max(1, side.count);
            const chairW = isHoriz ? Math.min(28, (spanW - CHAIR_GAP * (count + 1)) / count) : CHAIR_THICKNESS;
            const chairH = isHoriz ? CHAIR_THICKNESS : Math.min(28, (spanW - CHAIR_GAP * (count + 1)) / count);
            const totalSpan = isHoriz ? chairW * count + CHAIR_GAP * (count - 1) : chairH * count + CHAIR_GAP * (count - 1);
            const startOffset = isHoriz ? table.x + (W - totalSpan) / 2 : table.y + (H - totalSpan) / 2;
            return Array.from({ length: count }, (_, i) => {
                const step = isHoriz ? chairW + CHAIR_GAP : chairH + CHAIR_GAP;
                const x = isHoriz ? startOffset + i * step : (sideName === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
                const y = isHoriz ? (sideName === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP) : startOffset + i * step;
                return { x, y, w: chairW, h: chairH };
            });
        }
        if (side.type === 'diner') {
            const halfSpan = (spanW - CHAIR_GAP * 3) / 2;
            if (isHoriz) {
                const y = sideName === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP;
                return [
                    { x: table.x + CHAIR_GAP, y, w: halfSpan, h: CHAIR_THICKNESS },
                    { x: table.x + CHAIR_GAP * 2 + halfSpan, y, w: halfSpan, h: CHAIR_THICKNESS }
                ];
            } else {
                const x = sideName === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP;
                return [
                    { x, y: table.y + CHAIR_GAP, w: CHAIR_THICKNESS, h: halfSpan },
                    { x, y: table.y + CHAIR_GAP * 2 + halfSpan, w: CHAIR_THICKNESS, h: halfSpan }
                ];
            }
        }
        return [];
    }
</script>

<div class="flex-1 min-h-0 rounded-xl border border-border bg-surface overflow-hidden">
    <svg
        width="100%"
        height="100%"
        {viewBox}
        preserveAspectRatio="xMidYMid meet"
        class="block"
    >
        <!-- Canvas background -->
        <rect x="0" y="0" width={canvas.width} height={canvas.height} fill="#ffffff" rx="8" />
        <rect x="0" y="0" width={canvas.width} height={canvas.height} fill="none" stroke="#e5e7eb" stroke-width="1" rx="8" />

        <!-- Floor elements (walls, kitchen, entrance, etc.) — non-interactive backdrop -->
        {#each floorElements as el (el.id)}
            {@const elColor = elementColor(el.type, el.color)}
            {@const elOpacity = el.opacity ?? 0.7}
            {@const elCx = el.x + el.width / 2}
            {@const elCy = el.y + el.height / 2}
            {@const elRotation = el.rotation ?? 0}
            <g transform="rotate({elRotation} {elCx} {elCy})">
                {#if el.shape === 'rect'}
                    <rect x={el.x} y={el.y} width={el.width} height={el.height} fill="none" stroke={elColor} stroke-width="1.5" stroke-dasharray="6 3" opacity={elOpacity} rx="4" />
                {:else if el.shape === 'circle'}
                    <ellipse cx={elCx} cy={elCy} rx={el.width / 2} ry={el.height / 2} fill="none" stroke={elColor} stroke-width="1.5" stroke-dasharray="6 3" opacity={elOpacity} />
                {:else if el.shape === 'line'}
                    <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={elColor} stroke-width="2" stroke-dasharray="6 3" opacity={elOpacity} />
                {/if}
                {#if el.label}
                    <text
                        x={elCx} y={elCy}
                        text-anchor="middle" dominant-baseline="middle"
                        font-family="Inter, sans-serif" font-size="12" font-weight="600"
                        fill={elColor} pointer-events="none"
                    >{elementEmoji(el.type)} {el.label}</text>
                {/if}
            </g>
        {/each}

        <!-- Tables — interactive -->
        {#each mainTables as table (table.id)}
            {@const order = table.currentOrderId ? orderMap.get(table.currentOrderId) : undefined}
            {@const W = table.width ?? 112}
            {@const H = table.height ?? 112}
            {@const cx = table.x + W / 2}
            {@const cy = table.y + H / 2}
            {@const rx = table.borderRadius ?? 10}
            {@const rot = table.rotation ?? 0}
            {@const isSelected = selectedTableId === table.id}
            {@const isOccupied = table.status !== 'available' && table.status !== 'maintenance'}
            {@const activeItems = order?.items.filter(i => i.status !== 'cancelled' && i.tag !== 'PKG') ?? []}
            {@const unservedCount = activeItems.filter(i => i.status !== 'served').length}
            {@const isFullyServed = isOccupied && !!order && activeItems.length > 0 && unservedCount === 0}
            {@const hasActiveKds = !!order && activeKdsOrderIds.has(order.id)}
            {@const serveState = isFullyServed ? (hasActiveKds ? 'ready' : 'served') : null}
            {@const isAyce = !!order?.packageId}
            {@const refills = isAyce ? getRefillCount(order) : 0}
            {@const pkg = isOccupied ? pkgLabel(order?.packageId) : ''}
            {@const fill = tableFill(table, order)}
            {@const stroke = tableStroke(table, order)}

            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <g
                transform="rotate({rot} {cx} {cy})"
                onclick={() => ontableclick(table)}
                style="cursor: {table.status === 'maintenance' ? 'not-allowed' : 'pointer'};"
                role="button"
                tabindex="0"
                aria-label="Table {table.label}"
                pointer-events="none"
            >
                <!-- Isolated hit region — 2px inset from table bounds prevents edge-overlap with adjacent tables -->
                <rect
                    x={table.x + 2} y={table.y + 2}
                    width={W - 4} height={H - 4}
                    fill="transparent"
                    pointer-events="all"
                />
                <!-- Chairs -->
                {#if table.chairConfig}
                    {#each (['top','bottom','left','right'] as const) as sideName}
                        {@const side = table.chairConfig[sideName]}
                        {#if side && side.type !== 'none'}
                            {#each chairRects(table, side, sideName) as r}
                                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="4" fill={side.color ?? '#9ca3af'} opacity={side.opacity ?? 0.85} />
                            {/each}
                        {/if}
                    {/each}
                {/if}

                <!-- Table body -->
                <rect
                    x={table.x} y={table.y}
                    width={W} height={H}
                    {rx} {fill}
                    stroke={isSelected ? '#EA580C' : stroke}
                    stroke-width={isSelected ? 3 : (table.borderWidth ?? (table.status === 'available' ? 1 : 2))}
                    opacity={table.status === 'maintenance' ? 0.5 : (table.opacity ?? 1)}
                />

                <!-- Selection ring -->
                {#if isSelected}
                    <rect
                        x={table.x - 6} y={table.y - 6}
                        width={W + 12} height={H + 12}
                        rx={rx + 6}
                        fill="none" stroke="#EA580C" stroke-width="4" opacity="0.9"
                    />
                {/if}

                <!-- Maintenance badge -->
                {#if table.status === 'maintenance'}
                    <text
                        x={cx} y={cy}
                        text-anchor="middle" dominant-baseline="middle"
                        font-size="20" pointer-events="none"
                    >&#x1F527;</text>
                    <text
                        x={cx} y={cy + 18}
                        text-anchor="middle" dominant-baseline="middle"
                        font-family="Inter, sans-serif" font-size="12" font-weight="700"
                        fill="#6b7280" pointer-events="none"
                    >{table.label}</text>
                {:else}
                    <!-- Package badge (top-left) -->
                    {#if pkg}
                        <rect x={table.x + 4} y={table.y + 4} width={pkg.length * 7 + 8} height="16" rx="8" fill={pkgColor(order?.packageId)} opacity="0.15" />
                        <text
                            x={table.x + 4 + (pkg.length * 7 + 8) / 2} y={table.y + 12}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="12" font-weight="800"
                            fill={pkgColor(order?.packageId)} pointer-events="none"
                        >{pkg}</text>
                    {/if}

                    <!-- Timer badge (top-right) — short format matching sidebar -->
                    {#if isOccupied && table.elapsedSeconds !== null}
                        {@const mins = Math.floor((table.elapsedSeconds ?? 0) / 60)}
                        {@const timerStr = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}m` : ''}`}
                        {@const tColor = timerColor(table, order)}
                        <text
                            x={table.x + W - 6} y={table.y + 14}
                            text-anchor="end" dominant-baseline="middle"
                            font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700"
                            fill={tColor} pointer-events="none"
                        >{timerStr}</text>
                    {/if}

                    <!-- Table label (center) -->
                    <text
                        x={cx} y={cy - (isOccupied ? 5 : 0)}
                        text-anchor="middle" dominant-baseline="middle"
                        font-family="Inter, sans-serif" font-size="16" font-weight="800"
                        fill="#111827" pointer-events="none"
                    >{table.label}</text>

                    <!-- Billing Badge or Pax (below label) -->
                    {#if table.status === 'billing'}
                        <rect x={cx - 32} y={cy + 5} width="64" height="20" rx="10" fill="#f97316">
                            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
                        </rect>
                        <text
                            x={cx} y={cy + 15}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="11" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >BILLING</text>
                    {:else if isOccupied}
                        <text
                            x={cx} y={cy + 10}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="12" font-weight="600"
                            fill="#6b7280" pointer-events="none"
                        >{order?.pax ?? table.capacity} pax</text>
                    {:else}
                        <text
                            x={cx} y={cy + 12}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="12"
                            fill="#9ca3af" pointer-events="none"
                        >cap {table.capacity}</text>
                    {/if}

                    <!-- Status badge (left-aligned, above bill total) -->
                    {#if isOccupied && !!order && unservedCount > 0}
                        {@const badgeLabel = `${unservedCount} item${unservedCount !== 1 ? 's' : ''}`}
                        {@const badgeW = badgeLabel.length * 6.5 + 10}
                        <title>{unservedCount} unserved item{unservedCount !== 1 ? 's' : ''}</title>
                        <rect x={table.x + 4} y={table.y + H - 32} width={badgeW} height="14" rx="7" fill="#f97316" opacity="0.9">
                            <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.2s" repeatCount="indefinite" />
                        </rect>
                        <text
                            x={table.x + 4 + badgeW / 2} y={table.y + H - 24}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="9" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >{badgeLabel}</text>
                    {:else if serveState === 'ready'}
                        {@const readyLabel = '✓ READY'}
                        {@const readyW = readyLabel.length * 7 + 10}
                        <rect x={table.x + 4} y={table.y + H - 32} width={readyW} height="14" rx="7" fill="#f59e0b" opacity="0.9">
                            <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.2s" repeatCount="indefinite" />
                        </rect>
                        <text
                            x={table.x + 4 + readyW / 2} y={table.y + H - 24}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="9" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >{readyLabel}</text>
                    {:else if serveState === 'served'}
                        {@const servedLabel = '✓ SERVED'}
                        {@const servedW = servedLabel.length * 7 + 10}
                        <rect x={table.x + 4} y={table.y + H - 32} width={servedW} height="14" rx="7" fill="#10b981" opacity="0.9" />
                        <text
                            x={table.x + 4 + servedW / 2} y={table.y + H - 24}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="9" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >{servedLabel}</text>
                    {/if}

                    <!-- Bill total (bottom-left, below badge) -->
                    {#if table.billTotal}
                        <text
                            x={table.x + 8} y={table.y + H - 8}
                            text-anchor="start" dominant-baseline="middle"
                            font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700"
                            fill="#111827" pointer-events="none"
                        >{formatPeso(table.billTotal)}</text>
                    {/if}

                    <!-- Refill count badge (bottom-right) — AYCE only -->
                    {#if isAyce && refills > 0}
                        <rect x={table.x + W - 26} y={table.y + H - 18} width="22" height="14" rx="7" fill="#8b5cf6" opacity="0.9">
                            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.4s" repeatCount="indefinite" />
                        </rect>
                        <text
                            x={table.x + W - 15} y={table.y + H - 10}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="12" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >R{refills}</text>
                    {/if}

                    <!-- Kitchen rejection alert badge (top-right corner) -->
                    {#if tableRejectionMap.get(table.id)}
                        {@const rejCount = tableRejectionMap.get(table.id) ?? 0}
                        <rect x={table.x + W - 28} y={table.y - 8} width="32" height="16" rx="8" fill="#ef4444">
                            <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
                        </rect>
                        <text
                            x={table.x + W - 12} y={table.y + 1}
                            text-anchor="middle" dominant-baseline="middle"
                            font-family="Inter, sans-serif" font-size="12" font-weight="800"
                            fill="#ffffff" pointer-events="none"
                        >⚠ {rejCount}</text>
                    {/if}

                    <!-- Critical pulse ring -->
                    {#if table.status === 'critical'}
                        <rect
                            x={table.x - 2} y={table.y - 2}
                            width={W + 4} height={H + 4}
                            rx={rx + 2}
                            fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6"
                        >
                            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
                        </rect>
                    {/if}
                {/if}
            </g>
        {/each}
    </svg>
</div>
